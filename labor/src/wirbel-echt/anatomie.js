// Auftrag W (14.11.2026): echte Wirbelsäule (BodyParts3D 4.0) → dieselben Kenngrößen, die Puls aus der gerechneten
// Wirbelsäule (shared/spine.js) bezieht: Ebenen (Mitte, Ausrichtung, R, h, disc), Mittellinie, Wirbelkanal,
// Nervenwurzeln durch die Zwischenwirbellöcher. Alles aus den Netzen gemessen, nichts von Hand eingetragen.
// Daten: BodyParts3D, © The Database Center for Life Science licensed under CC Attribution 4.0 International
// (vereinfacht und umgerechnet mit tools/wirbel-echt.mjs). Einheit cm; nach `model()`: x seitlich (0 = Mitte),
// y Höhe über der Steißbeinspitze, z vorn (0 = Mitte der Säule) – wie die gerechnete Säule vor der Skalierung.
import * as THREE from 'three';
import { gunzipSync } from 'three/examples/jsm/libs/fflate.module.js';
import { zoneOf } from '../shared/spine.js';
import { runSync } from '../shared/slice.js';

const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);

// ---------- Datei lesen (Gegenstück zu tools/wirbel-echt.mjs) ----------
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
    return { id: p.id, kind: p.kind, pos, idx };
  });
  return { quelle: head.quelle, parts };
}

// ---------- Messwerkzeuge ----------
// Flächen-gewichteter Schwerpunkt und Kovarianz der Oberfläche
function surfaceStats(pos, idx) {
  const a = V(), b = V(), c = V(), m = V(), cr = V();
  let A = 0; const S = [0, 0, 0, 0, 0, 0]; // xx yy zz xy xz yz
  for (let t = 0; t < idx.length; t += 3) {
    a.fromArray(pos, idx[t] * 3); b.fromArray(pos, idx[t + 1] * 3); c.fromArray(pos, idx[t + 2] * 3);
    const w = cr.subVectors(b, a).cross(V().subVectors(c, a)).length() / 2;
    const g = V().addVectors(a, b).add(c).divideScalar(3);
    A += w; m.addScaledVector(g, w);
    S[0] += w * g.x * g.x; S[1] += w * g.y * g.y; S[2] += w * g.z * g.z; S[3] += w * g.x * g.y; S[4] += w * g.x * g.z; S[5] += w * g.y * g.z;
  }
  m.divideScalar(A);
  const C = [S[0] / A - m.x * m.x, S[1] / A - m.y * m.y, S[2] / A - m.z * m.z, S[3] / A - m.x * m.y, S[4] / A - m.x * m.z, S[5] / A - m.y * m.z];
  return { c: m, area: A, cov: [[C[0], C[3], C[4]], [C[3], C[1], C[5]], [C[4], C[5], C[2]]] };
}
// Eigenvektoren einer symmetrischen 3×3-Matrix (Jacobi), aufsteigend nach Eigenwert
function eig3(M) {
  const a = M.map((r) => r.slice()), v = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
  for (let it = 0; it < 50; it++) {
    let p = 0, q = 1;
    if (Math.abs(a[0][2]) > Math.abs(a[p][q])) { p = 0; q = 2; }
    if (Math.abs(a[1][2]) > Math.abs(a[p][q])) { p = 1; q = 2; }
    if (Math.abs(a[p][q]) < 1e-12) break;
    const th = 0.5 * Math.atan2(2 * a[p][q], a[q][q] - a[p][p]), c = Math.cos(th), s = Math.sin(th);
    for (let k = 0; k < 3; k++) { const akp = a[k][p], akq = a[k][q]; a[k][p] = c * akp - s * akq; a[k][q] = s * akp + c * akq; }
    for (let k = 0; k < 3; k++) { const apk = a[p][k], aqk = a[q][k]; a[p][k] = c * apk - s * aqk; a[q][k] = s * apk + c * aqk; }
    for (let k = 0; k < 3; k++) { const vkp = v[k][p], vkq = v[k][q]; v[k][p] = c * vkp - s * vkq; v[k][q] = s * vkp + c * vkq; }
  }
  return [0, 1, 2].map((i) => ({ val: a[i][i], vec: V(v[0][i], v[1][i], v[2][i]).normalize() })).sort((x, y) => x.val - y.val);
}
// Rahmen: n = oben (entlang der Säule), a = vorn (senkrecht zu n), l = n × a (seitlich) – wie lokal x/y/z der gerechneten Säule
function frameFrom(n) {
  n = n.clone().normalize();
  const a = V(0, 0, 1).addScaledVector(n, -n.z).normalize();
  return { n, a, l: V().crossVectors(n, a) };
}
const local = (p, c, F, out = V()) => { const d = V().subVectors(p, c); return out.set(d.dot(F.l), d.dot(F.n), d.dot(F.a)); };
const quatOf = (F) => new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(F.l, F.n, F.a));
// Gleichmäßige Stichprobe der Oberfläche (fester Startwert → jedes Mal gleich); vereinfachte Netze haben große, flache Dreiecke
function samples(p, n) {
  if (p.smp && p.smp.length >= n * 3) return p.smp;
  let s = 0x9E3779B9; const rnd = () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const { pos, idx } = p, nt = idx.length / 3, cum = new Float64Array(nt), a = V(), b = V(), c = V();
  let A = 0;
  for (let t = 0; t < nt; t++) { a.fromArray(pos, idx[t * 3] * 3); b.fromArray(pos, idx[t * 3 + 1] * 3); c.fromArray(pos, idx[t * 3 + 2] * 3); A += b.sub(a).cross(c.sub(a)).length() / 2; cum[t] = A; }
  const out = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const x = rnd() * A; let lo = 0, hi = nt - 1;
    while (lo < hi) { const m = (lo + hi) >> 1; if (cum[m] > x) hi = m; else lo = m + 1; }
    let u = rnd(), w = rnd(); if (u + w > 1) { u = 1 - u; w = 1 - w; }
    const i0 = idx[lo * 3] * 3, i1 = idx[lo * 3 + 1] * 3, i2 = idx[lo * 3 + 2] * 3;
    for (let k = 0; k < 3; k++) out[i * 3 + k] = pos[i0 + k] * (1 - u - w) + pos[i1 + k] * u + pos[i2 + k] * w;
  }
  return (p.smp = out);
}
const pct = (arr, q) => { if (!arr.length) return NaN; const s = arr.slice().sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.max(0, Math.round(q * (s.length - 1))))]; };

