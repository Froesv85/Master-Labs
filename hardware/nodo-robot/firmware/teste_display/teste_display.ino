/*
  NODO — TESTE DA TELA TFT 2,8" ILI9341 no ESP32-S3-DevKitC-1

  Ligações (iguais ao esquemático):
    TFT VCC   -> 5V          TFT GND  -> GND
    TFT CS    -> GPIO10      TFT RESET-> GPIO8
    TFT DC    -> GPIO9       TFT SDI  -> GPIO11 (MOSI)
    TFT SCK   -> GPIO12      TFT LED  -> 3V3
    TFT SDO, T_CLK, T_CS, T_DIN, T_DO, T_IRQ -> não ligar

  Bibliotecas: Adafruit GFX Library, Adafruit ILI9341
  Placa na Arduino IDE: "ESP32S3 Dev Module"
    - USB CDC On Boot: Enabled (para ver o Monitor Serial pela porta USB nativa)
    - PSRAM: OPI PSRAM (versão N16R8)

  Monitor Serial a 115200. Comandos (digite e Enter):
    1 cores   2 orientação   3 borda/medida   4 texto   5 velocidade   6 rosto do Nodo
    r  gira a tela (0..3)    a  modo automático (repete tudo)   +/-  muda a velocidade do SPI
*/
#include <SPI.h>
#include <Adafruit_GFX.h>
#include <Adafruit_ILI9341.h>

// ---------------- pinos ----------------
const int PIN_SCK = 12, PIN_MOSI = 11, PIN_CS = 10, PIN_DC = 9, PIN_RST = 8;

// ---------------- ajustes ----------------
uint32_t spiHz = 40000000;   // se a imagem vier com chuvisco, reduza para 20 MHz (tecla -)
uint8_t rotation = 1;        // 1 ou 3 = paisagem (o Nodo usa paisagem)

Adafruit_ILI9341 tft(&SPI, PIN_DC, PIN_CS, PIN_RST);

// cores da marca
#define RGB565(r, g, b) ((((r) & 0xF8) << 8) | (((g) & 0xFC) << 3) | ((b) >> 3))
const uint16_t C_BG = RGB565(0x0f, 0x17, 0x2a), C_TEAL = RGB565(0x00, 0xC4, 0xB4),
               C_ORANGE = RGB565(0xFF, 0xA5, 0x00), C_NAVY = RGB565(0x1A, 0x3A, 0x4D);

bool autoMode = true;

// ------------------------------------------------------------------
void title(const char *t) {
  tft.fillRect(0, 0, tft.width(), 22, C_NAVY);
  tft.setTextColor(ILI9341_WHITE); tft.setTextSize(2); tft.setCursor(6, 4); tft.print(t);
}

void waitOrSkip(uint32_t ms) {          // espera, mas sai se chegar comando no serial
  uint32_t t0 = millis();
  while (millis() - t0 < ms) { if (Serial.available()) return; delay(10); }
}

// 1) cores sólidas: pixels mortos e ordem RGB/BGR
void testColors() {
  Serial.println("[1] Cores: VERMELHO, VERDE, AZUL, BRANCO, PRETO. Se vermelho sair azul, a tela é BGR.");
  struct { uint16_t c; const char *n; } cs[] = {
    {ILI9341_RED, "VERMELHO"}, {ILI9341_GREEN, "VERDE"}, {ILI9341_BLUE, "AZUL"},
    {ILI9341_WHITE, "BRANCO"}, {ILI9341_BLACK, "PRETO"}};
  for (auto &x : cs) {
    tft.fillScreen(x.c);
    tft.setTextSize(3);
    tft.setTextColor(x.c == ILI9341_WHITE ? ILI9341_BLACK : ILI9341_WHITE);
    tft.setCursor(20, tft.height() / 2 - 12); tft.print(x.n);
    waitOrSkip(1200);
  }
  // degradê: mostra se há faixas ou falhas de bits
  for (int x = 0; x < tft.width(); x++) {
    uint8_t v = x * 255 / (tft.width() - 1);
    tft.drawFastVLine(x, 0, tft.height() / 3, RGB565(v, 0, 0));
    tft.drawFastVLine(x, tft.height() / 3, tft.height() / 3, RGB565(0, v, 0));
    tft.drawFastVLine(x, 2 * tft.height() / 3, tft.height() / 3 + 1, RGB565(0, 0, v));
  }
  waitOrSkip(2000);
}

