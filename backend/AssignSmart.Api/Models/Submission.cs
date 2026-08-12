using System.ComponentModel.DataAnnotations;

namespace AssignSmart.Api.Models;

public class Submission
{
    public Guid Id { get; set; }

    public Guid AssignmentId { get; set; }
    public Assignment Assignment { get; set; } = null!;

    public Guid StudentId { get; set; }
    public User Student { get; set; } = null!;

    [Required]
    public string Answer { get; set; } = string.Empty;

    public SubmissionStatus Status { get; set; } = SubmissionStatus.Submitted;

    public decimal? Marks { get; set; }

    public string? Feedback { get; set; }

    public DateTime SubmittedAt { get; set; } = DateTime.UtcNow;

    public DateTime? UpdatedAt { get; set; }

    public DateTime? GradedAt { get; set; }

    public List<SubmissionAttachment> Attachments { get; set; } = new();
}
