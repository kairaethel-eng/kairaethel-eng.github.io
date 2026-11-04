// „Gestochene“ Partikel wie bei der Wirbelsäule in Kapitel 03:
// gleichmäßiger Mindestabstand (Poisson-artig), dunkler Kern verdeckt die Rückseite, Licht und Schatten.
// Jedes Teil liegt in Ruhe-Weltkoordinaten vor; map() ordnet Punkte und Kern-Ecken den bewegten Segmenten zu.
import * as THREE from 'three';
import { MeshSurfaceSampler } from 'three/examples/jsm/math/MeshSurfaceSampler.js';
import { runSync, every, poissonGrid, bounds } from '../shared/slice.js';

const prep = (geo) => {
  const g = geo.index ? geo.toNonIndexed() : geo;
  if (!g.attributes.normal) g.computeVertexNormals();
  return g;
};
const area = (g) => {
  const P = g.attributes.position.array, a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();
  let s = 0;
  for (let i = 0; i < P.length; i += 9) { a.fromArray(P, i); b.fromArray(P, i + 3); c.fromArray(P, i + 6); s += b.sub(a).cross(c.sub(a)).length() / 2; }
  return s;
};

// parts: { geo, kind, map(v, col) → { la, lb, a, b, w }, keep?(n, v), sample?: false, core?: false, dens?: Faktor }
// Als Generator (yield = darf pausieren, siehe shared/slice.js); stipple() rechnet am Stück.
export const stipple = (parts, n) => runSync(stippleGen(parts, n));
export function* stippleGen(parts, n) {
  const S = [];
  for (const p of parts) {
    if (p.sample === false) continue;
    const g = prep(p.geo), A = area(g) * (p.dens || 1);
    S.push({ p, A, sampler: new MeshSurfaceSampler(new THREE.Mesh(g)).build(), box: bounds(g.attributes.position.array) });
    yield;
  }
  const total = S.reduce((s, x) => s + x.A, 0);
  const cum = new Float64Array(S.length); let acc = 0; S.forEach((s, i) => { acc += s.A; cum[i] = acc; });
  const r = Math.sqrt(total / n) * 0.78;
  const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
  S.forEach(({ box }) => { for (let c = 0; c < 3; c++) { min[c] = Math.min(min[c], box.min[c]); max[c] = Math.max(max[c], box.max[c]); } });
  const grid = poissonGrid(min, max, r, n);
  const out = { P: new Float32Array(n * 3), P2: new Float32Array(n * 3), N: new Float32Array(n * 3), SA: new Float32Array(n), SB: new Float32Array(n), W: new Float32Array(n), K: new Float32Array(n) };
  const v = new THREE.Vector3(), nv = new THREE.Vector3(), col = new THREE.Color();
  const tick = every(512);
  let tries = 0, count = 0, miss = 0;
  // Versuche begrenzen: insgesamt n·6, und Schluss, wenn die Fläche gesättigt ist (400 Fehlversuche in Folge)
  while (count < n && tries++ < n * 6 && miss < 400) {
    if (tick()) yield;
    const x = Math.random() * total; let i = 0; while (cum[i] < x) i++;
    const s = S[i];
    s.sampler.sample(v, nv, col);
    if (s.p.keep && !s.p.keep(nv, v)) continue;
    const rr = r / Math.sqrt(s.p.dens || 1);
    if (!grid.free(v.x, v.y, v.z, rr * rr)) { miss++; continue; }
    miss = 0;
    grid.add(v.x, v.y, v.z);
    const m = s.p.map(v, col);
    out.P[count * 3] = m.la.x; out.P[count * 3 + 1] = m.la.y; out.P[count * 3 + 2] = m.la.z;
    out.P2[count * 3] = m.lb.x; out.P2[count * 3 + 1] = m.lb.y; out.P2[count * 3 + 2] = m.lb.z;
    out.N[count * 3] = nv.x; out.N[count * 3 + 1] = nv.y; out.N[count * 3 + 2] = nv.z;
    out.SA[count] = m.a; out.SB[count] = m.b; out.W[count] = m.w; out.K[count] = s.p.kind;
    count++;
  }
  for (const k of ['P', 'P2', 'N']) out[k] = out[k].slice(0, count * 3);
  for (const k of ['SA', 'SB', 'W', 'K']) out[k] = out[k].slice(0, count);
  return { geo: toGeo(out), count, spacing: r };
}

// Dunkler Kern aus denselben Teilen (alle Ecken über map() an die Segmente gebunden); coreOfGen: ein Teil je Zeitscheibe
export const coreOf = (parts) => runSync(coreOfGen(parts));
export function* coreOfGen(parts) {
  const out = { P: [], P2: [], N: [], SA: [], SB: [], W: [], K: [] };
  const v = new THREE.Vector3(), col = new THREE.Color();
  for (const p of parts) {
    if (p.core === false) continue;
    const g = prep(p.geo), P = g.attributes.position.array, N = g.attributes.normal.array, C = g.attributes.color ? g.attributes.color.array : null;
    for (let i = 0; i < P.length; i += 3) {
      v.fromArray(P, i); if (C) col.fromArray(C, i);
      const m = p.map(v, col);
      out.P.push(m.la.x, m.la.y, m.la.z); out.P2.push(m.lb.x, m.lb.y, m.lb.z); out.N.push(N[i], N[i + 1], N[i + 2]);
      out.SA.push(m.a); out.SB.push(m.b); out.W.push(m.w); out.K.push(p.kind);
    }
    yield;
  }
  return toGeo(out);
}

