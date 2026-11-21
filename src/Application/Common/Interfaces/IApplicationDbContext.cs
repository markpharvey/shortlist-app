using Shortlist.Domain.Entities;

namespace Shortlist.Application.Common.Interfaces;

public interface IApplicationDbContext
{
    DbSet<TodoList> TodoLists { get; }

    DbSet<TodoItem> TodoItems { get; }

    DbSet<JobApplication> JobApplications { get; }

    DbSet<Technology> Technologies { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken);
}
