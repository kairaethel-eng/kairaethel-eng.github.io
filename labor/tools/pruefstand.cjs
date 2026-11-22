// Prüfstand (18.11.2026, Go Kai „a c d“): findet, was Standbilder bei 390×844 nicht zeigen.
// Anlass: Kai meldete am iPhone eine „explodierende“ Auflösung der Wirbelsäule, eine von Karte/Schildern verdeckte Wirbelsäule
// und Text über der Figur – alles war mir entgangen (falsche Fenstergröße, nur Standbilder, nur eine Haltestelle geprüft).
//
// Aufruf:  cd labor && node tools/pruefstand.cjs [seite] [ausgabeordner] [ansichten] [teile]
//   seite      Standard live/index.html (eigener kleiner Server, damit die echte Wirbelsäule lädt)
//   ansichten  ia = iPhone im Browser der Claude-App 390×692 (Kais Gerät) · is = Safari mit Leisten 390×664 · il = Safari, Leisten
//              eingeklappt 390×753 · ix = großes iPhone 430×740 · ie = iPhone SE 375×553 · d = PC 1440×900 · l = Laptop 1366×650
//              · xl = 2560×1440 · t = Tablet hochkant 820×1180 (läuft im Handy-Ablauf).   Standard: ia,d
//   teile      zustand (Verdeckung + Text je Zustand) · film (Wisch-Tests Bild für Bild) · beides ist Standard
//   BASIS=<ordner>  vergleicht die Zustandsbilder mit einem früheren Lauf (welche Zustände haben sich geändert?)
//
// Wie es arbeitet:
//   • Die Zeit der Seite wird gesteuert (Playwright clock, nach dem Laden mit pauseAt angehalten): jeder Schritt = ein Bild der Seite. So stehen Bilder still, während
//     gemessen wird, und Filmstreifen zeigen Bewegung Bild für Bild – unabhängig davon, wie langsam die Software-Grafik rechnet.
//   • Zufall ist fest (Math.random mit Startwert): zwei Läufe liefern dieselben Punkte → Vorher/Nachher vergleichbar.
//   • Je Zustand drei Bilder: A normal · B nur die Zeichenflächen (Grafik ohne Text/Karten) · C Text durchsichtig (Grund hinter dem Text).
//       Verdeckung  = Anteil der Grafik (B), der in A von etwas überdeckt ist – Regel: Hauptgrafik höchstens 35 %.
//       Text        = Anteil der Textfläche, hinter der der Grund zu hell/unruhig ist (Kontrast < 3:1 groß bzw. 4,5:1) – Regel: ≤ 15 %.
//   • Film: ein kräftiger Wisch (rund 0,9 Fensterhöhen, mit Schwung über 8 Bilder auslaufend), dazu 16 Bilder Nachlauf (seit 20.11.2026; vorher 8); Abstand 120 ms. Gemessen wird, wie voll
//     das Bild mit hellen Punkten ist und wie sprunghaft es sich ändert – Regel: nie mehr als 28 % hell, kein Sprung über 4 Punkte.
//   Ergebnis: bericht.md, <ansicht>-<zustand>.png, film-<ansicht>-<name>.png (Streifen), Rückgabewert 1 bei Regelverstoß.
// Grenze: ohne Grafikchip (Container) bleiben Tempo und Flüssigkeit unbewertbar; was nur auf echter Grafik auftritt, zeigt auch
// dieser Prüfstand nicht sicher. Dafür: tools/edgeshot.mjs auf Kais PC bzw. Bildschirmfilm vom iPhone.
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const [,, pageArg = 'live/index.html', outArg = '/tmp/pruefstand', viewsArg = 'ia,d', partsArg = 'zustand,film'] = process.argv;
const OUT = path.resolve(outArg); fs.mkdirSync(OUT, { recursive: true });
const VIEWS = {
  ia: [390, 692, 2, 'iPhone, Browser der Claude-App'], is: [390, 664, 2, 'iPhone Safari mit Leisten'], il: [390, 753, 2, 'iPhone Safari, Leisten eingeklappt'],
  ix: [430, 740, 2, 'großes iPhone'], ie: [375, 553, 2, 'iPhone SE'], t: [820, 1180, 2, 'Tablet hochkant'], d: [1440, 900, 1, 'PC'], l: [1366, 650, 1, 'Laptop'], xl: [2560, 1440, 1, 'großer Monitor'],
};
// jump = 4: am 18.11. geeicht – ruhige Übergänge liegen bei 0,2–3,3; die zerstiebende Wirbelsäule (03 → 04 von C1) bei 8,4, der Rückweg bei 4,9
const RULE = { occl: 35, text: 15, bright: 28, jump: 4 };
const KNOWN = ['.statement']; // bewusst so gestaltet: Manifest leuchtet Wort für Wort auf (noch nicht aufgeleuchtete Wörter sind blass)

