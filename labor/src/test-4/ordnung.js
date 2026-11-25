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

// Form 0 als Leitsatz (25.11.2026 nachts, Kai: „… den Leitspruch bildet … und von dort aus die gerne verstreuten Partikel die Linien in
// Kapitel 2 bilden“; Fassungen K und M): die Punkte der Überschrift im Schlussbild von Kapitel 01 (kf.satz(): x, y in Bildpunkten der Bühne,
// Art 1 Schrift · 2 Hervorhebung), umgerechnet in den Grundriss des Schlussbilds E – bodyFit() legt sie damit wie sonst die Figur
// deckungsgleich auf die echte Schrift. Alle N Punkte liegen auf der Schrift (die überzähligen verborgen): beim Formwechsel lösen sie
// sich von dort als feiner Staub und sammeln sich zu den Perlenbändern von Kapitel 02.
// f0.y trägt die Farbe: 1 = Schrift (Knochenweiß), 2 = Hervorhebung (Bernstein); f0.z = Durchmesser in Grundriss-Einheiten
export function satzForm(N, satz, scale, pos, f0, heat) {
  const { pts, n, dot, E } = satz, S = slots(N, 101), r = rng(7);
  for (let k = 0; k < N; k++) {
    const hidden = k >= n, i = hidden ? (r() * n) | 0 : k, o = S[k];
    pos[o * 3] = ((pts[i * 3] - E.ax) / E.s + E.fx) * scale; pos[o * 3 + 1] = ((E.ay - pts[i * 3 + 1]) / E.s + E.fy) * scale; pos[o * 3 + 2] = 0;
    f0[o * 3] = hidden ? 0 : 0.9; f0[o * 3 + 1] = pts[i * 3 + 2]; f0[o * 3 + 2] = dot / E.s;
    heat[o] = 0;
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
  // 21.11.2026 abends (Kai im Arbeitsblatt: „das Logo an der Hausordnung im Partikel-Stil perfekt an das Hauptlogo der Startseite
  // anpassen“): Maße, Farben und Buchstaben wie das flache Logo A der Kopfleiste (SVG viewBox 424×140: Kreise r 66 im Abstand 142,
  // feiner heller Rand, weiße Buchstaben als Striche der Stärke 15,5). Keine Schwünge, keine Verläufe mehr.
  const R = 1.18, step = R * 142 / 66, cx = [-step, 0, step], dr = desk ? 0.064 : 0.098, list = [];
  const t = 7.75 / 66; // halbe Strichstärke der Buchstaben, in Kreis-Radien
  // Buchstaben in Kreis-Radien (x rechts, y oben), aus den Pfaden des Logos umgerechnet (Mitte 70|70, Teiler 66)
  const inLetter = (d, x, y, m = 0) => {
    const ax = Math.abs(x), ay = Math.abs(y), T = t + m;
    if (d === 0) return (Math.abs(ax - 21.5 / 66) <= T && ay <= 31 / 66 + m) || (ay <= T && ax <= 21.5 / 66 + m); // H: Stämme bei ±21,5, Höhe ±31
    if (d === 1) { // O: Ellipse rx 25,5 · ry 23,25 als Strich
      const rx = 25.5 / 66, ry = 23.25 / 66;
      return Math.hypot(x / (rx + T), y / (ry + T)) <= 1 && Math.hypot(x / Math.max(1e-3, rx - T), y / Math.max(1e-3, ry - T)) >= 1;
    }
    // P: Stamm bei −18,5 (Höhe ±31), oberer Arm y +23,25, unterer Arm y −8,25, Bogen um (5 | 7,5) mit Radius 15,75
    const sx = -18.5 / 66, bx = 5 / 66, by = 7.5 / 66, br = 15.75 / 66, yt = 23.25 / 66, yb = -8.25 / 66;
    if (Math.abs(x - sx) <= T && ay <= 31 / 66 + m) return true;
    if (x >= sx && x <= bx && (Math.abs(y - yt) <= T || Math.abs(y - yb) <= T)) return true;
    return x >= bx && Math.abs(Math.hypot(x - bx, y - by) - br) <= T;
  };
  const gap = dr * 0.55 / R, LN = desk ? 5 : 3, lw = 2 * t / LN; // lw = Bahnabstand der Buchstaben-Punkte, in Kreis-Radien
  for (let d = 0; d < 3; d++) {
    // Kreisfläche in Ringen von der Mitte nach außen, flache Farbe (Art 0, 1, 2), Platz für den Buchstaben
    for (let j = 0; (j + 0.5) * dr < R; j++) {
      const rr = (j + 0.5) * dr, n = Math.max(1, Math.round(2 * Math.PI * rr / dr)), u = rr / R;
      for (let k = 0; k < n; k++) {
        const a = (k + (j & 1 ? 0.5 : 0)) / n * Math.PI * 2;
        if (inLetter(d, Math.cos(a) * rr / R, Math.sin(a) * rr / R, gap)) continue;
        list.push([cx[d] + Math.cos(a) * rr, Math.sin(a) * rr + 0.2, Math.sqrt(Math.max(0, 1 - u * u)) * 0.3, d, 1]);
      }
    }
    // Buchstabe: weiße Punkte in Bahnen entlang der Striche (Art 4). 25.11.2026 (Kai: „Pixelfehler“): vorher ein eigenes dichtes
    // Raster – die Punkte waren größer als ihr Abstand, überlagerten sich (die Wolke mischt additiv) zu hellen Streifen, die Kanten
    // waren treppig. Jetzt folgen die Punkte der Kontur: LN Bahnen quer über die Strichstärke, Abstand entlang der Bahn = Bahnabstand.
    const put = (x, y) => { for (let k = seen.length - 1; k >= 0; k--) { const q = seen[k]; if (Math.hypot(q[0] - x, q[1] - y) < lw * 0.72) return; } seen.push([x, y]); list.push([cx[d] + x * R, y * R + 0.2, 0.34, 4, 1]); };
    const seen = [];
    const line = (x0, y0, x1, y1) => { const L = Math.hypot(x1 - x0, y1 - y0), n = Math.max(1, Math.round(L / lw)); for (let k = 0; k <= n; k++) put(x0 + (x1 - x0) * k / n, y0 + (y1 - y0) * k / n); };
    for (let l = 0; l < LN; l++) {
      const o = -t + lw * (l + 0.5); // Versatz der Bahn quer zum Strich
      if (d === 0) { line(-21.5 / 66 + o, -31 / 66, -21.5 / 66 + o, 31 / 66); line(21.5 / 66 + o, -31 / 66, 21.5 / 66 + o, 31 / 66); }
      else if (d === 1) { const rx = 25.5 / 66 + o, ry = 23.25 / 66 + o, n = Math.round(Math.PI * (rx + ry) / lw); for (let k = 0; k < n; k++) { const a = (k + (l & 1 ? 0.5 : 0)) / n * Math.PI * 2; put(Math.cos(a) * rx, Math.sin(a) * ry); } }
      else line(-18.5 / 66 + o, -31 / 66, -18.5 / 66 + o, 31 / 66);
    }
    for (let l = 0; l < LN; l++) {
      const o = -t + lw * (l + 0.5);
      if (d === 0) line(-21.5 / 66 + t, o, 21.5 / 66 - t, o); // Querstrich zwischen den Stämmen
      else if (d === 2) { // Arme und Bogen des P als eine Bahn: außen = oben, rechts, unten
        const sx = -18.5 / 66 + t, bx = 5 / 66, by = 7.5 / 66, br = 15.75 / 66 + o;
        line(sx, by + br, bx, by + br); line(sx, by - br, bx, by - br);
        const n = Math.max(2, Math.round(Math.PI * br / lw)); for (let k = 1; k < n; k++) { const a = Math.PI / 2 - k / n * Math.PI; put(bx + Math.cos(a) * br, by + Math.sin(a) * br); }
      }
    }
    // feiner heller Rand wie im Logo (Art 3)
    const rr = R + dr * 0.3, n = Math.round(2 * Math.PI * rr / (dr * 0.7));
    for (let k = 0; k < n; k++) { const a = k / n * Math.PI * 2; list.push([cx[d] + Math.cos(a) * rr, Math.sin(a) * rr + 0.2, 0, 3, 0.6]); }
  }
  const S = slots(N, 404), r = rng(41);
  // der Reihe nach gemischt verteilen, damit jeder Kreis gleich viele verborgene Punkte bekommt
  const order = slots(list.length, 405);
  for (let n = 0; n < N; n++) {
    const hidden = n >= list.length, q = list[hidden ? (r() * list.length) | 0 : order[n]], o = S[n];
    pos[o * 3] = q[0]; pos[o * 3 + 1] = q[1]; pos[o * 3 + 2] = q[2];
    kind[o] = q[3]; w[o] = hidden ? 0 : q[4];
  }
  return { pos, kind, w, dr, lp: lw * R * 0.8 }; // lp = Durchmesser der Buchstaben-Punkte
}
