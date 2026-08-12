using AssignSmart.Api.Data;
using AssignSmart.Api.DTOs;
using AssignSmart.Api.Exceptions;
using AssignSmart.Api.Services;
using AssignSmart.Tests.Helpers;
using Microsoft.AspNetCore.Http;

namespace AssignSmart.Tests;

public class SubmissionServiceTests
{
    private readonly AppDbContext _db;
    private readonly TestDbContextFactory.SeedFixture _seed;

    public SubmissionServiceTests()
    {
        _db = TestDbContextFactory.CreateContext();
        _seed = TestDbContextFactory.Seed(_db);
    }

    private SubmissionService NewService() => new(_db);

    [Fact]
    public async Task Submit_WithValidAssignment_ReturnsSubmission()
    {
        var service = NewService();
        var result = await service.SubmitAsync(_seed.Student.Id,
            new CreateSubmissionRequest(_seed.Published.Id, "My answer", null));

        Assert.Equal("My answer", result.Answer);
        Assert.Equal("Submitted", result.Status);
        Assert.Null(result.Marks);
    }

    [Fact]
    public async Task Submit_UnpublishedAssignment_ThrowsBadRequest()
    {
        var service = NewService();
        var ex = await Assert.ThrowsAsync<ApiException>(() =>
            service.SubmitAsync(_seed.Student.Id, new CreateSubmissionRequest(_seed.Draft.Id, "answer", null)));

        Assert.Equal(StatusCodes.Status400BadRequest, ex.StatusCode);
    }

    [Fact]
    public async Task Submit_AssignmentOfAnotherClass_ThrowsForbidden()
    {
        var service = NewService();
        var ex = await Assert.ThrowsAsync<ApiException>(() =>
            service.SubmitAsync(_seed.Student.Id, new CreateSubmissionRequest(_seed.OtherClassPublished.Id, "answer", null)));

        Assert.Equal(StatusCodes.Status403Forbidden, ex.StatusCode);
    }

    [Fact]
    public async Task Submit_AfterDeadline_ThrowsBadRequest()
    {
        var service = NewService();
        var ex = await Assert.ThrowsAsync<ApiException>(() =>
            service.SubmitAsync(_seed.Student.Id, new CreateSubmissionRequest(_seed.PastDeadline.Id, "answer", null)));

        Assert.Equal(StatusCodes.Status400BadRequest, ex.StatusCode);
    }

    [Fact]
    public async Task Submit_NonStudentRole_ThrowsForbidden()
    {
        var service = NewService();
        var ex = await Assert.ThrowsAsync<ApiException>(() =>
            service.SubmitAsync(_seed.Teacher.Id, new CreateSubmissionRequest(_seed.Published.Id, "answer", null)));

        Assert.Equal(StatusCodes.Status403Forbidden, ex.StatusCode);
    }

    [Fact]
    public async Task Submit_TwiceForSameAssignment_ThrowsConflict()
    {
        var service = NewService();
        await service.SubmitAsync(_seed.Student.Id, new CreateSubmissionRequest(_seed.Published.Id, "first", null));

        var ex = await Assert.ThrowsAsync<ApiException>(() =>
            service.SubmitAsync(_seed.Student.Id, new CreateSubmissionRequest(_seed.Published.Id, "second", null)));

        Assert.Equal(StatusCodes.Status409Conflict, ex.StatusCode);
    }

    [Fact]
    public async Task Update_OwnSubmissionBeforeDeadline_UpdatesAnswer()
    {
        var service = NewService();
        var submission = await service.SubmitAsync(_seed.Student.Id,
            new CreateSubmissionRequest(_seed.Published.Id, "original", null));

        var updated = await service.UpdateSubmissionAsync(submission.Id, _seed.Student.Id,
            new UpdateSubmissionRequest("revised answer", null));

        Assert.Equal("revised answer", updated.Answer);
    }

    [Fact]
    public async Task Update_OtherStudentsSubmission_ThrowsForbidden()
    {
        var service = NewService();
        var submission = await service.SubmitAsync(_seed.Student.Id,
            new CreateSubmissionRequest(_seed.Published.Id, "original", null));

        var ex = await Assert.ThrowsAsync<ApiException>(() =>
            service.UpdateSubmissionAsync(submission.Id, _seed.OtherStudent.Id, new UpdateSubmissionRequest("hacked", null)));

        Assert.Equal(StatusCodes.Status403Forbidden, ex.StatusCode);
    }

