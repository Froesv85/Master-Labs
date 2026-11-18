/*
  NODO — robô mascote da MakerConnect
  Modo autônomo de exposição: passeia, desvia de obstáculos, para para
  "olhar em volta" e acena quando alguém chega perto.

  Placa: ESP32 DevKit (ESP32-WROOM-32), Arduino core 2.x ou 3.x
  Bibliotecas: Adafruit GFX, Adafruit ILI9341, Adafruit NeoPixel, ESP32Servo

  Ajustes rápidos estão na seção CONFIGURAÇÃO.
*/
#include <Adafruit_GFX.h>
#include <Adafruit_ILI9341.h>
#include <Adafruit_NeoPixel.h>
#include <ESP32Servo.h>

// =================== PINOS ===================
// Motores (TB6612FNG) — STBY ligado direto em 3V3
const int PIN_PWMA = 25, PIN_AIN1 = 26, PIN_AIN2 = 27;   // esteira esquerda
const int PIN_PWMB = 14, PIN_BIN1 = 33, PIN_BIN2 = 32;   // esteira direita
// Tela ILI9341 (VSPI: SCK 18, MOSI 23)
const int PIN_TFT_CS = 5, PIN_TFT_DC = 16, PIN_TFT_RST = 17;
// Sensores e atuadores
const int PIN_TRIG = 21, PIN_ECHO = 22;   // HC-SR04 (ECHO com divisor 1k/2k!)
const int PIN_SERVO = 13;                 // SG90 do braço direito
const int PIN_LED = 4;                    // PL9823 / WS2812 da antena
const int PIN_VBAT = 34;                  // divisor 100k / 33k da bateria 2S

// =================== CONFIGURAÇÃO ===================
const bool  MOTOR_L_INVERT = false;       // troque se a esteira girar ao contrário
const bool  MOTOR_R_INVERT = false;
const int   MAX_DUTY       = 180;         // 0-255. 180 ≈ 6 V num 2S cheio (N20 de 6 V)
const int   CRUISE         = 150;         // velocidade de passeio
const int   TURN_SPEED     = 160;
const float OBST_CM        = 25;          // abaixo disso: desvia
const float CLEAR_CM       = 40;          // acima disso: caminho livre
const float GREET_MIN_CM   = 20;          // alguém na frente durante a pausa
const float GREET_MAX_CM   = 80;
const int   ARM_DOWN       = 40;          // ângulo do servo com braço abaixado
const int   ARM_UP         = 150;         // ângulo com braço levantado (pose do mascote)
const int   WAVE_SPAN      = 25;          // amplitude do aceno
const float VBAT_DIVIDER   = (100.0 + 33.0) / 33.0;
const float VBAT_LOW       = 6.6;         // 2S: abaixo disso para e dorme
const int   TFT_ROTATION   = 1;           // 1 ou 3, conforme a tela foi montada

// =================== CORES ===================
#define RGB565(r, g, b) ((((r) & 0xF8) << 8) | (((g) & 0xFC) << 3) | ((b) >> 3))
const uint16_t C_BG     = RGB565(0x0f, 0x17, 0x2a);
const uint16_t C_TEAL   = RGB565(0x00, 0xC4, 0xB4);
const uint16_t C_ORANGE = RGB565(0xFF, 0xA5, 0x00);

// =================== OBJETOS ===================
Adafruit_ILI9341 tft(PIN_TFT_CS, PIN_TFT_DC, PIN_TFT_RST);
GFXcanvas16 *face = nullptr;              // desenho sem piscar
const int FACE_W = 280, FACE_H = 150;
Adafruit_NeoPixel led(1, PIN_LED, NEO_RGB + NEO_KHZ800);   // PL9823 = RGB; WS2812 = NEO_GRB
Servo arm;

