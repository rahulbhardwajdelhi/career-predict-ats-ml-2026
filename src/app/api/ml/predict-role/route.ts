import { NextResponse } from "next/server";
import { runPythonScript } from "lib/ml/python-runner";

export const runtime = "nodejs";

const DEFAULT_ML_TIMEOUT_MS = 180_000;

const resolveMlTimeout = (): number => {
  const raw = process.env.ML_PYTHON_TIMEOUT_MS;
  if (!raw) return DEFAULT_ML_TIMEOUT_MS;

  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed < 15_000) {
    return DEFAULT_ML_TIMEOUT_MS;
  }

  return Math.floor(parsed);
};

interface PredictRequest {
  resumeText?: string;
  modelPath?: string;
  topK?: number;
  jobDescription?: string;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as PredictRequest;
    const resumeText = body.resumeText?.trim();

    if (!resumeText) {
      return NextResponse.json(
        { error: "resumeText is required." },
        { status: 400 }
      );
    }

    const modelPath = body.modelPath?.trim() || "ml/models/resume_role_model.pkl";
    const topK = Number.isFinite(body.topK) ? Math.max(1, Number(body.topK)) : 3;
    const timeoutMs = resolveMlTimeout();

    const result = await runPythonScript({
      scriptRelativePath: "ml/predict_resume_role.py",
      args: [
        "--model",
        modelPath,
        "--text-stdin",
        "--json",
        "--top-k",
        String(topK),
        ...(body.jobDescription?.trim() ? ["--job-description", body.jobDescription.trim()] : []),
      ],
      input: resumeText,
      timeoutMs,
    });

    if (result.exitCode !== 0) {
      return NextResponse.json(
        {
          error: "Model prediction failed.",
          details: result.stderr.trim() || result.stdout.trim(),
        },
        { status: 500 }
      );
    }

    try {
      const payload = JSON.parse(result.stdout);
      return NextResponse.json(payload);
    } catch {
      return NextResponse.json(
        {
          error: "Prediction output was not valid JSON.",
          raw: result.stdout,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      { error: `Failed to run prediction: ${(error as Error).message}` },
      { status: 500 }
    );
  }
}