// Testseite 3 · „Puls + Achse“ – Partikelfeld wie „Puls“; im Kapitel Achse materialisiert sich die
// Partikel-Wirbelsäule zur echten 3D-Wirbelsäule, danach fährt die Kamera die Abschnitte ab.
// 0 Körper → 1 Bewegung → 2 Wirbelsäule (Partikel → 3D → Partikel) → 3 Dach → 4 HOP-Kreise
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import gsap from 'gsap';
import Lenis from 'lenis';
import { bodyPoints, spinePoints, housePoints, logoPoints, BODY_W, BODY_H, BODY_SCALE, HOTSPOTS } from './shapes.js';
import { buildSpine, rootCurves } from '../shared/spine.js';

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
  renderer.toneMapping = THREE.NeutralToneMapping;
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.32;
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
  uSpineRot: { value: -0.9 }, uCut: { value: 100 },
  uHouse: { value: 0 }, uIntro: { value: reduced ? 1 : 0 },
  cPetrol: { value: C('#4E7F93') }, cBone: { value: C('#D9DCD3') }, cAmber: { value: C('#E59A2F') },
  cBlue: { value: C('#5AA2D6') }, cGreen: { value: C('#8BC34A') }, cLogoP: { value: C('#2C6478') }, cGrey: { value: C('#8C979B') },
};

