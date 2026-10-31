// Idee A · „Bühne“: die Manuthera als gestochene Partikel-Liege in 3D (wie die Wirbelsäule in Kapitel 03:
// gleichmäßige Punkte, dunkler Kern, Licht und Schatten). Darauf eine liegende Figur in Bauchlage, die
// Wirbelsäule schimmert durch. Brust- und Beckenteil zeigen nacheinander Traktion, Flexion, Seitneigung,
// Rotation. Schematisch, keine Herstellerzeichnung.
import * as THREE from 'three';
import { stage, FRAG, COL, C, reduced, dragYaw, ease, damp, isDesktop, smooth } from './common.js';
import { stipple, coreOf, coreMaterial, stippleMaterial, stipSize, capsule, ellipsoid, box, DEFORM } from './stipple.js';

export const MODES = [
  { id: 'traktion', name: 'Traktion', txt: 'Sanfter Zug in Längsrichtung: Brust- und Beckenteil gleiten auseinander, die Wirbelsäule bekommt Raum.' },
  { id: 'flexion', name: 'Flexion', txt: 'Brust- und Beckenteil neigen sich nach unten. Die Wirbelsäule beugt sich, genau dosiert und Abschnitt für Abschnitt.' },
  { id: 'seit', name: 'Seitneigung', txt: 'Das Beckenteil schwenkt zur Seite. Seitneigung in entspannter Lage, ohne dass Sie selbst Kraft aufwenden.' },
  { id: 'rot', name: 'Rotation', txt: 'Das Beckenteil dreht sich um die Längsachse. So lässt sich die Wirbelsäule gezielt in die Drehung führen.' },
];

const PIV_U = -0.855, PIV_L = 0.0; // Gelenke zwischen den Liegeteilen (x)
const FOV = 30, NSEG = 3;

