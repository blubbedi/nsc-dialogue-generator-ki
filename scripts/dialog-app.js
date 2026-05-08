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
      id: "nsc-dialogue-ui",
      template: "modules/nsc-dialogue-generator-ki/templates/dialog.html",
      title: "KI-Dialog",
      width: 450,
      height: 600,
      resizable: true
    });
  }

  getData() {
    return {
      playerName: this.player.name,
      npcName: this.npc.name,
      history: this.history,
      isThinking: this.isThinking
    };
  }

  activateListeners(html) {
    html.find('#send-btn').click(() => this._process());
    html.find('#chat-input').keypress(ev => { if (ev.which === 13) this._process(); });
  }

  async _process() {
    if (this.isThinking) return;
    const input = this.element.find('#chat-input');
    const text = input.val();
    if (!text) return;
    input.val("");

    this.history.push({ role: "user", parts: [{ text: text }] });
    this.isThinking = true;
    this.render(true);

    const npcData = {
      name: this.npc.name,
      bio: this.npc.system.details?.biography?.value || "",
      conditions: this.npc.getFlag('nsc-dialogue-generator-ki', 'conditions') || "Neutral"
    };

    const response = await GeminiAPI.generateResponse(npcData, this.player, this.history.slice(0, -1), text);
    
    this.isThinking = false;
    if (response) {
      this.history.push({ role: "model", parts: [{ text: response }] });
      ChatMessage.create({ 
          speaker: ChatMessage.getSpeaker({actor: this.npc}), 
          content: response 
      });
    }
    this.render(true);
  }
}

Handlebars.registerHelper('eq', (a, b) => a === b);