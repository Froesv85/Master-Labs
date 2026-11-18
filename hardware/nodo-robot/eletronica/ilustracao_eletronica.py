"""Ilustração da montagem eletrônica do Nodo (estilo Fritzing) -> ilustracao_eletronica.svg/png"""
import math

W, H = 2400, 1560
out = []
def add(s): out.append(s)

C = dict(v5='#e11d48', v33='#f472b6', vbat='#f97316', gnd='#1f2937', spi='#2563eb',
         i2s='#7c3aed', ctl='#16a34a', mot='#0891b2', sig='#ca8a04', adc='#92400e')
FONT = "font-family='Inter,Segoe UI,Arial,sans-serif'"

def text(x, y, s, size=14, color='#1f2937', anchor='start', weight='normal', rot=0):
    tr = f" transform='rotate({rot} {x} {y})'" if rot else ''
    add(f"<text x='{x}' y='{y}' font-size='{size}' fill='{color}' text-anchor='{anchor}' font-weight='{weight}' {FONT}{tr}>{s}</text>")

def board(x, y, w, h, fill, title, sub=None, tcolor='white', r=10):
    add(f"<rect x='{x+4}' y='{y+6}' width='{w}' height='{h}' rx='{r}' fill='#000' opacity='0.18'/>")
    add(f"<rect x='{x}' y='{y}' width='{w}' height='{h}' rx='{r}' fill='{fill}' stroke='#0006' stroke-width='1.5'/>")
    for hx, hy in [(x+12, y+12), (x+w-12, y+12), (x+12, y+h-12), (x+w-12, y+h-12)]:
        if w > 120 and h > 90:
            add(f"<circle cx='{hx}' cy='{hy}' r='5' fill='#f5f5f4' stroke='#0004'/>")
    text(x + w/2, y - 12, title, 17, '#0f172a', 'middle', 'bold')
    if sub: text(x + w/2, y - 32 if False else y + h + 22, sub, 12.5, '#475569', 'middle')

def pin(x, y, label=None, side='r', color='#1f2937', size=11):
    add(f"<rect x='{x-5}' y='{y-5}' width='10' height='10' fill='#d4a017' stroke='#7a5c00' stroke-width='1'/>")
    add(f"<circle cx='{x}' cy='{y}' r='2.2' fill='#3b2f00'/>")
    if label:
        if side == 'r': text(x - 10, y + 4, label, size, color, 'end')
        elif side == 'l': text(x + 10, y + 4, label, size, color, 'start')
        elif side == 't': text(x, y + 20, label, size, color, 'middle')
        elif side == 'b': text(x, y - 11, label, size, color, 'middle')

wires = []
def wire(p, q, color, bend='h', k=0.5):
    wires.append((p, q, color, bend, k))

def draw_wires():
    for (x1, y1), (x2, y2), col, bend, k in wires:
        if bend == 'h':
            dx = (x2 - x1) * k
            d = f"M{x1},{y1} C{x1+dx},{y1} {x2-dx},{y2} {x2},{y2}"
        else:
            dy = (y2 - y1) * k
            d = f"M{x1},{y1} C{x1},{y1+dy} {x2},{y2-dy} {x2},{y2}"
        add(f"<path d='{d}' fill='none' stroke='#0003' stroke-width='6.5' stroke-linecap='round'/>")
        add(f"<path d='{d}' fill='none' stroke='{col}' stroke-width='4' stroke-linecap='round'/>")
        add(f"<circle cx='{x2}' cy='{y2}' r='3.5' fill='{col}'/><circle cx='{x1}' cy='{y1}' r='3.5' fill='{col}'/>")

