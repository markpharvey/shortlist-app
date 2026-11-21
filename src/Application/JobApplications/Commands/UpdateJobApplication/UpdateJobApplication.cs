using Shortlist.Application.Common.Interfaces;
using Shortlist.Application.Common.Security;
using Shortlist.Application.JobApplications.Common;

namespace Shortlist.Application.JobApplications.Commands.UpdateJobApplication;

[Authorize]
public record UpdateJobApplicationCommand : IRequest, IJobApplicationFields
{
    public int Id { get; init; }
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

public class UpdateJobApplicationCommandValidator : JobApplicationFieldsValidator<UpdateJobApplicationCommand>
{
    public UpdateJobApplicationCommandValidator(TimeProvider time) : base(time) { }
}

public class UpdateJobApplicationCommandHandler : IRequestHandler<UpdateJobApplicationCommand>
{
    private readonly IApplicationDbContext _context;
    private readonly IUser _user;

    public UpdateJobApplicationCommandHandler(IApplicationDbContext context, IUser user)
    {
        _context = context;
        _user = user;
    }

    public async Task Handle(UpdateJobApplicationCommand request, CancellationToken cancellationToken)
    {
        // Another user's application is reported as not found, so its existence isn't revealed (spec rule 6).
        var entity = await _context.JobApplications
            .Include(a => a.Technologies)
            .FirstOrDefaultAsync(a => a.Id == request.Id && a.OwnerId == _user.Id, cancellationToken);

        Guard.Against.NotFound(request.Id, entity);

        await JobApplicationMapper.ApplyAsync(entity, request, _context, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);
    }
}
