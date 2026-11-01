// Design 2 · „Zuhause“: Das Partikel-Haus ist das Startmenü. Räume (und Tür, Dach) sind Punkte zum Anklicken,
// die Kamera fliegt hinein, daneben (PC) bzw. darunter (Handy) erscheint der Inhalt. Kein langes Scrollen.
import * as THREE from 'three';
import { housePoints } from '../test-4/shapes.js';
import { praxisScan, ROOMS, P, EYE, SPINE_AT } from '../test-4/praxis.js';
import { initSpineViewer } from './spine-viewer.js';
import { initA as initManu, MODES as MANU_MODES } from '../manu/ideaA.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const isDesktop = () => innerWidth > 920;
const C = (h) => new THREE.Color(h);
const V3 = THREE.Vector3;
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };

// ---------- Bewegung anhalten (gleiche Wahl wie auf den anderen Seiten) ----------
let paused = false;
try { paused = localStorage.getItem('hop-motion') === 'paused'; } catch (e) { /* ohne Speicher */ }
function setPaused(v) {
  paused = v; document.documentElement.classList.toggle('paused', v);
  const b = $('#motionBtn'); if (b) { b.setAttribute('aria-pressed', v ? 'true' : 'false'); b.setAttribute('aria-label', v ? 'Bewegung fortsetzen' : 'Bewegung anhalten'); }
  try { localStorage.setItem('hop-motion', v ? 'paused' : 'on'); } catch (e) { /* ohne Speicher */ }
}
$('#motionBtn')?.addEventListener('click', () => setPaused(!paused));
setPaused(paused);

// ---------- Bühne ----------
const canvas = $('#gl');
let renderer = null;
try { renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' }); } catch (e) { document.documentElement.classList.add('no-gl'); }
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 200);
if (renderer) renderer.setClearColor(0x0A161B, 1);
const house = new THREE.Group(); house.rotation.y = -0.42; scene.add(house); house.updateMatrixWorld(true);
const U = {
  uTime: { value: 0 }, uPix: { value: 1 }, uStip: { value: 1 }, uCut: { value: reduced ? 9 : -3.2 }, uRoom: { value: -1 },
  uRoof: { value: 0 }, uFocus: { value: 0 }, uCam: { value: new V3() },
  cBone: { value: C('#D9DCD3') }, cBoneHi: { value: C('#F3EADA') }, cAmber: { value: C('#E59A2F') }, cBlue: { value: C('#5AA2D6') },
  cGreen: { value: C('#8BC34A') }, cPetrol: { value: C('#4E7F93') }, cCore: { value: C('#0E1C22') },
};
// Ausschnitt vor der Kamera: was deutlich vor dem Fokus liegt, löst sich auf (Puppenhaus-Blick)
const CUTAWAY = /* glsl */`
  uniform vec3 uCam; uniform float uFocus;
  float cutaway(vec3 p){ float d = distance(p, uCam); return smoothstep(uFocus - 2.2, uFocus - 1.0, d); }`;

// 1) Hausumriss: gleichmäßige Kanten, Dach als Raster (hebt sich, wenn man in einen Raum geht)
const hp = housePoints(isDesktop() ? 26000 : 14000);
const hg = new THREE.BufferGeometry();
hg.setAttribute('position', new THREE.BufferAttribute(hp.pos, 3));
hg.setAttribute('aKind', new THREE.BufferAttribute(hp.kind, 1));
const houseLines = new THREE.Points(hg, new THREE.ShaderMaterial({
  uniforms: U, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  vertexShader: CUTAWAY + /* glsl */`
    attribute float aKind; uniform float uPix, uRoof, uTime, uCut; uniform vec3 cBone, cAmber, cGreen, cPetrol;
    varying vec3 vCol; varying float vA;
    void main(){
      vec3 p = position; if (aKind > .5 && aKind < 1.5) p.y += uRoof * 1.4;
      vec3 w = (modelMatrix * vec4(p, 1.)).xyz;
      vec4 mv = viewMatrix * vec4(w, 1.); gl_Position = projectionMatrix * mv;
      vec3 col = aKind < .5 ? cBone : aKind < 1.5 ? mix(cAmber, cBone, .25) : aKind < 2.5 ? cGreen : cPetrol * .9;
      gl_PointSize = clamp(uPix * (aKind > 2.5 ? .9 : 1.25) * 9. / -mv.z, 1., 3.);
      float roof = aKind > .5 && aKind < 1.5 ? 1. - uRoof * .75 : 1.;
      vA = (aKind > 2.5 ? .35 : .75) * roof * cutaway(w) * step(position.y, uCut + 2.8);
      vCol = col;
    }`,
  fragmentShader: 'varying vec3 vCol; varying float vA; void main(){ float d = length(gl_PointCoord - .5); gl_FragColor = vec4(vCol, smoothstep(.5, .1, d) * vA);\n#include <colorspace_fragment>\n}',
}));
houseLines.frustumCulled = false; house.add(houseLines);

