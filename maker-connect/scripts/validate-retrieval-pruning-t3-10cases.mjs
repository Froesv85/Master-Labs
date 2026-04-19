import fs from 'fs';
import path from 'path';

const BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
const MODEL = process.env.OLLAMA_CHAT_MODEL || 'qwen2.5:7b-instruct';

const samples = [
  {
    id: 'C1',
    title: 'Estacao meteo ESP32',
    input: 'Projeto IoT com ESP32, sensor DHT22 e display OLED. Precisa medir temperatura e umidade, publicar via MQTT e manter baixo consumo.',
    expectedKeywords: ['esp32', 'dht22', 'mqtt', 'oled'],
    tags: ['sensor', 'connectivity', 'power'],
  },
  {
    id: 'C2',
    title: 'Irrigacao automatica',
    input: 'Sistema de irrigacao com sensor de umidade de solo, rele 5V e bomba DC. Requisitos: leitura periodica, histerese e log de falhas.',
    expectedKeywords: ['sensor', 'rele', 'bomba', 'histerese'],
    tags: ['sensor', 'actuation', 'logging'],
  },
  {
    id: 'C3',
    title: 'Monitoramento de vibracao',
    input: 'Monitorar vibracao com MPU6050 e enviar alerta quando RMS passar limite. Precisa timestamp em RTC e redundancia por bateria.',
    expectedKeywords: ['mpu6050', 'rms', 'rtc', 'bateria'],
    tags: ['sensor', 'alerting', 'power'],
  },
  {
    id: 'C4',
    title: 'Casa inteligente com fallback local',
    input: 'Controlar iluminacao e presenca com ESP8266 e PIR, acionando lampadas por rele. Integracao com API HTTP e fallback local.',
    expectedKeywords: ['esp8266', 'pir', 'rele', 'http'],
    tags: ['actuation', 'connectivity', 'fallback'],
  },
  {
    id: 'C5',
    title: 'Controle de motor com ponte H',
    input: 'Controle de motor DC com ponte H L298N, limite de corrente e protecao termica. Precisa telemetria de falhas por MQTT.',
    expectedKeywords: ['ponte', 'l298n', 'corrente', 'mqtt'],
    tags: ['actuation', 'power', 'connectivity'],
  },
  {
    id: 'C6',
    title: 'Telemetria com wifi instavel',
    input: 'Gateway de telemetria com ESP32 em rede instavel. Exige reconnect automatico, cache local e envio em lote quando voltar link.',
    expectedKeywords: ['esp32', 'reconnect', 'cache', 'lote'],
    tags: ['connectivity', 'fallback', 'logging'],
  },
  {
    id: 'C7',
    title: 'Monitor de bateria',
    input: 'Projeto para monitorar tensao de bateria Li-Ion com alerta de subtensao, registro de ciclos e desligamento seguro.',
    expectedKeywords: ['bateria', 'tensao', 'alerta', 'desligamento'],
    tags: ['power', 'alerting', 'logging'],
  },
  {
    id: 'C8',
    title: 'Log de manutencao maker',
    input: 'Registrar manutencao de bancada com sensores de corrente e temperatura, historico de falhas e checklist tecnico por execucao.',
    expectedKeywords: ['corrente', 'temperatura', 'falhas', 'checklist'],
    tags: ['logging', 'sensor', 'maintenance'],
  },
  {
    id: 'C9',
    title: 'Sensores analogicos com calibracao',
    input: 'Leitura de sensores analogicos com filtro de ruido, calibracao em dois pontos e armazenamento de parametros de ajuste.',
    expectedKeywords: ['analogicos', 'filtro', 'calibracao', 'parametros'],
    tags: ['sensor', 'calibration'],
  },
  {
    id: 'C10',
    title: 'Pipeline com anonimiza PII',
    input: 'Extrair requisitos tecnicos de texto com dados pessoais embutidos. Exigir anonimiza de PII, trilha auditavel e output JSON valido.',
    expectedKeywords: ['anonimiza', 'pii', 'auditavel', 'json'],
    tags: ['privacy', 'logging', 'governance'],
  },
];

