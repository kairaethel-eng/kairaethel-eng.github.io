// Idee C · „Drei Ebenen“: kompakte Highlight-Karte. Eine Partikel-Achse (Wirbelsäule mit Becken und
// Schultergürtel) im „Kreisel“ aus drei Bernstein-Ringen. Der aktive Ring leuchtet, die Achse bewegt sich
// in genau dieser Ebene: Flexion, Seitneigung, Rotation – dazu Traktion entlang der Achse.
import * as THREE from 'three';
import { stage, FRAG, COL, reduced, ease, damp, isDesktop } from './common.js';

export const MODES_C = [
  { id: 'traktion', name: 'Traktion', plane: 'Längsachse' },
  { id: 'flexion', name: 'Flexion', plane: 'Sagittalebene' },
  { id: 'seit', name: 'Seitneigung', plane: 'Frontalebene' },
  { id: 'rot', name: 'Rotation', plane: 'Transversalebene' },
];

const BASE = -1.3, LEN = 2.6, RING = 1.85;

export function initC(canvas, ui) {
  const st = stage(canvas, { fov: 30 });
  if (!st) return null;
  const R = Math.random;
  const A = [], OFF = [], KIND = [], RND = [];
  const add = (s, off, kind) => { A.push(s); OFF.push(off[0], off[1], off[2]); KIND.push(kind); RND.push(R(), R()); };
  // Wirbel: 17 Ebenen, nach unten kräftiger
  const LV = 17;
  for (let i = 0; i < LV; i++) {
    const f = i / (LV - 1), s = (1 - f) * (LEN - 0.12) + 0.06;
    const rx = 0.13 + f * 0.11, rz = 0.1 + f * 0.08;
    for (let j = 0; j < 60; j++) { const a = R() * Math.PI * 2, rr = R() < 0.6 ? 1 : Math.sqrt(R()); add(s + (R() - 0.5) * 0.07, [Math.cos(a) * rx * rr, 0, Math.sin(a) * rz * rr], 0); }
    for (let j = 0; j < 10; j++) add(s - 0.02 - R() * 0.05, [(R() - 0.5) * 0.02, 0, -rz - 0.05 - R() * 0.14], 1); // Dornfortsatz
    for (const sx of [-1, 1]) for (let j = 0; j < 7; j++) add(s + (R() - 0.5) * 0.03, [sx * (rx + 0.03 + R() * 0.12), 0, -0.03], 1); // Querfortsätze
  }
  // Becken (Ring) und Schultergürtel (Bogen)
  for (let j = 0; j < 320; j++) { const a = R() * Math.PI * 2; add(-0.12 + (R() - 0.5) * 0.08, [Math.cos(a) * 0.62, 0, Math.sin(a) * 0.32], 2); }
  for (let j = 0; j < 220; j++) { const u = R() * 2 - 1; add(LEN * 0.84 + (R() - 0.5) * 0.04, [u * 0.62, 0, -0.08 - u * u * 0.12], 2); }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(A.length * 3), 3));
  geo.setAttribute('aS', new THREE.Float32BufferAttribute(A, 1));
  geo.setAttribute('aOff', new THREE.Float32BufferAttribute(OFF, 3));
  geo.setAttribute('aKind', new THREE.Float32BufferAttribute(KIND, 1));
  geo.setAttribute('aRnd', new THREE.Float32BufferAttribute(RND, 2));
  const U = {
    uTime: { value: 0 }, uPix: { value: 1 }, uMove: { value: new THREE.Vector4() }, uSign: { value: 1 },
    cBone: { value: COL.boneHi }, cPetrol: { value: COL.petrol }, cAmber: { value: COL.amber }, cBlue: { value: COL.blue },
  };
  const spine = new THREE.Points(geo, new THREE.ShaderMaterial({
    uniforms: U, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fragmentShader: FRAG,
    vertexShader: /* glsl */`
      attribute float aS, aKind; attribute vec3 aOff; attribute vec2 aRnd;
      uniform float uTime, uPix, uSign; uniform vec4 uMove; uniform vec3 cBone, cPetrol, cAmber, cBlue;
      varying vec3 vCol; varying float vA;
      vec3 rotAxis(vec3 v, vec3 k, float a){ float c = cos(a), s = sin(a); return v*c + cross(k, v)*s + k*dot(k, v)*(1. - c); }
      void main(){
        float f = clamp(aS / ${LEN.toFixed(2)}, 0., 1.);
        float s = aS * (1. + .13 * uMove.x);                 // Traktion: Abstände wachsen
        vec3 off = rotAxis(aOff, vec3(0., 1., 0.), uMove.w * f * .85 * uSign); // Rotation: Verdrehung nach oben zunehmend
        vec2 kv = vec2(uMove.z * .55 * uSign, uMove.y * .5);   // Krümmung: x = Seitneigung, z = Flexion
        float kk = length(kv);
        vec3 p;
        if (kk < 1e-3) p = vec3(0., ${BASE.toFixed(2)} + s, 0.) + off;
        else {
          vec3 d = vec3(kv.x, 0., kv.y) / kk;
          float ph = kk * s;
          vec3 axis = normalize(vec3(d.z, 0., -d.x));
          p = vec3(0., ${BASE.toFixed(2)} + sin(ph)/kk, 0.) + d * (1. - cos(ph))/kk + rotAxis(off, axis, ph);
        }
        p += vec3(sin(uTime*.9 + aRnd.x*6.283), cos(uTime*.7 + aRnd.y*6.283), sin(uTime*.6 + aRnd.x*9.))*.006;
        vec4 mv = modelViewMatrix * vec4(p, 1.);
        gl_Position = projectionMatrix * mv;
        float act = max(max(uMove.x, uMove.y), max(uMove.z, uMove.w));
        float wave = pow(.5 + .5*sin(f*9. - uTime*2.2), 8.) * act;
        vec3 col = aKind < .5 ? cBone : aKind < 1.5 ? mix(cBone, cPetrol, .4) : mix(cBlue, cPetrol, .5);
        col = mix(col, cAmber, wave * (aKind < 1.5 ? .8 : .3));
        gl_PointSize = uPix * (aKind > 1.5 ? .95 : 1.2) * (1. + wave*.6) * (.6 + aRnd.y*.7) * 21. / -mv.z;
        vCol = col; vA = (aKind > 1.5 ? .5 : .95) * (.6 + aRnd.x*.4);
      }`,
  }));
  st.scene.add(spine);

  // Ringe + Zugachse
  const RP = [], RM = [], RS = [], RR = [];
  const ring = (m, fn, cnt) => { for (let i = 0; i < cnt; i++) { const s = i / cnt, p = fn(s * Math.PI * 2); RP.push(p[0], p[1], p[2]); RM.push(m); RS.push(s); RR.push(R()); } };
  const k = isDesktop() ? 1 : 0.8;
  ring(1, (a) => [0, Math.sin(a) * RING, Math.cos(a) * RING], Math.round(420 * k));
  ring(2, (a) => [Math.cos(a) * RING, Math.sin(a) * RING, 0], Math.round(420 * k));
  ring(3, (a) => [Math.cos(a) * RING, 0.0, Math.sin(a) * RING], Math.round(420 * k));
  for (const sy of [-1, 1]) {
    for (let i = 0; i < 60; i++) { const s = i / 59; RP.push(0, sy * (1.75 + s * 0.55), 0); RM.push(0); RS.push(s * 0.5 + (sy > 0 ? 0 : 0.5)); RR.push(R()); }
    for (let i = 0; i < 30; i++) { const s = i / 29, u = (s - 0.5) * 2; RP.push(u * 0.16, sy * (2.3 - Math.abs(u) * 0.16), 0); RM.push(0); RS.push(0.5); RR.push(R()); }
  }
  const rg = new THREE.BufferGeometry();
  rg.setAttribute('position', new THREE.Float32BufferAttribute(RP, 3));
  rg.setAttribute('aMode', new THREE.Float32BufferAttribute(RM, 1));
  rg.setAttribute('aS', new THREE.Float32BufferAttribute(RS, 1));
  rg.setAttribute('aR', new THREE.Float32BufferAttribute(RR, 1));
  const RU = { uTime: U.uTime, uPix: U.uPix, uW: { value: new THREE.Vector4() }, uSign: U.uSign, cAmber: U.cAmber, cPetrol: U.cPetrol, cBone: U.cBone };
  st.scene.add(new THREE.Points(rg, new THREE.ShaderMaterial({
    uniforms: RU, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fragmentShader: FRAG,
    vertexShader: /* glsl */`
      attribute float aMode, aS, aR; uniform float uTime, uPix, uSign; uniform vec4 uW; uniform vec3 cAmber, cPetrol, cBone;
      varying vec3 vCol; varying float vA;
      void main(){
        float w = aMode < .5 ? uW.x : aMode < 1.5 ? uW.y : aMode < 2.5 ? uW.z : uW.w;
        vec4 mv = modelViewMatrix * vec4(position, 1.);
        gl_Position = projectionMatrix * mv;
        float flow = aMode < .5 ? pow(fract(aS*2. - uTime*.5), 5.) : pow(fract(aS*3. - uTime*.16*uSign), 7.);
        float base = aMode < .5 ? 0. : .24;
        gl_PointSize = uPix * (1. + w*.35 + flow*w*1.6) * 19. / -mv.z;
        vCol = mix(mix(cPetrol*1.3, cBone, .25), cAmber, w);
        vA = base * (1. - w) + w * (.45 + flow*.9);
      }`,
  })));

  const SPEED = reduced ? 0.5 : 1;
  const DUR = { in: 1.5, hold: 1.4, out: 1.4, rest: 0.6 };
  const CYCLE = DUR.in + DUR.hold + DUR.out + DUR.rest;
  let mode = 0, phase = 0, auto = true, lastUser = -1e9, flip = 1;
  const cur = new Float32Array(4);
  const select = (i, user) => { mode = i; phase = 0; if (user) { auto = false; lastUser = performance.now(); } ui && ui.onMode && ui.onMode(i); };
  select(0);
  function update(time, dt) {
    U.uTime.value = time * SPEED; U.uPix.value = st.pix;
    phase += dt * SPEED;
    if (phase > CYCLE) { phase -= CYCLE; if (auto) { if (mode === 3) flip = -flip; select((mode + 1) % 4); } }
    if (!auto && performance.now() - lastUser > 9000) auto = true;
    const p = phase;
    const amt = p < DUR.in ? ease(p / DUR.in) : p < DUR.in + DUR.hold ? 1 : p < DUR.in + DUR.hold + DUR.out ? 1 - ease((p - DUR.in - DUR.hold) / DUR.out) : 0;
    for (let i = 0; i < 4; i++) cur[i] = damp(cur[i], i === mode ? amt : 0, 8, dt);
    U.uMove.value.set(cur[0], cur[1], cur[2], cur[3]);
    U.uSign.value = flip;
    // Ringe: aktiver Ring bleibt etwas länger hell als die Bewegung
    for (let i = 0; i < 4; i++) RU.uW.value.setComponent(i, damp(RU.uW.value.getComponent(i), i === mode ? 1 : 0, 3, dt));
    const yaw = 0.62 + (reduced ? 0 : Math.sin(time * 0.15) * 0.18), el = 0.3, Rr = 8.4 * (st.aspect < 1 ? 1 / st.aspect : 1);
    st.camera.position.set(Math.sin(yaw) * Math.cos(el) * Rr, Math.sin(el) * Rr, Math.cos(yaw) * Math.cos(el) * Rr);
    st.camera.lookAt(0, 0, 0);
  }
  return { st, update, select };
}
