// „Von Kopf bis Fuß“ – die Figur als eigene Vektorzeichnung (keine fremde Vorlage).
// Profil, Blick nach links, 1 Einheit ≈ 1 mm. Maße nach üblichen Körpermaßen eines Erwachsenen: Scheitel–Kinn 230, Stirn–Hinterkopf 195,
// Ohröffnung 130 unter dem Scheitel (= Frankfurter Horizontale mit dem unteren Augenhöhlenrand), Nasenlänge 52, Untergesicht 65,
// 7. Halswirbel 120 und Drosselgrube 170 unter der Ohröffnung. Bisher gezeichnet: Scheitel bis Brustkorb (y 34–780).
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

// ---- Haut: Umriss --------------------------------------------------------------------------
// Vorderseite: Scheitel → Stirn → Glabella → Nasenwurzel → Nasenrücken → Nasenspitze → Lippen → Kinn → Mundboden → Kehlkopf → Drosselgrube → Brust
const FRONT = [[150, 34], [176, 36.5], [200, 44], [222, 58], [239, 79], [249.5, 100], [257, 120], [261, 133], [259.5, 140], [256.5, 146.5], [259.2, 153], [265.2, 163], [272.2, 173.5], [279.2, 183.4], [285.4, 189.8], [289.6, 192.4], [291, 195], [289.4, 197.8], [284.5, 199.2], [277, 199.6], [271.6, 200.4], [269.6, 202.6], [269.5, 205.6], [271, 209.5], [272.8, 213.4], [271.6, 216.6], [266.5, 219.6], [269, 222.6], [269.8, 227], [267.8, 231.6], [264.4, 235.6], [263.4, 240.5], [265.2, 247.5], [265, 254.5], [260.5, 261], [251, 264.6], [238, 266], [226, 267.6], [217, 271], [212, 277.5], [210.5, 286], [210, 294], [207.5, 302], [203, 311], [196, 323], [187.5, 334], [190, 348], [200, 372], [215, 415], [232, 470], [245, 530], [250, 595], [246, 670], [240, 780]];
// Rückseite: Scheitel → Hinterkopf → Hinterhaupt → Nacken → 7. Halswirbel → oberer Rücken
const BACK = [[150, 34], [123, 36.5], [99, 48], [81.5, 67], [70, 96], [66, 126], [67, 152], [72, 176], [82, 198], [94, 214], [103, 228], [107, 244], [105, 262], [98, 276], [89, 287], [78, 303], [64, 331], [50, 373], [40, 430], [36, 500], [38, 580], [45, 670], [54, 780]];
// Oberarm (hängt locker, liegt vor dem Rumpf), Schulterhöhe 170 unter der Ohröffnung
const ARM = [[98, 780], [92, 700], [86, 610], [84, 520], [88, 440], [98, 382], [116, 346], [140, 334], [164, 343], [180, 375], [188, 440], [188, 520], [184, 610], [177, 700], [172, 780]];

// ---- Haut: Einzelheiten ----------------------------------------------------------------------
const D = {
  brow: [[229, 140.5], [237, 136], [247, 135], [255, 137.6]],
  lidFold: [[230.5, 150.5], [236.5, 146.6], [244, 146.4]],                    // Lidfalte
  lidUp: [[231, 156], [235.5, 151.8], [240.5, 149.8], [245, 149.2], [247.6, 149.8]],        // Oberlidkante mit Wimpernrand
  lidLo: [[232.5, 156.4], [237.5, 158.2], [241.5, 158.6], [244.6, 158]],      // Unterlidkante
  cornea: [[245, 150.2], [247.4, 153.6], [244.8, 157.4]],                     // Hornhaut im Profil
  iris: [[244.2, 150.4], [242.4, 154], [243.8, 157.8]],
  ala: [[278, 189.4], [273.4, 190.4], [270.8, 194.6], [271.6, 199.8]],   // Nasenflügel
  nostril: [[283.4, 197.6], [280, 196.2], [276.6, 197.4]],
  mouth: [[266.5, 219.6], [260.5, 219.9], [255, 220.8]],
  jaw: [[159.5, 199], [157.2, 213], [159, 226], [168.5, 236]],      // Kieferwinkel unter der Haut
  ear: [[160.5, 151], [156, 139.5], [146.5, 131.5], [136, 131.5], [128, 139], [124.5, 151], [126, 165], [131, 178.5], [138.5, 188.5], [145, 195], [152, 195.5], [156.5, 189.5], [157.5, 181]],   // Helix + Ohrläppchen
  earAnti: [[150, 140.5], [140, 142.5], [135, 152], [136.5, 166], [142.5, 177], [150.5, 180.5]],   // Anthelix
  earTragus: [[160.5, 157], [163.5, 162], [162.5, 168], [158, 172.5], [154, 176], [150.5, 180.5]], // Tragus → Antitragus
  scm: [[150, 213], [158, 241], [172, 283], [186, 322]],                      // Kopfwender, vorderer Rand
  trapez: [[110, 241], [118, 271], [128, 300]],                               // Trapezmuskel, vorderer Rand
  clav: [[187.5, 337], [170, 340.5], [152, 337]],                             // Schlüsselbein
};

