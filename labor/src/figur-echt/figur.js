// Entwurf „Echte Figur“ (23.11.2026, Go Kai „Empfehlung“ = Vorschlag 1 „Anatomisch echt“ A1–A5 + aus Vorschlag 2 B1, B2, B4).
// Punktwolke aus den echten Netzen (assets/figur-echt.bin, tools/figur-echt.mjs) – gleiche Ordnung wie die Figur heute:
//   Zeilen quer über die Oberfläche (Scheiben in gleicher Höhe), gleicher Abstand auf der Oberfläche, jede zweite Zeile versetzt,
//   jeder vierte Punkt gehört zum groben Raster (Übersicht), je Punkt die Normale für das Kantenlicht. Kein Zufall in der Lage.
// Arten je Punkt (nfo.x): 0 Haut (nfo.y = im Kopf, nfo.z = grobes Raster) · 2 Gehirn (nfo.y = Spitzenhöhe, ab der es erscheint, nfo.w = Helligkeit) ·
//   3 Nerv (nfo.y = Spitzenhöhe, nfo.z = Weg vom Gehirn, nfo.w = Dicke) · 4 Raum · 5 Knochen (nfo.z = grobes Raster, nfo.w = Teil: 1 Rippen/Hände dezenter, 2 Schädel – tritt hinter das Gehirn zurück) ·
//   6 Muskel (Spannung der Station; nfo.y = Station)
// Koordinaten: Grundriss 200 × 430, Lage je Punkt um die Körpermitte, y nach oben, z zum Betrachter (wie ../feinschliff/figur.js).
import { STATIONS, stationHeat, BODY_W, BODY_H, CROWN, SOLE } from '../figur-plus/figur.js';

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
function rng(seed) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

