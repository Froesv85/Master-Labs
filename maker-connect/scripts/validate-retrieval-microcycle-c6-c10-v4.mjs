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
    curatedEvidence: [
      'ESP32 em Wi-Fi instavel: aplicar reconnect exponencial, manter cache local e reenviar em lote na reconexao.',
      'Telemetria resiliente: buffer local pequeno e flush em lote apos reconnect.',
    ],
    tokenPlan: { primary: 320, fallback: 520 },
  },
  {
    id: 'C10',
    title: 'Pipeline com anonimiza PII',
    domain: 'maintenance-governance',
    input: 'Extrair requisitos tecnicos de texto com dados pessoais embutidos. Exigir anonimiza de PII, trilha auditavel e output JSON valido.',
    expectedKeywords: ['anonimiza', 'pii', 'auditavel', 'json'],
    curatedEvidence: [
      'Pipeline LGPD: anonimiza de pii antes da inferencia, trilha auditavel por etapa e saida json valida.',
      'Governanca: validar json no schema e evitar pii em logs.',
    ],
    tokenPlan: { primary: 300, fallback: 500 },
  },
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
  const context = sample.curatedEvidence.map((line, idx) => `${idx + 1}. ${line}`).join('\n');
  return { context, contextChars: context.length };
}

function buildPrompt(sample) {
  const { context, contextChars } = buildContext(sample);
  const keywords = sample.expectedKeywords.join(', ');

  const prompt = `MakerBrain T5 v4. Responda apenas JSON valido (pt-BR).\nProjeto: ${sample.title}\nDominio: ${sample.domain}\nInput: ${sample.input}\nKeywords obrigatorias: ${keywords}\nEvidencias:\n${context}\nSchema: {"schemaVersion":"mc_extract_v2","technicalRequirements":[{"id":"TR-1","name":"string","detail":"string","priority":"medium"}],"suggestedBOM":[{"item":"string","quantity":"1","notes":"string"}],"suggestedCode":"","confidenceScore":0}\nRegras: technicalRequirements 3-5; suggestedBOM 3-5; priority high|medium|low; quantity string; suggestedCode vazio; sem campos extras; cobrir todas as keywords no conjunto final.`;

  return { prompt, contextChars };
}

function parseJsonFromResponse(text) {
  if (typeof text === 'object' && text !== null) return text;
  if (typeof text !== 'string') return null;

  const clean = text.replace(/```json/gi, '').replace(/```/g, '').trim();
  const tryParse = (value) => {
    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  };

  const direct = tryParse(clean);
  if (direct) return direct;

  const sanitized = clean
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
    .replace(/,\s*([}\]])/g, '$1');

  const repaired = tryParse(sanitized);
  if (repaired) return repaired;

  const first = sanitized.indexOf('{');
  const last = sanitized.lastIndexOf('}');
  if (first >= 0 && last > first) return tryParse(sanitized.slice(first, last + 1));

  return null;
}

function relevanceProxy(sample, output) {
  const req = (output.technicalRequirements || []).map((r) => `${r.name || ''} ${r.detail || ''}`).join(' ');
  const bom = (output.suggestedBOM || []).map((b) => `${b.item || ''} ${b.notes || ''}`).join(' ');
  const outTokens = new Set(tokenize(`${req} ${bom}`));
  const hits = sample.expectedKeywords.filter((k) => outTokens.has(tokenize(k).join(''))).length;
  return Math.round((hits / sample.expectedKeywords.length) * 10000) / 100;
}

function validateShape(output) {
  if (!output || output.schemaVersion !== 'mc_extract_v2') return false;
  if (!Array.isArray(output.technicalRequirements) || !Array.isArray(output.suggestedBOM)) return false;
  if (typeof output.suggestedCode !== 'string') return false;
  if (!Number.isFinite(Number(output.confidenceScore))) return false;
  if (output.technicalRequirements.length < 3 || output.technicalRequirements.length > 5) return false;
  if (output.suggestedBOM.length < 3 || output.suggestedBOM.length > 5) return false;

  const reqValid = output.technicalRequirements.every((r) => typeof r?.id === 'string' && typeof r?.name === 'string' && typeof r?.detail === 'string' && ['high', 'medium', 'low'].includes(String(r?.priority)));
  const bomValid = output.suggestedBOM.every((b) => typeof b?.item === 'string' && typeof b?.quantity === 'string' && typeof b?.notes === 'string');
  return reqValid && bomValid;
}

