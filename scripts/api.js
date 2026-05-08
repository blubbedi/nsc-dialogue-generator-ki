class GeminiAPI {
    static async generateResponse(npcData, playerData, history, message) {
        const apiKey = game.settings.get('nsc-dialogue-generator-ki', 'apiKey');
        if (!apiKey) {
            ui.notifications.error("Kein API-Key gefunden!");
            return null;
        }

        // Wir nutzen den stabilen Pro-Endpunkt
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${apiKey}`;

        const prompt = `Handle als NSC in D&D 5e. Stil: High Fantasy Realismus.
            WELT: ${game.settings.get('nsc-dialogue-generator-ki', 'worldLore')}
            DEIN PROFIL: ${npcData.name}. Hintergrund: ${npcData.bio}
            SPIELER: ${playerData.name}.
            ANWEISUNG: Antworte kurz (max. 3 Sätze). Sei immersiv.`;

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
                ui.notifications.error(`API Fehler: ${response.status} - Schau in die Konsole.`);
                return "Der NSC scheint gerade nicht sprechen zu wollen...";
            }

            const data = await response.json();

            // Sicherheitscheck, ob die Antwort wirklich Text enthält
            if (data.candidates && data.candidates[0] && data.candidates[0].content) {
                return data.candidates[0].content.parts[0].text;
            } else {
                console.warn("Unerwartete API-Antwort-Struktur:", data);
                return "Der NSC murmelt etwas Unverständliches...";
            }
        } catch (e) {
            console.error("Netzwerkfehler zur Gemini API:", e);
            return "Eine magische Störung verhindert das Gespräch.";
        }
    }
}
window.GeminiAPI = GeminiAPI;