import fs from 'fs';
import path from 'path';

const BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
const MODEL = process.env.OLLAMA_CHAT_MODEL || 'qwen2.5:7b-instruct';

const samples = [
  {
    id: 'C1',
    title: 'Estacao meteo ESP32',
    input:
      'Projeto IoT com ESP32, sensor DHT22 e display OLED. Precisa medir temperatura e umidade, publicar via MQTT e manter baixo consumo.',
    expectedKeywords: ['esp32', 'dht22', 'mqtt', 'oled'],
  },
  {
    id: 'C2',
    title: 'Irrigacao automatica',
    input:
      'Sistema de irrigacao com sensor de umidade de solo, rele 5V e bomba DC. Requisitos: leitura periodica, histerese e log de falhas.',
    expectedKeywords: ['sensor', 'rele', 'bomba', 'histerese'],
  },
  {
    id: 'C3',
    title: 'Monitoramento de vibracao',
    input:
      'Monitorar vibracao com MPU6050 e enviar alerta quando RMS passar limite. Precisa timestamp em RTC e redundancia por bateria.',
    expectedKeywords: ['mpu6050', 'rms', 'rtc', 'bateria'],
  },
  {
    id: 'C4',
    title: 'Casa inteligente com fallback local',
    input:
      'Controlar iluminacao e presenca com ESP8266 e PIR, acionando lampadas por rele. Integracao com API HTTP e fallback local.',
    expectedKeywords: ['esp8266', 'pir', 'rele', 'http'],
  },
  {
    id: 'C5',
    title: 'Controle de motor com ponte H',
    input:
      'Controle de motor DC com ponte H L298N, limite de corrente e protecao termica. Precisa telemetria de falhas por MQTT.',
    expectedKeywords: ['ponte', 'l298n', 'corrente', 'mqtt'],
  },
  {
    id: 'C6',
    title: 'Telemetria com wifi instavel',
    input:
      'Gateway de telemetria com ESP32 em rede instavel. Exige reconnect automatico, cache local e envio em lote quando voltar link.',
    expectedKeywords: ['esp32', 'reconnect', 'cache', 'lote'],
  },
  {
    id: 'C7',
    title: 'Monitor de bateria',
    input:
      'Projeto para monitorar tensao de bateria Li-Ion com alerta de subtensao, registro de ciclos e desligamento seguro.',
    expectedKeywords: ['bateria', 'tensao', 'alerta', 'desligamento'],
  },
  {
    id: 'C8',
    title: 'Log de manutencao maker',
    input:
      'Registrar manutencao de bancada com sensores de corrente e temperatura, historico de falhas e checklist tecnico por execucao.',
    expectedKeywords: ['corrente', 'temperatura', 'falhas', 'checklist'],
  },
  {
    id: 'C9',
    title: 'Sensores analogicos com calibracao',
    input:
      'Leitura de sensores analogicos com filtro de ruido, calibracao em dois pontos e armazenamento de parametros de ajuste.',
    expectedKeywords: ['analogicos', 'filtro', 'calibracao', 'parametros'],
  },
  {
    id: 'C10',
    title: 'Pipeline com anonimiza PII',
    input:
      'Extrair requisitos tecnicos de texto com dados pessoais embutidos. Exigir anonimiza de PII, trilha auditavel e output JSON valido.',
    expectedKeywords: ['anonimiza', 'pii', 'auditavel', 'json'],
  },
];

