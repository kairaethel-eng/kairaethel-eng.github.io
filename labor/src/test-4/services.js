// Leistungen als Partikel-Motive: eine Bühne, die Punkte formen je Leistung ein kleines Motiv
// (Hände am Knie, Hantel, Ball, Schmerzwelle, Kiefer, Atlas, Stoßwelle, Schlingentisch, Faszien-Netz, Fango/Kälte, Reizstrom, Manuthera).
// Alles im Browser gerechnet, keine Bilder. Reihenfolge = Liste „Alle Leistungen“.
//
// 20.11.2026 (Auftrag Kai: „die gleichen professionellen Animationen wie die Figur und Wirbelsäule auf alle anderen Pixel-Grafiken“):
// neu aufgebaut wie die Figur in Kapitel 01 und die Wirbelsäule in Kapitel 03 –
//   · geordnete Punkte: Zeile für Zeile über die gewölbte Oberfläche, gleicher Abstand, jede zweite Zeile versetzt (../shared/raster.js)
//   · Kantenlicht: je Punkt die Flächen-Normale → Rand hell, Fläche ruhig
//   · gestochene, gleich große Scheiben; ein unsichtbarer Kern verdeckt die Rückseite (wie bei der Wirbelsäule)
//   · Linien sind Perlen in gleichem Abstand
//   · Auftritt und Wechsel laufen über die Zeit: feiner Staub sammelt sich zum Motiv (kleine Punkte, höchstens 60 % deckend)
//   · kein Zufall im ruhenden Bild, kein Flimmern; Antwort unter Maus/Finger wie bisher
import * as THREE from 'three';
import { stage, reduced, isDesktop, C } from '../manu/common.js';
import { runSync } from '../shared/slice.js';
import { pointer, PTR_GLSL } from '../shared/zeiger.js';
import { surf, ell, tube, cap, box, cyl, torus, line, seg, moved, assemble, V } from '../shared/raster.js';
import { rows, bounds, achsen } from '../shared/netz.js';
import { manuFormen } from '../manu/formen.js';

// fester Zufall (gleiche Reihenfolge der Punkte bei jedem Laden)
function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

// Bewegungsarten (im Shader, für Punkte und Kern gleich): 0 ruhig · 2 Licht läuft entlang (ph = Lage) · 3 Drehen (Atlas) · 4 Kiefer öffnet
// 5 Wärme steigt · 6 Pendeln · 7 Springen · 8 Netz wogt · 9 Impuls läuft · 10 Schmerzwelle beruhigt sich · 11 Liegenteil kippt · 12 Heben
// 13 Gelenk öffnen (Manuelle Therapie, beide Seiten auseinander)
const MOTION = /* glsl */`
  vec3 rotY(vec3 p, float a){ float c = cos(a), s = sin(a); return vec3(c*p.x + s*p.z, p.y, -s*p.x + c*p.z); }
  vec3 rotX(vec3 p, float a){ float c = cos(a), s = sin(a); return vec3(p.x, c*p.y - s*p.z, s*p.y + c*p.z); }
  vec3 rotZ(vec3 p, float a){ float c = cos(a), s = sin(a); return vec3(c*p.x - s*p.y, s*p.x + c*p.y, p.z); }
  float zig(float x){ return (abs(fract(x * 1.6) - .5) * 4. - 1.) * .2; }
  uniform vec3 uPiv;
  float motion(inout vec3 b, inout vec3 n, float type, float ph, float t){
    float al = 1.;
    if (type > 1.5 && type < 2.5) al = .3 + .85 * pow(fract(ph - t * .4), 2.);
    else if (type > 2.5 && type < 3.5) { float a = sin(t * .8) * .45; b = rotY(b, a); n = rotY(n, a); }
    else if (type > 3.5 && type < 4.5) { vec3 pv = uPiv; float a = (.5 + .5 * sin(t * 1.3)) * .2; b = rotX(b - pv, a) + pv; n = rotX(n, a); }
    else if (type > 4.5 && type < 5.5) al = .25 + .85 * pow(fract(ph - t * .3), 2.);
    else if (type > 5.5 && type < 6.5) b.x += sin(t * 1.1) * .09 * ph;
    else if (type > 6.5 && type < 7.5) b.y += abs(sin(t * 2.2)) * .32;
    else if (type > 7.5 && type < 8.5) b.y += sin(b.x * 3.5 + t * 1.6) * .07 + cos(b.z * 5. + t) * .03;
    else if (type > 8.5 && type < 9.5) al = .35 + .8 * pow(fract(ph - t * .55), 4.);
    else if (type > 9.5 && type < 10.5) { float calm = smoothstep(-.3, .7, sin(t * .55)); b.y += mix(zig(b.x + ph), sin(b.x * 2.6 + t * 1.2 + ph * 2.) * .14, calm); }
    else if (type > 10.5 && type < 11.5) { float a = (.5 - .5 * cos(t * .9)) * -.3; b = rotZ(b - uPiv, a) + uPiv; n = rotZ(n, a); }
    else if (type > 11.5 && type < 12.5) b.y += (.5 + .5 * sin(t * 1.4)) * .3;
    else if (type > 12.5) b.x += sign(b.x) * .035 * (.5 + .5 * sin(t * 1.1));
    return al;
  }`;

// Teil = { g (Form aus raster.js), k (Farbe 0 Knochen · 1 Bernstein · 2 Blau · 4 Petrol), a (Bewegung), ph (Zahl oder ph(p)) }
export const T = (g, k = 0, a = 0, ph = 0, o = {}) => ({ g, k, a, ph, ...o });
const { add: vAdd, mul: vSc, sub: vSub, norm: vN, cross: vX } = V;

