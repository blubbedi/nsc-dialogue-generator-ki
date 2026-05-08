class GeminiAPI {
    static async generateResponse(npcData, playerData, history, message) {
        const apiKey = game.settings.get('nsc-dialogue-generator-ki', 'apiKey');
        if (!apiKey) {
            ui.notifications.error("Kein API-Key in den Einstellungen gefunden.");
            return null;
        }

        // Wir nutzen den absolut sichersten Modell-Pfad
        // 'gemini-1.5-flash' ist oft stabiler erreichbar als 'pro' für neue Keys
        const model = "gemini-1.5-flash"; 
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

        const prompt = `Du bist ein NSC in D&D 5e. Stil: High Fantasy Realismus.
            WELT: ${game.settings.get('nsc-dialogue-generator-ki', 'worldLore')}
            DEIN NAME: ${npcData.name}. 
            DEIN HINTERGRUND: ${npcData.bio}
            GEGENÜBER: ${playerData.name}.
            ANWEISUNG: Antworte kurz und immersiv in maximal 3 Sätzen.`;

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
                        maxOutputTokens: 200,
                    }
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error("Gemini API Error Detail:", errorText);
                
                // Wenn 404, versuchen wir es intern mit einem Hinweis
                if (response.status === 404) {
                    ui.notifications.error("API Fehler 404: Modell nicht gefunden. Prüfe Modellnamen oder Region.");
                } else {
                    ui.notifications.error(`API Fehler ${response.status}: Details in der Konsole.`);
                }
                return null;
            }

            const data = await response.json();
            if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
                return data.candidates[0].content.parts[0].text;
            }
            
            return "Der NSC murmelt etwas Unverständliches...";
        } catch (e) {
            console.error("Netzwerkfehler:", e);
            return "Eine magische Barriere stört die Verbindung...";
        }
    }
}
window.GeminiAPI = GeminiAPI;