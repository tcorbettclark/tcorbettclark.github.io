# Introduction

Assuming a willingness to understand the necessary web technologies, why not create static websites _by hand_? The main problems are around inefficient repetition and cumbersome syntax. For example,

- copy-and-paste maintenance of the same content e.g. in headers and footers;
- copy-and-paste maintenance of the same formatting/styling tags around repeated lists of things;
- using a verbose syntax like HTML when wanting to focus purely on content.

These pain points can be ameliorated by using a markup language (like [markdown](https://commonmark.org)), templating (e.g. with [Jinja](https://jinja.palletsprojects.com)), and writing data/metadata in a data-oriented syntax (such as [TOML](https://toml.io/)).

## Features / anti-features

My tool makes it easier to create a static website of the usual HTML, CSS, and Javascript files (plus a few others such as the manifest.json, robots.txt, and sitemap.xml). **It is a scaffolding tool with no fundamental opinion about these web files**.

The essential features are:

1. Converting Markdown into HTML (to allow content to be written more easily).
1. Templating using Jinja (most obviously to make it easier to produce repetative HTML).
1. Reading template data from TOML files (to pass to Jinja).
1. Validating and prettifying all final HTML by running through [HTML tidy](http://html-tidy.org) (if available).

Then, to create a fast iterative loop:

5. Serving up content on a local http webserver (for review during development).
6. Watching for source file changes and rebuilding automatically.
7. Notifying browser(s) of new builds (e.g. to trigger a "hot reload").

Note the absence of themes, plugins, blog posts, tags, articles, Atom or RSS feeds etc. Many of these are easy to achieve using the tool's machinery without explicit native support.

## Zero config

With the exception of a few command line options to tell the tool where to find the content and put the output, **there is no configuration**. There are no required files or directory structures, and so (degenerately) **the tool will run fine on an empty directory**. There is a simple `example/` content directory in the [GitHub repository](https://github.com/tcorbettclark/tcorbettclark.github.io) to demo some of the functionality and provide a learning sandpit to play in.

## Subtractive approach

Instead of copying and creating files and directories from various sources and processes, the tool takes a "subtractive" approach. The build process starts by cloning a given content directory into a new output directory. After running the build process, all "working files" are deleted from this output directory. By default,
- _working files_ are identified as filenames starting with an underscore, and
- _template files_ are identified as *not* being a working file and having an extension of `.html`, `.xml`, and `.txt`.

In addition to removing mystery around how an output is generated, this approach allows maintenance effort to be reduced by grouping related content. For example, all HTML, Markdown, template data, Javascript, etc relating to a particular page or section of the site **can be kept together in the same directory**. This localisation of content means that after changes, removal, or replacement, the chances of things being left behind afterwards are much reduced.

Note however that due to the tool's lack of opinion in this regard, content can still be grouped by type in the traditional fashion if desired (all the javascript in one directory, all the CSS in another, etc). Or a mixed by-purpose/by-type strategy used. Regardless, the files and structure is all explicit and visible.

## Templating and template data

To provide templating, AWG uses [Jinja](https://jinja.palletsprojects.com), a hugely popular and mature templating library.

Jinja uses absolute file paths, which makes it harder to maintain source directory structure (e.g. renaming directories), and discourages "by-purpose" organisation of the files. Hence AWG overrides the Jinja environment so that including or extending other files is *relative to the loading template file*. For example, here is a consistent location of 3 files:

```html
<!-- in /a/b/c.html -->
{% extends "../_foo.html" %}
{% include "_bar.html" %}

<!-- /a/_foo.html -->
...some extendable template...

<!-- /a/b/_bar.html -->
...some includable content...
```

Note that both `_foo.html` and `_bar.html` are working files (because of the leading underscore), and therefore won't be run through Jinja directly. Anything included by a Jinja template should almost certainly be a working file.

Templating can make use of data, for example to generate lists of things, pull out into one place something which is used in multiple places, or just self-document the meaning of something better.

AWG reads data from all TOML files (`*.toml`), combining everything into a single namespace. This allows the data to be kept near to where it is used. Although tempting to have separate namespaces, doing so from a hierarchy of such files (including multiple files in the same directory) seems overly complex and could even *increase* the maintenance overhead. Using meaningful names and having the tool check for name collisions is both practical and easy to understand.

## Markdown

There are many flavours of Markdown. I have chosen to use [CommonMark](https://commonmark.org), implemented using the [markdown-it-py](https://markdown-it-py.readthedocs.io) Python library.

To allow markdown to be incorporated into the HTML, AWG adds a "filter" to the Jinja environment. Although an abuse of filters, it is easy to implement and convenient to use. The input to the filter is the name of the file which should be converted from Markdown into HTML and included in the document at that point. For example:

 ```html
 {{ "<filename>.md" | markdown() }}
 ```

As with Jinja includes/extends (see above), the path to the file is relative to the calling template.

AWG also includes some useful plugins to the markdown parser.

From the [built-in markdown-it-py extensions](https://markdown-it-py.readthedocs.io):
- `replacements` - makes it easy to include (c) by writing \(c\) etc
- `smartquotes` - to make better looking "quotation marks" (as opposed to \"these\")
- `table` - to support tables
- (but not `linkify`, so links need to be made explictly)

And from [mdit-py-plugins](https://mdit-py-plugins.readthedocs.io):
- `attrs` and `attrs_block` - to support CSS attributes, including on spanned text e.g. to allow [Smallcaps]{.smallcaps}
- `deflist` - for definition lists
- `footnotes` - to render footnotes like this[^1]
- `math` - so maths can be written in \$ or \$\$ marks and converted into sensible HTML tags with escaped content

[^1]: Demo footnote.

## Computing hashes e.g. for SRI and CSP

[Subresource Integrity (SRI)](https://developer.mozilla.org/en-US/docs/Web/Security/Subresource_Integrity) and [Content Security Policy (CSP)](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CSP) both use file hashes. To make it easier to maintain these hashes, AWG adds a Jinja filter `sha("256"|"384"|"512")` (with a default of `"384"`) to create SHA hashes of local files. For example, to create SHA384 integrity attributes for SRI,

```html
<script defer src="/render-maths.js" integrity="sha384-{{ '/render-maths.js' | sha() }}"></script>
```

## Summary: the AWG content interface

The AWG tool recognises 3 types of file:

Working files
~ Files used only during the build, and will be deleted from the output.
~ By default, have filenames starting with an underscore (regex `\_.*`).

Template files
~ Files which will be run through Jinja for templating, replacing the original file.
~ Other files may contain templating markup, but must be included from a template file to be templated.
~ Are non-working files, and by default have filenames with an extension of `.html`, `.xml`, or `.txt`.

Data files
~ Source of the data made available for templating.
~ All share the same namespace, and name clashes/re-use across data files is an error.
~ Identified by files with extension `.toml`.

The build process is as follows:

1. Clone the source directory afresh for every build. The source directory is never changed (although it is watched).
1. Load all **data files** into a single namespace. Any name clashes (attempts to set the same variable more than once) is considered an error, causing the tool to abort.
1. Run all **template files** through Jinja, producing files of the same name.
1. During templating, the contents of Markdown files can be rendered into HTML through use of the `markdown()` Jinja filter.
1. Run all HTML files (`*.html`) through [HTML tidy](http://html-tidy.org), reporting any warnings, and standardising the formatting (e.g. indentation).
1. Delete all **working files**, and afterwards delete any leftover empty directories.

The tool requires no particular file or directory structure, and will work (degenerately) on an empty source directory.

**Note:** The HTML generated from the markdown is the point of "maximum opinion" for AWG. It is the only aspect of the output which is not under the complete control of the author (in the sense that it contains HTML tags determined by the markdown library). Some of those tags need additional CSS to style (such as definition lists), and code or maths excerpts need even more substantial processing. How that can be done and more is explained in my [content approach](approach.html).

# How to use

## Dependencies

The dependencies are [uv](https://docs.astral.sh/uv/) and (optionally) [html-tidy](https://www.html-tidy.org). For example, to set things up on a Mac using [Homebrew](https://brew.sh):

```bash
❯ brew install uv tidy-html5
```

## Running the tool

The tool itself is a single file Python script, [awg.py](https://github.com/tcorbettclark/tcorbettclark.github.io/blob/master/awg.py). It uses [inline script metadata](https://peps.python.org/pep-0723) to declare Python and Python package dependencies which `uv` can [read](https://docs.astral.sh/uv/guides/scripts/#declaring-script-dependencies). Then due to the [shebang](<https://en.wikipedia.org/wiki/Shebang_(Unix)>), the tool is conveniently runnable as an executable, hiding all the magic of `uv` installing a valid version of Python and required packages in a virtualenv.

```console
❯ ./awg.py --help
Usage: awg.py [OPTIONS] CONTENT_DIR OUTPUT_DIR

  AWG = Agnostic Website Generator.

  CONTENT_DIR is the directory of source web contents. It is never altered.

  OUTPUT_DIR is the new directory into which the website will be built. It is destroyed before every build.

Options:
  -w, --working-file-regex TEXT  Regex to match working files.  [default: \_.*]
  -t, --template-extension TEXT  Extension identifying files to template with Jinja  [default: .html, .xml, .txt]
  -h, --host TEXT                Serve on this host  [default: localhost]
  -p, --port INTEGER             Serve on this port  [default: 8000]
  --help                         Show this message and exit.
```

The two mandatory arguments are the content and output directories. Providing them results in an output like this:

```console
❯ ./awg.py example/ output/
Working files match regex: \_.*
Template files have extension(s): .html, .xml, .txt
Using content from: /Users/tcorbettclark/Projects/tcorbettclark.github.io/example (example)
Cloned content into fresh output directory: /Users/tcorbettclark/Projects/tcorbettclark.github.io/output (output)
Reading template data from: output/_important_points.toml
Reading template data from: output/_config.toml
Converted markdown from: output/_hello.md
Rendered template: output/index.html
Removed 3 working files and 0 empty directories from output directory
Html-tidy ok: output/index.html
Rebuilt all files in: output
Starting local server on http://localhost:8000
Serving files from: output
Watching for changes in: example
```

The tool is now watching for changes to the source content, after which it will rebuild and notify all browsers subscribed for hot reloading (see below) before waiting again for more changes. Every build is a full clean build without any caching or incremental behaviour, avoiding penalties from complexity and gotchas.

**Hint**: Content changes sometimes temporarily break the templating mechanism (for example, after renaming files). A simple solution is to suspend the tool with `ctrl-z`, make the changes, and then foreground it with `fg`. If the content changed then the site will be rebuilt and browser(s) told to reload.

## Hot reloading

The AWG tool provides a simple websocket API to "push notify" any browsers open on a page that the source has changed and they should reload. This feature can be used with a small amount of javascript e.g. in [hot-reloader.js](https://github.com/tcorbettclark/tcorbettclark.github.io/blob/master/content/hot-reloader.js), configured to load from the `<head>` tag:

```Html
<html xmlns="http://www.w3.org/1999/xhtml" lang="en" xml:lang="en">
    <head>
        ...
        <script defer src="/hot-reloader.js" async></script>
        ...
    </head>
    ...
</html>
```

Note that it only does anything when being served up over `localhost`, so is fine to keep in production (when it does nothing). Also, not using this javascript or equivalent is fine, but the browser will need to be reloaded/refreshed by hand after changes.

More details explaining how this works are in the implementation section, below.

# Implementation details

## Code overview

In essence there are 3 classes with orthogonal responsibilities:
- `Builder` - Build the files by applying templates using data from TOML etc.
- `Watcher` - Watch for file changes.
- `Server` - Serve up the content over HTTP and the simple hot reloader protocol over a websocket.

The Watcher and Server are both async; the Builder is synchronous. The main loop is clean (simplified slightly to show approach):

```Python
builder = Builder(content_dir, output_dir, working_file_regex, template_extensions)
watcher = Watcher(content_dir)
server = Server(host, port, output_dir)

builder.rebuild()
await watcher.start()
await server.start()
try:
    while True:
        await watcher.wait_for_change()
        builder.rebuild()
        await server.signal_hot_reloaders()
except asyncio.CancelledError:
    await watcher.stop()
    await server.stop()
    log("Bye")
```

Everything is in the single file: [awg.py](https://github.com/tcorbettclark/tcorbettclark.github.io/blob/master/awg.py).

## Hot reloading

In theory, hot reloading is simple:
- use a [websocket](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket) to notify a small piece javascript running in the browser that it should reload the page.

In practice, there are some complications:
- making it obvious to the user when the hot reloader is not running (e.g. after stopping/starting AWG, for whatever reason);
- reconnecting after the page has been reloaded (prompted either by the hot reloader or by the user);
- handling [page lifecycle](https://developer.chrome.com/docs/web-platform/page-lifecycle-api) complexities such as history navigation, browsers putting tabs to sleep, etc;
- discouraging browsers from closing websockets due to inactivity;
- dealing with the fact that the WebSocket javascript object is asynchronous.

The protocol consists of two messages:
- the server can send connected clients a `reload` message;
- connected clients can send the server a `keep-alive-ping` message.

For the failure handling strategy, note first that opening a socket with `new WebSocket()` is asynchronous. It does not raise an exception on failure to connect. Also, the `onerror` signal can occur even under normal use, e.g. if the user navigates browser history with forward/back buttons, or if the browser suspends/resumes the page.

The most robust approach seems to be to use the `onclose` signal, differentiating between whether or not the connection has ever opened ok.
- If **yes**, try to restart it (this could happen after visibility change or freeze/resume cycle).
- If **no**, then there was a bigger problem, so show a blocking alert to the user. After that blocking alert is dismissed, reload the whole page (and hence start the cycle again).

With that all in mind, the javascript is clean:

```Javascript
function start_hot_reloader() {
  var ws = new WebSocket("ws://localhost:8000/ws");

  ws.onclose = function close_without_having_opened() {
    // We will replace this function after successfully opening the connection.
    // Hence if we reach here, the websocket closed without ever having opened
    // and so failed to connect/open in the first place.
    alert(
      "Hot reloader failed. Is the local server running?\n\nClose this window to try again.",
    );
    // Best to reload because the server content may have changed in the interim.
    window.location.reload(true);
  };

  ws.onopen = function on_open() {
    console.log("Hot reloader: websocket connection open");
    // Start a keep-alive pinger to encourage the browser to keep the websocket open.
    var pinger_id = setInterval(() => {
      ws.send("keep-alive-ping");
    }, 5000);
    // Now that we have opened the connection, replace the onclose function.
    ws.onclose = function close_after_opened_ok() {
      clearInterval(pinger_id);
      console.log("Hot reloader: websocket connection closed");
      setTimeout(start_hot_reloader, 50);
    };
  };

  ws.onmessage = function on_message(event) {
    if (event.data == "reload") {
      window.location.reload(true);
    } else {
      console.log(`Hot reloader websocket received: {event.data}`);
    }
  };
}

addEventListener("load", (event) => {
  if (window.location.hostname == "localhost") {
    start_hot_reloader();
  }
});
```

## Tool development

Used in the recommended way described above, `uv` creates a disposable but cached virtualenv in which to install the dependencies and run the tool.

During any development of the tool, it is helpful to have a consistent virtual env in `.venv` which editors can use for appropriate checking and code completion etc with the installed libraries. This can be achieved as follows:

```bash
# Create virtualenv in .venv
uv venv

# Activate it
source .venv/bin/activate.fish

# Run tool with the active virtualenv rather than create a new/hidden one.
uv run --active --script awg.py ./content/ ./docs/

# Add/remove packages, updating the metadata in both the tool and the active virtualenv.
uv add --active --script awg.py <package>
uv remove --active --script awg.py <package>

# Upgrade packages in the development virtualenv (does not change awg.py)
uv sync --upgrade --active --script awg.py

# View packages in active virtualenv
# NB uv tree uses hidden cached virtualenv, so best to use pip subcommand.
uv pip list
uv pip tree
```
