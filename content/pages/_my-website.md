# Maintaining my website

My home page is built using a simple home grown static site generator.

## Environment

Need html-tidy (https://www.html-tidy.org)
brew install tidy-html5
And make sure that the library can be found on the library search path.
For example, ensure DYLD_LIBRARY_PATH includes /usr/local/lib/

To update content, rebuild, and deploy:
```
  uv run python main.py
  ...view / review on locally served site
  ...make changes and tool will reload
  ...update git repo and push to github
```

## Philosphy

Purpose of this site...

Don't make the reader assemble blog timeline of thoughts, but make that the writer's responsibility. To see recent changes, see XXXX.

## Key features

The key features of my approach are:

* Just code i.e. not another static site generator library! (see https://jamstack.org/generators/ ...)
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


TODO: explain math rendering (markdown plugin to escape and include in span with class, then small javascript hook to call katex on all cells after DOM loaded.)

TODO: explain webmanifest file, especially for favicons

## Colour and styling

TODO

Simple "tcc" Favicon generated using https://favicon.io/favicon-generator/, using the same primary colour as configured in Bulma.

## Build process

The build process works as follows:

1. Clone the content directory into a new output directory.
1. Using only the output directory
1a. Apply Jinja2 templates to all HTML files which do not start with an underscore, and render back in place.
1b Delete all working files and directories (anything with a leading underscore in the path segment).
1c Run html-tidy over all HTML files to validate and fix indentation.

The end result is a clean output directory ready for deployment.

Every build is a clean build. No caching as plenty faster enough without complexity penalty or subtle gotchas.


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
