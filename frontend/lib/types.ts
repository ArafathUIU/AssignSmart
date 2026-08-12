export type Role = "Admin" | "Teacher" | "Student";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  classId: string | null;
  className: string | null;
  createdAt: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface SchoolClass {
  id: string;
  name: string;
  code: string | null;
  studentCount?: number;
}

export interface Subject {
  id: string;
  name: string;
  code: string | null;
}

export interface TeacherAssignment {
  id: string;
  teacherId: string;
  teacherName: string;
  classId: string;
  className: string;
  subjectId: string;
  subjectName: string;
}

export interface Assignment {
  id: string;
  title: string;
  description: string | null;
  teacherId: string;
  teacherName: string;
  classId: string;
  className: string;
  subjectId: string;
  subjectName: string;
  deadline: string;
  maxMarks: number;
  isPublished: boolean;
  createdAt: string;
  submissionCount: number;
  allowedFileTypes: string | null;
}

export interface Submission {
  id: string;
  assignmentId: string;
  assignmentTitle: string;
  studentId: string;
  studentName: string;
  answer: string;
  status: "Submitted" | "Graded" | "Returned";
  marks: number | null;
  feedback: string | null;
  submittedAt: string;
  gradedAt: string | null;
  deadline: string;
  attachments: SubmissionAttachment[];
}

export interface SubmissionAttachment {
  id: string;
  fileName: string;
  contentType: string;
  fileSize: number;
}

export interface AssignmentQuestion {
  id: string;
  studentId: string;
  studentName: string;
  question: string;
  createdAt: string;
  answers: AssignmentAnswer[];
}

export interface AssignmentAnswer {
  id: string;
  teacherId: string;
  teacherName: string;
  answer: string;
  createdAt: string;
}

export interface MarksheetAssignment {
  id: string;
  title: string;
  maxMarks: number;
}

export interface MarksheetCell {
  assignmentId: string;
  status: string;
  marks: number | null;
  submissionId: string | null;
}

export interface MarksheetRow {
  studentId: string;
  studentName: string;
  cells: MarksheetCell[];
  totalMarks: number | null;
  totalMax: number | null;
  percentage: number | null;
}

export interface MarksheetResponse {
  className: string;
  assignments: MarksheetAssignment[];
  rows: MarksheetRow[];
}
