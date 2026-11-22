// Entwurfsseite „Tür · Raum“ (22.11.2026, Go Kai „a c“): Kapitel 05 von Puls als Raum.
// Kai: „Tür klicken, danach weiterhin wie herein treten, der Rahmen der Tür ist dann wie die Bildschirmumrandung, danach wie als ob man sich
// umsehen kann und alle relevanten Infos erscheinen dort, wo man sich praktisch umsieht.“
//   A „Der Empfang“: Tür antippen → sie geht auf, man geht hindurch, der Rahmen legt sich an den Bildschirmrand. Drinnen vier Blickrichtungen
//     (Empfang · Uhr · Ablage · Fenster); Wischen, ‹ › oder die Punkte drehen den Blick ruhig über die Zeit (ROT_SEK). „Termin buchen“ steht immer da.
//   C „Kopf drehen“: am PC folgt der Raum der Maus um wenige Grad; am Handy folgt er beim Wischen dem Finger, bevor er weiterdreht.
// Ohne JavaScript, ohne Grafikchip oder bei „Bewegung anhalten/reduzieren“: die vier Blöcke stehen als Kontaktteil einfach untereinander.
// Puls (src/test-4) und die Tür-Bühne (src/tuer/buehne.js) sind unberührt. Prüfhilfe: window.__raum.
import { initStage } from './stage.js';
import { STATIONS, PITCH0 } from './raum.js';

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
const tabs = $$('.raum-tabs [role="tab"]'), panels = $$('.rp'), raumEl = $('#raum');
let cur = 0, shown = 0, swapT = 0, turned = false;
const ROT_SEK = 2.0, DOOR_SEK = 4.2, ROOM_SEK = 2.6;
let yawFrom = 0, yawTo = 0, yawT = 1; // Drehung über die Zeit (yawT 0 … 1)
let drag = 0; // Finger: Versatz in Bogenmaß
const yawBase = () => yawFrom + (yawTo - yawFrom) * easeSine(yawT);
function showPanel(k) {
  shown = k;
  panels.forEach((p, i) => { p.classList.toggle('is-off', i !== k); });
}
function go(k, how = 'turn') {
  const n = ((k % STATIONS) + STATIONS) % STATIONS;
  const step = k - cur; // Richtung behalten: ‹ dreht nach links, › nach rechts (auch über die Runde hinaus)
  const now = yawBase() + drag;
  cur = n;
  tabs.forEach((t, i) => { t.setAttribute('aria-selected', String(i === n)); t.tabIndex = i === n ? 0 : -1; });
  const quiet = still() || how === 'now';
  let target = yawTo + step * (Math.PI / 2);
  if (how === 'tab') { let d = n * (Math.PI / 2) - (((yawTo % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)); if (d > Math.PI) d -= 2 * Math.PI; if (d < -Math.PI) d += 2 * Math.PI; target = yawTo + d; }
  yawFrom = now; yawTo = target; yawT = quiet ? 1 : 0; drag = 0;
  if (step || how === 'tab') { turned = true; H.classList.add('raum-turned'); }
  clearTimeout(swapT);
  if (quiet) showPanel(n);
  else { panels.forEach((p) => p.classList.add('is-off')); swapT = setTimeout(() => showPanel(n), ROT_SEK * 520); }
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
const cv = $('#cStage'), glowEl = $('#cGlow'), track = $('#doorTrack'), sticky = $('.door-sticky'), hit = $('#doorHit'), cue = $('.door-cue'), mot = $('.raum-mot'), nav = $('.top'), topEl = $('.door-top');
let st = null, failed = false, on = false, walk = null, opened = false, doorP = 0, fT = 0, rIn = 0, lastClip = '', lastCue = -1, lastTop = -1, roomOn = false;
const soft = Q.get('gl') === '1';
const setWalk = (v) => { if (v === walk) return; walk = v; H.classList.toggle('door-walk', v); if (!v) { showPanel(cur); H.classList.remove('raum-on'); } };
const off = () => { if (!on) return; on = false; cv.classList.remove('on'); glowEl.classList.remove('on'); if (st) st.clear(); };
const open = (now) => { if (!opened) { opened = true; if (hit) hit.hidden = true; } if (now) { doorP = 1; rIn = 1; } };
hit.addEventListener('click', () => open(false));
raumEl.addEventListener('focusin', () => { if (walk && !opened) open(true); else if (walk && rIn < 1) rIn = 1; });
// Uhrzeit für die Zeiger (Praxis-Zeit)
let hh = 0, mm = 0;
const tick = () => { try { const p = {}; new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Berlin', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date()).forEach((x) => { p[x.type] = x.value; }); hh = +p.hour; mm = +p.minute; } catch (e) { const d = new Date(); hh = d.getHours(); mm = d.getMinutes(); } };
tick(); setInterval(tick, 15000);

// C: Kopf drehen – Maus (PC) bzw. Finger beim Wischen (Handy)
let pyT = 0, ppT = 0, py = 0, pp = 0;
const fine = matchMedia('(hover: hover) and (pointer: fine)');
sticky.addEventListener('pointermove', (e) => {
  if (e.pointerType !== 'mouse' || !fine.matches || !roomOn) return;
  pyT = (e.clientX / innerWidth - 0.5) * 0.08; ppT = -(e.clientY / innerHeight - 0.5) * 0.045;
});
sticky.addEventListener('pointerleave', () => { pyT = 0; ppT = 0; });
{
  let sx = 0, sy = 0, id = null, horiz = null, t0 = 0;
  const W = () => Math.max(320, sticky.clientWidth);
  sticky.addEventListener('pointerdown', (e) => {
    if (!roomOn || e.pointerType === 'mouse' || e.target.closest('a,button')) return;
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
    if (horiz && (Math.abs(dx) > 48 || (fast && Math.abs(dx) > 20))) go(cur + (dx < 0 ? 1 : -1));
    else if (drag) { yawFrom = yawBase() + drag; yawT = 0; drag = 0; } // zurückfedern
    horiz = null;
  };
  sticky.addEventListener('pointerup', end); sticky.addEventListener('pointercancel', end);
}

// Messanzeige ?takt=1 (Bilder je Sekunde)
const takt = Q.get('takt') === '1' ? Object.assign(document.body.appendChild(document.createElement('div')), { className: 'takt' }) : null;
let tn = 0, tt = 0;

let last = performance.now();
function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min(0.1, (now - last) / 1000); last = now;
  if (takt) { tn++; tt += dt; if (tt >= 1) { takt.textContent = `${Math.round(tn / tt)} B/s · ${st ? st.points : 0} Punkte`; tn = 0; tt = 0; } }
  setWalk(!still() && !failed);
  if (!walk) { off(); return; }
  const r = track.getBoundingClientRect(), vh = innerHeight, vw = innerWidth;
  if (!opened && r.height > vh * 0.5 && r.bottom < vh * 0.3) open(true); // ohne Antippen vorbeigescrollt: beim Zurückkommen offen
  if (r.top > vh * 1.5 || r.bottom < -vh * 0.3) { off(); return; }
  if (!st) { st = initStage({ cv, glow: glowEl, isStill: still, soft }); if (!st) { failed = true; return; } }
  if (st.dead) { failed = true; return; }
  if (!on) { on = true; cv.classList.add('on'); glowEl.classList.add('on'); }
  const clip = `inset(${Math.max(0, Math.round(r.top))}px 0 ${Math.max(0, Math.round(vh - r.bottom))}px 0)`;
  if (clip !== lastClip) { lastClip = clip; cv.style.clipPath = clip; glowEl.style.clipPath = clip; }
  // Zeit: Tür entsteht beim Hereinkommen (3,6 s), Weg nach dem Antippen (DOOR_SEK), Raum danach (ROOM_SEK)
  if (r.top < vh * 0.6) fT = Math.min(1, fT + dt / 3.6);
  if (opened) doorP = Math.min(1, doorP + dt / DOOR_SEK);
  const desk = isDesktop(), sr = sticky.getBoundingClientRect(), hb = tTitle.getBoundingClientRect().bottom;
  const navB = nav ? nav.getBoundingClientRect().bottom : 0, ins = desk ? 14 : 8;
  const border = [ins, r.top + navB + 6, vw - ins, r.top + vh - ins];
  if (st.p >= 0.5) rIn = Math.min(1, rIn + dt / ROOM_SEK); // der Raum sammelt sich schon, während man durch die Tür geht (sonst 1,5 s leeres Bild)
  if (yawT < 1) yawT = Math.min(1, yawT + dt / ROT_SEK);
  const kp = 1 - Math.exp(-dt * 2.2); py += (pyT - py) * kp; pp += (ppT - pp) * kp;
  let room = null;
  if (rIn > 0) {
    const m = mot.getBoundingClientRect();
    const F = Math.max(160, Math.min((m.width * 0.86) / 1.75, (m.height * 0.94) / 1.45) * 2.4);
    room = {
      rect: [m.left - 14, m.top - 14, m.right + 14, m.bottom + 14], cx: m.left + m.width / 2, cy: m.top + m.height / 2, F,
      sp: ((desk ? 5.6 : 4.4) * 2.4) / F, rad: desk ? 1.2 : 1.0,
      yaw: yawBase() + drag + py, pitch: PITCH0 + pp, rIn: easeSine(rIn), pulse: cur === 2 && yawT >= 1 && !still(), hh, mm,
    };
  }
  st.frame(dt, {
    w: cv.clientWidth, h: vh, desk, cx: cv.clientWidth / 2,
    areaTop: hb + (desk ? 8 : 18), areaBot: sr.bottom - (desk ? 44 : 30), fadeY: hb - 8,
    fWant: easeSine(fT), pWant: easeSine(doorP), border, room,
  });
  const ro = rIn > 0.3;
  if (ro !== roomOn) { roomOn = ro; H.classList.toggle('raum-on', ro); if (ro) showPanel(cur); }
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
    } catch (e) { openEls.forEach((el) => { el.hidden = true; }); }
  };
  upd(); setInterval(upd, 60000);
}

window.__raum = {
  get st() { return st; }, get walk() { return walk; }, get cur() { return cur; }, get shown() { return shown; }, get rIn() { return rIn; }, get yaw() { return yawBase(); }, get turned() { return turned; },
  open: () => open(false), inside: () => open(true), go: (k) => go(k, 'tab'), reset() { opened = false; doorP = 0; rIn = 0; hit.hidden = false; go(0, 'now'); yawFrom = yawTo = 0; },
};
