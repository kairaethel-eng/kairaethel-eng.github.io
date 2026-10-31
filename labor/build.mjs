// Baut jede Testseite zu EINER eigenständigen HTML-Datei:
// Schriften als Base64, CSS und JS inline – keine externen Abrufe (DSGVO-freundlich).
// Aufruf: npm run build   (optional: node build.mjs test-1)
import { build } from 'esbuild';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const PAGES = {
  'test-1': { out: 'test-1-achse.html' },
  'test-2': { out: 'test-2-puls.html' },
  'test-3': { out: 'test-3-puls-achse.html' },
  'test-4': { out: 'test-4-puls-scan.html' },
  'haus': { out: 'hausbesuch.html', fonts: 'haus' },
};
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
  if (only && only !== name) continue;
  const dir = join(root, 'src', name);
  const res = await build({
    entryPoints: [join(dir, 'main.js')],
    bundle: true, minify: true, format: 'iife', target: 'es2020',
    write: false, legalComments: 'none',
  });
  const js = res.outputFiles[0].text.replace(/<\/script/gi, '<\\/script');
  const css = readFileSync(join(dir, 'style.css'), 'utf8');
  const tpl = readFileSync(join(dir, 'page.html'), 'utf8');
  const [headPart, bodyPart] = tpl.split('<!--BODY-->');
  const head = headPart.replace('/*FONTS*/', () => (cfg.fonts ? FONTS[cfg.fonts]() : fontsCss)).replace('/*CSS*/', () => css);
  const body = bodyPart.replace('<!--JS-->', () => `<script>${js}</script>`);
  const full = `<!doctype html>\n<html lang="de">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n${head}\n</head>\n<body>\n${body}\n</body>\n</html>\n`;
  writeFileSync(join(root, cfg.out), full);
  if (fragmentDir) {
    mkdirSync(fragmentDir, { recursive: true });
    writeFileSync(join(fragmentDir, cfg.out), `${head}\n${body}\n`);
  }
  console.log(`${cfg.out}: ${(full.length / 1024).toFixed(0)} KB (JS ${(js.length / 1024).toFixed(0)} KB)`);
}
