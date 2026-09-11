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
  },
  // Expansao Fase 5 (estagio 3): itens cobrindo os dominios do holdout H01-H10, pra
  // dar cobertura real ao filtro de dominio construido no estagio 1. Ver
  // ml-pipeline/app/stage1_classify.py (DOMAIN_KEYWORDS) para a mesma taxonomia.
  {
    id: 'comp_lora_sx1276',
    text: 'LoRa SX1276: Transceptor de radio de longo alcance e baixo consumo, 137-1020MHz. Alcance de ate 15km em linha de visada. Usado com gateways LoRaWAN (ex.: The Things Network). SPI para comunicacao com MCU.',
    metadata: { category: 'Protocol', type: 'RF', layer: 'PHY' }
  },
  {
    id: 'comp_gps_neo6m',
    text: 'GPS NEO-6M: Modulo receptor GPS, precisao de posicao ~2.5m, interface UART/NMEA. Alimentacao 3.3-5V. Usado em rastreadores de ativos e navegacao.',
    metadata: { category: 'Sensor', type: 'Position', interface: 'UART' }
  },
  {
    id: 'comp_servo_motor',
    text: 'Servo motor (ex.: SG90/MG996R): Atuador de posicao angular controlado por PWM, torque tipico 1.8-11kg.cm dependendo do modelo. Usado em robotica, fechaduras e valvulas.',
    metadata: { category: 'Actuator', type: 'Motion', interface: 'PWM' }
  },
  {
    id: 'comp_rele_module',
    text: 'Modulo rele (ex.: 1/2/4 canais, 10A): Chaveamento de cargas AC/DC de alta corrente a partir de um sinal digital de baixa tensao do MCU. Precisa de diodo de protecao contra pico indutivo.',
    metadata: { category: 'Actuator', type: 'Switching', interface: 'GPIO' }
  },
  {
    id: 'comp_hcsr04',
    text: 'Sensor ultrassonico HC-SR04: Mede distancia por tempo de eco, alcance 2cm-4m, precisao ~3mm. Interface digital (trigger/echo), alimentacao 5V. Usado em nivel de reservatorio e desvio de obstaculos.',
    metadata: { category: 'Sensor', type: 'Distance', interface: 'GPIO' }
  },
  {
    id: 'comp_rfid_rc522',
    text: 'Leitor RFID RC522: Le/escreve cartoes MIFARE 13.56MHz, interface SPI, alcance de leitura ~3cm. Usado em controle de acesso e fechaduras inteligentes.',
    metadata: { category: 'Sensor', type: 'Identification', interface: 'SPI' }
  },
  {
    id: 'comp_modbus_rs485',
    text: 'Modbus RTU sobre RS485: Protocolo industrial mestre-escravo para leitura de registros de CLPs e inversores de frequencia. RS485 permite multiponto ate ~1200m. Requer resistor de terminacao 120 ohm nas pontas do barramento.',
    metadata: { category: 'Protocol', type: 'Industrial', layer: 'Application' }
  },
  {
    id: 'comp_sim800l',
    text: 'Modulo SIM800L: Modem celular GSM/GPRS quad-band para envio de SMS e dados em locais sem WiFi. Alimentacao critica: precisa de ate 2A em picos de transmissao, recomenda-se capacitor de desacoplamento grande.',
    metadata: { category: 'Protocol', type: 'Cellular', layer: 'PHY' }
  },
  {
    id: 'comp_eink_display',
    text: 'Display e-ink (ex.: 2.9 polegadas): Tela biestavel de baixissimo consumo, mantem a imagem sem energia apos atualizar. Interface SPI. Ideal para dispositivos alimentados por bateria com atualizacao pouco frequente.',
    metadata: { category: 'Display', type: 'EInk', interface: 'SPI' }
  },
  {
    id: 'comp_sd_card_module',
    text: 'Modulo cartao SD: Armazenamento local via interface SPI, usado para log de dados quando nao ha conectividade continua. Sistema de arquivos tipico FAT32.',
    metadata: { category: 'Storage', type: 'Local', interface: 'SPI' }
  },
  {
    id: 'comp_mpu6050',
    text: 'MPU6050: Acelerometro + giroscopio de 6 eixos (IMU), interface I2C. Usado para deteccao de queda, impacto e orientacao em rastreadores e robos.',
    metadata: { category: 'Sensor', type: 'Motion', interface: 'I2C' }
  },
  {
    id: 'comp_sct013',
    text: 'Sensor de corrente SCT-013 (transformador de corrente nao-invasivo): Mede corrente AC ate 100A sem contato direto com o condutor. Usado em monitoramento de consumo eletrico residencial.',
    metadata: { category: 'Sensor', type: 'Electrical', interface: 'Analog' }
  },
  {
    id: 'comp_lipo_battery_power',
    text: 'Bateria LiPo + circuito de gerenciamento de energia (ex.: TP4056 + modo sleep do MCU): Fonte de energia portatil recarregavel. Modo deep sleep do ESP32 reduz consumo para ~10uA, essencial para autonomia prolongada.',
    metadata: { category: 'PowerMgmt', type: 'Battery', interface: 'N/A' }
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
