// Echte Figur für Kapitel 01 (23.11.2026, Go Kai „Empfehlung“ zum Vorschlag „Anatomisch echt“ + „Kino“): stehender Körper,
// Skelett, Gehirn mit echten Windungen, Hirnstamm, Kleinhirn, Muskeln der Stationen und anatomisch geführte Nervenbahnen.
// Quelle: BodyParts3D, © The Database Center for Life Science licensed under CC Attribution 4.0 International
//   (Lizenzseite https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html; nur Ausgabe 4.0).
//   Verändert: Teile ausgewählt, Haut neutralisiert (Gesicht und Intimbereich geglättet, Augenöffnungen geschlossen), Netze vereinfacht,
//   Koordinaten in den Grundriss von Kapitel 01 umgerechnet; Nervenbahnen an den echten Knochen und Muskeln entlang berechnet
//   (BodyParts3D enthält keine Nerven an Rumpf, Armen und Beinen – die Bahnen sind gezeichnet, ihre Wege folgen den Landmarken).
// Rohdaten liegen NICHT im Repo (~200 MB): partof_BP3D_4.0_obj_99.zip, isa_BP3D_4.0_obj_99.zip, partof_element_parts.txt,
//   isa_element_parts.txt von https://dbarchive.biosciencedbc.jp/data/bodyparts3d/LATEST/
// Aufruf:  node tools/figur-echt.mjs <partof-obj-Ordner> <isa-obj-Ordner> <partof_element_parts.txt> <isa_element_parts.txt> [Vorschau-Ordner]
//          → assets/figur-echt.bin (Leser: decode() in src/figur-echt/daten.js)
// Koordinaten der Datei = Grundriss von Kapitel 01 (src/figur-plus/figur.js): Einheiten, Körpermitte 0, x nach rechts im Bild
//   (= linke Körperseite), y nach oben (Scheitel +204 = Grundriss 11, Sohle −204 = Grundriss 419), z zum Betrachter.
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { MeshoptSimplifier } from 'three/examples/jsm/libs/meshopt_simplifier.module.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const [dirA, dirB, listA, listB, preview] = process.argv.slice(2);
if (!dirA || !dirB || !listA || !listB) { console.error('Aufruf: node tools/figur-echt.mjs <partof-obj-Ordner> <isa-obj-Ordner> <partof_element_parts.txt> <isa_element_parts.txt> [Vorschau-Ordner]'); process.exit(1); }
const OUT = join(root, 'assets', 'figur-echt.bin');
const QUELLE = 'BodyParts3D, © The Database Center for Life Science licensed under CC Attribution 4.0 International';
const GRUND = { crown: 204, sole: -204 }; // Grundriss: Scheitel 11 → y = 215 − 11, Sohle 419 → y = 215 − 419

// ---------- Teilelisten ----------
const elements = new Map();
for (const f of [listA, listB]) for (const l of readFileSync(f, 'utf8').split('\n').slice(1)) {
  const [, name, el] = l.trim().split('\t'); if (!name || !el) continue;
  const k = name.toLowerCase(); if (!elements.has(k)) elements.set(k, new Set()); elements.get(k).add(el);
}
const fileOf = (el) => [dirA, dirB].map((d) => join(d, `${el}.obj`)).find((f) => existsSync(f));
const filesOf = (names) => {
  const out = new Set();
  for (const n of names) { const e = elements.get(n.toLowerCase()); if (!e) { console.warn('⚠ nicht in den Listen:', n); continue; } for (const x of e) { const f = fileOf(x); if (f) out.add(f); else console.warn('⚠ Datei fehlt:', n, x); } }
  return [...out];
};
const LR = (n) => [`left ${n}`, `right ${n}`];

// ---------- Netze lesen (BodyParts3D: mm, x links, y hinten, z oben), Punkte verschweißen ----------
function load(files) {
  const pos = [], idx = [], key = new Map();
  for (const f of files) {
    const v = [];
    for (const l of readFileSync(f, 'utf8').split('\n')) {
      if (l.startsWith('v ')) {
        const p = l.split(/\s+/).slice(1, 4).map(Number), k = p.map((c) => Math.round(c * 100)).join(',');
        let i = key.get(k); if (i === undefined) { i = pos.length / 3; key.set(k, i); pos.push(...p); }
        v.push(i);
      } else if (l.startsWith('f ')) {
        const c = l.trim().split(/\s+/).slice(1).map((t) => v[parseInt(t, 10) - 1]);
        for (let k = 1; k + 1 < c.length; k++) if (c[0] !== c[k] && c[k] !== c[k + 1] && c[0] !== c[k + 1]) idx.push(c[0], c[k], c[k + 1]);
      }
    }
  }
  return { pos, idx };
}
function reorder({ pos, idx }) {
  const map = new Int32Array(pos.length / 3).fill(-1), np = [], ni = new Array(idx.length);
  for (let i = 0; i < idx.length; i++) { let m = map[idx[i]]; if (m < 0) { m = map[idx[i]] = np.length / 3; np.push(pos[idx[i] * 3], pos[idx[i] * 3 + 1], pos[idx[i] * 3 + 2]); } ni[i] = m; }
  return { pos: np, idx: ni };
}
const V3 = {
  sub: (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], add: (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]], sc: (a, s) => [a[0] * s, a[1] * s, a[2] * s],
  dot: (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2], cross: (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]],
  len: (a) => Math.hypot(a[0], a[1], a[2]), lerp: (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t],
};
V3.norm = (a) => { const l = V3.len(a) || 1; return V3.sc(a, 1 / l); };
const P = (m, i) => [m.pos[i * 3], m.pos[i * 3 + 1], m.pos[i * 3 + 2]];
const sstep = (a, b, v) => { const t = Math.min(1, Math.max(0, (v - a) / (b - a))); return t * t * (3 - 2 * t); };
function bounds(m) {
  const lo = [1e9, 1e9, 1e9], hi = [-1e9, -1e9, -1e9];
  for (let i = 0; i < m.pos.length; i++) { const c = i % 3; if (m.pos[i] < lo[c]) lo[c] = m.pos[i]; if (m.pos[i] > hi[c]) hi[c] = m.pos[i]; }
  return { lo, hi, mid: [0, 1, 2].map((c) => (lo[c] + hi[c]) / 2) };
}
function centroid(m) { const n = m.pos.length / 3, c = [0, 0, 0]; for (let i = 0; i < m.pos.length; i++) c[i % 3] += m.pos[i] / n; return c; }
function writeObj(file, m) { // Vorschau (BodyParts3D-Koordinaten)
  const L = []; for (let i = 0; i < m.pos.length; i += 3) L.push(`v ${m.pos[i].toFixed(2)} ${m.pos[i + 1].toFixed(2)} ${m.pos[i + 2].toFixed(2)}`);
  for (let k = 0; k < m.idx.length; k += 3) L.push(`f ${m.idx[k] + 1} ${m.idx[k + 1] + 1} ${m.idx[k + 2] + 1}`);
  writeFileSync(file, L.join('\n'));
}
// Nachbarn je Ecke
function neighbors(m) {
  const n = m.pos.length / 3, N = Array.from({ length: n }, () => new Set());
  for (let k = 0; k < m.idx.length; k += 3) for (let e = 0; e < 3; e++) { const a = m.idx[k + e], b = m.idx[k + (e + 1) % 3]; N[a].add(b); N[b].add(a); }
  return N.map((s) => [...s]);
}
// Randschleifen (Kanten mit nur einem Dreieck), als geordnete Eckenlisten
function boundaryLoops(m) {
  const cnt = new Map(), dir = new Map();
  for (let k = 0; k < m.idx.length; k += 3) for (let e = 0; e < 3; e++) {
    const a = m.idx[k + e], b = m.idx[k + (e + 1) % 3], key = a < b ? `${a},${b}` : `${b},${a}`;
    cnt.set(key, (cnt.get(key) || 0) + 1); dir.set(`${a}>${b}`, 1);
  }
  const next = new Map();
  for (const [key, c] of cnt) {
    if (c !== 1) continue;
    const [a, b] = key.split(',').map(Number);
    // Umlaufsinn: Randkante a→b gehört zu einem Dreieck → die Schleife läuft andersherum (b→a), damit der Deckel nach außen zeigt
    if (dir.has(`${a}>${b}`)) next.set(b, a); else next.set(a, b);
  }
  const loops = [], seen = new Set();
  for (const s of next.keys()) {
    if (seen.has(s)) continue;
    const L = []; let v = s, guard = 0;
    while (!seen.has(v) && next.has(v) && guard++ < 1e6) { seen.add(v); L.push(v); v = next.get(v); }
    if (v === s && L.length >= 3) loops.push(L);
  }
  return loops;
}
// Loch schließen: Ringe von der Randschleife zur Mitte, danach die inneren Ecken glätten (Membran) – keine neuen Ecken auf dem Rand
function capLoop(m, L, rings = 8) {
  const n = L.length, c = [0, 0, 0];
  for (const i of L) { const p = P(m, i); c[0] += p[0] / n; c[1] += p[1] / n; c[2] += p[2] / n; }
  const R = [L];
  for (let r = 1; r < rings; r++) {
    const t = r / rings, ring = [];
    for (const i of L) { const p = V3.lerp(P(m, i), c, t); ring.push(m.pos.length / 3); m.pos.push(...p); }
    R.push(ring);
  }
  const ci = m.pos.length / 3; m.pos.push(...c);
  for (let r = 0; r < rings - 1; r++) for (let k = 0; k < n; k++) {
    const a = R[r][k], b = R[r][(k + 1) % n], a2 = R[r + 1][k], b2 = R[r + 1][(k + 1) % n];
    m.idx.push(a, b, b2, a, b2, a2);
  }
  for (let k = 0; k < n; k++) m.idx.push(R[rings - 1][k], R[rings - 1][(k + 1) % n], ci);
  return [...R.slice(1).flat(), ci];
}
// Glätten mit Gewicht je Ecke (0 = fest, 1 = voll); nur Ecken mit Gewicht werden bewegt
function smoothWeighted(m, w, iters, lam = 0.5) {
  const N = neighbors(m), act = []; for (let i = 0; i < w.length; i++) if (w[i] > 0) act.push(i);
  const tmp = new Float64Array(act.length * 3);
  for (let it = 0; it < iters; it++) {
    act.forEach((i, j) => {
      const nb = N[i]; if (!nb.length) { tmp[j * 3] = m.pos[i * 3]; tmp[j * 3 + 1] = m.pos[i * 3 + 1]; tmp[j * 3 + 2] = m.pos[i * 3 + 2]; return; }
      let x = 0, y = 0, z = 0; for (const q of nb) { x += m.pos[q * 3]; y += m.pos[q * 3 + 1]; z += m.pos[q * 3 + 2]; }
      const k = w[i] * lam; x /= nb.length; y /= nb.length; z /= nb.length;
      tmp[j * 3] = m.pos[i * 3] + (x - m.pos[i * 3]) * k; tmp[j * 3 + 1] = m.pos[i * 3 + 1] + (y - m.pos[i * 3 + 1]) * k; tmp[j * 3 + 2] = m.pos[i * 3 + 2] + (z - m.pos[i * 3 + 2]) * k;
    });
    act.forEach((i, j) => { m.pos[i * 3] = tmp[j * 3]; m.pos[i * 3 + 1] = tmp[j * 3 + 1]; m.pos[i * 3 + 2] = tmp[j * 3 + 2]; });
  }
}
function simplify(m, target, err = 0.02) {
  const t0 = m.idx.length / 3; if (t0 <= target) return reorder(m);
  const [si] = MeshoptSimplifier.simplify(new Uint32Array(m.idx), new Float32Array(m.pos), 3, target * 3, err, []);
  return reorder({ pos: m.pos, idx: Array.from(si) });
}

