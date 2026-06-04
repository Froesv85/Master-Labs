import { Category } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const categoryMap: Record<string, Category> = {
  Printing3D: Category.Printing3D,
  Robotics: Category.Robotics,
  IoT: Category.IoT,
  Woodworking: Category.Woodworking,
};

export async function GET() {
  const communities = await prisma.community.findMany({
    where: { isPublic: true },
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
    const body = await req.json();
    const { name, description, category, isPublic = true, creatorId = 1 } = body as {
      name: string;
      description?: string;
      category: string;
      isPublic?: boolean;
      creatorId?: number;
    };

    if (!name?.trim()) return NextResponse.json({ error: 'Nome obrigatório' }, { status: 400 });
    const cat = categoryMap[category];
    if (!cat) return NextResponse.json({ error: 'Categoria inválida' }, { status: 400 });

    const community = await prisma.community.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        category: cat,
        isPublic,
        creatorId,
        members: {
          create: { userId: creatorId, role: 'founder' },
        },
      },
      include: {
        creator: { select: { id: true, name: true } },
        _count: { select: { members: true, posts: true } },
      },
    });

    return NextResponse.json(community, { status: 201 });
  } catch (error) {
    console.error('POST /api/communities failed', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
