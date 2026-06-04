import 'dotenv/config';
import { Pinecone } from '@pinecone-database/pinecone';

async function check() {
  const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
  const indexName = process.env.PINECONE_INDEX || 'maker-knowledge';

  try {
    console.log(`🔎 Verificando índice: ${indexName}`);
    const host = await pc.describeIndex(indexName);
    console.log('✅ Índice encontrado:', JSON.stringify(host, null, 2));
    
    const index = pc.index(indexName);
    const stats = await index.describeIndexStats();
    console.log('📊 Estatísticas do índice:', JSON.stringify(stats, null, 2));
  } catch (error) {
    console.error('❌ Erro ao acessar Pinecone:', error);
  }
}

check();