// ---------- Manuelle Therapie: zwei Hände umgreifen ein Kniegelenk (Aufbau der Hand wie seit 7.11., jetzt als geordnete Flächen) ----------
// Bein liegt quer (Achse x), Hände von hinten oben: Handrücken gewölbt (Knöchel, Sehnen), Finger aus drei Gliedern, deren Gelenke auf
// einem Kreis um das Bein liegen (legen sich um das Bein), Daumen abgewinkelt oben am Bein zum Gelenkspalt.
const GRIP = { yl: -0.2, rl: 0.2, phiP: 0.2, xh: 0.6 };
function gripHand(sx, sp) {
  const { yl, rl, phiP } = GRIP, xh = sx * GRIP.xh;
  const at = (phi, rad, x) => [x, yl + Math.cos(phi) * rad, Math.sin(phi) * rad]; // Zylinderkoordinaten um das Bein (0 = oben, + nach vorn)
  // Handfläche: Mittelebene auf einem flacheren Bogen (Radius Rb) tangential am Bein, Ort (f längs, w quer zum Daumen, d dorsal)
  const Lp = 0.44, th = (f) => 0.052 - f * 0.012, hw = (f) => 0.15 + f * 0.085, fc = 0.2;
  const Rg = rl + 0.058, Rb = Rg / 0.55, C0 = [Math.cos(phiP) * (Rg - Rb), Math.sin(phiP) * (Rg - Rb)];
  const palm = (f, w, d) => { const ps = phiP + (f - fc) / Rb, r = Rb + d; return [xh - sx * w, yl + C0[0] + Math.cos(ps) * r, C0[1] + Math.sin(ps) * r]; };
  const WI = [0.135, 0.045, -0.045, -0.13], KO = [-0.012, 0.01, -0.006, -0.04]; // Zeige-, Mittel-, Ring-, Kleinfinger (w zum Daumen)
  const LEN = [[0.2, 0.12, 0.09], [0.22, 0.135, 0.095], [0.21, 0.13, 0.09], [0.165, 0.1, 0.08]], RS = [1, 1.02, 0.97, 0.85];
  const SPR = [0.07, 0.015, -0.03, -0.09]; // Fächer: Drift in w je Längeneinheit
  // Handrücken: Wölbung quer, Knöchel-Höcker, Sehnen-Grate zu den Fingern
  const dors = (f, w) => {
    const u = w / hw(f); let d = th(f) + 0.022 * (1 - u * u);
    for (let k = 0; k < 4; k++) {
      const wk = WI[k] * (0.55 + 0.45 * f / Lp);
      d += 0.022 * Math.exp(-(((w - WI[k]) / 0.032) ** 2) - (((f - Lp - KO[k] + 0.01) / 0.04) ** 2)) + 0.006 * Math.exp(-(((w - wk) / 0.013) ** 2)) * Math.min(1, f / 0.12);
    }
    return d;
  };
  const up = (f, w) => vSub(palm(f, w, 0.1), palm(f, w, 0)); // Richtung „dorsal“
  const gs = [];
  // Rücken (sichtbar) und die beiden Ränder
  gs.push(surf((u, v) => { const f = v * Lp, w = (2 * u - 1) * hw(f); return palm(f, w, dors(f, w)); }, sp, { out: (p, u, v) => up(v * Lp, 0), cu: 12, cv: 12 }));
  for (const s of [-1, 1]) gs.push(surf((u, v) => { const f = v * Lp, a = (u - 0.5) * Math.PI; return palm(f, s * (hw(f) + Math.cos(a) * 0.012), Math.sin(a) * th(f)); }, sp,
    { out: (p, u, v) => vSub(p, palm(v * Lp, s * hw(v * Lp) * 0.8, 0)), cu: 4, cv: 10 }));
  // Finger: Gelenke auf dem Kreis Rf um das Bein → Glieder sind Sehnen des Kreises, Beugung ergibt sich
  for (let k = 0; k < 4; k++) {
    const rf = 0.041 * RS[k], Rf = rl + rf + 0.006;
    const f0 = Lp + KO[k], K = palm(f0, WI[k], 0.004);
    let phi = Math.atan2(K[2], K[1] - yl), rad = Math.hypot(K[1] - yl, K[2]), w = WI[k];
    const nodes = [{ p: palm(f0 - 0.07, WI[k] * 0.96, 0.004), r: rf * 1.02 }, { p: K, r: rf * 1.08 }];
    LEN[k].forEach((L, j) => {
      const c = (rad * rad + Rf * Rf - L * L) / (2 * rad * Rf), dphi = Math.acos(Math.max(-1, Math.min(1, c)));
      phi += dphi; rad = Rf; w += SPR[k] * L;
      nodes.push({ p: at(phi, rad, xh - sx * w), r: rf * [0.95, 0.86, 0.74][j] });
    });
    gs.push(tube(nodes, sp, { ref: [sx, 0, 0], fl: 0.88, capA: false }));
  }
  // Daumen: aus dem Handballen schräg nach vorn-innen, Glieder oben auf dem Bein zum Gelenkspalt
  const rt = 0.05, Rt = rl + rt + 0.004;
  gs.push(tube([{ p: palm(0.08, 0.13, -0.035), r: rt * 1.15 }, { p: at(phiP + 0.45, Rt + 0.012, xh - sx * 0.3), r: rt }, { p: at(phiP + 0.64, Rt, xh - sx * 0.375), r: rt * 0.9 }, { p: at(phiP + 0.8, Rt, xh - sx * 0.43), r: rt * 0.74 }], sp));
  // Unterarm: vom Handgelenk nach hinten oben, leicht nach außen, ovaler Querschnitt, nach hinten lichter
  const Wr = palm(0, 0, 0), Fw = vN(vSub(palm(0.05, 0, 0), Wr)), Dw = vN(vSub(palm(0, 0, 0.05), Wr));
  const ax = vN(vAdd(vAdd(vSc(Fw, -0.62), vSc(Dw, 0.72)), [sx * 0.22, 0, 0])), side = [-sx, 0, 0];
  const upA = vN(vX(ax, side)), FL = 0.66;
  const mid = (t) => vAdd(Wr, vSc(ax, t * FL));
  gs.push(surf((u, v) => { const t = 0.03 + v * 0.97, g = u * 6.2831853, a = 0.125 + t * 0.035, b = 0.062 + t * 0.035; return vAdd(mid(t), vAdd(vSc(side, Math.cos(g) * a), vSc(upA, Math.sin(g) * b))); }, sp,
    { closedU: true, out: (p, u, v) => vSub(p, mid(0.03 + v * 0.97)), w: (u, v) => 1 - 0.9 * v * v, cu: 14, cv: 8 }));
  return gs;
}
function manualGrip(sp) {
  const { yl, rl } = GRIP;
  // Bein: Oberschenkel links, Unterschenkel rechts, zum Gelenk hin breiter (Kondylen / Tibiaplateau), nach außen lichter
  const rad = (x) => { const a = Math.abs(x); return rl + 0.045 * Math.exp(-(((a - 0.12) / 0.1) ** 2)) - (x > 0 ? 0.03 * Math.min(1, a / 1.2) : 0); };
  const limb = (s) => surf((u, v) => { const x = s * (0.045 + v * 1.3), ph = u * 6.2831853, r = rad(x); return [x, yl + Math.cos(ph) * r, Math.sin(ph) * r]; }, sp,
    { closedU: true, out: (p) => [0, p[1] - yl, p[2]], w: (u, v) => 1 - 0.85 * Math.max(0, (v - 0.55) / 0.45) ** 2, cu: 16, cv: 10 });
  const parts = [];
  for (const sx of [-1, 1]) gripHand(sx, sp).forEach((g) => parts.push(T(g, 0, 13, 0, { cut: false })));
  parts.push(T(limb(-1), 4, 13), T(limb(1), 4, 13));
  // Gelenkspalt: ein Bernstein-Ring, das Licht läuft um
  parts.push(T(line((t) => { const g = t * 6.2831853, r = rl + 0.05; return [0, yl + Math.cos(g) * r, Math.sin(g) * r]; }, sp * 0.7), 1, 2, (p) => Math.atan2(p[2], p[1] - yl) / 6.2831853 + 0.5));
  return parts;
}
// einfache Hand von oben (Osteopathische Ansätze): Handteller, vier Finger, Daumen, Unterarm
function flatHand(sp, y) {
  const gs = [ell([0.62, y, 0], [0.3, 0.1, 0.27], sp, { axis: 'x' })];
  [-0.19, -0.065, 0.065, 0.19].forEach((z, i) => gs.push(tube([{ p: [0.42, y, z], r: 0.056 }, { p: [0.24, y - 0.03, z * 1.03], r: 0.052 }, { p: [0.06 + Math.abs(z) * 0.3, y - 0.1 - i * 0.004, z * 1.05], r: 0.044 }], sp, { capA: false })));
  gs.push(tube([{ p: [0.62, y - 0.02, 0.2], r: 0.06 }, { p: [0.46, y - 0.05, 0.34], r: 0.052 }, { p: [0.3, y - 0.09, 0.42], r: 0.044 }], sp, { capA: false }));
  gs.push(surf((u, v) => { const t = v, g = u * 6.2831853, c = [0.9 + t * 0.62, y + 0.05 + t * 0.26, 0]; return [c[0], c[1] + Math.sin(g) * 0.085, c[2] + Math.cos(g) * 0.135]; }, sp,
    { closedU: true, out: (p, u, v) => [0, p[1] - (y + 0.05 + v * 0.26), p[2]], w: (u, v) => 1 - 0.9 * v * v, cu: 14, cv: 6 }));
  return gs;
}


