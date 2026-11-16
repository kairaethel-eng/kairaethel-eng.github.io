// Prüfung „Von Kopf bis Fuß“ (Auftrag K): Bilder an festen Stellen der Fahrt + Zustand (window.__kf.state()) + Meldungen der Seite.
// Aufruf: node tools/kopf-fuss-check.cjs <d|m|xl> <präfix> [u,u,…]   (u = Bildschirmhöhen seit Beginn der Bühne; Standard: Start, 4 Stationen, Schluss)
//   d = 1440×900, m = 390×844 (Handy, Touch), xl = 2560×1440. WAIT=ms je Bild (Standard 6000, SwiftShader ist langsam).
//   REDUCED=1 „Bewegung reduzieren“, NOGL=1 ohne WebGL, TAP=i tippt vor dem Bild auf Station i (Lösen prüfen),
//   WIPE=i streicht vor dem Bild sechsmal quer über Station i (PC Maus, Handy Finger über CDP), OUT=Ordner (Standard /tmp/shots).
// Hängt ?gl=1 an (Prüfmodus: WebGL trotz Software-Grafik), außer GL0=1.
const { chromium } = require('playwright');
const path = require('path'), fs = require('fs');
(async () => {
  const [,, mode = 'm', prefix = 'kf', list] = process.argv;
  const us = (list || '0,1.4,2.9,4.6,6.2,7.8').split(',').map(Number);
  const out = process.env.OUT || '/tmp/shots'; fs.mkdirSync(out, { recursive: true });
  const b = await chromium.launch({ args: process.env.NOGL ? ['--disable-webgl', '--disable-3d-apis'] : ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const vp = mode === 'm' ? { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true }
    : mode === 'xl' ? { viewport: { width: 2560, height: 1440 } } : { viewport: { width: 1440, height: 900 } };
  const ctx = await b.newContext({ ...vp, ...(process.env.REDUCED ? { reducedMotion: 'reduce' } : {}) });
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', (e) => errs.push('pageerror ' + e.message));
  p.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errs.push(m.type() + ' ' + m.text()); });
  await p.goto('file://' + path.resolve(__dirname, '../kopf-bis-fuss.html') + (process.env.GL0 ? '' : '?gl=1'));
  await p.waitForTimeout(3500);
  let n = 0;
  for (const u of us) {
    await p.evaluate((x) => window.__kf.go(x), u);
    await p.waitForTimeout(+(process.env.WAIT || 6000));
    if (process.env.TAP) {
      const i = +process.env.TAP, r = await p.evaluate((k) => window.__kf.ring(k), i);
      if (mode === 'm') await p.touchscreen.tap(r[0], r[1]); else await p.mouse.click(r[0], r[1]);
      await p.waitForTimeout(3000);
    }
    if (process.env.WIPE) {
      const i = +process.env.WIPE, r = await p.evaluate((k) => window.__kf.ring(k), i);
      const cdp = mode === 'm' ? await ctx.newCDPSession(p) : null;
      for (let k = 0; k < 6; k++) {
        const y = r[1] + (k - 2.5) * r[2] * 0.28, x0 = r[0] - r[2] * 0.85, x1 = r[0] + r[2] * 0.85;
        if (cdp) {
          await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: x0, y }] });
          for (let s = 1; s <= 12; s++) await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x0 + (x1 - x0) * s / 12, y }] });
          await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
        } else { await p.mouse.move(x0, y); await p.mouse.move(x1, y, { steps: 12 }); }
        await p.waitForTimeout(150);
      }
      await p.waitForTimeout(2500);
    }
    const f = `${out}/${prefix}-${n++}.png`;
    await p.screenshot({ path: f, timeout: 90000 });
    console.log(f, JSON.stringify(await p.evaluate(() => window.__kf.state())));
  }
  const ov = await p.evaluate(() => document.documentElement.scrollWidth > innerWidth);
  console.log('Querscrollen:', ov ? 'JA' : 'nein');
  console.log(errs.length ? errs.join('\n') : 'keine Meldungen');
  await b.close();
})();
