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

const SKILL_DICTIONARY = [
  "python",
  "java",
  "javascript",
  "typescript",
  "react",
  "next.js",
  "node.js",
  "sql",
  "postgresql",
  "mongodb",
  "redis",
  "docker",
  "kubernetes",
  "aws",
  "tensorflow",
  "pytorch",
  "machine learning",
  "deep learning",
  "nlp",
  "feature engineering",
  "data analysis",
  "tableau",
  "power bi",
  "excel",
  "rest api",
  "graphql",
  "microservices",
  "system design",
  "ci/cd",
  "linux",
  "tailwind",
  "redux",
  "testing",
  "selenium",
  "cypress",
  "figma",
  "user research",
  "wireframing",
];

const INTERNSHIP_COMPANY_ROLE_BOOSTS: Record<string, string[]> = {
  google: ["Machine Learning Engineer", "Data Scientist", "Backend Developer", "Frontend Developer"],
  microsoft: ["Backend Developer", "Frontend Developer", "Data Scientist"],
  amazon: ["Backend Developer", "DevOps Engineer", "Data Scientist"],
  meta: ["Frontend Developer", "Backend Developer", "Data Scientist"],
  apple: ["Backend Developer", "Frontend Developer", "Machine Learning Engineer"],
  netflix: ["Backend Developer", "DevOps Engineer", "Machine Learning Engineer"],
  uber: ["Backend Developer", "Data Scientist", "Machine Learning Engineer"],
  airbnb: ["Backend Developer", "Frontend Developer", "Data Scientist"],
  adobe: ["Frontend Developer", "UI UX Designer", "Backend Developer"],
  salesforce: ["Backend Developer", "Java Developer", "Product Manager"],
};

interface ProjectDomainConfig {
  triggerKeywords: string[];
  prioritySkills: string[];
  priorityProjectKeywords: string[];
}

const PROJECT_DOMAIN_DATABASE: ProjectDomainConfig[] = [
  {
    triggerKeywords: ["backend", "api", "microservice", "system", "distributed", "database"],
    prioritySkills: ["node.js", "postgresql", "redis", "docker", "kubernetes", "system design"],
    priorityProjectKeywords: ["scalability", "throughput", "availability", "api gateway", "caching"],
  },
  {
    triggerKeywords: ["frontend", "ui", "ux", "web", "react", "next.js"],
    prioritySkills: ["react", "next.js", "typescript", "tailwind", "redux", "accessibility"],
    priorityProjectKeywords: ["responsive", "lighthouse", "web vitals", "accessibility", "design system"],
  },
  {
    triggerKeywords: ["data", "analytics", "bi", "dashboard"],
    prioritySkills: ["sql", "python", "tableau", "power bi", "excel", "data analysis"],
    priorityProjectKeywords: ["dashboard", "kpi", "forecasting", "cohort", "segmentation"],
  },
  {
    triggerKeywords: ["ml", "machine learning", "model", "nlp", "ai", "inference"],
    prioritySkills: ["python", "machine learning", "tensorflow", "pytorch", "feature engineering", "nlp"],
    priorityProjectKeywords: ["inference", "model drift", "feature store", "a/b testing", "recommendation"],
  },
  {
    triggerKeywords: ["devops", "cloud", "deployment", "infrastructure", "ci/cd", "sre"],
    prioritySkills: ["aws", "docker", "kubernetes", "ci/cd", "linux", "terraform"],
    priorityProjectKeywords: ["observability", "incident", "uptime", "automation", "release"],
  },
];

const STRATEGIC_KEYWORD_DICTIONARY = [
  "latency reduction",
  "time lag reduction",
  "lead time reduction",
  "throughput improvement",
  "cost optimization",
  "incident reduction",
  "reliability improvement",
  "conversion improvement",
  "accuracy improvement",
  "automation impact",
];

