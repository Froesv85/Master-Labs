import fs from 'fs';
import path from 'path';

const BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
const MODEL = process.env.OLLAMA_CHAT_MODEL || 'qwen2.5:7b-instruct';

const samples = [
  {
    id: 'S1',
    title: 'Estacao meteo ESP32',
    input:
      'Projeto IoT com ESP32, sensor DHT22 e display OLED. Precisa medir temperatura e umidade, publicar via MQTT e manter baixo consumo. Firmware em C++ para Arduino framework.',
    expectedKeywords: ['esp32', 'dht22', 'mqtt', 'oled'],
  },
  {
    id: 'S2',
    title: 'Automacao de irrigacao',
    input:
      'Sistema de irrigacao com sensor de umidade de solo, rele 5V e bomba DC. Requisitos: leitura periodica, histerese para evitar liga/desliga rapido e log de falhas de sensor.',
    expectedKeywords: ['sensor', 'rele', 'bomba', 'histerese'],
  },
  {
    id: 'S3',
    title: 'Monitoramento industrial simples',
    input:
      'Monitorar vibracao com acelerometro MPU6050 e enviar alerta quando RMS passar limite. Precisa timestamp em RTC e redundancia de alimentacao com bateria.',
    expectedKeywords: ['mpu6050', 'rms', 'rtc', 'bateria'],
  },
  {
    id: 'S4',
    title: 'Casa inteligente',
    input:
      'Controlar iluminacao e presenca com ESP8266 e PIR, acionando lampadas por rele. Integracao com API HTTP e fallback local se internet cair.',
    expectedKeywords: ['esp8266', 'pir', 'rele', 'http'],
  },
];

function buildEvidenceText(input) {
  return [
    'Datasheet ESP32: GPIO, Wi-Fi e modos de economia de energia.',
    'Boas praticas MQTT: QoS, reconnect e keepalive.',
    `Contexto do projeto: ${input}`,
  ].join('\n---\n');
}

function baselinePrompt(sample) {
  return `Voce e o MakerBrain. Responda SOMENTE JSON valido em pt-BR.\nProjeto: ${sample.title}.\nContexto resumido: ${sample.input.slice(0, 800)}\n\nEvidencias tecnicas (top 3):\n${buildEvidenceText(sample.input)}\n\nFormato de saida obrigatorio:\n{"technicalRequirements":[{"name":"string","detail":"string"}],"suggestedBOM":[{"item":"string","quantity":1}],"confidenceScore":0}\n\nRegras:\n1) confidenceScore entre 0 e 100\n2) Sem markdown\n3) Maximo 6 itens por array.`;
}

function v2Prompt(sample) {
  return `Voce e o MakerBrain v2. Responda APENAS JSON valido, sem markdown, sem texto extra.\nIdioma: pt-BR.\nProjeto: ${sample.title}.\nEntrada do usuario: ${sample.input.slice(0, 900)}\n\nEvidencias tecnicas:\n${buildEvidenceText(sample.input)}\n\nSchema unico OBRIGATORIO:\n{\n  "schemaVersion":"mc_extract_v2",\n  "technicalRequirements":[\n    {"id":"TR-1","name":"string","detail":"string","priority":"high|medium|low"}\n  ],\n  "suggestedBOM":[\n    {"item":"string","quantity":"string","notes":"string"}\n  ],\n  "suggestedCode":"string",\n  "confidenceScore":0\n}\n\nRegras duras:\n1) schemaVersion deve ser exatamente mc_extract_v2\n2) Maximo 6 itens em technicalRequirements e suggestedBOM\n3) confidenceScore numero entre 0 e 100\n4) technicalRequirements[*].priority apenas high, medium ou low\n5) suggestedCode sempre string (vazia se nao houver)\n6) Se faltar dado, preencher campo com string vazia, nunca remover chave.`;
}

