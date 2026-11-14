// Prüfung „Film Bandscheibenvorfall“ in Puls (Auftrag Z, 14.11.2026; seit 14.11. nachts „Fokus“ = Film auf der Hauptbühne):
// Knopf in der Karte L4–L5 (PC-Karte, Handy-Scanner-Karte) → Übergabe von der Wirbelsäule (auflösen, heranfahren, Scan-Linie), Film baut
// erst beim Öffnen auf und läuft, Hauptbühne ruht, „Kurz erklärt“, Esc schließt, Fokus zurück, Scrollen/Wischen schließt; ohne WebGL
// Standbilder; „Bewegung reduzieren“ = kein Selbststart, keine Übergabe. Aufruf: cd labor && python3 -m http.server 8765 --bind 127.0.0.1 &
//   dann node tools/vorfall-check.cjs <ausgabeordner> [d,m,n,r]   (PAGE=live/index.html Standard)
// d = PC 1440×900, m = Handy 390×844, n = PC ohne WebGL (Software-Grafik ohne ?gl=1), r = PC „Bewegung reduzieren“
const { chromium } = require('playwright');
const BASE = 'http://127.0.0.1:8765/' + (process.env.PAGE || 'live/index.html'), OUT = process.argv[2], WANT = (process.argv[3] || 'd,m,n,r').split(',');
const GL = ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'];
const CTX = {
  d: { viewport: { width: 1440, height: 900 } }, n: { viewport: { width: 1440, height: 900 } }, r: { viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' },
  m: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
};
(async () => {
  const b = await chromium.launch({ args: GL });
  for (const mode of WANT) {
    const p = await (await b.newContext(CTX[mode])).newPage(); const logs = [];
    p.on('pageerror', (e) => logs.push('PAGEERR ' + e.message)); p.on('console', (m) => { if (m.type() === 'error') logs.push(m.text().slice(0, 160)); });
    await p.addInitScript(() => { window.__d = {}; for (const fn of ['drawArrays', 'drawElements']) { const o = WebGL2RenderingContext.prototype[fn]; WebGL2RenderingContext.prototype[fn] = function (...a) { const k = this.canvas.id || this.canvas.className || 'x'; window.__d[k] = (window.__d[k] || 0) + 1; return o.apply(this, a); }; } });
    await p.goto(BASE + (mode === 'n' ? '' : '?gl=1')); await p.waitForTimeout(3000);
    await p.evaluate(() => scrollTo(0, innerHeight)); await p.waitForTimeout(800);
    await p.evaluate(() => scrollTo(0, document.querySelector('#achse').getBoundingClientRect().top + scrollY + innerHeight * 0.3)); await p.waitForTimeout(4000);
    if (mode !== 'n') await p.evaluate(() => document.querySelectorAll('.scan-stop')[4].click()); else await p.evaluate(() => document.querySelector('.segnav button[data-seg="4"]').click());
    await p.waitForTimeout(mode === 'm' ? 9000 : 11000);
    const sel = mode === 'm' ? '.scan-chips.is-on .vf-open' : '.seg-card.is-on .vf-open';
    const vis = await p.evaluate((s) => { const e = document.querySelector(s); if (!e) return 'fehlt'; const r = e.getBoundingClientRect(); return r.width > 0 && r.top >= 0 && r.bottom <= innerHeight ? `sichtbar ${Math.round(r.width)}×${Math.round(r.height)} bei y ${Math.round(r.top)}` : 'außerhalb ' + Math.round(r.top); }, sel);
    console.log(mode, 'Knopf in der Karte L4–L5:', vis, '· Film vor dem Öffnen gebaut:', await p.evaluate(() => !!(window.__vf && window.__vf.film)));
    await p.screenshot({ path: `${OUT}/${mode}-0-karte.png`, timeout: 150000 });
    await p.evaluate((s) => document.querySelector(s).click(), sel); await p.waitForTimeout(500);
    console.log(mode, 'Film offen:', await p.evaluate(() => document.querySelector('#vorfallSheet').open), '· Fokus:', await p.evaluate(() => document.activeElement.id || document.activeElement.className), '· Übergabe von der Wirbelsäule:', await p.evaluate(() => window.__vf.fx.hand), '· Seite ausgeblendet:', await p.evaluate(() => document.documentElement.classList.contains('vf-focus')));
    let st = null; for (let i = 0; i < 40; i++) { await p.waitForTimeout(500); st = await p.evaluate(() => window.__vf.film && window.__vf.film.state && window.__vf.film.state()); if (st && st.ready && (st.playing || mode !== 'd' && mode !== 'm')) break; }
    for (let i = 0; i < 60 && !(await p.evaluate(() => window.__vf.fx.rest)); i++) await p.waitForTimeout(500); // Übergabe (Scan-Linie) abwarten: danach ruht die Hauptbühne
    await p.waitForTimeout(mode === 'n' ? 1500 : 3000);
    await p.evaluate(() => { window.__d = {}; }); await p.waitForTimeout(3000);
    const draws = await p.evaluate(() => JSON.stringify(window.__d));
    st = await p.evaluate(() => { const s = window.__vf.film.state(); return { t: +s.t.toFixed(1), playing: s.playing, ready: s.ready, gl: s.gl, chap: s.chap }; });
    console.log(mode, 'Film:', JSON.stringify(st), '· Zeichenaufrufe 3 s:', draws, '(gl = Hauptbühne, soll fehlen)');
    await p.screenshot({ path: `${OUT}/${mode}-1-film.png`, timeout: 150000 });
    if (mode === 'n') { await p.evaluate(() => document.querySelectorAll('.vf-chap')[3].click()); await p.waitForTimeout(800); console.log(mode, 'Standbild nach Abschnitt 4:', await p.evaluate(() => document.querySelector('.vf-stage').dataset.still + ' ' + getComputedStyle(document.querySelector('.vf-stage')).backgroundImage.slice(0, 60))); await p.screenshot({ path: `${OUT}/${mode}-2-still4.png` }); }
    await p.evaluate(() => document.querySelector('#vfInfo').click()); await p.waitForTimeout(800);
    console.log(mode, '„Kurz erklärt“ offen:', await p.evaluate(() => !document.querySelector('#vfMore').hidden && document.querySelector('#vfInfo').getAttribute('aria-expanded')), '· Film hält an:', await p.evaluate(() => !window.__vf.film.state().playing));
    await p.screenshot({ path: `${OUT}/${mode}-3-erklaert.png`, timeout: 150000 });
    await p.evaluate(() => document.querySelector('#vfInfo').click()); await p.waitForTimeout(400);
    await p.keyboard.press('Escape'); await p.waitForTimeout(800);
    console.log(mode, 'nach Esc: offen', await p.evaluate(() => document.querySelector('#vorfallSheet').open), '· Fokus', await p.evaluate(() => document.activeElement.className), '· Film läuft', await p.evaluate(() => window.__vf.film.state().playing));
    await p.evaluate(() => { window.__d = {}; }); await p.waitForTimeout(3000);
    console.log(mode, 'Zeichenaufrufe 3 s nach dem Schließen:', await p.evaluate(() => JSON.stringify(window.__d)), '· Seite wieder da:', await p.evaluate(() => !document.documentElement.classList.contains('vf-focus') && !window.__vf.fx.rest));
    // Weiter durch Scrollen (PC: Mausrad) bzw. Wischen (Handy)
    await p.evaluate((s) => document.querySelector(s).click(), sel); await p.waitForTimeout(mode === 'n' || mode === 'r' ? 1500 : 6000);
    const y0 = await p.evaluate(() => scrollY);
    if (mode === 'm') { const c = await p.context().newCDPSession(p); const tp = (y) => [{ x: 195, y }]; await c.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: tp(520) }); for (let y = 500; y >= 380; y -= 20) { await c.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: tp(y) }); await p.waitForTimeout(30); } await c.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); }
    else { await p.mouse.move(700, 450); await p.mouse.wheel(0, 300); }
    await p.waitForTimeout(2500);
    console.log(mode, 'nach Scrollen/Wischen: offen', await p.evaluate(() => document.querySelector('#vorfallSheet').open), '· Seite gescrollt um', await p.evaluate((y) => Math.round(scrollY - y), y0), 'px · Meldungen:', logs.length ? logs.slice(0, 5).join(' | ') : 'keine');
    await p.close();
  }
  await b.close();
})();
