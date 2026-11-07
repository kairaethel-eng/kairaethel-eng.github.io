# Übergabe – Stand 7.11.2026 spät (Scanner am PC + Rundgang aus Augenhöhe in Kap. 04 + Nebenthemen 1–3 umgesetzt; offen: Kais Tests, siehe ▶)

## Start-Prompt für einen neuen Chat (Claude Code, Repo kairaethel-eng.github.io)
> Lies `labor/CLAUDE.md`, `labor/UEBERGABE.md`, `labor/ENTSCHEIDUNGEN.md` und `labor/LIVEGANG.md` (nur Branch `main`). Puls · Scan geht auf hopphysio.de live (GitHub Pages + Domain). Hier meine Punkte: …

## ▶ Nächster Chat: hier weitermachen (Stand 7.11.2026 spät)

> **Zuerst Kai fragen:** Wie war der iPhone-Test „Rundgang aus Augenhöhe“ (Kap. 04)? Am PC sagt Kai „super“ (7.11. spät). Abfragen: Anflug zur Tür, Tempo der Fahrt, Zurück-Wischgeste in Safari schließt den Rundgang, Knopfzeile lesbar, Aufbau beim ersten Klick, Seite scrollt beim Wischen auf den Knöpfen nicht mit. Rückmeldung = kein Auftrag → je Punkt Optionen, Go abwarten.

### ✅ Online-Terminkalender als Blatt (Option C, Go Kai 7.11. spät)
„Termin“ (Leiste), „Termin buchen“ (Start) und „Online-Termin buchen“ (Kap. 05) öffnen ein Blatt (PC rechts, Handy von unten); Optica-Kalender lädt erst nach „Kalender laden“, Datenschutz § 4 neu. Details `ENTSCHEIDUNGEN.md` → „Online-Terminkalender als Blatt“.
- **Offen von Kai:** Online-Termine in Optica Viva freischalten (Kalender meldet „keine Onlinetermine“) · welche Terminarten online · AV-Vertrag/Anbieter prüfen · iPhone-Test (Blatt, Kalender scrollen, Zurück) · Übergangsseite (Wurzel) bekommt Link/Blatt nur mit eigenem Go.

### ✅ Chat A · Scanner am PC – umgesetzt (Go Kai „1A 2A 3A, 4 ja“, 7.11. spät)
Kapitel 03 am PC ist eine stehende Bühne (160svh): Aufzug ganz rechts (Griff ziehen, Haltestelle anklicken, Mausrad über dem Aufzug, Pfeiltasten), Silhouette vor dem Aufzug nur in der Nahansicht, Karte links bleibt, Schilder frei platziert, `segnav` als zweite Bedienung; Aufzug liegt in `#achse` (Tab direkt nach `segnav`), `aria-current`, roving tabindex. Alte Fahrt mit `?scan=0`. Details `ENTSCHEIDUNGEN.md` → „Scanner am PC – Hybrid“.
- Geprüft (Chromium/SwiftShader, intern): 1440×900 + 2560×1440 (Klick, Rad, Tasten, Ziehen, segnav, Seite scrollt außerhalb und an den Enden, Tab-Reihenfolge, Übergang Kap. 04), „Bewegung reduzieren“, `?scan=0`; Handy 390×844 Vergleichsbild vorher/nachher gleich. axe (d, dr, xl, m): nur der bekannte Kontrast-Treffer Kap. 02 (unbeleuchtete Wörter); keine Konsolenfehler. `tools/audit.cjs`-Offsets für Kap. 03 PC angepasst.
- **Offen von Kai:** PC-Test in Chrome (echte Maus/Trackpad: Rad-Tempo, Griff, Größe der Nahansicht `PC_ZOOM`, Lage der Silhouette), auch 2560×1440. Danach entscheiden: alte Fahrt (`?scan=0`, PC-Zweig in `updateAxis`) entfernen?

