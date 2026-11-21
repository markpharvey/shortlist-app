using Shortlist.Application.Common.Interfaces;
using Shortlist.Application.Common.Models;
using Shortlist.Application.Common.Security;
using Shortlist.Domain.Entities;
using Shortlist.Domain.Enums;

namespace Shortlist.Application.JobApplications.Queries.GetJobApplications;

[Authorize]
public record GetJobApplicationsQuery : IRequest<JobApplicationsVm>
{
    public int? Status { get; init; }
    public int? WorkArrangement { get; init; }
    public string? Technology { get; init; }

    /// <summary>Hide in-person and hybrid roles with a longer commute. Remote roles, and roles with no commute entered, stay.</summary>
    public int? MaxCommuteMinutes { get; init; }
}

public class GetJobApplicationsQueryHandler : IRequestHandler<GetJobApplicationsQuery, JobApplicationsVm>
{
    private const int TopTechnologyCount = 10;

    private readonly IApplicationDbContext _context;
    private readonly IUser _user;

    public GetJobApplicationsQueryHandler(IApplicationDbContext context, IUser user)
    {
        _context = context;
        _user = user;
    }

    public async Task<JobApplicationsVm> Handle(GetJobApplicationsQuery request, CancellationToken cancellationToken)
    {
        var owner = _user.Id;
        var query = _context.JobApplications.AsNoTracking().Where(a => a.OwnerId == owner);

        if (request.Status is int status)
        {
            query = query.Where(a => a.Status == (ApplicationStatus)status);
        }

        if (request.WorkArrangement is int arrangement)
        {
            query = query.Where(a => a.WorkArrangement == (WorkArrangement)arrangement);
        }

        if (!string.IsNullOrWhiteSpace(request.Technology))
        {
            var key = Technology.Normalize(request.Technology);
            query = query.Where(a => a.Technologies.Any(t => t.NormalizedName == key));
        }

        if (request.MaxCommuteMinutes is int max)
        {
            query = query.Where(a => a.WorkArrangement == WorkArrangement.Remote
                || a.CommuteMinutes == null
                || a.CommuteMinutes <= max);
        }

        // Newest first. Ordered by Id because SQLite can't sort the Created timestamp column.
        var items = await query
            .OrderByDescending(a => a.Id)
            .Select(a => new JobApplicationDto
            {
                Id = a.Id,
                Company = a.Company,
                JobTitle = a.JobTitle,
                AdUrl = a.AdUrl,
                JobDescription = a.JobDescription,
                Location = a.Location,
                CommuteMinutes = a.CommuteMinutes,
                WorkArrangement = (int)a.WorkArrangement,
                Status = (int)a.Status,
                DateApplied = a.DateApplied,
                SalaryMin = a.SalaryMin,
                SalaryMax = a.SalaryMax,
                Contact = a.Contact,
                Notes = a.Notes,
                Technologies = a.Technologies.OrderBy(t => t.Name).Select(t => t.Name).ToList()
            })
            .ToListAsync(cancellationToken);

        var top = await _context.Technologies
            .AsNoTracking()
            .Select(t => new TechnologyCountDto
            {
                Name = t.Name,
                Count = t.JobApplications.Count(a => a.OwnerId == owner)
            })
            .Where(t => t.Count > 0)
            .OrderByDescending(t => t.Count)
            .ThenBy(t => t.Name)
            .Take(TopTechnologyCount)
            .ToListAsync(cancellationToken);

        return new JobApplicationsVm
        {
            Items = items,
            Statuses = Lookup<ApplicationStatus>(),
            WorkArrangements = Lookup<WorkArrangement>(),
            TopTechnologies = top
        };
    }

    private static List<LookupDto> Lookup<TEnum>() where TEnum : struct, Enum =>
        Enum.GetValues<TEnum>()
            .Select(v => new LookupDto { Id = Convert.ToInt32(v), Title = Label(v.ToString()) })
            .ToList();

    // "InPerson" becomes "In person".
    private static string Label(string name) =>
        string.Concat(name.Select((c, i) => i > 0 && char.IsUpper(c) ? " " + char.ToLowerInvariant(c) : c.ToString()));
}
