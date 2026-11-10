# Strang WÄRME – Wie entsteht „Zuhause“ in einer dunklen Partikel-Welt?

Stand: 10.11.2026 · alle Quellen an diesem Tag geöffnet · Kennzeichnung: **B** = von geöffneter Quelle bzw. eigener Messung so gestützt · **A** = abgeleitet/plausibel · **O** = offen/nicht belegt.
Am Repository wurde nichts geändert. Messdateien und Werkzeuge liegen nur im Scratchpad:
`‹Scratchpad›/research/waerme-messung/` (Bilder `ist-*.png`, `sim-*.png`, Tabelle `messung.md`) und
`‹Scratchpad›/research/tools/` (`shot.cjs`, `warmth.py`, `regrade.py`).

## 0. Kurzfassung

1. **Die heutige Seite ist sprachlich warm, aber farblich kalt – das ist gemessen, nicht gefühlt.** Der Grund ist Petrol-Schwarz (Farbton 198°), von den beleuchteten Bildpunkten sind am PC nur 6–16 % warm und 49–62 % kühl, die mittlere Lichtfarbe liegt bei ca. 5350–6690 K (Tageslicht-kühl). Die Lampen im Bild leuchten nicht, die Wände sind Raster aus weißen Punkten. (W1, W23)
2. **Wärme ist kein Farbton-Effekt allein.** Die Forschung stützt *nicht* „warme Farbe = angenehmer“ (W5, W6), wohl aber: warm wirkende, gut beleuchtete, wohnliche Räume → höhere erwartete Behandlungsqualität (W2); gemütliche Lichtstimmung (wenig, 2700 K, orange Akzente) beruhigt Ängstliche (W4); runde Formen, Natur, Gesicht, Stimme, soziale Texte wirken (W7–W11).
3. **Der stärkste Hebel ist Handwerk aus Film/Spiel: motiviertes Licht + Farbdrehbuch + Material statt Raster** (W3, W16) und **Gastlichkeit als Ablauf** – Begrüßen, Vorwegnehmen, Verabschieden (W13, W14).
4. **Probe:** Eine reine Umfärbung zweier Bildschirmfotos erreicht 92–93 % warme Lichtpunkte und warmes Schwarz (30°), verfehlt aber das Lichtfarben-Ziel (4430–4560 K statt ≤ 3500 K) – Palette allein reicht nicht, es braucht echte Lichtinseln. (W22)

## 1. Ausgangsmessung (externe Prüfung, eigenes Werkzeug)

**Verfahren (wie ein Kolorist eine Einstellung auswertet):** `labor/hausbesuch-puls.html` unverändert im Container geöffnet (Chrome + SwiftShader, 1440×900 und 390×844), zehn Stationen fotografiert, je Bild ausgewertet: Anteil „beleuchteter“ Bildpunkte (hellster Kanal ≥ 16 %), davon warm (Farbton 330°–65°, Sättigung ≥ 15 %), kühl (150°–270°), neutral (Sättigung < 15 %); mittlere Farbe der dunklen Fläche; ungefähre Farbtemperatur der beleuchteten Fläche (McCamy-Näherung aus dem Mittelwert). Die Messung erfasst den ganzen Bildschirm einschließlich Text und Knöpfen.

| Station (PC) | beleuchtet | warm | kühl | neutral | Lichtfarbe ca. | Grund (Farbton) |
|---|---|---|---|---|---|---|
| Tür | 25 % | 13 % | 58 % | 24 % | 5721 K | #0B171C (198°) |
| Empfang | 29 % | 6 % | 53 % | 28 % | 6207 K | 198° |
| Figur „Spannung lösen“ | 30 % | 10 % | 53 % | 24 % | 5935 K | 198° |
| Behandlung 1 | 21 % | 14 % | 62 % | 22 % | 6420 K | 198° |
| Wirbelsäule | 21 % | 7 % | 59 % | 31 % | 6687 K | 198° |
| Behandlung 2 / Manuthera | 18 % | 13 % | 58 % | 24 % | 5351 K | 198° |
| Training | 13 % | 16 % | 49 % | 34 % | 5670 K | 198° |
| Leistungen | 10 % | 8 % | 34 % | 58 % | 5922 K | 197° |
| Hausordnung | 3 % | 41 % | 27 % | 32 % | 4165 K | 198° |
| Bis bald | 9 % | 37 % | 44 % | 18 % | 4183 K | 198° |

