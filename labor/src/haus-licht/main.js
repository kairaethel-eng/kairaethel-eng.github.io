// Entwurf „Licht im Fenster“ (Auftrag H, 14.11.2026): Kapitel 04 ohne Partikel – reines SVG + CSS, wenig JS.
// Aufgaben hier: Dach passend zur Breite zeichnen, Linien beim Hereinscrollen „zeichnen“, Licht an/aus je Raum,
// Rundgang (5 s je Raum, Fortschritt), Tastatur (roving tabindex, aria-current), Handy: waagrecht wischen mit Einrasten
// (natives scroll-snap – senkrecht wischen scrollt immer die Seite), „Bewegung anhalten“ (hop-motion) + „reduzieren“.
// Debug im Browser: window.__hausLicht (state(), set(i), photo(i, url)).
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const mqMob = matchMedia('(max-width:920px)');

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

// ---------- Elemente ----------
const house = $('#house'), roofSvg = $('#roofSvg'), rRoof = $('#rRoof'), rChim = $('#rChim'), hopCs = $$('#rHop circle');
const ceil = $('.ln-ceil'), roomsEl = $('#rooms'), rooms = $$('.room'), cards = $$('.card');
const playBtn = $('#play'), playTxt = $('#playTxt'), progEl = $('#prog'), progWrap = progEl.parentElement;
const headLine = $('.roofline path');
const N = rooms.length;
rooms.forEach((r, i) => { r.style.setProperty('--i', i); r.tabIndex = i === 0 ? 0 : -1; });

// Fotos (später von Kai): data-photo="assets/…webp" am Raum → Bild hinter der Strichzeichnung, erscheint mit dem Licht
function photo(i, url) {
  const r = rooms[i]; if (!r) return;
  let img = $('.rm-photo', r);
  if (!url) { img?.remove(); r.classList.remove('has-photo'); return; }
  if (!img) { img = document.createElement('img'); img.className = 'rm-photo'; img.alt = ''; img.decoding = 'async'; img.loading = 'lazy'; r.insertBefore(img, $('.rm-win', r)); }
  img.src = url; r.classList.add('has-photo');
}
rooms.forEach((r, i) => { if (r.dataset.photo) photo(i, r.dataset.photo); });

// ---------- Dach: Geometrie in Pixeln (Linien bleiben überall gleich fein) ----------
let W = 0;
function layoutRoof() {
  const hb = house.getBoundingClientRect();
  const eave = clamp(hb.width * 0.022, 10, 26);
  house.style.setProperty('--eave', eave.toFixed(1) + 'px');
  // Lage der Decke aus dem Layout (offsetLeft/-Width), nicht aus getBoundingClientRect: die Linie ist beim Zeichnen auf scaleX(0)
  const rb = roofSvg.getBoundingClientRect(), sb = ceil.offsetParent.getBoundingClientRect();
  W = rb.width; const H = rb.height; if (!W || !H) return;
  const cl = sb.left + ceil.offsetLeft - rb.left;
  const x0 = cl - eave, x1 = cl + ceil.offsetWidth + eave, mid = (x0 + x1) / 2, top = 1.5;
  const y = (x) => top + (H - top) * Math.abs(x - mid) / ((x1 - x0) / 2);
  roofSvg.setAttribute('viewBox', `0 0 ${W.toFixed(1)} ${H.toFixed(1)}`);
  rRoof.setAttribute('d', `M${x0.toFixed(1)} ${H} L${mid.toFixed(1)} ${top} L${x1.toFixed(1)} ${H}`);
  const cw = clamp((x1 - x0) * 0.022, 8, 22), xc = mid + (x1 - mid) * 0.46, yt = y(xc) - H * 0.4;
  rChim.setAttribute('d', `M${xc.toFixed(1)} ${y(xc).toFixed(1)} V${yt.toFixed(1)} H${(xc + cw).toFixed(1)} V${y(xc + cw).toFixed(1)}`);
  const r = clamp(H * 0.1, 3.5, 9), cy = H * 0.66;
  hopCs.forEach((c, k) => { c.setAttribute('cx', (mid + (k - 1) * r * 2.5).toFixed(1)); c.setAttribute('cy', cy.toFixed(1)); c.setAttribute('r', r.toFixed(1)); });
  if (drawState === 'prep') [rRoof, rChim, ...hopCs].forEach(prep);
}

