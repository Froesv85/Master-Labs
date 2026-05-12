import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { uploadPostMedia } from '@/lib/community-media';
import { isValidYoutubeUrl } from '@/lib/youtube';

type Params = { params: Promise<{ id: string }> };

function parseCommunityId(value: string) {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : null;
}

async function requireMembership(communityId: number, userId: number) {
  const membership = await prisma.communityMember.findFirst({
    where: { communityId, userId, status: 'approved' },
    select: { id: true },
  });
  return membership !== null;
}

export async function POST(req: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
  }

  const { id } = await params;
  const communityId = parseCommunityId(id);
  if (!communityId) {
    return NextResponse.json({ error: 'Invalid community id.' }, { status: 400 });
  }

  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const title = typeof body.title === 'string' ? body.title.trim() : '';
  const content = typeof body.content === 'string' ? body.content.trim() : '';

  if (title.length < 3 || title.length > 200) {
    return NextResponse.json(
      { error: 'title must be between 3 and 200 characters.' },
      { status: 400 }
    );
  }
  if (content.length < 10) {
    return NextResponse.json(
      { error: 'content must be at least 10 characters.' },
      { status: 400 }
    );
  }

  const community = await prisma.community.findUnique({
    where: { id: communityId },
    select: { id: true },
  });
  if (!community) {
    return NextResponse.json({ error: 'Community not found.' }, { status: 404 });
  }

  const isMember = await requireMembership(communityId, session.userId);
  if (!isMember) {
    return NextResponse.json(
      { error: 'Only community members can publish content.' },
      { status: 403 }
    );
  }

  let mediaUrl: string | null = null;
  let videoUrl: string | null = null;

  const hasMedia = body.mediaB64 !== undefined && body.mediaB64 !== null;
  const hasVideo = typeof body.videoUrl === 'string' && body.videoUrl.length > 0;

  if (hasMedia && hasVideo) {
    return NextResponse.json({ error: 'Post pode ter imagem ou vídeo, não ambos.' }, { status: 400 });
  }

  if (hasMedia) {
    if (typeof body.mediaB64 !== 'string' || body.mediaB64.length === 0) {
      return NextResponse.json({ error: 'mediaB64 must be a non-empty string.' }, { status: 400 });
    }
    const mediaContentType =
      typeof body.mediaContentType === 'string' ? body.mediaContentType : '';
    if (!mediaContentType) {
      return NextResponse.json(
        { error: 'mediaContentType is required when mediaB64 is provided.' },
        { status: 400 }
      );
    }
    try {
      const result = await uploadPostMedia(body.mediaB64, mediaContentType, communityId);
      mediaUrl = result.url;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Media upload failed.';
      return NextResponse.json({ error: message }, { status: 422 });
    }
  }

  if (hasVideo) {
    if (!isValidYoutubeUrl(body.videoUrl)) {
      return NextResponse.json({ error: 'URL de vídeo inválida. Informe um link do YouTube.' }, { status: 400 });
    }
    videoUrl = body.videoUrl;
  }

  const post = await prisma.communityPost.create({
    data: {
      communityId,
      authorId: session.userId,
      title,
      content,
      mediaUrl,
      videoUrl,
    },
    select: {
      id: true,
      communityId: true,
      title: true,
      content: true,
      mediaUrl: true,
      videoUrl: true,
      replies: true,
      views: true,
      createdAt: true,
      author: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json({ data: post }, { status: 201 });
}

export async function GET(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const communityId = parseCommunityId(id);
  if (!communityId) {
    return NextResponse.json({ error: 'Invalid community id.' }, { status: 400 });
  }

  const { searchParams } = req.nextUrl;
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1') || 1);
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') ?? '20') || 20));
  const skip = (page - 1) * limit;

  const community = await prisma.community.findUnique({
    where: { id: communityId },
    select: { id: true, isPublic: true },
  });
  if (!community) {
    return NextResponse.json({ error: 'Community not found.' }, { status: 404 });
  }

  if (!community.isPublic) {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
    }
    const isMember = await requireMembership(communityId, session.userId);
    if (!isMember) {
      return NextResponse.json(
        { error: 'Only members can view posts in private communities.' },
        { status: 403 }
      );
    }
  }

  const [posts, total] = await Promise.all([
    prisma.communityPost.findMany({
      where: { communityId },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      select: {
        id: true,
        communityId: true,
        title: true,
        content: true,
        mediaUrl: true,
        videoUrl: true,
        replies: true,
        views: true,
        createdAt: true,
        author: { select: { id: true, name: true } },
      },
    }),
    prisma.communityPost.count({ where: { communityId } }),
  ]);

  return NextResponse.json({
    data: posts,
    total,
    page,
    limit,
    hasMore: skip + posts.length < total,
  });
}
