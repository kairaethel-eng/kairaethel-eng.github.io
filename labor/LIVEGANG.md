# Livegang Puls · Scan auf hopphysio.de (GitHub Pages + eigene Domain)

Entscheidung Kai 2.11.2026. Stand 14.11.2026 spät (Auftrag Z): **„Stand jetzt“ = https://kairaethel-eng.github.io/labor/live/** – alles Neue auf einer Seite (echte Wirbelsäule, Film „Bandscheibenvorfall“, Linienhaus, Stoßwelle). Livegang wartet auf Kais Go.
Markierung: **[B]** selbst geprüft · **[A]** abgeleitet · **[O]** offen.

## ▶ Aufgabenliste bis zum Livegang (Auftrag Z, 14.11.2026 spät) – Reihenfolge = Nummer
| Nr | Wer | Was | Hinweis |
|---|---|---|---|
| 1 | Kai | **Stand jetzt prüfen** (PC Chrome + iPhone): Gesamteindruck, Scrollgefühl, Wirbelsäule „echt“ (alle 6 Haltestellen, PC L4–L5/S1: Nervenbahn durchs Kreuzbein), Film aus der Karte L4–L5 öffnen/schließen, Linienhaus wischen + Augenhöhe, Stoßwelle, Kalender im Termin-Blatt, einmal quer halten; dazu 2560-Monitor, ein Android-Handy | im Container nicht prüfbar: echte Grafik, Flüssigkeit, Safari [O] |
| 2 | Kai | **Inhalte:** Porträt + drei Fakten in Kap. 02 (D1) · Raumfotos für das Linienhaus (ab 15.11., `data-photo`), Scan später · „Erster Besuch“/FAQ (D4) · erster Bildschirm am Handy (D3/K6) · Leistungs-Etiketten bestätigen (A6/K7) · fachlich: Th7–Th12-Texte, Wurzel **L5** beim Vorfall L4/L5, Stoßwelle „Wie viele Termine“/„nicht geeignet“, Raum „Behandlung 1“ | Claude baut ein, sobald geliefert · **22.11. (Kai): fachliche Texte (Th7–Th12, L5, Stoßwelle, Leistungs-Etiketten) „passt“** – offen bleiben Porträt, Raumfotos, FAQ |
| 3 | Kai | **Rechtsangaben:** Impressum zweimal „[Bitte ergänzen]“ (Behörde laut Erlaubnisurkunde, Berufshaftpflicht) | öffentlich sichtbar – vor Schritt 7 Pflicht |
| 4 | Kai → Fachperson/Anwalt | **Rechtlich gegenlesen:** „Osteopathische Ansätze“, „lindert“, Optica § 4 (AV-Vertrag, reCAPTCHA-Einwilligung) · neu: Texte + Warnsatz des Films (HWG) · Stoßwelle-Texte (keine Wirkaussage) und Berufsrecht (Stoßwelle ohne ärztliche Verordnung? → VDB/Zimmer-Berater) · Namensnennung BodyParts3D (steht im Impressum-Entwurf § 9 und im Fuß) · neu 16.11.: Kap. 01 „Der Körper heilt sich selbst, nicht ich.“ (keine Wirkaussage über die Behandlung, trotzdem mitlesen) | |
| 5 | Kai | **Praxisbetrieb:** Online-Termine in Optica Viva freischalten · Anrufbeantworter einrichten | sonst läuft „Termin buchen“ ins Leere · **Stand 22.11. (Kai):** Online-Termine in Viva laufen; Anrufbeantworter: noch nicht |
| 6 | Kai (Claude diktiert) | **Konten absichern:** 2FA für GitHub und Wix | vor dem DNS-Umzug |
| 7 | Claude, **nach Kais Go „Wurzel“** | `LIVE_ROOT=1 node build.mjs live` → Wurzel `index/impressum/datenschutz.html` + **alle 13 Beidateien** (Liste Schritt 4 unten) auf `main`; danach `node tools/sizes.cjs ../index.html` | ersetzt die Übergangsseite |
| 8 | Claude, je eigenes Go (außerhalb `labor/`) | `robots.txt`, `sitemap.xml`, `404.html`; optional GitHub Action (Bauen + Prüfen) | |
| 9 | Claude (Kai 22.11.: „du entscheidest, was sinnvoll ist“) | **Technik-Entscheidungen – entschieden 22.11.:** (a) **Sicherheitsregeln (CSP) per `<meta>`: umgesetzt** im Live-Build (nur Eigenes laden, Ausnahme Optica-Kalender im Termin-Blatt; geprüft: keine Verstöße auf allen drei Seiten, Kalender lädt) · (b) **Dateien nicht weiter trennen:** eine HTML-Datei je Seite bleibt (Regel der Arbeitsanweisung); die großen Daten (Wirbelsäule, Knochen, Figur, Film-Standbilder) liegen schon als eigene Dateien daneben und laden erst bei Bedarf; GitHub Pages packt die Seite beim Ausliefern (rund ein Drittel der Größe) · (c) **`/labor/` bleibt bis zum Livegang öffentlich (noindex)**; beim Livegang (Schritt 7/8) zusätzlich `robots.txt` mit `Disallow: /labor/` in der Wurzel – Löschen von Entwürfen nur mit eigenem Go · (d) `geo`/`sameAs` in den Praxisdaten: weglassen, solange es kein gepflegtes Google-Unternehmensprofil-Link gibt · (e) eine Dachlinie: von Kai entschieden (20.11.) | |
| 10 | Kai klickt, Claude diktiert | **Domain:** GitHub-Domain verifizieren, Custom domain eintragen, DNS bei Wix umstellen (Schritte 5–7 unten) | Rückweg: alte DNS-Werte oben · **Kai 22.11.: erst, sobald die Website final ist** |
| 11 | Kai | **Danach:** https://hopphysio.de/ prüfen, „Enforce HTTPS“, Link-Vorschau testen, Google Search Console + Unternehmensprofil | Schritt 8 unten |
| 12 | Claude, nach dem Livegang | Aufräumen: tote Adress-Schalter (`?scan=0`, `?licht`, `?disc`, `?sandbox=0`), `praxis.js` nur noch für `zuhause`/`fusion`, `still-dach.webp`, `main.js` aufteilen (T7), Entwurfsseiten löschen (nur mit Go) | |

