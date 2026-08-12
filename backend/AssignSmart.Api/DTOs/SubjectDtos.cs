using System.ComponentModel.DataAnnotations;

namespace AssignSmart.Api.DTOs;

public record CreateSubjectRequest(
    [Required, MaxLength(100)] string Name,
    [MaxLength(20)] string? Code);

public record UpdateSubjectRequest(
    [MaxLength(100)] string? Name,
    [MaxLength(20)] string? Code);

public record SubjectDto(Guid Id, string Name, string? Code);
