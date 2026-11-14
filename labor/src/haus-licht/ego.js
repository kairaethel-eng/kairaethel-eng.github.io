// Rundgang aus Augenhöhe im Linienstil (Go Kai 14.11.2026, Variante 3A): Raum für Raum in Zentralperspektive,
// gezeichnet als SVG – kein WebGL. Jeder Raum ist ein kleines 3D-Modell in Metern (Kisten, Linien, „Aufsteller“),
// das mit einer festen Kamera (Augenhöhe 1,55 m, Blick zur Rückwand) projiziert wird. Verdeckung per Maler-Verfahren
// (Flächen mit dunkler Füllung, von hinten nach vorn), Rückseiten weg. Die Zeichnung passt sich jeder Bühnengröße an.
// Pro Station drei Schichten (Zeichnung → Foto → später Scan): .ego-media nimmt Foto bzw. Scan auf.

// ---------- Maße (schematisch, kein echter Grundriss) ----------
const W = 4.2, H = 2.75, D = 4.6, EYE = 1.55, CZ = 0.2, NEAR = 0.08;
const HFOV = 78 * Math.PI / 180, VFOV = 60 * Math.PI / 180;

// ---------- Bausteine ----------
// Kiste (achsparallel), optional um die z-Achse geneigt (o.rz, Drehpunkt o.pivot = [x, y]) – Teile der Manuthera
const box = (x0, x1, y0, y1, z0, z1, o = {}) => ({ t: 'box', c: corners(x0, x1, y0, y1, z0, z1, o.rz, o.pivot), cls: o.cls || '' });
function corners(x0, x1, y0, y1, z0, z1, rz, pivot) {
  const c = [];
  for (let i = 0; i < 8; i++) {
    let p = [i & 1 ? x1 : x0, i & 2 ? y1 : y0, i & 4 ? z1 : z0];
    if (rz) {
      const [px, py] = pivot, dx = p[0] - px, dy = p[1] - py, cs = Math.cos(rz), sn = Math.sin(rz);
      p = [px + dx * cs - dy * sn, py + dx * sn + dy * cs, p[2]];
    }
    c.push(p);
  }
  return c;
}
const FACES = [[0, 2, 6, 4], [1, 3, 7, 5], [0, 1, 5, 4], [2, 3, 7, 6], [0, 1, 3, 2], [4, 5, 7, 6]];
// Säule als Prisma (n Seiten) – ein Objekt
function prism(x, z, r, y0, y1, n = 14, cls = '') {
  const quads = [];
  for (let k = 0; k < n; k++) {
    const a0 = (k / n) * Math.PI * 2, a1 = ((k + 1) / n) * Math.PI * 2;
    quads.push([[x + r * Math.cos(a0), y0, z + r * Math.sin(a0)], [x + r * Math.cos(a1), y0, z + r * Math.sin(a1)], [x + r * Math.cos(a1), y1, z + r * Math.sin(a1)], [x + r * Math.cos(a0), y1, z + r * Math.sin(a0)]]);
  }
  const top = []; for (let k = 0; k < n; k++) { const a = (k / n) * Math.PI * 2; top.push([x + r * Math.cos(a), y1, z + r * Math.sin(a)]); }
  return { t: 'prism', quads, top, ctr: [x, (y0 + y1) / 2, z], cls };
}
// Linienzug in 3D (nur Strich)
const line = (pts, cls = '') => ({ t: 'line', p: pts, cls });
// Aufsteller: 2D-Pfad in Metern (u rechts, v oben), steht im Raum an (x, y, z) und blickt zur Kamera
const bill = (x, y, z, cmds, cls = '') => ({ t: 'bill', a: [x, y, z], cmds, cls });
// Rechteck auf einer Wand (Fenster, Bild, Spiegel): Ebene 'back' (z = D), 'left' (x = −W/2), 'right' (x = W/2)
function wallRect(wall, a0, a1, y0, y1) {
  if (wall === 'back') return [[a0, y0, D], [a1, y0, D], [a1, y1, D], [a0, y1, D]];
  const x = wall === 'left' ? -W / 2 : W / 2;
  return [[x, y0, a0], [x, y0, a1], [x, y1, a1], [x, y1, a0]];
}
const plane = (pts, cls) => ({ t: 'plane', p: pts, cls });
function windowOn(wall, a0, a1, y0 = 1.0, y1 = 2.15) {
  const am = (a0 + a1) / 2, ym = (y0 + y1) / 2, P = (a, y) => wallRect(wall, a, a, y, y)[0];
  return [plane(wallRect(wall, a0, a1, y0, y1), 'win'), line([P(am, y0), P(am, y1)], 'wl'), line([P(a0, ym), P(a1, ym)], 'wl'), line([P(a0 - 0.08, y0 - 0.05), P(a1 + 0.08, y0 - 0.05)], 'wl')];
}
const doorOn = (wall, a0, a1, cls = 'door') => plane(wallRect(wall, a0, a1, 0, 2.1), cls);
// Pflanze im Topf (Aufsteller)
const plant = (x, z, s = 1, y = 0) => bill(x, y, z, [
  ['M', -0.17 * s, 0.34 * s], ['L', 0.17 * s, 0.34 * s], ['L', 0.13 * s, 0], ['L', -0.13 * s, 0], ['Z'],
  ['M', 0, 0.34 * s], ['C', -0.05 * s, 0.7 * s, -0.35 * s, 0.95 * s, -0.45 * s, 1.15 * s],
  ['M', 0, 0.34 * s], ['C', 0.05 * s, 0.75 * s, 0.25 * s, 1.0 * s, 0.4 * s, 1.25 * s],
  ['M', 0, 0.34 * s], ['C', 0, 0.8 * s, -0.08 * s, 1.15 * s, -0.02 * s, 1.45 * s],
  ['M', 0, 0.34 * s], ['C', 0.1 * s, 0.6 * s, 0.4 * s, 0.7 * s, 0.55 * s, 0.75 * s],
  ['M', 0, 0.34 * s], ['C', -0.12 * s, 0.55 * s, -0.4 * s, 0.6 * s, -0.55 * s, 0.6 * s],
], 'leaf');
const stool = (x, z) => [prism(x, z, 0.04, 0, 0.5, 6), prism(x, z, 0.2, 0.5, 0.56, 16, 'seat')];