# ------------------------------------------------------------- fundo e título
add(f"<svg xmlns='http://www.w3.org/2000/svg' width='{W}' height='{H}' viewBox='0 0 {W} {H}'>")
add(f"<rect width='{W}' height='{H}' fill='#f1f5f9'/>")
add("<defs><pattern id='g' width='24' height='24' patternUnits='userSpaceOnUse'><circle cx='2' cy='2' r='1.3' fill='#cbd5e1'/></pattern>"
    "<linearGradient id='cell' x1='0' x2='0' y1='0' y2='1'><stop offset='0' stop-color='#60a5fa'/><stop offset='1' stop-color='#1d4ed8'/></linearGradient>"
    "<radialGradient id='cone' cx='0.5' cy='0.5' r='0.5'><stop offset='0' stop-color='#6b7280'/><stop offset='0.55' stop-color='#1f2937'/><stop offset='1' stop-color='#111827'/></radialGradient>"
    "<linearGradient id='alu' x1='0' x2='1'><stop offset='0' stop-color='#9ca3af'/><stop offset='0.5' stop-color='#f3f4f6'/><stop offset='1' stop-color='#9ca3af'/></linearGradient></defs>")
add(f"<rect width='{W}' height='{H}' fill='url(#g)'/>")
text(60, 62, 'Nodo · montagem eletrônica', 34, '#1A3A4D', 'start', 'bold')
text(60, 92, 'ESP32-S3-DevKitC-1 · 2× 18650 (7,4 V) · motores N20 · tela 2,8" · microfone e alto-falante I2S · ilustração fora de escala', 16, '#475569')

# ------------------------------------------------------------- ESP32-S3
EX, EY, EW, EH = 1060, 250, 220, 840
board(EX, EY, EW, EH, '#111827', 'ESP32-S3-DevKitC-1 (N16R8)')
add(f"<rect x='{EX+55}' y='{EY+40}' width='110' height='150' rx='4' fill='url(#alu)' stroke='#6b7280'/>")
text(EX+110, EY+110, 'ESP32-S3', 15, '#374151', 'middle', 'bold'); text(EX+110, EY+130, 'WROOM-1', 12, '#4b5563', 'middle')
add(f"<rect x='{EX+75}' y='{EY+EH-50}' width='30' height='26' rx='3' fill='#9ca3af'/><rect x='{EX+120}' y='{EY+EH-50}' width='30' height='26' rx='3' fill='#9ca3af'/>")
text(EX+110, EY+EH-8, 'USB-C', 11, '#9ca3af', 'middle')
LP = ['3V3', '3V3', 'RST', '4', '5', '6', '7', '15', '16', '17', '18', '8', '3', '46', '9', '10', '11', '12', '13', '14', '5V', 'GND']
RP = ['GND', 'TX', 'RX', '1', '2', '42', '41', '40', '39', '38', '37', '36', '35', '0', '45', '48', '47', '21', '20', '19', 'GND', 'GND']
L, R = {}, {}
for i, (a, b) in enumerate(zip(LP, RP)):
    y = EY + 230 + i * 26
    pin(EX + 14, y); pin(EX + EW - 14, y)
    text(EX + 28, y + 4, a, 11, '#e5e7eb'); text(EX + EW - 28, y + 4, b, 11, '#e5e7eb', 'end')
    L.setdefault(a, (EX + 14, y)); R.setdefault(b, (EX + EW - 14, y))

# ------------------------------------------------------------- TELA
TX, TY = 120, 170
board(TX, TY, 420, 280, '#dc2626', 'U5 · Tela TFT 2,8" ILI9341', 'rosto do Nodo')
add(f"<rect x='{TX+30}' y='{TY+25}' width='300' height='230' rx='6' fill='#0f172a' stroke='#e5e7eb' stroke-width='3'/>")
cx, cy = TX + 180, TY + 135
for s in (-1, 1):
    add(f"<path d='M{cx+s*55-28},{cy-5} q28,-34 56,0' stroke='#00C4B4' stroke-width='12' fill='none' stroke-linecap='round'/>")
add(f"<path d='M{cx-26},{cy+40} q26,24 52,0' stroke='#00C4B4' stroke-width='8' fill='none' stroke-linecap='round'/>")
tft_p = ['VCC', 'GND', 'CS', 'RESET', 'DC', 'SDI', 'SCK', 'LED', 'SDO']
T = {}
for i, p in enumerate(tft_p):
    y = TY + 30 + i * 26; pin(TX + 400, y, p, 'r', 'white'); T[p] = (TX + 400, y)

