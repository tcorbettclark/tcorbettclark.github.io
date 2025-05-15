#!/usr/bin/env -S DYLD_LIBRARY_PATH=/usr/local/lib uv run --script

# /// script
# requires-python = ">=3.12"
# dependencies = [
#     "aiohttp",
#     "click",
#     "jinja2",
#     "markdown-it-py",
#     "mdit-py-plugins",
#     "toml",
#     "user-agents",
#     "utidylib",
#     "watchfiles",
# ]
# ///

import asyncio
import base64
import glob
import hashlib
import logging
import os
import pathlib
import re
import shutil

import aiohttp
import aiohttp.abc
import aiohttp.web
import click
import jinja2
import markdown_it
import toml
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


def log(message, *args, level=logging.INFO):
    # Make all pathlib.Path args relative to current working directory.
    cwd = os.getcwd()
    tmp = [
        str(pathlib.Path(arg).relative_to(cwd))
        if isinstance(arg, pathlib.Path)
        else arg
        for arg in args
    ]
    logger.log(level, message.format(*tmp))


def abort(message, *args):
    log(message, *args, level=logging.ERROR)
    log("Aborting!", level=logging.ERROR)
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
        self.output_dir = output_dir
        self.content_dir = content_dir
        self.working_file_regex = re.compile(working_file_regex)
        self.template_extensions = template_extensions
        log(f"Working files match regex: {working_file_regex}")
        log(
            "Template files have extension(s): {}",
            ", ".join(self.template_extensions),
        )

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
        log(f"Using content from: {self.content_dir} ({{}})", self.content_dir)
        if os.path.exists(self.output_dir):
            shutil.rmtree(self.output_dir)
        shutil.copytree(self.content_dir, self.output_dir)
        log(
            f"Cloned content into fresh output directory: {self.output_dir} ({{}})",
            self.output_dir,
        )

    def _add_template_data(self, env):
        for filename in glob.glob(
            "**/*.toml", root_dir=self.output_dir, recursive=True
        ):
            filename = self.output_dir / filename
            log("Reading template data from: {}", filename)
            data = toml.load(filename)
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
                self.output_dir / pathlib.Path(context.name).parent / value
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
            log("Converted markdown from: {}", markdown_filename)
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
                filename = self.output_dir / value.relative_to("/")
            else:
                # Relative, so use directory of calling template file.
                filename = (
                    self.output_dir / pathlib.Path(context.name).parent / value
                )
            return base64.b64encode(
                algorithms[algorithm](filename.read_bytes()).digest()
            ).decode()

        env.filters["sha"] = make_sha

    def render_templates(self):
        loader = jinja2.FileSystemLoader(self.output_dir)
        env = _RelativeEnvironment(loader=loader)
        self._add_template_data(env)
        self._add_markdown_filter(env)
        self._add_sha_filter(env)
        template_filenames = env.list_templates(
            filter_func=self._is_template_filename
        )
        for template_filename in template_filenames:
            template = env.get_template(template_filename)
            p = self.output_dir / template_filename
            with open(p, "w") as f:
                f.write(template.render())
            log("Rendered template: {}", p)

    def remove_working_files(self):
        n_files = 0
        n_dirs = 0
        for root, dirs, files in self.output_dir.walk(top_down=False):
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
        log(
            f"Removed {n_files} working files and {n_dirs} empty directories from output directory"
        )

    def tidy_html_files(self):
        try:
            import tidy
        except Exception as e:
            log(
                "Unable to load libtidy (html-tidy). Check your library paths "
                "LD_LIBRARY_PATH / DYLD_LIBRARY_PATH"
            )
            log(f"  (Exception: {str(e)})")
            return
        for root, dirs, files in self.output_dir.walk():
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
                            log(f"Html-tidy found problem in {{}}: {e}", p)
                        output_filename = p.with_suffix(".tidy.html")
                        log(
                            "Not updating file, but see tidy version in {}",
                            output_filename,
                        )
                    else:
                        output_filename = p
                        log("Html-tidy ok: {}", p)
                    with open(output_filename, "w") as fp:
                        fp.write(doc.gettext())

    def rebuild(self):
        self.create_fresh_output_directory()
        self.render_templates()
        self.remove_working_files()
        self.tidy_html_files()
        log("Rebuilt all files in: {}", self.output_dir)


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
                f"Completed request from client {browser} on {device}: {request.path}"
            )
        except KeyError:
            # Because "User-Agent" was not provided in the request header.
            log(f"Completed request from client: {request.path}")


