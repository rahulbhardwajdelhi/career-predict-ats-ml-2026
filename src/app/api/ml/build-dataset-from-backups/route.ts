import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { getCollection } from "lib/db/mongodb";
import type { Resume } from "lib/redux/types";

export const runtime = "nodejs";

interface BuildDatasetRequest {
  outputPath?: string;
  accountId?: string;
  minConfidence?: number;
  includeOnlySelected?: boolean;
}

interface BackupDoc {
  accountId: string;
  labelRole?: string;
  predictedRole?: string;
  modelConfidence?: number;
  selected?: boolean;
  callbacksFromCompany?: number;
  jobDescription?: string;
  resume: Resume;
}

const csvEscape = (value: string | number | boolean | null | undefined): string => {
  const raw = String(value ?? "");
  if (/[",\n]/.test(raw)) {
    return `"${raw.replace(/"/g, '""')}"`;
  }
  return raw;
};

const resumeToText = (resume: Resume): string => {
  const profile = Object.values(resume.profile).join(" ");
  const work = resume.workExperiences
    .flatMap((exp) => [exp.company, exp.jobTitle, exp.date, ...exp.descriptions])
    .join(" ");
  const education = resume.educations
    .flatMap((edu) => [edu.school, edu.degree, edu.date, edu.gpa, ...edu.descriptions])
    .join(" ");
  const projects = resume.projects
    .flatMap((project) => [project.project, project.date, ...project.descriptions])
    .join(" ");
  const skills = [
    ...resume.skills.descriptions,
    ...resume.skills.featuredSkills.map((item) => item.skill),
  ].join(" ");

  return [profile, work, education, projects, skills].join(" ").replace(/\s+/g, " ").trim();
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as BuildDatasetRequest;
    const outputPath = body.outputPath?.trim() || "ml/data/mongodb_resumes.csv";
    const minConfidence = Number.isFinite(body.minConfidence)
      ? Math.max(0, Math.min(1, Number(body.minConfidence)))
      : 0.5;
    const includeOnlySelected = Boolean(body.includeOnlySelected);

    const collection = await getCollection<BackupDoc>("resume_backups");

    const query: Record<string, unknown> = {};
    if (body.accountId?.trim()) {
      query.accountId = body.accountId.trim();
    }

    const docs = await collection.find(query).toArray();

    const rows = docs
      .filter((doc) => !!doc.resume)
      .filter((doc) => (includeOnlySelected ? Boolean(doc.selected) : true))
      .filter((doc) => (doc.modelConfidence ?? 0) >= minConfidence)
      .map((doc) => {
        const role = (doc.labelRole || doc.predictedRole || "").trim();
        if (!role) return null;

        const resumeText = resumeToText(doc.resume);
        const resumeKeywords = [
          ...doc.resume.skills.descriptions,
          ...doc.resume.skills.featuredSkills.map((item) => item.skill),
        ]
          .filter(Boolean)
          .join(", ");

        return {
          role,
          resume_text: resumeText,
          job_description: doc.jobDescription || "",
          resume_keywords: resumeKeywords,
          is_selected: doc.selected ? 1 : 0,
          callbacks_from_company: Math.max(0, Number(doc.callbacksFromCompany || 0)),
        };
      })
      .filter((row): row is NonNullable<typeof row> => row !== null);

    if (!rows.length) {
      return NextResponse.json(
        {
          success: false,
          message: "No eligible backup rows found to build dataset.",
        },
        { status: 400 }
      );
    }

    const headers = [
      "role",
      "resume_text",
      "job_description",
      "resume_keywords",
      "is_selected",
      "callbacks_from_company",
    ];

    const csv = [
      headers.join(","),
      ...rows.map((row) =>
        [
          csvEscape(row.role),
          csvEscape(row.resume_text),
          csvEscape(row.job_description),
          csvEscape(row.resume_keywords),
          csvEscape(row.is_selected),
          csvEscape(row.callbacks_from_company),
        ].join(",")
      ),
    ].join("\n");

    const absoluteOutputPath = path.join(process.cwd(), outputPath);
    await mkdir(path.dirname(absoluteOutputPath), { recursive: true });
    await writeFile(absoluteOutputPath, `${csv}\n`, "utf-8");

    return NextResponse.json({
      success: true,
      outputPath,
      rows: rows.length,
      minConfidence,
      includeOnlySelected,
    });
  } catch (error) {
    return NextResponse.json(
      { error: `Failed to build dataset from backups: ${(error as Error).message}` },
      { status: 500 }
    );
  }
}
