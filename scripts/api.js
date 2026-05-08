class GeminiAPI {
    static async generateResponse(npcData, playerData, history, message) {
        const apiKey = game.settings.get('nsc-dialogue-generator-ki', 'apiKey');
        if (!apiKey) {
            ui.notifications.error("Bitte trage deinen API-Key in den Moduleinstellungen ein.");
            return null;
        }

        // Wir nutzen das stabile Flash-Modell aus deiner Liste
        const modelId = "gemini-1.5-flash-latest"; 
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${apiKey}`;

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

            // Sicherheits-Check: Wir verarbeiten die Antwort, ohne die URL zu loggen
            if (!response.ok) {
                const errorData = await response.json();
                // Wir loggen NUR die Nachricht der API, niemals die URL (die den Key enthält)
                console.error("Gemini API Fehler:", errorData.error?.message || "Quota überschritten oder Modellfehler.");
                ui.notifications.error(`KI Fehler: ${errorData.error?.message || "Anfrage fehlgeschlagen"}`);
                return null;
            }

            const data = await response.json();
            
            if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
                return data.candidates[0].content.parts[0].text;
            }
            
            return "Der NSC murmelt etwas Unverständliches...";

        } catch (e) {
            // WICHTIG: Wir fangen Netzwerkfehler ab, ohne das Error-Objekt zu loggen, 
            // da dieses bei fetch-Fehlern oft die URL inkl. Key enthält.
            console.error("Netzwerkfehler: Die Verbindung zur Google API konnte nicht hergestellt werden.");
            ui.notifications.error("Netzwerkfehler zur Google API.");
            return null;
        }
    }
}
window.GeminiAPI = GeminiAPI;