// Entwurf „Haus mit Staub“ (21.11.2026, Kai im Arbeitsblatt: Linien behalten, lebende Partikel dazu – gewählt: „Staub zieht beim
// Raumwechsel hinüber“). Die Linien des Hauses bleiben unverändert (house.js / house.css). Dieser Baustein legt nur eine Zeichenfläche
// über das Haus: wechselt der beleuchtete Raum, löst sich das Licht des alten Raums in feinen warmen Staub und sammelt sich im neuen.
// Regeln: feste kleine Punktgröße, höchstens 60 % deckend, läuft über die Zeit (2,6 s) und nur dann – danach ist die Fläche leer und
// der Bildtakt steht. Zeichnet auf dem Grafikchip (WebGL, ein Aufruf je Bild). Ohne WebGL, bei „Bewegung anhalten/reduzieren“: nichts.
// Aufruf: initStaub({ house: #house, rooms: #rooms, isPaused }) – hört selbst auf den Wechsel (.room.on), house.js bleibt unberührt.
const N = 1100, DAUER = 2.6;
function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

export function initStaub({ house, rooms, isPaused = () => false }) {
  if (!house || !rooms || matchMedia('(prefers-reduced-motion: reduce)').matches) return null;
  const cv = document.createElement('canvas');
  cv.className = 'staub'; cv.setAttribute('aria-hidden', 'true');
  house.appendChild(cv);
  const gl = cv.getContext('webgl', { alpha: true, premultipliedAlpha: true, antialias: false });
  if (!gl) { cv.remove(); return null; }
  const sh = (t, src) => { const s = gl.createShader(t); gl.shaderSource(s, src); gl.compileShader(s); return s; };
  const pr = gl.createProgram();
  // je Punkt: a = Start (0…1 im alten Raum), b = Ziel (0…1 im neuen Raum), r = (Verzögerung, Bogenhöhe, Farbe, Funkeln)
  gl.attachShader(pr, sh(gl.VERTEX_SHADER, `
    attribute vec2 a, b; attribute vec4 r;
    uniform vec4 uA, uB; uniform vec2 uRes; uniform float uT, uPx;
    varying float vA; varying float vC;
    void main(){
      float t = clamp((uT - r.x * .42) / .58, 0., 1.), e = t * t * (3. - 2. * t);
      vec2 p0 = uA.xy + a * uA.zw, p1 = uB.xy + b * uB.zw;
      vec2 p = mix(p0, p1, e);
      p.y -= sin(e * 3.14159) * (18. + r.y * 46.) * uPx;            // leichter Bogen nach oben, wie Staub im Licht
      p.x += sin(e * 6.283 + r.w * 6.283) * 5. * uPx * sin(e * 3.14159);
      gl_Position = vec4(p / uRes * 2. - 1., 0., 1.); gl_Position.y = -gl_Position.y;
      gl_PointSize = 2.4 * uPx;
      vA = .6 * smoothstep(0., .12, t) * (1. - smoothstep(.82, 1., t)) * (.55 + .45 * r.w);
      vC = r.z;
    }`));
  gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, `
    precision mediump float; varying float vA; varying float vC;
    void main(){
      float d = length(gl_PointCoord - .5); if (d > .5) discard;
      vec3 c = mix(vec3(.95, .69, .31), vec3(.93, .9, .83), vC);     // Bernstein → Knochenweiß
      float al = vA * (1. - smoothstep(.34, .5, d));
      gl_FragColor = vec4(c * al, al);
    }`));
  gl.linkProgram(pr);
  if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) { cv.remove(); return null; }
  gl.useProgram(pr);
  const R = rng(20261121), data = new Float32Array(N * 8);
  for (let i = 0; i < N; i++) {
    // Start: im Lichtkegel des alten Raums (zur Mitte dichter), Ziel: gleichmäßig über den neuen Raum, etwas zur Lampe hin
    const sx = 0.5 + (R() - 0.5) * (0.35 + 0.6 * R()), sy = 0.12 + R() * 0.6; // nur im Raum selbst (unter dem Boden steht der Raumname)
    data.set([sx, sy, 0.5 + (R() - 0.5) * 0.86, 0.12 + R() * 0.6, R(), R(), R() < 0.3 ? 0.75 + R() * 0.25 : R() * 0.4, R()], i * 8);
  }
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer()); gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
  const at = (n, size, off) => { const l = gl.getAttribLocation(pr, n); gl.enableVertexAttribArray(l); gl.vertexAttribPointer(l, size, gl.FLOAT, false, 32, off); };
  at('a', 2, 0); at('b', 2, 8); at('r', 4, 16);
  const U = {}; for (const n of ['uA', 'uB', 'uRes', 'uT', 'uPx']) U[n] = gl.getUniformLocation(pr, n);
  gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

  let from = null, to = null, t0 = 0, running = false, count = 0;
  const clear = () => { gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT); };
  function frame(now) {
    const t = (now - t0) / 1000 / DAUER;
    if (t >= 1 || isPaused() || !from.isConnected || !to.isConnected) { running = false; clear(); cv.classList.remove('on'); return; }
    const dpr = Math.min(devicePixelRatio || 1, 2), c = cv.getBoundingClientRect(), w = Math.round(c.width * dpr), h = Math.round(c.height * dpr);
    if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; }
    gl.viewport(0, 0, w, h); clear();
    const box = (el) => { const r = el.getBoundingClientRect(); return [(r.left - c.left) * dpr, (r.top - c.top) * dpr, r.width * dpr, r.height * dpr]; };
    gl.uniform4fv(U.uA, box(from)); gl.uniform4fv(U.uB, box(to)); gl.uniform2f(U.uRes, w, h); gl.uniform1f(U.uT, t); gl.uniform1f(U.uPx, dpr);
    gl.drawArrays(gl.POINTS, 0, N);
    requestAnimationFrame(frame);
  }
  function wechsel(a, b) {
    if (!a || !b || a === b || isPaused()) return;
    from = a; to = b; t0 = performance.now(); count++;
    cv.classList.add('on');
    if (!running) { running = true; requestAnimationFrame(frame); }
  }
  // auf den Raumwechsel hören: house.js setzt die Klasse „on“ am gewählten Raum
  let cur = rooms.querySelector('.room.on');
  new MutationObserver(() => { const n = rooms.querySelector('.room.on'); if (n && n !== cur) { const alt = cur; cur = n; wechsel(alt, n); } })
    .observe(rooms, { subtree: true, attributes: true, attributeFilter: ['class'] });
  return { count: () => count, running: () => running };
}
