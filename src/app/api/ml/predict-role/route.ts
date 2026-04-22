import { NextResponse } from "next/server";
import { runPythonScript } from "lib/ml/python-runner";

export const runtime = "nodejs";

interface PredictRequest {
  resumeText?: string;
  modelPath?: string;
  topK?: number;
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

    const result = await runPythonScript({
      scriptRelativePath: "ml/predict_resume_role.py",
      args: ["--model", modelPath, "--text-stdin", "--json", "--top-k", String(topK)],
      input: resumeText,
      timeoutMs: 60_000,
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