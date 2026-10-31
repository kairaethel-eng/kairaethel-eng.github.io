// Idee B · „Raum schaffen“: Nahaufnahme der liegenden Lendenwirbelsäule (Bauchlage, Rücken oben),
// gestochen wie in Kapitel 03 (gleichmäßige Punkte, dunkler Kern, Licht und Schatten). Darunter die zwei
// Polster der Liege, um die Wirbelsäule der Körper im Längsschnitt (Rückenlinie, Bauch auf dem Polster,
// hintere Körperhälfte). Mit dem Zug gleitet das Beckenteil, die Wirbel weichen auseinander, die
// Bandscheibenräume leuchten, an den Nervenaustritten fließt es. Schematisch, überzeichnet.
import * as THREE from 'three';
import { stage, FRAG, COL, C, reduced, toScreen, damp, smooth, isDesktop, ease } from './common.js';
import { stipple, coreOf, coreMaterial, stippleMaterial, stipSize, box, DEFORM } from './stipple.js';

const LEVELS = [
  { id: 'Th11', h: 0.34, ry: 0.3, rz: 0.4, tp: 0.35 },
  { id: 'Th12', h: 0.36, ry: 0.32, rz: 0.43, tp: 0.4 },
  { id: 'L1', h: 0.39, ry: 0.34, rz: 0.48, tp: 0.6 },
  { id: 'L2', h: 0.41, ry: 0.35, rz: 0.5, tp: 0.68 },
  { id: 'L3', h: 0.42, ry: 0.36, rz: 0.53, tp: 0.75 },
  { id: 'L4', h: 0.43, ry: 0.37, rz: 0.55, tp: 0.68 },
  { id: 'L5', h: 0.43, ry: 0.37, rz: 0.57, tp: 0.6 },
];
const DISC = [0.09, 0.1, 0.11, 0.12, 0.12, 0.13, 0.12]; // unter jedem Wirbel (letzte: L5/S1)
const OPEN = [0.2, 0.3, 0.45, 0.6, 0.75, 1, 0.95];
const S = LEVELS.length, NV = S + 1, SAC_H = 1.0, NSEG = NV + 2, FOV = 28;
const PAD_Y = -1.6; // Oberkante der Polster
const totalBase = LEVELS.reduce((s, L) => s + L.h, 0) + DISC.reduce((s, d) => s + d, 0) + SAC_H;
const X0 = -totalBase / 2 - 0.1;

// Lage aller Segmente für einen Zug T (0..1): Wirbel 0..S-1, Kreuzbein S, Polster fest NV, Beckenteil NV+1
const _rot = new THREE.Matrix4();
function layout(T, M) {
  const px = new Float32Array(NV), py = new Float32Array(NV);
  let x = X0;
  for (let i = 0; i < NV; i++) {
    const h = i < S ? LEVELS[i].h : SAC_H;
    px[i] = i < S ? x + h / 2 : x;
    py[i] = -0.26 * Math.sin(Math.PI * Math.min(1, (i / (NV - 1)) * 1.08)) * (1 - 0.4 * T);
    if (i < S) x += h + DISC[i] + 0.13 * OPEN[i] * T;
  }
  for (let i = 0; i < NV; i++) {
    const a = Math.max(0, i - 1), b = Math.min(NV - 1, i + 1);
    let ang = Math.atan2(py[b] - py[a], px[b] - px[a]);
    if (i === S) ang = 0.32 * (1 - 0.25 * T) + ang * 0.3;
    M[i].makeTranslation(px[i], py[i], 0).multiply(_rot.makeRotationZ(ang));
  }
  const shift = px[S] - (X0 + totalBase - SAC_H);
  M[NV].identity();
  M[NV + 1].makeTranslation(shift, 0, 0);
  return shift;
}

