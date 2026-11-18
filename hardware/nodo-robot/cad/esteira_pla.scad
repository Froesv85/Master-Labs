// =====================================================================
//  NODO — esteira articulada em PLA (elos + pinos de filamento 1,75 mm)
//  Substitui track.stl (TPU) e as rodas dentadas sprocket_*.stl.
//  O chassi não muda: mesmo passo, mesmos 36 elos, mesma distância entre eixos.
//
//  part = "preview" | "link" | "link_plate" | "sprocket_drive" | "sprocket_idler" | "pin_jig"
// =====================================================================
part = "preview";
$fn = 48;

// ---------- compatível com nodo.scad ----------
RP  = 13;                 // raio do círculo dos pinos na roda
NS  = 10;                 // dentes da roda
P   = 2 * PI * RP / NS;   // passo = 8,168 mm
NL  = 36;                 // elos por esteira
TW  = 22;                 // largura da esteira
L   = (NL - NS) * P / 2;  // distância entre eixos (106,2 mm)

// ---------- elo ----------
PIN_D   = 1.75;           // filamento usado como pino
HOLE_D  = 1.95;           // furo (gira livre). Se ficar folgado: 1,85
KN_R    = 2.2;            // raio externo da dobradiça
T       = 2.6;            // espessura da placa (centrada no eixo do pino)
CLR     = 0.4;            // folga entre partes móveis
LUG_W   = 8;              // largura da garra interna (encaixa no centro da roda)
LUG_L   = 3.0;            // comprimento da garra (no sentido da esteira)
LUG_H   = 2.0;            // altura da garra
GR_H    = 1.2;            // altura da garra externa (aderência)

// segmentos da dobradiça ao longo da largura (x): A = pino da frente, B = pino de trás
A_SEG = [[-TW/2, -6.8], [-2.2, 2.2], [6.8, TW/2]];
B_SEG = [[-6.8 + CLR, -2.2 - CLR], [2.2 + CLR, 6.8 - CLR]];

// ---------- roda dentada para elos ----------
R_MID   = RP * cos(180 / NS) - T / 2;     // face interna do elo no meio (11,06)
R_KNIN  = RP - KN_R;                       // face interna da dobradiça (10,8)
R_RIM   = R_KNIN - 0.45;                   // aros laterais (guiam a garra)
R_HUB   = R_MID - LUG_H - 0.45;            // fundo do vão onde a garra entra
R_TIP   = R_KNIN - 0.45;                   // ponta do dente (passa sob a dobradiça central)

// =====================================================================
//  ELO   (x = largura, y = sentido da esteira, z = para fora; z<0 = lado da roda)
//        pinos em y = ±P/2, z = 0
// =====================================================================
module seg_x(a, b) { translate([a, 0, 0]) rotate([0, 90, 0]) children(); }

module link() {
  difference() {
    union() {
      // placa
      translate([-TW/2, -P/2, -T/2]) cube([TW, P, T]);
      // dobradiças
      for (s = A_SEG) translate([s[0], P/2, 0]) rotate([0, 90, 0]) cylinder(r = KN_R, h = s[1] - s[0]);
      for (s = B_SEG) translate([s[0], -P/2, 0]) rotate([0, 90, 0]) cylinder(r = KN_R, h = s[1] - s[0]);
      // garra interna (engrena na roda)
      hull() {
        translate([-LUG_W/2, -LUG_L/2, -T/2 - 0.01]) cube([LUG_W, LUG_L, 0.01]);
        translate([-LUG_W/2 + 0.3, -LUG_L/2 + 0.4, -T/2 - LUG_H]) cube([LUG_W - 0.6, LUG_L - 0.8, 0.01]);
      }
      // garra externa
      translate([-TW/2, -1, T/2 - 0.01]) cube([TW, 2, GR_H]);
    }
    // espaço para as dobradiças dos elos vizinhos
    for (s = B_SEG) translate([s[0] - CLR, P/2, 0]) rotate([0, 90, 0]) cylinder(r = KN_R + CLR, h = s[1] - s[0] + 2 * CLR);
    for (s = A_SEG) translate([s[0] - CLR, -P/2, 0]) rotate([0, 90, 0]) cylinder(r = KN_R + CLR, h = s[1] - s[0] + 2 * CLR);
    // furos dos pinos
    for (y = [-P/2, P/2]) translate([-TW/2 - 1, y, 0]) rotate([0, 90, 0]) cylinder(d = HOLE_D, h = TW + 2);
  }
}

