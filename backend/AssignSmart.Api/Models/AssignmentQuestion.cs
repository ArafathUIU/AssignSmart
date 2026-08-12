using System.ComponentModel.DataAnnotations;

namespace AssignSmart.Api.Models;

public class AssignmentQuestion
{
    public Guid Id { get; set; }

    public Guid AssignmentId { get; set; }
    public Assignment Assignment { get; set; } = null!;

    public Guid StudentId { get; set; }
    public User Student { get; set; } = null!;

    [Required, MaxLength(2000)]
    public string Question { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public List<AssignmentAnswer> Answers { get; set; } = new();
}
