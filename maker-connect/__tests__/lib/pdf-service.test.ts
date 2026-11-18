import { buildPdf, ExportData } from '@/lib/pdf-service';

const baseData: ExportData = {
  projectTitle: 'ESP32 Weather Station',
  projectDescription: 'Uma estacao meteorologica compacta baseada em ESP32.',
  projectUrl: 'https://makerconnect.com.br/projects/42',
  creator: 'Ana Silva',
  tags: ['IoT'],
  difficulties: [{ description: 'Calibracao do sensor', date: '01/01/2026' }],
  technicalRequirements: ['Conectividade WiFi para envio de dados'],
  suggestedBom: [{ quantity: '1', item: 'ESP32', notes: 'MCU principal' }],
  assemblySteps: [{ step: 1, title: 'Montar o chassi', detail: 'Fixar os parafusos' }],
  suggestedCode: 'void setup() { Serial.begin(115200); }',
  videoUrl: 'https://youtube.com/watch?v=abc12345678',
};

describe('buildPdf', () => {
  it('gera um Buffer PDF nao vazio com dados completos', async () => {
    const buffer = await buildPdf(baseData);
    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(0);
    // Assinatura de arquivo PDF
    expect(buffer.subarray(0, 5).toString()).toBe('%PDF-');
  });

  it('nao lanca erro com o minimo de dados possivel', async () => {
    const minimal: ExportData = {
      projectTitle: 'X',
      projectDescription: '',
      projectUrl: '',
      creator: 'Y',
      tags: [],
      difficulties: [],
      technicalRequirements: [],
      suggestedBom: [],
      assemblySteps: [],
    };
    const buffer = await buildPdf(minimal);
    expect(buffer.length).toBeGreaterThan(0);
  });
});

describe('pdfSafe', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { pdfSafe } = require('@/lib/pdf-service') as typeof import('@/lib/pdf-service');

  it('preserva acentos e a pontuacao que a fonte do PDF suporta', () => {
    const s = 'Ação, coração, é, ô, ü, Ç — “aspas” • item – 0,35–0,40 … 470 µF, 3 × M3, 25 °C';
    expect(pdfSafe(s)).toBe(s);
  });

  it('troca simbolos fora do WinAnsi por equivalentes legiveis', () => {
    expect(pdfSafe('━━ PASSO ━━')).toBe('—— PASSO ——');
    expect(pdfSafe('Bateria → BMS ↔ buck')).toBe('Bateria -> BMS <-> buck');
    expect(pdfSafe('4 Ω, ≥ 3 A, ≤ 5 V, ≈ 2,7 A')).toBe('4 ohm, >= 3 A, <= 5 V, ~ 2,7 A');
  });

  it('descarta emoji e mantem o resto da linha', () => {
    expect(pdfSafe('Pronto 🚀 para imprimir')).toBe('Pronto  para imprimir');
  });

  it('nenhum caractere do resultado forca a codificacao de 2 bytes do jsPDF', () => {
    const out = pdfSafe('━ → Ω ≥ ≤ ✓ 🚀 ő ação');
    for (const ch of out) {
      const ok = ch.codePointAt(0)! <= 0xff || '€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ'.includes(ch);
      expect(ok).toBe(true);
    }
    expect(out).toContain('ação');
  });
});
