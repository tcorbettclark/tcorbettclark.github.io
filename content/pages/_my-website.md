# My website

## Purpose

The purpose of this website is to encourage me to write and think clearly. Whether anyone reads it is secondary, although naturally I hope that it may be of some interest. The website is also a presentation of who I am.

It is not a blog. Blogs are a chronological record of output. Given its purpose, I think it is better for the author (i.e. me) to take responsibility for the assembly and navigation of cohesive thought, improving and modifying as needed over time.

## Technical overview

This website is built using a hand-crafted static site generator. Yes, another one - see [this list](https://jamstack.org/generators/) for example. My justification for "reinventing the wheel" is that:

- I personally enjoy the deeper understanding which comes from creation;
- I want full control to make the result clean and right at both the human and technical level;
- I only want a small number of the features possible in a static site;
- In my evaluation of other tools I found an uneven and arbitrary (personal?) interface between the tool and the content, resulting in the need to work in both sides. This suggests either abandoning the boundary entirely or moving it substantially.

So the role of my tool is _only_ to make it easier to create a static website made fundamentally of HTML, CSS, and Javascript; it has no opinion about the web world.

In short, the tool provides:
- Jinja2 templating.
- Reading of TOML files containing data to feed to Jinja2 templating.
- Ability to compile Markdown into HTML.
- A local http webserver to server content during development.
- A watcher of file/directory changes, triggering an automatic rebuild.
- A websocket to allow browsers to be notified of changes e.g. to cause an automatic reload ("hot reloader").
- TODO: explain sitemap generation

TODO: show a minimal site.

The key features of my approach are:

- Support writing and maintaining pages of content. No themes, plugins, blog posts, tags, articles, Atom or RSS feeds etc.
- All files are kept together in one directory tree. At the start of the build process, this is cloned.
- No files are moved around, but working files are deleted (so more of a subtractive approach than a move/additive one.)
- Organising and templating HTML using Jinja2.
- Simple Jinja2 filter to allow content to be written using Markdown (in plain .md files).
- TODO Automatic generation of sitemap (both HTML and xml file) from the content (for SEO).
- Html-tidy of all output to both validate and keep everything tidy.
- Hot reloading localhost server, which rebuilds on change before signalling to browser(s) to reload.

Look - localisation of content. Add to my website notes
Indentation - for clarity in content view for easier writing and maintaining. But also want properly formatted output. Hence tidy.
Also my website - explain value of writing and recording FOR ME. Think of it like a test. And might be useful for others.
Why organise artefacts by type? Organise by use.

Subtractive approach, not copy/move/adjust.

## Environment

The dependencies are [html-tidy](https://www.html-tidy.org) and [uv](https://docs.astral.sh/uv/). To set things up on a Mac,

```bash
    # Install primary tools.
    brew install tidy-html5 uv

    # Checkout this repository.
    git clone git@github.com:tcorbettclark/tcorbettclark.github.io.git
    cd tcorbettclark.github.io
```

## Build and view locally

The builder, hot-reloader, and local server (on `http://localhost:8000`) are all in the `twc.py` script (**t**im's **w**eb **c**reator; it had to be called something). This uses [inline script metadata](https://peps.python.org/pep-0723) to define dependencies which `uv` can [read](https://docs.astral.sh/uv/guides/scripts/#declaring-script-dependencies). Due to the [shebang](<https://en.wikipedia.org/wiki/Shebang_(Unix)>), this is conveniently run as an executable, hiding all the magic of `uv` installing a valid version of Python and required packages in a virtualenv.

```bash
    ❯ ./twc.py --help
    Usage: twc.py [OPTIONS] CONTENT_DIR OUTPUT_DIR

      Create a website.

      CONTENT_DIR is the directory of web contents. It is never altered.

      OUTPUT_DIR is the new directory into which the website will be built.

    Options:
      --help  Show this message and exit.
```

And so to run `twc.py`,

```bash
    ❯./twc.py content/ docs/
    Using content in: /Users/tcorbettclark/Projects/tcorbettclark.github.io/content (content)
    Cloned content into fresh output directory: /Users/tcorbettclark/Projects/tcorbettclark.github.io/docs (docs)
    Reading template data from: docs/_site_config.toml
    Reading template data from: docs/profile/_config.toml
    Reading template data from: docs/pages/cv/_config.toml
    Rendered template: docs/index.html
    Converted markdown from: docs/pages/_about-me.md
    Rendered template: docs/pages/about-me.html
    Rendered template: docs/pages/cv.html
    Converted markdown from: docs/pages/_my-tastes.md
    Rendered template: docs/pages/my-tastes.html
    Converted markdown from: docs/pages/_my-website.md
    Rendered template: docs/pages/my-website.html
    Converted markdown from: docs/pages/_publications.md
    Rendered template: docs/pages/publications.html
    Converted markdown from: docs/pages/recreational-maths/_index.md
    Rendered template: docs/pages/recreational-maths/index.html
    Converted markdown from: docs/pages/recreational-maths/problem-1/_index.md
    Rendered template: docs/pages/recreational-maths/problem-1/index.html
    Rendered template: docs/wip.html
    Removed 19 working files and 1 empty directories from output directory
    Html-tidy ok: docs/index.html
    Html-tidy ok: docs/wip.html
    Html-tidy ok: docs/pages/about-me.html
    Html-tidy ok: docs/pages/my-website.html
    Html-tidy ok: docs/pages/my-tastes.html
    Html-tidy ok: docs/pages/cv.html
    Html-tidy ok: docs/pages/publications.html
    Html-tidy ok: docs/pages/recreational-maths/index.html
    Html-tidy ok: docs/pages/recreational-maths/problem-1/index.html
    Created XML sitemap - TODO!!
    Rebuilt all files in: docs
    Starting local server on http://localhost:8000
    Serving files from: docs
    Watching for changes in: content
```

If this produces an error such as

```
AttributeError: dlsym(0x69da4e660, tidyLibraryVersion): symbol not found
```

then possibly you need to adjust the `DYLIB_LIBRARY_PATH` or `LIB_LIBRARY_PATH` to allow the `libtidy` library to be loaded by Python ctypes. See the shebang line in `twc.py`.

Now edit the content (in `content/`). The tool will notice the change, rebuild, and tell the browser(s) to reload.

Hint: Content changes sometimes temporarily break the templating mechanism (e.g. after renaming files). A simple solution is to suspend with `ctrl-z`, make the changes, and then foreground with `fg`. If changes were made then the browser(s) will reload.

## Deployment e.g. on GitHub pages

TOOD: reference github, explain configuration

TODO: explain github actions from master branch in the `docs/` directory

Commit to master branch on github. This triggers the deploy action, so within 10 mins (often faster) the changes will be live.

Output has to go in `docs/` because github pages only support serving content from `/` or `docs/`.

Then run the deployed site against W3C Validator, check rendering using different devices etc. See also the "DRAFT" mode approach, below. TODO.

## Choice of main libraries

TODO Talk about Bulma, Jinja, markdown

## The build process

The build process works as follows:

1. Clone the content directory into a new output directory.
1. Using only the output directory
   1a. Apply Jinja2 templates to all HTML files which do not start with an underscore, and render back in place.
   1b Delete all working files and directories (anything with a leading underscore in the path segment).
   1c Run html-tidy over all HTML files to validate and fix indentation.

The end result is a clean output directory ready for deployment.

Every build is a clean build. No caching as plenty faster enough without complexity penalty or subtle gotchas.

## Code style

Don't attempt to generate nicely indented HTML. Use Tidy instead. But write source files neatly for easy maintenance - properly indented for readability as source. This is also why files are of one language type - so that editors can use the corresponding language mode (LSP).

## Jinja2 templating

Relative paths for localisation

TOML

## Markdown

Include simple example.

## Maths

TODO: explain math rendering (markdown plugin to escape and include in span with class, then small javascript hook to call katex on all cells after DOM loaded.)

## Manifest and favicon

TODO: explain webmanifest file, especially for favicons. See https://www.w3.org/TR/appmanifest/.

## Colour, styling, and night view

TODO

Need to keep Bulma, manifest, and favicon theme colours in sync.

Simple "tcc" Favicon generated using https://favicon.io/favicon-generator/, using the same primary colour as configured in Bulma.

Refer to all the help from Bulma, and therefore what is left to do.

Talk about night view.

Talk about different standards of RGB (use Standard RGB or sRGB).

Useful learning about colours:

- https://www.learnui.design/blog/the-hsb-color-system-practicioners-primer.html
- https://www.learnui.design/blog/color-in-ui-design-a-practical-framework.html

Useful tools:

- https://www.canva.com/colors/color-wheel/
- https://colorhunt.co
- https://coolors.co
- https://pixelied.com/colors/color-wheel

## XML sitemap

Simply done by putting the data into a `_sitemap.toml` and writing a template `sitemap.xml`. Then linking to it from `robots.txt`.

## DRAFT mode

CSS watermark
switch passed in to top level templates
The `/wip.html` page and the "hidden" link in right side of the navigation (breadcrumb) space.
So now often I can commit and push to master, and github will publish. Streamlined workflow. Only use branches with pull requests for larger stuff.

And now I can test draft pages with w3 validator, on different devices etc.

I don't really care that people can see such pages - the watermark makes it obvious.
And the search engines start to see something arriving, changing often, which speeds up indexing to make more discoverable (not that that really matters, but is nice).

Also, no separate dev build and live build - all one and the same.

## Hot Re-loader fun

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

## Publish checklist

- Visual check on different devices and orientation
- Colour consistency (e.g. manifest, favicon, and page theme)
- W3Validator
- Page titles and descriptions
- Alt and title tags
- Contrast ratio
- https://developer.mozilla.org/en-US/docs/Web/HTML/Guides/Microdata

## Further development of twc.py

So that your editor can pick up the scripts' virtual enviroment, symlink `.venv` e.g. something like:

???

```bash
ln -s /Users/tcorbettclark/.cache/uv/environments-v2/run-f69dfe2b9a396a65 .venv
```

To add or remove packages needed by `twc.py`,

```bash
uv add --script twc.py <package>
uv remove --script twc.py <package>
```

## Pending / keep an eye for the future

Don't include a trailing slash on void elements. See:
https://wet-boew.github.io/wet-boew-documentation/decision/15.html

W3 Validator warns about them.

https://github.com/validator/validator/wiki/Markup-»-Void-elements#trailing-slashes

Basically, HTML5 is not XML. And since href arguments don't have to be quoted, we have an ambiguity:

```
<link href=https://foo.bar.baz/>
<link href="https://foo.bar.baz"/>
<link href="https://foo.bar.baz/">
```
