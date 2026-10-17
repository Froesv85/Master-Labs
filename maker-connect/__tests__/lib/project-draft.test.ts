import { normalizeDraftOutput } from '@/lib/project-draft';

describe('normalizeDraftOutput', () => {
  it('normaliza uma resposta valida do modelo', () => {
    const raw = JSON.stringify({
      description: 'Alimentador automático para pets.',
      suggestedBOM: [{ item: 'Arduino Uno', quantity: '1', notes: 'Controlador' }],
      assemblySteps: [{ step: 1, title: 'Montar circuito', detail: 'Conectar sensores' }],
    });

    const result = normalizeDraftOutput(raw);

    expect(result.description).toBe('Alimentador automático para pets.');
    expect(result.suggestedBOM).toEqual([{ item: 'Arduino Uno', quantity: '1', notes: 'Controlador' }]);
    expect(result.assemblySteps).toEqual([{ step: 1, title: 'Montar circuito', detail: 'Conectar sensores' }]);
  });

  it('limpa blocos de markdown antes de parsear', () => {
    const raw = '```json\n{"description":"X","suggestedBOM":[],"assemblySteps":[]}\n```';
    const result = normalizeDraftOutput(raw);
    expect(result.description).toBe('X');
  });

  it('retorna estrutura vazia para JSON invalido, sem lancar', () => {
    const result = normalizeDraftOutput('isso nao e json');
    expect(result).toEqual({ description: '', suggestedBOM: [], assemblySteps: [] });
  });

  it('limita BOM a 8 itens e etapas a 6', () => {
    const raw = JSON.stringify({
      description: 'X',
      suggestedBOM: Array.from({ length: 10 }, (_, i) => ({ item: `Item ${i}`, quantity: '1', notes: '' })),
      assemblySteps: Array.from({ length: 10 }, (_, i) => ({ step: i + 1, title: `Etapa ${i}`, detail: '' })),
    });

    const result = normalizeDraftOutput(raw);
    expect(result.suggestedBOM).toHaveLength(8);
    expect(result.assemblySteps).toHaveLength(6);
  });

  it('preenche step a partir do indice quando o modelo nao numera corretamente', () => {
    const raw = JSON.stringify({
      description: 'X',
      suggestedBOM: [],
      assemblySteps: [{ title: 'Primeira etapa', detail: '' }],
    });

    const result = normalizeDraftOutput(raw);
    expect(result.assemblySteps[0].step).toBe(1);
  });
});
