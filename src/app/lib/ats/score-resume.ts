import type { Resume } from "lib/redux/types";
import type { AtsAnalysisResult } from "./types";

const STOP_WORDS = new Set([
  "a", "an", "and", "are", "as", "at", "be", "by", "for", "from", "has", "have", "in", "is", "it", "its", "of", "on", "or", "that", "the", "their", "this", "to", "was", "were", "will", "with", "you", "your",
]);

const ACTION_VERBS = [
  "built", "created", "designed", "developed", "delivered", "implemented", "led", "managed", "optimized", "improved", "launched", "automated", "analyzed", "increased", "reduced", "scaled", "owned", "collaborated", "engineered",
];

const TECH_KEYWORDS = [
  "javascript", "typescript", "react", "next.js", "node.js", "python", "java", "sql", "postgresql", "mongodb", "aws", "docker", "kubernetes", "rest", "graphql", "html", "css", "tailwind", "redux", "git", "ci/cd", "machine learning", "deep learning", "nlp", "data analysis", "power bi", "excel",
];

function clamp(score: number): number {
  return Math.max(0, Math.min(100, Math.round(score)));
}

function normalize(text: string): string {
  return text.toLowerCase().replace(/\s+/g, " ").trim();
}

function tokenize(text: string): string[] {
  const words = normalize(text)
    .replace(/[^a-z0-9+.#\-\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 2 && !STOP_WORDS.has(word));
  return words;
}

function extractKeywords(jobDescription: string): string[] {
  const normalized = normalize(jobDescription);
  const foundTech = TECH_KEYWORDS.filter((keyword) => normalized.includes(keyword));
  const frequency = new Map<string, number>();

  for (const token of tokenize(jobDescription)) {
    frequency.set(token, (frequency.get(token) || 0) + 1);
  }

  const topTokens = Array.from(frequency.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 30)
    .map(([token]) => token);

  return Array.from(new Set([...foundTech, ...topTokens]));
}

function resumeToText(resume: Resume): string {
  const profile = Object.values(resume.profile).join(" ");
  const work = resume.workExperiences
    .flatMap((exp) => [exp.company, exp.jobTitle, exp.date, ...exp.descriptions])
    .join(" ");
  const education = resume.educations
    .flatMap((edu) => [edu.school, edu.degree, edu.date, edu.gpa, ...edu.descriptions])
    .join(" ");
  const projects = resume.projects
    .flatMap((project) => [project.project, project.date, ...project.descriptions])
    .join(" ");
  const skills = [
    ...resume.skills.descriptions,
    ...resume.skills.featuredSkills.map((item) => item.skill),
  ].join(" ");
  const certifications = resume.certifications
    .flatMap((cert) => [cert.name, cert.date, ...cert.descriptions])
    .join(" ");

  return normalize([profile, work, education, projects, skills, certifications].join(" "));
}

function scoreSectionCompleteness(resume: Resume): number {
  let score = 0;
  const profileFields = [
    resume.profile.name,
    resume.profile.email,
    resume.profile.phone,
    resume.profile.location,
    resume.profile.summary,
  ];

  score += (profileFields.filter(Boolean).length / profileFields.length) * 30;

  if (resume.workExperiences.some((exp) => exp.jobTitle || exp.company || exp.descriptions.length > 0)) {
    score += 25;
  }

  if (resume.educations.some((edu) => edu.school || edu.degree)) {
    score += 15;
  }

  if (resume.projects.length > 0) {
    score += 15;
  }

  if (resume.skills.descriptions.length > 0 || resume.skills.featuredSkills.length > 0) {
    score += 15;
  }

  return clamp(score);
}

function scoreImpactMetrics(resume: Resume): number {
  const bullets = [
    ...resume.workExperiences.flatMap((exp) => exp.descriptions),
    ...resume.projects.flatMap((project) => project.descriptions),
  ].filter(Boolean);

  if (bullets.length === 0) {
    return 20;
  }

  const quantifiedCount = bullets.filter((bullet) => /\d|%|\$|x|times/i.test(bullet)).length;
  const actionVerbCount = bullets.filter((bullet) => {
    const lower = bullet.toLowerCase();
    return ACTION_VERBS.some((verb) => lower.includes(verb));
  }).length;

  const quantifiedRatio = quantifiedCount / bullets.length;
  const actionRatio = actionVerbCount / bullets.length;

  return clamp(20 + quantifiedRatio * 45 + actionRatio * 35);
}

function scoreReadability(resume: Resume): number {
  let score = 40;
  const bullets = [
    ...resume.workExperiences.flatMap((exp) => exp.descriptions),
    ...resume.projects.flatMap((project) => project.descriptions),
  ].filter(Boolean);

  if (bullets.length > 0) {
    const conciseRatio = bullets.filter((bullet) => bullet.length <= 140).length / bullets.length;
    score += conciseRatio * 30;
  }

  if (resume.profile.email && /@/.test(resume.profile.email)) {
    score += 10;
  }
  if (resume.profile.phone && resume.profile.phone.replace(/\D/g, "").length >= 10) {
    score += 10;
  }
  if (resume.profile.url) {
    score += 10;
  }

  return clamp(score);
}

export function analyzeResumeForAts(resume: Resume, jobDescription: string): AtsAnalysisResult {
  const keywords = extractKeywords(jobDescription);
  const resumeText = resumeToText(resume);

  const matchedKeywords = keywords.filter((keyword) => resumeText.includes(normalize(keyword)));
  const missingKeywords = keywords.filter((keyword) => !resumeText.includes(normalize(keyword)));

  const keywordScore = keywords.length === 0 ? 0 : (matchedKeywords.length / keywords.length) * 100;
  const sectionScore = scoreSectionCompleteness(resume);
  const impactScore = scoreImpactMetrics(resume);
  const readabilityScore = scoreReadability(resume);

  const overallScore = clamp(
    keywordScore * 0.4 +
      sectionScore * 0.2 +
      impactScore * 0.25 +
      readabilityScore * 0.15,
  );

  const suggestions: string[] = [];

  if (missingKeywords.length > 0) {
    suggestions.push(`Add these job-specific keywords where truthful: ${missingKeywords.slice(0, 10).join(", ")}.`);
  }
  if (impactScore < 65) {
    suggestions.push("Rewrite experience bullets with impact metrics (%, revenue, speed, scale, time saved). ");
  }
  if (!resume.profile.summary || resume.profile.summary.length < 60) {
    suggestions.push("Add a stronger 2-3 line professional summary aligned to the job title and domain.");
  }
  if (!resume.projects.length) {
    suggestions.push("Add 1-2 relevant projects with measurable outcomes and tech stack.");
  }
  if (!resume.profile.url) {
    suggestions.push("Add a portfolio or LinkedIn URL to improve recruiter trust.");
  }

  if (!suggestions.length) {
    suggestions.push("Your resume is already well aligned. Focus on tailoring top bullets to match this job description exactly.");
  }

  return {
    overallScore,
    breakdown: {
      keywordMatch: clamp(keywordScore),
      sectionCompleteness: sectionScore,
      impactMetrics: impactScore,
      readability: readabilityScore,
    },
    matchedKeywords: matchedKeywords.slice(0, 20),
    missingKeywords: missingKeywords.slice(0, 20),
    suggestions,
  };
}
