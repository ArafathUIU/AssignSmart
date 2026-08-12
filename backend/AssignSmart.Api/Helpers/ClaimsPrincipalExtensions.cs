using System.Security.Claims;
using System.IdentityModel.Tokens.Jwt;
using AssignSmart.Api.Exceptions;

namespace AssignSmart.Api.Helpers;

public static class ClaimsPrincipalExtensions
{
    public static Guid GetUserId(this ClaimsPrincipal principal)
    {
        var value = principal.FindFirstValue(JwtRegisteredClaimNames.Sub)
                    ?? principal.FindFirstValue(ClaimTypes.NameIdentifier);

        if (Guid.TryParse(value, out var id))
        {
            return id;
        }

        throw new ApiException(StatusCodes.Status401Unauthorized, "Invalid token identity.");
    }
}
