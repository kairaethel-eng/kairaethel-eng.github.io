// Qualitätsprobe Anatomie (Auftrag Kai 13.11.2026, Schritt 1 des Plans „Anatomie-Neustart“):
// Das unveränderte Glas-Material der Vorschau „Glas“ (glas/main.js: glassF, ghostF, depthF, Lichtschein) auf echten Anatomie-Daten.
// Tafel 1: Kopf-Bild neben der ganzen Wirbelsäule · Tafel 2: Lendenwirbel L4 nah · Tafel 3: Abschnitt L4–L5 hervorgehoben.
// Daten: BodyParts3D, © The Database Center for Life Science (tools/anatomie.mjs). Zwei Netze zum Vergleich, unten umschaltbar:
//   fein = Ausgabe 3.0 (~444 000 Dreiecke; Lizenz dieser Ausgabe vor Veröffentlichung klären) · grob = Ausgabe 4.0 (~124 000, CC BY 4.0).
//   Die feine Netzdatei liegt nicht im Repo (.gitignore); fehlt sie beim Bauen, zeigt die Probe nur „grob“ und der Netz-Umschalter entfällt.
// Zweiter Umschalter: Glas „wie bisher“ (unverändert) oder „feiner“ (dunkler, schmalere Kanten – näher am Kopf-Bild).
import * as THREE from 'three';
import { decode } from '../anatomie/load.js';
import GROB from '../anatomie/wirbelsaeule.bin';
import FEIN from '../anatomie/wirbelsaeule-fein.bin';
import { IMG, IMG_W, IMG_H } from '../glas/img.js';

const $ = (s) => document.querySelector(s);
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const canvas = $('#gl');
let renderer = null;
try {
  renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, premultipliedAlpha: true, powerPreference: 'high-performance' });
  if (!renderer.capabilities.isWebGL2) throw new Error('WebGL 2 fehlt');
} catch (e) { renderer = null; $('.nogl').hidden = false; }
if (renderer) start();

