import { Category } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { uploadCover } from '@/lib/avatar-upload';
import { isValidCoverPreset } from '@/lib/cover-presets';

const categoryMap: Record<string, Category> = {
  Printing3D: Category.Printing3D,
  Robotics: Category.Robotics,
  IoT: Category.IoT,
  Woodworking: Category.Woodworking,
};

export async function GET() {
  const communities = await prisma.community.findMany({
    include: {
      creator: { select: { id: true, name: true } },
      _count: { select: { members: true, posts: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json(communities);
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
    }

    const body = await req.json();
    const {
      name, description, category, isPublic = true,
      coverPresetUrl, coverImageB64, coverImageContentType,
    } = body as {
      name: string;
      description?: string;
      category: string;
      isPublic?: boolean;
      coverPresetUrl?: string;
      coverImageB64?: string;
      coverImageContentType?: string;
    };

    if (!name?.trim()) return NextResponse.json({ error: 'Nome obrigatório' }, { status: 400 });
    const cat = categoryMap[category];
    if (!cat) return NextResponse.json({ error: 'Categoria inválida' }, { status: 400 });

    let presetCoverUrl: string | null = null;
    if (coverPresetUrl) {
      if (!isValidCoverPreset(coverPresetUrl)) {
        return NextResponse.json({ error: 'Capa pré-carregada inválida' }, { status: 400 });
      }
      presetCoverUrl = coverPresetUrl;
    }

    let community = await prisma.community.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        category: cat,
        isPublic,
        coverUrl: presetCoverUrl,
        creatorId: session.userId,
        members: {
          create: { userId: session.userId, role: 'founder' },
        },
      },
      include: {
        creator: { select: { id: true, name: true } },
        _count: { select: { members: true, posts: true } },
      },
    });

    // Upload customizado precisa do id real (usado na chave do S3); a comunidade
    // ja foi criada acima, entao so atualizamos o coverUrl em seguida.
    if (!presetCoverUrl && coverImageB64 && coverImageContentType) {
      try {
        const { url } = await uploadCover(coverImageB64, coverImageContentType, `communities/${community.id}`);
        community = await prisma.community.update({
          where: { id: community.id },
          data: { coverUrl: url },
          include: {
            creator: { select: { id: true, name: true } },
            _count: { select: { members: true, posts: true } },
          },
        });
      } catch (err) {
        console.error('Falha no upload da capa da comunidade', community.id, err);
      }
    }

    return NextResponse.json(community, { status: 201 });
  } catch (error) {
    console.error('POST /api/communities failed', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
