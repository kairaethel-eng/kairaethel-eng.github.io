// Raumlicht + Logo-Farben (Farbstudie 22.11.2026, Go Kai: „Kräftig … übernehmen, alle anderen speichern“).
// Jedes Kapitel ist ein Raum mit eigenem, weichem Licht aus der HOP-Palette, der Weg führt von kühl nach warm:
// 01 Abendblau · 02 Grün · § Logo-Farben · 03 Röntgenblau · 04 Petrol + warmes Fensterlicht · 05 Bernstein (drinnen).
// Technik: eine Lichtschicht #farblicht (position:fixed, mix-blend-mode:screen, über der Seite, unter Hinweisen/Dialogen),
// Hintergrund aus zwei bis drei weichen Ellipsen je Kapitel + Grundton; zwischen zwei Kapiteln wird überblendet.
// Logo-Farben (Stufen mittel/kraeftig): html.fx-logo färbt Kapitel-Ziffern, Linien, Menü (style.css), Figur Kapitel 01 (html[data-deep],
// ../feinschliff/gl.js setDeep) und Band 2 der Perlenbänder (uniform cLane). Bernstein bleibt die Farbe für Handlung.
// Stufen: heute · leise · mittel · kraeftig (Standard). Wahl über ?farbe=…; auf farbstudie.html (html.studie-farbe) Umschalter unten links.
const B = [63, 134, 181], BL = [90, 162, 214], G = [111, 160, 47], P = [48, 88, 105], A = [224, 154, 53], AD = [197, 129, 28];
// w = Grundton (Stufe „kraeftig“ = 1), d/m = Lichter am PC / am Handy: Farbe c, Lage x/y und Größe rx/ry in % des Fensters, Stärke a
const PAL = {
  start: { w: [6, 14, 34],
    d: [{ c: B, x: 23, y: 50, rx: 36, ry: 62, a: 0.30 }, { c: P, x: 88, y: 6, rx: 40, ry: 38, a: 0.16 }],
    m: [{ c: B, x: 50, y: 48, rx: 85, ry: 46, a: 0.30 }, { c: P, x: 92, y: 0, rx: 60, ry: 30, a: 0.14 }] },
  bewegung: { w: [8, 22, 12],
    d: [{ c: G, x: 82, y: 62, rx: 38, ry: 55, a: 0.20 }, { c: B, x: 8, y: 12, rx: 36, ry: 40, a: 0.10 }],
    m: [{ c: G, x: 62, y: 74, rx: 90, ry: 45, a: 0.20 }, { c: B, x: 0, y: 8, rx: 60, ry: 30, a: 0.10 }] },
  hausordnung: { w: [5, 16, 20],
    d: [{ c: G, x: 62, y: 48, rx: 22, ry: 36, a: 0.16 }, { c: P, x: 78, y: 50, rx: 30, ry: 50, a: 0.20 }, { c: B, x: 93, y: 48, rx: 22, ry: 36, a: 0.16 }],
    m: [{ c: G, x: 18, y: 42, rx: 60, ry: 30, a: 0.15 }, { c: P, x: 50, y: 60, rx: 80, ry: 40, a: 0.18 }, { c: B, x: 84, y: 42, rx: 60, ry: 30, a: 0.15 }] },
  achse: { w: [4, 12, 30],
    d: [{ c: BL, x: 66, y: 50, rx: 30, ry: 62, a: 0.22 }, { c: P, x: 12, y: 90, rx: 40, ry: 40, a: 0.18 }],
    m: [{ c: BL, x: 55, y: 52, rx: 80, ry: 50, a: 0.22 }, { c: P, x: 0, y: 100, rx: 60, ry: 30, a: 0.16 }] },
  dach: { w: [16, 12, 8],
    d: [{ c: AD, x: 66, y: 56, rx: 40, ry: 52, a: 0.16 }, { c: P, x: 16, y: 6, rx: 40, ry: 40, a: 0.18 }],
    m: [{ c: AD, x: 50, y: 60, rx: 90, ry: 42, a: 0.16 }, { c: P, x: 10, y: 0, rx: 60, ry: 30, a: 0.16 }] },
  tuer: { w: [28, 16, 4],
    d: [{ c: A, x: 50, y: 40, rx: 30, ry: 46, a: 0.24 }, { c: AD, x: 50, y: 100, rx: 65, ry: 32, a: 0.16 }],
    m: [{ c: A, x: 50, y: 38, rx: 80, ry: 45, a: 0.24 }, { c: AD, x: 50, y: 100, rx: 90, ry: 30, a: 0.16 }] },
};
const ORDER = ['start', 'bewegung', 'hausordnung', 'achse', 'dach', 'tuer'];
const NOW = ['#5AA2D6', '#8DBF55', '#6FA8C0', '#5AA2D6', '#6FA8C0', '#E09A35']; // Kapitelfarbe für die Ziffer im Handy-Menü
export const STUFEN = {
  heute: { light: 0, wash: 0, logo: false, name: 'Heute', t: 'So war die Seite bis 22.11.: ein Dunkel überall, Bernstein als einzige Farbe.' },
  leise: { light: 1, wash: 0.35, logo: false, name: 'Leise', t: 'Raumlicht: jedes Kapitel hat sein eigenes, weiches Licht. Die Grafiken bleiben, wie sie sind.' },
  mittel: { light: 1, wash: 0.35, logo: true, name: 'Mittel', t: 'Raumlicht + Logo-Farben in Figur, Bändern, Kapitel-Ziffern und Menü. Bernstein bleibt für Knöpfe.' },
  kraeftig: { light: 1.45, wash: 1, logo: true, name: 'Kräftig', t: 'Farbräume: jedes Kapitel deutlich eingefärbt, Licht stärker. Stand in Puls seit 22.11.' },
};
const DEEP = { logo: '#3F86B5', heute: '#44788E' }, LANE = '#7FB346';

