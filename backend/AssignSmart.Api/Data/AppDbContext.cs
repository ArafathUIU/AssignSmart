using AssignSmart.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace AssignSmart.Api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<User> Users => Set<User>();
    public DbSet<SchoolClass> Classes => Set<SchoolClass>();
    public DbSet<Subject> Subjects => Set<Subject>();
    public DbSet<TeacherAssignment> TeacherAssignments => Set<TeacherAssignment>();
    public DbSet<Assignment> Assignments => Set<Assignment>();
    public DbSet<Submission> Submissions => Set<Submission>();
    public DbSet<SubmissionAttachment> SubmissionAttachments => Set<SubmissionAttachment>();
    public DbSet<AssignmentQuestion> AssignmentQuestions => Set<AssignmentQuestion>();
    public DbSet<AssignmentAnswer> AssignmentAnswers => Set<AssignmentAnswer>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<User>(entity =>
        {
            entity.HasIndex(u => u.Email).IsUnique();
            entity.Property(u => u.Email).IsRequired().HasMaxLength(255);
            entity.Property(u => u.Name).IsRequired().HasMaxLength(100);

            entity.HasOne(u => u.Class)
                .WithMany(c => c.Students)
                .HasForeignKey(u => u.ClassId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<SchoolClass>(entity =>
        {
            entity.HasIndex(c => c.Name).IsUnique();
            entity.Property(c => c.Name).IsRequired().HasMaxLength(100);
            entity.Property(c => c.Code).HasMaxLength(20);
        });

        modelBuilder.Entity<Subject>(entity =>
        {
            entity.HasIndex(s => s.Name).IsUnique();
            entity.Property(s => s.Name).IsRequired().HasMaxLength(100);
            entity.Property(s => s.Code).HasMaxLength(20);
        });

        modelBuilder.Entity<TeacherAssignment>(entity =>
        {
            entity.HasIndex(t => new { t.TeacherId, t.ClassId, t.SubjectId }).IsUnique();

            entity.HasOne(t => t.Teacher)
                .WithMany()
                .HasForeignKey(t => t.TeacherId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(t => t.Class)
                .WithMany(c => c.TeacherAssignments)
                .HasForeignKey(t => t.ClassId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(t => t.Subject)
                .WithMany(s => s.TeacherAssignments)
                .HasForeignKey(t => t.SubjectId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Assignment>(entity =>
        {
            entity.Property(a => a.Title).IsRequired().HasMaxLength(200);

            entity.HasOne(a => a.Teacher)
                .WithMany()
                .HasForeignKey(a => a.TeacherId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(a => a.Class)
                .WithMany(c => c.Assignments)
                .HasForeignKey(a => a.ClassId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(a => a.Subject)
                .WithMany(s => s.Assignments)
                .HasForeignKey(a => a.SubjectId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Submission>(entity =>
        {
            entity.HasIndex(s => new { s.AssignmentId, s.StudentId }).IsUnique();
            entity.Property(s => s.Answer).IsRequired();

            entity.HasOne(s => s.Assignment)
                .WithMany(a => a.Submissions)
                .HasForeignKey(s => s.AssignmentId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(s => s.Student)
                .WithMany()
                .HasForeignKey(s => s.StudentId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<SubmissionAttachment>(entity =>
        {
            entity.Property(a => a.FileName).IsRequired().HasMaxLength(255);
            entity.Property(a => a.ContentType).IsRequired().HasMaxLength(100);
            entity.Property(a => a.FileData).IsRequired();

            entity.HasOne(a => a.Submission)
                .WithMany(s => s.Attachments)
                .HasForeignKey(a => a.SubmissionId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<AssignmentQuestion>(entity =>
        {
            entity.Property(q => q.Question).IsRequired().HasMaxLength(2000);

            entity.HasOne(q => q.Assignment)
                .WithMany(a => a.Questions)
                .HasForeignKey(q => q.AssignmentId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(q => q.Student)
                .WithMany()
                .HasForeignKey(q => q.StudentId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<AssignmentAnswer>(entity =>
        {
            entity.Property(a => a.Answer).IsRequired().HasMaxLength(2000);

            entity.HasOne(a => a.Question)
                .WithMany(q => q.Answers)
                .HasForeignKey(a => a.QuestionId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(a => a.Teacher)
                .WithMany()
                .HasForeignKey(a => a.TeacherId)
                .OnDelete(DeleteBehavior.Restrict);
        });
    }
}
