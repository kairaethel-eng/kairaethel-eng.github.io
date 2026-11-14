// Auftrag W (14.11.2026): Entwurfsseite wirbelsaeule-echt.html = Puls (src/test-4) + diese Eingriffe, nur beim Bauen.
// Die Quellen von Puls bleiben unverändert. Jeder Suchtext muss in der Quelle GENAU EINMAL vorkommen, sonst bricht der
// Build ab (dann hat sich Puls geändert → Eingriff hier nachziehen). Beim späteren Tausch in Puls (eigenes Go) sind genau
// diese Stellen zu ändern.

// src/test-4/main.js
export const js = [
  // 1) Baustein für die echten Daten und den Umschalter
  // (Anker seit 14.11.: Puls importiert statt ../ego/tour.js jetzt das Linienhaus, Kap. 04 „2a“)
  ["import { initHouse } from '../haus-licht/house.js';",
    "import { initHouse } from '../haus-licht/house.js';\nimport { ECHT } from '../wirbel-echt/echt.js';"],
  // 2) Morph-Ziel der Hauptbühne: die grobe Wolke folgt der gewählten Form
  ["if (renderer) runSliced(spinePointsGen(N)).then((sp) => { geo.attributes.pos2.array.set(sp.pos); geo.attributes.pos2.needsUpdate = true; });",
    "ECHT.initMorph(N, (p) => { geo.attributes.pos2.array.set(p); geo.attributes.pos2.needsUpdate = true; });\n" +
    "if (renderer) runSliced(spinePointsGen(N)).then((sp) => ECHT.morphReady('bisher', sp.pos));"],
  // 3) Aufbau der Wirbelsäule: austauschbar (det, Kern, Punkte, Nerven); je Form einmal gebaut und aufbewahrt
  [`whenNear($('#achse'), () => runSliced(spineStippleGen(0, false)).then((d) => {
  det = d; SC = d.SC; CY = d.CY;
  sU.uDiff.value = 1; // differenziert (Handy 7.11., PC 7.11.)
  return runSliced(d.makeSlicesGen(N_SLICE, isDesktop() ? 0.024 : 0.032, 0.12, true));
}).then((sl) => {
  const core = new THREE.Mesh(det.coreGeo, coreMat);
  core.frustumCulled = false;
  bones = boneStyle('slices', sl);
  spineGroup.add(core, bones.pts);
  addNerves();
  warmShaders();
}));`,
  `// Entwurf W: Wirbelsäule austauschbar („bisher“ = gerechnet, „echt“ = BodyParts3D), siehe src/wirbel-echt/echt.js
// Entwurf W (Go Kai 14.11., B): Handy-Nahansicht – der aktive Abschnitt bekommt eine eigene, dichte Punktwolke (gleiche Schichten,
// ~20 000 Punkte im Höhenband der Haltestelle, weicher Rand), je Form und Haltestelle einmal gerechnet und aufbewahrt;
// Ein-/Ausblenden über drawRange (Punkte liegen zufällig → die Dichte wächst gleichmäßig)
const DENSE = { obj: null, idx: -1, k: 0, busy: false, N: 20000 };
function denseRegion(i) {
  let y0 = 1e9, y1 = -1e9, hm = 0;
  STOPS[i].ids.forEach((id) => {
    const lv = det.levels.find((l) => l.id === id), y = (lv.center.y - CY) * SC, h = (lv.h / 2 + lv.disc) * SC;
    y0 = Math.min(y0, y - h); y1 = Math.max(y1, y + h); hm = Math.max(hm, lv.h * SC);
  });
  return { y0, y1, pad: Math.min(0.5, Math.max(0.12, hm * 0.9)) };
}
function denseTick(dt, want) {
  const D = DENSE;
  if (!det || !bones) return;
  if (D.obj && want !== D.idx) { D.k = Math.max(0, D.k - dt * 5); if (D.k === 0) { spineGroup.remove(D.obj); D.obj = null; D.idx = -1; } }
  else if (D.obj) D.k = reduced ? 1 : Math.min(1, D.k + dt * 1.6);
  if (D.obj) D.obj.geometry.setDrawRange(0, Math.round(D.obj.userData.n * D.k * D.k * (3 - 2 * D.k)));
  if (want < 0 || D.obj || D.busy) return;
  const cache = det.dense || (det.dense = {});
  if (cache[want]) { D.obj = cache[want]; D.idx = want; D.k = 0; D.obj.geometry.setDrawRange(0, 0); spineGroup.add(D.obj); return; }
  D.busy = true;
  const d0 = det;
  runSliced(d0.makeSlicesGen(D.N, 0.032, 0.12, true, denseRegion(want))).then((sl) => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(sl.pos, 3));
    g.setAttribute('normal', new THREE.BufferAttribute(sl.nor, 3));
    g.setAttribute('aZone', new THREE.BufferAttribute(sl.zone, 1));
    g.setAttribute('aKind', new THREE.BufferAttribute(sl.kind, 1));
    g.setAttribute('aEdge', new THREE.BufferAttribute(sl.edge, 1));
    g.setDrawRange(0, 0);
    const m = boneMat.clone();
    m.uniforms = { ...sU, uStip: { value: 1 }, uMaxSize: { value: 2.6 } };
    const pts = new THREE.Points(g, m);
    pts.frustumCulled = false; pts.userData.n = sl.count;
    cache[want] = pts;
  }).finally(() => { D.busy = false; });
}
function spineSwap(d, sl) {
  det = d; SC = d.SC; CY = d.CY;
  sU.uDiff.value = 1; // differenziert (Handy 7.11., PC 7.11.)
  // Kameraabstand je Haltestelle ist in Einheiten der gerechneten Säule angegeben → für „echt“ umrechnen
  STOPS.forEach((s) => { if (s.d0 === undefined) s.d0 = s.d; s.d = s.d0 * (d.dScale || 1); });
  spineGroup.clear(); DENSE.obj = null; DENSE.idx = -1; // dichte Wolke gehört zur alten Form
  if (!d.objs) {
    const core = new THREE.Mesh(d.coreGeo, coreMat);
    core.frustumCulled = false;
    delete STYLES.slices;
    const b = boneStyle('slices', sl);
    spineGroup.add(core, b.pts);
    addNerves(); // legt eigene Kurven-Textur an (sU.uCurves/uRows)
    d.objs = { kids: spineGroup.children.slice(), bones: b, uC: sU.uCurves, uR: sU.uRows };
  } else {
    spineGroup.add(...d.objs.kids); sU.uCurves = d.objs.uC; sU.uRows = d.objs.uR;
  }
  bones = d.objs.bones;
  ML.key = null; ML.tipKey = null; periCurve = null; // Zeilen, Andockpunkte und Versorgungsbahn neu messen
  warmShaders();
}
whenNear($('#achse'), () => ECHT.start({
  swap: spineSwap,
  bisher: () => spineStippleGen(0, false),
  slices: (d) => d.makeSlicesGen(N_SLICE, isDesktop() ? 0.024 : 0.032, 0.12, true),
}));
window.__wv = { det: () => det, peri: () => periCurve, STOPS, camera, uniforms }; // Prüfhilfe (Konsole)`],
  ["  uDiff: { value: 0 }, uFine: { value: 0 },",
    "  uDiff: { value: 0 }, uFine: { value: 0 }, uSharp: { value: isDesktop() ? 0 : 1 }, // Entwurf W (A): Handy schärfer"],
  ["uScanAmt, uDiff, uFine, uDiscMode; uniform vec4 uXf;",
    "uScanAmt, uDiff, uFine, uDiscMode, uSharp; uniform vec4 uXf;"],
  ["          col = cBone * (.2 + .8 * lam) * mix(.58, 1.2, sil) + cBlue * rim * .12;",
    "          col = uSharp > .5 // Entwurf W (A): Umriss hell, Fläche zum Betrachter dunkler – wie eine anatomische Strichzeichnung\n            ? cBone * (.14 + .86 * lam) * mix(.34, 1.45, smoothstep(.1, .7, sil)) + cBlue * rim * .1\n            : cBone * (.2 + .8 * lam) * mix(.58, 1.2, sil) + cBlue * rim * .12;"],
  ["      gl_PointSize = clamp(uStip / -mv.z * sz, 1., uMaxSize) * (1. + g * .8 + sc * .7);",
    "      gl_PointSize = clamp(uStip / -mv.z * sz * (uSharp > .5 ? .86 : 1.), 1., uMaxSize) * (1. + g * .8 + sc * .7);"],
  ["  ghostMat.uniforms = { ...sU, uGhost: { value: 0.42 } };",
    "  ghostMat.uniforms = { ...sU, uGhost: { value: isDesktop() ? 0.42 : 0.24 } }; // Entwurf W (A): Handy weniger Rückenmark durch den Knochen"],
  ["    ZM.k = reduced ? (settle ? 1 : 0) : ZM.k + ((settle ? 1 : 0) - ZM.k) * (1 - Math.exp(-dt * (settle ? 2.6 : 7)));\n  }\n",
    "    ZM.k = reduced ? (settle ? 1 : 0) : ZM.k + ((settle ? 1 : 0) - ZM.k) * (1 - Math.exp(-dt * (settle ? 2.6 : 7)));\n  }\n  denseTick(dt, !pc && settle && ZM.k > 0.5 ? ZM.idx : -1); // Entwurf W (B)\n"],
  ["(bones.name === 'grain' ? bones.spacing * 0.78 : 0.022);\n  // Band unter der Linie",
    "(bones.name === 'grain' ? bones.spacing * 0.78 : 0.022);\n  if (DENSE.obj && bones) DENSE.obj.material.uniforms.uStip.value = bones.pts.material.uniforms.uStip.value * 0.8; // Entwurf W (B)\n  // Band unter der Linie"],
];

