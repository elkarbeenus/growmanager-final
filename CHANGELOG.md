# Patchnotes – growmanager

## v1.3.0
- **Dünger-Kosten automatisch:** Im Bereich „Kosten & Ertrag“ eines Grows werden die Dünger-Kosten aus dem Dünger-Verbrauch (angemischte Nährlösung) × Preis pro Liter berechnet. Eine Aufstellung zeigt Verbrauch, Preis und Kosten je Produkt.
- **Durchschnittspreise:** Für alle Produkte der Düngeschemata sind Richtwerte in € pro Liter hinterlegt. Eigene Preise lassen sich im Reiter „Dünger“ („Preise für die Kostenrechnung“) und direkt im Grow („Preise anpassen“) eintragen. Sie sind Teil des Backups.
- Die automatischen Kosten fließen in Gesamtkosten, Kosten pro Pflanze und pro Gramm, die Übersicht und den PDF-Bericht ein. Pro Grow lässt sich „einrechnen“ abschalten; ein Hinweis warnt vor doppelter Erfassung mit manuellen Dünger-Einträgen.

## v1.2.1
- **Schnell zurückspringen:** Im „Backup-Verlauf“ lässt sich auf eines der letzten 2 Backups zurückspringen (inkl. der automatischen Sicherungs-Backups „vor Import“ usw.).
- **Bestätigung mit Vorschau:** Zurückspringen und Wiederherstellen fragen nach und zeigen vorher, welche Grows/Ansätze verloren gehen, zurückkommen oder auf den Stand des Backups geändert werden. Vorher wird automatisch ein Sicherungs-Backup angelegt.

## v1.2.0
- **Import mit Rückfrage:** Der Import oben rechts fragt jetzt nach, bevor alle aktuellen Daten überschrieben werden, und zeigt dabei die Anzahl aktuell vs. in der Datei.
- **Sicherheits-Backup:** Vor Import, Wiederherstellung und Zurücksetzen wird automatisch ein Backup deiner aktuellen Daten angelegt (Reiter „Backup“ → „Gespeicherte Backups“, markiert mit „vor Import“ usw.). Es ersetzt keine anderen Backups.
- **Alles zurücksetzen:** Neuer Bereich im Reiter „Über“. Löscht alle Grows, Tagebucheinträge, Kosten und Ansätze und stellt die App wie frisch installiert wieder her. Bestätigung durch Eintippen von „RESET“; optional lassen sich auch alle gespeicherten Backups löschen. In der Einführungstour erklärt.
- Auto-Backups werden nur noch angelegt, wenn es Daten zu sichern gibt.

## v1.1.3
- **Fix Export:** Der Export-Button oben rechts nutzt jetzt „Speichern unter …“ und funktioniert damit auch im AppImage bzw. in der Desktop-App. Nach dem Speichern wird der Pfad angezeigt.
- **Import-Zusammenfassung:** Nach Import (oben rechts oder im Backup-Reiter) und nach einer Wiederherstellung zeigt ein kurzes Pop-up, was neu hinzugefügt, geändert oder entfernt wurde – oder dass die Daten gleich geblieben sind. Dazu die aktuelle Anzahl von Grows, Tagebucheinträgen und Ansätzen.

## v1.1.2
- **Auswahlfelder dunkel:** Die bisherigen weißen Systemlisten (z. B. in „Nährlösung“, Kosten, Dünger-Verbrauch) wurden durch eigene dunkle Auswahlfelder ersetzt. Sie lassen sich mit Maus und Tastatur (Pfeiltasten, Enter, Esc) bedienen und sehen auf Windows und Linux gleich aus.
- Native Elemente (Scrollbalken, Eingabefelder) nutzen jetzt ebenfalls das dunkle Farbschema.

## v1.1.1
- **Reiter „Dünger“:** Dosierungen werden jetzt in **mL pro 10 Liter** angezeigt (Englisch: **mL pro Gallone**), in den Wochenkarten und in den Schema-Tabellen. Die Verbrauchsrechnung ist davon nicht betroffen.

