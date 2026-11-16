// axe-core (WCAG 2.2 AA) für „Von Kopf bis Fuß“ an Start, Station 1–4 und Schluss; Handy 390×844 und PC 1440×900.
// Aufruf: cd labor && npm i -D --no-save axe-core && node tools/kopf-fuss-axe.cjs   (NOGL=1 ohne WebGL)   FILE=figur-plus.html prüft den Entwurf „Figur plus“
const { chromium } = require('playwright');
const path = require('path'), fs = require('fs');
const AXE = fs.readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');
(async () => {
  const b = await chromium.launch({ args: process.env.NOGL ? ['--disable-webgl'] : ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  for (const [name, vp] of [['m', { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }], ['d', { viewport: { width: 1440, height: 900 } }]]) {
    const ctx = await b.newContext({ ...vp, reducedMotion: 'reduce' }); // ohne Blenden: Text steht sofort voll da
    const p = await ctx.newPage();
    await p.goto('file://' + path.resolve(__dirname, '..', process.env.FILE || 'kopf-bis-fuss.html') + '?gl=1');
    await p.addScriptTag({ content: AXE });
    for (const u of [0, 1.4, 2.9, 4.6, 6.2, 7.8]) {
      await p.evaluate((x) => window.__kf.go(x), u); await p.waitForTimeout(1500);
      const v = await p.evaluate(async () => (await axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa', 'best-practice'] } })).violations.map((x) => `${x.id} (${x.nodes.length}): ${x.nodes.slice(0, 3).map((n) => n.target.join(' ')).join(' | ')}`));
      console.log(name, u, v.length ? v.join('\n   ') : 'ok');
    }
    await ctx.close();
  }
  await b.close();
})();
