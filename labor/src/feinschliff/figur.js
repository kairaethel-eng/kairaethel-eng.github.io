// Studie „Feinschliff“ (17.11.2026, Go Kai: „alle deine besten Empfehlungen“): dieselbe Figur wie „Figur plus“
// (Umriss, Körperlinien, Gehirn, Nervenbahnen, Stationen kommen unverändert aus ../figur-plus/figur.js) – neu ist nur,
// WIE sie mit Punkten besetzt wird: geordnet statt gewürfelt.
//   Körper   = Zeilen quer über die gewölbte Oberfläche, in jeder Zeile gleicher Abstand auf der Oberfläche gemessen
//              (zum Rand hin rücken die Punkte im Bild zusammen → der Körper wirkt rund), jede zweite Zeile versetzt.
//   Kontur, Körperlinien, Nerven = Perlen in gleichem Abstand entlang der Linie; dicke Nerven = mehrere Stränge nebeneinander.
//   Gehirn   = Perlen entlang der Furchen (beide Ufer) + gleichmäßig gefüllte Windungen (Mindestabstand), Kleinhirn in Blättern.
// Je Punkt zusätzlich die Flächen-Normale (nrm) für das Kantenlicht im Shader (gl.js).
// Koordinaten wie überall: Grundriss 200 × 430, Lage je Punkt um die Körpermitte, y nach oben.
import { OUTLINE, CREASES, HEMI_R, CEREB, brainParts, inPoly, NERVE_LIST, stationHeat, inBrain, BODY_W, BODY_H, CROWN, SOLE } from '../figur-plus/figur.js';

export { STATIONS, LINES, lineTo, BODY_SVG, CROWN, SOLE, SPLIT, BODY_W, BODY_H, nerveSvg, brainSvg } from '../figur-plus/figur.js';

const CX = 100;
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const sstep = (a, b, v) => { const t = clamp((v - a) / (b - a)); return t * t * (3 - 2 * t); };
function rng(seed) { // fester Zufall: gleiche Figur bei jedem Laden
  let a = seed >>> 0;
  return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
function measured(pts) {
  const len = [0];
  for (let i = 1; i < pts.length; i++) len.push(len[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  return { pts, len, total: len[len.length - 1] };
}
function atLen(m, s) { // Punkt + Richtung an der Länge s
  const { pts, len } = m;
  let lo = 0, hi = len.length - 1;
  while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (len[mid] <= s) lo = mid; else hi = mid; }
  const t = clamp((s - len[lo]) / Math.max(1e-6, len[hi] - len[lo]));
  const a = pts[lo], b = pts[hi];
  return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), b[0] - a[0], b[1] - a[1]];
}
// Perlen in gleichem Abstand entlang einer Linie (Abstand wird so gerundet, dass Anfang und Ende besetzt sind)
function beads(m, step, fn, half = false) {
  const n = Math.max(1, Math.round(m.total / step)), d = m.total / n;
  for (let k = half ? 0.5 : 0; k <= n; k++) fn(atLen(m, Math.min(m.total, k * d)), k * d);
}
// Raster für den Mindestabstand
function spacer(cell) {
  const g = new Map(), key = (x, y) => Math.floor(x / cell) * 4096 + Math.floor(y / cell);
  return {
    free(x, y, d) {
      const gx = Math.floor(x / cell), gy = Math.floor(y / cell), n = Math.ceil(d / cell);
      for (let i = -n; i <= n; i++) for (let j = -n; j <= n; j++) {
        const l = g.get((gx + i) * 4096 + gy + j); if (!l) continue;
        for (let k = 0; k < l.length; k += 2) if (Math.hypot(l[k] - x, l[k + 1] - y) < d) return false;
      }
      return true;
    },
    add(x, y) { const k = key(x, y); (g.get(k) || g.set(k, []).get(k)).push(x, y); },
  };
}

