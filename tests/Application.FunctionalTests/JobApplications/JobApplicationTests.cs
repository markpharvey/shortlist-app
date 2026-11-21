using Shortlist.Application.Common.Exceptions;
using Shortlist.Application.JobApplications.Commands.CreateJobApplication;
using Shortlist.Application.JobApplications.Commands.DeleteJobApplication;
using Shortlist.Application.JobApplications.Commands.UpdateJobApplication;
using Shortlist.Application.JobApplications.Queries.GetJobApplications;
using Shortlist.Domain.Entities;
using Shortlist.Domain.Enums;

namespace Shortlist.Application.FunctionalTests.JobApplications;

/// <summary>The acceptance tests in docs/specs/job-applications.md, against a real database.</summary>
public class JobApplicationTests : TestBase
{
    private static CreateJobApplicationCommand Job(string company, WorkArrangement arrangement = WorkArrangement.Hybrid,
        int? commute = null, params string[] stack) => new()
    {
        Company = company,
        JobTitle = "Developer",
        WorkArrangement = (int)arrangement,
        Status = (int)ApplicationStatus.Interested,
        CommuteMinutes = commute,
        Technologies = stack
    };

    [Test]
    public async Task MustBeSignedIn()
    {
        await Should.ThrowAsync<UnauthorizedAccessException>(() => TestApp.SendAsync(Job("Acme")));
        await Should.ThrowAsync<UnauthorizedAccessException>(() => TestApp.SendAsync(new GetJobApplicationsQuery()));
    }

    [Test]
    public async Task ShouldRejectInvalidFields()
    {
        await TestApp.RunAsDefaultUserAsync();

        await Should.ThrowAsync<ValidationException>(() => TestApp.SendAsync(Job("")));
    }

    [Test]
    public async Task ShouldCreateWithOwnerAndTags()
    {
        var userId = await TestApp.RunAsDefaultUserAsync();

        var id = await TestApp.SendAsync(Job("TechnologyOne", WorkArrangement.Hybrid, null, "C#", "React") with
        {
            Location = "Brisbane CBD",
            SalaryMin = 90_000,
            SalaryMax = 110_000
        });

        var vm = await TestApp.SendAsync(new GetJobApplicationsQuery());

        vm.Items.Count.ShouldBe(1);
        var item = vm.Items[0];
        item.Id.ShouldBe(id);
        item.Company.ShouldBe("TechnologyOne");
        item.Location.ShouldBe("Brisbane CBD");
        item.SalaryMin.ShouldBe(90_000);
        item.Technologies.ShouldBe(new[] { "C#", "React" });

        var saved = await TestApp.FindAsync<JobApplication>(id);
        saved!.OwnerId.ShouldBe(userId);
        saved.CreatedBy.ShouldBe(userId);
    }

    [Test]
    public async Task Rule5_ShouldShareTagsIgnoringCase()
    {
        await TestApp.RunAsDefaultUserAsync();

        await TestApp.SendAsync(Job("A", WorkArrangement.Hybrid, null, "React", "Azure"));
        await TestApp.SendAsync(Job("B", WorkArrangement.Hybrid, null, "react ", "REACT"));

        (await TestApp.CountAsync<Technology>()).ShouldBe(2);

        var vm = await TestApp.SendAsync(new GetJobApplicationsQuery());
        vm.TopTechnologies[0].Name.ShouldBe("React");
        vm.TopTechnologies[0].Count.ShouldBe(2);
        vm.TopTechnologies[1].Name.ShouldBe("Azure");
        vm.TopTechnologies[1].Count.ShouldBe(1);
    }

