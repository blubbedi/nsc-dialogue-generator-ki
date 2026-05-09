Hooks.once('init', () => {
    // 1. Das Funkgerät wird sofort beim Start registriert
    console.log("KI-MODUL | Initialisiere Funkgerät...");
    
    game.socket.on("module.nsc-dialogue-generator-ki", (data) => {
        console.log("KI-MODUL | Signal aus dem Äther empfangen:", data);
        
        // Prüfen, ob der Befehl für DIESEN speziellen Spieler ist
        if (data.action === "openDialog" && data.userId === game.user.id) {
            console.log("KI-MODUL | Signal ist für MICH bestimmt!");
            
            const playerActor = game.actors.get(data.playerId);
            if (!playerActor) {
                console.error("KI-MODUL | Fehler: Charakter-Datenblatt nicht gefunden. ID:", data.playerId);
                ui.notifications.error("KI Dialog: Dein Charakter-Datenblatt wurde nicht gefunden.");
                return;
            }

            console.log("KI-MODUL | Öffne Fenster für:", playerActor.name, "mit", data.npc.name);
            try {
                // Das Dialog-Fenster aufbauen und anzeigen
                const app = new GeminiDialogApp(playerActor, data.npc);
                app.render(true);
                ui.notifications.info(`Der Spielleiter hat einen Dialog mit ${data.npc.name} gestartet!`);
            } catch (err) {
                console.error("KI-MODUL | Kritischer Fehler beim Rendern des Dialogs:", err);
            }
        }
    });
});

Hooks.once('ready', async () => {
    // 2. Ordner-Erstellung (nur für GM)
    if (game.user.isGM) {
        if (!game.folders.find(f => f.name === "Dialog-Nsc" && f.type === "Actor")) {
            await Folder.create({ name: "Dialog-Nsc", type: "Actor" });
        }
        if (!game.folders.find(f => f.name === "Gespräche" && f.type === "JournalEntry")) {
            await Folder.create({ name: "Gespräche", type: "JournalEntry" });
        }
    }
});

Hooks.on('getSceneControlButtons', (controls) => {
    // 3. GM-Button
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
                
                // Wir erzwingen reine Text-Strings (Desinfektion für den Socket)
                let cleanBio = "Ein Bewohner dieser Welt.";
                if (npcActor.system && npcActor.system.details && npcActor.system.details.biography) {
                    cleanBio = String(npcActor.system.details.biography.value);
                }

                const npcDataPayload = {
                    id: String(npcActor.id),
                    name: String(npcActor.name),
                    img: String(npcActor.img || "icons/svg/mystery-man.svg"),
                    bio: cleanBio
                };
                
                if (userId === game.user.id) {
                    console.log("KI-MODUL | Öffne lokal für GM...");
                    new GeminiDialogApp(playerActor, npcDataPayload).render(true);
                } else {
                    const payload = {
                        action: "openDialog",
                        userId: String(userId),
                        playerId: String(actorId),
                        npc: npcDataPayload 
                    };
                    
                    console.log("KI-MODUL | Feuere Socket ab:", payload);
                    game.socket.emit("module.nsc-dialogue-generator-ki", payload);
                    
                    ui.notifications.info("Dialog-Signal an Spieler gefeuert (prüfe Konsole).");
                }
                this.close();
            } else {
                ui.notifications.warn("Bitte wähle einen Spieler und einen NSC aus.");
            }
        });
    }
}
window.GeminiStarterApp = GeminiStarterApp;