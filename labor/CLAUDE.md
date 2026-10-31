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
- Screenshots im Container: Playwright/Chromium mit `--use-angle=swiftshader` (langsam, ~5–9 fps → Kamerafahrten hängen nach; länger warten).
- Vorschau (privat): Artifact https://claude.ai/artifact/1YU9DYm46ZHqoMJu78dfoM (Fragment-Datei neu veröffentlichen).
- **Testadresse (öffentlich, noindex):** https://kairaethel-eng.github.io/labor/ – Kai hat Go gegeben, **nur den Ordner `labor/`** auf `main` zu veröffentlichen:
  `git diff --stat origin/main..HEAD -- . ':(exclude)labor'` muss leer sein, dann `git push origin HEAD:main`. Arbeitszweig: `claude/3d-cinematic-website-effects-htd2aa`.

## Modellwahl (Empfehlung an Kai)
- Große Umbauten / neue 3D-Effekte: **Opus**. Kleine Text-/Farb-/Abstandsänderungen: **Sonnet** reicht.
