// „Hausbesuch · Puls“ – Fusion der beiden Entwürfe (Auftrag Kai 9.11.2026):
// Konzept und Überschriften von „Hausbesuch“ (vor der Tür ankommen, hereinkommen, beim Scrollen durch die Räume gehen,
// Text-Ebene unten links, Stationen-Leiste), Welt und Inhalte von „Puls · Scan“ (dunkle Partikel-Praxis aus praxis.js,
// Figur „Spannung lösen“ im Empfang, gescannte Wirbelsäule mit Abschnitten in Behandlung 1, Manuthera-Bühne in
// Behandlung 2, Leistungs-Motive, Hausordnung, „Bis bald“ mit allen Angaben). Die Kamera geht aus Augenhöhe durch
// die Praxis; der Scrollweg (#film) steuert den Fortschritt. Puls (test-4) und Hausbesuch (haus) bleiben unverändert.
import * as THREE from 'three';
import gsap from 'gsap';
import Lenis from 'lenis';
import { praxisScanGen, EYE, P } from '../test-4/praxis.js';
import { glContext } from '../manu/common.js';
import { runSliced } from '../shared/slice.js';
import { initAGen as initManuGen, MODES as MANU_MODES } from '../manu/ideaA.js';
import { initServicesGen } from '../test-4/services.js';
import { buildHouse, buildDust, houseUniforms, Y0 } from './scene.js';
import { createFigure } from './figure.js';
import { createSpine } from './spine.js';

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const CALM = reduced ? 0.45 : 1;
const finePointer = matchMedia('(pointer: fine)').matches;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const smooth = (a, b, v) => { const t = clamp((v - a) / (b - a)); return t * t * (3 - 2 * t); };
const lerp = (a, b, t) => a + (b - a) * t;
const V3 = THREE.Vector3;

// ---------- „Bewegung anhalten“ (gleiche Wahl wie auf allen Labor-Seiten) ----------
let paused = false;
try { paused = localStorage.getItem('hop-motion') === 'paused'; } catch (e) { /* ohne Speicher */ }
function setPaused(v, save = true) {
  paused = v;
  document.documentElement.classList.toggle('paused', v);
  const b = $('#motionBtn');
  if (b) { b.setAttribute('aria-pressed', String(v)); const l = v ? 'Bewegung fortsetzen' : 'Bewegung anhalten'; b.setAttribute('aria-label', l); b.title = l; }
  if (save) try { localStorage.setItem('hop-motion', v ? 'paused' : 'on'); } catch (e) { /* ohne Speicher */ }
}
$('#motionBtn')?.addEventListener('click', () => setPaused(!paused));
setPaused(paused, false);
if (paused) {
  const n = document.createElement('div'); n.className = 'paused-note'; n.setAttribute('role', 'status');
  n.innerHTML = '<span>Bewegung ist angehalten.</span><button type="button">Fortsetzen</button>';
  document.body.appendChild(n);
  const hide = () => n.classList.add('gone');
  n.querySelector('button').addEventListener('click', () => { setPaused(false); hide(); });
  setTimeout(hide, 9000);
}

// ---------- Fenstergröße (ohne erzwungenes Layout beim Start, wie Puls) ----------
const mqSize = (dim) => { let lo = 0, hi = 16384; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (matchMedia(`(min-${dim}: ${m}px)`).matches) lo = m; else hi = m; } return lo; };
let VW = mqSize('width'), VH = mqSize('height');
let GLH = VH, GLW = VW, MINH = VH; // Szenenhöhe wächst am Handy nur (Safari-Leiste), Schwellen auf stabiler Höhe
addEventListener('resize', () => { VW = innerWidth; VH = innerHeight; });
const isDesktop = () => VW > 920;
const mob = !isDesktop();

// ---------- Scrollen ----------
let lenis = null, sheetOpen = false;
if (!reduced) {
  requestAnimationFrame(() => setTimeout(() => {
    lenis = new Lenis({ lerp: 0.07, smoothWheel: true, wheelMultiplier: 0.85 });
    gsap.ticker.add((t) => lenis.raf(t * 1000));
  }, 0));
  gsap.ticker.lagSmoothing(0);
}
const scrollToY = (y, dur = 1.8) => (lenis ? lenis.scrollTo(y, { duration: dur }) : scrollTo({ top: y, behavior: reduced ? 'auto' : 'smooth' }));
const topOf = (el) => el.getBoundingClientRect().top + scrollY;

// ---------- Renderer ----------
const canvas = $('#gl');
let renderer = null;
const glCtx = glContext(canvas);
if (glCtx) try { renderer = new THREE.WebGLRenderer({ canvas, context: glCtx, antialias: false, alpha: false, powerPreference: 'high-performance' }); } catch (e) { /* ohne WebGL bleibt die Seite lesbar */ }
const noGl = !renderer;
if (noGl) document.documentElement.classList.add('no-gl');
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(66, VW / VH, 0.03, 80);
if (renderer) { renderer.setPixelRatio(Math.min(devicePixelRatio || 1, mob ? 1.5 : 1.6)); renderer.setClearColor(0x0A161B, 1); }
const shared = { uTime: { value: 0 }, uPix: { value: 1 } };
const tanHalf = () => Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
const fPx = () => (renderer ? renderer.getPixelRatio() : 1) * GLH * 0.5 / tanHalf(); // Pixel je Welteinheit bei Abstand 1

