// Helligkeits-Kennwerte eines Bildes: Mittel, 95. und 99. Perzentil der linearen Luma (hellste Inseln), Anteil heller Punkte.
const fs = require('fs'); const { PNG } = require('pngjs');
const lin = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
for (const f of process.argv.slice(2)) { const p = PNG.sync.read(fs.readFileSync(f)); const L = new Float32Array(p.width * p.height); let s = 0;
  for (let i = 0; i < L.length; i++) { const v = 0.2126 * lin(p.data[i * 4]) + 0.7152 * lin(p.data[i * 4 + 1]) + 0.0722 * lin(p.data[i * 4 + 2]); L[i] = v; s += v; }
  const a = Array.from(L).sort((x, y) => x - y); const q = (k) => a[Math.floor(k * (a.length - 1))];
  console.log(f.split('/').slice(-2).join('/'), 'Mittel', (s / L.length).toFixed(4), 'p95', q(0.95).toFixed(3), 'p99', q(0.99).toFixed(3), 'p99.9', q(0.999).toFixed(3)); }
