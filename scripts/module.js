// --- 1. ORDNER AUTOMATISCH ERSTELLEN ---
Hooks.once('ready', async () => {
    if (!game.user.isGM) return;
    const folderName = "Dialog-Nsc";
    let folder = game.folders.find(f => f.name === folderName && f.type === "Actor");
    if (!folder) {
        await Folder.create({ name: folderName, type: "Actor", parent: null });
        ui.notifications.info(`Ordner '${folderName}' wurde für das KI-Modul erstellt.`);
    }
});

// --- 2. DEN REITER IM NSC-SHEET EINFÜGEN ---
// Wir nutzen 'renderActorSheet', um den Tab in das HTML zu injizieren
Hooks.on('renderActorSheet', (app, html, data) => {
    // Sicherheit: Nur bei NPCs einfügen
    if (app.actor.type !== 'npc') return;

    // Den Tab-Header (Reiter oben) finden und unseren hinzufügen
    const tabs = html.find('.sheet-tabs.tabs'); // Standard dnd5e Selektor
    const tabItem = `<a class="item" data-tab="gemini">Gemini KI</a>`;
    
    // Falls der Reiter noch nicht existiert, hinzufügen
    if (html.find('[data-tab="gemini"]').length === 0) {
        tabs.append(tabItem);
    }

    // Den Inhalt des Tabs (Textarea) vorbereiten
    const conditions = app.actor.getFlag('nsc-dialogue-generator-ki', 'conditions') || '';
    const tabBody = `
        <div class="tab gemini" data-group="primary" data-tab="gemini">
            <div class="form-group stacked">
                <label style="font-weight: bold;">NSC-Persönlichkeit & Dialog-Bedingungen</label>
                <textarea name="flags.nsc-dialogue-generator-ki.conditions" 
                          style="min-height: 200px; width: 100%; font-family: 'Signika', sans-serif;"
                          placeholder="Beschreibe hier Charakterzüge, Wissen oder Geheimnisse des NSCs...">${conditions}</textarea>
                <p class="notes">Diese Informationen nutzt die KI exklusiv für diesen Charakter.</p>
            </div>
        </div>`;

    // Den Inhalt in den Body des Sheets einfügen
    html.find('.sheet-body').append(tabBody);
});

// --- 3. TOOLBAR BUTTON (GEHIRN-ICON) ---
Hooks.on('getSceneControlButtons', (controls) => {
    if (!game.user.isGM) return;
    const notes = controls.find(c => c.name === "notes");
    if (notes) {
        notes.tools.push({
            name: "gemini-dialog",
            title: "KI Dialog starten",
            icon: "fas fa-brain",
            onClick: () => new GeminiStarterApp().render(true),
            button: true
        });
    }
});

// Die Klassen für StarterApp und DialogApp müssen hiernach folgen (wie zuvor)...