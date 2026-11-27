// Entwurf „Echte Figur“ (23.11.2026, Go Kai „Empfehlung“ = Vorschlag 1 „Anatomisch echt“ A1–A5 + aus Vorschlag 2 B1, B2, B4).
// Punktwolke aus den echten Netzen (assets/figur-echt.bin, tools/figur-echt.mjs) – gleiche Ordnung wie die Figur heute:
//   Zeilen quer über die Oberfläche (Scheiben in gleicher Höhe), gleicher Abstand auf der Oberfläche, jede zweite Zeile versetzt,
//   jeder vierte Punkt gehört zum groben Raster (Übersicht), je Punkt die Normale für das Kantenlicht. Kein Zufall in der Lage.
// Arten je Punkt (nfo.x): 0 Haut (nfo.y = im Kopf, nfo.z = grobes Raster) · 2 Gehirn (nfo.y = Spitzenhöhe, ab der es erscheint, nfo.w = Helligkeit) ·
//   3 Nerv (nfo.y = Spitzenhöhe, nfo.z = Weg vom Gehirn, nfo.w = Dicke) · 4 Raum · 5 Knochen (nfo.z = grobes Raster, nfo.w = Teil: 1 Rippen/Hände dezenter, 2 Schädel – tritt hinter das Gehirn zurück) ·
//   6 Muskel (Spannung der Station; nfo.y = Station) · 7 Boden · 8 Muskel-Hülle (Fassung L: alle oberflächlichen Muskeln als Relief;
//   nfo.z = Rinne zwischen den Muskeln 0 frei … 1 tief, aus der Datei)
//   Haut: nfo.w + 4, wenn darunter Muskel-Hülle liegt (tritt in Fassung L zurück)
// Koordinaten: Grundriss 200 × 430, Lage je Punkt um die Körpermitte, y nach oben, z zum Betrachter (wie ../feinschliff/figur.js).
import { STATIONS, stationHeat, BODY_W, BODY_H, CROWN, SOLE } from '../figur-plus/figur.js';

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
function rng(seed) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

// Ecken-Normalen (flächengewichtet)
function normals(pos, idx) {
  const N = new Float32Array(pos.length);
  for (let k = 0; k < idx.length; k += 3) {
    const a = idx[k] * 3, b = idx[k + 1] * 3, c = idx[k + 2] * 3;
    const ux = pos[b] - pos[a], uy = pos[b + 1] - pos[a + 1], uz = pos[b + 2] - pos[a + 2], vx = pos[c] - pos[a], vy = pos[c + 1] - pos[a + 1], vz = pos[c + 2] - pos[a + 2];
    const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
    for (const i of [a, b, c]) { N[i] += nx; N[i + 1] += ny; N[i + 2] += nz; }
  }
  for (let i = 0; i < N.length; i += 3) { const l = Math.hypot(N[i], N[i + 1], N[i + 2]) || 1; N[i] /= l; N[i + 1] /= l; N[i + 2] /= l; }
  return N;
}
// Zeilen über ein Netz (wie ../shared/netz.js rows, Scheiben quer zur Höhe y) – zusätzlich je Punkt Zeile r und Stelle k (grobes Raster).
// fn(x, y, z, nx, ny, nz, coarse, wert) – wert: der Wert je Ecke aus ao (0…255), entlang der Zeile mitgeführt (sonst 0)
function rows({ pos, idx, ao }, sp, fn) {
  const N = normals(pos, idx), nv = pos.length / 3, dy = sp * 0.866;
  let lo = Infinity, hi = -Infinity;
  for (let i = 1; i < pos.length; i += 3) { if (pos[i] < lo) lo = pos[i]; if (pos[i] > hi) hi = pos[i]; }
  const y0 = Math.floor(lo / dy) * dy + dy * 0.137, nR = Math.max(0, Math.ceil((hi - y0) / dy));
  const slices = Array.from({ length: nR }, () => []);
  for (let k = 0; k < idx.length; k += 3) {
    const I = [idx[k], idx[k + 1], idx[k + 2]], h = I.map((i) => pos[i * 3 + 1]), mn = Math.min(h[0], h[1], h[2]), mx = Math.max(h[0], h[1], h[2]);
    for (let r = Math.max(0, Math.ceil((mn - y0) / dy)); r < nR; r++) {
      const y = y0 + r * dy; if (y > mx) break;
      const cut = [];
      for (let e = 0; e < 3; e++) {
        const p = I[e], q = I[(e + 1) % 3], hp = h[e], hq = h[(e + 1) % 3];
        if ((hp < y) === (hq < y)) continue;
        const f = (y - hp) / (hq - hp), key = p < q ? p * nv + q : q * nv + p;
        cut.push({ key, x: [0, 1, 2].map((c) => pos[p * 3 + c] + (pos[q * 3 + c] - pos[p * 3 + c]) * f), n: [0, 1, 2].map((c) => N[p * 3 + c] + (N[q * 3 + c] - N[p * 3 + c]) * f), a: ao ? ao[p] + (ao[q] - ao[p]) * f : 0 });
      }
      if (cut.length === 2) slices[r].push(cut);
    }
  }
  slices.forEach((segs, r) => {
    if (!segs.length) return;
    const yAbs = Math.round((y0 + r * dy) / dy); // Zeilennummer unabhängig vom Teil (Nachbarteile versetzen gleich)
    const at = new Map();
    segs.forEach((s, i) => { for (const e of s) { const l = at.get(e.key); if (l) l.push(i); else at.set(e.key, [i]); } });
    const used = new Uint8Array(segs.length);
    for (let s0 = 0; s0 < segs.length; s0++) {
      if (used[s0]) continue;
      const walk = (start, endKey) => { const out = []; let cur = start, key = endKey; for (;;) { const l = at.get(key); let nx = -1; for (const i of l) if (i !== cur && !used[i]) { nx = i; break; } if (nx < 0) break; used[nx] = 1; const s = segs[nx], e = s[0].key === key ? s[1] : s[0]; out.push(e); key = e.key; cur = nx; } return out; };
      used[s0] = 1;
      const fw = walk(s0, segs[s0][1].key), closed = fw.length && fw[fw.length - 1].key === segs[s0][0].key;
      const bw = closed ? [] : walk(s0, segs[s0][0].key).reverse();
      const line = [...bw, segs[s0][0], segs[s0][1], ...fw];
      const L = [0]; for (let i = 1; i < line.length; i++) L.push(L[i - 1] + Math.hypot(line[i].x[0] - line[i - 1].x[0], line[i].x[1] - line[i - 1].x[1], line[i].x[2] - line[i - 1].x[2]));
      const total = L[L.length - 1]; if (total < sp * 0.5) continue;
      const cnt = Math.max(closed ? 3 : 1, Math.round(total / sp)), offs = yAbs & 1 ? 0.5 : 0;
      let j = 1;
      for (let k = 0; k < (closed ? cnt : cnt + (offs ? 0 : 1)); k++) {
        const s = Math.min(total, ((k + offs) / cnt) * total);
        while (j < L.length - 1 && L[j] < s) j++;
        const f = (s - L[j - 1]) / Math.max(1e-9, L[j] - L[j - 1]), A = line[j - 1], B = line[j];
        const p = [0, 1, 2].map((c) => A.x[c] + (B.x[c] - A.x[c]) * f); let n = [0, 1, 2].map((c) => A.n[c] + (B.n[c] - A.n[c]) * f);
        const l = Math.hypot(n[0], n[1], n[2]) || 1; n = [n[0] / l, n[1] / l, n[2] / l];
        fn(p[0], p[1], p[2], n[0], n[1], n[2], (yAbs & 1) === 0 && ((k & 1) === 0) === ((yAbs & 2) === 0), A.a + (B.a - A.a) * f);
      }
    }
  });
}

