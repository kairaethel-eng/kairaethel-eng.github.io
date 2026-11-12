// „Von Kopf bis Fuß“ – Vorschau „Glas“ (Auftrag Kai 12.11.2026, freie Hand ab „Hauptbauen“): eine Reise durch den Körper.
// 1) Kopf: Röntgen-Glas-Bild als lebende Bühne (Nervenpulse, Lichtband, Tiefe, Ränder lösen sich in Lichtfäden auf).
// 2) Kiefer und Nacken: das Bild fährt heran.
// 3) Wirbelsäule: alles außer der Wirbelsäule verlischt, ein gerechnetes 3D-Glasskelett entsteht deckungsgleich über dem Bild,
//    löst sich, dreht ins Halbprofil und wächst Wirbel für Wirbel. Abschnitte per Antippen.
// 4) Becken und Beine: Becken, Beine, Arme und die Glashülle der Figur wachsen von oben nach unten.
// 5) Füße: die Kamera kommt am Boden an, Nervensignale laufen bis in die Sohle, der Boden antwortet. Terminanfrage.
// Knochen: eigene Abstandsfunktionen (bones.js, sdf.js), kein fremdes 3D-Modell. Nur Scrollen und Antippen.
import * as THREE from 'three';
import { runSliced } from '../../shared/slice.js';
import { spineLevels, vertebraGeos, bodyGeos, discGeo, rootCurves, ribCurves, legNerve, joints } from './bones.js';
import { IMG, IMG_W, IMG_H } from './img.js';

const $ = (s) => document.querySelector(s);
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const smooth = (t) => { t = clamp(t); return t * t * (3 - 2 * t); };
const lerp = (a, b, t) => a + (b - a) * t;
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

// Begrüßung nach Tageszeit
const hr = new Date().getHours();
document.querySelectorAll('.gruss').forEach((e) => { e.textContent = hr < 11 ? 'Guten Morgen.' : hr < 18 ? 'Guten Tag.' : 'Guten Abend.'; });

// ---- Abschnitte der Wirbelsäule (Texte aus Puls · Scan, von Kai freigegeben) ----------------------
const TH = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => 'Th' + (a + i));
const SEG = [
  { ids: ['C1', 'C2'], no: 'C1–C2', title: 'Kopfgelenke', typ: 'Vom Nacken aufsteigender Spannungskopfschmerz, Schwindelgefühl, eingeschränktes Kopfdrehen.', peri: 'Hinterkopf · Nacken', ther: ['Atlas-Axis-Therapie', 'Manuelle Therapie', 'Fango'], zoom: 3.1 },
  { ids: ['C5', 'C6'], no: 'C5–C6', title: 'Halswirbelsäule', typ: 'Ausstrahlung über die Armaußenseite bis in den Daumen, Kribbeln, Schwächegefühl beim Beugen.', peri: 'Armaußenseite · Daumen', ther: ['Manuelle Therapie', 'Schlingentisch', 'Krankengymnastik'], zoom: 3.1 },
  { ids: TH(1, 6), no: 'Th1–Th6', title: 'Brustwirbelsäule', typ: 'Blockaden mit atemabhängigem Stechen, Schmerz zwischen den Schulterblättern, „Rippenklemme“.', peri: 'Brustkorb · Zwischenrippen', ther: ['Manuelle Therapie', 'Lojer Manuthera', 'Fango'], zoom: 1.9 },
  { ids: TH(7, 12), no: 'Th7–Th12', title: 'Untere Brustwirbelsäule', typ: 'Gürtelförmig ausstrahlender Schmerz am Rippenbogen, Steifigkeit am Übergang zur Lendenwirbelsäule (Th12/L1).', peri: 'Rippenbogen · Bauchwand', ther: ['Manuelle Therapie', 'Krankengymnastik', 'Fango'], zoom: 1.75 },
  { ids: ['L4', 'L5'], no: 'L4–L5', title: 'Lendenwirbelsäule', typ: 'Bandscheiben-Region: Ausstrahlung ins Bein, Kribbeln am Schienbein, Fußheber-Schwäche.', peri: 'Schienbein · Großzehe', ther: ['Schlingentisch', 'Schmerztherapie', 'Krankengymnastik'], zoom: 2.5 },
  { ids: ['S'], no: 'S1 · ISG', title: 'Kreuzbein & Becken', typ: 'Ausstrahlung über die Beinrückseite bis zur Ferse, tiefsitzender einseitiger Kreuzschmerz.', peri: 'Wade · Ferse · Fußaußenrand', ther: ['Manuelle Therapie / ISG', 'Sport-Physiotherapie', 'Stoßwelle'], zoom: 1.9 },
];
const segOf = (id) => SEG.findIndex((s) => s.ids.includes(id));
const segEl = $('#seg'), card = $('#card'), chips = [...document.querySelectorAll('#chips button')];
let active = 0, auto = !reduced, autoT = 0;
function setSeg(i, byUser) {
  if (byUser) auto = false;
  if (i === active && !byUser) return;
  active = i;
  chips.forEach((b, k) => b.setAttribute('aria-pressed', k === i ? 'true' : 'false'));
  const fill = () => {
    const s = SEG[i];
    $('#cNo').textContent = s.no; $('#cTitle').textContent = s.title; $('#cTyp').textContent = s.typ; $('#cPeri').textContent = 'Versorgung: ' + s.peri;
    $('#cTher').textContent = s.ther.join(' · ');
    card.classList.remove('swap');
  };
  if (reduced) fill(); else { card.classList.add('swap'); setTimeout(fill, 220); }
}
chips.forEach((b) => b.addEventListener('click', () => setSeg(+b.dataset.seg, true)));

