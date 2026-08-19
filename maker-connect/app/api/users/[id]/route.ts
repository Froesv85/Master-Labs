import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const userId = parseInt(id);
  if (isNaN(userId)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      profile: true,
      badges: { orderBy: { earnedAt: 'desc' } },
      robots: {
        include: { awards: true },
        orderBy: { eloScore: 'desc' },
      },
      projects: {
        orderBy: { createdAt: 'desc' },
        take: 6,
      },
      sharedProjects: {
        orderBy: { createdAt: 'desc' },
        take: 12,
        include: {
          project: {
            select: {
              id: true,
              title: true,
              category: true,
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
  return NextResponse.json(user);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const userId = parseInt(id);
  if (isNaN(userId)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

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
