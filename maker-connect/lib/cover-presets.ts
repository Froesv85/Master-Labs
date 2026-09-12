// Lista de capas pre-carregadas (public/covers/, geradas por scripts/render-cover-presets.mjs).
// Fonte unica: components/cover-picker.tsx usa isso pra renderizar as miniaturas, e as
// rotas de criacao de Comunidade/Equipe usam pra validar que coverPresetUrl e um preset
// de verdade (evita aceitar qualquer URL arbitraria vinda do cliente).
export const COVER_PRESET_URLS = [
  '/covers/preset-1.png',
  '/covers/preset-2.png',
  '/covers/preset-3.png',
  '/covers/preset-4.png',
  '/covers/preset-5.png',
  '/covers/preset-6.png',
];

export function isValidCoverPreset(url: string): boolean {
  return COVER_PRESET_URLS.includes(url);
}
