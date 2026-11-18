/*
  NODO — firmware ESP32-S3 · etapa 1: controle pelo celular
  ---------------------------------------------------------
  Rede:
    1) tenta entrar na rede do notebook (Hotspot do Windows) "NodoNet";
    2) se não achar em 8 s, cria a própria rede "Nodo-MakerConnect".
    O endereço aparece na tela do robô. No celular, abra http://nodo.local ou o IP mostrado.

  Placa: ESP32S3 Dev Module · USB CDC On Boot conforme o conector · PSRAM: OPI PSRAM · Flash 16MB
  Bibliotecas: Adafruit GFX, Adafruit ILI9341, Adafruit NeoPixel, ESP32Servo,
               WebSockets (Markus Sattler / Links2004)
*/
#include <WiFi.h>
#include <WebServer.h>
#include <ESPmDNS.h>
#include <WebSocketsServer.h>
#include <SPI.h>
#include <Adafruit_GFX.h>
#include <Adafruit_ILI9341.h>
#include <Adafruit_NeoPixel.h>
#include <ESP32Servo.h>
#include "pagina.h"

// =================== REDE ===================
const char *NET_SSID = "NodoNet";             // Hotspot do notebook (etapa 4: servidor de conversa)
const char *NET_PASS = "makerconnect2026";
const char *AP_SSID  = "Nodo-MakerConnect";   // rede própria do robô (sem notebook)
const char *AP_PASS  = "maker2026";

// =================== PINOS (esquemático rev. A) ===================
const int PIN_PWMA = 4, PIN_AIN1 = 5, PIN_AIN2 = 6;
const int PIN_PWMB = 7, PIN_BIN1 = 15, PIN_BIN2 = 16, PIN_STBY = 17;
const int PIN_TRIG = 18, PIN_ECHO = 47;
const int PIN_SERVO = 2, PIN_LED = 48, PIN_VBAT = 1;
const int PIN_TFT_SCK = 12, PIN_TFT_MOSI = 11, PIN_TFT_CS = 10, PIN_TFT_DC = 9, PIN_TFT_RST = 8;

// =================== AJUSTES ===================
const bool  MOTOR_L_INVERT = false, MOTOR_R_INVERT = false;
const int   MAX_DUTY = 180;               // ≈6 V nos N20 com bateria cheia
const float OBST_CM = 25, CLEAR_CM = 40, MANUAL_STOP_CM = 15;
const int   ARM_DOWN = 40, ARM_UP = 150, WAVE_SPAN = 25;
const float VBAT_DIVIDER = (100.0 + 33.0) / 33.0, VBAT_LOW = 6.6;
const int   TFT_ROTATION = 1;
const uint32_t FAILSAFE_MS = 500;         // sem comando do celular por 0,5 s -> para

// =================== OBJETOS ===================
WebServer http(80);
WebSocketsServer ws(81);
Adafruit_ILI9341 tft(&SPI, PIN_TFT_DC, PIN_TFT_CS, PIN_TFT_RST);
GFXcanvas16 *face = nullptr;
Adafruit_NeoPixel led(1, PIN_LED, NEO_RGB + NEO_KHZ800);
Servo arm;

#define RGB565(r, g, b) ((((r) & 0xF8) << 8) | (((g) & 0xFC) << 3) | ((b) >> 3))
const uint16_t C_BG = RGB565(0x0f, 0x17, 0x2a), C_TEAL = RGB565(0x00, 0xC4, 0xB4), C_ORANGE = RGB565(0xFF, 0xA5, 0x00);

// =================== ESTADO ===================
bool autoMode = false;
int  speedPct = 60;
int  joyX = 0, joyY = 0;
uint32_t lastCmd = 0;
float distCm = 400, vbat = 0;
bool blocked = false;

// =================== MOTORES ===================
void motorOut(int in1, int in2, int pwm, int sp, bool inv) {
  if (inv) sp = -sp;
  sp = constrain(sp, -MAX_DUTY, MAX_DUTY);
  digitalWrite(in1, sp > 0); digitalWrite(in2, sp < 0);
  ledcWrite(pwm, abs(sp));
}
int curL = 0, curR = 0, tgtL = 0, tgtR = 0;
void setDrive(int l, int r) { tgtL = l; tgtR = r; }
void updateDrive() {   // rampa suave
  const int STEP = 14;
  curL += constrain(tgtL - curL, -STEP, STEP);
  curR += constrain(tgtR - curR, -STEP, STEP);
  motorOut(PIN_AIN1, PIN_AIN2, PIN_PWMA, curL, MOTOR_L_INVERT);
  motorOut(PIN_BIN1, PIN_BIN2, PIN_PWMB, curR, MOTOR_R_INVERT);
}
void stopNow() { tgtL = tgtR = curL = curR = 0; updateDrive(); }