// ---------- Zustände und Wisch-Tests ----------
const go = (sel, off = 0) => (p) => p.evaluate(([s, o]) => { const y = s === 'top' ? 0 : document.querySelector(s).getBoundingClientRect().top + scrollY + innerHeight * o; scrollTo(0, y); }, [sel, off]);
const kf = (u) => (p) => p.evaluate((x) => window.__kf && window.__kf.go(x), u);
const stop = (i) => async (p, settle) => { await go('#achse', 0.3)(p); await settle(5000); await p.evaluate((k) => { const s = document.querySelectorAll('.scan-stop'); if (s[k]) s[k].click(); }, i); };
const STOPS = ['C1', 'C5', 'Th1', 'Th7', 'L4', 'S1'];
const STATES = [
  { id: 'start', go: go('top') },
  // Kapitel 01: Hauptgrafik ist die Stelle im Ring (ring = Station, Lage aus __kf.ring) – der Körper darunter liegt am Handy bewusst
  // unter dem Textverlauf und zählt nicht
  { id: 'kf-01-ankunft', go: kf(0.55), key: 1, ring: 0, wait: 700 }, // kurz nach dem Wisch: Fahrt läuft noch
  { id: 'kf-01', go: kf(0.76), key: 1, ring: 0 }, { id: 'kf-02', go: kf(1.7), key: 1, ring: 1 }, { id: 'kf-03', go: kf(2.7), key: 1, ring: 2 }, { id: 'kf-04', go: kf(3.7), key: 1, ring: 3 },
  { id: 'kf-schluss', go: kf(4.5) },
  { id: 'auftakt-02', go: go('.auftakt-blk[data-for="bewegung"]', -0.3) }, // Kapitel-Auftakt (18.11.): große Ziffer, dahinter der Formwechsel
  { id: 'bewegung', go: go('#bewegung', 0) }, { id: 'hausordnung', go: go('#hausordnung', 0.1) },
  { id: 'auftakt-03', go: go('.auftakt-blk[data-for="achse"]', -0.3) },
  { id: 'achse', go: go('#achse', 0.3), key: 1, wait: 6000 },
  ...STOPS.map((n, i) => ({ id: 'achse-' + n, go: stop(i), key: 1, wait: 5000 })),
  { id: 'auftakt-04', go: go('.auftakt-blk[data-for="dach"]', -0.3) }, { id: 'dach', go: go('#dach', 0) }, { id: 'leistungen', go: go('#allTitle', -0.1) }, { id: 'manuthera', go: go('#manuthera', 0), wait: 5000 },
  { id: 'stosswelle', go: go('#stosswelle', 0), wait: 6000 }, { id: 'auftakt-05', go: go('.auftakt-blk[data-for="tuer"]', -0.3) }, { id: 'tuer', go: async (p) => { await p.evaluate(() => window.__door && window.__door.reset()); await go('#doorTrack', 0)(p); }, wait: 6500 }, // Tür-Bühne (19.11.): Tür geschlossen, Überschrift oben
  // seit 20.11.2026 geht die Tür auf Antippen auf und man geht über die Zeit hindurch (vorher am Scrollweg)
  // (der Prüfstand rollt beim Laden einmal durch die ganze Seite – dabei gilt die Tür als „vorbeigescrollt“ und steht offen; deshalb reset())
  { id: 'tuer-halb', go: async (p, settle) => { await p.evaluate(() => window.__door && window.__door.reset()); await go('#doorTrack', 0)(p); await settle(4000); await p.evaluate(() => window.__door && window.__door.open()); }, wait: 1900 }, { id: 'tuer-drin', go: go('#doorTrack', 0), wait: 6000 }, // halb hindurch · drinnen, Knöpfe da
  { id: 'kontakt', go: go('#kontakt', -0.1) },
];
// jump: eigene Schwelle für den Sprung (Regel 4 gilt für Kapitelübergänge; allgemein 8)
const FILMS = [
  { id: 'kf-wisch', go: kf(0.1), k: 0.9 },
  { id: '01-nach-02', go: go('#bewegung', -0.7), k: 0.9 },
  { id: '02-nach-hausordnung', go: go('#hausordnung', -0.7), k: 0.9 },
  { id: 'hausordnung-nach-03', go: go('#achse', -0.7), k: 0.9 },
  { id: '03-S1-nach-04', go: stop(5), k: 0.95, wait: 5000 },
  { id: '03-C1-nach-04', go: stop(0), k: 1.4, wait: 5000 },
  { id: '04-zurueck-nach-03', go: go('#dach', 0.1), k: -0.9 },
  { id: 'leistungen-nach-manuthera', go: go('#manuthera', -0.7), k: 0.9 },
  { id: 'stosswelle-nach-05', go: go('#tuer', -0.7), k: 0.9 },
  { id: 'tuer-hindurch', go: async (p, settle) => { await p.evaluate(() => window.__door && window.__door.reset()); await go('#doorTrack', 0)(p); await settle(4500); await p.evaluate(() => window.__door && window.__door.open()); }, k: 0, wait: 100, jump: 8 }, // Tür antippen: der Rahmen zieht am Bild vorbei (gewollt) // ganzer Weg durch die Tür in einem Wisch: der Rahmen zieht am Bild vorbei (gewollt)
];

