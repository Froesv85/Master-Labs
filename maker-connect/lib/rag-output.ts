import type { PineconeMatch } from '@/lib/pinecone';

// Ported verbatim from the n8n "Ollama RAG1" prompt (docs/n8n-workflow-v3-rag-ollama-v2-ml66.json)
// so output quality matches the validated 98%-relevance holdout result (H01-H10).
export function buildRagPrompt(params: {
  language: string;
  projectTitle: string;
  input: string;
  evidence: PineconeMatch[];
}): string {
  const { language, projectTitle, input, evidence } = params;
  const evidenceText = evidence
    .slice(0, 3)
    .map((m) => String((m.metadata?.text as string) ?? '').slice(0, 320))
    .join('\n---\n');

  return `Voce e o MakerBrain v2.
Responda APENAS JSON valido, sem markdown e sem texto extra.
Idioma: ${language}.
Projeto: ${projectTitle}.
Entrada: ${input.slice(0, 900)}

Evidencias tecnicas (top 3):
${evidenceText}

Schema unico obrigatorio:
{"schemaVersion":"mc_extract_v2","technicalRequirements":[{"id":"TR-1","name":"string","detail":"string","priority":"high|medium|low"}],"suggestedBOM":[{"item":"string","quantity":"string","notes":"string"}],"suggestedCode":"string","confidenceScore":0}

Regras:
1) schemaVersion deve ser exatamente mc_extract_v2
2) confidenceScore entre 0 e 100
3) technicalRequirements e suggestedBOM com maximo 6 itens
4) Se nao houver informacao, mantenha a chave e use string vazia
5) Nao incluir chaves fora do schema`;
}

export type NormalizedExtractionOutput = {
  schemaVersion: 'mc_extract_v2';
  technicalRequirements: { id: string; name: string; detail: string; priority: string }[];
  suggestedBOM: { item: string; quantity: string; notes: string }[];
  suggestedCode: string;
  confidenceScore: number;
  parseError: string | null;
  groundingCount: number;
  embeddingId: string | null;
};

function ensureString(value: unknown, fallback = ''): string {
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return fallback;
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function normalizePriority(p: unknown): string {
  return ['high', 'medium', 'low'].includes(String(p)) ? String(p) : 'medium';
}

function normalizeConfidence(v: unknown): number {
  const n = Number(v);
  if (!Number.isFinite(n)) return 0;
  const scaled = n <= 1 ? n * 100 : n;
  return clamp(Math.round(scaled * 100) / 100, 0, 100);
}

// Ported verbatim from the n8n "Prep Callback1" code node.
export function normalizeExtractionOutput(
  rawResponseText: string,
  groundingCount: number,
  embeddingId: string | null
): NormalizedExtractionOutput {
  let parsedOutput: Record<string, unknown> = {};
  let parseError: string | null = null;
  try {
    const cleanText = rawResponseText.replace(/```json/g, '').replace(/```/g, '').trim();
    parsedOutput = JSON.parse(cleanText);
  } catch {
    parseError = 'Failed to parse JSON';
  }

  const reqsRaw = Array.isArray(parsedOutput.technicalRequirements) ? parsedOutput.technicalRequirements : [];
  const technicalRequirements = reqsRaw.slice(0, 6).map((r: Record<string, unknown>, i: number) => ({
    id: ensureString(r?.id, `TR-${i + 1}`),
    name: ensureString(r?.name ?? r?.title ?? r?.requirement, `Requirement ${i + 1}`),
    detail: ensureString(r?.detail ?? r?.description ?? r?.notes, ''),
    priority: normalizePriority(r?.priority),
  }));

  const bomRaw = Array.isArray(parsedOutput.suggestedBOM) ? parsedOutput.suggestedBOM : [];
  const suggestedBOM = bomRaw.slice(0, 6).map((b: Record<string, unknown>) => ({
    item: ensureString(b?.item ?? b?.component ?? b?.name, ''),
    quantity: ensureString(b?.quantity, '1'),
    notes: ensureString(b?.notes ?? b?.detail ?? b?.description, ''),
  }));

  return {
    schemaVersion: 'mc_extract_v2',
    technicalRequirements,
    suggestedBOM,
    suggestedCode: ensureString(parsedOutput.suggestedCode, ''),
    confidenceScore: normalizeConfidence(parsedOutput.confidenceScore),
    parseError,
    groundingCount,
    embeddingId,
  };
}
