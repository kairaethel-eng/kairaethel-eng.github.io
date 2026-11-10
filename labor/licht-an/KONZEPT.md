# HOP „Licht an“ – Konzept für die nächste Website

Stand 10.11.2026 · Entwurf zur Entscheidung · eigenes Projekt auf Basis von `labor/hausbesuch-puls.html` · Fassung 2 (nach zwei unabhängigen Gutachten gestrafft)
**Nichts Bestehendes wurde geändert.** Gebaut wurde nur eine Wegwerf-Lichtprobe (private Vorschau https://claude.ai/artifact/XsMLHYfwsSfixGGoPtFu47, Quellen unter `probe/`). Umsetzung erst nach Kais Go je Punkt (Abschnitt 11).
Lesefassung dieses Konzepts mit Entscheidungshilfe (privat): https://claude.ai/artifact/KxDDXer8DArAc1qZMD2xJ2 · Ordner: `KONZEPT.md` (dies) · `BELEGE.md` · `belege/` (Berichte) · `probe/` (Lichtprobe) · `werkzeuge/` (Messskripte).
Kennzeichnung: **[B]** selbst gemessen bzw. von einer geöffneten Quelle so gestützt · **[A]** abgeleitet/plausibel · **[O]** offen. Belege und Messverfahren: `BELEGE.md`.

---

## 1 In einer Minute

1. **Befund:** Die Seite ist sprachlich warm, aber bildlich kühl: Lampen leuchten nichts an, Wände sind Raster, nur rund 40 % der Lichtpunkte sind warm (strenger gemessen 6–16 %) [B]. Technisch liegt sie schon vor dem Markt: 0,4 MB und 0 fremde Dienste gegenüber 2,1 MB und 5 fremden Diensten im Mittel von 28 gemessenen Praxis-Seiten; keine davon hat eine Echtzeit-3D-Bühne [B].
2. **Leitidee „Licht an“:** Wer eintritt, dem geht das Licht an. Warm im Raum, klar am Objekt – so wird „Kompetenz und Herz“ sichtbar. Dunkel bleibt; Wärme entsteht in der Szene.
3. **Drei Bausteine, mehr nicht:** *Licht* (festes Lichtdrehbuch innen, außen die echte Stunde) · *Gastgeber & Besuch* (Kais Foto am Empfang; der bestehende Weg wird als „Ihr erster Besuch“ in fünf Schritten erzählt, ohne neue Gesten) · *Schnellweg & Text zuerst* (Leiste Termin · Anrufen · Anfahrt · Fragen; alles lesbar ohne 3D).
4. **Beleg:** Die Lichtprobe zeigt die bestehende Partikel-Praxis mit Lampenlicht. Gemessen: warme Lichtpunkte 86–95 % statt 39–41 %, das Bild bleibt dunkel (mittlere Helligkeit 5–9 % von Weiß), Datei +3 % [B].
5. **Ehrlich:** Die Probe kostet ohne Grafikchip 45 % der Bildrate; mit eingebackenem Licht wären es 25 % [B]. Am iPhone ist nichts gemessen [O]. Zwei unabhängige Gutachter gaben dem ersten Entwurf 66 und 70 von 100 Punkten, dieser Fassung 80 und 76,5 – das selbst gesetzte Ziel von 85 ist verfehlt, ein kritischer Einwand ist nicht mehr offen (Abschnitt 10).
6. **Weg:** Sicherung → Licht, Leiste, Text zuerst als Kopie der Fusion → Kais Gerätetest → Gastgeber → Zugaben einzeln. Der Livegang von Puls · Scan wird dadurch nicht aufgehalten.

---

## 2 Befund

### 2.1 Die Seite heute (`hausbesuch-puls.html`)

| Messgröße | Wert | Beleg |
|---|---|---|
| Übertragung / Abrufe / fremde Dienste | 327 KB (gzip) · 1 · 0 | [B] eigene Messung, öffentliche Testadresse |
| Erstes Bild (Handy-Emulation, langsames Netz, CPU 4×) | 1,6 s, kein Layout-Sprung | [B] |
| axe (WCAG 2.2 AA, Ausgangszustand) | 0 Verstöße | [B] |
| Lighthouse Handy (Container ohne Grafikchip) | Leistung 62–63, Zugänglichkeit 98, gute Praxis 96; blockierte Zeit 3,8 s (drei Läufe) | [B], nur als Vergleichswert |
| Skript | 743 KB, davon three.js 74 %, eigener Code 12,5 % | [B] Technik-Inventar |
| 3D | 3 WebGL-Flächen, an der Wirbelsäule 428 000 Punkte je Bild (Handy 157 000) | [B] |
| Ohne JavaScript | nur das erste Kapitel sichtbar | [B] |
| Wärme im Bild (ohne Text, PC) | 39–41 % warme, 25–42 % kühle Lichtpunkte; zweite, strengere Messung: 6–16 % warm, 49–62 % kühl | [B] zwei Verfahren, gleiche Richtung |

**Stark (bleibt):** das Betreten des Hauses aus Augenhöhe, die Wirbelsäule mit Schichten und Nerven, die Figur „Spannung lösen“, die Manuthera-Bühne, die gastlichen Texte, das Termin-Blatt, „Bewegung anhalten“, keine fremden Abrufe. Kais Urteile dazu: „super geil“, „begeistert“, „so soll es bleiben“ [B, Protokolle].

**Schwach:**
- Die Lampen leuchten nichts an, Wände sind Raster, es gibt kein Haus von außen, keinen Menschen mit Gesicht [B].
- Der Weg zeigt Räume, sagt aber nicht, was beim ersten Termin geschieht [B].
- Antworten auf Rezept, Kosten, Mitbringen stehen erst ganz am Ende des Scrollwegs; ohne JavaScript ist nur Kapitel 0 sichtbar [B].
- Altlasten: Die Wirbelsäule wird nach Behandlung 1 unsichtbar weitergezeichnet; Punktwolken rechnen 3–4,5 s im Hauptthread [B] (als eigener Aufgaben-Vorschlag gemeldet).

### 2.2 Der Markt (gleiches Messverfahren, Handy-Bildschirm, je ein Lauf)

| Gruppe | Seiten | Übertragung¹ | fremde Dienste¹ | mit Trackern | Echtzeit-3D |
|---|---|---|---|---|---|
| Praxis-Seiten (20 international, 8 Raum Schorndorf) | 28 | 2,1 MB | 5; nur 2 Seiten ganz ohne | 15 | keine mit 3D-Bühne |
| Gesundheits-Marken (Hinge, Oura, Function …) | 12 | 5,7 MB | 16 | 11 | 5 mit WebGL-Effekten |
| 3D-Anatomie-Angebote | 7 | 8,9 MB | 23 | 6 | alle |
| Preisgekrönte 3D-Seiten 2025/26 | 14 | 5,7 MB | 12 von 14 mit Dritt-Abrufen | – | alle; 8 von 14 ohne JavaScript praktisch leer |
| **HOP Fusion heute** | 1 | **0,4 MB** | **0** | **0** | ja |

¹ Median. [B] gemessen am 10.11.2026; Grenzen: ein Lauf je Seite, Container ohne Grafikchip, drei Seiten sperrten den Abruf. In der Awwwards-Jury ist „Accessibility“ bei allen 19 geöffneten Preisträgern der schwächste Wert (6,0–7,6 von 10) [B].

**Folgerung:** Der Abstand zur Spitze liegt nicht in mehr Technik, sondern in der Regie – Licht, Kontinuität, Verzicht, ein Mensch – und im sofortigen Weg zum Termin [A, gestützt auf Fallstudien der Preisträger]. Eine Seite, die filmisch ist **und** leicht, zugänglich und ohne Dritt-Abrufe, gibt es im gemessenen Feld nicht [B für das Feld, A für „den Markt“].

### 2.3 Was die Forschung zur Wärme sagt
- Warm wirkende, gut beleuchtete, wohnliche Warteräume lassen höhere Behandlungsqualität erwarten; dunkle, kalt wirkende niedrigere (Arneill & Devlin 2002) [B]. Die Studien betreffen echte Räume; die Übertragung auf eine Punkt-Welt ist [A].
- „Warme Farbe = angenehm“ ist nicht belegt; Helligkeit zählt mehr als der Farbton (Fotios 2016; Valdez & Mehrabian 1994) [B]. Darum **helle warme Inseln im Dunkel**, nicht umfärben.
- Gemütliches Licht (2700 K, orange Akzente) beruhigt ängstlich gestimmte Ältere (Kuijsters 2015) [B]. Gesichter erzeugen Nähe und darüber Vertrauen (Cyr 2009) [B]. Wärme wirkt nur zusammen mit Kompetenz (Fiske 2007) [B].
- Erinnert wird das Ende (Redelmeier & Kahneman 1996) [B]: Der Abschied zählt überproportional.

---

## 3 Leitidee: Licht an

> Wer eintritt, dem geht das Licht an. Das Haus empfängt, der Gastgeber zeigt sich, und wer es eilig hat, ist in einem Tipp am Ziel.

**Warm im Raum, klar am Objekt.** Jeder Raum hat warmes Lampenlicht – auch der Behandlungsraum, denn die Untersuchung ist der Moment mit der größten Unsicherheit. Die Kompetenz zeigt sich nicht durch Kälte, sondern durch ein klares, helles Arbeitslicht auf dem Gegenstand (Wirbelsäule, Liege) und durch Schärfe im Detail.

Drei Festlegungen, die aus der Gegenprüfung stammen:
1. **Innen nie dunkel, innen kein Uhrwerk.** Die Räume haben ein festes, geprüftes Lichtdrehbuch. Die echte Stunde in Schorndorf steuert nur Himmel und Umgebung des Ankunftsbilds (Tag, Abend, Nacht), den Gruß und den Öffnungsstatus; die Fenster leuchten zu jeder Stunde warm. Ist die Praxis geschlossen, sagt die Seite das ehrlich.
2. **Text steht nie auf Licht.** Hinter Text liegt eine dunkle Lesezone; Lichtinseln liegen daneben.
3. **Keine neuen Gesten.** Es bleibt bei zwei Bedienmustern, die es schon gibt: Antippen und der Griff mit Haltestellen. Das Licht geht beim Eintreten von selbst an.

Dazu gelten Kais bisherige Regeln [B]: dunkel bleibt · ein Hauptmotiv je Moment · keine Schnitte · senkrecht wischen scrollt immer · Text erst, wenn die Kamera steht · das Objekt bleibt frei · fachlich genau · flüssig am iPhone ist Abnahmekriterium · gebaut für ältere Besucher · ehrlich, datensparsam, kostenlos.

---

## 4 Drehbuch: „Ihr erster Besuch“

Der Weg bleibt der heutige (Tür → Empfang → Behandlung 1 → Behandlung 2 → Training → Tür). Neu ist, dass er als das erzählt wird, was Erstbesucher wissen wollen: *Was passiert bei meinem ersten Termin?* Fünf Schritte, gerahmt von der Tür.

| Station | Schritt | Licht | Was sich gegenüber heute ändert |
|---|---|---|---|
| **Vor der Tür** | – | außen die echte Stunde; abends leuchten die Fenster | ein Haus von außen statt Scan-Linien; Tür geht auf, innen geht das Licht an |
| **Empfang** | 1 Ankommen | Pendelleuchte auf Tresen und Dielen | Kais Foto und Name am Empfang, ohne Antippen sichtbar: „Ihr Gastgeber“ |
| **Empfang** | 2 Zuhören | der Gast steht im Licht | nichts – „Spannung lösen“ bleibt, wie es ist |
| **Behandlung 1** | 3 Hinschauen | warm gedimmt, klares Arbeitslicht auf der Wirbelsäule | Wirbelsäule ausdrücklich als Anschauungsmodell; Bedienung wie heute |
| **Behandlung 2** | 4 Lösen | Leuchte über der Liege | nichts – die Manuthera-Bühne zeigt weiter die Bewegungen der Liege |
| **Training** | 5 Stärken | helles Fensterlicht | Text: wenige Übungen für zuhause |
| **Bis bald** | – | Abendgold an der Tür | „Ihr erster Termin in Kürze“ direkt beim Abschied |

Ankommen und Zuhören sind zwei Bildausschnitte nacheinander (erst Tresen mit Lichtinsel und Foto, dann der Gast), damit sich nichts verdeckt. Am Handy wird die Kamera so eingerichtet, dass in jeder Station eine Lichtquelle im Bild ist.

**Filmische Mittel** (alle im vorhandenen Punkte-Stil): eine durchgehende Einstellung ohne Schnitt · motiviertes Licht (jede Helligkeit hat eine sichtbare Quelle) · ein Farbdrehbuch je Station · Staub im Licht · am Ende der Blick zurück auf das erleuchtete Haus.

Beispielsätze (Sie-Form, Kai in Ich-Form): „Guten Abend. Kommen Sie rein.“ · „Schön, dass Sie da sind. Ich bin Kai Raethel.“ · „Erst höre ich zu.“ · „Dann schaue ich hin.“ · „Sie liegen. Die Liege bewegt.“ · „Jetzt Sie.“ · „Bis bald.“

---

## 5 Bausteine

### Kern

**K1 · Licht.** Lampen als Lichtquellen, helle Inseln auf Tresen, Dielen, Liege; Flächen-Punkte, die nur im Licht erscheinen; Raster tritt zurück; Pflanzen bleiben grün; ein Haus von außen mit leuchtenden Fenstern. Innen ein festes Lichtdrehbuch, **beim Erzeugen der Punkte eingebacken** (kein Rechnen je Bild), gezeichnet wird nur der Raum, in dem man steht, und seine Nachbarn. *Beleg:* Lichtprobe und Messwerte (Abschnitt 10). *Risiko:* Kosten am Handy – darum ein Gerätetest mit Abbruchwert vor dem Go (iPhone 12 oder neuer ≥ 50 Bilder/s, Mittelklasse-Android ≥ 30, sonst weniger Punkte); „erschlägt“ – Kais iPhone entscheidet über die Helligkeit. *Aufwand:* mittel; das Lichtmodell steht als Probe, das Einbacken ist neu.

**K2 · Gastgeber & Besuch.** Ein echtes, warm belichtetes Foto von Kai am Empfang mit Namen; der Weg als fünf Schritte erzählt; in der Leiste unter „Fragen“ die Antwort auf „Wer behandelt mich?“. Später fünf echte Fotos der Räume („Einblicke“). *Beleg:* Gesichter schaffen Nähe [B]; die Preisträger setzen bewusst eine menschliche, handgemachte Schicht über die Technik [B]. *Risiko:* hängt an Kais Foto. *Aufwand:* klein.

**K3 · Schnellweg & Text zuerst.** Feste Leiste (am Handy unten): **Termin · Anrufen · Anfahrt · Fragen**. „Fragen“ beantwortet ohne Scrollen: Rezept? Kosten? Mitbringen? Parken? Zeiten? Wer behandelt mich? Was wird behandelt? Sie ersetzt am Handy den Termin-Knopf der Kopfzeile und die Fortschritts-Striche. „Anrufen“ sagt ehrlich, dass der Anrufbeantworter abnimmt. Alle Inhalte stehen im HTML und sind ohne JavaScript lesbar (Grundzustand, nicht Ausnahme), mit Standbildern der Räume; die 3D-Welt wird nach dem ersten Bild nachgeladen. *Beleg:* eilige Nutzer sind von Scroll-Strecken „highly annoyed“, wichtige Inhalte gehören nicht hinein (NN/g 2023) [B]. *Aufwand:* mittel.

### Zugaben (später, einzeln entscheidbar)
- **Z1 · Leistungs-Seiten.** Je Leistung eine schlichte, schnelle Textseite mit Standbild für die Suche („CMD Schorndorf“); von dort ein Link „im Haus ansehen“ zur passenden Station. Keine durchgehende 3D-Fahrt zwischen Seiten – jeder Seitenwechsel würde die 3D-Welt neu starten [B, Gutachten].
- **Z2 · Echte Räume.** Die echte Praxis als Echtfarben-Punktwolke im eigenen Stil, aus einem Handy-Video am eigenen PC gerechnet (≈ 1–1,5 MB je Raum) [B für das Verfahren, O für das Aussehen]. Scaniverse scheidet für die Veröffentlichung aus (nur nicht-kommerziell lizenziert) [B].
- **Z3 · Stimme.** Vier kurze Sätze von Kai, nur auf Tipp.
- **Z4 · Hausplan.** Räume direkt antippen, wie in Puls · Scan (Kai wollte dort beides).
- **Z5 · Schärfe am PC.** Unscharfe Ferne als filmisches Mittel, nur auf starken Geräten.
- **Z6 · Eine Übung im Training.** Vorgeführt, ohne Auswertung.

---

## 6 Schnellweg und Betrieb ohne 3D

- **Leiste:** Termin (Blatt wie heute) · Anrufen (mit Hinweis Anrufbeantworter) · Anfahrt (Karten-Link, Parken, Bus) · Fragen.
- **Ohne WebGL, ohne JavaScript, mit „Bewegung reduzieren“:** vollständige Seite mit Standbildern im Abendlicht; Kamera blendet über statt zu fahren; Text spätestens nach einer Sekunde.
- **Gefunden werden:** schema.org (Praxis, Person, Leistungen), gepflegtes Google-Unternehmensprofil; Erfolg messen über Search Console und gebuchte Termine – ohne Skript auf der Seite [A].
- **Pflege:** nichts, was veraltet, ohne Ablaufdatum; eine automatische Monatsprüfung (axe, Lighthouse, Bildvergleich) meldet Brüche am PC-Browser; iPhone-Brüche sieht sie nicht – darum nach iOS-Updates eine kurze Sichtprüfung am iPhone [A].

---

## 7 Technik und Zielwerte

| Messgröße | heute | Ziel | geprüft mit |
|---|---|---|---|
| Inhalte ohne JavaScript | nur Kapitel 0 | 100 % | Durchlauf ohne Skript |
| Lighthouse Leistung, Textzustand (3D noch nicht gestartet) | 62–63 mit 3D | ≥ 90 | Lighthouse |
| Größtes Element (Labor) | 1,6 s | ≤ 1,8 s | Lighthouse / Messskript |
| axe-Verstöße in allen Zuständen | 0 im Start | 0 überall | axe |
| Kontrast von Text über der Szene | nicht gemessen | Überschriften ≥ 3 : 1, Fließ- und Kleintext ≥ 4,5 : 1, gemessen an den hellsten Stellen jeder Stimmung | Auswertung von Bildschirmfotos |
| Start der 3D-Welt | längste Aufgabe 0,8 s, blockierte Zeit 3,8 s (Labor, CPU 4×) | keine Aufgabe über 100 ms; die Leiste bleibt antippbar | Messskript, Lighthouse |
| Fremde Abrufe beim Laden | 0 | 0 | Netzprotokoll |
| Punkte je Bild am Handy | 157 000 an der Wirbelsäule | ≤ 150 000 einschließlich Lichtflächen (nur erreichbar, wenn Räume einzeln gezeichnet werden [A]); 0 für unsichtbare Bühnen | Zeichen-Zähler |
| Mehrkosten des Lichts | Probe: −45 % Bilder/s ohne Grafikchip; eingebacken −25 % | am Gerät ≤ 10 % | Vergleich zweier Stände am Gerät |
| Termin, Telefon, Anfahrt, Fragen | 1 Tipp (Kopfzeile) | 1 Tipp von überall, im ersten Bild | Durchlauf |
| Bildrate iPhone / Android | ungemessen | ≥ 50 / ≥ 30 Bilder/s | **nur am echten Gerät** |

Bauweise: three.js bleibt, wird aber erst nach dem ersten Bild geladen; Punktwolken werden im Hintergrund oder vorab gerechnet (Praxis und Wirbelsäule laufen nachweislich ohne Seite [B]); die drei Bühnen bleiben zunächst getrennt, damit die Glanzstücke unverändert bleiben. Kein WebGPU-Umbau: alle 46 Shader müssten neu geschrieben werden, das Skript würde 286 KB größer, für stehende Punktwolken gibt es keinen Gewinn [B].

---

## 8 Recht, Datenschutz, Barrierefreiheit (kein Rechtsrat)

| Baustein | Ampel | Grund / Bedingung |
|---|---|---|
| Licht, Tageszeit außen, Gruß, Öffnungsstatus | grün | reine Rechnung im Gerät, kein Abruf |
| Foto und Name des Inhabers, Stimme | grün | eigene Person; keine Empfehlungen Dritter (§ 11 Abs. 1 Nr. 2 HWG) |
| Wirbelsäule mit „Typisch“ (Bestand) | gelb | erklärend am Modell, keine Erkennung am Besucher (§ 9 HWG), keine irreführenden Wirkaussagen (§ 3 HWG); ärztlicher Hinweis bleibt; Warnzeichen-Formulierungen von einer Fachperson prüfen lassen |
| Manuthera-Bühne (Bestand) | gelb | nur die Bewegungen der Liege zeigen; keine dargestellte Wirkung im Gewebe (§ 3 Nr. 1 HWG) |
| „Spannung lösen“ und die Erzählung des Besuchs | gelb | als Geste, nicht als Ergebnis – kein Erfolg „mit Sicherheit“ (§ 3 Nr. 2 a HWG) |
| Leistungs-Seiten, Preise | gelb | Texte ohne Wirkversprechen (§ 3 Nr. 1 HWG); Preisangaben vollständig |
| Patientenstimmen, Sterne | gelb | nur als Link zum Google-Profil; Hinweis zur Echtheit (§ 5b Abs. 3 UWG) |
| Echte Räume | gelb | keine Personen, Namen, fremde Kunst im Bild (§ 22 KUG, § 57 UrhG) |
| Lokaler Speicher | grün nur für „Bewegung anhalten“ | nach Klick, ausdrücklich gewünscht (§ 25 Abs. 2 Nr. 2 TDDDG); Qualitätsstufe wird nicht gespeichert |
| Online-Kalender | grün wie heute | erst nach Klick, im Datenschutz erklärt |
| Hosting auf GitHub Pages | gelb / offen | Bedingungen schließen „online business“ aus; Besucher-IP wird gespeichert [B]; Auftragsverarbeitung [O] – vor dem Livegang klären |
| Versorgungsgebiet am Körper des Gastes, „Röntgenblick“ in den Körper, Selbsttest, Kamera, KI-Chat | rot | simulierte Untersuchung bzw. bildliche Wirkaussage; Nähe zum Medizinprodukt |
| Wetter-Abruf, Bewertungs-Widgets | rot | Abruf bei Dritten |

Barrierefreiheit: Als Kleinstunternehmen fällt die Praxis nicht unter die Pflichten des Barrierefreiheitsstärkungsgesetzes (§ 3 Abs. 3, § 2 Nr. 17 BFSG) [B für den Text, A für die Einordnung]. Ziel bleibt WCAG 2.2 AA: Pause für alles Bewegte (2.2.2), keine Ziehgeste ohne Alternative (2.5.7), Tastatur, Ziele ≥ 44 px, Leisten verdecken den Fokus nicht (2.4.11).

---

## 9 Stufenplan

| Stufe | Inhalt | Ergebnis | Aufwand | braucht von Kai |
|---|---|---|---|---|
| **0 Sicherung** | eigene Quelle als Kopie der Fusion; fester Zufall statt wechselndem Punktmuster; Referenzbilder je Station für den Bildvergleich; Wirbelsäulen-Fehler in der Kopie beheben | jede spätere Änderung ist prüfbar | klein | – |
| **1 Licht, Leiste, Text zuerst** | Lichtdrehbuch eingebacken, Haus von außen, Lesezone, Leiste, Inhalte ohne JavaScript, 3D nachgeladen | sichtbar wärmer, schneller, überall lesbar | mittel | Urteil zur Lichtprobe; Gerätetest mit eingeblendetem Bildzähler am iPhone und an einem Mittelklasse-Android |
| **2 Gastgeber & Besuch** | Foto am Empfang, fünf Schritte in den Texten, „Fragen“, fünf echte Raumfotos | der Mensch ist da, der Ablauf ist klar | klein–mittel | Porträtfoto, Texte „erster Termin“, Raumfotos |
| **3 Zugaben** | Z1–Z6 einzeln | Ausbau nach Wunsch | je klein–mittel | je nach Zugabe |

Jede Stufe endet mit den Prüfungen aus Abschnitt 7 und Kais Gerätetest. Stufe 1 ist bewusst ein Aufsatz auf die bestehende Seite und kein Neubau: So lässt sich das Licht am iPhone beurteilen, bevor mehr daran hängt.

---

## 10 Prüfbericht (gegen die vorab festgelegten Ziele)

Raster und vier Ziele wurden festgelegt, bevor ein Konzept existierte (`belege/raster.md`).

| Ziel (vorab festgelegt) | Ergebnis |
|---|---|
| **Z1** Gutachter im Mittel ≥ 85/100, vor allen Alternativen, kein K.-o. | **Im ersten Entwurf verfehlt.** Der Variantenvergleich entfiel (Nutzungslimit). Zwei unabhängige Gutachter gaben dem ersten Entwurf **66** (Patientensicht, Wärme, Fokus) und **70** (Recht, Machbarkeit) – Mittel 68. Kein sicherer K.-o.-Treffer, zwei Grenzfälle. **Nach der Überarbeitung: 80 und 76,5 – Mittel 78. Weiter verfehlt.** Abzüge laut Gutachtern: iPhone ungemessen, Wärme am Handy erst schwach gezeigt, Tagesbild der Ankunft nicht gezeigt, weniger Neues als im ersten Entwurf. |
| **Z2** tragende Aussagen belegt und unabhängig gegengeprüft | **Teilweise.** Die geplante Gegenprüfung der Recherche-Stränge lief nicht mehr. Selbst an Primärquellen geprüft: Gesetzestexte, Browser-Daten, Sonnenstand, alle Messungen der Seite und der Probe. Die Gutachter fanden zwei falsche bzw. geschönte Aussagen (falsch zitierter HWG-Paragraf zur Wirbelsäule; „150 KB“ für eine dünne Schicht) – korrigiert bzw. gestrichen – und bestätigten zwei (BFSG-Ausnahme, OffscreenCanvas ab Safari 17). Die Marktzahlen stammen aus einem einzelnen Messlauf. |
| **Z3** die riskanteste Behauptung („die Partikel-Welt kann warm werden“) läuft und ist gemessen | **Erreicht – mit einem negativen Befund.** Warm-Anteil der Lichtpunkte 39–41 % → 86–95 %; mittlere Bildhelligkeit 0,038–0,062 → 0,048–0,090 (bleibt dunkel); Datei +3 %. Kosten ohne Grafikchip: 14,8 → 8,2 Bilder/s im Stand (−45 %); mit eingebackenem Licht 11,1 (−25 %). Handy-Ausschnitt (Empfang): 41 % → 75 % warm bei etwa gleicher Helligkeit (0,053 → 0,047). Am iPhone ungemessen. |
| **Z4** am Ende 0 ungelöste „kritisch“-Einwände | Erste Runde: **6 kritische** und 12 wichtige Einwände. Alle sechs kritischen sind durch Streichen oder Ändern beantwortet (unten). **Zweite Runde: 0 offene kritische Einwände.** Vier gelten als gelöst, zwei als teilweise gelöst und nicht mehr kritisch (Kosten des Lichts – durch den Gerätetest vor dem Go abgesichert; Text auf Licht – die Überschrift im Training steht in der Probe noch auf dem Fenster). Die Bedingung eines Gutachters, am Handy eine Lichtquelle ins Bild zu holen, wurde danach in der Probe umgesetzt (Hängeleuchte beim Gast) – nicht erneut begutachtet. |

**Die sechs kritischen Einwände und was daraus wurde**
1. *Die Probe färbt um und dunkelt ab, statt zu beleuchten* → Probe nachgestellt: Lichtinseln heller, Pflanzen bleiben grün, Deckenstrahler über dem Gast; neu gemessen (oben). Am Handy liegt die Pendelleuchte weiter außerhalb des Bildes – die Kamera wird in Stufe 1 neu eingerichtet.
2. *Text steht auf Lichtflächen* → Regel „Text steht nie auf Licht“, dunkle Lesezone in der Probe, Kontrast als eigener Zielwert.
3. *Versorgungsgebiet am Gast = simulierte Untersuchung; falscher Paragraf* → gestrichen; Ampel auf § 3 und § 9 HWG umgestellt.
4. *„Röntgenblick“ an der Liege = bildliche Wirkaussage* → gestrichen; die Bühne zeigt weiter nur die Bewegungen der Liege.
5. *Licht kostet zwei Drittel der Bildrate, Punktbudget überschritten* → Licht wird eingebacken, Räume einzeln gezeichnet, Gerätetest mit Abbruchwert vor dem Go; Kosten stehen im Konzept.
6. *Durchgehende 3D-Fahrt über viele Seiten ist ein eigener Router, Aufwand unterschätzt* → gestrichen; 3D bleibt auf einer Seite, Leistungs-Seiten sind schlichte Textseiten.

**Wichtige Restpunkte der Gutachter (offen für den Bau):** der Empfang trägt viel (Lichtinsel, Gast, Foto) – vor dem Go ein Handy-Bild mit Foto, Leiste und freier Figur · das Ankunftsbild bei Tag ist noch nicht gezeigt; ein Gutachter empfiehlt deshalb festes Abendlicht überall (Entscheidung 3) · der Schrittname „Lösen“ ist ein Ergebniswort – mit der Fachprüfung klären.

**Was hier nicht prüfbar war und fehlt:**
- Echte Geräte mit Grafikchip (iPhone, Android, PC): Bildrate, Wärmeentwicklung, wie das Licht dort aussieht. → Kai prüft die Lichtprobe.
- Echte Menschen: fünf Patientinnen oder Patienten, je zehn Minuten (Termin finden, „Was erwartet mich?“ beantworten, drei Worte zur Wirkung).
- Fachprüfung der Rechts-Ampel.
- Die geplante Jury aus sechs unabhängig erarbeiteten Konzeptvarianten: am Nutzungslimit abgebrochen, bevor Varianten entstanden.

---

## 11 Entscheidungen für Kai

1. **Richtung:** A „Licht an“ mit den drei Kernbausteinen · B nur das Licht als Aufsatz auf die Fusion · C nichts davon.
2. **Lichtprobe (am iPhone und PC ansehen, auch Abend und Nacht):** A so weiter · B dunkler und sparsamer · C heller · D verwerfen.
3. **Tageszeit:** A innen festes Licht, außen die echte Stunde (Fenster immer warm) · B überall festes Abendlicht (einfacher, immer das stärkste Bild; empfiehlt ein Gutachter).
4. **Gastgeber mit Foto am Empfang:** A ja · B später · C nein.
5. **Leiste:** A Termin · Anrufen · Anfahrt · Fragen · B andere Beschriftung · C keine Leiste.
6. **Zugaben (mehrere möglich):** a Leistungs-Seiten · b echte Räume · c Stimme · d Hausplan · e Schärfe am PC · f Übung.
7. **Name:** A „Licht an“ · B anderer Name.

---

## 12 Bewusst nicht

Aus Kais Entscheidungen: heller Seitengrund („erschlägt“) · Körperkarte und Beschwerde-Chips.
Aus der Gegenprüfung gestrichen: Lichtschalter und Bilderrahmen als Gesten · Körper-Umriss mit Versorgungsgebiet am Gast · „Röntgenblick“ an der Liege · gelenkige 3D-Figur · durchgehende 3D-Fahrt über mehrere Seiten · Ersatz von three.js durch eine dünne Schicht · Zeichnen im Hintergrund-Thread · minutengenaue Sonne in erfundenen Fenstern · „Haus schläft“ als dunkles Ankunftsbild · Unterschrift · Spielzeug, QR-Karte, Jahreszeiten.
Aus der Recherche: KI-Chat, Kamera-Spiegel, Selbsttests · WebGPU-Umbau · Oberfläche im Canvas · umgebogenes Scrollen · Geräte aussperren · Vibration (das iPhone kann es nicht) · Wetter-Abruf · Bewertungs-Widgets · AR · Wallet-Pass.

---

## Nebenbefunde (nicht Teil dieses Projekts)
- **Hosting:** GitHub Pages ist laut eigenen Bedingungen nicht für Seiten gedacht, die vor allem geschäftlichen Abschlüssen dienen, und speichert Besucher-IP-Adressen [B]; ob eine Praxis-Seite darunterfällt und wie die Auftragsverarbeitung geregelt ist, gehört vor den Livegang auf hopphysio.de geklärt [O].
- **Fehler in der bestehenden Fusion-Seite** (Wirbelsäule bleibt an): als eigener Aufgaben-Vorschlag gemeldet.
