import { cache } from 'react';
import { prisma } from '@/lib/prisma';

// Tempos das animacoes do Nodo, editaveis pelo admin em /admin/metrics.
// Sempre passam por normalizeUiSettings: valor fora da faixa e "puxado" para o
// limite, campo ausente ou invalido volta ao padrao.

export const UI_SETTINGS_KEY = 'ui.nodo';

export type UiSettings = {
  welcomeMs: number; // tela de boas-vindas apos login/cadastro
  minRideMs: number; // tempo minimo do Nodo na trilha durante a navegacao
  celebrateMs: number; // comemoracao ao chegar (inclui a queda de 600ms no fim)
  pageTransitionMs: number; // deslize do conteudo entre telas
};

export const UI_SETTINGS_DEFAULTS: UiSettings = {
  welcomeMs: 10_000,
  minRideMs: 1_200,
  celebrateMs: 1_600,
  pageTransitionMs: 700,
};

export const UI_SETTINGS_LIMITS: Record<keyof UiSettings, { min: number; max: number }> = {
  welcomeMs: { min: 0, max: 30_000 },
  minRideMs: { min: 0, max: 5_000 },
  celebrateMs: { min: 600, max: 5_000 },
  pageTransitionMs: { min: 0, max: 2_000 },
};

export function normalizeUiSettings(input: unknown): UiSettings {
  const src = (input && typeof input === 'object' ? input : {}) as Record<string, unknown>;
  const out = { ...UI_SETTINGS_DEFAULTS };
  for (const key of Object.keys(UI_SETTINGS_DEFAULTS) as (keyof UiSettings)[]) {
    const raw = src[key];
    if (typeof raw !== 'number' || !Number.isFinite(raw)) continue;
    const { min, max } = UI_SETTINGS_LIMITS[key];
    out[key] = Math.round(Math.min(max, Math.max(min, raw)));
  }
  return out;
}

// cache(): o layout e a pagina leem uma vez por requisicao
export const getUiSettings = cache(async (): Promise<UiSettings> => {
  try {
    const row = await prisma.appSetting.findUnique({ where: { key: UI_SETTINGS_KEY } });
    return row ? normalizeUiSettings(JSON.parse(row.value)) : UI_SETTINGS_DEFAULTS;
  } catch (error) {
    // banco fora ou JSON corrompido: o app segue com os padroes
    console.error('getUiSettings failed', error);
    return UI_SETTINGS_DEFAULTS;
  }
});

export async function saveUiSettings(settings: UiSettings, updatedById: number) {
  const value = JSON.stringify(settings);
  await prisma.appSetting.upsert({
    where: { key: UI_SETTINGS_KEY },
    create: { key: UI_SETTINGS_KEY, value, updatedById },
    update: { value, updatedById },
  });
}

// Variaveis CSS lidas por globals.css (transicao de telas e queda do Nodo)
export function uiSettingsCss(s: UiSettings): string {
  return `:root{--vt-ms:${s.pageTransitionMs}ms;--nodo-celebrate-ms:${s.celebrateMs}ms;--nodo-drop-delay-ms:${Math.max(0, s.celebrateMs - 600)}ms}`;
}
