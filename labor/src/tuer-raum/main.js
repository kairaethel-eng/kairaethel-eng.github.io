// Entwurfsseite „Tür · Raum“ (22.11.2026, Go Kai „a c“; zweite Runde Go Kai „Empfehlung“: der Text lebt im Raum): Kapitel 05 von Puls als Raum.
// Kai: „Tür klicken, danach weiterhin wie herein treten, der Rahmen der Tür ist dann wie die Bildschirmumrandung, danach wie als ob man sich
// umsehen kann und alle relevanten Infos erscheinen dort, wo man sich praktisch umsieht.“
//   A „Der Empfang“: Tür antippen → sie geht auf, man geht hindurch, der Rahmen legt sich an den Bildschirmrand. Drinnen vier Blickrichtungen
//     (Empfang · Uhr · Ablage · Fenster); Wischen, ‹ › oder die Punkte drehen den Blick ruhig über die Zeit (ROT_SEK). „Termin buchen“ steht immer da.
//   C „Kopf drehen“: am PC folgt der Raum der Maus um wenige Grad; am Handy folgt er beim Wischen dem Finger, bevor er weiterdreht.
//   Runde 2: Jede Richtung trägt ihren Text als echte Textfläche an der Wand (scharf, lesbar, antippbar), mit derselben Kamera wie die Punkte
//   in den Raum gelegt (Homographie → CSS matrix3d) – sie dreht sich perspektivisch mit und blendet aus, wenn man wegschaut. Am Handy steht
//   die Wandschrift über den Dingen, am PC daneben. Terminbuch, Telefon und Fenster sind antippbar (Termin · anrufen · Karte).
//   Die Zeichenfläche liegt IN der Bühne (scrollt mit ihr als ein Stück) und rechnet in Bühnen-Koordinaten – vorher lag sie fest über dem
//   Fenster und hinkte beim Wischen am iPhone dem Text hinterher.
// Ohne JavaScript, ohne Grafikchip oder bei „Bewegung anhalten/reduzieren“: die vier Blöcke stehen als Kontaktteil einfach untereinander.
// Puls (src/test-4) und die Tür-Bühne (src/tuer/buehne.js) sind unberührt. Prüfhilfe: window.__raum.
import { initStage } from './stage.js';
import { STATIONS, PITCH0, GEO } from './raum.js';

const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const H = document.documentElement;
const Q = new URLSearchParams(location.search);
const reducedMq = matchMedia('(prefers-reduced-motion: reduce)');
const isDesktop = () => innerWidth > 920;
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const easeSine = (x) => 0.5 - 0.5 * Math.cos(Math.PI * Math.min(1, Math.max(0, x)));

// ---------- Bewegung anhalten (gleiche Wahl wie auf den anderen Labor-Seiten) ----------
let paused = false;
try { paused = localStorage.getItem('hop-motion') === 'paused'; } catch (e) { /* ohne Speicher */ }
const still = () => paused || reducedMq.matches;
const motionBtn = $('#motionBtn');
function setPaused(v, save = true) {
  paused = v;
  H.classList.toggle('paused', v);
  motionBtn.setAttribute('aria-pressed', String(v));
  const t = v ? 'Bewegung fortsetzen' : 'Bewegung anhalten';
  motionBtn.setAttribute('aria-label', t); motionBtn.title = t;
  if (save) try { localStorage.setItem('hop-motion', v ? 'paused' : 'on'); } catch (e) { /* ohne Speicher */ }
}
motionBtn.addEventListener('click', () => setPaused(!paused));
setPaused(paused, false);

// ---------- Überschrift „Die Tür steht offen.“ und Auftakt wie in Puls ----------
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
const io1 = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add(e.target === tTitle ? 'open' : 'in'); io1.unobserve(e.target); } }), { threshold: 0.4 });
io1.observe(tTitle); $$('.auftakt-blk').forEach((a) => io1.observe(a));

