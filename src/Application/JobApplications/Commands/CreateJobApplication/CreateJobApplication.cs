using Shortlist.Application.Common.Interfaces;
using Shortlist.Application.Common.Security;
using Shortlist.Application.JobApplications.Common;
using Shortlist.Domain.Entities;

namespace Shortlist.Application.JobApplications.Commands.CreateJobApplication;

[Authorize]
public record CreateJobApplicationCommand : IRequest<int>, IJobApplicationFields
{
    public string? Company { get; init; }
    public string? JobTitle { get; init; }
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
    public IReadOnlyList<string>? Technologies { get; init; }
}

public class CreateJobApplicationCommandValidator : JobApplicationFieldsValidator<CreateJobApplicationCommand>
{
    public CreateJobApplicationCommandValidator(TimeProvider time) : base(time) { }
}

public class CreateJobApplicationCommandHandler : IRequestHandler<CreateJobApplicationCommand, int>
{
    private readonly IApplicationDbContext _context;
    private readonly IUser _user;

    public CreateJobApplicationCommandHandler(IApplicationDbContext context, IUser user)
    {
        _context = context;
        _user = user;
    }

    public async Task<int> Handle(CreateJobApplicationCommand request, CancellationToken cancellationToken)
    {
        var entity = new JobApplication { OwnerId = _user.Id! };

        await JobApplicationMapper.ApplyAsync(entity, request, _context, cancellationToken);

        _context.JobApplications.Add(entity);
        await _context.SaveChangesAsync(cancellationToken);

        return entity.Id;
    }
}
