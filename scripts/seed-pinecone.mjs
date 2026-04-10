import 'dotenv/config';
import { Pinecone } from '@pinecone-database/pinecone';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Instanciar o cliente do Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const embeddingModel = genAI.getGenerativeModel({ model: "gemini-embedding-001" });

// Conhecimento técnico real para popular o banco
const KNOWLEDGE_BASE = [
  {
    id: 'comp_esp32_wroom',
    text: 'ESP32-WROOM-32: Dual-core MCU, Wi-Fi 2.4GHz, Bluetooth 4.2 & BLE. Supply voltage: 2.7V to 3.6V. 38 pins. Perfect for IoT gateways and sensor nodes.',
    metadata: { category: 'MCU', brand: 'Espressif', connectivity: ['WiFi', 'Bluetooth'] }
  },
  {
    id: 'comp_dht22',
    text: 'DHT22 (AM2302): Digital temperature and humidity sensor. Humidity: 0-100% (2-5% accuracy). Temperature: -40 to 80C (0.5C accuracy). Needs 3.3V-5V. Uses 1-wire protocol.',
    metadata: { category: 'Sensor', type: 'Env', interface: '1-wire' }
  },
  {
    id: 'comp_mqtt_broker',
    text: 'MQTT Protocol: Lightweight messaging protocol for small sensors and mobile devices. Port 1883 (TCP) or 8883 (SSL). Best brokers: Mosquitto, HiveMQ, EMQX.',
    metadata: { category: 'Protocol', type: 'Network', layer: 'Application' }
  }
];

async function seed() {
  const pcApiKey = process.env.PINECONE_API_KEY;
  const indexName = process.env.PINECONE_INDEX || 'maker-knowledge';

  if (!pcApiKey || !process.env.GEMINI_API_KEY) {
    console.error('❌ Erro: Chaves de API (Gemini ou Pinecone) não encontradas no .env');
    return;
  }

  console.log('🌲 Conectando ao Pinecone...');
  const pc = new Pinecone({ apiKey: pcApiKey });
  const index = pc.index(indexName);

  for (const item of KNOWLEDGE_BASE) {
    console.log(`🧠 Gerando embedding com Gemini para: ${item.id}...`);
    
    // Gerar o vetor real via Gemini
    const result = await embeddingModel.embedContent({
      content: { parts: [{ text: item.text }] },
      outputDimensionality: 768
    });
    const vector = Array.from(result.embedding.values);

    console.log(`📥 Fazendo Upsert no Pinecone...`);
    await index.upsert({
      records: [{
        id: item.id,
        values: vector,
        metadata: {
          ...item.metadata,
          text: item.text // Guardamos o texto para o RAG recuperar depois
        }
      }]
    });
  }

  console.log('✅ Base de conhecimento populada com sucesso usando Google Gemini!');
}

seed().catch(console.error);
