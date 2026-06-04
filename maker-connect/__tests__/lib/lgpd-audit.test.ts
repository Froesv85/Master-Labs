jest.mock('@/lib/prisma', () => ({
  prisma: {
    lgpdAuditLog: {
      create: jest.fn(),
    },
  },
}));

import { prisma } from '@/lib/prisma';
import { createLgpdAuditLog } from '@/lib/lgpd-audit';

describe('createLgpdAuditLog', () => {
  afterEach(() => jest.clearAllMocks());

  it('grava log com todos os campos preenchidos', async () => {
    (prisma.lgpdAuditLog.create as jest.Mock).mockResolvedValue({ id: 1 });

    await createLgpdAuditLog({
      action: 'extract',
      projectId: 10,
      userId: 5,
      piiTypes: ['EMAIL', 'CPF'],
      redactions: 2,
      context: 'webhookId=wh_1',
    });

    expect(prisma.lgpdAuditLog.create).toHaveBeenCalledWith({
      data: {
        action: 'extract',
        projectId: 10,
        userId: 5,
        piiTypes: JSON.stringify(['EMAIL', 'CPF']),
        redactions: 2,
        context: 'webhookId=wh_1',
      },
    });
  });

  it('serializa piiTypes como JSON string', async () => {
    (prisma.lgpdAuditLog.create as jest.Mock).mockResolvedValue({ id: 2 });

    await createLgpdAuditLog({
      action: 'extract',
      piiTypes: ['PHONE'],
      redactions: 1,
    });

    const call = (prisma.lgpdAuditLog.create as jest.Mock).mock.calls[0][0];
    expect(call.data.piiTypes).toBe('["PHONE"]');
  });

  it('grava piiTypes como null quando array vazio', async () => {
    (prisma.lgpdAuditLog.create as jest.Mock).mockResolvedValue({ id: 3 });

    await createLgpdAuditLog({
      action: 'extract',
      piiTypes: [],
      redactions: 0,
    });

    const call = (prisma.lgpdAuditLog.create as jest.Mock).mock.calls[0][0];
    expect(call.data.piiTypes).toBeNull();
  });

  it('usa null para projectId e userId quando omitidos', async () => {
    (prisma.lgpdAuditLog.create as jest.Mock).mockResolvedValue({ id: 4 });

    await createLgpdAuditLog({
      action: 'search',
      piiTypes: [],
      redactions: 0,
    });

    const call = (prisma.lgpdAuditLog.create as jest.Mock).mock.calls[0][0];
    expect(call.data.projectId).toBeNull();
    expect(call.data.userId).toBeNull();
    expect(call.data.context).toBeNull();
  });

  it('retorna o resultado do prisma.create', async () => {
    const fakeRecord = { id: 99, action: 'extract', redactions: 0 };
    (prisma.lgpdAuditLog.create as jest.Mock).mockResolvedValue(fakeRecord);

    const result = await createLgpdAuditLog({
      action: 'extract',
      piiTypes: [],
      redactions: 0,
    });

    expect(result).toEqual(fakeRecord);
  });
});
