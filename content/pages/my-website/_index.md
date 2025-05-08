This website is built using my own static site generator. Yes, another one - see [this list](https://jamstack.org/generators/) for example. My justification for "reinventing the wheel" is that:

- I personally enjoy the deeper understanding which comes from creation;
- I want full control to make the result clean and right at both the human and technical level;
- I only need some of the features possible in a static site, and don't wish to be distracted by scattered evidence of the unused;
- In my experience of other static site generation tools over the years, I found an **uneven (personal?) interface between the tool and the content, and always had to work and think on "both sides"**. So for me at least, the boundary should either be abandoned entirely or moved substantially.

I've chosen to move the boundary so that the build tool has essentially no opinion of web technologies and content structure, allowing the choice of web technologies to be flexible, explicit, and transparent, and the fundamental content easy to write and maintain. Hence,

- see [my twg tool](twg.html) to understand what it does (and does not) do, and how it works;
- see [my content approach](approach.html) for a systematic walk-through of how I structured the content, my choice of web framework, libraries, generating the sitemap, notes to achieve colour consistency, publishing on GitHub pages, checking and achieving validity and reasonable security, etc;
- leaving the content itself to be found in the [source repository](https://github.com/tcorbettclark/tcorbettclark.github.io) for this site, consisting almost entirely of markdown files.
