# AssignSmart — Assignment & Submission Management System

AssignSmart is a role-based school/college application for managing assignments
and student submissions. Admins manage users, classes, subjects and teacher
assignments; teachers create, publish and grade assignments; students view
their assignments, submit answers and see marks and feedback.

The project is a full-stack recruitment submission built with **Next.js,
React and TypeScript** on the frontend, **ASP.NET Core Web API (C#)** on the
backend and **PostgreSQL** for storage, secured with **JWT** authentication and
role-based authorization.

---

## Features

### Admin
- Full user management (create, view, update, delete) with roles and student-class assignment
- Class/course management (create, edit, delete)
- Subject management (create, edit, delete)
- Teacher ↔ class ↔ subject assignment
- Global visibility of all assignments and all submissions
- Institution-wide performance overview
- Application settings with role distribution, entity counts, and workflow rules

### Teacher
- Create, edit, delete and publish/unpublish assignments
- Assignment fields: title, description, deadline, maximum marks, class, subject, allowed file types
- Save as draft or publish immediately with one-click publish toggle
- Submission progress bars on the assignments list
- Students only see published assignments for their own class
- View submissions grouped by assignment with quick inline grading
- Grade submissions (marks + feedback) and change submission status
- Pending review queue highlighting ungraded submissions
- Answer student questions per assignment (Q&A thread)
- Performance overview with per-assignment breakdown

### Student
- View published assignments for their class with deadline and subject info
- Submit/update answers with file upload support (docs, PDF, images, videos)
- File formats validated against teacher-specified allowed types
- View submission status, marks, attached files and teacher feedback
- Cannot update graded submissions
- Ask questions per assignment — teacher responds inline
- Subject detail page with progress bars, grouped assignments, grade averages
- Calendar with live countdown, upcoming deadlines, activity tracker, reminders
- Grades page with subject-wise breakdown, average, highest marks
- Performance page with subject comparison bars, grade trend chart, GPA estimate
- Dashboard with upcoming deadlines, recent grades, and subject overview

### Technical
- JWT authentication with BCrypt password hashing
- Backend role-based authorization (never trust the frontend)
- Consistent REST API with validation, error handling and structured logs
- Swagger/OpenAPI documentation
- Database migrations + seed data
- File attachments stored as Base64 in database with type validation
- Per-assignment Q&A discussion threads (student questions + teacher answers)
- 27 xUnit unit tests (business rules, authorization, submission workflow, all passing)
- Responsive, polished EdTech UI with dark gradient page heroes, role-aware navigation, loading/empty/error states, toasts, modals and confirmation dialogs

### New routes added
- `/student/calendar`, `/teacher/calendar`, `/admin/calendar` — Calendar with countdown
- `/student/grades` — Grade overview and subject-wise breakdown
- `/student/performance`, `/teacher/performance`, `/admin/performance` — Performance dashboards
- `/student/subjects/[id]` — Enhanced subject detail with progress and grouped assignments

---

## Technology Stack

| Layer      | Technology                                              |
| ---------- | ------------------------------------------------------- |
| Frontend   | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4 |
| Backend    | ASP.NET Core 8 Web API, C#                               |
| Database   | PostgreSQL 16 (Npgsql), EF Core 8                        |
| Auth       | JWT (Microsoft.IdentityModel), BCrypt.Net-Next           |
| API docs   | Swagger / OpenAPI (Swashbuckle)                          |
| Testing    | xUnit, EF Core InMemory                                  |
| Container  | Docker Compose (PostgreSQL)                              |

---

## Project Structure

```
assignsmart/
├── backend/
│   └── AssignSmart.Api/            # ASP.NET Core Web API
│       ├── Controllers/            # REST endpoints
│       ├── Services/               # Business logic (token, assignment, submission)
│       ├── Models/                 # EF Core entities
│       ├── DTOs/                   # Request/response models
│       ├── Data/                   # AppDbContext, DbSeeder
│       ├── Middleware/             # Exception handling, request logging
│       ├── Migrations/             # EF Core migrations
│       └── appsettings.json        # Connection string, JWT, CORS
│   └── AssignSmart.Tests/          # xUnit unit tests
├── frontend/
│   ├── app/                        # Next.js App Router pages
│   │   ├── admin/                  # Admin screens
│   │   ├── teacher/                # Teacher screens
│   │   ├── student/                # Student screens
│   │   ├── login/                  # Login
│   │   └── dashboard/              # Role-aware dashboard
│   ├── components/
│   │   ├── ui/                     # Reusable component library
│   │   └── layout/                 # App shell (sidebar + topbar)
│   └── lib/                        # API client, types, utilities, hooks
├── AssignSmart.sln                 # .NET solution
├── docker-compose.yml              # PostgreSQL container
├── .env.example
└── README.md
```

---

## Architecture

**Frontend (Next.js App Router, client components):**
- `lib/api.ts` is the single API client — it attaches the JWT, parses errors
  into a friendly `ApiError`, and handles token/user persistence in `localStorage`.
- `AuthGuard` wraps authenticated pages, redirects unauthenticated users to
  `/login`, and renders the `AppShell` (sidebar + topbar). Hiding UI is a UX
  convenience only — every request is still authorized by the backend.
- `components/ui/*` is a small design system (Button, Input, Modal, Badge,
  Table, EmptyState, Toast, ...) used consistently across pages.
- Role-specific navigation: admin, teacher and student each see only their
  screens.

**Backend (ASP.NET Core, controllers → services):**
- Controllers are thin: they parse requests and map results. Business rules live
  in `Services/AssignmentService.cs` and `Services/SubmissionService.cs`.
- `TokenService` issues JWT tokens with `sub`, `email`, `unique_name` and `role` claims.
- `[Authorize(Roles = "...")]` enforces role access; resource-level checks (e.g.
  teacher owns the assignment, student owns the submission) are done inside the
  services, never trusting IDs from the client.
- `ExceptionHandlingMiddleware` converts exceptions into consistent
  ProblemDetails responses (400/401/403/404/409/422/500) without leaking internals.
- `RequestLoggingMiddleware` logs method/path/status/duration. Passwords and
  secrets are never logged.
- On startup the API applies EF migrations and seeds demo data.

**Database (PostgreSQL + EF Core):** migrations are applied automatically at
startup; seed data makes the app explorable immediately.

---

## Database

Normalized relational model (see `backend/AssignSmart.Api/Models/`):

```
User (Id, Name, Email, PasswordHash, Role, ClassId, CreatedAt)
  ├── Role: Admin | Teacher | Student
  └── Class (SchoolClass): Id, Name, Code
        └── Subject: Id, Name, Code
              └── TeacherAssignment: Id, TeacherId, ClassId, SubjectId   (unique triple)
                    └── Assignment: Id, Title, Description, Deadline, MaxMarks,
                                    IsPublished, TeacherId, ClassId, SubjectId, CreatedAt
                          └── Submission: Id, AssignmentId, StudentId, Answer, Status,
                                          Marks, Feedback, SubmittedAt, GradedAt
```

- A `TeacherAssignment` is the **unique (teacher, class, subject) combination**
  that authorizes a teacher to create assignments for that class+subject.
- `Submission` is unique per (assignment, student). Students may update their
  answer before the deadline.
- `Assignment` → `Class` and `Assignment` → `Subject` are stored directly for
  fast queries, while ownership/eligibility is validated through the
  `TeacherAssignment` relationship.

**Submission status workflow:** `Submitted → Graded`, or `Submitted → Returned`
(returned for revisions), and back again. The backend validates every transition
and only the owning teacher can change status or grade.

**Seed data:** 2 classes, 3 subjects, 3 teacher assignments, 4 assignments
(mix of draft and published) and 3 submissions. See
`backend/AssignSmart.Api/Data/DbSeeder.cs`.

---

## Setup Instructions

### 1. Prerequisites

- **.NET SDK 8** (https://dotnet.microsoft.com/download/dotnet/8.0)
- **Node.js 20+** (https://nodejs.org)
- **PostgreSQL 14+** OR **Docker Desktop**

### 2. Clone the repository

```bash
git clone https://github.com/ArafathUIU/AssignSmart.git
cd AssignSmart
```

### 3. Start PostgreSQL

**Option A — Docker (recommended):**

```bash
docker compose up -d db
```

This starts `postgres:16-alpine` on host port **5433** (5432 is left free to
avoid clashes with an existing local PostgreSQL). Database: `assignsmart`,
user: `assignsmart`, password: `assignsmart`.

**Option B — local PostgreSQL:**

Create a database and user:

```sql
CREATE USER assignsmart WITH PASSWORD 'assignsmart';
CREATE DATABASE assignsmart OWNER assignsmart;
```

### 4. Configure the backend

The default connection string in
`backend/AssignSmart.Api/appsettings.json` already matches the Docker setup:

```
Host=localhost;Port=5433;Database=assignsmart;Username=assignsmart;Password=assignsmart
```

Override it with the `ConnectionStrings__DefaultConnection` environment
variable if you use a different setup. See `.env.example`.

### 5. Run migrations & seed

Migrations and seeding run automatically when the API starts, so there is no
separate step. To run them manually:

```bash
cd backend/AssignSmart.Api
dotnet ef database update
```

### 6. Start the backend

```bash
cd backend/AssignSmart.Api
dotnet run
```

The API listens on `https://localhost:7030` (and `http://localhost:5164`) and
Swagger is available at `https://localhost:7030/swagger`.

> On first run you may need to trust the dev certificate:
> `dotnet dev-certs https --trust`

### 7. Configure the frontend

Create `frontend/.env.local` (see the root `.env.example` for all available variables):

```
NEXT_PUBLIC_API_URL=https://localhost:7030
```

### 8. Start the frontend

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:3000. The CORS policy on the backend allows this origin.

---

## Running Tests

```bash
cd backend/AssignSmart.Tests
dotnet test
```

Or from the repository root:

```bash
dotnet test backend/AssignSmart.Tests
```

There are **27 tests** covering:

- **Business rules** — required fields, valid deadline, max-marks bounds,
  draft/published visibility, student class eligibility, deadline enforcement,
  marks cannot exceed maximum.
- **Authorization** — admin/teacher/student access, cross-role denial, and
  resource ownership (teacher only grades own assignments, student only sees own
  submissions).
- **Submission workflow** — submit, update before deadline, duplicate
  submission conflict, deadline rejection, grading, feedback, status
  transitions, invalid transitions.

```bash
# Frontend checks
cd frontend
npm run lint
npm run build
```

---

## Demo Credentials

| Role    | Email                     | Password    |
| ------- | ------------------------- | ----------- |
| Admin   | `admin@assignsmart.com`   | `Admin@123` |
| Teacher | `teacher@assignsmart.com` | `Teacher@123` |
| Student | `student@assignsmart.com` | `Student@123` |

The login screen includes one-click autofill buttons for these accounts.

---

## Swagger / OpenAPI

Swagger UI: `https://localhost:7030/swagger`

All endpoints are documented. Click **Authorize** and paste the token returned
by `POST /api/auth/login` to try authenticated calls.

Key endpoints:

| Method | Endpoint                                  | Access            | Purpose                          |
| ------ | ----------------------------------------- | ----------------- | -------------------------------- |
| POST   | `/api/auth/login`                         | Public            | Login, returns JWT + user        |
| GET    | `/api/auth/me`                            | Authenticated     | Current user                     |
| GET/POST/PUT/DELETE | `/api/users` (+`/{id}`)     | Admin             | User management                  |
| GET/POST/PUT/DELETE | `/api/classes` (+`/{id}`)   | Admin             | Class management                 |
| GET/POST/PUT/DELETE | `/api/subjects` (+`/{id}`)  | Admin             | Subject management               |
| GET/POST/DELETE     | `/api/teacher-assignments`  | Admin             | Teacher ↔ class ↔ subject        |
| GET    | `/api/teacher-assignments/me`              | Teacher           | Current teacher's combinations   |
| GET/POST/PUT/DELETE | `/api/assignments` (+`/{id}`) | Teacher/Student | Assignments (role-scoped)        |
| PATCH  | `/api/assignments/{id}/publish`            | Teacher           | Publish / unpublish              |
| GET    | `/api/assignments/{id}/submissions`        | Teacher           | Submissions for an assignment    |
| GET/POST/PUT | `/api/submissions` (+`/{id}`)   | Role-scoped   | Submit / update answer           |
| PUT    | `/api/submissions/{id}/grade`              | Teacher           | Grade (marks + feedback)         |
| PATCH  | `/api/submissions/{id}/status`             | Teacher           | Change submission status         |
| GET    | `/api/assignments/{id}/questions`          | Student/Teacher   | Get Q&A thread for assignment    |
| POST   | `/api/assignments/{id}/questions`          | Student           | Ask a question                   |
| POST   | `/api/assignments/questions/{id}/answers`  | Teacher           | Answer a student question        |

---

## Assumptions

Where the requirements were open-ended, the following decisions were made and
documented:

1. **Classes and courses are one entity** — modeled as `SchoolClass`.
2. **Teacher eligibility** — a teacher may only create assignments for
   class/subject combinations that an admin has assigned to them via
   `TeacherAssignment` (unique per teacher+class+subject).
3. **Assignment editing after publication** — teachers may edit title,
   description, deadline and max marks on published assignments, and may unpublish
   them. Existing submissions are preserved.
4. **Submission updates** — students may update their answer any number of times
   before the deadline; once the deadline passes, submissions are locked.
5. **Late submissions** — not allowed; the backend rejects submissions after the
   deadline (students cannot submit late).
6. **Deleting a user** is a hard delete; classes/subjects may only be deleted
   when safe (the backend returns an appropriate error if dependent data blocks it).
7. **Submission statuses** — `Submitted`, `Graded`, `Returned`. Grading sets
   `Graded`; a teacher can also return a submission for revision.
8. **Marks** — decimal marks are allowed; they must be between 0 and the
   assignment's maximum marks.
9. **Dashboard scoping** — `/api/assignments` and `/api/submissions` return
   role-appropriate rows: admin sees everything, teacher sees only their own,
   student sees only published-for-their-class / their own submissions.
10. **File uploads** — students can attach files (docs, PDF, images, videos) to
    submissions. Files are stored as Base64 in the database. Teachers can restrict
    allowed file types per assignment (e.g., `pdf,docx,png`).
11. **Q&A system** — each assignment has a discussion thread where students can ask
    questions and the assignment teacher can answer. Answers are visible to all
    students in the class.
12. **Graded submission lock** — once a submission is graded, students cannot
    modify it. The backend enforces this at the API level.
13. **Demo/dev JWT key** is committed in `appsettings.json` for convenience of
    evaluation only. It must be replaced with a secure key in production.

---

## Known Limitations

- Password reset and email verification are out of scope.
- No pagination on list endpoints (lists are small for a demo; the UI handles it client-side).
- No real-time notifications — a visual in-app reminder bell is available on the calendar page.
- File attachments are stored as Base64 in the database (fine for demo scale; use object storage in production).
- Marks and feedback are not immutable once graded (a teacher may re-grade).
- No dark mode.

---

## License

For recruitment evaluation purposes only.
