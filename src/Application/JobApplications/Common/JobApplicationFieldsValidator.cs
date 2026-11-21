using Shortlist.Domain.Enums;

namespace Shortlist.Application.JobApplications.Common;

/// <summary>The rules from docs/specs/job-applications.md, shared by create and update.</summary>
public abstract class JobApplicationFieldsValidator<T> : AbstractValidator<T> where T : IJobApplicationFields
{
    public const int MaxTags = 30;

    protected JobApplicationFieldsValidator(TimeProvider time)
    {
        // Rule 1
        RuleFor(v => v.Company).NotEmpty().MaximumLength(200);
        RuleFor(v => v.JobTitle).NotEmpty().MaximumLength(200);

        RuleFor(v => v.Location).MaximumLength(200);
        RuleFor(v => v.Contact).MaximumLength(200);
        RuleFor(v => v.JobDescription).MaximumLength(20_000);
        RuleFor(v => v.Notes).MaximumLength(5_000);
        RuleFor(v => v.AdUrl)
            .MaximumLength(2_000)
            .Must(BeAWebAddress).When(v => !string.IsNullOrWhiteSpace(v.AdUrl))
            .WithMessage("'{PropertyName}' must be a web address starting with http:// or https://.");

        RuleFor(v => v.WorkArrangement)
            .Must(v => Enum.IsDefined(typeof(WorkArrangement), v))
            .WithMessage("'{PropertyName}' must be In person, Hybrid or Remote.");
        RuleFor(v => v.Status)
            .Must(v => Enum.IsDefined(typeof(ApplicationStatus), v))
            .WithMessage("'{PropertyName}' is not a known status.");

        // Rule 2
        RuleFor(v => v.SalaryMin).GreaterThanOrEqualTo(0);
        RuleFor(v => v.SalaryMax).GreaterThanOrEqualTo(0);
        RuleFor(v => v.SalaryMax)
            .Must((v, max) => max >= v.SalaryMin)
            .When(v => v.SalaryMin.HasValue && v.SalaryMax.HasValue)
            .WithMessage("'Salary Max' must not be less than 'Salary Min'.");

        // Rule 3
        RuleFor(v => v.CommuteMinutes).InclusiveBetween(0, 600);

        // Rule 4
        RuleFor(v => v.DateApplied)
            .NotNull()
            .When(v => v.Status >= (int)ApplicationStatus.Applied)
            .WithMessage("'Date Applied' is required once the status is Applied or later.");
        // The server may run in UTC while the user is in Brisbane (UTC+10), so "today" for the
        // user can be tomorrow in UTC. Allowing one day ahead stops a correct date being rejected.
        RuleFor(v => v.DateApplied)
            .Must(d => d <= DateOnly.FromDateTime(time.GetUtcNow().UtcDateTime).AddDays(1))
            .When(v => v.DateApplied.HasValue)
            .WithMessage("'Date Applied' cannot be in the future.");

        RuleFor(v => v.Technologies)
            .Must(t => t == null || t.Count <= MaxTags)
            .WithMessage($"No more than {MaxTags} stack tags.");
        RuleForEach(v => v.Technologies).NotEmpty().MaximumLength(50);
    }

    private static bool BeAWebAddress(string? value) =>
        Uri.TryCreate(value, UriKind.Absolute, out var uri)
        && (uri.Scheme == Uri.UriSchemeHttp || uri.Scheme == Uri.UriSchemeHttps);
}
