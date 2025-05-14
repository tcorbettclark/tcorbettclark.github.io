This page explains how I structured all the web files, templates, and data to achieve this website. It also contains my notes on hosting, validation, security, selecting libraries, rendering maths and code nicely, making the navigation breadcrumb, choosing colours, creating the favicon and app manifest, making the XML sitemap, adding a draft/wip mode, ...

Hence this page provides _recipes_ for how to achieve the various features of a website. They are mostly independent of one another, allowing for easy modification, substitution, or ommission (and the agnostic nature of [AWG](awg.html) means that nothing is left behind).

# File structure

Organisational considerations include:

1. The purpose of each file, the relationship with other files, and especially how nearby each file is to related files.
1. When the file is loaded by the templating mechanism (`{% include %}` or `{% extends %}`).
1. When the file is loaded by the browser.
1. Where browsers expect or need to find special files.

This translates into the following principles:

1. Use a flat root directory for all files which browsers expect to see there, such as `robots.txt`, `sitemap.xml`, the app manifest, favicons, etc.
1. Use a flat root directory for all the files loaded by the base template (`_base.html`) on every page. The base template uses absolute paths.
1. Only extend templates from the same directory or in parent directories. So the template hierarchy overlays the file system hierarchy.
1. Otherwise, keep related files together in their own directory. And use relative paths.

Even though it is traditional, I don't organise files by type (all javascript in `/js/`, all css in `/css/`, etc).

The result is quite a few files in the root directory, but with the benefit that they are all visible. And then each page has its own directory, with child pages in child directories, etc.

The template inheritance hierarchy is simple:

- The base template is in `/_base.html`, and includes `/_header.html` and `/_footer.html`.
- The page template is in `/_page.html`, extends the base template, and adds blocks for the breadcrumb, title, page content, and the "page is draft" additions (see below).
- Most concrete pages then extend the page template (the welcome page being an exception, as it alters the layout to have a sidebar card).

# Indentation management

All HTML files are indented for clarity during editing. On output after templating, they are all formatted properly by [AWG](awg.html), so there is no need to try to generate properly indented HTML within the templates (avoiding fiddly whitespace management with "-" in e.g. `{%- ... %}`). For example, the indentation below is entirely to aid readability at the template stage (rather than final HTML).

```HTML
{% extends "../_page.html" %}

{% block breadcrumb %}
    {{ super() }}
    <div class="level-item">
        <span class="tag">
            <a href="index.html"><i class="fa-solid fa-arrow-left"></i> Back to: Building this website</a>
        </span>
    </div>
{% endblock breadcrumb %}

{% block title %} Content approach {% endblock title %}

{% block page %}
    {{ "_approach.md" | markdown() }}
{% endblock page %}
```

To make editing easy with language specific editing/formatting/colourising modes, I avoid files containing a mixture of languages. Hence there are separate files for each piece of markdown, no "frontmatter" TOML/YAML within markdown files, javascript is always included from `.js` files, etc.

# Choice of web framework

