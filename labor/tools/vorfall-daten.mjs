// Bandscheibenvorfall-Film (14.11.2026): Bewegungssegment L4/L5 aus der echten Wirbelsäule herausziehen.
// Quelle: assets/wirbelsaeule-echt.bin (BodyParts3D 4.0, CC BY 4.0, erzeugt mit tools/wirbel-echt.mjs).
//   BodyParts3D, © The Database Center for Life Science licensed under CC Attribution 4.0 International
//   Verändert: Teile L4, L5 und die Bandscheibe L4/L5 ausgewählt, in das Achsenkreuz der Bandscheibe umgerechnet, quantisiert.
// Aufruf:  node tools/vorfall-daten.mjs      → src/vorfall/daten.js (eingebettet, damit der Film ohne Abruf und per file:// läuft)
// Achsenkreuz (cm): Ursprung = Mitte der Bandscheibe L4/L5, x seitlich (Patient links +), y entlang der Säule nach oben, z nach vorn.
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { decode, model } from '../src/wirbel-echt/anatomie.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const M = model(decode(readFileSync(join(root, 'assets/wirbelsaeule-echt.bin'))));
const D = M.disc.L4, F = D.F;
const loc = (x, y, z) => { const dx = x - D.c.x, dy = y - D.c.y, dz = z - D.c.z; return [dx * F.l.x + dy * F.l.y + dz * F.l.z, dx * F.n.x + dy * F.n.y + dz * F.n.z, dx * F.a.x + dy * F.a.y + dz * F.a.z]; };
const r3 = (v) => +v.toFixed(3);
const Q = 2000; // 1/2000 cm je Stufe (Int16 reicht bis ±16 cm)
const b64 = (ta) => Buffer.from(ta.buffer, ta.byteOffset, ta.byteLength).toString('base64');
const parts = {};
for (const [key, id] of [['L4', 'L4'], ['L5', 'L5'], ['disc', 'dL4']]) {
  const p = M.P[id], n = p.pos.length / 3, q = new Int16Array(n * 3);
  for (let i = 0; i < n; i++) { const v = loc(p.pos[i * 3], p.pos[i * 3 + 1], p.pos[i * 3 + 2]); for (let k = 0; k < 3; k++) { const s = Math.round(v[k] * Q); if (Math.abs(s) > 32767) throw new Error('Wertebereich'); q[i * 3 + k] = s; } }
  if (n > 65535) throw new Error('zu viele Punkte');
  parts[key] = { nv: n, nt: p.idx.length / 3, p: b64(q), i: b64(Uint16Array.from(p.idx)) };
}
const lv = (id) => { const L = M.levels.find((l) => l.id === id); return { c: loc(L.c.x, L.c.y, L.c.z).map(r3), h: r3(L.h), R: r3(L.R), Rz: r3(L.Rz), canal: loc(L.canal.x, L.canal.y, L.canal.z).map(r3), canalW: r3(L.canalW) }; };
const meta = { quelle: M.quelle, q: Q, disc: { t: r3(D.t), R: r3(D.R), Rz: r3(D.Rz) }, L4: lv('L4'), L5: lv('L5') };
const out = `// ERZEUGT von tools/vorfall-daten.mjs – nicht von Hand ändern.
// Bewegungssegment L4/L5 (Wirbel L4, L5, Bandscheibe) aus BodyParts3D 4.0:
// ${M.quelle}
// Verändert: Teile ausgewählt, vereinfacht (tools/wirbel-echt.mjs), umgerechnet und quantisiert.
export const META = ${JSON.stringify(meta)};
export const PARTS = ${JSON.stringify(parts)};
`;
writeFileSync(join(root, 'src/vorfall/daten.js'), out);
console.log('src/vorfall/daten.js', (out.length / 1024).toFixed(1), 'KB', JSON.stringify(meta));
