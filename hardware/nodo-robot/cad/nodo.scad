// =====================================================================
//  NODO — robô mascote da MakerConnect  (modelo paramétrico)
//  Unidades: mm.  Altura total ~26 cm.  OpenSCAD 2021+
//
//  Exportar uma peça:   openscad -D 'part="body_shell"' -o body_shell.stl nodo.scad
//  part = "assembly" mostra o robô montado (só para visualização).
//
//  Convenção: "direita/esquerda" = como você vê o Nodo de frente.
//  O braço que acena (servo) fica à DIREITA de quem olha.
//  Todas as peças já saem na orientação de impressão, sem suporte.
// =====================================================================

part = "assembly";
// [assembly, body_shell, body_back, face_frame, visor_insert, cheek, chest_insert, chest_trace,
//  arm_left, arm_right, antenna_front, antenna_back, antenna_node,
//  chassis, deck, sprocket_drive, sprocket_idler, track]

$fn = 72;

// ---------- escala do desenho ----------
S = 0.75;                         // mm por unidade do desenho do mascote
function fx(u) = (u - 150) * S;   // x de frente (centro do corpo = 0)
function fy(v) = (186 - v) * S;   // y para cima (centro do corpo = 0)

// ---------- corpo ----------
BW = 136; BH = 141; BD = 95;  BR = 33;   // largura, altura, profundidade, raio dos cantos
WALL = 3.2;      // espessura da face
SIDE = 2.6;      // espessura das laterais
REC  = 1.6;      // profundidade dos rebaixos (visor / peito)

VC = [0, (fy(114) + fy(200)) / 2];  // centro do visor
VW = 102; VH = 64.5; VR = 19.5;     // visor

// Tela TFT 2.8" ILI9341 (SPI, placa 86x50).  MEÇA o seu módulo e ajuste:
WIN     = [58, 44];      // janela da área ativa (landscape)
WIN_OFF = [0, 0];        // deslocamento da área ativa em relação ao centro da placa
DH      = [80, 44];      // distância entre furos de fixação da placa
DISP_SO = 4.0;           // altura dos pinos (espessura vidro+fita)

CC = [0, -42]; CW = 87; CHt = 36; CR = 9;          // painel do peito
SONAR = [[6.5, -42], [32.5, -42]];                  // HC-SR04 (transdutores)
SONAR_D = 16.6;
TRACE = [[fx(104), fy(248)], [fx(126), fy(248)], [fx(126), fy(232)], [fx(142), fy(232)]];

// Servo SG90 (braço que acena)
SHAFT   = [58.5, -4.5];   // eixo do servo na face
SV_OFF  = 5.3;            // eixo -> centro da caixa
SV_TABS = 27.6;           // distância entre furos das abas
SV_TAB  = 4.3;            // topo da caixa -> aba
SV_C    = SHAFT - [0, SV_OFF];

LPEG = [-61, -12];        // parafuso do braço esquerdo (fixo)
ANT_D = 20;               // profundidade (a partir da face) do centro da antena
LID_B = [[-40, 64], [40, 64], [-40, -64], [40, -64]];  // parafusos da tampa traseira
NECK_H = [[-14.5, -18], [14.5, -18], [-14.5, 18], [14.5, 18]];  // furos pescoço (x, Y)

// ---------- base / esteiras ----------
CHW = 74; CHL = 128; CHH = 34; CHZ = 6; CWL = 2.5;  // chassi
DECK_T = 3; NECK = [33, 40, 18];
RP = 13; NS = 10; P = 2 * PI * RP / NS;            // roda dentada: raio primitivo, dentes, passo
BT = 1.8; LH = 2.0; LW = 3.0; TW = 22; LUGW = 8;     // esteira: banda, garra interna, largura
NL = 36;                                            // garras por esteira
AX_Y = (NL - NS) * P / 2 / 2;                       // metade da distância entre eixos
AX_Z = RP + BT / 2 + 1.2;                           // altura do eixo
R_RIM = RP - BT / 2;
R_HUB = R_RIM - LH - 0.4;
RR = NL * P / (2 * PI);                             // raio do anel impresso

