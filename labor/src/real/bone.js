// Realistische Wirbelsäule (Auftrag Kai 11.11.2026): Knochen als Abstandsfelder (SDF) modelliert und zu Flächen vernetzt.
// Kein externes 3D-Modell → keine Lizenzfragen. Maße in Dezimetern (1 = 10 cm), nach üblichen Anatomie-Richtwerten.
// Lokales Koordinatensystem je Wirbel: y = kranial (oben), +z = ventral (vorne), −z = dorsal, Ursprung = Mitte des Wirbelkörpers.
import * as THREE from 'three';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const UP = V(0, 1, 0);
const deg = (d) => d * Math.PI / 180;

// ---------- Abstandsfelder ----------
const smin = (a, b, k) => { const h = Math.max(k - Math.abs(a - b), 0) / k; return Math.min(a, b) - h * h * k * 0.25; };

// Kegelstumpf mit runden Enden zwischen zwei Punkten (nach I. Quilez)
function cone(a, b, r1, r2) {
  const ax = a[0], ay = a[1], az = a[2];
  const bax = b[0] - ax, bay = b[1] - ay, baz = b[2] - az;
  const l2 = bax * bax + bay * bay + baz * baz, rr = r1 - r2, a2 = l2 - rr * rr, il2 = 1 / l2;
  return {
    c: [ax + bax / 2, ay + bay / 2, az + baz / 2], r: Math.sqrt(l2) / 2 + Math.max(r1, r2),
    f(x, y, z) {
      const pax = x - ax, pay = y - ay, paz = z - az;
      const yy = pax * bax + pay * bay + paz * baz, zz = yy - l2;
      const qx = pax * l2 - bax * yy, qy = pay * l2 - bay * yy, qz = paz * l2 - baz * yy;
      const x2 = qx * qx + qy * qy + qz * qz, y2 = yy * yy * l2, z2 = zz * zz * l2;
      const k = Math.sign(rr) * rr * rr * x2;
      if (Math.sign(zz) * a2 * z2 > k) return Math.sqrt(x2 + z2) * il2 - r2;
      if (Math.sign(yy) * a2 * y2 < k) return Math.sqrt(x2 + y2) * il2 - r1;
      return (Math.sqrt(x2 * a2 * il2) + yy * rr) * il2 - r1;
    },
  };
}
function ell(c, r) {
  const cx = c[0], cy = c[1], cz = c[2], rx = r[0], ry = r[1], rz = r[2], rm = Math.min(rx, ry, rz);
  return {
    c, r: Math.max(rx, ry, rz),
    f(x, y, z) {
      const px = (x - cx) / rx, py = (y - cy) / ry, pz = (z - cz) / rz;
      const k0 = Math.sqrt(px * px + py * py + pz * pz);
      const k1 = Math.sqrt(px * px / (rx * rx) + py * py / (ry * ry) + pz * pz / (rz * rz));
      return k1 > 1e-9 ? k0 * (k0 - 1) / k1 : -rm;
    },
  };
}
// Form in einer Richtung stauchen/strecken (s > 1 = schmaler) um den Punkt o
function sq(p, o, s) {
  const m = Math.max(s[0], s[1], s[2], 1), lo = Math.min(s[0], s[1], s[2], 1);
  return {
    c: [o[0] + (p.c[0] - o[0]) / s[0], o[1] + (p.c[1] - o[1]) / s[1], o[2] + (p.c[2] - o[2]) / s[2]], r: p.r / lo,
    f: (x, y, z) => p.f(o[0] + (x - o[0]) * s[0], o[1] + (y - o[1]) * s[1], o[2] + (z - o[2]) * s[2]) / m,
  };
}
// Wirbelkörper: ovaler Zylinder mit Taille, hinten abgeflacht (Nierenform), Deckplatten leicht eingedellt
function body(yc, zc, R, az, hh, waist, conc, bf = 1) {
  const e = Math.min(hh * 0.3, R * 0.14), ds = 0.5 + 0.5 * az;
  return {
    c: [0, yc, zc], r: Math.sqrt(R * R + hh * hh) * 1.05,
    f(x, y, z) {
      y -= yc; z -= zc;
      const zz = z < 0 ? z / (az * bf) : z / az;
      const rho = Math.sqrt(x * x + zz * zz);
      const t = Math.min(Math.abs(y) / hh, 1);
      const r = R * (1 - waist * (1 - t * t));
      const q = Math.min(rho / R, 1);
      const dx = (rho - r) * ds + e, dy = Math.abs(y) - hh + conc * (1 - q * q) + e;
      return Math.min(Math.max(dx, dy), 0) + Math.sqrt(Math.max(dx, 0) ** 2 + Math.max(dy, 0) ** 2) - e;
    },
  };
}
// weiche Vereinigung mit Grobtest über Hüllkugeln
function union(prims, k) {
  const n = prims.length;
  return (x, y, z) => {
    let d = 1e9;
    for (let i = 0; i < n; i++) {
      const p = prims[i], ex = x - p.c[0], ey = y - p.c[1], ez = z - p.c[2];
      if (Math.sqrt(ex * ex + ey * ey + ez * ez) - p.r > d + k) continue;
      const v = p.f(x, y, z);
      d = d > 1e8 ? v : smin(d, v, k);
    }
    return d;
  };
}
// Wertrauschen (Knochenoberfläche ist nie glatt)
function hash(x, y, z) { let h = (x * 374761393 + y * 668265263 + z * 2147483647) | 0; h = (h ^ (h >>> 13)) * 1274126177 | 0; return ((h ^ (h >>> 16)) >>> 0) / 4294967295; }
function vnoise(x, y, z) {
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
  let fx = x - xi, fy = y - yi, fz = z - zi;
  fx = fx * fx * (3 - 2 * fx); fy = fy * fy * (3 - 2 * fy); fz = fz * fz * (3 - 2 * fz);
  const a = hash(xi, yi, zi), b = hash(xi + 1, yi, zi), c = hash(xi, yi + 1, zi), d = hash(xi + 1, yi + 1, zi);
  const e = hash(xi, yi, zi + 1), f = hash(xi + 1, yi, zi + 1), g = hash(xi, yi + 1, zi + 1), h = hash(xi + 1, yi + 1, zi + 1);
  const l1 = a + (b - a) * fx, l2 = c + (d - c) * fx, l3 = e + (f - e) * fx, l4 = g + (h - g) * fx;
  const m1 = l1 + (l2 - l1) * fy, m2 = l3 + (l4 - l3) * fy;
  return m1 + (m2 - m1) * fz;
}
function finish(prims, k, cuts, amp, seed) {
  const u = union(prims, k), nc = cuts.length, band = amp * 2.5;
  const sdf = (x, y, z) => {
    let d = u(x, y, z);
    for (let i = 0; i < nc; i++) { const c = cuts[i](x, y, z); d = -smin(-d, c, k * 0.6); }
    // flache Unebenheiten + feine Körnung, nur nahe der Oberfläche gerechnet
    if (d < band && d > -band) d += amp * ((vnoise(x * 19 + seed, y * 19, z * 19) - 0.5) * 1.4 + (vnoise(x * 55, y * 55 + seed, z * 55) - 0.5) * 0.6);
    return d;
  };
  const min = [1e9, 1e9, 1e9], max = [-1e9, -1e9, -1e9];
  prims.forEach((p) => { for (let a = 0; a < 3; a++) { min[a] = Math.min(min[a], p.c[a] - p.r); max[a] = Math.max(max[a], p.c[a] + p.r); } });
  return { sdf, min, max };
}