const evidenceCatalog = [
  { id: 'E1', text: 'ESP32 datasheet: GPIO, Wi-Fi, deep sleep, watchdog e baixo consumo.', tags: ['connectivity', 'power', 'sensor'] },
  { id: 'E2', text: 'Boas praticas MQTT: qos, reconnect, backoff e keepalive para telemetria.', tags: ['connectivity', 'logging'] },
  { id: 'E3', text: 'Controle de atuadores com rele e ponte H: protecao de corrente e anti-chattering.', tags: ['actuation', 'power'] },
  { id: 'E4', text: 'Padrao de logs tecnicos: registrar falha, timestamp, causa e acao corretiva.', tags: ['logging', 'maintenance'] },
  { id: 'E5', text: 'Calibracao de sensores analogicos: dois pontos, filtro e validacao periodica.', tags: ['calibration', 'sensor'] },
  { id: 'E6', text: 'LGPD/PII: anonimizar identificadores antes de inferencia externa e manter trilha auditavel.', tags: ['privacy', 'governance'] },
  { id: 'E7', text: 'Gestao de bateria: subtensao, ciclos, desligamento seguro e redundancia.', tags: ['power', 'alerting'] },
  { id: 'E8', text: 'Fallback local para rede instavel: cache local e envio em lote na reconexao.', tags: ['fallback', 'connectivity'] },
  { id: 'E9', text: 'Monitoramento de vibracao: MPU6050, RMS, limiares de alerta e RTC.', tags: ['sensor', 'alerting'] },
  { id: 'E10', text: 'Checklist de manutencao maker: inspeções de corrente, temperatura e conexoes.', tags: ['maintenance', 'sensor'] },
];

function tokenize(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length >= 3);
}

function scoreEvidence(sample, evidence) {
  const sampleTokens = new Set(tokenize(`${sample.input} ${sample.expectedKeywords.join(' ')}`));
  const evidenceTokens = tokenize(evidence.text);
  const overlap = evidenceTokens.filter((t) => sampleTokens.has(t)).length;
  const tagOverlap = evidence.tags.filter((tag) => sample.tags.includes(tag)).length;
  return overlap + tagOverlap * 2;
}

function buildContext(sample, mode) {
  const ranked = [...evidenceCatalog]
    .map((e) => ({ ...e, score: scoreEvidence(sample, e) }))
    .sort((a, b) => b.score - a.score);

  const selected = mode === 'pruned' ? ranked.slice(0, 3) : ranked.slice(0, 7);

  const context = selected
    .map((e) => `- ${e.id}: ${e.text}`)
    .join('\n');

  return {
    selected,
    context,
    contextChars: context.length,
  };
}

function buildPrompt(sample, mode) {
  const ctx = buildContext(sample, mode);

  const prompt = `Voce e o MakerBrain v3-t3. Responda SOMENTE JSON valido em pt-BR.\nProjeto: ${sample.title}.\nContexto do projeto: ${sample.input.slice(0, 420)}\n\nEvidencias tecnicas selecionadas:\n${ctx.context}\n\nSchema obrigatorio:\n{"schemaVersion":"mc_extract_v2","technicalRequirements":[{"id":"TR-1","name":"string","detail":"string","priority":"medium"}],"suggestedBOM":[{"item":"string","quantity":"1","notes":"string"}],"suggestedCode":"","confidenceScore":0}\n\nRegras:\n1) Sem markdown e sem texto fora do JSON\n2) technicalRequirements entre 3 e 5\n3) suggestedBOM entre 3 e 5\n4) priority em high|medium|low\n5) quantity como string\n6) suggestedCode sempre vazio\n7) Nao adicionar campos extras\n8) Priorizar itens tecnicos presentes nas evidencias selecionadas`;

  return { prompt, contextChars: ctx.contextChars, evidenceIds: ctx.selected.map((e) => e.id) };
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

  const firstBrace = sanitized.indexOf('{');
  const lastBrace = sanitized.lastIndexOf('}');
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    return tryParse(sanitized.slice(firstBrace, lastBrace + 1));
  }

  return null;
}

