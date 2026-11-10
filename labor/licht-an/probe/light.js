// Lichtprobe „Licht malt den Raum“ (Wegwerf-Entwurf, nur für hausbesuch-puls):
// motiviertes Licht in der Partikel-Praxis – Lampen im Raum, Sonne durch Fenster je nach Tageszeit, Himmelslicht,
// leuchtende Fenster von außen. Der Baustein liefert
//   · den Licht-Zustand (Sonnenrichtung/-farbe, Himmel, Lampen, Hintergrund) aus Tageszeit oder echtem Sonnenstand,
//   · einen GLSL-Baustein houseLight(p, n, room) für alle Haus-Shader (Möbel, Kern, Flächen, Staub),
//   · die neue Punkt-Schicht „Flächen“ (Boden, Wände, Vorplatz, Glas, Rahmen, Leuchten),
//   · Lampen-Schein, Lichtbahnen (Staub im Sonnenstrahl) und Dampf über der Tasse.
// Annahme zur Lage: Haustür zeigt nach Süden (HOUSE_AZ), +z = Süden, +x = Osten. Fenster frei gewählt (Grundriss ist schematisch).
import * as THREE from 'three';
import { sunPos, ORT } from './sun.js';

const K = 0.0149, M = 0.5, Y0 = -3, HW = 2.9 * M;
export const HOUSE_AZ = 180;                       // Himmelsrichtung der Haustür in Grad (N = 0, O = 90, S = 180)
const PX = (x) => (x - 210) * K, PZ = (y) => (y - 140) * K;
const XL = PX(8), XR = PX(412), ZB = PZ(8), ZF = PZ(272);
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const smooth = (a, b, v) => { const t = clamp((v - a) / (b - a)); return t * t * (3 - 2 * t); };
const lerp = (a, b, t) => a + (b - a) * t;
const mix3 = (a, b, t) => a.map((v, i) => lerp(v, b[i], t));
const lin = (hex) => { const c = new THREE.Color(hex); return [c.r, c.g, c.b]; };
const F = (v) => v.toFixed(4);

// Räume wie praxis.js (0 Empfang · 1 Wartebereich · 2 Behandlung 1 · 3 Behandlung 2 · 4 Training · 5 Flur), dazu 6 = draußen.
// Eigene, lückenlose Aufteilung (praxis.js lässt an den Wänden schmale Streifen dem Flur).
export function roomAt(px, py) {
  if (px < 8 || px > 412 || py < 8 || py > 272) return 6;
  if (px < 166) return py < 140 ? 0 : 1;
  if (px > 232) return py < 94 ? 2 : py < 178 ? 3 : 4;
  return 5;
}
const roomOfWorld = (x, z) => roomAt(x / K + 210, z / K + 140);
const ROOM_BOX = [[8, 8, 166, 140], [8, 140, 166, 272], [232, 8, 412, 94], [232, 94, 412, 178], [232, 178, 412, 272], [166, 8, 232, 272]];

// Fenster: ax 0 = Wandebene x = c (Ausdehnung a…b in y des Grundrisses), ax 1 = Wandebene y = c (Ausdehnung in x).
// Brüstung 0,9 m, Sturz 2,1 m. Letzter Eintrag = Haustür (Lichtöffnung, sobald sie aufgeht).
const SILL = Y0 + 0.9 * M, HEAD = Y0 + 2.1 * M;
const WINS = [
  { ax: 1, c: 272, a: 40, b: 120, room: 1 },   // Front links (Wartebereich)
  { ax: 1, c: 272, a: 270, b: 370, room: 4 },  // Front rechts (Training)
  { ax: 0, c: 8, a: 40, b: 110, room: 0 },     // linke Außenwand (Empfang)
  { ax: 1, c: 8, a: 280, b: 360, room: 2 },    // obere Außenwand (Behandlung 1)
  { ax: 0, c: 412, a: 110, b: 160, room: 3 },  // rechte Außenwand (Behandlung 2)
  { ax: 0, c: 412, a: 200, b: 250, room: 4 },  // rechte Außenwand (Training)
  { ax: 1, c: 272, a: 182, b: 216, room: 5, door: true },
].map((w) => ({ ...w, cw: w.ax ? PZ(w.c) : PX(w.c), aw: w.ax ? PX(w.a) : PZ(w.a), bw: w.ax ? PX(w.b) : PZ(w.b), y0: w.door ? Y0 : SILL, y1: HEAD }));
const NW = WINS.length;

// Lampen: Pendelleuchten und Stehleuchte aus praxis.js, dazu drei schlichte Deckenleuchten (Flur, Training) und die Türlaterne.
// r0 = Reichweite (halbe Stärke bei r0), cone = 0 rundum … 1 nach unten, glow = Radius des Scheins, sleep = Stärke, wenn das Haus schläft.
const LAMPS = [
  { px: 70, py: 52, h: 2.04, room: 0, r0: 0.95, cone: 0.85, glow: 0.3 },
  { px: 320, py: 48, h: 2.04, room: 2, r0: 0.95, cone: 0.85, glow: 0.3 },
  { px: 320, py: 136, h: 2.04, room: 3, r0: 0.95, cone: 0.85, glow: 0.3 },
  { px: 98, py: 94, h: 2.3, room: 0, r0: 1.25, cone: 1, glow: 0.24, fix: true, cord: true },   // Hängeleuchte beim Teppich: der Gast steht im Licht, die Quelle ist auch am Handy im Bild
  { px: 152, py: 255, h: 1.62, room: 1, r0: 0.8, cone: 0, glow: 0.32, sleep: 0.42 },
  { px: 199, py: 128, h: 2.8, room: 5, r0: 0.9, cone: 1, glow: 0.2, fix: true },
  { px: 199, py: 232, h: 2.8, room: 5, r0: 0.9, cone: 1, glow: 0.2, fix: true },
  { px: 318, py: 222, h: 2.8, room: 4, r0: 1.05, cone: 1, glow: 0.22, fix: true },
  { px: 224, py: 276, h: 2.02, room: 6, r0: 0.75, cone: 0, glow: 0.26, lantern: true },
].map((l) => ({ ...l, x: PX(l.px), y: Y0 + l.h * M, z: PZ(l.py) }));
const NL = LAMPS.length;

