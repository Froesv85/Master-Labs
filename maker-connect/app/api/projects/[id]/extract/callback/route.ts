import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type CallbackBody = {
  webhookId?: string;
  status?: "done" | "failed";
  output?: unknown;
  n8nExecutionId?: string;
  latencyMs?: number;
  error?: string;
};

function parseProjectId(value: string) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const projectId = parseProjectId(id);
  if (!projectId) {
    return NextResponse.json({ error: "Invalid project id." }, { status: 400 });
  }

  let body: CallbackBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { webhookId, status, output, n8nExecutionId, latencyMs, error } = body;

  if (!webhookId) {
    return NextResponse.json({ error: "webhookId is required." }, { status: 400 });
  }
  if (status !== "done" && status !== "failed") {
    return NextResponse.json({ error: "status must be done or failed." }, { status: 400 });
  }

  const log = await prisma.projectExtractionLog.findUnique({
    where: { webhookId },
    select: { id: true, projectId: true },
  });

  if (!log || log.projectId !== projectId) {
    return NextResponse.json({ error: "Extraction log not found." }, { status: 404 });
  }

  await prisma.projectExtractionLog.update({
    where: { id: log.id },
    data: {
      status,
      output: output ? JSON.stringify(output) : null,
      n8nExecutionId: n8nExecutionId ?? null,
      latencyMs: latencyMs ?? null,
      error: error ?? null,
      updatedAt: new Date(),
    },
  });

  return NextResponse.json({ ok: true });
}