There are many to choose from, but I selected [Bulma](https://bulma.io) because it is CSS only (no javascript), looks good, is well documented, very popular, and actively maintained. I like it's responsive layout and support for colour management.

The two closest alternatives were:

- [Bootstrap](https://getbootstrap.com), which is older, bit boring looking now, and slightly heavier weight than I need.
- [UIkit](https://getuikit.com), which looks slick, but is perhaps more intended for applications. Also there is less support e.g. for colours.

# Maths

For any substantial maths I create PDFs using [Typst](https://typst.app), but for immediately visible maths in the browser I use the javascript library, [KaTeX](https://katex.org). Other libraries exist but Katex is well maintained, popular, and fast.

The Common Markdown parser used by [AWG](awg.html) includes the [dollarmath_plugin](https://mdit-py-plugins.readthedocs.io/en/latest/#mdit_py_plugins.dollarmath.dollarmath_plugin). It produces inline and block maths with the following HTML markup:

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

I put this javascript in the file `/render-maths.js` and load it in the `<head>` tag of the base template. This is also where we load the KaTeX library (both javascript and CSS) from the [jsDelivr CDN](https://cdn.jsdelivr.net):

```HTML
<head>
    ...
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.22/dist/katex.min.css" integrity="sha384-5TcZemv2l/9On385z///+d7MSYlvIEw9FuZTIdZ14vJLqWphw7e7ZPuOiCHJcFCP" crossorigin="anonymous">
    ...
    <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.22/dist/katex.min.js" integrity="sha384-cMkvdD8LoxVzGF/RPUKAcvmm49FQ0oxwDF3BGKtDXcEc+T1b2N+teh/OJfpU0jr6" crossorigin="anonymous"></script>
    ...
    <script defer src="/render-maths.js"></script>
    ...
</head>
```

The result is for markdown such as

```text
For example, inline maths looks like $(x+1)^2 - (x-1)^2 = 4x$, and block maths like

$$
\sum_{k=1}^n { k! \over (1+k)^2 }
$$
```

to be displayed as

> For example, inline maths looks like $(x+1)^2 - (x-1)^2 = 4x$, and block maths like
>
> $$ \sum_{k=1}^n { k! \over (1+k)^2 } $$

# Code

Highlighting code is easy with [highlight.js](https://highlightjs.org). This will colour many different programming languages in any of a number of different themes, expecting HTML markup like

```HTML
<pre>
    <code class="language-python">
        ...python code...
    </code>
</pre>
```

The Common Markdown standard used by [AWG](awg.html) has [fenced code blocks](https://spec.commonmark.org/0.31.2/#fenced-code-blocks) which produces tags with CSS classes exactly like this.

So we just need to pull in the Javascript and chosen theme CSS (in this case, `gruvbox-light-hard`) from a CDN, and ask it to render once the page has loaded. Hence the `<head>` section of the base template contains:

```HTML
<head>
    ...
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@11.9.0/build/styles/gruvbox-light-hard.min.css">
    ...
    <script defer src="https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@11.9.0/build/highlight.min.js" crossorigin="anonymous"></script>
    ...
    <script defer src="/render-code.js"></script>
    ...
</head>
```

and the contents of `/render-code.js` runs the highlighter after all the DOM content is present and correct:

```Javascript
document.addEventListener("DOMContentLoaded", (event) => {
  hljs.highlightAll();
});
```

The highlight colour theme was chosen to be close to my colour theme, but although close the background isn't a perfect match. I fix this with some CSS in `/main.css` (using [CSS custom properties](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_cascading_variables/Using_CSS_custom_properties) to access bulma's derived colours), and also style with a fine border:

```CSS
/* Fix up the style of the code blocks e.g. consistent background colour. */
code.hljs {
    border: 1px solid grey;
    border-radius: 0px;
    background: var(--bulma-primary-95);
}
```

Of course, the above demonstrates the end-result of formatting some HTML and Javascript code.

# Navigation breadcrumb

The navigation breadcrumb works by sub-templating, calling `{{ super() }}` to retain the navigation from above. So the pattern is as follows (ignoring all styling).

```HTML
<!-- This is the base template: /_page.html -->
<nav class="navigation">
    {% block breadcrumb %}
    {% endblock breadcrumb %}
</nav>


<!-- Then in a subclass template in a sub-directory, e.g. /a/_foo.html -->
{% extends "../_page.html" %}

{% block breadcrumb %}
    {{ super() }}
    <a href="/">Home</a>
{% endblock breadcrumb%}


<!-- And then again, e.g. in /a/b/_bar.html -->
{% extends "../_foo.html" %}

{% block breadcrumb %}
    {{ super() }}
    <a href="../index.html">Back to Recreational Maths</a>
{% endblock breadcrumb%}
```

# Manifest and favicons

The [Web Application Manifest](https://www.w3.org/TR/appmanifest/) is a `JSON` file containing metadata about a web application. Although this site is not a web app as such, it improves user experience to use the manifest to document the location of all the favicons and theme colours.

Favicons appear as the icons in browser url bars, tabs, bookmark menus. And also in the "add to home screen" feature of touch screen devices.

So we need to:

- Create a set of favicons, and ensure the colours are coordinated with the colour theme of the website.
- Tell browsers where to find all the favicons, noting that some are expected in "standard" locations anyway.

I created a set of favicons using an online [favicon generator](https://favicon.io/favicon-generator/), using the same primary colours as configured in Bulma. These are all copied into the root (`/`) directory of the site according to the file structure principles described above.

The manifest then points to these favicons, and is itself put in the root directory as `/manifest.json` (see [here](https://github.com/tcorbettclark/tcorbettclark.github.io/blob/master/content/manifest.json)).

Lastly, the base template (in `_base.html`) indicates the principal favicons and the location of the manifest:

```HTML
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" lang="en" xml:lang="en">
    <head>
        ...
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
        <link rel="manifest" href="/manifest.json">
        ...
    </head>
    ...
</html>
```

# Colour, styling, and light/dark mode

Colours are both technical and personal. I found these useful to get started:

- [The HSB Colour System](https://www.learnui.design/blog/the-hsb-color-system-practicioners-primer.html)
- [Colour in UI Design](https://www.learnui.design/blog/color-in-ui-design-a-practical-framework.html)

Then the following helped me experiment with different palettes:

- [Canva colour wheel](https://www.canva.com/colors/color-wheel/)
- [Pixelied colour wheel](https://pixelied.com/colors/color-wheel)
- [ColorHunt](https://colorhunt.co)
- [Coolors.co](https://coolors.co)

One gotcha I encountered was that there are different variants/standards of RGB.

[Bulma](https://bulma.io) has a "customizer" popup built-in to their own website, which allows colours (and other style aspects) to be tried out before exporting as CSS settings. Because it [automatically derives shades](https://bulma.io/documentation/features/color-palettes/), the main task is to decide a Primary colour, a Link colour, and colours for Info, Success, Warning, and Danger.

Bulma also automatically derives and manages the colour variations between light and dark mode. For that to work, one needs to use the "soft" and "bold" colour classes for those elements which should be a function of light/dark mode. For example, I use the `has-background-primary-bold-invert` and `has-text-primary-bold` classes for the main page section. See the [Bulma docs](https://bulma.io/documentation/features/dark-mode/) for details.

Lastly, remember to coordinate the colour choices across the Bulma setting, the manifest, and the favicons.

# Draft / wip mode

TODO

# XML sitemap and the robots.txt file

To support search engine indexing and SEO, the `robots.txt` file and related sitemap file (in `sitemap.xml`) are used to hint to search engines what pages they should index. See Google's descriptions of [robots.txt](https://developers.google.com/search/docs/crawling-indexing/robots/intro) and [sitemaps](https://developers.google.com/search/docs/crawling-indexing/sitemaps/overview).

For this site I just use the `robots.txt` file to point to the sitemap:
```
Sitemap: {{ SITEURL }}/sitemap.xml
```
(the `SITEURL` is set in a template data TOML file).

The `sitemap.xml` file will also be run though Jinja by [AWG](awg.html) because it has an `.xml` extension. Hence it is a template:

```XML
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    {%- for p in SITEMAP_FILENAMES %}
    <url>
        <loc>{{ SITEURL }}/{{ p.name }}</loc>
        <changefreq>{{ p.change_frequency or "monthly" }}</changefreq>
        {%- if p.last_mod %}
        <lastmod>{{ p.last_mod }}</lastmod>
        {%- endif %}
    </url>
    {%- endfor %}
</urlset>
```

(Unlike HTML, XML is not automatically tidied by AWG, hence the few "`{%-`" [whitespace control](https://jinja.palletsprojects.com/en/stable/templates/#whitespace-control) indicators to indent the output.)

The data describing the set of URLs which should be indexed is kept in `_sitemap.toml`. For example:

```toml
[[SITEMAP_FILENAMES]]
name = "index.html"
change_frequency = "monthly"

[[SITEMAP_FILENAMES]]
name = "welcome/index.html"
change_frequency = "weekly"
```

This isn't too cumbersomb to maintain (e.g. by listing all candidates with `ls -1 **.html`). It is also possible to put the different entries in different `.toml` files in respective directories.

# Validation

Iterating with various (free) validation sites makes it easy to check for correctness, best practice, and learn about the web world. For example:

- [Lighthouse](https://developer.chrome.com/docs/lighthouse/overview)
- [W3 Validator](https://validator.w3.org/nu/)
- [MDN's Observatory tool](https://developer.mozilla.org/en-US/observatory)
- [ValidBot](https://www.validbot.com/)

Notable issues I could not address include:

1. The existence of trailing slashes on void elements such as `meta` and `link` tags. These cannot be fixed by hand because [AWG](awg.html) checks and formats all HTML with [HTML Tidy](https://html-tidy.org), produces such trailing slashes. The main concern (see [here](https://wet-boew.github.io/wet-boew-documentation/decision/15.html) and [here](https://github.com/validator/validator/wiki/Markup-»-Void-elements#trailing-slashes)) seems to be that because HTML5 is not XML, and since href arguments don't have to be quoted, there is an ambiguity if the href is the last attribute and the url contains a trailing slash. Compare:
   ```
   <link href=https://foo.bar.baz/>
   <link href="https://foo.bar.baz"/>
   <link href="https://foo.bar.baz/">
   ```
   This isn't a problem so long as we always quote href's.
1. TODO more...

# Security

Primarily I following the findings from MDN's [Observatory tool](https://developer.mozilla.org/en-US/observatory).

## Content Security Policy (CSP)

A [Content Security Policy (CSP)](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CSP) instructs browsers to place restrictions on what loaded code can do. This is to defend against cross-site-scripting (CSS) and clickjacking in which an attacker finds ways to inject malicious code.

A related concept is [SubResource Integrity (SRI)](https://developer.mozilla.org/en-US/docs/Web/Security/Subresource_Integrity), which makes browsers only accept resources when they match the hash contained in the `integrity` attribute. This attribute is notably available on `<script>` and `<link rel="stylesheet">` tags. So SRI helps to prevent security problems from source file tampering.

CSP is configured using the `Content-Security-Policy` HTTP Header. Since this is a static site I use the `http-equiv` meta tag in every HTML file:

```HTML
<meta http-equiv="...name of HTTP Header..." content="...HTTP header contents">
```

My approach is:
- Denying everything by default before adding in permissions as needed.
- Always use SRI, including for local (or `'self'`) files. Note that [AWG](awg.html) provides a Jinja filter to make it easy to generate the hashes (such has sha384) from the source files.
- Check validity using tools such as [CSP Evaluator](https://csp-evaluator.withgoogle.com).

In annotated outline, the CSP is as follows:
```text
default-src 'none';                                 <-- Default fallback is deny
require-trusted-types-for 'script';                 <-- See link below
base-uri 'self';                                    <-- Don't allow the base URL to change
img-src 'self';                                     <-- Only allow images served up from self
manifest-src 'self';                                <-- Only allow manifest served up from self
script-src-elem
    'strict-dynamic'                                <-- Trusted scripts (i.e. javascript) are trusted to use other scripts
    'sha384-kri+HXDJ8qm2+...'                       <-- Trust scripts with the following hashes
    ...etc
    ;
connect-src
    'self'                                          <-- Allow connections to self e.g. for websockets (used by hot reloader)
    https://ka-f.fontawesome.com                    <-- Allow Fontawesome to make connections
    ;
font-src
    https://cdn.jsdelivr.net                        <-- Allow fonts (e.g. for Katex) from jsDelivr CDN
    https://ka-f.fontawesome.com                    <-- Allow Fontawesome fonts
    ;
style-src
    'self'                                          <-- Allow loading of CSS files from self
    https://cdn.jsdelivr.net                        <-- Allow CSS files from jsDelivr CDN
    'sha384-vpayKGwduWhgY...'                       <-- Permit CSS with following hashes (does not seem to do anything!)
    ...etc
    ;
```

(Link for [require-trusted-types-for](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/require-trusted-types-for).)

I discovered a few helpful things along the way:

- Safari does not read `style-src-elem`, but allows it to exist. Chrome does read it. Hence using `style-src`.
- The fallback from say `style-src-elem` to `style-src` to `default-src` does not mean keep trying until one passes, but use the most specific provided.
- The `style-src` section does not do anything with hashes for link files. It neither checks or complains if present. This could be about CSP level 2 vs level 3. See [here](https://stackoverflow.com/questions/77338818/content-security-policy-hashes-for-files-dont-seem-to-work). I've kept the hashes in because I believe it should work like this, and doing so appears harmless.
- If script hashes are provided in `script-src` then SRI must also be used (i.e. the `integrity` attribute set to the hash).
- For both CSS and javascript, if the SRI is present (using the `integrity` attribute), then it is checked and must pass. Hence independently of CSP, SRI seems uniformly implemented.
- Test on different browsers, because (a) they may behave differently, and (b) when things don't work they give different diagnostic information (some more helpful than others).

In practice, using template data reduces maintenance overhead and helps document what is going on and where things are from. For example:

```HTML
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" lang="en" xml:lang="en">
    <head>
        ...
        <meta http-equiv="Content-Security-Policy" content="
            ...
            script-src-elem
                'strict-dynamic'
                '{{ KATEX_JS_SHA }}'
                '{{ FONTAWESOME_JS_SHA }}'
                '{{ HIGHLIGHT_JS_SHA }}'
                'sha384-{{ '/hot-reloader.js' | sha() }}'
                'sha384-{{ '/render-maths.js' | sha() }}'
                'sha384-{{ '/render-code.js' | sha() }}'
                ;
            ...
            style-src
                'self'
                https://cdn.jsdelivr.net
                {%- for sha in FONTAWESOME_INLINE_CSS_SHAs %}
                '{{ sha }}'
                {%- endfor %}
                '{{ BULMA_CSS_SHA }}'
                '{{ KATEX_CSS_SHA }}'
                '{{ GRUVBOX_CSS_SHA }}'
                'sha384-{{ '/main.css' | sha() }}'
                ;
        ">
        ...

        <link rel="stylesheet" type="text/css" href="{{ KATEX_CSS }}" integrity="{{ KATEX_CSS_SHA }}" crossorigin="anonymous">
        ...
        <script defer src="{{ KATEX_JS }}" integrity="{{ KATEX_JS_SHA }}" crossorigin="anonymous"></script>
        ...
        <script defer src="/hot-reloader.js" integrity="sha384-{{ '/hot-reloader.js' | sha() }}" async></script>
        ...
    </head>
    ...
</html>
```

Note:

- The `crossorigin="anonymous"` attribute on the `<link>` and `<script>` tags is needed to make the browser send the appropriate CORS headers to fetch external resources without leaking user credentials - see [here](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Attributes/crossorigin).
- The `sha()` Jinja filter is used to statically compute hashes of local content. It is done in two places for each file: the CSP header and the SRI integrity attribute.
- Jinja variables help show meaning and aid re-use. They are kept in a TOML file, e.g. as follows:

```TOML
# Maths
KATEX_CSS = "https://cdn.jsdelivr.net/npm/katex@0.16.22/dist/katex.min.css"
KATEX_CSS_SHA = "sha384-5TcZemv2l/9On385z///+d7MSYlvIEw9FuZTIdZ14vJLqWphw7e7ZPuOiCHJcFCP"
KATEX_JS = "https://cdn.jsdelivr.net/npm/katex@0.16.22/dist/katex.min.js"
KATEX_JS_SHA = "sha384-cMkvdD8LoxVzGF/RPUKAcvmm49FQ0oxwDF3BGKtDXcEc+T1b2N+teh/OJfpU0jr6"

# Theme for highlight.js
HIGHLIGHT_JS = "https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@11.9.0/build/highlight.min.js"
HIGHLIGHT_JS_SHA = "sha384-F/bZzf7p3Joyp5psL90p/p89AZJsndkSoGwRpXcZhleCWhd8SnRuoYo4d0yirjJp"
GRUVBOX_CSS = "https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@11.9.0/build/styles/base16/gruvbox-light-hard.min.css"
GRUVBOX_CSS_SHA = "sha384-vpayKGwduWhgY00faoPtbmJwz8TjOLnnDuqvy+xWy2DWuIVxIt0dxj0mjrMVPxdd"

# Framework
BULMA_CSS = "https://cdn.jsdelivr.net/npm/bulma@1.0.2/css/bulma.min.css"
BULMA_CSS_SHA = "sha384-tl5h4XuWmVzPeVWU0x8bx0j/5iMwCBduLEgZ+2lH4Wjda+4+q3mpCww74dgAB3OX"

# Fonts
FONTAWESOME_JS = "https://kit.fontawesome.com/39e34b83e1.js"
FONTAWESOME_JS_SHA = "sha384-yTB2wx6UBfG/vVmw00WOL5kU63/nWDZTw1KXg6BapzYP+xoYMMDemsecEoIJEK5h"
FONTAWESOME_INLINE_CSS_SHAs = [ # Fontawesome subsequently uses inline resources.
    "sha256-E2q5uhm+T8+yRPO91kGFCPrb999m9YzwEB9sWmKzTwk=",
    "sha256-xyO8S5xWOAtczCCfbCiMJgKOLsrQ0neV9mX7Aan06aw=",
    "sha256-bi2K0pOjkFvwpWy9QI9qM3EUJiA+VcVJ5GGZIwSEFhQ=",
    "sha256-0Y0YoXQ0nmYkphSjq+iyr2TWsiF2CUw7gsn8mpwIUog=",
]
```



# Deployment on GitHub pages

It is easy and convenient to host static content on [GitHub pages](https://pages.github.com).

One can either use files from a git branch, the root directory of the repository, or a directory called `docs/`. It would be nice to be able to use a different directory name, but so be it. I just use the `docs/` directory on the master branch.

A custom domain can be used by creating a `CNAME` file containing the full domain (in my case, `www.corbettclark.com`).

The default GitHub action detects code commits and deploys on their infrastructure, making the result visible within a couple of minutes (often faster).

As I'm the only person making changes, I mostly dispense with creating a branch and making a pull request to myself ([GitHub flow](https://docs.github.com/en/get-started/using-github/github-flow)), but instead just make a number of meaningful commits locally. Then when ready to publish, I git push to GitHub. In short, my workflow is:

- Start up [AWG](awg.html) with `./awg.py content/ docs/`
- Repeat until ready to publish:
  - Make changes and check in local browser without leaving my editor (because of hot reload).
  - Commit locally using git.
- Git push to GitHub.
- After a minute or so, check the changes have reached live ok.