// =================== MOTORES ===================
#if ESP_ARDUINO_VERSION_MAJOR >= 3
void pwmSetup(int pin, int ch) { (void)ch; ledcAttach(pin, 20000, 8); }
void pwmWrite(int pin, int ch, int duty) { (void)ch; ledcWrite(pin, duty); }
#else
void pwmSetup(int pin, int ch) { ledcSetup(ch, 20000, 8); ledcAttachPin(pin, ch); }
void pwmWrite(int pin, int ch, int duty) { (void)pin; ledcWrite(ch, duty); }
#endif
const int CH_A = 6, CH_B = 7;   // canais altos para não colidir com o servo (core 2.x)

void motor(int in1, int in2, int pwmPin, int ch, int speed, bool invert) {
  if (invert) speed = -speed;
  speed = constrain(speed, -MAX_DUTY, MAX_DUTY);
  digitalWrite(in1, speed > 0);
  digitalWrite(in2, speed < 0);
  pwmWrite(pwmPin, ch, abs(speed));
}
void drive(int left, int right) {
  motor(PIN_AIN1, PIN_AIN2, PIN_PWMA, CH_A, left, MOTOR_L_INVERT);
  motor(PIN_BIN1, PIN_BIN2, PIN_PWMB, CH_B, right, MOTOR_R_INVERT);
}
void stopMotors() { drive(0, 0); }

// rampa suave (as esteiras escorregam menos)
int curL = 0, curR = 0, tgtL = 0, tgtR = 0;
void setDrive(int l, int r) { tgtL = l; tgtR = r; }
void updateDrive() {
  const int STEP = 12;
  curL += constrain(tgtL - curL, -STEP, STEP);
  curR += constrain(tgtR - curR, -STEP, STEP);
  drive(curL, curR);
}

// =================== SONAR ===================
float readCmOnce() {
  digitalWrite(PIN_TRIG, LOW); delayMicroseconds(3);
  digitalWrite(PIN_TRIG, HIGH); delayMicroseconds(10);
  digitalWrite(PIN_TRIG, LOW);
  unsigned long us = pulseIn(PIN_ECHO, HIGH, 15000UL);   // ~2,5 m (não trava o loop)
  if (us == 0) return 400;
  return us / 58.0f;
}
float distCm = 400;
void updateSonar() {   // mediana de 3
  float a = readCmOnce(); delay(8);
  float b = readCmOnce(); delay(8);
  float c = readCmOnce();
  distCm = max(min(a, b), min(max(a, b), c));
}

// =================== BATERIA ===================
float vbat = 8.0;
void updateBattery() {
  float v = analogReadMilliVolts(PIN_VBAT) / 1000.0f * VBAT_DIVIDER;
  vbat = vbat * 0.9f + v * 0.1f;
}

// =================== BRAÇO ===================
int armTarget = ARM_DOWN;
bool armAttached = false;
unsigned long armIdleSince = 0;
void armTo(int angle) {
  if (!armAttached) { arm.attach(PIN_SERVO, 500, 2400); armAttached = true; }
  arm.write(angle);
  armIdleSince = millis();
}
void armRelax() {  // solta o servo parado: sem tremedeira e economiza bateria
  if (armAttached && millis() - armIdleSince > 800) { arm.detach(); armAttached = false; }
}
void wave(int times) {
  armTo(ARM_UP); delay(350);
  for (int i = 0; i < times; i++) {
    armTo(ARM_UP - WAVE_SPAN); delay(220);
    armTo(ARM_UP); delay(220);
  }
}

// =================== ANTENA ===================
enum LedMode { LED_BREATH, LED_PULSE_ORANGE, LED_RAINBOW, LED_SLEEP };
LedMode ledMode = LED_BREATH;
void updateLed() {
  unsigned long t = millis();
  float s = (sin(t / 600.0f) + 1) / 2;   // 0..1
  uint32_t c = 0;
  switch (ledMode) {
    case LED_BREATH:       c = led.Color(255 * (0.15 + 0.85 * s), 120 * (0.15 + 0.85 * s), 0); break;
    case LED_PULSE_ORANGE: c = ((t / 120) % 2) ? led.Color(255, 140, 0) : led.Color(40, 20, 0); break;
    case LED_RAINBOW:      c = led.ColorHSV((t * 40) & 0xFFFF, 255, 200); break;
    case LED_SLEEP:        c = led.Color(60 * s, 0, 0); break;
  }
  led.setPixelColor(0, led.gamma32(c));
  led.show();
}