// ---------- Praxis (Haus), Staub, Figur, Wirbelsäule ----------
const U = houseUniforms();
let prx = null, house = null;
const dust = renderer ? buildDust(scene, mob ? 1400 : 3000, shared) : null;
const fig = renderer ? createFigure(scene, mob ? 14000 : 30000, shared) : null;
const spine = renderer ? createSpine(scene, shared, { desktop: !mob }) : null;
let spineBuilt = false;
const buildSpine = () => { if (spineBuilt || !spine) return; spineBuilt = true; spine.build(mob ? 85000 : 300000, mob ? 0.032 : 0.024).catch((e) => console.error(e)); };
if (renderer) {
  runSliced(praxisScanGen(mob ? 32000 : 85000, mob ? 0.62 : 1)).then((r) => {
    prx = r; house = buildHouse(scene, prx, U);
    // Shader vorab übersetzen (sonst Ruckler beim ersten Bild der Figur/Wirbelsäule)
    try { renderer.compile(scene, camera); } catch (e) { /* egal */ }
    (window.requestIdleCallback || ((f) => setTimeout(f, 300)))(buildSpine, { timeout: 2500 });
  }).catch((e) => console.error(e));
}

// ---------- Weg durch die Praxis: Stationen (Grundriss-Pixel wie praxis.js) ----------
const pt = (x, y, h = EYE) => { const [a, b] = P(x, y); return new V3(a, h, b); };
const ST = [
  { key: 'tuer', name: 'Vor der Tür', at: [199, mob ? 450 : 385], look: [199, 236] },
  { key: 'empfang', name: 'Empfang', at: [150, 96], look: [84, 106], via: [[199, 262], [199, 150], [197, 74], [176, 62], [160, 78]] },
  { key: 'b1', name: 'Behandlung 1', at: [254, 44], look: [338, 64], via: [[160, 78], [176, 62], [197, 74], [212, 54], [236, 46]] },
  { key: 'b2', name: 'Behandlung 2', at: [254, 128], look: [320, 136], via: [[236, 50], [212, 68], [212, 112], [236, 128]] },
  { key: 'training', name: 'Training', at: [256, 214], look: [362, 236], via: [[236, 130], [213, 150], [213, 212], [238, 214]] },
  { key: 'tuer2', name: 'Bis bald', at: [199, 196], look: [199, 330], via: [[238, 216], [213, 214], [206, 206]] },
];
ST.forEach((s, i) => { s.pos = pt(...s.at); s.lk = pt(...s.look); s.lk.y = EYE - 0.1 + (mob && i === 0 ? 0.12 : 0); s.viaP = (s.via || []).map((v) => pt(...v)); });
// Wegstrecke je Übergang (Kurve durch die Zwischenpunkte des Zielraums)
const legCurve = (a, b) => new THREE.CatmullRomCurve3([ST[a].pos, ...ST[b].viaP, ST[b].pos], false, 'centripetal', 0.5);
// Zeitleiste des Rundgangs in Bildschirmhöhen: Aufenthalt (dwell, mit Kapitel) und Weg (leg)
const TL = [
  { k: 'dwell', st: 0, len: 0.6, ch: 0 },
  { k: 'leg', a: 0, b: 1, len: 1.5 },
  { k: 'dwell', st: 1, len: 0.9, ch: 1 },
  { k: 'dwell', st: 1, len: 1.4, ch: 2 },
  { k: 'leg', a: 1, b: 2, len: 1.3 },
  { k: 'dwell', st: 2, len: 0.8, ch: 3 },
  { k: 'dwell', st: 2, len: 3.9, ch: 4, segs: 6 },
  { k: 'leg', a: 2, b: 3, len: 0.8 },
  { k: 'dwell', st: 3, len: 1.4, ch: 5 },
  { k: 'leg', a: 3, b: 4, len: 0.8 },
  { k: 'dwell', st: 4, len: 0.9, ch: 6 },
];
let acc = 0; TL.forEach((s) => { s.t0 = acc; acc += s.len; s.t1 = acc; if (s.k === 'leg') s.curve = legCurve(s.a, s.b); });
const TOTAL = acc;
const film = $('#film');
film.style.height = `${((TOTAL + 1) * 100).toFixed(0)}svh`;
const doorFilm = $('#doorFilm');
const legBack = legCurve(4, 5);
// Scroll-Position einer Stelle der Zeitleiste
const scrollOfTL = (pos) => { const r = film.getBoundingClientRect(); return r.top + scrollY + (pos / TOTAL) * (r.height - MINH); };
const segAt = (pos) => TL.find((s) => pos >= s.t0 && pos < s.t1) || TL[TL.length - 1];

// ---------- Oberfläche: Kapitel, Leiste, Kopfzeile ----------
const chaps = $$('.overlay .chap'), overlay = $('#overlay'), dock = $('.dock'), dockItems = $$('#dock li'), chapLabel = $('#chapLabel'), letterbox = $('.letterbox'), top = $('#top');
let chapOn = -1;
function setChap(i) {
  if (i === chapOn) return; chapOn = i;
  chaps.forEach((c) => c.classList.toggle('is-on', +c.dataset.ch === i));
}
// Begrüßung nach Uhrzeit (Hausbesuch)
{ const hr = new Date().getHours(); $('#greet').textContent = hr >= 5 && hr < 11 ? 'Guten Morgen.' : hr < 18 ? 'Guten Tag.' : 'Guten Abend.'; }
// Stationen-Leiste: Film-Stationen → Zeitleiste, danach Abschnitte der Seite
const DOCK_TL = { tuer: 0.05, empfang: TL[2].t0 + 0.2, b1: TL[5].t0 + 0.2, b2: TL[8].t0 + 0.3, training: TL[10].t0 + 0.25 };
const DOCK_EL = { leistungen: '#leistungen', hausordnung: '#hausordnung', tuer2: '#tuer' };
const CHAP_EL = { tuer: '#start', empfang: '[data-ch="1"]', b1: '[data-ch="3"]', b2: '[data-ch="5"]', training: '[data-ch="6"]' };
function goTo(key) {
  if (noGl) { const el = $(CHAP_EL[key] || DOCK_EL[key]); if (el) scrollToY(topOf(el) - 80); return; }
  if (key in DOCK_TL) scrollToY(scrollOfTL(DOCK_TL[key]) + 2, 2.4);
  else if (key === 'tuer2') scrollToY(topOf(doorFilm) + doorFilm.offsetHeight - MINH, 2.4);
  else { const el = $(DOCK_EL[key]); if (el) scrollToY(topOf(el)); }
}
$$('[data-go]').forEach((b) => b.addEventListener('click', (e) => { e.preventDefault(); goTo(b.dataset.go); }));
$$('a[href^="#"]:not(.skip):not([data-termin]):not([data-go])').forEach((a) => a.addEventListener('click', (e) => {
  const id = a.getAttribute('href').slice(1);
  if (id === 'start') { e.preventDefault(); scrollToY(0); return; }
  const t = document.getElementById(id); if (!t) return;
  e.preventDefault(); scrollToY(topOf(t));
}));
let dockOn = -1, labelTxt = '';
function setDock(i, name) {
  if (i !== dockOn) { dockOn = i; dockItems.forEach((li, k) => { li.classList.toggle('is-on', k <= i); li.classList.toggle('is-now', k === i); }); }
  if (name !== labelTxt) { labelTxt = name; chapLabel.textContent = name; }
}