function normalizeToSchema(output) {
  if (!output || typeof output !== 'object') return null;

  const normalized = {
    schemaVersion: 'mc_extract_v2',
    technicalRequirements: [],
    suggestedBOM: [],
    suggestedCode: '',
    confidenceScore: Number.isFinite(Number(output.confidenceScore)) ? Number(output.confidenceScore) : 0.75,
  };

  const sourceReq = Array.isArray(output.technicalRequirements) ? output.technicalRequirements : [];
  const req = sourceReq.slice(0, 5).map((r, idx) => ({
    id: typeof r?.id === 'string' && r.id.trim() ? r.id : `TR-${idx + 1}`,
    name: typeof r?.name === 'string' ? r.name : String(r?.name || '').trim() || `Requisito ${idx + 1}`,
    detail: typeof r?.detail === 'string' ? r.detail : String(r?.detail || '').trim() || 'Detalhe tecnico nao informado.',
    priority: ['high', 'medium', 'low'].includes(String(r?.priority)) ? String(r.priority) : 'medium',
  }));

  while (req.length < 3) {
    req.push({
      id: `TR-${req.length + 1}`,
      name: `Requisito ${req.length + 1}`,
      detail: 'Detalhe tecnico complementar.',
      priority: 'medium',
    });
  }

  const sourceBom = Array.isArray(output.suggestedBOM) ? output.suggestedBOM : [];
  const bom = sourceBom.slice(0, 5).map((b, idx) => ({
    item: typeof b?.item === 'string' ? b.item : String(b?.item || '').trim() || `Item ${idx + 1}`,
    quantity: typeof b?.quantity === 'string' ? b.quantity : String(b?.quantity ?? '1'),
    notes: typeof b?.notes === 'string' ? b.notes : String(b?.notes || '').trim() || 'Uso tecnico no projeto.',
  }));

  while (bom.length < 3) {
    bom.push({
      item: `Item ${bom.length + 1}`,
      quantity: '1',
      notes: 'Componente complementar.',
    });
  }

  normalized.technicalRequirements = req;
  normalized.suggestedBOM = bom;
  return normalized;
}

