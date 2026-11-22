# Detailprüfung – fester Ablauf (seit 7.11.2026, Go Kai „b“)

Zweck: die ganze Seite in gleichbleibender Weise auf Details prüfen und **Empfehlungen mit der größten Wirkung** liefern.
Auslöser: Kai schreibt „Detailprüfung“ (optional mit Seite/Bereich) – oder nach größeren Umbauten. Später ggf. als Zeitplan (Option c, erst nach Kais Go).

## Prüfstand – vor jeder Meldung „umgesetzt“ und vor jedem Veröffentlichen (seit 18.11.2026, Go Kai „a“)
Anlass: Kai sah am iPhone drei Dinge, die mir entgangen waren (Prüffenster 390×844 statt echt rund 390×692, nur Standbilder, nur eine Haltestelle).
```bash
cd labor && node build.mjs test-4 && node build.mjs live
node tools/pruefstand.cjs live/index.html <ordner> ia,d > <ordner>/log.txt 2>&1   # im Hintergrund starten; ia rund 35 min, d rund 55 min → als zwei Läufe nebeneinander, PC mit 60 min Zeitgrenze oder getrennt (`d zustand`, `d film`)
```
- **Ansichten:** `ia` 390×692 (Kais iPhone im Browser der Claude-App – Standard), `is` 390×664, `il` 390×753, `ix` 430×740, `ie` 375×553, `d` 1440×900, `l` 1366×650, `xl` 2560×1440.
- **Zustände** (je ein Bild + Messung): Start, Kap. 01 kurz nach dem Wisch und an allen vier Stationen, Schluss, Kap. 02, Hausordnung, Kap. 03 Übersicht und **alle sechs Haltestellen**, Dach, Leistungen, Manuthera, Stoßwelle, Tür.
- **Messungen:** Verdeckung der Hauptgrafik (Regel ≤ 35 %) · Text auf unruhigem Grund (Regel ≤ 15 % der Textfläche unter Kontrast) · Film: Anteil heller Bildpunkte (≤ 28 %) und Sprung von Bild zu Bild (≤ 4 Punkte; geeicht am 18.11.: ruhige Übergänge 0,2–3,3 · zerstiebende Wirbelsäule 8,4 · Rückweg 4,9).
- **Filme** (`film-<ansicht>-<name>.png`, seit 20.11. 24 Bilder, Abstand 120 ms – die Abläufe laufen über die Zeit und sollen zu Ende zu sehen sein; Handy zwei Reihen zu zwölf, PC drei Reihen zu acht): ein Wisch mit Schwung an jedem Kapitelübergang, dazu Kap. 03 von S1 und von C1 nach 04 und zurück. **Jeden Streifen selbst ansehen** – die Zahlen finden nur Grobes.
- **Hilfen:** `NUR=kf-01,achse-Th1` (nur diese Zustände/Filme) · `ABC=1` (Messbilder B „nur Grafik“ und C „Text durchsichtig“ ablegen) · `DBG=1` (Farbe und Flächen zu jedem Text-Befund) · `BASIS=<ordner eines früheren Laufs>` (meldet, welche Zustände sich geändert haben – vor einem Umbau einen Lauf als Basis aufheben).
- **Achtung Vorgeschichte:** Übergänge können sich im vollen Lauf anders verhalten als in der Einzelprüfung mit `NUR=` (18.11.: helle Wolke am PC nur im vollen Lauf). `NUR=` ist zum Nachsehen da, das Urteil kommt aus dem vollen Lauf.
- **Umgang mit „FEHLER“:** Bild ansehen → beheben oder im Bericht als bekannt/gewollt begründen. Ein „alles ok“ ersetzt die Sichtung nicht.
- **Zweites Augenpaar (Go Kai „c“):** nach größeren Umbauten einen Unteragenten ohne Vorwissen die Bilder und Streifen nach der Checkliste unten beurteilen lassen (nur Bilder + Gestaltungsregeln mitgeben, keine eigene Vermutung). Befunde als Liste an Kai, nichts ungefragt umsetzen.
- **Grenze [B]:** Die Software-Grafik im Container zeigt nicht alles, was ein echter Grafikchip zeigt (Beispiel 18.11.: Kais „Explosion“ beim Übergang 03 → 04 ist hier auch im Film nicht zu sehen). Bei Bewegungsthemen deshalb immer [O] an Kai und um einen kurzen Bildschirmfilm bitten.