### ✅ Chat B · Rundgang aus Augenhöhe in Kapitel 04 – umgesetzt (Go Kai „1B+ 2a/a 3a 4 ja“, 7.11. spät)
Knopf „Rundgang aus Augenhöhe“ neben „Rundgang starten“ (PC gleiche Zeile, Handy eigene Zeile darunter, nur in der Übersicht). Klick → Kamera fährt im Röntgenblick ~0,65 s Richtung Tür → Vollbild-Dialog mit der Fahrt der Testseite (Tür, 7 Stationen, Karten, Ohne Fahrt/Ruhig/Größere Punkte, Logo-Schild). „‹ Übersicht“, Esc und Zurück-Taste/Wischgeste schließen → gleiche Stelle, Röntgenblick. „Bis bald“ mit „Termin & Kontakt →“ (Sprung zu Kapitel 05). Details `ENTSCHEIDUNGEN.md` → „Rundgang aus Augenhöhe in Kapitel 04“.
- Geprüft (Chromium/SwiftShader, intern): 1440×900, 1440×900 „Bewegung reduzieren“, 2560×1440, 390×844, 375×667, 320×568 – Öffnen, Fahrt, Pfeiltasten, Esc, Zurück-Taste, Kontakt-Link, Mausrad scrollt die Seite nicht, Fokus zurück auf den Knopf, Klick-Rundgang unverändert, Haus-Lage Handy gegenüber vorher ±4 px; axe im offenen Dialog 0 Verstöße, ganze Seite (d, m) nur der bekannte Kontrast-Treffer Kap. 02; keine Konsolenfehler. Testseite `rundgang-ego.html` nutzt denselben Baustein (Bild gleich wie vorher).
- **Kai 7.11. spät: PC „super“.** **Offen von Kai:** iPhone-Test (Anflug zur Tür, Tempo, Zurück-Wischgeste in Safari, Lesbarkeit der Knopfzeile). [O] iOS: zweiter WebGL-Kontext beim ersten Klick (kurzer Moment Aufbau), Seite darunter darf beim Wischen auf den Knöpfen nicht mitscrollen.

### ✅ Nebenthemen Kai 7.11. spät – umgesetzt (Go Kai, je Empfehlung)
1. **Bandscheiben rot-orange (a):** Standard = blau, im aktiven Abschnitt **#E0583C** (weich über die Abschnitts-Hervorhebung). Vergleich: `…/test-4-puls-scan.html?disc=alle` (alle Bandscheiben rot-orange, aktiv heller) · `?disc=blau` (bisher). Code: `DISC_MODE`, `uDiscMode`, `cDiscA` (`main.js`, `uDiff`-Zweig).
2. **Schichten entlang der Mittellinie (b):** Schnittebenen stehen senkrecht zur Tangente der Spine-Kurve (`sp.curve` aus `shared/spine.js`) – kippen mit HWS-Lordose, BWS-Kyphose, LWS-Lordose und Kreuzbein. Gleiche Punktzahl (PC 330 000 / Handy 85 000), Zeichnen unverändert; Aufbau in Zeitscheiben Handy gleich schnell, PC ~+20 % (≈ +0,2 s im Leerlauf). Code: `axial`, `axialGrid`/`axialFast` (`shapes.js`, `makeSlicesGen`).
3. **Hände „Manuelle Therapie“ (b, prozedural):** zwei Hände umgreifen ein Kniegelenk (Bein quer): Handrücken gewölbt mit Knöcheln und Sehnen, Handfläche quer hohl, Finger aus drei Gliedern, die sich um das Bein legen, Daumen abgewinkelt zum Gelenkspalt (bernsteinfarbener Ring); Bewegung 13 = beide Seiten ziehen sanft auseinander. Code: `gripHand`, `gripLimb`, `tube`, `GRIP` (`services.js`); alte `hand()` bleibt für „Osteopathische Ansätze“.
- Geprüft (Chromium/SwiftShader, intern, Vorher/Nachher): PC 1440 (Übersicht, C1, L4, `?disc=alle`, `?disc=blau`), 2560 (Th1, Motiv), Handy 390 (Übersicht, C1, L4, Motiv); `live/` mitgebaut und geladen, `zuhause.html` neu gebaut (nutzt `shapes.js`); keine Konsolenfehler. axe nicht gelaufen (nur Canvas-Inhalt geändert).
- **Offen von Kai:** Farbton/Variante der Bandscheiben am PC + iPhone wählen (Standard oder `?disc=alle`, danach Varianten entfernen) · Schichten ansehen (Hals/Lende/Kreuzbein) · Hände: Lesbarkeit am iPhone (Motiv dort kleiner), ggf. Griff/Daumen anpassen.

