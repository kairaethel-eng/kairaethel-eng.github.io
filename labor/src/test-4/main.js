// Testseite 4 · „Puls · Scan“ – wie „Puls + Achse“, die Wirbelsäule bleibt aber im Partikel-Stil:
// eine Abtastlinie verdichtet die groben Partikel zu einer beleuchteten Punktwolke, dann Kamerafahrt.
// 0 Körper → 1 Bewegung → 2 Wirbelsäule (Scan) → 3 Dach → 4 HOP-Kreise
import * as THREE from 'three';
import gsap from 'gsap';
import Lenis from 'lenis';
import { bodyPoints, spinePointsGen, housePoints, logoPoints, spineStippleGen, ZONES, CURVE_W, BODY_W, BODY_H, BODY_SCALE, HOTSPOTS } from './shapes.js';
import { praxisScanGen, ROOMS, EYE, P } from './praxis.js';
import { initAGen as initManuGen, MODES as MANU_MODES } from '../manu/ideaA.js';
import { glContext } from '../manu/common.js';
import { initServicesGen } from './services.js';
import { runSliced } from '../shared/slice.js';

// „Bewegung reduzieren“: sanfter Ruhemodus – die Seite lebt langsam weiter (Atmen, Treiben, Signale),
// aber ohne Kamerafahrten, Streu-Effekte, Nachgleiten beim Scrollen und springende Buchstaben.
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const CALM = reduced ? 0.45 : 1; // Tempo der Eigenbewegung
// Knopf „Bewegung anhalten“: friert alle Eigenbewegung ein (Scrollen bleibt möglich); Wahl wird im Browser gemerkt
let paused = false;
try { paused = localStorage.getItem('hop-motion') === 'paused'; } catch (e) { /* ohne Speicher */ }
function setPaused(v, save = true) {
  paused = v;
  document.documentElement.classList.toggle('paused', v);
  const b = document.getElementById('motionBtn');
  if (b) { b.setAttribute('aria-pressed', String(v)); const l = v ? 'Bewegung fortsetzen' : 'Bewegung anhalten'; b.setAttribute('aria-label', l); b.title = l; }
  if (save) try { localStorage.setItem('hop-motion', v ? 'paused' : 'on'); } catch (e) { /* ohne Speicher */ }
}
document.getElementById('motionBtn')?.addEventListener('click', () => setPaused(!paused));
setPaused(paused, false); // beim Laden nichts speichern – gespeichert wird nur nach einem Klick

// Hinweis, wenn die Bewegung von einem früheren Besuch her angehalten ist (Wahl gilt seitenübergreifend)
if (paused) {
  const n = document.createElement('div'); n.className = 'paused-note'; n.setAttribute('role', 'status');
  n.innerHTML = '<span>Bewegung ist angehalten.</span><button type="button">Fortsetzen</button>';
  document.body.appendChild(n);
  const hide = () => n.classList.add('gone');
  n.querySelector('button').addEventListener('click', () => { setPaused(false); hide(); });
  setTimeout(hide, 9000);
}
const finePointer = matchMedia('(pointer: fine)').matches;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const smooth = (a, b, v) => { const t = clamp((v - a) / (b - a)); return t * t * (3 - 2 * t); };
// Fenstergröße beim Start ohne erzwungenes Layout (A1): innerWidth/innerHeight ließen den Browser die ganze Seite
// mitten im Start-Skript setzen. Media-Queries kennen die Größe ohne Layout; danach hält „resize“ die Werte aktuell.
const mqSize = (dim) => { let lo = 0, hi = 16384; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (matchMedia(`(min-${dim}: ${m}px)`).matches) lo = m; else hi = m; } return lo; };
let VW = mqSize('width'), VH = mqSize('height');
addEventListener('resize', () => { VW = innerWidth; VH = innerHeight; });
const isDesktop = () => VW > 920;

// ---------- Scrollen ----------
let lenis = null;
if (!reduced) {
  // ruhiges Scrollen: Mausrad langsamer, weiches Nachgleiten (Scrollbalken bleibt direkt).
  // Erst nach dem ersten Bild anlegen: Lenis misst die Seite, das erzwänge sonst ein zweites Layout im Start-Task (A1).
  requestAnimationFrame(() => setTimeout(() => {
    lenis = new Lenis({ lerp: 0.055, smoothWheel: true, wheelMultiplier: 0.6 });
    gsap.ticker.add((t) => lenis.raf(t * 1000));
  }, 0));
  gsap.ticker.lagSmoothing(0);
}
const scrollToY = (y) => (lenis ? lenis.scrollTo(y, { duration: 1.8 }) : scrollTo({ top: y }));
$$('a[href^="#"]').forEach((a) => a.addEventListener('click', (e) => {
  const t = $(a.getAttribute('href')); if (!t) return;
  e.preventDefault(); scrollToY(t.getBoundingClientRect().top + scrollY);
}));

// ---------- Renderer ----------
const canvas = $('#gl');
let renderer = null;
const glCtx = glContext(canvas);
if (glCtx) try { renderer = new THREE.WebGLRenderer({ canvas, context: glCtx, antialias: false, alpha: false, powerPreference: 'high-performance' }); } catch (e) { /* ohne WebGL bleibt die Seite lesbar */ }
// Ohne WebGL (oder wenn eine Bühne scheitert): Standbilder statt Partikel, Hinweise weg (A2, CSS html.no-gl)
const noGl = () => document.documentElement.classList.add('no-gl');
if (!renderer) noGl();
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(35, VW / VH, 0.1, 100);
camera.position.set(0, 0, 13);
if (renderer) {
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, isDesktop() ? 1.6 : 1.4));
  renderer.setClearColor(0x0A161B, 1);
}

// ---------- Partikel ----------
const N = isDesktop() ? 64000 : 26000;
const body = bodyPoints(N), house = housePoints(N), logo = logoPoints(N);
const geo = new THREE.BufferGeometry();
geo.setAttribute('position', new THREE.BufferAttribute(body.pos, 3));
geo.setAttribute('aHeat', new THREE.BufferAttribute(body.heat, 1));
// Startzeit (A1, Go 4.11.2026): der Hero braucht nur die Körper-Wolke. Das Morph-Ziel Wirbelsäule wird nach dem
// ersten Bild in Zeitscheiben gerechnet (bis dahin hält die Wolke die Körperform), die Detailbühnen je Kapitel.
geo.setAttribute('pos2', new THREE.BufferAttribute(body.pos.slice(), 3));
if (renderer) runSliced(spinePointsGen(N)).then((sp) => { geo.attributes.pos2.array.set(sp.pos); geo.attributes.pos2.needsUpdate = true; });
// Kapitel erst bauen, wenn es in Reichweite kommt (anderthalb Bildschirme vorher)
const whenNear = (el, fn) => {
  if (!el || !renderer) return; // ohne WebGL nichts rechnen
  const io = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) { io.disconnect(); fn(); } }, { rootMargin: '150% 0px' });
  io.observe(el);
};
// sanftes Einblenden fertiger Bühnen (0 → 1 in ~0,9 s)
const ramp = (k, dt) => Math.min(1, k + dt / 0.9);
geo.setAttribute('pos3', new THREE.BufferAttribute(house.pos, 3));
geo.setAttribute('kind3', new THREE.BufferAttribute(house.kind, 1));
geo.setAttribute('pos4', new THREE.BufferAttribute(logo.pos, 3));
geo.setAttribute('kind4', new THREE.BufferAttribute(logo.kind, 1));
const rnd = new Float32Array(N * 4);
for (let i = 0; i < rnd.length; i++) rnd[i] = Math.random();
geo.setAttribute('aRand', new THREE.BufferAttribute(rnd, 4));

// Entspannungs-Karte: hier „streicht“ die Hand die Spannung weg
const RW = 100, RH = 215;
const relaxCv = document.createElement('canvas'); relaxCv.width = RW; relaxCv.height = RH;
const rctx = relaxCv.getContext('2d', { willReadFrequently: true });
rctx.fillStyle = '#000'; rctx.fillRect(0, 0, RW, RH);
const relaxTex = new THREE.CanvasTexture(relaxCv);
relaxTex.minFilter = relaxTex.magFilter = THREE.LinearFilter;

const C = (h) => new THREE.Color(h);
const uniforms = {
  uTime: { value: 0 }, uMorph: { value: 0 }, uPix: { value: 1 }, uSize: { value: 1 }, uAlpha: { value: 1 },
  uRelax: { value: relaxTex }, uBodyWH: { value: new THREE.Vector2(BODY_W * BODY_SCALE, BODY_H * BODY_SCALE) },
  uXf: { value: [0, 1, 2, 3, 4].map(() => new THREE.Vector4(0, 0, 0, 1)) },
  uSpineRot: { value: -0.9 }, uCut: { value: 100 }, uHouseRot: { value: -0.55 }, uRoofLift: { value: 0 },
  uBreath: { value: 0 }, uCalm: { value: 0 }, // Atem-Phase, „Entspannt“ (0..1)
  uHouse: { value: 0 }, uIntro: { value: reduced ? 1 : 0 }, uSpread: { value: 1 }, uFadeMid: { value: 0.5 },
  cPetrol: { value: C('#4E7F93') }, cBone: { value: C('#D9DCD3') }, cAmber: { value: C('#E59A2F') },
  cBlue: { value: C('#5AA2D6') }, cGreen: { value: C('#8BC34A') }, cLogoP: { value: C('#2C6478') }, cGrey: { value: C('#8C979B') },
};

const vert = /* glsl */`
  attribute float aHeat; attribute vec3 pos2; attribute vec3 pos3; attribute float kind3; attribute vec3 pos4; attribute float kind4; attribute vec4 aRand;
  uniform float uSpread, uFadeMid;
  uniform float uBreath, uCalm;
  uniform float uTime, uMorph, uPix, uSize, uHouse, uIntro, uSpineRot, uCut, uHouseRot, uRoofLift;
  uniform sampler2D uRelax; uniform vec2 uBodyWH; uniform vec4 uXf[5];
  uniform vec3 cPetrol, cBone, cAmber, cBlue, cGreen, cLogoP, cGrey;
  varying vec3 vCol; varying float vA;

  vec3 rotY(vec3 p, float a){ float c=cos(a), s=sin(a); return vec3(c*p.x+s*p.z, p.y, -s*p.x+c*p.z); }
  vec3 jitter(float amp, float sp){
    return vec3(sin(uTime*sp*1.3+aRand.x*40.), sin(uTime*sp*1.7+aRand.y*40.), sin(uTime*sp*1.1+aRand.z*40.))*amp;
  }

  // jede Form liefert Position (xyz) und Farbe; w = Größenfaktor
  void shape(int i, out vec3 p, out vec3 col, out float sz, out float al){
    sz = 1.; al = 1.;
    if(i==0){
      vec2 uv = position.xy / uBodyWH + .5;
      float relax = texture2D(uRelax, vec2(uv.x, 1.-uv.y)).r;
      float tension = aHeat * (1. - relax);
      float breath = sin(uBreath) * (1. + uCalm*1.3); // entspannt: ruhiger, tiefer Atem
      p = position * vec3(1. + breath*.007, 1. + breath*.004, 1.) + jitter(.012*(1. - uCalm*.6) + tension*.11, 6. + tension*10.);
      p = rotY(p, sin(uTime*.25)*.32);
      vec3 base = mix(cPetrol, cBone, .25 + aRand.y*.35);
      float throb = .7 + .3*sin(uTime*3.4 + aRand.x*.8);
      col = mix(base, cAmber, smoothstep(.08, .7, tension) * throb);
      col = mix(col, mix(cBlue, cGreen, aRand.x), relax * aHeat * .85);
      sz = 1. + tension*.9*throb;
    } else if(i==1){
      float lane = floor(aRand.x*11.);
      float x = mod(aRand.z*18. + uTime*(.35+aRand.y*.3), 18.) - 9.;
      float y = (lane-5.)*.55 + sin(x*.5 + lane*1.7 + uTime*.7)*.45 + (aRand.w-.5)*.1;
      float z = (aRand.y-.5)*2. + cos(x*.4 + lane)*.5;
      p = vec3(x, y, z);
      float m = mod(lane, 4.);
      col = m<1. ? cBlue : m<2. ? cPetrol*1.4 : m<3. ? cGreen*.85 : cAmber;
      col = mix(col, cBone, .25);
      sz = .9;
    } else if(i==2){
      p = rotY(pos2, uSpineRot);
      float band = exp(-pow((pos2.y - (3.6 - mod(uTime*1.6, 9.)))*2.2, 2.));
      col = mix(cBone, cBlue, band*.8);
    } else if(i==3){
      p = pos3; if (kind3 > .5 && kind3 < 1.5) p.y += uRoofLift;
      p = rotY(p, uHouseRot);
      col = kind3 < .5 ? cBone : kind3 < 1.5 ? mix(cAmber, cBone, .2) : kind3 < 2.5 ? cGreen : cPetrol*.9;
      col *= 1. + uHouse*.6;
      sz = kind3 > 2.5 ? .7 : 1.;
    } else {
      float br = 1. + sin(uTime*1.2 + pos4.x*.8)*.04;
      p = pos4 * vec3(br, br, 1.) + jitter(.01, 2.);
      p = rotY(p, sin(uTime*.3)*.25);
      col = kind4 < .5 ? cGreen : kind4 < 1.5 ? cLogoP*1.15 : kind4 < 2.5 ? cBlue : cGrey;
    }
    p = p * uXf[i].w + uXf[i].xyz;
    if(i==2){
      // Abtastlinie: oberhalb ist die Wirbelsäule schon „fest“, darunter noch Partikel
      float g = exp(-pow((p.y - uCut)*7., 2.));
      al = smoothstep(uCut + .1, uCut - .1, p.y);
      col = mix(col, cAmber, g); sz *= 1. + g*1.6; al = max(al, g);
    }
  }

  void main(){
    float m = clamp(uMorph, 0., 4.);
    int i0 = int(floor(m)); int i1 = min(i0+1, 4);
    float f = m - float(i0);
    float st = aRand.w*.4;
    float t = smoothstep(st, st+.6, f);
    vec3 pA, pB, cA, cB; float sA, sB, aA, aB;
    shape(i0, pA, cA, sA, aA); shape(i1, pB, cB, sB, aB);
    vec3 p = mix(pA, pB, t);
    // Haus „gestochen“: ruhiger, gleich große Punkte
    float wH = (i0 == 3 ? 1. - t : 0.) + (i1 == 3 ? t : 0.);
    p += vec3(sin(uTime*.5 + aRand.y*6.283), cos(uTime*.42 + aRand.z*6.283), 0.) * .012 * mix(uXf[i0].w, uXf[i1].w, t) * (1. - wH * .9);
    // Zerstäuben zwischen zwei Formen
    vec3 n = normalize(vec3(aRand.x-.5, aRand.y-.5, aRand.z-.5)+1e-4);
    // Streuung im Verhältnis zur Formgröße (auf dem Handy kleiner, damit Text frei bleibt)
    float ws = mix(uXf[i0].w, uXf[i1].w, t);
    p += n * sin(t*3.14159) * (1.2 + aRand.w*1.6) * ws * uSpread;
    // Intro: aus der Tiefe einfliegen
    p += n * (1.-uIntro) * (6. + aRand.x*8.) * ws * uSpread;
    vec4 mv = modelViewMatrix * vec4(p, 1.);
    gl_Position = projectionMatrix * mv;
    float s = mix(sA, sB, t);
    gl_PointSize = uSize * uPix * s * mix(.5 + aRand.y*.9, .82, wH) * 24. / -mv.z;
    vCol = mix(cA, cB, t);
    vA = mix(.5 + aRand.x*.5, .9, wH) * (1. - uFadeMid*sin(t*3.14159)) * uIntro * mix(aA, aB, t);
  }`;
