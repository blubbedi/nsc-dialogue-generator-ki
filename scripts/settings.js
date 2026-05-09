Hooks.once('init', () => {
    game.settings.register('nsc-dialogue-generator-ki', 'apiKey', {
        name: "Gemini API Key",
        hint: "Trage hier deinen Google AI Studio Key ein.",
        scope: "world",
        config: true,
        type: String,
        default: "" 
    });

    game.settings.register('nsc-dialogue-generator-ki', 'loreJournalName', {
        name: "Name des Lore-Tagebuchs",
        hint: "Der exakte Name des Journal Entries (Tagebuchs).",
        scope: "world",
        config: true,
        type: String,
        default: "KI Lore"
    });
});