// 2) Einrichtung (gleiche Daten wie Puls · Scan): Scan-Linien + gestochene Möbel auf dunklem Kern
const prx = praxisScan(isDesktop() ? 70000 : 26000, isDesktop() ? 1 : 0.62);
const T_COMMON = CUTAWAY + /* glsl */`
  attribute float aKind, aRoom;
  uniform float uTime, uPix, uCut, uRoom, uStip; uniform vec3 cBone, cAmber, cBlue, cGreen, cPetrol, cCore;
  float roomGain(){ float act = 1. - step(.5, abs(aRoom - uRoom)); return uRoom < -.5 ? 1. : mix(.45, 1.2, act); }`;
const lines = new THREE.Points(prx.lines, new THREE.ShaderMaterial({
  uniforms: U, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  vertexShader: T_COMMON + /* glsl */`
    varying vec3 vCol; varying float vA;
    void main(){
      vec3 w = (modelMatrix * vec4(position, 1.)).xyz;
      vec4 mv = viewMatrix * vec4(w, 1.); gl_Position = projectionMatrix * mv;
      vec3 col = aKind < .5 ? cPetrol * .85 : aKind < 1.5 ? cBone * .42 : cBone * .85;
      col *= roomGain();
      float g = exp(-pow((position.y - uCut) * 14., 2.)); col = mix(col, cAmber * 1.4, g);
      gl_PointSize = clamp(uPix * (aKind > 5.5 ? 1.35 : 1.1) * 9. / -mv.z, 1., 3.5) * (1. + g);
      vA = step(position.y, uCut) * (aKind < .5 ? .5 : aKind < 1.5 ? .55 : .95) * (aKind < .5 ? 1. : cutaway(w));
      vCol = col;
    }`,
  fragmentShader: 'varying vec3 vCol; varying float vA; void main(){ float d = length(gl_PointCoord - .5); gl_FragColor = vec4(vCol, smoothstep(.5, .12, d) * vA);\n#include <colorspace_fragment>\n}',
}));
const furn = new THREE.Points(prx.furn, new THREE.ShaderMaterial({
  uniforms: U,
  vertexShader: T_COMMON + /* glsl */`
    varying vec3 vCol; varying float vVis;
    void main(){
      vec3 w = (modelMatrix * vec4(position, 1.)).xyz;
      vec3 n = normalize(mat3(modelMatrix) * normal);
      vec3 V = normalize(cameraPosition - w);
      float lam = max(dot(n, normalize(vec3(.4, .8, .5))), 0.), rim = pow(1. - abs(dot(n, V)), 3.);
      vec3 base = aKind < 2.5 ? cBone : aKind < 3.5 ? cGreen : aKind < 4.5 ? cAmber : aKind < 5.5 ? mix(cPetrol * 1.7, cBlue, .3) : cBone;
      vec3 col = base * (.24 + .76 * lam) + cBlue * rim * .12;
      col *= roomGain();
      float g = exp(-pow((position.y - uCut) * 14., 2.)); col = mix(col, cAmber * 1.4, g);
      vec4 mv = viewMatrix * vec4(w, 1.); gl_Position = projectionMatrix * mv;
      gl_PointSize = clamp(uStip / -mv.z, 1., 3.6) * (1. + g * .6);
      float h = fract(sin(dot(position.xz, vec2(12.9898, 78.233)) + position.y * 37.7) * 43758.5453);
      vVis = step(position.y, uCut) * step(h, cutaway(w));
      vCol = col;
    }`,
  fragmentShader: 'varying vec3 vCol; varying float vVis; void main(){ float d = length(gl_PointCoord - .5); if (vVis < .5 || d > .5) discard; gl_FragColor = vec4(vCol * (1. - smoothstep(.2, .5, d) * .45), 1.);\n#include <colorspace_fragment>\n}',
}));
const core = new THREE.Mesh(prx.core, new THREE.ShaderMaterial({
  uniforms: U,
  vertexShader: T_COMMON + /* glsl */`
    varying float vY, vK; varying float vL;
    void main(){
      vec3 w = (modelMatrix * vec4(position - normal * .006, 1.)).xyz;
      vL = max(dot(normalize(mat3(modelMatrix) * normal), normalize(vec3(.4, .8, .5))), 0.);
      vY = position.y; vK = cutaway(w);
      gl_Position = projectionMatrix * viewMatrix * vec4(w, 1.);
    }`,
  fragmentShader: /* glsl */`
    uniform float uCut; uniform vec3 cCore, cBone; varying float vY, vK, vL;
    void main(){ if (vY > uCut || vK < .5) discard; gl_FragColor = vec4(cCore + cBone * vL * .04, 1.);
      #include <colorspace_fragment>
    }`,
}));
[lines, furn, core].forEach((o) => { o.frustumCulled = false; house.add(o); });

