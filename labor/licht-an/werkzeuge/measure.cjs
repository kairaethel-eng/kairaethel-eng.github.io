// Einheitliche Messung einer Seite (Handy-Emulation, CPU 4×, gedrosseltes Netz) – für HOP und Referenzseiten gleich.
// Aufruf: node measure.cjs <url> <name>   → schreibt out/<name>.json (+ out/<name>.png erstes Bild)
// Gemessen: Übertragungsgröße, Anfragen, fremde Hosts, FCP/LCP/CLS, lange Aufgaben (TBT-Näherung), DOM-Größe,
// WebGL/WebGPU ja/nein, axe-Verstöße (WCAG 2.2 AA), Termin-/Telefon-Weg im ersten Bild, Text im DOM.
// Achtung: Container ohne Grafikchip (WebGL = SwiftShader) → 3D-Seiten rechnen hier langsamer als auf echten Geräten.
const { chromium, devices } = require('playwright');
const fs = require('fs'), path = require('path');
const [,, url, name] = process.argv;
const OUT = path.join(__dirname, 'out'); fs.mkdirSync(OUT, { recursive: true });
const AXE = fs.readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');
(async () => {
  const proxy = process.env.HTTPS_PROXY && !/^https?:\/\/(127\.0\.0\.1|localhost)/.test(url) ? { server: process.env.HTTPS_PROXY } : undefined;
  const browser = await chromium.launch({ proxy, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-unsafe-webgpu'] });
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, userAgent: devices['iPhone 13'].userAgent, locale: 'de-DE' });
  await ctx.addInitScript(() => {
    window.__m = { gl: [], lt: [], lcp: 0, lcpEl: '', cls: 0, fcp: 0 };
    const g = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (t, ...a) { const r = g.call(this, t, ...a); if (r && /webgl|webgpu/.test(t)) window.__m.gl.push(t); return r; };
    try { new PerformanceObserver((l) => l.getEntries().forEach((e) => window.__m.lt.push([Math.round(e.startTime), Math.round(e.duration)]))).observe({ type: 'longtask', buffered: true }); } catch (e) {}
    try { new PerformanceObserver((l) => { const e = l.getEntries().pop(); window.__m.lcp = Math.round(e.startTime); window.__m.lcpEl = (e.element && (e.element.tagName + (e.element.id ? '#' + e.element.id : ''))) || ''; }).observe({ type: 'largest-contentful-paint', buffered: true }); } catch (e) {}
    try { new PerformanceObserver((l) => l.getEntries().forEach((e) => { if (!e.hadRecentInput) window.__m.cls += e.value; })).observe({ type: 'layout-shift', buffered: true }); } catch (e) {}
    try { new PerformanceObserver((l) => l.getEntries().forEach((e) => { if (e.name === 'first-contentful-paint') window.__m.fcp = Math.round(e.startTime); })).observe({ type: 'paint', buffered: true }); } catch (e) {}
  });
  const page = await ctx.newPage();
  const cdp = await ctx.newCDPSession(page);
  await cdp.send('Network.enable');
  // Netz wie Lighthouse „Slow 4G“-Profil (beobachtet): 1,6 Mbit/s runter, 750 kbit/s rauf, 150 ms
  await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 150, downloadThroughput: 1.6 * 1024 * 1024 / 8, uploadThroughput: 750 * 1024 / 8 });
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  let bytes = 0, reqs = 0; const hosts = new Set(); const types = {};
  const main = new URL(url).hostname.replace(/^www\./, '');
  const rid = {};
  cdp.on('Network.responseReceived', (e) => { rid[e.requestId] = { type: e.type, url: e.response.url }; });
  cdp.on('Network.loadingFinished', (e) => { const r = rid[e.requestId]; if (!r || /^data:|^blob:/.test(r.url)) return; reqs++; bytes += e.encodedDataLength; types[r.type] = (types[r.type] || 0) + e.encodedDataLength; try { const h = new URL(r.url).hostname.replace(/^www\./, ''); if (!h.endsWith(main)) hosts.add(h); } catch (x) {} });
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e.message).slice(0, 200)));
  const t0 = Date.now();
  let status = 0, loadMs = 0, navErr = '';
  try { const resp = await page.goto(url, { waitUntil: 'load', timeout: 90000 }); status = resp ? resp.status() : 0; loadMs = Date.now() - t0; } catch (e) { navErr = String(e.message).slice(0, 200); }
  await page.waitForTimeout(8000); // Nachladen/Animationen abwarten (insgesamt ≥ 8 s nach load)
  await page.screenshot({ path: path.join(OUT, name + '.png'), timeout: 120000 }).catch((e) => errors.push('shot: ' + String(e.message).slice(0, 80)));
  const info = await page.evaluate(() => {
    const vis = (el) => { const r = el.getBoundingClientRect(); const s = getComputedStyle(el); return r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth && s.visibility !== 'hidden' && s.display !== 'none' && +s.opacity > 0.05; };
    const act = [...document.querySelectorAll('a,button')];
    const txt = (el) => (el.innerText || el.getAttribute('aria-label') || '').trim();
    const booking = act.filter((el) => /termin|buchen|book|appointment|schedule|rendez|get started|anfragen/i.test(txt(el)));
    const tel = act.filter((el) => /^tel:/.test(el.getAttribute('href') || ''));
    const words = (document.body.innerText || '').split(/\s+/).filter(Boolean).length;
    return {
      title: document.title, lang: document.documentElement.lang || '',
      dom: document.querySelectorAll('*').length, words,
      h1: [...document.querySelectorAll('h1')].map((h) => h.innerText.trim().slice(0, 80)),
      canvases: document.querySelectorAll('canvas').length, videos: document.querySelectorAll('video').length, iframes: document.querySelectorAll('iframe').length,
      imgs: document.querySelectorAll('img,picture').length,
      bookingAny: booking.length, bookingFirstView: booking.filter(vis).length, telAny: tel.length, telFirstView: tel.filter(vis).length,
      jsonld: [...document.querySelectorAll('script[type="application/ld+json"]')].map((s) => { try { const j = JSON.parse(s.textContent); return [].concat(j).map((x) => x['@type']).flat().join(','); } catch (e) { return '?'; } }),
      metaDesc: (document.querySelector('meta[name=description]') || {}).content || '',
      scrollH: Math.round(document.documentElement.scrollHeight / innerHeight * 10) / 10,
      m: window.__m,
    };
  }).catch((e) => ({ evalErr: String(e.message).slice(0, 200) }));
  // axe (WCAG 2.2 AA) im Ausgangszustand
  let axe = null;
  try { await page.evaluate(AXE); axe = await page.evaluate(async () => { const r = await window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'] } }); return r.violations.map((v) => ({ id: v.id, impact: v.impact, n: v.nodes.length })); }); } catch (e) { axe = { err: String(e.message).slice(0, 200) }; }
  const m = (info && info.m) || {};
  const lt = (m.lt || []);
  const tbt = lt.reduce((a, [, d]) => a + Math.max(0, d - 50), 0);
  const res = {
    name, url, status, navErr, when: new Date().toISOString(),
    loadMs, fcp: m.fcp, lcp: m.lcp, lcpEl: m.lcpEl, cls: Math.round((m.cls || 0) * 1000) / 1000,
    longTasks: lt.length, longest: lt.reduce((a, [, d]) => Math.max(a, d), 0), tbtApprox: tbt,
    transferKB: Math.round(bytes / 1024), requests: reqs, thirdPartyHosts: [...hosts].sort(), byTypeKB: Object.fromEntries(Object.entries(types).map(([k, v]) => [k, Math.round(v / 1024)])),
    gpu: [...new Set(m.gl || [])],
    ...Object.fromEntries(Object.entries(info || {}).filter(([k]) => k !== 'm')),
    axe, axeViolations: Array.isArray(axe) ? axe.length : null, axeNodes: Array.isArray(axe) ? axe.reduce((a, v) => a + v.n, 0) : null,
    errors: errors.slice(0, 5),
  };
  fs.writeFileSync(path.join(OUT, name + '.json'), JSON.stringify(res, null, 1));
  console.log(JSON.stringify({ name, status, loadMs, fcp: res.fcp, lcp: res.lcp, cls: res.cls, tbt, kb: res.transferKB, req: reqs, third: hosts.size, gpu: res.gpu, axe: res.axeViolations, book1: res.bookingFirstView, tel1: res.telFirstView, words: res.words, err: navErr || undefined }));
  await browser.close();
})().catch((e) => { console.log(JSON.stringify({ name, fatal: String(e.message).slice(0, 300) })); process.exit(1); });
