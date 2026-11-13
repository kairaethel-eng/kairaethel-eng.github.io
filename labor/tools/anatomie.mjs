// Anatomie-Daten aufbereiten (Qualitätsprobe 13.11.2026): BodyParts3D → kompaktes Netz für die Richtung „Glas“.
// Quelle: BodyParts3D, © The Database Center for Life Science, licensed under CC Attribution 4.0 International
//         (Lizenzseite https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html, Stand 27.02.2025; Namensnennung ist Pflicht).
// Die Rohdaten liegen NICHT im Repo. Zwei Ausgaben derselben Quelle:
//   grob (Ausgabe 4.0, Netze um 99 % ausgedünnt, ~3 500 Dreiecke je Lendenwirbel; Lizenz sicher CC BY 4.0):
//     https://dbarchive.biosciencedbc.jp/data/bodyparts3d/LATEST/partof_BP3D_4.0_obj_99.zip (62 MB) + partof_element_parts.txt
//     node tools/anatomie.mjs <obj-Ordner> partof_element_parts.txt                      → wirbelsaeule.bin
//   fein (Ausgabe 3.0, um 95 % ausgedünnt, ~15 000 Dreiecke je Lendenwirbel; ⚠ das README dieser Ausgabe nennt noch
//     CC BY-SA 2.1 Japan – vor einer Veröffentlichung klären, siehe ENTSCHEIDUNGEN.md):
//     https://dbarchive.biosciencedbc.jp/data/bodyparts3d/20110915/BodyParts3D_3.0_obj_95.zip (522 MB; Dateien heißen <FMA-Nummer>.obj)
//     + parts_list_e.txt (zwei Spalten: FMA-Nummer, Name)
//     OUT=wirbelsaeule-fein.bin QUELLE='… 3.0 …' node tools/anatomie.mjs <obj-Ordner> parts_list_e.txt
// SUB=1 verfeinert die Netze einmal (Loop) – ausprobiert und verworfen: rundet nur, bringt keine Einzelheiten.
// Ergebnis: src/kopf-bis-fuss/anatomie/<OUT> (gzip; Kopf als JSON, Punkte 16 Bit, Dreiecke als Differenzen).
// Koordinaten: BodyParts3D = mm, x links, y hinten, z oben → Seite = cm, x links, y Höhe über dem Boden, z vorn (wie bones.js).
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const [objDir, listFile] = process.argv.slice(2);
if (!objDir || !listFile) { console.error('Aufruf: node tools/anatomie.mjs <obj-Ordner> <partof_element_parts.txt>'); process.exit(1); }
const SUB = +(process.env.SUB || 0), OUT = process.env.OUT || 'wirbelsaeule.bin';
const QUELLE = process.env.QUELLE || 'BodyParts3D 4.0, © The Database Center for Life Science licensed under CC Attribution 4.0 International';

