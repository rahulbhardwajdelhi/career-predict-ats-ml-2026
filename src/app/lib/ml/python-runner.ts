import { spawn } from "node:child_process";
import { access } from "node:fs/promises";
import path from "node:path";

interface RunPythonScriptOptions {
  scriptRelativePath: string;
  args?: string[];
  input?: string;
  timeoutMs?: number;
}

interface RunPythonScriptResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

const DEFAULT_TIMEOUT_MS = 5 * 60 * 1000;

const fileExists = async (filePath: string): Promise<boolean> => {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
};

export const getProjectRoot = () => process.cwd();

export const resolvePythonExecutable = async (): Promise<string> => {
  if (process.env.PYTHON_EXECUTABLE?.trim()) {
    return process.env.PYTHON_EXECUTABLE.trim();
  }

  const projectRoot = getProjectRoot();
  const windowsVenvPython = path.join(projectRoot, ".venv", "Scripts", "python.exe");
  const unixVenvPython = path.join(projectRoot, ".venv", "bin", "python");

  if (await fileExists(windowsVenvPython)) {
    return windowsVenvPython;
  }
  if (await fileExists(unixVenvPython)) {
    return unixVenvPython;
  }

  return "python";
};

export const runPythonScript = async (
  options: RunPythonScriptOptions
): Promise<RunPythonScriptResult> => {
  const {
    scriptRelativePath,
    args = [],
    input,
    timeoutMs = DEFAULT_TIMEOUT_MS,
  } = options;

  const projectRoot = getProjectRoot();
  const pythonExecutable = await resolvePythonExecutable();
  const absoluteScriptPath = path.join(projectRoot, scriptRelativePath);

  return new Promise<RunPythonScriptResult>((resolve, reject) => {
    const child = spawn(pythonExecutable, [absoluteScriptPath, ...args], {
      cwd: projectRoot,
      env: process.env,
      stdio: "pipe",
    });

    let stdout = "";
    let stderr = "";
    let settled = false;

    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      child.kill();
      reject(new Error(`Python process timed out after ${timeoutMs} ms`));
    }, timeoutMs);

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("error", (error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      reject(error);
    });

    child.on("close", (code) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve({
        stdout,
        stderr,
        exitCode: code ?? 1,
      });
    });

    if (typeof input === "string") {
      child.stdin.write(input);
    }
    child.stdin.end();
  });
};