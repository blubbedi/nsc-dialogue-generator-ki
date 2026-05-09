Hooks.once('ready', async () => {
    // 1. Ordner-Erstellung (nur für GM)
    if (game.user.isGM) {
        if (!game.folders.find(f => f.name === "Dialog-Nsc" && f.type === "Actor")) {
            await Folder.create({ name: "Dialog-Nsc", type: "Actor" });
        }
        if (!game.folders.find(f => f.name === "Gespräche" && f.type === "JournalEntry")) {
            await Folder.create({ name: "Gespräche", type: "JournalEntry" });
        }
    }

    // 2. Das Funkgerät (jetzt sicher im ready-Hook, feuert wenn alles geladen ist)
    game.socket.on("module.nsc-dialogue-generator-ki", (data) => {
        console.log("KI Dialog Modul: Signal empfangen", data);
        if (data.action === "openDialog" && data.userId === game.user.id) {
            const playerActor = game.actors.get(data.playerId);
            
            if (playerActor) {
                new GeminiDialogApp(playerActor, data.npc).render(true);
                ui.notifications.info(`Dialog mit ${data.npc.name} gestartet!`);
            } else {
                ui.notifications.error("Dein Charakter konnte nicht geladen werden.");
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
        // V12 FIX: foundry.utils.mergeObject
        return foundry.utils.mergeObject(super.defaultOptions, {
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
                const playerActor = game.actors.get(actorId);
                const npcActor = game.actors.get(nId);
                
                const npcDataPayload = {
                    id: npcActor.id,
                    name: npcActor.name,
                    img: npcActor.img,
                    bio: npcActor.system.details?.biography?.value || "Ein Bewohner dieser Welt."
                };
                
                if (userId === game.user.id) {
                    new GeminiDialogApp(playerActor, npcDataPayload).render(true);
                } else {
                    game.socket.emit("module.nsc-dialogue-generator-ki", {
                        action: "openDialog",
                        userId: userId,
                        playerId: actorId,
                        npc: npcDataPayload 
                    });
                    ui.notifications.info("Dialog-Fenster wurde erfolgreich an den Spieler gesendet.");
                }
                this.close();
            } else {
                ui.notifications.warn("Bitte wähle einen Spieler und einen NSC aus.");
            }
        });
    }
}
window.GeminiStarterApp = GeminiStarterApp;