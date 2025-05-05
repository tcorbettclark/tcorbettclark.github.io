# My web content

TODO Everything described above is generic (see comments about lines).

## Deployment e.g. on GitHub pages

TOOD: reference github, explain configuration

TODO: explain github actions from master branch in the `docs/` directory

Commit to master branch on github. This triggers the deploy action, so within 10 mins (often faster) the changes will be live.

Output has to go in `docs/` because github pages only support serving content from `/` or `docs/`.

Then run the deployed site against W3C Validator, check rendering using different devices etc. See also the "DRAFT" mode approach, below. TODO.

## Choice of web libraries

TODO Talk about Bulma

## Maths

TODO: explain math rendering (markdown plugin to escape and include in span with class, then small javascript hook to call katex on all cells after DOM loaded.)

## Code

Highlighting code is easy with [highlight.js](https://highlightjs.org). This will colour many different languages in any of a number of different themes, expecting html like

```HTML
<pre><code class="language-python"> ...python code... </code></pre>
```

The Common Markdown standard used by [twg.py](twg.html) has [fenced code blocks](https://spec.commonmark.org/0.31.2/#fenced-code-blocks) which produces tags with CSS classes exactly like this.

So we just need to pull in the Javascript and chosen theme CSS (in this case, atom-one-dark) from a CDN, and ask it to render once the page has loaded. Hence the `<head>` section of the base template contains:

```HTML
...
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@11.9.0/build/styles/atom-one-dark.min.css">
...
<script src="https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@11.9.0/build/highlight.min.js" crossorigin="anonymous"></script>
...
<script src="/js/render_code.js"></script>
</html>
```

and the contents of `/js/render_code.js` runs the highlighter after all the DOM content is present and correct:

```Javascript
document.addEventListener("DOMContentLoaded", (event) => {
  hljs.highlightAll();
});
```

## Navigation breadcrumb

TODO

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

## Publish checklist

- Visual check on different devices and orientation
- Colour consistency (e.g. manifest, favicon, and page theme)
- W3Validator
- Page titles and descriptions
- Alt and title tags
- Contrast ratio
- https://developer.mozilla.org/en-US/docs/Web/HTML/Guides/Microdata

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