### Aufgabe 7 · Durchsicht 7.11. – Ergebnis (Bericht im Chat, Kai hat die Reihenfolge freigegeben)
- **Behoben (Go):** Skip-Link, `noGl()` nur Haupt-Renderer, Intro bei „angehalten“, Listenrolle `manuthera.html`, Standbilder neu, 6A Hinweis-Pillen am PC, 3C Haus-Umrisse, Wurzel-Datenschutz neu gebaut, Doku + Skill `hop-praxis` (Datei an Kai). Details `ENTSCHEIDUNGEN.md` → „Durchsicht 7.11.“.
- **Offen, bewusst nicht angefasst:** ~~Scanner-Aufzug per Tab erst nach der Fußzeile~~ (erledigt 7.11. spät); Tablet-Drehung über 920 px (Punktzahlen/Pixelratio nur beim Laden; Vorschlag: bei Wechsel der Klasse neu laden oder Werte nachziehen); Hausordnung: Hereinscrollen setzt §1 und kann eine Tastatur-Wahl überschreiben (`LAW.vis`, am echten Browser prüfen); `IOS_SAFARI` erkennt iPadOS nicht; je Bild neue Kurven-Objekte in `updatePeri`/`spineRects` (Leistung Handy); Menü-Sprung zur Manuthera wartet hinter Wirbelsäule + Praxis; axe „color-contrast“ in Kapitel 02 (unbeleuchtete Wörter beim Laden, gestaltungsbedingt); `hausbesuch.html` Kontrast/Region/THREE.Clock (Nebenseite).
- **Tote Reste (Kai entscheidet):** Option A `?scan=0` (≈ 90 Zeilen), K1 `?licht=1` (≈ 70 Zeilen), `periLabel`/`PERI`, Körnung-Reste in test-4, alter Nerv-Shader-Zweig, `SSTOPS`-Alias, ungenutzte `boxPts/cylPts/ellPts` (common.js), `spinePoints`, `buildSpine`.
- **Braucht Kai/Fachleute:** Impressum „[Bitte ergänzen]“ (Behörde, Berufshaftpflicht – öffentlich sichtbar), A6 Etiketten, A8 Anwalt, iPhone-Tests 5.–7.11. (Th7–Th12-Texte, Safari-Reserve, Lockdown), Hero-Standbild ohne WebGL am Handy nach altem Muster [O], Porträtfoto, 3D-Scan, Anrufbeantworter, 2FA, Livegang (`LIVEGANG.md`).

### Erledigt am PC (Kai 7.11. spät): Nerv fein, Wirbelsäule differenziert, Hausordnung automatisch (Ursache war der Browser-Zwischenspeicher).

### Am 7.11. umgesetzt (alles auf `main`)
**7.11. PC nachgezogen (Kai: „passt im Moment so alles, nun am PC die relevanten Sachen“) – ✅ umgesetzt:** Th7–Th12 überall 6. Station (PC Kapitel 03 530vh) · Nerv fein ab Wirbel + Andockringe · Wirbelsäule differenziert · Hausordnung automatisch. Details `ENTSCHEIDUNGEN.md` → „PC nachgezogen“. **Offen von Kai:** PC-Test (Chrome, auch 2560×1440).
**7.11. Runde 2 (Go Kai „1A 2a 3A nur mobil, alles Wichtige für PC merken“ + Hausordnung automatisch) – ✅ umgesetzt, nur Handy:** Nerv beginnt am Wirbel (ein Strang bis „Ziel“) · Kap. 04: Überschrift oben, Haus mittig, Knöpfe unten · 6. Haltestelle Th7–Th12 im Scanner ([A] Texte prüfen) · Hausordnung wechselt von selbst (~5 s je §, Puls-Striche, antippen). Details `ENTSCHEIDUNGEN.md` → „Runde 2“.
**7.11. Runde 1 – 4 Kleinigkeiten – ✅ umgesetzt, nur Handy:** Hinweis am echten unteren Rand · Nerv fein + Andockringe · Karte 60 % + Kurz-„Typisch“ · Wirbelsäule differenziert. Kai: „jetzt wird es gut“.
- **Offen von Kai:** iPhone-Test Safari + Chrome (Nerv am Wirbel, Th7–Th12-Texte fachlich, Kap. 04 Überschrift/Haus, Hausordnung-Tempo). [O] Safari iOS 26: Hinweis-Reserve `IOS_SAFARI` (`NOTE`) ggf. anpassen.
- ~~Für den PC vorgemerkt~~ → am 7.11. umgesetzt (siehe oben).
- Geprüft (Container): Scanner 390×844, 390×664, 320×568 alle Haltestellen; Kap. 04 + Hausordnung 390×844; keine Konsolenfehler.

