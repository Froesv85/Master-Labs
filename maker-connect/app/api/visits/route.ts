import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { RATE_LIMITS, checkRateLimit, clientIp } from '@/lib/rate-limit';
import { recordVisit } from '@/lib/visits';

// Publica (ver proxy.ts): conta visitas de convidados tambem. Quem decide se a
// visita e autenticada e o servidor, pela sessao — o corpo da requisicao e ignorado.
export async function POST(req: NextRequest) {
  const session = await getSession();
  const authenticated = Boolean(session);

  const limit = await checkRateLimit(RATE_LIMITS.visitByIp, clientIp(req));
  // acima do teto, responde ok sem contar: o tracker nao precisa tratar erro
  if (!limit.allowed) return NextResponse.json({ counted: false, authenticated });

  try {
    await recordVisit(authenticated);
  } catch (error) {
    console.error('POST /api/visits failed', error);
    return NextResponse.json({ counted: false, authenticated });
  }
  return NextResponse.json({ counted: true, authenticated });
}
