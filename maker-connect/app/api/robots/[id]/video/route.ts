import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { isValidYoutubeUrl } from '@/lib/youtube';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

  const { id } = await params;
  const robotId = Number(id);
  if (!Number.isInteger(robotId) || robotId <= 0) return NextResponse.json({ error: 'ID inválido' }, { status: 400 });

  const robot = await prisma.robot.findUnique({ where: { id: robotId }, select: { ownerId: true } });
  if (!robot || robot.ownerId !== session.userId) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });

  let body: { videoUrl?: string | null };
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Body inválido' }, { status: 400 }); }

  const videoUrl = body.videoUrl ?? null;
  if (videoUrl && !isValidYoutubeUrl(videoUrl)) {
    return NextResponse.json({ error: 'URL inválida. Informe um link do YouTube.' }, { status: 400 });
  }

  const updated = await prisma.robot.update({ where: { id: robotId }, data: { videoUrl }, select: { videoUrl: true } });
  return NextResponse.json({ data: updated });
}
