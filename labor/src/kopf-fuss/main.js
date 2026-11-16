// Entwurfsseite „Von Kopf bis Fuß“ (Auftrag K, Go Kai 16.11.2026): Kapitel 01 neu – die Fahrt von Kopf bis Fuß verschmilzt mit
// „Spannung lösen“. Alles ist Funktion des Scroll-Fortschritts u (Bildschirmhöhen seit Beginn der Bühne), weich nachgeführt (us):
//   KEYS → Blick (Blickpunkt, Maßstab, Anker) + Spitze der Lichtlinie; Stationen halten je ~0,75 Höhen.
// Partikel: gl.js (Körper-Shader aus Puls, eigene Bühne). Darüber gestochen scharf als SVG: Lichtlinie, Leuchtpunkt, Ringe,
// Verbindungslinie (PC). Lösen: Finger-/Maus-Pinsel wie Puls (Zeichenfläche, Rest ≤ 8 = gelöst) oder Tippen (Welle ab Tippstelle);
// wer weiterscrollt, löst die Stelle mit der Lichtlinie. Puls (src/test-4) wird nur gelesen. Debug: window.__kf (state, go).
import { STATIONS, LINES, lineTo, BODY_SVG, figurePoints, CROWN, SOLE, SPLIT, BODY_W, BODY_H } from './figur.js';
import { glContext, createStage } from './gl.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const smooth = (a, b, v) => { const t = clamp((v - a) / (b - a)); return t * t * (3 - 2 * t); };
const lerp = (a, b, t) => a + (b - a) * t;
const easeIO = (t) => t * t * (3 - 2 * t);
const html = document.documentElement;
const finePointer = matchMedia('(pointer: fine)').matches;

// ---------- Bewegung: „reduzieren“ (System) und „anhalten“ (Knopf, gemerkt als hop-motion wie auf allen Labor-Seiten) ----------
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
let paused = false;
try { paused = localStorage.getItem('hop-motion') === 'paused'; } catch (e) { /* ohne Speicher */ }
const motionBtn = $('#motionBtn');
const still = () => reduced || paused; // keine Fahrt (Figur bleibt ganz), Texte ohne Blenden
function setPaused(v, save = true) {
  paused = v;
  html.classList.toggle('paused', v); html.classList.toggle('still', still());
  motionBtn.setAttribute('aria-pressed', v ? 'true' : 'false');
  motionBtn.setAttribute('aria-label', v ? 'Bewegung fortsetzen' : 'Bewegung anhalten');
  motionBtn.title = v ? 'Bewegung fortsetzen' : 'Bewegung anhalten';
  if (save) try { localStorage.setItem('hop-motion', v ? 'paused' : 'on'); } catch (e) { /* ohne Speicher */ }
  dirty = true;
}
let dirty = true;
motionBtn.addEventListener('click', () => setPaused(!paused));
setPaused(paused, false);
if (paused) {
  const n = document.createElement('div'); n.className = 'paused-note'; n.setAttribute('role', 'status');
  n.innerHTML = '<span>Bewegung ist angehalten.</span><button type="button">Fortsetzen</button>';
  document.body.appendChild(n);
  const hide = () => n.classList.add('gone');
  n.querySelector('button').addEventListener('click', () => { setPaused(false); hide(); });
  setTimeout(hide, 9000);
}