export function initFarbe({ uniforms }) {
  const root = document.documentElement;
  const q = new URLSearchParams(location.search).get('farbe');
  let cur = STUFEN[q] ? q : 'kraeftig';
  const layer = document.createElement('div');
  layer.id = 'farblicht'; layer.setAttribute('aria-hidden', 'true');
  document.body.append(layer);
  const mq = matchMedia('(max-width:920px)');
  const lane0 = uniforms.cLane.value.clone();
  const el = (id) => document.querySelector(`.auftakt-blk[data-for="${id}"]`) || document.getElementById(id);
  const grad = (g, w, k) => {
    const a = g.a * w * k; if (a < 0.004) return null;
    const c = g.c.join(','), f = (m) => (a * m).toFixed(3);
    return `radial-gradient(ellipse ${g.rx}% ${g.ry}% at ${g.x}% ${g.y}%,rgba(${c},${f(1)}),rgba(${c},${f(0.6)}) 28%,rgba(${c},${f(0.27)}) 55%,rgba(${c},${f(0.07)}) 80%,rgba(${c},0))`;
  };
  // Hintergrund der Lichtschicht: Kapitel c, zum nächsten n hin mit k (0..1) überblendet
  let last = '', nowC = -1;
  const paint = (c, n, k) => {
    const p = STUFEN[cur];
    if (!p.light && !p.wash) { if (last !== 'none') { layer.style.background = 'none'; last = 'none'; } return; }
    const P0 = PAL[ORDER[c]], P1 = PAL[ORDER[n]], key = mq.matches ? 'm' : 'd', parts = [];
    P0[key].forEach((g) => { const s = grad(g, p.light, 1 - k); if (s) parts.push(s); });
    if (k > 0) P1[key].forEach((g) => { const s = grad(g, p.light, k); if (s) parts.push(s); });
    const w = P0.w.map((v, j) => Math.round((v + (P1.w[j] - v) * k) * p.wash)).join(',');
    parts.push(`linear-gradient(rgb(${w}),rgb(${w}))`);
    const bg = parts.join(',');
    if (bg !== last) { layer.style.background = bg; last = bg; }
    if (c !== nowC) { nowC = c; root.style.setProperty('--fx-now', NOW[c]); }
  };
  // beim Start ohne Layout-Abfrage: Raum von Kapitel 01; ab „load“ folgt das Licht dem Scrollen
  let dirty = true, live = false;
  const frame = () => {
    requestAnimationFrame(frame);
    if (!dirty) return; dirty = false;
    const vh = innerHeight, focus = vh * 0.55, tops = ORDER.map((id) => { const e = el(id); return e ? e.getBoundingClientRect().top : 1e9; });
    let c = 0; for (let i = 0; i < ORDER.length; i++) if (tops[i] <= focus) c = i;
    const n = Math.min(c + 1, ORDER.length - 1);
    let k = n === c ? 0 : 1 - Math.min(1, Math.max(0, (tops[n] - focus) / (vh * 0.5)));
    k = k * k * (3 - 2 * k);
    paint(c, n, k);
  };
  const go = () => {
    if (live) return; live = true;
    addEventListener('scroll', () => { dirty = true; }, { passive: true });
    addEventListener('resize', () => { dirty = true; });
    mq.addEventListener?.('change', () => { dirty = true; });
    setInterval(() => { dirty = true; }, 500); // Kapitel bauen nach (Bühnen, Höhen) – Rechnung nur 6 Lagen, Zeichnen nur bei Änderung
    requestAnimationFrame(frame);
  };
  const set = (p) => {
    cur = p; const s = STUFEN[p];
    root.classList.toggle('fx-aus', !s.light && !s.wash);
    root.classList.toggle('fx-logo', s.logo);
    root.dataset.farbe = p; root.dataset.deep = s.logo ? DEEP.logo : DEEP.heute;
    uniforms.cDeep.value.set(root.dataset.deep);
    if (s.logo) uniforms.cLane.value.set(LANE); else uniforms.cLane.value.copy(lane0);
    document.dispatchEvent(new CustomEvent('hop-farbe', { detail: { stufe: p } }));
    last = ''; nowC = -1; dirty = true;
    if (!live) paint(0, 0, 0);
  };
  set(cur);
  if (document.readyState === 'complete') setTimeout(go, 0); else addEventListener('load', go, { once: true });

  if (!root.classList.contains('studie-farbe')) return;
  // Vergleichsseite: Umschalter unten links (klappt nach 6 s zur Pille mit der gewählten Stufe zusammen)
  const box = document.createElement('div'), info = document.createElement('p');
  box.className = 'fx-wahl'; box.setAttribute('role', 'group'); box.setAttribute('aria-label', 'Farbstudie: Stufe wählen');
  box.innerHTML = '<b aria-hidden="true">Farbe</b>' + Object.entries(STUFEN).map(([k, s]) => `<button type="button" data-p="${k}">${s.name}</button>`).join('');
  info.className = 'fx-info'; info.setAttribute('role', 'status');
  document.body.append(info, box);
  let hideT = 0, infoT = 0;
  const mark = () => box.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.p === cur)));
  const open = () => { box.classList.remove('zu'); clearTimeout(hideT); hideT = setTimeout(() => box.classList.add('zu'), 6000); };
  box.addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b) return;
    if (box.classList.contains('zu')) { open(); return; }
    set(b.dataset.p); mark(); open();
    info.textContent = `${STUFEN[cur].name}: ${STUFEN[cur].t}`; info.classList.add('an');
    clearTimeout(infoT); infoT = setTimeout(() => info.classList.remove('an'), 5000);
  });
  box.addEventListener('pointerenter', open); box.addEventListener('focusin', open);
  mark(); open();
}