// ---------- Blickrichtungen (Reiter) ----------
const tabs = $$('.raum-tabs [role="tab"]'), panels = $$('.rp'), raumEl = $('#raum'), hits = $$('.hit');
let cur = 0, turned = false, praxisOpen = false, hot = -1;
const ROT_SEK = 2.0, DOOR_SEK = 4.2, ROOM_SEK = 2.6;
let yawFrom = 0, yawTo = 0, yawT = 1; // Drehung über die Zeit (yawT 0 … 1)
let drag = 0; // Finger: Versatz in Bogenmaß
const yawBase = () => yawFrom + (yawTo - yawFrom) * easeSine(yawT);
function go(k, how = 'turn') {
  const n = ((k % STATIONS) + STATIONS) % STATIONS;
  const step = k - cur; // Richtung behalten: ‹ dreht nach links, › nach rechts (auch über die Runde hinaus)
  const now = yawBase() + drag;
  cur = n;
  tabs.forEach((t, i) => { t.setAttribute('aria-selected', String(i === n)); t.tabIndex = i === n ? 0 : -1; });
  let target = yawTo + step * (Math.PI / 2);
  if (how === 'tab') { let d = n * (Math.PI / 2) - (((yawTo % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)); if (d > Math.PI) d -= 2 * Math.PI; if (d < -Math.PI) d += 2 * Math.PI; target = yawTo + d; }
  yawFrom = now; yawTo = target; yawT = still() || how === 'now' ? 1 : 0; drag = 0;
  if (step || how === 'tab') { turned = true; H.classList.add('raum-turned'); }
}
tabs.forEach((t, i) => t.addEventListener('click', () => { if (i !== cur) go(i, 'tab'); }));
$('#rnPrev').addEventListener('click', () => go(cur - 1));
$('#rnNext').addEventListener('click', () => go(cur + 1));
$('.raum-tabs').addEventListener('keydown', (e) => {
  const k = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
  if (!k && e.key !== 'Home' && e.key !== 'End') return;
  e.preventDefault();
  if (k) go(cur + k); else go(e.key === 'Home' ? 0 : STATIONS - 1, 'tab');
  tabs[cur].focus();
});

// ---------- Bühne ----------
const cv = $('#cStage'), glowEl = $('#cGlow'), track = $('#doorTrack'), sticky = $('.door-sticky'), hit = $('#doorHit'), cue = $('.door-cue'), nav = $('.top'), topEl = $('.door-top'), bar = $('.raum-bar');
let st = null, failed = false, on = false, walk = null, opened = false, doorP = 0, fT = 0, rIn = 0, lastCue = -1, lastTop = -1, roomOn = false;
const soft = Q.get('gl') === '1';
const resetBoards = () => { [...panels, ...hits].forEach((el) => { el.style.transform = ''; el.style.opacity = ''; el.style.visibility = ''; el.style.width = ''; el.style.height = ''; }); lay = null; };
const setWalk = (v) => { if (v === walk) return; walk = v; H.classList.toggle('door-walk', v); if (!v) { H.classList.remove('raum-on'); resetBoards(); } };
const off = () => { if (!on) return; on = false; cv.classList.remove('on'); glowEl.classList.remove('on'); if (st) st.clear(); };
const open = (now) => { if (!opened) { opened = true; if (hit) hit.hidden = true; } if (now) { doorP = 1; rIn = 1; } };
hit.addEventListener('click', () => open(false));
raumEl.addEventListener('focusin', () => { if (walk && !opened) open(true); else if (walk && rIn < 1) rIn = 1; });
// Uhrzeit für die Zeiger (Praxis-Zeit)
let hh = 0, mm = 0;
const tick = () => { try { const p = {}; new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Berlin', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date()).forEach((x) => { p[x.type] = x.value; }); hh = +p.hour; mm = +p.minute; } catch (e) { const d = new Date(); hh = d.getHours(); mm = d.getMinutes(); } };
tick(); setInterval(tick, 15000);

// ---------- Schrift im Raum: Lage der Wandschrift je Richtung, Brennweite und Ausschnitt ----------
// Handy: Wandschrift über den Dingen, Unterkante je Richtung (YB, lokale Höhe an der Wand). PC: rechts neben den Dingen, mittig.
// Die Textflächen bekommen ihre Breite in Bildpunkten (W0) – frontal gesehen sind sie genau so groß wie gesetzt, also scharf.
const YB = [0.12, 0.5, -0.1, 0.44], OBJ_LOW = -0.95, OBJ_HALF = 0.85, D_OBJ = GEO.R, D_WALL = GEO.WALL, EYE = GEO.EYE_UP;
const HITQ = [[-0.25, -0.22, 0.37, 0.05, 0.04], null, [-0.42, -0.46, 0.03, -0.25, 0.0], [-0.62, -0.44, 0.62, 0.36, GEO.WALL - GEO.R]]; // x0 y0 x1 y1 z (lokal)
let lay = null;
function layout(w, h, desk) {
  const rem = parseFloat(getComputedStyle(H).fontSize) || 16;
  const key = `${w}|${h}|${desk}|${rem}`;
  if (lay && lay.key === key) return lay;
  const W0 = Math.round(desk ? Math.min(w * 0.32, 30 * rem) : Math.min(w - 3 * rem, 23 * rem));
  panels.forEach((p) => { p.style.width = W0 + 'px'; });
  const Hs = panels.map((p) => p.offsetHeight);
  const topEl0 = HV && hvBarEl ? hvBarEl : nav, navB = topEl0 ? topEl0.getBoundingClientRect().bottom : 0, ins = desk ? 14 : 8;
  const top = navB + (desk ? 28 : 16), botm = (bar ? bar.offsetTop : h - 120) - (desk ? 24 : 14), aH = Math.max(160, botm - top), mid = (top + botm) / 2;
  let F, cx, yEye;
  if (!desk) {
    let Fh = Infinity; YB.forEach((yb, k) => { Fh = Math.min(Fh, (aH - Hs[k] - 8) / ((-OBJ_LOW + EYE) / D_OBJ + (yb - EYE) / D_WALL)); });
    F = Math.max(180, Math.min(Fh, (w * 0.94 * D_OBJ) / (2 * OBJ_HALF), 900));
    const botRel = ((EYE - OBJ_LOW) * F) / D_OBJ;
    let topRel = 0; YB.forEach((yb, k) => { topRel = Math.min(topRel, -((yb - EYE) * F) / D_WALL - Hs[k]); });
    yEye = mid - (topRel + botRel) / 2; cx = w / 2;
  } else {
    const gap = 4 * rem;
    F = Math.max(300, Math.min((aH * 0.9) / ((EYE - OBJ_LOW) / D_OBJ + 0.2 / D_WALL), (w * 0.86 - W0 - gap) / ((2 * OBJ_HALF) / D_OBJ)));
    const half = (OBJ_HALF * F) / D_OBJ, left = -half, right = half + gap + W0;
    cx = w / 2 - (left + right) / 2;
    const topRel = -((0.5 - EYE) * F) / D_WALL, botRel = ((EYE - OBJ_LOW) * F) / D_OBJ;
    yEye = mid - (topRel + botRel) / 2;
    lay = { gapPx: gap };
  }
  const sp = ((desk ? 5.6 : 4.4) * D_OBJ) / F;
  lay = { ...(lay || {}), key, W0, Hs, F, cx, yEye, sp, desk, mid, border: [ins, navB + 6, w - ins, h - ins], rect: [0, top - 30, w, botm + 30] };
  // Wandschrift je Richtung: Ecken lokal (oben links, oben rechts, unten rechts, unten links)
  const zW = D_WALL - D_OBJ - 0.012, s = D_WALL / F;
  lay.boards = Hs.map((hp, k) => {
    const bw = W0 * s, bh = hp * s;
    let x0, y0;
    if (!desk) { x0 = -bw / 2; y0 = YB[k]; }
    else { x0 = (OBJ_HALF * F / D_OBJ + lay.gapPx) * s; y0 = EYE + (yEye - mid) * s - bh / 2; }
    return [[x0, y0 + bh, zW], [x0 + bw, y0 + bh, zW], [x0 + bw, y0, zW], [x0, y0, zW]];
  });
  return lay;
}
// Element (W × H Bildpunkte) → Viereck im Bild (oben links, oben rechts, unten rechts, unten links): CSS matrix3d (Homographie)
function quadMatrix(W, Hh, q) {
  const [x0, y0, x1, y1, x2, y2, x3, y3] = q;
  const dx1 = x1 - x2, dx2 = x3 - x2, dx3 = x0 - x1 + x2 - x3, dy1 = y1 - y2, dy2 = y3 - y2, dy3 = y0 - y1 + y2 - y3;
  const det = dx1 * dy2 - dx2 * dy1;
  if (Math.abs(det) < 1e-9) return null;
  const g = (dx3 * dy2 - dx2 * dy3) / det, hq = (dx1 * dy3 - dx3 * dy1) / det;
  const a = (x1 - x0 + g * x1) / W, b = (x3 - x0 + hq * x3) / Hh, d = (y1 - y0 + g * y1) / W, e = (y3 - y0 + hq * y3) / Hh;
  return `matrix3d(${a.toFixed(6)},${d.toFixed(6)},0,${(g / W).toFixed(9)},${b.toFixed(6)},${e.toFixed(6)},0,${(hq / Hh).toFixed(9)},0,0,1,0,${x0.toFixed(2)},${y0.toFixed(2)},0,1)`;
}
const angTo = (yaw, k) => { let d = (((yaw - (k * Math.PI) / 2) % (2 * Math.PI)) + 3 * Math.PI) % (2 * Math.PI) - Math.PI; return Math.abs(d); };
const boardKey = panels.map(() => ''), hitKey = hits.map(() => '');
function placeBoards(cam) {
  panels.forEach((p, k) => {
    const d = angTo(cam.yaw, k), op = roomOn ? (1 - smooth(0.1, 0.5, d)) * smooth(0.35, 0.9, rIn) : 0;
    let tf = '';
    if (op > 0.005) {
      const q = []; for (const c of lay.boards[k]) { const r = st.project(k, c[0], c[1], c[2], cam); if (!r) { q.length = 0; break; } q.push(r[0], r[1]); }
      if (q.length === 8) tf = quadMatrix(lay.W0, lay.Hs[k], q) || '';
    }
    const key = `${op.toFixed(3)}|${tf}`;
    if (key === boardKey[k]) return; boardKey[k] = key;
    p.style.transform = tf; p.style.opacity = tf ? op.toFixed(3) : '0'; p.style.visibility = tf && op > 0.02 ? 'visible' : 'hidden';
  });
  hits.forEach((a, i) => {
    const k = +a.dataset.k, hq = HITQ[k], act = roomOn && rIn > 0.9 && yawT >= 1 && !drag && angTo(cam.yaw, k) < 0.12;
    let tf = '';
    if (act) {
      const q = []; for (const c of [[hq[0], hq[3]], [hq[2], hq[3]], [hq[2], hq[1]], [hq[0], hq[1]]]) { const r = st.project(k, c[0], c[1], hq[4], cam); if (!r) { q.length = 0; break; } q.push(r[0], r[1]); }
      if (q.length === 8) tf = quadMatrix(100, 100, q) || '';
    }
    if (tf === hitKey[i]) return; hitKey[i] = tf;
    a.style.transform = tf; a.style.visibility = tf ? 'visible' : 'hidden';
    if (!tf && hot === k) hot = -1;
  });
}
hits.forEach((a) => { a.addEventListener('pointerenter', () => { hot = +a.dataset.k; }); a.addEventListener('pointerleave', () => { hot = -1; }); });

// C: Kopf drehen – Maus (PC) bzw. Finger beim Wischen (Handy)
let pyT = 0, psT = 0, py = 0, ps = 0, suppress = 0;
const fine = matchMedia('(hover: hover) and (pointer: fine)');
sticky.addEventListener('pointermove', (e) => {
  if (e.pointerType !== 'mouse' || !fine.matches || !roomOn) return;
  pyT = (e.clientX / innerWidth - 0.5) * 0.07; psT = -(e.clientY / innerHeight - 0.5) * 16;
});
sticky.addEventListener('pointerleave', () => { pyT = 0; psT = 0; });
{
  let sx = 0, sy = 0, id = null, horiz = null, t0 = 0;
  const W = () => Math.max(320, sticky.clientWidth);
  sticky.addEventListener('pointerdown', (e) => {
    if (!roomOn || e.pointerType === 'mouse' || e.target.closest('.raum-bar')) return; // auch auf Schrift und Links darf man wischen
    id = e.pointerId; sx = e.clientX; sy = e.clientY; horiz = null; t0 = performance.now();
  });
  sticky.addEventListener('pointermove', (e) => {
    if (e.pointerId !== id) return;
    const dx = e.clientX - sx, dy = e.clientY - sy;
    if (horiz === null && Math.hypot(dx, dy) > 10) horiz = Math.abs(dx) > Math.abs(dy) * 1.2;
    if (horiz && !still()) drag = Math.max(-0.7, Math.min(0.7, (-dx / W()) * 1.25));
  });
  const end = (e) => {
    if (e.pointerId !== id) return;
    const dx = e.clientX - sx, fast = Math.abs(dx) / Math.max(1, performance.now() - t0) > 0.35;
    id = null;
    if (horiz) suppress = performance.now() + 450; // ein Wisch über Terminbuch oder Link löst ihn nicht aus
    if (horiz && (Math.abs(dx) > 48 || (fast && Math.abs(dx) > 20))) go(cur + (dx < 0 ? 1 : -1));
    else if (drag) { yawFrom = yawBase() + drag; yawT = 0; drag = 0; } // zurückfedern
    horiz = null;
  };
  sticky.addEventListener('pointerup', end); sticky.addEventListener('pointercancel', end);
  sticky.addEventListener('click', (e) => { if (performance.now() < suppress && e.target.closest('a,button')) { e.preventDefault(); e.stopPropagation(); } }, true);
}

// ---------- Beispiel „Hervorheben“ (tuer-hervorheben.html, html.studie-hervor; Kai 23.11.: „an einem Beispiel zeigen“) ----------
// Nur der Blick „vorne · Empfang“: A Bernstein-Kanten am Terminbuch · B Leuchtpunkt-Pille „Termin buchen“ am Tresen · C beim Ankommen fällt
// einmal Licht aufs Buch. Dazu Rückmeldung beim Antippen (Buch leuchtet kurz auf). Umschalter: Vorher · A · B · C · Alle.
const HV = H.classList.contains('studie-hervor');
const hvS = { mode: 'alle', t: -1, flashAt: -9, used: false };
let hvPill = null, hvBarEl = null;
const hvFlags = () => ({ edge: hvS.mode === 'a' || hvS.mode === 'alle', pill: hvS.mode === 'b' || hvS.mode === 'alle', light: hvS.mode === 'c' || hvS.mode === 'alle' });
function hvReplay() { hvS.t = -1; if (hvPill) hvPill.classList.remove('is-in'); }
if (HV) {
  const termin = 'https://termine.opticaviva.de/a/OdP5VfcRbLlahtgHFBJAi1O99CVzeCnx';
  hvPill = document.createElement('a');
  hvPill.className = 'hv-pill is-pulse'; hvPill.href = termin; hvPill.target = '_blank'; hvPill.rel = 'noopener';
  hvPill.innerHTML = '<b class="hv-orb" aria-hidden="true"><i></i></b><span>Termin buchen</span>';
  raumEl.appendChild(hvPill);
  const flash = () => { hvS.flashAt = performance.now(); hvS.used = true; hvPill.classList.remove('is-pulse'); };
  hvPill.addEventListener('click', flash);
  const h0 = $('.hit[data-k="0"]'); if (h0) h0.addEventListener('click', flash);
  const bar = document.createElement('div');
  bar.className = 'hv-bar'; bar.setAttribute('role', 'group'); bar.setAttribute('aria-label', 'Beispiel: anklickbare Dinge hervorheben');
  bar.innerHTML = '<span class="hv-t">Beispiel · Terminbuch</span>' + [['vorher', 'Vorher'], ['a', 'A Kanten'], ['b', 'B Pille'], ['c', 'C Licht'], ['alle', 'Alle']].map(([v, l]) => `<button type="button" data-v="${v}" aria-pressed="${v === 'alle'}">${l}</button>`).join('') + '<button type="button" class="hv-again" data-again>↻ Ankommen</button>';
  document.body.appendChild(bar); hvBarEl = bar;
  const setMode = (m) => {
    hvS.mode = m; bar.querySelectorAll('[data-v]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.v === m)));
    const f = hvFlags(); H.classList.toggle('hv-pill-on', f.pill); lay = null; hvReplay();
    if (!hvS.used) hvPill.classList.add('is-pulse');
  };
  bar.addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; if (b.dataset.again !== undefined) { if (cur !== 0) go(0, 'tab'); hvReplay(); } else setMode(b.dataset.v); });
  setMode(new URLSearchParams(location.search).get('v') || 'alle');
  // gleich in den Raum: zur Bühne, Tür offen, vorne
  addEventListener('load', () => { setTimeout(() => { scrollTo(0, track.getBoundingClientRect().top + scrollY); open(true); }, 300); });
}
function hvFrame(dt, cam) {
  if (!HV || !roomOn) return null;
  const f = hvFlags(), atFront = cur === 0 && yawT >= 1 && rIn >= 1 && angTo(cam.yaw, 0) < 0.06;
  if (atFront) hvS.t = hvS.t < 0 ? 0 : hvS.t + dt; else if (angTo(cam.yaw, 0) > 0.8) hvReplay(); // beim Wiederkommen erneut ankommen
  const t = Math.max(0, hvS.t);
  const beam = !f.light || hvS.t < 0 ? 0 : t < 0.9 ? easeSine(t / 0.9) : 0.3 + 0.7 * Math.exp(-(t - 0.9) / 1.3);
  const glow = !f.light || hvS.t < 0 ? 0 : Math.max(0, 1 - Math.abs(t - 0.9) / 1.1);
  const flash = Math.max(0, 1 - (performance.now() - hvS.flashAt) / 700);
  // Pille (B): sitzt mittig auf der Tresenfront unter dem Buch, erscheint nach dem Licht aus Staub (CSS)
  if (hvPill) {
    const show = f.pill && hvS.t >= (f.light ? 0.75 : 0.15);
    hvPill.classList.toggle('is-in', show);
    const p = st.project(0, 0.06, -0.38, -0.012, cam), op = 1 - smooth(0.06, 0.4, angTo(cam.yaw, 0));
    if (p && op > 0.01) { hvPill.style.transform = `translate(${p[0].toFixed(1)}px,${p[1].toFixed(1)}px) translate(-50%,-50%)`; hvPill.style.opacity = op.toFixed(3); hvPill.style.visibility = 'visible'; }
    else { hvPill.style.opacity = '0'; hvPill.style.visibility = 'hidden'; }
  }
  const hv = { k: 0, edge: f.edge, glow, beam, flash };
  return { hv, hvKey: `${hvS.mode}|${beam.toFixed(3)}|${glow.toFixed(3)}|${flash.toFixed(3)}` };
}

// Messanzeige ?takt=1 (Bilder je Sekunde)
const takt = Q.get('takt') === '1' ? Object.assign(document.body.appendChild(document.createElement('div')), { className: 'takt' }) : null;
let tn = 0, tt = 0;
if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { lay = null; });
addEventListener('resize', () => { lay = null; });

let last = performance.now();
function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min(0.1, (now - last) / 1000); last = now;
  if (takt) { tn++; tt += dt; if (tt >= 1) { takt.textContent = `${Math.round(tn / tt)} B/s · ${st ? st.points : 0} Punkte`; tn = 0; tt = 0; } }
  setWalk(!still() && !failed);
  if (!walk) { off(); return; }
  const r = track.getBoundingClientRect(), vh = innerHeight;
  if (!opened && r.height > vh * 0.5 && r.bottom < vh * 0.3) open(true); // ohne Antippen vorbeigescrollt: beim Zurückkommen offen
  if (r.top > vh * 1.5 || r.bottom < -vh * 0.3) { off(); return; }
  if (!st) { st = initStage({ cv, glow: glowEl, isStill: still, soft, roomOpts: HV ? { logoY: -0.72 } : undefined }); if (!st) { failed = true; return; } }
  if (st.dead) { failed = true; return; }
  if (!on) { on = true; cv.classList.add('on'); glowEl.classList.add('on'); }
  // alles in Bühnen-Koordinaten: die Zeichenfläche liegt in der Bühne und scrollt mit ihr
  const S = sticky.getBoundingClientRect(), w = sticky.clientWidth, h = sticky.clientHeight, desk = isDesktop();
  const L = layout(w, h, desk);
  if (r.top < vh * 0.6) fT = Math.min(1, fT + dt / 3.6);
  if (opened) doorP = Math.min(1, doorP + dt / DOOR_SEK);
  const hb = tTitle.getBoundingClientRect().bottom - S.top;
  if (st.p >= 0.5) rIn = Math.min(1, rIn + dt / ROOM_SEK); // der Raum sammelt sich schon, während man durch die Tür geht
  if (yawT < 1) yawT = Math.min(1, yawT + dt / ROT_SEK);
  const kp = 1 - Math.exp(-dt * 2.2); py += (pyT - py) * kp; ps += (psT - ps) * kp;
  let room = null;
  if (rIn > 0) {
    room = {
      rect: L.rect, cx: L.cx, cy: L.yEye + ps, F: L.F, sp: L.sp, rad: desk ? 1.2 : 1.0,
      yaw: yawBase() + drag + py, pitch: PITCH0, rIn: easeSine(rIn), pulse: angTo(yawBase(), 2) < 0.05 && yawT >= 1 && !still(), hh, mm, open: praxisOpen, hot,
    };
    const hx = hvFrame(dt, room); if (hx) Object.assign(room, hx);
  }
  st.frame(dt, {
    w, h, desk, cx: w / 2,
    areaTop: hb + (desk ? 8 : 18), areaBot: h - (desk ? 44 : 30), fadeY: hb - 8,
    fWant: easeSine(fT), pWant: easeSine(doorP), border: L.border, room,
  });
  const ro = rIn > 0.3;
  if (ro !== roomOn) { roomOn = ro; H.classList.toggle('raum-on', ro); }
  if (room) placeBoards(room);
  const to = 1 - smooth(0.02, 0.25, st.walk);
  if (Math.abs(to - lastTop) > 0.01) { lastTop = to; topEl.style.opacity = to.toFixed(2); topEl.style.visibility = to < 0.01 ? 'hidden' : ''; }
  const c = st.f > 0.9 ? 1 - smooth(0.02, 0.1, st.p) : 0;
  if (cue && Math.abs(c - lastCue) > 0.01) { lastCue = c; cue.style.opacity = c.toFixed(2); }
}
requestAnimationFrame(frame);

