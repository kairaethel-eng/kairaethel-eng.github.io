// Prozedurale, anatomisch vereinfachte Wirbelsäule (C1–L5, Kreuzbein, Steißbein).
// Kein externes 3D-Modell → keine Lizenzfragen, wenige KB Code.
// Lokales Koordinatensystem je Wirbel: y = kranial (oben), +z = ventral (vorne), -z = dorsal.
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const UP = V(0, 1, 0);

// ---------- Ebenen (Wirbel) mit Maßen ----------
export function buildLevels() {
  const L = [];
  for (let i = 0; i < 7; i++) L.push({ id: 'C' + (i + 1), reg: 'c', R: 0.2 + i * 0.012, h: i === 0 ? 0.14 : 0.17, disc: i === 0 ? 0.02 : 0.055 });
  for (let i = 0; i < 12; i++) L.push({ id: 'Th' + (i + 1), reg: 't', R: 0.28 + i * 0.011, h: 0.22 + i * 0.009, disc: 0.06 });
  for (let i = 0; i < 5; i++) L.push({ id: 'L' + (i + 1), reg: 'l', R: 0.43 + i * 0.016, h: 0.34 + i * 0.01, disc: 0.1 });
  L.push({ id: 'S', reg: 's', R: 0.5, h: 1.05, disc: 0.05 });
  L.push({ id: 'Co', reg: 'co', R: 0.16, h: 0.36, disc: 0 });
  return L;
}

// Zonen wie in V10 (Nervenversorgung)
export function zoneOf(id) {
  const n = parseInt(id.replace(/\D/g, ''), 10);
  if (id.startsWith('C')) return n <= 2 ? 'c12' : n <= 4 ? 'c34' : n <= 6 ? 'c56' : 'c7t1';
  if (id.startsWith('Th')) return n === 1 ? 'c7t1' : n <= 6 ? 'th16' : 'th712';
  if (id.startsWith('L')) return n <= 3 ? 'l13' : 'l45';
  return 's1';
}

// ---------- Geometrie-Bausteine ----------
function roundedProfile(R, h, steps = 9, inset = 0.86) {
  // Rundliches Profil eines Wirbelkörpers mit leichter Taille
  const pts = [new THREE.Vector2(0, -h / 2)];
  const r0 = R * inset, e = Math.min(h * 0.22, R * 0.2);
  for (let i = 0; i <= steps; i++) {
    const a = (i / steps) * Math.PI / 2;
    pts.push(new THREE.Vector2(r0 + (R - r0) * Math.sin(a), -h / 2 + e * (1 - Math.cos(a))));
  }
  pts.push(new THREE.Vector2(R * 0.955, 0));
  for (let i = steps; i >= 0; i--) {
    const a = (i / steps) * Math.PI / 2;
    pts.push(new THREE.Vector2(r0 + (R - r0) * Math.sin(a), h / 2 - e * (1 - Math.cos(a))));
  }
  pts.push(new THREE.Vector2(0, h / 2));
  return pts;
}

function capsuleBetween(start, dir, len, rad, flat) {
  const g = new THREE.CapsuleGeometry(rad, Math.max(len - 2 * rad, 0.001), 4, 10);
  if (flat) g.scale(flat[0], 1, flat[1]);
  const q = new THREE.Quaternion().setFromUnitVectors(UP, dir.clone().normalize());
  g.applyQuaternion(q);
  const c = start.clone().add(dir.clone().normalize().multiplyScalar(len / 2));
  g.translate(c.x, c.y, c.z);
  return g;
}

// Kegelförmiger Fortsatz mit runder Spitze (natürlicher als eine Kapsel)
function taperBetween(start, dir, len, r0, r1, flat) {
  const parts = [];
  const c = new THREE.CylinderGeometry(r1, r0, len, 12, 1, false);
  c.translate(0, len / 2, 0);
  const tip = new THREE.SphereGeometry(r1 * 1.15, 12, 8); tip.translate(0, len, 0);
  const base = new THREE.SphereGeometry(r0, 12, 8);
  [c, tip, base].forEach((g) => { if (flat) g.scale(flat[0], 1, flat[1]); parts.push(g.toNonIndexed()); });
  const g = mergeGeometries(parts);
  g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(UP, dir.clone().normalize()));
  g.translate(start.x, start.y, start.z);
  return g;
}

function sphereAt(p, r, s = [1, 1, 1]) {
  const g = new THREE.SphereGeometry(r, 14, 10);
  g.scale(s[0], s[1], s[2]);
  g.translate(p.x, p.y, p.z);
  return g;
}

function deg(d) { return d * Math.PI / 180; }