// Höhenfeld der Vorderseite: je 1-mm-Zelle (x, z) der vorderste Wert −y aller Dreiecke (null = leer)
function heightField(m, box, res = 1) {
  const W = Math.round((box.x1 - box.x0) / res) + 1, H = Math.round((box.z1 - box.z0) / res) + 1, A = new Float32Array(W * H).fill(-1e9);
  for (let k = 0; k < m.idx.length; k += 3) {
    const a = P(m, m.idx[k]), b = P(m, m.idx[k + 1]), c = P(m, m.idx[k + 2]);
    const X = [a, b, c].map((q) => (q[0] - box.x0) / res), Z = [a, b, c].map((q) => (q[2] - box.z0) / res), D = [a, b, c].map((q) => -q[1]);
    const x0 = Math.max(0, Math.floor(Math.min(...X))), x1 = Math.min(W - 1, Math.ceil(Math.max(...X))), z0 = Math.max(0, Math.floor(Math.min(...Z))), z1 = Math.min(H - 1, Math.ceil(Math.max(...Z)));
    if (x0 > x1 || z0 > z1) continue;
    const det = (X[1] - X[0]) * (Z[2] - Z[0]) - (X[2] - X[0]) * (Z[1] - Z[0]); if (Math.abs(det) < 1e-12) continue;
    for (let z = z0; z <= z1; z++) for (let x = x0; x <= x1; x++) {
      const l1 = ((X[1] - x) * (Z[2] - z) - (X[2] - x) * (Z[1] - z)) / det, l2 = ((X[2] - x) * (Z[0] - z) - (X[0] - x) * (Z[2] - z)) / det, l3 = 1 - l1 - l2;
      if (l1 < -1e-6 || l2 < -1e-6 || l3 < -1e-6) continue;
      const d = l1 * D[0] + l2 * D[1] + l3 * D[2], o = z * W + x; if (d > A[o]) A[o] = d;
    }
  }
  return { A, W, H, box, res };
}
// Grauwert-Morphologie (Quadrat, Radius r Zellen): sgn 1 = Dehnen (Maximum), −1 = Abtragen (Minimum); leere Zellen bleiben leer
function morph(F, r, sgn) {
  const { W, H } = F, src = F.A, tmp = new Float32Array(W * H), out = new Float32Array(W * H);
  const pick = sgn > 0 ? Math.max : Math.min;
  for (let z = 0; z < H; z++) for (let x = 0; x < W; x++) { const o = z * W + x; if (src[o] < -1e8) { tmp[o] = src[o]; continue; } let v = src[o]; for (let k = -r; k <= r; k++) { const xx = x + k; if (xx < 0 || xx >= W) continue; const q = src[z * W + xx]; if (q > -1e8) v = pick(v, q); } tmp[o] = v; }
  for (let z = 0; z < H; z++) for (let x = 0; x < W; x++) { const o = z * W + x; if (tmp[o] < -1e8) { out[o] = tmp[o]; continue; } let v = tmp[o]; for (let k = -r; k <= r; k++) { const zz = z + k; if (zz < 0 || zz >= H) continue; const q = tmp[zz * W + x]; if (q > -1e8) v = pick(v, q); } out[o] = v; }
  return { ...F, A: out };
}
function gauss(F, s) {
  const { W, H } = F, r = Math.ceil(s * 2.5), wk = Array.from({ length: 2 * r + 1 }, (_, k) => Math.exp(-((k - r) ** 2) / (2 * s * s)));
  const pass = (src, horiz) => { const out = new Float32Array(W * H); for (let z = 0; z < H; z++) for (let x = 0; x < W; x++) { const o = z * W + x; if (src[o] < -1e8) { out[o] = src[o]; continue; } let a = 0, ws = 0; for (let k = -r; k <= r; k++) { const xx = horiz ? x + k : x, zz = horiz ? z : z + k; if (xx < 0 || zz < 0 || xx >= W || zz >= H) continue; const q = src[zz * W + xx]; if (q < -1e8) continue; a += q * wk[k + r]; ws += wk[k + r]; } out[o] = a / ws; } return out; };
  return { ...F, A: pass(pass(F.A, true), false) };
}
function sampleHF(F, x, z) {
  const fx = (x - F.box.x0) / F.res, fz = (z - F.box.z0) / F.res;
  if (fx < 0 || fz < 0 || fx > F.W - 1.001 || fz > F.H - 1.001) return null;
  const x0 = Math.floor(fx), z0 = Math.floor(fz), u = fx - x0, v = fz - z0, o = z0 * F.W + x0, A = F.A;
  const q = [A[o], A[o + 1], A[o + F.W], A[o + F.W + 1]]; if (q.some((t) => t < -1e8)) return null;
  return (q[0] * (1 - u) + q[1] * u) * (1 - v) + (q[2] * (1 - u) + q[3] * u) * v;
}
// nur die größte zusammenhängende Fläche behalten
function largestPart(m) {
  const n = m.pos.length / 3, par = new Int32Array(n).map((_, i) => i);
  const f = (x) => { while (par[x] !== x) { par[x] = par[par[x]]; x = par[x]; } return x; };
  for (let k = 0; k < m.idx.length; k += 3) { const a = f(m.idx[k]), b = f(m.idx[k + 1]); par[b] = a; const c = f(m.idx[k + 2]); par[c] = f(a); }
  const size = new Map(); for (let k = 0; k < m.idx.length; k += 3) { const r = f(m.idx[k]); size.set(r, (size.get(r) || 0) + 1); }
  let big = -1, bs = 0; for (const [r, s] of size) if (s > bs) { bs = s; big = r; }
  const kk = []; for (let k = 0; k < m.idx.length; k += 3) if (f(m.idx[k]) === big) kk.push(m.idx[k], m.idx[k + 1], m.idx[k + 2]);
  return { pos: m.pos, idx: kk };
}

