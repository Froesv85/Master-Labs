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

const mockCheckRateLimit = jest.fn();
jest.mock('@/lib/rate-limit', () => ({
  RATE_LIMITS: { loginByIp: { name: 'login-ip' }, loginByEmail: { name: 'login-email' } },
  checkRateLimit: (...args: unknown[]) => mockCheckRateLimit(...args),
  clientIp: () => '203.0.113.7',
  tooManyRequests: jest.requireActual('@/lib/rate-limit').tooManyRequests,
}));

import { POST } from '@/app/api/auth/login/route';

beforeEach(() => mockCheckRateLimit.mockResolvedValue({ allowed: true, retryAfterSeconds: 0 }));

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

describe('limite de tentativas no login', () => {
  afterEach(() => jest.clearAllMocks());

  function loginRequest() {
    return new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'Alvo@Example.com', password: 'chute123' }),
    });
  }

  it('conta tentativas por IP e por e-mail normalizado', async () => {
    mockFindUnique.mockResolvedValue(null);
    await POST(loginRequest());
    const keys = mockCheckRateLimit.mock.calls.map((c) => c[1]);
    expect(keys).toEqual(expect.arrayContaining(['203.0.113.7', 'alvo@example.com']));
  });

  it('responde 429 sem consultar o banco quando o e-mail estourou o limite', async () => {
    mockCheckRateLimit
      .mockResolvedValueOnce({ allowed: true, retryAfterSeconds: 0 })
      .mockResolvedValueOnce({ allowed: false, retryAfterSeconds: 600 });
    const res = await POST(loginRequest());
    expect(res.status).toBe(429);
    expect(res.headers.get('Retry-After')).toBe('600');
    expect(mockFindUnique).not.toHaveBeenCalled();
    expect(mockCompare).not.toHaveBeenCalled();
  });
});