// ---------- Die fünf Räume ----------
const L = -W / 2, R = W / 2;
export const ROOMS = [
  { // 01 Empfang: Haustür links, Tresen, Garderobe, Bank
    items: () => [
      doorOn('left', 1.0, 2.0, 'door front'), doorOn('right', 1.3, 2.3),
      ...windowOn('back', -1.6, -0.6),
      box(-0.3, 1.5, 0, 1.0, 3.3, 3.85), box(-0.38, 1.58, 1.0, 1.06, 3.2, 3.9, { cls: 'top' }),
      box(0.95, 1.5, 0, 1.0, 2.55, 3.3), box(0.87, 1.58, 1.0, 1.06, 2.47, 3.3, { cls: 'top' }),
      box(0.2, 0.75, 1.13, 1.48, 3.62, 3.68, { cls: 'hot' }), box(0.44, 0.52, 1.06, 1.13, 3.62, 3.7),
      plant(1.25, 3.55, 0.45, 1.06),
      prism(L + 0.35, 2.75, 0.03, 0, 1.8, 6), line([[L + 0.15, 1.7, 2.75], [L + 0.55, 1.7, 2.75]]), line([[L + 0.35, 1.8, 2.55], [L + 0.35, 1.8, 2.95]]),
      box(L, L + 0.4, 0.42, 0.48, 3.2, 4.3), box(L, L + 0.4, 0, 0.42, 3.25, 3.32), box(L, L + 0.4, 0, 0.42, 4.18, 4.25),
    ],
  },
  { // 02 Wartebereich: Sofa, Sessel, Tischchen, Pflanze, Bild
    items: () => [
      doorOn('left', 1.3, 2.3), doorOn('right', 1.3, 2.3),
      plane(wallRect('back', -0.7, 0.7, 1.35, 2.05), 'pic'),
      box(-1.25, 1.25, 0.08, 0.44, 3.75, 4.55), box(-1.25, 1.25, 0.44, 0.9, 4.32, 4.55), box(-1.25, -1.02, 0.44, 0.66, 3.75, 4.32), box(1.02, 1.25, 0.44, 0.66, 3.75, 4.32),
      line([[-0.1, 0.44, 3.75], [-0.1, 0.44, 4.32]]), line([[0.1, 0.44, 3.75], [0.1, 0.44, 4.32]]),
      box(-0.5, 0.5, 0.34, 0.39, 2.75, 3.3, { cls: 'top' }), box(-0.45, -0.41, 0, 0.34, 2.8, 2.84), box(0.41, 0.45, 0, 0.34, 2.8, 2.84), box(-0.45, -0.41, 0, 0.34, 3.21, 3.25), box(0.41, 0.45, 0, 0.34, 3.21, 3.25),
      plane([[-1.4, 0.005, 2.5], [1.4, 0.005, 2.5], [1.4, 0.005, 4.3], [-1.4, 0.005, 4.3]], 'rug'),
      box(L + 0.15, L + 0.9, 0.08, 0.44, 3.05, 3.75), box(L + 0.15, L + 0.33, 0.44, 0.88, 3.05, 3.75), box(L + 0.15, L + 0.9, 0.44, 0.62, 3.05, 3.2), box(L + 0.15, L + 0.9, 0.44, 0.62, 3.6, 3.75),
      prism(1.72, 3.9, 0.24, 0, 0.5, 18, 'top'), bill(1.72, 0.5, 3.9, [['M', -0.05, 0], ['L', -0.05, 0.1], ['L', 0.05, 0.1], ['L', 0.05, 0]], 'hot'),
      plant(-1.72, 4.3, 1.0),
    ],
  },
  { // 03 Behandlung 1: Liege, Hocker, Wirbelsäulen-Modell, Schrank
    items: () => [
      doorOn('left', 1.3, 2.3), doorOn('right', 1.3, 2.3),
      ...windowOn('back', 0.3, 1.3),
      box(-0.36, 0.36, 0.64, 0.75, 2.05, 3.95, { cls: 'top' }), box(-0.34, 0.34, 0.75, 0.82, 3.5, 3.92, { cls: 'top' }),
      box(-0.18, 0.18, 0.12, 0.64, 2.75, 3.25), box(-0.32, 0.32, 0, 0.12, 2.35, 3.65),
      ...stool(0.95, 2.55),
      box(R - 0.45, R, 0, 0.95, 3.0, 4.45), line([[R - 0.45, 0.48, 3.0], [R - 0.45, 0.48, 4.45]]), line([[R - 0.45, 0, 3.72], [R - 0.45, 0.95, 3.72]]),
      prism(-1.55, 4.05, 0.02, 0, 0.95, 6), box(-1.75, -1.35, 0, 0.04, 3.85, 4.25),
      line([[-1.55, 0.95, 4.05], [-1.5, 1.08, 4.05], [-1.57, 1.22, 4.05], [-1.62, 1.36, 4.05], [-1.56, 1.5, 4.05], [-1.5, 1.6, 4.05], [-1.54, 1.72, 4.05]], 'hot'),
      ...[1.0, 1.12, 1.24, 1.36, 1.48, 1.6].map((y, k) => line([[-1.62 + (k % 2) * 0.03, y, 4.05], [-1.47 - (k % 2 ? 0 : 0.03), y, 4.05]], 'hot')),
      bill(-1.54, 1.78, 4.05, [['O', 0, 0, 0.06]], 'hot'),
    ],
  },
  { // 04 Behandlung 2: Lojer Manuthera von der Seite (Kopf-, Brust-, Beckenteil einzeln geneigt), Hocker, Schrank
    items: () => [
      doorOn('left', 1.3, 2.3), doorOn('right', 1.3, 2.3),
      ...windowOn('back', 0.6, 1.6),
      plane(wallRect('back', -1.6, -0.6, 1.3, 2.0), 'pic'),
      box(-0.75, 0.75, 0, 0.1, 2.75, 3.35), box(-0.15, 0.15, 0.1, 0.52, 2.9, 3.2), box(-0.8, 0.8, 0.52, 0.6, 2.77, 3.33),
      box(-1.28, -0.64, 0.6, 0.71, 2.72, 3.38, { rz: -0.22, pivot: [-0.64, 0.66], cls: 'hot' }),
      box(-0.6, 0.22, 0.6, 0.71, 2.72, 3.38, { cls: 'hot' }),
      box(0.26, 1.18, 0.6, 0.71, 2.72, 3.38, { rz: 0.16, pivot: [0.26, 0.66], cls: 'hot' }),
      ...stool(-1.45, 2.35),
      box(R - 0.45, R, 0, 0.95, 3.6, 4.5), line([[R - 0.45, 0.48, 3.6], [R - 0.45, 0.48, 4.5]]),
    ],
  },
  { // 05 Training: Sprossenwand, Matte, Ball, Hantelablage, Spiegel, Schlingentisch-Rahmen
    items: () => [
      doorOn('left', 1.3, 2.3),
      plane(wallRect('back', -0.2, 1.6, 0.25, 2.15), 'mirror'),
      line([[L + 0.08, 0, 2.7], [L + 0.08, 2.45, 2.7]]), line([[L + 0.08, 0, 3.5], [L + 0.08, 2.45, 3.5]]),
      ...Array.from({ length: 10 }, (_, k) => line([[L + 0.08, 0.2 + k * 0.24, 2.7], [L + 0.08, 0.2 + k * 0.24, 3.5]])),
      box(-0.45, 1.0, 0, 0.03, 2.3, 4.0, { cls: 'top' }),
      bill(1.45, 0, 3.0, [['O', 0, 0.33, 0.33], ['M', -0.31, 0.42], ['C', -0.1, 0.3, 0.1, 0.3, 0.31, 0.42]], 'hot ball'),
      box(R - 0.45, R, 0, 0.7, 3.5, 4.45, { cls: 'top' }),
      ...[3.65, 3.9, 4.15].map((z) => bill(R - 0.22, 0.7, z, [['M', -0.13, 0.06], ['L', 0.13, 0.06], ['M', -0.13, 0.0], ['L', -0.13, 0.12], ['M', 0.13, 0.0], ['L', 0.13, 0.12]])),
      line([[-1.2, 0, 4.1], [-1.2, 2.2, 4.1], [-0.4, 2.2, 4.1], [-0.4, 0, 4.1]]), line([[-1.2, 2.2, 4.1], [-1.2, 2.2, 4.5]]), line([[-0.4, 2.2, 4.1], [-0.4, 2.2, 4.5]]),
      line([[-0.95, 2.2, 4.25], [-0.95, 1.0, 4.25]], 'rope'), line([[-0.65, 2.2, 4.25], [-0.65, 1.0, 4.25]], 'rope'),
    ],
  },
];

