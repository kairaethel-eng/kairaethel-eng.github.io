// Rechnen in Zeitscheiben (Go 4.11.2026, A1): lange Punktwolken-Berechnungen sind Generatoren,
// `yield` markiert Stellen, an denen pausiert werden darf.
// runSync: am Stück (Vergleichsseiten, Zuhause) · runSliced: Blöcke ≤ 8 ms, wenn der Browser Luft hat –
// so entsteht kein Lang-Task, und Scrollen/Tippen bleibt flüssig. Aufträge laufen nacheinander.
export function runSync(gen) {
  let r;
  while (!(r = gen.next()).done);
  return r.value;
}
const idle = typeof requestIdleCallback === 'function' ? (f) => requestIdleCallback(f, { timeout: 20 }) : (f) => setTimeout(f, 0);
let chain = Promise.resolve();
export function runSliced(gen, budget = 8) {
  const job = () => new Promise((ok, fail) => {
    const step = () => {
      const end = performance.now() + budget;
      try {
        let r;
        do { r = gen.next(); if (r.done) { ok(r.value); return; } } while (performance.now() < end);
      } catch (e) { fail(e); return; }
      idle(step);
    };
    idle(step);
  });
  const p = chain.then(job, job);
  chain = p.catch(() => {});
  return p;
}
// Zähler für Yield-Stellen in engen Schleifen: alle `every` Durchläufe true
export const every = (n) => { let k = 0; return () => (++k % n === 0); };

// Mindestabstands-Raster mit Zahlen-Schlüsseln (statt Text-Schlüsseln in einer Map):
// Zelle = gx + gy*W + gz*W*H über dem Begrenzungsrahmen, Punkte als verkettete Liste in Typed Arrays.
export function poissonGrid(min, max, cell, cap) {
  const inv = 1 / cell;
  const W = Math.floor((max[0] - min[0]) * inv) + 3, H = Math.floor((max[1] - min[1]) * inv) + 3, D = Math.floor((max[2] - min[2]) * inv) + 3;
  const ox = min[0] - cell, oy = min[1] - cell, oz = min[2] - cell; // eine Randzelle Luft je Seite
  const cells = W * H * D;
  const dense = cells <= 4e6; // dichtes Feld, sonst Map mit Zahlen-Schlüssel
  const head = dense ? new Int32Array(cells).fill(-1) : null, map = dense ? null : new Map();
  const next = new Int32Array(cap), P = new Float32Array(cap * 3);
  let n = 0;
  const key = (gx, gy, gz) => gx + gy * W + gz * W * H;
  const first = (k) => (dense ? head[k] : (map.has(k) ? map.get(k) : -1));
  return {
    get count() { return n; },
    P,
    // frei, wenn kein Punkt näher als sqrt(r2) – geprüft werden die 27 Nachbarzellen
    free(x, y, z, r2) {
      const gx = Math.floor((x - ox) * inv), gy = Math.floor((y - oy) * inv), gz = Math.floor((z - oz) * inv);
      if (gx < 1 || gy < 1 || gz < 1 || gx > W - 2 || gy > H - 2 || gz > D - 2) return true;
      for (let dz = -1; dz <= 1; dz++) for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        for (let j = first(key(gx + dx, gy + dy, gz + dz)); j >= 0; j = next[j]) {
          const ex = P[j * 3] - x, ey = P[j * 3 + 1] - y, ez = P[j * 3 + 2] - z;
          if (ex * ex + ey * ey + ez * ez < r2) return false;
        }
      }
      return true;
    },
    add(x, y, z) {
      const gx = Math.floor((x - ox) * inv), gy = Math.floor((y - oy) * inv), gz = Math.floor((z - oz) * inv);
      const k = key(Math.min(W - 1, Math.max(0, gx)), Math.min(H - 1, Math.max(0, gy)), Math.min(D - 1, Math.max(0, gz)));
      P[n * 3] = x; P[n * 3 + 1] = y; P[n * 3 + 2] = z;
      next[n] = first(k);
      if (dense) head[k] = n; else map.set(k, n);
      return n++;
    },
  };
}
// Begrenzungsrahmen eines Positions-Arrays
export function bounds(arr) {
  const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < arr.length; i += 3) for (let c = 0; c < 3; c++) { const v = arr[i + c]; if (v < min[c]) min[c] = v; if (v > max[c]) max[c] = v; }
  return { min, max };
}