# ------------------------------------------------------------- MICROFONE
MX, MY = 690, 150
board(MX, MY, 190, 150, '#1e3a8a', 'U6 · Microfone INMP441 (furo de som na face)', None, r=75)
add(f"<circle cx='{MX+95}' cy='{MY+60}' r='18' fill='url(#alu)' stroke='#6b7280'/><circle cx='{MX+95}' cy='{MY+60}' r='3' fill='#111'/>")
M = {}
for i, p in enumerate(['VDD', 'GND', 'L/R', 'SCK', 'WS', 'SD']):
    x = MX + 30 + i * 26; pin(x, MY + 125, None); text(x, MY + 108, p, 9.5, 'white', 'middle'); M[p] = (x, MY + 125)

# ------------------------------------------------------------- TB6612 + MOTORES
DX, DY = 590, 640
board(DX, DY, 230, 260, '#b91c1c', 'U4 · Driver TB6612FNG')
add(f"<rect x='{DX+80}' y='{DY+95}' width='70' height='70' fill='#111' rx='3'/>")
D = {}
for i, p in enumerate(['VM', 'VCC', 'GND', 'AO1', 'AO2', 'BO2', 'BO1', 'GND']):
    y = DY + 30 + i * 28; pin(DX + 16, y, p, 'l', 'white'); D['L' + p if p != 'GND' else f'LGND{i}'] = (DX + 16, y)
for i, p in enumerate(['PWMA', 'AIN2', 'AIN1', 'STBY', 'BIN1', 'BIN2', 'PWMB', 'GND']):
    y = DY + 30 + i * 28; pin(DX + 214, y, p, 'r', 'white'); D[p if p != 'GND' else 'RGND'] = (DX + 214, y)

def motor(x, y, name):
    add(f"<rect x='{x+4}' y='{y+6}' width='190' height='64' rx='10' fill='#000' opacity='0.15'/>")
    add(f"<rect x='{x}' y='{y}' width='120' height='64' rx='8' fill='url(#alu)' stroke='#6b7280'/>")
    add(f"<rect x='{x+120}' y='{y+6}' width='60' height='52' rx='4' fill='#d4a017' stroke='#7a5c00'/>")
    add(f"<rect x='{x+180}' y='{y+26}' width='26' height='12' fill='#9ca3af'/>")
    add(f"<rect x='{x-14}' y='{y+16}' width='14' height='10' fill='#d4a017'/><rect x='{x-14}' y='{y+38}' width='14' height='10' fill='#d4a017'/>")
    text(x + 90, y - 12, name, 15, '#0f172a', 'middle', 'bold')
    return (x - 10, y + 21), (x - 10, y + 43)
m1a, m1b = motor(250, 600, 'M1 · N20 esteira esq.')
m2a, m2b = motor(250, 830, 'M2 · N20 esteira dir.')

# ------------------------------------------------------------- AMPLIFICADOR + ALTO-FALANTE
AX, AY = 1500, 230
board(AX, AY, 200, 230, '#6d28d9', 'U7 · Amplificador MAX98357A')
add(f"<rect x='{AX+70}' y='{AY+80}' width='50' height='50' fill='#111' rx='3'/>")
A = {}
for i, p in enumerate(['LRC', 'BCLK', 'DIN', 'GAIN', 'SD', 'GND', 'VIN']):
    y = AY + 30 + i * 28; pin(AX + 16, y, p, 'l', 'white'); A[p] = (AX + 16, y)
for i, p in enumerate(['OUT+', 'OUT-']):
    y = AY + 90 + i * 40; pin(AX + 184, y, p, 'r', 'white'); A[p] = (AX + 184, y)
