// Das Skelett „von Kopf bis Fuß“ als eigene, gerechnete Formen (Maße in cm, y = Höhe über dem Boden, +z = vorn, x = seitlich).
// Maße nach üblichen Körpermaßen (ca. 178 cm): Wirbelsäule C1–Steißbein ≈ 78 cm, Hüftgelenk 93, Knie 47,5, Sprunggelenk 9,3.
// Jeder Knochen ist eine Abstandsfunktion aus weich verschmolzenen Grundkörpern (sdf.js) – kein fremdes Modell.
import * as THREE from 'three';
import { smin, smax, cone, ell, meshGen } from './sdf.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const UP = V(0, 1, 0);
const S_TOP = 104;                                     // Oberkante Kreuzbein über dem Boden

// ---------- Wirbelsäule: Höhen, Maße, Lage ---------------------------------------------------------
export function spineLevels() {
  const L = [];
  for (let i = 0; i < 7; i++) L.push({ id: 'C' + (i + 1), reg: 'c', type: i === 0 ? 'atlas' : i === 1 ? 'c2' : i === 6 ? 'c7' : 'c', R: 0.82 + i * 0.035, h: i === 0 ? 1.0 : i === 1 ? 1.9 : 1.35 + i * 0.03, disc: i === 0 ? 0.25 : 0.5 });
  for (let i = 0; i < 12; i++) L.push({ id: 'Th' + (i + 1), reg: 't', type: i < 4 ? 't1' : i < 9 ? 't2' : 't3', R: 1.15 + i * 0.075, h: 1.65 + i * 0.075, disc: 0.38 + i * 0.03 });
  for (let i = 0; i < 5; i++) L.push({ id: 'L' + (i + 1), reg: 'l', type: 'l', R: 2.1 + i * 0.09, h: 2.7 + i * 0.04, disc: 0.95 + i * 0.05 });
  L.push({ id: 'S', reg: 's', type: 's', R: 2.55, h: 11.5, disc: 0 });
  L.push({ id: 'Co', reg: 'co', type: 'co', R: 0.75, h: 3.0, disc: 0 });
  let s = 0; L.forEach((l) => { l.s0 = s; s += l.h + l.disc; });
  const Ltot = s, yTop = S_TOP + 0.985 * (Ltot - 14.5);
  // Krümmungen: Halslordose, Brustkyphose, Lendenlordose, Kreuzbein nach hinten
  const ctrl = [[0, 0], [0.08, 1.1], [0.17, 0.3], [0.4, -3.4], [0.62, -0.6], [0.765, 2.8], [0.845, 1.8], [0.93, -2.4], [1, -3.6]];
  const curve = new THREE.CatmullRomCurve3(ctrl.map(([f, z]) => V(0, yTop - f * Ltot * 0.985, z)), false, 'centripetal');
  const canal = [];
  L.forEach((lv) => {
    const u = (lv.s0 + lv.h / 2) / Ltot;
    lv.center = curve.getPointAt(u); lv.up = curve.getTangentAt(u).negate();
    lv.quat = new THREE.Quaternion().setFromUnitVectors(UP, lv.up);
    const t = TYPES[lv.type];
    lv.sy = lv.type === 's' || lv.type === 'co' ? 1 : lv.h / t.hh;      // Netz ist auf R = 1 gerechnet, Höhe wird angepasst
    lv.zc = lv.type === 'atlas' ? -0.35 * lv.R : lv.type === 's' ? -1.3 : lv.type === 'co' ? 0 : -(t.az + t.ra * 0.6) * lv.R;   // Mitte des Wirbelkanals
    lv.pt = (x, y, z) => V(x, y, z).applyQuaternion(lv.quat).add(lv.center);   // Punkt im Wirbel → Körper
    if (lv.reg !== 'co') canal.push(lv.pt(0, 0, lv.zc));
  });
  const S = L[L.length - 2], Co = L[L.length - 1];
  // Steißbein sitzt am unteren Ende des Kreuzbeins und biegt nach vorn
  Co.quat = S.quat.clone().multiply(new THREE.Quaternion().setFromAxisAngle(V(1, 0, 0), 0.45));
  Co.up = V(0, 1, 0).applyQuaternion(Co.quat); Co.center = S.pt(0, -S.h / 2 - 0.2, -0.75).addScaledVector(Co.up, -Co.h / 2);
  return { levels: L, Ltot, curve, canal, P0: S.pt(0, S.h / 2, 0), byId: (id) => L.find((l) => l.id === id) };
}

