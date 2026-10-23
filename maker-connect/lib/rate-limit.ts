import IORedis from 'ioredis';
import { NextResponse } from 'next/server';

// Janela fixa no Redis (INCR + EXPIRE): simples, compartilhada entre instancias e
// suficiente para frear forca bruta no login e abuso das rotas caras (IA, PDF).
// Fail-open: se o Redis cair, a requisicao passa (disponibilidade > limite), com log.

let client: IORedis | null = null;

function getClient(): IORedis {
  if (!client) {
    client = new IORedis(process.env.REDIS_URL || 'redis://127.0.0.1:6379', {
      lazyConnect: true,
      connectTimeout: 2000,
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
    });
    client.on('error', () => {}); // erros tratados em checkRateLimit
  }
  return client;
}

export type RateLimitRule = { name: string; limit: number; windowSeconds: number };

export const RATE_LIMITS = {
  loginByIp: { name: 'login-ip', limit: 20, windowSeconds: 15 * 60 },
  loginByEmail: { name: 'login-email', limit: 5, windowSeconds: 15 * 60 },
  signupByIp: { name: 'signup-ip', limit: 5, windowSeconds: 60 * 60 },
  extractByUser: { name: 'extract-user', limit: 10, windowSeconds: 60 * 60 },
  exportByUser: { name: 'export-user', limit: 20, windowSeconds: 60 * 60 },
} satisfies Record<string, RateLimitRule>;

export type RateLimitResult = { allowed: boolean; retryAfterSeconds: number };

export async function checkRateLimit(rule: RateLimitRule, key: string): Promise<RateLimitResult> {
  const redisKey = `rl:${rule.name}:${key}`;
  try {
    const redis = getClient();
    if (redis.status === 'wait') await redis.connect();
    const count = await redis.incr(redisKey);
    if (count === 1) await redis.expire(redisKey, rule.windowSeconds);
    if (count <= rule.limit) return { allowed: true, retryAfterSeconds: 0 };
    const ttl = await redis.ttl(redisKey);
    return { allowed: false, retryAfterSeconds: ttl > 0 ? ttl : rule.windowSeconds };
  } catch (error) {
    console.warn(`rate-limit ${rule.name} indisponivel, liberando requisicao`, error);
    return { allowed: true, retryAfterSeconds: 0 };
  }
}

export function tooManyRequests(retryAfterSeconds: number) {
  const minutes = Math.max(1, Math.ceil(retryAfterSeconds / 60));
  return NextResponse.json(
    { error: `Muitas tentativas. Tente novamente em ${minutes} min.` },
    { status: 429, headers: { 'Retry-After': String(retryAfterSeconds) } }
  );
}

// nginx sobrescreve X-Real-IP com o IP da conexao (nao da para forjar);
// X-Forwarded-For e so fallback, porque o cliente controla o valor mais a esquerda.
export function clientIp(req: Request): string {
  return (
    req.headers.get('x-real-ip')?.trim() ||
    req.headers.get('x-forwarded-for')?.split(',').pop()?.trim() ||
    'unknown'
  );
}
