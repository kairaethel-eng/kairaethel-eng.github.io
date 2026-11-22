// Punkt-Zeichner für den Entwurf „Tür · Raum“ (22.11.2026, Go Kai „a c“) – Kopie von ../tuer/glbatch.js (dort unverändert), erweitert um
//   · sechs Farben: 0 Knochenweiß · 1 Bernstein · 2 warmes Licht · 3 Petrol · 4 Blau · 5 Grün (Logo, nur als Raumfarbe)
//   · drei Masken je Punkt (Farbe + 10 · Maske): 0 = Tür-Bühne (weich unter der Überschrift aus) · 1 = Raum (nur im Bildfeld des Motivs,
//     weiche Ränder – nie unter dem Text) · 2 = keine (Rahmen am Bildschirmrand)
// Additiv, gestochene Scheiben mit einem Bildpunkt weichem Rand, alle Punkte eines Bilds als EIN Aufruf.
const COLS = [[237, 232, 220], [224, 154, 53], [255, 211, 150], [111, 168, 192], [90, 162, 214], [141, 191, 85]].map((c) => c.map((v) => v / 255));
const VS = `
attribute vec2 aPos; attribute vec3 aRAC; // Lage (CSS-Bildpunkte), Radius · Deckkraft · Farbe+10*Maske
uniform vec2 uRes; uniform float uDpr, uFadeY; uniform vec4 uRect;
uniform vec3 uC0, uC1, uC2, uC3, uC4, uC5;
varying vec4 vC; varying float vWant, vSize;
void main(){
  float want = aRAC.x * 2. * uDpr, size = max(want + 1., 2.);
  float m = floor(aRAC.z / 10. + .01), c = aRAC.z - m * 10.;
  vec3 col = c < .5 ? uC0 : c < 1.5 ? uC1 : c < 2.5 ? uC2 : c < 3.5 ? uC3 : c < 4.5 ? uC4 : uC5;
  float a = aRAC.y;
  if (m < .5) a *= smoothstep(uFadeY, uFadeY + 44., aPos.y);
  else if (m < 1.5) {
    float e = 28.;
    a *= smoothstep(uRect.x, uRect.x + e, aPos.x) * (1. - smoothstep(uRect.z - e, uRect.z, aPos.x))
       * smoothstep(uRect.y, uRect.y + e, aPos.y) * (1. - smoothstep(uRect.w - e, uRect.w, aPos.y));
  }
  vC = vec4(col * a, a); vWant = want; vSize = size;
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

export function makeGLBatch(canvas, { soft = false } = {}) {
  let gl = null;
  const opt = { alpha: true, antialias: false, depth: false, stencil: false, premultipliedAlpha: true, preserveDrawingBuffer: false, failIfMajorPerformanceCaveat: !soft };
  try { gl = canvas.getContext('webgl2', opt) || canvas.getContext('webgl', opt); } catch (e) { gl = null; }
  if (!gl) return null;
  // Software-Grafik (Remote-Desktop, gesperrte Treiber) gilt wie in Puls als „ohne Grafikchip“ – außer im Prüfmodus ?gl=1
  if (!soft) try {
    const e = gl.getExtension('WEBGL_debug_renderer_info');
    if (/swiftshader|llvmpipe|softpipe|software|basic render/i.test(String(gl.getParameter(e ? e.UNMASKED_RENDERER_WEBGL : gl.RENDERER)))) { gl.getExtension('WEBGL_lose_context')?.loseContext(); return null; }
  } catch (e) { /* Name nicht lesbar */ }
  const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return s; };
  const prog = gl.createProgram();
  gl.attachShader(prog, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null;
  const U = {}; ['uRes', 'uDpr', 'uFadeY', 'uRect', 'uC0', 'uC1', 'uC2', 'uC3', 'uC4', 'uC5'].forEach((n) => { U[n] = gl.getUniformLocation(prog, n); });
  const aPos = gl.getAttribLocation(prog, 'aPos'), aRAC = gl.getAttribLocation(prog, 'aRAC');
  const buf = gl.createBuffer();
  let data = new Float32Array(5 * 16000), n = 0, dead = false;
  canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); dead = true; });
  return {
    get dead() { return dead; },
    // w, h in CSS-Bildpunkten; fadeY: Maske 0 · rect [x0, y0, x1, y1]: Maske 1
    begin(w, h, dpr, fadeY, rect) {
      n = 0;
      if (dead) return;
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
      gl.useProgram(prog);
      gl.uniform2f(U.uRes, w, h); gl.uniform1f(U.uDpr, dpr); gl.uniform1f(U.uFadeY, fadeY);
      const r = rect || [0, 0, w, h]; gl.uniform4f(U.uRect, r[0], r[1], r[2], r[3]);
      COLS.forEach((c, i) => gl.uniform3f(U['uC' + i], c[0], c[1], c[2]));
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