// =================== SENSORES ===================
float readCm() {
  digitalWrite(PIN_TRIG, LOW); delayMicroseconds(3);
  digitalWrite(PIN_TRIG, HIGH); delayMicroseconds(10); digitalWrite(PIN_TRIG, LOW);
  unsigned long us = pulseIn(PIN_ECHO, HIGH, 15000UL);
  return us ? us / 58.0f : 400;
}
void updateSonar() {
  float a = readCm(), b = readCm(), c = readCm();
  distCm = max(min(a, b), min(max(a, b), c));   // mediana
}
void updateBattery() {
  float v = analogReadMilliVolts(PIN_VBAT) / 1000.0f * VBAT_DIVIDER;
  vbat = vbat < 1 ? v : vbat * 0.9f + v * 0.1f;
}

// =================== BRAÇO (não bloqueante) ===================
bool armOn = false, armNeedDown = false; uint32_t armIdle = 0;
int waveLeft = 0; uint32_t waveNext = 0; bool waveUp = true;
void armTo(int a) {
  if (!armOn) { arm.attach(PIN_SERVO, 500, 2400); armOn = true; }
  arm.write(a); armIdle = millis();
}
void startWave(int n) { waveLeft = n * 2; waveNext = millis(); armTo(ARM_UP); }
void updateArm() {
  uint32_t t = millis();
  if (waveLeft > 0 && t >= waveNext) {
    waveUp = !waveUp; armTo(waveUp ? ARM_UP : ARM_UP - WAVE_SPAN);
    waveLeft--; waveNext = t + 230;
    if (waveLeft == 0) { waveNext = t + 400; armNeedDown = true; }
  } else if (armNeedDown && t >= waveNext) {
    armTo(ARM_DOWN); armNeedDown = false;
  }
  // solta o servo parado: sem tremedeira e sem gastar bateria
  if (armOn && waveLeft == 0 && !armNeedDown && t - armIdle > 900) { arm.detach(); armOn = false; }
}

// =================== ANTENA ===================
enum LedMode { LED_BREATH, LED_ALERT, LED_PARTY, LED_SLEEP, LED_LINK };
LedMode ledMode = LED_LINK;
void updateLed() {
  uint32_t t = millis(); float s = (sin(t / 600.0f) + 1) / 2; uint32_t c = 0;
  switch (ledMode) {
    case LED_BREATH: c = led.Color(255 * (0.15 + 0.85 * s), 120 * (0.15 + 0.85 * s), 0); break;
    case LED_ALERT:  c = (t / 120) % 2 ? led.Color(255, 140, 0) : led.Color(40, 20, 0); break;
    case LED_PARTY:  c = led.ColorHSV((t * 40) & 0xFFFF, 255, 200); break;
    case LED_SLEEP:  c = led.Color(60 * s, 0, 0); break;
    case LED_LINK:   c = (t / 400) % 2 ? led.Color(0, 120, 110) : 0; break;
  }
  led.setPixelColor(0, led.gamma32(c)); led.show();
}

