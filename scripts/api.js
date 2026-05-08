class GeminiAPI {
  static async generateResponse(npcData, playerData, history, message) {
    const apiKey = game.settings.get('nsc-dialogue-generator-ki', 'apiKey');
    const worldLore = game.settings.get('nsc-dialogue-generator-ki', 'worldLore');
    
    if (!apiKey) {
      ui.notifications.error("NSC Dialogue Generator: Kein API-Key hinterlegt!");
      return null;
    }

    const systemInstruction = `Du bist ein erfahrener Dungeon Master. Handle als NSC in D&D 5e.
      STIL: High Fantasy Realismus, atmosphärisch dicht, keine moderne Umgangssprache.
      WELT-LORE: ${worldLore}
      NSC-PROFIL: Name: ${npcData.name}, Bio: ${npcData.bio}, Aktuelle Bedingungen: ${npcData.conditions}.
      GEGENÜBER: ${playerData.name} (Werte: Charisma ${playerData.system.abilities.cha.value}).
      REGEL: Antworte prägnant (max. 4 Sätze). Wenn der Spieler versucht zu lügen oder zu drohen, füge am Ende [WURF] hinzu.`;

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
      console.error("Gemini API Error:", e);
      return "Der NSC scheint kurzzeitig in Gedanken verloren...";
    }
  }
}