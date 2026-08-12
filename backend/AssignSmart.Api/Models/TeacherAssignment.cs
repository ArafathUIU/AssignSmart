namespace AssignSmart.Api.Models;

public class TeacherAssignment
{
    public Guid Id { get; set; }

    public Guid TeacherId { get; set; }
    public User Teacher { get; set; } = null!;

    public Guid ClassId { get; set; }
    public SchoolClass Class { get; set; } = null!;

    public Guid SubjectId { get; set; }
    public Subject Subject { get; set; } = null!;
}