## Ist-Zustand der Domain (DNS-Abfrage 2.11.2026, read-only) [B]
| Eintrag | Wert heute | Bedeutung |
|---|---|---|
| NS | ns12.wixdns.net, ns13.wixdns.net | DNS wird **in Wix** verwaltet (Domains → hopphysio.de → DNS-Einträge) |
| A | 185.230.63.171 · 185.230.63.107 · 185.230.63.186 | zeigt auf die Wix-Website |
| AAAA | keine | – |
| CNAME www | cdn3.wixdns.net | www-Adresse zeigt auf Wix |
| MX | aspmx.l.google.com | E-Mail kontakt@hopphysio.de läuft über **Google Workspace** – bleibt unberührt |
| TXT | v=spf1 include:_spf.google.com ~all · google-site-verification=… | Mail-Absenderschutz, Google-Bestätigung – bleiben |

Rückweg: Diese Werte sind die Sicherung. Werden A und CNAME www wieder darauf gesetzt, ist die Wix-Seite nach ≤ 1 Stunde (TTL 3600) wieder erreichbar.

## Was gebaut ist [B]
- `node build.mjs live` → Vorschau **`labor/live/`** (index, impressum, datenschutz; noindex; Adressen zeigen auf die Vorschau): https://kairaethel-eng.github.io/labor/live/
- `LIVE_ROOT=1 node build.mjs live` → Wurzel `/index.html`, `/impressum.html`, `/datenschutz.html` ohne noindex, Adressen auf https://hopphysio.de/ – **nur nach Go** (Regel: Wurzel nie ohne ausdrückliches Go).
- Beim Live-Build automatisch: Titel „Physiotherapie in Schorndorf · HOP – Home of Physiotherapy, Kai Raethel“ (seit 13.11.: deutsches Suchwort vorn), Beschreibung, Canonical, Favicon (SVG in der Datei), `apple-touch-icon.png` (180 px), Link-Vorschau (Open Graph, `og.jpg` 1200×630, 66 KB), strukturierte Praxisdaten (schema.org `Physiotherapy`: Name, Adresse, Telefon, E-Mail, Zeiten Mo–Fr 8:30–19:30), `theme-color`. Entfernt: „Testseite 4“, „Schematischer Grundriss …“, „· schematisch“, Labor-Hinweis, Artifact-Meta, CSS-Arbeitskommentare. Links Impressum/Datenschutz auf die Wurzel.
- Bilder liegen in `labor/assets/og.jpg` und `labor/assets/apple-touch-icon.png` (aus der Seite selbst mit deren Schriften erzeugt) und werden beim Build kopiert.
- Seit 14.11. spät (Auftrag Z) zusätzlich neben der Seite: `wirbelsaeule-echt.bin` (272 KB, echte Wirbelsäule; fehlt sie, zeigt die Seite die gerechnete) und `vorfall-1…5.webp` (Film-Standbilder ohne WebGL). Namensnennung BodyParts3D (CC BY 4.0) im Fuß und im Impressum § 9 (nur Live/Labor, nicht in der Übergangsseite).
- Keine externen Abrufe, keine Cookies, keine Drittskripte → Datenschutztext passt zu GitHub Pages; kein Cookie-Banner.
- Ausnahme seit 7.11.: Termin-Blatt lädt den Optica-Kalender (iframe, mit Google reCAPTCHA und Optica-Cookie) **erst nach Klick** auf „Kalender laden“ (Einwilligung, Datenschutz § 4) → weiterhin kein Cookie-Banner nötig [A, Fachperson prüft]. Vor dem Livegang: Online-Termine in Viva freigeschaltet? Die Übergangsseite (`start-ds`) baut § 4 heraus.

