// Abstände zwischen den Kapiteln/Blöcken messen + Bild je Übergang (Grenze in Bildmitte). Seit 18.11.2026 (Auftrag Kai: Abstände genau ansehen).
// Braucht einen Server: cd labor && python3 -m http.server 8765   · andere Seite: URL=http://127.0.0.1:8765/live/index.html
// node gaps.cjs <d|m|xl> <out> [shots=1]
const { chromium } = require('playwright');
const BLOCKS = ['#start', '#bewegung', '#dach', '.roof-list', '#manuthera', '#stosswelle', '#achse', '#hausordnung', '#ueber', '#tuer', 'footer.foot']; // Seitenfolge seit 26.11.2026
(async () => {
  const [,, mode = 'd', out = '/tmp', shots = '1'] = process.argv;
  const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const vp = mode === 'm' ? { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true } : mode === 'xl' ? { viewport: { width: 2560, height: 1440 } } : mode === 'l' ? { viewport: { width: 1366, height: 700 } } : { viewport: { width: 1440, height: 900 } };
  const ctx = await b.newContext(vp);
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', (e) => errs.push('pageerror ' + e.message));
  await p.goto((process.env.URL || 'http://127.0.0.1:8765/test-4-puls-scan.html') + '?gl=1');
  await p.waitForTimeout(4000);
  // einmal ganz durchscrollen, damit alles gebaut ist und Einblendungen ausgelöst sind
  const total = await p.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < total; y += 700) { await p.evaluate((v) => scrollTo(0, v), y); await p.waitForTimeout(120); }
  await p.evaluate(() => scrollTo(0, 0)); await p.waitForTimeout(1500);
  const data = await p.evaluate((BL) => {
    const vis = (e) => { const r = e.getBoundingClientRect(), cs = getComputedStyle(e); return r.width > 2 && r.height > 2 && cs.visibility !== 'hidden' && cs.display !== 'none' && +cs.opacity > 0.05; };
    const res = [];
    for (const sel of BL) {
      const el = document.querySelector(sel); if (!el) { res.push({ sel, missing: true }); continue; }
      const r = el.getBoundingClientRect(), top = r.top + scrollY, bot = r.bottom + scrollY;
      let first = null, last = null;
      el.querySelectorAll('p,h1,h2,h3,li,button,a,dt,dd,summary,blockquote,canvas,svg').forEach((e) => {
        if (e.closest('.kf-sticky') && !e.closest('.kf-hero')) return; // Kap. 01: Bühne klebt
        if (e.closest('[hidden]') || e.closest('.sr-only') || e.classList.contains('sr-only')) return;
        const dt = e.closest('details:not([open])'); if (dt && !e.closest('summary')) return;
        if (e.closest('.ix-panel,[aria-hidden="true"]') && e.getBoundingClientRect().height < 4) return;
        if (!vis(e)) return;
        const q = e.getBoundingClientRect(), t = q.top + scrollY, bo = q.bottom + scrollY;
        if (t < top - 5 || bo > bot + 400) return;
        if (!first || t < first.t) first = { t, tag: e.tagName + '.' + (e.className && e.className.baseVal === undefined ? e.className : ''), txt: (e.textContent || '').trim().slice(0, 30) };
        if (!last || bo > last.b) last = { b: bo, tag: e.tagName + '.' + (e.className && e.className.baseVal === undefined ? e.className : ''), txt: (e.textContent || '').trim().slice(0, 30) };
      });
      const cs = getComputedStyle(el);
      res.push({ sel, top: Math.round(top), bot: Math.round(bot), h: Math.round(r.height), pt: cs.paddingTop, pb: cs.paddingBottom, mt: cs.marginTop, first, last });
    }
    return { vh: innerHeight, nav: (document.querySelector('#top') || document.querySelector('nav')).getBoundingClientRect().height, res };
  }, BLOCKS);
  console.log(`== ${mode}  vh ${data.vh}  Leiste ${Math.round(data.nav)}`);
  data.res.forEach((r, i) => {
    if (r.missing) { console.log(r.sel, 'fehlt'); return; }
    const prev = data.res[i - 1];
    const gap = prev && prev.last && r.first ? Math.round(r.first.t - prev.last.b) : null;
    console.log(`${r.sel.padEnd(13)} Höhe ${String(r.h).padStart(5)} (${(r.h / data.vh).toFixed(2)} vh) pt ${r.pt} pb ${r.pb} | oben frei ${r.first ? Math.round(r.first.t - r.top) : '-'} · unten frei ${r.last ? Math.round(r.bot - r.last.b) : '-'}${gap !== null ? ` | Abstand zum Block davor: ${gap} px = ${(gap / data.vh).toFixed(2)} vh` : ''}`);
    console.log(`              erstes: ${r.first ? r.first.tag.slice(0, 26) + ' „' + r.first.txt + '“' : '-'}  · letztes: ${r.last ? r.last.tag.slice(0, 26) + ' „' + r.last.txt + '“' : '-'}`);
  });
  if (shots === '1') {
    for (let i = 1; i < data.res.length; i++) {
      const r = data.res[i]; if (r.missing) continue;
      await p.evaluate((y) => scrollTo(0, y), Math.max(0, r.top - data.vh * 0.5));
      await p.waitForTimeout(+(process.env.WAIT || 5000));
      await p.screenshot({ path: `${out}/gap-${mode}-${i}.png` });
    }
  }
  console.log(errs.length ? errs.join('\n') : 'keine Meldungen');
  await b.close();
})();