// ---------- Wirbel: Formen (auf Wirbelkörper-Radius 1 gerechnet) -----------------------------------
const TYPES = {
  atlas: { hh: 1.2 },
  c: { hh: 1.55, az: 0.8, ra: 0.72, lamY: 1.15, spLen: 1.25, spAng: 0.38, spR: 0.26, tpLen: 0.75, tpBack: -0.2, tpUp: -0.1, tpR: 0.22 },
  c2: { hh: 1.9, az: 0.8, ra: 0.72, lamY: 1, spLen: 1.8, spAng: 0.3, spR: 0.3, tpLen: 0.7, tpBack: -0.1, tpUp: -0.15, tpR: 0.22, dens: true },
  c7: { hh: 1.5, az: 0.82, ra: 0.68, lamY: 1.1, spLen: 2.5, spAng: 0.2, spR: 0.24, tpLen: 0.95, tpBack: 0, tpUp: -0.05, tpR: 0.24 },
  t1: { hh: 1.42, az: 0.9, ra: 0.52, lamY: 1.5, spLen: 2.3, spAng: 0.7, spR: 0.2, tpLen: 1.45, tpBack: 0.6, tpUp: 0.18, tpR: 0.24, tpBulb: 0.3 },
  t2: { hh: 1.33, az: 0.95, ra: 0.5, lamY: 1.6, spLen: 2.5, spAng: 1.08, spR: 0.2, tpLen: 1.3, tpBack: 0.7, tpUp: 0.15, tpR: 0.23, tpBulb: 0.28 },
  t3: { hh: 1.26, az: 0.92, ra: 0.48, lamY: 1.5, spLen: 1.8, spAng: 0.6, spR: 0.21, tpLen: 0.85, tpBack: 0.55, tpUp: 0.05, tpR: 0.2, tpBulb: 0.22 },
  l: { hh: 1.22, ax: 1.08, az: 0.76, ra: 0.46, lamY: 1.5, spLen: 1.35, spAng: 0.1, spR: 0.3, spFlat: 2.4, tpLen: 1.45, tpBack: 0.12, tpUp: 0.03, tpR: 0.15 },
  s: { hh: 11.5 }, co: { hh: 3 },
};

