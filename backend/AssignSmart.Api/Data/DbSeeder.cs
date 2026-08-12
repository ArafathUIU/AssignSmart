using AssignSmart.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace AssignSmart.Api.Data;

public static class DbSeeder
{
    public static async Task SeedAsync(AppDbContext db)
    {
        if (await db.Users.AnyAsync())
        {
            return;
        }

        var admin = NewUser("Admin", "admin@assignsmart.com", "Admin@123", Role.Admin);
        var teacher1 = NewUser("Rahim Uddin", "teacher@assignsmart.com", "Teacher@123", Role.Teacher);
        var teacher2 = NewUser("Karim Ahmed", "teacher2@assignsmart.com", "Teacher@123", Role.Teacher);

        var classA = new SchoolClass { Id = Guid.NewGuid(), Name = "Class 10 - Section A", Code = "X-A" };
        var classB = new SchoolClass { Id = Guid.NewGuid(), Name = "Class 10 - Section B", Code = "X-B" };

        var math = new Subject { Id = Guid.NewGuid(), Name = "Mathematics", Code = "MATH" };
        var physics = new Subject { Id = Guid.NewGuid(), Name = "Physics", Code = "PHY" };
        var english = new Subject { Id = Guid.NewGuid(), Name = "English", Code = "ENG" };

        var student1 = NewUser("Sadia Rahman", "student@assignsmart.com", "Student@123", Role.Student);
        student1.ClassId = classA.Id;

        var student2 = NewUser("Tanvir Hasan", "student2@assignsmart.com", "Student@123", Role.Student);
        student2.ClassId = classB.Id;

        db.Classes.AddRange(classA, classB);
        db.Subjects.AddRange(math, physics, english);
        db.Users.AddRange(admin, teacher1, teacher2, student1, student2);

        var ta1 = new TeacherAssignment
        {
            Id = Guid.NewGuid(),
            TeacherId = teacher1.Id,
            ClassId = classA.Id,
            SubjectId = math.Id
        };

        var ta2 = new TeacherAssignment
        {
            Id = Guid.NewGuid(),
            TeacherId = teacher1.Id,
            ClassId = classA.Id,
            SubjectId = physics.Id
        };

        var ta3 = new TeacherAssignment
        {
            Id = Guid.NewGuid(),
            TeacherId = teacher2.Id,
            ClassId = classB.Id,
            SubjectId = english.Id
        };

        db.TeacherAssignments.AddRange(ta1, ta2, ta3);

        var now = DateTime.UtcNow;

        var assignment1 = new Assignment
        {
            Id = Guid.NewGuid(),
            Title = "Algebra Worksheet",
            Description = "Solve linear equations and factorisation problems from chapters 2 and 3.",
            TeacherId = teacher1.Id,
            ClassId = classA.Id,
            SubjectId = math.Id,
            Deadline = now.AddDays(10),
            MaxMarks = 20,
            IsPublished = true
        };

        var assignment2 = new Assignment
        {
            Id = Guid.NewGuid(),
            Title = "Newton's Laws of Motion",
            Description = "Write an essay explaining Newton's three laws with real-life examples.",
            TeacherId = teacher1.Id,
            ClassId = classA.Id,
            SubjectId = physics.Id,
            Deadline = now.AddDays(15),
            MaxMarks = 30,
            IsPublished = false
        };

        var assignment3 = new Assignment
        {
            Id = Guid.NewGuid(),
            Title = "Trigonometry Quiz",
            Description = "Answer the short questions on trigonometric ratios.",
            TeacherId = teacher1.Id,
            ClassId = classA.Id,
            SubjectId = math.Id,
            Deadline = now.AddDays(7),
            MaxMarks = 10,
            IsPublished = true
        };

        var assignment4 = new Assignment
        {
            Id = Guid.NewGuid(),
            Title = "English Essay: My Future Plans",
            Description = "Write a 500-word essay about your future plans.",
            TeacherId = teacher2.Id,
            ClassId = classB.Id,
            SubjectId = english.Id,
            Deadline = now.AddDays(12),
            MaxMarks = 25,
            IsPublished = true
        };

        db.Assignments.AddRange(assignment1, assignment2, assignment3, assignment4);

        var submission1 = new Submission
        {
            Id = Guid.NewGuid(),
            AssignmentId = assignment1.Id,
            StudentId = student1.Id,
            Answer = "x = 4, y = -2; factorised results attached.",
            Status = SubmissionStatus.Submitted,
            SubmittedAt = now.AddDays(-1)
        };

        var submission2 = new Submission
        {
            Id = Guid.NewGuid(),
            AssignmentId = assignment3.Id,
            StudentId = student1.Id,
            Answer = "sin 30 = 1/2, cos 60 = 1/2, tan 45 = 1.",
            Status = SubmissionStatus.Graded,
            Marks = 8,
            Feedback = "Well done! Review the definitions once more.",
            SubmittedAt = now.AddDays(-2),
            GradedAt = now.AddDays(-1)
        };

        var submission3 = new Submission
        {
            Id = Guid.NewGuid(),
            AssignmentId = assignment4.Id,
            StudentId = student2.Id,
            Answer = "My future plans essay (attached).",
            Status = SubmissionStatus.Submitted,
            SubmittedAt = now.AddHours(-3)
        };

        db.Submissions.AddRange(submission1, submission2, submission3);

        await db.SaveChangesAsync();
    }

    private static User NewUser(string name, string email, string password, Role role) => new()
    {
        Id = Guid.NewGuid(),
        Name = name,
        Email = email,
        PasswordHash = BCrypt.Net.BCrypt.HashPassword(password),
        Role = role,
        CreatedAt = DateTime.UtcNow
    };
}
