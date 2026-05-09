class GeminiAPI {
    static async generateResponse(npcData, playerData, history) {
        const apiKey = game.settings.get('nsc-dialogue-generator-ki', 'apiKey');
        if (!apiKey) {
            ui.notifications.error("Bitte trage deinen API-Key in den Moduleinstellungen ein.");
            return null;
        }

        const modelId = "gemini-flash-latest"; 
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent`;

        const journalName = game.settings.get('nsc-dialogue-generator-ki', 'loreJournalName');
        const journal = game.journal.getName(journalName);
        
        let dynamicLore = "Keine zusätzliche Lore gefunden.";
        
        if (journal) {
            dynamicLore = journal.pages.contents
                .map(page => page.text?.content || "")
                .join("\n")
                .replace(/<[^>]*>?/gm, '')
                .trim();
        } else {
            console.warn(`KI-Lore: Kein Tagebuch mit dem Namen "${journalName}" gefunden.`);
        }

        const systemPrompt = `Du spielst einen NSC in einem D&D 5e Rollenspiel. Stil: High Fantasy Realismus.
            
            DEINE IDENTITÄT:
            Name: ${npcData.name}
            Hintergrund: ${npcData.bio}
            
            ALLGEMEINES WELTWISSEN & KAMPAGNEN-LORE:
            ${dynamicLore}
            
            STRIKTE VERHALTENSREGELN FÜR DIESEN DIALOG:
            1. FREMDER: Das Gegenüber heißt zwar ${playerData.name}, aber DU WEISST DAS NICHT zwingend! Sprich ihn niemals mit Namen an und behandle ihn wie einen Fremden, bis er sich selbst vorstellt.
            2. KEIN LORE-DUMPING: Behalte das Weltwissen für dich. Ein NSC referiert nicht unaufgefordert über uralte Artefakte. Sprich nur darüber, wenn du direkt danach gefragt wirst UND es zu deiner Biografie passt.
            3. SPIEL DEINEN STATUS: Reagiere authentisch (z.B. gierig, ängstlich, arrogant) gemäß deiner Biografie. Verrate NIEMALS Wissen, das eine Person deines Standes nicht haben kann!
            
            Anweisung: Antworte in der Ich-Perspektive, immersiv und in maximal 3 Sätzen.`;

        try {
            const response = await fetch(apiUrl, {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json",
                    "x-goog-api-key": apiKey 
                },
                body: JSON.stringify({
                    systemInstruction: {
                        parts: [{ text: systemPrompt }]
                    },
                    contents: history,
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
            const candidate = data.candidates?.[0];
            
            if (candidate) {
                if (candidate.finishReason === 'SAFETY') {
                    ui.notifications.warn("Die KI hat die Antwort aus Sicherheitsgründen blockiert.");
                    return "*(Der NSC schweigt abrupt und wendet sich ab...)*";
                }
                return candidate.content?.parts?.[0]?.text || "...";
            }
            
            return "Der NSC murmelt etwas Unverständliches...";

        } catch (e) {
            console.error("Netzwerkfehler zur Google API.", e);
            ui.notifications.error("Netzwerkfehler zur Google API.");
            return null;
        }
    }
}
window.GeminiAPI = GeminiAPI;