import { Category, Prisma } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';

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
  if (!value) {
    return fallback;
  }

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null;
  }

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
        {
          error: 'Invalid category. Use one of: 3D_Printing, Robotics, IoT, Woodworking.',
        },
        { status: 400 }
      );
    }
  }

  const where: Prisma.ProjectWhereInput = {
    ...(category ? { category } : {}),
    ...(queryParam
      ? {
          OR: [
            { title: { contains: queryParam } },
            { description: { contains: queryParam } },
          ],
        }
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
          parentId: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              votes: true,
            },
          },
        },
      }),
    ]);

    const data = projects.map((project) => ({
      id: project.id,
      title: project.title,
      description: project.description,
      category: project.category,
      creatorId: project.creatorId,
      parentId: project.parentId,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      votes: project._count.votes,
    }));

    return NextResponse.json({
      data,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
      filters: {
        category: categoryParam ?? null,
        q: queryParam || null,
        sort: sortParam,
      },
    });
  } catch (error) {
    console.error('GET /api/projects failed', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
