import { Category, Prisma } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { uploadProjectImage } from '@/lib/project-media';
import { TAG_ALIASES as tagMap, projectVisibilityWhere } from '@/lib/project-access';

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 50;
const DEFAULT_SORT = 'newest';

type SortOption = 'newest' | 'oldest' | 'top';

function toPositiveInt(value: string | null, fallback: number) {
  if (!value) return fallback;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) return null;
  return parsed;
}

export async function GET(req: NextRequest) {
  const tagParam = req.nextUrl.searchParams.get('tag') ?? req.nextUrl.searchParams.get('category');
  const queryParam = req.nextUrl.searchParams.get('q')?.trim() ?? '';
  const sortParam = (req.nextUrl.searchParams.get('sort') ?? DEFAULT_SORT) as SortOption;
  const page = toPositiveInt(req.nextUrl.searchParams.get('page'), DEFAULT_PAGE);
  const pageSizeRaw = toPositiveInt(req.nextUrl.searchParams.get('pageSize'), DEFAULT_PAGE_SIZE);

  if (page === null || pageSizeRaw === null) {
    return NextResponse.json(
      { error: 'Invalid query params. page and pageSize must be positive integers.' },
      { status: 400 }
    );
  }

  if (sortParam !== 'newest' && sortParam !== 'oldest' && sortParam !== 'top') {
    return NextResponse.json(
      { error: 'Invalid sort. Use one of: newest, oldest, top.' },
      { status: 400 }
    );
  }

  const pageSize = Math.min(pageSizeRaw, MAX_PAGE_SIZE);

  let tag: Category | undefined;
  if (tagParam) {
    tag = tagMap[tagParam];
    if (!tag) {
      return NextResponse.json(
        { error: 'Invalid tag. Use one of: 3D_Printing, Robotics, IoT, Woodworking.' },
        { status: 400 }
      );
    }
  }

  try {
    const session = await getSession();
    const visWhere = await projectVisibilityWhere(session?.userId ?? null);

    const where: Prisma.ProjectWhereInput = {
      AND: [
        visWhere,
        ...(tag ? [{ tags: { some: { tag } } }] : []),
        ...(queryParam
          ? [{ OR: [{ title: { contains: queryParam } }, { description: { contains: queryParam } }] }]
          : []),
      ],
    };

    const [total, projects] = await Promise.all([
      prisma.project.count({ where }),
      prisma.project.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy:
          sortParam === 'newest'
            ? [{ createdAt: 'desc' }, { id: 'desc' }]
            : sortParam === 'oldest'
              ? [{ createdAt: 'asc' }, { id: 'asc' }]
              : [{ votes: { _count: 'desc' } }, { createdAt: 'desc' }, { id: 'desc' }],
        select: {
          id: true,
          title: true,
          description: true,
          visibility: true,
          teamId: true,
          tags: { select: { tag: true } },
          creatorId: true,
          creator: { select: { id: true, name: true } },
          parentId: true,
          coverImageUrl: true,
          printerBrand: true,
          printerModel: true,
          printerMaterial: true,
          createdAt: true,
          updatedAt: true,
          _count: { select: { votes: true, files: true } },
        },
      }),
    ]);

    const data = projects.map((p) => ({
      id: p.id,
      title: p.title,
      description: p.description,
      tags: p.tags.map((t) => t.tag),
      visibility: p.visibility,
      teamId: p.teamId,
      creatorId: p.creatorId,
      creatorName: p.creator.name,
      parentId: p.parentId,
      coverImageUrl: p.coverImageUrl,
      printerBrand: p.printerBrand,
      printerModel: p.printerModel,
      printerMaterial: p.printerMaterial,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
      votes: p._count.votes,
      fileCount: p._count.files,
    }));

    return NextResponse.json({
      data,
      pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
      filters: { tag: tagParam ?? null, q: queryParam || null, sort: sortParam },
    });
  } catch (error) {
    console.error('GET /api/projects failed', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
    }

    const body = (await req.json()) as {
      title: string;
      description?: string;
      objective?: string;
      tags: string[];
      components?: { name: string; quantity?: number; description?: string }[];
      visibility?: 'public' | 'private_owner' | 'private_team';
      teamId?: number;
      coverImageB64?: string;
      coverImageContentType?: string;
      printerBrand?: string;
      printerModel?: string;
      printerNozzle?: string;
      printerMaterial?: string;
      printerLayerHeight?: string;
    };

    const { title, description, objective } = body;

    if (!title?.trim()) return NextResponse.json({ error: 'Título obrigatório' }, { status: 400 });

    const tagValues = Array.isArray(body.tags) ? body.tags : [];
    if (tagValues.length === 0) {
      return NextResponse.json({ error: 'Selecione ao menos uma tag' }, { status: 400 });
    }
    const resolvedTags = new Set<Category>();
    for (const t of tagValues) {
      const resolved = tagMap[t];
      if (!resolved) return NextResponse.json({ error: 'Tag inválida' }, { status: 400 });
      resolvedTags.add(resolved);
    }

    const visibility = body.visibility ?? 'public';
    if (!['public', 'private_owner', 'private_team'].includes(visibility)) {
      return NextResponse.json({ error: 'Visibilidade inválida' }, { status: 400 });
    }

    let teamId: number | null = null;
    if (visibility === 'private_team') {
      if (!body.teamId) {
        return NextResponse.json({ error: 'Equipe obrigatória para projeto privado da equipe' }, { status: 400 });
      }
      const membership = await prisma.teamMember.findUnique({
        where: { teamId_userId: { teamId: body.teamId, userId: session.userId } },
        select: { status: true },
      });
      if (!membership || membership.status !== 'approved') {
        return NextResponse.json({ error: 'Você não é membro aprovado desta equipe' }, { status: 403 });
      }
      teamId = body.teamId;
    }

    const components = Array.isArray(body.components)
      ? body.components
          .filter((c) => c?.name?.trim())
          .map((c) => ({
            name: c.name.trim(),
            quantity: c.quantity && c.quantity > 0 ? Math.floor(c.quantity) : 1,
            description: c.description?.trim() || null,
          }))
      : [];

    const project = await prisma.project.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        objective: objective?.trim() || null,
        visibility,
        teamId,
        creatorId: session.userId,
        printerBrand: body.printerBrand?.trim() || null,
        printerModel: body.printerModel?.trim() || null,
        printerNozzle: body.printerNozzle?.trim() || null,
        printerMaterial: body.printerMaterial?.trim() || null,
        printerLayerHeight: body.printerLayerHeight?.trim() || null,
        tags: { create: Array.from(resolvedTags).map((tag) => ({ tag })) },
        components: components.length ? { create: components } : undefined,
      },
      select: {
        id: true,
        title: true,
        visibility: true,
        teamId: true,
        createdAt: true,
        tags: { select: { tag: true } },
      },
    });

    if (body.coverImageB64 && body.coverImageContentType) {
      try {
        const result = await uploadProjectImage(body.coverImageB64, body.coverImageContentType, project.id);
        await prisma.project.update({
          where: { id: project.id },
          data: { coverImageUrl: result.url },
        });
      } catch (err) {
        // cover image failure is non-fatal for project creation, but log it
        // so upload issues (storage misconfig, bad payload) are diagnosable
        console.error('Cover image upload failed', err);
      }
    }

    return NextResponse.json(
      { ...project, tags: project.tags.map((t) => t.tag) },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/projects failed', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