const STRATEGIC_PATTERNS: Array<{ keyword: string; regex: RegExp }> = [
  { keyword: "latency reduction", regex: /(reduce|reduced|lower|lowered).*(latency|response time)|(latency|response time).*(reduce|reduced)/i },
  { keyword: "time lag reduction", regex: /(reduce|reduced).*(delay|lag)|(delay|lag).*(reduce|reduced)/i },
  { keyword: "lead time reduction", regex: /(reduce|reduced).*(lead time)|(lead time).*(reduce|reduced)/i },
  { keyword: "throughput improvement", regex: /(increase|improved|improve|boosted).*(throughput)|(throughput).*(increase|improved)/i },
  { keyword: "cost optimization", regex: /(reduce|reduced|saved).*(cost|cloud spend|budget)|(cost).*(optimi[sz]e|reduce)/i },
  { keyword: "incident reduction", regex: /(reduce|reduced).*(incident|outage)|(incident|outage).*(reduce|reduced)/i },
  { keyword: "reliability improvement", regex: /(improve|improved|increase|increased).*(reliability|uptime)|(reliability|uptime).*(improve|improved)/i },
  { keyword: "conversion improvement", regex: /(increase|improved|improve).*(conversion|ctr)|(conversion|ctr).*(increase|improved)/i },
  { keyword: "accuracy improvement", regex: /(increase|improved|improve).*(accuracy|precision|recall)|(accuracy|precision|recall).*(improve|improved)/i },
  { keyword: "automation impact", regex: /(automate|automated|automation).*(time saved|hours|efficiency)|(time saved|efficiency).*(automate|automation)/i },
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
    .map((word) => word.replace(/^[.#\-]+|[.#\-]+$/g, ""))
    .filter((word) => word.length > 2 && !STOP_WORDS.has(word));
  return words;
}

function toTokenSet(text: string): Set<string> {
  return new Set(tokenize(text));
}

function documentFrequency(corpusTokens: Array<Set<string>>, termTokens: string[]): number {
  return corpusTokens.filter((tokenSet) => termTokens.some((token) => tokenSet.has(token))).length;
}

function tfIdfSkillScore(skill: string, textTokens: string[], corpusTokens: Array<Set<string>>): number {
  const termTokens = tokenize(skill);
  if (!termTokens.length || !textTokens.length) return 0;

  const tf = termTokens.reduce((acc, token) => {
    const count = textTokens.filter((candidate) => candidate === token).length;
    return acc + count;
  }, 0) / textTokens.length;

  const df = Math.max(1, documentFrequency(corpusTokens, termTokens));
  const idf = Math.log((corpusTokens.length + 1) / df) + 1;
  return tf * idf;
}

function extractSkillsWithDictionary(text: string, corpus: string[]): string[] {
  const normalizedText = normalize(text);
  const textTokens = tokenize(text);
  const corpusTokens = corpus.map((doc) => toTokenSet(doc));

  const scoredSkills = SKILL_DICTIONARY.map((skill) => {
    const inText = normalizedText.includes(normalize(skill));
    const score = tfIdfSkillScore(skill, textTokens, corpusTokens);
    return {
      skill,
      score: inText ? score + 0.15 : score,
      inText,
    };
  })
    .filter((item) => item.inText || item.score >= 0.05)
    .sort((a, b) => b.score - a.score)
    .slice(0, 25)
    .map((item) => item.skill);

  return Array.from(new Set(scoredSkills));
}

function inferProjectDomainPrioritySkills(jobDescription: string): { skills: string[]; projectKeywords: string[] } {
  const jdLower = normalize(jobDescription);
  const jdTokens = toTokenSet(jobDescription);

  const hasTrigger = (triggerKeyword: string): boolean => {
    const normalized = normalize(triggerKeyword);
    if (normalized.includes(" ")) {
      return jdLower.includes(normalized);
    }
    return jdTokens.has(normalized);
  };

  const matchedConfigs = PROJECT_DOMAIN_DATABASE.filter((config) =>
    config.triggerKeywords.some((keyword) => hasTrigger(keyword))
  );

  const skills = matchedConfigs.flatMap((config) => config.prioritySkills);
  const projectKeywords = matchedConfigs.flatMap((config) => config.priorityProjectKeywords);

  return {
    skills: Array.from(new Set(skills)),
    projectKeywords: Array.from(new Set(projectKeywords)),
  };
}

function getInternshipBoostHints(resume: Resume): string[] {
  const internshipCompanies = resume.workExperiences
    .filter((exp) => /intern/i.test(exp.jobTitle || ""))
    .map((exp) => normalize(exp.company));

  const boosts = internshipCompanies.flatMap((company) => {
    const matched = Object.entries(INTERNSHIP_COMPANY_ROLE_BOOSTS).find(([brand]) =>
      company.includes(brand)
    );
    return matched ? matched[1] : [];
  });

  return Array.from(new Set(boosts));
}

function detectStrategicSignals(resume: Resume): string[] {
  const lines = [
    ...resume.workExperiences.flatMap((exp) => exp.descriptions),
    ...resume.projects.flatMap((project) => project.descriptions),
  ].filter(Boolean);

  const matched = STRATEGIC_PATTERNS.filter((item) =>
    lines.some((line) => item.regex.test(line))
  ).map((item) => item.keyword);

  return Array.from(new Set(matched));
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

  const jdSkillMatches = extractSkillsWithDictionary(jobDescription, [jobDescription, resumeText]);
  const resumeSkillMatches = extractSkillsWithDictionary(resumeText, [jobDescription, resumeText]);

  const { skills: projectPrioritySkills, projectKeywords: projectPriorityKeywords } =
    inferProjectDomainPrioritySkills(jobDescription);

  const strategicSignals = detectStrategicSignals(resume);
  const strategicMissing = STRATEGIC_KEYWORD_DICTIONARY.filter(
    (keyword) => !strategicSignals.includes(keyword)
  );

  const internshipBoostHints = getInternshipBoostHints(resume);

  const matchedKeywords = keywords.filter((keyword) => resumeText.includes(normalize(keyword)));
  const missingKeywords = keywords.filter((keyword) => !resumeText.includes(normalize(keyword)));

  const skillMatched = jdSkillMatches.filter((skill) =>
    resumeSkillMatches.some((resumeSkill) => normalize(resumeSkill) === normalize(skill))
  );
  const skillMissingFromResume = jdSkillMatches.filter(
    (skill) => !resumeSkillMatches.some((resumeSkill) => normalize(resumeSkill) === normalize(skill))
  );

  const prioritySkillMissing = projectPrioritySkills.filter(
    (skill) => !resumeText.includes(normalize(skill))
  );

  const priorityProjectKeywordMissing = projectPriorityKeywords.filter(
    (keyword) => !resumeText.includes(normalize(keyword))
  );

  const keywordPoolSize = Math.max(1, keywords.length + jdSkillMatches.length);
  const keywordSignal = matchedKeywords.length + skillMatched.length;
  const keywordScore = (keywordSignal / keywordPoolSize) * 100;
  const sectionScore = scoreSectionCompleteness(resume);
  const impactScore = scoreImpactMetrics(resume);
  const readabilityScore = scoreReadability(resume);

  const strategicBonus = strategicSignals.length >= 3 ? 6 : strategicSignals.length >= 1 ? 3 : 0;
  const adjustedImpact = clamp(impactScore + strategicBonus);

  const internshipBonus = internshipBoostHints.length > 0 ? 4 : 0;
  const adjustedSection = clamp(sectionScore + internshipBonus);

  const overallScore = clamp(
    keywordScore * 0.4 +
      adjustedSection * 0.2 +
      adjustedImpact * 0.25 +
      readabilityScore * 0.15,
  );

  const suggestions: string[] = [];

  if (missingKeywords.length > 0 || skillMissingFromResume.length > 0) {
    const missingSkillText = skillMissingFromResume.slice(0, 8).join(", ");
    const missingKeywordText = missingKeywords.slice(0, 8).join(", ");
    const combined = [missingSkillText, missingKeywordText].filter(Boolean).join(", ");
    suggestions.push(`Add these job-specific skills/keywords where truthful: ${combined}.`);
  }
  if (adjustedImpact < 65) {
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

  if (prioritySkillMissing.length > 0) {
    suggestions.push(
      `High-priority skills for this job track that are missing: ${prioritySkillMissing.slice(0, 8).join(", ")}.`
    );
  }

  if (priorityProjectKeywordMissing.length > 0) {
    suggestions.push(
      `Project keywords to include in resume bullets: ${priorityProjectKeywordMissing.slice(0, 8).join(", ")}.`
    );
  }

  if (internshipBoostHints.length > 0) {
    suggestions.push(
      `Your internship brand signal can support higher role trajectory: ${internshipBoostHints.slice(0, 4).join(", ")}.`
    );
  }

  if (strategicMissing.length > 0) {
    suggestions.push(
      `Add strategic impact language in bullets (examples): ${strategicMissing.slice(0, 5).join(", ")}.`
    );
  }

  if (!suggestions.length) {
    suggestions.push("Your resume is already well aligned. Focus on tailoring top bullets to match this job description exactly.");
  }

  return {
    overallScore,
    breakdown: {
      keywordMatch: clamp(keywordScore),
      sectionCompleteness: adjustedSection,
      impactMetrics: adjustedImpact,
      readability: readabilityScore,
    },
    matchedKeywords: Array.from(new Set([...matchedKeywords, ...skillMatched])).slice(0, 20),
    missingKeywords: Array.from(new Set([...missingKeywords, ...skillMissingFromResume, ...prioritySkillMissing])).slice(0, 20),
    suggestions,
  };
}