const frag = /* glsl */`
  uniform float uAlpha;
  varying vec3 vCol; varying float vA;
  void main(){
    float d = length(gl_PointCoord - .5);
    float a = smoothstep(.5, .05, d);
    gl_FragColor = vec4(vCol, a * vA * uAlpha);
    #include <colorspace_fragment>
  }`;
const mat = new THREE.ShaderMaterial({ vertexShader: vert, fragmentShader: frag, uniforms, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
const points = new THREE.Points(geo, mat);
points.frustumCulled = false;
scene.add(points);

// ---------- Layout je Form (Position/Skalierung) ----------
let heroFit = null;
function layout() {
  const d = isDesktop(), a = VW / VH;
  const hw = 13 * Math.tan(THREE.MathUtils.degToRad(17.5)) * a; // halbe sichtbare Breite bei z=0
  const X = uniforms.uXf.value;
  if (d) {
    X[0].set(hw * 0.56, -0.29, 0, 0.94);
    X[1].set(0, -0.2, 0, Math.max(1, a * 0.75));
    X[2].set(hw * 0.47, -0.3, 0, 0.84);
    X[3].set(hw * 0.5, 0.1, 0, 0.74);
    X[4].set(hw * 0.46, 0, 0, 0.72);
  } else {
    X[0].set(0, 2.35, 0, 0.40);        // Handy: etwas kleiner und höher, Füße über dem Kicker (Prüfung 1.11.)
    if (heroFit) { const wpp = 8.19 / VH, hw2 = (heroFit.bot - heroFit.top) * wpp; X[0].set(0, (VH / 2 - (heroFit.top + heroFit.bot) / 2) * wpp, 0, Math.min(0.8, hw2 / 7.75)); } // Figur zwischen Leiste und Kicker (4.11.)
    X[1].set(0, 0, 0, 1.25);           // 1A: Bewegungslinien über den ganzen Bildschirm
    X[2].set(0, 1.65, 0, 0.28);        // 4A: Wirbelsäule in der oberen Bildhälfte
    X[3].set(0, 2.5, 0, 0.42);         // 2B: wird beim Scrollen zum Emblem (siehe roofEmblem)
    X[4].set(0, 2.15, 0, 0.32);        // 3: tiefer und kleiner, frei von der Leiste
  }
  uniforms.uPix.value = renderer ? renderer.getPixelRatio() * (VH / 900) * (d ? 1 : 1.25) : 1;
}
function resize() {
  if (isDesktop()) [...$$('.seg-card'), ...$$('#achse .note')].forEach((c) => { c.style.opacity = ''; c.style.transform = ''; });
  camera.aspect = VW / VH; camera.updateProjectionMatrix();
  if (renderer) renderer.setSize(VW, VH, false);
  layout();
}
addEventListener('resize', resize); resize();

// ---------- Hand: Spannung lösen ----------
const hand = $('#hand');
const raycaster = new THREE.Raycaster(), ndc = new THREE.Vector2(), plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0), hit = new THREE.Vector3();
let lastPaint = null, touched = false;
function paintAt(cx, cy) {
  ndc.set(cx / VW * 2 - 1, -(cy / VH) * 2 + 1);
  raycaster.setFromCamera(ndc, camera);
  if (!raycaster.ray.intersectPlane(plane, hit)) return;
  const X = uniforms.uXf.value[0];
  const bx = (hit.x - X.x) / X.w, by = (hit.y - X.y) / X.w;
  const u = bx / (BODY_W * BODY_SCALE) + 0.5, v = 1 - (by / (BODY_H * BODY_SCALE) + 0.5);
  if (u < -0.1 || u > 1.1 || v < -0.05 || v > 1.05) { lastPaint = null; return; }
  const px = u * RW, py = v * RH;
  const steps = lastPaint ? Math.ceil(Math.hypot(px - lastPaint[0], py - lastPaint[1]) / 2) : 1;
  for (let s = 1; s <= steps; s++) {
    const x = lastPaint ? lastPaint[0] + (px - lastPaint[0]) * s / steps : px;
    const y = lastPaint ? lastPaint[1] + (py - lastPaint[1]) * s / steps : py;
    const g = rctx.createRadialGradient(x, y, 0, x, y, 11);
    g.addColorStop(0, 'rgba(255,255,255,.22)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    rctx.fillStyle = g; rctx.fillRect(x - 11, y - 11, 22, 22);
  }
  lastPaint = [px, py];
  relaxTex.needsUpdate = true;
  touched = true;
}
addEventListener('pointermove', (e) => {
  if (!e.clientX && !e.clientY) return;
  if (morphNow > 0.6 || e.pointerType !== 'mouse') { hand.classList.remove('on'); if (morphNow > 0.6) return; }
  if (finePointer && e.pointerType === 'mouse') { hand.style.transform = `translate(${e.clientX}px,${e.clientY}px)`; hand.classList.add('on'); }
  paintAt(e.clientX, e.clientY);
}, { passive: true });
addEventListener('pointerleave', () => hand.classList.remove('on'));

// Spannungsanzeige
const tensionBar = $('#tension'), tensionVal = $('#tensionVal');
let tensionShown = 100, calm = false;
const meter = $('.meter'), meterLbl = $('.meter span');
function measureTension() {
  const d = rctx.getImageData(0, 0, RW, RH).data;
  let sum = 0, w = 0;
  HOTSPOTS.forEach((h) => {
    const x = Math.round(h.x / BODY_W * RW), y = Math.round(h.y / BODY_H * RH);
    for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) {
      const xx = clamp(x + dx, 0, RW - 1), yy = clamp(y + dy, 0, RH - 1);
      sum += h.k * Math.max(0, 1 - d[(yy * RW + xx) * 4] / 245); w += h.k; // Zeichenfläche (8 bit) bleibt bei ~251 stehen → ≥ 245 = gelöst
    }
  });
  return Math.round(sum / w * 100);
}
setInterval(() => {
  if (!touched) return;
  const t = measureTension();
  gsap.to({ v: tensionShown }, { v: t, duration: 0.5, onUpdate() { tensionShown = this.targets()[0].v; tensionVal.textContent = Math.round(tensionShown); } });
  tensionBar.style.transform = `scaleX(${t / 100})`;
  if (t === 0 && !calm) { calm = true; meter?.classList.add('is-calm'); if (meterLbl) meterLbl.textContent = 'Entspannt.'; }
}, 300);

// ---------- Kinetischer Titel: Buchstaben entspannen sich unter der Hand ----------
const title = $('#heroTitle');
const txt = title.textContent;
title.innerHTML = txt.split(' ').map((w) => `<span style="white-space:nowrap">${[...w].map((c) => `<span class="ch" aria-hidden="true">${c}</span>`).join('')}</span>`).join(' ');
const chars = $$('.ch', title);
let ptr = { x: -9999, y: -9999 };
addEventListener('pointermove', (e) => { ptr = { x: e.clientX, y: e.clientY }; }, { passive: true });

// ---------- Manifest: Wort für Wort ----------
const statement = $('.statement');
(function splitWords(el) {
  [...el.childNodes].forEach((n) => {
    if (n.nodeType === 3) {
      const frag = document.createDocumentFragment();
      n.textContent.split(/(\s+)/).forEach((w) => {
        if (!w.trim()) { frag.appendChild(document.createTextNode(w)); return; }
        const s = document.createElement('span'); s.className = 'word'; s.textContent = w; frag.appendChild(s);
      });
      n.replaceWith(frag);
    } else if (n.nodeType === 1) { n.classList.add('word'); }
  });
})(statement);
const words = $$('.word', statement);

// ---------- Achse: gestochener Knochen + lebendes Nervensystem ----------
// Abtastlinie von oben nach unten: darüber erscheint die Wirbelsäule im Detail, darunter sind noch die
// groben Partikel. Knochen = gleichmäßig gesetzte Punkte auf dunklem Kern (fest, ruhig).
// Nerven = Partikel, die wirklich fließen; Signale laufen vom Kopf durchs Rückenmark in die Wurzeln.
const V3 = THREE.Vector3;
// Aufbau erst, wenn #achse in Reichweite kommt (A1); bis dahin det/bones = null, danach blendet der Scan ein (spineK)
let det = null, SC = 1, CY = 0, spineK = 0;
const N_GRAIN = isDesktop() ? 165000 : 46000, N_SLICE = isDesktop() ? 330000 : 85000;
const sU = {
  uTime: uniforms.uTime, uRot: uniforms.uSpineRot, uCut: uniforms.uCut, uXf: { value: uniforms.uXf.value[2] },
  uZone: { value: -10 }, uZoneAmt: { value: 0 }, uOn: { value: 0 }, uStip: { value: 1 }, uPix: uniforms.uPix,
  uPeri: { value: 0 }, uPeriStart: { value: 0 },
  cBone: { value: C('#F3EADA') }, cDisc: { value: C('#86AFC9') }, cAmber: uniforms.cAmber, cBlue: uniforms.cBlue,
  cSignal: { value: C('#DDF1FF') }, cCore: { value: C('#0E1C22') },
};
const GLSL_COMMON = /* glsl */`
  uniform float uTime, uRot, uCut, uZone, uZoneAmt, uOn, uStip, uPix, uPeri, uPeriStart; uniform vec4 uXf;
  uniform vec3 cBone, cDisc, cAmber, cBlue, cSignal, cCore;
  vec3 rotY(vec3 p, float a){ float c=cos(a), s=sin(a); return vec3(c*p.x+s*p.z, p.y, -s*p.x+c*p.z); }
  const vec3 LDIR = vec3(.48, .72, .5);`;

// 1) Kern: dunkle Füllung, verdeckt die Rückseite der Punkte
const coreMat = new THREE.ShaderMaterial({
  uniforms: sU,
  vertexShader: GLSL_COMMON + /* glsl */`
    varying float vY; varying float vL;
    void main(){
      vec3 p = rotY(position - normal * .012, uRot) * uXf.w + uXf.xyz;
      vY = p.y; vL = max(dot(normalize(rotY(normal, uRot)), normalize(LDIR)), 0.);
      gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.);
    }`,
  fragmentShader: GLSL_COMMON + /* glsl */`
    varying float vY; varying float vL;
    void main(){
      if (vY < uCut) discard;
      gl_FragColor = vec4(cCore + cBone * vL * .05, 1.);
      #include <colorspace_fragment>
    }`,
});

// 2) Knochen in zwei Darstellungen: „Schichten“ (CT-Schnittlinien) oder „Körnung“ (gestochene Punkte)
const boneMat = new THREE.ShaderMaterial({
  uniforms: sU,
  vertexShader: GLSL_COMMON + /* glsl */`
    attribute float aZone, aKind; uniform float uMaxSize;
    varying vec3 vCol; varying float vVis;
    void main(){
      vec3 p = rotY(position, uRot) * uXf.w + uXf.xyz;
      vec3 n = normalize(rotY(normal, uRot));
      vec3 V = normalize(cameraPosition - p);
      float lam = max(dot(n, normalize(LDIR)), 0.);
      float rim = pow(1. - max(dot(n, V), 0.), 3.);
      float on = (1. - step(.5, abs(aZone - uZone))) * uZoneAmt;
      vec3 base = aKind < .5 ? cBone : cDisc;
      vec3 col = base * (.22 + .78 * lam) + cBlue * rim * .16;
      col = mix(col, cAmber * (.35 + .95 * lam), on * (aKind < .5 ? 1. : .4));
      float g = exp(-pow((p.y - uCut) * 9., 2.));
      col = mix(col, cAmber * 1.3, g);
      vCol = col; vVis = step(uCut, p.y) * uOn;
      vec4 mv = viewMatrix * vec4(p, 1.);
      gl_Position = projectionMatrix * mv;
      gl_PointSize = clamp(uStip / -mv.z, 1., uMaxSize) * (1. + g * .8);
    }`,
  fragmentShader: /* glsl */`
    varying vec3 vCol; varying float vVis;
    void main(){
      float d = length(gl_PointCoord - .5);
      if (vVis < .5 || d > .5) discard;
      gl_FragColor = vec4(vCol * (1. - smoothstep(.18, .5, d) * .5), 1.);
      #include <colorspace_fragment>
    }`,
});
const STYLES = {};
function boneStyle(name, d) { // d = det.makeGrain(N_GRAIN) bzw. det.makeSlices(…), vorab gerechnet
  if (STYLES[name]) return STYLES[name];
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(d.pos, 3));
  g.setAttribute('normal', new THREE.BufferAttribute(d.nor, 3));
  g.setAttribute('aZone', new THREE.BufferAttribute(d.zone, 1));
  g.setAttribute('aKind', new THREE.BufferAttribute(d.kind, 1));
  g.setDrawRange(0, d.count);
  const m = boneMat.clone();
  m.uniforms = { ...sU, uStip: { value: 1 }, uMaxSize: { value: name === 'grain' ? 6.5 : 2.6 } };
  const pts = new THREE.Points(g, m);
  pts.frustumCulled = false;
  return (STYLES[name] = { pts, spacing: d.spacing, name });
}
let bones = null;
// Darstellung „Schichten“ (Entscheidung 1.11.2026; „Körnung“ bleibt nur als Code-Option)