// ---------- Linien zeichnen sich beim Hereinscrollen ----------
let drawState = 'idle';
const artEls = (r) => $$('.rm-win path, .rm-lamp path, .rm-art path', r);
function prep(el) {
  let L = 0; try { L = el.getTotalLength(); } catch (e) { /* ohne Länge → nur einblenden */ }
  el.style.transition = 'none';
  if (L > 0) { el.style.strokeDasharray = `${L} ${L}`; el.style.strokeDashoffset = L; } else el.style.opacity = 0;
}
function reveal(el, delay, dur) {
  el.style.transition = `stroke-dashoffset ${dur}s cubic-bezier(.45,.05,.25,1) ${delay}s, opacity ${dur}s ease ${delay}s, stroke .7s, fill .7s`;
  el.style.strokeDashoffset = 0; el.style.opacity = '';
}
const clearDash = (el) => { el.style.transition = ''; el.style.strokeDasharray = ''; el.style.strokeDashoffset = ''; el.style.opacity = ''; };
const allDrawEls = () => [headLine, rRoof, rChim, ...hopCs, ...rooms.flatMap(artEls)];
const instant = () => reduced || paused;

function drawHead() {
  if (instant()) return;
  reveal(headLine, 0, 1.1);
}
function drawHouse() {
  if (drawState !== 'prep') return;
  drawState = 'draw';
  if (instant()) { finishDraw(); return; }
  void house.offsetWidth; // Ausgangszustand festschreiben, sonst springt die Übergangsfahrt
  house.classList.add('draw');
  reveal(rRoof, 0.1, 1.3);
  reveal(rChim, 1.0, 0.6);
  hopCs.forEach((c, k) => reveal(c, 1.2 + k * 0.12, 0.7));
  rooms.forEach((r, i) => artEls(r).forEach((el, k) => reveal(el, 1.55 + i * 0.14 + k * 0.025, 1.0)));
  setTimeout(() => { if (cur < 0) setRoom(0, { scroll: false }); }, 2700); // „Licht geht an“ im Empfang
  setTimeout(finishDraw, 3900);
}
function finishDraw() {
  drawState = 'done';
  house.classList.remove('prep', 'draw');
  allDrawEls().forEach(clearDash);
  if (cur < 0) setRoom(0, { scroll: false });
}
if (instant()) { drawState = 'done'; setRoom0Later(); } else {
  drawState = 'prep'; house.classList.add('prep');
  allDrawEls().forEach(prep);
}
function setRoom0Later() { queueMicrotask(() => { if (cur < 0) setRoom(0, { scroll: false }); }); }

// ---------- Licht an: Raum wählen ----------
let cur = -1;
function setRoom(i, { scroll = true, focus = false, smooth = true } = {}) {
  i = ((i % N) + N) % N;
  const changed = i !== cur;
  cur = i;
  house.classList.add('lit');
  rooms.forEach((r, k) => {
    const on = k === i;
    r.classList.toggle('on', on);
    if (on) r.setAttribute('aria-current', 'true'); else r.removeAttribute('aria-current');
    r.tabIndex = on ? 0 : -1;
  });
  if (changed) cards.forEach((c, k) => c.classList.toggle('is-on', k === i));
  if (focus) rooms[i].focus({ preventScroll: true });
  if (scroll && mqMob.matches) centerRoom(i, smooth);
}
function endFinale() { house.classList.remove('all'); }

// Handy: Raum in die Mitte des Wischstreifens holen (nur waagrecht, die Seite springt nicht)
let lock = null, lockT = 0;
function centerRoom(i, smooth = true) {
  const rb = rooms[i].getBoundingClientRect(), cb = roomsEl.getBoundingClientRect();
  const d = rb.left + rb.width / 2 - (cb.left + cb.width / 2);
  if (Math.abs(d) < 2) return;
  lock = i; lockT = performance.now();
  roomsEl.scrollBy({ left: d, behavior: smooth && !reduced ? 'smooth' : 'auto' });
}
function nearest() {
  const cb = roomsEl.getBoundingClientRect(), c = cb.left + cb.width / 2;
  let best = 0, bd = Infinity;
  rooms.forEach((r, k) => { const b = r.getBoundingClientRect(), d = Math.abs(b.left + b.width / 2 - c); if (d < bd) { bd = d; best = k; } });
  return best;
}
let settleT = 0, scrollRaf = 0;
roomsEl.addEventListener('scroll', () => {
  if (!mqMob.matches) return;
  // Licht folgt dem Wischen (Raum in der Mitte), außer während einer eigenen Fahrt
  if (!scrollRaf) scrollRaf = requestAnimationFrame(() => {
    scrollRaf = 0;
    if (lock !== null && performance.now() - lockT < 1500) return;
    lock = null;
    const k = nearest(); if (k !== cur) { endFinale(); setRoom(k, { scroll: false }); }
  });
  clearTimeout(settleT);
  settleT = setTimeout(() => { lock = null; const k = nearest(); if (k !== cur) setRoom(k, { scroll: false }); }, 140);
}, { passive: true });
// Eigenes Wischen beendet den Rundgang und eine laufende Fahrt
const userSwipe = () => { lock = null; if (tour.on) stopTour(); };
roomsEl.addEventListener('touchstart', userSwipe, { passive: true });
roomsEl.addEventListener('wheel', (e) => { if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) userSwipe(); }, { passive: true });

rooms.forEach((r, i) => r.addEventListener('click', () => { stopTour(); endFinale(); setRoom(i); }));

