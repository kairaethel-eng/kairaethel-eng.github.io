// Baustein „Bandscheibenvorfall-Film“ (14.11.2026, Auftrag Kai): ein kurzer Film im Partikel-Stil der Seite.
// Bewegungssegment L4/L5 (echte Wirbel), der obere Wirbel löst sich auf, Blick von oben auf die Bandscheibe:
// Kern wandert → Faserring reißt (Vorwölbung) → Kern tritt aus und drückt auf die Nervenwurzel L5 (Vorfall) → Rückbildung.
// Alles ist eine reine Funktion der Filmzeit t (stateAt, camAt) – deshalb lässt sich der Film anhalten, spulen und als
// Standbild zeigen. Aufruf: initVorfall({ root, isPaused }) → { play, pause, seek, state } (Debug: window.__vorfall).
// Erwartet in root: .vf-stage (leer) und ol.vf-steps > li > b + span (Titel + Satz je Abschnitt; einzige Textquelle).
// Fokus (Puls, Film auf der Hauptbühne): auto: false = kein Selbststart (die Seite startet ihn), onEnd = Rückruf am Filmende,
// view(t) = Lage des Segments auf dem Bildschirm (Mitte, Maßstab, Blickwinkel, Scan-Linie) – daran richtet Puls seine Wirbelsäule aus.
import * as THREE from 'three';
import { stage, toScreen, C, FRAG } from '../manu/common.js';
import { stippleGen, coreOfGen, stipSize } from '../manu/stipple.js';
import { runSliced } from '../shared/slice.js';
import { buildSegment } from './segment.js';
import { META } from './daten.js';

const FOV = 30;
export const CH_T = [0, 6.5, 13, 19.5, 28.5], T_END = 37;
export const KEY_T = [4.6, 11.6, 18.7, 25.2, 32.4]; // aussagekräftiges Standbild je Abschnitt
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const sm = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const PULSES = [13.5, 15.2, 16.9, 19.9];
// Segment im Film (cm): Abstand der Wirbelmitten L5→L4, Neigung dieser Achse in der Seitenansicht (rad), Dicke der Bandscheibe –
// daran richtet Puls das Segment seiner Wirbelsäule aus (Fokus: Übergabe an den Film)
const _dy = META.L4.c[1] - META.L5.c[1], _dz = META.L4.c[2] - META.L5.c[2];
export const SEG = { len: Math.hypot(META.L4.c[0] - META.L5.c[0], _dy, _dz), tilt: Math.atan2(_dz, _dy), disc: META.disc.t };

// ---------- Zustand des Films zur Zeit t ----------
export function stateAt(t) {
  let pulse = 0, pulseR = 0;
  for (const tp of PULSES) { const x = (t - tp) / 0.95; if (x > 0 && x < 1) { pulse = Math.sin(Math.PI * x) ** 2 * (tp > 19 ? 1.25 : 1); pulseR = x; } }
  const back = 1 - sm(33.2, 35.6, t);
  return {
    scan: t < 2.2 ? -6.6 + clamp((t - 0.15) / 1.9) * 12.6 : 99,
    lift: sm(6.9, 9.4, t) * back,
    open: sm(7.3, 9.6, t) * (1 - sm(33.0, 35.2, t)),
    prot: (sm(13.6, 14.9, t) + sm(15.3, 16.6, t) + sm(17.0, 18.4, t)) / 3,
    prol: sm(20.3, 23.6, t),
    push: sm(21.2, 23.8, t) * (1 - sm(29.6, 32.4, t) * 0.85),
    alarm: sm(21.8, 23.4, t) * (1 - sm(29.4, 31.6, t)),
    heal: sm(29.2, 33.0, t),
    lapse: sm(29.3, 29.9, t) * (1 - sm(32.9, 33.4, t)),
    ray: sm(23.9, 24.5, t) * (1 - sm(27.9, 28.4, t)), rayP: ((Math.max(0, t - 24.3) / 1.9) % 1),
    pulse, pulseR,
  };
}

// ---------- Kamerafahrt: Stützpunkte (Zeit, Azimut°, Höhe°, Abstand cm, Ziel) – kubisch verbunden ----------
// Azimut 0 = von vorn, 90 = von der linken Seite des Patienten, 180 = von hinten
const CAM = [
  [0, 96, 9, 32, 0, -0.7, -0.9], [6.5, 122, 13, 31, 0, -0.7, -0.9], [10.3, 160, 62, 24.5, 0.2, -0.3, -1.3], [13, 163, 62, 23.5, 0.2, -0.3, -1.3],
  [19.5, 152, 62, 21, 0.5, -0.3, -1.6], [23.2, 140, 61, 17.5, 0.9, -0.4, -1.9], [26, 134, 50, 20.5, 1.2, -1.3, -1.8], [28.5, 138, 54, 20.5, 1.0, -0.8, -1.9],
  [33, 157, 60, 23, 0.3, -0.3, -1.4], [37, 118, 14, 31, 0, -0.7, -0.9],
];
function camAt(t, out) {
  let i = 0; while (i < CAM.length - 2 && t > CAM[i + 1][0]) i++;
  const a = CAM[i], b = CAM[i + 1], h = b[0] - a[0], u = clamp((t - a[0]) / h), u2 = u * u, u3 = u2 * u;
  const p = CAM[i - 1], n = CAM[i + 2];
  for (let k = 1; k < 7; k++) {
    const m0 = p ? (b[k] - p[k]) / (b[0] - p[0]) : 0, m1 = n ? (n[k] - a[k]) / (n[0] - a[0]) : 0;
    out[k - 1] = (2 * u3 - 3 * u2 + 1) * a[k] + (u3 - 2 * u2 + u) * h * m0 + (-2 * u3 + 3 * u2) * b[k] + (u3 - u2) * h * m1;
  }
  return out;
}

