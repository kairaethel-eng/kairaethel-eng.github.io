// Echte Knochen für die Leistungs-Motive (20.11.2026, Kai im Arbeitsblatt: „Alle anatomischen Animationen bitte deutlich realer …
// die reale Anatomie ziemlich perfekt“): Schädel + Unterkiefer (CMD), Atlas/Axis, Knie und Bein, Hand – aus BodyParts3D.
// Quelle: BodyParts3D, © The Database Center for Life Science licensed under CC Attribution 4.0 International
//   (Lizenzseite https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html; nur Ausgabe 4.0 – siehe tools/wirbel-echt.mjs).
//   Verändert: Teile ausgewählt, Netze vereinfacht, Koordinaten umgerechnet und quantisiert.
// Rohdaten liegen NICHT im Repo (62 MB): partof_BP3D_4.0_obj_99.zip + partof_element_parts.txt von
//   https://dbarchive.biosciencedbc.jp/data/bodyparts3d/LATEST/
// Aufruf:  node tools/anatomie-motive.mjs <obj-Ordner> <partof_element_parts.txt>      → assets/motive-anatomie.bin
// Format wie assets/wirbelsaeule-echt.bin (Leser: decode() in src/wirbel-echt/anatomie.js). Teil-Kennung = "gruppe/name".
// Koordinaten: BodyParts3D = mm, x links, y hinten, z oben → Datei = cm, x links, y oben, z vorn.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { MeshoptSimplifier } from 'three/examples/jsm/libs/meshopt_simplifier.module.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const [objDir, listFile] = process.argv.slice(2);
if (!objDir || !listFile) { console.error('Aufruf: node tools/anatomie-motive.mjs <obj-Ordner> <partof_element_parts.txt>'); process.exit(1); }
const OUT = join(root, 'assets', 'motive-anatomie.bin');
const QUELLE = 'BodyParts3D, © The Database Center for Life Science licensed under CC Attribution 4.0 International';
// [Kennung, Name(n) in BodyParts3D, Ziel-Dreiecke]
const LR = (n) => [`left ${n}`, `right ${n}`];
const PARTS = [
  ['kopf/unterkiefer', ['mandible'], 3600],
  ['kopf/schaedel', ['frontal bone', ...LR('parietal bone'), ...LR('temporal bone'), 'occipital bone', 'sphenoid bone', ...LR('maxilla'), ...LR('zygomatic bone'), ...LR('nasal bone')], 11000],
  ['hals/atlas', ['atlas'], 3000], ['hals/axis', ['axis'], 3000], ['hals/c3', ['third cervical vertebra'], 1600],
  ['bein/femur', ['left femur'], 3600], ['bein/tibia', ['left tibia'], 3000], ['bein/fibula', ['left fibula'], 1200], ['bein/patella', ['left patella'], 700],
  ['bein/fuss', ['left foot', 'left talus', 'left calcaneus', 'navicular bone of left foot', 'left cuboid bone', 'left medial cuneiform bone', 'left intermediate cuneiform bone', 'left lateral cuneiform bone'], 5200],
  ['hand/hand', ['left hand', 'left scaphoid', 'left lunate', 'left triquetral', 'left pisiform', 'left trapezium', 'left trapezoid', 'left capitate', 'left hamate'], 6400],
  ['hand/speiche', ['left radius'], 1500], ['hand/elle', ['left ulna'], 1500],
];
const elements = new Map();
for (const l of readFileSync(listFile, 'utf8').split('\n').slice(1)) { const [, name, el] = l.trim().split('\t'); if (!name || !el) continue; if (!elements.has(name)) elements.set(name, new Set()); elements.get(name).add(el); }

