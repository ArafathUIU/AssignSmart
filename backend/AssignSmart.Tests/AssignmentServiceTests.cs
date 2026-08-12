using AssignSmart.Api.DTOs;
using AssignSmart.Api.Exceptions;
using AssignSmart.Api.Services;
using AssignSmart.Tests.Helpers;
using Microsoft.AspNetCore.Http;

namespace AssignSmart.Tests;

public class AssignmentServiceTests
{
    [Fact]
    public async Task Create_TeacherNotAssignedToClassSubject_ThrowsForbidden()
    {
        var db = TestDbContextFactory.CreateContext();
        var seed = TestDbContextFactory.Seed(db);
        var service = new AssignmentService(db);

        var ex = await Assert.ThrowsAsync<ApiException>(() =>
            service.CreateAssignmentAsync(seed.Teacher.Id, new CreateAssignmentRequest(
                "Physics Homework", "desc", seed.ClassA.Id, seed.Physics.Id,
                DateTime.UtcNow.AddDays(5), 20, true, null)));

        Assert.Equal(StatusCodes.Status403Forbidden, ex.StatusCode);
    }

    [Fact]
    public async Task Create_WithPastDeadline_ThrowsBadRequest()
    {
        var db = TestDbContextFactory.CreateContext();
        var seed = TestDbContextFactory.Seed(db);

        var unassignedSubject = new AssignSmart.Api.Models.Subject
        {
            Id = Guid.NewGuid(),
            Name = "Chemistry",
            Code = "CHEM"
        };
        db.Subjects.Add(unassignedSubject);
        db.TeacherAssignments.Add(new AssignSmart.Api.Models.TeacherAssignment
        {
            Id = Guid.NewGuid(),
            TeacherId = seed.Teacher.Id,
            ClassId = seed.ClassA.Id,
            SubjectId = unassignedSubject.Id
        });
        await db.SaveChangesAsync();

        var service = new AssignmentService(db);

        var ex = await Assert.ThrowsAsync<ApiException>(() =>
            service.CreateAssignmentAsync(seed.Teacher.Id, new CreateAssignmentRequest(
                "Late Homework", "desc", seed.ClassA.Id, unassignedSubject.Id,
                DateTime.UtcNow.AddDays(-1), 20, true, null)));

        Assert.Equal(StatusCodes.Status400BadRequest, ex.StatusCode);
    }

    [Fact]
    public async Task Create_AssignedTeacher_CreatesAssignment()
    {
        var db = TestDbContextFactory.CreateContext();
        var seed = TestDbContextFactory.Seed(db);

        var subject = new AssignSmart.Api.Models.Subject
        {
            Id = Guid.NewGuid(),
            Name = "Chemistry",
            Code = "CHEM"
        };
        db.Subjects.Add(subject);
        db.TeacherAssignments.Add(new AssignSmart.Api.Models.TeacherAssignment
        {
            Id = Guid.NewGuid(),
            TeacherId = seed.Teacher.Id,
            ClassId = seed.ClassA.Id,
            SubjectId = subject.Id
        });
        await db.SaveChangesAsync();

        var service = new AssignmentService(db);

        var created = await service.CreateAssignmentAsync(seed.Teacher.Id, new CreateAssignmentRequest(
            "Chemistry Homework", "desc", seed.ClassA.Id, subject.Id,
            DateTime.UtcNow.AddDays(5), 20, true, null));

        Assert.Equal("Chemistry Homework", created.Title);
        Assert.True(created.IsPublished);
    }

    [Fact]
    public async Task GetAssignments_StudentOnlySeesPublishedForOwnClass()
    {
        var db = TestDbContextFactory.CreateContext();
        var seed = TestDbContextFactory.Seed(db);
        var service = new AssignmentService(db);

        var results = await service.GetAssignmentsAsync(seed.Student.Id, "Student");

        Assert.Equal(2, results.Count);
        Assert.All(results, a => Assert.True(a.IsPublished));
        Assert.All(results, a => Assert.Equal(seed.ClassA.Id, a.ClassId));
    }

    [Fact]
    public async Task GetAssignments_TeacherOnlySeesOwn()
    {
        var db = TestDbContextFactory.CreateContext();
        var seed = TestDbContextFactory.Seed(db);
        var service = new AssignmentService(db);

        var results = await service.GetAssignmentsAsync(seed.Teacher.Id, "Teacher");

        Assert.Equal(4, results.Count);
        Assert.All(results, a => Assert.Equal(seed.Teacher.Id, a.TeacherId));
    }

    [Fact]
    public async Task Update_ByNonOwningTeacher_ThrowsForbidden()
    {
        var db = TestDbContextFactory.CreateContext();
        var seed = TestDbContextFactory.Seed(db);
        var service = new AssignmentService(db);

        var ex = await Assert.ThrowsAsync<ApiException>(() =>
            service.UpdateAssignmentAsync(seed.Published.Id, seed.OtherTeacher.Id,
                new UpdateAssignmentRequest("Hacked", null, null, null, null, null, null, null)));

        Assert.Equal(StatusCodes.Status403Forbidden, ex.StatusCode);
    }

    [Fact]
    public async Task Delete_ByNonOwningTeacher_ThrowsForbidden()
    {
        var db = TestDbContextFactory.CreateContext();
        var seed = TestDbContextFactory.Seed(db);
        var service = new AssignmentService(db);

        var ex = await Assert.ThrowsAsync<ApiException>(() =>
            service.DeleteAssignmentAsync(seed.Published.Id, seed.OtherTeacher.Id));

        Assert.Equal(StatusCodes.Status403Forbidden, ex.StatusCode);
    }

    [Fact]
    public async Task SetPublished_ByOwningTeacher_TogglesPublish()
    {
        var db = TestDbContextFactory.CreateContext();
        var seed = TestDbContextFactory.Seed(db);
        var service = new AssignmentService(db);

        var unpublished = await service.SetPublishedAsync(seed.Draft.Id, seed.Teacher.Id, true);

        Assert.True(unpublished.IsPublished);
    }

    [Fact]
    public async Task GetAssignment_StudentCannotViewDraft()
    {
        var db = TestDbContextFactory.CreateContext();
        var seed = TestDbContextFactory.Seed(db);
        var service = new AssignmentService(db);

        var ex = await Assert.ThrowsAsync<ApiException>(() =>
            service.GetAssignmentAsync(seed.Draft.Id, seed.Student.Id, "Student"));

        Assert.Equal(StatusCodes.Status403Forbidden, ex.StatusCode);
    }

    [Fact]
    public async Task GetAssignment_StudentCannotViewOtherClass()
    {
        var db = TestDbContextFactory.CreateContext();
        var seed = TestDbContextFactory.Seed(db);
        var service = new AssignmentService(db);

        var ex = await Assert.ThrowsAsync<ApiException>(() =>
            service.GetAssignmentAsync(seed.OtherClassPublished.Id, seed.Student.Id, "Student"));

        Assert.Equal(StatusCodes.Status403Forbidden, ex.StatusCode);
    }

    [Fact]
    public async Task GetSubmissions_ByNonOwningTeacher_ThrowsForbidden()
    {
        var db = TestDbContextFactory.CreateContext();
        var seed = TestDbContextFactory.Seed(db);
        var service = new AssignmentService(db);

        var ex = await Assert.ThrowsAsync<ApiException>(() =>
            service.GetSubmissionsForAssignmentAsync(seed.Published.Id, seed.OtherTeacher.Id));

        Assert.Equal(StatusCodes.Status403Forbidden, ex.StatusCode);
    }
}
