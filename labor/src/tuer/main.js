// Entwurfsseite „Tür · zwei Entwürfe“ (16.11.2026, Go Kai): Kapitel 05 von Puls mit versteckten Knöpfen, die erst
// erscheinen, wenn eine Partikel-Tür aufgeht. Zwei Varianten zum Vergleich (Umschalter oben, Adresse ?v=a | ?v=c):
//   A  „Tür im Text“        → varA.js (Tür steht an der Stelle der Knöpfe, Rahmen bleibt)
//   C  „Ein Schritt hindurch“ → varC.js (bildschirmgroße Tür hinter dem Text, Kamera geht hindurch)
// Puls (src/test-4) ist unberührt. Zustand der Knöpfe über Klassen an <html>:
//   door-wait (versteckt) → door-open (blenden nacheinander ein) bzw. door-now (sofort da, ohne Bewegung).
// Die Knöpfe bleiben immer im Dokument und per Tastatur erreichbar; Fokus auf einem versteckten Knopf öffnet sofort.
// Debug: window.__tuer (v, set, again, phase, a, c).
import { initA } from './varA.js';
import { initC } from './varC.js';

const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const html = document.documentElement;
const reducedMq = window.matchMedia('(prefers-reduced-motion: reduce)');

// ---------- „Bewegung anhalten“ (hop-motion, gleiche Wahl wie auf den anderen Labor-Seiten) ----------
let paused = false;
try { paused = localStorage.getItem('hop-motion') === 'paused'; } catch (e) { /* ohne Speicher */ }
const isStill = () => paused || reducedMq.matches;
const motionBtn = $('#motionBtn');
function setPaused(v, save = true) {
  paused = v;
  html.classList.toggle('paused', v);
  motionBtn.setAttribute('aria-pressed', v ? 'true' : 'false');
  motionBtn.setAttribute('aria-label', v ? 'Bewegung fortsetzen' : 'Bewegung anhalten');
  motionBtn.title = v ? 'Bewegung fortsetzen' : 'Bewegung anhalten';
  if (save) try { localStorage.setItem('hop-motion', v ? 'paused' : 'on'); } catch (e) { /* ohne Speicher */ }
  if (isStill()) showNow();
}
motionBtn.addEventListener('click', () => setPaused(!paused));

// ---------- Überschrift „Die Tür steht offen.“ wie in Puls ----------
const tTitle = $('#t-title');
(function splitLetters(el) {
  const lbl = el.cloneNode(true); lbl.querySelectorAll('br').forEach((br) => br.replaceWith(' '));
  el.setAttribute('aria-label', lbl.textContent.replace(/\s+/g, ' ').trim());
  let i = 0;
  [...el.childNodes].forEach((n) => {
    if (n.nodeType !== 3) { if (n.nodeName === 'EM') n.setAttribute('aria-hidden', 'true'); return; }
    const frag = document.createDocumentFragment();
    n.textContent.split(/(\s+)/).forEach((w) => {
      if (!w) return;
      if (!w.trim()) { frag.appendChild(document.createTextNode(w)); return; }
      const word = document.createElement('span'); word.className = 'lw'; word.setAttribute('aria-hidden', 'true');
      [...w].forEach((c) => { const sp = document.createElement('span'); sp.className = 'lt'; sp.textContent = c; sp.style.setProperty('--i', i++); word.appendChild(sp); });
      frag.appendChild(word);
    });
    n.replaceWith(frag);
  });
})(tTitle);
new IntersectionObserver((es, ob) => es.forEach((e) => { if (e.isIntersecting) { tTitle.classList.add('open'); ob.disconnect(); } }), { threshold: 0.4 }).observe(tTitle);

// ---------- Varianten ----------
const doorway = $('#doorway'), actions = $('.actions', doorway), doorSec = $('#tuer');
const A = initA({ root: doorway, isStill });
const C = initC({ cv: $('#cStage'), glow: $('#cGlow'), isStill });
let v = /[?&]v=c\b/.test(location.search) ? 'c' : 'a';
let phase = 'wait'; // wait | open