ZC = CHZ + CHH + DECK_T + NECK[2] + BH / 2;          // altura do centro do corpo

// ---------- cores (só visualização) ----------
NAVY = "#1A3A4D"; ORANGE = "#FFA500"; LORANGE = "#FFB84D"; DARK = "#0f172a"; TEAL = "#00C4B4";

// =====================================================================
//  Helpers 2D
// =====================================================================
module rrect(w, h, r) { offset(r) square([w - 2 * r, h - 2 * r], center = true); }
module body2d() { rrect(BW, BH, BR); }
module visor2d() { translate(VC) rrect(VW, VH, VR); }
module chest2d() { translate(CC) rrect(CW, CHt, CR); }
module seg(a, b, w) { hull() { translate(a) circle(d = w); translate(b) circle(d = w); } }
module poly(pts, w) { for (i = [0 : len(pts) - 2]) seg(pts[i], pts[i + 1], w); }
module dome2d() { hull() { translate(SHAFT) circle(d = 12.6); translate(SHAFT - [0, 6.5]) circle(d = 7); } }

function bz(p0, p1, p2, p3, t) =
  pow(1 - t, 3) * p0 + 3 * pow(1 - t, 2) * t * p1 + 3 * (1 - t) * pow(t, 2) * p2 + pow(t, 3) * p3;
function F(p) = [fx(p[0]), fy(p[1])];
function curve(p0, p1, p2, p3, n = 24) = [for (i = [0 : n]) bz(F(p0), F(p1), F(p2), F(p3), i / n)];

// mapeia coordenadas "de frente" (x dir., y cima, z para dentro do corpo) para o mundo
module to_world() multmatrix([[1, 0, 0, 0], [0, 0, 1, -BD / 2], [0, 1, 0, ZC], [0, 0, 0, 1]]) children();
// peça desenhada em coordenadas de frente, impressa com a face da frente na mesa
module print_face_down() mirror([1, 0, 0]) children();

// =====================================================================
//  CORPO
// =====================================================================
module body_shell_f() {   // coordenadas de frente
  difference() {
    union() {
      difference() {
        linear_extrude(BD) body2d();
        translate([0, 0, WALL]) linear_extrude(BD) offset(-SIDE) body2d();
      }
      // pinos da tela
      for (sx = [-1, 1], sy = [-1, 1])
        translate(concat(VC + WIN_OFF + [sx * DH[0] / 2, sy * DH[1] / 2], WALL - 0.01))
          cylinder(r = 3, h = DISP_SO);
      // pinos do servo
      for (sy = [-1, 1]) translate(concat(SV_C + [0, sy * SV_TABS / 2], WALL - 0.01)) cylinder(r = 3, h = SV_TAB);
      // buchas da tampa traseira
      intersection() {
        linear_extrude(BD) body2d();
        for (p = LID_B) translate(p) cylinder(r = 4.5, h = BD);
      }
      // reforço do braço esquerdo
      translate(concat(LPEG, WALL - 0.01)) cylinder(r = 4, h = 4);
      // luva da antena
      translate([-6, BH / 2 - SIDE - 10, ANT_D - 7.2]) cube([12, 10.01, 14.4]);
    }
    // rebaixos
    translate([0, 0, -0.01]) linear_extrude(REC) { visor2d(); chest2d(); }
    // janela da tela
    translate(concat(VC + WIN_OFF, -1)) linear_extrude(WALL + 2) rrect(WIN[0], WIN[1], 2);
    // sonar
    for (p = SONAR) translate(concat(p, -1)) cylinder(d = SONAR_D, h = WALL + 2);
    // servo: domo atravessa a face
    translate([0, 0, -1]) linear_extrude(WALL + 2) dome2d();
    // furos dos pinos
    for (sx = [-1, 1], sy = [-1, 1])
      translate(concat(VC + WIN_OFF + [sx * DH[0] / 2, sy * DH[1] / 2], WALL)) cylinder(d = 2.5, h = 10);
    for (sy = [-1, 1]) translate(concat(SV_C + [0, sy * SV_TABS / 2], WALL)) cylinder(d = 1.8, h = 10);
    translate(concat(LPEG, -1)) cylinder(d = 3.4, h = 10);
    for (p = LID_B) translate(concat(p, BD - 14)) cylinder(d = 2.6, h = 15);
    // fenda da antena
    translate([-3.2, BH / 2 - 15, ANT_D - 4.2]) cube([6.4, 20, 8.4]);
    // fundo: passagem de fios + parafusos do pescoço
    translate([-12, -BH / 2 - 1, BD / 2 - 15]) cube([24, SIDE + 2, 30]);
    for (p = NECK_H) translate([p[0], -BH / 2 - 1, BD / 2 + p[1]]) rotate([-90, 0, 0]) cylinder(d = 3.4, h = SIDE + 2);
  }
}

