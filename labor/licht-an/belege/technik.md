# Technik-Inventar „Hausbesuch · Puls“ – Grundlage für ein neues Projekt

Stand 10.11.2026 · nur gelesen, im Repository nichts geändert (`git status` leer). Pfade ohne Vorsatz = `labor/src/…`.
Kennzeichnung: **[B]** belegt (Fundstelle Datei:Zeile oder eigene Messung), **[A]** Einschätzung/Annahme, **[O]** offen, nicht geprüft.

**Ziel dieses Inventars (hart):** jede Aussage mit Fundstelle oder Messung; der Analyse-Bau muss den ausgelieferten Stand bytegenau treffen.
**Prüfung:** Quellen nach Scratchpad kopiert, mit denselben Versionen (`npm ci`) gebaut → JS der Fusion **742 831 B**, identisch mit dem `<script>` in `labor/hausbesuch-puls.html` [B]. Damit gelten Bündel-Aufschlüsselung und Generator-Messungen für genau den veröffentlichten Stand.
**Nicht erreicht / fehlt:** kein Grafikchip im Container (WebGL = SwiftShader) → **keine belastbaren Bildraten und Startzeiten**; kein echtes iPhone/Android; WebGPU-Probe nur als Bündelgröße, nicht ausgeführt. Ein Gerät mit GPU (oder Kais PC/iPhone mit `tools/frames.cjs`-Logik) würde absolute Zahlen liefern.

Mess-Skripte und Rohdaten (alle unter `‹Scratchpad›/bestand/`): `build/meta.mjs` + `build/meta.txt` (Bündel), `build/gen.mjs`, `build/gen2.mjs` + `.txt` (Generatoren in Node), `gpu.cjs` + `gpu-pc.json`, `gpu-m.json` (WebGL-Zähler im Browser), `check2.cjs` + `check2.txt` (ohne JavaScript; Taktgeber-Reserve an/aus), `build/probe/` (WebGL vs. WebGPU), `probe2/` (OGL).

---

## 0 · Das Wichtigste in zehn Zeilen

1. Die Seite ist **eine 931-KB-Datei**, davon 80 % JavaScript; **three.js allein 552 KB = 74 % des Skripts**, eigener Code nur 93 KB (12,5 %) [B Messung].
2. Die 3D-Welt läuft in **drei WebGL-2-Kontexten** (Haupt, Manuthera, Leistungen) mit **14 Shader-Programmen** [B Messung].
3. An der Wirbelsäule zeichnet der PC je Bild **≈ 428 000 Punkte + 163 000 Dreiecke**, das Handy **≈ 157 000 Punkte + 163 000 Dreiecke** – am Handy sind die *unsichtbaren dunklen Kerne* mehr Geometrie als alle sichtbaren Punkte [B Messung].
4. **Fehler:** Die Wirbelsäule wird nach Behandlung 1 nicht abgeschaltet; sie läuft unsichtbar weiter mit (gemessen bis zum Seitenende; rechnerisch ≈ 4 min bei 60 B/s) [B `fusion/main.js:436`, `fusion/spine.js:213-217`].
5. Der Aufbau der Punktwolken kostet auf einem 2,1-GHz-Server-Kern **≈ 3,2–4,5 s Rechenzeit (PC-Mengen)** im Hauptthread; die „8-ms-Scheiben“ werden nicht überall gehalten (längste Strecken 30–177 ms) [B Messung].
6. Praxis und Wirbelsäule lassen sich **unverändert in Node ausführen** → sofort Worker- oder Vorab-Rechnen-tauglich [B Messung].
7. Wärme fehlt nicht wegen der Partikel, sondern weil der Shader **ein festes, farbloses Richtungslicht, keine Lampen, keinen Dunst, keine Schatten** kennt und die Palette kalt ist [B `fusion/scene.js:81,133-135`].
8. `src/haus` erzeugt Wärme mit **Tageszeit-Tabelle, 5 warmen Punktlichtern, Leucht-Materialien, Sonnenstrahlen, Bloom, Körnung, Wohn-Gegenständen**; fast alles davon ist als Uniform/Attribut in die Punktwelt übertragbar [B `haus/main.js:65-170`].
9. **WebGPU/TSL** hieße: alle 46 `ShaderMaterial` neu schreiben, Punkte als Instanz-Sprites, +286 KB Bündel – ohne automatischen Tempogewinn [B Messung/Quelle three r187].
10. Empfehlung: **Text zuerst, eine Engine als nachgeladenes Modul, ein Kontext, Rechnen im Worker, ein gemeinsames Lichtmodell mit Tageszeit** – Bausteine behalten, Hülle ersetzen.

---

## 1 · Bausteine: Schnittstelle, Qualität, Wiederverwendbarkeit

Urteil: **B** behalten · **V** verbessern · **E** ersetzen.

