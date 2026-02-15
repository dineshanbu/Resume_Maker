// ATS analysis service
// Works directly on the structured Resume JSON instead of HTML.

const { normalizeText, computeKeywordMatch } = require('../utils/nlpKeywords');

const SECTION_WEIGHTS = {
  summary: 0.1,
  skills: 0.1,
  experience: 0.1,
  education: 0.1,
  contact: 0.1,
  keywords: 0.3,
  formatting: 0.2
};

/**
 * Flatten resume JSON into a single text blob for keyword analysis.
 */
function flattenResumeToText(resume = {}) {
  const parts = [];
  const data = resume.resumeData || resume.data || {};

  const personal = data.personalInfo || data.personalDetails || resume.personalInfo || {};
  const summary =
    data.professionalSummary?.summary ||
    data.summary ||
    resume.summary ||
    personal.profileSummary ||
    '';
  const experience = data.workExperience || data.experience || resume.experience || [];
  const education = data.education || resume.education || [];
  const skills =
    data.skills ||
    resume.skills ||
    data.primarySkills ||
    [];
  const projects = data.projects || resume.projects || [];
  const certifications = data.certifications || resume.certifications || [];

  if (personal.fullName) parts.push(personal.fullName);
  if (personal.title) parts.push(personal.title);
  if (personal.email) parts.push(personal.email);
  if (personal.phone) parts.push(personal.phone);
  if (personal.location) parts.push(personal.location);
  if (personal.address) parts.push(personal.address);

  if (summary) parts.push(summary);

  if (Array.isArray(experience)) {
    experience.forEach(exp => {
      if (!exp) return;
      parts.push(
        exp.jobTitle || exp.role || '',
        exp.company || '',
        exp.location || '',
        exp.description || '',
        Array.isArray(exp.achievements) ? exp.achievements.join(' ') : ''
      );
    });
  }

  if (Array.isArray(education)) {
    education.forEach(edu => {
      if (!edu) return;
      parts.push(
        edu.degree || '',
        edu.institution || '',
        edu.location || '',
        edu.description || ''
      );
    });
  }

  if (Array.isArray(skills)) {
    // When skills is an array of strings
    parts.push(skills.join(' '));
  } else {
    // When skills is an object with arrays
    if (Array.isArray(skills.technical)) parts.push(skills.technical.join(' '));
    if (Array.isArray(skills.soft)) parts.push(skills.soft.join(' '));
    if (Array.isArray(skills.languages)) {
      skills.languages.forEach(lang => {
        parts.push(lang.language || '', lang.proficiency || '');
      });
    }
    if (Array.isArray(skills.primarySkills)) parts.push(skills.primarySkills.join(' '));
  }

  if (Array.isArray(projects)) {
    projects.forEach(proj => {
      if (!proj) return;
      parts.push(
        proj.title || '',
        proj.description || '',
        Array.isArray(proj.technologies) ? proj.technologies.join(' ') : (proj.tech || ''),
        proj.highlights ? proj.highlights.join(' ') : ''
      );
    });
  }

  if (Array.isArray(certifications)) {
    certifications.forEach(cert => {
      if (!cert) return;
      parts.push(
        cert.name || '',
        cert.issuer || '',
        cert.description || ''
      );
    });
  }

  return normalizeText(parts.join(' '));
}

function hasSummarySection(resume = {}) {
  const data = resume.resumeData || resume.data || {};
  const summary =
    data.professionalSummary?.summary ||
    data.summary ||
    resume.summary ||
    data.personalInfo?.profileSummary;
  return !!(summary && summary.trim().length > 50);
}

function hasSkillsSection(resume = {}) {
  const data = resume.resumeData || resume.data || {};
  const skills = data.skills || resume.skills;
  if (!skills) return false;
  if (Array.isArray(skills)) return skills.length > 0;
  return Boolean(
    (Array.isArray(skills.technical) && skills.technical.length) ||
    (Array.isArray(skills.soft) && skills.soft.length) ||
    (Array.isArray(skills.primarySkills) && skills.primarySkills.length)
  );
}