// ---------- gewölbte Oberfläche aus dem Umriss ----------
// Höhe Z über der Bildebene: aus dem Abstand zum Rand (D) und der örtlichen Dicke (R = halbe Breite des Körperteils):
// Z = 0,9 · √(D · (2R − D)) – fast ein Zylinder; an allen Rändern (auch Scheitel, Sohlen, Fingerspitzen) läuft Z auf 0.
function surface() {
  const S = 2, W = BODY_W * S, H = BODY_H * S, N = W * H;
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const ctx = cv.getContext('2d', { willReadFrequently: true });
  ctx.scale(S, S); ctx.fillStyle = '#fff'; ctx.beginPath();
  OUTLINE.forEach((p, k) => (k ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); ctx.closePath(); ctx.fill();
  const data = ctx.getImageData(0, 0, W, H).data;
  const mask = new Uint8Array(N);
  for (let k = 0; k < N; k++) mask[k] = data[k * 4 + 3] > 128 ? 1 : 0;
  // Abstand zum Rand (Fasen-Abstand 1 / √2, zwei Durchgänge), in Masken-Bildpunkten
  const D = new Float32Array(N), Q = Math.SQRT2;
  for (let k = 0; k < N; k++) D[k] = mask[k] ? 1e6 : 0;
  for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) { const o = y * W + x; if (D[o]) D[o] = Math.min(D[o], D[o - 1] + 1, D[o - W] + 1, D[o - W - 1] + Q, D[o - W + 1] + Q); }
  for (let y = H - 2; y > 0; y--) for (let x = W - 2; x > 0; x--) { const o = y * W + x; if (D[o]) D[o] = Math.min(D[o], D[o + 1] + 1, D[o + W] + 1, D[o + W + 1] + Q, D[o + W - 1] + Q); }
  // örtliche Dicke: größter Randabstand in der waagrechten und in der senkrechten Strecke durch den Punkt, davon der kleinere
  // (Arm am Rumpf: waagrecht zählt der Rumpf mit, senkrecht nur der Arm → der Arm bleibt ein schlanker Zylinder)
  const R = new Float32Array(N).fill(1e6);
  const runs = (len, at) => { for (let i = 0; i < len; i++) { if (!mask[at(i)]) continue; let j = i, m = 0; while (j < len && mask[at(j)]) { m = Math.max(m, D[at(j)]); j++; } for (let k = i; k < j; k++) R[at(k)] = Math.min(R[at(k)], m); i = j; } };
  for (let y = 0; y < H; y++) runs(W, (i) => y * W + i);
  for (let x = 0; x < W; x++) runs(H, (i) => i * W + x);
  const blur = (A, r, inMask) => { // Kastenfilter, wahlweise nur über Punkte im Körper gemittelt
    const T = new Float32Array(N);
    for (const [dx, dy] of [[1, 0], [0, 1]]) {
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        const o = y * W + x; if (inMask && !mask[o]) { T[o] = A[o]; continue; }
        let s = 0, n = 0;
        for (let k = -r; k <= r; k++) { const xx = x + dx * k, yy = y + dy * k; if (xx < 0 || yy < 0 || xx >= W || yy >= H) continue; const q = yy * W + xx; if (inMask && !mask[q]) continue; s += A[q]; n++; }
        T[o] = n ? s / n : 0;
      }
      A.set(T);
    }
  };
  blur(R, 3, true); blur(R, 3, true);
  const Z = new Float32Array(N);
  for (let k = 0; k < N; k++) { if (!mask[k]) continue; const r = Math.max(R[k], 1), d = Math.min(Math.max(0, D[k] - 0.5), r); Z[k] = 0.9 * Math.sqrt(d * (2 * r - d)) / S; }
  blur(Z, 1, false);
  const zAt = (bx, by) => { // bilinear, Grundriss-Einheiten
    const fx = clamp(bx * S - 0.5, 0, W - 1.001), fy = clamp(by * S - 0.5, 0, H - 1.001), x = fx | 0, y = fy | 0, u = fx - x, v = fy - y, o = y * W + x;
    return lerp(lerp(Z[o], Z[o + 1], u), lerp(Z[o + W], Z[o + W + 1], u), v);
  };
  const nrmAt = (bx, by) => { // Normale (x nach rechts, y nach oben, z zum Betrachter)
    const e = 0.5, gx = (zAt(bx + e, by) - zAt(bx - e, by)) / (2 * e), gy = (zAt(bx, by + e) - zAt(bx, by - e)) / (2 * e), l = Math.hypot(gx, gy, 1);
    return [-gx / l, gy / l, 1 / l];
  };
  return { S, W, H, mask, zAt, nrmAt };
}

