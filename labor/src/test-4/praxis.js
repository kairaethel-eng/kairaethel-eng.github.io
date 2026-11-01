// Praxis-Innenraum als Punktwolke („Scan“-Optik), aufgebaut aus dem V10-Grundriss.
// Koordinaten = Form-Koordinaten des Partikel-Hauses (Boden y = −3, Front/Eingang = +z).
// „Gestochen“ wie Wirbelsäule und Manuthera: Wände/Boden/Kanten als gleichmäßige Scan-Linien,
// Möbel als echte Körper mit gleichmäßig gesetzten Punkten (Mindestabstand) und dunklem Kern.
// Später austauschbar gegen einen echten Scan (Punkte + optional Kern-Geometrie).
import * as THREE from 'three';
import { stipple, coreOf } from '../manu/stipple.js';

const K = 0.0149;                       // Grundriss-Pixel → Form-Einheiten
const M = 0.5;                          // Meter → Form-Einheiten
const Y0 = -3;                          // Boden
const HW = 2.9 * M;                     // Wandhöhe (2,9 m)
export const EYE = Y0 + 1.65 * M;       // Augenhöhe
export const P = (x, y) => [(x - 210) * K, (y - 140) * K];
export const ROOMS = [
  { key: 'empfang', n: 'Empfang & Ankommen', short: 'Empfang', r: [12, 12, 154, 126], d: 'Die Tür ist offen, der Weg ist kurz: Hier werden Sie mit Namen begrüßt, nicht mit Nummer aufgerufen. Jacke ablegen, durchatmen, ankommen.', ther: [] },
  { key: 'warte', n: 'Wartebereich – unser Wohnzimmer', short: 'Wartebereich', r: [12, 142, 154, 126], d: 'Eher Wohnzimmer als Wartezimmer: bequeme Sitze, Wasser und Kaffee, kurze Wartezeiten. Ein Ort, an dem niemand auf die Uhr schauen muss.', ther: [] },
  { key: 'b1', n: 'Behandlungsraum 1', short: 'Behandlung 1', r: [232, 12, 176, 80], d: 'Ruhe und Tageslicht. Hier ist Zeit für Befund, Behandlung und alle Ihre Fragen, hinter geschlossener Tür und ohne Durchgangsverkehr.', ther: ['Manuelle Therapie', 'CMD-Therapie', 'Atlas-Axis-Therapie', 'Osteopathische Ansätze', 'Schmerztherapie', 'Fango · Reizstrom', 'Stoßwelle'] },
  { key: 'b2', n: 'Behandlungsraum 2 · Manuthera', short: 'Behandlung 2', r: [232, 96, 176, 80], d: 'Hier steht die Lojer Manuthera 242, eine der modernsten Therapieliegen für mobilisierende Behandlungen der Wirbelsäule und großer Gelenke.', ther: ['Lojer Manuthera', 'Manuelle Therapie'] },
  { key: 'training', n: 'Trainingsfläche', short: 'Training', r: [232, 180, 176, 88], d: 'Aktiv werden: Geräte, Übungen und Ihr persönliches Programm für zuhause. Angeleitet und begleitet, nicht allein gelassen.', ther: ['Krankengymnastik', 'Sport-Physiotherapie', 'Traktion im Schlingentisch'] },
];
export const SPINE_AT = [250, 80]; // Wirbelsäulen-Modell in Behandlung 1 (Grundriss-Pixel)
export function roomOf(px, py) {
  for (let i = 0; i < ROOMS.length; i++) { const [x, y, w, h] = ROOMS[i].r; if (px >= x && px <= x + w && py >= y && py <= y + h) return i; }
  return 5; // Flur
}
// Art: 0 Boden-Raster, 1 Wand, 2 Möbel hell, 3 Pflanze, 4 Akzent (Bernstein), 5 Polster (Petrol), 6 Kante (hell)
// Rückgabe: lines = leuchtende Scan-Linien (Art 0, 1, 6), furn = gestochene Möbelpunkte, core = Kern der Möbel
export function praxisScan(nFurn, fine = 1) {
  const rnd = Math.random;
  const L = { pos: [], nor: [], kind: [], room: [] };
  const lp = (x, y, z, nx, ny, nz, k) => { L.pos.push(x, y, z); L.nor.push(nx, ny, nz); L.kind.push(k); L.room.push(roomOf(x / K + 210, z / K + 140)); };
  // gleichmäßig gepunktete Strecke (Form-Koordinaten)
  const seg = (x0, y0, z0, x1, y1, z1, ds, k) => {
    const len = Math.hypot(x1 - x0, y1 - y0, z1 - z0), n = Math.max(1, Math.round(len / ds));
    for (let i = 0; i <= n; i++) { const t = i / n; lp(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, z0 + (z1 - z0) * t, 0, 1, 0, k); }
  };
  const DS = 0.022 / fine;

  // Boden: Raster aus gleichmäßig gepunkteten Linien
  for (let gx = -3.1; gx <= 3.1001; gx += 0.2) seg(gx, Y0, -2.1, gx, Y0, 2.2, DS * 1.5, 0);
  for (let gz = -2.08; gz <= 2.2001; gz += 0.2) seg(-3.12, Y0, gz, 3.12, Y0, gz, DS * 1.5, 0);

  // Wände (Grundriss V10): waagerechte Scan-Zeilen, Ober- und Unterkante als helle Linie
  const walls = [
    [8, 8, 412, 8], [8, 8, 8, 272], [412, 8, 412, 272], [8, 272, 182, 272], [216, 272, 412, 272],
    [12, 140, 70, 140], [108, 140, 166, 140],
    [166, 12, 166, 40], [166, 78, 166, 182], [166, 220, 166, 268],
    [232, 12, 232, 30], [232, 70, 232, 112], [232, 152, 232, 196], [232, 240, 232, 268],
    [232, 94, 408, 94], [232, 178, 408, 178],
  ];
  const ROWS = Math.round(16 * fine);
  walls.forEach(([x1, y1, x2, y2]) => {
    const [a, b] = P(x1, y1), [c, d] = P(x2, y2);
    for (let r = 1; r < ROWS; r++) seg(a, Y0 + (r / ROWS) * HW, b, c, Y0 + (r / ROWS) * HW, d, DS * 1.3, 1);
    seg(a, Y0 + HW, b, c, Y0 + HW, d, DS * 0.5, 6);
    seg(a, Y0 + 0.01, b, c, Y0 + 0.01, d, DS * 0.8, 6);
    // senkrechte Kanten an den Wandenden
    seg(a, Y0, b, a, Y0 + HW, b, DS * 0.6, 6); seg(c, Y0, d, c, Y0 + HW, d, DS * 0.6, 6);
  });

  // Möbel als echte Körper
  const parts = [], flat = [];
  const id = (v) => ({ la: v, lb: v, a: 0, b: 0, w: 0 });
  const part = (geo, kind, dens = 1) => parts.push({ geo, kind, dens, map: id, keep: (n) => n.y > -0.5 });
  function box(px, py, wm, hm, dm, kind, yb = 0, dens = 1, rotY = 0) {
    const [cx, cz] = P(px, py), w = wm * M, h = hm * M, d = dm * M, y = Y0 + yb * M;
    const g = new THREE.BoxGeometry(w, h, d); g.translate(0, h / 2, 0); if (rotY) g.rotateY(rotY); g.translate(cx, y, cz);
    part(g, kind, dens);
  }
  function cyl(px, py, rm, hm, kind, yb = 0, dens = 1) {
    const [cx, cz] = P(px, py), r = rm * M, h = hm * M, y = Y0 + yb * M;
    const g = new THREE.CylinderGeometry(r, r, h, Math.max(10, Math.round(r * 160)), 1); g.translate(cx, y + h / 2, cz);
    part(g, kind, dens);
  }
  function sphere(px, py, rm, kind, yc, dens = 1, sy = 1) {
    const [cx, cz] = P(px, py), r = rm * M, y = Y0 + yc * M;
    const g = new THREE.SphereGeometry(r, 18, 12); g.scale(1, sy, 1); g.computeVertexNormals(); g.translate(cx, y, cz);
    part(g, kind, dens);
  }
  function line(ax, ay, bx, by, ym, kind) { const [x0, z0] = P(ax, ay), [x1, z1] = P(bx, by); seg(x0, Y0 + ym * M, z0, x1, Y0 + ym * M, z1, DS * 0.6, kind); }
  function vline(px, py, y0m, y1m, kind) { const [x, z] = P(px, py); seg(x, Y0 + y0m * M, z, x, Y0 + y1m * M, z, DS * 0.6, kind); }
  function plant(px, py, hm, big = 1) {
    cyl(px, py, 0.18 * big, 0.35 * big, 4, 0, 1.2);
    for (let i = 0; i < 5 + big * 3; i++) {
      const a = rnd() * 6.283, rr = rnd() * 0.25 * big;
      sphere(px + Math.cos(a) * rr / (K / M), py + Math.sin(a) * rr / (K / M), (0.18 + rnd() * 0.16) * big, 3, 0.45 * big + rnd() * hm, 1.4, 0.8);
    }
  }
  function pendant(px, py, ym) { vline(px, py, ym, 2.9, 6); cyl(px, py, 0.22, 0.2, 4, ym - 0.2, 3); }
  function disc(px, py, rm, kind, dens = 1) { // flach am Boden (Teppich): ohne Kern
    const [cx, cz] = P(px, py), g = new THREE.CircleGeometry(rm * M, 40); g.rotateX(-Math.PI / 2); g.translate(cx, Y0 + 0.004, cz);
    parts.push({ geo: g, kind, dens, map: id, core: false });
  }
  function runner(px, py, wm, dm, kind) {
    const [cx, cz] = P(px, py), g = new THREE.PlaneGeometry(wm * M, dm * M); g.rotateX(-Math.PI / 2); g.translate(cx, Y0 + 0.004, cz);
    parts.push({ geo: g, kind, dens: 0.6, map: id, core: false });
  }

  const SPINE_MODEL = [];
  {
    const [mx, mz] = [250, 80];
    SPINE_MODEL.push(() => cyl(mx, mz, 0.2, 0.03, 6));               // Fuß
    SPINE_MODEL.push(() => cyl(mx, mz, 0.014, 0.95, 6, 0.03, 3));    // Stange
    SPINE_MODEL.push(() => sphere(mx, mz, 0.16, 2, 0.98, 1.6, 0.55)); // Becken
    for (let i = 0; i < 22; i++) {                                     // Wirbel mit S-Kurve (Lordose/Kyphose)
      const f = i / 21, y = 1.08 + f * 0.62, r = 0.05 - f * 0.022, off = Math.sin(f * Math.PI * 2) * 0.03;
      SPINE_MODEL.push(() => sphere(mx, mz + off / (K / M), r, 2, y, 2.2, 0.55));
    }
    SPINE_MODEL.push(() => sphere(mx, mz, 0.085, 2, 1.8, 2, 1.1));     // Hinterhaupt
  }
  // Empfang: Tresen (L-Form), Tasse, Pendelleuchte, Pflanzen, runder Teppich
  box(70, 52, 2.0, 1.05, 0.6, 2); box(112, 72, 0.6, 1.05, 1.3, 2);
  box(70, 52, 2.04, 0.05, 0.64, 6, 1.05, 2); // Tresenplatte (helle Kante)
  cyl(55, 50, 0.05, 0.1, 4, 1.1, 4);
  pendant(70, 52, 2.3); plant(30, 30, 1.1, 1.2); plant(150, 122, 0.8, 0.8);
  disc(80, 106, 0.9, 4, 0.5);
  // Wartebereich: Sofa, Sessel, Tisch, Stehleuchte, Pflanzen
  box(70, 250, 2.2, 0.42, 0.9, 5); box(70, 262, 2.2, 0.85, 0.22, 5); box(33, 250, 0.22, 0.62, 0.9, 5); box(107, 250, 0.22, 0.62, 0.9, 5);
  box(140, 205, 0.85, 0.42, 0.85, 5, 0, 1, 0.5); box(146, 216, 0.85, 0.8, 0.2, 5, 0, 1, 0.5);
  cyl(78, 198, 0.42, 0.45, 2);
  cyl(152, 255, 0.03, 1.55, 6); cyl(152, 255, 0.24, 0.32, 4, 1.45, 2);
  plant(28, 162, 1.4, 1.4);
  // Behandlung 1: Liege, Hocker, Schrank, Fango-Wagen, Pflanze, Leuchte
  box(320, 48, 2.0, 0.12, 0.7, 5, 0.6); box(320, 48, 1.7, 0.6, 0.5, 2, 0, 0.4); box(282, 48, 0.42, 0.06, 0.4, 2, 0.72);
  cyl(272, 70, 0.2, 0.55, 5); box(372, 20, 1.2, 0.9, 0.4, 2); plant(398, 80, 0.8, 0.8);
  box(262, 24, 0.6, 0.85, 0.45, 2, 0, 0.6); box(262, 24, 0.36, 0.06, 0.26, 4, 0.85, 4);
  pendant(320, 48, 2.3);
  // Wirbelsäulen-Modell auf Ständer (Anschauungsmodell, wie in vielen Praxen)
  SPINE_MODEL.forEach((q) => q());
  // Behandlung 2: Manuthera (segmentiert, Polster bernstein = Highlight), Säule, Schrank
  cyl(320, 136, 0.22, 0.5, 2);
  [-0.62, 0, 0.6].forEach((dx, i) => box(320 + (dx * M) / K, 136, 0.58, 0.12, 0.62, i === 1 ? 4 : 5, 0.55 + Math.abs(dx) * 0.1, 1.6));
  box(372, 106, 1.2, 0.9, 0.4, 2); pendant(320, 136, 2.3);
  // Training: Matten, Ball, Hanteln, Sprossenwand, Schlingentisch-Rahmen
  box(290, 236, 0.62, 0.03, 1.8, 5, 0, 1.5); box(290, 206, 0.62, 0.03, 1.8, 2, 0, 1.5);
  sphere(362, 240, 0.33, 4, 0.33, 2.5);
  for (let i = 0; i < 4; i++) cyl(345 + i * 8, 204, 0.06, 0.08, 2, 0.45, 3);
  for (let j = 0; j < 12; j++) line(402, 196, 402, 230, 0.15 + j * 0.2, 6);
  vline(402, 196, 0, 2.4, 6); vline(402, 230, 0, 2.4, 6);
  [[340, 188], [390, 188], [340, 204], [390, 204]].forEach(([x, y]) => cyl(x, y, 0.025, 2.3, 6, 0, 4));
  line(340, 188, 390, 188, 2.3, 6); line(340, 204, 390, 204, 2.3, 6);
  [352, 365, 378].forEach((x) => cyl(x, 196, 0.1, 0.06, 4, 1.0, 6));
  // Flur: Läufer
  runner(199, 150, 0.7, 5.8, 4);

  const st = stipple(parts, nFurn);
  const core = coreOf(parts);
  const roomAttr = (g) => {
    const P3 = g.attributes.position.array, r = new Float32Array(P3.length / 3);
    for (let i = 0; i < r.length; i++) r[i] = roomOf(P3[i * 3] / K + 210, P3[i * 3 + 2] / K + 140);
    g.setAttribute('aRoom', new THREE.BufferAttribute(r, 1));
    return g;
  };
  const lg = new THREE.BufferGeometry();
  lg.setAttribute('position', new THREE.Float32BufferAttribute(L.pos, 3));
  lg.setAttribute('normal', new THREE.Float32BufferAttribute(L.nor, 3));
  lg.setAttribute('aKind', new THREE.Float32BufferAttribute(L.kind, 1));
  lg.setAttribute('aRoom', new THREE.Float32BufferAttribute(L.room, 1));
  return { lines: lg, furn: roomAttr(st.geo), spacing: st.spacing, core: roomAttr(core), count: L.kind.length + st.count };
}
