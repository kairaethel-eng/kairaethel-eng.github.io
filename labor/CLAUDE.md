# HOP Labor – Arbeitsanweisung für Claude (zuerst lesen)

Kurzfassung für neue Chats, damit der alte Verlauf nicht geladen werden muss.

## Wer / was
- Kai Raethel, Physiotherapeut, Praxis **HOP – Home of Physiotherapy**, Schorndorf. Skills `kai-arbeitsweise` + `hop-praxis` gelten (Deutsch, knapp; [B]/[A]/[O]-Kennzeichnung).
- **Regel:** Erst erörtern, dann „Go“. Screenshots/Feedback von Kai = kein Auftrag → je Punkt Ursache, 2–3 Optionen, Empfehlung, Go abwarten. Ausdrückliches „Go“ = selbstständig umsetzen.
- Kai prüft visuell auf PC (Chrome) und iPhone. Kosten: alles kostenlos halten.

## Projekt
- Neue Website-Richtung **„Puls · Scan“**: dunkel, Partikel (three.js), Bernstein-Akzente, „die Seite lebt“. Live-Website (`/index.html`, Impressum, Datenschutz) **nie ändern ohne ausdrückliches Go**.
- Arbeitsstand: `labor/src/test-4/` → Build erzeugt `labor/test-4-puls-scan.html` (eine Datei, Schriften/JS eingebettet, keine externen Abrufe, `noindex`).
- Weitere Seiten nur zum Vergleich: `test-1` Achse, `test-2` Puls, `test-3` Puls + Achse, `haus` Hausbesuch (warmes 3D-Haus, nur PC).
- **Merkliste aller Entscheidungen (Handy/PC):** `labor/ENTSCHEIDUNGEN.md` – vor Änderungen lesen, danach pflegen.
- Übergabe/Stand/nächste Schritte: `labor/UEBERGABE.md`.

## Dateien test-4
- `main.js` – Szene, Partikel-Shader (Formen 0 Körper · 1 Bewegung · 2 Wirbelsäule · 3 Haus · 4 HOP-Kreise), Kapitel-Logik, Wirbelsäulen-Scan (`updateAxis`), Rundgang (`updateTour`), lebende Überschriften, Ruhemodus/Pause.
- `shapes.js` – Punktwolken (Körper, Wirbelsäule, Haus, Logo) + `spineStipple` (Knochen „Schichten“/„Körnung“, Nervenkurven).
- `praxis.js` – Praxis-Innenraum als Punktwolke aus V10-Grundriss (später durch echten 3D-Scan ersetzbar, gleiche Datenform).
- `../shared/spine.js` – prozedurale Wirbelsäule (C1–Co), Zonen, Nervenwurzeln.
- `page.html`, `style.css` – Inhalt/Gestaltung. Desktop-Grenze 920 px.

## Bauen, prüfen, veröffentlichen
```bash
cd labor && npm install && node build.mjs test-4      # baut labor/test-4-puls-scan.html
FRAGMENT_DIR=<scratchpad>/artifact node build.mjs test-4   # zusätzlich Fragment für die private Claude-Vorschau
```
- Screenshots im Container: `node tools/shot.cjs <seite.html> <präfix> <d|m> '<selektor>|<offset>' …` (Anleitung im Kopf der Datei; `WAIT=7000` bei Kamerafahrten, `REDUCED=1` für „Bewegung reduzieren“). SwiftShader ist langsam (~5–9 fps) → Kamera hängt nach. Kai will **keine** Screenshots geschickt bekommen; nur intern prüfen.
- Scroll-Offsets Kapitel 03 (PC, in Bildschirmhöhen ab `#achse`): C1–C2 0.75 · C5–C6 1.38 · Th 2.27 · L4–L5 3.16 · S1 3.8.
- Vorschau (privat): Artifact https://claude.ai/artifact/1YU9DYm46ZHqoMJu78dfoM (Fragment-Datei neu veröffentlichen).
- **Testadresse (öffentlich, noindex):** https://kairaethel-eng.github.io/labor/ – Kai hat Go gegeben, **nur den Ordner `labor/`** auf `main` zu veröffentlichen:
  `git diff --stat origin/main..HEAD -- . ':(exclude)labor'` muss leer sein, dann `git push origin HEAD:main`. Arbeitszweig: `claude/3d-cinematic-website-effects-htd2aa`.

## Technische Merkpunkte
- Build ersetzt Platzhalter mit Funktions-Replacern (`$'` im Bundle!). GLSL `#include` immer auf eigener Zeile.
- Wirbelsäulen-Infos PC: `NINFO` (Texte + Zielpunkt `tgt` auf der Silhouette in Körper-Koordinaten 200×430), `updateCallouts` platziert per Kostenfunktion (Hindernisse: Wirbel-Rechtecke, Zielpunkt, Bahn, andere Schilder, Linien). Handy: Karten (`.seg-card`), Infos dort.
- Kamera: `tourWant` > `axisWant` > Übersicht. Ruhemodus `reduced` (CALM 0.45), Pause-Knopf `#motionBtn`, iOS-Watchdog für rAF.
- Persönliche Skills (`kai-arbeitsweise`, `hop-praxis`) gehören **nicht** ins öffentliche Repo; Änderungen als `.skill`-Datei an Kai liefern.

## Antwortstil
- Knapp, nur das Wesentliche; maximale Sorgfalt und Fehlerfreiheit bei der Umsetzung.

## Modellwahl (Empfehlung an Kai)
- Große Umbauten / neue 3D-Effekte: **Opus**. Kleine Text-/Farb-/Abstandsänderungen: **Sonnet** reicht.