// ---------- Wirbelsäule: Abschnitte ----------
const segBtns = $$('.segnav button'), cards = $$('.seg-card');
let segOn = 0;
function setSeg(i) { if (i === segOn) return; segOn = i; segBtns.forEach((b, k) => b.classList.toggle('is-on', k === i)); cards.forEach((c, k) => c.classList.toggle('is-on', k === i)); }
const SEGTL = TL[6];
segBtns.forEach((b) => b.addEventListener('click', () => { const i = +b.dataset.seg; if (noGl) { setSeg(i); return; } scrollToY(scrollOfTL(SEGTL.t0 + ((i + 0.5) / SEGTL.segs) * SEGTL.len) + 2, 1.4); }));

// ---------- Figur: Spannung lösen ----------
const tensionBar = $('#tension'), tensionVal = $('#tensionVal'), meter = $('.meter'), meterLbl = $('.meter span');
let tensionShown = 100, calm = false, figActive = 0;
if (fig) setInterval(() => {
  if (!fig.touched || figActive < 0.5) return;
  const t = fig.tension();
  gsap.to({ v: tensionShown }, { v: t, duration: 0.5, onUpdate() { tensionShown = this.targets()[0].v; tensionVal.textContent = Math.round(tensionShown); } });
  tensionBar.style.transform = `scaleX(${t / 100})`;
  if (t === 0 && !calm) { calm = true; meter?.classList.add('is-calm'); if (meterLbl) meterLbl.textContent = 'Entspannt.'; }
}, 300);
const raycaster = new THREE.Raycaster(), ndc = new THREE.Vector2(), hit = new V3();
function paintAt(cx, cy) {
  if (!fig || figActive < 0.3) return false;
  ndc.set(cx / VW * 2 - 1, -(cy / GLH) * 2 + 1);
  raycaster.setFromCamera(ndc, camera);
  if (!raycaster.ray.intersectPlane(fig.plane(), hit)) return false;
  return fig.paint(hit);
}

// ---------- Umschauen (ziehen) + Malen auf der Figur ----------
let yawOff = 0, pitchOff = 0, drag = null, lastInput = -1e9, lastLook = -1e9;
const onStage = (t) => t && (t.closest('.film, .door-film, #gl') || t === document.body);
document.addEventListener('pointerdown', (e) => {
  if (!renderer || e.button > 0 || !onStage(e.target) || e.target.closest('a,button,.chap,.manu-panel,.dock,.top')) return;
  drag = { x: e.clientX, y: e.clientY, yaw: yawOff, pitch: pitchOff, moved: 0, type: e.pointerType };
  lastInput = performance.now();
});
addEventListener('pointermove', (e) => {
  lastInput = performance.now();
  if (!e.clientX && !e.clientY) return;
  // Maus: Figur reagiert schon auf das Überfahren; Finger: nur beim Streichen (Ziehen)
  if (fig && (e.pointerType === 'mouse' || drag)) {
    const painted = paintAt(e.clientX, e.clientY);
    if (painted && drag) { drag.moved = 99; return; }
  }
  if (!drag) return;
  const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
  drag.moved = Math.max(drag.moved, Math.abs(dx) + Math.abs(dy));
  yawOff = clamp(drag.yaw - dx * 0.0045, -0.8, 0.8);
  if (drag.type === 'mouse') pitchOff = clamp(drag.pitch - dy * 0.003, -0.35, 0.35);
  lastLook = performance.now();
}, { passive: true });
['pointerup', 'pointercancel'].forEach((t) => addEventListener(t, () => { drag = null; fig?.release(); lastLook = performance.now(); }));
addEventListener('pointerleave', () => fig?.release());

// ---------- Manuthera-Bühne (eigene Partikel-Liege, liegt über Behandlungsraum 2) ----------
const manuPanel = $('#manuPanel'), manuBtns = $$('#manuModes button'), manuRead = $('#manuRead');
let manu = null, manuK = 0, manuStarted = false;
const manuUi = {
  transparent: true, isPaused: () => paused,
  onMode(i) { manuBtns.forEach((b, j) => { b.classList.toggle('is-on', j === i); b.setAttribute('aria-pressed', j === i ? 'true' : 'false'); b.querySelector('i').style.width = '0'; }); manuRead.textContent = MANU_MODES[i].txt; },
  onAmount(a) { const b = manuBtns.find((x) => x.classList.contains('is-on')); if (b) b.querySelector('i').style.width = (a * 100).toFixed(1) + '%'; },
};
manuRead.textContent = MANU_MODES[0].txt;
manuBtns.forEach((b, i) => b.addEventListener('click', () => manu && manu.select(i, true)));
function startManu() {
  if (manuStarted || !renderer) return; manuStarted = true;
  const cv = $('#glManu'); cv.classList.add('gl-wait');
  runSliced(initManuGen(cv, manuUi)).then((m) => { manu = m; if (!m) document.documentElement.classList.add('no-gl-manu'); cv.classList.remove('gl-wait'); }).catch((e) => console.error(e));
}

