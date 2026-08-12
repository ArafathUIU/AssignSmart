using System.ComponentModel.DataAnnotations;

namespace AssignSmart.Api.DTOs;

public record CreateUserRequest(
    [Required, MaxLength(100)] string Name,
    [Required, EmailAddress, MaxLength(255)] string Email,
    [Required, MinLength(6)] string Password,
    [Required] string Role,
    Guid? ClassId);

public record UpdateUserRequest(
    [MaxLength(100)] string? Name,
    [EmailAddress, MaxLength(255)] string? Email,
    [MinLength(6)] string? Password,
    string? Role,
    Guid? ClassId);

public record UserDto(
    Guid Id,
    string Name,
    string Email,
    string Role,
    Guid? ClassId,
    string? ClassName,
    DateTime CreatedAt);
