// Testseite „Wirbelsäule · realistisch“ (Auftrag Kai 11.11.2026): beleuchtetes Knochenmodell zum Drehen (Maus/Finger),
// Abschnitte mit Beschreibung (Texte wie Puls · Scan Kapitel 03), Nervenimpulse als fließende Partikel.
// Eigene Quelle, Puls/Fusion bleiben unberührt. Debug im Browser: window.__real
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { runSliced } from '../shared/slice.js';
import { layout, meshGen, discShape, nerves, tube } from './bone.js';

const $ = (id) => document.getElementById(id);
const html = document.documentElement;
const mob = matchMedia('(max-width:920px)').matches;
const reducedMq = matchMedia('(prefers-reduced-motion:reduce)');

// ---------- Abschnitte (Inhalt = Karten aus Puls · Scan, Kapitel 03) ----------
const SEGS = [
  { no: 'C1–C2', short: 'Kopfgelenke', title: 'Kopfgelenke', ids: ['C1', 'C2'], roots: ['C2'], own: ['C1', 'C2'],
    nerv: 'Nn. suboccipitales und N. occipitalis major versorgen Hinterkopf und tiefe Nackenmuskulatur.', typ: 'Vom Nacken aufsteigender Spannungskopfschmerz, Schwindelgefühl, eingeschränktes Kopfdrehen.', peri: 'Hinterkopf · Nacken', chips: ['Atlas-Axis-Therapie', 'Manuelle Therapie', 'Fango'] },
  { no: 'C5–C6', short: 'Hals', title: 'Halswirbelsäule', ids: ['C5', 'C6'], roots: ['C5', 'C6'], own: ['C3', 'C4', 'C5', 'C6', 'C7'],
    nerv: 'Wurzeln u. a. für Bizeps und Schulterheber, Gefühl außen am Arm bis zum Daumen.', typ: 'Ausstrahlung über die Armaußenseite bis in den Daumen, Kribbeln, Schwächegefühl beim Beugen.', peri: 'Armaußenseite · Daumen', chips: ['Manuelle Therapie', 'Schlingentisch', 'Krankengymnastik'] },
  { no: 'Th1–Th6', short: 'Brust oben', title: 'Brustwirbelsäule', ids: ['Th1', 'Th2', 'Th3', 'Th4', 'Th5', 'Th6'], roots: ['Th1', 'Th2', 'Th3', 'Th4', 'Th5', 'Th6'], own: ['Th1', 'Th2', 'Th3', 'Th4', 'Th5', 'Th6'],
    nerv: 'Interkostalnerven der oberen Rippen versorgen Brustkorbwand und Zwischenrippenmuskeln.', typ: 'Blockaden mit atemabhängigem Stechen, Schmerz zwischen den Schulterblättern, „Rippenklemme“.', peri: 'Brustkorb · Zwischenrippen', chips: ['Manuelle Therapie', 'Lojer Manuthera', 'Fango'] },
  { no: 'Th7–Th12', short: 'Brust unten', title: 'Untere Brustwirbelsäule', ids: ['Th7', 'Th8', 'Th9', 'Th10', 'Th11', 'Th12'], roots: ['Th7', 'Th8', 'Th9', 'Th10', 'Th11', 'Th12'], own: ['Th7', 'Th8', 'Th9', 'Th10', 'Th11', 'Th12'],
    nerv: 'Untere Zwischenrippennerven und Nerven der Bauchwand. Th10 versorgt die Haut etwa auf Nabelhöhe.', typ: 'Gürtelförmig ausstrahlender Schmerz am Rippenbogen, Steifigkeit am Übergang zur Lendenwirbelsäule (Th12/L1).', peri: 'Rippenbogen · Bauchwand', chips: ['Manuelle Therapie', 'Krankengymnastik', 'Fango'] },
  { no: 'L4–L5', short: 'Lende', title: 'Lendenwirbelsäule', ids: ['L4', 'L5'], roots: ['L4', 'L5'], own: ['L1', 'L2', 'L3', 'L4', 'L5'],
    nerv: 'Wurzeln Richtung N. ischiadicus. L5 hebt den Fuß, Gefühl am Schienbein bis zur Großzehe.', typ: 'Bandscheiben-Region: Ausstrahlung ins Bein, Kribbeln am Schienbein, Fußheber-Schwäche.', peri: 'Schienbein · Großzehe', chips: ['Schlingentisch', 'Schmerztherapie', 'Krankengymnastik'] },
  { no: 'S1 · ISG', short: 'Becken', title: 'Kreuzbein & Becken', ids: ['S'], roots: ['S1'], own: ['S', 'Co'],
    nerv: 'S1-Wurzel für Wade, Fußaußenrand und Achillessehnenreflex. Das Iliosakralgelenk verbindet Becken und Wirbelsäule.', typ: 'Ausstrahlung über die Beinrückseite bis zur Ferse, tiefsitzender einseitiger Kreuzschmerz.', peri: 'Wade · Ferse · Fußaußenrand', chips: ['Manuelle Therapie / ISG', 'Sport-Physiotherapie', 'Stoßwelle'] },
];
const segOf = (id) => SEGS.findIndex((s) => s.own.includes(id));
const NAMES = { C1: 'Atlas (1. Halswirbel)', C2: 'Axis (2. Halswirbel)', S: 'Kreuzbein', Co: 'Steißbein' };
const nameOf = (id) => NAMES[id] || (id.startsWith('C') ? `${id.slice(1)}. Halswirbel` : id.startsWith('Th') ? `${id.slice(2)}. Brustwirbel` : `${id.slice(1)}. Lendenwirbel`);

