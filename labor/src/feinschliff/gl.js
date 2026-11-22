// Studie „Feinschliff“ (17.11.2026): Bühne für die geordnete Figur (figur.js). Aufbau wie ../figur-plus/gl.js
// (reines WebGL 2, Bildschirm = Anker + (Punkt − Blickpunkt) · Maßstab), aber:
//   A  alle Punkte gleich groß und gestochen (Scheibe mit 1 Bildpunkt weichem Rand), kein Zittern – Größe wächst mit dem Zoom
//   B  Kantenlicht: je Punkt die Flächen-Normale (aNrm) → zum Rand hin heller und knochenweiß, zur Mitte ruhig und petrol
//   D  Antwort unter Maus/Finger (uPtr): Punkte in der Nähe werden größer und warmweiß, das Raster weicht leicht aus
//   E  Farbklang: Petrol → Knochenweiß (Körper), Bernstein (Spannung, Nerven), ein ruhiges Blau (gelöst) – kein Grün in den Punkten
//   G  Tiefe: die Zeilen sind leicht von oben gesehen (uTilt, Bögen statt Striche), wenige große unscharfe Punkte im Raum (Art 4),
//      Aufbau am Anfang von Kopf bis Fuß (uIntro)
// Wahlweise werden große Punkte zu Ringen (uRing, Adresse ?zeichen=ring) – das HOP-Zeichen, nur zum Ausprobieren.
const VERT = `#version 300 es
in vec3 aPos; in vec3 aNrm; in vec4 aRand; in float aSt; in float aHeat; in vec2 aC; in vec4 aN;
uniform vec2 uRes, uAnchor;
uniform vec4 uView;   // Blickpunkt x, y (Grundriss-Einheiten, Körpermitte = 0, y oben), Maßstab px/Einheit, Drehung (Wiegen)
uniform float uTime, uBreath, uCalm, uIntro, uUnit, uSp, uDpr, uZoom, uTip, uPulse, uNerve, uTilt, uScroll, uRing;
uniform vec4 uRel, uAct; // je Station: gelöst 0..1, aktiv (Ring liegt) 0..1
uniform vec4 uPtr;       // Zeiger: x, y (Grundriss, Körpermitte = 0), Radius (Einheiten), Stärke 0..1
uniform sampler2D uRelax;
uniform vec3 cDeep, cBone, cAmber, cCalm, cLine, cWarm;
out vec3 vCol; out float vA; out float vSize; out float vSoft; out float vRing;
float pick(vec4 v, float i){ return i < .5 ? v.x : i < 1.5 ? v.y : i < 2.5 ? v.z : v.w; }
void main(){
  float kind = aN.x;
  vRing = 0.; vSoft = 0.;
  if (kind > 3.5) { // Raum: große unscharfe Punkte, wandern mit dem Scrollen (nah = schneller) und treiben langsam
    float dep = aN.y;
    vec2 q = aPos.xy;
    q.y = fract(q.y - uScroll * .11 * dep + sin(uTime * .05 + aRand.x * 6.283) * .02);
    q.x += sin(uTime * .04 + aRand.y * 6.283) * .02;
    vec2 s = (q * 1.2 - .1) * uRes;
    gl_Position = vec4(s.x / uRes.x * 2. - 1., 1. - s.y / uRes.y * 2., 0., 1.);
    float size = uDpr * (14. + 44. * aN.w * dep) * clamp(uRes.y / 900., .8, 1.5);
    gl_PointSize = size; vSize = size; vSoft = 1.;
    vCol = mix(cBone, cAmber, step(.72, aN.z) * .7);
    vA = (.022 + .05 * (1. - dep)) * uIntro * (.7 + .3 * sin(uTime * .21 + aRand.z * 6.283));
    return;
  }
  vec3 p = aPos;
  float isBody = 1. - step(.5, kind), isLine = step(.5, kind) * (1. - step(1.5, kind));
  float isBrain = step(1.5, kind) * (1. - step(2.5, kind)), isNerve = step(2.5, kind);
  vec2 uv = vec2(p.x/200. + .5, .5 - p.y/430.);
  float on = step(-.5, aSt);
  float brush = texture(uRelax, uv).r;
  float rel = on * max(brush, pick(uRel, aSt));
  float act = on * pick(uAct, aSt);
  float tension = aHeat * (1. - rel) * (.62 + .38*act);
  float relaxed = aHeat * rel;
  float breath = sin(uBreath) * (1. + uCalm*1.3);
  vec2 sc = vec2(1. + breath*.007, 1. + breath*.004);
  p.xy *= sc;
  vec2 c = aC * sc;
  float dc = length(p.xy - c);
  p.xy = mix(p.xy, c, tension*aHeat*.09);       // verspannt: das Raster zieht sich zusammen – geordnet, ohne Zittern
  p.xy += (p.xy - c) * relaxed * .045;            // gelöst: weit
  // Zeiger: Raster weicht leicht aus (in der Mitte 0, am stärksten bei ~0,7 Radius)
  vec2 dp = p.xy - uPtr.xy;
  float pk = uPtr.w * exp(-dot(dp, dp) / (uPtr.z * uPtr.z));
  p.xy += dp * pk * .13;
  float z = p.z;
  float cw = cos(uView.w), sw = sin(uView.w);
  p = vec3(cw*p.x + sw*z, p.y - z * uTilt, -sw*p.x + cw*z);
  // Aufbau von Kopf bis Fuß: jeder Punkt kommt aus einer kleinen Streuung an seinen Platz
  float hgt = (215. - aPos.y) / 430.;
  float li = clamp(uIntro * 1.7 - hgt * .7, 0., 1.); li = li * li * (3. - 2. * li);
  vec3 dir = aRand.xyz - .5;
  p.xy += dir.xy * (1. - li) * (1. - li) * (70. + aRand.w * 90.);
  vec2 s = uAnchor + vec2(p.x - uView.x, -(p.y - uView.y)) * uView.z;
  gl_Position = vec4(s.x/uRes.x*2. - 1., 1. - s.y/uRes.y*2., 0., 1.);

  // Kantenlicht: Fläche zum Betrachter ruhig, Fläche zum Rand hell
  float facing = clamp((cw*aNrm.z - sw*aNrm.x + aNrm.y * uTilt), 0., 1.);
  float rim = pow(1. - facing, 1.5);
  float throb = .78 + .22*sin(uTime*2.1 - dc*.42);   // Spannung: ruhige Welle aus der Mitte der Stelle statt Flimmern
  vec3 col = mix(cDeep, cBone, .2 + .8*rim);
  float a = .44 + .56*rim;
  // Raster in zwei Stufen: Übersicht = grobes Raster mit größeren Punkten, beim Heranfahren kommen die Punkte dazwischen dazu
  // (unter dem Zeiger schaltet das Raster örtlich auf „fein“ – wie eine Lupe)
  float fineK = max(smoothstep(1.2, 1.9, uZoom), smoothstep(.08, .6, pk)), coarse = mix(1., aN.z, isBody);
  a *= mix(coarse, 1., fineK);
  float d = uSp * .5 * mix(1., mix(1.85, 1., fineK), coarse * isBody); // Durchmesser in Einheiten
  col = mix(col, cAmber, smoothstep(.06, .62, tension) * (.72 + .28*throb));
  a = mix(a, .55 + .45*throb, smoothstep(.06, .62, tension) * .8);
  d *= 1. + tension*.34*throb;
  col = mix(col, cCalm, relaxed * .8);
  a = mix(a, max(a, .62), relaxed);
  col = mix(col, cBone, uCalm * .12 * (1. - on));
  // Körper: innen durchsichtiger, sobald das Nervensystem wächst (Rand bleibt); im Schädel Platz für das Gehirn
  float brainK = smoothstep(12., 30., uTip), glass = smoothstep(40., 230., uTip) * .5;
  // uNerve 1 → 0 (Übergabe an Puls): Gehirn und Nerven ziehen sich zurück, der Körper wird wieder ganz sichtbar
  glass *= uNerve; brainK *= uNerve;
  float hide = isBody * max(glass * (1. - aN.w), aN.y * brainK);
  a *= 1. - hide;
  // Kontur und Körperlinien
  float crease = step(aN.w, .8);
  vec3 cl = mix(cDeep, cBone, .8);
  cl = mix(cl, cAmber, smoothstep(.06, .62, tension) * .75); cl = mix(cl, cCalm, relaxed * .6);
  col = mix(col, cl, isLine);
  a = mix(a, mix(.92, clamp((.16 + aN.w*.95) * (1. - glass*1.4), 0., 1.), crease), isLine);
  d = mix(d, uSp * mix(.4, .3, crease), isLine);
  // Gehirn und Nerven: erscheinen mit der Lichtspitze, vorn an der Spitze heller
  float rev = smoothstep(aN.y - 1.2, aN.y + 1.2, uTip);
  float front = rev * (1. - smoothstep(2., 18., uTip - aN.y));
  // Gehirn: ruhige Wellen von Aktivität ziehen über die Windungen
  float wave = pow(.5 + .5*sin(uTime*.7 + aPos.x*.42 - aPos.y*.3 + sin(aPos.y*.9)*1.3), 8.) * uPulse;
  vec3 cb = mix(cLine, cWarm, smoothstep(.4, .9, aN.w));
  cb = mix(cb, vec3(1., .97, .9), clamp(front*.55 + wave*.7, 0., 1.));
  col = mix(col, cb, isBrain);
  a = mix(a, rev * (.36 + .64*smoothstep(.3, .95, aN.w) + wave*.5) * (1. - .2*smoothstep(70., 210., uTip)) * uNerve, isBrain);
  d = mix(d, .31 + .1*aN.w, isBrain);
  float ph = fract(aN.z/170. - uTime*.16);            // Impuls: alle ~6 s eine Welle vom Gehirn nach außen
  float pulse = pow(ph, 9.) * uPulse;
  col = mix(col, mix(cLine, cWarm, clamp(front*.8 + pulse, 0., 1.)), isNerve);
  a = mix(a, rev * (.62 + .2*aN.w) * (1. + pulse*.8 + front*.5) * uNerve, isNerve);
  d = mix(d, (.34 + .1*aN.w) * (1. + pulse*.45 + front*.3), isNerve);
  // Zeiger: etwas größer und warmweiß – die Punkte bleiben einzeln sichtbar (verborgene Punkte bleiben verborgen)
  float pv = pk * (1. - hide) * mix(1., rev, isBrain + isNerve);
  col = mix(col, vec3(1., .95, .86), pv * .82);
  a = a + (1. - a) * pv * .72;
  d *= 1. + pv * mix(.55, .5, isLine + isBrain + isNerve);
  // Größe: wächst mit dem Zoom; unter der Mindestgröße bleibt der Punkt 1,6 px groß und wird dafür blasser (gleiche Helligkeit je Fläche)
  float want = d * uUnit, size = max(1.6 * uDpr, want), thin = want / size;
  gl_PointSize = size; vSize = size;
  vRing = uRing * smoothstep(3.4 * uDpr, 5.2 * uDpr, size);
  vCol = col;
  vA = clamp(a, 0., 1.) * thin * thin * li;
}`;
const FRAG = `#version 300 es
precision mediump float;
in vec3 vCol; in float vA; in float vSize; in float vSoft; in float vRing; out vec4 o;
uniform float uAlpha;
void main(){
  float d = length(gl_PointCoord - .5);
  float aa = min(.25, 1.3 / vSize);
  float disc = 1. - smoothstep(.5 - aa, .5, d);
  float ring = disc * smoothstep(.5 - .2 - aa, .5 - .2, d);
  float a = mix(mix(disc, ring, vRing), smoothstep(.5, .0, d), vSoft) * vA * uAlpha;
  o = vec4(vCol * a, a);
}`;

