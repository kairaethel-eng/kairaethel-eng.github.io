// Auftrag W (14.11.2026): echte Wirbelsäule für den Partikel-Stil – BodyParts3D → kleines, vereinfachtes Netz.
// Quelle: BodyParts3D, © The Database Center for Life Science licensed under CC Attribution 4.0 International
//   (Lizenzseite https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html, „Last updated: 2025/02/27“, am 14.11.2026 gelesen).
//   Verändert: Teile ausgewählt, Netze vereinfacht, Koordinaten umgerechnet und quantisiert (CC BY 4.0 verlangt diesen Hinweis).
// Nur Ausgabe 4.0 (Lizenz sicher CC BY 4.0) – nie die feinen Daten der Ausgabe 3.0 (Lizenz ungeklärt, siehe ENTSCHEIDUNGEN.md).
// Rohdaten liegen NICHT im Repo:
//   https://dbarchive.biosciencedbc.jp/data/bodyparts3d/LATEST/partof_BP3D_4.0_obj_99.zip (62 MB, entpacken)
//   https://dbarchive.biosciencedbc.jp/data/bodyparts3d/LATEST/partof_element_parts.txt
// Aufruf:  node tools/wirbel-echt.mjs <obj-Ordner> <partof_element_parts.txt>      → assets/wirbelsaeule-echt.bin
//   KEEP=0.42 (Anteil der Dreiecke, der bleibt)  ERR=0.012 (erlaubte Abweichung relativ zur Teilgröße)
// Format wie tools/anatomie.mjs (Zweig claude/awesome-babbage-2j9ij4): gzip; Kopf JSON (Länge 4 Byte), je Teil Punkte 16 Bit
// als Differenzen (Bytes nach Achse getrennt) + Dreiecke als Varint-Abstand zum höchsten benutzten Punkt. Leser: src/wirbel-echt/echt.js.
// Koordinaten: BodyParts3D = mm, x links, y hinten, z oben → Datei = cm, x links, y oben, z vorn.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { MeshoptSimplifier } from 'three/examples/jsm/libs/meshopt_simplifier.module.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const [objDir, listFile] = process.argv.slice(2);
if (!objDir || !listFile) { console.error('Aufruf: node tools/wirbel-echt.mjs <obj-Ordner> <partof_element_parts.txt>'); process.exit(1); }
const KEEP = +(process.env.KEEP || 0.42), ERR = +(process.env.ERR || 0.012);
const OUT = join(root, 'assets', process.env.OUT || 'wirbelsaeule-echt.bin');
const QUELLE = 'BodyParts3D, © The Database Center for Life Science licensed under CC Attribution 4.0 International';

