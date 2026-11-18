/*
  NODO — DIAGNÓSTICO DA TELA BRANCA (ILI9341 + ESP32-S3)

  Tela branca = luz de fundo OK, mas a tela não recebe comandos.
  Este sketch testa em 3 etapas. Monitor Serial a 115200, digite a letra e Enter:

    p  TESTE DOS FIOS: liga um pino de cada vez por 3 s (CS, DC, RESET, MOSI, SCK).
       Meça com o multímetro NO PINO DA TELA (não no ESP32): deve dar ~3,3 V
       só no pino anunciado. Se não der, o fio está solto, trocado ou no furo errado.

    s  SPI POR SOFTWARE (mais lento, mas não depende da configuração do SPI do S3).
       Se aqui a tela mostrar cores e no teste_display não, o problema é de software.

    h  SPI POR HARDWARE a 10 MHz (mais devagar que os 40 MHz do teste anterior).

    v  ALTERNATIVA ST7789: algumas telas vendidas como ILI9341 usam outro controlador.
       Só mostra a orientação para o próximo passo (ver mensagem no Monitor).
*/
#include <SPI.h>
#include <Adafruit_GFX.h>
#include <Adafruit_ILI9341.h>

const int PIN_SCK = 12, PIN_MOSI = 11, PIN_CS = 10, PIN_DC = 9, PIN_RST = 8;

void colorCycle(Adafruit_ILI9341 &t, const char *modo) {
  t.setRotation(1);
  const uint16_t cs[] = {ILI9341_RED, ILI9341_GREEN, ILI9341_BLUE, ILI9341_BLACK};
  const char *nm[] = {"VERMELHO", "VERDE", "AZUL", "PRETO"};
  for (int i = 0; i < 4; i++) {
    Serial.printf("  %s: tela deve ficar %s\n", modo, nm[i]);
    t.fillScreen(cs[i]);
    delay(1200);
  }
  t.setTextColor(ILI9341_WHITE); t.setTextSize(3);
  t.setCursor(20, 100); t.print("FUNCIONOU!");
  Serial.println("  -> Se a tela trocou de cor, os fios estao certos!");
}

void pinTest() {
  struct { int pin; const char *nome; } ps[] = {
    {PIN_CS, "CS (GPIO10)"}, {PIN_DC, "DC (GPIO9)"}, {PIN_RST, "RESET (GPIO8)"},
    {PIN_MOSI, "SDI/MOSI (GPIO11)"}, {PIN_SCK, "SCK (GPIO12)"}};
  SPI.end();
  for (auto &p : ps) { pinMode(p.pin, OUTPUT); digitalWrite(p.pin, LOW); }
  Serial.println("\nTESTE DOS FIOS: multimetro em DC, ponta preta no GND.");
  for (auto &p : ps) {
    digitalWrite(p.pin, HIGH);
    Serial.printf("  AGORA: so o pino %s da TELA deve ter ~3,3 V (os outros ~0 V)\n", p.nome);
    delay(3000);
    digitalWrite(p.pin, LOW);
  }
  Serial.println("Fim do teste dos fios.\n");
}

void softSpi() {
  Serial.println("\nSPI POR SOFTWARE...");
  SPI.end();
  Adafruit_ILI9341 t(PIN_CS, PIN_DC, PIN_MOSI, PIN_SCK, PIN_RST);   // bit-bang
  t.begin();
  colorCycle(t, "software");
}

void hardSpi() {
  Serial.println("\nSPI POR HARDWARE a 10 MHz...");
  SPI.end();
  SPI.begin(PIN_SCK, -1, PIN_MOSI, PIN_CS);
  Adafruit_ILI9341 t(&SPI, PIN_DC, PIN_CS, PIN_RST);
  t.begin(10000000);
  colorCycle(t, "hardware");
}

void setup() {
  Serial.begin(115200);
  uint32_t t0 = millis();
  while (!Serial && millis() - t0 < 2000) delay(10);
  // reset manual da tela
  pinMode(PIN_RST, OUTPUT);
  digitalWrite(PIN_RST, HIGH); delay(10); digitalWrite(PIN_RST, LOW); delay(20); digitalWrite(PIN_RST, HIGH); delay(150);
  Serial.println("\n=== Diagnostico da tela ===");
  Serial.println("p = teste dos fios | s = SPI software | h = SPI hardware 10 MHz | v = info ST7789");
  softSpi();   // já roda o teste mais tolerante na partida
}

void loop() {
  if (!Serial.available()) return;
  char c = Serial.read();
  if (c == 'p') pinTest();
  else if (c == 's') softSpi();
  else if (c == 'h') hardSpi();
  else if (c == 'v') Serial.println(
      "\nSe nem o SPI por software funcionou e os fios mediram certo, a tela pode ser ST7789.\n"
      "Me avise que eu mando a versao com a biblioteca Adafruit ST7789.\n");
}
