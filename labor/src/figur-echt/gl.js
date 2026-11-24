// Entwurf „Echte Figur“ (23.11.2026): Bühne für die Punkte aus figur.js. Aufbau wie ../feinschliff/gl.js (reines WebGL 2,
// Bildschirm = Anker + (Punkt − Blickpunkt) · Maßstab, gestochene gleich große Punkte, Kantenlicht, Zeiger, Aufbau von Kopf bis Fuß).
// Neu – Schichten: Haut (0), Gehirn (2), Nerven (3), Knochen (5), Muskeln (6); Rückseiten fallen weg (Normale vom Betrachter weg).
//   Stufe 1 (uKino 0) „Anatomisch echt“: Licht wie heute; Knochen schimmern an der Station durch (A3), Spannung im Muskel (A4).
//   Stufe 1+2 (uKino 1) dazu:
//     B1 Scan-Linie legt frei – über der Lichtspitze wird die Haut zu Glas (Umriss bleibt), Gehirn/Knochen/Nerven treten hervor;
//        dort, wo die Linie die Haut schneidet, leuchtet ein feiner Bernstein-Ring um den Körper.
//     B2 Filmlicht – warmes Führungslicht von vorn links oben, kühle Lichtkante von hinten (Raumfarbe), Rest im Schatten;
//        an der aktiven Station ein ruhiger Lichtfleck.
//     B4 Röntgen-Lupe – unter Maus/Finger wird die Haut in einem weichen Kreis durchsichtig, darunter Knochen, Nerven, Muskeln.
const VERT = `#version 300 es
in vec3 aPos; in vec3 aNrm; in vec4 aRand; in float aSt; in float aHeat; in vec2 aC; in vec4 aN;
uniform vec2 uRes, uAnchor;
uniform vec4 uView;   // Blickpunkt x, y (Grundriss, Körpermitte = 0, y oben), Maßstab px/Einheit, Drehung (Wiegen)
uniform float uTime, uBreath, uCalm, uIntro, uUnit, uSp, uSpB, uDpr, uZoom, uTip, uPulse, uNerve, uTilt, uScroll, uKino, uEnd;
uniform vec4 uRel, uAct;
uniform vec4 uPtr;
uniform vec3 uStC[4];  // Stationen: Mitte x, y (Körpermitte = 0, y oben), Radius
uniform sampler2D uRelax;
uniform vec3 cDeep, cBone, cAmber, cCalm, cLine, cWarm, cRim, cKey;
out vec3 vCol; out float vA; out float vSize; out float vSoft;
float pick(vec4 v, float i){ return i < .5 ? v.x : i < 1.5 ? v.y : i < 2.5 ? v.z : v.w; }
void main(){
  float kind = aN.x;
  vSoft = 0.;
  if (kind > 3.5 && kind < 4.5) { // Raum: große unscharfe Punkte, wandern mit dem Scrollen (nah = schneller) und treiben langsam
    float dep = aN.y;
    vec2 q = aPos.xy;
    q.y = fract(q.y - uScroll * .11 * dep + sin(uTime * .05 + aRand.x * 6.283) * .02);
    q.x += sin(uTime * .04 + aRand.y * 6.283) * .02;
    vec2 s = (q * 1.2 - .1) * uRes;
    gl_Position = vec4(s.x / uRes.x * 2. - 1., 1. - s.y / uRes.y * 2., 0., 1.);
    float size = uDpr * (14. + 44. * aN.w * dep) * clamp(uRes.y / 900., .8, 1.5);
    gl_PointSize = size; vSize = size; vSoft = 1.;
    vCol = mix(cBone, mix(cAmber, cRim, uKino * .6), step(.72, aN.z) * .7);
    vA = (.022 + .05 * (1. - dep)) * uIntro * (.7 + .3 * sin(uTime * .21 + aRand.z * 6.283));
    return;
  }
  vec3 p = aPos;
  float isSkin = 1. - step(.5, kind);
  float isBrain = step(1.5, kind) * (1. - step(2.5, kind));
  float isNerve = step(2.5, kind) * (1. - step(3.5, kind));
  float isBone = step(4.5, kind) * (1. - step(5.5, kind));
  float isMus = step(5.5, kind);
  float by = 215. - aPos.y;                  // Grundriss-Höhe (11 Scheitel … 419 Sohle)
  vec2 uv = vec2(p.x/200. + .5, by/430.);
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
  float flex = isSkin + isMus;
  p.xy = mix(p.xy, c, tension*aHeat*.09*flex);       // verspannt: das Raster zieht sich zusammen – geordnet, ohne Zittern
  p.xy += (p.xy - c) * relaxed * .045 * flex;         // gelöst: weit
  vec2 dp = p.xy - uPtr.xy;
  float pk = uPtr.w * exp(-dot(dp, dp) / (uPtr.z * uPtr.z));
  p.xy += dp * pk * .13 * (1. - uKino * .7);
  float z = p.z;
  float cw = cos(uView.w), sw = sin(uView.w);
  p = vec3(cw*p.x + sw*z, p.y - z * uTilt, -sw*p.x + cw*z);
  float hgt = by / 430.;
  float li = clamp(uIntro * 1.7 - hgt * .7, 0., 1.); li = li * li * (3. - 2. * li);
  vec3 dir = aRand.xyz - .5;
  p.xy += dir.xy * (1. - li) * (1. - li) * (70. + aRand.w * 90.);
  vec2 s = uAnchor + vec2(p.x - uView.x, -(p.y - uView.y)) * uView.z;
  gl_Position = vec4(s.x/uRes.x*2. - 1., 1. - s.y/uRes.y*2., 0., 1.);

  // Licht: Normale nach dem Wiegen; zum Betrachter = facing; Rückseiten verschwinden weich
  vec3 n = aNrm;
  float hasN = step(.01, dot(n, n));
  vec3 nv = vec3(cw*n.x + sw*n.z, n.y, -sw*n.x + cw*n.z);
  float facing = clamp(nv.z + n.y * uTilt, -1., 1.);
  float front = mix(1., smoothstep(-.16, .06, facing), hasN);
  float rim = pow(1. - clamp(facing, 0., 1.), 1.5) * hasN;
  // B2 Filmlicht: Führungslicht (warm, vorn links oben), Lichtkante von hinten (kühl), Schatten auf der abgewandten Seite
  vec3 L = normalize(vec3(-.55, .5, .66));
  float key = max(0., dot(nv, L)) * hasN;
  float back = pow(1. - clamp(facing, 0., 1.), 2.4) * hasN;
  float pool = 0., stK = 0.;
  for (int i = 0; i < 4; i++) {
    vec2 d = aPos.xy - uStC[i].xy; float r2 = uStC[i].z * uStC[i].z;
    float ai = pick(uAct, float(i));
    pool += ai * exp(-dot(d, d) / (r2 * 1.6));
    stK += ai * exp(-dot(d, d) / (r2 * 1.1));
  }
  float throb = .78 + .22*sin(uTime*2.1 - dc*.42);
  // Glas: Stufe 1 wie heute (innen durchsichtiger, sobald die Nerven wachsen); Stufe 2 oberhalb der Scan-Linie (B1), am Schluss halb
  float scanned = 1. - smoothstep(uTip - 7., uTip + .5, by);
  float glass1 = smoothstep(40., 230., uTip) * .5;
  float glass2 = scanned * mix(.84, .46, uEnd);
  float glass = mix(glass1, glass2, uKino) * uNerve;
  float lens = pk * uKino;                         // B4 Röntgen-Lupe
  float brainK = smoothstep(12., 30., uTip) * uNerve;

  // ---------- Haut (und Grundwerte) ----------
  vec3 col = mix(cDeep, cBone, .2 + .8*rim);
  float a = .44 + .56*rim;
  vec3 film = cDeep * (.42 + .62*key) + cKey * pow(key, 3.) * .5 + cRim * back * 1.05 + cWarm * pool * key * .2;
  float filmA = .26 + .5*key + .62*back + pool * .08;
  col = mix(col, film, uKino); a = mix(a, filmA, uKino);
  float fineK = max(smoothstep(1.2, 1.9, uZoom), smoothstep(.08, .6, pk)), coarse = mix(1., aN.z, isSkin + isBone);
  a *= mix(coarse, 1., fineK);
  float d = uSp * .5 * mix(1., mix(1.85, 1., fineK), coarse * isSkin);
  float tenK = smoothstep(.06, .62, tension);
  col = mix(col, cAmber, tenK * (.72 + .28*throb));
  a = mix(a, .55 + .45*throb, tenK * .8);
  d *= 1. + tension*.34*throb;
  col = mix(col, cCalm, relaxed * .8);
  a = mix(a, max(a, .62), relaxed);
  col = mix(col, cBone, uCalm * .12 * (1. - on));
  // Haut: Glas (verspannte Stellen bleiben sichtbar), Kopf frei für das Gehirn (nur der Umriss bleibt), Lupe
  float hide = isSkin * max(max(glass * (1. - tenK*.6) * (1. - rim*.85), aN.y * brainK * (1. - smoothstep(.5, .95, rim))), lens * (1. - rim*.55));
  a *= 1. - hide;
  // B1 Scan-Ring: wo die Linie die Haut schneidet (nur während die Linie durch den Körper läuft)
  float band = exp(-pow((by - uTip) / 1.15, 2.)) * uKino * isSkin * step(14., uTip) * (1. - step(418., uTip)) * uNerve;
  col = mix(col, mix(cLine, cWarm, .35), band * .9);
  a = max(a, band * .95);
  d *= 1. + band * .35;

  // ---------- Knochen (A3, B1) ----------
  float boneShow = mix(stK * .8, scanned * mix(.62, .34, uEnd) + stK * .3, uKino);
  boneShow = max(boneShow, lens * .95) * uNerve;
  vec3 cb = mix(cBone * .5, cBone, .25 + .75*rim);
  cb = mix(cb, cBone * (.4 + .5*key) + cKey * pow(key, 3.) * .35 + cRim * back * .8, uKino);
  col = mix(col, cb, isBone);
  // Schädel tritt zurück, solange das Gehirn zu sehen ist (Station Kopf), Rippen und Hände etwas leiser
  float soft = aN.w > 1.5 ? 1. - .78 * brainK * (1. - smoothstep(60., 120., uTip)) * (1. - uEnd * .4) : mix(1., .62, aN.w);
  a = mix(a, (.34 + .52*rim) * boneShow * soft * mix(coarse, 1., fineK), isBone);
  d = mix(d, uSpB * .46 * mix(1., mix(1.5, 1., fineK), coarse), isBone);

  // ---------- Muskeln (A4): zeigen sich mit ihrer Spannung (Bernstein) bzw. gelöst (Blau), sonst nur unter der Lupe ----------
  float musShow = max(smoothstep(.04, .4, tension + relaxed*.7) * (.38 + .62*act), lens * .55) * uNerve;
  vec3 cm = mix(cDeep * 1.2, cAmber, tenK * (.72 + .28*throb));
  cm = mix(cm, cCalm, relaxed * .85);
  col = mix(col, cm, isMus);
  a = mix(a, musShow * (.4 + .45*rim + tenK*.2), isMus);
  d = mix(d, uSp * .42 * (1. + tension*.3*throb), isMus);

  // ---------- Gehirn und Nerven: erscheinen mit der Lichtspitze, vorn an der Spitze heller ----------
  float rev = smoothstep(aN.y - 1.2, aN.y + 1.2, uTip);
  float front2 = rev * (1. - smoothstep(2., 18., uTip - aN.y));
  float wave = pow(.5 + .5*sin(uTime*.7 + aPos.x*.42 - aPos.y*.3 + sin(aPos.y*.9)*1.3), 8.) * uPulse;
  vec3 cbr = mix(cLine, cWarm, .35 + .5*rim);
  cbr = mix(cbr, vec3(1., .97, .9), clamp(front2*.55 + wave*.7, 0., 1.));
  cbr = mix(cbr, cbr * (.55 + .6*key) + cRim * back * .5, uKino * .7);
  col = mix(col, cbr, isBrain);
  // Gehirn: die Ränder der Windungen tragen das Bild (Kantenlicht), die Flächen bleiben leise – sonst wird es ein weißer Fleck
  a = mix(a, rev * (.09 + .55*pow(rim, 1.4) + .1*aN.w + wave*.3) * (1. - .25*smoothstep(70., 210., uTip)) * uNerve, isBrain);
  d = mix(d, .34, isBrain);
  float ph = fract(aN.z/170. - uTime*.16);
  float pulse = pow(ph, 9.) * uPulse;
  col = mix(col, mix(cLine, cWarm, clamp(front2*.8 + pulse, 0., 1.)), isNerve);
  a = mix(a, rev * (.6 + .2*aN.w) * (1. + pulse*.8 + front2*.5) * uNerve * (1. + lens*.5), isNerve);
  d = mix(d, (.34 + .1*aN.w) * (1. + pulse*.45 + front2*.3), isNerve);

  // Zeiger: Stufe 1 wie heute (größer, warmweiß); in Stufe 2 übernimmt die Lupe – dort nur die inneren Schichten heller
  float pv = pk * (1. - hide) * mix(1., rev, isBrain + isNerve) * mix(1., isBone + isNerve + isBrain + isMus, uKino);
  col = mix(col, vec3(1., .95, .86), pv * .7);
  a = a + (1. - a) * pv * .6 * (1. - isMus);
  d *= 1. + pv * .5;
  a *= front;
  float want = d * uUnit, size = max(1.6 * uDpr, want), thin = want / size;
  gl_PointSize = size; vSize = size;
  vCol = col;
  vA = clamp(a, 0., 1.) * thin * thin * li;
}`;
const FRAG = `#version 300 es
precision mediump float;
in vec3 vCol; in float vA; in float vSize; in float vSoft; out vec4 o;
uniform float uAlpha;
void main(){
  float d = length(gl_PointCoord - .5);
  float aa = min(.25, 1.3 / vSize);
  float disc = 1. - smoothstep(.5 - aa, .5, d);
  float a = mix(disc, smoothstep(.5, .0, d), vSoft) * vA * uAlpha;
  if (a < .002) discard;
  o = vec4(vCol * a, a);
}`;

