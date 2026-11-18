// =====================================================================
//  NODO — esteira PRINT-IN-PLACE em PLA (sai da impressora já montada)
//  O laço de 36 elos é impresso em pé, como um anel de ~10 cm.
//  Cada dobradiça tem pino integrado com folga; os segmentos têm chanfro
//  de 45° para imprimir sem suporte.
//
//  part = "track_loop" | "test_strip" | "sprocket_drive" | "sprocket_idler" | "preview"
//  Use as rodas DESTE arquivo (a dobradiça é mais grossa que a da versão com pinos).
// =====================================================================
part = "preview";
$fn = 40;

// ---------- compatível com o chassi do nodo.scad ----------
RP = 13; NS = 10; P = 2 * PI * RP / NS;   // passo 8,168 mm
NL = 36; TW = 22; L = (NL - NS) * P / 2;  // 36 elos, entre eixos 106,2 mm

// ---------- elo ----------
KN_R  = 2.4;     // raio externo da dobradiça
PIN_R = 1.0;     // pino integrado (Ø 2,0 mm)
GAP   = 0.35;    // folga radial pino/furo  (aumente p/ 0,4 se colar)
CLR   = 0.4;     // folga entre segmentos e entre elos
T     = 2.6;     // espessura da placa
LUG_W = 8; LUG_L = 3.0; LUG_H = 2.8;   // garra interna (tração na roda)
GR_H  = 1.2;     // garra externa

A_SEG = [[-TW/2, -6.8], [-2.2, 2.2], [6.8, TW/2]];          // presos ao elo i (pino da frente)
B_SEG = [[-6.8 + CLR, -2.2 - CLR], [2.2 + CLR, 6.8 - CLR]];  // presos ao elo i+1 (pino de trás)
HOLE_R = PIN_R + GAP;
CUT_R  = KN_R + CLR;

// ---------- roda ----------
R_MID  = RP * cos(180 / NS) - T / 2;
R_KNIN = RP - KN_R;
R_RIM  = R_KNIN - 0.45;
R_TIP  = R_KNIN - 0.45;
R_HUB  = R_MID - LUG_H - 0.45;

// =====================================================================
//  ELO  (x = largura, y = sentido, z = para fora; pinos em y = ±P/2)
// =====================================================================
module xcyl(x0, x1, r, y) translate([x0, y, 0]) rotate([0, 90, 0]) cylinder(r = r, h = x1 - x0);

// remove o "beiral" embaixo de um segmento que começa em x0 (chanfro 45° a partir de r_in)
module chamfer_below(x0, r_in, y) {
  H = CUT_R + 0.3 - r_in;
  translate([x0, y, 0]) rotate([0, 90, 0]) difference() {
    translate([0, 0, -0.01]) cylinder(r = CUT_R + 0.3, h = H + 0.01);
    translate([0, 0, -0.02]) cylinder(r1 = r_in, r2 = r_in + H + 0.02, h = H + 0.04);
  }
}

module link_pip() {
  difference() {
    union() {
      translate([-TW/2, -P/2, -T/2]) cube([TW, P, T]);
      for (s = A_SEG) xcyl(s[0], s[1], KN_R, P/2);             // dobradiças da frente (maciças)
      for (s = B_SEG) xcyl(s[0], s[1], KN_R, -P/2);            // dobradiças de trás (com furo)
      // garra interna, com a face de baixo (x-) a 45° para imprimir em pé
      hull() {
        translate([-LUG_W/2, -LUG_L/2, -T/2 - 0.01]) cube([LUG_W, LUG_L, 0.01]);
        translate([-LUG_W/2 + LUG_H, -LUG_L/2 + 0.4, -T/2 - LUG_H]) cube([LUG_W - LUG_H, LUG_L - 0.8, 0.01]);
      }
      translate([-TW/2, -1, T/2 - 0.01]) cube([TW, 2, GR_H]);   // garra externa
    }
    // espaço livre para as dobradiças dos elos vizinhos
    for (s = B_SEG) xcyl(s[0] - CLR, s[1] + CLR, CUT_R, P/2);
    for (s = A_SEG) xcyl(s[0] - CLR, s[1] + CLR, CUT_R, -P/2);
    // furo das dobradiças de trás (o pino do elo anterior passa aqui)
    xcyl(-TW/2 - 1, TW/2 + 1, HOLE_R, -P/2);
    // chanfros 45° embaixo dos segmentos que não começam na mesa
    for (s = A_SEG) if (s[0] > -TW/2 + 0.01) chamfer_below(s[0], PIN_R, P/2);
    for (s = B_SEG) chamfer_below(s[0], HOLE_R, -P/2);
  }
  // pino integrado: atravessa toda a largura no eixo da frente
  xcyl(-TW/2, TW/2, PIN_R, P/2);
}