const ORD = ['first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'ninth', 'tenth', 'eleventh', 'twelfth'];
// Teile der Wirbelsäule von oben nach unten: [Kennung, Art, Name in BodyParts3D (bei mehreren gilt der erste vorhandene)]
const PARTS = [['C1', 'bone', 'atlas'], ['C2', 'bone', 'axis'], ['dC2', 'disc', 'intervertebral disk of axis']];
for (let i = 3; i <= 7; i++) PARTS.push([`C${i}`, 'bone', `${ORD[i - 1]} cervical vertebra`], [`dC${i}`, 'disc', `intervertebral disk of ${ORD[i - 1]} cervical vertebra`]);
// Die Bandscheibe Th12/L1 steht in BodyParts3D 4.0 ohne eigenen Namen als einziges Teil unter „intervertebral disk“ (FJ3211)
const D12 = ['intervertebral disk of twelfth thoracic vertebra', 'intervertebral disk'];
for (let i = 1; i <= 12; i++) PARTS.push([`Th${i}`, 'bone', `${ORD[i - 1]} thoracic vertebra`], [`dTh${i}`, 'disc', i < 12 ? `intervertebral disk of ${ORD[i - 1]} thoracic vertebra` : D12]);
for (let i = 1; i <= 5; i++) PARTS.push([`L${i}`, 'bone', `${ORD[i - 1]} lumbar vertebra`], [`dL${i}`, 'disc', `intervertebral disk of ${ORD[i - 1]} lumbar vertebra`]);
PARTS.push(['S', 'bone', 'sacrum']);

const elements = new Map();
for (const l of readFileSync(listFile, 'utf8').split('\n').slice(1)) {
  const [id, name, el] = l.trim().split('\t'); if (!name) continue;                 // drei Spalten (4.0: Teil-Dateien) oder zwei (3.0: Datei = Nummer)
  if (!elements.has(name)) elements.set(name, []);
  elements.get(name).push(el || id);
}

// OBJ lesen, Punkte verschweißen (gleiche Lage = ein Punkt), entartete Dreiecke weg
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
// Loop-Verfeinerung: jedes Dreieck → vier, Punkte nach Loop geglättet (rundet die Silhouette; Ränder bleiben Ränder)
function loop({ pos, idx }) {
  const nv = pos.length / 3, eKey = (a, b) => (a < b ? a * nv + b : b * nv + a);
  const edges = new Map(), nb = Array.from({ length: nv }, () => new Set());
  for (let t = 0; t < idx.length; t += 3) for (let k = 0; k < 3; k++) {
    const a = idx[t + k], b = idx[t + (k + 1) % 3], c = idx[t + (k + 2) % 3], e = eKey(a, b);
    if (!edges.has(e)) edges.set(e, { a, b, opp: [], id: -1 });
    edges.get(e).opp.push(c); nb[a].add(b); nb[b].add(a);
  }
  const border = new Uint8Array(nv);
  for (const e of edges.values()) if (e.opp.length !== 2) { border[e.a] = border[e.b] = 1; }
  const out = new Array(nv * 3);
  for (let i = 0; i < nv; i++) {
    const n = nb[i].size;
    if (border[i] || n < 3) { out[i * 3] = pos[i * 3]; out[i * 3 + 1] = pos[i * 3 + 1]; out[i * 3 + 2] = pos[i * 3 + 2]; continue; }
    const beta = n === 3 ? 3 / 16 : 3 / (8 * n);
    for (let c = 0; c < 3; c++) { let s = 0; for (const j of nb[i]) s += pos[j * 3 + c]; out[i * 3 + c] = pos[i * 3 + c] * (1 - n * beta) + s * beta; }
  }
  for (const e of edges.values()) {
    e.id = out.length / 3;
    for (let c = 0; c < 3; c++) out.push(e.opp.length === 2
      ? 0.375 * (pos[e.a * 3 + c] + pos[e.b * 3 + c]) + 0.125 * (pos[e.opp[0] * 3 + c] + pos[e.opp[1] * 3 + c])
      : 0.5 * (pos[e.a * 3 + c] + pos[e.b * 3 + c]));
  }
  const ni = [];
  for (let t = 0; t < idx.length; t += 3) {
    const [a, b, c] = [idx[t], idx[t + 1], idx[t + 2]];
    const ab = edges.get(eKey(a, b)).id, bc = edges.get(eKey(b, c)).id, ca = edges.get(eKey(c, a)).id;
    ni.push(a, ab, ca, b, bc, ab, c, ca, bc, ab, bc, ca);
  }
  return { pos: out, idx: ni };
}
// Prüfwerte: offene Kanten, Rauminhalt (Vorzeichen = Flächen zeigen nach außen)
function check({ pos, idx }) {
  const nv = pos.length / 3, e = new Map(); let vol = 0;
  for (let t = 0; t < idx.length; t += 3) {
    const [a, b, c] = [idx[t] * 3, idx[t + 1] * 3, idx[t + 2] * 3];
    vol += (pos[a] * (pos[b + 1] * pos[c + 2] - pos[b + 2] * pos[c + 1]) - pos[a + 1] * (pos[b] * pos[c + 2] - pos[b + 2] * pos[c]) + pos[a + 2] * (pos[b] * pos[c + 1] - pos[b + 1] * pos[c])) / 6;
    for (let k = 0; k < 3; k++) { const p = idx[t + k], q = idx[t + (k + 1) % 3], key = p < q ? p * nv + q : q * nv + p; e.set(key, (e.get(key) || 0) + 1); }
  }
  let open = 0, multi = 0; for (const n of e.values()) { if (n === 1) open++; else if (n > 2) multi++; }
  return { open, multi, vol };
}
// Punkte in der Reihenfolge ihrer ersten Benutzung (kleine Differenzen → gut zu packen), unbenutzte fallen weg
function reorder({ pos, idx }) {
  const map = new Int32Array(pos.length / 3).fill(-1), np = [], ni = new Array(idx.length);
  for (let i = 0; i < idx.length; i++) { let m = map[idx[i]]; if (m < 0) { m = map[idx[i]] = np.length / 3; np.push(pos[idx[i] * 3], pos[idx[i] * 3 + 1], pos[idx[i] * 3 + 2]); } ni[i] = m; }
  return { pos: np, idx: ni };
}

const head = { quelle: QUELLE, einheit: 'cm', parts: [] };
const chunks = []; let nV = 0, nT = 0, off = 0;
for (const [id, kind, names] of PARTS) {
  const name = [].concat(names).find((n) => elements.has(n)) || [].concat(names)[0];
  const els = elements.get(name);
  if (!els) { console.warn(`⚠ nicht in der Liste: ${name}`); continue; }
  const files = els.map((e) => join(objDir, `${e}.obj`)).filter((f) => existsSync(f));
  if (!files.length) { console.warn(`⚠ Datei fehlt: ${name}`); continue; }
  let m = load(files);
  for (let s = 0; s < SUB; s++) m = loop(m);
  m = reorder(m);
  const c = check(m), nv = m.pos.length / 3, nt = m.idx.length / 3;
  const lo = [1e9, 1e9, 1e9], hi = [-1e9, -1e9, -1e9];
  for (let i = 0; i < m.pos.length; i++) { lo[i % 3] = Math.min(lo[i % 3], m.pos[i]); hi[i % 3] = Math.max(hi[i % 3], m.pos[i]); }
  // Punkte: 16 Bit je Achse im Rahmen des Teils, als Differenz zum Vorgänger, niedrige und hohe Bytes getrennt
  const q = new Uint16Array(m.pos.length);
  for (let i = 0; i < m.pos.length; i++) q[i] = Math.round((m.pos[i] - lo[i % 3]) / Math.max(1e-6, hi[i % 3] - lo[i % 3]) * 65535);
  const pb = new Uint8Array(nv * 6);
  for (let i = 0; i < nv; i++) for (let k = 0; k < 3; k++) { const d = (q[i * 3 + k] - (i ? q[i * 3 - 3 + k] : 0)) & 0xFFFF; pb[k * 2 * nv + i] = d & 255; pb[(k * 2 + 1) * nv + i] = d >> 8; }
  // Dreiecke: Abstand zum höchsten bisher benutzten Punkt (0 = neuer Punkt), als Varint
  const ib = []; let hw = 0;
  for (const i of m.idx) { let d = hw - i; if (d === 0) hw++; while (d > 127) { ib.push((d & 127) | 128); d >>= 7; } ib.push(d); }
  const ibuf = Uint8Array.from(ib);
  head.parts.push({ id, kind, nv, nt, lo: lo.map((v) => +v.toFixed(4)), hi: hi.map((v) => +v.toFixed(4)), p: off, i: off + pb.length, il: ibuf.length });
  chunks.push(pb, ibuf); off += pb.length + ibuf.length; nV += nv; nT += nt;
  console.log(`${id.padEnd(5)} ${String(nv).padStart(6)} Punkte ${String(nt).padStart(6)} Dreiecke  offen ${c.open}  mehrfach ${c.multi}  Inhalt ${c.vol.toFixed(1)} cm³  Höhe ${lo[1].toFixed(1)}–${hi[1].toFixed(1)}`);
}
const hj = Buffer.from(JSON.stringify(head), 'utf8'), len = Buffer.alloc(4); len.writeUInt32LE(hj.length);
const raw = Buffer.concat([len, hj, ...chunks.map((c) => Buffer.from(c.buffer, c.byteOffset, c.byteLength))]);
const gz = gzipSync(raw, { level: 9 });
const out = join(root, 'src/kopf-bis-fuss/anatomie', OUT);
mkdirSync(dirname(out), { recursive: true }); writeFileSync(out, gz);
console.log(`${PARTS.length} Teile, ${nV} Punkte, ${nT} Dreiecke → ${(raw.length / 1024).toFixed(0)} KB roh, ${(gz.length / 1024).toFixed(0)} KB gepackt: ${out}`);