| Baustein | Fundstelle | Schnittstelle [B] | Qualität / Grenzen | Urteil |
|---|---|---|---|---|
| **Wirbelsäule – Geometrie** | `shared/spine.js:12-216` | `buildSpineGen()` → `{group, levels[26], curve, vertebrae, discs, canal}`; `zoneOf(id)` (9 Zonen, `:23-29`); `rootCurves(sp)` (50 Nervenwurzeln, `:219-238`) | Prozedural, lizenzfrei („kein externes 3D-Modell“, `:1-2`); C1–Co mit Atlas, Dens, Kreuzbein, Fortsätzen, physiologischen Krümmungen (`:181`). „Anatomisch vereinfacht“ (`:1`) – Maße nicht gegen Referenzdaten geprüft [O]. Läuft ohne DOM [B Node]. | **B** |
| **Wirbelsäule – „Schichten“/Körnung** | `test-4/shapes.js:213-383` | `spineStippleGen()` → `{makeSlicesGen(n, step, band, diff), makeGrainGen(n), coreGeo, curves[51], levels, SC, CY}` | Das Erkennungsmerkmal: CT-Schnittlinien senkrecht zur Mittellinie (`:281-320`), Deckplatten/Bandscheiben/Fortsätze unterschieden (`DIFF :205`, `:345-351`). Kern: 137 760 Dreiecke, 9,9 MB, **am Handy nicht verkleinert** (`:364-368`) [B Messung]. `Math.random` ohne Startwert → jedes Mal anderes Muster. | **B**, Kern **V** |
| **Wirbelsäule – Bühne in der Welt** | `fusion/spine.js:21-221` | `createSpine(scene, shared, {desktop})` → `build(n, step)`, `place(center, height)`, `setSolid(0..1)`, `setStip(fPx)`, `segCenter(i)`, `zoneOf(i)`, `STOPS[6]`, `U` | Saubere, frei platzierbare Fassung (`uXf`, `uRot`). Shader ist **Kopie** aus `test-4/main.js:391-587`. Abschalt-Fehler siehe §4.4. | **V** |
| **Nerven mit Signalen** | `fusion/spine.js:103-171` | Kurven als Float-Textur 128 × 51, Partikel fließen im Vertex-Shader, zwei Impulse je Takt (`:137-150`), „Geister“-Durchgang durch den Knochen (`:168-169`) | Stark, billig (5 600 Punkte × 2 am PC). | **B** |
| **Figur „Spannung lösen“** | `fusion/figure.js:12-122`, Form `test-4/shapes.js:22-101` | `createFigure(scene, n, shared)` → `place(foot, height, yaw)`, `plane()`, `paint(hit)`, `release()`, `tension()`, `at(bx,by)`, `touched` | Mechanik gut: 100 × 215-Entspannungskarte als Textur (`:22-26`), Streichen malt (`:85-100`), 7 Spannungszonen (`shapes.js:12-20`). **Form ist eine 2D-Vorderansicht mit aufgeblasener Tiefe** (`shapes.js:87-94`), darum muss sie sich zur Kamera drehen (`fusion/main.js:442-444`) – von der Seite flach. `tension()` liest alle 300 ms das ganze Bild zurück (`figure.js:104`, `main.js:180-186`). | Prinzip **B**, Körper **E** (echte 3D-Figur aus Kapseln/Ellipsoiden wie die Liegende in `manu/ideaA.js:64-81`, gestochen mit Kern) |
| **Praxis-Punktwolke** | `test-4/praxis.js:32-172` | `praxisScanGen(nFurn, fine)` → `{lines, furn, core, spacing, count}`; dazu `ROOMS` (Texte + Therapien je Raum, `:16-22`), `P()`, `EYE`, `roomOf()` | Grundriss V10 schematisch; Möbel aus Quadern/Zylindern/Kugeln (`:120-152`); Wände ohne Dicke, **ohne Fenster, ohne Decke** (`:51-57`); Linienpunkte tragen Schein-Normalen (0,1,0) (`:39`). Kommentar: „später austauschbar gegen einen echten Scan“ (`:5`). PC: 33 909 Linien- + 52 474 Möbelpunkte (angefordert 85 000; Abbruch durch Sättigung/Versuchsgrenze, `stipple.js:42`) + 25 444 Kern-Dreiecke; Handy 17 034 + 19 489 + dieselben 25 444 [B Messung]. Einheit = 2 m, Boden y = −3 (`:10-14`) – Altlast aus dem Partikel-Haus. | **V** (Daten/Wärme), Verfahren **B** |
| **Manuthera-Bühne** | `manu/ideaA.js:22-233` | `initAGen(canvas, ui)` → `{st, update(t,dt), select(i,user), MODES, count}`; `ui = {transparent, isPaused, onMode, onAmount}` | Sehr gut: Liege in 3 Segmenten, Punkte und Kern folgen per Matrizen `uM[3]` (`stipple.js:96-107`), 4 Bewegungen, durchscheinende Wirbelsäule. **Erzeugt eigenen Renderer** (`:23` → `common.js:29-52`) → eigener Kontext, liegt als Ebene *über* Raum 2 statt *im* Raum (`fusion/main.js:222-236`, Annahme 3 in `labor/UEBERGABE.md:18`). | **V** (in die Welt setzen) |
| **Leistungs-Motive** | `test-4/services.js:124-250` | `initServicesGen(canvas, ui)` → `{st, update, show(i), current}`; `MOTIFS[12]` | 7 000/4 500 Punkte wandern zwischen 12 Piktogrammen, 13 Bewegungsarten im Shader (`:197-211`). Eigener Kontext. Inhaltlich losgelöst vom Haus. | **V/E** – besser „Leistung am Ort“ (siehe §6.3) |
| **Rundgang aus Augenhöhe** | `ego/tour.js:165-408` | `createEgo({canvas, ui, keys, mobile, reduced, still})` → `start/stop/reset/setPrx/warm/intro/go` | In der Fusion durch die Scroll-Zeitleiste ersetzt (`fusion/main.js:103-136`: `ST` Stationen, `TL` Aufenthalte/Wege, `legPose :333-339`). **Verloren gingen dabei die Bedarfs-Schalter** „Ohne Fahrt / Ruhig / Größere Punkte“ (`tour.js:205, 259-264`); in `fusion/` gibt es sie nicht [B grep]. | Zeitleiste **B**, Schalter **zurückholen** |
| **Haus / Tür / Schild** | `fusion/scene.js:16-165` | `houseUniforms()`, `buildHouse(scene, prx, U)` → `{group, lines, furn, core, sign}`; Tür über `uDoor`/`uHinge` (`:73-74`), Aufbau-Schnitt `uCut`, Helligkeit `uLum` | Tür-Schwenk im Shader elegant. Schild prozedural (`:16-67`). **Doppelt** vorhanden (`ego/tour.js:20-152`, laut Kopf `scene.js:1-5` bewusst kopiert). Es gibt **kein Haus von außen** (kein Dach, keine Fassade, keine leuchtenden Fenster) – „Vor der Tür“ zeigt Scan-Linien der Wand. `housePoints` (`shapes.js:140-178`) wird in der Fusion nicht benutzt [B Importe `fusion/main.js:7-17`]. | **V** (Ankunft wärmer, ein Modul) |
| **Aufbau in Zeitscheiben** | `shared/slice.js:5-29` | `runSliced(gen, budget = 8)`, `runSync(gen)`, `every(n)`; Aufträge nacheinander (`:11, 24-25`) | Idee richtig, Generatoren sind die passende Einheit. Grenzen §4.3. | Generatoren **B**, Ausführung **E** (Worker) |
| **Stipple „gestochen“** | `manu/stipple.js:23-183`, Raster `shared/slice.js:33-68` | `stippleGen(parts, n)` → `{geo, count, spacing}`; `coreOfGen(parts)`; `coreMaterial(U, NSEG)`, `stippleMaterial(U, NSEG, decl, colorGLSL)`, `stipSize()`; Teil = `{geo, kind, map, keep?, dens?, core?}` | Kern der Handschrift: Mindestabstand (Poisson-artig), dunkler Kern, Licht je Punkt. `toGeo` legt immer 7 Attribute an (`:83-93`); Haus-Shader nutzen davon 3 → > 50 % der Bytes tot (Kern 52 B/Ecke, gebraucht 24) [B]. | **B**, entschlacken |
| **Termin-Blatt** | `fusion/main.js:577-610`, `fusion/page.html:241-262` | `<dialog id="terminSheet">`, Öffner `[data-termin]`, iframe erst nach „Kalender laden“, `sandbox` (`:599`) | Datenschutz-sauber, zugänglich (Fokus zurück `:593`). Wörtlich aus Puls kopiert. | **B** als eigenes UI-Modul |
| **„Bewegung anhalten“** | `fusion/main.js:29-48`, CSS `fusion/style.css:79` | `localStorage['hop-motion']`, Klasse `html.paused`, Zeit-Uniform steht (`:371`), Bühnen über `isPaused` (`ideaA.js:200`, `services.js:240`) | Vorbildlich, seitenübergreifend. Aber: es wird **weiter jedes Bild gezeichnet** (`:505`), auch wenn nichts sich bewegt. | **B** + Zeichnen nur bei Änderung |
| **Rückfall ohne WebGL** | `manu/common.js:26-28`, `fusion/main.js:73-76`, `fusion/style.css:282-301` | `glContext()` prüft WebGL 2 vorab → `html.no-gl`; Nebenbühnen `no-gl-manu`/`no-gl-serv` (`main.js:235, 253`) | Funktioniert, aber als *Ausnahme* gebaut: Grundzustand ist `.chap{opacity:0;visibility:hidden}` (`style.css:84`), kein `<noscript>`. Gegenprobe mit abgeschaltetem JavaScript (`check2.cjs`): **nur Kapitel 0 ist sichtbar, Kapitel 1–6 und „Bis bald“ bleiben verborgen**, der Rundgang ist 13 500 px leere Fläche [B Messung]. In der Fusion gibt es nur ein Standbild (Manuthera, `style.css:294`). | **E** → umdrehen: lesbare Seite ist der Grundzustand |
| Nebenstücke | `zuhause/main.js`, `zuhause/spine-viewer.js:20`, `portrait/demos.js:28,113,192`, `portrait/bust.js:74-110`, `manu/ideaB.js:49`, `manu/ideaC.js:16` | Haus als Menü mit Schnittblick (`zuhause/main.js:54-56`); drehbarer Wirbelsäulen-Betrachter; Porträt als Stich/Partikel→Foto/3D-Scan; Manuthera „Raum schaffen“ (LWS-Nahaufnahme) und „Drei Ebenen“ | Fundus. Besonders `ideaB` (Bandscheibenräume öffnen sich) und Porträt Idee 1/2 (wartet auf Kais Foto, `bust.js:1-3`). | Fundus |

