class GeminiAPI {
    static async generateResponse(npcData, playerData, history, message) {
        const apiKey = game.settings.get('nsc-dialogue-generator-ki', 'apiKey');
        if (!apiKey) return "Fehler: Kein API-Key hinterlegt.";

        const prompt = `Handle als NSC in D&D 5e. Stil: High Fantasy Realismus.
            WELT: ${game.settings.get('nsc-dialogue-generator-ki', 'worldLore')}
            DEIN PROFIL: ${npcData.name}. Hintergrund: ${npcData.bio}
            SPIELER: ${playerData.name}.
            ANWEISUNG: Antworte kurz (max. 3 Sätze).`;

        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${apiKey}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [
                        { role: "user", parts: [{ text: prompt }] },
                        ...history,
                        { role: "user", parts: [{ text: message }] }
                    ]
                })
            });
            const data = await response.json();
            return data.candidates[0].content.parts[0].text;
        } catch (e) {
            console.error(e);
            return "Der NSC wirkt abwesend...";
        }
    }
}
window.GeminiAPI = GeminiAPI; // Global machen