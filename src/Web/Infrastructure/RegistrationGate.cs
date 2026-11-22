using Shortlist.Infrastructure.Identity;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.Data;

namespace Shortlist.Web.Infrastructure;

/// <summary>
/// Decides who may create an account. Shortlist is a personal tracker on a public address,
/// so outside development only the owner can register:
/// <list type="bullet">
/// <item>If <c>Registration:AllowedEmails</c> is set (comma-separated), only those addresses.</item>
/// <item>Otherwise, only the very first account. After that, registration is closed.</item>
/// </list>
/// </summary>
public class RegistrationGate : IEndpointFilter
{
    public async ValueTask<object?> InvokeAsync(EndpointFilterInvocationContext context, EndpointFilterDelegate next)
    {
        var http = context.HttpContext;
        var isRegister = HttpMethods.IsPost(http.Request.Method)
            && http.Request.Path.Value?.EndsWith("/register", StringComparison.OrdinalIgnoreCase) == true;

        if (!isRegister || http.RequestServices.GetRequiredService<IHostEnvironment>().IsDevelopment())
        {
            return await next(context);
        }

        var allowed = (http.RequestServices.GetRequiredService<IConfiguration>()["Registration:AllowedEmails"] ?? string.Empty)
            .Split([',', ';'], StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

        var email = context.Arguments.OfType<RegisterRequest>().FirstOrDefault()?.Email;
        var anyUsersExist = allowed.Length == 0
            && http.RequestServices.GetRequiredService<UserManager<ApplicationUser>>().Users.Any();
        var permitted = MayRegister(email, allowed, anyUsersExist);

        return permitted
            ? await next(context)
            : TypedResults.Problem(
                title: "Registration is closed",
                detail: "This Shortlist belongs to someone else. Ask the owner to add your email address.",
                statusCode: StatusCodes.Status403Forbidden);
    }

    public static bool MayRegister(string? email, IReadOnlyCollection<string> allowedEmails, bool anyUsersExist) =>
        allowedEmails.Count > 0
            ? email != null && allowedEmails.Contains(email, StringComparer.OrdinalIgnoreCase)
            : !anyUsersExist;
}
