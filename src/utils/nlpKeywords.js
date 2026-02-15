// Lightweight NLP-style keyword extraction and matching utilities
// Designed to avoid extra dependencies while still providing
// smarter-than-exact-match keyword handling.

const DEFAULT_STOP_WORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but',
  'for', 'with', 'without', 'of', 'in', 'on', 'at', 'to', 'from',
  'by', 'as', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'this', 'that', 'these', 'those',
  'i', 'you', 'he', 'she', 'it', 'we', 'they',
  'your', 'our', 'their', 'my', 'his', 'her',
  'will', 'would', 'can', 'could', 'should', 'may', 'might',
  'have', 'has', 'had', 'do', 'does', 'did',
  'over', 'under', 'more', 'less', 'very',
  'years', 'year', 'experience', 'skill', 'skills',
  'working', 'work', 'role', 'responsible'
]);

/**
 * Normalize text for keyword processing:
 * - Lowercase
 * - Replace most punctuation with spaces but keep characters commonly used in tech terms
 *   like +, #, . (for C++, C#, Node.js, etc)
 */
function normalizeText(text = '') {
  if (!text) return '';
  let result = text.toLowerCase();
  // Keep letters, numbers, + # . and spaces, replace other punctuation with space
  result = result.replace(/[^a-z0-9+#.\s]/g, ' ');
  // Collapse multiple spaces
  result = result.replace(/\s+/g, ' ').trim();
  return result;
}

/**
 * Basic stemmer-like normalizer to improve fuzzy matching
 * (not a full stemmer, but removes common suffixes).
 */
function normalizeToken(token) {
  if (!token) return '';
  let t = token.toLowerCase();

  // Remove plural 's' (skills -> skill, services -> service)
  if (t.length > 4 && t.endsWith('s')) {
    t = t.slice(0, -1);
  }

  // Remove common verb endings
  const endings = ['ing', 'ed'];
  endings.forEach(end => {
    if (t.length > 5 && t.endsWith(end)) {
      t = t.slice(0, -end.length);
    }
  });

  return t;
}

/**
 * Tokenize text into a unique set of candidate keywords.
 */
function extractKeywordsFromText(text, { minLength = 3 } = {}) {
  const normalized = normalizeText(text);
  if (!normalized) return [];

  const rawTokens = normalized.split(' ');
  const candidates = new Set();

  for (const raw of rawTokens) {
    const trimmed = raw.trim();
    if (!trimmed) continue;
    if (trimmed.length < minLength) continue;
    if (DEFAULT_STOP_WORDS.has(trimmed)) continue;

    const normalizedToken = normalizeToken(trimmed);
    if (!normalizedToken || DEFAULT_STOP_WORDS.has(normalizedToken)) continue;

    candidates.add(normalizedToken);
  }

  return Array.from(candidates);
}

/**
 * Simple similarity check between two tokens.
 * - Exact match
 * - One contains the other with strong length overlap
 * - Small edit distance for short words
 */
function areTokensSimilar(a, b) {
  if (!a || !b) return false;
  if (a === b) return true;

  // Containment with overlap threshold
  if (a.includes(b) || b.includes(a)) {
    const minLen = Math.min(a.length, b.length);
    const maxLen = Math.max(a.length, b.length) || 1;
    if (minLen / maxLen >= 0.8) return true;
  }

  // Levenshtein distance for short words (up to length 10)
  if (a.length <= 10 && b.length <= 10) {
    const distance = levenshteinDistance(a, b);
    const maxLen = Math.max(a.length, b.length);
    if (distance <= 1) return true;
    if (distance <= 2 && maxLen >= 6) return true;
  }

  return false;
}

function levenshteinDistance(a, b) {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;

  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,      // deletion
        dp[i][j - 1] + 1,      // insertion
        dp[i - 1][j - 1] + cost // substitution
      );
    }
  }

  return dp[m][n];
}

/**
 * Compute keyword match between a job description and a resume text.
 * Uses fuzzy token comparison so it's not just strict equality.
 */
function computeKeywordMatch(resumeText = '', jobDescription = '') {
  const jdKeywords = extractKeywordsFromText(jobDescription);
  if (!jdKeywords.length) {
    return {
      matchedKeywords: [],
      missingKeywords: [],
      matchPercentage: 0
    };
  }

  const resumeKeywords = extractKeywordsFromText(resumeText);

  const matchedKeywords = [];
  const missingKeywords = [];

  for (const jd of jdKeywords) {
    const isMatched = resumeKeywords.some(res => areTokensSimilar(jd, res));
    if (isMatched) {
      matchedKeywords.push(jd);
    } else {
      missingKeywords.push(jd);
    }
  }

  const matchPercentage = Math.round((matchedKeywords.length / jdKeywords.length) * 100);

  return {
    matchedKeywords,
    missingKeywords,
    matchPercentage
  };
}

module.exports = {
  normalizeText,
  extractKeywordsFromText,
  computeKeywordMatch
};