// 3) Nerven: Kurven als Textur (Zeile 0 Rückenmark, dann Wurzeln); Versorgungsbahn eigene Textur in Weltkoordinaten
const periData = new Float32Array(CURVE_W * 4);
const periTex = new THREE.DataTexture(periData, CURVE_W, 1, THREE.RGBAFormat, THREE.FloatType);
periTex.minFilter = periTex.magFilter = THREE.NearestFilter; periTex.needsUpdate = true;
function addNerves() {
  const ROWS = det.curves.length;
  const cData = new Float32Array(CURVE_W * ROWS * 4);
  det.curves.forEach((c, r) => c.pts.forEach((q, i) => cData.set([q[0], q[1], q[2], 1], (r * CURVE_W + i) * 4)));
  const curveTex = new THREE.DataTexture(cData, CURVE_W, ROWS, THREE.RGBAFormat, THREE.FloatType);
  curveTex.minFilter = curveTex.magFilter = THREE.NearestFilter; curveTex.needsUpdate = true;
  sU.uCurves = { value: curveTex }; sU.uPeriTex = { value: periTex }; sU.uRows = { value: ROWS };

  const desk = isDesktop();
  const nCord = desk ? 2600 : 1300, nRoot = desk ? 34 : 20, nPeri = desk ? 900 : 500;
  const nAll = nCord + (ROWS - 1) * nRoot + nPeri;
  const aRow = new Float32Array(nAll), aPhase = new Float32Array(nAll), aSpeed = new Float32Array(nAll), aKindN = new Float32Array(nAll), aZoneN = new Float32Array(nAll), aStart = new Float32Array(nAll), aOff = new Float32Array(nAll * 3);
  let q = 0;
  const push = (row, kind, zone, start, speed, off) => {
    aRow[q] = row; aKindN[q] = kind; aZoneN[q] = zone; aStart[q] = start; aPhase[q] = Math.random(); aSpeed[q] = speed * (0.75 + Math.random() * 0.5);
    const u = Math.random() * Math.PI * 2, rr = Math.sqrt(Math.random()) * off;
    aOff.set([Math.cos(u) * rr, (Math.random() - 0.5) * off * 0.6, Math.sin(u) * rr], q * 3); q++;
  };
  for (let i = 0; i < nCord; i++) push(0, 1, -1, 0, 0.055, 0.045);
  for (let r = 1; r < ROWS; r++) for (let i = 0; i < nRoot; i++) push(r, 2, det.curves[r].zone, det.curves[r].start, 0.22, 0.018);
  for (let i = 0; i < nPeri; i++) push(0, 3, -1, 0, 0.16, 0.05);
  const nGeo = new THREE.BufferGeometry();
  nGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(nAll * 3), 3));
  [['aRow', aRow], ['aPhase', aPhase], ['aSpeed', aSpeed], ['aKind', aKindN], ['aZone', aZoneN], ['aStart', aStart]].forEach(([k, v]) => nGeo.setAttribute(k, new THREE.BufferAttribute(v, 1)));
  nGeo.setAttribute('aOff', new THREE.BufferAttribute(aOff, 3));
  const nerveMat = new THREE.ShaderMaterial({
    uniforms: sU, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: GLSL_COMMON + /* glsl */`
      uniform sampler2D uCurves, uPeriTex; uniform float uRows;
      attribute float aRow, aPhase, aSpeed, aKind, aZone, aStart; attribute vec3 aOff;
      varying vec3 vCol; varying float vA;
      vec3 curveAt(sampler2D tex, float row, float rows, float t){
        float x = t * ${CURVE_W - 1}.; float i0 = floor(x);
        vec3 a = texture2D(tex, vec2((i0 + .5) / ${CURVE_W}., (row + .5) / rows)).xyz;
        vec3 b = texture2D(tex, vec2((min(i0 + 1., ${CURVE_W - 1}.) + .5) / ${CURVE_W}., (row + .5) / rows)).xyz;
        return mix(a, b, x - i0);
      }
      // zwei Signale je Takt, die vom Kopf nach unten laufen
      float packet(float d, float sharp){ return exp(-d * d * sharp) + step(0., d) * exp(-d * 7.) * .35; }
      void main(){
        float t = fract(aPhase + uTime * aSpeed);
        float S1 = fract(uTime * .3), S2 = fract(uTime * .3 + .5);
        vec3 p; float base, pk;
        if (aKind < 1.5) {                         // Rückenmark
          p = rotY(curveAt(uCurves, aRow, uRows, t) + aOff, uRot) * uXf.w + uXf.xyz;
          pk = max(packet(S1 - t, 700.), packet(S2 - t, 700.));
          base = .46;
        } else if (aKind < 2.5) {                  // Nervenwurzel
          p = rotY(curveAt(uCurves, aRow, uRows, t) + aOff, uRot) * uXf.w + uXf.xyz;
          float on = (1. - step(.5, abs(aZone - uZone))) * uZoneAmt;
          float r1 = (S1 - aStart) * 4., r2 = (S2 - aStart) * 4.;
          pk = max(packet(r1 - t, 60.) * step(0., r1) * step(r1, 1.4), packet(r2 - t, 60.) * step(0., r2) * step(r2, 1.4));
          pk *= mix(.28, 1.5, on);
          base = .16 + on * .5;
        } else {                                   // Versorgungsbahn (Weltkoordinaten)
          p = curveAt(uPeriTex, 0., 1., t) + aOff * uXf.w * 4.;
          float r1 = (S1 - uPeriStart) * 4. - 1., r2 = (S2 - uPeriStart) * 4. - 1.;
          pk = max(packet(r1 * .55 - t, 40.) * step(0., r1), packet(r2 * .55 - t, 40.) * step(0., r2)) * uPeri;
          base = .4 * uPeri;
        }
        vec3 col = cBlue * base + cSignal * pk * 1.15;
        float vis = step(uCut, p.y) * uOn;
        vec4 mv = viewMatrix * vec4(p, 1.);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = clamp(uPix * (1.05 + pk * 1.4) * 15. / -mv.z, 1., 7.);
        vCol = col; vA = vis * clamp(base + pk, 0., 1.4);
      }`,
    fragmentShader: /* glsl */`
      uniform float uGhost;
      varying vec3 vCol; varying float vA;
      void main(){
        float d = length(gl_PointCoord - .5);
        gl_FragColor = vec4(vCol, smoothstep(.5, .05, d) * vA * uGhost);
        #include <colorspace_fragment>
      }`,
  });
  nerveMat.uniforms = { ...sU, uGhost: { value: 1 } };
  const nerves = new THREE.Points(nGeo, nerveMat);
  nerves.frustumCulled = false;
  // zweiter Durchgang: Nerven schimmern gedämpft durch den Knochen (sonst verschwände das Rückenmark im Wirbelkanal)
  const ghostMat = nerveMat.clone();
  ghostMat.uniforms = { ...sU, uGhost: { value: 0.42 } }; ghostMat.depthTest = false;
  const nervesGhost = new THREE.Points(nGeo, ghostMat);
  nervesGhost.frustumCulled = false;
  spineGroup.add(nervesGhost, nerves);
}

const spineGroup = new THREE.Group();
spineGroup.visible = false;
scene.add(spineGroup);
whenNear($('#achse'), () => runSliced(spineStippleGen(0, false)).then((d) => {
  det = d; SC = d.SC; CY = d.CY;
  return runSliced(d.makeSlicesGen(N_SLICE, isDesktop() ? 0.024 : 0.032, 0.12));
}).then((sl) => {
  const core = new THREE.Mesh(det.coreGeo, coreMat);
  core.frustumCulled = false;
  bones = boneStyle('slices', sl);
  spineGroup.add(core, bones.pts);
  addNerves();
}));

// Versorgungsbahn: vom Wurzel-Ende des aktiven Abschnitts bis zum Zielgebiet, mit Beschriftung
const PERI = {
  c12: { txt: 'Hinterkopf · Nacken', d: [0.62, 0.7], m: [0.85, 0.8] },
  c56: { txt: 'Armaußenseite · Daumen', d: [1.15, 0.05], m: [0.7, 0.42] },
  th16: { txt: 'Brustkorb · Zwischenrippen', d: [1.15, 0.12], m: [0.68, 0.36] },
  l45: { txt: 'Schienbein · Großzehe', d: [1.1, -0.72], m: [0.6, 0.12] },
  s1: { txt: 'Wade · Ferse · Fußaußenrand', d: [1.1, -0.82], m: [0.55, 0.08] },
};
const periLabel = document.createElement('div');
periLabel.className = 'peri-label'; periLabel.setAttribute('aria-hidden', 'true');
document.body.appendChild(periLabel);
const _pv = new V3(), _ndc = new V3();
function updatePeri(zoneKey) {
  const cfg = PERI[zoneKey];
  if (!cfg) return;
  // rechte Wurzel des Abschnitts finden, deren Ende auf dem Bildschirm am weitesten rechts liegt
  const X = uniforms.uXf.value[2];
  const rot = uniforms.uSpineRot.value;
  let tip = null, tipX = -1e9, start = 0;
  det.curves.forEach((c) => {
    if (c.kind !== 2 || ZONES[c.zone] !== zoneKey) return;
    const e = c.pts[CURVE_W - 1];
    _pv.set(e[0], e[1], e[2]).applyAxisAngle(new V3(0, 1, 0), rot).multiplyScalar(X.w).add(new V3(X.x, X.y, X.z));
    _ndc.copy(_pv).project(camera);
    if (_ndc.x > tipX) { tipX = _ndc.x; tip = _pv.clone(); start = c.start; }
  });
  if (!tip) return;
  const tipNdc = tip.clone().project(camera);
  const desk = isDesktop();
  const end = desk ? silTarget(zoneKey) : new V3(1.1, cfg.m[1], tipNdc.z).unproject(camera);
  const endNdc = end.clone().project(camera);
  const mid = new V3(THREE.MathUtils.lerp(tipNdc.x, endNdc.x, 0.45), THREE.MathUtils.lerp(tipNdc.y, endNdc.y, 0.25) + 0.05, THREE.MathUtils.lerp(tipNdc.z, endNdc.z, 0.5)).unproject(camera);
  const curve = new THREE.CatmullRomCurve3([tip, tip.clone().lerp(mid, 0.4).add(new V3(0, 0.02, 0)), mid, end]);
  for (let i = 0; i < CURVE_W; i++) { curve.getPointAt(i / (CURVE_W - 1), _pv); periData.set([_pv.x, _pv.y, _pv.z, 1], i * 4); }
  periTex.needsUpdate = true;
  periCurve = curve;
  sU.uPeriStart.value = start;
  // Beschriftung am sichtbaren Ende der Bahn
  curve.getPointAt(desk ? 0.72 : 0.6, _pv); _pv.project(camera);
  const lx = Math.min((_pv.x * 0.5 + 0.5) * VW, VW - 16), ly = (-_pv.y * 0.5 + 0.5) * VH;
  periLabel.style.transform = `translate(${lx}px, ${ly}px) translate(-100%, -260%)`;
  periLabel.textContent = cfg.txt;
}

// Abschnitte (Zonen wie V10) und Kamera-Rahmen
const STOPS = [
  { zone: 'c12', ids: ['C1', 'C2'], d: 5.6, az: 0.5 },
  { zone: 'c56', ids: ['C5', 'C6'], d: 6.2, az: -0.38 },
  { zone: 'th16', ids: ['Th2', 'Th3', 'Th4', 'Th5'], d: 7.6, az: 0.55 },
  { zone: 'l45', ids: ['L4', 'L5'], d: 7.2, az: -0.45 },
  { zone: 's1', ids: ['L5', 'S'], d: 7.6, az: 0.75 },
];
const PROFILE = -Math.PI / 2;
const tanH = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
function frame(T, dir, d, fx, fy) {
  const pos = T.clone().add(dir.clone().normalize().multiplyScalar(d));
  const fwd = T.clone().sub(pos).normalize();
  const right = new V3().crossVectors(fwd, new V3(0, 1, 0)).normalize();
  const up = new V3().crossVectors(right, fwd);
  const hh = d * tanH, hw = hh * camera.aspect;
  const shift = right.multiplyScalar(-(fx - 0.5) * 2 * hw).add(up.multiplyScalar((fy - 0.5) * 2 * hh));
  return { pos: pos.add(shift), target: T.clone().add(shift) };
}
function stopPose(i, fy = 0.3) { // fy: Höhe des Abschnitts im Bild (nur Handy; 0.3 = Standard)
  const s = STOPS[i], rot = PROFILE + s.az, X = uniforms.uXf.value[2], desk = isDesktop();
  const c = new V3();
  s.ids.forEach((id) => { const lv = det.levels.find((l) => l.id === id); c.add(new V3(lv.center.x * SC, (lv.center.y - CY) * SC, lv.center.z * SC)); });
  c.divideScalar(s.ids.length).applyAxisAngle(new V3(0, 1, 0), rot).multiplyScalar(X.w).add(new V3(X.x, X.y, X.z));
  const d = s.d * SC * X.w * 0.86 * (desk ? 1 : 2.1);
  return { ...frame(c, new V3(0, 0.12, 1), d, desk ? 0.56 : 0.5, desk ? 0.5 : fy), rot };
}
const OVERVIEW = { pos: new V3(0, 0, 13), target: new V3(0, 0, 0) };
const lerpPose = (a, b, t) => ({ pos: a.pos.clone().lerp(b.pos, t), target: a.target.clone().lerp(b.target, t), rot: b.rot !== undefined && a.rot !== undefined ? THREE.MathUtils.lerp(a.rot, b.rot, t) : (b.rot ?? a.rot) });
const cam = { pos: OVERVIEW.pos.clone(), target: OVERVIEW.target.clone() };
let axisWant = null;

// Bedienung: Desktop = Scrollen + Abschnitts-Knöpfe, Handy = Karten wischen
const axis = $('#achse');
const segBtns = $$('.segnav button'), cards = $$('.seg-card'), dots = $$('.seg-dots button');
let active = 0, mobSel = 0;
function setActive(i) {
  if (i === active) return;
  active = i;
  [segBtns, cards, dots].forEach((list) => list.forEach((el, k) => el.classList.toggle('is-on', k === i)));
}
// ---------- Nerven-Infos im Raum (PC): erscheinen Schritt für Schritt entlang der Bahn ----------
const NINFO = {
  c12: { exit: 'Austritt C1–C2', nerv: 'Nn. suboccipitales · N. occipitalis major', gef: 'Tiefe Nackenmuskulatur', ziel: 'Hinterkopf', typ: 'Typisch: Spannungskopfschmerz, Schwindelgefühl, eingeschränktes Kopfdrehen', tgt: [84, 30] },
  c56: { exit: 'Austritt C5–C6', nerv: 'Bizeps · Schulterheber', gef: 'Gefühl: Armaußenseite', ziel: 'bis zum Daumen', typ: 'Typisch: Ausstrahlung bis in den Daumen, Kribbeln, Schwäche beim Beugen', tgt: [36, 240] },
  th16: { exit: 'Austritt Th1–Th6', nerv: 'Interkostalnerven, obere Rippen', gef: 'Brustkorbwand · Zwischenrippen', ziel: 'Brustkorb', typ: 'Typisch: atemabhängiges Stechen, Schmerz zwischen den Schulterblättern', tgt: [80, 118] },
  l45: { exit: 'Austritt L4–L5', nerv: 'Richtung N. ischiadicus · L5 hebt den Fuß', gef: 'Gefühl: Schienbein', ziel: 'bis zur Großzehe', typ: 'Typisch: Ausstrahlung ins Bein, Kribbeln am Schienbein, Fußheber-Schwäche', tgt: [76, 404] },
  s1: { exit: 'Austritt S1 · ISG', nerv: 'Wade · Achillessehnenreflex', gef: 'Gefühl: Beinrückseite, Fußaußenrand', ziel: 'bis zur Ferse', typ: 'Typisch: Ausstrahlung bis zur Ferse, einseitiger Kreuzschmerz', tgt: [72, 412] },
};
const NC_KEYS = ['exit', 'nerv', 'gef', 'ziel', 'typ'];
const ncalls = NC_KEYS.map((k) => { const el = document.createElement('div'); el.className = 'ncall ncall-' + k; el.setAttribute('aria-hidden', 'true'); document.body.appendChild(el); return el; });
let periCurve = null;

