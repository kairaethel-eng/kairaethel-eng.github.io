// Größen- und Rückfall-Prüfung (13.11.2026, Gesamtprüfung G1–G5/T2/T4): misst die Fälle, die review.cjs/audit.cjs nicht abdecken –
// niedrige Laptop-Fenster, Fensterbreiten 921–1300 px, Handy quer, Manuthera am Handy, ohne JavaScript, Software-Grafik, Kapitel-Links.
// Aufruf: cd labor && node tools/sizes.cjs live/index.html      → je Zeile „ok“ oder „FEHLER“, Rückgabewert 1 bei Fehlern (~2–3 min).
const { chromium } = require('playwright'); const path = require('path');
const F = 'file://' + path.resolve(process.argv[2] || 'live/index.html');
const GL = ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'];
let fails = 0; const say = (ok, name, info = '') => { if (!ok) fails++; console.log((ok ? 'ok     ' : 'FEHLER ') + name + (info ? '  · ' + info : '')); };
const to = (p, sel, k = 0) => p.evaluate(([q, o]) => { const y = document.querySelector(q).getBoundingClientRect().top + scrollY; scrollTo(0, y + o * innerHeight); }, [sel, k]);
const cut = () => { const vh = innerHeight, out = [];
  for (const e of document.querySelectorAll('.btn,.t-play,.t-btn,.t-ego,.segnav button,#achse .note,.seg-card.is-on,.chips li')) {
    if (!e.checkVisibility({ opacityProperty: true, visibilityProperty: true })) continue; const r = e.getBoundingClientRect();
    if (r.height && r.top < vh && r.bottom > vh + 2) out.push((e.textContent || '').trim().slice(0, 20) + ' +' + Math.round(r.bottom - vh)); }
  return out; };
