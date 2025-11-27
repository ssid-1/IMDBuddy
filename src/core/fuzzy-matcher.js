/**
 * IMDBuddy - Fuzzy Matching Module
 * 
 * Advanced fuzzy string matching algorithms for finding the best
 * match between search results and target titles. Combines multiple
 * algorithms for optimal accuracy.
 */

const FuzzyMatcher = {
    /**
     * Get similarity score between two strings using multiple algorithms
     * @param {string} str1 - First string to compare
     * @param {string} str2 - Second string to compare
     * @returns {number} Similarity score between 0 and 1
     */
    getSimilarity(str1, str2) {
        const normalized1 = this.normalize(str1);
        const normalized2 = this.normalize(str2);
        
        if (normalized1 === normalized2) return 1.0;
        
        // Combine multiple similarity algorithms for better accuracy
        const levenshtein = this.levenshteinSimilarity(normalized1, normalized2);
        const jaro = this.jaroSimilarity(normalized1, normalized2);
        const substring = this.substringScore(normalized1, normalized2);
        const wordOverlap = this.wordOverlapScore(normalized1, normalized2);
        
        // Weighted combination of different similarity measures
        return (levenshtein * 0.3 + jaro * 0.3 + substring * 0.2 + wordOverlap * 0.2);
    },

    /**
     * Normalize string for comparison
     * @param {string} str - String to normalize
     * @returns {string} Normalized string
     */
    normalize(str) {
        return str.toLowerCase()
            .replace(/[^\w\s]/g, '') // Remove special characters
            .replace(/\s+/g, ' ')     // Normalize spaces
            .trim();
    },

    /**
     * Calculate Levenshtein distance-based similarity
     * @param {string} s1 - First string
     * @param {string} s2 - Second string
     * @returns {number} Similarity score between 0 and 1
     */
    levenshteinSimilarity(s1, s2) {
        const distance = this.levenshteinDistance(s1, s2);
        const maxLength = Math.max(s1.length, s2.length);
        return maxLength === 0 ? 1 : 1 - (distance / maxLength);
    },

    /**
     * Calculate Levenshtein distance between two strings
     * @param {string} s1 - First string
     * @param {string} s2 - Second string
     * @returns {number} Edit distance
     */
    levenshteinDistance(s1, s2) {
        const matrix = [];
        
        for (let i = 0; i <= s2.length; i++) {
            matrix[i] = [i];
        }
        
        for (let j = 0; j <= s1.length; j++) {
            matrix[0][j] = j;
        }
        
        for (let i = 1; i <= s2.length; i++) {
            for (let j = 1; j <= s1.length; j++) {
                if (s2.charAt(i - 1) === s1.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1,
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j] + 1
                    );
                }
            }
        }
        
        return matrix[s2.length][s1.length];
    },

    /**
     * Calculate Jaro similarity
     * @param {string} s1 - First string
     * @param {string} s2 - Second string
     * @returns {number} Jaro similarity score
     */
    jaroSimilarity(s1, s2) {
        if (s1 === s2) return 1.0;
        
        const len1 = s1.length;
        const len2 = s2.length;
        
        if (len1 === 0 || len2 === 0) return 0.0;
        
        const matchWindow = Math.floor(Math.max(len1, len2) / 2) - 1;
        const s1Matches = new Array(len1).fill(false);
        const s2Matches = new Array(len2).fill(false);
        
        let matches = 0;
        let transpositions = 0;
        
        // Find matches
        for (let i = 0; i < len1; i++) {
            const start = Math.max(0, i - matchWindow);
            const end = Math.min(i + matchWindow + 1, len2);
            
            for (let j = start; j < end; j++) {
                if (s2Matches[j] || s1[i] !== s2[j]) continue;
                s1Matches[i] = true;
                s2Matches[j] = true;
                matches++;
                break;
            }
        }
        
        if (matches === 0) return 0.0;
        
        // Find transpositions
        let k = 0;
        for (let i = 0; i < len1; i++) {
            if (!s1Matches[i]) continue;
            while (!s2Matches[k]) k++;
            if (s1[i] !== s2[k]) transpositions++;
            k++;
        }
        
        return (matches / len1 + matches / len2 + (matches - transpositions / 2) / matches) / 3.0;
    },

    /**
     * Calculate substring-based similarity score
     * @param {string} s1 - First string
     * @param {string} s2 - Second string
     * @returns {number} Substring similarity score
     */
    substringScore(s1, s2) {
        if (s1.includes(s2) || s2.includes(s1)) return 0.9;
        
        const shorter = s1.length < s2.length ? s1 : s2;
        const longer = s1.length < s2.length ? s2 : s1;
        
        let maxSubstring = 0;
        
        for (let i = 0; i < shorter.length; i++) {
            for (let j = i + 1; j <= shorter.length; j++) {
                const substring = shorter.substring(i, j);
                if (longer.includes(substring) && substring.length > maxSubstring) {
                    maxSubstring = substring.length;
                }
            }
        }
        
        return maxSubstring / Math.max(s1.length, s2.length);
    },

    /**
     * Calculate word overlap similarity score
     * @param {string} s1 - First string
     * @param {string} s2 - Second string
     * @returns {number} Word overlap score
     */
    wordOverlapScore(s1, s2) {
        const words1 = s1.split(' ').filter(w => w.length > 1);
        const words2 = s2.split(' ').filter(w => w.length > 1);
        
        if (words1.length === 0 || words2.length === 0) return 0;
        
        const intersection = words1.filter(word => words2.includes(word));
        const union = [...new Set([...words1, ...words2])];
        
        return intersection.length / union.length;
    },

    /**
     * Find the best match from search results
     * @param {string} searchTitle - The title to match against
     * @param {Array} results - Array of search results
     * @param {string|null} expectedType - Expected content type (movie/series)
     * @returns {Object|null} Best matching result or null
     */
    findBestMatch(searchTitle, results, expectedType = null) {
        LOGGER.group('IMDBuddy: FuzzyMatcher#findBestMatch: ' + searchTitle);
        try {
            if (!results || results.length === 0) {
                LOGGER.verbose("IMDBuddy: FuzzyMatcher#findBestMatch: No results - nothing to match");
                return null;
            }
            let filteredResults = results;

            if (expectedType) {
                const typeFiltered = results.filter(result => {
                    const resultType = result.titleType?.toLowerCase() || result.type?.toLowerCase();
                    return resultType === expectedType;
                });
                if (typeFiltered.length > 0) {
                    filteredResults = typeFiltered;
                    LOGGER.verbose(`IMDBuddy: FuzzyMatcher#findBestMatch: Filtered by type '${expectedType}', ${filteredResults.length} results`);
                }
            }

            let bestMatch = null;
            let bestScore = 0;
            
            for (const result of filteredResults) {
                if (!result.primaryTitle) continue;

                const title = result.primaryTitle || result.title || '';
                const score = this.getSimilarity(searchTitle, title);
                if (score > bestScore) {
                    bestScore = score;
                    bestMatch = { result, score };
                    LOGGER.verbose("IMDBuddy: FuzzyMatcher#findBestMatch: Updating best match to:", bestMatch.result.primaryTitle, "score:", bestScore);
                }
            }

            if (bestScore >= BASE_CONFIG.MIN_MATCH_SCORE) {
                LOGGER.verbose("IMDBuddy: FuzzyMatcher#findBestMatch: Returning best match with score:", bestScore);
                return bestMatch;
            } else {
                LOGGER.verbose("IMDBuddy: FuzzyMatcher#findBestMatch: No high-confidence match found, best score:", bestScore);
                return null;
            }
        } finally {
            LOGGER.groupEnd();
        }
    }
};

window.FuzzyMatcher = FuzzyMatcher;