// Bandscheibe: Mitte, Normale (dünnste Richtung, nach oben), Dicke t, halbe Breite R, halbe Tiefe Rz
function discInfo(p) {
  const st = surfaceStats(p.pos, p.idx), e = eig3(st.cov);
  const n = e[0].vec.y < 0 ? e[0].vec.negate() : e[0].vec, F = frameFrom(n);
  const lo = [1e9, 1e9, 1e9], hi = [-1e9, -1e9, -1e9], q = V(), P = V();
  for (let i = 0; i < p.pos.length; i += 3) { local(P.fromArray(p.pos, i), st.c, F, q); for (let k = 0; k < 3; k++) { const v = q.getComponent(k); lo[k] = Math.min(lo[k], v); hi[k] = Math.max(hi[k], v); } }
  const c = st.c.clone().addScaledVector(F.l, (lo[0] + hi[0]) / 2).addScaledVector(F.n, (lo[1] + hi[1]) / 2).addScaledVector(F.a, (lo[2] + hi[2]) / 2);
  return { c, F, t: hi[1] - lo[1], R: (hi[0] - lo[0]) / 2, Rz: (hi[2] - lo[2]) / 2 };
}

// Wirbelkanal (Mitte, halbe Weite) und Bogenwurzeln: in der Mittellinie (|x| klein) die größte Lücke hinter dem Wirbelkörper
function canalOf(p, lv, opt = {}) {
  const q = V(), P = V(), F = lv.F, hh = Math.max(lv.h / 2, 0.6);
  const strip = [], ped = [], smp = samples(p, 9000);
  for (let i = 0; i < smp.length; i += 3) {
    local(P.fromArray(smp, i), lv.c, F, q);
    if (opt.yMin !== undefined && (q.y < opt.yMin || q.y > opt.yMax)) continue;
    if (opt.yMin === undefined && Math.abs(q.y) > hh * 1.2) continue;
    if (Math.abs(q.x) < 0.25) strip.push(q.z);
  }
  strip.sort((x, y) => y - x); // vorn → hinten
  let best = null;
  for (let i = 1; i < strip.length; i++) {
    const up = strip[i - 1], dn = strip[i], g = up - dn;
    if (up > -lv.Rz * 0.55 || up < -lv.Rz * 1.6 - (opt.c1 ? 1.5 : 0)) continue; // Lücke muss an der Wirbelkörper-Hinterwand beginnen
    if (!best || g > best.g) best = { up, dn, g };
  }
  if (opt.c1) { // Atlas: die Lücke reicht vom vorderen Bogen bis hinten und enthält den Dens der Achse → Kanal im hinteren Teil
    best = null;
    for (let i = 1; i < strip.length; i++) { const g = strip[i - 1] - strip[i]; if (!best || g > best.g) best = { up: strip[i - 1], dn: strip[i], g }; }
  }
  const ok = best && best.g > 0.6;
  const zc = ok ? (opt.c1 ? best.dn + best.g * 0.38 : (best.up + best.dn) / 2) : -lv.Rz - 0.9;
  const rz = ok ? Math.min(best.g / 2, 1.2) : 0.7;
  // halbe Weite: Knochen in Höhe des Kanals (Bogenwurzeln) – die nächsten Punkte neben der Mittellinie
  for (let i = 0; i < smp.length; i += 3) {
    local(P.fromArray(smp, i), lv.c, F, q);
    if (opt.yMin !== undefined ? (q.y < opt.yMin || q.y > opt.yMax) : Math.abs(q.y) > hh) continue;
    if (Math.abs(q.z - zc) < rz * 0.7 && Math.abs(q.x) > 0.35) ped.push(Math.abs(q.x));
  }
  const w = ped.length > 8 ? Math.min(Math.max(pct(ped, 0.06), 0.55), 1.6) : lv.reg === 'c' ? 1.1 : lv.reg === 't' ? 0.8 : 1.0;
  return { zc, rz, w, ok };
}

