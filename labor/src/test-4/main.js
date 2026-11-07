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
import { createEgo } from '../ego/tour.js';

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
// Höhe der 3D-Szene (Handy): wächst nur mit, schrumpft nicht, solange die Breite gleich bleibt. Safari blendet beim
// Wischen die Adressleiste ein/aus (Fensterhöhe ändert sich) – die Szene würde sonst jedes Mal neu eingepasst und zucken.
let GLH = VH, GLW = VW;
// kleinste sichtbare Höhe bei gleicher Breite (Leiste sichtbar): stabile Grundlage für Scroll-Schwellen am Handy
let MINH = VH;
addEventListener('resize', () => { VW = innerWidth; VH = innerHeight; });
const isDesktop = () => VW > 920;

// ---------- Scrollen ----------
let lenis = null;
let sheetOpen = false; // Termin-Blatt offen (Lenis steht, Handy rendert nicht)
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
$$('a[href^="#"]:not(.skip):not([data-termin]):not(.ego-contact)').forEach((a) => a.addEventListener('click', (e) => { // .skip: Browser-Sprung, damit der Fokus mitgeht (Durchsicht 7.11.)
  const t = $(a.getAttribute('href')); if (!t) return;
  e.preventDefault(); scrollToY(t.getBoundingClientRect().top + scrollY);
}));

// ---------- Renderer ----------
const canvas = $('#gl');
let renderer = null;
const glCtx = glContext(canvas);
if (glCtx) try { renderer = new THREE.WebGLRenderer({ canvas, context: glCtx, antialias: false, alpha: false, powerPreference: 'high-performance' }); } catch (e) { /* ohne WebGL bleibt die Seite lesbar */ }
// Ohne WebGL (oder wenn eine Bühne scheitert): Standbilder statt Partikel, Hinweise weg (A2, CSS html.no-gl)
const noGl = () => { document.documentElement.classList.remove('seg-rows', 'seg-scan', 'seg-pc'); document.documentElement.classList.add('no-gl'); };
// Handy-Wirbelsäule (nur hochkant mit WebGL; Handy quer oder ohne WebGL → Karte mit Volltext):
// Standard seit 6.11. = Scanner (html.seg-scan, Kapitel 03 als Bühne); ?scan=0 = Option A vom 5.11. (html.seg-rows, Karte klebt unten)
const scanQ = new URLSearchParams(location.search).get('scan');
const segRows = () => {
  const el = document.documentElement, ok = !isDesktop() && !el.classList.contains('no-gl') && MINH >= 500;
  el.classList.toggle('seg-scan', ok && scanQ !== '0'); el.classList.toggle('seg-rows', ok && scanQ === '0');
  // PC (Kai 7.11., 2B · 1A 2A 3A): Hybrid-Scanner – stehende Bühne mit Aufzug rechts, Silhouette + Schilder bleiben
  // (alte Scroll-Kamerafahrt am PC entfernt, Kai 7.11. spät); ohne WebGL: Karte wechselt per segnav
  el.classList.toggle('seg-pc', isDesktop() && !el.classList.contains('no-gl'));
};
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
  const d = isDesktop(), a = VW / GLH;
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
    if (heroFit) { const wpp = 8.19 / GLH, hw2 = (heroFit.bot - heroFit.top) * wpp; X[0].set(0, (GLH / 2 - (heroFit.top + heroFit.bot) / 2) * wpp, 0, Math.min(0.8, hw2 / 7.75)); } // Figur zwischen Leiste und Kicker (4.11.)
    X[1].set(0, 0, 0, 1.25);           // 1A: Bewegungslinien über den ganzen Bildschirm
    X[2].set(0, 1.65, 0, 0.28);        // 4A: Wirbelsäule in der oberen Bildhälfte
    X[3].set(0, 2.5, 0, 0.42);         // 2B: wird beim Scrollen zum Emblem (siehe roofEmblem)
    X[4].set(0, 2.15, 0, 0.32);        // 3: tiefer und kleiner, frei von der Leiste
  }
  uniforms.uPix.value = renderer ? renderer.getPixelRatio() * (GLH / 900) * (d ? 1 : 1.25) : 1;
}
function resize() {
  if (isDesktop()) [...$$('.seg-card'), ...$$('#achse .note')].forEach((c) => { c.style.opacity = ''; c.style.transform = ''; });
  MINH = VW !== GLW || isDesktop() ? VH : Math.min(MINH, VH);
  segRows();
  if (isDesktop() || VW !== GLW || VH > GLH || VH < GLH * 0.7) GLH = VH;
  GLW = VW;
  camera.aspect = VW / GLH; camera.updateProjectionMatrix();
  if (renderer) {
    const cv = renderer.domElement, pr = renderer.getPixelRatio();
    // nur bei echter Änderung neu anlegen (gleiche Größe setzen leert sonst die Zeichenfläche → Flackern)
    if (cv.width !== Math.floor(VW * pr) || cv.height !== Math.floor(GLH * pr)) renderer.setSize(VW, GLH, false);
    cv.style.height = isDesktop() ? '' : GLH + 'px';
  }
  layout();
}
addEventListener('resize', resize); resize();