await MeshoptSimplifier.ready;
if (preview) mkdirSync(preview, { recursive: true });

// =====================================================================================================
// 1  Haut (FJ2810) – neutralisiert
// =====================================================================================================
let skin = load(filesOf(['skin']));
{
  const B = bounds(skin);
  console.log(`Haut: ${skin.pos.length / 3} Ecken, ${skin.idx.length / 3} Dreiecke, z ${B.lo[2].toFixed(0)}…${B.hi[2].toFixed(0)}`);
  // Intimbereich: alles vor dem Schritt zwischen den Oberschenkeln (gemessen: Genitalien z 695…800, |x| < 24, ragen vor y −168)
  const G = { x: 27, z: [688, 806], y: -166 };
  const keep = [];
  let cut = 0;
  for (let k = 0; k < skin.idx.length; k += 3) {
    const a = P(skin, skin.idx[k]), b = P(skin, skin.idx[k + 1]), c = P(skin, skin.idx[k + 2]);
    const g = [(a[0] + b[0] + c[0]) / 3, (a[1] + b[1] + c[1]) / 3, (a[2] + b[2] + c[2]) / 3];
    if (Math.abs(g[0]) < G.x && g[2] > G.z[0] && g[2] < G.z[1] && g[1] < G.y) { cut++; continue; }
    keep.push(skin.idx[k], skin.idx[k + 1], skin.idx[k + 2]);
  }
  skin.idx = keep;
  // abgetrennte Inseln (Reste der Genitalien) entfernen: nur die größte zusammenhängende Fläche bleibt
  {
    const n = skin.pos.length / 3, par = new Int32Array(n).map((_, i) => i);
    const f = (x) => { while (par[x] !== x) { par[x] = par[par[x]]; x = par[x]; } return x; };
    for (let k = 0; k < skin.idx.length; k += 3) { const a = f(skin.idx[k]), b = f(skin.idx[k + 1]), c = f(skin.idx[k + 2]); par[b] = a; par[f(c)] = a; }
    const size = new Map(); for (let k = 0; k < skin.idx.length; k += 3) { const r = f(skin.idx[k]); size.set(r, (size.get(r) || 0) + 1); }
    let big = -1, bs = 0; for (const [r, s] of size) if (s > bs) { bs = s; big = r; }
    const kk = []; for (let k = 0; k < skin.idx.length; k += 3) if (f(skin.idx[k]) === big) kk.push(skin.idx[k], skin.idx[k + 1], skin.idx[k + 2]);
    console.log(`  Intimbereich: ${cut} Dreiecke entfernt, Inseln ${size.size - 1} (${skin.idx.length / 3 - kk.length / 3} Dreiecke)`);
    skin.idx = kk;
  }
  // Löcher schließen: alle Randschleifen bis 900 mm Umfang (Intimbereich); gibt die neuen Ecken zurück
  const capAll = (what) => {
    const added = [];
    for (const L of boundaryLoops(skin)) {
      let per = 0; for (let k = 0; k < L.length; k++) per += V3.len(V3.sub(P(skin, L[k]), P(skin, L[(k + 1) % L.length])));
      const c = L.reduce((s, i) => V3.add(s, V3.sc(P(skin, i), 1 / L.length)), [0, 0, 0]);
      if (per > 900) { console.log(`  Rand ${L.length} Ecken, ${per.toFixed(0)} mm bei ${c.map((v) => v.toFixed(0))} – bleibt offen`); continue; }
      added.push(...capLoop(skin, L, Math.max(3, Math.min(10, Math.round(per / 40)))));
      console.log(`  ${what}: Loch geschlossen, ${L.length} Ecken, Umfang ${per.toFixed(0)} mm bei ${c.map((v) => v.toFixed(0))}`);
    }
    return added;
  };
  const w = [];
  for (const i of capAll('Intimbereich')) w[i] = 1;
  // Glätten: Deckel (Membran) und Umgebung des Intimbereichs
  {
    const n = skin.pos.length / 3, W = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const p = P(skin, i); let k = w[i] ? 1 : 0;
      const dg = Math.hypot(p[0] / 70, (p[2] - 760) / 95, Math.max(0, p[1] + 150) / 60);
      if (p[1] < -120) k = Math.max(k, 0.85 * (1 - sstep(0.7, 1.2, dg)));
      W[i] = k;
    }
    smoothWeighted(skin, W, 220, 0.5);
  }
  // Gesicht und Brust über ein Höhenfeld der Vorderseite (1 mm Raster, Wert = −y = Abstand nach vorn):
  //   Schließen (Augen- und Mundöffnungen füllen), Öffnen (Nase, Lippen, Brustwarzen abtragen), Weichzeichnen → glatte Zielfläche
  let nose = null;
  { const n = skin.pos.length / 3; for (let i = 0; i < n; i++) { const p = P(skin, i); if (p[2] > 1450 && Math.abs(p[0]) < 30 && (!nose || p[1] < nose[1])) nose = p; } }
  console.log(`  Nasenspitze ${nose.map((v) => v.toFixed(0))}`);
  const FACE = { x0: -80, x1: 80, z0: nose[2] - 95, z1: nose[2] + 115 }, CHEST = { x0: -170, x1: 170, z0: 1110, z1: 1330 };
  const faceZ = nose[2] + 10;
  const faceMask = (p) => { const d = Math.hypot(p[0] / 60, (p[2] - faceZ) / 88); return 1 - sstep(0.72, 1.08, d); };
  const front = (p) => p[1] < nose[1] + 85; // vordere Hälfte des Kopfes
  // Augenhöhlen: Ecken deutlich hinter der geschlossenen Vorderfläche → Dreiecke weg, Rand schließen
  {
    const HF = heightField(skin, FACE), Hc = morph(morph(HF, 9, 1), 9, -1);
    const n = skin.pos.length / 3, cav = new Uint8Array(n);
    let nc = 0;
    for (let i = 0; i < n; i++) {
      const p = P(skin, i); if (p[2] < nose[2] - 10 || p[2] > nose[2] + 70 || Math.abs(p[0]) > 58 || !front(p)) continue;
      const h = sampleHF(Hc, p[0], p[2]); if (h === null) continue;
      if (-p[1] < h - 2.5 && -p[1] > h - 45) { cav[i] = 1; nc++; }
    }
    const kk = []; let cut = 0;
    for (let k = 0; k < skin.idx.length; k += 3) { const s = cav[skin.idx[k]] + cav[skin.idx[k + 1]] + cav[skin.idx[k + 2]]; if (s >= 2) { cut++; continue; } kk.push(skin.idx[k], skin.idx[k + 1], skin.idx[k + 2]); }
    skin.idx = kk; skin = largestPart(skin);
    console.log(`  Augen: ${nc} Ecken in den Öffnungen, ${cut} Dreiecke entfernt`);
    const capped = capAll('Gesicht');
    const n2 = skin.pos.length / 3, W = new Float32Array(n2); for (const i of capped) W[i] = 1;
    smoothWeighted(skin, W, 120, 0.5);
  }
  // Gesicht glätten: Zielfläche = geöffnet + geschlossen + weichgezeichnet; nur Ecken der Vorderfläche bewegen
  const flatten = (box, rOpen, rClose, blur, maskOf, label) => {
    const HF = heightField(skin, box);
    const T = gauss(morph(morph(morph(morph(HF, rOpen, -1), rOpen, 1), rClose, 1), rClose, -1), blur);
    const n = skin.pos.length / 3, W = new Float32Array(n); let moved = 0;
    for (let i = 0; i < n; i++) {
      const p = P(skin, i), m = maskOf(p); if (m <= 0) continue;
      const h = sampleHF(HF, p[0], p[2]), t = sampleHF(T, p[0], p[2]); if (h === null || t === null) continue;
      if (-p[1] < h - 14) continue; // nicht Vorderfläche (Seiten, Rückseite)
      skin.pos[i * 3 + 1] = -((-p[1]) + (t - (-p[1])) * m); W[i] = m * 0.5; moved++;
    }
    smoothWeighted(skin, W, 25, 0.5);
    console.log(`  ${label}: ${moved} Ecken auf die glatte Fläche gelegt`);
  };
  flatten(FACE, 15, 8, 5, (p) => (front(p) ? faceMask(p) : 0), 'Gesicht');
  flatten(CHEST, 13, 4, 4, (p) => { const ax = Math.abs(p[0]); return p[1] < -120 && ax > 55 && ax < 150 && p[2] > 1150 && p[2] < 1300 ? (1 - sstep(0.6, 1, Math.hypot((ax - 100) / 48, (p[2] - 1222) / 72))) : 0; }, 'Brust');
  if (preview) writeObj(join(preview, 'haut-voll.obj'), skin);
  skin = simplify(reorder(skin), 30000, 0.01);
  console.log(`  Haut vereinfacht: ${skin.idx.length / 3} Dreiecke`);
  if (preview) writeObj(join(preview, 'haut.obj'), skin);
}
if (process.env.NUR_HAUT) process.exit(0);

