namespace AssignSmart.Api.DTOs;

public record SimilarityResult(
    Guid SubmissionAId,
    string StudentAName,
    Guid SubmissionBId,
    string StudentBName,
    double Similarity,
    string AnswerPreview
);

public record SimilarityCheckResponse(
    List<SimilarityResult> Results,
    int TotalComparisons,
    int FlaggedCount,
    double Threshold
);