const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);

// Software-Grafik (SwiftShader, llvmpipe …) gilt wie in Puls als „ohne WebGL“ → SVG-Umriss; ?gl=1 = Prüfmodus der Werkzeuge
// (gleich wie in ../figur-plus/gl.js, hier noch einmal, damit Puls die alte Bühne nicht mitladen muss)
export function glContext(canvas) {
  const glQ = new URLSearchParams(location.search).get('gl');
  let gl = null;
  try { gl = canvas.getContext('webgl2', { alpha: false, antialias: false, depth: false, stencil: false, premultipliedAlpha: true, powerPreference: 'high-performance', failIfMajorPerformanceCaveat: !glQ }); } catch (e) { /* ohne WebGL 2 */ }
  if (gl && !glQ) try {
    const e = gl.getExtension('WEBGL_debug_renderer_info');
    if (/swiftshader|llvmpipe|softpipe|software|basic render/i.test(String(gl.getParameter(e ? e.UNMASKED_RENDERER_WEBGL : gl.RENDERER)))) { gl.getExtension('WEBGL_lose_context')?.loseContext(); gl = null; }
  } catch (e) { /* Name nicht lesbar: WebGL bleibt an */ }
  return gl;
}

// deep: Grundfarbe des Körpers (seit 22.11.2026 je nach Farbstufe, siehe ../test-4/farbe.js; Standard wie bisher)
export function createStage(gl, pts, relaxCanvas, deep = '#44788E') {
  const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };
  const prog = gl.createProgram();
  gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
  gl.useProgram(prog);
  const vao = gl.createVertexArray(); gl.bindVertexArray(vao);
  const attr = (name, data, size) => {
    const loc = gl.getAttribLocation(prog, name); if (loc < 0) return;
    const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, size, gl.FLOAT, false, 0, 0);
  };
  attr('aPos', pts.pos, 3); attr('aNrm', pts.nrm, 3); attr('aRand', pts.rnd, 4); attr('aSt', pts.st, 1); attr('aHeat', pts.heat, 1); attr('aC', pts.ctr, 2); attr('aN', pts.nfo, 4);
  const count = pts.count;
  const U = {};
  const n = gl.getProgramParameter(prog, gl.ACTIVE_UNIFORMS);
  for (let i = 0; i < n; i++) { const u = gl.getActiveUniform(prog, i); U[u.name] = gl.getUniformLocation(prog, u.name); }
  gl.uniform3fv(U.cDeep, hex(deep || '#44788E')); gl.uniform3fv(U.cBone, hex('#E4E3D8')); gl.uniform3fv(U.cAmber, hex('#E89C30'));
  gl.uniform3fv(U.cCalm, hex('#86BEE6')); gl.uniform3fv(U.cLine, hex('#F0AE50')); gl.uniform3fv(U.cWarm, hex('#FFE6BA'));
  const tex = gl.createTexture();
  gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.uniform1i(U.uRelax, 0);
  const upload = () => { gl.bindTexture(gl.TEXTURE_2D, tex); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, relaxCanvas); };
  upload();
  gl.disable(gl.DEPTH_TEST); gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE); // additiv: wo Punkte sich am Rand drängen, wird es heller
  gl.clearColor(10 / 255, 22 / 255, 27 / 255, 1);
  return {
    upload,
    setDeep(h) { gl.useProgram(prog); gl.uniform3fv(U.cDeep, hex(h || '#44788E')); },
    draw(u) {
      gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform2f(U.uRes, u.W, u.H); gl.uniform2f(U.uAnchor, u.ax, u.ay);
      gl.uniform4f(U.uView, u.fx, u.fy, u.s, u.sway);
      gl.uniform1f(U.uTime, u.time); gl.uniform1f(U.uBreath, u.breath); gl.uniform1f(U.uCalm, u.calm);
      gl.uniform1f(U.uIntro, u.intro); gl.uniform1f(U.uAlpha, u.alpha);
      gl.uniform1f(U.uUnit, u.s * u.dpr); gl.uniform1f(U.uSp, u.sp); gl.uniform1f(U.uDpr, u.dpr); gl.uniform1f(U.uZoom, u.zoom);
      gl.uniform4fv(U.uRel, u.rel); gl.uniform4fv(U.uAct, u.act);
      gl.uniform1f(U.uTip, u.tip); gl.uniform1f(U.uPulse, u.pulse); gl.uniform1f(U.uNerve, u.nerve);
      gl.uniform1f(U.uTilt, u.tilt); gl.uniform1f(U.uScroll, u.scroll); gl.uniform1f(U.uRing, u.ring);
      gl.uniform4f(U.uPtr, u.ptr[0], u.ptr[1], u.ptr[2], u.ptr[3]);
      gl.drawArrays(gl.POINTS, 0, count);
    },
  };
}