// ---------- Ebenen mit Maßen (Breite W, Tiefe D, Höhe H des Wirbelkörpers, Bandscheibe, Kanal halbe Breite/Tiefe) ----------
export function buildLevels() {
  const L = [];
  L.push({ id: 'C1', reg: 'c', n: 1, W: 0.16, D: 0.15, H: 0.15, disc: 0, cw: 0.125, cd: 0.095 });
  L.push({ id: 'C2', reg: 'c', n: 2, W: 0.17, D: 0.155, H: 0.19, disc: 0.045, cw: 0.115, cd: 0.08 });
  for (let i = 0; i < 5; i++) L.push({ id: 'C' + (i + 3), reg: 'c', n: i + 3, W: 0.16 + i * 0.011, D: 0.15 + i * 0.004, H: 0.13 + i * 0.004, disc: 0.05, cw: 0.118, cd: 0.074 });
  for (let i = 0; i < 12; i++) L.push({ id: 'Th' + (i + 1), reg: 't', n: i + 1, W: 0.25 + i * 0.0135, D: 0.175 + i * 0.0115, H: 0.165 + i * 0.007, disc: 0.04 + i * 0.0025, cw: 0.085 + (i > 9 ? 0.012 : 0), cd: 0.078 });
  for (let i = 0; i < 5; i++) L.push({ id: 'L' + (i + 1), reg: 'l', n: i + 1, W: 0.42 + i * 0.02, D: 0.31 + i * 0.008, H: 0.262 + i * 0.003, disc: 0.1 + (i === 4 ? 0.01 : 0), cw: 0.115 + i * 0.004, cd: 0.085 });
  L.push({ id: 'S', reg: 's', n: 1, W: 0.5, D: 0.32, H: 1.05, disc: 0.02, cw: 0.1, cd: 0.05 });
  L.push({ id: 'Co', reg: 'co', n: 1, W: 0.14, D: 0.1, H: 0.3, disc: 0, cw: 0, cd: 0 });
  return L;
}

