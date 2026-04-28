import { Pinecone } from '@pinecone-database/pinecone';

let _client: Pinecone | null = null;

function getClient(): Pinecone {
  if (!_client) {
    const apiKey = process.env.PINECONE_API_KEY;
    if (!apiKey) throw new Error('PINECONE_API_KEY is not set');
    _client = new Pinecone({ apiKey });
  }
  return _client;
}

export type PineconeMatch = {
  id: string;
  score: number;
  metadata: Record<string, unknown>;
};

export async function queryByEmbedding(
  vector: number[],
  topK = 5
): Promise<PineconeMatch[]> {
  const indexName = process.env.PINECONE_INDEX ?? 'maker-knowledge';
  const idx = getClient().index(indexName);

  const result = await idx.query({
    vector,
    topK,
    includeMetadata: true,
  });

  return (result.matches ?? []).map((m) => ({
    id: m.id,
    score: m.score ?? 0,
    metadata: (m.metadata ?? {}) as Record<string, unknown>,
  }));
}
