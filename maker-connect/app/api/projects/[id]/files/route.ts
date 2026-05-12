import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { uploadProject3DFile, getSupportedExtensions } from '@/lib/project-media';

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const projectId = Number(id);
  if (!Number.isInteger(projectId) || projectId <= 0) {
    return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
  }

  const files = await prisma.projectFile.findMany({
    where: { projectId },
    orderBy: { createdAt: 'asc' },
    select: { id: true, fileName: true, fileUrl: true, fileType: true, fileSizeKb: true, createdAt: true },
  });

  return NextResponse.json({ data: files });
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
    select: { creatorId: true },
  });
  if (!project) return NextResponse.json({ error: 'Projeto não encontrado' }, { status: 404 });
  if (project.creatorId !== session.userId) {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
  }

  const body = await req.json() as { fileB64: string; fileName: string };
  if (!body.fileB64 || !body.fileName) {
    return NextResponse.json(
      { error: 'fileB64 e fileName são obrigatórios', supported: getSupportedExtensions() },
      { status: 400 }
    );
  }

  let result;
  try {
    result = await uploadProject3DFile(body.fileB64, body.fileName, projectId);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Erro no upload', supported: getSupportedExtensions() },
      { status: 400 }
    );
  }

  const file = await prisma.projectFile.create({
    data: {
      projectId,
      fileName: result.fileName,
      fileUrl: result.url,
      fileType: result.fileType,
      fileSizeKb: result.fileSizeKb,
    },
    select: { id: true, fileName: true, fileUrl: true, fileType: true, fileSizeKb: true, createdAt: true },
  });

  return NextResponse.json({ data: file }, { status: 201 });
}
