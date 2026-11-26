# HOP Labor – Arbeitsanweisung für Claude (zuerst lesen)

Kurz gehalten (seit 18.11.2026, Go Kai „D“): hier stehen nur Regeln, Stand und Wegweiser. Alle technischen Einzelheiten
stehen wörtlich in `labor/TECHNIK.md` – dort gezielt nachschlagen, nicht alles lesen.

## Wer / was
- Kai Raethel, Physiotherapeut, Praxis **HOP – Home of Physiotherapy**, Schorndorf. Skills `kai-arbeitsweise` + `hop-praxis` gelten (Deutsch, knapp; [B]/[A]/[O]-Kennzeichnung). Kai duzen, locker; die Sie-Form gilt nur für Website- und Patiententexte.
- **Regel:** Erst erörtern, dann „Go“. Screenshots/Feedback von Kai = kein Auftrag → je Punkt Ursache, 2–3 Optionen, Empfehlung, Go abwarten. Ausdrückliches „Go“ = selbstständig umsetzen.
- Kai prüft visuell auf **iPhone** (meist im Browser der Claude-App, Fenster rund 390×692) und PC (Chrome). Kai will keine Screenshots geschickt bekommen. Kosten: alles kostenlos halten.
- **„prüfen und sichern“** (Kai, 24.11.2026): alle offenen Aufgaben des Chats ins Claude Doc „HOP – Arbeitsblatt offene Aufgaben“ eintragen (https://claude.ai/artifact/3gohGz57mTaSZwY8uAfViu, neuer Abschnitt oben unter „Einträge“; was Kai ansehen soll, in die „Sichtprüf-Liste“ dort), dazu `UEBERGABE.md` pflegen, committen, pushen.
- Bei Bewegungsthemen hilft ein kurzer Bildschirmfilm von Kai mehr als ein Standbild – darum bitten.

## So lesen (statt alles zu laden)
1. Diese Datei.
2. `UEBERGABE.md`: Kopf, Liste „Offen“ und die obersten ▶-Abschnitte. `archiv/` nur gezielt durchsuchen (grep), nie ganz lesen.
3. `ENTSCHEIDUNGEN.md`: die obersten Abschnitte; weiter unten nur, wenn das Thema berührt wird.
4. `TECHNIK.md`: nur den Abschnitt zum Baustein, an dem gearbeitet wird. `LIVEGANG.md` nur beim Thema Livegang/Wurzel.
Das gilt auch für die Leseliste in der Wurzel-`CLAUDE.md`: gezielt lesen, nicht ganz.

## Stand in Kürze
Kein Verlauf – nur was heute gilt. Was wann warum entstand: `UEBERGABE.md`, Älteres in `archiv/`.
- Richtung **„Puls · Scan“**: dunkel, Partikel, Bernstein-Akzente. Quellen `labor/src/test-4/` → `test-4-puls-scan.html` (Labor) und `live/` („Stand jetzt“, https://kairaethel-eng.github.io/labor/live/).
- Seitenfolge: 01 Von Kopf bis Fuß (Weg M: Muskelfigur, MRT-Gehirn, Rückenmark, Nerven, Leitsatz; `../figur-echt/kapitel.js`) → 02 Bewegung (Perlenbänder) → § Hausordnung (HOP-Kreise = Logo A) → 03 Achse (echte Wirbelsäule, Scanner, Film „Bandscheibenvorfall“) → 04 Dach (Linienhaus, Leistungen mit Motiven, Manuthera mit fünf Behandlungen, Stoßwelle als Punkt-Grafik) → 05 Tür (Raum: Tür antippen, umsehen, Wandschrift, antippbare Dinge in Bernstein).
- Auf der ganzen Seite gelten: Feinschliff-Stil, Kapitel-Auftakt vor 02–05, Staub bei jedem Formwechsel, Abläufe über die Zeit, „Text ruhig“ (Erklärtext hinter Leuchtpunkt-Knöpfen, Klasse `ruhe`, `src/test-4/ruhe.js`; Neues zum Aufklappen immer mit `.lp-btn`/`.lp-zone`/`.lp-x`, höchstens ein pulsierender Punkt im Bild), Raumlicht „Kräftig“ (Kai lässt es wirken).
- Von Kai abgenommen: Film „Bandscheibenvorfall“ (16.11.), Raum Kapitel 05 als Entwurf (23.11.), Manuthera als Ganzes (24.11.). Alles andere steht in der Liste „Offen“ oben in `UEBERGABE.md`.
- Schalter zum Vergleichen und Messen: `?takt=1` (Bilder je Sekunde auf Kais Gerät), `?farbe=heute|leise|mittel`, `?figur=heute` (Figur bis 23.11.), `?start=a…l` (Entwürfe der Startfigur, Übersicht `figur-wahl.html`; `a` = Startfigur bis 26.11.). **Seit 26.11.2026 ist Weg M Standard** (Kai: „auf die Website kommt M definitiv“): Muskelfigur → Gehirn → Fahrt am Rückenmark im Profil (Körper nur als Hauch) → Nerven schreiben den Leitsatz → daraus die Linien von Kapitel 02 (`startWahl('m')` in `figur-echt/daten.js`; Entwurfsseite `figur-echt.html` bleibt bei der alten Figur). Gehirn seit 26.11. abends „hell auf dunkel“ (Stil A; `?hirn=alt|b|c` zum Vergleich, im Gehirn-Blick tritt das Raumlicht zurück).
- Bekannt und offen: Kapitel 05: Tischflächen und Punkt-Schriften („GEÖFFNET“, HOP am Tresen) – Start-Prompt `labor/PROMPT-Feinschliff-Kapitel-05.md`. Platzhalter für Kais Daten tragen `data-platzhalter` (Porträt, drei Fakten, „Ihr erster Besuch“) – der Wurzel-Bau bricht ab, solange einer da ist.
- Es arbeiten zeitweise zwei Sitzungen an der Seite: vor dem Veröffentlichen immer `git fetch origin main` und zusammenführen. Besser: eine Website-Sitzung zur Zeit.
- Startadresse: seit 24.11.2026 **offline** (Kai; Wurzel-Dateien entfernt, `robots.txt` sperrt alles, Vorschau `/labor/live/` bleibt). Wurzel wird **nie ohne ausdrückliches Go** wieder befüllt. Livegang ruht, die echte Seite läuft bis dahin bei Wix.
- Entwurfsseiten und Vergleiche (Figur plus, Tür, Haus-Licht, Logo, Farbstudie, Fusion, Zuhause, Manuthera, Vorfall …): Liste und Technik in `TECHNIK.md`.

## Doku kurz halten (seit 24.11.2026, Go Kai)
- **`UEBERGABE.md`:** Kopf höchstens fünf Zeilen. Darunter **eine** Liste „Offen“ (Kai am Zug · Claude wartet auf Go) – dort pflegen, nicht in jedem Abschnitt neu „wartet auf …“ schreiben. Je Runde ein kurzer ▶-Abschnitt (Auftrag, was geändert, geprüft, Rückweg).
- **Auslagern:** Abschnitte, die abgenommen oder älter als etwa eine Woche sind, wandern nach `archiv/` (Datei je Zeitraum, nur anhängen). Vorher Offenes in die Liste „Offen“ übernehmen. Gleiches gilt für `ENTSCHEIDUNGEN.md`: oben nur Regeln, die für die laufende Seite gelten.
- **Sichtprüfungen:** Alles, was Kai ansehen soll, steht im Arbeitsblatt unter „Sichtprüf-Liste“ (Link, wo hinschauen, worauf achten). Stehen dort **mehr als fünf** offene Punkte, vor neuem Bauen Kai auf die Liste hinweisen und fragen, ob er erst prüfen will.
- **Rollen:** Arbeitsblatt = Kais Aufgaben und Sichtprüfungen · `UEBERGABE.md` = technischer Stand für Claude · Projekt-Backlog = nur ganze Vorhaben, keine Einzelschritte.

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
| Ältere Runden und Entscheidungen | `archiv/` (durchsuchen, nicht laden) |
| Entscheidungen und Merkregeln | `ENTSCHEIDUNGEN.md` |
| Bausteine, Dateien, Shader, Werkzeuge im Einzelnen | `TECHNIK.md` |
| Detailprüfung, Checkliste, Prüfstand | `PRUEFUNG.md` |
| Livegang, DNS, Wurzel | `LIVEGANG.md` |

## Antwortstil
- Knapp, nur das Wesentliche; maximale Sorgfalt und Fehlerfreiheit bei der Umsetzung.

## Modellwahl (Empfehlung an Kai)
- Große Umbauten / neue 3D-Effekte: **Opus**. Kleine Text-/Farb-/Abstandsänderungen: **Sonnet** reicht.
