// Entwurf „Echte Figur“ (23.11.2026, Go Kai „Empfehlung“): Kapitel 01 mit der Figur aus echten Daten (BodyParts3D, assets/figur-echt.bin)
// – Stufe 1 anatomisch echt, Stufe 1+2 mit Scan-Linie, Filmlicht, Röntgen-Lupe; Umschalter heute · 1 · 1+2 (heute = Figur von Puls).
// Bühne: kapitel.js (Kopie aus src/feinschliff); hier „Bewegung anhalten“ (hop-motion), Laden der Daten, der Umschalter.
// Puls, src/feinschliff und alle anderen Seiten bleiben unberührt. Debug: window.__kf (state, go, ring, relax, setStyle).
import { initKopfFuss } from './kapitel.js';
import { loadEcht } from './daten.js';

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

// ---------- Messanzeige wie in Puls (?takt=1): Bilder je Sekunde, längste Pause, Punkte, Aufbauzeit – auf Kais Gerät ----------
let takt = () => {};
if (new URLSearchParams(location.search).get('takt') === '1') {
  const box = document.createElement('div'); box.className = 'takt'; box.innerHTML = '<pre></pre>'; document.body.appendChild(box);
  const out = box.firstChild, gaps = []; let lastF = 0, lastShow = 0;
  takt = (now, kf) => {
    if (lastF) { gaps.push(now - lastF); if (gaps.length > 180) gaps.shift(); }
    lastF = now;
    if (now - lastShow < 500 || gaps.length < 5) return;
    lastShow = now;
    const l = gaps.slice(-60), avg = l.reduce((a, b) => a + b, 0) / l.length, s = kf.state();
    out.textContent = `Bilder/s  ${(1000 / avg).toFixed(0)}\nlängste Pause  ${Math.max(...gaps).toFixed(0)} ms\nStufe  ${s.stil} · Punkte ${s.n}\nAufbau  ${s.buildMs} ms · Abstand ${s.sp}`;
  };
}

// ---------- Daten laden, dann die Bühne ----------
const loadNote = $('.fe-load');
const start = (data) => {
  loadNote.classList.add('gone'); loadNote.textContent = '';
  const kf = initKopfFuss({ root: $('#kf'), isPaused: () => paused, reduced, data });
  requestAnimationFrame(function loop(now) { requestAnimationFrame(loop); kf.update(now); takt(now, kf); });
  window.__kf = kf; // Prüfhilfe: __kf.state(), __kf.go(u), __kf.ring(i), __kf.relax(), __kf.setStyle('heute'|'echt'|'kino')
  // Umschalter heute · 1 · 1+2 (braucht WebGL und die Daten; „heute“ wird beim ersten Mal gebaut)
  const sw = [...document.querySelectorAll('.vsw button')];
  const mark = () => sw.forEach((b) => b.setAttribute('aria-pressed', b.dataset.stil === kf.style() ? 'true' : 'false'));
  if (!kf.gl() || !kf.echt()) $('.vsw').hidden = true;
  sw.forEach((b) => b.addEventListener('click', () => {
    if (b.dataset.stil === kf.style()) return;
    b.classList.add('busy');
    setTimeout(() => { kf.setStyle(b.dataset.stil); b.classList.remove('busy'); mark(); }, 30);
  }));
  mark();
};
// ohne WebGL 2 braucht es die Daten nicht (Punkt-Umriss wie heute)
const hasGL = (() => { try { return !!document.createElement('canvas').getContext('webgl2'); } catch (e) { return false; } })();
if (hasGL) loadEcht().then(start, (e) => { console.error(e); start(null); });
else start(null);
