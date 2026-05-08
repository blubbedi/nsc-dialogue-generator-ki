class GeminiAPI {
    static async generateResponse(npcData, playerData, history, message) {
        const apiKey = game.settings.get('nsc-dialogue-generator-ki', 'apiKey');
        if (!apiKey) return null;

        // Wir nutzen eines der Modelle aus DEINER Liste:
        const modelId = "gemini-3.1-pro-preview"; 
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${apiKey}`;

        const prompt = `Du bist ein NSC in einem D&D 5e Spiel. 
            Stil: High Fantasy Realismus. 
            Welt-Lore: ${game.settings.get('nsc-dialogue-generator-ki', 'worldLore')}
            Dein Name: ${npcData.name}. 
            Hintergrund: ${npcData.bio}
            Dein Gegenüber: ${playerData.name}.
            Anweisung: Antworte immersiv in max. 3 Sätzen.`;

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
                        temperature: 0.8,
                        maxOutputTokens: 300
                    }
                })
            });

            const data = await response.json();

            if (!response.ok) {
                console.error("Gemini API Error:", data);
                ui.notifications.error(`KI Fehler: ${data.error?.message || "Unbekannter Fehler"}`);
                return null;
            }

            if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
                return data.candidates[0].content.parts[0].text;
            }
            
            return "Der NSC murmelt etwas Unverständliches...";
        } catch (e) {
            console.error("Netzwerkfehler:", e);
            return "Die Verbindung zur Astralebene schwankt...";
        }
    }
}
window.GeminiAPI = GeminiAPI;