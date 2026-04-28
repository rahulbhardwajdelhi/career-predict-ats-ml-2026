"use client";

import { useMemo, useState } from "react";
import type { Resume } from "lib/redux/types";
import type { AtsAiFeedback, AtsAnalysisResult } from "lib/ats/types";
import { XMarkIcon } from "@heroicons/react/24/outline";

interface AtsCheckerModalProps {
  isOpen: boolean;
  onClose: () => void;
  resume: Resume;
}

function scoreColor(score: number): string {
  if (score >= 80) return "bg-green-500";
  if (score >= 60) return "bg-yellow-500";
  return "bg-red-500";
}

function toResumeSnapshot(resume: Resume): string {
  const skills = [
    ...resume.skills.descriptions,
    ...resume.skills.featuredSkills.map((item) => item.skill),
  ]
    .filter(Boolean)
    .join(", ");

  const bullets = [
    ...resume.workExperiences.flatMap((exp) => exp.descriptions),
    ...resume.projects.flatMap((project) => project.descriptions),
  ]
    .filter(Boolean)
    .join(" | ");

  return [
    `Name: ${resume.profile.name}`,
    `Summary: ${resume.profile.summary}`,
    `Target titles: ${resume.workExperiences.map((exp) => exp.jobTitle).filter(Boolean).join(", ")}`,
    `Skills: ${skills}`,
    `Experience bullets: ${bullets}`,
  ].join("\n");
}

