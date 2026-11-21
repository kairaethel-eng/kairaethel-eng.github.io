// Liegende Figur der Manuthera aus echter Körperoberfläche (21.11.2026, Kai: „eine preisgekrönte, bessere Figur auf der Manuthera“).
// Quelle: BodyParts3D, © The Database Center for Life Science licensed under CC Attribution 4.0 International – Haut (FJ2810) und
//   Knochen als Gelenk-Bezug. Verändert: vereinfacht, in Bauchlage auf die Liege gelegt, Arme in Schulter und Ellbogen gebeugt
//   (aus den echten Knochen gemessene Gelenkpunkte), Unterarme gedreht (Handflächen nach unten), Weichteile auf die Polster gesetzt.
// Rohdaten liegen NICHT im Repo (62 MB): partof_BP3D_4.0_obj_99.zip + partof_element_parts.txt von
//   https://dbarchive.biosciencedbc.jp/data/bodyparts3d/LATEST/ (wie tools/anatomie-motive.mjs)
// Aufruf:  node tools/manu-figur.mjs <obj-Ordner> <partof_element_parts.txt>      → assets/manu-figur.bin
// Format wie assets/motive-anatomie.bin (Leser: decode() in src/wirbel-echt/anatomie.js); Koordinaten = Raum der Liege
// (src/manu/formen.js: x Kopf → Fuß, y oben, z quer; Polster-Oberkante y = 0, Gesichtsöffnung bei x = −1,99).
// Teile: figur/koerper · figur/arm-l · figur/arm-r (Dreiecksnetze) · figur/wirbel (nur Punkte: Wirbelkörper C1 … L5, Kreuzbein).
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { MeshoptSimplifier } from 'three/examples/jsm/libs/meshopt_simplifier.module.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const [objDir, listFile] = process.argv.slice(2);
if (!objDir || !listFile) { console.error('Aufruf: node tools/manu-figur.mjs <obj-Ordner> <partof_element_parts.txt>'); process.exit(1); }
const OUT = join(root, 'assets', 'manu-figur.bin');
const QUELLE = 'BodyParts3D, © The Database Center for Life Science licensed under CC Attribution 4.0 International';
const ZIEL_DREIECKE = 30000;

// ---------- Einpassen in die Liege (Maße der Liege: src/manu/formen.js) ----------
const NASE_X = -1.99;      // Nasenspitze über der Gesichtsöffnung
const SPRUNG_X = 2.25;     // Vorderkante des Schienbeins am Fußende (Polster endet bei 2,23) → Füße hängen frei über das Ende
const ELLBOGEN = { dx: 0.16, z: 0.9 }; // Ellbogen: etwas fußwärts der Schulter, über der Mitte der Armstütze
const UNTERARM = [-1, 0, -0.12];        // Unterarm liegt waagerecht kopfwärts, leicht zur Mitte
const INTIM = { x: [0.02, 0.42], z: 0.13, y: 0.14 };

const elements = new Map();
for (const l of readFileSync(listFile, 'utf8').split('\n').slice(1)) { const [, name, el] = l.trim().split('\t'); if (!name || !el) continue; if (!elements.has(name)) elements.set(name, new Set()); elements.get(name).add(el); }
const filesOf = (names) => { const out = []; for (const n of names) { const e = elements.get(n); if (!e) { console.warn('⚠ nicht in der Liste:', n); continue; } for (const x of e) { const f = join(objDir, `${x}.obj`); if (existsSync(f)) out.push(f); } } return out; };

