using FluentValidation.TestHelper;
using NUnit.Framework;
using Shortlist.Application.JobApplications.Commands.CreateJobApplication;
using Shortlist.Domain.Enums;

namespace Shortlist.Application.UnitTests.JobApplications;

/// <summary>One test per rule in docs/specs/job-applications.md.</summary>
public class JobApplicationRulesTests
{
    private static readonly DateOnly Today = new(2026, 11, 21);

    private sealed class FixedTime : TimeProvider
    {
        public override DateTimeOffset GetUtcNow() => new(2026, 11, 21, 2, 0, 0, TimeSpan.Zero);
    }

    private readonly CreateJobApplicationCommandValidator _validator = new(new FixedTime());

    private static CreateJobApplicationCommand Valid() => new()
    {
        Company = "TechnologyOne",
        JobTitle = "Graduate developer",
        WorkArrangement = (int)WorkArrangement.Hybrid,
        Status = (int)ApplicationStatus.Interested
    };

    [Test]
    public void AValidApplicationPasses() =>
        _validator.TestValidate(Valid()).ShouldNotHaveAnyValidationErrors();

    [TestCase(null)]
    [TestCase("")]
    [TestCase("   ")]
    public void Rule1_CompanyMustNotBeBlank(string? company) =>
        _validator.TestValidate(Valid() with { Company = company }).ShouldHaveValidationErrorFor(c => c.Company);

    [TestCase(null)]
    [TestCase("")]
    public void Rule1_JobTitleMustNotBeBlank(string? title) =>
        _validator.TestValidate(Valid() with { JobTitle = title }).ShouldHaveValidationErrorFor(c => c.JobTitle);

    [Test]
    public void Rule2_SalaryMinMustNotBeMoreThanMax() =>
        _validator.TestValidate(Valid() with { SalaryMin = 120_000, SalaryMax = 90_000 })
            .ShouldHaveValidationErrorFor(c => c.SalaryMax);

    [Test]
    public void Rule2_EqualOrOneSidedSalaryIsFine()
    {
        _validator.TestValidate(Valid() with { SalaryMin = 100_000, SalaryMax = 100_000 }).ShouldNotHaveAnyValidationErrors();
        _validator.TestValidate(Valid() with { SalaryMin = 100_000 }).ShouldNotHaveAnyValidationErrors();
    }

    [TestCase(-1)]
    [TestCase(601)]
    public void Rule3_CommuteMustBeBetween0And600(int minutes) =>
        _validator.TestValidate(Valid() with { CommuteMinutes = minutes }).ShouldHaveValidationErrorFor(c => c.CommuteMinutes);

    [TestCase(ApplicationStatus.Applied)]
    [TestCase(ApplicationStatus.Interview)]
    [TestCase(ApplicationStatus.Offer)]
    [TestCase(ApplicationStatus.Rejected)]
    public void Rule4_DateAppliedIsRequiredOnceApplied(ApplicationStatus status) =>
        _validator.TestValidate(Valid() with { Status = (int)status }).ShouldHaveValidationErrorFor(c => c.DateApplied);

    [Test]
    public void Rule4_DateAppliedCannotBeInTheFuture() =>
        _validator.TestValidate(Valid() with { Status = (int)ApplicationStatus.Applied, DateApplied = Today.AddDays(2) })
            .ShouldHaveValidationErrorFor(c => c.DateApplied);

    [Test]
    public void Rule4_TodayInBrisbaneIsNotTheFuture() =>
        // 2am UTC on the 21st is noon on the 21st in Brisbane; even "tomorrow" in UTC must be allowed.
        _validator.TestValidate(Valid() with { Status = (int)ApplicationStatus.Applied, DateApplied = Today.AddDays(1) })
            .ShouldNotHaveAnyValidationErrors();

    [Test]
    public void UnknownStatusOrArrangementIsRejected()
    {
        _validator.TestValidate(Valid() with { Status = 99 }).ShouldHaveValidationErrorFor(c => c.Status);
        _validator.TestValidate(Valid() with { WorkArrangement = 99 }).ShouldHaveValidationErrorFor(c => c.WorkArrangement);
    }

    [TestCase("not a link")]
    [TestCase("ftp://example.com/job")]
    public void AdLinkMustBeAWebAddress(string url) =>
        _validator.TestValidate(Valid() with { AdUrl = url }).ShouldHaveValidationErrorFor(c => c.AdUrl);
}
