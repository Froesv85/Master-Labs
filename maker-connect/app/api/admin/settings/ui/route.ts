import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/admin';
import {
  UI_SETTINGS_DEFAULTS,
  UI_SETTINGS_LIMITS,
  getUiSettings,
  normalizeUiSettings,
  saveUiSettings,
  type UiSettings,
} from '@/lib/ui-settings';

// Tempos das animacoes do Nodo (painel /admin/metrics). So admin le e grava.
export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Acesso restrito ao administrador' }, { status: 403 });
  }
  return NextResponse.json({
    data: await getUiSettings(),
    defaults: UI_SETTINGS_DEFAULTS,
    limits: UI_SETTINGS_LIMITS,
  });
}

export async function PUT(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Acesso restrito ao administrador' }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Corpo inválido' }, { status: 400 });
  }

  // recusa (em vez de corrigir em silencio) valor que nao e numero ou esta fora da faixa
  for (const key of Object.keys(UI_SETTINGS_DEFAULTS) as (keyof UiSettings)[]) {
    const v = (body as Record<string, unknown>)[key];
    const { min, max } = UI_SETTINGS_LIMITS[key];
    if (typeof v !== 'number' || !Number.isFinite(v) || v < min || v > max) {
      return NextResponse.json(
        { error: `${key} deve ser um número entre ${min} e ${max} ms` },
        { status: 400 }
      );
    }
  }

  const settings = normalizeUiSettings(body);
  await saveUiSettings(settings, session.userId);
  return NextResponse.json({ data: settings });
}
