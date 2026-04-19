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
    domain: 'telemetry-sensing',
  },
  {
    id: 'C2',
    title: 'Irrigacao automatica',
    input: 'Sistema de irrigacao com sensor de umidade de solo, rele 5V e bomba DC. Requisitos: leitura periodica, histerese e log de falhas.',
    expectedKeywords: ['sensor', 'rele', 'bomba', 'histerese'],
    tags: ['sensor', 'actuation', 'logging'],
    domain: 'actuation-control',
  },
  {
    id: 'C3',
    title: 'Monitoramento de vibracao',
    input: 'Monitorar vibracao com MPU6050 e enviar alerta quando RMS passar limite. Precisa timestamp em RTC e redundancia por bateria.',
    expectedKeywords: ['mpu6050', 'rms', 'rtc', 'bateria'],
    tags: ['sensor', 'alerting', 'power'],
    domain: 'telemetry-sensing',
  },
  {
    id: 'C4',
    title: 'Casa inteligente com fallback local',
    input: 'Controlar iluminacao e presenca com ESP8266 e PIR, acionando lampadas por rele. Integracao com API HTTP e fallback local.',
    expectedKeywords: ['esp8266', 'pir', 'rele', 'http'],
    tags: ['actuation', 'connectivity', 'fallback'],
    domain: 'actuation-control',
  },
  {
    id: 'C5',
    title: 'Controle de motor com ponte H',
    input: 'Controle de motor DC com ponte H L298N, limite de corrente e protecao termica. Precisa telemetria de falhas por MQTT.',
    expectedKeywords: ['ponte', 'l298n', 'corrente', 'mqtt'],
    tags: ['actuation', 'power', 'connectivity'],
    domain: 'actuation-control',
  },
  {
    id: 'C6',
    title: 'Telemetria com wifi instavel',
    input: 'Gateway de telemetria com ESP32 em rede instavel. Exige reconnect automatico, cache local e envio em lote quando voltar link.',
    expectedKeywords: ['esp32', 'reconnect', 'cache', 'lote'],
    tags: ['connectivity', 'fallback', 'logging'],
    domain: 'telemetry-sensing',
  },
  {
    id: 'C7',
    title: 'Monitor de bateria',
    input: 'Projeto para monitorar tensao de bateria Li-Ion com alerta de subtensao, registro de ciclos e desligamento seguro.',
    expectedKeywords: ['bateria', 'tensao', 'alerta', 'desligamento'],
    tags: ['power', 'alerting', 'logging'],
    domain: 'power-safety',
  },
  {
    id: 'C8',
    title: 'Log de manutencao maker',
    input: 'Registrar manutencao de bancada com sensores de corrente e temperatura, historico de falhas e checklist tecnico por execucao.',
    expectedKeywords: ['corrente', 'temperatura', 'falhas', 'checklist'],
    tags: ['logging', 'sensor', 'maintenance'],
    domain: 'maintenance-governance',
  },
  {
    id: 'C9',
    title: 'Sensores analogicos com calibracao',
    input: 'Leitura de sensores analogicos com filtro de ruido, calibracao em dois pontos e armazenamento de parametros de ajuste.',
    expectedKeywords: ['analogicos', 'filtro', 'calibracao', 'parametros'],
    tags: ['sensor', 'calibration'],
    domain: 'telemetry-sensing',
  },
  {
    id: 'C10',
    title: 'Pipeline com anonimiza PII',
    input: 'Extrair requisitos tecnicos de texto com dados pessoais embutidos. Exigir anonimiza de PII, trilha auditavel e output JSON valido.',
    expectedKeywords: ['anonimiza', 'pii', 'auditavel', 'json'],
    tags: ['privacy', 'logging', 'governance'],
    domain: 'maintenance-governance',
  },
];

