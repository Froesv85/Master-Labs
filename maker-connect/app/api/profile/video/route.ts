import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { isValidYoutubeUrl, extractYoutubeId } from '@/lib/youtube';

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

  let body: { videoUrl?: string | null };
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Body inválido' }, { status: 400 }); }

  const { videoUrl } = body;

  if (videoUrl !== null && videoUrl !== undefined && videoUrl !== '') {
    if (!isValidYoutubeUrl(videoUrl)) {
      return NextResponse.json({ error: 'URL inválida. Informe um link do YouTube.' }, { status: 400 });
    }
  }

  const url = videoUrl && extractYoutubeId(videoUrl) ? videoUrl : null;

  const profile = await prisma.userProfile.upsert({
    where: { userId: session.userId },
    update: { videoUrl: url },
    create: { userId: session.userId, videoUrl: url },
    select: { videoUrl: true },
  });

  return NextResponse.json({ data: { videoUrl: profile.videoUrl } });
}
