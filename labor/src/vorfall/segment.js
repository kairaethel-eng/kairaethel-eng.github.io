// Bandscheibenvorfall-Film: Geometrie des Bewegungssegments L4/L5.
// Wirbel L4 und L5 = echte Netze (BodyParts3D 4.0, CC BY 4.0, siehe daten.js). Die Bandscheibe wird aus dem Umriss der
// echten Bandscheibe neu aufgebaut, weil der Film ihr Inneres braucht: Faserring (Lamellen als Ringe), Gallertkern, Riss.
// Nervensack und Nervenwurzeln sind schematisch (Schläuche) an den gemessenen Wirbelkanal gelegt.
// Achsenkreuz (cm): Ursprung = Mitte der Bandscheibe, x seitlich (Patient links +), y nach oben, z nach vorn.
import * as THREE from 'three';
import { META, PARTS } from './daten.js';

const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));
const bytes = (s) => { const b = atob(s), u = new Uint8Array(b.length); for (let i = 0; i < b.length; i++) u[i] = b.charCodeAt(i); return u; };

function decodePart(p) {
  const q = new Int16Array(bytes(p.p).buffer), pos = new Float32Array(q.length);
  for (let i = 0; i < q.length; i++) pos[i] = q[i] / META.q;
  const idx = new Uint16Array(bytes(p.i).buffer);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setIndex(new THREE.BufferAttribute(idx, 1));
  g.computeVertexNormals();
  return g;
}

// fester Zufall: jedes Laden gleich (Standbilder, Vergleich)
export function rng(seed) {
  let s = seed >>> 0;
  return () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}

export const R_IN = 0.56, R_N = 0.5; // Faserring ab 56 % des Umrisses, Kern bis 50 %