// ---------- Hand: Spannung lösen ----------
const hand = $('#hand');
const raycaster = new THREE.Raycaster(), ndc = new THREE.Vector2(), plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0), hit = new THREE.Vector3();
let lastPaint = null, touched = false;
function paintAt(cx, cy) {
  ndc.set(cx / VW * 2 - 1, -(cy / GLH) * 2 + 1);
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
  uPeri: { value: 0 }, uPeriStart: { value: 0 }, uScan: { value: 100 }, uScanAmt: { value: 0 }, // Scanner (Handy, 6.11.)
  uDiff: { value: 0 }, uFine: { value: 0 }, // Handy 7.11.: Wirbelsäule differenziert, Nerv fein (PC vorgemerkt)
  cBone: { value: C('#F3EADA') }, cDisc: { value: C('#86AFC9') }, cDiscD: { value: C('#4FA8D6') }, cAmber: uniforms.cAmber, cBlue: uniforms.cBlue,
  cSignal: { value: C('#DDF1FF') }, cCore: { value: C('#0E1C22') },
};
const GLSL_COMMON = /* glsl */`
  uniform float uTime, uRot, uCut, uZone, uZoneAmt, uOn, uStip, uPix, uPeri, uPeriStart, uScan, uScanAmt, uDiff, uFine; uniform vec4 uXf;
  uniform vec3 cBone, cDisc, cDiscD, cAmber, cBlue, cSignal, cCore;
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
    attribute float aZone, aKind, aEdge; uniform float uMaxSize;
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
      float sz = 1.;
      if (uDiff > .5) {
        // Handy (7.11.): wie eine anatomische Zeichnung – Umriss hell, Fläche zum Betrachter lichter;
        // Deckplatten helle Kante, Bandscheibe eigene Farbe mit dunkler Fuge, Fortsätze feiner
        float sil = pow(1. - max(dot(n, V), 0.), 1.6);
        if (aKind > .5) {
          float fuge = smoothstep(.62, .92, aEdge);
          col = cDiscD * (.5 + .5 * lam) * (1. - fuge * .78) + cBlue * sil * .22;
          sz = .9;
        } else {
          float plate = aEdge < 0. ? 0. : smoothstep(.74, .9, aEdge);
          col = cBone * (.2 + .8 * lam) * mix(.58, 1.2, sil) + cBlue * rim * .12;
          col = mix(col, cBone * 1.3 + vec3(.08, .05, 0.), plate * .85);
          sz = aEdge < 0. ? .78 : 1. + plate * .2;
          if (aEdge < 0.) col *= .78;
        }
      }
      if (uDiff > .5 && aKind > .5) col *= 1. + on * .5; // Handy: Bandscheibe bleibt blau, im Abschnitt heller
      else col = mix(col, cAmber * (.35 + .95 * lam), on * (aKind < .5 ? 1. : .4));
      float g = exp(-pow((p.y - uCut) * 9., 2.));
      col = mix(col, cAmber * 1.3, g);
      float sc = exp(-pow((p.y - uScan) * 16., 2.)) * uScanAmt; // Scanner: Band unter der Scan-Linie leuchtet
      col = mix(col, cAmber * 1.5 + vec3(.15), sc * .85);
      vCol = col; vVis = step(uCut, p.y) * uOn;
      vec4 mv = viewMatrix * vec4(p, 1.);
      gl_Position = projectionMatrix * mv;
      gl_PointSize = clamp(uStip / -mv.z * sz, 1., uMaxSize) * (1. + g * .8 + sc * .7);
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
  g.setAttribute('aEdge', new THREE.BufferAttribute(d.edge || new Float32Array(d.kind.length), 1));
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
  sU.uFine.value = 1; // 7.11. (Handy, dann PC): Versorgungsbahn als schmaler Nerv mit vielen schnellen Impulsen
  const nCord = desk ? 2600 : 1300, nRoot = desk ? 60 : 40, nPeri = desk ? 1600 : 1100; // Handy 7.11.: Wurzeln dichter (S1-Wurzel bis zum Nerv sichtbar)
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
        } else if (uFine < .5) {                   // Versorgungsbahn (Weltkoordinaten)
          p = curveAt(uPeriTex, 0., 1., t) + aOff * uXf.w * 4.;
          float r1 = (S1 - uPeriStart) * 4. - 1., r2 = (S2 - uPeriStart) * 4. - 1.;
          pk = max(packet(r1 * .55 - t, 40.) * step(0., r1), packet(r2 * .55 - t, 40.) * step(0., r2)) * uPeri;
          base = .4 * uPeri;
        } else {                                   // Handy (7.11.): schmaler Nerv, viele schnelle Impulse nach außen
          p = curveAt(uPeriTex, 0., 1., t) + aOff * uXf.w * .4;
          float w = fract(t * 9. - uTime * 4.5);
          pk = pow(w, 10.) * 1.5 * uPeri;          // steile Front, kurzer Nachlauf
          base = .5 * uPeri;
        }
        vec3 col = cBlue * base + cSignal * pk * 1.15;
        // Handy (7.11.): fertig aufgebaut → Wurzeln/Bahn unterhalb des Steißbeins (S1) nicht abschneiden
        float cut = (uFine > .5 && aKind > 1.5 && uCut < uXf.y - 4.3 * uXf.w) ? -1e4 : uCut;
        float vis = step(cut, p.y) * uOn;
        vec4 mv = viewMatrix * vec4(p, 1.);
        gl_Position = projectionMatrix * mv;
        bool fine = aKind > 2.5 && uFine > .5;
        gl_PointSize = fine ? clamp(uPix * (.75 + pk * .9) * 15. / -mv.z, 1., 3.6) : clamp(uPix * (1.05 + pk * 1.4) * 15. / -mv.z, 1., 7.);
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
  sU.uDiff.value = 1; // differenziert (Handy 7.11., PC 7.11.)
  return runSliced(d.makeSlicesGen(N_SLICE, isDesktop() ? 0.024 : 0.032, 0.12, true));
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
  th712: { txt: 'Rippenbogen · Bauchwand', d: [1.15, -0.1], m: [0.66, 0.3] },
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
  // Wurzel des Abschnitts finden, deren Ende auf dem Bildschirm am weitesten außen liegt (PC rechts, Handy links)
  const X = uniforms.uXf.value[2];
  const rot = uniforms.uSpineRot.value;
  const desk = isDesktop(), rows = !desk && linesOn(), side = rows ? -1 : 1;
  let tip = null, tipX = -1e9, start = 0, tipC = null;
  det.curves.forEach((c) => {
    if (c.kind !== 2 || ZONES[c.zone] !== zoneKey || ((desk || (rows && scanOn())) && !rootOk(c, zoneKey))) return;
    const e = c.pts[CURVE_W - 1];
    _pv.set(e[0], e[1], e[2]).applyAxisAngle(new V3(0, 1, 0), rot).multiplyScalar(X.w).add(new V3(X.x, X.y, X.z));
    _ndc.copy(_pv).project(camera);
    if (_ndc.x * side > tipX) { tipX = _ndc.x * side; tip = _pv.clone(); start = c.start; tipC = c; }
  });
  if (!tip) return;
  const tipNdc = tip.clone().project(camera);
  let end;
  if (desk) end = silTarget(zoneKey);
  else if (!rows) end = new V3(1.1, cfg.m[1], tipNdc.z).unproject(camera); // Handy quer: wie vor Option A
  else {
    // Handy (Option A/Scanner): Zeilen links gestapelt, „Austritt“ auf Höhe der Wurzel; die Bahn endet rechts neben „Ziel“
    const sc = scanOn();
    if (sc) mobPlaceScan(); else mobPlace((-tipNdc.y * 0.5 + 0.5) * GLH);
    // Scanner (Kai 7.11.): Nerv rechts an allen Zeilen vorbei, nicht hinter ihnen
    const ex = ML.x + (sc ? Math.max(ML.ws[0], ML.ws[1], ML.ws[2], ML.ws[3]) + 14 : ML.ws[3] + 10), ey = ML.ys[3] + ML.hs[3] / 2;
    end = new V3((ex / VW) * 2 - 1, 1 - (ey / GLH) * 2, tipNdc.z).unproject(camera);
  }
  const endNdc = end.clone().project(camera);
  const mid = rows && scanOn()
    ? new V3(Math.max(tipNdc.x, endNdc.x), THREE.MathUtils.lerp(tipNdc.y, endNdc.y, 0.5), THREE.MathUtils.lerp(tipNdc.z, endNdc.z, 0.5)).unproject(camera)
    : new V3(THREE.MathUtils.lerp(tipNdc.x, endNdc.x, 0.45), THREE.MathUtils.lerp(tipNdc.y, endNdc.y, 0.25) + 0.05, THREE.MathUtils.lerp(tipNdc.z, endNdc.z, 0.5)).unproject(camera);
  // Scanner (Kai 7.11., 1A): der Nerv beginnt am Wirbel (Austritt aus dem Wirbelkanal), läuft entlang der Wurzel
  // und weiter nach außen – ein durchgehender Strang; sonst wie bisher ab dem Wurzelende
  const wrl = (q) => new V3(q[0], q[1], q[2]).applyAxisAngle(_Y, rot).multiplyScalar(X.w).add(new V3(X.x, X.y, X.z));
  const curve = (desk || (rows && scanOn())) && tipC
    ? new THREE.CatmullRomCurve3([...ROOT_I.map((k) => wrl(tipC.pts[k])), mid, end])
    : new THREE.CatmullRomCurve3([tip, tip.clone().lerp(mid, 0.4).add(new V3(0, 0.02, 0)), mid, end]);
  for (let i = 0; i < CURVE_W; i++) { curve.getPointAt(i / (CURVE_W - 1), _pv); periData.set([_pv.x, _pv.y, _pv.z, 1], i * 4); }
  periTex.needsUpdate = true;
  periCurve = curve;
  sU.uPeriStart.value = start;
  // Andockpunkte der Zeilen: Austritt = Anfang, Ziel = Ende, die beiden mittleren dort, wo der Nerv auf Zeilenhöhe ist
  ML.anch = [0, 0.33, 0.66, 1];
  if (rows && scanOn()) {
    let from = 0;
    for (const i of [1, 2]) {
      const yc = ML.ys[i] + ML.hs[i] / 2; let bt = from, bd = 1e9;
      for (let k = 0; k <= 48; k++) { const t = from + (0.97 - from) * (k / 48); const d = Math.abs(toPx(curve.getPointAt(t, _pv))[1] - yc); if (d < bd) { bd = d; bt = t; } }
      ML.anch[i] = bt; from = Math.min(0.96, bt + 0.04);
    }
  }
  // Beschriftung am sichtbaren Ende der Bahn
  curve.getPointAt(desk ? 0.72 : 0.6, _pv); _pv.project(camera);
  const lx = Math.min((_pv.x * 0.5 + 0.5) * VW, VW - 16), ly = (-_pv.y * 0.5 + 0.5) * GLH;
  periLabel.style.transform = `translate(${lx}px, ${ly}px) translate(-100%, -260%)`;
  periLabel.textContent = cfg.txt;
}

// Abschnitte (Zonen wie V10) und Kamera-Rahmen
const STOPS = [
  { zone: 'c12', ids: ['C1', 'C2'], d: 5.6, az: 0.5 },
  { zone: 'c56', ids: ['C5', 'C6'], d: 6.2, az: -0.38 },
  { zone: 'th16', ids: ['Th2', 'Th3', 'Th4', 'Th5'], d: 7.6, az: 0.55 },
  { zone: 'th712', ids: ['Th8', 'Th9', 'Th10', 'Th11'], d: 7.6, az: -0.5, root: 'Th10' }, // Kai 7.11. (Handy, dann PC)
  { zone: 'l45', ids: ['L4', 'L5'], d: 7.2, az: -0.45 },
  { zone: 's1', ids: ['L5', 'S'], d: 7.6, az: 0.75 },
];
// Scanner-Haltestellen = Stationen (seit 7.11. überall sechs, mit Th7–Th12)
const SSTOPS = STOPS;
const SLAB = ['C1', 'C5', 'Th1', 'Th7', 'L4', 'S1'];
// Scanner: Wurzel für den Nerv – fest (root, z. B. Th10 = Nabelhöhe) oder die am weitesten links außen
const rootOk = (c, zone) => { const st = SSTOPS.find((q) => q.zone === zone); return !st || !st.root || c.id === st.root; };
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
  const s = STOPS[i], rot = PROFILE + s.az, X = uniforms.uXf.value[2]; // nur Handy (PC: Scanner)
  const c = new V3();
  s.ids.forEach((id) => { const lv = det.levels.find((l) => l.id === id); c.add(new V3(lv.center.x * SC, (lv.center.y - CY) * SC, lv.center.z * SC)); });
  c.divideScalar(s.ids.length).applyAxisAngle(new V3(0, 1, 0), rot).multiplyScalar(X.w).add(new V3(X.x, X.y, X.z));
  // Handy mit Zeilen (Option A): Abschnitt nach rechts, links ist die Spalte für die Zeilen
  const st = stickOn(), d = s.d * SC * X.w * 0.86 * (st ? MOB_D : 2.1);
  return { ...frame(c, new V3(0, 0.12, 1), d, st ? (VW > 600 ? 0.64 : 0.7) : 0.5, fy), rot };
}
const MOB_D = 2.3;
// Handy-Ablauf mit stehender Karte und Zeilen (Klasse seg-rows) bzw. Scanner (seg-scan), siehe segRows oben
const stickOn = () => document.documentElement.classList.contains('seg-rows');
const scanOn = () => document.documentElement.classList.contains('seg-scan');
const linesOn = () => stickOn() || scanOn();
const pcScan = () => document.documentElement.classList.contains('seg-pc'); // PC-Scanner (Kai 7.11.)
const OVERVIEW = { pos: new V3(0, 0, 13), target: new V3(0, 0, 0) };
const lerpPose = (a, b, t) => ({ pos: a.pos.clone().lerp(b.pos, t), target: a.target.clone().lerp(b.target, t), rot: b.rot !== undefined && a.rot !== undefined ? THREE.MathUtils.lerp(a.rot, b.rot, t) : (b.rot ?? a.rot) });
const cam = { pos: OVERVIEW.pos.clone(), target: OVERVIEW.target.clone() };
let axisWant = null;

// Bedienung: Desktop = Scrollen + Abschnitts-Knöpfe, Handy = Karten wischen
const axis = $('#achse');
const segBtns = $$('.segnav button'), cards = $$('.seg-card'), dots = $$('.seg-dots button');
const cardOf = (zone) => cards[STOPS.findIndex((s) => s.zone === zone)];
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
  th712: { exit: 'Austritt Th7–Th12', nerv: 'Untere Interkostalnerven · Bauchwand', gef: 'Gefühl: Rippenbogen, Bauchwand', ziel: 'bis zur Nabelhöhe (Th10)', typ: 'Typisch: gürtelförmiger Schmerz am Rippenbogen, Steifigkeit am Übergang zur LWS', tgt: [86, 195] }, // Flanke auf Nabelhöhe
  th16: { exit: 'Austritt Th1–Th6', nerv: 'Interkostalnerven, obere Rippen', gef: 'Brustkorbwand · Zwischenrippen', ziel: 'Brustkorb', typ: 'Typisch: atemabhängiges Stechen, Schmerz zwischen den Schulterblättern', tgt: [80, 118] },
  l45: { exit: 'Austritt L4–L5', nerv: 'Richtung N. ischiadicus · L5 hebt den Fuß', gef: 'Gefühl: Schienbein', ziel: 'bis zur Großzehe', typ: 'Typisch: Ausstrahlung ins Bein, Kribbeln am Schienbein, Fußheber-Schwäche', tgt: [76, 404] },
  s1: { exit: 'Austritt S1 · ISG', nerv: 'Wade · Achillessehnenreflex', gef: 'Gefühl: Beinrückseite, Fußaußenrand', ziel: 'bis zur Ferse', typ: 'Typisch: Ausstrahlung bis zur Ferse, einseitiger Kreuzschmerz', tgt: [72, 412], pre: 'Iliosakralgelenk (ISG): verbindet Becken und Wirbelsäule.' },
};
const NC_KEYS = ['exit', 'nerv', 'gef', 'ziel', 'typ'];
const ncalls = NC_KEYS.map((k) => { const el = document.createElement('div'); el.className = 'ncall ncall-' + k; el.setAttribute('aria-hidden', 'true'); document.body.appendChild(el); return el; });
let periCurve = null;

// Handy (Option A, 5.11.): dieselben Zeilen wie am PC, links gestapelt, mit Linie zur Wirbelsäule/Bahn.
// „Typisch“ kommt vollständig aus der Karte (kein Inhaltsverlust), steht über der Karte; die Karte selbst zeigt nur
// Titel + Schlagworte, ihr Volltext bleibt für Vorleseprogramme (dl sr-only). Ohne WebGL bleibt die alte Karte.
const ML = { key: null, w: 0, x: 16, colW: 160, hs: [0, 0, 0, 0, 0], ws: [0, 0, 0, 0, 0], ys: [0, 0, 0, 0], typY: 0, chipsY: 0, chH: 0, scan: false, y0: 0, tipT: null, exitT: null, tipKey: null, anch: [0, 0.33, 0.66, 1] };
// Nervenwurzel: Stützpunkte ab dem Austritt aus dem Wirbelkanal (Kurve hat 4 Stützpunkte, 2. = Foramen) bis zum Ende
const ROOT_I = [42, 64, 86, 106, CURVE_W - 1];
function mobTexts(zoneKey) {
  const info = NINFO[zoneKey], card = cardOf(zoneKey);
  const dd = card ? card.querySelectorAll('dd') : [];
  const typ = dd[1] ? 'Typisch: ' + dd[1].textContent.trim() : info.typ;
  return [info.exit, info.nerv, info.gef, info.ziel, info.pre ? info.pre + '\n' + typ : typ];
}
// Scanner (Kai 6.11. spät): Karte oben als Überschrift – Abschnitt + Titel, „Typisch“, Therapien; die vier Zeilen links daneben
const chipsEl = document.createElement('div'); chipsEl.className = 'scan-chips'; chipsEl.setAttribute('aria-hidden', 'true'); document.body.appendChild(chipsEl);
// nur bei Abschnitts- oder Breitenwechsel: Texte setzen und einmal messen
function mobMeasure(zoneKey) {
  const pad = VW < 360 ? 12 : 16, sc = scanOn();
  const colW = Math.round(Math.min(VW * 0.5, 288) - pad);
  // neuer Abschnitt oder andere Breite: erst mit Schlagwort-Kästchen versuchen
  if (ML.key !== zoneKey || !sc || ML.w !== VW || Math.abs((ML.colW || 0) - colW) > 8) ML.compact = 0;
  ML.key = zoneKey; ML.w = VW; ML.x = pad; ML.scan = sc; ML.colW = colW;
  const card = cardOf(zoneKey), chipTxt = card ? [...card.querySelectorAll('.chips li')].map((li) => li.textContent) : [];
  const texts = mobTexts(zoneKey);
  // Scanner-Karte (Kai 7.11.): schmal, „Typisch“ als Kurzfassung – Volltext bleibt in der Karte für Vorleseprogramme
  let typCard = NINFO[zoneKey].typ;
  if (sc && ML.compact) typCard += '\nTherapie: ' + chipTxt.join(' · '); // wenig Platz: Schlagworte als Textzeile (Stufe 1)
  texts.forEach((t, i) => {
    const el = ncalls[i]; el.textContent = t;
    el.style.maxWidth = i < 4 ? ML.colW + 'px' : '';
    el.style.width = i < 4 ? '' : Math.min(VW - 2 * pad, 576) + 'px';
  });
  ncalls.forEach((el, i) => { ML.hs[i] = el.offsetHeight; ML.ws[i] = el.offsetWidth; });
  ML.chH = 0;
  if (sc) {
    const head = document.createElement('p'), no = document.createElement('span'), h = document.createElement('span'), list = document.createElement('div');
    head.className = 'sc-t'; no.className = 'sc-no'; no.textContent = card ? ($('.seg-no', card) || card).textContent.trim() : '';
    h.className = 'sc-h'; h.textContent = card && $('h3', card) ? $('h3', card).textContent.trim() : ''; head.append(no, h);
    list.className = 'sc-c'; list.replaceChildren(...(ML.compact ? [] : chipTxt).map((t) => { const s = document.createElement('span'); s.textContent = t; return s; }));
    const typ = document.createElement('p'); typ.className = 'sc-typ'; typ.textContent = typCard;
    chipsEl.replaceChildren(head, typ, list);
    chipsEl.classList.toggle('sc-small', ML.compact > 1); // Stufe 2: kleinere Schrift
    // ~60 % Breite (Kai 7.11.: Wirbelsäule rechts daneben besser sichtbar), nie in den Ziehstreifen
    chipsEl.style.width = Math.min(Math.max(Math.round(VW * 0.6), 200), VW - pad - RAIL_W - 8, 480) + 'px'; ML.chH = chipsEl.offsetHeight;
  }
}
// Scanner (Kai 6.11. spät): Karte oben unter der Kopfleiste, darunter links die vier Zeilen; die Kamera legt die Wurzel
// des Abschnitts auf „Austritt“, die Wirbelsäule darunter bleibt frei. Reicht der Platz nicht: Stufe 1 Therapien als
// Textzeile, Stufe 2 kleinere Schrift in der Karte.
function mobPlaceScan() {
  const hs = ML.hs, sum = hs[0] + hs[1] + hs[2] + hs[3];
  ML.chipsY = SCAN.cardTop; ML.typY = -999;
  const top = ML.chipsY + ML.chH + 16, room = SCAN.bot - top;
  if ((ML.compact || 0) < 2 && ML.key && !ML.remeasure && sum + 3 * 6 > room) { ML.compact = (ML.compact || 0) + 1; ML.remeasure = true; } // passt nicht → kompakter neu messen
  const g = clamp((room - sum) / 3, 4, 10);
  ML.y0 = top; // Lage ohne Verschiebung (danach richtet sich die Nahansicht)
  // Kai 7.11. (1A): „Austritt“ auf Höhe des Austritts am Wirbel (bei voller Nahansicht); die Zeilen spreizen sich, bis
  // „Ziel“ unter dem Wurzelende steht – der Nerv läuft dann neben den Zeilen nach unten; nie unter den Hinweis
  let y = top, gg = g;
  if (ML.exitT != null && ML.tipKey === ML.key) {
    y = clamp(ML.exitT - hs[0] / 2, top, Math.max(top, SCAN.bot - sum - 3 * g));
    const want = ML.tipT + 24 - hs[3] / 2 - (y + hs[0] + hs[1] + hs[2]);
    gg = clamp(want / 3, g, Math.max(g, (SCAN.bot - y - sum) / 3));
  }
  for (let i = 0; i < 4; i++) { ML.ys[i] = y; y += hs[i] + gg; }
}
addEventListener('resize', () => {
  ML.key = null;
  if (isDesktop()) ncalls.forEach((el) => { el.style.maxWidth = ''; el.style.width = ''; });
});
// Lage: „Typisch“ über der stehenden Karte, die vier Zeilen dazwischen; „Austritt“ möglichst auf Höhe der Wurzel
function mobPlace(tipY) {
  const hs = ML.hs, S = segS ? segS[mobSel] : MINH * 0.78;
  ML.typY = S - hs[4] - 10;
  const top = Math.max(dotsStuck, 64) + 12, bot = ML.typY - 12, sum = hs[0] + hs[1] + hs[2] + hs[3];
  const g = clamp((bot - top - sum) / 3, 4, 12);
  let y = Math.max(top, Math.min(tipY - hs[0] / 2, bot - sum - 3 * g));
  for (let i = 0; i < 4; i++) { ML.ys[i] = y; y += hs[i] + g; }
}
// Zeilen erscheinen nacheinander, während die Karte steht (prog = gescrollte Strecke seit dem Anhalten, × Bildhöhe)
const MTH = [0.02, 0.09, 0.16, 0.23, 0.31];
let mlVisT = -1e9;
// opt (Scanner-Varianten ?txt=a|b|c): th = Schwellen je Zeile (Sekunden), chip = Schwelle Karte, lines = Hinweislinien, slow = ruhig ausblenden
function updateCalloutsMob(zoneKey, on, prog, opt = null) {
  const now = performance.now();
  // Abschnitt gewechselt: alte Zeilen erst ausblenden lassen, dann Texte tauschen (sonst springt Text in der Blende)
  const sc = scanOn(), stale = ML.key !== zoneKey || ML.scan !== sc;
  if (zoneKey && stale && now - mlVisT > 420) mobMeasure(zoneKey);
  else if (zoneKey && ML.remeasure && ML.key === zoneKey) { ML.remeasure = false; mobMeasure(zoneKey); } // kompakt (noch unsichtbar)
  const show = !!(on && zoneKey && periCurve && ML.key === zoneKey);
  const th = opt ? opt.th : MTH, dur = opt && opt.slow && !show ? '.9s' : '';
  ncalls.forEach((el, i) => {
    const vis = show && prog > th[i] && !(sc && i === 4); // Scanner: „Typisch“ steht in der Karte
    if (vis) mlVisT = now;
    el.style.opacity = vis ? 1 : 0; el.style.transitionDuration = dur;
    if (i < 4) nl[i].style.opacity = nring[i].style.opacity = vis && (!opt || opt.lines) ? 1 : 0;
  });
  chipsEl.style.opacity = sc && show && prog > (opt ? opt.chip : MTH[4] + 0.06) ? 1 : 0; chipsEl.style.transitionDuration = dur;
  if (!show) return;
  ncalls.forEach((el, i) => { el.style.transform = `translate(${ML.x}px, ${(i < 4 ? ML.ys[i] : ML.typY).toFixed(1)}px)`; });
  if (sc) chipsEl.style.transform = `translate(${ML.x}px, ${ML.chipsY.toFixed(1)}px)`;
  (sc ? ML.anch : [0, 0.33, 0.66, 1]).forEach((t, i) => {
    const [ax, ay] = toPx(periCurve.getPointAt(t)), L = nl[i];
    // Linie endet am Rand des Andockrings, der Ring sitzt genau auf dem Nerv
    const x1 = ML.x + ML.ws[i], y1 = ML.ys[i] + ML.hs[i] / 2, dl = Math.hypot(ax - x1, ay - y1) || 1, k = Math.max(0, 1 - 5 / dl);
    L.setAttribute('x1', x1); L.setAttribute('y1', y1); L.setAttribute('x2', x1 + (ax - x1) * k); L.setAttribute('y2', y1 + (ay - y1) * k);
    nring[i].setAttribute('cx', ax); nring[i].setAttribute('cy', ay);
  });
}

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
  // PC-Scanner (1A): Silhouette rückt vor den Aufzug (rechter Rand der Arme ≈ 0,095 × Bildhöhe neben der Mitte)
  const fx = pcScan() ? Math.min(0.74, 2 * (VW - RAIL_W - 34 - 0.095 * GLH) / VW - 1) : 0.74;
  sil.position.set(hw * fx, -hh * 0.06, -D); sil.scale.setScalar(s);
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
nlines.innerHTML = '<line/><line/><line/><line/><circle r="4"/><circle r="4"/><circle r="4"/><circle r="4"/>'; document.body.appendChild(nlines);
const nl = [...nlines.querySelectorAll('line')], nring = [...nlines.querySelectorAll('circle')]; // Andockringe auf dem Nerv (Handy, 7.11.)
const toPx = (v) => { const q = v.clone().project(camera); return [(q.x * 0.5 + 0.5) * VW, (-q.y * 0.5 + 0.5) * GLH]; };
// Hindernisse auf dem Bildschirm: jeder sichtbare Wirbel als Rechteck (inkl. Fortsätze), Silhouette, Zielpunkt
function spineRects(X = uniforms.uXf.value[2]) { // X: Lage/Größe der Wirbelsäule (Scanner: Übersicht statt Nahansicht)
  const rot = uniforms.uSpineRot.value, out = [];
  const right = new V3().setFromMatrixColumn(camera.matrixWorld, 0), up = new V3().setFromMatrixColumn(camera.matrixWorld, 1);
  det.levels.forEach((lv) => {
    const c = new V3(lv.center.x * SC, (lv.center.y - CY) * SC, lv.center.z * SC).applyAxisAngle(new V3(0, 1, 0), rot).multiplyScalar(X.w).add(new V3(X.x, X.y, X.z || 0));
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
    if (i < 4) nl[i].style.opacity = nring[i].style.opacity = vis ? 1 : 0; // Andockringe (Handy + PC, 7.11.)
  });
  if (!show) { ncState.forEach((s) => { s.init = false; s.k = -1; }); return; }
  const now = performance.now(), ease = 1 - Math.exp(-Math.min(0.1, (now - ncT) / 1000) * 7); ncT = now;
  const W = VW - (pcScan() ? RAIL_W + 6 : 0), H = VH, MINX = pcScan() ? PC_COL() : Math.min(600, VW * 0.42); // Textspalte links frei halten, PC-Scanner: Aufzug rechts frei
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
    // Linie endet am Rand des Andockrings, der Ring sitzt genau auf dem Nerv (7.11.)
    const dl = Math.hypot(ax - px, ay - py) || 1, k = Math.max(0, 1 - 5 / dl);
    const L = nl[i]; L.setAttribute('x1', px); L.setAttribute('y1', py); L.setAttribute('x2', px + (ax - px) * k); L.setAttribute('y2', py + (ay - py) * k);
    nring[i].setAttribute('cx', ax); nring[i].setAttribute('cy', ay);
  }
}

const PH = () => ({ M0: 0.1, J0: 0.13, J1: 0.9, M1: 0.93 }); // Handy quer/Tablet ohne Scanner (PC: Scanner)
segBtns.forEach((b) => b.addEventListener('click', () => {
  if (isDesktop()) { if (pcScan()) scanGo(+b.dataset.seg, true); else setActive(+b.dataset.seg); return; } // PC-Scanner: zweite Bedienung neben dem Aufzug; ohne WebGL: Karte direkt
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
// Karte: kommt von unten (Oberkante 98 → 85 % Bildhöhe), lesbar bis ~45 %, dann aus; hohe Karten erst, wenn ihr Ende im Bild war
const cardIn = (r, vh) => smooth(vh * 0.98, vh * 0.85, r.top);
const cardFade = (r, vh) => cardIn(r, vh) * Math.max(smooth(vh * 0.25, vh * 0.45, r.top), smooth(vh * 0.55, vh * 0.85, r.bottom));
// Option A (5.11.): Karte klebt unten (CSS sticky, top = 100svh − Kartenhöhe), die nächste schiebt sich darüber.
// Natürliche Lage (ohne Kleben) = Kartenstapel-Anfang + Höhen + Abstände der Karten davor.
const segCardsEl = $('#segCards');
let segHs = null, segMs = null, segS = null, mobProg = -1, mobStuck = false;
function measureCards() {
  segHs = cards.map((c) => { const h = c.offsetHeight; c.style.setProperty('--ch', h + 'px'); return h; });
  segMs = cards.map((c) => parseFloat(getComputedStyle(c).marginBottom) || 0);
  segS = cards.map((c) => parseFloat(getComputedStyle(c).top) || MINH * 0.78);
}
addEventListener('resize', () => (segHs = null));
if (window.ResizeObserver) { const ro = new ResizeObserver(() => (segHs = null)); cards.forEach((c) => ro.observe(c)); }
const natTop = (i) => { let y = segCardsEl.getBoundingClientRect().top; for (let j = 0; j < i; j++) y += segHs[j] + segMs[j]; return y; };
function mobileCard(gate) {
  const vh = MINH; // stabil: Safaris Leiste verschiebt sonst beim Wischen alle Schwellen
  const rs = cards.map((c) => c.getBoundingClientRect());
  // aktiv ist die letzte Karte, deren Oberkante den Bildrand fast erreicht hat (die vorige ist dann schon ausgeblendet)
  let best = 0;
  rs.forEach((r, i) => { if (r.top < vh * 1.0) best = i; });
  if (stickOn()) {
    if (!segHs) measureCards();
    mobProg = (segS[best] - natTop(best)) / vh;
    mobStuck = mobProg >= 0 && Math.abs(rs[best].top - segS[best]) < 2;
    // Einblenden endet genau an der Halteposition (kurze Karten halten tiefer als 85 % Bildhöhe)
    const cin = (r, i) => smooth(Math.min(vh, segS[i] + vh * 0.13), segS[i], r.top);
    const out = (r) => Math.max(smooth(vh * 0.25, vh * 0.45, r.top), smooth(vh * 0.55, vh * 0.85, r.bottom)); // letzte Karte nach dem Loslassen
    rs.forEach((r, i) => {
      // aktive Karte: wie bisher erst nach der Kamerafahrt; die vorige steht darunter und weicht der nächsten
      const k = i >= best ? cin(r, i) : 1; // auch für kommende Karten (gleiche Verschiebung, sonst Flackern an der Bildkante)
      const a = i === best ? k * out(r) * gate : i === best - 1 ? out(r) * (1 - smooth(vh * 0.99, Math.min(vh * 0.9, segS[best] + 1), rs[best].top)) : 0;
      cards[i].style.opacity = a.toFixed(3);
      cards[i].style.transform = k > 0.999 ? '' : `translateY(${((1 - k) * 1.5).toFixed(3)}rem)`;
    });
  } else {
    mobProg = -1; mobStuck = false;
    rs.forEach((r, i) => {
      const a = cardFade(r, vh) * (i === best ? gate : 0.8);
      cards[i].style.opacity = a.toFixed(3);
      cards[i].style.transform = a > 0.999 ? '' : `translateY(${((1 - cardIn(r, vh)) * 1.5).toFixed(3)}rem)`;
    });
  }
  if (axisNote) axisNote.style.opacity = cardFade(axisNote.getBoundingClientRect(), vh).toFixed(3);
  return best;
}
dots.forEach((d) => d.addEventListener('click', () => {
  const i = +d.dataset.seg;
  if (scanOn()) { scanGo(i, true); return; } // Scanner: zum Abschnitt springen; steht die Bühne noch nicht, dorthin scrollen
  if (stickOn()) { // so weit, dass die Karte steht und alle Zeilen da sind
    if (!segHs) measureCards();
    scrollToY(natTop(i) + scrollY - (segS[i] - MINH * (MTH[4] + 0.05)));
    return;
  }
  scrollToY(cards[i].getBoundingClientRect().top + scrollY - VH * 0.5);
}));

let spineRot = -0.9;

// ---------- Handy: Scanner (Kapitel 03 als Bühne, Kai 6.11.) ----------
// Die ganze Wirbelsäule steht rechts im Bild, eine Bernstein-Scan-Linie liegt quer darüber. Rechts (Daumenbereich)
// zieht man sie hoch und runter: der Wirbel unter der Linie leuchtet, sein Name läuft im Griff mit; an den fünf
// Abschnitten rastet sie ein, dann fließt die Bahn und die Zeilen stehen links. Beim ersten Ankommen fährt der Scan
// einmal von oben nach unten und bleibt bei C1 stehen. Die Seite scrollt normal weiter (nur die Leiste fängt Wischen).
const SCAN = { idx: 0, y: -1, finger: 0, drag: false, demo: 0, demoT: 0, touched: false, seg: -1, segT: 0, top: 120, bot: 500, left: 0, right: 0, cleared: false, tagTxt: '', tagW: 0, grab: 0 };
const axisHead = $('#achse .axis-head'), axSticky = $('#achse .axis-sticky'), topBar = $('.top');
// Ärztlicher Hinweis am echten unteren Fensterrand (Kai 7.11.): die Bühne ist 100svh hoch (Leisten eingeblendet);
// sind Chromes/Safaris Leisten eingeklappt, rückt der Hinweis per Verschiebung nach unten. Die Fläche der Wirbelsäule
// bleibt fest (SCAN.bot aus der Lage ohne Verschiebung). Safari: Platz für die schwebende Adress-Pille lassen [O].
const IOS_SAFARI = /iP(hone|ad|od)/.test(navigator.userAgent) && !/CriOS|FxiOS|EdgiOS|OPiOS/.test(navigator.userAgent);
const NOTE = { shift: 0, safe: -1 };
const safeProbe = document.createElement('div'); safeProbe.setAttribute('aria-hidden', 'true');
safeProbe.style.cssText = 'position:fixed;left:0;bottom:0;width:0;height:env(safe-area-inset-bottom,0px);visibility:hidden;pointer-events:none';
document.body.appendChild(safeProbe);
addEventListener('resize', () => { NOTE.safe = -1; });
const scanUI = document.createElement('div'); scanUI.className = 'scan'; scanUI.setAttribute('aria-hidden', 'true');
// Griff zum Anfassen (Kai 6.11. spät, „kindlicher“): runder Knopf mit Rillen und ▲▼ in einer Rinne, Name daneben;
// eine gezeichnete Hand zieht ihn vor, bis man ihn selbst benutzt
const HAND_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 11V10a2 2 0 0 0-4 0M14 10V9a2 2 0 0 0-4 0v1M10 9.5V4a2 2 0 0 0-4 0v10M18 11a2 2 0 1 1 4 0v3a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-6-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/></svg>';
scanUI.innerHTML = '<div class="scan-track"></div>' + SSTOPS.map(() => '<i class="scan-tick"></i>').join('') +
  '<div class="scan-line"></div><div class="scan-tag"></div><div class="scan-thumb"><i class="sk-up"></i><i class="sk-grip"></i><i class="sk-dn"></i></div>' +
  `<div class="scan-coach"><i class="sc-ghost"></i>${HAND_SVG}</div>`;
document.body.appendChild(scanUI);
// Ziehstreifen = Aufzug: Haltestellen zum Antippen (echte Knöpfe, ersetzen die Punkte-Leiste), Ziehen am Griff
// Der Aufzug liegt im Dokument hinter der Bühne (Kapitel 03), damit die Tab-Reihenfolge stimmt (Durchsicht 7.11.);
// er steht trotzdem fest am rechten Fensterrand (position:fixed, kein Vorfahr mit transform)
const scanRail = document.createElement('div'); scanRail.className = 'scan-rail'; scanRail.setAttribute('role', 'group'); scanRail.setAttribute('aria-label', 'Abschnitt wählen'); (axis || document.body).appendChild(scanRail);
const [sTrack, ...sRest] = scanUI.children, sTicks = sRest.slice(0, SSTOPS.length), [sLine, sTag, sThumb, sCoach] = sRest.slice(SSTOPS.length);
const segNames = SSTOPS.map((st) => { const c = cardOf(st.zone); return c ? ($('.seg-no', c) || c).textContent.trim() : st.zone; });
const stopBtns = segNames.map((n, i) => {
  const b = document.createElement('button'); b.type = 'button'; b.className = 'scan-stop'; b.textContent = SLAB[i];
  b.setAttribute('aria-label', 'Abschnitt ' + n); b.tabIndex = i ? -1 : 0; scanRail.appendChild(b);
  b.addEventListener('click', () => scanGo(i));
  return b;
});
// Haltestelle wählen (Aufzug, Mausrad, Pfeiltasten, segnav/Punkte); scroll: Bühne ggf. erst ins Bild holen
function scanGo(i, scroll = false) {
  SCAN.idx = clamp(i, 0, SSTOPS.length - 1); SCAN.demo = 2; SCAN.touched = true; markStop();
  const r = axis.getBoundingClientRect();
  if (scroll && !(r.top <= 2 && r.bottom >= VH - 2)) scrollToY(r.top + scrollY + Math.max(0, r.height - VH) * 0.4);
}
// aktive Haltestelle: aria-current + einziger Tab-Halt (roving tabindex); segnav ebenso markiert
let markedStop = -1;
function markStop() {
  if (markedStop === SCAN.idx) return; markedStop = SCAN.idx;
  stopBtns.forEach((b, k) => { const on = k === SCAN.idx; b.tabIndex = on ? 0 : -1; if (on) b.setAttribute('aria-current', 'true'); else b.removeAttribute('aria-current'); });
  segBtns.forEach((b, k) => { if (k === SCAN.idx && (pcScan() || scanOn())) b.setAttribute('aria-current', 'true'); else b.removeAttribute('aria-current'); });
}
// Tastatur (Kai 7.11.): ↑↓ (und ←→, Pos1/Ende) wechseln die Haltestelle, der Fokus wandert mit
scanRail.addEventListener('keydown', (e) => {
  const k = e.key, n = SSTOPS.length;
  const to = k === 'ArrowUp' || k === 'ArrowLeft' ? SCAN.idx - 1 : k === 'ArrowDown' || k === 'ArrowRight' ? SCAN.idx + 1 : k === 'Home' ? 0 : k === 'End' ? n - 1 : null;
  if (to === null) return;
  e.preventDefault();
  scanGo(to); stopBtns[SCAN.idx].focus({ preventScroll: true });
});
// Mausrad über dem Aufzug (PC): eine Rastung = eine Haltestelle; an der ersten/letzten Haltestelle scrollt die Seite
// weiter (nicht festhängen). Das Ereignis erreicht Lenis dann nicht (stopPropagation), sonst scrollte die Seite mit.
const WHEEL = { acc: 0, t: 0 };
scanRail.addEventListener('wheel', (e) => {
  if (!scanRail.classList.contains('on')) return;
  const dy = e.deltaY * (e.deltaMode === 1 ? 33 : e.deltaMode === 2 ? VH : 1), dir = Math.sign(dy);
  if (!dir) return;
  const to = SCAN.idx + dir;
  if (to < 0 || to >= SSTOPS.length) { WHEEL.acc = 0; return; } // am Ende: Seite scrollt normal
  e.preventDefault(); e.stopPropagation();
  const now = performance.now();
  if (Math.sign(WHEEL.acc) !== dir || now - WHEEL.t > 400) WHEEL.acc = 0;
  WHEEL.acc += dy;
  if (Math.abs(WHEEL.acc) >= 40 && now - WHEEL.t > 260) { WHEEL.acc = 0; WHEEL.t = now; scanGo(to); }
}, { passive: false });
const levName = (id) => (id === 'S' ? 'Kreuzbein' : id === 'Co' ? 'Steißbein' : id);
let levY = [], stopY = [];
let RAIL_W = 88, RK = 1, railVW = -1; // Breite des Ziehstreifens rechts (px): links Haltestellen, rechts Rinne mit Griff
// wächst mit der Grundschrift (ab 1600 px, Griff/Haltestellen sind in rem) – Handy: 16 px → unverändert 88 px
function railMeasure() {
  if (railVW === VW) return; railVW = VW;
  RK = (parseFloat(getComputedStyle(document.documentElement).fontSize) || 16) / 16; RAIL_W = Math.round(88 * RK);
}
const nearestStop = (y) => { let b = 0; stopY.forEach((s, i) => { if (Math.abs(s - y) < Math.abs(stopY[b] - y)) b = i; }); return b; };
// Antippen = zur nächsten Haltestelle; Ziehen erst ab 6 px Bewegung (sonst zoomt ein Tippen kurz heraus) und relativ:
// die Linie bewegt sich um so viel wie der Finger, egal wo er aufsetzt – kein Sprung
let press = null;
scanRail.addEventListener('pointerdown', (e) => {
  press = { y: e.clientY }; SCAN.touched = true;
  try { scanRail.setPointerCapture(e.pointerId); } catch (err) { /* ohne Capture geht es auch */ }
  e.preventDefault();
});
scanRail.addEventListener('pointermove', (e) => {
  if (!press) return;
  if (!SCAN.drag && Math.abs(e.clientY - press.y) > 6) { SCAN.drag = true; SCAN.demo = 2; SCAN.grab = (SCAN.y >= 0 ? SCAN.y : e.clientY) - e.clientY; }
  if (SCAN.drag) SCAN.finger = e.clientY + SCAN.grab;
});
const scanUp = (e) => {
  if (!press) return;
  if (SCAN.drag) { SCAN.drag = false; if (stopY.length) SCAN.idx = nearestStop(SCAN.y); }
  else if (e.type === 'pointerup' && stopY.length) { SCAN.idx = nearestStop(press.y); SCAN.demo = 2; } // getippt
  press = null;
};
scanRail.addEventListener('pointerup', scanUp); scanRail.addEventListener('pointercancel', scanUp);
const _sv = new V3(), _Y = new V3(0, 1, 0);
function screenToWorldY(py) { // Bildschirmhöhe → Welt-y auf der Ebene z = 0 (dort steht die Wirbelsäule)
  _sv.set(0, 1 - (py / GLH) * 2, 0.5).unproject(camera);
  const o = camera.position, dz = _sv.z - o.z;
  return Math.abs(dz) < 1e-6 ? o.y : o.y + (_sv.y - o.y) * (-o.z / dz);
}
const easeIO = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
function screenToWorld(px, py, z, out) { // Bildschirmpunkt → Welt auf der Ebene z
  _sv.set((px / VW) * 2 - 1, 1 - (py / GLH) * 2, 0.5).unproject(camera);
  const o = camera.position, dz = _sv.z - o.z, t = Math.abs(dz) < 1e-6 ? 0 : (z - o.z) / dz;
  return out.set(o.x + (_sv.x - o.x) * t, o.y + (_sv.y - o.y) * t, z);
}
// Nahansicht (Kai 6.11.): steht die Linie an einem Abschnitt, fährt die Wirbelsäule heran (wie Option A); beim Ziehen,
// Vorführen und Antippen eines anderen Abschnitts zurück zur Übersicht. Griff, Leiste und Einrasten rechnen immer mit der
// Übersicht (OV), damit der Finger dieselbe Strecke behält. Größe je Abschnitt ≈ Kameraabstände der Option A.
const OV = { x: 0, y: 0, z: 0, w: 0.3, init: false }, ZM = { k: 0, idx: 0 }, _zw = new V3(), _zc = new V3(), _zc2 = new V3(), _sv2 = new V3();
const ZOOM = [3.4, 2.6, 2.15, 1.85, 2.25, 2.15]; // je Haltestelle (SSTOPS)
const PC_ZOOM = 0.92; // PC: Nahansicht relativ zur früheren Kamerafahrt
// Einblenden im Scanner (Kai 6.11., Variante b): Karte sofort beim Einrasten, die vier Zeilen nacheinander während des
// Heranfahrens; beim Ziehen bleiben die Texte kurz stehen und blenden ruhig aus.
const TX = { zone: null, t0: 0, last: 0 };
const TX_OPT = { th: [0.3, 0.55, 0.8, 1.05, 0.05], chip: 0.05, lines: true, slow: true };
function scanTexts(zKey, settle) {
  const now = performance.now();
  if (settle && zKey) { if (TX.zone !== zKey) { TX.zone = zKey; TX.t0 = now; } TX.last = now; }
  const held = !settle && TX.zone && now - TX.last < 650;
  if (!settle && !held) TX.zone = null;
  updateCalloutsMob(TX.zone, !!TX.zone && (settle || held), (now - TX.t0) / 1000, { ...TX_OPT, lines: settle });
}
const lvLocal = (lv, out) => out.set(lv.center.x * SC, (lv.center.y - CY) * SC, lv.center.z * SC).applyAxisAngle(_Y, spineRot);
// PC-Scanner (Kai 7.11., 1A 2A 3A): gleiche Mechanik, aber Text links bleibt (Überschrift, segnav, Karte, Hinweis),
// die Wirbelsäule steht zwischen Textspalte und Aufzug, die Nahansicht legt den Abschnitt in die Mitte, rechts davon
// erscheinen Silhouette, Versorgungsbahn und die frei platzierten Schilder (updateCallouts)
// rechter Rand der Textspalte (= MINX der Schilder): mindestens bis hinter die segnav-Knöpfe (große Monitore: Spalte breiter)
const pcCol = { w: -1, x: 600 };
const PC_COL = () => {
  if (pcCol.w !== VW) { const sn = $('.segnav'); pcCol.w = VW; pcCol.x = Math.max(Math.min(600, VW * 0.42), sn ? sn.getBoundingClientRect().right + 24 : 0); }
  return pcCol.x;
};
function updateScan(dt, r, inSec) {
  const X = uniforms.uXf.value[2], near = r.top < VH * 1.6 && r.bottom > -VH * 0.6, pc = isDesktop();
  railMeasure();
  if (!SCAN.cleared) { cards.forEach((c) => { c.style.opacity = ''; c.style.transform = ''; }); if (axisNote) axisNote.style.opacity = ''; SCAN.cleared = true; }
  markStop();
  if (near && pc) {
    // Bühne: unter der Kopfleiste bis kurz über den unteren Rand; löst sich die Bühne, geht alles mit nach oben
    const sr = axSticky ? axSticky.getBoundingClientRect() : null, lift = sr ? Math.min(0, sr.top) : 0;
    const hb = topBar ? topBar.getBoundingClientRect().bottom : 72;
    SCAN.top = hb + 22 + lift; SCAN.bot = (sr ? sr.bottom : VH) - 30;
    const tf = SCAN.top / GLH, bf = SCAN.bot / GLH;
    OV.w = ((bf - tf) * 8.197 * 0.95) / 8.7; OV.y = (0.5 - (tf + bf) / 2) * 8.197;
    // Übersicht: Mitte bei 40 % zwischen Textspalte und Aufzug (Silhouette ist beim Ziehen aus)
    const cx = PC_COL() + (VW - RAIL_W - PC_COL()) * 0.4;
    const tx = det && SCAN.right ? OV.x + (cx - (SCAN.left + SCAN.right) / 2) * (8.197 / GLH) : (cx - VW / 2) * (8.197 / GLH);
    OV.x = OV.init ? OV.x + (tx - OV.x) * (reduced ? 1 : 1 - Math.exp(-dt * 6)) : tx; OV.init = true;
  } else if (near) {
    // Bühne aus der echten Lage von Kopfleiste, Bühne und Hinweis: löst sich die Bühne beim Weiterscrollen, gehen
    // Wirbelsäule, Karte, Zeilen und Griff mit ihr nach oben (Kai 6.11.: in Chrome lief der Hinweis in die Zeilen)
    const nb = axisNote ? axisNote.getBoundingClientRect() : null, sr = axSticky ? axSticky.getBoundingClientRect() : null, lift = sr ? Math.min(0, sr.top) : 0;
    const hb = topBar ? topBar.getBoundingClientRect().bottom : 70;
    SCAN.cardTop = hb + 10 + lift; SCAN.top = hb + 16 + lift; SCAN.bot = (nb && nb.height ? nb.top - NOTE.shift : MINH - 60) - 12;
    if (nb && nb.height && sr) {
      if (NOTE.safe < 0) NOTE.safe = safeProbe.offsetHeight;
      // Unterkante ohne Verschiebung, als stünde die Bühne oben → Ziel: echter Fensterrand minus Reserve
      const natBot = nb.bottom - NOTE.shift - lift, res = IOS_SAFARI ? Math.max(64, NOTE.safe + 30) : NOTE.safe + 6;
      const sh = Math.max(0, Math.round(VH - res - natBot));
      if (sh !== NOTE.shift) { NOTE.shift = sh; axisNote.style.transform = sh ? `translateY(${sh}px)` : ''; }
    }
    const tf = SCAN.top / GLH, bf = SCAN.bot / GLH;
    OV.w = ((bf - tf) * 8.197 * 0.95) / 8.7; OV.y = (0.5 - (tf + bf) / 2) * 8.197;
    // ganze Wirbelsäule zwischen Kopfleiste und Hinweis, rechter Rand am Ziehstreifen
    const tx = det && SCAN.right ? OV.x + (VW - RAIL_W - 6 - SCAN.right) * (8.197 / GLH) : (0.22 * VW) * (8.197 / GLH);
    OV.x = OV.init ? OV.x + (tx - OV.x) * (reduced ? 1 : 1 - Math.exp(-dt * 6)) : tx; OV.init = true;
  }
  // ruhige Schrägansicht (Wurzeln zeigen nach links), atmet leicht hin und her
  const want = PROFILE + (pc ? -0.5 : 0.5) + (paused || reduced ? 0 : Math.sin(uniforms.uTime.value * 0.35) * 0.1); // PC: Wurzeln nach rechts
  spineRot += (want + Math.PI * 2 * Math.round((spineRot - want) / (Math.PI * 2)) - spineRot) * (reduced ? 1 : 1 - Math.exp(-dt * 2.2));
  uniforms.uSpineRot.value = spineRot;
  axisWant = null;
  if (!pc) { sil.visible = false; silU.uOn.value = 0; }
  periLabel.style.opacity = 0;

  const solid = (inSec ? smooth(VH * 1.0, VH * 0.25, r.top) * (1 - smooth(VH * 0.95, VH * 0.45, r.bottom)) : 0) * spineK;
  const eng = inSec && solid > 0.97 && r.top < VH * 0.12 && r.bottom > VH * 0.9; // Bühne steht
  // Bildschirmlage der Wirbel und der fünf Abschnitte (Übersicht)
  if (det && near) {
    const rects = spineRects(OV); // (nutzt dieselbe Projektion wie die PC-Schilder)
    if (rects.length) { SCAN.left = Math.min(...rects.map((q) => q[0])); SCAN.right = Math.max(...rects.map((q) => q[2])); }
    levY = det.levels.map((lv) => toPx(lvLocal(lv, _zc).multiplyScalar(OV.w).add(_zw.set(OV.x, OV.y, 0)))[1]);
    stopY = SSTOPS.map((st) => st.ids.reduce((a, id) => a + levY[det.levels.findIndex((l) => l.id === id)], 0) / st.ids.length);
  }
  const ready = eng && stopY.length;
  if (ready && SCAN.demo === 0) { if (reduced || paused) { SCAN.demo = 2; SCAN.idx = 0; } else { SCAN.demo = 1; SCAN.demoT = 0; } }
  let y = SCAN.y;
  if (stopY.length) {
    const yMin = levY[0] - 6, yMax = levY[levY.length - 1] + 6;
    if (SCAN.demo === 1 && ready) {
      SCAN.demoT += dt; const t = SCAN.demoT;
      if (t < 2.6) y = yMin + (yMax - yMin) * easeIO(t / 2.6);
      else if (t < 3.6) y = yMax + (stopY[0] - yMax) * easeIO((t - 2.6) / 1.0);
      else { SCAN.demo = 2; SCAN.idx = 0; y = stopY[0]; }
    } else if (SCAN.drag) {
      let f = clamp(SCAN.finger, yMin, yMax); const i = nearestStop(f), d = f - stopY[i];
      if (Math.abs(d) < 24) f = stopY[i] + d * 0.3; // einrasten
      y = f;
    } else {
      const w = stopY[SCAN.idx];
      y = y < 0 || !eng ? w : y + (w - y) * (reduced ? 1 : 1 - Math.exp(-dt * 9));
    }
    SCAN.y = y;
  }
  const iN = stopY.length ? nearestStop(y) : 0;
  const seg = ready && SCAN.demo === 2 && Math.abs(y - stopY[iN]) < 8 ? iN : -1;
  if (seg !== SCAN.seg) { SCAN.seg = seg; SCAN.segT = performance.now(); }
  if (seg >= 0) setActive(seg);

  // Nahansicht: heran, sobald die Linie an einem Abschnitt steht; beim Ziehen/Wechseln zügig zurück (Bühne nicht
  // im Bild: Zustand halten, damit beim Weiterscrollen nichts mehr zoomt)
  const settle = ready && seg >= 0 && !SCAN.drag;
  if (ready) {
    if (settle) ZM.idx = seg;
    ZM.k = reduced ? (settle ? 1 : 0) : ZM.k + ((settle ? 1 : 0) - ZM.k) * (1 - Math.exp(-dt * (settle ? 2.6 : 7)));
  }
  if (near) {
    let zx = OV.x, zy = OV.y, zw = OV.w;
    if (det && ZM.k > 0.001 && pc) {
      // PC: Größe wie die frühere Kamerafahrt (Abstand STOPS.d), Abschnitt bei 56 % Breite, mittig in der Bühne
      const st = SSTOPS[ZM.idx];
      _zc.set(0, 0, 0); st.ids.forEach((id) => _zc.add(lvLocal(det.levels.find((l) => l.id === id), _zw))); _zc.divideScalar(st.ids.length);
      zw = Math.max(OV.w, (13 / (st.d * SC * 0.86)) * PC_ZOOM);
      const silX = VW - RAIL_W - 34 - 0.095 * GLH; // Mitte der Silhouette (siehe placeSilhouette)
      screenToWorld(Math.max(VW * 0.56, PC_COL() + (silX - PC_COL()) * 0.36), (SCAN.top + SCAN.bot) / 2, _zc.z * zw, _zw);
      zx = _zw.x - _zc.x * zw; zy = _zw.y - _zc.y * zw;
    } else if (det && ZM.k > 0.001) {
      const st = SSTOPS[ZM.idx];
      _zc.set(0, 0, 0); st.ids.forEach((id) => _zc.add(lvLocal(det.levels.find((l) => l.id === id), _zw))); _zc.divideScalar(st.ids.length);
      zw = OV.w * ZOOM[ZM.idx];
      if (ML.key === st.zone && ML.hs[0]) mobPlaceScan();
      const py = ML.key === st.zone && ML.hs[0] ? ML.y0 + ML.hs[0] / 2 : SCAN.top + (SCAN.bot - SCAN.top) * 0.4;
      // Abschnitt mittig zwischen Zeilen-Spalte und Ziehstreifen
      screenToWorld(Math.max(VW * 0.55, (ML.x + ML.colW + VW - RAIL_W) / 2 + 6), py, _zc.z * zw, _zw);
      zx = _zw.x - _zc.x * zw; zy = _zw.y - _zc.y * zw;
      // Kai 7.11.: Wirbelkörper des Abschnitts rechts neben den Zeilen (sonst liegt der Nerv auf dem Knochen),
      // höchstens bis vor den Ziehstreifen
      if (ML.key === st.zone && ML.hs[0]) {
        const ppw = GLH / 8.197, rowR = ML.x + Math.max(ML.ws[0], ML.ws[1], ML.ws[2], ML.ws[3]) + 12;
        let left = 1e9, right = -1e9;
        st.ids.forEach((id) => { const lv = det.levels.find((l) => l.id === id), cx = toPx(lvLocal(lv, _zc2).multiplyScalar(zw).add(_sv2.set(zx, zy, 0)))[0], h = lv.R * SC * zw * 1.15 * ppw; left = Math.min(left, cx - h); right = Math.max(right, cx + h); });
        const need = clamp(rowR - left, 0, Math.max(0, VW - RAIL_W * 0.6 - right));
        zx += need / ppw;
      }
      // Wurzelende (links außen) bei voller Nahansicht → Bildschirmhöhe für die Zeilen (mobPlaceScan)
      let tb = null, tc = null;
      det.curves.forEach((c) => { if (c.kind !== 2 || ZONES[c.zone] !== st.zone || !rootOk(c, st.zone)) return; const e = c.pts[CURVE_W - 1]; _pv.set(e[0], e[1], e[2]).applyAxisAngle(_Y, spineRot); if (!tb || _pv.x < tb.x) { tb = _pv.clone(); tc = c; } });
      if (tb) {
        const q = tc.pts[ROOT_I[0]];
        ML.tipT = toPx(tb.multiplyScalar(zw).add(_zw.set(zx, zy, 0)))[1];
        ML.exitT = toPx(_pv.set(q[0], q[1], q[2]).applyAxisAngle(_Y, spineRot).multiplyScalar(zw).add(_zw.set(zx, zy, 0)))[1];
        ML.tipKey = st.zone;
      }
    }
    const e = ZM.k * ZM.k * (3 - 2 * ZM.k);
    X.set(OV.x + (zx - OV.x) * e, OV.y + (zy - OV.y) * e, 0, OV.w + (zw - OV.w) * e);
  }
  const zoomE = ZM.k * ZM.k * (3 - 2 * ZM.k);
  // Aufbau beim Hereinkommen (Scan von oben), Auflösen nach oben beim Weiterscrollen
  const topY = X.y + 4.35 * X.w, botY = X.y - 4.35 * X.w;
  uniforms.uCut.value = solid <= 0 ? 100 : THREE.MathUtils.lerp(topY + 0.05, botY - 0.05, solid);
  spineGroup.visible = solid > 0; sU.uOn.value = solid > 0 ? 1 : 0;
  if (bones) bones.pts.material.uniforms.uStip.value = (renderer ? renderer.getPixelRatio() : 1) * GLH * 0.5 / tanH * X.w * (bones.name === 'grain' ? bones.spacing * 0.78 : 0.022);
  // Band unter der Linie: Lage in der Übersicht → in Wirbelsäulen-Einheiten → aktuelle (ggf. herangezoomte) Lage
  sU.uScan.value = y >= 0 && OV.w > 0 ? ((screenToWorldY(y) - OV.y) / OV.w) * X.w + X.y : 100;
  sU.uScanAmt.value += ((ready ? 1 - 0.7 * zoomE : 0) - sU.uScanAmt.value) * Math.min(1, dt * 6);

  // Abschnitt: Hervorhebung, Bahn, Zeilen (erst, wenn die Nahansicht fast angekommen ist)
  const zone = seg >= 0 ? ZONES.indexOf(SSTOPS[seg].zone) : -10, zKey = seg >= 0 ? SSTOPS[seg].zone : null;
  if (zone !== sU.uZone.value) { sU.uZone.value = zone; sU.uZoneAmt.value = 0; sU.uPeri.value = 0; }
  sU.uZoneAmt.value += ((zone >= 0 ? 1 : 0) - sU.uZoneAmt.value) * 0.07;
  sU.uPeri.value += ((zKey && (pc || ML.key === zKey) && ZM.k > (pc ? 0.75 : 0.4) ? 1 : 0) - sU.uPeri.value) * 0.05;
  if (pc) {
    // PC: Silhouette rechts (vor dem Aufzug), Bahn bis ins Versorgungsgebiet, Schilder frei platziert
    placeSilhouette();
    const silOn = zKey ? sU.uPeri.value : 0;
    silU.uOn.value = silOn; sil.visible = silOn > 0.01;
    if (zKey && det) updatePeri(zKey);
    if (settle && zKey) { if (TX.zone !== zKey) { TX.zone = zKey; TX.t0 = performance.now(); } } else TX.zone = null;
    updateCallouts(zKey, TX.zone ? Math.min(0.9, (performance.now() - TX.t0) / 1000 * 0.25) : 0, silOn > 0.5);
    chipsEl.style.opacity = 0;
  } else {
    if (zKey && det) updatePeri(zKey);
    scanTexts(zKey, settle);
  }

  // Überschrift weicht, sobald gescannt wird; Hinweis geht beim Weiterscrollen mit (nicht über dem Haus stehen lassen)
  // PC: Textspalte bleibt stehen (2A)
  if (axisHead && !pc) axisHead.style.opacity = ready && SCAN.demo === 2 ? 0 : '';
  if (axisNote && !pc) axisNote.style.opacity = (1 - smooth(VH * 0.98, VH * 0.62, r.bottom)).toFixed(3);
  if (pc && axisHead && axisHead.style.opacity) axisHead.style.opacity = ''; // Fenster vom Handy- auf PC-Format gezogen
  if (pc && axisNote && (axisNote.style.opacity || NOTE.shift)) { axisNote.style.opacity = ''; axisNote.style.transform = ''; NOTE.shift = 0; }
  scanUI.classList.toggle('on', !!ready);
  scanRail.classList.toggle('on', !!ready && (pc || SCAN.demo === 2)); // PC: auch während der Vorführfahrt per Tab erreichbar
  if (!ready || y < 0) return;
  // Aufzug rechts: Rinne, Haltestellen und Griff bleiben fest (Übersicht), auch in der Nahansicht – der Griff zeigt,
  // wo man steht; die Scan-Linie über der Wirbelsäule gehört zur Übersicht und tritt in der Nahansicht zurück
  const yMin = levY[0] - 6, yMax = levY[levY.length - 1] + 6, tx = VW - 26 * RK, rTop = yMin - 28 * RK;
  sTrack.style.transform = `translate(${tx - 3}px, ${yMin.toFixed(1)}px)`; sTrack.style.height = (yMax - yMin).toFixed(1) + 'px';
  sTicks.forEach((el, i) => { el.style.transform = `translate(${tx - 10}px, ${stopY[i].toFixed(1)}px)`; el.classList.toggle('is-on', i === seg); });
  stopBtns.forEach((b, i) => { b.style.top = (stopY[i] - rTop).toFixed(1) + 'px'; b.classList.toggle('is-on', i === seg); });
  sThumb.style.transform = `translate(${tx}px, ${y.toFixed(1)}px)`; sThumb.classList.toggle('is-on', seg >= 0); sThumb.classList.toggle('is-drag', SCAN.drag);
  // Name links neben dem Griff, solange die Karte nicht steht (Ziehen, Vorführen)
  const txt = seg >= 0 ? segNames[seg] : levName(det.levels[levY.reduce((b, v, i) => (Math.abs(v - y) < Math.abs(levY[b] - y) ? i : b), 0)].id);
  if (txt !== SCAN.tagTxt) { sTag.textContent = txt; SCAN.tagTxt = txt; SCAN.tagW = sTag.offsetWidth; }
  sTag.style.transform = `translate(${(VW - RAIL_W - 6 - SCAN.tagW).toFixed(1)}px, ${(y - 14 * RK).toFixed(1)}px)`;
  sTag.style.opacity = zoomE < 0.3 ? 1 : 0;
  const lx = SCAN.left - 10;
  sLine.style.transform = `translate(${lx.toFixed(1)}px, ${y.toFixed(1)}px)`; sLine.style.width = Math.max(0, VW - RAIL_W - 6 - (zoomE < 0.3 ? SCAN.tagW + 4 : 0) - lx).toFixed(1) + 'px';
  sLine.style.opacity = (1 - zoomE).toFixed(3);
  // Wischhilfe: eine Hand zieht den Griff vor, bis man ihn selbst benutzt (Text steht im Kapitel-Hinweis)
  sCoach.classList.toggle('on', !SCAN.touched && SCAN.demo === 2);
  sCoach.style.transform = `translate(${tx}px, ${y.toFixed(1)}px)`;
  scanRail.style.left = (VW - RAIL_W).toFixed(0) + 'px'; scanRail.style.top = rTop.toFixed(0) + 'px'; scanRail.style.height = (yMax - yMin + 56 * RK).toFixed(0) + 'px';
}

function updateAxis(dt) {
  const ph = PH(), desk = isDesktop();
  const r = axis.getBoundingClientRect();
  const p = clamp(-r.top / Math.max(1, r.height - VH));
  const inSec = r.top < VH && r.bottom > 0 && morphNow > 1.6 && morphNow < 2.4;
  // noch nicht fertig gerechnet: grobe Partikel bleiben, danach fahren Scan und Kamera sanft nach
  spineK = bones ? ramp(spineK, dt) : 0;
  if (desk ? pcScan() : scanOn()) { updateScan(dt, r, inSec); return; } // Handy: Scanner (6.11.), PC: Hybrid-Scanner (7.11.)
  scanUI.classList.remove('on'); scanRail.classList.remove('on'); chipsEl.style.opacity = 0; sU.uScanAmt.value = 0;
  if (SCAN.cleared) { SCAN.cleared = false; if (axisHead) axisHead.style.opacity = ''; if (axisNote) axisNote.style.transform = ''; NOTE.shift = 0; }
  if (desk) { axisWant = null; spineGroup.visible = false; sil.visible = false; return; } // PC ohne WebGL: Karte per segnav, keine Fahrt
  const X = uniforms.uXf.value[2];
  let mob = null;
  if (r.top < VH * 2 && r.bottom > -VH) {
    if (!dotsStuck) measureDots();
    const vh = MINH, c0 = cards[0].getBoundingClientRect().top, nt = axisNote ? axisNote.getBoundingClientRect().top : r.bottom;
    mob = {
      inK: smooth(vh * 2.0, vh * 1.7, c0),    // Scan baut sich schon mit der Überschrift auf
      bigK: smooth(vh * 1.75, vh * 1.35, c0), // Überschrift geht: ganze Wirbelsäule groß und mittig (bleibt groß)
      wIn: smooth(vh * 1.15, vh * 0.98, c0),  // Kamerafahrt zum ersten Abschnitt (Karte noch unsichtbar)
      endK: smooth(vh * 0.45, vh * 0.2, nt),  // nach letzter Karte + Hinweis: zurück zur ganzen Wirbelsäule
      outK: smooth(vh * 1.05, vh * 0.6, dachSec.getBoundingClientRect().top), // auflösen (nach oben)
    };
    // ganze Wirbelsäule (Kopf bis Kreuzbein) groß und mittig im sichtbaren Bereich unter der Punkte-Leiste
    // (Bruchteile der Szenenhöhe GLH; Abschnitts-Posen rechnen relativ dazu, die Nahansichten bleiben gleich)
    const top = clamp(dotsStuck / GLH, 0.08, 0.3), bot = (MINH * 0.97) / GLH, e = mob.bigK;
    const sEnd = ((bot - top) * 8.197 * 0.86) / 8.7, yEnd = (0.5 - (top + bot) / 2) * 8.197;
    const ty = MOB_X2.y + (yEnd - MOB_X2.y) * e + mob.outK * 1.1, ts = MOB_X2.s + (sEnd - MOB_X2.s) * e;
    const kx = reduced ? 1 : 1 - Math.exp(-dt * 6); // weich nachführen statt hart am Scrollen (kein Zucken)
    X.set(X.x * (1 - kx), X.y + (ty - X.y) * kx, 0, X.w + (ts - X.w) * kx);
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
  if (bones) bones.pts.material.uniforms.uStip.value = (renderer ? renderer.getPixelRatio() : 1) * GLH * 0.5 / tanH * X.w * (bones.name === 'grain' ? bones.spacing * 0.78 : 0.022);

  // Kamera: Übersicht ↔ Kamerafahrt
  const w = !inSec ? 0 : (mob ? mob.wIn * (1 - mob.endK) : smooth(ph.M0, ph.J0, p) * (1 - smooth(ph.J1, ph.M1, p))) * spineK;
  let jPose = null, zoneIdx = active;
  // Handy: Karten-Deckkraft immer nachführen, solange das Kapitel in der Nähe ist – sonst bleibt beim
  // Hinausscrollen eine Karte halb sichtbar stehen (Kamerafahrt endet vorher, w = 0)
  if (r.top < VH * 2 && r.bottom > -VH) {
    // Karte erst zeigen, wenn die Kamera am Abschnitt steht (ohne Kamerafahrt, z. B. ohne WebGL: sofort)
    if (axisWant && w > 0.01) {
      const err = cam.pos.distanceTo(axisWant.pos) / Math.max(0.01, axisWant.pos.distanceTo(axisWant.target));
      if (err < 0.5) camArrive = Math.max(camArrive, 0.001); // ungefähr am Ziel genügt
    }
    else if (!(w > 0.01)) camArrive = 0;
    const arrived = !(w > 0.01) || camArrive > 0;
    gateK = reduced ? (arrived ? 1 : 0) : gateK + ((arrived ? 1 : 0) - gateK) * (1 - Math.exp(-dt * 9));
    const sel = mobileCard(gateK);
    if (sel !== mobSel) { mobSel = sel; camArrive = 0; if (w > 0.01) gateK = 0; }
  }
  if (w > 0) {
    // Abschnitt über der Kartenoberkante halten: rutscht die Karte beim Lesen nach oben, wandert er mit
    const ct = cards[mobSel].getBoundingClientRect().top / GLH, top = clamp(dotsStuck / GLH, 0.08, 0.3);
    setActive(mobSel); jPose = stopPose(mobSel, clamp((top + ct) / 2, top + 0.04, 0.3)); zoneIdx = mobSel;
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
  // Handy mit Zeilen: Bahn erst, wenn die Zeilen des Abschnitts gemessen sind (sie endet am „Ziel“)
  const stick = stickOn(), zKey = zone >= 0 ? STOPS[zoneIdx].zone : null;
  const periOn = zone >= 0 && w > 0.9 && (!stick || ML.key === zKey) ? 1 : 0;
  sU.uPeri.value += (periOn - sU.uPeri.value) * 0.05;
  if (zone >= 0) updatePeri(zKey);
  periLabel.style.opacity = (!stick && sU.uPeri.value > 0.6 && spineGroup.visible ? 1 : 0);
  silU.uOn.value = 0; sil.visible = false; // Silhouette nur im PC-Scanner
  updateCalloutsMob(stick ? zKey : null, stick && mobStuck && gateK > 0.9 && sU.uPeri.value > 0.6 && spineGroup.visible, mobProg);
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
// Hausordnung am Handy (Kai 7.11.): die Paragraphen wechseln von selbst, solange der Abschnitt im Bild steht – kein
// langer Scrollweg mehr. Lesezeit nach Textlänge (~5 s), Leiste wie ein Puls (füllt sich), antippen = dorthin bzw. weiter;
// bei „Bewegung anhalten“ steht der Wechsel (WCAG 2.2.2), beim erneuten Hereinscrollen beginnt es bei §1. PC seit 7.11. ebenso.
const lawBtns = $$('#lawProg button'), lawDur = laws.map((li) => 2600 + 45 * li.textContent.trim().length);
const LAW = { t: 0, vis: false, last: 0 };
function setLaw(i) { if (i === lawOn) return; laws[lawOn].classList.remove('is-on'); laws[i].classList.add('is-on'); lawOn = i; }
lawBtns.forEach((b, i) => b.addEventListener('click', () => { setLaw(i); LAW.t = 0; }));
$('#laws').addEventListener('click', () => { setLaw((lawOn + 1) % laws.length); LAW.t = 0; });

// ---------- K1 „Die Tür geht auf“ (nur mit ?licht=1; Standard dunkel seit 4.11. abends): Kapitel 05 wird hell ----------
// Über die letzten 60 % der Hausordnung blendet die Seite von Dunkel in warmes Off-White (V10-Palette),
// Bernstein bleibt, die Partikel weichen warmem Sonnenstaub. Der Übergang hängt allein am Scrollen
// (keine Eigenbewegung); bei „Bewegung anhalten“ steht der Staub still, bei „reduzieren“ treibt er langsam.
const licht = new URLSearchParams(location.search).get('licht') === '1'; // seit 4.11. abends wieder aus (Kai: „erschlägt“, alles dunkel); ?licht=1 = hell zum Vergleich
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
    // Handy: Bewegungslinien → Wirbelsäule früher fertig, damit der Scan schon mit der Überschrift entsteht
    if (!isDesktop() && prev === 1 && s === 2) t = smooth(vh * 0.95, vh * 0.4, r.top);
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
  uCut: { value: -10 }, uOn: { value: 0 }, uRoom: { value: -1 }, uFade: { value: 1 }, uStip: { value: 1 }, uReady: { value: 0 }, uDim: { value: 1 },
  cBone: uniforms.cBone, cAmber: uniforms.cAmber, cBlue: uniforms.cBlue, cGreen: uniforms.cGreen, cPetrol: uniforms.cPetrol, cCore: { value: C('#0E1C22') },
};
const T_COMMON = /* glsl */`
  attribute float aKind, aRoom;
  uniform float uTime, uPix, uRot, uCut, uOn, uRoom, uFade, uStip, uReady, uDim; uniform vec4 uXf;
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
        vec3 col = aKind < .5 ? cPetrol * .85 : aKind < 1.5 ? cBone * .34 : cBone * 1.05; // 3C 7.11.: Wandzeilen zurück, Kanten vor
        col *= roomGain();
        float g = exp(-pow((position.y - uCut) * 14., 2.));
        col = mix(col, cAmber * 1.4, g);
        vec4 mv = viewMatrix * vec4(p, 1.);
        gl_Position = projectionMatrix * mv;
        float d = -mv.z, dn = d / uXf.w;
        gl_PointSize = clamp(uPix * (aKind > 5.5 ? 1.5 : aKind > .5 ? 1. : 1.1) * 9. / d, 1., 3.5) * (1. + g);
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
        vec3 col = base * (.16 + .64 * lam) + base * rim * 1.1 + cBlue * rim * .1; // 3C 7.11.: Umriss heller als die Fläche (differenziert)
        col *= roomGain() * (.25 + .75 * uFade) * uReady * uDim; // uDim: Handy vor dem Betreten gedämpft
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
// einmal rechnen; der Rundgang aus Augenhöhe (Dialog) nutzt dieselbe Punktwolke (prxP)
let prxP = null;
const buildPrx = () => prxP || (prxP = runSliced(praxisScanGen(isDesktop() ? 85000 : 32000, isDesktop() ? 1 : 0.62)).then((r) => { prx = r; buildTour(); return r; }));
whenNear($('#dach'), buildPrx);

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
  if (egoOpen || !tourInView() || e.altKey || e.ctrlKey || e.metaKey || /input|textarea|select/i.test(document.activeElement?.tagName || '')) return;
  if (e.key === 'ArrowRight') { e.preventDefault(); tourStep(1); }
  else if (e.key === 'ArrowLeft') { e.preventDefault(); tourStep(-1); }
  else if (e.key === 'Escape' && tourIdx >= 0) goRoom(-1);
});
// Wischen über das Haus (Handy): waagerecht = Raum wechseln, senkrecht bleibt Scrollen
{ let x0 = null, y0 = 0; const st = $('.tour-sticky');
  st?.addEventListener('touchstart', (e) => { if (e.target.closest('a,button')) return; x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; }, { passive: true });
  st?.addEventListener('touchend', (e) => { if (x0 === null) return; const t = e.changedTouches[0], dx = t.clientX - x0, dy = t.clientY - y0; x0 = null; if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.3) tourStep(dx < 0 ? 1 : -1); }, { passive: true }); }