// =====================================================================================================
// 2  Umrechnung in den Grundriss: Scheitel → y = +204, Sohle → y = −204; Tiefe 0 = Mitte des Rumpfs
// =====================================================================================================
const SK = bounds(skin), zTop = SK.hi[2], zSole = SK.lo[2], K = (GRUND.crown - GRUND.sole) / (zTop - zSole), ZC = (zTop + zSole) / 2;
const YC = (() => { let lo = 1e9, hi = -1e9; for (let i = 0; i < skin.pos.length; i += 3) { const z = skin.pos[i + 2]; if (z < 1000 || z > 1300 || Math.abs(skin.pos[i]) > 120) continue; lo = Math.min(lo, skin.pos[i + 1]); hi = Math.max(hi, skin.pos[i + 1]); } return (lo + hi) / 2; })();
const T = (p) => [p[0] * K, (p[2] - ZC) * K, -(p[1] - YC) * K];
const Tm = (m) => { const pos = new Array(m.pos.length); for (let i = 0; i < m.pos.length; i += 3) { const q = T([m.pos[i], m.pos[i + 1], m.pos[i + 2]]); pos[i] = q[0]; pos[i + 1] = q[1]; pos[i + 2] = q[2]; } return { pos, idx: m.idx }; };
const BY = (p) => 215 - T(p)[1]; // Grundriss-Höhe (11 Scheitel … 419 Sohle)
console.log(`Maßstab ${K.toFixed(5)} Einheiten/mm (Körper ${(zTop - zSole).toFixed(0)} mm), Tiefenmitte y = ${YC.toFixed(1)} mm`);

