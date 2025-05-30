# README

My personal website. For details, see https://www.corbettclark.com/building-this-website/index.html.

# TODO - content

- About me (academic, profressional, personal)
- Research interests, starting with tastes
  - Recreational mathematics - bite-sized puzzles with exploration
  - Investigations - more specialist/deeper trying to answer "why", e.g. logarithms, complex numbers.
  - Experiments - code e.g complexity. Armchair universe.
- Bio/CV

# TODO - other content

- Written styleguide, e.g. avoid 3rd person "we", short sentences, run through an LLM for suggestions, ...
- A "now" page. See https://nownownow.com/about
- Find a link to the PDF for my "Choosing an appropriate model for novelty detection" paper.
  - Perhaps? https://ieeexplore.ieee.org/document/607503
- Look for other content ideas from:
  - https://bastian.rieck.me

# TODO technical site

- Navigation
  - Some kind of floating and automatic TOC on all main pages. And document on approach page.
  - Make header tags linkable
  - Provide fast return to top, and/or keep navigation bar always visible
- me.css has SRI, but not listed in the CSP. Fortunately doesn't matter, but the base template should support extensions.
- Reduce font size of h2 (especially poor on phone).
- Keep an eye on how well the pages print to PDF, e.g. my CV page. Currently pretty good!
  - Perhaps hide the breadcrumb navigation?

# TODO - technical awg

- Separate (and colour) the output e.g. into Builder, Server, Watcher categories. But maybe more.
- Decide on all markdown plugins.
- Allow merging lists across TOML files, e.g. to better manage sitemap files.
- Find a way to deliver a 404 on the dev server (currently just returns empty files!).

# TODO - other

- Switch this list into github issues, with milestone planning, ready for merging workflow, etc.
- Look into Social Media meta tags: https://css-tricks.com/essential-meta-tags-social-media/
- Submit sitemap to various search engines (once?).
