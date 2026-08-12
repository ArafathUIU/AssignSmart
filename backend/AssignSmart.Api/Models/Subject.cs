using System.ComponentModel.DataAnnotations;

namespace AssignSmart.Api.Models;

public class Subject
{
    public Guid Id { get; set; }

    [Required, MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(20)]
    public string? Code { get; set; }

    public List<TeacherAssignment> TeacherAssignments { get; set; } = new();

    public List<Assignment> Assignments { get; set; } = new();
}
