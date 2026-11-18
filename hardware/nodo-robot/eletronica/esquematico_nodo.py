"""
Esquemático do NODO — ESP32-S3, áudio I2S (INMP441 + MAX98357A), bateria 2S 18650.
Gera esquematico_nodo.pdf / .svg / .png  (python3 esquematico_nodo.py)
Requer: pip install schemdraw matplotlib
"""
import schemdraw
import schemdraw.elements as elm

schemdraw.use('matplotlib')
NAVY, ORANGE, GREY = '#1A3A4D', '#E08A00', '#6b7280'
NET = '#0b5cad'   # cor dos rótulos de rede


# ---------------------------------------------------------------- helpers
def tag(d, pt, net, direction='left', length=0.5):
    """fio curto + rótulo de rede (net label)"""
    ln = elm.Line().at(pt).length(length)
    getattr(ln, direction)()
    d += ln
    if net == 'NC':
        d += elm.NoConnect().at(ln.end)
    else:
        col = '#b42318' if net in ('+5V', '+3V3', 'VBAT') else ('#111111' if net == 'GND' else NET)
        t = elm.Tag(height=0.45).at(ln.end).label(net, fontsize=7.5, color=col)
        getattr(t, direction)()
        d += t


def block(d, xy, ref, title, left=(), right=(), w=3.2, pitch=0.62, note=None):
    """CI/módulo como caixa com pinos e rótulos de rede"""
    n = max(len(left), len(right), 1)
    h = n * pitch + 0.4
    pins = []
    for i, (p, _) in enumerate(left):
        pins.append(elm.IcPin(name=p, side='L', slot=f'{n - i}/{n}', anchorname=f'L{i}'))
    for i, (p, _) in enumerate(right):
        pins.append(elm.IcPin(name=p, side='R', slot=f'{n - i}/{n}', anchorname=f'R{i}'))
    ic = elm.Ic(size=(w, h), pins=pins, pinspacing=pitch, edgepadW=0.25, edgepadH=0.2,
                plblsize=7.5, lblsize=8).at(xy).anchor('center').theta(0)
    ic.color(NAVY)
    d += ic
    d += elm.Label().theta(0).at((ic.absanchors['center'][0], ic.absanchors['center'][1] + h / 2 + 0.45)) \
        .label(f'{ref}  {title}', fontsize=9, color=NAVY, halign='center')
    if note:
        d += elm.Label().theta(0).at((ic.absanchors['center'][0], ic.absanchors['center'][1] - h / 2 - 0.35)) \
            .label(note, fontsize=6.8, color=GREY, halign='center')
    for i, (_, net) in enumerate(left):
        tag(d, ic.absanchors[f'L{i}'], net, 'left')
    for i, (_, net) in enumerate(right):
        tag(d, ic.absanchors[f'R{i}'], net, 'right')
    return ic


def section(d, x0, y0, x1, y1, title):
    d += elm.Rect(corner1=(x0, y0), corner2=(x1, y1), ls='--', lw=0.8).at((0, 0)).theta(0).color('#9aa7b2')
    d += elm.Label().theta(0).at((x0 + 0.25, y1 - 0.35)).label(title, fontsize=10.5, color=ORANGE, halign='left')


# ---------------------------------------------------------------- desenho
d = schemdraw.Drawing(show=False)
d.config(unit=1.6, fontsize=8, lw=1.1)

# moldura geral e título
W, H = 64, 40
d += elm.Rect(corner1=(0, 0), corner2=(W, H), lw=1.4).at((0, 0)).theta(0).color(NAVY)
d += elm.Label().theta(0).at((0.6, H - 0.9)).label('NODO — robô mascote MakerConnect · Esquemático elétrico',
                                           fontsize=15, color=NAVY, halign='left')
d += elm.Label().theta(0).at((0.6, H - 1.8)).label(
    'ESP32-S3-DevKitC-1 · 2× Li-ion 18650 (2S, 7,4 V) · áudio I2S: microfone INMP441 + amplificador MAX98357A · rev. A',
    fontsize=9, color=GREY, halign='left')