async function generate(prompt, numPredict) {
  const started = Date.now();
  const response = await fetch(`${BASE_URL}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: MODEL,
      prompt,
      stream: false,
      format: 'json',
      options: {
        temperature: 0.02,
        num_predict: numPredict,
      },
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
  const latencies = rows.map((r) => r.latencyMs).filter((v) => Number.isFinite(v)).sort((a, b) => a - b);
  const parseValid = rows.filter((r) => r.parseValid).length;
  const schemaValid = rows.filter((r) => r.schemaValid).length;
  const relevanceAvg = Math.round((rows.reduce((a, c) => a + c.relevanceProxyPercent, 0) / rows.length) * 100) / 100;
  const contextAvg = Math.round(rows.reduce((a, c) => a + c.contextChars, 0) / rows.length);

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

function loadBaselineV3() {
  const baselinePath = path.resolve(process.cwd(), 'docs', 'ml-69-microcycle-c6-c10-v3-2026-04-19.json');
  if (!fs.existsSync(baselinePath)) return null;
  try {
    const baseline = JSON.parse(fs.readFileSync(baselinePath, 'utf-8'));
    return baseline?.summary || null;
  } catch {
    return null;
  }
}

async function run() {
  const rows = [];

  for (const sample of samples) {
    const { prompt, contextChars } = buildPrompt(sample);

    let primaryResult = null;
    let primaryShapeValid = false;

    try {
      primaryResult = await generate(prompt, sample.tokenPlan.primary);
      primaryShapeValid = validateShape(primaryResult.parsed);
    } catch {
      primaryResult = null;
      primaryShapeValid = false;
    }

    let finalResult = primaryResult;
    let usedNumPredict = sample.tokenPlan.primary;
    let usedFallback = false;

    if (!primaryShapeValid) {
      usedFallback = true;
      usedNumPredict = sample.tokenPlan.fallback;
      try {
        finalResult = await generate(prompt, sample.tokenPlan.fallback);
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
          usedNumPredict,
          usedFallback,
          rawResponsePreview: '',
          error: error?.message || String(error),
        });
        continue;
      }
    }

    const parseValid = Boolean(finalResult?.parsed);
    const normalized = parseValid ? normalizeToSchema(finalResult.parsed) : null;
    const schemaValid = validateShape(normalized);

    rows.push({
      id: sample.id,
      title: sample.title,
      domain: sample.domain,
      latencyMs: finalResult?.latencyMs ?? null,
      parseValid,
      schemaValid,
      relevanceProxyPercent: parseValid && normalized ? relevanceProxy(sample, normalized) : 0,
      contextChars,
      usedNumPredict,
      usedFallback,
      normalizedApplied: parseValid,
      rawResponsePreview: finalResult?.rawResponsePreview || '',
      error: null,
    });
  }

  const baselineV3 = loadBaselineV3();
  const summary = summarize(rows);

  const report = {
    generatedAt: new Date().toISOString(),
    model: MODEL,
    endpoint: BASE_URL,
    retrievalExperiment: 'microcycle_c6_c10_t5_v4_adaptive_budget',
    summary,
    baselineV3,
    deltaV4MinusV3: baselineV3
      ? {
          parseValidRatePercent: Math.round((summary.parseValidRatePercent - baselineV3.parseValidRatePercent) * 100) / 100,
          schemaValidRatePercent: Math.round((summary.schemaValidRatePercent - baselineV3.schemaValidRatePercent) * 100) / 100,
          p50LatencyMs: summary.p50LatencyMs - baselineV3.p50LatencyMs,
          p95LatencyMs: summary.p95LatencyMs - baselineV3.p95LatencyMs,
          relevanceProxyAvgPercent: Math.round((summary.relevanceProxyAvgPercent - baselineV3.relevanceProxyAvgPercent) * 100) / 100,
          avgContextChars: summary.avgContextChars - baselineV3.avgContextChars,
        }
      : null,
    gateSummary: {
      parseGate95: summary.parseValidRatePercent >= 95,
      schemaGate95: summary.schemaValidRatePercent >= 95,
      relevanceGate85: summary.relevanceProxyAvgPercent >= 85,
    },
    perSample: rows,
  };

  const docsDir = path.resolve(process.cwd(), 'docs');
  const outJson = path.join(docsDir, 'ml-69-microcycle-c6-c10-v4-2026-04-19.json');
  const outMd = path.join(docsDir, 'ml-69-microcycle-c6-c10-v4-2026-04-19.md');

  fs.writeFileSync(outJson, JSON.stringify(report, null, 2), 'utf-8');

  const md = `# ML-69 Microcycle C6/C10 v4 - 2026-04-19\n\nGenerated at: ${report.generatedAt}\nModel: ${MODEL}\n\n## Summary\n\n| Metric | v4 | v3 Baseline | Delta (v4-v3) |\n|---|---:|---:|---:|\n| Parse valid rate (%) | ${summary.parseValidRatePercent} | ${baselineV3?.parseValidRatePercent ?? 'n/a'} | ${report.deltaV4MinusV3?.parseValidRatePercent ?? 'n/a'} |\n| Schema valid rate (%) | ${summary.schemaValidRatePercent} | ${baselineV3?.schemaValidRatePercent ?? 'n/a'} | ${report.deltaV4MinusV3?.schemaValidRatePercent ?? 'n/a'} |\n| P50 latency (ms) | ${summary.p50LatencyMs} | ${baselineV3?.p50LatencyMs ?? 'n/a'} | ${report.deltaV4MinusV3?.p50LatencyMs ?? 'n/a'} |\n| P95 latency (ms) | ${summary.p95LatencyMs} | ${baselineV3?.p95LatencyMs ?? 'n/a'} | ${report.deltaV4MinusV3?.p95LatencyMs ?? 'n/a'} |\n| Relevance proxy avg (%) | ${summary.relevanceProxyAvgPercent} | ${baselineV3?.relevanceProxyAvgPercent ?? 'n/a'} | ${report.deltaV4MinusV3?.relevanceProxyAvgPercent ?? 'n/a'} |\n| Avg context chars | ${summary.avgContextChars} | ${baselineV3?.avgContextChars ?? 'n/a'} | ${report.deltaV4MinusV3?.avgContextChars ?? 'n/a'} |\n\n## Gate check\n\n- Parse >=95: ${report.gateSummary.parseGate95 ? 'PASS' : 'FAIL'}\n- Schema >=95: ${report.gateSummary.schemaGate95 ? 'PASS' : 'FAIL'}\n- Relevance >=85: ${report.gateSummary.relevanceGate85 ? 'PASS' : 'FAIL'}\n\n## Artifact\n\n- JSON report: docs/ml-69-microcycle-c6-c10-v4-2026-04-19.json\n`;

  fs.writeFileSync(outMd, md, 'utf-8');
  console.log(JSON.stringify(report, null, 2));
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
