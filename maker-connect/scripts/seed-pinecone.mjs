import 'dotenv/config';
import { Pinecone } from '@pinecone-database/pinecone';

const ollamaBaseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
const embedModel = process.env.OLLAMA_EMBED_MODEL || 'nomic-embed-text';

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

  if (!pcApiKey) {
    console.error('❌ Erro: Chave de API do Pinecone não encontrada no .env');
    return;
  }

  const pc = new Pinecone({ apiKey: pcApiKey });
  const index = pc.index(indexName);

  async function generateEmbedding(text) {
    const response = await fetch(`${ollamaBaseUrl}/api/embeddings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: embedModel, prompt: text })
    });

    if (!response.ok) throw new Error(`Erro Ollama: ${response.status}`);
    const data = await response.json();
    return data.embedding;
  }

  try {
    for (const item of KNOWLEDGE_BASE) {
      console.log(`🧠 Gerando embedding para: ${item.id}...`);
      const vector = await generateEmbedding(item.text);
      
      console.log(`📤 Enviando ao Pinecone...`);
      await index.upsert({
        records: [{
          id: item.id,
          values: vector,
          metadata: { ...item.metadata, text: item.text }
        }]
      });
      console.log(`✅ ${item.id} ok!`);
    }
    console.log(`\n🎉 Pronto!`);
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

seed();
