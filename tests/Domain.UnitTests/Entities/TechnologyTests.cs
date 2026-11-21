using NUnit.Framework;
using Shortlist.Domain.Entities;
using Shouldly;

namespace Shortlist.Domain.UnitTests.Entities;

public class TechnologyTests
{
    [Test]
    public void Rule5_TagsMatchIgnoringCaseAndSpaces() =>
        Technology.Normalize(" react ").ShouldBe(Technology.Normalize("React"));

    [Test]
    public void CreateKeepsTheNameAsTypedButTrimmed()
    {
        var tag = Technology.Create("  C#  ");

        tag.Name.ShouldBe("C#");
        tag.NormalizedName.ShouldBe("C#");
    }
}
