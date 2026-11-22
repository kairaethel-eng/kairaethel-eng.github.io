// Idee A · „Bühne“: die Manuthera als gestochene Partikel-Liege in 3D (wie die Wirbelsäule in Kapitel 03:
// gleichmäßige Punkte, dunkler Kern, Licht und Schatten). Darauf eine liegende Figur in Bauchlage, die
// Wirbelsäule schimmert durch. Brust- und Beckenteil zeigen nacheinander Traktion, Flexion, Seitneigung,
// Rotation. Schematisch, keine Herstellerzeichnung.
// 20.11.2026 (Auftrag Kai: Stil der Figur und der Wirbelsäule auf die Manuthera): Punkte geordnet statt gestreut (Zeilen über die
// Oberfläche, gleicher Abstand, jede zweite Zeile versetzt – ../shared/raster.js), Kantenlicht wie bei der Figur (Fläche ruhig,
// Rand hell), die Figur aus einem Guss (Rumpf mit wechselndem Querschnitt, Arme und Beine als Röhren statt einzelner Kugeln),
// Antwort unter Maus/Finger, Auftritt über die Zeit: feiner Staub sammelt sich vom Kopf- zum Fußende hinter der Bernstein-Linie.
import * as THREE from 'three';
import { stage, FRAG, COL, C, reduced, dragYaw, ease, damp, isDesktop, smooth } from './common.js';
import { orderedGen, coreOfRasterGen, coreMaterial, stipSize, DEFORM } from './stipple.js';
import { manuFormen, PIV_U, PIV_L, PIV_K } from './formen.js';
import { pointer, PTR_GLSL } from '../shared/zeiger.js';
import { runSync } from '../shared/slice.js';

// 22.11.2026 (Kai: „Kopf- und Mittelteil sollen sich auch bewegen“, recherchiert nach den Angaben zur Lojer Manuthera 242): Kopfteil
// (HWS: Flexion/Extension, Seitneigung, Traktion), Brustteil (BWS: vertikal, horizontal, Traktion, Drehung) und Beckenteil (LWS: Flexion,
// Seitneigung, Rotation, Traktion) bewegen sich je Behandlung nacheinander – Abschnitt für Abschnitt, eine Bewegung zur Zeit. Das kurze
// Mittelteil ist wie bei der echten Liege der feste Bezug.
export const MODES = [
  { id: 'traktion', name: 'Traktion', txt: 'Sanfter Zug in Längsrichtung: Kopf-, Brust- und Beckenteil gleiten nacheinander auseinander – Hals-, Brust- und Lendenwirbelsäule bekommen Raum.' },
  { id: 'flexion', name: 'Flexion', txt: 'Kopf-, Brust- und Beckenteil neigen sich nacheinander nach unten. Die Wirbelsäule beugt sich, genau dosiert und Abschnitt für Abschnitt.' },
  // 23.11.2026 (Kai: „mir fehlt die Extension, Kopf und Beine“ → „Go A“): Kopfteil hebt sich (HWS), danach das Beckenteil mit den Beinen (LWS)
  { id: 'extension', name: 'Extension', txt: 'Erst hebt sich das Kopfteil, dann das Beckenteil mit den Beinen. Hals- und Lendenwirbelsäule strecken sich, ruhig und genau dosiert.' },
  { id: 'seit', name: 'Seitneigung', txt: 'Kopf-, Brust- und Beckenteil schwenken nacheinander zur Seite. Seitneigung in entspannter Lage, ohne dass Sie selbst Kraft aufwenden.' },
  { id: 'rot', name: 'Rotation', txt: 'Brust- und Beckenteil drehen sich gegeneinander um die Längsachse. So lässt sich die Wirbelsäule gezielt in die Drehung führen.' },
];

// Segmente: 0 fest (Mittelteil, Gestell, Armstützen) · 1 Brustteil · 2 Beckenteil · 3 Kopfteil (hängt am Brustteil)
const FOV = 30, NSEG = 4;

