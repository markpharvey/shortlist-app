using Shortlist.Application.JobApplications.Commands.CreateJobApplication;
using Shortlist.Application.JobApplications.Commands.DeleteJobApplication;
using Shortlist.Application.JobApplications.Commands.UpdateJobApplication;
using Shortlist.Application.JobApplications.Queries.GetJobApplications;
using Microsoft.AspNetCore.Http.HttpResults;

namespace Shortlist.Web.Endpoints;

public class JobApplications : IEndpointGroup
{
    public static void Map(RouteGroupBuilder groupBuilder)
    {
        groupBuilder.RequireAuthorization();

        groupBuilder.MapGet(GetJobApplications);
        groupBuilder.MapPost(CreateJobApplication);
        groupBuilder.MapPut(UpdateJobApplication, "{id}");
        groupBuilder.MapDelete(DeleteJobApplication, "{id}");
    }

    [EndpointSummary("Get my job applications")]
    [EndpointDescription("Returns the signed-in user's job applications, newest first, with optional filters, plus the choices for status and work arrangement and the most common stack tags.")]
    public static async Task<Ok<JobApplicationsVm>> GetJobApplications(ISender sender,
        int? status, int? workArrangement, string? technology, int? maxCommuteMinutes)
    {
        var vm = await sender.Send(new GetJobApplicationsQuery
        {
            Status = status,
            WorkArrangement = workArrangement,
            Technology = technology,
            MaxCommuteMinutes = maxCommuteMinutes
        });

        return TypedResults.Ok(vm);
    }

    [EndpointSummary("Add a job application")]
    [EndpointDescription("Creates a job application owned by the signed-in user and returns its ID.")]
    public static async Task<Created<int>> CreateJobApplication(ISender sender, CreateJobApplicationCommand command)
    {
        var id = await sender.Send(command);

        return TypedResults.Created($"/{nameof(JobApplications)}/{id}", id);
    }

    [EndpointSummary("Update a job application")]
    [EndpointDescription("Updates one of the signed-in user's job applications. The ID in the URL must match the ID in the payload.")]
    public static async Task<Results<NoContent, BadRequest>> UpdateJobApplication(ISender sender, int id, UpdateJobApplicationCommand command)
    {
        if (id != command.Id) return TypedResults.BadRequest();

        await sender.Send(command);

        return TypedResults.NoContent();
    }

    [EndpointSummary("Delete a job application")]
    [EndpointDescription("Deletes one of the signed-in user's job applications.")]
    public static async Task<NoContent> DeleteJobApplication(ISender sender, int id)
    {
        await sender.Send(new DeleteJobApplicationCommand(id));

        return TypedResults.NoContent();
    }
}