// Körper-Silhouette (zarte Partikel), an die Kamera gehängt, rechts im Bild; das Versorgungsgebiet glüht
const silIdx = []; for (let i = 0; i < N; i += isDesktop() ? 6 : 9) silIdx.push(i);
const silPos = new Float32Array(silIdx.length * 3);
silIdx.forEach((j, k) => silPos.set([body.pos[j * 3], body.pos[j * 3 + 1], body.pos[j * 3 + 2] * 0.4], k * 3));
const silGeo = new THREE.BufferGeometry(); silGeo.setAttribute('position', new THREE.BufferAttribute(silPos, 3));
const silU = { uOn: { value: 0 }, uTgt: { value: new V3() }, uTime: uniforms.uTime, uPix: uniforms.uPix, cBone: uniforms.cBone, cBlue: uniforms.cBlue, cPetrol: uniforms.cPetrol };
const sil = new THREE.Points(silGeo, new THREE.ShaderMaterial({
  uniforms: silU, transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending,
  vertexShader: /* glsl */`
    uniform float uOn, uTime, uPix; uniform vec3 uTgt; uniform vec3 cBone, cBlue, cPetrol; varying vec3 vCol; varying float vA;
    void main(){ float d = distance(position.xy, uTgt.xy);
      float glow = exp(-d * d * 1.6) * (.75 + .25 * sin(uTime * 3. - d * 4.));
      vCol = mix(cPetrol * 1.3, cBlue * 1.6, glow) + vec3(.9) * glow * .35;
      vec4 mv = modelViewMatrix * vec4(position, 1.); gl_Position = projectionMatrix * mv;
      gl_PointSize = uPix * (1.2 + glow * 1.6) * 2.2; vA = uOn * (.16 + glow * .85); }`,
  fragmentShader: /* glsl */`varying vec3 vCol; varying float vA; void main(){ float d = length(gl_PointCoord - .5); gl_FragColor = vec4(vCol, smoothstep(.5, .1, d) * vA);
    #include <colorspace_fragment>
  }`,
}));
sil.frustumCulled = false; sil.visible = false; sil.renderOrder = 5;
scene.add(camera); camera.add(sil);
function placeSilhouette() {
  const D = 6, hh = D * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)), hw = hh * camera.aspect;
  const s = (hh * 2 * 0.62) / 8.2;
  sil.position.set(hw * 0.74, -hh * 0.06, -D); sil.scale.setScalar(s);
}
function silTarget(zoneKey) {
  const [bx, by] = NINFO[zoneKey].tgt;
  const local = new V3((bx - BODY_W / 2) * BODY_SCALE, (BODY_H / 2 - by) * BODY_SCALE, 0);
  silU.uTgt.value.copy(local);
  sil.updateMatrixWorld(true);
  return sil.localToWorld(local.clone());
}
// Hinweislinien von der Beschriftung zum Punkt (SVG über der Szene)
const nlines = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
nlines.setAttribute('class', 'nlines'); nlines.setAttribute('aria-hidden', 'true');
nlines.innerHTML = '<line/><line/><line/><line/>'; document.body.appendChild(nlines);
const nl = [...nlines.querySelectorAll('line')];
const toPx = (v) => { const q = v.clone().project(camera); return [(q.x * 0.5 + 0.5) * VW, (-q.y * 0.5 + 0.5) * VH]; };
// Hindernisse auf dem Bildschirm: jeder sichtbare Wirbel als Rechteck (inkl. Fortsätze), Silhouette, Zielpunkt
function spineRects() {
  const X = uniforms.uXf.value[2], rot = uniforms.uSpineRot.value, out = [];
  const right = new V3().setFromMatrixColumn(camera.matrixWorld, 0), up = new V3().setFromMatrixColumn(camera.matrixWorld, 1);
  det.levels.forEach((lv) => {
    const c = new V3(lv.center.x * SC, (lv.center.y - CY) * SC, lv.center.z * SC).applyAxisAngle(new V3(0, 1, 0), rot).multiplyScalar(X.w).add(new V3(X.x, X.y, X.z));
    if (c.clone().project(camera).z > 1) return;
    const [cx, cy] = toPx(c), [ex] = toPx(c.clone().addScaledVector(right, lv.R * SC * X.w * 2.3)), [, ey] = toPx(c.clone().addScaledVector(up, (lv.h * 0.5 + lv.disc + 0.04) * SC * X.w));
    const rx = Math.abs(ex - cx), ry = Math.abs(ey - cy);
    out.push([cx - rx, cy - ry, cx + rx, cy + ry]);
  });
  return out;
}
const overlap = (a, b) => Math.max(0, Math.min(a[2], b[2]) - Math.max(a[0], b[0])) * Math.max(0, Math.min(a[3], b[3]) - Math.max(a[1], b[1]));
// Kandidaten rund um den Andockpunkt: Richtung (dx, dy) × Abstand; Kosten = Überdeckung gewichtet + Weg + Vorzugsrichtung
const DIRS = [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, -1], [-1, 1], [1, 1]];
const DIST = [34, 64, 104, 150, 210];
const PREF = [[-1, 0], [0, -1], [0, 1], [-1, 1]]; // Austritt links · Nerven oben · Gefühl unten · Ziel links unten
const ncState = NC_KEYS.map(() => ({ x: 0, y: 0, k: -1, init: false }));
let ncT = 0;
function updateCallouts(zoneKey, fl, on) {
  const show = isDesktop() && on && zoneKey && periCurve;
  const info = zoneKey ? NINFO[zoneKey] : null;
  const steps = [0.05, 0.05, 0.05, 0.05, 0.2]; // zwei Schritte: Austritt, Nerven, Gefühl, Ziel zusammen → dann „Typisch“
  ncalls.forEach((el, i) => {
    const vis = show && fl > steps[i] && fl < 0.97;
    el.style.opacity = vis ? 1 : 0;
    if (i < 4) nl[i].style.opacity = vis ? 1 : 0;
  });
  if (!show) { ncState.forEach((s) => { s.init = false; s.k = -1; }); return; }
  const now = performance.now(), ease = 1 - Math.exp(-Math.min(0.1, (now - ncT) / 1000) * 7); ncT = now;
  const W = VW, H = VH, MINX = Math.min(600, W * 0.42); // Textspalte links frei halten
  const spine = spineRects();
  // Silhouette-Rahmen (Arme hängen, daher schmal) und leuchtendes Ziel
  const [sx0, sy0] = toPx(sil.localToWorld(new V3(-BODY_W * 0.36 * BODY_SCALE, BODY_H / 2 * BODY_SCALE, 0)));
  const [sx1, sy1] = toPx(sil.localToWorld(new V3(BODY_W * 0.36 * BODY_SCALE, -BODY_H / 2 * BODY_SCALE, 0)));
  const silR = [sx0, sy0, sx1, sy1];
  const anchors = [0, 0.32, 0.64, 1].map((t) => toPx(periCurve.getPointAt(t)));
  const [tx, ty] = anchors[3], tgtR = [tx - 34, ty - 34, tx + 34, ty + 34];
  // Bahn als Kette kleiner Rechtecke
  const pathR = []; for (let t = 0.04; t < 0.97; t += 0.06) { const [x, y] = toPx(periCurve.getPointAt(t)); pathR.push([x - 6, y - 6, x + 6, y + 6]); }
  const placed = [], segs = [];
  const inR = (x, y, r) => x > r[0] && x < r[2] && y > r[1] && y < r[3];
  // „Typisch“ ruhig unter der Silhouette (fest), dient den anderen als Hindernis
  {
    const el = ncalls[4]; if (el.textContent !== info.typ) el.textContent = info.typ;
    const w = el.offsetWidth, h = el.offsetHeight;
    const x = Math.min(Math.max((sx0 + sx1) / 2 - w / 2, MINX), W - w - 20), y = Math.min(sy1 + 18, H - h - 18);
    el.style.transform = `translate(${x}px, ${y}px)`; placed.push([x - 6, y - 6, x + w + 6, y + h + 6]);
  }
  for (let i = 0; i < 4; i++) {
    const el = ncalls[i], txt = info[NC_KEYS[i]]; if (el.textContent !== txt) { el.textContent = txt; ncState[i].k = -1; }
    const w = el.offsetWidth, h = el.offsetHeight, [ax, ay] = anchors[i], st = ncState[i];
    let best = null, bestC = Infinity, cur = Infinity;
    for (let d = 0; d < DIST.length; d++) for (let k = 0; k < DIRS.length; k++) {
      const [dx, dy] = DIRS[k], dist = DIST[d];
      const x = dx < 0 ? ax - dist - w : dx > 0 ? ax + dist : ax - w / 2;
      const y = dy < 0 ? ay - dist * 0.7 - h : dy > 0 ? ay + dist * 0.7 : ay - h / 2;
      if (x < MINX || x + w > W - 14 || y < 84 || y + h > H - 14) continue;
      const r = [x - 10, y - 9, x + w + 10, y + h + 9];
      let c = dist * 0.9 + (dx === PREF[i][0] && dy === PREF[i][1] ? 0 : 40);
      spine.forEach((s) => { c += overlap(r, s) * 0.5; });
      placed.forEach((s) => { c += overlap(r, s) * 4; });
      pathR.forEach((s) => { c += overlap(r, s) * 2; });
      c += overlap(r, tgtR) * 3 + overlap(r, silR) * 0.06;
      // Hinweislinie darf keine andere Beschriftung kreuzen, frühere Linien nicht unter dieser liegen
      const qx = Math.min(Math.max(ax, x), x + w), qy = Math.min(Math.max(ay, y), y + h);
      for (let u = 0.15; u < 0.9; u += 0.15) {
        const lx = qx + (ax - qx) * u, ly = qy + (ay - qy) * u;
        placed.forEach((s) => { if (inR(lx, ly, s)) c += 260; });
        segs.forEach((g) => { if (inR(g[0] + (g[2] - g[0]) * u, g[1] + (g[3] - g[1]) * u, r)) c += 260; });
      }
      const key = d * 8 + k;
      if (key === st.k) cur = c;
      if (c < bestC) { bestC = c; best = [x, y, key]; }
    }
    if (!best) best = [Math.max(MINX, Math.min(ax - w / 2, W - w - 14)), Math.max(84, Math.min(ay - h / 2, H - h - 14)), -1];
    // Halten, solange die bisherige Lage nicht deutlich schlechter ist (kein Springen)
    if (st.k >= 0 && cur < Infinity && cur < bestC * 1.35 + 60) {
      const d = Math.floor(st.k / 8), [dx, dy] = DIRS[st.k % 8], dist = DIST[d];
      best = [dx < 0 ? ax - dist - w : dx > 0 ? ax + dist : ax - w / 2, dy < 0 ? ay - dist * 0.7 - h : dy > 0 ? ay + dist * 0.7 : ay - h / 2, st.k];
    }
    st.k = best[2];
    if (!st.init) { st.x = best[0]; st.y = best[1]; st.init = true; }
    else if (reduced) { st.x = best[0]; st.y = best[1]; }
    else { st.x += (best[0] - st.x) * ease; st.y += (best[1] - st.y) * ease; }
    el.style.transform = `translate(${st.x}px, ${st.y}px)`;
    placed.push([best[0] - 10, best[1] - 9, best[0] + w + 10, best[1] + h + 9]); // Planung mit Ziellage, Anzeige gleitet nach
    const bx = Math.min(Math.max(ax, best[0]), best[0] + w), by = Math.min(Math.max(ay, best[1]), best[1] + h);
    segs.push([bx, by, ax, ay]);
    // Linie vom nächsten Randpunkt der Beschriftung zum Andockpunkt
    const px = Math.min(Math.max(ax, st.x), st.x + w), py = Math.min(Math.max(ay, st.y), st.y + h);
    const L = nl[i]; L.setAttribute('x1', px); L.setAttribute('y1', py); L.setAttribute('x2', ax); L.setAttribute('y2', ay);
  }
}

const PH = () => (isDesktop() ? { M0: 0.06, J0: 0.09, J1: 0.9, M1: 0.94 } : { M0: 0.1, J0: 0.13, J1: 0.9, M1: 0.93 });
segBtns.forEach((b) => b.addEventListener('click', () => {
  const i = +b.dataset.seg, ph = PH(), r = axis.getBoundingClientRect();
  const p = ph.J0 + (i / (STOPS.length - 1)) * (ph.J1 - ph.J0);
  scrollToY(r.top + scrollY + p * (r.height - VH) + 2);
}));
// Handy (Auftrag 1, 4.11.): Kapitel 03 hängt an den Karten statt am Kapitel-Fortschritt.
// Ablauf je Karte: Kamera fährt zuerst zum Abschnitt (Karte noch unsichtbar) → Karte blendet von unten ein,
// sobald die Kamera steht, und lebt nur im unteren Bildteil → beim Weiterscrollen bleibt der Abschnitt über
// der Kartenoberkante → Karte blendet oben aus. Nach der letzten Karte: ganze Wirbelsäule groß in der Mitte,
// stehen lassen, dann löst sie sich nach oben auf und das Haus entsteht in der Bildmitte.
const axisNote = $('#achse .note'), dachSec = $('#dach'), roofIntro = $('#tour .roof-intro');
const MOB_X2 = { x: 0, y: 1.65, s: 0.28 }; // = layout() Handy (4A)
let camArrive = 0, gateK = 1, dotsStuck = 0;
const dotsBox = $('.seg-dots');
// Unterkante der klebenden Punkte-Leiste (Handy) – darüber ist kein Platz für die Wirbelsäule
function measureDots() { dotsStuck = dotsBox && !isDesktop() ? (parseFloat(getComputedStyle(dotsBox).top) || 0) + dotsBox.offsetHeight : 0; }
addEventListener('resize', () => (dotsStuck = 0)); // neu messen (lazy: beim Start kein Layout erzwingen)
const cardFade = (r, vh) => smooth(vh * 0.95, vh * 0.7, r.top) * Math.max(smooth(vh * 0.15, vh * 0.42, r.top), smooth(vh * 0.55, vh * 0.85, r.bottom));
function mobileCard(gate) {
  const vh = VH;
  const rs = cards.map((c) => c.getBoundingClientRect());
  // aktiv ist die letzte Karte, deren Oberkante den Bildrand fast erreicht hat (die vorige ist dann schon ausgeblendet)
  let best = 0;
  rs.forEach((r, i) => { if (r.top < vh * 1.08) best = i; });
  rs.forEach((r, i) => {
    const a = cardFade(r, vh) * (i === best ? gate : 0.8);
    cards[i].style.opacity = a.toFixed(3);
    cards[i].style.transform = a > 0.999 ? '' : `translateY(${((1 - smooth(vh * 0.95, vh * 0.7, r.top)) * 1.5).toFixed(3)}rem)`;
  });
  if (axisNote) axisNote.style.opacity = cardFade(axisNote.getBoundingClientRect(), vh).toFixed(3);
  return best;
}
dots.forEach((d) => d.addEventListener('click', () => {
  const c = cards[+d.dataset.seg];
  scrollToY(c.getBoundingClientRect().top + scrollY - VH * 0.5);
}));

