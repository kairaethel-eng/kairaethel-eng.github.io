// Praxis-Innenraum als Punktwolke („Scan“-Optik), aufgebaut aus dem V10-Grundriss.
// Koordinaten = Form-Koordinaten des Partikel-Hauses (Boden y = −3, Front/Eingang = +z).
// Später austauschbar gegen einen echten Scan: gleiche Rückgabe { pos, nor, kind, room, count }.
import * as THREE from 'three';

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
  { key: 'b2', n: 'Behandlungsraum 2 · Manuthera', short: 'Behandlung 2', r: [232, 96, 176, 80], d: 'Hier steht die Loyer Manuthera, eine der modernsten Therapieliegen für mobilisierende Behandlungen der Wirbelsäule und großer Gelenke.', ther: ['Loyer Manuthera', 'Manuelle Therapie'] },
  { key: 'training', n: 'Trainingsfläche', short: 'Training', r: [232, 180, 176, 88], d: 'Aktiv werden: Geräte, Übungen und Ihr persönliches Programm für zuhause. Angeleitet und begleitet, nicht allein gelassen.', ther: ['Krankengymnastik', 'Sport-Physiotherapie', 'Traktion im Schlingentisch'] },
];
export function roomOf(px, py) {
  for (let i = 0; i < ROOMS.length; i++) { const [x, y, w, h] = ROOMS[i].r; if (px >= x && px <= x + w && py >= y && py <= y + h) return i; }
  return 5; // Flur
}
// Art: 0 Boden-Raster, 1 Wand, 2 Möbel hell, 3 Pflanze, 4 Akzent (Bernstein), 5 Polster (Petrol), 6 Kante (hell)
export function praxisPoints(N) {
  const prims = [];
  const WEIGHT = { 0: 1, 1: 1, 2: 5, 3: 3, 4: 5, 5: 5, 6: 1 }; // Möbel dichter als Boden und Wände
  const add = (area, fn, kind) => prims.push({ area: area * WEIGHT[kind], fn, kind });
  const rnd = Math.random;
  // Quader (Mitte cx,cz in Form-Koord., Unterkante y), Maße in Metern
  function box(px, py, wm, hm, dm, kind, yb = 0, dens = 1, rotY = 0) {
    const [cx, cz] = P(px, py), w = wm * M, h = hm * M, d = dm * M, y = Y0 + yb * M;
    const c = Math.cos(rotY), s = Math.sin(rotY);
    const faces = [[w * h, 'z', 1], [w * h, 'z', -1], [d * h, 'x', 1], [d * h, 'x', -1], [w * d, 'y', 1]];
    faces.forEach(([a, ax, sg]) => add(a * dens, (p, n) => {
      let lx, ly, lz;
      if (ax === 'z') { lx = (rnd() - 0.5) * w; ly = rnd() * h; lz = sg * d / 2; n.set(0, 0, sg); }
      else if (ax === 'x') { lx = sg * w / 2; ly = rnd() * h; lz = (rnd() - 0.5) * d; n.set(sg, 0, 0); }
      else { lx = (rnd() - 0.5) * w; ly = h; lz = (rnd() - 0.5) * d; n.set(0, 1, 0); }
      p.set(cx + c * lx + s * lz, y + ly, cz - s * lx + c * lz); n.set(c * n.x + s * n.z, n.y, -s * n.x + c * n.z);
    }, kind));
  }
  function cyl(px, py, rm, hm, kind, yb = 0, dens = 1) {
    const [cx, cz] = P(px, py), r = rm * M, h = hm * M, y = Y0 + yb * M;
    add(2 * Math.PI * r * h * dens, (p, n) => { const a = rnd() * 6.283; n.set(Math.cos(a), 0, Math.sin(a)); p.set(cx + n.x * r, y + rnd() * h, cz + n.z * r); }, kind);
    add(Math.PI * r * r * dens, (p, n) => { const a = rnd() * 6.283, rr = Math.sqrt(rnd()) * r; n.set(0, 1, 0); p.set(cx + Math.cos(a) * rr, y + h, cz + Math.sin(a) * rr); }, kind);
  }
  function sphere(px, py, rm, kind, yc, dens = 1, sy = 1) {
    const [cx, cz] = P(px, py), r = rm * M, y = Y0 + yc * M;
    add(4 * Math.PI * r * r * dens, (p, n) => { const u = rnd() * 2 - 1, a = rnd() * 6.283, q = Math.sqrt(1 - u * u); n.set(q * Math.cos(a), u, q * Math.sin(a)); p.set(cx + n.x * r, y + n.y * r * sy, cz + n.z * r); }, kind);
  }
  function line(ax, ay, bx, by, ym, kind, dens = 1) { // Linie auf Höhe ym (Meter), z. B. Wandoberkante
    const [x0, z0] = P(ax, ay), [x1, z1] = P(bx, by), len = Math.hypot(x1 - x0, z1 - z0);
    add(len * 0.06 * dens, (p, n) => { const t = rnd(); n.set(0, 1, 0); p.set(x0 + (x1 - x0) * t, Y0 + ym * M, z0 + (z1 - z0) * t); }, kind);
  }
  function plant(px, py, hm, big = 1) {
    cyl(px, py, 0.18 * big, 0.35 * big, 4, 0, 1.2);
    for (let i = 0; i < 5 + big * 3; i++) {
      const a = rnd() * 6.283, rr = rnd() * 0.25 * big;
      sphere(px + Math.cos(a) * rr / (K / M), py + Math.sin(a) * rr / (K / M), (0.18 + rnd() * 0.16) * big, 3, 0.45 * big + rnd() * hm, 1.4, 0.8);
    }
  }
  function pendant(px, py, ym) {
    line(px, py, px, py + 0.01, ym, 6, 0.2);
    cyl(px, py, 0.22, 0.2, 4, ym - 0.2, 3);
  }

  // Boden: Raster aus Punkten (Scan-Optik)
  const step = 0.2;
  for (let gx = -3.1; gx <= 3.1; gx += step) add(4.3 * 0.07, (p, n) => { n.set(0, 1, 0); p.set(gx, Y0, -2.1 + rnd() * 4.3); }, 0);
  for (let gz = -2.08; gz <= 2.2; gz += step) add(6.3 * 0.07, (p, n) => { n.set(0, 1, 0); p.set(-3.12 + rnd() * 6.24, Y0, gz); }, 0);

  // Wände (Grundriss V10) – Flächen dünn, Oberkanten als helle Linie
  const walls = [
    [8, 8, 412, 8], [8, 8, 8, 272], [412, 8, 412, 272], [8, 272, 182, 272], [216, 272, 412, 272],
    [12, 140, 70, 140], [108, 140, 166, 140],
    [166, 12, 166, 40], [166, 78, 166, 182], [166, 220, 166, 268],
    [232, 12, 232, 30], [232, 70, 232, 112], [232, 152, 232, 196], [232, 240, 232, 268],
    [232, 94, 408, 94], [232, 178, 408, 178],
  ];
  walls.forEach(([x1, y1, x2, y2]) => {
    const [a, b] = P(x1, y1), [c, d] = P(x2, y2), len = Math.hypot(c - a, d - b), horiz = y1 === y2;
    add(len * HW * 1.3, (p, n) => { const t = rnd(), s = rnd() < 0.5 ? 1 : -1; p.set(a + (c - a) * t + (horiz ? 0 : s * 0.02), Y0 + rnd() * HW, b + (d - b) * t + (horiz ? s * 0.02 : 0)); n.set(horiz ? 0 : s, 0, horiz ? s : 0); }, 1);
    line(x1, y1, x2, y2, 2.9, 6, 7); line(x1, y1, x2, y2, 0.02, 6, 3);
  });

  // Empfang: Tresen (L-Form), Tasse, Pendelleuchte, Pflanze, runder Teppich
  box(70, 52, 2.0, 1.05, 0.6, 2); box(112, 72, 0.6, 1.05, 1.3, 2);
  cyl(55, 50, 0.05, 0.1, 4, 1.05, 4);
  pendant(70, 52, 2.3); plant(30, 30, 1.1, 1.2); plant(150, 122, 0.8, 0.8);
  add(Math.PI * 0.45 * 0.45 * 2, (p, n) => { const [cx, cz] = P(80, 106); const a = rnd() * 6.283, rr = 0.42 + rnd() * 0.04; n.set(0, 1, 0); p.set(cx + Math.cos(a) * rr, Y0 + 0.005, cz + Math.sin(a) * rr); }, 4);
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
  // Behandlung 2: Manuthera (segmentiert), Schrank
  cyl(320, 136, 0.22, 0.5, 2);
  [-0.62, 0, 0.6].forEach((dx, i) => box(320 + (dx * M) / K, 136, 0.58, 0.12, 0.62, i === 1 ? 4 : 5, 0.55 + Math.abs(dx) * 0.1, 1.4));
  box(372, 106, 1.2, 0.9, 0.4, 2); pendant(320, 136, 2.3);
  // Training: Matten, Ball, Hanteln, Sprossenwand, Schlingentisch-Rahmen
  box(290, 236, 0.62, 0.03, 1.8, 5, 0, 1.5); box(290, 206, 0.62, 0.03, 1.8, 2, 0, 1.5);
  sphere(362, 240, 0.33, 4, 0.33, 2.5);
  for (let i = 0; i < 4; i++) cyl(345 + i * 8, 204, 0.06, 0.08, 2, 0.45, 3);
  for (let j = 0; j < 12; j++) line(402, 196, 402, 230, 0.15 + j * 0.2, 6, 2);
  [[340, 188], [390, 188], [340, 204], [390, 204]].forEach(([x, y]) => cyl(x, y, 0.025, 2.3, 6, 0, 4));
  line(340, 188, 390, 188, 2.3, 6, 6); line(340, 204, 390, 204, 2.3, 6, 6);
  [352, 365, 378].forEach((x) => cyl(x, 196, 0.1, 0.06, 4, 1.0, 6));
  // Flur: Läufer
  add(0.4 * 2.6, (p, n) => { const [cx, cz] = P(199, 150); n.set(0, 1, 0); p.set(cx + (rnd() - 0.5) * 0.35, Y0 + 0.004, cz + (rnd() - 0.5) * 2.9); }, 4);

  // Verteilen nach Fläche
  const total = prims.reduce((s, q) => s + q.area, 0);
  const pos = new Float32Array(N * 3), nor = new Float32Array(N * 3), kind = new Float32Array(N), room = new Float32Array(N);
  const p = new THREE.Vector3(), n = new THREE.Vector3();
  let i = 0;
  prims.forEach((q, qi) => {
    const cnt = qi === prims.length - 1 ? N - i : Math.round((q.area / total) * N);
    for (let k = 0; k < cnt && i < N; k++, i++) {
      q.fn(p, n);
      pos.set([p.x, p.y, p.z], i * 3); nor.set([n.x, n.y, n.z], i * 3); kind[i] = q.kind;
      room[i] = roomOf(p.x / K + 210, p.z / K + 140);
    }
  });
  return { pos, nor, kind, room, count: i };
}
