// Destino pos-login vindo da URL (?next=). So aceita caminho interno: "/x" sim,
// "//evil.com", "/\evil.com" e URLs absolutas nao (open redirect).
export function safeNextPath(raw: string | null | undefined, fallback = '/projects'): string {
  if (!raw || !raw.startsWith('/') || raw.startsWith('//') || raw.startsWith('/\\')) return fallback;
  return raw;
}
