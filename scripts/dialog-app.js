class GeminiDialogApp extends Application {
    constructor(player, npcData) {
        super();
        this.player = player;
        this.npc = npcData;
        this.history = [];
    }

    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            id: "gemini-chat-window",
            template: "modules/nsc-dialogue-generator-ki/templates/dialog.html",
            width: 450, height: 600, resizable: true
        });
    }

    get title() { return `Gespräch mit ${this.npc.name}`; }

    getData() {
        return { history: this.history, playerName: this.player.name, playerImg: this.player.img, npcName: this.npc.name, npcImg: this.npc.img, isThinking: this.isThinking };
    }

    activateListeners(html) {
        html.find('#send-btn').click(() => this._processChat(html));
        html.find('#chat-input').keypress(e => { if (e.which === 13) this._processChat(html); });
    }

    async _processChat(html) {
        const text = html.find('#chat-input').val();
        if (!text || this.isThinking) return;
        html.find('#chat-input').val("");

        this.history.push({ role: "user", parts: [{ text }] });
        ChatMessage.create({ speaker: { alias: this.player.name }, content: text });
        
        this.isThinking = true;
        this.render(true);

        const response = await GeminiAPI.generateResponse(this.npc, this.player, this.history);
        this.isThinking = false;
        if (response) {
            this.history.push({ role: "model", parts: [{ text: response }] });
            ChatMessage.create({ speaker: { alias: this.npc.name }, content: response });
        }
        this.render(true);
        setTimeout(() => { 
            const div = this.element.find('#gemini-history')[0];
            if(div) div.scrollTop = div.scrollHeight;
            this.element.find('#chat-input').focus();
        }, 100);
    }

    async close(options) {
        if (this.history.length > 0) {
            let content = `<h2>Dialog: ${this.npc.name}</h2>` + this.history.map(e => `<p><strong>${e.role === 'user' ? this.player.name : this.npc.name}:</strong> ${e.parts[0].text}</p>`).join("");
            const folder = game.folders.find(f => f.name === "Gespräche" && f.type === "JournalEntry");
            await JournalEntry.create({
                name: `Gespräch ${this.npc.name} (${new Date().toLocaleDateString()})`,
                folder: folder?.id,
                pages: [{ name: "Verlauf", type: "text", text: { content, format: 1 } }],
                ownership: { default: 0, [game.user.id]: 3 }
            });
        }
        return super.close(options);
    }
}
window.GeminiDialogApp = GeminiDialogApp;
Handlebars.registerHelper('eq', (a, b) => a === b);