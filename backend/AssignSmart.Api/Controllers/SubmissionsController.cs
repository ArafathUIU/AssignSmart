using AssignSmart.Api.Data;
using AssignSmart.Api.DTOs;
using AssignSmart.Api.Exceptions;
using AssignSmart.Api.Helpers;
using AssignSmart.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AssignSmart.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/submissions")]
public class SubmissionsController : ControllerBase
{
    private readonly ISubmissionService _submissions;
    private readonly AppDbContext _db;

    public SubmissionsController(ISubmissionService submissions, AppDbContext db)
    {
        _submissions = submissions;
        _db = db;
    }

    [HttpGet]
    public async Task<ActionResult<List<SubmissionDto>>> GetAll()
    {
        var userId = User.GetUserId();
        var role = User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value ?? string.Empty;
        return Ok(await _submissions.GetSubmissionsAsync(userId, role));
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<SubmissionDto>> GetById(Guid id)
    {
        var userId = User.GetUserId();
        var role = User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value ?? string.Empty;

        var submission = await _db.Submissions
            .Include(s => s.Assignment)
            .Include(s => s.Student)
            .Include(s => s.Attachments)
            .FirstOrDefaultAsync(s => s.Id == id)
            ?? throw new ApiException(StatusCodes.Status404NotFound, "Submission not found.");

        // Role-based access
        if (role == "Teacher" && submission.Assignment.TeacherId != userId)
            throw new ApiException(StatusCodes.Status403Forbidden, "Access denied.");
        if (role == "Student" && submission.StudentId != userId)
            throw new ApiException(StatusCodes.Status403Forbidden, "Access denied.");

        return Ok(new SubmissionDto(
            submission.Id,
            submission.AssignmentId,
            submission.Assignment.Title,
            submission.StudentId,
            submission.Student.Name,
            submission.Answer,
            submission.Status.ToString(),
            submission.Marks,
            submission.Feedback,
            submission.SubmittedAt,
            submission.GradedAt,
            submission.Assignment.Deadline,
            submission.Attachments.Select(a => new SubmissionAttachmentDto(
                a.Id, a.FileName, a.ContentType, a.FileSize
            )).ToList()
        ));
    }

    [HttpPost]
    [Authorize(Roles = "Student")]
    public async Task<ActionResult<SubmissionDto>> Submit(CreateSubmissionRequest request)
    {
        var studentId = User.GetUserId();
        var created = await _submissions.SubmitAsync(studentId, request);
        return CreatedAtAction(nameof(GetAll), new { }, created);
    }

    [HttpPut("{id:guid}")]
    [Authorize(Roles = "Student")]
    public async Task<ActionResult<SubmissionDto>> Update(Guid id, UpdateSubmissionRequest request)
    {
        var studentId = User.GetUserId();
        return Ok(await _submissions.UpdateSubmissionAsync(id, studentId, request));
    }

    [HttpPut("{id:guid}/grade")]
    [Authorize(Roles = "Teacher")]
    public async Task<ActionResult<SubmissionDto>> Grade(Guid id, GradeSubmissionRequest request)
    {
        var teacherId = User.GetUserId();
        return Ok(await _submissions.GradeAsync(id, teacherId, request));
    }

    [HttpPatch("{id:guid}/status")]
    [Authorize(Roles = "Teacher")]
    public async Task<ActionResult<SubmissionDto>> UpdateStatus(Guid id, UpdateSubmissionStatusRequest request)
    {
        var teacherId = User.GetUserId();
        return Ok(await _submissions.UpdateStatusAsync(id, teacherId, request));
    }

    [HttpGet("{id:guid}/attachments")]
    [Authorize(Roles = "Teacher")]
    public async Task<ActionResult> DownloadAttachments(Guid id)
    {
        var teacherId = User.GetUserId();

        var submission = await _db.Submissions
            .Include(s => s.Assignment)
            .Include(s => s.Attachments)
            .FirstOrDefaultAsync(s => s.Id == id)
            ?? throw new ApiException(StatusCodes.Status404NotFound, "Submission not found.");

        if (submission.Assignment.TeacherId != teacherId)
            throw new ApiException(StatusCodes.Status403Forbidden, "Access denied.");

        return Ok(submission.Attachments.Select(a => new
        {
            a.FileName,
            a.ContentType,
            a.FileSize,
            a.FileData
        }));
    }
}