const evidenceCatalog = [
  { id: 'E11', domain: 'telemetry-sensing', reliability: 0.96, tags: ['sensor', 'connectivity'], text: 'ESP32 + DHT22 + OLED: ciclo de amostragem, debounce de leitura e serializacao para telemetria.' },
  { id: 'E12', domain: 'telemetry-sensing', reliability: 0.94, tags: ['sensor', 'alerting'], text: 'MPU6050 com RMS: janela movel, threshold e timestamp em RTC para alerta auditavel.' },
  { id: 'E13', domain: 'telemetry-sensing', reliability: 0.93, tags: ['sensor', 'calibration'], text: 'Sensores analogicos: filtro passa-baixa, calibracao de dois pontos e persistencia de parametros.' },
  { id: 'E14', domain: 'telemetry-sensing', reliability: 0.91, tags: ['connectivity', 'fallback'], text: 'Wi-Fi instavel: reconnect exponencial, cache local e envio em lote na reconexao.' },

  { id: 'E21', domain: 'actuation-control', reliability: 0.95, tags: ['actuation', 'power'], text: 'Rele e bomba DC: histerese minima para evitar chattering e acionamento ciclico indevido.' },
  { id: 'E22', domain: 'actuation-control', reliability: 0.94, tags: ['actuation', 'power'], text: 'Ponte H L298N: limite de corrente, protecao termica e log de sobrecorrente por evento.' },
  { id: 'E23', domain: 'actuation-control', reliability: 0.9, tags: ['actuation', 'connectivity'], text: 'Casa inteligente com ESP8266 + PIR + rele: fallback local quando API HTTP ficar indisponivel.' },
  { id: 'E24', domain: 'actuation-control', reliability: 0.89, tags: ['logging', 'maintenance'], text: 'Acoes de atuacao devem registrar causa, timestamp, estado anterior e estado novo.' },

  { id: 'E31', domain: 'power-safety', reliability: 0.97, tags: ['power', 'alerting'], text: 'Bateria Li-Ion: alerta de subtensao por faixa, histerese de recuperacao e desligamento seguro.' },
  { id: 'E32', domain: 'power-safety', reliability: 0.92, tags: ['power', 'logging'], text: 'Registro de ciclos de carga/descarga e tendencia de degradacao com timestamp.' },
  { id: 'E33', domain: 'power-safety', reliability: 0.9, tags: ['power', 'sensor'], text: 'Amostragem de tensao com divisor resistivo e compensacao de ruido de leitura ADC.' },

  { id: 'E41', domain: 'maintenance-governance', reliability: 0.97, tags: ['privacy', 'governance'], text: 'PII/LGPD: anonimizar identificadores antes da inferencia e manter trilha auditavel por execucao.' },
  { id: 'E42', domain: 'maintenance-governance', reliability: 0.94, tags: ['logging', 'maintenance'], text: 'Checklist tecnico: corrente, temperatura, conexoes e historico de falhas por manutencao.' },
  { id: 'E43', domain: 'maintenance-governance', reliability: 0.91, tags: ['governance', 'logging'], text: 'Output JSON valido deve seguir schema fixo sem campos extras e com evidencias rastreaveis.' },

  { id: 'E90', domain: 'cross-cutting', reliability: 0.86, tags: ['connectivity', 'logging'], text: 'MQTT: qos, keepalive, reconnect e fila local para telemetria resiliente.' },
  { id: 'E91', domain: 'cross-cutting', reliability: 0.85, tags: ['sensor', 'maintenance'], text: 'Metricas por projeto: p50/p95, taxa de parse e taxa de schema para decisao de rollout.' },
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

function scoreEvidence(sample, evidence) {
  const sampleTokens = new Set(tokenize(`${sample.input} ${sample.expectedKeywords.join(' ')}`));
  const evidenceTokens = tokenize(evidence.text);

  const tokenOverlap = evidenceTokens.filter((t) => sampleTokens.has(t)).length;
  const keywordHit = sample.expectedKeywords.filter((k) => evidenceTokens.includes(tokenize(k).join(''))).length;
  const tagOverlap = evidence.tags.filter((tag) => sample.tags.includes(tag)).length;
  const domainBoost = evidence.domain === sample.domain ? 1 : (evidence.domain === 'cross-cutting' ? 0.35 : 0);

  // Weighted score tuned for domain alignment + high-confidence curated evidence.
  return tokenOverlap * 2 + keywordHit * 4 + tagOverlap * 3 + domainBoost * 8 + evidence.reliability * 2;
}

function buildCuratedContext(sample) {
  const ranked = [...evidenceCatalog]
    .map((e) => ({ ...e, score: scoreEvidence(sample, e) }))
    .sort((a, b) => b.score - a.score);

  const domainTop = ranked.filter((e) => e.domain === sample.domain).slice(0, 3);
  const crossTop = ranked.filter((e) => e.domain === 'cross-cutting').slice(0, 1);
  const supportTop = ranked.filter((e) => e.domain !== sample.domain && e.domain !== 'cross-cutting').slice(0, 1);

  const selected = [...domainTop, ...crossTop, ...supportTop]
    .filter((value, index, arr) => arr.findIndex((x) => x.id === value.id) === index)
    .slice(0, 5);

  const context = selected
    .map((e, idx) => `${idx + 1}. [${e.id}] (domain=${e.domain}; rel=${e.reliability}) ${e.text}`)
    .join('\n');

  return {
    selected,
    context,
    contextChars: context.length,
  };
}

function buildPrompt(sample) {
  const ctx = buildCuratedContext(sample);
  const mustKeywords = sample.expectedKeywords.join(', ');

  const prompt = `Voce e o MakerBrain retrieval-v4. Responda SOMENTE JSON valido em pt-BR.\nProjeto: ${sample.title}.\nDominio principal: ${sample.domain}.\nContexto do projeto: ${sample.input.slice(0, 420)}\n\nPalavras-chave obrigatorias (cobrir no conteudo tecnico): ${mustKeywords}\n\nEvidencias curadas por dominio:\n${ctx.context}\n\nSchema obrigatorio:\n{"schemaVersion":"mc_extract_v2","technicalRequirements":[{"id":"TR-1","name":"string","detail":"string","priority":"medium"}],"suggestedBOM":[{"item":"string","quantity":"1","notes":"string"}],"suggestedCode":"","confidenceScore":0}\n\nRegras obrigatorias:\n1) Sem markdown e sem texto fora do JSON\n2) technicalRequirements entre 3 e 5\n3) suggestedBOM entre 3 e 5\n4) priority em high|medium|low\n5) quantity como string\n6) suggestedCode sempre vazio\n7) Nao adicionar campos extras\n8) Em technicalRequirements + suggestedBOM, citar explicitamente pelo menos 3 palavras-chave obrigatorias\n9) Priorizar evidencias do dominio ${sample.domain}`;

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
  const hits = sample.expectedKeywords.filter((k) => {
    const normalizedKeyword = tokenize(k).join('');
    return outTokens.has(normalizedKeyword);
  }).length;

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
        options: { temperature: 0.03, num_predict: numPredict },
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
    rawResponsePreview: typeof raw === 'string' ? raw.slice(0, 260) : JSON.stringify(raw).slice(0, 260),
  };
}