// ---------- Wirbel-Formen ----------
function atlas(lv) {
  const pr = [];
  // Ring (vorderer und hinterer Bogen) als ovaler Torus
  const rx = 0.2, rz = 0.185, zc = -0.085, tr = 0.032;
  pr.push({ c: [0, 0, zc], r: 0.26, f(x, y, z) { const q = (Math.sqrt((x / rx) ** 2 + ((z - zc) / rz) ** 2) - 1) * rz; return Math.sqrt(q * q + y * y * 0.4) - tr; } });
  for (const s of [1, -1]) {
    pr.push(ell([s * 0.2, 0, -0.03], [0.08, 0.078, 0.115])); // Massa lateralis
    pr.push(sq(cone([s * 0.25, 0, -0.05], [s * 0.37, -0.012, -0.075], 0.05, 0.034), [0, 0, -0.06], [1, 1.5, 0.85])); // Querfortsatz
  }
  pr.push(ell([0, -0.005, 0.103], [0.032, 0.036, 0.026])); // Tuberculum anterius
  pr.push(ell([0, 0.004, -0.272], [0.026, 0.034, 0.028])); // Tuberculum posterius
  const cuts = [
    (x, y, z) => (Math.sqrt((x / 0.118) ** 2 + ((z + 0.125) / 0.1) ** 2) - 1) * 0.1, // Wirbelkanal
    (x, y, z) => Math.sqrt(x * x + (z - 0.015) ** 2) - 0.066, // Platz für den Dens
    (x, y, z) => Math.sqrt((Math.abs(x) - 0.305) ** 2 + (z + 0.062) ** 2) - 0.021, // Foramen transversarium
  ];
  return { ...finish(pr, 0.014, cuts, 0.002, 1.3), cz: -0.125, exit: [0.17, -0.075, -0.175] };
}