function vertebra(o) {
  const { hh, ax = 1, az, ra } = o, zc = -(az + ra * 0.6), half = hh / 2;
  const s0y = -0.06 * hh, s0z = zc - ra, s1y = s0y - Math.sin(o.spAng) * o.spLen, s1z = s0z - Math.cos(o.spAng) * o.spLen;
  const t0x = ra * 1.05, t0z = zc - ra * 0.05, t1x = t0x + Math.cos(o.tpBack) * o.tpLen, t1y = (o.tpUp || 0) * o.tpLen, t1z = t0z - Math.sin(o.tpBack) * o.tpLen;
  const fl = o.spFlat || 1, ly = o.lamY;
  const f = (x, y, z) => {
    const X = Math.abs(x);
    const rr = Math.sqrt((x / ax) ** 2 + (z / az) ** 2), w = 0.86 + 0.14 * (y / half) ** 2;
    let d = smax((rr - w) * az, Math.abs(y) - half, 0.18);                                              // Wirbelkörper mit Taille
    d = smin(d, cone(X, y, z, 0.55, 0.2 * hh, -az * 0.8, ra * 1.02, 0.14 * hh, zc - ra * 0.1, 0.24, 0.2), 0.16);       // Bogenwurzel
    d = smin(d, cone(X, y / ly, z, ra * 1.02, (0.1 * hh) / ly, zc - ra * 0.1, 0, (-0.06 * hh) / ly, zc - ra * 1.02, 0.19, 0.19), 0.16);   // Bogenplatte
    d = smin(d, cone(x * fl, y * (fl > 1 ? 0.62 : 1), z, 0, s0y * (fl > 1 ? 0.62 : 1), s0z, 0, s1y * (fl > 1 ? 0.62 : 1), s1z, o.spR, o.spR * 0.8) / fl, 0.14);   // Dornfortsatz
    d = smin(d, cone(X, y, z, t0x, 0, t0z, t1x, t1y, t1z, o.tpR, o.tpR * 0.72), 0.14);                   // Querfortsatz
    if (o.tpBulb) d = smin(d, ell(X, y, z, t1x, t1y, t1z, o.tpBulb, o.tpBulb, o.tpBulb), 0.1);
    d = smin(d, cone(X, y, z, ra * 1.02, 0.12 * hh, zc - ra * 0.1, ra * 0.98, half + 0.14, zc - ra * 0.3, 0.2, 0.24), 0.12);    // oberer Gelenkfortsatz
    d = smin(d, cone(X, y, z, ra * 0.95, 0, zc - ra * 0.4, ra * 0.8, -half - 0.22, zc - ra * 0.74, 0.19, 0.23), 0.12);          // unterer Gelenkfortsatz
    if (o.dens) d = smin(d, cone(x, y, z, 0, half - 0.1, 0.15, 0, half + 1.25, 0.2, 0.36, 0.28), 0.2);    // Zahn des Axis
    return smax(d, -(Math.sqrt((x * 0.82) ** 2 + (z - zc) ** 2) - ra * 0.74), 0.07);                     // Wirbelkanal
  };
  const xm = Math.max(t1x, 1.1) + 0.5;
  return { f, b: [-xm, Math.min(s1y, -half - 0.5) - 0.45, Math.min(s1z, t1z) - 0.45, xm, half + (o.dens ? 1.95 : 0.75), az + 0.35], cell: 1 / 12 };
}
function atlas() {
  const f = (x, y, z) => {
    const X = Math.abs(x), q = Math.sqrt((x / 1.22) ** 2 + (z + 0.35) ** 2);
    let d = Math.sqrt((q - 1) ** 2 + (y * 1.25) ** 2) - 0.2;                                            // Ring
    d = smin(d, ell(X, y, z, 0.86, 0, -0.2, 0.36, 0.42, 0.5), 0.15);                                     // Seitenmassen
    d = smin(d, cone(X, y, z, 1.15, 0, -0.3, 1.95, 0, -0.42, 0.2, 0.15), 0.12);                          // Querfortsätze
    d = smin(d, ell(X, y, z, 0, 0, 0.68, 0.2, 0.2, 0.2), 0.1);
    return smin(d, ell(X, y, z, 0, 0, -1.38, 0.2, 0.22, 0.22), 0.1);
  };
  return { f, b: [-2.5, -0.85, -1.95, 2.5, 0.85, 1.25], cell: 1 / 12 };
}
function sacrum(h) {
  const H = h / 2, zc = (u) => -0.9 * Math.pow(u, 1.6), wd = (u) => 5.7 - 4.4 * Math.pow(u, 0.85), dp = (u) => 1.75 - u;
  const f = (x, y, z) => {
    const X = Math.abs(x), u = Math.min(1, Math.max(0, (H - y) / h)), rip = 1 + 0.045 * Math.cos(u * 31.416);
    const w = wd(u) * rip, p = dp(u) * rip;
    const q = Math.pow(Math.pow(X / w, 2.6) + Math.pow(Math.abs(z - zc(u)) / p, 2.6), 1 / 2.6);
    let d = smax((q - 1) * Math.min(w, p), Math.abs(y) - H, 0.6);                                        // Keil, nach hinten gekrümmt
    d = smin(d, ell(X, y, z, 0, H - 0.5, 0.5, 2.5, 1, 1.9), 0.6);                                        // Deckplatte S1
    d = smin(d, ell(X, y, z, 2.3, H + 0.4, -2.2, 0.7, 1, 0.7), 0.4);                                     // obere Gelenkfortsätze
    for (let i = 0; i < 4; i++) {
      const yy = H - (1.4 + 2.4 * i), ui = (H - yy) / h;
      d = smin(d, ell(x, y, z, 0, yy, zc(ui) - dp(ui) - 0.1, 0.55, 0.9, 0.55), 0.4);                     // mittlere Leiste (verschmolzene Dornfortsätze)
      d = smax(d, -(Math.sqrt((X - (2.35 - 0.28 * i)) ** 2 + (y - (H - 2.7 - 2.25 * i)) ** 2) - (0.62 - 0.07 * i)), 0.25);   // Kreuzbeinlöcher
    }
    return d;
  };
  return { f, b: [-6.5, -H - 0.7, -5.8, 6.5, H + 1.9, 3.3], cell: 0.3 };
}
function coccyx(h) {
  const H = h / 2;
  const f = (x, y, z) => {
    let d = 9;
    for (let i = 0; i < 4; i++) d = smin(d, ell(x, y, z, 0, H - 0.4 - i * 0.74, 0.9 * Math.pow(i / 3, 1.6), 0.75 - 0.15 * i, 0.5 - 0.06 * i, 0.5 - 0.09 * i), 0.2);
    return d;
  };
  return { f, b: [-1.15, -H - 0.3, -0.8, 1.15, H + 0.3, 1.7], cell: 0.13 };
}
// Alle Wirbelformen (je Bauart ein Netz, wird je Höhe passend skaliert)
export function* vertebraGeos() {
  const out = {};
  for (const k of Object.keys(TYPES)) {
    const d = k === 'atlas' ? atlas() : k === 's' ? sacrum(TYPES.s.hh) : k === 'co' ? coccyx(TYPES.co.hh) : vertebra(TYPES[k]);
    out[k] = yield* meshGen(d.f, d.b, d.cell);
  }
  return out;
}
// Bandscheibe zwischen zwei Wirbeln
export function discGeo(R, t, az) {
  const p = [new THREE.Vector2(0, -t / 2)], n = 7;
  for (let i = 0; i <= n; i++) { const a = (i / n) * Math.PI; p.push(new THREE.Vector2(R * (0.9 + 0.1 * Math.sin(a)), (-t / 2) * Math.cos(a))); }
  p.push(new THREE.Vector2(0, t / 2));
  const g = new THREE.LatheGeometry(p, 40); g.scale(1, 1, az);
  return g;
}
// Nervenwurzeln: aus dem Kanal durch das Zwischenwirbelloch nach außen-unten
export function rootCurves(sp) {
  const res = [];
  sp.levels.forEach((lv) => {
    if (lv.reg === 'co' || lv.reg === 's') return;
    const R = lv.R, y0 = -lv.h / 2 - lv.disc * 0.4, k = lv.reg === 'l' ? 1.7 : lv.reg === 'c' ? 1.5 : 1.15;
    for (const s of [1, -1]) res.push({ id: lv.id, y: lv.center.y, curve: new THREE.CatmullRomCurve3([
      lv.pt(s * 0.2 * R, y0 + 0.1, lv.zc), lv.pt(s * R * 0.95, y0 - 0.1 * R, lv.zc + 0.25 * R),
      lv.pt(s * R * 1.9, y0 - 0.55 * R * k, lv.zc + 0.8 * R), lv.pt(s * R * (2.6 + 0.5 * k), y0 - 1.7 * R * k, lv.zc + 1.4 * R),
    ]) });
  });
  const S = sp.byId('S');                               // Kreuzbeinnerven treten vorn aus den Löchern
  for (let i = 0; i < 4; i++) for (const s of [1, -1]) {
    const y = S.h / 2 - 2.7 - 2.25 * i, x = s * (2.35 - 0.28 * i);
    res.push({ id: 'S', y: S.center.y, curve: new THREE.CatmullRomCurve3([S.pt(x * 0.3, y + 0.4, -1.3), S.pt(x, y, 0.3), S.pt(x * 1.7, y - 1.6, 2.2), S.pt(x * 2.4, y - 4, 2.6)]) });
  }
  return res;
}
// Rippen: Bögen von den Brustwirbeln nach vorn, laufen nach vorn hin aus (kein Brustbein nötig)
export function ribCurves(sp) {
  const W = [5.6, 7.6, 9.2, 10.4, 11.3, 12, 12.4, 12.5, 12.3, 11.6, 10.2, 8.4], res = [];
  for (let i = 0; i < 12; i++) {
    const lv = sp.byId('Th' + (i + 1)), c = lv.center, th1 = (i < 7 ? 150 : i < 10 ? 135 - (i - 7) * 8 : i === 10 ? 100 : 85) * (Math.PI / 180), th0 = 0.24, drop = 3.5 + i * 0.55;
    for (const s of [1, -1]) {
      const pts = [];
      for (let k = 0; k <= 12; k++) { const th = th0 + (th1 - th0) * (k / 12); pts.push(V(s * W[i] * Math.sin(th), c.y + 0.5 - drop * Math.pow((th - th0) / 2.38, 1.15), c.z + 6.6 - 7.4 * Math.cos(th))); }
      res.push({ id: lv.id, y: c.y, r: i > 9 ? 0.34 : 0.42, curve: new THREE.CatmullRomCurve3(pts) });
    }
  }
  return res;
}

