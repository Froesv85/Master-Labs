import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getFeedbackViewer, messageSelect, parseFeedbackId, validateMessage } from '@/lib/feedback';
import { checkRateLimit, RATE_LIMITS, tooManyRequests } from '@/lib/rate-limit';

type Params = { params: Promise<{ id: string }> };

// Nova mensagem na conversa. Resposta do admin marca como "respondida" e nao lida pelo
// usuario; mensagem do usuario reabre a conversa e fica nao lida pela administracao.
export async function POST(req: NextRequest, { params }: Params) {
  const viewer = await getFeedbackViewer();
  if (!viewer) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const { id } = await params;
  const threadId = parseFeedbackId(id);
  if (!threadId) return NextResponse.json({ error: 'ID inválido' }, { status: 400 });

  const thread = await prisma.feedbackThread.findUnique({
    where: { id: threadId },
    select: { id: true, userId: true },
  });
  const isOwner = thread?.userId === viewer.session.userId;
  if (!thread || (!isOwner && !viewer.isAdmin)) {
    return NextResponse.json({ error: 'Conversa não encontrada' }, { status: 404 });
  }

  const limit = await checkRateLimit(RATE_LIMITS.feedbackByUser, String(viewer.session.userId));
  if (!limit.allowed) return tooManyRequests(limit.retryAfterSeconds);

  const body = (await req.json().catch(() => null)) as { content?: unknown } | null;
  const message = validateMessage(body?.content);
  if ('error' in message) return NextResponse.json({ error: message.error }, { status: 400 });

  // Admin respondendo na propria conversa conta como usuario: so vira resposta da
  // administracao quando e na conversa de outra pessoa.
  const fromAdmin = viewer.isAdmin && !isOwner;
  const now = new Date();

  const [created] = await prisma.$transaction([
    prisma.feedbackMessage.create({
      data: { threadId, authorId: viewer.session.userId, fromAdmin, content: message.content, createdAt: now },
      select: messageSelect,
    }),
    prisma.feedbackThread.update({
      where: { id: threadId },
      data: fromAdmin
        ? { status: 'answered', userUnread: true, adminUnread: false, lastMessageAt: now }
        : { status: 'open', adminUnread: true, userUnread: false, lastMessageAt: now },
    }),
  ]);

  return NextResponse.json({ data: created }, { status: 201 });
}
