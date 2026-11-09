// „Hausbesuch · Puls“ – die Praxis als begehbare Punktwolke (Scan-Optik) in Weltkoordinaten.
// Quelle der Punkte = test-4/praxis.js (praxisScan); Shader für Linien, Möbel, Kern, Haustür und Logo-Schild
// stammen aus dem Rundgang aus Augenhöhe (ego/tour.js) und wurden hier um einen Aufbau-Schnitt (uCut: die Praxis
// „entsteht“ vom Boden bis zur Decke), eine Gesamthelligkeit (uLum) und treibende Staubpartikel ergänzt.
// Puls (test-4) und der Augenhöhen-Rundgang bleiben unverändert – dieser Baustein ist eine eigene Kopie.
import * as THREE from 'three';
import { EYE } from '../test-4/praxis.js';

export const K = 0.0149;                       // Grundriss-Pixel → Formeinheiten (1 Einheit = 2 m)
export const Y0 = -3;                          // Boden
const C = (h) => new THREE.Color(h);

// ---------- Logo-Schild rechts neben der Tür (Außenwand, Augenhöhe) – wie ego/tour.js ----------
export const SIGN = { px: 250, width: 0.6, out: 0.012 };
SIGN.z = (272 - 140) * K + SIGN.out;
function buildLogoSign(U) {
  const s = SIGN.width / 504, ox = (SIGN.px - 210) * K, oy = EYE;
  const pos = [], col = [];
  let seed = 7; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  const put = (x, y, c, k, dz = 0) => { pos.push(ox + (x - 300) * s, oy - (y - 120) * s, SIGN.z + dz); col.push(c.r * k, c.g * k, c.b * k); };
  const fill = (x0, x1, y0, y1, g, test, c, k, dz) => {
    for (let y = y0; y <= y1; y += g) for (let x = x0; x <= x1; x += g) {
      const jx = x + (rnd() - 0.5) * g * 0.7, jy = y + (rnd() - 0.5) * g * 0.7;
      if (test(jx, jy)) put(jx, jy, c, k, dz);
    }
  };
  const bone = C('#EDE8DC');
  const HW = 252, HH = 92, R = 20;
  const inPlate = (x, y) => { const dx = Math.abs(x - 300) - (HW - R), dy = Math.abs(y - 120) - (HH - R); return Math.hypot(Math.max(dx, 0), Math.max(dy, 0)) + Math.min(Math.max(dx, dy), 0) <= R; };
  fill(300 - HW, 300 + HW, 120 - HH, 120 + HH, 2.2, inPlate, C('#16333D'), 1, -0.003);
  const frame = (hw, hh, r, k) => {
    for (let x = -(hw - r); x <= hw - r; x += 1.8) { put(300 + x, 120 - hh, bone, k, 0.003); put(300 + x, 120 + hh, bone, k, 0.003); }
    for (let y = -(hh - r); y <= hh - r; y += 1.8) { put(300 - hw, 120 + y, bone, k, 0.003); put(300 + hw, 120 + y, bone, k, 0.003); }
    for (const sx of [-1, 1]) for (const sy of [-1, 1]) for (let a = 0; a <= Math.PI / 2; a += 1.8 / r) put(300 + sx * (hw - r + r * Math.cos(a)), 120 + sy * (hh - r + r * Math.sin(a)), bone, k, 0.003);
  };
  frame(HW - 6, HH - 6, R - 6, 0.9); frame(HW - 8.2, HH - 8.2, R - 8.2, 0.9);
  [[140, '#7FAF45'], [300, '#3C7189'], [460, '#3F86B5']].forEach(([cx, hex]) => {
    const c = C(hex);
    fill(cx - 66, cx + 66, 54, 186, 3.3, (x, y) => (x - cx) ** 2 + (y - 120) ** 2 <= 63 ** 2, c, 0.8, 0);
    for (let a = 0; a < Math.PI * 2; a += 2 / 66) { put(cx + Math.cos(a) * 66, 120 + Math.sin(a) * 66, c, 1.2, 0.002); put(cx + Math.cos(a) * 64.6, 120 + Math.sin(a) * 64.6, c, 1.2, 0.002); }
  });
  const G = 1.5, L = 0.004;
  fill(120, 160, 98, 142, G, (x, y) => { const u = x - 140, v = y - 120; return (Math.abs(u) >= 12 && Math.abs(u) <= 20 && Math.abs(v) <= 22) || (Math.abs(u) <= 12 && Math.abs(v) <= 4); }, bone, 1, L);
  fill(270, 330, 96, 144, G, (x, y) => { const u = x - 300, v = y - 120; return (u / 26) ** 2 + (v / 23) ** 2 <= 1 && (u / 18) ** 2 + (v / 15) ** 2 >= 1; }, bone, 1, L);
  fill(438, 478, 98, 142, G, (x, y) => {
    const u = x - 464, v = y - 120;
    return (u >= -18 && u <= -10 && Math.abs(v) <= 22) || (u >= -10 && u <= -4 && ((v >= -22 && v <= -14.5) || (v >= -1.5 && v <= 6)))
      || (u >= -4 && (u + 4) ** 2 + (v + 8) ** 2 <= 14 ** 2 && (u + 4) ** 2 + (v + 8) ** 2 >= 6.5 ** 2);
  }, bone, 1, L);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(pos), 3));
  g.setAttribute('aCol', new THREE.BufferAttribute(new Float32Array(col), 3));
  const pts = new THREE.Points(g, new THREE.ShaderMaterial({
    uniforms: U,
    vertexShader: /* glsl */`attribute vec3 aCol; uniform float uLogo, uBig, uLum, uCut; varying vec3 vC; varying float vV;
      void main(){ vC = aCol * uLum; vec4 mv = viewMatrix * vec4(position, 1.); gl_Position = projectionMatrix * mv;
        vV = step(position.y, uCut) * step(${(SIGN.z - 0.03).toFixed(4)}, cameraPosition.z); // von innen unsichtbar (wäre seitenverkehrt)
        gl_PointSize = clamp(uLogo * uBig / -mv.z, 1.4, 9.); }`,
    fragmentShader: /* glsl */`varying vec3 vC; varying float vV;
      void main(){ float d = length(gl_PointCoord - .5); if (d > .5 || vV < .5) discard; gl_FragColor = vec4(vC * (1. - smoothstep(.25, .5, d) * .4), 1.);
        #include <colorspace_fragment>
      }`,
  }));
  pts.frustumCulled = false; pts.renderOrder = 3;
  const grp = new THREE.Group(); grp.name = 'logoSign'; grp.add(pts);
  return grp;
}

