// Bildschirmfotos einer Testseite (Playwright/Chromium im Container, Grafik per SwiftShader).
// Aufruf: node tools/shot.cjs <seite.html> <präfix> <d|m> '<selektor>|<offset in Bildschirmhöhen>' ...
//   d = PC 1440×900, m = Handy 390×844. Selektor 'top' = Seitenanfang. WAIT=ms Wartezeit je Bild (Standard 3000; Kamerafahrten eher 7000).
//   CHANNEL=msedge nutzt ein installiertes Edge/Chrome statt des Playwright-Chromiums. CSS='…' fügt Stilregeln ein (z. B. Text ausblenden für Standbilder).
//   NOGL=1 startet ohne WebGL (Fallback prüfen).
// Beispiel (Wirbelsäule, alle 5 Abschnitte): node tools/shot.cjs test-4-puls-scan.html z d '#achse|0.75' '#achse|1.38' '#achse|2.27' '#achse|3.16' '#achse|3.8'
// Bilder landen in OUT (Standard /tmp/shots). Fehler der Seite werden als „ERR …“ ausgegeben.
const { chromium } = require('playwright');
const path = require('path'), fs = require('fs');
(async () => {
  const [,, file, prefix, mode, ...steps] = process.argv;
  const out = process.env.OUT || '/tmp/shots'; fs.mkdirSync(out, { recursive: true });
  const b = await chromium.launch({ channel: process.env.CHANNEL || undefined, args: process.env.NOGL ? ['--disable-webgl', '--disable-3d-apis'] : ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const mob = mode === 'm';
  const ctx = await b.newContext(mob ? { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true }
    : { viewport: { width: 1440, height: 900 }, ...(process.env.REDUCED ? { reducedMotion: 'reduce' } : {}) });
  const p = await ctx.newPage();
  p.on('pageerror', (e) => console.log('ERR', e.message));
  p.on('console', (m) => { if (m.type() === 'error') console.log('ERR', m.text()); });
  await p.goto('file://' + path.resolve(file) + (process.env.QUERY || '')); // QUERY='?licht=1' für Vergleichszustände
  if (process.env.CSS) await p.addStyleTag({ content: process.env.CSS });
  await p.waitForTimeout(3000);
  let n = 0;
  for (const st of steps) {
    const [sel, off] = st.split('|');
    await p.evaluate(([s, o]) => { const y = s === 'top' ? 0 : document.querySelector(s).getBoundingClientRect().top + scrollY; scrollTo(0, y + parseFloat(o || 0) * innerHeight); }, [sel, off]);
    await p.waitForTimeout(+(process.env.WAIT || 3000));
    const f = `${out}/${prefix}-${n++}.png`;
    await p.screenshot({ path: f, timeout: 90000 }); console.log(f);
  }
  await b.close();
})();
