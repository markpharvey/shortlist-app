# Spec: tracking job applications

Status: **Approved by Mark, 21 November 2026**
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

- Domain tests: the rules above, one test per rule.
- Functional tests (real database): create, edit, delete, filter, tag matching, and one user being unable to read another user's applications.
- Front end: type check, lint and build pass.
- Playwright walkthrough: add three applications with different stacks and arrangements, filter by tag and by commute, move one through to Interview. Recorded as the lesson for this feature.

## Out of scope for this build

- Company as its own table (all roles at one company together).
- Working out the commute automatically from a maps service. Planned as a separate integration feature, since it needs an API key and possibly a fee.
- Reminders, file attachments (CVs, cover letters), importing ads from job sites.
- Removing the template's sample Tasks and Weather pages. That is a separate, small change after this one.
