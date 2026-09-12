import type { PineconeMatch } from '@/lib/pinecone';

// Based on the n8n "Ollama RAG1" prompt (docs/n8n-workflow-v3-rag-ollama-v2-ml66.json), which
// produced the validated 98%-relevance holdout result (H01-H10) with qwen2.5:7b-instruct.
// Added an explicit "single line / minified" instruction on top of that baseline to keep
// verbose models (e.g. llama3.1) inside the token budget instead of truncating mid-JSON.
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
Responda em uma unica linha, minificado, sem quebras de linha e sem espacos alem dos obrigatorios do JSON. Seja direto e objetivo em cada campo de texto.
Idioma: ${language}.
Projeto: ${projectTitle}.
Entrada: ${input.slice(0, 900)}

Evidencias tecnicas (top 3):
${evidenceText}

Schema unico obrigatorio:
{"schemaVersion":"mc_extract_v2","technicalRequirements":[{"id":"TR-1","name":"string","detail":"string","priority":"high|medium|low"}],"suggestedBOM":[{"item":"string","quantity":"string","notes":"string"}],"assemblySteps":[{"step":1,"title":"string","detail":"string"}],"suggestedCode":"string","confidenceScore":0}

Regras:
1) schemaVersion deve ser exatamente mc_extract_v2
2) confidenceScore entre 0 e 100
3) technicalRequirements e suggestedBOM com maximo 6 itens
4) assemblySteps com maximo 8 etapas, numeradas em ordem a partir de 1
5) Se nao houver informacao, mantenha a chave e use string vazia
6) Nao incluir chaves fora do schema`;
}

export type NormalizedExtractionOutput = {
  schemaVersion: 'mc_extract_v2';
  technicalRequirements: { id: string; name: string; detail: string; priority: string }[];
  suggestedBOM: { item: string; quantity: string; notes: string }[];
  assemblySteps: { step: number; title: string; detail: string }[];
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

// Some models (e.g. llama3.1) run past the token budget and get cut off mid-object
// instead of emitting a clean closing brace. Rather than discard the whole response,
// walk back to the last point outside a string where every open {/[ can be closed
// cleanly, close them, and try again — recovers the completed fields, drops the rest.
function repairTruncatedJson(text: string): Record<string, unknown> | null {
  const maxBacktrack = Math.min(text.length, 400);
  for (let cut = 0; cut < maxBacktrack; cut++) {
    const candidate = text.slice(0, text.length - cut);
    const stack: string[] = [];
    let inString = false;
    let escape = false;
    for (const ch of candidate) {
      if (escape) {
        escape = false;
        continue;
      }
      if (ch === '\\') {
        escape = true;
        continue;
      }
      if (ch === '"') {
        inString = !inString;
        continue;
      }
      if (inString) continue;
      if (ch === '{' || ch === '[') stack.push(ch);
      else if (ch === '}' && stack[stack.length - 1] === '{') stack.pop();
      else if (ch === ']' && stack[stack.length - 1] === '[') stack.pop();
    }
    if (inString || stack.length === 0) continue;

    const trimmed = candidate.replace(/,\s*$/, '');
    const closers = stack
      .slice()
      .reverse()
      .map((open) => (open === '{' ? '}' : ']'))
      .join('');

    try {
      return JSON.parse(trimmed + closers);
    } catch {
      continue;
    }
  }
  return null;
}

// Ported verbatim from the n8n "Prep Callback1" code node, plus a truncated-JSON
// recovery pass (see repairTruncatedJson) for models that overrun the token budget.
export function normalizeExtractionOutput(
  rawResponseText: string,
  groundingCount: number,
  embeddingId: string | null
): NormalizedExtractionOutput {
  let parsedOutput: Record<string, unknown> = {};
  let parseError: string | null = null;
  const cleanText = rawResponseText.replace(/```json/g, '').replace(/```/g, '').trim();
  try {
    parsedOutput = JSON.parse(cleanText);
  } catch {
    const repaired = repairTruncatedJson(cleanText);
    if (repaired) {
      parsedOutput = repaired;
      parseError = 'Recovered from truncated JSON';
    } else {
      parseError = 'Failed to parse JSON';
    }
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

  const stepsRaw = Array.isArray(parsedOutput.assemblySteps) ? parsedOutput.assemblySteps : [];
  const assemblySteps = stepsRaw.slice(0, 8).map((s: Record<string, unknown>, i: number) => ({
    step: Number.isFinite(Number(s?.step)) ? Number(s?.step) : i + 1,
    title: ensureString(s?.title ?? s?.name, `Etapa ${i + 1}`),
    detail: ensureString(s?.detail ?? s?.description, ''),
  }));

  return {
    schemaVersion: 'mc_extract_v2',
    technicalRequirements,
    suggestedBOM,
    assemblySteps,
    suggestedCode: ensureString(parsedOutput.suggestedCode, ''),
    confidenceScore: normalizeConfidence(parsedOutput.confidenceScore),
    parseError,
    groundingCount,
    embeddingId,
  };
}
