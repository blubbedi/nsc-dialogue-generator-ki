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

    game.settings.register('nsc-dialogue-generator-ki', 'worldLore', {
        name: "Welt-Lore",
        hint: "Informationen, die alle NSC kennen (z.B. Setting-Details).",
        scope: "world",
        config: true,
        type: String,
        default: "High Fantasy Realismus. Das Schwert ist eines der drei Artefakte (Teile von Ishkandrael)."
    });
});