export function initB(canvas, ui) {
  const st = stage(canvas, { fov: FOV });
  if (!st) return null;
  const desk = isDesktop();
  const R = Math.random;

  const rest = Array.from({ length: NSEG }, () => new THREE.Matrix4());
  layout(0, rest);
  const inv = rest.map((m) => m.clone().invert());

  // ---------- Teile ----------
  const spineParts = [], ctxParts = [];
  const rigid = (seg) => (v) => { const l = v.clone().applyMatrix4(inv[seg]); return { la: l, lb: l, a: seg, b: seg, w: 0 }; };
  const addLocal = (list, geoLocal, seg, kind, dens = 1) => {
    const g = (geoLocal.index ? geoLocal.toNonIndexed() : geoLocal);
    if (!g.attributes.normal) g.computeVertexNormals();
    const nLocal = g.attributes.normal.clone();
    g.applyMatrix4(rest[seg]); // Lage in Ruhe-Weltkoordinaten …
    g.setAttribute('normal', nLocal); // … Normalen bleiben lokal (der Shader dreht sie mit dem Segment)
    list.push({ geo: g, kind, dens, map: rigid(seg) });
  };

  LEVELS.forEach((L, i) => {
    const { h, ry, rz } = L, cy = ry + 0.2;
    // Wirbelkörper mit leichter Taille
    const body = new THREE.CylinderGeometry(1, 1, h, 34, 6, false);
    body.rotateZ(-Math.PI / 2);
    const p = body.attributes.position;
    for (let k = 0; k < p.count; k++) {
      const x = p.getX(k), f = 0.93 + 0.07 * Math.pow((2 * x) / h, 2);
      p.setY(k, p.getY(k) * ry * f); p.setZ(k, p.getZ(k) * rz * f);
    }
    body.computeVertexNormals();
    addLocal(spineParts, body, i, 0);
    // hintere Anteile
    for (const s of [-1, 1]) {
      const ped = new THREE.CylinderGeometry(0.075, 0.075, 0.34, 10); ped.translate(0, ry * 0.75 + 0.12, s * 0.24); addLocal(spineParts, ped, i, 1);
      const tp = new THREE.CylinderGeometry(0.05, 0.035, L.tp, 10); tp.rotateX(Math.PI / 2); tp.translate(0, cy - 0.02, s * (0.26 + L.tp / 2)); addLocal(spineParts, tp, i, 1);
      for (const sx of [-1, 1]) { const f = new THREE.SphereGeometry(0.06, 10, 8); f.translate(sx * h * 0.46, cy + 0.1, s * 0.2); addLocal(spineParts, f, i, 1); }
    }
    const arch = new THREE.TorusGeometry(0.25, 0.06, 8, 22, Math.PI); arch.rotateY(Math.PI / 2); arch.scale(2.1, 1, 1); arch.translate(0, cy, 0);
    addLocal(spineParts, arch, i, 1);
    const sp = new THREE.BoxGeometry(0.2, 0.42, 0.07, 2, 3, 1); sp.rotateZ(-0.35); sp.translate(0.05, cy + 0.41, 0);
    addLocal(spineParts, sp, i, 1);
  });
  // Kreuzbein: flacher, gebogener Keil
  const sac = new THREE.BoxGeometry(SAC_H, 0.62, 1.2, 10, 3, 8); sac.translate(SAC_H / 2, 0, 0);
  { const p = sac.attributes.position; for (let k = 0; k < p.count; k++) { const u = p.getX(k) / SAC_H; p.setY(k, p.getY(k) * (1 - 0.65 * u) - 0.16 * u * u); p.setZ(k, p.getZ(k) * (1 - 0.72 * u)); } }
  sac.computeVertexNormals();
  addLocal(spineParts, sac, S, 0);
  const crest = new THREE.BoxGeometry(SAC_H * 0.7, 0.12, 0.06); crest.translate(SAC_H * 0.35, 0.3, 0); crest.rotateZ(-0.12);
  addLocal(spineParts, crest, S, 1);

  // Bandscheiben: zwischen Endplatte von Wirbel i und i+1 (dehnt sich mit)
  const endA = (i) => (i < S ? LEVELS[i].h / 2 : SAC_H);
  const endB = (i) => (i < S ? -LEVELS[i].h / 2 : 0);
  const ryOf = (i) => (i < S ? LEVELS[i].ry : 0.36), rzOf = (i) => (i < S ? LEVELS[i].rz : 0.6);
  const tA = new THREE.Vector3(), tB = new THREE.Vector3();
  for (let i = 0; i < S; i++) {
    const ry = (ryOf(i) + ryOf(i + 1)) / 2 * 0.95, rz = (rzOf(i) + rzOf(i + 1)) / 2 * 0.95;
    const g = new THREE.CylinderGeometry(1, 1, 1, 34, 3, true); g.rotateZ(-Math.PI / 2);
    const ng = g.toNonIndexed(), P = ng.attributes.position, Nn = ng.attributes.normal;
    const col = new Float32Array(P.count * 3);
    for (let k = 0; k < P.count; k++) {
      const t = P.getX(k) + 0.5, bulge = 1 + 0.06 * Math.sin(Math.PI * t);
      const y = P.getY(k) * ry * bulge, z = P.getZ(k) * rz * bulge;
      col[k * 3] = t; col[k * 3 + 1] = y; col[k * 3 + 2] = z;
      tA.set(endA(i), y, z).applyMatrix4(rest[i]); tB.set(endB(i + 1), y, z).applyMatrix4(rest[i + 1]);
      tA.lerp(tB, t); P.setXYZ(k, tA.x, tA.y, tA.z);
      const nn = new THREE.Vector3(0, y / (ry * ry), z / (rz * rz)).normalize(); Nn.setXYZ(k, nn.x, nn.y, nn.z);
    }
    ng.setAttribute('color', new THREE.BufferAttribute(col, 3));
    const ii = i;
    spineParts.push({ geo: ng, kind: 2, dens: 1.2, map: (v, c) => ({ la: new THREE.Vector3(endA(ii), c.g, c.b), lb: new THREE.Vector3(endB(ii + 1), c.g, c.b), a: ii, b: ii + 1, w: c.r }) });
  }

  // Liege: zwei Polster + Rahmen
  const padMap = (seg) => (v) => ({ la: v, lb: v, a: seg, b: seg, w: 0 });
  const noDown = (n) => n.y > -0.5;
  ctxParts.push({ geo: box([-1.225, PAD_Y - 0.12, 0], [4.15, 0.24, 5.6]), kind: 3, map: padMap(NV), keep: noDown });
  ctxParts.push({ geo: box([2.36, PAD_Y - 0.12, 0], [2.88, 0.24, 5.6]), kind: 3, map: padMap(NV + 1), keep: noDown });
  ctxParts.push({ geo: box([-1.225, PAD_Y - 0.33, 0], [3.9, 0.08, 3.6]), kind: 4, map: padMap(NV), keep: noDown, dens: 0.7 });
  ctxParts.push({ geo: box([2.36, PAD_Y - 0.33, 0], [2.7, 0.08, 3.6]), kind: 4, map: padMap(NV + 1), keep: noDown, dens: 0.7 });

  // Körper im Längsschnitt: hintere Hälfte als Schale (Innenseite sichtbar)
  const lord = (x) => -0.26 * Math.sin(Math.PI * Math.min(1, Math.max(0, (x - X0) / totalBase) * 1.08));
  const yBack = (x) => 1.42 + lord(x) * 0.85 + 0.3 * Math.exp(-Math.pow((x - 2.5) / 0.8, 2));
  const yBelly = () => PAD_Y + 0.03;
  const rzAt = (x) => 2.3 + 0.35 * smooth(0.4, 2.8, x);
  const BX0 = -3.15, BX1 = 3.3;
  const bodyMap = (v) => ({ la: v, lb: v, a: NV, b: NV + 1, w: smooth(-0.6, 1.9, v.x) });
  {
    const nx = 48, nf = 26, pos = [];
    const at = (x, f) => {
      const yc = (yBack(x) + yBelly()) / 2, ry = (yBack(x) - yBelly()) / 2, c = Math.cos(f), s = Math.sin(f);
      return [x, yc + ry * Math.sign(s) * Math.pow(Math.abs(s), 0.8), rzAt(x) * -Math.pow(Math.abs(c), 0.8)];
    };
    for (let i = 0; i < nx; i++) for (let j = 0; j < nf; j++) {
      const x0 = BX0 + (BX1 - BX0) * i / nx, x1 = BX0 + (BX1 - BX0) * (i + 1) / nx;
      const f0 = Math.PI / 2 + Math.PI * j / nf, f1 = Math.PI / 2 + Math.PI * (j + 1) / nf;
      const a = at(x0, f0), b = at(x1, f0), c = at(x1, f1), d = at(x0, f1);
      pos.push(...a, ...c, ...b, ...a, ...d, ...c);
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.computeVertexNormals();
    // Normalen zur Innenseite (dort schaut die Kamera hin)
    const Nn = g.attributes.normal; for (let k = 0; k < Nn.count; k++) { if (Nn.getZ(k) < 0) Nn.setXYZ(k, -Nn.getX(k), -Nn.getY(k), -Nn.getZ(k)); }
    ctxParts.push({ geo: g, kind: 5, map: bodyMap, dens: 0.5, core: false }); // zart, ohne Kern: Körper als Hauch
  }

  // ---------- Punkte und Kern ----------
  const spinePts = stipple(spineParts, desk ? 26000 : 12000);
  const ctxPts = stipple(ctxParts, desk ? 16000 : 7500);
  const core = coreOf([...spineParts, ...ctxParts]);

  const M = Array.from({ length: NSEG }, () => new THREE.Matrix4());
  const U = {
    uM: { value: M }, uStip: { value: 1 }, uMaxSize: { value: 6 }, uCut: { value: reduced ? 99 : X0 - 1 }, uInset: { value: 0.01 },
    uOpen: { value: new Array(7).fill(0) }, uTime: { value: 0 }, uPix: { value: 1 }, uT: { value: 0 },
    cCore: { value: C('#0E1C22') }, cBone: { value: C('#F3EADA') }, cDisc: { value: C('#86AFC9') }, cSignal: { value: C('#DDF1FF') },
    cPad: { value: C('#CFC6B3') }, cFrame: { value: C('#5F8EA0') }, cBody: { value: C('#5AA2D6') },
    cBlue: { value: COL.blue }, cAmber: { value: COL.amber }, cPetrol: { value: COL.petrol },
  };
  const U2 = { ...U, uStip: { value: 1 } };
  const coreMesh = new THREE.Mesh(core, coreMaterial(U, NSEG));
  const spineMesh = new THREE.Points(spinePts.geo, stippleMaterial(U, NSEG, /* glsl */`
    uniform vec3 cBone, cDisc, cSignal, cBlue; uniform float uOpen[7];`, /* glsl */`
    vec3 base = aKind < .5 ? cBone : aKind < 1.5 ? cBone * .8 : cDisc;
    col = base * (.22 + .78 * lam) + cBlue * rim * .16;
    if (aKind > 1.5) { float o = uOpen[int(min(aSegA, 6.) + .5)]; col = mix(col, cSignal * (.55 + .7 * lam), o * .75); sz = 1. + o * .3; }`));
  const ctxMesh = new THREE.Points(ctxPts.geo, stippleMaterial(U2, NSEG, /* glsl */`
    uniform vec3 cPad, cFrame, cBody, cBlue;`, /* glsl */`
    if (aKind < 3.5) { col = cPad * (.2 + .7 * lam) + cBlue * rim * .1; }
    else if (aKind < 4.5) { col = cFrame * (.25 + .6 * lam); sz = .9; }
    else { col = cBody * (.14 + .42 * lam) + cBlue * rim * .16; sz = .75; }`));
  [coreMesh, spineMesh, ctxMesh].forEach((o) => { o.frustumCulled = false; st.scene.add(o); });

  // ---------- Leuchtende Linien: Schnittkante des Körpers, Nervenwurzeln, Wirbelkanal ----------
  const GP = [], GP2 = [], GD = [], GA = [], GB = [], GW = [], GK = [], GR = [];
  const g = (la, lb, dir, a, b, w, kind) => { GP.push(la.x, la.y, la.z); GP2.push(lb.x, lb.y, lb.z); GD.push(dir[0], dir[1], dir[2]); GA.push(a); GB.push(b); GW.push(w); GK.push(kind); GR.push(R(), R(), R()); };
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  // Schnittkante: Rückenlinie und Bauchlinie (Mittelebene), Enden als Halbbögen
  for (let x = BX0; x <= BX1; x += 0.018) for (const zz of [0, -0.025, -0.05]) {
    const m = bodyMap(V(x, 0, 0));
    g(V(x, yBack(x), zz), V(x, yBack(x), zz), [0, 0, 0], m.a, m.b, m.w, 0);
    g(V(x, yBelly(), zz), V(x, yBelly(), zz), [0, 0, 0], m.a, m.b, m.w, 0);
  }
  for (const x of [BX0, BX1]) for (let j = 0; j <= 90; j++) {
    const f = Math.PI / 2 + Math.PI * j / 90, yc = (yBack(x) + yBelly()) / 2, ry = (yBack(x) - yBelly()) / 2, c = Math.cos(f), s = Math.sin(f);
    const m = bodyMap(V(x, 0, 0));
    const p = V(x, yc + ry * Math.sign(s) * Math.pow(Math.abs(s), 0.8), rzAt(x) * -Math.pow(Math.abs(c), 0.8));
    g(p, p, [0, 0, 0], m.a, m.b, m.w, 0);
  }
  // Nervenwurzeln (fließen aus dem Zwischenwirbelloch nach außen und unten)
  for (let i = 1; i < S; i++) for (const s of [-1, 1]) for (let j = 0; j < (desk ? 120 : 70); j++) {
    const cy = ryOf(i) + 0.13;
    g(V(endA(i), cy, s * 0.3), V(endB(i + 1), cy, s * 0.3), [0.55, -0.55, s * 0.95], i, i + 1, 0.5, 1);
  }
  // Wirbelkanal (schimmert durch)
  LEVELS.forEach((L, i) => { for (let j = 0; j < 70; j++) { const a = R() * Math.PI * 2, r = Math.sqrt(R()) * 0.1, p = V((R() - 0.5) * (L.h + 0.24), L.ry + 0.2 + Math.sin(a) * r, Math.cos(a) * r); g(p, p, [0, 0, 0], i, i, 0, 2); } });
  const gg = new THREE.BufferGeometry();
  gg.setAttribute('position', new THREE.Float32BufferAttribute(GP, 3));
  gg.setAttribute('pos2', new THREE.Float32BufferAttribute(GP2, 3));
  gg.setAttribute('normal', new THREE.Float32BufferAttribute(GD, 3)); // hier: Fließrichtung
  gg.setAttribute('aSegA', new THREE.Float32BufferAttribute(GA, 1));
  gg.setAttribute('aSegB', new THREE.Float32BufferAttribute(GB, 1));
  gg.setAttribute('aW', new THREE.Float32BufferAttribute(GW, 1));
  gg.setAttribute('aKind', new THREE.Float32BufferAttribute(GK, 1));
  gg.setAttribute('aRnd', new THREE.Float32BufferAttribute(GR, 3));
  const glowMat = (kinds, depthTest) => new THREE.ShaderMaterial({
    uniforms: U, transparent: true, depthWrite: false, depthTest, blending: THREE.AdditiveBlending, fragmentShader: FRAG,
    vertexShader: DEFORM(NSEG) + /* glsl */`
      attribute vec3 aRnd; uniform float uTime, uPix, uCut, uOpen[7]; uniform vec3 cAmber, cBlue, cPetrol, cSignal;
      varying vec3 vCol; varying float vA;
      void main(){
        float open = uOpen[int(min(aSegA, 6.) + .5)];
        vec3 la = position, lb = pos2; float s = 0.;
        if (aKind > .5 && aKind < 1.5) {
          s = fract(aRnd.x + uTime * (.12 + open * .18));
          vec3 off = normal * s + vec3(0., -s * s * .25, 0.) + (aRnd - .5) * .05 * (1. + s);
          la += off; lb += off;
        }
        vec3 p = deformP(la, lb);
        vec4 mv = viewMatrix * vec4(p, 1.); gl_Position = projectionMatrix * mv;
        float sz = 1., al;
        if (aKind < .5) { vCol = mix(cBlue, cSignal, .35); al = .8; sz = 1.15; if (${kinds} != 0) al = 0.; }
        else if (aKind < 1.5) { vCol = mix(cAmber, vec3(1., .9, .7), open * .4); al = (.25 + open * .75) * sin(s * 3.14159); sz = 1. + open * .6; if (${kinds} != 0) al = 0.; }
        else { float band = pow(.5 + .5 * sin(p.x * 2.2 - uTime * 2.4), 6.); vCol = mix(cPetrol, cBlue, band); al = (.25 + band * .55); if (${kinds} != 1) al = 0.; }
        gl_PointSize = uPix * sz * 20. / -mv.z;
        vA = al * step(p.x, uCut);
      }`,
  });
  const glowA = new THREE.Points(gg, glowMat(0, true));   // Schnittkante + Nerven (werden vom Knochen verdeckt)
  const glowB = new THREE.Points(gg, glowMat(1, false));  // Wirbelkanal schimmert durch
  [glowA, glowB].forEach((o) => { o.frustumCulled = false; st.scene.add(o); });

  // Fuge zwischen den Polstern (leuchtet bei Zug)
  const fg = [];
  for (let j = 0; j < 260; j++) fg.push(j % 2 ? 1 : -1, PAD_Y - (R() < 0.5 ? 0 : 0.24) + (R() - 0.5) * 0.01, (R() - 0.5) * 5.6);
  const fgeo = new THREE.BufferGeometry(); fgeo.setAttribute('position', new THREE.Float32BufferAttribute(fg, 3));
  const FU = { uX: { value: 0 }, uW: { value: 0 }, uPix: U.uPix, uT: U.uT, cAmber: U.cAmber };
  const fuge = new THREE.Points(fgeo, new THREE.ShaderMaterial({
    uniforms: FU, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fragmentShader: FRAG,
    vertexShader: /* glsl */`
      uniform float uX, uW, uPix, uT; uniform vec3 cAmber; varying vec3 vCol; varying float vA;
      void main(){
        vec3 p = vec3(uX + position.x * uW * .5, position.y, position.z);
        vec4 mv = modelViewMatrix * vec4(p, 1.); gl_Position = projectionMatrix * mv;
        gl_PointSize = uPix * 1.2 * 20. / -mv.z; vCol = cAmber; vA = smoothstep(.05, .5, uT) * .75;
      }`,
  }));
  fuge.frustumCulled = false; st.scene.add(fuge);

  // ---------- Bewegung ----------
  const SPEED = reduced ? 0.5 : 1;
  let T = 0, Twant = 0, auto = true, lastUser = -1e9, scanT = reduced ? 1 : 0, autoT = 0;
  const slider = ui && ui.slider;
  if (slider) slider.addEventListener('input', () => { Twant = slider.value / 100; auto = false; lastUser = performance.now(); });
  const labels = ui && ui.labels;
  const lp = new THREE.Vector3();
  function placeLabels() {
    if (!labels) return;
    const vis = smooth(0.3, 0.6, T) * (scanT >= 1 ? 1 : 0);
    for (const L of labels) {
      if (L.kind === 'disc') lp.set(LEVELS[5].h / 2 + 0.065 + 0.065 * OPEN[5] * T, -0.3, 0.45).applyMatrix4(M[5]);
      else lp.set(LEVELS[5].h / 2 + 0.065 + 0.065 * OPEN[5] * T + 0.2, LEVELS[5].ry + 0.13 - 0.2, 0.62).applyMatrix4(M[5]);
      const s = toScreen(st, lp);
      const flip = s.x + L.el.offsetWidth > st.w - 6;
      L.el.classList.toggle('flip', flip);
      L.el.style.transform = `translate(${s.x.toFixed(1)}px, ${s.y.toFixed(1)}px) translate(${flip ? '-100%' : '0'}, -50%)`;
      L.el.style.opacity = vis.toFixed(2);
    }
  }

  function update(time, dt) {
    U.uTime.value = time * SPEED;
    U.uPix.value = st.pix;
    U.uStip.value = stipSize(st, FOV, spinePts.spacing);
    U2.uStip.value = stipSize(st, FOV, ctxPts.spacing, 0.42);
    if (scanT < 1) { scanT = Math.min(1, scanT + dt / 2.4); U.uCut.value = X0 - 1 + ease(scanT) * 9; if (scanT >= 1) U.uCut.value = 99; }
    if (!auto && performance.now() - lastUser > 8000) auto = true;
    if (auto && scanT >= 1) {
      autoT += dt * SPEED;
      const c = autoT % 9, a = c < 3 ? smooth(0, 3, c) : c < 5.5 ? 1 : c < 8.2 ? 1 - smooth(5.5, 8.2, c) : 0;
      Twant = a;
      if (slider) slider.value = Math.round(a * 100);
    }
    T = damp(T, Twant, 4, dt);
    U.uT.value = T;
    const shift = layout(T, M);
    for (let i = 0; i < 7; i++) U.uOpen.value[i] = OPEN[i] * smooth(0.02, 0.9, T);
    FU.uX.value = 0.885 + shift * 0.5; FU.uW.value = 0.07 + shift;
    ui && ui.onAmount && ui.onAmount(T);
    // Kamera: seitlich, leicht von vorn-oben, sanftes Wiegen; Handy näher an der Lendenwirbelsäule
    const yaw = -0.42 + (reduced ? 0 : Math.sin(time * 0.13) * 0.1), el = 0.17;
    const fit = st.aspect < 2 ? 2 / st.aspect : 1;
    const Rr = 8.8 * Math.pow(Math.min(fit, 2.2), 0.55);
    const tx = desk ? 0.2 : 0.55, ty = -0.15, tz = -0.25;
    st.camera.position.set(tx + Math.sin(yaw) * Math.cos(el) * Rr, ty + Math.sin(el) * Rr, tz + Math.cos(yaw) * Math.cos(el) * Rr);
    st.camera.lookAt(tx, ty, tz);
    st.camera.updateMatrixWorld();
    placeLabels();
  }
  return { st, update, count: spinePts.count + ctxPts.count };
}
