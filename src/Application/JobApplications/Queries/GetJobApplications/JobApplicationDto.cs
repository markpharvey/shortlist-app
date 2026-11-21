using Shortlist.Application.Common.Models;

namespace Shortlist.Application.JobApplications.Queries.GetJobApplications;

public class JobApplicationDto
{
    public int Id { get; init; }
    public string Company { get; init; } = string.Empty;
    public string JobTitle { get; init; } = string.Empty;
    public string? AdUrl { get; init; }
    public string? JobDescription { get; init; }
    public string? Location { get; init; }
    public int? CommuteMinutes { get; init; }
    public int WorkArrangement { get; init; }
    public int Status { get; init; }
    public DateOnly? DateApplied { get; init; }
    public int? SalaryMin { get; init; }
    public int? SalaryMax { get; init; }
    public string? Contact { get; init; }
    public string? Notes { get; init; }
    public IReadOnlyList<string> Technologies { get; init; } = [];
}

public class TechnologyCountDto
{
    public string Name { get; init; } = string.Empty;
    public int Count { get; init; }
}

public class JobApplicationsVm
{
    public IReadOnlyList<JobApplicationDto> Items { get; init; } = [];

    /// <summary>Choices for the status field, in pipeline order.</summary>
    public IReadOnlyList<LookupDto> Statuses { get; init; } = [];

    /// <summary>Choices for the work arrangement field.</summary>
    public IReadOnlyList<LookupDto> WorkArrangements { get; init; } = [];

    /// <summary>The stack tags that appear most across all of the user's applications, ignoring filters.</summary>
    public IReadOnlyList<TechnologyCountDto> TopTechnologies { get; init; } = [];
}
