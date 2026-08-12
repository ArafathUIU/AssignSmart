using AssignSmart.Api.Data;
using AssignSmart.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace AssignSmart.Tests.Helpers;

public static class TestDbContextFactory
{
    public static AppDbContext CreateContext() =>
        new(new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options);

    public static SeedFixture Seed(AppDbContext db)
    {
        var now = DateTime.UtcNow;

        var classA = new SchoolClass { Id = Guid.NewGuid(), Name = "Class 10 - A", Code = "X-A" };
        var classB = new SchoolClass { Id = Guid.NewGuid(), Name = "Class 10 - B", Code = "X-B" };

        var math = new Subject { Id = Guid.NewGuid(), Name = "Mathematics", Code = "MATH" };
        var physics = new Subject { Id = Guid.NewGuid(), Name = "Physics", Code = "PHY" };

        var admin = User("Admin", Role.Admin, null);
        var teacher = User("Teacher A", Role.Teacher, null);
        var otherTeacher = User("Teacher B", Role.Teacher, null);
        var student = User("Student A", Role.Student, classA.Id);
        var otherStudent = User("Student B", Role.Student, classB.Id);

        var teacherAssignment = new TeacherAssignment
        {
            Id = Guid.NewGuid(),
            TeacherId = teacher.Id,
            ClassId = classA.Id,
            SubjectId = math.Id
        };

        var published = new Assignment
        {
            Id = Guid.NewGuid(),
            Title = "Published Assignment",
            TeacherId = teacher.Id,
            ClassId = classA.Id,
            SubjectId = math.Id,
            Deadline = now.AddDays(10),
            MaxMarks = 20,
            IsPublished = true
        };

        var draft = new Assignment
        {
            Id = Guid.NewGuid(),
            Title = "Draft Assignment",
            TeacherId = teacher.Id,
            ClassId = classA.Id,
            SubjectId = math.Id,
            Deadline = now.AddDays(10),
            MaxMarks = 20,
            IsPublished = false
        };

        var pastDeadline = new Assignment
        {
            Id = Guid.NewGuid(),
            Title = "Past Deadline Assignment",
            TeacherId = teacher.Id,
            ClassId = classA.Id,
            SubjectId = math.Id,
            Deadline = now.AddDays(-1),
            MaxMarks = 20,
            IsPublished = true
        };

        var otherClassPublished = new Assignment
        {
            Id = Guid.NewGuid(),
            Title = "Other Class Assignment",
            TeacherId = teacher.Id,
            ClassId = classB.Id,
            SubjectId = math.Id,
            Deadline = now.AddDays(10),
            MaxMarks = 20,
            IsPublished = true
        };

        db.Classes.AddRange(classA, classB);
        db.Subjects.AddRange(math, physics);
        db.Users.AddRange(admin, teacher, otherTeacher, student, otherStudent);
        db.TeacherAssignments.Add(teacherAssignment);
        db.Assignments.AddRange(published, draft, pastDeadline, otherClassPublished);
        db.SaveChanges();

        return new SeedFixture(admin, teacher, otherTeacher, student, otherStudent, classA, classB, math, physics, published, draft, pastDeadline, otherClassPublished);
    }

    private static User User(string name, Role role, Guid? classId) => new()
    {
        Id = Guid.NewGuid(),
        Name = name,
        Email = $"{Guid.NewGuid():N}@test.com",
        PasswordHash = "hash",
        Role = role,
        ClassId = classId,
        CreatedAt = DateTime.UtcNow
    };

    public sealed record SeedFixture(
        User Admin,
        User Teacher,
        User OtherTeacher,
        User Student,
        User OtherStudent,
        SchoolClass ClassA,
        SchoolClass ClassB,
        Subject Math,
        Subject Physics,
        Assignment Published,
        Assignment Draft,
        Assignment PastDeadline,
        Assignment OtherClassPublished);
}
