using Shortlist.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Shortlist.Infrastructure.Data.Configurations;

public class TechnologyConfiguration : IEntityTypeConfiguration<Technology>
{
    public void Configure(EntityTypeBuilder<Technology> builder)
    {
        builder.Property(t => t.Name).HasMaxLength(50).IsRequired();
        builder.Property(t => t.NormalizedName).HasMaxLength(50).IsRequired();
        builder.HasIndex(t => t.NormalizedName).IsUnique();
    }
}