// =====================================================================================================
// 3  Teile: Skelett, Gehirn, Muskeln der Stationen
// =====================================================================================================
const NUM = ['first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'ninth', 'tenth', 'eleventh', 'twelfth'];
const CERV = ['atlas', 'axis', ...NUM.slice(2, 7).map((n) => `${n} cervical vertebra`)];
const THOR = NUM.map((n) => `${n} thoracic vertebra`), LUMB = NUM.slice(0, 5).map((n) => `${n} lumbar vertebra`);
const FINGER = { thumb: ['proximal', 'distal'], 'index finger': ['proximal', 'middle', 'distal'], 'middle finger': ['proximal', 'middle', 'distal'], 'ring finger': ['proximal', 'middle', 'distal'], 'little finger': ['proximal', 'middle', 'distal'] };
const TOE = { 'big toe': ['proximal', 'distal'], 'second toe': ['proximal', 'middle', 'distal'], 'third toe': ['proximal', 'middle', 'distal'], 'fourth toe': ['proximal', 'middle', 'distal'], 'little toe': ['proximal', 'middle', 'distal'] };
const CARP = ['scaphoid', 'lunate', 'triquetral', 'pisiform', 'trapezium', 'trapezoid', 'capitate', 'hamate'];
const TARS = ['talus', 'calcaneus', 'cuboid bone', 'medial cuneiform bone', 'intermediate cuneiform bone', 'lateral cuneiform bone'];
const handOf = (s) => [...CARP.map((c) => `${s} ${c}`), ...NUM.slice(0, 5).map((n) => `${s} ${n} metacarpal bone`), ...Object.entries(FINGER).flatMap(([f, ph]) => ph.map((q) => `${q} phalanx of ${s} ${f}`))];
const footOf = (s) => [...TARS.map((t) => `${s} ${t}`), `navicular bone of ${s} foot`, ...NUM.slice(0, 5).map((n) => `${s} ${n} metatarsal bone`), ...Object.entries(TOE).flatMap(([f, ph]) => ph.map((q) => `${q} phalanx of ${s} ${f}`))];
// [Kennung, Art, Namen, Ziel-Dreiecke, Station (Spannung; −1 = keine)]
const PARTS = [
  ['knochen/schaedel', 'bone', ['frontal bone', ...LR('parietal bone'), ...LR('temporal bone'), 'occipital bone', 'sphenoid bone', ...LR('maxilla'), ...LR('zygomatic bone'), ...LR('nasal bone'), 'mandible'], 9000],
  ['knochen/hws', 'bone', CERV, 4200],
  ['knochen/bws', 'bone', THOR, 5600],
  ['knochen/lws', 'bone', LUMB, 3200],
  ['knochen/rippen', 'bone', [...NUM.flatMap((n) => LR(`${n} rib`)), 'manubrium', 'body of sternum', 'xiphoid process', ...NUM.slice(0, 7).flatMap((n) => LR(`${n} costal cartilage`))], 7000],
  ['knochen/schulter', 'bone', [...LR('clavicle'), ...LR('scapula')], 3400],
  ['knochen/becken', 'bone', [...LR('hip bone'), 'sacrum'], 5000],
  ['knochen/arm', 'bone', [...LR('humerus'), ...LR('radius'), ...LR('ulna')], 3600],
  ['knochen/hand', 'bone', [...handOf('left'), ...handOf('right')], 5600],
  ['knochen/bein', 'bone', [...LR('femur'), ...LR('patella'), ...LR('tibia'), ...LR('fibula')], 4400],
  ['knochen/fuss', 'bone', [...footOf('left'), ...footOf('right')], 5600],
  ['gehirn/grosshirn', 'brain', ['angular gyrus', 'inferior frontal gyrus', 'inferior temporal gyrus', 'middle frontal gyrus', 'middle temporal gyrus', 'occipital lobe', 'postcentral gyrus', 'precentral gyrus', 'superior frontal gyrus', 'superior parietal lobule', 'supramarginal gyrus'].flatMap(LR), 13000],
  ['gehirn/kleinhirn', 'brain', ['cerebellum'], 3000],
  ['gehirn/stamm', 'brain', ['midbrain', 'pons', 'medulla oblongata'], 1400],
  // Fassung K (25.11.2026, Kai: „Gehirn noch besser als im Video“): dieselben Teile mit viel mehr Dreiecken – nur für den Blick ins Gehirn
  ['hirnfein/stirn', 'brain2', ['superior frontal gyrus', 'middle frontal gyrus', 'inferior frontal gyrus'].flatMap(LR), 30000],
  ['hirnfein/zentral', 'brain2', ['precentral gyrus', 'postcentral gyrus'].flatMap(LR), 16000],
  ['hirnfein/schlaefe', 'brain2', ['middle temporal gyrus', 'inferior temporal gyrus'].flatMap(LR), 16000],
  ['hirnfein/scheitel', 'brain2', ['angular gyrus', 'supramarginal gyrus', 'superior parietal lobule'].flatMap(LR), 16000],
  ['hirnfein/hinterhaupt', 'brain2', LR('occipital lobe'), 12000],
  ['hirnfein/kleinhirn', 'brain2', ['cerebellum'], 14000],
  ['hirnfein/stamm', 'brain2', ['midbrain', 'pons', 'medulla oblongata'], 3600],
  ['muskel/nacken', 'muscle', [...LR('levator scapulae'), 'descending part of left trapezius', 'descending part of right trapezius'], 3600, 1],
  ['muskel/huefte', 'muscle', [...LR('gluteus medius'), ...LR('piriformis'), ...LR('psoas major')], 4200, 2],
];
const RAW = {}; // Rohnetze (BodyParts3D) für die Landmarken der Nerven
const raw = (name) => (RAW[name] ||= load(filesOf([name])));
const out = []; // { id, kind, st, mesh (Grundriss) }
out.push({ id: 'haut/koerper', kind: 'skin', st: -1, mesh: Tm(skin) });
for (const [id, kind, names, target, st = -1] of PARTS) {
  const files = filesOf(names); if (!files.length) { console.warn(`⚠ ${id}: keine Dateien`); continue; }
  const m0 = load(files), t0 = m0.idx.length / 3, m = simplify(m0, target, kind.startsWith('brain') ? 0.01 : 0.02);
  out.push({ id, kind, st, mesh: Tm(m) });
  console.log(`${id.padEnd(18)} ${String(files.length).padStart(3)} Dateien ${String(t0).padStart(7)} → ${String(m.idx.length / 3).padStart(5)} Dreiecke`);
}

// ---------- Muskel-Hülle (25.11.2026, Kai: „auch das Äußere dürfte anatomischer sein … gerne Neubearbeitung“) ----------
// Alle Muskeln („muscle organ“, 323 Netze); behalten wird nur, was dicht unter der Haut liegt und nach außen zeigt – die Fläche,
// die man an einer Muskelfigur von außen sieht. Tiefe Muskeln und Innenseiten entfallen (sonst läge alles übereinander).
{
  const files = filesOf(['muscle organ']);
  const m0 = load(files), nT = m0.idx.length / 3;
  // Haut-Dreiecke in ein Raster legen (Zelle 24 mm), Abstand Punkt–Dreieck
  const CELL = 24, grid = new Map(), sp = skin.pos, si = skin.idx;
  const ck = (x, y, z) => `${x},${y},${z}`;
  for (let t = 0; t < si.length; t += 3) {
    const lo = [1e9, 1e9, 1e9], hi = [-1e9, -1e9, -1e9];
    for (let e = 0; e < 3; e++) for (let c = 0; c < 3; c++) { const v = sp[si[t + e] * 3 + c]; if (v < lo[c]) lo[c] = v; if (v > hi[c]) hi[c] = v; }
    for (let x = Math.floor(lo[0] / CELL); x <= Math.floor(hi[0] / CELL); x++) for (let y = Math.floor(lo[1] / CELL); y <= Math.floor(hi[1] / CELL); y++) for (let z = Math.floor(lo[2] / CELL); z <= Math.floor(hi[2] / CELL); z++) {
      const k = ck(x, y, z); let l = grid.get(k); if (!l) grid.set(k, l = []); l.push(t);
    }
  }
  const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  function closest(p, a, b, c) { // nächster Punkt auf dem Dreieck (Ericson)
    const ab = sub(b, a), ac = sub(c, a), ap = sub(p, a), d1 = dot(ab, ap), d2 = dot(ac, ap);
    if (d1 <= 0 && d2 <= 0) return a;
    const bp = sub(p, b), d3 = dot(ab, bp), d4 = dot(ac, bp); if (d3 >= 0 && d4 <= d3) return b;
    const vc = d1 * d4 - d3 * d2; if (vc <= 0 && d1 >= 0 && d3 <= 0) { const v = d1 / (d1 - d3); return [a[0] + ab[0] * v, a[1] + ab[1] * v, a[2] + ab[2] * v]; }
    const cp = sub(p, c), d5 = dot(ab, cp), d6 = dot(ac, cp); if (d6 >= 0 && d5 <= d6) return c;
    const vb = d5 * d2 - d1 * d6; if (vb <= 0 && d2 >= 0 && d6 <= 0) { const w = d2 / (d2 - d6); return [a[0] + ac[0] * w, a[1] + ac[1] * w, a[2] + ac[2] * w]; }
    const va = d3 * d6 - d5 * d4; if (va <= 0 && d4 - d3 >= 0 && d5 - d6 >= 0) { const w = (d4 - d3) / (d4 - d3 + d5 - d6); return [b[0] + (c[0] - b[0]) * w, b[1] + (c[1] - b[1]) * w, b[2] + (c[2] - b[2]) * w]; }
    const dn = 1 / (va + vb + vc), v = vb * dn, w = vc * dn; return [a[0] + ab[0] * v + ac[0] * w, a[1] + ab[1] * v + ac[1] * w, a[2] + ab[2] * v + ac[2] * w];
  }
  const V = (arr, i) => [arr[i * 3], arr[i * 3 + 1], arr[i * 3 + 2]];
  const TIEF = +(process.env.TIEF || 15); // mm unter der Haut
  const keep = [];
  for (let t = 0; t < m0.idx.length; t += 3) {
    const A = V(m0.pos, m0.idx[t]), B = V(m0.pos, m0.idx[t + 1]), C = V(m0.pos, m0.idx[t + 2]);
    const c = [(A[0] + B[0] + C[0]) / 3, (A[1] + B[1] + C[1]) / 3, (A[2] + B[2] + C[2]) / 3];
    const gx = Math.floor(c[0] / CELL), gy = Math.floor(c[1] / CELL), gz = Math.floor(c[2] / CELL);
    let best = TIEF * TIEF, bq = null;
    for (let x = gx - 1; x <= gx + 1; x++) for (let y = gy - 1; y <= gy + 1; y++) for (let z = gz - 1; z <= gz + 1; z++) {
      const l = grid.get(ck(x, y, z)); if (!l) continue;
      for (const s of l) { const q = closest(c, V(sp, si[s]), V(sp, si[s + 1]), V(sp, si[s + 2])), d = sub(q, c), d2 = dot(d, d); if (d2 < best) { best = d2; bq = q; } }
    }
    if (!bq) continue;
    const ab = sub(B, A), ac = sub(C, A), n = [ab[1] * ac[2] - ab[2] * ac[1], ab[2] * ac[0] - ab[0] * ac[2], ab[0] * ac[1] - ab[1] * ac[0]], out = sub(bq, c);
    const nl = Math.hypot(n[0], n[1], n[2]) || 1, ol = Math.hypot(out[0], out[1], out[2]);
    if (ol > 1.5 && dot(n, out) / (nl * ol) < 0.1) continue; // zeigt nicht nach außen
    keep.push(m0.idx[t], m0.idx[t + 1], m0.idx[t + 2]);
  }
  const shell = simplify(reorder({ pos: m0.pos, idx: keep }), 46000, 0.012);
  out.push({ id: 'muskel/huelle', kind: 'shell', st: -1, mesh: Tm(shell) });
  console.log(`muskel/huelle      ${String(files.length).padStart(3)} Dateien ${String(nT).padStart(7)} → außen ${keep.length / 3} → ${shell.idx.length / 3} Dreiecke`);
  if (preview) writeObj(join(preview, 'muskel-huelle.obj'), shell);
}

// =====================================================================================================
// 4  Landmarken aus den echten Knochen (BodyParts3D-Koordinaten, mm) und Nervenbahnen
// =====================================================================================================
const verts = (m) => { const v = []; for (let i = 0; i < m.pos.length; i += 3) v.push([m.pos[i], m.pos[i + 1], m.pos[i + 2]]); return v; };
const mean = (pts) => { const c = [0, 0, 0]; for (const p of pts) { c[0] += p[0]; c[1] += p[1]; c[2] += p[2]; } return pts.length ? V3.sc(c, 1 / pts.length) : null; };
const zr = (v) => { let lo = 1e9, hi = -1e9; for (const p of v) { lo = Math.min(lo, p[2]); hi = Math.max(hi, p[2]); } return [lo, hi]; };
// Knochen von oben nach unten in Scheiben (Höhe z): Schwerpunkte der Scheiben
function column(name, n, from = 0, to = 1) {
  const v = verts(raw(name)), [lo, hi] = zr(v), out = [];
  for (let k = 0; k < n; k++) {
    const a = hi - (hi - lo) * (from + (to - from) * k / n), b = hi - (hi - lo) * (from + (to - from) * (k + 1) / n);
    const c = mean(v.filter((p) => p[2] <= a && p[2] > b)); if (c) out.push(c);
  }
  return out;
}
const region = (name, f) => mean(verts(raw(name)).filter(f));
const extreme = (name, d, f = () => true) => { let best = null, bv = -1e9; for (const p of verts(raw(name))) { if (!f(p)) continue; const v = V3.dot(p, d); if (v > bv) { bv = v; best = p; } } return best; };
const near = (name, q, r) => region(name, (p) => V3.len(V3.sub(p, q)) < r);
const off = (p, d) => V3.add(p, d);
// Wirbelkanal: Strahl entlang y (von vorn nach hinten) durch die Mittellinie in halber Höhe des Wirbels; die Schnittpunkte mit dem Netz
// wechseln zwischen „im Knochen“ und „außerhalb“ – der Kanal ist die erste Lücke hinter dem Wirbelkörper (beim Atlas hinter dem vorderen Bogen)
function rayY(m, x, z) {
  const hits = [];
  for (let k = 0; k < m.idx.length; k += 3) {
    const a = P(m, m.idx[k]), b = P(m, m.idx[k + 1]), c = P(m, m.idx[k + 2]);
    const d = (b[0] - a[0]) * (c[2] - a[2]) - (c[0] - a[0]) * (b[2] - a[2]); if (Math.abs(d) < 1e-12) continue;
    const l1 = ((b[0] - x) * (c[2] - z) - (c[0] - x) * (b[2] - z)) / d, l2 = ((c[0] - x) * (a[2] - z) - (a[0] - x) * (c[2] - z)) / d, l3 = 1 - l1 - l2;
    if (l1 < 0 || l2 < 0 || l3 < 0) continue;
    hits.push(l1 * a[1] + l2 * b[1] + l3 * c[1]);
  }
  hits.sort((p, q) => p - q);
  return hits.filter((h, i) => !i || h - hits[i - 1] > 0.4);
}
function canal(name, fr = [0.35, 0.5, 0.65]) {
  const m = raw(name), v = verts(m), [lo, hi] = zr(v), c = mean(v), found = [];
  for (const f of fr) for (const x of [-1.5, 0, 1.5]) {
    const z = lo + (hi - lo) * f, h = rayY(m, x, z);
    if (h.length >= 4) found.push([(h[1] + h[2]) / 2, h[2] - h[1], z]);
  }
  found.sort((a, b) => a[0] - b[0]);
  const med = found[Math.floor(found.length / 2)] || [c[1] + 10, 0, (lo + hi) / 2];
  return { c, z: (lo + hi) / 2, y: med[0], gap: med[1], top: hi, bot: lo, n: found.length };
}
const SPINE = [...CERV, ...THOR, ...LUMB].map((n) => ({ name: n, ...canal(n) }));
const sacrum = canal('sacrum', [0.72, 0.8, 0.88]);
// Kanal glätten (gleitendes Mittel über drei Wirbel)
{ const ys = SPINE.map((v) => v.y); SPINE.forEach((v, i) => { if (i && i < SPINE.length - 1) v.y = (ys[i - 1] + 2 * ys[i] + ys[i + 1]) / 4; }); }
console.log('Wirbelkanal (mm):', SPINE.map((s) => `${s.name.replace(/ vertebra/, '').replace(/(first|second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth|eleventh|twelfth) /, (m, a) => NUM.indexOf(a) + 1 + ' ')}: y ${s.y.toFixed(0)} Weite ${s.gap.toFixed(0)} (${s.n})`).join(' · ') + ` · Kreuzbein: y ${sacrum.y.toFixed(0)} Weite ${sacrum.gap.toFixed(0)} (${sacrum.n})`);
const canalAt = (i) => [0, SPINE[i].y, SPINE[i].z];
// Zwischenwirbelloch zwischen Wirbel i und i+1 (seitlich am Kanal, etwas vor dem Kanal)
const foramen = (i, s, wide = 21) => { const a = SPINE[i], b = SPINE[Math.min(SPINE.length - 1, i + 1)]; return [s * wide, (a.y + b.y) / 2 - 3, (a.bot + b.top) / 2]; };
const LV = (n) => SPINE.findIndex((s) => s.name === n);

const NERVES = []; // { pts (mm), r (Einheiten), main, parent, w }
const catmull = (pts, steps = 6) => {
  if (pts.length < 3) return pts;
  const out = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
    for (let k = 0; k < steps; k++) { const t = k / steps, t2 = t * t, t3 = t2 * t; out.push([0, 1, 2].map((c) => 0.5 * (2 * p1[c] + (-p0[c] + p2[c]) * t + (2 * p0[c] - 5 * p1[c] + 4 * p2[c] - p3[c]) * t2 + (-p0[c] + 3 * p1[c] - 3 * p2[c] + p3[c]) * t3))); }
  }
  out.push(pts[pts.length - 1]);
  return out;
};
function nerve(pts, r, o = {}) { NERVES.push({ pts: o.raw ? pts : catmull(pts.filter(Boolean)), r, main: !!o.main, parent: o.parent ?? -1, w: o.w ?? Math.min(1, r / 1.4), name: o.name || '' }); return NERVES.length - 1; }

