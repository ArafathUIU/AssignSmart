using System.ComponentModel.DataAnnotations;

namespace AssignSmart.Api.Models;

public class Assignment
{
    public Guid Id { get; set; }

    [Required, MaxLength(200)]
    public string Title { get; set; } = string.Empty;

    public string? Description { get; set; }

    public Guid TeacherId { get; set; }
    public User Teacher { get; set; } = null!;

    public Guid ClassId { get; set; }
    public SchoolClass Class { get; set; } = null!;

    public Guid SubjectId { get; set; }
    public Subject Subject { get; set; } = null!;

    public DateTime Deadline { get; set; }

    [Range(1, double.MaxValue)]
    public decimal MaxMarks { get; set; }

    public bool IsPublished { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? UpdatedAt { get; set; }

    public List<Submission> Submissions { get; set; } = new();

    [MaxLength(500)]
    public string? AllowedFileTypes { get; set; }

    public List<AssignmentQuestion> Questions { get; set; } = new();
}