---

## 2 · Wie der Partikel-Shader arbeitet

Es gibt drei Zutaten, die zusammen den Stil ergeben [B]:

**(a) Leuchtpunkte** – additiv, ohne Tiefenschreiben: Wand-/Boden-Linien, Staub, Figur, Nerven, Motive.
- Größe: `gl_PointSize = clamp(uPix * k * 7. / d, 1.3, 4.5) * uBig` (`fusion/scene.js:115`); `uPix = Pixeldichte × Bildhöhe/900 × (Handy 1,2)` (`fusion/main.js:322`).
- Farbe nach Art: Boden Petrol × 0,85, Wand Bone × 0,5, Akzent Bernstein × 1,1, Kante Bone × 0,9 (`scene.js:112`).
- Deckkraft: Art × Nah-Ausblenden (0,12–0,5) × Fern-Abfall (ab 7, bis −60 %) × `uLum` (`scene.js:116-118`).
- Fragment: weicher runder Punkt `smoothstep(.5, .12, d) * vA` (`scene.js:123`); weil additiv, summieren sich dichte Stellen zu Helligkeit.

**(b) Gestochene Punkte** – deckend, mit Tiefe: Möbel, Knochen, Liege, Schild.
- Lage: Mindestabstand auf der Oberfläche, mit Flächennormalen (`manu/stipple.js:42-58`).
- Größe aus dem Punktabstand: `uStip = fPx · spacing · 0,62` → `clamp(uStip / d, 1.3, 7.)` (`fusion/main.js:82, 492`; `scene.js:140`) – die Punkte bleiben bei jeder Entfernung „auf Lücke“.
- Licht je Punkt (im Vertex-Shader): Lambert mit **fest eingebauter** Richtung `vec3(.4,.8,.5)`, Grundlicht 0,3, dazu bläulicher Rand `cBlue * rim * .12` (`scene.js:133-135`). Wirbelsäule: Richtung `(.48,.72,.5)`, Umriss-Aufhellung, Deckplatten heller (`fusion/spine.js:33, 63-80`). Liege: `(-.38,.78,.5)` (`stipple.js:107`). → **drei verschiedene Lichtrichtungen in einer Welt.**
- Fragment: Rand jedes Punkts 45–50 % dunkler → wirkt wie eine kleine Perle (`scene.js:147`, `spine.js:94`).
- Nahbereich: Punkte lösen sich über Zufallsschwelle auf (`scene.js:141-142`).

**(c) Dunkler Kern** – dieselbe Form als Netz, 0,006–0,012 nach innen versetzt, Farbe `cCore #0E1C22` + 4–5 % Licht (`scene.js:151-158`, `spine.js:36-52`, `stipple.js:110-128`). Er verdeckt die Rückseite und gibt Volumen. Reihenfolge: Kern → Möbel → Linien → Schild → Staub → Figur (`scene.js:160, 64, 204`; `figure.js:73`).

**Tiefe:** nur über Punktgröße ~1/d, den Fern-Abfall der Linien und Verdeckung. Kein Nebel, keine Schatten, keine Umgebungsverdeckung.
**Abdunkeln:** `uLum` multipliziert die Farbe (Haus, Figur, Wirbelsäule; `fusion/main.js:476-485`), Staub über `uDust`. Hintergrund `0x0A161B` (`main.js:79`). Darüber CSS: Verlauf `.letterbox`, Körnung `.grain` 5 % (`fusion/style.css:45-53`).
**Aufbau-Schnitt:** `uCut` mit bernsteinfarbenem Band `exp(-((y-uCut)·14)²)` (`scene.js:117-119, 136-137`).
**Farbraum:** keine Tonwert-Abbildung, nur `#include <colorspace_fragment>`; kein Bloom.