## Ablauf (Cloud-Container, ~35–60 min; review.cjs je Ansicht: PC ~10 min, Handy ~4 min, 2560 länger)
1. `git pull`, `cd labor && npm ci && node build.mjs test-4 && node build.mjs live`
2. **Bildersatz + Messungen:** `node tools/review.cjs live/index.html <ordner> d,m,xl` (optional `s` 320×568, `dr` „Bewegung reduzieren“).
   Lange Läufe im Hintergrund starten (`> run.log`) und das Log beobachten – im Vordergrund bricht der Befehl nach 10 min ab.
   Ergebnis: alle Zustände je Ansicht (Start, Kap. 02, Wirbelsäule Übersicht + 6 Haltestellen, Dach, Rundgang, Rundgang aus Augenhöhe, Manuthera, Leistungen mit **allen 12 Motiven einzeln**, Hausordnung, Tür, Termin-Blatt, Fußzeile), `sheet-<ansicht>.png` (Kontaktbogen), `review.md` (je Zustand: Fehler, überlappende/abgeschnittene Texte, Schrift < 11 px, Querscrollen, lange Aufgaben).
2b. **Größen und Rückfälle (seit 13.11.):** `node tools/sizes.cjs live/index.html` (~3 min) – niedrige Laptop-Fenster 1366×650/1280×600, Kopfleiste 921–1300 px, Handy quer, Manuthera am Handy, ohne JavaScript, Software-Grafik, Druck, Kapitel-Links; jede Zeile „ok“/„FEHLER“.
   Hinweis: Die Seite zeigt bei Software-Grafik (also immer im Container) Standbilder; alle Werkzeuge hängen deshalb `?gl=1` an (Prüfmodus). `GL0=1` davor zeigt, was ein Besucher ohne Grafikchip sieht.
3. **Barrierefreiheit/Struktur:** `npm i -D --no-save axe-core && node tools/audit.cjs live/index.html <ordner2> d,m` (axe WCAG 2.2 AA, Überschriften, Tab-Reihenfolge, kleine Tippziele).
4. **Sichtung** jedes Bildes nach der Checkliste unten (Kontaktbogen für den Überblick, Einzelbild für Details).
5. **Bericht** in `UEBERGABE.md` ▶ (Abschnitt „Detailprüfung <Datum>“): höchstens ~12 Punkte, **sortiert nach Wirkung** (was der Besucher zuerst merkt), je Punkt: Befund [B]/[A]/[O] · Ursache · 2–3 Optionen · Empfehlung · Aufwand (klein/mittel/groß, Sonnet/Opus). Danach **Go je Punkt abwarten** – nichts umsetzen.
6. Bekanntes nicht doppelt melden: vorher `UEBERGABE.md` (offene Punkte) und `ENTSCHEIDUNGEN.md` lesen; bewusst Entschiedenes nur ansprechen, wenn es sichtbar schadet.

## Checkliste Sichtung
- **Erster Eindruck je Bild:** Ist sofort klar, worum es geht und was man tun kann? Wirkt etwas leer, überladen, billig oder unfertig?
- **Typografie:** Hierarchie (Kicker → Überschrift → Text), Zeilenlänge (45–75 Zeichen), unschöne Umbrüche (einzelnes Wort in letzter Zeile, getrennte Namen/Zahlen „C1–C2“), gleiche Größen für Gleiches.
- **Abstände/Ausrichtung:** gemeinsame Kanten, gleiche Abstände zwischen gleichen Elementen, Luft zu Rändern (Handy ≥ 16 px), nichts klebt an der Leiste.
- **Farbe/Kontrast:** Bernstein sparsam und gezielt, Text über Partikeln lesbar, Zustände (aktiv/Fokus/Hover) erkennbar.
- **3D-Szenen:** Form sofort lesbar (Wirbelsäule, Haus, Liege, Motive), nichts am Bildrand abgeschnitten, keine Kollision mit Text oder Knöpfen, Punktdichte/Überstrahlen, Größe auf 2560 und 390 passend.
- **Leistungs-Motive (12):** erkennt man die Leistung ohne Titel? passt die Bewegung zur Behandlung? gleiche Größe/Qualität wie die Nachbarn?
- **Bedienung:** Knöpfe als Knöpfe erkennbar, Hinweise verständlich, Tippziele ≥ 24 px (besser 44 px am Handy), Zurück-Wege (Rundgang, Blatt, Dialog).
- **Inhalt:** Rechtschreibung, Sie-Form, gleiche Begriffe (Termin, Praxis, Leistungen), fachlich plausibel (Wirbelsäulen-Texte: [A] von Kai prüfen lassen), keine Heilversprechen (HWG).
- **PC ↔ Handy ↔ 2560:** gleiche Aussage, nichts fehlt, nichts doppelt.
- **Messwerte aus `review.md`:** jede Überlappung/Abschneidung im Bild nachsehen – gewollt (Gestaltung) oder Fehler?

## Grenzen (immer im Bericht nennen)
- Container rendert per SwiftShader (2–9 fps): **Tempo, Flüssigkeit und Gefühl von Bewegung nicht bewertbar**; Kamera kann im Bild noch unterwegs sein. Lange Aufgaben nur relativ vergleichen.
- iPhone-Safari (Leisten, Wischgesten, `IOS_SAFARI`-Reserve) nur am echten Gerät → als [O] an Kai.
- Geschmacksfragen sind Vorschläge, Kai entscheidet.