function start() {
  renderer.setClearColor(0x000000, 0);
  const DPR = Math.min(devicePixelRatio || 1, 2);
  renderer.setPixelRatio(DPR);
  const scene = new THREE.Scene();
  const cam = new THREE.OrthographicCamera(0, 1, 0, -1, -9000, 9000);   // Bildschirm-Pixel, y nach unten negativ (wie glas/main.js)
  let W = 1, H = 1;

  // ---- Material „Röntgen-Glas“: wörtlich aus glas/main.js ----------------------------------------
  const glassV = `varying vec3 vN, vO; varying vec2 vUv;
    void main(){ vN = normalize(normalMatrix * normal); vO = position; vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`;
  const glassF = `
    varying vec3 vN, vO; varying vec2 vUv; uniform vec3 uCol, uHot; uniform float uAct, uOp, uTex, uRev, uFade, uFine;
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
      // Variante „feiner“ (Probe 13.11.): dunkleres Glas, schmale helle Kanten, kleinere Glanzpunkte – näher am Kopf-Bild
      float rimF = pow(1. - ndv, 3.2) + pow(1. - ndv, 12.) * .9;
      vec3 cF = base * (.028 + .13 * dif) * grain + edge * rimF + vec3(1.) * pow(spec, 2.2) * .4;
      c = mix(c, cF, uFine); rim = mix(rim, rimF * .8, uFine);
      c += vec3(1., .8, .5) * exp(-pow((vO.y - uRev) / 1.5, 2.)) * (uFade > 0. ? .15 : .6);
      float a = uOp * (1. + uAct * .45) * grow * (uFade > 0. ? 1. - smoothstep(uFade, 1., vUv.x) : 1.);
      gl_FragColor = vec4(c * a, (.05 + .45 * rim) * a);
    }`;
  const ADD = { blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor, blendSrcAlpha: THREE.OneFactor, blendDstAlpha: THREE.OneFactor };
  const ghostF = `
    varying vec3 vN, vO; uniform vec3 uCol, uHot; uniform float uAct, uOp, uRev, uFine;
    void main(){ float rim = pow(1. - abs(normalize(vN).z), mix(2., 4., uFine)); gl_FragColor = vec4(mix(uCol, uHot, uAct) * (.03 + .3 * rim) * mix(1., .7, uFine) * uOp * step(uRev, vO.y), 0.); }`;
  const depthF = 'varying vec3 vO; uniform float uRev; void main(){ if (vO.y < uRev) discard; gl_FragColor = vec4(0.); }';
  const fine = { value: /[?&]m=0/.test(location.search) ? 0 : 1 };     // 0 = Glas wie bisher, 1 = feiner (unten umschaltbar)
  const glassU = (col, hot, tex) => ({ uFine: fine, uCol: { value: new THREE.Color(col) }, uHot: { value: new THREE.Color(hot) }, uAct: { value: 0 }, uOp: { value: 1 }, uTex: { value: tex }, uRev: { value: -1e5 }, uFade: { value: 0 } });
  function solid(geo, u, grp) {
    const m = new THREE.Mesh(geo, new THREE.ShaderMaterial({ uniforms: u, vertexShader: glassV, fragmentShader: glassF, transparent: true, premultipliedAlpha: true, depthTest: true, depthWrite: false, side: THREE.FrontSide }));
    const dm = new THREE.Mesh(geo, new THREE.ShaderMaterial({ uniforms: u, vertexShader: glassV, fragmentShader: depthF, colorWrite: false }));
    const gm = new THREE.Mesh(geo, new THREE.ShaderMaterial({ uniforms: u, vertexShader: glassV, fragmentShader: ghostF, transparent: true, ...ADD, depthTest: false, depthWrite: false, side: THREE.BackSide }));
    gm.renderOrder = -0.5; m.add(dm, gm);
    m.traverse((o) => o.layers.set(1)); grp.add(m);
    return u;
  }

  // ---- Wirbelsäule aus den Anatomie-Daten --------------------------------------------------------
  const LWS = ['L1', 'dL1', 'L2', 'dL2', 'L3', 'dL3', 'L4', 'dL4', 'L5', 'dL5', 'S'], HOT = ['L4', 'dL4', 'L5'];
  const EL = [1, 2, 3].map((i) => $(`[data-stage="${i}"]`));
  function buildSet(A) {                                                                  // je Netz drei Gruppen: alles · L4 allein · Abschnitt L4–L5
    const part = (p, grp, act) => {
      const u = p.kind === 'disc' ? glassU(0xBFD9EE, 0xF0683C, 30) : glassU(0x9CCBF2, 0xFFB45A, p.id === 'S' ? 9 : 14);
      u.uAct.value = act ? 1 : 0; if (p.kind === 'disc') u.uOp.value = 0.7 + 0.8 * u.uAct.value;
      return solid(p.geo, u, grp);
    };
    const box = (ids) => ids.reduce((b, id) => b.union(A.byId(id).box), new THREE.Box3());
    const g1 = new THREE.Group(), g2 = new THREE.Group(), g3 = new THREE.Group();
    scene.add(g1, g2, g3);
    A.parts.forEach((p) => part(p, g1, false));
    part(A.byId('L4'), g2, false);
    LWS.forEach((id) => part(A.byId(id), g3, HOT.includes(id)));
    const all = box(A.parts.map((p) => p.id)), lws = box(LWS);
    return [
      { g: g1, c: all.getCenter(new THREE.Vector3()), h: all.max.y - all.min.y },
      { g: g2, c: A.byId('L4').center.clone(), w: A.byId('L4').geo.boundingSphere.radius * 2 },
      { g: g3, c: lws.getCenter(new THREE.Vector3()), h: lws.max.y - lws.min.y },
    ];
  }
  const HAS_FEIN = FEIN.length > 0;                                                        // feine Netzdatei beim Bauen vorhanden?
  const SETS = HAS_FEIN ? [buildSet(decode(FEIN)), buildSet(decode(GROB))] : [buildSet(decode(GROB))];   // mit fein: 0 = fein, 1 = grob
  let net = HAS_FEIN && /[?&]n=1/.test(location.search) ? 1 : 0;

  // ---- Kopf-Bild (Tafel 1): leuchtet additiv wie auf der Glas-Seite, ohne Bildrand -----------------
  const tex = new THREE.Texture(), im = new Image();
  const imgU = { uTex: { value: tex }, uReady: { value: 0 } };
  im.onload = () => { tex.image = im; tex.generateMipmaps = true; tex.minFilter = THREE.LinearMipmapLinearFilter; tex.needsUpdate = true; imgU.uReady.value = 1; };
  im.src = IMG;
  const pic = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.ShaderMaterial({
    uniforms: imgU, transparent: true, premultipliedAlpha: true, depthTest: false, depthWrite: false,
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }',
    fragmentShader: `varying vec2 vUv; uniform sampler2D uTex; uniform float uReady;
      void main(){ vec3 c = texture2D(uTex, vUv).rgb * uReady;
        float edge = smoothstep(0., .06, vUv.x) * smoothstep(1., .9, vUv.x) * smoothstep(0., .22, vUv.y) * smoothstep(1., .97, vUv.y);
        gl_FragColor = vec4(c * edge, clamp(max(c.r, max(c.g, c.b)) * 1.3, 0., 1.) * edge); }`,
  }));
  pic.renderOrder = -1; scene.add(pic);

  // ---- Lichtschein (wie glas/main.js) -------------------------------------------------------------
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

  function resize() {
    W = canvas.clientWidth; H = canvas.clientHeight;
    renderer.setSize(W, H, false);
    cam.right = W; cam.bottom = -H; cam.updateProjectionMatrix();
    const dw = Math.max(4, Math.round(W * DPR / 2)), dh = Math.max(4, Math.round(H * DPR / 2));
    rtA.setSize(dw, dh); rtB.setSize(dw >> 1, dh >> 1); rtC.setSize(dw >> 1, dh >> 1);
  }
  new ResizeObserver(resize).observe(canvas); resize();

  // Gruppe so legen, dass der Körperpunkt c (cm) auf dem Bildschirmpunkt (x, y) liegt
  const e = new THREE.Euler(), v = new THREE.Vector3();
  function place(g, c, s, x, y, rx, ry) {
    e.set(rx, ry, 0); g.quaternion.setFromEuler(e); g.scale.setScalar(s);
    v.copy(c).multiplyScalar(s).applyQuaternion(g.quaternion);
    g.position.set(x - v.x, -y - v.y, 0);
  }
  let last = 0, time = 0;
  function frame(now) {
    requestAnimationFrame(frame);
    if (document.hidden) return;
    const dt = Math.min(0.05, (now - last) / 1000 || 0); last = now;
    if (!reduced) time += dt;
    const osc = Math.sin(time * 0.45);
    let any = false;
    SETS.forEach((set, k) => { if (k !== net) set.forEach((st) => { st.g.visible = false; }); });
    SETS[net].forEach((st, i) => {
      const r = EL[i].getBoundingClientRect(), on = r.bottom > -40 && r.top < H + 40;
      st.g.visible = on; if (i === 0) pic.visible = on;
      if (!on) return; any = true;
      if (i === 0) {                                                                    // Bild links, Wirbelsäule rechts (Blick wie im Bild: nach rechts)
        const pw = r.width * 0.72, ph = pw * IMG_H / IMG_W;
        pic.scale.set(pw, ph, 1); pic.position.set(r.left + r.width * -0.03 + pw / 2, -(r.top + r.height * 0.06 + ph / 2), -100);
        place(st.g, st.c, (r.height * 0.9) / st.h, r.left + r.width * 0.8, r.top + r.height * 0.5, 0, Math.PI / 2 - 0.52 + osc * 0.16);
      } else if (i === 1) {                                                             // L4 dreht sich langsam, leicht von oben gesehen
        place(st.g, st.c, Math.min(r.width * 0.8, r.height * 0.8) / st.w, r.left + r.width * 0.5, r.top + r.height * 0.52, 0.32, reduced ? 0.95 : time * 0.3 + 0.95);
      } else {                                                                          // Abschnitt L4–L5
        place(st.g, st.c, (r.height * 0.86) / st.h, r.left + r.width * 0.5, r.top + r.height * 0.5, 0.05, Math.PI / 2 - 0.62 + osc * 0.22);
      }
    });
    glow.visible = any; glow.material.uniforms.uK.value = fine.value ? 0.85 : 1.05;
    if (any) {
      cam.layers.set(1); renderer.setRenderTarget(rtA); renderer.render(scene, cam);
      blur(rtA, rtB, 1.5 / rtA.width, 0); blur(rtB, rtC, 0, 1.5 / rtB.height);
      blur(rtC, rtB, 2.6 / rtC.width, 0); blur(rtB, rtC, 0, 2.6 / rtB.height);
      renderer.setRenderTarget(null);
    }
    cam.layers.enableAll();
    renderer.render(scene, cam);
  }
  requestAnimationFrame(frame);
  // Umschalter „Glas: wie bisher / feiner“
  const sw = [...document.querySelectorAll('.sw button')];
  const mark = () => sw.forEach((b) => b.setAttribute('aria-pressed', (b.dataset.fine ? +b.dataset.fine === fine.value : +b.dataset.net === net) ? 'true' : 'false'));
  sw.forEach((b) => b.addEventListener('click', () => { if (b.dataset.fine) fine.value = +b.dataset.fine; else net = +b.dataset.net; mark(); }));
  document.querySelectorAll('[data-fein]').forEach((el) => { el.hidden = !HAS_FEIN; });
  mark(); $('.sw').hidden = false;
  window.__probe = { SETS, fine, net: () => net, time: () => time };
}
