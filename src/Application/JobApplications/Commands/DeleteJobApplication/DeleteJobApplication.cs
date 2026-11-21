using Shortlist.Application.Common.Interfaces;
using Shortlist.Application.Common.Security;

namespace Shortlist.Application.JobApplications.Commands.DeleteJobApplication;

[Authorize]
public record DeleteJobApplicationCommand(int Id) : IRequest;

public class DeleteJobApplicationCommandHandler : IRequestHandler<DeleteJobApplicationCommand>
{
    private readonly IApplicationDbContext _context;
    private readonly IUser _user;

    public DeleteJobApplicationCommandHandler(IApplicationDbContext context, IUser user)
    {
        _context = context;
        _user = user;
    }

    public async Task Handle(DeleteJobApplicationCommand request, CancellationToken cancellationToken)
    {
        var entity = await _context.JobApplications
            .FirstOrDefaultAsync(a => a.Id == request.Id && a.OwnerId == _user.Id, cancellationToken);

        Guard.Against.NotFound(request.Id, entity);

        _context.JobApplications.Remove(entity);
        await _context.SaveChangesAsync(cancellationToken);
    }
}