### Stellschrauben für Wärme, ohne neu zu schreiben

| # | Schraube | Aufwand | Fundstelle zum Ansetzen |
|---|---|---|---|
| 1 | **Palette als Preset** – alle Farben sind schon Uniforms: `cBone #D9DCD3` (kühl), `cPetrol`, `cBlue`, `cCore`, Hintergrund. Warme Presets (Knochenweiß `#F3EADA` wird bei der Wirbelsäule schon benutzt, `spine.js:26`) überblenden. | keine Shader-Änderung | `scene.js:77-83`, `main.js:79` |
| 2 | **Licht als Uniform** statt Konstante: `uLDir`, `uLCol`, Himmel/Boden-Grundlicht `mix(cGround, cSky, n.y*.5+.5)`; Randlicht-Farbe als Uniform (heute fest `cBlue`). | 3–4 Zeilen je Stipple-Shader | `scene.js:133-135`, `spine.js:33,63-76`, `stipple.js:107,140-141` |
| 3 | **Lampen im Raum**: die Leuchten stehen schon in der Geometrie – Pendel über Tresen, Liege 1, Manuthera; Stehleuchte im Wartebereich (`praxis.js:97, 123, 129, 135, 141`). Uniform-Feld `uLamp[4]` (Ort, Stärke), im Vertex-Shader `Σ I/(1+k·d²)` × Lampenfarbe; für Möbel mit Normalen, für Boden-/Wandlinien nur nach Abstand (die haben keine echten Normalen, `praxis.js:39`). | ~10 Zeilen, rechnet je Punkt (billig) | wie 2 + `scene.js:112-119` |
| 4 | **Glühen**: (a) ohne Nachbearbeitung – zweiter, großer, sehr leiser Additiv-Punkt nur für die Leuchten, wenige hundert Punkte. Dafür brauchen Leuchten eine **eigene Art**: heute teilen sie Art 4 (Bernstein) mit Tasse, Teppich, Ball und Läufer (`praxis.js:97, 122, 124, 144, 152`). (b) echtes Bloom wie im Haus (`haus/main.js:157-161`), kostet Füllfläche (halbe Auflösung) und Bündel in der Größenordnung 15–20 KB [A; Haus trägt 24,7 KB aus `three/examples` inkl. Rundquader, die Fusion 7,0 KB, B Messung]. | (a) klein, (b) mittel | `scene.js:134`, `praxis.js:97` |
| 5 | **Dunst**: Staub gibt es (`scene.js:170-207`, 3 000/1 400 Punkte, Farben eigene Uniforms `:183`) → warm färben, Dichte im Lampenkegel anheben; Fern-Abfall der Linien zu **Farb-Dunst** machen: `mix(col, cHaze, smoothstep(2., 9., d))`. | 1–3 Zeilen | `scene.js:116, 183, 196-198` |
| 6 | **Weiche Schatten**: Schattenkarten gibt es für Punkte nicht geschenkt. Die Welt ist aber statisch → **beim Erzeugen einbacken**: Attribut `aAO` (Abstand zum Boden/Nachbarn, Lampen-Sichtbarkeit) je Punkt; Bodenlinien unter Möbeln abdunkeln (Grundflächen sind bekannt, `praxis.js:73-105`). | Generator + 1 Zeile Shader | `stipple.js:52-56`, `praxis.js:155` |
| 7 | **Material durch Punktmuster**: `aKind` steuert heute nur Farbe (5 Arten, `scene.js:134`). Holz = Punktreihen entlang der Maserung (wie „Schichten“), Stoff = feiner/dichter, Pflanze = unregelmäßig. Dichte je Teil gibt es schon (`dens`, `stipple.js:27, 48`). | Generator | `praxis.js:72-86` |
| 8 | **Belichtung/Vignette**: nur mit einem Ausgabe-Durchgang (dann auch AgX wie im Haus). Ohne: CSS-Vignette/Körnung sind da. | mittel | `style.css:45-53` |

[A] Die größte Wirkung je Zeile haben 3 (Lichtinseln), 1 (Palette) und 5 (Farb-Dunst); zusammen machen sie aus dem „Scan“ einen Raum bei Abendlicht, ohne die Handschrift zu ändern.

---

## 3 · Wie `src/haus` Wärme und Tageszeit erzeugt – und was übertragbar ist

