// Probe „Echter Raum“ (11.11.2026): Scaniverse-Scan als Kulisse, Fusion-Figur „Spannung lösen“ darin, Scrollweg = Weg.
import * as THREE from 'three';
import { SplatMesh, SparkRenderer } from '@sparkjsdev/spark';
import { createFigure } from '../src/fusion/figure.js';

const $ = (s) => document.querySelector(s);
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const ss = (a, b, v) => { const t = clamp((v - a) / (b - a)); return t * t * (3 - 2 * t); };
const status = $('#status'), fail = (m) => { status.hidden = false; status.classList.add('err'); status.textContent = 'Der Raum konnte nicht geladen werden: ' + m; };
addEventListener('error', (e) => fail(e.message || 'Skriptfehler'));
addEventListener('unhandledrejection', (e) => fail(String(e.reason && e.reason.message || e.reason)));

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const mob = matchMedia('(max-width: 920px)').matches;
const V = (x, y, z) => new THREE.Vector3(x, y, z);
// Zwei Scans (Meter, y nach oben). Weg: Ankommen → vor der Figur → weitergehen
const mk = (floor, pts, foot) => { const e = floor + 1.55; return { floor, foot: V(foot[0], floor, foot[1]),
  keys: pts.map(([t, px, pz, lx, lh, lz]) => ({ t, p: V(px, e, pz), l: V(lx, floor + lh, lz) })) }; };
const SCENES = {
  flur: { file: 'scan2.wasm', mb: '13,4', ...mk(-0.75, [[0, 0.7, -0.7, -1.3, 0.9, -0.75], [0.5, 0.55, -0.7, -1.3, 0.88, -0.75], [0.72, -1.5, -0.72, -5.0, 1.0, -0.8], [1, -4.4, -0.8, -6.2, 1.0, -0.85]], [-1.3, -0.75]) },
  raum: { file: 'scan.wasm', mb: '8,6', ...mk(-0.67, [[0, 1.257, 0.468, 0.12, 0.9, 1.6], [0.5, 1.2, 0.52, 0.12, 0.88, 1.6], [0.72, 0.3, 1.42, 0.75, 1.0, 2.6], [1, 0.58, 2.29, 0.95, 0.95, 3.0]], [0.122, 1.596]) },
};
let SC = SCENES.flur;
const FIG_H = 1.75;

