import { NextRequest, NextResponse } from 'next/server';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { getAdminSession } from '@/lib/admin';
import { parseCategory, parseStatus, threadSummarySelect } from '@/lib/feedback';

const PAGE_SIZE = 30;

// Todas as conversas de comentarios e sugestoes, de todos os usuarios. So admin.
export async function GET(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Acesso restrito ao administrador' }, { status: 403 });
  }

  const search = req.nextUrl.searchParams;
  const status = parseStatus(search.get('status'));
  const category = parseCategory(search.get('category'));
  const unreadOnly = search.get('unread') === '1';
  const page = Math.max(1, Number(search.get('page')) || 1);

  const where: Prisma.FeedbackThreadWhereInput = {
    ...(status ? { status } : {}),
    ...(category ? { category } : {}),
    ...(unreadOnly ? { adminUnread: true } : {}),
  };

  const [threads, total, unread] = await Promise.all([
    prisma.feedbackThread.findMany({
      where,
      orderBy: { lastMessageAt: 'desc' },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        ...threadSummarySelect,
        user: { select: { id: true, name: true, email: true } },
        _count: { select: { messages: true } },
      },
    }),
    prisma.feedbackThread.count({ where }),
    prisma.feedbackThread.count({ where: { adminUnread: true } }),
  ]);

  return NextResponse.json({
    data: threads,
    meta: { page, pageSize: PAGE_SIZE, total, unread },
  });
}
