/**
 * RAG Quality Eval — Semana 4 S1.3
 *
 * Submete 10 projetos IoT holdout pelo pipeline completo:
 *   POST /api/projects/{id}/extract → n8n → Ollama → callback
 *
 * Scoring por projeto (0–100):
 *   - Keyword coverage  40%  (expected keywords found in output)
 *   - Confidence score  30%  (normalised from output.confidenceScore)
 *   - Completeness      30%  (BOM ≥3 items + requirements ≥3 items)
 *
 * Meta: avg relevance ≥ 85%
 *
 * Usage:
 *   node scripts/rag-eval.mjs [--dry-run] [--timeout 120]
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const BASE_URL = process.env.API_URL ?? 'http://localhost:3000';
const POLL_INTERVAL_MS = 6000;
const TIMEOUT_MS = (Number(process.argv.find(a => a.startsWith('--timeout='))?.split('=')[1]) || 150) * 1000;
const DRY_RUN = process.argv.includes('--dry-run');

// ── Holdout Dataset ──────────────────────────────────────────────────────────
const HOLDOUT = [
  {
    id: 'H01',
    title: 'LoRaWAN Asset Tracker',
    input: 'Rastreador de ativos industriais com módulo LoRa SX1276, GPS NEO-6M e ESP32. Envia posição GPS a cada 60s para servidor TTN via LoRaWAN. Deve operar com bateria LiPo de 3.7V e ter modo sleep para economizar energia. Inclui acelerômetro MPU6050 para detectar queda ou impacto.',
    expectedKeywords: ['lora', 'gps', 'ttn', 'esp32', 'bateria', 'sleep'],
  },
  {
    id: 'H02',
    title: 'Controlador de Estufa Automatizado',
    input: 'Sistema de controle de estufa agrícola com sensores DHT22 (temperatura/umidade), sensor de CO2 MH-Z19 e ESP32. Controla ventiladores, aquecedores e irrigação por relé 10A. Lógica de histerese para cada atuador. Dados publicados em dashboard via MQTT broker Mosquitto.',
    expectedKeywords: ['dht22', 'co2', 'rele', 'histerese', 'mqtt', 'ventilador'],
  },
  {
    id: 'H03',
    title: 'Monitor de Qualidade do Ar',
    input: 'Monitor portátil de qualidade do ar com sensor de CO2 SCD30, partículas PM2.5 PMS5003 e VOC SGP30. Display e-ink 2.9 polegadas para exibição sem backlight. Alimentado por USB-C com carregamento solar. Publica leituras por BLE para smartphone e armazena localmente em cartão SD.',
    expectedKeywords: ['co2', 'pm2.5', 'voc', 'display', 'ble', 'sd'],
  },
  {
    id: 'H04',
    title: 'Fechadura Inteligente com RFID',
    input: 'Controle de acesso com leitor RFID RC522, servo motor MG996R e ESP32. Log de acesso com timestamp em memória flash. Integração com API REST para cadastro de cartões autorizados. Alerta por buzzer em acesso negado e LED RGB indicador de status. Alimentação por fonte 5V.',
    expectedKeywords: ['rfid', 'servo', 'esp32', 'log', 'rest', 'buzzer'],
  },
  {
    id: 'H05',
    title: 'Monitor de Energia Residencial',
    input: 'Monitor de consumo elétrico residencial com sensor de corrente SCT-013 e ESP8266. Mede potência real, fator de potência e kWh acumulado. Exibe dados em display LCD I2C 16x2 e publica via MQTT para Home Assistant. Alerta quando consumo ultrapassar limite configurável.',
    expectedKeywords: ['corrente', 'potencia', 'kwh', 'lcd', 'mqtt', 'home assistant'],
  },
  {
    id: 'H06',
    title: 'Controlador de Aquário Inteligente',
    input: 'Sistema de automação para aquário com sensor de temperatura DS18B20, pH ORP-10 e turbidez. Controla bomba de circulação, aquecedor e iluminação LED por relé. ESP32 com interface web local para configuração de parâmetros. Alarme sonoro quando temperatura ou pH sair da faixa ideal.',
    expectedKeywords: ['temperatura', 'ph', 'bomba', 'aquecedor', 'rele', 'esp32'],
  },
  {
    id: 'H07',
    title: 'Sensor de Nível de Caixa D\'água',
    input: 'Monitoramento de nível de reservatório com sensor ultrassônico HC-SR04 e ESP8266. Calcula volume em litros com base na geometria do reservatório. Controla bomba via relé com setpoints configuráveis. Envia notificações Telegram quando nível crítico. LED semáforo para indicação visual.',
    expectedKeywords: ['ultrassonico', 'volume', 'rele', 'bomba', 'telegram', 'nivel'],
  },
  {
    id: 'H08',
    title: 'Gateway Industrial Modbus para MQTT',
    input: 'Gateway de protocolo industrial com ESP32 e módulo RS485 MAX485. Lê registros Modbus RTU de CLPs e inversores de frequência. Converte e publica dados em JSON via MQTT com QoS 1. Suporte a múltiplos escravos Modbus com timeout e retry. Watchdog de hardware para reinício automático.',
    expectedKeywords: ['modbus', 'rs485', 'clp', 'mqtt', 'json', 'watchdog'],
  },
  {
    id: 'H09',
    title: 'Robô de Inspeção com Câmera',
    input: 'Robô de inspeção remota com ESP32-CAM, motores DC com encoder e ponte H L298N. Transmissão de vídeo MJPEG por WiFi com latência menor que 200ms. Controle direcional via WebSocket. Sensor de distância ultrassônico para desvio de obstáculos. Alimentação por bateria NiMH recarregável.',
    expectedKeywords: ['esp32-cam', 'encoder', 'l298n', 'websocket', 'obstaculos', 'bateria'],
  },
  {
    id: 'H10',
    title: 'Detector de Fumaça com Evacuação',
    input: 'Sistema de detecção de fumaça com sensor MQ-2 e detector óptico de partículas. Aciona sirene piezoelétrica, luz estroboscópica e envia SMS via módulo SIM800L em caso de alarme. ESP32 com watchdog e backup de energia por supercapacitor. Integração com painel de alarme por protocolo RS485.',
    expectedKeywords: ['mq-2', 'sirene', 'sms', 'sim800l', 'watchdog', 'rs485'],
  },
];

// ── Scoring ──────────────────────────────────────────────────────────────────
function normalize(str) {
  return str.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

function scoreResult(output, expectedKeywords) {
  if (!output) return 0;

  const outputText = normalize(JSON.stringify(output));

  // Keyword coverage (40%) — accent-insensitive
  const hits = expectedKeywords.filter(kw => outputText.includes(normalize(kw)));
  const kwScore = hits.length / expectedKeywords.length;

  // Confidence score (30%) — LLM returns 0–1 or 0–10 inconsistently; auto-detect
  const rawConf = output.confidenceScore;
  const confidence = typeof rawConf === 'number'
    ? (rawConf <= 1 ? rawConf : Math.min(rawConf, 10) / 10)
    : 0;

  // Completeness (30%)
  const bomCount = Array.isArray(output.suggestedBOM) ? output.suggestedBOM.length : 0;
  const reqCount = Array.isArray(output.technicalRequirements) ? output.technicalRequirements.length : 0;
  const completeness = ((bomCount >= 3 ? 1 : bomCount / 3) + (reqCount >= 3 ? 1 : reqCount / 3)) / 2;

  return Math.round((kwScore * 0.4 + confidence * 0.3 + completeness * 0.3) * 100);
}

// ── Helpers ──────────────────────────────────────────────────────────────────
async function pollUntilDone(logId, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const log = await prisma.projectExtractionLog.findUnique({
      where: { id: logId },
      select: { status: true, output: true, latencyMs: true, error: true },
    });
    if (!log) throw new Error(`Log ${logId} not found`);
    if (log.status === 'done' || log.status === 'failed') return log;
    await new Promise(r => setTimeout(r, POLL_INTERVAL_MS));
  }
  return { status: 'timeout', output: null, latencyMs: null, error: 'timeout' };
}

function percentile(sorted, p) {
  if (sorted.length === 0) return 0;
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, idx)];
}

function bar(score, width = 30) {
  const filled = Math.round((score / 100) * width);
  return '[' + '█'.repeat(filled) + '░'.repeat(width - filled) + ']';
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('\n════════════════════════════════════════════════════');
  console.log('  RAG Quality Eval — S1.3 Holdout Dataset');
  console.log(`  ${new Date().toLocaleString('pt-BR')} | ${DRY_RUN ? 'DRY RUN' : 'LIVE'}`);
  console.log('════════════════════════════════════════════════════\n');

  // Use first available user as creator
  const creator = await prisma.user.findFirst({ select: { id: true, email: true } });
  if (!creator) throw new Error('No user found in DB — run seed first.');
  console.log(`Using creator: ${creator.email} (id=${creator.id})\n`);

  const results = [];

  for (const sample of HOLDOUT) {
    process.stdout.write(`[${sample.id}] ${sample.title.padEnd(40)} `);

    if (DRY_RUN) {
      console.log('SKIP (dry-run)');
      continue;
    }

    // Create throwaway project
    const project = await prisma.project.create({
      data: {
        title: `[EVAL] ${sample.title}`,
        description: `RAG eval holdout — ${sample.id}`,
        category: 'IoT',
        creatorId: creator.id,
      },
    });

    // Trigger extraction via API
    const triggerRes = await fetch(`${BASE_URL}/api/projects/${project.id}/extract`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ input: sample.input, source: 'manual' }),
    });

    if (!triggerRes.ok) {
      const err = await triggerRes.text();
      console.log(`FAIL (trigger ${triggerRes.status}: ${err.slice(0, 80)})`);
      results.push({ ...sample, status: 'failed', score: 0, latencyMs: null });
      continue;
    }

    const { data: triggerData } = await triggerRes.json();
    const logId = triggerData.logId;

    // Poll for completion
    const log = await pollUntilDone(logId, TIMEOUT_MS);

    if (log.status !== 'done') {
      console.log(`${log.status.toUpperCase().padEnd(8)} latency=n/a  score= 0%`);
      results.push({ ...sample, status: log.status, score: 0, latencyMs: null });
      continue;
    }

    let output = null;
    try { output = JSON.parse(log.output); } catch { /* raw */ }

    const score = scoreResult(output, sample.expectedKeywords);
    const hits = sample.expectedKeywords.filter(kw =>
      normalize(JSON.stringify(output ?? '')).includes(normalize(kw))
    );
    const latSec = log.latencyMs ? (log.latencyMs / 1000).toFixed(1) : '?';

    console.log(`done     lat=${latSec}s  score=${String(score).padStart(3)}%  kw=${hits.length}/${sample.expectedKeywords.length}`);
    results.push({ ...sample, status: 'done', score, latencyMs: log.latencyMs });
  }

  if (DRY_RUN) {
    console.log('\nDataset validado. Execute sem --dry-run para rodar o eval completo.\n');
    await prisma.$disconnect();
    return;
  }

  // ── Report ─────────────────────────────────────────────────────────────────
  const done = results.filter(r => r.status === 'done');
  const scores = done.map(r => r.score).sort((a, b) => a - b);
  const latencies = done.map(r => r.latencyMs).filter(Boolean).sort((a, b) => a - b);
  const avgScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
  const p50score = percentile(scores, 50);
  const p95score = percentile(scores, 95);
  const p50lat = percentile(latencies, 50);
  const p95lat = percentile(latencies, 95);

  console.log('\n════════════════════════════════════════════════════');
  console.log('  RESULTADO FINAL');
  console.log('════════════════════════════════════════════════════');
  console.log(`  Projetos avaliados : ${done.length}/${HOLDOUT.length}`);
  console.log(`  Relevance avg      : ${avgScore}%  ${bar(avgScore)}`);
  console.log(`  Relevance p50      : ${p50score}%`);
  console.log(`  Relevance p95      : ${p95score}%`);
  console.log(`  Latência p50       : ${p50lat ? (p50lat / 1000).toFixed(1) + 's' : 'n/a'}`);
  console.log(`  Latência p95       : ${p95lat ? (p95lat / 1000).toFixed(1) + 's' : 'n/a'}`);
  console.log(`  Meta relevance     : ≥ 85%  → ${avgScore >= 85 ? '✅ PASS' : '❌ FAIL'}`);
  console.log('════════════════════════════════════════════════════');

  // Detail table
  console.log('\n  Detalhe por projeto:');
  console.log('  ─────────────────────────────────────────────────');
  for (const r of results) {
    const status = r.status === 'done' ? `${r.score}%` : r.status.toUpperCase();
    const lat = r.latencyMs ? `${(r.latencyMs / 1000).toFixed(0)}s` : '—';
    console.log(`  [${r.id}] ${r.title.slice(0, 32).padEnd(32)} ${String(status).padStart(6)}  ${lat.padStart(5)}`);
  }

  // Save report to file
  const report = {
    runAt: new Date().toISOString(),
    totalProjects: HOLDOUT.length,
    completed: done.length,
    avgRelevance: avgScore,
    p50Relevance: p50score,
    p95Relevance: p95score,
    p50LatencyMs: p50lat,
    p95LatencyMs: p95lat,
    pass: avgScore >= 85,
    results: results.map(r => ({
      id: r.id,
      title: r.title,
      status: r.status,
      score: r.score,
      latencyMs: r.latencyMs,
    })),
  };

  const outPath = new URL('../scripts/rag-eval-report.json', import.meta.url);
  import('fs').then(({ writeFileSync }) => {
    writeFileSync(outPath, JSON.stringify(report, null, 2));
    console.log(`\n  Relatório salvo em: scripts/rag-eval-report.json\n`);
  });

  await prisma.$disconnect();
}

main().catch(async err => {
  console.error('\nErro fatal:', err.message);
  await prisma.$disconnect();
  process.exit(1);
});