// =================== ROSTO ===================
enum Face { F_HAPPY, F_IDEA, F_PARTY, F_FOCUS, F_SLEEP, F_TALK };
Face faceNow = F_HAPPY; int lookX = 0; bool blinking = false;
const int FW = 280, FH = 150;
void thickArc(int cx, int cy, int rad, float a0, float a1, int r, uint16_t c) {
  for (float a = a0; a <= a1; a += 4) face->fillCircle(cx + rad * cos(a * DEG_TO_RAD), cy + rad * sin(a * DEG_TO_RAD), r, c);
}
void thickLine(int x0, int y0, int x1, int y1, int r, uint16_t c) {
  int n = max(abs(x1 - x0), abs(y1 - y0));
  for (int i = 0; i <= n; i += 2) face->fillCircle(x0 + (x1 - x0) * i / max(n, 1), y0 + (y1 - y0) * i / max(n, 1), r, c);
}
void drawFace() {
  if (!face || !face->getBuffer()) return;
  const int cx = FW / 2, ex = 70, ey = 62, dx = lookX * 18;
  face->fillScreen(C_BG);
  if (blinking && faceNow != F_SLEEP) {
    for (int s = -1; s <= 1; s += 2) thickLine(cx + s * ex - 26 + dx, ey, cx + s * ex + 26 + dx, ey, 5, C_TEAL);
  } else switch (faceNow) {
    case F_HAPPY:
      for (int s = -1; s <= 1; s += 2) thickArc(cx + s * ex, ey + 14, 28, 200, 340, 7, C_TEAL);
      thickArc(cx, 100, 22, 30, 150, 5, C_TEAL);
      face->fillCircle(cx - 118, 112, 8, C_ORANGE); face->fillCircle(cx + 118, 112, 8, C_ORANGE); break;
    case F_IDEA:
      for (int s = -1; s <= 1; s += 2) { face->fillCircle(cx + s * ex, ey, 30, C_TEAL); face->fillCircle(cx + s * ex + 9, ey - 10, 11, C_BG); }
      face->fillCircle(cx, 122, 13, C_TEAL); face->fillCircle(cx, 122, 6, C_BG); break;
    case F_PARTY:
      for (int s = -1; s <= 1; s += 2) {
        thickLine(cx + s * ex - 28, ey + 14, cx + s * ex, ey - 14, 7, C_TEAL);
        thickLine(cx + s * ex, ey - 14, cx + s * ex + 28, ey + 14, 7, C_TEAL);
      }
      face->fillCircle(cx, 100, 36, C_TEAL); face->fillRect(cx - 40, 60, 80, 40, C_BG); break;
    case F_FOCUS:
      for (int s = -1; s <= 1; s += 2) { face->fillCircle(cx + s * ex, ey, 27, C_TEAL); face->fillCircle(cx + s * ex + 12 * lookX + 2, ey + 10, 11, C_BG); }
      thickArc(cx, 104, 14, 40, 140, 4, C_TEAL); break;
    case F_SLEEP:
      for (int s = -1; s <= 1; s += 2) thickLine(cx + s * ex - 24, ey + 6, cx + s * ex + 24, ey + 6, 5, C_TEAL);
      face->setTextColor(C_ORANGE); face->setTextSize(3); face->setCursor(cx + 70, 6); face->print("z"); break;
    case F_TALK: {   // boca abrindo e fechando (etapa 2 vai seguir o volume do áudio)
      for (int s = -1; s <= 1; s += 2) thickArc(cx + s * ex, ey + 14, 28, 200, 340, 7, C_TEAL);
      int open = 6 + (millis() / 120) % 3 * 8;
      face->fillRoundRect(cx - 30, 100 - open / 2, 60, open + 6, 8, C_TEAL); break;
    }
  }
  tft.drawRGBBitmap((320 - FW) / 2, (240 - FH) / 2, face->getBuffer(), FW, FH);
}
Face drawnFace = (Face)-1; int drawnLook = 99; bool drawnBlink = false; uint32_t nextBlink = 0, blinkEnd = 0, talkFrame = 0;
void setFace(Face f, int look = 0) { faceNow = f; lookX = look; }
void updateFace() {
  uint32_t t = millis();
  if (!blinking && t > nextBlink) { blinking = true; blinkEnd = t + 140; }
  if (blinking && t > blinkEnd) { blinking = false; nextBlink = t + random(2500, 6000); }
  bool talkTick = faceNow == F_TALK && t - talkFrame > 120;
  if (faceNow != drawnFace || lookX != drawnLook || blinking != drawnBlink || talkTick) {
    drawFace(); drawnFace = faceNow; drawnLook = lookX; drawnBlink = blinking; talkFrame = t;
  }
}

// =================== COMPORTAMENTO AUTÔNOMO ===================
enum State { WANDER, BACK, TURN, PAUSE, GREET, PARTY, LOWBAT };
State st = WANDER; uint32_t stSince = 0, stDur = 0, nextPause = 0, nextParty = 0; int turnDir = 1;
bool stEnter = false;
void go(State s, uint32_t d = 0) { st = s; stSince = millis(); stDur = d; stEnter = true; }
bool done() { return millis() - stSince >= stDur; }
int cruise() { return MAX_DUTY * speedPct / 100; }

