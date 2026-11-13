# Patch notes – growmanager

## v0.5.0
- **All-new “grow tent at night” design:** dark plum tones instead of blue-grey, leaf green for actions, LED violet as second colour and a bolder heading font (Inter Display, bundled – looks the same offline).
- **Sidebar:** navigation sits on the left, grouped into Garden (Grows, Overview, Nutrient mix), Tools (Nutrients, Shot size, Order clones) and System (Backup, Settings, About). In small windows it appears as a bar at the top.
- **New grow cards:** large day count, colour edge per grow, harvest in grams for finished grows and a **light-spectrum strip** that lights up further with every milestone reached – also in the grow view.
- **Guided tour reworked:** new step for the header (Tour, Export, Import), notes on the sidebar and the spectrum strip, progress dots; the card appears next to the sidebar instead of on top of it.
- **Athena feed schedule:** **no more Bloom A/B in flower weeks 8 and 9** – only PK, Fade and Cleanse. Usage, costs and PDF are calculated accordingly.
- Visible keyboard focus everywhere, less motion with “reduce motion”, all-caps labels replaced with calmer ones.
- **New version numbering:** from now on 0.5.0, 0.5.1 … up to version 1.0. Earlier development builds are listed below.

---

# Earlier development builds (before the numbering restart)

### v1.9.0
- **Update notice:** on start the app checks whether a new version is available and shows it with the patch notes (Later / Skip this version / Go to download page). Without internet nothing happens.
- **“About” tab:** next to the version it shows whether you have the latest version. In the new “Updates” section you can check at any time and turn off the automatic check on start.
- The version badge at the bottom left briefly shows “up to date ✓” or, if available, the new update.
- New versions are now published as a release on GitHub (AppImage to download).

### v1.8.0
- Nutrient solution: choose the purpose – “Use” (starts the countdown) or “Soaking” (does not count for the countdown); can also be changed later in the history.
- Countdown per grow: batches assigned to a grow have their own countdown – each grow is reminded separately at the top and in the “Nutrient mix” tab.
- Dehumidifier/humidifier: hours per day and number of weeks can be set per grow – electricity costs only count this run time.
- Photos on a grow: add, caption and view photos; they are stored as a copy in the app and included in backup files.
- New “Order clones” tab: links to Flowery Field and Growroom21 open in the default browser.
- When closing the app: asks whether to create a backup if there are changes since the last backup.
- Layout is remembered: tab, open grow, collapsed sections, scroll position and window size are restored on the next start; “Active”, “Planned” and “Past grows” can be collapsed.
- Smoother scrolling: expensive blur effects removed; new “Hardware acceleration” setting (Linux) that switches back to safe mode automatically if the window stays grey.
- Fix: the phase before flower start is shown as “Veg” (before it was wrongly “Stretch” as soon as an end of stretch was set).
- Fix: the calendar opened via the icon on the left reliably accepts the date (popup now lies above all sections; Esc only closes the calendar).
- Fix: the location chosen with “Save as …” is shown, the next dialog opens there, and backups can be saved straight to that folder.

### v1.7.1
- **Dimming profile by phase:** instead of “ramp” there is now **veg**, **stretch start** and **flower (after the stretch)** (default 40 % / 60 % / 100 %). Brightness rises from stretch start to the end of the stretch (milestone “End of stretch”) up to the flower value and then stays there.
- If the grow has no “End of stretch”, the lamp’s fallback duration is used (Settings, default 3 weeks). The sliders in the grow explain this.

### v1.7.0
- **New default dimming profile:** veg 40 %, flower 60 % → 100 % over the first 3 weeks (adjustable per lamp in Settings). Lamps without custom values now use 40 % in veg (before: 60 %).
- **Sliders per grow:** brightness in veg, flower start, flower after and ramp length can be set when creating/editing a grow and in the “Costs & yield” section. “Reset to lamp default” removes the custom values.
- Automatic electricity costs, the overview and the PDF report use the profile of the respective grow.

### v1.6.1
- **Fix:** the date picker (calendar icon) now reliably accepts the selected date, including in the milestones.
- **Fix:** partially typed dates no longer clear the date; Esc closes the calendar.

### v1.6.0
- **Dimming profile for LED lamps:** per lamp you can set the brightness in veg (default 60 %), at the start of flower (default 60 %), after the ramp (default 100 %) and the ramp length in weeks (default 3). In flower the brightness is increased linearly from the start to the end value and then stays there. If you do not dim, set all values to 100 %.
- **Electricity costs day by day:** the calculation takes the brightness of every day into account. The breakdown shows e.g. "18 h @ 60 % · 12 h @ 60→100 %" per lamp.

### v1.5.0
- **Other devices:** In Settings you can add exhaust fans, clip fans / circulation, grow controllers, dehumidifiers, humidifiers and other devices with model, power (watts), average run time per day (default 24 h, 8 h for dehumidifiers/humidifiers) and phase (veg, flower or both).
- **Devices per grow:** When creating/editing a grow and in the "Costs & yield" section you choose which devices are used.
- **Electricity costs extended:** The automatic calculation now covers the LED lamp and all selected devices, with a breakdown per device (power, run time, kWh, cost). Deleted devices are also removed from the grows.