function reveal(now) {
  if (phase === 'open') return;
  phase = 'open';
  html.classList.remove('door-wait');
  html.classList.add(now ? 'door-now' : 'door-open');
}
function showNow() { reveal(true); A.open(true); C.finish(); } // Endzustand ohne Bewegung
function rearm() {
  A.reset(); C.reset();
  if (isStill()) { phase = 'wait'; html.classList.remove('door-open', 'door-now'); showNow(); return; }
  phase = 'wait';
  html.classList.remove('door-open', 'door-now');
  html.classList.add('door-wait');
}
// scroll = true: Seite so stellen, dass Kapitel 05 knapp unter dem Fensterrand beginnt – man scrollt wieder hinein
function setVariant(nv, scroll) {
  v = nv === 'c' ? 'c' : 'a';
  html.dataset.v = v;
  $$('.vsw button').forEach((b) => b.setAttribute('aria-pressed', b.dataset.v === v ? 'true' : 'false'));
  try { history.replaceState(null, '', v === 'a' ? location.pathname : `${location.pathname}?v=c`); } catch (e) { /* file:// */ }
  rearm();
  if (scroll) window.scrollTo({ top: Math.max(0, doorSec.getBoundingClientRect().top + window.scrollY - window.innerHeight * 0.98), behavior: 'auto' });
}
$$('.vsw button').forEach((b) => b.addEventListener('click', () => setVariant(b.dataset.v, window.scrollY > 40)));
$('#again').addEventListener('click', () => setVariant(v, true));
// Tastatur: Fokus landet auf einem noch versteckten Knopf → Tür sofort offen
doorway.addEventListener('focusin', () => { if (phase === 'wait') showNow(); });
reducedMq.addEventListener?.('change', () => { if (isStill()) showNow(); });

setPaused(paused, false); // beim Laden nichts speichern – nur nach Klick
setVariant(v, false);
if (paused) {
  const n = document.createElement('div'); n.className = 'paused-note'; n.setAttribute('role', 'status');
  n.innerHTML = '<span>Bewegung ist angehalten.</span><button type="button">Fortsetzen</button>';
  document.body.appendChild(n);
  const hide = () => n.classList.add('gone');
  n.querySelector('button').addEventListener('click', () => { setPaused(false); hide(); rearm(); });
  setTimeout(hide, 9000);
}

// ---------- Bildtakt ----------
let last = performance.now();
function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min(0.1, (now - last) / 1000); last = now;
  const vh = window.innerHeight;
  if (v === 'a') {
    if (phase === 'wait') {
      // Tür ganz im Bild (bzw. bei niedrigen Fenstern weit genug oben) → einmal aufschwingen
      const r = doorway.getBoundingClientRect();
      if (r.bottom > 0 && (r.bottom < vh - 8 || r.top < vh * 0.22)) { A.open(false); reveal(false); }
    }
    A.tick(now, dt);
  } else {
    const tt = tTitle.getBoundingClientRect().top, ar = actions.getBoundingClientRect();
    C.tick(dt, tt, ar.top, ar.bottom);
    if (phase === 'wait' && C.gate() && ar.top < vh * 0.92) reveal(false);
  }
}
requestAnimationFrame(frame);

// ---------- Kontakt: E-Mail-Adresse kopieren (wie Puls, Knopf steht hier bei der Adresse) ----------
{
  const copyBtn = $('#copyMail'), copyState = $('#copyState'), mailA = $('#mailAddr');
  copyBtn.hidden = false;
  let tm = 0;
  const say = (t) => { copyState.textContent = t; clearTimeout(tm); tm = setTimeout(() => { copyState.textContent = ''; }, 4000); };
  copyBtn.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(mailA.textContent.trim()); say('Kopiert'); }
    catch (e) { const r = document.createRange(); r.selectNodeContents(mailA); const s = getSelection(); s.removeAllRanges(); s.addRange(r); say('Adresse markiert – bitte selbst kopieren'); }
  });
}

window.__tuer = { get v() { return v; }, get phase() { return phase; }, set: setVariant, again: () => setVariant(v, true), a: A, c: C };
