class GeminiAPI {
    static async generateResponse(npcData, playerData, history, message) {
        const apiKey = game.settings.get('nsc-dialogue-generator-ki', 'apiKey');
        if (!apiKey) {
            ui.notifications.error("Bitte trage deinen API-Key in den Moduleinstellungen ein.");
            return null;
        }

        // Wir nutzen "gemini-flash-latest" - das universellste Modell aus deiner Liste
        const modelId = "gemini-flash-latest"; 
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent`;

        const prompt = `Du bist ein NSC in einem D&D 5e Spiel. 
            Stil: High Fantasy Realismus. 
            Welt-Lore: ${game.settings.get('nsc-dialogue-generator-ki', 'worldLore')}
            Dein Name: ${npcData.name}. 
            Dein Hintergrund: ${npcData.bio}
            Dein Gegenüber: ${playerData.name}.
            Anweisung: Antworte immersiv in max. 3 Sätzen.`;

        try {
            const response = await fetch(apiUrl, {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json",
                    "x-goog-api-key": apiKey 
                },
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

            if (!response.ok) {
                const errorData = await response.json();
                console.error("Gemini API Fehler:", errorData.error?.message || "Fehler bei der Anfrage.");
                
                // Wir fangen das Limit-Problem ab und geben dir einen klaren Hinweis im Spiel
                if (errorData.error?.message?.includes("Quota exceeded")) {
                    ui.notifications.error("KI-Limit ist auf 0. Bitte Abrechnung im Google AI Studio aktivieren.");
                } else {
                    ui.notifications.error(`KI Fehler: ${errorData.error?.message}`);
                }
                return null;
            }

            const data = await response.json();
            
            if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
                return data.candidates[0].content.parts[0].text;
            }
            
            return "Der NSC murmelt etwas Unverständliches...";

        } catch (e) {
            console.error("Netzwerkfehler zur Google API.");
            ui.notifications.error("Netzwerkfehler zur Google API.");
            return null;
        }
    }
}
window.GeminiAPI = GeminiAPI;