// ---------- Orte (Räume, Tür, Dach) ----------
const roomCenter = (i) => { const [x, y, w, h] = ROOMS[i].r; const [cx, cz] = P(x + w / 2, y + h / 2); return new V3(cx, -3 + 0.45, cz); };
const PLACES = [
  { id: 'tuer', label: 'Tür', sub: 'Termin & Kontakt', room: -1, at: new V3(-0.16, -1.95, 2.25), focus: new V3(-0.16, -2.3, 2.0), dir: new V3(0.25, 0.32, 1), dist: 6.2 },
  { id: 'empfang', label: 'Empfang', sub: 'Willkommen', room: 0 },
  { id: 'wohnzimmer', label: 'Wohnzimmer', sub: 'Hausordnung', room: 1 },
  { id: 'behandlung', label: 'Behandlung 1', sub: 'Leistungen', room: 2 },
  { id: 'wirbelsaeule', label: 'Wirbelsäule', sub: 'Modell in Behandlung 1', room: 2, model: true },
  { id: 'manuthera', label: 'Behandlung 2', sub: 'Manuthera', room: 3, hi: true },
  { id: 'training', label: 'Training', sub: 'Bewegung', room: 4 },
];
PLACES.forEach((pl) => {
  if (pl.model) { // Wirbelsäulen-Modell auf dem Ständer in Behandlung 1
    const [x, z] = P(SPINE_AT[0], SPINE_AT[1]);
    pl.at = new V3(x, -3 + 1.05, z); pl.focus = new V3(x, -3 + 0.6, z); pl.dir = new V3(0.35, 0.55, 1); pl.dist = 2.6;
  } else if (pl.room >= 0) { const c = roomCenter(pl.room); pl.at = c.clone().setY(EYE + 0.35); pl.focus = c; pl.dir = new V3(0.15, 1.0, 0.95); pl.dist = 4.4; }
});

// Schilder im Haus
const tagsEl = $('#tags');
PLACES.forEach((pl, i) => {
  const b = document.createElement('button');
  b.type = 'button'; b.className = 'tag' + (pl.hi ? ' hi' : '');
  b.innerHTML = `<i>${String(i).padStart(2, '0')}</i><span><b>${pl.label}</b><small>${pl.sub}</small></span>`;
  b.setAttribute('aria-label', `${pl.label}: ${pl.sub} öffnen`);
  b.addEventListener('click', () => openPlace(i));
  b.addEventListener('pointerenter', () => { hover = pl.room; });
  b.addEventListener('pointerleave', () => { hover = -1; });
  tagsEl.appendChild(b); pl.tag = b;
});
let hover = -1;

// ---------- Kamera ----------
const OVER = { focus: new V3(0, -1.45, 0.2), dir: new V3(0.55, 0.42, 1), dist: 14.2 };
const cam = { pos: new V3(0, 6, 40), target: new V3(0, -1.6, 0) };
let current = -1, orbit = 0;
function poseFor(i) {
  const pl = i < 0 ? OVER : PLACES[i];
  const f = house.localToWorld(pl.focus.clone());
  const dir = pl.dir.clone().normalize().applyAxisAngle(new V3(0, 1, 0), house.rotation.y + (i < 0 ? orbit : 0));
  const mob = !isDesktop(), dist = pl.dist * (mob ? (i < 0 ? 1.95 : 1.25) : 1);
  return { pos: f.clone().add(dir.multiplyScalar(dist)), target: f };
}

