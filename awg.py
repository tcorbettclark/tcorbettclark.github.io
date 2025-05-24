#!/usr/bin/env -S DYLD_LIBRARY_PATH=/usr/local/lib uv run --script

# /// script
# requires-python = ">=3.13"
# dependencies = [
#     "aiohttp",
#     "click",
#     "jinja2",
#     "markdown-it-py",
#     "mdit-py-plugins",
#     "user-agents",
#     "utidylib",
#     "watchfiles",
# ]
# ///

import asyncio
import base64
import filecmp
import glob
import hashlib
import logging
import os
import pathlib
import re
import shutil
import ssl
import tempfile

import aiohttp
import aiohttp.abc
import aiohttp.web
import click
import jinja2
import markdown_it
import tomllib
import user_agents
import watchfiles
from mdit_py_plugins.attrs import (
    attrs_block_plugin as markdown_attrs_block_plugin,
)
from mdit_py_plugins.attrs import attrs_plugin as markdown_attrs_plugin
from mdit_py_plugins.deflist import deflist_plugin as markdown_deflist_plugin
from mdit_py_plugins.dollarmath import dollarmath_plugin as markdown_math_plugin
from mdit_py_plugins.footnote import footnote_plugin as markdown_footnote_plugin

# Configure Logging.
logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO, format="%(message)s")
logging.getLogger("watchfiles.main").setLevel(
    logging.WARNING
)  # Stop watchfiles from logging file changes, as we do it instead.


def log(message, *, level=logging.INFO, colour=None):
    if colour:
        message = click.style(message, fg=colour)
    logger.log(msg=message, level=level)


def abort(message):
    log(message, level=logging.ERROR, colour="red")
    log("Aborting!", level=logging.ERROR, colour="red")
    quit()


class _RelativeEnvironment(jinja2.Environment):
    """Make template loading relative to the directory of the source filename.

    See: https://jinja.palletsprojects.com/en/stable/api/#jinja2.Environment.join_path
    """

    def join_path(self, template, parent):
        template_to_load = template
        from_template = parent  # Relative to FileSystemLoader's base directory.
        return os.path.normpath(
            os.path.join(os.path.dirname(from_template), template_to_load)
        )


