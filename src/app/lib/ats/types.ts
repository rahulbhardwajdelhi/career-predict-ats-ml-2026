export interface AtsScoreBreakdown {
  keywordMatch: number;
  sectionCompleteness: number;
  impactMetrics: number;
  readability: number;
  modelRoleAlignment?: number;
}

export interface AtsRoleProbability {
  role: string;
  probability: number;
}

export interface AtsRankedRole {
  role: string;
  hybrid_score: number;
  lexical_probability: number;
  semantic_role_similarity: number;
  skill_coverage: number;
  matched_role_skills: string[];
}

export interface AtsModelExplainability {
  top_lexical_signals: Array<{ term: string; score: number }>;
  matched_skills: string[];
  missing_core_role_skills: string[];
}

export interface AtsJobMatch {
  similarity_to_job_description: number;
  matched_job_skills: string[];
  missing_job_skills: string[];
  coverage_ratio: number;
}

export interface AtsModelPrediction {
  predictedRole: string;
  confidence: number;
  topProbabilities: AtsRoleProbability[];
  topRankedRoles?: AtsRankedRole[];
  explainability?: AtsModelExplainability;
  skillProfile?: {
    detected_skills: string[];
    normalized_tokens_preview: string[];
  };
  jobMatch?: AtsJobMatch | null;
}

export interface AtsAnalysisResult {
  overallScore: number;
  breakdown: AtsScoreBreakdown;
  matchedKeywords: string[];
  missingKeywords: string[];
  suggestions: string[];
  missingSectionLines?: string[];
  modelPrediction?: AtsModelPrediction;
}

export interface AtsAiFeedback {
  improvedSummary?: string;
  rewrittenBullets?: string[];
  prioritizedActions: string[];
}
