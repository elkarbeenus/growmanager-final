# Patchnotes – growmanager

## v0.5.1
- **11 dunkle Themes:** eigene Grow-Themes – **Nachtzelt** (Standard), **Grünlicht** (sehr gedämpft, für die Dunkelphase am Zelt), **Natriumdampf** (warmes HPS-Bernstein), **Blurple** und **OLED-Schwarz** – sowie die Klassiker **Catppuccin Mocha**, **Dracula**, **Tokyo Night**, **Nord**, **Gruvbox** und **Rosé Pine**.
- **Sofort wechseln, ohne Neustart:** unten in der Seitenleiste (im kleinen Fenster oben rechts) oder unter **Einstellungen → Erscheinungsbild** mit Vorschau-Karten. Das Theme wird pro Gerät gespeichert.
- **Neuer Update-Hinweis:** erscheint oben mittig wie eine Nachricht – kurz „tippt …“, dann eine Sprechblase mit den wichtigsten Neuerungen, „Alle Neuerungen ansehen“, Herunterladen / Später / Überspringen. Die App bleibt dabei bedienbar.
- **Fix:** Die Update-Prüfung hat ein falsches GitHub-Repo abgefragt und dadurch keine neuen Versionen gefunden.
- Einführungstour um einen Schritt zu Themes und Sprache ergänzt.

## v0.5.0
- **Komplett neues Design „Grow-Zelt bei Nacht“:** dunkle Pflaumentöne statt Blaugrau, Blattgrün für Aktionen, LED-Violett als Zweitfarbe und eine kräftigere Überschriften-Schrift (Inter Display, wird mitgeliefert – sieht auch offline gleich aus).
- **Seitenleiste:** Die Navigation sitzt links, gruppiert nach Garten (Grows, Übersicht, Nährlösung), Werkzeuge (Dünger, Shot Size, Steckling bestellen) und System (Backup, Einstellungen, Über). In kleinen Fenstern erscheint sie als Leiste oben.
- **Neue Grow-Karten:** große Tageszahl, Farbkante je Grow, Ernte in Gramm bei fertigen Grows und ein **Lichtspektrum-Streifen**, der pro erreichtem Meilenstein weiter leuchtet – auch in der Grow-Ansicht.
- **Einführungstour überarbeitet:** neuer Schritt zur Kopfzeile (Tour, Export, Import), Hinweise zur Seitenleiste und zum Spektrum-Streifen, Fortschrittspunkte; die Karte erscheint neben der Seitenleiste statt darüber.
- **Athena-Düngeschema:** In **Blüte 8 und 9 gibt es kein Bloom A/B mehr** – nur noch PK, Fade und Cleanse. Verbrauch, Kosten und PDF rechnen entsprechend.
- Sichtbarer Tastatur-Fokus überall, weniger Animation bei „Bewegung reduzieren“, Großbuchstaben-Beschriftungen durch ruhigere Labels ersetzt.
- **Neue Versionsnummerierung:** Ab jetzt 0.5.0, 0.5.1 … bis zur Version 1.0. Die früheren Entwicklungsstände stehen unten.

---

# Frühere Entwicklungsstände (vor dem Neustart der Nummerierung)

### v1.9.0
- **Update-Hinweis:** Beim Start prüft die App, ob es eine neue Version gibt, und zeigt sie mit den Patchnotes an (Später / Version überspringen / Zur Download-Seite). Ohne Internet passiert nichts.
- **Reiter „Über“:** Neben der Version steht, ob du die neueste Version hast. Im neuen Bereich „Updates“ lässt sich jederzeit prüfen und die automatische Prüfung beim Start abschalten.
- Die Versionsanzeige unten links zeigt kurz „aktuell ✓“ bzw. dauerhaft ein verfügbares Update.
- Neue Versionen erscheinen ab jetzt als Release auf GitHub (AppImage zum Herunterladen).

