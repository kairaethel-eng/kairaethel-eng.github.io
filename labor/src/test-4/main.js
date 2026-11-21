// Testseite 4 · „Puls · Scan“ – wie „Puls + Achse“, die Wirbelsäule bleibt aber im Partikel-Stil:
// eine Abtastlinie verdichtet die groben Partikel zu einer beleuchteten Punktwolke, dann Kamerafahrt.
// 0 Körper → 1 Bewegung → 2 Wirbelsäule (Scan) → 3 Dachlinie (fließt ins Linienhaus, seit 14.11.2026) → 4 HOP-Kreise
// Kapitel 01 seit 16.11.2026 (Auftrag K, Go Kai): „Von Kopf bis Fuß“ als eigene Bühne (Baustein ../kopf-fuss/kapitel.js); Form 0 erscheint
// erst am Ende des Kapitels deckungsgleich mit dessen Figur (Übergabe, kf.fitE/handK) und löst sich in die Bewegungslinien auf.
import * as THREE from 'three';
import Lenis from 'lenis';
import { spinePointsGen, spineStippleGen, ZONES, CURVE_W, BODY_W, BODY_H, BODY_SCALE, HOTSPOTS } from './shapes.js';
import { figureForm, roofForm, logoForm } from './ordnung.js';
import { pointer, PTR_GLSL } from '../shared/zeiger.js';
import { initAGen as initManuGen, MODES as MANU_MODES } from '../manu/ideaA.js';
import { initServicesGen } from './services.js';
import { decode as decodeAnat } from '../wirbel-echt/anatomie.js';
import { runSliced } from '../shared/slice.js';
import { initHouse } from '../haus-licht/house.js';
import { ECHT } from '../wirbel-echt/echt.js';
import { initStosswelle } from '../stosswelle/welle.js';
import { initVorfall, SEG as VF_SEG } from '../vorfall/film.js';
import { initKopfFuss } from '../feinschliff/kapitel.js';
import { initDoorStage, DOOR_PLAN } from '../tuer/buehne.js';

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
// ---------- Auslöser statt Scrollweg (20.11.2026, Auftrag Kai: „nicht scroll abhängig machen sondern ruhig und schön beim runter
// scrollen wischen automatisch animieren“) ----------
// Die bisherigen Scrollwerte (0…1) bleiben als Messung, sind aber nur noch der Auslöser: über `an` startet der Ablauf, unter `aus`
// läuft er zurück. Der Ablauf selbst läuft über die Zeit – gleich ruhig, egal wie schnell gescrollt oder gewischt wird.
// Beim ersten Aufruf (Laden mitten in der Seite) steht der Wert sofort am Ziel; bei „Bewegung anhalten/reduzieren“ ohne Ablauf.
const FORM_SEK = 3.6;  // ein Formwechsel der Punktwolke (Figur → Bänder → Wirbelsäule → Dachlinie)
const LOGO_SEK = 3.2;  // HOP-Kreise entstehen / lösen sich
const SCAN_SEK = 2.9;  // Abtastlinie baut die Wirbelsäule auf
function riegel(sek, an = 0.3, aus = 0.12) {
  let want = -1, v = 0;
  const f = (scrub, dt) => {
    if (want < 0) { want = scrub > an ? 1 : 0; v = want; }
    else if (scrub > an) want = 1; else if (scrub < aus) want = 0;
    v = reduced || paused ? want : want > v ? Math.min(1, v + dt / sek) : Math.max(0, v - dt / sek);
    return v;
  };
  f.want = () => Math.max(0, want); f.set = (x) => { want = x; v = x; }; f.v = () => v;
  return f;
}
const weich = (t) => t * t * (3 - 2 * t);
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

// ---------- Takt und Übergänge (13.11., T3): eigener Bildtakt + Mini-Übergang statt gsap (gebraucht wurden nur der Takt und fünf Übergänge) ----------
const frameFns = []; // Reihenfolge wie bisher: zuerst tick (Seite), dann Lenis
const tweens = new Set();
const easeOut = (t) => 1 - (1 - t) * (1 - t), easeExpo = (t) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));
function tween(obj, key, to, sec, { ease = easeOut, delay = 0, onUpdate } = {}) {
  tweens.forEach((w) => { if (w.obj === obj && w.key === key) tweens.delete(w); }); // neuer Übergang löst den alten ab
  tweens.add({ obj, key, to, ease, onUpdate, from: null, dur: sec * 1000, t0: performance.now() + delay * 1000 });
}
function runFrame(now) {
  tweens.forEach((w) => {
    if (now < w.t0) return;
    if (w.from === null) w.from = w.obj[w.key];
    const k = Math.min(1, (now - w.t0) / w.dur);
    w.obj[w.key] = w.from + (w.to - w.from) * w.ease(k);
    if (w.onUpdate) w.onUpdate();
    if (k >= 1) tweens.delete(w);
  });
  for (let i = 0; i < frameFns.length; i++) frameFns[i](now);
}

// ---------- Scrollen ----------
let lenis = null;
let sheetOpen = false; // Termin-Blatt offen (Lenis steht, Handy rendert nicht)
const VF = { film: null, opener: null, open: null }; // Film „Bandscheibenvorfall“ (siehe unten)
// Fokus (Kai 14.11. nachts): der Film läuft auf der Hauptbühne. on = offen, k/e = Übergang 0…1, hand = Übergabe von der Wirbelsäule
// (auflösen + heranfahren + Scan-Linie), started = Film läuft, cover = Film deckt die Bühne, rest = Hauptbühne ruht (Akku)
const FX = { on: false, k: 0, e: 0, hand: false, tilt: 0, gap: 0, started: false, cover: false, coverN: 0, rest: false, y0: 0, t0: 0, acc: 0, v: null };
if (!reduced) {
  // ruhiges Scrollen: Mausrad langsamer, weiches Nachgleiten (Scrollbalken bleibt direkt).
  // Erst nach dem ersten Bild anlegen: Lenis misst die Seite, das erzwänge sonst ein zweites Layout im Start-Task (A1).
  requestAnimationFrame(() => setTimeout(() => {
    lenis = new Lenis({ lerp: 0.055, smoothWheel: true, wheelMultiplier: 0.6 });
    frameFns.push((t) => lenis.raf(t));
  }, 0));
}
const scrollToY = (y) => (lenis ? lenis.scrollTo(y, { duration: 1.8 }) : scrollTo({ top: y }));
$$('a[href^="#"]:not(.skip):not([data-termin]):not(.ego-contact)').forEach((a) => a.addEventListener('click', (e) => { // .skip: Browser-Sprung, damit der Fokus mitgeht (Durchsicht 7.11.)
  const id = a.getAttribute('href'), t = $(id); if (!t) return;
  e.preventDefault(); scrollToY((auftakt[t.id] || t).getBoundingClientRect().top + scrollY); // Kapitel-Link landet am Auftakt
  // 13.11. (T4): Fokus geht mit zum Ziel (Tastatur, Vorleseprogramme) und die Adresse merkt sich das Kapitel (Link teilen, neu laden)
  if (!t.hasAttribute('tabindex')) t.setAttribute('tabindex', '-1');
  t.focus({ preventScroll: true });
  try { history.replaceState(null, '', id === '#start' ? location.pathname + location.search : id); } catch (err) { /* z. B. file:// in manchen Browsern */ }
}));

// ---------- Renderer ----------
const canvas = $('#gl');
let renderer = null;
// 13.11. (T2): Software-Grafik (kein Grafikchip nutzbar: Remote-Desktop, gesperrte Treiber) gilt als „ohne WebGL“ → Standbilder
// statt weniger Bilder pro Sekunde. ?gl=1 = Prüfmodus der Werkzeuge im Container (dort gibt es nur Software-Grafik);
// ?gl=2 = Software-Grafik zulassen, Qualitätsstufen bleiben an (zum Testen der Stufen).
const glQ = new URLSearchParams(location.search).get('gl');
let glCtx = null;
try { glCtx = canvas.getContext('webgl2', { alpha: false, antialias: false, depth: true, stencil: false, premultipliedAlpha: true, preserveDrawingBuffer: false, powerPreference: 'high-performance', failIfMajorPerformanceCaveat: !glQ }); } catch (e) { /* ohne WebGL 2 */ }
// Chrome meldet Software-Grafik nicht in jedem Fall über die Abfrage oben → zusätzlich am Namen des Grafiktreibers erkennen
if (glCtx && !glQ) try {
  const e = glCtx.getExtension('WEBGL_debug_renderer_info');
  if (/swiftshader|llvmpipe|softpipe|software|basic render/i.test(String(glCtx.getParameter(e ? e.UNMASKED_RENDERER_WEBGL : glCtx.RENDERER)))) { glCtx.getExtension('WEBGL_lose_context')?.loseContext(); glCtx = null; }
} catch (e) { /* Name nicht lesbar: WebGL bleibt an */ }
let glDirty = true; // nach dem letzten sichtbaren Bild einmal leer zeichnen, danach ruht die Bühne (T1)
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
// Geordnete Formen (17.11.2026, Go Kai „Ideen auf die ganze Website“, Baustein ordnung.js): jede Form hat je Punkt eine
// Sichtbarkeit – sichtbar sind nur die Punkte des Rasters, die übrigen liegen verborgen auf der Form und verblassen beim Wechsel.
// Form 0 (Figur) wird erst nach dem Start von Kapitel 01 gefüllt: dieselben Punkte wie dort (kf.cloud(), siehe Dateiende).
// Form 3 = Bernstein-Dachlinie (Giebel x −1…1, First bei y = 1, Höhe per uRoofH passend zum SVG-Dach), Form 4 = HOP-Kreise.
const DESK0 = isDesktop();
const body = { pos: new Float32Array(N * 3), heat: new Float32Array(N), f0: new Float32Array(N * 3) }, house = roofForm(N, DESK0), logo = logoForm(N, DESK0);
const geo = new THREE.BufferGeometry();
geo.setAttribute('position', new THREE.BufferAttribute(body.pos, 3));
geo.setAttribute('aHeat', new THREE.BufferAttribute(body.heat, 1));
geo.setAttribute('aF0', new THREE.BufferAttribute(body.f0, 3));
{ const w = new Float32Array(N * 2), idx = new Float32Array(N); for (let i = 0; i < N; i++) { w[i * 2] = house.w[i]; w[i * 2 + 1] = logo.w[i]; idx[i] = i; }
  geo.setAttribute('aW', new THREE.BufferAttribute(w, 2)); geo.setAttribute('aIdx', new THREE.BufferAttribute(idx, 1)); }
// Startzeit (A1, Go 4.11.2026): der Hero braucht nur die Körper-Wolke. Das Morph-Ziel Wirbelsäule wird nach dem
// ersten Bild in Zeitscheiben gerechnet (bis dahin hält die Wolke die Körperform), die Detailbühnen je Kapitel.
geo.setAttribute('pos2', new THREE.BufferAttribute(body.pos.slice(), 3));
let morphSet = false;
ECHT.initMorph(N, (p) => { morphSet = true; geo.attributes.pos2.array.set(p); geo.attributes.pos2.needsUpdate = true; });
if (renderer) runSliced(spinePointsGen(N)).then((sp) => ECHT.morphReady('bisher', sp.pos));
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
rctx.fillStyle = '#fff'; rctx.fillRect(0, 0, RW, RH); // seit 16.11.: Form 0 zeigt nur noch den gelösten Körper (gelöst wird in Kapitel 01)
const relaxTex = new THREE.CanvasTexture(relaxCv);
relaxTex.minFilter = relaxTex.magFilter = THREE.LinearFilter;

const C = (h) => new THREE.Color(h);
const uniforms = {
  uTime: { value: 0 }, uMorph: { value: 0 }, uPix: { value: 1 }, uSize: { value: 1 }, uAlpha: { value: 1 },
  uRelax: { value: relaxTex }, uBodyWH: { value: new THREE.Vector2(BODY_W * BODY_SCALE, BODY_H * BODY_SCALE) },
  uXf: { value: [0, 1, 2, 3, 4].map(() => new THREE.Vector4(0, 0, 0, 1)) },
  uSpineRot: { value: -0.9 }, uCut: { value: 100 }, uRoofH: { value: 0.25 }, uRoofA: { value: 1 }, uLogo: { value: 0 },
  uBreath: { value: 0 }, uCalm: { value: 0 }, // Atem-Phase, „Entspannt“ (0..1)
  uBodyRot: { value: 0 }, // Wiegen der Form 0 (seit 16.11. vom Kapitel „Von Kopf bis Fuß“ übernommen, damit die Übergabe deckungsgleich ist)
  uWave: { value: 2 }, // Lichtwelle beim Entspannen (15.11., Go Kai 4A): Lage in Körperhöhe 1.2 (über dem Kopf) → -0.2 (unter den Füßen), 2 = aus
  uHouse: { value: 0 }, uIntro: { value: reduced ? 1 : 0 }, uSpread: { value: 1 }, uFadeMid: { value: 0.5 }, uVeil: { value: 0 }, uDust: { value: 0 }, uKeep: { value: 0 },
  cPetrol: { value: C('#4E7F93') }, cBone: { value: C('#D9DCD3') }, cAmber: { value: C('#E59A2F') },
  cBlue: { value: C('#5AA2D6') }, cGreen: { value: C('#8BC34A') }, cLogoP: { value: C('#2C6478') }, cGrey: { value: C('#8C979B') },
  // Feinschliff (17.11.): Farben der Figur wie in Kapitel 01, Zeilen leicht von oben (uTilt), Punktgröße aus Welt-Durchmessern
  // (uProj = Bildpunkte je Welt-Einheit × Abstand), Perlenbänder (uRib: Stränge je Bahn, Perlen je Strang), Zeiger (uPtr)
  cDeep: { value: C('#44788E') }, cCalm: { value: C('#86BEE6') }, cBone0: { value: C('#E4E3D8') },
  uTilt: { value: 0.16 }, uProj: { value: 1000 }, uPr: { value: 1 }, uRib: { value: new THREE.Vector2(DESK0 ? 9 : 6, DESK0 ? 300 : 257) },
  uDr4: { value: logo.dr }, uPtr: { value: new THREE.Vector4(0, 0, 0.1, 0) }, uAsp: { value: 1 },
  uRibA: { value: DESK0 ? 0.62 : 1.25 }, // PC seit 20.11. leiser (Kai: „am PC sehr unübersichtlich und die Punkte zu deutlich“) // Handy (18.11.): die Bänder laufen jetzt hinter dem Text von Kapitel 02 → gedämpft (vorher 1,75: nur im Vorübergehen zu sehen)
};

