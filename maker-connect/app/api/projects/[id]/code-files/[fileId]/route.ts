import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { requireOwnedProject } from '@/lib/project-access';

type Params = { params: Promise<{ id: string; fileId: string }> };

function parseId(value: string) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

async function guardFileOwnership(id: string, fileId: string, userId: number | undefined) {
  const projectId = parseId(id) ?? -1;
  const codeFileId = parseId(fileId);

  const guard = await requireOwnedProject(projectId, userId);
  if (guard.error) return { error: NextResponse.json({ error: guard.error }, { status: guard.status }) };

  if (!codeFileId) {
    return { error: NextResponse.json({ error: 'ID de arquivo inválido' }, { status: 400 }) };
  }

  const file = await prisma.projectCodeFile.findUnique({ where: { id: codeFileId } });
  if (!file || file.projectId !== projectId) {
    return { error: NextResponse.json({ error: 'Arquivo não encontrado' }, { status: 404 }) };
  }

  return { error: null, codeFileId };
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await getSession();
  const { id, fileId } = await params;

  const guard = await guardFileOwnership(id, fileId, session?.userId);
  if (guard.error) return guard.error;

  const body = (await req.json().catch(() => null)) as { filename?: string; content?: string } | null;
  const data: { filename?: string; content?: string } = {};
  if (typeof body?.filename === 'string' && body.filename.trim()) data.filename = body.filename.trim();
  if (typeof body?.content === 'string') data.content = body.content;

  const file = await prisma.projectCodeFile.update({
    where: { id: guard.codeFileId! },
    data,
  });

  return NextResponse.json({ data: file });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await getSession();
  const { id, fileId } = await params;

  const guard = await guardFileOwnership(id, fileId, session?.userId);
  if (guard.error) return guard.error;

  await prisma.projectCodeFile.delete({ where: { id: guard.codeFileId! } });

  return NextResponse.json({ data: { id: guard.codeFileId } });
}