function toGeo(o) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(o.P, 3));
  g.setAttribute('pos2', new THREE.Float32BufferAttribute(o.P2, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(o.N, 3));
  g.setAttribute('aSegA', new THREE.Float32BufferAttribute(o.SA, 1));
  g.setAttribute('aSegB', new THREE.Float32BufferAttribute(o.SB, 1));
  g.setAttribute('aW', new THREE.Float32BufferAttribute(o.W, 1));
  g.setAttribute('aKind', new THREE.Float32BufferAttribute(o.K, 1));
  return g;
}

// ---------- Shader-Bausteine ----------
export const DEFORM = (NSEG) => /* glsl */`
  attribute vec3 pos2; attribute float aSegA, aSegB, aW, aKind;
  uniform mat4 uM[${NSEG}];
  vec3 deformP(vec3 la, vec3 lb){
    int a = int(aSegA + .5), b = int(aSegB + .5);
    return mix((uM[a] * vec4(la, 1.)).xyz, (uM[b] * vec4(lb, 1.)).xyz, aW);
  }
  vec3 deformN(vec3 n){
    int a = int(aSegA + .5), b = int(aSegB + .5);
    return normalize(mix(mat3(uM[a]) * n, mat3(uM[b]) * n, aW));
  }
  const vec3 LDIR = vec3(-.38, .78, .5);`;

// Kern: dunkle Füllung, leicht nach innen versetzt
export function coreMaterial(U, NSEG) {
  return new THREE.ShaderMaterial({
    uniforms: U,
    vertexShader: DEFORM(NSEG) + /* glsl */`
      uniform float uInset; varying float vX; varying float vL;
      void main(){
        vec3 p = deformP(position - normal * uInset, pos2 - normal * uInset);
        vL = max(dot(deformN(normal), normalize(LDIR)), 0.); vX = p.x;
        gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.);
      }`,
    fragmentShader: /* glsl */`
      uniform float uCut; uniform vec3 cCore, cBone; varying float vX; varying float vL;
      void main(){
        if (vX > uCut) discard;
        gl_FragColor = vec4(cCore + cBone * vL * .045, 1.);
        #include <colorspace_fragment>
      }`,
  });
}

// Gestochene Punkte: deckend, beleuchtet; colorGLSL setzt col (und optional sz) aus aKind, lam, rim, p
export function stippleMaterial(U, NSEG, decl, colorGLSL) {
  return new THREE.ShaderMaterial({
    uniforms: U,
    vertexShader: DEFORM(NSEG) + decl + /* glsl */`
      uniform float uStip, uMaxSize, uCut; uniform vec3 cAmber;
      varying vec3 vCol; varying float vX;
      void main(){
        vec3 p = deformP(position, pos2), n = deformN(normal);
        vec3 V = normalize(cameraPosition - p);
        float lam = max(dot(n, normalize(LDIR)), 0.);
        float rim = pow(1. - abs(dot(n, V)), 3.);
        vec3 col = vec3(1.); float sz = 1.;
        ${colorGLSL}
        float g = exp(-pow((p.x - uCut) * 7., 2.));
        col = mix(col, cAmber * 1.3, g);
        vCol = col; vX = p.x;
        vec4 mv = viewMatrix * vec4(p, 1.);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = clamp(uStip * sz * (1. + g * .7) / -mv.z, 1., uMaxSize);
      }`,
    fragmentShader: /* glsl */`
      uniform float uCut; varying vec3 vCol; varying float vX;
      void main(){
        float d = length(gl_PointCoord - .5);
        if (d > .5 || vX > uCut) discard;
        gl_FragColor = vec4(vCol * (1. - smoothstep(.18, .5, d) * .5), 1.);
        #include <colorspace_fragment>
      }`,
  });
}

// Punktgröße so, dass der Abstand der Punkte auf dem Bildschirm stimmt (wie Kapitel 03)
export const stipSize = (st, fov, spacing, k = 0.62) => st.renderer.getPixelRatio() * st.h * 0.5 / Math.tan(THREE.MathUtils.degToRad(fov / 2)) * spacing * k;

// Geometrie-Helfer
export function capsule(a, b, r, seg = 14) {
  const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b), d = B.clone().sub(A), len = d.length();
  const g = new THREE.CapsuleGeometry(r, len, 6, seg);
  g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()));
  g.translate((A.x + B.x) / 2, (A.y + B.y) / 2, (A.z + B.z) / 2);
  return g;
}
export function ellipsoid(c, r, seg = 28) {
  const g = new THREE.SphereGeometry(1, seg, Math.round(seg * 0.6));
  g.scale(r[0], r[1], r[2]); g.translate(c[0], c[1], c[2]);
  g.computeVertexNormals();
  return g;
}
export function box(c, s, seg = [1, 1, 1]) {
  const g = new THREE.BoxGeometry(s[0], s[1], s[2], seg[0], seg[1], seg[2]);
  g.translate(c[0], c[1], c[2]);
  return g;
}
