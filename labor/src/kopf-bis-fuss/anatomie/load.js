// Anatomie-Netze lesen (Gegenstück zu tools/anatomie.mjs): gzip → Kopf (JSON) + je Teil Punkte (16 Bit, Differenzen) und Dreiecke (Varint).
// Daten: BodyParts3D, © The Database Center for Life Science licensed under CC Attribution 4.0 International.
// Koordinaten in cm: x links, y Höhe über dem Boden, z vorn (wie bones.js). Normalen werden hier gerechnet.
import * as THREE from 'three';
import { gunzipSync } from 'three/examples/jsm/libs/fflate.module.js';

export function decode(gz) {
  const raw = gunzipSync(gz), dv = new DataView(raw.buffer, raw.byteOffset, raw.byteLength);
  const hl = dv.getUint32(0, true), head = JSON.parse(new TextDecoder().decode(raw.subarray(4, 4 + hl))), base = 4 + hl;
  const parts = head.parts.map((p) => {
    const nv = p.nv, pos = new Float32Array(nv * 3), pb = raw.subarray(base + p.p, base + p.p + nv * 6);
    for (let k = 0; k < 3; k++) {
      const lo = p.lo[k], f = (p.hi[k] - lo) / 65535; let acc = 0;
      for (let i = 0; i < nv; i++) { acc = (acc + (pb[k * 2 * nv + i] | (pb[(k * 2 + 1) * nv + i] << 8))) & 0xFFFF; pos[i * 3 + k] = lo + acc * f; }
    }
    const idx = new (nv > 65535 ? Uint32Array : Uint16Array)(p.nt * 3); let o = base + p.i, hw = 0;
    for (let j = 0; j < idx.length; j++) { let d = 0, sh = 0, b; do { b = raw[o++]; d |= (b & 127) << sh; sh += 7; } while (b & 128); idx[j] = hw - d; if (d === 0) hw++; }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setIndex(new THREE.BufferAttribute(idx, 1));
    geo.computeVertexNormals(); geo.computeBoundingBox(); geo.computeBoundingSphere();
    return { id: p.id, kind: p.kind, geo, center: geo.boundingBox.getCenter(new THREE.Vector3()), box: geo.boundingBox };
  });
  return { quelle: head.quelle, parts, byId: (id) => parts.find((p) => p.id === id) };
}