// ---------- Elemente ----------
const track = $('#kf'), stage = $('#kfStage'), canvas = $('#kfGl'), svg = $('#kfSvg');
const shade = $('.kf-shade'), bodyG = $('#kfBodyG'), heroEl = $('#kfHero'), endEl = $('#kfEnd'), wire = $('#kfWire'), hand = $('#kfHand');
const lineEls = [0, 1, 2].map((i) => [$(`#kfL${i}`), $(`#kfL${i}g`)]);
const arts = $$('.kf-st'), dos = arts.map((a) => $('.kf-do', a)), spots = $$('.kf-spot'), progBtns = $$('#kfProg button');
const NS = 'http://www.w3.org/2000/svg';
const mk = (tag, cls, parent) => { const e = document.createElementNS(NS, tag); if (cls) e.setAttribute('class', cls); parent.appendChild(e); return e; };
$('#kfShape').innerHTML = BODY_SVG;
const dotPat = $('#kfDots'), dotC = $('circle', dotPat); let dotK = 0;
const rings = STATIONS.map(() => { const g = $('#kfRings'); const halo = mk('circle', 'kf-ring-halo', g), ring = mk('circle', 'kf-ring', g); ring.setAttribute('pathLength', '1'); return { ring, halo }; });
const tips = [0, 1].map(() => { const g = mk('g', '', $('#kfTips')); const glow = mk('circle', 'kf-tip-glow', g), halo = mk('circle', 'kf-tip-halo', g), dot = mk('circle', 'kf-tip', g); glow.setAttribute('r', 9); halo.setAttribute('r', 6); dot.setAttribute('r', 3.25); return g; });
// ohne WebGL: Spannung als Leuchten (Bernstein) bzw. gelöst (Grün) über dem Punkt-Umriss
const glows = STATIONS.map((S) => S.spots.map((sp) => {
  const g = $('#kfGlow');
  const hot = mk('ellipse', '', g), cool = mk('ellipse', '', g);
  [hot, cool].forEach((e) => { e.setAttribute('cx', sp[0]); e.setAttribute('cy', sp[1]); e.setAttribute('rx', sp[2] * 1.45); e.setAttribute('ry', sp[3] * 1.45); });
  hot.setAttribute('fill', 'url(#kfHot)'); cool.setAttribute('fill', 'url(#kfCool)');
  return { hot, cool };
}));
const HINT = finePointer ? 'Fahren Sie mit der Maus über die Stelle – oder scrollen Sie einfach weiter.' : 'Tippen oder streichen Sie über die Stelle – oder scrollen Sie einfach weiter.';
dos.forEach((d) => { d.textContent = HINT; });

// ---------- Fahrplan: [u, Spitze der Lichtlinie (y), Blick] – Blick 'A' = ganze Figur (Start), 'E' = ganze Figur (Schluss), 0…3 = Station ----------
const KEYS = [
  [0.06, CROWN, 'A'],
  [1.0, STATIONS[0].tip, 0], [1.75, STATIONS[0].tip, 0],
  [2.5, STATIONS[1].tip, 1], [3.25, STATIONS[1].tip, 1],
  [4.2, STATIONS[2].tip, 2], [4.95, STATIONS[2].tip, 2],
  [5.85, STATIONS[3].tip, 3], [6.6, STATIONS[3].tip, 3],
  [7.35, SOLE, 'E'],
];
const U_LEN = parseFloat(getComputedStyle(html).getPropertyValue('--len')) - 1 || 8.2; // = 8,2 (Schluss hält ~0,85)
const ARR = STATIONS.map((_, i) => KEYS[1 + 2 * i][0]), LEAVE = STATIONS.map((_, i) => KEYS[2 + 2 * i][0]);
const stOn = (i, u) => u > ARR[i] - 0.3 && u < LEAVE[i] + 0.12;

