// Auftrag K: Partikel-Bühne als reines WebGL 2 (eine Punktwolke, ein Shader – kein three.js nötig).
// Der Shader ist der Körper-Shader aus Puls (Form 0: Spannung, Atem, Bernstein/Blau-Grün beim Lösen), erweitert um
// Stationen (uRel/uAct je Station), „dicht“ (zur Zonenmitte gezogen) und „weit“ (beim Lösen nach außen), und rechnet
// direkt in Bildpunkten: Bildschirm = Anker + (Punkt − Blickpunkt) · Maßstab – dieselbe Formel nutzt die SVG-Ebene darüber.
const VERT = `#version 300 es
in vec3 aPos; in vec4 aRand; in float aSt; in float aHeat; in vec2 aC;
uniform vec2 uRes, uAnchor;
uniform vec4 uView;   // Blickpunkt x, y (Grundriss-Einheiten, Körpermitte = 0, y oben), Maßstab px/Einheit, Drehung (Wiegen)
uniform float uTime, uBreath, uCalm, uIntro, uPt, uZoom;
uniform vec4 uRel, uAct; // je Station: gelöst 0..1, aktiv (Ring liegt) 0..1
uniform sampler2D uRelax; // Pinsel: hier „streicht“ die Hand die Spannung weg (Zeichenfläche wie in Puls)
uniform vec3 cPetrol, cBone, cAmber, cBlue, cGreen;
out vec3 vCol; out float vA;
vec3 jitter(float amp, float sp){
  return vec3(sin(uTime*sp*1.3+aRand.x*40.), sin(uTime*sp*1.7+aRand.y*40.), sin(uTime*sp*1.1+aRand.z*40.))*amp;
}
float pick(vec4 v, float i){ return i < .5 ? v.x : i < 1.5 ? v.y : i < 2.5 ? v.z : v.w; }
void main(){
  vec3 p = aPos;
  vec2 uv = vec2(p.x/200. + .5, .5 - p.y/430.);
  float on = step(-.5, aSt);
  float brush = texture(uRelax, uv).r;
  float rel = on * max(brush, pick(uRel, aSt));
  float act = on * pick(uAct, aSt);
  float tension = aHeat * (1. - rel) * (.62 + .38*act);
  float relaxed = aHeat * rel;
  float breath = sin(uBreath) * (1. + uCalm*1.3); // entspannt: ruhiger, tiefer Atem (wie Puls)
  vec2 sc = vec2(1. + breath*.007, 1. + breath*.004);
  p.xy *= sc;
  vec2 c = aC * sc;
  p.xy = mix(p.xy, c, tension*aHeat*.15);     // verspannt: dicht zusammengezogen (Kern stärker als Rand, sonst reißen Lücken)
  p.xy += (p.xy - c) * relaxed * .09;          // gelöst: weit
  p += jitter(.22*(1. - uCalm*.6) + tension*1.7, 5.); // fester Takt (Puls 8.11.: kein Phasensprung beim Lösen)
  float cw = cos(uView.w), sw = sin(uView.w);
  p = vec3(cw*p.x + sw*p.z, p.y, -sw*p.x + cw*p.z);
  vec3 n = normalize(aRand.xyz - .5 + 1e-4);
  p += n * (1. - uIntro) * (90. + aRand.x*170.); // Einflug aus der Tiefe
  vec2 s = uAnchor + vec2(p.x - uView.x, -(p.y - uView.y)) * uView.z;
  gl_Position = vec4(s.x/uRes.x*2. - 1., 1. - s.y/uRes.y*2., 0., 1.);
  float throb = .7 + .3*sin(uTime*3.4 + aRand.x*.8);
  vec3 base = mix(cPetrol, cBone, .25 + aRand.y*.35);
  vec3 col = mix(base, cAmber, smoothstep(.08, .7, tension) * throb);
  col = mix(col, mix(cBlue, cGreen, aRand.x), relaxed * .85);
  col = mix(col, mix(cBone, cGreen, .35), uCalm * .18 * (1. - on));
  float sz = (1. + tension*.9*throb) * (.55 + aRand.y*.9) * (1. + (uZoom - 1.)*.12);
  gl_PointSize = max(1.2, uPt * sz);
  vCol = col;
  vA = (.42 + aRand.x*.48) * (1. - tension*.3) * uIntro; // verspannt: dichter, aber Bernstein statt überstrahltem Gelb
}`;
const FRAG = `#version 300 es
precision mediump float;
in vec3 vCol; in float vA; out vec4 o;
uniform float uAlpha;
void main(){
  float d = length(gl_PointCoord - .5);
  float a = smoothstep(.5, .12, d) * vA * uAlpha;
  o = vec4(vCol * a, a);
}`;

const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);

// Software-Grafik (SwiftShader, llvmpipe …) gilt wie in Puls als „ohne WebGL“ → SVG-Umriss; ?gl=1 = Prüfmodus der Werkzeuge
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

export function createStage(gl, pts, relaxCanvas) {
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
  attr('aPos', pts.pos, 3); attr('aRand', pts.rnd, 4); attr('aSt', pts.st, 1); attr('aHeat', pts.heat, 1); attr('aC', pts.ctr, 2);
  const count = pts.st.length;
  const U = {};
  const n = gl.getProgramParameter(prog, gl.ACTIVE_UNIFORMS);
  for (let i = 0; i < n; i++) { const u = gl.getActiveUniform(prog, i); U[u.name] = gl.getUniformLocation(prog, u.name); }
  gl.uniform3fv(U.cPetrol, hex('#4E7F93')); gl.uniform3fv(U.cBone, hex('#D9DCD3')); gl.uniform3fv(U.cAmber, hex('#E59A2F'));
  gl.uniform3fv(U.cBlue, hex('#5AA2D6')); gl.uniform3fv(U.cGreen, hex('#8BC34A'));
  const tex = gl.createTexture();
  gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.uniform1i(U.uRelax, 0);
  const upload = () => { gl.bindTexture(gl.TEXTURE_2D, tex); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, relaxCanvas); };
  upload();
  gl.disable(gl.DEPTH_TEST); gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE); // additiv wie in Puls
  gl.clearColor(10 / 255, 22 / 255, 27 / 255, 1);
  return {
    upload,
    draw(u) {
      gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform2f(U.uRes, u.W, u.H); gl.uniform2f(U.uAnchor, u.ax, u.ay);
      gl.uniform4f(U.uView, u.fx, u.fy, u.s, u.sway);
      gl.uniform1f(U.uTime, u.time); gl.uniform1f(U.uBreath, u.breath); gl.uniform1f(U.uCalm, u.calm);
      gl.uniform1f(U.uIntro, u.intro); gl.uniform1f(U.uPt, u.pt); gl.uniform1f(U.uZoom, u.zoom); gl.uniform1f(U.uAlpha, u.alpha);
      gl.uniform4fv(U.uRel, u.rel); gl.uniform4fv(U.uAct, u.act);
      gl.drawArrays(gl.POINTS, 0, count);
    },
  };
}