// ---------- Oberfläche (funktioniert auch ohne 3D) ----------
const segsEl = $('segs'), card = $('card');
let sel = -1;
const esc = (s) => s.replace(/&/g, '&amp;');
function renderCard() {
  if (sel < 0) {
    card.innerHTML = '<p class="no">Übersicht</p><h2>24 Wirbel, 23 Bandscheiben, 31 Nervenpaare</h2><p>Wählen Sie einen Abschnitt oder tippen Sie direkt auf einen Wirbel.</p><p>Die leuchtenden Punkte zeigen, wie Nervenimpulse fließen: vom Gehirn durch das Rückenmark hinaus zum Muskel – und als Gefühl wieder zurück.</p>';
    return;
  }
  const s = SEGS[sel];
  card.innerHTML = `<p class="no">${s.no}</p><h2>${esc(s.title)}</h2><dl><dt>Nerven</dt><dd>${s.nerv}</dd><dt>Typisch</dt><dd>${s.typ}</dd></dl><p class="peri">Versorgung: ${s.peri}</p><ul class="chips">${s.chips.map((c) => `<li>${c}</li>`).join('')}</ul>`;
}
const segBtns = SEGS.map((s, i) => {
  const b = document.createElement('button');
  b.type = 'button'; b.setAttribute('aria-pressed', 'false');
  b.innerHTML = `${s.no}<span>${s.short}</span>`;
  b.addEventListener('click', () => select(sel === i ? -1 : i));
  segsEl.appendChild(b);
  return b;
});
const allBtn = document.createElement('button');
allBtn.type = 'button'; allBtn.className = 'all'; allBtn.textContent = 'Ganze Wirbelsäule';
allBtn.addEventListener('click', () => select(-1, true));
segsEl.appendChild(allBtn);
let onSelect = () => {};
function select(i, refit = false) {
  const same = i === sel;
  sel = i;
  segBtns.forEach((b, j) => b.setAttribute('aria-pressed', j === i ? 'true' : 'false'));
  renderCard();
  if (mob && i >= 0) segBtns[i].scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
  if (!same || refit) onSelect(refit);
}
renderCard();

// ---------- Bewegung anhalten (gilt für alle Labor-Seiten, hop-motion) ----------
let stored = null;
try { stored = localStorage.getItem('hop-motion'); } catch (e) { /* ohne Speicher */ }
let paused = stored === 'paused' || (stored == null && reducedMq.matches);
const optMotion = $('optMotion');
function setPaused(v, save) {
  paused = v;
  optMotion.setAttribute('aria-pressed', v ? 'true' : 'false');
  optMotion.textContent = v ? 'Bewegung fortsetzen' : 'Bewegung anhalten';
  if (save) try { localStorage.setItem('hop-motion', v ? 'paused' : 'on'); } catch (e) { /* ohne Speicher */ }
}
setPaused(paused, false);
optMotion.addEventListener('click', () => { setPaused(!paused, true); need = true; });
let need = true; // neu zeichnen

