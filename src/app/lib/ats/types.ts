export interface AtsScoreBreakdown {
  keywordMatch: number;
  sectionCompleteness: number;
  impactMetrics: number;
  readability: number;
}

export interface AtsAnalysisResult {
  overallScore: number;
  breakdown: AtsScoreBreakdown;
  matchedKeywords: string[];
  missingKeywords: string[];
  suggestions: string[];
}

export interface AtsAiFeedback {
  improvedSummary?: string;
  rewrittenBullets?: string[];
  prioritizedActions: string[];
}
