// Zielformen für das Partikelfeld. Jede Funktion liefert N Punkte (x,y,z) um den Ursprung, Höhe ≈ 8.
import * as THREE from 'three';
import { MeshSurfaceSampler } from 'three/examples/jsm/math/MeshSurfaceSampler.js';
import { buildSpineGen, rootCurves } from '../shared/spine.js';
import { runSync, every, poissonGrid, bounds } from '../shared/slice.js';

const rand = Math.random;

// ---------- 0 · Körper (Vorderansicht) ----------
export const BODY_W = 200, BODY_H = 430, BODY_SCALE = 8.2 / 430;
// Spannungszonen (Grundriss-Koordinaten wie in V10): Kiefer, Nacken/Schultern, Lendenwirbelsäule, Knie
export const HOTSPOTS = [
  { x: 100, y: 56, r: 12, k: 0.7, n: 'Kiefer' },
  { x: 100, y: 84, r: 20, k: 1, n: 'Nacken' },
  { x: 70, y: 96, r: 16, k: 0.9, n: 'Schulter' },
  { x: 130, y: 96, r: 16, k: 0.9, n: 'Schulter' },
  { x: 100, y: 196, r: 24, k: 1, n: 'Rücken' },
  { x: 82, y: 318, r: 11, k: 0.55, n: 'Knie' },
  { x: 118, y: 318, r: 11, k: 0.55, n: 'Knie' },
];