Handy (390×844): Rundgang-Stationen 8–22 % warm, 42–58 % kühl, 4741–5902 K; nur Tür (31 % warm, 4215 K), Hausordnung und „Bis bald“ (49–57 % warm, ~3400 K) sind wärmer – dort trägt vor allem die Bernstein-Schrift. Vollständige Tabelle: `waerme-messung/messung.md`. **[B, eigene Messung – W1]**

Farbwerte aus `labor/src/fusion/style.css`: `--ink #0A161B` Farbton 198°, Sättigung 63 %; Nebentexte `--dim #B0BFC3` (193°) und `--mute #7F959C` (194°) sind kühl-grau; warm sind nur `--txt #EDE8DC` (42°) und `--amber #E09A35` (35°). **[B]**

Beobachtungen aus den eigenen Bildschirmfotos **[B – W23]**: Die Texte sind bereits gastlich („Schön, dass Sie da sind. Jacke ablegen, durchatmen, ankommen.“, „Wir begrüßen Sie mit Namen, nicht mit einer Nummer.“, „Wasser oder Kaffee, und ein Platz am Fenster.“, Tageszeit-Gruß `#greet`, „Bis bald.“, „Damit Sie entspannt ankommen.“). Kalt wirken die Bildmittel: Wände/Decke als Raster aus weißen Punkten, Hängelampe und Stehlampe als Bernstein-Körper **ohne Lichtwirkung**, blaue Nerven/Bandscheiben, Versal-Sperrschrift („BEHANDLUNGSRAUM 1 · WIRBELSÄULE“, „Th1–Th6“), kein Mensch mit Gesicht. Bewertung „kalt“ ist hier **A**; die Farbzahlen sind **B**.

**Grenzen:** SwiftShader ohne Grafikchip (Farben davon unberührt **A**); Schwellen (16 %, 15 %) sind gesetzt, nicht genormt; McCamy ist eine Näherung. Vergleichsmessung fremder Physio-Seiten: nicht durchgeführt.

## 2. Hartes Ziel und ehrlicher Stand

**Ziel „Wärme-Nachweis“ (vor der Probe festgelegt):**
- *Instrument:* an jeder Rundgang-Station ≥ 60 % der beleuchteten Bildpunkte warm, ≤ 15 % kühl, Lichtfarbe ≤ 3500 K, Grundton 15°–45°.
- *Menschen:* 5-Sekunden-Test mit ≥ 20 Personen aus der Zielgruppe (Papier/Handy, ohne Tracking), 7er-Skalen kalt–warm, abweisend–einladend, technisch–menschlich, dazu „kompetent“ (Wärme darf Kompetenz nicht kosten, W24); Ziel Median ≥ 6 bei warm und einladend, „kompetent“ nicht schlechter als heute.

**Stand:** Ist-Seite verfehlt alle vier Instrument-Werte an allen Rundgang-Stationen (Tabelle oben). **Probe-Umfärbung** (`regrade.py`, nur Farbe: Petrol → Farbton 30°, Grau/Weiß → Creme, am Empfang eine Lichtinsel um die Lampe; Formen unverändert):

| Bild | warm | kühl | Lichtfarbe | Grund | Ziel erreicht? |
|---|---|---|---|---|---|
| Empfang Ist | 6 % | 53 % | 6207 K | 198° | – |
| Empfang Probe | 92 % | 0 % | 4430 K | #1E1913 (30°) | warm ja · kühl ja · Grund ja · **Lichtfarbe nein** |
| Wirbelsäule Ist | 7 % | 59 % | 6687 K | 198° | – |
| Wirbelsäule Probe | 93 % | 0 % | 4559 K | #1C1711 (31°) | warm ja · kühl ja · Grund ja · **Lichtfarbe nein** |

**[B, eigene Messung an einem Probebild – W22]** Drei von vier Zielwerten sind allein mit Palette erreichbar; ≤ 3500 K nicht – dafür müssen die Lichtinseln selbst satter warm sein (Hebel 2/3). Das Raster bleibt in der Probe sichtbar kalt (**A**, eigene Sicht – kein Beleg). **Der Menschen-Test wurde nicht durchgeführt** (keine Testpersonen verfügbar); ohne ihn ist „wirkt warm“ nicht belegt.