// src/test-4/shapes.js (B: Abtastung in einem Höhenband – dieselbe Änderung steht direkt in stipple.js)
export const src = {
  'shapes.js': [
    ["  function* makeSlicesGen(n, step = 0.042, band = 0.16, diff = false) {",
      "  // Entwurf W (Go Kai 14.11., B): Abtastung nur in einem Höhenband (Formkoordinaten) mit weichem Rand → Verdichtung der Handy-Nahansicht\n  function* regionDist({ y0, y1, pad }) {\n    const nF = P.length / 9, face = new Uint32Array(nF), cum = new Float64Array(nF);\n    let k = 0, acc = 0;\n    for (let f = 0; f < nF; f++) {\n      if (!(f & 16383)) yield;\n      const a = f * 9, yc = ((P[a + 1] + P[a + 4] + P[a + 7]) / 3 - CY) * SC;\n      let wg = yc < y0 ? 1 - (y0 - yc) / pad : yc > y1 ? 1 - (yc - y1) / pad : 1;\n      if (wg <= 0) continue;\n      wg = wg * wg * (3 - 2 * wg);\n      const ux = P[a + 3] - P[a], uy = P[a + 4] - P[a + 1], uz = P[a + 5] - P[a + 2], vx = P[a + 6] - P[a], vy = P[a + 7] - P[a + 1], vz = P[a + 8] - P[a + 2];\n      acc += Math.hypot(uy * vz - uz * vy, uz * vx - ux * vz, ux * vy - uy * vx) * 0.5 * wg;\n      face[k] = f; cum[k++] = acc;\n    }\n    return { face: face.subarray(0, k), cum: cum.subarray(0, k) };\n  }\n  function* makeSlicesGen(n, step = 0.042, band = 0.16, diff = false, region = null) {"],
    ["    const dist = sampler.distribution, nF = dist.length, tot = dist[nF - 1];",
      "    const RG = region ? yield* regionDist(region) : null;\n    const dist = RG ? RG.cum : sampler.distribution, nF = dist.length, tot = dist[nF - 1];"],
    ["      const t = 1 - u - w, a = lo * 9;",
      "      const t = 1 - u - w, a = (RG ? RG.face[lo] : lo) * 9;"],
  ],
};

