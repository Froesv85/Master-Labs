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

function buildEvidenceTop1(input) {
  return `Contexto do projeto: ${input}`;
}

function baselinePrompt(sample) {
  return `Voce e o MakerBrain. Responda SOMENTE JSON valido em pt-BR.\nProjeto: ${sample.title}.\nContexto resumido: ${sample.input.slice(0, 800)}\n\nEvidencias tecnicas (top 3):\n${buildEvidenceText(sample.input)}\n\nFormato de saida obrigatorio:\n{"technicalRequirements":[{"name":"string","detail":"string"}],"suggestedBOM":[{"item":"string","quantity":1}],"confidenceScore":0}\n\nRegras:\n1) confidenceScore entre 0 e 100\n2) Sem markdown\n3) Maximo 6 itens por array.`;
}

function v2Prompt(sample) {
  return `Voce e o MakerBrain v2.3 (latency-only). Responda SOMENTE JSON valido em pt-BR.\nProjeto: ${sample.title}.\nContexto resumido: ${sample.input.slice(0, 360)}\n\nEvidencia tecnica (top 1):\n${buildEvidenceTop1(sample.input)}\n\nFormato de saida obrigatorio:\n{"schemaVersion":"mc_extract_v2","technicalRequirements":[{"id":"TR-1","name":"string","detail":"string","priority":"medium"}],"suggestedBOM":[{"item":"string","quantity":"1","notes":"string"}],"suggestedCode":"","confidenceScore":0}\n\nRegras duras:\n1) Sem markdown e sem texto fora do JSON\n2) confidenceScore entre 0 e 100\n3) priority apenas high, medium ou low\n4) technicalRequirements: minimo 3 e maximo 4 itens\n5) suggestedBOM: minimo 3 e maximo 4 itens\n6) quantity DEVE ser string (ex: "1", "2"), nunca numero\n7) detail e notes: texto minimo e direto (20 a 60 caracteres)\n8) suggestedCode deve ser string vazia\n9) Nao adicionar campos extras`;
}

function parseJsonFromResponse(text) {
  if (typeof text === 'object' && text !== null) {
    return text;
  }
  if (typeof text !== 'string') return null;
  const clean = text.replace(/```json/gi, '').replace(/```/g, '').trim();

  const tryParse = (value) => {
    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  };

  // 1) Fast path.
  const direct = tryParse(clean);
  if (direct) return direct;

  // 2) Remove uncommon control chars and trailing commas before ] or }.
  const sanitized = clean
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
    .replace(/,\s*([}\]])/g, '$1');

  const sanitizedParsed = tryParse(sanitized);
  if (sanitizedParsed) return sanitizedParsed;

  // 3) Try extracting the first JSON object block from noisy output.
  const firstBrace = sanitized.indexOf('{');
  const lastBrace = sanitized.lastIndexOf('}');
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    const sliced = sanitized.slice(firstBrace, lastBrace + 1);
    const slicedParsed = tryParse(sliced);
    if (slicedParsed) return slicedParsed;

    const slicedNoTrailingCommas = sliced.replace(/,\s*([}\]])/g, '$1');
    const repairedSliced = tryParse(slicedNoTrailingCommas);
    if (repairedSliced) return repairedSliced;
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

