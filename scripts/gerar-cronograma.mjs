/**
 * Gera cronograma.xlsx do projeto MakerConnect — PAC Extensionista
 * Uso: cd maker-connect && node ../scripts/gerar-cronograma.mjs
 * Saída: docs/cronograma-makerconnect-2026.xlsx
 */

import ExcelJS from 'exceljs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, '..', 'docs', 'cronograma-makerconnect-2026.xlsx');

// ── Paleta de cores ────────────────────────────────────────────────────────────
const C = {
  headerBg:    'FF1E293B', headerFg:   'FFFFFFFF',
  fase1Bg:     'FF1D4ED8', fase1Fg:    'FFFFFFFF',
  fase2Bg:     'FF7C3AED', fase2Fg:    'FFFFFFFF',
  fase3Bg:     'FF0F766E', fase3Fg:    'FFFFFFFF',
  fase4Bg:     'FFB45309', fase4Fg:    'FFFFFFFF',
  done:        'FFD1FAE5', doneFg:     'FF065F46',
  inProgress:  'FFFEF3C7', inFg:       'FF92400E',
  pending:     'FFF1F5F9', pendingFg:  'FF475569',
  gatePASS:    'FF16A34A', gateFAIL:   'FFDC2626',
  gatePartial: 'FFD97706', gateN:      'FF64748B',
  borderColor: 'FFCBD5E1',
  sectionBg:   'FFF8FAFC',
  altRow:      'FFFAFAFA',
};

function border() {
  const s = { style: 'thin', color: { argb: C.borderColor } };
  return { top: s, left: s, bottom: s, right: s };
}

function hdr(txt, bg, fg, bold = true) {
  return {
    value: txt,
    style: {
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } },
      font: { bold, color: { argb: fg }, name: 'Calibri', size: 10 },
      alignment: { horizontal: 'center', vertical: 'middle', wrapText: true },
      border: border(),
    },
  };
}

function cell(txt, opt = {}) {
  const { bg = 'FFFFFFFF', fg = 'FF1E293B', bold = false, align = 'left', indent = 0 } = opt;
  return {
    value: txt,
    style: {
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } },
      font: { bold, color: { argb: fg }, name: 'Calibri', size: 10 },
      alignment: { horizontal: align, vertical: 'middle', wrapText: true, indent },
      border: border(),
    },
  };
}

function statusCell(status) {
  const map = {
    'Concluído':        { bg: C.done,       fg: C.doneFg,   sym: '✓' },
    'Em andamento':     { bg: C.inProgress, fg: C.inFg,     sym: '►' },
    'Pendente':         { bg: C.pending,    fg: C.pendingFg, sym: '○' },
    'PASS':             { bg: C.done,       fg: C.gatePASS, sym: '✓ PASS' },
    'Partial PASS':     { bg: C.inProgress, fg: C.gatePartial, sym: '~ Parcial' },
    'Previsto':         { bg: C.pending,    fg: C.pendingFg, sym: '○ Previsto' },
  };
  const m = map[status] ?? map['Pendente'];
  return cell(`${m.sym}  ${status}`, { bg: m.bg, fg: m.fg, align: 'center' });
}

function gateCell(result) {
  const map = {
    'PASS':     { bg: C.done,       fg: C.gatePASS,    v: '✓ PASS' },
    'Partial':  { bg: C.inProgress, fg: C.gatePartial, v: '~ Parcial' },
    'Previsto': { bg: C.pending,    fg: C.gateN,       v: '○ Previsto' },
  };
  const m = map[result] ?? map['Previsto'];
  return cell(m.v, { bg: m.bg, fg: m.fg, align: 'center', bold: true });
}

// ── Dados do cronograma ────────────────────────────────────────────────────────

