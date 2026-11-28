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
uniform float uQuiet, uLight, uGround, uScanIn, uInner, uHalf, uLens, uDense, uGlass, uAreaK, uHirn, uShell, uLobe, uAreaI, uSpH, uNs, uHStil, uWelle, uKern, uLampeS, uBunt, uScharf, uLasur; uniform vec4 uArea, uBC, uLampe, uLauf; uniform vec4 uMal[4]; uniform vec3 uLaufP; uniform vec4 uSeg[6]; uniform vec4 uSegK; uniform vec4 uAuf; uniform mediump float uSolid; uniform float uWSp; uniform vec2 uSegY; // uLampe (Stil 10 „Laterne“): Ort des Lichts im Körper (xyz) und Stärke · uLampeS: sein Weg am Rückenmark (vom Gehirn aus) // uNs: Schlussbild „Nervensystem“ (Fassungen K, M): Körper wird Glas, Gehirn, Rückenmark und Nerven stehen im Licht // uBC: Mitte und Radius des Gehirns (Fassung K) · uAreaI: Station · uSpH: Punktabstand im Gehirn // Fassung K: Areal im Gehirn (Mitte, Radius) leuchtet // uGlass: wie durchsichtig die Haut über dem Innenleben wird (e–g 0,9 · i 0,62: das Relief bleibt als Hülle) // e–g (25.11. morgens, Kai: „innere Strukturen zu wenig sichtbar“): Innenleben dauerhaft (ganz / halbe Seite), Lupe auch ohne Filmlicht // Vergleich Startfigur (25.11.2026, ?start=b|c|d): Muskeln nur an der aktiven Stelle · Tiefe im Rumpf · Boden · Scan-Linie beim Auftritt
uniform vec4 uRel, uAct; uniform float uHuelle; uniform vec2 uHuN;
uniform vec4 uPtr;
uniform vec3 uStC[4];  // Stationen: Mitte x, y (Körpermitte = 0, y oben), Radius
uniform sampler2D uRelax;
uniform vec3 cDeep, cBone, cAmber, cCalm, cLine, cWarm, cRim, cKey;
out vec3 vCol; out float vA; out float vSize; out float vSoft; out float vOp; out float vCore;
float pick(vec4 v, float i){ return i < .5 ? v.x : i < 1.5 ? v.y : i < 2.5 ? v.z : v.w; }
// Farbe je Hirnlappen (Fassung K): Stirn Blau · Zentralregion Grün · Schläfe Bernstein · Scheitel Türkis · Hinterhaupt Sand · Kleinhirn Violettblau · Stamm und Innenfläche hell
// Aquarell (Stil 11, Kai 27.11.2026: die Anatomie-Bilder in seiner Praxis): sechs Pigmente im Kreis – Gelb, Orange, Karmin, Magenta, Türkis, Grün.
// Jede Farbe steht als Fläche, dazwischen läuft sie weich in die nächste (wie nass in nass).
vec3 aqPal(float t){ float q = fract(t) * 6.;
  vec3 c = mix(vec3(1., .74, .08), vec3(1., .42, .04), smoothstep(.28, .72, q)); c = mix(c, vec3(.88, .06, .16), smoothstep(1.28, 1.72, q));
  c = mix(c, vec3(.92, .14, .56), smoothstep(2.28, 2.72, q)); c = mix(c, vec3(.03, .62, .7), smoothstep(3.28, 3.72, q));
  c = mix(c, vec3(.44, .78, .16), smoothstep(4.28, 4.72, q)); return mix(c, vec3(1., .74, .08), smoothstep(5.28, 5.72, q)); }