const CHAIN = ['C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7', ...Array.from({ length: 12 }, (_, i) => `Th${i + 1}`), 'L1', 'L2', 'L3', 'L4', 'L5', 'S'];
const regOf = (id) => (id[0] === 'C' ? 'c' : id[0] === 'T' ? 't' : id[0] === 'L' ? 'l' : 's');

// ---------- Modell ---------- (Generator: Zeitscheiben wie shared/slice.js; model() rechnet am Stück)
export const model = (data, opt) => runSync(modelGen(data, opt));
// opt.spread (cm): Abstand, um den Wirbel und Bandscheiben entlang der Säule auseinanderrücken (Kai 14.11.: „ein wenig Abstand,
// aber noch eine zusammenhängende Wirbelsäule“); das Kreuzbein bleibt stehen, alles darüber rückt je Fuge um spread entlang der
// örtlichen Richtung zum Nachbarn nach oben → Krümmung bleibt, Teile werden nicht verformt
export function* modelGen(data, opt = {}) {
  const P = Object.fromEntries(data.parts.map((p) => [p.id, p]));
  // Ursprung: Mitte der Bandscheiben (x, z), Unterkante der Säule (y)
  let y0 = 1e9, y1 = -1e9;
  data.parts.forEach((p) => { for (let i = 1; i < p.pos.length; i += 3) { y0 = Math.min(y0, p.pos[i]); y1 = Math.max(y1, p.pos[i]); } });
  const pre = data.parts.filter((p) => p.kind === 'disc').map((p) => surfaceStats(p.pos, p.idx).c);
  const xm = pre.reduce((s, c) => s + c.x, 0) / pre.length, zm = pre.reduce((s, c) => s + c.z, 0) / pre.length;
  data.parts.forEach((p) => { for (let i = 0; i < p.pos.length; i += 3) { p.pos[i] -= xm; p.pos[i + 1] -= y0; p.pos[i + 2] -= zm; } });
  const spread = opt.spread || 0;
  if (spread > 0) {
    const byId = Object.fromEntries(data.parts.map((p) => [p.id, p])), order = [];
    CHAIN.forEach((id) => { if (byId[id]) order.push(byId[id]); if (byId['d' + id]) order.push(byId['d' + id]); });
    const cen = order.map((p) => surfaceStats(p.pos, p.idx).c), off = order.map(() => V());
    for (let i = order.length - 2; i >= 0; i--) off[i].copy(off[i + 1]).addScaledVector(V().subVectors(cen[i], cen[i + 1]).normalize(), spread);
    order.forEach((p, i) => { const o = off[i]; for (let k = 0; k < p.pos.length; k += 3) { p.pos[k] += o.x; p.pos[k + 1] += o.y; p.pos[k + 2] += o.z; } });
    y1 = -1e9; data.parts.forEach((p) => { for (let i = 1; i < p.pos.length; i += 3) y1 = Math.max(y1, p.pos[i]); });
    y1 += y0; // y1 wird unten wieder um y0 verringert (Ursprung liegt schon bei 0)
  }
  const Ltot = y1 - y0;

  const disc = {}; // Bandscheibe unter dem Wirbel id
  for (const id of CHAIN) { if (P['d' + id]) disc[id] = discInfo(P['d' + id]); yield; }
  const lv = {};
  const regular = (id, above, below) => {
    const A = disc[above], B = disc[below], n = V().subVectors(A.c, B.c);
    const len = n.length(); n.divideScalar(len);
    return { id, reg: regOf(id), c: V().addVectors(A.c, B.c).multiplyScalar(0.5), F: frameFrom(n), h: len - (A.t + B.t) / 2, R: (A.R + B.R) / 2, Rz: (A.Rz + B.Rz) / 2, disc: B.t };
  };
  for (let i = 2; i < CHAIN.length - 1; i++) lv[CHAIN[i]] = regular(CHAIN[i], CHAIN[i - 1], CHAIN[i]);
  // Höhe des Wirbelkörpers gemessen: Ausdehnung entlang der Achse im inneren Teil des Körpers (Deckplatte bis Grundplatte)
  for (let i = 2; i < CHAIN.length - 1; i++) {
    const L = lv[CHAIN[i]], smp = samples(P[L.id], 9000), q = V(), X = V(); let lo = 1e9, hi = -1e9;
    for (let k = 0; k < smp.length; k += 3) {
      local(X.fromArray(smp, k), L.c, L.F, q);
      if ((q.x / L.R) ** 2 + (q.z / L.Rz) ** 2 > 0.35 || Math.abs(q.y) > L.h + 1) continue;
      lo = Math.min(lo, q.y); hi = Math.max(hi, q.y);
    }
    if (hi > lo) { L.c.addScaledVector(L.F.n, (lo + hi) / 2); L.h = hi - lo; }
    yield;
  }
  // C2: Körper wie C3, etwas höher, über der Bandscheibe C2/C3; Achse aus der Richtung C3 → C2
  {
    const D = disc.C2, c3 = lv.C3, n = V().subVectors(D.c, c3.c).normalize().add(D.F.n).normalize(), h = c3.h * 1.15;
    lv.C2 = { id: 'C2', reg: 'c', c: D.c.clone().addScaledVector(n, D.t / 2 + h / 2), F: frameFrom(n), h, R: D.R, Rz: D.Rz, disc: D.t };
  }
  // C1 (Atlas, kein Körper): auf der verlängerten Achse in Höhe des Atlas-Schwerpunkts
  {
    const c2 = lv.C2, sa = surfaceStats(P.C1.pos, P.C1.idx).c, s = V().subVectors(sa, c2.c).dot(c2.F.n);
    let lo = 1e9, hi = -1e9; const q = V(), X = V();
    for (let i = 0; i < P.C1.pos.length; i += 3) { local(X.fromArray(P.C1.pos, i), c2.c, c2.F, q); lo = Math.min(lo, q.y); hi = Math.max(hi, q.y); }
    lv.C1 = { id: 'C1', reg: 'c', c: c2.c.clone().addScaledVector(c2.F.n, s), F: c2.F, h: (hi - lo) * 0.6, R: c2.R, Rz: c2.Rz, disc: Math.max(0.1, s - (hi - lo) * 0.3 - c2.h / 2), solid: true };
  }
  // Kreuzbein (mit Steißbein): Mitte = Schwerpunkt der Oberfläche, Rahmen von L5/S1, Höhe gemessen
  {
    const D = disc.L5, st = surfaceStats(P.S.pos, P.S.idx);
    let lo = 1e9; const q = V(), X = V();
    for (let i = 0; i < P.S.pos.length; i += 3) { local(X.fromArray(P.S.pos, i), D.c, D.F, q); lo = Math.min(lo, q.y); }
    const top = D.c.clone().addScaledVector(D.F.n, -D.t / 2);
    lv.S = { id: 'S', reg: 's', c: st.c, F: D.F, h: -lo - D.t / 2, R: D.R, Rz: D.Rz, disc: 0, top, solid: true };
  }
  const levels = CHAIN.map((id) => lv[id]);

  // Wirbelkanal je Wirbel
  for (const L of levels) {
    yield;
    const S1 = L.id === 'S';
    // Kreuzbein: nur die oberen 4 cm (Kanal des S1-Segments); Rahmen in Höhe der Deckplatte
    const ref = S1 ? { ...L, c: L.top.clone().addScaledVector(L.F.n, -1.4), h: 2.8 } : L;
    const k = canalOf(P[L.id], ref, { c1: L.id === 'C1', ...(S1 ? { yMin: -2.2, yMax: 1.4 } : {}) });
    L.canal = ref.c.clone().addScaledVector(L.F.a, k.zc); L.canalW = k.w; L.canalOk = k.ok; L.canalZ = k.zc;
  }

  // Mittellinie (oben → unten) durch Wirbelkörper und Bandscheiben, im Kreuzbein entlang der Mitte der Querschnitte
  const mid = [lv.C1.c.clone().addScaledVector(lv.C1.F.n, 1.2)];
  CHAIN.slice(0, -1).forEach((id) => { mid.push(lv[id].c.clone()); if (disc[id]) mid.push(disc[id].c.clone()); });
  {
    const S = lv.S, F = S.F, q = V(), X = V(), B = 6, acc = Array.from({ length: B }, () => [V(), 0]);
    for (let i = 0; i < P.S.pos.length; i += 3) {
      local(X.fromArray(P.S.pos, i), S.top, F, q);
      const f = -q.y / S.h; if (f < 0 || f >= 1 || Math.abs(q.x) > S.R * (1 - f * 0.7)) continue;
      const b = Math.min(B - 1, (f * B) | 0); acc[b][0].add(X); acc[b][1]++;
    }
    acc.forEach(([s, n], b) => { if (b > 0 && n > 10) mid.push(s.divideScalar(n)); });
  }
  const curve = new THREE.CatmullRomCurve3(mid, false, 'centripetal');

  // Nervenwurzeln: links/rechts je Wirbel, durch das Zwischenwirbelloch unter dem Wirbel (wie rootCurves in shared/spine.js:
  // vier Stützpunkte – Kanal, Foramen, außen, Ende; Puls greift ab Stützpunkt 2 = Foramen zu, ROOT_I)
  const U = Ltot / 9.22; // cm je Einheit der gerechneten Säule (gleiche Ausladung der Nervenbahnen)
  const LEN = { c: 1.1, t: 1.15, l: 1.35, s: 1.5 }, DROP = { c: 0.3, t: 0.42, l: 0.9, s: 1.2 };
  const roots = [];
  levels.forEach((L, i) => {
    const N = levels[i + 1];
    let c, F, Rz, canal, w;
    if (L.id === 'S') { // erstes Kreuzbeinloch (S1): ~2,5 cm unter der Deckplatte, vor dem Kanal
      F = L.F; c = L.top.clone().addScaledVector(F.n, -2.5); Rz = L.Rz; canal = L.canal.clone().addScaledVector(F.n, -1.1); w = L.canalW;
    } else if (disc[L.id]) {
      const D = disc[L.id]; F = D.F; c = D.c.clone().addScaledVector(F.n, Math.min(0.35, L.h * 0.12)); Rz = D.Rz;
      canal = V().addVectors(L.canal, N.canal).multiplyScalar(0.5); w = (L.canalW + N.canalW) / 2;
    } else { // C1/C2: kein Bandscheibenraum
      F = L.F; c = V().addVectors(L.c, N.c).multiplyScalar(0.5); Rz = N.Rz;
      canal = V().addVectors(L.canal, N.canal).multiplyScalar(0.5); w = (L.canalW + N.canalW) / 2;
    }
    const cz = V().subVectors(canal, c).dot(F.a), cy = V().subVectors(canal, c).dot(F.n), R = L.R;
    const at = (x, y, z) => c.clone().addScaledVector(F.l, x).addScaledVector(F.n, y).addScaledVector(F.a, z);
    const len = LEN[L.reg], drop = DROP[L.reg] * U, fz = (-Rz + cz) / 2;
    for (const s of [1, -1]) {
      const pts = [
        at(s * w * 0.3, cy * 0.5, cz),
        at(s * (w + 0.45), 0, fz),
        at(s * (w + 0.45 + R * (0.28 + len * 0.35)), -drop * 0.35, fz + R * 0.38),
        at(s * (w + 0.45 + R * (0.28 + len * 0.9)), -drop, fz + R * 0.93),
      ];
      roots.push({ id: L.id, zone: zoneOf(L.id), side: s, curve: new THREE.CatmullRomCurve3(pts), foramen: pts[1] });
    }
  });

  // für Puls: Ebenen im Format von shared/spine.js (center, quat, R, h, disc)
  const out = levels.map((L) => ({ id: L.id, reg: L.reg, R: L.R, h: L.h, disc: L.disc, center: L.c.clone(), quat: quatOf(L.F) }));
  return { quelle: data.quelle, P, levels, out, disc, Ltot, curve, canal: levels.map((L) => L.canal), roots };
}

