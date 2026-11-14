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
function spineSwap(d, sl) {
  det = d; SC = d.SC; CY = d.CY;
  sU.uDiff.value = 1; // differenziert (Handy 7.11., PC 7.11.)
  // Kameraabstand je Haltestelle ist in Einheiten der gerechneten Säule angegeben → für „echt“ umrechnen
  STOPS.forEach((s) => { if (s.d0 === undefined) s.d0 = s.d; s.d = s.d0 * (d.dScale || 1); });
  spineGroup.clear();
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
];

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
