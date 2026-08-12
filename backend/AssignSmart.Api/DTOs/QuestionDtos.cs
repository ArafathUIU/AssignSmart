using System.ComponentModel.DataAnnotations;

namespace AssignSmart.Api.DTOs;

public record CreateQuestionRequest(
    [Required, MaxLength(2000)] string Question);

public record CreateAnswerRequest(
    [Required, MaxLength(2000)] string Answer);

public record AssignmentAnswerDto(
    Guid Id,
    Guid TeacherId,
    string TeacherName,
    string Answer,
    DateTime CreatedAt);

public record AssignmentQuestionDto(
    Guid Id,
    Guid StudentId,
    string StudentName,
    string Question,
    DateTime CreatedAt,
    List<AssignmentAnswerDto> Answers);
