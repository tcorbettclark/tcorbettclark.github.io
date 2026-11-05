# EPQ outline checker

A tool for the people writing this pack, not for students. It looks at the six
project outlines in `content/lt/epq/projects/` and reports places where a
student could read them as endorsing a practice that would cost them marks, or
that a moderator would query.

The six outlines are examples meant to inspire, not instructions to follow, and
the rules are written to respect that. A per-outline rule never asks "does this
say enough?" - an example may leave anything out. It asks only: **could a
student read this sentence and infer a practice that would cost them marks?**
Completeness is a property of the pack, so it is checked once, against the six
outlines plus the prerequisites page and the collection's own page. That is not
a setting: those pages are always part of the pack and are always read.

It does **not** grade a project, score an outline, or return a verdict. The
boards assess candidates, not guidance.

## Running it

```sh
python3 tools/epq-verifier/run.py                       # text checks only
python3 tools/epq-verifier/run.py --judge               # text + LLM
python3 tools/epq-verifier/run.py --only b1             # one outline
```

The judge needs `PI_OLLAMA_KEY` (or `OLLAMA_API_KEY`) and calls
`https://ollama.com/v1/chat/completions`. The default model is
`deepseek-v4.1-flash`; pass `--judge none` to skip it and keep the run free.
One outline takes about a minute; the six take about five.

Output is `tools/epq-verifier/reports/issues.md`.

## How it works

Two layers, both driven by `rules.toml`:

- **text** — deterministic regex checks. Either per document or, with
  `scope = "pack"`, across the outlines plus `PACK_PAGES`. There is also a
  shingle-overlap pass that flags two outlines likely to produce the same
  artefact.
- **judge** — the judgement rules, one LLM call per outline. The model must
  quote the document verbatim; the quote is checked against the source and the
  issue is marked *quote not found in source* when it cannot be. That is the
  main defence against invented findings, so do not remove it.

## The ruleset is the artefact

`rules.toml` carries, for each rule, the board source, the section, a short
verbatim quote, the question put to the judge, why it matters, and a suggested
fix. A rule that cannot be traced to a published requirement should not be
added: this tool exists to check our guidance against the boards, not to impose
our taste.

AQA 7993 is the spine (23,543 EPQ entries in June 2024, far more than any other
board). The rules are written so that they hold for Edexcel, OCR (H857) and
WJEC/Eduqas too, except where the text says otherwise.

## Keeping it current

Board documents are revised. When one is reissued, update the `source`,
`locator` and `quote` of the affected rules; the rest of the file can stay.
Known versions at the time of writing:

- AQA 7993, teaching from September 2020; AQA EPQ AI guidance, 2025
- Pearson Edexcel Level 3 Extended Project, Issue 4 (2023)
- OCR H857, version 2.2 (October 2026)
- WJEC Level 3 Extended Project, version 2 (April 2023)

## Adding a rule

Decide first where it belongs. If you want to know whether *an outline* could
mislead a reader, it is a `scope = "doc"` rule and the question has to be about
a sentence in that outline. If you want to know whether *the pack* says
something at all, it is `scope = "pack"` and it should fire once, not six
times - duplicated completeness findings are what made the first version of
this tool noisy.

## What it deliberately does not do

- Judge whether a *student's* project will score well; it cannot, and neither
  can an LLM.
- Check the teaching strands or the contents page. Point `--docs` elsewhere if
  you want that.
- Edit anything under `content/`. Findings are for a human to act on.
