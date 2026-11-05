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
import concurrent.futures
import hashlib
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
CACHE = "tools/epq-verifier/reports/.judge-cache.json"
# Bump when the shape of a cached entry or its key changes, so old entries are
# ignored rather than silently trusted.
CACHE_VERSION = "1"
API = "https://ollama.com/v1/chat/completions"
DEFAULT_MODEL = "deepseek-v4.1-flash"
SEVERITY_ORDER = {"high": 0, "med": 1, "low": 2}
# Sent with every request; part of the cache key, because changing one of them
# would make a cached opinion stale.
REQUEST_PARAMS = {"temperature": 0, "stream": False}
START = time.time()


def log(message: str) -> None:
    """Progress on stderr, with a timestamp and elapsed seconds.

    The report is written to a file, so stdout stays empty and this is what you
    watch while a run is going.
    """
    elapsed = time.time() - START
    print(f"[{elapsed:6.1f}s] {message}", file=sys.stderr, flush=True)


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


NEEDS_LABELS = {
    "programming": "Programming",
    "machine": "Machine",
    "software": "Software",
    "downloads": "Downloads",
}


def needs_block(outline: pathlib.Path) -> str:
    """The "what this project needs" block, as the student sees it.

    Each outline declares its requirements in `_needs.toml` beside its page;
    awg.py makes those values template globals. Reading only `_content.md`
    would hide the one part of the page that answers "can I even run this?",
    so the judge is given it too.
    """
    path = outline / "_needs.toml"
    if not path.exists():
        log(f"{outline.name}: no _needs.toml - the needs block will be empty")
        return ""
    with path.open("rb") as f:
        data = tomllib.load(f)
    table = next((v for v in data.values() if isinstance(v, dict)), {})
    missing = [k for k in NEEDS_LABELS if not table.get(k)]
    if missing:
        log(f"{outline.name}: _needs.toml is missing {', '.join(missing)}")
    rows = [f"- {NEEDS_LABELS[k]}: {table[k]}" for k in NEEDS_LABELS if table.get(k)]
    if not rows:
        return ""
    return "What this project needs\n" + "\n".join(rows) + "\n\n"


def load_docs(root: pathlib.Path) -> dict[str, dict]:
    """One entry per project page: slug, title (its h1), text."""
    docs = {}
    for md in sorted(root.glob("*/_content.md")):
        text = needs_block(md.parent) + md.read_text(encoding="utf8")
        title = next(
            (ln[2:].strip() for ln in text.splitlines() if ln.startswith("# ")),
            md.parent.name,
        )
        docs[md.parent.name] = {"title": title, "text": text}
    return docs


def changed_since(docs_dir: str, ref: str, docs: dict[str, dict]) -> dict[str, dict]:
    """Only the outlines whose markdown changed since `ref`, by git."""
    import subprocess

    try:
        out = subprocess.run(
            ["git", "diff", "--name-only", ref, "--", docs_dir],
            capture_output=True, text=True, check=True,
        ).stdout
    except (subprocess.CalledProcessError, FileNotFoundError) as e:
        raise SystemExit(f"git diff {ref} failed: {e}") from e
    touched = {
        line.split("/")[-2] for line in out.splitlines() if line.endswith("_content.md")
    }
    log(f"changed since {ref}: {', '.join(sorted(touched)) or 'nothing'}")
    return {k: v for k, v in docs.items() if k in touched}


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


def call_model(
    model: str, system: str, user: str, reasoning: str = "low", retries: int = 3
) -> tuple[str, dict]:
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
    if reasoning and reasoning != "default":
        # deepseek-v4.1-flash supports none | low | high | max. "default" sends
        # nothing and lets the provider choose.
        body["reasoning_effort"] = reasoning
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


# Words that, if the quote already contains them, mean the judge is pointing at
# the remedy as though it were the fault.
REMEDY_CUES = (
    "not the submission", "rather than", "check", "think about", "consider",
    "your supervisor", "your centre", "your board", "is not necessarily",
    "you could", "you might", "for example", "such as",
)


def self_defeating(quote: str, fix: str, why: str) -> bool:
    """True when the quoted sentence already says what the finding asks for."""
    q = quote.lower()
    if not q:
        return False
    cues = [c for c in REMEDY_CUES if c in q]
    if not cues:
        return False
    # The finding is self-defeating only if the remedy adds nothing the quote
    # does not already mention.
    asked = set(re.findall(r"[a-z]{5,}", fix.lower()))
    already = set(re.findall(r"[a-z]{5,}", q))
    return len(asked - already) <= 2