let spineRot = -0.9;
function updateAxis(dt) {
  const ph = PH(), desk = isDesktop();
  const r = axis.getBoundingClientRect();
  const p = clamp(-r.top / Math.max(1, r.height - VH));
  const inSec = r.top < VH && r.bottom > 0 && morphNow > 1.6 && morphNow < 2.4;
  // noch nicht fertig gerechnet: grobe Partikel bleiben, danach fahren Scan und Kamera sanft nach
  spineK = bones ? ramp(spineK, dt) : 0;
  const X = uniforms.uXf.value[2];
  let mob = null;
  if (!desk && r.top < VH * 2 && r.bottom > -VH) {
    if (!dotsStuck) measureDots();
    const vh = VH, c0 = cards[0].getBoundingClientRect().top, nt = axisNote ? axisNote.getBoundingClientRect().top : r.bottom;
    mob = {
      inK: smooth(vh * 1.35, vh * 1.1, c0),   // Scan baut sich auf, bevor die erste Karte kommt
      wIn: smooth(vh * 1.2, vh * 0.95, c0),   // Kamerafahrt zum ersten Abschnitt (Karte noch unsichtbar)
      endK: smooth(vh * 0.45, vh * 0.15, nt), // nach letzter Karte + Hinweis: ganze Wirbelsäule
      outK: smooth(vh * 1.05, vh * 0.6, dachSec.getBoundingClientRect().top), // auflösen (nach oben)
    };
    // ganze Wirbelsäule (Kopf bis Kreuzbein) groß und mittig im freien Bereich unter der Punkte-Leiste
    const top = clamp(dotsStuck / vh, 0.08, 0.3), bot = 0.97, e = mob.endK;
    const sEnd = ((bot - top) * 8.197 * 0.86) / 8.7, yEnd = (0.5 - (top + bot) / 2) * 8.197;
    X.set(0, MOB_X2.y + (yEnd - MOB_X2.y) * e + mob.outK * 1.1, 0, MOB_X2.s + (sEnd - MOB_X2.s) * e);
  }
  // Scan (0 = grobe Partikel, 1 = detaillierte Punktwolke)
  const solid = (!inSec ? 0 : mob ? mob.inK * (1 - mob.outK) : p <= 0 || p >= 1 ? 0 : p < ph.M1 ? smooth(0.005, ph.M0, p) : 1 - smooth(ph.M1, 0.995, p)) * spineK;
  const topY = X.y + 4.35 * X.w, botY = X.y - 4.35 * X.w;
  const cut = solid <= 0 ? 100 : THREE.MathUtils.lerp(topY + 0.05, botY - 0.05, solid);
  uniforms.uCut.value = cut;
  spineGroup.visible = solid > 0;
  sU.uOn.value = solid > 0 ? 1 : 0;
  // Punktgröße so, dass die Knochenpunkte bei jeder Entfernung dicht an dicht liegen
  // Punktgröße: Körnung dicht an dicht, Schichten als feine Linie
  if (bones) bones.pts.material.uniforms.uStip.value = (renderer ? renderer.getPixelRatio() : 1) * VH * 0.5 / tanH * X.w * (bones.name === 'grain' ? bones.spacing * 0.78 : 0.022);

  // Kamera: Übersicht ↔ Kamerafahrt
  const w = !inSec ? 0 : (mob ? mob.wIn * (1 - mob.endK) : smooth(ph.M0, ph.J0, p) * (1 - smooth(ph.J1, ph.M1, p))) * spineK;
  let jPose = null, zoneIdx = active, localF = 0;
  // Handy: Karten-Deckkraft immer nachführen, solange das Kapitel in der Nähe ist – sonst bleibt beim
  // Hinausscrollen eine Karte halb sichtbar stehen (Kamerafahrt endet vorher, w = 0)
  if (!desk && r.top < VH * 2 && r.bottom > -VH) {
    // Karte erst zeigen, wenn die Kamera am Abschnitt steht (ohne Kamerafahrt, z. B. ohne WebGL: sofort)
    if (axisWant && w > 0.01) {
      const err = cam.pos.distanceTo(axisWant.pos) / Math.max(0.01, axisWant.pos.distanceTo(axisWant.target));
      if (err < 0.25) camArrive = Math.max(camArrive, 0.001);
    }
    else if (!(w > 0.01)) camArrive = 0;
    const arrived = !(w > 0.01) || camArrive > 0;
    gateK = reduced ? (arrived ? 1 : 0) : gateK + ((arrived ? 1 : 0) - gateK) * (1 - Math.exp(-dt * 5));
    const sel = mobileCard(gateK);
    if (sel !== mobSel) { mobSel = sel; camArrive = 0; if (w > 0.01) gateK = 0; }
  }
  if (w > 0) {
    if (desk) {
      const x = clamp((p - ph.J0) / (ph.J1 - ph.J0)) * (STOPS.length - 1);
      const i = Math.min(Math.floor(x), STOPS.length - 2), f = x - i;
      jPose = lerpPose(stopPose(i), stopPose(i + 1), smooth(0.1, 0.9, f));
      jPose.rot += x * 0.14; // langsames Kreisen: jede Raste bewegt etwas
      zoneIdx = Math.min(STOPS.length - 1, Math.round(x));
      localF = zoneIdx === 0 ? x * 1.8 : zoneIdx === STOPS.length - 1 ? (x - zoneIdx + 0.5) * 1.8 : x - zoneIdx + 0.5;
      setActive(zoneIdx);
    } else {
      // Abschnitt über der Kartenoberkante halten: rutscht die Karte beim Lesen nach oben, wandert er mit
      const ct = cards[mobSel].getBoundingClientRect().top / VH, top = clamp(dotsStuck / VH, 0.08, 0.3);
      setActive(mobSel); jPose = stopPose(mobSel, clamp((top + ct) / 2, top + 0.04, 0.3)); zoneIdx = mobSel;
    }
  }
  axisWant = jPose && w > 0 ? lerpPose({ ...OVERVIEW, rot: jPose.rot }, jPose, w) : null;

  // Drehung: frei, bis die Kamerafahrt beginnt; dann in die Profil-Ansicht des Abschnitts
  if (jPose && w > 0.02) {
    const tgt = jPose.rot + Math.PI * 2 * Math.round((spineRot - jPose.rot) / (Math.PI * 2));
    spineRot += (tgt - spineRot) * (reduced ? 1 : 1 - Math.exp(-dt * 2.6));
  } else if (!paused) spineRot += dt * (reduced ? 0.07 : 0.22);
  uniforms.uSpineRot.value = spineRot;

  // Hervorhebung des Abschnitts (Bernstein), stärkere Signale und Versorgungsbahn
  const zone = w > 0.5 ? ZONES.indexOf(STOPS[zoneIdx].zone) : -10;
  if (zone !== sU.uZone.value) { sU.uZone.value = zone; sU.uZoneAmt.value = 0; sU.uPeri.value = 0; }
  sU.uZoneAmt.value += ((zone >= 0 ? 1 : 0) - sU.uZoneAmt.value) * 0.07;
  const periOn = zone >= 0 && w > 0.9 ? 1 : 0;
  sU.uPeri.value += (periOn - sU.uPeri.value) * 0.05;
  if (zone >= 0) updatePeri(STOPS[zoneIdx].zone);
  periLabel.style.opacity = (!desk && sU.uPeri.value > 0.6 && spineGroup.visible ? 1 : 0);
  // PC: Silhouette + Infos im Raum
  const silOn = desk && zone >= 0 ? sU.uPeri.value : 0;
  silU.uOn.value = silOn; sil.visible = silOn > 0.01;
  if (desk) placeSilhouette();
  updateCallouts(zone >= 0 ? STOPS[zoneIdx].zone : null, localF, silOn > 0.5);
}

// (Nerven-Infos siehe oben)
// ---------- Dach: Index ----------
$$('.index li').forEach((li) => {
  const b = $('button', li);
  b.insertAdjacentHTML('beforeend', '<span class="ix-plus" aria-hidden="true"></span>');
  b.addEventListener('click', () => {
    const open = !li.classList.contains('open');
    $$('.index li.open').forEach((o) => { o.classList.remove('open'); $('button', o).setAttribute('aria-expanded', 'false'); });
    li.classList.toggle('open', open); b.setAttribute('aria-expanded', String(open));
  });
  b.addEventListener('pointerenter', () => gsap.to(uniforms.uHouse, { value: 1, duration: 0.4 }));
  b.addEventListener('pointerleave', () => gsap.to(uniforms.uHouse, { value: 0, duration: 0.6 }));
});

// ---------- Hausordnung ----------
const rules = $('#hausordnung'), laws = $$('#laws li'), door = $('#tuer');
let lawOn = 0;

// ---------- K1 „Die Tür geht auf“ (Standard seit 4.11., ?licht=0 = dunkel): Kapitel 05 wird hell ----------
// Über die letzten 60 % der Hausordnung blendet die Seite von Dunkel in warmes Off-White (V10-Palette),
// Bernstein bleibt, die Partikel weichen warmem Sonnenstaub. Der Übergang hängt allein am Scrollen
// (keine Eigenbewegung); bei „Bewegung anhalten“ steht der Staub still, bei „reduzieren“ treibt er langsam.
const licht = new URLSearchParams(location.search).get('licht') !== '0'; // seit 4.11. (Kai: „Licht ja“) Standard; ?licht=0 = dunkel zum Vergleich
let lichtK = -1;
const hexRGB = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const LICHT = { // [dunkel, hell, Text?] – Textfarben springen schnell in der Mitte um, damit nichts verschwimmt
  '--ink': ['#0A161B', '#F7F5EF'], '--ink2': ['#10222A', '#EFEBE1'], '--ink3': ['#173039', '#E6E0D2'],
  '--txt': ['#EDE8DC', '#1C3038', 1], '--dim': ['#B0BFC3', '#3E545C', 1], '--mute': ['#7F959C', '#566A71', 1], '--amber': ['#E09A35', '#9A570A', 1],
};
const LICHT_A = { // rgba: [r,g,b,a] dunkel → hell
  '--line': [[237, 232, 220, 0.12], [28, 48, 56, 0.14]], '--nav-bg': [[10, 22, 27, 0.72], [247, 245, 239, 0.84]], '--menu-bg': [[10, 22, 27, 0.97], [247, 245, 239, 0.98]],
  '--pill-bg': [[16, 34, 42, 0.55], [28, 48, 56, 0.06]], '--ghost-line': [[237, 232, 220, 0.3], [28, 48, 56, 0.38]], '--shadow': [[10, 22, 27, 0.9], [10, 22, 27, 0]],
};
const lerpN = (a, b, t) => a + (b - a) * t, _clear = new THREE.Color();
function setLicht(k) {
  if (Math.abs(k - lichtK) < 0.002) return;
  lichtK = k;
  const st = document.documentElement.style, kt = smooth(0.42, 0.58, k);
  for (const [v, [a, b, txt]] of Object.entries(LICHT)) { const A = hexRGB(a), B = hexRGB(b), t = txt ? kt : k; st.setProperty(v, `rgb(${A.map((c, i) => Math.round(lerpN(c, B[i], t))).join(',')})`); }
  for (const [v, [A, B]] of Object.entries(LICHT_A)) st.setProperty(v, `rgba(${[0, 1, 2].map((i) => Math.round(lerpN(A[i], B[i], v === '--shadow' ? k : kt))).join(',')},${lerpN(A[3], B[3], v === '--shadow' ? k : kt).toFixed(3)})`);
  document.documentElement.classList.toggle('is-licht', kt > 0.5);
  if (renderer) { const A = hexRGB(LICHT['--ink'][0]), B = hexRGB(LICHT['--ink'][1]); renderer.setClearColor(_clear.setRGB(...A.map((c, i) => lerpN(c, B[i], k) / 255), THREE.SRGBColorSpace), 1); }
  dustU.uDust.value = k;
}
// Sonnenstaub: feine, warme Punkte, normal gemischt (auf Hell wäre additives Licht unsichtbar)
const dustU = { uDust: { value: 0 }, uTime: uniforms.uTime, uPix: uniforms.uPix };
let dust = null;
if (licht) {
  document.documentElement.classList.add('licht');
  const nD = isDesktop() ? 1600 : 700, dp = new Float32Array(nD * 3), dr = new Float32Array(nD * 3);
  for (let i = 0; i < nD; i++) { dp.set([(Math.random() - 0.5) * 20, (Math.random() - 0.5) * 11, (Math.random() - 0.5) * 4], i * 3); dr.set([Math.random(), Math.random(), Math.random()], i * 3); }
  const dg = new THREE.BufferGeometry();
  dg.setAttribute('position', new THREE.BufferAttribute(dp, 3)); dg.setAttribute('aR', new THREE.BufferAttribute(dr, 3));
  dust = new THREE.Points(dg, new THREE.ShaderMaterial({
    uniforms: dustU, transparent: true, depthWrite: false, depthTest: false,
    vertexShader: /* glsl */`
      attribute vec3 aR; uniform float uDust, uTime, uPix; varying float vA; varying float vW;
      void main(){
        vec3 p = position;
        p.y = mod(p.y + 5.5 + uTime * (.05 + aR.x * .09), 11.) - 5.5;   // steigt langsam im Licht
        p.x += sin(uTime * (.2 + aR.y * .3) + aR.z * 6.283) * .35;
        vec4 mv = viewMatrix * vec4(p, 1.); gl_Position = projectionMatrix * mv;
        float tw = .55 + .45 * sin(uTime * (.6 + aR.z) + aR.x * 40.);   // funkelt sacht
        gl_PointSize = uPix * (1.6 + aR.y * 3.) * 30. / -mv.z;
        vA = uDust * (.25 + .55 * aR.z) * tw; vW = aR.x;
      }`,
    fragmentShader: /* glsl */`
      varying float vA; varying float vW;
      void main(){ float d = length(gl_PointCoord - .5); if (d > .5) discard;
        vec3 col = mix(vec3(.8, .5, .12), vec3(.93, .68, .28), vW);
        gl_FragColor = vec4(col, smoothstep(.5, .1, d) * vA);
        #include <colorspace_fragment>
      }`,
  }));
  dust.frustumCulled = false; dust.renderOrder = 6; dust.visible = false;
  scene.add(dust);
}

// ---------- Kapitel → Formen ----------
const chapters = $$('.chapter');
const navLinks = $$('#chapters a'), chapNow = $('#chapNow');
// Handy/Tablet: Kapitelanzeige aufklappen → Kapitel wählen
const topNav = $('#top');
function setMenu(open) {
  topNav.classList.toggle('menu-open', open);
  chapNow.setAttribute('aria-expanded', String(open));
  chapNow.setAttribute('aria-label', open ? 'Kapitel schließen' : 'Kapitel wählen');
}
chapNow.addEventListener('click', (e) => { e.stopPropagation(); setMenu(!topNav.classList.contains('menu-open')); });
navLinks.forEach((a) => a.addEventListener('click', () => setMenu(false)));
document.addEventListener('click', (e) => { if (!e.target.closest('#chapters')) setMenu(false); });
addEventListener('keydown', (e) => { if (e.key === 'Escape' && topNav.classList.contains('menu-open')) { setMenu(false); chapNow.focus(); } });
addEventListener('resize', () => { if (VW > 1000) setMenu(false); });
let chapShown = -1;
let morphNow = 0;
function targetMorph() {
  const vh = VH;
  let m = 0;
  for (let i = 0; i < chapters.length; i++) {
    const r = chapters[i].getBoundingClientRect();
    const s = +chapters[i].dataset.stage;
    const prev = i ? +chapters[i - 1].dataset.stage : 0;
    // Übergang, während das Kapitel von unten hereinkommt
    let t = smooth(vh * 0.95, vh * 0.05, r.top); // Formwechsel über eine längere Strecke
    // Handy: die Figur löst sich schon beim ersten Scrollen an Ort und Stelle in Bewegungslinien auf
    if (!isDesktop() && prev === 0 && s === 1) t = smooth(vh * 0.03, vh * 0.4, scrollY);
    // Handy: Wirbelsäule → Haus kürzer, damit das Haus fertig in der Bildmitte steht, bevor der Text von Kapitel 04 kommt
    if (!isDesktop() && prev === 2 && s === 3) t = smooth(vh * 0.95, vh * 0.3, r.top);
    if (t > 0) m = prev + (s - prev) * t;
  }
  return m;
}

// ---------- Kapitel 04: Rundgang durch die Praxis (Punktwolke im Partikel-Haus) ----------
const tourEl = $('#tour'), roomCards = $$('.room-card'), roomBtns = $$('.roomnav button'), roomDots = $$('.room-dots button');
// Einrichtung „gestochen“: Scan-Linien (Wände, Boden, Kanten) leuchten, Möbel sind Körper mit Kern
// Aufbau erst, wenn #dach in Reichweite kommt (A1); danach blenden Linien und Möbel ein (tU.uReady)
let prx = null;
const tU = {
  uTime: uniforms.uTime, uPix: uniforms.uPix, uRot: uniforms.uHouseRot, uXf: { value: uniforms.uXf.value[3] },
  uCut: { value: -10 }, uOn: { value: 0 }, uRoom: { value: -1 }, uFade: { value: 1 }, uStip: { value: 1 }, uReady: { value: 0 },
  cBone: uniforms.cBone, cAmber: uniforms.cAmber, cBlue: uniforms.cBlue, cGreen: uniforms.cGreen, cPetrol: uniforms.cPetrol, cCore: { value: C('#0E1C22') },
};
const T_COMMON = /* glsl */`
  attribute float aKind, aRoom;
  uniform float uTime, uPix, uRot, uCut, uOn, uRoom, uFade, uStip, uReady; uniform vec4 uXf;
  uniform vec3 cBone, cAmber, cBlue, cGreen, cPetrol, cCore;
  vec3 rotY(vec3 p, float a){ float c=cos(a), s=sin(a); return vec3(c*p.x+s*p.z, p.y, -s*p.x+c*p.z); }
  float roomGain(){ float act = 1. - step(.5, abs(aRoom - uRoom)); return uRoom < -.5 ? 1. : mix(.42, 1.2, act); }`;