const FASES = [
  {
    fase: 'FASE 1 — Foundation + Pipeline IA',
    cor: C.fase1Bg, corFg: C.fase1Fg,
    semanas: [
      {
        num: 1, periodo: '20 – 26 Abr',
        tema: 'Sprint 0 Final + Kickoff S1B',
        entregas: [
          { item: 'Setup repositório e ambiente', status: 'Concluído', gate: '' },
          { item: 'Banco de dados + Prisma + conexão', status: 'Concluído', gate: '' },
          { item: 'Schema inicial e seed mínimo', status: 'Concluído', gate: '' },
          { item: 'Primeira API e feed inicial', status: 'Concluído', gate: '' },
          { item: 'Auth JWT (ML-95) — signup/login/logout', status: 'Concluído', gate: '' },
        ],
      },
      {
        num: 2, periodo: '27 Abr – 03 Mai',
        tema: 'Gate S1.1 + Camada Social',
        entregas: [
          { item: 'Pipeline IA ponta a ponta (extração → n8n → callback)', status: 'Concluído', gate: 'PASS' },
          { item: 'LGPD — anonimização PII (email/telefone/CPF)', status: 'Concluído', gate: '' },
          { item: 'Feed social (ML-32) — filtros, busca, paginação', status: 'Concluído', gate: '' },
          { item: 'Fork com linhagem (parentId)', status: 'Concluído', gate: '' },
          { item: 'Comunidades — posts, membership, aprovação (ML-93/83/84)', status: 'Concluído', gate: '' },
          { item: 'Suite de testes: 143 testes / 0 falhas', status: 'Concluído', gate: '' },
        ],
      },
      {
        num: 3, periodo: '29 Abr – 09 Mai',
        tema: 'Audit Trail LGPD + Frontend Comunidades',
        entregas: [
          { item: 'LgpdAuditLog — modelo, migration, integração no callback', status: 'Concluído', gate: '' },
          { item: 'GET /api/lgpd/audit — listagem com filtros e paginação', status: 'Concluído', gate: '' },
          { item: 'Frontend comunidades — botão Join, estados pending/member', status: 'Concluído', gate: '' },
          { item: 'Upload de imagem em posts (S3/MinIO)', status: 'Concluído', gate: '' },
          { item: 'UI aprovação de membros (founder/mod)', status: 'Concluído', gate: '' },
          { item: 'Suite: 156 testes / 0 falhas', status: 'Concluído', gate: '' },
        ],
      },
      {
        num: 4, periodo: '12 – 18 Mai',
        tema: 'Gate S1.2 + Instrumentação de Latência',
        entregas: [
          { item: 'Gate S1.2 — E2E pipeline validado + audit trail + 0 falhas', status: 'Concluído', gate: 'PASS' },
          { item: 'Timing middleware — anonymizeMs, n8nTriggerMs', status: 'Concluído', gate: '' },
          { item: 'Métricas p50/p95 — GET /api/admin/metrics', status: 'Concluído', gate: '' },
          { item: 'Dashboard /admin/metrics com seção de latência', status: 'Concluído', gate: '' },
          { item: 'Suite: 161 testes / 0 falhas', status: 'Concluído', gate: '' },
        ],
      },
      {
        num: 5, periodo: '19 – 25 Mai',
        tema: 'RAG Quality Eval — Meta ≥ 85%',
        entregas: [
          { item: 'Holdout dataset H01–H10 (10 projetos IoT reais)', status: 'Concluído', gate: '' },
          { item: 'Script rag-eval.mjs — score (keywords 40% + confidence 30% + completeness 30%)', status: 'Concluído', gate: '' },
          { item: 'Rodada 1: relevance = 79% (abaixo da meta)', status: 'Concluído', gate: '' },
          { item: 'Fix: normalização Unicode NFD + escala confidenceScore', status: 'Concluído', gate: '' },
          { item: 'Rodada final: relevance = 98% (meta: ≥ 85%) ✓', status: 'Concluído', gate: '' },
        ],
      },
      {
        num: 6, periodo: '26 Mai – 03 Jun',
        tema: 'Gate S1.3 + Robôs e Perfis',
        entregas: [
          { item: 'Gate S1.3 — relevance 98% ✓ | latência 137s (CPU s/ GPU) ⚠', status: 'Concluído', gate: 'Partial' },
          { item: 'Cadastro de robôs — categoria, dimensões, componentes, fotos', status: 'Concluído', gate: '' },
          { item: 'Competições e premiações de robôs', status: 'Concluído', gate: '' },
          { item: 'Feed UI MakerWorld-style — cards image-first, modal 3D', status: 'Concluído', gate: '' },
          { item: 'Project media — API images/files, upload S3', status: 'Concluído', gate: '' },
          { item: 'Suite: 174 testes / 0 falhas', status: 'Concluído', gate: '' },
        ],
      },
    ],
  },
  {
    fase: 'FASE 2 — MVP Completo',
    cor: C.fase2Bg, corFg: C.fase2Fg,
    semanas: [
      {
        num: 7, periodo: '04 – 10 Jun',
        tema: 'PDF Export — BullMQ + pdfkit (backend)',
        entregas: [
          { item: 'lib/pdf-queue.ts — BullMQ producer (jobId + Redis)', status: 'Pendente', gate: '' },
          { item: 'workers/pdf-worker.ts — consumer assíncrono', status: 'Pendente', gate: '' },
          { item: 'lib/pdf-generator.ts — cover + BOM + requirements + LGPD footer', status: 'Pendente', gate: '' },
          { item: 'POST /api/projects/[id]/export + GET polling de status', status: 'Pendente', gate: '' },
          { item: 'Testes unitários pdf-generator', status: 'Pendente', gate: '' },
        ],
      },
      {
        num: 8, periodo: '11 – 17 Jun',
        tema: 'Export History UI + E2E + Decisão Infra GPU',
        entregas: [
          { item: 'Frontend: botão "Exportar PDF" + estados de progresso', status: 'Pendente', gate: '' },
          { item: 'Página /projects/[id]/export — histórico de exports', status: 'Pendente', gate: '' },
          { item: '15+ testes E2E do fluxo de exportação', status: 'Pendente', gate: '' },
          { item: 'Decisão de infra GPU (KVM4 vs Gemini API) até 15/06', status: 'Pendente', gate: '' },
          { item: 'Revisão de código completa da feature', status: 'Pendente', gate: '' },
        ],
      },
      {
        num: 9, periodo: '18 – 24 Jun',
        tema: 'E2E Flows Completos + Nova Infra',
        entregas: [
          { item: 'E2E flow: Feed → Extract IA → Export PDF', status: 'Pendente', gate: '' },
          { item: 'Migração para nova infra GPU / Gemini API', status: 'Pendente', gate: '' },
          { item: 'Latência p95 medida com nova infra (meta: < 15 000 ms)', status: 'Pendente', gate: '' },
          { item: 'Load test: 10 exports simultâneos sem crash', status: 'Pendente', gate: '' },
        ],
      },
      {
        num: 10, periodo: '25 Jun – 01 Jul',
        tema: 'Gate S1.4 — PDF + Latência OK',
        entregas: [
          { item: 'Gate S1.4 — PDF E2E + p95 < 15 000 ms + RAG ≥ 85% + 0 falhas', status: 'Previsto', gate: 'Previsto' },
          { item: 'Fechar tickets Jira ML-5, ML-6', status: 'Pendente', gate: '' },
          { item: 'Planning para Fase 3 (Julho)', status: 'Pendente', gate: '' },
        ],
      },
      {
        num: 11, periodo: '02 – 15 Jul',
        tema: 'Autenticação E2E + OpenAPI',
        entregas: [
          { item: 'Fluxo E2E completo com autenticação JWT', status: 'Pendente', gate: '' },
          { item: 'Error handling global e logging estruturado', status: 'Pendente', gate: '' },
          { item: 'Documentação OpenAPI/Swagger auto-gerada', status: 'Pendente', gate: '' },
        ],
      },
      {
        num: 12, periodo: '16 – 29 Jul',
        tema: 'Documentação Técnica + C4 Diagram',
        entregas: [
          { item: 'ARCHITECTURE.md com diagrama C4 completo', status: 'Pendente', gate: '' },
          { item: 'DEPLOYMENT.md — guia de deploy AWS/VPS', status: 'Pendente', gate: '' },
          { item: '10+ ADRs (decisões técnicas documentadas)', status: 'Pendente', gate: '' },
          { item: 'README atualizado com exemplos de uso', status: 'Pendente', gate: '' },
        ],
      },
    ],
  },
  {
    fase: 'FASE 3 — Qualidade e Documentação',
    cor: C.fase3Bg, corFg: C.fase3Fg,
    semanas: [
      {
        num: 13, periodo: '30 Jul – 20 Ago',
        tema: 'Cobertura de Testes + Code Quality',
        entregas: [
          { item: 'Cobertura unit > 80%', status: 'Pendente', gate: '' },
          { item: 'Cobertura integração > 70%', status: 'Pendente', gate: '' },
          { item: 'ESLint + Prettier — zero erros', status: 'Pendente', gate: '' },
          { item: 'TypeScript strict mode passando', status: 'Pendente', gate: '' },
          { item: 'Lighthouse performance > 80', status: 'Pendente', gate: '' },
          { item: 'TEST_REPORT.md com breakdowns', status: 'Pendente', gate: '' },
        ],
      },
      {
        num: 14, periodo: '21 Ago – 10 Set',
        tema: 'Documentação para Banca',
        entregas: [
          { item: 'Slides de apresentação (20-30 slides)', status: 'Pendente', gate: '' },
          { item: 'Resumo de 1 página (PDF)', status: 'Pendente', gate: '' },
          { item: 'Documento Q&A técnico para banca', status: 'Pendente', gate: '' },
          { item: 'Script de demo ao vivo (com plano de contingência)', status: 'Pendente', gate: '' },
          { item: 'Vídeo demo (YouTube unlisted, ~5 min)', status: 'Pendente', gate: '' },
        ],
      },
    ],
  },
  {
    fase: 'FASE 4 — Banca e Entrega Final',
    cor: C.fase4Bg, corFg: C.fase4Fg,
    semanas: [
      {
        num: 15, periodo: '11 Set – 08 Out',
        tema: 'Ensaios + Cleanup Final',
        entregas: [
          { item: 'Ensaios da apresentação com colegas/professores', status: 'Pendente', gate: '' },
          { item: 'Refinamento de slides e timing (5-7 min pitch + Q&A)', status: 'Pendente', gate: '' },
          { item: 'Remover secrets do repositório', status: 'Pendente', gate: '' },
          { item: 'Code review final e cleanup', status: 'Pendente', gate: '' },
          { item: 'Backup completo (GitHub + local)', status: 'Pendente', gate: '' },
        ],
      },
      {
        num: 16, periodo: 'Out – Nov 2026',
        tema: 'Banca Final + Entrega TCC',
        entregas: [
          { item: 'Validações finais do sistema', status: 'Pendente', gate: '' },
          { item: 'Correções de última hora (buffer)', status: 'Pendente', gate: '' },
          { item: 'BANCA — Apresentação e Defesa', status: 'Pendente', gate: 'Previsto' },
          { item: 'Entrega do TCC na instituição', status: 'Pendente', gate: '' },
        ],
      },
    ],
  },
];

