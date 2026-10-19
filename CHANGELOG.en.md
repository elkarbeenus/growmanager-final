# Patch notes – growmanager

## v1.5.0
- **Other devices:** In Settings you can add exhaust fans, clip fans / circulation, grow controllers, dehumidifiers, humidifiers and other devices with model, power (watts), average run time per day (default 24 h, 8 h for dehumidifiers/humidifiers) and phase (veg, flower or both).
- **Devices per grow:** When creating/editing a grow and in the "Costs & yield" section you choose which devices are used.
- **Electricity costs extended:** The automatic calculation now covers the LED lamp and all selected devices, with a breakdown per device (power, run time, kWh, cost). Deleted devices are also removed from the grows.

## v1.4.0
- **New "Settings" tab:** electricity price in € per kWh, light hours per day (default 18 h veg / 12 h flower) and LED lamps with model and power (watts). Settings are part of the backup.
- **Lamp selection per grow:** choose the lamp and the number (1–4) when creating or editing a grow – and directly in the "Costs & yield" section.
- **Automatic electricity costs:** lamp power × light hours × days (veg/flower from the milestones) × electricity price. Shows the cost so far and – if a harvest date is set – until the planned harvest. Included in total cost, cost per plant/gram, overview and PDF; can be switched off per grow, with a warning against double entries.
- Guided tour extended by the "Settings" tab.

## v1.3.0
- **Automatic fertilizer costs:** in "Costs & yield" the fertilizer costs are calculated from the fertilizer usage (mixed nutrient solution) × price per liter, with a breakdown per product.
- **Average prices:** guideline prices in € per liter are stored for all products of the fertilizer schedules. Your own prices can be entered in the "Nutrients" tab and directly in the grow; they are part of the backup.
- The automatic costs feed into total cost, cost per plant and per gram, the overview and the PDF report. Can be switched off per grow, with a warning against double entries.

## v1.2.1
- **Quick rollback:** in the backup history you can go back to one of the last 2 backups (including the automatic safety backups "before import" etc.).
- **Confirmation with preview:** rolling back and restoring ask for confirmation and first show which grows/batches will be lost, come back or be reset to the backup's state.
- Build fix: GitHub workflow uses `tauri-action@v0`.

## v1.2.0
- **Import asks first:** the import at the top right asks before all current data is overwritten and shows the counts (current vs. file).
- **Safety backup:** before import, restore and reset a backup of your current data is created automatically.
- **Reset everything:** new section in the "About" tab. Deletes all grows, journal entries, costs and batches and restores the app to a fresh state. Confirmed by typing "RESET"; optionally also deletes all saved backups. Explained in the tour.
- Auto backups are only created when there is data to back up.

## v1.1.3
- **Export fix:** the Export button at the top right now uses "Save as …" and works in the desktop app / AppImage. The path is shown after saving.
- **Import summary:** after an import or restore a short pop-up shows what was added, changed or removed – or that your data stayed the same.

## v1.1.2
- **Dark dropdowns:** the white system lists were replaced by custom dark dropdowns that work the same on Windows and Linux (mouse and keyboard).

## v1.1.1
- **"Nutrients" tab:** doses are now shown in mL per 10 liters (English: mL per gallon), in the week cards and the schedule tables.

## v1.1.0
- **Guided tour** on first start (one-time, with "don't show again"), restartable via "?" or in the About tab.
- **Hint cards** (permanently dismissible) and quick-jump chips inside a grow.
- Number of plants can be set directly in the "Milestones" section.
- **Fertilizer usage by phase** (veg / flower) in the grow, in the "Nutrient mix" tab and in the PDF; batches are assigned to the grow automatically.
- The fertilizer selected in the "Nutrients" tab is used for the usage calculation.

## v1.0.9
- **PDF preview:** the report opens in a pop-up first and is saved from there.
- **Nutrient solution & fertilizer usage per grow:** mL used per product and liters of solution mixed; batches can be assigned to a grow and a schedule week.

## v1.0.8
- **PDF report per grow:** overview, milestones, drying/harvest, costs, journal with charts and full journal table.
- **Number of plants per grow (1–10):** start date and milestones apply to all plants of a grow.
- **Costs per grow** (nutrients, electricity, equipment, substrate, seeds/clones, other) with cost per plant and per gram.
- **New "Overview" tab:** costs, yield and comparison of all grows (year filter, PDF export).

## v1.0.7
- **Backup:** "Save as …" with a freely chosen path is kept; sending by email was removed.
- **Backup:** new overview "Where are my backups stored?"; export and "Save as …" show the storage location.
- **Version:** only a note at the bottom left; version switching removed.
- **Windows .exe** added (setup installer) next to the Linux AppImage.

## v1.0.6
- New "About" tab with app info, developer (Dominic Lesina) and patch notes.
- Version display (taken automatically from `package.json` at build time).
- Backup: "Save as …" with a freely chosen file path.
- Fix: grow cards show "T" instead of "d" for days in German.
- Tauri: external links open in the default browser; permissions for "Save as" and writing files.

## v1.0.5
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