// ---------- Auswertung im Browser (eigene leere Seite, keine Zusatzpakete) ----------
const ANA = () => {
  const lum = (r, g, b) => 0.2126 * r + 0.7152 * g + 0.0722 * b;
  const lin = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
  const rl = (r, g, b) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  const img = async (b64, w, h) => { const bmp = await createImageBitmap(await (await fetch('data:image/png;base64,' + b64)).blob()); const c = new OffscreenCanvas(w, h), x = c.getContext('2d', { willReadFrequently: true }); x.drawImage(bmp, 0, 0, w, h); return x.getImageData(0, 0, w, h).data; };
  window.state = async ({ a, b, c, w, h, top, groups, ring }) => {
    const A = await img(a, w, h), B = await img(b, w, h), C = await img(c, w, h);
    // Verdeckung: Grafik = helle Bildpunkte in B (unter der Kopfleiste); verdeckt = dort weicht A deutlich ab
    let g = 0, cov = 0;
    for (let y = top; y < h; y++) for (let x = 0; x < w; x++) { if (ring && Math.hypot(x - ring[0], y - ring[1]) > ring[2]) continue; const o = (y * w + x) * 4, lb = lum(B[o], B[o + 1], B[o + 2]); if (lb < 46) continue; g++; if (Math.abs(lum(A[o], A[o + 1], A[o + 2]) - lb) > 34) cov++; }
    // Text: Grund hinter jedem Textstück (Bild C), Kontrast zur Textfarbe
    const texts = groups.map((G) => {
      let n = 0, bad = 0, ink = 0;
      for (const [x0, y0, x1, y1] of G.rects) for (let y = Math.max(top, y0); y < Math.min(h, y1); y++) for (let x = Math.max(0, x0); x < Math.min(w, x1); x++) {
        const o = (y * w + x) * 4, al = G.col[3];
        const tr = G.col[0] * al + C[o] * (1 - al), tg = G.col[1] * al + C[o + 1] * (1 - al), tb = G.col[2] * al + C[o + 2] * (1 - al);
        const l1 = rl(tr, tg, tb), l2 = rl(C[o], C[o + 1], C[o + 2]), cr = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
        n++; if (cr < G.need) bad++;
        if (Math.abs(lum(A[o], A[o + 1], A[o + 2]) - lum(C[o], C[o + 1], C[o + 2])) > 18) ink++;
      }
      // steht der Text wirklich im Bild? (A mit Text gegen C ohne Text) – sonst ist er verdeckt oder anders versteckt: kein Befund
      if (ink < n * 0.012) n = 0;
      return { txt: G.txt, sel: G.sel, px: G.px, bad: n ? Math.round(bad / n * 100) : 0, n };
    });
    return { graphic: +(g / (w * (h - top)) * 100).toFixed(1), occl: g > 400 ? Math.round(cov / g * 100) : null, texts };
  };
  window.film = async ({ frames, w, h, top }) => {
    const stats = []; let prev = null;
    // Streifen: Handy 16 Bilder in einer Reihe (je 180 breit), PC zwei Reihen zu 8 (je 360 breit) – sonst ist am PC nichts zu erkennen
    const wide = w > 600, sw = wide ? 360 : 180, sh = Math.round(h * sw / w), per = wide ? 8 : 12;
    const strip = new OffscreenCanvas(sw * per, sh * Math.ceil(frames.length / per)), sx = strip.getContext('2d');
    for (let i = 0; i < frames.length; i++) {
      const bmp = await createImageBitmap(await (await fetch('data:image/png;base64,' + frames[i])).blob());
      sx.drawImage(bmp, (i % per) * sw, Math.floor(i / per) * sh, sw, sh);
      const c = new OffscreenCanvas(w, h), x = c.getContext('2d', { willReadFrequently: true }); x.drawImage(bmp, 0, 0, w, h);
      const D = x.getImageData(0, 0, w, h).data; let br = 0, ch = 0, n = 0;
      for (let y = top; y < h; y++) for (let xx = 0; xx < w; xx++) { const o = (y * w + xx) * 4, l = lum(D[o], D[o + 1], D[o + 2]); n++; if (l > 96) br++; if (prev && Math.abs(l - lum(prev[o], prev[o + 1], prev[o + 2])) > 30) ch++; }
      stats.push({ bright: +(br / n * 100).toFixed(1), change: prev ? +(ch / n * 100).toFixed(1) : 0 }); prev = D;
    }
    const blob = await strip.convertToBlob({ type: 'image/png' }), buf = new Uint8Array(await blob.arrayBuffer()); let s = ''; for (let i = 0; i < buf.length; i++) s += String.fromCharCode(buf[i]);
    return { stats, strip: btoa(s) };
  };
  window.diff = async ({ a, b, w, h }) => { const A = await img(a, w, h), B = await img(b, w, h); let n = 0; for (let o = 0; o < A.length; o += 4) if (Math.abs(lum(A[o], A[o + 1], A[o + 2]) - lum(B[o], B[o + 1], B[o + 2])) > 26) n++; return +(n / (w * h) * 100).toFixed(1); };
};
// Textstücke im Bild einsammeln (läuft in der geprüften Seite)
const TEXTS = () => {
  const vh = innerHeight, vw = innerWidth, map = new Map();
  const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); let n;
  while ((n = w.nextNode())) {
    if (n.data.trim().length < 1) continue;
    const el = n.parentElement; if (!el || el.closest('#top,.top,.sr-only,[aria-hidden="true"],dialog:not([open])')) continue;
    if (!el.checkVisibility({ opacityProperty: true, visibilityProperty: true })) continue;
    // nur für Vorleseprogramme (auf 1 px beschnitten, z. B. die Karten-Texte am PC): steht nicht im Bild
    let clipped = false; for (let e = el; e && e !== document.body; e = e.parentElement) if ((e.offsetWidth <= 2 || e.offsetHeight <= 2) && getComputedStyle(e).overflow !== 'visible') { clipped = true; break; }
    if (clipped) continue;
    const host = el.closest('h1,h2,h3,p,li,button,a,dt,dd,summary,label,figcaption') || el;
    const rg = document.createRange(); rg.selectNodeContents(n);
    const rects = [...rg.getClientRects()].filter((r) => r.width > 3 && r.height > 3 && r.bottom > 0 && r.top < vh && r.right > 0 && r.left < vw).map((r) => [Math.round(r.left), Math.round(r.top), Math.round(r.right), Math.round(r.bottom)]);
    if (!rects.length) continue;
    let G = map.get(host);
    if (!G) {
      const cs = getComputedStyle(el), m = cs.color.match(/[\d.]+/g).map(Number); let al = m.length > 3 ? m[3] : 1;
      for (let e = el; e && e !== document.body; e = e.parentElement) al *= +getComputedStyle(e).opacity;
      if (al < 0.5) continue; // blendet gerade ein oder aus (oder ist bewusst blass): kein Befund
      const px = parseFloat(cs.fontSize), big = px >= 24 || (px >= 18.66 && +cs.fontWeight >= 600);
      G = { txt: host.textContent.replace(/\s+/g, ' ').trim().slice(0, 44), sel: (host.id ? '#' + host.id : '') + (typeof host.className === 'string' && host.className ? '.' + host.className.split(' ')[0] : '') || host.tagName.toLowerCase(), px: Math.round(px), col: [m[0], m[1], m[2], al], need: big ? 3 : 4.5, rects: [], known: 0 };
      map.set(host, G);
    }
    G.rects.push(...rects);
  }
  window.__psHosts = [...map.keys()]; // für die zweite Sichtbarkeitsprüfung nach den Messbildern (STILL)
  return [...map.entries()].map(([host, G]) => ({ ...G, host: undefined, knownSel: G.sel, known: 0, inKnown: !!host.closest('.statement') }));
};

