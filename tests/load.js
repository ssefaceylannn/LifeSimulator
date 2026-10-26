// Oyun dosyalarını Node içinde tarayıcıdaki sırayla yükler.
const fs = require("fs"),
  path = require("path"),
  vm = require("vm");
module.exports = function load() {
  const ctx = {
    console,
    Math,
    Date,
    JSON,
    Object,
    Array,
    String,
    Number,
    Set,
    Map,
  };
  ctx.globalThis = ctx;
  vm.createContext(ctx);
  for (const f of [
    "js/content/economy.js",
    "js/content/config.js",
    "js/content/cities.js",
    "js/content/costs.js",
    "js/content/events.js",
    "js/content/events-daily.js",
    "js/content/events-family.js",
    "js/content/events-life.js",
    "js/content/activities.js",
    "js/content/endings.js",
    "js/content/questions.js",
    "js/art/fluent.js",
    "js/art/character.js",
    "js/art/scene.js",
    "js/art/rooms.js",
    "js/art/turkey-map.js",
    "js/engine.js",
    "js/systems/body.js",
    "js/systems/skills.js",
    "js/systems/companies.js",
    "js/systems/invest.js",
    "js/systems/migration.js",
    "js/systems/housing.js",
    "js/systems/music.js",
    "js/systems/time.js",
    "js/systems/bank.js",
    "js/systems/life.js",
    "js/systems/budget.js",
    "js/systems/family.js",
    "js/systems/exam.js",
    "js/systems/calendar.js",
    "js/systems/realism.js",
    "js/systems/achievements.js",
  ])
    vm.runInContext(
      fs.readFileSync(path.join(__dirname, "..", f), "utf8"),
      ctx,
      { filename: f },
    );
  return ctx.HS;
};
