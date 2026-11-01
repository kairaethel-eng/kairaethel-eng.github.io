// Übergangsseite (Startadresse): ohne Animation, nur Jahreszahl aktuell halten
const y = document.getElementById('year'); if (y) y.textContent = String(new Date().getFullYear());
