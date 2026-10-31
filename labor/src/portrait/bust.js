// Platzhalter bis Kais Foto da ist: eine neutrale Büste (keine echte Person), prozedural gebaut.
// Liefert (a) die Geometrie für den 3D-Scan und (b) ein „Foto“ + Tiefenbild, im Browser gerendert.
// Mit echtem Foto: loadPhoto() liefert dieselbe Form { w, h, rgba, depth, canvas }.
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

const SKIN = new THREE.Color('#C4977C'), HAIR = new THREE.Color('#3B2D25'), SHIRT = new THREE.Color('#2D4C59'), LIP = new THREE.Color('#A8695E'), EYE = new THREE.Color('#2A2522');

function colored(g, col, kind) {
  g = g.index ? g.toNonIndexed() : g;
  g.deleteAttribute('uv');
  const n = g.attributes.position.count, c = new Float32Array(n * 3), k = new Float32Array(n);
  for (let i = 0; i < n; i++) { c[i * 3] = col.r; c[i * 3 + 1] = col.g; c[i * 3 + 2] = col.b; k[i] = kind; }
  g.setAttribute('color', new THREE.BufferAttribute(c, 3));
  g.setAttribute('aKind', new THREE.BufferAttribute(k, 1));
  return g;
}
const ell = (r, c, seg = 48) => { const g = new THREE.SphereGeometry(1, seg, Math.round(seg * 0.75)); g.scale(r[0], r[1], r[2]); g.translate(c[0], c[1], c[2]); return g; };

// Teile: 0 Haut, 1 Haar, 2 Hemd, 3 Lippen, 4 Augen
export function bustParts() {
  const P = [];
  // Kopf: Kugel, verformt (Kiefer schmaler, Kinn vor, Hinterkopf rund, Augenhöhlen leicht eingesenkt)
  const head = new THREE.SphereGeometry(1, 72, 56), p = head.attributes.position, v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    const y = v.y;
    let sx = 0.36, sy = 0.5, sz = 0.42;
    const low = THREE.MathUtils.smoothstep(-y, 0.0, 1.0); // unterer Kopf → Kiefer
    sx *= 1 - 0.32 * low; sz *= 1 - 0.12 * low;
    let x = v.x * sx, yy = y * sy, z = v.z * sz;
    if (z > 0) z *= 1 + 0.08 * low;                         // Kinn/Kiefer nach vorn
    if (z < 0) { z *= 1.05; yy += 0.03 * Math.max(0, -v.z); } // Hinterkopf
    // Augenhöhlen
    for (const ex of [-0.13, 0.13]) { const d = Math.hypot(x - ex, yy - 0.06); if (z > 0.2) z -= 0.05 * Math.exp(-(d * d) / 0.006); }
    // Brauenbogen + Wangenknochen
    if (z > 0.2) { z += 0.02 * Math.exp(-((yy - 0.14) ** 2) / 0.002) * Math.exp(-(x * x) / 0.05); z += 0.015 * Math.exp(-((yy + 0.03) ** 2) / 0.006) * Math.exp(-((Math.abs(x) - 0.17) ** 2) / 0.004); }
    p.setXYZ(i, x, yy + 0.02, z);
  }
  head.computeVertexNormals();
  P.push(colored(head, SKIN, 0));
  // Nase
  const nose = new THREE.ConeGeometry(0.055, 0.2, 24, 1); nose.rotateX(-0.35); nose.scale(1, 1, 0.8); nose.translate(0, 0.0, 0.43);
  P.push(colored(nose, SKIN, 0));
  P.push(colored(ell([0.07, 0.04, 0.05], [0, -0.085, 0.43], 24), SKIN, 0));
  // Lippen, Augen, Ohren
  P.push(colored(ell([0.085, 0.022, 0.04], [0, -0.17, 0.4], 28), LIP, 3));
  P.push(colored(ell([0.075, 0.018, 0.04], [0, -0.205, 0.39], 28), LIP, 3));
  for (const ex of [-0.13, 0.13]) P.push(colored(ell([0.042, 0.022, 0.03], [ex, 0.07, 0.355], 20), EYE, 4));
  for (const s of [-1, 1]) P.push(colored(ell([0.035, 0.1, 0.065], [s * 0.36, 0.02, -0.02], 24), SKIN, 0));
  // Haar: Kappe über Oberkopf und Hinterkopf
  const hair = new THREE.SphereGeometry(1, 64, 48, 0, Math.PI * 2, 0, Math.PI * 0.58), hp = hair.attributes.position;
  for (let i = 0; i < hp.count; i++) {
    v.fromBufferAttribute(hp, i);
    let x = v.x * 0.385, y = v.y * 0.53 + 0.05, z = v.z * 0.445;
    if (v.z > 0.25 && v.y < 0.55) y += (0.55 - v.y) * 0.5 * v.z; // Stirn frei
    hp.setXYZ(i, x, y, z - 0.012);
  }
  hair.computeVertexNormals();
  P.push(colored(hair, HAIR, 1));
  // Hals, Schultern, Kragen
  const neck = new THREE.CylinderGeometry(0.16, 0.19, 0.5, 40, 1, true); neck.translate(0, -0.6, -0.03);
  P.push(colored(neck, SKIN, 0));
  const torso = ell([0.95, 0.5, 0.36], [0, -1.18, -0.05], 64);
  P.push(colored(torso, SHIRT, 2));
  const collar = new THREE.TorusGeometry(0.21, 0.035, 12, 48); collar.rotateX(Math.PI / 2 - 0.25); collar.translate(0, -0.78, 0.0);
  P.push(colored(collar, SHIRT.clone().multiplyScalar(1.25), 2));
  return P;
}

