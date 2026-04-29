import { NextRequest } from 'next/server';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    projectExtractionLog: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    lgpdAuditLog: {
      create: jest.fn(),
    },
  },
}));

import { prisma } from '@/lib/prisma';
import { POST } from '@/app/api/projects/[id]/extract/callback/route';

function makeRequest(body: unknown) {
  return new NextRequest('http://localhost:3000/api/projects/1/extract/callback', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

const params = Promise.resolve({ id: '1' });

const mockLog = { id: 10, projectId: 1 };

describe('POST /api/projects/[id]/extract/callback', () => {
  afterEach(() => jest.clearAllMocks());

  it('retorna 400 para body JSON inválido', async () => {
    const req = new NextRequest('http://localhost:3000/api/projects/1/extract/callback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'not-json',
    });
    const res = await POST(req, { params });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/JSON/i);
  });

  it('retorna 400 quando webhookId está ausente', async () => {
    const res = await POST(makeRequest({ status: 'done' }), { params });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/webhookId/i);
  });

  it('retorna 400 para status inválido', async () => {
    const res = await POST(makeRequest({ webhookId: 'wh_1', status: 'pending' }), { params });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/status/i);
  });

  it('retorna 404 quando webhookId não existe no banco', async () => {
    (prisma.projectExtractionLog.findUnique as jest.Mock).mockResolvedValue(null);
    const res = await POST(makeRequest({ webhookId: 'wh_inexistente', status: 'done' }), { params });
    expect(res.status).toBe(404);
  });

  it('retorna 404 quando projectId não bate com o log', async () => {
    (prisma.projectExtractionLog.findUnique as jest.Mock).mockResolvedValue({
      id: 10,
      projectId: 99, // projectId diferente do :id da URL (1)
    });
    const res = await POST(makeRequest({ webhookId: 'wh_1', status: 'done' }), { params });
    expect(res.status).toBe(404);
  });

  it('atualiza log para done e retorna 200', async () => {
    (prisma.projectExtractionLog.findUnique as jest.Mock).mockResolvedValue(mockLog);
    (prisma.projectExtractionLog.update as jest.Mock).mockResolvedValue({});

    const res = await POST(
      makeRequest({
        webhookId: 'wh_1',
        status: 'done',
        output: { components: ['ESP32'] },
        n8nExecutionId: 'exec_123',
        latencyMs: 5000,
      }),
      { params }
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);

    expect(prisma.projectExtractionLog.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: mockLog.id },
        data: expect.objectContaining({
          status: 'done',
          n8nExecutionId: 'exec_123',
          latencyMs: 5000,
        }),
      })
    );
  });

  it('anonymiza PII no output e grava audit log', async () => {
    (prisma.projectExtractionLog.findUnique as jest.Mock).mockResolvedValue(mockLog);
    (prisma.projectExtractionLog.update as jest.Mock).mockResolvedValue({});
    (prisma.lgpdAuditLog.create as jest.Mock).mockResolvedValue({});

    await POST(
      makeRequest({
        webhookId: 'wh_pii',
        status: 'done',
        output: { description: 'Contato: maker@example.com, CPF: 123.456.789-09' },
      }),
      { params }
    );

    const updateCall = (prisma.projectExtractionLog.update as jest.Mock).mock.calls[0][0];
    expect(updateCall.data.output).not.toContain('maker@example.com');
    expect(updateCall.data.output).toContain('[EMAIL_REDACTED]');
    expect(updateCall.data.piiRedactions).toBeGreaterThan(0);

    expect(prisma.lgpdAuditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: 'extract',
          projectId: 1,
          redactions: expect.any(Number),
        }),
      })
    );
  });

  it('não grava audit log quando status é failed', async () => {
    (prisma.projectExtractionLog.findUnique as jest.Mock).mockResolvedValue(mockLog);
    (prisma.projectExtractionLog.update as jest.Mock).mockResolvedValue({});

    await POST(
      makeRequest({ webhookId: 'wh_fail', status: 'failed', error: 'timeout' }),
      { params }
    );

    expect(prisma.lgpdAuditLog.create).not.toHaveBeenCalled();
  });

  it('atualiza log para failed com mensagem de erro', async () => {
    (prisma.projectExtractionLog.findUnique as jest.Mock).mockResolvedValue(mockLog);
    (prisma.projectExtractionLog.update as jest.Mock).mockResolvedValue({});

    const res = await POST(
      makeRequest({ webhookId: 'wh_1', status: 'failed', error: 'OOM no Ollama' }),
      { params }
    );

    expect(res.status).toBe(200);
    expect(prisma.projectExtractionLog.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'failed', error: 'OOM no Ollama' }),
      })
    );
  });

  it('retorna 400 para projectId inválido na URL', async () => {
    const badParams = Promise.resolve({ id: 'abc' });
    const res = await POST(makeRequest({ webhookId: 'wh_1', status: 'done' }), {
      params: badParams,
    });
    expect(res.status).toBe(400);
  });
});
