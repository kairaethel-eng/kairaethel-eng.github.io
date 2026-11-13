// Baut jede Testseite zu EINER eigenständigen HTML-Datei:
// Schriften als Base64, CSS und JS inline – keine externen Abrufe (DSGVO-freundlich).
// Aufruf: npm run build   (optional: node build.mjs test-4)
import { build } from 'esbuild';
import { readFileSync, writeFileSync, mkdirSync, copyFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const root = dirname(fileURLToPath(import.meta.url));

// Livegang (Entscheidung Kai 2.11.2026: GitHub Pages + Domain hopphysio.de):
//   node build.mjs live              → Vorschau in labor/live/ (noindex, Adressen auf die Vorschau)
//   LIVE_ROOT=1 node build.mjs live  → Wurzel /index.html, /impressum.html, /datenschutz.html (indexierbar) – NUR nach Kais Go
const LIVE_ROOT = !!process.env.LIVE_ROOT;
const liveDir = LIVE_ROOT ? '..' : 'live';
const BASE = LIVE_ROOT ? 'https://hopphysio.de/' : 'https://kairaethel-eng.github.io/labor/live/';

const PAGES = {
  'test-4': { out: 'test-4-puls-scan.html' },
  'haus': { out: 'hausbesuch.html', fonts: 'haus' },
  'manu': { out: 'manuthera.html' },
  'recht-ds': { out: 'recht-datenschutz.html', dir: 'recht', page: 'datenschutz.html' },
  'recht-imp': { out: 'recht-impressum.html', dir: 'recht', page: 'impressum.html' },
  'portrait': { out: 'portrait.html' },
  'zuhause': { out: 'zuhause.html' },
  'ego': { out: 'rundgang-ego.html' },
  // Fusion Hausbesuch + Puls (Auftrag Kai 9.11.2026): Rundgang aus Augenhöhe durch die Partikel-Praxis, Inhalte von Puls · Scan
  'fusion': { out: 'hausbesuch-puls.html' },
  // Startadresse (Repo-Wurzel, seit 1.11.2026 statt V10): Übergangsseite + Rechtsseiten ohne Labor-Hinweis, Links auf die Wurzel
  'start': { out: '../index.html' },
  'start-ds': { out: '../datenschutz.html', dir: 'recht', page: 'datenschutz.html', root: true, noTermin: true }, // Übergangsseite hat kein Termin-Blatt
  'start-imp': { out: '../impressum.html', dir: 'recht', page: 'impressum.html', root: true },
  // Livegang: Puls · Scan als Startseite + Rechtsseiten, ohne Labor-Reste, mit Favicon, Link-Vorschau, Praxisdaten
  'live': { out: `${liveDir}/index.html`, dir: 'test-4', live: 'index.html' },
  'live-imp': { out: `${liveDir}/impressum.html`, dir: 'recht', page: 'impressum.html', root: true, live: 'impressum.html' },
  'live-ds': { out: `${liveDir}/datenschutz.html`, dir: 'recht', page: 'datenschutz.html', root: true, live: 'datenschutz.html' },
};
// Rechtsseiten in der Wurzel: Labor-Hinweis weg, Links zeigen auf die Startadresse statt ins Labor
const ROOT_LINKS = [[/<div class="labnote"[\s\S]*?<\/div>\r?\n?/g, ''], [/href="test-4-puls-scan\.html"/g, 'href="index.html"'], [/href="recht-impressum\.html"/g, 'href="impressum.html"'], [/href="recht-datenschutz\.html(#[^"]*)?"/g, 'href="datenschutz.html$1"'], [/>Zur Startseite</g, '>Zur Startseite<']];

// ---- Livegang: Kopf- und Textersetzungen ----------------------------------------------------
const LIVE_TITLE = {
  'index.html': 'Physiotherapie in Schorndorf · HOP – Home of Physiotherapy, Kai Raethel', // 13.11.: deutsches Suchwort „Physiotherapie“ vorn
  'impressum.html': 'Impressum · HOP – Home of Physiotherapy',
  'datenschutz.html': 'Datenschutz · HOP – Home of Physiotherapy',
};
const LIVE_DESC = {
  'index.html': 'Physiotherapie mit Kompetenz und Herz in Schorndorf: Manuelle Therapie, Krankengymnastik, CMD, Stoßwelle und die Manuthera-Liege. Kai Raethel, Schlichtener Straße 87, nahe der Klinik.',
};
// Favicon: HOP-Kreise auf dunklem Grund, als SVG direkt in der Datei (kein Abruf)
const FAVICON = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#0B0F12"/><circle cx="20" cy="22" r="11" fill="#7FAF45"/><circle cx="44" cy="22" r="11" fill="#3C7189"/><circle cx="32" cy="43" r="11" fill="#3F86B5"/></svg>');
// Strukturierte Praxisdaten (schema.org) – nur Angaben, die auch auf der Seite stehen
const PRAXIS = {
  '@context': 'https://schema.org',
  '@type': 'Physiotherapy',
  name: 'HOP – Home of Physiotherapy',
  alternateName: 'HOP Physio Schorndorf',
  url: BASE,
  image: `${BASE}og.jpg`,
  telephone: '+49 7181 9931470',
  email: 'kontakt@hopphysio.de',
  founder: { '@type': 'Person', name: 'Kai Raethel', jobTitle: 'Physiotherapeut' },
  address: { '@type': 'PostalAddress', streetAddress: 'Schlichtener Straße 87', postalCode: '73614', addressLocality: 'Schorndorf', addressCountry: 'DE' },
  openingHoursSpecification: [{ '@type': 'OpeningHoursSpecification', dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], opens: '08:30', closes: '19:30' }],
  medicalSpecialty: 'Physiotherapy',
  hasMap: 'https://www.google.com/maps/search/?api=1&query=Schlichtener%20Stra%C3%9Fe%2087%2C%2073614%20Schorndorf', // derselbe Link wie auf der Seite
};
function liveHead(head, page) {
  head = head.replace(/<meta name="claude:viewport-fit-sides"[^>]*>\r?\n?/, '');
  if (LIVE_ROOT) head = head.replace(/<meta name="robots"[^>]*>\r?\n?/, '');
  head = head.replace(/<title>[^<]*<\/title>/, `<title>${LIVE_TITLE[page]}</title>`);
  if (LIVE_DESC[page]) head = head.replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${LIVE_DESC[page]}">`);
  const url = page === 'index.html' ? BASE : `${BASE}${page}`;
  const title = LIVE_TITLE[page];
  const desc = (head.match(/<meta name="description" content="([^"]*)">/) || [, ''])[1];
  const extra = [
    `<link rel="canonical" href="${url}">`,
    `<meta name="theme-color" content="#0B0F12">`,
    `<link rel="icon" href="${FAVICON}">`,
    `<link rel="apple-touch-icon" href="${BASE}apple-touch-icon.png">`,
    `<meta property="og:type" content="website">`,
    `<meta property="og:locale" content="de_DE">`,
    `<meta property="og:site_name" content="HOP – Home of Physiotherapy">`,
    `<meta property="og:title" content="${title}">`,
    `<meta property="og:description" content="${desc}">`,
    `<meta property="og:url" content="${url}">`,
    `<meta property="og:image" content="${BASE}og.jpg">`,
    `<meta property="og:image:width" content="1200">`,
    `<meta property="og:image:height" content="630">`,
    `<meta property="og:image:alt" content="HOP – Home of Physiotherapy, Schorndorf">`,
    `<meta name="twitter:card" content="summary_large_image">`,
  ];
  if (page === 'index.html') extra.push(`<script type="application/ld+json">${JSON.stringify(PRAXIS)}</script>`);
  return head.replace(/(<meta name="description"[^>]*>)/, (m) => `${m}\n${extra.join('\n')}`);
}
function liveBody(body) {
  return body
    .replace(/[ \t]*<p class="note">Schematischer Grundriss[^<]*<\/p>\r?\n?/, '')
    .replace(/ · schematisch<\/p>/, '</p>')
    .replace(/[ \t]*<span class="lab">[^<]*<\/span>\r?\n?/, '')
    .replace(/href="recht-impressum\.html"/g, 'href="impressum.html"')
    .replace(/href="recht-datenschutz\.html(#[^"]*)?"/g, 'href="datenschutz.html$1"');
}
// -------------------------------------------------------------------------------------------

