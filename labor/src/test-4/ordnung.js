// Geordnete Formen der Hauptwolke (17.11.2026, Go Kai: „wende deine Ideen auf die ganze Website an“ – Studie feinschliff.html).
// Grundsatz wie in der Studie: gleicher Abstand, gleiche Größe, scharfer Rand, kein Zufall im ruhenden Bild.
// Die Hauptwolke hat N Punkte, die zwischen den Formen wandern. Eine geordnete Form braucht viel weniger sichtbare Punkte –
// jede Form bekommt deshalb je Punkt eine Sichtbarkeit (0 = verborgen). Verborgene Punkte liegen trotzdem AUF der Form:
// beim Formwechsel fliegen alle dorthin, die überzähligen verblassen unterwegs.
//   Form 0 Figur        = dieselben Punkte wie Kapitel 01 (kf.cloud(): grobes Raster + Kontur + Körperlinien) → Übergabe deckungsgleich
//   Form 1 Bewegung     = Perlenbänder, ganz im Shader (aIdx → Bahn, Strang, Perle)
//   Form 3 Dachlinie    = Perlen in gleichem Abstand + je zwei feine Begleitlinien
//   Form 4 HOP-Kreise   = Ringe aus Perlen von der Mitte nach außen (leicht gewölbt, Rand heller) + offener Außenring
function rng(seed) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
// feste Zufallsreihenfolge der Plätze: sichtbare Punkte einer Form liegen verstreut in der Wolke (jede Form eigene Reihenfolge)
function slots(N, seed) {
  const r = rng(seed), p = new Uint32Array(N);
  for (let i = 0; i < N; i++) p[i] = i;
  for (let i = N - 1; i > 0; i--) { const j = (r() * (i + 1)) | 0, t = p[i]; p[i] = p[j]; p[j] = t; }
  return p;
}

// Form 0: Punkte aus Kapitel 01. cloud = kf.cloud() → { pts, sp, tilt }; scale = Welt-Einheiten je Grundriss-Einheit.
// f0 je Punkt: Sichtbarkeit (0 verborgen), Randnähe (Farbe Petrol → Knochenweiß), Durchmesser in Grundriss-Einheiten
export function figureForm(N, cloud, scale, pos, f0, heat) {
  const { pts, sp, tilt } = cloud, own = [];
  for (let i = 0; i < pts.count; i++) if (pts.nfo[i * 4] < 1.5) own.push(i); // Körper, Kontur, Körperlinien (ohne Gehirn, Nerven, Raum)
  const S = slots(N, 101), M = Math.min(own.length, N), r = rng(7);
  // sichtbare zuerst (falls die Wolke kleiner ist als die Figur, fehlen nur verborgene)
  own.sort((a, b) => vis(b) - vis(a));
  function vis(i) { const k = pts.nfo[i * 4]; return k > 0.5 || pts.nfo[i * 4 + 2] > 0.5 ? 1 : 0; }
  for (let n = 0; n < N; n++) {
    const hidden = n >= M, i = own[hidden ? (r() * M) | 0 : n], o = S[n];
    pos[o * 3] = pts.pos[i * 3] * scale; pos[o * 3 + 1] = pts.pos[i * 3 + 1] * scale; pos[o * 3 + 2] = pts.pos[i * 3 + 2] * scale;
    const kind = pts.nfo[i * 4], w = pts.nfo[i * 4 + 3];
    let a, rim, d;
    if (kind < 0.5) { // Körper: nur das grobe Raster ist in der Übersicht sichtbar
      const nz = pts.nrm[i * 3 + 2], ny = pts.nrm[i * 3 + 1];
      rim = Math.pow(1 - Math.min(1, Math.max(0, nz + ny * tilt)), 1.5);
      a = pts.nfo[i * 4 + 2] > 0.5 ? 0.44 + 0.56 * rim : 0; d = sp * 0.5 * 1.85;
    } else if (w > 0.8) { a = 0.92; rim = 0.75; d = sp * 0.4; } // Kontur
    else { a = Math.min(1, 0.16 + w * 0.95); rim = 0.75; d = sp * 0.3; } // Körperlinie
    f0[o * 3] = hidden ? 0 : a; f0[o * 3 + 1] = rim; f0[o * 3 + 2] = d;
    heat[o] = pts.st[i] >= 0 ? pts.heat[i] : 0;
  }
}

