// „Von Kopf bis Fuß“ – Vorschau „Glas“ (Auftrag Kai 12.11.2026): Röntgen-Glas-Figur als lebende Bühne.
// 1) Das Bild lebt: Signale laufen die Nervenbahnen hinab, ein Lichtband gleitet über das Glas, leichte Tiefe.
// 2) Kapitel Wirbelsäule: alles außer der Wirbelsäule verlischt, ein echtes 3D-Glasmodell entsteht deckungsgleich
//    über der Halswirbelsäule im Bild, löst sich, dreht ins Profil und bildet sich Wirbel für Wirbel bis zum Steißbein.
// 3) Abschnitte per Antippen (kein Wischen): Abschnitt glüht bernstein, Modell fährt heran, Karte erklärt.
import * as THREE from 'three';
import { buildSpine, rootCurves } from '../../shared/spine.js';
import { IMG, IMG_W, IMG_H } from './img.js';

const $ = (s) => document.querySelector(s);
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const smooth = (t) => { t = clamp(t); return t * t * (3 - 2 * t); };
const lerp = (a, b, t) => a + (b - a) * t;
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

// Begrüßung nach Tageszeit
const hr = new Date().getHours();
document.querySelectorAll('.gruss').forEach((e) => { e.textContent = hr < 11 ? 'Guten Morgen.' : hr < 18 ? 'Guten Tag.' : 'Guten Abend.'; });

