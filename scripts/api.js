class GeminiAPI {
  static async generateResponse(npcData, playerData, history, message) {
    const apiKey = game.settings.get('nsc-dialogue-generator-ki', 'apiKey');
    const worldLore = game.settings.get('nsc-dialogue-generator-ki', 'worldLore');
    
    if (!apiKey) {
      ui.notifications.error("API-Key fehlt in den Einstellungen!");
      return null;
    }

    // Wir nutzen hier npcData.details, was wir in der dialog-app.js aus der Biografie ziehen
    const systemInstruction = `Du bist ein NSC in einem D&D 5e Spiel.
      STIL: High Fantasy Realismus.
      WELT-LORE: ${worldLore}
      DEIN PROFIL: Name: ${npcData.name}. 
      HINTERGRUND/PERSÖNLICHKEIT: ${npcData.bio}
      GEGENÜBER: ${playerData.name}.
      ANWEISUNG: Antworte kurz und immersiv (max 3-4 Sätze).`;

    const body = {
      contents: [
        { role: "user", parts: [{ text: systemInstruction }] },
        ...history.slice(-10),
        { role: "user", parts: [{ text: message }] }
      ]
    };

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      const data = await response.json();
      return data.candidates[0].content.parts[0].text;
    } catch (e) {
      return "Der NSC schweigt und starrt ins Leere.";
    }
  }
}