// ---------- Becken, Beine, Füße, Arme, Hände (rechte Seite gerechnet, linke gespiegelt) -----------------
export function joints(P0) {
  const hz = P0.z + 4.8;
  return { hip: V(8.9, P0.y - 10.6, hz), knee: V(8.4, 47.5, hz - 0.6), ank: V(8, 9.3, hz - 3.6), sho: V(19.5, 147, P0.z - 2), elb: V(23, 118, P0.z - 3), wri: V(24.6, 93.2, P0.z + 0.6) };
}
function pelvis(P0) {
  const e1 = V(0.54, 0, 0.84).normalize(), n = V().crossVectors(e1, V(0.28, 0.96, 0)).normalize(), e2 = V().crossVectors(n, e1);
  const c = V(8.3, 0.3, 0.2), J = joints(P0), hx = J.hip.x, hy = J.hip.y - P0.y, hz = J.hip.z - P0.z;
  const f = (x, y0, z0) => {
    const X = Math.abs(x), y = y0 - P0.y, z = z0 - P0.z;
    const px = X - c.x, py = y - c.y, pz = z - c.z, a = px * e1.x + py * e1.y + pz * e1.z, b = px * e2.x + py * e2.y + pz * e2.z, t = px * n.x + py * n.y + pz * n.z;
    const nar = 0.55 + 0.45 * Math.min(1, Math.max(0, (b + 6.6) / 9)), aw = a / nar;                    // Schaufel wird nach unten schmaler (Fächerform)
    let d = ell(aw, b, t, 0, 0, 0, 8.2, 6.6, 1.15) * nar;                                                // Beckenschaufel
    if (b > -2) d = smin(d, Math.sqrt(((Math.sqrt((aw / 8.2) ** 2 + (b / 6.6) ** 2) - 1) * 6.6) ** 2 + t * t) - 0.8, 0.6);   // Beckenkamm
    d = smin(d, ell(X, y, z, 8.9, -7.2, 3.2, 3.5, 4.6, 3.2), 1.4);                                       // Körper um die Hüftpfanne
    d = smin(d, cone(X, y, z, 8.3, -10.5, 1.8, 6.4, -17.2, -1.2, 2, 2.3), 1);                             // Sitzbein
    d = smin(d, cone(X, y, z, 7.6, -10.2, 6.2, 1.3, -12.6, 9.4, 1.2, 1.15), 0.9);                         // oberer Schambeinast
    d = smin(d, ell(X, y, z, 1.2, -13.6, 9.2, 1.25, 2.1, 1.2), 0.6);                                      // Schambein
    d = smin(d, cone(X, y, z, 1.7, -15.2, 8.5, 5.9, -18, 0.2, 0.95, 1.1), 0.8);                           // unterer Ast
    return smax(d, -(Math.sqrt((X - hx) ** 2 + (y - hy) ** 2 + (z - hz) ** 2) - 2.75), 0.5);              // Hüftpfanne
  };
  return { f, b: [-16.5, P0.y - 21, P0.z - 9.5, 16.5, P0.y + 8.6, P0.z + 11.6], cell: 0.48 };
}
function femur(J) {
  const h = J.hip, k = J.knee, my = (h.y + k.y) / 2;
  const f = (x, y, z) => {
    let d = Math.sqrt((x - h.x) ** 2 + (y - h.y) ** 2 + (z - h.z) ** 2) - 2.35;                           // Hüftkopf
    d = smin(d, cone(x, y, z, h.x, h.y, h.z, h.x + 4.4, h.y - 2.6, h.z - 0.7, 1.5, 1.6), 0.6);            // Schenkelhals
    d = smin(d, ell(x, y, z, h.x + 5.3, h.y - 1.6, h.z - 1.3, 1.6, 2.6, 1.9), 0.8);                       // großer Rollhügel
    d = smin(d, ell(x, y, z, h.x + 2.6, h.y - 6.4, h.z - 1.6, 1, 1.2, 1), 0.6);                           // kleiner Rollhügel
    d = smin(d, cone(x, y, z, h.x + 4.3, h.y - 4.5, h.z - 0.8, h.x + 2.2, my, h.z + 1.4, 1.6, 1.42), 0.8);
    d = smin(d, cone(x, y, z, h.x + 2.2, my, h.z + 1.4, k.x, k.y + 5.5, k.z + 0.3, 1.42, 1.75), 0.8);     // Schaft, leicht nach vorn gebogen
    d = smin(d, ell(x, y, z, k.x, k.y + 3.4, k.z, 3.5, 3.6, 2.7), 1);
    d = smin(d, ell(x, y, z, k.x + 2.05, k.y + 1.4, k.z - 0.7, 1.85, 2.3, 3.1), 0.5);                     // Gelenkrollen
    d = smin(d, ell(x, y, z, k.x - 2.05, k.y + 1.4, k.z - 0.7, 1.85, 2.3, 3.1), 0.5);
    return Math.min(d, ell(x, y, z, k.x, k.y + 2.4, k.z + 4.3, 2.1, 2.3, 1.05));                          // Kniescheibe
  };
  return { f, b: [k.x - 4.6, k.y - 1.6, h.z - 4.6, h.x + 7.6, h.y + 3, h.z + 6.3], cell: 0.42 };
}
function shin(J) {
  const k = J.knee, a = J.ank;
  const f = (x, y, z) => {
    let d = ell(x, y, z, k.x, k.y - 1.5, k.z - 0.2, 3.75, 1.7, 2.8);                                      // Schienbeinkopf
    d = smin(d, ell(x, y, z, k.x, k.y - 4.3, k.z + 2, 1.3, 1.9, 1.1), 0.7);
    d = smin(d, cone(x, y, z, k.x, k.y - 3.2, k.z + 0.5, a.x, a.y + 3.5, a.z + 0.2, 1.75, 1.2), 0.9);
    d = smin(d, ell(x, y, z, a.x, a.y + 1.6, a.z, 2.3, 1.9, 1.9), 0.8);
    d = smin(d, ell(x, y, z, a.x - 2, a.y - 0.9, a.z + 0.1, 0.95, 1.6, 1.25), 0.5);                       // Innenknöchel
    let g = ell(x, y, z, k.x + 3.7, k.y - 4.4, k.z - 1.9, 1, 1.3, 1);                                     // Wadenbein
    g = smin(g, cone(x, y, z, k.x + 3.7, k.y - 5, k.z - 1.9, a.x + 2.5, a.y + 1.5, a.z - 0.9, 0.62, 0.6), 0.4);
    g = smin(g, ell(x, y, z, a.x + 2.6, a.y - 1.6, a.z - 0.8, 1, 2, 1.25), 0.4);                          // Außenknöchel
    return Math.min(d, g);
  };
  return { f, b: [k.x - 4.7, a.y - 4.3, a.z - 3.3, k.x + 5.5, k.y + 0.9, k.z + 4.1], cell: 0.4 };
}
function foot(J) {
  const ax = J.ank.x, az = J.ank.z;
  const MB = [[-2.1, 5, 8], [-0.6, 5.5, 8], [0.6, 5.1, 8.1], [1.75, 4.3, 7.6], [2.75, 3.3, 6.9]], MH = [[-2.9, 1.55, 14.4], [-1.15, 1.35, 14.9], [0.35, 1.3, 14.5], [1.85, 1.25, 13.8], [3.2, 1.2, 12.9]];
  const RB = [0.95, 0.62, 0.6, 0.6, 0.62], RH = [1.05, 0.7, 0.68, 0.66, 0.68], FAN = [-0.05, 0, 0.03, 0.06, 0.1], SC = [1, 1, 0.95, 0.88, 0.78];
  const f = (x, y, z) => {
    const lx = x - ax, lz = z - az;
    let d = ell(lx, y, lz, 0, 7.4, 0.9, 2.05, 1.7, 2.9);                                                  // Sprungbein
    d = smin(d, cone(lx, y, lz, 0.2, 5.3, 0.2, 0.3, 2.9, -5, 1.9, 2.25), 0.3);                            // Fersenbein
    d = smin(d, ell(lx, y, lz, -0.9, 6.3, 4.4, 1.85, 1.35, 1), 0.22);                                     // Kahnbein
    d = smin(d, ell(lx, y, lz, 1.8, 4.3, 4.9, 1.45, 1.25, 1.8), 0.22);                                    // Würfelbein
    d = smin(d, ell(lx, y, lz, -2, 5.6, 6.5, 0.9, 1.15, 1.15), 0.2);                                      // Keilbeine
    d = smin(d, ell(lx, y, lz, -0.5, 6, 6.6, 0.8, 1.05, 1.05), 0.2);
    d = smin(d, ell(lx, y, lz, 0.8, 5.5, 6.7, 0.8, 1, 1.1), 0.2);
    for (let i = 0; i < 5; i++) {
      const b = MB[i], h = MH[i];
      d = smin(d, cone(lx, y, lz, b[0], b[1], b[2], h[0], h[1], h[2], RB[i], RH[i]), 0.18);               // Mittelfußknochen
      const L = i === 0 ? [3, 2.4] : [2.3 * SC[i], 1.3 * SC[i], 1 * SC[i]], r0 = i === 0 ? 0.8 : 0.55;
      let px = h[0], py = h[1] - 0.15, pz = h[2] + 0.5;
      for (let j = 0; j < L.length; j++) {                                                               // Zehenglieder
        const qx = px + FAN[i] * L[j], qy = Math.max(0.75, py - 0.18), qz = pz + L[j] - 0.3;
        d = smin(d, cone(lx, y, lz, px, py, pz, qx, qy, qz, r0 * (1 - 0.14 * j), r0 * (0.86 - 0.14 * j)), 0.1);
        px = qx; py = qy; pz = qz + 0.3;
      }
    }
    return d;
  };
  return { f, b: [ax - 4.7, 0, az - 8, ax + 5.1, 9.8, az + 22.6], cell: 0.3 };
}
function arm(J) {
  const s = J.sho, e = J.elb, w = J.wri;
  const f = (x, y, z) => {
    let d = Math.sqrt((x - s.x) ** 2 + (y - s.y) ** 2 + (z - s.z) ** 2) - 2.3;                            // Oberarmkopf
    d = smin(d, cone(x, y, z, s.x + 0.6, s.y - 2.5, s.z, e.x, e.y + 2.5, e.z, 1.25, 1.1), 0.8);
    d = smin(d, ell(x, y, z, e.x, e.y + 0.8, e.z, 2.7, 1.5, 1.4), 0.7);                                   // Gelenkrolle am Ellenbogen
    let g = cone(x, y, z, e.x + 1.3, e.y - 1.2, e.z + 0.6, w.x + 0.7, w.y + 1, w.z + 0.3, 0.75, 1.1);     // Speiche
    g = smin(g, ell(x, y, z, e.x + 1.3, e.y - 0.8, e.z + 0.6, 1.05, 0.9, 1.05), 0.3);
    let u = cone(x, y, z, e.x - 0.9, e.y - 0.4, e.z - 0.9, w.x - 1, w.y + 1, w.z - 0.7, 1, 0.6);          // Elle
    u = smin(u, ell(x, y, z, e.x - 1, e.y + 0.9, e.z - 1.5, 1, 1.6, 1.1), 0.4);
    return Math.min(d, g, u);
  };
  return { f, b: [s.x - 3, w.y - 0.6, e.z - 3.2, w.x + 2.6, s.y + 3, s.z + 3.2], cell: 0.42 };
}
function hand(J) {
  const w = J.wri;
  // Finger zeigen nach unten, Daumen nach vorn; Handfläche zum Körper
  const ZB = [2.3, 1.25, 0.35, -0.55, -1.35], ML = [4.2, 6.4, 6, 5.4, 5], PL = [[3, 2.6], [4.2, 2.5, 1.8], [4.6, 2.9, 1.9], [4.2, 2.7, 1.8], [3.3, 2, 1.6]], DZ = [0.45, 0.1, 0.02, -0.06, -0.14];
  const f = (x, y, z) => {
    const lx = x - w.x, ly = y - w.y, lz = z - w.z;
    let d = ell(lx, ly, lz, -0.1, -1.2, 0.3, 1.05, 1.5, 2.5);                                             // Handwurzel
    for (let i = 0; i < 5; i++) {
      let px = -0.1, py = i === 0 ? -1.4 : -2.4, pz = ZB[i] * (i === 0 ? 0.9 : 1);
      const segs = [ML[i], ...PL[i]];
      for (let j = 0; j < segs.length; j++) {
        const curl = 0.05 * j, qx = px - curl * segs[j] - 0.02 * segs[j], qy = py - segs[j] * (i === 0 ? 0.78 : 0.98), qz = pz + DZ[i] * segs[j] * (i === 0 ? 1.5 : 1);
        const r = (j === 0 ? 0.56 : 0.5 - 0.05 * j) * (i === 0 ? 1.15 : 1);
        d = smin(d, cone(lx, ly, lz, px, py, pz, qx, qy + 0.25, qz, r, r * 0.86), j === 0 ? 0.25 : 0.1);
        d = smin(d, ell(lx, ly, lz, qx, qy + 0.1, qz, r * 1.12, r * 1.05, r * 1.12), 0.08);                // Gelenkköpfchen
        px = qx; py = qy; pz = qz;
      }
    }
    return d;
  };
  return { f, b: [w.x - 3.2, w.y - 21.5, w.z - 3.6, w.x + 1.8, w.y + 1, w.z + 7.2], cell: 0.27 };
}
function girdle(J, P0) {                               // Schlüsselbein und Schulterblatt (beide Seiten in einem Netz)
  const s = J.sho, n = V(0.36, 0.08, -0.93).normalize(), e1 = V().crossVectors(V(0, 1, 0), n).normalize(), e2 = V().crossVectors(n, e1), c = V(12.2, 139.5, P0.z - 9.2);
  const f = (x, y, z) => {
    const X = Math.abs(x);
    let d = cone(X, y, z, 1.6, 150.2, P0.z + 5.6, 9, 151.6, P0.z + 4.6, 0.75, 0.62);                      // Schlüsselbein (S-Schwung)
    d = smin(d, cone(X, y, z, 9, 151.6, P0.z + 4.6, s.x - 1.2, 151.4, s.z + 1, 0.62, 0.72), 0.5);
    const px = X - c.x, py = y - c.y, pz = z - c.z;
    let g = ell(px * e1.x + py * e1.y + pz * e1.z, px * e2.x + py * e2.y + pz * e2.z, px * n.x + py * n.y + pz * n.z, 0, 0, 0, 5.4, 8.2, 0.85);   // Schulterblatt
    g = smin(g, cone(X, y, z, 8.5, 146.5, P0.z - 9.6, s.x + 0.6, 150.6, s.z - 1.2, 0.7, 0.95), 0.6);      // Schultergräte → Schulterhöhe
    return Math.min(d, g);
  };
  return { f, b: [-23, 129.5, P0.z - 12.5, 23, 153.6, P0.z + 7.2], cell: 0.42 };
}
// Glashülle der Figur (Haut), endet weich am Hals – der Kopf ist das Bild
function hull(P0) {
  const z0 = P0.z;
  const f = (x, y, z0b) => {
    const X = Math.abs(x), z = z0b - z0;
    let d = ell(X, y, z, 0, 95, 2.5, 17.5, 12.5, 11);                                                    // Becken
    d = smin(d, ell(X, y, z, 0, 113, 2.5, 14.5, 12.5, 10), 5);                                            // Taille
    d = smin(d, ell(X, y, z, 0, 133, 0.5, 16.5, 17, 11.5), 5);                                            // Brustkorb
    d = smin(d, cone(X, y, z, 0, 150, -1.5, 18, 149.5, -2, 6, 5.4), 4);                                   // Schultern
    d = smin(d, cone(X, y, z, 0, 152, -1, 0, 166, 0.5, 5.6, 5.2), 3);                                     // Hals
    d = smin(d, cone(X, y, z, 9.5, 90, 2.5, 8.3, 50, 1.5, 8.7, 5.7), 3.5);                                // Oberschenkel
    d = smin(d, cone(X, y, z, 8.3, 46, 0.3, 8, 12, -3, 5.6, 3.3), 2.5);
    d = smin(d, ell(X, y, z, 8.3, 36, -3.4, 4.6, 9, 5), 2.5);                                             // Wade
    d = smin(d, ell(X, y, z, 8.2, 3.6, 3.2, 4.6, 3.7, 12.6), 2.2);                                        // Fuß
    d = smin(d, cone(X, y, z, 21, 146, -2, 23.2, 118, -3, 4.7, 3.9), 3);                                  // Oberarm
    d = smin(d, cone(X, y, z, 23.2, 118, -3, 24.6, 94, 0.5, 3.8, 2.7), 2);                                // Unterarm
    return smin(d, ell(X, y, z, 24.6, 84, 2, 1.9, 9, 4.4), 2);                                            // Hand
  };
  return { f, b: [-30.5, -1, z0 - 15.5, 30.5, 172.5, z0 + 17.5], cell: 1.25 };
}
function mirror(g) {                                    // linke Seite = gespiegelte rechte
  const m = g.clone(), p = m.attributes.position.array, n = m.attributes.normal.array, ix = m.index.array;
  for (let i = 0; i < p.length; i += 3) { p[i] = -p[i]; n[i] = -n[i]; }
  for (let i = 0; i < ix.length; i += 3) { const t = ix[i + 1]; ix[i + 1] = ix[i + 2]; ix[i + 2] = t; }
  return m;
}
// Alles unterhalb und neben der Wirbelsäule; liefert Liste { name, geo, y = Oberkante }
export function* bodyGeos(P0) {
  const J = joints(P0), out = [];
  const one = function* (name, d, y, both) { const g = yield* meshGen(d.f, d.b, d.cell); out.push({ name, geo: g, y }); if (both) out.push({ name, geo: mirror(g), y }); };
  yield* one('pelvis', pelvis(P0), P0.y + 8, false);
  yield* one('femur', femur(J), J.hip.y + 3, true);
  yield* one('shin', shin(J), J.knee.y + 1, true);
  yield* one('foot', foot(J), 10, true);
  yield* one('girdle', girdle(J, P0), 154, false);
  yield* one('arm', arm(J), J.sho.y + 3, true);
  yield* one('hand', hand(J), J.wri.y + 1, true);
  yield* one('hull', hull(P0), 172, false);
  return out;
}
// Ischiasnerv und Schienbeinnerv bis in die Fußsohle
export function legNerve(sp, s) {
  const J = joints(sp.P0), h = J.hip, k = J.knee, a = J.ank, L5 = sp.byId('L5'), S = sp.byId('S');
  return new THREE.CatmullRomCurve3([
    L5.pt(s * 0.6, -1, L5.zc), S.pt(s * 3, 2.5, 0.8), V(s * (h.x - 2.2), h.y - 3.5, h.z - 5.6), V(s * (h.x - 0.4), 72, h.z - 3.6),
    V(s * k.x, k.y + 3, k.z - 4.3), V(s * (k.x - 0.2), 30, a.z - 3.2), V(s * (a.x - 2.4), 7, a.z - 2), V(s * (a.x - 0.6), 1.9, a.z + 5), V(s * (a.x - 0.9), 1.3, a.z + 13),
  ]);
}
