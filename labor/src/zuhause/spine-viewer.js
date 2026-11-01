// Wirbelsäulen-Modell im Panel: gestochen wie Kapitel 03 (gleiche Geometrie), drehbar, Abschnitt leuchtet.
// Wird erst beim ersten Öffnen erzeugt und dann wiederverwendet.
import * as THREE from 'three';
import { spineStipple, ZONES } from '../test-4/shapes.js';
import { stage, reduced, isDesktop, damp, dragYaw, C } from '../manu/common.js';

export const SEG_ZONES = ['c12', 'c56', 'th16', 'l45', 's1'].map((z) => ZONES.indexOf(z));
let cache = null;
function data() {
  if (cache) return cache;
  const det = spineStipple(0, false);
  const g = det.makeGrain(isDesktop() ? 32000 : 16000);
  // Mittelpunkt je Zone (für die Kamerafahrt zum Abschnitt)
  const sum = new Map();
  for (let i = 0; i < g.count; i++) { const z = g.zone[i], e = sum.get(z) || [0, 0]; e[0] += g.pos[i * 3 + 1]; e[1]++; sum.set(z, e); }
  const zoneY = {}; sum.forEach((e, z) => { zoneY[z] = e[0] / e[1]; });
  return (cache = { det, g, zoneY });
}

export function initSpineViewer(canvas, ui = {}) {
  const st = stage(canvas, { fov: 26, transparent: true });
  if (!st) return null;
  const { det, g, zoneY } = data();
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(g.pos, 3));
  geo.setAttribute('normal', new THREE.BufferAttribute(g.nor, 3));
  geo.setAttribute('aZone', new THREE.BufferAttribute(g.zone, 1));
  geo.setAttribute('aKind', new THREE.BufferAttribute(g.kind, 1));
  geo.setDrawRange(0, g.count);
  const U = {
    uStip: { value: 1 }, uZone: { value: SEG_ZONES[0] }, uZoneAmt: { value: 1 },
    cBone: { value: C('#F3EADA') }, cDisc: { value: C('#86AFC9') }, cAmber: { value: C('#E59A2F') }, cBlue: { value: C('#5AA2D6') }, cCore: { value: C('#0E1C22') },
  };
  const group = new THREE.Group(); st.scene.add(group);
  const pts = new THREE.Points(geo, new THREE.ShaderMaterial({
    uniforms: U,
    vertexShader: /* glsl */`
      attribute float aZone, aKind; uniform float uStip, uZone, uZoneAmt; uniform vec3 cBone, cDisc, cAmber, cBlue;
      varying vec3 vCol;
      void main(){
        vec3 p = (modelMatrix * vec4(position, 1.)).xyz, n = normalize(mat3(modelMatrix) * normal);
        vec3 V = normalize(cameraPosition - p);
        float lam = max(dot(n, normalize(vec3(.48, .72, .5))), 0.), rim = pow(1. - max(dot(n, V), 0.), 3.);
        float on = (1. - step(.5, abs(aZone - uZone))) * uZoneAmt;
        vec3 base = aKind < .5 ? cBone : cDisc;
        vec3 col = base * (.22 + .78 * lam) + cBlue * rim * .16;
        col = mix(col, cAmber * (.35 + .95 * lam), on * (aKind < .5 ? 1. : .4));
        vec4 mv = viewMatrix * vec4(p, 1.); gl_Position = projectionMatrix * mv;
        gl_PointSize = clamp(uStip / -mv.z, 1., 6.);
        vCol = col;
      }`,
    fragmentShader: 'varying vec3 vCol; void main(){ float d = length(gl_PointCoord - .5); if (d > .5) discard; gl_FragColor = vec4(vCol * (1. - smoothstep(.18, .5, d) * .5), 1.);\n#include <colorspace_fragment>\n}',
  }));
  const core = new THREE.Mesh(det.coreGeo, new THREE.ShaderMaterial({
    uniforms: U,
    vertexShader: 'varying float vL; void main(){ vL = max(dot(normalize(mat3(modelMatrix) * normal), normalize(vec3(.48,.72,.5))), 0.); gl_Position = projectionMatrix * modelViewMatrix * vec4(position - normal * .012, 1.); }',
    fragmentShader: 'uniform vec3 cCore, cBone; varying float vL; void main(){ gl_FragColor = vec4(cCore + cBone * vL * .05, 1.);\n#include <colorspace_fragment>\n}',
  }));
  [pts, core].forEach((o) => { o.frustumCulled = false; group.add(o); });

  const cam = { yaw: 0, yawTarget: 0, lastUser: -1e9, dragging: false };
  dragYaw(canvas, cam);
  let seg = 0, focusY = zoneY[SEG_ZONES[0]] || 0, zoom = 0, t = 0;
  function select(i) { seg = i; U.uZone.value = SEG_ZONES[i]; }
  select(0);
  function update(_t, dt) {
    const dtCam = dt || 0.016;
    if (ui.isPaused && ui.isPaused()) dt = 0;
    t += dt;
    if (!reduced && !cam.dragging && performance.now() - cam.lastUser > 3000) cam.yawTarget += dt * 0.25;
    cam.yaw = damp(cam.yaw, cam.yawTarget, 5, dtCam);
    group.rotation.y = -0.9 + cam.yaw;
    // Kamera: ganze Wirbelsäule, leicht zum gewählten Abschnitt geneigt und herangezoomt
    focusY = damp(focusY, (zoneY[SEG_ZONES[seg]] || 0) * 0.55, 3, dt || 0.016);
    const tanH = Math.tan(THREE.MathUtils.degToRad(13));
    const full = Math.max(8.6 / 2 / tanH, (3.2 / st.aspect) / 2 / tanH);
    zoom = damp(zoom, 1, 2, dt || 0.016);
    const d = full * (1 - 0.18 * zoom);
    st.camera.position.set(0, focusY, d); st.camera.lookAt(0, focusY, 0);
    U.uStip.value = st.renderer.getPixelRatio() * st.h * 0.5 / tanH * g.spacing * 0.78;
    U.uZoneAmt.value = 0.75 + 0.25 * Math.sin(t * 2.4);
  }
  function dispose() { try { st.renderer.dispose(); st.renderer.forceContextLoss(); } catch (e) { /* schon weg */ } }
  return { st, update, select, dispose };
}