function regular(lv) {
  const { W, D, H, cw, cd, reg, n, id, disc } = lv;
  const R = W / 2, hh = H / 2, az = D / W;
  const C = reg === 'c', T = reg === 't', Lm = reg === 'l';
  const cz = -(D / 2 * 0.88 + cd);
  const pr = [];
  pr.push(body(0, 0, R, az, hh, C ? 0.05 : T ? 0.1 : 0.13, C ? 0.006 : 0.012, C ? 1 : 0.86));
  const rp = C ? 0.027 : T ? 0.033 + 0.0012 * n : 0.056;
  const rl = C ? 0.024 : T ? 0.029 : 0.046;
  const yj = (C ? 0.1 : 0.16) * H;
  const jx = cw + rp * 0.8;
  const my = -0.06 * H, mz = cz - cd - rl * 0.45;
  const ls = C ? 0.31 : T ? 0.34 : 0.38; // Wirbelbogen-Platte: Höhe = 2·rl / ls
  for (const s of [1, -1]) {
    // Bogenwurzel (Pedikel) und Bogenplatte (Lamina)
    pr.push(sq(cone([s * Math.min(R * 0.74, jx), yj, -D / 2 * 0.72], [s * jx, yj, cz + cd * 0.15], rp * 1.08, rp), [0, yj, 0], [1, C ? 1 : 0.72, 1]));
    pr.push(sq(cone([s * jx, my, cz - cd * 0.25], [0, my, mz], rl * 1.15, rl), [0, my, 0], [1, ls, 1]));
    if (C) {
      // Gelenkpfeiler + Querfortsatz mit Loch für die Wirbelarterie
      pr.push(sq(ell([s * (cw + 0.034), -0.004, cz - 0.004], [0.04, 0.5 * (H + disc) * 0.9, 0.04]), [0, 0, cz], [1, 1, 1]));
      pr.push(ell([s * (R * 0.6 + cw * 0.5 + 0.03), -0.006, -D * 0.36], [0.062 + (n === 7 ? 0.012 : 0), 0.027, 0.056]));
      if (n === 2) pr.push(ell([s * 0.15, 0.068, -0.03], [0.078, 0.04, 0.082])); // obere Gelenkfläche des Axis (trägt den Atlas)
    } else if (T) {
      const tl = n <= 10 ? 0.2 - n * 0.007 : 0.07, a = deg(34 + n * 1.2);
      const dx = Math.cos(a), dz = -Math.sin(a), dy = 0.3;
      pr.push(cone([s * jx, yj * 0.6, cz - cd * 0.3], [s * (jx + dx * tl), yj * 0.6 + dy * tl, cz - cd * 0.3 + dz * tl], 0.036, n <= 10 ? 0.041 : 0.028));
      pr.push(ell([s * (cw + 0.012), yj + 0.095 + n * 0.003, cz - cd * 0.55], [0.038, 0.062 + n * 0.002, 0.022])); // oberer Gelenkfortsatz
      pr.push(ell([s * (cw * 0.72), -hh - 0.045, cz - cd - 0.012], [0.04, 0.07 + n * 0.002, 0.022])); // unterer
      pr.push(cone([s * jx * 0.9, my, cz - cd * 0.6], [s * (cw * 0.72), -hh - 0.03, cz - cd - 0.01], 0.034, 0.03)); // Pars interarticularis
    } else {
      const tl = [0.25, 0.3, 0.35, 0.3, 0.26][n - 1];
      pr.push(sq(cone([s * jx, yj * 0.5, cz - cd * 0.2], [s * (jx + tl), yj * 0.5 + 0.02, cz - cd * 0.2 - 0.05], n === 5 ? 0.05 : 0.036, n === 5 ? 0.032 : 0.02), [0, yj * 0.5, cz], [1, 0.85, 1.5]));
      pr.push(ell([s * (cw + 0.052), yj + 0.115, cz - cd * 0.5], [0.05, 0.095, 0.048])); // oberer Gelenkfortsatz (mit Mamillarhöcker)
      pr.push(ell([s * (cw + 0.085), yj + 0.15, cz - cd * 0.95], [0.03, 0.045, 0.035]));
      pr.push(ell([s * (cw * 0.82), -hh - 0.085, cz - cd - 0.03], [0.042, 0.105, 0.036])); // unterer
      pr.push(cone([s * jx * 0.92, my + 0.02, cz - cd * 0.55], [s * (cw * 0.82), -hh - 0.06, cz - cd - 0.028], 0.05, 0.04)); // Pars interarticularis
      pr.push(cone([s * jx, yj, cz - cd * 0.1], [s * (cw + 0.052), yj + 0.1, cz - cd * 0.5], 0.05, 0.045));
    }
  }
  // Dornfortsatz
  if (C) {
    const long = n === 7, sl = long ? 0.27 : n === 2 ? 0.17 : 0.105 + (n - 3) * 0.012, a = deg(long ? 14 : 20), r0 = n === 2 ? 0.04 : 0.027, r1 = long ? 0.026 : n === 2 ? 0.032 : 0.02;
    const tip = [0, my - Math.sin(a) * sl, mz - Math.cos(a) * sl];
    pr.push(cone([0, my, mz + 0.01], tip, r0, r1));
    if (!long) for (const s of [1, -1]) pr.push(cone(tip, [s * (n === 2 ? 0.045 : 0.03), tip[1] - 0.012, tip[2] - (n === 2 ? 0.05 : 0.035)], r1, r1 * 0.8)); // gegabelt
    else pr.push(ell(tip, [0.03, 0.03, 0.032]));
  } else if (T) {
    const a = deg([24, 34, 44, 54, 58, 60, 60, 58, 52, 42, 30, 20][n - 1]), sl = 0.3 + (n > 3 && n < 10 ? 0.07 : 0.02);
    const tip = [0, my - Math.sin(a) * sl, mz - Math.cos(a) * sl];
    pr.push(sq(cone([0, my, mz + 0.012], tip, 0.042, 0.022), [0, my, mz], [1.25, 1, 1]));
    pr.push(ell(tip, [0.022, 0.03, 0.028]));
  } else {
    // Lendenwirbel: breite, hohe Knochenplatte („Beil“)
    const sl = n === 5 ? 0.2 : 0.27;
    pr.push(sq(cone([0, my, mz + 0.03], [0, my - 0.03, mz - sl], 0.05, 0.056), [0, my, mz], [1.7, 0.5, 1]));
    pr.push(ell([0, my - 0.03, mz - sl - 0.01], [0.04, 0.1, 0.04])); // verdickter Rand
  }
  if (id === 'C2') pr.push(cone([0, hh - 0.02, 0.004], [0, hh + 0.14, 0], 0.06, 0.046)); // Dens axis
  const cuts = [(x, y, z) => (Math.sqrt((x / cw) ** 2 + ((z - cz) / cd) ** 2) - 1) * Math.min(cw, cd)];
  if (C) {
    const hx = R * 0.6 + cw * 0.5 + 0.022, hz = -D * 0.37;
    cuts.push((x, y, z) => Math.sqrt((Math.abs(x) - hx) ** 2 + (z - hz) ** 2) - 0.019);
  }
  const k = C ? 0.013 : T ? 0.019 : 0.027;
  return { ...finish(pr, k, cuts, C ? 0.002 : T ? 0.003 : 0.004, n * 7.1 + (C ? 0 : T ? 40 : 90)), cz, exit: [cw + 0.035, -(hh + disc * 0.5), cz + cd * (C ? 0.95 : 0.6)] };
}

