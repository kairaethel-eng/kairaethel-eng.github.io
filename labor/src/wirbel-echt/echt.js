// Wirbelsäule „echt“ in Puls (Auftrag W 14.11.2026, in Puls übernommen mit Auftrag Z 14.11.2026 spät).
// Lädt die echten Netze (eigene Datei), rechnet sie in Zeitscheiben in das Puls-Format um (anatomie.js, stipple.js, Stil „Stich“)
// und setzt sie als Wirbelsäule ein. Rückfall: lädt die Datei nicht (z. B. file://, Funkloch), wird die gerechnete Wirbelsäule
// („bisher“) gebaut; beim nächsten Betreten von Kap. 03 gibt es einen neuen Ladeversuch (N6, höchstens 2 weitere).
// Kein Umschalter mehr (Adress-Schalter ?wirbel, ?stil, ?linien, ?abstand entfallen) – Stand des Entwurfs: wirbelsaeule-echt.html (Archiv).
// Daten: BodyParts3D, © The Database Center for Life Science licensed under CC Attribution 4.0 International (Namensnennung im Fuß).
import { runSliced } from '../shared/slice.js';
import { decode, modelGen } from './anatomie.js';
import { echtStippleGen, echtPointsGen } from './stipple.js';

// Labor: assets/…, Live: die Datei liegt flach neben der Seite (build.mjs setzt HOP_ASSETS, N2)
const DATA = HOP_ASSETS + 'wirbelsaeule-echt.bin';
const SPREAD = 0.4; // Abstand je Fuge an der HWS in cm, größere Wirbel anteilig mehr (Kai 14.11.)
const ECHT = { mode: 'echt', state: 'idle', tries: 0, M: null, N: 0, setMorph: null, morph: {}, ctx: null, built: {} };
export { ECHT };

// ---- Morph-Ziel der Hauptbühne (grobe Wolke): bis die echte Wolke da ist, steht die gerechnete ----
ECHT.initMorph = (N, set) => { ECHT.N = N; ECHT.setMorph = set; };
ECHT.morphReady = (mode, pos) => { ECHT.morph[mode] = pos; if (ECHT.setMorph && (mode === ECHT.mode || !ECHT.morph[ECHT.mode])) ECHT.setMorph(pos); };

function loadEcht() {
  return fetch(DATA)
    .then((r) => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.arrayBuffer(); })
    .then((buf) => runSliced(modelGen(decode(new Uint8Array(buf)), { spread: SPREAD })))
    .then((M) => {
      ECHT.M = M;
      if (ECHT.N) runSliced(echtPointsGen(M, ECHT.N)).then((r) => ECHT.morphReady('echt', r.pos));
      return runSliced(echtStippleGen(M));
    })
    .then((d) => runSliced(ECHT.ctx.slices(d)).then((sl) => [d, sl]));
}
function useBisher() {
  ECHT.mode = 'bisher';
  if (ECHT.morph.bisher && ECHT.setMorph) ECHT.setMorph(ECHT.morph.bisher);
  if (ECHT.built.bisher) return;
  ECHT.built.bisher = runSliced(ECHT.ctx.bisher())
    .then((d) => runSliced(ECHT.ctx.slices(d)).then((sl) => { if (ECHT.mode === 'bisher') ECHT.ctx.swap(d, sl); }));
}
function tryEcht() {
  if (ECHT.state === 'loading' || ECHT.state === 'ok') return;
  ECHT.state = 'loading'; ECHT.tries++;
  loadEcht().then(([d, sl]) => {
    ECHT.state = 'ok'; ECHT.mode = 'echt';
    if (ECHT.morph.echt && ECHT.setMorph) ECHT.setMorph(ECHT.morph.echt);
    ECHT.ctx.swap(d, sl);
  }).catch((e) => {
    console.warn('Wirbelsäule „echt“ nicht geladen – gerechnete Wirbelsäule:', e && e.message);
    ECHT.state = 'failed';
    useBisher();
  });
}

// N3 (14.11.): nicht schon im Hero laden – erst wenn die Seite den ersten Bildschirm verlassen hat
// (am Handy löst whenNear(#achse) bereits im Hero aus; Abruf + Rechnung kosteten dort Bildrate)
function whenPastHero(fn) {
  const past = () => scrollY > innerHeight * 0.5;
  if (past()) { fn(); return; }
  const on = () => { if (!past()) return; removeEventListener('scroll', on); fn(); };
  addEventListener('scroll', on, { passive: true });
}

// N6 (14.11.): nach einem Fehlschlag beim nächsten Betreten von Kap. 03 erneut versuchen (höchstens 3 Versuche insgesamt)
const achse = document.getElementById('achse');
if (achse && 'IntersectionObserver' in window) {
  let inside = false;
  new IntersectionObserver((es) => {
    const now = es.some((e) => e.isIntersecting);
    if (now && !inside && ECHT.ctx && ECHT.state === 'failed' && ECHT.tries < 3) tryEcht();
    inside = now;
  }).observe(achse);
}

// Aufruf aus main.js (whenNear #achse): ctx = { swap(d, sl), bisher(), slices(d) }
ECHT.start = (ctx) => { ECHT.ctx = ctx; whenPastHero(tryEcht); };
window.__echt = ECHT; // Prüfhilfe (Konsole): state, tries, mode
