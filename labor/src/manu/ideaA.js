// Idee A · „Bühne“: die Manuthera als gestochene Partikel-Liege in 3D (wie die Wirbelsäule in Kapitel 03:
// gleichmäßige Punkte, dunkler Kern, Licht und Schatten). Darauf eine liegende Figur in Bauchlage, die
// Wirbelsäule schimmert durch. Brust- und Beckenteil zeigen nacheinander Traktion, Flexion, Seitneigung,
// Rotation. Schematisch, keine Herstellerzeichnung.
// 20.11.2026 (Auftrag Kai: Stil der Figur und der Wirbelsäule auf die Manuthera): Punkte geordnet statt gestreut (Zeilen über die
// Oberfläche, gleicher Abstand, jede zweite Zeile versetzt – ../shared/raster.js), Kantenlicht wie bei der Figur (Fläche ruhig,
// Rand hell), die Figur aus einem Guss (Rumpf mit wechselndem Querschnitt, Arme und Beine als Röhren statt einzelner Kugeln),
// Antwort unter Maus/Finger, Auftritt über die Zeit: feiner Staub sammelt sich vom Kopf- zum Fußende hinter der Bernstein-Linie.
import * as THREE from 'three';
import { stage, FRAG, COL, C, reduced, dragYaw, ease, damp, isDesktop, smooth } from './common.js';
import { orderedGen, coreOfRasterGen, coreMaterial, stipSize, DEFORM } from './stipple.js';
import { manuFormen, PIV_U, PIV_L } from './formen.js';
import { pointer, PTR_GLSL } from '../shared/zeiger.js';
import { runSync } from '../shared/slice.js';

export const MODES = [
  { id: 'traktion', name: 'Traktion', txt: 'Sanfter Zug in Längsrichtung: Brust- und Beckenteil gleiten auseinander, die Wirbelsäule bekommt Raum.' },
  { id: 'flexion', name: 'Flexion', txt: 'Brust- und Beckenteil neigen sich nach unten. Die Wirbelsäule beugt sich, genau dosiert und Abschnitt für Abschnitt.' },
  { id: 'seit', name: 'Seitneigung', txt: 'Das Beckenteil schwenkt zur Seite. Seitneigung in entspannter Lage, ohne dass Sie selbst Kraft aufwenden.' },
  { id: 'rot', name: 'Rotation', txt: 'Das Beckenteil dreht sich um die Längsachse. So lässt sich die Wirbelsäule gezielt in die Drehung führen.' },
];

const FOV = 30, NSEG = 3;

