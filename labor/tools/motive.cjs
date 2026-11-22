// Kontaktbogen der Leistungs-Motive und der Manuthera-Bühne (20.11.2026): je Motiv ein Ausschnitt der Zeichenfläche, alle auf einem Blatt.
// Aufruf: node tools/motive.cjs <seite.html> <ordner> [d|m] [WAIT=ms]
//   d = PC 1440×900 (Standard), m = Handy 390×692. Ergebnis: <ordner>/motive-<ansicht>.png (Bogen), manu-<ansicht>-<n>.png (vier Bewegungen).
//   NUR=3,7 zeigt nur diese Motive (Zählung ab 0). T=sek hält die Zeit an dieser Stelle an (gleiche Bilder bei jedem Lauf).
// Die Seite läuft im Prüfmodus (?gl=1, Software-Grafik): Form und Ordnung sind beurteilbar, Tempo und Flüssigkeit nicht.
const { chromium } = require('playwright');
const path = require('path'), fs = require('fs');
(async () => {
  const [,, file = 'live/index.html', out = '/tmp/motive', mode = 'd'] = process.argv;
  fs.mkdirSync(out, { recursive: true });
  const mob = mode === 'm', wait = +(process.env.WAIT || 2600);
  const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const ctx = await b.newContext(mob ? { viewport: { width: 390, height: 692 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true } : { viewport: { width: 1440, height: 900 } });
  const p = await ctx.newPage();
  p.on('pageerror', (e) => console.log('ERR', e.message));
  p.on('console', (m) => { if (m.type() === 'error' && !/wirbelsaeule-echt/.test(m.text())) console.log('ERR', m.text()); });
  // eigener kleiner Server (wie der Prüfstand): nur so laden die Dateien neben der Seite (echte Knochen der Motive, echte Wirbelsäule)
  const root = path.dirname(path.resolve(file));
  const srv = require('http').createServer((q, r) => { const f = path.join(root, decodeURIComponent(q.url.split('?')[0])); if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'content-type': f.endsWith('.html') ? 'text/html; charset=utf-8' : 'application/octet-stream' }); fs.createReadStream(f).pipe(r); });
  await new Promise((ok) => srv.listen(0, '127.0.0.1', ok));
  await p.goto(`http://127.0.0.1:${srv.address().port}/${path.basename(file)}?gl=1`);
  await p.waitForTimeout(2500);
  const to = async (sel, off) => { await p.evaluate(([s, o]) => { const y = document.querySelector(s).getBoundingClientRect().top + scrollY; scrollTo(0, y + o * innerHeight); }, [sel, off]); };
  // ---- Leistungs-Motive ----
  await to('#allTitle', -0.15);
  await p.waitForTimeout(6000);
  const n = await p.locator('#index > li > button').count();
  const only = process.env.NUR ? process.env.NUR.split(',').map(Number) : null;
  const shots = [];
  for (let i = 0; i < n; i++) {
    if (only && !only.includes(i)) continue;
    await p.evaluate((k) => { const el = document.querySelectorAll('#index > li > button')[k]; el.dispatchEvent(new PointerEvent('pointerenter')); el.focus({ preventScroll: true }); }, i);
    await p.waitForTimeout(wait);
    const f = `${out}/motiv-${mode}-${String(i).padStart(2, '0')}.png`;
    await p.locator('#glServ').screenshot({ path: f, omitBackground: false });
    shots.push({ f, name: await p.locator('#servName').textContent() });
    console.log(f);
  }
  // ---- Manuthera: vier Bewegungen ----
  if (!only) {
    await to('#manuthera', mob ? 0.25 : -0.1);
    await p.waitForTimeout(9000);
    const m = await p.locator('#manuModes button').count();
    for (let i = 0; i < m; i++) {
      await p.locator('#manuModes button').nth(i).click();
      await p.waitForTimeout(3600);
      const f = `${out}/manu-${mode}-${i}.png`;
      await p.locator('#glManu').screenshot({ path: f });
      shots.push({ f, name: 'Manuthera ' + (await p.locator('#manuModes button').nth(i).textContent()).trim() });
      console.log(f);
    }
  }
  // ---- Bogen ----
  const q = await ctx.newPage();
  await q.setViewportSize({ width: 1600, height: 1000 });
  await q.setContent(`<body style="margin:0;background:#0A161B;color:#EDE8DC;font:14px sans-serif"><div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;padding:6px">${shots.map((s) => `<figure style="margin:0;background:#0B1418"><img src="data:image/png;base64,${fs.readFileSync(s.f).toString('base64')}" style="width:100%;display:block"><figcaption style="padding:4px 8px">${s.name}</figcaption></figure>`).join('')}</div></body>`);
  await q.screenshot({ path: `${out}/motive-${mode}.png`, fullPage: true });
  console.log(`${out}/motive-${mode}.png`);
  await b.close(); srv.close();
})();
