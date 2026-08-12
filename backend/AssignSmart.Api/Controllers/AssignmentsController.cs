using AssignSmart.Api.Data;
using AssignSmart.Api.DTOs;
using AssignSmart.Api.Exceptions;
using AssignSmart.Api.Helpers;
using AssignSmart.Api.Models;
using AssignSmart.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AssignSmart.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/assignments")]
public class AssignmentsController : ControllerBase
{
    private readonly IAssignmentService _assignments;
    private readonly AppDbContext _db;

    public AssignmentsController(IAssignmentService assignments, AppDbContext db)
    {
        _assignments = assignments;
        _db = db;
    }

    [HttpGet]
    public async Task<ActionResult<List<AssignmentDto>>> GetAll()
    {
        var userId = User.GetUserId();
        var role = User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value ?? string.Empty;
        return Ok(await _assignments.GetAssignmentsAsync(userId, role));
    }

    [HttpPost]
    [Authorize(Roles = "Teacher")]
    public async Task<ActionResult<AssignmentDto>> Create(CreateAssignmentRequest request)
    {
        var teacherId = User.GetUserId();
        var created = await _assignments.CreateAssignmentAsync(teacherId, request);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<AssignmentDto>> GetById(Guid id)
    {
        var userId = User.GetUserId();
        var role = User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value ?? string.Empty;
        return Ok(await _assignments.GetAssignmentAsync(id, userId, role));
    }

    [HttpPut("{id:guid}")]
    [Authorize(Roles = "Teacher")]
    public async Task<ActionResult<AssignmentDto>> Update(Guid id, UpdateAssignmentRequest request)
    {
        var teacherId = User.GetUserId();
        return Ok(await _assignments.UpdateAssignmentAsync(id, teacherId, request));
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "Teacher")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var teacherId = User.GetUserId();
        await _assignments.DeleteAssignmentAsync(id, teacherId);
        return NoContent();
    }

    [HttpPatch("{id:guid}/publish")]
    [Authorize(Roles = "Teacher")]
    public async Task<ActionResult<AssignmentDto>> SetPublished(Guid id, SetPublishedRequest request)
    {
        var teacherId = User.GetUserId();
        return Ok(await _assignments.SetPublishedAsync(id, teacherId, request.IsPublished));
    }

    [HttpGet("{id:guid}/submissions")]
    [Authorize(Roles = "Teacher")]
    public async Task<ActionResult<List<SubmissionDto>>> GetSubmissions(Guid id)
    {
        var teacherId = User.GetUserId();
        return Ok(await _assignments.GetSubmissionsForAssignmentAsync(id, teacherId));
    }

    // ---- Q&A endpoints ----

    [HttpGet("{assignmentId:guid}/questions")]
    public async Task<ActionResult<List<AssignmentQuestionDto>>> GetQuestions(Guid assignmentId)
    {
        var userId = User.GetUserId();
        var role = User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value ?? string.Empty;

        var assignment = await _db.Assignments.AsNoTracking()
            .FirstOrDefaultAsync(a => a.Id == assignmentId)
            ?? throw new ApiException(StatusCodes.Status404NotFound, "Assignment not found.");

        if (role == Role.Student.ToString())
        {
            var student = await _db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == userId);
            if (assignment.ClassId != student?.ClassId || !assignment.IsPublished)
            {
                throw new ApiException(StatusCodes.Status403Forbidden, "Access denied.");
            }
        }
        else if (role == Role.Teacher.ToString() && assignment.TeacherId != userId)
        {
            throw new ApiException(StatusCodes.Status403Forbidden, "Access denied.");
        }

        var questions = await _db.AssignmentQuestions
            .Where(q => q.AssignmentId == assignmentId)
            .Include(q => q.Student)
            .Include(q => q.Answers).ThenInclude(a => a.Teacher)
            .OrderByDescending(q => q.CreatedAt)
            .ToListAsync();

        return Ok(questions.Select(q => new AssignmentQuestionDto(
            q.Id,
            q.StudentId,
            q.Student.Name,
            q.Question,
            q.CreatedAt,
            q.Answers.Select(a => new AssignmentAnswerDto(
                a.Id,
                a.TeacherId,
                a.Teacher.Name,
                a.Answer,
                a.CreatedAt
            )).ToList()
        )).ToList());
    }

    [HttpPost("{assignmentId:guid}/questions")]
    [Authorize(Roles = "Student")]
    public async Task<ActionResult<AssignmentQuestionDto>> PostQuestion(Guid assignmentId, CreateQuestionRequest request)
    {
        var studentId = User.GetUserId();

        var assignment = await _db.Assignments.AsNoTracking()
            .FirstOrDefaultAsync(a => a.Id == assignmentId)
            ?? throw new ApiException(StatusCodes.Status404NotFound, "Assignment not found.");

        var student = await _db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == studentId);

        if (!assignment.IsPublished || assignment.ClassId != student?.ClassId)
        {
            throw new ApiException(StatusCodes.Status403Forbidden, "Access denied.");
        }

        var question = new AssignmentQuestion
        {
            Id = Guid.NewGuid(),
            AssignmentId = assignmentId,
            StudentId = studentId,
            Question = request.Question.Trim()
        };

        _db.AssignmentQuestions.Add(question);
        await _db.SaveChangesAsync();

        return Ok(new AssignmentQuestionDto(
            question.Id,
            question.StudentId,
            student?.Name ?? "",
            question.Question,
            question.CreatedAt,
            new List<AssignmentAnswerDto>()
        ));
    }

    [HttpPost("questions/{questionId:guid}/answers")]
    [Authorize(Roles = "Teacher")]
    public async Task<ActionResult<AssignmentAnswerDto>> PostAnswer(Guid questionId, CreateAnswerRequest request)
    {
        var teacherId = User.GetUserId();

        var question = await _db.AssignmentQuestions
            .Include(q => q.Assignment)
            .FirstOrDefaultAsync(q => q.Id == questionId)
            ?? throw new ApiException(StatusCodes.Status404NotFound, "Question not found.");

        if (question.Assignment.TeacherId != teacherId)
        {
            throw new ApiException(StatusCodes.Status403Forbidden, "Only the assignment teacher can answer questions.");
        }

        var teacher = await _db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == teacherId);

        var answer = new AssignmentAnswer
        {
            Id = Guid.NewGuid(),
            QuestionId = questionId,
            TeacherId = teacherId,
            Answer = request.Answer.Trim()
        };

        _db.AssignmentAnswers.Add(answer);
        await _db.SaveChangesAsync();

        return Ok(new AssignmentAnswerDto(
            answer.Id,
            answer.TeacherId,
            teacher?.Name ?? "",
            answer.Answer,
            answer.CreatedAt
        ));
    }
}