// ---------- Leistungen: Partikel-Motive (wie Puls) ----------
$$('.index li').forEach((li) => {
  const b = $('button', li);
  b.insertAdjacentHTML('beforeend', '<span class="ix-plus" aria-hidden="true"></span>');
  b.addEventListener('click', () => {
    const open = !li.classList.contains('open');
    $$('.index li.open').forEach((o) => { o.classList.remove('open'); $('button', o).setAttribute('aria-expanded', 'false'); });
    li.classList.toggle('open', open); b.setAttribute('aria-expanded', String(open));
  });
});
const servList = $('.roof-list'), servName = $('#servName'), servItems = $$('#index li'), listSec = $('#leistungen');
let serv = null, servStarted = false, servLock = -1e9, servAutoT = 0;
function startServ() {
  if (servStarted || !renderer) return; servStarted = true;
  const cv = $('#glServ'); cv.classList.add('gl-wait');
  runSliced(initServicesGen(cv, { isPaused: () => paused, onShow: (i, name) => { if (servName) servName.textContent = name; } })).then((m) => { serv = m; if (!m) document.documentElement.classList.add('no-gl-serv'); cv.classList.remove('gl-wait'); }).catch((e) => console.error(e));
}
servItems.forEach((li, i) => {
  const b = li.querySelector('button');
  b.addEventListener('pointerenter', () => { if (serv && isDesktop()) { serv.show(i); servLock = performance.now(); } });
  b.addEventListener('focus', () => { if (serv) { serv.show(i); servLock = performance.now(); } });
  b.addEventListener('click', () => { if (serv) { serv.show(i); servLock = performance.now(); } });
});
function updateServices(dt) {
  if (!serv || !serv.st.visible) return;
  if (!isDesktop()) {
    let best = -1, bd = 1e9; servItems.forEach((li, i) => { const b = li.getBoundingClientRect(), d = Math.abs(b.top + b.height / 2 - VH * 0.62); if (d < bd) { bd = d; best = i; } });
    if (best >= 0 && performance.now() - servLock > 2500) serv.show(best);
  } else if (performance.now() - servLock > 7000 && !paused) { servAutoT += dt; if (servAutoT > 4.5) { servAutoT = 0; serv.show((serv.current + 1) % servItems.length); } }
  serv.update(0, dt);
  serv.st.renderer.render(serv.st.scene, serv.st.camera);
}
// Bühnen erst anlegen, wenn ihr Abschnitt naht (A1)
if (renderer) {
  const near = (el, fn) => { const io = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) { io.disconnect(); fn(); } }, { rootMargin: '150% 0px' }); io.observe(el); };
  near(listSec, startServ);
}

// ---------- Hausordnung (Puls: Paragraphen wechseln von selbst, solange der Abschnitt im Bild steht) ----------
const rules = $('#hausordnung'), laws = $$('#laws li'), lawBtns = $$('#lawProg button'), lawDur = laws.map((li) => 2600 + 45 * li.textContent.trim().length);
let lawOn = 0; const LAW = { t: 0, vis: false, last: 0 };
function setLaw(i) { if (i === lawOn) return; laws[lawOn].classList.remove('is-on'); laws[i].classList.add('is-on'); lawOn = i; }
lawBtns.forEach((b, i) => b.addEventListener('click', () => { setLaw(i); LAW.t = 0; }));
$('#laws').addEventListener('click', () => { setLaw((lawOn + 1) % laws.length); LAW.t = 0; });
function updateLaws() {
  const rr = rules.getBoundingClientRect(), now = performance.now(), step = Math.min(250, now - (LAW.last || now)), vis = rr.top < VH * 0.55 && rr.bottom > VH * 0.45;
  LAW.last = now;
  if (vis && !LAW.vis) { setLaw(0); LAW.t = 0; }
  LAW.vis = vis;
  if (!vis) return;
  if (!paused) { LAW.t += step; if (LAW.t > lawDur[lawOn]) { LAW.t = 0; setLaw((lawOn + 1) % laws.length); } }
  lawBtns.forEach((b, i) => b.style.setProperty('--p', i < lawOn ? 1 : i > lawOn ? 0 : Math.min(1, LAW.t / lawDur[lawOn]).toFixed(3)));
}

// ---------- Hinweis-Pille zum Anfassen (Figur) ----------
const MOUSE = '<svg viewBox="0 0 24 32" aria-hidden="true"><rect x="2" y="2" width="20" height="28" rx="10"/><path d="M12 2v10M2 12h20"/><rect class="th-wheel" x="10.5" y="5" width="3" height="5" rx="1.5"/></svg>';
const hintFig = document.createElement('div'); hintFig.className = 'touch-hint'; hintFig.setAttribute('aria-hidden', 'true');
hintFig.innerHTML = `<span class="th-track"><i class="th-dot${finePointer ? ' th-mouse' : ''}">${finePointer ? MOUSE : ''}</i></span><span>${finePointer ? 'Maus über den Gast' : 'Seitlich streichen'}</span>`;
document.body.appendChild(hintFig);
let figT = 0;
const _hp = new V3();
function updateHints(dt) {
  if (!fig) return;
  figT = figActive > 0.95 && chapOn === 2 ? figT + dt : 0;
  const show = !fig.touched && figT > 2.5 && !sheetOpen;
  hintFig.classList.toggle('on', show);
  if (show) {
    _hp.copy(fig.at(100, 14)).project(camera);
    hintFig.style.transform = `translate(${((_hp.x * 0.5 + 0.5) * VW).toFixed(1)}px, ${((-_hp.y * 0.5 + 0.5) * GLH - 26).toFixed(1)}px) translate(-50%,-100%)`;
  }
}

