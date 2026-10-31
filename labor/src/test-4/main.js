// Testseite 4 · „Puls · Scan“ – wie „Puls + Achse“, die Wirbelsäule bleibt aber im Partikel-Stil:
// eine Abtastlinie verdichtet die groben Partikel zu einer beleuchteten Punktwolke, dann Kamerafahrt.
// 0 Körper → 1 Bewegung → 2 Wirbelsäule (Scan) → 3 Dach → 4 HOP-Kreise
import * as THREE from 'three';
import gsap from 'gsap';
import Lenis from 'lenis';
import { bodyPoints, spinePoints, housePoints, logoPoints, spineStipple, ZONES, CURVE_W, BODY_W, BODY_H, BODY_SCALE, HOTSPOTS } from './shapes.js';
import { praxisPoints, ROOMS, EYE, P } from './praxis.js';

// „Bewegung reduzieren“: sanfter Ruhemodus – die Seite lebt langsam weiter (Atmen, Treiben, Signale),
// aber ohne Kamerafahrten, Streu-Effekte, Nachgleiten beim Scrollen und springende Buchstaben.
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const CALM = reduced ? 0.45 : 1; // Tempo der Eigenbewegung
// Knopf „Bewegung anhalten“: friert alle Eigenbewegung ein (Scrollen bleibt möglich); Wahl wird im Browser gemerkt
let paused = false;
try { paused = localStorage.getItem('hop-motion') === 'paused'; } catch (e) { /* ohne Speicher */ }
function setPaused(v) {
  paused = v;
  document.documentElement.classList.toggle('paused', v);
  const b = document.getElementById('motionBtn');
  if (b) { b.setAttribute('aria-pressed', String(v)); const l = v ? 'Bewegung fortsetzen' : 'Bewegung anhalten'; b.setAttribute('aria-label', l); b.title = l; }
  try { localStorage.setItem('hop-motion', v ? 'paused' : 'on'); } catch (e) { /* ohne Speicher */ }
}
document.getElementById('motionBtn')?.addEventListener('click', () => setPaused(!paused));
setPaused(paused);
const finePointer = matchMedia('(pointer: fine)').matches;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const smooth = (a, b, v) => { const t = clamp((v - a) / (b - a)); return t * t * (3 - 2 * t); };
const isDesktop = () => innerWidth > 920;

// ---------- Scrollen ----------
let lenis = null;
if (!reduced) {
  // ruhiges Scrollen: Mausrad langsamer, weiches Nachgleiten (Scrollbalken bleibt direkt)
  lenis = new Lenis({ lerp: 0.055, smoothWheel: true, wheelMultiplier: 0.6 });
  gsap.ticker.add((t) => lenis.raf(t * 1000));
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
try { renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false, powerPreference: 'high-performance' }); } catch (e) { /* ohne WebGL bleibt die Seite lesbar */ }
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(35, innerWidth / innerHeight, 0.1, 100);
camera.position.set(0, 0, 13);
if (renderer) {
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, isDesktop() ? 1.6 : 1.4));
  renderer.setClearColor(0x0A161B, 1);
}

// ---------- Partikel ----------
const N = isDesktop() ? 64000 : 26000;
const body = bodyPoints(N), spine = spinePoints(N), house = housePoints(N), logo = logoPoints(N);
const geo = new THREE.BufferGeometry();
geo.setAttribute('position', new THREE.BufferAttribute(body.pos, 3));
geo.setAttribute('aHeat', new THREE.BufferAttribute(body.heat, 1));
geo.setAttribute('pos2', new THREE.BufferAttribute(spine.pos, 3));
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
  uHouse: { value: 0 }, uIntro: { value: reduced ? 1 : 0 }, uSpread: { value: 1 }, uFadeMid: { value: 0.5 },
  cPetrol: { value: C('#4E7F93') }, cBone: { value: C('#D9DCD3') }, cAmber: { value: C('#E59A2F') },
  cBlue: { value: C('#5AA2D6') }, cGreen: { value: C('#8BC34A') }, cLogoP: { value: C('#2C6478') }, cGrey: { value: C('#8C979B') },
};

