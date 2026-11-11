// „Von Kopf bis Fuß“ – die Figur als eigene Vektorzeichnung (keine fremde Vorlage).
// Profil, Blick nach links, in Einheiten (1 Einheit ≈ 1 mm bei 23 cm Kopfhöhe). Bisher gezeichnet: Kopf bis Brustkorb (y 30–780).
// Alles sind Stützpunkte → glatte Linienzüge (zentripetale Catmull-Rom-Kurve). So lassen sich dieselben Linien
// als Strich zeichnen (Studie 1), mit Lot und Notizen versehen (Studie 2) oder in Einzelstriche zerlegen (Studie 3).

const W = 320;                         // gezeichnet wird mit Blick nach rechts, ausgegeben gespiegelt (Blick nach links)
const mir = (P) => P.map(([x, y]) => [W - x, y]);

// ---- Kurven ---------------------------------------------------------------------------------
export function curve(P, seg = 8, closed = false) {
  const n = P.length, out = [];
  const g = (i) => (closed ? P[((i % n) + n) % n] : P[Math.max(0, Math.min(n - 1, i))]);
  const kn = (a, b) => Math.sqrt(Math.hypot(b[0] - a[0], b[1] - a[1])) || 1e-3;
  const mix = (a, b, ta, tb, t) => { const k = (t - ta) / (tb - ta); return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k]; };
  const last = closed ? n : n - 1;
  for (let i = 0; i < last; i++) {
    const p0 = g(i - 1), p1 = g(i), p2 = g(i + 1), p3 = g(i + 2);
    const t0 = 0, t1 = t0 + kn(p0, p1), t2 = t1 + kn(p1, p2), t3 = t2 + kn(p2, p3);
    for (let k = 0; k < seg; k++) {
      const t = t1 + ((t2 - t1) * k) / seg;
      const a1 = mix(p0, p1, t0, t1, t), a2 = mix(p1, p2, t1, t2, t), a3 = mix(p2, p3, t2, t3, t);
      const b1 = mix(a1, a2, t0, t2, t), b2 = mix(a2, a3, t1, t3, t);
      out.push(mix(b1, b2, t1, t2, t));
    }
  }
  out.push(closed ? out[0].slice() : P[n - 1].slice());
  return out;
}
export const toPath = (L) => 'M' + L.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join('L');
export function measure(L) {           // Längentabelle eines Linienzugs
  const s = [0];
  for (let i = 1; i < L.length; i++) s.push(s[i - 1] + Math.hypot(L[i][0] - L[i - 1][0], L[i][1] - L[i - 1][1]));
  return s;
}
export function at(L, S, len) {        // Punkt + Richtung bei Bogenlänge len
  len = Math.max(0, Math.min(S[S.length - 1], len));
  let lo = 0, hi = S.length - 1;
  while (hi - lo > 1) { const m = (lo + hi) >> 1; if (S[m] <= len) lo = m; else hi = m; }
  const k = (len - S[lo]) / (S[hi] - S[lo] || 1), a = L[lo], b = L[hi];
  return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, Math.atan2(b[1] - a[1], b[0] - a[0])];
}

// ---- Umriss ---------------------------------------------------------------------------------
// Vorderseite: Scheitel → Stirn → Nase → Lippen → Kinn → Hals → Brust
const FRONT = [[156, 30], [192, 34], [226, 52], [249, 84], [259, 116], [262, 136], [257, 150], [263, 163], [277, 180], [293, 192], [297, 198], [291, 205], [270, 209], [267, 214], [272, 221], [272, 225], [264, 229], [268, 234], [269, 239], [261, 246], [260, 252], [265, 261], [262, 271], [250, 279], [228, 285], [208, 290], [201, 299], [200, 316], [202, 334], [201, 354], [200, 378], [204, 402], [216, 430], [234, 468], [250, 520], [259, 580], [257, 645], [250, 715], [246, 780]];
// Rückseite: Scheitel → Hinterkopf → Nacken → oberer Rücken
const BACK = [[156, 30], [122, 33], [92, 49], [72, 78], [62, 116], [62, 154], [72, 190], [88, 218], [101, 241], [106, 267], [104, 299], [97, 331], [87, 358], [74, 388], [58, 426], [46, 478], [39, 540], [40, 610], [49, 690], [60, 780]];
// Oberarm (hängt locker, liegt vor dem Rumpf)
const ARM = [[104, 780], [97, 705], [89, 615], [86, 535], [93, 466], [112, 428], [139, 415], [164, 425], [180, 462], [187, 532], [184, 612], [177, 702], [173, 780]];

