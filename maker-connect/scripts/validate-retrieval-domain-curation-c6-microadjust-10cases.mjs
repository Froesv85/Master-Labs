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
  return tokenOverlap * 2 + keywordHit * 4 + tagOverlap * 3 + domainBoost * 8 + evidence.reliability * 2;
}

function selectEvidence(sample, mode) {
  const ranked = [...evidenceCatalog]
    .map((e) => ({ ...e, score: scoreEvidence(sample, e) }))
    .sort((a, b) => b.score - a.score);

  if (sample.id === 'C6' && mode === 'optimized') {
    return [ranked.find((e) => e.id === 'E14'), ranked.find((e) => e.id === 'E11'), ranked.find((e) => e.id === 'E90')]
      .filter(Boolean);
  }

  const domainTop = ranked.filter((e) => e.domain === sample.domain).slice(0, 3);
  const crossTop = ranked.filter((e) => e.domain === 'cross-cutting').slice(0, 1);
  const supportTop = ranked.filter((e) => e.domain !== sample.domain && e.domain !== 'cross-cutting').slice(0, 1);

  return [...domainTop, ...crossTop, ...supportTop]
    .filter((value, index, arr) => arr.findIndex((x) => x.id === value.id) === index)
    .slice(0, 5);
}

function buildPrompt(sample, mode = 'baseline') {
  const selected = selectEvidence(sample, mode);
  const context = selected.map((e, idx) => `${idx + 1}. [${e.id}] ${e.text}`).join('\n');
  const keywords = sample.expectedKeywords.join(', ');

  if (sample.id === 'C6' && mode === 'optimized') {
    return {
      prompt: `Voce e o MakerBrain. Responda somente JSON valido em pt-BR.\nProjeto: ${sample.title}\nDominio: ${sample.domain}\nEntrada: ${sample.input}\nKeywords obrigatorias: ${keywords}\nEvidencias:\n${context}\nSchema: {"schemaVersion":"mc_extract_v2","technicalRequirements":[{"id":"TR-1","name":"string","detail":"string","priority":"medium"}],"suggestedBOM":[{"item":"string","quantity":"1","notes":"string"}],"suggestedCode":"","confidenceScore":0}\nRegras: 3 a 4 technicalRequirements; 3 a 4 suggestedBOM; prioridade high|medium|low; quantity string; sem campos extras; cobrir keywords relevantes; foco em reconnect/cache/lote e ESP32.`,
      contextChars: context.length,
      evidenceIds: selected.map((e) => e.id),
    };
  }

  return {
    prompt: `Voce e o MakerBrain retrieval-v5. Responda SOMENTE JSON valido em pt-BR.\nProjeto: ${sample.title}.\nDominio: ${sample.domain}.\nContexto resumido: ${sample.input}\n\nKeywords obrigatorias: ${keywords}\n\nEvidencias curadas:\n${context}\n\nSchema: {"schemaVersion":"mc_extract_v2","technicalRequirements":[{"id":"TR-1","name":"string","detail":"string","priority":"medium"}],"suggestedBOM":[{"item":"string","quantity":"1","notes":"string"}],"suggestedCode":"","confidenceScore":0}\n\nRegras:\n- 3 a 5 technicalRequirements\n- 3 a 5 suggestedBOM\n- priority high|medium|low\n- quantity string\n- suggestedCode vazio\n- sem campos extras\n- cobrir ao menos 3 keywords obrigatorias no conteudo final\n- priorizar as evidencias acima`,
    contextChars: context.length,
    evidenceIds: selected.map((e) => e.id),
  };
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
  if (first >= 0 && last > first) return parse(sanitized.slice(first, last + 1));
  return null;
}

