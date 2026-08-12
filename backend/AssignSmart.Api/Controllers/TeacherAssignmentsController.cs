using AssignSmart.Api.Data;
using AssignSmart.Api.DTOs;
using AssignSmart.Api.Exceptions;
using AssignSmart.Api.Helpers;
using AssignSmart.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AssignSmart.Api.Controllers;

[ApiController]
[Route("api/teacher-assignments")]
public class TeacherAssignmentsController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly ILogger<TeacherAssignmentsController> _logger;

    public TeacherAssignmentsController(AppDbContext db, ILogger<TeacherAssignmentsController> logger)
    {
        _db = db;
        _logger = logger;
    }

    [HttpGet]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<List<TeacherAssignmentDto>>> GetAll()
    {
        var items = await _db.TeacherAssignments
            .Include(t => t.Teacher)
            .Include(t => t.Class)
            .Include(t => t.Subject)
            .OrderBy(t => t.Teacher.Name)
            .ThenBy(t => t.Class.Name)
            .ThenBy(t => t.Subject.Name)
            .ToListAsync();

        return Ok(items.Select(ToDto));
    }

    [HttpGet("me")]
    [Authorize(Roles = "Teacher")]
    public async Task<ActionResult<List<TeacherAssignmentDto>>> GetMine()
    {
        var teacherId = User.GetUserId();

        var items = await _db.TeacherAssignments
            .Where(t => t.TeacherId == teacherId)
            .Include(t => t.Teacher)
            .Include(t => t.Class)
            .Include(t => t.Subject)
            .OrderBy(t => t.Class.Name)
            .ThenBy(t => t.Subject.Name)
            .ToListAsync();

        return Ok(items.Select(ToDto));
    }

    [HttpGet("my-class")]
    [Authorize(Roles = "Student")]
    public async Task<ActionResult<List<TeacherAssignmentDto>>> GetMyClass()
    {
        var studentId = User.GetUserId();

        var student = await _db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == studentId)
            ?? throw new ApiException(StatusCodes.Status404NotFound, "Student not found.");

        if (student.ClassId is null)
        {
            return Ok(new List<TeacherAssignmentDto>());
        }

        var items = await _db.TeacherAssignments
            .Where(t => t.ClassId == student.ClassId)
            .Include(t => t.Teacher)
            .Include(t => t.Class)
            .Include(t => t.Subject)
            .OrderBy(t => t.Subject.Name)
            .ToListAsync();

        return Ok(items.Select(ToDto));
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<TeacherAssignmentDto>> Create(CreateTeacherAssignmentRequest request)
    {
        var teacher = await _db.Users.FirstOrDefaultAsync(u => u.Id == request.TeacherId)
            ?? throw new ApiException(StatusCodes.Status404NotFound, "Teacher not found.");

        if (teacher.Role != Role.Teacher)
        {
            throw new ApiException(StatusCodes.Status400BadRequest, "The selected user is not a teacher.");
        }

        if (!await _db.Classes.AnyAsync(c => c.Id == request.ClassId))
        {
            throw new ApiException(StatusCodes.Status400BadRequest, "The specified class does not exist.");
        }

        if (!await _db.Subjects.AnyAsync(s => s.Id == request.SubjectId))
        {
            throw new ApiException(StatusCodes.Status400BadRequest, "The specified subject does not exist.");
        }

        if (await _db.TeacherAssignments.AnyAsync(t =>
                t.TeacherId == request.TeacherId && t.ClassId == request.ClassId && t.SubjectId == request.SubjectId))
        {
            throw new ApiException(StatusCodes.Status409Conflict,
                "This teacher is already assigned to this subject in this class.");
        }

        var item = new TeacherAssignment
        {
            Id = Guid.NewGuid(),
            TeacherId = request.TeacherId,
            ClassId = request.ClassId,
            SubjectId = request.SubjectId
        };

        _db.TeacherAssignments.Add(item);
        await _db.SaveChangesAsync();
        _logger.LogInformation("Assigned teacher {TeacherId} to {ClassId}/{SubjectId}", request.TeacherId, request.ClassId, request.SubjectId);

        return Ok(await ToDtoAsync(item.Id));
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var item = await _db.TeacherAssignments.FirstOrDefaultAsync(t => t.Id == id)
            ?? throw new ApiException(StatusCodes.Status404NotFound, "Teacher assignment not found.");

        _db.TeacherAssignments.Remove(item);
        await _db.SaveChangesAsync();
        _logger.LogInformation("Removed teacher assignment {Id}", id);

        return NoContent();
    }

    private async Task<TeacherAssignmentDto> ToDtoAsync(Guid id)
    {
        var item = await _db.TeacherAssignments
            .Include(t => t.Teacher)
            .Include(t => t.Class)
            .Include(t => t.Subject)
            .FirstOrDefaultAsync(t => t.Id == id)
            ?? throw new ApiException(StatusCodes.Status404NotFound, "Teacher assignment not found.");

        return ToDto(item);
    }

    private static TeacherAssignmentDto ToDto(TeacherAssignment t) => new(
        t.Id,
        t.TeacherId,
        t.Teacher.Name,
        t.ClassId,
        t.Class.Name,
        t.SubjectId,
        t.Subject.Name);
}
