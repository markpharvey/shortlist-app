using System.Reflection;
using NUnit.Framework;
using Shouldly;
using Shortlist.Application.Common.Interfaces;
using Shortlist.Domain.Entities;
using Shortlist.Infrastructure.Data;

namespace Shortlist.Application.UnitTests.Architecture;

// Fence from docs/corrections-log.md: the layer rules in AGENTS.md were prose only.
// Project references already stop circular layer references; these catch the rest,
// such as a database or web package added to an inner layer. The compiler drops
// references that are never used, so a test fails only when code actually uses one.
public class LayerBoundaryTests
{
    private static readonly Assembly Domain = typeof(JobApplication).Assembly;
    private static readonly Assembly Application = typeof(IApplicationDbContext).Assembly;
    private static readonly Assembly Infrastructure = typeof(ApplicationDbContext).Assembly;

    [TestCase("Shortlist.")]
    [TestCase("Microsoft.EntityFrameworkCore")]
    [TestCase("Microsoft.AspNetCore")]
    public void DomainStaysFreeOf(string forbidden) =>
        Uses(Domain, forbidden).ShouldBeEmpty(Fix("Domain", forbidden));

    [TestCase("Shortlist.Infrastructure")]
    [TestCase("Shortlist.Web")]
    [TestCase("Shortlist.Shared")]
    [TestCase("Microsoft.AspNetCore")]
    [TestCase("Microsoft.EntityFrameworkCore.Sqlite")]
    public void ApplicationStaysFreeOf(string forbidden) =>
        Uses(Application, forbidden).ShouldBeEmpty(Fix("Application", forbidden));

    [Test]
    public void InfrastructureStaysFreeOfWeb() =>
        Uses(Infrastructure, "Shortlist.Web").ShouldBeEmpty(Fix("Infrastructure", "Shortlist.Web"));

    private static string[] Uses(Assembly assembly, string prefix) =>
        assembly.GetReferencedAssemblies()
            .Select(a => a.Name ?? string.Empty)
            .Where(name => name.StartsWith(prefix, StringComparison.Ordinal))
            .ToArray();

    private static string Fix(string layer, string forbidden) =>
        $"{layer} uses {forbidden}. Dependencies must point inward (AGENTS.md, Project boundaries). " +
        "Move the code to the right layer, or add an interface in Application and implement it in Infrastructure. " +
        "Don't weaken this test.";
}