// ---------- Shader ----------
const HASH = /* glsl */`float hash2(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }`;
const LIGHT = /* glsl */`const vec3 LDIR = vec3(.42, .78, -.46);`;
// Vorfall drückt Nervenwurzel und Nervensack zur Seite (Punkte und dunkler Kern gleich)
const PUSH = /* glsl */`
  uniform float uPush; uniform vec3 uBlob, uPushDir;
  float pushW(vec3 p){ vec3 q = p - uBlob; q.y *= .5; return exp(-dot(q, q) / .7) * uPush; }
  float pushAmt(float kind){ return kind > 3.5 && kind < 4.5 ? .52 : kind > 1.5 && kind < 2.5 ? .2 : 0.; }`;

const VS_ST = HASH + LIGHT + PUSH + /* glsl */`
  attribute vec3 pos2; attribute float aSegA, aKind;
  uniform float uLift, uOpen, uCutY, uTime, uStip, uMaxSize, uScan, uAlarm, uHitS;
  uniform vec3 cBone, cBlue, cNerve, cDura, cAlarm, cAmber, cSignal;
  varying vec3 vCol; varying float vHide;
  void main(){
    vec3 p = position, n = normal; float s = pos2.x, rnd = pos2.z, gone = 0.;
    if (aSegA > .5) { // Wirbel L4 löst sich nach oben auf
      float k = clamp(uLift * 1.7 - rnd * .7, 0., 1.); k = k * k * (3. - 2. * k);
      p.y += k * (3. + rnd * 4.5);
      p.xz += n.xz * k * 1.5 + vec2(sin(rnd * 40. + uTime * .7), cos(rnd * 31. + uTime * .6)) * k * .5;
      gone = k;
    } else if (aKind > 1.5 && position.y > uCutY + .004) { // Nerven oberhalb der Schnittebene
      float k = clamp(uOpen * 1.6 - rnd * .6, 0., 1.); p.y += k * k * 1.1; gone = k;
    }
    float wP = aKind > 1.5 ? pushW(p) : 0.;
    p += uPushDir * wP * pushAmt(aKind);
    vec3 V = normalize(cameraPosition - p);
    float lam = max(dot(n, normalize(LDIR)), 0.), rim = pow(1. - abs(dot(n, V)), 3.);
    vec3 col; float sz = 1.;
    float face = abs(dot(n, V)), ends = 1.;
    if (aKind < 1.5) { col = (cBone * (.2 + .92 * lam) + cBlue * rim * .2) * (1. - .34 * uOpen); }
    else if (aKind < 2.5) { // Nervensack: läuft oben und unten aus
      col = cDura * (.3 + .74 * lam) * (.5 + .5 * face); sz = .86;
      ends = smoothstep(-4.9, -3.3, position.y) * (1. - smoothstep(2.5, 3.9, position.y));
    } else {
      col = cNerve * (.42 + .62 * lam) * (.5 + .5 * face); sz = .86;
      ends = smoothstep(0., .06, s) * (1. - smoothstep(.86, 1., s));
      float flow = pow(fract(s * 2.2 - uTime * .32 + (aKind > 4.5 ? .37 * aKind : 0.)), 12.);
      col += cSignal * flow * .4;
      if (aKind < 4.5) { // betroffene Wurzel L5: an der Druckstelle und von dort abwärts gereizt
        float below = smoothstep(uHitS - .1, uHitS + .04, s);
        float hot = clamp(max(wP * 1.5, below), 0., 1.) * uAlarm;
        float pulse = pow(fract(s * 2.6 - uTime * 1.15), 5.) * below;
        col = mix(col, cAlarm * (.5 + .65 * lam), hot * .88) + cAlarm * pulse * uAlarm;
        sz *= 1. + pulse * uAlarm * .6;
      }
    }
    float g = exp(-pow((position.y - uScan) * 2.6, 2.));
    col = mix(col, cAmber * 1.3, g);
    vCol = col; vHide = position.y > uScan ? 1. : 0.;
    vec4 mv = viewMatrix * vec4(p, 1.);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = clamp(uStip * sz * (1. - gone * .8) * (.55 + .45 * ends) * (1. + g * .8) / -mv.z, 1., uMaxSize);
    if (gone > .985 || rnd > ends * 1.15) gl_Position = vec4(2., 2., 2., 1.);
  }`;
const FS_ST = /* glsl */`
  varying vec3 vCol; varying float vHide;
  void main(){
    float d = length(gl_PointCoord - .5);
    if (d > .5 || vHide > .5) discard;
    gl_FragColor = vec4(vCol * (1. - smoothstep(.18, .5, d) * .5), 1.);
    #include <colorspace_fragment>
  }`;
