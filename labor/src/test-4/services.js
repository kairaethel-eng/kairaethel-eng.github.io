// Leistungen als Partikel-Motive: eine Bühne, die Punkte formen je Leistung ein kleines Motiv
// (Hände, Hantel, Ball, Schmerzwelle, Kiefer, Atlas, Stoßwelle, Schlingentisch, Faszien-Netz, Fango/Reizstrom, Manuthera).
// Alles im Browser gerechnet, keine Bilder. Reihenfolge = Liste „Alle Leistungen“.
import * as THREE from 'three';
import { stage, FRAG, reduced, isDesktop, C } from '../manu/common.js';

const R = Math.random;
// Bewegungsarten (im Shader): 0 ruhig · 1 Hände drücken · 2 Welle läuft nach außen · 3 Drehen (Atlas) · 4 Kiefer öffnet
// 5 Wärme steigt · 6 Pendeln · 7 Springen · 8 Netz wogt · 9 Funke · 10 Schmerzwelle beruhigt sich · 11 Liegenteil kippt · 12 Heben
const P = () => ({ list: [] });
const add = (m, w, fn) => m.list.push({ w, fn });
const v = (x, y, z) => [x, y, z];
function seg(a, b, r = 0) { return () => { const t = R(), ang = R() * 6.283, rr = r * Math.sqrt(R()); return [a[0] + (b[0] - a[0]) * t + Math.cos(ang) * rr, a[1] + (b[1] - a[1]) * t + Math.sin(ang) * rr, a[2] + (b[2] - a[2]) * t + Math.cos(ang + 1.7) * rr]; }; }
function capsule(a, b, r) { // Oberfläche einer Kapsel (vereinfacht: Mantel)
  const d = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], L = Math.hypot(...d), u = d.map((x) => x / L);
  const p0 = Math.abs(u[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
  const n1 = [u[1] * p0[2] - u[2] * p0[1], u[2] * p0[0] - u[0] * p0[2], u[0] * p0[1] - u[1] * p0[0]], l1 = Math.hypot(...n1); n1.forEach((_, i) => (n1[i] /= l1));
  const n2 = [u[1] * n1[2] - u[2] * n1[1], u[2] * n1[0] - u[0] * n1[2], u[0] * n1[1] - u[1] * n1[0]];
  return () => { const t = R(), ang = R() * 6.283, c = Math.cos(ang) * r, s = Math.sin(ang) * r; return [0, 1, 2].map((i) => a[i] + d[i] * t + n1[i] * c + n2[i] * s); };
}
function ell(c, r) { return () => { const u = R() * 2 - 1, a = R() * 6.283, q = Math.sqrt(1 - u * u); return [c[0] + q * Math.cos(a) * r[0], c[1] + u * r[1], c[2] + q * Math.sin(a) * r[2]]; }; }
function box(c, s) { return () => { const f = Math.floor(R() * 6), a = R() - 0.5, b = R() - 0.5, sg = f % 2 ? 0.5 : -0.5; const p = f < 2 ? [sg, a, b] : f < 4 ? [a, sg, b] : [a, b, sg]; return [c[0] + p[0] * s[0], c[1] + p[1] * s[1], c[2] + p[2] * s[2]]; }; }
function ring(c, r, a0 = 0, a1 = 6.283, plane = 'xz', thick = 0.02) { return () => { const a = a0 + R() * (a1 - a0), rr = r + (R() - 0.5) * thick; return plane === 'xz' ? [c[0] + Math.cos(a) * rr, c[1] + (R() - 0.5) * thick, c[2] + Math.sin(a) * rr] : [c[0] + Math.cos(a) * rr, c[1] + Math.sin(a) * rr, c[2] + (R() - 0.5) * thick]; }; }

// Teil = { w (Anteil), fn (Punkt), k (Farbe 0 Knochen, 1 Bernstein, 2 Blau, 3 Grün, 4 Petrol), a (Bewegung), ph(p) (Phase) }
const T = (w, fn, k, a = 0, ph = () => R()) => ({ w, fn, k, a, ph });
function hand(sx, y = 0.15, a = 1) {
  const parts = [T(12, ell([sx * 0.62, y, 0], [0.3, 0.11, 0.27]), 0, a), T(7, capsule([sx * 0.95, y + 0.08, 0], [sx * 1.5, y + 0.32, 0], 0.13), 0, a)];
  [-0.19, -0.065, 0.065, 0.19].forEach((z, i) => parts.push(T(3.2, capsule([sx * 0.36, y, z], [sx * (0.06 + Math.abs(z) * 0.3), y - 0.09 - i * 0.004, z * 1.05], 0.058), 0, a)));
  parts.push(T(2.6, capsule([sx * 0.55, y - 0.02, 0.26], [sx * 0.3, y - 0.08, 0.42], 0.055), 0, a));
  return parts;
}
export const MOTIFS = [
  { name: 'Manuelle Therapie', parts: () => [...hand(1), ...hand(-1), T(6, ring([0, -0.22, 0], 0.2, 0, 6.283, 'xz', 0.06), 1, 0), T(3, ell([0, -0.22, 0], [0.1, 0.07, 0.1]), 1, 0), T(5, ring([0, -0.36, 0], 0.26, 0, 6.283, 'xz', 0.05), 4, 0)] },
  { name: 'Krankengymnastik', parts: () => [T(6, capsule([-0.5, 0, 0], [0.5, 0, 0], 0.045), 0, 12), T(8, () => { const s = R() < 0.5 ? -1 : 1, p = ell([s * 0.5, 0, 0], [0.07, 0.24, 0.24])(); return p; }, 0, 12), T(8, () => { const s = R() < 0.5 ? -1 : 1; return ell([s * 0.64, 0, 0], [0.05, 0.19, 0.19])(); }, 4, 12),
    T(5, () => { const a = -1.2 + R() * 2.4; return [Math.sin(a) * 0.95, -0.15 + Math.cos(a) * 0.55 - 0.35, 0]; }, 1, 2, (p) => (p[0] + 1) / 2), T(5, seg([-1.2, -0.75, -0.4], [1.2, -0.75, 0.4]), 4, 0)] },
  { name: 'Sport-Physiotherapie', parts: () => [T(14, ell([0.25, -0.05, 0], [0.32, 0.32, 0.32]), 0, 7), T(3, ring([0.25, -0.05, 0], 0.325, 0, 6.283, 'xy', 0.02), 1, 7),
    ...[-0.12, 0.02, 0.16].map((y, i) => T(2.5, seg([-1.15 + i * 0.12, y, 0], [-0.25 + i * 0.05, y, 0]), 2, 2, (p) => (p[0] + 1.2) / 1.0)), T(5, seg([-1.2, -0.42, -0.35], [1.2, -0.42, 0.35], 0.01), 4, 0)] },
  { name: 'Schmerztherapie', parts: () => [-0.42, 0, 0.42].map((y, i) => T(10, () => [(R() * 2 - 1) * 1.2, y, (R() - 0.5) * 0.06], i === 0 ? 1 : i === 1 ? 0 : 2, 10, () => i / 2)) },
  { name: 'CMD-Therapie', parts: () => {
    const U = (y, rx, rz, a, k, th) => () => { const t = (R() * 2 - 1) * 1.55; return [Math.sin(t) * rx + (R() - 0.5) * th, y + (R() - 0.5) * th, Math.cos(t) * rz - 0.12 + (R() - 0.5) * th]; };
    const parts = [T(12, U(-0.32, 0.56, 0.5, 4, 0, 0.12), 0, 4), T(8, U(0.02, 0.6, 0.52, 0, 4, 0.08), 4, 0)];
    [-1, 1].forEach((s) => { parts.push(T(4, capsule([s * 0.56, -0.3, -0.12], [s * 0.58, 0.28, -0.4], 0.07), 0, 4)); parts.push(T(2.4, ell([s * 0.58, 0.33, -0.42], [0.08, 0.06, 0.08]), 1, 4)); parts.push(T(1.6, ell([s * 0.6, 0.4, -0.42], [0.1, 0.03, 0.1]), 1, 0)); });
    for (let i = 0; i < 12; i++) { const t = -1.3 + (i / 11) * 2.6; parts.push(T(0.55, box([Math.sin(t) * 0.5, -0.2, Math.cos(t) * 0.45 - 0.12], [0.06, 0.08, 0.05]), 0, 4)); parts.push(T(0.55, box([Math.sin(t) * 0.52, -0.1, Math.cos(t) * 0.47 - 0.12], [0.06, 0.08, 0.05]), 0, 0)); }
    return parts; } },
  { name: 'Atlas-Axis-Therapie', parts: () => [T(9, ring([0, 0.25, -0.05], 0.48, 0, 6.283, 'xz', 0.09), 0, 3), ...[-1, 1].map((s) => T(5, ell([s * 0.42, 0.25, 0], [0.15, 0.12, 0.2]), 0, 3)), ...[-1, 1].map((s) => T(3, capsule([s * 0.5, 0.25, 0], [s * 0.9, 0.27, -0.05], 0.06), 0, 3)),
    T(9, ell([0, -0.38, 0.12], [0.24, 0.26, 0.22]), 4, 0), T(4, capsule([0, -0.15, 0.2], [0, 0.32, 0.22], 0.08), 1, 0), T(4, capsule([0, -0.3, -0.05], [0, -0.42, -0.6], 0.07), 4, 0)] },
  { name: 'Stoßwellen-Therapie', parts: () => [T(10, capsule([-1.0, 0.85, 0], [-0.32, 0.18, 0], 0.13), 0, 0), T(6, ell([-0.24, 0.1, 0], [0.17, 0.17, 0.17]), 1, 0), T(3, () => { const t = R(); return [-1.0 - t * 0.2, 0.85 + Math.sin(t * 3) * 0.12 + t * 0.15, (R() - 0.5) * 0.03]; }, 4, 0),
    ...[0, 1, 2, 3, 4, 5].map((i) => T(3.5, ring([-0.14, 0.0, 0], 0.22 + i * 0.18, -1.7, -0.2, 'xy', 0.025), 1, 2, () => i / 5))] },
  { name: 'Traktion im Schlingentisch', parts: () => [T(6, box([0, 1.0, 0], [2.3, 0.06, 0.12]), 4, 0), ...[-0.65, 0.55].flatMap((x) => [T(3, seg([x, 0.97, 0], [x, -0.08, 0]), 2, 6, (p) => (0.97 - p[1]) / 1.05), T(3, ring([x, -0.16, 0], 0.13, Math.PI, 2 * Math.PI, 'xy', 0.03), 2, 6, () => 1)]),
    T(12, capsule([-1.0, -0.18, 0], [1.0, -0.26, 0], 0.11), 0, 6, () => 1), T(4, seg([-1.2, -0.75, -0.4], [1.2, -0.75, 0.4]), 4, 0)] },
  { name: 'Osteopathische Ansätze', parts: () => [T(18, () => { const x = (R() * 2 - 1) * 1.15, z = (R() * 2 - 1) * 0.55; const onLine = R() < 0.5; const gx = onLine ? Math.round(x / 0.23) * 0.23 : x, gz = onLine ? z : Math.round(z / 0.18) * 0.18; return [gx, -0.35, gz]; }, 2, 8), ...hand(1, 0.25, 0).map((p) => ({ ...p, fn: ((f) => () => { const q = f(); return [q[0] - 0.55, q[1], q[2]]; })(p.fn) }))] },
  // Thermische Behandlung: links Fangopackung mit aufsteigender Wärme, rechts Kältepackung mit Frost-Hof (Kai 2.11.: Fango + Kälte als ein Thema)
  { name: 'Thermische Behandlung', parts: () => [T(10, box([-0.6, -0.35, 0], [0.8, 0.14, 0.5]), 1, 0), ...[-0.85, -0.6, -0.35].map((x) => T(3.5, () => { const t = R(); return [x + Math.sin(t * 9) * 0.06, -0.25 + t * 0.95, 0]; }, 1, 5, (p) => (p[1] + 0.25) / 0.95)),
    T(9, box([0.6, -0.35, 0], [0.72, 0.12, 0.46]), 2, 0), T(5, () => { const a = R() * 6.283, t = Math.sqrt(R()); return [0.6 + Math.cos(a) * t * 0.42, -0.05 + Math.sin(a) * t * 0.3, (R() - 0.5) * 0.08]; }, 2, 10, () => R()),
    ...[0, 1, 2].map((i) => T(1.6, seg([0.6 + Math.cos(i * 1.047) * -0.18, 0.05 + Math.sin(i * 1.047) * -0.18, 0], [0.6 + Math.cos(i * 1.047) * 0.18, 0.05 + Math.sin(i * 1.047) * 0.18, 0]), 2, 0))] },
  // Reizstrom: zwei Elektroden, dazwischen springt der Funke, Kabel nach unten
  { name: 'Reizstrom', parts: () => [...[-0.45, 0.45].map((x) => T(5, box([x, -0.38, 0], [0.34, 0.05, 0.34]), 2, 0)), T(4, () => { const t = R(); return [-0.45 + t * 0.9, -0.15 + Math.abs(Math.sin(t * 18)) * 0.14, 0]; }, 2, 9),
    T(3, () => { const t = R(), s = R() < 0.5 ? -0.45 : 0.45; return [s, -0.36 + t * 0.35, (R() - 0.5) * 0.02]; }, 4, 0), ...[-0.45, 0.45].map((x) => T(2.5, seg([x, -0.41, 0], [x * 1.6, -0.8, 0.1]), 4, 0))] },
  { name: 'Lojer Manuthera', parts: () => [T(4, box([-0.95, 0, 0], [0.3, 0.1, 0.32]), 0, 0), T(6, box([-0.55, 0, 0], [0.45, 0.1, 0.6]), 0, 0), T(6, box([-0.05, 0, 0], [0.48, 0.1, 0.6]), 0, 0), T(10, box([0.62, 0, 0], [0.8, 0.1, 0.6]), 1, 11),
    T(5, box([0, -0.33, 0], [0.9, 0.22, 0.24]), 4, 0), T(4, box([0, -0.68, 0], [1.4, 0.04, 0.5]), 4, 0)] },
];

export function initServices(canvas, ui = {}) {
  const st = stage(canvas, { fov: 30, transparent: true });
  if (!st) return null;
  const N = isDesktop() ? 7000 : 4500;
  // alle Motive vorab: Position, Farbe, Bewegungsart, Phase
  const sets = MOTIFS.map((m) => {
    const parts = m.parts(), tot = parts.reduce((s, q) => s + q.w, 0);
    const pos = new Float32Array(N * 3), kind = new Float32Array(N), anim = new Float32Array(N * 2);
    let i = 0;
    parts.forEach((q, qi) => {
      const cnt = qi === parts.length - 1 ? N - i : Math.round((q.w / tot) * N);
      for (let j = 0; j < cnt && i < N; j++, i++) { const p = q.fn(); pos.set(p, i * 3); kind[i] = q.k; anim[i * 2] = q.a; anim[i * 2 + 1] = q.ph(p); }
    });
    // Reihenfolge mischen, damit Teile beim Wechsel gleichmäßig wandern
    for (let a = N - 1; a > 0; a--) { const b = Math.floor(R() * (a + 1)); for (let c = 0; c < 3; c++) { const t = pos[a * 3 + c]; pos[a * 3 + c] = pos[b * 3 + c]; pos[b * 3 + c] = t; } let t = kind[a]; kind[a] = kind[b]; kind[b] = t; for (let c = 0; c < 2; c++) { t = anim[a * 2 + c]; anim[a * 2 + c] = anim[b * 2 + c]; anim[b * 2 + c] = t; } }
    return { pos, kind, anim };
  });
  const rnd = new Float32Array(N * 3); for (let i = 0; i < rnd.length; i++) rnd[i] = R();
  const g = new THREE.BufferGeometry();
  const A = new Float32Array(sets[0].pos), KA = new Float32Array(sets[0].kind);
  g.setAttribute('position', new THREE.BufferAttribute(A, 3));
  g.setAttribute('aKindA', new THREE.BufferAttribute(KA, 1));
  g.setAttribute('pos2', new THREE.BufferAttribute(new Float32Array(sets[0].pos), 3));
  g.setAttribute('aKind', new THREE.BufferAttribute(new Float32Array(sets[0].kind), 1));
  g.setAttribute('aAnim', new THREE.BufferAttribute(new Float32Array(sets[0].anim), 2));
  g.setAttribute('aRnd', new THREE.BufferAttribute(rnd, 3));
  const U = { uT: { value: 1 }, uTime: { value: 0 }, uPix: { value: 1 }, cols: { value: [C('#EDE5D3'), C('#E59A2F'), C('#5AA2D6'), C('#8BC34A'), C('#5F8EA0')] } };
  const pts = new THREE.Points(g, new THREE.ShaderMaterial({
    uniforms: U, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fragmentShader: FRAG,
    vertexShader: /* glsl */`
      attribute vec3 pos2, aRnd; attribute float aKind, aKindA; attribute vec2 aAnim;
      uniform float uT, uTime, uPix; uniform vec3 cols[5];
      varying vec3 vCol; varying float vA;
      vec3 rotY(vec3 p, float a){ float c = cos(a), s = sin(a); return vec3(c*p.x + s*p.z, p.y, -s*p.x + c*p.z); }
      vec3 rotX(vec3 p, float a){ float c = cos(a), s = sin(a); return vec3(p.x, c*p.y - s*p.z, s*p.y + c*p.z); }
      vec3 rotZ(vec3 p, float a){ float c = cos(a), s = sin(a); return vec3(c*p.x - s*p.y, s*p.x + c*p.y, p.z); }
      float zig(float x){ return (abs(fract(x * 1.6) - .5) * 4. - 1.) * .2; }
      void main(){
        float t = uTime, type = aAnim.x, ph = aAnim.y, al = 1.;
        vec3 b = pos2;
        if (type > .5 && type < 1.5) b.x -= sign(b.x) * .06 * (.5 + .5 * sin(t * 1.6));
        else if (type > 1.5 && type < 2.5) al = .25 + .9 * pow(fract(ph - t * .45), 2.);
        else if (type > 2.5 && type < 3.5) b = rotY(b, sin(t * .8) * .45);
        else if (type > 3.5 && type < 4.5) { vec3 pv = vec3(0., .4, -.42); b = rotX(b - pv, (.5 + .5 * sin(t * 1.3)) * .2) + pv; }
        else if (type > 4.5 && type < 5.5) al = .2 + .9 * pow(fract(ph - t * .35), 2.);
        else if (type > 5.5 && type < 6.5) b.x += sin(t * 1.1) * .09 * ph;
        else if (type > 6.5 && type < 7.5) b.y += abs(sin(t * 2.2)) * .32;
        else if (type > 7.5 && type < 8.5) { b.y += sin(b.x * 3.5 + t * 1.6) * .07 + cos(b.z * 5. + t) * .03; }
        else if (type > 8.5 && type < 9.5) al = step(.4, fract(sin(floor(t * 12.) * 1.7 + aRnd.x * 91.) * 43758.5)) * 1.4;
        else if (type > 9.5 && type < 10.5) { float calm = smoothstep(-.3, .7, sin(t * .55)); b.y += mix(zig(b.x + ph), sin(b.x * 2.6 + t * 1.2 + ph * 2.) * .14, calm); }
        else if (type > 10.5 && type < 11.5) { b = rotZ(b - vec3(.22, 0., 0.), sin(t * .9) * .22) + vec3(.22, 0., 0.); }
        else if (type > 11.5) b.y += (.5 + .5 * sin(t * 1.4)) * .3;
        float k = smoothstep(aRnd.y * .35, aRnd.y * .35 + .65, uT);
        vec3 dir = normalize(aRnd - .5 + 1e-4);
        vec3 p = mix(position, b, k) + dir * sin(k * 3.14159) * .25;
        p += vec3(sin(t * .7 + aRnd.x * 6.28), cos(t * .6 + aRnd.z * 6.28), 0.) * .006;
        p = rotY(p, sin(t * .25) * .35);
        vec4 mv = modelViewMatrix * vec4(p, 1.); gl_Position = projectionMatrix * mv;
        gl_PointSize = uPix * (.8 + aRnd.z * .5) * 11. / -mv.z;
        vCol = mix(cols[int(aKindA + .5)], cols[int(aKind + .5)], k);
        vA = mix(.8, al, k) * (.55 + aRnd.x * .45);
      }`,
  }));
  pts.frustumCulled = false; st.scene.add(pts);
  let cur = 0, t = 0;
  function show(i) {
    if (i === cur || i < 0 || i >= sets.length) return;
    // aktuellen Zwischenstand als neuen Start übernehmen (ohne Sprung)
    const B = g.attributes.pos2.array, KB = g.attributes.aKind.array, u = U.uT.value;
    for (let n = 0; n < N; n++) {
      const r = rnd[n * 3 + 1] * 0.35, x = Math.min(1, Math.max(0, (u - r) / 0.65)), k = x * x * (3 - 2 * x);
      for (let c = 0; c < 3; c++) A[n * 3 + c] += (B[n * 3 + c] - A[n * 3 + c]) * k;
      KA[n] = k > 0.5 ? KB[n] : KA[n];
    }
    g.attributes.pos2.array.set(sets[i].pos); g.attributes.aKind.array.set(sets[i].kind); g.attributes.aAnim.array.set(sets[i].anim);
    ['position', 'aKindA', 'pos2', 'aKind', 'aAnim'].forEach((a) => (g.attributes[a].needsUpdate = true));
    U.uT.value = reduced ? 1 : 0; cur = i;
    ui.onShow && ui.onShow(i, MOTIFS[i].name);
  }
  function update(_t, dt) {
    if (ui.isPaused && ui.isPaused()) dt = 0;
    t += dt * (reduced ? 0.5 : 1);
    U.uTime.value = t;
    U.uT.value = Math.min(1, U.uT.value + dt / 1.3);
    U.uPix.value = st.renderer.getPixelRatio() * st.h / 500;
    const d = 5.6 * (st.aspect < 1.1 ? 1.1 / st.aspect : 1);
    st.camera.position.set(0, 1.55, d); st.camera.lookAt(0, -0.12, 0);
  }
  ui.onShow && ui.onShow(0, MOTIFS[0].name);
  return { st, update, show, get current() { return cur; } };
}
