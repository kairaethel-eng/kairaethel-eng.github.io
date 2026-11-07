# Detailprüfung – fester Ablauf (seit 7.11.2026, Go Kai „b“)

Zweck: die ganze Seite in gleichbleibender Weise auf Details prüfen und **Empfehlungen mit der größten Wirkung** liefern.
Auslöser: Kai schreibt „Detailprüfung“ (optional mit Seite/Bereich) – oder nach größeren Umbauten. Später ggf. als Zeitplan (Option c, erst nach Kais Go).

## Ablauf (Cloud-Container, ~35–60 min)
1. `git pull`, `cd labor && npm ci && node build.mjs test-4 && node build.mjs live`
2. **Bildersatz + Messungen:** `node tools/review.cjs live/index.html <ordner> d,m,xl` (optional `s` 320×568, `dr` „Bewegung reduzieren“).
   Ergebnis: alle Zustände je Ansicht (Start, Kap. 02, Wirbelsäule Übersicht + 6 Haltestellen, Dach, Rundgang, Rundgang aus Augenhöhe, Manuthera, Leistungen mit **allen 12 Motiven einzeln**, Hausordnung, Tür, Termin-Blatt, Fußzeile), `sheet-<ansicht>.png` (Kontaktbogen), `review.md` (je Zustand: Fehler, überlappende/abgeschnittene Texte, Schrift < 11 px, Querscrollen, lange Aufgaben).
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
