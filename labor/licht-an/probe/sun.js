// Sonnenstand ohne Netzabruf (Lichtprobe „Licht malt den Raum“).
// Kompakte Formel nach dem Astronomical Almanac („low precision“, Fehler < 0,01° bis 2050 für die Sonnenlänge):
// mittlere Länge/Anomalie → ekliptikale Länge → Rektaszension/Deklination → Stundenwinkel → Höhe und Azimut.
// Ohne Refraktion (am Horizont ~0,5°) – für die Lichtstimmung unerheblich. Geprüft gegen die Python-Bibliothek
// „astral“ (NOAA-Verfahren), siehe Bericht.
export const ORT = { lat: 48.805, lon: 9.527, name: 'Schorndorf' };

/** Sonnenhöhe und Azimut in Grad (Azimut: Nord = 0, Ost = 90, Süd = 180, West = 270) für einen Zeitpunkt (Date, UTC). */
export function sunPos(date, lat = ORT.lat, lon = ORT.lon) {
  const rad = Math.PI / 180;
  const d = date.getTime() / 86400000 + 2440587.5 - 2451545.0;      // Tage seit J2000.0
  const g = (357.529 + 0.98560028 * d) * rad;                        // mittlere Anomalie
  const q = 280.459 + 0.98564736 * d;                                // mittlere Länge
  const L = (q + 1.915 * Math.sin(g) + 0.020 * Math.sin(2 * g)) * rad; // ekliptikale Länge
  const e = (23.439 - 0.00000036 * d) * rad;                         // Schiefe der Ekliptik
  const ra = Math.atan2(Math.cos(e) * Math.sin(L), Math.cos(L));
  const dec = Math.asin(Math.sin(e) * Math.sin(L));
  const gmst = 18.697374558 + 24.06570982441908 * d;                 // Sternzeit Greenwich in Stunden
  const ha = (gmst * 15 + lon) * rad - ra;                           // Stundenwinkel
  const la = lat * rad;
  const el = Math.asin(Math.sin(la) * Math.sin(dec) + Math.cos(la) * Math.cos(dec) * Math.cos(ha));
  const az = Math.atan2(-Math.sin(ha), Math.tan(dec) * Math.cos(la) - Math.sin(la) * Math.cos(ha));
  return { az: ((az / rad) % 360 + 360) % 360, el: el / rad };
}