// Zweite Prüfung nach den Messbildern (Übergänge sind dann abgeschlossen): ist das Textstück immer noch sichtbar? Ein Element, das
// gerade ausblendet (z. B. der Schluss-Block von Kapitel 01 nach dem Zurückscrollen), galt sonst je nach Rechenlast als sichtbar.
const STILL = () => (window.__psHosts || []).map((h) => { if (!h.isConnected || !h.checkVisibility({ opacityProperty: true, visibilityProperty: true })) return false; let al = 1; for (let e = h; e && e !== document.body; e = e.parentElement) al *= +getComputedStyle(e).opacity; return al >= 0.5; });

(async () => {
  const root = path.resolve(__dirname, '..');
  const srv = http.createServer((q, r) => { const f = path.join(root, decodeURIComponent(q.url.split('?')[0])); if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); r.end(); return; } r.writeHead(200); fs.createReadStream(f).pipe(r); });
  await new Promise((ok) => srv.listen(0, '127.0.0.1', ok));
  const URL0 = `http://127.0.0.1:${srv.address().port}/${pageArg}${pageArg.includes('?') ? '&' : '?'}gl=1`; // Seite darf eigene Schalter tragen, z. B. test-4-puls-scan.html?auftakt=a
  const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const ana = await (await b.newContext()).newPage(); await ana.goto('about:blank'); await ana.evaluate(ANA);
  const md = [`# Prüfstand ${new Date().toISOString().slice(0, 16).replace('T', ' ')} · ${pageArg}`, '', `Regeln: Hauptgrafik höchstens ${RULE.occl} % verdeckt · Text höchstens ${RULE.text} % auf unruhigem Grund · Film: nie mehr als ${RULE.bright} % hell, kein Sprung über ${RULE.jump} Punkte.`, ''];
  let fails = 0; const say = (ok, line) => { if (!ok) fails++; const s = (ok ? 'ok     ' : 'FEHLER ') + line; console.log(s); md.push('- ' + s); };

  for (const view of viewsArg.split(',')) {
    const V = VIEWS[view]; if (!V) continue; const [w, h, dpr, label] = V, mob = w < 921;
    const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: dpr, ...(mob ? { isMobile: true, hasTouch: true } : {}) });
    await ctx.addInitScript(() => { let a = 20261118; Math.random = () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; });
    const p = await ctx.newPage(); const errs = [];
    p.on('pageerror', (e) => errs.push(e.message));
    // Uhr der Seite: nach install() läuft sie zunächst in Echtzeit weiter – erst pauseAt() hält sie wirklich an.
    // Danach bewegt sich die Seite nur noch, wenn runFor() sie weiterstellt (settle), die Messbilder A/B/C zeigen denselben Augenblick.
    await p.clock.install({ time: new Date('2026-11-18T10:00:00') });
    await p.goto(URL0);
    await p.waitForTimeout(2500); // Laden in Echtzeit (Schriften, Wirbelsäulen-Datei)
    await p.clock.pauseAt(new Date('2026-11-18T10:00:30'));
    const settle = async (ms) => { for (let t = 0; t < ms; t += 100) await p.clock.runFor(100); };
    await settle(3000);
    // alle Schriften vorab laden: Playwright wartet vor jedem Bild auf Schriften – bei angehaltener Zeit bliebe es sonst hängen,
    // sobald ein Zustand zum ersten Mal einen weiteren Schnitt braucht
    await p.evaluate(() => Promise.all([...document.fonts].map((f) => f.load().catch(() => null))));
    // einmal durchscrollen: alles bauen lassen (Wirbelsäule, Motive, Liege laden erst bei Annäherung)
    const total = await p.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y < total; y += h) { await p.evaluate((v) => scrollTo(0, v), y); await settle(300); }
    await p.evaluate(() => scrollTo(0, 0)); await settle(1500);
    const top = await p.evaluate(() => Math.round((document.querySelector('#top') || document.querySelector('.top')).getBoundingClientRect().bottom));
    // Bild direkt über das DevTools-Protokoll: page.screenshot() wartet intern auf Schriften und bleibt bei angehaltener Zeit
    // an manchen Zuständen hängen (Kap. 03, Nahansicht) – die direkte Aufnahme wartet auf nichts
    const cdp = await ctx.newCDPSession(p);
    // zwei Aufnahmen: die erste (1 Bildpunkt) stößt nur ein frisches Bild an, die zweite zählt – sonst kam vereinzelt noch der
    // Inhalt einer Zeichenfläche von viel früher ins Bild (18.11.: Tür-Bühne von Kapitel 05 im Bild von Kapitel 02)
    const shot = async () => { await cdp.send('Page.captureScreenshot', { format: 'png', clip: { x: 0, y: 0, width: 1, height: 1, scale: 1 } }); return (await cdp.send('Page.captureScreenshot', { format: 'png' })).data; };
    const css = async (txt) => p.evaluate((t) => { let s = document.getElementById('ps-css'); if (!s) { s = document.createElement('style'); s.id = 'ps-css'; document.head.appendChild(s); } s.textContent = t; }, txt);
    console.log(`\n== ${view} · ${label} · ${w}×${h}`); md.push('', `## ${view} · ${label} · ${w}×${h}`, '');

    const ONLY = process.env.NUR ? process.env.NUR.split(',') : null; // NUR=kf-01,achse-Th1 prüft nur diese Zustände/Filme
    if (partsArg.includes('zustand')) for (const S of STATES) {
      if (ONLY && !ONLY.includes(S.id)) continue;
      await S.go(p, settle); await settle(S.wait || 3000); await p.waitForTimeout(900); // CSS-Übergänge laufen in echter Zeit aus
      // Gemessen wird der Ruhezustand: CSS-Animationen (laufen in echter Zeit, z. B. der wippende Pfeil) stehen für alle drei
      // Messbilder, laufende CSS-Übergänge werden beendet. Sonst hängt das Ergebnis von der Rechenlast ab: ein Text, der gerade
      // einblendet, hat halbe Deckkraft und fällt beim Kontrast durch; ein Block, der gerade ausblendet, gilt noch als sichtbar.
      const HOLD = '*,*::before,*::after{animation-play-state:paused!important;transition:none!important}';
      await css(HOLD); await p.waitForTimeout(250);
      let groups = await p.evaluate(TEXTS);
      const a = await shot();
      if (process.env.DBGJS) console.log('   DBGJS', JSON.stringify(await p.evaluate(process.env.DBGJS))); // DBGJS='<Ausdruck>': Seitenzustand je Zustand ausgeben
      await css(HOLD + '*,*::before,*::after{transition:none!important}body *:not(canvas):not(:has(canvas)){visibility:hidden!important}'); await p.waitForTimeout(250); const bImg = await shot();
      await css(HOLD + '*,*::before,*::after{transition:none!important;color:transparent!important;-webkit-text-fill-color:transparent!important;text-shadow:none!important}svg text{fill:transparent!important}'); await p.waitForTimeout(250); const c = await shot();
      { const still = await p.evaluate(STILL); groups = groups.filter((g, i) => still[i] && g.rects.length); }
      await css('');
      fs.writeFileSync(path.join(OUT, `${view}-${S.id}.png`), Buffer.from(a, 'base64'));
      if (process.env.ABC) { fs.writeFileSync(path.join(OUT, `${view}-${S.id}-B.png`), Buffer.from(bImg, 'base64')); fs.writeFileSync(path.join(OUT, `${view}-${S.id}-C.png`), Buffer.from(c, 'base64')); } // ABC=1: auch die Messbilder ablegen
      const ring = S.ring === undefined ? null : await p.evaluate((i) => (window.__kf && window.__kf.ring ? window.__kf.ring(i) : null), S.ring);
      const R = await ana.evaluate((x) => window.state(x), { a, b: bImg, c, w, h, top, groups, ring });
      const bad = R.texts.filter((t, i) => t.n > 60 && t.bad > RULE.text && !groups[i].inKnown).sort((x, y) => y.bad - x.bad);
      const occBad = S.key && R.occl !== null && R.occl > RULE.occl;
      // 20.11.2026: eine Hauptgrafik, die gar nicht im Bild ist, ist ein Fehler (an dem Tag fehlte die Wirbelsäule in allen Haltestellen –
      // der Lauf meldete trotzdem „alles ok“, weil ohne Grafik auch nichts verdeckt sein kann)
      const gone = !!S.key && R.graphic < 0.3;
      if (process.env.DBG) for (const t of bad) { const G = groups[R.texts.indexOf(t)]; console.log('   DBG', t.sel, t.px + 'px', 'Farbe', G.col.map((v) => +v.toFixed(2)).join(','), 'Kontrast nötig', G.need, 'Flächen', JSON.stringify(G.rects.slice(0, 4))); }
      say(!occBad && !bad.length && !gone, `${S.id.padEnd(16)}${gone ? ' HAUPTGRAFIK FEHLT ·' : ''} Grafik ${String(R.graphic).padStart(5)} % des Bilds · verdeckt ${R.occl === null ? ' –' : String(R.occl).padStart(2) + ' %'}${S.key ? '' : ' (nicht Hauptgrafik)'}${bad.length ? ' · Text auf unruhigem Grund: ' + bad.slice(0, 3).map((t) => `„${t.txt.slice(0, 28)}“ ${t.bad} %`).join(', ') : ''}`);
      if (process.env.BASIS && fs.existsSync(path.join(process.env.BASIS, `${view}-${S.id}.png`))) {
        const d = await ana.evaluate((x) => window.diff(x), { a, b: fs.readFileSync(path.join(process.env.BASIS, `${view}-${S.id}.png`)).toString('base64'), w, h });
        if (d > 1.5) { console.log(`         geändert gegenüber BASIS: ${d} % der Bildpunkte`); md.push(`  - geändert gegenüber BASIS: ${d} %`); }
      }
    }

    if (partsArg.includes('film')) for (const F of FILMS) {
      if (ONLY && !ONLY.includes(F.id)) continue;
      await F.go(p, settle); await settle(F.wait || 3000);
      // Wisch wie am Handy: der Weg wird über die ersten 8 Bilder auslaufend verteilt (Schwung), danach 16 Bilder Nachlauf
      // (seit 20.11.2026 24 statt 16 Bilder: die Formwechsel laufen über die Zeit – rund 2 s – und sollen im Streifen zu Ende zu sehen sein)
      const NF = 24;
      const y0 = await p.evaluate(() => scrollY), dist = h * F.k, frames = [];
      for (let i = 0; i < NF; i++) {
        if (i < 8) { const e = 1 - Math.pow(1 - (i + 1) / 8, 3); await p.evaluate((y) => scrollTo(0, y), Math.round(y0 + dist * e)); }
        await p.clock.runFor(40); await p.clock.runFor(40); await p.clock.runFor(40);
        // Die Software-Grafik braucht echte Zeit, bis das neue Bild wirklich steht – ohne diese Pause zeigt die Aufnahme teils noch
        // das vorige Bild (Text und Grafik passen dann nicht zusammen). Nebenwirkung: CSS-Übergänge laufen in dieser Zeit weiter.
        await p.waitForTimeout(350); frames.push(await shot());
      }
      const R = await ana.evaluate((x) => window.film(x), { frames, w, h, top });
      fs.writeFileSync(path.join(OUT, `film-${view}-${F.id}.png`), Buffer.from(R.strip, 'base64'));
      const br = R.stats.map((s) => s.bright), maxB = Math.max(...br); let jump = 0; for (let i = 2; i < br.length; i++) jump = Math.max(jump, Math.abs(br[i] - br[i - 1]));
      const maxC = Math.max(...R.stats.slice(2).map((s) => s.change));
      say(maxB <= RULE.bright && jump <= (F.jump || RULE.jump), `Film ${F.id.padEnd(26)} hell höchstens ${maxB} % · größter Sprung ${jump.toFixed(1)} · größte Änderung je Bild ${maxC} %`);
    }
    say(!errs.length, `Skriptfehler: ${errs.length ? [...new Set(errs)].join(' | ') : 'keine'}`);
    await ctx.close();
  }
  md.push('', fails ? `**${fails} Regelverstöße** – Bilder im Ordner ansehen, Ursache klären.` : '**alles ok**');
  fs.writeFileSync(path.join(OUT, 'bericht.md'), md.join('\n') + '\n');
  console.log(fails ? `\n${fails} Regelverstöße · Bericht: ${path.join(OUT, 'bericht.md')}` : '\nalles ok');
  await b.close(); srv.close(); process.exit(fails ? 1 : 0);
})();