void behave() {
  uint32_t t = millis();
  switch (st) {
    case WANDER:
      setFace(F_HAPPY); ledMode = LED_BREATH; setDrive(cruise(), cruise());
      if (distCm < OBST_CM) { setDrive(0, 0); setFace(F_IDEA); ledMode = LED_ALERT; go(BACK, 450); }
      else if (t > nextPause) { setDrive(0, 0); go(PAUSE, 3500); }
      else if (t > nextParty) { setDrive(0, 0); go(PARTY, 2600); }
      break;
    case BACK:
      if (t - stSince > 250) setDrive(-cruise(), -cruise());
      if (done()) { turnDir = random(2) ? 1 : -1; setFace(F_FOCUS, turnDir); setDrive(turnDir * cruise(), -turnDir * cruise()); go(TURN, random(450, 900)); }
      break;
    case TURN:
      if (done()) { if (distCm > CLEAR_CM) { setDrive(0, 0); go(WANDER); } else stSince = t; }
      break;
    case PAUSE: {
      uint32_t e = t - stSince; setFace(F_FOCUS, e < 1200 ? -1 : (e < 2400 ? 1 : 0));
      if (distCm > 20 && distCm < 80 && e > 600) go(GREET, 2200);
      else if (done()) { nextPause = t + random(12000, 25000); go(WANDER); }
      break;
    }
    case GREET:
      if (stEnter) { stEnter = false; setFace(F_HAPPY); ledMode = LED_PARTY; startWave(3); }
      if (done()) { nextPause = t + random(15000, 30000); turnDir = random(2) ? 1 : -1;
                    setDrive(turnDir * cruise(), -turnDir * cruise()); go(TURN, random(700, 1200)); }
      break;
    case PARTY:
      setFace(F_PARTY); ledMode = LED_PARTY;
      if (t - stSince < 600) setDrive(cruise(), -cruise()); else if (t - stSince < 1200) setDrive(-cruise(), cruise()); else setDrive(0, 0);
      if (stEnter) { stEnter = false; startWave(2); }
      if (done()) { nextParty = t + random(30000, 60000); go(WANDER); }
      break;
    case LOWBAT: break;
  }
}

// =================== CONTROLE MANUAL ===================
void manualDrive() {
  if (millis() - lastCmd > FAILSAFE_MS) { setDrive(0, 0); return; }   // perdeu o celular: para
  int l = joyY + joyX * 7 / 10, r = joyY - joyX * 7 / 10;
  int m = max(100, max(abs(l), abs(r)));
  l = l * cruise() / m; r = r * cruise() / m;
  blocked = (l > 0 && r > 0 && distCm < MANUAL_STOP_CM);
  if (blocked) { l = r = 0; }
  setDrive(l, r);
}

// =================== WEBSOCKET ===================
void onWs(uint8_t num, WStype_t type, uint8_t *payload, size_t len) {
  if (type == WStype_CONNECTED) { setFace(F_HAPPY); ledMode = LED_BREATH; startWave(1); return; }
  if (type == WStype_DISCONNECTED) { if (!autoMode) setDrive(0, 0); return; }
  if (type != WStype_TEXT || len == 0) return;
  String s = String((const char *)payload).substring(0, len);
  char c = s[0];
  int a = 0, b = 0;
  int p1 = s.indexOf(','), p2 = s.indexOf(',', p1 + 1);
  if (p1 > 0) a = s.substring(p1 + 1, p2 > 0 ? p2 : s.length()).toInt();
  if (p2 > 0) b = s.substring(p2 + 1).toInt();
  lastCmd = millis();
  switch (c) {
    case 'J': joyX = constrain(a, -100, 100); joyY = constrain(b, -100, 100); break;
    case 'V': speedPct = constrain(a, 20, 100); break;
    case 'M': autoMode = a == 1; setDrive(0, 0); joyX = joyY = 0;
              if (autoMode) { nextPause = millis() + 10000; nextParty = millis() + 40000; go(WANDER); }
              else { setFace(F_HAPPY); ledMode = LED_BREATH; } break;
    case 'W': startWave(3); break;
    case 'C': setFace(F_PARTY); ledMode = LED_PARTY; startWave(2); break;
    case 'F': setFace((Face)constrain(a, 0, 5)); break;
    case 'X': autoMode = false; joyX = joyY = 0; stopNow(); setFace(F_IDEA); ledMode = LED_ALERT; break;
  }
}
void sendTelemetry() {
  char buf[96];
  snprintf(buf, sizeof(buf), "{\"v\":%.2f,\"d\":%.0f,\"m\":%d,\"b\":%d,\"s\":%d}", vbat, distCm, autoMode ? 1 : 0, blocked ? 1 : 0, speedPct);
  ws.broadcastTXT(buf);
}

