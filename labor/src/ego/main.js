// Machbarkeitstest: Rundgang durch die Praxis aus Augenhöhe (First Person), Quelle der Punktwolke = test-4/praxis.js
import * as THREE from 'three';
import { praxisScanGen, ROOMS, P, EYE } from '../test-4/praxis.js';
import { runSliced } from '../shared/slice.js';

const $ = (s) => document.querySelector(s);
const V3 = THREE.Vector3;
const C = (h) => new THREE.Color(h);
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const ease = (t) => t * t * (3 - 2 * t);
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const mobile = innerWidth <= 920;
const K = 0.0149;

// ---------- Szene ----------
const canvas = $('#gl');
let renderer;
try { renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false, powerPreference: 'high-performance' }); } catch (e) { renderer = null; }
if (!renderer) { $('#loading').textContent = 'Dieser Test braucht einen Browser mit WebGL.'; throw new Error('kein WebGL'); }
renderer.setClearColor(C('#0A161B'), 1);
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(66, 1, 0.03, 80);
let W = 1, H = 1, pr = 1;
function resize() {
  W = innerWidth; H = innerHeight; pr = Math.min(devicePixelRatio || 1, mobile ? 1.5 : 2);
  renderer.setPixelRatio(pr); renderer.setSize(W, H, false);
  camera.aspect = W / H; camera.fov = W / H < 1 ? 82 : 66; camera.updateProjectionMatrix();
}
addEventListener('resize', resize); resize();

const U = {
  uPix: { value: 1 }, uStip: { value: 1 }, uDoor: { value: 0 }, uHinge: { value: new THREE.Vector2((182 - 210) * K, (272 - 140) * K) },
  cBone: { value: C('#D9DCD3') }, cAmber: { value: C('#E59A2F') }, cBlue: { value: C('#5AA2D6') }, cGreen: { value: C('#8BC34A') }, cPetrol: { value: C('#4E7F93') }, cCore: { value: C('#0E1C22') },
};
const COMMON = /* glsl */`
  attribute float aKind, aRoom, aDoor;
  uniform float uPix, uStip, uDoor; uniform vec2 uHinge;
  uniform vec3 cBone, cAmber, cBlue, cGreen, cPetrol, cCore;
  vec3 doorP(vec3 p, float door){ if (door < .5) return p; float a = uDoor; float dx = p.x - uHinge.x, dz = p.z - uHinge.y; float c = cos(a), s = sin(a);
    return vec3(uHinge.x + c*dx + s*dz, p.y, uHinge.y - s*dx + c*dz); }`;
