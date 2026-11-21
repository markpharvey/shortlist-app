<!--
How to fill this in. Delete these notes when done.
- Write for someone who reads code slowly. Plain English, short sentences.
- Follow .claude/skills/unslop/SKILL.md: no filler, no hype, no em dashes.
- Pictures beat paragraphs. Every claim in "Review card" links to a screenshot, clip, chart or check.
- Keep each section short. If a section doesn't apply, write "None" and why.
-->

## In one line

<!-- What changes, for whom. Example: "You can now add a job application and tag its tech stack." -->

## Why

<!-- The problem this solves, and a link to the spec or issue. Two or three sentences. -->

## Review card

<!-- Look at this first. Images and clips, not text. -->

| | Before | After |
|---|---|---|
| <!-- page or step --> | <!-- screenshot --> | <!-- screenshot --> |

**Clip:** <!-- link to the Playwright recording of the change in use -->

**Checks:** <!-- one line of ticks, e.g. ✅ build ✅ type check ✅ lint ✅ 42 unit tests ✅ 18 functional tests -->

## What the pictures can't show

<!-- What a screenshot would miss, and how each was checked instead (test name, reviewer, manual).
     Then list anything that was NOT checked at all. Never leave this empty. -->

| Risk | How it was checked |
|---|---|
| | |

**Not checked:** <!-- be honest -->

## Code walkthrough

<!-- The few pieces of code that matter, most important first:
     1. Core logic (the rules and decisions)
     2. Wiring (how it connects), condensed
     3. Boilerplate (generated, renames, config), one line each
     Above each snippet, one plain-English line saying what it does. -->

**What this does:** <!-- plain English -->
```
<!-- snippet -->
```

**Also changed (boilerplate):** <!-- one line per file or group -->

## Risk and undo

- **Risk level:** <!-- Low / Medium / High, and why in one sentence -->
- **If it goes wrong:** <!-- what a user would notice -->
- **To undo:** <!-- e.g. "Revert this pull request; no data changes." -->

## Before you merge

- [ ] The review card matches what "In one line" promises.
- [ ] "What the pictures can't show" lists the risks I care about.
- [ ] All checks are green.
