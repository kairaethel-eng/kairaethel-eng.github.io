// Geordnete Punkte auf echten Netzen (20.11.2026, Kai: „die reale Anatomie ziemlich perfekt“): wie raster.js, aber für Dreiecksnetze
// (echte Knochen aus BodyParts3D). Das Netz wird in parallele Scheiben geschnitten (Abstand sp · 0,866); jede Schnittlinie wird zu
// einem Zug verkettet und mit Punkten in gleichem Abstand belegt, jede zweite Scheibe um einen halben Abstand versetzt – so liegen die
// Punkte in Zeilen über der Oberfläche wie bei der Figur. Normale je Punkt aus den Ecken-Normalen (weich) → Kantenlicht.
// Ergebnis wie raster.js: { pts: [x, y, z, nx, ny, nz, w] …, tris: [x, y, z, nx, ny, nz] …, inside: null }.
//
// mesh = { pos: Float32Array (cm, x links, y oben, z vorn), idx: Uint32Array }
// o: M (3×3 als 9 Zahlen, zeilenweise) · t ([x, y, z], NACH der Drehung, vor dem Maßstab abgezogen wird c) · c (Bezugspunkt im Netz) ·
//    s (Maßstab) · axis 'x' | 'y' | 'z' (Achse, quer zu der geschnitten wird, im Ziel-Raum) · w(p) → Deckkraft (0 = Punkt entfällt) ·
//    keep(p, n) · clip(p) → false: Dreieck entfällt auch im Kern
export function xform(mesh, o = {}) {
  const M = o.M || [1, 0, 0, 0, 1, 0, 0, 0, 1], c = o.c || [0, 0, 0], t = o.t || [0, 0, 0], s = o.s || 1, P = mesh.pos, n = P.length / 3;
  const pos = new Float32Array(P.length);
  for (let i = 0; i < n; i++) {
    const x = P[i * 3] - c[0], y = P[i * 3 + 1] - c[1], z = P[i * 3 + 2] - c[2];
    pos[i * 3] = (M[0] * x + M[1] * y + M[2] * z) * s + t[0]; pos[i * 3 + 1] = (M[3] * x + M[4] * y + M[5] * z) * s + t[1]; pos[i * 3 + 2] = (M[6] * x + M[7] * y + M[8] * z) * s + t[2];
  }
  // Spiegelung (Determinante < 0) dreht den Umlaufsinn um
  const det = M[0] * (M[4] * M[8] - M[5] * M[7]) - M[1] * (M[3] * M[8] - M[5] * M[6]) + M[2] * (M[3] * M[7] - M[4] * M[6]);
  let idx = mesh.idx;
  if (det < 0) { idx = new Uint32Array(idx.length); for (let k = 0; k < idx.length; k += 3) { idx[k] = mesh.idx[k]; idx[k + 1] = mesh.idx[k + 2]; idx[k + 2] = mesh.idx[k + 1]; } }
  return { pos, idx };
}
// Ecken-Normalen (flächengewichtet)
function normals({ pos, idx }) {
  const N = new Float32Array(pos.length);
  for (let k = 0; k < idx.length; k += 3) {
    const a = idx[k] * 3, b = idx[k + 1] * 3, c = idx[k + 2] * 3;
    const ux = pos[b] - pos[a], uy = pos[b + 1] - pos[a + 1], uz = pos[b + 2] - pos[a + 2], vx = pos[c] - pos[a], vy = pos[c + 1] - pos[a + 1], vz = pos[c + 2] - pos[a + 2];
    const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
    for (const i of [a, b, c]) { N[i] += nx; N[i + 1] += ny; N[i + 2] += nz; }
  }
  for (let i = 0; i < N.length; i += 3) { const l = Math.hypot(N[i], N[i + 1], N[i + 2]) || 1; N[i] /= l; N[i + 1] /= l; N[i + 2] /= l; }
  return N;
}
export function rows(mesh0, sp, o = {}) {
  const mesh = o.M || o.t || o.s || o.c ? xform(mesh0, o) : mesh0, { pos, idx } = mesh, N = normals(mesh), nv = pos.length / 3;
  const a = 'xyz'.indexOf(o.axis || 'y'), dy = sp * 0.866;
  let lo = Infinity, hi = -Infinity;
  for (let i = a; i < pos.length; i += 3) { if (pos[i] < lo) lo = pos[i]; if (pos[i] > hi) hi = pos[i]; }
  const y0 = Math.floor(lo / dy) * dy + dy * 0.137, nR = Math.max(0, Math.ceil((hi - y0) / dy)); // Scheiben an festen Höhen (Nachbarteile passen zueinander), nie genau auf einer Ecke
  // je Scheibe: Strecken zwischen zwei Netz-Kanten (Schlüssel = Kante), danach verketten
  const slices = Array.from({ length: nR }, () => []);
  const tris = [];
  for (let k = 0; k < idx.length; k += 3) {
    const I = [idx[k], idx[k + 1], idx[k + 2]];
    if (o.clip) { const g = [0, 1, 2].map((c) => (pos[I[0] * 3 + c] + pos[I[1] * 3 + c] + pos[I[2] * 3 + c]) / 3); if (!o.clip(g)) continue; }
    for (const i of I) tris.push(pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2], N[i * 3], N[i * 3 + 1], N[i * 3 + 2]);
    const h = I.map((i) => pos[i * 3 + a]), mn = Math.min(h[0], h[1], h[2]), mx = Math.max(h[0], h[1], h[2]);
    for (let r = Math.max(0, Math.ceil((mn - y0) / dy)); r < nR; r++) {
      const y = y0 + r * dy; if (y > mx) break;
      const cut = [];
      for (let e = 0; e < 3; e++) {
        const p = I[e], q = I[(e + 1) % 3], hp = h[e], hq = h[(e + 1) % 3];
        if ((hp < y) === (hq < y)) continue;
        const f = (y - hp) / (hq - hp), key = p < q ? p * nv + q : q * nv + p;
        cut.push({ key, x: [0, 1, 2].map((c) => pos[p * 3 + c] + (pos[q * 3 + c] - pos[p * 3 + c]) * f), n: [0, 1, 2].map((c) => N[p * 3 + c] + (N[q * 3 + c] - N[p * 3 + c]) * f) });
      }
      if (cut.length === 2) slices[r].push(cut);
    }
  }
  const pts = [];
  slices.forEach((segs, r) => {
    if (!segs.length) return;
    // Nachbarschaft über die Kanten-Schlüssel
    const at = new Map();
    segs.forEach((s, i) => { for (const e of s) { const l = at.get(e.key); if (l) l.push(i); else at.set(e.key, [i]); } });
    const used = new Uint8Array(segs.length);
    for (let s0 = 0; s0 < segs.length; s0++) {
      if (used[s0]) continue;
      // Zug: von s0 aus in beide Richtungen laufen
      const walk = (start, endKey) => { const out = []; let cur = start, key = endKey; for (;;) { const l = at.get(key); let nx = -1; for (const i of l) if (i !== cur && !used[i]) { nx = i; break; } if (nx < 0) break; used[nx] = 1; const s = segs[nx], e = s[0].key === key ? s[1] : s[0]; out.push(e); key = e.key; cur = nx; } return out; };
      used[s0] = 1;
      const fw = walk(s0, segs[s0][1].key), closed = fw.length && fw[fw.length - 1].key === segs[s0][0].key;
      const bw = closed ? [] : walk(s0, segs[s0][0].key).reverse();
      const line = [...bw, segs[s0][0], segs[s0][1], ...fw];
      const L = [0]; for (let i = 1; i < line.length; i++) L.push(L[i - 1] + Math.hypot(line[i].x[0] - line[i - 1].x[0], line[i].x[1] - line[i - 1].x[1], line[i].x[2] - line[i - 1].x[2]));
      const total = L[L.length - 1]; if (total < sp * 0.5) continue;
      const cnt = Math.max(closed ? 3 : 1, Math.round(total / sp)), offs = r & 1 ? 0.5 : 0;
      let j = 1;
      for (let k = 0; k < (closed ? cnt : cnt + (offs ? 0 : 1)); k++) {
        const s = Math.min(total, ((k + offs) / cnt) * total);
        while (j < L.length - 1 && L[j] < s) j++;
        const f = (s - L[j - 1]) / Math.max(1e-9, L[j] - L[j - 1]), A = line[j - 1], B = line[j];
        const p = [0, 1, 2].map((c) => A.x[c] + (B.x[c] - A.x[c]) * f); let n = [0, 1, 2].map((c) => A.n[c] + (B.n[c] - A.n[c]) * f);
        const l = Math.hypot(n[0], n[1], n[2]) || 1; n = [n[0] / l, n[1] / l, n[2] / l];
        if (o.keep && !o.keep(p, n)) continue;
        const w = o.w ? o.w(p) : 1; if (w <= 0.01) continue;
        pts.push(p[0], p[1], p[2], n[0], n[1], n[2], w);
      }
    }
  });
  return { pts, tris, inside: null };
}
// Hilfen zum Einpassen: Kasten und Schwerpunkt eines Netzes (oder mehrerer)
export function bounds(...meshes) {
  const lo = [1e9, 1e9, 1e9], hi = [-1e9, -1e9, -1e9];
  for (const m of meshes) for (let i = 0; i < m.pos.length; i++) { const c = i % 3, v = m.pos[i]; if (v < lo[c]) lo[c] = v; if (v > hi[c]) hi[c] = v; }
  return { lo, hi, mid: [0, 1, 2].map((c) => (lo[c] + hi[c]) / 2), size: [0, 1, 2].map((c) => hi[c] - lo[c]) };
}
// Hauptachsen der Ecken eines Netzes (längste zuerst) – z. B. Hand: [Fingerrichtung, Breite, Flächen-Normale]
export function achsen(m) {
  const n = m.pos.length / 3, c = [0, 0, 0];
  for (let i = 0; i < m.pos.length; i++) c[i % 3] += m.pos[i] / n;
  const C = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
  for (let i = 0; i < m.pos.length; i += 3) { const d = [m.pos[i] - c[0], m.pos[i + 1] - c[1], m.pos[i + 2] - c[2]]; for (let a = 0; a < 3; a++) for (let b = 0; b < 3; b++) C[a][b] += d[a] * d[b] / n; }
  // Jacobi-Drehungen (symmetrische 3×3-Matrix)
  const Vv = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
  for (let it = 0; it < 30; it++) for (const [p, q] of [[0, 1], [0, 2], [1, 2]]) {
    if (Math.abs(C[p][q]) < 1e-12) continue;
    const th = 0.5 * Math.atan2(2 * C[p][q], C[q][q] - C[p][p]), cs = Math.cos(th), sn = Math.sin(th);
    for (let k = 0; k < 3; k++) { const a = C[k][p], b = C[k][q]; C[k][p] = cs * a - sn * b; C[k][q] = sn * a + cs * b; }
    for (let k = 0; k < 3; k++) { const a = C[p][k], b = C[q][k]; C[p][k] = cs * a - sn * b; C[q][k] = sn * a + cs * b; }
    for (let k = 0; k < 3; k++) { const a = Vv[k][p], b = Vv[k][q]; Vv[k][p] = cs * a - sn * b; Vv[k][q] = sn * a + cs * b; }
  }
  return [0, 1, 2].map((j) => ({ l: C[j][j], v: [Vv[0][j], Vv[1][j], Vv[2][j]] })).sort((a, b) => b.l - a.l).map((e) => e.v).concat([c]);
}
