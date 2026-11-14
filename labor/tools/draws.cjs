// Zeichenaufrufe je Zeichenfläche und Kapitel zählen (T1, 13.11.2026) + Qualitätsstufen auslösen (T2, ?gl=2).
// Aufruf: cd labor && node tools/draws.cjs live/index.html <ausgabeordner>   (~3 min; zwei Kontrollbilder landen im Ordner)
// Soll: Hauptbühne „gl“ zeichnet im Hero und an der Wirbelsäule, in Manuthera/Leistungen/Kontakt 0 Aufrufe (ruht),
//       nach dem Zurückscrollen wieder > 0; Stufen 0 → 1 → 2 mit kleiner werdender Zeichenfläche. Kap. 04 (Linienhaus): siehe UEBERGABE N1.
const { chromium } = require('playwright'); const path = require('path');
const F = 'file://' + path.resolve(process.argv[2]);
const init = () => { window.__d = {}; for (const fn of ['drawArrays', 'drawElements', 'drawArraysInstanced', 'drawElementsInstanced']) { const o = WebGL2RenderingContext.prototype[fn]; WebGL2RenderingContext.prototype[fn] = function (...a) { const k = this.canvas.id || 'x'; window.__d[k] = (window.__d[k] || 0) + 1; return o.apply(this, a); }; } };
const to = (p, sel, k = 0) => p.evaluate(([q, o]) => { const y = q === 'top' ? 0 : q === 'bottom' ? 1e9 : document.querySelector(q).getBoundingClientRect().top + scrollY; scrollTo(0, y + o * innerHeight); }, [sel, k]);
const count = async (p, ms) => { await p.evaluate(() => { window.__d = {}; }); await p.waitForTimeout(ms); return p.evaluate(() => JSON.stringify(window.__d)); };
(async () => {
  const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  for (const [name, ctx] of [['PC 1440×900', { viewport: { width: 1440, height: 900 } }], ['Handy 390×844', { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true }]]) {
    const p = await (await b.newContext(ctx)).newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message)); await p.addInitScript(init);
    await p.goto(F + '?gl=1'); await p.waitForTimeout(5000);
    console.log(name, 'Hero 3 s:', await count(p, 3000));
    await to(p, '#manuthera', 0.1); await p.waitForTimeout(9000); console.log(name, 'Manuthera 3 s:', await count(p, 3000));
    await to(p, '#allTitle', 0.4); await p.waitForTimeout(7000); console.log(name, 'Leistungen 3 s:', await count(p, 3000));
    await to(p, 'bottom'); await p.waitForTimeout(7000); console.log(name, 'Kontakt 3 s:', await count(p, 3000), 'points.visible über uAlpha → Canvas-Pixel Mitte:', await p.evaluate(() => { const c = document.querySelector('#gl'); return c.width + '×' + c.height; }));
    await p.screenshot({ path: `${process.argv[3]}/t1-${name.slice(0, 2)}-kontakt.png`, timeout: 150000 });
    await to(p, '#achse', 0.3); await p.waitForTimeout(9000); console.log(name, 'zurück Wirbelsäule 3 s:', await count(p, 3000));
    await to(p, 'top'); await p.waitForTimeout(7000); console.log(name, 'zurück Hero 3 s:', await count(p, 3000), errs.length ? 'ERR ' + errs.join('|') : 'keine Fehler');
    await p.screenshot({ path: `${process.argv[3]}/t1-${name.slice(0, 2)}-hero.png`, timeout: 150000 });
    await p.close();
  }
  { const p = await (await b.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 })).newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
    await p.goto(F + '?gl=2'); const log = [];
    for (let i = 0; i < 12; i++) { await p.waitForTimeout(2500); log.push(await p.evaluate(() => (document.documentElement.dataset.q || '0') + ':' + document.querySelector('#gl').width)); }
    console.log('Qualitätsstufen ?gl=2 (Stufe:Canvasbreite alle 2,5 s):', log.join(' '), errs.length ? 'ERR ' + errs.join('|') : 'keine Fehler');
    await p.screenshot({ path: `${process.argv[3]}/t2-q.png`, timeout: 150000 }); await p.close(); }
  await b.close();
})();
