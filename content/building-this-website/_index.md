This website is built using my own[^1] static site generator.  My justification for "reinventing the wheel" is as follows:

- I personally enjoy the deeper understanding that comes from creation;
- I want full control to make the result clean and well-crafted at both the human and technical levels;
- I only need some of the features possible in a static site, and don't wish to be distracted by scattered evidence of the unused;
- My experience of static site generation tools over the years always revealed a porous interface between the tool and the content, requiring me to work and think on "both sides". So for me at least, the boundary should either be abandoned entirely or moved substantially.

I've chosen to position the boundary so that the build tool has minimal[^2] opinion of web technologies and content structure. This makes the choice of web technology explicit, with freedom to upgrade, refactor, or remove over time; and the fundamental content is easy to write, (re)organise, and maintain. Hence:

- [AWG tool](awg.html) explains what the tool does, what it doesn't do, and how it works;
- [Content approach](approach.html) provides a systematic walk-through of how I structure the content, my choice of web framework and libraries, how I generate the sitemap, notes to achieve colour consistency, publishing on GitHub pages, checking and achieving validity and reasonable security, etc;
- The content (primarily markdown files) can be found in the [source repository](https://github.com/tcorbettclark/tcorbettclark.github.io/tree/master/content).

[^1]: Yes, another one - see [this list](https://jamstack.org/generators/) for example.
[^2]: As explained later, the strongest coupling comes from the use of Markdown.
