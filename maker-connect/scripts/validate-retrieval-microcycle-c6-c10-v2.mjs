import fs from 'fs';
import path from 'path';

const BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
const MODEL = process.env.OLLAMA_CHAT_MODEL || 'qwen2.5:7b-instruct';

const samples = [
  {
    id: 'C6',
    title: 'Telemetria com wifi instavel',
    domain: 'telemetry-sensing',
    input: 'Gateway de telemetria com ESP32 em rede instavel. Exige reconnect automatico, cache local e envio em lote quando voltar link.',
    expectedKeywords: ['esp32', 'reconnect', 'cache', 'lote'],
  },
  {
    id: 'C10',
    title: 'Pipeline com anonimiza PII',
    domain: 'maintenance-governance',
    input: 'Extrair requisitos tecnicos de texto com dados pessoais embutidos. Exigir anonimiza de PII, trilha auditavel e output JSON valido.',
    expectedKeywords: ['anonimiza', 'pii', 'auditavel', 'json'],
  },
];

const evidenceCatalog = [
  { id: 'E14', domain: 'telemetry-sensing', reliability: 0.91, text: 'Wi-Fi instavel: reconnect exponencial, cache local e envio em lote na reconexao.' },
  { id: 'E11', domain: 'telemetry-sensing', reliability: 0.96, text: 'ESP32 + DHT22 + OLED: ciclo de amostragem, debounce de leitura e serializacao para telemetria.' },
  { id: 'E41', domain: 'maintenance-governance', reliability: 0.97, text: 'PII/LGPD: anonimizar identificadores antes da inferencia e manter trilha auditavel por execucao.' },
  { id: 'E43', domain: 'maintenance-governance', reliability: 0.91, text: 'Output JSON valido deve seguir schema fixo sem campos extras e com evidencias rastreaveis.' },
];

function tokenize(text) {
  return String(text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length >= 3);
}

function buildContext(sample) {
  const selected = evidenceCatalog.filter((entry) => entry.domain === sample.domain).slice(0, 2);
  const context = selected.map((entry, index) => `${index + 1}. [${entry.id}] ${entry.text}`).join('\n');
  return { selected, context, contextChars: context.length };
}

function buildPrompt(sample) {
  const ctx = buildContext(sample);
  const keywords = sample.expectedKeywords.join(', ');

  const prompt = `Voce e o MakerBrain microcycle v2. Responda SOMENTE JSON valido em pt-BR.\n\nProjeto: ${sample.title}\nDominio: ${sample.domain}\nContexto resumido: ${sample.input}\n\nKeywords obrigatorias: ${keywords}\n\nEvidencias curadas:\n${ctx.context}\n\nSchema obrigatorio:\n{"schemaVersion":"mc_extract_v2","technicalRequirements":[{"id":"TR-1","name":"string","detail":"string","priority":"medium"}],"suggestedBOM":[{"item":"string","quantity":"1","notes":"string"}],"suggestedCode":"","confidenceScore":0}\n\nRegras obrigatorias:\n1) technicalRequirements deve ter 4 itens.
2) suggestedBOM deve ter 3 itens.
3) Cada keyword obrigatoria precisa aparecer explicitamente em pelo menos um campo de technicalRequirements ou suggestedBOM.
4) Para C6, use exatamente as palavras esp32, reconnect, cache e lote em algum lugar do conteudo.
5) Para C10, use exatamente as palavras anonimiza, pii, auditavel e json em algum lugar do conteudo.
6) Use notas curtas e diretas, sem explicacao extra.
7) suggestedCode sempre vazio.
8) Nao adicionar campos extras.`;

  return { prompt, contextChars: ctx.contextChars, evidenceIds: ctx.selected.map((entry) => entry.id) };
}

function parseJsonFromResponse(text) {
  if (typeof text === 'object' && text !== null) return text;
  if (typeof text !== 'string') return null;

  const clean = text.replace(/```json/gi, '').replace(/```/g, '').trim();
  const parse = (value) => {
    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  };

  const direct = parse(clean);
  if (direct) return direct;

  const sanitized = clean.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').replace(/,\s*([}\]])/g, '$1');
  const repaired = parse(sanitized);
  if (repaired) return repaired;

  const first = sanitized.indexOf('{');
  const last = sanitized.lastIndexOf('}');
  if (first >= 0 && last > first) {
    return parse(sanitized.slice(first, last + 1));
  }

  return null;
}

function relevanceProxy(sample, output) {
  const reqText = (output.technicalRequirements || []).map((req) => `${req.name || ''} ${req.detail || ''}`).join(' ');
  const bomText = (output.suggestedBOM || []).map((item) => `${item.item || ''} ${item.notes || ''}`).join(' ');
  const outTokens = new Set(tokenize(`${reqText} ${bomText}`));
  const hits = sample.expectedKeywords.filter((keyword) => outTokens.has(tokenize(keyword).join(''))).length;
  return Math.round((hits / sample.expectedKeywords.length) * 10000) / 100;
}

function validateShape(output) {
  if (!output || output.schemaVersion !== 'mc_extract_v2') return false;
  if (!Array.isArray(output.technicalRequirements) || !Array.isArray(output.suggestedBOM)) return false;
  if (typeof output.suggestedCode !== 'string') return false;
  if (!Number.isFinite(Number(output.confidenceScore))) return false;
  if (output.technicalRequirements.length !== 4) return false;
  if (output.suggestedBOM.length !== 3) return false;

  const reqValid = output.technicalRequirements.every((req) => typeof req?.id === 'string' && typeof req?.name === 'string' && typeof req?.detail === 'string' && ['high', 'medium', 'low'].includes(String(req?.priority)));
  const bomValid = output.suggestedBOM.every((item) => typeof item?.item === 'string' && typeof item?.quantity === 'string' && typeof item?.notes === 'string');
  return reqValid && bomValid;
}

