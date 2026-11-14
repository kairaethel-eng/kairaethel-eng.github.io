// Linienhaus „Licht im Fenster“ als Baustein (Auftrag H + 3A, 14.11.2026) – genutzt von der Entwurfsseite haus-licht.html
// und von Puls · Scan Kapitel 04 (Go Kai 14.11. „2a“). Reines SVG + CSS (house.css), kein WebGL.
// Aufgaben: Dach passend zur Breite zeichnen, Linien beim Hereinscrollen „zeichnen“, Licht an je Raum (roving tabindex,
// aria-current), Rundgang (5 s je Raum), Handy: waagrecht wischen mit Einrasten (natives scroll-snap – senkrecht scrollt
// immer die Seite), Rundgang aus Augenhöhe (Dialog, Zeichnung aus ego.js; Schichten Zeichnung → Foto → später Scan).
// opt: root (Element um Überschrift/Haus/Karten), isPaused() („Bewegung anhalten“), headLine:false (die Dachlinie über der
// Überschrift zeichnet die Seite selbst), onDialog(open) (z. B. Lenis anhalten), goto(hash) (Sprungziel aus dem Dialog).
import { renderRoom } from './ego.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));

export function initHouse(opt = {}) {
const root = opt.root || document.getElementById('dach');
const isPaused = opt.isPaused || (() => false);
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const mqMob = matchMedia('(max-width:920px)');
// ---------- Elemente ----------
const house = $('#house'), roofSvg = $('#roofSvg'), rRoof = $('#rRoof'), rChim = $('#rChim'), hopCs = $$('#rHop circle');
const ceil = $('.ln-ceil', root), roomsEl = $('#rooms'), rooms = $$('.room', roomsEl), cards = $$('.card', root);
const playBtn = $('#play'), playTxt = $('#playTxt'), progEl = $('#prog'), progWrap = progEl.parentElement;
const headLine = opt.headLine === false ? null : $('.roofline path', root);
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
let drawState = 'idle', drawT0 = 0;
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
const allDrawEls = () => [headLine, rRoof, rChim, ...hopCs, ...rooms.flatMap(artEls)].filter(Boolean);
const instant = () => reduced || isPaused();

function drawHead() {
  if (instant() || !headLine) return;
  reveal(headLine, 0, 1.1);
}
function drawHouse() {
  if (drawState !== 'prep') return;
  drawState = 'draw';
  if (instant()) { finishDraw(); return; }
  void house.offsetWidth; // Ausgangszustand festschreiben, sonst springt die Übergangsfahrt
  house.classList.add('draw');
  drawT0 = performance.now();
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
const chapter = root;
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
  if (!isPaused() && houseVisible && !document.hidden) tour.t += dt; // hält bei „Bewegung anhalten“ und außerhalb des Bildes
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
if (headLine) new IntersectionObserver((es, ob) => es.forEach((e) => { if (e.isIntersecting) { drawHead(); ob.disconnect(); } }), { threshold: 0.6 }).observe(headLine.parentNode);

// ---------- Größe ändern / Handy ↔ PC ----------
layoutRoof();
let rzT = 0;
new ResizeObserver(() => { cancelAnimationFrame(rzT); rzT = requestAnimationFrame(() => { layoutRoof(); if (mqMob.matches && cur >= 0) centerRoom(cur, false); }); }).observe(house);
if (document.fonts) document.fonts.ready.then(layoutRoof);

// ---------- Rundgang aus Augenhöhe (Variante 3A) ----------
const dlg = $('#ego'), stage = $('#egoStage'), egoText = $('#egoText'), egoNo = $('#egoNo'), egoPanel = $('#egoPanel');
const egoPrev = $('#egoPrev'), egoNext = $('#egoNext'), egoDots = $$('#egoDots button'), egoOpenBtn = $('#egoOpen');
const ego = { i: 0, view: null, opener: null, litT: 0 };
function egoFrame() { // Bühnengröße + freie Fläche neben dem Text (PC) → Fluchtpunkt
  const sb = stage.getBoundingClientRect();
  if (mqMob.matches) return { sw: sb.width, sh: sb.height, o: {} };
  const pw = Math.min(egoPanel.getBoundingClientRect().right - sb.left, sb.width * 0.45) * 0.95;
  return { sw: sb.width, sh: sb.height, o: { cx: pw + (sb.width - pw) / 2, fitW: sb.width - pw } };
}
function egoBuild(i) {
  const v = document.createElement('div'); v.className = 'ego-view'; v.dataset.room = i;
  const media = document.createElement('div'); media.className = 'ego-media'; v.appendChild(media);
  // Schicht 2: Foto (gleiche Datei wie im Haus); Schicht 3 (Scan) kommt später ebenfalls in .ego-media
  const ph = rooms[i].dataset.photo || $('.rm-photo', rooms[i])?.getAttribute('src');
  if (ph) { const img = document.createElement('img'); img.alt = ''; img.decoding = 'async'; img.src = ph; media.appendChild(img); v.classList.add('has-photo'); }
  const fr = egoFrame();
  v.insertAdjacentHTML('beforeend', renderRoom(i, fr.sw, fr.sh, fr.o));
  v.style.setProperty('--vx', ((fr.o.cx ?? fr.sw / 2) / fr.sw * 100).toFixed(1) + '%');
  return v;
}
function egoUi(i) {
  egoNo.textContent = String(i + 1).padStart(2, '0');
  egoText.innerHTML = cards[i].innerHTML; // fester Inhalt dieser Seite (Kartentexte)
  egoDots.forEach((b, k) => { if (k === i) b.setAttribute('aria-current', 'true'); else b.removeAttribute('aria-current'); });
  egoPrev.disabled = i === 0;
  egoNext.setAttribute('aria-label', i === N - 1 ? 'Rundgang beenden' : 'Nächster Raum');
  endFinale(); setRoom(i, { scroll: false }); // das Haus darunter zieht mit
}
function egoLight(v, delay) {
  clearTimeout(ego.litT);
  if (reduced || isPaused() || !delay) { v.classList.add('lit'); return; }
  ego.litT = setTimeout(() => v.classList.add('lit'), delay); // „Licht an“ nach dem Ankommen
}
const anim = (el, kf, o) => (el.animate && !reduced ? el.animate(kf, { fill: 'both', easing: 'cubic-bezier(.2,.7,.1,1)', ...o }) : null);
const drop = (el) => el.parentNode && el.parentNode.removeChild(el);
function egoShow(i, dir) {
  i = clamp(i, 0, N - 1);
  if (ego.view && i === ego.i) return;
  const old = ego.view, v = egoBuild(i);
  stage.appendChild(v); ego.view = v; ego.i = i; egoUi(i);
  if (old) {
    const a = anim(old, [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: `translateX(${-dir * 7}%) scale(1.14)` }], { duration: 480 });
    if (a) a.finished.then(() => drop(old), () => drop(old)); else drop(old);
    anim(v, [{ opacity: 0, transform: `translateX(${dir * 7}%) scale(.93)` }, { opacity: 1, transform: 'none' }], { duration: 700, delay: 120 });
  }
  egoLight(v, old ? 650 : 0);
}
function egoOpen(i) {
  stopTour();
  ego.opener = document.activeElement;
  document.documentElement.classList.add('ego-open');
  if (opt.onDialog) opt.onDialog(true);
  const from = rooms[i].getBoundingClientRect();
  dlg.showModal();
  stage.textContent = ''; ego.view = null;
  egoShow(i, 0);
  const v = ego.view, sb = stage.getBoundingClientRect();
  // Einflug: der Raum aus dem Haus öffnet sich zum Bildschirm, man tritt hinein
  const ins = `inset(${Math.max(0, from.top - sb.top)}px ${Math.max(0, sb.right - from.right)}px ${Math.max(0, sb.bottom - from.bottom)}px ${Math.max(0, from.left - sb.left)}px)`;
  anim(stage, [{ clipPath: ins }, { clipPath: 'inset(0px 0px 0px 0px)' }], { duration: 900 });
  anim(v, [{ transform: 'scale(.62)' }, { transform: 'none' }], { duration: 1100 });
  anim(dlg, [{ opacity: 0 }, { opacity: 1 }], { duration: 350, easing: 'linear' });
  ['.ego-top', '.ego-panel'].forEach((s) => anim($(s, dlg), [{ opacity: 0 }, { opacity: 1 }], { duration: 500, delay: 650 }));
  ego.view.classList.remove('lit'); egoLight(v, 950);
  egoNext.focus({ preventScroll: true });
}
function egoClose() {
  if (!dlg.open) return;
  const done = () => {
    if (!dlg.open) return;
    dlg.close(); document.documentElement.classList.remove('ego-open'); stage.textContent = ''; ego.view = null; clearTimeout(ego.litT);
    if (opt.onDialog) opt.onDialog(false);
    if (mqMob.matches) centerRoom(ego.i, false);
    (ego.opener && ego.opener.isConnected ? ego.opener : egoOpenBtn).focus({ preventScroll: true });
  };
  const a = anim(dlg, [{ opacity: 1 }, { opacity: 0 }], { duration: 260, easing: 'linear' });
  if (a) a.finished.then(done, done); else done();
}
egoOpenBtn.addEventListener('click', () => egoOpen(cur < 0 ? 0 : cur));
$('#egoClose').addEventListener('click', egoClose);
dlg.addEventListener('cancel', (e) => { e.preventDefault(); egoClose(); });
egoPrev.addEventListener('click', () => egoShow(ego.i - 1, -1));
egoNext.addEventListener('click', () => (ego.i === N - 1 ? egoClose() : egoShow(ego.i + 1, 1)));
egoDots.forEach((b, k) => b.addEventListener('click', () => egoShow(k, k > ego.i ? 1 : -1)));
dlg.addEventListener('keydown', (e) => {
  const k = e.key;
  if (k === 'ArrowRight') { e.preventDefault(); if (ego.i < N - 1) egoShow(ego.i + 1, 1); }
  else if (k === 'ArrowLeft') { e.preventDefault(); egoShow(ego.i - 1, -1); }
  else if (k === 'Home') { e.preventDefault(); egoShow(0, -1); }
  else if (k === 'End') { e.preventDefault(); egoShow(N - 1, 1); }
});
// Wischen über die Bühne: waagrecht = Raum wechseln (senkrecht bleibt frei)
let sw0 = null;
stage.addEventListener('pointerdown', (e) => { sw0 = { x: e.clientX, y: e.clientY }; });
stage.addEventListener('pointerup', (e) => {
  if (!sw0) return; const dx = e.clientX - sw0.x, dy = e.clientY - sw0.y; sw0 = null;
  if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.3) { if (dx < 0 && ego.i < N - 1) egoShow(ego.i + 1, 1); else if (dx > 0) egoShow(ego.i - 1, -1); }
});
stage.addEventListener('pointercancel', () => { sw0 = null; });
// Größe ändern: Zeichnung neu projizieren (ohne Übergang)
new ResizeObserver(() => {
  if (!dlg.open || !ego.view) return;
  const v = ego.view, fr = egoFrame(), svg = $('.ego-svg', v);
  if (svg) svg.outerHTML = renderRoom(ego.i, fr.sw, fr.sh, fr.o);
  v.style.setProperty('--vx', ((fr.o.cx ?? fr.sw / 2) / fr.sw * 100).toFixed(1) + '%');
}).observe(stage);

