// --- 1. ORDNER AUTOMATISCH ERSTELLEN ---
Hooks.once('ready', async () => {
    if (!game.user.isGM) return;
    const folderName = "Dialog-Nsc";
    let folder = game.folders.find(f => f.name === folderName && f.type === "Actor");
    if (!folder) {
        await Folder.create({ name: folderName, type: "Actor", parent: null });
        console.log("NSC Dialogue Generator | Ordner erstellt.");
    }
});

// --- 2. DEN REITER IM NSC-SHEET EINFÜGEN ---
Hooks.on('renderActorSheet', (app, html, data) => {
    if (app.actor.type !== 'npc') return;

    // Wir suchen den Navigations-Bereich für die Tabs
    const tabs = html.find('nav.sheet-tabs, nav.tabs');
    if (tabs.length > 0 && !html.find('.item[data-tab="gemini"]').length) {
        tabs.append('<a class="item" data-tab="gemini"><i class="fas fa-brain"></i> Gemini KI</a>');
    }

    // Wir suchen den Bereich, in dem der Inhalt der Tabs liegt
    const body = html.find('section.sheet-body, .sheet-content');
    const conditions = app.actor.getFlag('nsc-dialogue-generator-ki', 'conditions') || '';
    
    if (body.length > 0 && !html.find('.tab[data-tab="gemini"]').length) {
        const tabHtml = `
            <div class="tab gemini" data-group="primary" data-tab="gemini">
                <div class="form-group stacked">
                    <label style="font-weight: bold;">NSC-Persönlichkeit & Dialog-Bedingungen</label>
                    <textarea name="flags.nsc-dialogue-generator-ki.conditions" 
                              style="min-height: 250px; background: rgba(0,0,0,0.05); border: 1px solid #7a7971; font-family: 'Signika', sans-serif;"
                              placeholder="Beschreibe hier Charakterzüge, Wissen oder Geheimnisse des NSCs...">${conditions}</textarea>
                    <p class="notes">Diese Informationen nutzt die KI exklusiv für diesen Charakter zusätzlich zur globalen Lore.</p>
                </div>
            </div>`;
        body.append(tabHtml);
    }
});

// --- 3. TOOLBAR BUTTON ---
Hooks.on('getSceneControlButtons', (controls) => {
    if (!game.user.isGM) return;
    const notes = controls.find(c => c.name === "notes");
    if (notes && !notes.tools.find(t => t.name === "gemini-dialog")) {
        notes.tools.push({
            name: "gemini-dialog",
            title: "KI Dialog starten",
            icon: "fas fa-brain",
            visible: true,
            onClick: () => {
                // Prüfen ob die Klasse existiert, um Absturz zu vermeiden
                if (typeof GeminiStarterApp !== 'undefined') {
                    new GeminiStarterApp().render(true);
                } else {
                    ui.notifications.error("GeminiStarterApp konnte nicht geladen werden.");
                }
            },
            button: true
        });
    }
});