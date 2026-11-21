using Shortlist.Application.Common.Interfaces;
using Shortlist.Domain.Entities;
using Shortlist.Domain.Enums;

namespace Shortlist.Application.JobApplications.Common;

internal static class JobApplicationMapper
{
    /// <summary>Copies the form fields onto the entity, including the stack tags.</summary>
    public static async Task ApplyAsync(JobApplication entity, IJobApplicationFields fields,
        IApplicationDbContext context, CancellationToken cancellationToken)
    {
        entity.Company = fields.Company!.Trim();
        entity.JobTitle = fields.JobTitle!.Trim();
        entity.AdUrl = Clean(fields.AdUrl);
        entity.JobDescription = Clean(fields.JobDescription);
        entity.Location = Clean(fields.Location);
        entity.CommuteMinutes = fields.CommuteMinutes;
        entity.WorkArrangement = (WorkArrangement)fields.WorkArrangement;
        entity.Status = (ApplicationStatus)fields.Status;
        entity.DateApplied = fields.DateApplied;
        entity.SalaryMin = fields.SalaryMin;
        entity.SalaryMax = fields.SalaryMax;
        entity.Contact = Clean(fields.Contact);
        entity.Notes = Clean(fields.Notes);

        var tags = await ResolveTagsAsync(fields.Technologies, context, cancellationToken);
        entity.Technologies.Clear();
        foreach (var tag in tags)
        {
            entity.Technologies.Add(tag);
        }
    }

    /// <summary>Finds existing tags by their normalised name and creates any that are new.</summary>
    private static async Task<List<Technology>> ResolveTagsAsync(IReadOnlyList<string>? names,
        IApplicationDbContext context, CancellationToken cancellationToken)
    {
        var wanted = (names ?? [])
            .Where(n => !string.IsNullOrWhiteSpace(n))
            .DistinctBy(Technology.Normalize)
            .ToList();
        if (wanted.Count == 0)
        {
            return [];
        }

        var keys = wanted.Select(Technology.Normalize).ToList();
        var existing = await context.Technologies
            .Where(t => keys.Contains(t.NormalizedName))
            .ToListAsync(cancellationToken);

        return wanted
            .Select(n => existing.FirstOrDefault(t => t.NormalizedName == Technology.Normalize(n)) ?? Technology.Create(n))
            .ToList();
    }

    private static string? Clean(string? value) => string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}