## 3. Belege aus der Forschung

**Licht und Farbe**
- **W4 [B]** Kuijsters u. a. 2015 (PLoS One, N = 38, 66–94 J., teils von Philips finanziert): „cozy“ = 120 lx, 2700 K + orange Akzentlicht; neutral = 150 lx, 3400 K. Nach Angst-Film beruhigte die gemütliche Stimmung stärker (Erregung F(1,33) = 6,10, p = .019; Hautleitwert p = .043). https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0132732
- **W5 [B]** Fotios 2016 (LEUKOS 13(1)): Kruithofs Regel ist nicht gestützt; für „angenehm“ nur „avoiding low illuminances“, keine bevorzugte Farbtemperatur. https://eprints.whiterose.ac.uk/id/eprint/98531
- **W6 [B]** Valdez & Mehrabian 1994: Helligkeit und Sättigung bestimmen das Gefühl stärker als der Farbton (Pleasure = .69·Helligkeit + .22·Sättigung); Blau-Töne am angenehmsten, Gelb/Grüngelb am wenigsten. PMID 7996122.
  → Folge **[A]**: Bernstein allein macht nicht behaglich; es braucht **helle** warme Inseln im Dunkel, und Blau ist nicht der Feind (HOP-Kreise dürfen bleiben).
- **W18 [B]** Die bekannte Behauptung „körperliche Wärme macht zwischenmenschlich warm“ (Williams & Bargh 2008, PMID 18948544) ließ sich nicht wiederholen: Chabris u. a. 2019, r = −.03 und .02 bei N = 128/177. https://doi.org/10.1027/1864-9335/a000361 → nicht als Argument verwenden.
- **W17 [B, Pressemitteilung]** Smalley & White 2023 (> 2 500 Teilnehmende): Sonnenauf-/-untergang wird deutlich schöner bewertet als blauer Himmel, mehr Ehrfurcht, knapp 10 % höhere Zahlungsbereitschaft. https://www.eurekalert.org/news-releases/977120

**Praxis- und Warteräume**
- **W2 [B, Zusammenfassung des Center for Health Design]** Arneill & Devlin 2002 (35 Wartezimmer-Dias, 147 Studierende + 58 Ältere): erwartete Behandlungsqualität höher bei „nicely furnished, well-lighted, contained artwork, and were warm“; niedriger bei „dark … cold in appearance“. Grenzen: kleine Stichprobe, „warm/welcoming“ nicht scharf definiert. https://specfurniture.com/sites/default/files/articles-files/Arneill_Devlin-2002-CHD-KPS.pdf
  → **Ein dunkler Auftritt ist ein Risiko**, wenn er nicht sichtbar beleuchtet und wohnlich ist.
- **W8 [B]** Natur: Ulrich 1984 (23 vs. 23 Patienten, Fenster ins Grüne: kürzerer Aufenthalt, weniger starke Schmerzmittel; PMID 6143402) · Beukeboom u. a. 2012 (N = 457, echte Pflanzen **und Pflanzen-Poster** senken Stress, kleiner Effekt, vermittelt über Attraktivität; PMID 22489806) · Dijkstra u. a. 2008 (PMID 18329704) · Übersicht Ulrich u. a. 2008 (PMID 21161908).
- **W19 [B]** Holz: Nyrud & Bringslimark 2010 (Übersicht): Menschen bevorzugen Holz, „because it is natural“, aber „caution“ beim Schluss auf Gesundheitsnutzen. (Zusammenfassung über OpenAlex; Burnard & Kutnar 2015 nicht zugänglich.)
- **W9 [B]** Feuer: Lynn 2014 (N = 226, drei Studien): Blutdruck sinkt „consistently“ bei **Feuer mit Ton**. PMID 25387270.

