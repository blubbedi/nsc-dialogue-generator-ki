class GeminiAPI {
    static async generateResponse(npcData, playerData, history, message) {
        const apiKey = game.settings.get('nsc-dialogue-generator-ki', 'apiKey');
        if (!apiKey) {
            ui.notifications.error("Bitte trage deinen API-Key in den Moduleinstellungen ein.");
            return null;
        }

        const modelId = "gemini-flash-latest"; 
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent`;

        // HIER IST DER MAGISCHE TEIL: Der neu strukturierte Prompt mit strengen Regeln
        const prompt = `Du spielst einen NSC in einem D&D 5e Rollenspiel. Stil: High Fantasy Realismus.
            
            DEINE IDENTITÄT:
            Name: ${npcData.name}
            Hintergrund: ${npcData.bio}
            
            ALLGEMEINES WELTWISSEN (Lore):
            ${game.settings.get('nsc-dialogue-generator-ki', 'worldLore')}
            
            STRIKTE VERHALTENSREGELN FÜR DIESEN DIALOG:
            1. FREMDER: Das Gegenüber heißt zwar ${playerData.name}, aber DU WEISST DAS NICHT! Sprich ihn niemals mit Namen an und behandle ihn wie einen Fremden, bis er sich im aktuellen Chatverlauf selbst namentlich vorstellt.
            2. KEIN LORE-DUMPING: Behalte das Weltwissen für dich. Ein normaler NSC referiert nicht unaufgefordert über uralte Artefakte, Kriege oder Fraktionen. Sprich nur darüber, wenn du direkt danach gefragt wirst UND es logisch zu deinem Hintergrund passt.
            3. SPIEL DEINEN STATUS: Reagiere authentisch. Ein Händler will Geld verdienen, ein Bauer will seine Ruhe, eine Wache ist misstrauisch. Nutze alltägliche Sprache, die zu deinem Bildungsstand passt.
            
            Anweisung: Antworte in der Ich-Perspektive, immersiv und in maximal 3 Sätzen.`;

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
                        temperature: 0.8
                    }
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error("Gemini API Fehler:", errorData.error?.message || "Fehler bei der Anfrage.");
                
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