// 2) orientação: em que lado fica o "topo"
void testOrientation() {
  Serial.printf("[2] Orientacao: rotacao atual = %d. A seta deve apontar para CIMA no robo montado.\n", rotation);
  tft.fillScreen(C_BG);
  title("Orientacao");
  int cx = tft.width() / 2, cy = tft.height() / 2 + 10;
  tft.fillTriangle(cx, cy - 60, cx - 40, cy - 10, cx + 40, cy - 10, C_ORANGE);
  tft.fillRect(cx - 14, cy - 10, 28, 60, C_ORANGE);
  tft.setTextColor(C_TEAL); tft.setTextSize(2);
  tft.setCursor(cx - 24, cy + 60); tft.print("TOPO");
  tft.setTextSize(1); tft.setTextColor(ILI9341_WHITE);
  tft.setCursor(4, tft.height() - 12); tft.printf("rotacao=%d  %dx%d  (tecla r gira)", rotation, tft.width(), tft.height());
  // cantos numerados
  tft.setTextSize(2);
  tft.setCursor(4, 28); tft.print("1");
  tft.setCursor(tft.width() - 16, 28); tft.print("2");
  tft.setCursor(tft.width() - 16, tft.height() - 32); tft.print("3");
  waitOrSkip(3500);
}

// 3) borda de 1 px + régua: mede a área visível pela janela do visor
void testBorder() {
  Serial.println("[3] Borda: confira se a linha de 1 px aparece nos 4 lados pela janela do visor.");
  tft.fillScreen(ILI9341_BLACK);
  tft.drawRect(0, 0, tft.width(), tft.height(), ILI9341_WHITE);
  tft.drawRect(2, 2, tft.width() - 4, tft.height() - 4, ILI9341_RED);
  for (int x = 0; x < tft.width(); x += 10) tft.drawFastVLine(x, tft.height() / 2 - (x % 50 ? 4 : 10), x % 50 ? 8 : 20, C_TEAL);
  for (int y = 0; y < tft.height(); y += 10) tft.drawFastHLine(tft.width() / 2 - (y % 50 ? 4 : 10), y, y % 50 ? 8 : 20, C_TEAL);
  tft.setTextColor(ILI9341_WHITE); tft.setTextSize(1);
  tft.setCursor(8, 8); tft.print("borda branca = pixel 0");
  tft.setCursor(8, 20); tft.print("traco a cada 10 px, longo a cada 50 px");
  tft.setCursor(8, tft.height() - 18); tft.printf("%d x %d px  (1 px = 0,18 mm)", tft.width(), tft.height());
  waitOrSkip(5000);
}

// 4) texto
void testText() {
  Serial.println("[4] Texto em varios tamanhos.");
  tft.fillScreen(C_BG);
  title("Nodo - MakerConnect");
  tft.setCursor(0, 32);
  for (int s = 1; s <= 4; s++) {
    tft.setTextSize(s); tft.setTextColor(s % 2 ? C_TEAL : C_ORANGE);
    tft.printf("Tamanho %d\n", s);
  }
  tft.setTextSize(1); tft.setTextColor(ILI9341_WHITE);
  tft.println("\nABCDEFGHIJKLMNOPQRSTUVWXYZ 0123456789 !?@#");
  waitOrSkip(3000);
}