// ---------- Echte Anatomie (20.11.2026, Kai im Arbeitsblatt: „Alle anatomischen Animationen bitte deutlich realer … die reale Anatomie
// ziemlich perfekt“) ----------
// Knochen aus BodyParts3D (assets/motive-anatomie.bin, tools/anatomie-motive.mjs; Namensnennung im Fuß der Seite), als geordnete
// Punktzeilen (../shared/netz.js). Lädt die Datei nicht (z. B. file://), bleiben die gerechneten Motive (parts) als Rückfall.
// A = { id → { pos (cm: x links, y oben, z vorn), idx } }. Jedes Motiv legt seine Knochen selbst in seinen Raum (Drehung M, Bezug c, Maßstab s).
const LIEGEND = [0, -1, 0, 0, 0, 1, 1, 0, 0]; // Bein liegt: Längsachse → x (Hüfte links), Vorderseite → oben
const smooth01 = (a, b, v) => { const t = Math.min(1, Math.max(0, (v - a) / (b - a))); return t * t * (3 - 2 * t); };
// Mittel der Ecken, die eine Bedingung erfüllen
export function meanOf(m, ok) { const a = [0, 0, 0]; let n = 0; for (let i = 0; i < m.pos.length; i += 3) { const p = [m.pos[i], m.pos[i + 1], m.pos[i + 2]]; if (ok(p)) { a[0] += p[0]; a[1] += p[1]; a[2] += p[2]; n++; } } return a.map((v) => v / Math.max(1, n)); }

function echtKnie(sp, A) {
  GRIP.rl = 0.27; GRIP.xh = 0.7; // echtes Knie größer gezeigt → die Hände greifen um ein dickeres Bein
  const { yl, rl } = GRIP, fe = A['bein/femur'], ti = A['bein/tibia'], fi = A['bein/fibula'], pa = A['bein/patella'];
  const bt = bounds(ti), bf = bounds(fe), yJ = (bf.lo[1] + bt.hi[1]) / 2, top = meanOf(ti, (p) => p[1] > bt.hi[1] - 2.5);
  const S = 0.052, o = { M: LIEGEND, c: [top[0], yJ, top[2] - 0.5], s: S, t: [0, yl, 0], axis: 'x', w: (p) => 1 - 0.9 * smooth01(0.85, 1.32, Math.abs(p[0])), clip: (p) => Math.abs(p[0]) < 1.36 };
  // Haut des Beins nur als feiner Schleier (kein Kern), die Knochen liegen sichtbar darin
  const rad = (x) => { const a = Math.abs(x); return rl + 0.04 * Math.exp(-(((a - 0.12) / 0.16) ** 2)) - (x > 0 ? 0.03 * Math.min(1, a / 1.2) : 0); };
  const skin = (sg) => surf((u, v) => { const x = sg * (0.02 + v * 1.3), ph = u * 6.2831853, r = rad(x); return [x, yl + Math.cos(ph) * r, Math.sin(ph) * r]; }, sp * 1.7,
    { closedU: true, out: (p) => [0, p[1] - yl, p[2]], w: (u, v) => 0.2 * (1 - 0.85 * Math.max(0, (v - 0.55) / 0.45) ** 2), core: false });
  const parts = [T(rows(fe, sp, o), 0, 13), T(rows(ti, sp, o), 0, 13), T(rows(fi, sp, o), 0, 13), T(rows(pa, sp, o), 0, 0), T(skin(-1), 4, 13, 0, { cut: false }), T(skin(1), 4, 13, 0, { cut: false })];
  for (const sx of [-1, 1]) gripHand(sx, sp).forEach((g) => parts.push(T(g, 0, 13, 0, { cut: false })));
  // Gelenkspalt: ein Bernstein-Ring, das Licht läuft um
  parts.push(T(line((t) => { const g = t * 6.2831853, r = rl + 0.06; return [0, yl + Math.cos(g) * r, Math.sin(g) * r]; }, sp * 0.7), 1, 2, (p) => Math.atan2(p[2], p[1] - yl) / 6.2831853 + 0.5));
  return parts;
}
function echtKiefer(sp, A, m) {
  const sk = A['kopf/schaedel'], uk = A['kopf/unterkiefer'], bs = bounds(sk, uk), bu = bounds(uk), S = 0.1;
  // Kiefergelenk: die Köpfchen des Unterkiefers (höchste hintere Punkte) – darum dreht er sich
  const piv = meanOf(uk, (p) => p[1] > bu.hi[1] - 0.9 && p[2] < bu.lo[2] + 2.5), c = [bs.mid[0], bs.mid[1], bs.mid[2]];
  const P = [(piv[0] - c[0]) * S, (piv[1] - c[1]) * S, (piv[2] - c[2]) * S]; m.piv = [0, P[1], P[2]];
  // seitlicher Abstand der Köpfchen von der Mitte (das Mittel beider Seiten liegt in der Mitte – für die Farbe zählt der Abstand)
  let px = 0, pn = 0; for (let i = 0; i < uk.pos.length; i += 3) if (uk.pos[i + 1] > bu.hi[1] - 0.9 && uk.pos[i + 2] < bu.lo[2] + 2.5) { px += Math.abs(uk.pos[i] - c[0]) * S; pn++; } px /= Math.max(1, pn);
  const nahe = (q) => (Math.hypot(q[1] - P[1], q[2] - P[2]) < 0.27 && Math.abs(Math.abs(q[0]) - px) < 0.16 ? 1 : 0); // Gelenk in Bernstein
  // 20.11. nachts (Kai im Arbeitsblatt 4: „Mehr auf das Kiefergelenk; den Kiefer konzentrieren“): der Blick liegt seitlich auf Unterkiefer und
  // Gelenk; vom Schädel bleibt, was das Gelenk hält (Schläfenbein, Jochbogen, Oberkiefer) – das Schädeldach läuft nach oben aus.
  const ty = 0.3 - P[1], tz = -P[2] * 0.55; P[1] += ty; P[2] += tz; m.piv = [0, P[1], P[2]];
  const o = { c, s: S, t: [0, ty, tz], axis: 'y' };
  const oben = (p) => 1 - smooth01(P[1] + 0.12, P[1] + 0.62, p[1]);
  return [T(rows(sk, sp, { ...o, keep: (p, n) => n[0] * p[0] + n[1] * (p[1] - ty - 0.3) + n[2] * (p[2] - tz + 0.1) > -0.12, w: oben, clip: (p) => p[1] < P[1] + 0.66 }), nahe, 0),
    T(rows(uk, sp, o), nahe, 4)];
}
function echtAtlas(sp, A) {
  const at = A['hals/atlas'], ax = A['hals/axis'], c3 = A['hals/c3'], ba = bounds(at), bx = bounds(ax), S = 0.21;
  const dens = meanOf(ax, (p) => p[1] > bx.hi[1] - 0.8), o = { c: [dens[0], ba.mid[1], dens[2]], s: S, t: [0, 0.22, 0], axis: 'y' };
  const yA = (ba.lo[1] - ba.mid[1]) * S + 0.22; // Unterkante des Atlas: darüber ist der Zahn des Axis zu sehen
  return [T(rows(at, sp, o), 0, 3), T(rows(ax, sp, o), (q) => (q[1] > yA - 0.02 && Math.hypot(q[0], q[2]) < 0.2 ? 1 : 4), 0), T(rows(c3, sp, { ...o, w: (p) => 0.75 }), 4, 0)];
}
function echtBein(sp, A) {
  const B = ['bein/femur', 'bein/tibia', 'bein/fibula', 'bein/patella', 'bein/fuss'].map((k) => A[k]), b = bounds(...B), S = 2.16 / b.size[1];
  const o = { M: LIEGEND, c: [b.mid[0], b.mid[1], bounds(B[0]).mid[2]], s: S, t: [0, -0.2, 0], axis: 'x' };
  return [T(box([0, 1.0, 0], [2.3, 0.06, 0.12], sp), 4, 0),
    ...[-0.62, 0.52].flatMap((x) => [
      ...[-0.03, 0.03].map((z) => T(seg([x, 0.97, z], [x, -0.06, z], sp * 0.75), 2, 6, (p) => (0.97 - p[1]) / 1.03)),
      ...[-0.05, 0, 0.05].map((z) => T(line((t) => { const a = Math.PI + t * Math.PI; return [x + Math.cos(a) * 0.19, -0.08 + Math.sin(a) * 0.21, z]; }, sp * 0.72), 2, 6, 1))]),
    ...B.map((mm) => T(rows(mm, sp, o), 0, 6, 1)),
    // Haut als feiner Schleier
    T(tube([{ p: [-1.1, -0.17, 0], r: 0.2 }, { p: [-0.5, -0.19, 0], r: 0.175 }, { p: [-0.02, -0.2, 0], r: 0.13 }, { p: [0.35, -0.22, 0], r: 0.135 }, { p: [0.8, -0.2, 0], r: 0.09 }, { p: [1.0, -0.2, 0], r: 0.075 }], sp * 1.5, { capA: false, capB: false, core: false, w: (u, v) => 0.55 * Math.min(1, 0.15 + v * 5) }), 4, 6, 1, { cut: false }),
    GROUND(sp)];
}
function echtHand(sp, A) {
  const ha = A['hand/hand'], ra = A['hand/speiche'], el = A['hand/elle'], bh = bounds(ha), S = 0.08; // 20.11. nachts größer (Kai: „nachbessern“)
  // Hand liegt flach über dem Netz: Finger nach links, Handfläche nach unten
  const wr = meanOf(ha, (p) => p[1] > bh.hi[1] - 2), tip = meanOf(ha, (p) => p[1] < bh.lo[1] + 2.5);
  const [f0, , n0] = achsen(ha), f = V.mul(f0, V.dot(f0, V.sub(tip, wr)) > 0 ? 1 : -1), n = V.mul(n0, HAND_SEITE), w = V.cross(n, f), sg = 1; // Fingerrichtung und Flächen-Normale aus den Daten
  const o = { M: [-f[0], -f[1], -f[2], sg * n[0], sg * n[1], sg * n[2], w[0], w[1], w[2]], c: wr, s: S, t: [0.62, 0.36, 0], axis: 'x' };
  const arm = { ...o, w: (p) => 1 - 0.92 * smooth01(0.8, 1.32, p[0]), clip: (p) => p[0] < 1.36 };
  return [
    ...Array.from({ length: 7 }, (_, i) => T(seg([-1.15, -0.35, (i - 3) * 0.18], [1.15, -0.35, (i - 3) * 0.18], sp * 0.72, { w: (t) => 0.3 + 0.7 * Math.sin(Math.PI * t) ** 0.5 }), 2, 8)),
    ...Array.from({ length: 11 }, (_, i) => T(seg([(i - 5) * 0.23, -0.35, -0.54], [(i - 5) * 0.23, -0.35, 0.54], sp * 0.72, { w: () => 0.35 + 0.65 * Math.sin(Math.PI * i / 10) ** 0.5 }), 2, 8)),
    T(rows(ha, sp, o), 0, 0), T(rows(ra, sp, arm), 0, 0), T(rows(el, sp, arm), 0, 0)];
}
const HAND_SEITE = 1; // welche Seite der Hand oben liegt (Handrücken)

