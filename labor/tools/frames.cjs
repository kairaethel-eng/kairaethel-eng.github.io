// Bildraten-Messung Handy (Container, Playwright + DevTools-Protokoll) – Diagnose Hero-Rauschen 7./8.11.2026.
// Zählt echte Zeichen-Bilder (WebGL-draw je rAF), nicht nur rAF; dazu Bildabstände, Long Tasks,
// ResizeObserver-Aufrufe am body und Shader-Linken (linkProgram) – je Phase „Stand“ (8 s Hero) und „Scroll“ (6000 px in 8 s).
// Aufruf (aus labor/, Seite über lokalen Server, z. B. `python3 -m http.server 8765` in einem Ordner mit dem Build):
//   node tools/frames.cjs http://127.0.0.1:8765/live/index.html <bezeichnung> [cpu-drossel=4]
// Vergleich zweier Stände: beide Builds in getrennte Ordner kopieren, je ≥ 3 Läufe abwechselnd.
// ⚠ Im Container gibt es keinen Grafikchip (WebGL = SwiftShader) → nur Vergleiche sind aussagekräftig, keine absoluten Bildraten.
// node measure.cjs <url> <label> [cpu]
const { chromium, devices } = require('playwright');
const [,, url, label, cpu = '4'] = process.argv;
(async () => {
  const browser = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, userAgent: devices['iPhone 13'].userAgent });
  await ctx.addInitScript(() => {
    window.__draw = 0; window.__fr = []; // je rAF: [t, Zeichnungen in diesem Bild]
    for (const C of [WebGL2RenderingContext, WebGLRenderingContext]) {
      for (const m of ['drawArrays', 'drawElements', 'drawArraysInstanced', 'drawElementsInstanced']) {
        const o = C.prototype[m]; if (!o) continue;
        C.prototype[m] = function (...a) { if (this.canvas && this.canvas.id !== '__x') window.__draw++; return o.apply(this, a); };
      }
    }
    window.__ro = []; const RO = window.ResizeObserver; window.ResizeObserver = class extends RO { constructor(cb) { super((e, o) => { if (e.some((x) => x.target === document.body)) window.__ro.push(performance.now()); cb(e, o); }); } };
    window.__lk = []; for (const C of [WebGL2RenderingContext]) { for (const m of ['linkProgram', 'getProgramParameter', 'compileShader']) { const o = C.prototype[m]; C.prototype[m] = function (...a) { const t = performance.now(); const r = o.apply(this, a); window.__lk.push([t, m, performance.now() - t]); return r; }; } }
    let last = 0;
    const loop = (t) => { window.__fr.push([t, window.__draw - last]); last = window.__draw; requestAnimationFrame(loop); };
    requestAnimationFrame(loop);
    window.__lt = []; try { new PerformanceObserver((l) => l.getEntries().forEach((e) => window.__lt.push([e.startTime, e.duration]))).observe({ type: 'longtask', buffered: true }); } catch (e) {}
  });
  const page = await ctx.newPage();
  const cdp = await ctx.newCDPSession(page);
  await page.goto(url, { waitUntil: 'load' });
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: +cpu });
  await page.waitForTimeout(6000);
  const stat = (fr, lt, t0, t1) => {
    const f = fr.filter((x) => x[0] >= t0 && x[0] < t1);
    const drawn = f.filter((x) => x[1] > 0).map((x) => x[0]);
    const gaps = drawn.slice(1).map((t, i) => t - drawn[i]).sort((a, b) => a - b);
    const q = (p) => gaps.length ? gaps[Math.min(gaps.length - 1, Math.floor(p * gaps.length))].toFixed(0) : '-';
    const raf = f.slice(1).map((x, i) => x[0] - f[i][0]).sort((a, b) => a - b);
    const mean = gaps.reduce((a, b) => a + b, 0) / (gaps.length || 1);
    const sd = Math.sqrt(gaps.reduce((a, b) => a + (b - mean) ** 2, 0) / (gaps.length || 1));
    const L = lt.filter((x) => x[0] >= t0 && x[0] < t1);
    return { rafHz: +(1000 * f.length / (t1 - t0)).toFixed(1), drawHz: +(1000 * drawn.length / (t1 - t0)).toFixed(1), gapMed: q(0.5), gapP95: q(0.95), gapMax: gaps.length ? gaps[gaps.length - 1].toFixed(0) : '-', gapSd: sd.toFixed(1), rafMax: raf.length ? raf[raf.length - 1].toFixed(0) : '-', longTasks: L.length, ltMax: L.length ? Math.max(...L.map((x) => x[1])).toFixed(0) : 0 };
  };
  // Stand: 8 s Hero ohne Eingabe
  const a0 = await page.evaluate(() => performance.now());
  await page.waitForTimeout(8000);
  const a1 = await page.evaluate(() => performance.now());
  // Scrollen: 8 s gleichmäßig nach unten (Programm-Scroll je rAF → scroll-Ereignisse wie am Handy)
  await page.evaluate(() => new Promise((res) => { const y0 = scrollY, t0 = performance.now(); const H = Math.min(6000, document.documentElement.scrollHeight - innerHeight); const f = (t) => { const k = Math.min(1, (t - t0) / 8000); scrollTo(0, y0 + H * k); k < 1 ? requestAnimationFrame(f) : res(); }; requestAnimationFrame(f); }));
  const a2 = await page.evaluate(() => performance.now());
  const { fr, lt, ro, lk } = await page.evaluate(() => ({ fr: window.__fr, lt: window.__lt, ro: window.__ro, lk: window.__lk }));
  const lkS = (t0,t1)=>{const L=lk.filter(x=>x[0]>=t0&&x[0]<t1);return {n:L.filter(x=>x[1]==='linkProgram').length, ms:+L.reduce((a,x)=>a+x[2],0).toFixed(0), max:+Math.max(0,...L.map(x=>x[2])).toFixed(0)}};
  console.log(JSON.stringify({ label, cpu, stand: stat(fr, lt, a0, a1), scroll: stat(fr, lt, a1, a2), roBody: [ro.filter(t=>t>=a0&&t<a1).length, ro.filter(t=>t>=a1&&t<a2).length], gl: [lkS(a0,a1), lkS(a1,a2)] }));
  await browser.close();
})();