function parseJsonFromResponse(text) {
  if (typeof text !== 'string') return null;
  const clean = text.replace(/```json/gi, '').replace(/```/g, '').trim();
  try {
    return JSON.parse(clean);
  } catch {
    return null;
  }
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

function validateBaselineShape(output) {
  return Boolean(
    output &&
      Array.isArray(output.technicalRequirements) &&
      Array.isArray(output.suggestedBOM) &&
      Number.isFinite(Number(output.confidenceScore))
  );
}

function validateV2Shape(output) {
  if (!output || output.schemaVersion !== 'mc_extract_v2') return false;
  if (!Array.isArray(output.technicalRequirements) || !Array.isArray(output.suggestedBOM)) return false;
  if (!Number.isFinite(Number(output.confidenceScore))) return false;
  if (typeof output.suggestedCode !== 'string') return false;

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

async function generate(prompt) {
  const started = Date.now();
  const res = await fetch(`${BASE_URL}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: MODEL,
      prompt,
      stream: false,
      format: 'json',
      options: { temperature: 0.1, num_predict: 300 },
    }),
  });

  const data = await res.json();
  const latencyMs = Date.now() - started;
  const parsed = parseJsonFromResponse(data.response || '');

  return {
    ok: res.ok,
    latencyMs,
    raw: data,
    parsed,
  };
}

function percentile(sortedValues, p) {
  if (!sortedValues.length) return 0;
  const index = Math.min(sortedValues.length - 1, Math.max(0, Math.floor(sortedValues.length * p)));
  return sortedValues[index];
}

function summarize(results, mode) {
  const latencies = results.map((r) => r.latencyMs).sort((a, b) => a - b);
  const parsedCount = results.filter((r) => r.parsed !== null).length;

  const schemaValidCount = results.filter((r) =>
    mode === 'baseline' ? validateBaselineShape(r.parsed) : validateV2Shape(r.parsed)
  ).length;

  const relevanceScores = results
    .map((r) => (r.parsed ? relevanceProxy(r.sample, r.parsed) : 0))
    .filter((v) => Number.isFinite(v));

  const relevanceAvg =
    relevanceScores.length > 0
      ? Math.round((relevanceScores.reduce((a, b) => a + b, 0) / relevanceScores.length) * 100) / 100
      : 0;

  return {
    total: results.length,
    parseValidRatePercent: Math.round((parsedCount / results.length) * 10000) / 100,
    schemaValidRatePercent: Math.round((schemaValidCount / results.length) * 10000) / 100,
    p50LatencyMs: percentile(latencies, 0.5),
    p95LatencyMs: percentile(latencies, 0.95),
    relevanceProxyAvgPercent: relevanceAvg,
  };
}

async function run() {
  const baselineResults = [];
  const v2Results = [];

  for (const sample of samples) {
    const b = await generate(baselinePrompt(sample));
    baselineResults.push({ ...b, sample });

    const v = await generate(v2Prompt(sample));
    v2Results.push({ ...v, sample });
  }

  const baselineSummary = summarize(baselineResults, 'baseline');
  const v2Summary = summarize(v2Results, 'v2');

  const report = {
    generatedAt: new Date().toISOString(),
    model: MODEL,
    endpoint: BASE_URL,
    sampleSize: samples.length,
    baseline: baselineSummary,
    v2: v2Summary,
    delta: {
      parseValidRatePercent: Math.round((v2Summary.parseValidRatePercent - baselineSummary.parseValidRatePercent) * 100) / 100,
      schemaValidRatePercent: Math.round((v2Summary.schemaValidRatePercent - baselineSummary.schemaValidRatePercent) * 100) / 100,
      p50LatencyMs: v2Summary.p50LatencyMs - baselineSummary.p50LatencyMs,
      p95LatencyMs: v2Summary.p95LatencyMs - baselineSummary.p95LatencyMs,
      relevanceProxyAvgPercent:
        Math.round((v2Summary.relevanceProxyAvgPercent - baselineSummary.relevanceProxyAvgPercent) * 100) / 100,
    },
    perSample: {
      baseline: baselineResults.map((r) => ({
        id: r.sample.id,
        latencyMs: r.latencyMs,
        parseValid: Boolean(r.parsed),
        schemaValid: validateBaselineShape(r.parsed),
        relevanceProxyPercent: r.parsed ? relevanceProxy(r.sample, r.parsed) : 0,
      })),
      v2: v2Results.map((r) => ({
        id: r.sample.id,
        latencyMs: r.latencyMs,
        parseValid: Boolean(r.parsed),
        schemaValid: validateV2Shape(r.parsed),
        relevanceProxyPercent: r.parsed ? relevanceProxy(r.sample, r.parsed) : 0,
      })),
    },
  };

  const docsDir = path.resolve(process.cwd(), 'docs');
  const outJson = path.join(docsDir, 'ml-66-benchmark-baseline-vs-v2.json');
  fs.writeFileSync(outJson, JSON.stringify(report, null, 2), 'utf-8');

  const md = `# ML-66 Benchmark - Baseline vs Prompt v2\n\nGenerated at: ${report.generatedAt}\nModel: ${MODEL}\n\n## Summary\n\n| Metric | Baseline | v2 | Delta |\n|---|---:|---:|---:|\n| Parse valid rate (%) | ${report.baseline.parseValidRatePercent} | ${report.v2.parseValidRatePercent} | ${report.delta.parseValidRatePercent} |\n| Schema valid rate (%) | ${report.baseline.schemaValidRatePercent} | ${report.v2.schemaValidRatePercent} | ${report.delta.schemaValidRatePercent} |\n| P50 latency (ms) | ${report.baseline.p50LatencyMs} | ${report.v2.p50LatencyMs} | ${report.delta.p50LatencyMs} |\n| P95 latency (ms) | ${report.baseline.p95LatencyMs} | ${report.v2.p95LatencyMs} | ${report.delta.p95LatencyMs} |\n| Relevance proxy avg (%) | ${report.baseline.relevanceProxyAvgPercent} | ${report.v2.relevanceProxyAvgPercent} | ${report.delta.relevanceProxyAvgPercent} |\n\n## Notes\n\n- v2 enforces unified schema: \\\`schemaVersion: mc_extract_v2\\\`.\n- v2 requires strict fields for technicalRequirements and suggestedBOM.\n- Relevance here is a proxy based on expected keyword coverage per sample.\n\n## Artifacts\n\n- JSON report: \\\`docs/ml-66-benchmark-baseline-vs-v2.json\\\`\n`;

  const outMd = path.join(docsDir, 'ml-66-benchmark-baseline-vs-v2.md');
  fs.writeFileSync(outMd, md, 'utf-8');

  console.log(JSON.stringify(report, null, 2));
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
