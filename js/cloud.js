// Hesap bağlama: iPhone'da Game Center, Android'de Google Play Games.
// Uygulama (Capacitor) içinde yerel eklenti (@idleflowgames/capacitor-play-games) varsa:
// giriş, buluta yedek (saved games), başarımlar ve sıralama tablosu çalışır.
// Tarayıcıda eklenti yoktur; o zaman kayıt kodu ile taşıma kullanılır.
(function (HS) {
  "use strict";
  const plugin = () => {
    const C = globalThis.Capacitor;
    return C && C.isNativePlatform && C.isNativePlatform() && C.Plugins && C.Plugins.PlayGames ? C.Plugins.PlayGames : null;
  };
  const platform = () => {
    const C = globalThis.Capacitor;
    return C && C.getPlatform ? C.getPlatform() : "web";
  };
  // Mağaza konsollarında oluşturulan kimlikler. iOS'ta başarım kimliklerini oyundaki kimlikle aynı
  // (ön ekli) oluşturmak yeterli; Google Play kimlikleri konsolun verdiği kodlardır, buraya yazılır.
  HS.PLATFORM_IDS = HS.PLATFORM_IDS || {
    ios: { achPrefix: "hs_", leaderboard: "hs_networth" },
    android: { ach: {}, leaderboard: "" },
  };
  const SNAP = "hayatlar";
  const st = { ready: false, signedIn: false, player: null, busy: false, last: 0, error: null };
  const Cloud = {
    get available() {
      return !!plugin();
    },
    get serviceName() {
      return platform() === "ios" ? "Game Center" : platform() === "android" ? "Google Play Games" : "Oyun hesabı";
    },
    get state() {
      return st;
    },
    async init(onChange) {
      const P = plugin();
      if (!P || st.ready) return;
      try {
        await P.initialize();
        st.ready = true;
        const r = await P.signIn({ silent: true });
        st.signedIn = !!r.signedIn;
        st.player = r.player || null;
        P.addListener("signInStateChanged", (x) => {
          st.signedIn = !!x.signedIn;
          st.player = x.player || null;
          onChange && onChange();
        });
      } catch (e) {
        st.error = String(e && e.message ? e.message : e);
      }
      onChange && onChange();
    },
    async signIn() {
      const P = plugin();
      if (!P) throw new Error("Bu özellik uygulama sürümünde çalışır.");
      if (!st.ready) await this.init();
      const r = await P.signIn({ silent: false });
      st.signedIn = !!r.signedIn;
      st.player = r.player || null;
      if (!st.signedIn) throw new Error(r.reason || "Giriş yapılmadı.");
      return st.player;
    },
    // Bütün hayatları buluta yazar (son yazılan kazanır)
    async backup(saves) {
      const P = plugin();
      if (!P || !st.signedIn || !st.player) return false;
      st.busy = true;
      try {
        await P.saveSnapshot({ name: SNAP, data: JSON.stringify({ v: 1, at: Date.now(), saves }), description: saves.length + " hayat", expectedPlayerId: st.player.playerId });
        st.last = Date.now();
        return true;
      } finally {
        st.busy = false;
      }
    },
    async restore() {
      const P = plugin();
      if (!P || !st.signedIn) return null;
      const { snapshot } = await P.loadSnapshot({ name: SNAP });
      if (!snapshot || !snapshot.data) return null;
      const o = JSON.parse(snapshot.data);
      return { saves: Array.isArray(o.saves) ? o.saves : [], at: o.at || snapshot.modifiedAt };
    },
    // Otomatik yedek: en fazla 2 dakikada bir
    autoBackup(saves) {
      if (!st.signedIn || st.busy || Date.now() - st.last < 120000) return;
      this.backup(saves).catch(() => {});
    },
    unlock(achId) {
      const P = plugin();
      if (!P || !st.signedIn) return;
      const ids = HS.PLATFORM_IDS[platform()] || {};
      const id = platform() === "ios" ? (ids.achPrefix || "") + achId : ids.ach && ids.ach[achId];
      if (id) P.unlockAchievement({ id }).catch(() => {});
    },
    submitNetWorth(value) {
      const P = plugin();
      const ids = HS.PLATFORM_IDS[platform()] || {};
      if (!P || !st.signedIn || !ids.leaderboard || !(value > 0)) return;
      P.submitScore({ leaderboardId: ids.leaderboard, score: Math.round(value) }).catch(() => {});
    },
    showAchievements() {
      const P = plugin();
      return P && st.signedIn ? P.showAchievements() : Promise.resolve();
    },
    showLeaderboard() {
      const P = plugin();
      const ids = HS.PLATFORM_IDS[platform()] || {};
      return P && st.signedIn && ids.leaderboard ? P.showLeaderboard({ leaderboardId: ids.leaderboard }) : Promise.resolve();
    },
  };
  HS.Cloud = Cloud;
})(globalThis.HS || (globalThis.HS = {}));