const vert = /* glsl */`
  attribute float aHeat; attribute vec3 pos2; attribute vec3 pos3; attribute float kind3; attribute vec3 pos4; attribute float kind4; attribute vec4 aRand;
  attribute vec3 aF0; attribute vec2 aW; attribute float aIdx;
  uniform float uSpread, uFadeMid, uVeil, uDust, uKeep;
  uniform float uBreath, uCalm, uWave, uBodyRot;
  uniform float uTime, uMorph, uPix, uSize, uHouse, uIntro, uSpineRot, uCut, uRoofH, uRoofA, uLogo;
  uniform float uTilt, uProj, uPr, uDr4, uAsp, uRibA; uniform vec2 uRib; uniform vec4 uPtr;
  uniform sampler2D uRelax; uniform vec2 uBodyWH; uniform vec4 uXf[5];
  uniform vec3 cPetrol, cBone, cAmber, cBlue, cGreen, cLogoP, cGrey, cDeep, cCalm, cBone0;
  varying vec3 vCol; varying float vA; varying float vSize;
  vec3 rotY(vec3 p, float a){ float c=cos(a), s=sin(a); return vec3(c*p.x+s*p.z, p.y, -s*p.x+c*p.z); }
  float hash1(float n){ return fract(sin(n*12.9898)*43758.5453); }
` + PTR_GLSL + /* glsl */`
  // jede Form liefert Position (xyz), Farbe, Sichtbarkeit (al) und den Durchmesser des Punkts in Welt-Einheiten (dw)
  void shape(int i, out vec3 p, out vec3 col, out float dw, out float al){
    dw = .024; al = 1.;
    if(i==0){
      // Figur: dieselben Punkte wie Kapitel 01 (grobes Raster, Kontur, Körperlinien), Kantenlicht aus aF0.y, gelöst = ruhiges Blau
      float breath = sin(uBreath) * (1. + uCalm*1.3); // entspannt: ruhiger, tiefer Atem
      p = position * vec3(1. + breath*.007, 1. + breath*.004, 1.);
      p.y -= p.z * uTilt;
      p = rotY(p, uBodyRot);
      col = mix(cDeep, cBone0, .2 + .8*aF0.y);
      col = mix(col, cCalm, aHeat * .8);
      al = mix(aF0.x, max(aF0.x, .62 * step(.01, aF0.x)), aHeat);
      dw = aF0.z * uBodyWH.x / 200. * uXf[0].w;
      // Ausatmen: eine helle Welle läuft einmal vom Kopf bis zu den Füßen (uv.y 1 = Kopf)
      float wv = exp(-pow((position.y / uBodyWH.y + .5 - uWave)*6.5, 2.));
      col = mix(col, cBone0*1.15, wv*.8); dw *= 1. + wv*.5;
    } else if(i==1){
      // Bewegung: elf Bänder aus Perlensträngen. Jeder Strang hat Perlen in gleichem Abstand, alle fließen gleich schnell;
      // die Stränge eines Bands liegen in der Tiefe nebeneinander und schwingen leicht versetzt → das Band dreht sich wie ein Tuch
      float lane = mod(aIdx, 11.), rest = floor(aIdx / 11.);
      float strand = mod(rest, uRib.x), bead = floor(rest / uRib.x);
      float sj = strand / max(1., uRib.x - 1.) - .5;
      float x = mod((bead + .5*mod(strand, 2.)) / uRib.y * 18. + uTime*(.3 + hash1(lane)*.22), 18.) - 9.;
      float y = (lane-5.)*.55 + sin(x*.5 + lane*1.7 + uTime*.6 + sj*1.25)*.45 + sj*.17;
      float z = sj*1.7 + cos(x*.4 + lane)*.5;
      p = vec3(x, y, z);
      float m = mod(lane, 4.);
      col = m<1. ? cBlue : m<2. ? cPetrol*1.4 : m<3. ? cBone : cAmber;
      col = mix(col, cBone, .2 + .5*abs(sj)*2.*abs(sj)*2.); // Rand des Bands heller
      al = step(bead, uRib.y - .5) * (.15 + .42*abs(sj)*2.) * uRibA;
      dw = .022 * uXf[1].w;
    } else if(i==2){
      p = rotY(pos2, uSpineRot);
      float band = exp(-pow((pos2.y - (3.6 - mod(uTime*1.6, 9.)))*2.2, 2.));
      col = mix(cBone, cBlue, band*.8);
      al = step(aRand.x, .55); dw = .021 * uXf[2].w / .84;
    } else if(i==3){
      // Dachlinie: liegt genau auf dem SVG-Dach (uXf[3] aus roofPlace), vergeht, während das Dach gezeichnet wird (uRoofA)
      p = vec3(pos3.x, pos3.y * uRoofH, pos3.z);
      col = mix(cAmber, cBone, kind3 * .45);
      dw = kind3 > .5 ? .019 : .03; al = uRoofA * aW.x;
    } else {
      // HOP-Kreise: Ringe aus Perlen, leicht gewölbt, atmen und wiegen ruhig
      float br = 1. + sin(uTime*1.2 + pos4.x*.8)*.03;
      p = pos4 * vec3(br, br, 1.);
      p = rotY(p, sin(uTime*.3)*.25);
      // 20.11. nachts (Kai: „Besser an das Original anpassen“): Farbverläufe wie im Original-Logo – H von dunklem Grün über Hellgrün
      // nach hell (quer), O von hell über Petrol nach dunkel (von oben), P von hell über Cyan nach Dunkelblau (quer)
      float lx = clamp((pos4.x - (kind4 < .5 ? -2.75 : kind4 < 1.5 ? 0. : 2.75)) / 1.18 * .5 + .5, 0., 1.), ly = clamp(.5 - (pos4.y - .2) / 1.18 * .5, 0., 1.);
      vec3 gH = lx < .45 ? mix(vec3(.004, .14, .095), vec3(.2, .53, .055), lx / .45) : mix(vec3(.2, .53, .055), vec3(.62, .8, .46), (lx - .45) / .55);
      vec3 gO = ly < .35 ? mix(vec3(.6, .72, .78), vec3(.2, .36, .44), ly / .35) : mix(vec3(.2, .36, .44), vec3(.035, .13, .17), (ly - .35) / .65);
      vec3 gP = lx < .4 ? mix(vec3(.6, .82, .9), vec3(0., .45, .72), lx / .4) : mix(vec3(0., .45, .72), vec3(.012, .1, .2), (lx - .4) / .6);
      col = kind4 < .5 ? gH * 1.25 : kind4 < 1.5 ? gO * 1.35 : kind4 < 2.5 ? gP * 1.3 : kind4 < 3.5 ? cBone*.62 : kind4 < 4.5 ? cBone0*1.3 : cLogoP*1.9; // 3 = grauer Bogen · 4 = Buchstaben H · O · P · 5 = Sichel
      al = aW.y; dw = uDr4 * (kind4 > 4.5 ? .46 : kind4 > 3.5 ? .64 : kind4 > 2.5 ? .42 : .58) * uXf[4].w;
    }
    p = p * uXf[i].w + uXf[i].xyz;
    if(i==2){
      // Abtastlinie: oberhalb ist die Wirbelsäule schon „fest“, darunter noch Partikel
      float g = exp(-pow((p.y - uCut)*7., 2.));
      al *= smoothstep(uCut + .1, uCut - .1, p.y);
      // 21.11. (Abläufe laufen langsamer → die grobe Wolke unter der Abtastlinie steht länger neben der Überschrift): als feiner Staub –
      // kleiner und höchstens halb deckend; nur die Bernstein-Linie selbst bleibt kräftig
      al *= .5; dw *= .6;
      col = mix(col, cAmber, g); dw *= 1. + g*2.2; al = max(al, g);
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
    // Zerstäuben zwischen zwei Formen
    vec3 n = normalize(vec3(aRand.x-.5, aRand.y-.5, aRand.z-.5)+1e-4);
    // Streuung im Verhältnis zur Formgröße (auf dem Handy kleiner, damit Text frei bleibt)
    float ws = mix(uXf[i0].w, uXf[i1].w, t);
    // als feiner Staub (uDust, 18.11.) streuen die Punkte nur halb so weit
    p += n * sin(t*3.14159) * (1.2 + aRand.w*1.6) * ws * uSpread * (1. - .5 * uVeil * step(.01, uDust));
    // Intro: aus der Tiefe einfliegen
    p += n * (1.-uIntro) * (6. + aRand.x*8.) * ws * uSpread;
    float dw = mix(sA, sB, t);
    vec3 col = mix(cA, cB, t);
    // unterwegs sind alle Punkte zu sehen (auch die im Ziel verborgenen): sie sammeln sich und verblassen beim Ankommen
    float a = .85 * (1. - uFadeMid*sin(t*3.14159)) * mix(aA, aB, t);
    // Handy, Wirbelsäule <-> Dach (Go Kai 18.11. „1a“): die Punkte wandern unsichtbar und erscheinen erst an der Dachlinie
    a *= mix(1., smoothstep(.86, 1., t), uVeil);
    // Staub (Go Kai 18.11. „2a“, nach der Studie fest): statt unsichtbar zu wandern, löst sich knapp die Hälfte der Punkte als feiner
    // Staub und sammelt sich zur nächsten Form – klein (feste Größe, unabhängig von der Nahansicht), höchstens 60 % deckend
    float dustK = uVeil * step(.01, uDust); // uDust = Anteil der Punkte, die als Staub sichtbar werden (Handy 1 → 45 %, PC weniger: dort gibt es mehr Punkte)
    a = max(a, dustK * step(aRand.z, .45 * uDust) * .6 * smoothstep(0., .22, t) * (1. - smoothstep(.8, 1., t)));
    dw = mix(dw, .03, dustK);
    col = mix(col, mix(cPetrol * 1.5, cBone, aRand.x), dustK * (1. - smoothstep(.7, 1., t)));
    // 20.11. (Auftrag Kai: „die Zerstreuung der Pixel-Übergänge auf der ganzen Seite“): bei JEDEM Formwechsel sind die Punkte unterwegs
    // feiner Staub – kleine feste Größe, höchstens 60 % deckend – und werden erst beim Ankommen wieder zur Form
    float fine = sin(t * 3.14159) * (1. - dustK);
    fine = smoothstep(0., .55, fine);
    dw = mix(dw, .034, fine);
    a = mix(a, min(a, .6), fine);
    // Hausordnung (seit 14.11.2026 nachts direkt nach Kapitel 02): die HOP-Kreise (Form 4) legen sich über die laufende Form
    // und lösen sich danach in die Wirbelsäule auf – uLogo 0..1, unabhängig von der Kapitelfolge in uMorph
    if(uLogo > .001){
      vec3 pL, cL; float sL, aL;
      shape(4, pL, cL, sL, aL);
      float tl0 = smoothstep(st, st+.6, uLogo);
      // Handy/Tablet (uKeep, 18.11., Go Kai „3a“): Punkte, die nicht zu den Kreisen gehören, bleiben als Streifen im Hintergrund
      // (etwas blasser) – am hohen Tablet stehen Kapitel 02 und die Hausordnung zugleich im Bild, die Streifen hätten sonst keine Zeit
      float stay = uKeep * (1. - step(.01, aL));
      float tl = tl0 * (1. - stay);
      p = mix(p, pL, tl) + n * sin(tl*3.14159) * (1.2 + aRand.w*1.6) * mix(ws, uXf[4].w, tl) * uSpread;
      dw = mix(dw, sL, tl); col = mix(col, cL, tl);
      a = mix(a, .85 * aL, tl) * (1. - uFadeMid*sin(tl*3.14159)) * (1. - .4 * stay * tl0);
    }
    vec4 mv = modelViewMatrix * vec4(p, 1.);
    gl_Position = projectionMatrix * mv;
    // Zeiger: Punkte unter Maus/Finger etwas größer und warmweiß (verborgene bleiben verborgen)
    float pk = ptrK() * smoothstep(0., .12, a);
    col = mix(col, vec3(1., .95, .86), pk * .82);
    a += (1. - a) * pk * .72;
    // Größe aus dem Welt-Durchmesser; unter der Mindestgröße bleibt der Punkt 1,6 px groß und wird dafür blasser
    float want = dw * uProj / -mv.z * (1. + pk * .55), size = max(1.6 * uPr, want), thin = want / size;
    gl_PointSize = size; vSize = size;
    vCol = col;
    vA = a * thin * thin * uIntro;
    if (vA < .004) gl_Position = vec4(2., 2., 2., 1.); // verborgen: gar nicht erst zeichnen
  }`;
const frag = /* glsl */`
  uniform float uAlpha;
  varying vec3 vCol; varying float vA; varying float vSize;
  void main(){
    // gestochen: Scheibe mit einem Bildpunkt weichem Rand
    float d = length(gl_PointCoord - .5), aa = min(.25, 1.3 / vSize);
    float a = 1. - smoothstep(.5 - aa, .5, d);
    gl_FragColor = vec4(vCol, a * vA * uAlpha);
    #include <colorspace_fragment>
  }`;