// =================== TELA: endereço de conexão ===================
void showNetwork(const String &ssid, const String &pass, const String &ip, bool own) {
  tft.fillScreen(C_BG);
  tft.setTextColor(C_ORANGE); tft.setTextSize(3); tft.setCursor(16, 16); tft.print("Nodo");
  tft.setTextColor(ILI9341_WHITE); tft.setTextSize(2);
  tft.setCursor(16, 64);  tft.print(own ? "Rede do robo:" : "Na rede:");
  tft.setTextColor(C_TEAL); tft.setCursor(16, 88); tft.print(ssid);
  if (own) { tft.setTextColor(ILI9341_WHITE); tft.setCursor(16, 116); tft.print("Senha: "); tft.print(pass); }
  tft.setTextColor(ILI9341_WHITE); tft.setCursor(16, 156); tft.print("Abra no celular:");
  tft.setTextColor(C_ORANGE); tft.setCursor(16, 180); tft.print("http://"); tft.print(ip);
  tft.setTextColor(0x8C71); tft.setTextSize(1); tft.setCursor(16, 212); tft.print("ou http://nodo.local");
}

void startNetwork() {
  tft.fillScreen(C_BG); tft.setTextColor(ILI9341_WHITE); tft.setTextSize(2);
  tft.setCursor(16, 100); tft.print("Procurando "); tft.print(NET_SSID); tft.print("...");
  WiFi.mode(WIFI_STA);
  WiFi.begin(NET_SSID, NET_PASS);
  uint32_t t0 = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - t0 < 8000) { updateLed(); delay(100); }
  if (WiFi.status() == WL_CONNECTED) {
    WiFi.setSleep(false);
    Serial.printf("Conectado em %s, IP %s\n", NET_SSID, WiFi.localIP().toString().c_str());
    showNetwork(NET_SSID, "", WiFi.localIP().toString(), false);
  } else {
    WiFi.disconnect(true); WiFi.mode(WIFI_AP);
    WiFi.softAP(AP_SSID, AP_PASS);
    Serial.printf("Rede propria %s, IP %s\n", AP_SSID, WiFi.softAPIP().toString().c_str());
    showNetwork(AP_SSID, AP_PASS, WiFi.softAPIP().toString(), true);
  }
  MDNS.begin("nodo");
  http.on("/", []() { http.send_P(200, "text/html", PAGE_HTML); });
  http.onNotFound([]() { http.sendHeader("Location", "/"); http.send(302); });
  http.begin();
  ws.begin(); ws.onEvent(onWs);
  MDNS.addService("http", "tcp", 80);
}

// =================== SETUP / LOOP ===================
void setup() {
  Serial.begin(115200);
  pinMode(PIN_STBY, OUTPUT); digitalWrite(PIN_STBY, LOW);   // motores travados até tudo iniciar
  pinMode(PIN_AIN1, OUTPUT); pinMode(PIN_AIN2, OUTPUT); pinMode(PIN_BIN1, OUTPUT); pinMode(PIN_BIN2, OUTPUT);
  ledcAttach(PIN_PWMA, 20000, 8); ledcAttach(PIN_PWMB, 20000, 8);
  stopNow();
  pinMode(PIN_TRIG, OUTPUT); pinMode(PIN_ECHO, INPUT);
  analogSetPinAttenuation(PIN_VBAT, ADC_11db);
  led.begin(); led.setBrightness(180);
  ESP32PWM::allocateTimer(0); arm.setPeriodHertz(50);

  SPI.begin(PIN_TFT_SCK, -1, PIN_TFT_MOSI, -1);
  tft.begin(40000000); tft.setRotation(TFT_ROTATION);
  face = new GFXcanvas16(FW, FH);

  startNetwork();
  delay(3500);                       // tempo para ler o endereço na tela
  tft.fillScreen(C_BG);
  randomSeed(esp_random());
  nextBlink = millis() + 2000;
  digitalWrite(PIN_STBY, HIGH);      // libera os motores
  setFace(F_HAPPY); ledMode = LED_BREATH;
  Serial.println("Nodo pronto!");
}

void loop() {
  static uint32_t tSonar = 0, tDrive = 0, tBat = 0, tTel = 0;
  uint32_t t = millis();
  http.handleClient();
  ws.loop();
  if (t - tSonar >= 70) { tSonar = t; updateSonar(); }
  if (t - tBat >= 250)  { tBat = t; updateBattery(); }

  if (vbat > 3.0 && vbat < VBAT_LOW) {           // bateria fraca: para tudo
    if (st != LOWBAT) { go(LOWBAT); autoMode = false; }
    setDrive(0, 0); setFace(F_SLEEP); ledMode = LED_SLEEP;
  } else {
    if (st == LOWBAT && vbat > VBAT_LOW + 0.4) go(WANDER);
    if (autoMode) behave(); else manualDrive();
  }
  if (t - tDrive >= 20) { tDrive = t; updateDrive(); }
  if (t - tTel >= 400)  { tTel = t; sendTelemetry(); }
  updateArm();
  updateFace();
  updateLed();
}