// Nervenbahnen aus der Datei (3D, Grundriss) → wie NERVE_LIST in ../figur-plus/figur.js: ry0 (Spitzenhöhe am Anfang), rate, d0 (Weg vom Gehirn)
function nerveList(list) {
  const out = list.map((n) => {
    const pts = n.pts, len = [0];
    for (let i = 1; i < pts.length; i++) len.push(len[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1], pts[i][2] - pts[i - 1][2]));
    return { ...n, len, total: len[len.length - 1], by: pts.map((p) => BODY_H / 2 - p[1]) };
  });
  out.forEach((n, i) => {
    if (n.main) {
      // Weg vom Gehirn: Rückenmark (0) 0, Endfaden (1) = Länge des Rückenmarks, Beine (beginnen am Ende des Endfadens) = beide zusammen
      n.ry0 = n.by[0]; n.rate = 0;
      n.d0 = i === 0 ? 0 : i === 1 ? out[0].total : out[0].total + out[1].total;
      return;
    }
    const P = out[n.parent], a = n.pts[0];
    let best = 0, bd = 1e9;
    P.pts.forEach((p, k) => { const d = Math.hypot(p[0] - a[0], p[1] - a[1], p[2] - a[2]); if (d < bd) { bd = d; best = k; } });
    n.ry0 = P.main ? P.by[best] : P.ry0 + P.len[best] * P.rate;
    n.d0 = P.d0 + P.len[best];
    n.rate = Math.min(1, (SOLE - 6 - n.ry0) / Math.max(1, n.total));
  });
  return out;
}
// Fassungen K, M (Kai 25.11.2026 nachts: „die peripheren Nerven sind mir zu kantig und unlebendig“): die Bahnen sind an echten Landmarken
// gerechnet (Unterrand der Rippen, Fingerknochen …) und tragen deren Zacken; eine läuft sogar ein Stück zurück. Für die Nahansicht:
// Umwege entfernen, gleichmäßig neu abtasten (1 Einheit), dann mitteln (1-2-1, Anfang und Ende bleiben stehen; je länger die Bahn,
// desto weiter – höchstens rund 4 Einheiten). Äste setzen danach wieder genau auf ihrer Stammbahn an. Rückenmark und Endfaden bleiben
// (sie geben den Wirbelkanal wieder). Die Standardseite nutzt die Bahnen unverändert.
function glatt(list) {
  const out = list.map((n) => ({ ...n })), N = out.length;
  const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2], dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
  const cum = (Q) => { const L = [0]; for (let k = 1; k < Q.length; k++) L.push(L[k - 1] + dist(Q[k], Q[k - 1])); return L; };
  // nächster Punkt auf einer Bahn: Abstand d, Punkt c, Weg bis dorthin s
  const nah = (P, L, q) => { let bd = 1e9, bc = P[0], bs = 0;
    for (let k = 1; k < P.length; k++) { const ab = sub(P[k], P[k - 1]), t = clamp(dot(sub(q, P[k - 1]), ab) / Math.max(1e-9, dot(ab, ab))), c = [0, 1, 2].map((j) => P[k - 1][j] + ab[j] * t), d = dist(c, q); if (d < bd) { bd = d; bc = c; bs = L[k - 1] + (L[k] - L[k - 1]) * t; } }
    return { d: bd, c: bc, s: bs }; };
  // Stück einer Bahn zwischen zwei Wegmarken, Punkte im Abstand von rund 1
  const stueck = (P, L, a, b) => { const R = [], n = Math.max(1, Math.round(Math.abs(b - a))); let j = 1;
    for (let k = 0; k <= n; k++) { const w = a + (b - a) * k / n; while (j < L.length - 1 && L[j] < w) j++; const f = clamp((w - L[j - 1]) / Math.max(1e-9, L[j] - L[j - 1])); R.push([0, 1, 2].map((c) => P[j - 1][c] + (P[j][c] - P[j - 1][c]) * f)); }
    return R; };
  const norm = (d) => { const l = Math.hypot(d[0], d[1], d[2]) || 1; return d.map((v) => v / l); };
  const dirA = (Q) => { const L = cum(Q); let k = 1; while (k < Q.length - 1 && L[k] < 4) k++; return norm(sub(Q[k], Q[0])); };               // Richtung am Anfang (über 4 Einheiten)
  const dirE = (Q) => { const L = cum(Q), T = L[L.length - 1]; let k = Q.length - 2; while (k > 0 && T - L[k] < 4) k--; return norm(sub(Q[Q.length - 1], Q[k])); }; // … und am Ende
  // 1 · jede Bahn für sich bereinigen (Rückenmark und Endfaden bleiben, sie geben den Wirbelkanal wieder)
  const Qs = out.map((n, i) => {
    let Q = n.pts.map((q) => q.slice());
    if (i < 2 || Q.length < 2) return Q;
    // Ischias: in den Daten hängt er am Ende des Endfadens und läuft von dort auf einer Höhe nach vorn und zur Seite (23 Einheiten) – im
    // Profil stand das als heller Balken quer im Becken. Seine Wurzeln (L4–S3) sammeln sich in Wirklichkeit schräg abwärts zur Hüfte:
    // der Ansatz rückt am Endfaden 20 Einheiten höher, der waagrechte Anlauf entfällt.
    if (/^Ischias/.test(n.name)) { let k = 1; while (k < Q.length - 2 && Math.abs(Q[k][1] - Q[0][1]) < 1.5) k++;
      const P = out[1].pts, y0 = Q[0][1] + 20; let a = P[0]; for (const q of P) if (Math.abs(q[1] - y0) < Math.abs(a[1] - y0)) a = q;
      if (k > 3) Q = [a.slice(), ...Q.slice(k)]; }
    // Zwischenrippennerven: die Bahn läuft von der Wirbelsäule um den Brustkorb nach vorn. An den kurzen unteren Rippen kehrt sie in den
    // Daten um und läuft zurück zur Wirbelsäule – sie endet deshalb dort, wo sie am weitesten vorn ist (Winkel um die Körperachse).
    if (/^Zwischenrippennerv/.test(n.name)) { let top = -9, at = 0; Q.forEach((q, k) => { const w = Math.atan2(q[2], Math.abs(q[0])); if (w > top) { top = w; at = k; } }); if (at > 2) Q = Q.slice(0, at + 1);
      // … und sie holt an den unteren Rippen erst weit nach hinten aus (bis 7 Einheiten hinter ihren Ansatz) – im Profil standen dort
      // Schleifen neben dem Rückenmark. Der Bogen nach hinten bleibt, aber flacher (40 %).
      const z0 = Q[0][2]; for (const q of Q) if (q[2] < z0) q[2] = z0 - (z0 - q[2]) * 0.4; }
    // Haarnadel: kommt die Bahn nach einem langen Umweg wieder dicht an sich selbst vorbei (näher als 9 Einheiten, Umweg mehr als das
    // 2,5-Fache und über 20 Einheiten) und läuft danach noch weiter, entfällt der Umweg (Oberschenkelnerv an der Leiste)
    { const La = cum(Q); let bi = -1, bj = -1, bw = 0;
      for (let a = 0; a < Q.length; a++) for (let b = a + 2; b < Q.length; b++) { const d = dist(Q[a], Q[b]), w = La[b] - La[a]; if (d < 9 && w > 20 && w > 2.5 * d && w > bw && La[La.length - 1] - La[b] > 10) { bw = w; bi = a; bj = b; } }
      if (bi >= 0) Q = [...Q.slice(0, bi + 1), ...Q.slice(bj)]; }
    return Q;
  });
  // 2 · Zusammenhang (Kai 27.11.2026: „die fortlaufenden Nerven … deutlich natürlicher“). In den Daten treffen sich Bahnen in einem Punkt
  // und gehen dort im Knick auseinander (Armgeflecht: fünf Wurzeln auf einen Punkt, drei Nerven von dort – ein Stern aus geraden Strichen).
  // Ein Nerv verzweigt sich aber wie ein Ast: er läuft ein Stück mit und löst sich dann im flachen Winkel. Dafür:
  //   Kette  – endet eine Bahn dort, wo eine andere beginnt, werden beide EINE Kurve (Wurzel → Zwischenrippennerv, Armgeflecht → Armnerv → Finger)
  //   Abgang – wer an einer Bahn ansetzt (att), bekommt deren letztes Stück als Anlauf und verlässt sie ohne Knick
  //   Einmündung – wer an einer anderen Bahn endet (mrg), läuft in deren Richtung in sie ein
  const next = new Array(N).fill(-1), prev = new Array(N).fill(-1), att = new Array(N).fill(-1), mrg = new Array(N).fill(-1), kand = out.map(() => []);
  const ende = (j) => Qs[j][Qs[j].length - 1];
  for (let i = 2; i < N; i++) { if (Qs[i].length < 2) continue;
    const p = out[i].parent; let bj = -1, bd = 2.5;
    if (p >= 2 && Qs[p].length >= 2 && dist(ende(p), Qs[i][0]) < 2.5) bj = p;
    else for (let j = 2; j < N; j++) { if (j === i || Qs[j].length < 2) continue; const d = dist(ende(j), Qs[i][0]); if (d < bd) { bd = d; bj = j; } }
    if (bj >= 0) kand[bj].push(i); else att[i] = /^Ischias/.test(out[i].name) ? 1 : p; }
  kand.forEach((K, j) => { if (!K.length) return; const e = dirE(Qs[j]); let b = K[0], ba = -9;
    for (const i of K) { const a = dot(e, dirA(Qs[i])); if (a > ba) { ba = a; b = i; } }
    next[j] = b; prev[b] = j; for (const i of K) if (i !== b) att[i] = j; });
  const ketten = [], kette = new Array(N).fill(-1);
  for (let i = 2; i < N; i++) if (prev[i] < 0 && Qs[i].length >= 2) { const C = [i]; while (next[C[C.length - 1]] >= 0) C.push(next[C[C.length - 1]]); C.forEach((c) => { kette[c] = ketten.length; }); ketten.push(C); }
  for (const C of ketten) { const t = C[C.length - 1], E = ende(t), e = dirE(Qs[t]); let bc = -1, ba = 0.2;
    for (let c = 2; c < N; c++) { if (kette[c] < 0 || kette[c] === kette[t] || att[C[0]] === c || kette[att[c]] === kette[t]) continue;
      const L = cum(Qs[c]), h = nah(Qs[c], L, E), T = L[L.length - 1]; if (h.d > 2 || T - h.s < 4) continue;
      const a = dot(e, norm(sub(stueck(Qs[c], L, h.s, Math.min(T, h.s + 3)).pop(), h.c))); if (a > ba) { ba = a; bc = c; } }
    mrg[t] = bc; }
  // 3 · Ketten glätten: gleichmäßig neu abtasten (1 Einheit), mitteln (1-2-1, Enden stehen; je länger, desto weiter – höchstens rund
  // 4 Einheiten), Anlauf und Auslauf dort abschneiden, wo die Kurve ihre Nachbarbahn verlässt bzw. erreicht. Dicke: jede Kette läuft
  // von ihrer kräftigsten Stelle zur Spitze hin fein aus (dA, dB je Bahn = Durchmesser der Perlen am Anfang und am Ende).
  const done = new Array(N).fill(false); done[0] = done[1] = true;
  const TIP = 0.2;
  const bearbeite = (C) => {
    const core = [], marks = [];
    C.forEach((i, m) => { const Q = Qs[i]; if (m) marks.push(core.length - 1); core.push(...(m && dist(Q[0], core[core.length - 1]) < 0.5 ? Q.slice(1) : Q)); });
    const total = cum(core).pop(), lauf = clamp(total * 0.25, 3, 9), a = att[C[0]], m = mrg[C[C.length - 1]];
    let pre = [], post = [], Pa = null, La = null, Pm = null, Lm = null, dick = 9, hm = null; const dA = 0.35;
    if (a >= 0 && done[a] && out[a].pts.length > 1) { Pa = out[a].pts; La = cum(Pa); const h = nah(Pa, La, core[0]);
      if (h.d < 2 && h.s > 1) { pre = stueck(Pa, La, Math.max(0, h.s - lauf), h.s);
        if (out[a].dA) dick = Math.max(0.26, (out[a].dA + (out[a].dB - out[a].dA) * h.s / La[La.length - 1]) * 0.85);
        // am Rückenmark liegt der Anlauf auf dessen Oberfläche (nicht in der Mitte) – die Wurzel schält sich sichtbar ab
        if (a === 0) { const o = sub(core[0], h.c); pre = pre.map((q) => [q[0] + o[0], q[1] + o[1], q[2] + o[2]]); Pa = pre; La = cum(pre); }
      } else Pa = null; }
    if (m >= 0 && done[m] && out[m].pts.length > 1) { Pm = out[m].pts; Lm = cum(Pm); hm = nah(Pm, Lm, core[core.length - 1]); const T = Lm[Lm.length - 1];
      if (hm.d < 4 && T - hm.s > 3) post = stueck(Pm, Lm, hm.s, Math.min(T, hm.s + lauf)); else Pm = null; }
    const all = [...pre, ...core, ...post], L = cum(all), tot = L[L.length - 1], n = Math.max(6, Math.round(tot)), ds = tot / n;
    const R = []; let j = 1;
    for (let k = 0; k <= n; k++) { const w = tot * k / n; while (j < L.length - 1 && L[j] < w) j++; const f = (w - L[j - 1]) / Math.max(1e-9, L[j] - L[j - 1]), A = all[j - 1], B = all[j]; R.push([0, 1, 2].map((c) => A[c] + (B[c] - A[c]) * f)); }
    const sig = Math.min(4.2, Math.max(1.6, total * 0.12)), pass = Math.max(1, Math.round(2 * sig * sig / (ds * ds)));
    for (let p = 0; p < pass; p++) { const T = R.map((q) => q.slice()); for (let k = 1; k < n; k++) for (let c = 0; c < 3; c++) R[k][c] = (T[k - 1][c] + 2 * T[k][c] + T[k + 1][c]) / 4; }
    let k0 = 0, k1 = n;
    if (Pa) { while (k0 < n - 2 && nah(Pa, La, R[k0 + 1]).d < dA) k0++; if (a > 0) R[k0] = nah(Pa, La, R[k0]).c; }
    if (Pm) { while (k1 > k0 + 2 && nah(Pm, Lm, R[k1 - 1]).d < 0.35) k1--; R[k1] = nah(Pm, Lm, R[k1]).c; }
    if (k1 - k0 < C.length) { k0 = 0; k1 = n; }
    const cut = [k0, ...marks.map((ix) => Math.round(L[pre.length + ix] / ds)), k1];
    for (let q = 1; q < cut.length; q++) cut[q] = Math.min(Math.max(cut[q], cut[q - 1] + 1), k1 - (cut.length - 1 - q));
    const dMax = Math.min(dick, clamp(Math.max(...C.map((i) => out[i].r)), 0.3, 0.62));
    const dEnd = Pm && out[m].dA ? Math.min(dMax, Math.max(TIP, (out[m].dA + (out[m].dB - out[m].dA) * hm.s / Lm[Lm.length - 1]) * 0.8)) : TIP;
    const D = (k) => dEnd + (dMax - dEnd) * Math.pow(1 - (k - k0) / Math.max(1, k1 - k0), 0.85);
    C.forEach((i, q) => { out[i].pts = R.slice(cut[q], cut[q + 1] + 1); out[i].dA = D(cut[q]); out[i].dB = D(cut[q + 1]); done[i] = true; });
  };
  const rest = ketten.slice();
  while (rest.length) {
    let k = rest.findIndex((C) => { const a = att[C[0]], m = mrg[C[C.length - 1]]; return (a < 0 || done[a]) && (m < 0 || done[m]); });
    if (k < 0) k = 0;
    bearbeite(rest.splice(k, 1)[0]);
  }
  return out;
}
// Bahn des Leuchtpunkts (SVG) im Grundriss: Mitte (Scheitel → Teilung), dann je Bein die Hauptbahn – y steigt überall
// (K, M übergeben die ungeglätteten Bahnen: geglättet setzt der Ischias höher am Endfaden an und begänne nicht mehr an der Teilung)
export function linesOf(nerves, split) {
  const legs = nerves.filter((n) => n.main && n.pts[0][0] === 0 && Math.abs(n.by[0] - split) < 0.6);
  return [[[100, CROWN], [100, split]], ...legs.slice(0, 2).map((n) => n.pts.map((p) => [p[0] + BODY_W / 2, BODY_H / 2 - p[1]]))];
}