// ---- Knochen: Schädel, Unterkiefer, Zähne, Halswirbelsäule -------------------------------------
const SK = {
  vault: [[255.5, 135.5], [250, 104], [238, 76], [216, 54], [186, 43], [152, 41], [118, 44], [94, 58], [79, 82], [73, 114], [73, 150], [80, 180], [92, 198], [110, 205], [128, 203.5], [141, 200]],   // Stirnbein → Scheitel → Hinterhaupt → Schädelbasis
  mastoid: [[141, 200], [146.5, 202], [150.5, 197], [151, 186], [149, 176]],   // Warzenfortsatz
  nasal: [[255.5, 135.5], [253, 142], [251.5, 147.5], [257, 157], [263, 166.5]],  // Glabella → Nasenbein
  apert: [[263, 166.5], [255, 178], [253.5, 189], [256, 194.5], [262, 196.5]],    // Rand der Nasenöffnung → Nasenstachel
  maxilla: [[262, 196.5], [258.5, 202], [260.5, 208.5]],                       // Oberkiefer bis zum Zahnfach
  orbit: [[246, 131], [237.5, 133], [231.5, 140], [230, 150], [233, 160], [240, 166.5], [247.5, 167.5]],   // seitlicher Rand der Augenhöhle
  zygoUp: [[233, 160], [226, 160.5], [203, 159.5], [180, 160], [171, 163]],       // Jochbogen oben
  zygoLo: [[247.5, 167.5], [243, 177], [234, 183], [224, 181], [205, 170.5], [184, 168.5], [173, 169]],  // Jochbein → Jochbogen unten
  maxBack: [[234, 183], [232, 195], [226, 205], [214, 207]],                   // Oberkiefer hinten
  squama: [[204, 128], [190, 112], [168, 104], [146, 110], [132, 128], [126, 152]],   // Schuppennaht
  coronal: [[196, 46], [202, 76], [206, 104], [204, 128]],                     // Kranznaht
  lambda: [[92, 62], [96, 100], [110, 135], [126, 152]],                      // Lambdanaht
};
const MEATUS = [156, 165, 3.6];                                                // äußerer Gehörgang
// Unterkiefer: Gelenkkopf → hinterer Astrand → Kieferwinkel → Unterrand → Kinn → Zahnfach → Kronenfortsatz → Einschnitt
const MANDIBLE = [[166, 168.5], [169.5, 172], [168, 182], [162, 204], [157.5, 220], [160, 227.5], [172, 234], [200, 246], [232, 256.5], [248, 258.5], [256, 253], [257.5, 243], [254, 234], [256.5, 228.5], [244, 227], [222, 224.5], [206, 219], [200, 204], [201, 186], [203, 177.5], [198.5, 178.5], [192, 187], [184, 186.5], [174.5, 176], [170, 169.5]];
// Zahnreihen: Kaulinie und Zahnzwischenräume (obere Reihe bis zum Zahnfach des Oberkiefers, untere bis zum Unterkiefer)
function teeth() {
  const up = [[214, 207], [226, 208], [240, 209], [252, 209.5], [260.5, 208.5]], occ = [[212, 214.5], [226, 216.5], [240, 218], [252, 219], [261.5, 218.6]], lo = [[211, 220.5], [224, 224], [240, 226.5], [250, 227.6], [256.5, 228.5]];
  const U = curve(up, 6), O = curve(occ, 6), L = curve(lo, 6), out = [O, U, [[260.5, 208.5], [263, 214], [261.5, 218.6]], [[261.5, 218.6], [259.5, 223], [256.5, 228.5]]];
  const cuts = [0.1, 0.27, 0.44, 0.58, 0.69, 0.79, 0.88];                      // Mahlzähne breit, Schneidezähne schmal
  const pick = (A, k) => A[Math.round(k * (A.length - 1))];
  for (const k of cuts) { out.push([pick(U, k), pick(O, k)]); out.push([pick(O, k), pick(L, k)]); }
  return out;
}
// Wirbelkörper-Mitten C1–Th2 (Halslordose nach vorn gewölbt, Hals leicht nach vorn geneigt)
const VERT = [['C1', 144, 190], ['C2', 145.5, 205.5], ['C3', 148.5, 221.5], ['C4', 150.5, 237], ['C5', 149.5, 252], ['C6', 146, 267], ['C7', 140, 282], ['Th1', 132.5, 298.5], ['Th2', 124, 316]];