### v1.8.0
- Nährlösung: Verwendung wählbar – „Gebrauch“ (startet den Countdown) oder „Tränken“ (zählt nicht für den Countdown); auch nachträglich im Verlauf änderbar.
- Countdown je Grow: Ansätze, die einem Grow zugeordnet sind, haben einen eigenen Countdown – oben und im Reiter „Nährlösung“ wird jeder Grow getrennt erinnert.
- Ent-/Befeuchter: pro Grow Stunden pro Tag und Anzahl Wochen einstellbar – die Stromkosten rechnen nur diese Laufzeit.
- Bilder am Grow: Fotos hinzufügen, beschriften und groß ansehen; sie werden als Kopie in der App gespeichert und in Backup-Dateien mitgesichert.
- Neuer Reiter „Steckling bestellen“: Links zu Flowery Field und Growroom21 öffnen im Standardbrowser.
- Beim Schließen der App: Abfrage, ob ein Backup erstellt werden soll, wenn es Änderungen seit dem letzten Backup gibt.
- Layout wird gemerkt: Reiter, geöffneter Grow, eingeklappte Bereiche, Scroll-Position und Fenstergröße sind beim nächsten Start wieder da; „Aktiv“, „Geplant“ und „Bisherige Grows“ sind einklappbar.
- Flüssigeres Scrollen: teure Unschärfe-Effekte entfernt; neue Einstellung „Grafikbeschleunigung“ (Linux) mit automatischer Rückkehr in den sicheren Modus, falls das Fenster grau bleibt.
- Fix: Die Phase vor dem Blütebeginn wird als „Wachstum“ angezeigt (vorher fälschlich „Stretch“, sobald ein Stretch-Ende eingetragen war).
- Fix: Kalender über das Symbol links übernimmt das Datum zuverlässig (Popup liegt jetzt über allen Bereichen; Esc schließt nur den Kalender).
- Fix: Der bei „Speichern unter …“ gewählte Speicherort wird angezeigt, der nächste Dialog öffnet dort, und Backups lassen sich direkt in diesen Ordner speichern.

### v1.7.1
- **Dimm-Profil nach Phasen:** statt „Rampe“ gibt es jetzt **Wachstum**, **Stretch-Start** und **Blüte (nach dem Stretch)** (Standard 40 % / 60 % / 100 %). Die Helligkeit steigt vom Stretch-Start bis zum Ende des Stretch (Meilenstein „Ende Stretch“) auf den Blüte-Wert und bleibt dann dort.
- Ist im Grow kein „Ende Stretch“ gesetzt, gilt die Ersatzdauer der Lampe (Einstellungen, Standard 3 Wochen). Die Schieberegler im Grow zeigen das an.

### v1.7.0
- **Neues Standard-Dimmprofil:** Wachstum 40 %, Blüte 60 % → 100 % in den ersten 3 Wochen (je Lampe in den Einstellungen änderbar). Lampen ohne eigene Werte nutzen jetzt 40 % im Wachstum (vorher 60 %).
- **Schieberegler pro Grow:** Helligkeit in Wachstum, Blüte-Start, Blüte danach und Rampenlänge beim Anlegen/Bearbeiten eines Grows und im Bereich „Kosten & Ertrag“ einstellbar. „Auf Lampen-Vorgabe zurücksetzen“ nimmt die eigenen Werte wieder zurück.
- Die automatischen Stromkosten, die Übersicht und der PDF-Bericht nutzen das Profil des jeweiligen Grows.

### v1.6.1
- **Fix:** Die Datumsauswahl (Kalender-Symbol) übernimmt das gewählte Datum jetzt zuverlässig, auch in den Meilensteinen.
- **Fix:** Halb getippte Datumseingaben löschen das Datum nicht mehr; Esc schließt den Kalender.

### v1.6.0
- **Dimm-Profil für LED-Lampen:** Pro Lampe lassen sich die Helligkeit im Wachstum (Standard 60 %), zu Beginn der Blüte (Standard 60 %), nach der Rampe (Standard 100 %) und die Länge der Rampe in Wochen (Standard 3) einstellen. In der Blüte wird die Helligkeit linear vom Start- auf den Endwert gesteigert, danach bleibt sie beim Endwert. Wer nicht dimmt, setzt alle Werte auf 100 %.
- **Stromkosten tagesgenau:** Die Berechnung berücksichtigt die Helligkeit jedes Tages. In der Aufstellung steht je Lampe z. B. „18 h @ 60 % · 12 h @ 60→100 %“.

