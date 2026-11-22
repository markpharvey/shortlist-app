<!--
How to fill this in. Delete these notes when done.
- Review proof, not code. The proof sections come first; the code walkthrough is folded away at the bottom for learning.
- Dot points only. No paragraphs. Aim for under 12 words a point.
- Plain English for someone who reads code slowly.
- Follow .claude/skills/unslop/SKILL.md. The "Writing check" job fails on em dashes and AI filler words.
- Section doesn't apply? Write "- None: <reason>".
-->

## In one line

- <!-- What changes, for whom. e.g. "Add a job application and tag its stack" -->

## Proof

<!-- Look at this first. Images, clips and ticks, not text. -->

| | Before | After |
|---|---|---|
| <!-- page or step --> | <!-- screenshot --> | <!-- screenshot --> |

- **Clip:** <!-- link to the Playwright recording -->
- **Checks:** <!-- ✅ build ✅ type check ✅ lint ✅ 42 unit tests ✅ 18 functional tests ✅ writing check -->
- **New tests prove:** <!-- one point per behaviour a new test pins down -->

## What the proof can't show

<!-- One row per risk the proof would miss. Never leave this empty. As fences grow, this should shrink. -->

| Risk | How it was checked |
|---|---|
| | |

**Not checked:**
- <!-- be honest, one point each -->

## New fences

<!-- Corrections turned into automatic checks, so the mistake can't spread. See docs/corrections-log.md. -->

| Mistake it stops | Fence | Fails in |
|---|---|---|
| <!-- e.g. Domain code using the database --> | <!-- e.g. layer boundary test --> | <!-- e.g. unit tests --> |

## Risk and undo

- **Risk level:** <!-- Low / Medium / High, and why in one sentence -->
- **If it goes wrong:** <!-- what a user would notice -->
- **To undo:** <!-- e.g. "Revert this pull request; no data changes." -->

## Why

- **Problem:** <!-- what's wrong or missing today -->
- **Spec:** <!-- link -->
- **Depends on:** <!-- other pull requests to merge first, or "None" -->

<details>
<summary>Code walkthrough (for learning, not needed to approve)</summary>

<!-- The few pieces of code that matter, most important first. One "Does:" point above each snippet. -->

- **Does:** <!-- plain English, one line -->
```
<!-- snippet -->
```

**Also changed (boilerplate):**
- <!-- one point per file or group -->

</details>

## Before you merge

- [ ] The proof matches what "In one line" promises.
- [ ] "What the proof can't show" lists the risks I care about.
- [ ] All checks are green.
- [ ] Anything I corrected has a fence, or a row in the corrections log.
