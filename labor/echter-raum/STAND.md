# Probe „Echter Raum“ – Stand 11.11.2026

Eigene Probe, **nichts Bestehendes geändert**. Liegt nur auf dem Arbeitszweig, nicht auf `main` (dorthin nur mit Kais Go).

## Worum es geht
Kai (10./11.11.): Die Lichtprobe „Licht an“ (Zweig `claude/festive-clarke-8ms9z7`, Ordner `labor/licht-an/`) hat ihm zu viele Partikel, wirkt unruhig. Frage: echte Praxis als fast realer „Raumgang“, **interaktive und gebaute Elemente bleiben**, **durchgehendes Gehen** gewünscht („fände ich super“) → Ziel Stufe 2 = 3D-Scan (Gaussian Splat), Partikel nur noch für das Hauptmotiv.

## Was es gibt
- Private Vorschau: https://claude.ai/artifact/5HurrGcwKRE3Bxts2WR152 – Kais Scaniverse-Scan „Schorndorf“ (349 154 Splats, SH3, 8,6 MB) als Kulisse, Fusion-Figur „Spannung lösen“ (`../src/fusion/figure.js`, unverändert) bedienbar darin, Scrollweg = Weg (Ankommen → Figur → durch die Tür), seitlich ziehen = umschauen, Umschalter Raum hell / gedämpft / dunkel.
- **Zweiter Scan (11.11., Kai):** „Schorndorf“ 565 893 Splats, SH3, 13,4 MB – ein Flur, rund 8 m lang, Boden y = −0,75 m, achsparallel. In der Vorschau als „2 · Flur“ (Standard) neben „1 · Raum“ wählbar; Weg den Flur entlang, Figur steht im Flur. Geladen wird nur der gewählte Scan.
- `main.js`, `echter-raum.html` – Quellen. Renderer: Spark 2.4.0 (`@sparkjsdev/spark`, MIT) am vorhandenen three-Renderer.
- `vorschau.py` – grobe Software-Vorschau eines SPZ (Punkte statt Splats), um im Container Kamerastandpunkte zu prüfen.
- **Der Scan liegt nicht im Repo** (Scaniverse: nur private, nicht-kommerzielle Nutzung; für die Website braucht es den Weg Kamera-Video → Rechnen am PC).

## Bauen
```bash
npm i @sparkjsdev/spark three@0.187.0 esbuild      # in einem Arbeitsordner außerhalb des Repos
npx esbuild labor/echter-raum/main.js --bundle --minify --format=iife --outfile=pub/probe.js
# Scans als pub/scan.wasm (Raum) und pub/scan2.wasm (Flur) ablegen (die Artifact-Vorschau liefert keine .spz aus), Seite + beide Dateien veröffentlichen
```

## Geprüft / offen
- [B] Scan-Maße: Boden y = −0,67 m, Raum etwa 3,2 × 2,7 m plus Durchgang, Wände 43° zur Achse gedreht, y zeigt nach oben.
- [B] Seite, Scrollweg, Figur, Streichen (Spannung 100 → 82), 1280×800 und 390×844, keine Fehler – mit **Platzhalter statt Splat-Renderer**.
- [B] Spark lädt den Scan im Container (nach 63 s bereit), zeichnet dort aber zu langsam für ein Bild (kein Grafikchip).
- [O] Aussehen des Scans im echten Renderer, Lage der Figur im Raum, Bildrate am iPhone/PC – **nur Kai kann das sehen**.
- [A] Die Figur blendet additiv: auf hellen Wänden („Hell“) ist sie schwach sichtbar → der echte Raum muss gedämpft werden oder die Figur braucht eine andere Zeichenart.

## Nächste Schritte (warten auf Kai)
1. Kais Blick auf die Vorschau (PC + iPhone): Scan-Qualität, Ruckeln, welche Helligkeit, steht die Figur richtig.
2. Wenn überzeugend: Kamera-Video der Strecke Haustür → Empfang → Flur → Behandlung 1, Rechnen am PC (Spirula Studio o. ä., kostenlos).
3. Polycam-Businesstest (7 Tage, danach 400 $/Jahr, automatisch) nur als geplanter Joker; ob Splat-Export enthalten ist, ist offen.
