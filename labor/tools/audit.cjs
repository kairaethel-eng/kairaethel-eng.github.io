// Prüfskript (3.11.2026): Screenshots je Kapitel, axe-core (WCAG 2.2 AA), Struktur, Tab-Reihenfolge in mehreren Ansichten.
// Aufruf: cd labor && npm i -D --no-save axe-core && node tools/audit.cjs live/index.html <ausgabeordner> [d,m,t,xl,s,dr]
// d=1440×900 · dr=dito mit „Bewegung reduzieren“ · m=390×844 · s=320×568 · t=768×1024 · xl=2560×1440. Ergebnis: report.json + PNGs. WAIT=ms je Bild (Standard 6000).
const { chromium } = require('playwright');
const path = require('path'), fs = require('fs');
const FILE = path.resolve(process.argv[2]); const OUT = process.argv[3]; fs.mkdirSync(OUT, { recursive: true });
const WANT = (process.argv[4] || 'd,m,t,xl,s,dr').split(',');
let AXE; try { AXE = fs.readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8'); } catch (e) { console.error('axe-core fehlt: cd labor && npm i -D --no-save axe-core'); process.exit(1); }
const WAIT = +(process.env.WAIT || 6000);
const MODES = {
  d:  { viewport: { width: 1440, height: 900 } },
  dr: { viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' },
  m:  { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
  s:  { viewport: { width: 320, height: 568 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
  t:  { viewport: { width: 768, height: 1024 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
  xl: { viewport: { width: 2560, height: 1440 } },
};
const STEPS = {
  d:  ['top|0','#bewegung|0','#achse|0.61','#achse|1.85','#achse|3.1','#dach|0','#manuthera|0','#allTitle|0','#hausordnung|0.5','#tuer|0'],
  dr: ['top|0','#achse|1.85','#dach|0'],
  m:  ['top|0','#bewegung|0','#achse|0.3','#achse|1.5','#achse|3','#dach|0','#manuthera|0','#allTitle|0','#hausordnung|0.5','#tuer|0'],
  s:  ['top|0','#dach|0','#allTitle|0','#tuer|0'],
  t:  ['top|0','#achse|1.2','#dach|0','#manuthera|0','#allTitle|0','#tuer|0'],
  xl: ['top|0','#achse|1.85','#dach|0','#tuer|0'],
};
const report = {};
(async () => {
  const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  for (const mode of WANT) {
    const t0 = Date.now();
    const ctx = await b.newContext(MODES[mode]);
    const p = await ctx.newPage();
    const logs = [];
    p.on('pageerror', e => logs.push('PAGEERR ' + e.message));
    p.on('console', m => { if (['error', 'warning'].includes(m.type())) logs.push(m.type().toUpperCase() + ' ' + m.text().slice(0, 300)); });
    await p.goto('file://' + FILE);
    await p.waitForTimeout(WAIT);
    const r = { mode, logs };
    // structure
    r.structure = await p.evaluate(() => {
      const q = s => [...document.querySelectorAll(s)];
      const vis = el => { const cs = getComputedStyle(el); const rc = el.getBoundingClientRect(); return cs.display !== 'none' && cs.visibility !== 'hidden' && (rc.width || rc.height); };
      const headings = q('h1,h2,h3,h4').map(h => `${h.tagName} ${vis(h) ? '' : '[hidden]'} ${(h.getAttribute('aria-label') || h.textContent).trim().replace(/\s+/g, ' ').slice(0, 70)}`);
      const landmarks = q('main,nav,header,footer,aside,section[aria-labelledby],section[aria-label]').map(e => `${e.tagName.toLowerCase()}#${e.id}`);
      const ids = new Set(q('[id]').map(e => e.id));
      const deadAnchors = q('a[href^="#"]').map(a => a.getAttribute('href')).filter(h => h.length > 1 && !ids.has(h.slice(1)));
      const imgsNoAlt = q('img:not([alt])').length;
      const canvases = q('canvas').map(c => `${c.id} ${c.width}x${c.height} ${c.getAttribute('role') || ''} ${c.getAttribute('aria-hidden') || ''}`);
      const nodes = document.getElementsByTagName('*').length;
      const nav = performance.getEntriesByType('navigation')[0];
      const timing = nav ? { dcl: Math.round(nav.domContentLoadedEventEnd), load: Math.round(nav.loadEventEnd) } : null;
      const mem = performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1048576) + ' MB' : null;
      const docW = document.documentElement.scrollWidth, winW = innerWidth, docH = document.documentElement.scrollHeight;
      const lang = document.documentElement.lang; const title = document.title;
      const meta = n => (document.querySelector(`meta[name="${n}"],meta[property="${n}"]`) || {}).content;
      const smallTap = q('a,button').filter(vis).map(e => { const r = e.getBoundingClientRect(); return { t: (e.getAttribute('aria-label') || e.textContent).trim().replace(/\s+/g, ' ').slice(0, 30), w: Math.round(r.width), h: Math.round(r.height) }; }).filter(x => x.w < 24 || x.h < 24);
      const longLines = q('p,li,dd').filter(vis).map(e => ({ t: e.textContent.trim().slice(0, 40), ch: Math.round(e.getBoundingClientRect().width / (parseFloat(getComputedStyle(e).fontSize) * 0.5)) })).filter(x => x.ch > 85).slice(0, 8);
      const fonts = [...document.fonts].map(f => `${f.family} ${f.weight} ${f.style} ${f.status}`).slice(0, 12);
      return { title, lang, desc: meta('description'), robots: meta('robots'), ogImage: meta('og:image'), themeColor: meta('theme-color'), viewport: meta('viewport'), headings, landmarks, deadAnchors, imgsNoAlt, canvases, nodes, timing, mem, docW, winW, docH, hScroll: docW > winW, smallTap, longLines, fonts };
    });
    // keyboard: tab order first 28 stops
    const tabs = [];
    for (let i = 0; i < 28; i++) {
      await p.keyboard.press('Tab');
      const d = await p.evaluate(() => { const e = document.activeElement; if (!e || e === document.body) return 'BODY'; const cs = getComputedStyle(e); const r = e.getBoundingClientRect(); const ov = cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0; return `${e.tagName.toLowerCase()}${e.id ? '#' + e.id : ''} "${(e.getAttribute('aria-label') || e.textContent).trim().replace(/\s+/g, ' ').slice(0, 28)}" ${Math.round(r.top)}px ${ov ? 'outline' : 'NO-OUTLINE'} ${r.width && r.height ? '' : 'ZERO-SIZE'}`; });
      tabs.push(d);
    }
    r.tabs = tabs;
    await p.evaluate(() => scrollTo(0, 0));
    // axe at top
    await p.addScriptTag({ content: AXE });
    const axeTop = await p.evaluate(async () => { const res = await axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa', 'best-practice'] } }); return res.violations.map(v => ({ id: v.id, impact: v.impact, help: v.help, n: v.nodes.length, nodes: v.nodes.slice(0, 4).map(n => ({ t: n.target.join(' ').slice(0, 90), s: (n.failureSummary || '').slice(0, 200) })) })); });
    r.axeTop = axeTop;
    // screenshots
    const steps = STEPS[mode] || [];
    let n = 0; r.shots = [];
    for (const st of steps) {
      const [sel, off] = st.split('|');
      const ok = await p.evaluate(([s, o]) => { const el = s === 'top' ? null : document.querySelector(s); if (s !== 'top' && !el) return false; const y = el ? el.getBoundingClientRect().top + scrollY : 0; scrollTo(0, y + parseFloat(o || 0) * innerHeight); return true; }, [sel, off]);
      await p.waitForTimeout(WAIT);
      const f = path.join(OUT, `${mode}-${n++}-${sel.replace('#', '')}-${off}.png`);
      await p.screenshot({ path: f, timeout: 120000 });
      r.shots.push(f + (ok ? '' : ' (selector missing)'));
    }
    // axe at bottom (contact + list expanded)
    await p.evaluate(() => { const bt = document.querySelector('#index button'); if (bt) bt.click(); });
    await p.waitForTimeout(800);
    const axeBottom = await p.evaluate(async () => { const res = await axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'] } }); return res.violations.map(v => ({ id: v.id, impact: v.impact, help: v.help, n: v.nodes.length, nodes: v.nodes.slice(0, 4).map(n => ({ t: n.target.join(' ').slice(0, 90), s: (n.failureSummary || '').slice(0, 200) })) })); });
    r.axeBottom = axeBottom;
    r.expanded = await p.evaluate(() => { const bt = document.querySelector('#index button'); return bt && bt.getAttribute('aria-expanded'); });
    r.seconds = Math.round((Date.now() - t0) / 1000);
    report[mode] = r;
    fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(report, null, 1));
    console.log('done', mode, r.seconds + 's', 'logs:', logs.length, 'axeTop:', axeTop.length, 'axeBottom:', axeBottom.length);
    await ctx.close();
  }
  await b.close();
})().catch(e => { console.error('FATAL', e); process.exit(1); });
