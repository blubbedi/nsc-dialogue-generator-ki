class GeminiAPI {
    static async generateResponse(npcData, playerData, history, message) {
        const apiKey = game.settings.get('nsc-dialogue-generator-ki', 'apiKey');
        if (!apiKey) return null;

        // Der stabilste Endpunkt laut aktueller Dokumentation
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

        const prompt = `Du bist ein NSC in einem D&D 5e Spiel. 
            Stil: High Fantasy Realismus. 
            Welt-Lore: ${game.settings.get('nsc-dialogue-generator-ki', 'worldLore')}
            Dein Name: ${npcData.name}. 
            Dein Hintergrund: ${npcData.bio}
            Dein Gegenüber: ${playerData.name}.
            Anweisung: Antworte in max. 3 Sätzen, bleib in deiner Rolle.`;

        try {
            const response = await fetch(apiUrl, {
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

            if (!response.ok) {
                console.error("Gemini API Error:", data);
                // Spezifische Meldung für den User
                if (data.error?.status === "PERMISSION_DENIED") {
                    ui.notifications.error("API Key ungültig oder Region nicht unterstützt.");
                } else {
                    ui.notifications.error(`KI Fehler: ${data.error?.message || "Unbekannter Fehler"}`);
                }
                return null;
            }

            return data.candidates[0].content.parts[0].text;
        } catch (e) {
            console.error("Netzwerkfehler zur Google API:", e);
            return null;
        }
    }
}
window.GeminiAPI = GeminiAPI;