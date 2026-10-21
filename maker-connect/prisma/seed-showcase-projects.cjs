/* eslint-disable @typescript-eslint/no-require-imports */
// Cadastra projetos-vitrine completos (BOM, dificuldades, codigo, dossie) em nome de um usuario existente.
// Idempotente: pula projetos que o usuario ja tem com o mesmo titulo.
//
// Uso na VPS (o runner de producao nao tem tsx, por isso .cjs; o Dockerfile ja copia prisma/ para a imagem):
//   docker exec -e OWNER_EMAIL=voce@exemplo.com [-e DRY_RUN=1] \
//     maker-connect node prisma/seed-showcase-projects.cjs

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const req = (id, name, detail, priority = 'high') => ({ id, name, detail, priority });
const bom = (item, quantity, notes = '') => ({ item, quantity: String(quantity), notes });
const step = (n, title, detail) => ({ step: n, title, detail });

const PROJECTS = [
  {
    title: 'Estação de Qualidade do Ar com ESP32',
    tags: ['IoT'],
    description:
      'Estação de monitoramento de qualidade do ar interno que mede material particulado (PM1.0, PM2.5, PM10), temperatura, umidade e pressão. Os dados são publicados via MQTT a cada 30 s e exibidos em um painel no Home Assistant, com alerta quando o PM2.5 passa de 25 µg/m³ (limite diário da OMS).',
    objective:
      'Dar visibilidade à qualidade do ar em salas de aula e laboratórios maker, onde impressão 3D e solda geram partículas finas, com um dispositivo de baixo custo replicável.',
    components: [
      { name: 'ESP32 DevKit V1', quantity: 1, description: 'Microcontrolador com Wi-Fi' },
      { name: 'Sensor de partículas PMS5003', quantity: 1, description: 'Laser, saída UART, mede PM1.0/2.5/10' },
      { name: 'Sensor BME280', quantity: 1, description: 'Temperatura, umidade e pressão via I2C' },
      { name: 'Display OLED 0.96" SSD1306', quantity: 1, description: 'I2C, 128x64' },
      { name: 'Fonte 5V 2A micro-USB', quantity: 1, description: 'O PMS5003 exige 5V na alimentação' },
      { name: 'Case impresso em PETG', quantity: 1, description: 'Com aberturas de fluxo de ar alinhadas ao sensor' },
    ],
    difficulties: [
      'O PMS5003 consome até 100 mA com o ventilador ligado e causava brownout no ESP32 quando alimentado pelo pino 3V3. Resolvido alimentando o sensor direto no VIN (5V) e mantendo apenas o RX/TX em 3,3V.',
      'Leituras de PM2.5 oscilavam muito nos primeiros segundos após acordar o sensor. Passei a descartar as leituras dos primeiros 30 s após o modo sleep e usar média móvel de 5 amostras.',
    ],
    codeFiles: [
      {
        filename: 'main.ino',
        content: `#include <WiFi.h>
#include <PubSubClient.h>
#include <Adafruit_BME280.h>
#include <PMS.h>

#define PMS_RX 16
#define PMS_TX 17

const char* WIFI_SSID = "SUA_REDE";
const char* WIFI_PASS = "SUA_SENHA";
const char* MQTT_HOST = "192.168.0.10";

WiFiClient net;
PubSubClient mqtt(net);
Adafruit_BME280 bme;
HardwareSerial pmsSerial(2);
PMS pms(pmsSerial);
PMS::DATA pmsData;

void setup() {
  Serial.begin(115200);
  pmsSerial.begin(9600, SERIAL_8N1, PMS_RX, PMS_TX);
  bme.begin(0x76);
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  while (WiFi.status() != WL_CONNECTED) delay(500);
  mqtt.setServer(MQTT_HOST, 1883);
}

void loop() {
  if (!mqtt.connected()) mqtt.connect("estacao-ar-01");
  mqtt.loop();

  if (pms.readUntil(pmsData, 2000)) {
    char payload[160];
    snprintf(payload, sizeof(payload),
      "{\\"pm1\\":%u,\\"pm25\\":%u,\\"pm10\\":%u,\\"temp\\":%.1f,\\"hum\\":%.1f,\\"press\\":%.1f}",
      pmsData.PM_AE_UG_1_0, pmsData.PM_AE_UG_2_5, pmsData.PM_AE_UG_10_0,
      bme.readTemperature(), bme.readHumidity(), bme.readPressure() / 100.0F);
    mqtt.publish("makerlab/ar/sala1", payload);
  }
  delay(30000);
}
`,
      },
    ],
    dossier: {
      technicalRequirements: [
        req('TR-1', 'Alimentação 5V dedicada', 'PMS5003 exige 5V e até 100 mA; não alimentar pelo regulador 3V3 do ESP32.'),
        req('TR-2', 'Intervalo de publicação', 'Publicar leituras a cada 30 s via MQTT (QoS 0) no tópico makerlab/ar/<sala>.'),
        req('TR-3', 'Limite de alerta', 'Gerar alerta quando a média de PM2.5 exceder 25 µg/m³.', 'medium'),
        req('TR-4', 'Fluxo de ar no case', 'Entrada e saída de ar do sensor devem ficar desobstruídas e longe do BME280, que aquece.', 'medium'),
      ],
      suggestedBOM: [
        bom('ESP32 DevKit V1', 1),
        bom('Sensor PMS5003', 1, 'Com cabo adaptador de 8 pinos'),
        bom('Sensor BME280', 1, 'Endereço I2C 0x76'),
        bom('Display OLED SSD1306', 1, 'Opcional'),
        bom('Fonte 5V 2A', 1),
      ],
      assemblySteps: [
        step(1, 'Ligar o barramento I2C', 'BME280 e OLED em SDA=GPIO21 e SCL=GPIO22, alimentados em 3V3.'),
        step(2, 'Ligar o PMS5003', 'VCC no VIN (5V), GND comum, TX do sensor no GPIO16 e RX no GPIO17.'),
        step(3, 'Gravar o firmware', 'Ajustar SSID, senha e broker MQTT em main.ino e gravar pela Arduino IDE.'),
        step(4, 'Montar no case', 'Fixar o PMS5003 com a entrada de ar voltada para a grade frontal.'),
        step(5, 'Integrar ao Home Assistant', 'Criar sensores MQTT apontando para o tópico makerlab/ar/sala1.'),
      ],
    },
  },
  {
    title: 'Irrigação Automática de Horta com ESP8266',
    tags: ['IoT'],
    description:
      'Sistema de irrigação por gotejamento para horta de 4 canteiros. Sensores capacitivos medem a umidade do solo, e uma válvula solenoide 12V é acionada quando o solo fica abaixo de 35%. O sistema respeita uma janela de horário (6h–9h e 17h–19h) para evitar regar no sol forte.',
    objective:
      'Reduzir o consumo de água e o trabalho manual em hortas comunitárias e escolares, regando apenas quando o solo realmente precisa.',
    components: [
      { name: 'NodeMCU ESP8266', quantity: 1, description: 'Controlador principal' },
      { name: 'Sensor de umidade de solo capacitivo v1.2', quantity: 4, description: 'Não sofre corrosão como o resistivo' },
      { name: 'Multiplexador analógico CD74HC4067', quantity: 1, description: 'O ESP8266 tem apenas uma entrada analógica' },
      { name: 'Válvula solenoide 12V 1/2"', quantity: 1, description: 'Normalmente fechada' },
      { name: 'Módulo relé 1 canal 5V', quantity: 1, description: 'Aciona a válvula' },
      { name: 'Fonte 12V 2A + regulador LM2596', quantity: 1, description: '12V para a válvula, 5V para a lógica' },
      { name: 'Kit gotejamento 20 m', quantity: 1, description: 'Mangueira, gotejadores e conexões' },
    ],
    difficulties: [
      'Cada sensor capacitivo tem uma curva diferente. Precisei calibrar um por um, medindo o valor bruto no ar (seco) e mergulhado em água (saturado), e mapear para 0–100%.',
      'A válvula gerava picos ao desligar e reiniciava o ESP8266. Um diodo 1N4007 em antiparalelo com a bobina resolveu.',
    ],
    codeFiles: [
      {
        filename: 'irrigacao.ino',
        content: `#include <ESP8266WiFi.h>
#include <time.h>

const int MUX_S[4] = {D1, D2, D5, D6};
const int RELE = D7;
const int LIMIAR = 35;  // % de umidade
const int SECO[4]    = {780, 770, 790, 775};
const int MOLHADO[4] = {350, 340, 360, 345};

int lerCanal(int c) {
  for (int i = 0; i < 4; i++) digitalWrite(MUX_S[i], (c >> i) & 1);
  delay(5);
  return analogRead(A0);
}

bool dentroDaJanela() {
  time_t agora = time(nullptr);
  struct tm* t = localtime(&agora);
  return (t->tm_hour >= 6 && t->tm_hour < 9) || (t->tm_hour >= 17 && t->tm_hour < 19);
}

void setup() {
  for (int i = 0; i < 4; i++) pinMode(MUX_S[i], OUTPUT);
  pinMode(RELE, OUTPUT);
  WiFi.begin("SUA_REDE", "SUA_SENHA");
  configTime(-3 * 3600, 0, "pool.ntp.org");
}

void loop() {
  int menor = 100;
  for (int c = 0; c < 4; c++) {
    int pct = constrain(map(lerCanal(c), SECO[c], MOLHADO[c], 0, 100), 0, 100);
    menor = min(menor, pct);
  }
  bool regar = menor < LIMIAR && dentroDaJanela();
  digitalWrite(RELE, regar ? HIGH : LOW);
  delay(regar ? 60000 : 300000);
}
`,
      },
    ],
    dossier: {
      technicalRequirements: [
        req('TR-1', 'Sensor capacitivo', 'Usar sensores capacitivos para evitar corrosão dos eletrodos no solo.'),
        req('TR-2', 'Proteção da bobina', 'Diodo de roda livre (1N4007) na válvula solenoide.'),
        req('TR-3', 'Janela de rega', 'Só irrigar entre 6h–9h e 17h–19h, com horário via NTP.', 'medium'),
        req('TR-4', 'Calibração individual', 'Registrar os valores seco e molhado de cada sensor no firmware.', 'medium'),
      ],
      suggestedBOM: [
        bom('NodeMCU ESP8266', 1),
        bom('Sensor de solo capacitivo', 4),
        bom('Multiplexador CD74HC4067', 1),
        bom('Válvula solenoide 12V', 1, 'Normalmente fechada'),
        bom('Módulo relé 5V', 1),
        bom('Diodo 1N4007', 1, 'Proteção contra retorno da bobina'),
      ],
      assemblySteps: [
        step(1, 'Calibrar os sensores', 'Medir o valor analógico de cada sensor seco e na água e preencher os vetores SECO e MOLHADO.'),
        step(2, 'Montar o multiplexador', 'Sinais dos 4 sensores em C0–C3, SIG em A0 e seletores S0–S3 em D1, D2, D5 e D6.'),
        step(3, 'Ligar a válvula', 'Válvula no contato NA do relé, alimentada em 12V, com diodo em antiparalelo.'),
        step(4, 'Instalar o gotejamento', 'Distribuir os gotejadores a cada 30 cm ao longo dos canteiros.'),
        step(5, 'Validar em campo', 'Acompanhar uma semana de logs e ajustar o LIMIAR conforme a cultura plantada.'),
      ],
    },
  },
  {
    title: 'Robô Seguidor de Linha com Controle PID',
    tags: ['Robotics'],
    description:
      'Robô seguidor de linha de competição com Arduino Nano, barra de 8 sensores QTR-8A e motores N20 de 1000 RPM. O controle PID foi sintonizado para pista com curvas de raio 10 cm, chegando a 1,2 m/s em reta.',
    objective:
      'Servir de plataforma didática para ensinar controle PID na prática, com parâmetros ajustáveis por Bluetooth sem precisar regravar o firmware.',
    components: [
      { name: 'Arduino Nano', quantity: 1, description: 'ATmega328P' },
      { name: 'Barra de sensores Pololu QTR-8A', quantity: 1, description: '8 sensores infravermelhos analógicos' },
      { name: 'Ponte H TB6612FNG', quantity: 1, description: 'Mais eficiente que a L298N' },
      { name: 'Micromotor N20 6V 1000 RPM', quantity: 2, description: 'Com redução 30:1' },
      { name: 'Bateria LiPo 2S 7,4V 450mAh', quantity: 1, description: 'Leve, alta taxa de descarga' },
      { name: 'Módulo Bluetooth HC-05', quantity: 1, description: 'Ajuste de Kp, Ki e Kd em tempo real' },
      { name: 'Chassi em placa de fenolite', quantity: 1, description: 'Usinado na CNC' },
    ],
    difficulties: [
      'O robô oscilava muito nas retas. Comecei só com Kp, reduzi até parar de oscilar e depois subi Kd aos poucos. O Ki ficou quase zero, porque acumulava erro nas curvas.',
      'Sob luz de lâmpada fluorescente, os sensores liam ruído de 60 Hz. Uma saia de EVA preto em volta da barra de sensores eliminou a interferência.',
    ],
    codeFiles: [
      {
        filename: 'seguidor_pid.ino',
        content: `#include <QTRSensors.h>

QTRSensors qtr;
const uint8_t N = 8;
uint16_t valores[N];

const int PWMA = 5, AIN1 = 7, AIN2 = 8;
const int PWMB = 6, BIN1 = 9, BIN2 = 10, STBY = 4;

float Kp = 0.08, Ki = 0.0, Kd = 0.6;
int baseSpeed = 180;
int erroAnterior = 0;
long integral = 0;

void motor(int pwm, int in1, int in2, int vel) {
  digitalWrite(in1, vel >= 0);
  digitalWrite(in2, vel < 0);
  analogWrite(pwm, constrain(abs(vel), 0, 255));
}

void setup() {
  qtr.setTypeAnalog();
  qtr.setSensorPins((const uint8_t[]){A0, A1, A2, A3, A4, A5, A6, A7}, N);
  pinMode(STBY, OUTPUT); digitalWrite(STBY, HIGH);
  for (int p : {AIN1, AIN2, BIN1, BIN2}) pinMode(p, OUTPUT);
  for (int i = 0; i < 250; i++) qtr.calibrate();  // gire o robo sobre a linha
  Serial.begin(9600);  // HC-05
}

void loop() {
  int posicao = qtr.readLineBlack(valores);   // 0..7000
  int erro = posicao - 3500;
  integral += erro;
  int correcao = Kp * erro + Ki * integral + Kd * (erro - erroAnterior);
  erroAnterior = erro;

  motor(PWMA, AIN1, AIN2, baseSpeed + correcao);
  motor(PWMB, BIN1, BIN2, baseSpeed - correcao);

  if (Serial.available()) {   // ex.: "P0.09" "D0.7"
    char k = Serial.read();
    float v = Serial.parseFloat();
    if (k == 'P') Kp = v; else if (k == 'I') Ki = v; else if (k == 'D') Kd = v;
  }
}
`,
      },
    ],
    dossier: {
      technicalRequirements: [
        req('TR-1', 'Laço de controle rápido', 'O loop do PID deve rodar acima de 500 Hz; evitar delay() e Serial.print no laço.'),
        req('TR-2', 'Calibração dos sensores', 'Executar a calibração do QTR na pista antes de cada corrida.'),
        req('TR-3', 'Ajuste remoto', 'Permitir ajuste de Kp, Ki e Kd via Bluetooth.', 'medium'),
        req('TR-4', 'Peso total', 'Manter o robô abaixo de 200 g para reduzir a inércia nas curvas.', 'low'),
      ],
      suggestedBOM: [
        bom('Arduino Nano', 1),
        bom('Pololu QTR-8A', 1),
        bom('Ponte H TB6612FNG', 1),
        bom('Motor N20 1000 RPM', 2),
        bom('LiPo 2S 450mAh', 1, 'Usar carregador balanceado'),
        bom('Módulo HC-05', 1, 'Opcional, para ajuste do PID'),
      ],
      assemblySteps: [
        step(1, 'Montar o chassi', 'Fixar os motores N20 com suportes e posicionar a barra QTR 5 mm acima do chão.'),
        step(2, 'Ligar a ponte H', 'PWMA/PWMB nos pinos 5/6, sentidos nos pinos 7–10 e STBY no pino 4.'),
        step(3, 'Ligar os sensores', 'Saídas da QTR-8A nas entradas A0–A7 do Nano.'),
        step(4, 'Calibrar', 'Ligar o robô sobre a linha e girá-lo durante os primeiros 3 segundos.'),
        step(5, 'Sintonizar o PID', 'Subir Kp até oscilar, reduzir 30%, depois aumentar Kd até estabilizar nas curvas.'),
      ],
    },
  },
  {
    title: 'Braço Robótico 4DOF Impresso em 3D',
    tags: ['Robotics', '3D_Printing'],
    description:
      'Braço robótico de 4 graus de liberdade (base, ombro, cotovelo e garra) com peças impressas em PLA+ e servos MG996R/SG90. Controlado por joysticks analógicos ou por comandos seriais, com gravação e reprodução de sequências de movimento.',
    objective:
      'Plataforma de baixo custo para ensinar cinemática e programação de robôs manipuladores em escolas e makerspaces.',
    printerBrand: 'Creality',
    printerModel: 'Ender 3 V3 SE',
    printerNozzle: '0.4',
    printerMaterial: 'PLA+',
    printerLayerHeight: '0.2',
    components: [
      { name: 'Arduino Uno R3', quantity: 1, description: 'Controlador' },
      { name: 'Driver de servos PCA9685 16 canais', quantity: 1, description: 'PWM via I2C, alivia o Arduino' },
      { name: 'Servo MG996R', quantity: 3, description: 'Base, ombro e cotovelo (engrenagem metálica)' },
      { name: 'Servo SG90', quantity: 1, description: 'Garra' },
      { name: 'Módulo joystick analógico KY-023', quantity: 2, description: 'Controle manual' },
      { name: 'Fonte 5V 5A', quantity: 1, description: 'Alimentação exclusiva dos servos' },
      { name: 'Rolamento 608ZZ', quantity: 1, description: 'Giro suave da base' },
      { name: 'Peças impressas (PLA+, 30% gyroid)', quantity: 9, description: '~380 g de filamento, ~22 h de impressão' },
    ],
    difficulties: [
      'Ao mover os três MG996R ao mesmo tempo, a corrente de pico passava de 4 A e a tensão caía. Troquei para uma fonte de 5A e coloquei um capacitor de 1000 µF no barramento do PCA9685.',
      'O ombro não segurava o braço estendido. Imprimi o elo do ombro com 4 perímetros e encurtei o antebraço em 2 cm para reduzir o torque.',
    ],
    codeFiles: [
      {
        filename: 'braco_4dof.ino',
        content: `#include <Wire.h>
#include <Adafruit_PWMServoDriver.h>

Adafruit_PWMServoDriver pca = Adafruit_PWMServoDriver(0x40);
const int SERVO_MIN = 110, SERVO_MAX = 500;    // pulsos calibrados para o MG996R
const int JOY[4] = {A0, A1, A2, A3};
float angulo[4] = {90, 90, 90, 40};
const int LIM_MIN[4] = {0, 15, 20, 10};
const int LIM_MAX[4] = {180, 165, 160, 80};   // garra limitada para nao forcar o SG90

void escreve(int canal, float graus) {
  pca.setPWM(canal, 0, map((int)graus, 0, 180, SERVO_MIN, SERVO_MAX));
}

void setup() {
  pca.begin();
  pca.setPWMFreq(50);
  for (int i = 0; i < 4; i++) escreve(i, angulo[i]);
}

void loop() {
  for (int i = 0; i < 4; i++) {
    int leitura = analogRead(JOY[i]) - 512;
    if (abs(leitura) > 60) {                    // zona morta do joystick
      angulo[i] += leitura / 400.0;
      angulo[i] = constrain(angulo[i], LIM_MIN[i], LIM_MAX[i]);
      escreve(i, angulo[i]);
    }
  }
  delay(15);
}
`,
      },
    ],
    dossier: {
      technicalRequirements: [
        req('TR-1', 'Fonte separada para os servos', 'Servos alimentados por fonte 5V 5A própria, com GND comum ao Arduino.'),
        req('TR-2', 'Limites de ângulo', 'Limitar cada junta por software para evitar colisão e esforço mecânico.'),
        req('TR-3', 'Resistência das peças', 'Elos de carga impressos com no mínimo 4 perímetros e 30% de preenchimento.', 'medium'),
        req('TR-4', 'Suavidade de movimento', 'Incrementos pequenos por ciclo (15 ms) para evitar trancos.', 'low'),
      ],
      suggestedBOM: [
        bom('Arduino Uno R3', 1),
        bom('PCA9685', 1),
        bom('Servo MG996R', 3),
        bom('Servo SG90', 1),
        bom('Fonte 5V 5A', 1),
        bom('Filamento PLA+', '400 g'),
      ],
      assemblySteps: [
        step(1, 'Imprimir as peças', 'Base, plataforma giratória, ombro, braço, antebraço e garra em PLA+ com camada de 0,2 mm.'),
        step(2, 'Centralizar os servos', 'Antes de parafusar os horns, levar todos os servos a 90° com o firmware.'),
        step(3, 'Montar a base', 'Encaixar o rolamento 608ZZ e fixar o MG996R da base.'),
        step(4, 'Montar braço e garra', 'Unir os elos com parafusos M3 e fixar o SG90 na garra.'),
        step(5, 'Ligar a eletrônica', 'PCA9685 no I2C (A4/A5), servos nos canais 0–3 e joysticks em A0–A3.'),
        step(6, 'Ajustar limites', 'Testar junta por junta e ajustar LIM_MIN e LIM_MAX no código.'),
      ],
    },
  },
  {
    title: 'Case Paramétrico para ESP32 em PETG',
    tags: ['3D_Printing', 'IoT'],
    description:
      'Gabinete paramétrico modelado em OpenSCAD para placas ESP32 DevKit, com tampa de encaixe (snap-fit), furos de ventilação, passagem para cabo USB e suportes para trilho DIN. Basta alterar as dimensões no arquivo para adaptar a outras placas.',
    objective:
      'Padronizar a montagem de protótipos IoT do laboratório em cases resistentes ao calor e reutilizáveis, sem precisar remodelar a cada projeto.',
    printerBrand: 'Bambu Lab',
    printerModel: 'P1S',
    printerNozzle: '0.4',
    printerMaterial: 'PETG',
    printerLayerHeight: '0.2',
    components: [
      { name: 'Filamento PETG', quantity: 1, description: '~45 g por case' },
      { name: 'Insertos roscados M3 de latão', quantity: 4, description: 'Instalados com ferro de solda' },
      { name: 'Parafusos M3x6', quantity: 4, description: 'Fixação da placa' },
      { name: 'Clip para trilho DIN 35 mm', quantity: 1, description: 'Impresso junto, opcional' },
    ],
    difficulties: [
      'Com PETG, a tampa snap-fit ficava apertada demais. Aumentei a folga de 0,2 mm para 0,35 mm, porque o PETG expande um pouco mais que o PLA nas paredes externas.',
      'O fio de PETG (stringing) entre os furos de ventilação exigiu aumentar a retração para 0,8 mm e baixar o bico para 235 °C.',
    ],
    codeFiles: [
      {
        filename: 'case_esp32.scad',
        content: `// Case parametrico para ESP32 DevKit - unidades em mm
placa = [55, 28, 1.6];
folga = 2;
parede = 2;
altura_interna = 18;
folga_tampa = 0.35;     // PETG: 0.35 / PLA: 0.2
furo_usb = [12, 8];

interno = [placa.x + 2*folga, placa.y + 2*folga, altura_interna];
externo = interno + [2*parede, 2*parede, parede];

module base() {
  difference() {
    cube(externo);
    translate([parede, parede, parede]) cube(interno + [0, 0, 1]);
    // passagem do cabo USB
    translate([-1, externo.y/2 - furo_usb.x/2, parede + 3]) cube([parede + 2, furo_usb.x, furo_usb.y]);
    // ventilacao lateral
    for (i = [0:5]) translate([12 + i*7, -1, 8]) cube([3, parede + 2, 8]);
  }
  // suportes da placa com furo para inserto M3
  for (x = [parede + folga + 2.5, externo.x - parede - folga - 2.5])
    for (y = [parede + folga + 2.5, externo.y - parede - folga - 2.5])
      translate([x, y, parede]) difference() {
        cylinder(d = 6, h = 4, $fn = 32);
        cylinder(d = 4.2, h = 5, $fn = 32);
      }
}

module tampa() {
  cube([externo.x, externo.y, parede]);
  translate([parede + folga_tampa, parede + folga_tampa, parede])
    difference() {
      cube([interno.x - 2*folga_tampa, interno.y - 2*folga_tampa, 3]);
      translate([1.2, 1.2, -1]) cube([interno.x - 2*folga_tampa - 2.4, interno.y - 2*folga_tampa - 2.4, 5]);
    }
}

base();
translate([0, externo.y + 10, 0]) tampa();
`,
      },
    ],
    dossier: {
      technicalRequirements: [
        req('TR-1', 'Material resistente ao calor', 'PETG para suportar ~70 °C dentro de quadros elétricos, onde o PLA deforma.'),
        req('TR-2', 'Folga do encaixe', 'Folga de 0,35 mm na tampa para PETG (0,2 mm para PLA).'),
        req('TR-3', 'Fixação durável', 'Usar insertos de latão M3 em vez de parafusar direto no plástico.', 'medium'),
        req('TR-4', 'Parametrização', 'Todas as dimensões em variáveis no topo do arquivo .scad.', 'medium'),
      ],
      suggestedBOM: [
        bom('Filamento PETG', '45 g'),
        bom('Inserto de latão M3', 4),
        bom('Parafuso M3x6', 4),
      ],
      assemblySteps: [
        step(1, 'Ajustar parâmetros', 'Editar placa, altura_interna e folga_tampa no case_esp32.scad conforme a placa e o material.'),
        step(2, 'Exportar e fatiar', 'Exportar STL, fatiar com 3 perímetros, 20% de preenchimento e bico a 235 °C.'),
        step(3, 'Instalar insertos', 'Pressionar os insertos M3 nos suportes com o ferro de solda a 220 °C.'),
        step(4, 'Fixar a placa', 'Parafusar o ESP32 e conferir o alinhamento do conector USB.'),
        step(5, 'Fechar', 'Encaixar a tampa; se estiver justa, lixar levemente a borda interna.'),
      ],
    },
  },
  {
    title: 'Medidor de Consumo de Energia Residencial',
    tags: ['IoT'],
    description:
      'Medidor não invasivo de consumo elétrico com o módulo PZEM-004T v3, que mede tensão, corrente, potência, fator de potência e energia acumulada (kWh). Os dados vão para um InfluxDB e são visualizados no Grafana, com estimativa do valor da conta de luz.',
    objective:
      'Mostrar quanto cada circuito da casa consome e ajudar a identificar aparelhos que gastam muito, incentivando a economia de energia.',
    components: [
      { name: 'ESP32 DevKit V1', quantity: 1, description: 'Leitura Modbus e envio Wi-Fi' },
      { name: 'Módulo PZEM-004T v3.0 100A', quantity: 1, description: 'Com TC de núcleo dividido' },
      { name: 'Fonte Hi-Link HLK-PM05', quantity: 1, description: '220V AC para 5V DC' },
      { name: 'Caixa de passagem com trilho DIN', quantity: 1, description: 'Isolamento do circuito de 220V' },
      { name: 'Borne de conexão 2,5 mm²', quantity: 4, description: 'Ligação da tensão de referência' },
    ],
    difficulties: [
      'O PZEM-004T v3 usa Modbus RTU, não o protocolo antigo da v1. A biblioteca precisa ser a PZEM004Tv30, senão o módulo não responde.',
      'Trabalhar com 220V exige cuidado: toda a montagem foi feita com o disjuntor desligado e revisada por um eletricista antes de energizar.',
    ],
    codeFiles: [
      {
        filename: 'medidor_energia.ino',
        content: `#include <WiFi.h>
#include <HTTPClient.h>
#include <PZEM004Tv30.h>

PZEM004Tv30 pzem(Serial2, 16, 17);
const char* INFLUX_URL = "http://192.168.0.10:8086/api/v2/write?org=casa&bucket=energia&precision=s";
const char* INFLUX_TOKEN = "SEU_TOKEN";
const float TARIFA_KWH = 0.89;   // R$/kWh, ajuste para a sua distribuidora

void setup() {
  WiFi.begin("SUA_REDE", "SUA_SENHA");
  while (WiFi.status() != WL_CONNECTED) delay(500);
}

void loop() {
  float v = pzem.voltage(), i = pzem.current(), p = pzem.power();
  float e = pzem.energy(), fp = pzem.pf();
  if (!isnan(v)) {
    String linha = "consumo,circuito=geral ";
    linha += "tensao=" + String(v, 1) + ",corrente=" + String(i, 3) + ",potencia=" + String(p, 1);
    linha += ",energia=" + String(e, 3) + ",fp=" + String(fp, 2) + ",custo=" + String(e * TARIFA_KWH, 2);

    HTTPClient http;
    http.begin(INFLUX_URL);
    http.addHeader("Authorization", String("Token ") + INFLUX_TOKEN);
    http.POST(linha);
    http.end();
  }
  delay(10000);
}
`,
      },
    ],
    dossier: {
      technicalRequirements: [
        req('TR-1', 'Segurança elétrica', 'Montagem com o disjuntor desligado, dentro de caixa isolada e revisada por eletricista.'),
        req('TR-2', 'Medição não invasiva', 'Corrente medida por TC de núcleo dividido, sem cortar o condutor.'),
        req('TR-3', 'Protocolo correto', 'PZEM-004T v3 via Modbus RTU com a biblioteca PZEM004Tv30.', 'medium'),
        req('TR-4', 'Histórico', 'Armazenar leituras a cada 10 s no InfluxDB para gráficos no Grafana.', 'medium'),
      ],
      suggestedBOM: [
        bom('ESP32 DevKit V1', 1),
        bom('PZEM-004T v3 com TC 100A', 1),
        bom('Fonte HLK-PM05', 1),
        bom('Caixa DIN isolada', 1),
      ],
      assemblySteps: [
        step(1, 'Desligar o disjuntor geral', 'Confirmar a ausência de tensão com multímetro antes de mexer no quadro.'),
        step(2, 'Instalar o TC', 'Abraçar apenas a fase do circuito a ser medido com o TC de núcleo dividido.'),
        step(3, 'Ligar a referência de tensão', 'Fase e neutro nos bornes do PZEM e da fonte HLK-PM05.'),
        step(4, 'Ligar a comunicação', 'TX/RX do PZEM nos GPIO16/17 do ESP32, com GND comum.'),
        step(5, 'Configurar o Grafana', 'Criar painéis de potência instantânea, kWh diário e custo estimado do mês.'),
      ],
    },
  },
  {
    title: 'Gabarito de Cavilhas para Marcenaria',
    tags: ['Woodworking', '3D_Printing'],
    description:
      'Gabarito de furação para cavilhas de 6, 8 e 10 mm, com corpo em MDF cortado na CNC e buchas-guia de aço. Garante furos perpendiculares e alinhados nas duas peças da junta, sem precisar de furadeira de bancada.',
    objective:
      'Permitir juntas de cavilha precisas em móveis feitos em casa ou em makerspaces, com uma ferramenta barata e fácil de reproduzir.',
    printerBrand: 'Bambu Lab',
    printerModel: 'A1',
    printerNozzle: '0.4',
    printerMaterial: 'PETG',
    printerLayerHeight: '0.16',
    components: [
      { name: 'MDF 18 mm (300x100 mm)', quantity: 1, description: 'Corpo do gabarito, usinado na CNC' },
      { name: 'Bucha-guia de aço 6 mm', quantity: 2, description: 'Evita o desgaste dos furos' },
      { name: 'Bucha-guia de aço 8 mm', quantity: 2, description: '' },
      { name: 'Bucha-guia de aço 10 mm', quantity: 2, description: '' },
      { name: 'Batente lateral impresso em PETG', quantity: 1, description: 'Referência de borda ajustável' },
      { name: 'Grampo sargento 150 mm', quantity: 2, description: 'Fixação na peça' },
    ],
    difficulties: [
      'Furar direto no MDF deixava os furos ovalados depois de uns 20 usos. As buchas de aço prensadas resolveram e deixaram a ferramenta durável.',
      'O centro dos furos precisa ficar exatamente no meio da espessura da madeira. Fiz o batente com um parafuso de ajuste fino e marcações a cada 1 mm.',
    ],
    codeFiles: [
      {
        filename: 'gabarito_cavilha.nc',
        content: `( Gabarito de cavilhas - furos guia em MDF 18 mm )
( Fresa de topo 6 mm, zero no canto inferior esquerdo, Z0 no topo do MDF )
G21 G90 G17
G0 Z5
M3 S18000

( Bucha 6 mm: furo de 8 mm por helicoidal )
#1 = 25
#2 = 60
G0 X#1 Y50
G0 Z2
G2 X#1 Y50 I1 J0 Z-6 F400
G2 X#1 Y50 I1 J0 Z-12
G2 X#1 Y50 I1 J0 Z-18.5
G2 X#1 Y50 I1 J0
G0 Z5
G0 X#2 Y50
G2 X#2 Y50 I1 J0 Z-6
G2 X#2 Y50 I1 J0 Z-12
G2 X#2 Y50 I1 J0 Z-18.5
G2 X#2 Y50 I1 J0
G0 Z5

( Repetir para buchas de 8 e 10 mm em X 120/155 e 215/250 com raio ajustado )
M5
G0 Z20
M30
`,
      },
    ],
    dossier: {
      technicalRequirements: [
        req('TR-1', 'Perpendicularidade', 'Furos-guia a 90° da face, garantidos por buchas de aço prensadas.'),
        req('TR-2', 'Centralização', 'Batente com ajuste fino para centralizar o furo na espessura da peça.'),
        req('TR-3', 'Espaçamento padrão', 'Distância de 32 mm entre furos, compatível com o sistema 32 de marcenaria.', 'medium'),
      ],
      suggestedBOM: [
        bom('MDF 18 mm', '300x100 mm'),
        bom('Buchas-guia de aço 6/8/10 mm', 6, '2 de cada'),
        bom('Filamento PETG', '30 g', 'Batente'),
        bom('Grampo sargento', 2),
      ],
      assemblySteps: [
        step(1, 'Usinar o corpo', 'Rodar o G-code na CNC para abrir os alojamentos das buchas no MDF.'),
        step(2, 'Prensar as buchas', 'Prensar as buchas de aço com morsa, conferindo o esquadro.'),
        step(3, 'Imprimir o batente', 'Imprimir em PETG e fixar com parafuso de ajuste fino.'),
        step(4, 'Testar em sobra', 'Furar duas sobras de madeira, unir com cavilha e conferir o alinhamento.'),
      ],
    },
  },
  {
    title: 'Mini Sumô Autônomo 500 g',
    tags: ['Robotics'],
    description:
      'Robô de mini sumô autônomo na categoria 500 g / 10x10 cm. Usa três sensores de distância infravermelhos JS40F para localizar o oponente e dois sensores de linha QRE1113 para não sair do dohyo. Estratégia de busca em espiral com ataque frontal ao detectar o oponente.',
    objective:
      'Desenvolver um robô competitivo para torneios regionais de robótica e documentar as estratégias para outras equipes começarem na categoria.',
    components: [
      { name: 'Arduino Pro Mini 5V', quantity: 1, description: 'Compacto para caber em 10x10 cm' },
      { name: 'Sensor de distância JS40F', quantity: 3, description: 'Alcance de até 40 cm, saída digital' },
      { name: 'Sensor de linha QRE1113', quantity: 2, description: 'Detecção da borda branca' },
      { name: 'Driver DRV8833', quantity: 1, description: 'Dual H-bridge compacta' },
      { name: 'Micromotor N20 6V 300 RPM', quantity: 2, description: 'Mais torque para empurrar' },
      { name: 'LiPo 2S 300mAh', quantity: 1, description: '' },
      { name: 'Lâmina frontal de aço inox', quantity: 1, description: 'Rampa de 1 mm, cortada a laser' },
      { name: 'Módulo de partida IR', quantity: 1, description: 'Exigido pelas regras de competição' },
    ],
    difficulties: [
      'O robô ficava abaixo de 500 g e perdia nos empurrões. Adicionei lastro de chumbo de pesca perto do eixo para chegar a 495 g e ganhar tração.',
      'Os sensores de linha davam falso positivo com o reflexo da lâmina. Passei a exigir duas leituras seguidas abaixo do limiar antes de recuar.',
    ],
    codeFiles: [
      {
        filename: 'mini_sumo.ino',
        content: `const int DIST_ESQ = 2, DIST_CEN = 3, DIST_DIR = 4;
const int LINHA_E = A0, LINHA_D = A1, LIMIAR_BRANCO = 300;
const int START = 7;
const int M1A = 5, M1B = 6, M2A = 9, M2B = 10;

void motores(int e, int d) {
  analogWrite(M1A, e > 0 ? e : 0); analogWrite(M1B, e < 0 ? -e : 0);
  analogWrite(M2A, d > 0 ? d : 0); analogWrite(M2B, d < 0 ? -d : 0);
}

bool borda(int pino) {
  return analogRead(pino) < LIMIAR_BRANCO && (delayMicroseconds(200), analogRead(pino) < LIMIAR_BRANCO);
}

void setup() {
  for (int p : {DIST_ESQ, DIST_CEN, DIST_DIR, START}) pinMode(p, INPUT);
  while (!digitalRead(START));   // aguarda o modulo de partida IR
}

void loop() {
  if (!digitalRead(START)) { motores(0, 0); while (true); }

  if (borda(LINHA_E) || borda(LINHA_D)) {
    motores(-255, -255); delay(200);
    motores(borda(LINHA_E) ? 200 : -200, borda(LINHA_E) ? -200 : 200); delay(250);
    return;
  }
  if (digitalRead(DIST_CEN))      motores(255, 255);   // ataque
  else if (digitalRead(DIST_ESQ)) motores(-150, 200);
  else if (digitalRead(DIST_DIR)) motores(200, -150);
  else                            motores(180, 120);   // busca em espiral
}
`,
      },
    ],
    dossier: {
      technicalRequirements: [
        req('TR-1', 'Limites da categoria', 'Robô com no máximo 500 g e 10x10 cm de base, sem limite de altura.'),
        req('TR-2', 'Módulo de partida', 'Início e parada controlados pelo módulo IR, conforme as regras do torneio.'),
        req('TR-3', 'Detecção de borda confiável', 'Confirmar duas leituras de linha seguidas antes de recuar.', 'medium'),
        req('TR-4', 'Centro de massa baixo', 'Lastro perto do eixo para aumentar a tração.', 'medium'),
      ],
      suggestedBOM: [
        bom('Arduino Pro Mini 5V', 1),
        bom('Sensor JS40F', 3),
        bom('Sensor QRE1113', 2),
        bom('Driver DRV8833', 1),
        bom('Motor N20 300 RPM', 2),
        bom('Módulo de partida IR', 1),
      ],
      assemblySteps: [
        step(1, 'Montar o chassi', 'Fixar os motores e a lâmina frontal com ângulo de rampa de cerca de 20°.'),
        step(2, 'Posicionar os sensores', 'JS40F à esquerda, ao centro e à direita na frente; QRE1113 nos cantos dianteiros, a 2 mm do chão.'),
        step(3, 'Ajustar o peso', 'Pesar o robô e completar com lastro até 495 g.'),
        step(4, 'Calibrar o limiar de linha', 'Medir os valores no dohyo preto e na borda branca e ajustar LIMIAR_BRANCO.'),
        step(5, 'Treinar estratégias', 'Testar a busca em espiral e o ataque contra um robô de referência.'),
      ],
    },
  },
];