SX, SY = 1960, 330
add(f"<circle cx='{SX+5}' cy='{SY+8}' r='118' fill='#000' opacity='0.18'/>")
add(f"<circle cx='{SX}' cy='{SY}' r='118' fill='#374151' stroke='#111' stroke-width='3'/>")
add(f"<circle cx='{SX}' cy='{SY}' r='96' fill='url(#cone)'/><circle cx='{SX}' cy='{SY}' r='30' fill='#4b5563' stroke='#111'/>")
text(SX, SY - 135, 'LS1 · Alto-falante 4 Ω 3 W', 17, '#0f172a', 'middle', 'bold')
spk_p, spk_n = (SX - 120, SY - 20), (SX - 120, SY + 20)
add(f"<rect x='{SX-128}' y='{SY-28}' width='14' height='16' fill='#d4a017'/><rect x='{SX-128}' y='{SY+12}' width='14' height='16' fill='#d4a017'/>")
text(SX - 136, SY - 26, '+', 16, '#e11d48', 'end', 'bold'); text(SX - 136, SY + 38, '−', 16, '#111', 'end', 'bold')

# ------------------------------------------------------------- SERVO, LED, HC-SR04
VX, VY = 1520, 600
add(f"<rect x='{VX+4}' y='{VY+6}' width='200' height='110' rx='8' fill='#000' opacity='0.15'/>")
add(f"<rect x='{VX}' y='{VY+25}' width='200' height='60' rx='6' fill='#2563eb' stroke='#1e3a8a'/>")
add(f"<rect x='{VX+40}' y='{VY}' width='120' height='110' rx='8' fill='#3b82f6' stroke='#1e3a8a'/>")
add(f"<circle cx='{VX+75}' cy='{VY+40}' r='16' fill='#f8fafc'/><rect x='{VX+65}' y='{VY+5}' width='20' height='60' rx='10' fill='#f8fafc'/>")
text(VX + 100, VY - 14, 'M3 · Servo SG90 (braço)', 16, '#0f172a', 'middle', 'bold')
SV = {}
for i, (p, c) in enumerate([('SIG', '#f97316'), ('V+', '#dc2626'), ('GND', '#78350f')]):
    y = VY + 40 + i * 18
    add(f"<path d='M{VX},{y} L{VX-40},{y}' stroke='{c}' stroke-width='5'/>"); SV[p] = (VX - 40, y)
add(f"<rect x='{VX-58}' y='{VY+30}' width='20' height='56' rx='3' fill='#111'/>")
SV = {k: (VX - 50, v[1]) for k, v in SV.items()}

LX, LY = 1880, 610
add(f"<path d='M{LX},{LY+40} q0,-60 30,-60 q30,0 30,60 z' fill='#fde68a' stroke='#b45309' opacity='0.95'/>")
add(f"<circle cx='{LX+30}' cy='{LY}' r='42' fill='#FFA500' opacity='0.25'/>")
add(f"<rect x='{LX-2}' y='{LY+40}' width='64' height='8' rx='3' fill='#d6d3d1'/>")
LEDP = {}
for i, p in enumerate(['DIN', 'VDD', 'GND']):
    x = LX + 2 + i * 28; add(f"<line x1='{x}' y1='{LY+48}' x2='{x}' y2='{LY+92}' stroke='#9ca3af' stroke-width='3'/>"); LEDP[p] = (x, LY + 92)
    text(x, LY + 108, p, 11, '#334155', 'middle')
text(LX + 30, LY - 58, 'U9 · LED da antena PL9823', 16, '#0f172a', 'middle', 'bold')

UX, UY = 1500, 880
board(UX, UY, 380, 160, '#1d4ed8', 'U8 · Sensor ultrassônico HC-SR04', 'fica no peito do Nodo')
for dx in (90, 290):
    add(f"<circle cx='{UX+dx}' cy='{UY+70}' r='52' fill='url(#alu)' stroke='#6b7280' stroke-width='2'/>")
    add(f"<circle cx='{UX+dx}' cy='{UY+70}' r='38' fill='#d1d5db'/><circle cx='{UX+dx}' cy='{UY+70}' r='30' fill='#374151' opacity='0.7'/>")
U = {}
for i, p in enumerate(['VCC', 'TRIG', 'ECHO', 'GND']):
    x = UX + 145 + i * 30; pin(x, UY + 145, None); text(x, UY + 132, p, 9.5, 'white', 'middle'); U[p] = (x, UY + 145)

