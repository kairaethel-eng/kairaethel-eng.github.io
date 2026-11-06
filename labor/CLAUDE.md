# HOP Labor – Arbeitsanweisung für Claude (zuerst lesen)

Kurzfassung für neue Chats, damit der alte Verlauf nicht geladen werden muss.

## Wer / was
- Kai Raethel, Physiotherapeut, Praxis **HOP – Home of Physiotherapy**, Schorndorf. Skills `kai-arbeitsweise` + `hop-praxis` gelten (Deutsch, knapp; [B]/[A]/[O]-Kennzeichnung).
- **Regel:** Erst erörtern, dann „Go“. Screenshots/Feedback von Kai = kein Auftrag → je Punkt Ursache, 2–3 Optionen, Empfehlung, Go abwarten. Ausdrückliches „Go“ = selbstständig umsetzen.
- Kai prüft visuell auf PC (Chrome) und iPhone. Kosten: alles kostenlos halten.

## Projekt
- Neue Website-Richtung **„Puls · Scan“**: dunkel, Partikel (three.js), Bernstein-Akzente, „die Seite lebt“. Startadresse (`/index.html`, `/impressum.html`, `/datenschutz.html`) **nie ändern ohne ausdrückliches Go**. Seit 1.11.2026 ist V10 entfernt (Kais Auftrag; Sicherung = Git-Verlauf bis Commit dd917c6 + ZIP bei Kai). Die Wurzel ist jetzt eine Übergangsseite; alle drei Dateien werden aus `labor/src` gebaut: `node build.mjs start` (Quelle `src/start`), `start-ds`/`start-imp` (Quelle `src/recht`, ohne Labor-Hinweis, Links auf die Wurzel).
- Arbeitsstand: `labor/src/test-4/` → Build erzeugt `labor/test-4-puls-scan.html` (eine Datei, Schriften/JS eingebettet, keine externen Abrufe, `noindex`).
- Die alten Vergleichsseiten `test-1` Achse, `test-2` Puls, `test-3` Puls + Achse sind seit 4.11.2026 gelöscht (Kais Go; zurückholbar aus dem Git-Verlauf vor dem Lösch-Commit). Weitere Seite: `haus` Hausbesuch (warmes 3D-Haus, nur PC).
- `zuhause` → `zuhause.html`: **Design 2**, Haus als Startmenü (ein Bildschirm, Räume anklicken, Panel/Blatt mit Inhalt). Nutzt `test-4/praxis.js`, `test-4/shapes.js` (housePoints), `manu/ideaA.js`.
- `recht` → `recht-impressum.html`, `recht-datenschutz.html` (Entwürfe) · `portrait` → `portrait.html` (3 Ideen, Beispiel-Büste).
- `manu` → `manuthera.html`: drei Entwürfe für das Manuthera-Highlight (A Bühne, B Raum schaffen, C Drei Ebenen), Vorschau privat https://claude.ai/artifact/74Cab3W8CQXB2hoMBGbtiv.
- **Merkliste aller Entscheidungen (Handy/PC):** `labor/ENTSCHEIDUNGEN.md` – vor Änderungen lesen, danach pflegen.
- Übergabe/Stand/nächste Schritte: `labor/UEBERGABE.md`.

## Dateien test-4
- `main.js` – Szene, Partikel-Shader (Formen 0 Körper · 1 Bewegung · 2 Wirbelsäule · 3 Haus · 4 HOP-Kreise), Kapitel-Logik, Wirbelsäulen-Scan (`updateAxis`), Rundgang (`updateTour`), lebende Überschriften, Ruhemodus/Pause.
- `shapes.js` – Punktwolken (Körper, Wirbelsäule, Haus, Logo) + `spineStipple` (Knochen „Schichten“/„Körnung“, Nervenkurven).
- `services.js` – Leistungs-Motive (eine Partikel-Bühne, Motive prozedural, Reihenfolge = Liste „Alle Leistungen“).
- `praxis.js` – Praxis-Innenraum (`praxisScan`: Scan-Linien + gestochene Möbel mit Kern, Wirbelsäulen-Modell `SPINE_AT` in Behandlung 1). Rundgang ohne Scrollen: `goRoom`, `tourIdx`, `xrayPose` in `main.js`.
- Manuthera-Bühne (Kapitel 04, `#manuthera`): kommt aus `../manu/ideaA.js` (+ `common.js`, `stipple.js`), eigene WebGL-Bühne; in `main.js` `manu`, `manuVisible()` blendet Hintergrund und Röntgenblick aus.
- `../shared/spine.js` – prozedurale Wirbelsäule (C1–Co), Zonen, Nervenwurzeln.
- `page.html`, `style.css` – Inhalt/Gestaltung. Desktop-Grenze 920 px.