// OBJ lesen, Punkte verschweißen, entartete Dreiecke weg
function load(files) {
  const pos = [], idx = [], key = new Map();
  for (const f of files) {
    const v = [];
    for (const l of readFileSync(f, 'utf8').split('\n')) {
      if (l.startsWith('v ')) {
        const [x, y, z] = l.split(/\s+/).slice(1, 4).map(Number);
        const p = [x * 0.1, z * 0.1, -y * 0.1], k = p.map((c) => Math.round(c * 1e4)).join(',');
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
await MeshoptSimplifier.ready;
const head = { quelle: QUELLE, bearbeitung: 'Teile ausgewählt, vereinfacht, Koordinaten in cm', einheit: 'cm', parts: [] };
const chunks = []; let nT = 0, off = 0;
for (const [id, names, target] of PARTS) {
  const els = new Set(); const miss = [];
  for (const n of names) { const e = elements.get(n); if (e) e.forEach((x) => els.add(x)); else miss.push(n); }
  if (miss.length) console.warn(`⚠ ${id}: nicht in der Liste: ${miss.join(', ')}`);
  const files = [...els].map((e) => join(objDir, `${e}.obj`)).filter((f) => existsSync(f));
  if (!files.length) { console.warn(`⚠ ${id}: keine Dateien`); continue; }
  let m = load(files);
  const t0 = m.idx.length / 3;
  const [si] = MeshoptSimplifier.simplify(new Uint32Array(m.idx), new Float32Array(m.pos), 3, Math.min(t0, target) * 3, 0.02, []);
  m = reorder({ pos: m.pos, idx: Array.from(si) });
  const nv = m.pos.length / 3, nt = m.idx.length / 3;
  const lo = [1e9, 1e9, 1e9], hi = [-1e9, -1e9, -1e9];
  for (let i = 0; i < m.pos.length; i++) { lo[i % 3] = Math.min(lo[i % 3], m.pos[i]); hi[i % 3] = Math.max(hi[i % 3], m.pos[i]); }
  const q = new Uint16Array(m.pos.length);
  for (let i = 0; i < m.pos.length; i++) q[i] = Math.round((m.pos[i] - lo[i % 3]) / Math.max(1e-6, hi[i % 3] - lo[i % 3]) * 65535);
  const pb = new Uint8Array(nv * 6);
  for (let i = 0; i < nv; i++) for (let k = 0; k < 3; k++) { const d = (q[i * 3 + k] - (i ? q[i * 3 - 3 + k] : 0)) & 0xFFFF; pb[k * 2 * nv + i] = d & 255; pb[(k * 2 + 1) * nv + i] = d >> 8; }
  const ib = []; let hw = 0;
  for (const i of m.idx) { let d = hw - i; if (d === 0) hw++; while (d > 127) { ib.push((d & 127) | 128); d >>= 7; } ib.push(d); }
  const ibuf = Uint8Array.from(ib);
  head.parts.push({ id, kind: 'bone', nv, nt, lo: lo.map((v) => +v.toFixed(4)), hi: hi.map((v) => +v.toFixed(4)), p: off, i: off + pb.length, il: ibuf.length });
  chunks.push(pb, ibuf); off += pb.length + ibuf.length; nT += nt;
  console.log(`${id.padEnd(18)} ${files.length} Dateien ${String(t0).padStart(6)} → ${String(nt).padStart(5)} Dreiecke  x ${lo[0].toFixed(1)}…${hi[0].toFixed(1)}  y ${lo[1].toFixed(1)}…${hi[1].toFixed(1)}  z ${lo[2].toFixed(1)}…${hi[2].toFixed(1)}`);
}
const hj = Buffer.from(JSON.stringify(head), 'utf8'), len = Buffer.alloc(4); len.writeUInt32LE(hj.length);
const raw = Buffer.concat([len, hj, ...chunks.map((c) => Buffer.from(c.buffer, c.byteOffset, c.byteLength))]);
const gz = gzipSync(raw, { level: 9 });
writeFileSync(OUT, gz);
console.log(`${head.parts.length} Teile, ${nT} Dreiecke → ${(raw.length / 1024).toFixed(0)} KB roh, ${(gz.length / 1024).toFixed(0)} KB gepackt: ${OUT}`);
