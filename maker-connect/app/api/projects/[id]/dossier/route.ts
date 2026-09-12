import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { requireOwnedProject } from '@/lib/project-access';

type Params = { params: Promise<{ id: string }> };

function parseProjectId(value: string) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function parseJsonArray(value: string | null): unknown[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function serializeDossier(dossier: {
  id: number;
  projectId: number;
  technicalRequirements: string | null;
  suggestedBOM: string | null;
  assemblySteps: string | null;
  sourceExtractionLogId: number | null;
  updatedAt: Date;
  createdAt: Date;
}) {
  return {
    id: dossier.id,
    projectId: dossier.projectId,
    technicalRequirements: parseJsonArray(dossier.technicalRequirements),
    suggestedBOM: parseJsonArray(dossier.suggestedBOM),
    assemblySteps: parseJsonArray(dossier.assemblySteps),
    sourceExtractionLogId: dossier.sourceExtractionLogId,
    updatedAt: dossier.updatedAt,
    createdAt: dossier.createdAt,
  };
}

async function fieldsFromLatestExtraction(projectId: number) {
  const log = await prisma.projectExtractionLog.findFirst({
    where: { projectId, status: 'done', output: { not: null } },
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    select: { id: true, output: true },
  });
  if (!log?.output) return null;

  let output: Record<string, unknown> = {};
  try {
    output = JSON.parse(log.output);
  } catch {
    return null;
  }

  return {
    sourceExtractionLogId: log.id,
    technicalRequirements: JSON.stringify(output.technicalRequirements ?? []),
    suggestedBOM: JSON.stringify(output.suggestedBOM ?? []),
    assemblySteps: JSON.stringify(output.assemblySteps ?? []),
  };
}

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const projectId = parseProjectId(id);
  if (!projectId) {
    return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
  }

  const project = await prisma.project.findUnique({ where: { id: projectId }, select: { id: true } });
  if (!project) {
    return NextResponse.json({ error: 'Projeto não encontrado' }, { status: 404 });
  }

  let dossier = await prisma.projectDossier.findUnique({ where: { projectId } });

  if (!dossier) {
    const seed = await fieldsFromLatestExtraction(projectId);
    if (!seed) {
      return NextResponse.json({ data: null });
    }
    dossier = await prisma.projectDossier.create({ data: { projectId, ...seed } });
  }

  return NextResponse.json({ data: serializeDossier(dossier) });
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await getSession();
  const { id } = await params;
  const projectId = parseProjectId(id) ?? -1;

  const guard = await requireOwnedProject(projectId, session?.userId);
  if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status });

  const body = (await req.json().catch(() => null)) as {
    technicalRequirements?: unknown[];
    suggestedBOM?: unknown[];
    assemblySteps?: unknown[];
  } | null;

  if (!body) {
    return NextResponse.json({ error: 'Corpo da requisição inválido.' }, { status: 400 });
  }

  const data: Record<string, string> = {};
  if (Array.isArray(body.technicalRequirements)) data.technicalRequirements = JSON.stringify(body.technicalRequirements);
  if (Array.isArray(body.suggestedBOM)) data.suggestedBOM = JSON.stringify(body.suggestedBOM);
  if (Array.isArray(body.assemblySteps)) data.assemblySteps = JSON.stringify(body.assemblySteps);

  const dossier = await prisma.projectDossier.upsert({
    where: { projectId },
    create: { projectId, ...data },
    update: data,
  });

  return NextResponse.json({ data: serializeDossier(dossier) });
}

export async function POST(req: NextRequest, { params }: Params) {
  const session = await getSession();
  const { id } = await params;
  const projectId = parseProjectId(id) ?? -1;

  const guard = await requireOwnedProject(projectId, session?.userId);
  if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status });

  const body = (await req.json().catch(() => null)) as { resync?: boolean } | null;
  if (!body?.resync) {
    return NextResponse.json({ error: 'Use { "resync": true } para ressincronizar da IA.' }, { status: 400 });
  }

  const seed = await fieldsFromLatestExtraction(projectId);
  if (!seed) {
    return NextResponse.json({ error: 'Nenhuma extração concluída encontrada para ressincronizar.' }, { status: 404 });
  }

  const dossier = await prisma.projectDossier.upsert({
    where: { projectId },
    create: { projectId, ...seed },
    update: seed,
  });

  return NextResponse.json({ data: serializeDossier(dossier) });
}
