import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { uploadAvatar } from '@/lib/avatar-upload';

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

  let body: { avatarB64?: string; contentType?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Body inválido' }, { status: 400 }); }

  const { avatarB64, contentType } = body;
  if (!avatarB64 || !contentType) {
    return NextResponse.json({ error: 'avatarB64 e contentType são obrigatórios' }, { status: 400 });
  }

  try {
    const { url } = await uploadAvatar(avatarB64, contentType, `profiles/${session.userId}`);
    const profile = await prisma.userProfile.upsert({
      where: { userId: session.userId },
      update: { avatarUrl: url },
      create: { userId: session.userId, avatarUrl: url },
      select: { avatarUrl: true },
    });
    return NextResponse.json({ data: { avatarUrl: profile.avatarUrl } });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro ao fazer upload';
    const status = msg.includes('Tipo') || msg.includes('grande') ? 400 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