// tampa traseira — local: x de frente, y cima, z=0 face externa, z>0 para dentro
module body_back() {
  T = 3;
  difference() {
    union() {
      linear_extrude(T) body2d();
      // ressalto que encaixa por dentro
      linear_extrude(T + 2) difference() { offset(-SIDE - 0.3) body2d(); offset(-SIDE - 2.3) body2d(); }
      // espaçadores para placa perfurada 9x7 cm (furos 86x66)
      for (sx = [-1, 1], sy = [-1, 1]) translate([sx * 43, sy * 33, 0]) cylinder(r = 3.5, h = T + 10);
    }
    for (p = LID_B) {
      translate(concat(p, -1)) cylinder(d = 3.4, h = 10);
      translate(concat(p, -0.01)) cylinder(d1 = 6.6, d2 = 3.4, h = 1.6);
      translate(concat(p, T)) cylinder(r = 5, h = 5);   // folga para as buchas
    }
    for (sx = [-1, 1], sy = [-1, 1]) translate([sx * 43, sy * 33, 2]) cylinder(d = 2.5, h = 20);
    // abertura para USB / ventilação
    translate([0, -50, -1]) linear_extrude(10) rrect(44, 10, 4.5);
    for (i = [-2 : 2]) translate([i * 12, 52, -1]) linear_extrude(10) rrect(4, 14, 1.8);
    // gravação (espelhada: lida de trás do robô)
    translate([0, 8, -0.01]) linear_extrude(0.6) mirror([1, 0, 0]) {
      text("NODO", size = 14, halign = "center", valign = "center", font = "Liberation Sans:style=Bold");
      translate([0, -16]) text("MakerConnect", size = 6, halign = "center", valign = "center", font = "Liberation Sans:style=Bold");
    }
  }
}

module face_frame_f() {  // z -1.6..0 (colado na face)
  translate([0, 0, -1.6]) linear_extrude(1.6) difference() {
    body2d(); offset(-4.5) body2d();
    offset(0.4) dome2d();
    translate(LPEG) circle(r = 4.5);
  }
}
module visor_insert_f() {
  linear_extrude(REC - 0.1) difference() {
    offset(-0.15) visor2d();
    translate(VC + WIN_OFF) rrect(WIN[0], WIN[1], 2);
    for (sx = [-1, 1]) translate([sx * 39, 1.5]) circle(d = 7.6);
  }
}
module cheek() cylinder(d = 7.3, h = REC - 0.1);
module chest_insert_f() {
  difference() {
    linear_extrude(REC - 0.1) difference() {
      offset(-0.15) chest2d();
      for (p = SONAR) translate(p) circle(d = SONAR_D);
    }
    translate([0, 0, -0.01]) linear_extrude(0.8) offset(0.15) trace2d();
  }
}
module trace2d() { poly(TRACE, 2.6); translate(TRACE[0]) circle(r = 3); translate(TRACE[3]) circle(r = 3); }
module chest_trace() linear_extrude(0.8) trace2d();

// =====================================================================
//  BRAÇOS  (2.5D, 6 mm, frente em z=0)
// =====================================================================
LA = [for (p = curve([62, 202], [30, 208], [26, 244], [40, 258])) p + [5, 0]];
RA = [for (p = curve([238, 192], [272, 182], [282, 150], [268, 122])) p + [-7.5, 0]];
HORN_A = atan2(7.5, 25.5);