// ---------- Größe ----------
function resize() {
  MINH = VW !== GLW || isDesktop() ? VH : Math.min(MINH, VH);
  if (isDesktop() || VW !== GLW || VH > GLH || VH < GLH * 0.7) GLH = VH;
  GLW = VW;
  camera.aspect = VW / GLH; camera.fov = VW / GLH < 1 ? 82 : 66;
  if (VW / GLH < 1) camera.setViewOffset(VW, GLH, 0, Math.round(GLH * 0.09), VW, GLH); else camera.clearViewOffset();
  camera.updateProjectionMatrix();
  if (renderer) {
    const cv = renderer.domElement, pr = renderer.getPixelRatio();
    if (cv.width !== Math.floor(VW * pr) || cv.height !== Math.floor(GLH * pr)) renderer.setSize(VW, GLH, false);
    cv.style.height = isDesktop() ? '' : GLH + 'px';
    shared.uPix.value = pr * (GLH / 900) * (isDesktop() ? 1 : 1.2);
  }
}
addEventListener('resize', resize); resize();

// ---------- Kamera ----------
const cam = { pos: ST[0].pos.clone(), look: ST[0].lk.clone() };
const want = { pos: ST[0].pos.clone(), look: ST[0].lk.clone() };
const tmpA = new V3(), tmpB = new V3(), ahead = new V3(), segC = new V3();
let spineRot = -0.9, spineSolid = 0, figIn = 0, doorWant = 0, dustAmt = 1, lumWant = 1, cutIntro = reduced ? 10 : Y0 - 0.2, zoomK = 0, bisK = 0;
// Blick während eines Wegs: vom alten Ziel über „geradeaus“ zum neuen Ziel (wie der Rundgang aus Augenhöhe)
function legPose(curve, A, B, e) {
  curve.getPoint(e, want.pos);
  curve.getTangent(e, tmpA); tmpA.y = 0; tmpA.normalize();
  ahead.copy(want.pos).addScaledVector(tmpA, 2); ahead.y = EYE - 0.1;
  const s0 = smooth(0, 0.3, e), s1 = smooth(0.62, 1, e);
  want.look.copy(A.lk).lerp(ahead, s0).lerp(B.lk, s1);
}
// Wirbelsäulen-Lage im Raum: Hologramm über der Behandlungsliege, 1,4 m hoch
const SPINE_C = pt(338, 64, Y0 + (0.82 + 0.7) * 0.5), SPINE_H = 0.7;
const FIG_FOOT = pt(84, 106, Y0), FIG_H = 0.875;
if (spine) spine.place(SPINE_C, SPINE_H);
// Abschnitt im Bild: Kamera lehnt sich heran, Abschnitt rechts der Textspalte (PC) bzw. im oberen Bildteil (Handy)
function zoomPose(i) {
  spine.segCenter(i, segC);
  tmpB.copy(ST[2].pos).sub(segC); tmpB.y = 0; tmpB.normalize();
  const d = mob ? 0.34 : 0.27;
  want.pos.copy(segC).addScaledVector(tmpB, d);
  want.pos.y = clamp(segC.y + 0.04, EYE - 0.28, EYE + 0.3);
  // seitlicher Versatz: Abschnitt bei ~64 % der Breite (PC), Handy mittig und etwas über der Karte
  const right = new V3().crossVectors(tmpB.clone().negate(), new V3(0, 1, 0)).normalize();
  const hh = d * tanHalf(), hw = hh * camera.aspect;
  const fx = mob ? 0.5 : 0.64, fy = mob ? 0.42 : 0.5;
  want.pos.addScaledVector(right, -(fx - 0.5) * 2 * hw); want.pos.y += (fy - 0.5) * 2 * hh;
  want.look.copy(segC).addScaledVector(right, -(fx - 0.5) * 2 * hw); want.look.y += (fy - 0.5) * 2 * hh;
}

