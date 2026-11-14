// Standbilder für den Bandscheibenvorfall-Film (Besucher ohne nutzbares WebGL): je Abschnitt ein Bild der Bühne
// → assets/vorfall-1.webp … vorfall-5.webp (1280×720, mit Beschriftungen, ohne Untertitel). Aufruf im Container:
//   node build.mjs vorfall && node tools/vorfall-stills.cjs
// Die Zeiten kommen aus dem Film selbst (KEY_T in src/vorfall/film.js → window.__vorfall.keys).
const { chromium } = require('playwright');
const path = require('path'), fs = require('fs');
(async () => {
  const root = path.join(__dirname, '..');
  const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const p = await (await b.newContext({ viewport: { width: 1312, height: 900 }, deviceScaleFactor: 1 })).newPage();
  p.on('pageerror', (e) => console.log('ERR', e.message));
  await p.goto('file://' + path.join(root, 'bandscheibenvorfall.html') + '?gl=1&t=0');
  await p.waitForFunction(() => window.__vorfall && window.__vorfall.state && window.__vorfall.state().ready, null, { timeout: 120000 });
  await p.addStyleTag({ content: '.wrap{max-width:none!important;padding:0 16px!important}.vf-stage{height:720px!important;width:1280px!important;border:0!important;border-radius:0!important}.vf-stage::before,.vf-stage::after,.vf-cap,.vf-big{display:none!important}.top,.grain{display:none!important}' });
  const keys = await p.evaluate(() => window.__vorfall.keys);
  for (let i = 0; i < keys.length; i++) {
    await p.evaluate((t) => window.__vorfall.seek(t), keys[i]);
    await p.waitForTimeout(2500);
    const png = await p.locator('.vf-stage').screenshot();
    const webp = await p.evaluate(async (b64) => {
      const im = new Image(); im.src = 'data:image/png;base64,' + b64; await im.decode();
      const c = document.createElement('canvas'); c.width = 1280; c.height = 720; c.getContext('2d').drawImage(im, 0, 0, 1280, 720);
      return c.toDataURL('image/webp', 0.82).split(',')[1];
    }, png.toString('base64'));
    const f = path.join(root, 'assets', `vorfall-${i + 1}.webp`);
    fs.writeFileSync(f, Buffer.from(webp, 'base64')); console.log(f, (fs.statSync(f).size / 1024).toFixed(0) + ' KB');
  }
  await b.close();
})();
