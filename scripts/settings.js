Hooks.once('init', () => {
    game.settings.register('nsc-dialogue-generator-ki', 'apiKey', {
        name: "Gemini API Key",
        hint: "Trage hier deinen Google AI Studio Key ein.",
        scope: "world",
        config: true,
        type: String,
        default: "",
        password: true
    });

    game.settings.register('nsc-dialogue-generator-ki', 'loreJournalName', {
        name: "Name des Lore-Tagebuchs",
        hint: "Der exakte Name des Journal Entries (Tagebuchs) in Foundry, in dem du die Kampagnen-Lore speicherst. Die KI liest dieses Tagebuch vor jedem Dialog aus.",
        scope: "world",
        config: true,
        type: String,
        default: "KI Lore"
    });
});