const COMMON = /* glsl */`
  attribute float aKind, aRoom, aDoor;
  uniform float uPix, uStip, uDoor, uBig, uLum, uFar, uCut; uniform vec2 uHinge;
  uniform vec3 cBone, cAmber, cBlue, cGreen, cPetrol, cCore;
  vec3 doorP(vec3 p, float door){ if (door < .5) return p; float a = uDoor; float dx = p.x - uHinge.x, dz = p.z - uHinge.y; float c = cos(a), s = sin(a);
    return vec3(uHinge.x + c*dx + s*dz, p.y, uHinge.y - s*dx + c*dz); }`;

/** Gemeinsame Uniforms der Haus-Materialien (Haupt-Skript setzt uPix, uStip, uLogo, uDoor, uLum, uCut je Bild) */
export function houseUniforms() {
  return {
    uPix: { value: 1 }, uStip: { value: 1 }, uLogo: { value: 1 }, uBig: { value: 1 }, uDoor: { value: 0 }, uLum: { value: 1 }, uFar: { value: 1 }, uCut: { value: 100 },
    uHinge: { value: new THREE.Vector2((182 - 210) * K, (272 - 140) * K) },
    cBone: { value: C('#D9DCD3') }, cAmber: { value: C('#E59A2F') }, cBlue: { value: C('#5AA2D6') }, cGreen: { value: C('#8BC34A') }, cPetrol: { value: C('#4E7F93') }, cCore: { value: C('#0E1C22') },
  };
}

/**
 * Szene aus der fertigen Praxis-Punktwolke: Linien (+ Haustür), Möbel, dunkler Kern, Logo-Schild.
 * prx = Ergebnis von praxisScanGen (lines, furn, core, spacing). Rückgabe: Gruppe + Objekte.
 */
