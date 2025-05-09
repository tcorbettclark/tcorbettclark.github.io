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

The two mandatory arguments are the content and output directories. Providing them results in something like this:

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

The tool is now watching for changes to the source content, after which it will rebuild and notify any browsers to trigger a reload before waiting again for more changes. Every build is a full clean build without any caching or incremental behaviour, avoiding penalties from complexity and gotchas.

**Hint**: Content changes sometimes temporarily break the templating mechanism (for example, after renaming files). A simple solution is to suspend the tool with `ctrl-z`, make the changes, and then foreground it with `fg`. If the content changed then the site will be rebuilt and browser(s) told to reload.

<!--
# Implementation details

TODO How it works and how to develop further.

## Hot Reloader fun

https://developer.chrome.com/docs/web-platform/page-lifecycle-api

Need to be able to handle:
1 Browser refresh/reload by hand
1 Browser refresh/reload triggered from server following change
1 Navigating away to a page on another site which exists
1 Navigating away to a page on another site which does not exist (404)
1 Navigating to another page on my site which exists
1 Navigating to another page on my site which does not exist (404)
1 Back button
1 Forward button
1 Close tab
1 Close browser

Tools:
1 Server detecting connection has dropped
1 Client detecting connection has dropped
1 Client side localstorage
1 Browser detecting a reload/refresh is about to happen
event beforeunload
event pagehide and pageshow
event visibilitychange
event freeze and resume

See https://developer.chrome.com/docs/web-platform/page-lifecycle-api

new WebSocket does not raise an exception on failure to connect because it is asynchronous.
onerror can occur even under normal use, e.g. using the browser history forward/back buttons, and having the page freeze/resume etc.

Most robust approach is to trap onclose and differentiate between whether the connection has ever opened ok. If it has, try to restart it (this could happen after visibility change or freeze/resume cycle); if it hasn't opened ok then there was a bigger problem, so we show a blocking alert to the user, after which we reload the whole page (and hence start the cycle again).

## Code overview

TODO: include simplified snippets.

For example

```Python
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
```

## Tool development

So that your editor can pick up the scripts' virtual enviroment, symlink `.venv` e.g. something like:

???

```bash
ln -s /Users/tcorbettclark/.cache/uv/environments-v2/run-f69dfe2b9a396a65 .venv
```

To add or remove packages needed by `awg.py`,

```bash
uv add \-\-script awg.py <package>
uv remove \-\-script awg.py <package>
``` -->
