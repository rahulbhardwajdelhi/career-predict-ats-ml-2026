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

export interface AtsModelPrediction {
  predictedRole: string;
  confidence: number;
  topProbabilities: AtsRoleProbability[];
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
