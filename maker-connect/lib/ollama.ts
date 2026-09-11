const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434';
const OLLAMA_EMBED_MODEL = process.env.OLLAMA_EMBED_MODEL ?? 'nomic-embed-text';
const OLLAMA_GENERATE_MODEL = process.env.OLLAMA_GENERATE_MODEL ?? 'qwen2.5:7b-instruct';

export async function generateEmbedding(text: string): Promise<number[]> {
  const res = await fetch(`${OLLAMA_BASE_URL}/api/embeddings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: OLLAMA_EMBED_MODEL, prompt: text }),
    signal: AbortSignal.timeout(30000),
  });

  if (!res.ok) {
    throw new Error(`Ollama embeddings failed: ${res.status} ${await res.text()}`);
  }

  const data = (await res.json()) as { embedding: number[] };
  if (!Array.isArray(data.embedding) || data.embedding.length === 0) {
    throw new Error('Ollama returned empty embedding');
  }

  return data.embedding;
}

// Same generation call the n8n "Ollama RAG1" node made (model, format, options) —
// kept identical so output quality matches the 98%-relevance holdout result.
export async function generateCompletion(prompt: string): Promise<string> {
  const res = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: OLLAMA_GENERATE_MODEL,
      prompt,
      stream: false,
      format: 'json',
      options: { temperature: 0.1, num_predict: 300 },
    }),
    signal: AbortSignal.timeout(180000),
  });

  if (!res.ok) {
    throw new Error(`Ollama generate failed: ${res.status} ${await res.text()}`);
  }

  const data = (await res.json()) as { response?: string };
  if (typeof data.response !== 'string' || data.response.length === 0) {
    throw new Error('Ollama returned empty completion');
  }

  return data.response;
}
