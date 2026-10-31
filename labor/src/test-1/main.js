// Testseite 1 · „Achse“ – 3D-Wirbelsäule, Kamerafahrt beim Scrollen, Praxis-Miniatur mit abhebbarem Dach.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import gsap from 'gsap';
import Lenis from 'lenis';
import { buildSpine, rootCurves } from '../shared/spine.js';
import { buildHouse, ROOMS } from './house.js';

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = matchMedia('(pointer: fine)').matches;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const smooth = (a, b, v) => { const t = clamp((v - a) / (b - a)); return t * t * (3 - 2 * t); };
const isDesktop = () => innerWidth > 920;

// ---------- Weiches Scrollen ----------
let lenis = null;
if (!reduced) {
  lenis = new Lenis({ lerp: 0.085, wheelMultiplier: 0.95, smoothWheel: true });
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
}
const scrollToY = (y) => (lenis ? lenis.scrollTo(y, { duration: 1.6 }) : scrollTo({ top: y }));
$$('a[href^="#"]').forEach((a) => a.addEventListener('click', (e) => {
  const t = $(a.getAttribute('href'));
  if (!t) return;
  e.preventDefault();
  scrollToY(t.getBoundingClientRect().top + scrollY - (a.getAttribute('href') === '#start' ? 0 : 0));
}));

// ---------- Renderer & Szene ----------
const canvas = $('#gl');
let renderer = null;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
} catch (e) { document.documentElement.classList.add('no-webgl'); }

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(30, innerWidth / innerHeight, 0.1, 200);
const DPR = Math.min(devicePixelRatio || 1, isDesktop() ? 1.75 : 1.5);

if (renderer) {
  renderer.setPixelRatio(DPR);
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.6;
}

// Licht: warmes Hauptlicht, kühles Gegenlicht (Petrol/Blau), Bernstein von unten
const key = new THREE.DirectionalLight(0xfff0dc, 2.3); key.position.set(6, 9, 8); scene.add(key);
const rim = new THREE.DirectionalLight(0x9cc8ea, 1.7); rim.position.set(-7, 2, -6); scene.add(rim);
scene.add(new THREE.HemisphereLight(0xfffaf0, 0xd9ccb2, 0.55));
const warm = new THREE.PointLight(0xC5811C, 8, 14, 1.6); warm.position.set(2.5, -3, 3); scene.add(warm);

// ---------- Wirbelsäule ----------
const boneBase = new THREE.MeshPhysicalMaterial({
  color: 0xF1ECE1, roughness: 0.5, clearcoat: 0.45, clearcoatRoughness: 0.35,
  sheen: 0.6, sheenRoughness: 0.55, sheenColor: new THREE.Color(0xffffff),
  emissive: new THREE.Color(0xC5811C), emissiveIntensity: 0,
});
const discMat = new THREE.MeshPhysicalMaterial({
  color: 0xBCD3DE, roughness: 0.32, clearcoat: 0.6, clearcoatRoughness: 0.25,
  emissive: new THREE.Color(0x3F86B5), emissiveIntensity: 0.05, transparent: true, opacity: 1,
});
const BONE = new THREE.Color(0xF1ECE1), AMBER_SOFT = new THREE.Color(0xDC9638);
const sp = buildSpine({ boneMaterial: () => boneBase.clone(), discMaterial: discMat });
const spineRoot = new THREE.Group();   // dreht sich
const spineOffset = new THREE.Group(); // zentriert
spineOffset.position.y = -sp.Ltot / 2;
spineOffset.add(sp.group);
spineRoot.add(spineOffset);
scene.add(spineRoot);

// Impuls-Shader für Rückenmark und Nervenwurzeln
const pulseVert = /* glsl */`
  varying vec2 vUv; varying vec3 vN; varying vec3 vV;
  void main(){ vUv=uv; vec4 mv=modelViewMatrix*vec4(position,1.); vN=normalize(normalMatrix*normal); vV=normalize(-mv.xyz); gl_Position=projectionMatrix*mv; }`;
