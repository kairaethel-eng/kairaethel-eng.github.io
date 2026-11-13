// Bildschirmfotos über ein installiertes Edge/Chrome (DevTools-Protokoll) – ohne Playwright, ohne Installation.
// Für Kais PC (Windows, Node ≥ 22 mit eingebautem WebSocket). Im Container weiter tools/shot.cjs nutzen.
//
// Aufruf (aus labor/):  node tools/edgeshot.mjs <seite.html> <präfix> <BxH> '<schritt>' …
//   Schritt  '<selektor>|<offset>'  → Element an den Bildanfang + offset × Bildhöhe (z. B. '#achse|1.12', 'top')
//            'card:<i>|<p>'         → Handy Kap. 03 (Option A): Karte i steht seit p Bildhöhen (alle Zeilen ab ~0,31)
//            'stay|<js>'            → nicht scrollen, nur JS ausführen (URL-kodiert, z. B. ein Klick), dann Foto
//   Selektoren ohne Anführungszeichen in Attributen schreiben (PowerShell entfernt sie): '.seg-card:nth-child(2)|-0.5'
// Umgebung:
//   OUT=<ordner>   Ziel der Bilder (Standard: %TEMP%\hop-shots)       WAIT=ms je Bild (Standard 3000; Kamerafahrten 8000–9000)
//   FIRST=ms       Wartezeit nach dem Laden (4000)                   DESK=1  PC-Modus (sonst Handy: mobile + Touch)
//   REDUCED=1      „Bewegung reduzieren“                             NOGL=1  ohne WebGL (Standbild-Rückfall prüfen)
//   QUERY='?licht=1'  an die Adresse hängen                          JS='…'  nach jedem Schritt auswerten und ausgeben (darf async sein)
//   BROWSER=<pfad> anderes Programm (Standard: Edge)
// Beispiel: $env:WAIT=9000; node tools/edgeshot.mjs test-4-puls-scan.html a 390x844 'card:0|0.4' 'card:3|0.4'
// Seitenfehler und Konsolenfehler erscheinen als „ERR …“. SwiftShader ist langsam (~5–9 Bilder/s) → Kamera hängt nach.
// Kai will keine Screenshots geschickt bekommen – nur intern prüfen.
import { spawn } from 'node:child_process';
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path'; import { pathToFileURL } from 'node:url';

const [,, file, prefix, size, ...steps] = process.argv;
if (!file || !prefix || !/^\d+x\d+$/.test(size || '')) { console.log('Aufruf: node tools/edgeshot.mjs <seite.html> <präfix> <BxH> <schritt> …'); process.exit(1); }
const [W, H] = size.split('x').map(Number);
const out = process.env.OUT || path.join(os.tmpdir(), 'hop-shots');
fs.mkdirSync(out, { recursive: true });
const port = 9300 + Math.floor(Math.random() * 500);
const prof = fs.mkdtempSync(path.join(os.tmpdir(), 'hop-edge-'));
const exe = process.env.BROWSER || 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const browser = spawn(exe, [
  '--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${prof}`, '--no-first-run', '--hide-scrollbars',
  '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', `--window-size=${W},${H}`, 'about:blank'], { stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let list = [];
for (let i = 0; i < 50; i++) { try { list = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json(); if (list.find((t) => t.type === 'page')) break; } catch { /* startet noch */ } await sleep(200); }
const tgt = list.find((t) => t.type === 'page');
if (!tgt) { console.log('ERR Browser nicht erreichbar:', exe); browser.kill(); process.exit(1); }
const ws = new WebSocket(tgt.webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener('open', r, { once: true }));
let id = 0; const pend = new Map();
ws.addEventListener('message', (ev) => {
  const m = JSON.parse(ev.data);
  if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); return; }
  if (m.method === 'Runtime.exceptionThrown') console.log('ERR', m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text);
  if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') console.log('ERR', m.params.args.map((a) => a.value ?? a.description).join(' '));
  if (m.method === 'Log.entryAdded' && m.params.entry.level === 'error') console.log('ERR', m.params.entry.text);
});
const send = (method, params = {}) => new Promise((r) => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });

const desk = !!process.env.DESK;
await send('Runtime.enable'); await send('Log.enable'); await send('Page.enable');
if (process.env.NOGL) await send('Page.addScriptToEvaluateOnNewDocument', { source: "const _gc = HTMLCanvasElement.prototype.getContext; HTMLCanvasElement.prototype.getContext = function (t, ...a) { return /webgl/i.test(t) ? null : _gc.call(this, t, ...a); };" });
await send('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: 1, mobile: !desk });
if (!desk) await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
if (process.env.REDUCED) await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
// Seit 13.11.2026 zeigt die Seite bei Software-Grafik (Container!) Standbilder statt WebGL. Die Werkzeuge hängen deshalb ?gl=1 an (Prüfmodus:
// WebGL trotz Software-Grafik, keine Qualitätsstufen). GL0=1 lässt das weg (so sieht es ein Besucher ohne Grafikchip).
await send('Page.navigate', { url: pathToFileURL(path.resolve(file)).href + ((q) => (process.env.GL0 ? q : q ? q + (/[?&]gl=/.test(q) ? '' : '&gl=1') : '?gl=1'))(process.env.QUERY || '') });
await sleep(+(process.env.FIRST || 4000));

let n = 0;
for (const st of steps) {
  const cut = st.indexOf('|'), sel = cut < 0 ? st : st.slice(0, cut), off = cut < 0 ? '' : st.slice(cut + 1);
  let expr = null;
  if (sel === 'stay') expr = off ? decodeURIComponent(off) : null;
  else if (sel.startsWith('card:')) expr = `(() => { const I = ${+sel.slice(5)}, P = ${parseFloat(off || 0)}; const c = [...document.querySelectorAll('.seg-card')]; let y = document.querySelector('#segCards').getBoundingClientRect().top + scrollY; for (let j = 0; j < I; j++) y += c[j].offsetHeight + parseFloat(getComputedStyle(c[j]).marginBottom); const S = parseFloat(getComputedStyle(c[I]).top); scrollTo(0, y - (S - innerHeight * P)); })()`;
  else expr = `(() => { const s = ${JSON.stringify(sel)}; const y = s === 'top' ? 0 : document.querySelector(s).getBoundingClientRect().top + scrollY; scrollTo(0, y + ${parseFloat(off || 0)} * innerHeight); })()`;
  if (expr) { const r = await send('Runtime.evaluate', { expression: expr }); if (r.result?.exceptionDetails) console.log('ERR Schritt', st, r.result.exceptionDetails.exception?.description || ''); }
  await sleep(+(process.env.WAIT || 3000));
  if (process.env.JS) { const r = await send('Runtime.evaluate', { expression: process.env.JS, returnByValue: true, awaitPromise: true }); console.log('JS', st, JSON.stringify(r.result?.result?.value ?? r.result)); }
  const r = await send('Page.captureScreenshot', { format: 'png' });
  const f = path.join(out, `${prefix}-${n++}.png`);
  fs.writeFileSync(f, Buffer.from(r.result.data, 'base64')); console.log(f);
}
ws.close(); browser.kill();
await sleep(600);
try { fs.rmSync(prof, { recursive: true, force: true }); } catch { /* Edge gibt den Ordner manchmal später frei */ }
process.exit(0);
