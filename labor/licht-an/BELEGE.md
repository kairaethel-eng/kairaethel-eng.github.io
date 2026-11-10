# Belege und Messverfahren zu `KONZEPT.md`

Stand 10.11.2026. Alle Messungen im Cloud-Container (Chromium über Playwright, **ohne Grafikchip**: WebGL läuft per SwiftShader). Deshalb gilt überall: Ladewerte, Gewichte, Farben und Vergleiche sind belastbar; absolute Bildraten sind es nicht. Kennzeichnung wie im Konzept ([B] gemessen/gelesen, [A] abgeleitet, [O] offen).

Die Berichte unter `belege/` stammen aus getrennten Recherche-Läufen; Pfade darin, die auf ein „Scratchpad“ zeigen, verweisen auf Rohdaten der Sitzung, die nicht aufbewahrt wurden.

## 1 Die bestehende Seite `labor/hausbesuch-puls.html`

| Messung | Ergebnis | Werkzeug |
|---|---|---|
| Übertragung, Abrufe, fremde Hosts | 320–327 KB (gzip), 1 Abruf, 0 fremde Hosts | `werkzeuge/measure.cjs` gegen die öffentliche Testadresse |
| Erstes Bild / größtes Element / Layout-Sprung | 1,6 s / 1,6 s / 0 (Handy 390×844, 1,6 Mbit/s, 150 ms, CPU 4×) | `werkzeuge/measure.cjs` |
| axe (WCAG 2.0–2.2 A/AA), Ausgangszustand | 0 Verstöße | axe-core über `measure.cjs` |
| Termin-/Telefon-Knopf im ersten Bild | 2 / 1 | `measure.cjs` |
| Lighthouse Handy | Leistung 62–63, Zugänglichkeit 98, gute Praxis 96, SEO 60 (wegen `noindex`); erstes Bild 2,4 s, blockierte Zeit 3,75–3,92 s, Layout-Sprung 0 (drei Läufe; ein früherer Lauf unter Last: Leistung 49) | Lighthouse (headless, SwiftShader) |
| Datei, Skript-Anteile, Zeichenmengen, Altlasten | siehe `belege/technik.md` (Bau bytegleich mit dem veröffentlichten Stand nachvollzogen) | esbuild-Metadaten, Zeichen-Zähler |
| Heutige Wix-Seite hopphysio.de zum Vergleich | 2,5 MB, 203 Abrufe, 9 fremde Hosts, kein Termin-/Telefon-Knopf im ersten Bild | `measure.cjs` |

## 2 Vergleichsfeld (Markt)

Verfahren: jede Seite einmal mit Handy-Bildschirm (390×844) geöffnet, ohne Einwilligungs-Klicks; gezählt über das DevTools-Protokoll: Übertragung, Abrufe, fremde Hosts, bekannte Tracker-Hosts, Canvas/WebGL. 55 Seiten, davon 51 auswertbar (drei sperrten den Abruf, eine lud nicht).

| Gruppe | n | Übertragung Median (min–max) | Abrufe Median | fremde Hosts Median | mit Trackern | mit Einwilligungs-Banner | mit WebGL |
|---|---|---|---|---|---|---|---|
| Physio-Praxen/-Studios international | 20 | 2,4 MB (0,3–16,0) | 78 | 7 | 12 | 8 | 2 (ohne große Bühne) |
| Praxen Raum Schorndorf/Remstal (inkl. heutiger Wix-Seite) | 8 | 1,1 MB (0,4–5,2) | 47 | 3 | 3 | 3 | 0 |
| beide zusammen | 28 | 2,1 MB | – | 5 | 15 | 11 | 2 |
| Gesundheits-Marken | 12 | 5,7 MB (2,8–16,6) | 170 | 16 | 11 | 7 | 5 |
| 3D-Anatomie-Angebote | 7 | 8,9 MB (1,0–35,6) | 119 | 23 | 6 | 2 | 7 |
| HOP Fusion | 1 | 0,4 MB | 1 | 0 | 0 | 0 | ja |

Preisgekrönte 3D-Seiten (14, eigener Lauf, 25 s je Seite): Median 5,66 MB; 8 von 14 ohne JavaScript praktisch ohne Text; 12 von 14 mit Dritt-Abrufen; Awwwards-Jurywert „Accessibility“ 6,0–7,6 bei 19 geöffneten Preisträgern – Einzelheiten und Quellen in `belege/immersiv.md`.

Grenzen [B]: ein Lauf je Seite, keine echten Geräte, Seiten können ohne Grafikchip eine andere Fassung ausliefern. Die Aussage „keine Praxis-Seite mit Echtzeit-3D-Bühne“ gilt für die 28 gemessenen Seiten; eine erschöpfende Suche ist das nicht [A]. Einzelwerte der örtlichen Praxen sind hier bewusst nicht aufgeführt.