## Bauen, prüfen, veröffentlichen
```bash
cd labor && npm install && node build.mjs test-4      # baut labor/test-4-puls-scan.html
# Lokal auf Kais PC (seit 2.11.2026): Node LTS installiert, Klon C:\Users\Kai\Desktop\Claude\hop-site (Branch main). Build-Ausgabe immer LF.
FRAGMENT_DIR=<scratchpad>/artifact node build.mjs test-4   # zusätzlich Fragment für die private Claude-Vorschau
node build.mjs live                 # Livegang-Vorschau labor/live/ (ohne Labor-Reste, mit Favicon/OG/Praxisdaten, noindex)
LIVE_ROOT=1 node build.mjs live     # Wurzel /index.html + Rechtsseiten für hopphysio.de – NUR nach Kais Go (siehe LIVEGANG.md)
```
- Screenshots im Container: `node tools/shot.cjs <seite.html> <präfix> <d|m> '<selektor>|<offset>' …` (Anleitung im Kopf der Datei; `WAIT=7000` bei Kamerafahrten, `REDUCED=1` für „Bewegung reduzieren“). SwiftShader ist langsam (~5–9 fps) → Kamera hängt nach. Kai will **keine** Screenshots geschickt bekommen; nur intern prüfen.
- Screenshots **lokal auf Kais PC** (kein Playwright installiert): `node tools/edgeshot.mjs <seite.html> <präfix> <BxH> '<selektor>|<offset>' …` – steuert das installierte Edge über das DevTools-Protokoll, keine Installation nötig; Bilder nach `%TEMP%\hop-shots`. Extras: `card:<i>|<p>` (Handy Kap. 03), `stay|<js>`, `JS='…'` (Zustand ausgeben), `DESK=1`, `NOGL=1`, `REDUCED=1` (Anleitung im Kopf der Datei). axe aus dem Netz nachladen ist lokal gesperrt → axe-Prüfung (`tools/audit.cjs`) in der Cloud.
- Scroll-Offsets Kapitel 03 (PC, in Bildschirmhöhen ab `#achse`, Kapitel seit 1.11. 440vh): C1–C2 0.61 · C5–C6 1.12 · Th 1.85 · L4–L5 2.58 · S1 3.1.
- „Bewegung anhalten“ wird als `hop-motion` im Browser gemerkt und gilt für **alle** Labor-Seiten; beim Laden im angehaltenen Zustand erscheint ein Hinweis mit „Fortsetzen“. Ziehen/Drehen funktioniert auch angehalten.
- Vorschau (privat): Artifact https://claude.ai/artifact/1YU9DYm46ZHqoMJu78dfoM (älter; maßgeblich ist die Testadresse).
- **Testadresse (öffentlich, noindex):** https://kairaethel-eng.github.io/labor/ – Kai hat Go gegeben, **nur den Ordner `labor/`** auf `main` zu veröffentlichen:
  `git diff --stat origin/main..HEAD -- . ':(exclude)labor'` muss leer sein (Ausnahme: die drei gebauten Wurzel-Dateien nach Kais Go), dann `git push origin HEAD:main`. Arbeitszweig `claude/3d-cinematic-website-effects-htd2aa` ist identisch mit `main` und wird von Kai auf GitHub gelöscht (Entscheidung 2.11.2026); danach gibt es nur noch `main`.