| Mittel im Haus | Fundstelle [B] | Übertragbar in die Punktwelt? |
|---|---|---|
| **Tageszeit-Tabelle** (Morgen/Mittag/Abend/Nacht): Sonnenrichtung, -farbe, -stärke, Himmel oben/Horizont, Halbkugel-Licht, Lampenanteil 0–1, Nebelfarbe, Belichtung; Wahl nach Uhr, Überblendung 2,6 s | `haus/main.js:65-98, 203-206` | **Ja, 1:1 als Uniform-Presets** (§2 Nr. 1–3). Begrüßung nach Uhrzeit gibt es in der Fusion schon (`fusion/main.js:146`), das Licht dazu fehlt. |
| **Sonne mit Schatten** (PCF 2048²), Halbkugel-Licht `#dce7f2/#b9a58a`, Grundlicht `#fff4e6` | `haus/main.js:35, 55-60` | Richtung/Farbe ja; Schatten nur eingebacken (§2 Nr. 6). |
| **5 warme Punktlichter**: Laterne `#FFB866`, drei Pendel und Stehleuchte `#FFC27A`, Stärke × Tageszeit | `haus/scene.js:128, 315, 322`; `main.js:79` | **Ja** – Lampenorte existieren in `praxis.js`. |
| **Leuchtende Materialien**: Lampenschirme, Birnen, Fango glimmt `#E07B39`, 14 Lichterketten-Birnen | `haus/scene.js:125-127, 200-201, 255, 310-314` | Ja – als hellere/größere Punkte (Art „Glut“) + Halo. |
| **Sonnenstrahlen** durch Fenster (additive Flächen entlang der Sonnenrichtung) + 2 600 Staubkörner in Sonnenfarbe + Dampf über der Teetasse (70 Punkte) | `haus/main.js:100-154` | Staub/Dampf ja (sind schon Punkte). Strahlen brauchen **Fenster – die Praxis-Wolke hat keine** (`praxis.js:51-57`). |
| **Stoffliche Materialien**: Eiche, Salbei, Honig, Leinen, Terrakotta, Messing; prozedurale Texturen (Dielen, Putz, Teppich, Fußmatte „Willkommen“, Tischkarte „schön, dass Sie da sind“) | `haus/scene.js:14-35`; `haus/textures.js:14-94` | Farben ja (mehr Arten in `aKind`); Textur → Punktmuster (§2 Nr. 7). |
| **Wohn-Gegenstände**: Tee mit Dampf, Kanne, Vase mit Blumen, Bücherregal, Schal an der Garderobe, wehende Vorhänge, schwankende Pflanzen, Sofa mit Kissen und Decke, Gartenbank | `haus/scene.js:138-155, 160-183, 249-255`; `main.js:266-269` | Ja, als Stipple-Teile; Tasse, Pflanzen, Sofa, Teppich stehen schon in `praxis.js:122-130`. **Das ist der Kern von „Zuhause“ – Dinge, nicht Technik.** [A] |
| **Nachbearbeitung**: AgX-Tonwerte (Belichtung 1,05–1,25), Bloom (0,32 / 0,65 / 0,88, halbe Auflösung), Vignette 0,32, Filmkorn 0,028; Kantenglättung an | `haus/main.js:32-34, 157-170` | Ja, technisch unverändert; kostet Füllfläche. |
| **Himmel** (Verlauf + Sonnenhof), Nebel 30–90 m | `haus/main.js:37, 41-52` | Als Hintergrund-Verlauf/Dunstfarbe ja. |
| **Kamera**: Kurve mit Verweilen, Zeiger-Parallaxe, „Atmen“ | `haus/main.js:182-186, 257-261` | Fusion hat Atmen und Umschauen (`fusion/main.js:496-501`). |
| **Warme Schrift/Fläche**: Fraunces + Hanken Grotesk, Hafer/Leinen/Honig | `haus/style.css:4-6` | Reine CSS-Frage; Fusion nutzt Archivo auf `#0A161B` (`fusion/style.css:5-10`). |

Schwächen des Hauses [B]: alles in einem Rutsch beim Start (`buildHouse` ohne Zeitscheiben, `haus/main.js:62`), `innerWidth` je Bild (`:253-277`), kein „Bewegung anhalten“ [B grep], ohne WebGL nur ein Farbverlauf (`haus/style.css:25-26`), Schatten + Bloom + Kantenglättung → laut `labor/CLAUDE.md` „nur PC“. Zwei verschiedene Grundrisse: Haus = offenes Wohnhaus 18 × 12 m mit Garten (`haus/scene.js:44-52`), Praxis = fünf Räume nach V10 (`praxis.js:16-22`) – **die Geometrie ist nicht austauschbar**, nur die Mittel.

---

## 4 · Leistungs-Engpässe und Altlasten

### 4.1 Gewicht [B Messung]
| Teil von `hausbesuch-puls.html` | Bytes | Anteil |
|---|---|---|
| gesamt | 931 101 | 100 % |
| JavaScript (ein `<script>` am Ende, `fusion/page.html:266`) | 742 831 | 79,8 % |
| Schriften als Base64 im CSS (`labor/build.mjs:108-119, 142`) | 130 233 | 14,0 % |
| CSS ohne Schriften | 33 959 | 3,6 % |
| HTML | 24 078 | 2,6 % |

Ausgeliefert von GitHub Pages: **gzip, 326 975 B, `cache-control: max-age=600`**, kein Brotli (Abruf mit `curl`, 10.11.) [B].

| Im Skript | Bytes | Anteil |
|---|---|---|
| three (Kern + WebGLRenderer) | 552 527 | 74,4 % |
| gsap (genutzt: Taktgeber + 2 Animationen, `fusion/main.js:63, 183, 509, 513`) | 70 516 | 9,5 % |
| lenis | 19 414 | 2,6 % |
| three/examples (MeshSurfaceSampler, mergeGeometries) | 6 971 | 0,9 % |
| **eigener Code** | **93 222** | **12,5 %** |

Vergleichsproben (nur Bündelgröße, nicht ausgeführt): kleinstes Punkte-Beispiel mit three/WebGL **534 830 B** (133 KB gzip) – das ist der Sockel, unter den man mit `WebGLRenderer` nicht kommt; dasselbe mit einer dünnen WebGL-Schicht (OGL 1.0.11) **52 827 B** (15 KB gzip) [B].
Folgen [A]: nichts ist getrennt zwischenspeicherbar (Schriften und three hängen an jeder Seite neu; `zuhause`, `manuthera`, `portrait`, `rundgang-ego` tragen je 540–550 KB three, `build/meta.txt`), und der Browser muss 743 KB Skript übersetzen, bevor ein Knopf reagiert.

### 4.2 Was je Bild gezeichnet wird [B Messung `gpu-pc.json`, `gpu-m.json`; Werte je Zeichendurchgang]
| Stelle | PC 1440 × 900: Punkte / Dreiecke / Aufrufe | Handy 390 × 844: Punkte / Dreiecke / Aufrufe |
|---|---|---|
| Vor der Tür | 116 810 / 25 444 / 5 | 64 927 / 25 444 / 5 |
| Empfang mit Figur | 146 810 / 25 444 / 6 | 78 927 / 25 444 / 6 |
| Wirbelsäule | 428 010 / 163 204 / 9 (+30 000 solange die Figur ausblendet) | 156 527 / 163 204 / 9 |
| Manuthera (zweiter Kontext zusätzlich) | + 24 243 / 12 008 / 4 | + 11 343 / 12 008 / 4 |
| Leistungen (dritter Kontext zusätzlich) | + 7 000 / 0 / 1 | + 4 500 / 0 / 1 |
| **nach dem Rundgang** (Leistungen, Hausordnung, Kontakt) | **weiter 428 010 / 163 204 / 9** | **weiter 156 527 / 163 204 / 9** |

