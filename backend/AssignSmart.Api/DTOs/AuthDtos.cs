using System.ComponentModel.DataAnnotations;

namespace AssignSmart.Api.DTOs;

public record LoginRequest(
    [Required, EmailAddress] string Email,
    [Required] string Password);

public record LoginResponse(
    string Token,
    UserDto User);