// OBJ lesen (BodyParts3D: mm, x links, y hinten (vorn negativ), z oben), Punkte verschweißen
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
  return { pos: np, idx: ni, map };
}
const V3 = {
  sub: (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], add: (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]], sc: (a, s) => [a[0] * s, a[1] * s, a[2] * s],
  dot: (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2], cross: (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]],
  len: (a) => Math.hypot(a[0], a[1], a[2]), nrm: (a) => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; },
};
// Drehung als 3×3 (zeilenweise) um Achse a (Einheitsvektor) mit Winkel t; Drehung, die Richtung u auf v bringt
const rotAxis = (a, t) => { const c = Math.cos(t), s = Math.sin(t), C = 1 - c, [x, y, z] = a; return [c + x * x * C, x * y * C - z * s, x * z * C + y * s, y * x * C + z * s, c + y * y * C, y * z * C - x * s, z * x * C - y * s, z * y * C + x * s, c + z * z * C]; };
const rotTo = (u, v) => { u = V3.nrm(u); v = V3.nrm(v); const ax = V3.cross(u, v), s = V3.len(ax), c = V3.dot(u, v); return s < 1e-9 ? [1, 0, 0, 0, 1, 0, 0, 0, 1] : rotAxis(V3.sc(ax, 1 / s), Math.atan2(s, c)); };
const mul = (A, B) => [0, 1, 2].flatMap((r) => [0, 1, 2].map((c) => A[r * 3] * B[c] + A[r * 3 + 1] * B[3 + c] + A[r * 3 + 2] * B[6 + c]));
const app = (M, p) => [M[0] * p[0] + M[1] * p[1] + M[2] * p[2], M[3] * p[0] + M[4] * p[1] + M[5] * p[2], M[6] * p[0] + M[7] * p[1] + M[8] * p[2]];
// starre Bewegung: Drehung M um Punkt c, dann Verschiebung t → { M, c, t }; Punkt: M(p − c) + c + t
const rig = (M, c, t = [0, 0, 0]) => ({ M, c, t });
const doRig = (R, p) => V3.add(V3.add(app(R.M, V3.sub(p, R.c)), R.c), R.t);
const then = (A, B) => { // erst A, dann B
  const M = mul(B.M, A.M), o = doRig(B, doRig(A, [0, 0, 0])); // Bild des Ursprungs
  return { M, c: [0, 0, 0], t: o };
};

// Umlaufsinn vereinheitlichen: im Original zeigt rund die Hälfte der Haut-Dreiecke nach innen (Volumen hebt sich fast auf) –
// dann läge der Kern der Bühne (Normale nach innen versetzt) vor den Punkten. Über gemeinsame Kanten ausbreiten, je Zusammenhang
// so drehen, dass das Volumen positiv ist (Normalen nach außen).
function orient(m) {
  const idx = m.idx, nt = idx.length / 3, edge = new Map(), key = (a, b) => (a < b ? a * 4194304 + b : b * 4194304 + a);
  for (let t = 0; t < nt; t++) for (let e = 0; e < 3; e++) { const k = key(idx[t * 3 + e], idx[t * 3 + (e + 1) % 3]); let l = edge.get(k); if (!l) edge.set(k, (l = [])); l.push(t); }
  const flip = new Int8Array(nt), seen = new Uint8Array(nt), P = m.pos; let comps = 0, flipped = 0;
  const dirOf = (t, a, b) => { for (let e = 0; e < 3; e++) if (idx[t * 3 + e] === a && idx[t * 3 + (e + 1) % 3] === b) return 1; return -1; };
  for (let s = 0; s < nt; s++) {
    if (seen[s]) continue; comps++;
    const q = [s], comp = []; seen[s] = 1;
    while (q.length) {
      const t = q.pop(); comp.push(t);
      for (let e = 0; e < 3; e++) {
        let a = idx[t * 3 + e], b = idx[t * 3 + (e + 1) % 3]; if (flip[t]) [a, b] = [b, a];
        const l = edge.get(key(a, b)); if (l.length !== 2) continue; // nur saubere Kanten
        const u = l[0] === t ? l[1] : l[0]; if (seen[u]) continue;
        seen[u] = 1; flip[u] = dirOf(u, a, b) === 1 ? 1 : 0; q.push(u); // Nachbar muss die Kante gegenläufig haben
      }
    }
    let vol = 0;
    for (const t of comp) { let [a, b, c] = [idx[t * 3], idx[t * 3 + 1], idx[t * 3 + 2]]; if (flip[t]) [b, c] = [c, b]; a *= 3; b *= 3; c *= 3; vol += P[a] * (P[b + 1] * P[c + 2] - P[b + 2] * P[c + 1]) - P[a + 1] * (P[b] * P[c + 2] - P[b + 2] * P[c]) + P[a + 2] * (P[b] * P[c + 1] - P[b + 1] * P[c]); }
    if (vol < 0) for (const t of comp) flip[t] ^= 1;
  }
  for (let t = 0; t < nt; t++) if (flip[t]) { const b = idx[t * 3 + 1]; idx[t * 3 + 1] = idx[t * 3 + 2]; idx[t * 3 + 2] = b; flipped++; }
  return { comps, flipped };
}

