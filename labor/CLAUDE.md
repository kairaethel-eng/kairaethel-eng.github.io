# HOP Labor – Arbeitsanweisung für Claude (zuerst lesen)

Kurz gehalten (seit 18.11.2026, Go Kai „D“): hier stehen nur Regeln, Stand und Wegweiser. Alle technischen Einzelheiten
stehen wörtlich in `labor/TECHNIK.md` – dort gezielt nachschlagen, nicht alles lesen.

## Wer / was
- Kai Raethel, Physiotherapeut, Praxis **HOP – Home of Physiotherapy**, Schorndorf. Skills `kai-arbeitsweise` + `hop-praxis` gelten (Deutsch, knapp; [B]/[A]/[O]-Kennzeichnung).
- **Regel:** Erst erörtern, dann „Go“. Screenshots/Feedback von Kai = kein Auftrag → je Punkt Ursache, 2–3 Optionen, Empfehlung, Go abwarten. Ausdrückliches „Go“ = selbstständig umsetzen.
- Kai prüft visuell auf **iPhone** (meist im Browser der Claude-App, Fenster rund 390×692) und PC (Chrome). Kai will keine Screenshots geschickt bekommen. Kosten: alles kostenlos halten.
- Bei Bewegungsthemen hilft ein kurzer Bildschirmfilm von Kai mehr als ein Standbild – darum bitten.

## So lesen (statt alles zu laden)
1. Diese Datei.
2. `UEBERGABE.md`: nur die Kopfzeile und die obersten ▶-Abschnitte (aktueller Stand, offene Rückmeldungen).
3. `ENTSCHEIDUNGEN.md`: die obersten Abschnitte; weiter unten nur, wenn das Thema berührt wird.
4. `TECHNIK.md`: nur den Abschnitt zum Baustein, an dem gearbeitet wird. `LIVEGANG.md` nur beim Thema Livegang/Wurzel.

