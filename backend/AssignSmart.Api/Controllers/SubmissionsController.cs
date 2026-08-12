using AssignSmart.Api.DTOs;
using AssignSmart.Api.Helpers;
using AssignSmart.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AssignSmart.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/submissions")]
public class SubmissionsController : ControllerBase
{
    private readonly ISubmissionService _submissions;

    public SubmissionsController(ISubmissionService submissions)
    {
        _submissions = submissions;
    }

    [HttpGet]
    public async Task<ActionResult<List<SubmissionDto>>> GetAll()
    {
        var userId = User.GetUserId();
        var role = User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value ?? string.Empty;
        return Ok(await _submissions.GetSubmissionsAsync(userId, role));
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
}