// Zusätzliche Ausgabe ohne <html>/<head>/<body>-Gerüst (für die private Claude-Vorschau)
const fragmentDir = process.env.FRAGMENT_DIR || '';

const font = (file) => readFileSync(join(root, 'assets/fonts', file)).toString('base64');
const FONTS = {};
FONTS.haus = () => `
@font-face{font-family:"Fraunces";font-style:normal;font-weight:100 900;font-display:swap;src:url(data:font/woff2;base64,${font('fraunces-soft.woff2')}) format("woff2")}
@font-face{font-family:"Fraunces";font-style:italic;font-weight:100 900;font-display:swap;src:url(data:font/woff2;base64,${font('fraunces-soft-italic.woff2')}) format("woff2")}
@font-face{font-family:"Hanken Grotesk";font-style:normal;font-weight:100 900;font-display:swap;src:url(data:font/woff2;base64,${font('hanken-grotesk.woff2')}) format("woff2")}
`;
const fontsCss = `
@font-face{font-family:"Archivo";font-style:normal;font-weight:100 900;font-display:swap;src:url(data:font/woff2;base64,${font('archivo-var.woff2')}) format("woff2")}
@font-face{font-family:"Archivo Expanded";font-style:normal;font-weight:100 900;font-display:swap;src:url(data:font/woff2;base64,${font('archivo-expanded-var.woff2')}) format("woff2")}
@font-face{font-family:"Libre Caslon Text";font-style:italic;font-weight:400;font-display:swap;src:url(data:font/woff2;base64,${font('libre-caslon-italic.woff2')}) format("woff2")}
`;