// ---------- 3D ----------
const canvas = $('gl'), stage = $('stage');
let renderer = null;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
} catch (e) { renderer = null; }
if (!renderer) { html.classList.add('no-gl'); }
else start();

function start() {
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.02;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  const pm = new THREE.PMREMGenerator(renderer);
  scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.32;
  pm.dispose();
  const FOV = 30, tanH = Math.tan(THREE.MathUtils.degToRad(FOV / 2));
  const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 80);

  const sp = layout();
  const HALF = sp.total / 2;
  const spine = new THREE.Group();
  spine.position.y = -HALF + 0.12;
  scene.add(spine);
  const FLOOR = -HALF - 0.42;

  // Licht: hängt an der Kamera (wie ein Studio, in dem sich das Modell dreht) → immer plastisch, Schatten wandern beim Drehen
  const key = new THREE.DirectionalLight(0xfff0dc, 2.7);
  key.castShadow = true;
  key.shadow.mapSize.set(mob ? 1024 : 2048, mob ? 1024 : 2048);
  const sc = key.shadow.camera; sc.left = -3.2; sc.right = 3.2; sc.top = 4.6; sc.bottom = -4.6; sc.near = 1; sc.far = 30;
  key.shadow.bias = -0.0006; key.shadow.normalBias = 0.012; key.shadow.radius = 3;
  const rim = new THREE.DirectionalLight(0x9cc8ff, 1.5);
  const fill = new THREE.HemisphereLight(0xd6dde2, 0x241a12, 0.5);
  scene.add(key, key.target, rim, rim.target, fill);

  // Boden: fängt nur den Schatten, darunter ein weicher Lichtfleck
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), new THREE.ShadowMaterial({ opacity: 0.5 }));
  floor.rotation.x = -Math.PI / 2; floor.position.y = FLOOR; floor.receiveShadow = true;
  const pool = new THREE.Mesh(new THREE.CircleGeometry(7, 48), new THREE.ShaderMaterial({
    transparent: true, depthWrite: false,
    vertexShader: 'varying vec2 vU;void main(){vU=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader: 'varying vec2 vU;void main(){float d=length(vU-.5)*2.;float a=pow(max(0.,1.-d),2.2);gl_FragColor=vec4(vec3(.62,.72,.78),a*.2);}',
  }));
  pool.rotation.x = -Math.PI / 2; pool.position.y = FLOOR - 0.002; pool.renderOrder = -2;
  floor.renderOrder = -1;
  scene.add(pool, floor);

  // ---------- Material ----------
  const uGhost = { value: 0 };
  const NOISE = `
    float hN(vec3 p){p=fract(p*.3183099+.1);p*=17.;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}
    float vN(vec3 x){vec3 i=floor(x),f=fract(x);f=f*f*(3.-2.*f);
      return mix(mix(mix(hN(i),hN(i+vec3(1,0,0)),f.x),mix(hN(i+vec3(0,1,0)),hN(i+vec3(1,1,0)),f.x),f.y),
                 mix(mix(hN(i+vec3(0,0,1)),hN(i+vec3(1,0,1)),f.x),mix(hN(i+vec3(0,1,1)),hN(i+vec3(1,1,1)),f.x),f.y),f.z);}
    float bN(vec3 p){return vN(p)*.55+vN(p*2.3+7.)*.3+vN(p*5.1+3.)*.15;}`;
  // Knochen: feine Poren (Relief aus Rauschen), leichte Farbflecken, „durchsichtig“ = nur der Umriss bleibt (Fresnel)
  function surface(mat, freq, bump) {
    mat.onBeforeCompile = (sh) => {
      sh.uniforms.uGhost = uGhost;
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vOP;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvOP=position;');
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', `#include <common>\nvarying vec3 vOP;uniform float uGhost;${NOISE}`)
        .replace('#include <color_fragment>', `#include <color_fragment>\nfloat nB=bN(vOP*${freq.toFixed(1)});diffuseColor.rgb*=.9+.2*bN(vOP*${(freq * 0.11).toFixed(2)}+11.);diffuseColor.rgb*=mix(vec3(.93,.9,.84),vec3(1.),smoothstep(.3,.62,nB));`)
        .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
          {vec3 sp=-vViewPosition;vec3 dpx=dFdx(sp),dpy=dFdy(sp);vec3 r1=cross(dpy,normal),r2=cross(normal,dpx);float det=dot(dpx,r1);
          vec3 gr=sign(det)*(dFdx(nB)*r1+dFdy(nB)*r2);normal=normalize(abs(det)*normal-${bump.toFixed(4)}*gr);}
          diffuseColor.a*=mix(1.,.13+.8*pow(1.-abs(dot(normal,normalize(vViewPosition))),1.3),uGhost);`);
    };
    mat.customProgramCacheKey = () => `bone${freq}`;
    return mat;
  }
  const boneMat = () => surface(new THREE.MeshStandardMaterial({ color: 0xEDE3CC, roughness: 0.62, metalness: 0, vertexColors: true, emissive: 0xE08A20, emissiveIntensity: 0 }), 120, 0.0035);
  const discMat = () => surface(new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.46, metalness: 0, vertexColors: true, emissive: 0xE08A20, emissiveIntensity: 0 }), 60, 0.004);
  const nerveMat = () => new THREE.MeshStandardMaterial({ color: 0xE9CF72, roughness: 0.42, metalness: 0, emissive: 0xFFA030, emissiveIntensity: 0 });

  // ---------- Nerven: Rückenmark + Wurzeln ----------
  const nv = nerves(sp);
  const nerveGroup = new THREE.Group();
  spine.add(nerveGroup);
  const cordCurve = new THREE.CatmullRomCurve3(nv.cordPts, false, 'centripetal');
  const cord = new THREE.Mesh(tube(cordCurve, 160, 14, (t) => (t < 0.012 ? 0.075 * Math.sqrt(1 - (1 - t / 0.012) ** 2) + 0.001 : t < 0.06 ? 0.075 - (t - 0.012) * 0.4 : t > 0.9 ? 0.05 * (1 - (t - 0.9) / 0.1) + 0.012 : 0.05 + 0.006 * Math.sin(t * 9))), nerveMat());
  cord.castShadow = true;
  nerveGroup.add(cord);
  const SAMPLES = 120;
  const paths = []; // je Wurzel: Weg Gehirn → Rückenmark → Wurzelspitze, gleichmäßig abgetastet
  nv.roots.forEach((r) => {
    const c = new THREE.CatmullRomCurve3(r.pts, false, 'centripetal');
    const m = new THREE.Mesh(tube(c, Math.max(28, r.pts.length * 9), 8, (t) => r.rad * (t < 0.08 ? 0.55 + t * 5.6 : 1 - 0.55 * Math.max(0, (t - 0.72) / 0.28))), nerveMat());
    m.castShadow = !mob;
    m.userData = { root: r.name };
    nerveGroup.add(m);
    const head = r.li < 90 && r.li + 2 <= nv.cordPts.length - 1 ? nv.cordPts.slice(0, r.li + 1) : nv.cordPts.slice(0, -1);
    const full = new THREE.CatmullRomCurve3([...head, ...r.pts], false, 'centripetal');
    const pts = new Float32Array((SAMPLES + 1) * 3);
    for (let i = 0; i <= SAMPLES; i++) { const p = full.getPointAt(i / SAMPLES); pts[i * 3] = p.x; pts[i * 3 + 1] = p.y; pts[i * 3 + 2] = p.z; }
    paths.push({ pts, len: full.getLength(), name: r.name, mesh: m });
  });

  // ---------- Nervenimpulse: Partikel-Ketten entlang der Wege ----------
  const NIMP = mob ? 150 : 260, TRAIL = 7, NP = NIMP * TRAIL;
  const iPos = new Float32Array(NP * 3), iCol = new Float32Array(NP * 3), iSize = new Float32Array(NP), iJit = new Float32Array(NP * 3);
  const imp = [];
  const C_MOT = [1.0, 0.62, 0.2], C_SEN = [0.42, 0.78, 1.0];
  let selPaths = [];
  function spawn(k, fresh) {
    const o = imp[k] || (imp[k] = {});
    const pool = selPaths.length && Math.random() < 0.8 ? selPaths : paths;
    o.p = pool[(Math.random() * pool.length) | 0];
    o.dir = Math.random() < 0.58 ? 1 : -1;
    o.v = (1.7 + Math.random() * 1.5) / o.p.len;
    o.s = fresh ? Math.random() : 0;
    o.gap = (0.03 + Math.random() * 0.02) / o.p.len;
    const c = o.dir > 0 ? C_MOT : C_SEN;
    for (let j = 0; j < TRAIL; j++) {
      const q = k * TRAIL + j, f = 1 - j / TRAIL;
      iCol[q * 3] = c[0] * f; iCol[q * 3 + 1] = c[1] * f; iCol[q * 3 + 2] = c[2] * f;
      iSize[q] = (j === 0 ? 1.5 : 1) * (0.55 + 0.45 * f);
    }
  }
  for (let k = 0; k < NIMP; k++) spawn(k, true);
  for (let q = 0; q < NP; q++) { const a = Math.random() * 6.283, r = 0.006 + Math.random() * 0.016; iJit[q * 3] = Math.cos(a) * r; iJit[q * 3 + 1] = (Math.random() - 0.5) * 0.02; iJit[q * 3 + 2] = Math.sin(a) * r; }
  const iGeo = new THREE.BufferGeometry();
  iGeo.setAttribute('position', new THREE.BufferAttribute(iPos, 3).setUsage(THREE.DynamicDrawUsage));
  iGeo.setAttribute('aCol', new THREE.BufferAttribute(iCol, 3).setUsage(THREE.DynamicDrawUsage));
  iGeo.setAttribute('aSize', new THREE.BufferAttribute(iSize, 1).setUsage(THREE.DynamicDrawUsage));
  iGeo.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, HALF, 0), HALF + 3);
  const impU = { uPx: { value: 1 }, uOp: { value: 1 } };
  const impMat = (through) => new THREE.ShaderMaterial({
    uniforms: { ...impU, uThrough: { value: through } }, transparent: true, depthWrite: false, depthTest: !through, blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor, blendSrcAlpha: THREE.ZeroFactor, blendDstAlpha: THREE.OneFactor,
    vertexShader: 'attribute vec3 aCol;attribute float aSize;uniform float uPx;varying vec3 vC;void main(){vC=aCol;vec4 mv=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*mv;gl_PointSize=aSize*uPx/-mv.z;}',
    fragmentShader: 'uniform float uOp,uThrough;varying vec3 vC;void main(){float d=length(gl_PointCoord-.5)*2.;float a=pow(max(0.,1.-d),2.)+.6*pow(max(0.,1.-d*2.6),2.);gl_FragColor=vec4(vC*a*uOp*mix(1.,.07,uThrough),1.);}',
  });
  const impA = new THREE.Points(iGeo, impMat(0)), impB = new THREE.Points(iGeo, impMat(1)); // B schimmert schwach durch den Knochen
  impA.renderOrder = 5; impB.renderOrder = 4;
  spine.add(impA, impB);
  let impOn = true, impK = 1;
  function stepImpulses(dt) {
    for (let k = 0; k < NIMP; k++) {
      const o = imp[k];
      o.s += o.v * dt;
      if (o.s > 1 + o.gap * TRAIL) { spawn(k, false); }
      const P = o.p.pts;
      for (let j = 0; j < TRAIL; j++) {
        const q = k * TRAIL + j;
        let s = o.s - j * o.gap;
        const vis = s >= 0 && s <= 1;
        s = Math.min(Math.max(s, 0), 1);
        const u = (o.dir > 0 ? s : 1 - s) * SAMPLES, i0 = Math.min(u | 0, SAMPLES - 1), f = u - i0;
        const a = i0 * 3, b = a + 3;
        if (vis) { iPos[q * 3] = P[a] + (P[b] - P[a]) * f + iJit[q * 3]; iPos[q * 3 + 1] = P[a + 1] + (P[b + 1] - P[a + 1]) * f + iJit[q * 3 + 1]; iPos[q * 3 + 2] = P[a + 2] + (P[b + 2] - P[a + 2]) * f + iJit[q * 3 + 2]; }
        else { iPos[q * 3 + 1] = -999; }
      }
    }
    iGeo.attributes.position.needsUpdate = true; iGeo.attributes.aCol.needsUpdate = true; iGeo.attributes.aSize.needsUpdate = true;
  }
  stepImpulses(0);

  // ---------- Knochen aufbauen (in Zeitscheiben, von oben nach unten sichtbar) ----------
  const bones = [], discs = [], pick = [];
  const q = mob ? 1.4 : 1;
  const cellOf = (lv) => Math.min(Math.max(lv.W / 34, 0.0064), 0.0135) * q;
  const loading = $('loading'), loadPct = $('loadPct');
  let built = 0;
  function* buildAll() {
    const L = sp.levels;
    for (let i = 0; i < L.length; i++) {
      const lv = L[i];
      const g = yield* meshGen(lv.shape, lv.reg === 's' ? 0.0125 * q : cellOf(lv));
      const m = new THREE.Mesh(g, boneMat());
      m.position.copy(lv.center); m.quaternion.copy(lv.quat);
      m.castShadow = true; m.receiveShadow = true;
      m.userData = { id: lv.id, lv, fade: 0 };
      m.material.transparent = true; m.material.opacity = 0;
      spine.add(m); bones.push(m); pick.push(m);
      if (lv.discPos) {
        const dg = yield* meshGen(discShape(lv, L[i + 1]), cellOf(lv) * 1.1, [0.74, 0.8, 0.82]);
        const d = new THREE.Mesh(dg, discMat());
        d.position.copy(lv.discPos); d.quaternion.copy(lv.discQuat);
        d.castShadow = true; d.receiveShadow = true;
        d.userData = { disc: `${lv.id}/${L[i + 1].id === 'S' ? 'S1' : L[i + 1].id}`, id: lv.id, fade: 0 };
        d.material.transparent = true; d.material.opacity = 0;
        spine.add(d); discs.push(d); pick.push(d);
      }
      built = (i + 1) / L.length;
      loadPct.textContent = `${Math.round(built * 100)} %`;
      need = true;
    }
  }
  const t0 = performance.now();
  runSliced(buildAll(), mob ? 10 : 12).then(() => {
    loading.classList.add('gone');
    api.buildMs = Math.round(performance.now() - t0);
    api.tris = pick.reduce((n, m) => n + m.geometry.index.count / 3, 0);
    api.ready = true;
  }).catch((e) => { console.error(e); loading.textContent = 'Aufbau fehlgeschlagen.'; });

  // ---------- Kamera / Bedienung ----------
  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true; controls.dampingFactor = 0.08;
  controls.enablePan = false;
  controls.minDistance = 1.1; controls.maxDistance = 34;
  controls.maxPolarAngle = Math.PI * 0.62; controls.minPolarAngle = Math.PI * 0.1;
  controls.rotateSpeed = mob ? 0.7 : 0.8; controls.zoomSpeed = 0.9;
  controls.autoRotateSpeed = 0.9;
  let W = 1, H = 1;
  const goal = { t: new THREE.Vector3(), d: 20, on: false };
  const tmp = new THREE.Vector3(), tmp2 = new THREE.Vector3();
  function frameFor(i) {
    let cy = 0.05, half = HALF + 0.55, halfW = 1.25;
    if (i >= 0) {
      const ids = SEGS[i].ids, ys = sp.levels.filter((l) => ids.includes(l.id)).map((l) => [l.center.y + l.H / 2, l.center.y - l.H / 2]).flat();
      const top = Math.max(...ys), bot = Math.min(...ys);
      cy = (top + bot) / 2 + spine.position.y;
      const zs = sp.levels.filter((l) => ids.includes(l.id)).map((l) => l.center.z);
      goal.t.set(0, cy, zs.reduce((a, b) => a + b, 0) / zs.length - 0.08);
      half = (top - bot) / 2 + (i === 5 ? 0.45 : 0.62); halfW = 0.95;
    } else goal.t.set(0, cy, -0.05);
    goal.d = Math.max(half / tanH, halfW / (tanH * (W / H)));
    goal.on = true;
  }
  function highlight() {
    const s = sel >= 0 ? SEGS[sel] : null;
    bones.forEach((m) => { m.userData.em = s && s.ids.includes(m.userData.id) ? 0.2 : 0; });
    discs.forEach((m) => { m.userData.em = 0; });
    selPaths = s ? paths.filter((p) => s.roots.includes(p.name)) : [];
    paths.forEach((p) => { p.mesh.userData.em = s && s.roots.includes(p.name) ? 0.55 : 0; });
  }
  let first = true;
  onSelect = () => {
    frameFor(sel); highlight();
    if (paused || first) snap();
    need = true;
  };
  function snap() {
    tmp.copy(camera.position).sub(controls.target).normalize();
    controls.target.copy(goal.t); camera.position.copy(goal.t).addScaledVector(tmp, goal.d);
    goal.on = false;
  }
  camera.position.set(Math.sin(0.7) * 20, 1.2, Math.cos(0.7) * 20);
  function resize() {
    const r = stage.getBoundingClientRect();
    const w = Math.max(1, Math.round(r.width)), h = Math.max(1, Math.round(r.height));
    if (w === W && h === H) return;
    W = w; H = h;
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
    impU.uPx.value = h * renderer.getPixelRatio() * 0.085 / (2 * tanH) * (mob ? 1.25 : 1);
    frameFor(sel);
    if (first || paused) snap();
    need = true;
  }
  new ResizeObserver(resize).observe(stage);
  resize(); highlight(); first = false;

  // Leerlauf: Modell dreht sich langsam, bis man es anfasst; danach nach einer Pause wieder
  let idleAt = 0, touching = false;
  const hint = $('hint');
  controls.addEventListener('start', () => { touching = true; hint.classList.add('gone'); });
  controls.addEventListener('end', () => { touching = false; idleAt = performance.now() + 7000; });
  controls.addEventListener('change', () => { need = true; });
  canvas.addEventListener('wheel', () => { goal.on = false; idleAt = performance.now() + 7000; hint.classList.add('gone'); }, { passive: true });
  let touches = 0;
  canvas.addEventListener('touchstart', (e) => { touches = e.touches.length; if (touches > 1) goal.on = false; }, { passive: true });

  // Antippen / Überfahren: Wirbel wählen, Name anzeigen
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  const tip = $('tip');
  let down = null, tipT = 0, hoverXY = null;
  function hit(x, y) {
    const r = canvas.getBoundingClientRect();
    ndc.set(((x - r.left) / r.width) * 2 - 1, -((y - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const h = ray.intersectObjects(pick, false)[0];
    return h ? { o: h.object, x: x - r.left, y: y - r.top } : null;
  }
  function showTip(h) {
    if (!h) { tip.classList.remove('on'); return; }
    const u = h.o.userData;
    tip.innerHTML = u.disc ? `<b>${u.disc}</b>Bandscheibe` : `<b>${u.id === 'S' || u.id === 'Co' ? '' : u.id}</b>${nameOf(u.id)}`;
    const tw = tip.offsetWidth;
    tip.style.transform = `translate(${Math.round(Math.min(Math.max(h.x + 14, 6), W - tw - 6))}px,${Math.round(Math.max(h.y - 38, 6))}px)`;
    tip.classList.add('on');
  }
  canvas.addEventListener('pointerdown', (e) => { down = { x: e.clientX, y: e.clientY, t: performance.now() }; tip.classList.remove('on'); });
  canvas.addEventListener('pointerup', (e) => {
    if (!down) return;
    const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y), dt = performance.now() - down.t;
    down = null;
    if (moved > 6 || dt > 600) return;
    const h = hit(e.clientX, e.clientY);
    if (!h) return;
    const i = segOf(h.o.userData.id);
    if (i >= 0 && i !== sel) select(i);
    showTip(h);
    clearTimeout(tipT);
    if (e.pointerType !== 'mouse') tipT = setTimeout(() => tip.classList.remove('on'), 2200);
  });
  canvas.addEventListener('pointermove', (e) => { if (e.pointerType === 'mouse' && !down) hoverXY = [e.clientX, e.clientY]; });
  canvas.addEventListener('pointerleave', () => { hoverXY = null; tip.classList.remove('on'); });

  // Schalter
  const optGhost = $('optGhost'), optNerve = $('optNerve'), legend = $('legend');
  let ghostWant = 0;
  optGhost.addEventListener('click', () => { ghostWant = ghostWant ? 0 : 1; optGhost.setAttribute('aria-pressed', ghostWant ? 'true' : 'false'); need = true; });
  optNerve.addEventListener('click', () => { impOn = !impOn; optNerve.setAttribute('aria-pressed', impOn ? 'true' : 'false'); legend.classList.toggle('off', !impOn); need = true; });

  // ---------- Bildschleife ----------
  let last = performance.now(), ghostSolid = true;
  function setSolid(solid) {
    ghostSolid = solid;
    pick.forEach((m) => { if (m.userData.fade >= 1) { m.material.transparent = !solid; m.material.depthWrite = solid; m.material.needsUpdate = true; } m.castShadow = solid; });
  }
  function tick(now) {
    requestAnimationFrame(tick);
    if (document.hidden) { last = now; return; }
    const dt = Math.min((now - last) / 1000, 0.1); last = now;
    const run = !paused;
    // Aufbau: neue Teile blenden ein
    let fading = false;
    for (const m of pick) {
      const u = m.userData;
      if (u.fade < 1) {
        u.fade = Math.min(1, u.fade + dt * (paused ? 99 : 2.2)); m.material.opacity = u.fade; fading = true;
        if (u.fade >= 1) { m.material.opacity = 1; m.material.transparent = !ghostSolid; m.material.depthWrite = ghostSolid; m.material.needsUpdate = true; }
      }
      const em = u.em || 0;
      if (Math.abs(m.material.emissiveIntensity - em) > 0.002) { m.material.emissiveIntensity += (em - m.material.emissiveIntensity) * Math.min(1, dt * 6); fading = true; }
    }
    for (const p of paths) { const mt = p.mesh.material, em = p.mesh.userData.em || 0; if (Math.abs(mt.emissiveIntensity - em) > 0.002) { mt.emissiveIntensity += (em - mt.emissiveIntensity) * Math.min(1, dt * 6); fading = true; } }
    // Knochen durchsichtig
    if (uGhost.value !== ghostWant) {
      if (ghostWant && ghostSolid) setSolid(false);
      uGhost.value = paused ? ghostWant : Math.min(1, Math.max(0, uGhost.value + (ghostWant ? 1 : -1) * dt * 1.8));
      if (!ghostWant && uGhost.value === 0) setSolid(true);
      fading = true;
    }
    // Kamera
    controls.autoRotate = run && !touching && now > idleAt;
    if (goal.on) {
      const k = 1 - Math.exp(-dt * 3.4);
      tmp.copy(camera.position).sub(controls.target);
      const d = tmp.length(); tmp.normalize();
      controls.target.lerp(goal.t, k);
      const nd = d + (goal.d - d) * k;
      camera.position.copy(controls.target).addScaledVector(tmp, nd);
      if (Math.abs(nd - goal.d) < 0.01 && controls.target.distanceTo(goal.t) < 0.005) goal.on = false;
      need = true;
    }
    controls.update();
    // Licht folgt der Kamera (oben links vorn), Gegenlicht von hinten rechts
    tmp.copy(camera.position).sub(controls.target).normalize();
    tmp2.crossVectors(camera.up, tmp).normalize();
    key.target.position.set(0, 0, -0.1);
    key.position.copy(key.target.position).addScaledVector(tmp, 7).addScaledVector(tmp2, -5).add(new THREE.Vector3(0, 13, 0));
    rim.target.position.copy(key.target.position);
    rim.position.copy(rim.target.position).addScaledVector(tmp, -8).addScaledVector(tmp2, 6).add(new THREE.Vector3(0, 3, 0));
    // Nervenimpulse
    const ik = impOn ? 1 : 0;
    if (impK !== ik) { impK += Math.sign(ik - impK) * Math.min(Math.abs(ik - impK), dt * 3); fading = true; }
    impU.uOp.value = impK;
    impA.visible = impB.visible = impK > 0.01;
    if (run && impK > 0.01) stepImpulses(dt);
    // Name unter der Maus
    if (hoverXY) { showTip(hit(hoverXY[0], hoverXY[1])); hoverXY = null; }
    if (run || need || fading || controls.autoRotate) { renderer.render(scene, camera); need = false; }
  }
  requestAnimationFrame(tick);

  const api = { nerveGroup, impA, impB, key, scene, camera, controls, sp, spine, bones, discs, paths, goal, uGhost, select, ready: false, get built() { return built; } };
  window.__real = api;
}
