// Drei Porträt-Ideen. Alle nutzen dieselbe Bildquelle { w, h, rgba, depth, canvas } (jetzt Büste, später Kais Foto).
import * as THREE from 'three';
import { stage, FRAG, COL, C, reduced, damp, smooth, isDesktop, ease, dragYaw } from '../manu/common.js';
import { stipple, coreOf, coreMaterial, stippleMaterial, stipSize } from '../manu/stipple.js';
import { bustParts } from './bust.js';

const ASPECT = 600 / 480; // Höhe/Breite des Bildes
const lum = (img, x, y) => { const i = (y * img.w + x) * 4; return (0.2126 * img.rgba[i] + 0.7152 * img.rgba[i + 1] + 0.0722 * img.rgba[i + 2]) / 255; };
const ortho = (st) => {
  // Bild füllt die Bühne (contain), Koordinaten: Bild -0.5..0.5 breit, -A/2..A/2 hoch
  const cam = new THREE.OrthographicCamera(-0.5, 0.5, 0.5, -0.5, -10, 10);
  const fit = () => {
    const a = st.aspect, m = 1.04;
    let vw = m, vh = m / a;
    if (vh < ASPECT * m) { vh = ASPECT * m; vw = vh * a; }
    cam.left = -vw / 2; cam.right = vw / 2; cam.top = vh / 2; cam.bottom = -vh / 2; cam.updateProjectionMatrix();
  };
  return { cam, fit };
};

function depthTex(img) {
  const dd = new Uint8Array(img.w * img.h * 4);
  for (let y = 0; y < img.h; y++) for (let x = 0; x < img.w; x++) { const o = ((img.h - 1 - y) * img.w + x) * 4, v = Math.round(img.depth[y * img.w + x] * 255); dd[o] = dd[o + 1] = dd[o + 2] = v; dd[o + 3] = 255; }
  const t = new THREE.DataTexture(dd, img.w, img.h); t.needsUpdate = true; return t;
}