const GROUND = (sp, y = -0.75) => T(seg([-1.25, y, -0.4], [1.25, y, 0.4], sp * 0.8, { w: (t) => 0.75 * Math.sin(Math.PI * t) ** 0.5 }), 4, 0);
export const MOTIFS = [
  { name: 'Manuelle Therapie', parts: manualGrip, echt: echtKnie, se: 1.12 },
  // Hantel wird gehoben, darunter der Weg als Bogen
  { name: 'Krankengymnastik', s: 1.22, parts: (sp) => [
    T(cap([-0.5, 0, 0], [0.5, 0, 0], 0.042, sp), 0, 12),
    ...[-1, 1].flatMap((s) => [T(cyl([s * 0.5, 0, 0], 0.25, 0.1, sp, { axis: 'x' }), 0, 12), T(cyl([s * 0.63, 0, 0], 0.19, 0.09, sp, { axis: 'x' }), 4, 12), T(cyl([s * 0.72, 0, 0], 0.06, 0.06, sp, { axis: 'x' }), 0, 12)]),
    ...[-0.035, 0.035].map((z) => T(line((t) => { const a = -1.2 + t * 2.4; return [Math.sin(a) * 0.95, -0.5 + Math.cos(a) * 0.55, z]; }, sp * 0.75), 1, 2, (p) => (p[0] + 1) / 2)),
    GROUND(sp)] },
  // Ball springt, Tempo-Linien, Boden
  { name: 'Sport-Physiotherapie', s: 1.2, parts: (sp) => [
    T(ell([0.25, -0.05, 0], [0.33, 0.33, 0.33], sp, { axis: 'y' }), 0, 7),
    T(line((t) => { const a = t * 6.2831853; return [0.25 + Math.cos(a) * 0.336 * 0.5, -0.05 + Math.sin(a) * 0.336, -Math.cos(a) * 0.336 * 0.866]; }, sp * 0.7), 1, 7),
    T(line((t) => { const a = t * 6.2831853; return [0.25 + Math.cos(a) * 0.336 * 0.55, -0.05 + Math.sin(a) * 0.336, Math.cos(a) * 0.336 * 0.835]; }, sp * 0.7), 1, 7),
    ...[-0.14, 0.02, 0.18].flatMap((y, i) => [-0.03, 0.03].map((z) => T(seg([-1.2 + i * 0.12, y, z], [-0.3 + i * 0.05, y, z], sp * 0.75, { w: (t) => 0.25 + 0.75 * t }), 2, 2, (p) => (p[0] + 1.2) / 1.0))),
    GROUND(sp, -0.42)] },
  // drei Wellen (Bänder aus fünf Perlensträngen): gezackt → ruhig
  { name: 'Schmerztherapie', parts: (sp) => [-0.42, 0, 0.42].flatMap((y, i) => [-2, -1, 0, 1, 2].map((j) =>
    T(seg([-1.2, y, j * 0.055], [1.2, y, j * 0.055], sp * 0.72, { half: !!(j & 1), w: (t) => (1 - Math.abs(j) * 0.2) * (0.35 + 0.65 * Math.sin(Math.PI * t) ** 0.6) }), i === 0 ? 1 : i === 1 ? 0 : 2, 10, i / 2))) },
  // Unterkiefer öffnet sich; Kiefergelenke in Bernstein, oberer Zahnbogen ruht
  { name: 'CMD-Therapie', s: 1.5, echt: echtKiefer, se: 1.3, rot: -1.5, parts: (sp) => {
    const U = (y, rx, rz, r, n = 9) => Array.from({ length: n }, (_, i) => { const t = -1.5 + (i / (n - 1)) * 3.0; return { p: [Math.sin(t) * rx, y, Math.cos(t) * rz - 0.12], r }; });
    const parts = [T(tube(U(-0.33, 0.56, 0.5, 0.07), sp, { ref: [0, 1, 0], fl: 1.35 }), 0, 4), T(tube(U(0.04, 0.6, 0.52, 0.045), sp, { ref: [0, 1, 0], fl: 1.2 }), 4, 0)];
    [-1, 1].forEach((s) => {
      parts.push(T(tube([{ p: [s * 0.558, -0.34, -0.085], r: 0.075 }, { p: [s * 0.575, 0.0, -0.27], r: 0.07 }, { p: [s * 0.58, 0.27, -0.4], r: 0.058 }], sp), 0, 4));
      parts.push(T(ell([s * 0.58, 0.33, -0.42], [0.085, 0.065, 0.085], sp), 1, 4, 0, { grp: 1 }));
      parts.push(T(torus([s * 0.585, 0.42, -0.42], 0.1, 0.022, sp * 0.8, { axis: 'y' }), 1, 0, 0, { grp: 1 }));
    });
    for (let i = 0; i < 12; i++) {
      const t = -1.3 + (i / 11) * 2.6, big = Math.abs(t) > 0.75 ? 1.25 : 1;
      parts.push(T(cap([Math.sin(t) * 0.5, -0.25, Math.cos(t) * 0.45 - 0.12], [Math.sin(t) * 0.5, -0.185, Math.cos(t) * 0.45 - 0.12], 0.03 * big, sp * 0.8), 0, 4, 0, { grp: 2 }));
      parts.push(T(cap([Math.sin(t) * 0.52, -0.045, Math.cos(t) * 0.47 - 0.12], [Math.sin(t) * 0.52, -0.11, Math.cos(t) * 0.47 - 0.12], 0.03 * big, sp * 0.8), 0, 0, 0, { grp: 3 }));
    }
    return parts; } },
  // Atlas (Ring mit Seitenmassen und Querfortsätzen) dreht auf dem Axis; der Zahn des Axis in Bernstein
  { name: 'Atlas-Axis-Therapie', s: 1.25, echt: echtAtlas, se: 1.5, parts: (sp) => [
    T(torus([0, 0.25, -0.05], 0.48, 0.062, sp, { axis: 'y', fl: 1.15 }), 0, 3),
    ...[-1, 1].flatMap((s) => [T(ell([s * 0.42, 0.25, 0], [0.16, 0.12, 0.21], sp, { axis: 'z' }), 0, 3), T(tube([{ p: [s * 0.52, 0.25, 0], r: 0.07 }, { p: [s * 0.74, 0.262, -0.03], r: 0.058 }, { p: [s * 0.93, 0.27, -0.06], r: 0.05 }], sp), 0, 3)]),
    T(ell([0, -0.38, 0.12], [0.25, 0.26, 0.23], sp, { axis: 'y' }), 4, 0),
    T(cap([0, -0.15, 0.2], [0, 0.33, 0.22], [0.09, 0.07], sp), 1, 0, 0, { grp: 1 }),
    T(tube([{ p: [0, -0.3, -0.05], r: 0.08 }, { p: [0, -0.37, -0.35], r: 0.07 }, { p: [0, -0.42, -0.62], r: 0.055 }], sp), 4, 0),
    ...[-1, 1].map((s) => T(tube([{ p: [s * 0.2, -0.36, 0.1], r: 0.07 }, { p: [s * 0.5, -0.34, 0.02], r: 0.055 }, { p: [s * 0.72, -0.33, -0.06], r: 0.045 }], sp), 4, 0))] },
  // Handstück mit Applikator, Impulse laufen als Bögen ins Gewebe
  { name: 'Stoßwellen-Therapie', parts: (sp) => [
    T(tube([{ p: [-1.02, 0.87, 0], r: 0.1 }, { p: [-0.86, 0.71, 0], r: 0.135 }, { p: [-0.5, 0.36, 0], r: 0.135 }, { p: [-0.36, 0.22, 0], r: 0.1 }], sp), 0, 0),
    T(ell([-0.25, 0.11, 0], [0.165, 0.165, 0.165], sp, { axis: 'y' }), 1, 0, 0, { grp: 1 }),
    ...[0.3, 0.5, 0.7].map((f) => T(line((t) => { const a = t * 6.2831853, c = [-1.02 + f * 0.62, 0.87 - f * 0.61, 0], q = Math.SQRT1_2; return [c[0] + Math.cos(a) * 0.14 * q, c[1] + Math.cos(a) * 0.14 * q, Math.sin(a) * 0.14]; }, sp * 0.7), 4, 0)),
    T(line((t) => [-1.08 - t * 0.2, 0.93 + Math.sin(t * 3) * 0.12 + t * 0.15, 0], sp * 0.75, { w: (t) => 1 - 0.7 * t }), 4, 0),
    ...[0, 1, 2, 3, 4, 5].flatMap((i) => [-0.03, 0.03].map((z) => T(line((t) => { const a = -1.75 + t * 1.6, r = 0.22 + i * 0.18; return [-0.14 + Math.cos(a) * r, Math.sin(a) * r, z]; }, sp * 0.72, { w: () => 1 - i * 0.11 }), 1, 2, i / 5)))] },
  // Bein hängt in zwei Schlingen am Gestell und pendelt
  { name: 'Traktion im Schlingentisch', echt: echtBein, se: 1.12, parts: (sp) => [
    T(box([0, 1.0, 0], [2.3, 0.06, 0.12], sp), 4, 0),
    ...[-0.65, 0.55].flatMap((x) => [
      ...[-0.03, 0.03].map((z) => T(seg([x, 0.97, z], [x, -0.1, z], sp * 0.75), 2, 6, (p) => (0.97 - p[1]) / 1.07)),
      ...[-0.05, 0, 0.05].map((z) => T(line((t) => { const a = Math.PI + t * Math.PI; return [x + Math.cos(a) * 0.17, -0.12 + Math.sin(a) * 0.17, z]; }, sp * 0.72), 2, 6, 1))]),
    T(tube([{ p: [-1.08, -0.16, 0], r: 0.15 }, { p: [-0.5, -0.2, 0], r: 0.135 }, { p: [-0.08, -0.215, 0], r: 0.105 }, { p: [0.3, -0.24, 0], r: 0.115 }, { p: [0.75, -0.23, 0], r: 0.085 }, { p: [1.02, -0.22, 0], r: 0.062 }], sp, { capA: false, w: (u, v) => Math.min(1, 0.15 + v * 5) }), 0, 6, 1),
    T(tube([{ p: [1.03, -0.24, 0], r: 0.06 }, { p: [1.07, -0.08, 0], r: 0.058 }, { p: [1.09, 0.1, 0], r: 0.04 }], sp), 0, 6, 1),
    GROUND(sp)] },
  // Faszien als Netz, das unter der Hand wogt
  { name: 'Osteopathische Ansätze', echt: echtHand, se: 1.05, parts: (sp) => [
    ...Array.from({ length: 7 }, (_, i) => T(seg([-1.15, -0.35, (i - 3) * 0.18], [1.15, -0.35, (i - 3) * 0.18], sp * 0.72, { w: (t) => 0.3 + 0.7 * Math.sin(Math.PI * t) ** 0.5 }), 2, 8)),
    ...Array.from({ length: 11 }, (_, i) => T(seg([(i - 5) * 0.23, -0.35, -0.54], [(i - 5) * 0.23, -0.35, 0.54], sp * 0.72, { w: () => 0.35 + 0.65 * Math.sin(Math.PI * i / 10) ** 0.5 }), 2, 8)),
    ...flatHand(sp, 0.27).map((g) => T(moved(g, [-0.55, 0, 0]), 0, 0))] },
  // Thermische Behandlung: links Fangopackung mit aufsteigender Wärme, rechts Kältepackung mit Eiskristall (Kai 2.11.: Fango + Kälte als ein Thema)
  { name: 'Thermische Behandlung', s: 1.22, parts: (sp) => {
    const c = [0.6, 0.12, 0], parts = [T(box([-0.6, -0.35, 0], [0.8, 0.14, 0.5], sp), 1, 0), T(box([0.6, -0.35, 0], [0.72, 0.12, 0.46], sp), 2, 0)];
    [-0.85, -0.6, -0.35].forEach((x) => [-0.03, 0.03].forEach((z) => parts.push(T(line((t) => [x + Math.sin(t * 9) * 0.06, -0.24 + t * 0.95, z], sp * 0.72, { w: (t) => 1 - 0.75 * t }), 1, 5, (p) => (p[1] + 0.24) / 0.95))));
    for (let i = 0; i < 6; i++) {
      const a = i * 1.0471976, d = [Math.cos(a), Math.sin(a), 0], n = [-d[1], d[0], 0];
      parts.push(T(seg(vAdd(c, vSc(d, 0.03)), vAdd(c, vSc(d, 0.33)), sp * 0.7), 2, 2, (p) => Math.hypot(p[0] - c[0], p[1] - c[1]) / 0.33));
      for (const f of [0.17, 0.25]) for (const s of [-1, 1]) parts.push(T(seg(vAdd(c, vSc(d, f)), vAdd(vAdd(c, vSc(d, f + 0.07)), vSc(n, s * 0.07)), sp * 0.7), 2, 2, () => f / 0.33 + 0.25));
    }
    return parts; } },
  // Reizstrom: zwei Elektroden auf der Haut, dazwischen läuft der Impuls, Kabel nach unten
  { name: 'Reizstrom', s: 1.4, parts: (sp) => [
    ...[-0.5, 0.5].flatMap((x) => [T(box([x, -0.38, 0], [0.4, 0.05, 0.4], sp), 2, 0), T(cyl([x, -0.33, 0], 0.05, 0.05, sp * 0.8, { axis: 'y' }), 0, 0),
      ...[-0.025, 0.025].map((z) => T(line((t) => [x * (1 + t * 0.75), -0.4 - t * 0.42 + Math.sin(t * 3.1416) * 0.06, 0.24 + z], sp * 0.75, { w: (t) => 1 - 0.6 * t }), 4, 0))]),
    ...[-0.03, 0.03].map((z) => T(line((t) => [-0.5 + t * 1.0, -0.12 + Math.abs(Math.sin(t * 15.708)) * 0.2 * Math.sin(Math.PI * t) ** 0.4, z], sp * 0.7, { n: 400 }), 1, 9, (p) => (p[0] + 0.5))),
    T(seg([-0.9, -0.42, 0], [0.9, -0.42, 0], sp * 0.8, { w: (t) => 0.6 * Math.sin(Math.PI * t) ** 0.5 }), 4, 0)] },
  // Manuthera im Kleinen: Kopf-, Brust-, Mittel- und Beckenteil, das Beckenteil kippt
  // dieselbe Liege wie auf der großen Bühne (../manu/formen.js), ohne Figur; das Beckenteil kippt
  { name: 'Lojer Manuthera', s: 0.56, piv: [-0.1, 0.78, 0], parts: (sp) => manuFormen(sp * 1.05, { figur: false }).parts.map((q) =>
    T(moved(q.r, [-0.1, 0.78, 0]), q.kind === 1 ? 4 : q.kind === 0 && q.seg === 'LO' ? 1 : 0, q.seg === 'LO' ? 11 : 0, 0, { grp: q.grp })) },
];

