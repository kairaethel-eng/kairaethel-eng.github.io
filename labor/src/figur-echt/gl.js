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
in vec4 aTo;            // nur Nerven-Perlen der Fassungen K, M: Ziel im Leitsatz (x, y in Bildpunkten der Bühne), Verzögerung 0…1, Art (0 vergeht · 1 Schrift · 2 Hervorhebung)
uniform float uTxt, uDot, uMarkY; uniform vec3 cT0, cT1; // uTxt: der Leitsatz entsteht (0…1, über die Zeit) · uDot: Punktgröße in der Schrift (Bildpunkte) · uMarkY: Anfang des Rückenmarks · cT0/cT1: Farben der Schrift
uniform vec2 uRes, uAnchor;
uniform vec4 uView;   // Blickpunkt x, y (Grundriss, Körpermitte = 0, y oben), Maßstab px/Einheit, Drehung (Wiegen)
uniform float uTime, uBreath, uCalm, uIntro, uUnit, uSp, uSpB, uDpr, uZoom, uTip, uPulse, uNerve, uTilt, uScroll, uKino, uEnd;
uniform float uQuiet, uLight, uGround, uScanIn, uInner, uHalf, uLens, uDense, uGlass, uAreaK, uHirn, uShell, uLobe, uAreaI, uSpH, uNs; uniform vec4 uArea, uBC; // uNs: Schlussbild „Nervensystem“ (Fassungen K, M): Körper wird Glas, Gehirn, Rückenmark und Nerven stehen im Licht // uBC: Mitte und Radius des Gehirns (Fassung K) · uAreaI: Station · uSpH: Punktabstand im Gehirn // Fassung K: Areal im Gehirn (Mitte, Radius) leuchtet // uGlass: wie durchsichtig die Haut über dem Innenleben wird (e–g 0,9 · i 0,62: das Relief bleibt als Hülle) // e–g (25.11. morgens, Kai: „innere Strukturen zu wenig sichtbar“): Innenleben dauerhaft (ganz / halbe Seite), Lupe auch ohne Filmlicht // Vergleich Startfigur (25.11.2026, ?start=b|c|d): Muskeln nur an der aktiven Stelle · Tiefe im Rumpf · Boden · Scan-Linie beim Auftritt
uniform vec4 uRel, uAct;
uniform vec4 uPtr;
uniform vec3 uStC[4];  // Stationen: Mitte x, y (Körpermitte = 0, y oben), Radius
uniform sampler2D uRelax;
uniform vec3 cDeep, cBone, cAmber, cCalm, cLine, cWarm, cRim, cKey;
out vec3 vCol; out float vA; out float vSize; out float vSoft; out float vOp;
float pick(vec4 v, float i){ return i < .5 ? v.x : i < 1.5 ? v.y : i < 2.5 ? v.z : v.w; }
// Farbe je Hirnlappen (Fassung K): Stirn Blau · Zentralregion Grün · Schläfe Bernstein · Scheitel Türkis · Hinterhaupt Sand · Kleinhirn Violettblau · Stamm und Innenfläche hell
vec3 lobeCol(float lb){ return lb < .5 ? vec3(.36, .66, .93) : lb < 1.5 ? vec3(.62, .84, .42) : lb < 2.5 ? vec3(.96, .68, .28) : lb < 3.5 ? vec3(.32, .74, .78) : lb < 4.5 ? vec3(.93, .86, .7) : lb < 5.5 ? vec3(.5, .62, .95) : lb < 6.5 ? vec3(.9, .88, .82) : vec3(.55, .7, .8); }
void main(){
  float kind = aN.x;
  vSoft = 0.; vOp = 1.;
  if (kind > 3.5 && kind < 4.5) { // Raum: große unscharfe Punkte, wandern mit dem Scrollen (nah = schneller) und treiben langsam
    float dep = aN.y;
    vec2 q = aPos.xy;
    q.y = fract(q.y - uScroll * .11 * dep + sin(uTime * .05 + aRand.x * 6.283) * .02);
    q.x += sin(uTime * .04 + aRand.y * 6.283) * .02;
    vec2 s = (q * 1.2 - .1) * uRes;
    gl_Position = vec4(s.x / uRes.x * 2. - 1., 1. - s.y / uRes.y * 2., -1., 1.);
    float size = uDpr * (14. + 44. * aN.w * dep) * clamp(uRes.y / 900., .8, 1.5);
    gl_PointSize = size; vSize = size; vSoft = 1.;
    vCol = mix(cBone, mix(cAmber, cRim, uKino * .6), step(.72, aN.z) * .7);
    vA = (.022 + .05 * (1. - dep)) * uIntro * (.7 + .3 * sin(uTime * .21 + aRand.z * 6.283));
    return;
  }
  if (kind > 6.5 && kind < 7.5) { // Boden (nur ?start=c|d): geordnete Ringe unter den Füßen, drehen und neigen sich mit der Figur
    float cg = cos(uView.w), sg = sin(uView.w);
    vec2 g = vec2(cg*aPos.x + sg*aPos.z, aPos.y - (-sg*aPos.x + cg*aPos.z) * max(uTilt, .16));
    vec2 sG = uAnchor + vec2(g.x - uView.x, -(g.y - uView.y)) * uView.z;
    gl_Position = vec4(sG.x/uRes.x*2. - 1., 1. - sG.y/uRes.y*2., 0., 1.);
    float wantG = uSp * .5 * uUnit, sizeG = max(1.6 * uDpr, wantG), thinG = wantG / sizeG;
    gl_PointSize = sizeG; vSize = sizeG;
    vCol = mix(cDeep, cBone, .45 + .35 * aN.z);
    vA = uGround * aN.y * thinG * thinG * smoothstep(.72, 1., uIntro) * (1. - smoothstep(1.25, 1.9, uZoom));
    if (vA < .004) gl_Position = vec4(2., 2., 2., 1.);
    return;
  }
  if (kind > 8.5) { // Gehirn-Bühne (Fassung K): 9 Leuchten · 10 Signal-Bögen · 11 Lichthof – erst, wenn der Blick im Gehirn angekommen ist
    float cg = cos(uView.w), sg = sin(uView.w);
    vec3 q = vec3(cg*aPos.x + sg*aPos.z, aPos.y - aPos.z * uTilt, -sg*aPos.x + cg*aPos.z);
    vec2 sQ = uAnchor + vec2(q.x - uView.x, -(q.y - uView.y)) * uView.z;
    float show = smoothstep(.9, 1., uHirn) * uNerve, zN = clamp(-q.z / 90., -.98, .98);
    // 25.11.2026 abends (Kai: „das optische Pulsieren reduzieren oder rausnehmen“): kein Feuern, keine Wellen – das Leuchten steht ruhig
    // über dem aktiven Areal, auf den Bögen gleitet nur noch ein weiches Licht langsam entlang (keine Größenänderung)
    float sizeQ = 1., aQ = 0.; vec3 cQ = vec3(1.);
    if (kind < 9.5) {
      float lb = aC.x, on = (1. - step(.5, abs(lb - uLobe))) * uAreaK;
      float fc = clamp(-sg*aNrm.x + cg*aNrm.z + aNrm.y * uTilt, 0., 1.);
      sizeQ = uUnit * 2.6; vSoft = 1.; zN -= .02;
      cQ = lobeCol(lb);
      aQ = show * smoothstep(.05, .5, fc) * on * .05;
    } else if (kind < 10.5) {
      float t = aN.z, on = (1. - step(.5, abs(aN.y - uAreaI))) * uAreaK;
      float f = fract(t - uTime * .06 - aN.w), pl = pow(f, 5.) * uPulse;
      sizeQ = max(1.4 * uDpr, uUnit * uSpH * .46);
      cQ = mix(lobeCol(uLobe), vec3(1., .96, .88), .25 + .4 * pl);
      aQ = show * on * (.2 + .34 * pl) * pow(sin(3.14159 * t), .6);
    } else {
      sizeQ = min(1000., aN.y * 3.4 * uUnit); vSoft = 1.; zN = .97;
      cQ = mix(cDeep, lobeCol(uLobe), .55 * uAreaK);
      aQ = smoothstep(.9, 1., max(uHirn, uNs)) * uNerve * (.085 + .035 * uAreaK) * (1. - smoothstep(0., .5, uTxt));
    }
    gl_Position = aQ < .004 ? vec4(2., 2., 2., 1.) : vec4(sQ.x/uRes.x*2. - 1., 1. - sQ.y/uRes.y*2., zN, 1.);
    gl_PointSize = sizeQ; vSize = sizeQ; vCol = cQ; vA = aQ;
    return;
  }
  vec3 p = aPos;
  float isSkin = 1. - step(.5, kind);
  float isBrain = step(1.5, kind) * (1. - step(2.5, kind));
  float isNerve = step(2.5, kind) * (1. - step(3.5, kind));
  float isBone = step(4.5, kind) * (1. - step(5.5, kind));
  float isMus = step(5.5, kind) * (1. - step(6.5, kind));
  float isShell = step(7.5, kind) * (1. - step(8.5, kind));                  // Fassung L: Hülle der oberflächlichen Muskeln
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
  float flex = isSkin + isMus + isShell;
  p.xy = mix(p.xy, c, tension*aHeat*.09*flex);       // verspannt: das Raster zieht sich zusammen – geordnet, ohne Zittern
  p.xy += (p.xy - c) * relaxed * .045 * flex;         // gelöst: weit
  vec2 dp = p.xy - uPtr.xy;
  { float kK = step(.001, uArea.w), c0 = cos(uView.w), s0 = sin(uView.w); // Fassung K: das Gehirn ist gedreht – Zeiger am gedrehten Ort messen
    dp = mix(dp, vec2(c0*p.x + s0*p.z, p.y - (-s0*p.x + c0*p.z) * uTilt) - uPtr.xy, kK); }
  float pk = uPtr.w * exp(-dot(dp, dp) / (uPtr.z * uPtr.z));
  p.xy += dp * pk * .13 * (1. - uKino * .7);
  // Fassungen K, M (Kai 25.11. nachts: „dezent lebendig“): die Nerven wiegen sich ganz leise wie in einer ruhigen Strömung. Ein Feld über
  // den Raum – was am selben Ort liegt, bewegt sich gleich (Äste bleiben an ihrer Bahn); am Rückenmark null, nach außen bis 1,2 Einheiten.
  { float far = smoothstep(2., 46., length(vec2(aPos.x, (aPos.z + 9.) * .6)));
    p += vec3(sin(uTime*.62 + aPos.y*.045 + aPos.z*.05), sin(uTime*.5 + aPos.x*.05) * .5, cos(uTime*.55 + aPos.y*.04 - aPos.x*.045)) * far * 1.2 * uPulse * uNs * isNerve * step(.001, uArea.w); }
  float z = p.z;
  float cw = cos(uView.w), sw = sin(uView.w);
  p = vec3(cw*p.x + sw*z, p.y - z * uTilt, -sw*p.x + cw*z);
  float hgt = by / 430.;
  float li = clamp(uIntro * 1.7 - hgt * .7, 0., 1.); li = li * li * (3. - 2. * li);
  vec3 dir = aRand.xyz - .5;
  p.xy += dir.xy * (1. - li) * (1. - li) * (70. + aRand.w * 90.);
  float hv = max(uHirn, uNs), kK = step(.001, uArea.w); // hv: das Gehirn ist zu sehen (im Gehirn-Blick oder im Schlussbild Nervensystem) · kK: Fassung mit feinem Gehirn
  { float sc2 = 1. - smoothstep(.1, 1., hv); // Fassung K: das Gehirn sammelt sich bei der Ankunft aus feinem Staub
    p.xy += dir.xy * isBrain * step(.001, uArea.w) * sc2 * sc2 * (10. + aRand.w * 16.); }
  vec2 s = uAnchor + vec2(p.x - uView.x, -(p.y - uView.y)) * uView.z;
  // Fassungen K, M (Kai 25.11. nachts: „dann mit einer tollen Animation den Leitspruch bildet“): die Nerven-Perlen lösen sich von oben nach
  // unten aus dem Körper und schreiben den Leitsatz, in Lesereihenfolge gestaffelt (aTo.z). Sie fließen in drei Strömen wie Bänder
  // (Vorgriff auf Kapitel 02): unterwegs feiner Staub, am Ziel ein Punkt der Schrift. fe = Weg dieser Perle 0…1.
  float fe = 0., zf = clamp(-p.z / 90., -.98, .98);
  if (isNerve * kK > .5 && uTxt > 0.) {
    float e0 = clamp(uTxt * 2.2 - aTo.z * 1.2, 0., 1.);
    fe = e0 * e0 * e0 * (e0 * (e0 * 6. - 15.) + 10.);
    vec2 dl = aTo.xy - s; float len = length(dl), band = floor(aRand.x * 3.) - 1., env = sin(3.14159 * fe);
    vec2 qn = vec2(-dl.y, dl.x) / max(len, 1.);
    s = mix(s, aTo.xy, fe) + qn * env * len * (band * .075 + sin(fe * 8. + band * 2.1 - uTime * 1.1) * .022 + (aRand.y - .5) * .012);
    zf = mix(zf, -.98, step(.001, fe));
  }
  gl_Position = vec4(s.x/uRes.x*2. - 1., 1. - s.y/uRes.y*2., zf, 1.);

  // Licht: Normale nach dem Wiegen; zum Betrachter = facing; Rückseiten verschwinden weich
  vec3 n = aNrm * (1. - isNerve); // Nerven-Perlen tragen in aNrm die Richtung ihrer Bahn (K, M), keine Flächen-Normale
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
  float im = uInner * mix(1., smoothstep(-2.5, 2.5, aPos.x), uHalf); // Innenleben: ganzer Körper oder (uHalf) nur die vom Betrachter rechte Seite
  float glass = max(mix(glass1, glass2, uKino), im * uGlass) * uNerve;
  float lens = pk * max(uKino, uLens);                         // B4 Röntgen-Lupe
  float brainK = max(smoothstep(12., 30., uTip), im) * uNerve;

  // ---------- Haut (und Grundwerte) ----------
  vec3 col = mix(cDeep, cBone, .2 + .8*rim);
  float a = .44 + .56*rim;
  vec3 film = cDeep * (.42 + .62*key) + cKey * pow(key, 3.) * .5 + cRim * back * 1.05 + cWarm * pool * key * .2;
  float filmA = .26 + .5*key + .62*back + pool * .08;
  filmA = mix(filmA, .1 + .78 * pow(key, 1.3) + .7 * back + pool * .08, uDense); // feines Relief: mehr Gefälle zwischen Licht und Schatten → Form lesbar
  { float lk = max(uKino, uLight); col = mix(col, film, lk); a = mix(a, filmA, lk); }
  // Material der Muskelfigur (L, M – 25.11.2026 abends, Kai: „dunkle Stellen noch mehr verbessern, Konturen deutlicher“): Grundhelligkeit
  // überall, Form über das Licht von links oben und die Aufhellung von rechts; die Kontur kommt aus den Rinnen zwischen den Muskeln
  // (aN.z, aus den Daten gerechnet) und aus einer klaren Lichtkante am Umriss. Kopf, Hände, Füße (Haut ohne Muskel darunter) im selben Material.
  vec3 Hh = normalize(L + vec3(0., 0., 1.));
  float spec = pow(max(0., dot(nv, Hh)), 22.) * hasN;                        // feiner Glanz auf den Muskelbäuchen
  float dpt = clamp(.5 + p.z / 60., 0., 1.);                                 // vorn heller, hinten leiser → Körper
  float fl = max(0., dot(nv, normalize(vec3(.62, .2, .76)))) * hasN;         // Aufhellung von rechts vorn
  float edge = smoothstep(.6, .96, 1. - clamp(facing, 0., 1.)) * hasN;       // Umriss als klare Kante
  float gro = smoothstep(.16, .72, aN.z) * isShell;                          // Rinne zwischen zwei Muskeln
  float bo = max(0., -nv.y) * hasN;                                          // Licht von unten (Boden): Flächen, die nach unten zeigen (Gesicht unter der Stirn, Kinn, Brustunterseite), bleiben hell
  vec3 cs = mix(cDeep, cBone, .36) * (.78 + .36*key + .2*fl + .3*bo) + cKey * (pow(key, 3.) * .4 + spec * .6) + cRim * (back * .7 + edge * .5);
  // Punkte leuchten additiv: eine schräg gesehene Fläche zeigt mehr Punkte je Bildfläche und wäre heller als eine, die uns ansieht
  // (Gesicht, Bauch, Oberschenkel blieben dunkel). dn gleicht das aus – die Helligkeit kommt nur noch aus dem Licht, der Umriss extra.
  float dn = pow(clamp(facing, .2, 1.), .85);
  float aS = ((.6 + .34 * pow(key, 1.2) + .28 * fl + .3 * spec + .3 * bo) * dn + .22 * back + .36 * edge) * mix(.84, 1., dpt) * (1. - .52 * gro);
  float covT = isSkin * step(7.5, aN.w);                                     // Haut über einer Lücke der Muskeln (Leiste, Knie, Schienbein): füllt im selben Material
  { float wS0 = mod(aN.w, 4.), sk2 = max(isSkin * uShell * (1. - step(3.5, aN.w)) * step(.5, wS0) * (1. - step(1.5, wS0)), covT * uShell);
    col = mix(col, cs, sk2); a = mix(a, aS, sk2); }
  // Flächen, die uns ansehen (Bauch, Gesicht, Brust, Oberschenkel vorn), zeigen am wenigsten Punkte je Bildfläche: dort größere Punkte,
  // damit sie so dicht stehen wie an den schrägen Flächen – sonst blieben genau diese Stellen dunkler als der Rest.
  // Höchstens 1,15: die Punkte bleiben unter 0,8 des Abstands (Regel: Punkte einer Fläche überlagern sich nicht).
  float dF = mix(1., 1.15, smoothstep(.45, .95, facing) * uShell);
  float fineK = max(max(smoothstep(1.2, 1.9, uZoom), smoothstep(.08, .6, pk)), uDense), coarse = mix(1., aN.z, isSkin + isBone);
  a *= mix(coarse, 1., fineK);
  float wS = mod(aN.w, 4.), cov = isSkin * step(3.5, aN.w); // + 4: unter dieser Haut liegt Muskel-Hülle
  float isDet = isSkin * step(.5, wS) * (1. - step(1.5, wS)), isRep = isSkin * step(1.5, wS); // Hände/Füße: feines Raster (nur mit uDense) ersetzt dort das normale
  a *= mix(1., uDense, isDet) * mix(1., 1. - uDense, isRep);
  float d = uSp * .5 * mix(1., mix(1.85, 1., fineK), coarse * isSkin) * mix(1., .74 * dF, isDet);
  float tenK = smoothstep(.06, .62, tension) * (1. - uHirn) * mix(1., smoothstep(.05, .6, act), uShell); // L: Spannung zeigt sich erst an der aktiven Stelle
  col = mix(col, cAmber, tenK * (.72 + .28*throb));
  a = mix(a, .55 + .45*throb, tenK * .8);
  d *= 1. + tension*.34*throb;
  col = mix(col, cCalm, relaxed * .8);
  a = mix(a, max(a, .62), relaxed);
  col = mix(col, cBone, uCalm * .12 * (1. - on));
  // Haut: Glas (verspannte Stellen bleiben sichtbar), Kopf frei für das Gehirn (nur der Umriss bleibt), Lupe
  float hide = isSkin * max(max(glass * (1. - tenK*.6*(1. - im*.75)) * (1. - rim*.85), aN.y * brainK * (1. - smoothstep(.5, .95, rim) * (1. - im*.7))), lens * (1. - rim*.55));
  a *= (1. - hide) * (1. - mix(.97, 1., kK) * uHirn * isSkin);
  a *= 1. - uShell * cov * mix(.8 - .22 * smoothstep(.55, .95, rim), .42, covT); // L: über den Muskeln tritt die Haut zurück, füllt aber weiter leise (keine dunklen Löcher) // L: über den Muskeln bleibt von der Haut nur der Umriss // Fassung K: im Gehirn tritt die Haut fast ganz zurück
  // B1 Scan-Ring: wo die Linie die Haut schneidet (nur während die Linie durch den Körper läuft)
  float band = exp(-pow((by - uTip) / 1.15, 2.)) * uKino * isSkin * step(14., uTip) * (1. - step(418., uTip)) * uNerve;
  col = mix(col, mix(cLine, cWarm, .35), band * .9);
  a = max(a, band * .95);
  d *= 1. + band * .35;

  // Auftritt mit Scan-Linie (nur ?start=d): eine feine Bernstein-Linie läuft beim Aufbau von Kopf bis Fuß
  { float hf = (uIntro * 1.7 - .5) / .7, b2 = exp(-pow((hgt - hf) / .011, 2.)) * uScanIn * isSkin * step(uIntro, .995);
    col = mix(col, mix(cLine, cWarm, .35), b2 * .9); a = max(a, b2); d *= 1. + b2 * .35; }

  // ---------- Knochen (A3, B1) ----------
  float boneShow = mix(stK * .8, scanned * mix(.62, .34, uEnd) + stK * .3, uKino);
  boneShow = max(max(boneShow, im * .8), lens * .95) * uNerve;
  vec3 cb = mix(cBone * .5, cBone, .25 + .75*rim);
  cb = mix(cb, cBone * (.4 + .5*key) + cKey * pow(key, 3.) * .35 + cRim * back * .8, uKino);
  col = mix(col, cb, isBone);
  // Schädel tritt zurück, solange das Gehirn zu sehen ist (Station Kopf), Rippen und Hände etwas leiser
  float soft = aN.w > 1.5 ? 1. - .78 * brainK * (1. - smoothstep(60., 120., uTip)) * (1. - uEnd * .4) : mix(1., .62, aN.w);
  a = mix(a, mix(.34 + .52*rim, .5 + .5*rim + .25*key, im) * boneShow * mix(soft, max(soft, .8), im * step(aN.w, 1.5)) * mix(coarse, 1., max(fineK, im)), isBone);
  a *= 1. - mix(.94, 1., kK) * uHirn * isBone;
  d = mix(d, uSpB * .46 * mix(1., mix(1.5, 1., fineK), coarse), isBone);

  // ---------- Muskeln (A4): zeigen sich mit ihrer Spannung (Bernstein) bzw. gelöst (Blau), sonst nur unter der Lupe ----------
  float musShowK = 1. - uHirn;
  float musShow = musShowK * max(smoothstep(.04, .4, tension + relaxed*.7) * (.38 + .62*act) * mix(1., act, uQuiet), lens * .55) * uNerve;
  vec3 cm = mix(cDeep * 1.2, cAmber, tenK * (.72 + .28*throb));
  cm = mix(cm, cCalm, relaxed * .85);
  col = mix(col, cm, isMus);
  a = mix(a, musShow * (.4 + .45*rim + tenK*.2), isMus);
  d = mix(d, uSp * .42 * (1. + tension*.3*throb), isMus);

  // ---------- Muskel-Hülle (L): Relief im Filmlicht; an den Stationen und unter der Lupe wird sie zu Glas ----------
  { float hS = max(im * uGlass * (1. - rim * .7), lens * (1. - rim * .4)) * (1. - tenK * .75) * (1. - relaxed * .6);
    vec3 c2 = mix(cs, cAmber, tenK * (.72 + .28*throb));
    c2 = mix(c2, cCalm, relaxed * .8);
    col = mix(col, c2, isShell);
    float a2 = mix(aS * (1. - .75 * aN.y), .55 + .45*throb, tenK * .8); a2 = mix(a2, max(a2, .6), relaxed); // aN.y: Lage liegt hinter einer anderen (figur.js) → tritt zurück
    a = mix(a, uShell * a2 * (1. - hS) * (1. - uHirn), isShell);
    // Punktgröße am Abstand der Hülle bemessen (figur.js: sp · 0,62, begrenzt auf 0,7 … 1,2) – am Handy ist dieser Abstand gedeckelt,
    // mit uSp allein würden sich die Punkte dort überlagern und die Glieder weiß auslaufen.
    d = mix(d, clamp(uSp * .62, .7, 1.2) * .694 * dF * (1. + tension * tenK * .3 * throb), isShell); }

  // ---------- Gehirn und Nerven: erscheinen mit der Lichtspitze, vorn an der Spitze heller ----------
  float rev = max(smoothstep(aN.y - 1.2, aN.y + 1.2, uTip), im);
  float front2 = rev * (1. - smoothstep(2., 18., uTip - aN.y)) * mix(1., uNs, kK); // mit feinem Gehirn steht die Spitze unter dem Stamm – kein Dauerlicht dort
  float wave = pow(.5 + .5*sin(uTime*.7 + aPos.x*.42 - aPos.y*.3 + sin(aPos.y*.9)*1.3), 8.) * uPulse;
  vec3 cbr = mix(cLine, cWarm, .35 + .5*rim);
  cbr = mix(cbr, vec3(1., .97, .9), clamp(front2*.55 + wave*.7, 0., 1.));
  cbr = mix(cbr, cbr * (.55 + .6*key) + cRim * back * .5, uKino * .7);
  float ar = uAreaK * exp(-dot(aPos - uArea.xyz, aPos - uArea.xyz) / (uArea.w * uArea.w));
  cbr = mix(cbr, mix(cAmber, cWarm, .3 + .25*sin(uTime*1.6 - length(aPos - uArea.xyz)*.8)), ar * .9);
  col = mix(col, cbr, isBrain);
  // Gehirn: die Ränder der Windungen tragen das Bild (Kantenlicht), die Flächen bleiben leise – sonst wird es ein weißer Fleck
  a = mix(a, rev * (.09 + .14*im + (.55 + .4*im)*pow(rim, 1.4 - .35*im) + .1*aN.w + wave*.3) * (1. - .25*smoothstep(70., 210., uTip)) * uNerve, isBrain);
  { // Fassungen K und M: das Gehirn als ruhiges, fast echtes Modell (Kai 25.11. abends: „Pulsieren raus, Konturen der Windungen besser
    // definieren, ein digitales fast echtes Modell“): Körper im Licht, Furchen über eine steile Kennlinie klar von den Windungen getrennt,
    // feiner Glanz auf den Kuppen; jeder Hirnlappen in seiner Farbe, das aktive Areal steht ruhig im Licht (keine Wellen, kein Feuern)
    float ao = 1. - aN.z, hk = hv * isBrain, lb = aC.x;
    float klein = 1. - smoothstep(1.1, 2.2, uZoom);                                            // Schlussbild: das Gehirn ist klein – Furchen träten als Flimmern auf
    float cav = mix(smoothstep(.1, .72, ao), 1., klein * .85);
    float on = (1. - step(.5, abs(lb - uLobe))) * uAreaK;
    vec3 lc = lobeCol(lb);
    float fog = mix(.42, 1., smoothstep(-.7, .8, (p.z - (-sw*uBC.x + cw*uBC.z)) / max(1., uBC.w)));   // hinten leiser: Tiefe
    float inn = step(6.5, lb), isSt = step(5.5, lb) * (1. - inn);                              // Innenfläche: zurückhaltend · Stamm und Rückenmark
    fog = mix(fog, 1., isSt * .45);
    float fill = max(0., dot(nv, normalize(vec3(.6, .25, .76)))) * hasN;
    float sp2 = pow(max(0., dot(nv, Hh)), 30.) * hasN * cav;
    float lit = ((.3 + .52 * key + .26 * fill + .22 * rim) * mix(.04, 1., cav) + .28 * back * ao) * fog * (1. - .5 * inn);
    float L1 = clamp(.36 + .74 * (key + .4 * fill) * cav, 0., 1.);
    vec3 tint = mix(mix(cBone, cWarm, .3), lc, mix(.8, 1., on));
    vec3 ch = mix(mix(cDeep * 1.1, lc * .45, .55), tint, L1) + mix(cRim, lc, .6) * back * .4 + vec3(1., .97, .9) * sp2 * .5;
    ch = mix(ch, mix(lc, vec3(1., .97, .9), .45), on * .3 * cav);
    { // Impulse (nur im Blick „Nervensystem“ – im Gehirn-Blick bleibt alles ruhig): Licht läuft das Rückenmark hinunter (warm) und leiser
      // wieder hinauf (kühl), im selben Takt wie auf den Nerven – dort tritt es an jeder Wurzel aus und kommt dort wieder an
      float wC = (uMarkY - aPos.y) * 1.03, kC = uPulse * uNs * isSt;
      float pO = fract(wC / 150. - uTime * .3), sO = pow(pO, 10.) * smoothstep(1., .975, pO) * kC;
      float pI = fract(-wC / 190. - uTime * .13 + .4), sI = pow(pI, 6.) * smoothstep(1., .96, pI) * kC * .45;
      ch = mix(ch, vec3(1., .92, .72), min(1., sO)); ch = mix(ch, vec3(.72, .9, 1.), min(1., sI * 1.4));
      ch *= 1. - .18 * kC + .9 * sO + .6 * sI; }
    col = mix(col, ch, hk);
    a = mix(a, min(1., a * (1. + ar * 2.2) + ar * .3), isBrain * (1. - hv));
    a = mix(a, min(1., (lit + sp2 * .3) * mix(1., .7, uAreaK * (1. - on) * (1. - isSt)) * (1. + on * .22) * (1. + .45 * klein)) * rev * uNerve, hk); // aktiver Lappen: über die Farbe heller, nicht über die Deckkraft (sonst geht die Form verloren)
    { float as = smoothstep(.1, 1., hv); a *= mix(1., .12 + .88 * as * as, isBrain * kK); } // im Staub leise, sonst weißer Fleck
    ar = mix(ar, on * .5, hv); }
  d = mix(d, (.34 + .08*im) * (1. + ar * .3) * mix(1., .78, step(.001, uArea.w)), isBrain);
  d = mix(d, uSpH * .92 * (1. + ar * .1), isBrain * kK * smoothstep(.3, 1., hv)); // im Gehirn-Blick: dichte Punkte (0,92 des Abstands), die Fläche schließt sich zum Körper
  float ph = fract(aN.z/170. - uTime*.16);
  float nsk = uPulse * uNs * kK * (1. - smoothstep(0., .15, fe)); // im Flug zum Leitsatz keine Impulse mehr (sonst funkelt der Staub)
  float pulse = pow(ph, 9.) * uPulse * (1. - uNs * kK);
  // K, M im Blick „Nervensystem“ (Kai 25.11. 23:07: „Nerven ab Rückenmark dezent lebendig, pulsierend zum Beispiel“): Impulse laufen vom
  // Gehirn das Rückenmark hinunter und treten an jeder Wurzel in den Ast hinaus (warm, heller Kopf, weicher Schweif, die Perlen schwellen
  // dabei kurz an) – an den Rippen läuft das als Welle von oben nach unten. Leiser und kühler kommen Empfindungen von außen zurück.
  // Damit die Impulse zu sehen sind, tritt die Grundhelligkeit der Nerven etwas zurück (die Deckkraft ist dort schon am Anschlag).
  float phO = fract(aN.z / 150. - uTime * .3), sigO = pow(phO, 10.) * smoothstep(1., .975, phO) * nsk;
  float phI = fract(-aN.z / 190. - uTime * .13 + .4), sigI = pow(phI, 6.) * smoothstep(1., .96, phI) * nsk * .45;
  vec3 cn = mix(cLine, cWarm, clamp(front2*.8 + pulse, 0., 1.));
  cn = mix(cn, vec3(1., .92, .72), min(1., sigO)); cn = mix(cn, vec3(.72, .9, 1.), min(1., sigI * 1.4));
  cn *= 1. - .22 * nsk + 1. * sigO + .7 * sigI;
  col = mix(col, cn, isNerve);
  // mit feinem Gehirn: die Nerven erscheinen zusammen mit Gehirn und Rückenmark und bleiben im Gehirn-Blick stehen (laufen unter dem Stamm weiter)
  a = mix(a, rev * (.6 + .2*aN.w) * (1. + pulse*.8*(1. - .7*hv) + front2*.5 + (sigO + sigI)*.7) * uNerve * (1. + lens*.5) * mix(1. - .97 * uHirn, smoothstep(.05, .8, hv), kK) * (1. + .5 * uNs), isNerve);
  d = mix(d, (.34 + .1*aN.w) * (1. + pulse*.45*(1. - hv) + front2*.3 + sigO*.45 + sigI*.3) * mix(1., .8, uHirn * kK), isNerve); // im Gehirn-Blick feine Stränge
  // K, M im Profil: eine Bahn, die genau auf den Betrachter zuläuft (Ischias-Wurzel quer durchs Becken), stünde als heller Balken da –
  // ihre Perlen liegen dann alle hintereinander. Je steiler die Bahn zur Bildebene steht, desto leiser.
  { vec3 tn = aNrm * isNerve; float tz = -sw*tn.x + cw*tn.z + tn.y * uTilt;
    a *= mix(1., mix(.22, 1., smoothstep(.15, .62, sqrt(max(0., 1. - tz*tz)))), step(.01, dot(tn, tn))); }

  // Schlussbild „Nervensystem“ (K, M): Haut und Muskeln werden zu Glas – es bleibt der Umriss als Lichtkante
  a *= mix(1., (.07 + .5 * edge) * (1. - .45 * smoothstep(0., .6, uTxt)), uNs * (isSkin + isShell)); // die Nerven haben den Körper verlassen: der Umriss bleibt leise stehen
  // Zeiger: Stufe 1 wie heute (größer, warmweiß); in Stufe 2 übernimmt die Lupe – dort nur die inneren Schichten heller
  float pv = pk * (1. - hide) * mix(1., rev, isBrain + isNerve) * mix(1., isBone + isNerve + isBrain + isMus, uKino);
  col = mix(col, vec3(1., .95, .86), pv * .7);
  a = a + (1. - a) * pv * .6 * (1. - isMus);
  d *= 1. + pv * .5;
  // Rand der Lupe (e–g): feiner heller Ring auf der Haut, damit man am Handy sieht, wo sie steht (über dem Finger)
  { float lr = exp(-pow((length(dp) - uPtr.z * 1.25) / (uPtr.z * .09), 2.)) * uPtr.w * uLens * isSkin;
    col = mix(col, cWarm, lr * .8); a = max(a, lr * .8); }
  // Perle im Flug zum Leitsatz: Farbe und Deckkraft (beim Ablösen leise – sonst blitzt es dort, wo viele Bahnen dicht liegen –, unterwegs
  // höchstens 55 %, am Ziel Punkt der Schrift; überzählige vergehen)
  { float on = step(.5, aTo.w), k0 = smoothstep(0., .18, fe), k1 = smoothstep(.72, 1., fe);
    col = mix(col, mix(cT0, cT1, step(1.5, aTo.w)), smoothstep(.45, 1., fe) * on);
    a = mix(a, mix(.22 + .33 * smoothstep(.1, .5, fe), on * .95, k1), k0); }
  a *= front;
  float want = d * uUnit;
  want = mix(want, mix(1.5, uDot, smoothstep(.75, 1., fe)) * uDpr, smoothstep(0., .2, fe));
  float size = max(1.6 * uDpr, want), thin = want / size;
  gl_PointSize = size; vSize = size;
  vCol = col;
  vA = clamp(a, 0., 1.) * mix(thin * thin, 1., isBrain * kK) * li; // deckendes Gehirn: auch klein (Schlussbild) in voller Helligkeit – die Tiefe ordnet die Punkte
  // Fassung K: das Gehirn wird deckend gezeichnet (Tiefe), vOp = wie viel davon schon da ist (Auflösen über ein festes Punktmuster)
  vOp = mix(1., front * rev * uNerve * smoothstep(.05, .8, hv) * li * (1. - smoothstep(0., .45, uTxt)), isBrain * kK); // … und lösen sich wieder auf, wenn der Leitsatz entsteht
}`;
const FRAG = `#version 300 es
precision mediump float;
in vec3 vCol; in float vA; in float vSize; in float vSoft; in float vOp; out vec4 o;
uniform float uAlpha, uSolid;
void main(){
  float d = length(gl_PointCoord - .5);
  float aa = min(.25, 1.3 / vSize);
  float disc = 1. - smoothstep(.5 - aa, .5, d);
  if (uSolid > .5) { // Gehirn (Fassung K): deckende Punkte mit Tiefe – was hinten liegt, ist verdeckt; Rand weich gegen den Grund
    if (d > .5) discard;
    float h = fract(sin(dot(floor(gl_FragCoord.xy), vec2(12.9898, 78.233))) * 43758.5453);
    if (vOp < .02 + h * .96) discard;
    vec3 bg = vec3(.0392, .0863, .1059);
    o = vec4(bg + vCol * vA * uAlpha * disc, 1.);
    return;
  }
  float a = mix(disc, smoothstep(.5, .0, d), vSoft) * vA * uAlpha;
  if (a < .002) discard;
  o = vec4(vCol * a, a);
}`;

const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);

export function createStage(gl, pts, relaxCanvas, deep = '#44788E') {
  const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };
  const prog = gl.createProgram();
  gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG));
  gl.bindAttribLocation(prog, 0, 'aPos'); // Platz 0 ist immer belegt (aTo hat nur bei den Nerven-Perlen einen Puffer)
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
  gl.useProgram(prog);
  const vao = gl.createVertexArray(); gl.bindVertexArray(vao);
  const bufs = [];
  const attr = (name, data, size) => {
    const loc = gl.getAttribLocation(prog, name); if (loc < 0) return;
    const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, size, gl.FLOAT, false, 0, 0);
    bufs.push([loc, b, size]);
  };
  attr('aPos', pts.pos, 3); attr('aNrm', pts.nrm, 3); attr('aRand', pts.rnd, 4); attr('aSt', pts.st, 1); attr('aHeat', pts.heat, 1); attr('aC', pts.ctr, 2); attr('aN', pts.nfo, 4);
  const count = pts.count;
  // Fassungen K, M: die Nerven-Perlen (pts.nerv, zusammenhängender Bereich) schreiben am Schluss den Leitsatz. Sie bekommen dafür ein Ziel
  // je Perle (aTo) – ein zweiter Satz von Attributen auf denselben Puffern (mit Versatz) plus ein kleiner eigener Puffer; alle anderen
  // Punkte lesen für aTo den festen Wert 0.
  const NV = pts.hirn && pts.nerv && pts.nerv[1] > pts.nerv[0] ? pts.nerv : null, locTo = gl.getAttribLocation(prog, 'aTo');
  let vaoN = null, toBuf = null;
  if (locTo >= 0) gl.vertexAttrib4f(locTo, 0, 0, 0, 0);
  if (NV && locTo >= 0) {
    vaoN = gl.createVertexArray(); gl.bindVertexArray(vaoN);
    for (const [loc, b, size] of bufs) { gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, size, gl.FLOAT, false, 0, NV[0] * size * 4); }
    toBuf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, toBuf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array((NV[1] - NV[0]) * 4), gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(locTo); gl.vertexAttribPointer(locTo, 4, gl.FLOAT, false, 0, 0);
    gl.bindVertexArray(vao);
  }
  const U = {};
  const n = gl.getProgramParameter(prog, gl.ACTIVE_UNIFORMS);
  for (let i = 0; i < n; i++) { const u = gl.getActiveUniform(prog, i); U[u.name.replace(/\[0\]$/, '')] = gl.getUniformLocation(prog, u.name); }
  gl.uniform3fv(U.cDeep, hex(deep || '#44788E')); gl.uniform3fv(U.cBone, hex('#E4E3D8')); gl.uniform3fv(U.cAmber, hex('#E89C30'));
  gl.uniform3fv(U.cCalm, hex('#86BEE6')); gl.uniform3fv(U.cLine, hex('#F0AE50')); gl.uniform3fv(U.cWarm, hex('#FFE6BA'));
  gl.uniform3fv(U.cRim, hex('#7FB4E0')); gl.uniform3fv(U.cKey, hex('#FFD9A0'));
  gl.uniform3fv(U.cT0, hex('#E4E3D8')); gl.uniform3fv(U.cT1, hex('#E89C30')); gl.uniform1f(U.uDot, 2); gl.uniform1f(U.uMarkY, pts.mark && pts.mark.length ? pts.mark[0][1] : 166);
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
    // Ziele der Nerven-Perlen im Leitsatz: to = je Perle x, y (Bildpunkte der Bühne), Verzögerung, Art; dot = Punktgröße; c0/c1 = Farben [r, g, b]
    nerven: NV ? NV[1] - NV[0] : 0,
    setTargets(to, dot, c0, c1) { if (!toBuf) return; gl.bindBuffer(gl.ARRAY_BUFFER, toBuf); gl.bufferSubData(gl.ARRAY_BUFFER, 0, to); gl.uniform1f(U.uDot, dot); if (c0) gl.uniform3fv(U.cT0, c0); if (c1) gl.uniform3fv(U.cT1, c1); },
    draw(u) {
      gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.uniform2f(U.uRes, u.W, u.H); gl.uniform2f(U.uAnchor, u.ax, u.ay);
      gl.uniform4f(U.uView, u.fx, u.fy, u.s, u.sway);
      gl.uniform1f(U.uTime, u.time); gl.uniform1f(U.uBreath, u.breath); gl.uniform1f(U.uCalm, u.calm);
      gl.uniform1f(U.uIntro, u.intro); gl.uniform1f(U.uAlpha, u.alpha);
      gl.uniform1f(U.uUnit, u.s * u.dpr); gl.uniform1f(U.uSp, u.sp); gl.uniform1f(U.uSpB, u.spB); gl.uniform1f(U.uDpr, u.dpr); gl.uniform1f(U.uZoom, u.zoom);
      gl.uniform4fv(U.uRel, u.rel); gl.uniform4fv(U.uAct, u.act);
      gl.uniform1f(U.uTip, u.tip); gl.uniform1f(U.uPulse, u.pulse); gl.uniform1f(U.uNerve, u.nerve);
      gl.uniform1f(U.uTilt, u.tilt); gl.uniform1f(U.uScroll, u.scroll);
      gl.uniform1f(U.uKino, u.kino); gl.uniform1f(U.uEnd, u.end);
      gl.uniform1f(U.uQuiet, u.quiet || 0); gl.uniform1f(U.uLight, u.light || 0); gl.uniform1f(U.uGround, u.ground || 0); gl.uniform1f(U.uScanIn, u.scanIn || 0); gl.uniform1f(U.uInner, u.inner || 0); gl.uniform1f(U.uHalf, u.half || 0); gl.uniform1f(U.uLens, u.lens || 0); gl.uniform1f(U.uDense, u.dense || 0); gl.uniform1f(U.uGlass, u.glass || 0.9); gl.uniform1f(U.uAreaK, u.areaK || 0); gl.uniform1f(U.uHirn, u.hirn || 0); gl.uniform1f(U.uShell, u.shell || 0); gl.uniform1f(U.uNs, u.ns || 0); gl.uniform1f(U.uLobe, u.lobe == null ? -1 : u.lobe); gl.uniform1f(U.uAreaI, u.areaI == null ? -1 : u.areaI); gl.uniform1f(U.uSpH, (pts.hirn && pts.hirn.sp) || 0.42); { const B = pts.hirn ? [...pts.hirn.c, pts.hirn.r] : [0, 0, 0, 1]; gl.uniform4f(U.uBC, B[0], B[1], B[2], B[3]); } { const A = u.area || [0, 0, 0, 0]; gl.uniform4f(U.uArea, A[0], A[1], A[2], A[3]); }
      gl.uniform3fv(U.uStC, u.stc); gl.uniform1f(U.uTxt, u.txt || 0);
      gl.uniform4f(U.uPtr, u.ptr[0], u.ptr[1], u.ptr[2], u.ptr[3]);
      const Hn = u.solid && pts.hirn;
      if (!Hn) { gl.uniform1f(U.uSolid, 0); gl.drawArrays(gl.POINTS, 0, count); return; }
      // Fassung K: erst alles vor dem Gehirn (Haut, Knochen) wie gewohnt, dann das Gehirn deckend mit Tiefe,
      // dann der Rest (Leuchten, Bögen, Lichthof, Nerven, Staub) leuchtend darüber – aber hinter dem Gehirn verdeckt
      gl.uniform1f(U.uSolid, 0); gl.drawArrays(gl.POINTS, 0, Hn.b0);
      gl.enable(gl.DEPTH_TEST); gl.depthFunc(gl.LEQUAL); gl.depthMask(true); gl.disable(gl.BLEND);
      gl.uniform1f(U.uSolid, 1); gl.drawArrays(gl.POINTS, Hn.b0, Hn.b1 - Hn.b0);
      gl.enable(gl.BLEND); gl.depthMask(false); gl.uniform1f(U.uSolid, 0);
      if (vaoN) { // Nerven-Perlen mit ihrem Ziel (eigener Satz von Attributen), davor und danach der Rest
        if (NV[0] > Hn.b1) gl.drawArrays(gl.POINTS, Hn.b1, NV[0] - Hn.b1);
        gl.bindVertexArray(vaoN); gl.drawArrays(gl.POINTS, 0, NV[1] - NV[0]); gl.bindVertexArray(vao);
        if (count > NV[1]) gl.drawArrays(gl.POINTS, NV[1], count - NV[1]);
      } else gl.drawArrays(gl.POINTS, Hn.b1, count - Hn.b1);
      gl.depthMask(true); gl.disable(gl.DEPTH_TEST);
    },
  };
}

// Zeichenfläche mit Tiefenpuffer (nur Fassung K – das Gehirn wird deckend gezeichnet); sonst wie ../feinschliff/gl.js glContext
export function glContextTiefe(canvas) {
  const glQ = new URLSearchParams(location.search).get('gl');
  let gl = null;
  try { gl = canvas.getContext('webgl2', { alpha: false, antialias: false, depth: true, stencil: false, premultipliedAlpha: true, powerPreference: 'high-performance', failIfMajorPerformanceCaveat: !glQ }); } catch (e) { /* ohne WebGL 2 */ }
  if (gl && !glQ) try {
    const e = gl.getExtension('WEBGL_debug_renderer_info');
    if (/swiftshader|llvmpipe|softpipe|software|basic render/i.test(String(gl.getParameter(e ? e.UNMASKED_RENDERER_WEBGL : gl.RENDERER)))) { gl.getExtension('WEBGL_lose_context')?.loseContext(); gl = null; }
  } catch (e) { /* Name nicht lesbar: WebGL bleibt an */ }
  return gl;
}