// Als Generator (Zeitscheiben, A1 4.11.2026); initA() baut am Stück.
export const initA = (canvas, ui) => runSync(initAGen(canvas, ui));
export function* initAGen(canvas, ui) {
  const st = stage(canvas, { fov: FOV, transparent: !!(ui && ui.transparent) });
  if (!st) return null;
  const desk = isDesktop();

  // Segment-Zuordnung: 0 fest (Mittelteil, Gestell, Armstützen), 1 Brustteil, 2 Beckenteil, 3 Kopfteil
  let PL = PIV_L; // echte Figur: Gelenk zwischen L4 und L5 (formen.js PIV_L_ECHT)
  const K0 = -1.97, K1 = -1.66; // Übergang Kopf ↔ Brustteil (Schädelbasis bis C7)
  const blend = (b) => (x) => {
    if (x < PIV_U - b) return [1, 1, 0];
    if (x < PIV_U + b) return [1, 0, smooth(PIV_U - b, PIV_U + b, x)];
    if (x < PL - b) return [0, 0, 0];
    if (x < PL + b) return [0, 2, smooth(PL - b, PL + b, x)];
    return [2, 2, 0];
  };
  // echte Figur (Kai 21.11.2026 abends, „Go A“): Übergänge mit eigenen Grenzen – oben schmal um das Brustgelenk (T10–T12), unten weich
  // über die ganze Lende bis vor die Hüfte (L1 … Kreuzbein). Haut und Wirbel teilen dieselben Zonen: die Haut über der Lende biegt sich mit
  // der Wirbelsäule, Oberkörper und Becken mit Beinen bleiben fest (vorher 0,1 breit → Knick an der Taille, Beine wirkten weggeklappt).
  // 22.11.2026: Kopfteil eigenes Segment – die Halswirbelsäule (C1 … C7) verteilt seine Bewegung zwischen Kopf und Brustteil
  const zone = (u0, u1, l0, l1) => (x) => {
    if (x < K0) return [3, 3, 0];
    if (x < K1) return [3, 1, smooth(K0, K1, x)];
    if (x < u0) return [1, 1, 0];
    if (x < u1) return [1, 0, smooth(u0, u1, x)];
    if (x < l0) return [0, 0, 0];
    if (x < l1) return [0, 2, smooth(l0, l1, x)];
    return [2, 2, 0];
  };
  const ZONE_ECHT = zone(-1.05, -0.8, -0.78, -0.1);
  const mapX = (fn) => (v) => { const s = fn(v.x); return { la: v, lb: v, a: s[0], b: s[1], w: s[2] }; };
  const F = mapX(() => [0, 0, 0]), UP = mapX(() => [1, 1, 0]), LO = mapX(() => [2, 2, 0]), KO = mapX(() => [3, 3, 0]);
  // Arme: Schulter gehört zum Brustteil, Unterarm liegt auf der festen Armstütze
  const mapArm = (v) => ({ la: v, lb: v, a: 1, b: 0, w: smooth(0.2, -0.12, v.y) });
  const noDown = (n) => n.y > -0.5;
  // Formen aus einer Quelle (./formen.js, auch für das kleine Leistungs-Motiv); hier bekommt jedes Teil seine Segment-Zuordnung
  const echt = !!(ui && ui.figur && ui.figur['figur/koerper']);
  // 21.11.2026 (Kai: „nicht der ganze Körper streckt sich, nur die innere Wirbelsäule“): echte Figur liegt als feste Blöcke auf den
  // Liegeteilen; nur die Haut über der Lende geht weich mit der Wirbelsäule mit (ZONE_ECHT oben)
  const bb = mapX(echt ? ZONE_ECHT : blend(0.3));
  const MAP = { UP, F, LO, KO, BB: bb, ARM: mapArm };
  const SPL = desk ? 0.0235 : 0.032; // Punktabstand der Liege (20.11.: feiner – Kai: „noch detailliertere Ansicht“)
  const { parts: FORM, SPB, wirbel, wirbelNetz, WSP, PL: plF } = manuFormen(SPL, { echt: ui && ui.figur });
  if (plF !== undefined) PL = plF;
  // echte Figur: auch die nach unten zeigenden Flanken behalten (sonst Löcher, Kai 21.11.) – nur was auf dem Polster aufliegt, entfällt
  const keepFig = (n, v) => n.y > -0.5 || v.y > 0.06;
  const parts = FORM.map((q) => ({ r: q.r, kind: q.kind, map: MAP[q.seg], keep: q.kind === 3 ? null : echt && q.kind === 2 ? keepFig : noDown, grp: q.grp }));

  yield;
  const pts = yield* orderedGen(parts, SPB);
  yield;
  const core = yield* coreOfRasterGen(parts);

  const M = Array.from({ length: NSEG }, () => new THREE.Matrix4());
  const U = {
    uM: { value: M }, uStip: { value: 1 }, uMaxSize: { value: 6 }, uCut: { value: reduced ? 99 : -3.2 }, uInset: { value: 0.008 },
    uHi: { value: new THREE.Vector4() }, uTime: { value: 0 }, uPix: { value: 1 }, uSpineHi: { value: new THREE.Vector2() },
    cCore: { value: C('#0E1C22') }, cBone: { value: C('#EDE5D3') }, cDeep: { value: C('#44788E') }, cFrame: { value: C('#2F5B6D') }, cFrameHi: { value: C('#7FAFC2') }, cBody: { value: C('#3F7FAE') }, cBodyHi: { value: C('#C4E1F5') },
    uPtr: { value: new THREE.Vector4(0, 0, 0.1, 0) }, uAsp: { value: 1 }, uSpB: { value: 0.78 }, uMove: { value: 0 }, uWsz: { value: 0.8 },
    cBlue: { value: COL.blue }, cAmber: { value: COL.amber }, cGlut: { value: C('#F0603A') },
  };
  const coreMesh = new THREE.Mesh(core, coreMaterial(U, NSEG));
  // Punkte wie die Figur in Kapitel 01: Fläche ruhig, Rand hell (Kantenlicht), gestochene Scheiben; etwas Licht von oben hält die Form
  // lesbar. Vor der Bernstein-Linie (uCut, läuft beim Auftritt vom Kopf- zum Fußende) schweben die Punkte als feiner Staub und setzen sich.
  const ptsMesh = new THREE.Points(pts.geo, new THREE.ShaderMaterial({
    uniforms: U,
    vertexShader: DEFORM(NSEG) + /* glsl */`
      attribute vec3 aRnd;
      uniform float uStip, uMaxSize, uCut, uAsp, uSpB, uMove; uniform vec4 uPtr; uniform vec4 uHi;
      uniform vec3 cAmber, cBone, cDeep, cFrame, cFrameHi, cBody, cBodyHi;
      varying vec3 vCol; varying float vSize;
      ` + PTR_GLSL + /* glsl */`
      void main(){
        vec3 p = deformP(position, pos2), n = deformN(normal);
        float lam = max(dot(n, normalize(LDIR)), 0.);
        float rim = pow(1. - clamp(dot(n, normalize(cameraPosition - p)), 0., 1.), 1.5);
        vec3 deep = aKind < .5 ? mix(cDeep, cBone, .55) : aKind < 1.5 ? cFrame : aKind < 2.5 ? cBody : cBone;
        vec3 hi = aKind < .5 ? cBone : aKind < 1.5 ? cFrameHi : aKind < 2.5 ? cBodyHi : cBone;
        vec3 col = mix(deep, hi, .2 + .8 * rim) * (aKind < .5 ? .5 + .5 * lam : .62 + .38 * lam);
        if (aKind > 1.5 && aKind < 2.5) col *= mix(1., .42, uMove); // Figur tritt zurück, solange sich die Wirbelsäule bewegt
        int sa = int(aSegA + .5);
        float hl = sa == 1 ? uHi.y : sa == 2 ? uHi.z : sa == 3 ? uHi.w : 0.;
        if (aKind < .5) col = mix(col, cAmber * (.45 + .85 * lam), hl * .28);
        float naht = step(2.5, aKind);
        if (naht > .5) { col = mix(cBone, cDeep, .25); if (aSegA > .5 || aSegB > .5) col = mix(col, cAmber, hl * .5); }
        float sz = naht > .5 ? .72 / uSpB : aKind > 1.5 ? 1. : aKind > .5 ? 1.3 / uSpB : 1. / uSpB; // Scheibe passend zum Punktabstand des Teils
        // Auftritt: vor der Linie feiner Staub (klein, gedämpft), der sich beim Näherkommen setzt
        float dx = p.x - uCut, dust = smoothstep(0., .55, dx), far = smoothstep(.9, 2.2, dx);
        p += normalize(aRnd - .5 + 1e-4) * dust * (.18 + aRnd.z * .42);
        float g = exp(-pow(dx * 7., 2.));
        col = mix(col, cAmber * 1.2, g * .8) * mix(1., .5, dust);
        vec4 mv = viewMatrix * vec4(p, 1.);
        gl_Position = projectionMatrix * mv;
        float pk = ptrK() * (1. - dust);
        col = mix(col, vec3(1., .95, .86), pk * .7);
        vCol = col;
        vSize = clamp(uStip * sz * (1. + g * .3) * mix(1., .42, dust) * (1. + pk * .45) / -mv.z, 1., uMaxSize) * (1. - far) * step(aRnd.x, 1. - dust * .55);
        gl_PointSize = vSize;
      }`,
    fragmentShader: /* glsl */`
      varying vec3 vCol; varying float vSize;
      void main(){
        float d = length(gl_PointCoord - .5);
        if (d > .5 || vSize < .5) discard;
        gl_FragColor = vec4(vCol * (1. - smoothstep(.3, .5, d) * .35), 1.);
        #include <colorspace_fragment>
      }`,
  }));
  [coreMesh, ptsMesh].forEach((o) => { o.frustumCulled = false; st.scene.add(o); });

  // ---------- Wirbelsäule: schimmert durch den Körper ----------
  const SP = [], SW = [], SA = [], SB = [];
  const sb = blend(0.24);
  const pushS = (x, y, z) => { const s = sb(x); SP.push(x, y, z); SA.push(s[0]); SB.push(s[1]); SW.push(s[2]); };
  const LV = 24;
  // Perlenkette: je Wirbel ein Kern + Dornfortsatz, dazwischen feine Bandscheiben-Punkte
  const SZ = [];
  if (wirbelNetz && wirbelNetz.length) { /* echte Wirbel: eigene Punkt-Grafik weiter unten, keine Perlenkette */ } else if (wirbel) {
    // echte Figur (21.11.2026): Wirbelkörper C1 … L5 und Kreuzbein aus BodyParts3D (assets/manu-figur.bin), Dornfortsatz zum Rücken hin
    for (let i = 0; i < wirbel.length; i++) {
      const [x, y, z] = wirbel[i], f = i / (wirbel.length - 1), last = i === wirbel.length - 1;
      pushS(x, y, z); SZ.push(last ? 2.6 : 1.5 + f * 1.2);
      if (!last) { pushS(x + 0.01, y + 0.07 + f * 0.03, z); SZ.push(0.8); const n = wirbel[i + 1]; pushS((x + n[0]) / 2, (y + n[1]) / 2, (z + n[2]) / 2); SZ.push(0.55); }
    }
  } else for (let i = 0; i < LV; i++) {
    const f = i / (LV - 1), x = -1.76 + f * 2.06, y = 0.33 + Math.sin(f * Math.PI * 2) * 0.02;
    pushS(x, y, 0); SZ.push(1.6 + f * 1.1);
    pushS(x + 0.01, y + 0.06, 0); SZ.push(0.8);
    if (i < LV - 1) { pushS(x + 0.043, y, 0); SZ.push(0.55); }
  }
  if (!wirbel) for (let j = 0; j < 5; j++) { const u = j / 4; pushS(0.36 + u * 0.24, 0.32 - u * 0.03, 0); SZ.push(2.6 - u * 1.4); }
  const sg = new THREE.BufferGeometry();
  sg.setAttribute('position', new THREE.Float32BufferAttribute(SP, 3));
  sg.setAttribute('pos2', new THREE.Float32BufferAttribute(SP, 3));
  sg.setAttribute('normal', new THREE.Float32BufferAttribute(SP.map(() => 0), 3));
  sg.setAttribute('aSegA', new THREE.Float32BufferAttribute(SA, 1));
  sg.setAttribute('aSegB', new THREE.Float32BufferAttribute(SB, 1));
  sg.setAttribute('aW', new THREE.Float32BufferAttribute(SW, 1));
  sg.setAttribute('aKind', new THREE.Float32BufferAttribute(SZ, 1));
  const spine = new THREE.Points(sg, new THREE.ShaderMaterial({
    uniforms: U, transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending, fragmentShader: FRAG,
    vertexShader: DEFORM(NSEG) + /* glsl */`
      uniform float uPix, uCut; uniform vec2 uSpineHi; uniform vec3 cBone, cAmber;
      varying vec3 vCol; varying float vA;
      void main(){
        vec3 p = deformP(position, pos2);
        vec4 mv = viewMatrix * vec4(p, 1.); gl_Position = projectionMatrix * mv;
        float g = exp(-pow((p.x - uSpineHi.x) * 2.4, 2.)) * uSpineHi.y;
        gl_PointSize = uPix * aKind * (1. + g * .5) * 30. / -mv.z;
        vCol = mix(cBone, cAmber, g);
        vA = (.42 + g * .5) * step(p.x, uCut);
      }`,
  }));
  spine.frustumCulled = false; st.scene.add(spine);

  // ---------- echte Wirbelsäule (21.11.2026, Kai: „nur die innere Wirbelsäule bewegen, deutlicher erkennbar“) ----------
  // Wirbel C1 … L5 und Kreuzbein aus BodyParts3D als feine geordnete Punkte mit Kantenlicht. Jeder Wirbel folgt als Ganzes dem Liegeteil
  // unter ihm; über die Lendenwirbel (und den Übergang Brust/Lende) verteilt sich die Bewegung – so biegt, streckt und dreht sich nur die
  // Wirbelsäule. Sie wird nach allem anderen gezeichnet (Tiefe vorher gelöscht): immer sichtbar wie im Röntgenbild, Rückseiten entfallen.
  if (wirbelNetz && wirbelNetz.length) {
    const sbW = ZONE_ECHT;
    const sParts = wirbelNetz.map((w, i) => {
      const Pw = w.r.pts; let cx = 0; for (let k = 0; k < Pw.length; k += 7) cx += Pw[k]; cx /= Math.max(1, Pw.length / 7);
      const sg = sbW(cx);
      return { r: w.r, kind: i, map: (v) => ({ la: v, lb: v, a: sg[0], b: sg[1], w: sg[2] }), keep: null, grp: 20 + i };
    });
    yield;
    const spw = yield* orderedGen(sParts, WSP);
    const real = new THREE.Points(spw.geo, new THREE.ShaderMaterial({
      uniforms: U,
      vertexShader: DEFORM(NSEG) + /* glsl */`
        uniform float uStip, uMaxSize, uCut, uMove, uWsz, uTime; uniform vec3 cBone, cAmber, cDeep, cGlut;
        varying vec3 vCol; varying float vSize;
        void main(){
          vec3 p = deformP(position, pos2), n = deformN(normal);
          float fa = dot(n, normalize(cameraPosition - p)), lam = max(dot(n, normalize(LDIR)), 0.);
          float rim = pow(1. - clamp(fa, 0., 1.), 1.5);
          vec3 col = mix(mix(cDeep, cBone, .7), cBone, .35 + .65 * rim) * (.7 + .3 * lam);
          // 22.11.2026 (Kai: Bereich der Wirbelsäule, den die Liege bewegt, sichtbar machen – „Go A“): Bernstein so stark, wie der Wirbel
          // gerade bewegt wird. Biegung = Abstand der Lagen, die die beiden Liegeteile ihm geben (nur in den Übergängen, am stärksten
          // in ihrer Mitte); dazu schwächer die Fahrt als Ganzes mit einem Teil. Der Rest der Säule tritt während der Bewegung zurück.
          int ia = int(aSegA + .5), ib = int(aSegB + .5);
          vec3 qa = (uM[ia] * vec4(position, 1.)).xyz, qb = (uM[ib] * vec4(position, 1.)).xyz;
          float bend = clamp(length(qa - qb) * 28., 0., 1.) * (.45 + .55 * sin(3.14159 * clamp(aW, 0., 1.)));
          float ride = clamp(length(p - position) * 9., 0., 1.) * .45;
          float g = smoothstep(.04, .9, max(bend, ride));
          // 23.11.2026 (Kai: „eher rötlich, damit es noch besser auffällt“ → „Go A“): Verlauf nach Stärke – leicht bewegt Bernstein, die am
          // stärksten bewegte Stelle glüht Rot-Orange und atmet ruhig (≈ 2 s), solange sich die Liege bewegt
          col *= mix(1., .62, uMove * (1. - g));
          vec3 hot = mix(cAmber, cGlut, smoothstep(.35, .95, g));
          float breathe = .5 + .5 * sin(uTime * 3.1);
          col = mix(col, hot * (1. + .35 * lam) * (1. + .18 * breathe * g * uMove), g);
          vec4 mv = viewMatrix * vec4(p, 1.); gl_Position = projectionMatrix * mv;
          vCol = col * mix(.95, 1.1, uMove);
          vSize = clamp(uStip * uWsz * (1. + .14 * g) / -mv.z, 1., uMaxSize) * step(-.12, fa) * step(p.x, uCut);
          gl_PointSize = vSize;
        }`,
      fragmentShader: /* glsl */`
        varying vec3 vCol; varying float vSize;
        void main(){
          float d = length(gl_PointCoord - .5);
          if (d > .5 || vSize < .5) discard;
          gl_FragColor = vec4(vCol * (1. - smoothstep(.3, .5, d) * .35), 1.);
          #include <colorspace_fragment>
        }`,
    }));
    U.uWsz.value = (WSP / SPB) * 1.55; // Punktgröße passend zum feineren Abstand, leicht überlappend → geschlossene Wirbel
    real.renderOrder = 10; real.frustumCulled = false;
    real.onBeforeRender = (r) => r.clearDepth();
    st.scene.add(real);
  }

  // ---------- Bewegungs-Anzeige (Bernstein, fest im Raum) ----------
  const IP = [], IM = [], IS = [];
  const ind = (mode, fn, cnt) => { for (let i = 0; i < cnt; i++) { const s = i / (cnt - 1), p = fn(s); IP.push(p[0], p[1], p[2]); IM.push(mode); IS.push(s); } };
  // echte Figur (21.11.2026): ihre Füße hängen über das Fußende → Zug- und Seitneigungs-Anzeige laufen unter den Füßen durch
  const yInd = wirbel ? -0.56 : -0.08;
  ind(0, (s) => [2.32 + s * 0.9, yInd, 0], 90);
  ind(0, (s) => [3.22 - Math.abs(s - 0.5) * 0.3, yInd, (s - 0.5) * 0.36], 30);
  ind(1, (s) => { const a = -s * 0.5, r = 2.38; return [PL + Math.cos(a) * r, Math.sin(a) * r - 0.02, 0.72]; }, 90);
  ind(2, (s) => { const a = s * 0.32, r = 2.38; return [PL + Math.cos(a) * r, yInd, -Math.sin(a) * r]; }, 90);
  ind(3, (s) => { const a = Math.PI / 2 + (s - 0.25) * 1.3, r = 0.78; return [2.36, Math.sin(a) * r - 0.08, Math.cos(a) * r]; }, 90);
  const ig = new THREE.BufferGeometry();
  ig.setAttribute('position', new THREE.Float32BufferAttribute(IP, 3));
  ig.setAttribute('aMode', new THREE.Float32BufferAttribute(IM, 1));
  ig.setAttribute('aS', new THREE.Float32BufferAttribute(IS, 1));
  const IU = { uTime: U.uTime, uPix: U.uPix, uModeW: { value: new THREE.Vector4() }, cAmber: U.cAmber };
  const indPts = new THREE.Points(ig, new THREE.ShaderMaterial({
    uniforms: IU, transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending, fragmentShader: FRAG,
    vertexShader: /* glsl */`
      attribute float aMode, aS; uniform float uTime, uPix; uniform vec4 uModeW; uniform vec3 cAmber;
      varying vec3 vCol; varying float vA;
      void main(){
        float w = aMode < .5 ? uModeW.x : aMode < 1.5 ? uModeW.y : aMode < 2.5 ? uModeW.z : uModeW.w;
        vec4 mv = modelViewMatrix * vec4(position, 1.);
        gl_Position = projectionMatrix * mv;
        float flow = pow(fract(aS - uTime*.45), 6.);
        gl_PointSize = uPix * (1.1 + flow*1.8) * 20. / -mv.z;
        vCol = mix(cAmber, vec3(1., .93, .8), flow*.5);
        vA = w * (.35 + flow*.9);
      }`,
  }));
  indPts.frustumCulled = false; indPts.visible = !wirbel; st.scene.add(indPts);

  // ---------- Kamera & Bewegung ----------
  const cam = { yaw: 0, yawTarget: 0, lastUser: -1e9, dragging: false };
  dragYaw(canvas, cam);
  const target = new THREE.Vector3(wirbel ? 0.42 : 0.1, -0.5, 0); // echte Figur: Hände und Füße reichen über beide Enden der Liege
  const SPEED = reduced ? 0.5 : 1;
  // Ablauf je Behandlung (22.11.2026): die beteiligten Liegeteile setzen nacheinander ein (Kopf → Brust → Becken, je DUR.step),
  // halten gemeinsam, kehren gemeinsam ruhig zurück. Gerechnete Figur (Rückfall): wie bisher Brust- und Beckenteil zugleich.
  const DUR = echt ? { step: 1.45, hold: 1.3, out: 1.7, rest: 0.8 } : { step: 1.7, hold: 1.5, out: 1.5, rest: 0.7 };
  // beteiligte Teile je Behandlung: 3 Kopf · 1 Brust · 2 Becken
  const NM = MODES.length; // 0 Traktion · 1 Flexion · 2 Extension · 3 Seitneigung · 4 Rotation
  const SEQ = echt ? [[3, 1, 2], [3, 1, 2], [3, 2], [3, 1, 2], [1, 2]] : [[1, 2], [1, 2], [1, 2], [1, 2], [1, 2]];
  const inDur = (m) => (echt ? SEQ[m].length : 1) * DUR.step;
  const cycleOf = (m) => inDur(m) + DUR.hold + DUR.out + DUR.rest;
  let mode = 0, phase = 0, auto = true, scanT = reduced ? 1 : 0;
  const cur = Array.from({ length: NM }, () => new Float32Array(4)); // [Behandlung][Segment] 0 … 1
  const select = (i, user) => { mode = i; phase = 0; if (user) { auto = false; cam.lastUser = performance.now(); } ui && ui.onMode && ui.onMode(i); };
  select(0);

  const tmp = new THREE.Matrix4(), T1 = new THREE.Matrix4(), T2 = new THREE.Matrix4(), eu = new THREE.Euler();
  const pivotMat = (out, px, rx, ry, rz, tx) => {
    T1.makeTranslation(px + tx, 0, 0);
    tmp.makeRotationFromEuler(eu.set(rx, ry, rz, 'XYZ'));
    T2.makeTranslation(-px, 0, 0);
    out.copy(T1).multiply(tmp).multiply(T2);
  };

  // Abstand, bei dem die ganze Szene (Liege samt Händen und Füßen) mit Rand ins Bild passt: Stützpunkte der Punktwolke in 160 Richtungen
  // (äußerste Punkte), um den Ausschlag der Liegeteile nach außen vergrößert
  const CORN = [];
  {
    const P = pts.geo.attributes.position.array, ND = 160, best = new Float32Array(ND).fill(-1e9), bi = new Int32Array(ND);
    const D = Array.from({ length: ND }, (_, i) => { const y = 1 - (2 * (i + 0.5)) / ND, r = Math.sqrt(1 - y * y), a = i * 2.39996; return [Math.cos(a) * r, y, Math.sin(a) * r]; });
    for (let j = 0; j < P.length; j += 3 * 4) for (let i = 0; i < ND; i++) { const v = P[j] * D[i][0] + P[j + 1] * D[i][1] + P[j + 2] * D[i][2]; if (v > best[i]) { best[i] = v; bi[i] = j; } }
    for (const j of new Set(bi)) { const c = [P[j] - target.x, P[j + 1] - target.y, P[j + 2] - target.z], l = Math.hypot(c[0], c[1], c[2]) || 1, k = (l + 0.12) / l; CORN.push([c[0] * k, c[1] * k, c[2] * k]); }
  }
  const fitR = (yaw, el) => {
    const d = [Math.sin(yaw) * Math.cos(el), Math.sin(el), Math.cos(yaw) * Math.cos(el)]; // vom Ziel zur Kamera
    const r = [Math.cos(yaw), 0, -Math.sin(yaw)], u = [-Math.sin(el) * Math.sin(yaw), Math.cos(el), -Math.sin(el) * Math.cos(yaw)];
    const tv = Math.tan((FOV / 2) * Math.PI / 180) * 0.94, th = tv * st.aspect;
    let need = 0;
    for (const c of CORN) {
      const x = c[0] * r[0] + c[1] * r[1] + c[2] * r[2], y = c[0] * u[0] + c[1] * u[1] + c[2] * u[2], z = c[0] * d[0] + c[1] * d[1] + c[2] * d[2];
      need = Math.max(need, z + Math.abs(x) / th, z + Math.abs(y) / tv);
    }
    return need;
  };
  let clockT = 0;
  const PV = [0, 0, 0.1, 0];
  function update(_time, dt) {
    // Auftritt über die Zeit: kommt die Bühne wieder ins Bild (sie zeichnet nur, wenn sie sichtbar ist), sammelt sich die Liege neu
    // (erst wenn sie zu gut einem Drittel im Bild steht; war sie ganz draußen, beginnt der Auftritt beim nächsten Mal von vorn)
    const cr = canvas.getBoundingClientRect(), vhN = innerHeight, seen = Math.min(cr.bottom, vhN) - Math.max(cr.top, 0);
    if (seen <= 0) { if (!reduced && scanT >= 1) { scanT = 0; U.uCut.value = -3.2; } return; }
    const ready = seen > Math.min(cr.height, vhN) * 0.36;
    if (!ready && scanT <= 0) dt = 0;
    if (pointer.k() > 0 || U.uPtr.value.w > 0) { U.uPtr.value.fromArray(pointer.ndc(st.renderer.domElement.getBoundingClientRect(), PV, 56)); U.uAsp.value = st.aspect; }
    // „Bewegung anhalten“ (Puls · Scan): alles steht, die Liege ist sofort vollständig sichtbar
    const dtCam = dt; // Ziehen dreht auch, wenn die Eigenbewegung angehalten ist
    if (ui && ui.isPaused && ui.isPaused()) { dt = 0; if (scanT < 1) { scanT = 1; U.uCut.value = 99; } }
    clockT += dt;
    const time = clockT;
    U.uTime.value = time * SPEED;
    U.uPix.value = st.pix;
    U.uStip.value = stipSize(st, FOV, pts.spacing);
    // Scan beim ersten Sichtbarwerden: Liege entsteht vom Kopf- zum Fußende
    if (!reduced && scanT < 1) { scanT = Math.min(1, scanT + dt / 3.0); U.uCut.value = -2.9 + ease(scanT) * 6.6; if (scanT >= 1) U.uCut.value = 99; }
    phase += dt * SPEED;
    if (phase > (scanT < 1 ? 1e9 : cycleOf(mode))) { phase -= cycleOf(mode); if (auto) select((mode + 1) % NM); }
    if (scanT < 1) phase = 0;
    if (!auto && performance.now() - cam.lastUser > 9000) auto = true;
    const p = phase, tin = inDur(mode), tOut = tin + DUR.hold;
    const back = p < tOut ? 1 : p < tOut + DUR.out ? 1 - ease((p - tOut) / DUR.out) : 0; // gemeinsame Rückkehr
    const amt = p < tin ? p / tin : back; // Fortschritt für den Knopf
    for (let m = 0; m < NM; m++) for (const sgI of [1, 2, 3]) {
      const k = SEQ[m].indexOf(sgI);
      let a = 0;
      if (m === mode && k >= 0) { const t0 = echt ? k * DUR.step : 0, len = echt ? DUR.step : tin; a = p < tOut ? ease(Math.min(1, Math.max(0, (p - t0) / len))) : back; }
      cur[m][sgI] = damp(cur[m][sgI], a, 8, dt);
    }
    // Ausschläge (echte Figur, nach den Angaben zur Manuthera 242 ruhig verkleinert): Kopfteil hängt am Brustteil
    const [tr, fl, ex, se, ro] = cur;
    if (echt) {
      pivotMat(M[1], PIV_U, -0.08 * ro[1], -0.1 * se[1], 0.11 * fl[1], -0.06 * tr[1]);
      pivotMat(M[2], PL, 0.2 * ro[2], 0.17 * se[2], -0.23 * fl[2] + 0.2 * ex[2], 0.19 * tr[2]);
      pivotMat(M[3], PIV_K, 0, -0.17 * se[3], 0.24 * fl[3] - 0.24 * ex[3], -0.11 * tr[3]); M[3].premultiply(M[1]);
    } else {
      pivotMat(M[1], PIV_U, 0, -0.13 * se[1], 0.12 * fl[1] - 0.1 * ex[1], -0.07 * tr[1]);
      pivotMat(M[2], PL, 0.36 * ro[2], 0.31 * se[2], -0.42 * fl[2] + 0.3 * ex[2], 0.34 * tr[2]);
      M[3].copy(M[1]);
    }
    const segAmt = (sgI) => Math.max(tr[sgI], fl[sgI], ex[sgI], se[sgI], ro[sgI]);
    const segAmt2 = (m) => cur[m][2];
    const mv = Math.max(segAmt(1), segAmt(2), segAmt(3));
    U.uHi.value.set(0, segAmt(1) * 0.7, segAmt(2), segAmt(3) * 0.7);
    U.uMove.value = mv;
    U.uSpineHi.value.set(mode === 0 ? -0.25 : 0.05, mv * 0.9); // nur Perlenkette (gerechnete Figur)
    // Bewegungs-Anzeigen unter den Füßen gehören zum Beckenteil; bei der echten Figur zeigt die Wirbelsäule selbst, wo sich etwas bewegt
    IU.uModeW.value.set(segAmt2(0), Math.max(segAmt2(1), segAmt2(2)), segAmt2(3), segAmt2(4)).multiplyScalar(echt ? 0 : 1);
    ui && ui.onAmount && ui.onAmount(amt);

    // Von Hand gedreht → Blick bleibt stehen (Kai 22.11.); sonst sanftes Pendeln um die Startansicht
    const idle = !reduced && !cam.dragging && !cam.gedreht && performance.now() - cam.lastUser > 3000;
    if (idle) cam.yawTarget = damp(cam.yawTarget, Math.sin(time * 0.11) * 0.25, 0.6, dt);
    cam.yaw = damp(cam.yaw, cam.yawTarget, 5, dtCam);
    const yaw = 0.8 + cam.yaw, el = 0.44;
    const fit = st.aspect < 1.3 ? 1.3 / st.aspect : 1;
    // 22.11.2026 (Kai: „beim Drehen verschwindet ein Teil“ → „Go A“): die Kamera geht je Blickwinkel so weit zurück, dass Liege und Figur
    // ganz im Bild bleiben (in der Seitenansicht ist die Szene am längsten); in der gewohnten Schrägansicht bleibt der Abstand wie bisher
    const R = Math.max((wirbel ? 8.1 : 7.3) * Math.pow(Math.min(fit, 1.8), 0.72), fitR(yaw, el));
    st.camera.position.set(target.x + Math.sin(yaw) * Math.cos(el) * R, target.y + Math.sin(el) * R, target.z + Math.cos(yaw) * Math.cos(el) * R);
    st.camera.lookAt(target);
  }
  return { st, update, select, MODES, count: pts.count };
}
