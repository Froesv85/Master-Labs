import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { projectVisibilityWhere } from '@/lib/project-access';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const userId = parseInt(id);
  if (isNaN(userId)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
  const isSelf = session.userId === userId;

  // select explicito: antes o `include` devolvia a linha inteira de User, com hash
  // da senha, googleId/githubId e role, para qualquer pessoa (inclusive sem login)
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      language: true,
      profile: true,
      badges: { orderBy: { earnedAt: 'desc' } },
      robots: {
        include: { awards: true },
        orderBy: { eloScore: 'desc' },
      },
      projects: {
        where: await projectVisibilityWhere(session.userId),
        orderBy: { createdAt: 'desc' },
        take: 6,
        include: { tags: { select: { tag: true } } },
      },
      sharedProjects: {
        orderBy: { createdAt: 'desc' },
        take: 12,
        include: {
          project: {
            select: {
              id: true,
              title: true,
              tags: { select: { tag: true } },
              creatorId: true,
              creator: { select: { id: true, name: true } },
              createdAt: true,
            },
          },
        },
      },
      ownedTeams: {
        include: { members: true },
      },
      teamMemberships: {
        include: { team: { include: { members: true } } },
      },
      communities: {
        include: { community: true },
      },
      following: { select: { followingId: true } },
      followers: { select: { followerId: true } },
    },
  });

  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  return NextResponse.json({
    ...user,
    email: isSelf ? user.email : null,
    language: isSelf ? user.language : null,
    projects: user.projects.map((p) => ({ ...p, tags: p.tags.map((t) => t.tag) })),
    sharedProjects: user.sharedProjects.map((s) => ({
      ...s,
      project: { ...s.project, tags: s.project.tags.map((t) => t.tag) },
    })),
  });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const userId = parseInt(id);
  if (isNaN(userId)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

  // so o proprio usuario edita o perfil (antes nao havia nenhuma checagem)
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
  if (session.userId !== userId) return NextResponse.json({ error: 'Sem permissão.' }, { status: 403 });

  const body = await req.json();
  const { name, bio, location, website, githubUrl, expertise } = body as {
    name?: string;
    bio?: string;
    location?: string;
    website?: string;
    githubUrl?: string;
    expertise?: string[];
  };

  const [updatedUser] = await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: {
        ...(name !== undefined && { name: name.trim() || null }),
        profile: {
          upsert: {
            create: {
              bio: bio?.trim() || null,
              location: location?.trim() || null,
              website: website?.trim() || null,
              githubUrl: githubUrl?.trim() || null,
              expertise: expertise ? JSON.stringify(expertise) : null,
            },
            update: {
              ...(bio !== undefined && { bio: bio.trim() || null }),
              ...(location !== undefined && { location: location.trim() || null }),
              ...(website !== undefined && { website: website.trim() || null }),
              ...(githubUrl !== undefined && { githubUrl: githubUrl.trim() || null }),
              ...(expertise !== undefined && { expertise: JSON.stringify(expertise) }),
            },
          },
        },
      },
      include: { profile: true },
    }),
  ]);

  return NextResponse.json(updatedUser);
}
