# „Licht an“ – Stand und Einstieg für eine neue Session (10.11.2026)

Eigenes Projekt auf Basis von `labor/hausbesuch-puls.html`. **Nichts Bestehendes wurde geändert**; `labor/UEBERGABE.md`, `labor/ENTSCHEIDUNGEN.md` und `labor/CLAUDE.md` wissen von diesem Ordner nichts (Kais Vorgabe „alles Bestehende nicht verändern“).
**Der Ordner liegt nur auf dem Zweig `claude/festive-clarke-8ms9z7`, nicht auf `main`.** Eine neue Session muss diesen Zweig holen (`git fetch origin claude/festive-clarke-8ms9z7`); auf `main` kommt er nur mit Kais ausdrücklichem Go (dann wäre er öffentlich).

## Was es gibt
- `KONZEPT.md` – Konzept Fassung 2 (Befund, Leitidee, Drehbuch, drei Kernbausteine, Zielwerte, Rechts-Ampel, Stufenplan, Prüfbericht, sieben Entscheidungen, Kosten 0 €).
- `IDEEN.md` – alle Ideen aus der Recherche, die über das Konzept hinausgehen (Kai fragte am 10.11. ausdrücklich danach).
- `BELEGE.md`, `belege/` – Messwerte, Quellen, Gutachten, Recherche-Berichte.
- `probe/` – Quellen der Wegwerf-Lichtprobe (Nachbau-Anleitung in `probe/README.md`, geprüft: bytegleich mit der Vorschau).
- `seite/` – Quellen der Konzept-Seite (`python3 assemble.py` erzeugt `hop-licht-an.html` als Artifact-Fragment).
- `werkzeuge/` – Messskripte.
- Private Vorschauen: Konzept https://claude.ai/artifact/KxDDXer8DArAc1qZMD2xJ2 · Lichtprobe https://claude.ai/artifact/XsMLHYfwsSfixGGoPtFu47

## Stand
- Konzept und Lichtprobe sind geliefert. **Kai hat noch nichts entschieden und kein Go gegeben.**
- Kais Rückmeldung (10.11.): Das Konzept wirkt wie eine Verbesserung der bestehenden Seite; er hatte auf mehr neue Konzepte und Ideen gehofft. Darauf entstand `IDEEN.md`. Eine Antwort von Kai dazu steht aus.
- Kais Regel (10.11.): **Kein Geld ausgeben, alles nur kostenlos nutzen.** Keine großen Agenten-Läufe ohne sein Wort (sie verbrauchen sein Nutzungslimit).
- Prüfbericht ehrlich: Gutachter-Mittel 78 statt Ziel 85 (verfehlt); Licht kostet ohne Grafikchip 45 % Bildrate, eingebacken 25 %; am iPhone nichts gemessen.

## Nächste Schritte (alle warten auf Kai)
1. Kai sieht die Lichtprobe am iPhone und PC an (auch Abend und Nacht) und meldet Aussehen und Ruckeln.
2. Kai wählt die sieben Punkte auf der Konzept-Seite („Go: …“). Empfehlung Claude: `1A 3B 4A 5A 6a 7A`, Punkt 2 nach Kais Blick.
3. Kai sagt, welche Ideen aus `IDEEN.md` ihn reizen; dazu je eine Probe zum Ansehen bauen (wie beim Licht), nicht nur beschreiben.
4. Erst nach Go: Stufe 0 (eigene Quelle als Kopie der Fusion), dann Stufe 1.

## Offen außerhalb des Projekts
- Fehler in der bestehenden Fusion-Seite: Die Wirbelsäule wird nach Behandlung 1 unsichtbar weitergezeichnet (`labor/src/fusion/main.js`, `spineSolid` klingt nur ab; `spine.js` `setSolid` prüft `solid > 0`). Nicht behoben.
- Hosting: GitHub Pages schließt laut Bedingungen Seiten für „online business“ aus und speichert Besucher-IPs; vor dem Livegang auf hopphysio.de klären.
- UXKIN- und Wix-Connector waren nicht angemeldet und wurden nicht gebraucht.
