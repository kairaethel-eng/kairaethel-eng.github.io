# Ideenbuch „Das Haus lebt“ – Ideen und Plan für die neue HOP-Website (11.11.2026)

**Stand: nur Ideen und Plan, nichts gebaut. Wartet auf Kais Auswahl (Fragen F1–F7 unten).**
Vollständige Fassung mit fünf Skizzen zum Anfassen (privat): https://claude.ai/artifact/9o1k9z5KAhEsTyCT6PWCSV
Quelle der Seite liegt nicht im Repo (Scratchpad der Session); bei Bedarf über die Artifact-Adresse lesen und weiterführen.

## Auftrag (Kai, 11.11.2026)
Modernste, kreativste, „lebendigste“ Website. Charakter des warmen, willkommenen Hauses behalten. Texte der bisherigen Seiten sinngemäß übernehmen. Struktur bleibt: Haustür → Hereintreten → Rundgang durch Empfang und Behandlungszimmer als Stationen. Highlights: interaktive Wirbelsäule (Vorbild: Magnific-Videosuche „Spinal cord“), Manuthera 242, Philosophie, Leistungen, realitätsgetreu mit gestalterischen Effekten. Erst Ideen zeigen, dann bauen. Ohne Extrakosten; kostenpflichtige Möglichkeiten nur als Beispiele.

## Leitidee
Die Website ist das Haus. Drei Eigenschaften: **es kennt die Zeit** (Sonnenstand Schorndorf im Browser gerechnet, Türschild geöffnet/geschlossen), **es antwortet** (Tür öffnet beim Klingeln, Licht folgt, Dinge reagieren), **es atmet** (ruhiger Atemtakt, ca. 6/min). Puls lebt als Bernstein-Linie am Boden weiter (wird Nervenbahn, Bewegungsbogen, Fortschrittsanzeige) und als „zweiter Blick“ (unter der Hand werden Wand, Möbel, Haut durchscheinend).

## Drei Richtungen (F1)
- **A Gebautes Lichthaus:** warmes 3D-Modell, vorberechnetes Licht; steuerbar, flüssig am iPhone; stilisiert, nicht fotoecht [A].
- **B Echtes Haus:** iPhone-Video → 3D-Scan (Gaussian Splat); fotoecht; Licht eingefroren, Dateigröße/Leistung am Handy offen [O].
- **C Lichthaus mit echten Momenten (Empfehlung):** A als Grundlage, dazu Fotos mit Tiefe, kurze echte Filme, später ein Scan-Raum; Puls als zweiter Blick.

## Stationen (Formulierungsvorschläge in der Artifact-Skizze 2)
Vor der Tür „Kommen Sie rein.“ → Schwelle/Flur „Jacke ablegen. Durchatmen.“ → Empfang „Guten Tag. Schön, dass Sie da sind.“ → Behandlungsraum 1 „Hände, die verstehen.“ (Wirbelsäule) → Behandlungsraum 2 „Bewegung in drei Dimensionen.“ (Manuthera 242) → Training „Bewegung ist das beste Zuhause.“ → Unterm Dach „Alles unter einem Dach.“ (Leistungen, Puppenhaus-Blick) → Hausordnung (führt sich selbst vor) → „Bis bald.“ (Tür von innen, Kontakt).

## Ideen mit Kürzel (Kai antwortet mit den Kürzeln)
- **Wirbelsäule:** W1 echte Anatomie (BodyParts3D) · W2 drei Ansichten Knochen/Röntgen/Nerven · W3 Nervenimpulse · W4 Hautgebiet eines Nervs leuchtet auf (kein Beschwerde-Finder; Körperkarte bleibt gestrichen) · W5 Haltung per Regler/Neigen · W6 Scanner mit sechs Haltestellen bleibt · W7 auseinandergezogen · W8 Querschnitt · W9 Klang · W10 AR.
- **Manuthera:** M1 originalgetreu nach Lojer-Maßzeichnung · M2 gelbe Hebel greifen · M3 Blick durch die Haut (Wirbelsäule bewegt sich mit) · M4 echte Kurzfilme · M5 3D-Scan der Liege [O] · M6 Bühne · M7 neutrale Sprache (§ 3 HWG) · M8 Erlaubnis von Lojer für Bilder.
- **Leistungen/Philosophie:** L1 Puppenhaus-Blick · L2 lebende Karten (Motiv je Leistung) · L3 Dinge im Regal · L4 Kurzfassung · P1 Hausordnung führt sich vor · P2 Kompetenz und Herz (Zertifikate + Handschrift) · P3 Kai als Gastgeber (Foto mit Tiefe, Handschrift, Stimme) · P4 „So läuft es ab“ am Tresen.
- **Das Haus lebt:** H1 Tages-/Jahreszeit · H2 Türschild · H3 Licht folgt · H4 Lichtschalter = Hell/Dunkel · H5 Klang auf Wunsch · H6 Atempause 60 s · H7 wärmende Hand · H8 zweiter Blick · H9 Umschauen durch Neigen · H10 kleine Bewegungen · H11 Wanduhr · H12 Seiten wie Papier · H13 Hausplan-Navigation · H14 Rundgang + „Kurz und knapp“ · H15 Start ohne Ladebalken · H16 Führung per Klingel · H17 Ruhemodus/ohne 3D · H18 kein Vibrieren (gestrichen).
- **Mit Extrakosten (nur Beispiele):** X1 KI-Filme · X2 Foto→3D · X3 fertiges Anatomie-Modell · X4 3D-Künstler · X5 Profi-Fotos/Film · X6 Scan-App mit gewerblichen Rechten · X7 Lizenzmusik · X8 Studio-Auftrag (Vergleich).