def rules_key(rules: list[dict]) -> str:
    blob = json.dumps(rules, sort_keys=True).encode()
    return hashlib.sha256(blob).hexdigest()[:16]


def load_cache(path: pathlib.Path) -> dict:
    if path.exists():
        try:
            return json.loads(path.read_text())
        except json.JSONDecodeError:
            return {}
    return {}


def judge_once(args, rules, by_id, slug, doc, run_index, cache) -> tuple[list[dict], dict]:
    """One opinion on one document, cached by everything that could change it."""
    user = (
        "The rules to apply:\n\n"
        + "\n".join(judge_prompt(r) for r in rules)
        + "\n\n--- DOCUMENT BEGINS ---\n\n"
        + doc["text"]
    )
    # Everything that can change the answer: the endpoint and request
    # parameters, the model and its thinking level, the rules, the system
    # prompt, which document, which of the two runs, and the document's text.
    key = hashlib.sha256(
        "|".join(
            [
                CACHE_VERSION,
                API,
                json.dumps(REQUEST_PARAMS, sort_keys=True),
                args.judge,
                args.reasoning,
                rules_key(rules),
                hashlib.sha256(SYSTEM.encode()).hexdigest()[:12],
                slug,
                str(run_index),
                hashlib.sha256(doc["text"].encode()).hexdigest(),
            ]
        ).encode()
    ).hexdigest()[:24]

    args.cache_misses += 1
    if key in cache and not args.no_cache:
        args.cache_hits += 1
        log(f"{slug} run {run_index + 1}/{args.runs}: cached, "
            f"{len(cache[key])} finding(s) - no call")
        return [dict(i, rule=by_id[i["rule"]], doc=slug) for i in cache[key]], {}

    t0 = time.time()
    log(f"{slug} run {run_index + 1}/{args.runs}: asking {args.judge} "
        f"(reasoning={args.reasoning}) ...")
    raw, usage = call_model(args.judge, SYSTEM, user, reasoning=args.reasoning)
    issues, dropped = [], 0
    for item in parse_issues(raw):
        rule = by_id.get(str(item.get("rule", "")).strip())
        if not rule:
            continue
        quote = (item.get("quote") or "").strip()
        why = (item.get("why") or rule["why"]).strip()
        fix = (item.get("fix") or rule["fix"]).strip()
        if self_defeating(quote, fix, why):
            dropped += 1
            continue
        issues.append({
            "rule": rule["id"], "quote": quote, "why": why, "fix": fix,
            "note": "" if quote_present(quote, doc["text"]) else "quote not found in source",
        })

    cache[key] = issues
    tokens = usage.get("total_tokens", 0)
    log(f"{slug} run {run_index + 1}/{args.runs}: {len(issues)} findings"
        + (f", {dropped} self-defeating dropped" if dropped else "")
        + f", {time.time() - t0:.0f}s, {tokens:,} tokens")
    return [dict(i, rule=by_id[i["rule"]], doc=slug) for i in issues], usage


def find_key(issue):
    """What makes two runs agree: the same rule, on the same sentence."""
    norm = re.sub(r"\s+", " ", issue["quote"]).strip().lower()
    return (issue["rule"]["id"], norm)