// Kreuzbein: nach vorn hohl gekrümmt (zc), Flügel oben, vier Lochpaare, Mittelkamm
const sacZ = (t) => -0.17 * Math.sin(Math.PI * Math.min(Math.max(t, 0), 1) * 0.92);
export const SAC = { xf: (i) => 0.2 - 0.032 * i, yf: (i, H) => H / 2 - 0.27 - 0.185 * i, z: sacZ };
function sacrum(lv) {
  const H = lv.H, hh = H / 2;
  const warp = (p) => ({ c: [p.c[0], p.c[1], p.c[2] + sacZ((hh - p.c[1]) / H)], r: p.r + 0.03, f: (x, y, z) => p.f(x, y, z - sacZ((hh - y) / H)) });
  const pr = [];
  // fünf verschmolzene Segmente, nach unten schmaler und dünner → geschwungene Seitenkante
  [[0.47, 0.15], [0.41, 0.125], [0.31, 0.1], [0.22, 0.082], [0.15, 0.066]].forEach(([w, th], i) => pr.push(ell([0, hh - 0.14 - i * 0.2, -0.055 + i * 0.012], [w, 0.17, th])));
  pr.push(body(hh - 0.13, 0.075, 0.25, 0.66, 0.13, 0.08, 0.012, 0.86)); // S1-Körper mit Deckplatte
  for (const s of [1, -1]) {
    pr.push(ell([s * 0.36, hh - 0.13, -0.035], [0.2, 0.13, 0.13])); // Ala
    for (let i = 0; i < 4; i++) pr.push(ell([s * (0.24 - i * 0.035), hh - 0.3 - i * 0.185, -0.15 + i * 0.02], [0.03, 0.06, 0.03])); // Crista sacralis lateralis
    pr.push(ell([s * (lv.cw + 0.06), hh + 0.055, -0.215], [0.05, 0.095, 0.045])); // oberer Gelenkfortsatz
    pr.push(ell([s * 0.3, hh - 0.36, -0.07], [0.17, 0.24, 0.1])); // Seitenteil (trägt die Gelenkfläche zum Becken)
  }
  for (let i = 1; i < 5; i++) pr.push(body(hh - 0.13 - i * 0.19, 0.03, 0.2 - i * 0.027, 0.5, 0.085, 0.05, 0, 1)); // verschmolzene Körper (Querleisten)
  for (let i = 0; i < 4; i++) pr.push(ell([0, hh - 0.2 - i * 0.19, -0.165 + i * 0.022], [0.028, 0.075, 0.04])); // Crista sacralis mediana
  const cuts = [];
  for (let i = 0; i < 4; i++) { const xf = SAC.xf(i), yf = SAC.yf(i, H), r = 0.036 - i * 0.004; cuts.push((x, y) => Math.sqrt((Math.abs(x) - xf) ** 2 + ((y - yf) * 0.8) ** 2) - r); }
  cuts.push((x, y, z) => Math.max(Math.sqrt((x * 0.6) ** 2 + (z - sacZ((hh - y) / H) + 0.105) ** 2) - 0.045, hh - 0.4 - y)); // Sakralkanal (oben offen)
  const w = pr.map(warp);
  const fin = finish(w, 0.06, cuts, 0.004, 200);
  fin.min[2] -= 0.2; fin.max[2] += 0.05;
  return { ...fin, cz: -0.105, exit: null };
}
function coccyx() {
  const pr = [];
  for (let i = 0; i < 4; i++) pr.push(ell([0, 0.115 - i * 0.082, 0.012 * i * i], [0.085 - i * 0.015, 0.068 - i * 0.008, 0.055 - i * 0.008]));
  for (const s of [1, -1]) pr.push(cone([s * 0.05, 0.12, 0], [s * 0.115, 0.13, -0.01], 0.028, 0.018)); // Cornua
  return { ...finish(pr, 0.045, [], 0.003, 300), cz: 0, exit: null };
}
export function vertebraShape(lv) {
  if (lv.id === 'C1') return atlas(lv);
  if (lv.reg === 's') return sacrum(lv);
  if (lv.reg === 'co') return coccyx(lv);
  return regular(lv);
}
export function discShape(a, b) {
  const R = (a.W + b.W) / 4 * 0.975, az = (a.D / a.W + b.D / b.W) / 2;
  const pr = [body(0, 0, R, az, a.disc / 2 + 0.012, -0.03, 0, a.reg === 'c' ? 1 : 0.86)];
  return finish(pr, 0.01, [], 0.0001, 0);
}