## Reihenfolge bis zum Livegang
1. **Kai prüft die Vorschau** (iPhone + PC): https://kairaethel-eng.github.io/labor/live/ – gesammelt melden, dann Go für Feinschliff.
2. **Rechtsangaben von Kai:** Behörde laut Erlaubnisurkunde, Berufshaftpflicht (Versicherer, Sitz), E-Mail-Anbieter Google Workspace und Anrufbeantworter Telekom SprachBox stehen seit 2.11. im Datenschutz (Wurzel am 7.11. neu gebaut) [B]. Fachperson liest gegen.
3. **Inhalte:** Leistungsliste (11), Räume ↔ Therapien, Porträt, Körperkarte/Einblicke aus V10 ja/nein, Hausordnung in der PC-Leiste ja/nein.
4. **Go Wurzel:** `LIVE_ROOT=1 node build.mjs live` → Commit mit den drei Wurzel-HTML-Dateien **und allen 13 Beidateien**, die der Build in die Wurzel kopiert: `og.jpg`, `apple-touch-icon.png`, `still-hero.webp`, `still-achse.webp`, `still-dach.webp` (seit 14.11. in Puls ungenutzt, Kap. 04 ohne WebGL – schadet nicht), `still-manu.webp`, `hop-physiotherapie.vcf`, **`wirbelsaeule-echt.bin`** (sonst nur die gerechnete Wirbelsäule), **`vorfall-1.webp` … `vorfall-5.webp`** (Film ohne WebGL) (ohne die Standbilder bleibt die Seite ohne WebGL/bei Software-Grafik leer, ohne die `.vcf` bricht „Praxis im Telefon speichern“; korrigiert 13.11., ergänzt 14.11. spät) auf `main`. Das Wurzel-Impressum bekommt damit auch die Namensnennung BodyParts3D (Ziel `live-imp`). Danach `node tools/sizes.cjs ../index.html` zur Kontrolle. Übergangsseite ist damit abgelöst.
5. **GitHub – Domain absichern (Kai klickt, ich diktiere)** [B, GitHub-Doku 2.11.2026]
   - github.com → Profilbild → **Settings** → **Pages** (Code, planning, and automation) → **Add a domain** → `hopphysio.de` → GitHub zeigt einen TXT-Eintrag `_github-pages-challenge-kairaethel-eng.hopphysio.de` mit Wert → diesen Eintrag in Wix anlegen (Schritt 6a) → zurück → **Verify**. Schützt vor Übernahme der Domain durch fremde GitHub-Seiten; TXT dauerhaft stehen lassen.
   - Repo `kairaethel-eng.github.io` → **Settings** → **Pages** → **Custom domain**: `hopphysio.de` → **Save**. GitHub legt dabei die Datei `CNAME` in der Wurzel von `main` an (Wurzel-Änderung, Teil des Go). Reihenfolge laut GitHub: erst hier eintragen, dann DNS umstellen.
