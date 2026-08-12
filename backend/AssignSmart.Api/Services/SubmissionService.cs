using AssignSmart.Api.Data;
using AssignSmart.Api.DTOs;
using AssignSmart.Api.Exceptions;
using AssignSmart.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace AssignSmart.Api.Services;

public interface ISubmissionService
{
    Task<List<SubmissionDto>> GetSubmissionsAsync(Guid userId, string role);
    Task<SubmissionDto> SubmitAsync(Guid studentId, CreateSubmissionRequest request);
    Task<SubmissionDto> UpdateSubmissionAsync(Guid submissionId, Guid studentId, UpdateSubmissionRequest request);
    Task<SubmissionDto> GradeAsync(Guid submissionId, Guid teacherId, GradeSubmissionRequest request);
    Task<SubmissionDto> UpdateStatusAsync(Guid submissionId, Guid teacherId, UpdateSubmissionStatusRequest request);
}

public class SubmissionService : ISubmissionService
{
    private readonly AppDbContext _db;

    public SubmissionService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<List<SubmissionDto>> GetSubmissionsAsync(Guid userId, string role)
    {
        IQueryable<Submission> query = _db.Submissions
            .Include(s => s.Assignment).ThenInclude(a => a.Class)
            .Include(s => s.Student)
            .Include(s => s.Attachments);

        if (role == Role.Admin.ToString())
        {
            // Admin can view every submission.
        }
        else if (role == Role.Teacher.ToString())
        {
            query = query.Where(s => s.Assignment.TeacherId == userId);
        }
        else if (role == Role.Student.ToString())
        {
            query = query.Where(s => s.StudentId == userId);
        }

        var submissions = await query.OrderByDescending(s => s.SubmittedAt).ToListAsync();
        return submissions.Select(ToDto).ToList();
    }

    public async Task<SubmissionDto> SubmitAsync(Guid studentId, CreateSubmissionRequest request)
    {
        var student = await _db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == studentId)
            ?? throw new ApiException(StatusCodes.Status404NotFound, "Student not found.");

        if (student.Role != Role.Student)
        {
            throw new ApiException(StatusCodes.Status403Forbidden, "Only students can submit answers.");
        }

        var assignment = await _db.Assignments.AsNoTracking().FirstOrDefaultAsync(a => a.Id == request.AssignmentId)
            ?? throw new ApiException(StatusCodes.Status404NotFound, "Assignment not found.");

        if (!assignment.IsPublished)
        {
            throw new ApiException(StatusCodes.Status400BadRequest, "This assignment is not published yet.");
        }

        if (assignment.ClassId != student.ClassId)
        {
            throw new ApiException(StatusCodes.Status403Forbidden, "This assignment is not assigned to your class.");
        }

        if (DateTime.UtcNow > assignment.Deadline)
        {
            throw new ApiException(StatusCodes.Status400BadRequest, "The submission deadline has passed.");
        }

        var existing = await _db.Submissions.AnyAsync(s => s.AssignmentId == request.AssignmentId && s.StudentId == studentId);
        if (existing)
        {
            throw new ApiException(StatusCodes.Status409Conflict, "You have already submitted an answer for this assignment.");
        }

        if (string.IsNullOrWhiteSpace(request.Answer) && (request.Attachments == null || request.Attachments.Count == 0))
        {
            throw new ApiException(StatusCodes.Status400BadRequest, "Either answer text or at least one file attachment is required.");
        }

        if (request.Attachments != null && !string.IsNullOrWhiteSpace(assignment.AllowedFileTypes))
        {
            var allowed = assignment.AllowedFileTypes.Split(',', StringSplitOptions.TrimEntries)
                .Select(f => f.ToLowerInvariant())
                .ToHashSet();
            foreach (var att in request.Attachments)
            {
                var ext = Path.GetExtension(att.FileName).TrimStart('.').ToLowerInvariant();
                var mime = att.ContentType.ToLowerInvariant();
                if (!allowed.Contains(ext) && !allowed.Any(a => mime.StartsWith(a + "/") || mime.EndsWith("/" + a)))
                {
                    throw new ApiException(StatusCodes.Status400BadRequest,
                        $"File type '{att.FileName}' is not allowed. Allowed types: {assignment.AllowedFileTypes}");
                }
            }
        }

        var submission = new Submission
        {
            Id = Guid.NewGuid(),
            AssignmentId = assignment.Id,
            StudentId = studentId,
            Answer = request.Answer?.Trim() ?? string.Empty,
            Status = SubmissionStatus.Submitted
        };

        if (request.Attachments != null)
        {
            foreach (var att in request.Attachments)
            {
                submission.Attachments.Add(new SubmissionAttachment
                {
                    Id = Guid.NewGuid(),
                    SubmissionId = submission.Id,
                    FileName = att.FileName,
                    ContentType = att.ContentType,
                    FileSize = att.FileSize,
                    FileData = att.FileData
                });
            }
        }

        _db.Submissions.Add(submission);
        await _db.SaveChangesAsync();

