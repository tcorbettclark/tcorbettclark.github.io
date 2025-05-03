# My website

## Purpose

The purpose of this website is to encourage me to write and think clearly. Whether anyone actually reads it is secondary, although of course I hope that it may be of some interest. The website is also a presentation of who I am.

It is not a blog. I think it is better for the author (i.e. me) to take responsibilty for the assembly and navigation of cohesive thought, improving and modifying as needed over time, rather than expect readers to work through a chronology of potentially disparate articles "preserved for posterity".

## Technical overview

This website is built using a hand-crafted static site generator. Yes, another one - see [this list](https://jamstack.org/generators/). My main justification for "reinventing the wheel" is that:

- I want full control to make the result clean and right, with only the features I need;
- I personally enjoy the deeper understanding which comes from creation;
- For technical creators, I am not convinced of the benefits of working with a division between static website "tool X" and the content. I've tried it in the past and too often needed to work on both sides of the line to achieve what I wanted. The boundary seems too personal and arbitrary, so it is better to dispense with it entirely.

The key features of my approach are:

* Support writing and maintaining pages of content. No blog posts, tags, articles, Atom or RSS feeds etc.
* All files are kept together in one directory tree. At the start of the build process, this is cloned.
* No files are moved around, but working files are deleted (so more of a subtractive approach than a move/additive one.)
* Organising and templating HTML using Jinja2.
* Simple Jinja2 filter to allow content to be written using Markdown (in plain .md files).
* TODO Automatic generation of sitemap (both HTML and xml file) from the content (for SEO).
* Html-tidy of all output to both validate and keep everything tidy.
* Hot reloading localhost server, which rebuilds on change before signalling to browser(s) to reload.

Look - localisation of content. Add to my website notes
Indentation - for clarity in content view for easier writing and maintaining. But also want properly formatted output. Hence tidy.
Also my website - explain value of writing and recording FOR ME. Think of it like a test. And might be useful for others.
Why organise artefacts by type? Organise by use.

## Environment

The dependencies are Python and [html-tidy](https://www.html-tidy.org). The Python packages and virtualenv are managed with [uv](https://docs.astral.sh/uv/). To create the enviroment on a Mac,

``` bash
    brew install tidy-html5
    # And ensure the library can be found on the library search path.
    # For example, ensure DYLD_LIBRARY_PATH includes /usr/local/lib/

    brew install uv

    # Checkout this repository
    git clone git@github.com:tcorbettclark/tcorbettclark.github.io.git
    cd tcorbettclark.github.io

    # Install Python, create virtual env, and install Python packages
    uv sync
```

## Build and view locally

Then to run the builder and hot-reloader so that pages can be viewed locally on `http://localhost:8000`,
``` bash
    uv run python run.py
    # ... logs activity and keeps running until cancelled e.g. with ctrl-c
```

Now just edit the content (in `content/`) and the browser will automatically update after every save.

If making changes which temporarily break templating, suspend with `ctrl-z`, make the changes, and then foreground with `fg`. If changes were made to files then the reloader will run.

## Deployment e.g. on GitHub pages

TOOD: reference github, explain configuration

TODO: explain github actions from master branch in the `docs/` directory

Commit to master branch on github. This triggers the deploy action, so within 10 mins (often faster) the changes will be live.

Output has to go in `docs/` because github pages only support serving content from `/` or `docs/`.

Then run the deployed site  against W3C Validator, check rendering using different devices etc. See also the "DRAFT" mode approach, below. TODO.

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
* https://www.learnui.design/blog/the-hsb-color-system-practicioners-primer.html
* https://www.learnui.design/blog/color-in-ui-design-a-practical-framework.html

Useful tools:
* https://www.canva.com/colors/color-wheel/
* https://colorhunt.co
* https://coolors.co
* https://pixelied.com/colors/color-wheel

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
