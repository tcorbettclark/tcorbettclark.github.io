#!/usr/bin/env python3
"""Check the student-facing EPQ project outlines against the boards' rules.

This is a tool for the people writing the pack, not for students. It does not
grade a project and it does not produce a verdict: it produces a list of
potential issues, with the sentence that prompted each one, why it matters and
a suggested change.

Two layers:

  * text   - deterministic checks over the markdown (does the pack mention the
             production log, ethics, AI policy?), plus cross-document
             similarity, so that two outlines that would produce the same
             artefact are visible.
  * judge  - the judgement rules in rules.toml, put to an LLM one document at a
             time. The model must quote the document; quotes are checked
             against the source and marked when they cannot be found.

Usage
    python3 tools/epq-verifier/run.py                  # text checks only
    python3 tools/epq-verifier/run.py --judge          # text + LLM (default model)
    python3 tools/epq-verifier/run.py --judge none     # text only
    python3 tools/epq-verifier/run.py --only a1        # one document

The LLM needs PI_OLLAMA_KEY (or OLLAMA_API_KEY) in the environment.
"""

from __future__ import annotations

import argparse
import json
import os
import pathlib
import re
import sys
import time
import tomllib
import urllib.error
import urllib.request

DEFAULT_DOCS = "content/lt/epq/projects"
# The pack is the six outlines plus the pages that carry the guidance they are
# allowed to leave out. Those pages are always there, so they are read
# unconditionally: there is nothing to configure.
PACK_PAGES = (
    "content/lt/epq/prerequisites/_content.md",   # kit, ethics, hours, board rules
    "content/lt/epq/projects/_content.md",        # the collection's own page
)
DEFAULT_RULES = "tools/epq-verifier/rules.toml"
DEFAULT_OUT = "tools/epq-verifier/reports/issues.md"
API = "https://ollama.com/v1/chat/completions"
DEFAULT_MODEL = "deepseek-v4.1-flash"
SEVERITY_ORDER = {"high": 0, "med": 1, "low": 2}


# ---------------------------------------------------------------- loading


def load_rules(path: pathlib.Path) -> list[dict]:
    with path.open("rb") as f:
        data = tomllib.load(f)
    rules = data.get("rule", [])
    for r in rules:
        r.setdefault("scope", "doc")
        r.setdefault("check", "judge")
        assert r["check"] in ("judge", "text"), r["id"]
        assert r["severity"] in SEVERITY_ORDER, r["id"]
    return rules


def load_docs(root: pathlib.Path) -> dict[str, dict]:
    """One entry per project page: slug, title (its h1), text."""
    docs = {}
    for md in sorted(root.glob("*/_content.md")):
        text = md.read_text(encoding="utf8")
        title = next(
            (ln[2:].strip() for ln in text.splitlines() if ln.startswith("# ")),
            md.parent.name,
        )
        docs[md.parent.name] = {"title": title, "text": text}
    return docs


# ---------------------------------------------------------------- text layer


def text_issues(rules: list[dict], docs: dict[str, dict], extra: str = "") -> list[dict]:
    pack_text = "\n\n".join(d["text"] for d in docs.values()) + "\n\n" + extra
    out = []
    for rule in rules:
        if rule["check"] != "text":
            continue
        spec = rule["text"]
        patterns = spec["all"] if "all" in spec else [spec["pattern"]]
        expect_present = spec.get("expect", "present") == "present"

        def matches(text: str) -> bool:
            return all(re.search(p, text) for p in patterns)

        if rule["scope"] == "pack":
            found = matches(pack_text)
            if found != expect_present:
                out.append(
                    {
                        "rule": rule,
                        "doc": None,
                        "quote": "",
                        "why": rule["why"],
                        "fix": rule["fix"],
                        "note": "whole pack",
                    }
                )
            continue
        for slug, doc in docs.items():
            found = matches(doc["text"])
            if found != expect_present:
                out.append(
                    {"rule": rule, "doc": slug, "quote": "", "why": rule["why"],
                     "fix": rule["fix"], "note": ""}
                )
    return out


def similarity(docs: dict[str, dict], k: int = 6, threshold: float = 0.12) -> list[str]:
    """Jaccard overlap of k-word shingles: catches outlines that would produce
    the same artefact, not just the same wording."""

    def shingles(text: str) -> set[str]:
        words = re.findall(r"[a-z0-9]+", text.lower())
        return {" ".join(words[i : i + k]) for i in range(len(words) - k + 1)}

    sets = {slug: shingles(d["text"]) for slug, d in docs.items()}
    out = []
    slugs = sorted(sets)
    for i, a in enumerate(slugs):
        for b in slugs[i + 1 :]:
            inter = len(sets[a] & sets[b])
            if not inter:
                continue
            score = inter / len(sets[a] | sets[b])
            if score >= threshold:
                out.append(
                    f"{a} and {b}: {score:.0%} of six-word runs in common "
                    f"({inter:,} shared)."
                )
    return out


