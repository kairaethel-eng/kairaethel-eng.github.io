// Zielformen für das Partikelfeld. Jede Funktion liefert N Punkte (x,y,z) um den Ursprung, Höhe ≈ 8.
import * as THREE from 'three';
import { MeshSurfaceSampler } from 'three/examples/jsm/math/MeshSurfaceSampler.js';
import { buildSpine, rootCurves } from '../shared/spine.js';

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
  const ctx = cv.getContext('2d');
  drawBody(ctx, S);
  const data = ctx.getImageData(0, 0, W, H).data;
  const inside = (x, y) => x >= 0 && y >= 0 && x < W && y < H && data[(y * W + x) * 4 + 3] > 128;
  // Zeilen-Spannweiten für Tiefe (runde Volumen)
  const spanAt = (x, y) => {
    let l = x, r = x;
    while (inside(l - 1, y)) l--;
    while (inside(r + 1, y)) r++;
    return [l, r];
  };
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
    HOTSPOTS.forEach((p) => { const d = Math.hypot(bx - p.x, by - p.y) / p.r; h = Math.max(h, p.k * Math.exp(-d * d * 0.9)); });
    heat[i] = h;
    i++;
  }
  return { pos, heat };
}

// ---------- 2 · Wirbelsäule ----------
export function spinePoints(N) {
  const sp = buildSpine();
  const geos = [];
  sp.group.updateMatrixWorld(true);
  sp.vertebrae.concat(sp.discs).forEach((m) => {
    const g = m.geometry.clone().applyMatrix4(m.matrixWorld);
    geos.push(g.index ? g.toNonIndexed() : g);
  });
  const merged = new THREE.BufferGeometry();
  let total = 0; geos.forEach((g) => (total += g.attributes.position.count));
  const arr = new Float32Array(total * 3);
  let o = 0; geos.forEach((g) => { arr.set(g.attributes.position.array, o); o += g.attributes.position.array.length; });
  merged.setAttribute('position', new THREE.BufferAttribute(arr, 3));
  const sampler = new MeshSurfaceSampler(new THREE.Mesh(merged)).build();
  const pos = new Float32Array(N * 3), v = new THREE.Vector3();
  const sc = 8.2 / sp.Ltot, cy = sp.Ltot / 2;
  for (let i = 0; i < N; i++) {
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
  const v = new THREE.Vector3();
  for (let i = 0; i < N; i++) {
    const r = rand();
    if (r < 0.62) {
      let t = rand() * L, k = 0;
      while (t > lens[k]) { t -= lens[k]; k++; }
      v.copy(e[k][0]).lerp(e[k][1], t / lens[k]);
      v.x += (rand() - 0.5) * 0.06; v.y += (rand() - 0.5) * 0.06; v.z += (rand() - 0.5) * 0.06;
      kind[i] = k >= 8 && k <= 14 ? 1 : k >= 15 ? 2 : 0;
    } else if (r < 0.86) {
      // Dachflächen (dünn)
      const side = rand() < 0.5 ? -1 : 1, s = rand(), x = (rand() * 2 - 1) * (W + ov);
      v.set(x, Hw - 0.25 + (R + 0.25) * (1 - s) + base, side * (D + ov) * s);
      kind[i] = 1;
    } else {
      // Boden-Schimmer
      v.set((rand() * 2 - 1) * (W + 1.6), base - 0.02, (rand() * 2 - 1) * (D + 1.4));
      kind[i] = 3;
    }
    pos.set([v.x, v.y, v.z], i * 3);
  }
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

// ---------- Wirbelsäule für die Kamerafahrt ----------
// Knochen: gleichmäßig verteilte Punkte (wie ein Kupferstich) + Kern-Geometrie, die die Rückseite verdeckt.
// Nerven: Kurven (Rückenmark + Wurzeln) als Stützpunkte, auf denen Partikel fließen.
export const ZONES = ['c12', 'c34', 'c56', 'c7t1', 'th16', 'th712', 'l13', 'l45', 's1'];
export const CURVE_W = 128;
export function spineStipple(nTarget, makeGrainNow = true) {
  const sp = buildSpine();
  sp.group.updateMatrixWorld(true);
  const SC = 8.2 / sp.Ltot, CY = sp.Ltot / 2;
  const parts = [];
  const tag = (m, zone, kind) => {
    const g = m.geometry.clone().applyMatrix4(m.matrixWorld);
    const ng = g.index ? g.toNonIndexed() : g;
    const n = ng.attributes.position.count, col = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { col[i * 3] = zone; col[i * 3 + 1] = kind; }
    ng.setAttribute('color', new THREE.BufferAttribute(col, 3));
    parts.push(ng);
  };
  sp.vertebrae.forEach((m) => tag(m, ZONES.indexOf(m.userData.zone), 0));
  sp.discs.forEach((m) => tag(m, ZONES.indexOf(m.userData.zone), 1));
  let total = 0; parts.forEach((g) => (total += g.attributes.position.count));
  const P = new Float32Array(total * 3), Nn = new Float32Array(total * 3), Cc = new Float32Array(total * 3);
  let o = 0;
  parts.forEach((g) => { P.set(g.attributes.position.array, o); Nn.set(g.attributes.normal.array, o); Cc.set(g.attributes.color.array, o); o += g.attributes.position.array.length; });
  const merged = new THREE.BufferGeometry();
  merged.setAttribute('position', new THREE.BufferAttribute(P, 3));
  merged.setAttribute('normal', new THREE.BufferAttribute(Nn, 3));
  merged.setAttribute('color', new THREE.BufferAttribute(Cc, 3));
  // Oberfläche → gleichmäßiger Mindestabstand (Poisson-artig, Raster-Hash) – Stil „Körnung“
  let area = 0; const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();
  for (let i = 0; i < P.length; i += 9) { a.fromArray(P, i); b.fromArray(P, i + 3); c.fromArray(P, i + 6); area += b.sub(a).cross(c.sub(a)).length() / 2; }
  const sampler = new MeshSurfaceSampler(new THREE.Mesh(merged)).build();
  function makeGrain(n) {
    const r = Math.sqrt(area / n) * 0.78, r2 = r * r, inv = 1 / r;
    const grid = new Map();
    const pos = [], nor = [], zone = [], kind = [];
    const v = new THREE.Vector3(), nv = new THREE.Vector3(), col = new THREE.Color();
    let tries = 0;
    while (pos.length / 3 < n && tries++ < n * 5) {
      sampler.sample(v, nv, col);
      const gx = Math.floor(v.x * inv), gy = Math.floor(v.y * inv), gz = Math.floor(v.z * inv);
      let ok = true;
      for (let dx = -1; dx <= 1 && ok; dx++) for (let dy = -1; dy <= 1 && ok; dy++) for (let dz = -1; dz <= 1 && ok; dz++) {
        const cell = grid.get((gx + dx) + ',' + (gy + dy) + ',' + (gz + dz));
        if (cell) for (const j of cell) { const ex = pos[j] / SC - v.x, ey = pos[j + 1] / SC + CY - v.y, ez = pos[j + 2] / SC - v.z; if (ex * ex + ey * ey + ez * ez < r2) { ok = false; break; } }
      }
      if (!ok) continue;
      const k = gx + ',' + gy + ',' + gz;
      (grid.get(k) || grid.set(k, []).get(k)).push(pos.length);
      pos.push(v.x * SC, (v.y - CY) * SC, v.z * SC); nor.push(nv.x, nv.y, nv.z); zone.push(col.r); kind.push(col.g);
    }
    return { pos: new Float32Array(pos), nor: new Float32Array(nor), zone: new Float32Array(zone), kind: new Float32Array(kind), count: pos.length / 3, spacing: r * SC };
  }
  // Stil „Schichten“: waagerechte Schnittlinien wie bei einem CT-Schichtbild
  function makeSlices(n, step = 0.042, band = 0.16) {
    const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), zone = new Float32Array(n), kind = new Float32Array(n);
    const v = new THREE.Vector3(), nv = new THREE.Vector3(), col = new THREE.Color();
    let i = 0, tries = 0;
    while (i < n && tries++ < n * 12) {
      sampler.sample(v, nv, col);
      const y = (v.y - CY) * SC, f = y / step - Math.floor(y / step);
      if (Math.abs(f - 0.5) > band / 2) continue;
      const ys = (Math.floor(y / step) + 0.5) * step; // auf die Schnittebene legen → klare Linien
      pos[i * 3] = v.x * SC; pos[i * 3 + 1] = ys + (y - ys) * 0.25; pos[i * 3 + 2] = v.z * SC;
      nor[i * 3] = nv.x; nor[i * 3 + 1] = nv.y; nor[i * 3 + 2] = nv.z; zone[i] = col.r; kind[i] = col.g; i++;
    }
    return { pos, nor, zone, kind, count: i, spacing: step };
  }
  // Kern (leicht nach innen versetzt), Formkoordinaten
  const core = new Float32Array(P.length);
  for (let i = 0; i < P.length; i += 3) { core[i] = P[i] * SC; core[i + 1] = (P[i + 1] - CY) * SC; core[i + 2] = P[i + 2] * SC; }
  const coreGeo = new THREE.BufferGeometry();
  coreGeo.setAttribute('position', new THREE.BufferAttribute(core, 3));
  coreGeo.setAttribute('normal', new THREE.BufferAttribute(Nn, 3));
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
  return { grain: makeGrainNow ? makeGrain(nTarget) : null, makeGrain, makeSlices, coreGeo, curves, levels: sp.levels, SC, CY };
}
