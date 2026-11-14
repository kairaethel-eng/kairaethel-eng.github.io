// Prüfung der echten Wirbelsäule über einen lokalen Server (14.11.2026): Abrufe, Bereitzeit, sechs Haltestellen als Bild,
// Umschalter (nur Entwurfsseite), lange Aufgaben, Namensnennung, Rückfall bei blockierter Datei.
// Aufruf: cd labor && python3 -m http.server 8765 --bind 127.0.0.1 &   dann   node tools/echt-check.cjs <ausgabeordner> [d,m]
// Nach dem Tausch in Puls: BASE auf die Puls-Seite stellen und die Umschalter-Schritte entfernen.
const { chromium } = require('playwright');
const BASE = 'http://127.0.0.1:8765/wirbelsaeule-echt.html', OUT = process.argv[2], WANT = (process.argv[3] || 'd,m').split(',');
const GL = ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'];
const MODES = { d: { viewport: { width: 1440, height: 900 } }, m: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true } };
const to = (p, sel, k = 0) => p.evaluate(([q, o]) => { const y = q === 'bottom' ? 1e9 : document.querySelector(q).getBoundingClientRect().top + scrollY; scrollTo(0, y + o * innerHeight); }, [sel, k]);
(async () => {
  const b = await chromium.launch({ args: GL });
  for (const mode of WANT) {
    const p = await (await b.newContext(MODES[mode])).newPage(); const logs = [], reqs = [];
    p.on('pageerror', (e) => logs.push('PAGEERR ' + e.message)); p.on('console', (m) => { if (['error', 'warning'].includes(m.type())) logs.push(m.type() + ' ' + m.text().slice(0, 160)); });
    p.on('request', (r) => reqs.push(r.url().replace('http://127.0.0.1:8765/', '')));
    await p.addInitScript(() => { window.__lt = []; try { new PerformanceObserver((l) => l.getEntries().forEach((e) => window.__lt.push([Math.round(e.startTime), Math.round(e.duration)]))).observe({ type: 'longtask', buffered: true }); } catch (e) {} });
    await p.goto(BASE + '?gl=1'); await p.waitForTimeout(4000);
    const t0 = Date.now(); await to(p, '#achse', 0.3);
    let ready = -1; for (let i = 0; i < 90; i++) { await p.waitForTimeout(500); if (await p.evaluate(() => !!(window.__echt && window.__echt.M && window.__wv && window.__wv.det() && window.__wv.det().echt))) { ready = Date.now() - t0; break; } }
    console.log(mode, 'echt bereit nach', ready, 'ms · Modus', await p.evaluate(() => window.__echt.mode + (window.__echt.failed ? ' FAILED' : '')), '· Abrufe:', reqs.join(', '));
    await p.waitForTimeout(6000); await p.screenshot({ path: `${OUT}/${mode}-0-uebersicht.png`, timeout: 150000 });
    const names = ['C1', 'C5', 'Th1', 'Th7', 'L4', 'S1'];
    for (let i = 0; i < 6; i++) { await p.evaluate((i) => document.querySelectorAll('.scan-stop')[i].click(), i); await p.waitForTimeout(mode === 'd' ? 11000 : 9000); await p.screenshot({ path: `${OUT}/${mode}-${i + 1}-${names[i]}.png`, timeout: 150000 }); }
    await p.evaluate(() => document.querySelectorAll('.scan-stop')[4].click()); await p.waitForTimeout(6000);
    const sw0 = Date.now(); await p.evaluate(() => document.querySelector('.wv button[data-m="bisher"]').click());
    let sw = -1; for (let i = 0; i < 60; i++) { await p.waitForTimeout(250); if (await p.evaluate(() => window.__wv.det() && !window.__wv.det().echt)) { sw = Date.now() - sw0; break; } }
    await p.waitForTimeout(7000); await p.screenshot({ path: `${OUT}/${mode}-7-L4-bisher.png`, timeout: 150000 });
    await p.evaluate(() => document.querySelector('.wv button[data-m="echt"]').click()); await p.waitForTimeout(3000);
    console.log(mode, 'Wechsel auf bisher nach', sw, 'ms · zurück echt:', await p.evaluate(() => !!window.__wv.det().echt), '· Adresse', await p.evaluate(() => location.search));
    const lt = await p.evaluate(() => window.__lt); const big = lt.filter((x) => x[1] >= 100).sort((a, c) => c[1] - a[1]).slice(0, 6);
    console.log(mode, 'lange Aufgaben:', lt.length, 'gesamt', lt.reduce((s, x) => s + x[1], 0), 'ms · größte [Start, Dauer]:', JSON.stringify(big));
    console.log(mode, 'Namensnennung:', await p.evaluate(() => (document.querySelector('.foot .credit') || {}).textContent || 'FEHLT'));
    console.log(mode, 'Meldungen:', logs.length ? logs.slice(0, 6).join(' | ') : 'keine');
    await p.close();
  }
  { // Rückfall: Datei nicht ladbar
    const p = await (await b.newContext(MODES.d)).newPage(); const logs = [];
    p.on('pageerror', (e) => logs.push('PAGEERR ' + e.message)); await p.route('**/*.bin', (r) => r.abort());
    await p.goto(BASE + '?gl=1'); await p.waitForTimeout(3000); await to(p, '#achse', 0.3); await p.waitForTimeout(9000);
    console.log('Rückfall (Datei blockiert):', await p.evaluate(() => JSON.stringify({ mode: window.__echt.mode, failed: window.__echt.failed, echtDisabled: document.querySelector('.wv button[data-m="echt"]').disabled, hatSäule: !!window.__wv.det() })), logs.join(' | ') || 'keine Fehler'); await p.close(); }
  await b.close();
})();