**Formen** – **W7 [B]** Bar & Neta 2006 (PMID 16913943): scharfe Kanten → negative Tendenz · Dazkir & Read 2011 (N = 111): runde Möbel → mehr Wohlgefühl, „relaxed, peaceful, calm“, mehr Annäherung (https://doi.org/10.1177/0013916511402063) · Vartanian u. a. 2013 (PMID 23754408): runde Räume schöner, aber kein Effekt auf Annäherung · Palumbo u. a. 2015 (PMID 26460610): rund ↔ „safe/positive“ · Jiang u. a. 2016: runde Logos → „softness“.

**Mensch: Gesicht, Stimme, soziale Texte**
- **W10 [B]** Cyr u. a. 2009 (MIS Quarterly 33(3); Kanada, Deutschland, Japan): Bilder von Menschen **mit Gesicht** → mehr Gefallen und „warmth or social presence“ → Vertrauen; **kein direkter** Effekt auf Vertrauen. https://doi.org/10.2307/20650308 · Hassanein, Head & Ju 2007: „socially-rich text and pictures“ erhöhen soziale Präsenz → Nützlichkeit, Vertrauen, Freude (Kanada). https://www.scitepress.org/Papers/2007/23543/23543.pdf
- **W25 [B]** Erster Eindruck in 50 ms (Websites, Lindgaard u. a. 2006, https://doi.org/10.1080/01449290500330448) bzw. 100 ms (Gesichter, Willis & Todorov 2006, PMID 16866745).
- **W11 [B]** Schroeder & Epley 2016 (PMID 27513307): Wer eine **Stimme** hört, schließt eher auf einen Menschen als bei gleichem Text; gesehenes Video ohne Stimme hilft nicht; monotone Stimme hebt den Effekt auf.
- **W24 [B]** Fiske, Cuddy & Glick 2007 (PMID 17188552): Wärme und Kompetenz sind die zwei Grunddimensionen; positiv wirkt nur beides zusammen.
- **W12 [B]** Schroll u. a. 2018 (J. Consumer Research): Handschrift erzeugt „perceptions of human presence“; der Effekt **kehrt sich um** bei funktional positionierten Produkten. https://doi.org/10.1093/jcr/ucy014

**Offen [O]:** Serifenschrift = wärmer (kein Beleg geöffnet); Vogels’ Atmosphäre-Fragebogen (Gemütlichkeit, Lebendigkeit, Anspannung, Distanz) nur aus Sekundärangaben; Richtung des Farbton-Effekts bei Gorn u. a. 2004 (Zusammenfassung nennt nur „relaxed“, nicht die Farbe).

## 4. Handwerk aus Film, Animation, Spiel

- **W3 [B]** Project-Horseshoe-Bericht „Coziness in Games“ (2017; Short, Cook u. a.): Gemütlichkeit = „safety, abundance, and softness“. Mittel: warmes Licht **aus klarer Quelle** bei wenig Grundlicht und weichen Schatten; starke Quellen gebrochen (Schirm, Laub); natürliche Materialien, Handgemachtes, Alltagsdinge; umschlossene Räume, Blick nach draußen durch Dunst/Dunkel begrenzt; Kontrast zu ungemütlichem Draußen (Regen am Fenster); leiser, durchgehender, diegetischer Ton; langsames Tempo; menschlicher Maßstab. **Zerstört wird sie durch:** „harsh or sterile environments“ (Sci-Fi ohne Naturmaterial), Unterbrechungen, grelle/plötzliche Reize, Weite, Druck/Belohnungsmechanik, Eingesperrtsein, Prunk. https://www.projecthorseshoe.com/reports/featured/ph17r3.htm
- **W16 [B]** Motiviertes Licht: „the technique used to imitate or accentuate existing light sources“ (StudioBinder, 28.3.2021, https://www.studiobinder.com/blog/what-is-motivated-lighting/). Pixar/Museum of Science: „Light shows you where to look and enhances the emotional feel of each scene.“ (https://sciencebehindpixar.org/pipeline/lighting). Farbdrehbuch: „a visual roadmap of a film's story, told through the strategic use of color“ (StudioBinder, 6.6.2020, https://www.studiobinder.com/blog/what-is-a-color-script-definition/).
- **W16 [B]** Farbdrehbuch als Datentabelle in three.js: Bruno Simons „folio-2025“ hält je Tageszeit Lichtfarbe, Schattenfarbe, zwei Dunstfarben und Stärken (`presets` day/dusk/night/dawn; Tag: Licht `#ffd2c2` warm, Schatten `#6d3fff` violett) und blendet dazwischen. https://raw.githubusercontent.com/brunosimon/folio-2025/main/sources/Game/Cycles/DayCycles.js → warmes Licht + kühler Schatten statt „alles Bernstein“.
- **W20 [B]** Unpacking: > 14 000 Geräusch-Aufnahmen echter Gegenstände; bei Berührung zweier Materialien gewinnt das **weichere**; sanftes Bewegen klingt sanft (Game Developer, 30.3.2022, https://www.gamedeveloper.com/marketing/auditory-tales-from-the-making-of-zen-puzzler-unpacking).
- **[B]** Tiny Glade (Steam, 23.9.2024): „no management, no combat, or wrong answers“, „fireflies light up the night“ (https://store.steampowered.com/app/2198150/Tiny_Glade/); Entwicklerin Opara nennt Townscaper „very uplifting and kind experiences“ (80.lv, 30.5.2024). Zur Lichttechnik von Tiny Glade: keine Primärquelle geöffnet **[O]**.
- **W21 [B]** Hotel Ett Hem, Stockholm (Name = „ein Zuhause“): Navigation nach Räumen (HOUSE · KITCHEN · WELLBEING · GARDEN), „For people looking for something more personal than the luxury hotel“, „There's always space for you.“ https://www.etthem.se/ – dieselbe Idee wie HOP, aber hell. Dunkle, warme Hotel-/Handwerks-Seiten: gesucht, keine belastbar geprüft **[O]**.
- Monument Valley, A Short Hike: nicht geprüft **[O]**. Tiefenschärfe/Lichtkegel als Wärme-Mittel: Handwerksregel **[A]**.

## 5. Gastlichkeit als Ablauf

- **W13 [B]** Ritz-Carlton „Three Steps of Service“: „1. A warm and sincere greeting. Use the guest's name. 2. Anticipation and fulfillment of each guest's needs. 3. Fond farewell. Give a warm good-bye and use the guest's name.“ https://ritzcarltonleadershipcenter.com/about-us/about-us-foundations-of-our-brand/
- **W13 [B]** Danny Meyer (NPR, 17.10.2006): „Service is really a way to describe how well the product was delivered. Hospitality describes how the recipient of that service feels…“; Gastlichkeit beginnt bei der Reservierung; nie „Nein“, sondern ein anderer Zeitpunkt; bei Fehlern „write a good last chapter“. https://www.npr.org/transcripts/6162737
- **W13 [B]** Will Guidara (TED 2022, Folge 6.7.2024): „one size fits one. Hospitality is about making people feel seen.“; ernst nehmen, was man tut, nicht sich selbst. https://podscripts.co/podcasts/ted-talks-daily/the-secret-ingredients-of-great-hospitality-will-guidara
- **W14 [B]** Redelmeier & Kahneman 1996 (Koloskopie n = 154, Lithotripsie n = 133): Erinnerung hängt am schlimmsten Moment und an den **letzten Minuten**, nicht an der Dauer. PMID 8857625. → Der Abschied zählt überproportional.

Übersetzung in Mikro-Momente **[A]**: Begrüßen (Tageszeit, Name der Praxis und des Gastgebers) · Anbieten (Platz, Getränk, „Ton an?“) · Begleiten („Ich gehe vor“) · Vorwegnehmen (Parken, Rezept, was mitbringen – vor der Buchung) · Verabschieden (Tür, Licht, Unterschrift) · Erinnern („Schön, dass Sie wieder da sind“ – nur lokal gespeichert; **Zulässigkeit ohne Einwilligung offen [O]**, gehört in den Rechts-Strang).

## 6. Ton – Regeln

- **W15 [B]** Chrome: stummes Abspielen immer erlaubt; mit Ton nur nach Klick/Tippen; `AudioContext` nach Geste mit `resume()` (https://developer.chrome.com/blog/autoplay). Safari (WebKit, 8.6.2017): „Websites should assume any use of <video> or <audio> requires a user gesture click to play.“ (https://webkit.org/blog/7734/auto-play-policy-changes-for-macos/). WCAG 2.2, 1.4.2: Ton > 3 s braucht Stopp/Lautstärke; empfohlen wird Start durch die Nutzerin (https://www.w3.org/WAI/WCAG22/Understanding/audio-control.html).
- **[B]** Naturklang: Erholung des Hautleitwerts nach Stress „tended to be faster“ als bei Lärm (Alvarsson u. a. 2010, N = 40, PMID 20617017). Warteraum-Musik senkte Angst bei wartenden Eltern in der Notaufnahme (Übersicht Ringer u. a. 2017, PMID 28499745 – andere Lage als eine Praxis).
- Regeln **[A, aus W3, W9, W15, W20]**: aus per Standard; ein sichtbarer Schalter „Mit Ton“ an der Tür; Wahl merken; keine Musikschleife, sondern Raumklang (Tür, Schritte auf Holz, Tasse, Regen draußen) unter Gesprächslautstärke; Berührungsgeräusche weich; im Termin-Blatt still; Untertitel/Text für jede Stimme.

## 7. Was die Welt KALT macht – und die Milderung

| Kältequelle | Beleg | Milderung ohne Verzicht auf Partikel |
|---|---|---|
| Petrol-Schwarz 198°, kühl-graue Nebentexte | W1 [B] | warmes Schwarz (Farbton ~30°), Nebentexte warmgrau; Petrol/Blau nur als Markenakzent |
| Raster-Wände aus weißen Punkten (liest sich wie CAD/Scan) | W23 [B Beobachtung], W3 „sterile“ [B] | Flächen als weiche, unregelmäßige Punktdichte; Raster nur beim „Röntgenblick“ |
| Lampen ohne Licht, gleichmäßige Helligkeit | W23, W3, W16 | jede Station eine leuchtende Quelle mit Lichtinsel |
| Schwarze Leere hinter den Wänden | W3 „distance and vastness“ | warmer Dunst begrenzt die Tiefe |
| Blau leuchtende Nerven/Bandscheiben, Scan-Linien, Zittern | A | Blau nur im aktiven Abschnitt; Zittern verlangsamen; Scan als kurzer Moment |
| Versal-Sperrschrift, Kürzel (Th1–Th6) | A | Klartext zuerst („Zwischen den Schulterblättern“), Kürzel klein darunter |
| Kein Gesicht, keine Stimme | W10, W11 | echtes Portrait und 10 s Stimme des Inhabers |
| Reize/Druck (Pop-ups, Zähler) | W3 | nichts drängt; Ausgang jederzeit |

## 8. Werkzeugkasten: 18 Wärme-Hebel

Aufwand (Schätzung **A**): klein ≤ 1 Tag · mittel 2–5 Tage · groß > 1 Woche.

| # | Hebel | Wirkung (Beleg) | Anwendung im HOP-Haus | Aufwand | Risiko |
|---|---|---|---|---|---|
| 1 | Warmes Schwarz + warmgraue Nebentexte | W1, W2, W22 [B] | alle Flächen, Shader-Grundfarbe; HOP-Blau bleibt Akzent | klein | braun/matschig; Kontrast neu prüfen |
| 2 | Motiviertes Licht: jede Lampe leuchtet | W3, W4, W16 [B] | Hängelampe Empfang, Stehlampe „Bis bald“, Fenster Training: Punkte nahe der Quelle heller, größer, wärmer | mittel | Überstrahlen, Handy-Leistung |
| 3 | Helle Inseln statt Gleichmaß | W5, W6 [B] | Blickziel je Station (Tresen, Liege, Wirbelsäule) deutlich heller als Umfeld | klein | Kino-Dunkel geht verloren |
| 4 | Farbdrehbuch entlang des Scrollwegs | W16 [B] | Tabelle je Station: Licht-, Schatten-, Dunstfarbe; Tür kühl-blau → Empfang Lampe → Behandlung ruhig → Training Morgenlicht → Abschied Abendgold | mittel | zu bunt; je Station nur 1 Licht- + 1 Schattenfarbe |
| 5 | Draußen kühl, drinnen warm (Schwelle) | W3 [B] | Tür: Abendblau, warmer Lichtstreifen fällt auf die Fußmatte; Abschied: Blick zurück aufs erleuchtete Fenster | mittel | Wetter-Kitsch |
| 6 | Material statt Raster | W3, W19 [B] | Wände als weiche Punktflächen; Boden mit Maserung (Punkte in Faserrichtung), Vorhang, Teppich | groß | Detailflut, Rechenzeit |
| 7 | Runde Formen | W7 [B] | Möbelkanten, Lichtkreise, runde Knöpfe/Karten | klein–mittel | verspielt |
| 8 | Natur und Fensterblick | W8 [B] | Pflanzen ausbauen, Baum vor dem Fenster, leichte Blattbewegung | klein | gering |
| 9 | Warmer Dunst, Nähe weich | W3 [B], Tiefenschärfe [A] | Tiefe hinter den Wänden in warmem Dunst; nahe Punkte groß/weich | mittel | milchig, Lesbarkeit |
| 10 | „Atmendes“ Licht statt Flackern | W9 [B, nur mit Ton], A | Lampen ±3 % sehr langsam; kein Kamin, den es nicht gibt | klein | Unruhe; bei „Bewegung anhalten“ aus |
| 11 | Echtes Gesicht des Gastgebers | W10, W25 [B] | warm belichtetes Portrait am Empfang; Partikel-Figur geht ins Foto über | mittel (Fototermin) | Stockfoto-Wirkung; Recht prüfen |
| 12 | Stimme auf Wunsch | W11, W15 [B] | 10–15 s Begrüßung, selbst gesprochen, mit Text darunter | klein | Tonqualität, monoton = wirkungslos |
| 13 | Raumklang auf Wunsch | W3, W15, W20 [B] | Schalter „Mit Ton“ an der Tür; Tür, Holzschritte, Tasse; weiche Berührungstöne an Figur/Liege | mittel | nervt im Büro; Pflege |
| 14 | Drei Schritte der Gastlichkeit | W13 [B] | Gruß mit Namen des Hauses → Vorwegnehmen (Parken, Rezept, Mitbringen) vor dem Termin → Abschied | klein | Floskeln |
| 15 | Abschied als Höhepunkt | W14, W17 [B] | „Bis bald“ im Abendlicht, persönlicher Satz, nach der Buchung „Wir freuen uns auf Sie“ | klein | Pathos |
| 16 | Nie „Nein“ | W13 [B] | ohne WebGL, Buchung lädt nicht, kein Termin frei → immer Telefon/E-Mail als freundliche Alternative | klein | – |
| 17 | Handschrift nur für Persönliches | W12 [B] | echte Unterschrift/Notiz als Zeichnung; nie für medizinische Angaben | klein | Schreibschrift-Kitsch |
| 18 | Ruhe, Alltagsdinge, menschlicher Maßstab | W3 [B] | Jacke am Haken, Tasse, Klingelschild; langsame Übergänge; „Direkt zum Termin“ immer erreichbar | klein–mittel | Requisiten-Überladung (1–2 je Raum) |

**Reihenfolge nach Wirkung je Aufwand [A]:** 1 → 2 + 3 → 4 → 11 → 14 + 15 → 7 → 12 → 6. Hebel 1–3 lassen sich mit `warmth.py` sofort gegenprüfen.

## 9. Nicht erreichbar / fehlt

- PubMed-Webseiten (Cookie-Sperre) → Zusammenfassungen über die offizielle NCBI-Schnittstelle (E-utilities) geholt.
- 403/503/Bezahlschranke: Hogrefe (Chabris – Zusammenfassung über OpenAlex), Springer (Vogels 2008), Taylor & Francis (Stokkermans 2018), McMaster-Archiv, scinapse, Audiokinetic-Blog, TU Delft, Monocle, Khan Academy (leer). OpenAlex zeitweise 429 → Cyr 2010, Bille 2015, Brumberger 2003, Gorn 2004 (nur Crossref-Zusammenfassung) nicht vertieft.
- Originalartikel Arneill & Devlin 2002 und Smalley & White 2023 nicht im Volltext (nur CHD-Zusammenfassung bzw. Pressemitteilung).
- Keine Testpersonen → Menschen-Test offen. Kein Gerät mit Grafikchip/iPhone → Messung nur im Container.
- GitHub-Schnittstelle für fremde Repos nicht freigeschaltet → nur Einzeldateien über raw.githubusercontent.com.
