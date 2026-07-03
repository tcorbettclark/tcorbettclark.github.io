# Agent Guidelines

## General

Before making changes:
- State assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, push back.
- If something is unclear, stop. Name what's confusing. Ask.

Keep changes small and focussed:
- One logical change per commit
- If a task feels too large, break it into subtasks and track progress with todo tool
- Prefer multiple small commits over one large commit

Wait for specific instruction before committing.

## Auto-generated content

Only edit files in `content/`. Never edit files in `docs/` directly.

The `awg.py` tool automatically creates the entire `docs/` directory. Assume that it is always running and watching for changes in `content/`.