// ---------- Vernetzen (Surface Nets) ----------
// Generator: yield je Schicht, damit die Seite beim Aufbau bedienbar bleibt. Liefert BufferGeometry mit Normalen und
// Verschattung (Ambient Occlusion aus dem Abstandsfeld) als Farbe.
export function* meshGen(shape, cell, tint = null) {
  const { sdf } = shape, pad = cell * 2.5;
  const o = shape.min.map((v) => v - pad);
  const nx = Math.ceil((shape.max[0] - o[0] + pad) / cell) + 1, ny = Math.ceil((shape.max[1] - o[1] + pad) / cell) + 1, nz = Math.ceil((shape.max[2] - o[2] + pad) / cell) + 1;
  const val = new Float32Array(nx * ny * nz);
  // Grobtest in Blöcken: liegt die Blockmitte weit von der Oberfläche, wird der Block nicht einzeln gerechnet
  const B = 4, thr = cell * ((B - 1) * 0.5 * 1.7321 + 1.2) * 1.4;
  for (let bz = 0; bz < nz; bz += B) {
    const z1 = Math.min(bz + B, nz);
    for (let by = 0; by < ny; by += B) {
      const y1 = Math.min(by + B, ny);
      for (let bx = 0; bx < nx; bx += B) {
        const x1 = Math.min(bx + B, nx);
        const d = sdf(o[0] + (bx + x1 - 1) * 0.5 * cell, o[1] + (by + y1 - 1) * 0.5 * cell, o[2] + (bz + z1 - 1) * 0.5 * cell);
        const far = Math.abs(d) > thr, fv = d > 0 ? 1 : -1;
        for (let z = bz; z < z1; z++) for (let y = by; y < y1; y++) {
          let i = bx + y * nx + z * nx * ny;
          if (far) for (let x = bx; x < x1; x++) val[i++] = fv;
          else for (let x = bx; x < x1; x++) val[i++] = sdf(o[0] + x * cell, o[1] + y * cell, o[2] + z * cell);
        }
      }
    }
    yield;
  }
  const vid = new Int32Array(nx * ny * nz).fill(-1);
  const pos = [], sx = 1, sy = nx, sz = nx * ny;
  const cv = new Float32Array(8), off = [0, sx, sy, sx + sy, sz, sx + sz, sy + sz, sx + sy + sz];
  for (let z = 0; z < nz - 1; z++) {
    for (let y = 0; y < ny - 1; y++) for (let x = 0; x < nx - 1; x++) {
      const b = x + y * sy + z * sz;
      let mask = 0;
      for (let c = 0; c < 8; c++) { cv[c] = val[b + off[c]]; if (cv[c] < 0) mask |= 1 << c; }
      if (mask === 0 || mask === 255) continue;
      let ax = 0, ay = 0, az = 0, cnt = 0;
      for (let c = 0; c < 8; c++) for (let bit = 1; bit < 8; bit <<= 1) {
        if (c & bit) continue;
        const d = c | bit, a0 = cv[c], a1 = cv[d];
        if ((a0 < 0) === (a1 < 0)) continue;
        const t = a0 / (a0 - a1);
        ax += (c & 1) + (bit === 1 ? t : 0); ay += ((c >> 1) & 1) + (bit === 2 ? t : 0); az += ((c >> 2) & 1) + (bit === 4 ? t : 0); cnt++;
      }
      vid[b] = pos.length / 3;
      pos.push(o[0] + (x + ax / cnt) * cell, o[1] + (y + ay / cnt) * cell, o[2] + (z + az / cnt) * cell);
    }
    if ((z & 7) === 7) yield;
  }
  const nv = pos.length / 3, nor = new Float32Array(nv * 3), col = new Float32Array(nv * 3);
  // Feldwert an beliebiger Stelle (trilinear aus dem Gitter) – für Normalen und Verschattung, ohne das Feld neu zu rechnen
  const inv = 1 / cell;
  const samp = (px, py, pz) => {
    let fx = (px - o[0]) * inv, fy = (py - o[1]) * inv, fz = (pz - o[2]) * inv;
    fx = fx < 0 ? 0 : fx > nx - 1.001 ? nx - 1.001 : fx; fy = fy < 0 ? 0 : fy > ny - 1.001 ? ny - 1.001 : fy; fz = fz < 0 ? 0 : fz > nz - 1.001 ? nz - 1.001 : fz;
    const x = fx | 0, y = fy | 0, z = fz | 0, b = x + y * sy + z * sz;
    fx -= x; fy -= y; fz -= z;
    const a0 = val[b] + (val[b + sx] - val[b]) * fx, a1 = val[b + sy] + (val[b + sy + sx] - val[b + sy]) * fx;
    const a2 = val[b + sz] + (val[b + sz + sx] - val[b + sz]) * fx, a3 = val[b + sz + sy] + (val[b + sz + sy + sx] - val[b + sz + sy]) * fx;
    const m0 = a0 + (a1 - a0) * fy, m1 = a2 + (a3 - a2) * fy;
    return m0 + (m1 - m0) * fz;
  };
  const e = cell;
  for (let v = 0; v < nv; v++) {
    const x = pos[v * 3], y = pos[v * 3 + 1], z = pos[v * 3 + 2];
    let gx = samp(x + e, y, z) - samp(x - e, y, z), gy = samp(x, y + e, z) - samp(x, y - e, z), gz = samp(x, y, z + e) - samp(x, y, z - e);
    const l = Math.hypot(gx, gy, gz) || 1; gx /= l; gy /= l; gz /= l;
    nor[v * 3] = gx; nor[v * 3 + 1] = gy; nor[v * 3 + 2] = gz;
    // Verschattung: wie frei ist der Raum über der Fläche?
    let occ = 0;
    for (const d of [0.018, 0.045, 0.1]) occ += Math.max(0, d - samp(x + gx * d, y + gy * d, z + gz * d)) / d;
    const ao = Math.max(0, 1 - occ * 0.42), a2 = ao * ao * (3 - 2 * ao);
    if (tint) { col[v * 3] = tint[0] * (0.55 + 0.45 * a2); col[v * 3 + 1] = tint[1] * (0.55 + 0.45 * a2); col[v * 3 + 2] = tint[2] * (0.55 + 0.45 * a2); }
    else { col[v * 3] = 0.52 + 0.48 * a2; col[v * 3 + 1] = 0.4 + 0.6 * a2; col[v * 3 + 2] = 0.3 + 0.7 * a2; } // Vertiefungen wärmer/dunkler
    if ((v & 4095) === 4095) yield;
  }
  const idx = [];
  const quad = (a, b, c, d, flip) => { if (flip) idx.push(a, c, b, a, d, c); else idx.push(a, b, c, a, c, d); };
  for (let z = 1; z < nz - 1; z++) {
    for (let y = 1; y < ny - 1; y++) for (let x = 1; x < nx - 1; x++) {
      const b = x + y * sy + z * sz, v0 = val[b] < 0;
      if (v0 !== (val[b + sx] < 0)) quad(vid[b], vid[b - sy], vid[b - sy - sz], vid[b - sz], !v0);
      if (v0 !== (val[b + sy] < 0)) quad(vid[b], vid[b - sz], vid[b - sz - sx], vid[b - sx], !v0);
      if (v0 !== (val[b + sz] < 0)) quad(vid[b], vid[b - sx], vid[b - sx - sy], vid[b - sy], !v0);
    }
    if ((z & 7) === 7) yield;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(pos), 3));
  g.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  g.setIndex(new THREE.BufferAttribute(nv > 65535 ? new Uint32Array(idx) : new Uint16Array(idx), 1));
  g.computeBoundingSphere(); g.computeBoundingBox();
  return g;
}