const TAG_MAP = { IoT: 'IoT', Robotics: 'Robotics', Woodworking: 'Woodworking', '3D_Printing': 'Printing3D' };

async function main() {
  const ownerEmail = process.env.OWNER_EMAIL;
  const dryRun = process.env.DRY_RUN === '1';
  if (!ownerEmail) throw new Error('Defina OWNER_EMAIL com o e-mail de um usuario existente.');

  const owner = await prisma.user.findUnique({ where: { email: ownerEmail }, select: { id: true, name: true } });
  if (!owner) throw new Error(`Usuario ${ownerEmail} nao encontrado.`);
  console.log(`Dono: ${owner.name ?? ownerEmail} (id ${owner.id})${dryRun ? ' [DRY RUN]' : ''}`);

  let created = 0;
  for (const p of PROJECTS) {
    const exists = await prisma.project.findFirst({ where: { creatorId: owner.id, title: p.title }, select: { id: true } });
    if (exists) {
      console.log(`- pulado (ja existe, id ${exists.id}): ${p.title}`);
      continue;
    }
    if (dryRun) {
      console.log(`- seria criado: ${p.title}`);
      continue;
    }

    const project = await prisma.$transaction(async (tx) => {
      const proj = await tx.project.create({
        data: {
          title: p.title,
          description: p.description,
          objective: p.objective,
          visibility: 'public',
          creatorId: owner.id,
          printerBrand: p.printerBrand ?? null,
          printerModel: p.printerModel ?? null,
          printerNozzle: p.printerNozzle ?? null,
          printerMaterial: p.printerMaterial ?? null,
          printerLayerHeight: p.printerLayerHeight ?? null,
          tags: { create: p.tags.map((t) => ({ tag: TAG_MAP[t] })) },
          components: { create: p.components.map((c) => ({ ...c, description: c.description || null })) },
          difficulties: { create: p.difficulties.map((description) => ({ description })) },
          codeFiles: { create: p.codeFiles },
        },
        select: { id: true },
      });
      await tx.projectDossier.create({
        data: {
          projectId: proj.id,
          technicalRequirements: JSON.stringify(p.dossier.technicalRequirements),
          suggestedBOM: JSON.stringify(p.dossier.suggestedBOM),
          assemblySteps: JSON.stringify(p.dossier.assemblySteps),
        },
      });
      return proj;
    });
    created++;
    console.log(`+ criado (id ${project.id}): ${p.title}`);
  }
  console.log(`Concluido: ${created} criado(s) de ${PROJECTS.length}.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