module arm2d(pts, hand) {
  poly(pts, 6);
  translate(pts[0]) circle(r = 6.75);
  translate(hand) circle(r = 9);
}
module arm_left() {
  difference() {
    union() {
      linear_extrude(6) arm2d(LA, F([40, 264]) + [5, 0]);
      translate(concat(LA[0], 0)) cylinder(r = 4, h = 7.8);
    }
    translate(concat(LA[0], 2)) cylinder(d = 2.6, h = 10);
  }
}
module arm_right() {
  difference() {
    linear_extrude(6) union() {
      arm2d(RA, F([266, 114]) + [-7.5, 0]);
      hull() { translate(RA[0]) circle(r = 6.75); translate(RA[0] + 17 * [cos(HORN_A), sin(HORN_A)]) circle(r = 4); }
    }
    // encaixe do horn simples do SG90 (por trás)
    translate(concat(RA[0], 6 - 3.2)) linear_extrude(4) hull() {
      circle(d = 7.6);
      translate(16.5 * [cos(HORN_A), sin(HORN_A)]) circle(d = 4.6);
    }
    translate(concat(RA[0], -1)) cylinder(d = 4.5, h = 10);   // acesso ao parafuso do horn
  }
}

// =====================================================================
//  ANTENA  (trilha em L + nó translúcido com LED PL9823 de 8 mm)
// =====================================================================
ANT_PTS = [[0, BH / 2 - 10], [0, fy(60)], [fx(186), fy(60)], [fx(186), fy(40) - 3]];
NODE = [fx(186), fy(34)];
module ant2d() { poly(ANT_PTS, 6); }
module antenna_front_f() { linear_extrude(4) ant2d(); }               // z 0..4
module antenna_back_f() {                                             // z 0..4, canal na face z=0
  difference() {
    linear_extrude(4) ant2d();
    translate([0, 0, -0.01]) linear_extrude(2.5) poly(concat([[0, BH / 2 - 12]], ANT_PTS), 2.6);
  }
}
RAYS = [[-12, 15], [15, 15], [21, -3]];
module antenna_node_f() {     // z 0..12
  difference() {
    union() {
      cylinder(r = 7.5, h = 12);
      translate([0, 0, 3]) linear_extrude(6) for (r = RAYS) { seg([0, 0], r, 2); translate(r) circle(r = 2.6); }
    }
    // LED PL9823 F8 entra por baixo
    translate([0, -7.6, 6]) rotate([-90, 0, 0]) cylinder(d = 8.4, h = 10.6);
  }
}

// =====================================================================
//  CHASSI, DECK E PESCOÇO  (coordenadas do mundo; frente = -Y)
// =====================================================================
module chassis() {     // local z = 0 no fundo do chassi
  az = AX_Z - CHZ;
  ix = CHW / 2 - CWL;  // face interna da lateral
  difference() {
    union() {
      difference() {
        linear_extrude(CHH) rrect(CHW, CHL, 5);
        translate([0, 0, 2.5]) linear_extrude(CHH) rrect(CHW - 2 * CWL, CHL - 2 * CWL, 3);
      }
      // túneis dos motores N20 (traseira, +Y)
      for (s = [-1, 1]) translate([s * (ix - 8), AX_Y, 0]) translate([-8, -8.1, 0]) cube([16, 16.2, az + 7.1]);
      // colunas do deck
      for (x = [-31, 31], y = [-40, 40]) translate([x, y, 0]) cylinder(r = 4, h = CHH);
    }
    // canal do motor (12.2 x 10.2) e furo do eixo
    for (s = [-1, 1]) {
      translate([s * (ix - 8), AX_Y, az]) cube([16.2, 12.2, 10.2], center = true);
      translate([s * ix, AX_Y, az]) rotate([0, 90, 0]) cylinder(d = 7, h = 10, center = true);
    }
    // rasgo do eixo da roda guia (tensiona a esteira)
    for (s = [-1, 1]) translate([s * (CHW / 2), -AX_Y, az]) rotate([0, 90, 0])
      hull() { translate([0, -2, 0]) cylinder(d = 3.4, h = 8, center = true); translate([0, 2.5, 0]) cylinder(d = 3.4, h = 8, center = true); }
    // furos do deck
    for (x = [-31, 31], y = [-40, 40]) translate([x, y, CHH - 12]) cylinder(d = 2.6, h = 13);
    // chave liga/desliga KCD11 (parede traseira)
    translate([0, CHL / 2, 17.5]) cube([12.9, 10, 19.2], center = true);
    // passagem do cabo de carga
    translate([22, CHL / 2, 25]) rotate([90, 0, 0]) cylinder(d = 9, h = 10, center = true);
  }
}

