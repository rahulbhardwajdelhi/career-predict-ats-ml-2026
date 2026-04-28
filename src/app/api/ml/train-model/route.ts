import { NextResponse } from "next/server";
import { runPythonScript } from "lib/ml/python-runner";

export const runtime = "nodejs";

interface TrainModelRequest {
  dataPath?: string;
  modelOut?: string;
  includeMongoBackups?: boolean;
  disableRolePriors?: boolean;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as TrainModelRequest;
    const dataPath = body.dataPath?.trim() || "ml/data/complex_resumes.csv";
    const modelOut = body.modelOut?.trim() || "ml/models/resume_role_model.pkl";

    const args = ["--data", dataPath, "--model-out", modelOut];
    if (body.includeMongoBackups) {
      args.push("--include-mongodb-backups");
    }
    if (body.disableRolePriors) {
      args.push("--disable-role-priors");
    }

    const result = await runPythonScript({
      scriptRelativePath: "ml/train_resume_role_model.py",
      args,
      timeoutMs: 10 * 60_000,
    });

    if (result.exitCode !== 0) {
      return NextResponse.json(
        {
          error: "Model training failed.",
          details: result.stderr.trim() || result.stdout.trim(),
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      dataPath,
      modelOut,
      includeMongoBackups: Boolean(body.includeMongoBackups),
      rolePriorsEnabled: false,
      hybridSemanticEnabled: true,
      legacyRolePriorsFlag: Boolean(body.disableRolePriors),
      logs: result.stdout.trim(),
    });
  } catch (error) {
    return NextResponse.json(
      { error: `Failed to train model: ${(error as Error).message}` },
      { status: 500 }
    );
  }
}