// src/test-4/page.html
export const page = [
  ['<title>HOP Puls Scan</title>', '<title>HOP Entwurf W · Wirbelsäule echt</title>'],
  ['<span class="lab">Testseite 4 · Puls · Scan</span>',
    '<span class="lab">Entwurf W · Wirbelsäule echt</span>\n' +
    '      <span class="credit">Wirbelsäule „echt“: BodyParts3D, © The Database Center for Life Science licensed under ' +
    '<a href="https://creativecommons.org/licenses/by/4.0/deed.de" rel="license noopener" target="_blank">CC Attribution 4.0 International</a> · ' +
    '<a href="https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html" rel="noopener" target="_blank">Quelle</a>. ' +
    'Verändert: vereinfacht und als Punktwolke dargestellt.</span>'],
];

// zusätzlich ans Ende der style.css
export const css = `
/* Entwurf W (14.11.2026): Umschalter „bisher / echt“ in der Kopfleiste, Namensnennung in der Fußzeile */
.wv{display:inline-flex;align-items:center;gap:.125rem;height:2.5rem;padding:0 .25rem 0 .75rem;border-radius:1.25rem;border:1px solid rgba(224,154,53,.45);background:rgba(16,34,42,.72);font:600 .75rem/1 var(--sans);letter-spacing:.06em;color:var(--dim);flex:none}
.wv-l{margin-right:.375rem;text-transform:uppercase;letter-spacing:.12em;font-size:.6875rem;color:var(--mute)}
.wv button{appearance:none;min-width:2.75rem;height:2rem;padding:0 .625rem;border:0;border-radius:1rem;background:transparent;color:var(--dim);font:inherit;letter-spacing:inherit;cursor:pointer}
.wv button:hover{color:var(--txt)}
.wv button[aria-pressed="true"]{background:var(--amber);color:var(--ink)}
.wv button.is-busy{background:rgba(224,154,53,.35);color:var(--txt)}
.wv button:disabled{opacity:.4;cursor:not-allowed}
.wv button:focus-visible{outline:2px solid var(--amber);outline-offset:2px}
.foot .credit{flex-basis:100%;font-size:.75rem;line-height:1.5;color:var(--mute)}
.foot .credit a{color:var(--dim)}
html.no-gl .wv{display:none}
@media (min-width:1220px) and (max-width:1439px){ /* volle Leiste + Umschalter: Termin-Knopf bleibt im Bild (sizes.cjs) */
  .top{gap:1.125rem}
  .wv{padding-left:.25rem}
  .wv-l{display:none}
}
@media (max-width:920px){
  .wv{padding-left:.25rem}
  .wv-l{display:none}
  .wv button{min-width:2.75rem;height:2.25rem;padding:0 .5rem}
}
@media (max-width:420px){ .top .btn-small[data-termin]{display:none} } /* Entwurf: Platz für den Umschalter; Termin bleibt in Kap. 05 */
`;
