// Wärme-Anteil eines Bildschirmfotos (objektive Hilfsgröße, kein Ersatz für das Auge).
// Aufruf: node warm.cjs <bild.png> [...]   → je Bild: Anteil heller Bildpunkte, davon warm / kühl / neutral, mittlere Helligkeit,
// „Wärme-Index“ = (warm − kühl) / (warm + kühl + neutral) in −1 … +1, sowie Licht-gewichtete Variante (helle Punkte zählen mehr).
// warm: R > 1,15·B · kühl: B > 1,15·R (auf linearisierten sRGB-Werten); „hell“ = Luma > 0,06 (Hintergrund fällt heraus).
// Optional: CROP=x,y,w,h (Anteile 0–1) wertet nur einen Ausschnitt aus (z. B. ohne Textspalte).
const fs = require('fs'); const { PNG } = require('pngjs');
const lin = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
const crop = (process.env.CROP || '0,0,1,1').split(',').map(Number);
const out = [];
for (const f of process.argv.slice(2)) {
  const p = PNG.sync.read(fs.readFileSync(f));
  const x0 = Math.floor(crop[0] * p.width), y0 = Math.floor(crop[1] * p.height), x1 = Math.floor((crop[0] + crop[2]) * p.width), y1 = Math.floor((crop[1] + crop[3]) * p.height);
  let n = 0, lit = 0, warm = 0, cool = 0, neu = 0, lum = 0, wW = 0, wC = 0, wN = 0;
  for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
    const i = (y * p.width + x) * 4; const r = lin(p.data[i]), g = lin(p.data[i + 1]), b = lin(p.data[i + 2]);
    const L = 0.2126 * r + 0.7152 * g + 0.0722 * b; n++; lum += L;
    if (L <= 0.06) continue; lit++;
    if (r > 1.15 * b) { warm++; wW += L; } else if (b > 1.15 * r) { cool++; wC += L; } else { neu++; wN += L; }
  }
  const idx = lit ? (warm - cool) / lit : 0, idxL = (wW + wC + wN) ? (wW - wC) / (wW + wC + wN) : 0;
  out.push({ bild: f.split('/').pop(), hellAnteil: +(lit / n).toFixed(3), warm: +(warm / (lit || 1)).toFixed(3), kuehl: +(cool / (lit || 1)).toFixed(3), neutral: +(neu / (lit || 1)).toFixed(3), waermeIndex: +idx.toFixed(3), waermeIndexLicht: +idxL.toFixed(3), mittlereHelligkeit: +(lum / n).toFixed(4) });
}
console.log(JSON.stringify(out, null, 1));
