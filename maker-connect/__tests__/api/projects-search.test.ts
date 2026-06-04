import { NextRequest } from 'next/server';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    project: {
      findMany: jest.fn(),
    },
  },
}));

jest.mock('@/lib/ollama', () => ({
  generateEmbedding: jest.fn(),
}));

jest.mock('@/lib/pinecone', () => ({
  queryByEmbedding: jest.fn(),
}));

import { prisma } from '@/lib/prisma';
import { generateEmbedding } from '@/lib/ollama';
import { queryByEmbedding } from '@/lib/pinecone';
import { POST } from '@/app/api/projects/search/route';

function makeRequest(body: unknown) {
  return new NextRequest('http://localhost:3000/api/projects/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

const mockEmbedding = Array.from({ length: 768 }, (_, i) => i * 0.001);

const mockPineconeMatches = [
  { id: 'comp_esp32_wroom', score: 0.93, metadata: { text: 'ESP32 MCU', category: 'MCU' } },
  { id: 'comp_dht22', score: 0.78, metadata: { text: 'DHT22 sensor', category: 'Sensor' } },
];

const mockProjects = [
  {
    id: 12,
    title: 'ESP32 Home Automation',
    description: 'Sistema IoT',
    category: 'IoT',
    embeddingId: 'emb_12_xxx',
    creatorId: 4,
    creator: { name: 'Pedro IoT' },
    votes: [{ id: 1 }],
    updatedAt: new Date('2026-04-28'),
  },
];

describe('POST /api/projects/search', () => {
  beforeEach(() => {
    (generateEmbedding as jest.Mock).mockResolvedValue(mockEmbedding);
    (queryByEmbedding as jest.Mock).mockResolvedValue(mockPineconeMatches);
    (prisma.project.findMany as jest.Mock).mockResolvedValue(mockProjects);
  });

  afterEach(() => jest.clearAllMocks());

  it('retorna 400 para query com menos de 3 caracteres', async () => {
    const res = await POST(makeRequest({ query: 'ab' }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/3/);
  });

  it('retorna 400 para body JSON inválido', async () => {
    const req = new NextRequest('http://localhost:3000/api/projects/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'not-json',
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('gera embedding, consulta Pinecone e retorna 200 com dados', async () => {
    const res = await POST(makeRequest({ query: 'ESP32 IoT automação', topK: 2 }));
    expect(res.status).toBe(200);

    expect(generateEmbedding).toHaveBeenCalledWith('ESP32 IoT automação');
    expect(queryByEmbedding).toHaveBeenCalledWith(mockEmbedding, 2);

    const body = await res.json();
    expect(body.data.query).toBe('ESP32 IoT automação');
    expect(body.data.components).toHaveLength(2);
    expect(body.data.components[0].id).toBe('comp_esp32_wroom');
    expect(body.data.components[0].score).toBe(0.93);
    expect(body.data.projects).toHaveLength(1);
    expect(body.data.projects[0].title).toBe('ESP32 Home Automation');
    expect(body.data.latencyMs).toBeGreaterThanOrEqual(0);
  });

  it('limita topK ao máximo de 20', async () => {
    await POST(makeRequest({ query: 'sensor IoT temperatura', topK: 100 }));
    expect(queryByEmbedding).toHaveBeenCalledWith(mockEmbedding, 20);
  });

  it('usa topK=5 como padrão', async () => {
    await POST(makeRequest({ query: 'Arduino motor stepper' }));
    expect(queryByEmbedding).toHaveBeenCalledWith(mockEmbedding, 5);
  });

  it('retorna 502 quando Ollama falha', async () => {
    (generateEmbedding as jest.Mock).mockRejectedValue(new Error('connection refused'));
    const res = await POST(makeRequest({ query: 'teste de falha do ollama' }));
    expect(res.status).toBe(502);
    const body = await res.json();
    expect(body.error).toMatch(/ollama/i);
  });

  it('retorna 502 quando Pinecone falha', async () => {
    (queryByEmbedding as jest.Mock).mockRejectedValue(new Error('pinecone timeout'));
    const res = await POST(makeRequest({ query: 'sensor temperatura arduino' }));
    expect(res.status).toBe(502);
    const body = await res.json();
    expect(body.error).toMatch(/vector/i);
  });

  it('mapeia corretamente votes para número inteiro na resposta', async () => {
    const res = await POST(makeRequest({ query: 'ESP32 automação residencial' }));
    const body = await res.json();
    expect(typeof body.data.projects[0].votes).toBe('number');
    expect(body.data.projects[0].votes).toBe(1);
  });
});