async function generate(prompt, numPredict = 280) {
  const started = Date.now();
  const controller = new AbortController();
  const timeoutMs = 120000;
  const timeoutHandle = setTimeout(() => controller.abort(), timeoutMs);
  let res;
  try {
    res = await fetch(`${BASE_URL}/api/generate`, {
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

  const data = await res.json();
  const latencyMs = Date.now() - started;
  const rawResponse = data.response ?? data;
  const parsed = parseJsonFromResponse(rawResponse);

  return {
    ok: res.ok,
    latencyMs,
    raw: data,
    rawResponsePreview:
      typeof rawResponse === 'string'
        ? rawResponse.slice(0, 300)
        : JSON.stringify(rawResponse).slice(0, 300),
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

function meetsThreshold(summary, minPercent = 95) {
  return summary.parseValidRatePercent >= minPercent && summary.schemaValidRatePercent >= minPercent;
}

async function runV2Progressive(samplesToRun, minPercent = 95) {
  const budgets = [560];
  const rounds = [];
  let best = null;

  for (const budget of budgets) {
    console.log(`[v2.3] Running round with num_predict=${budget}...`);
    const v2Results = [];

    for (const sample of samplesToRun) {
      const v = await generate(v2Prompt(sample), budget);
      v2Results.push({ ...v, sample });
    }

    const summary = summarize(v2Results, 'v2');
    const accepted = meetsThreshold(summary, minPercent);

    rounds.push({
      numPredict: budget,
      accepted,
      summary,
      perSample: v2Results.map((r) => ({
        id: r.sample.id,
        latencyMs: r.latencyMs,
        parseValid: Boolean(r.parsed),
        schemaValid: validateV2Shape(r.parsed),
        relevanceProxyPercent: r.parsed ? relevanceProxy(r.sample, r.parsed) : 0,
        rawResponsePreview: r.rawResponsePreview,
      })),
    });

    if (accepted) {
      console.log(
        `[v2.3] num_predict=${budget} accepted (parse=${summary.parseValidRatePercent}%, schema=${summary.schemaValidRatePercent}%, p50=${summary.p50LatencyMs}ms)`
      );
      best = {
        numPredict: budget,
        summary,
        perSample: rounds[rounds.length - 1].perSample,
      };
      continue;
    }

    console.log(
      `[v2.3] num_predict=${budget} rejected (parse=${summary.parseValidRatePercent}%, schema=${summary.schemaValidRatePercent}%). Stopping sweep.`
    );

    // Stop only after we have at least one accepted round and then regress.
    if (best) {
      break;
    }
  }

  return { rounds, best };
}

async function run() {
  const baselineResults = [];

  for (const sample of samples) {
    const b = await generate(baselinePrompt(sample), 280);
    baselineResults.push({ ...b, sample });
  }

  const baselineSummary = summarize(baselineResults, 'baseline');
  const minPercent = 95;
  const v2Progressive = await runV2Progressive(samples, minPercent);
  const v2Best =
    v2Progressive.best ||
    (v2Progressive.rounds.length
      ? {
          numPredict: null,
          summary: v2Progressive.rounds[0].summary,
          perSample: v2Progressive.rounds[0].perSample,
        }
      : {
          numPredict: null,
          summary: {
            total: samples.length,
            parseValidRatePercent: 0,
            schemaValidRatePercent: 0,
            p50LatencyMs: 0,
            p95LatencyMs: 0,
            relevanceProxyAvgPercent: 0,
          },
          perSample: [],
        });
  const v2Summary = v2Best.summary;

  const report = {
    generatedAt: new Date().toISOString(),
    model: MODEL,
    endpoint: BASE_URL,
    sampleSize: samples.length,
    minParseSchemaThresholdPercent: minPercent,
    baseline: baselineSummary,
    v2: v2Summary,
    v2BestNumPredict: v2Best.numPredict,
    v2Rounds: v2Progressive.rounds.map((r) => ({
      numPredict: r.numPredict,
      accepted: r.accepted,
      summary: r.summary,
    })),
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
        rawResponsePreview: r.rawResponsePreview,
      })),
      v2: v2Best.perSample,
    },
  };

  const docsDir = path.resolve(process.cwd(), 'docs');
  const outJson = path.join(docsDir, 'ml-66-benchmark-baseline-vs-v2_1.json');
  fs.writeFileSync(outJson, JSON.stringify(report, null, 2), 'utf-8');

  const roundsTable = report.v2Rounds
    .map(
      (r) =>
        `| ${r.numPredict} | ${r.accepted ? 'yes' : 'no'} | ${r.summary.parseValidRatePercent} | ${r.summary.schemaValidRatePercent} | ${r.summary.p50LatencyMs} | ${r.summary.p95LatencyMs} |`
    )
    .join('\n');

  const md = `# ML-66 Benchmark - Baseline vs Prompt v2.3\n\nGenerated at: ${report.generatedAt}\nModel: ${MODEL}\n\n## Summary\n\n| Metric | Baseline | v2.3 (fixed 560) | Delta |\n|---|---:|---:|---:|\n| Parse valid rate (%) | ${report.baseline.parseValidRatePercent} | ${report.v2.parseValidRatePercent} | ${report.delta.parseValidRatePercent} |\n| Schema valid rate (%) | ${report.baseline.schemaValidRatePercent} | ${report.v2.schemaValidRatePercent} | ${report.delta.schemaValidRatePercent} |\n| P50 latency (ms) | ${report.baseline.p50LatencyMs} | ${report.v2.p50LatencyMs} | ${report.delta.p50LatencyMs} |\n| P95 latency (ms) | ${report.baseline.p95LatencyMs} | ${report.v2.p95LatencyMs} | ${report.delta.p95LatencyMs} |\n| Relevance proxy avg (%) | ${report.baseline.relevanceProxyAvgPercent} | ${report.v2.relevanceProxyAvgPercent} | ${report.delta.relevanceProxyAvgPercent} |\n\nFixed v2.3 num_predict: ${report.v2BestNumPredict}\nTarget parse/schema threshold: >= ${report.minParseSchemaThresholdPercent}%\n\n## Fixed num_predict round\n\n| num_predict | accepted | parse (%) | schema (%) | p50 (ms) | p95 (ms) |\n|---:|:---:|---:|---:|---:|---:|\n${roundsTable}\n\n## Notes\n\n- v2.3 foca apenas em latencia real: top 1 evidencia, contexto mais curto, campos textuais minimos.\n- num_predict fixo em 560.\n- Relevance here is a proxy based on expected keyword coverage per sample.\n\n## Artifacts\n\n- JSON report: docs/ml-66-benchmark-baseline-vs-v2_1.json\n`;

  const outMd = path.join(docsDir, 'ml-66-benchmark-baseline-vs-v2_1.md');
  fs.writeFileSync(outMd, md, 'utf-8');

  console.log(JSON.stringify(report, null, 2));
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
