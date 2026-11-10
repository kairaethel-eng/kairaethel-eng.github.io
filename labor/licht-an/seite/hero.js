/* Titelbild der Konzept-Seite: das Haus als gestochene Punktzeichnung – Schalter „Licht“ wechselt zwischen Scan (heute) und Licht (Konzept). */
(function () {
  var cv = document.getElementById('haus'), sw = document.getElementById('licht');
  if (!cv || !cv.getContext) return;
  var ctx = cv.getContext('2d');
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var seed = 11; function rnd() { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }
  // Farben [r,g,b]: Scan-Palette (heute) und Licht-Palette (Konzept)
  var BONE = [217, 220, 211], PETROL = [78, 127, 147], AMBER = [240, 170, 72], WARMW = [255, 214, 160], GREEN = [139, 195, 74], BLUE = [90, 162, 214], WOOD = [201, 148, 92];
  var P = []; // Punkt: x, y, r, Farbe aus (scan), Farbe an (licht), Deckkraft aus/an, Art (0 fest, 1 Staub), Phase
  function pt(x, y, r, c0, a0, c1, a1, kind) { P.push({ x: x, y: y, r: r, c0: c0, a0: a0, c1: c1, a1: a1, k: kind || 0, ph: rnd() * 6.283, sp: 0.4 + rnd() * 0.8, q: rnd() }); }
  function line(x0, y0, x1, y1, step, r, c0, a0, c1, a1) { var len = Math.hypot(x1 - x0, y1 - y0), n = Math.max(1, Math.round(len / step)); for (var i = 0; i <= n; i++) { var t = i / n; pt(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, r, c0, a0, c1, a1); P[P.length - 1].q = 0; } }
  function fill(x0, y0, x1, y1, gap, fn) { for (var y = y0; y <= y1; y += gap) for (var x = x0; x <= x1; x += gap) { var jx = x + (rnd() - 0.5) * gap * 0.8, jy = y + (rnd() - 0.5) * gap * 0.8; fn(jx, jy); } }
  var W = 1600, H = 900, GY = 690; // Zeichenfläche, Bodenlinie
  var HX0 = 400, HX1 = 1200, HY0 = 300; // Hauswand
  var WIN = [[480, 400, 690, 590], [910, 400, 1120, 590]], DOOR = [755, 410, 845, GY];
  // Dach (Giebel) und Schornstein – „Alles unter einem Dach“
  line(HX0 - 46, HY0, 800, 150, 5, 1.7, BONE, 0.9, BONE, 0.5); line(HX1 + 46, HY0, 800, 150, 5, 1.7, BONE, 0.9, BONE, 0.5);
  line(HX0 - 46, HY0, HX0, HY0, 5, 1.5, BONE, 0.7, BONE, 0.4); line(HX1, HY0, HX1 + 46, HY0, 5, 1.5, BONE, 0.7, BONE, 0.4);
  for (var rr2 = 1; rr2 < 5; rr2++) { var fy = HY0 - rr2 * 30, hw = (HY0 - fy) / (HY0 - 150) * 446; line(HX0 - 46 + hw, fy, HX1 + 46 - hw, fy, 10, 1.2, PETROL, 0.45, PETROL, 0.12); }
  line(1010, 232, 1010, 178, 5, 1.5, BONE, 0.8, BONE, 0.45); line(1052, 247, 1052, 178, 5, 1.5, BONE, 0.8, BONE, 0.45); line(1010, 178, 1052, 178, 5, 1.5, BONE, 0.8, BONE, 0.45);
  for (var sm = 0; sm < 46; sm++) { P.push({ x: 1031, y: 172, r: 1.1 + rnd() * 1.3, c0: BONE, a0: 0, c1: [236, 214, 186], a1: 0.5, k: 2, ph: rnd(), sp: 0.5 + rnd() * 0.7, q: 0 }); }
  // Sterne
  for (var i = 0; i < 90; i++) pt(rnd() * W, rnd() * 250, 0.9 + rnd() * 0.9, BONE, 0.10 + rnd() * 0.25, BONE, 0.05 + rnd() * 0.15);
  // Wand: Scan-Zeilen (heute deutlich, im Licht zurückgenommen) + Fläche, die nur im Licht erscheint
  for (var r = 0; r < 13; r++) line(HX0, HY0 + 26 + r * 28, HX1, HY0 + 26 + r * 28, 9, 1.3, PETROL, 0.55, PETROL, 0.14);
  line(HX0, HY0, HX1, HY0, 5, 1.7, BONE, 0.9, BONE, 0.55); line(HX0, GY, HX1, GY, 5, 1.7, BONE, 0.9, WOOD, 0.5);
  line(HX0, HY0, HX0, GY, 5, 1.7, BONE, 0.9, BONE, 0.5); line(HX1, HY0, HX1, GY, 5, 1.7, BONE, 0.9, BONE, 0.5);
  function inWin(x, y) { for (var i = 0; i < WIN.length; i++) { var w = WIN[i]; if (x > w[0] && x < w[2] && y > w[1] && y < w[3]) return true; } return x > DOOR[0] && x < DOOR[2] && y > DOOR[1]; }
  function glow(x, y) { // Lichtschein an der Wand: nah an Fenstern, Tür, Laterne
    var g = 0; for (var i = 0; i < WIN.length; i++) { var w = WIN[i], dx = Math.max(w[0] - x, 0, x - w[2]), dy = Math.max(w[1] - y, 0, y - w[3]); g += Math.exp(-Math.hypot(dx, dy) / 70); }
    g += 0.9 * Math.exp(-Math.hypot(x - 880, y - 440) / 60); g += 0.5 * Math.exp(-Math.max(0, Math.abs(x - 800) - 45) / 50 - Math.max(0, DOOR[1] - y) / 60); return Math.min(1, g);
  }
  fill(HX0 + 8, HY0 + 8, HX1 - 8, GY - 6, 10.5, function (x, y) { if (inWin(x, y)) return; var g = glow(x, y); if (g > 0.07) pt(x, y, 1.25, PETROL, 0, WARMW, 0.10 + g * 0.55); });
  // Fenster: Rahmen, Sprossen; innen Scan-Zeilen (aus) bzw. warme Fläche (an)
  WIN.forEach(function (w) {
    line(w[0], w[1], w[2], w[1], 4, 1.6, BONE, 0.95, WARMW, 0.95); line(w[0], w[3], w[2], w[3], 4, 1.6, BONE, 0.95, WARMW, 0.95);
    line(w[0], w[1], w[0], w[3], 4, 1.6, BONE, 0.95, WARMW, 0.95); line(w[2], w[1], w[2], w[3], 4, 1.6, BONE, 0.95, WARMW, 0.95);
    var mx = (w[0] + w[2]) / 2; line(mx, w[1], mx, w[3], 5, 1.3, BONE, 0.6, [120, 78, 30], 0.9);
    fill(w[0] + 6, w[1] + 6, w[2] - 6, w[3] - 6, 7.5, function (x, y) { var v = (y - w[1]) / (w[3] - w[1]); pt(x, y, 1.5, PETROL, 0.16, v > 0.55 ? AMBER : WARMW, 0.55 + 0.4 * (1 - Math.abs(v - 0.45))); });
    // Pendelleuchte im Fenster
    var lx = mx + (w[0] < 800 ? -38 : 42); fill(lx - 26, w[1] + 34, lx + 26, w[1] + 58, 5, function (x, y) { pt(x, y, 1.7, AMBER, 0.75, [255, 236, 200], 1); });
    line(lx, w[1] + 4, lx, w[1] + 34, 5, 1.1, BONE, 0.5, [120, 78, 30], 0.8);
  });
  // Tür: Rahmen, Blatt-Zeilen, Griff; im Licht steht sie einen Spalt offen (heller Streifen)
  line(DOOR[0], DOOR[1], DOOR[2], DOOR[1], 4, 1.7, BONE, 0.95, WARMW, 0.9); line(DOOR[0], DOOR[1], DOOR[0], DOOR[3], 4, 1.7, BONE, 0.95, WARMW, 0.9); line(DOOR[2], DOOR[1], DOOR[2], DOOR[3], 4, 1.7, BONE, 0.95, WARMW, 0.9);
  for (var d = 1; d < 9; d++) line(DOOR[0] + 6, DOOR[1] + d * 31, DOOR[2] - 6, DOOR[1] + d * 31, 7, 1.2, BONE, 0.42, WOOD, 0.5);
  fill(DOOR[2] - 20, DOOR[1] + 6, DOOR[2] - 5, DOOR[3] - 2, 5, function (x, y) { pt(x, y, 1.6, PETROL, 0, [255, 226, 180], 0.95); });
  pt(DOOR[0] + 16, 560, 2.6, AMBER, 0.9, AMBER, 1);
  // Schild H·O·P rechts der Tür
  [[905, GREEN], [938, [60, 113, 137]], [971, BLUE]].forEach(function (c) { fill(c[0] - 13, 487, c[0] + 13, 513, 4.2, function (x, y) { if (Math.hypot(x - c[0], y - 500) < 13) pt(x, y, 1.5, c[1], 0.85, c[1], 1); }); });
  // Laterne
  fill(866, 426, 894, 454, 4.5, function (x, y) { var q = Math.hypot(x - 880, y - 440); if (q < 14) pt(x, y, 1.6, AMBER, 0.5, [255, 236, 200], 1); });
  // Pflanzen
  [[705, 640, 40], [1160, 625, 52], [445, 650, 36]].forEach(function (b) { fill(b[0] - b[2], b[1] - b[2], b[0] + b[2], b[1] + b[2], 8, function (x, y) { var q = Math.hypot(x - b[0], (y - b[1]) * 1.15); if (q < b[2]) pt(x, y, 1.7, GREEN, 0.3 + 0.5 * (1 - q / b[2]), [170, 200, 96], 0.45 + 0.5 * (1 - q / b[2])); }); });
  // Boden: Raster (heute) + Lichtflecken in Fenster- und Türform (Konzept)
  for (var g2 = 0; g2 < 6; g2++) { var yy = GY + 16 + g2 * g2 * 6.5 + g2 * 14; line(120, yy, 1480, yy, 14, 1.2, PETROL, 0.42 - g2 * 0.04, PETROL, 0.08); }
  for (var v2 = -7; v2 <= 7; v2++) line(800 + v2 * 62, GY, 800 + v2 * 150, 880, 14, 1.1, PETROL, 0.32, PETROL, 0.06);
  function patch(x0, x1, spread, strength) { fill(x0 - spread * 190, GY + 8, x1 + spread * 190, 884, 9.5, function (x, y) { var t = (y - GY) / 190, l = x0 - spread * 190 * t - 12, rr = x1 + spread * 190 * t + 12; if (x < l || x > rr) return; var edge = Math.min(x - l, rr - x) / 26; var a = strength * (1 - t * 0.75) * Math.min(1, edge); if (a > 0.04) pt(x, y, 1.45 + t * 0.5, PETROL, 0, t < 0.5 ? WARMW : AMBER, a); }); }
  patch(WIN[0][0], WIN[0][2], 0.35, 0.62); patch(WIN[1][0], WIN[1][2], 0.35, 0.62); patch(DOOR[2] - 22, DOOR[2] + 6, 0.5, 0.95);
  // Läufer vor der Tür
  fill(735, GY + 6, 865, GY + 60, 7, function (x, y) { pt(x, y, 1.5, AMBER, 0.5, AMBER, 0.85); });
  // Staub im Licht
  for (var s = 0; s < 70; s++) { var sx = 430 + rnd() * 740, sy = 420 + rnd() * 420; P.push({ x: sx, y: sy, r: 0.9 + rnd() * 1.1, c0: BONE, a0: 0.05, c1: [255, 222, 170], a1: 0.25 + rnd() * 0.45, k: 1, ph: rnd() * 6.283, sp: 0.25 + rnd() * 0.6, q: 0 }); }

  var lit = 1, want = 1, t0 = performance.now(), raf = 0, cssW = 0, cssH = 0, dpr = 1;
  function size() { var b = cv.getBoundingClientRect(); cssW = b.width; cssH = b.height; dpr = Math.min(window.devicePixelRatio || 1, 2); cv.width = Math.round(cssW * dpr); cv.height = Math.round(cssH * dpr); }
  var GL = [[585, 495, 230, 0.55], [1015, 495, 230, 0.55], [822, 560, 190, 0.5], [880, 440, 90, 0.6], [800, 760, 330, 0.28]]; // Glühen: x, y, Radius, Stärke
  function draw(now) {
    var t = (now - t0) / 1000;
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, cv.width, cv.height);
    // Ausschnitt: Haus mittig und groß; schmale Bildschirme sehen den mittleren Teil
    var s = Math.min(cssW / 960, cssH / 700), ox = cssW / 2 - 800 * s, oy = cssH / 2 - 470 * s;
    ctx.setTransform(dpr * s, 0, 0, dpr * s, dpr * ox, dpr * oy);
    if (lit > 0.01) { // weiches Glühen hinter Fenstern, Tür, Laterne und auf dem Weg
      ctx.globalCompositeOperation = 'lighter';
      for (var g = 0; g < GL.length; g++) { var G = GL[g], gr = ctx.createRadialGradient(G[0], G[1], 0, G[0], G[1], G[2]); gr.addColorStop(0, 'rgba(240,160,70,' + (G[3] * 0.34 * lit).toFixed(3) + ')'); gr.addColorStop(1, 'rgba(240,160,70,0)'); ctx.fillStyle = gr; ctx.fillRect(G[0] - G[2], G[1] - G[2], G[2] * 2, G[2] * 2); }
      ctx.globalCompositeOperation = 'source-over';
    }
    var pr = Math.max(0.95, 1.05 / s), dens = Math.min(1, Math.max(0.42, s * 1.25)); // Punkte ≥ 1 Bildpunkt; auf kleinen Schirmen ausdünnen
    for (var i = 0; i < P.length; i++) {
      var p = P[i], a = p.a0 + (p.a1 - p.a0) * lit; if (a < 0.02 || p.q > dens) continue;
      var x = p.x, y = p.y;
      if (p.k === 1 && !reduce) { x += Math.sin(t * 0.21 * p.sp + p.ph) * 26; y += Math.cos(t * 0.17 * p.sp + p.ph * 1.7) * 18; a *= 0.6 + 0.4 * Math.sin(t * 0.63 * p.sp + p.ph); }
      if (p.k === 2) { var u = reduce ? p.ph : (t * 0.045 * p.sp + p.ph) % 1; x += Math.sin(u * 5 + p.ph * 9) * 16 * u + u * 70; y -= u * 150; a *= (1 - u) * Math.min(1, u * 8); }
      var c0 = p.c0, c1 = p.c1;
      ctx.fillStyle = 'rgba(' + Math.round(c0[0] + (c1[0] - c0[0]) * lit) + ',' + Math.round(c0[1] + (c1[1] - c0[1]) * lit) + ',' + Math.round(c0[2] + (c1[2] - c0[2]) * lit) + ',' + a.toFixed(3) + ')';
      ctx.beginPath(); ctx.arc(x, y, p.r * pr, 0, 6.283); ctx.fill();
    }
  }
  function tick(now) {
    var d = want - lit; if (Math.abs(d) > 0.002) lit += d * (reduce ? 1 : 0.07); else lit = want;
    draw(now);
    raf = (!reduce || lit !== want) ? requestAnimationFrame(tick) : 0;
  }
  function start() { if (!raf) raf = requestAnimationFrame(tick); }
  function set(on) { want = on ? 1 : 0; document.documentElement.setAttribute('data-licht', on ? 'an' : 'aus'); if (sw) sw.setAttribute('aria-checked', on ? 'true' : 'false'); start(); }
  if (sw) sw.addEventListener('click', function () { set(want < 0.5); });
  cv.addEventListener('click', function () { set(want < 0.5); });
  window.addEventListener('resize', function () { size(); start(); });
  if ('IntersectionObserver' in window) new IntersectionObserver(function (e) { if (e[0].isIntersecting) start(); else if (raf) { cancelAnimationFrame(raf); raf = 0; } }).observe(cv);
  size(); set(true);
})();