## Stand 5.11.2026 – was noch aussteht (Kai)
- Auftrag 1 (Handy Kap. 03 → 04) und Auftrag 2 (Ego-Rundgang) sind umgesetzt und auf `main`. **Offen von Kai:** erneuter iPhone-Test Kap. 03 → 04 · iPhone-Blick auf den Ego-Rundgang (Schild-Größe: `SIGN.width` in `src/ego/main.js`).
- Weiter offen aus Stufe 2b (siehe unten): A6 Etiketten bestätigen · A8 rechtlich · A9 iPhone-Prüfung · ~~Datenschutz: Google Workspace ergänzen~~ (seit 2.11. in der Quelle, Wurzel 7.11.) · **Wurzel/Livegang nur nach Kais Go** (`LIVEGANG.md`).
- **6.11. spät – Scanner neu aufgebaut (Go Kai, alle Empfehlungen) – ✅ umgesetzt:** Karte oben als Überschrift (mit „Typisch“), vier Zeilen links, Wirbelsäule frei; Aufzug rechts mit rundem Griff, Haltestellen zum Antippen und Hand, die das Ziehen vormacht; Punkte-Leiste weg; ärztlicher Hinweis kleiner ganz unten. Details `ENTSCHEIDUNGEN.md` → „Scanner neu aufgebaut“. **Offen von Kai:** iPhone-Test Safari + Chrome. [O] Safaris schwebende Leiste kann den Hinweis unten überdecken, wenn sie eingeblendet ist.
- ~~6.11. spät – Vergleich „Einblenden der Texte“ im Scanner (Kai: „könnte ich a b und c sehen?“) – zum Ansehen online, keine Entscheidung.** `…/test-4-puls-scan.html?txt=a` (Karte + Typisch sofort beim Einrasten, Zeilen nacheinander während des Heranfahrens) · `?txt=b` (wie a, beim Ziehen kurz stehen lassen, ruhig ausblenden) · `?txt=c` (wie b + Vorschau beim Ziehen neben dem Griff: Abschnitt + typische Beschwerden) · ohne = bisher. Code: `TXT`, `scanTexts`, `.scan-prev`. Erledigt: b ist Standard, Varianten entfernt.~~
- **6.11. spät – Wischhilfe ganze Seite (Go Kai, „A + Figur“) – ✅ umgesetzt.** Senkrecht wischen scrollt überall (auch über der Figur), Scanner nur im sichtbaren Ziehstreifen rechts und relativ, einheitlicher Hinweis (Pille mit laufendem Finger). Details `ENTSCHEIDUNGEN.md` → „Wischhilfe“. **Offen von Kai:** iPhone-Test; Videos (Safari) kommen als kurze Clips, Auswertung per `ffmpeg`. **Offen, noch nicht entschieden:** Scanner „Einblenden der Texte verwirrend“ (Optionen an Kai, siehe Chat 6.11.). Test-Werkzeug Fingerspur `?spur=1` angeboten, kein Go.
- **6.11. abends – Scanner mit Nahansicht + Bühne folgt beim Weiterscrollen (Go Kai „3 a+c, 1/2 A“) – ✅ umgesetzt.** Abschnitt einrasten → Wirbelsäule fährt heran (wie Option A), Karte mit Titel + Therapien unten; Ziehen → zurück zur Übersicht. Chrome-Überlappung behoben (Zeilen/Wirbelsäule wandern mit der Bühne, Bühne klebt 60svh). Details `ENTSCHEIDUNGEN.md` → „Scanner – Nahansicht“. **Offen von Kai:** iPhone-Test Safari + Chrome (Zoom-Tempo, Größe je Abschnitt `ZOOM` in `main.js`, Lesbarkeit), danach Option A (`?scan=0`) entfernen? [O] axe offen.
- **6.11. – Handy-Wirbelsäule als Scanner (Go Kai, Claudes Vorschlag) – ✅ umgesetzt, jetzt Standard am Handy.** Kais iPhone-Test von Option A: Wischen zu schnell, Texte nicht gesehen, unklar ob Wischen wirkt → Kapitel 03 hängt nicht mehr an der Scroll-Strecke. Details `ENTSCHEIDUNGEN.md` → „Handy-Wirbelsäule Scanner“. Option A bleibt zum Vergleich: `…/test-4-puls-scan.html?scan=0`. **Offen von Kai:** iPhone-Test Scanner (Ziehen am rechten Rand, Einrasten, Lesbarkeit, Vorführfahrt), dann entscheiden: Scanner behalten → Option A später entfernen. [O] axe weiter offen (Cloud).
- **Handy-Wirbelsäule: Infos als Zeilen wie am PC (Option A, Go Kai 5.11.) – ✅ umgesetzt 5.11., seit 6.11. nur noch mit `?scan=0`.** Details `ENTSCHEIDUNGEN.md` → „Handy-Wirbelsäule Option A“. Kurz: Karte nur Abschnitt + Titel + Schlagworte, klebt unten; fünf Zeilen erscheinen beim Weiterscrollen nacheinander, links gestapelt mit Linie zur Wirbelsäule (alle Breiten, nicht nur 320 px); „Typisch“ als vollständiger Kartentext über der Karte; Volltext für Vorleseprogramme. Ohne WebGL und Handy quer: alte Karte mit Volltext. **Offen von Kai:** iPhone-Test (Lesbarkeit der Zeilen, Tempo des Einblendens, Abstand Karte ↔ „Typisch“). [O] axe diesmal nicht gelaufen (lokal kein Playwright, axe-Nachladen aus dem Netz blockiert) → beim nächsten Cloud-Lauf `tools/audit.cjs`.
- Kap. 03 → 04 Handy: Kai 4.11. spät „passt“, Haus-Dämpfung beim Einstieg Kap. 04 so lassen. Bekannt, nicht beauftragt: auf 320×568 liegt der Text von Kap. 04 („Alles unter einem Dach“) über der Praxis-Ansicht (war schon vorher so).
- Ideen, noch nicht beauftragt: Ego-Rundgang in die Hauptseite einbinden (derzeit eigene Testseite, Link nur auf der Labor-Übersicht) · Logo-Schild später gegen 3D-Scan tauschen (Gruppe `logoSign`).

