class GeminiAPI {
    static async generateResponse(npcData, playerData, history, message) {
        const apiKey = game.settings.get('nsc-dialogue-generator-ki', 'apiKey');
        if (!apiKey) {
            ui.notifications.error("Bitte trage deinen API-Key in den Moduleinstellungen ein.");
            return null;
        }

        const modelId = "gemini-flash-latest"; 
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent`;

        // 1. Hole den Namen des Tagebuchs aus den Einstellungen
        const journalName = game.settings.get('nsc-dialogue-generator-ki', 'loreJournalName');
        const journal = game.journal.getName(journalName);
        
        let dynamicLore = "Keine zusätzliche Lore gefunden.";
        
        // 2. Wenn das Tagebuch existiert, lese alle Seiten aus und entferne HTML-Tags
        if (journal) {
            dynamicLore = journal.pages.contents
                .map(page => page.text?.content || "")
                .join("\n")
                .replace(/<[^>]*>?/gm, '') // Entfernt HTML (P-Tags, H1-Tags etc.)
                .trim();
        } else {
            console.warn(`KI-Lore: Kein Tagebuch mit dem Namen "${journalName}" gefunden.`);
        }

        const prompt = `Du spielst einen NSC in einem D&D 5e Rollenspiel. Stil: High Fantasy Realismus.
            
            DEINE IDENTITÄT:
            Name: ${npcData.name}
            Hintergrund: ${npcData.bio}
            
            ALLGEMEINES WELTWISSEN & KAMPAGNEN-LORE:
            ${dynamicLore}
            
            STRIKTE VERHALTENSREGELN FÜR DIESEN DIALOG:
            1. FREMDER: Das Gegenüber heißt zwar ${playerData.name}, aber DU WEISST DAS NICHT zwingend! Sprich ihn niemals mit Namen an, es sei denn, ihr kennt euch laut deiner Biografie oder er stellt sich vor.
            2. KEIN LORE-DUMPING: Die Kampagnen-Lore ist DEIN PASSIVES WISSEN. Referiere niemals unaufgefordert über Artefakte, Kriege oder Fraktionen. Sprich nur darüber, wenn du direkt danach gefragt wirst UND es logisch zu deinem Hintergrund passt.
            3. SPIEL DEINEN STATUS: Reagiere authentisch. Ein Händler will Geld verdienen, ein Bauer will seine Ruhe. Verrate NIEMALS Wissen, das eine Person deines Standes nicht haben kann!
            
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