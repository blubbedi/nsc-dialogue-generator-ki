class GeminiAPI {
    static async generateResponse(npcData, playerData, history, message) {
        const apiKey = game.settings.get('nsc-dialogue-generator-ki', 'apiKey');
        if (!apiKey) return null;

        // Stabiler v1 Pfad für Pro-Nutzer
        const apiUrl = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-pro:generateContent?key=${apiKey}`;

        const prompt = `Du bist ein NSC in einem D&D 5e Spiel. 
            Stil: High Fantasy Realismus. 
            Welt-Lore: ${game.settings.get('nsc-dialogue-generator-ki', 'worldLore')}
            Dein Name: ${npcData.name}. 
            Hintergrund: ${npcData.bio}
            Dein Gegenüber: ${playerData.name}.
            Anweisung: Antworte kurz (max. 3 Sätze) und bleib in deiner Rolle.`;

        try {
            const response = await fetch(apiUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [
                        { role: "user", parts: [{ text: prompt }] },
                        ...history,
                        { role: "user", parts: [{ text: message }] }
                    ],
                    generationConfig: {
                        temperature: 0.7,
                        maxOutputTokens: 250
                    }
                })
            });

            const data = await response.json();

            if (!response.ok) {
                console.error("Gemini API Error:", data);
                ui.notifications.error(`KI Fehler: ${data.error?.message || "Unbekannter Fehler"}`);
                return null;
            }

            return data.candidates[0].content.parts[0].text;
        } catch (e) {
            console.error("Netzwerkfehler:", e);
            return "Der NSC scheint in Gedanken versunken...";
        }
    }
}
window.GeminiAPI = GeminiAPI;