// ---------- Projektion ----------
const f3 = (n) => n.toFixed(1);
// o.cx: Fluchtpunkt waagrecht (PC: Mitte der freien Fläche neben dem Text), o.fitW: Breite, in die der Raum passen soll
function makeCam(sw, sh, o = {}) {
  const fw = o.fitW || sw, f = Math.min(fw / (2 * Math.tan(HFOV / 2)), sh / (2 * Math.tan(VFOV / 2)));
  return { f, cx: o.cx ?? sw / 2, cy: sh * 0.5, sw, sh };
}
const toCam = (p) => [p[0], p[1] - EYE, p[2] - CZ];
const proj = (cam, q) => [cam.cx + cam.f * q[0] / q[2], cam.cy - cam.f * q[1] / q[2]];
function clipPoly(qs) { // Sutherland–Hodgman an der Nahebene
  const out = [];
  for (let i = 0; i < qs.length; i++) {
    const a = qs[i], b = qs[(i + 1) % qs.length], ia = a[2] >= NEAR, ib = b[2] >= NEAR;
    if (ia) out.push(a);
    if (ia !== ib) { const t = (NEAR - a[2]) / (b[2] - a[2]); out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, NEAR]); }
  }
  return out;
}
function clipSeg(a, b) {
  const ia = a[2] >= NEAR, ib = b[2] >= NEAR;
  if (!ia && !ib) return null;
  if (ia && ib) return [a, b];
  const t = (NEAR - a[2]) / (b[2] - a[2]), m = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, NEAR];
  return ia ? [a, m] : [m, b];
}
const polyStr = (cam, pts) => { const q = clipPoly(pts.map(toCam)); return q.length < 3 ? '' : q.map((p) => proj(cam, p).map(f3).join(',')).join(' '); };
function lineStr(cam, pts) {
  let d = '';
  for (let i = 0; i < pts.length - 1; i++) {
    const s = clipSeg(toCam(pts[i]), toCam(pts[i + 1])); if (!s) continue;
    const a = proj(cam, s[0]), b = proj(cam, s[1]);
    d += `M${f3(a[0])} ${f3(a[1])}L${f3(b[0])} ${f3(b[1])}`;
  }
  return d;
}
const depth = (p) => { const q = toCam(p); return Math.hypot(q[0], q[1], q[2]); };
const avg = (ps) => ps.reduce((s, p) => [s[0] + p[0] / ps.length, s[1] + p[1] / ps.length, s[2] + p[2] / ps.length], [0, 0, 0]);
const camPos = [0, EYE, CZ];
const facing = (ctr, fc) => { const n = [fc[0] - ctr[0], fc[1] - ctr[1], fc[2] - ctr[2]], v = [fc[0] - camPos[0], fc[1] - camPos[1], fc[2] - camPos[2]]; return n[0] * v[0] + n[1] * v[1] + n[2] * v[2] < 0; };

