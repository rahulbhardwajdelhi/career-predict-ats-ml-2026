import { NextResponse } from "next/server";
import { analyzeResumeForAts } from "lib/ats/score-resume";
import type { Resume } from "lib/redux/types";
import { runPythonScript } from "lib/ml/python-runner";
import type { AtsAnalysisResult, AtsModelPrediction } from "lib/ats/types";

export const runtime = "nodejs";

interface AtsScoreRequest {
  resume?: Resume;
  jobDescription?: string;
  modelPath?: string;
}

interface RawPredictionResponse {
  predicted_role: string;
  confidence: number;
  top_probabilities: Array<{ role: string; probability: number }>;
}

const clamp = (value: number) => Math.max(0, Math.min(100, Math.round(value)));

const buildResumeTextForModel = (resume: Resume): string => {
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

  const titles = resume.workExperiences
    .map((exp) => exp.jobTitle)
    .filter(Boolean)
    .join(", ");

  return [
    `Summary: ${resume.profile.summary || ""}`,
    `Target titles: ${titles}`,
    `Skills: ${skills}`,
    `Experience bullets: ${bullets}`,
  ].join("\n");
};

const getMissingSectionLines = (resume: Resume): string[] => {
  const missing: string[] = [];

  if (!resume.profile.summary || resume.profile.summary.trim().length < 60) {
    missing.push("Summary line is weak or missing. Add a 2-3 line impact-oriented summary.");
  }

  if (!resume.projects.length || resume.projects.every((project) => !project.project && project.descriptions.length === 0)) {
    missing.push("Projects section is missing. Add at least 1 project with outcomes and tech stack.");
  }

  const workBullets = resume.workExperiences.flatMap((exp) => exp.descriptions).filter(Boolean);
  if (workBullets.length < 3) {
    missing.push("Experience section has too few bullet points. Add at least 3 role-specific bullets.");
  }

  const quantifiedBullets = workBullets.filter((line) => /\d|%|\$|x|times/i.test(line));
  if (workBullets.length > 0 && quantifiedBullets.length / workBullets.length < 0.4) {
    missing.push("Impact metrics are missing in many bullets. Include numbers like %, time saved, or revenue impact.");
  }

  const hasSkills =
    resume.skills.descriptions.some((item) => item.trim()) ||
    resume.skills.featuredSkills.some((item) => item.skill.trim());
  if (!hasSkills) {
    missing.push("Skills section is missing. Add role-relevant skills that match the job description.");
  }

  if (!resume.profile.url?.trim()) {
    missing.push("Portfolio or LinkedIn URL is missing. Add one for recruiter trust.");
  }

  if (!resume.educations.length || resume.educations.every((edu) => !edu.school && !edu.degree)) {
    missing.push("Education section is incomplete. Add school, degree, and graduation details.");
  }

  return missing;
};

const computeModelRoleAlignment = (
  modelPrediction: AtsModelPrediction,
  jobDescription: string,
  resume: Resume
): number => {
  const jdLower = jobDescription.toLowerCase();
  const predictedRoleLower = modelPrediction.predictedRole.toLowerCase();
  const titleMatch = resume.workExperiences.some((exp) =>
    exp.jobTitle?.toLowerCase().includes(predictedRoleLower)
  );

  let alignment = modelPrediction.confidence * 100;

  if (jdLower.includes(predictedRoleLower)) {
    alignment = Math.max(alignment, 92);
  } else if (titleMatch) {
    alignment = Math.max(alignment, 82);
  } else {
    alignment = alignment * 0.75;
  }

  return clamp(alignment);
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as AtsScoreRequest;
    const jobDescription = body.jobDescription?.trim();
    const resume = body.resume;

    if (!resume) {
      return NextResponse.json({ error: "resume is required." }, { status: 400 });
    }

    if (!jobDescription) {
      return NextResponse.json({ error: "jobDescription is required." }, { status: 400 });
    }

    const baseAnalysis = analyzeResumeForAts(resume, jobDescription);
    const modelPath = body.modelPath?.trim() || "ml/models/resume_role_model.pkl";
    const modelInputText = buildResumeTextForModel(resume);

    const predictionResult = await runPythonScript({
      scriptRelativePath: "ml/predict_resume_role.py",
      args: ["--model", modelPath, "--text-stdin", "--json", "--top-k", "3"],
      input: modelInputText,
      timeoutMs: 60_000,
    });

    if (predictionResult.exitCode !== 0) {
      return NextResponse.json(
        {
          error: "ML prediction failed for ATS scoring.",
          details: predictionResult.stderr.trim() || predictionResult.stdout.trim(),
        },
        { status: 500 }
      );
    }

    let rawPrediction: RawPredictionResponse;
    try {
      rawPrediction = JSON.parse(predictionResult.stdout) as RawPredictionResponse;
    } catch {
      return NextResponse.json(
        {
          error: "ML prediction returned invalid JSON.",
          raw: predictionResult.stdout,
        },
        { status: 500 }
      );
    }

    const modelPrediction: AtsModelPrediction = {
      predictedRole: rawPrediction.predicted_role,
      confidence: rawPrediction.confidence,
      topProbabilities: rawPrediction.top_probabilities,
    };

    const modelRoleAlignment = computeModelRoleAlignment(modelPrediction, jobDescription, resume);
    const blendedOverall = clamp(baseAnalysis.overallScore * 0.7 + modelRoleAlignment * 0.3);

    const missingSectionLines = getMissingSectionLines(resume);
    const suggestions = [...baseAnalysis.suggestions];
    if (missingSectionLines.length) {
      suggestions.push(...missingSectionLines);
    }

    const response: AtsAnalysisResult = {
      ...baseAnalysis,
      overallScore: blendedOverall,
      breakdown: {
        ...baseAnalysis.breakdown,
        modelRoleAlignment,
      },
      suggestions: Array.from(new Set(suggestions)).slice(0, 12),
      missingSectionLines,
      modelPrediction,
    };

    return NextResponse.json(response);
  } catch (error) {
    return NextResponse.json(
      { error: `Failed to compute ATS score: ${(error as Error).message}` },
      { status: 500 }
    );
  }
}