function buildPromptV3(sample) {
  return `Voce e o MakerBrain v3. Responda SOMENTE JSON valido em pt-BR.\nProjeto: ${sample.title}.\nContexto: ${sample.input.slice(0, 420)}\n\nSchema obrigatorio:\n{"schemaVersion":"mc_extract_v2","technicalRequirements":[{"id":"TR-1","name":"string","detail":"string","priority":"medium"}],"suggestedBOM":[{"item":"string","quantity":"1","notes":"string"}],"suggestedCode":"","confidenceScore":0}\n\nRegras:\n1) Nao use markdown e nao escreva fora do JSON\n2) schemaVersion deve ser mc_extract_v2\n3) technicalRequirements: minimo 3 e maximo 5 itens\n4) suggestedBOM: minimo 3 e maximo 5 itens\n5) quantity sempre string\n6) priority somente high, medium ou low\n7) suggestedCode deve ser string vazia\n8) confidenceScore de 0 a 100\n9) So usar termos tecnicos aderentes ao contexto maker IoT\n10) Se faltar dado, manter a chave e usar string curta, sem remover campos`;
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

function tokenize(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length >= 3);
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

function validateV3Shape(output) {
  if (!output || output.schemaVersion !== 'mc_extract_v2') return false;
  if (!Array.isArray(output.technicalRequirements) || !Array.isArray(output.suggestedBOM)) return false;
  if (typeof output.suggestedCode !== 'string') return false;
  if (!Number.isFinite(Number(output.confidenceScore))) return false;

  if (output.technicalRequirements.length < 3 || output.technicalRequirements.length > 5) return false;
  if (output.suggestedBOM.length < 3 || output.suggestedBOM.length > 5) return false;

  const reqValid = output.technicalRequirements.every(
    (r) =>
      typeof r?.id === 'string' &&
      typeof r?.name === 'string' &&
      typeof r?.detail === 'string' &&
      ['high', 'medium', 'low'].includes(String(r?.priority))
  );

  const bomValid = output.suggestedBOM.every(
    (b) => typeof b?.item === 'string' && typeof b?.quantity === 'string' && typeof b?.notes === 'string'
  );

  return reqValid && bomValid;
}

async function generate(prompt, numPredict = 560) {
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
  const latencyMs = Date.now() - started;
  const rawResponse = data.response ?? data;
  const parsed = parseJsonFromResponse(rawResponse);

  return {
    ok: response.ok,
    latencyMs,
    parsed,
    rawResponsePreview:
      typeof rawResponse === 'string'
        ? rawResponse.slice(0, 280)
        : JSON.stringify(rawResponse).slice(0, 280),
  };
}

function percentile(sortedValues, p) {
  if (!sortedValues.length) return 0;
  const index = Math.min(sortedValues.length - 1, Math.max(0, Math.floor(sortedValues.length * p)));
  return sortedValues[index];
}

async function run() {
  const results = [];

  for (const sample of samples) {
    const output = await generate(buildPromptV3(sample));
    results.push({ ...output, sample });
  }

  const latencies = results.map((r) => r.latencyMs).sort((a, b) => a - b);
  const parseValid = results.filter((r) => Boolean(r.parsed)).length;
  const schemaValid = results.filter((r) => validateV3Shape(r.parsed)).length;
  const relevanceScores = results.map((r) => (r.parsed ? relevanceProxy(r.sample, r.parsed) : 0));
  const relevanceAvg = Math.round((relevanceScores.reduce((a, b) => a + b, 0) / relevanceScores.length) * 100) / 100;

  const report = {
    generatedAt: new Date().toISOString(),
    model: MODEL,
    endpoint: BASE_URL,
    promptVersion: 'v3',
    sampleSize: samples.length,
    summary: {
      parseValidRatePercent: Math.round((parseValid / samples.length) * 10000) / 100,
      schemaValidRatePercent: Math.round((schemaValid / samples.length) * 10000) / 100,
      p50LatencyMs: percentile(latencies, 0.5),
      p95LatencyMs: percentile(latencies, 0.95),
      relevanceProxyAvgPercent: relevanceAvg,
    },
    passFail: {
      parseGate95: parseValid / samples.length >= 0.95,
      schemaGate95: schemaValid / samples.length >= 0.95,
      relevanceGate85: relevanceAvg >= 85,
    },
    perSample: results.map((r) => ({
      id: r.sample.id,
      title: r.sample.title,
      latencyMs: r.latencyMs,
      parseValid: Boolean(r.parsed),
      schemaValid: validateV3Shape(r.parsed),
      relevanceProxyPercent: r.parsed ? relevanceProxy(r.sample, r.parsed) : 0,
      rawResponsePreview: r.rawResponsePreview,
    })),
  };

  const docsDir = path.resolve(process.cwd(), 'docs');
  const outJson = path.join(docsDir, 'ml-66-prompt-v3-validation-10cases-2026-04-19.json');
  fs.writeFileSync(outJson, JSON.stringify(report, null, 2), 'utf-8');

  const tableRows = report.perSample
    .map(
      (r) =>
        `| ${r.id} | ${r.parseValid ? 'yes' : 'no'} | ${r.schemaValid ? 'yes' : 'no'} | ${r.latencyMs} | ${r.relevanceProxyPercent} |`
    )
    .join('\n');

  const md = `# ML-66 Prompt v3 Validation - 10 Cases\n\nGenerated at: ${report.generatedAt}\nModel: ${MODEL}\n\n## Summary\n\n| Metric | Value |\n|---|---:|\n| Parse valid rate (%) | ${report.summary.parseValidRatePercent} |\n| Schema valid rate (%) | ${report.summary.schemaValidRatePercent} |\n| P50 latency (ms) | ${report.summary.p50LatencyMs} |\n| P95 latency (ms) | ${report.summary.p95LatencyMs} |\n| Relevance proxy avg (%) | ${report.summary.relevanceProxyAvgPercent} |\n\n## Gates\n\n| Gate | Result |\n|---|---|\n| Parse >= 95% | ${report.passFail.parseGate95 ? 'PASS' : 'FAIL'} |\n| Schema >= 95% | ${report.passFail.schemaGate95 ? 'PASS' : 'FAIL'} |\n| Relevance >= 85% | ${report.passFail.relevanceGate85 ? 'PASS' : 'FAIL'} |\n\n## Per sample\n\n| Case | Parse | Schema | Latency (ms) | Relevance (%) |\n|---|---|---|---:|---:|\n${tableRows}\n\n## Artifact\n\n- JSON report: docs/ml-66-prompt-v3-validation-10cases-2026-04-19.json\n`;

  const outMd = path.join(docsDir, 'ml-66-prompt-v3-validation-10cases-2026-04-19.md');
  fs.writeFileSync(outMd, md, 'utf-8');

  console.log(JSON.stringify(report, null, 2));
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