# ======================= 1. ALIMENTAÇÃO =======================
section(d, 0.5, 21.5, 24.5, 37.3, '1  ALIMENTAÇÃO 2S + 5 V')

# baterias em série
d += elm.Line().at((2.2, 33.5)).right(0.01)
bt2 = elm.Battery().at((2.6, 34.6)).down().length(1.8).label('BT2\n18650', loc='bot', fontsize=7.5).reverse()
d += bt2
bt1 = elm.Battery().at((2.6, 32.0)).down().length(1.8).label('BT1\n18650', loc='bot', fontsize=7.5).reverse()
d += bt1
d += elm.Line().at(bt2.end).to(bt1.start)
d += elm.Dot().at((2.6, (bt2.end[1] + bt1.start[1]) / 2))

bms = block(d, (9.4, 32.4), 'U1', 'BMS 2S (HX-2S-D20)',
            left=[('B+', 'BAT+'), ('BM', 'BAT_MID'), ('B-', 'BAT-')],
            right=[('P+', 'PACK+'), ('P-', 'GND')], w=2.6, note='proteção: sobrecarga, descarga, curto')
# ligar bateria aos rótulos
tag(d, bt2.start, 'BAT+', 'right', 0.6)
tag(d, ((bt2.end[0]), (bt2.end[1] + bt1.start[1]) / 2), 'BAT_MID', 'right', 0.6)
tag(d, bt1.end, 'BAT-', 'right', 0.6)

# PACK+ -> fusível -> chave -> VBAT
d += elm.Tag(height=0.45).at((12.6, 35.4)).left().label('PACK+', fontsize=7.5, color=NET)
f1 = elm.Fuse().at((12.6, 35.4)).right().length(2.2).label('F1\nPTC 3 A', fontsize=7.5)
d += f1
sw = elm.Switch().at(f1.end).right().length(2.2).label('SW1\nKCD11', fontsize=7.5)
d += sw
d += elm.Line().at(sw.end).right(0.8)
d += elm.Dot()
vb = d.here
d += elm.Vdd().at(vb).label('VBAT 6,0–8,4 V', fontsize=8, color=NET)
c1 = elm.Capacitor(polar=True).at(vb).down().length(1.6).label('C1\n100µ/16V', loc='bot', fontsize=7)
d += c1
d += elm.Ground().at(c1.end)

# conector de carga
block(d, (5.0, 25.2), 'J1', 'Carga / balanceamento', left=[('1', 'BAT-'), ('2', 'BAT_MID'), ('3', 'BAT+')],
      right=[], w=1.6, note='JST-XH 3p → carregador 2S\n(ou módulo USB-C 2S)')

# buck 5 V
buck = block(d, (14.6, 27.6), 'U2', 'Buck 5 V ≥ 3 A',
             left=[('VIN', 'VBAT'), ('GND', 'GND')], right=[('VOUT', '5V_BUCK'), ('GND', 'GND')],
             w=2.6, note='MP1584 / LM2596 (ideal: XL4015 5 A)\najustar 5,4 V ANTES de ligar (≈5,0 V após D1)')
d1 = elm.Schottky().at((21.0, 27.9)).right().length(1.8).label('D1 SS34', fontsize=7.5)
d += d1
d += elm.Tag(height=0.45).at(d1.start).left().label('5V_BUCK', fontsize=7.5, color=NET)
d += elm.Dot().at(d1.end)
d += elm.Vdd().at(d1.end).label('+5V', fontsize=8, color=NET)
c2 = elm.Capacitor(polar=True).at(d1.end).down().length(1.6).label('C2\n470µ/10V', loc='bot', fontsize=7)
d += c2
d += elm.Ground().at(c2.end)
d += elm.Label().theta(0).at((19.6, 24.3)).label('D1 evita que o 5 V do USB\nalimente o buck (e vice-versa)',
                                       fontsize=6.8, color=GREY, halign='left')