# placa de apoio: divisores
PX, PY = 1330, 1250
board(PX, PY, 300, 120, '#a3e635', 'Placa perfurada · resistores', None, r=6)
def resistor(x, y, lbl):
    add(f"<line x1='{x-30}' y1='{y}' x2='{x+30}' y2='{y}' stroke='#9ca3af' stroke-width='3'/>")
    add(f"<rect x='{x-16}' y='{y-7}' width='32' height='14' rx='6' fill='#e7c79a' stroke='#92400e'/>")
    for j, c in enumerate(['#92400e', '#111', '#dc2626']):
        add(f"<rect x='{x-10+j*7}' y='{y-7}' width='3' height='14' fill='{c}'/>")
    text(x, y - 12, lbl, 11, '#14532d', 'middle', 'bold')
resistor(PX + 70, PY + 45, 'R1 100k'); resistor(PX + 70, PY + 90, 'R2 33k')
resistor(PX + 200, PY + 45, 'R4 1k'); resistor(PX + 200, PY + 90, 'R5 2k')
text(PX + 70, PY + 115, 'bateria → GPIO1', 10.5, '#14532d', 'middle'); text(PX + 200, PY + 115, 'ECHO → GPIO47', 10.5, '#14532d', 'middle')
vdiv_in, vdiv_out = (PX + 40, PY + 45), (PX + 100, PY + 68)
echo_in, echo_out = (PX + 170, PY + 45), (PX + 230, PY + 68)
pin(*vdiv_in); pin(*vdiv_out); pin(*echo_in); pin(*echo_out)

# ------------------------------------------------------------- ENERGIA (embaixo)
RY = 1140   # barramentos
for i, (lbl, col) in enumerate([('VBAT 7,4 V', C['vbat']), ('+5V', C['v5']), ('GND', C['gnd'])]):
    y = RY + i * 16
    add(f"<line x1='120' y1='{y}' x2='1280' y2='{y}' stroke='{col}' stroke-width='7' stroke-linecap='round'/>")
    text(112, y + 5, lbl, 13, col, 'end', 'bold')
add(f"<rect x='110' y='{RY-14}' width='1180' height='60' rx='8' fill='none' stroke='#94a3b8' stroke-dasharray='6 5'/>")
text(700, RY + 66, 'barramentos de energia (fios grossos, 20–22 AWG)', 13, '#64748b', 'middle')
rail = lambda name, x: (x, RY + {'vbat': 0, 'v5': 16, 'gnd': 32}[name])

BX, BY = 140, 1260
add(f"<rect x='{BX+4}' y='{BY+6}' width='380' height='200' rx='10' fill='#000' opacity='0.15'/>")
add(f"<rect x='{BX}' y='{BY}' width='380' height='200' rx='10' fill='#1f2937'/>")
for k in range(2):
    y = BY + 25 + k * 90
    add(f"<rect x='{BX+20}' y='{y}' width='330' height='70' rx='34' fill='url(#cell)' stroke='#1e3a8a' stroke-width='2'/>")
    add(f"<rect x='{BX+350}' y='{y+22}' width='12' height='26' rx='3' fill='#d1d5db'/>")
    text(BX + 185, y + 42, 'Li-ion 18650  3,7 V', 16, 'white', 'middle', 'bold')
text(BX + 190, BY - 14, 'BT1 + BT2 · 2× 18650 em série', 17, '#0f172a', 'middle', 'bold')

