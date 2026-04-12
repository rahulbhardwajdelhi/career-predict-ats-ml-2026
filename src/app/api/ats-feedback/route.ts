import { NextResponse } from "next/server";

interface AtsFeedbackRequest {
  jobDescription: string;
  resumeSnapshot: string;
  localSuggestions: string[];
}

export async function POST(request: Request) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    const model = process.env.OPENAI_MODEL || "gpt-4.1-mini";

    if (!apiKey) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY is not configured on the server." },
        { status: 400 },
      );
    }

    const body = (await request.json()) as AtsFeedbackRequest;

    if (!body.jobDescription?.trim()) {
      return NextResponse.json(
        { error: "jobDescription is required." },
        { status: 400 },
      );
    }

    const prompt = [
      "You are an ATS resume optimization assistant.",
      "Given a job description and current resume content, produce concise, practical recommendations.",
      "Return valid JSON only with this shape:",
      '{"prioritizedActions": string[], "improvedSummary": string, "rewrittenBullets": string[]}',
      "Rules:",
      "- 3 to 6 prioritizedActions.",
      "- improvedSummary must be 2 to 3 sentences.",
      "- rewrittenBullets must have 3 to 5 bullets and use measurable impact.",
      "- Do not invent achievements that are not implied.",
      "- Keep language clear and recruiter friendly.",
      "",
      "Job description:",
      body.jobDescription,
      "",
      "Resume snapshot:",
      body.resumeSnapshot,
      "",
      "Current local suggestions:",
      body.localSuggestions.join("\n"),
    ].join("\n");

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        temperature: 0.3,
        input: prompt,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: `OpenAI request failed: ${errorText}` },
        { status: 500 },
      );
    }

    const data = (await response.json()) as { output_text?: string };
    const raw = data.output_text || "";

    try {
      const parsed = JSON.parse(raw);
      return NextResponse.json(parsed);
    } catch {
      return NextResponse.json(
        {
          prioritizedActions: ["AI response parsing failed. Use local suggestions for now."],
          improvedSummary: "",
          rewrittenBullets: [],
          raw,
        },
        { status: 200 },
      );
    }
  } catch (error) {
    return NextResponse.json(
      { error: `Failed to generate ATS feedback: ${(error as Error).message}` },
      { status: 500 },
    );
  }
}