// Ein Motiv ausrechnen: Punkte (Lage, Normale, Farbe, Deckkraft, Bewegung) und Kern-Dreiecke
function buildMotif(m, sp0, rnd, A) {
  const echt = !!(A && m.echt); m.sNow = (echt && m.se) || m.s || 1; m.rotNow = echt ? m.rot || 0 : 0;
  const sp = sp0 / m.sNow, def = echt ? m.echt : m.parts, parts = def(sp, A, m), P = [], K = []; // Motiv wird um s vergrößert gezeigt → enger rechnen, damit der Punktabstand im Bild gleich bleibt
  for (const { part, pts } of assemble(parts, sp)) for (const q of pts) P.push({ q, k: typeof part.k === 'function' ? part.k(q) : part.k, a: part.a, ph: typeof part.ph === 'function' ? part.ph(q) : part.ph });
  // Reihenfolge mischen (fester Zufall), damit die Teile beim Wechsel gleichmäßig wandern
  for (let a = P.length - 1; a > 0; a--) { const b = Math.floor(rnd() * (a + 1)), t = P[a]; P[a] = P[b]; P[b] = t; }
  for (const part of parts) { const A = part.g.tris; for (let i = 0; i < A.length; i += 6) K.push(A[i], A[i + 1], A[i + 2], A[i + 3], A[i + 4], A[i + 5], part.a, typeof part.ph === 'function' ? part.ph([A[i], A[i + 1], A[i + 2]]) : part.ph); }
  return { P, core: new Float32Array(K) };
}

