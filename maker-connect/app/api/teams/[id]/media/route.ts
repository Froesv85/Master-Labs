import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { uploadAvatar } from '@/lib/avatar-upload';
import { isValidYoutubeUrl } from '@/lib/youtube';

async function resolveTeamAsOwner(id: string, userId: number) {
  const teamId = Number(id);
  if (!Number.isInteger(teamId) || teamId <= 0) return null;
  const team = await prisma.team.findUnique({ where: { id: teamId }, select: { ownerId: true } });
  if (!team || team.ownerId !== userId) return null;
  return teamId;
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

  const { id } = await params;
  const teamId = await resolveTeamAsOwner(id, session.userId);
  if (!teamId) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });

  let body: { type: 'avatar' | 'video'; imageB64?: string; contentType?: string; videoUrl?: string | null };
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Body inválido' }, { status: 400 }); }

  try {
    if (body.type === 'avatar') {
      if (!body.imageB64 || !body.contentType) return NextResponse.json({ error: 'imageB64 e contentType obrigatórios' }, { status: 400 });
      const { url } = await uploadAvatar(body.imageB64, body.contentType, `teams/${teamId}`);
      const t = await prisma.team.update({ where: { id: teamId }, data: { avatarUrl: url }, select: { avatarUrl: true } });
      return NextResponse.json({ data: t });
    }

    if (body.type === 'video') {
      const videoUrl = body.videoUrl ?? null;
      if (videoUrl && !isValidYoutubeUrl(videoUrl)) return NextResponse.json({ error: 'URL inválida. Informe um link do YouTube.' }, { status: 400 });
      const t = await prisma.team.update({ where: { id: teamId }, data: { videoUrl }, select: { videoUrl: true } });
      return NextResponse.json({ data: t });
    }

    return NextResponse.json({ error: 'type deve ser avatar ou video' }, { status: 400 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro interno';
    const status = msg.includes('Tipo') || msg.includes('grande') || msg.includes('inválid') ? 400 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
