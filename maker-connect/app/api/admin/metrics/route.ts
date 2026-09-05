import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAdminSession } from '@/lib/admin';

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, idx)];
}

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Acesso restrito ao administrador' }, { status: 403 });
  }

  const logs = await prisma.projectExtractionLog.findMany({
    where: { status: 'done', latencyMs: { not: null } },
    select: { latencyMs: true, anonymizeMs: true, n8nTriggerMs: true, updatedAt: true },
    orderBy: { updatedAt: 'desc' },
  });

  const latencies = logs
    .map((l) => l.latencyMs as number)
    .sort((a, b) => a - b);

  const p50 = percentile(latencies, 50);
  const p95 = percentile(latencies, 95);
  const avgLatencyMs =
    latencies.length > 0
      ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length)
      : 0;

  const allLogs = await prisma.projectExtractionLog.count({
    where: { status: 'done' },
  });

  const lastRunAt = logs[0]?.updatedAt ?? null;

  const anonymizeSamples = logs
    .map((l) => l.anonymizeMs)
    .filter((v): v is number => v !== null);
  const avgAnonymizeMs =
    anonymizeSamples.length > 0
      ? Math.round(anonymizeSamples.reduce((a, b) => a + b, 0) / anonymizeSamples.length)
      : null;

  const n8nSamples = logs
    .map((l) => l.n8nTriggerMs)
    .filter((v): v is number => v !== null);
  const avgN8nTriggerMs =
    n8nSamples.length > 0
      ? Math.round(n8nSamples.reduce((a, b) => a + b, 0) / n8nSamples.length)
      : null;

  return NextResponse.json({
    p50,
    p95,
    avgLatencyMs,
    totalRuns: allLogs,
    lastRunAt,
    avgAnonymizeMs,
    avgN8nTriggerMs,
    sampleSize: latencies.length,
  });
}
