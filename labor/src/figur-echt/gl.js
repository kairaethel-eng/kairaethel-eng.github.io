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
uniform float uQuiet, uLight, uGround, uScanIn, uInner, uHalf, uLens, uDense, uGlass, uAreaK, uHirn, uShell, uLobe; uniform vec4 uArea; // Fassung K: Areal im Gehirn (Mitte, Radius) leuchtet // uGlass: wie durchsichtig die Haut über dem Innenleben wird (e–g 0,9 · i 0,62: das Relief bleibt als Hülle) // e–g (25.11. morgens, Kai: „innere Strukturen zu wenig sichtbar“): Innenleben dauerhaft (ganz / halbe Seite), Lupe auch ohne Filmlicht // Vergleich Startfigur (25.11.2026, ?start=b|c|d): Muskeln nur an der aktiven Stelle · Tiefe im Rumpf · Boden · Scan-Linie beim Auftritt
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
  vec3 p = aPos;
  float isSkin = 1. - step(.5, kind);
  float isBrain = step(1.5, kind) * (1. - step(2.5, kind));
  float isNerve = step(2.5, kind) * (1. - step(3.5, kind));
  float isBone = step(4.5, kind) * (1. - step(5.5, kind));
  float isMus = step(5.5, kind) * (1. - step(6.5, kind));
  float isShell = step(7.5, kind);                  // Fassung L: Hülle der oberflächlichen Muskeln
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
  float z = p.z;
  float cw = cos(uView.w), sw = sin(uView.w);
  p = vec3(cw*p.x + sw*z, p.y - z * uTilt, -sw*p.x + cw*z);
  float hgt = by / 430.;
  float li = clamp(uIntro * 1.7 - hgt * .7, 0., 1.); li = li * li * (3. - 2. * li);
  vec3 dir = aRand.xyz - .5;
  p.xy += dir.xy * (1. - li) * (1. - li) * (70. + aRand.w * 90.);
  { float sc2 = 1. - smoothstep(.1, 1., uHirn); // Fassung K: das Gehirn sammelt sich bei der Ankunft aus feinem Staub
    p.xy += dir.xy * isBrain * step(.001, uArea.w) * sc2 * sc2 * (10. + aRand.w * 16.); }
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
  float fineK = max(max(smoothstep(1.2, 1.9, uZoom), smoothstep(.08, .6, pk)), uDense), coarse = mix(1., aN.z, isSkin + isBone);
  a *= mix(coarse, 1., fineK);
  float wS = mod(aN.w, 4.), cov = isSkin * step(3.5, aN.w); // + 4: unter dieser Haut liegt Muskel-Hülle
  float isDet = isSkin * step(.5, wS) * (1. - step(1.5, wS)), isRep = isSkin * step(1.5, wS); // Hände/Füße: feines Raster (nur mit uDense) ersetzt dort das normale
  a *= mix(1., uDense, isDet) * mix(1., 1. - uDense, isRep);
  float d = uSp * .5 * mix(1., mix(1.85, 1., fineK), coarse * isSkin) * mix(1., .74, isDet);
  float tenK = smoothstep(.06, .62, tension) * (1. - uHirn) * mix(1., smoothstep(.05, .6, act), uShell); // L: Spannung zeigt sich erst an der aktiven Stelle
  col = mix(col, cAmber, tenK * (.72 + .28*throb));
  a = mix(a, .55 + .45*throb, tenK * .8);
  d *= 1. + tension*.34*throb;
  col = mix(col, cCalm, relaxed * .8);
  a = mix(a, max(a, .62), relaxed);
  col = mix(col, cBone, uCalm * .12 * (1. - on));
  // Haut: Glas (verspannte Stellen bleiben sichtbar), Kopf frei für das Gehirn (nur der Umriss bleibt), Lupe
  float hide = isSkin * max(max(glass * (1. - tenK*.6*(1. - im*.75)) * (1. - rim*.85), aN.y * brainK * (1. - smoothstep(.5, .95, rim) * (1. - im*.7))), lens * (1. - rim*.55));
  a *= (1. - hide) * (1. - .97 * uHirn * isSkin);
  a *= 1. - uShell * cov * (.78 - .4 * smoothstep(.55, .95, rim)); // L: über den Muskeln tritt die Haut zurück, füllt aber weiter leise (keine dunklen Löcher) // L: über den Muskeln bleibt von der Haut nur der Umriss // Fassung K: im Gehirn tritt die Haut fast ganz zurück
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
  a *= 1. - .94 * uHirn * isBone;
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
    vec3 Hh = normalize(L + vec3(0., 0., 1.));
    float spec = pow(max(0., dot(nv, Hh)), 22.) * hasN;                      // feiner Glanz auf den Muskelbäuchen
    float dpt = clamp(.5 + p.z / 60., 0., 1.);                               // vorn heller, hinten leiser → Körper
    vec3 cs = mix(cDeep, cBone, .16) * (.5 + .66*key) + cKey * (pow(key, 3.) * .5 + spec * .6) + cRim * back * .95;
    cs = mix(cs, cAmber, tenK * (.72 + .28*throb));
    cs = mix(cs, cCalm, relaxed * .8);
    col = mix(col, cs, isShell);
    float fl = max(0., dot(nv, normalize(vec3(.62, .2, .76)))) * hasN;        // Aufhellung von rechts vorn: keine dunklen Stellen (Kai 25.11.)
    float aS = (.24 + .6 * pow(key, 1.2) + .3 * fl + .35 * spec + .55 * back) * mix(.72, 1., dpt);
    aS = mix(aS, .55 + .45*throb, tenK * .8); aS = mix(aS, max(aS, .6), relaxed);
    a = mix(a, uShell * aS * (1. - hS), isShell);
    d = mix(d, uSp * .31 * (1. + tension * tenK * .3 * throb), isShell); }

  // ---------- Gehirn und Nerven: erscheinen mit der Lichtspitze, vorn an der Spitze heller ----------
  float rev = max(smoothstep(aN.y - 1.2, aN.y + 1.2, uTip), im);
  float front2 = rev * (1. - smoothstep(2., 18., uTip - aN.y));
  float wave = pow(.5 + .5*sin(uTime*.7 + aPos.x*.42 - aPos.y*.3 + sin(aPos.y*.9)*1.3), 8.) * uPulse;
  vec3 cbr = mix(cLine, cWarm, .35 + .5*rim);
  cbr = mix(cbr, vec3(1., .97, .9), clamp(front2*.55 + wave*.7, 0., 1.));
  cbr = mix(cbr, cbr * (.55 + .6*key) + cRim * back * .5, uKino * .7);
  float ar = uAreaK * exp(-dot(aPos - uArea.xyz, aPos - uArea.xyz) / (uArea.w * uArea.w));
  cbr = mix(cbr, mix(cAmber, cWarm, .3 + .25*sin(uTime*1.6 - length(aPos - uArea.xyz)*.8)), ar * .9);
  col = mix(col, cbr, isBrain);
  // Gehirn: die Ränder der Windungen tragen das Bild (Kantenlicht), die Flächen bleiben leise – sonst wird es ein weißer Fleck
  a = mix(a, rev * (.09 + .14*im + (.55 + .4*im)*pow(rim, 1.4 - .35*im) + .1*aN.w + wave*.3) * (1. - .25*smoothstep(70., 210., uTip)) * uNerve, isBrain);
  { // Fassung K: das Gehirn als eigene Animation – Körper im Licht (Windungen hell, Furchen dunkel), jeder Hirnlappen in seiner Farbe,
    // das aktive Areal leuchtet und sendet ruhige Wellen, einzelne Punkte „feuern“, im Hirnstamm laufen Signale nach unten
    float ao = 1. - aN.z, hk = uHirn * isBrain, lb = aC.x;
    float on = (1. - step(.5, abs(lb - uLobe))) * uAreaK;
    vec3 lc = lb < .5 ? vec3(.36, .66, .93) : lb < 1.5 ? vec3(.62, .84, .42) : lb < 2.5 ? vec3(.96, .68, .28) : lb < 3.5 ? vec3(.32, .74, .78) : lb < 4.5 ? vec3(.93, .86, .7) : lb < 5.5 ? vec3(.5, .62, .95) : vec3(.9, .88, .82);
    float fill = max(0., dot(nv, normalize(vec3(.6, .25, .76)))) * hasN;
    float lit = (.1 + .74 * key + .3 * fill + .26 * rim) * mix(.2, 1., ao * ao) + .3 * back * ao;
    float L1 = clamp(.3 + .8 * (key + .4 * fill) * ao, 0., 1.);
    vec3 tint = mix(mix(cBone, cWarm, .3), lc, mix(.82, 1., on));
    vec3 ch = mix(mix(cDeep * 1.1, lc * .45, .55), tint, L1) + mix(cRim, lc, .6) * back * .4;
    float dA = length(aPos - uArea.xyz);
    float wv = pow(.5 + .5 * sin(uTime * 1.7 - dA * .85), 3.) * uPulse;
    ch = mix(ch, mix(lc, vec3(1., .97, .9), .6), on * (.18 + .5 * wv) * ao);
    float tw = pow(max(0., sin(uTime * (.45 + aRand.x * .8) + aRand.y * 6.283)), 40.) * ao * uPulse; // Feuern
    ch = mix(ch, vec3(1., .97, .9), tw * .8);
    float sg = step(5.5, lb) * pow(fract(aPos.y * .09 + uTime * .45), 7.) * uPulse;                  // Hirnstamm: Signal abwärts
    ch = mix(ch, cWarm, sg * .8);
    col = mix(col, ch, hk);
    a = mix(a, min(1., a * (1. + ar * 2.2) + ar * .3), isBrain * (1. - uHirn));
    a = mix(a, min(1., lit * mix(1., .6, uAreaK * (1. - on)) * (1. + on * (.55 + .5 * wv)) + on * .1 * ao + tw * .5 + sg * .4) * rev * uNerve, hk);
    { float as = smoothstep(.1, 1., uHirn); a *= mix(1., .12 + .88 * as * as, isBrain * step(.001, uArea.w)); } // im Staub leise, sonst weißer Fleck
    ar = mix(ar, on * .5 + tw, uHirn); }
  d = mix(d, (.34 + .08*im) * (1. + ar * .3) * mix(1., .78, step(.001, uArea.w)), isBrain);
  float ph = fract(aN.z/170. - uTime*.16);
  float pulse = pow(ph, 9.) * uPulse;
  col = mix(col, mix(cLine, cWarm, clamp(front2*.8 + pulse, 0., 1.)), isNerve);
  a = mix(a, rev * (.6 + .2*aN.w) * (1. + pulse*.8 + front2*.5) * uNerve * (1. + lens*.5) * (1. - .8 * uHirn), isNerve);
  d = mix(d, (.34 + .1*aN.w) * (1. + pulse*.45 + front2*.3), isNerve);

  // Zeiger: Stufe 1 wie heute (größer, warmweiß); in Stufe 2 übernimmt die Lupe – dort nur die inneren Schichten heller
  float pv = pk * (1. - hide) * mix(1., rev, isBrain + isNerve) * mix(1., isBone + isNerve + isBrain + isMus, uKino);
  col = mix(col, vec3(1., .95, .86), pv * .7);
  a = a + (1. - a) * pv * .6 * (1. - isMus);
  d *= 1. + pv * .5;
  // Rand der Lupe (e–g): feiner heller Ring auf der Haut, damit man am Handy sieht, wo sie steht (über dem Finger)
  { float lr = exp(-pow((length(dp) - uPtr.z * 1.25) / (uPtr.z * .09), 2.)) * uPtr.w * uLens * isSkin;
    col = mix(col, cWarm, lr * .8); a = max(a, lr * .8); }
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
      gl.uniform1f(U.uQuiet, u.quiet || 0); gl.uniform1f(U.uLight, u.light || 0); gl.uniform1f(U.uGround, u.ground || 0); gl.uniform1f(U.uScanIn, u.scanIn || 0); gl.uniform1f(U.uInner, u.inner || 0); gl.uniform1f(U.uHalf, u.half || 0); gl.uniform1f(U.uLens, u.lens || 0); gl.uniform1f(U.uDense, u.dense || 0); gl.uniform1f(U.uGlass, u.glass || 0.9); gl.uniform1f(U.uAreaK, u.areaK || 0); gl.uniform1f(U.uHirn, u.hirn || 0); gl.uniform1f(U.uShell, u.shell || 0); gl.uniform1f(U.uLobe, u.lobe == null ? -1 : u.lobe); { const A = u.area || [0, 0, 0, 0]; gl.uniform4f(U.uArea, A[0], A[1], A[2], A[3]); }
      gl.uniform3fv(U.uStC, u.stc);
      gl.uniform4f(U.uPtr, u.ptr[0], u.ptr[1], u.ptr[2], u.ptr[3]);
      gl.drawArrays(gl.POINTS, 0, count);
    },
  };
}
