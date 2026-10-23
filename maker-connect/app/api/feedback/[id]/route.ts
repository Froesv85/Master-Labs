import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  getFeedbackViewer,
  messageSelect,
  parseFeedbackId,
  parseStatus,
  threadSummarySelect,
} from '@/lib/feedback';

type Params = { params: Promise<{ id: string }> };

// Conversa completa. Dono ou admin; para qualquer outro usuario devolve 404, sem
// revelar que a conversa existe. Abrir a conversa marca como lida para quem abriu.
export async function GET(_req: NextRequest, { params }: Params) {
  const viewer = await getFeedbackViewer();
  if (!viewer) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const { id } = await params;
  const threadId = parseFeedbackId(id);
  if (!threadId) return NextResponse.json({ error: 'ID inválido' }, { status: 400 });

  const thread = await prisma.feedbackThread.findUnique({
    where: { id: threadId },
    select: {
      ...threadSummarySelect,
      userId: true,
      user: { select: { id: true, name: true, email: viewer.isAdmin } },
      messages: { select: messageSelect, orderBy: { createdAt: 'asc' } },
    },
  });

  const isOwner = thread?.userId === viewer.session.userId;
  if (!thread || (!isOwner && !viewer.isAdmin)) {
    return NextResponse.json({ error: 'Conversa não encontrada' }, { status: 404 });
  }

  const readField = viewer.isAdmin && !isOwner ? 'adminUnread' : 'userUnread';
  if (thread[readField]) {
    await prisma.feedbackThread.update({ where: { id: threadId }, data: { [readField]: false } });
  }

  return NextResponse.json({ data: { ...thread, [readField]: false } });
}

// Admin muda o status (ex.: encerrar uma sugestao ja implementada).
export async function PATCH(req: NextRequest, { params }: Params) {
  const viewer = await getFeedbackViewer();
  if (!viewer) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  if (!viewer.isAdmin) {
    return NextResponse.json({ error: 'Acesso restrito ao administrador' }, { status: 403 });
  }

  const { id } = await params;
  const threadId = parseFeedbackId(id);
  if (!threadId) return NextResponse.json({ error: 'ID inválido' }, { status: 400 });

  const body = (await req.json().catch(() => null)) as { status?: unknown } | null;
  const status = parseStatus(body?.status);
  if (!status) return NextResponse.json({ error: 'Status inválido' }, { status: 400 });

  const exists = await prisma.feedbackThread.findUnique({ where: { id: threadId }, select: { id: true } });
  if (!exists) return NextResponse.json({ error: 'Conversa não encontrada' }, { status: 404 });

  const thread = await prisma.feedbackThread.update({
    where: { id: threadId },
    data: { status },
    select: threadSummarySelect,
  });

  return NextResponse.json({ data: thread });
}