- **Kontexte: 3 × WebGL 2** (`gl`, `glManu`, `glServ`); Programme: 14 (9 + 4 + 1). In Puls · Scan sind es vier Zeichenflächen (zusätzlich `egoGl`) [B].
- **Grafikspeicher (Puffer):** PC 30,7 + 3,1 + 0,4 = **34,2 MB**, Handy 20,0 + 2,5 + 0,2 = **22,7 MB**; three hält dieselben Daten zusätzlich im Arbeitsspeicher. JS-Heap laut `performance.memory` 81 MB (PC) / 69 MB (Handy) [B; wie viel der Felder darin mitzählt, ist nicht geprüft [O]].
- **Die dunklen Kerne dominieren:** Wirbelsäulen-Kern 413 280 Ecken = 9,9 MB, Haus-Kern 76 332 Ecken = 4,3 MB – beide **am Handy gleich groß wie am PC** (`shapes.js:364-368`, `praxis.js:156`); das sind ≈ 71 % der 20 MB am Handy [B Node-Messung]. Nicht indiziert (`toNonIndexed`, `stipple.js:9`), Kugeln 18 × 12, Drehkörper 36 Segmente (`praxis.js:85`, `shared/spine.js:127`).
- **Nichts wird aussortiert:** überall `frustumCulled = false` (`scene.js:160, 64, 204`; `spine.js:167-169, 183, 192`; `figure.js:73`) → alle Räume werden immer gezeichnet, auch die hinter der Kamera. Das Raum-Attribut `aRoom` wäre vorhanden (`praxis.js:158-164`), wird in der Fusion aber nicht genutzt.
- Pixeldichte gedeckelt 1,6 / 1,5 (`fusion/main.js:79`), keine Anpassung an die tatsächliche Bildzeit.

### 4.3 Hauptthread und Startzeit
Generatoren einzeln in Node gemessen (Xeon 2,1 GHz, mehrere Läufe; Handys sind langsamer, Faktor nicht gemessen [O]) [B `build/gen.txt`, `gen2.txt`]:

| Auftrag | Rechenzeit | Pausen-Stellen | längste Strecke ohne Pause |
|---|---|---|---|
| Praxis PC (85 000 / fein 1) | 1,4–2,1 s | 1 234 | 50–177 ms |
| Praxis Handy (32 000 / 0,62) | 0,4–1,1 s | 613 | 42–72 ms |
| Wirbelsäule Geometrie + Kern + Kurven | 0,55–0,76 s | 80 | 37–99 ms |
| Schichten PC (300 000) | 1,2–1,7 s | 644 | 10–23 ms |
| Schichten Handy (85 000) | 0,34–0,76 s | 181 | 30–59 ms |

- Zusammen PC ≈ 3,2–4,5 s, Handy-Mengen ≈ 1,3–2,6 s **im Hauptthread**, dazu Figur (`bodyPoints` läuft am Stück beim Start, `fusion/main.js:88`, `shapes.js:59-101`), Liege (42 000/19 000, `ideaA.js:83-87`) und 12 Motive (`services.js:163-175`).
- Das Versprechen „Blöcke ≤ 8 ms“ (`slice.js:3`) hält nur, wo `yield` steht; es gibt Strecken von 30–177 ms (Vorbereitung der Abtaster, Raster anlegen, Kern).
- **Je Leerlauf-Rückruf läuft nur eine Scheibe** (`slice.js:14-22`); Aufträge laufen strikt nacheinander (`:24-25`). Zeichnet die Seite langsam, verhungert der Aufbau. Im Container (kein Grafikchip, hohe Fremdlast) war die Wirbelsäule nach 17 s (Handy-Größe) bzw. 145 s (PC-Größe) fertig, die Liege nach 51 s / 231 s – **diese Zahlen sind keine Aussage über echte Geräte**, zeigen aber die Kopplung [B].
- Je Bild 6–9 Layout-Abfragen (`getBoundingClientRect`, `fusion/main.js:283, 375, 380, 413-414, 476`), dabei `$('.door-inner')` und `$('#bisbald')` jedes Bild frisch gesucht (`:414, 423, 476`); am Handy in den Leistungen 12 weitere (`:264`).
- **Taktgeber-Reserve mit Rückkopplung:** `setInterval` 33 ms zeichnet zusätzlich, sobald das letzte Bild > 120 ms her ist (`fusion/main.js:362`); `lastTick` wird am *Anfang* des Bildes gesetzt (`:366`). Dauert ein Bild länger als 120 ms, feuert die Reserve sofort wieder: in den Zähl-Läufen **2–7 Zeichendurchgänge je Bildwechsel** des Browsers. Gegenprobe (`check2.cjs`, Handy-Größe an der Wirbelsäule, je ein Lauf, Container unter Fremdlast): Reserve an = im Mittel 1,77 Durchgänge je Bildwechsel bei 1,5 Bildwechseln/s; Reserve aus = genau 1 bei 2,4 Bildwechseln/s [B]. Betrifft nur sehr langsame Momente (< 8 B/s), nimmt dem Browser aber genau dann die Luft für Eingaben.
- Shader: `renderer.compile` einmal nach dem Haus (`:96`); Liege und Motive übersetzen beim ersten Zeigen in ihren eigenen Kontexten. Link-Zeiten im Container nicht aussagekräftig [O].