Gemessene Adressen (ohne Einzelwerte): physioasten.at, medwest.plus, 101physio.ca, repphysio.ca, marplephysio.com, myodetox.com, ten.co.uk, sixphysio.com, bespoketreatments.com, motivny.com, rheinblick-physio.de, physiothek-basel.ch, movo-physio.at, physiozentrum.ch, medtomove.de, benchmarkphysio.com.au, physiosolutions.co.uk, ibji.com, tenzr (Vorschau), acht Praxen im Raum Schorndorf · nekohealth.com, functionhealth.com, hingehealth.com, swordhealth.com, ouraring.com, eightsleep.com, therabody.com, hyperice.com, kaiahealth.com, whoop.com, superpower.com, prenuvo.com, everlab.com.au, vibrant-wellness.com, brightbiotech.co.uk · human.biodigital.com, zygotebody.com, svitylo.com, z-anatomy.com, voka.io, healthline.com (Body Maps), visiblebody.com, spine3d.33med.com.

## 3 Lichtprobe (`probe/`)

Gleiche Seite, gleicher Rundgang, zusätzlich das Licht-Modul. Bilder ohne Text (Überschriften, Leisten ausgeblendet), PC 1440×900, je Station ein Bild; ausgewertet mit `werkzeuge/warm.cjs`: Anteil der hellen Bildpunkte (Luma > 6 %), die warm (R > 1,15·B) bzw. kühl (B > 1,15·R) sind, und mittlere Helligkeit des ganzen Bildes (linear, 0–1).

| Station | vorher: warm / kühl / Helligkeit / beleuchtete Fläche | Probe Abend | Probe tiefe Sonne |
|---|---|---|---|
| Tür | 39 % / 42 % / 0,054 / 12,5 % | 92 % / 4 % / 0,088 / 23,6 % | 91 % / 3 % / 0,090 / 24,7 % |
| Empfang | 39 % / 25 % / 0,062 / 13,4 % | 89 % / 5 % / 0,064 / 16,8 % | 95 % / 1 % / 0,077 / 18,8 % |
| Training | 41 % / 30 % / 0,038 / 8,1 % | 86 % / 12 % / 0,048 / 14,7 % | 94 % / 2 % / 0,067 / 18,4 % |

Stand: veröffentlichte Probe nach der Nachbesserung. Die erste Fassung der Probe war am Empfang dunkler als die bestehende Seite (Helligkeit 0,042 statt 0,062, Warm-Anteil 82 %) – das hat ein Gutachter zu Recht bemängelt („färbt um, statt zu beleuchten“); danach wurden Lampenstärke, Grundlicht und Pflanzenfarbe angehoben. Mittag (erste Fassung, Tür): 62 % warm, 14 % kühl. Hellste Stellen (95. Perzentil der Helligkeit): Tür 0,39 → 0,60, Empfang 0,41 → 0,44 bzw. 0,51, Training 0,18 → 0,26 bzw. 0,44 (`werkzeuge/hell.cjs`).

Zweite, unabhängige Farbmessung der bestehenden Seite mit strengeren Schwellen und mit Text im Bild (`belege/waerme.md`): 6–16 % warm, 49–62 % kühl an den Rundgang-Stationen (PC). Beide Messungen zeigen dieselbe Richtung; die Zahlen sind wegen der unterschiedlichen Schwellen nicht direkt vergleichbar.

**Kosten** (Handy-Emulation 390×844, CPU 4×, `labor/tools/frames.cjs`, je drei Läufe abwechselnd; gezählt werden gezeichnete Bilder je Sekunde – ohne Grafikchip zählt nur der Vergleich):

| Stand | Bilder/s im Stand | Bilder/s beim Scrollen | gegenüber vorher |
|---|---|---|---|
| bestehende Seite (5 Läufe) | 14,2–14,9 | 12,7–13,4 | – |
| Probe, erste Fassung: Licht je Punkt in jedem Bild, 70 000 Flächen-Punkte, Licht auch am dunklen Kern (5 Läufe) | 4,3–5,1 | 4,4–4,9 | −66 bis −70 % |
| dieselbe mit festem Lichtwert statt Rechnung (`?kosten=1`, entspricht eingebackenem Licht; 2 Läufe) | 11,1 | 9,9–10,1 | −25 % |
| Probe, veröffentlichte Fassung: 55 000 Flächen-Punkte, kein Licht am Kern (2 Läufe) | 8,0–8,4 | 7,1–7,7 | −45 % |
| dieselbe mit festem Lichtwert (2 Läufe) | 10,8–11,5 | 9,1–9,2 | −25 % |

