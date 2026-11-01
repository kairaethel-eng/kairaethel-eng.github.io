// Rechtsseiten (Impressum, Datenschutz) im Puls-Stil: ohne 3D, nur die HOP-Kreise als gestochene Partikel,
// die dezent im Hintergrund atmen (Canvas 2D, sehr leicht). Inhaltsverzeichnis folgt dem Lesen.
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---------- „Bewegung anhalten“ (gleiche Wahl wie auf der Startseite) ----------
let paused = false;
try { paused = localStorage.getItem('hop-motion') === 'paused'; } catch (e) { /* ohne Speicher */ }
const motionBtn = document.getElementById('motionBtn');
function setPaused(v, save = true) {
  paused = v;
  document.documentElement.classList.toggle('paused', v);
  if (motionBtn) { motionBtn.setAttribute('aria-pressed', v ? 'true' : 'false'); motionBtn.setAttribute('aria-label', v ? 'Bewegung fortsetzen' : 'Bewegung anhalten'); motionBtn.title = v ? 'Bewegung fortsetzen' : 'Bewegung anhalten'; }
  if (save) try { localStorage.setItem('hop-motion', v ? 'paused' : 'on'); } catch (e) { /* ohne Speicher */ }
}
motionBtn?.addEventListener('click', () => setPaused(!paused));
setPaused(paused, false); // beim Laden nichts speichern – nur nach Klick

// ---------- HOP-Kreise aus Partikeln ----------
const cv = document.getElementById('logoBg');
const ctx = cv && cv.getContext('2d');
const COLS = ['#8BC34A', '#3C7189', '#5AA2D6', '#8C979B'];
const pts = [];
(function build() {
  // gleichmäßig gesetzte Punkte (Mindestabstand) in drei Scheiben, dazu offene Ringe wie im Logo
  const cx = [-2.75, 0, 2.75], R = 1.18, r = 0.085, grid = new Map(), cell = r;
  const key = (x, y) => Math.floor(x / cell) + ',' + Math.floor(y / cell);
  const free = (x, y) => {
    const gx = Math.floor(x / cell), gy = Math.floor(y / cell);
    for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) {
      const c = grid.get((gx + i) + ',' + (gy + j)); if (!c) continue;
      for (const q of c) if ((q.x - x) ** 2 + (q.y - y) ** 2 < r * r) return false;
    }
    return true;
  };
  for (let d = 0; d < 3; d++) for (let t = 0; t < 2600; t++) {
    const a = Math.random() * Math.PI * 2, rr = Math.sqrt(Math.random()) * R, x = cx[d] + Math.cos(a) * rr, y = Math.sin(a) * rr;
    if (!free(x, y)) continue;
    const p = { x, y, z: (Math.random() - 0.5) * 0.25, k: d, s: Math.random() };
    pts.push(p); const k = key(x, y); (grid.get(k) || grid.set(k, []).get(k)).push(p);
  }
  for (let d = 0; d < 3; d++) {
    const rr = R * 1.3, n = Math.round((2 * Math.PI * rr) / 0.07);
    for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2; if (a > 0.25 && a < 1.05) continue; pts.push({ x: cx[d] + Math.cos(a) * rr, y: Math.sin(a) * rr, z: 0, k: 3, s: Math.random() }); }
  }
})();

let W = 0, H = 0, dpr = 1, t = 0, last = performance.now();
const ptr = { x: 0, y: 0, tx: 0, ty: 0 };
addEventListener('pointermove', (e) => { ptr.tx = e.clientX / innerWidth - 0.5; ptr.ty = e.clientY / innerHeight - 0.5; }, { passive: true });
function resize() {
  if (!cv) return;
  dpr = Math.min(devicePixelRatio || 1, 2);
  W = cv.clientWidth; H = cv.clientHeight;
  cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
}
addEventListener('resize', resize);
resize();

function draw(now) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  if (!paused && !reduced) t += dt;
  ptr.x += (ptr.tx - ptr.x) * 0.04; ptr.y += (ptr.ty - ptr.y) * 0.04;
  if (ctx) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'lighter';
    const desk = innerWidth > 920;
    // PC: rechts unten, groß und angeschnitten; Handy: oben hinter dem Titel, kleiner
    const scale = desk ? Math.min(W, H) * 0.16 : W * 0.105;
    const ox = desk ? W * 0.74 : W * 0.5, oy = desk ? H * 0.62 : H * 0.17;
    const rot = Math.sin(t * 0.3) * 0.25 + ptr.x * 0.25, c = Math.cos(rot), s = Math.sin(rot);
    for (const p of pts) {
      const br = 1 + Math.sin(t * 1.2 + p.x * 0.8) * 0.04;
      const x = p.x * br, z = p.z, y = p.y * br;
      const X = c * x + s * z, Z = -s * x + c * z;
      const persp = 1 / (1 + Z * 0.08);
      const sx = ox + X * scale * persp + ptr.x * 10, sy = oy - (y + 0.2) * scale * persp + ptr.y * 10;
      const a = (p.k === 3 ? 0.55 : 0.8) * (0.85 + 0.15 * Math.sin(t * 0.8 + p.s * 6.28));
      ctx.globalAlpha = a;
      ctx.fillStyle = COLS[p.k];
      const rad = (p.k === 3 ? 1.1 : 1.35) * persp * (desk ? 1 : 0.8);
      ctx.beginPath(); ctx.arc(sx, sy, rad, 0, 6.2832); ctx.fill();
    }
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  }
  requestAnimationFrame(draw);
}
requestAnimationFrame(draw);

// ---------- Inhaltsverzeichnis: aktueller Abschnitt ----------
const links = [...document.querySelectorAll('.toc a')];
const secs = links.map((a) => document.querySelector(a.getAttribute('href'))).filter(Boolean);
function onScroll() {
  let cur = 0;
  secs.forEach((s, i) => { if (s.getBoundingClientRect().top < innerHeight * 0.35) cur = i; });
  links.forEach((a, i) => a.classList.toggle('on', i === cur));
  document.querySelector('.top')?.classList.toggle('scrolled', scrollY > 20);
}
addEventListener('scroll', onScroll, { passive: true });
onScroll();
// Handy: nach Klick im Inhaltsverzeichnis wieder zuklappen
document.querySelectorAll('.toc-mob a').forEach((a) => a.addEventListener('click', () => { const d = a.closest('details'); if (d) d.open = false; }));

// ---------- Herzschlag am Knopf „Zur Startseite“ (nur in Ruhe, Abstand wächst, ruht bei „Bewegung anhalten“) ----------
{
  const back = document.querySelector('.foot .back');
  let lastIn = performance.now(), lastBeat = performance.now(), beats = 0;
  ['scroll', 'pointermove', 'touchmove'].forEach((ev) => addEventListener(ev, () => (lastIn = performance.now()), { passive: true }));
  back?.addEventListener('animationend', () => back.classList.remove('beat'));
  setInterval(() => {
    const now = performance.now();
    if (!back || paused || reduced || document.hidden || now - lastIn < 3000 || now - lastBeat < Math.min(30000, 10000 + beats * 5000)) return;
    const r = back.getBoundingClientRect(); if (r.bottom < 0 || r.top > innerHeight) return;
    back.classList.remove('beat'); void back.offsetWidth; back.classList.add('beat'); lastBeat = now; beats++;
  }, 1000);
}