## Stand 4.11.2026 abends – zwei Aufträge für neue Sessions (beide: Go Kai)
Auf `main` liegt alles bis Commit „Rundgang aus Augenhöhe – Machbarkeitstest“. Neue Session: `git pull`, dann `labor/CLAUDE.md` + diesen Abschnitt lesen. Veröffentlichen wie immer: nur `labor/` auf `main`.

**Auftrag 1 · Paket Handy Kapitel 03 → 04 (Opus)** – ✅ umgesetzt 4.11. (Details ENTSCHEIDUNGEN.md; geprüft 390×844/664, 320×568, Tablet 820, „Bewegung reduzieren“, axe 0, keine Konsolenfehler; Nachbesserung nach Kais iPhone-Test am 4.11. abends umgesetzt: Wirbelsäule ganz am Kapitelanfang, Karten früher, kein Zucken durch Safari-Leiste, kein Ineinanderlaufen Haus/Manuthera, K1-Licht aus; danach Feinschliff Kap. 04: Röntgenblick am Anfang gedämpft, Szene scrollt am Rundgang-Ende mit weg; Feinschliff 2: Haus am Anfang noch transparenter, Wisch-Hinweis früher als dunkle Pille; offen: erneuter iPhone-Test) – – Quelle `src/test-4/main.js` (`PH`, `mobileCard`, `stopPose`, `updateAxis`, `roofEmblem`, `layout()` X[2]/X[3]), `style.css` (`.seg-cards`, `.seg-card`, ≤ 920 px). Nur Handy/Tablet, PC unverändert. Kais Beobachtungen (iPhone, 9 Bilder):
1. C1–C2: Die erste Karte läuft früh durch die Wirbelsäule (verdeckt sie). → Karten erst einblenden, wenn die Kamera am Abschnitt steht (ca. ab 60 % Bildhöhe), Wirbelsäule vorher frei.
2. Nächste Karte verdeckt den erklärten Bereich (Hals/Nerven). → Kamera/Wirbelsäule über dem Kartenanfang halten, Karte nur im unteren Bildteil, von unten einblenden.
3. Bild mit Wirbelsäule + Karte über den ganzen Bildschirm (C5–C6) passt – nicht anfassen.
4. Nach der letzten Karte wird die Wirbelsäule klein und liegt oben, darunter toter Bereich. → Am Ende groß, zentriert, ganz sichtbar (Kopf bis Kreuzbein), etwas stehen lassen, dann auflösen (Kais Highlight).
5. Das Haus entsteht nur im oberen Bildschirm. → Wirbelsäule löst sich nach oben auf, Haus aus der Bildmitte, größer (Handy-Skalierung/Position anpassen).
6. Toter Bereich unten bis der Text von Kapitel 04 kommt. → Text näher heranrücken oder Haus füllt den Raum.
Prüfen: 390×844, 390×664, 320×568 (iPhone-Safari-Leiste!), axe target-size/color-contrast/region = 0, keine Konsolenfehler. Kai gibt Erfolg per iPhone zurück.

