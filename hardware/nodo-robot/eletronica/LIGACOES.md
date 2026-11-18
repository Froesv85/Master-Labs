# Nodo — ligações elétricas (rev. A, ESP32-S3 + áudio)

O desenho está em `esquematico_nodo.pdf` (também em `.svg` e `.png`). Ele é gerado por `esquematico_nodo.py`; para mudar algo, edite o script e rode `python3 esquematico_nodo.py`, com `schemdraw` e `matplotlib` instalados.

Para ler o esquemático: **rótulos com o mesmo nome estão ligados entre si**. Os rótulos vermelhos são alimentação (+5V, +3V3, VBAT). Um **X** marca um pino que fica sem ligação.

---

## 1. Mapa de pinos do ESP32-S3-DevKitC-1 (N16R8)

| GPIO | Rede | Vai para |
|---|---|---|
| 1 | VBAT_ADC | divisor R1/R2 (leitura da bateria, ADC1) |
| 2 | SERVO | sinal do servo do braço |
| 4 / 5 / 6 | PWMA / AIN1 / AIN2 | TB6612, esteira esquerda |
| 7 / 15 / 16 | PWMB / BIN1 / BIN2 | TB6612, esteira direita |
| 17 | MOT_STBY | TB6612 STBY, com R3 10k para GND (motores desligados no boot) |
| 18 | US_TRIG | HC-SR04 TRIG |
| 47 | US_ECHO_3V3 | HC-SR04 ECHO pelo divisor R4/R5 |
| 48 | LED_DIN | R6 330 Ω → LED da antena |
| 8 / 9 / 10 | TFT_RST / TFT_DC / TFT_CS | tela |
| 11 / 12 | TFT_MOSI / TFT_SCK | tela (barramento SPI2/FSPI) |
| 13 / 14 / 21 | MIC_SCK / MIC_WS / MIC_SD | microfone INMP441 (I2S1) |
| 39 | AMP_SD | MAX98357A SD (alto = liga; baixo = mudo, economiza bateria) |
| 40 / 41 / 42 | AMP_BCLK / AMP_LRC / AMP_DIN | amplificador MAX98357A (I2S0) |

**Pinos que ficam livres de propósito**:
- **26–32:** ligados à memória flash.
- **33–37:** ligados à PSRAM octal da versão N16R8.
- **0, 3, 45 e 46:** definem o modo de boot.
- **19 e 20:** USB nativo.
- **43 e 44:** log serial.
- **38:** LED RGB da placa na versão v1.1.

> Na DevKitC-1 v1.0, o LED RGB da placa está no GPIO48. Ele vai piscar igual à antena, o que não causa problema.
> Se a sua placa for a **N16R8V** (PSRAM de 1,8 V), os GPIO 47 e 48 trabalham em 1,8 V. Nesse caso, troque ECHO e LED para os GPIO 38 e 3.

---

## 2. Alimentação

```
BT1+BT2 (2S 18650) ─ BMS 2S ─ P+ ─ F1 PTC 3 A ─ SW1 ─┬─ VBAT (6,0–8,4 V) ─┬─ TB6612 VM (motores)
                                                      │                    └─ R1/R2 → GPIO1
                                                      └─ Buck (5,4 V) ─ D1 SS34 ─ +5V ─┬─ ESP32-S3 5V
                                                                                        ├─ servo (+C6 470 µF)
                                                                                        ├─ MAX98357A VIN
                                                                                        ├─ TFT VCC
                                                                                        ├─ HC-SR04 VCC
                                                                                        └─ D2 1N4148 → LED (≈4,3 V)
 ESP32-S3 3V3 (regulador da placa) ─┬─ TB6612 VCC   ├─ INMP441 VDD   └─ TFT LED (luz de fundo)
```

**Consumo estimado nos picos (+5V)**

| Carga | Corrente |
|---|---|
| ESP32-S3 com Wi-Fi | até 0,5 A |
| Servo (travado / MG90S) | 0,7–1,2 A |
| MAX98357A em volume máximo (4 Ω) | até 0,8 A |
| Tela, sensor e LED | ~0,2 A |
| **Total no pior caso** | **~2,7 A** |