const only = process.argv[2];
for (const [name, cfg] of Object.entries(PAGES)) {
  if (only && only !== name && !(only === 'live' && name.startsWith('live-'))) continue;
  // Live-Seiten nur ausdrücklich bauen (npm run build baut nur das Labor)
  if (!only && cfg.live) continue;
  const dir = join(root, 'src', cfg.dir || name);
  const res = await build({
    entryPoints: [join(dir, 'main.js')],
    bundle: true, minify: true, format: 'iife', target: 'es2020',
    write: false, legalComments: 'none',
  });
  const js = res.outputFiles[0].text.replace(/<\/script/gi, '<\\/script');
  let css = readFileSync(join(dir, 'style.css'), 'utf8');
  if (cfg.live) css = css.replace(/\/\*[\s\S]*?\*\//g, ''); // Live: Arbeitskommentare („Testseite 4 …“) raus
  if (cfg.live) css = css.replace(/url\(assets\//g, 'url('); // Standbilder (ohne WebGL) liegen neben der Live-Seite
  let tpl = readFileSync(join(dir, cfg.page || 'page.html'), 'utf8');
  if (cfg.root) ROOT_LINKS.forEach(([re, to]) => { tpl = tpl.replace(re, to); });
  // Datenschutz § 4 Online-Terminbuchung (<!--TERMIN-->…): ohne Termin-Blatt heraus, folgende §§ eins zurück
  if (cfg.noTermin) tpl = tpl.replace(/[ \t]*<!--TERMIN-->[\s\S]*?<!--\/TERMIN-->\r?\n?/g, '').replace(/<i>§ ([5-9])<\/i>/g, (m, n) => `<i>§ ${n - 1}</i>`);
  else tpl = tpl.replace(/<!--\/?TERMIN-->/g, '');
  const [headPart, bodyPart] = tpl.split('<!--BODY-->');
  let head = headPart.replace('/*FONTS*/', () => (cfg.fonts ? FONTS[cfg.fonts]() : fontsCss)).replace('/*CSS*/', () => css);
  let body = bodyPart.replace('<!--JS-->', () => `<script>${js}</script>`);
  if (cfg.live) { head = liveHead(head, cfg.live); body = liveBody(body); }
  // Build-Stempel (13.11.): Kurz-Hash des Inhalts – gleicher Quelltext = gleicher Stempel; im Browser: document.querySelector('meta[name=hop-build]').content
  const stamp = cfg.live || name === 'test-4' ? `<meta name="hop-build" content="${createHash('sha256').update(head + body).digest('hex').slice(0, 10)}">\n` : '';
  const full = `<!doctype html>\n<html lang="de">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n${stamp}${head}\n</head>\n<body>\n${body}\n</body>\n</html>\n`;
  mkdirSync(dirname(join(root, cfg.out)), { recursive: true });
  writeFileSync(join(root, cfg.out), full.replace(/\r\n?/g, '\n'));
  if (cfg.live === 'index.html') {
    // Bilder für Link-Vorschau und Home-Bildschirm (Quelle labor/assets/, erzeugt aus der Seite selbst)
    // + Standbilder für Browser ohne WebGL (A2): eigene Dateien, nicht eingebettet
    for (const img of ['og.jpg', 'apple-touch-icon.png', 'still-hero.webp', 'still-achse.webp', 'still-dach.webp', 'still-manu.webp', 'hop-physiotherapie.vcf']) {
      const src = join(root, 'assets', img);
      if (existsSync(src)) copyFileSync(src, join(root, liveDir, img)); else console.warn(`⚠ fehlt: assets/${img}`);
    }
  }
  if (fragmentDir) {
    mkdirSync(fragmentDir, { recursive: true });
    writeFileSync(join(fragmentDir, cfg.out), `${head}\n${body}\n`);
  }
  console.log(`${cfg.out}: ${(full.length / 1024).toFixed(0)} KB (JS ${(js.length / 1024).toFixed(0)} KB)`);
}