// ---------- Maße und Blicke ----------
let W = 0, H = 0, desk = true, dpr = 1, V = {};
const relTop = (el) => el.getBoundingClientRect().top - stage.getBoundingClientRect().top; // ohne Verschiebung durch Einblenden
function layout() {
  W = stage.clientWidth; H = stage.clientHeight; desk = W > 920;
  const topH = desk ? 84 : 70, figH = SOLE - CROWN;
  const full = (bottom, top = topH) => {
    const s = Math.min((bottom - top) / figH, (desk ? W * 0.34 : W * 0.86) / BODY_W);
    const ax = desk ? W * 0.23 : W / 2;
    const ay = top + ((bottom - top) - figH * s) / 2 + (BODY_H / 2 - CROWN) * s;
    return { fx: 0, fy: 0, s, ax, ay, z: 1 };
  };
  // Handy: die Figur endet über dem jeweiligen Textblock (Start bzw. Schluss); ohne Fahrt über dem höchsten Stationstext
  const artTop = arts.reduce((m, a) => Math.min(m, a.offsetTop), H);
  const heroTop = heroEl.offsetTop, endTop = endEl.offsetTop;
  V.A = desk ? full(H * 0.93) : full(heroTop - 18);
  V.E = desk ? V.A : full(endTop - 18);
  V.S = desk ? V.A : full(Math.min(heroTop, endTop, artTop) - 22);
  const sRef = desk ? V.A.s : (H * 0.5) / figH; // Handy: Zoom unabhängig von der Texthöhe
  STATIONS.forEach((S, i) => {
    const z = S.zoom[desk ? 1 : 0];
    V[i] = { fx: S.c[0] - BODY_W / 2, fy: BODY_H / 2 - S.c[1], s: sRef * z, ax: desk ? W * 0.23 : W / 2, ay: desk ? H * 0.5 : H * 0.34, z };
  });
  dpr = Math.min(devicePixelRatio || 1, 2);
  if (gl) {
    const cw = Math.round(W * dpr), ch = Math.round(H * dpr);
    if (canvas.width !== cw || canvas.height !== ch) { canvas.width = cw; canvas.height = ch; }
  }
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  dirty = true;
}
const mixView = (a, b, t, dip = 0) => {
  const s = Math.exp(lerp(Math.log(a.s), Math.log(b.s), t)) * (1 - dip * Math.sin(Math.PI * t));
  return { fx: lerp(a.fx, b.fx, t), fy: lerp(a.fy, b.fy, t), s, ax: lerp(a.ax, b.ax, t), ay: lerp(a.ay, b.ay, t) };
};
function plan(u) {
  if (still()) { // keine Fahrt: Figur bleibt ganz, nur die Linie wächst mit dem Scrollen
    const k = KEYS.findIndex((x) => x[0] > u);
    let tip = SOLE;
    if (k === 0) tip = CROWN; else if (k > 0) { const a = KEYS[k - 1], b = KEYS[k]; tip = lerp(a[1], b[1], clamp((u - a[0]) / (b[0] - a[0]))); }
    return { tip, view: u < 0.5 ? V.A : u > KEYS[KEYS.length - 1][0] - 0.2 ? V.E : V.S };
  }
  if (u <= KEYS[0][0]) return { tip: KEYS[0][1], view: V[KEYS[0][2]] };
  for (let k = 0; k < KEYS.length - 1; k++) {
    const a = KEYS[k], b = KEYS[k + 1];
    if (u > b[0]) continue;
    const e = easeIO((u - a[0]) / (b[0] - a[0]));
    const travel = typeof a[2] === 'number' && typeof b[2] === 'number' && a[2] !== b[2];
    return { tip: lerp(a[1], b[1], e), view: mixView(V[a[2]], V[b[2]], e, travel ? 0.14 : 0) };
  }
  const L = KEYS[KEYS.length - 1];
  return { tip: L[1], view: V[L[2]] };
}

// ---------- Partikel ----------
// Zeichenfläche „Entspannung“ (wie Puls: 100 × 215 für den Grundriss 200 × 430, weiß = gelöst)
const RW = 100, RH = 215;
const relaxCv = document.createElement('canvas'); relaxCv.width = RW; relaxCv.height = RH;
const rctx = relaxCv.getContext('2d', { willReadFrequently: true });
rctx.fillStyle = '#000'; rctx.fillRect(0, 0, RW, RH);
let relaxDirty = true;
let measureDirty = false;
let gl = glContext(canvas), st = null, pts = null;
if (gl) try {
  pts = figurePoints(innerWidth > 920 ? Math.round(110000 * clamp(innerWidth * innerHeight / (1440 * 900), 1, 1.8)) : 56000); // große Monitore: mehr Punkte statt größerer
  st = createStage(gl, pts, relaxCv);
} catch (e) { console.error(e); gl = null; st = null; }
if (!pts) pts = figurePoints(12000); // ohne WebGL nur zum Messen
if (!gl) html.classList.add('no-gl');


// Messpunkte je Station: die Partikel selbst (nur was im Körper liegt zählt), Gewicht = ihre Spannung; je Texel zusammengefasst
const SAMPLES = STATIONS.map((_, si) => {
  const m = new Map();
  for (let i = 0; i < pts.st.length; i++) {
    if (pts.st[i] !== si || pts.heat[i] < 0.08) continue;
    const x = clamp(Math.floor((pts.pos[i * 3] + BODY_W / 2) / 2), 0, RW - 1), y = clamp(Math.floor((BODY_H / 2 - pts.pos[i * 3 + 1]) / 2), 0, RH - 1);
    const o = (y * RW + x) * 4; m.set(o, (m.get(o) || 0) + pts.heat[i]);
  }
  return [...m];
});

