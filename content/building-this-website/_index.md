This website is built using my own static site generator[^1].  My justification for "reinventing the wheel" is that:

- I personally enjoy the deeper understanding which comes from creation;
- I want full control to make the result clean and right at both the human and technical level;
- I only need some of the features possible in a static site, and don't wish to be distracted by scattered evidence of the unused;
- From my experience of using static site generation tools over the years, I found a porous interface between the tool and the content, and always had to work and think on "both sides". So for me at least, the boundary should either be abandoned entirely or moved substantially.

I've chosen to move the boundary so that the build tool has minimal opinion of web technologies[^2] and content structure. That makes explicit the use of web technologies, with complete freedom of choice and ability to upgrade/refactor etc; and the fundamental content is easy to (re)organise, write, and maintain.

Hence,

- see my [AWG tool](awg.html) to understand what it does, what it doesn't do, and how it works;
- see my [content approach](approach.html) for a systematic walk-through of how I structured the content, my choice of web framework and libraries, how I generate the sitemap, notes to achieve colour consistency, publishing on GitHub pages, checking and achieving validity and reasonable security, etc;
- leaving the content (mostly markdown files) to be found in the [source repository](https://github.com/tcorbettclark/tcorbettclark.github.io/tree/master/content) for this website.

[^1]: Yes, another one - see [this list](https://jamstack.org/generators/) for example.
[^2]: As explained later, the strongest coupling comes from the use of Markdown.