// ---------- 1 · „Spannung lösen“: gestochenes Bild, darunter das echte Foto ----------
export function initOne(canvas, img, ui = {}) {
  const st = stage(canvas, { fov: 30 }); if (!st) return null;
  const { cam, fit } = ortho(st); st.camera = cam;
  const tex = new THREE.CanvasTexture(img.canvas); tex.colorSpace = THREE.SRGBColorSpace;
  // Maske (wo gelöst wurde): kleine Leinwand, verblasst langsam wieder
  const MW = 120, MH = Math.round(120 * ASPECT), mc = document.createElement('canvas'); mc.width = MW; mc.height = MH;
  const mx = mc.getContext('2d'); mx.fillStyle = '#000'; mx.fillRect(0, 0, MW, MH);
  const mtex = new THREE.CanvasTexture(mc);
  const U = { uPhoto: { value: tex }, uMask: { value: mtex }, uDepth: { value: depthTex(img) }, uPix: { value: 1 }, uTime: { value: 0 }, uPtr: { value: new THREE.Vector2(9, 9) }, cBone: { value: C('#F3EADA') }, cAmber: { value: COL.amber } };
  // Foto-Ebene: nur wo die Maske offen ist
  const plane = new THREE.Mesh(new THREE.PlaneGeometry(1, ASPECT), new THREE.ShaderMaterial({
    uniforms: U, transparent: true, depthWrite: false,
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }',
    fragmentShader: /* glsl */`
      uniform sampler2D uPhoto, uMask, uDepth; varying vec2 vUv;
      void main(){
        float m = texture2D(uMask, vUv).r;
        vec4 c = texture2D(uPhoto, vUv);
        gl_FragColor = vec4(c.rgb, smoothstep(.05, .6, m) * smoothstep(.0, .05, texture2D(uDepth, vUv).r));
        #include <colorspace_fragment>
      }`,
  }));
  st.scene.add(plane);
  // Stich: gleichmäßige Punkte, Größe nach Helligkeit (helle Stellen = größere Punkte)
  const desk = isDesktop(), cols = desk ? 118 : 88, rows = Math.round(cols * ASPECT), P = [], S = [], R = [];
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
    const u = (i + 0.5 + (j % 2) * 0.5) / cols, v = (j + 0.5) / rows;
    const ix = Math.min(img.w - 1, Math.floor(u * img.w)), iy = Math.min(img.h - 1, Math.floor(v * img.h));
    const L = lum(img, ix, iy);
    if (img.depth[iy * img.w + ix] < 0.02 || L < 0.05) continue; // nur die Person, kein Hintergrund
    P.push(u - 0.5, (0.5 - v) * ASPECT, 0); S.push(Math.min(1, Math.pow(L * 1.35, 0.9))); R.push(Math.random());
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
  g.setAttribute('aL', new THREE.Float32BufferAttribute(S, 1));
  g.setAttribute('aR', new THREE.Float32BufferAttribute(R, 1));
  const cell = 1 / cols;
  U.uCell = { value: cell };
  st.scene.add(new THREE.Points(g, new THREE.ShaderMaterial({
    uniforms: U, transparent: true, depthWrite: false, fragmentShader: FRAG,
    vertexShader: /* glsl */`
      attribute float aL, aR; uniform sampler2D uMask; uniform float uPix, uTime, uCell; uniform vec2 uPtr; uniform vec3 cBone, cAmber;
      varying vec3 vCol; varying float vA;
      void main(){
        vec2 uv = vec2(position.x + .5, .5 + position.y / ${ASPECT.toFixed(4)});
        float m = texture2D(uMask, uv).r;
        vec3 p = position;
        vec2 d = p.xy - uPtr; float r = length(d);
        p.xy += normalize(d + 1e-5) * .03 * exp(-r * r / .004) * (1. - m);   // weichen dem Finger aus
        p.x += sin(uTime * .8 + aR * 6.28) * .0006;
        vec4 mv = modelViewMatrix * vec4(p, 1.); gl_Position = projectionMatrix * mv;
        gl_PointSize = uPix * (.35 + aL * 1.25) * uCell * 900.;
        vCol = mix(cBone, cAmber, smoothstep(.75, 1., aL) * .35);
        vA = (.35 + aL * .75) * (1. - smoothstep(.1, .7, m));
      }`,
  })));
  // Eingabe: Maus/Finger löst, ohne Eingabe wandert ein Lichtpunkt
  let lastIn = -1e9; const ptr = new THREE.Vector2(9, 9);
  const toImg = (e) => { const r = canvas.getBoundingClientRect(); const x = ((e.clientX - r.left) / r.width) * 2 - 1, y = -(((e.clientY - r.top) / r.height) * 2 - 1); const w = new THREE.Vector3(x, y, 0).unproject(cam); return new THREE.Vector2(w.x, w.y); };
  canvas.addEventListener('pointermove', (e) => { ptr.copy(toImg(e)); lastIn = performance.now(); });
  canvas.addEventListener('pointerleave', () => ptr.set(9, 9));
  const paint = (x, y, rad, a) => {
    const px = (x + 0.5) * MW, py = (0.5 - y / ASPECT) * MH, R2 = rad * MW;
    const gr = mx.createRadialGradient(px, py, 0, px, py, R2); gr.addColorStop(0, `rgba(255,255,255,${a})`); gr.addColorStop(1, 'rgba(255,255,255,0)');
    mx.fillStyle = gr; mx.fillRect(px - R2, py - R2, R2 * 2, R2 * 2);
  };
  let t = 0;
  function update(_t, dt) {
    if (ui.isPaused && ui.isPaused()) dt = 0;
    t += dt * (reduced ? 0.5 : 1);
    fit(); U.uPix.value = st.renderer.getPixelRatio() * Math.min(st.w, st.h / ASPECT) / 900;
    U.uTime.value = t;
    // Maske verblasst langsam („die Spannung kehrt zurück“)
    mx.globalCompositeOperation = 'source-over'; mx.fillStyle = `rgba(0,0,0,${dt > 0 ? 0.018 : 0})`; mx.fillRect(0, 0, MW, MH);
    mx.globalCompositeOperation = 'lighter';
    const idle = performance.now() - lastIn > 2500;
    if (!idle && ptr.x < 5) paint(ptr.x, ptr.y, 0.09, 0.22);
    else if (idle && dt > 0) { const a = t * 0.45; const ax = Math.sin(a) * 0.22, ay = Math.sin(a * 1.7 + 1) * 0.28 + 0.12; paint(ax, ay, 0.085, 0.16); ptr.set(ax, ay); }
    mtex.needsUpdate = true;
    U.uPtr.value.copy(ptr);
  }
  return { st, update };
}