const mat = new THREE.ShaderMaterial({ vertexShader: vert, fragmentShader: frag, uniforms, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
const points = new THREE.Points(geo, mat);
points.frustumCulled = false;
scene.add(points);

// ---------- Layout je Form (Position/Skalierung) ----------
function layout() {
  const d = isDesktop(), a = VW / GLH;
  const hw = 13 * Math.tan(THREE.MathUtils.degToRad(17.5)) * a; // halbe sichtbare Breite bei z=0
  const X = uniforms.uXf.value;
  if (d) {
    X[0].set(hw * 0.56, -0.29, 0, 0.94); // Platzhalter, bodyFit() legt die Figur auf das Schlussbild von Kapitel 01
    X[1].set(0, -0.2, 0, Math.max(1, a * 0.75));
    X[2].set(hw * 0.47, -0.3, 0, 0.84);
    X[3].set(hw * 0.5, 0.1, 0, 0.74);
    X[4].set(hw * 0.46, 0, 0, 0.72);
  } else {
    X[0].set(0, 2.35, 0, 0.40);        // Platzhalter, bodyFit() legt die Figur auf das Schlussbild von Kapitel 01
    X[1].set(0, 0, 0, 1.25);           // 1A: Bewegungslinien über den ganzen Bildschirm
    X[2].set(0, 1.65, 0, 0.28);        // 4A: Wirbelsäule in der oberen Bildhälfte
    X[3].set(0, 2.5, 0, 0.42);         // Dachlinie: Platzhalter, roofPlace legt sie aufs SVG-Dach
    X[4].set(0, 2.15, 0, 0.32);        // 3: tiefer und kleiner, frei von der Leiste
  }
  uniforms.uPix.value = renderer ? renderer.getPixelRatio() * (GLH / 900) * (d ? 1 : 1.25) : 1;
  // Bildpunkte (Gerät) je Welt-Einheit, mal Abstand: Punktgröße = Durchmesser · uProj / Abstand
  { const pr = renderer ? renderer.getPixelRatio() : 1; uniforms.uPr.value = pr; uniforms.uAsp.value = a; uniforms.uProj.value = GLH * pr / (2 * Math.tan(THREE.MathUtils.degToRad(17.5))); }
  bodyFit();
}
// Form 0 deckungsgleich mit der Figur im Schlussbild von Kapitel 01 (kf.fitE: Bild = Anker + (Punkt − Blickpunkt)·Maßstab in px;
// hier Kamera z = 13, 35°: Welt-Einheiten je px in der Ebene z = 0 = 2·13·tan(17,5°) / GLH)
let kf = null;
function bodyFit() {
  const E = kf && kf.fitE(); if (!E) return;
  const ppw = GLH / (2 * 13 * Math.tan(THREE.MathUtils.degToRad(17.5)));
  uniforms.uXf.value[0].set((E.ax - E.fx * E.s - VW / 2) / ppw, (GLH / 2 - E.ay - E.fy * E.s) / ppw, 0, E.s / (ppw * BODY_SCALE));
}
function resize() {
  if (isDesktop()) [...$$('.seg-card'), ...$$('#achse .note')].forEach((c) => { c.style.opacity = ''; c.style.transform = ''; });
  MINH = VW !== GLW || isDesktop() ? VH : Math.min(MINH, VH);
  segRows();
  if (isDesktop() || VW !== GLW || VH > GLH || VH < GLH * 0.7) GLH = VH;
  GLW = VW;
  camera.aspect = VW / GLH; camera.updateProjectionMatrix();
  glDirty = true;
  if (renderer) {
    const cv = renderer.domElement, pr = renderer.getPixelRatio();
    // nur bei echter Änderung neu anlegen (gleiche Größe setzen leert sonst die Zeichenfläche → Flackern)
    if (cv.width !== Math.floor(VW * pr) || cv.height !== Math.floor(GLH * pr)) renderer.setSize(VW, GLH, false);
    cv.style.height = isDesktop() ? '' : GLH + 'px';
  }
  layout();
}
addEventListener('resize', resize); resize();

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
// Bandscheiben-Farbe (Kai 7.11. spät): Standard = blau, im aktiven Abschnitt rot-orange; Vergleich ?disc=alle (alle rot-orange), ?disc=blau (bisher)
const discQ = new URLSearchParams(location.search).get('disc'), DISC_MODE = discQ === 'alle' ? 1 : discQ === 'blau' ? 2 : 0;
const N_GRAIN = isDesktop() ? 165000 : 46000, N_SLICE = isDesktop() ? 330000 : 85000;
const sU = {
  uTime: uniforms.uTime, uRot: uniforms.uSpineRot, uCut: uniforms.uCut, uXf: { value: uniforms.uXf.value[2] },
  uZone: { value: -10 }, uZoneAmt: { value: 0 }, uOn: { value: 0 }, uStip: { value: 1 }, uPix: uniforms.uPix,
  uFade: { value: 1 }, uClip: { value: -2 }, // Handy (18.11.): Ausblenden als Ganzes + weiche Unterkante am Kapitelende
  uPeri: { value: 0 }, uPeriStart: { value: 0 }, uScan: { value: 100 }, uScanAmt: { value: 0 }, // Scanner (Handy, 6.11.)
  uDiff: { value: 0 }, uFine: { value: 0 }, uSharp: { value: isDesktop() ? 0 : 1 }, uEcht: { value: 0 }, // Wirbelsäule echt (A): Handy schärfer; uEcht: Schattierung der echten Säule (Punkt 4) // Handy 7.11.: Wirbelsäule differenziert, Nerv fein (PC vorgemerkt)
  uFocT: { value: new THREE.Vector4(0, 0, 0, 0) }, uFocS: { value: new THREE.Vector4(0, 1, 0, 0) }, uFocD: { value: 0.08 }, // Fokus: Segment wie im Film ausrichten (Mitte + Kippwinkel, Achse + halber Zusatzabstand, halbe Bandscheibe)
  uPtr: uniforms.uPtr, uAsp: uniforms.uAsp, // Zeiger (17.11.): Punkte unter Maus/Finger etwas größer und warmweiß
  uFoc: { value: 0 }, uFocZone: { value: -10 }, uFocY: { value: new THREE.Vector3(-100, 100, 0) }, // Fokus: Auflösen außerhalb L4–L5 (Höhenband unten/oben, Mitte L4)
  uDiscMode: { value: DISC_MODE }, cDiscA: { value: C('#E0583C') }, // Bandscheiben (7.11. spät): 0 aktiv rot-orange · 1 alle · 2 alt blau
  cBone: { value: C('#F3EADA') }, cDisc: { value: C('#86AFC9') }, cDiscD: { value: C('#4FA8D6') }, cAmber: uniforms.cAmber, cBlue: uniforms.cBlue,
  cSignal: { value: C('#DDF1FF') }, cCore: { value: C('#0E1C22') },
};
const GLSL_COMMON = /* glsl */`
  uniform float uTime, uRot, uCut, uZone, uZoneAmt, uOn, uStip, uPix, uPeri, uPeriStart, uScan, uScanAmt, uDiff, uFine, uDiscMode, uSharp, uEcht, uFade, uClip; uniform vec4 uXf;
  uniform vec3 cBone, cDisc, cDiscD, cDiscA, cAmber, cBlue, cSignal, cCore;
  vec3 rotY(vec3 p, float a){ float c=cos(a), s=sin(a); return vec3(c*p.x+s*p.z, p.y, -s*p.x+c*p.z); }
  const vec3 LDIR = vec3(.48, .72, .5);
  // Fokus (Film „Bandscheibenvorfall“): alles außerhalb des Segments L4–L5 löst sich auf. focOut = 1 außerhalb des Höhenbands,
  // focFar = Abstand vom Segment (0 nah … 1 fern): die Enden der Wirbelsäule gehen zuerst, die Welle läuft auf das Segment zu
  uniform float uFoc, uFocZone, uFocD; uniform vec3 uFocY; uniform vec4 uFocT, uFocS;
  // Segment L4–L5 in die Lage des Films bringen: der Abstand, den Puls zwischen die Wirbel legt, schließt sich (uFocS), die
  // Bandscheibe stellt sich waagrecht (uFocT, Drehung um die Querachse durch die Mitte des Segments) – die ganze Säule geht mit
  vec3 focFit(vec3 p){
    if (uFocT.w == 0. && uFocS.w == 0.) return p;
    vec3 q = p - uFocT.xyz;
    float d = dot(q, uFocS.xyz);
    q -= uFocS.xyz * sign(d) * uFocS.w * smoothstep(uFocD, uFocD + uFocS.w + .0001, abs(d));
    float c = cos(uFocT.w), s = sin(uFocT.w);
    q.yz = vec2(c * q.y - s * q.z, s * q.y + c * q.z);
    return q + uFocT.xyz;
  }
  float focOut(float y){ return smoothstep(0., .08, max(uFocY.x - y, y - uFocY.y)); }
  float focFar(float y){ return clamp(max(uFocY.x - y, y - uFocY.y) / 3.2, 0., 1.); }
  float focK(float y, float h){ return smoothstep(0., 1., uFoc * 1.75 - (1. - focFar(y)) * .35 - h * .4); }`;

// 1) Kern: dunkle Füllung, verdeckt die Rückseite der Punkte
const coreMat = new THREE.ShaderMaterial({
  uniforms: sU,
  vertexShader: GLSL_COMMON + /* glsl */`
    varying float vY; varying float vL; varying float vLY; varying float vK;
    void main(){
      vec3 p = rotY(focFit(position) - normal * .012, uRot) * uXf.w + uXf.xyz;
      vY = p.y; vLY = position.y; vL = max(dot(normalize(rotY(normal, uRot)), normalize(LDIR)), 0.);
      gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.);
      vK = smoothstep(uClip, uClip + .16, gl_Position.y / gl_Position.w) * uFade; // Handy: Kern blendet mit der Wirbelsäule aus („1a“)
    }`,
  fragmentShader: GLSL_COMMON + /* glsl */`
    varying float vY; varying float vL; varying float vLY; varying float vK;
    void main(){
      if (vY < uCut || vK < .03) discard;
      if (uFoc > 0. && fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453) < focOut(vLY) * focK(vLY, .5) * 1.02) discard; // Fokus: Kern löst sich gerastert mit auf
      gl_FragColor = vec4(mix(vec3(.003, .008, .011), cCore + cBone * vL * .05, vK), 1.);
      #include <colorspace_fragment>
    }`,
});

// 2) Knochen in zwei Darstellungen: „Schichten“ (CT-Schnittlinien) oder „Körnung“ (gestochene Punkte)
const boneMat = new THREE.ShaderMaterial({
  uniforms: sU,
  vertexShader: GLSL_COMMON + /* glsl */`
    attribute float aZone, aKind, aEdge; uniform float uMaxSize; uniform vec4 uPtr; uniform float uAsp;
    varying vec3 vCol; varying float vVis;
    ` + PTR_GLSL + /* glsl */`
    void main(){
      vec3 lp = focFit(position); float fo = 0.;
      if (uFoc > 0.) {
        // Fokus: Wirbel anderer Abschnitte und die Bandscheibe über L4 lösen sich auf – Punkte treiben entlang der Säule davon, werden kleiner und glimmen
        float w = max(step(.5, abs(aZone - uFocZone)), aKind > .5 ? step(uFocY.z, position.y) : 0.);
        float h = fract(sin(dot(position, vec3(127.1, 311.7, 74.7))) * 43758.5453);
        fo = w * focK(position.y, h);
        float up = position.y > (uFocY.x + uFocY.y) * .5 ? 1. : -1.;
        lp += (vec3(normal.x, up * 1.4 + normal.y * .3, normal.z) * (.2 + h * .7) + vec3(sin(uTime * .9 + h * 40.), 0., cos(uTime * .8 + h * 31.)) * .08) * fo * fo;
      }
      vec3 p = rotY(lp, uRot) * uXf.w + uXf.xyz;
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
          // rot-orange: Modus 1 alle, Modus 0 nur im aktiven Abschnitt (weich über uZoneAmt)
          float red = uDiscMode > 1.5 ? 0. : uDiscMode > .5 ? 1. : on;
          col = mix(cDiscD, cDiscA, red) * (.5 + .5 * lam) * (1. - fuge * .78) + cBlue * sil * .22 * (1. - red * .7);
          sz = .9;
        } else {
          float plate = aEdge < 0. ? 0. : smoothstep(.74, .9, aEdge);
          col = uSharp > .5 // Wirbelsäule echt (A): Umriss hell, Fläche zum Betrachter dunkler – wie eine anatomische Strichzeichnung
            ? cBone * (.14 + .86 * lam) * mix(.34, 1.45, smoothstep(.1, .7, sil)) + cBlue * rim * .1
            : cBone * (.2 + .8 * lam) * mix(.58, 1.2, sil) + cBlue * rim * .12;
          col = mix(col, cBone * 1.3 + vec3(.08, .05, 0.), plate * .85);
          sz = aEdge < 0. ? .78 : 1. + plate * .2;
          if (aEdge < 0.) col *= .78;
          if (uEcht > .5) { // Wirbelsäule echt (Go Kai 1–4, Punkt 4): Rangfolge – Wirbelkörper hell mit hellem Umriss, Platten am hellsten,
            // Bogen und Fortsätze gedämpft und feiner (im aktiven Abschnitt färbt sie unten das Bernstein ein)
            float s2 = smoothstep(.15, .75, sil);
            col = cBone * (.3 + .7 * lam) * mix(.62, 1.35, s2) + cBlue * rim * .1;
            col = mix(col, cBone * 1.35 + vec3(.1, .06, 0.), plate * .9);
            if (aEdge < -.5) { col *= .48 + .52 * on; sz = .7; } else sz = 1. + plate * .25;
          }
        }
      }
      if (uDiff > .5 && aKind > .5) col *= 1. + on * (uDiscMode < .5 ? .25 : .5); // Bandscheibe: im Abschnitt heller (Standard: rot-orange statt blau)
      else col = mix(col, cAmber * (.35 + .95 * lam), on * (aKind < .5 ? 1. : .4));
      float g = exp(-pow((p.y - uCut) * 9., 2.));
      col = mix(col, cAmber * 1.3, g);
      float sc = exp(-pow((p.y - uScan) * 16., 2.)) * uScanAmt; // Scanner: Band unter der Scan-Linie leuchtet
      col = mix(col, cAmber * 1.5 + vec3(.15), sc * .85);
      col = mix(col, cAmber * 1.15, fo * .75);
      vVis = step(uCut, p.y) * uOn * step(fo, .97);
      vec4 mv = viewMatrix * vec4(p, 1.);
      gl_Position = projectionMatrix * mv;
      float pk = ptrK();
      vCol = mix(col, max(col, cBone * 1.25), pk * .75);
      // Handy (18.11., „1a“): am Kapitelende blendet die Wirbelsäule als Ganzes aus (uFade) und endet weich an der Unterkante
      // des Kapitels (uClip, Bildschirmhöhe −1…1) – sie zerfällt nicht mehr in Punkte und liegt nie unter dem Text von „04 Dach“
      float keep = smoothstep(uClip, uClip + .16, gl_Position.y / gl_Position.w) * uFade;
      vCol = mix(vec3(.003, .008, .011), vCol, keep); vVis *= step(.03, keep);
      gl_PointSize = clamp(uStip / -mv.z * sz * (uSharp > .5 ? .86 : 1.) * (1. - fo * .7), 1., uMaxSize) * (1. + g * .8 + sc * .7 + pk * .35);
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
      uniform sampler2D uCurves, uPeriTex; uniform float uRows, uGhostV, uFade, uClip;
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
        vec3 p; float base, pk, boost = 0., fk = 1.; // fk: Fokus – 1 = außerhalb des Segments (blendet aus)
        if (aKind < 1.5) {                         // Rückenmark
          vec3 q = curveAt(uCurves, aRow, uRows, t) + aOff; fk = focOut(q.y);
          p = rotY(focFit(q), uRot) * uXf.w + uXf.xyz;
          pk = max(packet(S1 - t, 700.), packet(S2 - t, 700.));
          base = .46;
        } else if (aKind < 2.5) {                  // Nervenwurzel
          fk = step(.5, abs(aZone - uFocZone));
          p = rotY(focFit(curveAt(uCurves, aRow, uRows, t) + aOff), uRot) * uXf.w + uXf.xyz;
          float on = (1. - step(.5, abs(aZone - uZone))) * uZoneAmt;
          boost = on;
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
          boost = 1.;
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
        vCol = col; vA = vis * clamp(base + pk, 0., 1.4) * (1. - fk * clamp(uFoc * 1.6, 0., 1.));
        // N4 (Auftrag Z, nur PC): im Durchschein-Durchgang (uGhostV) die aktive Wurzel und die Versorgungsbahn kräftiger –
        // sonst beginnt die Bahn hinter dem echten, größeren Kreuzbein „in der Luft“ (L4–L5, S1)
        vA *= 1. + uGhostV * boost * 1.3;
        vA *= smoothstep(uClip, uClip + .16, gl_Position.y / gl_Position.w) * uFade;
        gl_PointSize *= 1. + uGhostV * boost * .7;
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
  nerveMat.uniforms = { ...sU, uGhost: { value: 1 }, uGhostV: { value: 0 } };
  const nerves = new THREE.Points(nGeo, nerveMat);
  nerves.frustumCulled = false;
  // zweiter Durchgang: Nerven schimmern gedämpft durch den Knochen (sonst verschwände das Rückenmark im Wirbelkanal)
  const ghostMat = nerveMat.clone();
  ghostMat.uniforms = { ...sU, uGhost: { value: isDesktop() ? 0.42 : 0.24 }, uGhostV: { value: isDesktop() ? 1 : 0 } }; ghostMat.depthTest = false; // Wirbelsäule echt (A): Handy weniger Rückenmark durch den Knochen
  // (Auftrag Z: im Entwurf W stand dieser Kommentar vor „depthTest = false“ → der Durchschein war dort ganz aus; behoben)
  const nervesGhost = new THREE.Points(nGeo, ghostMat);
  nervesGhost.frustumCulled = false;
  spineGroup.add(nervesGhost, nerves);
}

const spineGroup = new THREE.Group();
spineGroup.visible = false;
scene.add(spineGroup);
// Shader vorwärmen (Messung 7.11.): versteckte Gruppen kompilieren sonst erst beim ersten Zeigen → Ruckler beim Kapitelwechsel.
// Kurz sichtbar schalten, compile() reicht die Programme nur an den Treiber (paralleles Linken), sofort zurück – kein Bild dazwischen.
// Nur PC (Diagnose 7.11. spät): am Handy wird die Wirbelsäule schon im Hero gebaut (whenNear 150 %) → das Vorwärmen
// verlegte das Shader-Übersetzen in den Hero (iPhone/Metal: ein Haker, während man die Figur ansieht). Gewinn war nur am PC gemessen.
function warmShaders() {
  if (!renderer || !isDesktop()) return;
  const run = () => {
    const hid = [spineGroup].filter((o) => !o.visible);
    hid.forEach((o) => { o.visible = true; });
    try { renderer.compile(scene, camera); } catch (e) { /* egal */ }
    hid.forEach((o) => { o.visible = false; });
  };
  if (typeof requestIdleCallback === 'function') requestIdleCallback(run, { timeout: 1500 }); else setTimeout(run, 300);
}
// Wirbelsäule „echt“ (BodyParts3D, Auftrag W; in Puls seit Auftrag Z 14.11.) – die gerechnete („bisher“) bleibt Rückfall, wenn die Datei nicht lädt; siehe src/wirbel-echt/echt.js
// Wirbelsäule echt (Go Kai 14.11., B): Handy-Nahansicht – der aktive Abschnitt bekommt eine eigene, dichte Punktwolke (gleiche Schichten,
// ~20 000 Punkte im Höhenband der Haltestelle, weicher Rand), je Form und Haltestelle einmal gerechnet und aufbewahrt;
// Ein-/Ausblenden über drawRange (Punkte liegen zufällig → die Dichte wächst gleichmäßig)
const ZOOM0 = []; // Nahansicht-Faktoren je Haltestelle wie in Puls (Punkt 1)
const DENSE = { obj: null, idx: -1, k: 0, busy: false, N: 20000 };
function denseRegion(i) {
  let y0 = 1e9, y1 = -1e9, hm = 0;
  STOPS[i].ids.forEach((id) => {
    const lv = det.levels.find((l) => l.id === id), y = (lv.center.y - CY) * SC, h = (lv.h / 2 + lv.disc) * SC;
    y0 = Math.min(y0, y - h); y1 = Math.max(y1, y + h); hm = Math.max(hm, lv.h * SC);
  });
  return { y0, y1, pad: Math.min(0.5, Math.max(0.12, hm * 0.9)) };
}
function denseTick(dt, want) {
  const D = DENSE;
  if (!det || !bones) return;
  if (D.obj && want !== D.idx) { D.k = Math.max(0, D.k - dt * 5); if (D.k === 0) { spineGroup.remove(D.obj); D.obj = null; D.idx = -1; } }
  else if (D.obj) D.k = reduced ? 1 : Math.min(1, D.k + dt * 1.6);
  if (D.obj) D.obj.geometry.setDrawRange(0, Math.round(D.obj.userData.n * D.k * D.k * (3 - 2 * D.k)));
  if (want < 0 || D.obj || D.busy) return;
  const cache = det.dense || (det.dense = {});
  if (cache[want]) { D.obj = cache[want]; D.idx = want; D.k = 0; D.obj.geometry.setDrawRange(0, 0); spineGroup.add(D.obj); return; }
  D.busy = true;
  const d0 = det;
  runSliced(d0.makeSlicesGen(D.N, 0.032, 0.12, true, denseRegion(want))).then((sl) => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(sl.pos, 3));
    g.setAttribute('normal', new THREE.BufferAttribute(sl.nor, 3));
    g.setAttribute('aZone', new THREE.BufferAttribute(sl.zone, 1));
    g.setAttribute('aKind', new THREE.BufferAttribute(sl.kind, 1));
    g.setAttribute('aEdge', new THREE.BufferAttribute(sl.edge, 1));
    g.setDrawRange(0, 0);
    const m = boneMat.clone();
    m.uniforms = { ...sU, uStip: { value: 1 }, uMaxSize: { value: 2.6 } };
    const pts = new THREE.Points(g, m);
    pts.frustumCulled = false; pts.userData.n = sl.count;
    cache[want] = pts;
  }).finally(() => { D.busy = false; });
}
function spineSwap(d, sl) {
  det = d; SC = d.SC; CY = d.CY;
  sU.uDiff.value = 1; // differenziert (Handy 7.11., PC 7.11.)
  // Kameraabstand je Haltestelle ist in Einheiten der gerechneten Säule angegeben → für „echt“ umrechnen
  // Punkt 1 (Go Kai 1–4): Nahansicht nach der Wirbelbreite – echte Wirbel sind im Verhältnis zur Säule ~1,5× schmaler,
  // daher je Haltestelle um zk (Mittel der Wirbel, 1…1,5) näher heran: gleiche Bildgröße wie „bisher“ (PC: STOPS.d, Handy: ZOOM)
  if (!ZOOM0.length) ZOOM0.push(...ZOOM);
  STOPS.forEach((s, i) => {
    if (s.d0 === undefined) s.d0 = s.d;
    const k = d.zk ? Math.min(1.5, Math.max(1, s.ids.reduce((a, id) => a + (d.zk[id] || 1), 0) / s.ids.length)) : 1;
    s.d = s.d0 * (d.dScale || 1) / (1 + (k - 1) * 0.7); ZOOM[i] = ZOOM0[i] * (1 + (k - 1) * 0.5); // abgeschwächt: PC 70 % (Schilder), Handy 50 % (Karte, Aufzug)
  });
  sU.uEcht.value = d.echt ? 1 : 0; // Punkt 4: Schattierung mit Rangfolge nur für „echt“
  spineGroup.clear(); DENSE.obj = null; DENSE.idx = -1; // dichte Wolke gehört zur alten Form
  if (!d.objs) {
    const core = new THREE.Mesh(d.coreGeo, coreMat);
    core.frustumCulled = false;
    delete STYLES.slices;
    const b = boneStyle('slices', sl);
    spineGroup.add(core, b.pts);
    addNerves(); // legt eigene Kurven-Textur an (sU.uCurves/uRows)
    d.objs = { kids: spineGroup.children.slice(), bones: b, uC: sU.uCurves, uR: sU.uRows };
  } else {
    spineGroup.add(...d.objs.kids); sU.uCurves = d.objs.uC; sU.uRows = d.objs.uR;
  }
  bones = d.objs.bones;
  ML.key = null; ML.tipKey = null; periCurve = null; // Zeilen, Andockpunkte und Versorgungsbahn neu messen
  warmShaders();
}
whenNear($('#achse'), () => ECHT.start({
  swap: spineSwap,
  bisher: () => spineStippleGen(0, false),
  slices: (d) => d.makeSlicesGen(N_SLICE, isDesktop() ? 0.024 : 0.032, 0.12, true),
}));
window.__wv = { det: () => det, peri: () => periCurve, STOPS, camera, uniforms }; // Prüfhilfe (Konsole)

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
  c12: { exit: 'Nervenaustritt C1–C2', nerv: 'Nn. suboccipitales · N. occipitalis major', gef: 'Tiefe Nackenmuskulatur', ziel: 'Hinterkopf', typ: 'Typisch: Spannungskopfschmerz, Schwindelgefühl, eingeschränktes Kopfdrehen', tgt: [84, 30] },
  c56: { exit: 'Nervenaustritt C5–C6', nerv: 'Bizeps · Schulterheber', gef: 'Gefühl: Armaußenseite', ziel: 'bis zum Daumen', typ: 'Typisch: Ausstrahlung bis in den Daumen, Kribbeln, Schwäche beim Beugen', tgt: [18, 234] },
  th712: { exit: 'Nervenaustritt Th7–Th12', nerv: 'Untere Interkostalnerven · Bauchwand', gef: 'Gefühl: Rippenbogen, Bauchwand', ziel: 'bis zur Nabelhöhe (Th10)', typ: 'Typisch: gürtelförmiger Schmerz am Rippenbogen, Steifigkeit am Übergang zur LWS', tgt: [86, 195] }, // Flanke auf Nabelhöhe
  th16: { exit: 'Nervenaustritt Th1–Th6', nerv: 'Interkostalnerven, obere Rippen', gef: 'Brustkorbwand · Zwischenrippen', ziel: 'Brustkorb', typ: 'Typisch: atemabhängiges Stechen, Schmerz zwischen den Schulterblättern', tgt: [80, 118] },
  l45: { exit: 'Nervenaustritt L4–L5', nerv: 'Richtung N. ischiadicus · L5 hebt den Fuß', gef: 'Gefühl: Schienbein', ziel: 'bis zur Großzehe', typ: 'Typisch: Ausstrahlung ins Bein, Kribbeln am Schienbein, Fußheber-Schwäche', tgt: [89, 410] },
  s1: { exit: 'Nervenaustritt S1 · ISG', nerv: 'Wade · Achillessehnenreflex', gef: 'Gefühl: Beinrückseite, Fußaußenrand', ziel: 'bis zur Ferse', typ: 'Typisch: Ausstrahlung bis zur Ferse, einseitiger Kreuzschmerz', tgt: [72, 412], pre: 'Iliosakralgelenk (ISG): verbindet Becken und Wirbelsäule.' },
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
// Leiste antippen = auf-/zuklappen (18.11., „2a“); der Film-Knopf darin hat seinen eigenen Klick
chipsEl.addEventListener('click', (e) => { if (e.target.closest('.vf-open,.sc-film') || !chipsEl.classList.contains('is-on')) return; chipsEl.classList.toggle('is-open'); });
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
    // 18.11. (Go Kai „2a“): die Karte ist eine schmale Leiste unten – Abschnitt + Titel, Antippen zeigt „Typisch“, Nerv, Gefühl,
    // Therapien. Sichtbar bleiben nur zwei Schilder (Austritt, Ziel); die Wirbelsäule steht darüber frei.
    ML.ws[1] = ML.ws[2] = 0; ML.hs[1] = ML.hs[2] = 0;
    const info = NINFO[zoneKey];
    const bar = document.createElement('button'), head = document.createElement('span'), no = document.createElement('span'), h = document.createElement('span'), more = document.createElement('div'), list = document.createElement('div');
    bar.type = 'button'; bar.className = 'sc-bar'; bar.tabIndex = -1;
    head.className = 'sc-t'; no.className = 'sc-no'; no.textContent = card ? ($('.seg-no', card) || card).textContent.trim() : '';
    h.className = 'sc-h'; h.textContent = card && $('h3', card) ? $('h3', card).textContent.trim() : ''; head.append(no, h);
    bar.append(head);
    // Film-Knopf (Auftrag Z): sichtbare Kopien nur für Finger/Maus – der echte Knopf steht in der (für Vorleseprogramme lesbaren) Karte.
    // In der Leiste klein („Film“), aufgeklappt mit vollem Text.
    let vfBtn = null;
    if (zoneKey === 'l45' && VF.open) {
      const mini = document.createElement('span'); mini.className = 'sc-film'; mini.setAttribute('role', 'button');
      mini.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5l11 7-11 7z"/></svg>Film';
      mini.addEventListener('click', (e) => { e.stopPropagation(); VF.open(e); });
      bar.append(mini); bar.classList.add('has-film');
      vfBtn = document.createElement('button'); vfBtn.type = 'button'; vfBtn.className = 'vf-open'; vfBtn.tabIndex = -1;
      vfBtn.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5l11 7-11 7z"/></svg><span>Bandscheibenvorfall ansehen</span><small>Film · 37 s</small>';
      vfBtn.addEventListener('click', VF.open);
    }
    const chev = document.createElement('span'); chev.className = 'sc-x'; bar.append(chev);
    more.className = 'sc-more';
    const typ = document.createElement('p'); typ.className = 'sc-typ'; typ.textContent = (info.pre ? info.pre + '\n' : '') + info.typ;
    const rows = document.createElement('div'); rows.className = 'sc-rows';
    [info.nerv, info.gef].forEach((t) => { const r = document.createElement('p'); r.textContent = t; rows.append(r); });
    list.className = 'sc-c'; list.replaceChildren(...chipTxt.map((t) => { const sp = document.createElement('span'); sp.textContent = t; return sp; }));
    more.append(typ, rows, list, ...(vfBtn ? [vfBtn] : []));
    chipsEl.replaceChildren(bar, more);
    chipsEl.classList.remove('is-open', 'sc-small');
    chipsEl.style.width = Math.min(VW - pad - RAIL_W - 8, 480) + 'px'; ML.chH = chipsEl.offsetHeight;
  }
}
// Scanner (Kai 6.11. spät): Karte oben unter der Kopfleiste, darunter links die vier Zeilen; die Kamera legt die Wurzel
// des Abschnitts auf „Austritt“, die Wirbelsäule darunter bleibt frei. Reicht der Platz nicht: Stufe 1 Therapien als
// Textzeile, Stufe 2 kleinere Schrift in der Karte.
function mobPlaceScan() {
  // 18.11. („2a“): freie Fläche = Kopfleiste bis Oberkante der Leiste. Der Abschnitt steht bei gut einem Drittel der Höhe,
  // „Austritt“ auf Höhe des Austritts am Wirbel, „Ziel“ unter dem Wurzelende – beide nie unter die Leiste.
  const hs = ML.hs, g = 10;
  ML.typY = -999; ML.chipsY = SCAN.bot + 6; // Unterkante der Leiste (sie wächst beim Aufklappen nach oben)
  const top = SCAN.cardTop + 6, bot = ML.chipsY - ML.chH - 10;
  ML.y0 = top + (bot - top) * 0.36 - hs[0] / 2; // Lage ohne Verschiebung (danach richtet sich die Nahansicht)
  let y0 = ML.y0, y3 = y0 + hs[0] + 56;
  if (ML.exitT != null && ML.tipKey === ML.key) {
    y0 = clamp(ML.exitT - hs[0] / 2, top, Math.max(top, bot - hs[0] - g - hs[3]));
    y3 = ML.tipT + 24 - hs[3] / 2;
  }
  ML.ys[0] = y0; ML.ys[1] = ML.ys[2] = y0;
  ML.ys[3] = clamp(y3, y0 + hs[0] + g, Math.max(y0 + hs[0] + g, bot - hs[3]));
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
    const vis = show && prog > th[i] && !(sc && (i === 4 || i === 1 || i === 2)); // Scanner: „Typisch“, Nerv und Gefühl stehen in der Leiste
    if (vis) mlVisT = now;
    el.style.opacity = vis ? 1 : 0; el.style.transitionDuration = dur;
    if (i < 4) nl[i].style.opacity = nring[i].style.opacity = vis && (!opt || opt.lines) ? 1 : 0;
  });
  { const on = !!(sc && show && prog > (opt ? opt.chip : MTH[4] + 0.06)); chipsEl.style.opacity = on ? 1 : 0; chipsEl.classList.toggle('is-on', on); } chipsEl.style.transitionDuration = dur; // is-on: Film-Knopf nur sichtbar tippbar
  if (!show) return;
  ncalls.forEach((el, i) => { el.style.transform = `translate(${ML.x}px, ${(i < 4 ? ML.ys[i] : ML.typY).toFixed(1)}px)`; });
  if (sc) { chipsEl.style.transform = `translate(${ML.x}px, ${ML.chipsY.toFixed(1)}px) translateY(-100%)`; chipsEl.style.maxHeight = Math.max(120, ML.chipsY - SCAN.cardTop - 4).toFixed(0) + 'px'; } // unten verankert
  (sc ? ML.anch : [0, 0.33, 0.66, 1]).forEach((t, i) => {
    const [ax, ay] = toPx(periCurve.getPointAt(t)), L = nl[i];
    // Linie endet am Rand des Andockrings, der Ring sitzt genau auf dem Nerv
    const x1 = ML.x + ML.ws[i], y1 = ML.ys[i] + ML.hs[i] / 2, dl = Math.hypot(ax - x1, ay - y1) || 1, k = Math.max(0, 1 - 5 / dl);
    L.setAttribute('x1', x1); L.setAttribute('y1', y1); L.setAttribute('x2', x1 + (ax - x1) * k); L.setAttribute('y2', y1 + (ay - y1) * k);
    nring[i].setAttribute('cx', ax); nring[i].setAttribute('cy', ay);
  });
}

// Körper-Silhouette (zarte Partikel), an die Kamera gehängt, rechts im Bild; das Versorgungsgebiet glüht
// (seit 17.11.: die sichtbaren Punkte der Figur aus Kapitel 01 – grobes Raster, Kontur, Körperlinien; gefüllt am Dateiende, silFill)
const silGeo = new THREE.BufferGeometry(); silGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(3), 3));
function silFill() {
  const a = [];
  for (let i = 0; i < N; i++) if (body.f0[i * 3] > 0) a.push(body.pos[i * 3], body.pos[i * 3 + 1], body.pos[i * 3 + 2] * 0.4);
  silGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(a), 3));
}
const silU = { uOn: { value: 0 }, uTgt: { value: new V3() }, uTime: uniforms.uTime, uPix: uniforms.uPix, cBone: uniforms.cBone, cBlue: uniforms.cBlue, cPetrol: uniforms.cPetrol };
const sil = new THREE.Points(silGeo, new THREE.ShaderMaterial({
  uniforms: silU, transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending,
  vertexShader: /* glsl */`
    uniform float uOn, uTime, uPix; uniform vec3 uTgt; uniform vec3 cBone, cBlue, cPetrol; varying vec3 vCol; varying float vA;
    void main(){ float d = distance(position.xy, uTgt.xy);
      float glow = exp(-d * d * 1.6) * (.75 + .25 * sin(uTime * 3. - d * 4.));
      vCol = mix(cPetrol * 1.3, cBlue * 1.6, glow) + vec3(.9) * glow * .35;
      vec4 mv = modelViewMatrix * vec4(position, 1.); gl_Position = projectionMatrix * mv;
      gl_PointSize = uPix * (1. + glow * .9) * 2.1; vA = uOn * (.34 + glow * .66); }`,
  fragmentShader: /* glsl */`varying vec3 vCol; varying float vA; void main(){ float d = length(gl_PointCoord - .5); gl_FragColor = vec4(vCol, (1. - smoothstep(.3, .5, d)) * vA);
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
const axisNote = $('#achse .note'), dachSec = $('#dach'), dTitleEl = $('#d-title');
// ---------- Kapitel-Auftakt (18.11.2026, Studie A/B → Kai: „A“) ----------
// Vor jedem der Kapitel 02–05 steht ein eigener ruhiger Abschnitt: große kursive Ziffer, Name, Untertitel wie in der Kopfleiste, eine
// Linie zieht sich quer. Dahinter läuft der Formwechsel der Punkte (der Staub sammelt sich zur neuen Form) – der Übergang zeigt
// den Kapitelwechsel. Der kleine Kicker im Kapitel entfällt dafür (CSS html.auftakt). Ohne JavaScript gibt es keinen Auftakt,
// die Kicker bleiben. Kapitelanfang für Formwechsel, Kopfleiste und Kapitel-Links ist die Oberkante des Auftakts (auTop).
const AU_INFO = { bewegung: ['02', 'Bewegung', 'Über HOP'], achse: ['03', 'Achse', 'Wirbelsäule'], dach: ['04', 'Dach', 'Praxis &amp; Leistungen'], tuer: ['05', 'Tür', 'Kontakt &amp; Termin'] };
const auftakt = {};
{
  const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: 0.3 });
  Object.entries(AU_INFO).forEach(([id, [no, name, sub]]) => {
    const sec = document.getElementById(id); if (!sec) return;
    const el = document.createElement('div'); el.className = 'auftakt-blk'; el.dataset.for = id;
    el.innerHTML = `<div class="wrap"><p class="au-row"><span class="au-no">${no}</span><span class="au-txt"><span class="au-name">${name}</span><span class="au-sub">${sub}</span></span></p><i class="au-line" aria-hidden="true"></i></div>`;
    sec.parentNode.insertBefore(el, sec); auftakt[id] = el; io.observe(el);
  });
  document.documentElement.classList.add('auftakt');
}
const auTop = (sec) => (auftakt[sec.id] || sec).getBoundingClientRect().top; // Kapitelanfang im Fenster (mit Auftakt)
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
let RAIL_W = 88, RTX = 26, RK = 1, railVW = -1; // Breite des Ziehstreifens rechts (px): links Haltestellen, rechts Rinne mit Griff
// wächst mit der Grundschrift (ab 1600 px, Griff/Haltestellen sind in rem) – Handy: 16 px → unverändert 88 px
function railMeasure() {
  if (railVW === VW) return; railVW = VW;
  RK = (parseFloat(getComputedStyle(document.documentElement).fontSize) || 16) / 16;
  // Handy (18.11., „2a“): schmale Schiene ohne Fläche – 64 statt 88 px, Griff näher am Rand (RTX = Abstand der Rinne vom Rand)
  const pcR = isDesktop(); RAIL_W = Math.round((pcR ? 88 : 64) * RK); RTX = (pcR ? 26 : 22) * RK;
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
const TX_OPT = { th: [0.3, 0.55, 0.8, 0.65, 0.05], chip: 0.05, lines: true, slow: true }; // 18.11.: nur Austritt (0) und Ziel (3) sichtbar
function scanTexts(zKey, settle) {
  const now = performance.now();
  if (settle && zKey) { if (TX.zone !== zKey) { TX.zone = zKey; TX.t0 = now; } TX.last = now; }
  const held = !settle && TX.zone && now - TX.last < 650 && SCAN.wasEng; // Bühne gelöst (Kapitel wird verlassen): nichts halten
  if (!settle && !held) TX.zone = null;
  updateCalloutsMob(TX.zone, !!TX.zone && (settle || held), (now - TX.t0) / 1000, { ...TX_OPT, lines: settle, slow: SCAN.wasEng });
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
    // 18.11.: auch beim Hereinkommen (sr.top > 0) geht die Wirbelsäule mit ihrer Bühne – sie steigt mit „03 Achse“ von unten auf,
    // statt schon groß über dem Text der Hausordnung zu stehen (vorher nur beim Lösen: Math.min(0, sr.top))
    const nb = axisNote ? axisNote.getBoundingClientRect() : null, sr = axSticky ? axSticky.getBoundingClientRect() : null, lift = sr ? sr.top : 0;
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
    // 18.11.: solange die Bühne noch nicht steht (kein Ziehstreifen im Bild), rückt die Wirbelsäule weiter nach rechts –
    // sonst liegt sie beim Hereinkommen auf dem Ende der Überschrift und der Anleitung (Textspalte 64 %)
    const edge = SCAN.wasEng ? RAIL_W + 6 : 30;
    const tx = det && SCAN.right ? OV.x + (VW - edge - SCAN.right) * (8.197 / GLH) : (0.22 * VW) * (8.197 / GLH);
    OV.x = OV.init ? OV.x + (tx - OV.x) * (reduced ? 1 : 1 - Math.exp(-dt * 6)) : tx; OV.init = true;
  }
  // ruhige Schrägansicht (Wurzeln zeigen nach links), atmet leicht hin und her
  const want = PROFILE + (pc ? -0.5 : 0.5) + (paused || reduced ? 0 : Math.sin(uniforms.uTime.value * 0.35) * 0.1); // PC: Wurzeln nach rechts
  spineRot += (want + Math.PI * 2 * Math.round((spineRot - want) / (Math.PI * 2)) - spineRot) * (reduced ? 1 : 1 - Math.exp(-dt * 2.2));
  uniforms.uSpineRot.value = spineRot;
  const fx = FX.hand && FX.e > 0; // Fokus: Wirbelsäule übernimmt Blick und Lage des Films
  if (fx) fxRot();
  axisWant = null;
  if (!pc) { sil.visible = false; silU.uOn.value = 0; }
  periLabel.style.opacity = 0;

  // Handy (18.11.): die Wirbelsäule löst sich etwas später auf – sie geht erst mit der Bühne nach oben, sonst bleibt vor „04 Dach“ ein leeres Bild
  // Handy (18.11., Go Kai „1a“): beim Verlassen zerfällt sie nicht mehr in Punkte. Die Abtastlinie bleibt unten (solidIn), die
  // Wirbelsäule endet weich an der Unterkante des Kapitels und blendet als Ganzes aus (outK → uFade), sobald „04 Dach“ ins Bild kommt.
  // 20.11. (Auftrag Kai: Abläufe über die Zeit): die Abtastlinie startet, sobald das Kapitel hereinkommt, und läuft dann von selbst.
  // Kommt man von unten zurück (Kapitel steht schon über dem Bild), ist die Wirbelsäule wie bisher sofort wieder da.
  if (!inSec) scanGate.set(0); else if (!scanGate.inSec && r.top < VH * 0.25) scanGate.set(1);
  scanGate.inSec = inSec;
  const solidIn = inSec ? weich(scanGate(smooth(VH * 1.0, VH * 0.25, r.top), dt)) * spineK : 0;
  // PC ebenso (18.11. mittags): der genauere Prüfstand zeigte dort dieselbe helle Wolke beim Verlassen und beim Zurückkommen
  const outK = smooth(VH * 0.34, VH * 0.06, r.bottom);
  const solid = solidIn * (1 - outK);
  sU.uFade.value = 1 - outK; sU.uClip.value = 1 - 2 * (r.bottom - 4) / VH; // ganz weg 4 px über dem Kapitelende, voll da rund 55 px darüber
  const eng = inSec && solid > 0.97 && r.top < VH * 0.12 && r.bottom > VH * 0.9; // Bühne steht
  SCAN.wasEng = eng;
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
  denseTick(dt, !pc && settle && ZM.k > 0.5 ? ZM.idx : -1); // Wirbelsäule echt (B)
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
      const py = ML.key === st.zone && ML.hs[0] ? ML.y0 + ML.hs[0] / 2 : SCAN.top + (SCAN.bot - SCAN.top) * 0.36;
      // Abschnitt mittig zwischen Zeilen-Spalte und Ziehstreifen
      screenToWorld(Math.max(VW * 0.5, (ML.x + Math.max(ML.ws[0], ML.ws[3]) + 12 + VW - RAIL_W) / 2), py, _zc.z * zw, _zw);
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
    if (fx) fxPose(X);
  }
  const zoomE = ZM.k * ZM.k * (3 - 2 * ZM.k);
  // Aufbau beim Hereinkommen (Scan von oben), Auflösen nach oben beim Weiterscrollen
  const topY = X.y + 4.35 * X.w, botY = X.y - 4.35 * X.w;
  uniforms.uCut.value = solid <= 0 ? 100 : THREE.MathUtils.lerp(topY + 0.05, botY - 0.05, solidIn);
  spineGroup.visible = solid > 0; sU.uOn.value = solid > 0 ? 1 : 0;
  if (bones) bones.pts.material.uniforms.uStip.value = (renderer ? renderer.getPixelRatio() : 1) * GLH * 0.5 / tanH * X.w * (bones.name === 'grain' ? bones.spacing * 0.78 : 0.022);
  if (DENSE.obj && bones) DENSE.obj.material.uniforms.uStip.value = bones.pts.material.uniforms.uStip.value * 0.8; // Wirbelsäule echt (B)
  // Band unter der Linie: Lage in der Übersicht → in Wirbelsäulen-Einheiten → aktuelle (ggf. herangezoomte) Lage
  sU.uScan.value = y >= 0 && OV.w > 0 ? ((screenToWorldY(y) - OV.y) / OV.w) * X.w + X.y : 100;
  sU.uScanAmt.value += ((ready && !(FX.on && FX.hand) ? 1 - 0.7 * zoomE : 0) - sU.uScanAmt.value) * Math.min(1, dt * 6);

  // Abschnitt: Hervorhebung, Bahn, Zeilen (erst, wenn die Nahansicht fast angekommen ist)
  const zone = seg >= 0 ? ZONES.indexOf(SSTOPS[seg].zone) : -10, zKey = seg >= 0 ? SSTOPS[seg].zone : null;
  if (zone !== sU.uZone.value) { sU.uZone.value = zone; sU.uZoneAmt.value = 0; sU.uPeri.value = 0; }
  const fxOn = FX.on && FX.hand; // Fokus: Hervorhebung und Versorgungsbahn treten zurück (das Segment wird zum Film)
  sU.uZoneAmt.value += ((zone >= 0 && !fxOn ? 1 : 0) - sU.uZoneAmt.value) * 0.07;
  sU.uPeri.value += ((zKey && !fxOn && (pc || ML.key === zKey) && ZM.k > (pc ? 0.75 : 0.4) ? 1 : 0) - sU.uPeri.value) * (fxOn ? 0.12 : 0.05);
  if (pc) {
    // PC: Silhouette rechts (vor dem Aufzug), Bahn bis ins Versorgungsgebiet, Schilder frei platziert
    placeSilhouette();
    const silOn = zKey ? sU.uPeri.value : 0;
    silU.uOn.value = silOn; sil.visible = silOn > 0.01;
    if (zKey && det) updatePeri(zKey);
    if (settle && zKey) { if (TX.zone !== zKey) { TX.zone = zKey; TX.t0 = performance.now(); } } else TX.zone = null;
    updateCallouts(zKey, TX.zone ? Math.min(0.9, (performance.now() - TX.t0) / 1000 * 0.25) : 0, silOn > 0.5);
    chipsEl.style.opacity = 0; chipsEl.classList.remove('is-on');
  } else {
    if (zKey && det) updatePeri(zKey);
    scanTexts(zKey, settle);
  }

  // Überschrift weicht, sobald gescannt wird; Hinweis geht beim Weiterscrollen mit (nicht über dem Haus stehen lassen)
  // PC: Textspalte bleibt stehen (2A)
  // 18.11. (Befund 3): hat der Scanner einmal gestanden, bleibt die Überschrift auch weg, während sich die Bühne am Kapitelende
  // löst – sonst steht sie halb unter der Kopfleiste und nennt einen Knopf, der nicht mehr im Bild ist
  const lifted = !pc && axSticky && axSticky.getBoundingClientRect().top < -2;
  if (axisHead && !pc) axisHead.style.opacity = SCAN.demo === 2 && (ready || lifted) ? 0 : '';
  if (axisNote && !pc) axisNote.style.opacity = (1 - smooth(VH * 0.98, VH * 0.62, r.bottom)).toFixed(3);
  if (pc && axisHead && axisHead.style.opacity) axisHead.style.opacity = ''; // Fenster vom Handy- auf PC-Format gezogen
  if (pc && axisNote && (axisNote.style.opacity || NOTE.shift)) { axisNote.style.opacity = ''; axisNote.style.transform = ''; NOTE.shift = 0; }
  scanUI.classList.toggle('on', !!ready);
  scanRail.classList.toggle('on', !!ready && (pc || SCAN.demo === 2)); // PC: auch während der Vorführfahrt per Tab erreichbar
  if (!ready || y < 0) return;
  // Aufzug rechts: Rinne, Haltestellen und Griff bleiben fest (Übersicht), auch in der Nahansicht – der Griff zeigt,
  // wo man steht; die Scan-Linie über der Wirbelsäule gehört zur Übersicht und tritt in der Nahansicht zurück
  const yMin = levY[0] - 6, yMax = levY[levY.length - 1] + 6, tx = VW - RTX, rTop = yMin - 28 * RK;
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

const scanGate = riegel(SCAN_SEK, 0.25, 0.08); // früh auslösen: startet die Abtastlinie später, steht so lange die grobe helle Übergangswolke neben der Überschrift (20.11. im Film gesehen)
function updateAxis(dt) {
  const ph = PH(), desk = isDesktop();
  const r = axis.getBoundingClientRect();
  const p = clamp(-r.top / Math.max(1, r.height - VH));
  // Handy-Scanner (18.11., „1a“): die Wirbelsäule hängt am Kapitel, nicht mehr am Formwechsel der Punktwolke – sie bleibt, bis ihr
  // Kapitel aus dem Bild ist (weiche Unterkante), und ist beim Zurückscrollen sofort wieder da (vorher: erst nach dem Formwechsel)
  const inSec = r.top < VH && r.bottom > 0 && morphNow > 1.6 && (morphNow < 2.4 || (desk ? pcScan() : scanOn()));
  // noch nicht fertig gerechnet: grobe Partikel bleiben, danach fahren Scan und Kamera sanft nach
  spineK = bones ? ramp(spineK, dt) : 0;
  if (desk ? pcScan() : scanOn()) { updateScan(dt, r, inSec); return; } // Handy: Scanner (6.11.), PC: Hybrid-Scanner (7.11.)
  scanUI.classList.remove('on'); scanRail.classList.remove('on'); chipsEl.style.opacity = 0; chipsEl.classList.remove('is-on'); sU.uScanAmt.value = 0;
  sU.uFade.value = 1; sU.uClip.value = -2; // ohne Scanner (alter Ablauf): kein Ausblenden an der Kapitelkante
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
      outK: smooth(vh * 1.45, vh * 0.6, dachSec.getBoundingClientRect().top), // auflösen (nach oben; 16.11. länger)
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
let morphNow = 0, morphInit = false, tickDt = 0;
let chapTop = null, logoGeo = null;
const chapDirty = () => { chapTop = null; logoGeo = null; };
addEventListener('resize', chapDirty); addEventListener('load', chapDirty);
if (window.ResizeObserver) new ResizeObserver(chapDirty).observe(document.body);
const morphGate = [];
function targetMorph() {
  const vh = VH;
  if (!morphGate.length) chapters.forEach(() => morphGate.push(riegel(1)));
  let m = 0;
  // mit Auftakt: der Formwechsel läuft hinter dem Auftakt. Ausnahme Kapitel 03: dort entsteht die Wirbelsäule mit ihrer Bühne
  // (Abtastlinie von oben) – finge der Formwechsel schon am Auftakt an, stünde am PC lange eine helle Säule aus groben Punkten
  // hinter „03“, bevor der Knochen sie ablöst. Hinter „03“ lösen sich stattdessen die HOP-Kreise auf (logoGeo.axis).
  if (!chapTop) chapTop = chapters.map((c) => (c === axis ? c.getBoundingClientRect().top : auTop(c)) + scrollY);
  const sy = scrollY;
  // Hausordnung (seit 14.11. nachts nach Kapitel 02): Ende des Textes von Kapitel 02 + Kicker der Hausordnung (absolut, gemerkt)
  logoGeo = logoGeo || { list: statement.parentNode.lastElementChild.getBoundingClientRect().bottom + sy, kick: rules.querySelector('.kicker').getBoundingClientRect().top + sy, kickB: rules.querySelector('.kicker').getBoundingClientRect().bottom + sy, laws: $('#laws').getBoundingClientRect().top + sy, rules: rules.getBoundingClientRect().top + sy, axis: auTop(axis) + sy };
  for (let i = 0; i < chapters.length; i++) {
    const r = { top: chapTop[i] - sy };
    const s = +chapters[i].dataset.stage;
    const prev = i ? +chapters[i - 1].dataset.stage : 0;
    // Übergang, während das Kapitel von unten hereinkommt
    let t = smooth(vh * 0.95, vh * 0.05, r.top); // Formwechsel über eine längere Strecke
    // Handy: die Figur löst sich schon beim ersten Scrollen an Ort und Stelle in Bewegungslinien auf
    // 16.11. (Kai, iPhone: „viel zu schnell“): über eine ganze Bildschirmhöhe statt 0,4 – fertig, bevor der Text von Kap. 02 die Mitte erreicht
    // seit 16.11. (Kap. 01 „Von Kopf bis Fuß“ davor): gleiche Strecke, gemessen am Anfang von Kap. 02 statt am Seitenanfang
    if (!isDesktop() && prev === 0 && s === 1) t = smooth(vh * 0.95, 0, r.top);
    // Handy: Wirbelsäule → Haus kürzer, damit das Haus fertig in der Bildmitte steht, bevor der Text von Kapitel 04 kommt
    if (!isDesktop() && prev === 2 && s === 3) t = smooth(vh * 1.15, vh * 0.25, r.top); // 16.11. (Kai: Tempo wie beim Start): 0,9 statt 0,65 Bildschirmhöhen
    // Handy: Bewegungslinien → Wirbelsäule früher fertig, damit der Scan schon mit der Überschrift entsteht;
    // seit 14.11. nachts etwas später begonnen, damit die Wirbelsäule nicht über dem letzten Paragraphen der Hausordnung entsteht
    if (!isDesktop() && prev === 1 && s === 2) t = smooth(vh * 1.1, vh * 0.25, r.top); // 16.11.: 0,85 statt 0,48 (Beginn liegt unter den HOP-Kreisen)
    morphGate[i](t, 0);
    if (morphGate[i].want()) m = s; // Auslöser: das Kapitel ist da → Ziel ist seine Form; der Weg dorthin läuft über die Zeit (tick)
  }
  return m;
}
// HOP-Kreise zur Hausordnung (14.11.2026 nachts, Reihenfolge A: Hausordnung steht direkt nach Kapitel 02): die Kreise bilden sich,
// während die Hausordnung hereinkommt, und lösen sich in die Wirbelsäule auf, sobald Kapitel 03 folgt (Shader: uLogo).
// Handy wie seit 8.11.: schon am Ende des vorigen Textes fertig, mittig im freien Raum über „§ Die Hausordnung“.
let logoNow = 0;
const logoIn = riegel(LOGO_SEK), logoOut = riegel(LOGO_SEK, 0.62, 0.4); // Auflösen erst, wenn Kapitel 03 wirklich hereinkommt (bei hohen Fenstern liegt es sonst schon im Messbereich, während man die Hausordnung liest)
function targetLogo(dt = 0) {
  const vh = VH, sy = scrollY, d = isDesktop();
  // 16.11. (Kai: „überall diese Geschwindigkeit“): Kreise kommen/gehen über ~0,9 Bildschirmhöhen (vorher 0,45–0,7)
  // 18.11. (Kai: „am Tablet und Handy kommen die Partikelstreifen nicht“, Go 3a): am Handy entstanden die Kreise schon, während
  // der Text von Kapitel 02 noch im Bild stand (gemessen am Textende) – den Streifen blieb nur ein Augenblick. Jetzt wie am PC am
  // Kicker „Die Hausordnung“ gemessen: die Kreise bilden sich, während er von unten bis zur Bildmitte steigt. Die übrigen Punkte
  // laufen als Streifen weiter (Shader uKeep) – am Tablet stehen Kapitel 02 und die Hausordnung fast gleichzeitig im Bild.
  const kIn = d ? smooth(vh * 1.0, vh * 0.1, logoGeo.rules - sy) : smooth(vh * 0.95, vh * 0.5, logoGeo.kick - sy);
  const kOut = d ? smooth(vh * 1.0, vh * 0.1, logoGeo.axis - sy) : smooth(vh * 1.2, vh * 0.35, logoGeo.axis - sy);
  // 20.11.: Auslöser statt Scrollweg – die Kreise sammeln sich und lösen sich über die Zeit
  return weich(logoIn(kIn, dt)) * (1 - weich(logoOut(kOut, dt)));
}
// Handy: Logo steht mittig im freien Raum zwischen dem Text von Kapitel 02 (bzw. Leiste) und „§ Die Hausordnung“ und steigt mit dem Text auf
function logoPlace() {
  // 18.11. nachmittags (Kai: „Überschriften nach oben, Animationen darunter“): die Kreise stehen jetzt UNTER „§ Die Hausordnung“,
  // mittig im freien Raum zwischen dem Kicker und den Paragraphen (vorher darüber, zwischen Kapitel 02 und dem Kicker)
  const sy = scrollY, c = (logoGeo.kickB - sy + logoGeo.laws - sy) / 2;
  const hh = 13 * Math.tan(THREE.MathUtils.degToRad(17.5)), wpp = 2 * hh / GLH;
  uniforms.uXf.value[4].set(0, (GLH / 2 - c) * wpp, 0, 0.32);
}

// ---------- Kapitel 04 (seit 14.11.2026, Go Kai „2a“): Linienhaus „Licht im Fenster“ statt Partikel-Haus ----------
// Baustein src/haus-licht/house.js + house.css (gleich wie die Entwurfsseite haus-licht.html): SVG-Haus bei Nacht, Licht je
// Raum, Rundgang, Rundgang aus Augenhöhe (Dialog, Zeichnung → Foto → später Scan) – kein WebGL. Die Partikel der Wirbelsäule
// fließen beim Hereinscrollen in die Bernstein-Dachlinie (Form 3 folgt der Lage des SVG-Dachs) und vergehen, während die
// Linie gezeichnet wird. Die Dachlinie über der Überschrift zeichnet weiter livingHeadlines (headLine: false).
// Entfallen: praxis.js-Punktwolke, Röntgenblick, Raum-Schilder, Klick-Rundgang in 3D, Partikel-Augenhöhe (src/ego).
const lh = initHouse({
  root: $('#lhRoot'), isPaused: () => paused, headLine: false,
  canDraw: () => !renderer || reduced || morphNow > 2.86, // erst zeichnen, wenn die Partikel an der Dachlinie angekommen sind
  onDialog: (open) => { if (open) lenis?.stop(); else lenis?.start(); },
  goto: (h) => { const t = $(h); if (t) scrollToY((auftakt[t.id] || t).getBoundingClientRect().top + scrollY); },
});
const tourWant = null; // die Kamera der Partikel-Szene fährt in Kapitel 04 nicht mehr
// Form 3 auf das SVG-Dach legen: Bildschirm-Pixel → Welt (Ebene z = 0, Übersichtskamera wie logoPlace)
function roofPlace() {
  if (morphNow < 2.02 || morphNow > 3.98) return;
  const g = lh.roofScreen(); if (!g) return;
  const hh = 13 * Math.tan(THREE.MathUtils.degToRad(17.5)), wpp = 2 * hh / GLH, half = Math.max(1, (g.r - g.l) / 2);
  uniforms.uXf.value[3].set(((g.l + g.r) / 2 - VW / 2) * wpp, (GLH / 2 - g.bot) * wpp, 0, half * wpp);
  uniforms.uRoofH.value = (g.bot - g.top) / half;
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
// Auftrag Z (vorbereitet, NICHT Standard – Kai entscheidet): ?dach=eins blendet die kleine Linie aus, sobald das Hausdach gezeichnet wird (eine Dachlinie statt zwei)
const ONE_ROOF = !/[?&]dach=zwei\b/.test(location.search); // seit 20.11. fest (Kai im Arbeitsblatt: „nur eine“); ?dach=zwei zeigt zum Vergleich beide
// 05 Tür („Die Tür steht offen.“, 14.11. nachts): Buchstaben blenden ruhig ein, „offen.“ schwingt wie ein Türblatt auf und bewegt sich später ab und zu leicht
const tTitle = $('#t-title');
splitLetters(tTitle);
new IntersectionObserver((es, ob) => es.forEach((e) => { if (e.isIntersecting) { tTitle.classList.add('open'); ob.disconnect(); } }), { threshold: 0.4 }).observe(tTitle);

// ---------- Tür-Bühne „Hineingehen“ (19.11.2026, Go Kai „3a“; löst Tür C vom 18.11. ab) ----------
// Kai: „dass man wie in die Tür rein geht und dort dann erst die Buttons für Termin oder Details stehen“. Kapitel 05 beginnt mit
// einer klebenden Bühne (#doorTrack, 230 % Bildhöhe): Überschrift oben, darunter groß die Tür. Der Scrollweg p (0 … 1) öffnet sie
// und führt hindurch (Baustein src/tuer/buehne.js, gezeichnet auf dem Grafikchip); drinnen blenden die zwei Knöpfe ein.
// Klasse an <html>: door-walk = Bühne mit Weg. Ohne sie (ohne JavaScript, Software-Grafik, „Bewegung anhalten/reduzieren“,
// kein Grafikchip) stehen Überschrift und Knöpfe einfach da. Die Zeichenfläche ist nur in der Nähe der Bühne eingeschaltet
// (Go „1b“: sie lag am 18.11. dauernd bildschirmgroß über der Seite). Prüfhilfe: window.__door.
const doorStage = (() => {
  const doorGate = riegel(3.6); // Staub sammelt sich zur Tür: Auslöser beim Hereinkommen, Ablauf über die Zeit
  const cv = $('#cStage'), glowEl = $('#cGlow'), track = $('#doorTrack'), inEl = $('#doorIn');
  if (!cv || !track || !inEl) return null;
  const sticky = $('.door-sticky', track), cue = $('.door-cue', track), H = document.documentElement;
  const still = () => paused || reduced || H.classList.contains('no-gl');
  let st = null, failed = false, last = performance.now(), on = false, walk = null, lastClip = '', lastG = -1, lastCue = -1;
  const setWalk = (v) => { if (v === walk) return; walk = v; H.classList.toggle('door-walk', v); if (!v) { inEl.style.opacity = ''; inEl.style.transform = ''; inEl.classList.add('is-on'); lastG = -1; } chapDirty(); };
  const off = () => { if (!on) return; on = false; cv.classList.remove('on'); glowEl.classList.remove('on'); if (st) st.clear(); };
  // Tastatur: Fokus auf einem noch verborgenen Knopf → ans Ende der Bühne (Tür offen, Knöpfe da)
  const hit = $('#doorHit'), DOOR_SEK = 3.8;
  let opened = false, doorP = 0;
  const open = () => { if (opened) return; opened = true; if (hit) hit.hidden = true; };
  if (hit) hit.addEventListener('click', open);
  inEl.addEventListener('focusin', () => { if (walk && !opened) { open(); doorP = 1; } });
  setWalk(!still());
  frameFns.push((now) => {
    const dt = Math.min(0.1, (now - last) / 1000); last = now;
    setWalk(!still() && !failed);
    if (!walk) { off(); return; }
    const r = track.getBoundingClientRect(), vh = innerHeight;
    // (Höhe prüfen: ist der Inhalt ausgeblendet – Messbilder des Prüfstands –, hat die Bühne keine Höhe)
    if (!opened && r.height > vh * 0.5 && r.bottom < vh * 0.3) { opened = true; doorP = 1; hit && (hit.hidden = true); }
    if (r.top > vh * 1.5 || r.bottom < -vh * 0.3) { off(); return; } // weit weg: Zeichenfläche aus, nichts messen
    if (!st) { st = initDoorStage({ cv, glow: glowEl, isStill: still }); if (!st) { failed = true; return; } }
    if (st.dead) { failed = true; return; }
    if (!on) { on = true; cv.classList.add('on'); glowEl.classList.add('on'); }
    // die Bühne endet an den Kanten ihres Abschnitts – nie über dem Text davor oder danach
    const clip = `inset(${Math.max(0, Math.round(r.top))}px 0 ${Math.max(0, Math.round(vh - r.bottom))}px 0)`;
    if (clip !== lastClip) { lastClip = clip; cv.style.clipPath = clip; glowEl.style.clipPath = clip; }
    const sr = sticky.getBoundingClientRect(), hb = tTitle.getBoundingClientRect().bottom, desk = isDesktop();
    st.frame(dt, {
      w: cv.clientWidth, h: vh, desk, cx: cv.clientWidth / 2,
      areaTop: hb + (desk ? 8 : 18), areaBot: sr.bottom - (desk ? 44 : 30), fadeY: hb - 8,
      fWant: weich(doorGate(smooth(vh * 0.95, vh * 0.12, r.top), dt)), // Tür entsteht, sobald die Bühne hereinkommt – über die Zeit (20.11.), nicht am Scrollweg
      // 20.11. (Kai im Arbeitsblatt: „Gerne auf die Tür drücken, bzw. klicken“): die Tür geht auf Antippen/Klick auf und man geht über die
      // Zeit hindurch (vorher am Scrollweg). Wer ohne Antippen weiterscrollt, findet sie beim Zurückkommen offen (Knöpfe erreichbar).
      pWant: weich(doorP = opened ? Math.min(1, doorP + dt / DOOR_SEK) : 0),
    });
    const g = smooth(DOOR_PLAN.gate, DOOR_PLAN.gate + 0.12, st.p);
    if (Math.abs(g - lastG) > 0.004 || (g === 0) !== (lastG === 0) || (g === 1) !== (lastG === 1)) {
      lastG = g; inEl.style.opacity = g.toFixed(3); inEl.style.transform = `translateY(${((1 - g) * 14).toFixed(1)}px)`; inEl.classList.toggle('is-on', g > 0.5);
    }
    const c = st.f > 0.9 ? 1 - smooth(0.02, 0.1, st.p) : 0;
    if (cue && Math.abs(c - lastCue) > 0.01) { lastCue = c; cue.style.opacity = c.toFixed(2); }
  });
  return { get st() { return st; }, get walk() { return walk; }, get on() { return on; }, open, get opened() { return opened; }, reset() { opened = false; doorP = 0; if (hit) hit.hidden = false; } }; // reset: Prüfhilfe (Tür wieder zu)
})();
window.__door = doorStage;
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
  if (ONE_ROOF) roofline.parentNode.style.opacity = (1 - lh.roofK()).toFixed(3);
  roofLetters.forEach((l, i) => { const lp = clamp(k * 1.7 - i * 0.03); l.style.transform = lp >= 1 ? '' : `translateY(${(-(1 - lp) * 0.45).toFixed(3)}em)`; l.style.opacity = (0.25 + 0.75 * lp).toFixed(3); });
  if (!isDesktop()) {
    const now = performance.now();
    ixRows.forEach((r) => { const b = r.li.getBoundingClientRect(); const c = b.top + b.height / 2; if (Math.abs(c - vh * 0.5) < b.height * 0.5 && now - r.last > 2500) { r.last = now; r.fire(); } });
  }
}

const roofHead = $('#allTitle');

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
// ---------- Stoßwellen-Therapie (Kapitel 04, nach der Manuthera): Linien-Bühne ohne WebGL, Baustein ../stosswelle ----------
const swSec = $('#stosswelle');
const sw = initStosswelle({ root: swSec, isPaused: () => paused, reduced });
// ---------- Leistungen: Partikel-Bühne mit Motiv je Leistung (Haus tritt hier zurück) ----------
const servList = $('.roof-list'), servName = $('#servName');
// Aufbau erst, wenn „Alle Leistungen“ in Reichweite kommt (A1)
let serv = null;
glWait($('#glServ'));
// echte Knochen für die anatomischen Motive (20.11.): eigene Datei neben der Seite; lädt sie nicht (file://, Funkloch), bleiben die gerechneten Motive
const loadAnat = () => fetch(HOP_ASSETS + 'motive-anatomie.bin').then((r) => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.arrayBuffer(); })
  .then((buf) => { const A = {}; for (const q of decodeAnat(new Uint8Array(buf)).parts) A[q.id] = q; return A; }).catch((e) => { console.warn('Anatomie der Motive nicht geladen – gerechnete Motive:', e && e.message); return null; });
whenNear(roofHead, () => loadAnat().then((anat) => runSliced(initServicesGen($('#glServ'), { anat, isPaused: () => paused, onShow: (i, name) => { if (servName) servName.textContent = name; } }))).then((m) => { serv = m; if (!m) document.documentElement.classList.add('no-gl-serv'); glReady($('#glServ')); }));
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

// dasselbe für den Stoßwellen-Block (liegt zwischen Manuthera und Leistungen)
let swK = 0;
function swVisible() {
  if (!swSec) return 0;
  const r = swSec.getBoundingClientRect(), vh = VH;
  return smooth(0.15, 0.55, clamp((Math.min(r.bottom, vh) - Math.max(r.top, 0)) / vh));
}

// ---------- Schleife ----------
const timer = new THREE.Timer(); // (THREE.Clock ist veraltet)
const top = $('#top');
// Handy: im Stillstand nur jedes zweite Bild rendern (Akku), beim Scrollen und im Hero volle Rate
let lastInput = 0, frameN = 0;
['scroll', 'touchmove', 'pointermove'].forEach((ev) => addEventListener(ev, () => (lastInput = performance.now()), { passive: true }));
// Taktgeber-Reserve: iOS hält requestAnimationFrame in eingebetteten Vorschau-Rahmen an, solange niemand
// berührt. Dann übernimmt ein Zeitgeber (≈ 30 Bilder/s), damit die Seite auch im Stillstand lebt.
let lastTick = performance.now(), viaWatchdog = false;
setInterval(() => {
  if (document.hidden || performance.now() - lastTick < 120) return;
  viaWatchdog = true; runFrame(performance.now()); viaWatchdog = false;
}, 33);
// Qualitätsstufen (13.11., T2): bleibt ein Gerät dauerhaft unter ~22 Bildern/s (zwei Messfenster von je 3 s in Folge), sinkt die
// Auflösung der Hauptbühne – Stufe 1: 1×, Stufe 2: 0,75×. Schwelle bewusst tief: 30 B/s (iPhone im Stromsparmodus) lösen nichts aus.
// Zurück geht es nicht (kein Pendeln). Stand: <html data-q>. Im Prüfmodus ?gl=1 aus.
const QW = renderer && glQ !== '1' ? { lvl: 0, sum: 0, n: 0, bad: false, slow: 0 } : null;
function qualityWatch(gap) {
  if (document.hidden || gap > 1000) QW.bad = true; // Tabwechsel/Hänger: Fenster zählt nicht
  QW.sum += gap; QW.n++;
  if (QW.sum < 3000) return;
  const avg = QW.sum / QW.n, bad = QW.bad;
  QW.sum = QW.n = 0; QW.bad = false;
  if (bad) return;
  QW.slow = avg > 45 ? QW.slow + 1 : 0;
  if (QW.slow < 2 || QW.lvl >= 2) return;
  QW.lvl++; QW.slow = 0;
  const pr = QW.lvl === 1 ? 1 : 0.75;
  if (renderer.getPixelRatio() > pr) { renderer.setPixelRatio(pr); glDirty = true; layout(); }
  document.documentElement.dataset.q = QW.lvl;
}
const PTRV = [0, 0, 0.1, 0];
function tick() {
  const nowT = performance.now(), gap = nowT - lastTick;
  lastTick = nowT;
  frameN++;
  if (sheetOpen && !isDesktop()) return; // Handy: Termin-Blatt deckt die Szene ab → nicht rendern (Akku)
  if (FX.rest) return; // Film „Bandscheibenvorfall“ deckt die Bühne: eigene Bühne, die Seite ruht (Akku)
  if (lh.egoOpen()) return; // Rundgang aus Augenhöhe offen: der Dialog deckt alles ab, die Seite ruht (Akku)
  if (QW && !viaWatchdog) qualityWatch(gap); // nur messen, solange die Hauptbühne selbst zeichnet (nicht hinter Termin-Blatt/Augenhöhen-Rundgang)
  if (!viaWatchdog && !isDesktop() && morphNow >= 0.6 && performance.now() - lastInput > 1500 && frameN % 2) return; // Hero (Figur sichtbar): immer volle Rate (8.11., Option C)
  timer.update();
  const dt = Math.min(timer.getDelta(), 0.1); // 0,1 statt 0,05 (8.11.): Zeit läuft auch bei 15 B/s (Stromsparmodus) richtig
  uniforms.uTime.value += paused ? 0 : dt * CALM;
  // Form 0: Lage, Atem, Ruhe und Wiegen vom Kapitel „Von Kopf bis Fuß“ (gleiche Werte → Übergabe ohne Sprung)
  bodyFit();
  uniforms.uCalm.value = kf.calm(); uniforms.uBreath.value = kf.breath(); uniforms.uBodyRot.value = kf.sway();
  const tm = targetMorph();
  if (!isDesktop()) logoPlace();
  // Formwechsel über die Zeit (FORM_SEK je Form; liegen mehrere Formen dazwischen – Sprung über Kapitel – entsprechend schneller)
  tickDt = dt;
  if (!morphInit || reduced || paused) { morphNow = tm; morphInit = true; }
  else { const d = tm - morphNow, st = dt / FORM_SEK * Math.max(1, Math.abs(d)); morphNow = Math.abs(d) <= st ? tm : morphNow + Math.sign(d) * st; }
  uniforms.uMorph.value = morphNow;
  uniforms.uVeil.value = morphNow > 2.02 && morphNow < 3 && (isDesktop() ? pcScan() : scanOn()) ? 1 : 0; // Scanner (Handy und PC): Weg Wirbelsäule <-> Dach unsichtbar („1a“)
  uniforms.uKeep.value = isDesktop() ? 0 : 1; // Handy/Tablet: Streifen laufen hinter den HOP-Kreisen weiter
  // 20.11.: der Staub läuft jetzt über die Zeit – wer schnell weiterwischt, hat die Überschrift von Kapitel 04 schon im Lesebereich,
  // während er noch unterwegs ist. Dann wird er dünner und verschwindet (nur die Menge hängt am Scrollen, nicht der Ablauf).
  const dustFree = 1 - smooth(VH * 0.82, VH * 0.5, dTitleEl.getBoundingClientRect().top);
  uniforms.uDust.value = (isDesktop() ? 0.45 : 1) * (morphNow > 2.02 && morphNow < 2.98 ? Math.max(0.011, dustFree) : 1); // feiner Staub statt unsichtbarer Wanderung (Kai 18.11.: „verstreute Übergänge wieder“; PC: kleinerer Anteil, dort sind es mehr Punkte)
  logoNow = targetLogo(dt);
  uniforms.uLogo.value = logoNow < 0.002 ? 0 : logoNow;
  manuK = manuVisible();
  swK = swVisible();
  fxTick(dt);
  updateAxis(dt);
  roofPlace();
  uniforms.uRoofA.value = 1 - lh.roofK();
  { // Kamera: Wirbelsäule > Übersicht
    const want = tourWant || axisWant || OVERVIEW, k = reduced ? 1 : 1 - Math.exp(-dt * 2.2);
    cam.pos.lerp(want.pos, k); cam.target.lerp(want.target, k);
  }
  // Partikel abdunkeln, sobald Text darüber liegt (Kontakt immer; mobil auch hinter den Bewegungslinien)
  const vh = VH;
  const doorTop = door.getBoundingClientRect().top;
  let dim = isDesktop() ? smooth(vh * 0.95, vh * 0.1, doorTop) : smooth(vh * 1.6, vh * 0.7, doorTop); // 16.11.: Ausblenden zur Tür langsamer
  const dimMax = 1; // Kontakt: Partikel blenden ganz aus (Handy und PC)
  if (!isDesktop()) {
    if (morphNow > 0.3 && morphNow < 1.6) dim = Math.max(dim, 0.55 * (1 - logoNow)); // Bewegungslinien leise hinter Text, die HOP-Kreise zur Hausordnung in voller Helligkeit
  }
  if (isDesktop() && morphNow > 0.12 && morphNow < 0.9) dim = Math.max(dim, 0.4 * Math.sin(Math.PI * (morphNow - 0.12) / 0.78));
  dim = Math.max(dim, manuK, swK, listK); // Manuthera-Bühne, Stoßwelle und Leistungen: Partikel-Hintergrund blendet ganz aus
  if (licht && lichtK > 0) dim = Math.max(dim, lichtK); // K1: Partikel weichen dem Sonnenstaub
  if (FX.on && !FX.hand) dim = 1; // Film ohne Übergabe (aus „Alle Leistungen“, ohne Scanner): Partikel weichen dem Film
  uniforms.uAlpha.value += ((1 - dim * dimMax) - uniforms.uAlpha.value) * 0.1;
  // Kapitel 01: die Hauptbühne bleibt aus, bis die eigene Bühne von „Von Kopf bis Fuß“ am Ende übergibt (kf.handK 0 → 1)
  { const hk = kf.handK(); if (hk < 1) uniforms.uAlpha.value = Math.min(1 - dim * dimMax, hk); }
  if (!isDesktop()) {
    // Handy: Partikel ohne Verzögerung ausblenden, sobald die Manuthera-Bühne kommt – sonst laufen beim schnellen Wischen Bilder ineinander
    const out = Math.max(manuK, swK);
    if (uniforms.uAlpha.value > 1 - out) uniforms.uAlpha.value = 1 - out;
  }
  uniforms.uSize.value = isDesktop() ? 1 : 1.1;
  // Zeiger (Maus/Finger) für alle Bühnen: einmal je Bild nachführen, Hauptbühne in ihrer Zeichenfläche (fest am Fenster)
  pointer.update(dt);
  pointer.ndc({ left: 0, top: 0, width: VW, height: GLH }, PTRV, isDesktop() ? 58 : 50); uniforms.uPtr.value.fromArray(PTRV);
  uniforms.uSpread.value = reduced ? 0 : isDesktop() ? 0.32 : 0.28;
  livingHeadlines();
  uniforms.uFadeMid.value = isDesktop() ? 0.62 : 0.7;

  // Manifest
  const sr = statement.getBoundingClientRect();
  const sp = clamp((VH * 0.85 - sr.top) / (sr.height + VH * 0.35));
  const lit = Math.floor(sp * words.length * 1.1);
  words.forEach((w, i) => w.classList.toggle('lit', reduced || i < lit));

  // Hausordnung
  const rr = rules.getBoundingClientRect();
  if (licht) { const k = smooth(VH * 1.4, VH * 0.5, doorTop); setLicht(k); if (dust) dust.visible = k > 0.01; } // ?licht=1 hängt seit 14.11. nachts an der Tür (die Hausordnung steht vorn)
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
  // Leiste (14.11. nachts): Einträge = Kapitel in Seitenreihenfolge (01, 02, §, 03, 04, 05); aktiv ist das Kapitel, das die Bildmitte erreicht hat
  let navIdx = 0;
  for (let i = 1; i < chapTop.length; i++) if (chapTop[i] - scrollY < VH * 0.5) navIdx = i;
  if (navIdx !== chapShown) {
    chapShown = navIdx;
    navLinks.forEach((a, k) => a.classList.toggle('on', k === navIdx));
    chapNow.innerHTML = navLinks[navIdx].innerHTML;
  }

  camera.position.copy(cam.pos); camera.lookAt(cam.target);
  // 13.11. (T1): ausgeblendete Partikel nicht mehr zeichnen; ist gar nichts zu sehen, ruht die Hauptbühne nach einem leeren Bild
  points.visible = uniforms.uAlpha.value > 0.004;
  // 14.11. (N1): Kap. 04 – steht die Form „Dachlinie“ und ist sie nach dem Zeichnen des Linienhauses vergangen, gibt es nichts zu sehen
  if (Math.abs(morphNow - 3) < 0.02 && uniforms.uRoofA.value < 0.004) points.visible = false;
  if (FX.cover) { points.visible = false; spineGroup.visible = false; sil.visible = false; } // der Film deckt alles: noch ein leeres Bild, dann ruht die Bühne
  const anyVis = points.visible || spineGroup.visible || sil.visible || !!(dust && dust.visible);
  if (renderer && !document.hidden && (anyVis || glDirty)) { renderer.render(scene, camera); glDirty = anyVis; }
  if (manu && manu.st.visible && !document.hidden) { manu.update(0, dt); manu.st.renderer.render(manu.st.scene, manu.st.camera); }
  if (sw && !document.hidden) sw.update();
  if (!document.hidden) updateServices(dt);
  updateHints(dt);
}
// ---------- Kapitel 01 „Von Kopf bis Fuß“ (Auftrag K, Go Kai 16.11.2026) ----------
// eigene Bühne (Baustein), läuft vor tick im selben Bildtakt; Sprünge (Striche rechts, Pille „Weiter“) gleiten über Lenis
kf = initKopfFuss({ root: $('#start'), isPaused: () => paused, reduced, handover: true,
  scrollTo: (y, sm) => (lenis ? lenis.scrollTo(y, sm ? { duration: 1.6 } : { immediate: true }) : window.scrollTo({ top: y, behavior: sm ? 'smooth' : 'auto' })) });
window.__kf = kf; // Prüfhilfe: __kf.state(), __kf.go(u)
// Form 0 der Hauptwolke = dieselben Punkte wie die Figur in Kapitel 01 (Übergabe deckungsgleich, gleicher Punktabstand)
{ const cl = kf.cloud();
  if (cl && renderer) {
    figureForm(N, cl, BODY_SCALE, body.pos, body.f0, body.heat);
    uniforms.uTilt.value = cl.tilt;
    ['position', 'aF0', 'aHeat'].forEach((k) => { geo.attributes[k].needsUpdate = true; });
    silFill();
    if (!morphSet) { geo.attributes.pos2.array.set(body.pos); geo.attributes.pos2.needsUpdate = true; } // bis die Wirbelsäule gerechnet ist
  } }
frameFns.push((now) => kf.update(now));
frameFns.push(tick);

// ---------- Messanzeige (19.11.2026, Go Kai „1a“): nur mit ?takt=1 in der Adresse ----------
// Anlass: Kai meldet, dass die Partikel „stottern/haken“; im Container (ohne Grafikchip) ist das nicht messbar. Die Anzeige
// unten links zeigt auf SEINEM Gerät: Bilder je Sekunde, längste Pause, wer den Takt gibt (normal = requestAnimationFrame,
// Reserve = Zeitgeber, weil das Gerät den normalen Takt anhält), Auflösung, Qualitätsstufe. Zwei Schalter zum Gegenprüfen:
// „Leiste klar“ nimmt den Weichzeichner der Kopfleiste weg, „Auflösung 1×“ senkt die Auflösung der Hauptbühne.
if (new URLSearchParams(location.search).get('takt') === '1') {
  const box = document.createElement('div'); box.className = 'takt';
  box.innerHTML = '<pre></pre><div><button type="button" data-t="blur">Leiste klar</button><button type="button" data-t="res">Auflösung 1×</button></div>';
  document.body.appendChild(box);
  const out = box.firstChild, gaps = [], H = document.documentElement;
  let lastF = 0, wd = 0, n = 0, lastShow = 0;
  box.addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.t === 'blur') b.classList.toggle('on', H.classList.toggle('takt-klar'));
    if (b.dataset.t === 'res' && renderer) { const on = !b.classList.contains('on'); b.classList.toggle('on', on); renderer.setPixelRatio(on ? 1 : Math.min(devicePixelRatio || 1, isDesktop() ? 1.6 : 1.4)); glDirty = true; layout(); }
  });
  frameFns.push((now) => {
    if (lastF) { gaps.push(now - lastF); if (gaps.length > 180) gaps.shift(); }
    lastF = now; n++; if (viaWatchdog) wd++;
    if (now - lastShow < 500 || gaps.length < 5) return;
    lastShow = now;
    const last60 = gaps.slice(-60), avg = last60.reduce((a, b) => a + b, 0) / last60.length, worst = Math.max(...gaps);
    out.textContent = `Bilder/s  ${(1000 / avg).toFixed(0)}\nlängste Pause  ${worst.toFixed(0)} ms\nTakt  ${wd / n > 0.5 ? 'Reserve' : wd ? 'normal + Reserve' : 'normal'} (${Math.round(wd / n * 100)} % Reserve)\nAuflösung  ${renderer ? renderer.getPixelRatio().toFixed(2) : '–'} von ${(devicePixelRatio || 1).toFixed(2)}\nQualität  ${H.dataset.q || 0} · Punkte ${N}\nFenster  ${VW}×${VH}`;
    wd = 0; n = 0;
  });
}
requestAnimationFrame(function loop(now) { requestAnimationFrame(loop); runFrame(now); });