// Rückenmark: Hirnstamm → Kanal C1 … L1 (Kegel), Endfaden bis zum Kreuzbein (S1/S2 = Teilung in die Beine)
const medulla = region('medulla oblongata', () => true), medBot = (() => { const v = verts(raw('medulla oblongata')), [lo] = zr(v); return mean(v.filter((p) => p[2] < lo + 8)); })();
const conusI = LV('first lumbar vertebra');
const cordPts = [mean([medulla, medBot]), medBot, ...SPINE.slice(0, conusI + 1).map((_, i) => canalAt(i)), [0, (SPINE[conusI].y + SPINE[conusI + 1].y) / 2, SPINE[conusI].bot]];
const cord = nerve(cordPts, 1.45, { main: true, w: 1, name: 'Rückenmark' });
const SPLIT_P = [0, sacrum.y, sacrum.z];
const filum = nerve([cordPts[cordPts.length - 1], ...SPINE.slice(conusI + 1).map((_, k) => canalAt(conusI + 1 + k)), SPLIT_P], 0.34, { main: true, w: 0.4, name: 'Endfaden' });
// Kreuzbein: vordere Löcher S1–S4 (vorderste Punkte der Kreuzbein-Vorderfläche je Höhe, seitlich ±27 mm)
const sacV = verts(raw('sacrum')), [sLo, sHi] = zr(sacV);
const sacralForamen = (k, s) => { const z = sHi - (sHi - sLo) * (0.22 + k * 0.17); const c = sacV.filter((p) => Math.abs(p[0] - s * (27 - k * 3)) < 7 && Math.abs(p[2] - z) < 7); let best = null; for (const p of c) if (!best || p[1] < best[1]) best = p; return best ? off(best, [0, 3, 0]) : [s * 25, sacrum.y - 25, z]; };

