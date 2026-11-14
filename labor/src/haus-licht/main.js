// Entwurf „Licht im Fenster“ (Auftrag H, 14.11.2026): Kapitel 04 ohne Partikel – reines SVG + CSS, wenig JS.
// Aufgaben hier: Dach passend zur Breite zeichnen, Linien beim Hereinscrollen „zeichnen“, Licht an/aus je Raum,
// Rundgang (5 s je Raum, Fortschritt), Tastatur (roving tabindex, aria-current), Handy: waagrecht wischen mit Einrasten
// (natives scroll-snap – senkrecht wischen scrollt immer die Seite), „Bewegung anhalten“ (hop-motion) + „reduzieren“.
// Das Haus selbst steckt im Baustein house.js (auch in Puls Kap. 04). Debug: window.__hausLicht (state, set, photo, ego).
import { initHouse } from './house.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---------- Bewegung anhalten (gleiche Wahl wie auf den anderen Labor-Seiten) ----------
let paused = false;
try { paused = localStorage.getItem('hop-motion') === 'paused'; } catch (e) { /* ohne Speicher */ }
const motionBtn = $('#motionBtn');
function setPaused(v, save = true) {
  paused = v;
  document.documentElement.classList.toggle('paused', v);
  motionBtn.setAttribute('aria-pressed', v ? 'true' : 'false');
  motionBtn.setAttribute('aria-label', v ? 'Bewegung fortsetzen' : 'Bewegung anhalten');
  motionBtn.title = v ? 'Bewegung fortsetzen' : 'Bewegung anhalten';
  if (save) try { localStorage.setItem('hop-motion', v ? 'paused' : 'on'); } catch (e) { /* ohne Speicher */ }
}
motionBtn.addEventListener('click', () => setPaused(!paused));
setPaused(paused, false); // beim Laden nichts speichern – nur nach Klick
if (paused) {
  const n = document.createElement('div'); n.className = 'paused-note'; n.setAttribute('role', 'status');
  n.innerHTML = '<span>Bewegung ist angehalten.</span><button type="button">Fortsetzen</button>';
  document.body.appendChild(n);
  const hide = () => n.classList.add('gone');
  n.querySelector('button').addEventListener('click', () => { setPaused(false); hide(); });
  setTimeout(hide, 9000);
}

const H = initHouse({ root: document.getElementById('dach'), isPaused: () => paused });
window.__hausLicht = H;