// ---- Abschnitte (Texte aus Puls · Scan, von Kai freigegeben) -----------------------------------
const SEG = [
  { ids: ['C1', 'C2'], no: 'C1–C2', title: 'Kopfgelenke', typ: 'Vom Nacken aufsteigender Spannungskopfschmerz, Schwindelgefühl, eingeschränktes Kopfdrehen.', peri: 'Hinterkopf · Nacken', ther: ['Atlas-Axis-Therapie', 'Manuelle Therapie', 'Fango'], zoom: 2.5 },
  { ids: ['C5', 'C6'], no: 'C5–C6', title: 'Halswirbelsäule', typ: 'Ausstrahlung über die Armaußenseite bis in den Daumen, Kribbeln, Schwächegefühl beim Beugen.', peri: 'Armaußenseite · Daumen', ther: ['Manuelle Therapie', 'Schlingentisch', 'Krankengymnastik'], zoom: 2.5 },
  { ids: ['Th1', 'Th2', 'Th3', 'Th4', 'Th5', 'Th6'], no: 'Th1–Th6', title: 'Brustwirbelsäule', typ: 'Blockaden mit atemabhängigem Stechen, Schmerz zwischen den Schulterblättern, „Rippenklemme“.', peri: 'Brustkorb · Zwischenrippen', ther: ['Manuelle Therapie', 'Lojer Manuthera', 'Fango'], zoom: 1.5 },
  { ids: ['Th7', 'Th8', 'Th9', 'Th10', 'Th11', 'Th12'], no: 'Th7–Th12', title: 'Untere Brustwirbelsäule', typ: 'Gürtelförmig ausstrahlender Schmerz am Rippenbogen, Steifigkeit am Übergang zur Lendenwirbelsäule (Th12/L1).', peri: 'Rippenbogen · Bauchwand', ther: ['Manuelle Therapie', 'Krankengymnastik', 'Fango'], zoom: 1.35 },
  { ids: ['L4', 'L5'], no: 'L4–L5', title: 'Lendenwirbelsäule', typ: 'Bandscheiben-Region: Ausstrahlung ins Bein, Kribbeln am Schienbein, Fußheber-Schwäche.', peri: 'Schienbein · Großzehe', ther: ['Schlingentisch', 'Schmerztherapie', 'Krankengymnastik'], zoom: 1.55 },
  { ids: ['S'], no: 'S1 · ISG', title: 'Kreuzbein & Becken', typ: 'Ausstrahlung über die Beinrückseite bis zur Ferse, tiefsitzender einseitiger Kreuzschmerz.', peri: 'Wade · Ferse · Fußaußenrand', ther: ['Manuelle Therapie / ISG', 'Sport-Physiotherapie', 'Stoßwelle'], zoom: 1.45 },
];
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
  const cam = new THREE.OrthographicCamera(0, 1, 0, -1, -6000, 6000);
  let W = 1, H = 1;

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
        float edge = smoothstep(0., .05, uv.x) * smoothstep(1., .95, uv.x) * smoothstep(1., .9, uv.y) * smoothstep(0., .015, uv.y);
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

  // ---- 3D-Glasmodell der Wirbelsäule ------------------------------------------------------------
  const glassV = 'varying vec3 vN; varying vec2 vUv; void main(){ vN = normalize(normalMatrix * normal); vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }';
  const glassF = `
    varying vec3 vN; uniform vec3 uCol, uHot; uniform float uAct, uOp;
    void main(){ float f = 1. - abs(normalize(vN).z); float rim = pow(f, 1.7);
      vec3 c = mix(uCol, uHot, uAct);
      float a = (.025 + rim*.5) * uOp * (1. + uAct*.9);
      gl_FragColor = vec4(c * (.5 + rim*.7), a); }`;
  const glass = (col, hot) => new THREE.ShaderMaterial({
    uniforms: { uCol: { value: new THREE.Color(col) }, uHot: { value: new THREE.Color(hot) }, uAct: { value: 0 }, uOp: { value: 0 } },
    vertexShader: glassV, fragmentShader: glassF, transparent: true, blending: THREE.AdditiveBlending, depthTest: false, depthWrite: false, side: THREE.DoubleSide,
  });
  const nerveF = `
    varying vec2 vUv; uniform float uAct, uOp, uTime, uN, uPh;
    void main(){ float s = pow(max(0., sin((vUv.x*uN - uTime*.9 + uPh)*6.2832)), 9.);
      vec3 c = mix(vec3(.93,.66,.26), vec3(1.,.92,.66), s);
      gl_FragColor = vec4(c, (.13 + s*.8 + uAct*.4) * uOp); }`;
  const tU = { value: 0 };
  const nerve = (n, ph) => new THREE.ShaderMaterial({
    uniforms: { uAct: { value: 0 }, uOp: { value: 0 }, uTime: tU, uN: { value: n }, uPh: { value: ph } },
    vertexShader: glassV, fragmentShader: nerveF, transparent: true, blending: THREE.AdditiveBlending, depthTest: false, depthWrite: false,
  });

  const sp = buildSpine({ boneMaterial: () => glass(0x9CCBF2, 0xFFB45A) });
  const N = sp.levels.length;
  const segOf = (id) => SEG.findIndex((s) => s.ids.includes(id));
  const parts = [];                                    // alles, was je Wirbelhöhe erscheint und glüht
  sp.vertebrae.forEach((m, i) => parts.push({ m, i, seg: segOf(m.userData.lv.id) }));
  sp.discs.forEach((d) => {                            // Bandscheiben: blass, im aktiven Abschnitt rot-orange (wie in Puls)
    d.material = glass(0xBFD9EE, 0xF0683C);
    const i = sp.levels.findIndex((l) => l.id === d.userData.afterId), a = segOf(sp.levels[i].id), b = segOf(sp.levels[i + 1].id);
    parts.push({ m: d, i: i + 0.5, seg: a === b ? a : b === 5 ? 5 : -1, disc: true });
  });
  rootCurves(sp).forEach((r, k) => {
    const m = new THREE.Mesh(new THREE.TubeGeometry(r.curve, 14, 0.028, 5), nerve(1.6, k * 0.37));
    sp.group.add(m); parts.push({ m, i: sp.levels.findIndex((l) => l.id === r.id) + 0.3, seg: segOf(r.id), root: true });
  });
  const cord = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(sp.canal), 160, 0.07, 6), nerve(9, 0));
  sp.group.add(cord);
  const holder = new THREE.Group();
  sp.group.position.y = -sp.Ltot / 2;
  holder.add(sp.group); scene.add(holder);
  const off = new THREE.Vector3(0, -sp.Ltot / 2, 0);
  const local = (id) => sp.levels.find((l) => l.id === id).center.clone().add(off);
  const C1 = local('C1'), T2 = local('Th2');
  SEG.forEach((s) => { s.c = s.ids.reduce((v, id) => v.add(local(id)), new THREE.Vector3()).multiplyScalar(1 / s.ids.length); });

  // Lagen: A = deckungsgleich mit dem Bild (Dreiviertelansicht), B = frei stehend im Halbprofil
  const qA = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.PI / 2 - 0.62, 0.2, 'ZYX'));
  const eB = new THREE.Euler(0, 0, 0, 'ZYX'), qB = new THREE.Quaternion(), q = new THREE.Quaternion(), v = new THREE.Vector3();
  const pose = { s: 1, x: 0, y: 0 };                   // geglättete Lage in der Abschnitts-Ansicht
  let poseInit = false;

  const first = $('.first'), h1 = first.querySelector('h1'), win = $('#wirbelsaeule');
  function resize() {
    W = canvas.clientWidth; H = canvas.clientHeight;
    renderer.setSize(W, H, false);
    cam.right = W; cam.bottom = -H; cam.updateProjectionMatrix();
    bgU.uRes.value.set(W, H);
  }
  new ResizeObserver(resize).observe(canvas); resize();

  let last = 0, time = 0;
  function frame(now) {
    requestAnimationFrame(frame);
    if (document.hidden) return;
    const dt = Math.min(0.05, (now - last) / 1000 || 0); last = now;
    if (!reduced) time += dt;
    const sy = scrollY, vh = innerHeight, wr = win.getBoundingClientRect();
    const t = (0.8 * vh - wr.top) / vh;                // Fortschritt im Kapitel Wirbelsäule in Bildschirmhöhen
    const ar = IMG_H / IMG_W;

    // ---- Bild: Lage und Zustand ----
    let rw, rx, ry, alpha, keep = 0, scatter = 0;
    if (t <= 0) {                                      // erster Bildschirm: Kopf unter der Begrüßung
      rw = W * 1.14; rx = -0.07 * W; ry = h1.offsetTop + h1.offsetHeight + 4 - 0.03 * rw * ar - sy * 0.4; alpha = 1;
    } else {                                           // Kapitel: heran an Hals und Nacken
      const k = smooth(t / 0.6);
      rw = W * lerp(1.3, 1.8, k);
      rx = 0.5 * W - 0.53 * rw; ry = lerp(0.52, 0.47, k) * vh - 0.6 * rw * ar;
      alpha = smooth(t / 0.3) * (1 - smooth((t - 0.95) / 0.45));
      keep = smooth((t - 0.45) / 0.4); scatter = reduced ? 0 : smooth((t - 0.9) / 0.5);
    }
    bgU.uRect.value.set(rx, ry, rw, rw * ar);
    bgU.uAlpha.value = alpha; bgU.uKeep.value = keep; bgU.uScatter.value = scatter; bgU.uTime.value = time; tU.value = time;
    bgU.uTilt.value.set(Math.sin(time * 0.33) * 0.55, Math.cos(time * 0.27) * 0.3 + clamp(sy / vh, 0, 1.2) * 0.5);

    // ---- Wirbelsäule: Sichtbarkeit je Höhe ----
    const out = clamp((wr.bottom - 0.3 * vh) / (0.35 * vh));
    const op3 = smooth((t - 0.5) / 0.4) * out;
    const rev = 9.5 + (N - 8) * smooth((t - 0.9) / 0.8);  // erst Hals und obere Brust, dann wächst sie nach unten
    const ui = smooth((t - 1.65) / 0.25) * clamp((wr.bottom - 0.8 * vh) / (0.2 * vh));
    const on = ui > 0.5;
    for (const p of parts) {
      const u = p.m.material.uniforms, act = on && p.seg === active ? 1 : 0;
      u.uOp.value = op3 * smooth(rev - p.i) * (p.disc ? 0.7 + 0.8 * u.uAct.value : 1);
      u.uAct.value += (act - u.uAct.value) * (reduced ? 1 : 1 - Math.exp(-dt / 0.18));
    }
    cord.material.uniforms.uOp.value = op3 * 0.9;
    holder.visible = op3 > 0.002;

    // ---- Wirbelsäule: Lage ----
    if (holder.visible) {
      // A: C1 und Th2 liegen auf ihren Stellen im Bild
      const a1x = rx + 0.462 * rw, a1y = ry + 0.415 * rw * ar, a2x = rx + 0.578 * rw, a2y = ry + 0.735 * rw * ar;
      const sA = Math.hypot(a2x - a1x, a2y - a1y) / C1.distanceTo(T2);
      // B: ganze Säule rechts im Bild, leicht zum Betrachter gedreht, atmet
      eB.set(0, Math.PI / 2 - 0.52 + (reduced ? 0 : Math.sin(time * 0.45) * 0.16), reduced ? 0 : Math.sin(time * 0.3) * 0.015);
      qB.setFromEuler(eB);
      const sB = (0.66 * vh) / sp.Ltot;
      let tS = sB, tX = 0.56 * W, tY = 0.52 * vh, tC = v.set(0, 0, 0);
      if (ui > 0.02) { const s = SEG[active]; tS = sB * s.zoom; tX = 0.56 * W; tY = 0.3 * vh; tC = s.c; }   // Abschnitt in die obere Bildhälfte, Karte steht darunter
      // Mitte des Ziels (Abschnitt oder ganze Säule) auf den Bildschirmpunkt legen
      const cx = tC.x, cy = tC.y, cz = tC.z;
      const k = reduced ? 1 : 1 - Math.exp(-dt / 0.32);
      if (!poseInit) { pose.s = tS; pose.cx = cx; pose.cy = cy; pose.cz = cz; pose.x = tX; pose.y = tY; poseInit = true; }
      pose.s += (tS - pose.s) * k; pose.x += (tX - pose.x) * k; pose.y += (tY - pose.y) * k;
      pose.cx += (cx - pose.cx) * k; pose.cy += (cy - pose.cy) * k; pose.cz += (cz - pose.cz) * k;
      const m = smooth((t - 0.9) / 0.8);
      q.copy(qA).slerp(qB, m);
      const s = lerp(sA, pose.s, m);
      holder.quaternion.copy(q); holder.scale.setScalar(s);
      // Ankerpunkt: in A der Atlas, in B die Mitte des Ziels
      v.set(lerp(C1.x, pose.cx, m), lerp(C1.y, pose.cy, m), lerp(C1.z, pose.cz, m)).multiplyScalar(s).applyQuaternion(q);
      holder.position.set(lerp(a1x, pose.x, m) - v.x, -lerp(a1y, pose.y, m) - v.y, 0);
    }

    // ---- Oberfläche ----
    segEl.style.setProperty('--ui', ui.toFixed(3));
    segEl.style.setProperty('--in', (smooth((t - 1.35) / 0.3) * clamp((wr.bottom - 0.8 * vh) / (0.2 * vh))).toFixed(3));
    segEl.classList.toggle('on', on);
    if (on && auto) { autoT += dt; if (autoT > 5) { autoT = 0; setSeg((active + 1) % SEG.length); } } else if (!on) autoT = 0;

    renderer.render(scene, cam);
  }
  requestAnimationFrame(frame);
  window.__glas = { sp, holder, bgU };
}