class Server:
    def __init__(self, host, port, directory):
        self.host = host
        self.port = port
        self.directory = directory
        self.web_sockets = set()

    async def signal_hot_reloaders(self):
        log(f"Signalling to {len(self.web_sockets)} hot reloaders")
        for ws in list(self.web_sockets):
            await ws.send_str("reload")

    async def _close_hot_reloaders(self):
        log(f"Closing {len(self.web_sockets)} hot reloaders")
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
            log("New hot reloader connected")
            try:
                async for msg in ws:
                    if msg.type == aiohttp.WSMsgType.TEXT:
                        if msg.data != "keep-alive-ping":
                            log(
                                f"Received unexpected message over hot reloader websocket: {msg.data}"
                            )
            finally:
                log("Hot reloader closed")
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
        site = aiohttp.web.TCPSite(self._runner, self.host, self.port)
        log(f"Starting local server on http://{self.host}:{self.port}")
        log("Serving files from: {}", self.directory)
        await site.start()

    async def stop(self):
        log("Stopping server")
        await self._close_hot_reloaders()
        await self._runner.cleanup()


class Watcher:
    def __init__(self, directory):
        self.directory = directory
        self._change_event = asyncio.Event()

    async def _start(self):
        log("Watching for changes in: {}", self.directory)
        async for changes in watchfiles.awatch(self.directory):
            for change, filename in list(changes):
                filename = pathlib.Path(filename)
                if change == watchfiles.Change.added:
                    log("Noticed file added: {}", filename)
                elif change == watchfiles.Change.deleted:
                    log("Noticed file deleted: {}", filename)
                elif change == watchfiles.Change.modified:
                    log("Noticed file modified: {}", filename)
            self._change_event.set()

    async def start(self):
        return asyncio.create_task(self._start())

    async def wait_for_change(self):
        await self._change_event.wait()
        self._change_event.clear()


async def run(
    content_dir, output_dir, working_file_regex, template_extensions, host, port
):
    content_dir = pathlib.Path(content_dir).absolute()
    output_dir = pathlib.Path(output_dir).absolute()

    builder = Builder(
        content_dir, output_dir, working_file_regex, template_extensions
    )
    watcher = Watcher(content_dir)
    server = Server(host, port, output_dir)

    builder.rebuild()
    await watcher.start()
    await server.start()
    try:
        while True:
            await watcher.wait_for_change()
            await asyncio.sleep(
                0.1
            )  # Hack to wait for editors tracking of file changes e.g. for git
            builder.rebuild()
            await server.signal_hot_reloaders()
    except asyncio.CancelledError:
        # asyncio raises CancelledError on ctrl-c signal
        # (see https://docs.python.org/3/library/asyncio-runner.html#handling-keyboard-interruption).
        # We take responsibility for cleanup and swallow the exception.
        await server.stop()
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
def main(
    content_dir,
    output_dir,
    working_file_regex,
    template_extensions,
    host,
    port,
):
    """AWG = Agnostic Website Generator.

    CONTENT_DIR is the directory of source web contents. It is never altered.

    OUTPUT_DIR is the new directory into which the website will be built. It is destroyed before every build.

    """
    asyncio.run(
        run(
            content_dir,
            output_dir,
            working_file_regex,
            template_extensions,
            host,
            port,
        )
    )


if __name__ == "__main__":
    main(max_content_width=120)
