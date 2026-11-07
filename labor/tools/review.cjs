// Detailprüfung (7.11.2026, Kai: „komplette Seite auf Details prüfen“) – fester Bildersatz aller Zustände + Messungen je Bild.
// Ergänzt tools/audit.cjs (axe, Struktur, Tab-Reihenfolge); Ablauf und Bewertung: labor/PRUEFUNG.md.
// Aufruf: cd labor && node tools/review.cjs <seite.html> <ausgabeordner> [d,m,xl,s,dr]
//   d = PC 1440×900 · xl = 2560×1440 · m = Handy 390×844 · s = 320×568 · dr = PC „Bewegung reduzieren“. Standard: d,m,xl
//   WAIT=ms Grundwartezeit je Bild (Standard 4000; Wirbelsäule/Kamerafahrten automatisch ×2,5), QUERY='?…' hängt an die Adresse.
// Ergebnis: <mode>-NN-<zustand>.png, serv-<mode>-NN.png (alle Leistungs-Motive), sheet-<mode>.png (Kontaktbogen),
//   report.json und review.md (Befunde je Zustand: Fehler, überlappende/abgeschnittene Texte, Mini-Schrift, Querscrollen, lange Aufgaben).
// Hinweis: SwiftShader rendert langsam (2–9 fps) → Bewegung/Tempo nicht bewertbar, lange Aufgaben nur relativ vergleichen.
const { chromium } = require('playwright');
const path = require('path'), fs = require('fs');
const FILE = path.resolve(process.argv[2] || 'test-4-puls-scan.html');
const OUT = path.resolve(process.argv[3] || '/tmp/review'); fs.mkdirSync(OUT, { recursive: true });
const WANT = (process.argv[4] || 'd,m,xl').split(',');
const WAIT = +(process.env.WAIT || 4000);
const MODES = {
  d: { viewport: { width: 1440, height: 900 } },
  dr: { viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' },
  xl: { viewport: { width: 2560, height: 1440 } },
  m: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
  s: { viewport: { width: 320, height: 568 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
};
// Zustände: go = 'selektor|offset' (scrollen) oder Funktion im Browser; slow = Kamerafahrt/Aufbau (längere Wartezeit)
const scroll = (sel, off = 0) => ({ go: `${sel}|${off}` });
const click = (sel, i = 0) => ({ js: [`(() => { const e = document.querySelectorAll(${JSON.stringify(sel)})[${i}]; if (!e) return false; e.click(); return true; })()`] });
const STATES = [
  { id: 'start', ...scroll('top') },
  { id: 'bewegung', ...scroll('#bewegung') },
  { id: 'achse', ...scroll('#achse', 0.3), slow: 2 },
  ...['C1', 'C5', 'Th1', 'Th7', 'L4', 'S1'].map((n, i) => ({ id: 'achse-' + n, ...click('.scan-stop', i), slow: 1 })),
  { id: 'dach', ...scroll('#dach'), slow: 1 },
  { id: 'ego', ...click('#egoOpen'), slow: 1.5, after: 'Escape' },
  { id: 'manuthera', ...scroll('#manuthera'), slow: 1 },
  { id: 'leistungen', ...scroll('#allTitle', -0.3), serv: true },
  { id: 'hausordnung', ...scroll('#hausordnung') },
  { id: 'tuer', ...scroll('#tuer') },
  { id: 'termin', ...click('#tuer [data-termin]'), after: 'Escape' },
  { id: 'fuss', go: 'bottom|0' },
];
const SKIP = { s: ['achse-C5', 'achse-Th1', 'achse-Th7', 'ego'], dr: ['achse-C5', 'achse-Th1', 'achse-Th7', 'achse-S1'] };

// Messungen im Browser (je Zustand)
function measure() {
  const vw = innerWidth, vh = innerHeight, out = { overlap: [], offX: [], tiny: [], hScroll: document.documentElement.scrollWidth > vw + 1 };
  const label = (e) => (e.getAttribute('aria-label') || e.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 40);
  const seen = (e) => {
    if (!e.checkVisibility({ opacityProperty: true, visibilityProperty: true })) return false;
    for (let a = e; a; a = a.parentElement) if (parseFloat(getComputedStyle(a).opacity) < 0.15) return false;
    return true;
  };
  // sichtbarer Ausschnitt: mit allen Vorfahren schneiden, die abschneiden (overflow/clip) – z. B. Volltext nur für Vorleseprogramme
  const clipRect = (e) => {
    const b = e.getBoundingClientRect(); let r = { left: b.left, top: b.top, right: b.right, bottom: b.bottom };
    for (let a = e.parentElement; a && a !== document.body; a = a.parentElement) {
      const cs = getComputedStyle(a);
      if (cs.overflowX === 'visible' && cs.overflowY === 'visible' && cs.clip === 'auto' && cs.clipPath === 'none') continue;
      const q = a.getBoundingClientRect();
      r = { left: Math.max(r.left, q.left), top: Math.max(r.top, q.top), right: Math.min(r.right, q.right), bottom: Math.min(r.bottom, q.bottom) };
    }
    r.width = r.right - r.left; r.height = r.bottom - r.top; return r;
  };
  // Verdeckt: offener modaler Dialog → nur sein Inhalt zählt; feste Kopfleiste → Inhalt darunter zählt nicht (normales Scrollen)
  const modal = [...document.querySelectorAll('dialog[open]')].find((d) => d.matches(':modal'));
  const bar = document.querySelector('nav.top'), barB = bar && getComputedStyle(bar).position === 'fixed' ? bar.getBoundingClientRect().bottom : 0;
  const els = [...document.querySelectorAll('body *')].filter((e) => {
    if (['SCRIPT', 'STYLE', 'CANVAS', 'SVG', 'svg', 'path'].includes(e.tagName)) return false;
    if (![...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) return false;
    if (modal && !modal.contains(e)) return false;
    const r = clipRect(e);
    if (r.width <= 1 || r.height <= 1 || r.bottom < 0 || r.top > vh) return false; // nur im Bild, sr-only raus
    if (!modal && bar && !bar.contains(e) && r.top < barB - 2) return false;
    return seen(e);
  }).map((e) => ({ e, r: clipRect(e) }));
  for (const { e, r } of els) {
    if (r.right > vw + 1 || r.left < -1) out.offX.push(`${label(e)} [${Math.round(r.left)}…${Math.round(r.right)}]`);
    const fs = parseFloat(getComputedStyle(e).fontSize); if (fs < 11) out.tiny.push(`${label(e)} ${fs}px`);
  }
  for (let i = 0; i < els.length; i++) for (let j = i + 1; j < els.length; j++) {
    const a = els[i], b = els[j];
    if (a.e.contains(b.e) || b.e.contains(a.e)) continue;
    if (label(a.e).length <= 2 && label(b.e).length <= 2) continue; // einzeln animierte Buchstaben mit engem Zeilenabstand (gewollt)
    const w = Math.min(a.r.right, b.r.right) - Math.max(a.r.left, b.r.left), h = Math.min(a.r.bottom, b.r.bottom) - Math.max(a.r.top, b.r.top);
    if (w > 4 && h > 4) out.overlap.push(`„${label(a.e)}“ × „${label(b.e)}“ (${Math.round(w)}×${Math.round(h)} px)`);
  }
  out.overlap = out.overlap.slice(0, 12); out.offX = out.offX.slice(0, 12); out.tiny = [...new Set(out.tiny)].slice(0, 12);
  out.longTasks = window.__lt ? { n: window.__lt.n, ms: Math.round(window.__lt.ms) } : null;
  return out;
}

(async () => {
  const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const report = { file: FILE, date: new Date().toISOString(), modes: {} };
  for (const mode of WANT) {
    const t0 = Date.now(), ctx = await b.newContext(MODES[mode]), p = await ctx.newPage();
    await p.addInitScript(() => { window.__lt = { n: 0, ms: 0 }; try { new PerformanceObserver((l) => l.getEntries().forEach((e) => { window.__lt.n++; window.__lt.ms += e.duration; })).observe({ type: 'longtask', buffered: true }); } catch (e) {} });
    const logs = [];
    p.on('pageerror', (e) => logs.push('PAGEERR ' + e.message));
    p.on('console', (m) => { if (m.type() === 'error') logs.push('ERROR ' + m.text().slice(0, 300)); });
    await p.goto('file://' + FILE + (process.env.QUERY || ''));
    await p.waitForTimeout(WAIT);
    const rep = { states: [], logs };
    let n = 0;
    for (const st of STATES) {
      if ((SKIP[mode] || []).includes(st.id)) continue;
      const nLog = logs.length;
      let ok = true;
      if (st.go) ok = await p.evaluate(([s, o]) => {
        const el = s === 'top' || s === 'bottom' ? null : document.querySelector(s);
        if (!el && s !== 'top' && s !== 'bottom') return false;
        const y = s === 'bottom' ? document.documentElement.scrollHeight : el ? el.getBoundingClientRect().top + scrollY : 0;
        scrollTo(0, y + parseFloat(o) * innerHeight); return true;
      }, st.go.split('|'));
      else ok = await p.evaluate(st.js[0]);
      await p.waitForTimeout(WAIT * (1 + (st.slow || 0) * 1.5));
      const f = `${mode}-${String(n++).padStart(2, '0')}-${st.id}.png`;
      await p.screenshot({ path: path.join(OUT, f), timeout: 150000 });
      const m = await p.evaluate(measure);
      const row = { id: st.id, file: f, ok, ...m, errors: logs.slice(nLog) };
      if (st.serv) { // alle Leistungs-Motive als Ausschnitt der Bühne
        row.serv = [];
        const cnt = await p.evaluate(() => document.querySelectorAll('#index li button').length);
        for (let i = 0; i < cnt; i++) {
          const name = await p.evaluate((i) => { const bt = document.querySelectorAll('#index li button')[i]; bt.focus({ preventScroll: true }); return bt.querySelector('.ix-name').textContent; }, i);
          await p.waitForTimeout(2600);
          const sf = `serv-${mode}-${String(i).padStart(2, '0')}.png`, stage = await p.$('.serv-stage');
          if (stage) { await stage.screenshot({ path: path.join(OUT, sf), timeout: 60000 }); row.serv.push(`${sf} ${name}`); }
        }
      }
      if (st.after) { await p.keyboard.press(st.after); await p.waitForTimeout(600); }
      rep.states.push(row);
      console.log(mode, row.id, ok ? '' : '(nicht gefunden)', `überlapp ${m.overlap.length} · außen ${m.offX.length} · klein ${m.tiny.length}${m.hScroll ? ' · QUERSCROLLEN' : ''}${row.errors.length ? ' · FEHLER ' + row.errors.length : ''}`);
    }
    rep.seconds = Math.round((Date.now() - t0) / 1000);
    report.modes[mode] = rep;
    await ctx.close();
    // Kontaktbogen (Bilder mit Namen in einem Raster)
    const imgs = rep.states.map((s) => s.file).concat(rep.states.flatMap((s) => (s.serv || []).map((x) => x.split(' ')[0])));
    const sp = await b.newPage({ viewport: { width: 1800, height: 1000 } });
    const sheetHtml = path.join(OUT, `sheet-${mode}.html`); // als Datei neben den Bildern (von about:blank lädt Chromium keine file://-Bilder)
    fs.writeFileSync(sheetHtml, `<!doctype html><meta charset="utf-8"><body style="margin:0;background:#111;color:#ddd;font:13px sans-serif;display:grid;grid-template-columns:repeat(6,1fr);gap:6px;padding:6px">${imgs.map((f) => `<figure style="margin:0"><img src="${f}" style="width:100%;display:block"><figcaption>${f}</figcaption></figure>`).join('')}</body>`);
    await sp.goto('file://' + sheetHtml, { waitUntil: 'load' });
    await sp.screenshot({ path: path.join(OUT, `sheet-${mode}.png`), fullPage: true });
    await sp.close();
  }
  await b.close();
  fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(report, null, 1));
  // Kurzbericht
  const L = [`# Detailprüfung – ${path.basename(FILE)} – ${report.date.slice(0, 16)}`, ''];
  for (const [mode, rep] of Object.entries(report.modes)) {
    L.push(`## ${mode} (${MODES[mode].viewport.width}×${MODES[mode].viewport.height}${MODES[mode].reducedMotion ? ', reduziert' : ''}) – ${rep.seconds} s, Fehler gesamt ${rep.logs.length}`, '');
    for (const s of rep.states) {
      const f = [];
      if (!s.ok) f.push('Zustand nicht erreicht');
      if (s.hScroll) f.push('Querscrollen');
      if (s.errors.length) f.push('Fehler: ' + s.errors.join(' | '));
      if (s.overlap.length) f.push('Überlappung: ' + s.overlap.join('; '));
      if (s.offX.length) f.push('Außerhalb: ' + s.offX.join('; '));
      if (s.tiny.length) f.push('Schrift < 11 px: ' + s.tiny.join('; '));
      L.push(`- **${s.id}** (${s.file})${s.longTasks ? ` · lange Aufgaben bisher ${s.longTasks.n} / ${s.longTasks.ms} ms` : ''}${f.length ? '\n  - ' + f.join('\n  - ') : ' · ok'}`);
      if (s.serv) L.push('  - Motive: ' + s.serv.join(' · '));
    }
    L.push('');
  }
  fs.writeFileSync(path.join(OUT, 'review.md'), L.join('\n'));
  console.log('fertig →', path.join(OUT, 'review.md'));
})().catch((e) => { console.error('FATAL', e); process.exit(1); });