const pulseFrag = /* glsl */`
  uniform float uTime; uniform float uActive; uniform float uSpeed; uniform float uFreq; uniform vec3 uBase; uniform vec3 uGlow; uniform float uOpacity; uniform float uReveal;
  varying vec2 vUv; varying vec3 vN; varying vec3 vV;
  void main(){
    if(vUv.x>uReveal) discard;
    float p=fract(vUv.x*uFreq-uTime*uSpeed);
    float band=smoothstep(0.,.06,p)*(1.-smoothstep(.06,.32,p));
    float fres=pow(1.-abs(dot(vN,vV)),2.);
    vec3 c=mix(uBase,uGlow,clamp(band*uActive*1.4+fres*.35,0.,1.));
    c+=uGlow*band*uActive*.6;
    gl_FragColor=vec4(c,uOpacity);
    #include <colorspace_fragment>
  }`;
function pulseMat(base, glow, speed, freq, active) {
  return new THREE.ShaderMaterial({
    vertexShader: pulseVert, fragmentShader: pulseFrag, transparent: true,
    uniforms: {
      uTime: { value: 0 }, uActive: { value: active }, uSpeed: { value: speed }, uFreq: { value: freq },
      uBase: { value: new THREE.Color(base) }, uGlow: { value: new THREE.Color(glow) }, uOpacity: { value: 1 }, uReveal: { value: 1 },
    },
  });
}
const cordCurve = new THREE.CatmullRomCurve3(sp.canal, false, 'centripetal');
const cordMat = pulseMat('#B7C9D1', '#3F86B5', 0.22, 3.0, 0.55);
const cord = new THREE.Mesh(new THREE.TubeGeometry(cordCurve, 420, 0.05, 10, false), cordMat);
sp.group.add(cord);
const rootMats = {};
const byZone = {};
rootCurves(sp).forEach((r) => (byZone[r.zone] ||= []).push(new THREE.TubeGeometry(r.curve, 40, 0.026, 8, false)));
Object.entries(byZone).forEach(([z, geos]) => {
  rootMats[z] = pulseMat('#8FB6CF', '#3F86B5', 0.8, 1.2, 0);
  rootMats[z].uniforms.uReveal.value = 0;
  sp.group.add(new THREE.Mesh(mergeGeometries(geos), rootMats[z]));
});

// Intro: Wirbel setzen sich von unten nach oben zusammen
const rnd = (a) => (Math.random() * 2 - 1) * a;
sp.vertebrae.forEach((m) => {
  m.userData.intro = {
    t: reduced ? 1 : 0,
    off: new THREE.Vector3(rnd(2.8) + 1.5, rnd(1.2) - 1.5, rnd(2.5)),
    q: new THREE.Quaternion().setFromEuler(new THREE.Euler(rnd(1.6), rnd(2.4), rnd(1.6))),
  };
});
sp.discs.forEach((d) => (d.userData.intro = { t: reduced ? 1 : 0 }));

// ---------- Praxis-Miniatur ----------
const house = buildHouse();
const HOUSE_POS = new THREE.Vector3(0, -34, 0);
house.group.position.copy(HOUSE_POS);
house.group.rotation.y = -0.12;
scene.add(house.group);
const sun = new THREE.DirectionalLight(0xfff7ee, 2.3);
sun.position.copy(HOUSE_POS).add(new THREE.Vector3(5, 11, 7));
sun.target.position.copy(HOUSE_POS);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -7, right: 7, top: 7, bottom: -7, near: 1, far: 30 });
sun.shadow.bias = -0.0006; sun.shadow.radius = 4;
scene.add(sun, sun.target);

// ---------- Kamera-Posen ----------
const tanH = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
const tmpV = new THREE.Vector3();
// Rahmt Ziel T aus Richtung dir mit Abstand d, verschoben auf Bildschirmanteil fx/fy (0..1)
function frame(T, dir, d, fx = 0.5, fy = 0.5) {
  const pos = T.clone().add(dir.clone().normalize().multiplyScalar(d));
  const fwd = T.clone().sub(pos).normalize();
  const right = new THREE.Vector3().crossVectors(fwd, new THREE.Vector3(0, 1, 0)).normalize();
  const up = new THREE.Vector3().crossVectors(right, fwd);
  const hh = d * tanH, hw = hh * camera.aspect;
  const shift = right.multiplyScalar(-(fx - 0.5) * 2 * hw).add(up.multiplyScalar((fy - 0.5) * 2 * hh));
  return { pos: pos.add(shift), target: T.clone().add(shift) };
}
// Weltpositionen von Wirbel-Gruppen (für Stopps) bei gegebener Drehung
function zoneCenter(ids, rotY) {
  const c = new THREE.Vector3();
  ids.forEach((id) => {
    const lv = sp.levels.find((l) => l.id === id);
    c.add(tmpV.copy(lv.center).add(spineOffset.position));
  });
  c.divideScalar(ids.length);
  return c.applyAxisAngle(new THREE.Vector3(0, 1, 0), rotY);
}
const STOPS = [
  { zone: 'c12', ids: ['C1', 'C2'], d: 5.6, az: 0.5 },
  { zone: 'c56', ids: ['C5', 'C6'], d: 6.2, az: -0.38 },
  { zone: 'th16', ids: ['Th2', 'Th3', 'Th4', 'Th5'], d: 7.6, az: 0.55 },
  { zone: 'l45', ids: ['L4', 'L5'], d: 7.2, az: -0.45 },
  { zone: 's1', ids: ['L5', 'S'], d: 7.6, az: 0.75 },
];
const PROFILE = -Math.PI / 2;

