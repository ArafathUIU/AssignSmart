namespace AssignSmart.Api.DTOs;

public record MarksheetAssignment(
    Guid Id,
    string Title,
    decimal MaxMarks
);

public record MarksheetCell(
    Guid AssignmentId,
    string Status,
    decimal? Marks
);

public record MarksheetRow(
    Guid StudentId,
    string StudentName,
    List<MarksheetCell> Cells,
    decimal? TotalMarks,
    decimal? TotalMax,
    double? Percentage
);

public record MarksheetResponse(
    string ClassName,
    List<MarksheetAssignment> Assignments,
    List<MarksheetRow> Rows
);