// impressão: em pé (furo do pino na vertical = furo redondo e preciso)
module link_print() rotate([0, -90, 0]) translate([TW/2, 0, 0]) link();

// placa com 18 elos (meia esteira) para imprimir de uma vez
module link_plate(n = 18, cols = 6) {
  for (i = [0 : n - 1]) translate([(i % cols) * 12, floor(i / cols) * 15, 0]) link_print();
}

// =====================================================================
//  RODA DENTADA PARA ELOS
// =====================================================================
module tooth2d() {   // dente centrado no ângulo 0 (posição do pino)
  a1 = 9; a2 = 5;
  polygon([(R_HUB - 0.5) * [cos(-a1), sin(-a1)], R_TIP * [cos(-a2), sin(-a2)],
           R_TIP * [cos(a2), sin(a2)], (R_HUB - 0.5) * [cos(a1), sin(a1)]]);
}
module gear2d() { circle(r = R_HUB); for (i = [0 : NS - 1]) rotate(i * 360 / NS) tooth2d(); }

module sprocket(drive = true) {
  rimw = (TW - LUG_W - 2 * CLR) / 2;
  difference() {
    union() {
      cylinder(r = R_RIM, h = rimw);
      translate([0, 0, rimw - 0.01]) linear_extrude(LUG_W + 2 * CLR + 0.02) gear2d();
      translate([0, 0, TW - rimw]) cylinder(r = R_RIM, h = rimw);
      translate([0, 0, TW - 0.01]) cylinder(r = 9, h = 1.2);      // calota
    }
    if (drive) {
      translate([0, 0, -0.01]) linear_extrude(6.5) intersection() { circle(d = 3.05); translate([-0.25, 0]) square([3.1, 4], center = true); }
      translate([0, 0, 6]) cylinder(d = 1.6, h = 30);
    } else translate([0, 0, -1]) cylinder(d = 3.4, h = 30);
    translate([0, 0, TW + 0.6]) difference() { cylinder(r = 7.5, h = 2); cylinder(r = 6, h = 2); }
  }
}

// gabarito: corta os pinos todos no mesmo tamanho (TW + 1 mm)
module pin_jig() {
  difference() {
    cube([TW + 1 + 6, 12, 6]);
    translate([3, 6, 4]) rotate([0, 90, 0]) cylinder(d = 2.0, h = TW + 1);
    translate([3, 4.9, 4]) cube([TW + 1, 2.2, 3]);
  }
}

// =====================================================================
//  PREVIEW: esteira montada nas duas rodas (vista lateral)
// =====================================================================
// pinos ao longo do circuito (sentido anti-horário no plano y-z)
function pin_pos(i) =
  let(k = i % NL)
  k < 13 ? [-L/2 + k * P, -RP] :                                  // embaixo
  k < 18 ? [L/2 + RP * sin((k - 13) * 36), -RP * cos((k - 13) * 36)] :   // roda traseira
  k < 31 ? [L/2 - (k - 18) * P, RP] :                             // em cima
           [-L/2 - RP * sin((k - 31) * 36), RP * cos((k - 31) * 36)];   // roda dianteira

module chain() {
  for (i = [0 : NL - 1]) {
    a = pin_pos(i); b = pin_pos(i + 1);
    m = (a + b) / 2; ang = atan2(b[1] - a[1], b[0] - a[0]);
    // elo: y local = direção a->b ; z local = para fora (lado direito do sentido anti-horário)
    translate([0, m[0], m[1]]) rotate([ang, 0, 0]) rotate([180, 0, 0]) color(i % 2 ? "#333" : "#555") link();
  }
}
module preview() {
  chain();
  for (y = [-L/2, L/2]) color("orange") translate([-TW/2, y, 0]) rotate([0, 90, 0]) sprocket(y > 0);
}

if (part == "preview") preview();
else if (part == "link") link_print();
else if (part == "link_plate") link_plate();
else if (part == "sprocket_drive") sprocket(true);
else if (part == "sprocket_idler") sprocket(false);
else if (part == "pin_jig") pin_jig();