// ---------- Knochen: Gelenkpunkte und Zuordnung der Haut ----------
const ribs = ['first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'ninth', 'tenth', 'eleventh', 'twelfth'];
const verts = ['cervical', 'thoracic', 'lumbar'].flatMap((k) => [...elements.keys()].filter((n) => n.endsWith(` ${k} vertebra`) && !n.startsWith('intervertebral')));
const RUMPF = [...verts, 'atlas', 'axis', 'sacrum', 'body of sternum', 'manubrium of sternum', 'frontal bone', 'occipital bone', 'mandible',
  ...['left', 'right'].flatMap((s) => [`${s} foot`, `${s} talus`, `${s} calcaneus`, `${s} scapula`, `${s} clavicle`, `${s} hip bone`, `${s} femur`, `${s} tibia`, `${s} fibula`, `${s} parietal bone`, ...ribs.map((r) => `${s} ${r} rib`)])];
const KARPAL = ['scaphoid', 'lunate', 'triquetral', 'pisiform', 'trapezium', 'trapezoid', 'capitate', 'hamate'];
const bone = (names) => load(filesOf(names)).pos;
const SIDES = { l: 'left', r: 'right' };
const B = { rumpf: bone(RUMPF) };
for (const [s, n] of Object.entries(SIDES)) {
  B['ob' + s] = bone([`${n} humerus`]);
  B['un' + s] = bone([`${n} radius`, `${n} ulna`]);
  B['ha' + s] = bone([`${n} hand`, ...KARPAL.map((k) => `${n} ${k}`)]);
}
// Gelenkmitten (mm): Oberarmkopf = obere Kappe des Oberarms, Ellbogen = untere Kappe, Handgelenk = untere Kappe von Speiche/Elle
const cap = (pos, top, mm) => { let z0 = top ? -1e9 : 1e9; for (let i = 2; i < pos.length; i += 3) z0 = top ? Math.max(z0, pos[i]) : Math.min(z0, pos[i]); const c = [0, 0, 0]; let n = 0; for (let i = 0; i < pos.length; i += 3) if (top ? pos[i + 2] > z0 - mm : pos[i + 2] < z0 + mm) { c[0] += pos[i]; c[1] += pos[i + 1]; c[2] += pos[i + 2]; n++; } return V3.sc(c, 1 / n); };
const J = {};
for (const s of Object.keys(SIDES)) J[s] = { S: cap(B['ob' + s], true, 40), E: cap(B['ob' + s], false, 25), W: cap(B['un' + s], false, 18) };
// Haut-Ecke → nächster Knochen (Rumpf 0 · Oberarm 1 · Unterarm 2 · Hand 3, je Seite); Knochenpunkte ausgedünnt, Raster für die Suche
const groups = [['rumpf', 0, null], ...Object.keys(SIDES).flatMap((s) => [['ob' + s, 1, s], ['un' + s, 2, s], ['ha' + s, 3, s]])];
const G = 30, grid = new Map(), gk = (x, y, z) => `${Math.floor(x / G)},${Math.floor(y / G)},${Math.floor(z / G)}`;
groups.forEach(([k], gi) => { const pos = B[k], step = k === 'rumpf' ? 3 : 1; for (let i = 0; i < pos.length; i += 3 * step) { const key = gk(pos[i], pos[i + 1], pos[i + 2]); let l = grid.get(key); if (!l) grid.set(key, (l = [])); l.push(pos[i], pos[i + 1], pos[i + 2], gi); } });
const nearPt = (p) => { // nächster Knochenpunkt (Lage)
  let best = 1e18, bp = p;
  for (let r = 1; r <= 8; r++) {
    const cx = Math.floor(p[0] / G), cy = Math.floor(p[1] / G), cz = Math.floor(p[2] / G);
    for (let a = -r; a <= r; a++) for (let b = -r; b <= r; b++) for (let c = -r; c <= r; c++) {
      if (Math.max(Math.abs(a), Math.abs(b), Math.abs(c)) !== r && r > 1) continue;
      const l = grid.get(`${cx + a},${cy + b},${cz + c}`); if (!l) continue;
      for (let i = 0; i < l.length; i += 4) { const d = (l[i] - p[0]) ** 2 + (l[i + 1] - p[1]) ** 2 + (l[i + 2] - p[2]) ** 2; if (d < best) { best = d; bp = [l[i], l[i + 1], l[i + 2]]; } }
    }
    if (best < ((r - 0.5) * G) ** 2) break;
  }
  return bp;
};
const near = (p) => {
  let best = 1e18, bg = 0;
  for (let r = 1; r <= 6; r++) {
    const cx = Math.floor(p[0] / G), cy = Math.floor(p[1] / G), cz = Math.floor(p[2] / G);
    for (let a = -r; a <= r; a++) for (let b = -r; b <= r; b++) for (let c = -r; c <= r; c++) {
      if (Math.max(Math.abs(a), Math.abs(b), Math.abs(c)) !== r && r > 1) continue;
      const l = grid.get(`${cx + a},${cy + b},${cz + c}`); if (!l) continue;
      for (let i = 0; i < l.length; i += 4) { const d = (l[i] - p[0]) ** 2 + (l[i + 1] - p[1]) ** 2 + (l[i + 2] - p[2]) ** 2; if (d < best) { best = d; bg = l[i + 3]; } }
    }
    if (best < ((r - 0.5) * G) ** 2) break;
  }
  return bg;
};
await MeshoptSimplifier.ready;
// ---------- Haut lesen, Innenfläche abtrennen, vereinfachen ----------
let skin = load(filesOf(['skin']));
const t0 = skin.idx.length / 3;
{ const o = orient(skin); console.log(`Umlaufsinn: ${o.comps} Zusammenhänge, ${o.flipped} Dreiecke gedreht`); }
// Die Haut ist eine Schicht (Außen- und Innenfläche, rund 2 mm auseinander). Außen zeigt die Flächen-Normale vom nächsten Knochen weg,
// innen zu ihm hin → Innenfläche entfällt (sonst doppelte Punkte, und ihr Kern stieße durch die Außenfläche).
{
  const I = skin.idx, Pp = skin.pos, keep = [];
  for (let t = 0; t < I.length; t += 3) {
    const a = I[t] * 3, b = I[t + 1] * 3, c = I[t + 2] * 3;
    const g = [(Pp[a] + Pp[b] + Pp[c]) / 3, (Pp[a + 1] + Pp[b + 1] + Pp[c + 1]) / 3, (Pp[a + 2] + Pp[b + 2] + Pp[c + 2]) / 3];
    const nn = V3.cross([Pp[b] - Pp[a], Pp[b + 1] - Pp[a + 1], Pp[b + 2] - Pp[a + 2]], [Pp[c] - Pp[a], Pp[c + 1] - Pp[a + 1], Pp[c + 2] - Pp[a + 2]]);
    const q = nearPt(g);
    if (V3.dot(nn, V3.sub(g, q)) > 0) keep.push(I[t], I[t + 1], I[t + 2]);
  }
  console.log(`Innenfläche: ${(I.length - keep.length) / 3} von ${I.length / 3} Dreiecken entfallen`);
  skin = reorder({ pos: skin.pos, idx: keep });
}
{ const [si] = MeshoptSimplifier.simplify(new Uint32Array(skin.idx), new Float32Array(skin.pos), 3, ZIEL_DREIECKE * 3, 0.01, []); skin = reorder({ pos: skin.pos, idx: Array.from(si) }); }
const nv = skin.pos.length / 3, P = (i) => [skin.pos[i * 3], skin.pos[i * 3 + 1], skin.pos[i * 3 + 2]];
console.log(`Haut: ${t0} → ${skin.idx.length / 3} Dreiecke, ${nv} Ecken`);

// Gewichte je Ecke: w[0] Rumpf · w[1] Oberarm · w[2] Unterarm+Hand; Seite aus dem Knochen
const W = new Float32Array(nv * 3), side = new Int8Array(nv); // 0 Rumpf, 1 links, 2 rechts
for (let i = 0; i < nv; i++) {
  const g = groups[near(P(i))]; const lvl = g[1];
  if (lvl === 0) W[i * 3] = 1; else { W[i * 3 + (lvl === 1 ? 1 : 2)] = 1; side[i] = g[2] === 'l' ? 1 : 2; }
}
// Seite auch für Rumpf-Ecken nahe der Schulter (für das Glätten): nach x
for (let i = 0; i < nv; i++) if (!side[i]) side[i] = skin.pos[i * 3] > 0 ? 1 : 2;
// weich machen über die Netz-Nachbarn (Übergänge an Schulter und Ellbogen)
const nb = Array.from({ length: nv }, () => new Set());
for (let k = 0; k < skin.idx.length; k += 3) { const a = skin.idx[k], b = skin.idx[k + 1], c = skin.idx[k + 2]; nb[a].add(b).add(c); nb[b].add(a).add(c); nb[c].add(a).add(b); }
for (let it = 0; it < 14; it++) {
  const N = new Float32Array(W);
  for (let i = 0; i < nv; i++) { let s0 = W[i * 3], s1 = W[i * 3 + 1], s2 = W[i * 3 + 2], n = 1; for (const j of nb[i]) { s0 += W[j * 3]; s1 += W[j * 3 + 1]; s2 += W[j * 3 + 2]; n++; } N[i * 3] = s0 / n; N[i * 3 + 1] = s1 / n; N[i * 3 + 2] = s2 / n; }
  W.set(N);
}

// ---------- in den Raum der Liege (noch ohne Arm-Haltung) ----------
// x = −(z − zNase)·k + NASE_X · y = (y − Vorderkante(z))·k (Weichteile liegen auf) · z = x·k
const zMin = Math.min(...Array.from({ length: nv }, (_, i) => skin.pos[i * 3 + 2]));
let nase = null; // vorderster Punkt des Gesichts
for (let i = 0; i < nv; i++) { const p = P(i); if (p[2] > 1450 && Math.abs(p[0]) < 40 && (!nase || p[1] < nase[1])) nase = p; }
// Schienbein-Vorderkante kurz über dem Sprunggelenk (Fußwurzel bei z ≈ 60–90 mm)
const zSprung = zMin + 95;
const k = (SPRUNG_X - NASE_X) / (nase[2] - zSprung);
// Vorderkante je Höhe (nur Rumpf und Beine, ohne Arme): kleinste y in Scheiben von 10 mm, geglättet; Kopf und Füße halten den Wert am Hals bzw. Sprunggelenk
const SL = 10, nS = Math.ceil((nase[2] + 200 - zMin) / SL), front = new Float32Array(nS).fill(1e9);
for (let i = 0; i < nv; i++) { if (W[i * 3] < 0.9) continue; const p = P(i), s = Math.floor((p[2] - zMin) / SL); if (s >= 0 && s < nS) front[s] = Math.min(front[s], p[1]); }
const zHals = 1420, sH = Math.floor((zHals - zMin) / SL), sF = Math.floor((zSprung - zMin) / SL);
for (let s = 0; s < nS; s++) if (front[s] > 1e8) front[s] = front[s - 1] ?? 0;
for (let s = sH; s < nS; s++) front[s] = front[sH];
for (let s = 0; s < sF; s++) front[s] = front[sF];
const fs = new Float32Array(nS); // gleitender Mittelwert ±60 mm
for (let s = 0; s < nS; s++) { let a = 0, n = 0; for (let d = -6; d <= 6; d++) { const q = Math.min(nS - 1, Math.max(0, s + d)); a += front[q]; n++; } fs[s] = a / n; }
const frontAt = (z) => { const f = (z - zMin) / SL - 0.5, a = Math.max(0, Math.min(nS - 1, Math.floor(f))), b = Math.min(nS - 1, a + 1), t = Math.max(0, Math.min(1, f - a)); return fs[a] + (fs[b] - fs[a]) * t; };
const toLiege = (p, zRef = p[2]) => [-(p[2] - nase[2]) * k + NASE_X, (p[1] - frontAt(zRef)) * k + 0.004, p[0] * k];
// Arme: Bezugshöhe für das Aufliegen = Schulter (sonst würde jede Armscheibe einzeln „aufgesetzt“)
const base = new Float32Array(nv * 3);
for (let i = 0; i < nv; i++) {
  const p = P(i), wa = 1 - W[i * 3], zr = p[2] * (1 - wa) + wa * J[side[i] === 1 ? 'l' : 'r'].S[2];
  base.set(toLiege(p, wa > 0.01 ? zr : p[2]), i * 3);
}
// ---------- Arm-Haltung: Schulter beugen (Ellbogen über die Armstütze), Ellbogen beugen (Unterarm kopfwärts), Handfläche nach unten ----------
const pose = {};
for (const s of Object.keys(SIDES)) {
  const sg = s === 'l' ? 1 : -1; // links = +z
  const S = toLiege(J[s].S, J[s].S[2]), E = toLiege(J[s].E, J[s].S[2]), Wr = toLiege(J[s].W, J[s].S[2]);
  const L1 = V3.len(V3.sub(E, S));
  // Ellbogen: fußwärts dx, über der Stütze (z), so tief, wie die Oberarm-Länge reicht
  const dz = ELLBOGEN.z - Math.abs(S[2]), dy = -Math.sqrt(Math.max(0.01, L1 * L1 - ELLBOGEN.dx ** 2 - dz * dz));
  const Et = [S[0] + ELLBOGEN.dx, S[1] + dy, sg * ELLBOGEN.z];
  const R1 = rig(rotTo(V3.sub(E, S), V3.sub(Et, S)), S);
  const E1 = doRig(R1, E), W1 = doRig(R1, Wr);
  const f1 = V3.nrm([UNTERARM[0], UNTERARM[1], sg * UNTERARM[2]]);
  let R2 = rig(rotTo(V3.sub(W1, E1), f1), E1);
  // Handfläche: in der Ausgangslage vorn (Liege: unten, −y) → nach beiden Drehungen um die Unterarm-Achse nach unten drehen
  const palm = app(R2.M, app(R1.M, [0, -1, 0]));
  const pp = V3.nrm(V3.sub(palm, V3.sc(f1, V3.dot(palm, f1)))), want = V3.nrm(V3.sub([0, -1, 0], V3.sc(f1, V3.dot([0, -1, 0], f1))));
  const tw = Math.atan2(V3.dot(V3.cross(pp, want), f1), V3.dot(pp, want));
  const R3 = rig(rotAxis(f1, tw), E1);
  const T1 = R1, T2 = then(then(R1, R2), R3);
  pose[s] = { S, E1, W2: doRig(T2, Wr), T1, T2, L1, tw };
  console.log(`Arm ${s}: Schulter ${S.map((v) => v.toFixed(3))}  Ellbogen ${E1.map((v) => v.toFixed(3))}  Handgelenk ${doRig(T2, Wr).map((v) => v.toFixed(3))}  Oberarm ${L1.toFixed(3)}  Drehung Unterarm ${(tw * 57.3).toFixed(0)}°`);
}
const out = new Float32Array(nv * 3);
for (let i = 0; i < nv; i++) {
  const p = [base[i * 3], base[i * 3 + 1], base[i * 3 + 2]], w0 = W[i * 3], w1 = W[i * 3 + 1], w2 = W[i * 3 + 2];
  if (w0 > 0.999) { out.set(p, i * 3); continue; }
  const A = pose[side[i] === 1 ? 'l' : 'r'], a = doRig(A.T1, p), b = doRig(A.T2, p), t = w0 + w1 + w2;
  out.set([0, 1, 2].map((c) => (p[c] * w0 + a[c] * w1 + b[c] * w2) / t), i * 3);
}
// ---------- Teile: Rumpf / Arme (Dreieck gehört zum Arm, wenn seine Ecken überwiegend Arm sind) ----------
const tri = { koerper: [], 'arm-l': [], 'arm-r': [] };
for (let t = 0; t < skin.idx.length; t += 3) {
  const I = [skin.idx[t], skin.idx[t + 1], skin.idx[t + 2]], wa = I.reduce((a, i) => a + 1 - W[i * 3], 0) / 3;
  // Intimbereich entfällt (liegt unten auf dem Polster, für eine Praxisseite ohne Belang): Dreiecke zwischen den Oberschenkeln unten
  const g = [0, 1, 2].map((c) => (out[I[0] * 3 + c] + out[I[1] * 3 + c] + out[I[2] * 3 + c]) / 3);
  if (wa < 0.5 && g[0] > INTIM.x[0] && g[0] < INTIM.x[1] && Math.abs(g[2]) < INTIM.z && g[1] < INTIM.y) continue;
  if (wa < 0.5) tri.koerper.push(...I); else tri[side[I[0]] === 1 ? 'arm-l' : 'arm-r'].push(...I);
}
// Wirbelkörper (Schwerpunkt je Wirbel) für die durchschimmernde Wirbelsäule
const ORDER = ['atlas', 'axis', ...['third', 'fourth', 'fifth', 'sixth', 'seventh'].map((n) => `${n} cervical vertebra`), ...ribs.map((n) => `${n} thoracic vertebra`), ...['first', 'second', 'third', 'fourth', 'fifth'].map((n) => `${n} lumbar vertebra`), 'sacrum'];
const wirbel = [];
for (const n of ORDER) { const pos = bone([n]); const c = [0, 0, 0]; for (let i = 0; i < pos.length; i++) c[i % 3] += pos[i] / (pos.length / 3); wirbel.push(...toLiege(c)); }

// ---------- schreiben (wie tools/anatomie-motive.mjs) ----------
const head = { quelle: QUELLE, bearbeitung: 'Haut vereinfacht, in Bauchlage auf die Liege gelegt, Arme gebeugt; Koordinaten im Raum der Liege', einheit: 'Liege', k, parts: [] };
const chunks = []; let off = 0;
const put = (id, kind, pos, idx) => {
  const nvv = pos.length / 3, lo = [1e9, 1e9, 1e9], hi = [-1e9, -1e9, -1e9];
  for (let i = 0; i < pos.length; i++) { lo[i % 3] = Math.min(lo[i % 3], pos[i]); hi[i % 3] = Math.max(hi[i % 3], pos[i]); }
  const q = new Uint16Array(pos.length);
  for (let i = 0; i < pos.length; i++) q[i] = Math.round((pos[i] - lo[i % 3]) / Math.max(1e-6, hi[i % 3] - lo[i % 3]) * 65535);
  const pb = new Uint8Array(nvv * 6);
  for (let i = 0; i < nvv; i++) for (let c = 0; c < 3; c++) { const d = (q[i * 3 + c] - (i ? q[i * 3 - 3 + c] : 0)) & 0xFFFF; pb[c * 2 * nvv + i] = d & 255; pb[(c * 2 + 1) * nvv + i] = d >> 8; }
  const ib = []; let hw = 0;
  for (const i of idx) { let d = hw - i; if (d === 0) hw++; while (d > 127) { ib.push((d & 127) | 128); d >>= 7; } ib.push(d); }
  const ibuf = Uint8Array.from(ib);
  head.parts.push({ id, kind, nv: nvv, nt: idx.length / 3, lo: lo.map((v) => +v.toFixed(5)), hi: hi.map((v) => +v.toFixed(5)), p: off, i: off + pb.length, il: ibuf.length });
  chunks.push(pb, ibuf); off += pb.length + ibuf.length;
  console.log(`${id.padEnd(14)} ${String(nvv).padStart(6)} Ecken ${String(idx.length / 3).padStart(6)} Dreiecke  x ${lo[0].toFixed(2)}…${hi[0].toFixed(2)}  y ${lo[1].toFixed(2)}…${hi[1].toFixed(2)}  z ${lo[2].toFixed(2)}…${hi[2].toFixed(2)}`);
};
for (const [id, I] of Object.entries(tri)) { const m = reorder({ pos: Array.from(out), idx: I }); put('figur/' + id, 'skin', m.pos, m.idx); }
put('figur/wirbel', 'points', wirbel, []);
const hj = Buffer.from(JSON.stringify(head), 'utf8'), len = Buffer.alloc(4); len.writeUInt32LE(hj.length);
const raw = Buffer.concat([len, hj, ...chunks.map((c) => Buffer.from(c.buffer, c.byteOffset, c.byteLength))]);
const gz = gzipSync(raw, { level: 9 });
writeFileSync(OUT, gz);
console.log(`Maßstab ${k.toFixed(5)} Liege/mm · ${(raw.length / 1024).toFixed(0)} KB roh, ${(gz.length / 1024).toFixed(0)} KB gepackt: ${OUT}`);
