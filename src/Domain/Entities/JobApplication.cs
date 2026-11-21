namespace Shortlist.Domain.Entities;

public class JobApplication : BaseAuditableEntity
{
    public string OwnerId { get; set; } = string.Empty;

    public string Company { get; set; } = string.Empty;

    public string JobTitle { get; set; } = string.Empty;

    public string? AdUrl { get; set; }

    public string? JobDescription { get; set; }

    public string? Location { get; set; }

    public int? CommuteMinutes { get; set; }

    public WorkArrangement WorkArrangement { get; set; }

    public ApplicationStatus Status { get; set; }

    public DateOnly? DateApplied { get; set; }

    public int? SalaryMin { get; set; }

    public int? SalaryMax { get; set; }

    public string? Contact { get; set; }

    public string? Notes { get; set; }

    public ICollection<Technology> Technologies { get; } = new List<Technology>();
}
