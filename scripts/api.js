class GeminiAPI {
    static async generateResponse(npcData, playerData, history) {
        const apiKey = game.settings.get('nsc-dialogue-generator-ki', 'apiKey');
        if (!apiKey) {
            ui.notifications.error("Kein API-Key in den Modul-Einstellungen hinterlegt.");
            return null;
        }

        const modelId = "gemini-1.5-flash-latest"; 
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${apiKey}`;

        const journalName = game.settings.get('nsc-dialogue-generator-ki', 'loreJournalName');
        const journal = game.journal.getName(journalName);
        
        let dynamicLore = "Keine zusätzliche Lore gefunden.";
        
        if (journal && journal.pages) {
            let pagesArray = [];
            if (journal.pages.contents) pagesArray = journal.pages.contents;
            else if (Array.isArray(journal.pages)) pagesArray = journal.pages;
            else pagesArray = Array.from(journal.pages);

            dynamicLore = pagesArray.map(page => page.text?.content || "").join("\n").replace(/<[^>]*>?/gm, '').trim();
        }

        const systemPrompt = `Du bist ${npcData.name} in einem D&D 5e Rollenspiel (High Fantasy Realismus).
            BIO: ${npcData.bio}
            LORE: ${dynamicLore}
            REGELN:
            1. FREMDER: Das Gegenüber heißt zwar ${playerData.name}, aber du weißt das nicht zwingend. Sprich ihn wie einen Fremden an.
            2. KEIN LORE-DUMPING: Behalte das Weltwissen für dich. Sprich nur darüber, wenn du gefragt wirst.
            3. SPIEL DEINEN STATUS: Reagiere authentisch gemäß deiner Biografie.
            Antworte in der Ich-Perspektive und in maximal 3 Sätzen.`;

        try {
            const response = await fetch(apiUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    systemInstruction: { parts: [{ text: systemPrompt }] },
                    contents: history,
                    generationConfig: { temperature: 0.8 }
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error("Gemini API Fehler:", errorData);
                ui.notifications.error(`KI Fehler: ${errorData.error?.message || "Unbekannter Fehler"}`);
                return null;
            }

            const data = await response.json();
            return data.candidates?.[0]?.content?.parts?.[0]?.text || "*(Der NSC schweigt...)*";

        } catch (e) {
            console.error("Netzwerkfehler zur Google API:", e);
            ui.notifications.error("Netzwerkfehler zur Google API.");
            return null;
        }
    }
}
window.GeminiAPI = GeminiAPI;