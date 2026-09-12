import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { requireOwnedProject } from '@/lib/project-access';

type Params = { params: Promise<{ id: string }> };

function parseProjectId(value: string) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
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

  const files = await prisma.projectCodeFile.findMany({
    where: { projectId },
    orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
  });

  return NextResponse.json({ data: files });
}

export async function POST(req: NextRequest, { params }: Params) {
  const session = await getSession();
  const { id } = await params;
  const projectId = parseProjectId(id) ?? -1;

  const guard = await requireOwnedProject(projectId, session?.userId);
  if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status });

  const body = (await req.json().catch(() => null)) as { filename?: string; content?: string } | null;
  const filename = body?.filename?.trim();
  if (!filename) {
    return NextResponse.json({ error: 'filename é obrigatório.' }, { status: 400 });
  }

  const file = await prisma.projectCodeFile.create({
    data: { projectId, filename, content: body?.content ?? '' },
  });

  return NextResponse.json({ data: file }, { status: 201 });
}
