// „Von Kopf bis Fuß im echten Zuhause“ – Studien zum ersten Bildschirm (Auftrag Kai 11.11.2026).
// Drei Umsetzungen desselben Inhalts; unten umschaltbar, per Adresse erreichbar (#zeichnung, #lot, #striche).
import { s1 } from './s1.js';
import { s2 } from './s2.js';
import { s3 } from './s3.js';

const STUDIES = { zeichnung: s1, lot: s2, striche: s3 };
const mq = matchMedia('(prefers-reduced-motion: reduce)');
let cur = '', inst = null;

// Begrüßung nach Tageszeit des Besuchers
const h = new Date().getHours();
const gruss = h < 11 ? 'Guten Morgen.' : h < 18 ? 'Guten Tag.' : 'Guten Abend.';
document.querySelectorAll('.gruss').forEach((e) => { e.textContent = gruss; });

function show(name, force) {
  if (!STUDIES[name]) name = 'zeichnung';
  if (name === cur && !force) return;
  if (inst) inst.destroy();
  cur = name;
  document.querySelectorAll('.studie').forEach((a) => { a.hidden = a.id !== name; });
  document.querySelectorAll('.wahl a').forEach((a) => { if (a.hash === '#' + name) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
  scrollTo(0, 0);
  inst = STUDIES[name](document.getElementById(name), { reduced: mq.matches });
}
addEventListener('hashchange', () => show(location.hash.slice(1)));
mq.addEventListener('change', () => show(cur, true));
(document.fonts ? document.fonts.ready : Promise.resolve()).then(() => {
  show(location.hash.slice(1));
  const loop = (t) => { if (inst && !document.hidden) inst.frame(t); requestAnimationFrame(loop); };
  requestAnimationFrame(loop);
});
