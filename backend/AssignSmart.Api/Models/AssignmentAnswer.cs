using System.ComponentModel.DataAnnotations;

namespace AssignSmart.Api.Models;

public class AssignmentAnswer
{
    public Guid Id { get; set; }

    public Guid QuestionId { get; set; }
    public AssignmentQuestion Question { get; set; } = null!;

    public Guid TeacherId { get; set; }
    public User Teacher { get; set; } = null!;

    [Required, MaxLength(2000)]
    public string Answer { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
