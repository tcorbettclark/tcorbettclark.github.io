# Tim's Web Generator (TWG) tool

## Tool features

My tool makes it easier to create a static website of the usual HTML, CSS, and Javascript files (plus a few others such as the manifest.json, robots.txt, and sitemap.xml). It does so without _any opinion_ of these web files. The essential features are:

- Compiling Markdown into HTML (to allow content to be written more easily).
- File templating using Jinja2 (most obviously to produce HTML).
- Reading template data from TOML files (to pass to Jinja2).
- Validating and prettifying all final HTML by running through [HTML tidy](http://html-tidy.org) (if available).
- Serving up content on a local http webserver (for review during development).
- Watching for source file changes and rebuilding automatically.
- Notifying browser(s) of new builds (_e.g._ to trigger a "hot reload").

Note the absence of themes, plugins, blog posts, tags, articles, Atom or RSS feeds etc.

## Zero config

With the exception of a few command line options to tell the tool where to find the content and put the output _etc_, there is no configuration. There are no required files or directory structures, and the tool will run fine on an empty directory. There is a simple `example/` content directory in the [GitHub repository](https://github.com/tcorbettclark/tcorbettclark.github.io) to demo some of the functionality and provide a learning sandpit to play in.

## Subtractive approach

Instead of copying and creating files and directories from various sources, the tool takes a "subtractive" approach. The build process starts by cloning a specified content directory into a new output directory. After running the template generation, all "working files" are then deleted from this output directory. By default, _working files_ are identified as filenames starting with an underscore and _template files_ as having an extension of `.html`, `.xml`, and `.txt`.

In addition to reducing any mystery of how an output is generated, this approach allows maintenance effort to be reduced by grouping related content. For example, all HTML, Markdown, template data, Javascript, _etc_ relating to a particular page on the site can be kept together under a single directory. Then after changes, removal, or replacement, we reduce the chances of things being left behind.

However, due to the tool's lack of opinion in this regard, content can by grouped by type in the traditional fashion if desired (so all the javascript in one directory, all the CSS in another, _etc_). Or a mixed by-purpose/by-type strategy used. Regardless, the files and structure is all explicit and visible.

## Dependencies

The dependencies are [uv](https://docs.astral.sh/uv/) and (optionally) [html-tidy](https://www.html-tidy.org). For example, to set things up on a Mac using [Homebrew](https://brew.sh):

```bash
❯ brew install tidy-html5 uv
```

## Running the tool

The tool itself is a single file Python script called `twg.py`. This uses [inline script metadata](https://peps.python.org/pep-0723) to define dependencies which `uv` can [read](https://docs.astral.sh/uv/guides/scripts/#declaring-script-dependencies). Then due to the [shebang](<https://en.wikipedia.org/wiki/Shebang_(Unix)>), the tool can conveniently be run as an executable, hiding all the magic of `uv` installing a valid version of Python and required packages in a virtualenv.

```bash
❯ ./twg.py --help
Usage: twg.py [OPTIONS] CONTENT_DIR OUTPUT_DIR

  TWG = Tim's Website Generator.

  CONTENT_DIR is the directory of source web contents. It is never altered.

  OUTPUT_DIR is the new directory into which the website will be built. It is destroyed on every build.

Options:
  -w, --working-file-regex TEXT  Regex to match working files.  [default: \_.*]
  -t, --template-extension TEXT  Extension identifying files to template with Jinja2  [default: .html, .xml, .txt]
  -h, --host TEXT                Serve on this host  [default: localhost]
  -p, --port INTEGER             Serve on this port  [default: 8000]
  --help                         Show this message and exit.
```

Running will produce an output as follows:

```bash
❯ ./twg.py example/ output/
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

The tool is now watching for changes to the source content, after which it will rebuild and notify any browsers to trigger a reload. Every build is a full clean build without any caching or incremental behaviour, avoiding complexity penalties and subtle gotchas.

Hint: Content changes sometimes temporarily break the templating mechanism (_e.g._ after renaming files). A simple solution is to suspend with `ctrl-z`, make the changes, and then foreground with `fg`. If changes were made then the browser(s) will reload.

## Template data

TODO: explain collecting TOML, and detecting conflicts.

Re toml data sharing same namespace, point out that trivial to add a namespace in toml

## Jinja2 templating

TODO: explain Relative paths for localisation

TODO: List Jinja2 options used.

## Markdown

TODO: explain how to call from Jinja2 templates.
TODO: explain why CommonMarkdown
TODO: explain plugins

Refer to example directory.

## Indentation management

Indentation - for clarity in content view for easier writing and maintaining. But also want properly formatted output. Hence tidy.

Don't attempt to generate nicely indented HTML. Use Tidy instead. But write source files neatly for easy maintenance - properly indented for readability as source. This is also why files are of one language type - so that editors can use the corresponding language mode (LSP).

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

## Further development

So that your editor can pick up the scripts' virtual enviroment, symlink `.venv` e.g. something like:

???

```bash
ln -s /Users/tcorbettclark/.cache/uv/environments-v2/run-f69dfe2b9a396a65 .venv
```

To add or remove packages needed by `twg.py`,

```bash
uv add --script twg.py <package>
uv remove --script twg.py <package>
```