// ── Gates resumo ───────────────────────────────────────────────────────────────
const GATES = [
  { gate: 'S1.1', data: '28/04/2026', criterios: 'Pipeline E2E + PII + callback + 0 falhas', resultado: 'PASS', obs: 'latencyMs = 49s' },
  { gate: 'S1.2', data: '13/05/2026', criterios: 'LGPD audit trail + 0 falhas na suite', resultado: 'PASS', obs: '161 testes' },
  { gate: 'S1.3', data: '27/05/2026', criterios: 'RAG relevance ≥ 85% + latência < 15s + dashboard', resultado: 'Partial', obs: 'relevance=98% ✓ | latência=137s (sem GPU) ⚠' },
  { gate: 'S1.4', data: '25/06/2026', criterios: 'PDF export E2E + latência < 15s (nova infra) + 0 falhas', resultado: 'Previsto', obs: 'Depende de decisão infra GPU até 15/06' },
];

// ── Métricas alcançadas ────────────────────────────────────────────────────────
const METRICAS = [
  { metrica: 'Relevância RAG', meta: '≥ 85%', alcancado: '98%', status: 'PASS' },
  { metrica: 'Latência p95 (CPU local)', meta: '< 15 000 ms', alcancado: '~137 000 ms', status: 'Parcial' },
  { metrica: 'Cobertura de testes', meta: '> 160 testes', alcancado: '174 testes', status: 'PASS' },
  { metrica: 'Suites sem falha', meta: '24 suites', alcancado: '24 / 0 falhas', status: 'PASS' },
  { metrica: 'Gate S1.1', meta: 'PASS', alcancado: 'PASS (28/04)', status: 'PASS' },
  { metrica: 'Gate S1.2', meta: 'PASS', alcancado: 'PASS (13/05)', status: 'PASS' },
  { metrica: 'Gate S1.3', meta: 'PASS', alcancado: 'Partial (relevance OK, latência ⚠)', status: 'Parcial' },
];