// ---------- Inhalt ----------
const panel = $('#panel'), panelBody = $('#panelBody');
const tpl = (id) => $(`#tpl-${id}`);
let manu = null, spine = null;
function dropManu() {
  if (manu) { try { manu.st.renderer.dispose(); manu.st.renderer.forceContextLoss(); } catch (e) { /* schon weg */ } manu = null; }
  if (spine) { spine.dispose(); spine = null; }
}
function openPlace(i, fromHash) {
  dropManu();
  current = i;
  const pl = PLACES[i];
  document.documentElement.classList.add('open');
  panel.setAttribute('aria-hidden', 'false');
  panelBody.innerHTML = '';
  panelBody.appendChild(tpl(pl.id).content.cloneNode(true));
  $('#panelNo').textContent = String(i).padStart(2, '0');
  $('#panelLabel').textContent = `${pl.label} · ${pl.sub}`;
  panel.scrollTop = 0; panelBody.scrollTop = 0;
  $$('.rooms button').forEach((b, k) => b.classList.toggle('is-on', k === i));
  wireContent(pl.id);
  if (!fromHash) { try { history.replaceState(null, '', '#' + pl.id); } catch (e) { /* ohne Verlauf */ } }
  setTimeout(() => $('#panelTitle')?.focus({ preventScroll: true }), 50);
}
function closePlace() {
  current = -1; dropManu();
  document.documentElement.classList.remove('open');
  panel.setAttribute('aria-hidden', 'true');
  $$('.rooms button').forEach((b) => b.classList.remove('is-on'));
  try { history.replaceState(null, '', location.pathname + location.search); } catch (e) { /* ohne Verlauf */ }
}
$('#panelClose').addEventListener('click', closePlace);
$('#panelPrev').addEventListener('click', () => openPlace((current - 1 + PLACES.length) % PLACES.length));
$('#panelNext').addEventListener('click', () => openPlace((current + 1) % PLACES.length));
addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && current >= 0) closePlace();
  else if (current >= 0 && e.key === 'ArrowRight' && !e.target.closest('input,textarea')) openPlace((current + 1) % PLACES.length);
  else if (current >= 0 && e.key === 'ArrowLeft' && !e.target.closest('input,textarea')) openPlace((current - 1 + PLACES.length) % PLACES.length);
});
// Raum-Liste (Navigation ohne 3D, auch für Tastatur und Screenreader)
const roomsEl = $('#rooms');
PLACES.forEach((pl, i) => {
  const b = document.createElement('button'); b.type = 'button'; if (pl.hi) b.className = 'hi';
  b.innerHTML = `<i>${String(i).padStart(2, '0')}</i><b>${pl.label}</b><small>${pl.sub}</small>`;
  b.addEventListener('click', () => openPlace(i));
  roomsEl.appendChild(b);
});
$$('[data-open]').forEach((a) => a.addEventListener('click', (e) => { e.preventDefault(); openPlace(PLACES.findIndex((p) => p.id === a.dataset.open)); }));
$('[data-home]')?.addEventListener('click', (e) => { e.preventDefault(); closePlace(); });

function wireContent(id) {
  // Querverweise im Inhalt
  $$('[data-open]', panelBody).forEach((a) => a.addEventListener('click', (e) => { e.preventDefault(); openPlace(PLACES.findIndex((p) => p.id === a.dataset.open)); }));
  // Leistungen: aufklappen
  $$('.index button', panelBody).forEach((b) => b.addEventListener('click', () => { const li = b.parentElement, o = !li.classList.contains('open'); li.classList.toggle('open', o); b.setAttribute('aria-expanded', o ? 'true' : 'false'); }));
  // Wirbelsäule: Modell drehbar, Abschnitt wählen → leuchtet am Modell, Text darunter
  const segBtns = $$('.segbtns button', panelBody), segCards = $$('.seg-card', panelBody);
  if (id === 'wirbelsaeule') spine = initSpineViewer($('#glSpine', panelBody), { isPaused: () => paused });
  segBtns.forEach((b, i) => b.addEventListener('click', () => {
    segBtns.forEach((x, k) => { x.classList.toggle('is-on', k === i); x.setAttribute('aria-pressed', k === i ? 'true' : 'false'); });
    segCards.forEach((c, k) => { c.hidden = k !== i; });
    if (spine) spine.select(i);
  }));
  // Manuthera: Bühne im Panel
  if (id === 'manuthera') {
    const btns = $$('.manu-modes button', panelBody), read = $('.manu-read', panelBody);
    manu = initManu($('#glManu', panelBody), {
      transparent: true, isPaused: () => paused,
      onMode(i) { btns.forEach((b, j) => { b.classList.toggle('is-on', j === i); b.setAttribute('aria-pressed', j === i ? 'true' : 'false'); b.querySelector('i').style.width = '0'; }); read.textContent = MANU_MODES[i].txt; },
      onAmount(a) { const b = btns.find((x) => x.classList.contains('is-on')); if (b) b.querySelector('i').style.width = (a * 100).toFixed(1) + '%'; },
    });
    if (manu) btns.forEach((b, i) => b.addEventListener('click', () => manu.select(i, true)));
  }
}

