// Entwurfsseite „Bandscheibenvorfall · Film“ (14.11.2026, Auftrag Kai): Film zu Kapitel 03, Haltestelle L4–L5.
// Der Film selbst steckt im Baustein film.js (später in Puls einsetzbar). Hier nur: „Bewegung anhalten“ (hop-motion,
// gleiche Wahl wie auf den anderen Labor-Seiten) und der Start des Bausteins. Debug: window.__vorfall (play, pause, seek, state).
import { initVorfall } from './film.js';

const $ = (s, r = document) => r.querySelector(s);
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

window.__vorfall = initVorfall({ root: $('#vorfall'), isPaused: () => paused }) || {};