## v1.1.0
- **Einführungstour:** Startet einmalig beim ersten Start und erklärt, wo du was findest (Reiter für Reiter). Mit „Beim nächsten Start nicht mehr anzeigen“; erneut startbar über das „?“ oben rechts oder im Reiter „Über“.
- **Hinweis-Karten:** Kleine Tipps im Grow und im Reiter „Nährlösung“, dauerhaft ausblendbar („Verstanden – nicht mehr anzeigen“). Im Reiter „Über“ wieder einblendbar.
- **Schnellsprung im Grow:** Chips springen direkt zu Meilensteine, Tagebuch, Trocknung, Dünger-Verbrauch, Kosten & Ertrag.
- **Pflanzenanzahl** lässt sich jetzt direkt im Bereich „Meilensteine“ ganz oben im Grow einstellen.
- **Dünger-Verbrauch nach Phase:** mL je Produkt getrennt nach Wachstum und Blüte (und Start/Flush). Der im Reiter „Dünger“ gewählte Dünger gilt als Standard; pro Grow lässt er sich überschreiben. Ansätze werden automatisch dem Grow zugeordnet, der an diesem Datum lief (manuell änderbar). Die Auswertung gibt es im Grow, im Reiter „Nährlösung“ (alle Grows) und im PDF-Bericht.

## v1.0.9
- **PDF-Vorschau:** Der Bericht öffnet zuerst in einem Pop-up-Fenster (mit Zoom). Gespeichert wird erst per „Speichern unter …“ aus der Vorschau.
- **Dünger-Verbrauch pro Grow:** Dünger/Schema im Grow wählen – daraus werden die verbrauchten mL je Produkt, die angemischten Liter Nährlösung, der Verbrauch pro Pflanze und die Nährlösung pro Pflanze berechnet.
- **Nährlösung:** Ansätze lassen sich einem Grow zuordnen (beim Eintragen oder nachträglich) und optional einer Schema-Woche (automatisch aus den Meilensteinen oder manuell).
- Der Verbrauch ist auch im PDF-Bericht enthalten. Backups enthalten die Zuordnungen.

## v1.0.8
- **PDF-Bericht pro Grow:** Überblick, Meilensteine, Trocknung/Ernte, Kosten (mit Kategorien), Tagebuch-Auswertung mit Diagrammen (pH, EC, Temperatur, Luftfeuchtigkeit) und vollständige Tagebuchtabelle. Speichern über „Speichern unter …“.
- **Anzahl Pflanzen pro Grow (1–10):** Startdatum und Meilensteine bleiben für alle Pflanzen eines Grows gleich.
- **Kosten pro Grow:** Kategorien Dünger, Strom, Equipment, Substrat, Samen/Stecklinge, Sonstiges. Kennzahlen: Gesamtkosten, Kosten pro Pflanze, Ertrag pro Pflanze, Kosten pro Gramm.
- **Neuer Reiter „Übersicht“:** Vergleich aller Grows (Pflanzen, Dauer, Ertrag, Kosten, € pro Gramm), Jahresfilter, Diagramme und PDF-Export.
- Backups, Import und Wiederherstellung enthalten die neuen Felder (Pflanzenanzahl, Kosten). Ältere Backups bleiben kompatibel.
- Neue Abhängigkeit: `pdf-lib`.

## v1.0.7 (final)
- **Backup:** „Speichern unter …“ mit frei wählbarem Pfad bleibt erhalten. Der Versand per E-Mail wurde wieder entfernt.
- **Backup:** Neue Übersicht „Wo werden meine Backups gespeichert?“ (Auto-/manuelle Backups, Export als Datei, gewählter Backup-Ordner).
- **Export:** Nach dem Export bzw. „Speichern unter …“ wird der Speicherort angezeigt (in der Desktop-App der vollständige Pfad).
- **Windows:** Der GitHub-Workflow baut jetzt zusätzlich zum Linux-AppImage eine Windows-Version (Setup-`.exe`, NSIS). Dafür wurde ein Windows-Icon (`icon.ico`) ergänzt.
- **Version:** Die Versionsnummer wird nur noch als Hinweis unten links angezeigt. Der Versionswechsel wurde entfernt.
- Version angehoben auf 1.0.7 (package.json, package-lock.json, tauri.conf.json, Cargo.toml, GitHub-Workflow).

## v1.0.6
- Neuer Reiter „Über“ mit Infos zur App und zum Entwickler (Dominic Lesina) und Patchnotes.
- Versionsanzeige (Version wird beim Build aus package.json übernommen).
- Backup: „Speichern unter …“ mit frei wählbarem Dateipfad.
- Fix: Auf den Grow-Karten wird im Deutschen „T“ statt „d“ für Tage angezeigt.
- Tauri: Externe Links öffnen im Standardbrowser, Freigaben für „Speichern unter“ und Datei schreiben.

## v1.0.5
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