let tourWant = null, tourHide = 0, xray = 0, dragRot = 0, hoverRoom = -1;
// Handy: Röntgenblick ruhiger (Linien 25 %, Haus-Umriss blass), bis man den Rundgang betritt – der Text von Kapitel 04 liegt darüber
let tourEngaged = false, xrayCalm = 1, viewLift = 0;
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
  if (vis > 0) manuTag.style.transform = `translate(${((w.x * 0.5 + 0.5) * VW).toFixed(1)}px, ${((-w.y * 0.5 + 0.5) * GLH - 30).toFixed(1)}px) translate(-50%, -100%)`;
}
// Haus mit gedrückter Maus drehen (PC, Röntgenblick)
{ let down = null; addEventListener('pointerdown', (e) => { if (!egoOpen && xray > 0.4 && e.pointerType === 'mouse' && e.clientX > VW * 0.45 && !e.target.closest('a,button,.room-tag')) down = e.clientX; });
  addEventListener('pointermove', (e) => { if (down !== null) { dragRot += (e.clientX - down) * 0.006; down = e.clientX; } });
  addEventListener('pointerup', () => (down = null)); }
function xrayPose() {
  const X = uniforms.uXf.value[3], desk = isDesktop();
  return frame(toWorld(new V3(0, -1.75, 0.1)), new V3(0.18, 0.62, 1), (desk ? 20 : ROOF_D) * X.w, desk ? 0.69 : 0.5, desk ? 0.56 : roofFy());
}
// Handy (Kai 7.11., 2A): Überschrift oben, Knöpfe unten – das Haus steht in der freien Fläche dazwischen. Gerechnet in der
// Lage „Bühne steht“ (relativ zur Bühnen-Oberkante), damit das Haus beim Hereinscrollen nicht mitwandert.
const tourStickyEl = $('.tour-sticky'), tourKickerEl = $('#tour .tour-kicker');
let roofFyV = 0.3, roofFyT = 0, roofMid = 0; // roofMid: Mitte der freien Fläche (px ab Bühnen-Oberkante)
function roofFy() {
  const now = performance.now();
  if (now - roofFyT > 500 && tourStickyEl && roofIntro && tourKickerEl) {
    roofFyT = now;
    const st = tourStickyEl.getBoundingClientRect().top, ib = roofIntro.getBoundingClientRect().bottom - st, kt = tourKickerEl.getBoundingClientRect().top - st;
    if (kt > ib + 40) { roofMid = (ib + kt) / 2; roofFyV = clamp(roofMid / GLH + ROOF_FY_OFF, 0.3, 0.75); }
  }
  return roofFyV;
}
const ROOF_D = 34; // Handy: Abstand so, dass das ganze Haus unter der Überschrift steht (vorher 17 = Räume groß)
const ROOF_FY_OFF = 0.05; // Bezugspunkt liegt im unteren Teil des Hauses → etwas tiefer, damit das Dach frei bleibt
// Handy: nach dem Rundgang (bis die Manuthera-Bühne vorbei ist) kein Haus/Röntgenblick mehr – 0 … 1
function houseGone() {
  const vh = MINH, tb = tourEl.getBoundingClientRect().bottom, mb = manuSec ? manuSec.getBoundingClientRect().bottom : 0;
  return (1 - smooth(vh * 0.55, vh * 0.98, tb)) * smooth(vh * 0.1, vh * 0.5, mb); // blendet aus, sobald die Knöpfe hochwandern
}
// ---------- Kapitel 04: Rundgang aus Augenhöhe (Go Kai 7.11. „1B+ 2a/a 3a 4 ja“) ----------
// Eigene Vollbild-Bühne als <dialog> (Fahrt aus src/ego/tour.js, wie die Testseite rundgang-ego.html). Angelegt erst beim
// ersten Klick (keine Startzeit), nutzt die fertige Praxis-Punktwolke (prxP). B+: vorher fährt die Kamera im Röntgenblick
// ~0,65 s Richtung Tür. Esc/„Übersicht“/Zurück-Taste schließen → gleiche Scroll-Stelle, wieder Röntgenblick.
// „Bewegung reduzieren“: kein Anflug, „Ohne Fahrt“ an und gesperrt (Schnitte); „Bewegung anhalten“: „Ohne Fahrt“ vorausgewählt.
const egoDlg = $('#ego'), egoBtn = $('#egoOpen'), egoLoading = $('#egoLoading');
let ego = null, egoOpen = false, egoZoom = false, egoSkipPop = false, egoAfter = null;
if (egoDlg && egoBtn) {
  $('#egoHint').textContent = finePointer ? 'Ziehen = umschauen · Pfeiltasten = weiter' : 'Ziehen = umschauen';
  const egoShow = () => {
    egoZoom = false;
    if (!ego) {
      ego = createEgo({
        canvas: $('#egoGl'), keys: egoDlg, mobile: !isDesktop(), reduced, still: paused,
        ui: {
          cap: $('#egoCap'), capNo: $('#egoNo'), capKick: $('#egoKick'), capTitle: $('#egoTitle'), capText: $('#egoText'), contact: $('#egoContact'),
          prev: $('#egoPrev'), play: $('#egoPlay'), next: $('#egoNext'), optStill: $('#egoStill'), optCalm: $('#egoCalm'), optBig: $('#egoBig'),
          hint: $('#egoHint'), veil: $('#egoVeil'),
        },
      });
      if (!ego) { egoBtn.hidden = true; return; } // zweite WebGL-Bühne nicht möglich → Knopf weg, Klick-Rundgang bleibt
    }
    ego.reset();
    egoOpen = true;
    document.documentElement.classList.add('ego-open');
    if (lenis) lenis.stop();
    egoDlg.showModal();
    try { history.pushState({ hopEgo: 1 }, ''); } catch (e) { /* ohne Verlauf */ }
    ego.start();
    if (!ego.ready) {
      egoLoading.hidden = false;
      buildPrx().then((r) => { ego.setPrx(r); egoLoading.hidden = true; }).catch(() => { egoLoading.textContent = 'Fehler beim Aufbau.'; });
    }
  };
  egoBtn.addEventListener('click', () => {
    if (egoOpen || egoZoom || !renderer) return;
    if (tourIdx >= 0) goRoom(-1);
    if (reduced || xray < 0.3) { egoShow(); return; }
    egoZoom = true; setTimeout(egoShow, 650);
  });
  const egoClose = (fromPop) => {
    if (!egoOpen) return;
    egoOpen = false;
    ego.stop();
    if (egoDlg.open) egoDlg.close();
    document.documentElement.classList.remove('ego-open');
    if (lenis) lenis.start();
    if (!fromPop && history.state && history.state.hopEgo) { egoSkipPop = true; history.back(); } // eigener Verlaufseintrag weg
    else if (egoAfter) { const f = egoAfter; egoAfter = null; requestAnimationFrame(f); }
    egoBtn.focus({ preventScroll: true });
  };
  $('#egoClose').addEventListener('click', () => egoClose());
  egoDlg.addEventListener('close', () => egoClose()); // Esc (Browser schließt den Dialog selbst)
  addEventListener('popstate', () => {
    if (egoSkipPop) { egoSkipPop = false; if (egoAfter) { const f = egoAfter; egoAfter = null; requestAnimationFrame(f); } return; }
    if (egoOpen) egoClose(true); // Zurück-Taste / Wischgeste am Handy
  });
  // „Bis bald“ → Termin & Kontakt: Dialog zu, dann zur Tür (Kapitel 05) – erst nach dem Rücksprung im Verlauf
  $('#egoContact').addEventListener('click', (e) => {
    e.preventDefault();
    egoAfter = () => { const t = $('#tuer'); if (t) scrollToY(t.getBoundingClientRect().top + scrollY); };
    egoClose();
  });
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
  const pvIn = desk ? smooth(2.55, 2.95, morphNow) : Math.min(smooth(2.7, 2.95, morphNow), smooth(MINH * 1.02, MINH * 0.72, roofIntro.getBoundingClientRect().top));
  const pv = morphNow > 2.55 && morphNow < 3.45 ? pvIn * (1 - smooth(3.05, 3.45, morphNow)) * (1 - inside) * (1 - manuK) * (1 - listK) * (desk ? 1 : 1 - houseGone()) : 0;
  xray = pv;
  if (tourIdx >= 0) tourEngaged = true; else if (!tourInView()) tourEngaged = false;
  xrayCalm += ((desk || tourEngaged ? 1 : 0.6) - xrayCalm) * (1 - Math.exp(-dt * 3)); // Handy 7.11.: Text steht über dem Haus, nicht mehr darauf → weniger dämpfen (vorher 0.25)
  tU.uCut.value = inside > 0.001 ? -3.05 + inside * 1.9 : (pv > 0 ? -1.0 : -10);
  tU.uOn.value = inside > 0.001 || pv > 0 ? 1 : 0; tourPts.visible = inside > 0.001 || pv > 0;
  tU.uFade.value = inside > 0.001 ? Math.max(inside, pv * 0.55 * xrayCalm) : pv * 0.55 * xrayCalm;
  tU.uDim.value = Math.max(inside, 0.2 + 0.8 * xrayCalm); // Möbel mitdämpfen (PC: xrayCalm = 1 → unverändert)
  tU.uReady.value = prx ? ramp(tU.uReady.value, dt) : 0;
  if (prx) tU.uStip.value = (renderer ? renderer.getPixelRatio() : 1) * GLH * 0.5 / Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * prx.spacing * uniforms.uXf.value[3].w * 0.62;
  uniforms.uRoofLift.value += (Math.max(pv * 1.3, inside * 1.1) - uniforms.uRoofLift.value) * 0.08;
  tourHide = Math.min(1, inside * 1.4);
  // Hausdrehung festhalten, solange wir drinnen sind
  const free = Math.sin(uniforms.uTime.value * 0.2) * 0.45 - 0.55 + dragRot;
  uniforms.uHouseRot.value = THREE.MathUtils.lerp(free, TOUR_ROT, smooth(0, 0.6, inside));
  if (tourIdx < 0) {
    // Röntgenblick: Kamera leicht von oben (wie im Design „Zuhause“), damit sich die Schilder nicht überlagern
    tourWant = pv > 0.3 ? (egoZoom ? tourPose(TOUR.entry) : xrayPose()) : null; // B+: vor dem Augenhöhe-Rundgang Richtung Tür
    if (pv > 0.3) { // Räume, Tür und Modell als anklickbare Schilder
      tU.uRoom.value = hoverRoom;
      const place = (t, i, p, right) => { const w = toWorld(p); w.project(camera); t.el.classList.add('click'); t.el.classList.toggle('on', i === hoverRoom); t.el.style.opacity = egoZoom ? 0 : pv; t.el.style.transform = `translate(${(w.x * 0.5 + 0.5) * VW}px, ${(-w.y * 0.5 + 0.5) * GLH}px) translate(${right ? '-12%' : '-50%'}, -50%)`; };
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
    if (vis) t.el.style.transform = `translate(${(w.x * 0.5 + 0.5) * VW}px, ${(-w.y * 0.5 + 0.5) * GLH}px) translate(-50%, -50%)`;
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
  const vh = VH, a = VW / GLH;
  const hh = 13 * Math.tan(THREE.MathUtils.degToRad(17.5)), hw = hh * a;
  const k = smooth(vh * 0.62, vh * 0.12, roofHead.getBoundingClientRect().top);
  const navW = (78 / GLH) * 2 * hh; // Leistenhöhe in Welt-Einheiten
  // groß: Haus mittig unter der Leiste, Breite ≈ 86 % des Bildes (Auftrag 1, 4.11.; vorher y 2.5, s 0.42 = oben)
  const bs = Math.min(0.52, (hw * 2 * 0.86) / 7.1);
  const big = { x: 0, y: 0.16 + 0.55 * bs + ((GLH - MINH) / 2) * (2 * hh / GLH), s: bs }, small = { x: hw - 0.48, y: hh - navW - 0.42, s: 0.085 };
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
  whenNear(manuSec, () => runSliced(initManuGen($('#glManu'), manuUi)).then((m) => { manu = m; if (!m) document.documentElement.classList.add('no-gl-manu'); glReady($('#glManu')); }));
}
// ---------- Leistungen: Partikel-Bühne mit Motiv je Leistung (Haus tritt hier zurück) ----------
const servList = $('.roof-list'), servName = $('#servName');
// Aufbau erst, wenn „Alle Leistungen“ in Reichweite kommt (A1)
let serv = null;
glWait($('#glServ'));
whenNear(roofHead, () => runSliced(initServicesGen($('#glServ'), { isPaused: () => paused, onShow: (i, name) => { if (servName) servName.textContent = name; } })).then((m) => { serv = m; if (!m) document.documentElement.classList.add('no-gl-serv'); glReady($('#glServ')); }));
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
  if (sheetOpen && !isDesktop()) return; // Handy: Termin-Blatt deckt die Szene ab → nicht rendern (Akku)
  if (egoOpen) return; // Rundgang aus Augenhöhe offen: eigene Bühne zeichnet, die Seite ruht (Akku)
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
  dim = Math.max(dim, tourHide, xray * (0.4 + (1 - xrayCalm) * 0.75)); // im Rundgang/Röntgenblick tritt das äußere Partikel-Haus zurück (Handy vor dem Betreten stärker)
  dim = Math.max(dim, manuK, listK); // Manuthera-Bühne und Leistungen: Partikel-Hintergrund blendet ganz aus
  if (licht && lichtK > 0) dim = Math.max(dim, lichtK); // K1: Partikel weichen dem Sonnenstaub
  uniforms.uAlpha.value += ((1 - dim * dimMax) - uniforms.uAlpha.value) * 0.1;
  if (!isDesktop()) {
    // Handy: Partikel-Haus ohne Verzögerung ausblenden, sobald der Rundgang vorbei ist bzw. die Manuthera-Bühne kommt –
    // sonst laufen beim schnellen Wischen Haus und Liege ineinander
    const out = Math.max(manuK, houseGone());
    if (uniforms.uAlpha.value > 1 - out) uniforms.uAlpha.value = 1 - out;
  }
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
  const rp = clamp((VH - rr.top) / (rr.height + VH)); // Durchlauf durchs Bild (Abschnitt seit 7.11. nur 1 Bildschirm hoch)
  if (licht) { const k = smooth(0.4, 1, rp); setLicht(k); if (dust) dust.visible = k > 0.01; }
  { // Handy + PC (7.11.): automatisch
    const now = performance.now(), step = Math.min(250, now - (LAW.last || now)), vis = rr.top < VH * 0.55 && rr.bottom > VH * 0.45;
    LAW.last = now;
    if (vis && !LAW.vis) { setLaw(0); LAW.t = 0; } // neu hereingescrollt → bei §1 beginnen
    LAW.vis = vis;
    if (vis) {
      if (!paused) { LAW.t += step; if (LAW.t > lawDur[lawOn]) { LAW.t = 0; setLaw((lawOn + 1) % laws.length); } }
      lawBtns.forEach((b, i) => b.style.setProperty('--p', i < lawOn ? 1 : i > lawOn ? 0 : Math.min(1, LAW.t / lawDur[lawOn]).toFixed(3)));
    }
  }

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
  { // Handy: Ende des Rundgangs – die Szene scrollt mit Text und Knöpfen nach oben weg (Bildausschnitt verschieben)
    const tb = isDesktop() ? -1 : tourEl.getBoundingClientRect().bottom;
    const lift = tb > 0 && houseGone() < 0.999 ? Math.max(0, VH - tb) : 0;
    if (lift !== viewLift || (camera.view && camera.view.enabled && camera.view.fullHeight !== GLH)) { viewLift = lift; if (lift > 0) camera.setViewOffset(VW, GLH, 0, lift, VW, GLH); else camera.clearViewOffset(); }
  }
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
  const MOUSE = '<svg viewBox="0 0 24 32" aria-hidden="true"><rect x="2" y="2" width="20" height="28" rx="10"/><path d="M12 2v10M2 12h20"/><rect class="th-wheel" x="10.5" y="5" width="3" height="5" rx="1.5"/></svg>';
  h.innerHTML = `<span class="th-track"><i class="th-dot${finePointer ? ' th-mouse' : ''}">${finePointer ? MOUSE : ''}</i></span><span>${txt}</span>`; // PC (6A, 7.11.): Maus statt Finger
  (parent || document.body).appendChild(h); return h;
};
// Wischhilfe (Kai 6.11.): ein Baustein überall – Finger mit Spur zeigt die echte Richtung an der echten Stelle,
// bis zur ersten richtigen Benutzung; auf Touch-Geräten als dunkle Pille (lesbar über den Partikeln).
// Senkrecht wischen scrollt überall (auch über der Figur); bedient wird seitlich, durch Antippen oder am Ziehstreifen (Kap. 03).
const hintBody = mkHint(finePointer ? 'Maus über den Körper' : 'Seitlich streichen');
const hintHouse = mkHint(isDesktop() ? 'Ziehen zum Drehen' : 'Wischen oder Raum antippen');
const hintManu = manuSec ? mkHint(finePointer ? 'Ziehen zum Drehen' : 'Seitlich wischen', $('.manu-stage')) : null;
[hintBody, hintHouse, hintManu].forEach((h) => h && h.classList.add('th-pill')); // 6A (7.11.): auch am PC dunkle Pille (vorher nur Touch)
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
  if (showBody) hintBody.style.transform = desk ? `translate(${VW * 0.6}px, ${VH * 0.6}px) translate(-50%,-50%)` : `translate(${VW - 12}px, ${heroFit ? heroFit.top + (heroFit.bot - heroFit.top) * 0.3 - scrollY : VH * 0.24}px) translate(-100%,-50%)`; // rechts neben der Figur (Pille bleibt im Bild)
  // Haus: PC im Röntgenblick (ziehen), Handy vor dem Betreten (wischen/antippen)
  if (dragRot !== rotSeen || tourIdx >= 0) houseUsed = true;
  // Handy: sobald die Praxis-Ansicht steht (nicht erst, wenn der Rundgang halb im Bild ist), nach ~1 s
  const houseReady = xray > 0.6 && tourIdx < 0 && (desk || (morphNow > 2.7 && morphNow < 3.3));
  xrayT = houseReady ? xrayT + dt : 0;
  const showHouse = !houseUsed && xrayT > (desk ? 3 : 1);
  hintHouse.classList.toggle('on', showHouse);
  if (showHouse) hintHouse.style.transform = desk ? `translate(${VW * 0.72}px, ${VH * 0.84}px) translate(-50%,-50%)` : `translate(${VW * 0.5}px, ${(roofMid && tourStickyEl ? tourStickyEl.getBoundingClientRect().top + roofMid : VH * 0.36).toFixed(1)}px) translate(-50%,-50%)`; // Handy 7.11.: mitten auf dem Haus, wandert mit der Bühne
  // Manuthera-Liege
  if (hintManu) { manuT = manuK > 0.8 ? manuT + dt : 0; hintManu.classList.toggle('on', !manuUsed && manuT > 1.5); }
}

