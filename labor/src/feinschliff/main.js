// Studie „Feinschliff“ (17.11.2026, Go Kai „alle deine besten Empfehlungen“): Kapitel 01 mit der Figur aus „Figur plus“, die Punkte
// geordnet, gestochen und mit Kantenlicht; Antwort unter Maus/Finger; ruhigere Schrift. Bühne: kapitel.js (Kopie aus src/figur-plus
// mit eigener figur.js/gl.js); hier „Bewegung anhalten“ (hop-motion), der Umschalter bisher / neu und der Bildtakt.
// Puls, src/kopf-fuss und die Seite figur-plus.html bleiben unberührt. Debug: window.__kf (state, go, ring, relax, setStyle).
import { initKopfFuss } from './kapitel.js';
import { figurePoints as oldPoints } from '../figur-plus/figur.js';
import { createStage as oldStage } from '../figur-plus/gl.js';

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

// ---------- Bühne ----------
const kf = initKopfFuss({ root: $('#kf'), isPaused: () => paused, reduced, old: { points: oldPoints, stage: oldStage } });
requestAnimationFrame(function loop(now) { requestAnimationFrame(loop); kf.update(now); });
window.__kf = kf; // Prüfhilfe: __kf.state(), __kf.go(u), __kf.ring(i), __kf.relax(), __kf.setStyle(true|false)

// ---------- Umschalter bisher / neu (braucht WebGL; „bisher“ wird beim ersten Mal gebaut) ----------
const sw = [...document.querySelectorAll('.vsw button')];
const mark = () => sw.forEach((b) => b.setAttribute('aria-pressed', b.dataset.stil === kf.style() ? 'true' : 'false'));
if (!kf.gl()) $('.vsw').hidden = true;
sw.forEach((b) => b.addEventListener('click', () => {
  if (b.dataset.stil === kf.style()) return;
  b.classList.add('busy'); // „bisher“ rechnet beim ersten Mal einen Augenblick
  setTimeout(() => { kf.setStyle(b.dataset.stil === 'neu'); b.classList.remove('busy'); mark(); }, 30);
}));
mark();
