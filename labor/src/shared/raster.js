// Geordnete Punkte auf Oberflächen (20.11.2026, Auftrag Kai: „die gleichen professionellen Animationen wie die Figur und Wirbelsäule
// auf alle anderen Pixel-Grafiken“). Gleiches Prinzip wie die Figur in Kapitel 01 (src/feinschliff/figur.js): Zeile für Zeile über
// die gewölbte Oberfläche, gleicher Abstand AUF der Oberfläche, jede zweite Zeile um einen halben Abstand versetzt – kein Zufall.
// Jede Form liefert:  pts  = [x, y, z, nx, ny, nz, w] je Punkt (Normale für das Kantenlicht; w = Deckkraft 0…1),
//                     tris = [x, y, z, nx, ny, nz] je Ecke (dunkler Kern, der die Rückseite verdeckt),
//                     inside(p, rand) = liegt der Punkt in der Form (zum Aussparen von Punkten, die in einer Nachbarform stecken).
// Linien (line) sind Perlen in gleichem Abstand; ihre Normale ist 0 → der Shader zeichnet sie ohne Kantenlicht.
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const mul = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const len = (a) => Math.hypot(a[0], a[1], a[2]);
const norm = (a) => { const l = len(a); return l > 1e-9 ? mul(a, 1 / l) : [0, 0, 0]; };
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
const lerp3 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const V = { sub, add, mul, dot, cross, len, norm, dist, lerp: lerp3 };

// Stelle t (0…1) zu einer Bogenlänge s in einer aufsummierten Längenliste L (L[0] = 0)
function atArc(L, s) {
  const n = L.length - 1;
  if (s <= 0) return 0; if (s >= L[n]) return 1;
  let lo = 0, hi = n;
  while (hi - lo > 1) { const m = (lo + hi) >> 1; if (L[m] <= s) lo = m; else hi = m; }
  return (lo + (s - L[lo]) / Math.max(1e-9, L[hi] - L[lo])) / n;
}

// Allgemeine Fläche S(u, v) → [x, y, z], u und v 0…1. Zeilen laufen entlang u, sie folgen einander entlang v.
// o: closedU (Zeile schließt sich), flip (Normale umdrehen), out(p, u, v) (Richtung, in die die Normale zeigen soll), nrm(p, u, v) (genaue Normale), w(u, v) (Deckkraft),
//    keep(p, n, u, v) (Punkt behalten?), core: false (kein Kern), cu/cv (Feinheit des Kerns), rows: 'v0' | 'v1' (Zeile am Rand weglassen)
export function surf(S, sp, o = {}) {
  const NU = o.nu || 72, NV = o.nv || 72, e = 1e-3;
  const nrmAt = (p, u, v) => {
    if (o.nrm) return o.nrm(p, u, v);
    const u0 = Math.max(0, u - e), u1 = Math.min(1, u + e), v0 = Math.max(0, v - e), v1 = Math.min(1, v + e);
    let n = norm(cross(sub(S(u1, v), S(u0, v)), sub(S(u, v1), S(u, v0))));
    if (!len(n) && o.center) n = norm(sub(p, o.center));
    if (o.out) { const d = o.out(p, u, v); if (dot(n, d) < 0) n = mul(n, -1); }
    return o.flip ? mul(n, -1) : n;
  };
  // Bogenlänge entlang v (Mittel über mehrere u)
  const Lv = [0], cols = o.closedU ? [0.125, 0.375, 0.625, 0.875] : [0.1, 0.3, 0.5, 0.7, 0.9];
  for (let j = 1; j <= NV; j++) { let s = 0; for (const u of cols) s += dist(S(u, j / NV), S(u, (j - 1) / NV)); Lv.push(Lv[j - 1] + s / cols.length); }
  const rows = Math.max(1, Math.round(Lv[NV] / (sp * 0.866)));
  const pts = [];
  for (let r = 0; r <= rows; r++) {
    if ((o.rows === 'v0' && r === 0) || (o.rows === 'v1' && r === rows)) continue;
    const v = atArc(Lv, (r / rows) * Lv[NV]);
    const Lu = [0]; let prev = S(0, v);
    for (let i = 1; i <= NU; i++) { const q = S(i / NU, v); Lu.push(Lu[i - 1] + dist(q, prev)); prev = q; }
    const total = Lu[NU], odd = r & 1;
    const put = (u) => { const p = S(u, v), n = nrmAt(p, u, v); if (o.keep && !o.keep(p, n, u, v)) return; pts.push(p[0], p[1], p[2], n[0], n[1], n[2], o.w ? o.w(u, v) : 1); };
    if (total < sp * 0.6) { put(0.5); continue; } // Pol: ein Punkt
    const cnt = Math.max(o.closedU ? 3 : 1, Math.round(total / sp));
    if (o.closedU) for (let k = 0; k < cnt; k++) put(atArc(Lu, ((k + (odd ? 0.5 : 0)) / cnt) * total));
    else if (odd) for (let k = 0; k < cnt; k++) put(atArc(Lu, ((k + 0.5) / cnt) * total));
    else for (let k = 0; k <= cnt; k++) put(atArc(Lu, (k / cnt) * total));
  }
  const tris = [];
  if (o.core !== false) {
    const cu = o.cu || 20, cv = o.cv || 14, G = [];
    for (let j = 0; j <= cv; j++) for (let i = 0; i <= cu; i++) { const u = i / cu, v = j / cv, p = S(u, v), n = nrmAt(p, u, v); G.push([p[0], p[1], p[2], n[0], n[1], n[2]]); }
    const q = (i, j) => G[j * (cu + 1) + i];
    for (let j = 0; j < cv; j++) for (let i = 0; i < cu; i++) for (const c of [q(i, j), q(i + 1, j), q(i + 1, j + 1), q(i, j), q(i + 1, j + 1), q(i, j + 1)]) tris.push(...c);
  }
  return { pts, tris, inside: o.inside || null };
}