function heroPose() {
  const desk = isDesktop();
  const d = desk ? 18.5 : 20.5;
  return { ...frame(new THREE.Vector3(0, desk ? 0 : -0.6, 0), new THREE.Vector3(0, 0.08, 1), d, desk ? 0.7 : 0.9, desk ? 0.5 : 0.52), rot: -0.95 };
}
function stopPose(i) {
  const s = STOPS[i], rot = PROFILE + s.az;
  const T = zoneCenter(s.ids, rot);
  const desk = isDesktop();
  const d = s.d * (desk ? 1 : 1.55);
  return { ...frame(T, new THREE.Vector3(0, 0.12, 1), d, desk ? 0.68 : 0.5, desk ? 0.5 : 0.3), rot };
}
function housePose(q) {
  const desk = isDesktop();
  const overview = frame(HOUSE_POS.clone().add(new THREE.Vector3(0, 0.9, 0)), new THREE.Vector3(0.62, 0.62, 1), desk ? 25 : 34, desk ? 0.66 : 0.5, desk ? 0.5 : 0.32);
  const ri = roomIndex(q);
  if (q < 0.18) return overview;
  const c = house.center(ROOMS[ri].r).applyAxisAngle(new THREE.Vector3(0, 1, 0), house.group.rotation.y).add(HOUSE_POS);
  return frame(c, new THREE.Vector3(0.5, 1.15, 0.95), desk ? 8 : 15, desk ? 0.66 : 0.5, desk ? 0.5 : 0.2);
}
const roomIndex = (q) => clamp(Math.floor(((q - 0.18) / 0.82) * ROOMS.length), 0, ROOMS.length - 1);
function lerpPose(a, b, t) {
  return { pos: a.pos.clone().lerp(b.pos, t), target: a.target.clone().lerp(b.target, t), rot: a.rot !== undefined && b.rot !== undefined ? THREE.MathUtils.lerp(a.rot, b.rot, t) : (b.rot ?? a.rot) };
}

// ---------- Seitenelemente ----------
const hero = $('.hero'), journey = $('#wirbelsaeule'), services = $('#leistungen'), tour = $('#rundgang'), rules = $('#praxis');
const stops = $$('.stop'), segBtns = $$('.segnav button');
const prog = (el) => { const r = el.getBoundingClientRect(); return clamp(-r.top / Math.max(1, r.height - innerHeight)); };
const inView = (el) => { const r = el.getBoundingClientRect(); return r.bottom > 0 && r.top < innerHeight; };

segBtns.forEach((b) => b.addEventListener('click', () => {
  const i = +b.dataset.i, r = journey.getBoundingClientRect();
  const y = r.top + scrollY + (i / (STOPS.length - 1)) * (r.height - innerHeight) * 0.999 + (i === 0 ? 2 : 0);
  scrollToY(y);
}));
let activeStop = 0;
function setStop(i) {
  if (i === activeStop) return;
  activeStop = i;
  stops.forEach((s, k) => s.classList.toggle('is-active', k === i));
  segBtns.forEach((b, k) => b.classList.toggle('is-active', k === i));
}