// Ecken-Normalen (flächengewichtet)
function normals(pos, idx) {
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
// Zeilen über ein Netz (wie ../shared/netz.js rows, Scheiben quer zur Höhe y) – zusätzlich je Punkt Zeile r und Stelle k (grobes Raster).
// fn(x, y, z, nx, ny, nz, coarse)
function rows({ pos, idx }, sp, fn) {
  const N = normals(pos, idx), nv = pos.length / 3, dy = sp * 0.866;
  let lo = Infinity, hi = -Infinity;
  for (let i = 1; i < pos.length; i += 3) { if (pos[i] < lo) lo = pos[i]; if (pos[i] > hi) hi = pos[i]; }
  const y0 = Math.floor(lo / dy) * dy + dy * 0.137, nR = Math.max(0, Math.ceil((hi - y0) / dy));
  const slices = Array.from({ length: nR }, () => []);
  for (let k = 0; k < idx.length; k += 3) {
    const I = [idx[k], idx[k + 1], idx[k + 2]], h = I.map((i) => pos[i * 3 + 1]), mn = Math.min(h[0], h[1], h[2]), mx = Math.max(h[0], h[1], h[2]);
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
  slices.forEach((segs, r) => {
    if (!segs.length) return;
    const yAbs = Math.round((y0 + r * dy) / dy); // Zeilennummer unabhängig vom Teil (Nachbarteile versetzen gleich)
    const at = new Map();
    segs.forEach((s, i) => { for (const e of s) { const l = at.get(e.key); if (l) l.push(i); else at.set(e.key, [i]); } });
    const used = new Uint8Array(segs.length);
    for (let s0 = 0; s0 < segs.length; s0++) {
      if (used[s0]) continue;
      const walk = (start, endKey) => { const out = []; let cur = start, key = endKey; for (;;) { const l = at.get(key); let nx = -1; for (const i of l) if (i !== cur && !used[i]) { nx = i; break; } if (nx < 0) break; used[nx] = 1; const s = segs[nx], e = s[0].key === key ? s[1] : s[0]; out.push(e); key = e.key; cur = nx; } return out; };
      used[s0] = 1;
      const fw = walk(s0, segs[s0][1].key), closed = fw.length && fw[fw.length - 1].key === segs[s0][0].key;
      const bw = closed ? [] : walk(s0, segs[s0][0].key).reverse();
      const line = [...bw, segs[s0][0], segs[s0][1], ...fw];
      const L = [0]; for (let i = 1; i < line.length; i++) L.push(L[i - 1] + Math.hypot(line[i].x[0] - line[i - 1].x[0], line[i].x[1] - line[i - 1].x[1], line[i].x[2] - line[i - 1].x[2]));
      const total = L[L.length - 1]; if (total < sp * 0.5) continue;
      const cnt = Math.max(closed ? 3 : 1, Math.round(total / sp)), offs = yAbs & 1 ? 0.5 : 0;
      let j = 1;
      for (let k = 0; k < (closed ? cnt : cnt + (offs ? 0 : 1)); k++) {
        const s = Math.min(total, ((k + offs) / cnt) * total);
        while (j < L.length - 1 && L[j] < s) j++;
        const f = (s - L[j - 1]) / Math.max(1e-9, L[j] - L[j - 1]), A = line[j - 1], B = line[j];
        const p = [0, 1, 2].map((c) => A.x[c] + (B.x[c] - A.x[c]) * f); let n = [0, 1, 2].map((c) => A.n[c] + (B.n[c] - A.n[c]) * f);
        const l = Math.hypot(n[0], n[1], n[2]) || 1; n = [n[0] / l, n[1] / l, n[2] / l];
        fn(p[0], p[1], p[2], n[0], n[1], n[2], (yAbs & 1) === 0 && ((k & 1) === 0) === ((yAbs & 2) === 0));
      }
    }
  });
}

// Nervenbahnen aus der Datei (3D, Grundriss) → wie NERVE_LIST in ../figur-plus/figur.js: ry0 (Spitzenhöhe am Anfang), rate, d0 (Weg vom Gehirn)
function nerveList(list) {
  const out = list.map((n) => {
    const pts = n.pts, len = [0];
    for (let i = 1; i < pts.length; i++) len.push(len[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1], pts[i][2] - pts[i - 1][2]));
    return { ...n, len, total: len[len.length - 1], by: pts.map((p) => BODY_H / 2 - p[1]) };
  });
  out.forEach((n, i) => {
    if (n.main) {
      // Weg vom Gehirn: Rückenmark (0) 0, Endfaden (1) = Länge des Rückenmarks, Beine (beginnen am Ende des Endfadens) = beide zusammen
      n.ry0 = n.by[0]; n.rate = 0;
      n.d0 = i === 0 ? 0 : i === 1 ? out[0].total : out[0].total + out[1].total;
      return;
    }
    const P = out[n.parent], a = n.pts[0];
    let best = 0, bd = 1e9;
    P.pts.forEach((p, k) => { const d = Math.hypot(p[0] - a[0], p[1] - a[1], p[2] - a[2]); if (d < bd) { bd = d; best = k; } });
    n.ry0 = P.main ? P.by[best] : P.ry0 + P.len[best] * P.rate;
    n.d0 = P.d0 + P.len[best];
    n.rate = Math.min(1, (SOLE - 6 - n.ry0) / Math.max(1, n.total));
  });
  return out;
}
// Bahn des Leuchtpunkts (SVG) im Grundriss: Mitte (Scheitel → Teilung), dann je Bein die Hauptbahn – y steigt überall
export function linesOf(nerves, split) {
  const legs = nerves.filter((n) => n.main && n.pts[0][0] === 0 && Math.abs(n.by[0] - split) < 0.6);
  return [[[100, CROWN], [100, split]], ...legs.slice(0, 2).map((n) => n.pts.map((p) => [p[0] + BODY_W / 2, BODY_H / 2 - p[1]]))];
}

// sp = Abstand der Haut-Punkte (Grundriss-Einheiten), dust = Zahl der großen unscharfen Punkte im Raum, data = decode(…)
export function echtPoints({ sp = 1.6, dust = 26, data, detail = false }) {
  const Pp = [], Nn = [], St = [], Ht = [], Ct = [], Nf = [];
  const put = (x, y, z, nx, ny, nz, kind, a, b, c, heat = null) => {
    Pp.push(x, y, z); Nn.push(nx, ny, nz); Nf.push(kind, a, b, c);
    St.push(heat ? heat.st : -1); Ht.push(heat ? heat.h : 0); Ct.push(heat ? heat.cx : 0, heat ? heat.cy : 0);
  };
  const part = (id) => data.parts.find((p) => p.id === id);
  const skinHeat = (x, y) => {
    const h = stationHeat(x + BODY_W / 2, BODY_H / 2 - y); if (h.st < 0) return null;
    // Nacken und Hüfte: die Spannung sitzt im echten Muskel (Art 6), die Haut glimmt nur mit
    const k = h.st === 1 || h.st === 2 ? 0.32 : 1;
    return { st: h.st, h: h.h * k, cx: h.sp[0] - BODY_W / 2, cy: BODY_H / 2 - h.sp[1] };
  };
  // A1 Haut: nur die vordere und seitliche Fläche (die Figur dreht sich höchstens ±7°), Kopf markiert (dort zeigt sich das Gehirn)
  const skin = part('haut/koerper');
  const fein = (x, by) => by > 390 || (Math.abs(x) > 47 && by > 196);
  rows(skin, sp, (x, y, z, nx, ny, nz, coarse) => {
    if (nz < -0.42) return;
    const by = BODY_H / 2 - y, head = by < 64 && Math.abs(x) < 34 ? 1 : 0;
    put(x, y, z, nx, ny, nz, 0, head, coarse ? 1 : 0, fein(x, by) ? 2 : 0, skinHeat(x, y));
  });
  // Hände und Füße feiner (Fassung J, 25.11.2026, Kai: „Füße, Hände … detaillierter“): ein zweites, engeres Raster nur dort (Kennung 1);
  // die Punkte des normalen Rasters in diesen Bereichen tragen Kennung 2 und treten zurück, sobald das feine gezeigt wird (uDense)
  if (detail) rows(skin, sp * 0.56, (x, y, z, nx, ny, nz) => {
    if (nz < -0.42) return;
    if (!fein(x, BODY_H / 2 - y)) return;
    put(x, y, z, nx, ny, nz, 0, 0, 0, 1, skinHeat(x, y));
  });
  const nBody = St.length;
  // A3 Knochen: etwas weiter als die Haut, Rückseiten weg (wie die Haut)
  const spB = clamp(sp * 0.95, 1.1, 2.4);
  for (const p of data.parts.filter((q) => q.kind === 'bone')) {
    const soft = p.id === 'knochen/schaedel' ? 2 : p.id === 'knochen/rippen' || p.id === 'knochen/hand' ? 1 : 0;
    rows(p, spB, (x, y, z, nx, ny, nz, coarse) => { if (nz < -0.35) return; put(x, y, z, nx, ny, nz, 5, 0, coarse ? 1 : 0, soft); });
  }
  // A2 Gehirn: Großhirn mit echten Windungen, Kleinhirn, Hirnstamm – erscheint mit der Lichtspitze von oben nach unten
  // (Innenwände an der Mittelspalte entfallen – sie lägen von vorn gesehen als helle Naht über der Mitte)
  const spBr = clamp(sp * 0.42, 0.62, 0.95);
  for (const p of data.parts.filter((q) => q.kind === 'brain')) {
    const w = p.id === 'gehirn/grosshirn' ? 0.7 : p.id === 'gehirn/kleinhirn' ? 0.55 : 0.45;
    rows(p, spBr, (x, y, z, nx, ny, nz) => {
      if (nz < -0.2) return;
      if (p.id === 'gehirn/grosshirn' && Math.abs(x) < 4.5 && Math.abs(nx) > 0.6) return;
      const by = BODY_H / 2 - y; put(x, y, z, nx, ny, nz, 2, CROWN + (by - CROWN) * 0.72, 0, w);
    });
  }
  // A4 Muskeln der Stationen: Spannung sitzt im Muskel (Nacken: Trapezius absteigend + Levator scapulae; Hüfte: Gluteus medius, Piriformis, Psoas)
  const spM = clamp(sp * 0.8, 0.9, 2);
  for (const p of data.parts.filter((q) => q.kind === 'muscle')) {
    const S = STATIONS[p.st], mid = [[], []];
    const tmp = [];
    rows(p, spM, (x, y, z, nx, ny, nz) => { tmp.push([x, y, z, nx, ny, nz]); mid[x > 0 ? 1 : 0].push([x, y]); });
    const c = mid.map((l) => l.reduce((a, q) => [a[0] + q[0] / l.length, a[1] + q[1] / l.length], [0, 0]));
    // Spannung nur innerhalb des Rings der Station (am Rand auslaufend) – was darüber hinausreicht (oberer Psoas), bleibt ruhig;
    // sonst ließe sich die Stelle mit Maus/Finger nie ganz lösen (gemessen wird nur, was im Ring liegt)
    const sx = S.c[0] - BODY_W / 2, sy = BODY_H / 2 - S.c[1];
    for (const [x, y, z, nx, ny, nz] of tmp) {
      const d = Math.hypot(x - sx, y - sy), h = 0.92 * clamp((S.r * 1.02 - d) / (S.r * 0.3));
      put(x, y, z, nx, ny, nz, 6, p.st, 0, 1, { st: p.st, h, cx: c[x > 0 ? 1 : 0][0], cy: c[x > 0 ? 1 : 0][1] });
    }
  }
  // A5 Nerven: Perlen entlang der echten Wege; dicke Bahnen als mehrere Stränge nebeneinander (in der Bildebene versetzt)
  const nerves = nerveList(data.head.nerves);
  const NS = 0.62, GAP = 0.52;
  for (const N of nerves) {
    const K = Math.max(1, Math.round(2 * N.r / GAP));
    for (let k = 0; k < K; k++) {
      const o = (k - (K - 1) / 2) * GAP, n = Math.max(1, Math.round(N.total / NS)), d = N.total / n;
      let j = 1;
      for (let q = k & 1 ? 0.5 : 0; q <= n; q++) {
        const s = Math.min(N.total, q * d);
        while (j < N.len.length - 1 && N.len[j] < s) j++;
        const A = N.pts[j - 1], B = N.pts[j], f = (s - N.len[j - 1]) / Math.max(1e-9, N.len[j] - N.len[j - 1]);
        const x = A[0] + (B[0] - A[0]) * f, y = A[1] + (B[1] - A[1]) * f, z = A[2] + (B[2] - A[2]) * f;
        const tx = B[0] - A[0], ty = B[1] - A[1], tl = Math.hypot(tx, ty) || 1;
        // Rückenmark: zum Ende (Kegel) schmaler
        const rr = N.main && N.r > 1.2 ? N.r * (1 - 0.7 * clamp((s / N.total - 0.88) / 0.12)) : N.r;
        if (K > 1 && Math.abs(o) > rr - 0.1) continue;
        const by = BODY_H / 2 - y;
        put(x - ty / tl * o, y + tx / tl * o, z, 0, 0, 0, 3, N.main ? by : N.ry0 + s * N.rate, N.d0 + s, N.w);
      }
    }
  }
  // Raum: wenige große, unscharfe Punkte vor und hinter der Figur
  const rd = rng(424242);
  for (let k = 0; k < dust; k++) { Pp.push(rd(), rd(), 0); Nn.push(0, 0, 1); Nf.push(4, 0.25 + rd() * 0.75, rd(), 0.35 + rd() * 0.65); St.push(-1); Ht.push(0); Ct.push(0, 0); }

  // Boden (Vergleich Startfigur 25.11.2026, sichtbar nur mit ?start=c|d): geordnete Ringe in der Ebene der Sohlen, nach außen leiser
  { const gy = BODY_H / 2 - 419, R0 = 96, dg = sp * 1.9;
    for (let j = 0; (j + 0.5) * dg < R0; j++) {
      const r = (j + 0.5) * dg, n = Math.max(6, Math.round(2 * Math.PI * r / dg)), fade = Math.pow(1 - r / R0, 1.2) * 0.95;
      for (let k = 0; k < n; k++) { const a = (k + (j & 1 ? 0.5 : 0)) / n * Math.PI * 2; Pp.push(Math.cos(a) * r, gy, Math.sin(a) * r); Nn.push(0, 0, 0); Nf.push(7, fade, j % 4 === 0 ? 1 : 0, 0); St.push(-1); Ht.push(0); Ct.push(0, 0); }
    }
  }
  const count = St.length, rnd = new Float32Array(count * 4), rr = rng(77);
  for (let k = 0; k < rnd.length; k++) rnd[k] = rr();
  const split = data.head.split;
  return { pos: new Float32Array(Pp), nrm: new Float32Array(Nn), st: new Float32Array(St), heat: new Float32Array(Ht), ctr: new Float32Array(Ct), rnd, nfo: new Float32Array(Nf), count, nBody, spB, lines: linesOf(nerves, split), split };
}