// ---------- Größe, Ausschnitt neben dem Panel ----------
let W = 1, H = 1, offK = 0;
function resize() {
  W = innerWidth; H = innerHeight;
  if (!renderer) return;
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, isDesktop() ? 1.6 : 1.4));
  renderer.setSize(W, H, false);
  camera.aspect = W / H; camera.updateProjectionMatrix();
}
addEventListener('resize', resize); resize();
function applyOffset() {
  // PC: Haus rückt nach links neben das Panel; Handy: nach oben über das Blatt
  const desk = isDesktop();
  const pw = desk ? panel.offsetWidth : 0, ph = desk ? 0 : H * 0.5;
  // Übersicht: PC rechts neben dem Willkommenstext, Handy unter ihm
  const ox = (pw / 2) * offK - (desk ? W * 0.17 : 0) * (1 - offK), oy = (ph / 2) * offK - (desk ? 0 : H * 0.13) * (1 - offK);
  if (ox || oy) camera.setViewOffset(W, H, ox, oy, W, H); else camera.clearViewOffset();
}

// ---------- Hash: Räume direkt verlinkbar ----------
function fromHash() { const id = location.hash.slice(1); const i = PLACES.findIndex((p) => p.id === id); if (i >= 0) openPlace(i, true); else if (current >= 0) closePlace(); }
addEventListener('hashchange', fromHash);

// ---------- Schleife ----------
let last = performance.now(), t = 0, scan = reduced ? 1 : 0;
const tmp = new V3();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  const still = paused || reduced;
  if (!paused) t += dt * (reduced ? 0.45 : 1);
  U.uTime.value = t;
  // Scan beim Laden: vom Boden zum Dach
  if (scan < 1) { scan = Math.min(1, scan + dt / 2.8); U.uCut.value = -3.2 + scan * 5.6; if (scan >= 1) U.uCut.value = 9; }
  if (!still && current < 0) orbit = Math.sin(t * 0.12) * 0.28;
  offK += ((current >= 0 ? 1 : 0) - offK) * (reduced ? 1 : 1 - Math.exp(-dt * 4));
  applyOffset();
  const want = poseFor(current), k = reduced ? 1 : 1 - Math.exp(-dt * 2.1);
  cam.pos.lerp(want.pos, k); cam.target.lerp(want.target, k);
  camera.position.copy(cam.pos); camera.lookAt(cam.target); camera.updateMatrixWorld();
  U.uCam.value.copy(camera.position);
  const pl = current >= 0 ? PLACES[current] : null;
  const focusD = camera.position.distanceTo(cam.target);
  U.uFocus.value += ((pl && pl.room >= 0 ? focusD : 0) - U.uFocus.value) * (reduced ? 1 : 1 - Math.exp(-dt * 3)); // 0 = nichts ausblenden
  U.uRoof.value += ((pl && pl.room >= 0 ? 1 : 0) - U.uRoof.value) * (reduced ? 1 : 1 - Math.exp(-dt * 3));
  U.uRoom.value = pl ? pl.room : hover;
  const pr = renderer ? renderer.getPixelRatio() : 1;
  U.uPix.value = pr * (H / 900) * (isDesktop() ? 1 : 1.2);
  U.uStip.value = pr * H * 0.5 / Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * prx.spacing * 0.62;
  // Schilder
  const showTags = current < 0 && scan >= 1;
  PLACES.forEach((p) => {
    tmp.copy(p.at); house.localToWorld(tmp); tmp.project(camera);
    const vis = showTags && tmp.z < 1 && Math.abs(tmp.x) < 0.96 && Math.abs(tmp.y) < 0.92;
    p.tag.classList.toggle('on', vis);
    if (vis) p.tag.style.transform = `translate(${((tmp.x * 0.5 + 0.5) * W).toFixed(1)}px, ${((-tmp.y * 0.5 + 0.5) * H).toFixed(1)}px) translate(-50%, -50%)`;
  });
  if (renderer && !document.hidden) renderer.render(scene, camera);
  if (manu && manu.st.visible && current >= 0) { manu.update(0, dt); manu.st.renderer.render(manu.st.scene, manu.st.camera); }
  if (spine && spine.st.visible && current >= 0) { spine.update(0, dt); spine.st.renderer.render(spine.st.scene, spine.st.camera); }
  requestAnimationFrame(frame);
}
fromHash();
requestAnimationFrame(frame);