function relevanceProxy(sample, output) {
  const reqText = (output.technicalRequirements || [])
    .map((r) => `${r.name || ''} ${r.detail || ''}`)
    .join(' ');
  const bomText = (output.suggestedBOM || [])
    .map((b) => `${b.item || ''} ${b.notes || ''}`)
    .join(' ');
  const text = `${reqText} ${bomText}`;

  const outTokens = new Set(tokenize(text));
  const hits = sample.expectedKeywords.filter((k) => outTokens.has(k.toLowerCase())).length;
  return Math.round((hits / sample.expectedKeywords.length) * 10000) / 100;
}

function validateShape(output) {
  if (!output || output.schemaVersion !== 'mc_extract_v2') return false;
  if (!Array.isArray(output.technicalRequirements) || !Array.isArray(output.suggestedBOM)) return false;
  if (typeof output.suggestedCode !== 'string') return false;
  if (!Number.isFinite(Number(output.confidenceScore))) return false;
  if (output.technicalRequirements.length < 3 || output.technicalRequirements.length > 5) return false;
  if (output.suggestedBOM.length < 3 || output.suggestedBOM.length > 5) return false;

  const reqValid = output.technicalRequirements.every(
    (r) => typeof r?.id === 'string' && typeof r?.name === 'string' && typeof r?.detail === 'string' && ['high', 'medium', 'low'].includes(String(r?.priority))
  );

  const bomValid = output.suggestedBOM.every(
    (b) => typeof b?.item === 'string' && typeof b?.quantity === 'string' && typeof b?.notes === 'string'
  );

  return reqValid && bomValid;
}

async function generate(prompt, numPredict = 520) {
  const started = Date.now();
  const controller = new AbortController();
  const timeoutMs = 120000;
  const timeoutHandle = setTimeout(() => controller.abort(), timeoutMs);
  let response;

  try {
    response = await fetch(`${BASE_URL}/api/generate`, {
      method: 'POST',
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: MODEL,
        prompt,
        stream: false,
        format: 'json',
        options: { temperature: 0.05, num_predict: numPredict },
      }),
    });
  } finally {
    clearTimeout(timeoutHandle);
  }

  const data = await response.json();
  const raw = data.response ?? data;
  return {
    latencyMs: Date.now() - started,
    parsed: parseJsonFromResponse(raw),
    rawResponsePreview: typeof raw === 'string' ? raw.slice(0, 240) : JSON.stringify(raw).slice(0, 240),
  };
}

function percentile(sortedValues, p) {
  if (!sortedValues.length) return 0;
  const index = Math.min(sortedValues.length - 1, Math.max(0, Math.floor(sortedValues.length * p)));
  return sortedValues[index];
}

function summarize(rows) {
  const latencies = rows.map((r) => r.latencyMs).sort((a, b) => a - b);
  const parseValid = rows.filter((r) => r.parseValid).length;
  const schemaValid = rows.filter((r) => r.schemaValid).length;
  const relevanceAvg = Math.round((rows.reduce((acc, cur) => acc + cur.relevanceProxyPercent, 0) / rows.length) * 100) / 100;
  const contextAvg = Math.round(rows.reduce((acc, cur) => acc + cur.contextChars, 0) / rows.length);

  return {
    sampleSize: rows.length,
    parseValidRatePercent: Math.round((parseValid / rows.length) * 10000) / 100,
    schemaValidRatePercent: Math.round((schemaValid / rows.length) * 10000) / 100,
    p50LatencyMs: percentile(latencies, 0.5),
    p95LatencyMs: percentile(latencies, 0.95),
    relevanceProxyAvgPercent: relevanceAvg,
    avgContextChars: contextAvg,
  };
}

