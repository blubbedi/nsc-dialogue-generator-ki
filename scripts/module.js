console.log("KI-MODUL | Skript geladen.");

Hooks.once('ready', async () => {
    console.log("KI-MODUL | Foundry 'ready'. Mache Funkgerät empfangsbereit...");

    // Das Funkgerät für den Empfang (Spieler & GM)
    game.socket.on("module.nsc-dialogue-generator-ki", (data) => {
        console.log("KI-MODUL | >> SIGNAL EMPFANGEN <<", data);
        
        if (data.action === "openDialog") {
            if (data.userId === game.user.id) {
                console.log("KI-MODUL | Signal ist für mich bestimmt! Suche Charakter...");
                const playerActor = game.actors.get(data.playerId);
                
                if (playerActor && data.npc) {
                    console.log("KI-MODUL | Alles gefunden. Öffne Dialogfenster!");
                    new GeminiDialogApp(playerActor, data.npc).render(true);
                    ui.notifications.info(`Der Spielleiter hat einen Dialog mit ${data.npc.name} gestartet!`);
                } else {
                    console.error("KI-MODUL | Fehler: Charakter- oder NSC-Daten fehlen.", {player: playerActor, npc: data.npc});
                    ui.notifications.error("Charakter konnte nicht geladen werden.");
                }
            } else {
                console.log(`KI-MODUL | Signal ignoriert. (Geht an: ${data.userId}, Ich bin: ${game.user.id})`);
            }
        }
    });

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

            if (!pSelect || !nId) {
                ui.notifications.warn("Bitte wähle Spieler und NSC aus.");
                return;
            }

            const [userId, actorId] = pSelect.split('|');
            const playerActor = game.actors.get(actorId);
            const npcActor = game.actors.get(nId);

            if (!playerActor || !npcActor) return;

            // FIX: Biografie aggressiv säubern, da HTML-Fragmente den Socket zum Absturz bringen können
            const rawBio = npcActor.system?.details?.biography?.value || "";
            const cleanBio = String(rawBio).replace(/<[^>]*>?/gm, '').trim() || "Ein Bewohner.";

            const payload = {
                id: String(npcActor.id),
                name: String(npcActor.name),
                img: String(npcActor.img || "icons/svg/mystery-man.svg"),
                bio: cleanBio
            };

            if (userId === game.user.id) {
                console.log("KI-MODUL | Öffne lokal für GM.");
                new GeminiDialogApp(playerActor, payload).render(true);
            } else {
                console.log("KI-MODUL | Feuere Socket an Spieler:", userId);
                game.socket.emit("module.nsc-dialogue-generator-ki", {
                    action: "openDialog",
                    userId: userId,
                    playerId: actorId,
                    npc: payload
                });
                ui.notifications.info("Dialog an den Spieler gesendet. (Konsole prüfen!)");
            }
            this.close();
        });
    }
}
window.GeminiStarterApp = GeminiStarterApp;