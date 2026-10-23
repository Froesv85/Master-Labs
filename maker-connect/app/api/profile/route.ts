import { NextRequest, NextResponse } from 'next/server';

import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { projectVisibilityWhere } from '@/lib/project-access';

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
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
  }

  const emailParam = req.nextUrl.searchParams.get('email')?.trim().toLowerCase();
  const userIdParam = req.nextUrl.searchParams.get('userId');

  const userId = parseUserId(userIdParam);
  if (userIdParam && userId === null) {
    return NextResponse.json({ error: 'Invalid userId. Use a positive integer.' }, { status: 400 });
  }

  // Busca por e-mail so do proprio usuario: buscar o e-mail de terceiros permitia
  // descobrir quem tem conta. Sem parametro, o perfil e o da sessao.
  if (emailParam && emailParam !== session.email.toLowerCase()) {
    return NextResponse.json({ error: 'Maker profile not found.' }, { status: 404 });
  }
  const targetId = userId ?? session.userId;
  const isSelf = targetId === session.userId;

  try {
    const user = await prisma.user.findUnique({
      where: { id: targetId },
      select: {
        id: true,
        name: true,
        email: true,
        language: true,
        projects: {
          // so os projetos que quem consulta pode ver (privados de terceiros ficam de fora)
          where: await projectVisibilityWhere(session.userId),
          orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
          select: {
            id: true,
            title: true,
            description: true,
            tags: { select: { tag: true } },
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
      tags: project.tags.map((t) => t.tag),
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
          email: isSelf ? user.email : null,
          language: isSelf ? user.language : null,
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
    // o usuario vem da sessao, nunca do corpo: antes qualquer um trocava o idioma de outra conta
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
    }

    const body = await req.json();
    const { language } = body;

    if (!language) {
      return NextResponse.json({ error: 'Missing language.' }, { status: 400 });
    }

    const updatedUser = await prisma.user.update({
      where: { id: session.userId },
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
