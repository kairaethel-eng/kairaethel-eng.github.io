// Testseite 2 · „Puls“ – ein Partikelfeld, das sich beim Scrollen verwandelt:
// 0 Körper (Spannung lösen) → 1 Bewegung → 2 Wirbelsäule → 3 Dach → 4 HOP-Kreise
import * as THREE from 'three';
import gsap from 'gsap';
import Lenis from 'lenis';
import { bodyPoints, spinePoints, housePoints, logoPoints, BODY_W, BODY_H, BODY_SCALE, HOTSPOTS } from './shapes.js';

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = matchMedia('(pointer: fine)').matches;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const smooth = (a, b, v) => { const t = clamp((v - a) / (b - a)); return t * t * (3 - 2 * t); };
const isDesktop = () => innerWidth > 920;

// ---------- Scrollen ----------
let lenis = null;
if (!reduced) {
  lenis = new Lenis({ lerp: 0.08, smoothWheel: true });
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
  uSeg: { value: new THREE.Vector2(spine.segs[0][0], spine.segs[0][1]) }, uSegOn: { value: 0 },
  uHouse: { value: 0 }, uIntro: { value: reduced ? 1 : 0 },
  cPetrol: { value: C('#4E7F93') }, cBone: { value: C('#D9DCD3') }, cAmber: { value: C('#E59A2F') },
  cBlue: { value: C('#5AA2D6') }, cGreen: { value: C('#8BC34A') }, cLogoP: { value: C('#2C6478') }, cGrey: { value: C('#8C979B') },
};

