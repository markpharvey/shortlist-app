namespace Shortlist.Domain.Entities;

public class Technology : BaseEntity
{
    public string Name { get; set; } = string.Empty;

    // Tags match without regard to case or spacing, so "react" and " React " are one tag (spec rule 5).
    public string NormalizedName { get; set; } = string.Empty;

    public ICollection<JobApplication> JobApplications { get; } = new List<JobApplication>();

    public static string Normalize(string name) => name.Trim().ToUpperInvariant();

    public static Technology Create(string name) => new()
    {
        Name = name.Trim(),
        NormalizedName = Normalize(name)
    };
}
