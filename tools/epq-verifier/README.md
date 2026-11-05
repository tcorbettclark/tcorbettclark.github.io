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
python3 tools/epq-verifier/run.py --judge               # text + LLM, two runs each
python3 tools/epq-verifier/run.py --only b1             # one outline
python3 tools/epq-verifier/run.py --changed HEAD~1      # only what you edited
python3 tools/epq-verifier/run.py --only b1 --only c1   # two of them
```

Progress is logged to stderr with a timestamp and elapsed seconds, so a slow
run is never a silent one. The report goes to a file; nothing is printed to
stdout.

Useful flags:

| flag | what it does |
|---|---|
| `--only CODE` | one outline (`a1`, `b2`, or any part of its name); repeatable |
| `--changed REF` | only outlines whose `_content.md` changed since a git ref |
| `--runs N` | opinions per outline (default 2); only findings in **all** runs are reported |
| `--jobs N` | outlines judged at once (default 4) |
| `--reasoning LEVEL` | `none`, `low` (default), `high`, `max`, or `default` to send nothing |
| `--no-cache` | ignore cached judgements |

## The judgement cache

One opinion is a function of the request, so that is what the cache key is:

- the endpoint and the request parameters (temperature)
- the model and its thinking level
- the ruleset, including each rule's question, why and suggested fix
- the judge's system prompt
- which document, and which of the two runs
- the document's text, in full

Same inputs, same answer, no call. Edit one outline and you pay for that outline
only; edit a rule and the cached opinions for it are dead, because the ruleset
is in the key. `CACHE_VERSION` in `run.py` is there for the case where the shape
of an entry changes: bump it and old entries are ignored rather than trusted.

The cache lives in `reports/.judge-cache.json` (not committed) and is pruned
only by `--clear-cache`. Each run logs how many opinions came from the cache and
how many calls it made.

It does mean a report is reproducible rather than fresh: two cached opinions are
frozen until the text or the rules change. `--no-cache` buys new eyes at the
cost of a call.

`deepseek-v4.1-flash` reasons by default. On one outline, `--reasoning low` took
12 s and 41 s across two runs; `none` is faster and worse, `high` and `max`
cost several times as much. Because it thinks, the same document can yield
different findings on two runs — hence `--runs 2` and the intersection.

The judge needs `PI_OLLAMA_KEY` (or `OLLAMA_API_KEY`) and calls
`https://ollama.com/v1/chat/completions`. The default model is
`deepseek-v4.1-flash`; pass `--judge none` to skip it and keep the run free.
One outline takes about a minute; the six take about five.

Output is `tools/epq-verifier/reports/issues.md`.

## How it works

The judge reads each outline as the student sees it: the markdown plus the
"What this project needs" block from the page template, so the page is not
marked down for a requirement it states in its header.

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