function build(prx) {
  // Tür: Rahmen + Zeilen aus Linienpunkten, Scharnier links, schwingt nach innen
  const dp = [], dn = [], dk = [], dr = [], dd = [];
  const x0 = (182 - 210) * K, x1 = (216 - 210) * K, z = (272 - 140) * K, y0 = -3, y1 = -3 + 1.05;
  const add = (x, y, k) => { dp.push(x, y, z); dn.push(0, 0, 1); dk.push(k); dr.push(0); dd.push(1); };
  for (let r = 1; r < 14; r++) for (let x = x0; x <= x1; x += 0.02) add(x, y0 + (r / 14) * (y1 - y0), 1);
  for (let x = x0; x <= x1; x += 0.01) { add(x, y1, 6); add(x, y0 + 0.01, 6); }
  for (let y = y0; y <= y1; y += 0.01) { add(x0, y, 6); add(x1, y, 6); }
  add(x1 - 0.06, y0 + 0.5, 4); add(x1 - 0.06, y0 + 0.52, 4); add(x1 - 0.06, y0 + 0.54, 4);
  // Linien-Geometrie (Wände, Boden, Kanten) + Tür
  const g = prx.lines, n0 = g.attributes.position.count;
  const cat = (a, b) => { const o = new Float32Array(a.length + b.length); o.set(a); o.set(b, a.length); return o; };
  const lg = new THREE.BufferGeometry();
  lg.setAttribute('position', new THREE.BufferAttribute(cat(g.attributes.position.array, new Float32Array(dp)), 3));
  lg.setAttribute('aKind', new THREE.BufferAttribute(cat(g.attributes.aKind.array, new Float32Array(dk)), 1));
  lg.setAttribute('aRoom', new THREE.BufferAttribute(cat(g.attributes.aRoom.array, new Float32Array(dr)), 1));
  const door = new Float32Array(n0 + dd.length); door.fill(0, 0, n0); door.set(dd, n0);
  lg.setAttribute('aDoor', new THREE.BufferAttribute(door, 1));
  const lines = new THREE.Points(lg, new THREE.ShaderMaterial({
    uniforms: U, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: COMMON + /* glsl */`
      varying vec3 vCol; varying float vA;
      void main(){
        vec3 p = doorP(position, aDoor);
        vec3 col = aKind < .5 ? cPetrol * .85 : aKind < 1.5 ? cBone * .5 : aKind > 3.5 && aKind < 4.5 ? cAmber * 1.1 : cBone * .9;
        vec4 mv = viewMatrix * vec4(p, 1.); gl_Position = projectionMatrix * mv;
        float d = -mv.z;
        gl_PointSize = clamp(uPix * (aKind > 5.5 ? 1.5 : 1.2) * 7. / d, 1.3, 4.5);
        float near = smoothstep(.12, .5, d), far = 1. - smoothstep(7., 14., d) * .6;
        vA = (aKind < .5 ? .5 : aKind < 1.5 ? .6 : .95) * near * far;
        vCol = col;
      }`,
    fragmentShader: /* glsl */`
      varying vec3 vCol; varying float vA;
      void main(){ float d = length(gl_PointCoord - .5); gl_FragColor = vec4(vCol, smoothstep(.5, .12, d) * vA);
        #include <colorspace_fragment>
      }`,
  }));
  const furn = new THREE.Points(prx.furn, new THREE.ShaderMaterial({
    uniforms: U,
    vertexShader: COMMON + /* glsl */`
      varying vec3 vCol; varying float vVis;
      void main(){
        vec3 n = normal; vec3 V = normalize(cameraPosition - position);
        float lam = max(dot(n, normalize(vec3(.4, .8, .5))), 0.), rim = pow(1. - abs(dot(n, V)), 3.);
        vec3 base = aKind < 2.5 ? cBone : aKind < 3.5 ? cGreen : aKind < 4.5 ? cAmber : aKind < 5.5 ? mix(cPetrol * 1.7, cBlue, .3) : cBone;
        vCol = base * (.3 + .7 * lam) + cBlue * rim * .12;
        vec4 mv = viewMatrix * vec4(position, 1.); gl_Position = projectionMatrix * mv;
        float d = -mv.z;
        gl_PointSize = clamp(uStip / d, 1.3, 7.);
        float h = fract(sin(dot(position.xz, vec2(12.9898, 78.233)) + position.y * 37.7) * 43758.5453);
        vVis = step(h, smoothstep(.1, .4, d));
      }`,
    fragmentShader: /* glsl */`
      varying vec3 vCol; varying float vVis;
      void main(){ float d = length(gl_PointCoord - .5); if (vVis < .5 || d > .5) discard;
        gl_FragColor = vec4(vCol * (1. - smoothstep(.2, .5, d) * .45), 1.);
        #include <colorspace_fragment>
      }`,
  }));
  const core = new THREE.Mesh(prx.core, new THREE.ShaderMaterial({
    uniforms: U,
    vertexShader: /* glsl */`varying float vL, vD; void main(){ vec3 p = position - normal * .006; vL = max(dot(normal, normalize(vec3(.4, .8, .5))), 0.);
      vec4 mv = viewMatrix * vec4(p, 1.); vD = -mv.z; gl_Position = projectionMatrix * mv; }`,
    fragmentShader: /* glsl */`uniform vec3 cCore, cBone; varying float vL, vD; void main(){ if (vD < .2) discard; gl_FragColor = vec4(cCore + cBone * vL * .04, 1.);
      #include <colorspace_fragment>
    }`,
  }));
  [core, furn, lines].forEach((o, i) => { o.frustumCulled = false; o.renderOrder = i; scene.add(o); });
  U.uStip.value = 1; stipSpacing = prx.spacing;
}
let stipSpacing = 0.02;