vec3 lobeCol(float lb){ return lb < .5 ? vec3(.36, .66, .93) : lb < 1.5 ? vec3(.62, .84, .42) : lb < 2.5 ? vec3(.96, .68, .28) : lb < 3.5 ? vec3(.32, .74, .78) : lb < 4.5 ? vec3(.93, .86, .7) : lb < 5.5 ? vec3(.5, .62, .95) : lb < 6.5 ? vec3(.9, .88, .82) : vec3(.55, .7, .8); }
void main(){
  float kind = aN.x;
  vSoft = 0.; vOp = 1.; vCore = 1.;
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
    float ltQ = step(9.5, uHStil) * (1. - step(10.5, uHStil)), aqQ = step(10.5, uHStil);
    vec3 P0 = mix(aPos, uLampe.xyz, step(10.5, kind) * ltQ); // Laterne: der Lichthof sitzt am Licht
    vec3 q = vec3(cg*P0.x + sg*P0.z, P0.y - P0.z * uTilt, -sg*P0.x + cg*P0.z);
    vec2 sQ = uAnchor + vec2(q.x - uView.x, -(q.y - uView.y)) * uView.z;
    float show = smoothstep(.9, 1., uHirn) * uNerve, zN = clamp(-q.z / 90., -.98, .98);
    // 25.11.2026 abends (Kai: „das optische Pulsieren reduzieren oder rausnehmen“): kein Feuern, keine Wellen – das Leuchten steht ruhig
    // über dem aktiven Areal, auf den Bögen gleitet nur noch ein weiches Licht langsam entlang (keine Größenänderung)
    float sizeQ = 1., aQ = 0.; vec3 cQ = vec3(1.);
    float stQ = step(.5, uHStil), glQ = step(3.5, uHStil) * (1. - step(5.5, uHStil)) + step(7.5, uHStil), tsQ = step(7.5, uHStil) * (1. - step(8.5, uHStil)); // neue Stile: Leuchten immer Bernstein, bei Lichtpunkten leiser
    if (kind < 9.5) {
      float lb = aC.x, on = (1. - step(.5, abs(lb - uLobe))) * uAreaK;
      float fc = clamp(-sg*aNrm.x + cg*aNrm.z + aNrm.y * uTilt, 0., 1.);
      sizeQ = uUnit * 2.6; vSoft = 1.; zN -= .02;
      cQ = mix(lobeCol(lb), vec3(1., .6, .13), stQ);
      aQ = show * smoothstep(.05, .5, fc) * on * .05 * (1. - .55 * glQ) * (1. - .8 * tsQ) * (1. - ltQ) * (1. - aqQ); // Tiefsee geschärft: fast kein Schleier über der aktiven Stelle
    } else if (kind < 10.5) {
      float t = aN.z, on = (1. - step(.5, abs(aN.y - uAreaI))) * uAreaK;
      float f = fract(t - uTime * .06 - aN.w), pl = pow(f, 5.) * uPulse;
      sizeQ = max(1.4 * uDpr, uUnit * uSpH * .46);
      cQ = mix(mix(lobeCol(uLobe), vec3(1., .6, .13), stQ), vec3(1., .96, .88), .25 + .4 * pl);
      aQ = show * on * (.2 + .34 * pl) * pow(sin(3.14159 * t), .6) * (1. - ltQ);
    } else {
      sizeQ = min(1000., aN.y * 3.4 * uUnit); vSoft = 1.; zN = .97;
      cQ = mix(cDeep, mix(lobeCol(uLobe), vec3(1., .6, .13), stQ), .55 * uAreaK * (1. - .6 * glQ) * (1. - .7 * tsQ));
      aQ = smoothstep(.9, 1., max(uHirn, uNs)) * uNerve * (.085 + .035 * uAreaK) * (1. - smoothstep(0., .5, uTxt));
      sizeQ = mix(sizeQ, min(900., aN.y * 1.7 * uUnit), ltQ); cQ = mix(cQ, vec3(1., .6, .16), ltQ); aQ = mix(aQ, smoothstep(.5, 1., max(uHirn, uNs)) * uNerve * uLampe.w * .17 * (1. - smoothstep(0., .5, uTxt)), ltQ); zN = mix(zN, clamp(-q.z / 90., -.98, .98), ltQ);
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
  // Aquarell: Farbspritzer – wenige Punkte der Rinde sitzen ein Stück vor der Oberfläche (fest, kein Zufall je Bild), die meisten nah
  float aqS = step(10.5, uHStil) * isBrain * step(.001, uArea.w) * step(aC.x, 6.5) * step(aRand.z, .0045);
  // 13 „Bedeutung“, 14 „Farbe läuft“ (Kai 27.11., 04:37: „Baue alle Punkte, gerne auch kombinierte Varianten“): die Farbe kommt über die
  // Zeit an – sie läuft vom Areal eines Halts aus (uMal[i]: Mitte, Radius der Front; uLauf/uLaufP ebenso für das ganze Gehirn).
  // malK = so weit ist die Farbe an diesem Punkt angekommen · malN = nasser Rand kurz hinter der Front (Pigment sammelt sich).
  float malK = 1., malN = 0.;
  { float s13 = step(12.5, uHStil) * (1. - step(13.5, uHStil)), s14 = step(13.5, uHStil), lb0 = aC.x;
    int si = lb0 < .5 ? 1 : lb0 < 1.5 ? 2 : lb0 < 2.5 ? 0 : lb0 < 3.5 ? 2 : 3;   // Hirnlappen → Halt: Schläfe 1 · Stirn 2 · Zentral, Scheitel 3 · Kleinhirn, Hinterhaupt, Stamm 4
    vec4 m = uMal[si]; vec3 qn = (aPos - uBC.xyz) / max(1., uBC.w);
    float wob = uBC.w * .11 * sin(qn.x * 4.1 - qn.z * 3.3 + 1.2 * sin(qn.y * 3.7)), sf = uBC.w * .2;   // die Front läuft unregelmäßig, wie Farbe auf nassem Papier
    float d13 = distance(aPos, m.xyz) + wob, d14 = distance(aPos, uLaufP) + wob;
    float k13 = (1. - smoothstep(m.w - sf, m.w, d13)) * step(.001, m.w), k14 = (1. - smoothstep(uLauf.z - sf, uLauf.z, d14)) * step(.001, uLauf.z);
    { float stm = step(5.5, lb0) * (1. - step(6.5, lb0)) * smoothstep(0., 1.4, (uBC.y - aPos.y) / max(1., uBC.w) - .9); // Rückenmark: liegt weit unter dem Gehirn – es färbt sich mit, sobald die Front unten ankommt
      k13 = mix(k13, smoothstep(uBC.w * .8, uBC.w * 2., m.w), stm); k14 = mix(k14, smoothstep(uBC.w * .8, uBC.w * 2., uLauf.z), stm); }
    float n13 = smoothstep(m.w - sf * 2.4, m.w - sf, d13) * k13, n14 = smoothstep(uLauf.z - sf * 2.4, uLauf.z - sf, d14) * k14;
    malK = mix(mix(1., k13, s13), k14, s14); malN = n13 * s13 + n14 * s14; }
  p += aNrm * aqS * uBC.w * (.04 + .62 * aRand.x * aRand.x) * malK;
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
  float szL = 1.; // Laterne: Größe des Gehirn-Punkts relativ zum Raster
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
  // ?bunt=1 (Kai 27.11.2026, 04:37, Idee 4 „Muskelfigur im selben Stil“ wie seine Praxisbilder): die Figur trägt die Aquarell-Pigmente –
  // große Farbflächen laufen über den Körper (Feld am Körper, kein Zufall), Licht hellt zum Papierweiß auf, Rinnen und Umriss bleiben Zeichnung.
  { float tb = .1 + .3 * sin(aPos.y * .021 + 1.3 * sin(aPos.x * .045 + .5) + .7) + .2 * sin(aPos.x * .05 - aPos.z * .06 + 1.1 * sin(aPos.y * .03));
    vec3 pb = aqPal(tb);
    vec3 cq = pb * (.6 + .42 * key + .2 * fl + .3 * bo) + vec3(1., .97, .92) * (pow(key, 3.) * .34 + spec * .55) + mix(pb, vec3(1., .97, .92), .45) * (back * .6 + edge * .45);
    // 27.11., 06:01 (Kai: „Die Figur wäre mir im Moment zu knallig, wäre schön, ein wenig dezenter“): die Farbe liegt nur noch als zarte Lasur
    // auf der hellen Zeichnung – in ruhigen Flächen etwas mehr, dazwischen bleibt die Figur wie bisher (wie auf den Drucken: nicht alles ist gemalt)
    float las = min(1., (.3 + .3 * smoothstep(-.3, .7, sin(aPos.y * .017 - aPos.x * .03 + 1.9))) * uLasur); // ?lasur= stellt die Stärke (1 = Entwurf, 2 ≈ knallig wie zuerst)
    cs = mix(cs, mix(cs, cq, las), uBunt); }
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
  // Tafel (?seg=2): die Wirbelsäule steht sichtbar in der Figur (aC.y > 0 = Wirbel, in figur.js markiert); der Abschnitt, an dem die Farbe ankommt, leuchtet in ihr
  // uAuf (Auftritt und Nahblick): x Front des Aufbaus (Grundriss-Höhe, von oben nach unten), y Aufbau aktiv (Wirbel unter der Front fehlen noch),
  // z der Körper tritt zurück, w Nahblick: die Wirbelsäule wird wie das Gehirn deckend mit Tiefe gezeichnet (eigener Durchgang, uSolid) – plastisch
  // mit Licht von vorn oben statt als leuchtender Schatten; der Wechsel löst sich über ein festes Punktmuster auf (vOp)
  float isSp = isBone * step(.5, aC.y) * step(1.5, uSegK.x), byB = 215. - aPos.y;
  float aufS = mix(1., 1. - smoothstep(uAuf.x - 1.5, uAuf.x + .5, byB), uAuf.y), aufK = isSp * uAuf.y * aufS * smoothstep(uAuf.x - 12., uAuf.x - 1., byB);
  float spT = isSp * uSegK.y * aufS, nahK = uAuf.w * isSp;
  boneShow = max(boneShow, spT * .86);
  vec3 cb = mix(cBone * .5, cBone, .25 + .75*rim);
  cb = mix(cb, cBone * (.4 + .5*key) + cKey * pow(key, 3.) * .35 + cRim * back * .8, uKino);
  col = mix(col, cb, isBone);
  float bdB = smoothstep(uSegY.x - 1.5, uSegY.x + .5, byB) * (1. - smoothstep(uSegY.y - .5, uSegY.y + 1.5, byB)) * spT * uSegK.w;
  vec3 segF = mix(vec3(1., .86, .62), mix(vec3(1., .74, .34), aqPal(uSegK.z / 6. + .03), step(10.5, uHStil)), step(-.5, uSegK.z)); // uSegK.z < 0 (Auftritt): die vier Abschnitte leuchten in warmem Weiß
  col = mix(col, segF * (1.05 + .35 * rim), bdB);
  col = mix(col, vec3(1., .93, .78), aufK * .85);
  float keyN = max(0., dot(nv, normalize(vec3(-.36, .42, .83)))) * hasN; // Nahblick: eigenes Licht, mehr von vorn – die Wirbel stehen gleichmäßig hell, die Form trägt der Abfall zum Rand
  vec3 cNah = cBone * (.2 + .8 * keyN + .08 * rim) + cKey * pow(keyN, 4.) * .2 + cRim * back * .26;
  cNah = mix(cNah, segF * (.17 + .88 * pow(keyN, 1.5) + .12 * rim) + cKey * pow(keyN, 4.) * .16, bdB); cNah = mix(cNah, vec3(1., .93, .78), aufK * .7);
  // Schädel tritt zurück, solange das Gehirn zu sehen ist (Station Kopf), Rippen und Hände etwas leiser
  float soft = aN.w > 1.5 ? 1. - .78 * brainK * (1. - smoothstep(60., 120., uTip)) * (1. - uEnd * .4) : mix(1., .62, aN.w);
  a = mix(a, mix(.34 + .52*rim, .5 + .5*rim + .25*key, im) * boneShow * mix(soft, max(soft, .8), im * step(aN.w, 1.5)) * mix(coarse, 1., max(max(fineK, im), spT)), isBone);
  a *= 1. - mix(.94, 1., kK) * uHirn * isBone;
  a = mix(a, max(a, .96), bdB); // der Abschnitt, an dem die Farbe ankommt, leuchtet
  a = mix(a, max(a, .95), aufK);
  d = mix(d, uSpB * .46 * mix(1., mix(1.5, 1., fineK), coarse) * mix(1., .78, spT) * (1. + .5 * bdB * (1. - uAuf.w) + .45 * aufK), isBone);
  d = mix(d, max(d, 1.15 * uDpr / uUnit * (1. + .4 * bdB)), spT); // Tafel in der Übersicht: Wirbel-Punkte mindestens gut einen Bildpunkt groß
  d = mix(d, max(d, 1.5 * uWSp), nahK * uSolid); // deckend: die Punkte schließen die Fläche (anderthalb Rasterweiten)

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
  // Fassung „Segmente“ (?seg=1, Kai 27.11.2026: Kapitel 03 in der Startfigur): jeder der sechs Abschnitte färbt seine Bahnen – die Farbe
  // läuft über die Zeit von der Wurzel in das Versorgungsgebiet (uSeg[i]: Anfang am Weg vom Gehirn, Front, aktiv, Länge) und bleibt stehen.
  // aC.y trägt bei Nerven die Bitmaske der Abschnitte. uSegK: Stärke, Zurücktreten der übrigen Bahnen, aktiver Abschnitt, Band am Mark.
  float sgP = 0., sgA = 0., sgW = 0.; vec3 sgC = vec3(0.);
  if (uSegK.x > .001 && isNerve > .5 && aC.y > .5) {
    for (int i = 0; i < 6; i++) { if (mod(floor(aC.y / exp2(float(i))), 2.) < .5) continue;
      float loc = aN.z - uSeg[i].x, f = uSeg[i].y, ak = uSeg[i].z, rw = step(1.5, uSegK.x), g = uSeg[i].w + 4. - f; // rw (Tafel, ?seg=2): die Farbe läuft vom Versorgungsgebiet hinauf zur Wurzel
      float r = mix(1. - smoothstep(f - 4., f, loc), smoothstep(g, g + 4., loc), rw) * step(.01, f);
      float kopf = r * mix(smoothstep(f - 18., f - 2., loc), 1. - smoothstep(g + 2., g + 18., loc), rw) * (1. - step(uSeg[i].w + 3., f));
      vec3 sc = mix(vec3(1., .74, .34), aqPal(float(i) / 6. + .03), step(10.5, uHStil));
      sgC += (sc * (1. + .2 * ak) + vec3(1., .97, .9) * kopf * .8) * r * (.35 + ak); sgW += r * (.35 + ak); sgP = max(sgP, r); sgA = max(sgA, r * ak); }
    if (sgW > 0.) sgC /= sgW; }
  rev = max(rev, sgP * min(1., uSegK.x));
  float front2 = rev * (1. - smoothstep(2., 18., uTip - aN.y)) * mix(1., uNs, kK) * (1. - sgP * min(1., uSegK.x)); // mit feinem Gehirn steht die Spitze unter dem Stamm – kein Dauerlicht dort
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
    // Stil des Gehirns (Kai 26.11.: „kräftiger, klarer, auffallender … das Blaue geht im blauen Hintergrund unter“) – uHStil:
    // 0 bisher (jeder Lappen in seiner Farbe) · 1 A hell auf dunkel (Eisblau bis Knochenweiß, aktives Areal Bernstein) ·
    // 2 B Lappenfarben kräftiger, Lichtkante · 3 C wie A mit Glanz. Den Grund dunkelt kapitel.js ab (Raumlicht, --fx-hirn).
    float sC = step(2.5, uHStil), sB = step(1.5, uHStil) * (1. - sC), sA = step(.5, uHStil) * (1. - step(1.5, uHStil)) + sC;
    float fog = mix(.42, 1., smoothstep(-.7, .8, (p.z - (-sw*uBC.x + cw*uBC.z)) / max(1., uBC.w)));   // hinten leiser: Tiefe
    float inn = step(6.5, lb), isSt = step(5.5, lb) * (1. - inn);                              // Innenfläche: zurückhaltend · Stamm und Rückenmark
    fog = mix(fog, 1., isSt * .45);
    float fill = max(0., dot(nv, normalize(vec3(.6, .25, .76)))) * hasN;
    float sp2 = pow(max(0., dot(nv, Hh)), 30.) * hasN * cav;
    float lit = ((.3 + .52 * key + .26 * fill + .22 * rim) * mix(.04, 1., cav) + .28 * back * ao) * fog * (1. - .5 * inn);
    float L1 = clamp(.36 + .74 * (key + .4 * fill) * cav, 0., 1.), gI = 0., sG = 0., sM = 0.;
    vec3 tint = mix(mix(cBone, cWarm, .3), lc, mix(.8, 1., on));
    vec3 ch = mix(mix(cDeep * 1.1, lc * .45, .55), tint, L1) + mix(cRim, lc, .6) * back * .4 + vec3(1., .97, .9) * sp2 * .5;
    ch = mix(ch, mix(lc, vec3(1., .97, .9), .45), on * .3 * cav);
    { float Lk = clamp(key + .4 * fill, 0., 1.), LA = clamp(.5 + .8 * Lk * cav, 0., 1.);
      // A, C: Schatten Eisblau, Licht Knochenweiß; Stamm und Innenfläche Knochen; aktives Areal Bernstein bis warmes Weiß
      vec3 tA = mix(vec3(.5, .74, .98), vec3(1., .99, .96), smoothstep(.1, .7, Lk));
      tA = mix(tA, mix(vec3(.72, .74, .74), vec3(.95, .93, .86), Lk), max(isSt, inn));
      tA = mix(tA, mix(vec3(.93, .5, .1), vec3(1., .8, .4), smoothstep(.25, .95, Lk)), on);
      vec3 dA = mix(mix(cDeep * .8, vec3(.16, .3, .5), .55), vec3(.42, .2, .04), on);
      vec3 cA = mix(dA, tA, LA) + mix(vec3(.6, .82, 1.), vec3(1., .78, .4), on) * back * .32 + vec3(1., .98, .94) * sp2 * mix(.55, 1.25, sC) + vec3(.7, .86, 1.) * pow(rim, 2.2) * .3 * sC * (1. - on);
      // B: Lappenfarben heller und satter, kühle Lichtkante am Rand
      vec3 lB = min(vec3(1.), mix(lc, vec3(1.), .1) * 1.2);
      vec3 cB = mix(mix(cDeep * .9, lB * .4, .55), mix(vec3(1., .98, .94), lB, mix(.78, .96, on)), LA) + mix(cRim, lB, .5) * back * .5 + vec3(.72, .88, 1.) * pow(rim, 1.8) * .34 + vec3(1., .97, .9) * sp2 * .7;
      ch = mix(ch, cA, sA); ch = mix(ch, cB, sB);
      // Zweite Runde (Kai 26.11., 20:55: „keines geht in die Richtung“, dazu sein Film vom 17.11.: Gehirn aus Lichtpunkten in Gold und
      // Violett auf fast schwarzem Grund): 4 Neon-Scan · 5 Gold und Violett wie im Film · 6 warm glühend · 7 fast echt.
      // 4, 5 „Lichtpunkte“: die Flächen bleiben dunkel, es leuchten der Rand jeder Windung (rim), die Flanke der Furchen (band) und der Glanz
      float s4 = step(3.5, uHStil) * (1. - step(4.5, uHStil)), s5 = step(4.5, uHStil) * (1. - step(5.5, uHStil)), s6 = step(5.5, uHStil) * (1. - step(6.5, uHStil)), s7 = step(6.5, uHStil);
      float band = smoothstep(.14, .4, ao) * (1. - smoothstep(.48, .8, ao)), rimK = pow(rim, .9);
      float gG = clamp((band * mix(.75, .4, s5) + rimK * 1.1 + mix(.14, .34, s5) * Lk * cav + sp2 * .7) * fog * (1. - .25 * isSt) * (1. - .5 * inn), 0., 1.);
      gI = mix(gG, clamp(gG + (.14 + .26 * Lk) * cav, 0., 1.), on);
      vec3 cN = mix(mix(vec3(.02, .28, .85), vec3(.15, .9, 1.), smoothstep(.05, .6, gI)), vec3(.82, 1., 1.), smoothstep(.78, 1., gI));
      cN = mix(cN, mix(mix(vec3(.85, .3, .02), vec3(1., .62, .12), smoothstep(.1, .7, gI)), vec3(1., .86, .5), smoothstep(.82, 1., gI)), on);
      vec3 cF = mix(mix(vec3(.5, .34, 1.), vec3(1., .78, .22), smoothstep(.16, .62, rimK)), vec3(1.), max(smoothstep(.82, 1., gI) * .55, min(1., sp2 * 1.5)));
      cF = mix(cF, mix(vec3(1., .74, .2), vec3(1., .95, .8), smoothstep(.5, 1., Lk)), on);
      // 6 warm glühend: Kupfer bis Gold, kühle Gegenlichtkante; aktives Areal weißglühend
      vec3 tW = mix(mix(vec3(.42, .11, .02), vec3(.96, .42, .08), smoothstep(0., .55, Lk)), vec3(1., .74, .3), smoothstep(.55, 1., Lk));
      tW = mix(tW, mix(vec3(1., .82, .45), vec3(1., .97, .85), smoothstep(.3, .95, Lk)), on);
      vec3 cW = mix(vec3(.2, .05, .01), tW, LA) + vec3(.35, .65, 1.) * back * .4 * (1. - on) + vec3(1., .9, .7) * sp2 * .6;
      // 7 fast echt: warmes Elfenbein mit Rosé in den Schatten, weiches Licht, feuchter Glanz; aktives Areal Bernstein
      vec3 tE = mix(mix(vec3(.52, .24, .24), vec3(.93, .68, .62), smoothstep(0., .55, Lk)), vec3(1., .88, .82), smoothstep(.55, 1., Lk));
      tE = mix(tE, mix(vec3(.76, .74, .7), vec3(.96, .93, .86), Lk), isSt);
      tE = mix(tE, mix(vec3(.96, .56, .14), vec3(1., .84, .5), Lk), on * .72);
      vec3 cE = mix(vec3(.24, .08, .09), tE, clamp(.55 + .6 * Lk * cav, 0., 1.)) + vec3(.6, .75, 1.) * back * .2 + vec3(1.) * sp2 * 1.1;
      // Dritte Runde (Kai 26.11., 21:22: „Neon am besten, packt mich aber noch lange nicht“, dazu sein Art-Director-Prompt: zwei fachfremde
      // Welten, drei Eigenheiten). 8 „Tiefsee“ = Neon weitergedacht mit Biolumineszenz und Perlmutt: die Farbe der Lichtlinien wandert mit dem
      // Blickwinkel (Cyan → Grün → Violett), an der aktiven Stelle glimmt Glut in den Furchen, beim Ankommen läuft EINE Lichtwelle von dort
      // über das Gehirn, und unter dem Finger leuchtet es auf. 9 „Kintsugi“ = schwarzer Lack mit Goldadern: die Furchen sind mit Gold gefüllt.
      float s8 = step(7.5, uHStil) * (1. - step(8.5, uHStil)), s9 = step(8.5, uHStil);
      float dW = distance(aPos, uArea.xyz), wv = exp(-pow((dW - uWelle * 13.) / 3.2, 2.)) * smoothstep(0., .2, uWelle) * (1. - smoothstep(1.5, 2.6, uWelle)) * uAreaK;
      float gT = clamp((band * .7 + rimK * 1.1 + .1 * Lk * cav + sp2 * .8) * fog * (1. - .25 * isSt) * (1. - .5 * inn), 0., 1.);
      // 8 geschärft (Kai 27.11.2026: „Tiefsee … sollte schärfer und klarer aussehen“): die Flächen sind dunkel, es leuchten nur schmale Linien –
      // die Kante jeder Furche (fl) und der Umriss jeder Windung (rl). Die Farbe wechselt nicht mehr von Windung zu Windung, sondern in
      // einem ruhigen Verlauf über das ganze Bild (oben links Cyan, Mitte Grün, unten rechts Violett) – das Gehirn dreht sich durch dieses Licht.
      vec2 qz = (p.xy - vec2(cw * uBC.x + sw * uBC.z, uBC.y - uBC.z * uTilt)) / max(1., uBC.w);
      float wC8 = (uMarkY - aPos.y) * 1.03, mN = isSt * uNs;                                   // mN: Rückenmark auf der Fahrt
      float tI = mix(clamp(.5 + .54 * (qz.x * .75 - qz.y * .65), 0., 1.), clamp(wC8 / 400. * .55, 0., 1.), mN);
      vec3 ir = mix(mix(vec3(.04, .7, 1.), vec3(.08, 1., .74), smoothstep(.12, .5, tI)), vec3(.56, .42, 1.), smoothstep(.56, .96, tI));
      float fl = smoothstep(.11, .2, ao) * (1. - smoothstep(.46, .64, ao)), rl = smoothstep(.58, .9, 1. - clamp(facing, 0., 1.)) * hasN;
      float lin = clamp(max(fl, rl * .9) + sp2 * .6, 0., 1.) * fog * (1. - .25 * isSt) * (1. - .5 * inn);
      float body = ((.26 + .34 * Lk) * (1. - smoothstep(.08, .22, ao)) + (.05 + .17 * Lk) * smoothstep(.5, .76, ao)) * fog * (1. - .4 * inn); // das Licht kommt aus den Furchen (ao klein = tief): innen halbhell, die Flanke als helle Linie; die Kuppen (ao hoch) bleiben dunkel, nur ein Hauch Licht von links oben gibt ihnen Volumen
      float g8 = clamp(body + lin + wv * (.35 + .5 * cav) + pk * .55 * cav, 0., 1.);
      vec3 c8 = mix(mix(vec3(.02, .16, .42), ir * .92, smoothstep(.04, .4, g8)), vec3(.95, 1., 1.), max(smoothstep(.6, .9, g8) * .92, max(wv, pk) * .7));
      // aktive Stelle: Glut – dunkles Rot auf den Kuppen, die Linien in Gold
      float gE = clamp(.1 * fog + body * 1.2 + lin + wv * .3 + pk * .4, 0., 1.);
      c8 = mix(c8, mix(mix(vec3(.62, .12, .0), vec3(1., .58, .1), smoothstep(.2, .7, gE)), vec3(1., .94, .68), smoothstep(.72, .96, gE)), on);
      g8 = mix(g8, gE, on);
      // Rückenmark auf der Fahrt: ein leuchtender Strang im selben Licht – Körper halbhell, beide Kanten als helle Linie
      { float gC = clamp(.3 + .4 * Lk + rl * .6 + sp2 * .5, 0., 1.);
        c8 = mix(c8, mix(mix(vec3(.02, .16, .4), ir, smoothstep(.08, .6, gC)), vec3(.92, 1., 1.), smoothstep(.78, 1., gC) * .85), mN);
        g8 = mix(g8, gC, mN); }
      float vein = smoothstep(.07, .24, ao) * mix(1. - smoothstep(.32, .56, ao), 1. - smoothstep(.55, .9, ao), on), sheen = pow(max(0., dot(nv, Hh)), 6.) * cav * hasN * (1. - .7 * on);
      vein = clamp(vein * (1. - .5 * inn) + wv * .7 * (1. - smoothstep(.3, .75, ao)), 0., 1.);
      vec3 c9 = mix(mix(vec3(.85, .5, .1), vec3(1., .86, .5), smoothstep(.3, 1., vein)), vec3(1., .96, .8), clamp(pk * .7 + wv * .6 + on * .25, 0., 1.)) * vein * (1. + .5 * pk + .6 * wv)
        + vec3(.22, .36, .55) * sheen * .55 + vec3(.3, .5, .8) * pow(rim, 2.2) * .3 + vec3(1.) * sp2 * .7;
      c9 *= fog;
      float mk = 1. - isSt * uNs; // auf der Fahrt am Rückenmark trägt das Mark das Bild: dort wieder hell wie bisher
      ch = mix(ch, cN, s4 * mk); ch = mix(ch, cF, s5 * mk); ch = mix(ch, cW, s6); ch = mix(ch, cE, s7); ch = mix(ch, c8, s8); ch = mix(ch, c9, s9 * mk);
      gI = mix(mix(gI, g8, s8), .8, s9); sG = (s4 + s5 + s9) * mk + s8; sM = s6 + s7; vCore = mix(1., uKern, hk * s8);
      // 10 „Laterne“ (Kai 27.11.2026, 02:08: „irgendwie ist es das auch nicht … kleinen Umbau in Kauf nehmen“). Befund: alle Stile bisher
      // waren dieselbe dichte, deckende Punktfläche. Hier ist das Gehirn durchscheinend wie Papier (keine Tiefe, Rückseite scheint durch),
      // wenige größere Punkte mit Lücken; es zeichnen nur Kanten (Fläche schräg zum Blick) und Furchenwände. Farbe gibt es nur als Licht:
      // EIN warmes Licht sitzt im Inneren (uLampe) und lässt die Windungen um sich von innen glühen – Kuppen heller als Furchen.
      { float sL = step(9.5, uHStil) * (1. - step(10.5, uHStil)), fa = abs(facing), eL = pow(1. - fa, 2.4) * hasN;
        float wand = smoothstep(.1, .22, ao) * (1. - smoothstep(.45, .68, ao));
        float hin = mix(.2, 1., smoothstep(-.3, .25, facing));                                   // Rückseite leiser
        float g0 = (.03 + .5 * eL + .24 * wand * (.3 + .7 * eL)) * hin * (1. - .4 * inn);
        float dL = distance(aPos, uLampe.xyz), rL = max(1., uBC.w * .46), qL = dL / rL;
        float lt = uLampe.w * (exp(-qL * qL) + .16 / (1. + qL * qL)) * mix(.42, 1., smoothstep(.2, .7, ao)) * mix(.62, 1., max(on, isSt)) * mix(.7, 1., hin);
        vec3 cK = mix(vec3(.2, .5, .7), vec3(.86, .94, 1.), smoothstep(.08, .6, g0));
        vec3 cW = mix(vec3(1., .46, .06), vec3(1., .82, .5), smoothstep(.6, 1.2, lt));
        ch = mix(ch, mix(cK, cW, clamp(lt * 1.6 / (lt * 1.6 + g0 + .02), 0., 1.)), sL);
        gI = mix(gI, clamp(g0 * .85 + lt * .58, 0., 1.), sL); sG = mix(sG, 1., sL); sM *= 1. - sL;
        szL = mix(1., .46 + .36 * eL + .42 * min(1., lt), sL); }
      // 11 „Aquarell“ (Kai 27.11.2026, 02:50, mit Foto: „In meiner Praxis hängen schon diese Bilder, kannst du daraus was für unser Gehirn
      // zaubern?“ – Anatomie als Tuschezeichnung mit Aquarell: Gelb, Orange, Karmin, Magenta, Türkis, Grün, weißes Papier, Farbspritzer).
      // Das Gehirn ist deckend gemalt: große Farbflächen laufen ineinander (Feld am Gehirn, dreht sich mit), an den Kuppen im Licht bleibt
      // das Papier weiß stehen, die Furchen sind mit Tusche gezogen. Aktiver Bereich: satt und nass,
      // der Rest tritt etwas zurück. Dazu Farbspritzer um die Form (aqS).
      { float sQ = step(10.5, uHStil);
        vec3 q3 = (aPos - uBC.xyz) / max(1., uBC.w);
        float n1 = sin(q3.x * 2.3 + 1.7 * sin(q3.y * 1.9 + .6) + .8), n2 = sin(q3.y * 2.6 - 1.4 * sin(q3.z * 2.1 - 1.1) + 1.7 * q3.z), n3 = sin((q3.x + q3.z) * 1.5 - q3.y * 3.1 + 2.4);
        float tq = .06 + .27 * n1 + .2 * n2 + .1 * n3;
        vec3 pg = aqPal(tq);
        { float s13 = step(12.5, uHStil) * (1. - step(13.5, uHStil)), s14 = step(13.5, uHStil);
          vec3 wz = vec3(.84, .85, .83);                                                         // ungemalt: feine weiße Zeichnung
          // 13: jeder Hirnlappen hat sein Pigment – Stirn Gelb-Orange · Zentral Karmin · Schläfe Türkis · Scheitel Magenta · Hinterhaupt Orange · Kleinhirn Grün
          float tL = lb < .5 ? .07 : lb < 1.5 ? .35 : lb < 2.5 ? .68 : lb < 3.5 ? .5 : lb < 4.5 ? .18 : lb < 5.5 ? .84 : .62;
          vec3 pg13 = mix(wz, mix(aqPal(tL + .05 * n1 + .03 * n2), pg, isSt), malK);
          // 14: mit jedem Halt läuft eine neue Mischung vom aktiven Areal über das ganze Gehirn (uLauf: von, nach, Radius)
          vec3 pgV = uLauf.x < -.5 ? wz : aqPal(tq + uLauf.x * .23), pgN = uLauf.y < -.5 ? wz : aqPal(tq + uLauf.y * .23);
          pg = mix(mix(pg, pg13, s13), mix(pgV, pgN, malK), s14) * (1. - .3 * malN); }
        float kante = 1. - smoothstep(0., .2, abs(fract(fract(tq) * 6.) - .5));                  // Rand einer Farbfläche: das Pigment sammelt sich
        float n4 = sin(q3.x * 4.1 - q3.z * 3.3 + 1.2 * sin(q3.y * 3.7));
        float dens = clamp(.94 + .14 * n4 - .56 * smoothstep(.84, 1., Lk) * cav * (1. - isSt), .42, 1.);        // Kuppen im Licht: Papier bleibt stehen
        dens = mix(dens, dens * .8, uAreaK * (1. - on) * (1. - isSt)); dens = mix(dens, min(1., dens * 1.2 + .14), on);
        vec3 cQ = mix(vec3(1., .97, .92), pg * (1. - .2 * kante), dens) * mix(.56, 1., smoothstep(0., .5, Lk)) * mix(.8, 1., fog);
        float ink = (1. - smoothstep(.15, .42, ao)) * (1. - klein * .7);
        cQ = mix(cQ, vec3(.05, .02, .05), ink * .94);
        cQ += vec3(1., .98, .94) * sp2 * .35;
        // 12 „Pigment fein“ (Kai 27.11., 04:07 zum Aquarell: „Richtung besser … zu ungenau. Würde das in Partikeln gehen? Gerne feiner
        // Partikelstil“): dieselben Pigmente, aber als feine, einzelne Punkte – die Zeichnung folgt genau den Windungen: Furche Tusche,
        // Flanke sattes dunkles Pigment, Kuppe helles Pigment, nur auf dem Scheitel der Kuppe im Licht Papierweiß.
        float sF = step(11.5, uHStil);
        // uScharf (Kai 27.11., 05:52: „Warum sieht das Rückenmark deutlich schärfer gezeichnet aus als das Gehirn?“): das Rezept des Rückenmarks –
        // reine Farbe je Punkt, keine weißen Lichter, nur zwei Tonstufen (Pigment und Tusche) mit schmalem Übergang
        { float hl = .78 * smoothstep(.5, 1., Lk) * smoothstep(.62, .92, ao) * (1. - isSt) * (1. - uScharf);
          float kh = step(4.5, aC.x) * step(aC.x, 5.5) * uScharf; // Kleinhirn: flache Blätter – die Tonstufen enger an die Kuppe, sonst bleibt es eine Fläche
          vec3 cF = mix(pg * mix(.52, .3, uScharf), mix(min(vec3(1.), pg * mix(1.3, 1.12, uScharf)), vec3(1., .98, .94), hl), smoothstep(mix(mix(.14, .26, uScharf), .5, kh), mix(mix(.46, .7, uScharf), .93, kh), ao));
          cF *= mix(mix(.84, .74, uScharf), 1., smoothstep(0., mix(.45, .8, uScharf), Lk)) * mix(.85, 1., fog) * mix(1., .84, uAreaK * (1. - on) * (1. - isSt));
          cF = mix(cF, mix(pg, vec3(1., .98, .94), (.2 + .5 * hl) * (1. - uScharf)) * 1.1, on * smoothstep(.3, .7, ao) * (1. - uScharf)); cF *= 1. + .12 * on * uScharf; // scharf: der aktive Lappen wird nur heller, die Zeichnung bleibt
          cF = mix(cF, vec3(.05, .02, .05), (1. - smoothstep(.07, .2, ao)) * (1. - klein * .7) * .92);
          cQ = mix(cQ, cF + vec3(1., .98, .94) * sp2 * .3 * (1. - uScharf), sF); }
        cQ = mix(cQ, pg * 1.04, aqS * malK);                                                     // Spritzer: reines Pigment
        ch = mix(ch, cQ, sQ); gI = mix(gI, .82, sQ); sG = mix(sG, 1., sQ); sM *= 1. - sQ; vCore = mix(vCore, mix(1.6, 1.22, sF), hk * sQ); // Aquarell: Kern über den Punkt hinaus – flache, deckende Farbtupfer ohne dunklen Rand; fein: einzelne Punkte
        szL = mix(szL, mix(mix(1.26, mix(1., 1.4, uScharf), sF), mix(.9 + 3.6 * aRand.y * aRand.y * aRand.y, .8 + 2.2 * aRand.y * aRand.y * aRand.y, sF), aqS), sQ); } }
    { // Impulse (nur im Blick „Nervensystem“ – im Gehirn-Blick bleibt alles ruhig): Licht läuft das Rückenmark hinunter (warm) und leiser
      // wieder hinauf (kühl), im selben Takt wie auf den Nerven – dort tritt es an jeder Wurzel aus und kommt dort wieder an
      float wC = (uMarkY - aPos.y) * 1.03, kC = uPulse * uNs * isSt * (1. - step(9.5, uHStil) * (1. - step(10.5, uHStil)));
      float pO = fract(wC / 150. - uTime * .3), sO = pow(pO, 10.) * smoothstep(1., .975, pO) * kC;
      float pI = fract(-wC / 190. - uTime * .13 + .4), sI = pow(pI, 6.) * smoothstep(1., .96, pI) * kC * .45;
      ch = mix(ch, vec3(1., .92, .72), min(1., sO)); ch = mix(ch, vec3(.72, .9, 1.), min(1., sI * 1.4));
      ch *= 1. - .18 * kC + .9 * sO + .6 * sI; }
    col = mix(col, ch, hk);
    { float stm6 = step(5.5, aC.x) * (1. - step(6.5, aC.x)); col = mix(col, vec3(.8, .87, .9) * (.3 + .7 * dot(col, vec3(.3, .5, .2))), step(1.5, uSegK.x) * uSegK.y * stm6 * hk * .88); } // Tafel: Rückenmark ohne Farbe – Farbe trägt nur der gewählte Abschnitt
    { float by = 215. - aPos.y, bd = smoothstep(uSegY.x - 3., uSegY.x + 1., by) * (1. - smoothstep(uSegY.y - 1., uSegY.y + 3., by)) * step(5.5, aC.x) * (1. - step(6.5, aC.x)); // Segmente: der aktive Abschnitt leuchtet am Rückenmark als Band
      col = mix(col, mix(vec3(1., .86, .62), mix(vec3(1., .74, .34), aqPal(uSegK.z / 6. + .03), step(10.5, uHStil)), step(-.5, uSegK.z)) * 1.2, bd * hk * uSegK.w * .9); }
    a = mix(a, min(1., a * (1. + ar * 2.2) + ar * .3), isBrain * (1. - hv));
    a = mix(a, min(1., (lit * (1. + .36 * sA + .28 * sB + .38 * sM) + sp2 * mix(.3, .6, sC)) * mix(1., mix(.7, .9, sA + sB + sM), uAreaK * (1. - on) * (1. - isSt)) * (1. + on * .22) * (1. + .45 * klein)) * rev * uNerve, hk);
    a = mix(a, min(1., (gI * 1.2 + .04) * (1. + .45 * klein)) * rev * uNerve, hk * sG); // Lichtpunkte: die Helligkeit trägt die Zeichnung // aktiver Lappen: über die Farbe heller, nicht über die Deckkraft (sonst geht die Form verloren)
    { float as = smoothstep(.1, 1., hv); a *= mix(1., .12 + .88 * as * as, isBrain * kK); } // im Staub leise, sonst weißer Fleck
    ar = mix(ar, on * .5, hv); }
  d = mix(d, (.34 + .08*im) * (1. + ar * .3) * mix(1., .78, step(.001, uArea.w)), isBrain);
  d = mix(d, uSpH * .92 * (1. + ar * .1) * szL, isBrain * kK * smoothstep(.3, 1., hv)); // im Gehirn-Blick: dichte Punkte (0,92 des Abstands), die Fläche schließt sich zum Körper
  float ph = fract(aN.z/170. - uTime*.16);
  float nsk = uPulse * uNs * kK * (1. - smoothstep(0., .15, fe)) * (1. - step(9.5, uHStil) * (1. - step(10.5, uHStil))); // Laterne: keine Impulse – das Licht ist die eine Bewegung // im Flug zum Leitsatz keine Impulse mehr (sonst funkelt der Staub)
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
  // Tiefsee (Stil 8, Kai 27.11.2026: „die fortlaufenden Nerven sollten auch in diesem Stil sein“): die Nerven leuchten im selben Licht wie
  // das Gehirn – am Rückenmark Cyan, nach außen über Grün zu Violett; kräftige Stämme mit hellem Kern, feine Äste in reiner Farbe.
  // Der Impuls hinaus bleibt warm (Bernstein = Nerven, Handlung), der zurück ist weiß.
  float tsN = step(7.5, uHStil) * (1. - step(8.5, uHStil)) * kK;
  { float farN = smoothstep(2., 46., length(vec2(aPos.x, (aPos.z + 9.) * .6))), tN = clamp(aN.z / 400. * .55 + .42 * farN, 0., 1.);
    vec3 irN = mix(mix(vec3(.04, .7, 1.), vec3(.08, 1., .74), smoothstep(.12, .5, tN)), vec3(.56, .42, 1.), smoothstep(.56, .96, tN));
    vec3 c8n = mix(irN, vec3(.94, 1., 1.), .12 + .5 * smoothstep(.3, .58, aN.w));
    c8n = mix(c8n, vec3(1., .78, .36), min(1., sigO * 1.2)); c8n = mix(c8n, vec3(.95, 1., 1.), min(1., sigI * 1.4));
    c8n *= 1. - .2 * nsk + 1. * sigO + .7 * sigI;
    cn = mix(cn, c8n, tsN * smoothstep(0., .5, uNs)); }
  // Laterne: die Nerven sind kühles Glas; das Licht, das am Rückenmark hinunterfährt, läuft an jeder Wurzel in den Ast hinaus
  // (vorn hell, dahinter klingt es auf einen warmen Rest ab) – gemessen am Weg vom Gehirn (aN.z gegen uLampeS)
  float ltN = step(9.5, uHStil) * (1. - step(10.5, uHStil)) * kK, gLN = 0.;
  { float hinter = uLampeS - aN.z; gLN = smoothstep(-5., 0., hinter) * mix(.22, 1., exp(-max(0., hinter) / 46.)) * uLampe.w;
    vec3 cLN = mix(vec3(.42, .68, .86), mix(vec3(1., .56, .12), vec3(1., .9, .64), smoothstep(.6, 1., gLN)), smoothstep(.02, .5, gLN));
    cn = mix(cn, cLN, ltN); }
  // Aquarell: die Nerven tragen die Pigmente der Reihe nach – am Rückenmark Karmin und Orange, nach außen über Gelb und Grün zu Türkis; Impulse weiß
  { float aqN = step(10.5, uHStil) * kK, farN = smoothstep(2., 46., length(vec2(aPos.x, (aPos.z + 9.) * .6)));
    vec3 cAq = aqPal(.3 - aN.z / 400. * .5 - .34 * farN) * (.86 + .3 * smoothstep(.3, .58, aN.w));
    cAq = mix(cAq, vec3(1.), min(1., sigO * 1.1 + sigI * 1.2)); cAq *= 1. - .2 * nsk + 1. * sigO + .7 * sigI;
    cn = mix(cn, cAq, aqN); }
  cn = mix(cn, vec3(.78, .86, .9) * dot(cn, vec3(.3, .5, .2)), step(1.5, uSegK.x) * uSegK.y * .85); // Tafel: alle Bahnen als feine, helle Linien ohne Farbe
  cn = mix(cn, sgC, sgP * min(1., uSegK.x)); cn *= mix(1., mix(mix(.3, .5, step(1.5, uSegK.x)), 1.2 + .7 * sgA, sgP), uSegK.y); // Segmente: gefärbte Bahn in reinem Pigment, die übrigen treten im Halt zurück
  col = mix(col, cn, isNerve);
  // mit feinem Gehirn: die Nerven erscheinen zusammen mit Gehirn und Rückenmark und bleiben im Gehirn-Blick stehen (laufen unter dem Stamm weiter)
  a = mix(a, rev * (.6 + .2*aN.w) * (1. + pulse*.8*(1. - .7*hv) + front2*.5 + (sigO + sigI)*.7) * uNerve * (1. + lens*.5) * mix(1. - .97 * uHirn, smoothstep(.05, .8, hv), kK) * (1. + .5 * uNs) * mix(1., .3 + .7 * gLN, ltN), isNerve);
  d = mix(d, mix(.34 + .1*aN.w, aN.w, kK) * (1. + pulse*.45*(1. - hv) + front2*.3 + sigO*.45 + sigI*.3) * mix(1., .8, uHirn * kK) * (1. + 1.5 * sgA * min(1., uSegK.x) * (1. - smoothstep(.9, 2.6, uZoom) * .6)), isNerve); // im Gehirn-Blick feine Stränge · Segmente: die aktive Bahn kräftiger
  // K, M im Profil: eine Bahn, die genau auf den Betrachter zuläuft (Ischias-Wurzel quer durchs Becken), stünde als heller Balken da –
  // ihre Perlen liegen dann alle hintereinander. Je steiler die Bahn zur Bildebene steht, desto leiser.
  // K, M: Tiefe – was auf der abgewandten Körperseite liegt, tritt zurück (im Profil lägen sonst beide Seiten gleich hell übereinander)
  a *= mix(1., mix(.4, 1., smoothstep(-22., 14., p.z)), isNerve * kK * uNs);
  { vec3 tn = aNrm * isNerve; float tz = -sw*tn.x + cw*tn.z + tn.y * uTilt;
    a *= mix(1., mix(.22, 1., smoothstep(.15, .62, sqrt(max(0., 1. - tz*tz)))), step(.01, dot(tn, tn))); }

  // Schlussbild „Nervensystem“ (K, M): Haut und Muskeln werden zu Glas – es bleibt der Umriss als Lichtkante
  a *= mix(1., (.018 + .085 * edge) * (1. + 1.5 * uSegK.y) * (1. - .45 * smoothstep(0., .6, uTxt)), uNs * (isSkin + isShell));
  a *= mix(1., .1, uAuf.z * (1. - isSp)) * mix(1., .22, uAuf.w * (isSkin + isShell)); // Auftritt: alles außer der Wirbelsäule tritt zurück · Nahblick: der Umriss des Körpers wird leiser
  a *= mix(1., .13, uSegK.y * isBrain * (1. - step(5.5, aC.x) * (1. - step(6.5, aC.x)))); // Segmente: das Gehirn tritt im Halt zurück (Stamm und Rückenmark bleiben), der Umriss des Körpers steht etwas deutlicher // die Nerven haben den Körper verlassen: der Umriss bleibt nur noch als Hauch stehen (Kai 25.11.: „deutlich transparenter“)
  a *= mix(1., mix(.46, .1, uHuN.x), uHuelle * (isSkin + isShell)); // … der Umriss steht zart, in der Nahansicht nur noch als Hauch
  a *= 1. - uHuelle * isBrain * mix(.45, 1., uHuN.x); // Hülle (?seg=4): Gehirn und Rückenmark treten zurück (das Mark läuft in der Übersicht durch die Wirbelsäule von Kapitel 03) und weichen ihr in der Nahansicht ganz
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
  { float glasB = isBrain * kK * step(9.5, uHStil) * (1. - step(10.5, uHStil)); // Laterne: durchscheinend – die Rückseite bleibt, das Auflösen trägt die Deckkraft (kein Punktmuster)
    a *= mix(front, rev * uNerve * smoothstep(.05, .8, hv) * (1. - smoothstep(0., .45, uTxt)), glasB); }
  a *= 1. - nahK * (1. - uSolid);
  if (uSolid > .5 && isSp > .5) { col = cNah; a = 1.; vCore = 1.6; } // Kern über den Punkt hinaus: flache, deckende Punkte, kein Körnen
  float want = d * uUnit * mix(1., uHuN.y, uHuelle); // Hülle: die Punkte wachsen mit der Nahansicht der Wirbelsäule nur gedämpft mit (feine Bahnen statt Balken)
  want = mix(want, mix(1.5, uDot, smoothstep(.75, 1., fe)) * uDpr, smoothstep(0., .2, fe));
  float size = max(1.6 * uDpr, want), thin = want / size;
  gl_PointSize = size; vSize = size;
  vCol = col;
  vA = clamp(a, 0., 1.) * mix(thin * thin, 1., max(isBrain * kK, isSp * uSolid)) * li; // deckendes Gehirn: auch klein (Schlussbild) in voller Helligkeit – die Tiefe ordnet die Punkte
  // Fassung K: das Gehirn wird deckend gezeichnet (Tiefe), vOp = wie viel davon schon da ist (Auflösen über ein festes Punktmuster)
  vOp = mix(1., front * rev * uNerve * smoothstep(.05, .8, hv) * li * (1. - smoothstep(0., .45, uTxt)), isBrain * kK); // … und lösen sich wieder auf, wenn der Leitsatz entsteht
  vOp *= 1. - uHuelle * isBrain * mix(.45, 1., uHuN.x);
  vOp = mix(vOp, uAuf.w * uSegK.y * aufS * uNerve * (1. - smoothstep(0., .45, uTxt)) * step(-.12, facing), isSp); // abgewandte Punkte entfallen (sie stächen sonst dunkel durch die Fläche)
}`;
const FRAG = `#version 300 es
precision mediump float;
in vec3 vCol; in float vA; in float vSize; in float vSoft; in float vOp; in float vCore; out vec4 o;
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
    float rc = .5 * vCore; // Tiefsee: der leuchtende Kern ist kleiner als der deckende Punkt – einzelne klare Lichtpunkte, die Tiefe bleibt geschlossen
    o = vec4(bg + vCol * vA * uAlpha * (1. - smoothstep(rc - aa, rc, d)), 1.);
    return;
  }
  float a = mix(disc, smoothstep(.5, .0, d), vSoft) * vA * uAlpha;
  if (a < .002) discard;
  o = vec4(vCol * a, a);
}`;

const MAL0 = new Float32Array(16), SEG0 = new Float32Array(24), SEGK0 = [0, 0, -1, 0], AUF0 = [0, 0, 0, 0], HUN0 = [0, 1];
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
      if (u.klar != null) { const k = 1 - u.klar; gl.clearColor(10 / 255 * k, 22 / 255 * k, 27 / 255 * k, k); } // Hülle: der Grund wird durchsichtig, darunter steht die Wirbelsäule von Kapitel 03
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
      gl.uniform1f(U.uQuiet, u.quiet || 0); gl.uniform1f(U.uLight, u.light || 0); gl.uniform1f(U.uGround, u.ground || 0); gl.uniform1f(U.uScanIn, u.scanIn || 0); gl.uniform1f(U.uInner, u.inner || 0); gl.uniform1f(U.uHalf, u.half || 0); gl.uniform1f(U.uLens, u.lens || 0); gl.uniform1f(U.uDense, u.dense || 0); gl.uniform1f(U.uGlass, u.glass || 0.9); gl.uniform1f(U.uAreaK, u.areaK || 0); gl.uniform1f(U.uHirn, u.hirn || 0); gl.uniform1f(U.uShell, u.shell || 0); gl.uniform1f(U.uNs, u.ns || 0); gl.uniform1f(U.uLobe, u.lobe == null ? -1 : u.lobe); gl.uniform1f(U.uAreaI, u.areaI == null ? -1 : u.areaI); gl.uniform1f(U.uSpH, (pts.hirn && pts.hirn.sp) || 0.42); { const B = pts.hirn ? [...pts.hirn.c, pts.hirn.r] : [0, 0, 0, 1]; gl.uniform4f(U.uBC, B[0], B[1], B[2], B[3]); if (U.uMal) gl.uniform4fv(U.uMal, u.mal || MAL0); if (U.uLauf) { const L = u.lauf || [-1, -1, 0, 0]; gl.uniform4f(U.uLauf, L[0], L[1], L[2], 0); const P = u.laufP || [0, 0, 0]; gl.uniform3f(U.uLaufP, P[0], P[1], P[2]); } } { const A = u.area || [0, 0, 0, 0]; gl.uniform4f(U.uArea, A[0], A[1], A[2], A[3]); }
      gl.uniform3fv(U.uStC, u.stc); gl.uniform1f(U.uTxt, u.txt || 0); gl.uniform1f(U.uHStil, u.hstil || 0); gl.uniform1f(U.uKern, u.kern || 1); gl.uniform1f(U.uBunt, u.bunt || 0); gl.uniform1f(U.uScharf, u.scharf || 0); gl.uniform1f(U.uLasur, u.lasur || 1); gl.uniform1f(U.uHuelle, u.huelle || 0); { const N = u.hun || HUN0; gl.uniform2f(U.uHuN, N[0], N[1]); } gl.uniform4fv(U.uSeg, u.seg || SEG0); { const K = u.segK || SEGK0, Y = u.segY || SEGK0, A = u.auf || AUF0; gl.uniform4f(U.uSegK, K[0], K[1], K[2], K[3]); gl.uniform2f(U.uSegY, Y[0], Y[1]); gl.uniform1f(U.uWSp, (pts.hirn && pts.hirn.wSp) || 0.4); gl.uniform4f(U.uAuf, A[0], A[1], A[2], u.hstil === 10 || !(u.solid && pts.hirn && pts.hirn.w0 >= 0) ? 0 : A[3]); } { const L = u.lampe || [0, 0, 0, 0]; gl.uniform4f(U.uLampe, L[0], L[1], L[2], L[3]); gl.uniform1f(U.uLampeS, u.lampeS === undefined ? -99 : u.lampeS); } gl.uniform1f(U.uWelle, u.welle === undefined ? 99 : u.welle);
      gl.uniform4f(U.uPtr, u.ptr[0], u.ptr[1], u.ptr[2], u.ptr[3]);
      const Hn = u.solid && pts.hirn;
      if (!Hn) { gl.uniform1f(U.uSolid, 0); gl.drawArrays(gl.POINTS, 0, count); return; }
      // Fassung K: erst alles vor dem Gehirn (Haut, Knochen) wie gewohnt, dann das Gehirn deckend mit Tiefe,
      // dann der Rest (Leuchten, Bögen, Lichthof, Nerven, Staub) leuchtend darüber – aber hinter dem Gehirn verdeckt
      gl.uniform1f(U.uSolid, 0); gl.drawArrays(gl.POINTS, 0, Hn.b0);
      const glas = u.hstil === 10; // Laterne: das Gehirn leuchtend und durchscheinend, ohne Tiefe
      if (!glas) { gl.enable(gl.DEPTH_TEST); gl.depthFunc(gl.LEQUAL); gl.depthMask(true); gl.disable(gl.BLEND); gl.uniform1f(U.uSolid, 1); }
      if (!((u.huelle || 0) > 0.999 && u.hun && u.hun[0] > 0.995)) { const w0 = !glas && Hn.w0 >= 0 && u.auf && u.auf[3] > 0.004 ? Hn.w0 : Hn.b0; gl.drawArrays(gl.POINTS, w0, Hn.b1 - w0); } // Hülle (?seg=4): Gehirn und Rückenmark sind unsichtbar – gar nicht erst rechnen // Nahblick der Tafel: auch die Wirbelsäule deckend
      if (!glas) { gl.enable(gl.BLEND); gl.depthMask(false); gl.uniform1f(U.uSolid, 0); }
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
export function glContextTiefe(canvas, alpha = false) { // alpha (?seg=4): die Fläche kann ihren dunklen Grund durchsichtig schalten (draw: u.klar)
  const glQ = new URLSearchParams(location.search).get('gl');
  let gl = null;
  try { gl = canvas.getContext('webgl2', { alpha, antialias: false, depth: true, stencil: false, premultipliedAlpha: true, powerPreference: 'high-performance', failIfMajorPerformanceCaveat: !glQ }); } catch (e) { /* ohne WebGL 2 */ }
  if (gl && !glQ) try {
    const e = gl.getExtension('WEBGL_debug_renderer_info');
    if (/swiftshader|llvmpipe|softpipe|software|basic render/i.test(String(gl.getParameter(e ? e.UNMASKED_RENDERER_WEBGL : gl.RENDERER)))) { gl.getExtension('WEBGL_lose_context')?.loseContext(); gl = null; }
  } catch (e) { /* Name nicht lesbar: WebGL bleibt an */ }
  return gl;
}
