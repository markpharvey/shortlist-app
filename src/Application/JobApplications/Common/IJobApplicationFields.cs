namespace Shortlist.Application.JobApplications.Common;

/// <summary>The fields a person fills in for a job application, shared by create and update.</summary>
public interface IJobApplicationFields
{
    string? Company { get; }
    string? JobTitle { get; }
    string? AdUrl { get; }
    string? JobDescription { get; }
    string? Location { get; }
    int? CommuteMinutes { get; }
    int WorkArrangement { get; }
    int Status { get; }
    DateOnly? DateApplied { get; }
    int? SalaryMin { get; }
    int? SalaryMax { get; }
    string? Contact { get; }
    string? Notes { get; }
    IReadOnlyList<string>? Technologies { get; }
}
