import { NextRequest } from 'next/server';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    robot: {
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
    },
    robotImage: { create: jest.fn() },
    robotComponent: { createMany: jest.fn() },
    robotAward: { createMany: jest.fn() },
    robotEvent: { create: jest.fn() },
    robotEventParticipation: { create: jest.fn() },
  },
}));

jest.mock('@/lib/auth', () => ({
  getSession: jest.fn().mockResolvedValue({ userId: 1 }),
}));

jest.mock('@/lib/project-media', () => ({
  uploadProjectImage: jest.fn(),
}));

import { prisma } from '@/lib/prisma';
import { GET, POST } from '@/app/api/robots/route';

const mockRobot = {
  id: 1,
  name: 'TitanBot',
  description: 'Robô de combate peso médio',
  category: 'combat',
  ownerId: 1,
  owner: { id: 1, name: 'Bob Builder' },
  eloScore: 1250,
  wins: 10,
  losses: 2,
  draws: 1,
  awards: [],
  _count: { matches: 13 },
  status: 'active',
  imageUrl: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

function makeRequest(url: string, init?: RequestInit) {
  return new NextRequest(new URL(url, 'http://localhost:3000'), init);
}

describe('GET /api/robots', () => {
  beforeEach(() => {
    (prisma.robot.findMany as jest.Mock).mockResolvedValue([mockRobot]);
    (prisma.robot.count as jest.Mock).mockResolvedValue(1);
  });

  afterEach(() => jest.clearAllMocks());

  it('retorna lista de robôs com status 200', async () => {
    const res = await GET(makeRequest('http://localhost:3000/api/robots'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.robots).toHaveLength(1);
    expect(body.robots[0].name).toBe('TitanBot');
    expect(body.total).toBe(1);
  });

  it('filtra por categoria quando passada na query', async () => {
    await GET(makeRequest('http://localhost:3000/api/robots?category=sumo'));
    expect(prisma.robot.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { category: 'sumo' } })
    );
  });
});

describe('POST /api/robots', () => {
  afterEach(() => jest.clearAllMocks());

  it('cria robô e retorna 201', async () => {
    (prisma.robot.create as jest.Mock).mockResolvedValue(mockRobot);
    (prisma.robot.findUnique as jest.Mock).mockResolvedValue(mockRobot);

    const req = makeRequest('http://localhost:3000/api/robots', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'TitanBot', category: 'combat' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.name).toBe('TitanBot');
  });

  it('retorna 400 quando nome está ausente', async () => {
    const req = makeRequest('http://localhost:3000/api/robots', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: '', category: 'combat' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/nome/i);
  });

  it('retorna 400 quando categoria está ausente', async () => {
    const req = makeRequest('http://localhost:3000/api/robots', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'AlphaBot' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/categoria/i);
  });
});