        return await ToDtoAsync(submission.Id);
    }

    public async Task<SubmissionDto> UpdateSubmissionAsync(Guid submissionId, Guid studentId, UpdateSubmissionRequest request)
    {
        var submission = await _db.Submissions
            .Include(s => s.Assignment)
            .Include(s => s.Attachments)
            .FirstOrDefaultAsync(s => s.Id == submissionId)
            ?? throw new ApiException(StatusCodes.Status404NotFound, "Submission not found.");

        if (submission.StudentId != studentId)
        {
            throw new ApiException(StatusCodes.Status403Forbidden, "You can only update your own submission.");
        }

        if (submission.Status == SubmissionStatus.Graded)
        {
            throw new ApiException(StatusCodes.Status400BadRequest, "Cannot update a submission that has already been graded.");
        }

        if (DateTime.UtcNow > submission.Assignment.Deadline)
        {
            throw new ApiException(StatusCodes.Status400BadRequest, "The submission deadline has passed.");
        }

        if (submission.Assignment.IsPublished == false)
        {
            throw new ApiException(StatusCodes.Status400BadRequest, "This assignment is not published.");
        }

        if (request.Answer != null)
        {
            submission.Answer = request.Answer.Trim();
        }

        if (request.Attachments != null)
        {
            if (!string.IsNullOrWhiteSpace(submission.Assignment.AllowedFileTypes))
            {
                var allowed = submission.Assignment.AllowedFileTypes.Split(',', StringSplitOptions.TrimEntries)
                    .Select(f => f.ToLowerInvariant())
                    .ToHashSet();
                foreach (var att in request.Attachments)
                {
                    var ext = Path.GetExtension(att.FileName).TrimStart('.').ToLowerInvariant();
                    var mime = att.ContentType.ToLowerInvariant();
                    if (!allowed.Contains(ext) && !allowed.Any(a => mime.StartsWith(a + "/") || mime.EndsWith("/" + a)))
                    {
                        throw new ApiException(StatusCodes.Status400BadRequest,
                            $"File type '{att.FileName}' is not allowed. Allowed types: {submission.Assignment.AllowedFileTypes}");
                    }
                }
            }

            _db.SubmissionAttachments.RemoveRange(submission.Attachments);
            foreach (var att in request.Attachments)
            {
                submission.Attachments.Add(new SubmissionAttachment
                {
                    Id = Guid.NewGuid(),
                    SubmissionId = submission.Id,
                    FileName = att.FileName,
                    ContentType = att.ContentType,
                    FileSize = att.FileSize,
                    FileData = att.FileData
                });
            }
        }

        submission.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return await ToDtoAsync(submission.Id);
    }

    public async Task<SubmissionDto> GradeAsync(Guid submissionId, Guid teacherId, GradeSubmissionRequest request)
    {
        var submission = await _db.Submissions
            .Include(s => s.Assignment)
            .FirstOrDefaultAsync(s => s.Id == submissionId)
            ?? throw new ApiException(StatusCodes.Status404NotFound, "Submission not found.");

        if (submission.Assignment.TeacherId != teacherId)
        {
            throw new ApiException(StatusCodes.Status403Forbidden, "Only the teacher who created this assignment can grade it.");
        }

        if (request.Marks > submission.Assignment.MaxMarks)
        {
            throw new ApiException(StatusCodes.Status400BadRequest,
                $"Marks cannot exceed the maximum marks ({submission.Assignment.MaxMarks}).");
        }

        submission.Marks = request.Marks;
        submission.Feedback = request.Feedback;
        submission.Status = SubmissionStatus.Graded;
        submission.GradedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return await ToDtoAsync(submission.Id);
    }

    public async Task<SubmissionDto> UpdateStatusAsync(Guid submissionId, Guid teacherId, UpdateSubmissionStatusRequest request)
    {
        var submission = await _db.Submissions
            .Include(s => s.Assignment)
            .FirstOrDefaultAsync(s => s.Id == submissionId)
            ?? throw new ApiException(StatusCodes.Status404NotFound, "Submission not found.");

        if (submission.Assignment.TeacherId != teacherId)
        {
            throw new ApiException(StatusCodes.Status403Forbidden, "Only the teacher who created this assignment can change its status.");
        }

        if (!Enum.TryParse<SubmissionStatus>(request.Status, ignoreCase: true, out var status))
        {
            throw new ApiException(StatusCodes.Status400BadRequest,
                $"Invalid status. Valid values are: {string.Join(", ", Enum.GetNames<SubmissionStatus>())}.");
        }

        submission.Status = status;
        await _db.SaveChangesAsync();

        return await ToDtoAsync(submission.Id);
    }

    private async Task<SubmissionDto> ToDtoAsync(Guid submissionId)
    {
        var submission = await _db.Submissions
            .Include(s => s.Assignment)
            .Include(s => s.Student)
            .Include(s => s.Attachments)
            .FirstOrDefaultAsync(s => s.Id == submissionId)
            ?? throw new ApiException(StatusCodes.Status404NotFound, "Submission not found.");

        return ToDto(submission);
    }

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
}