const VS_CORE = LIGHT + PUSH + /* glsl */`
  attribute vec3 pos2; attribute float aSegA, aKind;
  uniform float uInset, uCutY;
  varying float vL, vY, vSeg, vUp, vEnds;
  void main(){
    vec3 p = position - normal * uInset;
    vEnds = aKind < 1.5 ? 1. : aKind < 2.5 ? smoothstep(-4.9, -3.3, position.y) * (1. - smoothstep(2.5, 3.9, position.y)) : smoothstep(0., .06, pos2.x) * (1. - smoothstep(.86, 1., pos2.x));
    p += uPushDir * (aKind > 1.5 ? pushW(p) : 0.) * pushAmt(aKind);
    vL = max(dot(normal, normalize(LDIR)), 0.); vY = position.y; vSeg = aSegA;
    vUp = aKind > 1.5 && position.y > uCutY + .004 ? 1. : 0.;
    gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.);
  }`;
const FS_CORE = HASH + /* glsl */`
  uniform float uScan, uLift, uOpen; uniform vec3 cCore, cBone;
  varying float vL, vY, vSeg, vUp, vEnds;
  void main(){
    if (vY > uScan) discard;
    float h = hash2(gl_FragCoord.xy);
    if (h > vEnds * 1.1) discard;
    if (vSeg > .5 && h < uLift * 2.4) discard;
    if (vUp > .5 && h < uOpen * 2.6) discard;
    gl_FragColor = vec4(cCore + cBone * vL * .04, 1.);
    #include <colorspace_fragment>
  }`;
// Bandscheibe: Faserring (Ringe auf der Schnittfläche, Fasern der Außenwand) + Nervenfasern im Schnitt
const DISC_MIX = /* glsl */`
  uniform float uProt, uProl, uHeal;
  vec3 discPos(vec3 a, vec3 b, vec3 c){ return mix(mix(a, b, uProt * (1. - .45 * uHeal)), c, uProl * (1. - .8 * uHeal)); }`;
const VS_ANN = LIGHT + DISC_MIX + /* glsl */`
  attribute vec3 pos2, pos3, aN; attribute float aKind, aRnd, aTr, aHot;
  uniform float uOpen, uCutY, uStip, uMaxSize, uScan, uPulse, uPulseR, uTime;
  uniform vec3 cDisc, cDiscHi, cBlue, cAlarm, cAmber, cNerve;
  varying vec3 vCol; varying float vHide;
  void main(){
    vec3 p = aKind > 1.5 ? position : discPos(position, pos2, pos3);
    float gone = 0., sz = 1.;
    vec3 col;
    if (aKind < .5) { // Ringe der Schnittfläche: erst sichtbar, wenn der Wirbel abgehoben ist
      sz = smoothstep(.25, .85, uOpen) * .92;
      col = mix(cDisc, cDiscHi, aTr * .55) * (.74 + .26 * sin(aRnd * 60.));
      col += cAmber * uPulse * exp(-pow((aTr - uPulseR * 1.3 + .12) * 6.5, 2.)) * .6;
    } else if (aKind < 1.5) { // Außenwand
      if (position.y > uCutY + .01) { gone = clamp(uOpen * 1.6 - aRnd * .6, 0., 1.); p.y += gone * gone * .8; }
      vec3 V = normalize(cameraPosition - p);
      float lam = max(dot(aN, normalize(LDIR)), 0.), rim = pow(1. - abs(dot(aN, V)), 3.);
      col = cDisc * (.26 + .74 * lam) + cBlue * rim * .3;
      col += cAmber * uPulse * .22;
    } else { sz = smoothstep(.4, .9, uOpen) * 1.25; col = cNerve * (.75 + .25 * sin(aRnd * 50. + uTime * 1.6)); }
    float stress = aHot * max(uProt * .7, uProl) * (1. - uHeal * .75);
    if (aKind < 1.5) col = mix(col, cAlarm * (aKind < .5 ? 1. : .8), stress * .9);
    float g = exp(-pow((position.y - uScan) * 2.6, 2.));
    col = mix(col, cAmber * 1.3, g);
    vCol = col; vHide = position.y > uScan ? 1. : 0.;
    vec4 mv = viewMatrix * vec4(p, 1.);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = clamp(uStip * sz * (1. - gone) * (1. + g * .8) / -mv.z, 0., uMaxSize);
    if (gone > .985 || sz < .02) gl_Position = vec4(2., 2., 2., 1.);
  }`;
const VS_DCORE = DISC_MIX + /* glsl */`
  attribute vec3 pos2, pos3; uniform float uOpen, uCutY; varying float vY;
  void main(){
    vec3 p = discPos(position, pos2, pos3);
    vY = position.y;
    p.y = mix(p.y, min(p.y, uCutY - .035), uOpen);
    gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.);
  }`;
const FS_DCORE = /* glsl */`
  uniform float uScan; uniform vec3 cCore; varying float vY;
  void main(){
    if (vY > uScan) discard;
    gl_FragColor = vec4(cCore * .92, 1.);
    #include <colorspace_fragment>
  }`;