for (const s of [1, -1]) {
  const side = s > 0 ? 'left' : 'right', S = (n) => `${side} ${n}`;
  const med = [-s, 0, 0], lat = [s, 0, 0], ant = [0, -1, 0], post = [0, 1, 0], up = [0, 0, 1];
  const mix = (...l) => l.reduce((a, [d, k]) => V3.add(a, V3.sc(d, k)), [0, 0, 0]);
  // --- Spinalnerven: kurze Wurzeln an jedem Zwischenwirbelloch (Hals, Brust, Lende)
  SPINE.forEach((v, i) => {
    if (i >= SPINE.length - 1) return;
    const f = foramen(i, s, i < 7 ? 19 : i < 19 ? 21 : 24), c = canalAt(i);
    const isThor = i >= 6 && i < 18; // C7/T1 … T11/T12 → Zwischenrippennerven
    const root = nerve([V3.lerp(c, f, 0.15), V3.lerp(c, f, 0.6), f, off(f, [s * 7, -3, -2])], 0.28, { parent: cord, name: `Wurzel ${i}` });
    if (isThor) {
      // Zwischenrippennerv: am Unterrand der Rippe entlang nach vorn (Rippe i−5 = erste Rippe bei T1)
      const ri = i - 6; if (ri < 0 || ri > 11) return;
      const rv = verts(raw(S(`${NUM[ri]} rib`))), sp = [0, SPINE[i].y, 0];
      const ang = (p) => Math.atan2(sp[1] - p[1], s * p[0]); // hinten (−) → seitlich (0) → vorn (+)
      const A = rv.map((p) => [ang(p), p]).sort((a, b) => a[0] - b[0]), a0 = A[0][0], a1 = A[A.length - 1][0], nb = 9, line = [];
      for (let k = 0; k < nb; k++) { const lo = a0 + (a1 - a0) * k / nb, hi = a0 + (a1 - a0) * (k + 1) / nb, c2 = mean(A.filter((e) => e[0] >= lo && e[0] < hi).map((e) => e[1])); if (c2) line.push(off(c2, [s * -2, 0, -5])); }
      nerve([f, ...line], 0.3, { parent: cord, name: `Zwischenrippennerv ${ri + 1}` });
    }
    return root;
  });
  // --- Armgeflecht C5–Th1 → zwischen Schlüsselbein und erster Rippe → Achsel → drei Armnerven bis in die Finger
  const clav = region(S('clavicle'), () => true), rib1 = region(S('first rib'), () => true);
  const trunk = V3.lerp(clav, rib1, 0.45), hum = column(S('humerus'), 10), humV = verts(raw(S('humerus'))), [hLo, hHi] = zr(humV);
  const head = mean(humV.filter((p) => p[2] > hHi - 40));
  const axilla = off(head, mix([med, 24], [up, -48], [ant, 4]));
  const epiM = mean(humV.filter((p) => p[2] < hLo + 30).sort((a, b) => s * a[0] - s * b[0]).slice(0, 25));
  const epiL = mean(humV.filter((p) => p[2] < hLo + 30).sort((a, b) => s * b[0] - s * a[0]).slice(0, 25));
  const rad = column(S('radius'), 8), uln = column(S('ulna'), 8), radD = region(S('radius'), (p) => p[2] < zr(verts(raw(S('radius'))))[0] + 12), ulnD = region(S('ulna'), (p) => p[2] < zr(verts(raw(S('ulna'))))[0] + 12);
  const plex = [4, 5, 6, 7, 8].map((lv) => nerve([V3.lerp(canalAt(lv), foramen(lv, s, 19), 0.2), foramen(lv, s, 19), V3.lerp(foramen(lv, s, 19), trunk, 0.55), trunk], 0.44, { parent: cord, name: `Armgeflecht ${lv}` }));
  const palm = (p, k = 6) => off(p, [0, -k, 0]); // Handfläche zeigt nach vorn
  const digit = (f) => {
    const mc = { thumb: 'first', 'index finger': 'second', 'middle finger': 'third', 'ring finger': 'fourth', 'little finger': 'fifth' }[f];
    const pts = column(S(`${mc} metacarpal bone`), 3);
    for (const q of FINGER[f]) pts.push(...column(`${q} phalanx of ${side} ${f}`, 2));
    const dist = verts(raw(`distal phalanx of ${side} ${f}`)); pts.push(mean(dist.filter((p) => p[2] < zr(dist)[0] + 4)));
    return pts;
  };
  const wrist = V3.lerp(radD, ulnD, 0.5);
  const cubital = palm(V3.lerp(epiM, epiL, 0.5), 12);
  const median = nerve([trunk, axilla, palm(off(hum[4], V3.sc(med, 12)), 4), palm(off(hum[7], V3.sc(med, 8)), 6), cubital, palm(V3.lerp(rad[3], uln[3], 0.5), 6), palm(V3.lerp(rad[6], uln[6], 0.5), 7), palm(wrist, 9), palm(column(S('third metacarpal bone'), 2)[0], 8)], 0.5, { parent: plex[2], name: 'Mittelnerv' });
  for (const f of ['thumb', 'index finger', 'middle finger']) nerve([palm(column(S('third metacarpal bone'), 2)[0], 8), ...digit(f).map((p) => palm(p, 6))], 0.28, { parent: median, name: `Mittelnerv ${f}` });
  const ulnar = nerve([trunk, axilla, off(hum[4], mix([med, 16], [post, 4])), off(hum[8], mix([med, 10], [post, 8])), off(epiM, mix([post, 7])), off(uln[2], mix([med, 4], [ant, 3])), off(uln[6], mix([ant, 5])), palm(ulnD, 8), palm(column(S('fifth metacarpal bone'), 2)[0], 6)], 0.46, { parent: plex[3], name: 'Ellennerv' });
  for (const f of ['ring finger', 'little finger']) nerve([palm(column(S('fifth metacarpal bone'), 2)[0], 6), ...digit(f).map((p) => palm(p, 6))], 0.28, { parent: ulnar, name: `Ellennerv ${f}` });
  const radial = nerve([trunk, axilla, off(hum[3], mix([post, 14])), off(hum[6], mix([lat, 13], [post, 4])), off(epiL, mix([ant, 10], [med, 3])), off(rad[2], mix([lat, 5], [post, 3])), off(rad[6], mix([lat, 4], [post, 6])), off(radD, mix([post, 8])), off(column(S('first metacarpal bone'), 2)[1], mix([post, 7]))], 0.44, { parent: plex[1], name: 'Speichennerv' });
  nerve([off(column(S('first metacarpal bone'), 2)[1], mix([post, 7])), ...digit('thumb').slice(3).map((p) => off(p, [0, 6, 0]))], 0.26, { parent: radial, name: 'Speichennerv Daumen' });

  // --- Lendengeflecht → Oberschenkelnerv am Lendenmuskel entlang, unter dem Leistenband zur Vorderseite des Oberschenkels
  const femV = verts(raw(S('femur'))), [fLo, fHi] = zr(femV), fem = column(S('femur'), 12);
  const fHead = mean(femV.filter((p) => p[2] > fHi - 40).sort((a, b) => s * a[0] - s * b[0]).slice(0, 80));
  const troch = extreme(S('femur'), V3.norm([s, 0, 0.35]), (p) => p[2] > fHi - 70);
  const condM = mean(femV.filter((p) => p[2] < fLo + 30).sort((a, b) => s * a[0] - s * b[0]).slice(0, 40)), condL = mean(femV.filter((p) => p[2] < fLo + 30).sort((a, b) => s * b[0] - s * a[0]).slice(0, 40));
  const hipV = verts(raw(S('hip bone'))), [hipLo, hipHi] = zr(hipV);
  const asis = extreme(S('hip bone'), V3.norm([s * 0.3, -1, 0.35]), (p) => p[2] > hipHi - 90);
  const pubic = extreme(S('hip bone'), V3.norm([-s * 0.6, -1, -0.2]), (p) => p[2] < hipLo + 110 && p[2] > hipLo + 40);
  const tuber = near(S('hip bone'), hipV.reduce((a, p) => (p[2] < a[2] ? p : a)), 18);
  const inguinal = off(V3.lerp(pubic, asis, 0.58), [0, -4, -6]);
  const psoas = column(S('psoas major'), 8);
  const l2 = LV('second lumbar vertebra'), l4 = LV('fourth lumbar vertebra');
  const femoral = nerve([foramen(l2, s, 24), off(psoas[3], mix([lat, 14])), off(psoas[5], mix([lat, 14], [ant, 4])), off(psoas[7], mix([lat, 10], [ant, 10])), inguinal, off(fem[3], mix([ant, 26], [med, 6])), off(fem[5], mix([ant, 24], [med, 10]))], 0.6, { parent: cord, name: 'Oberschenkelnerv' });
  [l2 + 1, l4].forEach((lv) => nerve([foramen(lv, s, 24), off(psoas[Math.min(7, 4 + (lv - l2))], mix([lat, 12]))], 0.3, { parent: cord, name: 'Lendenwurzel' }));
  const tib = column(S('tibia'), 10), fib = column(S('fibula'), 10), tibV = verts(raw(S('tibia'))), fibV = verts(raw(S('fibula')));
  const malM = mean(tibV.filter((p) => p[2] < zr(tibV)[0] + 25).sort((a, b) => s * a[0] - s * b[0]).slice(0, 30)), malL = mean(fibV.filter((p) => p[2] < zr(fibV)[0] + 18));
  const fibHead = mean(fibV.filter((p) => p[2] > zr(fibV)[1] - 18));
  nerve([off(fem[5], mix([ant, 24], [med, 10])), off(fem[8], mix([med, 26], [ant, 4])), off(condM, mix([med, 12])), off(tib[2], mix([med, 16], [ant, 2])), off(tib[6], mix([med, 13], [ant, 4])), off(malM, mix([ant, 10], [med, 4]))], 0.3, { parent: femoral, name: 'Rosennerv' });
  // --- Kreuzgeflecht → Ischiasnerv (unter dem birnenförmigen Muskel durch das große Hüftloch, zwischen Rollhügel und Sitzbein,
  //     hinten am Oberschenkel) → Kniekehle → Schienbeinnerv (Wade, hinter dem Innenknöchel, Fußsohle bis in die Zehen) = Hauptbahn
  const piri = region(S('piriformis'), () => true);
  const sciF = off(piri, [s * 4, 6, -20]);
  const popl = off(V3.lerp(condM, condL, 0.5), [0, 24, 28]);
  const calcV = verts(raw(S('calcaneus'))), sole = (n, f) => { const v = verts(raw(n)); return off(mean(v.filter((p) => p[2] < zr(v)[0] + 6)), [0, f || 0, -3]); };
  const toe = (t) => { const mt = { 'big toe': 'first', 'second toe': 'second', 'third toe': 'third', 'fourth toe': 'fourth', 'little toe': 'fifth' }[t]; const pts = [sole(S(`${mt} metatarsal bone`))]; for (const q of TOE[t]) pts.push(sole(`${q} phalanx of ${side} ${t}`)); return pts; };
  const heel = off(mean(calcV.filter((p) => p[2] < zr(calcV)[0] + 10)), [0, -18, -2]);
  const legMain = [SPLIT_P, sacralForamen(0, s), off(sacralForamen(1, s), [s * 10, -2, -6]), sciF, off(V3.lerp(troch, tuber, 0.5), [0, 18, -8]), off(fem[4], mix([post, 26])), off(fem[7], mix([post, 26])), popl,
    off(V3.lerp(tib[2], fib[2], 0.5), mix([post, 26])), off(V3.lerp(tib[5], fib[5], 0.45), mix([post, 22])), off(tib[8], mix([post, 18], [med, 6])), off(malM, mix([post, 12], [med, 2])), heel, ...toe('second toe').slice(0, 2)];
  const sci = nerve(legMain, 0.95, { main: true, w: 0.8, name: 'Ischias/Schienbeinnerv' });
  [1, 2, 3].forEach((k) => nerve([sacralForamen(k, s), off(sacralForamen(k, s), [s * 8, -2, -4]), sciF], 0.34, { parent: filum, name: 'Kreuzwurzel' }));
  nerve([foramen(l4 + 1, s, 24), off(foramen(l4 + 1, s, 24), [s * 14, -10, -16]), sciF], 0.36, { parent: cord, name: 'Lendenwurzel L5' });
  for (const t of ['big toe', 'third toe', 'fourth toe', 'little toe']) nerve([heel, ...toe(t)], 0.26, { parent: sci, name: `Zehennerv ${t}` });
  // Wadenbeinnerv: um den Wadenbeinkopf nach vorn, außen am Unterschenkel bis zum Fußrücken
  const dors = (n) => { const v = verts(raw(n)); return off(mean(v.filter((p) => p[2] > zr(v)[1] - 6)), [0, 0, 3]); };
  nerve([popl, off(fibHead, mix([lat, 8], [post, 8])), off(fib[1], mix([lat, 6], [ant, 10])), off(fib[4], mix([lat, 4], [ant, 14])), off(fib[7], mix([ant, 14])), off(V3.lerp(malM, malL, 0.5), mix([ant, 22], [up, 6])), dors(S('third metatarsal bone')), dors(`proximal phalanx of ${side} third toe`)], 0.46, { parent: sci, name: 'Wadenbeinnerv' });
}

