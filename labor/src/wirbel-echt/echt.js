// Auftrag W (14.11.2026): Entwurfsseite wirbelsaeule-echt.html – Umschalter „bisher / echt“ für die Wirbelsäule in Kap. 03.
// Puls (src/test-4/main.js) wird für diese Seite mit wenigen, geprüften Eingriffen gebaut (src/wirbel-echt/patch.mjs);
// dieser Baustein lädt die echten Netze (eigene Datei, erst bei Annäherung an Kap. 03), rechnet sie in Zeitscheiben
// in das Puls-Format um (anatomie.js, stipple.js) und tauscht die Wirbelsäule auf Knopfdruck.
// Rückfall: lädt die Datei nicht (z. B. file://), bleibt die gerechnete Wirbelsäule; „echt“ ist dann gesperrt.
// Daten: BodyParts3D, © The Database Center for Life Science licensed under CC Attribution 4.0 International.
import { runSliced } from '../shared/slice.js';
import { decode, modelGen } from './anatomie.js';
import { echtStippleGen, echtPointsGen } from './stipple.js';

const DATA = 'assets/wirbelsaeule-echt.bin';
const q = new URLSearchParams(location.search).get('wirbel');
const ECHT = { mode: q === 'bisher' ? 'bisher' : 'echt', failed: false, M: null, N: 0, setMorph: null, morph: {}, ctx: null, cache: {} };
export { ECHT };

// ---- Morph-Ziel der Hauptbühne (grobe Wolke) ----
ECHT.initMorph = (N, set) => { ECHT.N = N; ECHT.setMorph = set; };
// bis die echte Wolke da ist, steht die gerechnete (sonst hielte die Wolke die Körperform)
ECHT.morphReady = (mode, pos) => { ECHT.morph[mode] = pos; if (ECHT.setMorph && (mode === ECHT.mode || !ECHT.morph[ECHT.mode])) ECHT.setMorph(pos); };

// ---- Daten ----
let modelP = null;
function getModel() {
  if (!modelP) {
    modelP = fetch(DATA)
      .then((r) => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.arrayBuffer(); })
      .then((buf) => runSliced(modelGen(decode(new Uint8Array(buf)))))
      .then((M) => { ECHT.M = M; return M; });
  }
  return modelP;
}
function load(mode) {
  if (ECHT.cache[mode]) return ECHT.cache[mode];
  const c = ECHT.ctx;
  const p = (mode === 'echt'
    ? getModel().then((M) => {
      if (ECHT.N) runSliced(echtPointsGen(M, ECHT.N)).then((r) => ECHT.morphReady('echt', r.pos));
      return runSliced(echtStippleGen(M));
    })
    : runSliced(c.bisher()))
    .then((d) => runSliced(c.slices(d)).then((sl) => [d, sl]));
  ECHT.cache[mode] = p;
  return p;
}

// ---- Umschalter (in der Kopfleiste, damit er beim Scannen immer erreichbar ist) ----
const ui = document.createElement('div');
ui.className = 'wv'; ui.setAttribute('role', 'group'); ui.setAttribute('aria-label', 'Wirbelsäule: Vergleich der Form');
ui.innerHTML = '<span class="wv-l" aria-hidden="true">Wirbelsäule</span><button type="button" data-m="bisher">bisher</button><button type="button" data-m="echt" title="Echte Anatomie-Daten (BodyParts3D, CC BY 4.0)">echt</button>';
const btns = [...ui.querySelectorAll('button')];
function mark(busy) {
  btns.forEach((b) => {
    const on = b.dataset.m === ECHT.mode;
    b.setAttribute('aria-pressed', on ? 'true' : 'false');
    b.classList.toggle('is-busy', on && !!busy);
    if (b.dataset.m === 'echt') { b.disabled = ECHT.failed; if (ECHT.failed) b.title = 'Anatomie-Daten nicht geladen – es bleibt die gerechnete Wirbelsäule'; }
  });
}
function set(mode, quiet) {
  if (mode === 'echt' && ECHT.failed) return;
  ECHT.mode = mode;
  if (!quiet) { const u = new URL(location.href); u.searchParams.set('wirbel', mode); history.replaceState(history.state, '', u); }
  if (ECHT.morph[mode] && ECHT.setMorph) ECHT.setMorph(ECHT.morph[mode]);
  if (!ECHT.ctx) { mark(false); return; } // Kap. 03 noch nicht in Reichweite: Wahl gilt beim Aufbau
  mark(true);
  load(mode).then(([d, sl]) => {
    if (ECHT.mode !== mode) return;
    ECHT.ctx.swap(d, sl); mark(false);
    prefetch();
  }).catch((e) => {
    console.warn('Wirbelsäule „echt“ nicht verfügbar:', e && e.message);
    ECHT.failed = true; delete ECHT.cache.echt;
    if (mode === 'echt') set('bisher', true); else mark(false);
  });
}
// die andere Form vorbereiten (Zeitscheiben), damit der Wechsel sofort da ist – aber erst, wenn Kap. 03 wirklich im Bild ist:
// am Handy wird die Wirbelsäule schon im Hero gebaut, eine zweite Rechnung dort kostete messbar Bildrate (frames.cjs 14.11.)
let seen = false, pre = false;
function prefetch() {
  if (!seen || pre || !ECHT.ctx) return;
  const other = ECHT.mode === 'echt' ? 'bisher' : 'echt';
  if (other === 'echt' && ECHT.failed) return;
  pre = true; load(other).catch(() => {});
}
const achse = document.getElementById('achse');
if (achse && 'IntersectionObserver' in window) {
  const io = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) { io.disconnect(); seen = true; prefetch(); } });
  io.observe(achse);
}
btns.forEach((b) => b.addEventListener('click', () => { if (b.dataset.m !== ECHT.mode) set(b.dataset.m); }));
const top = document.getElementById('top');
if (top) top.insertBefore(ui, top.querySelector('[data-termin]'));
mark(false);

// Aufruf aus main.js (whenNear #achse): ctx = { swap(d, sl), bisher(), slices(d) }
ECHT.start = (ctx) => { ECHT.ctx = ctx; set(ECHT.mode, true); };
ECHT.set = set;
window.__echt = ECHT;