module deck() {        // local z = 0 em cima do chassi
  difference() {
    union() {
      linear_extrude(DECK_T) rrect(CHW, CHL, 5);
      translate([0, 0, DECK_T - 0.01]) linear_extrude(NECK[2]) rrect(NECK[0], NECK[1], 3);
    }
    translate([0, 0, -1]) linear_extrude(50) rrect(NECK[0] - 8, NECK[1] - 8, 1.5);
    for (x = [-31, 31], y = [-40, 40]) {
      translate([x, y, -1]) cylinder(d = 3.4, h = 10);
      translate([x, y, DECK_T - 1.6]) cylinder(d1 = 3.4, d2 = 6.6, h = 1.61);
    }
    for (p = NECK_H) translate([p[0], p[1], DECK_T + NECK[2] - 12]) cylinder(d = 2.6, h = 13);
  }
}

// =====================================================================
//  RODA DENTADA E ESTEIRA (TPU 95A)
// =====================================================================
module tooth2d() {
  r1 = R_HUB - 1; r2 = R_RIM - 0.3; a1 = 10; a2 = 6;
  polygon([[r1 * cos(-a1), r1 * sin(-a1)], [r2 * cos(-a2), r2 * sin(-a2)], [r2 * cos(a2), r2 * sin(a2)], [r1 * cos(a1), r1 * sin(a1)]]);
}
module gear2d() { circle(r = R_HUB); for (i = [0 : NS - 1]) rotate(i * 360 / NS + 180 / NS) tooth2d(); }
module sprocket(drive = true) {
  rimw = (TW - LUGW - 0.6) / 2;
  difference() {
    union() {
      cylinder(r = R_RIM, h = rimw);
      translate([0, 0, rimw - 0.01]) linear_extrude(LUGW + 0.62) gear2d();
      translate([0, 0, TW - rimw]) cylinder(r = R_RIM, h = rimw);
      translate([0, 0, TW - 0.01]) cylinder(r = 9, h = 1.2);      // calota
    }
    if (drive) {   // eixo D do N20 (3 mm, chato 2.5)
      translate([0, 0, -0.01]) linear_extrude(6.5) intersection() { circle(d = 3.05); translate([-0.25, 0]) square([3.1, 4], center = true); }
      translate([0, 0, 6]) cylinder(d = 1.6, h = 30);
    } else {
      translate([0, 0, -1]) cylinder(d = 3.4, h = 30);
    }
    translate([0, 0, TW + 0.6]) difference() { cylinder(r = 7.5, h = 2); cylinder(r = 6, h = 2); } // anel decorativo
  }
}
module track() {
  difference() { cylinder(r = RR + BT / 2, h = TW); translate([0, 0, -1]) cylinder(r = RR - BT / 2, h = TW + 2); }
  for (i = [0 : NL - 1]) rotate(i * 360 / NL) translate([RR - BT / 2, 0, (TW - LUGW) / 2])
    linear_extrude(LUGW) polygon([[0.4, -LW / 2], [0.4, LW / 2], [-LH, LW / 2 - 0.4], [-LH, -(LW / 2 - 0.4)]]);
  for (i = [0 : NL - 1]) rotate((i + 0.5) * 360 / NL) translate([RR + BT / 2 - 0.3, -1, 0]) cube([1.5, 2, TW]);
}