// Form 3: Dachlinie, Giebel x −1…1, First bei y = 1 (Höhe per uRoofH). kind 0 = Linie, 1 = Begleitlinie; w = Sichtbarkeit
export function roofForm(N, desk) {
  const pos = new Float32Array(N * 3), kind = new Float32Array(N), w = new Float32Array(N);
  const S = slots(N, 303), nCore = desk ? 161 : 81, list = [];
  for (let k = 0; k < nCore; k++) list.push([k / (nCore - 1) * 2 - 1, 0, 0, 1]);
  for (const [off, al] of [[0.03, 0.42], [-0.03, 0.42], [0.06, 0.2], [-0.06, 0.2]]) for (let k = 0; k < nCore - 1; k++) list.push([(k + 0.5) / (nCore - 1) * 2 - 1, off, 1, al]);
  const r = rng(31);
  for (let n = 0; n < N; n++) {
    const hidden = n >= list.length, q = hidden ? list[(r() * nCore) | 0] : list[n], o = S[n];
    pos[o * 3] = q[0]; pos[o * 3 + 1] = 1 - Math.abs(q[0]) + q[1]; pos[o * 3 + 2] = 0;
    kind[o] = q[2]; w[o] = hidden ? 0 : q[3];
  }
  return { pos, kind, w };
}

// Form 4: HOP-Kreise. kind 0/1/2 = Kreisfarbe, 3 = offener Außenring; w = Sichtbarkeit (Rand heller)
export function logoForm(N, desk) {
  const pos = new Float32Array(N * 3), kind = new Float32Array(N), w = new Float32Array(N);
  const cx = [-2.75, 0, 2.75], R = 1.18, dr = desk ? 0.064 : 0.13, list = [];
  // Buchstaben H · O · P (19.11.2026, Kai: „Logo deutlich kenntlich, gerne die Buchstaben h o p einsetzen“): je Kreis ein Buchstabe
  // aus hellen Punkten auf eigenem, geordnetem Raster (Art 4); die Ring-Perlen weichen ihm mit etwas Abstand aus.
  // Maße in Kreis-Radien: Höhe ±0,5, Strichstärke 0,2.
  const T = 0.115, inLetter = (d, x, y, m = 0) => {
    const ax = Math.abs(x), ay = Math.abs(y);
    if (d === 0) return ay <= 0.54 + m && ((ax >= 0.42 - 2 * T - m && ax <= 0.42 + m) || (ay <= T + m && ax <= 0.42 + m)); // H
    if (d === 1) { const q = Math.hypot(x / 0.46, y / 0.56); return q <= 1 + m * 2.2 && Math.hypot(x / (0.46 - 2 * T), y / (0.56 - 2 * T)) >= 1 - m * 3.2; } // O
    if (ay > 0.54 + m) return false; // P: Stamm links, Bogen oben rechts
    if (x >= -0.3 - m && x <= -0.3 + 2 * T + m) return true;
    const bx = x + 0.07, by = y - 0.23, q = Math.hypot(bx, by);
    return x >= -0.07 - m && q <= 0.31 + m && q >= 0.31 - 2 * T - m;
  };
  const gap = dr * 0.55 / R, ls = dr * 0.72;
  for (let d = 0; d < 3; d++) {
    for (let j = 0; (j + 0.5) * dr < R; j++) {
      const rr = (j + 0.5) * dr, n = Math.max(1, Math.round(2 * Math.PI * rr / dr)), u = rr / R;
      for (let k = 0; k < n; k++) {
        const a = (k + (j & 1 ? 0.5 : 0)) / n * Math.PI * 2;
        if (inLetter(d, Math.cos(a) * rr / R, Math.sin(a) * rr / R, gap)) continue; // Platz für den Buchstaben
        list.push([cx[d] + Math.cos(a) * rr, Math.sin(a) * rr + 0.2, Math.sqrt(Math.max(0, 1 - u * u)) * 0.3, d, 0.55 + 0.45 * u * u]);
      }
    }
    for (let gy = -Math.ceil(0.6 * R / ls); gy <= Math.ceil(0.6 * R / ls); gy++) for (let gx = -Math.ceil(0.5 * R / ls); gx <= Math.ceil(0.5 * R / ls); gx++) {
      const x = gx * ls, y = gy * ls;
      if (inLetter(d, x / R, y / R)) list.push([cx[d] + x, y + 0.2, 0.34, 4, 1]);
    }
    // offener Ring wie im Logo (Lücke oben rechts), zwei Stränge
    for (const [rr, al] of [[R * 1.3, 0.9], [R * 1.3 + dr * 0.8, 0.4]]) {
      const n = Math.round(2 * Math.PI * rr / (dr * 0.8));
      for (let k = 0; k < n; k++) { const a = k / n * Math.PI * 2; if (a > 0.25 && a < 1.05) continue; list.push([cx[d] + Math.cos(a) * rr, Math.sin(a) * rr + 0.2, 0, 3, al]); }
    }
  }
  const S = slots(N, 404), r = rng(41);
  // der Reihe nach gemischt verteilen, damit jeder Kreis gleich viele verborgene Punkte bekommt
  const order = slots(list.length, 405);
  for (let n = 0; n < N; n++) {
    const hidden = n >= list.length, q = list[hidden ? (r() * list.length) | 0 : order[n]], o = S[n];
    pos[o * 3] = q[0]; pos[o * 3 + 1] = q[1]; pos[o * 3 + 2] = q[2];
    kind[o] = q[3]; w[o] = hidden ? 0 : q[4];
  }
  return { pos, kind, w, dr };
}