# ---------------------------------------------------------------- judge layer


def judge_prompt(rule: dict) -> str:
    return (
        f"- id: {rule['id']} ({rule['severity']})\n"
        f"  title: {rule['title']}\n"
        f"  question: {rule['question']}\n"
        f"  why it matters: {rule['why']}\n"
    )


SYSTEM = """You are reviewing a student-facing project outline for a UK Extended \
Project Qualification (EPQ), on behalf of the people writing the guidance, not \
for the student.

Your job is narrow: identify places where the outline could lead a student into \
a practice that would cost them marks or fail moderation. Many findings are \
about what the text *implies* to a 17-year-old, not just what it says.

Rules:
- Report an issue only where the document gives you a specific sentence to \
quote. If the outline handles a point adequately, say nothing about it.
- Every quote must be copied verbatim from the document, one sentence or clause.
- Do not invent rules. Use only the ids given.
- Be willing to report many issues; false alarms are cheap here, a missed one \
is not.
- Do not give an overall verdict or score; only the list of issues.

Reply with JSON and nothing else:
{"issues": [{"rule": "<id>", "quote": "<verbatim>", "why": "<why it is a \
problem here, in one or two sentences>", "fix": "<a concrete suggested change, \
one or two sentences>"}]}"""


def call_model(model: str, system: str, user: str, retries: int = 3) -> tuple[str, dict]:
    key = os.environ.get("PI_OLLAMA_KEY") or os.environ.get("OLLAMA_API_KEY")
    if not key:
        raise SystemExit("No PI_OLLAMA_KEY / OLLAMA_API_KEY in the environment.")
    body = {
        "model": model,
        "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
        "temperature": 0,
        "stream": False,
    }
    data = json.dumps(body).encode()
    for attempt in range(retries):
        req = urllib.request.Request(
            API,
            data=data,
            headers={"Content-Type": "application/json", "Authorization": f"Bearer {key}"},
        )
        try:
            with urllib.request.urlopen(req, timeout=600) as r:
                payload = json.load(r)
            return payload["choices"][0]["message"]["content"], payload.get("usage", {})
        except (urllib.error.URLError, TimeoutError, KeyError, json.JSONDecodeError) as e:
            if attempt == retries - 1:
                raise
            print(f"    retrying after {e}", file=sys.stderr)
            time.sleep(2 * (attempt + 1))
    raise SystemExit("unreachable")


def parse_issues(raw: str) -> list[dict]:
    raw = raw.strip()
    raw = re.sub(r"^```(?:json)?\s*|\s*```$", "", raw)
    start, end = raw.find("{"), raw.rfind("}")
    if start == -1 or end == -1:
        return []
    try:
        return json.loads(raw[start : end + 1]).get("issues", [])
    except json.JSONDecodeError:
        return []


def quote_present(quote: str, text: str) -> bool:
    norm = lambda s: re.sub(r"\s+", " ", s).strip().strip("“”\"'").lower()
    q = norm(quote)
    return len(q) > 15 and q in norm(text)


def judge_issues(
    rules: list[dict], docs: dict[str, dict], model: str
) -> tuple[list[dict], dict]:
    judge_rules = [r for r in rules if r["check"] == "judge"]
    by_id = {r["id"]: r for r in judge_rules}
    out, usage = [], {}
    for slug, doc in docs.items():
        print(f"  judging {slug} ...", file=sys.stderr)
        user = (
            "The rules to apply:\n\n"
            + "\n".join(judge_prompt(r) for r in judge_rules)
            + "\n\n--- DOCUMENT BEGINS ---\n\n"
            + doc["text"]
        )
        raw, used = call_model(model, SYSTEM, user)
        for k, v in used.items():
            if isinstance(v, int):
                usage[k] = usage.get(k, 0) + v
        for item in parse_issues(raw):
            rule = by_id.get(str(item.get("rule", "")).strip())
            if not rule:
                continue
            quote = (item.get("quote") or "").strip()
            out.append(
                {
                    "rule": rule,
                    "doc": slug,
                    "quote": quote,
                    "why": (item.get("why") or rule["why"]).strip(),
                    "fix": (item.get("fix") or rule["fix"]).strip(),
                    "note": "" if quote_present(quote, doc["text"]) else "quote not found in source",
                }
            )
    return out, usage


# ---------------------------------------------------------------- report