// Tageszeiten der Probe = feste Sonnenstände; „jetzt“ = echter Sonnenstand über Schorndorf.
export const ZEITEN = {
  morgen: { az: 110, el: 12, name: 'Morgen' },
  mittag: { az: 180, el: 38, name: 'Mittag' },
  golden: { az: 250, el: 9, name: 'Golden' },
  abend: { az: 285, el: -5, name: 'Abend' },
  nacht: { az: 0, el: -40, sleep: true, name: 'Nacht' },
};
const berlinHour = (d) => { try { return +new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Berlin', hour: '2-digit', hourCycle: 'h23' }).format(d); } catch (e) { return d.getHours(); } };

const LAMP_COL = [1.75, 1.04, 0.46];      // ≈ 2700 K, etwas an das Auge angepasst (linear)
const INK = { nacht: [7, 10, 17], abend: [21, 15, 12], gold: [27, 18, 12], tag: [15, 19, 22] }; // Hintergrund (sRGB 0–255)

/** Licht-Zustand aus Sonnenstand (Azimut/Höhe in Grad) und „Haus schläft“. Alle Farben linear. */
export function stateFor(az, el, sleep = false) {
  const rad = Math.PI / 180, ce = Math.cos(el * rad);
  const dir = [ce * Math.sin((HOUSE_AZ - az) * rad), Math.sin(el * rad), ce * Math.cos((az - HOUSE_AZ) * rad)];
  const day = smooth(-5, 5, el), high = Math.pow(smooth(2, 34, el), 0.55), up = smooth(-0.8, 4, el);
  const dusk = smooth(-12, -4, el) * (1 - day), aw = sleep ? 0 : 1, dark = 1 - day;
  const sunCol = mix3([1.0, 0.44, 0.17], [1.0, 0.93, 0.82], high).map((v) => v * up * lerp(1.25, 1.0, high));
  const skyDay = mix3([1.0, 0.66, 0.44], [0.6, 0.76, 1.0], high);
  const sky = skyDay.map((v, i) => v * 0.5 * day + [0.13, 0.22, 0.6][i] * 0.3 * dusk + [0.006, 0.01, 0.024][i]);
  const lampAll = lerp(1.0, 0.25, smooth(2, 26, el));
  const lampK = LAMPS.map((l) => (l.lantern ? 1 - smooth(-2, 5, el) : sleep ? (l.sleep || 0) : lampAll));
  const amb = [0, 1, 2].map((i) => [0.085, 0.085, 0.09][i] * day + [0.062, 0.047, 0.035][i] * dark * aw + [0.007, 0.01, 0.02][i] * dark * (1 - aw));
  const glassIn = skyDay.map((v, i) => v * 0.8 * day + [0.1, 0.17, 0.48][i] * 0.5 * dusk + [0.004, 0.007, 0.018][i]);
  const ink = sleep ? INK.nacht : mix3(mix3(INK.abend, INK.gold, smooth(-5, 3, el)), INK.tag, smooth(8, 28, el));
  const tintRaw = [0, 1, 2].map((i) => amb[i] * 2 + LAMP_COL[i] * lampAll * aw * 0.5 + sky[i] * 0.6 + sunCol[i] * 0.3), tm = Math.max(...tintRaw, 1e-4);
  return {
    dir, sunCol, sky, amb, lampK, glassIn, ink,
    glassOut: [lerp(1.0, 0.12, day)], lineTint: mix3([1.0, 0.9, 0.76], [1, 1, 1], day), sleep: [sleep ? 1 : 0],
    outW: [lerp(1, 0.55, day)], tint: mix3([1, 1, 1], tintRaw.map((v) => v / tm), 0.3),
  };
}

// ---------- GLSL-Baustein: houseLight(p, n, room) ----------
const KOSTEN = typeof location !== 'undefined' && /[?&]kosten=1/.test(location.search);
const GLSL = (KOSTEN ? '#define KOSTEN_TEST\n' : '') + /* glsl */`
#define NL ${NL}
#define NW ${NW}
uniform vec3 uSunDir, uSunCol, uSkyCol, uAmbCol, uLampCol, uLineTint, uCoreCol;
uniform vec4 uLamp[NL];   // xyz Ort, w Raum
uniform vec4 uLampP[NL];  // x Stärke, y Reichweite, z Kegel (0 rundum … 1 nach unten), w Schein-Radius
uniform vec4 uWin[NW];    // x Wandebene, y/z Bereich längs der Wand, w Raum
uniform vec4 uWinB[NW];   // x Achse (0: Ebene x = const, 1: Ebene z = const), y/z Unter-/Oberkante, w offen (0…1)
uniform float uRoomW[7], uRoomLamp[7], uGridK, uRowK, uTimeL;
float lRect(float u, float a, float b, float e){ return smoothstep(a - e, a + e, u) * (1. - smoothstep(b - e, b + e, u)); }
// Trifft der Strahl p + t·dir (t > 0) die Öffnung i? Weiche Kante wächst mit dem Weg (Halbschatten).
float lThrough(int i, vec3 p, vec3 dir){
  vec4 w = uWin[i], b = uWinB[i];
  bool xp = b.x < .5;
  float pc = xp ? p.x : p.z, dc = xp ? dir.x : dir.z;
  if (abs(dc) < 1e-4) return 0.;
  float t = (w.x - pc) / dc;
  if (t <= 0.) return 0.;
  vec3 q = p + dir * t;
  float e = .01 + t * .028;
  return lRect(xp ? q.z : q.x, w.y, w.z, e) * lRect(q.y, b.y, b.z, e) * b.w;
}
float lRoom(vec3 p){
  if (p.x < ${F(XL)} || p.x > ${F(XR)} || p.z < ${F(ZB)} || p.z > ${F(ZF)}) return 6.;
  if (p.x < ${F(PX(166))}) return p.z < 0. ? 0. : 1.;
  if (p.x > ${F(PX(232))}) return p.z < ${F(PZ(94))} ? 2. : p.z < ${F(PZ(178))} ? 3. : 4.;
  return 5.;
}
// Direkte Sonne: innen nur durch die Fenster des eigenen Raums, draußen frei (mit Schlagschatten des Hauses).
float lSun(vec3 p, float room){
  #ifdef KOSTEN_TEST
  return 0.;
  #endif
  if (room > 5.5) {
    if (uSunDir.z >= 0.) return 1.;
    float t = (${F(ZF)} - p.z) / uSunDir.z; vec3 q = p + uSunDir * t;
    return 1. - lRect(q.x, ${F(XL)}, ${F(XR)}, .05) * (1. - smoothstep(${F(Y0 + HW - 0.05)}, ${F(Y0 + HW + 0.05)}, q.y));
  }
  float m = 0.;
  for (int i = 0; i < NW; i++) if (abs(uWin[i].w - room) < .5) m += lThrough(i, p, uSunDir);
  return min(m, 1.);
}
float lLampNear(vec3 p){ float s = 0.;
  #ifdef KOSTEN_TEST
  return .3;
  #endif
  for (int j = 0; j < NL; j++){ vec3 d = uLamp[j].xyz - p; s += uLampP[j].x / (1. + dot(d, d) * 14.); } return s; }
// Bestrahlung eines Punkts: Umgebung + Lampen + Sonne × Fenstermaske + Himmelslicht durch die Fenster
vec3 houseLight(vec3 p, vec3 n, float room){
  #ifdef KOSTEN_TEST
  return vec3(.34, .24, .15);
  #endif
  vec3 E = uAmbCol;
  bool out6 = room > 5.5;
  for (int j = 0; j < NL; j++){
    vec4 L = uLamp[j], Q = uLampP[j];
    if (Q.x < .002) continue;
    vec3 d = L.xyz - p; float r2 = dot(d, d);
    vec3 l = d * inversesqrt(r2 + 1e-6);
    float k = 0.;
    if (abs(L.w - room) < .5) k = 1.;
    else if (out6) { for (int i = 0; i < NW; i++) if (abs(uWin[i].w - L.w) < .5 && uWinB[i].x > .5 && uWin[i].x > 0.) k += lThrough(i, p, l); }
    else if (L.w < 5.5) k = room > 4.5 ? .2 : .06;
    if (k < .002) continue;
    float ndl = max(dot(n, l) * .8 + .2, 0.);
    float cone = mix(1., smoothstep(-.2, .7, l.y), Q.z);
    E += uLampCol * (Q.x * k * ndl * cone / (1. + r2 / (Q.y * Q.y)));
  }
  float ns = dot(n, uSunDir);
  if (uSunCol.r > .001 && ns > 0.) E += uSunCol * (ns * lSun(p, room));
  if (out6) E += uSkyCol * (.3 + .7 * max(n.y, 0.)) * .6;
  else for (int i = 0; i < NW; i++) if (abs(uWin[i].w - room) < .5) {
    vec4 w = uWin[i], b = uWinB[i]; bool xp = b.x < .5;
    vec3 c = xp ? vec3(w.x, (b.y + b.z) * .5, (w.y + w.z) * .5) : vec3((w.y + w.z) * .5, (b.y + b.z) * .5, w.x);
    vec3 d = c - p; float r2 = dot(d, d); vec3 l = d * inversesqrt(r2 + 1e-6);
    E += uSkyCol * (b.w * (w.z - w.y) * (b.z - b.y) * abs(xp ? l.x : l.z) * max(dot(n, l) * .7 + .3, 0.) / (r2 + .5));
  }
  return E;
}
float lLum(vec3 c){ return dot(c, vec3(.3, .55, .15)); }
`;

const WALLS = [ // wie praxis.js (Grundriss V10)
  [8, 8, 412, 8], [8, 8, 8, 272], [412, 8, 412, 272], [8, 272, 182, 272], [216, 272, 412, 272],
  [12, 140, 70, 140], [108, 140, 166, 140],
  [166, 12, 166, 40], [166, 78, 166, 182], [166, 220, 166, 268],
  [232, 12, 232, 30], [232, 70, 232, 112], [232, 152, 232, 196], [232, 240, 232, 268],
  [232, 94, 408, 94], [232, 178, 408, 178],
];
const mulberry = (a) => () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const hash2 = (a, b) => { const s = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return s - Math.floor(s); };

/**
 * Licht anlegen. U = gemeinsame Uniforms der Haus-Materialien (werden um die Licht-Uniforms ergänzt).
 * Rückgabe: glsl, U, surfacesGen(n), fixRooms(prx), update(dt, {...}), setZeit(key), ink (Hintergrund), tint.
 */
export function createLight({ scene, shared, mob, reduced, U, zeit0 }) {
  const V4 = THREE.Vector4;
  const LU = {
    uSunDir: { value: new THREE.Vector3(0, 1, 0) }, uSunCol: { value: new THREE.Vector3() }, uSkyCol: { value: new THREE.Vector3() },
    uAmbCol: { value: new THREE.Vector3() }, uLampCol: { value: new THREE.Vector3(...LAMP_COL) }, uLineTint: { value: new THREE.Vector3(1, 1, 1) },
    uCoreCol: { value: new THREE.Vector3() }, uGlassIn: { value: new THREE.Vector3() }, uGlassOut: { value: 1 },
    uLamp: { value: LAMPS.map((l) => new V4(l.x, l.y, l.z, l.room)) },
    uLampP: { value: LAMPS.map((l) => new V4(0, l.r0, l.cone, l.glow)) },
    uWin: { value: WINS.map((w) => new V4(w.cw, w.aw, w.bw, w.room)) },
    uWinB: { value: WINS.map((w) => new V4(w.ax, w.y0, w.y1, w.door ? 0 : 1)) },
    uWinBox: { value: WINS.map((w) => { const b = ROOM_BOX[w.room]; return new V4(PX(b[0]), PZ(b[1]), PX(b[2]), PZ(b[3])); }) },
    uRoomW: { value: [1, 1, 1, 1, 1, 1, 1] }, uRoomLamp: { value: [0, 0, 0, 0, 0, 0, 0] },
    uGridK: { value: 0.22 }, uRowK: { value: 0.22 }, uTimeL: { value: 0 },
    uSurf: { value: 1 }, uSmax: { value: mob ? 3.6 : 4.4 }, uTh: { value: 0.035 }, uRamp: { value: 0.3 }, uFlat: { value: 0.14 }, uGain: { value: 1.3 },
    cF2: { value: new THREE.Color('#E4D8C3') }, cF3: { value: new THREE.Color('#8FB85A') }, cF4: { value: new THREE.Color('#E8A244') },
    cF5: { value: new THREE.Color('#6C98A6') }, cF6: { value: new THREE.Color('#EFE7D8') },
  };
  Object.assign(U, LU);
  const api = { glsl: GLSL, U, ink: [10, 22, 27], tint: [1, 1, 1], zeit: 'jetzt', count: 0, surf: null };

  // ---------- Zustand: Ziel (aus Tageszeit) und weich nachgeführter Ist-Wert ----------
  const nowState = () => { const d = new Date(), s = sunPos(d), h = berlinHour(d); api.sun = s; return stateFor(s.az, s.el, h >= 22 || h < 6); };
  const target = (key) => (ZEITEN[key] ? stateFor(ZEITEN[key].az, ZEITEN[key].el, !!ZEITEN[key].sleep) : nowState());
  let want = target(zeit0 in ZEITEN ? zeit0 : 'jetzt'), cur = JSON.parse(JSON.stringify(want)), jump = true;
  api.zeit = zeit0 in ZEITEN ? zeit0 : 'jetzt';
  api.setZeit = (key, hard = false) => { api.zeit = key in ZEITEN ? key : 'jetzt'; want = target(api.zeit); if (hard) jump = true; markUi(); };
  setInterval(() => { if (api.zeit === 'jetzt') want = nowState(); }, 60000);

  // ---------- Umschaltleiste (nur für die Probe) ----------
  const bar = document.getElementById('zeit'), btns = bar ? [...bar.querySelectorAll('button')] : [];
  const btnsAll = bar ? [...bar.querySelectorAll('button[data-zeit]')] : [], auf = document.getElementById('zeitAuf'), zName = document.getElementById('zeitName');
  function markUi() { btnsAll.forEach((b) => { const on = b.dataset.zeit === api.zeit; b.setAttribute('aria-pressed', String(on)); if (on && zName) zName.textContent = b.textContent; }); }
  if (auf && bar) auf.addEventListener('click', () => { const o = bar.classList.toggle('offen'); auf.setAttribute('aria-expanded', String(o)); });
  if (bar) {
    bar.hidden = false;
    btnsAll.forEach((b) => b.addEventListener('click', () => {
      api.setZeit(b.dataset.zeit, reduced); bar.classList.remove('offen'); if (auf) auf.setAttribute('aria-expanded', 'false');
      try { const u = new URL(location.href); u.searchParams.set('zeit', api.zeit); history.replaceState(null, '', u); } catch (e) { /* Vorschau ohne Adresse */ }
    }));
    markUi();
  }
  document.documentElement.classList.add('licht-an');

  // ---------- Räume der Möbelpunkte lückenlos neu bestimmen (praxis.js bleibt unverändert) ----------
  api.fixRooms = (prx) => {
    for (const g of [prx.furn, prx.core]) {
      const p = g.attributes.position.array, r = g.attributes.aRoom.array;
      for (let i = 0; i < r.length; i++) r[i] = Math.min(5, roomOfWorld(p[i * 3], p[i * 3 + 2]));
      g.attributes.aRoom.needsUpdate = true;
    }
  };

  // ---------- Punkt-Schicht „Flächen“ ----------
  // Art: 0 beleuchtete Fläche · 1 Glas (leuchtet selbst) · 2 Rahmen/Sprosse · 3 Leuchtenkörper
  api.surfacesGen = function* (n) {
    const rnd = mulberry(20261110);
    const pos = [], nor = [], col = [], room = [], kind = [], rr = [];
    const put = (x, y, z, nx, ny, nz, c, r, k) => { pos.push(x, y, z); nor.push(nx, ny, nz); col.push(c[0], c[1], c[2]); room.push(r); kind.push(k); rr.push(rnd()); };
    const face = (u0, u1, v0, v1, s, fn) => {
      const nu = Math.max(1, Math.round((u1 - u0) / s)), nv = Math.max(1, Math.round((v1 - v0) / s)), du = (u1 - u0) / nu, dv = (v1 - v0) / nv;
      for (let i = 0; i < nu; i++) for (let j = 0; j < nv; j++) fn(u0 + (i + 0.5 + (rnd() - 0.5) * 0.85) * du, v0 + (j + 0.5 + (rnd() - 0.5) * 0.85) * dv);
    };
    // Grundabstand aus der gewichteten Gesamtfläche (Boden dichter, Glas am dichtesten, Fassade/Vorplatz lockerer)
    const W = { floor: 1.3, wall: 1, glass: 2.6, facade: 0.55, path: 1.2, court: 0.4 };
    const aFloor = (XR - XL) * (ZF - ZB), aGlass = WINS.reduce((s, w) => s + (w.door ? 0 : (w.bw - w.aw) * (w.y1 - w.y0)), 0);
    let aWall = 0, aFac = 0;
    for (const [x1, y1, x2, y2] of WALLS) { const len = (Math.abs(x2 - x1) + Math.abs(y2 - y1)) * K, outer = x1 === 8 && x2 === 8 || x1 === 412 && x2 === 412 || y1 === 8 && y2 === 8 || y1 === 272; aWall += len * HW * (outer ? 1 : 2); if (y1 === 272) aFac += len * HW; }
    const G = { x0: PX(-45), x1: PX(465), z0: ZF + 0.012, z1: PZ(mob ? 500 : 470) }, aPath = 60 * K * (G.z1 - G.z0), aCourt = (G.x1 - G.x0) * (G.z1 - G.z0) - aPath;
    const aW = aFloor * W.floor + (aWall - aGlass) * W.wall + aGlass * W.glass + aFac * W.facade + aPath * W.path + aCourt * W.court * 0.55;
    const s0 = Math.sqrt(aW / n), sp = (k) => s0 / Math.sqrt(W[k]);
    api.spacing = s0;

    // Boden innen: Holz mit Dielen (im Flur längs, in den Räumen quer), unter den Teppichen frei
    const OAK = lin('#B98C5C'), PW = 0.075, PL = 0.95;
    const STRIPS = 6;
    for (let k = 0; k < STRIPS; k++) {
      face(XL, XR, lerp(ZB, ZF, k / STRIPS), lerp(ZB, ZF, (k + 1) / STRIPS), sp('floor'), (x, z) => {
        const px = x / K + 210, py = z / K + 140, r = roomAt(px, py);
        if (Math.hypot(x - PX(80), z - PZ(106)) < 0.9 * M || (Math.abs(x - PX(199)) < 0.35 * M && Math.abs(z - PZ(150)) < 2.9 * M)) return;
        const a = r === 5 ? z : x, c = r === 5 ? x : z, ic = Math.floor(c / PW), off = hash2(ic, 3.1) * PL, ia = Math.floor((a + off) / PL);
        const fc = c / PW - ic, fa = (a + off) / PL - ia, h = hash2(ic, ia);
        let t = 0.74 + 0.5 * h; if (fc < 0.12 || fa < 0.014) t *= 0.4;
        put(x, Y0 + 0.002, z, 0, 1, 0, [OAK[0] * t, OAK[1] * t * (0.94 + 0.12 * hash2(ia, ic)), OAK[2] * t * (0.85 + 0.3 * h)], r, 0);
      });
      yield;
    }
    // Wände: innen warmes Weiß, außen (nur Front) Putz mit dunklerem Sockel; Fenster ausgespart
    const WALLC = lin('#EDE2CF'), PUTZ = lin('#D8CAB2'), SOCK = lin('#8C8172');
    const inWin = (ax, c, along, y) => WINS.some((w) => !w.door && w.ax === ax && w.c === c && along >= w.a && along <= w.b && y >= w.y0 && y <= w.y1);
    for (const [x1, y1, x2, y2] of WALLS) {
      const vert = x1 === x2, c = vert ? x1 : y1, a0 = vert ? y1 : x1, a1 = vert ? y2 : x2;
      for (const sgn of [-1, 1]) {
        const mid = (a0 + a1) / 2, rMid = vert ? roomAt(c + sgn * 4, mid) : roomAt(mid, c + sgn * 4);
        const fac = rMid === 6;
        if (fac && !(c === 272 && !vert && sgn > 0)) continue; // Außenseiten nur an der Front
        const sW = fac ? sp('facade') : sp('wall');
        face(a0 * K, a1 * K, Y0, Y0 + HW, sW, (alK, y) => {
          const al = alK / K;
          if (inWin(vert ? 0 : 1, c, al, y)) return;
          const r = fac ? 6 : (vert ? roomAt(c + sgn * 4, al) : roomAt(al, c + sgn * 4));
          if (!fac && r === 6) return;
          const x = vert ? PX(c) + sgn * 0.004 : PX(al), z = vert ? PZ(al) : PZ(c) + sgn * 0.004;
          const v = 0.93 + 0.14 * rnd(), base = fac ? (y < Y0 + 0.2 ? SOCK : PUTZ) : WALLC, t = !fac && y < Y0 + 0.04 ? 0.5 : 1;
          put(x, y, z, vert ? sgn : 0, 0, vert ? 0 : sgn, [base[0] * v * t, base[1] * v * t, base[2] * v * t], r, 0);
        });
      }
      yield;
    }
    // Fenster: Glas (dicht), Rahmen und Sprossen
    const FRAME = lin('#EFE8DA');
    for (const w of WINS) {
      const nIn = w.ax ? [0, 0, -Math.sign(w.cw)] : [-Math.sign(w.cw), 0, 0];
      const at = (al, y, d = 0) => (w.ax ? [al, y, w.cw + nIn[2] * d] : [w.cw + nIn[0] * d, y, al]);
      if (!w.door) {
        const nb = Math.max(1, Math.round((w.bw - w.aw) / 0.42) - 1), bars = [], yb = lerp(w.y0, w.y1, 0.66);
        for (let k = 1; k <= nb; k++) bars.push(lerp(w.aw, w.bw, k / (nb + 1)));
        face(w.aw, w.bw, w.y0, w.y1, sp('glass'), (al, y) => {
          if (Math.abs(y - yb) < 0.011 || bars.some((b) => Math.abs(al - b) < 0.012)) return;
          const p = at(al, y); put(p[0], p[1], p[2], nIn[0], nIn[1], nIn[2], [1, 1, 1], w.room, 1);
        });
        const ds = sp('wall') * 0.4;
        const lineTo = (p0, p1) => { const len = Math.hypot(p1[0] - p0[0], p1[1] - p0[1], p1[2] - p0[2]), m = Math.max(1, Math.round(len / ds)); for (let i = 0; i <= m; i++) { const t = i / m; put(lerp(p0[0], p1[0], t), lerp(p0[1], p1[1], t), lerp(p0[2], p1[2], t), nIn[0], nIn[1], nIn[2], FRAME, w.room, 2); } };
        lineTo(at(w.aw, w.y0), at(w.bw, w.y0)); lineTo(at(w.aw, w.y1), at(w.bw, w.y1)); lineTo(at(w.aw, w.y0), at(w.aw, w.y1)); lineTo(at(w.bw, w.y0), at(w.bw, w.y1));
        lineTo(at(w.aw, yb), at(w.bw, yb)); bars.forEach((b) => lineTo(at(b, w.y0), at(b, w.y1)));
        // Fensterbank innen (helle Kante, fängt das Licht)
        lineTo(at(w.aw, w.y0 - 0.008, 0.03), at(w.bw, w.y0 - 0.008, 0.03));
      }
    }
    yield;
    // Vorplatz: Weg aus Platten zur Tür, links/rechts lockerer Kies, zum Rand hin auslaufend
    const SLAB = lin('#B9AD99'), KIES = lin('#84796A');
    const GS = 4;
    for (let k = 0; k < GS; k++) {
      face(G.x0, G.x1, lerp(G.z0, G.z1, k / GS), lerp(G.z0, G.z1, (k + 1) / GS), sp('path'), (x, z) => {
        const px = x / K + 210, py = z / K + 140, dx = Math.abs(px - 199);
        if (dx < 30) {
          const fx = (x - PX(169)) / 0.3, fz = (z - ZF) / 0.3, j = Math.min(fx - Math.floor(fx), fz - Math.floor(fz)) < 0.05 ? 0.45 : 1, v = 0.82 + 0.3 * hash2(Math.floor(fx), Math.floor(fz));
          put(x, Y0 + 0.002, z, 0, 1, 0, [SLAB[0] * v * j, SLAB[1] * v * j, SLAB[2] * v * j], 6, 0);
        } else {
          const keep = (W.court / W.path) * (1 - smooth(150, 255, dx)) * (1 - smooth(mob ? 420 : 390, mob ? 500 : 470, py) * 0.7);
          if (rnd() > keep) return;
          const v = 0.7 + 0.6 * rnd();
          put(x, Y0 + 0.002, z, 0, 1, 0, [KIES[0] * v, KIES[1] * v, KIES[2] * v], 6, 0);
        }
      });
      yield;
    }
    // Leuchtenkörper: flache Deckenleuchten (Flur, Training) und die Türlaterne mit Wandarm
    for (const l of LAMPS) {
      if (l.fix) for (let i = 0; i < 90; i++) { const a = rnd() * 6.283, r = Math.sqrt(rnd()) * 0.075; put(l.x + Math.cos(a) * r, l.y + 0.012, l.z + Math.sin(a) * r, 0, -1, 0, [1, 1, 1], l.room, 3); }
      if (l.cord) for (let y = l.y + 0.02; y < Y0 + HW; y += 0.011) put(l.x, y, l.z, 0, 0, 1, [0.9, 0.84, 0.72], l.room, 2);
      if (l.lantern) {
        for (let i = 0; i < 130; i++) { const u = rnd(), a = rnd() * 6.283, r = 0.026; put(l.x + Math.cos(a) * r, l.y - 0.05 + u * 0.1, l.z + Math.sin(a) * r, Math.cos(a), 0, Math.sin(a), [1, 1, 1], 6, 3); }
        for (let i = 0; i <= 14; i++) put(l.x, l.y + 0.062, lerp(ZF + 0.004, l.z, i / 14), 0, 1, 0, FRAME, 6, 2);
        for (let i = 0; i < 26; i++) { const a = (i / 26) * 6.283; put(l.x + Math.cos(a) * 0.034, l.y + 0.056, l.z + Math.sin(a) * 0.034, 0, 1, 0, FRAME, 6, 2); }
      }
    }
    yield;
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
    g.setAttribute('aCol', new THREE.Float32BufferAttribute(col, 3));
    g.setAttribute('aRoom', new THREE.Float32BufferAttribute(room, 1));
    g.setAttribute('aKind', new THREE.Float32BufferAttribute(kind, 1));
    g.setAttribute('aRnd', new THREE.Float32BufferAttribute(rr, 1));
    yield;
    const pts = new THREE.Points(g, new THREE.ShaderMaterial({
      uniforms: U, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      vertexShader: GLSL + /* glsl */`
        attribute vec3 aCol; attribute float aRoom, aKind, aRnd;
        uniform float uSurf, uSmax, uBig, uLum, uCut, uTh, uRamp, uFlat, uGain, uGlassOut; uniform vec3 uGlassIn;
        varying vec3 vCol; varying float vA;
        void main(){
          vec4 mv = viewMatrix * vec4(position, 1.); float d = -mv.z;
          vec3 V = normalize(cameraPosition - position);
          float nv = dot(normal, V);
          int ri = int(aRoom + .5);
          float rw = uRoomW[ri], keep = 1., side = 1.;
          vec3 col;
          if (aKind < .5) {            // Fläche: Dichte und Helligkeit folgen dem Licht („Licht malt den Raum“)
            vec3 E = houseLight(position, normal, aRoom);
            float lum = lLum(E) * rw;
            keep = smoothstep(uTh, uTh + uRamp, lum);
            col = aCol * E * (rw * pow(max(lum, .03), -uFlat));
            side = step(0., nv);
          } else if (aKind < 1.5) {    // Glas: von innen der Himmel, von außen das Licht des Raums
            float glare = pow(max(dot(-V, uSunDir), 0.), 12.);
            vec3 gIn = uGlassIn + uSunCol * glare * .9;
            vec3 gOut = uLampCol * (uRoomLamp[ri] * uGlassOut) + uSkyCol * .1;
            col = mix(gOut * .6, gIn * .8, step(0., nv));
            keep = .35 + .65 * smoothstep(.01, .25, lLum(col));
          } else if (aKind < 2.5) {    // Rahmen und Sprossen: immer da, nehmen das Licht der Seite an, von der man schaut
            vec3 E = houseLight(position, normal * (nv < 0. ? -1. : 1.), nv < 0. ? 6. : aRoom);
            col = aCol * (E + .035) * .8;
          } else {                     // Leuchtenkörper
            col = uLampCol * (uRoomLamp[ri] * 1.5) + aCol * .02;
          }
          float vis = step(aRnd, keep) * step(position.y, uCut) * side;
          float sI = uSurf * (aKind > .5 && aKind < 2.5 ? .8 : 1.) / d, s = clamp(sI, 1.3, uSmax);
          gl_PointSize = s * uBig;
          col *= uLum * uGain;
          vCol = col / (1. + lLum(col) * .55);                       // weiches Knie: nichts brennt aus
          vA = vis * min(1., sI * sI / (s * s)) * smoothstep(.22, .85, d) * (aKind < .5 ? .5 + .5 * abs(nv) : 1.);
          gl_Position = vis > .5 ? projectionMatrix * mv : vec4(2., 2., 2., 1.);
        }`,
      fragmentShader: /* glsl */`
        varying vec3 vCol; varying float vA;
        void main(){ float d = length(gl_PointCoord - .5); gl_FragColor = vec4(vCol, smoothstep(.5, .16, d) * vA);
          #include <colorspace_fragment>
        }`,
    }));
    pts.frustumCulled = false; pts.renderOrder = 1.5; pts.name = 'flaechen';
    scene.add(pts);
    api.surf = pts; api.count = kind.length;
    return pts;
  };

  // ---------- Lampen-Schein: weiche additive Scheiben (kleine Vierecke, zur Kamera gedreht) ----------
  {
    const p = [], q = [], li = [], idx = [];
    LAMPS.forEach((l, j) => {
      const b = p.length / 3; const gy = l.lantern || l.cone === 0 ? l.y : l.y + (l.fix ? 0 : 0.045);
      for (const [a, c] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { p.push(l.x, gy, l.z); q.push(a, c); li.push(j); }
      idx.push(b, b + 1, b + 2, b, b + 2, b + 3);
    });
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3));
    g.setAttribute('aQ', new THREE.Float32BufferAttribute(q, 2));
    g.setAttribute('aI', new THREE.Float32BufferAttribute(li, 1));
    g.setIndex(idx);
    const glow = new THREE.Mesh(g, new THREE.ShaderMaterial({
      uniforms: U, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
      vertexShader: /* glsl */`
        attribute vec2 aQ; attribute float aI; uniform vec4 uLampP[${NL}]; uniform float uLum, uCut; varying vec2 vQ; varying float vK;
        void main(){ int j = int(aI + .5); vK = uLampP[j].x * uLum * step(position.y, uCut + .2); vQ = aQ;
          vec4 mv = viewMatrix * vec4(position, 1.); mv.xy += aQ * uLampP[j].w; gl_Position = projectionMatrix * mv; }`,
      fragmentShader: /* glsl */`
        uniform vec3 uLampCol; varying vec2 vQ; varying float vK;
        void main(){ float r2 = dot(vQ, vQ); if (r2 > 1. || vK < .003) discard;
          float g = exp(-r2 * 30.) * .34 + exp(-r2 * 4.) * .2 * (1. - r2);
          gl_FragColor = vec4(uLampCol * .58, g * vK);
          #include <colorspace_fragment>
        }`,
    }));
    glow.frustumCulled = false; glow.renderOrder = 3.5; glow.name = 'schein';
    scene.add(glow);
  }

  // ---------- Lichtbahnen: Staub, der nur im Sonnenstrahl der Fenster liegt (Lage folgt der Sonnenrichtung) ----------
  {
    const per = mob ? 220 : 560, n = per * NW, a = new Float32Array(n * 4), r = new Float32Array(n * 3), p = new Float32Array(n * 3);
    const rnd = mulberry(77);
    for (let i = 0; i < n; i++) { a.set([Math.floor(i / per), rnd(), rnd(), Math.pow(rnd(), 0.8)], i * 4); r.set([rnd(), rnd(), rnd()], i * 3); }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(p, 3));
    g.setAttribute('aB', new THREE.BufferAttribute(a, 4));
    g.setAttribute('aR', new THREE.BufferAttribute(r, 3));
    const beams = new THREE.Points(g, new THREE.ShaderMaterial({
      uniforms: { ...U, uPix: shared.uPix }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      vertexShader: GLSL + /* glsl */`
        attribute vec4 aB; attribute vec3 aR; uniform vec4 uWinBox[NW]; uniform float uPix, uLum, uCut; varying vec3 vC; varying float vA;
        void main(){
          int i = int(aB.x + .5); vec4 w = uWin[i], b = uWinB[i], bx = uWinBox[i]; bool xp = b.x < .5;
          float al = mix(w.y, w.z, aB.y), y = mix(b.y, b.z, aB.z);
          vec3 p0 = xp ? vec3(w.x, y, al) : vec3(al, y, w.x);
          float inw = xp ? -uSunDir.x * -sign(w.x) : -uSunDir.z * -sign(w.x);   // Anteil der Strahlrichtung nach innen
          float tF = (p0.y - ${F(Y0)}) / max(uSunDir.y, .03), tW = (xp ? bx.z - bx.x : bx.w - bx.y) / max(inw, .02);
          float t = aB.w * min(min(tF, tW), 4.5);
          vec3 p = p0 - uSunDir * t;
          p += vec3(sin(uTimeL * (.11 + aR.x * .16) + aR.y * 6.283), sin(uTimeL * (.08 + aR.y * .12) + aR.z * 6.283), cos(uTimeL * (.1 + aR.z * .15) + aR.x * 6.283)) * .035;
          float ok = step(.02, inw) * step(bx.x, p.x) * step(p.x, bx.z) * step(bx.y, p.z) * step(p.z, bx.w) * step(${F(Y0)}, p.y) * step(p.y, uCut) * b.w;
          vec4 mv = viewMatrix * vec4(p, 1.); float d = -mv.z;
          float ph = .3 + .7 * pow(max(dot(normalize(p - cameraPosition), uSunDir), 0.), 3.);   // gegen das Licht gesehen heller
          float tw = .55 + .45 * sin(uTimeL * (.6 + aR.z) + aR.x * 40.);
          vC = uSunCol;
          vA = ok * uRoomW[int(w.w + .5)] * (.16 + .34 * aR.y) * ph * tw * uLum * smoothstep(.12, .5, d) * (1. - smoothstep(5., 9., d)) * (1. - aB.w * .45);
          gl_PointSize = clamp(uPix * (1. + aR.y * 1.5) * 2.2 / d, 1., 4.5);
          gl_Position = ok > .5 && uSunCol.r > .01 ? projectionMatrix * mv : vec4(2., 2., 2., 1.);
        }`,
      fragmentShader: /* glsl */`varying vec3 vC; varying float vA; void main(){ float d = length(gl_PointCoord - .5); gl_FragColor = vec4(vC, smoothstep(.5, .08, d) * vA);
        #include <colorspace_fragment>
      }`,
    }));
    beams.frustumCulled = false; beams.renderOrder = 4.2; beams.name = 'lichtbahnen';
    scene.add(beams);
    api.beams = n;
  }

  // ---------- Dampf über der Tasse auf dem Tresen (Gastlichkeit) ----------
  {
    const n = 40, p = new Float32Array(n * 3), r = new Float32Array(n * 3), rnd = mulberry(5);
    for (let i = 0; i < n; i++) { p.set([PX(55), Y0 + 1.215 * M, PZ(50)], i * 3); r.set([rnd(), rnd(), rnd()], i * 3); }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(p, 3));
    g.setAttribute('aR', new THREE.BufferAttribute(r, 3));
    const steam = new THREE.Points(g, new THREE.ShaderMaterial({
      uniforms: { ...U, uPix: shared.uPix }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      vertexShader: GLSL + /* glsl */`
        attribute vec3 aR; uniform float uPix, uLum, uCut; varying vec3 vC; varying float vA;
        void main(){
          float ph = fract(uTimeL * (.07 + aR.x * .05) + aR.y);
          float sw = .006 + ph * .022;
          vec3 p = position + vec3(sin(ph * 5.5 + aR.z * 6.283) * sw + (aR.x - .5) * .012, ph * .2, cos(ph * 4.4 + aR.y * 6.283) * sw + (aR.z - .5) * .012);
          vec3 E = houseLight(p, vec3(0., 1., 0.), 0.);
          vec4 mv = viewMatrix * vec4(p, 1.); float d = -mv.z;
          float a = sin(ph * 3.14159);
          vC = vec3(.95, .9, .82) * (E * 1.1 + .06);
          vA = a * a * .42 * uLum * smoothstep(.1, .35, d) * step(p.y, uCut);
          gl_PointSize = clamp(uPix * (1.6 + ph * 3.2) * 2.6 / d, 1., 8.);
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: /* glsl */`varying vec3 vC; varying float vA; void main(){ float d = length(gl_PointCoord - .5); gl_FragColor = vec4(vC, smoothstep(.5, 0., d) * vA);
        #include <colorspace_fragment>
      }`,
    }));
    steam.frustumCulled = false; steam.renderOrder = 4.4; steam.name = 'dampf';
    scene.add(steam);
  }

  // ---------- je Bild ----------
  const roomIn = [0, 0, 0, 0, 0, 0, 0], roomW = [0.6, 0.6, 0.6, 0.6, 0.6, 0.6, 1];
  let inkKey = '';
  /** dt Sekunden · pos Kamera (Vector3) · door 0…1 offen · f Pixel je Einheit bei Abstand 1 · still = Bewegung steht (Pause/reduziert) */
  api.update = (dt, { pos, door, f, still }) => {
    const k = jump ? 1 : 1 - Math.exp(-dt * 2.2); jump = false;
    for (const key in want) { const a = cur[key], b = want[key]; for (let i = 0; i < a.length; i++) a[i] += (b[i] - a[i]) * k; }
    const dl = Math.hypot(cur.dir[0], cur.dir[1], cur.dir[2]) || 1;
    LU.uSunDir.value.set(cur.dir[0] / dl, cur.dir[1] / dl, cur.dir[2] / dl);
    LU.uSunCol.value.fromArray(cur.sunCol); LU.uSkyCol.value.fromArray(cur.sky); LU.uAmbCol.value.fromArray(cur.amb);
    LU.uGlassIn.value.fromArray(cur.glassIn); LU.uGlassOut.value = cur.glassOut[0]; LU.uLineTint.value.fromArray(cur.lineTint);
    // Raum der Kamera: der eigene Raum ist voll „gemalt“, die anderen schimmern durch
    const cr = roomOfWorld(pos.x, pos.z), kr = k === 1 ? 1 : 1 - Math.exp(-dt * 2.6);
    for (let r = 0; r < 7; r++) {
      roomIn[r] += ((r === cr ? 1 : 0) - roomIn[r]) * kr;
      const w = r === cr ? 1 : cr === 6 ? 0.62 : r === 6 ? 0.75 : r === 5 || cr === 5 ? 0.6 : 0.42;
      roomW[r] += (w * (r === 6 ? cur.outW[0] : 1) - roomW[r]) * kr;
      LU.uRoomW.value[r] = roomW[r]; LU.uRoomLamp.value[r] = 0;
    }
    // Lampen: Grundstärke aus der Tageszeit; schläft das Haus, geht das Licht leise an, wo man gerade steht
    LAMPS.forEach((l, j) => {
      let s = cur.lampK[j];
      if (!l.lantern) s = Math.max(s, cur.sleep[0] * 0.62 * roomIn[l.room]);
      LU.uLampP.value[j].x = s; LU.uRoomLamp.value[l.room] = Math.max(LU.uRoomLamp.value[l.room], s);
    });
    LU.uWinB.value[NW - 1].w = clamp(door);
    LU.uSurf.value = f * (api.spacing || 0.03) * 0.8;
    if (!still) LU.uTimeL.value += dt;
    const ink = cur.ink.map((v) => Math.round(v)); api.ink = ink; api.tint = cur.tint;
    LU.uCoreCol.value.set(...ink.map((v) => Math.pow(v / 255 * 1.32, 2.2)));
    const key = ink.join(',');
    if (key !== inkKey) { inkKey = key; document.documentElement.style.setProperty('--ink-rgb', key); document.documentElement.style.setProperty('--ink', `rgb(${key})`); api.inkChanged = true; }
  };
  api.info = () => ({ zeit: api.zeit, sonne: api.sun || null, ort: ORT, punkte: api.count, lichtbahnen: api.beams, abstand: api.spacing });
  return api;
}