// sp = Abstand der Haut-Punkte (Grundriss-Einheiten), dust = Zahl der großen unscharfen Punkte im Raum, data = decode(…)
export function echtPoints({ sp = 1.6, dust = 26, data, detail = false, hirn = false, shell = false, hirnSp = 0.42, areale = [], ruhig = false }) { // ruhig (Fassung M): keine Spannungs-Stellen am Körper (die vier Texte gehören zu Arealen im Gehirn) // hirnSp: Punktabstand im feinen Gehirn · areale: [Hirnlappen, Seite] je Station (Signal-Bögen) // hirn (Fassung K): Gehirn rundum und dichter, Maße in .brain
  const Pp = [], Nn = [], St = [], Ht = [], Ct = [], Nf = [];
  const put = (x, y, z, nx, ny, nz, kind, a, b, c, heat = null) => {
    Pp.push(x, y, z); Nn.push(nx, ny, nz); Nf.push(kind, a, b, c);
    St.push(heat ? heat.st : -1); Ht.push(heat ? heat.h : 0); Ct.push(heat ? heat.cx : 0, heat ? heat.cy : 0);
  };
  const part = (id) => data.parts.find((p) => p.id === id);
  const skinHeat = (x, y) => {
    if (ruhig) return null;
    const h = stationHeat(x + BODY_W / 2, BODY_H / 2 - y); if (h.st < 0) return null;
    // Nacken und Hüfte: die Spannung sitzt im echten Muskel (Art 6), die Haut glimmt nur mit
    const k = h.st === 1 || h.st === 2 ? 0.32 : 1;
    return { st: h.st, h: h.h * k, cx: h.sp[0] - BODY_W / 2, cy: BODY_H / 2 - h.sp[1] };
  };
  // A1 Haut: nur die vordere und seitliche Fläche (die Figur dreht sich höchstens ±7°), Kopf markiert (dort zeigt sich das Gehirn)
  const skin = part('haut/koerper');
  // Fassung L (25.11.2026, Kai: „auch das Äußere … anatomischer“, „gerne auch Neubearbeitung“): Hülle aller oberflächlichen Muskeln.
  // Zuerst ihre Punkte sammeln (Gitter), damit die Haut weiß, wo Muskel unter ihr liegt (dort tritt sie zurück, sonst bleibt sie).
  const SH = [], shG = new Map(), CG = 5, gk = (x, y, z) => (Math.floor(x / CG) + 512) + (Math.floor(y / CG) + 512) * 1024 + (Math.floor(z / CG) + 512) * 1048576;
  if (shell) {
    const raw = [];
    for (const p of data.parts.filter((q) => q.kind === 'shell')) rows(p, clamp(sp * 0.62, 0.7, 1.2), (x, y, z, nx, ny, nz, coarse, wert) => {
      if (nz < -0.42) return;
      const by = BODY_H / 2 - y; if (by < 66 && Math.abs(x) < 36) return; // Kopf und Gesicht bleiben Haut (Kai 25.11.: keine dunklen Stellen wie an den Augen)
      raw.push([x, y, z, nx, ny, nz, (wert || 0) / 255]); // Rinne zwischen den Muskeln (tools/figur-echt.mjs, verdecke) → Kontur im Licht
    });
    for (const q of raw) { SH.push(q); const k = gk(q[0], q[1], q[2]), l = shG.get(k); if (l) l.push(SH.length - 1); else shG.set(k, [SH.length - 1]); }
    // Verdeckte Lagen (25.11.2026 abends, Kai: „dunkle Stellen noch mehr verbessern“): die Punkte leuchten additiv, also war jede Stelle
    // mit mehreren Muskel-Lagen hintereinander (Brust, Arme, Beine) heller als eine mit nur einer (Bauch) – der Bauch stand als dunkles Feld.
    // Von vorn gemessen: liegt vor einem Punkt eine andere, uns zugewandte Lage, tritt er zurück (q[7] 0 … 1; ganz verdeckte entfallen).
    // Die Figur dreht sich höchstens ±7°, eine eigene schräge Fläche gilt nicht als verdeckt (Toleranz wächst mit der Neigung).
    const ZC = 1.2, zk = (x, y) => (Math.floor(x / ZC) + 512) + (Math.floor(y / ZC) + 512) * 1024, zF = new Map();
    for (const q of SH) { if (q[5] < 0.3) continue; const k = zk(q[0], q[1]), v = zF.get(k); if (v === undefined || q[2] > v) zF.set(k, q[2]); }
    for (const q of SH) {
      let zm = -1e9; for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) { const v = zF.get(zk(q[0] + a * ZC, q[1] + b * ZC)); if (v !== undefined && v > zm) zm = v; }
      const nz = Math.max(0.3, q[5]), tol = 2.2 + 3.4 * Math.sqrt(Math.max(0, 1 - nz * nz)) / nz;
      q[7] = clamp((zm - q[2] - tol) / 3, 0, 1);
    }
  }
  // Liegt unter diesem Haut-Punkt Muskel? Seit 25.11.2026 abends (Kai: „dunkle Stellen noch mehr verbessern“) entlang der Normalen nach
  // innen gemessen (bis 9 Einheiten tief, höchstens 1,15 seitlich) statt im Umkreis: in echten Lücken der Muskel-Hülle (Grube über dem
  // Schlüsselbein, Achsel, Leiste) galt die Haut sonst als bedeckt, trat zurück – und es blieb ein dunkles Loch. Gesucht wird um den
  // Punkt und um eine zweite Stelle 4,5 Einheiten tiefer (das Raster reicht nur eine Zelle weit).
  // Kennung: 4 = Muskel liegt dicht unter der Haut (bis NAH tief) → die Haut tritt zurück · 8 = Muskel erst in der Tiefe (Leiste, Grube am
  // Hals, Achsel: eine Lücke zwischen den Muskeln) → die Haut füllt die Lücke leise, statt dass ein dunkler Streifen bleibt.
  const NAH = 6.5; // gemessen: bis 6,5 Einheiten (26 mm) ist es die normale Schicht über dem Muskel, darüber bleiben genau die Lücken (Leiste, Schambein, Knie, Schienbein)
  const unter = (x, y, z, nx, ny, nz, tief) => {
    for (let s = 0; s < 2; s++) { const px = x - nx * 4.5 * s, py = y - ny * 4.5 * s, pz = z - nz * 4.5 * s;
      for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) for (let c = -1; c <= 1; c++) {
        const l = shG.get(gk(px + a * CG, py + b * CG, pz + c * CG)); if (!l) continue;
        for (const i of l) { const q = SH[i], dx = q[0] - x, dy = q[1] - y, dz = q[2] - z, t = -(dx * nx + dy * ny + dz * nz);
          if (t > -0.7 && t < tief && dx * dx + dy * dy + dz * dz - t * t < 1.32) return true; }
      } }
    return false;
  };
  const covered = (x, y, z, nx, ny, nz) => (!SH.length ? 0 : unter(x, y, z, nx, ny, nz, NAH) ? 4 : unter(x, y, z, nx, ny, nz, 9) ? 8 : 0);
  const fein = (x, by) => by > 390 || (Math.abs(x) > 47 && by > 196);
  rows(skin, sp, (x, y, z, nx, ny, nz, coarse) => {
    if (nz < -0.42) return;
    const by = BODY_H / 2 - y, head = by < 64 && Math.abs(x) < 34 ? 1 : 0;
    const cv = covered(x, y, z, nx, ny, nz);
    put(x, y, z, nx, ny, nz, 0, head, coarse ? 1 : 0, (fein(x, by) || (shell && !cv) ? 2 : 0) + cv, skinHeat(x, y));
  });
  // Fassungen K, M (25.11.2026 nachts, Kai: „die Figur hätte ich gerne seitlich wieder gesehen“): die Fahrt am Rückenmark zeigt die Figur
  // im Profil – dafür braucht der Umriss auch den Rücken (sonst bliebe sie von der Seite hinten offen). Gleiches Raster wie vorn (ein
  // gröberes stand im Profil als gestrichelte Linie da); von vorn sind diese Punkte nie zu sehen (Rückseiten fallen im Shader weg), in
  // Form 0 der Hauptwolke bleiben sie verborgen (Kennung „grob“ 0).
  // Am Handy ist das Raster vorn weiter (bis 2,6) – am Rücken stünde es im Profil als Perlenkette da: dort enger (höchstens 1,5) und mit
  // der Kennung des feinen Rasters (kleinere Punkte).
  if (hirn) rows(skin, Math.min(sp, 1.5), (x, y, z, nx, ny, nz) => { if (nz >= -0.42) return; put(x, y, z, nx, ny, nz, 0, 0, 0, sp > 1.5 ? 1 : 0, null); });
  // Hände und Füße feiner (Fassung J, 25.11.2026, Kai: „Füße, Hände … detaillierter“): ein zweites, engeres Raster nur dort (Kennung 1);
  // die Punkte des normalen Rasters in diesen Bereichen tragen Kennung 2 und treten zurück, sobald das feine gezeigt wird (uDense)
  if (detail) rows(skin, sp * 0.56, (x, y, z, nx, ny, nz) => {
    if (nz < -0.42) return;
    const cv = covered(x, y, z, nx, ny, nz), by = BODY_H / 2 - y;
    if (!fein(x, by) && !(shell && !cv)) return; // Fassung L: alles, was nicht unter Muskel liegt (Kopf, Knie, Hände, Füße), im feinen Raster – ein Material
    put(x, y, z, nx, ny, nz, 0, by < 64 && Math.abs(x) < 34 ? 1 : 0, 0, 1 + cv, skinHeat(x, y));
  });
  for (const q of SH) if (q[7] < 0.999) put(q[0], q[1], q[2], q[3], q[4], q[5], 8, q[7], q[6], 0, skinHeat(q[0], q[1])); // Spannung der Station sitzt in L sichtbar im Muskel-Relief
  const nBody = St.length;
  // A3 Knochen: etwas weiter als die Haut, Rückseiten weg (wie die Haut)
  const spB = clamp(sp * 0.95, 1.1, 2.4);
  for (const p of data.parts.filter((q) => q.kind === 'bone')) {
    const soft = p.id === 'knochen/schaedel' ? 2 : p.id === 'knochen/rippen' || p.id === 'knochen/hand' ? 1 : 0;
    rows(p, spB, (x, y, z, nx, ny, nz, coarse) => { if (nz < -0.35) return; put(x, y, z, nx, ny, nz, 5, 0, coarse ? 1 : 0, soft); });
  }
  // A2 Gehirn: Großhirn mit echten Windungen, Kleinhirn, Hirnstamm – erscheint mit der Lichtspitze von oben nach unten
  // (Innenwände an der Mittelspalte entfallen – sie lägen von vorn gesehen als helle Naht über der Mitte)
  const spBr = hirn ? hirnSp : clamp(sp * 0.42, 0.62, 0.95);
  const BB = [[1e9, -1e9], [1e9, -1e9], [1e9, -1e9]];
  // Fassung K: feine Netze (Art brain2), nach Hirnlappen getrennt (Kennung je Punkt in ctr.x: 0 Stirn · 1 Zentralregion · 2 Schläfe ·
  // 3 Scheitel · 4 Hinterhaupt · 5 Kleinhirn · 6 Stamm); dazu je Punkt die Tiefe unter der Hüllfläche (nfo.z: Furchen dunkel, Windungen hell)
  const fine = hirn && data.parts.some((q) => q.kind === 'brain2');
  const LOBE = { stirn: 0, zentral: 1, schlaefe: 2, scheitel: 3, hinterhaupt: 4, kleinhirn: 5, stamm: 6, innen: 7 }, lobes = []; // 7 = Innenfläche (Gürtelwindung, Insel, Schnittfläche)
  const b0 = St.length; let b1 = b0, hirnInfo = null;
  // Versatz der Nervenbahnen zum feinen Hirnstamm (nur Fassungen mit feinem Gehirn; VS wird beim Rückenmark gesetzt): Rückenmark und
  // Wurzeln sitzen damit genau unter dem Stamm und laufen weiter unten in die unveränderten Bahnen
  let VS = null;
  const versatz = (y) => (VS ? VS(y) : [0, 0]);
  if (!fine) for (const p of data.parts.filter((q) => q.kind === 'brain')) {
    const gross = p.id.endsWith('grosshirn');
    const w = gross ? 0.7 : p.id.endsWith('kleinhirn') ? 0.55 : 0.45;
    rows(p, spBr, (x, y, z, nx, ny, nz) => {
      if (nz < -0.2 && !hirn) return;
      [x, y, z].forEach((c, k) => { if (c < BB[k][0]) BB[k][0] = c; if (c > BB[k][1]) BB[k][1] = c; });
      if (gross && Math.abs(x) < 4.5 && Math.abs(nx) > 0.6) return;
      const by = BODY_H / 2 - y; put(x, y, z, nx, ny, nz, 2, CROWN + (by - CROWN) * 0.72, 0, w);
    });
  } else {
    const all = [];
    for (const p of data.parts.filter((q) => q.kind === 'brain2')) {
      const lb = LOBE[p.id.split('/')[1]] ?? 0, gross = lb < 5 || lb === 7;
      rows(p, spBr, (x, y, z, nx, ny, nz, coarse, wert) => {
        [x, y, z].forEach((c, k) => { if (c < BB[k][0]) BB[k][0] = c; if (c > BB[k][1]) BB[k][1] = c; });
        all.push([x, y, z, nx, ny, nz, wert / 255, lb]); // Verdeckung je Punkt kommt aus der Datei (tools/figur-echt.mjs, Abschnitt 6)
      });
    }
    // Mitte je Lappen und Seite (außen liegende Punkte) – dorthin zeigt der Blick des Areals
    for (let lb = 0; lb < 8; lb++) lobes[lb] = [-1, 1].map((sd) => {
      const L = all.filter((q) => q[7] === lb && (lb === 5 || lb === 6 || (q[0] > 0) === (sd > 0)) && q[6] < 0.3); if (!L.length) return [0, 0, 0];
      return [0, 1, 2].map((k) => L.reduce((a, q) => a + q[k], 0) / L.length);
    });
    const cord = data.head.nerves[0], stem = all.filter((q) => q[7] === 6), mitMark = !!(cord && cord.pts.length > 2 && stem.length);
    let lo = 1e9; for (const q of stem) if (q[1] < lo) lo = q[1];
    // (der ausgefranste untere Rand des Stamms entfällt – dort sitzt das Rückenmark)
    for (const [x, y, z, nx, ny, nz, ao, lb] of all) { if (ao > 0.9 || (mitMark && lb === 6 && y < lo + 1.4)) continue; const by = BODY_H / 2 - y; put(x, y, z, nx, ny, nz, 2, CROWN + (by - CROWN) * 0.72, ao, 0.6, { st: -1, h: 0, cx: lb, cy: 0 }); }
    // Rückenmark als Körper (25.11.2026 abends, Kai: „Nervensystem/Rückenmark gerne bis unten an die Bildschirmkante“): ein Schlauch entlang
    // der Bahn „Rückenmark“ (data.head.nerves[0], an echten Landmarken gerechnet). Er setzt am unteren Ende des feinen Hirnstamms an (Mitte
    // und Radius aus dessen Punkten), läuft auf Lage und Radius der Bahn zu und endet im Kegel. Ordnung wie überall: Zeilen quer in gleichem
    // Abstand, jede zweite versetzt, Normale je Punkt. Gehört zum deckenden Teil (b0…b1), aber nicht zu den Maßen des Gehirns (BB).
    if (mitMark) {
      // Achse und Dicke des Stamms über seinem unteren Ende: Scheiben von 1 Einheit Höhe (Mitte, größte Breite und Tiefe – der Stamm ist
      // breiter als tief), als Gerade ausgeglichen.
      // Das Ende des Stamms ist schräg und offen – der Schlauch beginnt deshalb 6 Einheiten darüber im Inneren des Stamms
      // und umschließt dessen Ende als Manschette; so entsteht keine Naht.
      const sl = [];
      for (let y = lo + 2; y < lo + 9; y += 1) { const L = stem.filter((q) => Math.abs(q[1] - y) < 0.5); if (L.length < 8) continue;
        const cx = L.reduce((a, q) => a + q[0], 0) / L.length, cz = L.reduce((a, q) => a + q[2], 0) / L.length;
        sl.push([y, cx, cz, Math.max(...L.map((q) => Math.abs(q[0] - cx))), Math.max(...L.map((q) => Math.abs(q[2] - cz)))]); }
      const fit = (k) => { const n = sl.length, my = sl.reduce((a, q) => a + q[0], 0) / n, mv = sl.reduce((a, q) => a + q[k], 0) / n;
        const b = sl.reduce((a, q) => a + (q[0] - my) * (q[k] - mv), 0) / Math.max(1e-9, sl.reduce((a, q) => a + (q[0] - my) ** 2, 0)); return (y) => mv + b * (y - my); };
      const ax = fit(1), az = fit(2), arx = fit(3), arz = fit(4);
      // Die Bahn springt kurz unter dem Stamm waagrecht um 2 Einheiten nach vorn (vom Stamm in den Wirbelkanal) – für den Schlauch geglättet:
      // nur Punkte, die tiefer liegen als der vorige, Lage quer und in der Tiefe über ±4 Einheiten Höhe gemittelt
      const Pm = []; for (const q of cord.pts) if (!Pm.length || q[1] < Pm[Pm.length - 1][1] - 0.25) Pm.push(q);
      const P = Pm.map((q) => { let sx = 0, sz = 0, sw = 0; for (const o of Pm) { const w = Math.max(0, 1 - Math.abs(o[1] - q[1]) / 4); sx += o[0] * w; sz += o[2] * w; sw += w; } return [sx / sw, q[1], sz / sw]; });
      const Lc = [0]; for (let i = 1; i < P.length; i++) Lc.push(Lc[i - 1] + Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1], P[i][2] - P[i - 1][2]));
      const total = Lc[Lc.length - 1], sm = (a, b, v) => { const t = clamp((v - a) / (b - a)); return t * t * (3 - 2 * t); };
      // Lage der Bahn in der Höhe y (sie läuft von oben nach unten) – für den Versatz: oben folgt alles der verlängerten Achse des
      // Stamms, nach WEG Einheiten abwärts der Bahn; der Übergang hat keinen Knick (Lage und Richtung stimmen am Ansatz überein)
      const WEG = 20, y0 = P[0][1];
      const pfad = (y) => { let k = 1; while (k < P.length - 1 && P[k][1] > y) k++; const A = P[k - 1], B = P[k], f = clamp((A[1] - y) / Math.max(1e-9, A[1] - B[1]), -2, 1); return [A[0] + (B[0] - A[0]) * f, A[2] + (B[2] - A[2]) * f]; };
      VS = (y) => { const w = 1 - sm(0, WEG, y0 - y); if (w <= 0) return [0, 0]; const q = pfad(y); return [(ax(y) - q[0]) * w, (az(y) - q[1]) * w]; };
      const OBEN = 6, schraeg = 1 / Math.hypot(ax(y0 + 1) - ax(y0), 1, az(y0 + 1) - az(y0));
      const mitte = (sC) => { // Mittellinie: sC < 0 entlang der Achse des Stamms (Manschette), sonst die Bahn mit Versatz
        if (sC < 0) { const y = y0 - sC * schraeg; return [ax(y), y, az(y)]; }
        let k = 1; while (k < Lc.length - 1 && Lc[k] < sC) k++;
        const A = P[k - 1], B = P[k], f = (sC - Lc[k - 1]) / Math.max(1e-9, Lc[k] - Lc[k - 1]), y = A[1] + (B[1] - A[1]) * f, v = VS(y);
        return [A[0] + (B[0] - A[0]) * f + v[0], y, A[2] + (B[2] - A[2]) * f + v[1]];
      };
      const FEIN = 56, dyC = spBr * 0.866; // so weit reicht der Blick im Gehirn nach unten (Handy); darunter genügt das halbe Raster
      let row = 0;
      for (let sC = -OBEN; sC < total - 0.2; sC += sC < FEIN ? dyC : dyC * 2, row++) {
        const c = mitte(sC), ca0 = mitte(sC - 0.4), cb0 = mitte(Math.min(total, sC + 0.4));
        let T = [cb0[0] - ca0[0], cb0[1] - ca0[1], cb0[2] - ca0[2]]; const tl = Math.hypot(T[0], T[1], T[2]) || 1; T = T.map((v) => v / tl);
        // Dicke: oben steckt der Schlauch im Stamm, 3 Einheiten über dessen Ende umschließt er ihn, darunter läuft er auf die Dicke der Bahn zu
        const kS = sC < 0 ? 0.8 + 0.28 * sm(-OBEN, -2.2, sC) : 1.08, kB = sm(0, 10, sC), kE = 1 - 0.7 * clamp((sC / total - 0.88) / 0.12);
        const yS = Math.max(c[1], y0), rx = (arx(yS) * kS * (1 - kB) + cord.r * 1.12 * kB) * kE, rz = (arz(yS) * kS * (1 - kB) + cord.r * 0.9 * kB) * kE, rad = (rx + rz) / 2; // quer breiter als tief (wie das echte Rückenmark)
        let e1 = [1 - T[0] * T[0], -T[0] * T[1], -T[0] * T[2]]; const el = Math.hypot(e1[0], e1[1], e1[2]) || 1; e1 = e1.map((v) => v / el);
        const e2 = [T[1] * e1[2] - T[2] * e1[1], T[2] * e1[0] - T[0] * e1[2], T[0] * e1[1] - T[1] * e1[0]];
        const n = Math.max(6, Math.round(2 * Math.PI * rad / (sC < FEIN ? spBr : spBr * 2))), by = BODY_H / 2 - c[1];
        for (let k = 0; k < n; k++) {
          const a = (k + (row & 1 ? 0.5 : 0)) / n * Math.PI * 2, ca = Math.cos(a), sa = Math.sin(a);
          const px = ca * rx, pz = sa * rz, qx = ca / rx, qz = sa / rz, ql = Math.hypot(qx, qz) || 1; // Ellipse: e1 quer, e2 in die Tiefe; Normale senkrecht zur Ellipse
          const nx = (qx * e1[0] + qz * e2[0]) / ql, ny = (qx * e1[1] + qz * e2[1]) / ql, nz = (qx * e1[2] + qz * e2[2]) / ql;
          put(c[0] + px * e1[0] + pz * e2[0], c[1] + px * e1[1] + pz * e2[1], c[2] + px * e1[2] + pz * e2[2], nx, ny, nz, 2, by, 0, 0.6, { st: -1, h: 0, cx: 6, cy: 0 });
        }
      }
    }
    b1 = St.length;
    // --- Gehirn-Bühne (Fassung K, 25.11.2026: „Gehirn der Extraklasse“): Leuchten, Signal-Bögen, Lichthof – alles geordnet, kein Zufall in der Lage
    const C = BB.map((r) => (r[0] + r[1]) / 2), R = Math.max(...BB.map((r) => (r[1] - r[0]) / 2));
    // Art 9 Leuchten: jeder siebte Punkt auf den Windungen, groß und weich – trägt das Licht des aktiven Areals und das „Feuern“ nach außen
    all.forEach((q, i) => { if (i % 7 === 0 && q[6] < 0.35) put(q[0], q[1], q[2], q[3], q[4], q[5], 9, 0, 0, 0, { st: -1, h: 0, cx: q[7], cy: 0 }); });
    // Art 10 Signal-Bögen (bildlich, keine Anatomie-Daten): vom Areal der Station in ruhigen Bögen über die Oberfläche zu den anderen
    // Lappen derselben Seite, zur Gegenseite, zum Kleinhirn und zum Hirnstamm; nfo.y = Station, nfo.z = Ort auf dem Bogen 0…1, nfo.w = Versatz
    const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], len = (a) => Math.hypot(a[0], a[1], a[2]) || 1;
    const out = (pnt, k) => { const d = sub(pnt, C), l = len(d); return [C[0] + d[0] / l * (l + k), C[1] + d[1] / l * (l + k), C[2] + d[2] / l * (l + k)]; };
    areale.forEach(([lb, sd], ai) => {
      const A = lobes[lb] && lobes[lb][sd]; if (!A || !(A[0] || A[1] || A[2])) return;
      const ziele = [];
      for (let o = 0; o < 5; o++) if (o !== lb && lobes[o]) ziele.push(lobes[o][sd]);
      if (lb < 5) ziele.push(lobes[lb][1 - sd]);
      if (lb !== 5) ziele.push(lobes[5][0]);
      if (lobes[6]) ziele.push(lobes[6][0]);
      ziele.forEach((B, zi) => {
        if (!B || !(B[0] || B[1] || B[2])) return;
        const A1 = out(A, 1.2), B1 = out(B, 1.2), mid = [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2, (A[2] + B[2]) / 2];
        const dm = sub(mid, C), lm = len(dm), hgt = R * 1.02 + len(sub(A, B)) * 0.3;
        const M = [C[0] + dm[0] / lm * hgt * 1.25, C[1] + dm[1] / lm * hgt * 1.25, C[2] + dm[2] / lm * hgt * 1.25];
        const n = Math.max(24, Math.round((len(sub(M, A1)) + len(sub(B1, M))) / 0.42));
        for (let k = 0; k <= n; k++) { const t = k / n, u = 1 - t; put(u * u * A1[0] + 2 * u * t * M[0] + t * t * B1[0], u * u * A1[1] + 2 * u * t * M[1] + t * t * B1[1], u * u * A1[2] + 2 * u * t * M[2] + t * t * B1[2], 0, 0, 0, 10, ai, t, (zi * 0.381966) % 1); }
      });
    });
    // Art 11 Lichthof: ein großer weicher Punkt hinter dem Gehirn (scheint zwischen den Punkten durch)
    put(C[0], C[1], C[2], 0, 0, 0, 11, R, 0, 0);
    hirnInfo = { b0, b1, c: C, r: R, sp: spBr };
  }
  // A4 Muskeln der Stationen: Spannung sitzt im Muskel (Nacken: Trapezius absteigend + Levator scapulae; Hüfte: Gluteus medius, Piriformis, Psoas)
  const spM = clamp(sp * 0.8, 0.9, 2);
  for (const p of data.parts.filter((q) => q.kind === 'muscle' && !ruhig)) {
    const S = STATIONS[p.st], mid = [[], []];
    const tmp = [];
    rows(p, spM, (x, y, z, nx, ny, nz) => { tmp.push([x, y, z, nx, ny, nz]); mid[x > 0 ? 1 : 0].push([x, y]); });
    const c = mid.map((l) => l.reduce((a, q) => [a[0] + q[0] / l.length, a[1] + q[1] / l.length], [0, 0]));
    // Spannung nur innerhalb des Rings der Station (am Rand auslaufend) – was darüber hinausreicht (oberer Psoas), bleibt ruhig;
    // sonst ließe sich die Stelle mit Maus/Finger nie ganz lösen (gemessen wird nur, was im Ring liegt)
    const sx = S.c[0] - BODY_W / 2, sy = BODY_H / 2 - S.c[1];
    for (const [x, y, z, nx, ny, nz] of tmp) {
      const d = Math.hypot(x - sx, y - sy), h = 0.92 * clamp((S.r * 1.02 - d) / (S.r * 0.3));
      put(x, y, z, nx, ny, nz, 6, p.st, 0, 1, { st: p.st, h, cx: c[x > 0 ? 1 : 0][0], cy: c[x > 0 ? 1 : 0][1] });
    }
  }
  // A5 Nerven: Perlen entlang der echten Wege; dicke Bahnen als mehrere Stränge nebeneinander (in der Bildebene versetzt)
  const nerves = nerveList(hirn ? glatt(data.head.nerves) : data.head.nerves);
  const NS = 0.62, GAP = 0.52, n0 = St.length;
  for (const N of nerves) {
    if (VS && N === nerves[0]) continue; // Rückenmark steht als Körper (Schlauch) da
    // K, M (27.11.2026): EIN Strang je Bahn, die Perlen liegen dicht an dicht (Abstand = 0,92 ihres Durchmessers) und werden zur Spitze
    // hin kleiner – ein Nerv liest sich als feine, auslaufende Linie statt als Punktreihe. nfo.w trägt hier den Durchmesser der Perle.
    if (hirn) { const dA = N.dA || clamp(N.r, 0.3, 0.62), dB = N.dB || dA; let j = 1;
      for (let s = 0; s <= N.total + 1e-6;) {
        while (j < N.len.length - 1 && N.len[j] < s) j++;
        const A = N.pts[j - 1], B = N.pts[j], f = (s - N.len[j - 1]) / Math.max(1e-9, N.len[j] - N.len[j - 1]), D = dA + (dB - dA) * s / Math.max(1e-9, N.total);
        const x = A[0] + (B[0] - A[0]) * f, y = A[1] + (B[1] - A[1]) * f, z = A[2] + (B[2] - A[2]) * f, [vx, vz] = versatz(y);
        const tx = B[0] - A[0], ty = B[1] - A[1], tz = B[2] - A[2], t3 = N.main ? 0 : Math.hypot(tx, ty, tz) || 1; // die Richtung der Bahn fährt im Normalen-Feld mit (der Shader dimmt Bahnen, die auf den Betrachter zulaufen)
        put(x + vx, y, z + vz, t3 ? tx / t3 : 0, t3 ? ty / t3 : 0, t3 ? tz / t3 : 0, 3, N.main ? BODY_H / 2 - y : N.ry0 + s * N.rate, N.d0 + s, D);
        s += D * 0.92;
      }
      continue; }
    const K = Math.max(1, Math.round(2 * N.r / GAP));
    for (let k = 0; k < K; k++) {
      const o = (k - (K - 1) / 2) * GAP, n = Math.max(1, Math.round(N.total / NS)), d = N.total / n;
      let j = 1;
      for (let q = k & 1 ? 0.5 : 0; q <= n; q++) {
        const s = Math.min(N.total, q * d);
        while (j < N.len.length - 1 && N.len[j] < s) j++;
        const A = N.pts[j - 1], B = N.pts[j], f = (s - N.len[j - 1]) / Math.max(1e-9, N.len[j] - N.len[j - 1]);
        const x = A[0] + (B[0] - A[0]) * f, y = A[1] + (B[1] - A[1]) * f, z = A[2] + (B[2] - A[2]) * f;
        const tx = B[0] - A[0], ty = B[1] - A[1], tl = Math.hypot(tx, ty) || 1;
        // Rückenmark: zum Ende (Kegel) schmaler
        const rr = N.main && N.r > 1.2 ? N.r * (1 - 0.7 * clamp((s / N.total - 0.88) / 0.12)) : N.r;
        if (K > 1 && Math.abs(o) > rr - 0.1) continue;
        const by = BODY_H / 2 - y;
        const [vx, vz] = versatz(y);
        // K, M: Äste laufen zum Ende hin feiner aus (wie ein Zweig) – die Hauptbahnen behalten ihre Stärke
        // K, M: die Richtung der Bahn fährt im Normalen-Feld mit (der Shader dimmt Bahnen, die auf den Betrachter zulaufen)
        const tz = B[2] - A[2], t3 = hirn && !N.main ? Math.hypot(tx, ty, tz) || 1 : 0;
        put(x - ty / tl * o + vx, y + tx / tl * o, z + vz, t3 ? tx / t3 : 0, t3 ? ty / t3 : 0, t3 ? tz / t3 : 0, 3, N.main ? by : N.ry0 + s * N.rate, N.d0 + s, hirn && !N.main ? N.w * (1 - 0.4 * s / N.total) : N.w);
      }
    }
  }
  const n1 = St.length;
  // Raum: wenige große, unscharfe Punkte vor und hinter der Figur
  const rd = rng(424242);
  for (let k = 0; k < dust; k++) { Pp.push(rd(), rd(), 0); Nn.push(0, 0, 1); Nf.push(4, 0.25 + rd() * 0.75, rd(), 0.35 + rd() * 0.65); St.push(-1); Ht.push(0); Ct.push(0, 0); }

  // Boden (Vergleich Startfigur 25.11.2026, sichtbar nur mit ?start=c|d): geordnete Ringe in der Ebene der Sohlen, nach außen leiser
  { const gy = BODY_H / 2 - 419, R0 = 96, dg = sp * 1.9;
    for (let j = 0; (j + 0.5) * dg < R0; j++) {
      const r = (j + 0.5) * dg, n = Math.max(6, Math.round(2 * Math.PI * r / dg)), fade = Math.pow(1 - r / R0, 1.2) * 0.95;
      for (let k = 0; k < n; k++) { const a = (k + (j & 1 ? 0.5 : 0)) / n * Math.PI * 2; Pp.push(Math.cos(a) * r, gy, Math.sin(a) * r); Nn.push(0, 0, 0); Nf.push(7, fade, j % 4 === 0 ? 1 : 0, 0); St.push(-1); Ht.push(0); Ct.push(0, 0); }
    }
  }
  const count = St.length, rnd = new Float32Array(count * 4), rr = rng(77);
  for (let k = 0; k < rnd.length; k++) rnd[k] = rr();
  const split = data.head.split;
  return { pos: new Float32Array(Pp), nrm: new Float32Array(Nn), st: new Float32Array(St), heat: new Float32Array(Ht), ctr: new Float32Array(Ct), rnd, nfo: new Float32Array(Nf), count, nBody, spB, lines: linesOf(hirn ? nerveList(data.head.nerves) : nerves, split), split, brain: BB, lobes, hirn: hirnInfo, nerv: [n0, n1], mark: nerves.slice(0, 2).flatMap((n) => n.pts.map((q) => { const v = versatz(q[1]); return [q[0] + v[0], q[1], q[2] + v[1]]; })) }; // nerv: Bereich der Nerven-Perlen (sie schreiben in K, M den Leitsatz) · mark: Mittellinie Rückenmark + Endfaden (Fahrt am Rückenmark)
}