export function bustGeometry() { return mergeGeometries(bustParts(), false); }

// „Foto“ + Tiefenbild rendern (eigener, danach freigegebener WebGL-Zugang)
export function renderPhoto(w = 480, h = 600) {
  const canvas = document.createElement('canvas');
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: false }); } catch (e) { return null; }
  renderer.setSize(w, h, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const scene = new THREE.Scene();
  const geo = bustGeometry();
  const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.62, metalness: 0 }));
  mesh.rotation.y = -0.28;
  scene.add(mesh);
  scene.add(new THREE.HemisphereLight(0xbcd4e0, 0x1a1410, 0.55));
  const key = new THREE.DirectionalLight(0xffe2c4, 2.6); key.position.set(-1.6, 1.4, 2.2); scene.add(key);
  const fill = new THREE.DirectionalLight(0x9cc4e4, 0.6); fill.position.set(2, 0.3, 1.5); scene.add(fill);
  const rim = new THREE.DirectionalLight(0xffffff, 1.6); rim.position.set(1.2, 1.5, -2); scene.add(rim);
  const cam = new THREE.PerspectiveCamera(24, w / h, 0.1, 20);
  cam.position.set(0, -0.2, 4.6); cam.lookAt(0, -0.32, 0);
  // Hintergrund: ruhiger, dunkler Verlauf wie ein Studiofoto
  const bg = document.createElement('canvas'); bg.width = 2; bg.height = 256;
  const bx = bg.getContext('2d'), gr = bx.createLinearGradient(0, 0, 0, 256);
  gr.addColorStop(0, '#22343b'); gr.addColorStop(1, '#0d181d'); bx.fillStyle = gr; bx.fillRect(0, 0, 2, 256);
  const bgTex = new THREE.CanvasTexture(bg); bgTex.colorSpace = THREE.SRGBColorSpace; scene.background = bgTex;

  const rt = new THREE.WebGLRenderTarget(w, h, { colorSpace: THREE.SRGBColorSpace });
  renderer.setRenderTarget(rt); renderer.render(scene, cam);
  const rgba = new Uint8Array(w * h * 4); renderer.readRenderTargetPixels(rt, 0, 0, w, h, rgba);
  // Tiefe: Abstand zur Kamera, 1 = nah, 0 = Hintergrund
  scene.background = null;
  const dmat = new THREE.ShaderMaterial({
    vertexShader: 'varying float vZ; void main(){ vec4 mv = modelViewMatrix * vec4(position,1.); vZ = -mv.z; gl_Position = projectionMatrix * mv; }',
    fragmentShader: 'varying float vZ; void main(){ float d = clamp((5.3 - vZ) / 1.4, 0., 1.); gl_FragColor = vec4(d, d, d, 1.); }',
  });
  mesh.material = dmat;
  renderer.setClearColor(0x000000, 1);
  const rt2 = new THREE.WebGLRenderTarget(w, h);
  renderer.setRenderTarget(rt2); renderer.render(scene, cam);
  const dpx = new Uint8Array(w * h * 4); renderer.readRenderTargetPixels(rt2, 0, 0, w, h, dpx);
  renderer.setRenderTarget(null);
  rt.dispose(); rt2.dispose(); geo.dispose(); renderer.dispose(); renderer.forceContextLoss();
  // Zeilen umdrehen (WebGL liest von unten)
  const flip = (src, ch) => { const out = new Uint8ClampedArray(src.length), row = w * ch; for (let y = 0; y < h; y++) out.set(src.subarray((h - 1 - y) * row, (h - y) * row), y * row); return out; };
  const img = flip(rgba, 4), dimg = flip(dpx, 4);
  const depth = new Float32Array(w * h); for (let i = 0; i < w * h; i++) depth[i] = dimg[i * 4] / 255;
  const c2 = document.createElement('canvas'); c2.width = w; c2.height = h;
  c2.getContext('2d').putImageData(new ImageData(img, w, h), 0, 0);
  return { w, h, rgba: img, depth, canvas: c2 };
}