// ── Geração do workbook ────────────────────────────────────────────────────────

const wb = new ExcelJS.Workbook();
wb.creator = 'Vinicius Froes';
wb.subject = 'MakerConnect — Cronograma PAC Extensionista';
wb.created = new Date();

// ═══════════════════════════════════════════════════════════════════════════════
// ABA 1 — CRONOGRAMA COMPLETO
// ═══════════════════════════════════════════════════════════════════════════════

const ws = wb.addWorksheet('Cronograma', {
  pageSetup: { paperSize: 9, orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0 },
  views: [{ state: 'frozen', ySplit: 3 }],
});

ws.columns = [
  { key: 'fase',      width: 30 },
  { key: 'semana',    width: 8  },
  { key: 'periodo',   width: 16 },
  { key: 'tema',      width: 38 },
  { key: 'entrega',   width: 56 },
  { key: 'status',    width: 18 },
  { key: 'gate',      width: 16 },
];

// Linha 1 — Título do projeto
ws.mergeCells('A1:G1');
const title = ws.getCell('A1');
title.value = 'MakerConnect — Cronograma do Projeto PAC Extensionista';
title.style = {
  fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: C.headerBg } },
  font: { bold: true, color: { argb: 'FFFFFFFF' }, name: 'Calibri', size: 14 },
  alignment: { horizontal: 'center', vertical: 'middle' },
};
ws.getRow(1).height = 28;

