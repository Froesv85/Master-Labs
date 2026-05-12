import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { uploadAvatar, uploadCover } from '@/lib/avatar-upload';
import { isValidYoutubeUrl } from '@/lib/youtube';

async function resolveIdAndRole(id: string, userId: number) {
  const communityId = Number(id);
  if (!Number.isInteger(communityId) || communityId <= 0) return null;
  const membership = await prisma.communityMember.findUnique({
    where: { communityId_userId: { communityId, userId } },
    select: { role: true, status: true },
  });
  if (!membership || membership.status !== 'approved') return null;
  if (membership.role !== 'founder' && membership.role !== 'moderator') return null;
  return communityId;
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

  const { id } = await params;
  const communityId = await resolveIdAndRole(id, session.userId);
  if (!communityId) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });

  let body: { type: 'avatar' | 'cover' | 'video'; imageB64?: string; contentType?: string; videoUrl?: string | null };
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Body inválido' }, { status: 400 }); }

  try {
    if (body.type === 'avatar') {
      if (!body.imageB64 || !body.contentType) return NextResponse.json({ error: 'imageB64 e contentType obrigatórios' }, { status: 400 });
      const { url } = await uploadAvatar(body.imageB64, body.contentType, `communities/${communityId}`);
      const c = await prisma.community.update({ where: { id: communityId }, data: { avatarUrl: url }, select: { avatarUrl: true } });
      return NextResponse.json({ data: c });
    }

    if (body.type === 'cover') {
      if (!body.imageB64 || !body.contentType) return NextResponse.json({ error: 'imageB64 e contentType obrigatórios' }, { status: 400 });
      const { url } = await uploadCover(body.imageB64, body.contentType, `communities/${communityId}`);
      const c = await prisma.community.update({ where: { id: communityId }, data: { coverUrl: url }, select: { coverUrl: true } });
      return NextResponse.json({ data: c });
    }

    if (body.type === 'video') {
      const videoUrl = body.videoUrl ?? null;
      if (videoUrl && !isValidYoutubeUrl(videoUrl)) return NextResponse.json({ error: 'URL inválida. Informe um link do YouTube.' }, { status: 400 });
      const c = await prisma.community.update({ where: { id: communityId }, data: { videoUrl }, select: { videoUrl: true } });
      return NextResponse.json({ data: c });
    }

    return NextResponse.json({ error: 'type deve ser avatar, cover ou video' }, { status: 400 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro interno';
    const status = msg.includes('Tipo') || msg.includes('grande') || msg.includes('inválid') ? 400 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