// Gallertkern: leuchtende Punkte (additiv), fließen durch den Riss in den Wirbelkanal
const VS_NUC = /* glsl */`
  attribute vec3 pos2, pos3; attribute float aKind, aRnd, aDel;
  uniform float uProt, uProl, uHeal, uOpen, uTime, uPulse, uSize, uScan;
  uniform vec3 cAmber, cHot, uBlob;
  varying vec3 vCol; varying float vA;
  void main(){
    float e1 = uProt, e2 = uProl, fade = 1.;
    if (aKind > .5) { // tritt aus: nacheinander durch den Riss; wird später abgebaut (bleibt, verblasst)
      e2 = smoothstep(aDel * .56, aDel * .56 + .44, uProl);
      fade = 1. - smoothstep(aRnd * .72, aRnd * .72 + .28, uHeal * 1.04);
    } else { e1 *= 1. - .5 * uHeal; e2 *= 1. - .8 * uHeal; }
    vec3 p = mix(mix(position, pos2, e1), pos3, e2);
    if (aKind > .5) p = mix(p, uBlob, uHeal * .22 * e2);
    float move = e2 * (1. - e2) * 4.;
    p += vec3(sin(uTime * 1.7 + aRnd * 50.), cos(uTime * 1.3 + aRnd * 37.) * .5, sin(uTime * 1.1 + aRnd * 23.)) * (.014 + .03 * move);
    vec4 mv = viewMatrix * vec4(p, 1.);
    gl_Position = projectionMatrix * mv;
    float tw = .78 + .22 * sin(uTime * 2.3 + aRnd * 80.);
    gl_PointSize = uSize * (1. + uPulse * .1 + move * .5) * (.75 + aRnd * .5) / -mv.z;
    vCol = mix(cAmber, cHot, uPulse * .14 + move * .35);
    vA = smoothstep(.2, .8, uOpen) * fade * tw * (.62 + uPulse * .1) * (position.y > uScan ? 0. : 1.);
  }`;

