using AssignSmart.Api.Data;
using AssignSmart.Api.DTOs;
using AssignSmart.Api.Exceptions;
using AssignSmart.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace AssignSmart.Api.Services;

public interface IAssignmentService
{
    Task<List<AssignmentDto>> GetAssignmentsAsync(Guid userId, string role);
    Task<AssignmentDto> GetAssignmentAsync(Guid id, Guid userId, string role);
    Task<AssignmentDto> CreateAssignmentAsync(Guid teacherId, CreateAssignmentRequest request);
    Task<AssignmentDto> UpdateAssignmentAsync(Guid id, Guid teacherId, UpdateAssignmentRequest request);
    Task DeleteAssignmentAsync(Guid id, Guid teacherId);
    Task<AssignmentDto> SetPublishedAsync(Guid id, Guid teacherId, bool isPublished);
    Task<List<SubmissionDto>> GetSubmissionsForAssignmentAsync(Guid assignmentId, Guid teacherId);
}

public class AssignmentService : IAssignmentService
{
    private readonly AppDbContext _db;

    public AssignmentService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<List<AssignmentDto>> GetAssignmentsAsync(Guid userId, string role)
    {
        IQueryable<Assignment> query = _db.Assignments;

        if (role == Role.Admin.ToString())
        {
            // Admin can view all assignments.
        }
        else if (role == Role.Teacher.ToString())
        {
            query = query.Where(a => a.TeacherId == userId);
        }
        else if (role == Role.Student.ToString())
        {
            var student = await _db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == userId)
                ?? throw new ApiException(StatusCodes.Status404NotFound, "Student not found.");

            // Students only see published assignments assigned to their class.
            query = query.Where(a => a.IsPublished && a.ClassId == student.ClassId);
        }

        var assignments = await query
            .OrderByDescending(a => a.CreatedAt)
            .Include(a => a.Teacher)
            .Include(a => a.Class)
            .Include(a => a.Subject)
            .ToListAsync();

