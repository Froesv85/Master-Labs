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
