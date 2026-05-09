class GeminiDialogApp extends Application {
    constructor(player, npcData) {
        super();
        this.player = player;
        this.npc = npcData;
        this.history = [];
        this.isThinking = false;
    }

    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            id: "gemini-chat-window",
            template: "modules/nsc-dialogue-generator-ki/templates/dialog.html",
            width: 450,
            height: 600,
            resizable: true
        });
    }

    get title() {
        return `Gespräch mit ${this.npc.name}`;
    }

    getData() {
        return { 
            history: this.history, 
            playerName: this.player.name, 
            playerImg: this.player.img || "icons/svg/mystery-man.svg", 
            npcName: this.npc.name, 
            npcImg: this.npc.img || "icons/svg/mystery-man.svg", 
            isThinking: this.isThinking 
        };
    }

    activateListeners(html) {
        html.find('#send-btn').click(() => this._processChat(html));
        html.find('#chat-input').keypress(e => { if (e.which === 13) this._processChat(html); });
    }

    async _processChat(html) {
        if (this.isThinking) return;
        const input = html.find('#chat-input');
        const text = input.val();
        if (!text) return;
        input.val("");

        this.history.push({ role: "user", parts: [{ text: text }] });
        ChatMessage.create({ 
            speaker: { alias: this.player.name, actor: this.player.id },
            content: text 
        });

        this.isThinking = true;
        this.render(true);
        this._scrollToBottom(); 

        const response = await GeminiAPI.generateResponse(this.npc, this.player, this.history);
        
        this.isThinking = false;
        if (response) {
            this.history.push({ role: "model", parts: [{ text: response }] });
            ChatMessage.create({ 
                speaker: { alias: this.npc.name }, 
                content: response 
            });
        }
        this.render(true);
        this._scrollToBottom(); 
    }

    _scrollToBottom() {
        setTimeout(() => {
            if (this.element && this.element.length) {
                const historyContainer = this.element.find('#gemini-history')[0];
                if (historyContainer) {
                    historyContainer.scrollTop = historyContainer.scrollHeight;
                }
                this.element.find('#chat-input').focus();
            }
        }, 50);
    }

    async close(options) {
        if (this.history.length > 0) {
            await this._saveConversationToJournal();
        }
        return super.close(options);
    }

    async _saveConversationToJournal() {
        try {
            let content = `<h2>Gespräch zwischen ${this.player.name} und ${this.npc.name}</h2><hr>`;
            this.history.forEach(entry => {
                const speakerName = entry.role === 'user' ? this.player.name : this.npc.name;
                const text = entry.parts[0].text;
                content += `<p><strong>${speakerName}:</strong> ${text}</p>`;
            });

            const folder = game.folders.find(f => f.name === "Gespräche" && f.type === "JournalEntry");
            const folderId = folder ? folder.id : null;

            const dateStr = new Date().toLocaleDateString('de-DE');
            const timeStr = new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
            const journalTitle = `Gespräch mit ${this.npc.name} (${dateStr} ${timeStr})`;

            await JournalEntry.create({
                name: journalTitle,
                folder: folderId,
                pages: [{
                    name: "Verlauf",
                    type: "text",
                    text: { format: 1, content: content }
                }],
                ownership: {
                    default: 0,
                    [game.user.id]: 3 
                }
            });

            ui.notifications.info("Gespräch gespeichert!");
        } catch (e) {
            console.error("Fehler beim Speichern des KI-Dialogs:", e);
            ui.notifications.warn("Konnte Gespräch nicht speichern.");
        }
    }
}
window.GeminiDialogApp = GeminiDialogApp;
Handlebars.registerHelper('eq', (a, b) => a === b);