// ---------- Schleife ----------
const timer = new THREE.Timer();
let lastTick = performance.now(), viaWatchdog = false, frameN = 0;
setInterval(() => { if (document.hidden || performance.now() - lastTick < 120) return; viaWatchdog = true; gsap.ticker.tick(); viaWatchdog = false; }, 33);
const DOCK_KEYS = ['tuer', 'empfang', 'b1', 'b2', 'training', 'leistungen', 'hausordnung', 'tuer2'];
let filmVis = true, doorK = 0;
function tick() {
  lastTick = performance.now(); frameN++;
  if (sheetOpen && mob) return;
  if (!viaWatchdog && mob && performance.now() - lastInput > 1500 && frameN % 2 && chapOn !== 2) return; // Handy: im Stillstand jedes 2. Bild (Akku)
  timer.update();
  const dt = Math.min(timer.getDelta(), 0.1);
  if (!paused) shared.uTime.value += dt * CALM;
  const k3 = reduced ? 1 : 1 - Math.exp(-dt * 3), k6 = reduced ? 1 : 1 - Math.exp(-dt * 6);

  // Fortschritt im Rundgang
  const r = film.getBoundingClientRect();
  const pos = clamp(-r.top / Math.max(1, r.height - MINH)) * TOTAL;
  const inFilm = r.bottom > MINH * 0.5;
  const seg = segAt(pos), t = clamp((pos - seg.t0) / seg.len);
  let chap = -1, dockI = 0, name = '', figWant = 0, spineWant = 0, manuWant = 0, zoomWant = 0, segIdx = segOn;
  const dr = doorFilm.getBoundingClientRect();
  const q = clamp(-dr.top / Math.max(1, dr.height - MINH)); // Rückweg zur Tür
  const inDoor = dr.top < MINH * 0.6 && dr.bottom > 0;
  if (inFilm && !inDoor) {
    if (seg.k === 'dwell') {
      const S = ST[seg.st];
      want.pos.copy(S.pos); want.look.copy(S.lk);
      chap = seg.ch; dockI = seg.st; name = S.name;
      if (seg.st === 1) figWant = 1;
      if (seg.st === 2) { spineWant = 1; if (seg.segs) { segIdx = Math.min(seg.segs - 1, Math.floor(t * seg.segs)); zoomWant = 1; } }
      if (seg.st === 3) manuWant = 1;
    } else {
      const A = ST[seg.a], B = ST[seg.b];
      legPose(seg.curve, A, B, smooth(0.03, 0.97, t));
      chap = t < 0.18 ? TL[TL.indexOf(seg) - 1].ch : t > 0.82 ? TL[TL.indexOf(seg) + 1].ch : -1;
      dockI = t < 0.5 ? seg.a : seg.b; name = t < 0.5 ? A.name : B.name;
      if (seg.a === 0) doorWant = 1.75 * smooth(0.02, 0.26, t);
      if (seg.b === 1) figWant = smooth(0.5, 0.98, t);
      if (seg.a === 1) figWant = 1 - smooth(0, 0.4, t);
      if (seg.b === 2) spineWant = smooth(0.55, 1, t);
      if (seg.a === 2) spineWant = 1 - smooth(0, 0.45, t);
      if (seg.b === 3) manuWant = smooth(0.7, 1, t);
      if (seg.a === 3) manuWant = 1 - smooth(0, 0.3, t);
    }
    if (pos > TL[1].t0 + TL[1].len * 0.3) doorWant = 1.75;
    if (pos < TL[1].t0) doorWant = 0;
    if (pos > TL[4].t0) buildSpine();
    if (pos > TL[6].t0 + 1) startManu();
  } else {
    // nach dem Rundgang: im Training stehen bleiben, beim „Bis bald“ zurück in den Flur vor die offene Tür
    const e = smooth(0.02, 0.72, q);
    if (inDoor && q > 0) legPose(legBack, ST[4], ST[5], e); else { want.pos.copy(ST[4].pos); want.look.copy(ST[4].lk); }
    doorWant = 1.75;
    const lr = listSec.getBoundingClientRect(), rr = rules.getBoundingClientRect();
    const di0 = $('.door-inner').getBoundingClientRect();
    if ((inDoor && dr.top < MINH * 0.5) || di0.top < MINH * 0.5) { dockI = 7; name = 'Bis bald'; }
    else if (rr.top < MINH * 0.5 && rr.bottom > MINH * 0.5) { dockI = 6; name = 'Hausordnung'; }
    else if (lr.top < MINH * 0.5) { dockI = 5; name = 'Alle Leistungen'; }
    else { dockI = 4; name = ST[4].name; }
  }
  // Kapitel „Bis bald“ in der eigenen Bühne (steht im Dokument, kein Overlay)
  const bisWant = inDoor ? smooth(0.5, 0.75, q) : 0;
  bisK += (bisWant - bisK) * k6;
  $('#bisbald').classList.toggle('is-on', bisK > 0.5);
  setChap(inFilm && !inDoor ? chap : -1);
  setDock(dockI, name);
  setSeg(segIdx);
  // Text-Ebene und Leiste: im Rundgang sichtbar, danach weg (die Infoseiten haben eigenen Grund)
  filmVis = inFilm && !inDoor;
  overlay.classList.toggle('gone', !filmVis && !noGl);
  letterbox.classList.toggle('gone', !filmVis && !inDoor);
  top.classList.toggle('scrolled', scrollY > 30);

  // Figur, Wirbelsäule, Manuthera-Bühne, Tür
  figIn += (figWant - figIn) * (reduced ? 1 : 1 - Math.exp(-dt * 2.2));
  figActive = figIn;
  spineSolid += (spineWant - spineSolid) * (reduced ? 1 : 1 - Math.exp(-dt * 3));
  manuK += (manuWant - manuK) * k6;
  zoomK += ((zoomWant && spine && spine.ready ? 1 : 0) - zoomK) * (reduced ? 1 : 1 - Math.exp(-dt * 2.6));
  U.uDoor.value += (doorWant - U.uDoor.value) * (reduced ? 1 : 1 - Math.exp(-dt * 2.2));
  if (fig) {
    // Figur schaut zur Kamera (ein Gast, der sich zu Ihnen umdreht)
    const yaw = Math.atan2(cam.pos.x - FIG_FOOT.x, cam.pos.z - FIG_FOOT.z);
    const cur = fig.U.uYaw.value, d = Math.atan2(Math.sin(yaw - cur), Math.cos(yaw - cur));
    fig.place(FIG_FOOT, FIG_H, cur + d * k3);
    fig.U.uIn.value = figIn; fig.pts.visible = figIn > 0.01;
    fig.U.uBreath.value += paused ? 0 : dt * CALM * (1.15 - fig.U.uCalm.value * 0.45);
    fig.U.uCalm.value += ((calm ? 1 : 0) - fig.U.uCalm.value) * Math.min(1, dt * 0.8);
  }
  if (spine) {
    const sp = spine;
    if (zoomK > 0.01 && sp.ready) {
      // Abschnitt: Nahansicht, Profil-Drehung je Abschnitt, Hervorhebung
      const az = sp.STOPS[segIdx].az;
      const tgt = -Math.PI + az;
      const dd = Math.atan2(Math.sin(tgt - spineRot), Math.cos(tgt - spineRot));
      spineRot += dd * (reduced ? 1 : 1 - Math.exp(-dt * 2.6)) * zoomK;
      if (!paused) spineRot += dt * 0.22 * (1 - zoomK);
      zoomPose(segIdx);
      const S = ST[2];
      want.pos.lerpVectors(S.pos, want.pos, zoomK); want.look.lerpVectors(S.lk, want.look, zoomK);
      const zone = zoomK > 0.5 ? sp.zoneOf(segIdx) : -10;
      if (zone !== sp.U.uZone.value) { sp.U.uZone.value = zone; sp.U.uZoneAmt.value = 0; }
    } else {
      if (!paused) spineRot += dt * 0.22 * CALM;
      if (sp.U.uZone.value !== -10) { sp.U.uZone.value = -10; sp.U.uZoneAmt.value = 0; }
    }
    sp.U.uZoneAmt.value += ((sp.U.uZone.value >= 0 ? 1 : 0) - sp.U.uZoneAmt.value) * 0.07;
    sp.U.uRot.value = spineRot;
    sp.setSolid(spineSolid);
    sp.setStip(fPx());
    sp.U.uMaxSize.value = 2.6;
  }
  manuPanel.classList.toggle('on', manuK > 0.02);
  manuPanel.style.opacity = manuK > 0.02 ? manuK.toFixed(3) : '';
  // Gesamthelligkeit der Praxis: hinter der Manuthera-Bühne und den Infoseiten zurücktreten
  const lr = listSec.getBoundingClientRect(), rr = rules.getBoundingClientRect(), di = $('.door-inner').getBoundingClientRect();
  let dim = manuK * 0.68;
  if (!filmVis) dim = Math.max(dim, 0.72 * smooth(MINH * 1.1, MINH * 0.4, lr.top) * (1 - smooth(MINH * 0.6, MINH * 0.1, dr.top)));
  if (inDoor) dim = Math.max(dim, 0.85 * smooth(MINH * 0.9, MINH * 0.3, di.top));
  if (rr.top < MINH && rr.bottom > 0 && !inDoor) dim = Math.max(dim, 0.78);
  lumWant = 1 - dim;
  U.uLum.value += (lumWant - U.uLum.value) * k3;
  if (fig) fig.U.uLum.value = U.uLum.value;
  if (spine) spine.U.uLum.value = U.uLum.value;
  if (dust) dust.U.uDust.value = U.uLum.value * (reduced ? 0.6 : 1);
  // Aufbau der Praxis beim Start: vom Boden bis zur Decke
  if (house && cutIntro < 9) { cutIntro += dt * 0.8; if (cutIntro > Y0 + 1.7) cutIntro = 10; }
  U.uCut.value = cutIntro;
  U.uPix.value = shared.uPix.value;
  const f = fPx();
  U.uLogo.value = f * 0.0042 * 1.05;
  if (prx) U.uStip.value = f * prx.spacing * 0.62;

  // Kamera weich nachführen, Umschauen (zieht sich langsam zurück), leichtes Atmen
  cam.pos.lerp(want.pos, k3); cam.look.lerp(want.look, k3);
  if (!drag && performance.now() - lastLook > 1200) { const kk = 1 - Math.exp(-dt * 1.4); yawOff -= yawOff * kk; pitchOff -= pitchOff * kk; }
  camera.position.copy(cam.pos);
  if (!reduced && !paused) camera.position.y += Math.sin(shared.uTime.value * 0.8) * 0.004;
  tmpA.copy(cam.look).sub(cam.pos);
  const rl = tmpA.length(), yaw = Math.atan2(tmpA.x, tmpA.z) + yawOff, pit = Math.asin(clamp(tmpA.y / rl, -1, 1)) + pitchOff;
  camera.lookAt(cam.pos.x + Math.sin(yaw) * Math.cos(pit), camera.position.y + Math.sin(pit), cam.pos.z + Math.cos(yaw) * Math.cos(pit));

  updateLaws();
  updateHints(dt);
  if (renderer && !document.hidden) renderer.render(scene, camera);
  if (manu && manuK > 0.01 && !document.hidden) { manu.update(0, dt); manu.st.renderer.render(manu.st.scene, manu.st.camera); }
  if (!document.hidden) updateServices(dt);
}
gsap.ticker.add(tick);
window.__fusion = { camera, cam, want, ST, TL, TOTAL, get spine() { return spine; }, get fig() { return fig; }, get manuK() { return manuK; }, get zoomK() { return zoomK; }, get pos() { const r = film.getBoundingClientRect(); return clamp(-r.top / Math.max(1, r.height - MINH)) * TOTAL; } };

