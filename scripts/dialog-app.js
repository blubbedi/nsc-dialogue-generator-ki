async _process() {
    if (this.isThinking) return;
    const input = this.element.find('#chat-input');
    const text = input.val();
    if (!text) return;
    input.val("");

    this.history.push({ role: "user", parts: [{ text: text }] });
    this.isThinking = true;
    this.render(true);

    // Hier ziehen wir die Biografie direkt aus dem Standard-Feld
    const npcData = {
      name: this.npc.name,
      bio: this.npc.system.details?.biography?.value || "Ein einfacher NSC ohne besondere Merkmale."
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