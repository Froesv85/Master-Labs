import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateEmbedding } from '@/lib/ollama';
import { queryByEmbedding } from '@/lib/pinecone';

type SearchBody = {
  query?: string;
  topK?: number;
  category?: string;
};

function normalizeQuery(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, 512);
}

function parseTopK(value: unknown): number {
  const n = Number(value);
  if (!Number.isInteger(n) || n < 1) return 5;
  return Math.min(n, 20);
}

export async function POST(req: NextRequest) {
  let body: SearchBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const query = normalizeQuery(body.query);
  if (query.length < 3) {
    return NextResponse.json(
      { error: 'query must have at least 3 characters.' },
      { status: 400 }
    );
  }

  const topK = parseTopK(body.topK);
  const category = typeof body.category === 'string' ? body.category : undefined;

  const startedAt = Date.now();

  // 1. Generate embedding for the search query
  let embedding: number[];
  try {
    embedding = await generateEmbedding(query);
  } catch (err) {
    console.error('Ollama embedding failed:', err);
    return NextResponse.json(
      { error: 'Failed to generate embedding. Ollama may be unavailable.' },
      { status: 502 }
    );
  }

  // 2. Query Pinecone for semantically similar components
  let pineconeMatches: Awaited<ReturnType<typeof queryByEmbedding>>;
  try {
    pineconeMatches = await queryByEmbedding(embedding, topK);
  } catch (err) {
    console.error('Pinecone query failed:', err);
    return NextResponse.json(
      { error: 'Failed to query vector database.' },
      { status: 502 }
    );
  }

  // 3. Keyword search for projects in DB (category filter optional)
  const words = query
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length >= 3)
    .slice(0, 5);

  const projectWhere = {
    ...(category ? { category: category as never } : {}),
    OR: words.map((w) => ({
      OR: [
        { title: { contains: w } },
        { description: { contains: w } },
        { content: { contains: w } },
      ],
    })),
  };

  const dbProjects = await prisma.project.findMany({
    where: projectWhere,
    take: topK,
    orderBy: [{ updatedAt: 'desc' }],
    select: {
      id: true,
      title: true,
      description: true,
      category: true,
      embeddingId: true,
      creatorId: true,
      creator: { select: { name: true } },
      votes: { select: { id: true } },
      updatedAt: true,
    },
  });

  const latencyMs = Date.now() - startedAt;

  return NextResponse.json({
    data: {
      query,
      latencyMs,
      components: pineconeMatches.map((m) => ({
        id: m.id,
        score: parseFloat(m.score.toFixed(4)),
        text: m.metadata.text ?? null,
        category: m.metadata.category ?? null,
        metadata: m.metadata,
      })),
      projects: dbProjects.map((p) => ({
        id: p.id,
        title: p.title,
        description: p.description,
        category: p.category,
        creatorName: p.creator.name,
        votes: p.votes.length,
        embeddingId: p.embeddingId,
        updatedAt: p.updatedAt,
      })),
    },
  });
}
