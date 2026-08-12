namespace AssignSmart.Api.Services;

public static class SimilarityService
{
    /// <summary>
    /// Computes Jaccard similarity between two texts. Returns a value between 0 and 1.
    /// Tokenizes by splitting on whitespace and punctuation, lowercasing, and removing short tokens.
    /// </summary>
    public static double ComputeSimilarity(string textA, string textB)
    {
        if (string.IsNullOrWhiteSpace(textA) || string.IsNullOrWhiteSpace(textB))
            return 0;

        var tokensA = Tokenize(textA);
        var tokensB = Tokenize(textB);

        if (tokensA.Count == 0 || tokensB.Count == 0)
            return 0;

        var intersection = new HashSet<string>(tokensA);
        intersection.IntersectWith(tokensB);

        var union = new HashSet<string>(tokensA);
        union.UnionWith(tokensB);

        return (double)intersection.Count / union.Count;
    }

    private static HashSet<string> Tokenize(string text)
    {
        var tokens = new HashSet<string>();
        var parts = text.ToLowerInvariant()
            .Split(new[] { ' ', '\n', '\r', '\t', ',', '.', ';', ':', '!', '?',
                '(', ')', '[', ']', '{', '}', '"', '\'', '`', '/', '\\', '-', '_',
                '+', '=', '*', '&', '%', '$', '#', '@', '|', '~', '<', '>', '^' },
                StringSplitOptions.RemoveEmptyEntries);

        foreach (var part in parts)
        {
            // Skip very short tokens and pure numbers
            if (part.Length <= 1) continue;
            if (part.All(char.IsDigit)) continue;
            tokens.Add(part);
        }

        return tokens;
    }
}
