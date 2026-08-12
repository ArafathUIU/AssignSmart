using AssignSmart.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace AssignSmart.Api.Data;

public static class DbSeeder
{
    public static async Task SeedAsync(AppDbContext db)
    {
        if (await db.Users.AnyAsync())
        {
            return;
        }

        var now = DateTime.UtcNow;

        // ========================================
        // 1. ADMIN
        // ========================================
        var admin = NewUser("Admin", "admin@assignsmart.com", "Admin@123", Role.Admin);

        // ========================================
        // 2. TEACHERS (Bangladeshi names)
        // ========================================
        var teachers = new List<User>
        {
            NewUser("Md. Rahim Uddin",      "rahim.uddin@assignsmart.com",       "Teacher@123", Role.Teacher),
            NewUser("Fatema Begum",         "fatema.begum@assignsmart.com",      "Teacher@123", Role.Teacher),
            NewUser("Abdul Karim",          "abdul.karim@assignsmart.com",       "Teacher@123", Role.Teacher),
            NewUser("Nasrin Akter",         "nasrin.akter@assignsmart.com",      "Teacher@123", Role.Teacher),
            NewUser("Md. Shahidul Islam",   "shahidul.islam@assignsmart.com",    "Teacher@123", Role.Teacher),
            NewUser("Hasina Sultana",       "hasina.sultana@assignsmart.com",    "Teacher@123", Role.Teacher),
            NewUser("Mohammad Yusuf",       "mohammad.yusuf@assignsmart.com",    "Teacher@123", Role.Teacher),
            NewUser("Rabeya Khatun",        "rabeya.khatun@assignsmart.com",     "Teacher@123", Role.Teacher),
        };

        // Keep demo login teacher
        var demoTeacher = NewUser("Md. Karim Ahmed", "teacher@assignsmart.com", "Teacher@123", Role.Teacher);

        // ========================================
        // 3. SUBJECTS (NCTB curriculum)
        // ========================================
        var bangla1st = new Subject { Id = Guid.NewGuid(), Name = "Bangla 1st Paper", Code = "BNG1" };
        var bangla2nd = new Subject { Id = Guid.NewGuid(), Name = "Bangla 2nd Paper", Code = "BNG2" };
        var english1st = new Subject { Id = Guid.NewGuid(), Name = "English 1st Paper", Code = "ENG1" };
        var english2nd = new Subject { Id = Guid.NewGuid(), Name = "English 2nd Paper", Code = "ENG2" };
        var math = new Subject { Id = Guid.NewGuid(), Name = "Mathematics", Code = "MATH" };
        var genScience = new Subject { Id = Guid.NewGuid(), Name = "General Science", Code = "GSCI" };
        var physics = new Subject { Id = Guid.NewGuid(), Name = "Physics", Code = "PHYS" };
        var chemistry = new Subject { Id = Guid.NewGuid(), Name = "Chemistry", Code = "CHEM" };
        var biology = new Subject { Id = Guid.NewGuid(), Name = "Biology", Code = "BIOL" };
        var bgs = new Subject { Id = Guid.NewGuid(), Name = "Bangladesh & Global Studies", Code = "BGS" };
        var ict = new Subject { Id = Guid.NewGuid(), Name = "ICT", Code = "ICT" };
        var islam = new Subject { Id = Guid.NewGuid(), Name = "Islam & Moral Education", Code = "IMED" };
        var phyEdu = new Subject { Id = Guid.NewGuid(), Name = "Physical Education & Health", Code = "PHED" };
        var artsCrafts = new Subject { Id = Guid.NewGuid(), Name = "Arts & Crafts", Code = "ARTC" };

        // ========================================
        // 4. CLASSES (6-10, Section A & B)
        // ========================================
        var class6A = new SchoolClass { Id = Guid.NewGuid(), Name = "Class 6 - Section A", Code = "6A" };
        var class6B = new SchoolClass { Id = Guid.NewGuid(), Name = "Class 6 - Section B", Code = "6B" };
        var class7A = new SchoolClass { Id = Guid.NewGuid(), Name = "Class 7 - Section A", Code = "7A" };
        var class7B = new SchoolClass { Id = Guid.NewGuid(), Name = "Class 7 - Section B", Code = "7B" };
        var class8A = new SchoolClass { Id = Guid.NewGuid(), Name = "Class 8 - Section A", Code = "8A" };
        var class8B = new SchoolClass { Id = Guid.NewGuid(), Name = "Class 8 - Section B", Code = "8B" };
        var class9A = new SchoolClass { Id = Guid.NewGuid(), Name = "Class 9 - Section A", Code = "9A" };
        var class9B = new SchoolClass { Id = Guid.NewGuid(), Name = "Class 9 - Section B", Code = "9B" };
        var class10A = new SchoolClass { Id = Guid.NewGuid(), Name = "Class 10 - Section A", Code = "10A" };
        var class10B = new SchoolClass { Id = Guid.NewGuid(), Name = "Class 10 - Section B", Code = "10B" };

        var classes = new[] { class6A, class6B, class7A, class7B, class8A, class8B, class9A, class9B, class10A, class10B };

        // ========================================
        // 5. STUDENTS (3-4 per class)
        // ========================================
        var students = new List<User>
        {
            // ---- Class 6A ----
            NewStudent("Sadia Rahman",     "sadia.rahman@school.edu",     class6A),
            NewStudent("Nafis Ahmed",      "nafis.ahmed@school.edu",      class6A),
            NewStudent("Tasnim Akhter",    "tasnim.akhter@school.edu",    class6A),
            NewStudent("Rafi Hasan",       "rafi.hasan@school.edu",       class6A),

            // ---- Class 6B ----
            NewStudent("Tamim Iqbal",      "tamim.iqbal@school.edu",      class6B),
            NewStudent("Jannatul Ferdous", "jannatul.ferdous@school.edu", class6B),
            NewStudent("Arif Hossain",     "arif.hossain@school.edu",     class6B),
            NewStudent("Nusrat Jahan",     "nusrat.jahan@school.edu",     class6B),

            // ---- Class 7A ----
            NewStudent("Mehedi Hasan",     "mehedi.hasan@school.edu",     class7A),
            NewStudent("Fahmida Islam",    "fahmida.islam@school.edu",    class7A),
            NewStudent("Tanvir Rahman",    "tanvir.rahman@school.edu",    class7A),
            NewStudent("Ritu Moni",        "ritu.moni@school.edu",        class7A),

            // ---- Class 7B ----
            NewStudent("Shakib Khan",      "shakib.khan@school.edu",      class7B),
            NewStudent("Mousumi Akter",    "mousumi.akter@school.edu",    class7B),
            NewStudent("Joynal Abedin",    "joynal.abedin@school.edu",    class7B),
            NewStudent("Ayesha Siddiqua",  "ayesha.siddiqua@school.edu",  class7B),

            // ---- Class 8A ----
            NewStudent("Imran Hossain",    "imran.hossain@school.edu",    class8A),
            NewStudent("Sharmin Sultana",  "sharmin.sultana@school.edu",  class8A),
            NewStudent("Kazi Nazmul",      "kazi.nazmul@school.edu",      class8A),
            NewStudent("Tania Akter",      "tania.akter@school.edu",      class8A),

            // ---- Class 8B ----
            NewStudent("Rakibul Islam",    "rakibul.islam@school.edu",    class8B),
            NewStudent("Nadia Sultana",    "nadia.sultana@school.edu",    class8B),
            NewStudent("Fahim Chowdhury",  "fahim.chowdhury@school.edu",  class8B),
            NewStudent("Sabrina Yasmin",   "sabrina.yasmin@school.edu",   class8B),

            // ---- Class 9A (Science) ----
            NewStudent("Tahmid Rahman",    "tahmid.rahman@school.edu",    class9A),
            NewStudent("Sumaiya Akhter",   "sumaiya.akhter@school.edu",   class9A),
            NewStudent("Mushfiqur Rahim",  "mushfiqur.rahim@school.edu",  class9A),
            NewStudent("Afroza Sultana",   "afroza.sultana@school.edu",   class9A),

            // ---- Class 9B (Science) ----
            NewStudent("Khaled Mahmud",    "khaled.mahmud@school.edu",    class9B),
            NewStudent("Raisa Nawar",      "raisa.nawar@school.edu",      class9B),
            NewStudent("Shafiqul Islam",   "shafiqul.islam@school.edu",   class9B),
            NewStudent("Mim Akhter",       "mim.akhter@school.edu",       class9B),

            // ---- Class 10A (Science) ----
            NewStudent("Sakib Al Hasan",   "sakib.alhasan@school.edu",     class10A),
            NewStudent("Nishat Tasnim",    "nishat.tasnim@school.edu",    class10A),
            NewStudent("Rashidul Haque",   "rashidul.haque@school.edu",   class10A),
            NewStudent("Farzana Haque",    "farzana.haque@school.edu",    class10A),

            // ---- Class 10B (Science) ----
            NewStudent("Mahmudul Hasan",   "mahmudul.hasan@school.edu",   class10B),
            NewStudent("Tasfia Rahman",    "tasfia.rahman@school.edu",    class10B),
            NewStudent("Sabbir Ahmed",     "sabbir.ahmed@school.edu",     class10B),
            NewStudent("Samia Rahman",     "samia.rahman@school.edu",     class10B),
        };

        // Keep demo student
        var demoStudent = NewStudent("Tanvir Hasan", "student@assignsmart.com", class10A);

        // ========================================
        // 6. SAVE USERS, CLASSES, SUBJECTS
        // ========================================
        db.Classes.AddRange(classes);
        db.Subjects.AddRange(bangla1st, bangla2nd, english1st, english2nd, math,
            genScience, physics, chemistry, biology, bgs, ict, islam, phyEdu, artsCrafts);
        db.Users.Add(admin);
        db.Users.Add(demoTeacher);
        db.Users.AddRange(teachers);
        db.Users.AddRange(students);
        db.Users.Add(demoStudent);

        // ========================================
        // 7. TEACHER ASSIGNMENTS
        // ========================================
        // Classes 6-8: core subjects per class
        foreach (var cls in new[] { class6A, class6B, class7A, class7B, class8A, class8B })
        {
            var classTeachers = teachers.Take(6).ToList();
            db.TeacherAssignments.Add(NewTA(classTeachers[0].Id, cls.Id, bangla1st.Id));
            db.TeacherAssignments.Add(NewTA(classTeachers[0].Id, cls.Id, bangla2nd.Id));
            db.TeacherAssignments.Add(NewTA(classTeachers[1].Id, cls.Id, english1st.Id));
            db.TeacherAssignments.Add(NewTA(classTeachers[1].Id, cls.Id, english2nd.Id));
            db.TeacherAssignments.Add(NewTA(classTeachers[2].Id, cls.Id, math.Id));
            db.TeacherAssignments.Add(NewTA(classTeachers[3].Id, cls.Id, genScience.Id));
            db.TeacherAssignments.Add(NewTA(classTeachers[4].Id, cls.Id, bgs.Id));
            db.TeacherAssignments.Add(NewTA(classTeachers[5].Id, cls.Id, ict.Id));
            db.TeacherAssignments.Add(NewTA(teachers[6].Id, cls.Id, islam.Id));
            db.TeacherAssignments.Add(NewTA(teachers[7].Id, cls.Id, phyEdu.Id));
            db.TeacherAssignments.Add(NewTA(teachers[7].Id, cls.Id, artsCrafts.Id));
        }

        // Classes 9-10: science group subjects
        foreach (var cls in new[] { class9A, class9B, class10A, class10B })
        {
            var classTeachers = teachers.Take(7).ToList();
            db.TeacherAssignments.Add(NewTA(classTeachers[0].Id, cls.Id, bangla1st.Id));
            db.TeacherAssignments.Add(NewTA(classTeachers[0].Id, cls.Id, bangla2nd.Id));
            db.TeacherAssignments.Add(NewTA(classTeachers[1].Id, cls.Id, english1st.Id));
            db.TeacherAssignments.Add(NewTA(classTeachers[1].Id, cls.Id, english2nd.Id));
            db.TeacherAssignments.Add(NewTA(classTeachers[2].Id, cls.Id, math.Id));
            db.TeacherAssignments.Add(NewTA(classTeachers[3].Id, cls.Id, physics.Id));
            db.TeacherAssignments.Add(NewTA(classTeachers[4].Id, cls.Id, chemistry.Id));
            db.TeacherAssignments.Add(NewTA(classTeachers[5].Id, cls.Id, biology.Id));
            db.TeacherAssignments.Add(NewTA(classTeachers[6].Id, cls.Id, bgs.Id));
            db.TeacherAssignments.Add(NewTA(teachers[6].Id, cls.Id, ict.Id));
            db.TeacherAssignments.Add(NewTA(teachers[7].Id, cls.Id, islam.Id));
            db.TeacherAssignments.Add(NewTA(teachers[7].Id, cls.Id, phyEdu.Id));
        }

        // ========================================
        // 8. ASSIGNMENTS (2-3 per class, varied deadlines)
        // ========================================
        var rng = new Random(42);

        var assignmentDefs = new List<(SchoolClass cls, Subject subj, User teacher, string title, string desc, int maxMarks, int daysAhead)>
        {
            // Class 8A
            (class8A, math, teachers[2],  "Algebraic Expressions",   "Solve problems on algebraic expressions from Chapter 4.",         25, 7),
            (class8A, genScience, teachers[3],  "Light & Reflection",  "Explain the laws of reflection with diagrams and examples.",      20, 5),
            (class8A, bangla1st, teachers[0],   "???? ????",          "?????????? ??? ?????????? ????? ??? ???? ??? (???????? 200 ???)", 30, 10),
            (class8A, english1st, teachers[1],  "Reading Comprehension", "Read the passage and answer the questions that follow.",          25, 8),
            (class8A, bgs, teachers[4],         "Liberation War 1971",  "Write a short essay on the Mujibnagar Government.",              20, 14),

            // Class 8B
            (class8B, math, teachers[2],        "Geometry Basics",    "Prove the theorems on triangles from Chapter 6.",                25, 6),
            (class8B, english2nd, teachers[1],  "Paragraph Writing",  "Write a paragraph on 'A Village Market' (150 words).",           20, 9),
            (class8B, ict, teachers[5],         "MS Word Assignment",  "Create a formatted document with tables and images.",            15, 12),

            // Class 9A
            (class9A, physics, teachers[3],     "Newton's Laws",      "Explain Newton's three laws of motion with mathematical proofs.", 25, 6),
            (class9A, chemistry, teachers[4],   "Periodic Table",     "Memorize the first 20 elements with their symbols and valencies.",20, 5),
            (class9A, biology, teachers[5],     "Cell Structure",     "Draw and label a plant cell and an animal cell.",                20, 8),
            (class9A, math, teachers[2],        "Trigonometry",       "Solve the trigonometric ratio problems from Chapter 9.",         30, 10),
            (class9A, english1st, teachers[1],  "Nelson Mandela",     "Read the passage and write a summary in your own words.",        25, 11),

            // Class 9B
            (class9B, physics, teachers[3],     "Motion & Velocity",  "Calculate velocity and acceleration using equations of motion.", 25, 7),
            (class9B, math, teachers[2],        "Set Theory",         "Solve set operations (union, intersection, difference).",        20, 8),
            (class9B, bangla2nd, teachers[0],   "??????? (?????)",   "????????? ???????? ????? ????? ??? ???? ???.",                   25, 12),

            // Class 10A
            (class10A, math, teachers[2],       "Algebra Worksheet",     "Solve quadratic equations using formula and factorization.",   25, 5),
            (class10A, physics, teachers[3],    "Ohm's Law",            "State Ohm's Law and solve numerical problems.",                20, 7),
            (class10A, chemistry, teachers[4],  "Chemical Bonding",     "Explain ionic and covalent bonds with examples.",              25, 10),
            (class10A, biology, teachers[5],    "Human Heart",          "Draw and explain the structure of the human heart.",           20, 8),
            (class10A, bangla1st, teachers[0],  "???? ??????",         "??????????????? ????? ?????? ????? ????.",                     30, 14),
            (class10A, english2nd, teachers[1], "Formal Letter",        "Write a formal letter to the editor about road safety.",       20, 12),
            (class10A, english1st, teachers[1], "Seen Comprehension",   "Read the passage from Unit 5 and answer the questions.",       25, 4),

            // Covers a variety of deadlines: some soon, some later, some past
            // Past deadlines for test data diversity
            (class10A, ict, teachers[6],         "HTML Basics",         "Create a simple webpage with headings, paragraphs and links.",  15, -3),
            (class9A, bgs, teachers[4],          "Climate of Bangladesh","Write about the six seasons of Bangladesh.",                    20, -5),
            (class8A, bangla2nd, teachers[0],    "???? ??????",        "????????? ??????? ???? ??? ???? ???.",                         25, -7),
        };

        var assignments = new List<Assignment>();

        foreach (var def in assignmentDefs)
        {
            var deadline = def.daysAhead >= 0
                ? now.AddDays(def.daysAhead)
                : now.AddDays(def.daysAhead); // already past

            var isPublished = true; // Most are published

            assignments.Add(new Assignment
            {
                Id = Guid.NewGuid(),
                Title = def.title,
                Description = def.desc,
                TeacherId = def.teacher.Id,
                ClassId = def.cls.Id,
                SubjectId = def.subj.Id,
                Deadline = deadline,
                MaxMarks = def.maxMarks,
                IsPublished = isPublished,
                AllowedFileTypes = rng.Next(3) switch
                {
                    0 => "pdf,docx,pptx",
                    1 => "pdf,png,jpg",
                    _ => null
                }
            });
        }

        db.Assignments.AddRange(assignments);

        // ========================================
        // 9. SUBMISSIONS
        // ========================================
        var submissions = new List<Submission>();

        foreach (var assignment in assignments)
        {
            var classStudents = students.Where(s => s.ClassId == assignment.ClassId).ToList();

            // Not all students submit; ~60-80% do
            foreach (var student in classStudents.Take(rng.Next(2, classStudents.Count + 1)))
            {
                var submittedAt = assignment.Deadline < now
                    ? assignment.Deadline.AddHours(-rng.Next(1, 48))
                    : now.AddHours(-rng.Next(1, 72));

                // 50% chance it's graded if submitted before now
                var shouldGrade = rng.Next(2) == 0 && submittedAt < now.AddHours(-1);

                var submission = new Submission
                {
                    Id = Guid.NewGuid(),
                    AssignmentId = assignment.Id,
                    StudentId = student.Id,
                    Answer = GenerateAnswer(assignment.Title, student.Name),
                    Status = shouldGrade ? SubmissionStatus.Graded : SubmissionStatus.Submitted,
                    SubmittedAt = submittedAt,
                };

                if (shouldGrade)
                {
                    submission.Marks = Math.Round((decimal)(rng.Next(60, 100)) / 100m * assignment.MaxMarks, 1);
                    submission.Feedback = GenerateFeedback(submission.Marks ?? 0, assignment.MaxMarks);
                    submission.GradedAt = submittedAt.AddHours(rng.Next(2, 48));
                }

                submissions.Add(submission);
            }
        }

        db.Submissions.AddRange(submissions);
        await db.SaveChangesAsync();
    }