# divisor de tensão da bateria
r1 = elm.Resistor().at((21.2, 35.2)).down().length(1.6).label('R1\n100k', fontsize=7.5)
d += r1
d += elm.Vdd().at(r1.start).label('VBAT', fontsize=8, color=NET)
mid = r1.end
d += elm.Dot().at(mid)
r2 = elm.Resistor().at(mid).down().length(1.6).label('R2\n33k', fontsize=7.5)
d += r2
d += elm.Ground().at(r2.end)
l3 = elm.Line().at(mid).right(1.3)
d += l3
d += elm.Dot()
d += elm.Capacitor().at(l3.end).down().length(1.6).label('C3\n100n', loc='bot', fontsize=7)
d += elm.Ground()
tag(d, l3.end, 'VBAT_ADC', 'up', 0.5)
d += elm.Label().theta(0).at((19.0, 31.2)).label('8,4 V → 2,08 V', fontsize=6.8, color=GREY, halign='left')

# ======================= 2. MCU =======================
section(d, 25, 1.0, 39.0, 37.3, '2  MICROCONTROLADOR')
esp = block(d, (32.0, 19.6), 'U3', 'ESP32-S3-DevKitC-1 (N16R8)', w=5.4, pitch=0.78,
            left=[('5V', '+5V'), ('3V3', '+3V3'), ('GND', 'GND'),
                  ('GPIO1', 'VBAT_ADC'), ('GPIO2', 'SERVO'), ('GPIO4', 'PWMA'), ('GPIO5', 'AIN1'),
                  ('GPIO6', 'AIN2'), ('GPIO7', 'PWMB'), ('GPIO15', 'BIN1'), ('GPIO16', 'BIN2'),
                  ('GPIO17', 'MOT_STBY'), ('GPIO18', 'US_TRIG'), ('GPIO21', 'MIC_SD'),
                  ('GPIO47', 'US_ECHO_3V3'), ('GPIO48', 'LED_DIN'),
                  ('GPIO0 (BOOT)', 'NC'), ('GPIO3', 'NC'), ('GPIO45', 'NC'), ('GPIO46', 'NC')],
            right=[('GPIO8', 'TFT_RST'), ('GPIO9', 'TFT_DC'), ('GPIO10', 'TFT_CS'), ('GPIO11', 'TFT_MOSI'),
                   ('GPIO12', 'TFT_SCK'), ('GPIO13', 'MIC_SCK'), ('GPIO14', 'MIC_WS'),
                   ('GPIO39', 'AMP_SD'), ('GPIO40', 'AMP_BCLK'), ('GPIO41', 'AMP_LRC'), ('GPIO42', 'AMP_DIN'),
                   ('GPIO19 (USB D-)', 'NC'), ('GPIO20 (USB D+)', 'NC'),
                   ('GPIO43 (TX0)', 'NC'), ('GPIO44 (RX0)', 'NC'),
                   ('GPIO35–37', 'NC'), ('GPIO38', 'NC'), ('GND', 'GND')],
            note='Não usar: 26–32 (flash), 33–37 (PSRAM octal), 0/3/45/46 (boot), 19/20 (USB), 43/44 (log)\n'
                 'GPIO48 = LED RGB da placa (v1.0): pisca junto com a antena — sem problema')

# ======================= 3. MOTORES =======================
section(d, 39.5, 21.5, 63.5, 37.3, '3  TRAÇÃO (ESTEIRAS)')
tb = block(d, (47.2, 29.4), 'U4', 'TB6612FNG', w=3.0, pitch=0.68,
           left=[('VM', 'VBAT'), ('VCC', '+3V3'), ('GND', 'GND'), ('PWMA', 'PWMA'), ('AIN1', 'AIN1'),
                 ('AIN2', 'AIN2'), ('PWMB', 'PWMB'), ('BIN1', 'BIN1'), ('BIN2', 'BIN2'), ('STBY', 'MOT_STBY')],
           right=[('AO1', 'MA+'), ('AO2', 'MA-'), ('BO1', 'MB+'), ('BO2', 'MB-')],
           note='C4 10µ + C5 100n entre VM e GND, junto ao módulo')
