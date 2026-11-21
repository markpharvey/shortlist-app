# ADR-004: Job Application Data Model

## Status

Accepted

## Date

2026-11-21

## Context

Shortlist's first real feature tracks job applications (see [the spec](../specs/job-applications.md)). Several fields could be stored in more than one way, and the choice decides what the app can do with them later: filter, sort, count, or only display.

## Decision

- `JobApplication` is one entity owned by the signed-in user (`OwnerId`).
- **Stack** is a separate `Technology` entity in a many-to-many relationship with `JobApplication`, through an `ApplicationTechnology` join table.
- **Status** and **work arrangement** are enums: `ApplicationStatus` (Interested, Applied, Interview, Offer, Rejected) and `WorkArrangement` (InPerson, Hybrid, Remote).
- **Salary** is two nullable whole-dollar numbers, `SalaryMin` and `SalaryMax`.
- **Location** is free text, and **commute** is a nullable whole number of minutes entered by the user.
- **Company** is free text on the application.
- **Date applied** is nullable and required by validation once the status is Applied or later.

## Rationale

- **Stack as tags, not one text field.** Free text such as "C#, React" can only be displayed. Tags let the app filter by technology and count which skills appear most, which is the most useful insight for a job hunt. The cost is a join table, which EF Core handles directly.
- **Enums for status and arrangement.** A fixed set of choices keeps bad values out ("remoat", "WFH sometimes") and lets the list be filtered reliably. Adding a new status later is a small, deliberate change.
- **Salary as two numbers, not text.** Text like "$90–110k" cannot be sorted or compared. Two numbers can, and either can be left empty when an ad gives no figure.
- **Commute entered by hand for now.** Calculating it from a maps service needs an API key and may cost money; keeping it a plain number now means the later integration only has to fill in the same field.
- **Company as text for now.** A separate `Company` table would group every role at one employer, but adds screens and rules before the core is proven. It can be extracted later without losing data.
- **Owned by the user.** The template already has sign-in; tying each application to its owner keeps one person's job hunt private from another's.

## Consequences

**Easier:**
- Filtering by status, arrangement, tag and commute.
- Reporting which skills appear most often.
- Adding automatic commute calculation later, since the field already exists.

**Harder:**
- Tags need a rule for matching ("react" equals "React") and cleaning up unused tags.
- Every query must filter by owner; a test checks one user cannot read another's applications.
- Moving company into its own table later needs a data migration.
