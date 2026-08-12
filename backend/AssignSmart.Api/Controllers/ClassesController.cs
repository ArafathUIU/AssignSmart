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
[Route("api/classes")]
public class ClassesController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly ILogger<ClassesController> _logger;

    public ClassesController(AppDbContext db, ILogger<ClassesController> logger)
    {
        _db = db;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<List<ClassDetailDto>>> GetAll()
    {
        var classes = await _db.Classes
            .OrderBy(c => c.Name)
            .Select(c => new ClassDetailDto(c.Id, c.Name, c.Code, c.Students.Count))
            .ToListAsync();

        return Ok(classes);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ClassDetailDto>> GetById(Guid id)
    {
        var schoolClass = await _db.Classes
            .Select(c => new ClassDetailDto(c.Id, c.Name, c.Code, c.Students.Count))
            .FirstOrDefaultAsync(c => c.Id == id)
            ?? throw new ApiException(StatusCodes.Status404NotFound, "Class not found.");

        return Ok(schoolClass);
    }

    [HttpPost]
    public async Task<ActionResult<ClassDto>> Create(CreateClassRequest request)
    {
        if (await _db.Classes.AnyAsync(c => c.Name == request.Name.Trim()))
        {
            throw new ApiException(StatusCodes.Status409Conflict, "A class with this name already exists.");
        }

        var schoolClass = new SchoolClass
        {
            Id = Guid.NewGuid(),
            Name = request.Name.Trim(),
            Code = request.Code?.Trim()
        };

        _db.Classes.Add(schoolClass);
        await _db.SaveChangesAsync();
        _logger.LogInformation("Created class {Name}", schoolClass.Name);

        return CreatedAtAction(nameof(GetById), new { id = schoolClass.Id },
            new ClassDto(schoolClass.Id, schoolClass.Name, schoolClass.Code));
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<ClassDto>> Update(Guid id, UpdateClassRequest request)
    {
        var schoolClass = await _db.Classes.FirstOrDefaultAsync(c => c.Id == id)
            ?? throw new ApiException(StatusCodes.Status404NotFound, "Class not found.");

        if (!string.IsNullOrWhiteSpace(request.Name))
        {
            if (await _db.Classes.AnyAsync(c => c.Name == request.Name.Trim() && c.Id != id))
            {
                throw new ApiException(StatusCodes.Status409Conflict, "A class with this name already exists.");
            }
            schoolClass.Name = request.Name.Trim();
        }

        if (request.Code is not null)
        {
            schoolClass.Code = request.Code.Trim();
        }

        await _db.SaveChangesAsync();
        return Ok(new ClassDto(schoolClass.Id, schoolClass.Name, schoolClass.Code));
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var schoolClass = await _db.Classes.FirstOrDefaultAsync(c => c.Id == id)
            ?? throw new ApiException(StatusCodes.Status404NotFound, "Class not found.");

        _db.Classes.Remove(schoolClass);
        await _db.SaveChangesAsync();
        _logger.LogInformation("Deleted class {Id}", id);

        return NoContent();
    }
}