### v1.5.0
- **Weitere Geräte:** In den Einstellungen lassen sich Abluft, Clip-Fan/Umluft, Grow-Controller, Entfeuchter, Befeuchter und Sonstiges mit Modell, Leistung (Watt), durchschnittlicher Laufzeit pro Tag (Voreinstellung 24 h, bei Ent-/Befeuchter 8 h) und Phase (Wachstum, Blüte oder beides) anlegen.
- **Geräte im Grow:** Beim Anlegen/Bearbeiten und im Bereich „Kosten & Ertrag“ wählst du, welche Geräte genutzt werden.
- **Stromkosten erweitert:** Die automatische Berechnung umfasst LED-Lampe und alle gewählten Geräte, mit Aufstellung je Gerät (Leistung, Laufzeit, kWh, Kosten). Gelöschte Geräte werden auch aus den Grows entfernt.

### v1.4.0
- **Neuer Reiter „Einstellungen“:** Strompreis in € pro kWh, Lichtstunden pro Tag (Standard 18 h Wachstum / 12 h Blüte) und LED-Lampen mit Modell und Leistung (Watt) anlegen, bearbeiten und löschen. Die Einstellungen sind Teil des Backups.
- **Lampenauswahl im Grow:** Beim Anlegen oder Bearbeiten wählst du die genutzte Lampe und die Anzahl (1–4). Im Bereich „Kosten & Ertrag“ lässt sie sich auch direkt ändern.
- **Stromkosten automatisch:** Lampenleistung × Lichtstunden × Tage (Wachstum/Blüte aus den Meilensteinen) × Strompreis. Angezeigt werden die Kosten bis heute bzw. bis zur Ernte und – bei geplanter Ernte – bis zum Erntedatum. Sie fließen in Gesamtkosten, Kosten pro Pflanze/Gramm, Übersicht und PDF ein; pro Grow abschaltbar, mit Warnung vor doppelter Erfassung.
- Einführungstour um den Reiter „Einstellungen“ ergänzt.

### v1.3.0
- **Dünger-Kosten automatisch:** Im Bereich „Kosten & Ertrag“ eines Grows werden die Dünger-Kosten aus dem Dünger-Verbrauch (angemischte Nährlösung) × Preis pro Liter berechnet. Eine Aufstellung zeigt Verbrauch, Preis und Kosten je Produkt.
- **Durchschnittspreise:** Für alle Produkte der Düngeschemata sind Richtwerte in € pro Liter hinterlegt. Eigene Preise lassen sich im Reiter „Dünger“ („Preise für die Kostenrechnung“) und direkt im Grow („Preise anpassen“) eintragen. Sie sind Teil des Backups.
- Die automatischen Kosten fließen in Gesamtkosten, Kosten pro Pflanze und pro Gramm, die Übersicht und den PDF-Bericht ein. Pro Grow lässt sich „einrechnen“ abschalten; ein Hinweis warnt vor doppelter Erfassung mit manuellen Dünger-Einträgen.

### v1.2.1
- **Schnell zurückspringen:** Im „Backup-Verlauf“ lässt sich auf eines der letzten 2 Backups zurückspringen (inkl. der automatischen Sicherungs-Backups „vor Import“ usw.).
- **Bestätigung mit Vorschau:** Zurückspringen und Wiederherstellen fragen nach und zeigen vorher, welche Grows/Ansätze verloren gehen, zurückkommen oder auf den Stand des Backups geändert werden. Vorher wird automatisch ein Sicherungs-Backup angelegt.