**Auftrag 2 · Ego-Rundgang: Tür, Logo, Barrierefreiheit (Sonnet)** – ✅ umgesetzt 4.11. (Details ENTSCHEIDUNGEN.md; Kai 5.11.: „passt alles super“, Logo-Schild enger + Rahmen nachgezogen, `main` = `47e24c1`) – Quelle `src/ego/{main.js,style.css,page.html}`, Build `node build.mjs ego` → `rundgang-ego.html` (https://kairaethel-eng.github.io/labor/rundgang-ego.html). Kais Rückmeldung: Fahrt „super geil“, Handy-Ansicht gut, kein Schwindel.
1. Tür: Start ca. 1,5 m weiter zurück (STOPS[0].at y≈320 → ≈360), Tür ganz sichtbar, kurze Pause, dann Aufgehen.
2. Logo-Schild **rechts neben der Tür** an der Außenwand, Augenhöhe: HOP-Kreise (Grün #7FAF45, Petrol #3C7189, Blau #3F86B5, Buchstaben H O P) als Punkt-/Linien-Umriss in eigener Gruppe (später gegen 3D-Scan austauschbar).
3. Ältere/sehschwächere Besucher: Lesezeit im Autoplay nach Textlänge (ca. 6–8 s statt 4,2 s), Kartentext ≥ 18 px mit mehr Kontrast, Schalter „Ohne Fahrt“ (Sprung mit kurzem Überblenden; automatisch bei „Bewegung reduzieren“ – das gibt es schon). Tempo „Ruhig“ (−40 %) und „Größere Punkte“ nur bei Bedarf.
Prüfen: 390 und 1440 px, Autoplay bis Ende, keine Konsolenfehler.

## Stand 4.11.2026 spät – Stufe 2b umgesetzt (Go: A3, A4, A5, A7; A6 nur Vorschlag)
Details `ENTSCHEIDUNGEN.md` → „Stufe 2b“. Auf `main` nur `labor/`.
- A3 Navigation zweizeilig (Untertitel), A4 Kontakt (mailto-Vorlage, E-Mail kopieren, vCard `hop-physiotherapie.vcf`, Öffnungsstatus), A5 Hero-Untertitel mit Ort, A7 Skip-Link. A6 Etiketten-Tabelle liegt nur in ENTSCHEIDUNGEN (Kai bestätigt). Stufe-1-Plan (gelöscht, Git-Verlauf) gelöscht.
- **Offen:** A6 Kais Bestätigung · A8 rechtlich (Kai) · A9 iPhone-Prüfung · Wurzel erst nach Kais Go (`LIVEGANG.md`). Google Workspace im Datenschutz: erledigt 2.11.

## Stand 4.11.2026 abends – Stufe 2a umgesetzt (Go: A1, A2, K1)
Commit auf Arbeitszweig `claude/hop-website-design-review-lwh3ps`, **noch nicht auf `main`** (Testadresse zeigt es erst danach). Messwerte und Details: `ENTSCHEIDUNGEN.md` → „Stufe 2a“.
- **A1 Startzeit:** Kapitel-Bühnen werden erst bei Annäherung gebaut (Wirbelsäule, Praxis, Manuthera, Motive), in Zeitscheiben ≤ 8 ms; Raster mit Zahlen-Schlüsseln (Praxis 6× schneller); kein erzwungenes Layout mehr im Start-Skript. Sichtprüfung intern: Wirbelsäule, Haus, Manuthera, Motive unverändert.
- **A2 ohne WebGL:** `html.no-gl`, Standbilder `assets/still-{hero,achse,dach,manu}.webp` (27–57 KB, Build kopiert nach `live/`), Satz „Die bewegte Ansicht braucht einen aktuellen Browser.“; geprüft mit `--disable-webgl` (390/1440), keine Konsolenfehler.
- **K1 „Die Tür geht auf“:** nur mit `?licht=1` – Hausordnung (letzte 60 %) blendet in Off-White, Kapitel 05/Leiste/Fuß hell, Sonnenstaub. Ohne Parameter unverändert. **Kai vergleicht** (keine Entscheidung getroffen).
- Mitgebaut (gemeinsame Module): `zuhause.html`, `manuthera.html`, `portrait.html` – ohne Fehler geprüft. Wurzel nicht angefasst.

**Kai prüft (iPhone + PC, nach Veröffentlichung auf main)**
1. Seite öffnen und sofort scrollen: reagiert sie gleich? Kapitel 03/04 und Manuthera-Liege erscheinen rechtzeitig (sanftes Einblenden)?
2. iPhone mit Lockdown-Modus (oder Chrome ohne Hardwarebeschleunigung): Standbilder + Satz statt Partikel?
3. `…/labor/live/?licht=1` gegen `…/labor/live/`: Übergang Hausordnung → Tür, Lesbarkeit Kontakt.
- **Ergebnis Kai 5.11.:** (1) reagiert sofort. (2) „bei den Übergängen erscheinen Partikel 1–4 und dann wieder zur Hausordnung“ – [A] im Lockdown-Modus läuft WebGL offenbar weiter, daher Partikel statt Standbilder; [O] mit Kai klären, ob er das so meinte, und Rückfall z. B. in Chrome ohne Hardwarebeschleunigung gegenprüfen. (3) hell abgelehnt → bleibt dunkel.

**Offen**
- [O] Direkter Sprung (Menü) zur Manuthera: Aufbau wartet hinter Wirbelsäule und Praxis (gedrosselt im Test ~8 s); auf echten Geräten am iPhone prüfen, sonst Variante B (Worker).
- [B] Rest-Lang-Tasks kommen vom Browser selbst (HTML/Schriften parsen, erstes Layout): schon ohne JS 320 ms bei CPU ×4.

## Stand 4.11.2026 – offene Punkte (Kai arbeitet sie später ab)
Erledigt 3./4.11. (Details `ENTSCHEIDUNGEN.md`): Stufe 1 aus Stufe-1-Plan (gelöscht, Git-Verlauf) (axe target-size/color-contrast/region = 0 bei 320/390/768/1440), ärztlicher Hinweis „immer zuerst ärztlich abklären“ (alle Labor-Seiten), Spannung bis 0 mit „Entspannt.“ + ruhigem Atem, Wisch-Hinweis Manuthera erst nach echtem Wischen weg, Vergleichsseiten test-1–3 gelöscht (Git-Verlauf bis 54d7812). Kais Sichtprüfung 3.11.: Stufe 1 passt.

**Kai prüft am iPhone**
1. Körper ganz freistreichen → Anzeige 0 und „Entspannt.“? Ruhiger Atem gefällt?
2. Manuthera-Liege: erscheint „Seitlich wischen“ jetzt (nach ~1,5 s)?

**Claude prüft (auf Zuruf)**
3. PC, Raum 04 im Rundgang: Schild „Manuthera ↓“ liegt seit Stufe 1 in `<main>` (Stapelebene von `main`, z-index 2) – sitzt es noch richtig über den Raumschildern?

**Braucht Kai / Fachleute**
4. Impressum: zuständige Behörde laut Erlaubnisurkunde, Berufshaftpflicht (Name + Sitz).
5. Heilmittelwerbegesetz: Formulierungen wie „Osteopathische Ansätze“ anwaltlich prüfen lassen.
6. `PLAN-Livegang-2026-11-04.md` (andere Sitzung, Entwurf) lesen und Go/Änderungen geben.

**Hinweise**
- „· schematisch“ fehlt am Handy seit Stufe 1 (doppelter Hinweis entfernt); passt zu „Labor-Hinweise vor Livegang entfernen“ (unten).
- Nur **eine** Sitzung gleichzeitig an `labor/` arbeiten lassen (am 4.11. zweimal fremde Commits zusammengeführt).
- ~~Arbeitszweig `claude/hop-website-design-review-lwh3ps` vor `main`~~ – seit 4.11. abends auf `main`.
- Skill `hop-praxis` aktualisiert (Standard-Hinweis, Stand 4.11.) – als `.skill`-Datei an Kai geliefert.

## Zweitmeinung 3.11. (Cloud-Session, Fable 5.1)
- Unabhängige zweite Prüfung mit CPU-Profil des Seitenstarts, Test ohne WebGL, axe-core und Recherche (Vorbilder, Technik, Skills): `labor/PRUEFUNG-Zweitmeinung-Puls-Scan-2026-11-03.md`. Neu gegenüber dem Prüfbericht vom selben Tag: Start-Blocker durch synchrone Punktwolken-Berechnung (M1, Lazy/Worker), Fallback ohne WebGL inkl. iOS-Lockdown-Modus (M2), `mailto:`-Schwäche am PC (S3), Navigations-Untertitel aus Patientensicht (S1), Idee „Die Tür geht auf“ (K1), Werkzeug-Liste (Abschnitt 6).

## Livegang (2.11.2026)
- Entscheidung Kai: **GitHub Pages mit Domain hopphysio.de**, Wix-Website wird abgelöst, Domain/E-Mail (Google Workspace) bleiben bei Wix. Plan, DNS-Ist-Zustand, Reihenfolge: `LIVEGANG.md`.
- Gebaut: `node build.mjs live` → Vorschau `labor/live/` (https://kairaethel-eng.github.io/labor/live/, noindex). Wurzel-Build `LIVE_ROOT=1 node build.mjs live` erst nach Go.
- Noch nötig vor dem Go: Kais Prüfung der Vorschau, Rechtsangaben (Behörde, Haftpflicht, Google Workspace im Datenschutz), Inhaltsfragen (siehe LIVEGANG.md „Reihenfolge“).

## Prüfung 1.11. abends (lokal auf Kais PC, portables Node im Scratchpad)
- Vollprüfung Puls · Scan (PC, Handy 375/320 px), Wurzelseiten, Live-Wix, Doku → Bericht `Desktop\Claude\claude hop v10\PRUEFBERICHT-Puls-Scan-2026-11-01.md`.
- Umgesetzt (Go): Motiv-Name Leistungen, Figur Hero Handy, Manuthera-Schild Tastatur, THREE.Timer; ENTSCHEIDUNGEN bereinigt (veraltete V10-/Wix-Zeilen, Manuthera-Widerspruch).
- Seit 2.11.2026: **Node.js LTS (v26) installiert, fester Klon `C:\Users\Kai\Desktop\Claude\hop-site`** (nur `main`). Bauen: `cd labor; npm ci; node build.mjs live`. Vorher nur portables Node im Scratchpad.

## Was gilt jetzt
- **V10 ist entfernt** (1.11., Kais Auftrag). Sicherung: ZIP bei Kai + Git-Verlauf bis Commit dd917c6.
- **Startadresse** https://kairaethel-eng.github.io/ = Übergangsseite (Quelle `src/start`, Build `node build.mjs start`), noindex, ohne Animation.
- **/impressum.html, /datenschutz.html** = neue Texte aus `src/recht` (Build `start-ds`, `start-imp`; ohne Labor-Hinweis, Links auf die Wurzel). Labor-Fassungen `recht-*.html` mit Labor-Hinweis.
- **Arbeitsstand Puls · Scan:** https://kairaethel-eng.github.io/labor/test-4-puls-scan.html (unverlinkt, noindex). Branch = `main` (gleicher Commit).
- Wix (hopphysio.de) nutzt Kais eigene Konfiguration, nicht dieses Repo.

## Am 1.11. erledigt (Details in ENTSCHEIDUNGEN.md)
- Prüfung von Puls · Scan + Korrekturen (Raumkarte PC, Kapitel-Menü Handy, Vorlesetexte, Figur, Tippflächen, Leiste schmale Handys, Speicherung nur nach Klick).
- Kais Antworten eingebaut: Zeiten, Abrechnung, antippbarer Kontakt, Telefon „nur Anrufbeantworter“, ich-Form, Wirbelsäule „Schichten“, Werbeaussagen entschärft.
- Klickbares kenntlich (Herzschlag Termin, Scan über Knopf-Gruppen, „+“ bei Leistungen, Wisch-Hinweise).
- Impressum/Datenschutz neu (GitHub Pages, keine Cookies, LfDI neue Adresse).

## Wartet auf Kai
- Behörde laut Erlaubnisurkunde, Berufshaftpflicht (Name + Sitz), E-Mail-Anbieter → in Impressum/Datenschutz eintragen, dann `start-ds`/`start-imp` + `recht-*` neu bauen.
- Visuelles Feedback zu Puls · Scan (iPhone + PC), Herzschlag-Stärke ok?
- Porträt-Fotos; echter 3D-Scan der Praxis (Grundriss stimmt nicht).
- Anrufbeantworter einrichten (Backlog-Projekt „anrufbeantworter-praxis“).

## Offen / später
- V10-Inhalte übernehmen (Körperkarte „Wo tut's weh?“, Einblicke), Leistungs-Motive prüfen, Flüssigkeit auf echten Handys.
- Vor Livegang: Labor-Hinweise entfernen („Schematischer Grundriss“, „· schematisch“, „Testseite 4“), Favicon, Link-Vorschau, strukturierte Praxis-Angaben, Hosting-Entscheidung, Fachperson für Rechtstexte.

## So schickt Kai Verbesserungen am sparsamsten
- **Eine** Nachricht, Bilder zugeschnitten, durchnummeriert: „Bild 1 (PC): … · Bild 2 (Handy): …“, am Ende „Go“.

## Prüfbericht und Plan (3.11.2026)
- Gründliche Prüfung (Render 320–2560 px, axe, Tastatur) plus Netz-Recherche: `labor/PRUEFBERICHT-IDEEN-Puls-Scan-2026-11-03.md`. Umsetzungsplan Stufe 1 (Muss-Punkte vor Livegang, **umgesetzt 3.11.**): `labor/PLAN-Stufe1-2026-11-03.md`. Empfehlung: Stufe 1 in neuer Session mit Sonnet, nur CLAUDE.md + Plan lesen.
