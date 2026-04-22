import { access } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { getProjectRoot, resolvePythonExecutable } from "lib/ml/python-runner";

export const runtime = "nodejs";

const exists = async (filePath: string): Promise<boolean> => {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
};

export async function GET() {
  try {
    const projectRoot = getProjectRoot();
    const pythonExecutable = await resolvePythonExecutable();

    const modelPath = path.join(projectRoot, "ml", "models", "resume_role_model.pkl");
    const predictScriptPath = path.join(projectRoot, "ml", "predict_resume_role.py");
    const trainScriptPath = path.join(projectRoot, "ml", "train_resume_role_model.py");
    const generateScriptPath = path.join(projectRoot, "ml", "generate_complex_dataset.py");

    const checks = {
      pythonExecutable,
      modelReady: await exists(modelPath),
      predictScriptReady: await exists(predictScriptPath),
      trainScriptReady: await exists(trainScriptPath),
      datasetGeneratorReady: await exists(generateScriptPath),
    };

    const ok =
      checks.predictScriptReady &&
      checks.trainScriptReady &&
      checks.datasetGeneratorReady;

    return NextResponse.json(
      {
        ok,
        ...checks,
      },
      { status: ok ? 200 : 503 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: `ML health check failed: ${(error as Error).message}`,
      },
      { status: 500 }
    );
  }
}