// =================== ROSTO ===================
enum Face { F_HAPPY, F_IDEA, F_CELEBRATE, F_FOCUS, F_SLEEP };
Face faceNow = F_HAPPY;
int lookX = 0;            // -1 esquerda, 0 frente, 1 direita
bool blinking = false;

void thickLine(int x0, int y0, int x1, int y1, int r, uint16_t c) {
  int n = max(abs(x1 - x0), abs(y1 - y0));
  for (int i = 0; i <= n; i += 2) face->fillCircle(x0 + (x1 - x0) * i / max(n, 1), y0 + (y1 - y0) * i / max(n, 1), r, c);
}
void thickArc(int cx, int cy, int rad, float a0, float a1, int r, uint16_t c) {  // graus, 0 = direita, 90 = baixo
  for (float a = a0; a <= a1; a += 4) face->fillCircle(cx + rad * cos(a * DEG_TO_RAD), cy + rad * sin(a * DEG_TO_RAD), r, c);
}

void drawFace() {
  face->fillScreen(C_BG);
  const int ex = 70, ey = 62, cx = FACE_W / 2;   // olhos em cx±ex
  int dx = lookX * 18;
  if (blinking && faceNow != F_SLEEP) {
    for (int s = -1; s <= 1; s += 2) thickLine(cx + s * ex - 26 + dx, ey, cx + s * ex + 26 + dx, ey, 5, C_TEAL);
  } else switch (faceNow) {
    case F_HAPPY:      // arcos sorridentes (^ ^)
      for (int s = -1; s <= 1; s += 2) thickArc(cx + s * ex, ey + 14, 28, 200, 340, 7, C_TEAL);
      thickArc(cx, 100, 22, 30, 150, 5, C_TEAL);
      face->fillCircle(cx - 118, 112, 8, C_ORANGE); face->fillCircle(cx + 118, 112, 8, C_ORANGE);
      break;
    case F_IDEA:       // olhos redondos, boca "o"
      for (int s = -1; s <= 1; s += 2) {
        face->fillCircle(cx + s * ex, ey, 30, C_TEAL);
        face->fillCircle(cx + s * ex + 9, ey - 10, 11, C_BG);
      }
      face->fillCircle(cx, 122, 13, C_TEAL); face->fillCircle(cx, 122, 6, C_BG);
      break;
    case F_CELEBRATE:  // chevrons e boca aberta
      for (int s = -1; s <= 1; s += 2) {
        thickLine(cx + s * ex - 28, ey + 14, cx + s * ex, ey - 14, 7, C_TEAL);
        thickLine(cx + s * ex, ey - 14, cx + s * ex + 28, ey + 14, 7, C_TEAL);
      }
      face->fillRect(cx - 36, 96, 72, 4, C_TEAL);
      face->fillCircle(cx, 100, 36, C_TEAL); face->fillRect(cx - 40, 60, 80, 40, C_BG);
      face->fillRect(cx - 36, 96, 72, 6, C_TEAL);
      break;
    case F_FOCUS:      // olhos com pupila seguindo a direção da curva
      for (int s = -1; s <= 1; s += 2) {
        face->fillCircle(cx + s * ex, ey, 27, C_TEAL);
        face->fillCircle(cx + s * ex + 12 + lookX * 6, ey + 10, 11, C_BG);
      }
      thickArc(cx, 104, 14, 40, 140, 4, C_TEAL);
      break;
    case F_SLEEP:      // bateria fraca
      for (int s = -1; s <= 1; s += 2) thickLine(cx + s * ex - 24, ey + 6, cx + s * ex + 24, ey + 6, 5, C_TEAL);
      face->setTextColor(C_ORANGE); face->setTextSize(3);
      face->setCursor(cx + 70, 6); face->print("z");
      face->setCursor(cx + 95, 0); face->setTextSize(2); face->print("z");
      break;
  }
  tft.drawRGBBitmap((320 - FACE_W) / 2, (240 - FACE_H) / 2, face->getBuffer(), FACE_W, FACE_H);
}