const seen = (sel) => { const a = [...document.querySelectorAll(sel)]; return a.filter((e) => { const c = getComputedStyle(e); return c.display !== 'none' && c.visibility !== 'hidden' && +c.opacity > 0.1 && e.getBoundingClientRect().height > 4; }).length + '/' + a.length; };
(async () => {
  const b = await chromium.launch({ args: GL }); const errs = [];
  const open = async (ctx, q = '?gl=1') => { const p = await (await b.newContext(ctx)).newPage(); p.on('pageerror', (e) => errs.push(e.message)); await p.goto(F + q); await p.waitForTimeout(3500); return p; };
  for (const [w, h] of [[1366, 650], [1280, 600]]) { // G1 + Kap. 03 bei niedriger Höhe
    const p = await open({ viewport: { width: w, height: h } });
    await to(p, '#achse', 0.3); await p.waitForTimeout(3000); await p.evaluate(() => document.querySelectorAll('.scan-stop')[4].click()); await p.waitForTimeout(4000);
    const a = await p.evaluate(cut), gap = await p.evaluate(() => Math.round(document.querySelector('.seg-card.is-on').getBoundingClientRect().top - document.querySelector('.segnav').getBoundingClientRect().bottom));
    say(!a.length && gap >= 0, `${w}×${h} Kap. 03: nichts abgeschnitten, Karte unter den Abschnittsknöpfen`, a.join(' | ') + ' Abstand ' + gap + ' px');
    // Kap. 04 seit 14.11. Linienhaus: Überschrift oben im Bild → Haus ganz im Bild, „Rundgang starten“ + „Augenhöhe“ erreichbar
    await p.evaluate(() => { const r = document.querySelector('#lhRoot').getBoundingClientRect(); scrollTo(0, r.top + scrollY - 80); }); await p.waitForTimeout(2500);
    const d = await p.evaluate(() => { const vh = innerHeight, b = (q) => Math.round(vh - document.querySelector(q).getBoundingClientRect().bottom); return { house: b('#house'), play: b('#play'), ego: b('#egoOpen') }; });
    say(d.house >= 0 && d.play >= 8 && d.ego >= 8, `${w}×${h} Kap. 04: Haus, „Rundgang starten“ und „Augenhöhe“ im Bild`, JSON.stringify(d));
    await p.evaluate(() => document.querySelector('#next').click()); await p.waitForTimeout(1500);
    const r = await p.evaluate(cut); say(!r.length, `${w}×${h} Kap. 04 Raum gewechselt: keine Knöpfe abgeschnitten`, r.join(' | '));
    await p.close();
  }
  { const p = await open({ viewport: { width: 1024, height: 768 } }); const bad = []; // G2
    for (let w = 921; w <= 1300; w += 13) { await p.setViewportSize({ width: w, height: 768 }); await p.waitForTimeout(120);
      const o = await p.evaluate(() => Math.round(document.querySelector('nav.top [data-termin]').getBoundingClientRect().right - innerWidth)); if (o > -8) bad.push(w + ':' + o); }
    say(!bad.length, 'Kopfleiste 921–1300 px: Termin-Knopf ganz im Bild', bad.join(' '));
    await p.setViewportSize({ width: 1440, height: 900 }); await p.waitForTimeout(300); // T4: Kapitel-Link setzt Fokus und Adresse
    await p.evaluate(() => document.querySelector('#chapters a[href="#achse"]').click()); await p.waitForTimeout(600);
    const st = await p.evaluate(() => location.hash + ' ' + (document.activeElement && document.activeElement.id)); say(st === '#achse achse', 'Kapitel-Link: Adresse und Fokus gehen mit', st);
    await p.close(); }
  { const p = await open({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }); // G5
    const v = await p.evaluate(() => { const c = document.querySelector('#glManu').getBoundingClientRect(), r = document.querySelector('#manuRead').getBoundingClientRect(), nav = document.querySelector('nav.top').getBoundingClientRect().bottom;
      const sy = r.bottom - innerHeight + 12; return Math.round(100 * Math.max(0, (c.bottom - sy) - Math.max(c.top - sy, nav)) / c.height); });
    say(v >= 70, 'Handy Manuthera: Liege sichtbar, wenn Knöpfe + Erklärzeile im Bild sind', v + ' % der Bühne');
    say(await p.evaluate(() => getComputedStyle(document.querySelector('#turnNote')).display) === 'none', 'Handy hochkant: kein Dreh-Hinweis'); await p.close(); }
  { const p = await open({ viewport: { width: 844, height: 390 }, isMobile: true, hasTouch: true }); // G4
    say(await p.evaluate(() => getComputedStyle(document.querySelector('#turnNote')).display) === 'flex', 'Handy quer: Hinweis „hochkant halten“ sichtbar');
    await p.evaluate(() => document.querySelector('#turnClose').click()); say(await p.evaluate(() => getComputedStyle(document.querySelector('#turnNote')).display) === 'none', 'Handy quer: Hinweis lässt sich schließen'); await p.close(); }
  { const p = await open({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, javaScriptEnabled: false }); // G3
    const r = await p.evaluate(`(${seen})('.seg-card') + ' ' + (${seen})('#lhRoot .card') + ' ' + (${seen})('.ix-body') + ' ' + (${seen})('.laws li')`);
    say(r === '6/6 5/5 12/12 5/5', 'Ohne JavaScript: Karten, Räume, Leistungstexte, Paragraphen sichtbar', r); await p.close(); }
  { const p = await open({ viewport: { width: 1280, height: 720 } }, ''); // T2: Besucher ohne Grafikchip
    const c = await p.evaluate(() => document.documentElement.className + ' | ' + getComputedStyle(document.querySelector('.still-hero')).backgroundImage.slice(0, 5));
    say(/no-gl/.test(c) && /url/.test(c), 'Software-Grafik (ohne ?gl=1): Standbilder statt WebGL', c); await p.close(); }
  { const p = await open({ viewport: { width: 794, height: 1123 } }); await p.emulateMedia({ media: 'print' }); await p.waitForTimeout(400); // T4 Druck
    const r = await p.evaluate(`(${seen})('.seg-card') + ' ' + (${seen})('#lhRoot .card') + ' ' + (${seen})('.ix-body') + ' ' + (${seen})('.laws li')`);
    const hh = await p.evaluate(() => Math.round(document.querySelector('.seg-cards').getBoundingClientRect().height) + '/' + Math.round(document.querySelector('.axis-head').getBoundingClientRect().height));
    say(r === '6/6 5/5 12/12 5/5' && parseInt(hh) > 400, 'Druckansicht: alle Inhalte sichtbar (Karten nicht weggeschnitten)', r + ' · Höhe Karten/Kopf ' + hh); await p.close(); }
  say(!errs.length, 'Keine Skriptfehler', errs.slice(0, 3).join(' | '));
  await b.close(); console.log(fails ? `\n${fails} FEHLER` : '\nalles ok'); process.exit(fails ? 1 : 0);
})();