    [Test]
    public async Task ShouldUpdateIncludingStatusAndTags()
    {
        await TestApp.RunAsDefaultUserAsync();
        var id = await TestApp.SendAsync(Job("Acme", WorkArrangement.Hybrid, null, "PHP"));

        await TestApp.SendAsync(new UpdateJobApplicationCommand
        {
            Id = id,
            Company = "Acme",
            JobTitle = "Junior developer",
            WorkArrangement = (int)WorkArrangement.Remote,
            Status = (int)ApplicationStatus.Interview,
            DateApplied = new DateOnly(2026, 11, 20),
            Technologies = new[] { "C#" }
        });

        var item = (await TestApp.SendAsync(new GetJobApplicationsQuery())).Items.Single();
        item.JobTitle.ShouldBe("Junior developer");
        item.Status.ShouldBe((int)ApplicationStatus.Interview);
        item.DateApplied.ShouldBe(new DateOnly(2026, 11, 20));
        item.Technologies.ShouldBe(new[] { "C#" });
    }

    [Test]
    public async Task ShouldDelete()
    {
        await TestApp.RunAsDefaultUserAsync();
        var id = await TestApp.SendAsync(Job("Acme"));

        await TestApp.SendAsync(new DeleteJobApplicationCommand(id));

        (await TestApp.FindAsync<JobApplication>(id)).ShouldBeNull();
    }

    [Test]
    public async Task ShouldFilterByStatusArrangementTagAndCommute()
    {
        await TestApp.RunAsDefaultUserAsync();
        await TestApp.SendAsync(Job("Near", WorkArrangement.InPerson, 20, "C#"));
        await TestApp.SendAsync(Job("Far", WorkArrangement.InPerson, 90, "C#"));
        await TestApp.SendAsync(Job("FarHybrid", WorkArrangement.Hybrid, 75, "React"));
        await TestApp.SendAsync(Job("Remote", WorkArrangement.Remote, 300, "React"));
        await TestApp.SendAsync(Job("Unknown", WorkArrangement.InPerson, null, "Python"));

        async Task<string[]> Companies(GetJobApplicationsQuery q) =>
            (await TestApp.SendAsync(q)).Items.Select(i => i.Company).OrderBy(c => c).ToArray();

        (await Companies(new() { MaxCommuteMinutes = 45 })).ShouldBe(new[] { "Near", "Remote", "Unknown" });
        (await Companies(new() { Technology = "react" })).ShouldBe(new[] { "FarHybrid", "Remote" });
        (await Companies(new() { WorkArrangement = (int)WorkArrangement.Remote })).ShouldBe(new[] { "Remote" });
        (await Companies(new() { Status = (int)ApplicationStatus.Offer })).ShouldBeEmpty();
    }

    [Test]
    public async Task ShouldListNewestFirst()
    {
        await TestApp.RunAsDefaultUserAsync();
        await TestApp.SendAsync(Job("First"));
        await TestApp.SendAsync(Job("Second"));

        (await TestApp.SendAsync(new GetJobApplicationsQuery())).Items.Select(i => i.Company).ShouldBe(new[] { "Second", "First" });
    }

    [Test]
    public async Task Rule6_UsersCannotSeeOrChangeEachOthersApplications()
    {
        await TestApp.RunAsUserAsync("alex@local", "Testing1234!", []);
        var alexs = await TestApp.SendAsync(Job("Alex's job", WorkArrangement.Hybrid, null, "Go"));

        await TestApp.RunAsDefaultUserAsync();

        var vm = await TestApp.SendAsync(new GetJobApplicationsQuery());
        vm.Items.ShouldBeEmpty();
        vm.TopTechnologies.ShouldBeEmpty();

        await Should.ThrowAsync<NotFoundException>(() => TestApp.SendAsync(new UpdateJobApplicationCommand
        {
            Id = alexs, Company = "Mine now", JobTitle = "x", Status = 0, WorkArrangement = 0
        }));
        await Should.ThrowAsync<NotFoundException>(() => TestApp.SendAsync(new DeleteJobApplicationCommand(alexs)));

        (await TestApp.FindAsync<JobApplication>(alexs))!.Company.ShouldBe("Alex's job");
    }
}