Face lastDrawn = (Face)-1; int lastLook = 99; bool lastBlink = false;
unsigned long nextBlink = 0, blinkEnd = 0;
void setFace(Face f, int look = 0) { faceNow = f; lookX = look; }
void updateFace() {
  unsigned long t = millis();
  if (!blinking && t > nextBlink) { blinking = true; blinkEnd = t + 140; }
  if (blinking && t > blinkEnd) { blinking = false; nextBlink = t + random(2500, 6000); }
  if (faceNow != lastDrawn || lookX != lastLook || blinking != lastBlink) {
    drawFace();
    lastDrawn = faceNow; lastLook = lookX; lastBlink = blinking;
  }
}

// =================== COMPORTAMENTO ===================
enum State { WANDER, AVOID_BACK, AVOID_TURN, PAUSE, GREET, CELEBRATE, LOWBAT };
State state = WANDER;
unsigned long stateSince = 0, stateDur = 0;
unsigned long nextPause = 0, nextCelebrate = 0;
int turnDir = 1;
float stuckRef = 0; unsigned long stuckSince = 0;

void go(State s, unsigned long dur = 0) { state = s; stateSince = millis(); stateDur = dur; }
bool elapsed() { return millis() - stateSince >= stateDur; }

void behave() {
  unsigned long t = millis();
  // vbat < 3 V = sem bateria ligada (só USB, bancada): ignora a proteção
  if (vbat > 3.0 && vbat < VBAT_LOW && state != LOWBAT) {
    setDrive(0, 0); armTo(ARM_DOWN); setFace(F_SLEEP); ledMode = LED_SLEEP; go(LOWBAT);
    Serial.printf("Bateria fraca: %.2f V\n", vbat);
  }
  switch (state) {
    case WANDER:
      setFace(F_HAPPY); ledMode = LED_BREATH; setDrive(CRUISE, CRUISE);
      if (distCm < OBST_CM) {
        setDrive(0, 0); setFace(F_IDEA); ledMode = LED_PULSE_ORANGE; go(AVOID_BACK, 450);
      } else if (t > nextPause) {
        setDrive(0, 0); setFace(F_FOCUS, 0); go(PAUSE, 3500);
      } else if (t > nextCelebrate) {
        setDrive(0, 0); go(CELEBRATE, 2600);
      }
      // travado? (a distância não muda enquanto anda contra algo baixo)
      if (fabs(distCm - stuckRef) > 4) { stuckRef = distCm; stuckSince = t; }
      else if (distCm < 150 && t - stuckSince > 6000) { stuckSince = t; go(AVOID_BACK, 700); }
      break;

    case AVOID_BACK:
      if (millis() - stateSince > 250) setDrive(-CRUISE, -CRUISE);
      if (elapsed()) {
        turnDir = random(2) ? 1 : -1;
        setFace(F_FOCUS, turnDir);
        setDrive(turnDir * TURN_SPEED, -turnDir * TURN_SPEED);
        go(AVOID_TURN, random(450, 900));
      }
      break;

    case AVOID_TURN:
      if (elapsed()) {
        if (distCm > CLEAR_CM) { setDrive(0, 0); go(WANDER); }
        else stateSince = millis();   // ainda bloqueado: continua girando
      }
      break;

    case PAUSE: {   // para e "olha em volta"
      unsigned long e = t - stateSince;
      setFace(F_FOCUS, e < 1200 ? -1 : (e < 2400 ? 1 : 0));
      if (distCm > GREET_MIN_CM && distCm < GREET_MAX_CM && e > 600) {
        go(GREET);
      } else if (elapsed()) {
        nextPause = t + random(12000, 25000);
        go(WANDER);
      }
      break;
    }

    case GREET:
      setDrive(0, 0); setFace(F_HAPPY); ledMode = LED_RAINBOW;
      updateLed(); updateFace();
      wave(3);
      armTo(ARM_DOWN);
      nextPause = t + random(15000, 30000);
      turnDir = random(2) ? 1 : -1;
      setDrive(turnDir * TURN_SPEED, -turnDir * TURN_SPEED);
      go(AVOID_TURN, random(700, 1200));
      break;

    case CELEBRATE:
      setFace(F_CELEBRATE); ledMode = LED_RAINBOW;
      // pequena dança: vira para um lado e para o outro
      if (t - stateSince < 600) setDrive(TURN_SPEED, -TURN_SPEED);
      else if (t - stateSince < 1200) setDrive(-TURN_SPEED, TURN_SPEED);
      else setDrive(0, 0);
      armTo((t / 200) % 2 ? ARM_UP : ARM_UP - WAVE_SPAN);
      if (elapsed()) { armTo(ARM_DOWN); nextCelebrate = t + random(30000, 60000); go(WANDER); }
      break;

    case LOWBAT:
      setDrive(0, 0);
      if (vbat > VBAT_LOW + 0.4) go(WANDER);   // trocou/recarregou a bateria
      break;
  }
}

