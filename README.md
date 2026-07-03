# README

My personal website. How it works is documented on the site itself: [https://www.corbettclark.com](https://www.corbettclark.com).

## TODO

### Content

- About me (academic, professional, personal)
- Research interests, starting with tastes
  - Recreational mathematics - bite-sized puzzles with exploration
  - Investigations - more specialist/deeper trying to answer "why", e.g. logarithms, complex numbers.
  - Experiments - code e.g complexity. Armchair universe.
- Bio/CV

### Other Content

- Written styleguide, e.g. avoid 3rd person "we", short sentences, run through an LLM for suggestions, ...
- A "now" page. See https://nownownow.com/about
- Find a link to the PDF for my "Choosing an appropriate model for novelty detection" paper.
  - Perhaps? https://ieeexplore.ieee.org/document/607503
- Look for other content ideas from:
  - https://bastian.rieck.me

### Technical Site

- Navigation
  - Make header tags linkable
- me.css has SRI, but not listed in the CSP. Fortunately doesn't matter, but the base template should support extensions.
- Social Media meta tags: https://css-tricks.com/essential-meta-tags-social-media/

### Technical AWG

- Separate (and colour) the output e.g. into Builder, Server, Watcher categories. But maybe more.
- Decide on all markdown plugins.
- Allow merging lists across TOML files, e.g. to better manage sitemap files.
- Deliver a 404 on the dev server (currently just returns empty files!).

### Other

- Submit sitemap to various search engines (once?).