// ---------- Punktwolke ----------
// sp = Abstand der Körper-Punkte auf der Oberfläche (Grundriss-Einheiten); dust = Zahl der großen, unscharfen Punkte im Raum
// Art je Punkt (nfo.x): 0 Körper (nfo.y = liegt im Gehirn, nfo.z = gehört zum groben Raster, nfo.w = Randnähe) · 1 Kontur/Körperlinie (nfo.w = Helligkeit) ·
// 2 Gehirn (nfo.y = Spitzenhöhe, ab der es leuchtet, nfo.w = Rang: Rand/Ufer hell, Füllung ruhig) ·
// 3 Nerv (nfo.y = Spitzenhöhe, nfo.z = Weg vom Gehirn, nfo.w = Dicke) · 4 Raum (Lage 0…1 im Bild, nfo.y = Tiefe, nfo.w = Größe)
export function finePoints({ sp = 1.6, dust = 26 } = {}) {
  const P = [], Nn = [], St = [], Ht = [], Ct = [], Nf = [];
  const put = (bx, by, z, n, kind, a, b, c, tension = false) => {
    P.push(bx - BODY_W / 2, BODY_H / 2 - by, z); Nn.push(n[0], n[1], n[2]); Nf.push(kind, a, b, c);
    const h = tension ? stationHeat(bx, by) : null;
    St.push(h ? h.st : -1); Ht.push(h ? h.h : 0);
    Ct.push(h && h.sp ? h.sp[0] - BODY_W / 2 : 0, h && h.sp ? BODY_H / 2 - h.sp[1] : 0);
  };
  const F = surface(), { S, W, mask, zAt, nrmAt } = F;

  // Körper: Zeile für Zeile; in jeder Strecke gleicher Abstand auf der Oberfläche, von der Mitte der Strecke aus gezählt
  // (links und rechts gleich), jede zweite Zeile um einen halben Abstand versetzt.
  // Jeder vierte Punkt (jede zweite Zeile, darin jeder zweite) bildet das „grobe Raster“ mit doppeltem Abstand: in der Übersicht
  // zeigt der Shader nur dieses, beim Heranfahren kommen die Punkte dazwischen dazu (das Raster verdichtet sich).
  const dy = sp * 0.866, h = 0.2, m = sp * 0.34;
  for (let j = 0, y = CROWN + 0.2; y < SOLE; j++, y += dy) {
    const row = Math.round(y * S - 0.5) * W;
    for (let x = 0; x < W; x++) {
      if (!mask[row + x]) continue;
      let r = x; while (r + 1 < W && mask[row + r + 1]) r++;
      const x0 = x / S, x1 = (r + 1) / S, n = Math.max(1, Math.ceil((x1 - x0) / h)), st = (x1 - x0) / n;
      const L = new Float32Array(n + 1); let zp = zAt(x0, y);
      for (let k = 1; k <= n; k++) { const z = zAt(x0 + k * st, y); L[k] = L[k - 1] + Math.hypot(st, z - zp); zp = z; }
      const total = L[n], off = j & 1 ? 0.5 : 0;
      let k = 1;
      for (let i = Math.ceil((m - total / 2) / sp - off); ; i++) {
        const s = total / 2 + (i + off) * sp; if (s > total - m) break; if (s < m) continue;
        while (k < n && L[k] < s) k++;
        const bx = x0 + (k - 1 + (s - L[k - 1]) / Math.max(1e-6, L[k] - L[k - 1])) * st, nr = nrmAt(bx, y);
        const coarse = (j & 1) === 0 && ((i & 1) === 0) === ((j & 2) === 0);
        const skull = inBrain(bx, y) || (Math.abs(bx - CX) < 1.5 && y > 13 && y < 45); // auch der Spalt zwischen den Hirnhälften
        put(bx, y, zAt(bx, y), nr, 0, skull ? 1 : 0, coarse ? 1 : 0, 1 - nr[2], true);
      }
      x = r;
    }
  }
  const nBody = St.length;
  // Kontur: Perlen genau auf dem Umriss
  const EDGE = [0, 0, 0];
  beads(measured(OUTLINE.concat([OUTLINE[0]])), Math.max(0.6, sp * 0.5), (p) => put(p[0], p[1], 0, EDGE, 1, 0, 0, 1, true));
  // Körperlinien: Perlen auf der Oberfläche, zu den Enden hin auslaufend
  CREASES.forEach((c) => beads(c, Math.max(0.66, sp * 0.55), (p, s) => {
    const e = Math.min(s, c.total - s) / c.total;
    put(p[0], p[1], zAt(p[0], p[1]), [0, 0, 1], 1, 0, 0, c.w * (0.55 + 0.45 * sstep(0, 0.16, e)));
  }));

  // Gehirn (rechte Hälfte gerechnet, links gespiegelt mit eigenen Furchen)
  const B = brainParts(), UP = [0, 0, 1], BS = 0.42;
  const dome = (x, y) => Math.sqrt(Math.max(0, 1 - ((x - CX) / 16.4) ** 2 - ((y - 28) / 15.4) ** 2)) * 4;
  const ryB = (x, y) => CROWN + 1.5 + Math.hypot(x - CX, (y - 13) * 0.9) / 31 * 20;
  const brainPut = (x, y, sgn, w, late = 0) => { const X = CX + sgn * (x - CX); put(X, y, dome(X, y), UP, 2, ryB(X, y) + late, 0, w); };
  [[B.r, 1, 20261117], [B.l, -1, 9173]].forEach(([half, sgn, seed]) => {
    const g = spacer(0.5), r = rng(seed);
    const take = (x, y, d, w) => { if (!g.free(x, y, d)) return; g.add(x, y); brainPut(x, y, sgn, w); };
    beads(measured(HEMI_R.concat([HEMI_R[0]])), 0.4, (p) => take(p[0], p[1], 0.3, 0.95));      // Rand der Hälfte
    half.lines.forEach((line) => {                                                                 // Ufer der Furchen
      const ml = measured(line);
      for (const side of [1, -1]) beads(ml, BS, (p) => {
        const l = Math.hypot(p[2], p[3]) || 1, x = p[0] - p[3] / l * 0.36 * side, y = p[1] + p[2] / l * 0.36 * side;
        if (inPoly(HEMI_R, x, y) && half.dist(x, y) > 0.27) take(x, y, 0.33, 0.8);
      }, side < 0);
    });
    for (let t = 0; t < 16000; t++) {                                                              // Windungen gleichmäßig füllen
      const x = 100.7 + r() * 15.4, y = 13.2 + r() * 28.6;
      if (inPoly(HEMI_R, x, y) && half.dist(x, y) > 0.5) take(x, y, BS, 0.42);
    }
    for (let k = 0, y = CEREB.c[1] - CEREB.ry + 0.3; y < CEREB.c[1] + CEREB.ry; k++, y += 0.6) {   // Kleinhirn: feine Blätter
      for (let x = CEREB.c[0] - CEREB.rx + (k & 1 ? 0.21 : 0); x < CEREB.c[0] + CEREB.rx; x += BS) {
        const ex = (x - CEREB.c[0]) / CEREB.rx, ey = (y - CEREB.c[1]) / CEREB.ry;
        if (ex * ex + ey * ey < 1 && !inPoly(HEMI_R, x, y) && x > 101.2) brainPut(x, y + 0.08 * (x - CX), sgn, 0.6, 3);
      }
    }
  });

  // Nerven: Perlen entlang der Bahn; dicke Bahnen als mehrere Stränge nebeneinander (Rückenmark 5, Ischias 4, Armnerven 2, Äste 1)
  const NS = 0.62, GAP = 0.52;
  NERVE_LIST.forEach((N) => {
    const rOf = (y) => (typeof N.r === 'number' ? N.r : N.r(y)), rmax = typeof N.r === 'number' ? N.r : 2.4;
    const K = Math.max(1, Math.round(2 * rmax / GAP));
    for (let k = 0; k < K; k++) {
      const o = (k - (K - 1) / 2) * GAP;
      beads(N, NS, (p, s) => {
        if (K > 1 && Math.abs(o) > rOf(p[1]) - 0.12) return;
        const l = Math.hypot(p[2], p[3]) || 1;
        put(p[0] - p[3] / l * o, p[1] + p[2] / l * o, 0, UP, 3, N.main ? p[1] : N.ry0 + s * N.rate, N.d0 + s, N.w);
      }, (k & 1) === 1);
    }
  });

  // Raum: wenige große, unscharfe Punkte vor und hinter der Figur (Tiefe)
  const rd = rng(424242);
  for (let k = 0; k < dust; k++) { P.push(rd(), rd(), 0); Nn.push(0, 0, 1); Nf.push(4, 0.25 + rd() * 0.75, rd(), 0.35 + rd() * 0.65); St.push(-1); Ht.push(0); Ct.push(0, 0); }

  const count = St.length, rnd = new Float32Array(count * 4), rr = rng(77);
  for (let k = 0; k < rnd.length; k++) rnd[k] = rr();
  return { pos: new Float32Array(P), nrm: new Float32Array(Nn), st: new Float32Array(St), heat: new Float32Array(Ht), ctr: new Float32Array(Ct), rnd, nfo: new Float32Array(Nf), count, nBody };
}