Lesart: Rund zwei Drittel der Mehrkosten stammen aus der Lichtrechnung je Punkt und Bild, ein Drittel aus den zusätzlichen Punkten. Wird das Licht beim Erzeugen eingebacken (festes Lichtdrehbuch) und nur der aktuelle Raum gezeichnet, bleibt der zweite Teil – wie viel, zeigt erst der Bau. Die letzte Nachbesserung (Helligkeit) hat Geometrie und Shader-Aufbau nicht verändert und wurde nicht erneut gemessen.

**Größe:** vorher 931 101 B (gzip 324 783), Probe 958 552 B (gzip 335 225) → +27 KB roh, +10 KB gzip (+3 %).

**Sonnenstand:** `probe/sun.js` (Näherung nach dem Astronomical Almanac). Ein anderer Lauf prüfte die Bibliothek SunCalc für Schorndorf gegen das U.S. Naval Observatory an vier Tagen: Auf- und Untergang ≤ 1 Minute Abweichung (`belege/interaktion.md`). Die eigene Formel der Probe liefert für den 10.11.2026 Aufgang 06:22:44 und Untergang 15:48:17 UTC – auf Sekunden dieselben Werte wie SunCalc (06:22:46 / 15:48:16) und die USNO-Angabe (06:23 / 15:48); die Mittagshöhen an Sonnenwenden und Tagundnachtgleiche (17,8° / 41,0° / 64,6°) stimmen mit 90° − Breite ± 23,44° überein [B].

Handy-Ausschnitt (390×844, ohne Text): Tür 58 % → 90 % warm (Helligkeit 0,067 → 0,070), Empfang 41 % → 75 % warm (0,053 → 0,047); gemessen vor dem Einbau der Hängeleuchte beim Gast.

**Nicht geprüft [O]:** Bildrate und Aussehen auf echtem iPhone und PC; Wirkung auf Menschen.

## 4 Recht (Gesetzestexte, gelesen am 10.11.2026 auf gesetze-im-internet.de)

- Heilmittelwerbegesetz § 3 (irreführende Werbung; Nr. 2 a „Erfolg mit Sicherheit“), § 9 (Fernbehandlung), § 11 Abs. 1 Nr. 2 (Empfehlungen), Nr. 3 (Krankengeschichten, „falsche Selbstdiagnose“), Nr. 5 (bildliche Darstellung), Nr. 11 (Äußerungen Dritter), Satz 3 (Vorher-Nachher nur bei operativen plastisch-chirurgischen Eingriffen ausdrücklich verboten), § 12: https://www.gesetze-im-internet.de/heilmwerbg/
- Barrierefreiheitsstärkungsgesetz § 3 Abs. 3 („gilt nicht für Kleinstunternehmen, die Dienstleistungen anbieten oder erbringen“), § 2 Nr. 17 (weniger als zehn Beschäftigte und höchstens 2 Mio. € Umsatz oder Bilanzsumme): https://www.gesetze-im-internet.de/bfsg/
- TDDDG § 25 Abs. 1 und Abs. 2 Nr. 2 (Speichern im Endgerät; Ausnahme „unbedingt erforderlich“ für einen ausdrücklich gewünschten Dienst): https://www.gesetze-im-internet.de/ttdsg/__25.html
- UWG § 5b Abs. 3 (Bewertungen: ob und wie Echtheit sichergestellt wird): https://www.gesetze-im-internet.de/uwg_2004/__5b.html
- KUG § 22, UrhG §§ 57, 59 (Raumscan): siehe `belege/scan.md`.
- Medizinprodukterecht (MDR Art. 2, Regel 11): Text konnte in der Sitzung nicht geöffnet werden [O]; Indiz: ein Anbieter von Kamera-Übungen führt CE-Kennzeichnung als Medizinprodukt (`belege/interaktion.md`).

Die Ampel im Konzept ist eine Ableitung aus diesen Texten [A], keine Rechtsberatung.

## 5 Web-Plattform (caniuse-Rohdaten, 10.11.2026)

| Technik | Chrome | Safari / iOS | Firefox | Verbreitung |
|---|---|---|---|---|
| OffscreenCanvas (WebGL im Hintergrund-Thread) | 69 | 17.0 (16.2 nur 2D) | 105 | 96,5 % |
| View Transitions, gleiche Seite | 111 | 18.0 | 144 | 93,2 % |
| View Transitions, seitenübergreifend | 126 | 18.2 | noch nicht | 87,7 % |
| WebGPU | 113 | iOS 26.0; macOS erst ab 26 | teilweise ab 141 | 86,8 % |

Weitere Angaben (Scroll-gesteuerte CSS-Animationen ab Safari 26, three.js-Hinweise zu WebGPU, Autoplay-Regeln) mit Quellen in `belege/immersiv.md` und `belege/waerme.md`.

## 6 Berichte in `belege/`

