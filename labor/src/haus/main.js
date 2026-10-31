// „Hausbesuch“ – filmischer Rundgang durch ein warmes Praxis-Zuhause.
// Das Licht folgt der echten Tageszeit des Besuchers (umschaltbar). Scrollen = durch die Tür, durchs Haus, in den Garten.
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import gsap from 'gsap';
import Lenis from 'lenis';
import { buildHouse } from './scene.js';

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const smooth = (a, b, v) => { const t = clamp((v - a) / (b - a)); return t * t * (3 - 2 * t); };
const V = (x, y, z) => new THREE.Vector3(x, y, z);

(async function start() {
  try { await Promise.race([Promise.all([document.fonts.load('300 40px Fraunces'), document.fonts.load('italic 300 40px Fraunces'), document.fonts.load('500 20px "Hanken Grotesk"')]), new Promise((r) => setTimeout(r, 1500))]); } catch (e) { /* Schriften optional */ }

  // ---------- Scrollen ----------
  let lenis = null;
  if (!reduced) { lenis = new Lenis({ lerp: 0.07, wheelMultiplier: 0.8 }); gsap.ticker.add((t) => lenis.raf(t * 1000)); gsap.ticker.lagSmoothing(0); }
  const scrollToY = (y) => (lenis ? lenis.scrollTo(y, { duration: 2.2 }) : scrollTo({ top: y }));
  $$('a[href^="#"]').forEach((a) => a.addEventListener('click', (e) => { const t = $(a.getAttribute('href')); if (!t) return; e.preventDefault(); scrollToY(t.getBoundingClientRect().top + scrollY); }));

  // ---------- Renderer ----------
  const canvas = $('#gl');
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' }); } catch (e) { document.documentElement.classList.add('no-webgl'); return; }
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5));
  renderer.toneMapping = THREE.AgXToneMapping; renderer.toneMappingExposure = 1.15;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFShadowMap;
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog('#d9cdb8', 30, 90);
  const camera = new THREE.PerspectiveCamera(42, innerWidth / innerHeight, 0.05, 200);

  // Himmel (Kuppel mit Verlauf und Sonnenhof)
  const skyU = { top: { value: new THREE.Color() }, hor: { value: new THREE.Color() }, sunDir: { value: V(0, 1, 0) }, sunCol: { value: new THREE.Color() }, sunAmt: { value: 1 } };
  const sky = new THREE.Mesh(new THREE.SphereGeometry(120, 32, 16), new THREE.ShaderMaterial({
    uniforms: skyU, side: THREE.BackSide, depthWrite: false, fog: false,
    vertexShader: 'varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }',
    fragmentShader: `uniform vec3 top, hor, sunCol, sunDir; uniform float sunAmt; varying vec3 vD;
      void main(){ float h = clamp(vD.y, 0., 1.); vec3 c = mix(hor, top, pow(h, .55));
        float s = max(dot(normalize(vD), normalize(sunDir)), 0.); c += sunCol * (pow(s, 600.) * 4. + pow(s, 12.) * .35) * sunAmt;
        gl_FragColor = vec4(c, 1.);
        #include <colorspace_fragment>
      }`,
  }));
  scene.add(sky);

  // Licht
  const sun = new THREE.DirectionalLight('#fff', 3); sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.02;
  Object.assign(sun.shadow.camera, { left: -16, right: 16, top: 16, bottom: -16, near: 1, far: 70 });
  sun.target.position.set(2, 0, -6); scene.add(sun, sun.target);
  const hemi = new THREE.HemisphereLight('#dce7f2', '#b9a58a', 0.6); scene.add(hemi);
  const fill = new THREE.AmbientLight('#fff4e6', 0.12); scene.add(fill);

  const house = buildHouse(scene);

  // ---------- Tageszeiten ----------
  const TOD = {
    morgen: { dir: V(9, 5, 7), sun: '#FFE4C2', si: 2.8, top: '#86B3DE', hor: '#F4E3CB', hs: '#DCE7F2', hg: '#B9A58A', hi: 0.7, lamps: 0, fog: '#dfe3e0', exp: 1.12 },
    mittag: { dir: V(2, 12, 8), sun: '#FFF6E6', si: 3.1, top: '#6FA2D6', hor: '#E8EEF0', hs: '#E3ECF4', hg: '#BFAE92', hi: 0.8, lamps: 0, fog: '#e4e8e6', exp: 1.05 },
    abend: { dir: V(-10, 3.2, 2.5), sun: '#FFAE62', si: 3.4, top: '#3C5280', hor: '#F2A25E', hs: '#9FA9C4', hg: '#B08868', hi: 0.42, lamps: 0.75, fog: '#cfa98a', exp: 1.2 },
    nacht: { dir: V(-5, 8, 6), sun: '#9DB3E6', si: 0.35, top: '#0B1426', hor: '#26314E', hs: '#3A4868', hg: '#2A241F', hi: 0.16, lamps: 1, fog: '#1b2233', exp: 1.25 },
  };
  const cur = { dir: V(0, 1, 0), sun: new THREE.Color(), si: 0, top: new THREE.Color(), hor: new THREE.Color(), hs: new THREE.Color(), hg: new THREE.Color(), hi: 0, lamps: 0, fog: new THREE.Color(), exp: 1.1 };
  function applyTOD() {
    const d = cur.dir.clone().normalize();
    sun.position.copy(sun.target.position).addScaledVector(d, 30);
    sun.color.copy(cur.sun); sun.intensity = cur.si;
    hemi.color.copy(cur.hs); hemi.groundColor.copy(cur.hg); hemi.intensity = cur.hi;
    skyU.top.value.copy(cur.top); skyU.hor.value.copy(cur.hor); skyU.sunDir.value.copy(d); skyU.sunCol.value.copy(cur.sun); skyU.sunAmt.value = cur.si / 3;
    scene.fog.color.copy(cur.fog); renderer.toneMappingExposure = cur.exp;
    house.lamps.forEach(({ l, k }) => (l.intensity = k * cur.lamps));
    house.glow.forEach(({ m, k, base }) => (m.emissiveIntensity = (base || 0) + k * cur.lamps));
    shaftU.col.value.copy(cur.sun); shaftU.amt.value = cur.si > 1 ? Math.min(1, (cur.si - 1) / 2) * (cur.lamps > 0.5 ? 0.85 : 1) : 0; shaftU.dir.value.copy(d);
    dustU.amt.value = 0.35 + shaftU.amt.value * 0.8;
  }
  function setTOD(key, animate = true) {
    const t = TOD[key];
    const target = { dir: t.dir.clone(), sun: new THREE.Color(t.sun), si: t.si, top: new THREE.Color(t.top), hor: new THREE.Color(t.hor), hs: new THREE.Color(t.hs), hg: new THREE.Color(t.hg), hi: t.hi, lamps: t.lamps, fog: new THREE.Color(t.fog), exp: t.exp };
    const from = { dir: cur.dir.clone(), sun: cur.sun.clone(), top: cur.top.clone(), hor: cur.hor.clone(), hs: cur.hs.clone(), hg: cur.hg.clone(), fog: cur.fog.clone(), si: cur.si, hi: cur.hi, lamps: cur.lamps, exp: cur.exp };
    const o = { k: animate && !reduced ? 0 : 1 };
    const step = () => {
      const k = o.k;
      cur.dir.copy(from.dir).lerp(target.dir, k);
      ['sun', 'top', 'hor', 'hs', 'hg', 'fog'].forEach((c) => cur[c].copy(from[c]).lerp(target[c], k));
      ['si', 'hi', 'lamps', 'exp'].forEach((c) => (cur[c] = from[c] + (target[c] - from[c]) * k));
      applyTOD();
    };
    if (o.k === 1) step(); else gsap.to(o, { k: 1, duration: 2.6, ease: 'sine.inOut', onUpdate: step });
    $$('.tod button').forEach((b) => b.classList.toggle('is-on', b.dataset.tod === key));
  }

  // ---------- Sonnenstrahlen durch die Fenster + Staub ----------
  const shaftU = { col: { value: new THREE.Color() }, amt: { value: 0 }, dir: { value: V(0, 1, 0) }, time: { value: 0 } };
  const shaftMat = new THREE.ShaderMaterial({
    uniforms: shaftU, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    vertexShader: 'attribute float aT; varying float vT; varying vec3 vW; void main(){ vT = aT; vec4 w = modelMatrix * vec4(position,1.); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }',
    fragmentShader: `uniform vec3 col; uniform float amt, time; varying float vT; varying vec3 vW;
      void main(){ float a = (1. - vT) * (1. - vT) * .11 * amt; a *= .8 + .2 * sin(vW.x * 3. + vW.z * 2. + time * .4);
        gl_FragColor = vec4(col * a, a); }`,
  });
  const shafts = [];
  function buildShafts() {
    shafts.forEach((m) => { scene.remove(m); m.geometry.dispose(); }); shafts.length = 0;
    const d = cur.dir.clone().normalize().negate(); // Richtung, in die das Licht fällt
    house.windows.forEach((w) => {
      const n = w.axis === 'x' ? V(0, 0, w.normal) : V(w.normal, 0, 0);
      if (d.dot(n) > -0.08) return; // Licht muss von außen nach innen fallen
      const u = w.axis === 'x' ? V(1, 0, 0) : V(0, 0, 1);
      const corners = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([a, b]) => w.c.clone().addScaledVector(u, (a * w.w) / 2).add(V(0, (b * w.h) / 2, 0)));
      const len = 9;
      const far = corners.map((c) => c.clone().addScaledVector(d, len));
      const pos = [], t = [];
      const quad = (a, b, c, e, ta, tb) => { pos.push(...a.toArray(), ...b.toArray(), ...c.toArray(), ...a.toArray(), ...c.toArray(), ...e.toArray()); t.push(ta, ta, tb, ta, tb, tb); };
      for (let i = 0; i < 4; i++) { const j = (i + 1) % 4; quad(corners[i], corners[j], far[j], far[i], 0, 1); }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aT', new THREE.Float32BufferAttribute(t, 1));
      const m = new THREE.Mesh(g, shaftMat); m.frustumCulled = false; m.renderOrder = 2; scene.add(m); shafts.push(m);
    });
  }
  // Staubkörner im Raum
  const DN = 2600, dPos = new Float32Array(DN * 3), dRnd = new Float32Array(DN);
  for (let i = 0; i < DN; i++) { dPos.set([-6.5 + Math.random() * 17, 0.2 + Math.random() * 2.7, -11.6 + Math.random() * 11.2], i * 3); dRnd[i] = Math.random(); }
  const dGeo = new THREE.BufferGeometry(); dGeo.setAttribute('position', new THREE.BufferAttribute(dPos, 3)); dGeo.setAttribute('aR', new THREE.BufferAttribute(dRnd, 1));
  const dustU = { time: { value: 0 }, amt: { value: 0.5 }, col: shaftU.col, px: { value: 1 } };
  const dust = new THREE.Points(dGeo, new THREE.ShaderMaterial({
    uniforms: dustU, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: `attribute float aR; uniform float time, px; varying float vA;
      void main(){ vec3 p = position + vec3(sin(time * .13 + aR * 40.) * .25, sin(time * .09 + aR * 20.) * .18, cos(time * .11 + aR * 30.) * .25);
        vec4 mv = modelViewMatrix * vec4(p, 1.); gl_Position = projectionMatrix * mv;
        gl_PointSize = px * (1.2 + aR * 2.) * 2.2 / -mv.z * 3.; vA = .35 + .65 * (.5 + .5 * sin(time * (1. + aR) + aR * 50.)); }`,
    fragmentShader: `uniform vec3 col; uniform float amt; varying float vA;
      void main(){ float d = length(gl_PointCoord - .5); float a = smoothstep(.5, 0., d) * vA * amt * .55; gl_FragColor = vec4(mix(vec3(1.), col, .5) * a, a); }`,
  }));
  dust.frustumCulled = false; scene.add(dust);
  // Dampf über der Teetasse
  const SN = 70, sR = new Float32Array(SN);
  for (let i = 0; i < SN; i++) sR[i] = i / SN;
  const sGeo = new THREE.BufferGeometry(); sGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(SN * 3), 3)); sGeo.setAttribute('aR', new THREE.BufferAttribute(sR, 1));
  const steamU = { time: { value: 0 }, base: { value: house.teaPos }, px: { value: 1 } };
  const steam = new THREE.Points(sGeo, new THREE.ShaderMaterial({
    uniforms: steamU, transparent: true, depthWrite: false,
    vertexShader: `attribute float aR; uniform float time, px; uniform vec3 base; varying float vA;
      void main(){ float t = fract(aR + time * .12); vec3 p = base + vec3(sin(t * 9. + aR * 30.) * .03 * t, t * .42, cos(t * 7. + aR * 20.) * .03 * t);
        vec4 mv = modelViewMatrix * vec4(p, 1.); gl_Position = projectionMatrix * mv; gl_PointSize = px * (6. + t * 26.) / -mv.z * 3.; vA = sin(t * 3.14159) * .22; }`,
    fragmentShader: 'varying float vA; void main(){ float d = length(gl_PointCoord - .5); gl_FragColor = vec4(vec3(1.), smoothstep(.5, 0., d) * vA); }',
  }));
  steam.frustumCulled = false; scene.add(steam);

  // ---------- Nachbearbeitung: sanftes Leuchten, Filmkorn, Vignette ----------
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth / 2, innerHeight / 2), 0.32, 0.65, 0.88);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());
  const finish = new ShaderPass({
    uniforms: { tDiffuse: { value: null }, time: { value: 0 }, vig: { value: 0.32 } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }',
    fragmentShader: `uniform sampler2D tDiffuse; uniform float time, vig; varying vec2 vUv;
      float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233)) + time) * 43758.5453); }
      void main(){ vec4 c = texture2D(tDiffuse, vUv); float d = distance(vUv, vec2(.5)); c.rgb *= 1. - smoothstep(.35, .95, d) * vig;
        c.rgb += (h(vUv * 1000.) - .5) * .028; gl_FragColor = c; }`,
  });
  composer.addPass(finish);

  // ---------- Kamerafahrt ----------
  const SHOTS = [
    { id: 'ankommen', pos: V(0, 1.6, 7.6), tgt: V(0, 1.45, 0) },
    { id: 'tuer', pos: V(0, 1.62, 1.5), tgt: V(0, 1.5, -4) },
    { id: 'empfang', pos: V(-0.2, 1.66, -0.55), tgt: V(2.6, 1.0, -2.5) },
    { id: 'wohnzimmer', pos: V(-1.0, 1.58, -2.4), tgt: V(-4.6, 0.85, -5.2) },
    { id: 'behandlung', pos: V(0.5, 1.75, -6.3), tgt: V(0.8, 0.8, -9.8) },
    { id: 'training', pos: V(3.4, 1.7, -5.3), tgt: V(7.4, 0.9, -8.4) },
    { id: 'garten', pos: V(7.7, 1.78, -12.7), tgt: V(9.2, 1.45, -19.5) },
  ];
  const posC = new THREE.CatmullRomCurve3(SHOTS.map((s) => s.pos), false, 'centripetal', 0.4);
  const tgtC = new THREE.CatmullRomCurve3(SHOTS.map((s) => s.tgt), false, 'centripetal', 0.4);
  // Halte-Punkte: Scroll-Fortschritt → Kurvenparameter mit Verweilen an jeder Station
  const nS = SHOTS.length - 1;
  function curveT(p) { const x = p * nS, i = Math.min(Math.floor(x), nS - 1), f = x - i; return (i + smooth(0.32, 0.92, f)) / nS; }
  const film = $('#film');
  const cam = { pos: SHOTS[0].pos.clone(), tgt: SHOTS[0].tgt.clone() };
  const ptr = { x: 0, y: 0, sx: 0, sy: 0 };
  addEventListener('pointermove', (e) => { ptr.x = e.clientX / innerWidth * 2 - 1; ptr.y = e.clientY / innerHeight * 2 - 1; });

  // ---------- Oberfläche ----------
  const chapters = $$('.chap'), overlay = $('#overlay'), dock = $('.dock');
  let chap = -1;
  function setChap(i) {
    if (i === chap) return; chap = i;
    chapters.forEach((c, k) => c.classList.toggle('is-on', k === i));
    $$('.progress li').forEach((li, k) => li.classList.toggle('is-on', k <= i));
    $('#chapLabel').textContent = SHOTS[i] ? chapters[i].dataset.label : '';
  }
  // Begrüßung nach echter Uhrzeit
  const hr = new Date().getHours();
  const autoKey = hr >= 5 && hr < 10 ? 'morgen' : hr < 16 ? 'mittag' : hr < 21 ? 'abend' : 'nacht';
  $('#greet').textContent = hr >= 5 && hr < 11 ? 'Guten Morgen.' : hr < 18 ? 'Guten Tag.' : 'Guten Abend.';
  $$('.tod button').forEach((b) => b.addEventListener('click', () => { setTOD(b.dataset.tod); setTimeout(buildShafts, 50); }));
  setTOD(autoKey, false); buildShafts();

  // Therapie-Punkte im Raum
  const HS = {
    manuelle: { t: 'Hände, die verstehen', items: [['Manuelle Therapie', 'Gezielte Handgriffe für Gelenke, Muskeln und Nerven, dort, wo Bewegung blockiert ist. Zertifikatsleistung.'], ['CMD-Therapie', 'Entlastung von Kiefergelenk und Kaumuskulatur, abgestimmt mit Ihrem Zahnarzt.'], ['Atlas-Axis-Therapie', 'Sanfte, präzise Impulse an den Kopfgelenken.'], ['Osteopathische Ansätze', 'Spannungsketten folgen, bis zur Ursache.'], ['Schmerztherapie', 'Ursache statt Symptom: Technik, Übung und Aufklärung in einem Plan.']] },
    manuthera: { t: 'Loyer Manuthera', items: [['Loyer Manuthera', 'Eine Therapieliege, die mitarbeitet: Mobilisation und Traktion der Wirbelsäule in Positionen, die auf einer normalen Liege nicht möglich sind.']] },
    fango: { t: 'Wärme', items: [['Fango · Reizstrom', 'Tiefenwärme lockert die Muskulatur und bereitet auf die Behandlung vor. Reizstrom lindert Schmerzen und aktiviert geschwächte Muskeln.']] },
    stosswelle: { t: 'Stoßwelle', items: [['Stoßwellen-Therapie', 'Radiale Druckwellen direkt am Sehnenansatz, ohne Spritze und ohne OP. Etwa bei Ferse, Achillessehne, Ellenbogen oder Schulter.']] },
    kg: { t: 'Aktiv werden', items: [['Krankengymnastik', 'Kraft, Beweglichkeit und Sicherheit Schritt für Schritt, mit einem kurzen Heimprogramm für zuhause.']] },
    sport: { t: 'Zurück zum Sport', items: [['Sport-Physiotherapie', 'Vom ersten schmerzfreien Schritt bis zurück auf den Platz. Belastung gezielt gesteigert und dokumentiert.']] },
    schlinge: { t: 'Schwerelos', items: [['Traktion im Schlingentisch', 'Unter sanftem Zug entspannen Bandscheiben, Gelenke und Muskulatur.']] },
  };
  const HS_CHAP = { manuelle: 4, manuthera: 4, fango: 4, stosswelle: 4, kg: 5, sport: 5, schlinge: 5 };
  const hsLayer = $('#hotspots');
  const hsEls = Object.entries(house.hotspots).map(([key, p]) => {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'hs'; b.setAttribute('aria-label', HS[key].items[0][0]);
    b.innerHTML = `<span class="dot"></span><span class="tip">${HS[key].items.length > 1 ? HS[key].t : HS[key].items[0][0]}</span>`;
    b.addEventListener('pointerenter', () => b.classList.add('hover')); b.addEventListener('pointerleave', () => b.classList.remove('hover'));
    b.addEventListener('click', () => openDrawer(key)); hsLayer.appendChild(b);
    return { key, p, b };
  });
  const drawer = $('#drawer');
  function openDrawer(key) {
    const h = HS[key];
    $('#drawerBody').innerHTML = `<p class="kicker">Im Haus</p><h3>${h.t}</h3>` + h.items.map(([n, d]) => `<div class="dr-item"><h4>${n}</h4><p>${d}</p></div>`).join('') + '<a class="btn" href="#kontakt">Termin anfragen</a>';
    drawer.classList.add('open'); drawer.setAttribute('aria-hidden', 'false');
    $$('#drawerBody a[href^="#"]').forEach((a) => a.addEventListener('click', (e) => { e.preventDefault(); closeDrawer(); scrollToY($('#kontakt').getBoundingClientRect().top + scrollY); }));
  }
  function closeDrawer() { drawer.classList.remove('open'); drawer.setAttribute('aria-hidden', 'true'); }
  $('#drawerClose').addEventListener('click', closeDrawer);
  addEventListener('keydown', (e) => e.key === 'Escape' && closeDrawer());
  $$('.progress button').forEach((b, i) => b.addEventListener('click', () => { const r = film.getBoundingClientRect(); scrollToY(r.top + scrollY + (i / nS) * (r.height - innerHeight) + 2); }));

  // ---------- Größe ----------
  function resize() {
    camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight, false); composer.setSize(innerWidth, innerHeight);
    const px = renderer.getPixelRatio() * innerHeight / 900; dustU.px.value = px; steamU.px.value = px;
  }
  addEventListener('resize', resize); resize();

  // ---------- Schleife ----------
  const clock = new THREE.Clock();
  const tmp = V(0, 0, 0), proj = V(0, 0, 0);
  function tick() {
    const dt = Math.min(clock.getDelta(), 0.05), t = clock.elapsedTime;
    const r = film.getBoundingClientRect();
    const p = clamp(-r.top / Math.max(1, r.height - innerHeight));
    const inFilm = r.bottom > 0;
    const ct = curveT(p);
    const k = reduced ? 1 : 1 - Math.exp(-dt * 3);
    cam.pos.lerp(posC.getPoint(ct, tmp), k); cam.tgt.lerp(tgtC.getPoint(ct, tmp), k);
    ptr.sx += (ptr.x - ptr.sx) * 0.04; ptr.sy += (ptr.y - ptr.sy) * 0.04;
    camera.position.copy(cam.pos);
    camera.position.y += reduced ? 0 : Math.sin(t * 0.8) * 0.008; // leichtes Atmen der Kamera
    camera.lookAt(cam.tgt.x + ptr.sx * 0.45, cam.tgt.y - ptr.sy * 0.25, cam.tgt.z);
    // Tür öffnet sich
    house.door.rotation.y = -smooth(0.02, 0.15, p) * 1.75;
    setChap(Math.min(nS, Math.round(p * nS - 0.08)));
    // Bewegung im Haus
    if (!reduced) {
      house.sway.forEach((o, i) => (o.rotation.z = Math.sin(t * 0.6 + i) * 0.025));
      house.curtains.forEach(({ mesh, base }, ci) => { const a = mesh.geometry.attributes.position; for (let i = 0; i < a.count; i++) { const x = base[i * 3], y = base[i * 3 + 1]; a.setZ(i, Math.sin(x * 5 + t * 1.3 + ci) * 0.04 * (1 - (y + 1.3) / 2.6) + Math.sin(x * 11 + t * 0.7) * 0.012); } a.needsUpdate = true; });
    }
    shaftU.time.value = t; dustU.time.value = t; steamU.time.value = t; finish.uniforms.time.value = t % 100;
    // Therapie-Punkte
    hsEls.forEach(({ key, p: hp, b }) => {
      const on = chap === HS_CHAP[key];
      proj.copy(hp).project(camera);
      const vis = on && proj.z < 1 && Math.abs(proj.x) < 0.95 && Math.abs(proj.y) < 0.9;
      b.classList.toggle('show', vis);
      if (vis) b.style.transform = `translate(${(proj.x * 0.5 + 0.5) * innerWidth}px, ${(-proj.y * 0.5 + 0.5) * innerHeight}px)`;
    });
    const ended = r.bottom < innerHeight * 0.98;
    overlay.classList.toggle('gone', ended); dock.classList.toggle('gone', ended);
    $('#top').classList.toggle('solid', !inFilm || r.bottom < innerHeight * 0.6);
    if (inFilm && !document.hidden) composer.render();
  }
  gsap.ticker.add(tick);
  // Reserve-Takt (iOS hält rAF in eingebetteten Rahmen an)
  let last = performance.now(); gsap.ticker.add(() => (last = performance.now()));
  setInterval(() => { if (!document.hidden && performance.now() - last > 120) gsap.ticker.tick(); }, 33);

  // Intro
  document.documentElement.classList.add('ready');
  if (!reduced) gsap.from(['#top', '.chap.is-on > *', '.dock'], { opacity: 0, y: 18, duration: 1.6, stagger: 0.12, ease: 'expo.out', delay: 0.3 });
})();