### 4.4 Fehler und Altlasten mit Fundstelle
1. **Wirbelsäule bleibt an** [B]: `spineSolid` nähert sich 0 nur exponentiell (`fusion/main.js:436`), sichtbar ist die Gruppe bei `solid > 0` (`fusion/spine.js:216-217`). Folge: 300 000 Punkte + 137 760 Kern-Dreiecke durchlaufen weiter die Grafikkarte und werden erst im Fragment verworfen (`spine.js:48, 93`). Gemessen an allen Stellen nach dem Rundgang (Tabelle 4.2). Rechnerisch erreicht der Wert bei 60 B/s erst nach ≈ 14 900 Bildern (≈ 4 min) die Null [A Rechnung]. Die Figur macht es richtig (`fig.pts.visible = figIn > 0.01`, `main.js:445`). Ein Schwellwert behebt es.
2. **Doppelter Code** [B]: Haus/Tür/Schild (`ego/tour.js:20-152` ↔ `fusion/scene.js:16-165`), Wirbelsäulen-Shader (`test-4/main.js:391-587` ↔ `fusion/spine.js:29-171`), Figur (`test-4/main.js:165-176` ↔ `fusion/figure.js:42-65`), Termin-Blatt/Öffnungsstatus/Feiertage/Herzschlag-Knöpfe (`fusion/main.js:516-610`, „wie Puls“), „Bewegung anhalten“ in jeder Seite (`fusion/main.js:29-48`, `zuhause/main.js:19-37`), Konstanten `K`, `Y0` dreifach (`praxis.js:10-12`, `scene.js:9-10`, `tour.js:13`).
3. **Monolith**: `test-4/main.js` 2 476 Zeilen / 163 KB, eine Datei für Szene, Scanner, Rundgang, UI.
4. **Zufall ohne Startwert** (`praxis.js:33`, `stipple.js:44`, `shapes.js:7`) → kein Vorab-Rechnen mit festem Ergebnis, keine Bildvergleiche als Test. Das Schild hat schon einen festen Generator (`scene.js:19`).
5. **Einheiten**: 1 Einheit = 2 m, Boden bei y = −3, Grundriss-Pixel × 0,0149 (`praxis.js:10-15`) – erschwert Licht mit echtem Abfall und jede Übernahme eines Scans.
6. **Texte im Code verstreut**: Raumtexte `praxis.js:16-22`, Manuthera `ideaA.js:10-15`, Leistungsnamen `services.js:124-153`, Therapie-Punkte `haus/main.js:209-217`, der Rest in `page.html` → keine gemeinsame Quelle für Seite, Suchmaschinen-Daten und 3D-Beschriftung.
7. **Kein Aufräumen**: `dispose` kommt in `fusion/` nicht vor [B grep]; drei Renderer leben bis zum Schließen.
8. **Bau**: ein IIFE-Bündel, `target es2020`, kein Aufteilen (`labor/build.mjs:127-131`), Vorlage per Textersetzung (`:141-145`); keine automatischen Prüfungen, nur Hand-Werkzeuge (`labor/tools/`).
9. **Handy-Drosselung** „im Stillstand jedes zweite Bild“ (`fusion/main.js:368`) statt Zeichnen nur bei Änderung.

---

## 5 · three.js-Version, Abhängigkeiten, Nähe zu WebGPU/TSL

- **Versionen** [B `labor/package.json`, `package-lock.json:560-561`]: three **0.187.0**, gsap 3.15.0, lenis 1.3.27, esbuild 0.25.10, zwei Fontsource-Pakete. Aus `three/examples`: `MeshSurfaceSampler`, `mergeGeometries`, im Haus zusätzlich `RoundedBoxGeometry`, `EffectComposer`, `UnrealBloomPass`, `OutputPass`, `ShaderPass` (`haus/main.js:4-8`, `haus/scene.js:4-6`).
- r187 liefert den WebGPU-Weg mit (`build/three.webgpu.js`, `three.tsl.js`, Exporte `three/webgpu`, `three/tsl`) [B `node_modules/three/package.json:18-19`].
- **Der Code ist zu 100 % der klassische Weg**: `WebGLRenderer` + `ShaderMaterial` mit GLSL-Text. Gezählt: **46 `ShaderMaterial`** (Fusion-Pfad 14), 33 × `gl_PointSize`, 25 × `gl_PointCoord`, dazu `#include <colorspace_fragment>` und ein vorab geholter WebGL-2-Kontext (`manu/common.js:26-34`) [B grep].

**Was ein Umstieg bedeutet** [B aus der three-Quelle r187]:
1. `WebGPURenderer` nimmt kein `ShaderMaterial`: die Material-Bibliothek kennt nur die Standard-Materialien (`src/renderers/webgpu/nodes/StandardNodeLibrary.js:74-86`), alles andere endet mit „Material … is not compatible“ (`src/nodes/core/NodeBuilder.js:3632`). → **jedes der 46 Materialien als Knoten-Material in TSL neu schreiben**.
2. **Punkte mit Größe gibt es in WebGPU nicht** („only supports point primitives with a pixel size of 1“); `PointsNodeMaterial` braucht dafür `Sprite` mit Instanzen (`src/materials/nodes/PointsNodeMaterial.js:19-33`). Aus 300 000 Punkten werden 300 000 Vierecke. Das ist Umbau der Geometrie-Übergabe (Instanz-Attribute), nicht nur des Shaders.
3. `renderer.compile` → `compileAsync`; `EffectComposer` → Knoten-Nachbearbeitung; `gl_PointCoord` → UV des Sprites; Float-Kurventextur bleibt möglich.
4. **Bündel**: kleinste Partikel-Probe über `three/webgpu` + `three/tsl` **820 638 B** gegen 534 830 B heute → **+286 KB** (+90 KB gzip) [B Messung, nicht ausgeführt].
5. **Gewinn** [A]: Rechen-Shader (Partikel-Simulation auf der Grafikkarte: Figur zerstäuben, Dunst mit Strömung, Millionen Punkte), einheitliche Nachbearbeitung, Zukunftssicherheit. **Kein** automatischer Gewinn für die heutigen, statischen Wolken – deren Bewegung läuft schon vollständig im Vertex-Shader.
6. Browser-Stand WebGPU Ende 2026: nicht in dieser Sitzung geprüft [O] – gehört zur Technik-Recherche.

**Einschätzung [A]:** Der Code ist weit vom TSL-Weg entfernt (ein Neuschreiben der gesamten Darstellungsschicht), aber gut vorbereitet für einen *späteren* Wechsel, wenn die Shader in einem Modul gebündelt sind. Für die Wärme und die Flüssigkeit, um die es geht, ist WebGPU nicht nötig. Sinnvoll wäre höchstens **ein** Baustein als Machbarkeitsprobe (z. B. Staub/Dunst als Rechen-Shader) hinter einer Fähigkeitsprüfung.

---

## 6 · Empfehlung

### 6.1 Behalten / verbessern / ersetzen (Kurzfassung der Tabelle aus §1)
- **Behalten:** Wirbelsäulen-Geometrie und „Schichten“, Nerven mit Signalen, Stipple-Verfahren mit dunklem Kern, Tür-Shader, Scroll-Zeitleiste `ST`/`TL`, Manuthera-Mechanik (Segment-Matrizen), Malen-Prinzip der Figur, Termin-Blatt, „Bewegung anhalten“, Generatoren als Arbeitseinheit.
- **Verbessern:** Praxis-Daten (Fenster, Decke, Wohn-Dinge, Meter-Einheiten, fester Zufall), Kerne (indiziert, gröber, am Handy kleiner), Sichtbarkeit (Schwellwerte, Räume einzeln, Aussortieren), ein Lichtmodell für alle Shader, Manuthera in die Welt statt eigener Bühne, Bedarfs-Schalter aus `ego/tour.js` zurück, Ankunft vor einem Haus mit warmen Fenstern.
- **Ersetzen:** die Hülle – Ein-Datei-Bau, drei Kontexte, Aufbau im Hauptthread, „ohne WebGL“ als Ausnahme, 2D-Körper der Figur, Leistungs-Motive als losgelöste Bühne.