function percentile(sortedValues, p) {
  if (!sortedValues.length) return 0;
  const index = Math.min(sortedValues.length - 1, Math.max(0, Math.floor(sortedValues.length * p)));
  return sortedValues[index];
}

function summarize(rows) {
  const validLatencies = rows.map((r) => r.latencyMs).filter((v) => Number.isFinite(v)).sort((a, b) => a - b);
  const parseValid = rows.filter((r) => r.parseValid).length;
  const schemaValid = rows.filter((r) => r.schemaValid).length;
  const relevanceAvg = Math.round((rows.reduce((acc, cur) => acc + cur.relevanceProxyPercent, 0) / rows.length) * 100) / 100;
  const contextAvg = Math.round(rows.reduce((acc, cur) => acc + cur.contextChars, 0) / rows.length);

  return {
    sampleSize: rows.length,
    parseValidRatePercent: Math.round((parseValid / rows.length) * 10000) / 100,
    schemaValidRatePercent: Math.round((schemaValid / rows.length) * 10000) / 100,
    p50LatencyMs: percentile(validLatencies, 0.5),
    p95LatencyMs: percentile(validLatencies, 0.95),
    relevanceProxyAvgPercent: relevanceAvg,
    avgContextChars: contextAvg,
  };
}

async function runCuratedCycle() {
  const rows = [];

  for (const sample of samples) {
    const { prompt, contextChars, evidenceIds } = buildPrompt(sample);
    try {
      const g = await generate(prompt);
      rows.push({
        id: sample.id,
        title: sample.title,
        domain: sample.domain,
        latencyMs: g.latencyMs,
        parseValid: Boolean(g.parsed),
        schemaValid: validateShape(g.parsed),
        relevanceProxyPercent: g.parsed ? relevanceProxy(sample, g.parsed) : 0,
        contextChars,
        evidenceIds,
        rawResponsePreview: g.rawResponsePreview,
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

  return { rows, summary: summarize(rows) };
}

function loadPreviousPrunedSummary() {
  const prevPath = path.resolve(process.cwd(), 'docs', 'ml-67-retrieval-pruning-validation-10cases-2026-04-19.json');
  if (!fs.existsSync(prevPath)) {
    return null;
  }

  try {
    const parsed = JSON.parse(fs.readFileSync(prevPath, 'utf-8'));
    return parsed?.pruned || null;
  } catch {
    return null;
  }
}

async function run() {
  const curated = await runCuratedCycle();
  const prevPruned = loadPreviousPrunedSummary();

  const report = {
    generatedAt: new Date().toISOString(),
    model: MODEL,
    endpoint: BASE_URL,
    retrievalExperiment: 'domain_scoring_plus_curated_evidence',
    curated: curated.summary,
    previousPruned: prevPruned,
    deltaCuratedMinusPrevPruned: prevPruned
      ? {
          parseValidRatePercent: Math.round((curated.summary.parseValidRatePercent - prevPruned.parseValidRatePercent) * 100) / 100,
          schemaValidRatePercent: Math.round((curated.summary.schemaValidRatePercent - prevPruned.schemaValidRatePercent) * 100) / 100,
          p50LatencyMs: curated.summary.p50LatencyMs - prevPruned.p50LatencyMs,
          p95LatencyMs: curated.summary.p95LatencyMs - prevPruned.p95LatencyMs,
          relevanceProxyAvgPercent: Math.round((curated.summary.relevanceProxyAvgPercent - prevPruned.relevanceProxyAvgPercent) * 100) / 100,
          avgContextChars: curated.summary.avgContextChars - prevPruned.avgContextChars,
        }
      : null,
    gateSummary: {
      parseGate95: curated.summary.parseValidRatePercent >= 95,
      schemaGate95: curated.summary.schemaValidRatePercent >= 95,
      relevanceGate85: curated.summary.relevanceProxyAvgPercent >= 85,
    },
    perSample: curated.rows,
  };

  const docsDir = path.resolve(process.cwd(), 'docs');
  const outJson = path.join(docsDir, 'ml-68-retrieval-domain-curation-validation-10cases-2026-04-19.json');
  fs.writeFileSync(outJson, JSON.stringify(report, null, 2), 'utf-8');

  const md = `# ML-68 Retrieval Domain Scoring + Curation Validation - 10 Cases\n\nGenerated at: ${report.generatedAt}\nModel: ${MODEL}\n\n## Summary\n\n| Metric | Curated Cycle | Previous Pruned (T3) | Delta |\n|---|---:|---:|---:|\n| Parse valid rate (%) | ${report.curated.parseValidRatePercent} | ${report.previousPruned?.parseValidRatePercent ?? 'n/a'} | ${report.deltaCuratedMinusPrevPruned?.parseValidRatePercent ?? 'n/a'} |\n| Schema valid rate (%) | ${report.curated.schemaValidRatePercent} | ${report.previousPruned?.schemaValidRatePercent ?? 'n/a'} | ${report.deltaCuratedMinusPrevPruned?.schemaValidRatePercent ?? 'n/a'} |\n| P50 latency (ms) | ${report.curated.p50LatencyMs} | ${report.previousPruned?.p50LatencyMs ?? 'n/a'} | ${report.deltaCuratedMinusPrevPruned?.p50LatencyMs ?? 'n/a'} |\n| P95 latency (ms) | ${report.curated.p95LatencyMs} | ${report.previousPruned?.p95LatencyMs ?? 'n/a'} | ${report.deltaCuratedMinusPrevPruned?.p95LatencyMs ?? 'n/a'} |\n| Relevance proxy avg (%) | ${report.curated.relevanceProxyAvgPercent} | ${report.previousPruned?.relevanceProxyAvgPercent ?? 'n/a'} | ${report.deltaCuratedMinusPrevPruned?.relevanceProxyAvgPercent ?? 'n/a'} |\n| Avg context chars | ${report.curated.avgContextChars} | ${report.previousPruned?.avgContextChars ?? 'n/a'} | ${report.deltaCuratedMinusPrevPruned?.avgContextChars ?? 'n/a'} |\n\n## Gate check\n\n- Parse >=95: ${report.gateSummary.parseGate95 ? 'PASS' : 'FAIL'}\n- Schema >=95: ${report.gateSummary.schemaGate95 ? 'PASS' : 'FAIL'}\n- Relevance >=85: ${report.gateSummary.relevanceGate85 ? 'PASS' : 'FAIL'}\n\n## Artifact\n\n- JSON report: docs/ml-68-retrieval-domain-curation-validation-10cases-2026-04-19.json\n`;

  const outMd = path.join(docsDir, 'ml-68-retrieval-domain-curation-validation-10cases-2026-04-19.md');
  fs.writeFileSync(outMd, md, 'utf-8');

  console.log(JSON.stringify(report, null, 2));
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