function hasExperienceSection(resume = {}) {
  const data = resume.resumeData || resume.data || {};
  const experience = data.workExperience || data.experience || resume.experience;
  return Array.isArray(experience) && experience.length > 0;
}

function hasEducationSection(resume = {}) {
  const data = resume.resumeData || resume.data || {};
  const education = data.education || resume.education;
  return Array.isArray(education) && education.length > 0;
}

function hasContactInfo(resume = {}) {
  const data = resume.resumeData || resume.data || {};
  const personal = data.personalInfo || data.personalDetails || resume.personalInfo || {};
  return Boolean(
    personal.email &&
    (personal.phone || personal.city || personal.state || personal.location || personal.address)
  );
}

function computeFormattingScore(resume = {}) {
  const data = resume.resumeData || resume.data || {};
  const experience = data.workExperience || data.experience || resume.experience || [];

  let bulletScore = 0;
  if (Array.isArray(experience) && experience.length) {
    let bulletLikeDescriptions = 0;
    experience.forEach(exp => {
      if (!exp || !exp.description) return;
      const lines = String(exp.description).split(/\n|•|-/).filter(l => l.trim().length > 40);
      if (lines.length >= 2) {
        bulletLikeDescriptions += 1;
      }
    });
    bulletScore = bulletLikeDescriptions / experience.length;
  }

  // Assume no tables/icons when data is JSON-based
  const noTables = 1;
  const noIcons = 1;

  // Light heuristic: 40% bullets, 30% no tables, 30% no icons
  const score = (0.4 * bulletScore) + (0.3 * noTables) + (0.3 * noIcons);
  return Math.max(0, Math.min(1, score));
}

/**
 * Main ATS analysis entry.
 * @param {Object} params
 * @param {Object} params.resume - Mongoose resume document or plain object
 * @param {string} params.jobDescription - Optional JD text
 */
function analyzeResumeForATS({ resume, jobDescription = '' }) {
  const safeResume = resume ? (resume.toObject ? resume.toObject() : resume) : {};

  const flags = {
    hasSummary: hasSummarySection(safeResume),
    hasSkills: hasSkillsSection(safeResume),
    hasExperience: hasExperienceSection(safeResume),
    hasEducation: hasEducationSection(safeResume),
    hasContactInfo: hasContactInfo(safeResume),
    // For now we assume HTML from builder is clean (no tables/icons),
    // can be extended later by inspecting template HTML.
    hasTables: false,
    hasIcons: false,
    hasProperHeadings: true
  };

  const sectionScore =
    (flags.hasSummary ? SECTION_WEIGHTS.summary : 0) +
    (flags.hasSkills ? SECTION_WEIGHTS.skills : 0) +
    (flags.hasExperience ? SECTION_WEIGHTS.experience : 0) +
    (flags.hasEducation ? SECTION_WEIGHTS.education : 0);

  const contactScore = flags.hasContactInfo ? SECTION_WEIGHTS.contact : 0;

  const resumeText = flattenResumeToText(safeResume);
  const keywordMatch = computeKeywordMatch(resumeText, jobDescription || '');
  const keywordRatio = keywordMatch.matchPercentage / 100;
  const keywordScore = keywordRatio * SECTION_WEIGHTS.keywords;

  const formattingRatio = computeFormattingScore(safeResume);
  const formattingScore = formattingRatio * SECTION_WEIGHTS.formatting;

  const totalScore =
    sectionScore +
    contactScore +
    keywordScore +
    formattingScore;

  const score = Math.max(0, Math.min(100, Math.round(totalScore * 100)));

  return {
    score,
    scoreBreakdown: {
      sections: Math.round(sectionScore * 100),
      contact: Math.round(contactScore * 100),
      keywords: Math.round(keywordScore * 100),
      formatting: Math.round(formattingScore * 100)
    },
    keywordMatch,
    featureFlags: flags
  };
}

module.exports = {
  analyzeResumeForATS,
  flattenResumeToText
};