// Intro
// (im ersten Frame, vor dem ersten Bild: gsap liest berechnete Stile – so nur eine Stil-Berechnung, A1)
if (paused) uniforms.uIntro.value = 1; // angehalten: kein Einflug (Durchsicht 7.11.)
if (!reduced) requestAnimationFrame(() => {
  if (!paused) gsap.to(uniforms.uIntro, { value: 1, duration: 3.2, ease: 'expo.out', delay: 0.1 });
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
  const openEls = ['openNow', 'tsOpen'].map((id) => document.getElementById(id)).filter(Boolean); // Kapitel 05 + Termin-Blatt
  const openEl = openEls.length ? { set hidden(v) { openEls.forEach((e) => (e.hidden = v)); }, set textContent(t) { openEls.forEach((e) => (e.textContent = t)); } } : null;
  if (openEl) {
    // Feiertage Baden-Württemberg, je Jahr berechnet (Ostern nach Gauß/„anonymer gregorianischer Algorithmus“) – Prüfung 7.11. K2
    const HOLY = {};
    const holidays = (y) => {
      if (HOLY[y]) return HOLY[y];
      const a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3);
      const h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451);
      const month = Math.floor((h + l - 7 * m + 114) / 31), day = ((h + l - 7 * m + 114) % 31) + 1;
      const easter = Date.UTC(y, month - 1, day), key = (t) => new Date(t).toISOString().slice(0, 10), fix = (mo, da) => key(Date.UTC(y, mo - 1, da));
      return (HOLY[y] = new Set([fix(1, 1), fix(1, 6), key(easter - 2 * 864e5), key(easter + 864e5), fix(5, 1), key(easter + 39 * 864e5), key(easter + 50 * 864e5), key(easter + 60 * 864e5), fix(10, 3), fix(11, 1), fix(12, 25), fix(12, 26)]));
    };
    const HOL = { has: (k) => holidays(+k.slice(0, 4)).has(k) };
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

// Termin-Blatt (Option C, Go Kai 7.11.2026): „Termin“-Knöpfe öffnen ein Blatt (PC rechts, Handy von unten).
// Der Optica-Kalender (iframe) lädt erst nach „Kalender laden“ – vorher keine Verbindung zu Optica/Google (Datenschutz § 4).
// Ohne JS bzw. ohne <dialog>: Leiste/Startbereich springen zu Kapitel 05, der Knopf dort öffnet Optica in neuem Fenster.
{
  const dlg = document.getElementById('terminSheet');
  if (dlg && typeof dlg.showModal === 'function') {
    const pre = document.getElementById('tsPre'), box = document.getElementById('tsFrame'), load = document.getElementById('tsLoad'), xBtn = document.getElementById('tsClose');
    let opener = null, frame = null;
    const open = (e) => {
      e.preventDefault();
      if (dlg.open) return;
      opener = e.currentTarget;
      document.documentElement.classList.add('sheet-open');
      lenis?.stop();
      sheetOpen = true;
      dlg.showModal();
      (frame ? xBtn : load).focus();
    };
    const close = () => { if (dlg.open) dlg.close(); };
    dlg.addEventListener('close', () => {
      document.documentElement.classList.remove('sheet-open');
      lenis?.start();
      sheetOpen = false;
      opener?.focus({ preventScroll: true });
    });
    dlg.addEventListener('click', (e) => { if (e.target === dlg) close(); }); // Klick auf den abgedunkelten Rand
    xBtn.addEventListener('click', close);
    load.addEventListener('click', () => {
      frame = document.createElement('iframe');
      frame.title = 'Online-Terminkalender HOP (Optica Viva)';
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