export function buildHouse(scene, prx, U) {
  // Tür: Rahmen + Zeilen aus Linienpunkten, Scharnier links, schwingt nach innen
  const dp = [], dk = [], dr = [], dd = [];
  const x0 = (182 - 210) * K, x1 = (216 - 210) * K, z = (272 - 140) * K, y0 = Y0, y1 = Y0 + 1.05;
  const add = (x, y, k) => { dp.push(x, y, z); dk.push(k); dr.push(0); dd.push(1); };
  for (let r = 1; r < 14; r++) for (let x = x0; x <= x1; x += 0.02) add(x, y0 + (r / 14) * (y1 - y0), 1);
  for (let x = x0; x <= x1; x += 0.01) { add(x, y1, 6); add(x, y0 + 0.01, 6); }
  for (let y = y0; y <= y1; y += 0.01) { add(x0, y, 6); add(x1, y, 6); }
  add(x1 - 0.06, y0 + 0.5, 4); add(x1 - 0.06, y0 + 0.52, 4); add(x1 - 0.06, y0 + 0.54, 4);
  const g = prx.lines, n0 = g.attributes.position.count;
  const cat = (a, b) => { const o = new Float32Array(a.length + b.length); o.set(a); o.set(b, a.length); return o; };
  const lg = new THREE.BufferGeometry();
  lg.setAttribute('position', new THREE.BufferAttribute(cat(g.attributes.position.array, new Float32Array(dp)), 3));
  lg.setAttribute('aKind', new THREE.BufferAttribute(cat(g.attributes.aKind.array, new Float32Array(dk)), 1));
  lg.setAttribute('aRoom', new THREE.BufferAttribute(cat(g.attributes.aRoom.array, new Float32Array(dr)), 1));
  const door = new Float32Array(n0 + dd.length); door.fill(0, 0, n0); door.set(dd, n0);
  lg.setAttribute('aDoor', new THREE.BufferAttribute(door, 1));
  const lines = new THREE.Points(lg, new THREE.ShaderMaterial({
    uniforms: U, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: COMMON + /* glsl */`
      varying vec3 vCol; varying float vA;
      void main(){
        vec3 p = doorP(position, aDoor);
        vec3 col = aKind < .5 ? cPetrol * .85 : aKind < 1.5 ? cBone * .5 : aKind > 3.5 && aKind < 4.5 ? cAmber * 1.1 : cBone * .9;
        vec4 mv = viewMatrix * vec4(p, 1.); gl_Position = projectionMatrix * mv;
        float d = -mv.z;
        gl_PointSize = clamp(uPix * (aKind > 5.5 ? 1.5 : 1.2) * 7. / d, 1.3, 4.5) * uBig;
        float near = smoothstep(.12, .5, d), far = 1. - smoothstep(7., 14., d) * .6 * uFar;
        float g = exp(-pow((position.y - uCut) * 14., 2.));
        vA = (aKind < .5 ? .5 : aKind < 1.5 ? .6 : .95) * near * far * uLum * step(position.y, uCut) * (1. + g * 1.5);
        vCol = mix(col, cAmber * 1.4, g);
      }`,
    fragmentShader: /* glsl */`
      varying vec3 vCol; varying float vA;
      void main(){ float d = length(gl_PointCoord - .5); gl_FragColor = vec4(vCol, smoothstep(.5, .12, d) * vA);
        #include <colorspace_fragment>
      }`,
  }));
  const furn = new THREE.Points(prx.furn, new THREE.ShaderMaterial({
    uniforms: U,
    vertexShader: COMMON + /* glsl */`
      varying vec3 vCol; varying float vVis;
      void main(){
        vec3 n = normal; vec3 V = normalize(cameraPosition - position);
        float lam = max(dot(n, normalize(vec3(.4, .8, .5))), 0.), rim = pow(1. - abs(dot(n, V)), 3.);
        vec3 base = aKind < 2.5 ? cBone : aKind < 3.5 ? cGreen : aKind < 4.5 ? cAmber : aKind < 5.5 ? mix(cPetrol * 1.7, cBlue, .3) : cBone;
        vec3 col = (base * (.3 + .7 * lam) + cBlue * rim * .12) * uLum;
        float g = exp(-pow((position.y - uCut) * 14., 2.));
        vCol = mix(col, cAmber * 1.4, g);
        vec4 mv = viewMatrix * vec4(position, 1.); gl_Position = projectionMatrix * mv;
        float d = -mv.z;
        gl_PointSize = clamp(uStip / d, 1.3, 7.) * uBig * (1. + g * .6);
        float h = fract(sin(dot(position.xz, vec2(12.9898, 78.233)) + position.y * 37.7) * 43758.5453);
        vVis = step(h, smoothstep(.1, .4, d)) * step(position.y, uCut);
      }`,
    fragmentShader: /* glsl */`
      varying vec3 vCol; varying float vVis;
      void main(){ float d = length(gl_PointCoord - .5); if (vVis < .5 || d > .5) discard;
        gl_FragColor = vec4(vCol * (1. - smoothstep(.2, .5, d) * .45), 1.);
        #include <colorspace_fragment>
      }`,
  }));
  const core = new THREE.Mesh(prx.core, new THREE.ShaderMaterial({
    uniforms: U,
    vertexShader: /* glsl */`varying float vL, vD, vY; void main(){ vec3 p = position - normal * .006; vL = max(dot(normal, normalize(vec3(.4, .8, .5))), 0.); vY = position.y;
      vec4 mv = viewMatrix * vec4(p, 1.); vD = -mv.z; gl_Position = projectionMatrix * mv; }`,
    fragmentShader: /* glsl */`uniform vec3 cCore, cBone; uniform float uCut; varying float vL, vD, vY; void main(){ if (vD < .2 || vY > uCut) discard; gl_FragColor = vec4(cCore + cBone * vL * .04, 1.);
      #include <colorspace_fragment>
    }`,
  }));
  const grp = new THREE.Group(); grp.name = 'house';
  [core, furn, lines].forEach((o, i) => { o.frustumCulled = false; o.renderOrder = i; grp.add(o); });
  const sign = buildLogoSign(U);
  grp.add(sign);
  scene.add(grp);
  return { group: grp, lines, furn, core, sign };
}