// ---------- 2 · Partikel → Foto (Scroll) ----------
export function initTwo(canvas, img, section, ui = {}) {
  const st = stage(canvas, { fov: 26 }); if (!st) return null;
  const tex = new THREE.CanvasTexture(img.canvas); tex.colorSpace = THREE.SRGBColorSpace;
  const desk = isDesktop(), cols = desk ? 170 : 115, rows = Math.round(cols * ASPECT);
  const P = [], T = [], CC = [], R = [];
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
    const u = (i + 0.5) / cols, v = (j + 0.5) / rows, x = Math.floor(u * img.w), y = Math.floor(v * img.h);
    const k = (y * img.w + x) * 4, d = img.depth[y * img.w + x];
    const L = lum(img, x, y);
    if (d < 0.02) continue; // nur die Person
    T.push(u - 0.5, (0.5 - v) * ASPECT, d * 0.22);
    CC.push(img.rgba[k] / 255, img.rgba[k + 1] / 255, img.rgba[k + 2] / 255);
    // Start: lockere Wolke
    const a = Math.random() * Math.PI * 2, b = Math.acos(Math.random() * 2 - 1), r = 0.9 + Math.random() * 0.9;
    P.push(Math.sin(b) * Math.cos(a) * r, Math.cos(b) * r * 0.8, Math.sin(b) * Math.sin(a) * r);
    R.push(Math.random(), Math.random());
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
  g.setAttribute('aT', new THREE.Float32BufferAttribute(T, 3));
  g.setAttribute('aC', new THREE.Float32BufferAttribute(CC, 3));
  g.setAttribute('aR', new THREE.Float32BufferAttribute(R, 2));
  const U = { uP: { value: 0 }, uPix: { value: 1 }, uTime: { value: 0 }, uPhoto: { value: tex }, uRot: { value: new THREE.Vector2() }, uCell: { value: 1 / cols } };
  const pts = new THREE.Points(g, new THREE.ShaderMaterial({
    uniforms: U, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fragmentShader: FRAG,
    vertexShader: /* glsl */`
      attribute vec3 aT, aC; attribute vec2 aR; uniform float uP, uPix, uTime, uCell; uniform vec2 uRot;
      varying vec3 vCol; varying float vA;
      void main(){
        float k = smoothstep(aR.x * .25, aR.x * .25 + .55, uP / .6);       // sammeln (gestaffelt)
        vec3 cloud = position + vec3(sin(uTime * .3 + aR.y * 6.28), cos(uTime * .25 + aR.x * 6.28), 0.) * .05;
        vec3 p = mix(cloud, aT, k);
        float s = sin(uRot.x), c = cos(uRot.x); p = vec3(c * p.x + s * p.z, p.y, -s * p.x + c * p.z);
        p.y += uRot.y * p.z * .3;
        vec4 mv = modelViewMatrix * vec4(p, 1.); gl_Position = projectionMatrix * mv;
        gl_PointSize = uPix * mix(.004, uCell * 2.7, k) / -mv.z;
        vec3 tone = mix(vec3(.93, .87, .78), aC * 1.15, smoothstep(.4, 1., k));
        vCol = tone; vA = mix(.35, .95, k) * (1. - smoothstep(.62, .82, uP));
      }`,
  }));
  st.scene.add(pts);
  // Foto als Relief (Tiefe verschiebt das Gitter leicht)
  const dtex = depthTex(img);
  U.uDepth = { value: dtex }; U.uFade = { value: 0 };
  const plane = new THREE.Mesh(new THREE.PlaneGeometry(1, ASPECT, 120, 150), new THREE.ShaderMaterial({
    uniforms: U, transparent: true, depthWrite: false,
    vertexShader: /* glsl */`
      uniform sampler2D uDepth; uniform vec2 uRot; varying vec2 vUv;
      void main(){ vUv = uv; float d = texture2D(uDepth, uv).r; vec3 p = position + vec3(0., 0., d * .22);
        float s = sin(uRot.x), c = cos(uRot.x); p = vec3(c * p.x + s * p.z, p.y, -s * p.x + c * p.z); p.y += uRot.y * p.z * .3;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.); }`,
    fragmentShader: /* glsl */`
      uniform sampler2D uPhoto, uDepth; uniform float uFade; varying vec2 vUv;
      void main(){ vec4 c = texture2D(uPhoto, vUv); gl_FragColor = vec4(c.rgb, uFade * smoothstep(.01, .06, texture2D(uDepth, vUv).r));
        #include <colorspace_fragment>
      }`,
  }));
  st.scene.add(plane);
  const ptr = new THREE.Vector2();
  addEventListener('pointermove', (e) => { ptr.set(e.clientX / innerWidth - 0.5, e.clientY / innerHeight - 0.5); }, { passive: true });
  let t = 0;
  function update(_t, dt) {
    if (ui.isPaused && ui.isPaused()) dt = 0;
    t += dt;
    const r = section.getBoundingClientRect();
    const p = Math.min(1, Math.max(0, -r.top / Math.max(1, r.height - innerHeight)));
    U.uP.value = reduced ? 1 : damp(U.uP.value, p, 6, dt || 0.016);
    U.uFade.value = smooth(0.6, 0.85, U.uP.value);
    U.uTime.value = t; U.uPix.value = st.renderer.getPixelRatio() * st.h;
    const sway = reduced ? 0 : Math.sin(t * 0.4) * 0.08;
    U.uRot.value.set(damp(U.uRot.value.x, ptr.x * 0.5 + sway + (1 - U.uP.value) * 0.6, 3, dt || 0.016), damp(U.uRot.value.y, ptr.y * 0.3, 3, dt || 0.016));
    const fitD = Math.max(ASPECT * 1.14, 1.14 / st.aspect) / (2 * Math.tan(THREE.MathUtils.degToRad(13)));
    st.camera.position.set(0, 0, fitD); st.camera.lookAt(0, 0, 0);
    ui.onProgress && ui.onProgress(U.uP.value);
  }
  return { st, update };
}

