using Shortlist.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Shortlist.Infrastructure.Data.Configurations;

public class JobApplicationConfiguration : IEntityTypeConfiguration<JobApplication>
{
    public void Configure(EntityTypeBuilder<JobApplication> builder)
    {
        builder.Property(a => a.OwnerId).HasMaxLength(450).IsRequired();
        builder.HasIndex(a => a.OwnerId);

        builder.Property(a => a.Company).HasMaxLength(200).IsRequired();
        builder.Property(a => a.JobTitle).HasMaxLength(200).IsRequired();
        builder.Property(a => a.AdUrl).HasMaxLength(2000);
        builder.Property(a => a.JobDescription).HasMaxLength(20000);
        builder.Property(a => a.Location).HasMaxLength(200);
        builder.Property(a => a.Contact).HasMaxLength(200);
        builder.Property(a => a.Notes).HasMaxLength(5000);

        // Many-to-many through a join table named in ADR-004.
        builder.HasMany(a => a.Technologies)
            .WithMany(t => t.JobApplications)
            .UsingEntity("ApplicationTechnology");
    }
}