export function initVorfall({ root, isPaused = () => false, auto = true, onEnd = null }) {
  const $ = (s, r = root) => r.querySelector(s);
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const Q = new URLSearchParams(location.search), glQ = Q.get('gl'), tQ = Q.get('t');
  const stageEl = $('.vf-stage');
  const steps = [...root.querySelectorAll('.vf-steps li')].map((li) => ({ li, name: $('b', li).textContent.trim(), txt: $('span', li).textContent.trim() }));
  const N = steps.length;

  // ---------- Aufbau (Bühne, Beschriftung, Untertitel, Leiste) ----------
  const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html) e.innerHTML = html; return e; };
  const canvas = el('canvas', 'vf-canvas'); canvas.setAttribute('role', 'img');
  canvas.setAttribute('aria-label', 'Animation: Entstehung eines Bandscheibenvorfalls zwischen den Lendenwirbeln L4 und L5. Die Abschnitte stehen als Text unter dem Film.');
  const lines = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); lines.setAttribute('class', 'vf-lines'); lines.setAttribute('aria-hidden', 'true');
  const labs = el('div', 'vf-labels'); labs.setAttribute('aria-hidden', 'true');
  const ray = el('div', 'vf-ray', '<b>Ausstrahlung</b><ol><li>Gesäß</li><li>Bein außen</li><li>Schienbein</li><li>Großzehe</li></ol><i></i>'); ray.setAttribute('aria-hidden', 'true');
  const lapse = el('p', 'vf-lapse', '<b>Zeitraffer</b>Wochen bis Monate'); lapse.setAttribute('aria-hidden', 'true');
  const cap = el('p', 'vf-cap', '<b></b><span></span>'); cap.setAttribute('aria-hidden', 'true');
  const big = el('button', 'vf-big', '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5l11 7-11 7z"/></svg><span>Film ansehen</span>'); big.type = 'button';
  const load = el('p', 'vf-load', 'Film wird vorbereitet …');
  stageEl.append(canvas, lines, labs, ray, lapse, big, load);
  const bar = el('div', 'vf-bar');
  const playBtn = el('button', 'vf-play', '<svg class="i-play" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5l11 7-11 7z"/></svg><svg class="i-pause" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14M16 5v14"/></svg><svg class="i-again" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12a8 8 0 1 0 2.6-5.9"/><path d="M4 4v5h5"/></svg>');
  playBtn.type = 'button';
  const track = el('div', 'vf-track'); track.setAttribute('role', 'group'); track.setAttribute('aria-label', 'Abschnitte des Films');
  const chBtns = steps.map((s, i) => {
    const b = el('button', 'vf-chap', `<i><u></u></i><span><em>${String(i + 1).padStart(2, '0')}</em><b></b></span>`); b.type = 'button';
    b.querySelector('b').textContent = s.name;
    b.style.flexGrow = String((i < N - 1 ? CH_T[i + 1] : T_END) - CH_T[i]);
    b.setAttribute('aria-label', `Abschnitt ${i + 1}: ${s.name}`);
    track.appendChild(b); return b;
  });
  bar.append(playBtn, track);
  stageEl.after(cap, bar); // Untertitel: am PC über dem unteren Bildrand (CSS-Raster), am Handy unter der Bühne
  const fills = chBtns.map((b) => $('u', b));

  // ---------- ohne (nutzbares) WebGL: Standbilder je Abschnitt, Text bleibt sichtbar ----------
  let glOk = false;
  try {
    const c = document.createElement('canvas'), g = c.getContext('webgl2', { failIfMajorPerformanceCaveat: !glQ });
    if (g) {
      const e = g.getExtension('WEBGL_debug_renderer_info');
      glOk = !!glQ || !/swiftshader|llvmpipe|softpipe|software|basic render/i.test(String(g.getParameter(e ? e.UNMASKED_RENDERER_WEBGL : g.RENDERER)));
      g.getExtension('WEBGL_lose_context')?.loseContext();
    }
  } catch (e) { /* ohne WebGL 2 */ }

  let t = 0, playing = false, ended = false, started = false, autoPaused = false, dirty = true, chap = -1, ready = false;
  const chapOf = (x) => { let i = N - 1; while (i > 0 && x < CH_T[i]) i--; return i; };
  function setChap(i) {
    if (i === chap) return; chap = i;
    cap.classList.remove('is-in'); void cap.offsetWidth;
    cap.firstChild.textContent = `${String(i + 1).padStart(2, '0')} / ${String(N).padStart(2, '0')} · ${steps[i].name}`; cap.lastChild.textContent = steps[i].txt;
    cap.classList.add('is-in');
    steps.forEach((s, k) => s.li.classList.toggle('is-on', k === i));
    chBtns.forEach((b, k) => { if (k === i) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current'); });
    root.dataset.chap = String(i + 1);
  }
  function ui() {
    root.classList.toggle('is-playing', playing); root.classList.toggle('is-ended', ended && !playing); root.classList.toggle('is-started', started);
    playBtn.setAttribute('aria-label', playing ? 'Film anhalten' : ended ? 'Film noch einmal abspielen' : 'Film abspielen');
    playBtn.title = playBtn.getAttribute('aria-label');
    big.lastChild.textContent = ended ? 'Noch einmal ansehen' : 'Film ansehen';
  }
  function progress() {
    for (let i = 0; i < N; i++) { const a = CH_T[i], b = i < N - 1 ? CH_T[i + 1] : T_END; fills[i].style.transform = `scaleX(${clamp((t - a) / (b - a)).toFixed(4)})`; }
    setChap(chapOf(t));
  }

  if (!glOk) {
    root.classList.add('vf-nogl');
    load.remove(); big.remove(); playBtn.remove();
    let cur = 0;
    const show = (i) => { cur = i; t = KEY_T[i]; stageEl.dataset.still = String(i + 1); for (let k = 0; k < N; k++) fills[k].style.transform = `scaleX(${k <= i ? 1 : 0})`; setChap(i); };
    chBtns.forEach((b, i) => b.addEventListener('click', () => show(i)));
    show(tQ ? chapOf(+tQ) : 0);
    return { play() {}, pause() {}, seek: (x) => show(chapOf(x)), view: () => null, done: Promise.resolve(0), keys: KEY_T, state: () => ({ t, playing: false, gl: false, chap: cur, ready: true }) };
  }

  // ---------- Bühne ----------
  const st = stage(canvas, { fov: FOV, onResize: () => { dirty = true; } });
  if (!st) { root.classList.add('vf-nogl'); return null; }
  st.camera.near = 1; st.camera.far = 200; st.camera.updateProjectionMatrix();
  const mobile = innerWidth <= 920;
  const U = {
    uLift: { value: 0 }, uOpen: { value: 0 }, uCutY: { value: 0 }, uTime: { value: 0 }, uStip: { value: 1 }, uMaxSize: { value: 8 }, uScan: { value: -99 },
    uPush: { value: 0 }, uAlarm: { value: 0 }, uHitS: { value: 0.3 }, uBlob: { value: new THREE.Vector3() }, uPushDir: { value: new THREE.Vector3() },
    uProt: { value: 0 }, uProl: { value: 0 }, uHeal: { value: 0 }, uPulse: { value: 0 }, uPulseR: { value: 0 }, uInset: { value: 0.02 }, uSize: { value: 1 },
    cBone: { value: C('#F3EADA') }, cBlue: { value: C('#5AA2D6') }, cNerve: { value: C('#EDA63A') }, cDura: { value: C('#B9822D') }, cSignal: { value: C('#FFE6B8') }, // Kai 14.11.: alle Nerven in Bernstein
    cAlarm: { value: C('#E0583C') }, cAmber: { value: C('#E59A2F') }, cHot: { value: C('#FFD9A0') }, cDisc: { value: C('#3E8FBD') }, cDiscHi: { value: C('#7CC3EA') }, cCore: { value: C('#0E1C22') },
  };
  const UA = { ...U, uStip: { value: 1 } }; // Faserring: eigene Punktgröße
  let seg = null, spacing = 0.07, annSpacing = 0.06;

  function* buildGen() {
    seg = buildSegment(mobile);
    yield;
    const sKey = (v, col) => ({ la: v, lb: { x: col.r, y: 0, z: Math.random() }, a: 0, b: 0, w: 0 });
    const parts = [
      { geo: seg.L5, kind: 0, map: (v) => ({ la: v, lb: { x: 0, y: 0, z: Math.random() }, a: 0, b: 0, w: 0 }) },
      { geo: seg.L4, kind: 1, map: (v) => ({ la: v, lb: { x: 0, y: 0, z: Math.random() }, a: 1, b: 1, w: 0 }) },
      ...seg.nerves.map((n) => ({ geo: n.geo, kind: n.kind, map: sKey, dens: n.kind === 2 ? 1.5 : 2.1 })),
    ];
    const pts = yield* stippleGen(parts, mobile ? 36000 : 92000);
    yield;
    const core = yield* coreOfGen(parts);
    spacing = pts.spacing; annSpacing = mobile ? 0.075 : 0.052;
    U.uCutY.value = seg.cutY; U.uHitS.value = seg.hitS;
    U.uBlob.value.copy(seg.blobC).addScaledVector(seg.D, 0.12); U.uPushDir.value.copy(seg.D);
    const mat = (vs, fs, uni, extra = {}) => new THREE.ShaderMaterial({ uniforms: uni, vertexShader: vs, fragmentShader: fs, ...extra });
    const objs = [
      new THREE.Mesh(core, mat(VS_CORE, FS_CORE, U, { side: THREE.DoubleSide })),
      new THREE.Mesh(seg.discCore, mat(VS_DCORE, FS_DCORE, U, { side: THREE.DoubleSide })),
      new THREE.Points(pts.geo, mat(VS_ST, FS_ST, U)),
      new THREE.Points(seg.annGeo, mat(VS_ANN, FS_ST, UA)),
      new THREE.Points(seg.nucGeo, mat(VS_NUC, FRAG, U, { transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })),
    ];
    objs.forEach((o, i) => { o.frustumCulled = false; o.renderOrder = i; st.scene.add(o); });
    yield;
    st.renderer.compile(st.scene, st.camera);
    return pts.count;
  }

  const fitOf = () => (st.aspect < 1.3 ? Math.pow(1.3 / st.aspect, 0.5) : 1); // schmale Bühne: Kamera weiter weg
  // ---------- Beschriftungen: Punkt im Raum + Textspalte links/rechts; Handy (hochkant): feste Plätze oben/unten ----------
  let LAB = [];
  function makeLabels() {
    const s = seg, y = s.cutY, D = s.D;
    const at = (r, dy = 0) => new THREE.Vector3(D.x * r, y + dy, D.z * r);
    const def = [ // Text, Punkt im Raum, Seite (−1 links, 1 rechts), Versatz in der Höhe, von, bis, Platz am Handy [x, y] (Anteil der Bühne)
      ['Wirbel L4', new THREE.Vector3(2.25, 1.9, 0.4), -1, -40, 2.3, 6.6],
      ['Bandscheibe', new THREE.Vector3(2.4, 0.1, 0.8), -1, 0, 2.8, 6.6],
      ['Wirbel L5', new THREE.Vector3(2.3, -1.9, 0.4), -1, 30, 3.3, 6.6],
      ['Nerv', s.cL5.getPointAt(0.8), -1, 14, 3.8, 6.6],
      ['Faserring', new THREE.Vector3(-1.75, y, 0.95), 1, -44, 9.6, 13.2, [0.95, 0.1]],
      ['Gallertkern', new THREE.Vector3(0.1, y, 0.25), -1, -84, 10.1, 13.2, [0.05, 0.1]],
      ['Nervenwurzel L5', new THREE.Vector3(s.root0.x + 0.1, y - 0.15, s.root0.z - 0.1), -1, 22, 10.7, 13.2, [0.05, 0.9]],
      ['Nervenkanal', new THREE.Vector3(-0.35, y, s.canalZ(y) - 0.15), 1, 54, 11.2, 13.2, [0.95, 0.9]],
      ['Risse im Faserring', at(s.RD * 0.74), -1, -70, 15.4, 19.7, [0.05, 0.1]],
      ['Vorwölbung', at(s.RD + 0.24, -0.2), -1, 30, 17.4, 19.7, [0.05, 0.9]],
      ['Vorfall', new THREE.Vector3().copy(s.blobC).setY(y - 0.1), -1, -64, 22.2, 28.6, [0.05, 0.19]],
      ['Nervenwurzel L5 unter Druck', s.cL5.getPointAt(Math.min(1, s.hitS + 0.045)).addScaledVector(D, 0.5), -1, 40, 23.0, 28.6, [0.05, 0.92]],
      ['Material wird abgebaut', new THREE.Vector3().copy(s.blobC).setY(y - 0.1), -1, -64, 29.6, 32.3, [0.05, 0.1]],
    ];
    LAB = def.map(([txt, p, side, dy, t0, t1, mob]) => {
      const d = el('div', 'vf-lab'); d.appendChild(el('span')).textContent = txt; labs.appendChild(d);
      const svg = (tag, cls) => { const e = document.createElementNS('http://www.w3.org/2000/svg', tag); if (cls) e.setAttribute('class', cls); return e; };
      const bg = svg('path', 'bg'), ln = svg('path'), dot = svg('circle'); dot.setAttribute('r', '3'); // bg: dunkler Rand, damit die Linie auch über hellen Punkten lesbar bleibt
      lines.append(bg, ln, dot);
      return { d, ln, bg, dot, p, side, dy, t0, t1, mob, w: 0 };
    });
  }
  function placeLabels() {
    const fit = fitOf(), k = clamp(st.h / 720, 0.6, 1.3), pad = 10, tall = st.aspect < 1;
    const col = (0.43 * st.h) / fit; // Abstand der Textspalten von der Bildmitte
    for (const L of LAB) {
      const a = Math.min(sm(L.t0, L.t0 + 0.5, t), 1 - sm(L.t1 - 0.5, L.t1, t));
      const vis = a > 0.01;
      L.d.style.opacity = L.ln.style.opacity = L.bg.style.opacity = L.dot.style.opacity = vis ? a.toFixed(3) : '0';
      if (!vis) continue;
      if (!L.w) L.w = L.d.offsetWidth;
      const s = toScreen(st, L.p), left = L.side < 0;
      let dd;
      if (tall && L.mob) { // Handy: Text oben oder unten am Rand, Linie von der Textkante zum Punkt
        const lf = L.mob[0] < 0.5, x = L.mob[0] * st.w, y2 = L.mob[1] * st.h, top = L.mob[1] < 0.5;
        L.d.style.transform = `translate(${x.toFixed(1)}px, ${y2.toFixed(1)}px) translate(${lf ? '0' : '-100%'}, -50%)`;
        const ex = x + (lf ? 1 : -1) * Math.min(L.w * 0.5, 34), ey = y2 + (top ? 11 : -11);
        dd = `M${s.x.toFixed(1)} ${s.y.toFixed(1)} L${ex.toFixed(1)} ${(ey + (top ? 12 : -12)).toFixed(1)} L${ex.toFixed(1)} ${ey.toFixed(1)}`;
      } else {
        let x = st.w / 2 + L.side * col; const y2 = clamp(s.y + L.dy * k, pad + 12, st.h - pad - 12);
        x = left ? Math.max(pad + L.w, Math.min(x, s.x - 40)) : Math.min(st.w - pad - L.w, Math.max(x, s.x + 40));
        L.d.style.transform = `translate(${x.toFixed(1)}px, ${y2.toFixed(1)}px) translate(${left ? '-100%' : '0'}, -50%)`;
        const ex = x + (left ? 8 : -8), mx = ex + (left ? 1 : -1) * Math.min(Math.abs(s.x - ex) * 0.45, 46 * k);
        dd = `M${s.x.toFixed(1)} ${s.y.toFixed(1)} L${mx.toFixed(1)} ${y2.toFixed(1)} L${ex.toFixed(1)} ${y2.toFixed(1)}`;
      }
      L.ln.setAttribute('d', dd); L.bg.setAttribute('d', dd);
      L.dot.setAttribute('cx', s.x.toFixed(1)); L.dot.setAttribute('cy', s.y.toFixed(1));
    }
  }
  const rayStops = [...ray.querySelectorAll('li')], rayDot = $('i', ray);

  // ---------- Bild zur Zeit t ----------
  const cv = new Float32Array(6), tgt = new THREE.Vector3();
  function apply() {
    const S = stateAt(t);
    U.uLift.value = S.lift; U.uOpen.value = S.open; U.uScan.value = S.scan; U.uTime.value = t;
    U.uProt.value = S.prot; U.uProl.value = S.prol; U.uHeal.value = S.heal; U.uPush.value = S.push; U.uAlarm.value = S.alarm;
    U.uPulse.value = S.pulse; U.uPulseR.value = S.pulseR;
    const pr = st.renderer.getPixelRatio();
    U.uStip.value = stipSize(st, FOV, spacing, 0.7); UA.uStip.value = stipSize(st, FOV, annSpacing, 0.74);
    U.uMaxSize.value = 9 * pr; U.uSize.value = stipSize(st, FOV, annSpacing, 1.22);
    camAt(t, cv);
    const fit = fitOf();
    const az = THREE.MathUtils.degToRad(cv[0]), elv = THREE.MathUtils.degToRad(cv[1]), R = cv[2] * fit;
    tgt.set(cv[3], cv[4], cv[5]);
    st.camera.position.set(tgt.x + Math.sin(az) * Math.cos(elv) * R, tgt.y + Math.sin(elv) * R, tgt.z + Math.cos(az) * Math.cos(elv) * R);
    st.camera.lookAt(tgt);
    st.camera.updateMatrixWorld();
    st.renderer.render(st.scene, st.camera);
    placeLabels();
    ray.style.opacity = S.ray.toFixed(3); lapse.style.opacity = S.lapse.toFixed(3);
    if (S.ray > 0.01) { ray.style.setProperty('--p', S.rayP.toFixed(3)); rayStops.forEach((li, i) => li.classList.toggle('is-hot', S.rayP > (i + 0.5) / rayStops.length - 0.12)); }
    progress();
  }

  // ---------- Abspielen ----------
  let last = 0, gp = isPaused();
  function frame(now) {
    requestAnimationFrame(frame);
    const dt = Math.min(0.1, (now - last) / 1000); last = now;
    const g = isPaused(); if (g && !gp && playing) pause(); gp = g;
    if (!ready || !st.visible) return;
    if (playing) { t += dt; dirty = true; if (t >= T_END) { t = T_END; playing = false; ended = true; ui(); if (onEnd) onEnd(); } }
    if (!dirty) return;
    dirty = false; apply();
  }
  function play() { if (!ready) return; if (!started || ended || t >= T_END - 0.01) { t = 0; ended = false; } playing = true; started = true; autoPaused = false; ui(); }
  function pause() { playing = false; ui(); }
  function seek(x, keep) { t = clamp(x, 0, T_END); ended = t >= T_END - 0.01; started = true; if (!keep) playing = false; dirty = true; ui(); }
  playBtn.addEventListener('click', () => (playing ? pause() : play()));
  big.addEventListener('click', play);
  canvas.addEventListener('click', () => { if (started) (playing ? pause() : play()); });
  // Leiste: Tippen = Abschnitt, Ziehen = spulen
  let drag = null;
  const tAt = (x) => { for (let i = 0; i < N; i++) { const r = chBtns[i].getBoundingClientRect(); if (x <= r.right || i === N - 1) return CH_T[i] + clamp((x - r.left) / r.width) * ((i < N - 1 ? CH_T[i + 1] : T_END) - CH_T[i]); } return 0; };
  track.addEventListener('pointerdown', (e) => { drag = { x: e.clientX, moved: false, was: playing }; });
  addEventListener('pointermove', (e) => { if (!drag) return; if (!drag.moved && Math.abs(e.clientX - drag.x) < 5) return; drag.moved = true; seek(tAt(e.clientX)); });
  const up = () => { if (drag && drag.moved && drag.was && !ended) play(); setTimeout(() => { drag = null; }, 0); };
  addEventListener('pointerup', up); addEventListener('pointercancel', up);
  chBtns.forEach((b, i) => b.addEventListener('click', () => {
    if (drag && drag.moved) return;
    if (reduced) seek(KEY_T[i]); else { seek(CH_T[i] + (i ? 0.02 : 0)); play(); }
  }));
  root.addEventListener('keydown', (e) => {
    if (e.target.closest('.vf-bar') && (e.key === 'ArrowRight' || e.key === 'ArrowLeft')) { e.preventDefault(); const i = clamp(chapOf(t) + (e.key === 'ArrowRight' ? 1 : -1), 0, N - 1); chBtns[i].focus(); chBtns[i].click(); }
  });
  // von selbst starten, sobald der Film gut im Bild ist; außerhalb anhalten
  if (auto) new IntersectionObserver(([e]) => {
    if (e.isIntersecting) { if (ready && !started && !reduced && !isPaused() && tQ === null) play(); else if (autoPaused) play(); }
    else if (playing) { pause(); autoPaused = true; }
  }, { threshold: 0.55 }).observe(stageEl);

  // Lage des Segments im Fenster zur Filmzeit tt (auch vor dem Aufbau gültig): Mitte zwischen L4 und L5, Bildpunkte je cm,
  // Blickwinkel (Azimut °), Bildschirmhöhe der Scan-Linie (Aufbau in den ersten Sekunden; danach null)
  const vcam = new THREE.PerspectiveCamera(FOV, 1, 1, 200), vv = new Float32Array(6), vp = new THREE.Vector3();
  const MID = new THREE.Vector3().fromArray(META.L4.c).add(new THREE.Vector3().fromArray(META.L5.c)).multiplyScalar(0.5);
  function view(tt = t) {
    if (!st.w) return null;
    camAt(tt, vv);
    const fit = fitOf(), az = THREE.MathUtils.degToRad(vv[0]), elv = THREE.MathUtils.degToRad(vv[1]), R = vv[2] * fit;
    vcam.aspect = st.aspect; vcam.updateProjectionMatrix();
    vcam.position.set(vv[3] + Math.sin(az) * Math.cos(elv) * R, vv[4] + Math.sin(elv) * R, vv[5] + Math.cos(az) * Math.cos(elv) * R);
    vcam.lookAt(vv[3], vv[4], vv[5]); vcam.updateMatrixWorld(true);
    const r = canvas.getBoundingClientRect();
    const px = (x, y, z) => { vp.set(x, y, z).project(vcam); return [r.left + (vp.x * 0.5 + 0.5) * r.width, r.top + (-vp.y * 0.5 + 0.5) * r.height]; };
    const c = px(MID.x, MID.y, MID.z), u = px(MID.x, MID.y + 1, MID.z), sc = stateAt(tt).scan;
    return { x: c[0], y: c[1], ppc: Math.hypot(u[0] - c[0], u[1] - c[1]), az: vv[0], scanY: sc > 50 ? null : px(0, sc, 0)[1], top: r.top, h: r.height };
  }

  ui(); setChap(0);
  const done = runSliced(buildGen()).then((count) => {
    makeLabels(); ready = true; load.remove(); root.classList.add('is-ready');
    if (tQ !== null) seek(+tQ); else { seek(KEY_T[0]); started = false; ui(); } // Vorschaubild, bis der Film startet
    dirty = true; last = performance.now(); requestAnimationFrame(frame);
    const r = stageEl.getBoundingClientRect();
    if (auto && tQ === null && !reduced && !isPaused() && r.top < innerHeight * 0.6 && r.bottom > innerHeight * 0.4) play();
    return count;
  });
  return { play, pause, seek, view, done, canvas, keys: KEY_T, state: () => ({ t, playing, ended, ready, chap, gl: true, seg, st, cam: [...cv] }) };
}