function billPath(cam, a, cmds) {
  const q = toCam(a); if (q[2] < NEAR) return '';
  const [sx, sy] = proj(cam, q), k = cam.f / q[2], X = (u) => f3(sx + u * k), Y = (v) => f3(sy - v * k);
  let d = '';
  for (const c of cmds) {
    if (c[0] === 'M' || c[0] === 'L') d += `${c[0]}${X(c[1])} ${Y(c[2])}`;
    else if (c[0] === 'C') d += `C${X(c[1])} ${Y(c[2])} ${X(c[3])} ${Y(c[4])} ${X(c[5])} ${Y(c[6])}`;
    else if (c[0] === 'Z') d += 'Z';
    else if (c[0] === 'O') { const r = c[3] * k; d += `M${f3(sx + c[1] * k - r)} ${Y(c[2])}a${f3(r)} ${f3(r)} 0 1 0 ${f3(2 * r)} 0a${f3(r)} ${f3(r)} 0 1 0 ${f3(-2 * r)} 0Z`; }
  }
  return d;
}

// ---------- Ein Raum als SVG ----------
export function renderRoom(i, sw, sh, o) {
  const cam = makeCam(sw, sh, o), room = ROOMS[i];
  const P = (pts) => polyStr(cam, pts);
  // Hülle: Boden, Decke, Wände
  const shell = [
    `<polygon class="s-floor" points="${P([[L, 0, 0], [R, 0, 0], [R, 0, D], [L, 0, D]])}"/>`,
    `<polygon class="s-ceil" points="${P([[L, H, 0], [R, H, 0], [R, H, D], [L, H, D]])}"/>`,
    `<polygon class="s-wall" points="${P([[L, 0, 0], [L, 0, D], [L, H, D], [L, H, 0]])}"/>`,
    `<polygon class="s-wall" points="${P([[R, 0, 0], [R, 0, D], [R, H, D], [R, H, 0]])}"/>`,
    `<polygon class="s-back" points="${P([[L, 0, D], [R, 0, D], [R, H, D], [L, H, D]])}"/>`,
  ];
  let boards = '';
  for (let x = L + 0.6; x < R - 0.1; x += 0.6) boards += lineStr(cam, [[x, 0, 0], [x, 0, D]]);
  boards += lineStr(cam, [[L, 0.08, 0], [L, 0.08, D], [R, 0.08, D], [R, 0.08, 0]]); // Sockelleiste
  // Lampe: Hängeleuchte über der Raummitte
  const lampZ = D * 0.58, lampY = H - 0.62, lq = toCam([0, lampY, lampZ]), [lx, ly] = proj(cam, lq), lk = cam.f / lq[2];
  const pool = []; for (let k = 0; k < 28; k++) { const a = (k / 28) * Math.PI * 2; pool.push([Math.cos(a) * 1.7, 0.003, lampZ + Math.sin(a) * 1.25]); }
  // Möbel: alle Flächen/Linien sammeln, nach Abstand sortieren (hinten zuerst)
  const draw = [];
  // Maler-Verfahren je Objekt: Objekte nach Abstand ihrer Mitte (hinten zuerst), innerhalb eines Objekts die Flächen
  const poly = (pts, cls) => { const s = P(pts); return s ? `<polygon class="f ${cls}" points="${s}"/>` : ''; };
  for (const it of room.items()) {
    if (it.t === 'box') {
      const ctr = avg(it.c), fs = [];
      for (const f of FACES) { const pts = f.map((k) => it.c[k]), fc = avg(pts); if (facing(ctr, fc)) fs.push([depth(fc), poly(pts, it.cls)]); }
      fs.sort((a, b) => b[0] - a[0]);
      draw.push([depth(ctr), fs.map((x) => x[1]).join('')]);
    } else if (it.t === 'prism') {
      const fs = [];
      for (const q of it.quads) { const fc = avg(q); if (facing(it.ctr, fc)) fs.push([depth(fc), poly(q, it.cls)]); }
      fs.sort((a, b) => b[0] - a[0]);
      let out = fs.map((x) => x[1]).join('');
      if (camPos[1] > it.top[0][1]) out += poly(it.top, it.cls); // Deckel nur von oben sichtbar
      draw.push([depth(it.ctr), out]);
    } else if (it.t === 'plane') {
      const s = P(it.p); if (s) draw.push([-1e3 + (it.cls === 'rug' ? 1 : 0), `<polygon class="${it.cls}" points="${s}"/>`]);
    } else if (it.t === 'line') {
      const d = lineStr(cam, it.p); if (d) draw.push([Math.max(...it.p.map(depth)) - 0.01, `<path class="l ${it.cls}" d="${d}"/>`]);
    } else if (it.t === 'bill') {
      const d = billPath(cam, it.a, it.cmds); if (d) draw.push([depth(it.a), `<path class="b ${it.cls}" d="${d}"/>`]);
    }
  }
  // Wandflächen (Fenster, Türen, Bilder) gehören direkt auf die Wand: vor allen Möbeln zeichnen
  draw.sort((a, b) => (a[0] < -500 || b[0] < -500 ? a[0] - b[0] : b[0] - a[0]));
  const flat = draw.filter((d) => d[0] < -500).map((d) => d[1]).join('');
  const furn = draw.filter((d) => d[0] >= -500).map((d) => d[1]).join('');
  const lamp = `<path class="lamp-cord" d="M${f3(lx)} ${f3(proj(cam, toCam([0, H, lampZ]))[1])}V${f3(ly)}"/>` +
    `<path class="lamp" d="M${f3(lx - 0.24 * lk)} ${f3(ly + 0.2 * lk)}C${f3(lx - 0.24 * lk)} ${f3(ly + 0.02 * lk)} ${f3(lx - 0.12 * lk)} ${f3(ly)} ${f3(lx)} ${f3(ly)}S${f3(lx + 0.24 * lk)} ${f3(ly + 0.02 * lk)} ${f3(lx + 0.24 * lk)} ${f3(ly + 0.2 * lk)}Z"/>` +
    `<circle class="bulb" cx="${f3(lx)}" cy="${f3(ly + 0.22 * lk)}" r="${f3(Math.max(2, 0.05 * lk))}"/>`;
  const gid = `eg${i}`;
  return `<svg class="ego-svg" viewBox="0 0 ${f3(sw)} ${f3(sh)}" preserveAspectRatio="xMidYMid slice" aria-hidden="true">` +
    `<defs><radialGradient id="${gid}a" gradientUnits="userSpaceOnUse" cx="${f3(lx)}" cy="${f3(ly + 0.25 * lk)}" r="${f3(Math.max(sw, sh) * 0.62)}"><stop offset="0" stop-color="#F0B660" stop-opacity=".42"/><stop offset=".35" stop-color="#E09A35" stop-opacity=".16"/><stop offset="1" stop-color="#E09A35" stop-opacity="0"/></radialGradient>` +
    `<radialGradient id="${gid}b"><stop offset="0" stop-color="#F0B660" stop-opacity=".3"/><stop offset="1" stop-color="#E09A35" stop-opacity="0"/></radialGradient></defs>` +
    `<g class="shell">${shell.join('')}<path class="boards" d="${boards}"/></g>${flat}` +
    `<polygon class="pool" fill="url(#${gid}b)" points="${P(pool)}"/>` +
    `<rect class="glow" width="100%" height="100%" fill="url(#${gid}a)"/>` +
    `<g class="furn">${furn}</g><g class="lampg">${lamp}</g></svg>`;
}