export function initA(canvas, ui) {
  const st = stage(canvas, { fov: FOV, transparent: !!(ui && ui.transparent) });
  if (!st) return null;
  const desk = isDesktop();

  // Segment-Zuordnung: 0 fest (Mittelteil, Gestell, Armstützen), 1 Kopf-/Brustteil, 2 Beckenteil
  const blend = (b) => (x) => {
    if (x < PIV_U - b) return [1, 1, 0];
    if (x < PIV_U + b) return [1, 0, smooth(PIV_U - b, PIV_U + b, x)];
    if (x < PIV_L - b) return [0, 0, 0];
    if (x < PIV_L + b) return [0, 2, smooth(PIV_L - b, PIV_L + b, x)];
    return [2, 2, 0];
  };
  const mapX = (fn) => (v) => { const s = fn(v.x); return { la: v, lb: v, a: s[0], b: s[1], w: s[2] }; };
  const F = mapX(() => [0, 0, 0]), UP = mapX(() => [1, 1, 0]), LO = mapX(() => [2, 2, 0]);
  // Arme: Schulter gehört zum Brustteil, Unterarm liegt auf der festen Armstütze
  const mapArm = (v) => ({ la: v, lb: v, a: 1, b: 0, w: smooth(0.2, -0.12, v.y) });
  const noDown = (n) => n.y > -0.5;
  const parts = [];
  const add = (geo, kind, map, dens = 1) => parts.push({ geo, kind, map, keep: noDown, dens });

  // ---------- Liege ----------
  add(box([-1.965, -0.08, 0], [0.57, 0.16, 0.62]), 0, UP);
  add(box([-1.255, -0.08, 0], [0.75, 0.16, 1.3]), 0, UP);
  add(box([-0.43, -0.08, 0], [0.8, 0.16, 1.3]), 0, F);
  add(box([0.5, -0.08, 0], [0.94, 0.16, 1.3]), 0, LO);
  add(box([1.62, -0.08, 0], [1.22, 0.16, 1.3]), 0, LO);
  for (const z of [-0.9, 0.9]) add(box([-1.5, -0.3, z], [0.5, 0.11, 0.3]), 0, F);
  // Rahmen und Gestell
  add(box([-1.6, -0.22, 0], [1.25, 0.06, 0.9]), 1, UP, 0.6);
  add(box([-0.43, -0.22, 0], [0.7, 0.06, 0.9]), 1, F, 0.6);
  add(box([1.1, -0.22, 0], [2.0, 0.06, 0.9]), 1, LO, 0.6);
  for (const z of [-0.9, 0.9]) add(box([-1.5, -0.33, z * 0.78], [0.06, 0.05, 0.42]), 1, F, 0.6);
  add(box([0, -0.55, 0], [1.9, 0.4, 0.5]), 1, F, 0.6);
  for (const x of [-0.55, 0.55]) add(box([x, -1.05, 0], [0.22, 0.62, 0.22]), 1, F, 0.6);
  for (const z of [-0.5, 0.5]) add(box([0, -1.38, z], [2.6, 0.07, 0.1]), 1, F, 0.6);
  add(box([0, -1.38, 0], [0.12, 0.06, 1.0]), 1, F, 0.6);
  for (const x of [-1.25, 1.25]) for (const z of [-0.5, 0.5]) {
    const g = new THREE.CylinderGeometry(0.07, 0.07, 0.08, 16); g.rotateX(Math.PI / 2); g.translate(x, -1.48, z);
    parts.push({ geo: g, kind: 1, map: F, dens: 0.6 });
  }

  // ---------- Liegende Figur (Bauchlage, Gesicht in der Gesichtsöffnung) ----------
  const bb = mapX(blend(0.3));
  const BD = 1.7; // feinere Punkte am Körper
  add(ellipsoid([-1.99, 0.2, 0], [0.21, 0.17, 0.16]), 2, bb, BD);
  add(capsule([-1.8, 0.21, 0], [-1.66, 0.23, 0], 0.085), 2, bb, BD);
  add(ellipsoid([-1.2, 0.23, 0], [0.52, 0.22, 0.45]), 2, bb, BD);
  add(capsule([-1.5, 0.25, -0.4], [-1.5, 0.25, 0.4], 0.12), 2, bb, BD);
  add(ellipsoid([-0.47, 0.19, 0], [0.42, 0.18, 0.36]), 2, bb, BD);
  add(ellipsoid([0.17, 0.2, 0], [0.34, 0.2, 0.4]), 2, bb, BD);
  for (const s of [-1, 1]) {
    add(ellipsoid([0.3, 0.27, s * 0.17], [0.25, 0.15, 0.19]), 2, bb, BD);
    add(capsule([0.42, 0.15, s * 0.19], [1.2, 0.12, s * 0.2], 0.13), 2, bb, BD);
    add(capsule([1.24, 0.1, s * 0.2], [1.98, 0.09, s * 0.18], 0.085), 2, bb, BD);
    add(capsule([2.0, 0.12, s * 0.18], [2.15, 0.05, s * 0.19], 0.06), 2, bb, BD);
    add(capsule([-1.5, 0.22, s * 0.45], [-1.46, -0.08, s * 0.83], 0.07), 2, mapArm, BD);
    add(capsule([-1.46, -0.16, s * 0.86], [-1.78, -0.18, s * 0.9], 0.06), 2, mapArm, BD);
    add(ellipsoid([-1.86, -0.19, s * 0.9], [0.075, 0.03, 0.05]), 2, mapArm, BD);
  }

  const N = desk ? 42000 : 19000;
  const pts = stipple(parts, N);
  const core = coreOf(parts);

  const M = [new THREE.Matrix4(), new THREE.Matrix4(), new THREE.Matrix4()];
  const U = {
    uM: { value: M }, uStip: { value: 1 }, uMaxSize: { value: 6 }, uCut: { value: reduced ? 99 : -3 }, uInset: { value: 0.008 },
    uHi: { value: new THREE.Vector3() }, uTime: { value: 0 }, uPix: { value: 1 }, uSpineHi: { value: new THREE.Vector2() },
    cCore: { value: C('#0E1C22') }, cBone: { value: C('#EDE5D3') }, cFrame: { value: C('#5F8EA0') }, cBody: { value: C('#7DB7E0') },
    cBlue: { value: COL.blue }, cAmber: { value: COL.amber },
  };
  const coreMesh = new THREE.Mesh(core, coreMaterial(U, NSEG));
  const ptsMesh = new THREE.Points(pts.geo, stippleMaterial(U, NSEG, /* glsl */`
    uniform vec3 cBone, cFrame, cBody, cBlue; uniform vec3 uHi;`, /* glsl */`
    vec3 base = aKind < .5 ? cBone : aKind < 1.5 ? cFrame : cBody;
    float amb = aKind > 1.5 ? .3 : .2;
    col = base * (amb + (1. - amb) * lam) + cBlue * rim * (aKind > 1.5 ? .4 : .14);
    int sa = int(aSegA + .5);
    float hi = sa == 1 ? uHi.y : sa == 2 ? uHi.z : 0.;
    if (aKind < .5) col = mix(col, cAmber * (.45 + .85 * lam), hi * .28);
    sz = aKind > 1.5 ? .8 : 1.;`));
  [coreMesh, ptsMesh].forEach((o) => { o.frustumCulled = false; st.scene.add(o); });

  // ---------- Wirbelsäule: schimmert durch den Körper ----------
  const SP = [], SW = [], SA = [], SB = [];
  const sb = blend(0.24);
  const pushS = (x, y, z) => { const s = sb(x); SP.push(x, y, z); SA.push(s[0]); SB.push(s[1]); SW.push(s[2]); };
  const LV = 24;
  // Perlenkette: je Wirbel ein Kern + Dornfortsatz, dazwischen feine Bandscheiben-Punkte
  const SZ = [];
  for (let i = 0; i < LV; i++) {
    const f = i / (LV - 1), x = -1.76 + f * 2.06, y = 0.33 + Math.sin(f * Math.PI * 2) * 0.02;
    pushS(x, y, 0); SZ.push(1.6 + f * 1.1);
    pushS(x + 0.01, y + 0.06, 0); SZ.push(0.8);
    if (i < LV - 1) { pushS(x + 0.043, y, 0); SZ.push(0.55); }
  }
  for (let j = 0; j < 5; j++) { const u = j / 4; pushS(0.36 + u * 0.24, 0.32 - u * 0.03, 0); SZ.push(2.6 - u * 1.4); }
  const sg = new THREE.BufferGeometry();
  sg.setAttribute('position', new THREE.Float32BufferAttribute(SP, 3));
  sg.setAttribute('pos2', new THREE.Float32BufferAttribute(SP, 3));
  sg.setAttribute('normal', new THREE.Float32BufferAttribute(SP.map(() => 0), 3));
  sg.setAttribute('aSegA', new THREE.Float32BufferAttribute(SA, 1));
  sg.setAttribute('aSegB', new THREE.Float32BufferAttribute(SB, 1));
  sg.setAttribute('aW', new THREE.Float32BufferAttribute(SW, 1));
  sg.setAttribute('aKind', new THREE.Float32BufferAttribute(SZ, 1));
  const spine = new THREE.Points(sg, new THREE.ShaderMaterial({
    uniforms: U, transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending, fragmentShader: FRAG,
    vertexShader: DEFORM(NSEG) + /* glsl */`
      uniform float uPix, uCut; uniform vec2 uSpineHi; uniform vec3 cBone, cAmber;
      varying vec3 vCol; varying float vA;
      void main(){
        vec3 p = deformP(position, pos2);
        vec4 mv = viewMatrix * vec4(p, 1.); gl_Position = projectionMatrix * mv;
        float g = exp(-pow((p.x - uSpineHi.x) * 2.4, 2.)) * uSpineHi.y;
        gl_PointSize = uPix * aKind * (1. + g * .5) * 30. / -mv.z;
        vCol = mix(cBone, cAmber, g);
        vA = (.42 + g * .5) * step(p.x, uCut);
      }`,
  }));
  spine.frustumCulled = false; st.scene.add(spine);

  // ---------- Bewegungs-Anzeige (Bernstein, fest im Raum) ----------
  const IP = [], IM = [], IS = [];
  const ind = (mode, fn, cnt) => { for (let i = 0; i < cnt; i++) { const s = i / (cnt - 1), p = fn(s); IP.push(p[0], p[1], p[2]); IM.push(mode); IS.push(s); } };
  ind(0, (s) => [2.32 + s * 0.9, -0.08, 0], 90);
  ind(0, (s) => [3.22 - Math.abs(s - 0.5) * 0.3, -0.08, (s - 0.5) * 0.36], 30);
  ind(1, (s) => { const a = -s * 0.5, r = 2.38; return [PIV_L + Math.cos(a) * r, Math.sin(a) * r - 0.02, 0.72]; }, 90);
  ind(2, (s) => { const a = s * 0.32, r = 2.38; return [PIV_L + Math.cos(a) * r, -0.08, -Math.sin(a) * r]; }, 90);
  ind(3, (s) => { const a = Math.PI / 2 + (s - 0.25) * 1.3, r = 0.78; return [2.36, Math.sin(a) * r - 0.08, Math.cos(a) * r]; }, 90);
  const ig = new THREE.BufferGeometry();
  ig.setAttribute('position', new THREE.Float32BufferAttribute(IP, 3));
  ig.setAttribute('aMode', new THREE.Float32BufferAttribute(IM, 1));
  ig.setAttribute('aS', new THREE.Float32BufferAttribute(IS, 1));
  const IU = { uTime: U.uTime, uPix: U.uPix, uModeW: { value: new THREE.Vector4() }, cAmber: U.cAmber };
  const indPts = new THREE.Points(ig, new THREE.ShaderMaterial({
    uniforms: IU, transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending, fragmentShader: FRAG,
    vertexShader: /* glsl */`
      attribute float aMode, aS; uniform float uTime, uPix; uniform vec4 uModeW; uniform vec3 cAmber;
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
  }));
  indPts.frustumCulled = false; st.scene.add(indPts);

  // ---------- Kamera & Bewegung ----------
  const cam = { yaw: 0, yawTarget: 0, lastUser: -1e9, dragging: false };
  dragYaw(canvas, cam);
  const target = new THREE.Vector3(0.1, -0.5, 0);
  const SPEED = reduced ? 0.5 : 1;
  const DUR = { in: 1.7, hold: 1.5, out: 1.5, rest: 0.7 };
  const CYCLE = DUR.in + DUR.hold + DUR.out + DUR.rest;
  let mode = 0, phase = 0, auto = true, scanT = reduced ? 1 : 0;
  const cur = new Float32Array(4);
  const select = (i, user) => { mode = i; phase = 0; if (user) { auto = false; cam.lastUser = performance.now(); } ui && ui.onMode && ui.onMode(i); };
  select(0);

  const tmp = new THREE.Matrix4(), T1 = new THREE.Matrix4(), T2 = new THREE.Matrix4(), eu = new THREE.Euler();
  const pivotMat = (out, px, rx, ry, rz, tx) => {
    T1.makeTranslation(px + tx, 0, 0);
    tmp.makeRotationFromEuler(eu.set(rx, ry, rz, 'XYZ'));
    T2.makeTranslation(-px, 0, 0);
    out.copy(T1).multiply(tmp).multiply(T2);
  };

  let clockT = 0;
  function update(_time, dt) {
    // „Bewegung anhalten“ (Puls · Scan): alles steht, die Liege ist sofort vollständig sichtbar
    if (ui && ui.isPaused && ui.isPaused()) { dt = 0; if (scanT < 1) { scanT = 1; U.uCut.value = 99; } }
    clockT += dt;
    const time = clockT;
    U.uTime.value = time * SPEED;
    U.uPix.value = st.pix;
    U.uStip.value = stipSize(st, FOV, pts.spacing);
    // Scan beim ersten Sichtbarwerden: Liege entsteht vom Kopf- zum Fußende
    if (!reduced && scanT < 1) { scanT = Math.min(1, scanT + dt / 2.6); U.uCut.value = -2.6 + ease(scanT) * 6.2; if (scanT >= 1) U.uCut.value = 99; }
    phase += dt * SPEED;
    if (phase > (scanT < 1 ? 1e9 : CYCLE)) { phase -= CYCLE; if (auto) select((mode + 1) % 4); }
    if (scanT < 1) phase = 0;
    if (!auto && performance.now() - cam.lastUser > 9000) auto = true;
    const p = phase;
    const amt = p < DUR.in ? ease(p / DUR.in) : p < DUR.in + DUR.hold ? 1 : p < DUR.in + DUR.hold + DUR.out ? 1 - ease((p - DUR.in - DUR.hold) / DUR.out) : 0;
    for (let i = 0; i < 4; i++) cur[i] = damp(cur[i], i === mode ? amt : 0, 8, dt);
    const [tr, fl, se, ro] = cur;
    pivotMat(M[1], PIV_U, 0, -0.13 * se, 0.12 * fl, -0.07 * tr);
    pivotMat(M[2], PIV_L, 0.36 * ro, 0.31 * se, -0.42 * fl, 0.34 * tr);
    U.uHi.value.set(0, Math.max(tr, fl, se) * 0.7, Math.max(tr, fl, se, ro));
    U.uSpineHi.value.set(mode === 0 ? -0.25 : 0.05, Math.max(tr, fl, se, ro) * 0.9);
    IU.uModeW.value.set(cur[0], cur[1], cur[2], cur[3]);
    ui && ui.onAmount && ui.onAmount(amt);

    const idle = !reduced && !cam.dragging && performance.now() - cam.lastUser > 3000;
    if (idle) cam.yawTarget = damp(cam.yawTarget, Math.sin(time * 0.11) * 0.25, 0.6, dt);
    cam.yaw = damp(cam.yaw, cam.yawTarget, 5, dt);
    const yaw = 0.8 + cam.yaw, el = 0.44;
    const fit = st.aspect < 1.3 ? 1.3 / st.aspect : 1;
    const R = 7.3 * Math.pow(Math.min(fit, 1.8), 0.72);
    st.camera.position.set(target.x + Math.sin(yaw) * Math.cos(el) * R, target.y + Math.sin(el) * R, target.z + Math.cos(yaw) * Math.cos(el) * R);
    st.camera.lookAt(target);
  }
  return { st, update, select, MODES, count: pts.count };
}