// ---------- Text ruhig (Feinschliff 17.11.2026): eine Einblend-Art für alle Texte ohne eigenes Spiel ----------
// Kennzeile, Einleitung, Zitat und die Überschriften von Manuthera/Stoßwelle kommen Zeile für Zeile von unten (CSS .fein);
// die lebenden Überschriften (Achse, Dach, Tür), das Manifest und Kapitel 01 behalten ihr eigenes Spiel.
if (reduced === false && 'IntersectionObserver' in window) {
  const els = $$('main .kicker, main .lead, main .sign, main h2.manu-h, main h2.sw-h').filter((e) => e.closest('.kf') === null);
  const seen = new Map();
  const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('fein-in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -6% 0px', threshold: 0.15 });
  els.forEach((e) => { const n = seen.get(e.parentNode) || 0; seen.set(e.parentNode, n + 1); e.style.setProperty('--fi', n); e.classList.add('fein'); io.observe(e); });
}

// ---------- Klickbares kenntlich machen (Go 1.11.2026, Variante A) ----------
// Stufe 1: Termin-Knöpfe schlagen ab und zu wie ein Herz (nur in Ruhe, immer nur einer, Abstand wächst).
// Stufe 2: Knopf-Gruppen werden beim ersten Hereinkommen einmal „gescannt“; Leistungen haben ein „+“.
// Stufe 3: Bilder zum Anfassen zeigen nach kurzer Zeit einen Wisch-Hinweis, bis man sie berührt.
// Alles ruht bei „Bewegung anhalten“ und „Bewegung reduzieren“.
const inView = (el) => { if (!el) return false; const r = el.getBoundingClientRect(); return r.width > 0 && r.bottom > 0 && r.top < VH && r.right > 0 && r.left < VW; };
{
  const beatBtns = [$('.kf-end .btn:not(.btn-ghost)'), $('.door .btn:not(.btn-ghost)'), $('.top .btn-small')].filter(Boolean);
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
  const groups = [$('.segnav'), $('#manuModes'), $('#swModes'), $('#index')].filter(Boolean);
  // #index: nur die Einträge, nicht der Film-Link im Text (Auftrag Z)
  groups.forEach((g) => $$(g.id === 'index' ? 'li > button' : 'button', g).forEach((b, i) => { b.classList.add('sheen'); b.style.setProperty('--si', i); }));
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
const hintManu = manuSec ? mkHint(finePointer ? 'Ziehen zum Drehen' : 'Seitlich wischen', $('.manu-stage')) : null;
[hintManu].forEach((h) => h && h.classList.add('th-pill')); // 6A (7.11.): auch am PC dunkle Pille (vorher nur Touch)
let manuUsed = false, manuT = 0;
// Hinweis gilt erst als erledigt, wenn wirklich seitlich gewischt/gezogen wurde (nicht schon beim Antippen oder Scrollen)
{ let mx = null, my = 0; const gm = $('#glManu');
  gm?.addEventListener('pointerdown', (e) => { mx = e.clientX; my = e.clientY; });
  gm?.addEventListener('pointermove', (e) => { if (mx === null) return; const dx = e.clientX - mx, dy = e.clientY - my; if (Math.abs(dx) > 30 && Math.abs(dx) > Math.abs(dy) * 1.3) { manuUsed = true; mx = null; } });
  ['pointerup', 'pointercancel', 'pointerleave'].forEach((t) => gm?.addEventListener(t, () => (mx = null))); }
manuBtns.forEach((b) => b.addEventListener('click', () => (manuUsed = true)));
const t0Hints = performance.now();
function updateHints(dt) {
  const now = performance.now(), desk = isDesktop();
  // Manuthera-Liege
  if (hintManu) { manuT = manuK > 0.8 ? manuT + dt : 0; hintManu.classList.toggle('on', !manuUsed && manuT > 1.5); }
}

// Intro
// (im ersten Frame, vor dem ersten Bild: gsap liest berechnete Stile – so nur eine Stil-Berechnung, A1)
if (paused) uniforms.uIntro.value = 1; // angehalten: kein Einflug (Durchsicht 7.11.)
if (!reduced) requestAnimationFrame(() => {
  if (!paused) tween(uniforms.uIntro, 'value', 1, 3.2, { ease: easeExpo, delay: 0.1 });
  // Einblenden: Kopfleiste wie bisher (Endzustand inline wie früher mit gsap), Starttext von Kapitel 01 nur über die Deckkraft
  // (seine Lage setzt das CSS des Bausteins, kapitel.js führt die Deckkraft beim Scrollen)
  const tb = $('.top'); if (tb && tb.animate) { tb.animate([{ opacity: 0, transform: 'translate(0px, 20px)' }, { opacity: 1, transform: 'translate(0px, 0px)' }], { duration: 1100, delay: 1250, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'backwards' }); tb.style.transform = 'translate(0px, 0px)'; tb.style.opacity = '1'; }
  $$('.kf-hero > *').forEach((el, i) => el.animate && el.animate([{ opacity: 0, translate: '0 20px' }, { opacity: 1, translate: '0 0' }], { duration: 1200, delay: 300 + i * 120, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'backwards' }));
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
      // Prüfung 7.11. P1: Fremdseite im Rahmen einsperren (keine Umleitung der Hauptseite, kein Plugin/Download); Skripte, Formular, Speicher (reCAPTCHA/Cookie) und Popups bleiben erlaubt.
      // Zum Vergleich ohne Käfig: Adresse mit ?sandbox=0 öffnen.
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

// Film „Bandscheibenvorfall“ auf der Hauptbühne – „Fokus“ (Auftrag Kai 14.11.2026 nachts; vorher ein Blatt wie das Termin-Blatt):
// Knopf in der Karte L4–L5 (PC-Karte, am Handy zusätzlich in der Scanner-Karte) →
//   1. die Wirbelsäule löst sich außerhalb des Segments L4–L5 in Partikel auf (Shader uFoc), Texte und Aufzug blenden aus,
//   2. das Segment fährt heran und dreht sich genau in die Lage, in der der Film beginnt (fxPose/fxRot aus film.view()),
//   3. eine Scan-Linie läuft von unten nach oben: darunter steht schon der Film (eigene Bühne, per Maske freigegeben), darüber noch die Wirbelsäule,
//   4. danach deckt der Film alles, die Hauptbühne ruht (FX.rest). Weiter: Knopf „Weiter“, ×, Esc oder Scrollen/Wischen – alles läuft rückwärts.
// Ohne Übergabe (Link in „Alle Leistungen“, Handy quer, ohne WebGL, „Bewegung anhalten/reduzieren“): die Seite blendet aus, der Film ein.
// Der Baustein film.js wird erst beim ersten Öffnen aufgebaut (Rechnung in Zeitscheiben); ohne WebGL fünf Standbilder.
const fxInstant = () => reduced || paused;
const vfDlg = document.getElementById('vorfallSheet');
const _fc = new V3(), _fw = new V3();
const fxLv = (id) => det && det.levels.find((l) => l.id === id);
function fxBand() { // Segment L4–L5 in den Einheiten der Wirbelsäule: Höhenband (Rückenmark, Kern), Mitte L4 (Bandscheibe darüber geht)
  const a = fxLv('L4'), b = fxLv('L5');
  if (!a || !b) return false;
  sU.uFocY.value.set((b.center.y - b.h * 0.62 - CY) * SC, (a.center.y + a.h * 0.62 - CY) * SC, (a.center.y - CY) * SC);
  sU.uFocZone.value = ZONES.indexOf('l45');
  // Lage wie im Film: Achse L5→L4, Kippwinkel bis zur Achse des Films, halber Zusatzabstand (Puls rückt die Wirbel auseinander)
  const ax = _fw.set(a.center.x - b.center.x, a.center.y - b.center.y, a.center.z - b.center.z), len = ax.length();
  ax.divideScalar(len || 1);
  sU.uFocS.value.set(ax.x, ax.y, ax.z, 0); sU.uFocD.value = (VF_SEG.disc / 2) * SC;
  sU.uFocT.value.set((a.center.x + b.center.x) / 2 * SC, ((a.center.y + b.center.y) / 2 - CY) * SC, (a.center.z + b.center.z) / 2 * SC, 0);
  FX.tilt = clamp(VF_SEG.tilt - Math.atan2(ax.z, ax.y), -0.9, 0.9); FX.gap = clamp((len - VF_SEG.len) / 2, 0, 0.9) * SC;
  return true;
}
function fxView() { // Lage des Films: vor dem Start und während der Scan-Linie; danach hält die Wirbelsäule die Startlage (Rückweg)
  const f = VF.film, st = f && f.state ? f.state() : null;
  return f && f.view ? f.view(FX.started && !FX.cover && st ? Math.min(st.t, 2.4) : 0) : null;
}
function fxRot() { // Blickwinkel des Films (Azimut) → Drehung der Wirbelsäule
  const v = FX.v; if (!v) return;
  const want = -THREE.MathUtils.degToRad(v.az), r0 = uniforms.uSpineRot.value;
  uniforms.uSpineRot.value = r0 + (want + Math.PI * 2 * Math.round((r0 - want) / (Math.PI * 2)) - r0) * FX.e;
}
function fxPose(X) { // Mitte zwischen L4 und L5 wandert auf die Bildschirmlage des Films, Maßstab wie im Film (Bildpunkte je cm)
  const v = FX.v, a = fxLv('L4'), b = fxLv('L5'); if (!v || !a || !b) return;
  _fc.set((a.center.x + b.center.x) / 2 * SC, ((a.center.y + b.center.y) / 2 - CY) * SC, (a.center.z + b.center.z) / 2 * SC).applyAxisAngle(_Y, uniforms.uSpineRot.value);
  const wT = (v.ppc * 8.197) / (GLH * SC), w = X.w * Math.pow(wT / X.w, FX.e);
  const c = toPx(_fw.copy(_fc).multiplyScalar(X.w).add(_zw.set(X.x, X.y, 0)));
  screenToWorld(c[0] + (v.x - c[0]) * FX.e, c[1] + (v.y - c[1]) * FX.e, _fc.z * w, _fw);
  X.set(_fw.x - _fc.x * w, _fw.y - _fc.y * w, 0, w);
}
function fxMask(y) { // Film-Bühne nur unterhalb der Scan-Linie zeigen (y in Bildpunkten der Bühne; null = ganz, 'off' = gar nicht)
  const cv = VF.film && VF.film.canvas; if (!cv) return;
  const g = y === null ? '' : y === 'off' ? 'linear-gradient(transparent,transparent)' : `linear-gradient(to bottom,transparent ${(y - 10).toFixed(1)}px,#000 ${(y + 10).toFixed(1)}px)`;
  if (cv.dataset.mask === g) return;
  cv.dataset.mask = g; cv.style.webkitMaskImage = g; cv.style.maskImage = g;
}
function fxCover() { FX.cover = true; FX.coverN = 0; fxMask(null); }
function fxTick(dt) {
  if (!FX.on && FX.k <= 0) return;
  const inst = fxInstant();
  FX.k = inst ? (FX.on ? 1 : 0) : clamp(FX.k + (FX.on ? dt / 1.5 : -dt / 1.1));
  FX.e = easeIO(FX.k);
  sU.uFoc.value = FX.hand ? smooth(0, 0.82, FX.k) : 0;
  sU.uFocT.value.w = FX.hand ? FX.tilt * FX.e : 0; sU.uFocS.value.w = FX.hand ? FX.gap * FX.e : 0;
  if (!FX.on) { if (FX.k <= 0) { FX.hand = false; sU.uFoc.value = 0; } return; }
  if (FX.cover) { if (++FX.coverN > 2) FX.rest = true; return; }
  if (!FX.hand) { if (inst || performance.now() - FX.t0 > 520) fxCover(); return; }
  FX.v = fxView();
  const f = VF.film, st = f.state();
  if (!FX.started) { if (FX.k >= 1 && st && st.ready) { f.seek(0); f.play(); FX.started = true; vfDlg.classList.add('is-run'); } return; }
  if (!st || st.t > 2.35 || !FX.v || FX.v.scanY === null) fxCover(); // Scan ist durch: der Film steht allein
  else fxMask(FX.v.scanY - FX.v.top);
}
{
  const dlg = vfDlg;
  if (dlg && typeof dlg.showModal === 'function') {
    const el = document.documentElement, xBtn = document.getElementById('vfClose'), more = document.getElementById('vfMore'), infoBtn = document.getElementById('vfInfo');
    // „Kurz erklärt“: Textkarten, Warnsatz, Quellen – öffnet von selbst am Filmende; von Hand geöffnet hält der Film solange an
    let moreWas = false;
    const setMore = (v, byHand) => {
      more.hidden = !v; infoBtn.setAttribute('aria-expanded', String(v)); dlg.classList.toggle('has-more', v);
      const st = VF.film && VF.film.state ? VF.film.state() : null;
      if (v && byHand) { moreWas = !!(st && st.playing); VF.film.pause(); more.scrollTop = 0; }
      else if (!v && byHand && moreWas) { moreWas = false; VF.film.play(); }
      else if (!v) moreWas = false;
    };
    const open = (e) => {
      e.preventDefault();
      if (dlg.open) return;
      VF.opener = e.currentTarget;
      dlg.classList.remove('is-leaving');
      dlg.showModal();
      if (!VF.film) VF.film = initVorfall({ root: document.getElementById('vorfall'), isPaused: () => paused, auto: false, onEnd: () => { if (FX.on) setMore(true, false); } }) || { pause() {}, play() {}, seek() {}, state: () => null };
      const st = VF.film.state(), inst = fxInstant();
      // Übergabe nur, wenn die Wirbelsäule im Scanner am Abschnitt L4–L5 steht (sonst gibt es nichts aufzulösen)
      FX.hand = !inst && !!(st && st.gl) && !!renderer && !!det && (isDesktop() ? pcScan() : scanOn()) && SCAN.seg === SSTOPS.findIndex((q) => q.zone === 'l45') && spineGroup.visible && ZM.k > 0.5 && fxBand();
      FX.on = true; FX.started = false; FX.cover = false; FX.coverN = 0; FX.rest = false; FX.t0 = performance.now(); FX.y0 = scrollY; FX.acc = 0; FX.v = null;
      dlg.classList.toggle('is-hand', FX.hand); dlg.classList.remove('is-run');
      fxMask(FX.hand ? 'off' : null);
      el.classList.add('vf-focus', 'vf-fx');
      setMore(false, false);
      requestAnimationFrame(() => requestAnimationFrame(() => { if (FX.on) dlg.classList.add('is-in'); }));
      xBtn.focus({ preventScroll: true });
      // ohne Übergabe startet der Film, sobald er gebaut ist (läuft dort weiter, wo er zuletzt stand); mit Übergabe startet ihn fxTick
      if (!FX.hand && !inst && VF.film.done) VF.film.done.then(() => { if (FX.on && !FX.hand && !fxInstant()) VF.film.play(); });
    };
    const reset = () => { FX.on = false; FX.rest = false; FX.cover = false; FX.coverN = 0; glDirty = true; VF.film.pause(); el.classList.remove('vf-focus'); dlg.classList.remove('is-in'); };
    const close = () => {
      if (!FX.on) return;
      reset();
      const fin = () => { dlg.classList.remove('is-leaving'); if (dlg.open) dlg.close(); };
      if (fxInstant()) fin(); else { dlg.classList.add('is-leaving'); setTimeout(fin, 440); }
    };
    dlg.addEventListener('cancel', (e) => { e.preventDefault(); close(); }); // Esc: mit Übergang zurück
    dlg.addEventListener('close', () => {
      if (FX.on) reset();
      fxMask(null);
      setTimeout(() => { if (!FX.on) el.classList.remove('vf-fx'); }, 700);
      if (VF.opener) VF.opener.focus({ preventScroll: true });
    });
    xBtn.addEventListener('click', close);
    $$('[data-vf-next]', dlg).forEach((b) => b.addEventListener('click', close));
    infoBtn.addEventListener('click', () => setMore(more.hidden, true));
    document.getElementById('vfAgain').addEventListener('click', () => { setMore(false, false); VF.film.seek(0); VF.film.play(); });
    // Weiter durch Scrollen/Wischen (Kai): die Seite scrollt normal weiter, der Film gibt die Bühne frei. Kurz nach dem Öffnen
    // zählt Nachgleiten (Lenis) noch nicht; im Textkasten „Kurz erklärt“ und auf der Abschnitts-Leiste wird nur dort gescrollt/gezogen.
    const own = (t) => !!(t && t.closest && t.closest('.vfx-more,.vf-track'));
    addEventListener('scroll', () => {
      if (!FX.on) return;
      if (performance.now() - FX.t0 < 700) { FX.y0 = scrollY; return; }
      if (Math.abs(scrollY - FX.y0) > 36) close();
    }, { passive: true });
    dlg.addEventListener('wheel', (e) => {
      if (!FX.on || e.ctrlKey || own(e.target) || performance.now() - FX.t0 < 700) return;
      FX.acc += e.deltaY * (e.deltaMode === 1 ? 33 : e.deltaMode === 2 ? VH : 1);
      if (Math.abs(FX.acc) > 50) close();
    }, { passive: true });
    let touch = null;
    dlg.addEventListener('touchstart', (e) => { touch = e.touches.length === 1 && !own(e.target) ? { x: e.touches[0].clientX, y: e.touches[0].clientY } : null; }, { passive: true });
    dlg.addEventListener('touchmove', (e) => {
      if (!touch || !FX.on) return;
      const dx = e.touches[0].clientX - touch.x, dy = e.touches[0].clientY - touch.y;
      if (Math.abs(dy) > 64 && Math.abs(dy) > Math.abs(dx) * 1.5) { touch = null; close(); }
    }, { passive: true });
    VF.open = open; VF.close = close;
    $$('[data-vorfall]').forEach((b) => b.addEventListener('click', open));
  }
}
VF.fx = FX;
window.__vf = VF; // Prüfhilfe (Konsole): __vf.film.state(), __vf.film.seek(t), __vf.fx (Fokus), __vf.close()

// Hinweis „hochkant halten“ (Handy quer, 13.11. G4): schließen gilt bis zum Neuladen, gespeichert wird nichts
$('#turnClose')?.addEventListener('click', () => $('#turnNote')?.classList.add('gone'));
window.__hop = 1; // Start ist durchgelaufen (sonst zeigt die Seite alle Inhalte ohne Skript-Layout, siehe page.html/style.css „html:not(.js)“)
