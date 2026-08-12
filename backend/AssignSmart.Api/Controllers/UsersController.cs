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
[Route("api/users")]
public class UsersController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly ILogger<UsersController> _logger;

    public UsersController(AppDbContext db, ILogger<UsersController> logger)
    {
        _db = db;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<List<UserDto>>> GetAll([FromQuery] string? role)
    {
        IQueryable<User> query = _db.Users.Include(u => u.Class);

        if (!string.IsNullOrWhiteSpace(role))
        {
            if (!Enum.TryParse<Role>(role, true, out var parsedRole))
            {
                throw new ApiException(StatusCodes.Status400BadRequest,
                    $"Invalid role. Valid values are: {string.Join(", ", Enum.GetNames<Role>())}.");
            }
            query = query.Where(u => u.Role == parsedRole);
        }

        var users = await query.OrderBy(u => u.Name).ToListAsync();
        return Ok(users.Select(ToDto));
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<UserDto>> GetById(Guid id)
    {
        var user = await _db.Users.Include(u => u.Class).FirstOrDefaultAsync(u => u.Id == id);
        if (user is null)
        {
            throw new ApiException(StatusCodes.Status404NotFound, "User not found.");
        }

        return Ok(ToDto(user));
    }

    [HttpPost]
    public async Task<ActionResult<UserDto>> Create(CreateUserRequest request)
    {
        var email = request.Email.Trim().ToLower();
        if (await _db.Users.AnyAsync(u => u.Email == email))
        {
            throw new ApiException(StatusCodes.Status409Conflict, "A user with this email already exists.");
        }

        var role = ParseRole(request.Role);

        if (request.ClassId.HasValue && !await _db.Classes.AnyAsync(c => c.Id == request.ClassId))
        {
            throw new ApiException(StatusCodes.Status400BadRequest, "The specified class does not exist.");
        }

        var user = new User
        {
            Id = Guid.NewGuid(),
            Name = request.Name.Trim(),
            Email = email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            Role = role,
            ClassId = request.ClassId
        };

        _db.Users.Add(user);
        await _db.SaveChangesAsync();
        _logger.LogInformation("Created user {Email} with role {Role}", email, role);

        return CreatedAtAction(nameof(GetById), new { id = user.Id }, ToDto(user));
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<UserDto>> Update(Guid id, UpdateUserRequest request)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == id)
            ?? throw new ApiException(StatusCodes.Status404NotFound, "User not found.");

        if (!string.IsNullOrWhiteSpace(request.Name))
        {
            user.Name = request.Name.Trim();
        }

        if (!string.IsNullOrWhiteSpace(request.Email))
        {
            var email = request.Email.Trim().ToLower();
            if (await _db.Users.AnyAsync(u => u.Email == email && u.Id != id))
            {
                throw new ApiException(StatusCodes.Status409Conflict, "A user with this email already exists.");
            }
            user.Email = email;
        }

        if (!string.IsNullOrWhiteSpace(request.Password))
        {
            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password);
        }

        if (!string.IsNullOrWhiteSpace(request.Role))
        {
            user.Role = ParseRole(request.Role);
        }

        if (request.ClassId.HasValue)
        {
            if (!await _db.Classes.AnyAsync(c => c.Id == request.ClassId))
            {
                throw new ApiException(StatusCodes.Status400BadRequest, "The specified class does not exist.");
            }
            user.ClassId = request.ClassId;
        }

        await _db.SaveChangesAsync();
        return Ok(ToDto(user));
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == id)
            ?? throw new ApiException(StatusCodes.Status404NotFound, "User not found.");

        _db.Users.Remove(user);
        await _db.SaveChangesAsync();
        _logger.LogInformation("Deleted user {Id}", id);

        return NoContent();
    }

    private static Role ParseRole(string value)
    {
        if (Enum.TryParse<Role>(value, true, out var role))
        {
            return role;
        }

        throw new ApiException(StatusCodes.Status400BadRequest,
            $"Invalid role. Valid values are: {string.Join(", ", Enum.GetNames<Role>())}.");
    }

    private static UserDto ToDto(User user) => new(
        user.Id,
        user.Name,
        user.Email,
        user.Role.ToString(),
        user.ClassId,
        user.Class?.Name,
        user.CreatedAt);
}