### v1.2.0
- **Import mit Rückfrage:** Der Import oben rechts fragt jetzt nach, bevor alle aktuellen Daten überschrieben werden, und zeigt dabei die Anzahl aktuell vs. in der Datei.
- **Sicherheits-Backup:** Vor Import, Wiederherstellung und Zurücksetzen wird automatisch ein Backup deiner aktuellen Daten angelegt (Reiter „Backup“ → „Gespeicherte Backups“, markiert mit „vor Import“ usw.). Es ersetzt keine anderen Backups.
- **Alles zurücksetzen:** Neuer Bereich im Reiter „Über“. Löscht alle Grows, Tagebucheinträge, Kosten und Ansätze und stellt die App wie frisch installiert wieder her. Bestätigung durch Eintippen von „RESET“; optional lassen sich auch alle gespeicherten Backups löschen. In der Einführungstour erklärt.
- Auto-Backups werden nur noch angelegt, wenn es Daten zu sichern gibt.

### v1.1.3
- **Fix Export:** Der Export-Button oben rechts nutzt jetzt „Speichern unter …“ und funktioniert damit auch im AppImage bzw. in der Desktop-App. Nach dem Speichern wird der Pfad angezeigt.
- **Import-Zusammenfassung:** Nach Import (oben rechts oder im Backup-Reiter) und nach einer Wiederherstellung zeigt ein kurzes Pop-up, was neu hinzugefügt, geändert oder entfernt wurde – oder dass die Daten gleich geblieben sind. Dazu die aktuelle Anzahl von Grows, Tagebucheinträgen und Ansätzen.

### v1.1.2
- **Auswahlfelder dunkel:** Die bisherigen weißen Systemlisten (z. B. in „Nährlösung“, Kosten, Dünger-Verbrauch) wurden durch eigene dunkle Auswahlfelder ersetzt. Sie lassen sich mit Maus und Tastatur (Pfeiltasten, Enter, Esc) bedienen und sehen auf Windows und Linux gleich aus.
- Native Elemente (Scrollbalken, Eingabefelder) nutzen jetzt ebenfalls das dunkle Farbschema.

### v1.1.1
- **Reiter „Dünger“:** Dosierungen werden jetzt in **mL pro 10 Liter** angezeigt (Englisch: **mL pro Gallone**), in den Wochenkarten und in den Schema-Tabellen. Die Verbrauchsrechnung ist davon nicht betroffen.

### v1.1.0
- **Einführungstour:** Startet einmalig beim ersten Start und erklärt, wo du was findest (Reiter für Reiter). Mit „Beim nächsten Start nicht mehr anzeigen“; erneut startbar über das „?“ oben rechts oder im Reiter „Über“.
- **Hinweis-Karten:** Kleine Tipps im Grow und im Reiter „Nährlösung“, dauerhaft ausblendbar („Verstanden – nicht mehr anzeigen“). Im Reiter „Über“ wieder einblendbar.
- **Schnellsprung im Grow:** Chips springen direkt zu Meilensteine, Tagebuch, Trocknung, Dünger-Verbrauch, Kosten & Ertrag.
- **Pflanzenanzahl** lässt sich jetzt direkt im Bereich „Meilensteine“ ganz oben im Grow einstellen.
- **Dünger-Verbrauch nach Phase:** mL je Produkt getrennt nach Wachstum und Blüte (und Start/Flush). Der im Reiter „Dünger“ gewählte Dünger gilt als Standard; pro Grow lässt er sich überschreiben. Ansätze werden automatisch dem Grow zugeordnet, der an diesem Datum lief (manuell änderbar). Die Auswertung gibt es im Grow, im Reiter „Nährlösung“ (alle Grows) und im PDF-Bericht.

### v1.0.9
- **PDF-Vorschau:** Der Bericht öffnet zuerst in einem Pop-up-Fenster (mit Zoom). Gespeichert wird erst per „Speichern unter …“ aus der Vorschau.
- **Dünger-Verbrauch pro Grow:** Dünger/Schema im Grow wählen – daraus werden die verbrauchten mL je Produkt, die angemischten Liter Nährlösung, der Verbrauch pro Pflanze und die Nährlösung pro Pflanze berechnet.
- **Nährlösung:** Ansätze lassen sich einem Grow zuordnen (beim Eintragen oder nachträglich) und optional einer Schema-Woche (automatisch aus den Meilensteinen oder manuell).
- Der Verbrauch ist auch im PDF-Bericht enthalten. Backups enthalten die Zuordnungen.

