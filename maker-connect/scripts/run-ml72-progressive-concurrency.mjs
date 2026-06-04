import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';

const CONCURRENCY_STEPS = [1, 2, 3];
const MAX_P95_MS = Number(process.env.ML72_GATE_MAX_P95_MS || 40000);
const BASE_DIR = process.cwd();
const DOCS_DIR = path.resolve(BASE_DIR, 'docs');
const RUNNER_SCRIPT = path.resolve(BASE_DIR, 'scripts', 'validate-retrieval-domain-curation-async-q4-10cases.mjs');
const BASE_REPORT_JSON = path.resolve(DOCS_DIR, 'ml-72-async-q4-parallel-cache-10cases-2026-04-19.json');
const BASE_REPORT_MD = path.resolve(DOCS_DIR, 'ml-72-async-q4-parallel-cache-10cases-2026-04-19.md');

function nowTag() {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

function runStep(concurrency) {
  const env = {
    ...process.env,
    OLLAMA_CHAT_MODEL: process.env.OLLAMA_CHAT_MODEL || 'qwen2.5:7b-instruct-q4_K_M',
    OLLAMA_FALLBACK_MODEL: process.env.OLLAMA_FALLBACK_MODEL || 'qwen2.5:7b-instruct',
    OLLAMA_EMBEDDING_MODEL: process.env.OLLAMA_EMBEDDING_MODEL || 'nomic-embed-text',
    ENABLE_EMBEDDINGS: process.env.ENABLE_EMBEDDINGS || 'true',
    PROMPT_PROFILE: process.env.PROMPT_PROFILE || 'default',
    REQUEST_TIMEOUT_MS: process.env.REQUEST_TIMEOUT_MS || '180000',
    OLLAMA_CONCURRENCY: String(concurrency),
  };

  const result = spawnSync(process.execPath, [RUNNER_SCRIPT], {
    cwd: BASE_DIR,
    env,
    encoding: 'utf-8',
    stdio: 'pipe',
  });

  if (result.status !== 0) {
    throw new Error(`Falha ao executar concorrencia=${concurrency}. stderr=${(result.stderr || '').slice(0, 300)}`);
  }

  const report = JSON.parse(fs.readFileSync(BASE_REPORT_JSON, 'utf-8'));
  const tag = nowTag();
  const stepJson = path.resolve(DOCS_DIR, `ml-72-progressive-concurrency-${concurrency}-${tag}.json`);
  const stepMd = path.resolve(DOCS_DIR, `ml-72-progressive-concurrency-${concurrency}-${tag}.md`);

  fs.copyFileSync(BASE_REPORT_JSON, stepJson);
  if (fs.existsSync(BASE_REPORT_MD)) {
    fs.copyFileSync(BASE_REPORT_MD, stepMd);
  }

  const gate = {
    parse: Number(report?.summary?.parseValidRatePercent || 0) >= 95,
    schema: Number(report?.summary?.schemaValidRatePercent || 0) >= 95,
    p95: Number(report?.summary?.p95LatencyMs || Number.MAX_SAFE_INTEGER) <= MAX_P95_MS,
  };

  return {
    concurrency,
    parseValidRatePercent: Number(report?.summary?.parseValidRatePercent || 0),
    schemaValidRatePercent: Number(report?.summary?.schemaValidRatePercent || 0),
    p50LatencyMs: Number(report?.summary?.p50LatencyMs || 0),
    p95LatencyMs: Number(report?.summary?.p95LatencyMs || 0),
    relevanceProxyAvgPercent: Number(report?.summary?.relevanceProxyAvgPercent || 0),
    gate,
    gatePass: gate.parse && gate.schema && gate.p95,
    artifactJson: path.relative(BASE_DIR, stepJson).replace(/\\/g, '/'),
    artifactMd: path.relative(BASE_DIR, stepMd).replace(/\\/g, '/'),
  };
}

function writeFinalReport(rows, stoppedAt) {
  const output = {
    generatedAt: new Date().toISOString(),
    strategy: 'progressive-concurrency-gate',
    promptProfile: process.env.PROMPT_PROFILE || 'default',
    gate: {
      parseMinPercent: 95,
      schemaMinPercent: 95,
      p95MaxMs: MAX_P95_MS,
    },
    steps: rows,
    stoppedAt,
  };

  const jsonPath = path.resolve(DOCS_DIR, 'ml-72-progressive-concurrency-gate-report-2026-04-19.json');
  const mdPath = path.resolve(DOCS_DIR, 'ml-72-progressive-concurrency-gate-report-2026-04-19.md');

  fs.writeFileSync(jsonPath, JSON.stringify(output, null, 2), 'utf-8');

  const tableRows = rows
    .map(
      (row) =>
        `| ${row.concurrency} | ${row.parseValidRatePercent} | ${row.schemaValidRatePercent} | ${row.p50LatencyMs} | ${row.p95LatencyMs} | ${row.relevanceProxyAvgPercent} | ${row.gatePass ? 'PASS' : 'FAIL'} |`
    )
    .join('\n');

  const md = `# ML-72 Progressive Concurrency Gate Report - 2026-04-19\n\nGenerated at: ${output.generatedAt}\nPrompt profile: ${output.promptProfile}\n\n## Gate config\n\n- Parse >= ${output.gate.parseMinPercent}%\n- Schema >= ${output.gate.schemaMinPercent}%\n- P95 <= ${output.gate.p95MaxMs} ms\n\n## Steps\n\n| Concurrency | Parse (%) | Schema (%) | P50 (ms) | P95 (ms) | Relevance (%) | Gate |\n|---:|---:|---:|---:|---:|---:|---|\n${tableRows}\n\nStopped at concurrency: ${stoppedAt}\n`; 

  fs.writeFileSync(mdPath, md, 'utf-8');
  return { jsonPath, mdPath, output };
}

async function run() {
  const rows = [];
  let stoppedAt = 0;

  for (const concurrency of CONCURRENCY_STEPS) {
    const row = runStep(concurrency);
    rows.push(row);
    stoppedAt = concurrency;

    if (!row.gatePass) {
      break;
    }
  }

  const final = writeFinalReport(rows, stoppedAt);
  console.log(JSON.stringify(final.output, null, 2));
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
