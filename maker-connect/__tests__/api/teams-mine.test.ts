jest.mock('@/lib/prisma', () => ({
  prisma: {
    teamMember: {
      findMany: jest.fn(),
    },
  },
}));

jest.mock('@/lib/auth', () => ({ getSession: jest.fn() }));

import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { GET } from '@/app/api/teams/mine/route';

afterEach(() => jest.clearAllMocks());

describe('GET /api/teams/mine', () => {
  it('retorna 401 sem sessão', async () => {
    (getSession as jest.Mock).mockResolvedValue(null);
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it('retorna equipes onde o usuário é membro aprovado', async () => {
    (getSession as jest.Mock).mockResolvedValue({ userId: 5 });
    (prisma.teamMember.findMany as jest.Mock).mockResolvedValue([
      { team: { id: 1, name: 'Robótica UFSC' } },
      { team: { id: 2, name: 'SteelBots Arena' } },
    ]);

    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toEqual([
      { id: 1, name: 'Robótica UFSC' },
      { id: 2, name: 'SteelBots Arena' },
    ]);
    expect(prisma.teamMember.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: 5, status: 'approved' } })
    );
  });
});
