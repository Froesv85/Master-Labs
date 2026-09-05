jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => ({
    connect: jest.fn().mockRejectedValue(new Error('connect ECONNREFUSED')),
    disconnect: jest.fn(),
  }));
});

import { getRedisStats, getMinioStats, getPineconeStats } from '@/lib/infra-stats';

describe('infra-stats: configuração ausente', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('getRedisStats retorna erro quando a conexão falha', async () => {
    delete process.env.REDIS_URL;
    const result = await getRedisStats();
    expect(result).toEqual({ configured: true, error: 'connect ECONNREFUSED' });
  });

  it('getMinioStats retorna configured:false sem S3_ENDPOINT', async () => {
    delete process.env.S3_ENDPOINT;
    delete process.env.S3_INTERNAL_ENDPOINT;
    const result = await getMinioStats();
    expect(result).toEqual({ configured: false });
  });

  it('getPineconeStats retorna configured:false sem PINECONE_API_KEY', async () => {
    delete process.env.PINECONE_API_KEY;
    const result = await getPineconeStats();
    expect(result).toEqual({ configured: false });
  });
});