// 5) velocidade: tela cheia e o "canvas" do rosto
void testSpeed() {
  Serial.printf("[5] Velocidade com SPI a %lu MHz...\n", (unsigned long)(spiHz / 1000000));
  tft.fillScreen(ILI9341_BLACK);
  uint32_t t0 = micros();
  for (int i = 0; i < 10; i++) tft.fillScreen(i % 2 ? ILI9341_BLUE : ILI9341_RED);
  float fillMs = (micros() - t0) / 10000.0f;

  GFXcanvas16 *cv = new GFXcanvas16(280, 150);
  float pushMs = -1;
  if (cv && cv->getBuffer()) {
    cv->fillScreen(C_BG); cv->fillCircle(140, 75, 50, C_TEAL);
    t0 = micros();
    for (int i = 0; i < 10; i++) tft.drawRGBBitmap(20, 45, cv->getBuffer(), 280, 150);
    pushMs = (micros() - t0) / 10000.0f;
  }
  delete cv;

  tft.fillScreen(C_BG); title("Velocidade");
  tft.setTextSize(2); tft.setTextColor(ILI9341_WHITE);
  tft.setCursor(8, 40);  tft.printf("SPI: %lu MHz", (unsigned long)(spiHz / 1000000));
  tft.setCursor(8, 70);  tft.printf("Tela cheia: %.1f ms", fillMs);
  tft.setCursor(8, 100); tft.printf("  = %.0f quadros/s", 1000.0f / fillMs);
  tft.setCursor(8, 130); tft.printf("Rosto 280x150: %.1f ms", pushMs);
  tft.setCursor(8, 160); tft.printf("  = %.0f quadros/s", pushMs > 0 ? 1000.0f / pushMs : 0);
  tft.setTextSize(1); tft.setCursor(8, 200);
  tft.print(pushMs > 0 && pushMs < 40 ? "OK: animacao do rosto vai ficar fluida" : "Lento: confira fios curtos e o SPI");
  Serial.printf("    tela cheia %.1f ms | rosto %.1f ms | heap livre %u | PSRAM %u\n",
                fillMs, pushMs, ESP.getFreeHeap(), ESP.getPsramSize());
  waitOrSkip(4000);
}

// 6) rosto do Nodo (as mesmas expressões do firmware)
GFXcanvas16 *face = nullptr;
void thickArc(int cx, int cy, int rad, float a0, float a1, int r, uint16_t c) {
  for (float a = a0; a <= a1; a += 4) face->fillCircle(cx + rad * cos(a * DEG_TO_RAD), cy + rad * sin(a * DEG_TO_RAD), r, c);
}
void thickLine(int x0, int y0, int x1, int y1, int r, uint16_t c) {
  int n = max(abs(x1 - x0), abs(y1 - y0));
  for (int i = 0; i <= n; i += 2) face->fillCircle(x0 + (x1 - x0) * i / max(n, 1), y0 + (y1 - y0) * i / max(n, 1), r, c);
}
void drawFace(int expr, int look, bool blink) {
  const int W = 280, cx = W / 2, ex = 70, ey = 62;
  int dx = look * 18;
  face->fillScreen(C_BG);
  if (blink) {
    for (int s = -1; s <= 1; s += 2) thickLine(cx + s * ex - 26 + dx, ey, cx + s * ex + 26 + dx, ey, 5, C_TEAL);
  } else if (expr == 0) {          // feliz
    for (int s = -1; s <= 1; s += 2) thickArc(cx + s * ex, ey + 14, 28, 200, 340, 7, C_TEAL);
    thickArc(cx, 100, 22, 30, 150, 5, C_TEAL);
    face->fillCircle(cx - 118, 112, 8, C_ORANGE); face->fillCircle(cx + 118, 112, 8, C_ORANGE);
  } else if (expr == 1) {          // ideia
    for (int s = -1; s <= 1; s += 2) { face->fillCircle(cx + s * ex, ey, 30, C_TEAL); face->fillCircle(cx + s * ex + 9, ey - 10, 11, C_BG); }
    face->fillCircle(cx, 122, 13, C_TEAL); face->fillCircle(cx, 122, 6, C_BG);
  } else if (expr == 2) {          // comemorando
    for (int s = -1; s <= 1; s += 2) {
      thickLine(cx + s * ex - 28, ey + 14, cx + s * ex, ey - 14, 7, C_TEAL);
      thickLine(cx + s * ex, ey - 14, cx + s * ex + 28, ey + 14, 7, C_TEAL);
    }
    face->fillCircle(cx, 100, 36, C_TEAL); face->fillRect(cx - 40, 60, 80, 40, C_BG);
  } else {                         // olhando
    for (int s = -1; s <= 1; s += 2) { face->fillCircle(cx + s * ex, ey, 27, C_TEAL); face->fillCircle(cx + s * ex + 12 * look + 2, ey + 10, 11, C_BG); }
    thickArc(cx, 104, 14, 40, 140, 4, C_TEAL);
  }
  tft.drawRGBBitmap((tft.width() - W) / 2, (tft.height() - 150) / 2, face->getBuffer(), W, 150);
}
void testFace() {
  Serial.println("[6] Rosto do Nodo: feliz, piscando, ideia, olhando para os lados, comemorando.");
  if (tft.width() < 280) { Serial.println("    use rotacao 1 ou 3 (paisagem) para o rosto"); return; }
  if (!face) face = new GFXcanvas16(280, 150);
  if (!face || !face->getBuffer()) { Serial.println("    sem memoria para o canvas!"); return; }
  tft.fillScreen(C_BG);
  const int seq[][3] = {{0,0,0},{0,0,1},{0,0,0},{1,0,0},{3,-1,0},{3,1,0},{3,0,0},{2,0,0},{0,0,0},{0,0,1},{0,0,0}};
  const int dur[] = {1200, 140, 900, 1200, 700, 700, 500, 1500, 800, 140, 1000};
  for (int i = 0; i < 11; i++) { drawFace(seq[i][0], seq[i][1], seq[i][2]); waitOrSkip(dur[i]); if (Serial.available()) return; }
}