const vert = /* glsl */`
  attribute float aHeat; attribute vec3 pos2; attribute vec3 pos3; attribute float kind3; attribute vec3 pos4; attribute float kind4; attribute vec4 aRand;
  uniform float uSpread, uFadeMid;
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
      float breath = sin(uTime*1.15);
      p = position * vec3(1. + breath*.007, 1. + breath*.004, 1.) + jitter(.012 + tension*.11, 6. + tension*10.);
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
    p += vec3(sin(uTime*.5 + aRand.y*6.283), cos(uTime*.42 + aRand.z*6.283), 0.) * .012 * mix(uXf[i0].w, uXf[i1].w, t);
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
    gl_PointSize = uSize * uPix * s * (.5 + aRand.y*.9) * 24. / -mv.z;
    vCol = mix(cA, cB, t);
    vA = (.5 + aRand.x*.5) * (1. - uFadeMid*sin(t*3.14159)) * uIntro * mix(aA, aB, t);
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
function layout() {
  const d = isDesktop(), a = innerWidth / innerHeight;
  const hw = 13 * Math.tan(THREE.MathUtils.degToRad(17.5)) * a; // halbe sichtbare Breite bei z=0
  const X = uniforms.uXf.value;
  if (d) {
    X[0].set(hw * 0.56, -0.15, 0, 0.98);
    X[1].set(0, -0.2, 0, Math.max(1, a * 0.75));
    X[2].set(hw * 0.47, -0.3, 0, 0.84);
    X[3].set(hw * 0.5, 0.1, 0, 0.74);
    X[4].set(hw * 0.46, 0, 0, 0.72);
  } else {
    X[0].set(0, 2.1, 0, 0.46);
    X[1].set(0, 0, 0, 1.25);           // 1A: Bewegungslinien über den ganzen Bildschirm
    X[2].set(0, 1.65, 0, 0.28);        // 4A: Wirbelsäule in der oberen Bildhälfte
    X[3].set(0, 2.5, 0, 0.42);         // 2B: wird beim Scrollen zum Emblem (siehe roofEmblem)
    X[4].set(0, 2.15, 0, 0.32);        // 3: tiefer und kleiner, frei von der Leiste
  }
  uniforms.uPix.value = renderer ? renderer.getPixelRatio() * (innerHeight / 900) * (d ? 1 : 1.25) : 1;
}
function resize() {
  if (isDesktop()) $$('.seg-card').forEach((c) => (c.style.opacity = ''));
  camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
  if (renderer) renderer.setSize(innerWidth, innerHeight, false);
  layout();
}
addEventListener('resize', resize); resize();

// ---------- Hand: Spannung lösen ----------
const hand = $('#hand');
const raycaster = new THREE.Raycaster(), ndc = new THREE.Vector2(), plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0), hit = new THREE.Vector3();
let lastPaint = null, touched = false;
function paintAt(cx, cy) {
  ndc.set(cx / innerWidth * 2 - 1, -(cy / innerHeight) * 2 + 1);
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
let tensionShown = 100;
function measureTension() {
  const d = rctx.getImageData(0, 0, RW, RH).data;
  let sum = 0, w = 0;
  HOTSPOTS.forEach((h) => {
    const x = Math.round(h.x / BODY_W * RW), y = Math.round(h.y / BODY_H * RH);
    for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) {
      const xx = clamp(x + dx, 0, RW - 1), yy = clamp(y + dy, 0, RH - 1);
      sum += h.k * (1 - d[(yy * RW + xx) * 4] / 255); w += h.k;
    }
  });
  return Math.round(sum / w * 100);
}
setInterval(() => {
  if (!touched) return;
  const t = measureTension();
  gsap.to({ v: tensionShown }, { v: t, duration: 0.5, onUpdate() { tensionShown = this.targets()[0].v; tensionVal.textContent = Math.round(tensionShown); } });
  tensionBar.style.transform = `scaleX(${t / 100})`;
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
const det = spineStipple(0, false);
const N_GRAIN = isDesktop() ? 165000 : 46000, N_SLICE = isDesktop() ? 330000 : 85000;
const SC = det.SC, CY = det.CY;
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
const core = new THREE.Mesh(det.coreGeo, coreMat);
core.frustumCulled = false;

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
function boneStyle(name) {
  if (STYLES[name]) return STYLES[name];
  const d = name === 'grain' ? det.makeGrain(N_GRAIN) : det.makeSlices(N_SLICE, isDesktop() ? 0.024 : 0.032, 0.12);
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
let bones = boneStyle('slices');
// Umschalter „Darstellung“ (Labor: zum Vergleichen)
$$('.style-switch button').forEach((b) => b.addEventListener('click', () => {
  const st = boneStyle(b.dataset.style);
  if (st === bones) return;
  spineGroup.remove(bones.pts); bones = st; spineGroup.add(bones.pts);
  $$('.style-switch button').forEach((x) => x.classList.toggle('is-on', x === b));
}));

// 3) Nerven: Kurven als Textur (Zeile 0 Rückenmark, dann Wurzeln); Versorgungsbahn eigene Textur in Weltkoordinaten
const ROWS = det.curves.length;
const cData = new Float32Array(CURVE_W * ROWS * 4);
det.curves.forEach((c, r) => c.pts.forEach((q, i) => cData.set([q[0], q[1], q[2], 1], (r * CURVE_W + i) * 4)));
const curveTex = new THREE.DataTexture(cData, CURVE_W, ROWS, THREE.RGBAFormat, THREE.FloatType);
curveTex.minFilter = curveTex.magFilter = THREE.NearestFilter; curveTex.needsUpdate = true;
const periData = new Float32Array(CURVE_W * 4);
const periTex = new THREE.DataTexture(periData, CURVE_W, 1, THREE.RGBAFormat, THREE.FloatType);
periTex.minFilter = periTex.magFilter = THREE.NearestFilter; periTex.needsUpdate = true;
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

const spineGroup = new THREE.Group();
spineGroup.add(core, bones.pts, nervesGhost, nerves);
spineGroup.visible = false;
scene.add(spineGroup);

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
  const lx = Math.min((_pv.x * 0.5 + 0.5) * innerWidth, innerWidth - 16), ly = (-_pv.y * 0.5 + 0.5) * innerHeight;
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
function stopPose(i) {
  const s = STOPS[i], rot = PROFILE + s.az, X = uniforms.uXf.value[2], desk = isDesktop();
  const c = new V3();
  s.ids.forEach((id) => { const lv = det.levels.find((l) => l.id === id); c.add(new V3(lv.center.x * SC, (lv.center.y - CY) * SC, lv.center.z * SC)); });
  c.divideScalar(s.ids.length).applyAxisAngle(new V3(0, 1, 0), rot).multiplyScalar(X.w).add(new V3(X.x, X.y, X.z));
  const d = s.d * SC * X.w * 0.86 * (desk ? 1 : 2.1);
  return { ...frame(c, new V3(0, 0.12, 1), d, desk ? 0.56 : 0.5, desk ? 0.5 : 0.3), rot };
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
const toPx = (v) => { const q = v.clone().project(camera); return [(q.x * 0.5 + 0.5) * innerWidth, (-q.y * 0.5 + 0.5) * innerHeight]; };
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
  const steps = [0.08, 0.2, 0.32, 0.44, 0.56]; // Reihenfolge: Austritt → Nerven → Gefühl → Ziel → typisch
  ncalls.forEach((el, i) => {
    const vis = show && fl > steps[i] && fl < 0.97;
    el.style.opacity = vis ? 1 : 0;
    if (i < 4) nl[i].style.opacity = vis ? 1 : 0;
  });
  if (!show) { ncState.forEach((s) => { s.init = false; s.k = -1; }); return; }
  const now = performance.now(), ease = 1 - Math.exp(-Math.min(0.1, (now - ncT) / 1000) * 7); ncT = now;
  const W = innerWidth, H = innerHeight, MINX = Math.min(600, W * 0.42); // Textspalte links frei halten
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
  scrollToY(r.top + scrollY + p * (r.height - innerHeight) + 2);
}));
// Handy: Karten laufen untereinander durch; die Karte in der unteren Bildmitte bestimmt den Abschnitt
function mobileCard() {
  const vh = innerHeight;
  let best = mobSel, bd = 1e9;
  const rs = cards.map((c) => c.getBoundingClientRect());
  rs.forEach((r, i) => { const d = Math.abs(r.top - vh * 0.5); if (d < bd) { bd = d; best = i; } });
  // Karten leben in der unteren Bildhälfte und blenden nach oben aus, damit die Wirbelsäule frei bleibt
  rs.forEach((r, i) => { cards[i].style.opacity = (smooth(vh * 0.1, vh * 0.4, r.top) * (i === best ? 1 : 0.55)).toFixed(3); });
  return best;
}
dots.forEach((d) => d.addEventListener('click', () => {
  const c = cards[+d.dataset.seg];
  scrollToY(c.getBoundingClientRect().top + scrollY - innerHeight * 0.5);
}));

let spineRot = -0.9;
function updateAxis(dt) {
  const ph = PH(), desk = isDesktop();
  const r = axis.getBoundingClientRect();
  const p = clamp(-r.top / Math.max(1, r.height - innerHeight));
  const inSec = r.top < innerHeight && r.bottom > 0 && morphNow > 1.6 && morphNow < 2.4;
  // Scan (0 = grobe Partikel, 1 = detaillierte Punktwolke)
  const solid = !inSec || p <= 0 || p >= 1 ? 0 : p < ph.M1 ? smooth(0.005, ph.M0, p) : 1 - smooth(ph.M1, 0.995, p);
  const X = uniforms.uXf.value[2];
  const topY = X.y + 4.35 * X.w, botY = X.y - 4.35 * X.w;
  const cut = solid <= 0 ? 100 : THREE.MathUtils.lerp(topY + 0.05, botY - 0.05, solid);
  uniforms.uCut.value = cut;
  spineGroup.visible = solid > 0;
  sU.uOn.value = solid > 0 ? 1 : 0;
  // Punktgröße so, dass die Knochenpunkte bei jeder Entfernung dicht an dicht liegen
  // Punktgröße: Körnung dicht an dicht, Schichten als feine Linie
  bones.pts.material.uniforms.uStip.value = (renderer ? renderer.getPixelRatio() : 1) * innerHeight * 0.5 / tanH * X.w * (bones.name === 'grain' ? bones.spacing * 0.78 : 0.022);

  // Kamera: Übersicht ↔ Kamerafahrt
  const w = inSec ? smooth(ph.M0, ph.J0, p) * (1 - smooth(ph.J1, ph.M1, p)) : 0;
  let jPose = null, zoneIdx = active, localF = 0;
  if (w > 0) {
    if (desk) {
      const x = clamp((p - ph.J0) / (ph.J1 - ph.J0)) * (STOPS.length - 1);
      const i = Math.min(Math.floor(x), STOPS.length - 2), f = x - i;
      jPose = lerpPose(stopPose(i), stopPose(i + 1), smooth(0.1, 0.9, f));
      jPose.rot += x * 0.14; // langsames Kreisen: jede Raste bewegt etwas
      zoneIdx = Math.min(STOPS.length - 1, Math.round(x));
      localF = zoneIdx === 0 ? x * 1.8 : zoneIdx === STOPS.length - 1 ? (x - zoneIdx + 0.5) * 1.8 : x - zoneIdx + 0.5;
      setActive(zoneIdx);
    } else { mobSel = mobileCard(); setActive(mobSel); jPose = stopPose(mobSel); zoneIdx = mobSel; }
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
const heads = [null, null, null, null, null];
let lawOn = 0;

// ---------- Kapitel → Formen ----------
const chapters = $$('.chapter');
const navLinks = $$('#chapters a'), chapNow = $('#chapNow');
let chapShown = -1;
let morphNow = 0;
function targetMorph() {
  const vh = innerHeight;
  let m = 0;
  for (let i = 0; i < chapters.length; i++) {
    const r = chapters[i].getBoundingClientRect();
    const s = +chapters[i].dataset.stage;
    const prev = i ? +chapters[i - 1].dataset.stage : 0;
    // Übergang, während das Kapitel von unten hereinkommt
    let t = smooth(vh * 0.95, vh * 0.05, r.top); // Formwechsel über eine längere Strecke
    // Handy: die Figur löst sich schon beim ersten Scrollen an Ort und Stelle in Bewegungslinien auf
    if (!isDesktop() && prev === 0 && s === 1) t = smooth(vh * 0.03, vh * 0.4, scrollY);
    if (t > 0) m = prev + (s - prev) * t;
  }
  return m;
}

// ---------- Kapitel 04: Rundgang durch die Praxis (Punktwolke im Partikel-Haus) ----------
const tourEl = $('#tour'), roomCards = $$('.room-card'), roomBtns = $$('.roomnav button'), roomDots = $$('.room-dots button');
const prx = praxisPoints(isDesktop() ? 150000 : 60000);
const tGeo = new THREE.BufferGeometry();
tGeo.setAttribute('position', new THREE.BufferAttribute(prx.pos, 3));
tGeo.setAttribute('normal', new THREE.BufferAttribute(prx.nor, 3));
tGeo.setAttribute('aKind', new THREE.BufferAttribute(prx.kind, 1));
tGeo.setAttribute('aRoom', new THREE.BufferAttribute(prx.room, 1));
const tU = {
  uTime: uniforms.uTime, uPix: uniforms.uPix, uRot: uniforms.uHouseRot, uXf: { value: uniforms.uXf.value[3] },
  uCut: { value: -10 }, uOn: { value: 0 }, uRoom: { value: -1 }, uFade: { value: 1 },
  cBone: uniforms.cBone, cAmber: uniforms.cAmber, cBlue: uniforms.cBlue, cGreen: uniforms.cGreen, cPetrol: uniforms.cPetrol,
};
const tourPts = new THREE.Points(tGeo, new THREE.ShaderMaterial({
  uniforms: tU, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  vertexShader: /* glsl */`
    attribute float aKind, aRoom;
    uniform float uTime, uPix, uRot, uCut, uOn, uRoom, uFade; uniform vec4 uXf;
    uniform vec3 cBone, cAmber, cBlue, cGreen, cPetrol;
    varying vec3 vCol; varying float vA;
    vec3 rotY(vec3 p, float a){ float c=cos(a), s=sin(a); return vec3(c*p.x+s*p.z, p.y, -s*p.x+c*p.z); }
    void main(){
      vec3 p = rotY(position, uRot) * uXf.w + uXf.xyz;
      vec3 n = normalize(rotY(normal, uRot));
      float lam = .35 + .65 * max(dot(n, normalize(vec3(.4, .8, .5))), 0.);
      vec3 col;
      if (aKind < .5) col = cPetrol * .85;
      else if (aKind < 1.5) col = cBone * .5;
      else if (aKind < 2.5) col = cBone * lam;
      else if (aKind < 3.5) col = cGreen * lam;
      else if (aKind < 4.5) col = cAmber * (.6 + .6 * lam);
      else if (aKind < 5.5) col = mix(cPetrol * 1.7, cBlue, .3) * lam;
      else col = cBone * .8;
      float act = 1. - step(.5, abs(aRoom - uRoom));
      col *= uRoom < -.5 ? 1. : mix(.42, 1.2, act);
      float g = exp(-pow((position.y - uCut) * 14., 2.));
      col = mix(col, cAmber * 1.4, g);
      vec4 mv = viewMatrix * vec4(p, 1.);
      gl_Position = projectionMatrix * mv;
      float d = -mv.z;
      gl_PointSize = clamp(uPix * (aKind > 5.5 ? 1.45 : 1.25) * 9. / d, 1., 4.5) * (1. + g);
      float dn = d / uXf.w;
      // nahe Wände und Kanten ausblenden (Schnittbild), sonst stehen sie als helle Streifen im Bild
      float nearFade = (aKind > .5 && aKind < 1.5) || aKind > 5.5 ? smoothstep(.7, 1.9, dn) : smoothstep(.2, .85, dn);
      vA = step(position.y, uCut) * uOn * uFade * (aKind < .5 ? .55 : aKind < 1.5 ? .5 : .9) * nearFade;
      vCol = col;
    }`,
  fragmentShader: /* glsl */`
    varying vec3 vCol; varying float vA;
    void main(){ float d = length(gl_PointCoord - .5); gl_FragColor = vec4(vCol, smoothstep(.5, .08, d) * vA);
      #include <colorspace_fragment>
    }`,
}));
tourPts.frustumCulled = false; tourPts.visible = false;
scene.add(tourPts);

// Raum-Beschriftungen im Raum
const roomTags = ROOMS.map((r, i) => {
  const el = document.createElement('div'); el.className = 'room-tag'; el.setAttribute('aria-hidden', 'true');
  el.innerHTML = `<i>${String(i + 1).padStart(2, '0')}</i>${r.short}`; document.body.appendChild(el);
  el.addEventListener('pointerenter', () => (hoverRoom = i)); el.addEventListener('pointerleave', () => (hoverRoom = -1));
  el.addEventListener('click', () => { const rr = tourEl.getBoundingClientRect(); const q = TPH.J0 + (i / (ROOMS.length - 1)) * (TPH.J1 - TPH.J0); scrollToY(rr.top + scrollY + q * (rr.height - innerHeight) + 2); });
  const [x, y, w, h] = r.r; const [cx, cz] = P(x + w / 2, y + h / 2);
  return { el, p: new V3(cx, EYE + 0.55, cz) };
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
  return frame(T, dir, d, desk ? 0.64 : 0.5, desk ? 0.5 : 0.3);
}
let roomOn = -1;
function setRoom(i) {
  if (i === roomOn) return; roomOn = i;
  [roomCards, roomBtns, roomDots].forEach((list) => list.forEach((el, k) => el.classList.toggle('is-on', k === i)));
}
const TPH = { M0: 0.07, E: 0.13, J0: 0.16, J1: 0.82, B: 0.9, M1: 0.93 };
roomBtns.forEach((b) => b.addEventListener('click', () => {
  const i = +b.dataset.room, r = tourEl.getBoundingClientRect();
  const p = TPH.J0 + (i / (ROOMS.length - 1)) * (TPH.J1 - TPH.J0);
  scrollToY(r.top + scrollY + p * (r.height - innerHeight) + 2);
}));
roomDots.forEach((d) => d.addEventListener('click', () => { const c = roomCards[+d.dataset.room]; scrollToY(c.getBoundingClientRect().top + scrollY - innerHeight * 0.5); }));
let tourWant = null, tourHide = 0, xray = 0, dragRot = 0, hoverRoom = -1;
// Haus mit gedrückter Maus drehen (PC, Röntgenblick)
{ let down = null; addEventListener('pointerdown', (e) => { if (xray > 0.4 && e.pointerType === 'mouse' && e.clientX > innerWidth * 0.45 && !e.target.closest('a,button,.room-tag')) down = e.clientX; });
  addEventListener('pointermove', (e) => { if (down !== null) { dragRot += (e.clientX - down) * 0.006; down = e.clientX; } });
  addEventListener('pointerup', () => (down = null)); }
function updateTour(dt) {
  const r = tourEl.getBoundingClientRect(), vh = innerHeight, desk = isDesktop();
  const p = clamp(-r.top / Math.max(1, r.height - vh));
  const near = r.top < vh && r.bottom > 0 && morphNow > 2.6 && morphNow < 3.4;
  // Scan hinein/hinaus (Boden → Decke); Handy: an den Raum-Karten ausgerichtet
  let inside;
  if (desk) inside = !near ? 0 : p < TPH.M1 ? smooth(0.0, TPH.M0, p) : 1 - smooth(TPH.M1, 0.995, p);
  else { const f = roomCards[0].getBoundingClientRect(), l = roomCards[roomCards.length - 1].getBoundingClientRect(); inside = !near ? 0 : smooth(vh * 1.2, vh * 0.75, f.top) * (1 - smooth(vh * 0.2, -vh * 0.25, l.bottom)); }
  // Röntgenblick (PC): schon bevor man eintritt, leuchtet das Innere durch das Haus, das Dach schwebt angehoben
  const pv = desk && morphNow > 2.55 && morphNow < 3.45 ? smooth(2.55, 2.95, morphNow) * (1 - smooth(3.05, 3.45, morphNow)) * (1 - inside) : 0;
  xray = pv;
  tU.uCut.value = inside > 0 ? -3.05 + inside * 1.9 : (pv > 0 ? -1.0 : -10);
  tU.uOn.value = inside > 0 || pv > 0 ? 1 : 0; tourPts.visible = inside > 0 || pv > 0;
  tU.uFade.value = inside > 0 ? 1 : pv * 0.55;
  uniforms.uRoofLift.value += ((desk ? Math.max(pv, inside) * 1.1 : 0) - uniforms.uRoofLift.value) * 0.08;
  tourHide = desk ? (near ? smooth(0.0, TPH.M0 * 0.8, p) * (1 - smooth(TPH.M1, 0.99, p)) : 0) : Math.min(1, inside * 1.4);
  // Hausdrehung festhalten, solange wir drinnen sind
  const free = Math.sin(uniforms.uTime.value * 0.2) * 0.45 - 0.55 + dragRot;
  uniforms.uHouseRot.value = THREE.MathUtils.lerp(free, TOUR_ROT, near ? smooth(0, TPH.M0, p) * (1 - smooth(TPH.M1, 1, p)) : 0);
  if (pv > 0.3 && (p <= 0 || !near || inside < 0.05)) { // Röntgenblick: Räume als anklickbare Schilder
    tourWant = null; tU.uRoom.value = hoverRoom;
    roomTags.forEach((t, i) => { const w = toWorld(t.p.clone().setY(EYE + 0.2)); w.project(camera); t.el.classList.add('click'); t.el.classList.toggle('on', i === hoverRoom); t.el.style.opacity = pv; t.el.style.transform = `translate(${(w.x * 0.5 + 0.5) * innerWidth}px, ${(-w.y * 0.5 + 0.5) * vh}px) translate(-50%, -50%)`; });
    return;
  }
  roomTags.forEach((t) => t.el.classList.remove('click'));
  if (!near || p <= 0 || p >= 1) { tourWant = null; tU.uRoom.value = -1; roomTags.forEach((t) => (t.el.style.opacity = 0)); return; }
  // Kamera-Station bestimmen
  let st, room = -1;
  const ri = (x) => { const n = ROOMS.length - 1, xx = clamp(x) * n, i = Math.min(Math.floor(xx), n - 1); return { i, f: smooth(0.12, 0.88, xx - i), x: xx }; };
  if (desk) {
    if (p < TPH.E) st = lerpPose(OVERVIEW, tourPose(TOUR.entry), smooth(0, TPH.E, p));
    else if (p < TPH.J0) st = lerpPose(tourPose(TOUR.entry), tourPose(TOUR.rooms[0]), smooth(TPH.E, TPH.J0, p));
    else if (p < TPH.J1) { const q = ri((p - TPH.J0) / (TPH.J1 - TPH.J0)); st = lerpPose(tourPose(TOUR.rooms[q.i]), tourPose(TOUR.rooms[q.i + 1]), q.f); room = Math.min(ROOMS.length - 1, Math.round(q.x - 0.05)); }
    else if (p < TPH.B) { st = lerpPose(tourPose(TOUR.rooms[ROOMS.length - 1]), tourPose(TOUR.bird), smooth(TPH.J1, TPH.B, p)); room = ROOMS.length - 1; }
    else st = lerpPose(tourPose(TOUR.bird), OVERVIEW, smooth(TPH.M1, 1, p));
  } else {
    const rs = roomCards.map((c) => c.getBoundingClientRect());
    let best = 0, bd = 1e9; rs.forEach((b, i) => { const d = Math.abs(b.top - vh * 0.5); if (d < bd) { bd = d; best = i; } });
    rs.forEach((b, i) => { roomCards[i].style.opacity = (smooth(vh * 0.1, vh * 0.4, b.top) * (i === best ? 1 : 0.55)).toFixed(3); });
    const first = rs[0], last = rs[rs.length - 1];
    if (first.top > vh * 0.7) st = lerpPose(OVERVIEW, tourPose(TOUR.entry), smooth(0, TPH.M0 * 2, p));
    else if (last.bottom < vh * 0.15) st = lerpPose(tourPose(TOUR.bird), OVERVIEW, smooth(TPH.M1, 1, p));
    else { st = tourPose(TOUR.rooms[best]); room = best; }
  }
  if (room >= 0) setRoom(room);
  tU.uRoom.value = room;
  tourWant = st;
  // Beschriftungen
  roomTags.forEach((t, i) => {
    const w = toWorld(t.p); w.project(camera);
    const vis = desk && inside > 0.9 && w.z < 1 && Math.abs(w.x) < 0.95 && Math.abs(w.y) < 0.9;
    t.el.style.opacity = vis ? (i === room ? 1 : 0.55) : 0;
    t.el.classList.toggle('on', i === room);
    if (vis) t.el.style.transform = `translate(${(w.x * 0.5 + 0.5) * innerWidth}px, ${(-w.y * 0.5 + 0.5) * vh}px) translate(-50%, -50%)`;
  });
}

// ---------- Lebende Überschriften ----------
function splitLetters(el) {
  el.setAttribute('aria-label', el.textContent.replace(/\s+/g, ' ').trim());
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
  const vh = innerHeight;
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
  const vh = innerHeight, a = innerWidth / vh;
  const hh = 13 * Math.tan(THREE.MathUtils.degToRad(17.5)), hw = hh * a;
  const k = smooth(vh * 0.62, vh * 0.12, roofHead.getBoundingClientRect().top);
  const navW = (78 / vh) * 2 * hh; // Leistenhöhe in Welt-Einheiten
  const big = { x: 0, y: 2.5, s: 0.42 }, small = { x: hw - 0.48, y: hh - navW - 0.42, s: 0.085 };
  uniforms.uXf.value[3].set(big.x + (small.x - big.x) * k, big.y + (small.y - big.y) * k, 0, big.s + (small.s - big.s) * k);
  emblemK = k;
}
let emblemK = 0;

// ---------- Schleife ----------
const clock = new THREE.Clock();
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
  const dt = Math.min(clock.getDelta(), 0.05);
  uniforms.uTime.value += paused ? 0 : dt * CALM;
  const tm = targetMorph();
  morphNow += (tm - morphNow) * (reduced ? 1 : 1 - Math.exp(-dt * 2.4));
  uniforms.uMorph.value = morphNow;
  updateAxis(dt);
  updateTour(dt);
  { // Kamera: Rundgang > Wirbelsäule > Übersicht
    const want = tourWant || axisWant || OVERVIEW, k = reduced ? 1 : 1 - Math.exp(-dt * 2.2);
    cam.pos.lerp(want.pos, k); cam.target.lerp(want.target, k);
  }
  // Partikel abdunkeln, sobald Text darüber liegt (Kontakt immer; mobil auch Achse/Dach/Hausordnung)
  const vh = innerHeight;
  const doorTop = door.getBoundingClientRect().top;
  let dim = isDesktop() ? smooth(vh * 0.75, vh * 0.25, doorTop) : smooth(vh * 1.3, vh * 0.8, doorTop);
  const dimMax = 1; // Kontakt: Partikel blenden ganz aus (Handy und PC)
  if (!isDesktop()) {
    if (morphNow > 0.3 && morphNow < 1.6) dim = Math.max(dim, 0.55); // Bewegungslinien leise hinter Text
    const head = heads[Math.round(clamp(morphNow, 0, 4))];
    if (head && morphNow > 1.5) dim = Math.max(dim, smooth(vh * 0.62, vh * 0.25, head.getBoundingClientRect().top) * 0.9);
  }
  if (isDesktop() && morphNow > 0.12 && morphNow < 0.9) dim = Math.max(dim, 0.4 * Math.sin(Math.PI * (morphNow - 0.12) / 0.78));
  dim = Math.max(dim, tourHide, xray * 0.4); // im Rundgang/Röntgenblick tritt das äußere Partikel-Haus zurück
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
  const sp = clamp((innerHeight * 0.85 - sr.top) / (sr.height + innerHeight * 0.35));
  const lit = Math.floor(sp * words.length * 1.1);
  words.forEach((w, i) => w.classList.toggle('lit', reduced || i < lit));

  // Hausordnung
  const rr = rules.getBoundingClientRect();
  const rp = clamp(-rr.top / Math.max(1, rr.height - innerHeight));
  const li = Math.min(laws.length - 1, Math.floor(rp * laws.length));
  if (li !== lawOn) { laws[lawOn].classList.remove('is-on'); laws[li].classList.add('is-on'); lawOn = li; }

  // Navigation
  top.classList.toggle('scrolled', scrollY > 30);
  const ci = Math.round(clamp(morphNow, 0, 4));
  navLinks.forEach((a, k) => a.classList.toggle('on', k === Math.min(ci, 4)));
  const rr2 = rules.getBoundingClientRect();
  const chapKey = rr2.top < innerHeight * 0.5 && rr2.bottom > innerHeight * 0.5 ? 9 : ci;
  if (chapKey !== chapShown) { chapShown = chapKey; chapNow.innerHTML = chapKey === 9 ? '<i>§</i>Hausordnung' : navLinks[Math.min(ci, 4)].innerHTML; }

  camera.position.copy(cam.pos); camera.lookAt(cam.target);
  if (renderer && !document.hidden) renderer.render(scene, camera);
}
gsap.ticker.add(tick);

// Intro
if (!reduced) {
  gsap.to(uniforms.uIntro, { value: 1, duration: 3.2, ease: 'expo.out', delay: 0.1 });
  gsap.from(['.hero .kicker', '.kinetic', '.hero-sub', '.hero .actions', '.meter', '.top'], { opacity: 0, y: 20, duration: 1.1, stagger: 0.06, ease: 'expo.out', delay: 0.2 });
}