// Räume
const roomBtns = $$('.rooms button'), roomPanel = $('#roomPanel');
let activeRoom = 0;
function setRoom(i) {
  if (i === activeRoom) return;
  activeRoom = i;
  roomBtns.forEach((b, k) => b.classList.toggle('is-active', k === i));
  roomPanel.innerHTML = `<h3>${ROOMS[i].n}</h3><p>${ROOMS[i].d}</p>`;
  roomPanel.classList.remove('swap'); void roomPanel.offsetWidth; roomPanel.classList.add('swap');
}
roomBtns.forEach((b) => b.addEventListener('click', () => {
  const i = +b.dataset.room, r = tour.getBoundingClientRect();
  const q = 0.18 + ((i + 0.5) / ROOMS.length) * 0.82;
  scrollToY(r.top + scrollY + q * (r.height - innerHeight));
}));

// Lineal
const rulerTicks = $('#rulerTicks'), rulerFill = $('#rulerFill'), ruler = $('.ruler');
const named = { C1: 'C1', C7: 'C7', Th6: 'Th6', Th12: 'Th12', L5: 'L5', S: 'S' };
sp.levels.forEach((lv) => {
  const li = document.createElement('li');
  if (named[lv.id]) li.innerHTML = `<span>${named[lv.id]}</span>`;
  rulerTicks.appendChild(li);
});
const ticks = $$('li', rulerTicks);

// Anatomische Beschriftungen im Hero
const labelsEl = $('#labels');
const LABELS = [['C1', 'Atlas'], ['C7', 'Vertebra prominens'], ['Th12', 'Brustwirbel 12'], ['L5', 'Lendenwirbel 5'], ['S', 'Os sacrum']].map(([id, txt]) => {
  const el = document.createElement('div');
  el.className = 'lbl';
  el.innerHTML = `<b>${id}</b>${txt}`;
  labelsEl.appendChild(el);
  return { id, el, mesh: sp.vertebrae.find((m) => m.userData.lv.id === id) };
});
const roomLabel = document.createElement('div');
roomLabel.className = 'lbl'; labelsEl.appendChild(roomLabel);

// Navigation
const top = $('#top');

// Leistungen: horizontale Spur (Desktop) / Wischen (mobil)
const track = $('#track');
let trackShift = 0;
function layoutServices() {
  const pin = isDesktop() && !reduced;
  services.classList.toggle('is-pinned', pin);
  if (pin) {
    trackShift = Math.max(0, track.scrollWidth - innerWidth);
    services.style.height = (innerHeight + trackShift * 1.05) + 'px';
  } else {
    services.style.height = '';
    track.style.transform = '';
  }
}

// Karten: leichte Neigung und Lichtfleck unter dem Mauszeiger
if (finePointer && !reduced) {
  $$('.card').forEach((c) => {
    c.addEventListener('pointermove', (e) => {
      const r = c.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      c.style.setProperty('--mx', x * 100 + '%'); c.style.setProperty('--my', y * 100 + '%');
      c.style.transform = `perspective(900px) rotateY(${(x - 0.5) * 7}deg) rotateX(${(0.5 - y) * 6}deg) translateY(-4px)`;
    });
    c.addEventListener('pointerleave', () => { c.style.transform = ''; });
  });
}

// Hausordnung: Schriftstärke wächst, wenn eine Zeile zur Bildmitte kommt
const paraEls = $$('.paragraphs li');

// ---------- Größe ----------
function resize() {
  const w = innerWidth, h = innerHeight;
  camera.aspect = w / h; camera.updateProjectionMatrix();
  if (renderer) renderer.setSize(w, h, false);
  layoutServices();
}
addEventListener('resize', resize);
resize();

// Zeiger
const ptr = { x: 0, y: 0, sx: 0, sy: 0 };
if (finePointer) addEventListener('pointermove', (e) => { ptr.x = e.clientX / innerWidth * 2 - 1; ptr.y = e.clientY / innerHeight * 2 - 1; });

// ---------- Hauptschleife ----------
const cam = { pos: new THREE.Vector3(), target: new THREE.Vector3(), rot: -0.95, init: false };
const clock = new THREE.Clock();
const homeQ = new THREE.Quaternion(), qTmp = new THREE.Quaternion();
const proj = new THREE.Vector3();
let lastMode = '';

