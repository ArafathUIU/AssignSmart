using System.ComponentModel.DataAnnotations;

namespace AssignSmart.Api.DTOs;

public record CreateSubmissionRequest(
    [Required] Guid AssignmentId,
    [MinLength(1)] string? Answer,
    List<CreateSubmissionAttachmentRequest>? Attachments);

public record CreateSubmissionAttachmentRequest(
    [Required, MaxLength(255)] string FileName,
    [Required, MaxLength(100)] string ContentType,
    long FileSize,
    [Required] string FileData);

public record UpdateSubmissionRequest(
    [MinLength(1)] string? Answer,
    List<CreateSubmissionAttachmentRequest>? Attachments);

public record GradeSubmissionRequest(
    [Range(0, double.MaxValue)] decimal Marks,
    string? Feedback);

public record UpdateSubmissionStatusRequest(
    [Required] string Status);

public record SubmissionAttachmentDto(
    Guid Id,
    string FileName,
    string ContentType,
    long FileSize);

public record SubmissionDto(
    Guid Id,
    Guid AssignmentId,
    string AssignmentTitle,
    Guid StudentId,
    string StudentName,
    string Answer,
    string Status,
    decimal? Marks,
    string? Feedback,
    DateTime SubmittedAt,
    DateTime? GradedAt,
    DateTime Deadline,
    List<SubmissionAttachmentDto> Attachments);
