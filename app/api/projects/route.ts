import { Category, Prisma } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 50;

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
  const page = toPositiveInt(req.nextUrl.searchParams.get('page'), DEFAULT_PAGE);
  const pageSizeRaw = toPositiveInt(req.nextUrl.searchParams.get('pageSize'), DEFAULT_PAGE_SIZE);

  if (page === null || pageSizeRaw === null) {
    return NextResponse.json(
      { error: 'Invalid query params. page and pageSize must be positive integers.' },
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
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          description: true,
          category: true,
          creatorId: true,
          parentId: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
    ]);

    return NextResponse.json({
      data: projects,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
      filters: {
        category: categoryParam ?? null,
        q: queryParam || null,
      },
    });
  } catch (error) {
    console.error('GET /api/projects failed', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