// ---- Einzelheiten ---------------------------------------------------------------------------
const EAR = [[159, 157], [154, 148], [145, 145], [137, 150], [133, 162], [135, 177], [141, 190], [148, 199], [155, 199], [158, 191], [158, 183]];
const EAR_IN = [[154, 157], [147, 153], [141, 158], [140, 170], [144, 181], [150, 187]];
const EYE = [[229, 154], [236, 157], [244, 156], [250, 152]];
const BROW = [[227, 141], [237, 135], [249, 134], [257, 138]];
const NOSTRIL = [[286, 196], [279, 200], [281, 206]];
const MOUTH = [[264, 229], [256, 230], [249, 233]];
const JAW = [[161, 208], [158, 230], [161, 250], [178, 263], [208, 271], [236, 275]];
const SCM = [[151, 214], [157, 246], [170, 300], [187, 358], [200, 398]];       // Kopfwender (Muskel hinterm Ohr zum Brustbein)
const CLAV = [[203, 404], [180, 412], [152, 408]];                  // Schlüsselbein

// ---- Anatomie (Kiefer, Halswirbelsäule) -------------------------------------------------------
const MANDIBLE = [[170, 174], [173, 190], [168, 220], [163, 246], [172, 258], [200, 266], [236, 272], [254, 271], [261, 258], [258, 245], [255, 234], [240, 232], [214, 230], [198, 223], [192, 202], [196, 187], [188, 192], [180, 186], [174, 174]];
// Wirbelkörper-Mitten C1–Th2 (Halslordose: nach vorn gewölbt)
const VERT = [['C1', 145, 212], ['C2', 147, 231], ['C3', 151, 250], ['C4', 153, 268], ['C5', 152, 286], ['C6', 148, 304], ['C7', 142, 323], ['Th1', 134, 343], ['Th2', 125, 364]];

function vertebra(i) {
  const [name, cx, cy] = VERT[i];
  const a = VERT[Math.max(0, i - 1)], b = VERT[Math.min(VERT.length - 1, i + 1)];
  const ang = Math.atan2(b[2] - a[2], b[1] - a[1]) - Math.PI / 2;       // Wirbelkörper steht quer zur Mittellinie
  const c = Math.cos(ang), s = Math.sin(ang);
  const P = (x, y) => [cx + x * c - y * s, cy + x * s + y * c];        // +x = nach vorn (zum Gesicht), +y = nach unten
  const lines = [];
  if (i === 0) {                                                       // Atlas: flacher Ring
    lines.push(curve([P(15, 0), P(9, -5), P(-6, -5), P(-17, -3), P(-27, 0), P(-17, 4), P(-6, 5), P(9, 5)], 6, true));
  } else {
    const h = i === 1 ? 9 : 6.5, w = 12;
    lines.push(curve([P(w, -h + 1.5), P(w - 2, -h), P(-w + 2, -h), P(-w, -h + 2), P(-w, h - 2), P(-w + 2, h), P(w - 2, h), P(w + 1, h - 1.5), P(w + 0.5, 0)], 5, true));
    if (i === 1) lines.push(curve([P(4, -h), P(5, -h - 9), P(1, -h - 12), P(-3, -h - 9), P(-2, -h)], 5)); // Zahn des Axis
    const sp = i === 6 ? 27 : i === 1 ? 22 : i >= 7 ? 25 : 17;         // Dornfortsatz, C7 am längsten
    lines.push(curve([P(-w, -3), P(-w - 8, -2), P(-w - sp, 6), P(-w - sp - 2, 10), P(-w - sp + 4, 11), P(-w - 9, 5), P(-w, 4)], 5));
  }
  return { name, at: [W - cx, cy], lines: lines.map(mir) };
}

const line = (P, seg, closed) => mir(curve(P, seg, closed));

export const FIG = {
  w: W, h: 780,
  front: line(FRONT, 10), back: line(BACK, 10), arm: line(ARM, 10),
  detail: { ear: line(EAR, 8), earIn: line(EAR_IN, 8), eye: line(EYE, 8), brow: line(BROW, 8), nostril: line(NOSTRIL, 8), mouth: line(MOUTH, 8), jaw: line(JAW, 8), scm: line(SCM, 8), clav: line(CLAV, 8) },
  mandible: line(MANDIBLE, 6, true),
  vert: VERT.map((_, i) => vertebra(i)),
  // Tastpunkte der Untersuchung
  mark: { ear: [W - 150, 172], tmj: [W - 171, 177], atlas: [W - 145, 212], c7: [W - 104, 333], shoulder: [W - 137, 430], chin: [W - 262, 268] },
};
// geschlossene Kopf-Hals-Fläche (für „liegt ein Punkt in der Figur?“)
export const SILHOUETTE = FIG.front.concat(FIG.back.slice().reverse());
export function inside(P, x, y) {
  let c = false;
  for (let i = 0, j = P.length - 1; i < P.length; j = i++) {
    const [xi, yi] = P[i], [xj, yj] = P[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
}
