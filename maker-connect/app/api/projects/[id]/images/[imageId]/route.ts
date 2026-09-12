import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { requireOwnedProject } from '@/lib/project-access';

type Params = { params: Promise<{ id: string; imageId: string }> };

function parseId(value: string) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await getSession();
  const { id, imageId } = await params;
  const projectId = parseId(id) ?? -1;
  const projectImageId = parseId(imageId);

  const guard = await requireOwnedProject(projectId, session?.userId);
  if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status });

  if (!projectImageId) {
    return NextResponse.json({ error: 'ID de imagem inválido' }, { status: 400 });
  }

  const image = await prisma.projectImage.findUnique({ where: { id: projectImageId } });
  if (!image || image.projectId !== projectId) {
    return NextResponse.json({ error: 'Imagem não encontrada' }, { status: 404 });
  }

  await prisma.projectImage.delete({ where: { id: projectImageId } });

  return NextResponse.json({ data: { id: projectImageId } });
}