// ---- WebGL ------------------------------------------------------------------------------------
const canvas = $('#gl');
let renderer = null;
try {
  renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, premultipliedAlpha: true, powerPreference: 'high-performance' });
  if (!renderer.capabilities.isWebGL2) throw new Error('WebGL 2 fehlt');
} catch (e) {
  document.documentElement.classList.add('no-gl');
  document.documentElement.style.setProperty('--img', `url(${IMG})`);
}
if (renderer) start();

function start() {
  renderer.setClearColor(0x000000, 0);
  const DPR = Math.min(devicePixelRatio || 1, 2);
  renderer.setPixelRatio(DPR);
  const scene = new THREE.Scene();
  const cam = new THREE.OrthographicCamera(0, 1, 0, -1, -9000, 9000);
  let W = 1, H = 1, CX = 0, CW = 1;                   // Fenster und Textspalte (am PC ist die Bühne breiter als die Spalte)

  // ---- Bild als Bühne -------------------------------------------------------------------------
  const tex = new THREE.Texture();
  const im = new Image();
  im.onload = () => { tex.image = im; tex.generateMipmaps = true; tex.minFilter = THREE.LinearMipmapLinearFilter; tex.needsUpdate = true; bgU.uReady.value = 1; };
  im.src = IMG;
  const bgU = {
    uTex: { value: tex }, uReady: { value: 0 }, uRes: { value: new THREE.Vector2(1, 1) }, uDpr: { value: DPR },
    uRect: { value: new THREE.Vector4(0, 0, 1, 1) }, uTime: { value: 0 }, uAlpha: { value: 1 }, uKeep: { value: 0 }, uScatter: { value: 0 },
    uTilt: { value: new THREE.Vector2() }, uLife: { value: reduced ? 0 : 1 }, uAspect: { value: IMG_H / IMG_W },
  };
  const bg = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({
    uniforms: bgU, transparent: true, premultipliedAlpha: true, depthTest: false, depthWrite: false,
    vertexShader: 'void main(){ gl_Position = vec4(position.xy, 0., 1.); }',
    fragmentShader: `
      precision highp float;
      uniform sampler2D uTex; uniform vec2 uRes, uTilt; uniform vec4 uRect;
      uniform float uDpr, uTime, uAlpha, uKeep, uScatter, uLife, uReady, uAspect;
      float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float noise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.-2.*f);
        return mix(mix(hash(i), hash(i+vec2(1,0)), f.x), mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), f.x), f.y); }
      float segd(vec2 p, vec2 a, vec2 b){ vec2 pa = p-a, ba = b-a; return length(pa - ba*clamp(dot(pa,ba)/dot(ba,ba), 0., 1.)); }
      // Lage der Wirbelsäule im Bild (Bildkoordinaten, y mit dem Seitenverhältnis gestreckt)
      float spine(vec2 uv){ vec2 p = vec2(uv.x, uv.y*uAspect); float d = 9.;
        vec2 a = vec2(.455, .40*uAspect), b;
        b = vec2(.49, .50*uAspect); d = min(d, segd(p,a,b)); a = b;
        b = vec2(.52, .58*uAspect); d = min(d, segd(p,a,b)); a = b;
        b = vec2(.55, .66*uAspect); d = min(d, segd(p,a,b)); a = b;
        b = vec2(.58, .74*uAspect); d = min(d, segd(p,a,b)); a = b;
        b = vec2(.61, .82*uAspect); d = min(d, segd(p,a,b)); a = b;
        b = vec2(.66, 1.0*uAspect); d = min(d, segd(p,a,b));
        return 1. - smoothstep(.045, .12, d); }
      void main(){
        vec2 px = vec2(gl_FragCoord.x, uRes.y*uDpr - gl_FragCoord.y) / uDpr;
        vec2 uv = (px - uRect.xy) / uRect.zw;
        float m = spine(uv);
        // leichte Tiefe: helle (nahe) Bereiche verschieben sich stärker
        float depth = dot(textureLod(uTex, vec2(uv.x, 1.-uv.y), 5.).rgb, vec3(.3,.5,.2));
        uv += uTilt * (depth - .2) * .05;
        // Verstreuen: das Bild löst sich auf, die Wirbelsäule bleibt stehen
        vec2 n = vec2(noise(uv*38. + uTime*.7), noise(uv*38. + 19.3 - uTime*.6)) - .5;
        uv += n * uScatter * uScatter * .16 * (1. - m) + vec2(0., uScatter*uScatter*.05*(1.-m));
        if (uv.x < 0. || uv.x > 1. || uv.y < 0. || uv.y > 1. || uReady < .5) { gl_FragColor = vec4(0.); return; }
        vec3 c = texture2D(uTex, vec2(uv.x, 1.-uv.y)).rgb;
        float edge = smoothstep(0., .04, uv.x) * smoothstep(1., .96, uv.x) * smoothstep(1., .97, uv.y) * smoothstep(0., .015, uv.y);
        // Kein Bildrand: Kopf und Hals stehen klar, Schultern und Arme lösen sich nach außen in Lichtfäden und Glasstaub auf
        float r = length((uv - vec2(.5, .36)) / vec2(.66, .64)) + (noise(uv*5. + uTime*.04) - .5) * .16;
        float fig = 1. - smoothstep(.56, 1., r);
        vec3 tr = vec3(0.);
        for (int i = 1; i <= 5; i++) {
          vec2 u2 = uv - vec2((noise(vec2(uv.x*34., float(i)*3.7)) - .5) * .012, float(i) * .034);
          float f2 = 1. - smoothstep(.56, 1., length((u2 - vec2(.5, .36)) / vec2(.66, .64)));
          tr += texture2D(uTex, vec2(u2.x, 1.-u2.y)).rgb * f2 * (1. - float(i)/6.);
        }
        float strand = smoothstep(.3, .8, noise(vec2(uv.x*64., uv.y*2.6 - uTime*.12)));
        c = c * fig + tr * .2 * strand * (1. - fig);
        vec2 gp = vec2(uv.x*42., uv.y*42.*uAspect); gp.y -= uTime * (.2 + .45*hash(vec2(floor(gp.x), 3.)));
        vec2 id = floor(gp), gf = fract(gp) - .5;
        float mote = step(.87, hash(id)) * smoothstep(.1, 0., length(gf - (vec2(hash(id+7.), hash(id+13.)) - .5) * .6));
        c += vec3(.55, .8, 1.) * mote * smoothstep(0., .4, 1. - fig) * smoothstep(1.3, .85, r) * .9 * uLife * (.5 + .5*sin(uTime*1.3 + hash(id)*40.));
        // Nervensignale: gelbliche Bahnen bekommen Lichtpulse, die nach unten laufen
        float yel = clamp((min(c.r, c.g) - c.b) * 3.2, 0., 1.);
        float ph = uv.y*7. - uTime*.55 + noise(uv*5.)*1.3;
        float pulse = pow(max(0., sin(ph*6.2832)), 14.);
        c += vec3(1., .72, .3) * yel * pulse * 1.1 * uLife;
        // Lichtband gleitet über das Glas
        float band = exp(-pow((uv.y - (fract(uTime/11.)*1.5 - .25)) / .045, 2.));
        c += c * band * .55 * uLife;
        c *= 1. - .06*uLife + .06*uLife*sin(uTime*.8);
        c *= mix(1., .04 + .96*m, uKeep);
        float a = clamp(max(c.r, max(c.g, c.b)) * 1.3, 0., 1.) * edge * uAlpha;
        gl_FragColor = vec4(c * edge * uAlpha, a);
      }`,
  }));
  bg.frustumCulled = false; bg.renderOrder = -1;
  scene.add(bg);

  // ---- Material „Röntgen-Glas“ ------------------------------------------------------------------
  // Vordere Flächen verdecken hintere (Tiefen-Vorlauf), dazu Kantenlicht, Streiflicht, Glanzpunkte, feine Knochenstruktur.
  // uRev = Höhe, bis zu der ein Knochen schon „gewachsen“ ist (leuchtende Wachstumskante); uFade = Auslaufen entlang der Länge (Rippen).
  const glassV = `varying vec3 vN, vO; varying vec2 vUv;
    void main(){ vN = normalize(normalMatrix * normal); vO = position; vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`;
  const glassF = `
    varying vec3 vN, vO; varying vec2 vUv; uniform vec3 uCol, uHot; uniform float uAct, uOp, uTex, uRev, uFade;
    float h3(vec3 p){ return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }
    float n3(vec3 p){ vec3 i = floor(p), f = fract(p); f = f*f*(3.-2.*f);
      return mix(mix(mix(h3(i), h3(i+vec3(1,0,0)), f.x), mix(h3(i+vec3(0,1,0)), h3(i+vec3(1,1,0)), f.x), f.y),
                 mix(mix(h3(i+vec3(0,0,1)), h3(i+vec3(1,0,1)), f.x), mix(h3(i+vec3(0,1,1)), h3(i+vec3(1,1,1)), f.x), f.y), f.z); }
    void main(){
      float grow = smoothstep(uRev - 1.2, uRev + 1.2, vO.y);
      if (grow < .01) discard;
      vec3 n = normalize(vN);
      float ndv = clamp(n.z, 0., 1.);
      float rim = pow(1. - ndv, 2.4);
      vec3 L = normalize(vec3(-.5, .62, .6));
      float dif = max(dot(n, L), 0.);
      float spec = pow(max(dot(n, normalize(L + vec3(0., 0., 1.))), 0.), 56.);
      float grain = .84 + .3 * n3(vO * uTex) * n3(vO * uTex * 2.7 + 3.1);
      vec3 base = mix(uCol, uHot, uAct);
      vec3 edge = mix(vec3(.78, .92, 1.), vec3(1., .84, .58), uAct);
      vec3 c = base * (.035 + .19 * dif) * grain + edge * rim * 1.15 + vec3(1.) * spec * .5;
      c += vec3(1., .8, .5) * exp(-pow((vO.y - uRev) / 1.5, 2.)) * (uFade > 0. ? .15 : .6);
      float a = uOp * (1. + uAct * .45) * grow * (uFade > 0. ? 1. - smoothstep(uFade, 1., vUv.x) : 1.);
      gl_FragColor = vec4(c * a, (.05 + .45 * rim) * a);
    }`;
  const ADD = { blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor, blendSrcAlpha: THREE.OneFactor, blendDstAlpha: THREE.OneFactor };
  const ghostF = `
    varying vec3 vN, vO; uniform vec3 uCol, uHot; uniform float uAct, uOp, uRev;
    void main(){ float rim = pow(1. - abs(normalize(vN).z), 2.); gl_FragColor = vec4(mix(uCol, uHot, uAct) * (.03 + .3 * rim) * uOp * step(uRev, vO.y), 0.); }`;
  const depthF = 'varying vec3 vO; uniform float uRev; void main(){ if (vO.y < uRev) discard; gl_FragColor = vec4(0.); }';
  const hullF = `
    varying vec3 vN, vO; uniform float uOp, uRev, uTop;
    void main(){ float rim = pow(1. - abs(normalize(vN).z), 2.6);
      float a = uOp * smoothstep(uRev - 2., uRev + 5., vO.y) * (1. - smoothstep(uTop - 10., uTop, vO.y));
      gl_FragColor = vec4(vec3(.42, .68, 1.) * (.012 + .42 * rim) * a, 0.); }`;
  const nerveF = `
    varying vec3 vN, vO; varying vec2 vUv; uniform float uAct, uOp, uTime, uN, uPh, uRev;
    void main(){ float core = pow(clamp(abs(normalize(vN).z), 0., 1.), 1.4);
      float s = pow(max(0., sin((vUv.x*uN - uTime*.9 + uPh)*6.2832)), 9.);
      vec3 c = mix(vec3(.9, .6, .2), vec3(1., .93, .7), s) * (.3 + .7*core);
      gl_FragColor = vec4(c * (.26 + s*1.25 + uAct*.55) * uOp * smoothstep(uRev - 1., uRev + 1., vO.y), 0.); }`;
  const tU = { value: 0 };
  const glassU = (col, hot, tex) => ({ uCol: { value: new THREE.Color(col) }, uHot: { value: new THREE.Color(hot) }, uAct: { value: 0 }, uOp: { value: 0 }, uTex: { value: tex }, uRev: { value: -1e5 }, uFade: { value: 0 } });
  const glassM = (u) => new THREE.ShaderMaterial({ uniforms: u, vertexShader: glassV, fragmentShader: glassF, transparent: true, premultipliedAlpha: true, depthTest: true, depthWrite: false, side: THREE.FrontSide });
  const nerveM = (n, ph) => new THREE.ShaderMaterial({
    uniforms: { uAct: { value: 0 }, uOp: { value: 0 }, uTime: tU, uN: { value: n }, uPh: { value: ph }, uRev: { value: -1e5 } },
    vertexShader: glassV, fragmentShader: nerveF, transparent: true, ...ADD, depthTest: true, depthWrite: false,
  });

  // ---- Figur ------------------------------------------------------------------------------------
  const sp = spineLevels(), J = joints(sp.P0);
  const body = new THREE.Group(); scene.add(body);     // Körperkoordinaten in cm, Ursprung am Boden
  const parts = [];                                    // { m, u, grp: 'spine'|'upper'|'lower', y (Höhe, nur spine), seg, kind }
  // Glaskörper mit Tiefen-Vorlauf und durchschimmernden Rückseiten
  function solid(geo, u, grp, extra = {}) {
    const m = new THREE.Mesh(geo, glassM(u));
    const dm = new THREE.Mesh(geo, new THREE.ShaderMaterial({ uniforms: u, vertexShader: glassV, fragmentShader: depthF, colorWrite: false }));
    const gm = new THREE.Mesh(geo, new THREE.ShaderMaterial({ uniforms: u, vertexShader: glassV, fragmentShader: ghostF, transparent: true, ...ADD, depthTest: false, depthWrite: false, side: THREE.BackSide }));
    gm.renderOrder = -0.5; m.add(dm, gm);
    m.traverse((o) => o.layers.set(1)); m.visible = false; body.add(m);
    const p = { m, u, grp, seg: -1, ...extra }; parts.push(p); return p;
  }
  function tube(curve, n, r, mat, grp, extra = {}) {
    const m = new THREE.Mesh(new THREE.TubeGeometry(curve, n, r, 8), mat);
    m.layers.set(1); m.visible = false; body.add(m);
    const p = { m, u: mat.uniforms, grp, seg: -1, ...extra }; parts.push(p); return p;
  }
  const ready = { spine: false, body: false };
  let hull = null, ground = null;
  function addSpine(vg) {
    sp.levels.forEach((lv, i) => {
      const p = solid(vg[lv.type], glassU(0x9CCBF2, 0xFFB45A, lv.type === 's' || lv.type === 'co' ? 9 : 30), 'spine', { y: lv.center.y, seg: segOf(lv.id), local: true });
      p.m.position.copy(lv.center); p.m.quaternion.copy(lv.quat);
      if (lv.type !== 's' && lv.type !== 'co') p.m.scale.set(lv.R, lv.sy, lv.R);
      const nx = sp.levels[i + 1];
      if (lv.disc > 0.3 && nx && nx.reg !== 'co') {      // Bandscheibe: blass, im aktiven Abschnitt rot-orange (wie in Puls)
        const a = segOf(lv.id), b = segOf(nx.id), R = (lv.R + nx.R) / 2;
        const d = solid(discGeo(R * 0.98, lv.disc * 1.12, lv.reg === 'l' ? 0.76 : lv.reg === 't' ? 0.92 : 0.8), glassU(0xBFD9EE, 0xF0683C, 30), 'spine', { y: lv.center.y - lv.h / 2, seg: a === b ? a : b === 5 ? 5 : -1, local: true, disc: true });
        d.m.position.copy(lv.pt(0, -lv.h / 2 - lv.disc / 2, 0)); d.m.quaternion.copy(lv.quat);
      }
    });
    ribCurves(sp).forEach((r) => { const u = glassU(0x9CCBF2, 0xFFB45A, 12); u.uFade.value = 0.42; tube(r.curve, 48, r.r, glassM(u), 'spine', { seg: segOf(r.id), rib: true }); });
    rootCurves(sp).forEach((r, k) => tube(r.curve, 18, 0.13, nerveM(1.6, k * 0.37), 'spine', { seg: segOf(r.id), nerve: true }));
    const cut = sp.canal.findIndex((c, i) => sp.levels[i].id === 'L2');
    tube(new THREE.CatmullRomCurve3(sp.canal.slice(0, cut + 1)), 200, 0.42, nerveM(9, 0), 'spine', { nerve: true });                 // Rückenmark
    tube(new THREE.CatmullRomCurve3(sp.canal.slice(cut)), 60, 0.2, nerveM(4, 0.3), 'spine', { nerve: true });                        // Nervenfasern darunter
    ready.spine = true;
  }
  function addBody(list) {
    for (const b of list) {
      if (b.name === 'hull') {
        hull = new THREE.Mesh(b.geo, new THREE.ShaderMaterial({ uniforms: { uOp: { value: 0 }, uRev: { value: 1e5 }, uTop: { value: 166 } }, vertexShader: glassV, fragmentShader: hullF, transparent: true, ...ADD, depthTest: false, depthWrite: false, side: THREE.DoubleSide }));
        hull.layers.set(1); hull.visible = false; hull.renderOrder = -1; body.add(hull);
      } else solid(b.geo, glassU(0x9CCBF2, 0xFFB45A, 9), ['girdle', 'arm', 'hand'].includes(b.name) ? 'upper' : 'lower');
    }
    for (const s of [1, -1]) tube(legNerve(sp, s), 220, 0.3, nerveM(13, s * 0.21), 'lower', { nerve: true });
    // Boden unter den Füßen: Lichtkreise, die von den Sohlen ausgehen
    const gg = new THREE.PlaneGeometry(110, 110); gg.rotateX(-Math.PI / 2);
    ground = new THREE.Mesh(gg, new THREE.ShaderMaterial({
      uniforms: { uOp: { value: 0 }, uTime: tU, uF: { value: new THREE.Vector3(J.ank.x, J.ank.z + 4, 0) } }, transparent: true, ...ADD, depthTest: false, depthWrite: false, side: THREE.DoubleSide,
      vertexShader: 'varying vec2 vP; void main(){ vP = position.xz; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }',
      fragmentShader: `varying vec2 vP; uniform float uOp, uTime; uniform vec3 uF;
        void main(){ float d = min(length((vP - vec2(uF.x, uF.y)) * vec2(1., .55)), length((vP - vec2(-uF.x, uF.y)) * vec2(1., .55)));
          float ring = pow(max(0., sin((d*.085 - uTime*.2) * 6.2832)), 12.) * exp(-d*.05);
          float pool = exp(-d*d*.02) * .55;
          float a = (ring*.7 + pool) * uOp * smoothstep(52., 30., length(vP - vec2(0., uF.y)));
          gl_FragColor = vec4(vec3(1., .66, .26) * a, 0.); }`,
    }));
    ground.position.set(0, 0.05, 0); ground.layers.set(1); ground.visible = false; ground.renderOrder = -2; body.add(ground);
    ready.body = true;
  }
  runSliced(vertebraGeos()).then((vg) => { addSpine(vg); return runSliced(bodyGeos(sp.P0)); }).then(addBody).catch((e) => console.error(e));

  // Lichtschein: Modell klein in einen Zwischenspeicher zeichnen, weichzeichnen, über das Bild addieren
  const rtA = new THREE.WebGLRenderTarget(4, 4), rtB = new THREE.WebGLRenderTarget(4, 4, { depthBuffer: false }), rtC = new THREE.WebGLRenderTarget(4, 4, { depthBuffer: false });
  const quadV = 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }';
  const blurU = { uTex: { value: null }, uDir: { value: new THREE.Vector2() } };
  const post = new THREE.Scene(), pcam = new THREE.Camera();
  const pq = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({
    uniforms: blurU, depthTest: false, depthWrite: false, vertexShader: quadV,
    fragmentShader: `varying vec2 vUv; uniform sampler2D uTex; uniform vec2 uDir;
      void main(){ vec4 c = texture2D(uTex, vUv) * .227;
        c += (texture2D(uTex, vUv + uDir*1.385) + texture2D(uTex, vUv - uDir*1.385)) * .316;
        c += (texture2D(uTex, vUv + uDir*3.231) + texture2D(uTex, vUv - uDir*3.231)) * .0703;
        gl_FragColor = c; }`,
  }));
  pq.frustumCulled = false; post.add(pq);
  const glow = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({
    uniforms: { uTex: { value: rtC.texture }, uK: { value: 1.05 } }, transparent: true, ...ADD, depthTest: false, depthWrite: false, vertexShader: quadV,
    fragmentShader: 'varying vec2 vUv; uniform sampler2D uTex; uniform float uK; void main(){ vec3 c = texture2D(uTex, vUv).rgb * uK; gl_FragColor = vec4(c, max(c.r, max(c.g, c.b)) * .5); }',
  }));
  glow.frustumCulled = false; glow.renderOrder = 50; scene.add(glow);
  const blur = (from, to, dx, dy) => { blurU.uTex.value = from.texture; blurU.uDir.value.set(dx, dy); renderer.setRenderTarget(to); renderer.render(post, pcam); };

  // ---- Lagen der Figur --------------------------------------------------------------------------
  const C1 = sp.byId('C1').center, T2 = sp.byId('Th2').center, mid = new THREE.Vector3(0, (C1.y + sp.byId('Co').center.y) / 2, 0);
  SEG.forEach((s) => { s.c = s.ids.reduce((v, id) => v.add(sp.byId(id).center), new THREE.Vector3()).multiplyScalar(1 / s.ids.length); });
  const yT2 = T2.y, yEnd = sp.byId('Co').center.y - 3;
  const qA = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.PI / 2 - 0.62, 0.2, 'ZYX'));   // deckungsgleich mit dem Bild
  const eB = new THREE.Euler(), eP = new THREE.Euler(), eF = new THREE.Euler();
  const qB = new THREE.Quaternion(), qP = new THREE.Quaternion(), qF = new THREE.Quaternion(), q = new THREE.Quaternion(), v = new THREE.Vector3(), c3 = new THREE.Vector3();
  const aP = new THREE.Vector3(0, sp.P0.y - 20, sp.P0.z + 2), aF = new THREE.Vector3(0, 9, J.ank.z + 6.5);
  const pose = { init: false, s: 1, x: 0, y: 0, c: new THREE.Vector3() };   // geglättete Lage in der Abschnitts-Ansicht

  const first = $('.first'), h1 = first.querySelector('h1'), kief = $('#kiefer'), win = $('#wirbelsaeule'), beck = $('#becken'), feet = $('#fuesse');
  function resize() {
    W = canvas.clientWidth; H = canvas.clientHeight;
    CW = document.querySelector('main').clientWidth; CX = (W - CW) / 2;
    renderer.setSize(W, H, false);
    cam.right = W; cam.bottom = -H; cam.updateProjectionMatrix();
    bgU.uRes.value.set(W, H);
    const dw = Math.max(4, Math.round(W * DPR / 2)), dh = Math.max(4, Math.round(H * DPR / 2));
    rtA.setSize(dw, dh); rtB.setSize(dw >> 1, dh >> 1); rtC.setSize(dw >> 1, dh >> 1);
  }
  new ResizeObserver(resize).observe(canvas); resize();

  let last = 0, time = 0, fadeS = 0, fadeB = 0;
  function frame(now) {
    requestAnimationFrame(frame);
    if (document.hidden) return;
    const dt = Math.min(0.05, (now - last) / 1000 || 0); last = now;
    if (!reduced) time += dt;
    const sy = scrollY, vh = innerHeight, ar = IMG_H / IMG_W;
    const kr = kief.getBoundingClientRect(), wr = win.getBoundingClientRect(), br = beck.getBoundingClientRect(), fr = feet.getBoundingClientRect();
    const tk = (0.8 * vh - kr.top) / vh;               // Fortschritt Kiefer/Nacken (in Bildschirmhöhen)
    const t = (0.8 * vh - wr.top) / vh;                // Fortschritt Wirbelsäule
    const kP = smooth((0.9 * vh - br.top) / (0.95 * vh));   // Becken und Beine
    const kF = smooth((0.95 * vh - fr.top) / (0.9 * vh));   // Füße

    // ---- Bild: Lage und Zustand ----
    let rw, rx, ry, alpha, keep = 0, scatter = 0;
    if (tk <= 0) {                                     // erster Bildschirm: Kopf unter der Begrüßung
      rw = CW * 1.14; rx = CX - 0.07 * CW; ry = h1.offsetTop + h1.offsetHeight + 4 - 0.03 * rw * ar - sy * 0.4; alpha = 1;
    } else if (t <= 0) {                               // Kiefer und Nacken: heran, Kiefer in die obere Bildhälfte
      const k = smooth(tk / 0.7);
      rw = CW * lerp(1.3, 1.75, k); rx = CX + 0.5 * CW - lerp(0.55, 0.6, k) * rw; ry = lerp(0.5, 0.31, k) * vh - lerp(0.5, 0.52, k) * rw * ar;
      alpha = smooth(tk / 0.3);
    } else {                                           // Wirbelsäule: Hals in die Mitte, dann verlischt alles andere
      const k = smooth(t / 0.5);
      rw = CW * lerp(1.75, 1.8, k); rx = CX + 0.5 * CW - lerp(0.6, 0.53, k) * rw; ry = lerp(0.31, 0.47, k) * vh - lerp(0.52, 0.6, k) * rw * ar;
      alpha = 1 - smooth((t - 0.95) / 0.45);
      keep = smooth((t - 0.45) / 0.4); scatter = reduced ? 0 : smooth((t - 0.9) / 0.5);
    }
    bgU.uRect.value.set(rx, ry, rw, rw * ar);
    bgU.uAlpha.value = alpha; bgU.uKeep.value = keep; bgU.uScatter.value = scatter; bgU.uTime.value = time; tU.value = time;
    bgU.uTilt.value.set(Math.sin(time * 0.33) * 0.55, Math.cos(time * 0.27) * 0.3 + clamp(sy / vh, 0, 1.2) * 0.5);
    bg.visible = alpha > 0.002;

    // ---- Figur: was ist sichtbar ----
    fadeS += ((ready.spine ? 1 : 0) - fadeS) * (1 - Math.exp(-dt / 0.4)); fadeB += ((ready.body ? 1 : 0) - fadeB) * (1 - Math.exp(-dt / 0.4));
    const opS = smooth((t - 0.5) / 0.4) * fadeS;
    const revS = lerp(yT2 - 1.5, yEnd, smooth((t - 0.9) / 0.8));        // erst Hals und obere Brust, dann wächst sie nach unten
    const opL = smooth(kP / 0.25) * fadeB;
    const revL = lerp(sp.P0.y + 10, -8, smooth((kP - 0.08) / 0.8)), revU = lerp(158, 56, smooth(kP / 0.7)), revH = lerp(172, -8, smooth(kP / 0.9));
    const uiEnd = clamp((wr.bottom - 0.8 * vh) / (0.2 * vh));
    const ui = smooth((t - 1.65) / 0.25) * uiEnd, on = ui > 0.5;
    const ka = reduced ? 1 : 1 - Math.exp(-dt / 0.18);
    for (const p of parts) {
      const u = p.u;
      if (p.grp === 'spine') {
        if (p.local) u.uOp.value = opS * smooth((p.y - revS) / 3 + 0.5) * (p.disc ? 0.7 + 0.8 * u.uAct.value : 1);
        else { u.uOp.value = opS * (p.rib ? 0.7 * smooth((t - 1.05) / 0.5) : 1); u.uRev.value = revS; }   // Rippen erst, wenn die Säule frei steht
      } else { u.uOp.value = opL; u.uRev.value = p.grp === 'upper' ? revU : revL; }
      u.uAct.value += ((on && p.seg === active ? 1 : 0) - u.uAct.value) * ka;
      p.m.visible = u.uOp.value > 0.01;
    }
    if (hull) { hull.material.uniforms.uOp.value = opL * 0.9; hull.material.uniforms.uRev.value = revH; hull.visible = opL > 0.01; }
    if (ground) { ground.material.uniforms.uOp.value = kF * fadeB * (reduced ? 0.5 : 1); ground.visible = kF > 0.01; }
    body.visible = opS > 0.002;

    // ---- Figur: Lage ----
    if (body.visible) {
      const osc = reduced ? 0 : Math.sin(time * 0.45);
      // A: C1 und Th2 liegen auf ihren Stellen im Bild
      const a1x = rx + 0.462 * rw, a1y = ry + 0.415 * rw * ar, a2x = rx + 0.578 * rw, a2y = ry + 0.735 * rw * ar;
      const sA = Math.hypot(a2x - a1x, a2y - a1y) / C1.distanceTo(T2);
      // B: ganze Wirbelsäule frei stehend im Halbprofil; im Abschnitt fährt sie heran (obere Bildhälfte, Karte darunter)
      eB.set(0, Math.PI / 2 - 0.52 + osc * 0.16, 0); qB.setFromEuler(eB);
      const sB = (0.66 * vh) / sp.Ltot;
      let tS = sB, tY = 0.52 * vh, tC = mid;
      if (ui > 0.02) { const s = SEG[active]; tS = sB * s.zoom; tY = 0.3 * vh; tC = s.c; }
      const k = reduced ? 1 : 1 - Math.exp(-dt / 0.32);
      if (!pose.init) { pose.s = tS; pose.y = tY; pose.c.copy(tC); pose.init = true; }
      pose.s += (tS - pose.s) * k; pose.y += (tY - pose.y) * k; pose.c.lerp(tC, k);
      // P: Becken und Beine von schräg vorn · F: Füße von der Seite, leicht von oben (Boden sichtbar)
      eP.set(0.07, 0.62 + osc * 0.1, 0); qP.setFromEuler(eP);
      eF.set(0.2, Math.PI / 2 - 0.5 + osc * 0.07, 0); qF.setFromEuler(eF);
      const sP = (0.5 * vh) / 48, sF = (CW * 0.74) / 30;
      const m = smooth((t - 0.9) / 0.8), cxs = CX + 0.5 * CW;
      q.copy(qA).slerp(qB, m).slerp(qP, kP).slerp(qF, kF);
      const s = lerp(lerp(lerp(sA, pose.s, m), sP, kP), sF, kF);
      c3.copy(C1).lerp(pose.c, m).lerp(aP, kP).lerp(aF, kF);                   // Ankerpunkt im Körper …
      const tx = lerp(lerp(lerp(a1x, CX + 0.56 * CW, m), cxs, kP), cxs, kF), ty = lerp(lerp(lerp(a1y, pose.y, m), 0.3 * vh, kP), 0.27 * vh, kF);   // … liegt auf diesem Bildschirmpunkt
      body.quaternion.copy(q); body.scale.setScalar(s);
      v.copy(c3).multiplyScalar(s).applyQuaternion(q);
      body.position.set(tx - v.x, -ty - v.y, 0);
    }

    // ---- Oberfläche ----
    segEl.style.setProperty('--ui', ui.toFixed(3));
    segEl.style.setProperty('--in', (smooth((t - 1.35) / 0.3) * uiEnd).toFixed(3));
    segEl.classList.toggle('on', on);
    kief.style.setProperty('--cap', (smooth((tk - 0.5) / 0.3) * (1 - smooth(t / 0.2))).toFixed(3));
    beck.style.setProperty('--cap', (smooth((kP - 0.55) / 0.3) * clamp((br.bottom - 0.75 * vh) / (0.2 * vh))).toFixed(3));
    if (on && auto) { autoT += dt; if (autoT > 5) { autoT = 0; setSeg((active + 1) % SEG.length); } } else if (!on) autoT = 0;

    glow.visible = body.visible;
    if (body.visible) {                                // Lichtschein des Modells
      cam.layers.set(1); renderer.setRenderTarget(rtA); renderer.render(scene, cam);
      blur(rtA, rtB, 1.5 / rtA.width, 0); blur(rtB, rtC, 0, 1.5 / rtB.height);
      blur(rtC, rtB, 2.6 / rtC.width, 0); blur(rtB, rtC, 0, 2.6 / rtB.height);
      renderer.setRenderTarget(null);
    }
    cam.layers.enableAll();
    renderer.render(scene, cam);
  }
  requestAnimationFrame(frame);
  window.__glas = { sp, body, parts, bgU, ready };
}