// ---------- 3 · 3D-Scan: Punktwolke der Büste, gestochen, Echtfarben ----------
export function initThree(canvas, ui = {}) {
  const st = stage(canvas, { fov: 26 }); if (!st) return null;
  const parts = bustParts().map((g) => ({ geo: g, kind: g.attributes.aKind.array[0], map: (v) => ({ la: v, lb: v, a: 0, b: 0, w: 0 }), dens: g.attributes.aKind.array[0] === 4 || g.attributes.aKind.array[0] === 3 ? 2.5 : 1 }));
  const pts = stipple(parts, isDesktop() ? 60000 : 26000);
  const core = coreOf(parts);
  const M = [new THREE.Matrix4()];
  const U = {
    uM: { value: M }, uStip: { value: 1 }, uMaxSize: { value: 5 }, uCut: { value: reduced ? 99 : -9 }, uInset: { value: 0.004 },
    cCore: { value: C('#0E1C22') }, cBone: { value: C('#F3EADA') }, cAmber: { value: COL.amber }, cBlue: { value: COL.blue },
    cSkin: { value: C('#D8AA8C') }, cHair: { value: C('#4A3A30') }, cShirt: { value: C('#3E6878') }, cLip: { value: C('#B87668') }, cEye: { value: C('#3A3430') },
  };
  // Schnitt-Scan läuft von oben nach unten: hier über die Höhe (y) statt x → Achsen tauschen über uM
  const coreMesh = new THREE.Mesh(core, coreMaterial(U, 1));
  const ptsMesh = new THREE.Points(pts.geo, stippleMaterial(U, 1, /* glsl */`
    uniform vec3 cSkin, cHair, cShirt, cLip, cEye, cBlue;`, /* glsl */`
    vec3 base = aKind < .5 ? cSkin : aKind < 1.5 ? cHair : aKind < 2.5 ? cShirt : aKind < 3.5 ? cLip : cEye;
    col = base * (.32 + 1.05 * lam) + vec3(.55, .75, .9) * rim * .3;
    sz = aKind > 2.5 ? .7 : 1.;`));
  [coreMesh, ptsMesh].forEach((o) => { o.frustumCulled = false; st.scene.add(o); });
  const cam = { yaw: 0, yawTarget: 0, lastUser: -1e9, dragging: false };
  dragYaw(canvas, cam);
  let t = 0, scan = reduced ? 1 : 0;
  const rot = new THREE.Matrix4(), tilt = new THREE.Matrix4();
  function update(_t, dt) {
    if (ui.isPaused && ui.isPaused()) { dt = 0; scan = 1; U.uCut.value = 99; }
    t += dt;
    // Scan von links nach rechts über die gedrehte Büste (wie bei der Liege)
    if (scan < 1) { scan = Math.min(1, scan + dt / 2.6); U.uCut.value = -1.3 + ease(scan) * 2.8; if (scan >= 1) U.uCut.value = 99; }
    if (!cam.dragging && performance.now() - cam.lastUser > 3000 && !reduced) cam.yawTarget += dt * 0.25;
    cam.yaw = damp(cam.yaw, cam.yawTarget, 5, dt || 0.016);
    M[0].copy(rot.makeRotationY(cam.yaw - 0.35)).premultiply(tilt.makeRotationX(0.04));
    U.uStip.value = stipSize(st, 26, pts.spacing, 0.6);
    const d = 4.3 * (st.aspect < 0.9 ? 0.9 / st.aspect : 1);
    st.camera.position.set(0, -0.15, d); st.camera.lookAt(0, -0.3, 0);
  }
  return { st, update };
}
