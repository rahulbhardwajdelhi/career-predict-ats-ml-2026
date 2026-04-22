import { NextResponse } from "next/server";
import { getCollection } from "lib/db/mongodb";
import type { Resume } from "lib/redux/types";
import type { AtsAnalysisResult } from "lib/ats/types";

export const runtime = "nodejs";

interface SaveResumeBackupRequest {
  resume?: Resume;
  jobDescription?: string;
  atsAnalysis?: AtsAnalysisResult;
  accountId?: string;
  accountRole?: string;
  labelRole?: string;
  selected?: boolean;
  callbacksFromCompany?: number;
}

interface ResumeBackupDocument {
  accountId: string;
  accountRole: string;
  labelRole?: string;
  selected: boolean;
  callbacksFromCompany: number;
  jobDescription: string;
  resume: Resume;
  atsAnalysis?: AtsAnalysisResult;
  predictedRole?: string;
  modelConfidence?: number;
  createdAt: Date;
  updatedAt: Date;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as SaveResumeBackupRequest;

    if (!body.resume) {
      return NextResponse.json({ error: "resume is required." }, { status: 400 });
    }

    const accountId = body.accountId?.trim() || process.env.TESTER_ACCOUNT_ID || "tester@career-predict.local";
    const accountRole = body.accountRole?.trim() || "tester";

    const payload: ResumeBackupDocument = {
      accountId,
      accountRole,
      labelRole: body.labelRole?.trim() || undefined,
      selected: Boolean(body.selected),
      callbacksFromCompany: Math.max(0, Number(body.callbacksFromCompany || 0)),
      jobDescription: (body.jobDescription || "").trim(),
      resume: body.resume,
      atsAnalysis: body.atsAnalysis,
      predictedRole: body.atsAnalysis?.modelPrediction?.predictedRole,
      modelConfidence: body.atsAnalysis?.modelPrediction?.confidence,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const collection = await getCollection<ResumeBackupDocument>("resume_backups");
    const result = await collection.insertOne(payload);

    return NextResponse.json({
      success: true,
      id: result.insertedId.toString(),
      accountId,
      accountRole,
    });
  } catch (error) {
    return NextResponse.json(
      { error: `Failed to save resume backup: ${(error as Error).message}` },
      { status: 500 }
    );
  }
}
