class GeminiAPI {
    static async generateResponse(npcData, playerData, history, message) {
        const apiKey = game.settings.get('nsc-dialogue-generator-ki', 'apiKey');
        if (!apiKey) {
            ui.notifications.error("Kein API-Key gefunden!");
            return null;
        }

        // FIX: Wir nutzen 'gemini-pro', da dies der stabilste Alias in v1beta ist.
        // Alternativ: 'gemini-1.5-flash-latest'
        const model = "gemini-pro"; 
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

        const prompt = `Handle als NSC in D&D 5e. Stil: High Fantasy Realismus.
            WELT-LORE: ${game.settings.get('nsc-dialogue-generator-ki', 'worldLore')}
            NSC: ${npcData.name}. Hintergrund: ${npcData.bio}
            SPIELER: ${playerData.name}.
            ANWEISUNG: Antworte kurz und immersiv (max. 3 Sätze).`;

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

            if (!response.ok) {
                const errorData = await response.json();
                console.error("Gemini API Error Detail:", errorData);
                
                // Falls 'gemini-pro' auch nicht geht, versuchen wir es mit dem expliziten 1.5 Flash
                if (response.status === 404) {
                    ui.notifications.error("Modell nicht gefunden. Ich versuche einen Fallback...");
                    return await this.fallbackRequest(npcData, playerData, history, message, apiKey);
                }
                
                ui.notifications.error(`API Fehler: ${response.status}`);
                return null;
            }

            const data = await response.json();
            return data.candidates[0].content.parts[0].text;

        } catch (e) {
            console.error("Netzwerkfehler:", e);
            return "Die Verbindung zur Astralebene ist unterbrochen.";
        }
    }

    // Fallback-Funktion mit dem ganz neuen Bezeichner
    static async fallbackRequest(npcData, playerData, history, message, apiKey) {
        const fallbackUrl = `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${apiKey}`;
        // Hier nutzen wir v1 statt v1beta
        try {
            const res = await fetch(fallbackUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [{ role: "user", parts: [{ text: "Hallo" }] }] 
                })
            });
            if (res.ok) {
                ui.notifications.info("Fallback erfolgreich. Bitte api.js permanent auf v1/gemini-pro umstellen.");
            }
        } catch (err) {
             console.error("Auch Fallback fehlgeschlagen");
        }
        return "Der NSC schweigt hartnäckig. Prüfe die Konsole.";
    }
}
window.GeminiAPI = GeminiAPI;