// ---------- Zustand ----------
const S = {
  u: 0, us: 0, tip: CROWN, view: null, time: 0, breath: 0, calm: 0, intro: still() ? 1 : 0,
  act: [0, 0, 0, 0], auto: [0, 0, 0, 0], sol: [0, 0, 0, 0], done: [false, false, false, false], rest: [1, 1, 1, 1], ok: [false, false, false, false],
};
const relV = new Float32Array(4), actV = new Float32Array(4);

// Spannung je Station messen (Rest 0…1); ≤ 0,08 = gelöst (Puls 16.11.: „Rest ≤ 8“). Weiß ab ~215 von 255 gilt als gelöst:
// die 8-Bit-Fläche nähert sich 255 nur langsam, und im Shader ist die Stelle dort schon sichtbar ruhig.
function measure() {
  const d = rctx.getImageData(0, 0, RW, RH).data;
  SAMPLES.forEach((list, i) => {
    let s = 0, w = 0;
    list.forEach(([o, k]) => { s += k * Math.max(0, 1 - d[o] / 215); w += k; });
    S.rest[i] = w ? s / w : 0;
    if (S.rest[i] <= 0.08) solve(i);
  });
}
function solve(i) {
  if (S.done[i]) return;
  S.done[i] = true;
  const t0 = performance.now(), dur = still() ? 0 : 1100;
  const step = () => { S.sol[i] = dur ? easeIO(clamp((performance.now() - t0) / dur)) : 1; dirty = true; if (S.sol[i] < 1) requestAnimationFrame(step); };
  step();
  dos[i].textContent = 'Gelöst.'; dos[i].classList.add('ok');
}

