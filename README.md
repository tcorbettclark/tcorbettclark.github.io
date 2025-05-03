# README

See `content/pages/_my-website.md` (or rendered version on my website).

In short, to build and serve locally with a hot reloader, run:
```bash
    uv run run.py
```

# TODO - content

- Create a now page. See https://nownownow.com/about
- Find a link to the PDF for my "Choosing an appropriate model for novelty detection" paper.
  Perhaps? https://ieeexplore.ieee.org/document/607503
- Create My computer setup page, include software setup, configuration (link to github), and fastfetch output
- Create My tools of choice page
- Create an Updates page to list recent and notable updates. Maybe...
- Look for other content ideas from:
   - https://bastian.rieck.me
   - https://theoryandpractice.org

# TODO - technical

- Use the breadcrumb Bulma component
- Find way to allow editor (Zed) find the virtualenv magically created by uv when running script
- Add light/dark mode switcher (take from Bulma website)
- Fix colour issues in dark mode - poor contrast.
- Decide on all markdown plugins.
- Create a 404 in the dev server, but also on the main page.
- Add a sitemap.xml and update robots.txt file.
  Could this be done in a generic, tool-agnostic way? Create a list of all the .html files, ready to be templated into a sitemap.xml?
  Since the output dir is recreated every time, use git to see when files last changed.
  See https://www.sitemaps.org/index.html
  See https://thatware.co/xml-sitemap-creation-python/
  See https://michael-lisboa.medium.com/automate-your-sitemap-xml-with-python-and-deploy-it-as-a-cron-job-to-google-cloud-c5c4f986c734
  See https://github.com/fossworx-labs/fossfolio/blob/main/fossfolio/sitemap.py
  See https://www.woorank.com/en/blog/how-to-locate-a-sitemap-in-a-robots-txt-file
  Note also need to submit to search engines (once?).
- Find an alternative to FontAwesome. Maybe
  I'm using the free plan which has a monthly limit of 10,000 views.
  Login to fontawesome.com to see usage.
- Reduce (stop?) Fontawesome rendering flicker on load
- Switch this list into github issues, with milestone planning, ready for merging workflow, etc.
- Keep an eye on how well the pages print to PDF, e.g. my CV page. Currently pretty good!
  Perhaps hide the breadcrumb navigation?
- Look into Social Media meta tags: https://css-tricks.com/essential-meta-tags-social-media/