// ---------- Lage der Wirbel auf der Körperachse ----------
export function layout() {
  const levels = buildLevels();
  let total = 0;
  levels.forEach((l) => { l.s0 = total; total += l.H + l.disc; });
  // Krümmungen: HWS-Lordose, BWS-Kyphose, LWS-Lordose, Kreuzbein nach hinten gekippt
  const ctrl = [[0, 0], [0.08, 0.13], [0.17, 0.05], [0.4, -0.4], [0.6, -0.1], [0.73, 0.3], [0.81, 0.24], [0.9, -0.16], [1, -0.72]];
  const curve = new THREE.CatmullRomCurve3(ctrl.map(([f, z]) => V(0, total * (1 - f), z)), false, 'centripetal');
  const len = curve.getLength();
  levels.forEach((lv) => {
    const u0 = lv.s0 / len, u1 = (lv.s0 + lv.H) / len;
    const p = curve.getPointAt((u0 + u1) / 2);
    // Achse = Sehne zwischen Ober- und Unterkante (lange Knochen wie das Kreuzbein liegen dann richtig)
    const t = curve.getPointAt(u0).sub(curve.getPointAt(u1)).normalize();
    lv.center = p; lv.quat = new THREE.Quaternion().setFromUnitVectors(UP, t);
    lv.mat = new THREE.Matrix4().compose(p, lv.quat, V(1, 1, 1));
    lv.shape = vertebraShape(lv);
    lv.w = (x, y, z) => V(x, y, z).applyMatrix4(lv.mat); // lokal → Säule
  });
  levels.forEach((lv, i) => {
    const nx = levels[i + 1];
    if (!nx || lv.disc < 0.03) return;
    const u = (lv.s0 + lv.H + lv.disc / 2) / len;
    lv.discPos = curve.getPointAt(u);
    lv.discQuat = new THREE.Quaternion().setFromUnitVectors(UP, lv.w(0, -lv.H / 2, 0).sub(nx.w(0, nx.H / 2, 0)).normalize());
  });
  return { levels, total, curve };
}

