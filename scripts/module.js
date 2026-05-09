Hooks.once('ready', async () => {
    if (game.user.isGM) {
        if (!game.folders.find(f => f.name === "Dialog-Nsc" && f.type === "Actor")) {
            await Folder.create({ name: "Dialog-Nsc", type: "Actor" });
        }
        if (!game.folders.find(f => f.name === "Gespräche" && f.type === "JournalEntry")) {
            await Folder.create({ name: "Gespräche", type: "JournalEntry" });
        }
    }

    game.socket.on("module.nsc-dialogue-generator-ki", (data) => {
        if (data.action === "openDialog" && data.userId === game.user.id) {
            const playerActor = game.actors.get(data.playerId);
            const npcActor = game.actors.get(data.npcId);
            
            if (playerActor && npcActor) {
                new GeminiDialogApp(playerActor, npcActor).render(true);
                ui.notifications.info(`Der Spielleiter hat einen Dialog mit ${npcActor.name} gestartet!`);
            } else {
                ui.notifications.error("Charakter-Daten konnten nicht geladen werden. Fehlen die Berechtigungen für den NSC?");
            }
        }
    });
});

Hooks.on('getSceneControlButtons', (controls) => {
    if (!game.user.isGM) return; 
    
    const notes = controls.find(c => c.name === "notes");
    if (notes) {
        notes.tools.push({
            name: "gemini-dialog",
            title: "KI Dialog an Spieler senden",
            icon: "fas fa-brain",
            onClick: () => new GeminiStarterApp().render(true),
            button: true
        });
    }
});

class GeminiStarterApp extends Application {
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            template: "modules/nsc-dialogue-generator-ki/templates/starter.html",
            title: "KI Dialog Zuweisung",
            width: 320
        });
    }

    getData() {
        const npcs = game.actors.filter(a => a.type === 'npc' && a.folder?.name === "Dialog-Nsc");
        
        const activePlayers = game.users.filter(u => u.active && !u.isGM && u.character);
        const players = activePlayers.map(u => ({
            userId: u.id,
            actorId: u.character.id,
            name: `${u.name} (spielt ${u.character.name})`
        }));

        if (game.user.character) {
            players.push({
                userId: game.user.id,
                actorId: game.user.character.id,
                name: `${game.user.name} (Spielleiter)`
            });
        }

        return { npcs, players };
    }

    activateListeners(html) {
        html.find('#start-btn').click(() => {
            const pSelect = html.find('#p-select').val();
            const nId = html.find('#n-select').val();
            
            if (pSelect && nId) {
                const [userId, actorId] = pSelect.split('|');
                
                if (userId === game.user.id) {
                    new GeminiDialogApp(game.actors.get(actorId), game.actors.get(nId)).render(true);
                } else {
                    game.socket.emit("module.nsc-dialogue-generator-ki", {
                        action: "openDialog",
                        userId: userId,
                        playerId: actorId,
                        npcId: nId
                    });
                    ui.notifications.info("Dialog-Fenster wurde auf den Bildschirm des Spielers gesendet.");
                }
                this.close();
            } else {
                ui.notifications.warn("Bitte wähle einen Spieler und einen NSC aus.");
            }
        });
    }
}
window.GeminiStarterApp = GeminiStarterApp;