## Recherche-Ergebnisse (11.11.2026; [B] = Quelle in der Recherche geöffnet, [A] = abgeleitet, [O] = offen)
- Magnific-Suchseite ließ sich nicht öffnen (403 für automatische Zugriffe) [B]; Motive aus Clip-Titeln abgeleitet: leuchtendes Rückenmark, wandernde Impulse, durchscheinender Körper, Modell vor Schwarz, Querschnitt [A]. Freepik heißt seit 28.4.2026 Magnific [B].
- WebGPU: Chrome und Safari 26/iOS 26 [B]; three.js-WebGPURenderer verlangt Portierung aller ShaderMaterial nach TSL, belegter Handy-Vorteil fehlt → bei WebGL 2 bleiben [A].
- CSS-Scroll-Animationen (Safari 26), View Transitions (Safari 18) nativ [B]. GSAP mit allen Plugins kostenlos seit 30.4.2025, Lenis MIT [B].
- Gaussian Splats: Spark (MIT, three.js, WebGL 2; Beispiele Reveal/Dissolve/Partikel), SOG 15–20× kleiner als PLY [B]. Scaniverse Free ohne gewerbliche Rechte (Pro 50 $/Monat), Polycam/KIRI Splats nur bezahlt [B] → kostenloser Weg: iPhone-Video + Brush (Apache-2.0) auf Kais PC [O].
- iOS: kein Vibrieren [B]; Kreisel und Ton nur nach Tippen [B]; Safari 27 `<model>` mit AR Quick Look [B].
- Anatomie: BodyParts3D 4.0 CC BY 4.0 (Nennung „BodyParts3D, © The Database Center for Life Science licensed under CC Attribution 4.0 International“) [B]; Z-Anatomy CC BY-SA 4.0 [B]; kein freies Komplettmodell mit Bandscheiben, Rückenmark, Nervenwurzeln gefunden.
- Tiefe aus einem Foto: Depth Anything V2 Small Apache-2.0 (Base/Large nicht kommerziell) [B]. Hunyuan3D: Lizenz schließt EU aus [B].
- BFSG: Kleinstunternehmen mit Dienstleistungen ausgenommen (§ 3 Abs. 3) [B].
- **Lojer Manuthera 242** (Handbuch DE 10/2015, Broschüre EN 9/24) [B]: fünf Abschnitte + zwei Armstützen (Kopfteil, oberer Thorax, unterer Thorax, Unterkörper, Fußplatte); Unterkörper: Extension/Flexion, Traktion, Drop, Rotation, Lateralflexion; oberer Thorax und Kopfteil eigenständig; elektrisch HI-LOW und Tilt per Fußpedal; Hebel signalgelb, bogenförmiger Rahmen. Broschüre 9/24: Höhe 51–106 cm, Länge max. 190 cm, Breite 55 cm, Polster 28/48/48/54/54 cm, 170 kg, Arbeitslast 150 kg. Ausführungen Grauweiß (Rahmen RAL 9002, Polster RAL 7024) und Carbon (242C) – welche Kai hat: offen. Keine öffentlichen CAD-/Bilddaten, Bilder nur mit schriftlicher Erlaubnis. Zahlen erst nach Abgleich mit dem Typenschild auf die Website.
- Quellen u. a.: lojer.com (Produktseite, Broschüre), sparkjs.dev/examples, gsap.com/community/standard-license, nianticspatial.com/pricing, dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html, webkit.org (Safari 26/27), gesetze-im-internet.de/bfsg/__3.html.

## Bauplan, falls Go
Eigene neue Quelle `labor/src/…`, Puls · Scan / Hausbesuch / Fusion unangetastet. Etappen: 1 Probe-Raum (Haustür, Flur, Empfang; danach Kais Urteil) · 2 Haus und Weg · 3 Wirbelsäule · 4 Manuthera · 5 Leistungen, Hausordnung, Bis bald · 6 Leben und Detailprüfung · 7 Livegang nur nach Go.
Von Kai gebraucht: Grundriss-Skizze, Fotos je Raum und Haustür (ohne Personen), Manuthera-Ausführung + Fotos + vier Kurzfilme, Porträt, Handschrift, optional Stimme, später Rundum-Videos für Scans.
Risiken: gebauter Look stilisiert; Leistung am iPhone; vorberechnetes Licht und Scan-Weg auf Kais PC ungetestet [O].

## Offene Entscheidungen (Kai)
F1 Richtung A/B/C (Empfehlung C) · F2 Puls: a keiner / b zweiter Blick + Linie (Empfehlung) / c draußen dunkel · F3 Licht echt nach Uhrzeit (Empfehlung) oder immer goldene Stunde · F4 Schrift HOP (Archivo/Caslon, Empfehlung) oder Fraunces · F5 welche Ideen (Kürzel) · F6 welches Material kann Kai liefern · F7 Probe-Raum als nächster Schritt.