export function vertebraGeometry(lv) {
  const { R, h, reg, id } = lv;
  const parts = [];
  const n = parseInt(id.replace(/\D/g, ''), 10) || 0;

  if (id === 'C1') {
    // Atlas: Ring ohne Wirbelkörper, kräftige Seitenmassen
    const ring = new THREE.TorusGeometry(R * 0.78, R * 0.13, 10, 36);
    ring.rotateX(Math.PI / 2); ring.scale(1.12, 1, 1); ring.translate(0, 0, -R * 0.35);
    parts.push(ring);
    parts.push(sphereAt(V(R * 0.7, 0, -R * 0.12), R * 0.26, [1, 0.8, 1.15]));
    parts.push(sphereAt(V(-R * 0.7, 0, -R * 0.12), R * 0.26, [1, 0.8, 1.15]));
    parts.push(capsuleBetween(V(R * 0.85, 0, -R * 0.15), V(1, 0, -0.1), R * 0.75, R * 0.1));
    parts.push(capsuleBetween(V(-R * 0.85, 0, -R * 0.15), V(-1, 0, -0.1), R * 0.75, R * 0.1));
    parts.push(sphereAt(V(0, 0, R * 0.45), R * 0.16)); // Tuberculum anterius
    return mergeGeometries(parts.map(g => g.toNonIndexed()));
  }

  if (reg === 's') {
    // Kreuzbein: fünf verschmolzene, kleiner werdende Segmente mit Flügeln (Alae), nach dorsal gekrümmt
    const n = 5, seg = h / n;
    for (let i = 0; i < n; i++) {
      const f = i / (n - 1), r = R * (1 - f * 0.62), y = h / 2 - seg * (i + 0.5), z = -Math.pow(f, 1.6) * R * 0.9;
      const b = new THREE.LatheGeometry(roundedProfile(r, seg * 1.12, 6, 0.9), 30);
      b.scale(1.25 - f * 0.2, 1, 0.62);
      b.rotateX(-f * 0.35);
      b.translate(0, y, z);
      parts.push(b.toNonIndexed());
      // seitliche Massen, oben breit (Alae), nach unten schmaler
      const wing = R * (1.05 - f * 0.75);
      for (const sx of [1, -1]) parts.push(sphereAt(V(sx * wing, y, z - r * 0.2), r * (0.62 - f * 0.25), [1.5, 0.95 + (i === 0 ? 0.6 : 0), 0.8]).toNonIndexed());
      // Dornfortsatz-Höcker (Crista sacralis mediana)
      parts.push(sphereAt(V(0, y, z - r * 0.78), r * 0.18, [0.8, 1.4, 1]).toNonIndexed());
    }
    return mergeGeometries(parts);
  }

  if (reg === 'co') {
    for (let i = 0; i < 3; i++) parts.push(sphereAt(V(0, h * 0.35 - i * h * 0.33, -i * 0.05), R * (1 - i * 0.25), [1.1, 0.75, 0.9]));
    return mergeGeometries(parts.map(g => g.toNonIndexed()));
  }

  // --- regulärer Wirbel ---
  const body = new THREE.LatheGeometry(roundedProfile(R, h), 36);
  body.scale(reg === 'l' ? 1.12 : 1, 1, reg === 'c' ? 0.72 : 0.8);
  parts.push(body);

  // Wirbelbogen (Ring um den Wirbelkanal)
  const ra = R * (reg === 'c' ? 0.62 : 0.52);
  const ring = new THREE.TorusGeometry(ra, R * 0.105, 10, 30);
  ring.rotateX(Math.PI / 2); ring.scale(reg === 'c' ? 1.2 : 1, 1, 0.9);
  ring.translate(0, 0, -R * 0.98);
  parts.push(ring);
  const back = -R * 0.98 - ra * 0.9;

  // Dornfortsatz
  let spLen, spRad, spA, flat = null;
  if (reg === 'c') { spLen = R * (id === 'C7' ? 1.15 : 0.62); spRad = R * 0.075; spA = deg(id === 'C7' ? 18 : 22); }
  else if (reg === 't') { spLen = R * 1.35; spRad = R * 0.07; spA = deg(n < 4 ? 35 : n < 10 ? 58 : 32); }
  else { spLen = R * 0.95; spRad = R * 0.085; spA = deg(8); flat = [0.6, 1.9]; }
  parts.push(taperBetween(V(0, 0, back + R * 0.05), V(0, -Math.sin(spA), -Math.cos(spA)), spLen, spRad * 1.9, spRad * 0.85, flat));
  if (id === 'C2') parts.push(capsuleBetween(V(0, h * 0.5, R * 0.05), V(0, 1, -0.05), h * 1.35, R * 0.18)); // Dens axis

  // Querfortsätze
  let tpLen, tpB, tpUp;
  if (reg === 'c') { tpLen = R * 0.62; tpB = deg(10); tpUp = 0; }
  else if (reg === 't') { tpLen = R * 0.9; tpB = deg(38); tpUp = 0.12; }
  else { tpLen = R * 1.05; tpB = deg(8); tpUp = 0; }
  for (const s of [1, -1]) {
    parts.push(taperBetween(V(s * ra * 0.75, 0, -R * 1.08), V(s * Math.cos(tpB), tpUp, -Math.sin(tpB)), tpLen, R * (reg === 'l' ? 0.11 : 0.12), R * (reg === 'l' ? 0.06 : 0.075)));
    // Gelenkfortsätze (Facetten) oben und unten
    parts.push(sphereAt(V(s * ra * 0.62, h * 0.42, -R * 1.18), R * 0.11, [1, 1.2, 1]));
    parts.push(sphereAt(V(s * ra * 0.62, -h * 0.42, -R * 1.22), R * 0.1, [1, 1.2, 1]));
  }
  return mergeGeometries(parts.map(g => (g.index ? g.toNonIndexed() : g)));
}

