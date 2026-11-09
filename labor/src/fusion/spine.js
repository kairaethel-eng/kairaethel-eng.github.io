// Wirbelsäule im Behandlungsraum: die gescannte Punktwolke aus Puls (test-4: „Schichten“, differenziert, mit dunklem
// Kern, Nervenwurzeln und laufenden Signalen), hier als Hologramm über der Behandlungsliege in Weltkoordinaten.
// Die Shader stammen aus test-4/main.js (coreMat, boneMat, addNerves) – ohne Versorgungsbahn/Silhouette, dafür
// mit frei setzbarer Lage (uXf = Mitte + Größe, uRot = Drehung). Puls bleibt unverändert.
import * as THREE from 'three';
import { spineStippleGen, ZONES, CURVE_W } from '../test-4/shapes.js';
import { runSliced } from '../shared/slice.js';

const C = (h) => new THREE.Color(h);

// Abschnitte wie in Puls (sechs Stationen, mit Th7–Th12)
export const STOPS = [
  { zone: 'c12', ids: ['C1', 'C2'], az: 0.5 },
  { zone: 'c56', ids: ['C5', 'C6'], az: -0.38 },
  { zone: 'th16', ids: ['Th2', 'Th3', 'Th4', 'Th5'], az: 0.55 },
  { zone: 'th712', ids: ['Th8', 'Th9', 'Th10', 'Th11'], az: -0.5 },
  { zone: 'l45', ids: ['L4', 'L5'], az: -0.45 },
  { zone: 's1', ids: ['L5', 'S'], az: 0.75 },
];

