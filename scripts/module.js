Hooks.once('ready', async () => {
  if (game.user.isGM && !game.folders.find(f => f.name === "Dialog-Nsc" && f.type === "Actor")) {
    await Folder.create({ name: "Dialog-Nsc", type: "Actor", parent: null });
  }
});

Hooks.on('renderActorSheet', (app, html) => {
  if (app.actor.type !== 'npc') return;
  const nav = html.find('.sheet-tabs');
  nav.append('<a class="item" data-tab="gemini">Gemini KI</a>');
  
  const body = html.find('.sheet-body');
  body.append(`
    <div class="tab gemini" data-group="primary" data-tab="gemini">
      <div class="form-group stacked">
        <label>Bedingungen & NSC-Wissen</label>
        <textarea name="flags.nsc-dialogue-generator-ki.conditions" style="min-height: 150px;">${app.actor.getFlag('nsc-dialogue-generator-ki', 'conditions') || ''}</textarea>
      </div>
    </div>`);
});

Hooks.on('getSceneControlButtons', (controls) => {
  if (!game.user.isGM) return;
  const notes = controls.find(c => c.name === "notes");
  notes.tools.push({
    name: "gemini-dialog",
    title: "KI Dialog starten",
    icon: "fas fa-brain",
    onClick: () => new GeminiStarterApp().render(true),
    button: true
  });
});

class GeminiStarterApp extends Application {
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      template: "modules/nsc-dialogue-generator-ki/templates/starter.html",
      title: "Dialog Setup",
      width: 350
    });
  }

  getData() {
    return {
      npcs: game.actors.filter(a => a.type === 'npc' && a.folder?.name === "Dialog-Nsc"),
      players: game.users.filter(u => u.active && u.character).map(u => u.character)
    };
  }

  activateListeners(html) {
    html.find('#start-btn').click(() => {
      const p = game.actors.get(html.find('#p-select').val());
      const n = game.actors.get(html.find('#n-select').val());
      if(!p || !n) return ui.notifications.warn("Bitte Spieler und NSC wählen!");
      new GeminiDialogApp(p, n).render(true);
      this.close();
    });
  }
}