export function buildSegment(mobile) {
  const rnd = rng(20261114);
  const L4 = decodePart(PARTS.L4), L5 = decodePart(PARTS.L5);
  const dq = new Int16Array(bytes(PARTS.disc.p).buffer), dn = dq.length / 3;

  // ---------- Umriss der echten Bandscheibe (Blick von oben): größter Abstand je Winkel, geglättet ----------
  const NB = 60, rad = new Float32Array(NB), top = new Float32Array(NB).fill(-9), bot = new Float32Array(NB).fill(9);
  const bin = (x, z) => Math.floor(((Math.atan2(x, z) + Math.PI) / (2 * Math.PI)) * NB) % NB;
  for (let i = 0; i < dn; i++) { const x = dq[i * 3] / META.q, z = dq[i * 3 + 2] / META.q, b = bin(x, z); rad[b] = Math.max(rad[b], Math.hypot(x, z)); }
  const fill = (a, bad) => { for (let b = 0; b < NB; b++) if (bad(a[b])) { let l = b, r = b; while (bad(a[(l + NB) % NB])) l--; while (bad(a[r % NB])) r++; a[b] = (a[(l + NB) % NB] + a[r % NB]) / 2; } };
  const blur = (a, n) => { for (let k = 0; k < n; k++) { const c = a.slice(); for (let b = 0; b < NB; b++) a[b] = (c[(b + NB - 1) % NB] + 2 * c[b] + c[(b + 1) % NB]) / 4; } };
  fill(rad, (v) => v < 0.5); blur(rad, 3);
  const lerpBin = (a, phi) => { const f = ((phi + Math.PI) / (2 * Math.PI)) * NB - 0.5, i = Math.floor(f), t = f - i; return a[(i + NB) % NB] * (1 - t) + a[(i + 1 + NB) % NB] * t; };
  const Rout = (phi) => lerpBin(rad, wrap(phi));
  // Ober- und Unterkante der Außenwand je Winkel (nur Punkte nahe am Rand)
  let cTop = 0, nTop = 0;
  for (let i = 0; i < dn; i++) {
    const x = dq[i * 3] / META.q, y = dq[i * 3 + 1] / META.q, z = dq[i * 3 + 2] / META.q, b = bin(x, z), r = Math.hypot(x, z);
    if (r > rad[b] * 0.8) { top[b] = Math.max(top[b], y); bot[b] = Math.min(bot[b], y); }
    if (r < rad[b] * 0.6 && y > 0) { cTop += y; nTop++; }
  }
  fill(top, (v) => v < -8); fill(bot, (v) => v > 8); blur(top, 2); blur(bot, 2);
  const yTop = (phi) => lerpBin(top, wrap(phi)), yBot = (phi) => lerpBin(bot, wrap(phi));
  // Schnittebene: knapp unter der niedrigsten Stelle der Oberkante (alles darüber blendet beim Öffnen aus)
  const cutY = Math.min(...top) - 0.06;

  // ---------- Wirbelkanal, Wurzel L5, Richtung des Vorfalls ----------
  const cA = META.L4.canal, cB = META.L5.canal;
  const canalZ = (y) => cA[2] + ((y - cA[1]) / (cB[1] - cA[1])) * (cB[2] - cA[2]);
  const canalW = (META.L4.canalW + META.L5.canalW) / 2;
  // hintere Kante der Bandscheibe bei seitlichem Abstand x
  const zPost = (x) => { let best = -2; for (let a = Math.PI / 2; a <= Math.PI; a += 0.01) { const r = Rout(a); if (r * Math.sin(a) <= x) { best = r * Math.cos(a); break; } } return best; };
  const rootX = Math.min(0.9, canalW - 0.12), root0 = V(rootX, 0, zPost(rootX) - 0.4);
  const PHI_D = Math.atan2(root0.x, root0.z); // mediolateral, links
  const D = V(Math.sin(PHI_D), 0, Math.cos(PHI_D)), DP = V(Math.cos(PHI_D), 0, -Math.sin(PHI_D));
  const RD = Rout(PHI_D);

  // ---------- Verformung: 0 gesund · 1 Vorwölbung (Risse von innen, Wand wölbt sich) · 2 Vorfall (Riss durch alle Ringe) ----------
  function ring(rho, phi, y, stage, noGap) {
    const R = rho * Rout(phi);
    if (!stage) return [R * Math.sin(phi), y, R * Math.cos(phi)];
    const dphi = wrap(phi - PHI_D), ad = Math.abs(dphi), sg = dphi < 0 ? -1 : 1;
    const tr = Math.min(1, Math.max(0, (rho - R_IN) / (1 - R_IN)));
    let gap = 0, bulge;
    if (stage === 1) {
      const depth = 0.68;
      if (tr < depth) gap = 0.02 + 0.09 * (1 - tr / depth);
      bulge = 0.25 * Math.exp(-((ad / 0.42) ** 2)) * (0.2 + 0.8 * tr);
    } else {
      gap = 0.115 - 0.03 * tr;
      bulge = 0.3 * Math.exp(-((ad / 0.4) ** 2)) * (0.3 + 0.7 * tr) + 0.1 * Math.exp(-((ad / 0.14) ** 2)) * tr;
    }
    const ga = noGap ? 0 : gap / R, nd = sg * (ad + ga * Math.exp(-ad / (ga * 1.6 + 1e-4))), ph = PHI_D + nd, R2 = R + bulge;
    return [R2 * Math.sin(ph), y, R2 * Math.cos(ph)];
  }
  const hot = (phi) => Math.exp(-((wrap(phi - PHI_D) / 0.26) ** 2));

  // ---------- Faserring: Schnittfläche (Ringe) + Außenwand (gekreuzte Fasern) ----------
  const A = { P: [], P2: [], P3: [], N: [], K: [], RND: [], TR: [], HOT: [] };
  const pushA = (rho, phi, y, kind, n) => {
    const p = ring(rho, phi, y, 0), p2 = ring(rho, phi, y, 1), p3 = ring(rho, phi, y, 2);
    A.P.push(...p); A.P2.push(...p2); A.P3.push(...p3); A.N.push(...n); A.K.push(kind); A.RND.push(rnd());
    A.TR.push((rho - R_IN) / (1 - R_IN)); A.HOT.push(hot(phi));
  };
  const SP = mobile ? 0.075 : 0.052; // Punktabstand auf den Ringen
  const RINGS = 9;
  for (let k = 0; k < RINGS; k++) {
    const rho = R_IN + ((1 - R_IN) * k) / (RINGS - 1) - (k === RINGS - 1 ? 0.012 : 0);
    let per = 0; for (let a = 0; a < 64; a++) per += rho * Rout((a / 64) * 2 * Math.PI) * ((2 * Math.PI) / 64);
    const n = Math.round(per / SP), o = rnd();
    for (let i = 0; i < n; i++) pushA(rho, ((i + o) / n) * 2 * Math.PI - Math.PI, cutY, 0, [0, 1, 0]);
  }
  // Außenwand: zwei Faserrichtungen (±30°), wie die Lamellen des Faserrings
  {
    let per = 0; for (let a = 0; a < 64; a++) per += Rout((a / 64) * 2 * Math.PI) * ((2 * Math.PI) / 64);
    const SW = mobile ? 0.105 : 0.075, lines = Math.round(per / (SW * 2.2)), tan = Math.tan((32 * Math.PI) / 180);
    for (const dir of [1, -1]) for (let j = 0; j < lines; j++) {
      const p0 = (j / lines) * 2 * Math.PI - Math.PI + (dir > 0 ? 0 : Math.PI / lines);
      const h = 1.3, steps = Math.round(h / (SW * 0.62));
      for (let s = 0; s <= steps; s++) {
        const v = s / steps, phi = wrap(p0 + (dir * (v - 0.5) * h * tan) / RD);
        const yt = yTop(phi), yb = yBot(phi), y = yb + v * (yt - yb);
        pushA(1, phi, y, 1, [Math.sin(phi), 0, Math.cos(phi)]);
      }
    }
  }
  // Schnittfläche des Nervensacks: Nervenfasern (Cauda equina) als Punkte
  const sacRX = 0.66, sacRZ = 0.5;
  {
    const n = mobile ? 34 : 54;
    for (let i = 0; i < n; i++) {
      const a = i * 2.39996, r = Math.sqrt((i + 0.5) / n) * 0.82;
      A.P.push(Math.cos(a) * r * sacRX, cutY + 0.012, canalZ(cutY) + Math.sin(a) * r * sacRZ);
      A.P2.push(0, 0, 0); A.P3.push(0, 0, 0); A.N.push(0, 1, 0); A.K.push(2); A.RND.push(rnd()); A.TR.push(0); A.HOT.push(0);
    }
  }
  const attr = (g, name, arr, n) => g.setAttribute(name, new THREE.Float32BufferAttribute(arr, n));
  const annGeo = new THREE.BufferGeometry();
  attr(annGeo, 'position', A.P, 3); attr(annGeo, 'pos2', A.P2, 3); attr(annGeo, 'pos3', A.P3, 3); attr(annGeo, 'aN', A.N, 3);
  attr(annGeo, 'aKind', A.K, 1); attr(annGeo, 'aRnd', A.RND, 1); attr(annGeo, 'aTr', A.TR, 1); attr(annGeo, 'aHot', A.HOT, 1);

  // ---------- Gallertkern ----------
  const NN = mobile ? 2200 : 4400, rn = R_N * RD;
  const nuc = [];
  for (let i = 0; i < NN; i++) {
    const a = rnd() * 2 * Math.PI, r = Math.sqrt(rnd()) * R_N * 0.97, R = r * Rout(a);
    const deep = rnd() < 0.3; // ein Teil liegt unter der Schnittfläche (Tiefe)
    nuc.push({ x: R * Math.sin(a), z: R * Math.cos(a), y: deep ? cutY - 0.04 - rnd() * 0.5 : cutY + 0.006 + rnd() * 0.012, rnd: rnd() });
  }
  const along = (q) => q.x * D.x + q.z * D.z, across = (q) => q.x * DP.x + q.z * DP.z;
  const shape = (q, s1, s2, sq) => { // Kern drängt Richtung Riss: vorn weiter, zur Spitze schmal
    const a = along(q), b = across(q), u = Math.min(1, Math.max(0, (a / rn + 1) / 2));
    const a2 = a + s1 + s2 * u * u, b2 = b * (1 - sq * u * u * u);
    return [D.x * a2 + DP.x * b2, q.y, D.z * a2 + DP.z * b2];
  };
  // Was austritt: vor allem Material nahe am Riss (Wahrscheinlichkeit wächst zur Spitze) – der Rest bleibt als ganzer Kern zurück
  const uOf = (q) => Math.min(1, Math.max(0, (along(q) / rn + 1) / 2));
  nuc.forEach((q) => { q.ex = rnd() < 0.8 * uOf(q) ** 1.7; });
  nuc.sort((p, q) => (q.ex - p.ex) || (along(q) - along(p))); // austretende zuerst, darin die vordersten
  const NX = nuc.filter((q) => q.ex).length, NBLOB = Math.round(NX * 0.66);
  // Ziel im Wirbelkanal: Tropfen hinter der vorgewölbten Wand, leicht nach unten gesackt
  const blobC = V().copy(D).multiplyScalar(RD + 0.3 + 0.22).setY(cutY - 0.42);
  const blob = [];
  for (let i = 0; i < NBLOB; i++) {
    const u = rnd() * 2 - 1, a = rnd() * 2 * Math.PI, s = Math.sqrt(1 - u * u), r = 1 - 0.6 * rnd() ** 2.4;
    const e = [Math.cos(a) * s * r * 0.34, u * r * 0.54, Math.sin(a) * s * r * 0.64]; // entlang D · hoch · quer
    blob.push({ e, p: [blobC.x + D.x * e[0] + DP.x * e[2], blobC.y + e[1], blobC.z + D.z * e[0] + DP.z * e[2]] });
  }
  blob.sort((p, q) => q.e[0] - p.e[0]); // was zuerst austritt, kommt am weitesten
  const Nn = { P: [], P2: [], P3: [], K: [], RND: [], DEL: [] };
  nuc.forEach((q, i) => {
    const ex = i < NX;
    Nn.P.push(q.x, q.y, q.z); Nn.P2.push(...shape(q, 0.2, 0.46, 0.78));
    if (ex && i < NBLOB) Nn.P3.push(...blob[i].p);
    else if (ex) { // Hals: Kanal durch den Riss
      const f = rnd(), a = rn + 0.2 + f * (RD + 0.34 - rn - 0.2), b = (rnd() - 0.5) * (0.14 + 0.1 * f);
      Nn.P3.push(D.x * a + DP.x * b, cutY + 0.01 - rnd() * rnd() * 0.4, D.z * a + DP.z * b);
    } else Nn.P3.push(...shape(q, 0.34, 0.5, 0.84));
    Nn.K.push(ex ? 1 : 0); Nn.RND.push(q.rnd); Nn.DEL.push(ex ? i / NX : 0);
  });
  const nucGeo = new THREE.BufferGeometry();
  attr(nucGeo, 'position', Nn.P, 3); attr(nucGeo, 'pos2', Nn.P2, 3); attr(nucGeo, 'pos3', Nn.P3, 3);
  attr(nucGeo, 'aKind', Nn.K, 1); attr(nucGeo, 'aRnd', Nn.RND, 1); attr(nucGeo, 'aDel', Nn.DEL, 1);

  // ---------- dunkler Kern der Bandscheibe (verdeckt die Rückseite), wölbt sich mit ----------
  const core = { P: [], P2: [], P3: [], I: [] };
  const NA = 96, rowsY = 5;
  for (let j = 0; j < rowsY; j++) for (let i = 0; i < NA; i++) {
    const phi = (i / NA) * 2 * Math.PI - Math.PI, y = yBot(phi) + (j / (rowsY - 1)) * (yTop(phi) - yBot(phi));
    for (const [st, arr] of [[0, core.P], [1, core.P2], [2, core.P3]]) { const p = ring(0.985, phi, y, st, true); arr.push(p[0], p[1], p[2]); }
  }
  const cTopI = core.P.length / 3; for (const arr of [core.P, core.P2, core.P3]) arr.push(0, nTop ? cTop / nTop : 0.4, 0);
  const cBotI = cTopI + 1; for (const arr of [core.P, core.P2, core.P3]) arr.push(0, -0.3, 0);
  for (let i = 0; i < NA; i++) {
    const i2 = (i + 1) % NA;
    for (let j = 0; j < rowsY - 1; j++) { const a = j * NA + i, b = j * NA + i2, c = (j + 1) * NA + i, d = (j + 1) * NA + i2; core.I.push(a, b, c, b, d, c); }
    core.I.push((rowsY - 1) * NA + i, (rowsY - 1) * NA + i2, cTopI, i2, i, cBotI);
  }
  const discCore = new THREE.BufferGeometry();
  attr(discCore, 'position', core.P, 3); attr(discCore, 'pos2', core.P2, 3); attr(discCore, 'pos3', core.P3, 3); discCore.setIndex(core.I);

  // ---------- Nervensack und Nervenwurzeln ----------
  const withS = (g, fn) => { const uv = g.attributes.uv, n = g.attributes.position.count, c = new Float32Array(n * 3).fill(1); for (let i = 0; i < n; i++) c[i * 3] = fn ? fn(i) : uv.getX(i); g.setAttribute('color', new THREE.BufferAttribute(c, 3)); return g; };
  const zr = root0.z;
  const rootL5 = (s) => new THREE.CatmullRomCurve3([
    V(s * 0.46, 1.7, canalZ(1.7) + 0.18), V(s * 0.74, 0.8, zr + 0.04), V(s * rootX, 0, zr), V(s * (rootX + 0.12), -1.2, zr - 0.06),
    V(s * (rootX + 0.36), -2.3, zr), V(s * 1.95, -3.25, zr + 0.35), V(s * 2.9, -4.4, zr + 1.0), V(s * 3.5, -5.7, zr + 1.5),
  ], false, 'centripetal');
  const rootL4 = (s) => new THREE.CatmullRomCurve3([
    V(s * 0.44, 3.7, canalZ(3.7) + 0.16), V(s * 0.8, 3.1, canalZ(3.1) + 0.42), V(s * 0.98, 2.1, canalZ(2.1) + 0.45), V(s * 1.38, 1.2, zr + 0.12),
    V(s * 2.05, 0.55, zr + 0.5), V(s * 2.95, -0.7, zr + 1.1), V(s * 3.6, -2.3, zr + 1.6), V(s * 4.0, -3.9, zr + 1.9),
  ], false, 'centripetal');
  const tube = (curve, r) => withS(new THREE.TubeGeometry(curve, 72, r, 10, false));
  const cL5 = rootL5(1);
  let hitS = 0.3; for (let u = 0; u <= 1; u += 0.004) if (cL5.getPointAt(u).y <= 0) { hitS = u; break; }
  // Nervensack: elliptischer Schlauch entlang des Kanals; oberhalb der Schnittebene eigener Teil (blendet aus)
  const sac = (y0, y1) => {
    const P = [], I = [], NR = 28, rows = Math.max(2, Math.round(Math.abs(y1 - y0) / 0.35));
    for (let j = 0; j <= rows; j++) {
      const y = y0 + ((y1 - y0) * j) / rows, k = 1 - Math.max(0, -y) * 0.02;
      for (let i = 0; i < NR; i++) { const a = (i / NR) * 2 * Math.PI; P.push(Math.cos(a) * sacRX * k, y, canalZ(y) + Math.sin(a) * sacRZ * k); }
    }
    for (let j = 0; j < rows; j++) for (let i = 0; i < NR; i++) { const a = j * NR + i, b = j * NR + ((i + 1) % NR), c = a + NR, d = b + NR; I.push(a, c, b, b, c, d); }
    const g = new THREE.BufferGeometry(); attr(g, 'position', P, 3); g.setIndex(I); g.computeVertexNormals();
    // Außenseite prüfen (Normalen müssen nach außen zeigen)
    const n = g.attributes.normal, p = g.attributes.position; let s = 0;
    for (let i = 0; i < NR; i++) s += n.getX(i) * p.getX(i) + n.getZ(i) * (p.getZ(i) - canalZ(p.getY(i)));
    if (s < 0) { const ix = g.index.array; for (let i = 0; i < ix.length; i += 3) { const t = ix[i + 1]; ix[i + 1] = ix[i + 2]; ix[i + 2] = t; } g.computeVertexNormals(); }
    return withS(g, () => 0);
  };
  // Deckel des unteren Teils in der Schnittebene (Normale fest nach oben)
  const sacCap = () => {
    const P = [0, cutY, canalZ(cutY)], N = [0, 1, 0], I = [], NR = 28;
    for (let i = 0; i < NR; i++) { const a = (i / NR) * 2 * Math.PI; P.push(Math.cos(a) * sacRX, cutY, canalZ(cutY) + Math.sin(a) * sacRZ); N.push(0, 1, 0); }
    for (let i = 0; i < NR; i++) I.push(0, 1 + ((i + 1) % NR), 1 + i);
    const g = new THREE.BufferGeometry(); attr(g, 'position', P, 3); attr(g, 'normal', N, 3); g.setIndex(I);
    return withS(g, () => 0);
  };
  const nerves = [
    { geo: sac(cutY, -4.9), kind: 2 }, { geo: sacCap(), kind: 2 }, { geo: sac(3.9, cutY), kind: 2 },
    { geo: tube(cL5, 0.2), kind: 4 }, { geo: tube(rootL5(-1), 0.2), kind: 5 },
    { geo: tube(rootL4(1), 0.19), kind: 6 }, { geo: tube(rootL4(-1), 0.19), kind: 6 },
  ];

  return {
    L4, L5, annGeo, nucGeo, discCore, nerves, cutY, blobC, D, DP, RD, rn, PHI_D, root0, hitS, canalZ, Rout, cL5, rootX,
    counts: { ann: A.K.length, nuc: NN },
  };
}
