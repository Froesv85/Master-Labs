import { NextRequest, NextResponse } from 'next/server';
import { sessionCookieOptions, signSession } from '@/lib/auth';
import {
  clearStateCookieOptions,
  fetchGoogleProfile,
  findOrCreateOAuthUser,
  getAppUrl,
  readState,
} from '@/lib/oauth';

export async function GET(req: NextRequest) {
  const appUrl = getAppUrl(req);
  const loginError = (reason: string) =>
    NextResponse.redirect(`${appUrl}/login?error=${encodeURIComponent(reason)}`);

  const code = req.nextUrl.searchParams.get('code');
  const state = req.nextUrl.searchParams.get('state');
  const savedState = readState(req);

  if (!code || !state || !savedState || state !== savedState) {
    return loginError('oauth_state_invalido');
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return loginError('oauth_nao_configurado');
  }

  try {
    const redirectUri = `${appUrl}/api/auth/google/callback`;
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });
    if (!tokenRes.ok) return loginError('oauth_token_falhou');
    const tokenData = await tokenRes.json() as { access_token?: string };
    if (!tokenData.access_token) return loginError('oauth_token_falhou');

    const profile = await fetchGoogleProfile(tokenData.access_token);
    const user = await findOrCreateOAuthUser('google', profile);

    const sessionToken = await signSession({ userId: user.id, email: user.email, name: user.name });
    const res = NextResponse.redirect(`${appUrl}/feed`);
    res.cookies.set(sessionCookieOptions(sessionToken));
    res.cookies.set(clearStateCookieOptions());
    return res;
  } catch {
    return loginError('oauth_falhou');
  }
}
