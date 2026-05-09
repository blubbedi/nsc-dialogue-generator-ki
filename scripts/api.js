class GeminiAPI {
    static async generateResponse(npcData, playerData, history) {
        const apiKey = game.settings.get('nsc-dialogue-generator-ki', 'apiKey');
        if (!apiKey) {
            ui.notifications.error("Kein API-Key gefunden. Bitte in den Einstellungen eintragen.");
            return null;
        }

        const modelId = "gemini-1.5-flash-latest"; 
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent`;

        const journalName = game.settings.get('nsc-dialogue-generator-ki', 'loreJournalName');
        const journal = game.journal.getName(journalName);
        let dynamicLore = journal ? journal.pages.contents.map(p => p.text?.content || "").join("\n").replace(/<[^>]*>?/gm, '').trim() : "Keine Lore verfügbar.";

        const systemPrompt = `Du bist ${npcData.name} in einem D&D 5e Spiel (High Fantasy Realismus).
            BIO: ${npcData.bio}
            LORE: ${dynamicLore}
            REGELN: Behandle ${playerData.name} als Fremden, außer ihr kennt euch laut Bio. Kein Lore-Dumping. Antworte in max. 3 Sätzen immersiv.`;

        try {
            const response = await fetch(`${apiUrl}?key=${apiKey}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    systemInstruction: { parts: [{ text: systemPrompt }] },
                    contents: history,
                    generationConfig: { temperature: 0.8 }
                })
            });

            const data = await response.json();
            if (data.error) throw new Error(data.error.message);
            return data.candidates?.[0]?.content?.parts?.[0]?.text || "*(Der NSC starrt dich schweigend an...)*";
        } catch (e) {
            console.error("Gemini API Error:", e);
            ui.notifications.error(`KI Fehler: ${e.message}`);
            return null;
        }
    }
}
window.GeminiAPI = GeminiAPI;