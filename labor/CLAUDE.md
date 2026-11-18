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
- Seitenfolge: 01 Von Kopf bis Fuß (Figur mit Gehirn und Nerven) → 02 Bewegung (Perlenbänder) → § Hausordnung (HOP-Kreise) → 03 Achse (echte Wirbelsäule, Scanner, Film „Bandscheibenvorfall“) → 04 Dach (Linienhaus, Leistungen mit Motiven, Manuthera, Stoßwelle) → 05 Tür.
- Seit 17./18.11.2026 gilt der **Feinschliff-Stil** auf der ganzen Seite (Studie `feinschliff.html`, Vergleich `puls-vor-feinschliff.html`).
- Startadresse (`/index.html`, `/impressum.html`, `/datenschutz.html`) ist eine Übergangsseite und wird **nie ohne ausdrückliches Go** geändert. Livegang ruht.
- Entwurfsseiten und Archiv (Figur plus, Tür, Haus-Licht, Fusion, Zuhause, Manuthera, Vorfall …): Liste und Technik in `TECHNIK.md`.

## Gestaltungsregeln (prüfbar – gelten für alles Neue)
- **Punkte:** geordnet (gleicher Abstand, gleiche Größe, scharfer Rand), kein Zittern, kein Zufall im ruhenden Bild.
- **Farben der Punkte:** Petrol → Knochenweiß, Bernstein (Spannung, Nerven, Akzent), ein Blau; Grün nur im Logo und in Häkchen/Ringen der Bedienung.
- **Bewegung:** ruhig, eine zur Zeit, nichts „explodiert“. Film-Regel: nie mehr als 28 % des Bilds hell, kein Sprung über 8 Punkte von Bild zu Bild.
- **Hauptgrafik** (Wirbelsäule in der Nahansicht, Stelle im Ring der Figur) ist höchstens zu 35 % verdeckt.
- **Text** steht nie auf unruhigem Grund (höchstens 15 % der Textfläche unter Kontrast 3:1 groß bzw. 4,5:1).
- **Abstände:** `--gap-chap` vor jedem nummerierten Kapitel, `--gap-sub` vor Blöcken in Kapitel 04 – keine eigenen Zahlen.
- **Überschriften:** Stärke 560; am PC höchstens zwei Zeilen (Start drei), die kursive Wortgruppe bleibt zusammen.
- **Texte:** Sie-Form, ruhig, keine Heilversprechen (HWG); Gesundheitsinfos mit dem Standard-Hinweis aus `hop-praxis`.
- **Technik:** eine HTML-Datei je Seite, keine externen Abrufe, `noindex` im Labor; CSS in rem, Haarlinien in px; nichts Kostenpflichtiges.

## „Fertig“ heißt (vor jeder Meldung „umgesetzt“ und vor jedem Veröffentlichen)
1. `cd labor && node build.mjs test-4 && node build.mjs live` (Entwurfsseiten: ihr eigenes Ziel).
2. **Prüfstand:** `node tools/pruefstand.cjs live/index.html <ordner> ia,d` – iPhone-Fenster 390×692 und PC; je Zustand Verdeckung und Text, dazu Wisch-Tests als Filmstreifen. Jeden „FEHLER“ ansehen: beheben oder als bekannt/gewollt begründen. Die Filmstreifen (`film-*.png`) immer selbst ansehen.
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
