import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { uploadCover } from '@/lib/avatar-upload';
import { isValidCoverPreset } from '@/lib/cover-presets';

export async function GET() {
  const teams = await prisma.team.findMany({
    include: {
      owner: { select: { id: true, name: true } },
      members: {
        include: { user: { select: { id: true, name: true } } },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json(teams);
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
    }

    const body = await req.json();
    const {
      name, description, isPublic = true,
      coverPresetUrl, coverImageB64, coverImageContentType,
    } = body as {
      name: string;
      description?: string;
      isPublic?: boolean;
      coverPresetUrl?: string;
      coverImageB64?: string;
      coverImageContentType?: string;
    };

    if (!name?.trim()) return NextResponse.json({ error: 'Nome obrigatório' }, { status: 400 });

    let presetCoverUrl: string | null = null;
    if (coverPresetUrl) {
      if (!isValidCoverPreset(coverPresetUrl)) {
        return NextResponse.json({ error: 'Capa pré-carregada inválida' }, { status: 400 });
      }
      presetCoverUrl = coverPresetUrl;
    }

    let team = await prisma.team.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        isPublic,
        coverUrl: presetCoverUrl,
        ownerId: session.userId,
        members: {
          create: { userId: session.userId, role: 'owner' },
        },
      },
      include: {
        owner: { select: { id: true, name: true } },
        members: { include: { user: { select: { id: true, name: true } } } },
      },
    });

    if (!presetCoverUrl && coverImageB64 && coverImageContentType) {
      try {
        const { url } = await uploadCover(coverImageB64, coverImageContentType, `teams/${team.id}`);
        team = await prisma.team.update({
          where: { id: team.id },
          data: { coverUrl: url },
          include: {
            owner: { select: { id: true, name: true } },
            members: { include: { user: { select: { id: true, name: true } } } },
          },
        });
      } catch (err) {
        console.error('Falha no upload da capa da equipe', team.id, err);
      }
    }

    return NextResponse.json(team, { status: 201 });
  } catch (error) {
    console.error('POST /api/teams failed', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
