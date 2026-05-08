Hooks.once('ready', async () => {
    if (game.user.isGM && !game.folders.find(f => f.name === "Dialog-Nsc" && f.type === "Actor")) {
        await Folder.create({ name: "Dialog-Nsc", type: "Actor" });
    }
});

Hooks.on('getSceneControlButtons', (controls) => {
    if (!game.user.isGM) return;
    controls.find(c => c.name === "notes").tools.push({
        name: "gemini-dialog",
        title: "KI Dialog starten",
        icon: "fas fa-brain",
        onClick: () => new GeminiStarterApp().render(true),
        button: true
    });
});

class GeminiStarterApp extends Application {
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            template: "modules/nsc-dialogue-generator-ki/templates/starter.html",
            title: "KI Dialog Setup",
            width: 300
        });
    }

    getData() {
        const npcs = game.actors.filter(a => a.type === 'npc' && a.folder?.name === "Dialog-Nsc");
        const players = game.users.filter(u => u.active && u.character).map(u => u.character);
        return { npcs, players };
    }

    activateListeners(html) {
        html.find('#start-btn').click(() => {
            const p = game.actors.get(html.find('#p-select').val());
            const n = game.actors.get(html.find('#n-select').val());
            if (p && n) {
                new GeminiDialogApp(p, n).render(true);
                this.close();
            } else {
                ui.notifications.warn("Wähle einen NSC und einen Spieler!");
            }
        });
    }
}
window.GeminiStarterApp = GeminiStarterApp; // Global machen