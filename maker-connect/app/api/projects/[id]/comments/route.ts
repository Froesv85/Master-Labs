import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { uploadProjectImage } from '@/lib/project-media';

type Params = { params: Promise<{ id: string }> };

function parseProjectId(value: string) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) return null;
  return parsed;
}

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const projectId = parseProjectId(id);
  if (!projectId) return NextResponse.json({ error: 'ID inválido' }, { status: 400 });

  const comments = await prisma.projectComment.findMany({
    where: { projectId },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      content: true,
      imageUrl: true,
      createdAt: true,
      author: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json({ data: comments });
}

export async function POST(req: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session?.userId) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const { id } = await params;
  const projectId = parseProjectId(id);
  if (!projectId) return NextResponse.json({ error: 'ID inválido' }, { status: 400 });

  const project = await prisma.project.findUnique({ where: { id: projectId }, select: { id: true } });
  if (!project) return NextResponse.json({ error: 'Projeto não encontrado' }, { status: 404 });

  const body = await req.json() as { content?: string; imageB64?: string; imageContentType?: string };
  const content = body.content?.trim();
  if (!content) {
    return NextResponse.json({ error: 'Comentário não pode ser vazio' }, { status: 400 });
  }

  let imageUrl: string | null = null;
  if (body.imageB64 && body.imageContentType) {
    try {
      const result = await uploadProjectImage(body.imageB64, body.imageContentType, projectId);
      imageUrl = result.url;
    } catch (err) {
      return NextResponse.json({ error: err instanceof Error ? err.message : 'Erro no upload da imagem' }, { status: 400 });
    }
  }

  const comment = await prisma.projectComment.create({
    data: {
      projectId,
      authorId: session.userId,
      content,
      imageUrl,
    },
    select: {
      id: true,
      content: true,
      imageUrl: true,
      createdAt: true,
      author: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json({ data: comment }, { status: 201 });
}
