// Entwurfsseite „Von Kopf bis Fuß“ (Auftrag K, Go Kai 16.11.2026): Kapitel 01 neu. Die Bühne steckt seit 16.11. (Übernahme in Puls)
// im Baustein kapitel.js (+ kapitel.css, kapitel.html); hier nur „Bewegung anhalten“ (hop-motion, gilt auf allen Labor-Seiten) und der Bildtakt.
// Debug: window.__kf (state, go, ring, relax).
import { initKopfFuss } from './kapitel.js';

const $ = (s, r = document) => r.querySelector(s);
const html = document.documentElement;

// ---------- Bewegung: „reduzieren“ (System) und „anhalten“ (Knopf, gemerkt als hop-motion wie auf allen Labor-Seiten) ----------
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
let paused = false;
try { paused = localStorage.getItem('hop-motion') === 'paused'; } catch (e) { /* ohne Speicher */ }
const motionBtn = $('#motionBtn');
function setPaused(v, save = true) {
  paused = v;
  html.classList.toggle('paused', v);
  motionBtn.setAttribute('aria-pressed', v ? 'true' : 'false');
  motionBtn.setAttribute('aria-label', v ? 'Bewegung fortsetzen' : 'Bewegung anhalten');
  motionBtn.title = v ? 'Bewegung fortsetzen' : 'Bewegung anhalten';
  if (save) try { localStorage.setItem('hop-motion', v ? 'paused' : 'on'); } catch (e) { /* ohne Speicher */ }
}
motionBtn.addEventListener('click', () => setPaused(!paused));
setPaused(paused, false);
if (paused) {
  const n = document.createElement('div'); n.className = 'paused-note'; n.setAttribute('role', 'status');
  n.innerHTML = '<span>Bewegung ist angehalten.</span><button type="button">Fortsetzen</button>';
  document.body.appendChild(n);
  const hide = () => n.classList.add('gone');
  n.querySelector('button').addEventListener('click', () => { setPaused(false); hide(); });
  setTimeout(hide, 9000);
}

// ---------- Baustein (seit 16.11. auch Kapitel 01 in Puls) ----------
const kf = initKopfFuss({ root: $('#kf'), isPaused: () => paused, reduced });
requestAnimationFrame(function loop(now) { requestAnimationFrame(loop); kf.update(now); });
window.__kf = kf; // Prüfhilfe: __kf.state(), __kf.go(u), __kf.ring(i), __kf.relax()