// Kante je Ecke (Farbe b in Puls): Wirbelkörper/Bandscheibe |y| / halbe Höhe (1 = Deckplatte bzw. Fuge), Bogen/Fortsätze −1, Atlas/Kreuzbein 0
export function edgeOf(M, part, p, q = V()) {
  if (part.kind === 'disc') {
    const D = M.disc[part.id.slice(1)]; local(p, D.c, D.F, q);
    return Math.min(1, Math.abs(q.y) / (D.t / 2));
  }
  const L = M.levels.find((l) => l.id === part.id);
  if (L.id === 'S') { // Deckplatte S1: 1 oben, 0 in 1,4 cm Tiefe; Rest 0
    local(p, L.top, L.F, q);
    if ((q.x / (L.R * 1.08)) ** 2 + ((q.z) / (L.Rz * 1.08)) ** 2 > 1) return 0;
    return Math.max(0, Math.min(1, 1 + q.y / 1.4));
  }
  if (L.solid) return 0;
  local(p, L.c, L.F, q);
  if ((q.x / (L.R * 1.08)) ** 2 + (q.z / (L.Rz * 1.08)) ** 2 > 1 || Math.abs(q.y) > L.h * 0.65) return -1;
  return Math.min(1, Math.abs(q.y) / (L.h / 2));
}