function drawBody(ctx, s) {
  ctx.save(); ctx.scale(s, s);
  ctx.fillStyle = '#fff'; ctx.strokeStyle = '#fff'; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.ellipse(100, 36, 19, 25, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.moveTo(91, 54); ctx.lineTo(90, 80); ctx.lineTo(110, 80); ctx.lineTo(109, 54); ctx.closePath(); ctx.fill();
  // Rumpf
  ctx.beginPath();
  ctx.moveTo(90, 76);
  ctx.quadraticCurveTo(66, 80, 58, 92);
  ctx.quadraticCurveTo(54, 120, 62, 150);
  ctx.quadraticCurveTo(68, 176, 68, 196);
  ctx.quadraticCurveTo(62, 214, 64, 232);
  ctx.lineTo(136, 232);
  ctx.quadraticCurveTo(138, 214, 132, 196);
  ctx.quadraticCurveTo(132, 176, 138, 150);
  ctx.quadraticCurveTo(146, 120, 142, 92);
  ctx.quadraticCurveTo(134, 80, 110, 76);
  ctx.closePath(); ctx.fill();
  // Arme
  const limb = (pts, w0, w1) => {
    for (let i = 0; i < pts.length - 1; i++) {
      ctx.lineWidth = w0 + (w1 - w0) * (i / (pts.length - 1));
      ctx.beginPath(); ctx.moveTo(...pts[i]); ctx.lineTo(...pts[i + 1]); ctx.stroke();
    }
  };
  limb([[60, 96], [50, 130], [45, 162], [41, 196], [37, 226]], 20, 13);
  limb([[140, 96], [150, 130], [155, 162], [159, 196], [163, 226]], 20, 13);
  ctx.beginPath(); ctx.ellipse(36, 238, 8, 13, 0.15, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(164, 238, 8, 13, -0.15, 0, Math.PI * 2); ctx.fill();
  // Beine
  limb([[83, 228], [81, 270], [80, 318], [78, 360], [77, 400]], 32, 18);
  limb([[117, 228], [119, 270], [120, 318], [122, 360], [123, 400]], 32, 18);
  ctx.beginPath(); ctx.ellipse(74, 412, 15, 7, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(126, 412, 15, 7, 0, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

export function bodyPoints(N) {
  const S = 2, W = BODY_W * S, H = BODY_H * S;
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const ctx = cv.getContext('2d', { willReadFrequently: true });
  drawBody(ctx, S);
  const data = ctx.getImageData(0, 0, W, H).data;
  // Maske und Zeilen-Spannweiten einmal vorab (A1: statt je Punkt nach links/rechts zu suchen)
  const mask = new Uint8Array(W * H), runL = new Int16Array(W * H), runR = new Int16Array(W * H);
  for (let i = 0; i < W * H; i++) mask[i] = data[i * 4 + 3] > 128 ? 1 : 0;
  for (let y = 0; y < H; y++) {
    const o = y * W;
    for (let x = 0; x < W; x++) {
      if (!mask[o + x]) continue;
      let r = x; while (r + 1 < W && mask[o + r + 1]) r++;
      for (let k = x; k <= r; k++) { runL[o + k] = x; runR[o + k] = r; }
      x = r;
    }
  }
  const inside = (x, y) => x >= 0 && y >= 0 && x < W && y < H && mask[y * W + x] === 1;
  // Zeilen-Spannweiten für Tiefe (runde Volumen)
  const spanAt = (x, y) => [runL[y * W + x], runR[y * W + x]];
  const pos = new Float32Array(N * 3), heat = new Float32Array(N);
  let i = 0, guard = 0;
  while (i < N && guard++ < N * 60) {
    const x = (rand() * W) | 0, y = (rand() * H) | 0;
    if (!inside(x, y)) continue;
    const edge = !inside(x - 3, y) || !inside(x + 3, y) || !inside(x, y - 3) || !inside(x, y + 3);
    if (!edge && rand() < 0.42) continue; // Kanten etwas dichter
    const [l, r] = spanAt(x, y);
    const c = (l + r) / 2, hw = Math.max(1, (r - l) / 2);
    const u = (x - c) / hw;
    const depth = Math.sqrt(Math.max(0, 1 - u * u)) * hw * 0.62 / S;
    const bx = x / S, by = y / S;
    pos[i * 3] = (bx - BODY_W / 2) * BODY_SCALE;
    pos[i * 3 + 1] = (BODY_H / 2 - by) * BODY_SCALE;
    pos[i * 3 + 2] = (rand() < 0.5 ? -1 : 1) * depth * BODY_SCALE * (edge ? rand() : 0.7 + rand() * 0.3);
    let h = 0;
    for (let k = 0; k < HOTSPOTS.length; k++) { const p = HOTSPOTS[k], ex = bx - p.x, ey = by - p.y, d2 = (ex * ex + ey * ey) / (p.r * p.r); h = Math.max(h, p.k * Math.exp(-d2 * 0.9)); }
    heat[i] = h;
    i++;
  }
  return { pos, heat };
}

// ---------- 2 · Wirbelsäule ----------
// Eine Säule für Morph-Ziel und gestochene Darstellung (nur einmal bauen)
let SPINE = null;
function* spineOnce() { if (!SPINE) SPINE = yield* buildSpineGen(); return SPINE; }
export const spinePoints = (N) => runSync(spinePointsGen(N));
export function* spinePointsGen(N) {
  const sp = yield* spineOnce();
  const geos = [];
  sp.group.updateMatrixWorld(true);
  for (const m of sp.vertebrae.concat(sp.discs)) {
    const g = m.geometry.clone().applyMatrix4(m.matrixWorld);
    geos.push(g.index ? g.toNonIndexed() : g);
    yield;
  }
  const merged = new THREE.BufferGeometry();
  let total = 0; geos.forEach((g) => (total += g.attributes.position.count));
  const arr = new Float32Array(total * 3);
  let o = 0; geos.forEach((g) => { arr.set(g.attributes.position.array, o); o += g.attributes.position.array.length; });
  merged.setAttribute('position', new THREE.BufferAttribute(arr, 3));
  yield;
  const sampler = new MeshSurfaceSampler(new THREE.Mesh(merged)).build();
  yield;
  const pos = new Float32Array(N * 3), v = new THREE.Vector3();
  const sc = 8.2 / sp.Ltot, cy = sp.Ltot / 2;
  for (let i = 0; i < N; i++) {
    if (!(i & 4095)) yield;
    sampler.sample(v);
    pos[i * 3] = v.x * sc; pos[i * 3 + 1] = (v.y - cy) * sc; pos[i * 3 + 2] = v.z * sc;
  }
  // Segmentbereiche (y in Form-Koordinaten) für die Hervorhebung
  const yOf = (id) => (sp.levels.find((l) => l.id === id).center.y - cy) * sc;
  const range = (a, b, pad = 0.18) => [Math.min(yOf(a), yOf(b)) - pad, Math.max(yOf(a), yOf(b)) + pad];
  const segs = [range('C1', 'C2'), range('C5', 'C6'), range('Th1', 'Th6'), range('L4', 'L5', 0.24), range('S', 'S', 0.55)];
  return { pos, segs };
}

// ---------- 3 · Haus mit Satteldach ----------
export function housePoints(N) {
  const W = 3.2, D = 2.1, Hw = 2.6, R = 2.3, base = -3.0;
  const P = (x, y, z) => new THREE.Vector3(x, y + base, z);
  const c = [P(-W, 0, -D), P(W, 0, -D), P(W, 0, D), P(-W, 0, D), P(-W, Hw, -D), P(W, Hw, -D), P(W, Hw, D), P(-W, Hw, D)];
  const rf = P(-W, Hw + R, 0), rb = P(W, Hw + R, 0);
  const ov = 0.35; // Dachüberstand
  const e = [
    [c[0], c[1]], [c[1], c[2]], [c[2], c[3]], [c[3], c[0]],
    [c[0], c[4]], [c[1], c[5]], [c[2], c[6]], [c[3], c[7]],
    [P(-W - ov, Hw - 0.25, -D - ov), rf.clone().add(new THREE.Vector3(-ov, 0, 0))], [P(-W - ov, Hw - 0.25, D + ov), rf.clone().add(new THREE.Vector3(-ov, 0, 0))],
    [P(W + ov, Hw - 0.25, -D - ov), rb.clone().add(new THREE.Vector3(ov, 0, 0))], [P(W + ov, Hw - 0.25, D + ov), rb.clone().add(new THREE.Vector3(ov, 0, 0))],
    [rf.clone().add(new THREE.Vector3(-ov, 0, 0)), rb.clone().add(new THREE.Vector3(ov, 0, 0))],
    [P(-W - ov, Hw - 0.25, D + ov), P(W + ov, Hw - 0.25, D + ov)], [P(-W - ov, Hw - 0.25, -D - ov), P(W + ov, Hw - 0.25, -D - ov)],
    // Tür und Fenster (Vorderseite z = +D)
    [P(-0.5, 0, D), P(-0.5, 1.5, D)], [P(0.5, 0, D), P(0.5, 1.5, D)], [P(-0.5, 1.5, D), P(0.5, 1.5, D)],
    [P(-2.5, 1.0, D), P(-1.4, 1.0, D)], [P(-2.5, 1.9, D), P(-1.4, 1.9, D)], [P(-2.5, 1.0, D), P(-2.5, 1.9, D)], [P(-1.4, 1.0, D), P(-1.4, 1.9, D)],
    [P(1.4, 1.0, D), P(2.5, 1.0, D)], [P(1.4, 1.9, D), P(2.5, 1.9, D)], [P(1.4, 1.0, D), P(1.4, 1.9, D)], [P(2.5, 1.0, D), P(2.5, 1.9, D)],
  ];
  const lens = e.map(([a, b]) => a.distanceTo(b)), L = lens.reduce((s, x) => s + x, 0);
  const pos = new Float32Array(N * 3), kind = new Float32Array(N);
  // „Gestochen“: Kanten gleichmäßig gepunktet (ohne Wackeln), Dachflächen als Linienraster, Boden als Punktgitter
  const nEdge = Math.round(N * 0.6), nRoof = Math.round(N * 0.26), nFloor = N - nEdge - nRoof;
  let i = 0;
  const put = (x, y, z, k) => { pos[i * 3] = x; pos[i * 3 + 1] = y; pos[i * 3 + 2] = z; kind[i] = k; i++; };
  e.forEach(([a, b], k) => {
    const cnt = k === e.length - 1 ? nEdge - i : Math.round((lens[k] / L) * nEdge);
    for (let j = 0; j < cnt; j++) { const t = (j + 0.5) / cnt; put(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t, a.z + (b.z - a.z) * t, k >= 8 && k <= 14 ? 1 : k >= 15 ? 2 : 0); }
  });
  // Dach: je Seite parallele Linien zum First
  const ROWS = 11, perRow = Math.floor(nRoof / (2 * ROWS));
  for (const side of [-1, 1]) for (let r = 1; r <= ROWS; r++) {
    const s2 = r / (ROWS + 1);
    for (let j = 0; j < perRow; j++) { const x = -(W + ov) + ((j + 0.5) / perRow) * 2 * (W + ov); put(x, Hw - 0.25 + (R + 0.25) * (1 - s2) + base, side * (D + ov) * s2, 1); }
  }
  // Boden: regelmäßiges Punktgitter (Rest)
  const fx = W + 1.6, fz = D + 1.4, rest = N - i, cols = Math.max(2, Math.round(Math.sqrt(rest * fx / fz))), rows = Math.max(2, Math.ceil(rest / cols));
  for (let j = 0; i < N; j++) { const cx = j % cols, cz = Math.floor(j / cols); put(-fx + (cx + 0.5) / cols * 2 * fx, base - 0.02, -fz + (cz + 0.5) / rows * 2 * fz, 3); }
  return { pos, kind };
}

// ---------- 4 · HOP-Logo: drei Kreise mit offenen Bögen ----------
export function logoPoints(N) {
  const pos = new Float32Array(N * 3), kind = new Float32Array(N);
  const cx = [-2.75, 0, 2.75], R = 1.18;
  for (let i = 0; i < N; i++) {
    const d = i % 3, ring = rand() < 0.22;
    let x, y;
    if (ring) {
      // offener Ring wie im Logo (Lücke oben rechts)
      let a = rand() * Math.PI * 2;
      while (a > 0.25 && a < 1.05) a = rand() * Math.PI * 2;
      const rr = R * 1.3 + (rand() - 0.5) * 0.05;
      x = cx[d] + Math.cos(a) * rr; y = Math.sin(a) * rr;
      kind[i] = 3;
    } else {
      const a = rand() * Math.PI * 2, rr = Math.sqrt(rand()) * R;
      x = cx[d] + Math.cos(a) * rr; y = Math.sin(a) * rr;
      kind[i] = d;
    }
    pos.set([x, y + 0.2, (rand() - 0.5) * 0.25], i * 3);
  }
  return { pos, kind };
}

// Handy „differenziert“ (7.11.2026): Annahme-Anteile je Teil (Rest wie „Schichten“)
export const DIFF = { disc: 0.3, plate: 0.36, plateE: 0.8, proc: 0.8 };

// ---------- Wirbelsäule für die Kamerafahrt ----------
// Knochen: gleichmäßig verteilte Punkte (wie ein Kupferstich) + Kern-Geometrie, die die Rückseite verdeckt.
// Nerven: Kurven (Rückenmark + Wurzeln) als Stützpunkte, auf denen Partikel fließen.
export const ZONES = ['c12', 'c34', 'c56', 'c7t1', 'th16', 'th712', 'l13', 'l45', 's1'];
export const CURVE_W = 128;
export const spineStipple = (nTarget, makeGrainNow = true) => runSync(spineStippleGen(nTarget, makeGrainNow));
export function* spineStippleGen(nTarget, makeGrainNow = true) {
  const sp = yield* spineOnce();
  sp.group.updateMatrixWorld(true);
  const SC = 8.2 / sp.Ltot, CY = sp.Ltot / 2;
  const parts = [];
  // Farbe je Ecke: r = Zone, g = Art (0 Knochen, 1 Bandscheibe), b = Kante (7.11.2026, Handy „differenziert“):
  // Wirbelkörper/Bandscheibe |y| / halbe Höhe (1 = Deckplatte bzw. Fuge), Bogen und Fortsätze −1, verdeckte Deckfläche −2
  const tag = (m, zone, kind) => {
    const loc = m.geometry.index ? m.geometry.toNonIndexed() : m.geometry, ud = m.geometry.userData || {};
    const g = loc.clone().applyMatrix4(m.matrixWorld);
    const ng = g;
    const n = ng.attributes.position.count, col = new Float32Array(n * 3), ly = loc.attributes.position.array;
    let hh = 1;
    if (kind === 1) { loc.computeBoundingBox(); hh = Math.max(Math.abs(loc.boundingBox.min.y), loc.boundingBox.max.y) || 1; }
    const B = ud.body;
    for (let i = 0; i < n; i++) {
      col[i * 3] = zone; col[i * 3 + 1] = kind;
      const y = ly[i * 3 + 1];
      col[i * 3 + 2] = kind === 1 ? Math.min(1, Math.abs(y) / hh)
        : B && i < B.n ? Math.min(1, B.top ? Math.max(0, (y - B.yc) / B.hh) : Math.abs(y - B.yc) / B.hh)
          : ud.solid ? 0 : -1;
    }
    // flache Deckflächen (alle drei Ecken auf |y| = halbe Höhe) liegen verdeckt in der Nachbar-Scheibe → −2 (diff: überspringen)
    for (let i = 0; i < n; i += 3) {
      const a = col[i * 3 + 2], b = col[i * 3 + 5], c = col[i * 3 + 8];
      if (a > 0.999 && b > 0.999 && c > 0.999) col[i * 3 + 2] = col[i * 3 + 5] = col[i * 3 + 8] = -2;
    }
    ng.setAttribute('color', new THREE.BufferAttribute(col, 3));
    parts.push(ng);
  };
  for (const m of sp.vertebrae) { tag(m, ZONES.indexOf(m.userData.zone), 0); yield; }
  for (const m of sp.discs) { tag(m, ZONES.indexOf(m.userData.zone), 1); yield; }
  let total = 0; parts.forEach((g) => (total += g.attributes.position.count));
  const P = new Float32Array(total * 3), Nn = new Float32Array(total * 3), Cc = new Float32Array(total * 3);
  let o = 0;
  parts.forEach((g) => { P.set(g.attributes.position.array, o); Nn.set(g.attributes.normal.array, o); Cc.set(g.attributes.color.array, o); o += g.attributes.position.array.length; });
  const merged = new THREE.BufferGeometry();
  merged.setAttribute('position', new THREE.BufferAttribute(P, 3));
  merged.setAttribute('normal', new THREE.BufferAttribute(Nn, 3));
  merged.setAttribute('color', new THREE.BufferAttribute(Cc, 3));
  yield;
  // Oberfläche → gleichmäßiger Mindestabstand (Poisson-artig, Raster-Hash) – Stil „Körnung“
  let area = 0; const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();
  for (let i = 0; i < P.length; i += 9) { a.fromArray(P, i); b.fromArray(P, i + 3); c.fromArray(P, i + 6); area += b.sub(a).cross(c.sub(a)).length() / 2; }
  yield;
  const sampler = new MeshSurfaceSampler(new THREE.Mesh(merged)).build();
  yield;
  // Raster mit Zahlen-Schlüsseln, Typed Arrays vorab (A1, 4.11.2026); als Generator für Zeitscheiben
  const box = bounds(P);
  function* makeGrainGen(n) {
    const r = Math.sqrt(area / n) * 0.78, r2 = r * r;
    const grid = poissonGrid(box.min, box.max, r, n);
    const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), zone = new Float32Array(n), kind = new Float32Array(n);
    const v = new THREE.Vector3(), nv = new THREE.Vector3(), col = new THREE.Color();
    const tick = every(512);
    let i = 0, tries = 0, miss = 0;
    while (i < n && tries++ < n * 5 && miss < 400) {
      if (tick()) yield;
      sampler.sample(v, nv, col);
      if (!grid.free(v.x, v.y, v.z, r2)) { miss++; continue; }
      miss = 0;
      grid.add(v.x, v.y, v.z);
      pos[i * 3] = v.x * SC; pos[i * 3 + 1] = (v.y - CY) * SC; pos[i * 3 + 2] = v.z * SC;
      nor[i * 3] = nv.x; nor[i * 3 + 1] = nv.y; nor[i * 3 + 2] = nv.z; zone[i] = col.r; kind[i] = col.g; i++;
    }
    return { pos: pos.slice(0, i * 3), nor: nor.slice(0, i * 3), zone: zone.slice(0, i), kind: kind.slice(0, i), count: i, spacing: r * SC };
  }
  // Mittellinie als Tabelle nach Bogenlänge (Formkoordinaten y/z, Tangente nach oben) – für die gekippten Schnittebenen (7.11. spät)
  const NT = 1024, cyT = new Float32Array(NT), czT = new Float32Array(NT), tyT = new Float32Array(NT), tzT = new Float32Array(NT);
  const LC = sp.curve.getLength() * SC;
  for (let j = 0; j < NT; j++) {
    const u = j / (NT - 1), q = sp.curve.getPointAt(u), tg = sp.curve.getTangentAt(u).negate();
    cyT[j] = (q.y - CY) * SC; czT[j] = q.z * SC; tyT[j] = tg.y; tzT[j] = tg.z;
  }
  yield;
  // Lage entlang der Achse: s (Bogenlänge von oben) so, dass der Punkt in der Ebene senkrecht zur Tangente bei s liegt.
  // Rückgabe A = −s (wächst nach oben wie y) und die Tangente dort (axT) – drei Schritte genügen (Krümmung klein gegen Abstand).
  const axT = [0, 1];
  const axial = (y, z) => {
    let sv = cyT[0] - y, ty = 1, tz = 0;
    for (let it = 0; it < 3; it++) {
      const fj = Math.min(NT - 1.001, Math.max(0, sv / LC * (NT - 1))), j = fj | 0, w = fj - j;
      const cy = cyT[j] + (cyT[j + 1] - cyT[j]) * w, cz = czT[j] + (czT[j + 1] - czT[j]) * w;
      ty = tyT[j] + (tyT[j + 1] - tyT[j]) * w; tz = tzT[j] + (tzT[j + 1] - tzT[j]) * w;
      const tl = Math.hypot(ty, tz); ty /= tl; tz /= tl;
      sv -= (y - cy) * ty + (z - cz) * tz; // außerhalb der Enden: lineare Fortsetzung
    }
    axT[0] = ty; axT[1] = tz;
    return -sv;
  };
  // Schnelltest für die vielen verworfenen Versuche: A vorab im Raster (y/z, bilinear; Fehler ≪ Schichtband), genau nur für Treffer
  // (Raster erst beim ersten makeSlicesGen, die Körnung braucht es nicht)
  const GY = 512, GZ = 128;
  const gy0 = (box.min[1] - CY) * SC - 0.05, gy1 = (box.max[1] - CY) * SC + 0.05, gz0 = box.min[2] * SC - 0.05, gz1 = box.max[2] * SC + 0.05;
  const gdy = (gy1 - gy0) / (GY - 1), gdz = (gz1 - gz0) / (GZ - 1);
  let AG = null;
  function* axialGrid() {
    if (AG) return;
    const g = new Float32Array(GY * GZ);
    for (let r = 0; r < GY; r++) { for (let c = 0; c < GZ; c++) g[r * GZ + c] = axial(gy0 + r * gdy, gz0 + c * gdz); if (!(r & 63)) yield; }
    AG = g;
  }
  const axialFast = (y, z) => {
    const fy = Math.min(GY - 1.001, Math.max(0, (y - gy0) / gdy)), fz = Math.min(GZ - 1.001, Math.max(0, (z - gz0) / gdz));
    const r = fy | 0, c = fz | 0, wy = fy - r, wz = fz - c, k = r * GZ + c;
    const a0 = AG[k] + (AG[k + 1] - AG[k]) * wz, a1 = AG[k + GZ] + (AG[k + GZ + 1] - AG[k + GZ]) * wz;
    return a0 + (a1 - a0) * wy;
  };
  // Stil „Schichten“: Schnittlinien wie bei einem CT-Schichtbild – seit 7.11. spät senkrecht zur Mittellinie (kippen mit Lordose/Kyphose)
  // diff (Handy, 7.11.2026): Deckplatten als dichtes Band, Bandscheiben gekörnt statt geschnitten, Fortsätze lichter;
  // gleiche Punktzahl, nur anders verteilt. edge[i] = Kante (siehe tag) für den Shader.
  function* makeSlicesGen(n, step = 0.042, band = 0.16, diff = false) {
    yield* axialGrid();
    const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), zone = new Float32Array(n), kind = new Float32Array(n), edge = new Float32Array(n);
    // Abtastung wie MeshSurfaceSampler (Fläche gewichtet, baryzentrisch), aber zuerst nur die Höhe:
    // ~88 % der Versuche fallen zwischen die Schnittebenen und werden ohne weitere Rechnung verworfen.
    const dist = sampler.distribution, nF = dist.length, tot = dist[nF - 1];
    const tick = every(4096);
    let i = 0, tries = 0;
    while (i < n && tries++ < n * 12) {
      if (tick()) yield;
      const x = Math.random() * tot;
      let lo = 0, hi = nF - 1;
      while (lo < hi) { const mid = (lo + hi) >> 1; if (dist[mid] > x) hi = mid; else lo = mid + 1; }
      let u = Math.random(), w = Math.random();
      if (u + w > 1) { u = 1 - u; w = 1 - w; }
      const t = 1 - u - w, a = lo * 9;
      const y = (P[a + 1] * u + P[a + 4] * w + P[a + 7] * t - CY) * SC, z = (P[a + 2] * u + P[a + 5] * w + P[a + 8] * t) * SC;
      let A = axialFast(y, z);
      const f = A / step - Math.floor(A / step);
      const k = Cc[a + 1] * u + Cc[a + 4] * w + Cc[a + 7] * t, e = Cc[a + 2] * u + Cc[a + 5] * w + Cc[a + 8] * t;
      let free = false; // frei = nicht auf eine Schnittebene gelegt
      if (diff && e < -1.5) continue; // verdeckte Deckfläche
      if (diff && k > 0.5) { if (Math.random() > DIFF.disc) continue; free = true; } // Bandscheibe: Körnung
      else if (diff && e > DIFF.plateE) { if (Math.random() > DIFF.plate) continue; free = true; } // Deckplatte: Band
      else {
        if (Math.abs(f - 0.5) > band / 2) continue;
        if (diff && e < 0 && Math.random() > DIFF.proc) continue; // Fortsätze lichter
      }
      // auf die Schnittebene legen → klare Linien: entlang der Achsen-Tangente zu 75 % zur Ebenenmitte schieben
      if (!free) A = axial(y, z); // genau (setzt auch axT)
      const sh = free ? 0 : ((Math.floor(A / step) + 0.5) * step - A) * 0.75;
      pos[i * 3] = (P[a] * u + P[a + 3] * w + P[a + 6] * t) * SC; pos[i * 3 + 1] = y + axT[0] * sh; pos[i * 3 + 2] = z + axT[1] * sh;
      edge[i] = e;
      const nx = Nn[a] * u + Nn[a + 3] * w + Nn[a + 6] * t, ny = Nn[a + 1] * u + Nn[a + 4] * w + Nn[a + 7] * t, nz = Nn[a + 2] * u + Nn[a + 5] * w + Nn[a + 8] * t, nl = Math.hypot(nx, ny, nz) || 1;
      nor[i * 3] = nx / nl; nor[i * 3 + 1] = ny / nl; nor[i * 3 + 2] = nz / nl;
      zone[i] = Cc[a] * u + Cc[a + 3] * w + Cc[a + 6] * t; kind[i] = k; i++;
    }
    return { pos, nor, zone, kind, edge, count: i, spacing: step };
  }
  // Kern (leicht nach innen versetzt), Formkoordinaten
  const core = new Float32Array(P.length);
  for (let i = 0; i < P.length; i += 3) { core[i] = P[i] * SC; core[i + 1] = (P[i + 1] - CY) * SC; core[i + 2] = P[i + 2] * SC; }
  const coreGeo = new THREE.BufferGeometry();
  coreGeo.setAttribute('position', new THREE.BufferAttribute(core, 3));
  coreGeo.setAttribute('normal', new THREE.BufferAttribute(Nn, 3));
  yield;
  // Nervenkurven: Zeile 0 = Rückenmark, danach die Wurzeln
  const toShape = (p) => [p.x * SC, (p.y - CY) * SC, p.z * SC];
  const cordC = new THREE.CatmullRomCurve3(sp.canal, false, 'centripetal');
  const cordPts = []; for (let i = 0; i < CURVE_W; i++) cordPts.push(cordC.getPointAt(i / (CURVE_W - 1)));
  const curves = [{ pts: cordPts.map(toShape), zone: -1, start: 0, kind: 1 }];
  rootCurves(sp).forEach((rc) => {
    const p0 = rc.curve.getPoint(0);
    let best = 0, bd = 1e9; cordPts.forEach((q, i) => { const d = q.distanceToSquared(p0); if (d < bd) { bd = d; best = i; } });
    const pts = []; for (let i = 0; i < CURVE_W; i++) pts.push(toShape(rc.curve.getPoint(i / (CURVE_W - 1))));
    curves.push({ pts, zone: ZONES.indexOf(rc.zone), start: best / (CURVE_W - 1), kind: 2, side: rc.side, id: rc.id });
  });
  const makeGrain = (n) => runSync(makeGrainGen(n)), makeSlices = (...a) => runSync(makeSlicesGen(...a));
  return { grain: makeGrainNow ? makeGrain(nTarget) : null, makeGrain, makeSlices, makeGrainGen, makeSlicesGen, coreGeo, curves, levels: sp.levels, SC, CY };
}
