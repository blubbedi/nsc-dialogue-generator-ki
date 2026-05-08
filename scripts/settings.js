Hooks.once('init', () => {
    game.settings.register('nsc-dialogue-generator-ki', 'apiKey', {
        name: "Gemini API Key",
        hint: "Dein Key von Google AI Studio.",
        scope: "world",
        config: true,
        type: String,
        default: "",
        password: true
    });

    game.settings.register('nsc-dialogue-generator-ki', 'worldLore', {
        name: "Globale Welt-Lore",
        hint: "Infos, die jeder NSC kennt.",
        scope: "world",
        config: true,
        type: String,
        default: "Das Setting ist High Fantasy Realismus. Ishkandrael ist ein zerbrochenes Artefakt."
    });
});