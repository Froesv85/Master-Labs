import { buildRagPrompt, normalizeExtractionOutput } from '@/lib/rag-output';

describe('buildRagPrompt', () => {
  it('inclui idioma, titulo, entrada truncada e evidencias', () => {
    const prompt = buildRagPrompt({
      language: 'pt-BR',
      projectTitle: 'ESP32 Weather Station',
      input: 'a'.repeat(1000),
      evidence: [
        { id: 'e1', score: 0.9, metadata: { text: 'DHT22 sensor datasheet' } },
        { id: 'e2', score: 0.8, metadata: { text: 'ESP32 pinout' } },
      ],
    });

    expect(prompt).toContain('Idioma: pt-BR');
    expect(prompt).toContain('Projeto: ESP32 Weather Station');
    expect(prompt).toContain('mc_extract_v2');
    expect(prompt).toContain('DHT22 sensor datasheet');
    expect(prompt).toContain('ESP32 pinout');
    // input deve ser truncado a 900 chars dentro do prompt
    expect(prompt.match(/a{900}/)).not.toBeNull();
    expect(prompt.match(/a{901}/)).toBeNull();
  });

  it('funciona sem evidencias', () => {
    const prompt = buildRagPrompt({ language: 'pt-BR', projectTitle: 'X', input: 'y', evidence: [] });
    expect(prompt).toContain('Projeto: X');
  });
});

describe('normalizeExtractionOutput', () => {
  it('normaliza uma resposta valida do modelo', () => {
    const raw = JSON.stringify({
      technicalRequirements: [{ id: 'TR-1', name: 'WiFi', detail: 'conectividade', priority: 'high' }],
      suggestedBOM: [{ item: 'ESP32', quantity: '1', notes: 'MCU principal' }],
      suggestedCode: 'void setup() {}',
      confidenceScore: 85,
    });

    const result = normalizeExtractionOutput(raw, 3, 'emb_1');
    expect(result.schemaVersion).toBe('mc_extract_v2');
    expect(result.technicalRequirements).toHaveLength(1);
    expect(result.technicalRequirements[0].priority).toBe('high');
    expect(result.suggestedBOM[0].item).toBe('ESP32');
    expect(result.confidenceScore).toBe(85);
    expect(result.parseError).toBeNull();
    expect(result.groundingCount).toBe(3);
    expect(result.embeddingId).toBe('emb_1');
  });

  it('remove cercas de markdown antes de parsear', () => {
    const raw = '```json\n{"confidenceScore": 50}\n```';
    const result = normalizeExtractionOutput(raw, 0, null);
    expect(result.confidenceScore).toBe(50);
    expect(result.parseError).toBeNull();
  });

  it('marca parseError e usa defaults quando o JSON e invalido', () => {
    const result = normalizeExtractionOutput('nao e json', 0, null);
    expect(result.parseError).toBe('Failed to parse JSON');
    expect(result.technicalRequirements).toEqual([]);
    expect(result.suggestedBOM).toEqual([]);
    expect(result.confidenceScore).toBe(0);
  });

  it('limita technicalRequirements e suggestedBOM a 6 itens', () => {
    const many = Array.from({ length: 10 }, (_, i) => ({ name: `Req ${i}` }));
    const raw = JSON.stringify({ technicalRequirements: many, suggestedBOM: many });
    const result = normalizeExtractionOutput(raw, 0, null);
    expect(result.technicalRequirements).toHaveLength(6);
    expect(result.suggestedBOM).toHaveLength(6);
  });

  it('normaliza confidenceScore na escala 0-1 para 0-100', () => {
    const raw = JSON.stringify({ confidenceScore: 0.42 });
    const result = normalizeExtractionOutput(raw, 0, null);
    expect(result.confidenceScore).toBe(42);
  });

  it('usa "medium" como prioridade padrao quando invalida', () => {
    const raw = JSON.stringify({ technicalRequirements: [{ name: 'X', priority: 'urgent' }] });
    const result = normalizeExtractionOutput(raw, 0, null);
    expect(result.technicalRequirements[0].priority).toBe('medium');
  });
});