export const AtsCheckerModal = ({ isOpen, onClose, resume }: AtsCheckerModalProps) => {
  const [jobDescription, setJobDescription] = useState("");
  const [analysis, setAnalysis] = useState<AtsAnalysisResult | null>(null);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [loadingAi, setLoadingAi] = useState(false);
  const [aiFeedback, setAiFeedback] = useState<AtsAiFeedback | null>(null);
  const [error, setError] = useState<string | null>(null);

  const resumeSnapshot = useMemo(() => toResumeSnapshot(resume), [resume]);

  if (!isOpen) {
    return null;
  }

  const runLocalAnalysis = async () => {
    const trimmed = jobDescription.trim();
    if (!trimmed) {
      setError("Please paste a job description first.");
      return;
    }

    setLoadingAnalysis(true);
    setError(null);
    setAiFeedback(null);

    try {
      const response = await fetch("/api/ml/ats-score", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          resume,
          jobDescription: trimmed,
        }),
      });

      const data = (await response.json()) as AtsAnalysisResult & { error?: string };

      if (!response.ok) {
        throw new Error(data.error || "Failed to compute ATS score.");
      }

      setAnalysis(data);

      // Backup every ATS-checked resume in MongoDB under tester account by default.
      await fetch("/api/resume-backups/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          resume,
          jobDescription: trimmed,
          atsAnalysis: data,
          accountRole: "tester",
          accountId: "tester@career-predict.local",
        }),
      });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoadingAnalysis(false);
    }
  };

  const runAiFeedback = async () => {
    if (!analysis) {
      setError("Run local ATS analysis first.");
      return;
    }

    setLoadingAi(true);
    setError(null);

    try {
      const response = await fetch("/api/ats-feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jobDescription,
          resumeSnapshot,
          localSuggestions: analysis.suggestions,
        }),
      });

      const data = (await response.json()) as AtsAiFeedback & { error?: string };

      if (!response.ok) {
        throw new Error(data.error || "Failed to get AI feedback.");
      }

      setAiFeedback(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoadingAi(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 backdrop-blur-sm flex justify-center items-center z-50 transition-all duration-300 animate-fade-in">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-5xl w-full max-h-[90vh] flex flex-col border border-gray-200 dark:border-gray-700 transition-all duration-300 animate-slide-up transform">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-blue-violet-700 dark:text-blue-violet-300">ATS Score Checker</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 focus:outline-none"
            aria-label="Close"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 overflow-auto flex-grow space-y-5">
          <div>
            <label className="form-label">Job Description</label>
            <textarea
              className="form-textarea min-h-[180px]"
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the full job description here for ATS matching..."
            />
          </div>

          <div className="flex flex-wrap gap-3">
            <button onClick={runLocalAnalysis} className="btn-primary" disabled={loadingAnalysis}>
              {loadingAnalysis ? "Running ATS Check..." : "Run ATS Check"}
            </button>
            <button onClick={runAiFeedback} className="btn-secondary" disabled={!analysis || loadingAi || loadingAnalysis}>
              {loadingAi ? "Generating AI Improvements..." : "Get AI Rewrite Suggestions"}
            </button>
          </div>

          {error ? <p className="text-red-600 dark:text-red-400 text-sm">{error}</p> : null}

          {analysis ? (
            <div className="space-y-5">
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-900/30">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Overall ATS Score</p>
                <div className="flex items-center gap-3">
                  <p className="text-3xl font-bold text-blue-violet-700 dark:text-blue-violet-300">{analysis.overallScore}/100</p>
                  <div className="w-full h-3 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                    <div className={`h-full ${scoreColor(analysis.overallScore)}`} style={{ width: `${analysis.overallScore}%` }} />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(analysis.breakdown).map(([key, value]) => (
                  <div key={key} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-300 capitalize">{key}</p>
                    <p className="text-xl font-semibold text-blue-violet-700 dark:text-blue-violet-300">{value}/100</p>
                  </div>
                ))}
              </div>

              {analysis.modelPrediction ? (
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-violet-700 dark:text-blue-violet-300 mb-2">Model Role Prediction</h3>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    Predicted role: <span className="font-semibold">{analysis.modelPrediction.predictedRole}</span>
                  </p>
                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                    Confidence: <span className="font-semibold">{(analysis.modelPrediction.confidence * 100).toFixed(1)}%</span>
                  </p>
                  <ul className="list-disc pl-5 text-sm text-gray-700 dark:text-gray-300 space-y-1">
                    {analysis.modelPrediction.topProbabilities.map((item) => (
                      <li key={item.role}>{item.role}: {(item.probability * 100).toFixed(1)}%</li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {analysis.modelPrediction?.jobMatch ? (
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-900/30">
                  <h3 className="font-semibold text-blue-violet-700 dark:text-blue-violet-300 mb-2">Job Match</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-700 dark:text-gray-300 mb-3">
                    <p>
                      Similarity: <span className="font-semibold">{(analysis.modelPrediction.jobMatch.similarity_to_job_description * 100).toFixed(1)}%</span>
                    </p>
                    <p>
                      Coverage: <span className="font-semibold">{(analysis.modelPrediction.jobMatch.coverage_ratio * 100).toFixed(1)}%</span>
                    </p>
                  </div>
                  <div className="space-y-3 text-sm">
                    <div>
                      <p className="font-medium text-gray-600 dark:text-gray-300 mb-1">Matched job skills</p>
                      <div className="flex flex-wrap gap-2">
                        {analysis.modelPrediction.jobMatch.matched_job_skills.length ? (
                          analysis.modelPrediction.jobMatch.matched_job_skills.map((skill) => (
                            <span key={skill} className="badge-success">{skill}</span>
                          ))
                        ) : (
                          <span className="text-gray-500">No strong skill overlap detected yet</span>
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="font-medium text-gray-600 dark:text-gray-300 mb-1">Missing job skills</p>
                      <div className="flex flex-wrap gap-2">
                        {analysis.modelPrediction.jobMatch.missing_job_skills.length ? (
                          analysis.modelPrediction.jobMatch.missing_job_skills.map((skill) => (
                            <span key={skill} className="badge-error">{skill}</span>
                          ))
                        ) : (
                          <span className="text-gray-500">No major gaps detected</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}

              {analysis.modelPrediction?.topRankedRoles?.length ? (
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-violet-700 dark:text-blue-violet-300 mb-2">Role Ranking</h3>
                  <div className="space-y-3">
                    {analysis.modelPrediction.topRankedRoles.map((item, index) => (
                      <div key={`${item.role}-${index}`} className="rounded-md border border-gray-200 dark:border-gray-700 p-3">
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                          <p className="font-medium text-gray-800 dark:text-gray-100">{index + 1}. {item.role}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-300">Hybrid score: <span className="font-semibold">{(item.hybrid_score * 100).toFixed(1)}%</span></p>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm text-gray-600 dark:text-gray-300">
                          <p>Lexical: {(item.lexical_probability * 100).toFixed(1)}%</p>
                          <p>Semantic: {(item.semantic_role_similarity * 100).toFixed(1)}%</p>
                          <p>Skill coverage: {(item.skill_coverage * 100).toFixed(1)}%</p>
                        </div>
                        {item.matched_role_skills.length ? (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {item.matched_role_skills.map((skill) => (
                              <span key={skill} className="badge-success">{skill}</span>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {analysis.modelPrediction?.explainability ? (
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-violet-700 dark:text-blue-violet-300 mb-2">Why This Role</h3>
                  <div className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
                    <div>
                      <p className="font-medium text-gray-600 dark:text-gray-300 mb-1">Matched skills</p>
                      <div className="flex flex-wrap gap-2">
                        {analysis.modelPrediction.explainability.matched_skills.length ? (
                          analysis.modelPrediction.explainability.matched_skills.map((skill) => (
                            <span key={skill} className="badge-success">{skill}</span>
                          ))
                        ) : (
                          <span className="text-gray-500">No explicit core skills matched yet</span>
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="font-medium text-gray-600 dark:text-gray-300 mb-1">Missing core role skills</p>
                      <div className="flex flex-wrap gap-2">
                        {analysis.modelPrediction.explainability.missing_core_role_skills.length ? (
                          analysis.modelPrediction.explainability.missing_core_role_skills.map((skill) => (
                            <span key={skill} className="badge-error">{skill}</span>
                          ))
                        ) : (
                          <span className="text-gray-500">No missing skills to highlight</span>
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="font-medium text-gray-600 dark:text-gray-300 mb-1">Top lexical signals</p>
                      <ul className="list-disc pl-5 space-y-1">
                        {analysis.modelPrediction.explainability.top_lexical_signals.length ? (
                          analysis.modelPrediction.explainability.top_lexical_signals.map((item) => (
                            <li key={item.term}>{item.term}: {item.score.toFixed(4)}</li>
                          ))
                        ) : (
                          <li className="list-none text-gray-500 pl-0">No lexical highlights available</li>
                        )}
                      </ul>
                    </div>
                    {analysis.modelPrediction.skillProfile?.detected_skills?.length ? (
                      <div>
                        <p className="font-medium text-gray-600 dark:text-gray-300 mb-1">Detected resume skills</p>
                        <div className="flex flex-wrap gap-2">
                          {analysis.modelPrediction.skillProfile.detected_skills.map((skill) => (
                            <span key={skill} className="badge-success">{skill}</span>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
              ) : null}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <h3 className="font-semibold text-green-700 dark:text-green-400 mb-2">Matched Keywords</h3>
                  <div className="flex flex-wrap gap-2">
                    {analysis.matchedKeywords.length ? analysis.matchedKeywords.map((item) => (
                      <span key={item} className="badge-success">{item}</span>
                    )) : <span className="text-sm text-gray-500">None found yet</span>}
                  </div>
                </div>

                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <h3 className="font-semibold text-red-700 dark:text-red-400 mb-2">Missing Keywords</h3>
                  <div className="flex flex-wrap gap-2">
                    {analysis.missingKeywords.length ? analysis.missingKeywords.map((item) => (
                      <span key={item} className="badge-error">{item}</span>
                    )) : <span className="text-sm text-gray-500">No important gaps detected</span>}
                  </div>
                </div>
              </div>

              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <h3 className="font-semibold text-blue-violet-700 dark:text-blue-violet-300 mb-2">What To Improve</h3>
                <ul className="list-disc pl-5 space-y-2 text-sm text-gray-700 dark:text-gray-300">
                  {analysis.suggestions.map((suggestion, index) => (
                    <li key={index}>{suggestion}</li>
                  ))}
                </ul>
              </div>

              {analysis.missingSectionLines?.length ? (
                <div className="border border-red-200 dark:border-red-700 rounded-lg p-4 bg-red-50/40 dark:bg-red-900/10">
                  <h3 className="font-semibold text-red-700 dark:text-red-400 mb-2">Missing Sections / Weak Lines</h3>
                  <ul className="list-disc pl-5 space-y-1 text-sm text-gray-700 dark:text-gray-300">
                    {analysis.missingSectionLines.map((line, index) => (
                      <li key={index}>{line}</li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {aiFeedback ? (
                <div className="border border-blue-violet-200 dark:border-blue-violet-700 rounded-lg p-4 bg-blue-violet-50/50 dark:bg-blue-violet-900/10 space-y-3">
                  <h3 className="font-semibold text-blue-violet-700 dark:text-blue-violet-300">AI Improvement Suggestions</h3>

                  {aiFeedback.prioritizedActions?.length ? (
                    <div>
                      <p className="text-sm font-medium mb-1">Prioritized Actions</p>
                      <ul className="list-disc pl-5 text-sm text-gray-700 dark:text-gray-300 space-y-1">
                        {aiFeedback.prioritizedActions.map((action, index) => (
                          <li key={index}>{action}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}

                  {aiFeedback.improvedSummary ? (
                    <div>
                      <p className="text-sm font-medium mb-1">Suggested Summary</p>
                      <p className="text-sm text-gray-700 dark:text-gray-300">{aiFeedback.improvedSummary}</p>
                    </div>
                  ) : null}

                  {aiFeedback.rewrittenBullets?.length ? (
                    <div>
                      <p className="text-sm font-medium mb-1">Suggested Bullet Rewrites</p>
                      <ul className="list-disc pl-5 text-sm text-gray-700 dark:text-gray-300 space-y-1">
                        {aiFeedback.rewrittenBullets.map((bullet, index) => (
                          <li key={index}>{bullet}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