function tick() {
  const dt = Math.min(clock.getDelta(), 0.05), t = clock.elapsedTime;
  const vh = innerHeight;
  const heroP = clamp(scrollY / vh);
  const jp = prog(journey), tq = prog(tour);
  const tourRect = tour.getBoundingClientRect();
  const servRect = services.getBoundingClientRect();
  const nearHouse = servRect.top < vh * 0.25; // ab hier liegt die Kamera beim Haus

  // Gewünschte Pose
  let pose, mode;
  if (!nearHouse) {
    mode = 'spine';
    const n = STOPS.length - 1, x = jp * n, i = Math.min(Math.floor(x), n - 1), f = x - i;
    const jPose = lerpPose(stopPose(i), stopPose(i + 1), smooth(0.25, 0.85, f));
    pose = heroP < 1 ? lerpPose(heroPose(), stopPose(0), smooth(0, 1, heroP)) : jPose;
    setStop(Math.min(n, Math.round(x - 0.05)));
  } else {
    mode = 'house';
    pose = housePose(tq);
    setRoom(roomIndex(tq));
  }

  // Kamera folgt weich (Kamerafahrt); beim Szenenwechsel unter verdeckter Fläche: springen
  const coveredForSwitch = servRect.top < 0 && servRect.bottom > vh;
  const k = reduced || !cam.init || (mode !== lastMode && coveredForSwitch) ? 1 : 1 - Math.exp(-dt * 3.2);
  cam.pos.lerp(pose.pos, k); cam.target.lerp(pose.target, k);
  if (pose.rot !== undefined) cam.rot = THREE.MathUtils.lerp(cam.rot, pose.rot, k);
  if (mode === lastMode || k === 1) lastMode = mode;
  cam.init = true;

  // Zeiger-Parallaxe
  ptr.sx += (ptr.x - ptr.sx) * 0.05; ptr.sy += (ptr.y - ptr.sy) * 0.05;
  const idle = reduced ? 0 : Math.sin(t * 0.35) * 0.18 * (1 - heroP);
  spineRoot.rotation.y = cam.rot + idle + ptr.sx * 0.22;
  spineRoot.rotation.x = ptr.sy * 0.04;
  camera.position.copy(cam.pos);
  camera.lookAt(cam.target);

  // Intro-Zusammenbau
  sp.vertebrae.forEach((m) => {
    const it = m.userData.intro;
    if (it.t < 1) {
      const e = it.t;
      m.position.copy(m.userData.home).addScaledVector(it.off, 1 - e);
      qTmp.copy(it.q).slerp(homeQ.identity(), e);
      m.quaternion.copy(m.userData.homeQ).multiply(qTmp);
    } else if (!it.done) { m.position.copy(m.userData.home); m.quaternion.copy(m.userData.homeQ); it.done = true; }
  });
  sp.discs.forEach((d) => { const s = 0.001 + d.userData.intro.t; d.scale.setScalar(s); });

  // Aktive Zone hervorheben (Bernstein), im Hero wandert ein sanfter Impuls nach unten
  const activeZone = mode === 'spine' && heroP > 0.6 ? STOPS[activeStop].zone : null;
  const wave = (t * 0.22) % 1.4;
  sp.vertebrae.forEach((m, i) => {
    const inZone = activeZone && m.userData.zone === activeZone;
    const u = i / sp.vertebrae.length;
    const heroGlow = activeZone || reduced ? 0 : Math.max(0, 1 - Math.abs(u - wave) * 9) * (1 - heroP);
    const h = m.userData.hl = (m.userData.hl || 0) + ((inZone ? 1 : heroGlow * 0.55) - (m.userData.hl || 0)) * 0.08;
    m.material.color.copy(BONE).lerp(AMBER_SOFT, h);
    m.material.emissiveIntensity = h * 0.22;
  });
  Object.entries(rootMats).forEach(([z, mtl]) => {
    mtl.uniforms.uTime.value = t;
    const target = activeZone === z ? 1 : 0;
    mtl.uniforms.uActive.value += (target - mtl.uniforms.uActive.value) * 0.06;
    mtl.uniforms.uReveal.value += (target * 1.02 - mtl.uniforms.uReveal.value) * (target ? 0.035 : 0.12);
  });
  cordMat.uniforms.uTime.value = t;

  // Haus: Dach hebt sich, aktiver Raum leuchtet
  const lift = smooth(0.03, 0.2, tq);
  house.roof.position.y = house.roof.userData.baseY + lift * lift * 7;
  house.roof.rotation.z = lift * 0.1;
  const fade = smooth(0.45, 1, lift);
  house.roof.userData.mat.opacity = 1 - fade;
  house.roof.userData.mat.depthWrite = fade < 0.5;
  house.roof.userData.edges.opacity = 1 - fade;
  house.roof.visible = fade < 0.999;
  house.floors.forEach((f, i) => {
    const target = mode === 'house' && tq > 0.18 && i === activeRoom ? 0.2 + Math.sin(t * 2.4) * 0.05 : 0;
    f.material.emissiveIntensity += (target - f.material.emissiveIntensity) * 0.1;
  });
  spineRoot.visible = camera.position.y > -20;
  house.group.visible = camera.position.y < -14;

  // Beschriftungen
  const showLabels = isDesktop() && heroP < 0.25 && sp.vertebrae[0].userData.intro.t > 0.95;
  LABELS.forEach((L) => {
    L.mesh.getWorldPosition(proj); proj.project(camera);
    const x = (proj.x * 0.5 + 0.5) * innerWidth, y = (-proj.y * 0.5 + 0.5) * vh;
    L.el.style.transform = `translate(${x + 46}px, ${y - 6}px)`;
    L.el.style.opacity = showLabels ? 1 - heroP * 4 : 0;
  });
  const showRoom = mode === 'house' && tq > 0.2 && tq < 0.995 && isDesktop();
  if (showRoom) {
    const c = house.center(ROOMS[activeRoom].r).applyAxisAngle(new THREE.Vector3(0, 1, 0), house.group.rotation.y).add(HOUSE_POS);
    c.y += 1.1; c.project(camera);
    roomLabel.style.transform = `translate(${(c.x * 0.5 + 0.5) * innerWidth - 20}px, ${(-c.y * 0.5 + 0.5) * vh}px)`;
    roomLabel.innerHTML = `<b>${String(activeRoom + 1).padStart(2, '0')}</b>${ROOMS[activeRoom].n.split(' ·')[0].split(' –')[0]}`;
  }
  roomLabel.style.opacity = showRoom ? 1 : 0;

  // Leistungen horizontal
  if (services.classList.contains('is-pinned')) {
    const p = prog(services);
    track.style.transform = `translate3d(${-p * trackShift}px,0,0)`;
  }

  // Hausordnung
  if (!reduced) paraEls.forEach((li) => {
    const r = li.getBoundingClientRect(), c = (r.top + r.height / 2 - vh / 2) / (vh * 0.42);
    const k2 = 1 - clamp(Math.abs(c));
    li.style.setProperty('--w', Math.round(260 + 560 * k2));
    li.style.opacity = 0.35 + 0.65 * k2;
  });

  // Navigation & Lineal
  top.classList.toggle('scrolled', scrollY > 30);
  const rr = rules.getBoundingClientRect();
  top.classList.toggle('on-dark', rr.top < 60 && rr.bottom > 60);
  ruler.style.opacity = servRect.top > vh * 0.5 ? 1 : 0;
  const pp = clamp(scrollY / Math.max(1, journey.offsetTop + journey.offsetHeight - vh));
  rulerFill.style.transform = `scaleY(${pp})`;
  ticks.forEach((li, i) => li.classList.toggle('on', i / (ticks.length - 1) <= pp));

  // Rendern nur, wenn die Bühne sichtbar ist
  const visible = inView(hero) || inView(journey) || inView(tour) || servRect.top > 0;
  if (renderer && visible && !document.hidden) renderer.render(scene, camera);
}
gsap.ticker.add(tick);

// ---------- Intro ----------
if (!reduced) {
  sp.vertebrae.slice().reverse().forEach((m, i) => {
    gsap.to(m.userData.intro, { t: 1, duration: 1.9, delay: 0.25 + i * 0.045, ease: 'expo.out' });
  });
  sp.discs.slice().reverse().forEach((d, i) => gsap.to(d.userData.intro, { t: 1, duration: 1.2, delay: 0.9 + i * 0.045, ease: 'back.out(2)' }));
  gsap.fromTo('.hero-title .w', { yPercent: 108, '--w': 300 }, { yPercent: 0, '--w': 800, duration: 1.5, stagger: 0.09, ease: 'expo.out', delay: 0.1 });
  gsap.from(['.hero .eyebrow', '.hero-sub', '.hero .actions', '.facts', '.scroll-hint', '.top'], { opacity: 0, y: 18, duration: 1.2, stagger: 0.08, ease: 'expo.out', delay: 0.55 });
}