## Technische Merkpunkte
- Größen: CSS in **rem**, Grundschrift wächst ab 1600 px (`html{font-size:clamp(...)}` oben in jeder style.css); neue Werte in rem schreiben, Haarlinien in px. Zum Prüfen großer Monitore auch 2560×1440 ansehen (Kai).
- Build ersetzt Platzhalter mit Funktions-Replacern (`$'` im Bundle!). GLSL `#include` immer auf eigener Zeile.
- Wirbelsäulen-Infos PC: `NINFO` (Texte + Zielpunkt `tgt` auf der Silhouette in Körper-Koordinaten 200×430), `updateCallouts` platziert per Kostenfunktion (Hindernisse: Wirbel-Rechtecke, Zielpunkt, Bahn, andere Schilder, Linien). Handy (Option A, 5.11.): dieselben `.ncall`-Zeilen links gestapelt (`mobMeasure` Texte/Größen bei Abschnittswechsel, `mobPlace` Lage, `updateCalloutsMob` Sichtbarkeit nach `MTH`, „Typisch“ = Kartentext), Karte klebt unten (`measureCards` → `--ch`, `segS`; `natTop` = Lage ohne Kleben, `mobProg`/`mobStuck`); nur mit Klasse `html.seg-rows` (`segRows()`: Handy, WebGL, `MINH ≥ 500`, Adresse `?scan=0`), sonst alte Karte mit Volltext. **Standard am Handy seit 6.11. = Scanner** (`html.seg-scan`, `updateScan` statt des `mob`-Zweigs in `updateAxis`): `SCAN` (Zustand, Vorführfahrt `demo`, Ziehen über `.scan-rail`), `levY`/`stopY` = Bildschirmhöhe der Wirbel/Abschnitte, Shader-Band `uScan`/`uScanAmt`, Zeilen über `mobPlaceScan` (+ `.scan-chips`, kompakt „Therapie: …“ wenn zu eng); seit 6.11. abends **Nahansicht** (`ZM`, `ZOOM`, Übersicht `OV` für Griff/Einrasten, `spineRects(OV)`), Aufbau von unten (`mobPlaceScan`: Karte `.scan-chips` → Typisch → Zeilen, Kompaktstufen `ML.compact` 1/2); Bühnen-Grenzen je Bild aus Punkte-Leiste/Hinweis (`SCAN.top/bot`), alles wandert beim Lösen mit; Kapitel 160svh. **Wischhilfe (6.11. spät):** senkrecht = immer Scrollen (Figur `pan-y`), Scanner nur im Ziehstreifen `RAIL_W` rechts, relatives Ziehen `SCAN.grab`; Hinweise `mkHint` als Pille (`.th-pill`) auf Touch. Sticky braucht Platz **im** Container: Außenabstand der letzten Karte zählt nicht → `.seg-cards::after`.
- **Startzeit (A1, 4.11.2026):** Punktwolken sind Generatoren (`yield` = Pause), `../shared/slice.js`: `runSliced` (≤ 8 ms je Scheibe, `requestIdleCallback`, Aufträge nacheinander) bzw. `runSync` (Vergleichsseiten). In `main.js` baut `whenNear(el, fn)` (rootMargin 150 %) Wirbelsäule (`#achse`), Praxis (`#dach`), Manuthera (`#manuthera`), Motive (`#allTitle`) erst bei Annäherung; bis dahin `det`/`bones`/`prx`/`manu`/`serv` = null (jede Nutzung prüfen!). Mindestabstand: `poissonGrid` (Zahlen-Schlüssel). Beim Start **kein `innerWidth/innerHeight`** lesen (erzwingt Layout) → `VW`/`VH`, Lenis erst nach dem ersten Bild.
- **Ohne WebGL (A2):** `glContext()` (manu/common.js) prüft WebGL 2 vorab → `html.no-gl`, Standbilder `assets/still-*.webp` als CSS-Hintergrund (laden nur dann), Build kopiert sie nach `live/`. Neu rendern: `CHANNEL=msedge CSS='…Text ausblenden…' node tools/shot.cjs …`, Test: `NOGL=1`.
- **K1 „Die Tür geht auf“:** seit 4.11. abends wieder **aus** (Kai: „erschlägt“, alles dunkel); nur noch mit `?licht=1` (`licht` in main.js, `setLicht`, `html.licht` in style.css), sonst unverändert. Screenshots: `QUERY='?licht=1'`.
- **Handy Kapitel 03 (Auftrag 1, 4.11.):** Ablauf an Kartenpositionen statt `PH` (`mob` in `updateAxis`: `inK`/`wIn`/`endK`/`outK`), Karte erst nach Kamera-Ankunft (`gateK`), `X[2]` groß/mittig ab Überschrift (`bigK`, weich nachgeführt). Handy-Szenenhöhe `GLH` wächst nur (Safari-Leiste), Scroll-Schwellen auf `MINH` (stabil), Projektionen Bild→px mit `GLH`. `houseGone()` blendet Haus/Röntgenblick nach dem Rundgang sofort aus; dabei scrollt die Szene per `camera.setViewOffset` (`viewLift`) mit den Knöpfen hoch. Röntgenblick vor dem Betreten des Rundgangs gedämpft (`xrayCalm` 0.25 → Linien/`tU.uDim` Möbel/Haus-Umriss blass, `tourEngaged`); Hinweis „Wischen oder Raum antippen“ am Handy als dunkle Pille (`.th-pill`), ~1 s nach dem Röntgenblick. Screenshots im Container: SwiftShader ist langsam → Karten erscheinen erst nach ~6–8 s (`WAIT=8000`).
- Kamera: `tourWant` > `axisWant` > Übersicht. Ruhemodus `reduced` (CALM 0.45), Pause-Knopf `#motionBtn`, iOS-Watchdog für rAF.
- Persönliche Skills (`kai-arbeitsweise`, `hop-praxis`) gehören **nicht** ins öffentliche Repo; Änderungen als `.skill`-Datei an Kai liefern.

## Antwortstil
- Knapp, nur das Wesentliche; maximale Sorgfalt und Fehlerfreiheit bei der Umsetzung.

## Modellwahl (Empfehlung an Kai)
- Große Umbauten / neue 3D-Effekte: **Opus**. Kleine Text-/Farb-/Abstandsänderungen: **Sonnet** reicht.