// =====================================================================
//  LAÇO COMPLETO: 36 elos num polígono, em pé (largura = altura de impressão)
// =====================================================================
RV = P / (2 * sin(180 / NL));   // raio dos pinos no anel (~46,9 mm)
module place_on_ring(i) {
  a = (i + 0.5) * 360 / NL;      // ângulo do centro do elo
  // local: x -> Z (altura), y -> tangente, z -> radial para fora
  rotate([0, 0, a]) translate([RV * cos(180 / NL), 0, TW/2])
    multmatrix([[0, 0, 1, 0], [0, 1, 0, 0], [1, 0, 0, 0], [0, 0, 0, 1]]) children();
}
module track_loop() for (i = [0 : NL - 1]) place_on_ring(i) link_pip();

// tira de teste com 4 elos (imprima antes do laço!)
module test_strip(n = 4) {
  for (i = [0 : n - 1]) translate([0, i * P, TW/2]) multmatrix([[0, 0, 1, 0], [0, 1, 0, 0], [1, 0, 0, 0], [0, 0, 0, 1]]) link_pip();
}

// =====================================================================
//  RODA DENTADA (para esta esteira)
// =====================================================================
module tooth2d() {
  a1 = 9; a2 = 5; r1 = R_HUB - 0.5;
  polygon([r1 * [cos(-a1), sin(-a1)], R_TIP * [cos(-a2), sin(-a2)], R_TIP * [cos(a2), sin(a2)], r1 * [cos(a1), sin(a1)]]);
}
module gear2d() { circle(r = R_HUB); for (i = [0 : NS - 1]) rotate(i * 360 / NS) tooth2d(); }
module sprocket(drive = true) {
  rimw = (TW - LUG_W - 2 * CLR) / 2;
  difference() {
    union() {
      cylinder(r = R_RIM, h = rimw);
      translate([0, 0, rimw - 0.01]) linear_extrude(LUG_W + 2 * CLR + 0.02) gear2d();
      translate([0, 0, TW - rimw]) cylinder(r = R_RIM, h = rimw);
      translate([0, 0, TW - 0.01]) cylinder(r = 9, h = 1.2);
    }
    if (drive) {
      translate([0, 0, -0.01]) linear_extrude(6.5) intersection() { circle(d = 3.05); translate([-0.25, 0]) square([3.1, 4], center = true); }
      translate([0, 0, 6]) cylinder(d = 1.6, h = 30);
    } else translate([0, 0, -1]) cylinder(d = 3.4, h = 30);
    translate([0, 0, TW + 0.6]) difference() { cylinder(r = 7.5, h = 2); cylinder(r = 6, h = 2); }
  }
}

// =====================================================================
//  PREVIEW: esteira nas rodas
// =====================================================================
function pin_pos(i) =
  let(k = i % NL)
  k < 13 ? [-L/2 + k * P, -RP] :
  k < 18 ? [L/2 + RP * sin((k - 13) * 36), -RP * cos((k - 13) * 36)] :
  k < 31 ? [L/2 - (k - 18) * P, RP] :
           [-L/2 - RP * sin((k - 31) * 36), RP * cos((k - 31) * 36)];
module chain() for (i = [0 : NL - 1]) {
  a = pin_pos(i); b = pin_pos(i + 1); m = (a + b) / 2; ang = atan2(b[1] - a[1], b[0] - a[0]);
  translate([0, m[0], m[1]]) rotate([ang, 0, 0]) rotate([180, 0, 0]) color(i % 2 ? "#333" : "#555") link_pip();
}
module preview() {
  chain();
  for (y = [-L/2, L/2]) color("orange") translate([-TW/2, y, 0]) rotate([0, 90, 0]) sprocket(y > 0);
}

if (part == "preview") preview();
else if (part == "track_loop") track_loop();
else if (part == "test_strip") test_strip();
else if (part == "sprocket_drive") sprocket(true);
else if (part == "sprocket_idler") sprocket(false);