// Linha 2 — Sub-título
ws.mergeCells('A2:G2');
const sub = ws.getCell('A2');
sub.value = 'Universidade Católica de Santa Catarina — Engenharia de Software 7ª Fase — Acadêmico: Vinicius Froes | Professor: Andrei Carniel';
sub.style = {
  fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF334155' } },
  font: { italic: true, color: { argb: 'FFCBD5E1' }, name: 'Calibri', size: 10 },
  alignment: { horizontal: 'center', vertical: 'middle' },
};
ws.getRow(2).height = 18;

// Linha 3 — Cabeçalho das colunas
const headers = ['Fase', 'Semana', 'Período', 'Tema da Sprint', 'Entrega / Atividade', 'Status', 'Gate'];
const hRow = ws.getRow(3);
headers.forEach((h, i) => {
  const c = hRow.getCell(i + 1);
  c.value = h;
  c.style = {
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: C.headerBg } },
    font: { bold: true, color: { argb: 'FFFFFFFF' }, name: 'Calibri', size: 10 },
    alignment: { horizontal: 'center', vertical: 'middle' },
    border: border(),
  };
});
hRow.height = 20;

// Linhas de dados
let rowIdx = 4;
let altToggle = false;

for (const fase of FASES) {
  const faseStart = rowIdx;

  for (const sem of fase.semanas) {
    const semStart = rowIdx;

    for (const e of sem.entregas) {
      const r = ws.getRow(rowIdx);
      const bg = altToggle ? C.altRow : 'FFFFFFFF';

      // Col A — Fase (será mesclada depois)
      const cA = r.getCell(1);
      cA.value = rowIdx === faseStart ? fase.fase : '';
      cA.style = {
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: fase.cor } },
        font: { bold: rowIdx === faseStart, color: { argb: fase.corFg }, name: 'Calibri', size: 9 },
        alignment: { horizontal: 'center', vertical: 'middle', wrapText: true },
        border: border(),
      };

      // Col B — Nº semana (será mesclada depois)
      const cB = r.getCell(2);
      cB.value = rowIdx === semStart ? sem.num : '';
      cB.style = {
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: rowIdx === semStart ? fase.cor : bg } },
        font: { bold: true, color: { argb: rowIdx === semStart ? fase.corFg : 'FF64748B' }, name: 'Calibri', size: 10 },
        alignment: { horizontal: 'center', vertical: 'middle' },
        border: border(),
      };

      // Col C — Período
      const cC = r.getCell(3);
      cC.value = rowIdx === semStart ? sem.periodo : '';
      cC.style = {
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } },
        font: { name: 'Calibri', size: 9, color: { argb: 'FF475569' } },
        alignment: { horizontal: 'center', vertical: 'middle', wrapText: true },
        border: border(),
      };

      // Col D — Tema
      const cD = r.getCell(4);
      cD.value = rowIdx === semStart ? sem.tema : '';
      cD.style = {
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } },
        font: { bold: rowIdx === semStart, name: 'Calibri', size: 9.5, color: { argb: 'FF1E293B' } },
        alignment: { horizontal: 'left', vertical: 'middle', wrapText: true },
        border: border(),
      };

      // Col E — Entrega
      r.getCell(5).value = e.item;
      r.getCell(5).style = {
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } },
        font: { name: 'Calibri', size: 9.5, color: { argb: 'FF1E293B' } },
        alignment: { horizontal: 'left', vertical: 'middle', wrapText: true, indent: 1 },
        border: border(),
      };

      // Col F — Status
      const stMap = {
        'Concluído':    { bg: C.done,       fg: C.doneFg,    v: '✓  Concluído' },
        'Em andamento': { bg: C.inProgress, fg: C.inFg,      v: '►  Em andamento' },
        'Pendente':     { bg: C.pending,    fg: C.pendingFg, v: '○  Pendente' },
        'Previsto':     { bg: C.pending,    fg: C.pendingFg, v: '○  Previsto' },
      };
      const sm = stMap[e.status] ?? stMap['Pendente'];
      r.getCell(6).value = sm.v;
      r.getCell(6).style = {
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: sm.bg } },
        font: { name: 'Calibri', size: 9, color: { argb: sm.fg } },
        alignment: { horizontal: 'center', vertical: 'middle' },
        border: border(),
      };

      // Col G — Gate
      if (e.gate) {
        const gMap = {
          'PASS':     { bg: C.done,       fg: C.gatePASS,    v: '✓ PASS' },
          'Partial':  { bg: C.inProgress, fg: C.gatePartial, v: '~ Parcial' },
          'Previsto': { bg: C.pending,    fg: C.gateN,       v: '○ Previsto' },
        };
        const gm = gMap[e.gate] ?? gMap['Previsto'];
        r.getCell(7).value = gm.v;
        r.getCell(7).style = {
          fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: gm.bg } },
          font: { bold: true, name: 'Calibri', size: 9, color: { argb: gm.fg } },
          alignment: { horizontal: 'center', vertical: 'middle' },
          border: border(),
        };
      } else {
        r.getCell(7).value = '';
        r.getCell(7).style = {
          fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } },
          border: border(),
        };
      }

      r.height = 18;
      altToggle = !altToggle;
      rowIdx++;
    }

    // Merge semana cols B, C, D
    if (sem.entregas.length > 1) {
      ws.mergeCells(semStart, 2, rowIdx - 1, 2);
      ws.mergeCells(semStart, 3, rowIdx - 1, 3);
      ws.mergeCells(semStart, 4, rowIdx - 1, 4);
    }
  }

  // Merge col A para toda a fase
  if (rowIdx - 1 > faseStart) {
    ws.mergeCells(faseStart, 1, rowIdx - 1, 1);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// ABA 2 — GATES E MÉTRICAS
// ═══════════════════════════════════════════════════════════════════════════════

const ws2 = wb.addWorksheet('Gates e Métricas');

ws2.columns = [
  { key: 'a', width: 12 },
  { key: 'b', width: 16 },
  { key: 'c', width: 50 },
  { key: 'd', width: 16 },
  { key: 'e', width: 42 },
];

// Título
ws2.mergeCells('A1:E1');
const t2 = ws2.getCell('A1');
t2.value = 'Gates de Qualidade — MakerConnect PAC Extensionista';
t2.style = {
  fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: C.headerBg } },
  font: { bold: true, color: { argb: 'FFFFFFFF' }, size: 13, name: 'Calibri' },
  alignment: { horizontal: 'center', vertical: 'middle' },
};
ws2.getRow(1).height = 26;