function vertebra(i) {
  const [name, cx, cy] = VERT[i];
  const a = VERT[Math.max(0, i - 1)], b = VERT[Math.min(VERT.length - 1, i + 1)];
  const ang = Math.atan2(b[2] - a[2], b[1] - a[1]) - Math.PI / 2;       // Wirbelkörper steht quer zur Mittellinie
  const c = Math.cos(ang), s = Math.sin(ang);
  const P = (x, y) => [cx + x * c - y * s, cy + x * s + y * c];        // +x = nach vorn (zum Gesicht), +y = nach unten
  const lines = [];
  if (i === 0) {                                                       // Atlas: flacher Ring mit hinterem Bogen
    lines.push(curve([P(12, 0), P(8, -4.2), P(-5, -4.4), P(-16, -3), P(-27, -0.5), P(-30, 2.5), P(-26, 4.5), P(-15, 3.6), P(-5, 4.6), P(8, 4.4)], 6, true));
  } else {
    const h = i === 1 ? 8 : i >= 7 ? 6.6 : 5.6, w = i >= 7 ? 10 : 8.6;
    lines.push(curve([P(w, -h + 1.2), P(w - 1.6, -h), P(-w + 1.6, -h), P(-w, -h + 1.6), P(-w + 0.8, 0), P(-w, h - 1.6), P(-w + 1.6, h), P(w - 1.6, h), P(w + 0.8, h - 1.2), P(w - 0.4, 0)], 5, true));
    if (i === 1) lines.push(curve([P(3.5, -h), P(4.6, -h - 9), P(1, -h - 13), P(-3, -h - 9.5), P(-2.5, -h)], 5)); // Zahn des Axis
    const sp = i === 6 ? 37 : i === 1 ? 27 : i >= 7 ? 36 : 19 + i;      // Dornfortsatz, C7 am längsten
    const dn = i >= 6 ? 9 : 6;
    lines.push(curve([P(-w + 0.4, -3), P(-w - 8, -3.4), P(-w - sp * 0.6, 1 + dn * 0.4), P(-w - sp, dn), P(-w - sp - 1.6, dn + 3.4), P(-w - sp + 3, dn + 4.6), P(-w - sp * 0.55, dn * 0.6 + 4.2), P(-w - 8, 3.4), P(-w + 0.4, 3.4)], 5));
  }
  return { name, at: [W - cx, cy], lines: lines.map(mir) };
}

const line = (P, seg, closed) => mir(curve(P, seg, closed));
const circle = ([x, y, r]) => { const o = []; for (let i = 0; i <= 28; i++) o.push([x + Math.cos((i / 28) * 6.2832) * r, y + Math.sin((i / 28) * 6.2832) * r]); return o; };
const detail = {};
for (const k in D) detail[k] = line(D[k], 8);

export const FIG = {
  w: W, h: 780,
  front: line(FRONT, 10), back: line(BACK, 10), arm: line(ARM, 10),
  detail,
  mandible: line(MANDIBLE, 6, true),
  skull: [...Object.keys(SK).filter((k) => !['squama', 'coronal', 'lambda'].includes(k)).map((k) => line(SK[k], 8)), mir(circle(MEATUS))],
  suture: ['squama', 'coronal', 'lambda'].map((k) => line(SK[k], 8)),
  teeth: teeth().map(mir),
  vert: VERT.map((_, i) => vertebra(i)),
  // Tastpunkte der Untersuchung
  mark: { ear: [W - 156, 165], tmj: [W - 167.5, 171], atlas: [W - 144, 190], c7: [W - 91, 291], shoulder: [W - 140, 338], chin: [W - 262, 256] },
  // Maße für die Bildausschnitte (gespiegelt): Scheitel, Unterkante Kinn, Kehle, Hinterkopf, Nacken, Mitte Hals
  k: { top: 34, chin: 270, throat: W - 207, occiput: W - 66, nape: W - 104, neckY: 240, nose: W - 290.5 },
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