class Builder:
    def __init__(
        self, content_dir, output_dir, working_file_regex, template_extensions
    ):
        self.content_dir = content_dir
        self.working_dir = pathlib.Path(tempfile.mkdtemp())
        self.output_dir = output_dir
        self.working_file_regex = re.compile(working_file_regex)
        self.template_extensions = template_extensions
        self._log(f"Working files match regex: {working_file_regex}")
        self._log(
            "Template files have extension(s): "
            + ", ".join(self.template_extensions)
        )

    def _log(self, message, *paths):
        tmp = [str(p.relative_to(self.working_dir)) for p in paths]
        log(message.format(*tmp), colour="green")

    def _is_working_filename(self, filename):
        return (
            self.working_file_regex.match(pathlib.Path(filename).name)
            is not None
        )

    def _is_template_filename(self, filename):
        # A template file has a non-working filename with a template extension.
        p = pathlib.Path(filename)
        return (
            p.suffix in self.template_extensions
            and not self._is_working_filename(p)
        )

    def create_fresh_output_directory(self):
        self._log(f"Using content from: {self.content_dir}")
        shutil.rmtree(self.working_dir)
        shutil.copytree(self.content_dir, self.working_dir)
        self._log("Cloned content into fresh working directory")

    def _add_template_data(self, env):
        for filename in glob.glob(
            "**/*.toml", root_dir=self.working_dir, recursive=True
        ):
            filename = self.working_dir / filename
            self._log("Reading template data from: {}", filename)
            with filename.open("rb") as f:
                data = tomllib.load(f)
            overlap = set(data.keys()).intersection(env.globals.keys())
            if overlap:
                abort(
                    f"Duplicated key(s) in template data: {', '.join(overlap)}"
                )
            env.globals.update(data)

    def _add_markdown_filter(self, env):
        @jinja2.pass_context
        def convert_markdown(context, value):
            # Always relative to template file.
            markdown_filename = (
                self.working_dir / pathlib.Path(context.name).parent / value
            )
            md = markdown_it.MarkdownIt(
                "commonmark",
                {"typographer": True},
            )
            md.use(markdown_footnote_plugin)
            md.use(markdown_math_plugin)
            md.use(markdown_attrs_plugin, spans=True)
            md.use(markdown_attrs_block_plugin)
            md.use(markdown_deflist_plugin)
            md.enable(["replacements", "smartquotes", "table"])
            self._log("Converted markdown from: {}", markdown_filename)
            with markdown_filename.open() as f:
                return md.render(f.read())

        env.filters["markdown"] = convert_markdown

    def _add_sha_filter(self, env):
        algorithms = {
            "256": hashlib.sha256,
            "384": hashlib.sha384,
            "512": hashlib.sha512,
        }

        @jinja2.pass_context
        def make_sha(context, value, algorithm="384"):
            assert algorithm in algorithms
            value = pathlib.Path(value)
            if value.is_absolute():
                # Absolute, so combine with output_dir.
                filename = self.working_dir / value.relative_to("/")
            else:
                # Relative, so use directory of calling template file.
                filename = (
                    self.working_dir / pathlib.Path(context.name).parent / value
                )
            return base64.b64encode(
                algorithms[algorithm](filename.read_bytes()).digest()
            ).decode()

        env.filters["sha"] = make_sha

    def render_templates(self):
        loader = jinja2.FileSystemLoader(self.working_dir)
        env = _RelativeEnvironment(loader=loader)
        self._add_template_data(env)
        self._add_markdown_filter(env)
        self._add_sha_filter(env)
        template_filenames = env.list_templates(
            filter_func=self._is_template_filename
        )
        for template_filename in template_filenames:
            template = env.get_template(template_filename)
            p = self.working_dir / template_filename
            with open(p, "w") as f:
                f.write(template.render())
            self._log("Rendered template: {}", p)

    def remove_working_files(self):
        n_files = 0
        n_dirs = 0
        for root, dirs, files in self.working_dir.walk(top_down=False):
            for name in files:
                p = root / name
                if self._is_working_filename(p):
                    n_files += 1
                    p.unlink()
            for name in dirs:
                p = root / name
                if len(list(p.iterdir())) == 0:
                    n_dirs += 1
                    os.rmdir(p)
        self._log(
            f"Removed {n_files} working files and {n_dirs} empty directories from output directory"
        )

    def tidy_html_files(self):
        try:
            import tidy
        except Exception as e:
            log(
                "Unable to load libtidy (html-tidy). Check your library paths "
                "LD_LIBRARY_PATH / DYLD_LIBRARY_PATH",
                colour="red",
            )
            log(f"  (Exception: {str(e)})", colour="red")
            return
        for root, dirs, files in self.working_dir.walk():
            for name in files:
                p = root / name
                if p.suffix == ".html":
                    doc = tidy.parse(
                        str(p),
                        indent="yes",
                        wrap=120,
                        drop_empty_elements="no",
                        wrap_sections="no",
                    )
                    errors = doc.get_errors()
                    if errors:
                        for e in errors:
                            self._log(
                                f"Html-tidy found problem in {{}}: {e}", p
                            )
                        output_filename = p.with_suffix(".tidy.html")
                        self._log(
                            "Not updating file, but see tidy version in: {}",
                            output_filename,
                        )
                    else:
                        output_filename = p
                        self._log("Html-tidy ok: {}", p)
                    with open(output_filename, "w") as fp:
                        fp.write(doc.gettext())

    def publish_to_output(self):
        def publish(dcmp, working_path):
            assert len(dcmp.common_funny) == 0  # TODO
            assert len(dcmp.funny_files) == 0  # TODO
            output_path = self.output_dir / working_path.relative_to(
                self.working_dir
            )
            for name in dcmp.left_only:
                wp, op = working_path / name, output_path / name
                if wp.is_dir():
                    op.mkdir()
                elif wp.is_file():
                    self._log("Adding new file: {}", wp)
                    shutil.copyfile(wp, op)

            for name in dcmp.right_only:
                wp, op = working_path / name, output_path / name
                if op.is_dir():
                    if op.exists():
                        shutil.rmtree(op)
                elif op.is_file():
                    self._log("Removing file: {}", wp)
                    if op.exists():
                        op.unlink()

            for name in dcmp.diff_files:
                wp, op = working_path / name, output_path / name
                self._log("Modifying existing file: {}", wp)
                shutil.copyfile(wp, op)

            n_deltas = (
                len(dcmp.left_only)
                + len(dcmp.right_only)
                + len(dcmp.diff_files)
            )
            for name, sub_dcmp in dcmp.subdirs.items():
                n_deltas += publish(sub_dcmp, working_path / name)
            return n_deltas

        n_deltas = publish(
            filecmp.dircmp(
                self.working_dir,
                self.output_dir,
                ignore=filecmp.DEFAULT_IGNORES + [".DS_Store"],
            ),
            self.working_dir,
        )
        if n_deltas > 0:
            self._log(
                f"Total number of changes to files and directories: {n_deltas}"
            )
            self._log(f"Updated: {self.output_dir}")
        else:
            self._log(f"No changes required to: {self.output_dir}")
        return n_deltas > 0

    def rebuild(self):
        self.create_fresh_output_directory()
        self.render_templates()
        self.remove_working_files()
        self.tidy_html_files()
        return self.publish_to_output()

    def cleanup(self):
        self._log("Removing tempory working directory")
        shutil.rmtree(self.working_dir)