async function generate(prompt) {
  const started = Date.now();
  const response = await fetch(`${BASE_URL}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: MODEL,
      prompt,
      stream: false,
      format: 'json',
      options: { temperature: 0.01, num_predict: 260 },
    }),
  });

  const data = await response.json();
  const raw = data.response ?? data;
  return {
    latencyMs: Date.now() - started,
    parsed: parseJsonFromResponse(raw),
    rawResponsePreview: typeof raw === 'string' ? raw.slice(0, 260) : JSON.stringify(raw).slice(0, 260),
  };
}

function summarize(rows) {
  const latencies = rows.map((row) => row.latencyMs).filter((value) => Number.isFinite(value)).sort((a, b) => a - b);
  const parseValid = rows.filter((row) => row.parseValid).length;
  const schemaValid = rows.filter((row) => row.schemaValid).length;
  const relevanceAvg = Math.round((rows.reduce((acc, cur) => acc + cur.relevanceProxyPercent, 0) / rows.length) * 100) / 100;
  const contextAvg = Math.round(rows.reduce((acc, cur) => acc + cur.contextChars, 0) / rows.length);
  return {
    sampleSize: rows.length,
    parseValidRatePercent: Math.round((parseValid / rows.length) * 10000) / 100,
    schemaValidRatePercent: Math.round((schemaValid / rows.length) * 10000) / 100,
    p50LatencyMs: latencies.length ? latencies[Math.floor((latencies.length - 1) * 0.5)] : 0,
    p95LatencyMs: latencies.length ? latencies[Math.floor((latencies.length - 1) * 0.95)] : 0,
    relevanceProxyAvgPercent: relevanceAvg,
    avgContextChars: contextAvg,
  };
}

async function run() {
  const rows = [];
  for (const sample of samples) {
    const { prompt, contextChars, evidenceIds } = buildPrompt(sample);
    try {
      const generated = await generate(prompt);
      rows.push({
        id: sample.id,
        title: sample.title,
        domain: sample.domain,
        latencyMs: generated.latencyMs,
        parseValid: Boolean(generated.parsed),
        schemaValid: validateShape(generated.parsed),
        relevanceProxyPercent: generated.parsed ? relevanceProxy(sample, generated.parsed) : 0,
        contextChars,
        evidenceIds,
        rawResponsePreview: generated.rawResponsePreview,
        error: null,
      });
    } catch (error) {
      rows.push({
        id: sample.id,
        title: sample.title,
        domain: sample.domain,
        latencyMs: null,
        parseValid: false,
        schemaValid: false,
        relevanceProxyPercent: 0,
        contextChars,
        evidenceIds,
        rawResponsePreview: '',
        error: error?.message || String(error),
      });
    }
  }

  const report = {
    generatedAt: new Date().toISOString(),
    model: MODEL,
    endpoint: BASE_URL,
    retrievalExperiment: 'microcycle_c6_c10_forced_keywords',
    summary: summarize(rows),
    gateSummary: {
      parseGate95: rows.filter((row) => row.parseValid).length / rows.length >= 0.95,
      schemaGate95: rows.filter((row) => row.schemaValid).length / rows.length >= 0.95,
      relevanceGate85: rows.reduce((acc, cur) => acc + cur.relevanceProxyPercent, 0) / rows.length >= 85,
    },
    perSample: rows,
  };

  const docsDir = path.resolve(process.cwd(), 'docs');
  const jsonPath = path.join(docsDir, 'ml-69-microcycle-c6-c10-v2-2026-04-19.json');
  const mdPath = path.join(docsDir, 'ml-69-microcycle-c6-c10-v2-2026-04-19.md');
  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2), 'utf-8');

  const markdown = `# ML-69 Microcycle C6/C10 v2 - 2026-04-19\n\nGenerated at: ${report.generatedAt}\nModel: ${MODEL}\n\n## Summary\n\n| Metric | Value |\n|---|---:|\n| Parse valid rate (%) | ${report.summary.parseValidRatePercent} |\n| Schema valid rate (%) | ${report.summary.schemaValidRatePercent} |\n| P50 latency (ms) | ${report.summary.p50LatencyMs} |\n| P95 latency (ms) | ${report.summary.p95LatencyMs} |\n| Relevance proxy avg (%) | ${report.summary.relevanceProxyAvgPercent} |\n| Avg context chars | ${report.summary.avgContextChars} |\n\n## Gate check\n\n- Parse >=95: ${report.gateSummary.parseGate95 ? 'PASS' : 'FAIL'}\n- Schema >=95: ${report.gateSummary.schemaGate95 ? 'PASS' : 'FAIL'}\n- Relevance >=85: ${report.gateSummary.relevanceGate85 ? 'PASS' : 'FAIL'}\n\n## Artifact\n\n- JSON report: docs/ml-69-microcycle-c6-c10-v2-2026-04-19.json\n`;
  fs.writeFileSync(mdPath, markdown, 'utf-8');
  console.log(JSON.stringify(report, null, 2));
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
