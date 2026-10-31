// Idee A · „Bühne“: die Manuthera als Partikel-Liege in 3D. Kopf-/Brustteil und Unterkörperteil
// bewegen sich nacheinander in Traktion, Flexion, Seitneigung und Rotation; die liegende Figur
// (Wirbelsäule hervorgehoben) folgt. Schematisch, keine Herstellerzeichnung.
import * as THREE from 'three';
import { stage, FRAG, COL, reduced, boxPts, cylPts, ellPts, dragYaw, ease, damp, isDesktop } from './common.js';

export const MODES = [
  { id: 'traktion', name: 'Traktion', txt: 'Sanfter Zug in Längsrichtung: Brust- und Beckenteil gleiten auseinander, die Wirbelsäule bekommt Raum.' },
  { id: 'flexion', name: 'Flexion', txt: 'Brust- und Beckenteil neigen sich nach unten. Die Wirbelsäule beugt sich, genau dosiert und Abschnitt für Abschnitt.' },
  { id: 'seit', name: 'Seitneigung', txt: 'Das Beckenteil schwenkt zur Seite. Seitneigung in entspannter Lage, ohne dass Sie selbst Kraft aufwenden.' },
  { id: 'rot', name: 'Rotation', txt: 'Das Beckenteil dreht sich um die Längsachse. So lässt sich die Wirbelsäule gezielt in die Drehung führen.' },
];

const PIV_U = -0.855, PIV_L = 0.0; // Gelenke zwischen den Liegeteilen (x)

