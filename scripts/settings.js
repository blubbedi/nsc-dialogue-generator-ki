Hooks.once('init', () => {
  game.settings.register('nsc-dialogue-generator-ki', 'apiKey', {
    name: "Gemini API Key",
    hint: "Dein API-Key aus dem Google AI Studio.",
    scope: "world",
    config: true,
    type: String,
    default: "",
    password: true
  });

  game.settings.register('nsc-dialogue-generator-ki', 'worldLore', {
    name: "Globale Welt-Lore",
    hint: "Informationen, die alle NSCs deiner Kampagne kennen sollten.",
    scope: "world",
    config: true,
    type: String,
    default: "High Fantasy Setting. Ishkandrael ist ein legendäres Artefakt aus drei Teilen.",
  });
});