const tourPts = new THREE.Group();
tourPts.visible = false;
scene.add(tourPts);
function buildTour() {
  // 1) Scan-Linien: leuchtend, gleichmäßig (Wände, Boden, Kanten)
  const tourLines = new THREE.Points(prx.lines, new THREE.ShaderMaterial({
    uniforms: tU, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: T_COMMON + /* glsl */`
      varying vec3 vCol; varying float vA;
      void main(){
        vec3 p = rotY(position, uRot) * uXf.w + uXf.xyz;
        vec3 col = aKind < .5 ? cPetrol * .85 : aKind < 1.5 ? cBone * .42 : cBone * .85;
        col *= roomGain();
        float g = exp(-pow((position.y - uCut) * 14., 2.));
        col = mix(col, cAmber * 1.4, g);
        vec4 mv = viewMatrix * vec4(p, 1.);
        gl_Position = projectionMatrix * mv;
        float d = -mv.z, dn = d / uXf.w;
        gl_PointSize = clamp(uPix * (aKind > 5.5 ? 1.35 : 1.1) * 9. / d, 1., 3.5) * (1. + g);
        // nahe Wände und Kanten ausblenden (Schnittbild), sonst stehen sie als helle Streifen im Bild
        float nearFade = aKind > .5 ? smoothstep(.7, 1.9, dn) : smoothstep(.2, .85, dn);
        vA = step(position.y, uCut) * uOn * uFade * (aKind < .5 ? .5 : aKind < 1.5 ? .55 : .95) * nearFade * uReady;
        vCol = col;
      }`,
    fragmentShader: /* glsl */`
      varying vec3 vCol; varying float vA;
      void main(){ float d = length(gl_PointCoord - .5); gl_FragColor = vec4(vCol, smoothstep(.5, .12, d) * vA);
        #include <colorspace_fragment>
      }`,
  }));
  // 2) Möbel: gestochene Punkte (deckend, beleuchtet) …
  const tourFurn = new THREE.Points(prx.furn, new THREE.ShaderMaterial({
    uniforms: tU,
    vertexShader: T_COMMON + /* glsl */`
      varying vec3 vCol; varying float vVis;
      void main(){
        vec3 p = rotY(position, uRot) * uXf.w + uXf.xyz;
        vec3 n = normalize(rotY(normal, uRot));
        vec3 V = normalize(cameraPosition - p);
        float lam = max(dot(n, normalize(vec3(.4, .8, .5))), 0.), rim = pow(1. - abs(dot(n, V)), 3.);
        vec3 base = aKind < 2.5 ? cBone : aKind < 3.5 ? cGreen : aKind < 4.5 ? cAmber : aKind < 5.5 ? mix(cPetrol * 1.7, cBlue, .3) : cBone;
        vec3 col = base * (.24 + .76 * lam) + cBlue * rim * .12;
        col *= roomGain() * (.25 + .75 * uFade) * uReady;
        float g = exp(-pow((position.y - uCut) * 14., 2.));
        col = mix(col, cAmber * 1.4, g);
        vec4 mv = viewMatrix * vec4(p, 1.);
        gl_Position = projectionMatrix * mv;
        float d = -mv.z, dn = d / uXf.w;
        gl_PointSize = clamp(uStip / d, 1., 3.6) * (1. + g * .6);
        // nah an der Kamera: Punkte lösen sich auf (zufällig, statt hart abzuschneiden)
        float h = fract(sin(dot(position.xz, vec2(12.9898, 78.233)) + position.y * 37.7) * 43758.5453);
        vVis = step(position.y, uCut) * uOn * step(h, smoothstep(.25, .8, dn));
        vCol = col;
      }`,
    fragmentShader: /* glsl */`
      varying vec3 vCol; varying float vVis;
      void main(){ float d = length(gl_PointCoord - .5); if (vVis < .5 || d > .5) discard;
        gl_FragColor = vec4(vCol * (1. - smoothstep(.2, .5, d) * .45), 1.);
        #include <colorspace_fragment>
      }`,
  }));
  // … 3) auf dunklem Kern (verdeckt Rückseiten, macht die Möbel zu Körpern)
  const tourCore = new THREE.Mesh(prx.core, new THREE.ShaderMaterial({
    uniforms: tU,
    vertexShader: T_COMMON + /* glsl */`
      varying float vY, vD, vL;
      void main(){
        vec3 p = rotY(position - normal * .006, uRot) * uXf.w + uXf.xyz;
        vL = max(dot(normalize(rotY(normal, uRot)), normalize(vec3(.4, .8, .5))), 0.);
        vY = position.y;
        vec4 mv = viewMatrix * vec4(p, 1.); vD = -mv.z / uXf.w;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */`
      uniform float uCut, uOn; uniform vec3 cCore, cBone; varying float vY, vD, vL;
      void main(){ if (vY > uCut || uOn < .5 || vD < .45) discard;
        gl_FragColor = vec4(cCore + cBone * vL * .04, 1.);
        #include <colorspace_fragment>
      }`,
  }));
  [tourLines, tourFurn, tourCore].forEach((o) => { o.frustumCulled = false; tourPts.add(o); });
}
whenNear($('#dach'), () => runSliced(praxisScanGen(isDesktop() ? 85000 : 32000, isDesktop() ? 1 : 0.62)).then((r) => { prx = r; buildTour(); }));

// Raum-Beschriftungen im Raum
// Schilder im Haus (Stil wie Design „Zuhause“): Nummer, Raum, darunter was dort wartet
const ROOM_SUB = ['Ankommen', 'Wohnzimmer', 'Manuelle Therapie & mehr', 'Manuthera', 'Bewegung'];
const tagHTML = (no, label, sub, cta) => `<i>${no}</i><span><b>${label}</b><small class="s-norm">${sub}</small>${cta ? `<small class="s-cta">${cta}</small>` : ''}</span>`;
const roomTags = ROOMS.map((r, i) => {
  const el = document.createElement('div'); el.className = 'room-tag' + (i === 3 ? ' hi' : ''); el.setAttribute('aria-hidden', 'true');
  el.innerHTML = tagHTML(String(i + 1).padStart(2, '0'), i === 3 ? 'Manuthera' : r.short, ROOM_SUB[i], i === 3 ? '▶ in Bewegung ansehen' : ''); document.body.appendChild(el);
  el.addEventListener('pointerenter', () => (hoverRoom = i)); el.addEventListener('pointerleave', () => (hoverRoom = -1));
  // Im Röntgenblick ist Raum 04 ein Knopf direkt zur Manuthera-Bühne, im Rundgang ein normales Raum-Schild
  el.addEventListener('click', () => { if (el.classList.contains('cta')) { const t = $('#manuthera'); if (t) scrollToY(t.getBoundingClientRect().top + scrollY); } else goRoom(i); });
  const [x, y, w, h] = r.r; const [cx, cz] = P(x + w / 2, y + h / 2);
  return { el, p: new V3(cx, EYE + 0.55, cz) };
});
// Manuthera-Knopf am rechten Rand von Behandlung 2 (ragt nach rechts aus dem Haus, überdeckt keine anderen Schilder)
const manuCtaP = (() => { const [x, z] = P(404, 136); return new V3(x, EYE + 0.05, z); })();
// Zusatz-Schild im Röntgenblick: Tür → Kontakt (Wirbelsäule hat ihr eigenes Kapitel 03, das Modell steht nur im Raum)
const extraTags = [
  { no: '00', label: 'Tür', sub: 'Termin & Kontakt', at: (() => { const [x, z] = P(199, 272); return new V3(x, -3 + 0.5, z + 0.12); })(), to: '#tuer' },
].map((t) => {
  const el = document.createElement('div'); el.className = 'room-tag extra'; el.setAttribute('aria-hidden', 'true');
  el.innerHTML = tagHTML(t.no, t.label, t.sub); document.body.appendChild(el);
  el.addEventListener('click', () => { const tg = $(t.to); if (tg) scrollToY(tg.getBoundingClientRect().top + scrollY); });
  return { el, p: t.at };
});
// Kamera-Stationen in Form-Koordinaten [Grundriss x, Grundriss y, Höhe]
const TS = (px, py, y) => { const [x, z] = P(px, py); return new V3(x, y, z); };
const TOUR = {
  entry: { pos: TS(199, 330, -2.0), tgt: TS(199, 150, -2.3) },
  rooms: [
    { pos: TS(160, 132, EYE), tgt: TS(58, 44, EYE - 0.22) },
    { pos: TS(160, 150, EYE), tgt: TS(56, 250, EYE - 0.22) },
    { pos: TS(238, 88, EYE), tgt: TS(340, 40, EYE - 0.2) },
    { pos: TS(238, 172, EYE), tgt: TS(340, 130, EYE - 0.2) },
    { pos: TS(238, 266, EYE), tgt: TS(376, 204, EYE - 0.2) },
  ],
  bird: { pos: TS(210, 330, 2.6), tgt: TS(210, 128, -3) },
};
const TOUR_ROT = -0.3;
const toWorld = (v) => { const X = uniforms.uXf.value[3]; return v.clone().applyAxisAngle(new V3(0, 1, 0), uniforms.uHouseRot.value).multiplyScalar(X.w).add(new V3(X.x, X.y, X.z)); };
function tourPose(st) {
  const T = toWorld(st.tgt), Pw = toWorld(st.pos), desk = isDesktop(), X = uniforms.uXf.value[3];
  // in den Räumen weiter zurück und etwas höher (Puppenhaus-Blick); nahe Wände blenden aus
  const inRoom = TOUR.rooms.includes(st), dir = Pw.clone().sub(T);
  if (inRoom) dir.y += 0.42 * X.w;
  const d = dir.length() * (inRoom ? (desk ? 1.85 : 3.0) : 1);
  return frame(T, dir, d * (desk && inRoom ? 1.12 : 1), desk ? 0.68 : 0.5, desk ? 0.5 : 0.3);
}
let roomOn = -1;
function setRoom(i) {
  if (i === roomOn) return; roomOn = i;
  [roomCards, roomBtns, roomDots].forEach((list) => list.forEach((el, k) => el.classList.toggle('is-on', k === i)));
}
// Rundgang ohne Scrollen: Räume per Klick, Pfeil, Wischen oder Pfeiltaste; „Rundgang starten“ fährt selbst
// tourIdx: -1 draußen (Übersicht/Röntgenblick), 0–4 Räume, 5 Grundriss von oben
let tourIdx = -1, insideK = 0, viaEntry = 0, autoTour = false, autoT = 0;
const tourPlay = $('#tourPlay'), tourProg = $('#tourProg');
const TOUR_STEP = reduced ? 6.5 : 5, TOUR_BIRD = 3.5;
function tourInView() { const r = tourEl.getBoundingClientRect(); return r.top < VH * 0.5 && r.bottom > VH * 0.5; }
function bringTourIntoView() { const r = tourEl.getBoundingClientRect(); if (Math.abs(r.top) > 4 && !(r.top <= 0 && r.bottom >= VH)) scrollToY(r.top + scrollY + 2); }
function setAuto(on) {
  autoTour = on; autoT = 0;
  tourEl.classList.toggle('auto', on);
  if (tourPlay) { tourPlay.setAttribute('aria-pressed', on ? 'true' : 'false'); tourPlay.querySelector('span').textContent = on ? 'Rundgang anhalten' : 'Rundgang starten'; }
}
function goRoom(i, fromAuto) {
  i = Math.max(-1, Math.min(5, i));
  if (tourIdx < 0 && i >= 0) viaEntry = reduced ? 0 : 0.9; // erst durch die Tür
  tourIdx = i;
  tourEl.classList.toggle('in', i >= 0);
  if (!fromAuto) setAuto(false);
  if (i >= 0) bringTourIntoView();
}
function tourStep(d) { goRoom(tourIdx < 0 ? (d > 0 ? 0 : 4) : tourIdx + d > 5 ? -1 : tourIdx + d); }
roomBtns.forEach((b) => b.addEventListener('click', () => goRoom(+b.dataset.room)));
roomDots.forEach((d) => d.addEventListener('click', () => goRoom(+d.dataset.room)));
$('#tourPrev')?.addEventListener('click', () => tourStep(-1));
$('#tourNext')?.addEventListener('click', () => tourStep(1));
$('#tourExit')?.addEventListener('click', () => goRoom(-1));
tourPlay?.addEventListener('click', () => { if (autoTour) setAuto(false); else { goRoom(0, true); setAuto(true); } });
addEventListener('keydown', (e) => {
  if (!tourInView() || e.altKey || e.ctrlKey || e.metaKey || /input|textarea|select/i.test(document.activeElement?.tagName || '')) return;
  if (e.key === 'ArrowRight') { e.preventDefault(); tourStep(1); }
  else if (e.key === 'ArrowLeft') { e.preventDefault(); tourStep(-1); }
  else if (e.key === 'Escape' && tourIdx >= 0) goRoom(-1);
});
// Wischen über das Haus (Handy): waagerecht = Raum wechseln, senkrecht bleibt Scrollen
{ let x0 = null, y0 = 0; const st = $('.tour-sticky');
  st?.addEventListener('touchstart', (e) => { if (e.target.closest('a,button')) return; x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; }, { passive: true });
  st?.addEventListener('touchend', (e) => { if (x0 === null) return; const t = e.changedTouches[0], dx = t.clientX - x0, dy = t.clientY - y0; x0 = null; if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.3) tourStep(dx < 0 ? 1 : -1); }, { passive: true }); }
let tourWant = null, tourHide = 0, xray = 0, dragRot = 0, hoverRoom = -1;
// Schild „Manuthera“ an der Liege in Raum 04 (Röntgenblick und Rundgang, PC und Handy)
const manuTag = document.createElement('a');
manuTag.className = 'manu-tag'; manuTag.href = '#manuthera'; manuTag.setAttribute('aria-label', 'Manuthera ansehen');
manuTag.innerHTML = '<b class="dot" aria-hidden="true"></b>Manuthera <span aria-hidden="true">↓</span>';
($('main') || document.body).appendChild(manuTag);
manuTag.addEventListener('click', (e) => { e.preventDefault(); const t = $('#manuthera'); if (t) scrollToY(t.getBoundingClientRect().top + scrollY); });
const manuTagP = (() => { const [x, z] = P(320, 136); return new V3(x, EYE - 0.22, z); })();
let manuTagVis = 0;
// rechte Kante der linken Textspalte im Rundgang (PC); Schilder im Raum bleiben rechts davon
function textColRight() {
  if (!isDesktop()) return -1e9;
  const r = $('.roomnav')?.getBoundingClientRect();
  return r && r.width ? r.right + 16 : -1e9;
}
function placeManuTag() {
  const w = toWorld(manuTagP); w.project(camera);
  const sx = (w.x * 0.5 + 0.5) * VW;
  const vis = manuTagVis * (w.z < 1 && Math.abs(w.x) < 0.92 && Math.abs(w.y) < 0.85 && sx - manuTag.offsetWidth / 2 > textColRight() ? 1 : 0) * (1 - manuK);
  manuTag.style.opacity = vis.toFixed(2);
  manuTag.classList.toggle('on', vis > 0.3);
  manuTag.tabIndex = vis > 0.3 ? 0 : -1; // unsichtbar auch nicht per Tastatur erreichbar
  if (vis > 0) manuTag.style.transform = `translate(${((w.x * 0.5 + 0.5) * VW).toFixed(1)}px, ${((-w.y * 0.5 + 0.5) * VH - 30).toFixed(1)}px) translate(-50%, -100%)`;
}
// Haus mit gedrückter Maus drehen (PC, Röntgenblick)
{ let down = null; addEventListener('pointerdown', (e) => { if (xray > 0.4 && e.pointerType === 'mouse' && e.clientX > VW * 0.45 && !e.target.closest('a,button,.room-tag')) down = e.clientX; });
  addEventListener('pointermove', (e) => { if (down !== null) { dragRot += (e.clientX - down) * 0.006; down = e.clientX; } });
  addEventListener('pointerup', () => (down = null)); }
function xrayPose() {
  const X = uniforms.uXf.value[3], desk = isDesktop();
  return frame(toWorld(new V3(0, -1.75, 0.1)), new V3(0.18, 0.62, 1), (desk ? 20 : 17) * X.w, desk ? 0.69 : 0.5, desk ? 0.56 : 0.3);
}
function updateTour(dt) {
  manuTagVis = 0;
  const r = tourEl.getBoundingClientRect(), vh = VH, desk = isDesktop();
  const near = r.top < vh && r.bottom > 0 && morphNow > 2.6 && morphNow < 3.4;
  if (tourIdx >= 0 && !tourInView()) goRoom(-1); // weggescrollt → wieder draußen
  // Rundgang-Film
  if (autoTour && tourIdx >= 0 && !paused) {
    autoT += dt;
    const dur = tourIdx === 5 ? TOUR_BIRD : TOUR_STEP;
    if (tourProg) tourProg.style.width = (((tourIdx + Math.min(1, autoT / dur)) / 6) * 100).toFixed(1) + '%';
    if (autoT > dur) { autoT = 0; if (tourIdx < 5) goRoom(tourIdx + 1, true); else { setAuto(false); goRoom(-1); } }
  } else if (tourProg && !autoTour) tourProg.style.width = '0%';
  // Scan hinein/hinaus (Boden → Decke)
  const want = near && tourIdx >= 0 ? 1 : 0;
  insideK = reduced ? want : insideK + (want - insideK) * (1 - Math.exp(-dt * (want ? 1.5 : 2.6)));
  const inside = near ? insideK : 0;
  // Röntgenblick (PC): von außen leuchtet das Innere durch das Haus, das Dach schwebt angehoben
  // Handy: erst steht das Haus groß in der Bildmitte; der Röntgenblick (Haus oben) kommt mit dem Text von unten
  const pvIn = desk ? smooth(2.55, 2.95, morphNow) : Math.min(smooth(2.7, 2.95, morphNow), smooth(vh * 1.02, vh * 0.72, roofIntro.getBoundingClientRect().top));
  const pv = morphNow > 2.55 && morphNow < 3.45 ? pvIn * (1 - smooth(3.05, 3.45, morphNow)) * (1 - inside) * (1 - manuK) * (1 - listK) : 0;
  xray = pv;
  tU.uCut.value = inside > 0.001 ? -3.05 + inside * 1.9 : (pv > 0 ? -1.0 : -10);
  tU.uOn.value = inside > 0.001 || pv > 0 ? 1 : 0; tourPts.visible = inside > 0.001 || pv > 0;
  tU.uFade.value = inside > 0.001 ? Math.max(inside, pv * 0.55) : pv * 0.55;
  tU.uReady.value = prx ? ramp(tU.uReady.value, dt) : 0;
  if (prx) tU.uStip.value = (renderer ? renderer.getPixelRatio() : 1) * VH * 0.5 / Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * prx.spacing * uniforms.uXf.value[3].w * 0.62;
  uniforms.uRoofLift.value += (Math.max(pv * 1.3, inside * 1.1) - uniforms.uRoofLift.value) * 0.08;
  tourHide = Math.min(1, inside * 1.4);
  // Hausdrehung festhalten, solange wir drinnen sind
  const free = Math.sin(uniforms.uTime.value * 0.2) * 0.45 - 0.55 + dragRot;
  uniforms.uHouseRot.value = THREE.MathUtils.lerp(free, TOUR_ROT, smooth(0, 0.6, inside));
  if (tourIdx < 0) {
    // Röntgenblick: Kamera leicht von oben (wie im Design „Zuhause“), damit sich die Schilder nicht überlagern
    tourWant = pv > 0.3 ? xrayPose() : null;
    if (pv > 0.3) { // Räume, Tür und Modell als anklickbare Schilder
      tU.uRoom.value = hoverRoom;
      const place = (t, i, p, right) => { const w = toWorld(p); w.project(camera); t.el.classList.add('click'); t.el.classList.toggle('on', i === hoverRoom); t.el.style.opacity = pv; t.el.style.transform = `translate(${(w.x * 0.5 + 0.5) * VW}px, ${(-w.y * 0.5 + 0.5) * vh}px) translate(${right ? '-12%' : '-50%'}, -50%)`; };
      roomTags.forEach((t, i) => { t.el.classList.toggle('cta', i === 3); place(t, i, i === 3 ? manuCtaP : t.p.clone().setY(EYE + 0.2), i === 3); });
      extraTags.forEach((t) => place(t, -9, t.p));
    } else { tU.uRoom.value = -1; [...roomTags, ...extraTags].forEach((t) => { t.el.classList.remove('click'); t.el.style.opacity = 0; }); }
    return;
  }
  roomTags.forEach((t) => t.el.classList.remove('click', 'cta'));
  extraTags.forEach((t) => { t.el.classList.remove('click'); t.el.style.opacity = 0; });
  // Kamera: erst durch die Tür, dann zum Raum (die Kamera gleitet weich hinüber)
  if (viaEntry > 0) viaEntry -= dt;
  const room = tourIdx <= 4 ? tourIdx : -1;
  const st = viaEntry > 0 ? tourPose(TOUR.entry) : tourPose(tourIdx === 5 ? TOUR.bird : TOUR.rooms[tourIdx]);
  setRoom(room); // Grundriss von oben: keine Raumkarte
  tU.uRoom.value = room;
  manuTagVis = room === 3 ? smooth(0.85, 1, inside) : 0;
  tourWant = st;
  // Beschriftungen (nie über der linken Textspalte mit Raum-Knöpfen und Karte)
  const colR = textColRight();
  roomTags.forEach((t, i) => {
    const w = toWorld(t.p); w.project(camera);
    const sx = (w.x * 0.5 + 0.5) * VW;
    const vis = desk && inside > 0.9 && w.z < 1 && Math.abs(w.x) < 0.95 && Math.abs(w.y) < 0.9 && sx - t.el.offsetWidth / 2 > colR;
    t.el.style.opacity = vis ? (i === room ? 1 : 0.55) : 0;
    t.el.classList.toggle('on', i === room);
    if (vis) t.el.style.transform = `translate(${(w.x * 0.5 + 0.5) * VW}px, ${(-w.y * 0.5 + 0.5) * vh}px) translate(-50%, -50%)`;
  });
}

// ---------- Lebende Überschriften ----------
function splitLetters(el) {
  const lbl = el.cloneNode(true); lbl.querySelectorAll('br').forEach((br) => br.replaceWith(' '));
  el.setAttribute('aria-label', lbl.textContent.replace(/\s+/g, ' ').trim());
  let i = 0;
  const walk = (node) => [...node.childNodes].forEach((n) => {
    if (n.nodeType === 3) {
      const frag = document.createDocumentFragment();
      n.textContent.split(/(\s+)/).forEach((w) => {
        if (!w) return;
        if (!w.trim()) { frag.appendChild(document.createTextNode(w)); return; }
        const word = document.createElement('span'); word.className = 'lw'; word.setAttribute('aria-hidden', 'true');
        [...w].forEach((c) => { const sp = document.createElement('span'); sp.className = 'lt'; sp.textContent = c; sp.style.setProperty('--i', i++); word.appendChild(sp); });
        frag.appendChild(word);
      });
      n.replaceWith(frag);
    } else if (n.nodeType === 1 && n.tagName !== 'BR') walk(n);
  });
  walk(el);
  return $$('.lt', el);
}
const rnd2 = (a) => (Math.random() * 2 - 1) * a;
// 03 Achse: Buchstaben stehen schief wie eine Fehlstellung und richten sich beim Hereinscrollen aus
const aTitle = $('#a-title');
splitLetters(aTitle).forEach((l) => { l.style.setProperty('--dy', rnd2(0.32).toFixed(2) + 'em'); l.style.setProperty('--rot', rnd2(13).toFixed(1) + 'deg'); });
// 04 Dach: Dachlinie zeichnet sich über die Überschrift, die Buchstaben kommen darunter zur Ruhe
const dTitle = $('#d-title'), roofLetters = splitLetters(dTitle);
dTitle.insertAdjacentHTML('beforebegin', '<svg class="roofline" viewBox="0 0 300 40" preserveAspectRatio="none" aria-hidden="true"><path d="M2 38 L150 3 L298 38" pathLength="1"/></svg>');
const roofline = $('.roofline path');
// 05 Tür: Buchstaben setzen Schritt für Schritt auf, danach in Abständen ein kleiner Gang
const tTitle = $('#t-title');
splitLetters(tTitle);
new IntersectionObserver((es, ob) => es.forEach((e) => { if (e.isIntersecting) { tTitle.classList.add('walk'); ob.disconnect(); } }), { threshold: 0.4 }).observe(tTitle);
// Leistungen: ein Impuls läuft durch den Namen (Maus darüber bzw. beim Durchscrollen auf dem Handy)
const ixRows = $$('.index li').map((li) => {
  const name = $('.ix-name', li); splitLetters(name);
  const fire = () => { name.classList.remove('wave'); void name.offsetWidth; name.classList.add('wave'); };
  $('button', li).addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') fire(); });
  return { li, fire, last: 0 };
});
function livingHeadlines() {
  if (reduced) return;
  const vh = VH;
  aTitle.style.setProperty('--mis', smooth(vh * 0.3, vh * 0.85, aTitle.getBoundingClientRect().top).toFixed(3));
  const dt2 = dTitle.getBoundingClientRect().top, k = 1 - smooth(vh * 0.45, vh * 0.92, dt2);
  roofline.style.strokeDashoffset = (1 - smooth(0.05, 0.75, k)).toFixed(3);
  roofLetters.forEach((l, i) => { const lp = clamp(k * 1.7 - i * 0.03); l.style.transform = lp >= 1 ? '' : `translateY(${(-(1 - lp) * 0.45).toFixed(3)}em)`; l.style.opacity = (0.25 + 0.75 * lp).toFixed(3); });
  if (!isDesktop()) {
    const now = performance.now();
    ixRows.forEach((r) => { const b = r.li.getBoundingClientRect(); const c = b.top + b.height / 2; if (Math.abs(c - vh * 0.5) < b.height * 0.5 && now - r.last > 2500) { r.last = now; r.fire(); } });
  }
}

// ---------- Dach (Handy): Haus wird beim Scrollen zum kleinen Emblem oben rechts ----------
const roofHead = $('#allTitle');
function roofEmblem() {
  const vh = VH, a = VW / vh;
  const hh = 13 * Math.tan(THREE.MathUtils.degToRad(17.5)), hw = hh * a;
  const k = smooth(vh * 0.62, vh * 0.12, roofHead.getBoundingClientRect().top);
  const navW = (78 / vh) * 2 * hh; // Leistenhöhe in Welt-Einheiten
  // groß: Haus mittig unter der Leiste, Breite ≈ 86 % des Bildes (Auftrag 1, 4.11.; vorher y 2.5, s 0.42 = oben)
  const bs = Math.min(0.52, (hw * 2 * 0.86) / 7.1);
  const big = { x: 0, y: 0.16 + 0.55 * bs, s: bs }, small = { x: hw - 0.48, y: hh - navW - 0.42, s: 0.085 };
  uniforms.uXf.value[3].set(big.x + (small.x - big.x) * k, big.y + (small.y - big.y) * k, 0, big.s + (small.s - big.s) * k);
  emblemK = k;
}
let emblemK = 0;

// ---------- Manuthera (Kapitel 04, nach dem Rundgang): eigene Bühne, rendert nur, wenn sichtbar ----------
const manuSec = $('#manuthera');
const manuBtns = [...document.querySelectorAll('#manuModes button')], manuRead = $('#manuRead');
// Aufbau erst, wenn #manuthera in Reichweite kommt (A1); die Bühne blendet ein, sobald sie fertig ist
let manu = null;
const manuUi = {
  transparent: true,
  isPaused: () => paused,
  onMode(i) {
    manuBtns.forEach((b, j) => { b.classList.toggle('is-on', j === i); b.setAttribute('aria-pressed', j === i ? 'true' : 'false'); b.querySelector('i').style.width = '0'; });
    manuRead.textContent = MANU_MODES[i].txt;
  },
  onAmount(a) { const b = manuBtns.find((x) => x.classList.contains('is-on')); if (b) b.querySelector('i').style.width = (a * 100).toFixed(1) + '%'; },
};
if (manuRead) manuRead.textContent = MANU_MODES[0].txt;
manuBtns.forEach((b, i) => b.addEventListener('click', () => { if (manu) manu.select(i, true); }));
const glWait = (cv) => cv && cv.classList.add('gl-wait');
const glReady = (cv) => cv && cv.classList.remove('gl-wait');
if (manuSec) {
  glWait($('#glManu'));
  whenNear(manuSec, () => runSliced(initManuGen($('#glManu'), manuUi)).then((m) => { manu = m; if (!m) noGl(); glReady($('#glManu')); }));
}
// ---------- Leistungen: Partikel-Bühne mit Motiv je Leistung (Haus tritt hier zurück) ----------
const servList = $('.roof-list'), servName = $('#servName');
// Aufbau erst, wenn „Alle Leistungen“ in Reichweite kommt (A1)
let serv = null;
glWait($('#glServ'));
whenNear(roofHead, () => runSliced(initServicesGen($('#glServ'), { isPaused: () => paused, onShow: (i, name) => { if (servName) servName.textContent = name; } })).then((m) => { serv = m; if (!m) noGl(); glReady($('#glServ')); }));
let servLock = -1e9, servAutoT = 0;
const servItems = $$('#index li');
servItems.forEach((li, i) => {
  const b = li.querySelector('button');
  b.addEventListener('pointerenter', () => { if (serv && isDesktop()) { serv.show(i); servLock = performance.now(); } });
  b.addEventListener('focus', () => { if (serv) { serv.show(i); servLock = performance.now(); } });
  b.addEventListener('click', () => { if (serv) { serv.show(i); servLock = performance.now(); } });
});
let listK = 0;
function updateServices(dt) {
  if (!servList) return;
  const r = servList.getBoundingClientRect(), vh = VH;
  listK = smooth(0.1, 0.45, clamp((Math.min(r.bottom, vh) - Math.max(r.top, 0)) / vh));
  if (!serv || !serv.st.visible) return;
  if (!isDesktop()) { // Handy: Eintrag in Bildschirmmitte bestimmt das Motiv
    let best = -1, bd = 1e9; servItems.forEach((li, i) => { const b = li.getBoundingClientRect(), d = Math.abs(b.top + b.height / 2 - vh * 0.62); if (d < bd) { bd = d; best = i; } });
    if (best >= 0 && performance.now() - servLock > 2500) serv.show(best);
  } else if (performance.now() - servLock > 7000 && !paused) { // PC ohne Maus: Motive wechseln ruhig durch
    servAutoT += dt; if (servAutoT > 4.5) { servAutoT = 0; serv.show((serv.current + 1) % servItems.length); }
  }
  serv.update(0, dt);
  serv.st.renderer.render(serv.st.scene, serv.st.camera);
}
// Wie viel der Bühne im Bild ist (0..1) → Hintergrund-Partikel und Röntgenblick treten zurück
let manuK = 0;
function manuVisible() {
  if (!manuSec) return 0;
  const r = manuSec.getBoundingClientRect(), vh = VH;
  return smooth(0.15, 0.55, clamp((Math.min(r.bottom, vh) - Math.max(r.top, 0)) / vh));
}

// ---------- Schleife ----------
const timer = new THREE.Timer(); // (THREE.Clock ist veraltet)
const top = $('#top');
// Handy: im Stillstand nur jedes zweite Bild rendern (Akku), beim Scrollen volle Rate
let lastInput = 0, frameN = 0;
['scroll', 'touchmove', 'pointermove'].forEach((ev) => addEventListener(ev, () => (lastInput = performance.now()), { passive: true }));
// Taktgeber-Reserve: iOS hält requestAnimationFrame in eingebetteten Vorschau-Rahmen an, solange niemand
// berührt. Dann übernimmt ein Zeitgeber (≈ 30 Bilder/s), damit die Seite auch im Stillstand lebt.
let lastTick = performance.now(), viaWatchdog = false;
setInterval(() => {
  if (document.hidden || performance.now() - lastTick < 120) return;
  viaWatchdog = true; gsap.ticker.tick(); viaWatchdog = false;
}, 33);
function tick() {
  lastTick = performance.now();
  frameN++;
  if (!viaWatchdog && !isDesktop() && performance.now() - lastInput > 1500 && frameN % 2) return;
  timer.update();
  const dt = Math.min(timer.getDelta(), 0.05);
  uniforms.uTime.value += paused ? 0 : dt * CALM;
  uniforms.uCalm.value += ((calm ? 1 : 0) - uniforms.uCalm.value) * Math.min(1, dt * 0.8);
  uniforms.uBreath.value += paused ? 0 : dt * CALM * (1.15 - uniforms.uCalm.value * 0.45);
  const tm = targetMorph();
  morphNow += (tm - morphNow) * (reduced ? 1 : 1 - Math.exp(-dt * 2.4));
  uniforms.uMorph.value = morphNow;
  manuK = manuVisible();
  updateAxis(dt);
  updateTour(dt);
  placeManuTag();
  { // Kamera: Rundgang > Wirbelsäule > Übersicht
    const want = tourWant || axisWant || OVERVIEW, k = reduced ? 1 : 1 - Math.exp(-dt * 2.2);
    cam.pos.lerp(want.pos, k); cam.target.lerp(want.target, k);
  }
  // Partikel abdunkeln, sobald Text darüber liegt (Kontakt immer; mobil auch hinter den Bewegungslinien)
  const vh = VH;
  const doorTop = door.getBoundingClientRect().top;
  let dim = isDesktop() ? smooth(vh * 0.75, vh * 0.25, doorTop) : smooth(vh * 1.3, vh * 0.8, doorTop);
  const dimMax = 1; // Kontakt: Partikel blenden ganz aus (Handy und PC)
  if (!isDesktop()) {
    if (morphNow > 0.3 && morphNow < 1.6) dim = Math.max(dim, 0.55); // Bewegungslinien leise hinter Text
  }
  if (isDesktop() && morphNow > 0.12 && morphNow < 0.9) dim = Math.max(dim, 0.4 * Math.sin(Math.PI * (morphNow - 0.12) / 0.78));
  dim = Math.max(dim, tourHide, xray * 0.4); // im Rundgang/Röntgenblick tritt das äußere Partikel-Haus zurück
  dim = Math.max(dim, manuK, listK); // Manuthera-Bühne und Leistungen: Partikel-Hintergrund blendet ganz aus
  if (licht && lichtK > 0) dim = Math.max(dim, lichtK); // K1: Partikel weichen dem Sonnenstaub
  uniforms.uAlpha.value += ((1 - dim * dimMax) - uniforms.uAlpha.value) * 0.1;
  uniforms.uSize.value = isDesktop() ? 1 : 1.1 - (morphNow > 2.5 && morphNow < 3.5 ? emblemK * 0.45 : 0);
  uniforms.uSpread.value = reduced ? 0 : isDesktop() ? 0.32 : 0.28;
  if (!isDesktop()) roofEmblem();
  livingHeadlines();
  uniforms.uFadeMid.value = isDesktop() ? 0.62 : 0.7;

  // Titel
  if (!reduced && morphNow < 0.8) chars.forEach((c, i) => {
    let w;
    if (finePointer) {
      const r = c.getBoundingClientRect(), d = Math.hypot(r.left + r.width / 2 - ptr.x, r.top + r.height / 2 - ptr.y);
      w = 200 + 600 * smooth(40, 380, d);
    } else w = 520 + Math.sin(uniforms.uTime.value * 1.6 - i * 0.45) * 280;
    c.style.setProperty('--w', Math.round(w));
  });

  // Manifest
  const sr = statement.getBoundingClientRect();
  const sp = clamp((VH * 0.85 - sr.top) / (sr.height + VH * 0.35));
  const lit = Math.floor(sp * words.length * 1.1);
  words.forEach((w, i) => w.classList.toggle('lit', reduced || i < lit));

  // Hausordnung
  const rr = rules.getBoundingClientRect();
  const rp = clamp(-rr.top / Math.max(1, rr.height - VH));
  if (licht) { const k = smooth(0.4, 1, rp); setLicht(k); if (dust) dust.visible = k > 0.01; }
  const li = Math.min(laws.length - 1, Math.floor(rp * laws.length));
  if (li !== lawOn) { laws[lawOn].classList.remove('is-on'); laws[li].classList.add('is-on'); lawOn = li; }

  // Navigation
  top.classList.toggle('scrolled', scrollY > 30);
  const ci = Math.round(clamp(morphNow, 0, 4));
  const rr2 = rules.getBoundingClientRect();
  const chapKey = rr2.top < VH * 0.5 && rr2.bottom > VH * 0.5 ? 9 : ci;
  // Leiste: 01–04, § Hausordnung (Eintrag 4), 05 Tür (Eintrag 5) – Kais Wunsch 2.11.: Hausordnung auch am PC in der Leiste
  const navIdx = chapKey === 9 ? 4 : ci >= 4 ? 5 : ci;
  navLinks.forEach((a, k) => a.classList.toggle('on', k === navIdx));
  if (chapKey !== chapShown) { chapShown = chapKey; chapNow.innerHTML = navLinks[navIdx].innerHTML; }

  camera.position.copy(cam.pos); camera.lookAt(cam.target);
  if (renderer && !document.hidden) renderer.render(scene, camera);
  if (manu && manu.st.visible && !document.hidden) { manu.update(0, dt); manu.st.renderer.render(manu.st.scene, manu.st.camera); }
  if (!document.hidden) updateServices(dt);
  updateHints(dt);
}
gsap.ticker.add(tick);


// ---------- Klickbares kenntlich machen (Go 1.11.2026, Variante A) ----------
// Stufe 1: Termin-Knöpfe schlagen ab und zu wie ein Herz (nur in Ruhe, immer nur einer, Abstand wächst).
// Stufe 2: Knopf-Gruppen werden beim ersten Hereinkommen einmal „gescannt“; Leistungen haben ein „+“.
// Stufe 3: Bilder zum Anfassen zeigen nach kurzer Zeit einen Wisch-Hinweis, bis man sie berührt.
// Alles ruht bei „Bewegung anhalten“ und „Bewegung reduzieren“.
const inView = (el) => { if (!el) return false; const r = el.getBoundingClientRect(); return r.width > 0 && r.bottom > 0 && r.top < VH && r.right > 0 && r.left < VW; };
{
  const beatBtns = [$('.hero .btn:not(.btn-ghost)'), $('.door .btn:not(.btn-ghost)'), $('.top .btn-small')].filter(Boolean);
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
{
  const groups = [$('.segnav'), $('.roomnav'), $('#manuModes'), $('#index')].filter(Boolean);
  groups.forEach((g) => $$('button', g).forEach((b, i) => { b.classList.add('sheen'); b.style.setProperty('--si', i); }));
  if (!reduced) {
    const io = new IntersectionObserver((es) => es.forEach((e) => {
      if (!e.isIntersecting || paused) return;
      e.target.classList.add('scan-run'); io.unobserve(e.target);
    }), { threshold: 0.6 });
    groups.forEach((g) => io.observe(g));
  }
}
const mkHint = (txt, parent) => {
  const h = document.createElement('div'); h.className = 'touch-hint' + (parent ? ' in-stage' : ''); h.setAttribute('aria-hidden', 'true');
  h.innerHTML = `<span class="th-track"><i class="th-dot"></i></span><span>${txt}</span>`;
  (parent || document.body).appendChild(h); return h;
};
const hintBody = mkHint(finePointer ? 'Maus über den Körper' : 'Streichen');
const hintHouse = mkHint(isDesktop() ? 'Ziehen zum Drehen' : 'Wischen oder Raum antippen');
const hintManu = manuSec ? mkHint(finePointer ? 'Ziehen zum Drehen' : 'Seitlich wischen', $('.manu-stage')) : null;
let houseUsed = false, manuUsed = false, xrayT = 0, manuT = 0, rotSeen = dragRot;
// Hinweis gilt erst als erledigt, wenn wirklich seitlich gewischt/gezogen wurde (nicht schon beim Antippen oder Scrollen)
{ let mx = null, my = 0; const gm = $('#glManu');
  gm?.addEventListener('pointerdown', (e) => { mx = e.clientX; my = e.clientY; });
  gm?.addEventListener('pointermove', (e) => { if (mx === null) return; const dx = e.clientX - mx, dy = e.clientY - my; if (Math.abs(dx) > 30 && Math.abs(dx) > Math.abs(dy) * 1.3) { manuUsed = true; mx = null; } });
  ['pointerup', 'pointercancel', 'pointerleave'].forEach((t) => gm?.addEventListener(t, () => (mx = null))); }
manuBtns.forEach((b) => b.addEventListener('click', () => (manuUsed = true)));
const t0Hints = performance.now();
function updateHints(dt) {
  const now = performance.now(), desk = isDesktop();
  // Körper: bis zur ersten Berührung
  const showBody = !touched && morphNow < 0.25 && now - t0Hints > 3500 && scrollY < VH * 0.3;
  hintBody.classList.toggle('on', showBody);
  if (showBody) hintBody.style.transform = desk ? `translate(${VW * 0.6}px, ${VH * 0.6}px) translate(-50%,-50%)` : `translate(${VW * 0.84}px, ${heroFit ? heroFit.top + (heroFit.bot - heroFit.top) * 0.3 - scrollY : VH * 0.24}px) translate(-50%,-50%)`; // neben der Figur, nicht auf den Partikeln
  // Haus: PC im Röntgenblick (ziehen), Handy vor dem Betreten (wischen/antippen)
  if (dragRot !== rotSeen || tourIdx >= 0) houseUsed = true;
  const houseReady = desk ? xray > 0.6 && tourIdx < 0 : tourInView() && tourIdx < 0 && morphNow > 2.7 && morphNow < 3.3;
  xrayT = houseReady ? xrayT + dt : 0;
  const showHouse = !houseUsed && xrayT > 3;
  hintHouse.classList.toggle('on', showHouse);
  if (showHouse) hintHouse.style.transform = desk ? `translate(${VW * 0.72}px, ${VH * 0.84}px) translate(-50%,-50%)` : `translate(${VW * 0.5}px, ${VH * 0.36}px) translate(-50%,-50%)`;
  // Manuthera-Liege
  if (hintManu) { manuT = manuK > 0.8 ? manuT + dt : 0; hintManu.classList.toggle('on', !manuUsed && manuT > 1.5); }
}

// Intro
// (im ersten Frame, vor dem ersten Bild: gsap liest berechnete Stile – so nur eine Stil-Berechnung, A1)
if (!reduced) requestAnimationFrame(() => {
  gsap.to(uniforms.uIntro, { value: 1, duration: 3.2, ease: 'expo.out', delay: 0.1 });
  gsap.from(['.hero .kicker', '.kinetic', '.hero-sub', '.hero .actions', '.meter', '.top'], { opacity: 0, y: 20, duration: 1.1, stagger: 0.06, ease: 'expo.out', delay: 0.2 });
});

// A4 · Kontakt: E-Mail kopieren, Öffnungsstatus (rein clientseitig, ohne JS bleibt die Zeitenliste)
{
  const copyBtn = document.getElementById('copyMail'), copyState = document.getElementById('copyState'), mailA = document.getElementById('mailAddr');
  if (copyBtn && copyState && mailA) {
    copyBtn.hidden = false;
    let tm = 0;
    const say = (t) => { copyState.textContent = t; clearTimeout(tm); tm = setTimeout(() => { copyState.textContent = ''; }, 4000); };
    const selectAddr = () => { const r = document.createRange(); r.selectNodeContents(mailA); const s = getSelection(); s.removeAllRanges(); s.addRange(r); };
    copyBtn.addEventListener('click', async () => {
      const addr = mailA.textContent.trim();
      try { await navigator.clipboard.writeText(addr); say('Kopiert'); }
      catch (e) { selectAddr(); say('Adresse markiert – bitte selbst kopieren'); }
    });
  }
  const openEl = document.getElementById('openNow');
  if (openEl) {
    // Feiertage Baden-Württemberg 2026/2027 (feste Liste)
    const HOL = new Set(['2026-01-01', '2026-01-06', '2026-04-03', '2026-04-06', '2026-05-01', '2026-05-14', '2026-05-25', '2026-06-04', '2026-10-03', '2026-11-01', '2026-12-25', '2026-12-26',
      '2027-01-01', '2027-01-06', '2027-03-26', '2027-03-29', '2027-05-01', '2027-05-06', '2027-05-17', '2027-05-27', '2027-10-03', '2027-11-01', '2027-12-25', '2027-12-26']);
    const DAYS = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
    const OPEN = 8 * 60 + 30, CLOSE = 19 * 60 + 30;
    const upd = () => {
      try {
        const p = {};
        new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Berlin', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date()).forEach((x) => { p[x.type] = x.value; });
        const base = Date.UTC(+p.year, +p.month - 1, +p.day), mins = +p.hour * 60 + +p.minute;
        const info = (k) => { const d = new Date(base + k * 864e5); return { wd: d.getUTCDay(), key: d.toISOString().slice(0, 10) }; };
        const isOpenDay = (k) => { const d = info(k); return d.wd >= 1 && d.wd <= 5 && !HOL.has(d.key); };
        const lastKey = info(0).key.slice(0, 4);
        if (lastKey > '2027') { openEl.hidden = true; return; }
        let t;
        if (isOpenDay(0) && mins < OPEN) t = 'Heute ab 8:30 geöffnet';
        else if (isOpenDay(0) && mins < CLOSE) t = 'Heute geöffnet bis 19:30';
        else {
          let k = 1; while (k < 10 && !isOpenDay(k)) k++;
          t = k === 1 ? 'Morgen ab 8:30' : DAYS[info(k).wd] + ' ab 8:30';
        }
        openEl.textContent = t; openEl.hidden = false;
      } catch (e) { openEl.hidden = true; }
    };
    upd(); setInterval(upd, 60000);
  }
}

// Handy: Figur in die Bühne unter dem Titel einpassen (#heroStage) – nach dem ersten Bild messen (kein Layout beim Start, A1)
function fitHero() {
  if (isDesktop()) { heroFit = null; layout(); return; }
  const st = document.getElementById('heroStage');
  if (!st) return;
  const r = st.getBoundingClientRect(), top = r.top + scrollY + 4, bot = r.bottom + scrollY - 4;
  if (bot - top > 60) { heroFit = { top, bot }; layout(); }
}
requestAnimationFrame(() => requestAnimationFrame(fitHero));
addEventListener('resize', () => requestAnimationFrame(fitHero));
document.fonts && document.fonts.ready.then(fitHero);
