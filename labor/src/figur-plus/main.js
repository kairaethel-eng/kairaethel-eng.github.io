// Entwurfsseite „Figur plus“ (16.11.2026, Auftrag Kai): Kapitel 01 mit neuer Figur – deutliche Körperkonturen, Gehirn an Station 01,
// Nervensystem aus dem Gehirn bis in Finger und Zehen, alles im Partikel-Stil. Bühne: kapitel.js (Kopie des Bausteins mit neuer figur.js/gl.js);
// hier nur „Bewegung anhalten“ (hop-motion, gilt auf allen Labor-Seiten) und der Bildtakt. Puls und src/kopf-fuss bleiben unberührt.
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

// ---------- Bühne ----------
const kf = initKopfFuss({ root: $('#kf'), isPaused: () => paused, reduced });
requestAnimationFrame(function loop(now) { requestAnimationFrame(loop); kf.update(now); });
window.__kf = kf; // Prüfhilfe: __kf.state(), __kf.go(u), __kf.ring(i), __kf.relax()
