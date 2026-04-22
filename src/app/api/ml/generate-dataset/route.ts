import { NextResponse } from "next/server";
import { runPythonScript } from "lib/ml/python-runner";

export const runtime = "nodejs";

interface GenerateDatasetRequest {
  outputPath?: string;
  samplesPerRole?: number;
  seed?: number;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as GenerateDatasetRequest;
    const outputPath = body.outputPath?.trim() || "ml/data/complex_resumes.csv";
    const samplesPerRole = Number.isFinite(body.samplesPerRole)
      ? Math.max(1, Number(body.samplesPerRole))
      : 350;
    const seed = Number.isFinite(body.seed) ? Number(body.seed) : 42;

    const result = await runPythonScript({
      scriptRelativePath: "ml/generate_complex_dataset.py",
      args: [
        "--out",
        outputPath,
        "--samples-per-role",
        String(samplesPerRole),
        "--seed",
        String(seed),
      ],
      timeoutMs: 120_000,
    });

    if (result.exitCode !== 0) {
      return NextResponse.json(
        {
          error: "Dataset generation failed.",
          details: result.stderr.trim() || result.stdout.trim(),
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      outputPath,
      samplesPerRole,
      seed,
      logs: result.stdout.trim(),
    });
  } catch (error) {
    return NextResponse.json(
      { error: `Failed to generate dataset: ${(error as Error).message}` },
      { status: 500 }
    );
  }
}