async function runMode(mode) {
  const rows = [];
  for (const sample of samples) {
    const { prompt, contextChars, evidenceIds } = buildPrompt(sample, mode);
    try {
      const g = await generate(prompt);
      rows.push({
        id: sample.id,
        title: sample.title,
        latencyMs: g.latencyMs,
        parseValid: Boolean(g.parsed),
        schemaValid: validateShape(g.parsed),
        relevanceProxyPercent: g.parsed ? relevanceProxy(sample, g.parsed) : 0,
        contextChars,
        evidenceIds,
        rawResponsePreview: g.rawResponsePreview,
        error: null,
      });
    }
    catch (error) {
      rows.push({
        id: sample.id,
        title: sample.title,
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
  return { rows, summary: summarize(rows) };
}

async function run() {
  const broad = await runMode('broad');
  const pruned = await runMode('pruned');

  const report = {
    generatedAt: new Date().toISOString(),
    model: MODEL,
    endpoint: BASE_URL,
    retrievalExperiment: 'broad_vs_pruned_topk',
    broad: broad.summary,
    pruned: pruned.summary,
    deltaPrunedMinusBroad: {
      parseValidRatePercent: Math.round((pruned.summary.parseValidRatePercent - broad.summary.parseValidRatePercent) * 100) / 100,
      schemaValidRatePercent: Math.round((pruned.summary.schemaValidRatePercent - broad.summary.schemaValidRatePercent) * 100) / 100,
      p50LatencyMs: pruned.summary.p50LatencyMs - broad.summary.p50LatencyMs,
      p95LatencyMs: pruned.summary.p95LatencyMs - broad.summary.p95LatencyMs,
      relevanceProxyAvgPercent:
        Math.round((pruned.summary.relevanceProxyAvgPercent - broad.summary.relevanceProxyAvgPercent) * 100) / 100,
      avgContextChars: pruned.summary.avgContextChars - broad.summary.avgContextChars,
    },
    perSample: {
      broad: broad.rows,
      pruned: pruned.rows,
    },
    gateSummary: {
      parseGate95: pruned.summary.parseValidRatePercent >= 95,
      schemaGate95: pruned.summary.schemaValidRatePercent >= 95,
      relevanceGate85: pruned.summary.relevanceProxyAvgPercent >= 85,
    },
  };

  const docsDir = path.resolve(process.cwd(), 'docs');
  const outJson = path.join(docsDir, 'ml-67-retrieval-pruning-validation-10cases-2026-04-19.json');
  fs.writeFileSync(outJson, JSON.stringify(report, null, 2), 'utf-8');

  const md = `# ML-67 Retrieval Pruning Validation - 10 Cases\n\nGenerated at: ${report.generatedAt}\nModel: ${MODEL}\n\n## Summary\n\n| Metric | Broad Context | Pruned Context | Delta (Pruned - Broad) |\n|---|---:|---:|---:|\n| Parse valid rate (%) | ${report.broad.parseValidRatePercent} | ${report.pruned.parseValidRatePercent} | ${report.deltaPrunedMinusBroad.parseValidRatePercent} |\n| Schema valid rate (%) | ${report.broad.schemaValidRatePercent} | ${report.pruned.schemaValidRatePercent} | ${report.deltaPrunedMinusBroad.schemaValidRatePercent} |\n| P50 latency (ms) | ${report.broad.p50LatencyMs} | ${report.pruned.p50LatencyMs} | ${report.deltaPrunedMinusBroad.p50LatencyMs} |\n| P95 latency (ms) | ${report.broad.p95LatencyMs} | ${report.pruned.p95LatencyMs} | ${report.deltaPrunedMinusBroad.p95LatencyMs} |\n| Relevance proxy avg (%) | ${report.broad.relevanceProxyAvgPercent} | ${report.pruned.relevanceProxyAvgPercent} | ${report.deltaPrunedMinusBroad.relevanceProxyAvgPercent} |\n| Avg context chars | ${report.broad.avgContextChars} | ${report.pruned.avgContextChars} | ${report.deltaPrunedMinusBroad.avgContextChars} |\n\n## Decision support\n\n- Pruned context should improve relevance/schema with no meaningful latency regression.\n- If relevance and schema are still below gate, next step is retrieval scoring + evidence curation per domain tag.\n\n## Artifact\n\n- JSON report: docs/ml-67-retrieval-pruning-validation-10cases-2026-04-19.json\n`;

  const outMd = path.join(docsDir, 'ml-67-retrieval-pruning-validation-10cases-2026-04-19.md');
  fs.writeFileSync(outMd, md, 'utf-8');

  console.log(JSON.stringify(report, null, 2));
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