        return assignments.Select(a => ToDto(a, a.Submissions.Count)).ToList();
    }

    public async Task<AssignmentDto> GetAssignmentAsync(Guid id, Guid userId, string role)
    {
        var assignment = await _db.Assignments
            .Include(a => a.Teacher)
            .Include(a => a.Class)
            .Include(a => a.Subject)
            .FirstOrDefaultAsync(a => a.Id == id)
            ?? throw new ApiException(StatusCodes.Status404NotFound, "Assignment not found.");

        if (role == Role.Admin.ToString())
        {
            return ToDto(assignment, await _db.Submissions.CountAsync(s => s.AssignmentId == id));
        }

        if (role == Role.Teacher.ToString())
        {
            if (assignment.TeacherId != userId)
            {
                throw new ApiException(StatusCodes.Status403Forbidden, "You can only view your own assignments.");
            }
            return ToDto(assignment, assignment.Submissions.Count);
        }

        // Student
        var student = await _db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == userId)
            ?? throw new ApiException(StatusCodes.Status404NotFound, "Student not found.");

        if (!assignment.IsPublished)
        {
            throw new ApiException(StatusCodes.Status403Forbidden, "This assignment is not published yet.");
        }

        if (assignment.ClassId != student.ClassId)
        {
            throw new ApiException(StatusCodes.Status403Forbidden, "This assignment is not assigned to your class.");
        }

        return ToDto(assignment, assignment.Submissions.Count);
    }

    public async Task<AssignmentDto> CreateAssignmentAsync(Guid teacherId, CreateAssignmentRequest request)
    {
        await EnsureTeacherAssignedAsync(teacherId, request.ClassId, request.SubjectId);

        var deadline = NormalizeToUtc(request.Deadline);
        if (deadline <= DateTime.UtcNow)
        {
            throw new ApiException(StatusCodes.Status400BadRequest, "The deadline must be in the future.");
        }

        var assignment = new Assignment
        {
            Id = Guid.NewGuid(),
            Title = request.Title.Trim(),
            Description = request.Description,
            TeacherId = teacherId,
            ClassId = request.ClassId,
            SubjectId = request.SubjectId,
            Deadline = deadline,
            MaxMarks = request.MaxMarks,
            IsPublished = request.IsPublished ?? false,
            AllowedFileTypes = request.AllowedFileTypes
        };

        _db.Assignments.Add(assignment);
        await _db.SaveChangesAsync();

        return await ToDtoWithRelationsAsync(assignment.Id);
    }

    public async Task<AssignmentDto> UpdateAssignmentAsync(Guid id, Guid teacherId, UpdateAssignmentRequest request)
    {
        var assignment = await GetOwnedAssignmentAsync(id, teacherId);

        if (request.Title is not null)
        {
            assignment.Title = request.Title.Trim();
        }

        if (request.Description is not null)
        {
            assignment.Description = request.Description;
        }

        if (request.ClassId.HasValue && request.SubjectId.HasValue)
        {
            await EnsureTeacherAssignedAsync(teacherId, request.ClassId.Value, request.SubjectId.Value);
            assignment.ClassId = request.ClassId.Value;
            assignment.SubjectId = request.SubjectId.Value;
        }

        if (request.Deadline.HasValue)
        {
            var deadline = NormalizeToUtc(request.Deadline.Value);
            if (deadline <= DateTime.UtcNow)
            {
                throw new ApiException(StatusCodes.Status400BadRequest, "The deadline must be in the future.");
            }
            assignment.Deadline = deadline;
        }

        if (request.MaxMarks.HasValue)
        {
            assignment.MaxMarks = request.MaxMarks.Value;
        }

        if (request.IsPublished.HasValue)
        {
            assignment.IsPublished = request.IsPublished.Value;
        }

        if (request.AllowedFileTypes is not null)
        {
            assignment.AllowedFileTypes = request.AllowedFileTypes;
        }

        assignment.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return await ToDtoWithRelationsAsync(assignment.Id);
    }

    public async Task DeleteAssignmentAsync(Guid id, Guid teacherId)
    {
        var assignment = await GetOwnedAssignmentAsync(id, teacherId);

        _db.Assignments.Remove(assignment);
        await _db.SaveChangesAsync();
    }

    public async Task<AssignmentDto> SetPublishedAsync(Guid id, Guid teacherId, bool isPublished)
    {
        var assignment = await GetOwnedAssignmentAsync(id, teacherId);

        assignment.IsPublished = isPublished;
        assignment.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return await ToDtoWithRelationsAsync(assignment.Id);
    }

    public async Task<List<SubmissionDto>> GetSubmissionsForAssignmentAsync(Guid assignmentId, Guid teacherId)
    {
        var assignment = await GetOwnedAssignmentAsync(assignmentId, teacherId);

        var submissions = await _db.Submissions
            .Where(s => s.AssignmentId == assignment.Id)
            .Include(s => s.Student)
            .OrderByDescending(s => s.SubmittedAt)
            .ToListAsync();

        return submissions.Select(s => ToDto(s)).ToList();
    }

    private async Task<Assignment> GetOwnedAssignmentAsync(Guid id, Guid teacherId)
    {
        var assignment = await _db.Assignments
            .FirstOrDefaultAsync(a => a.Id == id)
            ?? throw new ApiException(StatusCodes.Status404NotFound, "Assignment not found.");

        if (assignment.TeacherId != teacherId)
        {
            throw new ApiException(StatusCodes.Status403Forbidden, "You can only manage your own assignments.");
        }

        return assignment;
    }

    private async Task EnsureTeacherAssignedAsync(Guid teacherId, Guid classId, Guid subjectId)
    {
        var isAssigned = await _db.TeacherAssignments.AnyAsync(t =>
            t.TeacherId == teacherId && t.ClassId == classId && t.SubjectId == subjectId);

        if (!isAssigned)
        {
            throw new ApiException(StatusCodes.Status403Forbidden,
                "You are not assigned to teach this subject in this class.");
        }
    }

    private async Task<AssignmentDto> ToDtoWithRelationsAsync(Guid assignmentId)
    {
        var assignment = await _db.Assignments
            .Include(a => a.Teacher)
            .Include(a => a.Class)
            .Include(a => a.Subject)
            .FirstOrDefaultAsync(a => a.Id == assignmentId)
            ?? throw new ApiException(StatusCodes.Status404NotFound, "Assignment not found.");

        return ToDto(assignment, await _db.Submissions.CountAsync(s => s.AssignmentId == assignmentId));
    }

    private static AssignmentDto ToDto(Assignment a, int submissionCount) => new(
        a.Id,
        a.Title,
        a.Description,
        a.TeacherId,
        a.Teacher.Name,
        a.ClassId,
        a.Class.Name,
        a.SubjectId,
        a.Subject.Name,
        a.Deadline,
        a.MaxMarks,
        a.IsPublished,
        a.CreatedAt,
        submissionCount,
        a.AllowedFileTypes);

    private static SubmissionDto ToDto(Submission s) => new(
        s.Id,
        s.AssignmentId,
        s.Assignment.Title,
        s.StudentId,
        s.Student.Name,
        s.Answer,
        s.Status.ToString(),
        s.Marks,
        s.Feedback,
        s.SubmittedAt,
        s.GradedAt,
        s.Assignment.Deadline,
        s.Attachments.Select(a => new SubmissionAttachmentDto(
            a.Id,
            a.FileName,
            a.ContentType,
            a.FileSize
        )).ToList());

    private static DateTime NormalizeToUtc(DateTime value) =>
        value.Kind == DateTimeKind.Local ? value.ToUniversalTime() : DateTime.SpecifyKind(value, DateTimeKind.Utc);
}