// Headers gates
const gh = ['Gate', 'Data', 'Critérios de Aceite', 'Resultado', 'Observações'];
const ghr = ws2.getRow(2);
gh.forEach((h, i) => {
  const c = ghr.getCell(i + 1);
  c.value = h;
  c.style = {
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: C.headerBg } },
    font: { bold: true, color: { argb: 'FFFFFFFF' }, name: 'Calibri', size: 10 },
    alignment: { horizontal: 'center', vertical: 'middle' },
    border: border(),
  };
});
ghr.height = 18;

GATES.forEach((g, i) => {
  const r = ws2.getRow(3 + i);
  const alt = i % 2 === 0 ? 'FFFFFFFF' : C.altRow;

  r.getCell(1).value = g.gate;
  r.getCell(1).style = { fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: C.headerBg } }, font: { bold: true, color: { argb: 'FFFFFFFF' }, name: 'Calibri', size: 10 }, alignment: { horizontal: 'center', vertical: 'middle' }, border: border() };

  r.getCell(2).value = g.data;
  r.getCell(2).style = { fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: alt } }, font: { name: 'Calibri', size: 10 }, alignment: { horizontal: 'center', vertical: 'middle' }, border: border() };

  r.getCell(3).value = g.criterios;
  r.getCell(3).style = { fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: alt } }, font: { name: 'Calibri', size: 10 }, alignment: { wrapText: true, vertical: 'middle' }, border: border() };

  const resMap = { 'PASS': { bg: C.done, fg: C.gatePASS, v: '✓ PASS' }, 'Partial': { bg: C.inProgress, fg: C.gatePartial, v: '~ Parcial' }, 'Previsto': { bg: C.pending, fg: C.gateN, v: '○ Previsto' } };
  const rm = resMap[g.resultado] ?? resMap['Previsto'];
  r.getCell(4).value = rm.v;
  r.getCell(4).style = { fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: rm.bg } }, font: { bold: true, color: { argb: rm.fg }, name: 'Calibri', size: 10 }, alignment: { horizontal: 'center', vertical: 'middle' }, border: border() };

  r.getCell(5).value = g.obs;
  r.getCell(5).style = { fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: alt } }, font: { name: 'Calibri', size: 10, italic: true }, alignment: { wrapText: true, vertical: 'middle' }, border: border() };

  r.height = 22;
});