class _ServerAccessLogger(aiohttp.abc.AbstractAccessLogger):
    # Use a hand-crafted aiohttp access logger to better control the detail.
    # In particular, to unpack the User-Agent string if present.

    def log(self, request, response, time):
        try:
            ua = user_agents.parse(request.headers["User-Agent"])
            browser = ua.browser.family
            version = ua.browser.version_string
            if version:
                browser += "-" + version
            device = ua.device.family
            log(
                f"Completed request from client {browser} on {device}: {request.path}",
                colour="yellow",
            )
        except KeyError:
            # Because "User-Agent" was not provided in the request header.
            log(
                f"Completed request from client: {request.path}",
                colour="yellow",
            )


class Server:
    def __init__(self, directory, host, port, certfile=None, keyfile=None):
        self.directory = directory
        self.host = host
        self.port = port
        self.certfile = certfile
        self.keyfile = keyfile
        self.web_sockets = set()

    def _log(self, message):
        log(message, colour="blue")

    async def signal_hot_reloaders(self):
        self._log(f"Signalling to {len(self.web_sockets)} hot reloaders")
        for ws in list(self.web_sockets):
            await ws.send_str("reload")

    async def _close_hot_reloaders(self):
        self._log(f"Closing {len(self.web_sockets)} hot reloaders")
        for ws in list(self.web_sockets):
            await ws.close()

    def _add_permissive_cores(self, app):
        # Agree to serving up content to any origin.
        # Mostly for edge-case testing, e.g. serving on localhost and accessing files on 127.0.0.1.
        async def permissive_cors_for_testing(request, response):
            response.headers["Access-Control-Allow-Origin"] = "*"

        app.on_response_prepare.append(permissive_cors_for_testing)

    async def start(self):
        async def websocket_handler(request):
            ws = aiohttp.web.WebSocketResponse()
            self.web_sockets.add(ws)
            await ws.prepare(request)
            self._log("New hot reloader connected")
            try:
                async for msg in ws:
                    if msg.type == aiohttp.WSMsgType.TEXT:
                        if msg.data != "keep-alive-ping":
                            self._log(
                                f"Received unexpected message over hot reloader websocket: {msg.data}"
                            )
            finally:
                self._log("Hot reloader closed")
                await ws.close()
                self.web_sockets.remove(ws)
            return ws

        app = aiohttp.web.Application()
        app.router.add_static("/", self.directory, show_index=True)
        self._add_permissive_cores(app)
        app.router.add_get("/ws", websocket_handler)
        self._runner = aiohttp.web.AppRunner(
            app,
            access_log_class=_ServerAccessLogger,
            access_log=logger,
            handle_signals=False,
            handler_cancellation=True,
        )
        await self._runner.setup()
        ssl_context = None
        if self.certfile and self.keyfile:
            self._log(f"Using SSL certfile: {self.certfile}")
            self._log(f"Using SSL keyfile: {self.keyfile}")
            ssl_context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
            ssl_context.load_cert_chain(self.certfile, self.keyfile)
            self._log(
                f"Starting local server on https://{self.host}:{self.port}"
            )
        else:
            self._log(
                f"Starting local server on http://{self.host}:{self.port}"
            )
        site = aiohttp.web.TCPSite(
            self._runner,
            host=self.host,
            port=self.port,
            ssl_context=ssl_context,
        )
        self._log(f"Serving files from: {self.directory}")
        await site.start()

    async def stop(self):
        self._log("Stopping server")
        await self._close_hot_reloaders()
        await self._runner.cleanup()