const ORD = ['first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'ninth', 'tenth', 'eleventh', 'twelfth'];
// Teile von oben nach unten: [Kennung, Art, Name in BodyParts3D (bei mehreren gilt der erste vorhandene)]; dX = Bandscheibe unter X
const PARTS = [['C1', 'bone', 'atlas'], ['C2', 'bone', 'axis'], ['dC2', 'disc', 'intervertebral disk of axis']];
for (let i = 3; i <= 7; i++) PARTS.push([`C${i}`, 'bone', `${ORD[i - 1]} cervical vertebra`], [`dC${i}`, 'disc', `intervertebral disk of ${ORD[i - 1]} cervical vertebra`]);
// Th12/L1 steht in 4.0 ohne eigenen Namen als einziges Teil unter „intervertebral disk“
const D12 = ['intervertebral disk of twelfth thoracic vertebra', 'intervertebral disk'];
for (let i = 1; i <= 12; i++) PARTS.push([`Th${i}`, 'bone', `${ORD[i - 1]} thoracic vertebra`], [`dTh${i}`, 'disc', i < 12 ? `intervertebral disk of ${ORD[i - 1]} thoracic vertebra` : D12]);
for (let i = 1; i <= 5; i++) PARTS.push([`L${i}`, 'bone', `${ORD[i - 1]} lumbar vertebra`], [`dL${i}`, 'disc', `intervertebral disk of ${ORD[i - 1]} lumbar vertebra`]);
PARTS.push(['S', 'bone', 'sacrum']); // in 4.0 schließt das Kreuzbein das Steißbein ein (kein eigenes Teil „coccyx“)

const elements = new Map();
for (const l of readFileSync(listFile, 'utf8').split('\n').slice(1)) {
  const [, name, el] = l.trim().split('\t'); if (!name || !el) continue;
  if (!elements.has(name)) elements.set(name, []);
  elements.get(name).push(el);
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
// Punkte in der Reihenfolge ihrer ersten Benutzung (kleine Differenzen → gut zu packen), unbenutzte fallen weg
function reorder({ pos, idx }) {
  const map = new Int32Array(pos.length / 3).fill(-1), np = [], ni = new Array(idx.length);
  for (let i = 0; i < idx.length; i++) { let m = map[idx[i]]; if (m < 0) { m = map[idx[i]] = np.length / 3; np.push(pos[idx[i] * 3], pos[idx[i] * 3 + 1], pos[idx[i] * 3 + 2]); } ni[i] = m; }
  return { pos: np, idx: ni };
}
// Rauminhalt (Vorzeichen > 0 = Flächen zeigen nach außen) und offene Kanten – Prüfwerte
function check({ pos, idx }) {
  const nv = pos.length / 3, e = new Map(); let vol = 0;
  for (let t = 0; t < idx.length; t += 3) {
    const [a, b, c] = [idx[t] * 3, idx[t + 1] * 3, idx[t + 2] * 3];
    vol += (pos[a] * (pos[b + 1] * pos[c + 2] - pos[b + 2] * pos[c + 1]) - pos[a + 1] * (pos[b] * pos[c + 2] - pos[b + 2] * pos[c]) + pos[a + 2] * (pos[b] * pos[c + 1] - pos[b + 1] * pos[c])) / 6;
    for (let k = 0; k < 3; k++) { const p = idx[t + k], q = idx[t + (k + 1) % 3], key = p < q ? p * nv + q : q * nv + p; e.set(key, (e.get(key) || 0) + 1); }
  }
  let open = 0; for (const n of e.values()) if (n === 1) open++;
  return { open, vol };
}

await MeshoptSimplifier.ready;
const head = { quelle: QUELLE, bearbeitung: `Teile ausgewählt, vereinfacht (${Math.round(KEEP * 100)} % der Dreiecke), Koordinaten in cm`, einheit: 'cm', parts: [] };
const chunks = []; let nV = 0, nT = 0, nT0 = 0, off = 0;
for (const [id, kind, names] of PARTS) {
  const name = [].concat(names).find((n) => elements.has(n)) || [].concat(names)[0];
  const els = elements.get(name);
  if (!els) { console.warn(`⚠ nicht in der Liste: ${name}`); continue; }
  const files = els.map((e) => join(objDir, `${e}.obj`)).filter((f) => existsSync(f));
  if (!files.length) { console.warn(`⚠ Datei fehlt: ${name}`); continue; }
  let m = load(files);
  const t0 = m.idx.length / 3; nT0 += t0;
  const [si] = MeshoptSimplifier.simplify(new Uint32Array(m.idx), new Float32Array(m.pos), 3, Math.round(m.idx.length * KEEP / 3) * 3, ERR, []);
  m = reorder({ pos: m.pos, idx: Array.from(si) });
  const c = check(m), nv = m.pos.length / 3, nt = m.idx.length / 3;
  const lo = [1e9, 1e9, 1e9], hi = [-1e9, -1e9, -1e9];
  for (let i = 0; i < m.pos.length; i++) { lo[i % 3] = Math.min(lo[i % 3], m.pos[i]); hi[i % 3] = Math.max(hi[i % 3], m.pos[i]); }
  const q = new Uint16Array(m.pos.length);
  for (let i = 0; i < m.pos.length; i++) q[i] = Math.round((m.pos[i] - lo[i % 3]) / Math.max(1e-6, hi[i % 3] - lo[i % 3]) * 65535);
  const pb = new Uint8Array(nv * 6);
  for (let i = 0; i < nv; i++) for (let k = 0; k < 3; k++) { const d = (q[i * 3 + k] - (i ? q[i * 3 - 3 + k] : 0)) & 0xFFFF; pb[k * 2 * nv + i] = d & 255; pb[(k * 2 + 1) * nv + i] = d >> 8; }
  const ib = []; let hw = 0;
  for (const i of m.idx) { let d = hw - i; if (d === 0) hw++; while (d > 127) { ib.push((d & 127) | 128); d >>= 7; } ib.push(d); }
  const ibuf = Uint8Array.from(ib);
  head.parts.push({ id, kind, nv, nt, lo: lo.map((v) => +v.toFixed(4)), hi: hi.map((v) => +v.toFixed(4)), p: off, i: off + pb.length, il: ibuf.length });
  chunks.push(pb, ibuf); off += pb.length + ibuf.length; nV += nv; nT += nt;
  console.log(`${id.padEnd(5)} ${String(t0).padStart(6)} → ${String(nt).padStart(5)} Dreiecke  offen ${c.open}  Inhalt ${c.vol.toFixed(1)} cm³  Höhe ${lo[1].toFixed(1)}–${hi[1].toFixed(1)}`);
}
const hj = Buffer.from(JSON.stringify(head), 'utf8'), len = Buffer.alloc(4); len.writeUInt32LE(hj.length);
const raw = Buffer.concat([len, hj, ...chunks.map((c) => Buffer.from(c.buffer, c.byteOffset, c.byteLength))]);
const gz = gzipSync(raw, { level: 9 });
writeFileSync(OUT, gz);
console.log(`${head.parts.length} Teile, ${nV} Punkte, ${nT0} → ${nT} Dreiecke → ${(raw.length / 1024).toFixed(0)} KB roh, ${(gz.length / 1024).toFixed(0)} KB gepackt: ${OUT}`);