def render(issues: list[dict], docs: dict[str, dict], sim: list[str], args, usage) -> str:
    issues.sort(key=lambda i: (SEVERITY_ORDER[i["rule"]["severity"]], i["rule"]["id"]))
    by_doc: dict[str, list[dict]] = {slug: [] for slug in docs}
    cross = []
    for i in issues:
        if i["doc"] is None:
            cross.append(i)
        else:
            by_doc[i["doc"]].append(i)

    total = len(issues)
    high = sum(1 for i in issues if i["rule"]["severity"] == "high")
    out = [
        "# Potential issues in the EPQ project outlines",
        "",
        "Generated by `tools/epq-verifier/run.py`. This is not a verdict: it is a list of",
        "places where an outline could be read as endorsing a practice that would cost a",
        "student marks, or that a moderator would query.",
        "",
        f"- {len(docs)} outlines checked against {args.n_rules} rules "
        f"({args.n_judge} judged, {args.n_text} text).",
        f"- {total} potential issues ({high} high severity).",
        "- Rules that are about the pack as a whole also read its prerequisites page.",
        f"- Judge: `{args.judge}`" + (f", {usage.get('total_tokens', 0):,} tokens." if usage else "."),
        "",
    ]
    if cross or sim:
        out += ["## Across the whole pack", ""]
        for i in cross:
            out += issue_block(i)
        if sim:
            out += ["### Overlapping outlines", "", "Pairs whose wording overlaps enough that",
                    "students could end up producing the same artefact:", ""]
            out += [f"- {s}" for s in sim] + [""]

    for slug, doc in docs.items():
        items = by_doc[slug]
        out += [f"## {slug}", "", f"*{doc['title']}*", ""]
        if not items:
            out += ["No potential issues found by these rules.", ""]
            continue
        for i in items:
            out += issue_block(i)
    out += [
        "## Rules that produced nothing",
        "",
        "If a rule is silent across all six outlines, the outline is probably fine on that",
        "point, or the rule is badly worded. Worth a look either way:",
        "",
    ]
    fired = {i["rule"]["id"] for i in issues}
    silent = sorted({r["id"] for r in args.rules if r["id"] not in fired})
    out += [f"- `{rid}`" for rid in silent] or ["- none"]
    out.append("")
    return "\n".join(out)


def issue_block(i: dict) -> list[str]:
    r = i["rule"]
    lines = [f"### {r['id']} — {r['title']}", "", f"*{r['severity']} · {r['group']}*"
             + (f" · {i['note']}" if i["note"] else ""), ""]
    if i["quote"]:
        lines += [f"> {i['quote']}", ""]
    lines += [f"**Why:** {i['why']}", "", f"**Suggested:** {i['fix']}", "",
              f"<sub>{r['source']} — {r['locator']}: “{r['quote']}”</sub>", ""]
    return lines


# ---------------------------------------------------------------- main


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--docs", default=DEFAULT_DOCS)
    ap.add_argument("--rules", default=DEFAULT_RULES)
    ap.add_argument("--out", default=DEFAULT_OUT)
    ap.add_argument("--judge", default=DEFAULT_MODEL,
                    help="model name, or 'none' for the text checks only")
    ap.add_argument("--only", default=None, help="substring of a document name")
    ap.add_argument("--threshold", type=float, default=0.12)

    args = ap.parse_args()
    args.rules = load_rules(pathlib.Path(args.rules))
    args.n_judge = sum(1 for r in args.rules if r["check"] == "judge")
    args.n_text = sum(1 for r in args.rules if r["check"] == "text")
    args.n_rules = len(args.rules)

    docs = load_docs(pathlib.Path(args.docs))
    if args.only:
        docs = {k: v for k, v in docs.items() if args.only in k}
    if not docs:
        raise SystemExit(f"No outlines found in {args.docs}")

    print(f"{len(docs)} outlines, {args.n_rules} rules", file=sys.stderr)
    pack_pages = [pathlib.Path(f) for f in PACK_PAGES]
    extra = "\n\n".join(p.read_text(encoding="utf8") for p in pack_pages if p.exists())
    issues = text_issues(args.rules, docs, extra)
    usage = {}
    if args.judge.lower() != "none":
        judged, usage = judge_issues(args.rules, docs, args.judge)
        issues += judged

    sim = similarity(docs, threshold=args.threshold)

    out = pathlib.Path(args.out)
    out.parent.mkdir(parents=True, exist_ok=True)
    args.pack_seen = [str(p) for p in pack_pages if p.exists()]
    out.write_text(render(issues, docs, sim, args, usage), encoding="utf8")
    print(f"{len(issues)} potential issues -> {out}", file=sys.stderr)


if __name__ == "__main__":
    main()