class Watcher:
    def __init__(self, directory):
        self.directory = directory
        self._change_event = asyncio.Event()

    def _log(self, message, *paths):
        tmp = [str(pathlib.Path(p).relative_to(self.directory)) for p in paths]
        log(message.format(*tmp), colour="magenta")

    async def _start(self):
        self._log(f"Watching for changes in: {self.directory}")
        async for changes in watchfiles.awatch(self.directory):
            for change, filename in list(changes):
                filename = pathlib.Path(filename)
                if change == watchfiles.Change.added:
                    self._log("Noticed file added: {}", filename)
                elif change == watchfiles.Change.deleted:
                    self._log("Noticed file deleted: {}", filename)
                elif change == watchfiles.Change.modified:
                    self._log("Noticed file modified: {}", filename)
            self._change_event.set()

    async def start(self):
        return asyncio.create_task(self._start())

    async def stop(self):
        pass  # Nothing needs to be done, but keep for symmetry.

    async def wait_for_change(self):
        await self._change_event.wait()
        self._change_event.clear()


async def run(
    content_dir,
    output_dir,
    working_file_regex,
    template_extensions,
    host,
    port,
    certfile,
    keyfile,
):
    content_dir = pathlib.Path(content_dir).absolute()
    output_dir = pathlib.Path(output_dir).absolute()

    builder = Builder(
        content_dir, output_dir, working_file_regex, template_extensions
    )
    watcher = Watcher(content_dir)
    server = Server(output_dir, host, port, certfile, keyfile)

    builder.rebuild()
    await watcher.start()
    await server.start()
    try:
        while True:
            await watcher.wait_for_change()
            if builder.rebuild():
                await server.signal_hot_reloaders()
    except asyncio.CancelledError:
        # asyncio raises CancelledError on ctrl-c signal
        # (see https://docs.python.org/3/library/asyncio-runner.html#handling-keyboard-interruption).
        # We take responsibility for cleanup and swallow the exception.
        await watcher.stop()
        await server.stop()
        builder.cleanup()
        log("Bye")


@click.command()
@click.argument("content_dir")
@click.argument("output_dir")
@click.option(
    "-w",
    "--working-file-regex",
    default=r"\_.*",
    show_default=True,
    help="Regex to match working files.",
)
@click.option(
    "-t",
    "--template-extension",
    "template_extensions",
    default=[".html", ".xml", ".txt"],
    show_default=True,
    multiple=True,
    help="Extension identifying files to template with Jinja",
)
@click.option(
    "-h",
    "--host",
    default="localhost",
    show_default=True,
    help="Serve on this host",
)
@click.option(
    "-p",
    "--port",
    default=8000,
    show_default=True,
    help="Serve on this port",
)
@click.option(
    "--certfile",
    default=None,
    help="Filename containing SSL certfile (needed for HTTPS)",
)
@click.option(
    "--keyfile",
    default=None,
    help="Filename containing SSL keyfile (needed for HTTPS)",
)
def main(
    content_dir,
    output_dir,
    working_file_regex,
    template_extensions,
    host,
    port,
    certfile,
    keyfile,
):
    """AWG = Agnostic Website Generator.

    CONTENT_DIR is the directory of source web contents. It is never altered.

    OUTPUT_DIR is the new directory into which the website will be built. It is destroyed before every build.

    The optional certfile and keyfile will switch to serving up over HTTPS. Generate e.g. using the mkcert tool.

    """
    asyncio.run(
        run(
            content_dir,
            output_dir,
            working_file_regex,
            template_extensions,
            host,
            port,
            certfile,
            keyfile,
        )
    )


if __name__ == "__main__":
    main(max_content_width=120)
