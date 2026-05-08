class GeminiDialogApp extends Application {
    constructor(player, npc) {
        super();
        this.player = player;
        this.npc = npc;
        this.history = [];
        this.isThinking = false;
    }

    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            id: "gemini-chat-window",
            template: "modules/nsc-dialogue-generator-ki/templates/dialog.html",
            title: `Gespräch mit ${this.npc?.name || "NSC"}`,
            width: 450,
            height: 600,
            resizable: true
        });
    }

    getData() {
        return { 
            history: this.history, 
            playerName: this.player.name, 
            npcName: this.npc.name, 
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
        this.isThinking = true;
        this.render(true);

        const npcData = {
            name: this.npc.name,
            bio: this.npc.system.details?.biography?.value || "Ein NSC."
        };

        const response = await GeminiAPI.generateResponse(npcData, this.player, this.history.slice(0, -1), text);
        
        this.isThinking = false;
        if (response) {
            this.history.push({ role: "model", parts: [{ text: response }] });
            ChatMessage.create({ 
                speaker: ChatMessage.getSpeaker({ actor: this.npc }), 
                content: response 
            });
        }
        this.render(true);
    }
}
window.GeminiDialogApp = GeminiDialogApp;
Handlebars.registerHelper('eq', (a, b) => a === b);