// Als Generator (ein Motiv je Zeitscheibe, A1 4.11.2026); initServices() baut am Stück.
export const initServices = (canvas, ui = {}) => runSync(initServicesGen(canvas, ui));
export function* initServicesGen(canvas, ui = {}) { return yield* motifStageGen(canvas, ui, MOTIFS); }
// Dieselbe Bühne für andere Motiv-Listen (20.11. nachts: Entwurf „Stoßwelle in Punkten“, src/stosswelle-punkte).
// ui: anat (echte Knochen), isPaused, onShow, sp (Punktabstand), sway (Wiegen der Ansicht, Standard 0,35), cam { y, d, look } (Blick)
export function* motifStageGen(canvas, ui = {}, MOTIFS) {
  const st = stage(canvas, { fov: 30, transparent: true });
  if (!st) return null;
  const SP = ui.sp || (isDesktop() ? 0.034 : 0.04); // Abstand der Punkte auf der Oberfläche (Welt-Einheiten)
  const CAM = { y: 1.75, d: 5.0, look: -0.04, ...(ui.cam || {}) };
  const rnd = rng(20261120), built = [];
  const AN = ui.anat || null; // echte Knochen (oder null → gerechnete Motive)
  for (const m of MOTIFS) { yield; built.push(buildMotif(m, SP, rnd, AN)); yield; }
  const N = Math.max(...built.map((b) => b.P.length));
  // je Motiv feste Felder gleicher Länge; überzählige Plätze liegen unsichtbar (Deckkraft 0) auf Punkten des Motivs
  const sets = built.map(({ P, core }, mi) => {
    const pos = new Float32Array(N * 3), nrm = new Float32Array(N * 3), kind = new Float32Array(N), w = new Float32Array(N), anim = new Float32Array(N * 2);
    for (let i = 0; i < N; i++) { const s = P[i % P.length], q = s.q; pos.set([q[0], q[1], q[2]], i * 3); nrm.set([q[3], q[4], q[5]], i * 3); kind[i] = s.k; w[i] = i < P.length ? q[6] : 0; anim[i * 2] = s.a; anim[i * 2 + 1] = s.ph; }
    return { pos, nrm, kind, w, anim, core, n: P.length, s: MOTIFS[mi].sNow, rot: MOTIFS[mi].rotNow, piv: MOTIFS[mi].piv || [0, 0.4, -0.42] };
  });
  yield;
  const rndA = new Float32Array(N * 3); for (let i = 0; i < rndA.length; i++) rndA[i] = rnd();
  const g = new THREE.BufferGeometry(), s0 = sets[0];
  const A = new Float32Array(s0.pos), NA = new Float32Array(s0.nrm), KA = new Float32Array(s0.kind), WA = new Float32Array(s0.w);
  g.setAttribute('position', new THREE.BufferAttribute(A, 3));
  g.setAttribute('nrmA', new THREE.BufferAttribute(NA, 3));
  g.setAttribute('aKindA', new THREE.BufferAttribute(KA, 1));
  g.setAttribute('aWA', new THREE.BufferAttribute(WA, 1));
  g.setAttribute('pos2', new THREE.BufferAttribute(new Float32Array(s0.pos), 3));
  g.setAttribute('nrm2', new THREE.BufferAttribute(new Float32Array(s0.nrm), 3));
  g.setAttribute('aKind', new THREE.BufferAttribute(new Float32Array(s0.kind), 1));
  g.setAttribute('aW2', new THREE.BufferAttribute(new Float32Array(s0.w), 1));
  g.setAttribute('aAnim', new THREE.BufferAttribute(new Float32Array(s0.anim), 2));
  g.setAttribute('aRnd', new THREE.BufferAttribute(rndA, 3));
  // Farben wie die Figur: ruhige Fläche (tief) → heller Rand; 0 Knochen · 1 Bernstein · 2 Blau · 3 (frei) · 4 Petrol
  const U = {
    uT: { value: 1 }, uIn: { value: reduced ? 1 : 0 }, uTime: { value: 0 }, uPx: { value: 1 }, uPtr: { value: new THREE.Vector4(0, 0, 0.1, 0) }, uAsp: { value: 1 }, uInset: { value: 0.014 }, uSway: { value: ui.sway === undefined ? 0.35 : ui.sway }, uS: { value: s0.s }, uRot: { value: s0.rot }, uPiv: { value: new THREE.Vector3(...s0.piv) },
    cDeep: { value: [C('#44788E'), C('#A9661A'), C('#3F7FAE'), C('#44788E'), C('#2C5263')] },
    cHi: { value: [C('#E4E3D8'), C('#F2B04E'), C('#9CCBEB'), C('#E4E3D8'), C('#6FA3B8')] },
  };
  const pts = new THREE.Points(g, new THREE.ShaderMaterial({
    uniforms: U, transparent: true, depthWrite: false, depthTest: true,
    vertexShader: /* glsl */`
      attribute vec3 pos2, nrmA, nrm2, aRnd; attribute float aKind, aKindA, aWA, aW2; attribute vec2 aAnim;
      uniform float uT, uIn, uTime, uPx, uAsp, uS, uRot, uSway; uniform vec4 uPtr; uniform vec3 cDeep[5], cHi[5];
      varying vec3 vCol; varying float vA; varying float vSize;
      ` + PTR_GLSL + MOTION + /* glsl */`
      void main(){
        vec3 b = pos2, nb = nrm2;
        float al = motion(b, nb, aAnim.x, aAnim.y, uTime);
        b = rotY(b * uS, uRot); nb = rotY(nb, uRot); // Maßstab und Blickrichtung des Motivs (die Bewegung rechnet in den Maßen des Motivs)
        // Wechsel: jeder Punkt wandert zu seinem neuen Platz, unterwegs als feiner Staub
        float k = smoothstep(aRnd.y * .35, aRnd.y * .35 + .65, uT);
        vec3 dir = normalize(aRnd - .5 + 1e-4);
        float mid = sin(k * 3.14159);
        vec3 p = mix(position, b, k) + dir * mid * .2;
        vec3 n = mix(nrmA, nb, k);
        // Auftritt: von links nach rechts sammelt sich der Staub zum Motiv
        float li = clamp(uIn * 1.7 - clamp((b.x + 1.4) / 2.8, 0., 1.) * .7, 0., 1.); li = li * li * (3. - 2. * li);
        p += dir * (1. - li) * (1. - li) * (.35 + aRnd.z * .55);
        float sw = sin(uTime * .25) * uSway;
        p = rotY(p, sw); n = rotY(n, sw);
        vec4 mv = modelViewMatrix * vec4(p, 1.); gl_Position = projectionMatrix * mv;
        float dust = max(mid, 1. - li);
        // Kantenlicht (Linien haben keine Normale: gleichmäßig hell)
        float isLine = 1. - step(.25, dot(n, n));
        float facing = dot(normalize(n + 1e-5), normalize(cameraPosition - p));
        float rim = mix(pow(1. - clamp(facing, 0., 1.), 1.5), .7, isLine);
        float front = mix(mix(smoothstep(-.3, .05, facing), 1., isLine), 1., dust);
        int ka = int(aKindA + .5), kb = int(aKind + .5);
        vec3 col = mix(mix(cDeep[ka], cDeep[kb], k), mix(cHi[ka], cHi[kb], k), .2 + .8 * rim);
        float a = (.44 + .56 * rim) * front * mix(aWA, aW2 * al, k);
        a = mix(a, min(a, .6), dust) * smoothstep(0., .25, li);
        float pk = ptrK() * step(.02, a);
        float d = uPx * mix(1., .8, isLine) * mix(1., .55, dust) / -mv.z * (1. + pk * .5);
        vSize = max(1.6, d); gl_PointSize = vSize;
        float thin = d / vSize;
        vCol = mix(col, vec3(1., .95, .86), pk * .8);
        vA = clamp(a + (1. - a) * pk * .7, 0., 1.) * thin * thin;
      }`,
    fragmentShader: /* glsl */`
      varying vec3 vCol; varying float vA; varying float vSize;
      void main(){
        float d = length(gl_PointCoord - .5), aa = min(.25, 1.3 / vSize);
        float a = (1. - smoothstep(.5 - aa, .5, d)) * vA;
        if (a < .004) discard;
        gl_FragColor = vec4(vCol, a);
        #include <colorspace_fragment>
      }`,
  }));
  pts.frustumCulled = false; st.scene.add(pts);
  // Kern: schreibt nur Tiefe (keine Farbe) → verdeckt die Rückseite und was dahinter liegt, vor jedem Hintergrund
  const NC = Math.max(...sets.map((s) => s.core.length / 8));
  const cg = new THREE.BufferGeometry(), CB = new Float32Array(NC * 8), ib = new THREE.InterleavedBuffer(CB, 8);
  cg.setAttribute('position', new THREE.InterleavedBufferAttribute(ib, 3, 0));
  cg.setAttribute('normal', new THREE.InterleavedBufferAttribute(ib, 3, 3));
  cg.setAttribute('aAnim', new THREE.InterleavedBufferAttribute(ib, 2, 6));
  const setCore = (i) => { CB.fill(0); CB.set(sets[i].core); ib.needsUpdate = true; cg.setDrawRange(0, sets[i].core.length / 8); };
  setCore(0);
  const core = new THREE.Mesh(cg, new THREE.ShaderMaterial({
    uniforms: U, side: THREE.DoubleSide, colorWrite: false,
    vertexShader: /* glsl */`
      attribute vec2 aAnim; uniform float uTime, uInset, uS, uRot, uSway;` + MOTION + /* glsl */`
      void main(){
        vec3 b = position - normal * uInset, n = normal;
        motion(b, n, aAnim.x, aAnim.y, uTime);
        b = rotY(b * uS, uRot + sin(uTime * .25) * uSway);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(b, 1.);
      }`,
    fragmentShader: 'void main(){ gl_FragColor = vec4(0.); }',
  }));
  core.frustumCulled = false; core.renderOrder = -1; st.scene.add(core);

  let cur = 0, t = 0;
  const PV = [0, 0, 0.1, 0];
  function show(i) {
    if (i === cur || i < 0 || i >= sets.length) return;
    // aktuellen Zwischenstand als neuen Start übernehmen (ohne Sprung)
    const B = g.attributes.pos2.array, NB = g.attributes.nrm2.array, KB = g.attributes.aKind.array, WB = g.attributes.aW2.array, u = U.uT.value, sOld = U.uS.value, cR = Math.cos(U.uRot.value), sR = Math.sin(U.uRot.value);
    for (let n = 0; n < N; n++) {
      const r = rndA[n * 3 + 1] * 0.35, x = Math.min(1, Math.max(0, (u - r) / 0.65)), k = x * x * (3 - 2 * x);
      const bx = (cR * B[n * 3] + sR * B[n * 3 + 2]) * sOld, bz = (-sR * B[n * 3] + cR * B[n * 3 + 2]) * sOld, nx = cR * NB[n * 3] + sR * NB[n * 3 + 2], nz = -sR * NB[n * 3] + cR * NB[n * 3 + 2];
      A[n * 3] += (bx - A[n * 3]) * k; A[n * 3 + 1] += (B[n * 3 + 1] * sOld - A[n * 3 + 1]) * k; A[n * 3 + 2] += (bz - A[n * 3 + 2]) * k;
      NA[n * 3] += (nx - NA[n * 3]) * k; NA[n * 3 + 1] += (NB[n * 3 + 1] - NA[n * 3 + 1]) * k; NA[n * 3 + 2] += (nz - NA[n * 3 + 2]) * k;
      WA[n] += (WB[n] - WA[n]) * k;
      KA[n] = k > 0.5 ? KB[n] : KA[n];
    }
    const s = sets[i];
    B.set(s.pos); NB.set(s.nrm); KB.set(s.kind); WB.set(s.w); g.attributes.aAnim.array.set(s.anim);
    ['position', 'nrmA', 'aKindA', 'aWA', 'pos2', 'nrm2', 'aKind', 'aW2', 'aAnim'].forEach((a) => (g.attributes[a].needsUpdate = true));
    setCore(i); U.uS.value = s.s; U.uRot.value = s.rot; U.uPiv.value.set(...s.piv);
    U.uT.value = reduced ? 1 : 0; cur = i;
    ui.onShow && ui.onShow(i, MOTIFS[i].name);
  }
  function update(_t, dt) {
    const still = ui.isPaused && ui.isPaused();
    // Auftritt: kommt die Bühne (wieder) ins Bild, sammelt sich das Motiv aus feinem Staub – über die Zeit, nicht am Scrollweg
    // (erst wenn sie zu gut einem Drittel im Bild steht; war sie ganz draußen, beginnt der Auftritt beim nächsten Mal von vorn)
    const cr = canvas.getBoundingClientRect(), vh = innerHeight, seen = Math.min(cr.bottom, vh) - Math.max(cr.top, 0);
    if (seen <= 0) { if (!reduced && !still) U.uIn.value = 0; return; }
    if (seen < Math.min(cr.height, vh) * 0.36 && U.uIn.value <= 0) dt = 0;
    if (still) { dt = 0; U.uIn.value = 1; U.uT.value = 1; }
    t += dt * (reduced ? 0.5 : 1);
    U.uTime.value = t;
    U.uIn.value = Math.min(1, U.uIn.value + dt / 1.9);
    if (U.uIn.value > 0.55) U.uT.value = Math.min(1, U.uT.value + dt / 1.9);
    core.visible = U.uT.value >= 1 && U.uIn.value >= 1;
    U.uPx.value = st.renderer.getPixelRatio() * st.h * 0.5 / Math.tan(THREE.MathUtils.degToRad(15)) * SP * 0.62;
    if (pointer.k() > 0 || U.uPtr.value.w > 0) { U.uPtr.value.fromArray(pointer.ndc(st.renderer.domElement.getBoundingClientRect(), PV, 50)); U.uAsp.value = st.aspect; }
    // breite, niedrige Bühne (Handy: Streifen über der Liste): näher heran, die Höhe begrenzt dort das Motiv
    const wide = Math.min(1, Math.max(0, (st.aspect - 1.3) / 0.5));
    const d = (CAM.d - 0.9 * wide * wide * (3 - 2 * wide)) * (st.aspect < 1.15 ? 1.15 / st.aspect : 1);
    st.camera.position.set(0, CAM.y, d); st.camera.lookAt(0, CAM.look, 0);
  }
  ui.onShow && ui.onShow(0, MOTIFS[0].name);
  // Lage eines Punkts des Motivs auf der Zeichenfläche (CSS-Bildpunkte) – für Beschriftungen in HTML
  const _pv = new THREE.Vector3();
  const project = (q) => { const sc = U.uS.value, an = U.uRot.value + Math.sin(U.uTime.value * 0.25) * U.uSway.value, x = q[0] * sc, z = q[2] * sc; _pv.set(Math.cos(an) * x + Math.sin(an) * z, q[1] * sc, -Math.sin(an) * x + Math.cos(an) * z).project(st.camera); return [(_pv.x * 0.5 + 0.5) * st.w, (-_pv.y * 0.5 + 0.5) * st.h]; };
  return { st, update, show, project, ready: () => U.uIn.value >= 1, counts: sets.map((s) => s.n), get current() { return cur; } };
}