## Stand in Kürze
- Richtung **„Puls · Scan“**: dunkel, Partikel, Bernstein-Akzente. Quellen `labor/src/test-4/` → `test-4-puls-scan.html` (Labor) und `live/` („Stand jetzt“, https://kairaethel-eng.github.io/labor/live/).
- Seitenfolge: 01 Von Kopf bis Fuß (echte Figur: Körper, Skelett, Gehirn, Muskeln, Nerven) → 02 Bewegung (Perlenbänder) → § Hausordnung (HOP-Kreise) → 03 Achse (echte Wirbelsäule, Scanner, Film „Bandscheibenvorfall“) → 04 Dach (Linienhaus, Leistungen mit Motiven, Manuthera, Stoßwelle) → 05 Tür (Raum: Tür antippen, umsehen, Wandschrift).
- Seit 17./18.11.2026 gilt der **Feinschliff-Stil** auf der ganzen Seite (Studie `feinschliff.html`, Vergleich `puls-vor-feinschliff.html`).
- Seit 18.11.2026 abends: **Kapitel-Auftakt** vor den Kapiteln 02–05 (große Ziffer, Name, Linie), **Staub** als Übergang 03 ↔ 04, Streifen von Kapitel 02 auch am Handy/Tablet.
- Seit 19.11.2026: **Tür-Bühne „Hineingehen“** in Kapitel 05 (Knöpfe erst drinnen), Logo mit lesbarem H · O · P, **Messanzeige** `?takt=1` (Bilder je Sekunde auf Kais Gerät). Das Stottern der Partikel tritt laut Kai seit 22.11. nicht mehr auf.
- Seit 20.11.2026: **Leistungs-Motive und Manuthera im Stil von Figur und Wirbelsäule** (geordnete Punkte aus `src/shared/raster.js`, Kantenlicht, verdeckte Rückseite); **Übergänge laufen über die Zeit** (Auslöser beim Hereinscrollen, Staub bei jedem Formwechsel, Auftritt der Nebenbühnen aus Staub). Nachts: Arbeitsblatt 3 abgearbeitet – **echte Knochen** (BodyParts3D) in den anatomischen Motiven, Manuthera detaillierter, **Tür öffnet auf Antippen**, Logo neu gezeichnet und groß am Start, Abläufe langsamer. Gegen Mitternacht: Arbeitsblatt 4 abgearbeitet – **Logo nach dem Original**, Kiefergelenk im Blick, Abläufe noch langsamer, Schilder einheitlich, Entwurf **`stosswelle-punkte.html`** (Punkt-Grafik mit echtem Fersenbein, wartet auf Kais Urteil). Seit 21.11.2026: **Stoßwelle in Kapitel 04 als Punkt-Grafik** (echtes Fersenbein; Linien-Zeichnung als Rückfall), in der Kopfleiste wieder das flache Logo, Vergleich **`logo.html`** (A flach · B Mischung · C Original). Abends/spät: **Staub beim Raumwechsel im Linienhaus** (in Puls übernommen), **HOP-Kreise aus Punkten = Logo A** der Kopfleiste; Logo A bleibt. Offene Punkte für Kai: **Arbeitsblatt 4, aktualisiert** (Adresse in `UEBERGABE.md` oben) – zuerst auslesen. Es arbeiten zeitweise zwei Sitzungen an der Seite: vor dem Veröffentlichen immer `git fetch origin main` und zusammenführen.
- Seit 21.11.2026: Kais Screenshot-Punkte umgesetzt (Abstand nach 01, Leitsatz als Zitatblock, Wirbelsäule am Handy ohne Überlappung + „Mehr“-Pille, Dach: Raumtext gleich unter dem Haus) – wartet auf Kais Sichtprüfung (`UEBERGABE.md` oben).
- Seit 21.11.2026 nachmittags: **echte Figur auf der Manuthera** (Körperoberfläche BodyParts3D, `assets/manu-figur.bin`, Werkzeug `tools/manu-figur.mjs`) – wartet auf Kais Sichtprüfung.
- Seit 22.11.2026: Manuthera-Figur ohne „Spitze an der Hüfte“ (Arm-Gewichte unter dem Ellbogen bereinigt, Figur neu erzeugt) – wartet auf Kais Sichtprüfung.
- Seit 22.11.2026 abends: **Manuthera mit beweglichem Kopf- und Brustteil** (Abläufe je Abschnitt Kopf → Brust → Becken, Mittelteil fest wie bei der echten Liege), Wirbel leuchten nach Bewegung (seit 23.11. Verlauf Bernstein → Rot-Orange), Kamera passt sich beim Drehen an; seit 23.11. fünfte Behandlung **Extension** – wartet auf Kais Sichtprüfung.
- Seit 22.11.2026: **„Text ruhig“** – Erklärtext an Manuthera, Stoßwelle und Kontakt hinter Bernstein-Leuchtpunkt-Knöpfen, klappt am Ort auf (Klasse `ruhe`, `src/test-4/ruhe.js`); Vergleich `textruhe.html` – wartet auf Kais Sichtprüfung. Neues Aufklappbares immer mit diesem Muster (`.lp-btn`/`.lp-zone`/`.lp-x`), höchstens ein pulsierender Punkt im Bild.
- Seit 22.11.2026 spät: **Raumlicht „Kräftig“** (Go Kai) – jedes Kapitel ein Raum mit eigenem Licht, Logo-Farben als Raumfarben; Kai lässt es ein paar Tage wirken. Offen: Nerven-Shader Kap. 03 kompiliert auf echter Grafik nicht (`uFade`/`uClip` doppelt, `main.js` `addNerves`) – Fix wartet auf Go. Prüfstand für diese Runde noch nicht gelaufen (lokal kein Playwright).
- Seit 22.11.2026 nachts: Entwurf **`tuer-raum.html`** (Go Kai „a c“) – Kapitel 05 als Raum: Tür antippen, Rahmen wird Bildschirmrand, vier Blickrichtungen mit den Kontakt-Infos; seit 23.11. Runde 2 (Go Kai „Empfehlung“): Text als Wandschrift im Raum (matrix3d), Buch/Telefon/Fenster antippbar, Zeichenfläche in der Bühne (kein Schwimmen beim Scrollen); Stand 1 = `tuer-raum-v1.html`. Von Kai abgenommen (23.11. „passt alles“) und **seit 23.11. in Puls + `live/` übernommen** (Go Kai) – ersetzt Tür-Bühne und Kontaktteil; antippbare Dinge in Bernstein + Tipp-Hinweis. **Offen (Kai 24.11.):** Tischflächen und Punkt-Schriften („GEÖFFNET“, HOP auf dem Tresen) – Befund in `UEBERGABE.md`, Start-Prompt `labor/PROMPT-Feinschliff-Kapitel-05.md`.
- Seit 23.11.2026: Entwurf **`figur-echt.html`** (Go Kai „Empfehlung“) – Startfigur aus echten Daten (Haut neutralisiert, Skelett, Gehirn mit Windungen, Muskeln der Stationen, Nervenwege an echten Landmarken; Werkzeug `tools/figur-echt.mjs`) + Scan-Linie, Filmlicht, Röntgen-Lupe; Umschalter heute · 1 · 1+2. **Seit 23.11. abends Stufe 1 in Puls + `live/`** (Go Kai „1“; Kapitel 01 = `../figur-echt/kapitel.js`, `?figur=heute` = alte Figur) – wartet auf Kais Sichtprüfung.
- Startadresse (`/index.html`, `/impressum.html`, `/datenschutz.html`) ist eine Übergangsseite und wird **nie ohne ausdrückliches Go** geändert. Livegang ruht.
- Entwurfsseiten und Archiv (Figur plus, Tür, Haus-Licht, Fusion, Zuhause, Manuthera, Vorfall …): Liste und Technik in `TECHNIK.md`.

## Gestaltungsregeln (prüfbar – gelten für alles Neue)
- **Punkte:** geordnet (gleicher Abstand, gleiche Größe, scharfer Rand), kein Zittern, kein Zufall im ruhenden Bild.
- **Farben der Punkte:** Petrol → Knochenweiß, Bernstein (Spannung, Nerven, Akzent), ein Blau; Grün im Logo, in Häkchen/Ringen der Bedienung und seit 22.11. als Raumfarbe (Band 2 der Perlenbänder).
- **Raumlicht (seit 22.11.2026, Stufe „Kräftig“):** jedes Kapitel hat sein Licht aus der HOP-Palette (`src/test-4/farbe.js`, kühl → warm); Logo-Farben nur als Raumfarben (Licht, Kapitel-Ziffern, Menü), **Bernstein bleibt die Farbe für Handlung** (Knöpfe, Termin, Leuchtpunkte). Andere Stufen: `?farbe=heute|leise|mittel`, Vergleich `farbstudie.html`.
- **Anatomie:** echte Knochen aus `assets/motive-anatomie.bin` (Figur Kap. 01: `assets/figur-echt.bin`, Werkzeug `tools/figur-echt.mjs`, Haut immer neutralisiert) (BodyParts3D 4.0, CC BY 4.0, Namensnennung) über `src/shared/netz.js`; nichts Anatomisches frei erfinden, wenn es das Teil in den Daten gibt.
- **Punkt-Grafiken:** immer mit `src/shared/raster.js` bauen (Zeilen über die Oberfläche, Normale je Punkt → Kantenlicht, Kern verdeckt die Rückseite); kein Zufall bei der Lage.
- **Abläufe:** Übergänge und Auftritte laufen über die Zeit (Auslöser beim Hereinscrollen, `riegel()` in `main.js`), nicht am Scrollweg. Am Scrollweg bleiben nur: Fahrt an der Figur, Haltestellen der Wirbelsäule (die Tür öffnet auf Antippen). Nur die Menge des Staubs darf am Scrollen hängen (dünner, sobald Text im Lesebereich steht).
- **Bewegung:** ruhig, eine zur Zeit, nichts „explodiert“. Übergänge dürfen verstreut sein, aber als feiner Staub: kleine feste Punktgröße, höchstens 60 % deckend, nie über Text, der gerade gelesen wird. Film-Regel: nie mehr als 28 % des Bilds hell, kein Sprung über 8 Punkte von Bild zu Bild; bei Wisch-Übergängen zwischen Kapiteln (Prüfstand) höchstens 4 Punkte.
- **Hauptgrafik** (Wirbelsäule in der Nahansicht, Stelle im Ring der Figur) ist höchstens zu 35 % verdeckt.
- **Text** steht nie auf unruhigem Grund (höchstens 15 % der Textfläche unter Kontrast 3:1 groß bzw. 4,5:1).
- **Kapitelanfang:** jedes nummerierte Kapitel ab 02 beginnt mit dem Auftakt (`.auftakt-blk`); der Formwechsel der Punkte läuft dahinter. Kein eigener Kicker im Kapitel.
- **Reihenfolge am Handy und Tablet:** Überschrift → Animation → Text (Kai 18.11.). Am PC stehen Überschrift und Grafik nebeneinander, die Überschrift oben in ihrer Spalte.
- **Abstände:** `--gap-chap` vor jedem nummerierten Kapitel (steckt im Auftakt), `--gap-sub` vor Blöcken in Kapitel 04 – keine eigenen Zahlen.
- **Überschriften:** Stärke 560; am PC höchstens zwei Zeilen (Start drei), die kursive Wortgruppe bleibt zusammen.
- **Texte:** Sie-Form, ruhig, keine Heilversprechen (HWG); Gesundheitsinfos mit dem Standard-Hinweis aus `hop-praxis`.
- **Leistung:** jede zusätzliche Zeichenfläche nur in der Nähe ihrer Stelle einschalten und auf dem Grafikchip zeichnen; nichts liegt dauernd bildschirmgroß über der Seite. Im Container ist nur die Skript-Seite messbar – für die Grafik Kais Messanzeige (`?takt=1`) oder Film.
- **Technik:** eine HTML-Datei je Seite, keine externen Abrufe, `noindex` im Labor; CSS in rem, Haarlinien in px; nichts Kostenpflichtiges. Live-Seiten tragen Sicherheitsregeln (CSP, `build.mjs`) – neue fremde Quellen dort eintragen, sonst blockiert sie der Browser.

## „Fertig“ heißt (vor jeder Meldung „umgesetzt“ und vor jedem Veröffentlichen)
1. `cd labor && node build.mjs test-4 && node build.mjs live` (Entwurfsseiten: ihr eigenes Ziel).
2. **Prüfstand:** `node tools/pruefstand.cjs live/index.html <ordner> ia,d` – iPhone-Fenster 390×692 und PC; je Zustand Verdeckung und Text, dazu Wisch-Tests als Filmstreifen (24 Bilder). Nach Änderungen an Motiven/Manuthera zusätzlich `node tools/motive.cjs live/index.html <ordner> d` (Kontaktbogen) ansehen. Jeden „FEHLER“ ansehen: beheben oder als bekannt/gewollt begründen. Die Filmstreifen (`film-*.png`) immer selbst ansehen.
3. `node tools/sizes.cjs live/index.html` → „alles ok“ (niedrige Fenster, Handy quer, ohne JS, ohne Grafikchip, Druck).
4. Je nach Änderung: `tools/gaps.cjs` (Abstände), `tools/heads.cjs` (Überschriften), `tools/audit.cjs` (axe), `tools/kopf-fuss-check.cjs` (Kapitel 01).
5. Die geänderte Stelle in **jedem** Zustand ansehen (alle sechs Haltestellen, alle vier Stationen, alle Räume), in beiden Scrollrichtungen, langsam und mit kräftigem Wisch.
6. Grenzen offen nennen: ohne Grafikchip sind Tempo und Flüssigkeit nicht bewertbar → [O] an Kai, wenn es um Bewegung geht.
7. `UEBERGABE.md` und `ENTSCHEIDUNGEN.md` pflegen; Neues zur Technik nach `TECHNIK.md`.
Ablauf der großen Detailprüfung und Checkliste für die Sichtung: `PRUEFUNG.md`.

## Bauen und veröffentlichen
```bash
cd labor && npm ci && node build.mjs test-4     # Labor-Seite
node build.mjs live                             # Livegang-Vorschau labor/live/
LIVE_ROOT=1 node build.mjs live                 # Wurzel – NUR nach Kais Go (LIVEGANG.md)
```
- Im Container gibt es keinen Grafikchip: die Seite zeigt dort Standbilder; die Werkzeuge hängen selbst `?gl=1` an (eigene Aufrufe ebenso).
- **Testadresse (öffentlich, noindex):** https://kairaethel-eng.github.io/labor/ – Kai hat Go gegeben, **nur den Ordner `labor/`** auf `main` zu veröffentlichen: `git diff --stat origin/main..HEAD -- . ':(exclude)labor'` muss leer sein, dann `git push origin HEAD:main`.
- In CSS-Kommentaren nie `*/` schreiben (auch nicht in Beispielen). Build-Ausgabe immer LF.
- Persönliche Skills, Zugangsdaten und Patientendaten gehören nicht ins Repo; Skill-Änderungen als `.skill`-Datei an Kai.

## Wegweiser
| Thema | Wo |
|---|---|
| Stand, offene Punkte, Kais Rückmeldungen | `UEBERGABE.md` (oben) |
| Entscheidungen und Merkregeln | `ENTSCHEIDUNGEN.md` |
| Bausteine, Dateien, Shader, Werkzeuge im Einzelnen | `TECHNIK.md` |
| Detailprüfung, Checkliste, Prüfstand | `PRUEFUNG.md` |
| Livegang, DNS, Wurzel | `LIVEGANG.md` |

## Antwortstil
- Knapp, nur das Wesentliche; maximale Sorgfalt und Fehlerfreiheit bei der Umsetzung.

## Modellwahl (Empfehlung an Kai)
- Große Umbauten / neue 3D-Effekte: **Opus**. Kleine Text-/Farb-/Abstandsänderungen: **Sonnet** reicht.