// =====================================================================
//  MONTAGEM (visualização)
// =====================================================================
module face_screen() {  // só visual: olhos na tela
  color(DARK) translate(concat(VC + WIN_OFF, 1.0)) linear_extrude(0.5) rrect(WIN[0], WIN[1], 2);
  color(TEAL) translate([0, 0, 0.6]) linear_extrude(0.6) for (sx = [-1, 1]) translate(VC + [sx * 12, 4])
    intersection() { difference() { circle(r = 9); circle(r = 5); } translate([-10, 0]) square([20, 10]); }
  color(TEAL) translate([0, 0, 0.6]) linear_extrude(0.6) translate(VC + [0, -6])
    intersection() { difference() { circle(r = 7); circle(r = 4.6); } translate([-8, -8]) square([16, 8]); }
}
module assembly() {
  // corpo
  to_world() {
    color(NAVY) body_shell_f();
    color(ORANGE) face_frame_f();
    color(DARK) visor_insert_f();
    for (sx = [-1, 1]) color(ORANGE) translate([sx * 39, 1.5, 0]) cheek();
    color(DARK) chest_insert_f();
    color(LORANGE) chest_trace();
    face_screen();
    color("silver") for (p = SONAR) translate(concat(p, -6)) difference() { cylinder(d = 16, h = 6); translate([0, 0, -1]) cylinder(d = 12, h = 6); }
    color(LORANGE) translate([0, 0, -7.8]) arm_left();
    color(LORANGE) translate([0, 0, -7.8]) arm_right();
    color(ORANGE) translate([0, 0, ANT_D - 4]) antenna_front_f();
    color(ORANGE) translate([0, 0, ANT_D]) antenna_back_f();
    color("#FFE3A3", 0.9) translate(concat(NODE, ANT_D - 6)) antenna_node_f();
  }
  color(NAVY) multmatrix([[1, 0, 0, 0], [0, 0, -1, BD / 2 + 3], [0, 1, 0, ZC], [0, 0, 0, 1]]) body_back();
  // base
  color("#0b2230") translate([0, 0, CHZ]) chassis();
  color(NAVY) translate([0, 0, CHZ + CHH]) deck();
  for (s = [-1, 1]) {
    x0 = s > 0 ? CHW / 2 + 1 : -CHW / 2 - 1 - TW;
    for (y = [-AX_Y, AX_Y]) color(ORANGE) translate([s > 0 ? CHW / 2 + 1 : -CHW / 2 - 1, y, AX_Z]) rotate([0, s * 90, 0]) sprocket(y > 0);
    color("#222222") translate([x0, 0, AX_Z]) rotate([0, 90, 0]) linear_extrude(TW) difference() {
      hull() for (y = [-AX_Y, AX_Y]) translate([0, y]) circle(r = RP + BT / 2 + 1.2);
      hull() for (y = [-AX_Y, AX_Y]) translate([0, y]) circle(r = RP - BT / 2);
    }
  }
}

// =====================================================================
//  SAÍDA
// =====================================================================
if (part == "assembly") assembly();
else if (part == "body_shell")    print_face_down() body_shell_f();
else if (part == "body_back")     body_back();
else if (part == "face_frame")    print_face_down() translate([0, 0, 1.6]) face_frame_f();
else if (part == "visor_insert")  print_face_down() visor_insert_f();
else if (part == "cheek")         cheek();
else if (part == "chest_insert")  print_face_down() chest_insert_f();
else if (part == "chest_trace")   chest_trace();
else if (part == "arm_left")      print_face_down() arm_left();
else if (part == "arm_right")     print_face_down() arm_right();
else if (part == "antenna_front") print_face_down() antenna_front_f();
else if (part == "antenna_back")  translate([0, 0, 4]) mirror([0, 0, 1]) antenna_back_f();
else if (part == "antenna_node")  print_face_down() antenna_node_f();
else if (part == "chassis")       chassis();
else if (part == "deck")          deck();
else if (part == "sprocket_drive") sprocket(true);
else if (part == "sprocket_idler") sprocket(false);
else if (part == "track")         track();
