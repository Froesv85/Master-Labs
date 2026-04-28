import { anonymizePii } from '@/lib/lgpd';

describe('anonymizePii', () => {
  it('retorna texto limpo sem redações quando não há PII', () => {
    const input = 'Projeto com Arduino Uno e sensor ultrassônico HC-SR04';
    const result = anonymizePii(input);
    expect(result.sanitized).toBe(input);
    expect(result.redactions).toBe(0);
    expect(result.piiTypes).toEqual([]);
  });

  it('anonimiza email e registra tipo EMAIL', () => {
    const result = anonymizePii('Contato: maker@example.com para dúvidas');
    expect(result.sanitized).toContain('[EMAIL_REDACTED]');
    expect(result.sanitized).not.toContain('maker@example.com');
    expect(result.redactions).toBe(1);
    expect(result.piiTypes).toContain('EMAIL');
  });

  it('anonimiza telefone brasileiro e registra tipo PHONE', () => {
    const result = anonymizePii('Ligue para (48) 99999-1234 ou 48 3333-4444');
    expect(result.sanitized).not.toMatch(/\d{4}-\d{4}/);
    expect(result.redactions).toBe(2);
    expect(result.piiTypes).toContain('PHONE');
  });

  it('anonimiza CPF e registra tipo CPF', () => {
    const result = anonymizePii('Responsável CPF 123.456.789-09 cadastrado');
    expect(result.sanitized).toContain('[CPF_REDACTED]');
    expect(result.sanitized).not.toContain('123.456.789-09');
    expect(result.redactions).toBe(1);
    expect(result.piiTypes).toContain('CPF');
  });

  it('detecta múltiplos tipos PII no mesmo texto', () => {
    const input = 'Email: a@b.com | Tel: (11) 91234-5678 | CPF: 987.654.321-00';
    const result = anonymizePii(input);
    expect(result.redactions).toBe(3);
    expect(result.piiTypes).toContain('EMAIL');
    expect(result.piiTypes).toContain('PHONE');
    expect(result.piiTypes).toContain('CPF');
  });

  it('não duplica tipo PII quando há múltiplas ocorrências do mesmo tipo', () => {
    const result = anonymizePii('a@x.com e b@y.com');
    expect(result.redactions).toBe(2);
    expect(result.piiTypes).toEqual(['EMAIL']);
  });

  it('não modifica texto sem PII entre redações', () => {
    const result = anonymizePii('Antes a@b.com depois texto livre');
    expect(result.sanitized).toMatch(/^Antes \[EMAIL_REDACTED\] depois texto livre$/);
  });
});