// Intro: Text-Ebene und Leiste kommen sanft
if (!reduced) requestAnimationFrame(() => gsap.from(['.top', '.chap.is-on > *'], { opacity: 0, y: 18, duration: 1.4, stagger: 0.1, ease: 'expo.out', delay: 0.3 }));
requestAnimationFrame(() => requestAnimationFrame(() => dock.classList.add('in')));

// ---------- Termin-Knöpfe: Herzschlag in Ruhe (wie Puls) ----------
const inView = (el) => { if (!el) return false; const r = el.getBoundingClientRect(); return r.width > 0 && r.bottom > 0 && r.top < VH && r.right > 0 && r.left < VW; };
{
  const beatBtns = [$('.chap[data-ch="0"] .btn:not(.btn-ghost)'), $('.chap-door .btn:not(.btn-ghost)'), $('.top .btn-small')].filter(Boolean);
  let lastBeat = performance.now(), beats = 0;
  setInterval(() => {
    const now = performance.now();
    if (paused || reduced || document.hidden || now - lastInput < 3000 || now - lastBeat < Math.min(30000, 10000 + beats * 5000)) return;
    const b = beatBtns.find(inView); if (!b) return;
    b.classList.remove('beat'); void b.offsetWidth; b.classList.add('beat');
    lastBeat = now; beats++;
  }, 1000);
  beatBtns.forEach((b) => b.addEventListener('animationend', () => b.classList.remove('beat')));
}

