import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  buildSubject,
  getFeedbackViewer,
  messageSelect,
  parseCategory,
  sanitizePagePath,
  threadSummarySelect,
  validateMessage,
} from '@/lib/feedback';
import { checkRateLimit, RATE_LIMITS, tooManyRequests } from '@/lib/rate-limit';

// Conversas do proprio usuario (inclusive do admin, quando ele mesmo abre uma).
// A visao de todas as conversas fica em /api/admin/feedback.
export async function GET() {
  const viewer = await getFeedbackViewer();
  if (!viewer) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const threads = await prisma.feedbackThread.findMany({
    where: { userId: viewer.session.userId },
    orderBy: { lastMessageAt: 'desc' },
    take: 50,
    select: threadSummarySelect,
  });

  return NextResponse.json({ data: threads });
}

export async function POST(req: NextRequest) {
  const viewer = await getFeedbackViewer();
  if (!viewer) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const limit = await checkRateLimit(RATE_LIMITS.feedbackByUser, String(viewer.session.userId));
  if (!limit.allowed) return tooManyRequests(limit.retryAfterSeconds);

  const body = (await req.json().catch(() => null)) as
    | { category?: unknown; subject?: unknown; content?: unknown; pagePath?: unknown }
    | null;
  if (!body) return NextResponse.json({ error: 'Corpo inválido' }, { status: 400 });

  const category = body.category === undefined ? 'suggestion' : parseCategory(body.category);
  if (!category) return NextResponse.json({ error: 'Categoria inválida' }, { status: 400 });

  const message = validateMessage(body.content);
  if ('error' in message) return NextResponse.json({ error: message.error }, { status: 400 });

  const thread = await prisma.feedbackThread.create({
    data: {
      userId: viewer.session.userId,
      category,
      subject: buildSubject(body.subject, message.content),
      pagePath: sanitizePagePath(body.pagePath),
      messages: {
        create: {
          authorId: viewer.session.userId,
          fromAdmin: false,
          content: message.content,
        },
      },
    },
    select: { ...threadSummarySelect, messages: { select: messageSelect, orderBy: { createdAt: 'asc' } } },
  });

  return NextResponse.json({ data: thread }, { status: 201 });
}
