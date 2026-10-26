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
    "js/content/cities.js",
    "js/content/events.js",
    "js/content/events-daily.js",
    "js/content/events-family.js",
    "js/content/activities.js",
    "js/content/endings.js",
    "js/art/fluent.js",
    "js/art/character.js",
    "js/art/scene.js",
    "js/engine.js",
  ])
    vm.runInContext(
      fs.readFileSync(path.join(__dirname, "..", f), "utf8"),
      ctx,
      { filename: f },
    );
  return ctx.HS;
};
