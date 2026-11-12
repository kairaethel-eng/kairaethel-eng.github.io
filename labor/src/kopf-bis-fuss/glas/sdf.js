// Knochen als verschmolzene Formen: Jeder Knochen ist eine Abstandsfunktion (innen negativ, außen positiv) aus
// Grundkörpern, die weich ineinander übergehen (smin). Daraus wird ein glattes Dreiecksnetz gerechnet
// („Surface Nets“). So entstehen organische Formen ohne fremdes 3D-Modell – also ohne Lizenzfragen.
import * as THREE from 'three';

export const smin = (a, b, k) => { const h = Math.max(k - Math.abs(a - b), 0) / k; return Math.min(a, b) - h * h * k * 0.25; };
export const smax = (a, b, k) => -smin(-a, -b, k);
// Kapsel / Rundkegel zwischen a und b mit Radius r1 → r2
export function cone(x, y, z, ax, ay, az, bx, by, bz, r1, r2) {
  const pax = x - ax, pay = y - ay, paz = z - az, bax = bx - ax, bay = by - ay, baz = bz - az;
  let h = (pax * bax + pay * bay + paz * baz) / (bax * bax + bay * bay + baz * baz);
  h = h < 0 ? 0 : h > 1 ? 1 : h;
  const dx = pax - bax * h, dy = pay - bay * h, dz = paz - baz * h;
  return Math.sqrt(dx * dx + dy * dy + dz * dz) - (r1 + (r2 - r1) * h);
}
// Ellipsoid (Näherung, für weiche Verschmelzung genau genug)
export function ell(x, y, z, cx, cy, cz, rx, ry, rz) {
  const px = (x - cx) / rx, py = (y - cy) / ry, pz = (z - cz) / rz;
  const k0 = Math.sqrt(px * px + py * py + pz * pz), k1 = Math.sqrt((px / rx) ** 2 + (py / ry) ** 2 + (pz / rz) ** 2);
  return k1 < 1e-9 ? -Math.min(rx, ry, rz) : (k0 * (k0 - 1)) / k1;
}

// Netz aus einer Abstandsfunktion. Generator: `yield` = hier darf pausiert werden (Zeitscheiben, kein Ruckeln).
// b = [x0,y0,z0,x1,y1,z1], cell = Kantenlänge einer Rasterzelle
export function* meshGen(f, b, cell) {
  const nx = Math.ceil((b[3] - b[0]) / cell), ny = Math.ceil((b[4] - b[1]) / cell), nz = Math.ceil((b[5] - b[2]) / cell);
  const X = nx + 1, Y = ny + 1, XY = X * Y, val = new Float32Array(XY * (nz + 1));
  let i = 0;
  for (let z = 0; z <= nz; z++) {
    const pz = b[2] + z * cell;
    for (let y = 0; y <= ny; y++) { const py = b[1] + y * cell; for (let x = 0; x <= nx; x++) val[i++] = f(b[0] + x * cell, py, pz); }
    yield;
  }
  const vid = new Int32Array(nx * ny * nz).fill(-1), pos = [], idx = [];
  const E = [[0, 1], [2, 3], [4, 5], [6, 7], [0, 2], [1, 3], [4, 6], [5, 7], [0, 4], [1, 5], [2, 6], [3, 7]];
  const cv = new Float32Array(8);
  for (let z = 0; z < nz; z++) {
    for (let y = 0; y < ny; y++) for (let x = 0; x < nx; x++) {
      const o = x + y * X + z * XY;
      cv[0] = val[o]; cv[1] = val[o + 1]; cv[2] = val[o + X]; cv[3] = val[o + X + 1]; cv[4] = val[o + XY]; cv[5] = val[o + XY + 1]; cv[6] = val[o + XY + X]; cv[7] = val[o + XY + X + 1];
      let m = 0; for (let k = 0; k < 8; k++) if (cv[k] < 0) m |= 1 << k;
      if (m === 0 || m === 255) continue;
      let sx = 0, sy = 0, sz = 0, n = 0;
      for (let e = 0; e < 12; e++) {
        const a = E[e][0], c = E[e][1], va = cv[a], vb = cv[c];
        if ((va < 0) === (vb < 0)) continue;
        const t = va / (va - vb);
        sx += (a & 1) + ((c & 1) - (a & 1)) * t; sy += ((a >> 1) & 1) + (((c >> 1) & 1) - ((a >> 1) & 1)) * t; sz += (a >> 2) + ((c >> 2) - (a >> 2)) * t; n++;
      }
      vid[x + y * nx + z * nx * ny] = pos.length / 3;
      pos.push(b[0] + (x + sx / n) * cell, b[1] + (y + sy / n) * cell, b[2] + (z + sz / n) * cell);
    }
    if ((z & 3) === 3) yield;
  }
  const C = (x, y, z) => vid[x + y * nx + z * nx * ny];
  const quad = (a, c, d, e) => { if (a >= 0 && c >= 0 && d >= 0 && e >= 0) idx.push(a, c, d, a, d, e); };
  for (let z = 0; z < nz; z++) for (let y = 0; y < ny; y++) for (let x = 0; x < nx; x++) {
    const o = x + y * X + z * XY, v0 = val[o] < 0;
    if (y > 0 && z > 0 && v0 !== (val[o + 1] < 0)) quad(C(x, y, z), C(x, y - 1, z), C(x, y - 1, z - 1), C(x, y, z - 1));
    if (x > 0 && z > 0 && v0 !== (val[o + X] < 0)) quad(C(x, y, z), C(x, y, z - 1), C(x - 1, y, z - 1), C(x - 1, y, z));
    if (x > 0 && y > 0 && v0 !== (val[o + XY] < 0)) quad(C(x, y, z), C(x - 1, y, z), C(x - 1, y - 1, z), C(x, y - 1, z));
  }
  yield;
  // Normalen aus dem Gefälle der Abstandsfunktion (glatter als aus den Dreiecken), Dreiecke danach ausrichten
  const nv = pos.length / 3, nor = new Float32Array(pos.length), e = cell * 0.6;
  for (let k = 0; k < nv; k++) {
    const x = pos[k * 3], y = pos[k * 3 + 1], z = pos[k * 3 + 2];
    let gx = f(x + e, y, z) - f(x - e, y, z), gy = f(x, y + e, z) - f(x, y - e, z), gz = f(x, y, z + e) - f(x, y, z - e);
    const l = Math.hypot(gx, gy, gz) || 1; nor[k * 3] = gx / l; nor[k * 3 + 1] = gy / l; nor[k * 3 + 2] = gz / l;
    if ((k & 2047) === 2047) yield;
  }
  for (let t = 0; t < idx.length; t += 3) {
    const a = idx[t] * 3, c = idx[t + 1] * 3, d = idx[t + 2] * 3;
    const ux = pos[c] - pos[a], uy = pos[c + 1] - pos[a + 1], uz = pos[c + 2] - pos[a + 2], vx = pos[d] - pos[a], vy = pos[d + 1] - pos[a + 1], vz = pos[d + 2] - pos[a + 2];
    if ((uy * vz - uz * vy) * nor[a] + (uz * vx - ux * vz) * nor[a + 1] + (ux * vy - uy * vx) * nor[a + 2] < 0) { const s = idx[t + 1]; idx[t + 1] = idx[t + 2]; idx[t + 2] = s; }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(nv * 2), 2));
  g.setIndex(idx);
  return g;
}
