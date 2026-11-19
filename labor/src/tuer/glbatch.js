// Punkt-Zeichner auf dem Grafikchip (19.11.2026, Go Kai „1b“): gleiche Schnittstelle wie der Sammel-Zeichner für Canvas 2D in
// door.js (put/flush), aber alle Punkte eines Bilds gehen als EIN Aufruf an den Grafikchip. Anlass: die Tür-Bühne zeichnete
// rund 7000 Kreise je Bild als Pfade – im Prüfrechner zwei Bilder in sechs Sekunden, am Handy vermutlich Ursache für Ruckeln.
// Farben wie in door.js: 0 Knochenweiß, 1 Bernstein, 2 warmes Licht. Additiv (wie „lighter“), Scheiben mit weichem Rand.
const COLS = [237, 232, 220, 224, 154, 53, 255, 211, 150].map((v) => v / 255);
const VS = `
attribute vec2 aPos; attribute vec3 aRAC; // Lage (CSS-Bildpunkte), Radius · Deckkraft · Farbe
uniform vec2 uRes; uniform float uDpr, uFadeY; uniform vec3 uC0, uC1, uC2;
varying vec4 vC; varying float vWant, vSize;
void main(){
  float want = aRAC.x * 2. * uDpr, size = max(want + 1., 2.);
  vec3 c = aRAC.z < .5 ? uC0 : aRAC.z < 1.5 ? uC1 : uC2;
  float a = aRAC.y * smoothstep(uFadeY, uFadeY + 44., aPos.y); // oben (unter der Überschrift) weich auslaufen
  vC = vec4(c * a, a); vWant = want; vSize = size;
  gl_Position = vec4(aPos.x / uRes.x * 2. - 1., 1. - aPos.y / uRes.y * 2., 0., 1.);
  gl_PointSize = size;
}`;
const FS = `
precision mediump float;
varying vec4 vC; varying float vWant, vSize;
void main(){
  float d = length(gl_PointCoord - .5) * vSize;
  gl_FragColor = vC * clamp(vWant * .5 + .5 - d, 0., 1.);
}`;

export function makeGLBatch(canvas) {
  let gl = null;
  const opt = { alpha: true, antialias: false, depth: false, stencil: false, premultipliedAlpha: true, preserveDrawingBuffer: false };
  try { gl = canvas.getContext('webgl2', opt) || canvas.getContext('webgl', opt); } catch (e) { gl = null; }
  if (!gl) return null;
  const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return s; };
  const prog = gl.createProgram();
  gl.attachShader(prog, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null;
  const U = {}; ['uRes', 'uDpr', 'uFadeY', 'uC0', 'uC1', 'uC2'].forEach((n) => { U[n] = gl.getUniformLocation(prog, n); });
  const aPos = gl.getAttribLocation(prog, 'aPos'), aRAC = gl.getAttribLocation(prog, 'aRAC');
  const buf = gl.createBuffer();
  let data = new Float32Array(5 * 12000), n = 0, dead = false;
  canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); dead = true; });
  return {
    get dead() { return dead; },
    // w, h in CSS-Bildpunkten; fadeY: Höhe, über der nichts gezeichnet wird (Unterkante der Überschrift)
    begin(w, h, dpr, fadeY) {
      n = 0;
      if (dead) return;
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
      gl.useProgram(prog);
      gl.uniform2f(U.uRes, w, h); gl.uniform1f(U.uDpr, dpr); gl.uniform1f(U.uFadeY, fadeY);
      gl.uniform3f(U.uC0, COLS[0], COLS[1], COLS[2]); gl.uniform3f(U.uC1, COLS[3], COLS[4], COLS[5]); gl.uniform3f(U.uC2, COLS[6], COLS[7], COLS[8]);
    },
    put(x, y, r, a, c) {
      if (a <= 0.02 || r <= 0.05) return;
      if ((n + 1) * 5 > data.length) { const d = new Float32Array(data.length * 2); d.set(data); data = d; }
      const o = n * 5; data[o] = x; data[o + 1] = y; data[o + 2] = r; data[o + 3] = a > 1 ? 1 : a; data[o + 4] = c; n++;
    },
    flush() {
      if (dead || !n) return;
      gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE);
      gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.bufferData(gl.ARRAY_BUFFER, data.subarray(0, n * 5), gl.DYNAMIC_DRAW);
      gl.enableVertexAttribArray(aPos); gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 20, 0);
      gl.enableVertexAttribArray(aRAC); gl.vertexAttribPointer(aRAC, 3, gl.FLOAT, false, 20, 8);
      gl.drawArrays(gl.POINTS, 0, n);
    },
    clear() { if (!dead) { gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT); } n = 0; },
    get count() { return n; },
  };
}
