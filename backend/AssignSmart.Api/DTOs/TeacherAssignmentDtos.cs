using System.ComponentModel.DataAnnotations;

namespace AssignSmart.Api.DTOs;

public record CreateTeacherAssignmentRequest(
    [Required] Guid TeacherId,
    [Required] Guid ClassId,
    [Required] Guid SubjectId);

public record TeacherAssignmentDto(
    Guid Id,
    Guid TeacherId,
    string TeacherName,
    Guid ClassId,
    string ClassName,
    Guid SubjectId,
    string SubjectName);