const vert = /* glsl */`
  attribute float aHeat; attribute vec3 pos2; attribute vec3 pos3; attribute float kind3; attribute vec3 pos4; attribute float kind4; attribute vec4 aRand;
  uniform float uTime, uMorph, uPix, uSize, uHouse, uIntro, uSpineRot, uCut;
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
      p = rotY(pos2, uSpineRot);
      float band = exp(-pow((pos2.y - (3.6 - mod(uTime*1.6, 9.)))*2.2, 2.));
      col = mix(cBone, cBlue, band*.8);
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
    vA = (.5 + aRand.x*.5) * uIntro * mix(aA, aB, t);
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
    X[3].set(hw * 0.6, 0.3, 0, 0.82);
    X[4].set(hw * 0.46, 0, 0, 0.72);
  } else {
    X[0].set(0, 2.1, 0, 0.46);
    X[1].set(0, 1.4, 0, 0.55);
    X[2].set(0, 0.72, 0, 0.3);
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

// ---------- Achse: echte 3D-Wirbelsäule (materialisiert sich aus den Partikeln) ----------
const V3 = THREE.Vector3;
const cutU = { value: 100 }, edgeU = { value: new THREE.Color('#E09A35') };
function addCut(m) {
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uCut = cutU; sh.uniforms.uEdgeCol = edgeU;
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying float vWY;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvWY = (modelMatrix * vec4(transformed, 1.0)).y;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform float uCut; uniform vec3 uEdgeCol; varying float vWY;')
      .replace('void main() {', 'void main() {\n  if (vWY < uCut) discard;')
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n  totalEmissiveRadiance += uEdgeCol * smoothstep(0.12, 0.0, vWY - uCut) * 3.0;');
  };
  return m;
}
const BONE = new THREE.Color(0xF1ECE1), AMBER_SOFT = new THREE.Color(0xE0993A);
const boneMat = () => addCut(new THREE.MeshPhysicalMaterial({
  color: BONE.clone(), roughness: 0.5, clearcoat: 0.45, clearcoatRoughness: 0.35, sheen: 0.6, sheenRoughness: 0.55,
  sheenColor: new THREE.Color(0xffffff), emissive: new THREE.Color(0xE09A35), emissiveIntensity: 0,
}));
const discMat = addCut(new THREE.MeshPhysicalMaterial({ color: 0x9CC2D8, roughness: 0.3, clearcoat: 0.7, clearcoatRoughness: 0.2, emissive: new THREE.Color(0x3F86B5), emissiveIntensity: 0.12 }));
const sp = buildSpine({ boneMaterial: boneMat, discMaterial: discMat });
const SC = 8.2 / sp.Ltot, CY = sp.Ltot / 2;
const spineRoot = new THREE.Group(), spineInner = new THREE.Group();
spineInner.scale.setScalar(SC); spineInner.position.y = -CY * SC;
spineInner.add(sp.group); spineRoot.add(spineInner); scene.add(spineRoot);
spineRoot.visible = false;

// Rückenmark und Nervenwurzeln mit Impuls
const pulseVert = /* glsl */`
  varying vec2 vUv; varying vec3 vN; varying vec3 vV; varying float vWY;
  void main(){ vUv=uv; vec4 wp=modelMatrix*vec4(position,1.); vWY=wp.y; vec4 mv=viewMatrix*wp; vN=normalize(normalMatrix*normal); vV=normalize(-mv.xyz); gl_Position=projectionMatrix*mv; }`;
const pulseFrag = /* glsl */`
  uniform float uTime, uActive, uSpeed, uFreq, uReveal, uCut; uniform vec3 uBase, uGlow;
  varying vec2 vUv; varying vec3 vN; varying vec3 vV; varying float vWY;
  void main(){
    if(vUv.x>uReveal || vWY<uCut) discard;
    float p=fract(vUv.x*uFreq-uTime*uSpeed);
    float band=smoothstep(0.,.06,p)*(1.-smoothstep(.06,.32,p));
    float fres=pow(1.-abs(dot(vN,vV)),2.);
    vec3 c=mix(uBase,uGlow,clamp(band*uActive*1.4+fres*.45,0.,1.));
    c+=uGlow*band*uActive*.9;
    gl_FragColor=vec4(c,1.);
    #include <colorspace_fragment>
  }`;
function pulseMat(base, glow, speed, freq, active, reveal) {
  return new THREE.ShaderMaterial({
    vertexShader: pulseVert, fragmentShader: pulseFrag,
    uniforms: { uTime: { value: 0 }, uActive: { value: active }, uSpeed: { value: speed }, uFreq: { value: freq }, uReveal: { value: reveal }, uCut: cutU, uBase: { value: new THREE.Color(base) }, uGlow: { value: new THREE.Color(glow) } },
  });
}
const cordMat = pulseMat('#5F8496', '#5AA2D6', 0.22, 3.0, 0.7, 1);
sp.group.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(sp.canal, false, 'centripetal'), 420, 0.05, 10, false), cordMat));
const rootMats = {}, byZone = {};
rootCurves(sp).forEach((r) => (byZone[r.zone] ||= []).push(new THREE.TubeGeometry(r.curve, 40, 0.026, 8, false)));
Object.entries(byZone).forEach(([z, g]) => { rootMats[z] = pulseMat('#6E9BB8', '#5AA2D6', 0.8, 1.2, 0, 0); sp.group.add(new THREE.Mesh(mergeGeometries(g), rootMats[z])); });

// Licht für die feste Wirbelsäule: warmes Hauptlicht, kühles Gegenlicht, Bernstein von unten
const keyL = new THREE.DirectionalLight(0xffe6c6, 2.6); keyL.position.set(6, 8, 9);
const rimL = new THREE.DirectionalLight(0x6fb3e6, 3.2); rimL.position.set(-6, 3, -7);
const ambL = new THREE.HemisphereLight(0x9fb8c4, 0x0a161b, 0.5);
const warmL = new THREE.PointLight(0xE09A35, 10, 9, 1.6);
scene.add(keyL, rimL, ambL, warmL);

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
  s.ids.forEach((id) => { const lv = sp.levels.find((l) => l.id === id); c.add(new V3(lv.center.x * SC, (lv.center.y - CY) * SC, lv.center.z * SC)); });
  c.divideScalar(s.ids.length).applyAxisAngle(new V3(0, 1, 0), rot).multiplyScalar(X.w).add(new V3(X.x, X.y, X.z));
  const d = s.d * SC * X.w * 0.86 * (desk ? 1 : 2.1);
  return { ...frame(c, new V3(0, 0.12, 1), d, desk ? 0.7 : 0.5, desk ? 0.5 : 0.38), rot };
}
const OVERVIEW = { pos: new V3(0, 0, 13), target: new V3(0, 0, 0) };
const lerpPose = (a, b, t) => ({ pos: a.pos.clone().lerp(b.pos, t), target: a.target.clone().lerp(b.target, t), rot: b.rot !== undefined && a.rot !== undefined ? THREE.MathUtils.lerp(a.rot, b.rot, t) : (b.rot ?? a.rot) });
const cam = { pos: OVERVIEW.pos.clone(), target: OVERVIEW.target.clone() };

// Bedienung: Desktop = Scrollen + Abschnitts-Knöpfe, Handy = Karten wischen
const axis = $('#achse');
const segBtns = $$('.segnav button'), cards = $$('.seg-card'), dots = $$('.seg-dots button'), cardsEl = $('#segCards');
let active = 0, mobSel = 0;
function setActive(i) {
  if (i === active) return;
  active = i;
  [segBtns, cards, dots].forEach((list) => list.forEach((el, k) => el.classList.toggle('is-on', k === i)));
}
const PH = () => (isDesktop() ? { M0: 0.08, J0: 0.13, J1: 0.87, M1: 0.92 } : { M0: 0.14, J0: 0.2, J1: 0.8, M1: 0.86 });
segBtns.forEach((b) => b.addEventListener('click', () => {
  const i = +b.dataset.seg, ph = PH(), r = axis.getBoundingClientRect();
  const p = ph.J0 + (i / (STOPS.length - 1)) * (ph.J1 - ph.J0);
  scrollToY(r.top + scrollY + p * (r.height - innerHeight) + 2);
}));
const cardStep = () => (cards.length > 1 ? cards[1].offsetLeft - cards[0].offsetLeft : 1);
cardsEl.addEventListener('scroll', () => {
  if (isDesktop()) return;
  mobSel = clamp(Math.round(cardsEl.scrollLeft / cardStep()), 0, STOPS.length - 1);
  setActive(mobSel);
}, { passive: true });
dots.forEach((d) => d.addEventListener('click', () => cardsEl.scrollTo({ left: +d.dataset.seg * cardStep(), behavior: reduced ? 'auto' : 'smooth' })));

let spineRot = -0.9;
function updateAxis(dt) {
  const ph = PH(), desk = isDesktop();
  const r = axis.getBoundingClientRect();
  const p = clamp(-r.top / Math.max(1, r.height - innerHeight));
  const inSec = r.top < innerHeight && r.bottom > 0 && morphNow > 1.6 && morphNow < 2.4;
  // Materialisieren (0 = Partikel, 1 = feste Wirbelsäule)
  const solid = !inSec || p <= 0 || p >= 1 ? 0 : p < ph.M1 ? smooth(0.005, ph.M0, p) : 1 - smooth(ph.M1, 0.995, p);
  const X = uniforms.uXf.value[2];
  const topY = X.y + 4.35 * X.w, botY = X.y - 4.35 * X.w;
  const cut = solid <= 0 ? 100 : THREE.MathUtils.lerp(topY + 0.05, botY - 0.05, solid);
  cutU.value = cut; uniforms.uCut.value = solid <= 0 ? 100 : cut;
  spineRoot.visible = solid > 0;

  // Kamera: Übersicht ↔ Kamerafahrt
  const w = inSec ? smooth(ph.M0, ph.J0, p) * (1 - smooth(ph.J1, ph.M1, p)) : 0;
  let jPose = null, zoneIdx = active;
  if (w > 0) {
    if (desk) {
      const x = clamp((p - ph.J0) / (ph.J1 - ph.J0)) * (STOPS.length - 1);
      const i = Math.min(Math.floor(x), STOPS.length - 2), f = x - i;
      jPose = lerpPose(stopPose(i), stopPose(i + 1), smooth(0.25, 0.85, f));
      zoneIdx = Math.min(STOPS.length - 1, Math.round(x - 0.05));
      setActive(zoneIdx);
    } else { jPose = stopPose(mobSel); zoneIdx = mobSel; }
  }
  const pose = jPose ? lerpPose({ ...OVERVIEW, rot: jPose.rot }, jPose, w) : OVERVIEW;
  const k = reduced ? 1 : 1 - Math.exp(-dt * 3.2);
  cam.pos.lerp(pose.pos, k); cam.target.lerp(pose.target, k);

  // Drehung: frei, bis die Kamerafahrt beginnt; dann in die Profil-Ansicht des Abschnitts
  if (jPose && w > 0.02) {
    const tgt = jPose.rot + Math.PI * 2 * Math.round((spineRot - jPose.rot) / (Math.PI * 2));
    spineRot += (tgt - spineRot) * (reduced ? 1 : 1 - Math.exp(-dt * 2.6));
  } else if (!reduced) spineRot += dt * 0.22;
  uniforms.uSpineRot.value = spineRot;
  spineRoot.position.set(X.x, X.y, X.z); spineRoot.scale.setScalar(X.w); spineRoot.rotation.y = spineRot;
  warmL.position.set(X.x + 1.5, X.y - 2.2 * X.w, 2.5);

  // Hervorhebung des Abschnitts (Bernstein) und wachsende Nervenwurzeln
  const zone = w > 0.5 ? STOPS[zoneIdx].zone : null;
  sp.vertebrae.forEach((m) => {
    const h = m.userData.hl = (m.userData.hl || 0) + ((m.userData.zone === zone ? 1 : 0) - (m.userData.hl || 0)) * 0.08;
    m.material.color.copy(BONE).lerp(AMBER_SOFT, h);
    m.material.emissiveIntensity = h * 0.35;
  });
  const t = uniforms.uTime.value;
  cordMat.uniforms.uTime.value = t;
  Object.entries(rootMats).forEach(([z, m]) => {
    const on = zone === z ? 1 : 0;
    m.uniforms.uTime.value = t;
    m.uniforms.uActive.value += (on - m.uniforms.uActive.value) * 0.06;
    m.uniforms.uReveal.value += (on * 1.02 - m.uniforms.uReveal.value) * (on ? 0.035 : 0.12);
  });
}

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
const heads = [null, null, null, $('#d-title'), $('#laws')];
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
  updateAxis(dt);
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

  camera.position.copy(cam.pos); camera.lookAt(cam.target);
  if (renderer && !document.hidden) renderer.render(scene, camera);
}
gsap.ticker.add(tick);

// Intro
if (!reduced) {
  gsap.to(uniforms.uIntro, { value: 1, duration: 2.6, ease: 'expo.out', delay: 0.15 });
  gsap.from(['.hero .kicker', '.kinetic', '.hero-sub', '.hero .actions', '.meter', '.top'], { opacity: 0, y: 24, duration: 1.4, stagger: 0.09, ease: 'expo.out', delay: 0.5 });
}