// Pinsel: Bildschirm → Grundriss → Zeichenfläche (Radius in Bildpunkten, damit es sich bei jedem Zoom gleich anfühlt)
let lastPaint = null;
const toBody = (x, y, v) => [BODY_W / 2 + ((x - v.ax) / v.s + v.fx), BODY_H / 2 - ((v.ay - y) / v.s + v.fy)];
function paint(x, y, rPx, alpha) {
  const v = S.view; if (!v) return;
  const [bx, by] = toBody(x, y, v);
  const px = bx / 2, py = by / 2, r = Math.max(2.5, rPx / v.s / 2);
  const steps = lastPaint ? Math.ceil(Math.hypot(px - lastPaint[0], py - lastPaint[1]) / Math.max(1, r * 0.35)) : 1;
  for (let s = 1; s <= Math.min(steps, 60); s++) {
    const cx = lastPaint ? lerp(lastPaint[0], px, s / steps) : px, cy = lastPaint ? lerp(lastPaint[1], py, s / steps) : py;
    const g = rctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    g.addColorStop(0, `rgba(255,255,255,${alpha})`); g.addColorStop(1, 'rgba(255,255,255,0)');
    rctx.fillStyle = g; rctx.fillRect(cx - r, cy - r, r * 2, r * 2);
  }
  lastPaint = [px, py];
  relaxDirty = true; measureDirty = true; dirty = true;
}
// Ring unter dem Zeiger (nur aktive, noch nicht gelöste Station)
const ringAt = (x, y) => STATIONS.findIndex((St, i) => stOn(i, S.us) && !S.ok[i] && Math.hypot(x - ringPx[i][0], y - ringPx[i][1]) < ringPx[i][2] * 1.1);
const ringPx = STATIONS.map(() => [0, 0, 0]);
const local = (e) => { const r = stage.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
// Maus: Überfahren löst (wie Puls), Hand-Kreis „lösen“ nur über der Stelle
stage.addEventListener('pointermove', (e) => {
  if (e.pointerType !== 'mouse') return;
  const [x, y] = local(e), i = ringAt(x, y);
  hand.classList.toggle('on', i >= 0 && finePointer);
  if (i < 0) { lastPaint = null; return; }
  hand.style.transform = `translate(${x}px,${y}px)`;
  paint(x, y, 42, 0.3);
});
stage.addEventListener('pointerleave', () => { hand.classList.remove('on'); lastPaint = null; });
// Finger: nur, wenn der Strich auf der markierten Stelle beginnt – senkrechtes Wischen scrollt trotzdem weiter
let fingerOn = -1;
spots.forEach((b, i) => b.addEventListener('touchstart', () => { fingerOn = i; lastPaint = null; }, { passive: true }));
addEventListener('touchmove', (e) => { if (fingerOn < 0 || !e.touches.length) return; const [x, y] = local(e.touches[0]); paint(x, y, 54, 0.42); }, { passive: true });
addEventListener('touchend', () => { fingerOn = -1; lastPaint = null; }, { passive: true });
addEventListener('touchcancel', () => { fingerOn = -1; lastPaint = null; }, { passive: true });
// Tippen / Klicken / Taste: eine Welle der Entspannung breitet sich ab der Tippstelle aus und löst die Stelle
const ripples = [];
spots.forEach((b, i) => b.addEventListener('click', (e) => {
  if (S.done[i]) return;
  const [x, y] = e.detail && (e.clientX || e.clientY) ? local(e) : [ringPx[i][0], ringPx[i][1]];
  const [bx, by] = toBody(x, y, S.view);
  ripples.push({ i, x: bx / 2, y: by / 2, t0: performance.now() });
}));
function rippleTick(now) {
  for (let k = ripples.length - 1; k >= 0; k--) {
    const r = ripples[k], St = STATIONS[r.i], t = clamp((now - r.t0) / (still() ? 1 : 850));
    const R = (St.r * 1.15 / 2) * (1 - (1 - t) * (1 - t));
    const g = rctx.createRadialGradient(r.x, r.y, R * 0.55, r.x, r.y, Math.max(1, R));
    g.addColorStop(0, 'rgba(255,255,255,.5)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    rctx.fillStyle = g; rctx.beginPath(); rctx.arc(r.x, r.y, Math.max(1, R), 0, Math.PI * 2); rctx.fill();
    rctx.fillStyle = 'rgba(255,255,255,.5)'; rctx.beginPath(); rctx.arc(r.x, r.y, R * 0.55, 0, Math.PI * 2); rctx.fill();
    relaxDirty = true; measureDirty = true; dirty = true;
    if (t >= 1) { ripples.splice(k, 1); solve(r.i); }
  }
}
setInterval(() => { if (measureDirty) { measureDirty = false; measure(); } }, 250);

// Fortschritt: Strich anklicken → zur Station
const trackTop = () => track.getBoundingClientRect().top + scrollY;
progBtns.forEach((b, i) => b.addEventListener('click', () => scrollTo({ top: trackTop() + (ARR[i] + LEAVE[i]) / 2 * H, behavior: still() ? 'auto' : 'smooth' })));

// ---------- Einflug ----------
if (!still()) { const t0 = performance.now() + 120; const f = () => { S.intro = 1 - Math.pow(2, -10 * clamp((performance.now() - t0) / 2800)); dirty = true; if (S.intro < 0.999) requestAnimationFrame(f); else S.intro = 1; }; requestAnimationFrame(f); }

// ---------- Bild für Bild ----------
let lastT = performance.now(), lastTipKey = '', lastOn = '';
const fmt = (n) => n.toFixed(2);
function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min(0.1, (now - lastT) / 1000); lastT = now;
  const r = track.getBoundingClientRect();
  if (r.bottom < -50 || r.top > innerHeight + 50) return; // Bühne nicht im Bild: ruht
  S.u = clamp(-r.top / H, 0, U_LEN);
  const sl = still();
  const prevUs = S.us;
  S.us = sl ? S.u : S.us + (S.u - S.us) * (1 - Math.exp(-dt * 4.2));
  if (Math.abs(S.us - S.u) < 1e-4) S.us = S.u;
  const u = S.us;
  if (!paused) { S.time += dt * (reduced ? 0.45 : 1); S.breath += dt * (reduced ? 0.45 : 1) * (1.15 - S.calm * 0.45); }
  S.calm += (smooth(6.75, 7.35, u) - S.calm) * Math.min(1, dt * 0.8);
  rippleTick(now);
  const P = plan(u); S.tip = P.tip; S.view = P.view;
  const v = P.view;
  // Stationen: aktiv, von der Linie gelöst, Zustand
  let cur = -1;
  STATIONS.forEach((St, i) => {
    const on = stOn(i, u);
    if (on) cur = i;
    S.act[i] += ((on ? 1 : 0) - S.act[i]) * (sl ? 1 : Math.min(1, dt * 3));
    S.auto[i] = smooth(St.tip + 3, St.tip + Math.min(St.r * 0.9, SOLE - St.tip - 1), S.tip);
    relV[i] = Math.max(S.auto[i], S.sol[i]); actV[i] = S.act[i];
    S.ok[i] = S.done[i] || S.auto[i] > 0.5;
  });
  // Wiegen + Atem (wie Puls), gleiche Werte für Partikel und SVG
  const sway = sl ? 0 : Math.sin(S.time * 0.25) * 0.12;
  const br = Math.sin(S.breath) * (1 + S.calm * 1.3), kx = 1 + br * 0.007, ky = 1 + br * 0.004, cx = kx * Math.cos(sway);
  const M = [v.s * cx, v.s * ky, v.ax - (BODY_W / 2 * cx + v.fx) * v.s, v.ay - (BODY_H / 2 * ky - v.fy) * v.s]; // Grundriss → Bildschirm
  const toS = (bx, by) => [M[0] * bx + M[2], M[1] * by + M[3]];
  // Partikel
  if (st && (dirty || !paused || Math.abs(S.us - prevUs) > 1e-5)) {
    if (relaxDirty) { st.upload(); }
    st.draw({ W, H, ax: v.ax, ay: v.ay, fx: v.fx, fy: v.fy, s: v.s, sway, time: S.time, breath: S.breath, calm: S.calm, intro: S.intro, pt: (desk ? 1.45 * clamp(Math.sqrt(H / 900), 1, 1.3) : 1.4) * dpr, zoom: v.s / V.A.s, alpha: 1, rel: relV, act: actV });
  }
  relaxDirty = false;
  dirty = false;
  // SVG: Körpergruppe (Umriss ohne WebGL + Lichtlinie) mit derselben Abbildung
  bodyG.setAttribute('transform', `matrix(${M[0]} 0 0 ${M[1]} ${M[2]} ${M[3]})`);
  if (!gl) { // Punktraster ohne WebGL: gleicher Abstand auf dem Bildschirm bei jedem Zoom (sonst wachsen die Punkte mit)
    const k = Math.round(V.A.s / v.s * 100) / 100;
    if (k !== dotK) { dotK = k; const w = 2.6 * k; dotPat.setAttribute('width', w); dotPat.setAttribute('height', w); dotC.setAttribute('cx', w / 2); dotC.setAttribute('cy', w / 2); dotC.setAttribute('r', 0.55 * k); }
  }
  const tipKey = S.tip.toFixed(2);
  const tipPts = [];
  if (tipKey !== lastTipKey) {
    lastTipKey = tipKey;
    const a = lineTo(LINES[0], Math.min(S.tip, SPLIT));
    lineEls[0].forEach((e) => e.setAttribute('d', a ? a.d : ''));
    [1, 2].forEach((k) => { const l = S.tip > SPLIT ? lineTo(LINES[k], S.tip) : null; lineEls[k].forEach((e) => e.setAttribute('d', l ? l.d : '')); });
  }
  if (S.tip > SPLIT) [1, 2].forEach((k) => { const l = lineTo(LINES[k], S.tip); if (l) tipPts.push(l.tip); });
  else { const l = lineTo(LINES[0], S.tip); tipPts.push(l ? l.tip : LINES[0][0]); }
  const full = S.tip >= SOLE - 0.3;
  tips.forEach((g, k) => {
    const p = tipPts[k];
    if (!p || full) { g.setAttribute('visibility', 'hidden'); return; }
    const [x, y] = toS(p[0], p[1]);
    g.setAttribute('visibility', 'visible'); g.setAttribute('transform', `translate(${fmt(x)} ${fmt(y)})`);
  });
  // Ringe, Stellen, Fortschritt
  const onKey = [];
  STATIONS.forEach((St, i) => {
    const [x, y] = toS(St.c[0], St.c[1]), rr = St.r * v.s;
    ringPx[i][0] = x; ringPx[i][1] = y; ringPx[i][2] = rr;
    const on = stOn(i, u);
    const { ring, halo } = rings[i];
    [ring, halo].forEach((e) => { e.setAttribute('cx', fmt(x)); e.setAttribute('cy', fmt(y)); e.setAttribute('r', fmt(rr)); });
    ring.setAttribute('transform', `rotate(-90 ${fmt(x)} ${fmt(y)})`);
    onKey.push(`${on ? 1 : 0}${S.ok[i] ? 1 : 0}`);
    const b = spots[i], d = Math.max(44, rr * 2);
    b.style.transform = `translate(${fmt(x - d / 2)}px,${fmt(y - d / 2)}px)`; b.style.width = b.style.height = `${fmt(d)}px`;
    if (!gl) glows[i].forEach((g) => { const rel = Math.max(relV[i], 1 - S.rest[i]); g.hot.setAttribute('opacity', fmt((1 - rel) * (0.45 + 0.55 * S.act[i]))); g.cool.setAttribute('opacity', fmt(rel * 0.9)); });
  });
  const key = onKey.join('') + cur;
  if (key !== lastOn) {
    lastOn = key;
    STATIONS.forEach((St, i) => {
      const on = stOn(i, u);
      rings[i].ring.classList.toggle('on', on); rings[i].halo.classList.toggle('on', on);
      rings[i].ring.classList.toggle('ok', S.ok[i]); rings[i].halo.classList.toggle('ok', S.ok[i]);
      arts[i].classList.toggle('on', on);
      spots[i].classList.toggle('on', on && !S.done[i]); spots[i].tabIndex = on && !S.done[i] ? 0 : -1;
      progBtns[i].classList.toggle('on', i === cur); progBtns[i].classList.toggle('ok', S.ok[i]);
      if (on) progBtns[i].setAttribute('aria-current', 'step'); else progBtns[i].removeAttribute('aria-current');
    });
    wire.classList.toggle('ok', cur >= 0 && S.ok[cur]);
  }
  // Verbindungslinie (PC): vom Ring zur Eck-Klammer des Textes
  if (desk && cur >= 0) {
    const k = $('.kicker', arts[cur]).getBoundingClientRect(), sr = stage.getBoundingClientRect();
    const tx = k.left - sr.left - 30, ty = k.top - sr.top + k.height / 2;
    const [x, y, rr] = ringPx[cur], dx = tx - x, dy = ty - y, dl = Math.hypot(dx, dy) || 1;
    const sx = x + dx / dl * (rr + 6), sy = y + dy / dl * (rr + 6);
    const vis = dl > rr + 40 ? smooth(ARR[cur] - 0.15, ARR[cur] + 0.05, u) * (1 - smooth(LEAVE[cur] - 0.05, LEAVE[cur] + 0.1, u)) : 0;
    wire.setAttribute('x1', fmt(sx)); wire.setAttribute('y1', fmt(sy)); wire.setAttribute('x2', fmt(tx)); wire.setAttribute('y2', fmt(ty));
    wire.setAttribute('opacity', fmt(sl ? (vis > 0.5 ? 1 : 0) : vis));
  } else wire.setAttribute('opacity', '0');
  // Verlauf hinter dem Text (Handy): nur während der Stationen – Start und Schluss zeigen die ganze Figur über dem Text
  shade.classList.toggle('on', !sl && u > ARR[0] - 0.55 && u < LEAVE[3] + 0.35);
  // Start- und Schlusstext
  const heroA = sl ? (u < 0.2 ? 1 : 0) : 1 - smooth(0.04, 0.32, u);
  heroEl.style.opacity = fmt(heroA); heroEl.style.visibility = heroA < 0.01 ? 'hidden' : '';
  endEl.classList.toggle('on', u > KEYS[KEYS.length - 1][0] - 0.3);
}

function onResize() { layout(); lastTipKey = ''; lastOn = ''; }
addEventListener('resize', onResize);
if ('ResizeObserver' in window) new ResizeObserver(onResize).observe(stage);
layout();
requestAnimationFrame(frame);

window.__kf = {
  state: () => ({ u: +S.u.toFixed(3), us: +S.us.toFixed(3), tip: +S.tip.toFixed(1), act: S.act.map((x) => +x.toFixed(2)), auto: S.auto.map((x) => +x.toFixed(2)), sol: S.sol.map((x) => +x.toFixed(2)), rest: S.rest.map((x) => +x.toFixed(2)), done: S.done.slice(), gl: !!st, still: still(), view: S.view && { s: +S.view.s.toFixed(2), ax: Math.round(S.view.ax), ay: Math.round(S.view.ay) } }),
  go: (u) => scrollTo({ top: trackTop() + u * H, behavior: 'auto' }),
  ring: (i) => ringPx[i].map((x) => Math.round(x)),
  relax: () => relaxCv.toDataURL(), // Zeichenfläche „Entspannung“ als Bild (Prüfen)
};