// ------------------------------------------------------------------
void applySetup() {
  SPI.end();
  SPI.begin(PIN_SCK, -1, PIN_MOSI, -1);   // sem MISO: o GPIO13 fica livre para o microfone
  tft.begin(spiHz);
  tft.setRotation(rotation);
}

void setup() {
  Serial.begin(115200);
  uint32_t t0 = millis();
  while (!Serial && millis() - t0 < 2000) delay(10);
  Serial.println("\n=== Nodo - teste da tela ILI9341 ===");
  Serial.println("Comandos: 1 cores | 2 orientacao | 3 borda | 4 texto | 5 velocidade | 6 rosto | r girar | a auto | +/- SPI");
  applySetup();
}

void runTest(char c) {
  switch (c) {
    case '1': testColors(); break;
    case '2': testOrientation(); break;
    case '3': testBorder(); break;
    case '4': testText(); break;
    case '5': testSpeed(); break;
    case '6': testFace(); break;
  }
}

void loop() {
  if (Serial.available()) {
    char c = Serial.read();
    if (c == '\n' || c == '\r' || c == ' ') return;
    autoMode = false;
    if (c == 'a') { autoMode = true; Serial.println("modo automatico"); }
    else if (c == 'r') { rotation = (rotation + 1) % 4; tft.setRotation(rotation); Serial.printf("rotacao = %d\n", rotation); testOrientation(); }
    else if (c == '+') { spiHz = min<uint32_t>(spiHz * 2, 80000000); applySetup(); Serial.printf("SPI = %lu MHz\n", (unsigned long)(spiHz / 1000000)); testSpeed(); }
    else if (c == '-') { spiHz = max<uint32_t>(spiHz / 2, 5000000); applySetup(); Serial.printf("SPI = %lu MHz\n", (unsigned long)(spiHz / 1000000)); testSpeed(); }
    else runTest(c);
    return;
  }
  if (autoMode) for (char c = '1'; c <= '6' && autoMode && !Serial.available(); c++) runTest(c);
}