def judge_issues(args, rules, docs, cache) -> tuple[list[dict], dict]:
    judge_rules = [r for r in rules if r["check"] == "judge"]
    by_id = {r["id"]: r for r in judge_rules}
    usage: dict = {}

    tasks = [(slug, run) for slug in docs for run in range(args.runs)]
    log(f"{len(docs)} document(s) x {args.runs} run(s) = {len(tasks)} call(s), "
        f"{args.jobs} at a time")

    results: dict[tuple[str, int], list[dict]] = {}
    with concurrent.futures.ThreadPoolExecutor(max_workers=args.jobs) as pool:
        futures = {
            pool.submit(judge_once, args, judge_rules, by_id, slug, docs[slug], run, cache): (slug, run)
            for slug, run in tasks
        }
        for future in concurrent.futures.as_completed(futures):
            slug, run = futures[future]
            try:
                issues, used = future.result()
            except Exception as e:  # noqa: BLE001 - report and stop
                log(f"{slug} run {run + 1} failed: {e}")
                raise SystemExit(1) from e
            results[(slug, run)] = issues
            for k, v in used.items():
                if isinstance(v, int):
                    usage[k] = usage.get(k, 0) + v

    out = []
    for slug, doc in docs.items():
        runs = [results[(slug, r)] for r in range(args.runs)]
        if args.runs == 1:
            agreed = runs[0]
        else:
            seen = [set(find_key(i) for i in run) for run in runs]
            common = set.intersection(*seen)
            agreed = [i for i in runs[0] if find_key(i) in common]
            dropped = sum(len(r) for r in runs) - len(agreed) * len(runs)
            log(f"{slug}: {len(agreed)} finding(s) in all {args.runs} runs "
                f"({len(runs[0])} in the first; {dropped} opinion(s) discarded)")
        out += agreed
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
        f"- Judge: `{args.judge}`, reasoning `{args.reasoning}`, "
        f"{args.runs} run(s) per outline, only findings in all of them reported" + (f", {usage.get('total_tokens', 0):,} tokens." if usage else "."),
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
             + (f" · {i['note']}" if i.get("note") else ""), ""]
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
    ap.add_argument(
        "--only",
        action="append",
        default=[],
        metavar="CODE",
        help="review only this project (a1, b2, or any part of its name); repeatable",
    )
    ap.add_argument(
        "--changed",
        default=None,
        metavar="REF",
        help="review only the outlines whose _content.md changed since REF (e.g. HEAD~1)",
    )
    ap.add_argument("--runs", type=int, default=2,
                    help="opinions per outline; only findings in all of them are reported")
    ap.add_argument("--jobs", type=int, default=4, help="documents judged at once")
    ap.add_argument(
        "--reasoning",
        default="low",
        choices=["default", "none", "low", "high", "max"],
        help="thinking level for the judge (default: low)",
    )
    ap.add_argument("--no-cache", action="store_true",
                    help="ignore cached judgements and ask again")
    ap.add_argument("--clear-cache", action="store_true",
                    help="delete the judgement cache before running")
    ap.add_argument("--threshold", type=float, default=0.12)

    args = ap.parse_args()
    args.rules = load_rules(pathlib.Path(args.rules))
    args.cache_hits = 0
    args.cache_misses = 0
    args.n_judge = sum(1 for r in args.rules if r["check"] == "judge")
    args.n_text = sum(1 for r in args.rules if r["check"] == "text")
    args.n_rules = len(args.rules)

    docs = load_docs(pathlib.Path(args.docs))
    if args.only:
        docs = {
            k: v for k, v in docs.items()
            if any(o.lower() in k.lower() for o in args.only)
        }
        if not docs:
            raise SystemExit(f"No outline matches {args.only}")
    if args.changed:
        docs = changed_since(args.docs, args.changed, docs)
        if not docs:
            log("no outline has changed since " + args.changed + " - nothing to do")
            return

    log(f"{len(docs)} outline(s), {args.n_rules} rules "
        f"({args.n_judge} judged, {args.n_text} text)")
    for slug in docs:
        log(f"  in scope: {slug}")
    pack_pages = [pathlib.Path(f) for f in PACK_PAGES]
    extra = "\n\n".join(p.read_text(encoding="utf8") for p in pack_pages if p.exists())
    issues = text_issues(args.rules, docs, extra)
    log(f"text checks: {len(issues)} finding(s)")
    usage = {}
    if args.clear_cache and pathlib.Path(CACHE).exists():
        pathlib.Path(CACHE).unlink()
        log("judgement cache cleared")
    cache = load_cache(pathlib.Path(CACHE))
    if args.judge.lower() != "none":
        judged, usage = judge_issues(args, args.rules, docs, cache)
        issues += judged
        pathlib.Path(CACHE).parent.mkdir(parents=True, exist_ok=True)
        pathlib.Path(CACHE).write_text(json.dumps(cache))

    sim = similarity(docs, threshold=args.threshold)

    out = pathlib.Path(args.out)
    out.parent.mkdir(parents=True, exist_ok=True)
    args.pack_seen = [str(p) for p in pack_pages if p.exists()]
    out.write_text(render(issues, docs, sim, args, usage), encoding="utf8")
    if args.cache_hits or args.cache_misses:
        log(f"judge cache: {args.cache_hits} hit(s), "
            f"{args.cache_misses - args.cache_hits} call(s) made")
    log(f"{len(issues)} potential issue(s) -> {out}")
    if usage:
        log("tokens: " + ", ".join(f"{k}={v:,}" for k, v in sorted(usage.items())))


if __name__ == "__main__":
    main()
