// Figur „Spannung lösen“ (aus dem Puls-Hero, test-4/main.js Form 0), hier als Gast im Empfang der Praxis:
// Körper-Punktwolke in Weltkoordinaten, Spannungszonen glühen bernstein, die Maus/der Finger „streicht“ die
// Spannung weg (Entspannungs-Textur). Die Figur setzt sich aus Partikeln zusammen (uIn 0 → 1) und löst sich
// beim Weitergehen wieder auf. Puls selbst bleibt unverändert.
import * as THREE from 'three';
import { bodyPoints, BODY_W, BODY_H, BODY_SCALE, HOTSPOTS } from '../test-4/shapes.js';

const C = (h) => new THREE.Color(h);
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const RW = 100, RH = 215;

export function createFigure(scene, n, shared) {
  const body = bodyPoints(n);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(body.pos, 3));
  geo.setAttribute('aHeat', new THREE.BufferAttribute(body.heat, 1));
  const rnd = new Float32Array(n * 4);
  for (let i = 0; i < rnd.length; i++) rnd[i] = Math.random();
  geo.setAttribute('aRand', new THREE.BufferAttribute(rnd, 4));

  // Entspannungs-Karte: hier „streicht“ die Hand die Spannung weg
  const cv = document.createElement('canvas'); cv.width = RW; cv.height = RH;
  const ctx = cv.getContext('2d', { willReadFrequently: true });
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, RW, RH);
  const tex = new THREE.CanvasTexture(cv);
  tex.minFilter = tex.magFilter = THREE.LinearFilter;

  const U = {
    uTime: shared.uTime, uPix: shared.uPix, uRelax: { value: tex }, uBodyWH: { value: new THREE.Vector2(BODY_W * BODY_SCALE, BODY_H * BODY_SCALE) },
    uPos: { value: new THREE.Vector3() }, uS: { value: 0.1 }, uYaw: { value: 0 }, uIn: { value: 0 }, uBreath: { value: 0 }, uCalm: { value: 0 }, uPx: { value: 2.0 }, uLum: { value: 1 },
    cPetrol: { value: C('#4E7F93') }, cBone: { value: C('#D9DCD3') }, cAmber: { value: C('#E59A2F') }, cBlue: { value: C('#5AA2D6') }, cGreen: { value: C('#8BC34A') },
  };
  const mat = new THREE.ShaderMaterial({
    uniforms: U, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: /* glsl */`
      attribute float aHeat; attribute vec4 aRand;
      uniform float uTime, uPix, uS, uYaw, uIn, uBreath, uCalm, uPx, uLum; uniform vec3 uPos; uniform vec2 uBodyWH;
      uniform sampler2D uRelax; uniform vec3 cPetrol, cBone, cAmber, cBlue, cGreen;
      varying vec3 vCol; varying float vA;
      vec3 rotY(vec3 p, float a){ float c=cos(a), s=sin(a); return vec3(c*p.x+s*p.z, p.y, -s*p.x+c*p.z); }
      vec3 jitter(float amp, float sp){ return vec3(sin(uTime*sp*1.3+aRand.x*40.), sin(uTime*sp*1.7+aRand.y*40.), sin(uTime*sp*1.1+aRand.z*40.))*amp; }
      void main(){
        vec2 uv = position.xy / uBodyWH + .5;
        float relax = texture2D(uRelax, vec2(uv.x, 1.-uv.y)).r;
        float tension = aHeat * (1. - relax);
        float breath = sin(uBreath) * (1. + uCalm*1.3);
        // Spannung: fester Takt (kein Phasensprung beim Lösen), Ausschlag klein (Puls, 8.11.)
        vec3 b = position * vec3(1. + breath*.007, 1. + breath*.004, 1.) + jitter(.012*(1. - uCalm*.6) + tension*.06, 5.);
        vec3 p = rotY(b, uYaw) * uS + uPos;
        // Aufbau aus Partikeln: jeder Punkt kommt aus seiner eigenen Richtung, zuerst die Mitte, zuletzt die Ränder
        float st = aRand.w * .4;
        float k = smoothstep(st, st + .6, uIn);
        vec3 nrm = normalize(aRand.xyz - .5 + 1e-4);
        p += nrm * (1. - k) * (.5 + aRand.x * 1.1) + nrm * sin(k * 3.14159) * .12;
        p += vec3(sin(uTime*.5 + aRand.y*6.283), cos(uTime*.42 + aRand.z*6.283), 0.) * .0012;
        vec3 base = mix(cPetrol, cBone, .25 + aRand.y*.35);
        float throb = .7 + .3*sin(uTime*3.4 + aRand.x*.8);
        vec3 col = mix(base, cAmber, smoothstep(.08, .7, tension) * throb);
        col = mix(col, mix(cBlue, cGreen, aRand.x), relax * aHeat * .85);
        float sz = 1. + tension*.9*throb;
        vec4 mv = viewMatrix * vec4(p, 1.); gl_Position = projectionMatrix * mv;
        gl_PointSize = clamp(uPix * uPx * sz * mix(.55, 1.35, aRand.y) / -mv.z, 1., 9.);
        vCol = col * uLum;
        vA = (.5 + aRand.x*.5) * sqrt(k) * (1. - .5 * sin(k * 3.14159));
      }`,
    fragmentShader: /* glsl */`
      varying vec3 vCol; varying float vA;
      void main(){ float d = length(gl_PointCoord - .5); gl_FragColor = vec4(vCol, smoothstep(.5, .05, d) * vA);
        #include <colorspace_fragment>
      }`,
  });
  const pts = new THREE.Points(geo, mat);
  pts.frustumCulled = false; pts.renderOrder = 5; pts.visible = false;
  scene.add(pts);

  let last = null, touched = false;
  const api = {
    pts, U, body,
    get touched() { return touched; },
    /** Lage: Fußpunkt (Weltkoordinaten), Körpergröße in Einheiten (1 Einheit = 2 m), Blickrichtung (Drehung um y) */
    place(foot, height, yaw) { U.uS.value = height / (BODY_H * BODY_SCALE); U.uPos.value.set(foot.x, foot.y + height / 2, foot.z); U.uYaw.value = yaw; },
    /** Ebene der Figur (durch die Mitte, zur Kamera gerichtet) für den Strahl der Maus */
    plane() { const nrm = new THREE.Vector3(Math.sin(U.uYaw.value), 0, Math.cos(U.uYaw.value)); return new THREE.Plane().setFromNormalAndCoplanarPoint(nrm, U.uPos.value); },
    /** Weltpunkt auf der Figurenebene → Entspannung malen; false, wenn neben der Figur */
    paint(hit) {
      const l = hit.clone().sub(U.uPos.value);
      const a = -U.uYaw.value, bx = (Math.cos(a) * l.x + Math.sin(a) * l.z) / U.uS.value, by = l.y / U.uS.value;
      const u = bx / (BODY_W * BODY_SCALE) + 0.5, v = 1 - (by / (BODY_H * BODY_SCALE) + 0.5);
      if (u < -0.1 || u > 1.1 || v < -0.05 || v > 1.05) { last = null; return false; }
      const px = u * RW, py = v * RH;
      const steps = last ? Math.ceil(Math.hypot(px - last[0], py - last[1]) / 2) : 1;
      for (let s = 1; s <= steps; s++) {
        const x = last ? last[0] + (px - last[0]) * s / steps : px, y = last ? last[1] + (py - last[1]) * s / steps : py;
        const g = ctx.createRadialGradient(x, y, 0, x, y, 11);
        g.addColorStop(0, 'rgba(255,255,255,.22)'); g.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = g; ctx.fillRect(x - 11, y - 11, 22, 22);
      }
      last = [px, py]; tex.needsUpdate = true; touched = true;
      return true;
    },
    release() { last = null; },
    /** Restspannung 0–100 (Mittel über die Spannungszonen) */
    tension() {
      const d = ctx.getImageData(0, 0, RW, RH).data;
      let sum = 0, w = 0;
      HOTSPOTS.forEach((h) => {
        const x = Math.round(h.x / BODY_W * RW), y = Math.round(h.y / BODY_H * RH);
        for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) {
          const xx = clamp(x + dx, 0, RW - 1), yy = clamp(y + dy, 0, RH - 1);
          sum += h.k * Math.max(0, 1 - d[(yy * RW + xx) * 4] / 245); w += h.k;
        }
      });
      return Math.round(sum / w * 100);
    },
    /** Weltpunkt eines Körperpunkts (Grundriss-Koordinaten der Figur 200×430) – für Hinweise im Bild */
    at(bx, by) {
      const l = new THREE.Vector3((bx - BODY_W / 2) * BODY_SCALE, (BODY_H / 2 - by) * BODY_SCALE, 0);
      return l.applyAxisAngle(new THREE.Vector3(0, 1, 0), U.uYaw.value).multiplyScalar(U.uS.value).add(U.uPos.value);
    },
  };
  return api;
}
