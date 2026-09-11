// Cliente HTTP para o microsservico Python de Fase 5 (ml-pipeline/). Mesmo estilo de
// lib/ollama.ts: fetch simples com timeout, sem SDK. Diferenca importante: essas
// funcoes NUNCA lancam - o pipeline principal (Ollama/qwen, ja validado em 98% de
// relevancia) tem que continuar funcionando sozinho se o ml-pipeline estiver fora do
// ar, com timeout, ou responder algo inesperado. Qualquer falha vira `null` e quem
// chama trata como "estagio pulado".

const ML_PIPELINE_URL = process.env.ML_PIPELINE_URL ?? 'http://localhost:8001';
const ML_PIPELINE_ENABLED = (process.env.ML_PIPELINE_ENABLED ?? 'true').trim().toLowerCase() !== 'false';
const TIMEOUT_MS = 5000;

export type ClassifyResult = {
  category: string;
  categoryConfidence: number;
  categorySource: 'model' | 'heuristic';
  difficulty: string;
  difficultyScore: number;
  domains: string[];
};

export type MissingSuggestion = {
  item: string;
  reason: string;
  confidence: number;
};

export type ValidateBomResult = {
  missingSuggestions: MissingSuggestion[];
  clusterLabel: string | null;
};

export type AuditResult = {
  auditScore: number;
  flags: string[];
};

type BomItemInput = { item: string; quantity?: string; notes?: string };

async function postJson<T>(path: string, body: unknown): Promise<T | null> {
  if (!ML_PIPELINE_ENABLED) return null;

  try {
    const res = await fetch(`${ML_PIPELINE_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });

    if (!res.ok) {
      console.warn(`ml-pipeline ${path} returned ${res.status}`);
      return null;
    }

    return (await res.json()) as T;
  } catch (error) {
    console.warn(`ml-pipeline ${path} unavailable:`, error instanceof Error ? error.message : error);
    return null;
  }
}

export async function classifyProject(params: {
  title: string;
  description?: string;
  content: string;
}): Promise<ClassifyResult | null> {
  return postJson<ClassifyResult>('/classify', {
    title: params.title,
    description: params.description ?? '',
    content: params.content,
  });
}

export async function validateBom(items: BomItemInput[]): Promise<ValidateBomResult | null> {
  return postJson<ValidateBomResult>('/validate-bom', { items });
}

export async function auditOutput(params: {
  bom: BomItemInput[];
  technicalRequirementsCount: number;
  confidenceScore: number;
  groundingCount: number;
}): Promise<AuditResult | null> {
  return postJson<AuditResult>('/audit', params);
}
