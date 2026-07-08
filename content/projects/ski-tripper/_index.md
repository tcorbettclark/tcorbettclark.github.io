<!-- vale Microsoft.FirstPerson = NO -->
<!-- vale Microsoft.We = NO -->
<!-- vale Microsoft.Headings = NO -->
<!-- vale Microsoft.Quotes = NO -->

[Ski Tripper](https://ski-tripper.com) is a web application that helps a ski group find and agree on a great ski destination without the "entertaining" chaos of a WhatsApp debate.

See the project's [GitHub repository](https://github.com/tcorbettclark/ski-tripper) for details.
Below is just a brief overview.

## What is it?

Built-in AI uses everyone’s ski holiday preferences to guide searches of an enriched catalogue of resorts, and to generate narrative assessments on who will (or won’t) enjoy a resort.
Everyone creates proposals and enters them into voting rounds to reach a collective decision.
Rinse and repeat.

## Why did I build it?

At a technical level, I created it to gain hands-on experience with LLMs.
Although a small application, it exercises the full stack and lifecycle so gives me ideas about how AI should be used on serious, large-scale software projects.
In particular, it covers:

- The frontend (essentially [React](https://react.dev/)).
- The backend (small TypeScript server and [pocketbase](https://pocketbase.io/)).
- Full set of unit tests and end-to-end tests (using [Playwright](https://playwright.dev/)).
- Fully automated server build, configuration and deployment to [DigitalOcean](https://www.digitalocean.com/) (using [xec](https://github.com/tcorbettclark/xec)).

## How was AI used?

LLM and related technologies were used throughout the project:

1. To **build the application**. I experimented with a number of agentic tools, models, local or cloud-based providers, and configurations (skills, MCPs, etc), settling on [OpenCode](https://opencode.ai/) and open source models running in [Ollama cloud](https://ollama.com/) so I can track new models and updates. Much of ski-tripper was written with the help of [GLM5.1](https://huggingface.co/THUDM/glm-5.1).
2. To **create a rich catalogue of resorts with standardised fields and descriptions**. This involves a pipeline which seeds a list, enriches from qualified sources, assesses quality, and fixes inconsistencies using an independent model.
3. To **make it easier for users to search the catalogue of resorts**. An [embedding model](https://huggingface.co/Xenova/multi-qa-MiniLM-L6-cos-v1) is used to one-time create embeddings for each resort as part of catalogue generation, and then the same model is used again in the client browser to quickly find similar resorts.
4. To **generate resort search text from participant preferences**. An LLM is fed everyone's preferences and instructed to generate search text to run against the embedding model (previous), and so make it easier to find candidate resorts the group will enjoy.
5. To **assess a proposal against the likes/dislikes of the participants**. An LLM is used to create a narative assessment of the match between a proposal and the likes/dislikes of the participants, trying to identify who would especially like a resort and who might find it less appealing.
6. To **automate the testing of the applicaton UI** by performing user interactions using a headless browser, looking for bugs and increasing confidence that the application behaves in a reasonable way.