GX, GY = 600, 1290
board(GX, GY, 150, 120, '#0f766e', 'U1 · BMS 2S', 'proteção')
FX = 800
add(f"<rect x='{FX}' y='{GY+40}' width='60' height='34' rx='6' fill='#facc15' stroke='#a16207'/>")
text(FX + 30, GY + 62, 'PTC', 12, '#713f12', 'middle', 'bold'); text(FX + 30, GY + 26, 'F1 3 A', 13, '#0f172a', 'middle', 'bold')
add(f"<rect x='{FX+90}' y='{GY+28}' width='50' height='60' rx='5' fill='#111'/><rect x='{FX+100}' y='{GY+36}' width='30' height='44' rx='3' fill='#dc2626'/>")
text(FX + 115, GY + 18, 'SW1', 13, '#0f172a', 'middle', 'bold')
KX, KY = 1020, 1270
board(KX, KY, 230, 150, '#1d4ed8', 'U2 · Buck 5 V (XL4015)', 'ajustar 5,4 V antes de ligar')
add(f"<rect x='{KX+30}' y='{KY+35}' width='70' height='70' rx='6' fill='#111'/><circle cx='{KX+65}' cy='{KY+70}' r='22' fill='#525252'/>")
add(f"<circle cx='{KX+160}' cy='{KY+70}' r='26' fill='#1f2937' stroke='#9ca3af' stroke-width='3'/>")
add(f"<rect x='{KX+110}' y='{KY+118}' width='70' height='14' rx='2' fill='#111'/><rect x='{KX+170}' y='{KY+118}' width='6' height='14' fill='#d1d5db'/>")
text(KX + 145, KY + 145, 'D1 SS34', 11, 'white', 'middle')

# fios de energia
wire((BX + 362, BY + 60), (GX + 10, GY + 40), C['vbat']); wire((BX + 362, BY + 150), (GX + 10, GY + 95), C['gnd'])
wire((BX + 20, BY + 100), (GX + 10, GY + 68), '#a3a3a3', 'h', 0.3)
wire((GX + 140, GY + 40), (FX, GY + 57), C['vbat']); wire((FX + 60, GY + 57), (FX + 90, GY + 58), C['vbat'])
wire((FX + 140, GY + 58), rail('vbat', FX + 160), C['vbat'], 'v')
wire((GX + 140, GY + 95), rail('gnd', GX + 175), C['gnd'], 'v')
wire(rail('vbat', KX + 20), (KX + 20, KY + 20), C['vbat'], 'v'); wire(rail('gnd', KX + 45), (KX + 45, KY + 20), C['gnd'], 'v')
wire((KX + 180, KY + 20), rail('v5', KX + 200), C['v5'], 'v')

# ESP alimentação
wire(L['5V'], rail('v5', EX - 40), C['v5'], 'v', 0.6)
wire(L['GND'], rail('gnd', EX - 15), C['gnd'], 'v', 0.6)

# 3V3 (rosa)
wire(L['3V3'], D['LVCC'], C['v33'], 'h')     # VCC do TB6612
wire(L['3V3'], M['VDD'], C['v33'], 'v')
wire(L['3V3'], T['LED'], C['v33'], 'h')

# TFT (azul)
for tp, ep in [('CS', '10'), ('RESET', '8'), ('DC', '9'), ('SDI', '11'), ('SCK', '12')]:
    wire(T[tp], L[ep], C['spi'])
wire(T['VCC'], rail('v5', TX + 470), C['v5'], 'v'); wire(T['GND'], rail('gnd', TX + 490), C['gnd'], 'v')

# Microfone (roxo)
wire(M['SCK'], L['13'], C['i2s'], 'v'); wire(M['WS'], L['14'], C['i2s'], 'v')
wire(M['SD'], R['21'], C['i2s'], 'v', 0.8)
wire(M['GND'], (MX + 56, MY + 175), C['gnd'], 'v'); wire(M['L/R'], (MX + 56, MY + 175), C['gnd'], 'v')
add(f"<path d='M{MX+46},{MY+175} h20 M{MX+50},{MY+181} h12 M{MX+54},{MY+187} h4' stroke='#1f2937' stroke-width='3'/>")

# TB6612 (verde) + motores (ciano)
for dp, ep in [('PWMA', '4'), ('AIN1', '5'), ('AIN2', '6'), ('PWMB', '7'), ('BIN1', '15'), ('BIN2', '16'), ('STBY', '17')]:
    wire(D[dp], L[ep], C['ctl'])
