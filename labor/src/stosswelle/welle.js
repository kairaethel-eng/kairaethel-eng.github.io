// Baustein Stoßwellen-Therapie (Go Kai 14.11.2026): bewegt die Linien-Bühne aus page.html (#stosswelle) – ohne WebGL.
// Druckwellen breiten sich von der Auflagestelle des Handstücks kreisförmig aus und werden mit der Tiefe schwächer
// (radiale Stoßwelle). Drei Stärken zum Ansehen; Takt bewusst verlangsamt und unter 3 Impulsen je Sekunde (kein Flackern).
// Aufruf: const sw = initStosswelle({ root, isPaused, reduced }); im Bildtakt sw.update(); sw.k() = Anteil im Bild.

export const LEVELS = [
  { name: 'Sanft', rate: 1.25, reach: 168, amp: 0.6, txt: 'Sanft: wenige, leichte Impulse. So beginnt jede Behandlung, zum Herantasten.' },
  { name: 'Mittel', rate: 1.9, reach: 196, amp: 0.8, txt: 'Mittel: gleichmäßiger Takt, deutlich zu spüren und gut auszuhalten.' },
  { name: 'Kräftig', rate: 2.6, reach: 226, amp: 1, txt: 'Kräftig: mehr Energie für derbe Sehnenansätze und kräftige Muskulatur. Immer nur so viel, wie für Sie passt.' },
];
const SPEED = 92;           // Ausbreitung in Zeichnungs-Einheiten je Sekunde
const TARGET_R = 137.5;     // Abstand Auflagestelle → Sehnenansatz (400|264 → 426|399)
const HOLD = 6.5;           // Sekunden je Stärke im selbstlaufenden Wechsel
const STILL = [0.14, 0.36, 0.58, 0.8]; // Standbild: vier Wellen (angehalten, „Bewegung reduzieren“)

export function initStosswelle({ root, isPaused = () => false, reduced = false }) {
  if (!root) return null;
  const $ = (s) => root.querySelector(s), $$ = (s) => [...root.querySelectorAll(s)];
  const rings = $$('.sw-waves circle'), hp = $('#swHp'), flash = $('.sw-flash'), target = $('.sw-target');
  const btns = $$('#swModes button'), read = $('#swRead'), fig = $('.sw-fig');
  const pulses = []; // Startzeiten der laufenden Impulse (Sekunden)
  let level = 0, auto = true, holdT = 0, emitT = 0, clock = 0, last = 0, seen = false, shown = false, startAt = 0, stillKey = '';

  function setLevel(i, user) {
    level = i;
    root.dataset.level = i;
    btns.forEach((b, j) => { b.classList.toggle('is-on', j === i); b.setAttribute('aria-pressed', j === i ? 'true' : 'false'); b.querySelector('i').style.width = '0'; });
    if (read) read.textContent = LEVELS[i].txt;
    holdT = 0; stillKey = '';
    if (user) auto = false;
  }
  btns.forEach((b, i) => b.addEventListener('click', () => setLevel(i, true)));
  setLevel(0, false);

  // Zeichnen beim ersten Hereinkommen (wie im Linienhaus), danach beginnen die Impulse. Gemessen wird erst dann (kein Layout
  // beim Seitenstart): Pfadlänge × Maßstab, weil die Strichstärke nicht mitskaliert (Strichmuster zählen dann in Bildschirm-px).
  const still = () => reduced || isPaused();
  if (!still()) root.classList.add('sw-anim');
  function reveal() {
    seen = true;
    if (still()) { root.classList.remove('sw-anim'); return; } // angehalten: ohne Zeichnen sofort das Standbild
    const k = fig.getBoundingClientRect().width / 600 || 1;
    $$('.sw-draw').forEach((p, i) => { let l = 0; try { l = p.getTotalLength(); } catch (e) { /* nicht messbar: bleibt gezeichnet */ } p.style.setProperty('--l', Math.ceil(l * k) + 2); p.style.setProperty('--d', i); });
    root.classList.add('in');
    startAt = performance.now() + 1700;
    setTimeout(() => root.classList.add('sw-done'), 3400);
  }
  let ratio = 0;
  new IntersectionObserver((es) => es.forEach((e) => {
    ratio = e.intersectionRatio;
    shown = e.isIntersecting;
    if (shown && !seen && ratio > 0.3) reveal();
  }), { threshold: [0, 0.3, 0.6, 1] }).observe(fig);

  const place = (c, u, lv, k) => { // u = Fortschritt der Welle 0…1
    const r = lv.reach * (1 - Math.pow(1 - u, 1.35));
    c.setAttribute('r', r.toFixed(1));
    c.style.opacity = (lv.amp * k * Math.pow(1 - u, 0.95) * Math.min(1, u * 12)).toFixed(3);
    c.style.strokeWidth = (2.1 - u * 1.1).toFixed(2);
    return r;
  };
  function drawStill() {
    const key = level + (seen ? 'i' : '');
    if (key === stillKey) return;
    stillKey = key;
    const lv = LEVELS[level];
    rings.forEach((c, i) => { if (i < STILL.length) place(c, STILL[i], lv, 1.15); else c.style.opacity = 0; });
    hp.removeAttribute('transform'); flash.style.opacity = 0;
    target.setAttribute('r', 6); target.style.fillOpacity = '';
  }

  function update() {
    const now = performance.now(), dt = Math.min(0.1, (now - (last || now)) / 1000);
    last = now;
    if (!seen || !shown) return;
    if (still()) { drawStill(); return; }
    if (now < startAt) return;
    stillKey = '';
    clock += dt;
    const lv = LEVELS[level], life = lv.reach / SPEED * 1.25;
    // selbstlaufender Wechsel der Stärke, bis jemand selbst wählt
    if (auto) {
      holdT += dt;
      const b = btns[level]; if (b) b.querySelector('i').style.width = (Math.min(1, holdT / HOLD) * 100).toFixed(1) + '%';
      if (holdT >= HOLD) setLevel((level + 1) % LEVELS.length, false);
    }
    emitT -= dt;
    if (emitT <= 0) { pulses.push(clock); emitT += 1 / lv.rate; if (emitT < 0) emitT = 1 / lv.rate; }
    while (pulses.length && clock - pulses[0] > life) pulses.shift();
    while (pulses.length > rings.length) pulses.shift();
    let hit = 0;
    rings.forEach((c, i) => {
      const t0 = pulses[i];
      if (t0 === undefined) { c.style.opacity = 0; return; }
      const u = (clock - t0) / life, r = place(c, u, lv, 1), d = (r - TARGET_R) / 16;
      hit = Math.max(hit, Math.exp(-d * d) * lv.amp);
    });
    // Handstück federt bei jedem Impuls kurz zurück, die Auflagestelle leuchtet auf, der Sehnenansatz antwortet
    const age = pulses.length ? clock - pulses[pulses.length - 1] : 9, kick = Math.exp(-age * 16);
    hp.setAttribute('transform', `translate(0 ${(-kick * (2 + level)).toFixed(2)})`);
    flash.style.opacity = (kick * 0.75).toFixed(3);
    target.setAttribute('r', (6 + hit * 3).toFixed(2));
    target.style.fillOpacity = (0.18 + hit * 0.6).toFixed(3);
  }

  // Druck: alle Antworten aufklappen
  addEventListener('beforeprint', () => $$('details').forEach((d) => (d.open = true)));

  return { update, k: () => ratio, setLevel: (i) => setLevel(i, true), get level() { return level; }, get auto() { return auto; } };
}