// Tastatur: Pfeile/Pos1/Ende in der Raumreihe; ‹ › überall im Kapitel, solange kein Eingabefeld den Fokus hat
const step = (d, focus) => { stopTour(); endFinale(); setRoom((cur < 0 ? 0 : cur) + d, { focus }); };
roomsEl.addEventListener('keydown', (e) => {
  const k = e.key;
  if (k === 'ArrowRight' || k === 'ArrowDown') { e.preventDefault(); e.stopPropagation(); step(1, true); }
  else if (k === 'ArrowLeft' || k === 'ArrowUp') { e.preventDefault(); e.stopPropagation(); step(-1, true); }
  else if (k === 'Home') { e.preventDefault(); e.stopPropagation(); stopTour(); endFinale(); setRoom(0, { focus: true }); }
  else if (k === 'End') { e.preventDefault(); e.stopPropagation(); stopTour(); endFinale(); setRoom(N - 1, { focus: true }); }
});
const chapter = $('#dach');
document.addEventListener('keydown', (e) => {
  if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
  if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey || !houseVisible) return;
  const a = document.activeElement;
  if (a && a !== document.body && !chapter.contains(a)) return;
  if (a && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName)) return;
  e.preventDefault(); step(e.key === 'ArrowRight' ? 1 : -1, false);
});
$('#prev').addEventListener('click', () => step(-1, false));
$('#next').addEventListener('click', () => step(1, false));

// ---------- Rundgang: Licht wandert von Raum zu Raum (5 s je Raum) ----------
const DUR = 5000;
const tour = { on: false, held: false, t: 0, last: 0, raf: 0 };
function setPlay(state) { // 'start' | 'pause' | 'resume'
  playBtn.setAttribute('aria-pressed', state === 'pause' ? 'true' : 'false');
  playTxt.textContent = state === 'pause' ? 'Rundgang anhalten' : state === 'resume' ? 'Rundgang fortsetzen' : 'Rundgang starten';
}
function startTour() {
  endFinale();
  tour.on = true; tour.held = false; tour.t = 0; tour.last = performance.now();
  setRoom(0);
  progWrap.classList.add('on'); progEl.style.width = '0%';
  setPlay('pause');
  cancelAnimationFrame(tour.raf); tour.raf = requestAnimationFrame(tourLoop);
}
function stopTour() {
  if (!tour.on && !tour.held) return;
  tour.on = false; tour.held = false; cancelAnimationFrame(tour.raf);
  progWrap.classList.remove('on'); setPlay('start');
}
function holdTour() { tour.on = false; tour.held = true; cancelAnimationFrame(tour.raf); setPlay('resume'); }
function resumeTour() { tour.on = true; tour.held = false; tour.last = performance.now(); setPlay('pause'); tour.raf = requestAnimationFrame(tourLoop); }
function tourLoop(now) {
  if (!tour.on) return;
  const dt = Math.min(100, now - tour.last); tour.last = now;
  if (!paused && houseVisible && !document.hidden) tour.t += dt; // hält bei „Bewegung anhalten“ und außerhalb des Bildes
  const k = Math.floor(tour.t / DUR);
  if (k >= N) { // Ende: alle Fenster leuchten leise, das Logo im Giebel bekommt Farbe
    progEl.style.width = '100%';
    stopTour(); house.classList.add('all');
    return;
  }
  if (k !== cur) setRoom(k);
  progEl.style.width = (tour.t / (N * DUR) * 100).toFixed(2) + '%';
  tour.raf = requestAnimationFrame(tourLoop);
}
playBtn.addEventListener('click', () => { if (tour.on) holdTour(); else if (tour.held) resumeTour(); else startTour(); });

// ---------- Sichtbarkeit: zeichnen beim ersten Hereinscrollen, Rundgang ruht außerhalb ----------
let houseVisible = false;
new IntersectionObserver((es) => es.forEach((e) => {
  houseVisible = e.isIntersecting;
  if (e.isIntersecting && e.intersectionRatio >= 0.3) drawHouse();
}), { threshold: [0, 0.3, 0.6] }).observe(house);
new IntersectionObserver((es, ob) => es.forEach((e) => { if (e.isIntersecting) { drawHead(); ob.disconnect(); } }), { threshold: 0.6 }).observe(headLine.parentNode);

// ---------- Größe ändern / Handy ↔ PC ----------
layoutRoof();
let rzT = 0;
new ResizeObserver(() => { cancelAnimationFrame(rzT); rzT = requestAnimationFrame(() => { layoutRoof(); if (mqMob.matches && cur >= 0) centerRoom(cur, false); }); }).observe(house);
if (document.fonts) document.fonts.ready.then(layoutRoof);

window.__hausLicht = { state: () => ({ cur, drawState, tour: { ...tour }, paused, mob: mqMob.matches, W }), set: (i) => setRoom(i), photo };