r3 = elm.Resistor().at((42.0, 23.6)).down().length(1.4).label('R3 10k', fontsize=7.5)
d += r3
d += elm.Ground()
d += elm.Tag(height=0.45).at(r3.start).left().label('MOT_STBY', fontsize=7.5, color=NET)
d += elm.Label().theta(0).at((42.6, 22.6)).label('mantém motores\ndesligados no boot', fontsize=6.8, color=GREY, halign='left')
for i, (a, b, lbl) in enumerate([('MA+', 'MA-', 'M1  N20 6 V 1:150\nesteira esquerda'),
                                 ('MB+', 'MB-', 'M2  N20 6 V 1:150\nesteira direita')]):
    x = 55.0 + i * 4.6
    m = elm.Motor().at((x, 33.6)).down().length(2.4).label(lbl, loc='bot', fontsize=7)
    d += m
    tag(d, m.start, a, 'up', 0.4)
    tag(d, m.end, b, 'down', 0.4)
    cm = elm.Capacitor().at((x - 1.1, 33.6)).down().length(2.4).label('100n', loc='top', fontsize=6.8)
    d += elm.Line().at(m.start).left(1.1)
    d += cm
    d += elm.Line().at(cm.end).right(1.1)

# ======================= 4. TELA =======================
section(d, 39.5, 1.0, 50.8, 21.0, '4  ROSTO (TELA)')
block(d, (45.6, 11.4), 'U5', 'TFT 2,8" ILI9341 SPI', w=3.0, pitch=0.66,
      left=[('VCC', '+5V'), ('GND', 'GND'), ('CS', 'TFT_CS'), ('RESET', 'TFT_RST'), ('DC', 'TFT_DC'),
            ('SDI(MOSI)', 'TFT_MOSI'), ('SCK', 'TFT_SCK'), ('LED', '+3V3'), ('SDO(MISO)', 'NC')],
      right=[('T_CLK', 'NC'), ('T_CS', 'NC'), ('T_DIN', 'NC'), ('T_DO', 'NC'), ('T_IRQ', 'NC')],
      note='J1 da placa aberto (regulador 3,3 V ativo)\ntouch e SD não usados')

# ======================= 5. ÁUDIO =======================
section(d, 51.3, 1.0, 63.5, 21.0, '5  ÁUDIO I2S')
block(d, (56.6, 17.3), 'U6', 'Microfone INMP441', w=2.8, pitch=0.62,
      left=[('VDD', '+3V3'), ('GND', 'GND'), ('L/R', 'GND')],
      right=[('SCK', 'MIC_SCK'), ('WS', 'MIC_WS'), ('SD', 'MIC_SD')],
      note='canal esquerdo · 3,3 V (máx 3,6 V!)\nfuro de 3 mm na face para o som')
amp = block(d, (56.0, 8.2), 'U7', 'Amplificador MAX98357A', w=2.8, pitch=0.62,
            left=[('VIN', '+5V'), ('GND', 'GND'), ('SD', 'AMP_SD'), ('GAIN', 'NC'),
                  ('BCLK', 'AMP_BCLK'), ('LRC', 'AMP_LRC'), ('DIN', 'AMP_DIN')],
            right=[('OUT+', 'SPK+'), ('OUT-', 'SPK-')],
            note='GAIN aberto = 9 dB · SD alto = liga (canal esq.)\nSAÍDA EM PONTE: OUT- NÃO é GND!')
spk = elm.Speaker().at((61.3, 5.6)).right().label('LS1\n4 Ω 3 W Ø40 mm', loc='bot', fontsize=7)
d += spk
la = elm.Line().at(spk.absanchors['in1']).left(0.6); d += la
d += elm.Line().at(la.end).up(0.5); d += elm.Tag(height=0.45).left().label('SPK+', fontsize=7.5, color=NET)
lb = elm.Line().at(spk.absanchors['in2']).left(0.6); d += lb
d += elm.Line().at(lb.end).down(0.5); d += elm.Tag(height=0.45).left().label('SPK-', fontsize=7.5, color=NET)

