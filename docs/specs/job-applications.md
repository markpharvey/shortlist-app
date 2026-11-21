# Spec: tracking job applications

Status: **Approved by Mark, 21 November 2026.** Updated the same evening with the two-build split and the capture workflow (agreed by voice).
Decision record: [ADR-004](../decisions/ADR-004-Job-Application-Data-Model.md)

## Why

Shortlist helps one person run a job hunt: keep every role in one place, see where each one is up to, and spot patterns, such as which skills employers keep asking for and which roles are close enough to get to.

## What one job application records

| Field | Type | Required | Notes |
|---|---|---|---|
| Company | text (200) | yes | Plain text for now; see "Later" |
| Job title | text (200) | yes | |
| Ad link | web address | no | |
| Job description | long text | no | The full ad text, because ads get taken down |
| Location | text (200) | no | Suburb or city, e.g. "Brisbane CBD", "Southport" |
| Commute (minutes) | whole number, 0–600 | no | Entered by hand for now |
| Work arrangement | choice | yes | In person, Hybrid, Remote |
| Status | choice | yes | Interested, Applied, Interview, Offer, Rejected. New applications start as Interested |
| Date applied | date | see rules | Empty while Interested |
| Salary min / max | whole dollars a year | no | Two numbers, so they can be sorted and filtered |
| Contact | text (200) | no | Recruiter or hiring manager |
| Notes | long text | no | |
| Stack | list of tags | no | e.g. C#, React, Azure. Tags are shared across applications |
| Owner | the signed-in user | automatic | Each user sees only their own applications |

## Rules

1. Company and job title must not be blank.
2. If both salary figures are given, min must not be more than max.
3. Commute minutes, if given, is between 0 and 600.
4. Date applied is required once the status is Applied or later, and cannot be in the future.
5. Tag names are trimmed and matched without regard to case, so "react" and "React" are the same tag.
6. A user can never see, change or delete another user's applications.

## What the user can do

- See a list of their applications, newest first, with company, title, status, work arrangement, location and commute.
- Filter the list by status, work arrangement and stack tag. Also filter by a maximum commute, which hides in-person and hybrid roles above it.
- Add, edit and delete an application.
- Move an application to a new status.
- See which stack tags appear most across their applications.

## How we'll know it works (acceptance tests)

- Unit tests: the rules above, one test per rule.
- Functional tests (real database): create, edit, delete, filter, tag matching, and one user being unable to read another user's applications.
- Front end: type check, lint and build pass.
- Playwright walkthrough: add three applications with different stacks and arrangements, filter by tag and by commute, move one through to Interview. Recorded as the lesson for this feature.

## Builds

### Build 1: the tracker (this spec, above)

Entering applications by hand, the rules, filters and top stack tags.

### Build 2: capture (next pull request)

The main way to add jobs. Mark chooses every page; nothing is fetched automatically.

1. **Suggested searches.** Shortlist offers ready-made Seek search links, e.g. "junior software engineer", ".NET developer", "AI engineer", for Brisbane, Gold Coast and Logan. Mark clicks one.
2. **Open the ads you like.** Mark opens each interesting ad in its own browser tab.
3. **One button reads them all.** A small browser extension reads each open job tab, sends the page to Shortlist, saves it as a draft and closes the tab.
4. **AI fills in the fields.** Company, title, location, salary, work arrangement and stack tags are pulled from the ad text. Anything the AI is unsure of is flagged.
5. **Review only the flags.** Mark checks the flagged fields, fixes or bins each draft, and saves.

Also in build 2: follow-up reminders (e.g. "applied 7 days ago, follow up").

Why this way: Seek's terms do not allow automated collecting, and opening ads in the background would count as that. Reading pages Mark has opened himself is him saving what he is reading. The AI step needs an API key, which Mark adds as a GitHub secret himself.

## Out of scope for builds 1 and 2

- Company as its own table (all roles at one company together).
- Working out the commute automatically from a maps service. Needs an API key and possibly a fee.
- Pulling new ads in automatically, from Seek or anywhere else. Possible later through job alert emails Mark already receives.
- File attachments (CVs, cover letters).
- Removing the template's sample Tasks and Weather pages. That is a separate, small change.