// ---------- Kontakt: E-Mail kopieren, „jetzt geöffnet“ (Logik wie Puls) ----------
{
  const copyBtn = $('#copyMail'), copyState = $('#copyState'), mailA = $('#mailAddr');
  copyBtn.hidden = false;
  let tm = 0;
  const say = (t) => { copyState.textContent = t; clearTimeout(tm); tm = setTimeout(() => { copyState.textContent = ''; }, 4000); };
  copyBtn.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(mailA.textContent.trim()); say('Kopiert'); }
    catch (e) { const r = document.createRange(); r.selectNodeContents(mailA); const s = getSelection(); s.removeAllRanges(); s.addRange(r); say('Adresse markiert – bitte selbst kopieren'); }
  });
  const openEls = $$('.dd-open');
  const HOLY = {};
  const holidays = (y) => {
    if (HOLY[y]) return HOLY[y];
    const a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451);
    const month = Math.floor((h + l - 7 * m + 114) / 31), day = ((h + l - 7 * m + 114) % 31) + 1;
    const easter = Date.UTC(y, month - 1, day), key = (t) => new Date(t).toISOString().slice(0, 10), fix = (mo, da) => key(Date.UTC(y, mo - 1, da));
    return (HOLY[y] = new Set([fix(1, 1), fix(1, 6), key(easter - 2 * 864e5), key(easter + 864e5), fix(5, 1), key(easter + 39 * 864e5), key(easter + 50 * 864e5), key(easter + 60 * 864e5), fix(10, 3), fix(11, 1), fix(12, 25), fix(12, 26)]));
  };
  const DAYS = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
  const OPEN = 8 * 60 + 30, CLOSE = 19 * 60 + 30;
  const upd = () => {
    try {
      const p = {};
      new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Berlin', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date()).forEach((x) => { p[x.type] = x.value; });
      const base = Date.UTC(+p.year, +p.month - 1, +p.day), mins = +p.hour * 60 + +p.minute;
      const info = (k) => { const d = new Date(base + k * 864e5); return { wd: d.getUTCDay(), key: d.toISOString().slice(0, 10) }; };
      const isOpenDay = (k) => { const d = info(k); return d.wd >= 1 && d.wd <= 5 && !holidays(+d.key.slice(0, 4)).has(d.key); };
      let t, now = false;
      if (isOpenDay(0) && mins < OPEN) t = 'Heute ab 8:30 geöffnet';
      else if (isOpenDay(0) && mins < CLOSE) { t = 'Jetzt geöffnet, bis 19:30'; now = true; }
      else { let k = 1; while (k < 10 && !isOpenDay(k)) k++; t = 'Geschlossen · ' + (k === 1 ? 'morgen ab 8:30' : DAYS[info(k).wd] + ' ab 8:30'); }
      openEls.forEach((el) => { el.textContent = t; el.hidden = false; el.classList.toggle('is-now', now); });
      praxisOpen = now;
    } catch (e) { openEls.forEach((el) => { el.hidden = true; }); }
  };
  upd(); setInterval(upd, 60000);
}

window.__raum = {
  get st() { return st; }, get walk() { return walk; }, get cur() { return cur; }, get rIn() { return rIn; }, get yaw() { return yawBase(); }, get turned() { return turned; }, get lay() { return lay; }, get praxisOffen() { return praxisOpen; },
  open: () => open(false), inside: () => open(true), go: (k) => go(k, 'tab'), setOpen(v) { praxisOpen = v; }, reset() { opened = false; doorP = 0; rIn = 0; hit.hidden = false; go(0, 'now'); yawFrom = yawTo = 0; },
};
