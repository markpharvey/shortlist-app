# Corrections log

Every time the owner corrects the AI, or the AI finds its own mistake, it goes here. The goal is a fence: an automatic check that fails when the mistake comes back, so it can't spread through the code as a pattern the next change copies. A written rule is the last resort.

- **Fenced:** a check fails if it happens again.
- **Rule only:** written in AGENTS.md or a skill, nothing enforces it yet.
- **Candidate:** a fence is planned; the note says what's in the way.

| Date | Mistake | Fence | Status |
|---|---|---|---|
| 2026-11-21 | Pull request text with em dashes and AI filler words | `Writing check` workflow (`.github/scripts/check-writing.mjs`) | Fenced |
| 2026-11-21 | Plain-English "what it does" comments in code | AGENTS.md "Writing for people"; walkthrough lives in the pull request | Rule only |
| 2026-11-21 | Calling `setState` inside `useEffect` (template Todo page) | ESLint `react-hooks` rules in CI | Fenced |
| 2026-11-21 | Validation errors dropped before reaching the page | Functional tests for the job application rules | Fenced |
| 2026-11-21 | Using Pico's `.grid` class, which this template turns off | Use `.form-row` | Rule only |
| 2026-11-22 | Missing `using` line broke the build | CI build step | Fenced |
| 2026-11-22 | Build tried to create the live database at `/home/data` | CI build step; database setup skipped while writing the API description | Fenced |
| 2026-11-22 | Layer rules (Domain must not use Infrastructure, and so on) were prose only | `LayerBoundaryTests` in unit tests | Fenced |
| 2026-11-22 | Sign-up gate had no test | `RegistrationGateTests` in functional tests | Fenced |
| 2026-11-22 | New `useEffect` calls in page components, which agents often misuse | Ban `useEffect` outside a small hooks folder | Candidate: five existing uses need a shared data-loading hook first |