// =====================================================================================================
// 5  Datei schreiben
// =====================================================================================================
// Nerven in den Grundriss; Hauptbahnen müssen im Grundriss stetig nach unten laufen (Leuchtpunkt, lineTo)
const nerveOut = NERVES.map((n) => {
  const pts = n.pts.map(T);
  if (n.main) for (let i = 1; i < pts.length; i++) if (pts[i][1] > pts[i - 1][1] - 0.05) pts[i][1] = pts[i - 1][1] - 0.05;
  return { pts: pts.map((p) => p.map((v) => +v.toFixed(2))), r: n.r, main: n.main, parent: n.parent, w: +n.w.toFixed(2), name: n.name };
});
const head = { quelle: QUELLE, bearbeitung: 'Teile ausgewählt, Haut neutralisiert, Netze vereinfacht, Koordinaten in den Grundriss von Kapitel 01 umgerechnet; Nervenbahnen an echten Landmarken berechnet', einheit: 'Grundriss-Einheiten', massstab: +K.toFixed(6), split: +(215 - T(SPLIT_P)[1]).toFixed(2), parts: [], nerves: nerveOut };
const chunks = []; let offB = 0, nT = 0;
for (const { id, kind, st, mesh } of out) {
  const m = mesh, nv = m.pos.length / 3, nt = m.idx.length / 3;
  const lo = [1e9, 1e9, 1e9], hi = [-1e9, -1e9, -1e9];
  for (let i = 0; i < m.pos.length; i++) { lo[i % 3] = Math.min(lo[i % 3], m.pos[i]); hi[i % 3] = Math.max(hi[i % 3], m.pos[i]); }
  const q = new Uint16Array(m.pos.length);
  for (let i = 0; i < m.pos.length; i++) q[i] = Math.round((m.pos[i] - lo[i % 3]) / Math.max(1e-6, hi[i % 3] - lo[i % 3]) * 65535);
  const pb = new Uint8Array(nv * 6);
  for (let i = 0; i < nv; i++) for (let k = 0; k < 3; k++) { const d = (q[i * 3 + k] - (i ? q[i * 3 - 3 + k] : 0)) & 0xFFFF; pb[k * 2 * nv + i] = d & 255; pb[(k * 2 + 1) * nv + i] = d >> 8; }
  const ib = []; let hw = 0;
  for (const i of m.idx) { let d = hw - i; if (d === 0) hw++; while (d > 127) { ib.push((d & 127) | 128); d >>= 7; } ib.push(d); }
  const ibuf = Uint8Array.from(ib);
  head.parts.push({ id, kind, st, nv, nt, lo: lo.map((v) => +v.toFixed(4)), hi: hi.map((v) => +v.toFixed(4)), p: offB, i: offB + pb.length, il: ibuf.length });
  chunks.push(pb, ibuf); offB += pb.length + ibuf.length; nT += nt;
}
const hj = Buffer.from(JSON.stringify(head), 'utf8'), len = Buffer.alloc(4); len.writeUInt32LE(hj.length);
const rawB = Buffer.concat([len, hj, ...chunks.map((c) => Buffer.from(c.buffer, c.byteOffset, c.byteLength))]);
const gz = gzipSync(rawB, { level: 9 });
writeFileSync(OUT, gz);
console.log(`${head.parts.length} Teile, ${nT} Dreiecke, ${nerveOut.length} Nervenbahnen, Teilung bei Grundriss-Höhe ${head.split} → ${(rawB.length / 1024).toFixed(0)} KB roh, ${(gz.length / 1024).toFixed(0)} KB gepackt: ${OUT}`);
if (preview) { // Vorschau: Nerven als dünne Röhren (BodyParts3D-Koordinaten)
  const tube = { pos: [], idx: [] };
  for (const n of NERVES) for (let i = 0; i < n.pts.length - 1; i++) {
    const a = n.pts[i], b = n.pts[i + 1], d = V3.norm(V3.sub(b, a)), u = V3.norm(V3.cross(d, Math.abs(d[2]) < 0.9 ? [0, 0, 1] : [1, 0, 0])), v = V3.cross(d, u), r = Math.max(1.2, n.r * 2), base = tube.pos.length / 3;
    for (const c of [a, b]) for (let k = 0; k < 4; k++) { const ang = k * Math.PI / 2; tube.pos.push(...V3.add(c, V3.add(V3.sc(u, Math.cos(ang) * r), V3.sc(v, Math.sin(ang) * r)))); }
    for (let k = 0; k < 4; k++) { const k2 = (k + 1) % 4; tube.idx.push(base + k, base + k2, base + 4 + k2, base + k, base + 4 + k2, base + 4 + k); }
  }
  writeObj(join(preview, 'nerven.obj'), tube);
  writeFileSync(join(preview, 'nerven.json'), JSON.stringify(NERVES.map((n) => ({ name: n.name, pts: n.pts.map((p) => p.map((v) => +v.toFixed(1))) }))));
}