// ---------- Rückenmark, Cauda equina, Nervenwurzeln ----------
// Liefert Kurven in Säulen-Koordinaten. Wurzeln unterhalb des Conus (≈ L1/L2) laufen erst im Kanal abwärts (Cauda equina).
export function nerves(sp) {
  const L = sp.levels, iL1 = L.findIndex((l) => l.id === 'L1'), sac = L.find((l) => l.reg === 's');
  const canal = L.filter((l) => l.reg !== 'co' && l.reg !== 's').map((l) => l.w(0, 0, l.shape.cz));
  const top = L[0].w(0, 0.3, L[0].shape.cz + 0.02);
  const conus = L[iL1].w(0, -L[iL1].H * 0.6, L[iL1].shape.cz);
  const cordPts = [top, ...canal.slice(0, iL1 + 1), conus];
  const sacCanal = (y) => sac.w(0, y, SAC.z((sac.H / 2 - y) / sac.H) - 0.105);
  const roots = [];
  const outer = { c: [[0.2, -0.1, 0.05], [0.48, -0.36, 0.1], [0.62, -0.72, 0.08]], t: [[0.24, -0.05, -0.03], [0.52, -0.14, 0.14], [0.7, -0.27, 0.42]], l: [[0.17, -0.22, 0.09], [0.33, -0.62, 0.2], [0.4, -1.05, 0.26]] };
  L.forEach((lv, i) => {
    if (!lv.shape.exit) return;
    const name = lv.reg === 'c' ? 'C' + (lv.n + 1) : lv.id;
    const [ex, ey, ez] = lv.shape.exit;
    for (const s of [1, -1]) {
      const pts = [];
      if (i > iL1) { // Cauda equina: vom Conus im Kanal abwärts
        const k = (i - iL1) * 0.012;
        pts.push(conus.clone());
        for (let j = iL1 + 1; j <= i; j++) pts.push(L[j].w(s * Math.min(k, L[j].cw * 0.55), 0.02, L[j].shape.cz - 0.01));
      } else pts.push(lv.w(s * 0.01, lv.H * 0.1, lv.shape.cz));
      pts.push(lv.w(s * ex * 0.55, ey + 0.035, lv.shape.cz + (ez - lv.shape.cz) * 0.5));
      pts.push(lv.w(s * ex, ey, ez));
      const sc = lv.reg === 't' ? 1 - (lv.n - 1) * 0.012 : 1;
      outer[lv.reg].forEach(([dx, dy, dz]) => pts.push(lv.w(s * (ex + dx * sc), ey + dy, ez + dz)));
      roots.push({ name, side: s, reg: lv.reg, pts, rad: lv.reg === 'l' ? 0.021 : lv.reg === 'c' ? 0.015 : 0.011, li: i });
    }
  });
  for (let i = 0; i < 4; i++) { // Sakralwurzeln durch die vorderen Löcher, sammeln sich zum Ischiasnerv
    const xf = SAC.xf(i), yf = SAC.yf(i, sac.H), zf = SAC.z((sac.H / 2 - yf) / sac.H);
    for (const s of [1, -1]) {
      const pts = [conus.clone()];
      for (let j = iL1 + 1; j < L.length - 2; j++) pts.push(L[j].w(s * Math.min(0.065 + i * 0.008, L[j].cw * 0.6), 0.02, L[j].shape.cz - 0.012));
      pts.push(sacCanal(sac.H / 2 - 0.05));
      if (i > 0) pts.push(sacCanal(yf + 0.16));
      pts.push(sac.w(s * xf * 0.8, yf + 0.03, zf - 0.07), sac.w(s * xf, yf, zf + 0.04), sac.w(s * (xf + 0.08), yf - 0.12, zf + 0.17),
        sac.w(s * (0.36 - i * 0.02), SAC.yf(3, sac.H) - 0.12 + (3 - i) * 0.05, 0.02 + i * 0.012), sac.w(s * (0.5 - i * 0.015), -sac.H / 2 - 0.25, -0.2));
      roots.push({ name: 'S' + (i + 1), side: s, reg: 's', pts, rad: 0.024 - i * 0.003, li: 99 });
    }
  }
  return { cordPts, roots, conus };
}

// Rohr mit veränderlichem Radius entlang einer Kurve
export function tube(curve, segs, radial, rfn) {
  const fr = curve.computeFrenetFrames(segs, false);
  const pos = new Float32Array((segs + 1) * (radial + 1) * 3), nor = new Float32Array(pos.length), idx = [];
  let k = 0;
  for (let i = 0; i <= segs; i++) {
    const p = curve.getPointAt(i / segs), N = fr.normals[i], B = fr.binormals[i], r = rfn(i / segs);
    for (let j = 0; j <= radial; j++) {
      const a = j / radial * Math.PI * 2, c = Math.cos(a), s = Math.sin(a);
      const nx = c * N.x + s * B.x, ny = c * N.y + s * B.y, nz = c * N.z + s * B.z;
      pos[k] = p.x + nx * r; pos[k + 1] = p.y + ny * r; pos[k + 2] = p.z + nz * r;
      nor[k] = nx; nor[k + 1] = ny; nor[k + 2] = nz; k += 3;
    }
  }
  for (let i = 0; i < segs; i++) for (let j = 0; j < radial; j++) {
    const a = i * (radial + 1) + j, b = a + radial + 1;
    idx.push(a, b, a + 1, b, b + 1, a + 1);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  g.setIndex(idx);
  return g;
}
