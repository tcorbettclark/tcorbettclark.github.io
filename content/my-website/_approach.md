This page explains how I have structured all the web files, templates, and data to achieve this site. Also, my notes on how I addressed aspects such as hosting, validation, security, selecting libraries, rendering maths and code nicely, making the navigation breadcrumb, choosing colours, creating the favicon and app manifest, making the XML sitemap, and a draft/wip mode.

# Deployment on GitHub pages

It is easy and convenient to host static content on [GitHub pages](https://pages.github.com).

One can either use files from a git branch, the root directory of the repository, or a directory called `docs/`. It would be nice to be able to use a different directory name, but so be it. I just use the `docs/` directory on the master branch.

A custom domain can be used by creating a `CNAME` file containing the full domain (in my case, `www.corbettclark.com`).

The default GitHub action detects code commits and deploys on their infrastructure, making the result visible within a couple of minutes (often faster).

As I'm the only person making changes, I mostly dispense with creating a branch and making a pull request to myself ([GitHub flow](https://docs.github.com/en/get-started/using-github/github-flow)), but instead just make a number of meaningful commits locally. Then when ready to publish, I git push to GitHub. In short, my workflow is:

- Start up [my tool](twg.html) with `./twg.py content/ docs/`
- Repeat until ready to publish:
  - Make changes and check in local browser without leaving my editor (because of hot reload).
  - Commit locally using git.
- Git push to GitHub.
- After a minute or so, check the changes have reached live ok.

# Validation

Iterating with various (free) validation sites makes it easy to check for correctness, best practice, and learn about the web world. For example:

- [W3 Validator](https://validator.w3.org/nu/)
- [MDN's Observatory tool](https://developer.mozilla.org/en-US/observatory)
- [ValidBot](https://www.validbot.com/)

Notable issues I could not address include:

1. The existence of trailing slashes on void elements such as `meta` and `link` tags. These cannot be fixed by hand because [TWG](twg.html) checks and formats all HTML with [HTML Tidy](https://html-tidy.org), produces such trailing slashes. The main concern (see [here](https://wet-boew.github.io/wet-boew-documentation/decision/15.html) and [here](https://github.com/validator/validator/wiki/Markup-»-Void-elements#trailing-slashes)) seems to be that because HTML5 is not XML, and since href arguments don't have to be quoted, there is an ambiguity if the href is the last attribute and the url contains a trailing slash. Compare:
   ```
   <link href=https://foo.bar.baz/>
   <link href="https://foo.bar.baz"/>
   <link href="https://foo.bar.baz/">
   ```
   This isn't a problem so long as we always quote href's.
1. TODO, add more...

# Choice of web libraries

TODO Talk about selecting Bulma. No javascript - just CSS elements.

Colour management.
Popular and maintained.

Tempted by UIKit...

# Maths

For any substantial maths I create PDFs using [Typst](https://typst.app), but for immediately visible maths in the browser I use the javascript library, [KaTeX](https://katex.org). Other libraries exist but Katex is well maintained, popular, and fast.

The Common Markdown parser used by [twg.py](twg.html) includes the [dollarmath_plugin](https://mdit-py-plugins.readthedocs.io/en/latest/#mdit_py_plugins.dollarmath.dollarmath_plugin). It produces inline and block maths with the following HTML markup:

```HTML
<span class="math inline"> ...latex maths... </span>
<div class="math block"> ...latex maths... </div>
```

A small amount of javascript makes KaTeX render on the correct elements after the DOM has loaded:

```javascript
document.addEventListener("DOMContentLoaded", (event) => {
  for (var node of document.getElementsByClassName("math")) {
    katex.render(node.innerText, node, {
      displayMode: node.classList.contains("block"), // otherwise assume it is "inline"
      throwOnError: false,
    });
  }
});
```

I put this javascript in the file `render_maths.js` and load it in the `<head>` tag of the base template. This is also where we load the KaTeX library (both javascript and CSS) from the [jsDelivr CDN](https://cdn.jsdelivr.net):

```HTML
<head>
    ...
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.22/dist/katex.min.css" integrity="sha384-5TcZemv2l/9On385z///+d7MSYlvIEw9FuZTIdZ14vJLqWphw7e7ZPuOiCHJcFCP" crossorigin="anonymous">
    ...
    <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.22/dist/katex.min.js" integrity="sha384-cMkvdD8LoxVzGF/RPUKAcvmm49FQ0oxwDF3BGKtDXcEc+T1b2N+teh/OJfpU0jr6" crossorigin="anonymous"></script>
    ...
    <script defer src="/render_maths.js"></script>
    ...
</head>
```

The result is for markdown like

```markdown
For example, inline maths like $(x+1)^2 - (x-1)^2 = 4x$, and block maths like

$$
\sum_{k=1}^n { k! \over (1+k)^2 }
$$
```

to be displayed as

> For example, inline maths like $(x+1)^2 - (x-1)^2 = 4x$, and block maths like
>
> $$ \sum\_{k=1}^n { k! \over (1+k)^2 } $$

# Code

Highlighting code is easy with [highlight.js](https://highlightjs.org). This will colour many different programming languages in any of a number of different themes, expecting HTML markup like

```HTML
<pre><code class="language-python"> ...python code... </code></pre>
```

The Common Markdown standard used by [twg.py](twg.html) has [fenced code blocks](https://spec.commonmark.org/0.31.2/#fenced-code-blocks) which produces tags with CSS classes exactly like this.

So we just need to pull in the Javascript and chosen theme CSS (in this case, atom-one-dark) from a CDN, and ask it to render once the page has loaded. Hence the `<head>` section of the base template contains:

```HTML
<head>
    ...
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@11.9.0/build/styles/atom-one-dark.min.css">
    ...
    <script defer src="https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@11.9.0/build/highlight.min.js" crossorigin="anonymous"></script>
    ...
    <script defer src="/render_code.js"></script>
    ...
</head>
```

and the contents of `/render_code.js` runs the highlighter after all the DOM content is present and correct:

```Javascript
document.addEventListener("DOMContentLoaded", (event) => {
  hljs.highlightAll();
});
```

# Indentation management

Indentation - for clarity in content view for easier writing and maintaining. But also want properly formatted output. Hence tidy.

Don't attempt to generate nicely indented HTML. Use Tidy instead. But write source files neatly for easy maintenance - properly indented for readability as source. This is also why files are of one language type - so that editors can use the corresponding language mode (LSP).

# Navigation breadcrumb

TODO

# Manifest and favicon

TODO: explain webmanifest file, especially for favicons. See https://www.w3.org/TR/appmanifest/.

TODO does favicon.ico and apple xxx need to go in root directory to be found? At least one validator suggested so...

# Colour, styling, and night view

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

# XML sitemap

Simply done by putting the data into a `_sitemap.toml` and writing a template `sitemap.xml`. Then linking to it from `robots.txt`.

# DRAFT mode

CSS watermark
switch passed in to top level templates
The `/wip.html` page and the "hidden" link in right side of the navigation (breadcrumb) space.
So now often I can commit and push to master, and github will publish. Streamlined workflow. Only use branches with pull requests for larger stuff.

And now I can test draft pages with w3 validator, on different devices etc.

I don't really care that people can see such pages - the watermark makes it obvious.
And the search engines start to see something arriving, changing often, which speeds up indexing to make more discoverable (not that that really matters, but is nice).

Also, no separate dev build and live build - all one and the same.

# Security

TODO: Use validation tools (esp MDN Overservatory) and http-equv-header in meta tag.

# Publish checklist

- Visual check on different devices and orientation
- Colour consistency (e.g. manifest, favicon, and page theme)
- Validator
- Page titles and descriptions
- Alt and title tags
- Contrast ratio. TODO link to tools.
- TODO: read about https://developer.mozilla.org/en-US/docs/Web/HTML/Guides/Microdata
