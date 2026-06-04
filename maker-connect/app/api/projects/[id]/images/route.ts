import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { uploadProjectImage } from '@/lib/project-media';

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const projectId = Number(id);
  if (!Number.isInteger(projectId) || projectId <= 0) {
    return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
  }

  const images = await prisma.projectImage.findMany({
    where: { projectId },
    orderBy: { position: 'asc' },
    select: { id: true, imageUrl: true, position: true, createdAt: true },
  });

  return NextResponse.json({ data: images });
}

export async function POST(req: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session?.userId) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const { id } = await params;
  const projectId = Number(id);
  if (!Number.isInteger(projectId) || projectId <= 0) {
    return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { creatorId: true, coverImageUrl: true },
  });
  if (!project) return NextResponse.json({ error: 'Projeto não encontrado' }, { status: 404 });
  if (project.creatorId !== session.userId) {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
  }

  const body = await req.json() as { imageB64: string; contentType: string; setCover?: boolean };
  if (!body.imageB64 || !body.contentType) {
    return NextResponse.json({ error: 'imageB64 e contentType são obrigatórios' }, { status: 400 });
  }

  let result;
  try {
    result = await uploadProjectImage(body.imageB64, body.contentType, projectId);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Erro no upload' }, { status: 400 });
  }

  const count = await prisma.projectImage.count({ where: { projectId } });
  const image = await prisma.projectImage.create({
    data: { projectId, imageUrl: result.url, position: count },
    select: { id: true, imageUrl: true, position: true, createdAt: true },
  });

  if (body.setCover || count === 0) {
    await prisma.project.update({ where: { id: projectId }, data: { coverImageUrl: result.url } });
  }

  return NextResponse.json({ data: image }, { status: 201 });
}