// ---------- Kontakt: E-Mail kopieren, Öffnungsstatus (wie Puls) ----------
{
  const copyBtn = $('#copyMail'), copyState = $('#copyState'), mailA = $('#mailAddr');
  if (copyBtn && copyState && mailA) {
    copyBtn.hidden = false;
    let tm = 0;
    const say = (t) => { copyState.textContent = t; clearTimeout(tm); tm = setTimeout(() => { copyState.textContent = ''; }, 4000); };
    const selectAddr = () => { const rg = document.createRange(); rg.selectNodeContents(mailA); const s = getSelection(); s.removeAllRanges(); s.addRange(rg); };
    copyBtn.addEventListener('click', async () => {
      const addr = mailA.textContent.trim();
      try { await navigator.clipboard.writeText(addr); say('Kopiert'); }
      catch (e) { selectAddr(); say('Adresse markiert – bitte selbst kopieren'); }
    });
  }
  const openEls = ['openNow', 'tsOpen'].map((id) => document.getElementById(id)).filter(Boolean);
  if (openEls.length) {
    const HOLY = {};
    const holidays = (y) => {
      if (HOLY[y]) return HOLY[y];
      const a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3);
      const h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451);
      const month = Math.floor((h + l - 7 * m + 114) / 31), day = ((h + l - 7 * m + 114) % 31) + 1;
      const easter = Date.UTC(y, month - 1, day), key = (t) => new Date(t).toISOString().slice(0, 10), fix = (mo, da) => key(Date.UTC(y, mo - 1, da));
      return (HOLY[y] = new Set([fix(1, 1), fix(1, 6), key(easter - 2 * 864e5), key(easter + 864e5), fix(5, 1), key(easter + 39 * 864e5), key(easter + 50 * 864e5), key(easter + 60 * 864e5), fix(10, 3), fix(11, 1), fix(12, 25), fix(12, 26)]));
    };
    const DAYS = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
    const OPEN = 8 * 60 + 30, CLOSE = 19 * 60 + 30;
    const upd = () => {
      try {
        const p = {};
        new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Berlin', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date()).forEach((x) => { p[x.type] = x.value; });
        const base = Date.UTC(+p.year, +p.month - 1, +p.day), mins = +p.hour * 60 + +p.minute;
        const info = (k) => { const d = new Date(base + k * 864e5); return { wd: d.getUTCDay(), key: d.toISOString().slice(0, 10) }; };
        const isOpenDay = (k) => { const d = info(k); return d.wd >= 1 && d.wd <= 5 && !holidays(+d.key.slice(0, 4)).has(d.key); };
        if (info(0).key.slice(0, 4) > '2027') { openEls.forEach((e) => (e.hidden = true)); return; }
        let t;
        if (isOpenDay(0) && mins < OPEN) t = 'Heute ab 8:30 geöffnet';
        else if (isOpenDay(0) && mins < CLOSE) t = 'Heute geöffnet bis 19:30';
        else { let k = 1; while (k < 10 && !isOpenDay(k)) k++; t = k === 1 ? 'Morgen ab 8:30' : DAYS[info(k).wd] + ' ab 8:30'; }
        openEls.forEach((e) => { e.textContent = t; e.hidden = false; });
      } catch (e) { openEls.forEach((el) => (el.hidden = true)); }
    };
    upd(); setInterval(upd, 60000);
  }
}

// ---------- Termin-Blatt (wie Puls · Scan, Option C): Optica-Kalender lädt erst nach „Kalender laden“ ----------
{
  const dlg = $('#terminSheet');
  if (dlg && typeof dlg.showModal === 'function') {
    const pre = $('#tsPre'), box = $('#tsFrame'), load = $('#tsLoad'), xBtn = $('#tsClose');
    let opener = null, frame = null;
    const open = (e) => {
      e.preventDefault();
      if (dlg.open) return;
      opener = e.currentTarget;
      document.documentElement.classList.add('sheet-open');
      lenis?.stop(); sheetOpen = true;
      dlg.showModal();
      (frame ? xBtn : load).focus();
    };
    const close = () => { if (dlg.open) dlg.close(); };
    dlg.addEventListener('close', () => { document.documentElement.classList.remove('sheet-open'); lenis?.start(); sheetOpen = false; opener?.focus({ preventScroll: true }); });
    dlg.addEventListener('click', (e) => { if (e.target === dlg) close(); });
    xBtn.addEventListener('click', close);
    load.addEventListener('click', () => {
      frame = document.createElement('iframe');
      frame.title = 'Online-Terminkalender HOP (Optica Viva)';
      if (new URLSearchParams(location.search).get('sandbox') !== '0') frame.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-storage-access-by-user-activation');
      frame.referrerPolicy = 'strict-origin-when-cross-origin';
      frame.src = box.dataset.src;
      frame.addEventListener('load', () => box.classList.add('loaded'), { once: true });
      box.appendChild(frame);
      pre.hidden = true; box.hidden = false;
      dlg.classList.add('has-frame');
      xBtn.focus();
    });
    $$('[data-termin]').forEach((a) => a.addEventListener('click', open));
  }
}