6. **Wix – DNS umstellen (Kai klickt, ich diktiere)** – Pfad [A, bei der Umstellung per Screenshot prüfen]: Wix-Dashboard → **Domains** → hopphysio.de → **⋯ / Erweitert** → **DNS-Einträge bearbeiten**.
   - a) TXT: `_github-pages-challenge-kairaethel-eng` mit dem Wert aus Schritt 5 anlegen.
   - b) A-Einträge (Host leer bzw. `@`): die drei Wix-IPs löschen, dafür **185.199.108.153, 185.199.109.153, 185.199.110.153, 185.199.111.153** [B].
   - c) AAAA (Host `@`): **2606:50c0:8000::153, 2606:50c0:8001::153, 2606:50c0:8002::153, 2606:50c0:8003::153** [B].
   - d) CNAME `www`: Ziel von `cdn3.wixdns.net` auf **`kairaethel-eng.github.io`** (ohne Repo-Name) [B].
   - e) MX, SPF, google-site-verification **nicht anfassen** (E-Mail). Keine Wildcard-Einträge (`*`) anlegen [B].
   - Wix warnt vermutlich „Domain ist nicht mehr mit deiner Wix-Website verbunden“ – das ist gewollt [A].
7. **Warten und prüfen:** DNS bis zu 24 h, meist Minuten. Prüfung (Windows PowerShell, read-only):
   `Resolve-DnsName hopphysio.de -Type A -Server 1.1.1.1` → vier 185.199.x-Adressen; `Resolve-DnsName www.hopphysio.de -Server 1.1.1.1` → kairaethel-eng.github.io.
   Repo → Settings → Pages: „DNS check successful“ → Haken **Enforce HTTPS** (erscheint bis zu 24 h später) [B].
8. **Danach:** https://hopphysio.de/ und https://www.hopphysio.de/ auf iPhone/PC öffnen; Link-Vorschau testen (WhatsApp/iMessage-Link an sich selbst); Google-Unternehmensprofil weiter auf hopphysio.de (stimmt automatisch); Wix-Website nicht löschen, nur nicht mehr erreichbar; Wix-Premium/Domain/Google-Workspace-Rechnungen **vorerst unverändert** lassen (Domain und E-Mail hängen daran) [A, Kai prüft bei Wix, was wo abgerechnet wird].
9. Später: `labor/` unter hopphysio.de/labor/ ist weiter aufrufbar (alles noindex) – ok oder vor dem Livegang auf das Nötigste kürzen [O, Kai].

## Offen (Stand 2.11., nach Kais Antworten)
- Rechtlich: Behörde laut Erlaubnisurkunde, Berufshaftpflicht (Kai); Anwalt prüft am Ende. 2FA für GitHub und Wix noch nicht eingerichtet (Kai, vor dem Livegang empfohlen).
- Inhalt: Porträtfoto kommt „diese Tage“; Porträt und Einblicke im Haus unterbringen (Entwurf nötig); echter 3D-Scan später, Räume ↔ Therapien bis dahin Annahme. Leistungs-Motive prüfen (neu: Thermische Behandlung, Reizstrom). Flüssigkeit auf echten Handys.
- Später: Praxis-WhatsApp (Datenschutz ergänzen), Newsletter.
- Rechtstexte final (siehe Schritt 2). Newsletter/WhatsApp später mit Datenschutz-Ergänzung.