// =================== SETUP / LOOP ===================
void setup() {
  Serial.begin(115200);
  pinMode(PIN_AIN1, OUTPUT); pinMode(PIN_AIN2, OUTPUT);
  pinMode(PIN_BIN1, OUTPUT); pinMode(PIN_BIN2, OUTPUT);
  pwmSetup(PIN_PWMA, CH_A); pwmSetup(PIN_PWMB, CH_B);
  stopMotors();

  pinMode(PIN_TRIG, OUTPUT); pinMode(PIN_ECHO, INPUT);
  analogSetPinAttenuation(PIN_VBAT, ADC_11db);

  led.begin(); led.setBrightness(180); led.show();

  ESP32PWM::allocateTimer(0);
  arm.setPeriodHertz(50);
  armTo(ARM_UP); delay(500); armTo(ARM_DOWN);

  tft.begin(40000000);
  tft.setRotation(TFT_ROTATION);
  tft.fillScreen(C_BG);
  face = new GFXcanvas16(FACE_W, FACE_H);
  if (!face || !face->getBuffer()) Serial.println("Sem memória para o canvas do rosto!");

  randomSeed(esp_random());
  for (int i = 0; i < 20; i++) { updateBattery(); delay(5); }
  vbat = analogReadMilliVolts(PIN_VBAT) / 1000.0f * VBAT_DIVIDER;

  // apresentação
  setFace(F_CELEBRATE); ledMode = LED_RAINBOW; updateFace(); updateLed();
  wave(2); armTo(ARM_DOWN);
  setFace(F_HAPPY);

  unsigned long t = millis();
  nextPause = t + 10000; nextCelebrate = t + 40000; nextBlink = t + 2000;
  go(WANDER);
  Serial.println("Nodo pronto!");
}

void loop() {
  static unsigned long lastSonar = 0, lastDrive = 0, lastBat = 0, lastLog = 0;
  unsigned long t = millis();
  if (t - lastSonar >= 60)  { lastSonar = t; updateSonar(); }
  if (t - lastBat >= 200)   { lastBat = t; updateBattery(); }
  behave();
  if (t - lastDrive >= 20)  { lastDrive = t; updateDrive(); }
  updateFace();
  updateLed();
  armRelax();
  if (t - lastLog >= 1000)  { lastLog = t; Serial.printf("estado=%d dist=%.0fcm vbat=%.2fV\n", state, distCm, vbat); }
}
