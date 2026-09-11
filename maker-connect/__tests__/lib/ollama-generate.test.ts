import { generateCompletion } from '@/lib/ollama';

const originalFetch = global.fetch;

afterEach(() => {
  global.fetch = originalFetch;
  jest.restoreAllMocks();
});

describe('generateCompletion', () => {
  it('retorna o texto de response quando a chamada é bem-sucedida', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      text: async () => '',
      json: async () => ({ response: '{"confidenceScore":80}' }),
    }) as unknown as typeof fetch;

    const result = await generateCompletion('prompt de teste');
    expect(result).toBe('{"confidenceScore":80}');
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/generate'),
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('lanca erro quando a resposta HTTP nao e ok', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      text: async () => 'boom',
    }) as unknown as typeof fetch;

    await expect(generateCompletion('x')).rejects.toThrow(/Ollama generate failed/);
  });

  it('lanca erro quando response vem vazio', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      text: async () => '',
      json: async () => ({ response: '' }),
    }) as unknown as typeof fetch;

    await expect(generateCompletion('x')).rejects.toThrow(/empty completion/);
  });
});
