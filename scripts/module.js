// --- 1. ORDNER AUTOMATISCH ERSTELLEN ---
Hooks.once('ready', async () => {
    if (!game.user.isGM) return;
    const folderName = "Dialog-Nsc";
    let folder = game.folders.find(f => f.name === folderName && f.type === "Actor");
    if (!folder) {
        await Folder.create({ name: folderName, type: "Actor", parent: null });
    }
});

// --- 2. TOOLBAR BUTTON FIX ---
Hooks.on('getSceneControlButtons', (controls) => {
    if (!game.user.isGM) return;
    const notes = controls.find(c => c.name === "notes");
    if (notes) {
        notes.tools.push({
            name: "gemini-dialog",
            title: "KI Dialog starten",
            icon: "fas fa-brain", // Das Icon
            visible: true,
            onClick: () => {
                // Wir stellen sicher, dass die App geladen ist
                if (typeof GeminiStarterApp !== 'undefined') {
                    new GeminiStarterApp().render(true);
                } else {
                    ui.notifications.error("Fehler: GeminiStarterApp nicht gefunden.");
                }
            },
            button: true
        });
    }
});

// --- 3. STARTER APP FIX ---
class GeminiStarterApp extends Application {
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            id: "nsc-dialogue-generator-starter",
            template: "modules/nsc-dialogue-generator-ki/templates/starter.html",
            title: "Dialog Setup",
            width: 350
        });
    }

    getData() {
        const folderName = "Dialog-Nsc";
        const npcs = game.actors.filter(a => a.type === 'npc' && a.folder?.name === folderName);
        const players = game.users.filter(u => u.active && u.character).map(u => u.character);
        
        return { npcs, players };
    }

    activateListeners(html) {
        html.find('#start-btn').click(() => {
            const pId = html.find('#p-select').val();
            const nId = html.find('#n-select').val();
            if (!pId || !nId) return ui.notifications.warn("Bitte Spieler und NSC auswählen.");
            
            new GeminiDialogApp(game.actors.get(pId), game.actors.get(nId)).render(true);
            this.close();
        });
    }
}