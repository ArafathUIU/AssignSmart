using System.ComponentModel.DataAnnotations;

namespace AssignSmart.Api.DTOs;

public record CreateClassRequest(
    [Required, MaxLength(100)] string Name,
    [MaxLength(20)] string? Code);

public record UpdateClassRequest(
    [MaxLength(100)] string? Name,
    [MaxLength(20)] string? Code);

public record ClassDto(Guid Id, string Name, string? Code);

public record ClassDetailDto(Guid Id, string Name, string? Code, int StudentCount);
