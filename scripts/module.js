Hooks.once('ready', async () => {
    // Sockets für V12 registrieren
    game.socket.on("module.nsc-dialogue-generator-ki", (data) => {
        if (data.action === "openDialog" && data.userId === game.user.id) {
            const playerActor = game.actors.get(data.playerId);
            if (playerActor) {
                new GeminiDialogApp(playerActor, data.npc).render(true);
            }
        }
    });

    if (game.user.isGM) {
        if (!game.folders.find(f => f.name === "Dialog-Nsc" && f.type === "Actor")) await Folder.create({ name: "Dialog-Nsc", type: "Actor" });
        if (!game.folders.find(f => f.name === "Gespräche" && f.type === "JournalEntry")) await Folder.create({ name: "Gespräche", type: "JournalEntry" });
    }
});

Hooks.on('getSceneControlButtons', (controls) => {
    if (!game.user.isGM) return;
    controls.find(c => c.name === "notes").tools.push({
        name: "gemini-dialog",
        title: "KI Dialog senden",
        icon: "fas fa-brain",
        onClick: () => new GeminiStarterApp().render(true),
        button: true
    });
});

class GeminiStarterApp extends Application {
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            template: "modules/nsc-dialogue-generator-ki/templates/starter.html",
            title: "KI Dialog Zuweisung",
            width: 320
        });
    }

    getData() {
        const npcs = game.actors.filter(a => a.type === 'npc' && a.folder?.name === "Dialog-Nsc");
        const players = game.users.filter(u => u.active && u.character).map(u => ({
            userId: u.id, actorId: u.character.id, name: `${u.name} (${u.character.name})`
        }));
        return { npcs, players };
    }

    activateListeners(html) {
        html.find('#start-btn').click(() => {
            const [uId, aId] = html.find('#p-select').val().split('|');
            const npc = game.actors.get(html.find('#n-select').val());
            const payload = { id: npc.id, name: npc.name, img: npc.img, bio: npc.system.details?.biography?.value || "" };

            if (uId === game.user.id) new GeminiDialogApp(game.actors.get(aId), payload).render(true);
            else game.socket.emit("module.nsc-dialogue-generator-ki", { action: "openDialog", userId: uId, playerId: aId, npc: payload });
            this.close();
        });
    }
}
window.GeminiStarterApp = GeminiStarterApp;