function discGeometry(R, t) {
  const g = new THREE.LatheGeometry(roundedProfile(R * 0.97, t, 6, 0.8), 36);
  g.scale(1, 1, 0.8);
  return g;
}

// ---------- Aufbau der ganzen Säule ----------
export function buildSpine(opts = {}) {
  const levels = buildLevels();
  let total = 0;
  levels.forEach(l => { l.s0 = total; total += l.h + l.disc; });
  const Ltot = total;
  // Physiologische Krümmungen: HWS-Lordose, BWS-Kyphose, LWS-Lordose, Sakralkyphose
  const ctrl = [[0, 0], [0.09, 0.2], [0.18, 0.04], [0.42, -0.42], [0.63, -0.03], [0.78, 0.38], [0.87, 0.2], [0.94, -0.22], [1, -0.55]];
  const curve = new THREE.CatmullRomCurve3(ctrl.map(([f, z]) => V(0, Ltot * (1 - f), z)), false, 'centripetal');

  const group = new THREE.Group();
  const out = { group, levels, Ltot, curve, vertebrae: [], discs: [], canal: [] };
  const tmpM = new THREE.Matrix4();

  levels.forEach((lv, i) => {
    const u = (lv.s0 + lv.h / 2) / Ltot;
    const p = curve.getPointAt(u), t = curve.getTangentAt(u).negate();
    const q = new THREE.Quaternion().setFromUnitVectors(UP, t);
    const geo = vertebraGeometry(lv);
    const mesh = new THREE.Mesh(geo, opts.boneMaterial ? opts.boneMaterial(lv, i) : new THREE.MeshStandardMaterial());
    mesh.position.copy(p); mesh.quaternion.copy(q);
    mesh.userData = { lv, home: p.clone(), homeQ: q.clone(), zone: zoneOf(lv.id) };
    group.add(mesh);
    out.vertebrae.push(mesh);
    lv.center = p.clone(); lv.quat = q.clone();
    // Kanal-Mittelpunkt (für Rückenmark)
    tmpM.compose(p, q, new THREE.Vector3(1, 1, 1));
    const canalZ = lv.reg === 's' ? -lv.R * 0.75 : lv.id === 'C1' ? -lv.R * 0.35 : -lv.R * 0.98;
    if (lv.reg !== 'co') out.canal.push(V(0, 0, canalZ).applyMatrix4(tmpM));

    if (lv.disc > 0.03 && i < levels.length - 2) {
      const ud = (lv.s0 + lv.h + lv.disc / 2) / Ltot;
      const pd = curve.getPointAt(ud), td = curve.getTangentAt(ud).negate();
      const d = new THREE.Mesh(discGeometry((lv.R + levels[i + 1].R) / 2, lv.disc * 1.15), opts.discMaterial || new THREE.MeshStandardMaterial());
      d.position.copy(pd); d.quaternion.setFromUnitVectors(UP, td);
      d.userData = { home: pd.clone(), afterId: lv.id, zone: zoneOf(levels[i + 1].id) };
      group.add(d); out.discs.push(d);
    }
  });
  return out;
}

// Nervenwurzeln je Wirbel (links/rechts) als Kurven in Weltkoordinaten der Säule
export function rootCurves(sp) {
  const res = [];
  sp.levels.forEach((lv) => {
    if (lv.reg === 'co') return;
    const m = new THREE.Matrix4().compose(lv.center, lv.quat, new THREE.Vector3(1, 1, 1));
    const R = lv.R, yb = lv.reg === 's' ? -lv.h * 0.1 : -lv.h / 2 - lv.disc / 2;
    const len = lv.reg === 'c' ? 1.1 : lv.reg === 't' ? 1.15 : lv.reg === 'l' ? 1.35 : 1.5;
    const drop = lv.reg === 'c' ? 0.3 : lv.reg === 't' ? 0.42 : lv.reg === 'l' ? 0.9 : 1.2;
    for (const s of [1, -1]) {
      const pts = [
        V(s * R * 0.12, yb + 0.02, -R * 0.95),
        V(s * R * 0.62, yb - 0.02, -R * 0.78),
        V(s * R * (0.9 + len * 0.35), yb - drop * 0.35, -R * 0.4),
        V(s * R * (0.9 + len * 0.9), yb - drop, R * 0.15),
      ].map(v => v.applyMatrix4(m));
      res.push({ id: lv.id, zone: zoneOf(lv.id), side: s, curve: new THREE.CatmullRomCurve3(pts) });
    }
  });
  return res;
}