// ---------- Route (Grundriss-Pixel) ----------
const pt = (x, y) => { const [a, b] = P(x, y); return new V3(a, EYE, b); };
const STOPS = [
  { at: [199, 320], look: [199, 230], no: '00', kick: 'Tür', title: 'Die Tür', text: 'Hier beginnt es. Die Tür geht auf, Sie treten ein – und werden mit Namen begrüßt.' },
  { at: [140, 205], look: [60, 250], room: 1, via: [[199, 262], [196, 226], [176, 208]] },
  { at: [140, 58], look: [70, 52], room: 0, via: [[176, 208], [196, 150], [196, 78], [170, 60]] },
  { at: [262, 50], look: [320, 48], room: 2, via: [[196, 78], [212, 58], [240, 50]] },
  { at: [262, 132], look: [320, 136], room: 3, via: [[240, 52], [212, 62], [210, 100], [216, 132], [240, 132]] },
  { at: [262, 218], look: [362, 236], room: 4, via: [[240, 132], [214, 150], [214, 215], [240, 218]] },
  { at: [199, 205], look: [199, 300], no: '→', kick: 'Ende', title: 'Bis bald', text: 'Das war die Praxis. Wenn Sie wollen, schreiben Sie mir – ich melde mich mit einem Terminvorschlag.', via: [[240, 218], [214, 215]] },
];
STOPS.forEach((s) => {
  s.pos = pt(...s.at); s.lk = pt(...s.look); s.lk.y = EYE - 0.12;
  if (s.room !== undefined) { const r = ROOMS[s.room]; s.no = String(s.room + 1).padStart(2, '0'); s.kick = r.short; s.title = r.n; s.text = r.d; }
  s.viaP = (s.via || []).map((v) => pt(...v));
});
const state = { idx: 0, from: 0, to: 0, t: 1, dur: 3.4, playing: false, hold: 0 };
let leg = null, yawOff = 0, pitchOff = 0, drag = null, lastInput = -9;
const camPos = STOPS[0].pos.clone(), camLook = STOPS[0].lk.clone();

function setLeg(a, b) {
  const A = STOPS[a], B = STOPS[b];
  if (b > a) { leg = { pts: [A.pos, ...B.viaP, B.pos], a: A, b: B }; }
  else { leg = { pts: [A.pos, ...[...A.viaP].reverse(), B.pos], a: A, b: B }; }
  leg.curve = new THREE.CatmullRomCurve3(leg.pts, false, 'centripetal', 0.5);
  leg.len = leg.curve.getLength();
  state.dur = reduced ? 0.01 : clamp(leg.len * 1.35 + 1.4, 2.4, 6.5);
}
function go(i) {
  i = clamp(i, 0, STOPS.length - 1); if (i === state.idx && state.t >= 1) return;
  const cur = state.t >= 1 ? state.idx : state.to;
  state.from = cur; state.to = i; state.t = 0; setLeg(cur, i); state.idx = i;
  $('#cap').classList.add('hide');
}
function showCap(i) {
  const s = STOPS[i];
  $('#capNo').textContent = s.no; $('#capKick').textContent = s.kick; $('#capTitle').textContent = s.title; $('#capText').textContent = s.text;
  $('#cap').classList.remove('hide');
  $('#prev').disabled = i === 0; $('#next').disabled = i === STOPS.length - 1;
}
$('#next').addEventListener('click', () => { state.playing = false; setPlayLabel(); go(state.idx + 1); });
$('#prev').addEventListener('click', () => { state.playing = false; setPlayLabel(); go(state.idx - 1); });
function setPlayLabel() { $('#play').textContent = state.playing ? '❚❚ Pause' : (state.idx >= STOPS.length - 1 ? '↺ Noch einmal' : (state.idx === 0 ? '▶ Rundgang starten' : '▶ Weiter')); }
$('#play').addEventListener('click', () => {
  if (state.playing) { state.playing = false; setPlayLabel(); return; }
  if (state.idx >= STOPS.length - 1) { state.t = 1; state.idx = 0; camPos.copy(STOPS[0].pos); camLook.copy(STOPS[0].lk); showCap(0); state.playing = true; state.hold = 1.2; }
  else { state.playing = true; state.hold = state.t >= 1 ? 0.2 : 0; }
  setPlayLabel();
});
addEventListener('keydown', (e) => {
  if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { state.playing = false; setPlayLabel(); go(state.idx + 1); }
  if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { state.playing = false; setPlayLabel(); go(state.idx - 1); }
  if (e.key === ' ' && document.activeElement === document.body) { e.preventDefault(); $('#play').click(); }
});
// Umschauen: ziehen, springt langsam zurück
canvas.addEventListener('pointerdown', (e) => { drag = { x: e.clientX, y: e.clientY, yaw: yawOff, pitch: pitchOff }; canvas.setPointerCapture(e.pointerId); $('#hint').classList.add('gone'); });
canvas.addEventListener('pointermove', (e) => { if (!drag) return; yawOff = clamp(drag.yaw - (e.clientX - drag.x) * 0.006, -0.9, 0.9); pitchOff = clamp(drag.pitch - (e.clientY - drag.y) * 0.004, -0.4, 0.4); lastInput = performance.now(); });
['pointerup', 'pointercancel'].forEach((t) => canvas.addEventListener(t, () => { drag = null; lastInput = performance.now(); }));

