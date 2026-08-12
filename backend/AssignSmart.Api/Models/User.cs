using System.ComponentModel.DataAnnotations;

namespace AssignSmart.Api.Models;

public class User
{
    public Guid Id { get; set; }

    [Required, MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [Required, MaxLength(255)]
    public string Email { get; set; } = string.Empty;

    public string PasswordHash { get; set; } = string.Empty;

    public Role Role { get; set; }

    public Guid? ClassId { get; set; }

    public SchoolClass? Class { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
