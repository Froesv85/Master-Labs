import { Category, Prisma } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { uploadProjectImage } from '@/lib/project-media';

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 50;
const DEFAULT_SORT = 'newest';

type SortOption = 'newest' | 'oldest' | 'top';

const categoryMap: Record<string, Category> = {
  '3D_Printing': Category.Printing3D,
  Printing3D: Category.Printing3D,
  Robotics: Category.Robotics,
  IoT: Category.IoT,
  Woodworking: Category.Woodworking,
};

function toPositiveInt(value: string | null, fallback: number) {
  if (!value) return fallback;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) return null;
  return parsed;
}

export async function GET(req: NextRequest) {
  const categoryParam = req.nextUrl.searchParams.get('category');
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

  let category: Category | undefined;
  if (categoryParam) {
    category = categoryMap[categoryParam];
    if (!category) {
      return NextResponse.json(
        { error: 'Invalid category. Use one of: 3D_Printing, Robotics, IoT, Woodworking.' },
        { status: 400 }
      );
    }
  }

  const where: Prisma.ProjectWhereInput = {
    ...(category ? { category } : {}),
    ...(queryParam
      ? { OR: [{ title: { contains: queryParam } }, { description: { contains: queryParam } }] }
      : {}),
  };

  try {
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
          category: true,
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
      category: p.category,
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
      filters: { category: categoryParam ?? null, q: queryParam || null, sort: sortParam },
    });
  } catch (error) {
    console.error('GET /api/projects failed', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    const body = await req.json() as {
      title: string;
      description?: string;
      category: string;
      coverImageB64?: string;
      coverImageContentType?: string;
      printerBrand?: string;
      printerModel?: string;
      printerNozzle?: string;
      printerMaterial?: string;
      printerLayerHeight?: string;
    };

    const { title, description, category } = body;
    const creatorId = session?.userId ?? 1;

    if (!title?.trim()) return NextResponse.json({ error: 'Título obrigatório' }, { status: 400 });
    const cat = categoryMap[category];
    if (!cat) return NextResponse.json({ error: 'Categoria inválida' }, { status: 400 });

    const project = await prisma.project.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        category: cat,
        creatorId,
        printerBrand: body.printerBrand?.trim() || null,
        printerModel: body.printerModel?.trim() || null,
        printerNozzle: body.printerNozzle?.trim() || null,
        printerMaterial: body.printerMaterial?.trim() || null,
        printerLayerHeight: body.printerLayerHeight?.trim() || null,
      },
      select: { id: true, title: true, category: true, createdAt: true },
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

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    console.error('POST /api/projects failed', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