const vert = /* glsl */`
  attribute float aHeat; attribute vec3 pos2; attribute vec3 pos3; attribute float kind3; attribute vec3 pos4; attribute float kind4; attribute vec4 aRand;
  uniform float uTime, uMorph, uPix, uSize, uSegOn, uHouse, uIntro;
  uniform sampler2D uRelax; uniform vec2 uBodyWH; uniform vec4 uXf[5]; uniform vec2 uSeg;
  uniform vec3 cPetrol, cBone, cAmber, cBlue, cGreen, cLogoP, cGrey;
  varying vec3 vCol; varying float vA;

  vec3 rotY(vec3 p, float a){ float c=cos(a), s=sin(a); return vec3(c*p.x+s*p.z, p.y, -s*p.x+c*p.z); }
  vec3 jitter(float amp, float sp){
    return vec3(sin(uTime*sp*1.3+aRand.x*40.), sin(uTime*sp*1.7+aRand.y*40.), sin(uTime*sp*1.1+aRand.z*40.))*amp;
  }

  // jede Form liefert Position (xyz) und Farbe; w = Größenfaktor
  void shape(int i, out vec3 p, out vec3 col, out float sz){
    sz = 1.;
    if(i==0){
      vec2 uv = position.xy / uBodyWH + .5;
      float relax = texture2D(uRelax, vec2(uv.x, 1.-uv.y)).r;
      float tension = aHeat * (1. - relax);
      p = position + jitter(.012 + tension*.11, 6. + tension*10.);
      p = rotY(p, sin(uTime*.25)*.32);
      vec3 base = mix(cPetrol, cBone, .25 + aRand.y*.35);
      col = mix(base, cAmber, smoothstep(.08, .7, tension));
      col = mix(col, mix(cBlue, cGreen, aRand.x), relax * aHeat * .85);
      sz = 1. + tension*.9;
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
      p = rotY(pos2, uTime*.22 - .9);
      float band = exp(-pow((pos2.y - (3.6 - mod(uTime*1.6, 9.)))*2.2, 2.));
      float hi = uSegOn * step(uSeg.x, pos2.y) * step(pos2.y, uSeg.y);
      col = mix(cBone, cBlue, band*.8);
      col = mix(col, cAmber, hi);
      sz = 1. + hi*.5;
    } else if(i==3){
      p = rotY(pos3, sin(uTime*.2)*.45 - .55);
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
  }

  void main(){
    float m = clamp(uMorph, 0., 4.);
    int i0 = int(floor(m)); int i1 = min(i0+1, 4);
    float f = m - float(i0);
    float st = aRand.w*.4;
    float t = smoothstep(st, st+.6, f);
    vec3 pA, pB, cA, cB; float sA, sB;
    shape(i0, pA, cA, sA); shape(i1, pB, cB, sB);
    vec3 p = mix(pA, pB, t);
    // Zerstäuben zwischen zwei Formen
    vec3 n = normalize(vec3(aRand.x-.5, aRand.y-.5, aRand.z-.5)+1e-4);
    p += n * sin(t*3.14159) * (1.2 + aRand.w*1.6);
    // Intro: aus der Tiefe einfliegen
    p += n * (1.-uIntro) * (6. + aRand.x*8.);
    vec4 mv = modelViewMatrix * vec4(p, 1.);
    gl_Position = projectionMatrix * mv;
    float s = mix(sA, sB, t);
    gl_PointSize = uSize * uPix * s * (.5 + aRand.y*.9) * 24. / -mv.z;
    vCol = mix(cA, cB, t);
    vA = (.5 + aRand.x*.5) * uIntro;
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
    X[2].set(hw * 0.48, 0, 0, 0.9);
    X[3].set(hw * 0.6, 0.3, 0, 0.82);
    X[4].set(hw * 0.46, 0, 0, 0.72);
  } else {
    X[0].set(0, 2.1, 0, 0.46);
    X[1].set(0, 1.4, 0, 0.55);
    X[2].set(0, 2.15, 0, 0.42);
    X[3].set(0, 2.5, 0, 0.42);
    X[4].set(0, 2.6, 0, 0.36);
  }
  uniforms.uPix.value = renderer ? renderer.getPixelRatio() * (innerHeight / 900) * (d ? 1 : 1.25) : 1;
}
function resize() {
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

// ---------- Achse: Segmente ----------
const SEG = [
  { n: 'Kopfgelenke C1–C2', nerv: 'Nn. suboccipitales und N. occipitalis major versorgen Hinterkopf und tiefe Nackenmuskulatur.', typ: 'Vom Nacken aufsteigender Spannungskopfschmerz, Schwindelgefühl, eingeschränktes Kopfdrehen.', ther: 'Atlas-Axis-Therapie · Manuelle Therapie · Fango' },
  { n: 'Segmente C5–C6', nerv: 'Wurzeln u. a. für Bizeps und Schulterheber, Gefühl außen am Arm bis zum Daumen.', typ: 'Ausstrahlung über die Armaußenseite bis in den Daumen, Kribbeln, Schwächegefühl beim Beugen.', ther: 'Manuelle Therapie · Schlingentisch · Krankengymnastik' },
  { n: 'Brustwirbel Th1–Th6', nerv: 'Interkostalnerven der oberen Rippen versorgen Brustkorbwand und Zwischenrippenmuskeln.', typ: 'Blockaden mit atemabhängigem Stechen, Schmerz zwischen den Schulterblättern, „Rippenklemme“.', ther: 'Manuelle Therapie · Loyer Manuthera · Fango' },
  { n: 'Lendenwirbel L4–L5', nerv: 'Wurzeln Richtung N. ischiadicus. L5 hebt den Fuß, Gefühl am Schienbein bis zur Großzehe.', typ: 'Bandscheiben-Region: Ausstrahlung ins Bein, Kribbeln am Schienbein, Fußheber-Schwäche.', ther: 'Schlingentisch · Schmerztherapie · Krankengymnastik' },
  { n: 'Kreuzbein S1 & ISG', nerv: 'S1-Wurzel für Wade, Fußaußenrand und Achillessehnenreflex. Das Iliosakralgelenk verbindet Becken und Wirbelsäule.', typ: 'Ausstrahlung über die Beinrückseite bis zur Ferse, tiefsitzender einseitiger Kreuzschmerz.', ther: 'Manuelle Therapie / ISG · Sport-Physiotherapie · Stoßwelle' },
];
const segBtns = $$('.segments button'), segDetail = $('#segDetail');
function showSeg(i) {
  segBtns.forEach((b, k) => b.setAttribute('aria-selected', k === i ? 'true' : 'false'));
  const s = SEG[i];
  segDetail.innerHTML = `<dl><dt>Nerven</dt><dd>${s.nerv}</dd><dt>Typisch</dt><dd>${s.typ}</dd><dt>Bei HOP</dt><dd class="ther">${s.ther}</dd></dl>`;
  segDetail.classList.remove('swap'); void segDetail.offsetWidth; segDetail.classList.add('swap');
  const [a, b] = spine.segs[i];
  gsap.to(uniforms.uSeg.value, { x: a, y: b, duration: reduced ? 0 : 0.8, ease: 'expo.out' });
}
segBtns.forEach((b) => b.addEventListener('click', () => showSeg(+b.dataset.seg)));
showSeg(0);

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
const heads = [null, null, $('#a-title'), $('#d-title'), $('#laws')];
let lawOn = 0;

// ---------- Kapitel → Formen ----------
const chapters = $$('.chapter');
const navLinks = $$('#chapters a');
let morphNow = 0;
function targetMorph() {
  const vh = innerHeight;
  let m = 0;
  for (let i = 0; i < chapters.length; i++) {
    const r = chapters[i].getBoundingClientRect();
    const s = +chapters[i].dataset.stage;
    const prev = i ? +chapters[i - 1].dataset.stage : 0;
    // Übergang, während das Kapitel von unten hereinkommt
    const t = smooth(vh * 0.95, vh * 0.25, r.top);
    if (t > 0) m = prev + (s - prev) * t;
  }
  return m;
}

// ---------- Schleife ----------
const clock = new THREE.Clock();
const top = $('#top');
function tick() {
  const dt = Math.min(clock.getDelta(), 0.05);
  uniforms.uTime.value += reduced ? 0 : dt;
  const tm = targetMorph();
  morphNow += (tm - morphNow) * (reduced ? 1 : 1 - Math.exp(-dt * 4));
  uniforms.uMorph.value = morphNow;
  uniforms.uSegOn.value += ((Math.abs(morphNow - 2) < 0.35 ? 1 : 0) - uniforms.uSegOn.value) * 0.08;
  // Partikel abdunkeln, sobald Text darüber liegt (Kontakt immer; mobil auch Achse/Dach/Hausordnung)
  const vh = innerHeight;
  let dim = smooth(vh * 0.75, vh * 0.25, door.getBoundingClientRect().top);
  if (!isDesktop()) {
    const head = heads[Math.round(clamp(morphNow, 0, 4))];
    if (head && morphNow > 1.5) dim = Math.max(dim, smooth(vh * 0.62, vh * 0.25, head.getBoundingClientRect().top) * 0.9);
  }
  uniforms.uAlpha.value += ((1 - dim * 0.82) - uniforms.uAlpha.value) * 0.1;
  uniforms.uSize.value = isDesktop() ? 1 : 1.1;

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

  if (renderer && !document.hidden) renderer.render(scene, camera);
}
gsap.ticker.add(tick);

// Intro
if (!reduced) {
  gsap.to(uniforms.uIntro, { value: 1, duration: 2.6, ease: 'expo.out', delay: 0.15 });
  gsap.from(['.hero .kicker', '.kinetic', '.hero-sub', '.hero .actions', '.meter', '.top'], { opacity: 0, y: 24, duration: 1.4, stagger: 0.09, ease: 'expo.out', delay: 0.5 });
}
