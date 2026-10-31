// Idee B · „Raum schaffen“: Nahaufnahme der liegenden Lendenwirbelsäule (Bauchlage, Rücken oben).
// Mit dem Zug (Traktion) gleitet das Beckenteil der Liege, die Wirbel weichen auseinander,
// die Bandscheibenräume leuchten auf, an den Nervenaustritten fließt es freier. Schematisch, überzeichnet.
import * as THREE from 'three';
import { stage, FRAG, COL, reduced, toScreen, damp, smooth, isDesktop } from './common.js';

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
const OPEN = [0.2, 0.3, 0.45, 0.6, 0.75, 1, 0.95]; // wie stark sich der Raum öffnet
const NV = LEVELS.length + 1; // + Kreuzbein
const SAC_H = 1.0;

export function initB(canvas, ui) {
  const st = stage(canvas, { fov: 28 });
  if (!st) return null;
  const k = isDesktop() ? 1 : 0.72;
  const N = (n) => Math.max(4, Math.round(n * k));

  const P = [], P2 = [], DIR = [], SA = [], SB = [], WW = [], KIND = [], IDX = [], RND = [];
  const push = (p, p2, dir, a, b, w, kind, idx) => {
    P.push(p[0], p[1], p[2]); P2.push(p2[0], p2[1], p2[2]); DIR.push(dir[0], dir[1], dir[2]);
    SA.push(a); SB.push(b); WW.push(w); KIND.push(kind); IDX.push(idx); RND.push(Math.random(), Math.random(), Math.random());
  };
  const rigid = (seg, kind, p) => push(p, p, [0, 0, 0], seg, seg, 0, kind, seg);
  const R = Math.random;

  // ---------- Wirbel (lokal: x = Längsachse, y = rückenwärts, z = seitlich) ----------
  LEVELS.forEach((L, i) => {
    const { h, ry, rz } = L;
    // Wirbelkörper: Mantel + dichtere Deckplatten-Ränder
    for (let j = 0; j < N(700); j++) {
      const a = R() * Math.PI * 2, e = R();
      let x = (R() - 0.5) * h, rr = 1;
      if (e < 0.35) { x = (R() < 0.5 ? -0.5 : 0.5) * h; rr = 0.97 + R() * 0.03; } // Ränder
      else if (e < 0.5) { x = (R() < 0.5 ? -0.5 : 0.5) * h; rr = Math.sqrt(R()) * 0.95; } // Deckplatte
      else rr = 0.94 + 0.06 * Math.cos((x / h) * Math.PI) ; // leichte Taille
      rigid(i, 0, [x, Math.sin(a) * ry * rr, Math.cos(a) * rz * rr]);
    }
    const cy = ry + 0.2; // Wirbelkanal
    // Bogenwurzeln
    for (const s of [-1, 1]) for (let j = 0; j < N(70); j++) rigid(i, 1, [(R() - 0.5) * h * 0.55, ry * 0.75 + R() * 0.3, s * (0.22 + R() * 0.07)]);
    // Wirbelbogen
    for (let j = 0; j < N(150); j++) { const a = R() * Math.PI; const r = 0.24 + R() * 0.05; rigid(i, 1, [(R() - 0.5) * h * 0.7, cy + Math.sin(a) * r, Math.cos(a) * r]); }
    // Dornfortsatz (schräg nach kaudal)
    for (let j = 0; j < N(130); j++) { const u = R(), v = R(); rigid(i, 1, [(v - 0.5) * 0.24 + u * 0.12, cy + 0.26 + u * 0.36, (R() - 0.5) * 0.06]); }
    // Querfortsätze
    for (const s of [-1, 1]) for (let j = 0; j < N(80); j++) { const u = R(); rigid(i, 1, [(R() - 0.5) * 0.11, cy - 0.02 + (R() - 0.5) * 0.08, s * (0.26 + u * L.tp)]); }
    // Gelenkfortsätze (Facetten) vorn/hinten
    for (const sx of [-1, 1]) for (const s of [-1, 1]) for (let j = 0; j < N(22); j++) rigid(i, 1, [sx * h * 0.48 + (R() - 0.5) * 0.06, cy + 0.08 + (R() - 0.5) * 0.08, s * (0.2 + (R() - 0.5) * 0.05)]);
    // Inhalt des Wirbelkanals (fließendes Licht)
    for (let j = 0; j < N(90); j++) { const a = R() * Math.PI * 2, r = Math.sqrt(R()) * 0.11; rigid(i, 4, [(R() - 0.5) * (h + 0.26), cy + Math.sin(a) * r, Math.cos(a) * r]); }
  });
  // Kreuzbein (verjüngt, gekippt)
  const S = LEVELS.length;
  // flacher Keil: oben breit (Deckplatte S1), nach unten schmal und dünn
  for (let j = 0; j < N(1300); j++) {
    const e = R();
    if (e < 0.22) { const a = R() * Math.PI * 2, rr = R() < 0.6 ? 1 : Math.sqrt(R()); rigid(S, 0, [0, Math.sin(a) * 0.36 * rr, Math.cos(a) * 0.6 * rr]); continue; }
    const u = Math.pow(R(), 0.8), x = u * SAC_H, wz = 0.62 * (1 - u * 0.78), hy = 0.3 * (1 - u * 0.7);
    const edge = R() < 0.55, sz = R() < 0.5 ? -1 : 1;
    const z = edge ? sz * wz : (R() * 2 - 1) * wz;
    const y = edge ? (R() * 2 - 1) * hy * 0.8 : (R() < 0.5 ? -hy : hy) * (1 - Math.pow(z / wz, 2) * 0.5);
    rigid(S, 0, [x, y, z]);
  }
  for (let j = 0; j < N(160); j++) { const u = R(); rigid(S, 1, [u * SAC_H * 0.8, 0.3 * (1 - u * 0.7) + 0.1 + (R() - 0.5) * 0.04, (R() - 0.5) * 0.05]); } // Kamm
  for (let j = 0; j < N(80); j++) { const a = R() * Math.PI * 2, r = Math.sqrt(R()) * 0.1; rigid(S, 4, [-0.15 + R() * 0.4, 0.5 + Math.sin(a) * r, Math.cos(a) * r]); }

  // ---------- Bandscheiben (zwischen Wirbel i und i+1) ----------
  const endOf = (i, side) => (i < S ? LEVELS[i].h / 2 * side : (side < 0 ? 0 : SAC_H));
  const ryOf = (i) => (i < S ? LEVELS[i].ry : 0.36), rzOf = (i) => (i < S ? LEVELS[i].rz : 0.62);
  for (let i = 0; i < S; i++) {
    const ry = (ryOf(i) + ryOf(i + 1)) / 2 * 0.93, rz = (rzOf(i) + rzOf(i + 1)) / 2 * 0.93;
    for (let j = 0; j < N(420); j++) {
      const a = R() * Math.PI * 2, ring = R() < 0.6, rr = ring ? 0.75 + R() * 0.25 : Math.sqrt(R()) * 0.55;
      const t = R(), y = Math.sin(a) * ry * rr, z = Math.cos(a) * rz * rr;
      push([endOf(i, 1), y, z], [endOf(i + 1, -1), y, z], [0, 0, 0], i, i + 1, t, ring ? 2 : 5, i);
    }
    // Nervenwurzeln: fließen aus dem Zwischenwirbelloch seitlich nach unten
    if (i >= 1) for (const s of [-1, 1]) for (let j = 0; j < N(110); j++) {
      const cy = ryOf(i) + 0.13;
      push([endOf(i, 1), cy, s * 0.3], [endOf(i + 1, -1), cy, s * 0.3], [0.55, -0.55, s * 0.95], i, i + 1, 0.5, 3, i);
    }
  }

  // ---------- Liege (zwei Teile) und Rückenkontur ----------
  // Teile werden in Weltkoordinaten über eigene Matrizen bewegt: Segment NV = fest, NV+1 = Beckenteil
  const TABLE_Y = -0.82;
  const tableBox = (seg, x0, x1) => {
    for (let j = 0; j < N(700); j++) {
      const e = R(); let x = x0 + R() * (x1 - x0), y = TABLE_Y, z = (R() - 0.5) * 1.8;
      if (e < 0.7) { if (R() < 0.55) z = R() < 0.5 ? -0.9 : 0.9; else x = R() < 0.5 ? x0 : x1; y += R() < 0.5 ? 0 : -0.12; }
      else y += -R() * 0.12 * (R() < 0.8 ? 0 : 1);
      rigid(seg, 6, [x, y, z]);
    }
  };
  tableBox(NV, -2.8, 0.85);
  tableBox(NV + 1, 0.92, 3.3);

  const n = P.length / 3;
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
  geo.setAttribute('pos2', new THREE.Float32BufferAttribute(P2, 3));
  geo.setAttribute('aDir', new THREE.Float32BufferAttribute(DIR, 3));
  geo.setAttribute('aSegA', new THREE.Float32BufferAttribute(SA, 1));
  geo.setAttribute('aSegB', new THREE.Float32BufferAttribute(SB, 1));
  geo.setAttribute('aW', new THREE.Float32BufferAttribute(WW, 1));
  geo.setAttribute('aKind', new THREE.Float32BufferAttribute(KIND, 1));
  geo.setAttribute('aIdx', new THREE.Float32BufferAttribute(IDX, 1));
  geo.setAttribute('aRnd', new THREE.Float32BufferAttribute(RND, 3));

  const M = Array.from({ length: NV + 2 }, () => new THREE.Matrix4());
  const U = {
    uM: { value: M }, uOpen: { value: new Array(7).fill(0) }, uTime: { value: 0 }, uPix: { value: 1 }, uT: { value: 0 },
    cBone: { value: COL.boneHi }, cPetrol: { value: COL.petrol }, cBlue: { value: COL.blue }, cAmber: { value: COL.amber }, cGrey: { value: COL.grey },
  };
  const mat = new THREE.ShaderMaterial({
    uniforms: U, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fragmentShader: FRAG,
    vertexShader: /* glsl */`
      attribute vec3 pos2, aDir, aRnd; attribute float aSegA, aSegB, aW, aKind, aIdx;
      uniform mat4 uM[${NV + 2}]; uniform float uOpen[7]; uniform float uTime, uPix, uT;
      uniform vec3 cBone, cPetrol, cBlue, cAmber, cGrey;
      varying vec3 vCol; varying float vA;
      void main(){
        int a = int(aSegA + .5), b = int(aSegB + .5), di = int(min(aIdx, 6.) + .5);
        float open = (aKind > 1.5 && aKind < 3.5) || aKind > 4.5 && aKind < 5.5 ? uOpen[di] : 0.;
        vec3 la = position, lb = pos2; float s = 0.;
        if (aKind > 2.5 && aKind < 3.5) {
          // Nervenwurzel: Teilchen wandern nach außen
          s = fract(aRnd.x + uTime * (.12 + open*.18));
          vec3 off = aDir * s + vec3(0., -s*s*.25, 0.) + (aRnd - .5) * .05 * (1. + s);
          la += off; lb += off;
        }
        vec3 p = mix((uM[a] * vec4(la, 1.)).xyz, (uM[b] * vec4(lb, 1.)).xyz, aW);
        p += vec3(sin(uTime*.8 + aRnd.x*6.283), cos(uTime*.7 + aRnd.y*6.283), sin(uTime*.6 + aRnd.z*6.283)) * .004;
        vec4 mv = modelViewMatrix * vec4(p, 1.);
        gl_Position = projectionMatrix * mv;
        vec3 col; float al, sz = 1.;
        if (aKind < .5) { col = cBone; al = .8; }
        else if (aKind < 1.5) { col = mix(cBone, cPetrol, .35); al = .55; }
        else if (aKind < 2.5) { col = mix(cPetrol, cBlue, .35 + open*.65); al = .45 + open*.55; sz = 1. + open*.5; }
        else if (aKind < 3.5) { col = mix(cAmber, vec3(1., .9, .7), open*.4); al = (.25 + open*.75) * sin(s*3.14159); sz = 1. + open*.6; }
        else if (aKind < 4.5) {
          float band = pow(.5 + .5*sin(p.x*2.2 - uTime*2.4), 6.);
          col = mix(cPetrol, cBlue, band); al = .3 + band*.6;
        }
        else if (aKind < 5.5) { col = mix(cPetrol, cBlue, open); al = .35 + open*.4; sz = .9; }
        else { col = mix(cGrey, cPetrol, .4); al = .42; sz = .85; }
        gl_PointSize = uPix * sz * (.6 + aRnd.y*.7) * 20. / -mv.z;
        vCol = col; vA = al * (.6 + aRnd.z*.4);
      }`,
  });
  st.scene.add(new THREE.Points(geo, mat));

  // ---------- Fuge zwischen den Liegeteilen (leuchtet bei Zug) ----------
  const fg = [];
  for (let j = 0; j < 200; j++) fg.push(j % 2 ? 1 : -1, TABLE_Y - (Math.random() < 0.5 ? 0 : 0.12) + (Math.random() - 0.5) * 0.01, (Math.random() - 0.5) * 1.8);
  const fgeo = new THREE.BufferGeometry(); fgeo.setAttribute('position', new THREE.Float32BufferAttribute(fg, 3));
  const FU = { uX: { value: 0 }, uW: { value: 0 }, uPix: U.uPix, uT: U.uT, cAmber: U.cAmber };
  st.scene.add(new THREE.Points(fgeo, new THREE.ShaderMaterial({
    uniforms: FU, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fragmentShader: FRAG,
    vertexShader: /* glsl */`
      uniform float uX, uW, uPix, uT; uniform vec3 cAmber; varying vec3 vCol; varying float vA;
      void main(){
        vec3 p = vec3(uX + position.x * uW * .5, position.y, position.z);
        vec4 mv = modelViewMatrix * vec4(p, 1.); gl_Position = projectionMatrix * mv;
        gl_PointSize = uPix * 1.1 * 20. / -mv.z; vCol = cAmber; vA = smoothstep(.05, .5, uT) * .7;
      }`,
  })));

  // ---------- Bewegung ----------
  const SPEED = reduced ? 0.5 : 1;
  let T = 0, Twant = 0, auto = true, lastUser = -1e9, introT = 0;
  const pos = new Float32Array(NV * 3);
  const tmp = new THREE.Matrix4(), rot = new THREE.Matrix4();
  const totalBase = LEVELS.reduce((s, L) => s + L.h, 0) + DISC.reduce((s, d) => s + d, 0) + SAC_H;
  const X0 = -totalBase / 2 - 0.1;
  let jointX = 0;

  function layout() {
    let x = X0;
    for (let i = 0; i < NV; i++) {
      const h = i < S ? LEVELS[i].h : SAC_H;
      const cx = i < S ? x + h / 2 : x; // Kreuzbein: Ursprung an der Deckplatte
      const u = i / (NV - 1);
      const flat = 1 - 0.4 * T;
      const y = -0.26 * Math.sin(Math.PI * Math.min(1, u * 1.08)) * flat;
      pos[i * 3] = cx; pos[i * 3 + 1] = y;
      if (i < S) x += h + DISC[i] + 0.13 * OPEN[i] * T;
    }
    for (let i = 0; i < NV; i++) {
      const prev = Math.max(0, i - 1), next = Math.min(NV - 1, i + 1);
      let ang = Math.atan2(pos[next * 3 + 1] - pos[prev * 3 + 1], pos[next * 3] - pos[prev * 3]);
      if (i === S) ang = 0.32 * (1 - 0.25 * T) + ang * 0.3; // Kreuzbein kippt
      rot.makeRotationZ(ang);
      M[i].makeTranslation(pos[i * 3], pos[i * 3 + 1], 0).multiply(rot);
    }
    for (let i = 0; i < 7; i++) U.uOpen.value[i] = OPEN[i] * smooth(0.02, 0.9, T);
    // Liege: Beckenteil fährt mit dem Kreuzbein
    const shift = pos[S * 3] - (X0 + totalBase - SAC_H);
    M[NV].identity();
    M[NV + 1].makeTranslation(shift, 0, 0);
    jointX = 0.885 + shift * 0.5;
    FU.uX.value = jointX; FU.uW.value = 0.07 + shift;
  }

  const slider = ui && ui.slider;
  if (slider) slider.addEventListener('input', () => { Twant = slider.value / 100; auto = false; lastUser = performance.now(); });

  const labels = ui && ui.labels; // [{el, seg:'disc'|'root'}]
  const lp = new THREE.Vector3();
  function placeLabels() {
    if (!labels) return;
    const vis = smooth(0.3, 0.6, T);
    for (const L of labels) {
      if (L.kind === 'disc') { // Bandscheibenraum L4/L5
        lp.set(LEVELS[5].h / 2 + 0.065 + 0.065 * OPEN[5] * T, -0.3, 0.45).applyMatrix4(M[5]);
      } else { // Nervenaustritt L4/L5 (vordere Seite)
        lp.set(LEVELS[5].h / 2 + 0.065 + 0.065 * OPEN[5] * T + 0.2, LEVELS[5].ry + 0.13 - 0.2, 0.62).applyMatrix4(M[5]);
      }
      const s = toScreen(st, lp);
      const flip = s.x + L.el.offsetWidth > st.w - 6; // am rechten Rand: Schild links vom Punkt
      L.el.classList.toggle('flip', flip);
      L.el.style.transform = `translate(${s.x.toFixed(1)}px, ${s.y.toFixed(1)}px) translate(${flip ? '-100%' : '0'}, -50%)`;
      L.el.style.opacity = vis.toFixed(2);
    }
  }

  function update(time, dt) {
    U.uTime.value = time * SPEED;
    U.uPix.value = st.pix;
    introT = Math.min(1, introT + dt / 1.5);
    if (!auto && performance.now() - lastUser > 8000) auto = true;
    if (auto) {
      // ruhiger Atem: Zug langsam an, halten, langsam lösen
      const c = (time * SPEED) % 9, a = c < 3 ? smooth(0, 3, c) : c < 5.5 ? 1 : c < 8.2 ? 1 - smooth(5.5, 8.2, c) : 0;
      Twant = a;
      if (slider) slider.value = Math.round(a * 100);
    }
    T = damp(T, Twant, 4, dt);
    U.uT.value = T;
    layout();
    ui && ui.onAmount && ui.onAmount(T);
    // Kamera: seitlich, leicht von vorn-oben, sanftes Wiegen
    const yaw = -0.42 + (reduced ? 0 : Math.sin(time * 0.13) * 0.12), el = 0.2;
    const fit = st.aspect < 1.6 ? 1.6 / st.aspect : 1;
    const Rr = 8.6 * Math.pow(Math.min(fit, 2.1), 0.55);
    const tx = 0.1, ty = -0.15;
    st.camera.position.set(tx + Math.sin(yaw) * Math.cos(el) * Rr, ty + Math.sin(el) * Rr, Math.cos(yaw) * Math.cos(el) * Rr);
    st.camera.lookAt(tx, ty, 0);
    st.camera.updateMatrixWorld();
    placeLabels();
  }
  return { st, update, count: n };
}