    [Fact]
    public async Task Update_AfterDeadline_ThrowsBadRequest()
    {
        var submission = new AssignSmart.Api.Models.Submission
        {
            Id = Guid.NewGuid(),
            AssignmentId = _seed.PastDeadline.Id,
            StudentId = _seed.Student.Id,
            Answer = "late",
            Status = AssignSmart.Api.Models.SubmissionStatus.Submitted
        };
        _db.Submissions.Add(submission);
        await _db.SaveChangesAsync();

        var service = NewService();

        var ex = await Assert.ThrowsAsync<ApiException>(() =>
            service.UpdateSubmissionAsync(submission.Id, _seed.Student.Id, new UpdateSubmissionRequest("again", null)));

        Assert.Equal(StatusCodes.Status400BadRequest, ex.StatusCode);
    }

    [Fact]
    public async Task Grade_ByOwningTeacher_SetsMarksAndFeedback()
    {
        var service = NewService();
        var submission = await service.SubmitAsync(_seed.Student.Id,
            new CreateSubmissionRequest(_seed.Published.Id, "answer", null));

        var graded = await service.GradeAsync(submission.Id, _seed.Teacher.Id,
            new GradeSubmissionRequest(15, "Good work"));

        Assert.Equal(15, graded.Marks);
        Assert.Equal("Good work", graded.Feedback);
        Assert.Equal("Graded", graded.Status);
        Assert.NotNull(graded.GradedAt);
    }

    [Fact]
    public async Task Grade_MarksExceedingMaximum_ThrowsBadRequest()
    {
        var service = NewService();
        var submission = await service.SubmitAsync(_seed.Student.Id,
            new CreateSubmissionRequest(_seed.Published.Id, "answer", null));

        var ex = await Assert.ThrowsAsync<ApiException>(() =>
            service.GradeAsync(submission.Id, _seed.Teacher.Id, new GradeSubmissionRequest(100, "too much")));

        Assert.Equal(StatusCodes.Status400BadRequest, ex.StatusCode);
    }

    [Fact]
    public async Task Grade_ByNonOwningTeacher_ThrowsForbidden()
    {
        var service = NewService();
        var submission = await service.SubmitAsync(_seed.Student.Id,
            new CreateSubmissionRequest(_seed.Published.Id, "answer", null));

        var ex = await Assert.ThrowsAsync<ApiException>(() =>
            service.GradeAsync(submission.Id, _seed.OtherTeacher.Id, new GradeSubmissionRequest(10, "nope")));

        Assert.Equal(StatusCodes.Status403Forbidden, ex.StatusCode);
    }

    [Fact]
    public async Task ChangeStatus_ByOwningTeacher_UpdatesStatus()
    {
        var service = NewService();
        var submission = await service.SubmitAsync(_seed.Student.Id,
            new CreateSubmissionRequest(_seed.Published.Id, "answer", null));

        var updated = await service.UpdateStatusAsync(submission.Id, _seed.Teacher.Id,
            new UpdateSubmissionStatusRequest("Returned"));

        Assert.Equal("Returned", updated.Status);
    }

    [Fact]
    public async Task ChangeStatus_InvalidStatus_ThrowsBadRequest()
    {
        var service = NewService();
        var submission = await service.SubmitAsync(_seed.Student.Id,
            new CreateSubmissionRequest(_seed.Published.Id, "answer", null));

        var ex = await Assert.ThrowsAsync<ApiException>(() =>
            service.UpdateStatusAsync(submission.Id, _seed.Teacher.Id, new UpdateSubmissionStatusRequest("Bogus")));

        Assert.Equal(StatusCodes.Status400BadRequest, ex.StatusCode);
    }

    [Fact]
    public async Task GetSubmissions_StudentSeesOnlyOwn()
    {
        var service = NewService();
        await service.SubmitAsync(_seed.Student.Id, new CreateSubmissionRequest(_seed.Published.Id, "a", null));
        await service.SubmitAsync(_seed.OtherStudent.Id, new CreateSubmissionRequest(_seed.OtherClassPublished.Id, "b", null));

        var results = await service.GetSubmissionsAsync(_seed.Student.Id, "Student");

        var onlyOwn = Assert.Single(results);
        Assert.Equal(_seed.Student.Id, onlyOwn.StudentId);
    }

    [Fact]
    public async Task GetSubmissions_TeacherSeesOnlyOwnAssignments()
    {
        var service = NewService();
        await service.SubmitAsync(_seed.Student.Id, new CreateSubmissionRequest(_seed.Published.Id, "a", null));

        var results = await service.GetSubmissionsAsync(_seed.OtherTeacher.Id, "Teacher");

        Assert.Empty(results);
    }
}