### 6.2 Modul-Architektur für das neue Projekt

```
inhalt/      Räume, Leistungen, Abschnitte, Hausordnung, Praxisdaten als Daten (eine Quelle
             für HTML, schema.org und 3D-Beschriftung)
seite/       statisches HTML + CSS, vollständig lesbar ohne Skript; Standbild je Station
ui/          kleine Module ohne 3D: Bewegung, Termin-Blatt, Öffnungsstatus, Leiste, Zeitleiste
engine/      wird nachgeladen: 1 Renderer, 1 Zeichenfläche, 1 Taktgeber
  welt/      Haus, Tür, Schild, Figur, Wirbelsäule, Liege als Gruppen derselben Szene
  licht/     gemeinsame GLSL-Bausteine: Sonne/Himmel, Lampen, Dunst, Tageszeit-Presets
  sicht/     Raum-Gruppen, Schwellwerte, Zeichnen nur bei Änderung, Pixeldichte nach Bildzeit
erzeuger/    Punktwolken-Generatoren im Worker (oder vorab gerechnet), fester Zufall
pruefung/    Budgets als Skript: Bündelgrößen, Zeichenmengen, axe, Bildvergleich
```

Reihenfolge beim Laden: HTML/CSS → Schriften als eigene Dateien → `ui` (wenige KB) → Fähigkeitsprüfung (WebGL 2, „Bewegung reduzieren“, Datensparmodus) → `import('engine')` im Leerlauf → Standbild blendet in die lebende Szene über.
- **Ein Renderer statt drei Kontexte:** Liege steht in Behandlung 2 (ihre Teile sind schon Welt-Geometrie, nur `stage()` muss raus, `ideaA.js:23`); Leistungs-Motive entweder im Raum oder über Ausschnitt-Zeichnen derselben Fläche. Spart 2 Kontexte samt eigenem Speicher; alle Programme lassen sich dann gemeinsam vorwärmen, und die Liege bekommt dasselbe Licht wie der Raum.
- **Erzeuger im Worker:** Praxis und Wirbelsäule laufen nachweislich ohne DOM [B]; Felder werden ohne Kopie übergeben. `bodyPoints` braucht eine 2D-Zeichenfläche (`shapes.js:61-64`) → entfällt mit der 3D-Figur. Alternative Vorab-Rechnen: Handy-Wirbelsäule 85 000 Punkte ≈ 0,9 MB bei 11 B/Punkt, PC ≈ 3,3 MB [A Rechnung] – für das Haus sinnvoll, für die Wirbelsäule eher Worker.
- **Bau:** dasselbe esbuild mit `splitting`/ESM genügt (keine neue Abhängigkeit). Dateien vom selben Host sind keine „externen Abrufe“ – die Live-Seite legt Standbilder schon daneben (`labor/build.mjs:148-155`) [A]. Grenze: GitHub Pages cacht nur 10 Minuten und liefert gzip [B].
- **Engine-Wahl** [A, mit Messung als Grundlage]: (a) three/WebGL behalten = kein Neuschreiben, Sockel 535 KB, aber nachgeladen statt blockierend → **erster Schritt**; (b) dünne WebGL-Schicht (53 KB) im Hauptthread, three nur noch im Worker für die Geometrie → 3D-Skript ≈ 150 KB statt ≈ 650 KB, GLSL bleibt, Aufwand: 14 Materialien umhängen → **zweiter Schritt, wenn (a) steht**; (c) WebGPU/TSL → nur als Probe.

### 6.3 Was das Ergebnis besser macht, nicht größer [A]
1. **Leistung am Ort:** `ROOMS[].ther` ordnet die Therapien schon den Räumen zu (`praxis.js:19-21`), das Haus hat anklickbare Therapie-Punkte im Raum (`haus/main.js:209-226`). Zusammen ersetzt das die losgelöste Motiv-Bühne – weniger Technik, mehr Haus.
2. **Tageszeit als roter Faden:** die Begrüßung nach Uhr gibt es (`fusion/main.js:146`); Licht, Lampen und Palette folgen derselben Uhr.
3. **Messbare Budgets** für das neue Projekt, jeweils mit dem Werkzeug, das sie prüft: Text sichtbar und bedienbar ohne 3D (Playwright ohne WebGL); 3D-Modul ≤ 200 KB gzip (esbuild-Metadatei); keine Aufgabe > 50 ms durch Erzeuger (Long-Task-Zähler wie `gpu.cjs`); 1 Kontext; ≤ 150 000 Punkte + ≤ 30 000 Dreiecke je Bild am Handy (Zeichen-Zähler); 0 gezeichnete Punkte unsichtbarer Bühnen; axe ohne Befund (`labor/tools/audit.cjs`); Bildrate auf Kais iPhone/PC (`labor/tools/frames.cjs`-Verfahren) – letzteres kann nur auf echten Geräten belegt werden.

### 6.4 Sofort-Befunde, die auch die bestehende Seite beträfen (nur Hinweis – nichts geändert, kein Auftrag)
Wirbelsäule nach Behandlung 1 abschalten (§4.4 Nr. 1); Kerne am Handy verkleinern; Taktgeber-Reserve erst nach Bild-Ende zählen. Für Kai: je Punkt Go nötig, gehört nicht zu diesem gesonderten Projekt.

---

## Anhang · Was fehlt und was es ermöglichen würde
- **Echtes Gerät mit Grafikchip** (Kais PC/iPhone): absolute Bildraten, Shader-Übersetzungszeiten, Wärmeentwicklung. Im Container nur Zählwerte.
- **Referenzmaße der Wirbelsäule** (Anatomie-Atlas/Datensatz): Abgleich der prozeduralen Proportionen.
- **Ausgeführte WebGPU-Probe** auf Gerät mit WebGPU: ob Instanz-Sprites bei 300 000 Punkten schneller oder langsamer sind als `gl.POINTS`.
- **Echter Raum-Scan / Fotos der Praxis**: `praxis.js:5` sieht den Austausch vor; ohne Daten bleibt die Praxis schematisch.