### v1.4.0
- **New "Settings" tab:** electricity price in € per kWh, light hours per day (default 18 h veg / 12 h flower) and LED lamps with model and power (watts). Settings are part of the backup.
- **Lamp selection per grow:** choose the lamp and the number (1–4) when creating or editing a grow – and directly in the "Costs & yield" section.
- **Automatic electricity costs:** lamp power × light hours × days (veg/flower from the milestones) × electricity price. Shows the cost so far and – if a harvest date is set – until the planned harvest. Included in total cost, cost per plant/gram, overview and PDF; can be switched off per grow, with a warning against double entries.
- Guided tour extended by the "Settings" tab.

### v1.3.0
- **Automatic fertilizer costs:** in "Costs & yield" the fertilizer costs are calculated from the fertilizer usage (mixed nutrient solution) × price per liter, with a breakdown per product.
- **Average prices:** guideline prices in € per liter are stored for all products of the fertilizer schedules. Your own prices can be entered in the "Nutrients" tab and directly in the grow; they are part of the backup.
- The automatic costs feed into total cost, cost per plant and per gram, the overview and the PDF report. Can be switched off per grow, with a warning against double entries.

### v1.2.1
- **Quick rollback:** in the backup history you can go back to one of the last 2 backups (including the automatic safety backups "before import" etc.).
- **Confirmation with preview:** rolling back and restoring ask for confirmation and first show which grows/batches will be lost, come back or be reset to the backup's state.
- Build fix: GitHub workflow uses `tauri-action@v0`.

### v1.2.0
- **Import asks first:** the import at the top right asks before all current data is overwritten and shows the counts (current vs. file).
- **Safety backup:** before import, restore and reset a backup of your current data is created automatically.
- **Reset everything:** new section in the "About" tab. Deletes all grows, journal entries, costs and batches and restores the app to a fresh state. Confirmed by typing "RESET"; optionally also deletes all saved backups. Explained in the tour.
- Auto backups are only created when there is data to back up.

### v1.1.3
- **Export fix:** the Export button at the top right now uses "Save as …" and works in the desktop app / AppImage. The path is shown after saving.
- **Import summary:** after an import or restore a short pop-up shows what was added, changed or removed – or that your data stayed the same.

### v1.1.2
- **Dark dropdowns:** the white system lists were replaced by custom dark dropdowns that work the same on Windows and Linux (mouse and keyboard).

### v1.1.1
- **"Nutrients" tab:** doses are now shown in mL per 10 liters (English: mL per gallon), in the week cards and the schedule tables.

### v1.1.0
- **Guided tour** on first start (one-time, with "don't show again"), restartable via "?" or in the About tab.
- **Hint cards** (permanently dismissible) and quick-jump chips inside a grow.
- Number of plants can be set directly in the "Milestones" section.
- **Fertilizer usage by phase** (veg / flower) in the grow, in the "Nutrient mix" tab and in the PDF; batches are assigned to the grow automatically.
- The fertilizer selected in the "Nutrients" tab is used for the usage calculation.

### v1.0.9
- **PDF preview:** the report opens in a pop-up first and is saved from there.
- **Nutrient solution & fertilizer usage per grow:** mL used per product and liters of solution mixed; batches can be assigned to a grow and a schedule week.

### v1.0.8
- **PDF report per grow:** overview, milestones, drying/harvest, costs, journal with charts and full journal table.
- **Number of plants per grow (1–10):** start date and milestones apply to all plants of a grow.
- **Costs per grow** (nutrients, electricity, equipment, substrate, seeds/clones, other) with cost per plant and per gram.
- **New "Overview" tab:** costs, yield and comparison of all grows (year filter, PDF export).

### v1.0.7
- **Backup:** "Save as …" with a freely chosen path is kept; sending by email was removed.
- **Backup:** new overview "Where are my backups stored?"; export and "Save as …" show the storage location.
- **Version:** only a note at the bottom left; version switching removed.
- **Windows .exe** added (setup installer) next to the Linux AppImage.

### v1.0.6
- New "About" tab with app info, developer (Dominic Lesina) and patch notes.
- Version display (taken automatically from `package.json` at build time).
- Backup: "Save as …" with a freely chosen file path.
- Fix: grow cards show "T" instead of "d" for days in German.
- Tauri: external links open in the default browser; permissions for "Save as" and writing files.

### v1.0.5
- **New "Shot size" tab:** crop steering calculator – shot size for vegetative (4–6 %) and generative (2–4 %) in % and mL. Input in liters (EN: gallons), slider to adjust, inputs are kept when switching tabs.
- **Grows tab restructured:** Active, Planned and Past grows by year, plus the new "Pending" counter. Cards of planned grows show "Starts in X d".
- Fix: grows with a start date in the future were wrongly shown as "Veg".
- Name `growmanager`, version 1.0.5.

## Earlier versions (up to 1.0.4, derived from the code)
- Grows with milestones, phases, timeline and journal (pH, EC, temperature, humidity, watering amount).
- "Nutrient mix" tab with batches and renewal reminder, "Nutrients" tab with Athena schedules.
- Drying and harvest amount.
- Backup: JSON export and import, daily auto backups (up to 14 days), backup history, backup folder.
- German/English with gallon conversion.
- Tauri build (AppImage) via GitHub workflow.
