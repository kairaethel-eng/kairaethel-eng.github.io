# Livegang Puls · Scan auf hopphysio.de (GitHub Pages + eigene Domain)

Entscheidung Kai 2.11.2026. Stand: Vorbereitung fertig, Livegang wartet auf Kais Go.
Markierung: **[B]** selbst geprüft · **[A]** abgeleitet · **[O]** offen.

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
- Beim Live-Build automatisch: Titel „HOP – Home of Physiotherapy · Kai Raethel, Schorndorf“, Beschreibung, Canonical, Favicon (SVG in der Datei), `apple-touch-icon.png` (180 px), Link-Vorschau (Open Graph, `og.jpg` 1200×630, 66 KB), strukturierte Praxisdaten (schema.org `Physiotherapy`: Name, Adresse, Telefon, E-Mail, Zeiten Mo–Fr 8:30–19:30), `theme-color`. Entfernt: „Testseite 4“, „Schematischer Grundriss …“, „· schematisch“, Labor-Hinweis, Artifact-Meta, CSS-Arbeitskommentare. Links Impressum/Datenschutz auf die Wurzel.
- Bilder liegen in `labor/assets/og.jpg` und `labor/assets/apple-touch-icon.png` (aus der Seite selbst mit deren Schriften erzeugt) und werden beim Build kopiert.
- Keine externen Abrufe, keine Cookies, keine Drittskripte → Datenschutztext passt zu GitHub Pages; kein Cookie-Banner.

## Reihenfolge bis zum Livegang
1. **Kai prüft die Vorschau** (iPhone + PC): https://kairaethel-eng.github.io/labor/live/ – gesammelt melden, dann Go für Feinschliff.
2. **Rechtsangaben von Kai:** Behörde laut Erlaubnisurkunde, Berufshaftpflicht (Versicherer, Sitz), E-Mail-Anbieter = Google Workspace (laut MX) → Datenschutz „E-Mail über Google Workspace (Google Ireland Ltd.)“ ergänzen [A], Anrufbeantworter-Anbieter [O]. Fachperson liest gegen.
3. **Inhalte:** Leistungsliste (11), Räume ↔ Therapien, Porträt, Körperkarte/Einblicke aus V10 ja/nein, Hausordnung in der PC-Leiste ja/nein.
4. **Go Wurzel:** `LIVE_ROOT=1 node build.mjs live` → Commit mit Wurzeldateien + `og.jpg`, `apple-touch-icon.png` auf `main`. Übergangsseite ist damit abgelöst.
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

## Offen
- Hausordnung in der PC-Kapitelleiste (Kai). Porträtfoto. Echter Grundriss. Leistungs-Motive prüfen. Flüssigkeit auf echten Handys.
- Rechtstexte final (siehe Schritt 2). Newsletter/WhatsApp später mit Datenschutz-Ergänzung.