const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);

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
  for (let i = 0; i < n; i++) { const u = gl.getActiveUniform(prog, i); U[u.name.replace(/\[0\]$/, '')] = gl.getUniformLocation(prog, u.name); }
  gl.uniform3fv(U.cDeep, hex(deep || '#44788E')); gl.uniform3fv(U.cBone, hex('#E4E3D8')); gl.uniform3fv(U.cAmber, hex('#E89C30'));
  gl.uniform3fv(U.cCalm, hex('#86BEE6')); gl.uniform3fv(U.cLine, hex('#F0AE50')); gl.uniform3fv(U.cWarm, hex('#FFE6BA'));
  gl.uniform3fv(U.cRim, hex('#7FB4E0')); gl.uniform3fv(U.cKey, hex('#FFD9A0'));
  const tex = gl.createTexture();
  gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.uniform1i(U.uRelax, 0);
  const upload = () => { gl.bindTexture(gl.TEXTURE_2D, tex); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, relaxCanvas); };
  upload();
  gl.disable(gl.DEPTH_TEST); gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE);
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
      gl.uniform1f(U.uUnit, u.s * u.dpr); gl.uniform1f(U.uSp, u.sp); gl.uniform1f(U.uSpB, u.spB); gl.uniform1f(U.uDpr, u.dpr); gl.uniform1f(U.uZoom, u.zoom);
      gl.uniform4fv(U.uRel, u.rel); gl.uniform4fv(U.uAct, u.act);
      gl.uniform1f(U.uTip, u.tip); gl.uniform1f(U.uPulse, u.pulse); gl.uniform1f(U.uNerve, u.nerve);
      gl.uniform1f(U.uTilt, u.tilt); gl.uniform1f(U.uScroll, u.scroll);
      gl.uniform1f(U.uKino, u.kino); gl.uniform1f(U.uEnd, u.end);
      gl.uniform3fv(U.uStC, u.stc);
      gl.uniform4f(U.uPtr, u.ptr[0], u.ptr[1], u.ptr[2], u.ptr[3]);
      gl.drawArrays(gl.POINTS, 0, count);
    },
  };
}