export function createSpine(scene, shared, { desktop }) {
  const U = {
    uTime: shared.uTime, uPix: shared.uPix, uRot: { value: -0.9 }, uCut: { value: 100 }, uXf: { value: new THREE.Vector4(0, 0, 0, 0.08) },
    uZone: { value: -10 }, uZoneAmt: { value: 0 }, uOn: { value: 0 }, uStip: { value: 1 }, uMaxSize: { value: 2.6 }, uDiff: { value: 1 }, uLum: { value: 1 },
    uScan: { value: 100 }, uScanAmt: { value: 0 }, uDiscMode: { value: 0 }, cDiscA: { value: C('#E0583C') },
    cBone: { value: C('#F3EADA') }, cDisc: { value: C('#86AFC9') }, cDiscD: { value: C('#4FA8D6') }, cAmber: { value: C('#E59A2F') }, cBlue: { value: C('#5AA2D6') },
    cSignal: { value: C('#DDF1FF') }, cCore: { value: C('#0E1C22') },
  };
  const COMMON = /* glsl */`
    uniform float uTime, uRot, uCut, uZone, uZoneAmt, uOn, uStip, uPix, uScan, uScanAmt, uDiff, uDiscMode, uLum; uniform vec4 uXf;
    uniform vec3 cBone, cDisc, cDiscD, cDiscA, cAmber, cBlue, cSignal, cCore;
    vec3 rotY(vec3 p, float a){ float c=cos(a), s=sin(a); return vec3(c*p.x+s*p.z, p.y, -s*p.x+c*p.z); }
    const vec3 LDIR = vec3(.48, .72, .5);`;

  // 1) Kern: dunkle Füllung, verdeckt die Rückseite der Punkte
  const coreMat = new THREE.ShaderMaterial({
    uniforms: U,
    vertexShader: COMMON + /* glsl */`
      varying float vY; varying float vL;
      void main(){
        vec3 p = rotY(position - normal * .012, uRot) * uXf.w + uXf.xyz;
        vY = p.y; vL = max(dot(normalize(rotY(normal, uRot)), normalize(LDIR)), 0.);
        gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.);
      }`,
    fragmentShader: COMMON + /* glsl */`
      varying float vY; varying float vL;
      void main(){
        if (vY < uCut || uOn < .5) discard;
        gl_FragColor = vec4(cCore + cBone * vL * .05, 1.);
        #include <colorspace_fragment>
      }`,
  });
  // 2) Knochen „Schichten“ (CT-Schnittlinien), differenziert: Deckplatten hell, Bandscheiben eigene Farbe, Fortsätze feiner
  const boneMat = new THREE.ShaderMaterial({
    uniforms: U,
    vertexShader: COMMON + /* glsl */`
      attribute float aZone, aKind, aEdge; uniform float uMaxSize;
      varying vec3 vCol; varying float vVis;
      void main(){
        vec3 p = rotY(position, uRot) * uXf.w + uXf.xyz;
        vec3 n = normalize(rotY(normal, uRot));
        vec3 V = normalize(cameraPosition - p);
        float lam = max(dot(n, normalize(LDIR)), 0.);
        float rim = pow(1. - max(dot(n, V), 0.), 3.);
        float on = (1. - step(.5, abs(aZone - uZone))) * uZoneAmt;
        vec3 col; float sz = 1.;
        float sil = pow(1. - max(dot(n, V), 0.), 1.6);
        if (aKind > .5) {
          float fuge = smoothstep(.62, .92, aEdge);
          float red = uDiscMode > 1.5 ? 0. : uDiscMode > .5 ? 1. : on;
          col = mix(cDiscD, cDiscA, red) * (.5 + .5 * lam) * (1. - fuge * .78) + cBlue * sil * .22 * (1. - red * .7);
          sz = .9;
          col *= 1. + on * (uDiscMode < .5 ? .25 : .5);
        } else {
          float plate = aEdge < 0. ? 0. : smoothstep(.74, .9, aEdge);
          col = cBone * (.2 + .8 * lam) * mix(.58, 1.2, sil) + cBlue * rim * .12;
          col = mix(col, cBone * 1.3 + vec3(.08, .05, 0.), plate * .85);
          sz = aEdge < 0. ? .78 : 1. + plate * .2;
          if (aEdge < 0.) col *= .78;
          col = mix(col, cAmber * (.35 + .95 * lam), on);
        }
        float g = exp(-pow((p.y - uCut) * 7.5 / uXf.w, 2.));
        col = mix(col, cAmber * 1.3, g);
        vCol = col * uLum; vVis = step(uCut, p.y) * uOn;
        vec4 mv = viewMatrix * vec4(p, 1.);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = clamp(uStip / -mv.z * sz, 1., uMaxSize) * (1. + g * .8);
      }`,
    fragmentShader: /* glsl */`
      varying vec3 vCol; varying float vVis;
      void main(){
        float d = length(gl_PointCoord - .5);
        if (vVis < .5 || d > .5) discard;
        gl_FragColor = vec4(vCol * (1. - smoothstep(.18, .5, d) * .5), 1.);
        #include <colorspace_fragment>
      }`,
  });

  const group = new THREE.Group(); group.visible = false; scene.add(group);
  let det = null, SC = 1, CY = 0, spacing = 0.024, ready = 0;

  // 3) Nerven: Rückenmark und Wurzeln als Kurven-Textur, Partikel fließen, zwei Signale je Takt laufen vom Kopf nach unten
  function addNerves() {
    const ROWS = det.curves.length;
    const cData = new Float32Array(CURVE_W * ROWS * 4);
    det.curves.forEach((c, r) => c.pts.forEach((q, i) => cData.set([q[0], q[1], q[2], 1], (r * CURVE_W + i) * 4)));
    const curveTex = new THREE.DataTexture(cData, CURVE_W, ROWS, THREE.RGBAFormat, THREE.FloatType);
    curveTex.minFilter = curveTex.magFilter = THREE.NearestFilter; curveTex.needsUpdate = true;
    U.uCurves = { value: curveTex }; U.uRows = { value: ROWS };
    const nCord = desktop ? 2600 : 1300, nRoot = desktop ? 60 : 40;
    const nAll = nCord + (ROWS - 1) * nRoot;
    const aRow = new Float32Array(nAll), aPhase = new Float32Array(nAll), aSpeed = new Float32Array(nAll), aKindN = new Float32Array(nAll), aZoneN = new Float32Array(nAll), aStart = new Float32Array(nAll), aOff = new Float32Array(nAll * 3);
    let q = 0;
    const push = (row, kind, zone, start, speed, off) => {
      aRow[q] = row; aKindN[q] = kind; aZoneN[q] = zone; aStart[q] = start; aPhase[q] = Math.random(); aSpeed[q] = speed * (0.75 + Math.random() * 0.5);
      const u = Math.random() * Math.PI * 2, rr = Math.sqrt(Math.random()) * off;
      aOff.set([Math.cos(u) * rr, (Math.random() - 0.5) * off * 0.6, Math.sin(u) * rr], q * 3); q++;
    };
    for (let i = 0; i < nCord; i++) push(0, 1, -1, 0, 0.055, 0.045);
    for (let r = 1; r < ROWS; r++) for (let i = 0; i < nRoot; i++) push(r, 2, det.curves[r].zone, det.curves[r].start, 0.22, 0.018);
    const nGeo = new THREE.BufferGeometry();
    nGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(nAll * 3), 3));
    [['aRow', aRow], ['aPhase', aPhase], ['aSpeed', aSpeed], ['aKind', aKindN], ['aZone', aZoneN], ['aStart', aStart]].forEach(([k, v]) => nGeo.setAttribute(k, new THREE.BufferAttribute(v, 1)));
    nGeo.setAttribute('aOff', new THREE.BufferAttribute(aOff, 3));
    const nerveMat = new THREE.ShaderMaterial({
      uniforms: { ...U, uGhost: { value: 1 } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      vertexShader: COMMON + /* glsl */`
        uniform sampler2D uCurves; uniform float uRows;
        attribute float aRow, aPhase, aSpeed, aKind, aZone, aStart; attribute vec3 aOff;
        varying vec3 vCol; varying float vA;
        vec3 curveAt(sampler2D tex, float row, float rows, float t){
          float x = t * ${CURVE_W - 1}.; float i0 = floor(x);
          vec3 a = texture2D(tex, vec2((i0 + .5) / ${CURVE_W}., (row + .5) / rows)).xyz;
          vec3 b = texture2D(tex, vec2((min(i0 + 1., ${CURVE_W - 1}.) + .5) / ${CURVE_W}., (row + .5) / rows)).xyz;
          return mix(a, b, x - i0);
        }
        float packet(float d, float sharp){ return exp(-d * d * sharp) + step(0., d) * exp(-d * 7.) * .35; }
        void main(){
          float t = fract(aPhase + uTime * aSpeed);
          float S1 = fract(uTime * .3), S2 = fract(uTime * .3 + .5);
          vec3 p = rotY(curveAt(uCurves, aRow, uRows, t) + aOff, uRot) * uXf.w + uXf.xyz;
          float base, pk;
          if (aKind < 1.5) { pk = max(packet(S1 - t, 700.), packet(S2 - t, 700.)); base = .46; }
          else {
            float on = (1. - step(.5, abs(aZone - uZone))) * uZoneAmt;
            float r1 = (S1 - aStart) * 4., r2 = (S2 - aStart) * 4.;
            pk = max(packet(r1 - t, 60.) * step(0., r1) * step(r1, 1.4), packet(r2 - t, 60.) * step(0., r2) * step(r2, 1.4));
            pk *= mix(.28, 1.5, on);
            base = .16 + on * .5;
          }
          vec3 col = cBlue * base + cSignal * pk * 1.15;
          float vis = step(uCut, p.y) * uOn;
          vec4 mv = viewMatrix * vec4(p, 1.);
          gl_Position = projectionMatrix * mv;
          gl_PointSize = clamp(uPix * (1.05 + pk * 1.4) * 2.2 / -mv.z, 1., 7.);
          vCol = col * uLum; vA = vis * clamp(base + pk, 0., 1.4);
        }`,
      fragmentShader: /* glsl */`
        uniform float uGhost;
        varying vec3 vCol; varying float vA;
        void main(){
          float d = length(gl_PointCoord - .5);
          gl_FragColor = vec4(vCol, smoothstep(.5, .05, d) * vA * uGhost);
          #include <colorspace_fragment>
        }`,
    });
    const nerves = new THREE.Points(nGeo, nerveMat); nerves.frustumCulled = false;
    const ghostMat = nerveMat.clone(); ghostMat.uniforms = { ...U, uGhost: { value: 0.42 } }; ghostMat.depthTest = false;
    const ghost = new THREE.Points(nGeo, ghostMat); ghost.frustumCulled = false;
    group.add(ghost, nerves);
  }

  const api = {
    U, group, STOPS,
    get ready() { return ready; },
    get det() { return det; },
    /** Punktwolke in Zeitscheiben rechnen (A1); danach stehen Kern, Schichten und Nerven */
    build(nSlice, step) {
      return runSliced(spineStippleGen(0, false)).then((d) => {
        det = d; SC = d.SC; CY = d.CY;
        return runSliced(d.makeSlicesGen(nSlice, step, 0.12, true));
      }).then((sl) => {
        const core = new THREE.Mesh(det.coreGeo, coreMat); core.frustumCulled = false;
        const g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.BufferAttribute(sl.pos, 3));
        g.setAttribute('normal', new THREE.BufferAttribute(sl.nor, 3));
        g.setAttribute('aZone', new THREE.BufferAttribute(sl.zone, 1));
        g.setAttribute('aKind', new THREE.BufferAttribute(sl.kind, 1));
        g.setAttribute('aEdge', new THREE.BufferAttribute(sl.edge, 1));
        g.setDrawRange(0, sl.count);
        spacing = sl.spacing;
        const pts = new THREE.Points(g, boneMat); pts.frustumCulled = false;
        group.add(core, pts);
        addNerves();
        ready = 1;
        return api;
      });
    },
    /** Mitte eines Abschnitts (Weltkoordinaten, mit aktueller Lage/Drehung) */
    segCenter(i, out = new THREE.Vector3()) {
      if (!det) return out.copy(U.uXf.value);
      const X = U.uXf.value, c = out.set(0, 0, 0), t = new THREE.Vector3();
      STOPS[i].ids.forEach((id) => { const lv = det.levels.find((l) => l.id === id); c.add(t.set(lv.center.x * SC, (lv.center.y - CY) * SC, lv.center.z * SC)); });
      return c.divideScalar(STOPS[i].ids.length).applyAxisAngle(new THREE.Vector3(0, 1, 0), U.uRot.value).multiplyScalar(X.w).add(new THREE.Vector3(X.x, X.y, X.z));
    },
    /** Zone (Index in ZONES) eines Abschnitts */
    zoneOf(i) { return ZONES.indexOf(STOPS[i].zone); },
    /** Punktgröße: Schichten als feine Linien, je nach Bildhöhe und Abstand (f = Pixel je Welteinheit bei Abstand 1) */
    setStip(f) { U.uStip.value = f * U.uXf.value.w * spacing * 0.92; },
    /** Lage: Mitte (Welt), Höhe in Einheiten */
    place(center, height) { U.uXf.value.set(center.x, center.y, center.z, height / 8.7); },
    /** Scan-Schnitt: solid 0 = nichts, 1 = ganz (Welt-y, von oben nach unten) */
    setSolid(solid) {
      const X = U.uXf.value, topY = X.y + 4.35 * X.w, botY = X.y - 4.35 * X.w;
      U.uCut.value = solid <= 0 ? 100 : THREE.MathUtils.lerp(topY + 0.03, botY - 0.03, solid);
      const on = solid > 0 && ready > 0;
      group.visible = on; U.uOn.value = on ? 1 : 0;
    },
  };
  return api;
}
