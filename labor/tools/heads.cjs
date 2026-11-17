// Überschriften vermessen: Größe, Zeilen, Umbruch je Ansicht (18.11.2026). Braucht einen Server auf 8765 (siehe gaps.cjs).
const { chromium } = require('playwright');
const MODES = { d: [1440, 900], xl: [2560, 1440], l: [1366, 700], t: [1024, 768], m: [390, 844], s: [320, 568] };
(async () => {
  const want = (process.argv[2] || 'd,xl,l,t,m,s').split(',');
  const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  for (const mode of want) {
    const [w, h] = MODES[mode];
    const ctx = await b.newContext({ viewport: { width: w, height: h }, ...(w < 921 ? { isMobile: true, hasTouch: true, deviceScaleFactor: 2 } : {}) });
    const p = await ctx.newPage();
    await p.goto((process.env.URL || 'http://127.0.0.1:8765/test-4-puls-scan.html') + '?gl=1');
    await p.waitForTimeout(3500);
    const rows = await p.evaluate(() => {
      const out = [];
      document.querySelectorAll('main h1, main h2, .laws li span, .kf-st h2, .kf-end h2').forEach((e) => {
        if (e.classList.contains('sr-only')) return;
        const cs = getComputedStyle(e), fs = parseFloat(cs.fontSize);
        // Zeilen über Range-Rechtecke (zählt echte Umbrüche)
        const rg = document.createRange(); rg.selectNodeContents(e);
        const tops = [...new Set([...rg.getClientRects()].filter((r) => r.width > 1).map((r) => Math.round(r.top / (fs * 0.5))))];
        const lines = [];
        // Text je Zeile
        const walker = document.createTreeWalker(e, NodeFilter.SHOW_TEXT); let n, cur = null, txt = '';
        while ((n = walker.nextNode())) for (let i = 0; i < n.length; i++) { const r2 = document.createRange(); r2.setStart(n, i); r2.setEnd(n, i + 1); const q = r2.getClientRects()[0]; if (!q) continue; const t = Math.round(q.top / (fs * 0.5)); if (cur !== null && Math.abs(t - cur) > 1) { lines.push(txt.trim()); txt = ''; } cur = t; txt += n.data[i]; }
        if (txt.trim()) lines.push(txt.trim());
        const par = e.parentElement.getBoundingClientRect();
        out.push({ id: e.id || e.className.split(' ')[0] || e.tagName, fs: Math.round(fs), fw: cs.fontWeight, lh: (parseFloat(cs.lineHeight) / fs).toFixed(2), w: Math.round(e.getBoundingClientRect().width), pw: Math.round(par.width), lines });
      });
      return out;
    });
    console.log(`== ${mode} ${w}×${h}`);
    rows.forEach((r) => console.log(`${String(r.id).slice(0, 12).padEnd(12)} ${String(r.fs).padStart(3)}px w${r.fw} lh${r.lh} Breite ${r.w}/${r.pw}  ${r.lines.length} Z: ${r.lines.join(' | ')}`));
    await ctx.close();
  }
  await b.close();
})();