# ======================= 6. SENSORES E ATUADORES =======================
section(d, 0.5, 1.0, 24.5, 21.0, '6  SENSOR, BRAÇO E ANTENA')
# HC-SR04
block(d, (5.0, 16.4), 'U8', 'Ultrassom HC-SR04', w=2.6, pitch=0.62,
      left=[('VCC', '+5V'), ('GND', 'GND')], right=[('TRIG', 'US_TRIG'), ('ECHO', 'US_ECHO_5V')],
      note='TRIG aceita 3,3 V')
r4 = elm.Resistor().at((12.6, 18.2)).right().length(1.8).label('R4 1k', fontsize=7.5)
d += r4
d += elm.Dot()
e_mid = d.here
d += elm.Tag(height=0.45).at(r4.start).left().label('US_ECHO_5V', fontsize=7.5, color=NET)
r5 = elm.Resistor().at(e_mid).down().length(1.6).label('R5 2k', fontsize=7.5)
d += r5
d += elm.Ground()
tag(d, e_mid, 'US_ECHO_3V3', 'right', 0.6)
d += elm.Label().theta(0).at((12.4, 15.6)).label('5 V → 3,3 V', fontsize=6.8, color=GREY, halign='left')

# servo
block(d, (6.0, 8.6), 'M3', 'Servo SG90 / MG90S', w=4.2, pitch=0.62,
      left=[('V+ (verm.)', '+5V'), ('GND (marr.)', 'GND')], right=[('SIG (lar.)', 'SERVO')],
      note='braço direito (aceno)')
c6 = elm.Capacitor(polar=True).at((3.2, 4.6)).down().length(1.5).label('C6 470µ/10V', loc='bot', fontsize=7)
d += c6
d += elm.Ground()
d += elm.Vdd().at(c6.start).label('+5V', fontsize=8, color=NET)
d += elm.Label().theta(0).at((5.6, 3.4)).label('C6 junto ao conector do servo', fontsize=6.8, color=GREY, halign='left')

# LED da antena
dl = elm.Diode().at((14.0, 11.4)).down().length(1.5).label('D2\n1N4148', fontsize=7.5)
d += dl
d += elm.Dot()
vled = d.here
d += elm.Vdd().at(dl.start).label('+5V', fontsize=8, color=NET)
d += elm.Label().theta(0).at((14.5, 10.0)).label('≈4,3 V', fontsize=6.8, color=GREY, halign='left')
led = block(d, (19.4, 7.4), 'U9', 'LED PL9823 F8 (antena)', w=2.6, pitch=0.62,
            left=[('VDD', 'LED_VDD'), ('DIN', 'LED_DATA'), ('GND', 'GND')], right=[('DOUT', 'NC')],
            note='VDD 4,3 V → aceita dado de 3,3 V')
tag(d, vled, 'LED_VDD', 'right', 0.5)
c7 = elm.Capacitor().at(vled).down().length(1.5).label('C7 100n', loc='bot', fontsize=7)
d += c7
d += elm.Ground()
r6 = elm.Resistor().at((12.6, 3.0)).right().length(1.8).label('R6 330', fontsize=7.5)
d += r6
d += elm.Tag(height=0.45).at(r6.start).left().label('LED_DIN', fontsize=7.5, color=NET)
tag(d, r6.end, 'LED_DATA', 'right', 0.4)

# notas
d += elm.Label().theta(0).at((25.4, 0.45)).label(
    'Todos os GND interligados em estrela no negativo do pack · Fios de motor e alto-falante trançados · '
    'Nomes iguais = mesma ligação', fontsize=7, color=GREY, halign='left')

for ext in ('svg', 'pdf', 'png'):
    d.save(f'esquematico_nodo.{ext}', dpi=200 if ext == 'png' else 72)
print('ok')