// Achsen-Dreibein: a = Längsachse, dazu zwei Senkrechte
function frame(a, ref) {
  const u = norm(a), r0 = ref || (Math.abs(u[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0]);
  const n1 = norm(sub(r0, mul(u, dot(r0, u)))), n2 = cross(u, n1);
  return [u, n1, n2];
}
const AX = { x: [1, 0, 0], y: [0, 1, 0], z: [0, 0, 1] };

// Ellipsoid: Zeilen als Ringe um die Achse (Standard: die längste Halbachse)
export function ell(c, r, sp, o = {}) {
  const ax = o.axis || (r[0] >= r[1] && r[0] >= r[2] ? 'x' : r[1] >= r[2] ? 'y' : 'z');
  const [i0, i1, i2] = ax === 'x' ? [0, 1, 2] : ax === 'y' ? [1, 2, 0] : [2, 0, 1];
  const S = (u, v) => { const th = v * Math.PI, ph = u * 6.2831853, s = Math.sin(th), p = [0, 0, 0]; p[i0] = c[i0] - Math.cos(th) * r[i0]; p[i1] = c[i1] + Math.cos(ph) * s * r[i1]; p[i2] = c[i2] + Math.sin(ph) * s * r[i2]; return p; };
  const nrm = (p) => norm([(p[0] - c[0]) / (r[0] * r[0]), (p[1] - c[1]) / (r[1] * r[1]), (p[2] - c[2]) / (r[2] * r[2])]);
  const inside = (p, m = 0) => { const x = (p[0] - c[0]) / (r[0] - m), y = (p[1] - c[1]) / (r[1] - m), z = (p[2] - c[2]) / (r[2] - m); return x * x + y * y + z * z < 1; };
  return surf(S, sp, { closedU: true, nrm, inside, ...o });
}

// Röhre durch Stützpunkte { p, r } (weich verbunden), Enden gerundet; fl staucht den Querschnitt entlang ref (flacher Finger, Arm …)
// o: ref, fl, capA: false / capB: false (offenes Ende), w
export function tube(nodes, sp, o = {}) {
  // Mittellinie fein abtasten (Catmull-Rom), mit laufender Länge
  const M = [], n = nodes.length, P = (i) => nodes[clamp(i, 0, n - 1)];
  const STEPS = n > 2 ? 10 : 1;
  for (let i = 0; i < n - 1; i++) for (let s = 0; s < STEPS + (i === n - 2 ? 1 : 0); s++) {
    const t = s / STEPS, t2 = t * t, t3 = t2 * t, p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
    const cr = (a, b, c, d) => 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
    M.push({ p: n > 2 ? [0, 1, 2].map((k) => cr(p0.p[k], p1.p[k], p2.p[k], p3.p[k])) : lerp3(p1.p, p2.p, t), r: p1.r + (p2.r - p1.r) * (t * t * (3 - 2 * t)) });
  }
  const L = [0]; for (let i = 1; i < M.length; i++) L.push(L[i - 1] + dist(M[i].p, M[i - 1].p));
  const total = L[L.length - 1];
  // mitgeführtes Dreibein (ohne Verdrehen)
  let [, n1] = frame(sub(M[1].p, M[0].p), o.ref);
  M.forEach((m, i) => { const u = norm(sub(M[Math.min(i + 1, M.length - 1)].p, M[Math.max(i - 1, 0)].p)); n1 = norm(sub(n1, mul(u, dot(n1, u)))); m.u = u; m.n1 = n1; m.n2 = cross(u, n1); });
  const at = (s) => { // Punkt der Mittellinie an der Länge s
    const t = atArc(L, clamp(s, 0, total)) * (M.length - 1), i = Math.min(M.length - 2, Math.floor(t)), f = t - i, a = M[i], b = M[i + 1];
    return { p: lerp3(a.p, b.p, f), r: a.r + (b.r - a.r) * f, u: norm(lerp3(a.u, b.u, f)), n1: norm(lerp3(a.n1, b.n1, f)), n2: norm(lerp3(a.n2, b.n2, f)) };
  };
  const fl = o.fl || 1, ra = o.capA === false ? 0 : M[0].r, rb = o.capB === false ? 0 : M[M.length - 1].r;
  // v läuft über: Kappe A (Viertelkreis) · Mantel · Kappe B
  const la = ra * 1.5708, lb = rb * 1.5708, all = la + total + lb;
  const S = (u, v) => {
    const s = v * all, ph = u * 6.2831853; let m, rr, off = 0;
    if (s < la) { const a = s / ra; m = at(0); rr = Math.sin(a) * ra; off = -Math.cos(a) * ra; }
    else if (s > la + total) { const a = (all - s) / rb; m = at(total); rr = Math.sin(a) * rb; off = Math.cos(a) * rb; }
    else { m = at(s - la); rr = m.r; }
    return add(add(m.p, mul(m.u, off)), add(mul(m.n1, Math.cos(ph) * rr * fl), mul(m.n2, Math.sin(ph) * rr)));
  };
  const nrm = (p, u, v) => {
    const s = v * all, ph = u * 6.2831853;
    if (s < la) return norm(sub(p, M[0].p)); if (s > la + total) return norm(sub(p, M[M.length - 1].p));
    const m = at(s - la); return norm(add(mul(m.n1, Math.cos(ph) / fl), mul(m.n2, Math.sin(ph))));
  };
  const inside = (p, mg = 0) => { const k = Math.min(1, fl + 0.15); for (let i = 0; i < M.length; i++) if (dist(p, M[i].p) < M[i].r * k - mg) return true; return false; };
  return surf(S, sp, { closedU: true, nrm, inside, cu: 14, cv: Math.max(8, Math.round(all / 0.09)), ...o });
}
// Kapsel von a nach b (Radius r oder [ra, rb])
export const cap = (a, b, r, sp, o = {}) => tube([{ p: a, r: Array.isArray(r) ? r[0] : r }, { p: b, r: Array.isArray(r) ? r[1] : r }], sp, o);

// Quader: sechs ebene Raster; faces = welche Seiten ('+x', '-x', …), Standard alle
export function box(c, s, sp, o = {}) {
  const out = { pts: [], tris: [] }, h = [s[0] / 2, s[1] / 2, s[2] / 2];
  const faces = o.faces || ['+x', '-x', '+y', '-y', '+z', '-z'];
  for (const f of faces) {
    const sg = f[0] === '+' ? 1 : -1, a = 'xyz'.indexOf(f[1]), b = (a + 1) % 3, d = (a + 2) % 3, n = [0, 0, 0]; n[a] = sg;
    const S = (u, v) => { const p = [0, 0, 0]; p[a] = c[a] + sg * h[a]; p[b] = c[b] + (u - 0.5) * s[b]; p[d] = c[d] + (v - 0.5) * s[d]; return p; };
    const g = surf(S, sp, { nrm: () => n, cu: 1, cv: 1, ...o, inside: null });
    out.pts.push(...g.pts);
    // Dreiecke mit Umlaufsinn nach außen sind hier gleichgültig (Kern wird beidseitig gezeichnet)
    out.tris.push(...g.tris);
  }
  out.inside = (p, m = 0) => Math.abs(p[0] - c[0]) < h[0] - m && Math.abs(p[1] - c[1]) < h[1] - m && Math.abs(p[2] - c[2]) < h[2] - m;
  return out;
}

// Scheibe (Ringe von der Mitte nach außen) und Zylinder (Mantel + zwei Scheiben)
export function disc(c, r, sp, o = {}) {
  const [u0, n1, n2] = frame(AX[o.axis || 'y']), sg = o.flip ? -1 : 1;
  const S = (u, v) => add(c, add(mul(n1, Math.cos(u * 6.2831853) * v * r), mul(n2, Math.sin(u * 6.2831853) * v * r)));
  return surf(S, sp, { closedU: true, nrm: () => mul(u0, sg), cu: 18, cv: 1, ...o, flip: false });
}
export function cyl(c, r, h, sp, o = {}) {
  const ax = AX[o.axis || 'y'], [u0, n1, n2] = frame(ax);
  const S = (u, v) => add(add(c, mul(u0, (v - 0.5) * h)), add(mul(n1, Math.cos(u * 6.2831853) * r), mul(n2, Math.sin(u * 6.2831853) * r)));
  const side = surf(S, sp, { closedU: true, nrm: (p) => { const d = sub(p, c); return norm(sub(d, mul(u0, dot(d, u0)))); }, cu: 18, cv: 1, ...o });
  const a = disc(add(c, mul(u0, h / 2)), r - sp * 0.5, sp, { axis: o.axis || 'y', w: o.w }), b = disc(add(c, mul(u0, -h / 2)), r - sp * 0.5, sp, { axis: o.axis || 'y', flip: true, w: o.w });
  return { pts: [...side.pts, ...a.pts, ...b.pts], tris: [...side.tris, ...a.tris, ...b.tris],
    inside: (p, m = 0) => { const d = sub(p, c), t = dot(d, u0); return Math.abs(t) < h / 2 - m && len(sub(d, mul(u0, t))) < r - m; } };
}
// Ring mit rundem Querschnitt (Torus) um die Achse
export function torus(c, R, r, sp, o = {}) {
  const [u0, n1, n2] = frame(AX[o.axis || 'y']), a0 = o.a0 || 0, a1 = o.a1 === undefined ? 6.2831853 : o.a1, full = a1 - a0 > 6.28;
  const mid = (v) => { const a = a0 + v * (a1 - a0); return add(c, add(mul(n1, Math.cos(a) * R), mul(n2, Math.sin(a) * R))); };
  const S = (u, v) => { const m = mid(v), out = norm(sub(m, c)), ph = u * 6.2831853; return add(m, add(mul(out, Math.cos(ph) * r), mul(u0, Math.sin(ph) * r * (o.fl || 1)))); };
  return surf(S, sp, { closedU: true, nrm: (p, u, v) => norm(sub(p, mid(v))), cu: 10, cv: full ? 28 : 16, rows: full ? 'v1' : undefined,
    inside: (p, m = 0) => { const d = sub(p, c), t = dot(d, u0), q = sub(d, mul(u0, t)); return Math.hypot(len(q) - R, t) < r - m; }, ...o });
}

// Perlenlinie: P(t) → [x, y, z], t 0…1; Perlen in gleichem Abstand. o.w(t) = Deckkraft, o.half = um einen halben Abstand versetzt
export function line(P, sp, o = {}) {
  const N = o.n || 160, L = [0]; let prev = P(0);
  for (let i = 1; i <= N; i++) { const q = P(i / N); L.push(L[i - 1] + dist(q, prev)); prev = q; }
  const total = L[N], cnt = Math.max(1, Math.round(total / sp)), pts = [];
  for (let k = o.half ? 0.5 : 0; k <= cnt; k++) { const t = atArc(L, (k / cnt) * total), p = P(t); pts.push(p[0], p[1], p[2], 0, 0, 0, o.w ? o.w(t) : 1); }
  return { pts, tris: [], inside: null };
}
export const seg = (a, b, sp, o) => line((t) => lerp3(a, b, t), sp, o);

// Körper mit wechselndem ovalem Querschnitt entlang einer Achse (Rumpf): Schnitte { x, y, z, ry, rz } weich verbunden, Enden gerundet
export function loft(secs, sp, o = {}) {
  const n = secs.length, x0 = secs[0].x, x1 = secs[n - 1].x;
  const at = (x) => {
    let i = 0; while (i < n - 2 && secs[i + 1].x < x) i++;
    const a = secs[i], b = secs[i + 1], t = clamp((x - a.x) / (b.x - a.x)), p0 = secs[Math.max(0, i - 1)], p3 = secs[Math.min(n - 1, i + 2)], t2 = t * t, t3 = t2 * t;
    const cr = (k) => { const A = p0[k] || 0, B = a[k] || 0, C = b[k] || 0, D = p3[k] || 0; return 0.5 * (2 * B + (-A + C) * t + (2 * A - 5 * B + 4 * C - D) * t2 + (-A + 3 * B - 3 * C + D) * t3); };
    return { y: cr('y'), z: cr('z'), ry: Math.max(1e-4, cr('ry')), rz: Math.max(1e-4, cr('rz')) };
  };
  // Enden: der Querschnitt läuft über die Strecke e rund auf null zu
  const ea = o.capA === false ? 0 : secs[0].ry, eb = o.capB === false ? 0 : secs[n - 1].ry;
  const sec = (x) => { const m = at(clamp(x, x0, x1)); let k = 1; if (x < x0) k = Math.sqrt(Math.max(0, 1 - ((x0 - x) / ea) ** 2)); if (x > x1) k = Math.sqrt(Math.max(0, 1 - ((x - x1) / eb) ** 2)); return { y: m.y, z: m.z, ry: m.ry * k, rz: m.rz * k }; };
  const S = (u, v) => { const x = x0 - ea + v * (x1 + eb - x0 + ea), m = sec(x), ph = u * 6.2831853; return [x, m.y + Math.cos(ph) * m.ry, m.z + Math.sin(ph) * m.rz]; };
  const inside = (p, mg = 0) => { if (p[0] < x0 - ea || p[0] > x1 + eb) return false; const m = sec(p[0]); const a = (p[1] - m.y) / Math.max(1e-4, m.ry - mg), b = (p[2] - m.z) / Math.max(1e-4, m.rz - mg); return m.ry > mg && m.rz > mg && a * a + b * b < 1; };
  return surf(S, sp, { closedU: true, inside, cu: 20, cv: Math.max(12, Math.round((x1 - x0) / 0.08)), nv: 160, ...o });
}

// Mehrere Formen zu einer zusammenfassen
export function join(...gs) { const out = { pts: [], tris: [], inside: null }, ins = gs.map((g) => g.inside).filter(Boolean); for (const g of gs) { out.pts.push(...g.pts); out.tris.push(...g.tris); } if (ins.length) out.inside = (p, m) => ins.some((f) => f(p, m)); return out; }
// Form verschieben / drehen (um y) – für wiederverwendete Teile
export function moved(g, d, rotY = 0) {
  const c = Math.cos(rotY), s = Math.sin(rotY), r = (x, z) => [c * x + s * z, -s * x + c * z], out = { pts: g.pts.slice(), tris: g.tris.slice(), inside: null };
  for (const [A, st] of [[out.pts, 7], [out.tris, 6]]) for (let i = 0; i < A.length; i += st) { const [x, z] = r(A[i], A[i + 2]), [nx, nz] = r(A[i + 3], A[i + 5]); A[i] = x + d[0]; A[i + 1] += d[1]; A[i + 2] = z + d[2]; A[i + 3] = nx; A[i + 5] = nz; }
  if (g.inside) out.inside = (p, m) => { const q = [p[0] - d[0], p[1] - d[1], p[2] - d[2]], [x, z] = [c * q[0] - s * q[2], s * q[0] + c * q[2]]; return g.inside([x, q[1], z], m); };
  return out;
}

// Teile zusammensetzen: Punkte, die in einer anderen Form derselben Gruppe stecken, entfallen; doppelte Punkte (gemeinsame Kanten) ebenso.
// parts: [{ g, grp?, ...beliebige Angaben }] → [{ part, pts: [[x,y,z,nx,ny,nz,w], …] }]
export function assemble(parts, sp) {
  const cell = sp, grid = new Map(), key = (x, y, z) => `${Math.floor(x / cell)},${Math.floor(y / cell)},${Math.floor(z / cell)}`;
  const near = (p, d) => {
    const cx = Math.floor(p[0] / cell), cy = Math.floor(p[1] / cell), cz = Math.floor(p[2] / cell);
    for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) for (let c = -1; c <= 1; c++) { const l = grid.get(`${cx + a},${cy + b},${cz + c}`); if (l) for (const q of l) if (dist(p, q) < d) return true; }
    return false;
  };
  return parts.map((part, pi) => {
    const A = part.g.pts, keep = [];
    for (let i = 0; i < A.length; i += 7) {
      const p = [A[i], A[i + 1], A[i + 2]];
      let hid = false;
      for (let k = 0; k < parts.length && !hid; k++) { const q = parts[k]; if (k !== pi && q.g.inside && (q.grp || 0) === (part.grp || 0) && q.cut !== false && part.cut !== false && q.g.inside(p, sp * 0.3)) hid = true; }
      if (hid || near(p, sp * 0.45)) continue;
      const k = key(p[0], p[1], p[2]); (grid.get(k) || grid.set(k, []).get(k)).push(p);
      keep.push([A[i], A[i + 1], A[i + 2], A[i + 3], A[i + 4], A[i + 5], A[i + 6]]);
    }
    return { part, pts: keep };
  });
}