// Espaço
ws2.getRow(3 + GATES.length + 1).height = 10;

// Métricas alcançadas
const mTitleRow = 3 + GATES.length + 2;
ws2.mergeCells(`A${mTitleRow}:E${mTitleRow}`);
const mt = ws2.getCell(`A${mTitleRow}`);
mt.value = 'Métricas Alcançadas';
mt.style = {
  fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: C.headerBg } },
  font: { bold: true, color: { argb: 'FFFFFFFF' }, size: 12, name: 'Calibri' },
  alignment: { horizontal: 'center', vertical: 'middle' },
};
ws2.getRow(mTitleRow).height = 22;

const mhRow = ws2.getRow(mTitleRow + 1);
['Métrica', 'Meta', 'Alcançado', 'Status', ''].forEach((h, i) => {
  const c = mhRow.getCell(i + 1);
  c.value = h;
  c.style = { fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: C.headerBg } }, font: { bold: true, color: { argb: 'FFFFFFFF' }, name: 'Calibri', size: 10 }, alignment: { horizontal: 'center', vertical: 'middle' }, border: border() };
});
mhRow.height = 18;

METRICAS.forEach((m, i) => {
  const r = ws2.getRow(mTitleRow + 2 + i);
  const alt = i % 2 === 0 ? 'FFFFFFFF' : C.altRow;

  r.getCell(1).value = m.metrica;
  r.getCell(1).style = { fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: alt } }, font: { bold: true, name: 'Calibri', size: 10 }, alignment: { vertical: 'middle' }, border: border() };

  r.getCell(2).value = m.meta;
  r.getCell(2).style = { fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: alt } }, font: { name: 'Calibri', size: 10 }, alignment: { horizontal: 'center', vertical: 'middle' }, border: border() };

  r.getCell(3).value = m.alcancado;
  r.getCell(3).style = { fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: alt } }, font: { bold: true, name: 'Calibri', size: 10 }, alignment: { horizontal: 'center', vertical: 'middle' }, border: border() };

  const sm = m.status === 'PASS' ? { bg: C.done, fg: C.gatePASS, v: '✓ PASS' } : { bg: C.inProgress, fg: C.gatePartial, v: '~ Parcial' };
  r.getCell(4).value = sm.v;
  r.getCell(4).style = { fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: sm.bg } }, font: { bold: true, color: { argb: sm.fg }, name: 'Calibri', size: 10 }, alignment: { horizontal: 'center', vertical: 'middle' }, border: border() };

  r.getCell(5).value = '';
  r.getCell(5).style = { fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: alt } }, border: border() };

  r.height = 18;
});

await wb.xlsx.writeFile(OUT);
console.log(`\nArquivo gerado: ${OUT}\n`);
