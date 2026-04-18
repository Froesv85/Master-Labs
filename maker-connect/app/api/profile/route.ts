import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';

const DEFAULT_PROFILE_EMAIL = 'test@example.com';

function parseUserId(value: string | null) {
  if (!value) {
    return null;
  }

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
}

export async function GET(req: NextRequest) {
  const emailParam = req.nextUrl.searchParams.get('email');
  const userIdParam = req.nextUrl.searchParams.get('userId');

  const userId = parseUserId(userIdParam);
  if (userIdParam && userId === null) {
    return NextResponse.json({ error: 'Invalid userId. Use a positive integer.' }, { status: 400 });
  }

  const where = userId
    ? { id: userId }
    : { email: emailParam?.trim() || DEFAULT_PROFILE_EMAIL };

  try {
    const user = await prisma.user.findUnique({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        language: true,
        projects: {
          orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
          select: {
            id: true,
            title: true,
            description: true,
            category: true,
            parentId: true,
            createdAt: true,
            updatedAt: true,
            _count: {
              select: {
                votes: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'Maker profile not found.' }, { status: 404 });
    }

    const projects = user.projects.map((project) => ({
      id: project.id,
      title: project.title,
      description: project.description,
      category: project.category,
      parentId: project.parentId,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      votes: project._count.votes,
    }));

    const totalVotes = projects.reduce((acc, project) => acc + project.votes, 0);

    return NextResponse.json({
      data: {
        maker: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
        stats: {
          projects: projects.length,
          totalVotes,
        },
        projects,
      },
    });
  } catch (error) {
    console.error('GET /api/profile failed', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, language } = body;

    if (!userId || !language) {
      return NextResponse.json({ error: 'Missing userId or language.' }, { status: 400 });
    }

    const updatedUser = await prisma.user.update({
      where: { id: Number(userId) },
      data: { language },
    });

    return NextResponse.json({
      message: 'Idioma atualizado com sucesso.',
      language: updatedUser.language,
    });
  } catch (error) {
    console.error('PATCH /api/profile failed', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
