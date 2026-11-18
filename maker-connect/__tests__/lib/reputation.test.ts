jest.mock('@/lib/prisma', () => ({
  prisma: {
    project: { count: jest.fn() },
    projectVote: { count: jest.fn() },
    userFollow: { count: jest.fn() },
    robotAward: { count: jest.fn() },
    userProfile: { findUnique: jest.fn(), upsert: jest.fn() },
  },
}));

import { prisma } from '@/lib/prisma';
import { computeReputation, levelFor, syncReputation } from '@/lib/reputation';

function mockCounts({ projects = 0, forks = 0, votes = 0, followers = 0, awards = 0 }) {
  // project.count e chamado 2x: projetos publicos e forks recebidos (nessa ordem)
  (prisma.project.count as jest.Mock).mockResolvedValueOnce(projects).mockResolvedValueOnce(forks);
  (prisma.projectVote.count as jest.Mock).mockResolvedValue(votes);
  (prisma.userFollow.count as jest.Mock).mockResolvedValue(followers);
  (prisma.robotAward.count as jest.Mock).mockResolvedValue(awards);
}

beforeEach(() => jest.clearAllMocks());

describe('reputação', () => {
  it('níveis pelos limiares', () => {
    expect(levelFor(0)).toBe('apprentice');
    expect(levelFor(99)).toBe('apprentice');
    expect(levelFor(100)).toBe('journeyman');
    expect(levelFor(500)).toBe('master');
    expect(levelFor(1500)).toBe('grandmaster');
  });

  it('soma os pontos e indica o próximo nível', async () => {
    mockCounts({ projects: 2, votes: 3, forks: 1, followers: 4, awards: 1 });
    const rep = await computeReputation(7);
    // 2*5 + 3*10 + 1*15 + 4*5 + 1*20 = 95
    expect(rep.total).toBe(95);
    expect(rep.level).toBe('apprentice');
    expect(rep.nextLevel).toEqual({ level: 'journeyman', min: 100 });
  });

  it('não conta voto nem fork do próprio usuário', async () => {
    mockCounts({});
    await computeReputation(7);
    expect(prisma.projectVote.count).toHaveBeenCalledWith({ where: { project: { creatorId: 7 }, userId: { not: 7 } } });
    expect(prisma.project.count).toHaveBeenCalledWith({ where: { parent: { creatorId: 7 }, creatorId: { not: 7 } } });
  });

  it('grava no perfil só quando muda', async () => {
    mockCounts({ followers: 1 });
    (prisma.userProfile.findUnique as jest.Mock).mockResolvedValue({ reputation: 5, makerLevel: 'apprentice' });
    await syncReputation(7);
    expect(prisma.userProfile.upsert).not.toHaveBeenCalled();

    mockCounts({ followers: 30 });
    (prisma.userProfile.findUnique as jest.Mock).mockResolvedValue({ reputation: 5, makerLevel: 'apprentice' });
    await syncReputation(7);
    expect(prisma.userProfile.upsert).toHaveBeenCalledWith(expect.objectContaining({
      where: { userId: 7 },
      update: { reputation: 150, makerLevel: 'journeyman' },
    }));
  });
});
