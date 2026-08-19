import { NextRequest } from 'next/server';

const mockFindUnique = jest.fn();
const mockCompare = jest.fn();
const mockSignSession = jest.fn();

jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: mockFindUnique,
    },
  },
}));

jest.mock('@/lib/auth', () => ({
  signSession: mockSignSession,
  sessionCookieOptions: jest.fn(() => ({ name: 'mc_session', value: 'token' })),
}));

import { POST } from '@/app/api/auth/login/route';

describe('POST /api/auth/login', () => {
  afterEach(() => jest.clearAllMocks());

  it('retorna 401 quando o usuário existe mas não possui senha cadastrada', async () => {
    mockFindUnique.mockResolvedValue({ id: 1, email: 'test@example.com', name: 'Test', password: null });

    const req = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@example.com', password: 'password123' }),
    });

    const res = await POST(req);

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toMatch(/incorretos/i);
  });
});