// ---------- Schleife ----------
const tmpA = new V3(), tmpB = new V3(), up = new V3(0, 1, 0);
let last = performance.now(), ready = false;
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  if (ready) {
    if (state.t < 1) {
      state.t = Math.min(1, state.t + dt / state.dur);
      const e = ease(state.t);
      leg.curve.getPoint(e, camPos);
      leg.curve.getTangent(e, tmpA); tmpA.y = 0; tmpA.normalize();
      tmpB.copy(camPos).addScaledVector(tmpA, 2); tmpB.y = EYE - 0.12;          // Blick nach vorn
      const s0 = smooth(0, 0.3, e), s1 = smooth(0.62, 1, e);
      const ahead = tmpB.clone();
      camLook.copy(leg.a.lk).lerp(ahead, s0).lerp(leg.b.lk, s1);
      if (state.t >= 1) { showCap(state.idx); if (state.playing) state.hold = reduced ? 1 : 4.2; setPlayLabel(); }
    } else if (state.playing) {
      state.hold -= dt;
      if (state.hold <= 0) { if (state.idx < STOPS.length - 1) go(state.idx + 1); else { state.playing = false; setPlayLabel(); } }
    }
    // Tür: offen, sobald man am Eingang vorbei ist
    const wantOpen = state.idx === 0 && state.t >= 1 ? 0 : (state.t < 1 && state.to === 0 && state.from === 0 ? 0 : 1.75);
    U.uDoor.value += (wantOpen - U.uDoor.value) * (1 - Math.exp(-dt * 2.2));
    // Umschau-Versatz fällt zurück
    if (!drag && performance.now() - lastInput > 1200) { const k = 1 - Math.exp(-dt * 1.6); yawOff -= yawOff * k; pitchOff -= pitchOff * k; }
    camera.position.copy(camPos);
    tmpA.copy(camLook).sub(camPos);
    const r = tmpA.length(), yaw = Math.atan2(tmpA.x, tmpA.z) + yawOff, pit = Math.asin(clamp(tmpA.y / r, -1, 1)) + pitchOff;
    camera.lookAt(camPos.x + Math.sin(yaw) * Math.cos(pit), camPos.y + Math.sin(pit), camPos.z + Math.cos(yaw) * Math.cos(pit));
    U.uPix.value = pr * (H / 900);
    U.uStip.value = pr * H * 0.5 / Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * stipSpacing * 0.62;
    renderer.render(scene, camera);
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

runSliced(praxisScanGen(mobile ? 32000 : 85000, mobile ? 0.62 : 1)).then((prx) => {
  build(prx); ready = true; $('#loading').remove(); showCap(0); setPlayLabel();
  window.__ego = { go, state, STOPS };
}).catch((e) => { $('#loading').textContent = 'Fehler beim Aufbau.'; console.error(e); });
