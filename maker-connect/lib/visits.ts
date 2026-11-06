import { prisma } from '@/lib/prisma';

// Dia "do Brasil" (America/Sao_Paulo) gravado como DATE: a virada do contador
// acontece a meia-noite local, nao a meia-noite UTC (21h).
export function visitDay(now = new Date()): Date {
  const ymd = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
  return new Date(`${ymd}T00:00:00.000Z`);
}

export async function recordVisit(authenticated: boolean, now = new Date()) {
  const day = visitDay(now);
  await prisma.siteVisitDaily.upsert({
    where: { day_authenticated: { day, authenticated } },
    create: { day, authenticated, count: 1 },
    update: { count: { increment: 1 } },
  });
}

export type VisitSummary = {
  today: { authenticated: number; guest: number };
  last7Days: { authenticated: number; guest: number };
  last30Days: { authenticated: number; guest: number };
  total: { authenticated: number; guest: number };
  daily: Array<{ day: string; authenticated: number; guest: number }>; // ultimos 14 dias
};

export async function getVisitSummary(now = new Date()): Promise<VisitSummary> {
  const today = visitDay(now);
  const daysAgo = (n: number) => new Date(today.getTime() - n * 24 * 60 * 60 * 1000);

  const [rows, totals] = await Promise.all([
    prisma.siteVisitDaily.findMany({
      where: { day: { gte: daysAgo(29) } },
      select: { day: true, authenticated: true, count: true },
    }),
    prisma.siteVisitDaily.groupBy({ by: ['authenticated'], _sum: { count: true } }),
  ]);

  const sumSince = (from: Date) => {
    const acc = { authenticated: 0, guest: 0 };
    for (const r of rows) {
      if (r.day < from) continue;
      if (r.authenticated) acc.authenticated += r.count;
      else acc.guest += r.count;
    }
    return acc;
  };

  const daily: VisitSummary['daily'] = [];
  for (let i = 13; i >= 0; i--) {
    const d = daysAgo(i);
    const key = d.toISOString().slice(0, 10);
    const sameDay = rows.filter((r) => r.day.getTime() === d.getTime());
    daily.push({
      day: key,
      authenticated: sameDay.find((r) => r.authenticated)?.count ?? 0,
      guest: sameDay.find((r) => !r.authenticated)?.count ?? 0,
    });
  }

  return {
    today: sumSince(today),
    last7Days: sumSince(daysAgo(6)),
    last30Days: sumSince(daysAgo(29)),
    total: {
      authenticated: totals.find((t) => t.authenticated)?._sum.count ?? 0,
      guest: totals.find((t) => !t.authenticated)?._sum.count ?? 0,
    },
    daily,
  };
}