wire(D['LVM'], rail('vbat', DX - 30), C['vbat'], 'v'); wire(D['LGND2'], rail('gnd', DX - 55), C['gnd'], 'v')
wire(D['LAO1'], m1a, C['mot']); wire(D['LAO2'], m1b, C['mot'])
wire(D['LBO1'], m2a, C['mot']); wire(D['LBO2'], m2b, C['mot'])

# Amplificador (roxo) + alto-falante
for ap, ep in [('LRC', '41'), ('BCLK', '40'), ('DIN', '42'), ('SD', '39')]:
    wire(A[ap], R[ep], C['i2s'])
wire(A['OUT+'], spk_p, C['v5']); wire(A['OUT-'], spk_n, '#111827')
wire(A['VIN'], rail('v5', 1300), C['v5'], 'v', 0.7); wire(A['GND'], rail('gnd', 1320), C['gnd'], 'v', 0.7)

# Servo, LED, HC-SR04 (amarelo)
wire(SV['SIG'], R['2'], C['sig']); wire(SV['V+'], rail('v5', 1350), C['v5'], 'v', 0.7); wire(SV['GND'], rail('gnd', 1370), C['gnd'], 'v', 0.7)
wire(LEDP['DIN'], R['48'], C['sig'], 'v', 0.6)
wire(LEDP['VDD'], rail('v5', 1400), C['v5'], 'v', 0.5); wire(LEDP['GND'], rail('gnd', 1420), C['gnd'], 'v', 0.5)
wire(U['TRIG'], L['18'], C['sig'], 'v', 0.9)
wire(U['ECHO'], echo_in, C['sig'], 'v'); wire(echo_out, R['47'], C['sig'], 'h', 0.6)
wire(U['VCC'], rail('v5', 1440), C['v5'], 'v', 0.5); wire(U['GND'], rail('gnd', 1460), C['gnd'], 'v', 0.5)
wire(rail('vbat', 1280), vdiv_in, C['vbat'], 'v'); wire(vdiv_out, R['1'], C['adc'], 'h', 0.6)

# barramento estendido à direita (passa por baixo dos módulos da direita)
for i, col in enumerate([C['vbat'], C['v5'], C['gnd']]):
    y = RY + i * 16
    add(f"<line x1='1280' y1='{y}' x2='1480' y2='{y}' stroke='{col}' stroke-width='7' stroke-linecap='round'/>")

draw_wires()

# legenda
GX2, GY2 = 1700, 1150
add(f"<rect x='{GX2}' y='{GY2}' width='640' height='360' rx='14' fill='white' stroke='#cbd5e1'/>")
text(GX2 + 24, GY2 + 38, 'Cores dos fios', 20, '#0f172a', 'start', 'bold')
items = [('vbat', 'Bateria VBAT 7,4 V (motores, buck, leitura)'), ('v5', '+5 V (ESP32, tela, servo, áudio, sensor)'),
         ('v33', '+3,3 V da ESP32 (TB6612, microfone, luz da tela)'), ('gnd', 'GND — todos interligados'),
         ('spi', 'SPI da tela (GPIO 8–12)'), ('i2s', 'Áudio I2S (mic 13/14/21 · amp 39–42)'),
         ('ctl', 'Controle dos motores (4–7, 15–17)'), ('mot', 'Saída para os motores'), ('sig', 'Servo, LED e ultrassom (2, 48, 18/47)')]
for i, (k, s) in enumerate(items):
    y = GY2 + 72 + i * 31
    add(f"<line x1='{GX2+26}' y1='{y-5}' x2='{GX2+76}' y2='{y-5}' stroke='{C[k]}' stroke-width='6' stroke-linecap='round'/>")
    text(GX2 + 92, y, s, 15, '#334155')
text(W - 60, H - 24, 'Confira a serigrafia da sua placa: a ordem dos pinos segue a DevKitC-1 oficial. Esquema completo em esquematico_nodo.pdf',
     13, '#64748b', 'end')
add('</svg>')
open('ilustracao_eletronica.svg', 'w').write('\n'.join(out))
print('svg ok')
