import { randomBytes } from 'crypto';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

const STATE_COOKIE_NAME = 'mc_oauth_state';
const STATE_MAX_AGE = 60 * 10; // 10 minutes

export function getAppUrl(req: NextRequest) {
  // Must match the origin the user's browser actually used — this is a
  // browser-redirect flow, unlike server-to-server webhook URLs (which use
  // API_URL and may point at an internal/Docker host).
  return req.nextUrl.origin;
}

export function generateState() {
  return randomBytes(24).toString('hex');
}

export function stateCookieOptions(value: string) {
  return {
    name: STATE_COOKIE_NAME,
    value,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: STATE_MAX_AGE,
    path: '/',
  };
}

export function clearStateCookieOptions() {
  return {
    name: STATE_COOKIE_NAME,
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: 0,
    path: '/',
  };
}

export function readState(req: NextRequest) {
  return req.cookies.get(STATE_COOKIE_NAME)?.value ?? null;
}

export type OAuthProfile = {
  providerId: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  githubUrl?: string | null;
};

export async function fetchGoogleProfile(accessToken: string): Promise<OAuthProfile> {
  const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error('Falha ao obter perfil do Google');
  const data = await res.json() as {
    sub: string;
    email?: string;
    email_verified?: boolean;
    name?: string;
    picture?: string;
  };
  if (!data.email || !data.email_verified) {
    throw new Error('Email do Google não verificado');
  }
  return {
    providerId: data.sub,
    email: data.email.toLowerCase(),
    name: data.name ?? null,
    avatarUrl: data.picture ?? null,
  };
}

export async function fetchGithubProfile(accessToken: string): Promise<OAuthProfile> {
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    Accept: 'application/vnd.github+json',
  };
  const userRes = await fetch('https://api.github.com/user', { headers });
  if (!userRes.ok) throw new Error('Falha ao obter perfil do GitHub');
  const user = await userRes.json() as {
    id: number;
    login: string;
    name?: string | null;
    avatar_url?: string | null;
    email?: string | null;
  };

  let email = user.email;
  if (!email) {
    const emailsRes = await fetch('https://api.github.com/user/emails', { headers });
    if (emailsRes.ok) {
      const emails = await emailsRes.json() as { email: string; primary: boolean; verified: boolean }[];
      const primary = emails.find((e) => e.primary && e.verified) ?? emails.find((e) => e.verified);
      email = primary?.email ?? null;
    }
  }

  if (!email) {
    throw new Error('Não foi possível obter um email verificado do GitHub');
  }

  return {
    providerId: String(user.id),
    email: email.toLowerCase(),
    name: user.name ?? user.login,
    avatarUrl: user.avatar_url ?? null,
    githubUrl: `https://github.com/${user.login}`,
  };
}

type Provider = 'google' | 'github';

export async function findOrCreateOAuthUser(provider: Provider, profile: OAuthProfile) {
  const byProviderId = await prisma.user.findUnique({
    where:
      provider === 'google'
        ? { googleId: profile.providerId }
        : { githubId: profile.providerId },
  });
  if (byProviderId) return byProviderId;

  const providerIdData =
    provider === 'google' ? { googleId: profile.providerId } : { githubId: profile.providerId };

  const byEmail = await prisma.user.findUnique({ where: { email: profile.email } });
  if (byEmail) {
    return prisma.user.update({
      where: { id: byEmail.id },
      data: providerIdData,
    });
  }

  return prisma.user.create({
    data: {
      email: profile.email,
      name: profile.name,
      ...providerIdData,
      profile: {
        create: {
          avatarUrl: profile.avatarUrl ?? undefined,
          githubUrl: profile.githubUrl ?? undefined,
        },
      },
    },
  });
}
