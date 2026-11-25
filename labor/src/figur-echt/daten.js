// Entwurf „Echte Figur“ (23.11.2026, Go Kai „Empfehlung“): Daten der stehenden Figur lesen (Gegenstück zu tools/figur-echt.mjs).
// Daten: BodyParts3D, © The Database Center for Life Science licensed under CC Attribution 4.0 International – verändert
// (Haut neutralisiert, vereinfacht, in den Grundriss von Kapitel 01 umgerechnet, Nervenbahnen an echten Landmarken berechnet).
// Format wie assets/motive-anatomie.bin (Kopf als JSON, Ecken 16 Bit je Achse als Differenzen, Dreiecke als Differenzen).
import { gunzipSync } from 'three/examples/jsm/libs/fflate.module.js';

export function decode(gz) {
  const raw = gunzipSync(gz instanceof Uint8Array ? gz : new Uint8Array(gz));
  const dv = new DataView(raw.buffer, raw.byteOffset, raw.byteLength);
  const hl = dv.getUint32(0, true), head = JSON.parse(new TextDecoder().decode(raw.subarray(4, 4 + hl))), base = 4 + hl;
  const parts = head.parts.map((p) => {
    const nv = p.nv, pos = new Float32Array(nv * 3), pb = raw.subarray(base + p.p, base + p.p + nv * 6);
    for (let k = 0; k < 3; k++) {
      const lo = p.lo[k], f = (p.hi[k] - lo) / 65535; let acc = 0;
      for (let i = 0; i < nv; i++) { acc = (acc + (pb[k * 2 * nv + i] | (pb[(k * 2 + 1) * nv + i] << 8))) & 0xFFFF; pos[i * 3 + k] = lo + acc * f; }
    }
    const idx = new Uint32Array(p.nt * 3); let o = base + p.i, hw = 0;
    for (let j = 0; j < idx.length; j++) { let d = 0, sh = 0, b; do { b = raw[o++]; d |= (b & 127) << sh; sh += 7; } while (b & 128); idx[j] = hw - d; if (d === 0) hw++; }
    const ao = p.a != null ? raw.slice(base + p.a, base + p.a + nv) : null; // feines Gehirn: Verdeckung je Ecke (0 frei … 255 tief)
    return { id: p.id, kind: p.kind, st: p.st, pos, idx, ao };
  });
  return { head, parts };
}

// Laden (Labor: assets/…, Live: neben der Seite – HOP_ASSETS setzt build.mjs)
// Fassung K (?start=k): das feine Gehirn liegt in einer eigenen Datei (hirn-echt.bin, „Brain for Blender“ von Anderson M. Winkler,
// brainder.org, CC BY-SA 3.0 – verändert) und wird nur dort geladen; seine Teile (Art brain2) kommen zu den übrigen dazu.
const get = (f) => fetch(HOP_ASSETS + f).then((r) => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.arrayBuffer(); }).then(decode);
export const loadEcht = () => {
  const hirn = new URLSearchParams(location.search).get('start') === 'k';
  return Promise.all([get('figur-echt.bin'), hirn ? get('hirn-echt.bin').catch(() => null) : null])
    .then(([d, h]) => { if (h) d.parts.push(...h.parts); return d; });
};
