using System.Reflection;
using NUnit.Framework;
using Shouldly;
using Shortlist.Application.Common.Interfaces;
using Shortlist.Domain.Entities;
using Shortlist.Infrastructure.Data;

namespace Shortlist.Application.UnitTests.Architecture;

// Fence from docs/corrections-log.md: the layer rules in AGENTS.md were prose only.
// The compiler drops references that are never used, so these fail only when code
// in an inner layer actually uses an outer one.
public class LayerBoundaryTests
{
    private static readonly Assembly Domain = typeof(JobApplication).Assembly;
    private static readonly Assembly Application = typeof(IApplicationDbContext).Assembly;
    private static readonly Assembly Infrastructure = typeof(ApplicationDbContext).Assembly;

    [TestCase("Shortlist.Application")]
    [TestCase("Shortlist.Infrastructure")]
    [TestCase("Shortlist.Web")]
    public void DomainDoesNotUseOuterLayers(string outer) =>
        References(Domain).ShouldNotContain(outer, Fix("Domain", outer));

    [TestCase("Shortlist.Infrastructure")]
    [TestCase("Shortlist.Web")]
    public void ApplicationDoesNotUseOuterLayers(string outer) =>
        References(Application).ShouldNotContain(outer, Fix("Application", outer));

    [Test]
    public void InfrastructureDoesNotUseWeb() =>
        References(Infrastructure).ShouldNotContain("Shortlist.Web", Fix("Infrastructure", "Shortlist.Web"));

    private static string[] References(Assembly assembly) =>
        assembly.GetReferencedAssemblies().Select(a => a.Name ?? string.Empty).ToArray();

    private static string Fix(string layer, string outer) =>
        $"{layer} uses {outer}. Dependencies must point inward (AGENTS.md, Project boundaries). " +
        $"Move the code to the right layer, or add an interface in Application and implement it in Infrastructure. " +
        $"Don't weaken this test.";
}
