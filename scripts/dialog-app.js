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
        // Wir übergeben jetzt zusätzlich die Profilbilder (img) an das HTML
        return { 
            history: this.history, 
            playerName: this.player.name, 
            playerImg: this.player.img, 
            npcName: this.npc.name, 
            npcImg: this.npc.img, 
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
            speaker: ChatMessage.getSpeaker({ actor: this.player }), 
            content: text 
        });

        this.isThinking = true;
        this.render(true);
        this._scrollToBottom(); // Scrollt runter nach deiner Eingabe

        const npcData = {
            name: this.npc.name,
            bio: this.npc.system.details?.biography?.value || "Ein ganz normaler Bewohner dieser Welt."
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
        this._scrollToBottom(); // Scrollt runter nach der KI-Antwort
    }

    // Hilfsfunktion: Scrollt das Fenster automatisch nach ganz unten
    _scrollToBottom() {
        setTimeout(() => {
            if (this.element && this.element.length) {
                const historyContainer = this.element.find('#gemini-history')[0];
                if (historyContainer) {
                    historyContainer.scrollTop = historyContainer.scrollHeight;
                }
                // Hält den Fokus im Eingabefeld, damit du direkt weitertippen kannst
                this.element.find('#chat-input').focus();
            }
        }, 50);
    }
}
window.GeminiDialogApp = GeminiDialogApp;
Handlebars.registerHelper('eq', (a, b) => a === b);