// Links in der Dialog-Karte (z. B. „Manuthera ansehen“ in Puls): erst schließen, dann springen
egoText.addEventListener('click', (e) => {
  const a = e.target.closest('a[href^="#"]'); if (!a) return;
  e.preventDefault(); const h = a.getAttribute('href'); egoClose();
  setTimeout(() => (opt.goto ? opt.goto(h) : document.querySelector(h)?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' })), 300);
});

// Für die Seite: Lage der Dachlinie auf dem Bildschirm (Partikel fließen hinein) und wie weit sie gezeichnet ist (0..1)
function roofScreen() {
  const rb = roofSvg.getBoundingClientRect(), vb = roofSvg.viewBox.baseVal, d = (rRoof.getAttribute('d') || '').match(/-?[\d.]+/g);
  if (!d || d.length < 6 || !vb || !vb.width) return null;
  const sx = rb.width / vb.width, sy = rb.height / vb.height;
  return { l: rb.left + +d[0] * sx, r: rb.left + +d[4] * sx, top: rb.top + +d[3] * sy, bot: rb.top + +d[1] * sy };
}
const roofK = () => (drawState === 'done' ? 1 : drawState === 'draw' ? clamp((performance.now() - drawT0 - 100) / 1300, 0, 1) : 0);
return {
  state: () => ({ cur, drawState, tour: { ...tour }, paused: isPaused(), mob: mqMob.matches, W }),
  set: (i) => setRoom(i), photo, roofScreen, roofK, visible: () => houseVisible,
  egoOpen: () => dlg.open,
  ego: { open: (i = 0) => egoOpen(i), show: (i) => egoShow(i, 1), close: egoClose, state: () => ({ i: ego.i, open: dlg.open, lit: !!ego.view?.classList.contains('lit') }) },
};
}
