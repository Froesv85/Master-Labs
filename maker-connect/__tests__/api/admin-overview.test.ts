jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: { count: jest.fn() },
    project: { count: jest.fn() },
    robot: { count: jest.fn() },
    robotEvent: { count: jest.fn() },
    team: { count: jest.fn() },
    $queryRaw: jest.fn(),
  },
}));

jest.mock('@/lib/admin', () => ({
  getAdminSession: jest.fn().mockResolvedValue({ userId: 1, email: 'admin@test.com', name: 'Admin' }),
}));

jest.mock('@/lib/azure-cost', () => ({
  getAzureCost: jest.fn().mockResolvedValue({ configured: false }),
}));

import { prisma } from '@/lib/prisma';
import { getAdminSession } from '@/lib/admin';
import { GET } from '@/app/api/admin/overview/route';

describe('GET /api/admin/overview', () => {
  afterEach(() => jest.clearAllMocks());

  it('retorna 403 quando o usuário não é admin', async () => {
    (getAdminSession as jest.Mock).mockResolvedValueOnce(null);

    const res = await GET();
    expect(res.status).toBe(403);
  });

  it('retorna contagens e tamanhos de banco consolidados', async () => {
    (prisma.user.count as jest.Mock).mockResolvedValue(5);
    (prisma.project.count as jest.Mock).mockResolvedValue(64);
    (prisma.robot.count as jest.Mock).mockResolvedValue(5);
    (prisma.robotEvent.count as jest.Mock).mockResolvedValue(3);
    (prisma.team.count as jest.Mock).mockResolvedValue(3);
    (prisma.$queryRaw as jest.Mock)
      .mockResolvedValueOnce([{ schemaName: 'maker', sizeMb: 1.44, tableCount: BigInt(27) }])
      .mockResolvedValueOnce([{ tableName: 'Project', sizeMb: 0.11, rowsEstimate: BigInt(64) }]);

    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.counts).toEqual({ users: 5, projects: 64, robots: 5, competitions: 3, teams: 3 });
    expect(body.databases).toEqual([{ schema: 'maker', sizeMb: 1.44, tables: 27 }]);
    expect(body.topTables).toEqual([{ table: 'Project', sizeMb: 0.11, rowsEstimate: 64 }]);
    expect(body.azure).toEqual({ configured: false });
  });

  it('retorna 500 quando o banco lança exceção', async () => {
    (prisma.user.count as jest.Mock).mockRejectedValue(new Error('DB error'));

    const res = await GET();
    expect(res.status).toBe(500);
  });
});