    private static TeacherAssignment NewTA(Guid teacherId, Guid classId, Guid subjectId) => new()
    {
        Id = Guid.NewGuid(),
        TeacherId = teacherId,
        ClassId = classId,
        SubjectId = subjectId
    };

    private static User NewUser(string name, string email, string password, Role role) => new()
    {
        Id = Guid.NewGuid(),
        Name = name,
        Email = email,
        PasswordHash = BCrypt.Net.BCrypt.HashPassword(password),
        Role = role,
        CreatedAt = DateTime.UtcNow
    };

    private static User NewStudent(string name, string email, SchoolClass cls) => new()
    {
        Id = Guid.NewGuid(),
        Name = name,
        Email = email,
        PasswordHash = BCrypt.Net.BCrypt.HashPassword("Student@123"),
        Role = Role.Student,
        ClassId = cls.Id,
        CreatedAt = DateTime.UtcNow
    };

    private static string GenerateAnswer(string assignmentTitle, string studentName)
    {
        var answers = new Dictionary<string, string[]>
        {
            ["Algebra"] = new[] {
                "x = 5, y = -3. Solved using elimination method. The equations were: 2x + 3y = 1 and x - y = 8.",
                "Used the quadratic formula: x = [-b +/- sqrt(b^2 - 4ac)] / 2a. The roots are x = -2 and x = 3.",
                "Solution attached. Used factorization method for the given polynomial expressions."
            },
            ["Geometry"] = new[] {
                "Theorem proved using SAS similarity. Angles A and B are equal by construction.",
                "The area of the triangle is 24 sq. units. Used formula: 1/2 * base * height.",
            },
            ["Science"] = new[] {
                "Light travels in a straight line. The angle of incidence equals the angle of reflection.",
                "The experiment demonstrates that water boils at 100°C at sea level.",
            },
            ["Cell"] = new[] {
                "Plant cells have cell walls and chloroplasts which animal cells do not. Diagrams attached.",
                "The nucleus controls all cell activities. Mitochondria produces energy.",
            },
            ["Physics"] = new[] {
                "Using F = ma, the acceleration is 5 m/s^2. All three laws explained with examples.",
                "V = IR. Given R = 10 ohms and I = 2A, V = 20V. Total resistance in series = R1 + R2 + R3.",
                "Velocity = displacement / time = 100m / 10s = 10 m/s. Acceleration = 0 (constant velocity)."
            },
            ["Chemistry"] = new[] {
                "H2O = 2 Hydrogen + 1 Oxygen. NaCl = ionic bond, electron transfer from Na to Cl.",
                "First 20 elements: H, He, Li, Be, B, C, N, O, F, Ne, Na, Mg, Al, Si, P, S, Cl, Ar, K, Ca.",
            },
            ["Trigonometry"] = new[] {
                "sin 30° = 1/2, cos 60° = 1/2, tan 45° = 1. Used the right triangle method.",
                "sin^2 θ + cos^2 θ = 1 proved. Complementary angle relations also shown.",
            },
            ["Set"] = new[] {
                "A U B = {1,2,3,4,5,6}. A ∩ B = {3,4}. Difference A-B = {1,2}.",
                "n(A U B) = n(A) + n(B) - n(A ∩ B). Applied to the given sets correctly.",
            },
            ["Comprehension"] = new[] {
                "1. The author describes his childhood. 2. 'Resilient' means able to recover quickly. 3. The tone is reflective.",
                "Summary: The passage discusses the importance of education in personal development.",
                "1. True. 2. The main theme is perseverance. 3. 'Inevitable' means certain to happen.",
            },
            ["Paragraph"] = new[] {
                "A Village Market is a place where villagers gather to buy and sell goods... (150 words)",
                "The marketplace comes alive on Fridays with farmers bringing fresh produce...",
            },
            ["Letter"] = new[] {
                "To the Editor, I am writing to express my concern about the increasing road accidents in our city... (formal letter format)",
                "Dear Sir, I wish to draw your attention to the poor condition of roads in our locality...",
            },
            ["HTML"] = new[] {
                "<html><head><title>My Page</title></head><body><h1>Hello World</h1><p>Welcome</p></body></html>",
                "Created a webpage with headings, paragraphs, and links as requested. Code attached.",
            },
            ["????"] = new[] { // Generic Bangla answer
                "?????????? ????????? ??? ???? ?????? ???: ?????, ?????? ??? ????? ??? ...",
                "?????????? ???'? ?????? ??????? ??????? ?? ????, ????????? ??? ???? ???? ??? ??? ...",
            },
        };

        var rng = new Random(assignmentTitle.GetHashCode() + studentName.GetHashCode());

        foreach (var kvp in answers)
        {
            if (assignmentTitle.Contains(kvp.Key, StringComparison.OrdinalIgnoreCase) ||
                (kvp.Key.Contains("????") && ContainsBangla(assignmentTitle)))
            {
                var options = kvp.Value;
                return options[rng.Next(options.Length)];
            }
        }

        // Default
        return $"Completed the assignment on {assignmentTitle}. Detailed solution attached as requested by the teacher.";
    }

    private static bool ContainsBangla(string text) =>
        text.Any(c => c >= 0x0980 && c <= 0x09FF);

    private static string GenerateFeedback(decimal marks, decimal maxMarks)
    {
        var ratio = marks / maxMarks;
        if (ratio >= 0.9m)
            return "Excellent work! Keep it up. Your understanding of the topic is outstanding.";
        if (ratio >= 0.8m)
            return "Very good. A few minor errors. Review the concepts once more.";
        if (ratio >= 0.7m)
            return "Good effort. Work on improving your problem-solving approach.";
        if (ratio >= 0.6m)
            return "Satisfactory. Pay more attention to details and accuracy.";
        return "Needs improvement. Please review the chapter and practice more problems.";
    }
}