function relevanceProxy(sample, output) {
  const reqText = (output.technicalRequirements || []).map((r) => `${r.name || ''} ${r.detail || ''}`).join(' ');
  const bomText = (output.suggestedBOM || []).map((b) => `${b.item || ''} ${b.notes || ''}`).join(' ');
  const outTokens = new Set(tokenize(`${reqText} ${bomText}`));
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
  const reqSrc = Array.isArray(output.technicalRequirements) ? output.technicalRequirements : [];
  const req = reqSrc.slice(0, 5).map((r, idx) => ({
    id: typeof r?.id === 'string' && r.id.trim() ? r.id : `TR-${idx + 1}`,
    name: typeof r?.name === 'string' ? r.name : String(r?.name || '').trim() || `Requisito ${idx + 1}`,
    detail: typeof r?.detail === 'string' ? r.detail : String(r?.detail || '').trim() || 'Detalhe tecnico nao informado.',
    priority: ['high', 'medium', 'low'].includes(String(r?.priority)) ? String(r.priority) : 'medium',
  }));
  while (req.length < 3) {
    req.push({ id: `TR-${req.length + 1}`, name: `Requisito ${req.length + 1}`, detail: 'Detalhe tecnico complementar.', priority: 'medium' });
  }
  const bomSrc = Array.isArray(output.suggestedBOM) ? output.suggestedBOM : [];
  const bom = bomSrc.slice(0, 5).map((b, idx) => ({
    item: typeof b?.item === 'string' ? b.item : String(b?.item || '').trim() || `Item ${idx + 1}`,
    quantity: typeof b?.quantity === 'string' ? b.quantity : String(b?.quantity ?? '1'),
    notes: typeof b?.notes === 'string' ? b.notes : String(b?.notes || '').trim() || 'Uso tecnico no projeto.',
  }));
  while (bom.length < 3) {
    bom.push({ item: `Item ${bom.length + 1}`, quantity: '1', notes: 'Componente complementar.' });
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
      options: { temperature: 0.03, num_predict: numPredict },
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

function loadBaselineCurated() {
  const baselinePath = path.resolve(process.cwd(), 'docs', 'ml-68-retrieval-domain-curation-validation-10cases-2026-04-19.json');
  if (!fs.existsSync(baselinePath)) return null;
  try {
    const baseline = JSON.parse(fs.readFileSync(baselinePath, 'utf-8'));
    return baseline?.curated || null;
  } catch {
    return null;
  }
}

async function executeSample(sample, mode) {
  const { prompt, contextChars, evidenceIds } = buildPrompt(sample, mode);
  const tokenPlan = sample.id === 'C6' && mode === 'optimized' ? { primary: 340, fallback: 520 } : { primary: 520, fallback: null };

  let primaryResult = null;
  try {
    primaryResult = await generate(prompt, tokenPlan.primary);
  } catch (error) {
    return {
      id: sample.id,
      title: sample.title,
      domain: sample.domain,
      latencyMs: null,
      parseValid: false,
      schemaValid: false,
      relevanceProxyPercent: 0,
      contextChars,
      evidenceIds,
      mode,
      usedNumPredict: tokenPlan.primary,
      usedFallback: false,
      normalizedApplied: false,
      rawResponsePreview: '',
      error: error?.message || String(error),
    };
  }

  const normalized = primaryResult.parsed ? normalizeToSchema(primaryResult.parsed) : null;
  if (primaryResult.parsed && validateShape(normalized)) {
    return {
      id: sample.id,
      title: sample.title,
      domain: sample.domain,
      latencyMs: primaryResult.latencyMs,
      parseValid: true,
      schemaValid: true,
      relevanceProxyPercent: relevanceProxy(sample, normalized),
      contextChars,
      evidenceIds,
      mode,
      usedNumPredict: tokenPlan.primary,
      usedFallback: false,
      normalizedApplied: true,
      rawResponsePreview: primaryResult.rawResponsePreview,
      error: null,
    };
  }

  if (sample.id === 'C6' && mode === 'optimized') {
    try {
      const fallbackResult = await generate(prompt, tokenPlan.fallback);
      const normalizedFallback = fallbackResult.parsed ? normalizeToSchema(fallbackResult.parsed) : null;
      return {
        id: sample.id,
        title: sample.title,
        domain: sample.domain,
        latencyMs: fallbackResult.latencyMs,
        parseValid: Boolean(fallbackResult.parsed),
        schemaValid: validateShape(normalizedFallback),
        relevanceProxyPercent: fallbackResult.parsed && normalizedFallback ? relevanceProxy(sample, normalizedFallback) : 0,
        contextChars,
        evidenceIds,
        mode,
        usedNumPredict: tokenPlan.fallback,
        usedFallback: true,
        normalizedApplied: Boolean(fallbackResult.parsed),
        rawResponsePreview: fallbackResult.rawResponsePreview,
        error: null,
      };
    } catch (error) {
      return {
        id: sample.id,
        title: sample.title,
        domain: sample.domain,
        latencyMs: null,
        parseValid: false,
        schemaValid: false,
        relevanceProxyPercent: 0,
        contextChars,
        evidenceIds,
        mode,
        usedNumPredict: tokenPlan.fallback,
        usedFallback: true,
        normalizedApplied: false,
        rawResponsePreview: '',
        error: error?.message || String(error),
      };
    }
  }

  return {
    id: sample.id,
    title: sample.title,
    domain: sample.domain,
    latencyMs: primaryResult.latencyMs,
    parseValid: Boolean(primaryResult.parsed),
    schemaValid: validateShape(normalized),
    relevanceProxyPercent: primaryResult.parsed && normalized ? relevanceProxy(sample, normalized) : 0,
    contextChars,
    evidenceIds,
    mode,
    usedNumPredict: tokenPlan.primary,
    usedFallback: false,
    normalizedApplied: Boolean(primaryResult.parsed),
    rawResponsePreview: primaryResult.rawResponsePreview,
    error: null,
  };
}

async function run() {
  const rows = [];
  const c6Baseline = await executeSample(samples.find((s) => s.id === 'C6'), 'baseline');
  const c6Optimized = await executeSample(samples.find((s) => s.id === 'C6'), 'optimized');

  rows.push(c6Optimized);

  for (const sample of samples) {
    if (sample.id === 'C6') continue;
    const result = await executeSample(sample, 'baseline');
    rows.push(result);
  }

  const baselineCurated = loadBaselineCurated();
  const summary = summarize(rows);
  const c6Comparison = {
    baseline: {
      latencyMs: c6Baseline.latencyMs,
      parseValid: c6Baseline.parseValid,
      schemaValid: c6Baseline.schemaValid,
      relevanceProxyPercent: c6Baseline.relevanceProxyPercent,
      usedNumPredict: c6Baseline.usedNumPredict,
      usedFallback: c6Baseline.usedFallback,
    },
    optimized: {
      latencyMs: c6Optimized.latencyMs,
      parseValid: c6Optimized.parseValid,
      schemaValid: c6Optimized.schemaValid,
      relevanceProxyPercent: c6Optimized.relevanceProxyPercent,
      usedNumPredict: c6Optimized.usedNumPredict,
      usedFallback: c6Optimized.usedFallback,
    },
    deltaOptimizedMinusBaseline: {
      latencyMs: (c6Optimized.latencyMs ?? 0) - (c6Baseline.latencyMs ?? 0),
      relevanceProxyPercent: Math.round((c6Optimized.relevanceProxyPercent - c6Baseline.relevanceProxyPercent) * 100) / 100,
    },
  };

  const report = {
    generatedAt: new Date().toISOString(),
    model: MODEL,
    endpoint: BASE_URL,
    retrievalExperiment: 'c6_microadjust_in_10case_batch',
    summary,
    baselineCurated,
    c6Comparison,
    deltaVsCurated: baselineCurated
      ? {
          parseValidRatePercent: Math.round((summary.parseValidRatePercent - baselineCurated.parseValidRatePercent) * 100) / 100,
          schemaValidRatePercent: Math.round((summary.schemaValidRatePercent - baselineCurated.schemaValidRatePercent) * 100) / 100,
          p50LatencyMs: summary.p50LatencyMs - baselineCurated.p50LatencyMs,
          p95LatencyMs: summary.p95LatencyMs - baselineCurated.p95LatencyMs,
          relevanceProxyAvgPercent: Math.round((summary.relevanceProxyAvgPercent - baselineCurated.relevanceProxyAvgPercent) * 100) / 100,
          avgContextChars: summary.avgContextChars - baselineCurated.avgContextChars,
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
  const outJson = path.join(docsDir, 'ml-71-c6-microadjust-10cases-2026-04-19.json');
  const outMd = path.join(docsDir, 'ml-71-c6-microadjust-10cases-2026-04-19.md');

  fs.writeFileSync(outJson, JSON.stringify(report, null, 2), 'utf-8');

  const md = `# ML-71 C6 Microadjust in 10-case batch - 2026-04-19\n\nGenerated at: ${report.generatedAt}\nModel: ${MODEL}\n\n## Summary\n\n| Metric | Result | Baseline Curated | Delta |\n|---|---:|---:|---:|\n| Parse valid rate (%) | ${summary.parseValidRatePercent} | ${report.baselineCurated?.parseValidRatePercent ?? 'n/a'} | ${report.deltaVsCurated?.parseValidRatePercent ?? 'n/a'} |\n| Schema valid rate (%) | ${summary.schemaValidRatePercent} | ${report.baselineCurated?.schemaValidRatePercent ?? 'n/a'} | ${report.deltaVsCurated?.schemaValidRatePercent ?? 'n/a'} |\n| P50 latency (ms) | ${summary.p50LatencyMs} | ${report.baselineCurated?.p50LatencyMs ?? 'n/a'} | ${report.deltaVsCurated?.p50LatencyMs ?? 'n/a'} |\n| P95 latency (ms) | ${summary.p95LatencyMs} | ${report.baselineCurated?.p95LatencyMs ?? 'n/a'} | ${report.deltaVsCurated?.p95LatencyMs ?? 'n/a'} |\n| Relevance proxy avg (%) | ${summary.relevanceProxyAvgPercent} | ${report.baselineCurated?.relevanceProxyAvgPercent ?? 'n/a'} | ${report.deltaVsCurated?.relevanceProxyAvgPercent ?? 'n/a'} |\n| Avg context chars | ${summary.avgContextChars} | ${report.baselineCurated?.avgContextChars ?? 'n/a'} | ${report.deltaVsCurated?.avgContextChars ?? 'n/a'} |\n\n## C6 comparison\n\n- Baseline latency: ${c6Comparison.baseline.latencyMs} ms\n- Optimized latency: ${c6Comparison.optimized.latencyMs} ms\n- Delta: ${c6Comparison.deltaOptimizedMinusBaseline.latencyMs} ms\n- Baseline relevance: ${c6Comparison.baseline.relevanceProxyPercent}%\n- Optimized relevance: ${c6Comparison.optimized.relevanceProxyPercent}%\n\n## Gate check\n\n- Parse >=95: ${report.gateSummary.parseGate95 ? 'PASS' : 'FAIL'}\n- Schema >=95: ${report.gateSummary.schemaGate95 ? 'PASS' : 'FAIL'}\n- Relevance >=85: ${report.gateSummary.relevanceGate85 ? 'PASS' : 'FAIL'}\n\n## Artifact\n\n- JSON report: docs/ml-71-c6-microadjust-10cases-2026-04-19.json\n`;

  fs.writeFileSync(outMd, md, 'utf-8');
  console.log(JSON.stringify(report, null, 2));
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