export function initA(canvas, ui) {
  const st = stage(canvas, { fov: 30 });
  if (!st) return null;

  // ---------- Punktwolke aufbauen ----------
  const P = [], COLS = [], SEGA = [], SEGB = [], W = [], AL = [], SZ = [], KIND = [], RND = [];
  const add = (arr, col, al, sz, kind, segFn) => {
    for (let i = 0; i < arr.length; i += 3) {
      const x = arr[i];
      P.push(arr[i], arr[i + 1], arr[i + 2]);
      const c = col(x, arr[i + 1], arr[i + 2]);
      COLS.push(c.r, c.g, c.b); AL.push(al); SZ.push(sz); KIND.push(kind);
      const s = segFn(x); SEGA.push(s[0]); SEGB.push(s[1]); W.push(s[2]);
      RND.push(Math.random(), Math.random());
    }
  };
  const fixed = () => [0, 0, 0], upper = () => [1, 1, 0], lower = () => [2, 2, 0];
  // weicher Übergang für Körper und Wirbelsäule (biegt sich statt zu brechen)
  const blend = (b) => (x) => {
    if (x < PIV_U - b) return [1, 1, 0];
    if (x < PIV_U + b) return [1, 0, (x - (PIV_U - b)) / (2 * b)];
    if (x < PIV_L - b) return [0, 0, 0];
    if (x < PIV_L + b) return [0, 2, (x - (PIV_L - b)) / (2 * b)];
    return [2, 2, 0];
  };
  const k = isDesktop() ? 1 : 0.75; // Handy: weniger Punkte
  const N = (n) => Math.round(n * k);
  const cushion = () => COL.bone, edge = () => COL.boneHi;
  let t;
  // Polster (Oberseite y = 0)
  t = []; boxPts(t, N(900), -1.965, -0.08, 0, 0.57, 0.16, 0.62, 0.6, { x: 0, z: 0, r: 0.12 }); add(t, cushion, 0.62, 1, 0, upper);
  t = []; boxPts(t, N(1700), -1.255, -0.08, 0, 0.75, 0.16, 1.3, 0.6); add(t, cushion, 0.62, 1, 0, upper);
  t = []; boxPts(t, N(1700), -0.43, -0.08, 0, 0.8, 0.16, 1.3, 0.6); add(t, cushion, 0.62, 1, 0, fixed);
  t = []; boxPts(t, N(1900), 0.5, -0.08, 0, 0.94, 0.16, 1.3, 0.6); add(t, cushion, 0.62, 1, 0, lower);
  t = []; boxPts(t, N(2300), 1.62, -0.08, 0, 1.22, 0.16, 1.3, 0.6); add(t, cushion, 0.62, 1, 0, lower);
  // Unterrahmen der Teile (dünn, petrol)
  t = []; boxPts(t, N(500), -1.6, -0.22, 0, 1.25, 0.06, 0.9, 0.7); add(t, () => COL.petrol, 0.6, 0.8, 1, upper);
  t = []; boxPts(t, N(400), -0.43, -0.22, 0, 0.7, 0.06, 0.9, 0.7); add(t, () => COL.petrol, 0.6, 0.8, 1, fixed);
  t = []; boxPts(t, N(700), 1.1, -0.22, 0, 2.0, 0.06, 0.9, 0.7); add(t, () => COL.petrol, 0.6, 0.8, 1, lower);
  // Armstützen
  for (const z of [-0.9, 0.9]) { t = []; boxPts(t, N(450), -1.5, -0.3, z, 0.5, 0.11, 0.3, 0.55); add(t, cushion, 0.65, 0.9, 0, fixed); }
  // Gestell: Hubsäule, Gehäuse, Fußrahmen, Rollen
  t = []; boxPts(t, N(1000), 0, -0.55, 0, 1.9, 0.4, 0.5, 0.6); add(t, () => COL.petrol, 0.55, 0.9, 1, fixed);
  for (const x of [-0.55, 0.55]) { t = []; boxPts(t, N(350), x, -1.05, 0, 0.22, 0.62, 0.22, 0.7); add(t, () => COL.petrol, 0.55, 0.9, 1, fixed); }
  for (const z of [-0.5, 0.5]) { t = []; boxPts(t, N(500), 0, -1.38, z, 2.6, 0.07, 0.1, 0.8); add(t, () => COL.petrol, 0.6, 0.9, 1, fixed); }
  t = []; boxPts(t, N(250), 0, -1.38, 0, 0.12, 0.06, 1.0, 0.8); add(t, () => COL.petrol, 0.5, 0.9, 1, fixed);
  for (const x of [-1.25, 1.25]) for (const z of [-0.5, 0.5]) { t = []; cylPts(t, N(60), 'z', z - 0.04, z + 0.04, 0.07, [x, -1.48], 0.5); add(t, () => COL.grey, 0.5, 0.8, 1, fixed); }

  // Liegende Figur (Bauchlage, Gesicht in der Gesichtsöffnung): zart
  const bodyCol = () => COL.blue.clone().lerp(COL.petrol, 0.4);
  const bb = blend(0.28);
  t = []; ellPts(t, N(500), -1.98, 0.17, 0, 0.2, 0.16, 0.16); add(t, bodyCol, 0.5, 1, 2, bb);
  t = []; ellPts(t, N(2200), -0.75, 0.2, 0, 0.92, 0.19, 0.46); add(t, bodyCol, 0.5, 1, 2, bb);
  t = []; ellPts(t, N(1100), 0.28, 0.19, 0, 0.36, 0.17, 0.4); add(t, bodyCol, 0.55, 1, 2, bb);
  for (const z of [-0.2, 0.2]) { t = []; cylPts(t, N(1400), 'x', 0.5, 2.1, 0.12, [0.13, z], 0.05); add(t, bodyCol, 0.6, 1, 2, bb); }
  for (const z of [-1, 1]) {
    // Arme hängen auf die Armstützen
    t = [];
    for (let i = 0; i < N(260); i++) {
      const s = Math.random(), a = Math.random() * Math.PI * 2, r = 0.075;
      t.push(-1.5 + s * 0.05 + Math.cos(a) * r * 0.6, 0.18 - s * 0.38 + Math.sin(a) * r, z * (0.52 + s * 0.38) + Math.cos(a) * r);
    }
    add(t, bodyCol, 0.5, 1, 2, bb);
  }
  // Wirbelsäule (rückenseitig, hervorgehoben)
  t = [];
  const LV = 24;
  for (let i = 0; i < LV; i++) {
    const f = i / (LV - 1), x = -1.8 + f * 2.15, h = 0.035 + f * 0.03;
    const y = 0.3 + Math.sin(f * Math.PI * 2.0) * 0.02;
    ellPts(t, N(46), x, y, 0, h, 0.04, 0.06 + f * 0.02);
    ellPts(t, N(10), x + 0.02, y + 0.07, 0, 0.012, 0.03, 0.012); // Dornfortsatz
  }
  ellPts(t, N(200), 0.5, 0.29, 0, 0.16, 0.05, 0.12); // Kreuzbein
  add(t, () => COL.boneHi, 0.42, 1, 3, blend(0.22));

  const n = P.length / 3;
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
  geo.setAttribute('aCol', new THREE.Float32BufferAttribute(COLS, 3));
  geo.setAttribute('aSegA', new THREE.Float32BufferAttribute(SEGA, 1));
  geo.setAttribute('aSegB', new THREE.Float32BufferAttribute(SEGB, 1));
  geo.setAttribute('aW', new THREE.Float32BufferAttribute(W, 1));
  geo.setAttribute('aAl', new THREE.Float32BufferAttribute(AL, 1));
  geo.setAttribute('aSz', new THREE.Float32BufferAttribute(SZ, 1));
  geo.setAttribute('aKind', new THREE.Float32BufferAttribute(KIND, 1));
  geo.setAttribute('aRnd', new THREE.Float32BufferAttribute(RND, 2));

  const M = [new THREE.Matrix4(), new THREE.Matrix4(), new THREE.Matrix4()];
  const U = {
    uM: { value: M }, uTime: { value: 0 }, uPix: { value: 1 }, uHi: { value: new THREE.Vector3() },
    uSpineHi: { value: new THREE.Vector2(0.1, 0) }, uIntro: { value: reduced ? 1 : 0 },
    cAmber: { value: COL.amber },
  };
  const mat = new THREE.ShaderMaterial({
    uniforms: U, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fragmentShader: FRAG,
    vertexShader: /* glsl */`
      attribute vec3 aCol; attribute float aSegA, aSegB, aW, aAl, aSz, aKind; attribute vec2 aRnd;
      uniform mat4 uM[3]; uniform float uTime, uPix, uIntro; uniform vec3 uHi; uniform vec2 uSpineHi; uniform vec3 cAmber;
      varying vec3 vCol; varying float vA;
      void main(){
        int a = int(aSegA + .5), b = int(aSegB + .5);
        vec3 p = mix((uM[a] * vec4(position, 1.)).xyz, (uM[b] * vec4(position, 1.)).xyz, aW);
        p += vec3(sin(uTime*.7 + aRnd.x*6.283), cos(uTime*.6 + aRnd.y*6.283), sin(uTime*.5 + aRnd.x*12.))*.005;
        // Intro: Punkte sammeln sich aus einer Wolke
        vec3 dir = normalize(vec3(aRnd.x - .5, aRnd.y - .5, fract(aRnd.x*7.3) - .5) + 1e-4);
        float it = smoothstep(aRnd.y*.5, aRnd.y*.5 + .5, uIntro);
        p += dir * (1. - it) * (2.5 + aRnd.x*3.);
        vec4 mv = modelViewMatrix * vec4(p, 1.);
        gl_Position = projectionMatrix * mv;
        float hi = a == 1 ? uHi.y : a == 2 ? uHi.z : 0.;
        hi = max(hi, b == 2 ? uHi.z * aW : 0.);
        vec3 col = aCol;
        if (aKind < .5) col = mix(col, cAmber, hi * .55);
        float g = 0.;
        if (aKind > 2.5) { g = exp(-pow((p.x - uSpineHi.x) * 2.6, 2.)) * uSpineHi.y; col = mix(col, cAmber, g); }
        gl_PointSize = uPix * aSz * (1. + g*.8) * (.6 + aRnd.y*.7) * 22. / -mv.z;
        vCol = col;
        vA = aAl * (.55 + aRnd.x*.45) * it;
      }`,
  });
  st.scene.add(new THREE.Points(geo, mat));

  // ---------- Bewegungs-Anzeige (Bernstein, fest im Raum) ----------
  const IP = [], IM = [], IS = [], IR = [];
  const ind = (mode, fn, cnt) => { for (let i = 0; i < cnt; i++) { const s = i / (cnt - 1), p = fn(s); IP.push(p[0], p[1], p[2]); IM.push(mode); IS.push(s); IR.push(Math.random()); } };
  ind(0, (s) => [2.32 + s * 0.9, -0.08, 0], 90);
  ind(0, (s) => [3.22 - Math.abs(s - 0.5) * 0.3, -0.08, (s - 0.5) * 0.36], 30); // Pfeilspitze
  ind(1, (s) => { const a = -s * 0.5, r = 2.38; return [PIV_L + Math.cos(a) * r, Math.sin(a) * r - 0.02, 0.72]; }, 90);
  ind(2, (s) => { const a = s * 0.32, r = 2.38; return [PIV_L + Math.cos(a) * r, -0.08, -Math.sin(a) * r]; }, 90);
  ind(3, (s) => { const a = Math.PI / 2 + (s - 0.25) * 1.3, r = 0.78; return [2.36, Math.sin(a) * r - 0.08, Math.cos(a) * r]; }, 90);
  const ig = new THREE.BufferGeometry();
  ig.setAttribute('position', new THREE.Float32BufferAttribute(IP, 3));
  ig.setAttribute('aMode', new THREE.Float32BufferAttribute(IM, 1));
  ig.setAttribute('aS', new THREE.Float32BufferAttribute(IS, 1));
  ig.setAttribute('aR', new THREE.Float32BufferAttribute(IR, 1));
  const IU = { uTime: U.uTime, uPix: U.uPix, uModeW: { value: new THREE.Vector4() }, cAmber: U.cAmber };
  st.scene.add(new THREE.Points(ig, new THREE.ShaderMaterial({
    uniforms: IU, transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending, fragmentShader: FRAG,
    vertexShader: /* glsl */`
      attribute float aMode, aS, aR; uniform float uTime, uPix; uniform vec4 uModeW; uniform vec3 cAmber;
      varying vec3 vCol; varying float vA;
      void main(){
        float w = aMode < .5 ? uModeW.x : aMode < 1.5 ? uModeW.y : aMode < 2.5 ? uModeW.z : uModeW.w;
        vec4 mv = modelViewMatrix * vec4(position, 1.);
        gl_Position = projectionMatrix * mv;
        float flow = pow(fract(aS - uTime*.45), 6.);
        gl_PointSize = uPix * (1.1 + flow*1.8) * 20. / -mv.z;
        vCol = mix(cAmber, vec3(1., .93, .8), flow*.5);
        vA = w * (.35 + flow*.9);
      }`,
  })));

  // ---------- Kamera & Bewegung ----------
  const cam = { yaw: 0, yawTarget: 0, lastUser: -1e9, dragging: false };
  dragYaw(canvas, cam);
  const target = new THREE.Vector3(0.1, -0.5, 0);
  const SPEED = reduced ? 0.5 : 1;
  const DUR = { in: 1.7, hold: 1.5, out: 1.5, rest: 0.7 };
  const CYCLE = DUR.in + DUR.hold + DUR.out + DUR.rest;
  let mode = 0, phase = 0, auto = true, cur = new Float32Array(4);
  const select = (i, user) => { mode = i; phase = 0; if (user) { auto = false; cam.lastUser = performance.now(); } ui && ui.onMode && ui.onMode(i); };
  select(0);

  const tmp = new THREE.Matrix4(), T1 = new THREE.Matrix4(), T2 = new THREE.Matrix4();
  const pivotMat = (out, px, rx, ry, rz, tx) => {
    T1.makeTranslation(px + tx, 0, 0);
    tmp.makeRotationFromEuler(new THREE.Euler(rx, ry, rz, 'XYZ'));
    T2.makeTranslation(-px, 0, 0);
    out.copy(T1).multiply(tmp).multiply(T2);
  };

  let introStart = null;
  function update(time, dt) {
    if (introStart === null) introStart = time;
    U.uIntro.value = reduced ? 1 : Math.min(1, (time - introStart) / 2.4);
    U.uTime.value = time * SPEED;
    U.uPix.value = st.pix;
    phase += dt * SPEED;
    if (phase > CYCLE) { phase -= CYCLE; if (auto) select((mode + 1) % 4); }
    if (!auto && performance.now() - cam.lastUser > 9000) auto = true;
    const p = phase;
    const amt = p < DUR.in ? ease(p / DUR.in) : p < DUR.in + DUR.hold ? 1 : p < DUR.in + DUR.hold + DUR.out ? 1 - ease((p - DUR.in - DUR.hold) / DUR.out) : 0;
    for (let i = 0; i < 4; i++) cur[i] = damp(cur[i], i === mode ? amt : 0, 8, dt);
    const [tr, fl, se, ro] = cur;
    pivotMat(M[1], PIV_U, 0, -0.13 * se, 0.12 * fl, -0.07 * tr);
    pivotMat(M[2], PIV_L, 0.36 * ro, 0.31 * se, -0.42 * fl, 0.34 * tr);
    U.uHi.value.set(0, Math.max(tr, fl, se) * 0.7, Math.max(tr, fl, se, ro));
    U.uSpineHi.value.set(mode === 0 ? -0.25 : 0.05, Math.max(tr, fl, se, ro) * 0.85);
    IU.uModeW.value.set(cur[0], cur[1], cur[2], cur[3]);
    ui && ui.onAmount && ui.onAmount(amt);

    // Kamera: langsames Kreisen, Ziehen dreht
    const idle = !reduced && !cam.dragging && performance.now() - cam.lastUser > 3000;
    if (idle) cam.yawTarget = damp(cam.yawTarget, Math.sin(time * 0.11) * 0.25, 0.6, dt);
    cam.yaw = damp(cam.yaw, cam.yawTarget, 5, dt);
    const yaw = 0.8 + cam.yaw, el = 0.44;
    const fit = st.aspect < 1.3 ? 1.3 / st.aspect : 1;
    const R = 7.3 * Math.pow(Math.min(fit, 1.8), 0.72);
    st.camera.position.set(target.x + Math.sin(yaw) * Math.cos(el) * R, target.y + Math.sin(el) * R, target.z + Math.cos(yaw) * Math.cos(el) * R);
    st.camera.lookAt(target);
  }
  return { st, update, select, MODES, count: n };
}
