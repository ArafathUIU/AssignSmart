using AssignSmart.Api.Data;
using AssignSmart.Api.DTOs;
using AssignSmart.Api.Exceptions;
using AssignSmart.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AssignSmart.Api.Controllers;

[Authorize(Roles = "Admin")]
[ApiController]
[Route("api/subjects")]
public class SubjectsController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly ILogger<SubjectsController> _logger;

    public SubjectsController(AppDbContext db, ILogger<SubjectsController> logger)
    {
        _db = db;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<List<SubjectDto>>> GetAll()
    {
        var subjects = await _db.Subjects
            .OrderBy(s => s.Name)
            .Select(s => new SubjectDto(s.Id, s.Name, s.Code))
            .ToListAsync();

        return Ok(subjects);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<SubjectDto>> GetById(Guid id)
    {
        var subject = await _db.Subjects
            .Select(s => new SubjectDto(s.Id, s.Name, s.Code))
            .FirstOrDefaultAsync(s => s.Id == id)
            ?? throw new ApiException(StatusCodes.Status404NotFound, "Subject not found.");

        return Ok(subject);
    }

    [HttpPost]
    public async Task<ActionResult<SubjectDto>> Create(CreateSubjectRequest request)
    {
        if (await _db.Subjects.AnyAsync(s => s.Name == request.Name.Trim()))
        {
            throw new ApiException(StatusCodes.Status409Conflict, "A subject with this name already exists.");
        }

        var subject = new Subject
        {
            Id = Guid.NewGuid(),
            Name = request.Name.Trim(),
            Code = request.Code?.Trim()
        };

        _db.Subjects.Add(subject);
        await _db.SaveChangesAsync();
        _logger.LogInformation("Created subject {Name}", subject.Name);

        return CreatedAtAction(nameof(GetById), new { id = subject.Id },
            new SubjectDto(subject.Id, subject.Name, subject.Code));
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<SubjectDto>> Update(Guid id, UpdateSubjectRequest request)
    {
        var subject = await _db.Subjects.FirstOrDefaultAsync(s => s.Id == id)
            ?? throw new ApiException(StatusCodes.Status404NotFound, "Subject not found.");

        if (!string.IsNullOrWhiteSpace(request.Name))
        {
            if (await _db.Subjects.AnyAsync(s => s.Name == request.Name.Trim() && s.Id != id))
            {
                throw new ApiException(StatusCodes.Status409Conflict, "A subject with this name already exists.");
            }
            subject.Name = request.Name.Trim();
        }

        if (request.Code is not null)
        {
            subject.Code = request.Code.Trim();
        }

        await _db.SaveChangesAsync();
        return Ok(new SubjectDto(subject.Id, subject.Name, subject.Code));
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var subject = await _db.Subjects.FirstOrDefaultAsync(s => s.Id == id)
            ?? throw new ApiException(StatusCodes.Status404NotFound, "Subject not found.");

        _db.Subjects.Remove(subject);
        await _db.SaveChangesAsync();
        _logger.LogInformation("Deleted subject {Id}", id);

        return NoContent();
    }
}