/**
 * Staub: feine Partikel, die durch die Praxis treiben (Puls: „die Seite lebt“). Additiv, leise; uDust blendet.
 */
export function buildDust(scene, n, shared) {
  const pos = new Float32Array(n * 3), rnd = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    // innen (Haus) und draußen vor der Tür
    const out = Math.random() < 0.18;
    const x = out ? (Math.random() - 0.5) * 4.5 : -3 + Math.random() * 6;
    const z = out ? 2.0 + Math.random() * 1.8 : -1.95 + Math.random() * 3.9;
    pos.set([x, Y0 + 0.05 + Math.random() * 1.4, z], i * 3);
    rnd.set([Math.random(), Math.random(), Math.random()], i * 3);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('aR', new THREE.BufferAttribute(rnd, 3));
  const U = { uTime: shared.uTime, uPix: shared.uPix, uDust: { value: 1 }, cPetrol: { value: C('#4E7F93') }, cBone: { value: C('#D9DCD3') } };
  const pts = new THREE.Points(g, new THREE.ShaderMaterial({
    uniforms: U, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: /* glsl */`
      attribute vec3 aR; uniform float uTime, uPix, uDust; uniform vec3 cPetrol, cBone; varying vec3 vC; varying float vA;
      void main(){
        vec3 p = position;
        p.x += sin(uTime * (.12 + aR.x * .2) + aR.y * 6.283) * .22;
        p.y += sin(uTime * (.09 + aR.y * .15) + aR.z * 6.283) * .12;
        p.z += cos(uTime * (.1 + aR.z * .18) + aR.x * 6.283) * .22;
        vec4 mv = viewMatrix * vec4(p, 1.); gl_Position = projectionMatrix * mv;
        float d = -mv.z;
        gl_PointSize = clamp(uPix * (1.2 + aR.y * 1.6) * 2.4 / d, 1., 5.);
        float tw = .55 + .45 * sin(uTime * (.5 + aR.z) + aR.x * 40.);
        vC = mix(cPetrol * 1.2, cBone, aR.x * .6);
        vA = uDust * (.1 + .3 * aR.z) * tw * smoothstep(.15, .6, d) * (1. - smoothstep(5., 9., d));
      }`,
    fragmentShader: /* glsl */`varying vec3 vC; varying float vA; void main(){ float d = length(gl_PointCoord - .5); gl_FragColor = vec4(vC, smoothstep(.5, .08, d) * vA);
      #include <colorspace_fragment>
    }`,
  }));
  pts.frustumCulled = false; pts.renderOrder = 4;
  scene.add(pts);
  return { pts, U };
}
