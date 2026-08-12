using System.ComponentModel.DataAnnotations;

namespace AssignSmart.Api.DTOs;

public record CreateAssignmentRequest(
    [Required, MaxLength(200)] string Title,
    string? Description,
    [Required] Guid ClassId,
    [Required] Guid SubjectId,
    DateTime Deadline,
    [Range(1, double.MaxValue)] decimal MaxMarks,
    bool? IsPublished,
    [MaxLength(500)] string? AllowedFileTypes);

public record UpdateAssignmentRequest(
    [MaxLength(200)] string? Title,
    string? Description,
    Guid? ClassId,
    Guid? SubjectId,
    DateTime? Deadline,
    [Range(1, double.MaxValue)] decimal? MaxMarks,
    bool? IsPublished,
    [MaxLength(500)] string? AllowedFileTypes);

public record SetPublishedRequest(bool IsPublished);

public record AssignmentDto(
    Guid Id,
    string Title,
    string? Description,
    Guid TeacherId,
    string TeacherName,
    Guid ClassId,
    string ClassName,
    Guid SubjectId,
    string SubjectName,
    DateTime Deadline,
    decimal MaxMarks,
    bool IsPublished,
    DateTime CreatedAt,
    int SubmissionCount,
    string? AllowedFileTypes);
