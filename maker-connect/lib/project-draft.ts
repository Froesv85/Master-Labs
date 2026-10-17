import { generateCompletion } from '@/lib/ollama';

export type ProjectDraftInput = {
  title: string;
  objective?: string;
  category?: string;
};

export type ProjectDraftOutput = {
  description: string;
  suggestedBOM: { item: string; quantity: string; notes: string }[];
  assemblySteps: { step: number; title: string; detail: string }[];
};

// Prompt proprio pra essa feature (nao reaproveita lib/rag-output.ts de proposito):
// aquele schema/prompt foi validado em 98% de relevancia pro pipeline de extracao
// assincrono e nao deve mudar. Aqui o caso de uso e diferente (rascunho antes do
// projeto existir, sem evidencia RAG), entao schema mais simples: so description +
// BOM + etapas, sem requisitos tecnicos nem codigo sugerido.
function buildDraftPrompt({ title, objective, category }: ProjectDraftInput): string {
  return `Voce e o MakerBrain, assistente tecnico da MakerConnect.
Com base no titulo e objetivo abaixo, escreva um rascunho inicial de projeto maker para o criador revisar e editar antes de publicar.
Responda APENAS JSON valido, em uma unica linha, minificado, sem markdown e sem texto fora do JSON.
Categoria: ${category ?? 'geral'}.
Titulo: ${title}
Objetivo: ${objective?.trim() || '(nao informado)'}

Schema obrigatorio:
{"description":"string","suggestedBOM":[{"item":"string","quantity":"string","notes":"string"}],"assemblySteps":[{"step":1,"title":"string","detail":"string"}]}

Regras:
1) description: 2 a 4 frases em portugues, visao geral do que o projeto faz
2) suggestedBOM: maximo 8 itens, componentes plausiveis para esse tipo de projeto
3) assemblySteps: maximo 6 etapas, numeradas em ordem a partir de 1
4) Nao invente numeros de peca especificos nem marcas - mantenha generico
5) Se faltar informacao pra um campo, faca sua melhor estimativa a partir do titulo/categoria
6) Nao incluir chaves fora do schema`;
}

function ensureString(value: unknown, fallback = ''): string {
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return fallback;
}

export function normalizeDraftOutput(rawResponseText: string): ProjectDraftOutput {
  const cleanText = rawResponseText.replace(/```json/g, '').replace(/```/g, '').trim();
  let parsed: Record<string, unknown> = {};
  try {
    parsed = JSON.parse(cleanText);
  } catch {
    // Sem repair de JSON truncado aqui de proposito - e um rascunho que o usuario
    // revisa e edita, nao vale a complexidade do repairTruncatedJson do pipeline
    // de extracao validado. Se nao parsear, volta vazio e o usuario preenche na mao.
    parsed = {};
  }

  const bomRaw = Array.isArray(parsed.suggestedBOM) ? parsed.suggestedBOM : [];
  const suggestedBOM = bomRaw.slice(0, 8).map((b: Record<string, unknown>) => ({
    item: ensureString(b?.item ?? b?.component ?? b?.name, ''),
    quantity: ensureString(b?.quantity, '1'),
    notes: ensureString(b?.notes ?? b?.detail ?? b?.description, ''),
  }));

  const stepsRaw = Array.isArray(parsed.assemblySteps) ? parsed.assemblySteps : [];
  const assemblySteps = stepsRaw.slice(0, 6).map((s: Record<string, unknown>, i: number) => ({
    step: Number.isFinite(Number(s?.step)) ? Number(s?.step) : i + 1,
    title: ensureString(s?.title ?? s?.name, `Etapa ${i + 1}`),
    detail: ensureString(s?.detail ?? s?.description, ''),
  }));

  return {
    description: ensureString(parsed.description, ''),
    suggestedBOM,
    assemblySteps,
  };
}

export async function generateProjectDraft(input: ProjectDraftInput): Promise<ProjectDraftOutput> {
  const prompt = buildDraftPrompt(input);
  const raw = await generateCompletion(prompt);
  return normalizeDraftOutput(raw);
}
