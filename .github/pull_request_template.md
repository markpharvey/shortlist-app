<!--
How to fill this in. Delete these notes when done.
- Dot points only. No paragraphs. Aim for under 12 words a point.
- Pictures, tables and ticks before text.
- Plain English for someone who reads code slowly.
- Follow .claude/skills/unslop/SKILL.md: no filler, no hype, no em dashes.
- Section doesn't apply? Write "- None: <reason>".
-->

## In one line

- <!-- What changes, for whom. e.g. "Add a job application and tag its stack" -->

## Why

- **Problem:** <!-- what's wrong or missing today -->
- **Spec:** <!-- link -->
- **Depends on:** <!-- other pull requests to merge first, or "None" -->

## Review card

<!-- Look at this first. Images and clips, not text. -->

| | Before | After |
|---|---|---|
| <!-- page or step --> | <!-- screenshot --> | <!-- screenshot --> |

- **Clip:** <!-- link to the Playwright recording -->
- **Checks:** <!-- ✅ build ✅ type check ✅ lint ✅ 42 unit tests ✅ 18 functional tests -->

## What the pictures can't show

<!-- One row per risk a screenshot would miss. Never leave this empty. -->

| Risk | How it was checked |
|---|---|
| | |

**Not checked:**
- <!-- be honest, one point each -->

## Code walkthrough

<!-- The few pieces of code that matter, most important first:
     1. Core logic (the rules and decisions)
     2. Wiring (how it connects), condensed
     3. Boilerplate (generated, renames, config), one line each
     Above each snippet, one dot point saying what it does. -->

- **Does:** <!-- plain English, one line -->
```
<!-- snippet -->
```

**Also changed (boilerplate):**
- <!-- one point per file or group -->

## Risk and undo

- **Risk level:** <!-- Low / Medium / High, and why in one sentence -->
- **If it goes wrong:** <!-- what a user would notice -->
- **To undo:** <!-- e.g. "Revert this pull request; no data changes." -->

## Before you merge

- [ ] The review card matches what "In one line" promises.
- [ ] "What the pictures can't show" lists the risks I care about.
- [ ] All checks are green.