const canvas = $('#gl');
let renderer;
try { renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' }); }
catch (e) { fail('WebGL ist auf diesem Gerät nicht verfügbar.'); throw e; }
const PR = Math.min(devicePixelRatio || 1, mob ? 1.5 : 1.75);
renderer.setPixelRatio(PR);
renderer.setClearColor(0x070d10, 1);
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(mob ? 78 : 68, 1, 0.05, 600);
const spark = new SparkRenderer({ renderer }); scene.add(spark);
// Die Scans liegen als Dateien neben der Seite (Endung .wasm nur, weil die Vorschau keine .spz ausliefert)
let room = { recolor: new THREE.Color(1, 1, 1) }, roomReady = false, loadNo = 0;
function loadScene(key) {
  SC = SCENES[key]; const no = ++loadNo;
  if (room.dispose) { scene.remove(room); room.dispose(); }
  room = { recolor: new THREE.Color(1, 1, 1) }; roomReady = false;
  status.classList.remove('err'); status.hidden = false; status.textContent = 'Scan wird geladen (' + SC.mb + ' MB) …';
  fetch(SC.file).then((r) => { if (!r.ok) throw new Error('Scan-Datei fehlt (' + r.status + ')'); return r.arrayBuffer(); }).then((buf) => {
    if (no !== loadNo) return;
    const m = new SplatMesh({ fileBytes: new Uint8Array(buf), fileName: 'scan.spz' });
    scene.add(m);
    return m.initialized.then(() => { if (no !== loadNo) { scene.remove(m); m.dispose(); return; } room = m; roomReady = true; status.hidden = true; });
  }).catch((e) => fail(String(e && e.message || e)));
}
document.querySelectorAll('[data-scene]').forEach((b) => b.addEventListener('click', () => {
  document.querySelectorAll('[data-scene]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
  scroller.scrollTop = 0; prog = shown = 0; lookWant = look = 0;
  loadScene(b.dataset.scene);
}));

const scroller = $('#scroller');
const shared = { uTime: { value: 0 }, uPix: { value: 1 } };
const fig = createFigure(scene, mob ? 14000 : 30000, shared);
fig.U.uPx.value = 4.2;               // Fusion rechnet in Einheiten zu 2 m, der Scan in Metern

// Raumhelligkeit
const LEVELS = { hell: [1, 1, 1], mittel: [0.42, 0.37, 0.31], dunkel: [0.2, 0.17, 0.14] };
let level = 'mittel';
const tint = new THREE.Vector3(...LEVELS[level]);
document.querySelectorAll('[data-level]').forEach((b) => b.addEventListener('click', () => {
  level = b.dataset.level;
  document.querySelectorAll('[data-level]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
}));

// Scrollweg
let prog = 0, shown = 0, look = 0, lookWant = 0;
const readProg = () => { const m = scroller.scrollHeight - scroller.clientHeight; prog = m > 0 ? clamp(scroller.scrollTop / m) : 0; };
scroller.addEventListener('scroll', readProg, { passive: true });

// Umschauen (seitlich ziehen), Streichen über die Figur
let drag = null, lastLook = 0, figActive = 0;
const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(), hit = new THREE.Vector3();
const paintAt = (e) => {
  if (figActive < 0.3) return false;
  const r = canvas.getBoundingClientRect();
  ndc.set((e.clientX - r.left) / r.width * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
  ray.setFromCamera(ndc, camera);
  return ray.ray.intersectPlane(fig.plane(), hit) ? fig.paint(hit) : false;
};
scroller.addEventListener('pointerdown', (e) => { drag = { x: e.clientX, l: lookWant, onFig: paintAt(e) }; });
addEventListener('pointermove', (e) => {
  if (e.pointerType === 'mouse' && !drag) { paintAt(e); return; }
  if (!drag) return;
  if (drag.onFig || paintAt(e)) { drag.onFig = true; return; }
  lookWant = clamp(drag.l + (e.clientX - drag.x) / innerWidth * 1.6, -1.1, 1.1);
});
['pointerup', 'pointercancel'].forEach((t) => addEventListener(t, () => { drag = null; fig.release(); lastLook = performance.now(); }));

const tVal = $('#tensionVal'), tBar = $('#tensionBar');
setInterval(() => { if (!fig.touched) return; const t = fig.tension(); tVal.textContent = t; tBar.style.transform = `scaleX(${t / 100})`; if (t < 12) $('#meter').classList.add('done'); }, 250);

const panels = [...document.querySelectorAll('.panel')];
const P = V(), L = V(), dir = V();
function pose(t) {
  const K = SC.keys; let i = 0; while (i < K.length - 2 && t > K[i + 1].t) i++;
  const a = K[i], b = K[i + 1], k = ss(a.t, b.t, t);
  P.lerpVectors(a.p, b.p, k); L.lerpVectors(a.l, b.l, k);
}
function resize() {
  const w = canvas.clientWidth, h = canvas.clientHeight;
  if (!w || !h) return;
  renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
  shared.uPix.value = PR * (h / 900) * (mob ? 1.2 : 1);
}
new ResizeObserver(resize).observe(canvas); resize();

loadScene('flur');
let last = performance.now();
renderer.setAnimationLoop((now) => {
  const dt = Math.min(0.1, (now - last) / 1000); last = now;
  shown += (prog - shown) * (reduced ? 1 : Math.min(1, dt * 4));
  if (!drag && now - lastLook > 1600) lookWant *= Math.pow(0.02, dt);
  look += (lookWant - look) * Math.min(1, dt * 8);
  pose(shown);
  camera.position.copy(P);
  dir.subVectors(L, P); const yaw = Math.atan2(dir.x, dir.z) + look, len = Math.hypot(dir.x, dir.z);
  camera.lookAt(P.x + Math.sin(yaw) * len, L.y, P.z + Math.cos(yaw) * len);
  if (!reduced) camera.position.y += Math.sin(now * 0.0008) * 0.004;

  tint.lerp(V(...LEVELS[level]), Math.min(1, dt * 5)); room.recolor.setRGB(tint.x, tint.y, tint.z);

  shared.uTime.value += reduced ? 0 : dt;
  const figIn = roomReady ? ss(0.06, 0.3, shown) * (1 - ss(0.52, 0.66, shown)) : 0;
  figActive = figIn;
  fig.place(SC.foot, FIG_H, Math.atan2(P.x - SC.foot.x, P.z - SC.foot.z));
  fig.U.uIn.value = figIn; fig.pts.visible = figIn > 0.01;
  fig.U.uBreath.value += reduced ? 0 : dt * 1.15;
  fig.U.uLum.value = level === 'hell' ? 1.5 : 1;

  const idx = shown < 0.12 ? 0 : shown < 0.6 ? 1 : 2;
  panels.forEach((p, i) => p.classList.toggle('on', i === idx));
  renderer.render(scene, camera);
});