### v1.0.8
- **PDF-Bericht pro Grow:** Überblick, Meilensteine, Trocknung/Ernte, Kosten (mit Kategorien), Tagebuch-Auswertung mit Diagrammen (pH, EC, Temperatur, Luftfeuchtigkeit) und vollständige Tagebuchtabelle. Speichern über „Speichern unter …“.
- **Anzahl Pflanzen pro Grow (1–10):** Startdatum und Meilensteine bleiben für alle Pflanzen eines Grows gleich.
- **Kosten pro Grow:** Kategorien Dünger, Strom, Equipment, Substrat, Samen/Stecklinge, Sonstiges. Kennzahlen: Gesamtkosten, Kosten pro Pflanze, Ertrag pro Pflanze, Kosten pro Gramm.
- **Neuer Reiter „Übersicht“:** Vergleich aller Grows (Pflanzen, Dauer, Ertrag, Kosten, € pro Gramm), Jahresfilter, Diagramme und PDF-Export.
- Backups, Import und Wiederherstellung enthalten die neuen Felder (Pflanzenanzahl, Kosten). Ältere Backups bleiben kompatibel.
- Neue Abhängigkeit: `pdf-lib`.

### v1.0.7 (final)
- **Backup:** „Speichern unter …“ mit frei wählbarem Pfad bleibt erhalten. Der Versand per E-Mail wurde wieder entfernt.
- **Backup:** Neue Übersicht „Wo werden meine Backups gespeichert?“ (Auto-/manuelle Backups, Export als Datei, gewählter Backup-Ordner).
- **Export:** Nach dem Export bzw. „Speichern unter …“ wird der Speicherort angezeigt (in der Desktop-App der vollständige Pfad).
- **Windows:** Der GitHub-Workflow baut jetzt zusätzlich zum Linux-AppImage eine Windows-Version (Setup-`.exe`, NSIS). Dafür wurde ein Windows-Icon (`icon.ico`) ergänzt.
- **Version:** Die Versionsnummer wird nur noch als Hinweis unten links angezeigt. Der Versionswechsel wurde entfernt.
- Version angehoben auf 1.0.7 (package.json, package-lock.json, tauri.conf.json, Cargo.toml, GitHub-Workflow).

### v1.0.6
- Neuer Reiter „Über“ mit Infos zur App und zum Entwickler (Dominic Lesina) und Patchnotes.
- Versionsanzeige (Version wird beim Build aus package.json übernommen).
- Backup: „Speichern unter …“ mit frei wählbarem Dateipfad.
- Fix: Auf den Grow-Karten wird im Deutschen „T“ statt „d“ für Tage angezeigt.
- Tauri: Externe Links öffnen im Standardbrowser, Freigaben für „Speichern unter“ und Datei schreiben.

### v1.0.5
- Neuer Reiter „Shot Size“: Crop-Steering-Shotgröße (vegetativ 4–6 %, generativ 2–4 %) in % und mL, Eingabe in Litern (EN: Gallonen), Regler zum Anpassen.
- Grows-Reiter gegliedert in Aktiv, Geplant und Bisherige Grows (nach Jahren); neuer Zähler „Ausstehend“.
- Karten geplanter Grows zeigen „Start in X T“.
- Fix: Grows mit Startdatum in der Zukunft wurden fälschlich als „Wachstum“ angezeigt.
- Name `growmanager`, Version 1.0.5.

## Frühere Versionen (bis 1.0.4)
- Grows mit Meilensteinen, Phasen, Timeline und Tagebuch (pH, EC, Temperatur, Luftfeuchtigkeit, Gießmenge).
- Reiter „Nährlösung“ mit Ansätzen und Erneuerungs-Erinnerung.
- Reiter „Dünger“ mit Athena-Schemata.
- Trocknung und Erntemenge.
- Backup: JSON-Export/-Import, tägliche Auto-Backups (bis 14 Tage), Backup-Verlauf, Backup-Ordner.
- Deutsch/Englisch inkl. Gallonen-Umrechnung.
- Tauri-Build (AppImage) per GitHub-Workflow.
