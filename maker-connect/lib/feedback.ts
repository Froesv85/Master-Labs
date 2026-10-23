import type { FeedbackCategory, FeedbackStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { getSession, type SessionPayload } from '@/lib/auth';

export const FEEDBACK_CATEGORIES: FeedbackCategory[] = ['suggestion', 'bug', 'comment', 'question'];
export const FEEDBACK_STATUSES: FeedbackStatus[] = ['open', 'answered', 'closed'];

export const MAX_SUBJECT_LENGTH = 160;
export const MAX_MESSAGE_LENGTH = 4000;
const MAX_PAGE_PATH_LENGTH = 512;

export type FeedbackViewer = { session: SessionPayload; isAdmin: boolean };

// Toda rota do chat precisa saber se quem chama e admin: admin ve e responde todas as
// conversas, usuario comum so as proprias.
export async function getFeedbackViewer(): Promise<FeedbackViewer | null> {
  const session = await getSession();
  if (!session?.userId) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { role: true },
  });
  if (!user) return null;

  return { session, isAdmin: user.role === 'admin' };
}

export function parseFeedbackId(value: string) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) return null;
  return parsed;
}

export function parseCategory(value: unknown): FeedbackCategory | null {
  return FEEDBACK_CATEGORIES.includes(value as FeedbackCategory) ? (value as FeedbackCategory) : null;
}

export function parseStatus(value: unknown): FeedbackStatus | null {
  return FEEDBACK_STATUSES.includes(value as FeedbackStatus) ? (value as FeedbackStatus) : null;
}

export function validateMessage(value: unknown): { content: string } | { error: string } {
  const content = typeof value === 'string' ? value.trim() : '';
  if (!content) return { error: 'A mensagem não pode ser vazia.' };
  if (content.length > MAX_MESSAGE_LENGTH) {
    return { error: `A mensagem passa do limite de ${MAX_MESSAGE_LENGTH} caracteres.` };
  }
  return { content };
}

// Assunto opcional: sem assunto, usa o comeco da primeira mensagem.
export function buildSubject(subject: unknown, content: string): string {
  const raw = typeof subject === 'string' && subject.trim() ? subject.trim() : content;
  const singleLine = raw.replace(/\s+/g, ' ');
  return singleLine.length > MAX_SUBJECT_LENGTH
    ? `${singleLine.slice(0, MAX_SUBJECT_LENGTH - 1)}…`
    : singleLine;
}

// So guarda caminho interno ("/projects/12"), nunca URL externa nem query string.
export function sanitizePagePath(value: unknown): string | null {
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//')) return null;
  return value.split(/[?#]/)[0].slice(0, MAX_PAGE_PATH_LENGTH);
}

export const threadSummarySelect = {
  id: true,
  category: true,
  subject: true,
  status: true,
  pagePath: true,
  adminUnread: true,
  userUnread: true,
  lastMessageAt: true,
  createdAt: true,
} as const;

export const messageSelect = {
  id: true,
  content: true,
  fromAdmin: true,
  createdAt: true,
  author: { select: { id: true, name: true } },
} as const;
