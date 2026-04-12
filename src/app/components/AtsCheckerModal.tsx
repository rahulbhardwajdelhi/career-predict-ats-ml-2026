"use client";

import { useMemo, useState } from "react";
import type { Resume } from "lib/redux/types";
import { analyzeResumeForAts } from "lib/ats/score-resume";
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
  const [loadingAi, setLoadingAi] = useState(false);
  const [aiFeedback, setAiFeedback] = useState<AtsAiFeedback | null>(null);
  const [error, setError] = useState<string | null>(null);

  const resumeSnapshot = useMemo(() => toResumeSnapshot(resume), [resume]);

  if (!isOpen) {
    return null;
  }

  const runLocalAnalysis = () => {
    const trimmed = jobDescription.trim();
    if (!trimmed) {
      setError("Please paste a job description first.");
      return;
    }

    setError(null);
    setAiFeedback(null);
    setAnalysis(analyzeResumeForAts(resume, trimmed));
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
            <button onClick={runLocalAnalysis} className="btn-primary">Run ATS Check</button>
            <button onClick={runAiFeedback} className="btn-secondary" disabled={!analysis || loadingAi}>
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
