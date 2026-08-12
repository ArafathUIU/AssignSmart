using System.ComponentModel.DataAnnotations;

namespace AssignSmart.Api.Models;

public class SubmissionAttachment
{
    public Guid Id { get; set; }

    public Guid SubmissionId { get; set; }
    public Submission Submission { get; set; } = null!;

    [Required, MaxLength(255)]
    public string FileName { get; set; } = string.Empty;

    [Required, MaxLength(100)]
    public string ContentType { get; set; } = string.Empty;

    public long FileSize { get; set; }

    [Required]
    public string FileData { get; set; } = string.Empty;
}
