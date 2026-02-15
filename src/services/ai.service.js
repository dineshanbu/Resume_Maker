// AI service abstraction for ATS-related summaries and improvements.
// NOTE: This file is designed so you can plug in a real LLM provider
// (OpenAI, Gemini, etc.) later. For now it generates structured,
// high-quality heuristic text based on ATS metrics so the feature
// works even without external API keys.

/**
 * Generate AI-style feedback summary for ATS results.
 * @param {Object} params
 * @param {Object} params.resumeJson - Plain resume JSON data
 * @param {string} params.jobDescription - Job description text
 * @param {Object} params.metrics - Output of analyzeResumeForATS(...)
 */
async function generateAtsSummary({ resumeJson, jobDescription, metrics }) {
  const { score, keywordMatch, featureFlags, scoreBreakdown } = metrics || {};
  const jdProvided = !!(jobDescription && jobDescription.trim().length);

  const strengths = [];
  const improvements = [];

  if (featureFlags?.hasExperience && featureFlags?.hasEducation) {
    strengths.push('Your resume includes both work experience and education, which covers the core sections recruiters expect.');
  }

  if (featureFlags?.hasSkills) {
    strengths.push('A dedicated skills section makes it easier for ATS systems to extract your key competencies.');
  }

  if (featureFlags?.hasContactInfo) {
    strengths.push('Your contact information is clearly present, which prevents ATS parsing failures at the top of the funnel.');
  }

  if (!featureFlags?.hasSummary) {
    improvements.push('Add a concise professional summary at the top of your resume to quickly align your profile with the target role.');
  }

  if (!featureFlags?.hasSkills) {
    improvements.push('Create a structured skills section, grouping tools, technologies, and soft skills that are relevant to the role.');
  }

  if (keywordMatch && keywordMatch.matchPercentage < 60 && jdProvided) {
    improvements.push('Increase the overlap between the job description keywords and your resume content, especially within the experience and skills sections.');
  }

  if ((scoreBreakdown?.formatting || 0) < 60) {
    improvements.push('Break long paragraphs into concise bullet points to improve readability and ATS parsing quality.');
  }

  // Fallbacks to ensure we always have content
  if (!strengths.length) {
    strengths.push('Your resume contains enough information for an ATS to parse your background and experience.');
  }
  if (!improvements.length) {
    improvements.push('Fine-tune wording in your experience bullets to emphasize measurable impact and outcomes.');
  }

  const readability = buildReadabilityComment(score, keywordMatch?.matchPercentage);

  return {
    strengths: strengths.slice(0, 3),
    improvements: improvements.slice(0, 3),
    readability
  };
}

function buildReadabilityComment(score, keywordPct) {
  const s = typeof score === 'number' ? score : 0;
  const k = typeof keywordPct === 'number' ? keywordPct : 0;

  if (s >= 85 && k >= 70) {
    return 'Overall readability is strong. A recruiter can quickly scan your profile, and your keywords align well with typical ATS filters.';
  }

  if (s >= 70) {
    return 'The resume reads well, but there is room to tighten sections and add a few more targeted keywords from the job description.';
  }

  return 'Readability can be improved by simplifying long sentences, using consistent bullet structures, and surfacing the most important accomplishments at the top of each section.';
}

/**
 * Generate improvement suggestions that the frontend can selectively apply.
 * This is intentionally deterministic and template-based so it works without
 * a live LLM, but the return shape matches what a future LLM integration
 * would provide.
 */
async function generateAtsImprovements({ resumeJson, jobDescription }) {
  const data = resumeJson?.resumeData || resumeJson?.data || {};

  const personal = data.personalInfo || data.personalDetails || resumeJson.personalInfo || {};
  const targetTitle = inferTargetTitle(personal, jobDescription);

  const summarySuggestion = buildSummarySuggestion(personal, targetTitle, jobDescription);
  const experienceSuggestions = buildExperienceSuggestions(data, jobDescription);
  const actionVerbs = [
    'Led',
    'Owned',
    'Implemented',
    'Optimized',
    'Designed',
    'Delivered',
    'Automated',
    'Improved'
  ];

  return {
    summarySuggestion,
    experienceSuggestions,
    actionVerbs
  };
}

function inferTargetTitle(personal, jobDescription) {
  if (personal?.jobTitle) return personal.jobTitle;
  if (!jobDescription) return null;
  const firstLine = jobDescription.split('\n')[0] || '';
  const match = firstLine.match(/(senior|lead|principal|staff)?\s*([a-zA-Z0-9+/#\s]+?(engineer|developer|manager|designer))/i);
  return match ? match[0].trim() : null;
}

function buildSummarySuggestion(personal, targetTitle, jobDescription) {
  const name = personal?.fullName || 'this candidate';
  const title = targetTitle || personal?.jobTitle || 'experienced professional';
  const years = personal?.totalExperience || personal?.yearsOfExperience;

  const jdHint = jobDescription ? ' tailored to this role' : '';

  const experiencePart = years
    ? `${years}+ years of experience`
    : 'solid experience';

  return `${name} is a ${title} with ${experiencePart} delivering high-impact results across multiple projects. The resume highlights core strengths, modern tooling, and cross-functional collaboration${jdHint}, but you can further emphasize measurable outcomes and domain-specific achievements.`;
}

function buildExperienceSuggestions(data, jobDescription) {
  const experience = data.workExperience || data.experience || [];
  if (!Array.isArray(experience) || !experience.length) {
    return [];
  }

  const maxItems = Math.min(experience.length, 3);
  const suggestions = [];

  for (let i = 0; i < maxItems; i++) {
    const exp = experience[i] || {};
    const bullets = [];

    const role = exp.jobTitle || exp.role || 'your role';
    const company = exp.company || 'the organization';

    bullets.push(
      `Led initiatives as ${role} at ${company}, focusing on ownership of end-to-end delivery rather than task-level work.`
    );

    bullets.push(
      'Rewrote bullets to start with action verbs and end with clear, quantifiable outcomes (e.g. impact on revenue, latency, conversion, or adoption).'
    );

    if (jobDescription && jobDescription.length > 0) {
      bullets.push(
        'Aligned responsibilities and achievements with the language used in the job description so ATS keyword matching and recruiter scanning both improve.'
      );
    } else {
      bullets.push(
        'Grouped related responsibilities under a few concise bullets to avoid overwhelming the reader with low-signal details.'
      );
    }

    suggestions.push({
      index: i,
      bullets
    });
  }

  return suggestions;
}

module.exports = {
  generateAtsSummary,
  generateAtsImprovements
};

