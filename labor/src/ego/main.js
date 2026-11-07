// Testseite „Rundgang aus Augenhöhe“ (rundgang-ego.html): der Baustein aus tour.js im Vollbild.
// Dieselbe Fahrt steckt seit 7.11. auch in Kapitel 04 der Hauptseite (Knopf „Rundgang aus Augenhöhe“).
import { praxisScanGen } from '../test-4/praxis.js';
import { runSliced } from '../shared/slice.js';
import { createEgo } from './tour.js';

const $ = (s) => document.querySelector(s);
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const mobile = innerWidth <= 920;

const ego = createEgo({
  canvas: $('#gl'), mobile, reduced,
  ui: {
    cap: $('#cap'), capNo: $('#capNo'), capKick: $('#capKick'), capTitle: $('#capTitle'), capText: $('#capText'),
    prev: $('#prev'), play: $('#play'), next: $('#next'), optStill: $('#optStill'), optCalm: $('#optCalm'), optBig: $('#optBig'),
    hint: $('#hint'), veil: $('#veil'),
  },
});
if (!ego) { $('#loading').textContent = 'Dieser Test braucht einen Browser mit WebGL.'; throw new Error('kein WebGL'); }
ego.start();

runSliced(praxisScanGen(mobile ? 32000 : 85000, mobile ? 0.62 : 1)).then((prx) => {
  ego.setPrx(prx); $('#loading').remove();
  window.__ego = ego;
}).catch((e) => { $('#loading').textContent = 'Fehler beim Aufbau.'; console.error(e); });