// Als Generator (Zeitscheiben, A1 4.11.2026); initA() baut am Stück.
export const initA = (canvas, ui) => runSync(initAGen(canvas, ui));
export function* initAGen(canvas, ui) {
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
  // Formen aus einer Quelle (./formen.js, auch für das kleine Leistungs-Motiv); hier bekommt jedes Teil seine Segment-Zuordnung
  const bb = mapX(blend(0.3));
  const MAP = { UP, F, LO, BB: bb, ARM: mapArm };
  const SPL = desk ? 0.0235 : 0.032; // Punktabstand der Liege (20.11.: feiner – Kai: „noch detailliertere Ansicht“)
  const { parts: FORM, SPB, wirbel } = manuFormen(SPL, { echt: ui && ui.figur });
  const parts = FORM.map((q) => ({ r: q.r, kind: q.kind, map: MAP[q.seg], keep: q.kind === 3 ? null : noDown, grp: q.grp }));

  yield;
  const pts = yield* orderedGen(parts, SPB);
  yield;
  const core = yield* coreOfRasterGen(parts);

  const M = [new THREE.Matrix4(), new THREE.Matrix4(), new THREE.Matrix4()];
  const U = {
    uM: { value: M }, uStip: { value: 1 }, uMaxSize: { value: 6 }, uCut: { value: reduced ? 99 : -3.2 }, uInset: { value: 0.008 },
    uHi: { value: new THREE.Vector3() }, uTime: { value: 0 }, uPix: { value: 1 }, uSpineHi: { value: new THREE.Vector2() },
    cCore: { value: C('#0E1C22') }, cBone: { value: C('#EDE5D3') }, cDeep: { value: C('#44788E') }, cFrame: { value: C('#2F5B6D') }, cFrameHi: { value: C('#7FAFC2') }, cBody: { value: C('#3F7FAE') }, cBodyHi: { value: C('#C4E1F5') },
    uPtr: { value: new THREE.Vector4(0, 0, 0.1, 0) }, uAsp: { value: 1 }, uSpB: { value: 0.78 },
    cBlue: { value: COL.blue }, cAmber: { value: COL.amber },
  };
  const coreMesh = new THREE.Mesh(core, coreMaterial(U, NSEG));
  // Punkte wie die Figur in Kapitel 01: Fläche ruhig, Rand hell (Kantenlicht), gestochene Scheiben; etwas Licht von oben hält die Form
  // lesbar. Vor der Bernstein-Linie (uCut, läuft beim Auftritt vom Kopf- zum Fußende) schweben die Punkte als feiner Staub und setzen sich.
  const ptsMesh = new THREE.Points(pts.geo, new THREE.ShaderMaterial({
    uniforms: U,
    vertexShader: DEFORM(NSEG) + /* glsl */`
      attribute vec3 aRnd;
      uniform float uStip, uMaxSize, uCut, uAsp, uSpB; uniform vec4 uPtr; uniform vec3 uHi;
      uniform vec3 cAmber, cBone, cDeep, cFrame, cFrameHi, cBody, cBodyHi;
      varying vec3 vCol; varying float vSize;
      ` + PTR_GLSL + /* glsl */`
      void main(){
        vec3 p = deformP(position, pos2), n = deformN(normal);
        float lam = max(dot(n, normalize(LDIR)), 0.);
        float rim = pow(1. - clamp(dot(n, normalize(cameraPosition - p)), 0., 1.), 1.5);
        vec3 deep = aKind < .5 ? mix(cDeep, cBone, .55) : aKind < 1.5 ? cFrame : aKind < 2.5 ? cBody : cBone;
        vec3 hi = aKind < .5 ? cBone : aKind < 1.5 ? cFrameHi : aKind < 2.5 ? cBodyHi : cBone;
        vec3 col = mix(deep, hi, .2 + .8 * rim) * (aKind < .5 ? .5 + .5 * lam : .62 + .38 * lam);
        int sa = int(aSegA + .5);
        float hl = sa == 1 ? uHi.y : sa == 2 ? uHi.z : 0.;
        if (aKind < .5) col = mix(col, cAmber * (.45 + .85 * lam), hl * .28);
        float naht = step(2.5, aKind);
        if (naht > .5) { col = mix(cBone, cDeep, .25); if (aSegA > .5 || aSegB > .5) col = mix(col, cAmber, hl * .5); }
        float sz = naht > .5 ? .72 / uSpB : aKind > 1.5 ? 1. : aKind > .5 ? 1.3 / uSpB : 1. / uSpB; // Scheibe passend zum Punktabstand des Teils
        // Auftritt: vor der Linie feiner Staub (klein, gedämpft), der sich beim Näherkommen setzt
        float dx = p.x - uCut, dust = smoothstep(0., .55, dx), far = smoothstep(.9, 2.2, dx);
        p += normalize(aRnd - .5 + 1e-4) * dust * (.18 + aRnd.z * .42);
        float g = exp(-pow(dx * 7., 2.));
        col = mix(col, cAmber * 1.2, g * .8) * mix(1., .5, dust);
        vec4 mv = viewMatrix * vec4(p, 1.);
        gl_Position = projectionMatrix * mv;
        float pk = ptrK() * (1. - dust);
        col = mix(col, vec3(1., .95, .86), pk * .7);
        vCol = col;
        vSize = clamp(uStip * sz * (1. + g * .3) * mix(1., .42, dust) * (1. + pk * .45) / -mv.z, 1., uMaxSize) * (1. - far) * step(aRnd.x, 1. - dust * .55);
        gl_PointSize = vSize;
      }`,
    fragmentShader: /* glsl */`
      varying vec3 vCol; varying float vSize;
      void main(){
        float d = length(gl_PointCoord - .5);
        if (d > .5 || vSize < .5) discard;
        gl_FragColor = vec4(vCol * (1. - smoothstep(.3, .5, d) * .35), 1.);
        #include <colorspace_fragment>
      }`,
  }));
  [coreMesh, ptsMesh].forEach((o) => { o.frustumCulled = false; st.scene.add(o); });

  // ---------- Wirbelsäule: schimmert durch den Körper ----------
  const SP = [], SW = [], SA = [], SB = [];
  const sb = blend(0.24);
  const pushS = (x, y, z) => { const s = sb(x); SP.push(x, y, z); SA.push(s[0]); SB.push(s[1]); SW.push(s[2]); };
  const LV = 24;
  // Perlenkette: je Wirbel ein Kern + Dornfortsatz, dazwischen feine Bandscheiben-Punkte
  const SZ = [];
  if (wirbel) {
    // echte Figur (21.11.2026): Wirbelkörper C1 … L5 und Kreuzbein aus BodyParts3D (assets/manu-figur.bin), Dornfortsatz zum Rücken hin
    for (let i = 0; i < wirbel.length; i++) {
      const [x, y, z] = wirbel[i], f = i / (wirbel.length - 1), last = i === wirbel.length - 1;
      pushS(x, y, z); SZ.push(last ? 2.6 : 1.5 + f * 1.2);
      if (!last) { pushS(x + 0.01, y + 0.07 + f * 0.03, z); SZ.push(0.8); const n = wirbel[i + 1]; pushS((x + n[0]) / 2, (y + n[1]) / 2, (z + n[2]) / 2); SZ.push(0.55); }
    }
  } else for (let i = 0; i < LV; i++) {
    const f = i / (LV - 1), x = -1.76 + f * 2.06, y = 0.33 + Math.sin(f * Math.PI * 2) * 0.02;
    pushS(x, y, 0); SZ.push(1.6 + f * 1.1);
    pushS(x + 0.01, y + 0.06, 0); SZ.push(0.8);
    if (i < LV - 1) { pushS(x + 0.043, y, 0); SZ.push(0.55); }
  }
  if (!wirbel) for (let j = 0; j < 5; j++) { const u = j / 4; pushS(0.36 + u * 0.24, 0.32 - u * 0.03, 0); SZ.push(2.6 - u * 1.4); }
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
  // echte Figur (21.11.2026): ihre Füße hängen über das Fußende → Zug- und Seitneigungs-Anzeige laufen unter den Füßen durch
  const yInd = wirbel ? -0.56 : -0.08;
  ind(0, (s) => [2.32 + s * 0.9, yInd, 0], 90);
  ind(0, (s) => [3.22 - Math.abs(s - 0.5) * 0.3, yInd, (s - 0.5) * 0.36], 30);
  ind(1, (s) => { const a = -s * 0.5, r = 2.38; return [PIV_L + Math.cos(a) * r, Math.sin(a) * r - 0.02, 0.72]; }, 90);
  ind(2, (s) => { const a = s * 0.32, r = 2.38; return [PIV_L + Math.cos(a) * r, yInd, -Math.sin(a) * r]; }, 90);
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
  const target = new THREE.Vector3(wirbel ? 0.42 : 0.1, -0.5, 0); // echte Figur: Hände und Füße reichen über beide Enden der Liege
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
  const PV = [0, 0, 0.1, 0];
  function update(_time, dt) {
    // Auftritt über die Zeit: kommt die Bühne wieder ins Bild (sie zeichnet nur, wenn sie sichtbar ist), sammelt sich die Liege neu
    // (erst wenn sie zu gut einem Drittel im Bild steht; war sie ganz draußen, beginnt der Auftritt beim nächsten Mal von vorn)
    const cr = canvas.getBoundingClientRect(), vhN = innerHeight, seen = Math.min(cr.bottom, vhN) - Math.max(cr.top, 0);
    if (seen <= 0) { if (!reduced && scanT >= 1) { scanT = 0; U.uCut.value = -3.2; } return; }
    const ready = seen > Math.min(cr.height, vhN) * 0.36;
    if (!ready && scanT <= 0) dt = 0;
    if (pointer.k() > 0 || U.uPtr.value.w > 0) { U.uPtr.value.fromArray(pointer.ndc(st.renderer.domElement.getBoundingClientRect(), PV, 56)); U.uAsp.value = st.aspect; }
    // „Bewegung anhalten“ (Puls · Scan): alles steht, die Liege ist sofort vollständig sichtbar
    const dtCam = dt; // Ziehen dreht auch, wenn die Eigenbewegung angehalten ist
    if (ui && ui.isPaused && ui.isPaused()) { dt = 0; if (scanT < 1) { scanT = 1; U.uCut.value = 99; } }
    clockT += dt;
    const time = clockT;
    U.uTime.value = time * SPEED;
    U.uPix.value = st.pix;
    U.uStip.value = stipSize(st, FOV, pts.spacing);
    // Scan beim ersten Sichtbarwerden: Liege entsteht vom Kopf- zum Fußende
    if (!reduced && scanT < 1) { scanT = Math.min(1, scanT + dt / 3.0); U.uCut.value = -2.9 + ease(scanT) * 6.6; if (scanT >= 1) U.uCut.value = 99; }
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
    U.uSpineHi.value.set(wirbel ? (mode === 0 ? -0.55 : -0.32) : mode === 0 ? -0.25 : 0.05, Math.max(tr, fl, se, ro) * 0.9); // echte Figur: Lendenwirbel liegen weiter kopfwärts
    IU.uModeW.value.set(cur[0], cur[1], cur[2], cur[3]);
    ui && ui.onAmount && ui.onAmount(amt);

    const idle = !reduced && !cam.dragging && performance.now() - cam.lastUser > 3000;
    if (idle) cam.yawTarget = damp(cam.yawTarget, Math.sin(time * 0.11) * 0.25, 0.6, dt);
    cam.yaw = damp(cam.yaw, cam.yawTarget, 5, dtCam);
    const yaw = 0.8 + cam.yaw, el = 0.44;
    const fit = st.aspect < 1.3 ? 1.3 / st.aspect : 1;
    const R = (wirbel ? 8.1 : 7.3) * Math.pow(Math.min(fit, 1.8), 0.72);
    st.camera.position.set(target.x + Math.sin(yaw) * Math.cos(el) * R, target.y + Math.sin(el) * R, target.z + Math.cos(yaw) * Math.cos(el) * R);
    st.camera.lookAt(target);
  }
  return { st, update, select, MODES, count: pts.count };
}