| Datei | Inhalt | Stand |
|---|---|---|
| `raster.md` | Bewertungsraster und Ziele, festgelegt vor dem Konzept | vollständig |
| `geschmack.md` | Kais belegte Vorlieben, Ablehnungen, Regeln aus den Projekt-Protokollen | vollständig |
| `technik.md` | Inventar der Bausteine, Shader, Engpässe, Architektur-Empfehlung | vollständig |
| `waerme.md` | Forschung und Handwerk zur Wärme, eigene Farbmessung, 18 Hebel | vollständig, Gegenprüfung abgebrochen |
| `scan.md` | echte Räume: Gaussian Splatting, Aufnahme, Lizenzen, Ablauf | vollständig, Gegenprüfung abgebrochen |
| `immersiv.md` | preisgekrönte 3D-Seiten, Verfahren, Kritik, eigene Messung | Bericht geschrieben, Lauf vor der Rückmeldung abgebrochen, keine Gegenprüfung |
| `interaktion.md` | Interaktions-Ideen mit Messungen (Sonnenstand, Feiertage, Kamera-Erkennung) | wie oben |

Nicht fertig geworden (Nutzungslimit): eigene Berichte zu Patientenverhalten, Bedienmodellen/Barrierefreiheit, Plattform, Recht (die beiden letzten wurden durch die Abschnitte 4 und 5 ersetzt), Begutachtung der bestehenden Seite durch einen dritten Leser, die Jury aus mehreren Konzeptvarianten.

## 7 Unabhängige Gutachter

Zwei getrennte Gutachter (eigene Sitzungen, nur lesend), Bewertung nach `belege/raster.md` (acht Kriterien, gewichtet, 0–100). Beide kannten das Raster, nicht die Entstehung des Konzepts.

| Kriterium (Gewicht) | Gutachter A: Recht, Machbarkeit, Pflege – Runde 1 → 2 | Gutachter B: Erstbesucherin, Barrierefreiheit, Wärme, Fokus – Runde 1 → 2 |
|---|---|---|
| 1 Wärme und Gastlichkeit (20) | 8 → 8 | 7 → 8 |
| 2 Neu gegenüber dem Markt (15) | 8 → 7 | 8 → 8 |
| 3 Sinnvolle Interaktion (15) | 7 → 7 | 6 → 8 |
| 4 Anziehungskraft (10) | 8 → 8 | 7 → 7 |
| 5 Aufgaben der Besucher (15) | 8 → 9 | 7 → 9 |
| 6 Machbarkeit (10) | 3 → 6 | 5 → 7 |
| 7 Recht, Datenschutz, Barrierefreiheit (10) | 6 → 8 | 6 → 8 |
| 8 Fokus (5) | 5 → 8 | 5 → 9 |
| **Gesamt** | **70 → 76,5** | **66 → 80** |

Mittel 68 → 78; Ziel 85 verfehlt. K.-o.-Treffer: in beiden Runden keiner (Runde 1: zwei Grenzfälle, beide gestrichen).

Kritische Einwände Runde 1 (sechs) und ihr Stand nach Runde 2: Versorgungsgebiet am Gast – gelöst (gestrichen) · „Röntgenblick“ – gelöst (gestrichen) · Router für durchgehende 3D-Fahrt – gelöst (gestrichen) · Kosten des Lichts – teilweise (Einbacken und Gerätetest übernommen; ob aus −25 % ohne Grafikchip ≤ 10 % am Gerät werden, ist offen) · Probe färbt nur um – teilweise (am PC gelöst; am Handy fehlte eine Lichtquelle im Bild, danach nachgezogen, nicht erneut begutachtet) · Text auf Lichtflächen – teilweise (Regel, Lesezone, Zielwert stehen; in der Probe steht die Überschrift im Training noch auf dem Fenster).

Von den Gutachtern korrigierte Tatsachen: § 11 Abs. 1 Nr. 3 HWG betrifft Krankengeschichten und trägt die erste Einstufung der Wirbelsäule nicht (einschlägig § 3 und § 9); die Angabe „3D-Skript ≈ 150 KB“ für eine dünne Schicht war geschönt (Baustein gestrichen). Bestätigt: Ausnahme für Kleinstunternehmen im BFSG; OffscreenCanvas mit WebGL ab Safari 17.0. Zusätzlich von Gutachter A geöffnet: Cochrane-Übersicht zur Traktion bei Kreuzschmerz (https://pubmed.ncbi.nlm.nih.gov/23959683/), GitHub-Pages-Bedingungen (https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits).

Grenze dieser Prüfung: zwei Gutachter statt der geplanten Jury mit mehreren Konzeptvarianten; beide sind KI-Läufe – ein Indiz, kein Ersatz für echte Nutzer, echte Geräte und eine Fachprüfung.