Por isso o buck precisa de **3 A reais**. Um LM2596 barato aguenta só uns 2 A contínuos. Prefira um MP1584 de qualidade ou um **XL4015 (5 A)**. Outra saída é limitar o volume no firmware ou usar um alto-falante de 8 Ω, que puxa cerca de metade da corrente.

**Ajuste o buck para 5,4 V com o multímetro antes de ligar qualquer coisa.** O diodo D1 derruba uns 0,4 V, então o barramento +5V fica em cerca de 5,0 V.

**USB e bateria**: o D1 impede que o 5 V do USB volte para o buck. Mas, com o robô desligado (SW1 aberta) e o USB conectado, o USB alimenta tudo o que está no +5V, servo e amplificador inclusive. Para programar, tanto faz ligar a SW1 ou não, mas não rode o aceno nem som alto só com o USB.

---

## 3. Áudio

- **Microfone INMP441**: alimente **somente em 3,3 V** (o máximo é 3,6 V). O pino L/R vai no GND, então o microfone fica no canal esquerdo. Faça um furo de ~3 mm na face, alinhado com o furo do sensor da placa, e vede ao redor com espuma ou cola quente. Assim ele não capta o ruído dos motores pelo lado de dentro.
- **Amplificador MAX98357A**:
  - GAIN aberto dá 9 dB de ganho. Ligar GAIN no GND dá 12 dB, e no VIN dá 6 dB.
  - SD em nível alto liga o amplificador e toca o canal esquerdo. Mande o áudio em mono no canal esquerdo, ou em estéreo com o mesmo som nos dois canais.
  - **A saída é em ponte (BTL)**: OUT+ e OUT− vão direto no alto-falante, e **nenhum dos dois é GND**. Não ligue a saída em outro amplificador nem num fone.
- **Alto-falante**: 4 Ω, 3 W, de 40 mm (ou 8 Ω, 2 W). Monte-o na tampa traseira, com furos na frente do cone.
- **Ruído**: passe os fios do alto-falante e dos motores trançados e longe dos fios do microfone. No firmware, silencie o microfone enquanto o robô fala (para não captar a própria voz).

---

## 4. Componentes novos ou alterados (em relação à lista anterior)

| Qtd | Componente | Ref. | Observação |
|---|---|---|---|
| 1 | **ESP32-S3-DevKitC-1 N16R8** | U3 | substitui o ESP32 DevKit V1 |
| 1 | **Microfone I2S INMP441** (módulo) | U6 | |
| 1 | **Amplificador I2S MAX98357A** (módulo) | U7 | |
| 1 | **Alto-falante 4 Ω 3 W Ø40 mm** | LS1 | ou 8 Ω 2 W |
| 1 | Fusível PTC 3 A (rearmável) | F1 | entre o BMS e a chave |
| 1 | Diodo Schottky SS34 (ou 1N5822) | D1 | saída do buck |
| 1 | Resistor 10 kΩ | R3 | STBY do TB6612 para GND |
| 1 | Capacitor 100 µF 16 V | C1 | em VBAT |
| 1 | Capacitor 10 µF + 100 nF | C4/C5 | junto ao VM do TB6612 |
| 3 | Capacitor cerâmico 100 nF | C3, C7, motores | divisor, LED e um em cada motor (C3 já existia) |
| 1 | Conector JST-XH 3 pinos | J1 | carga / balanceamento |
| 1 | Buck 5 V ≥ 3 A (XL4015 recomendado) | U2 | substitui o LM2596 |

O restante não muda: TB6612FNG, motores N20, TFT 2,8" ILI9341, HC-SR04, servo, LED PL9823, 2× 18650, BMS 2S, chave KCD11 e resistores.

---

## 5. Firmware

Os pinos mudaram em relação ao ESP32 clássico. O `nodo.ino` precisa ser atualizado com o mapa da seção 1 e com as bibliotecas de áudio I2S (`ESP_I2S.h` do core 3.x).
