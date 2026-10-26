// Gelir modeli: reklamlar ve uygulama içi satın almalar (yalnızca App Store / Google Play uygulamasında).
//
// Ücretsiz oyuncu:
//  - Birkaç haftada bir (en az 4 dakika arayla, ilk 25 turdan sonra) tam ekran reklam görür.
//  - İsterse ödüllü reklam izler: haftada bir +2 boş zaman, ayda bir harçlık, son kararı geri alma.
//  - Aynı anda en fazla 3 yaşayan hayat; "Çok hızlı" oyun hızı ve "Oyun dengesi" ayarları kilitli.
// Satın almalar:
//  - Reklamsız (kalıcı): tam ekran reklamlar kalkar.
//  - Premium (kalıcı): reklamsız + bütün kilitler açılır + ödüllü avantajlar reklam izlemeden gelir.
//  - Para paketleri (tüketilebilir): oyundaki karaktere para.
// İnternet yoksa reklam gösterilemez; oyun yine oynanır. Kilitli özellikler internetle açılmaz,
// yalnızca satın almayla açılır (satın alma cihazda saklanır, "Satın alımları geri yükle" ile döner).
// Tarayıcı sürümünde mağaza yoktur: reklam çıkmaz ve bütün özellikler açıktır.
(function (HS) {
  "use strict";
  const P = (name) => {
    const C = globalThis.Capacitor;
    return C && C.isNativePlatform && C.isNativePlatform() && C.Plugins && C.Plugins[name] ? C.Plugins[name] : null;
  };
  const platform = () => (globalThis.Capacitor && Capacitor.getPlatform ? Capacitor.getPlatform() : "web");
  const KEY = "hayatSimShopV1";
  const BUNDLE = "com.hayatsimulatoru.oyun";
  HS.PRODUCTS = [
    { id: BUNDLE + ".premium", kind: "premium", name: "Premium", desc: "Reklamsız + bütün özellikler: Oyun dengesi ayarları, Çok hızlı oyun, sınırsız hayat, kararı geri alma ve haftalık avantajlar reklamsız.", consumable: false, fallback: "₺249,99" },
    { id: BUNDLE + ".reklamsiz", kind: "noads", name: "Reklamsız", desc: "Tam ekran reklamlar kalıcı olarak kalkar.", consumable: false, fallback: "₺129,99" },
    { id: BUNDLE + ".para1", kind: "cash", amount: 50000, name: "Cep harçlığı", desc: "Karakterine ₺50.000 (2026 fiyatıyla).", consumable: true, fallback: "₺39,99" },
    { id: BUNDLE + ".para2", kind: "cash", amount: 250000, name: "Kumbara", desc: "Karakterine ₺250.000 (2026 fiyatıyla).", consumable: true, fallback: "₺99,99" },
    { id: BUNDLE + ".para3", kind: "cash", amount: 1000000, name: "Miras", desc: "Karakterine ₺1.000.000 (2026 fiyatıyla).", consumable: true, fallback: "₺249,99" },
  ];
  // Reklam birimleri. Varsayılanlar Google'ın test birimleridir; mağaza derlemesinde iş akışı
  // gerçek kimlikleri (GitHub gizli değişkenleri) buraya yazar.
  HS.AD_IDS = {
    ios: { interstitial: "__ADMOB_IOS_INTERSTITIAL__", rewarded: "__ADMOB_IOS_REWARDED__" },
    android: { interstitial: "__ADMOB_ANDROID_INTERSTITIAL__", rewarded: "__ADMOB_ANDROID_REWARDED__" },
  };
  const TEST = {
    ios: { interstitial: "ca-app-pub-3940256099942544/4411468910", rewarded: "ca-app-pub-3940256099942544/1712485313" },
    android: { interstitial: "ca-app-pub-3940256099942544/1033173712", rewarded: "ca-app-pub-3940256099942544/5224354917" },
  };
  const adId = (kind) => {
    const v = (HS.AD_IDS[platform()] || {})[kind];
    return v && !v.startsWith("__") ? { id: v, test: false } : { id: (TEST[platform()] || TEST.android)[kind], test: true };
  };

  let st = { owned: {}, turns: 0, lastAd: 0, rewards: {} };
  try {
    st = Object.assign(st, JSON.parse(localStorage.getItem(KEY)) || {});
  } catch (e) {}
  const persist = () => {
    try {
      localStorage.setItem(KEY, JSON.stringify(st));
    } catch (e) {}
  };
  const prices = {};
  let adsReady = false,
    canAds = false,
    interLoaded = false,
    rewardLoaded = false;

  const Shop = {
    // Mağaza (satın alma) bu cihazda var mı?
    get native() {
      return !!P("NativePurchases") || !!P("AdMob");
    },
    get premium() {
      return !this.native || !!st.owned.premium;
    },
    get adFree() {
      return this.premium || !!st.owned.noads;
    },
    owned: (kind) => !!st.owned[kind],
    price: (p) => prices[p.id] || p.fallback,
    // Ücretsiz sürüm sınırları
    LIFE_LIMIT: 3,
    locked(feature) {
      if (this.premium) return false;
      return ["balance", "turbo", "lives", "undo"].includes(feature);
    },
    async init() {
      const IAP = P("NativePurchases");
      if (IAP) {
        try {
          const { products } = await IAP.getProducts({ productIdentifiers: HS.PRODUCTS.map((p) => p.id), productType: "inapp" });
          (products || []).forEach((x) => (prices[x.identifier] = x.priceString));
        } catch (e) {}
        this.refreshOwned().catch(() => {});
      }
      // İzleme izni (ATT) Game Center girişinden önce sorulmalı; bu yüzden beklenir
      if (!this.adFree) await this.initAds().catch(() => {});
    },
    async refreshOwned() {
      const IAP = P("NativePurchases");
      if (!IAP) return;
      const { purchases } = await IAP.getPurchases({ productType: "inapp" });
      for (const t of purchases || []) {
        const p = HS.PRODUCTS.find((x) => x.id === t.productIdentifier);
        if (p && !p.consumable && (t.purchaseState === undefined || String(t.purchaseState) === "1" || t.purchaseState === "PURCHASED" || platform() === "ios")) st.owned[p.kind] = true;
      }
      persist();
    },
    // Satın al: tüketilebilirse karaktere uygular
    async buy(p, s) {
      const IAP = P("NativePurchases");
      if (!IAP) throw new Error("Satın alma yalnızca uygulama sürümünde.");
      const t = await IAP.purchaseProduct({ productIdentifier: p.id, productType: "inapp", quantity: 1, isConsumable: !!p.consumable, autoAcknowledgePurchases: true });
      if (!t) throw new Error("Satın alma tamamlanmadı.");
      if (p.consumable) {
        if (s) {
          HS.earn(s, p.name + " (mağaza)", p.amount * s.idx.cpi);
          s.flags.bought = (s.flags.bought || 0) + 1;
        }
      } else {
        st.owned[p.kind] = true;
        persist();
      }
      return true;
    },
    async restore() {
      const IAP = P("NativePurchases");
      if (!IAP) return false;
      await IAP.restorePurchases();
      await this.refreshOwned();
      return !!(st.owned.premium || st.owned.noads);
    },

    // ---- Reklam ----
    async initAds() {
      const A = P("AdMob");
      if (!A || adsReady) return;
      adsReady = true;
      // AB/İngiltere gibi yerlerde izin formu (UMP), iPhone'da izleme izni (ATT)
      try {
        let ci = await A.requestConsentInfo();
        if (ci.isConsentFormAvailable && ci.status === "REQUIRED") ci = await A.showConsentForm();
        canAds = ci.canRequestAds !== false;
        st.privacyForm = ci.privacyOptionsRequirementStatus === "REQUIRED";
      } catch (e) {
        canAds = true;
      }
      if (platform() === "ios") {
        try {
          const t = await A.trackingAuthorizationStatus();
          if (t.status === "notDetermined") await A.requestTrackingAuthorization();
        } catch (e) {}
      }
      if (!canAds) return;
      await A.initialize({ initializeForTesting: adId("interstitial").test, maxAdContentRating: "MatureAudience" });
      this.loadInter();
      this.loadReward();
    },
    loadInter() {
      const A = P("AdMob");
      if (!A || this.adFree || !canAds) return;
      const a = adId("interstitial");
      A.prepareInterstitial({ adId: a.id, isTesting: a.test }).then(
        () => (interLoaded = true),
        () => (interLoaded = false),
      );
    },
    loadReward() {
      const A = P("AdMob");
      if (!A || !canAds) return;
      const a = adId("rewarded");
      A.prepareRewardVideoAd({ adId: a.id, isTesting: a.test }).then(
        () => (rewardLoaded = true),
        () => (rewardLoaded = false),
      );
    },
    get privacyForm() {
      return !!st.privacyForm;
    },
    showPrivacyForm() {
      const A = P("AdMob");
      return A ? A.showPrivacyOptionsForm() : Promise.resolve();
    },
    // Hafta bitince çağrılır: belli aralıklarla tam ekran reklam
    onTurn() {
      st.turns++;
      persist();
      if (this.adFree || !interLoaded || st.turns < 25 || st.turns % 6 !== 0 || Date.now() - st.lastAd < 240000) return;
      const A = P("AdMob");
      interLoaded = false;
      st.lastAd = Date.now();
      persist();
      A.showInterstitial().then(
        () => this.loadInter(),
        () => this.loadInter(),
      );
    },
    // Ödüllü avantaj: premium'da reklamsız, değilse ödüllü reklam izlenir
    rewardReady() {
      return this.premium || rewardLoaded;
    },
    async reward() {
      if (this.premium) return true;
      const A = P("AdMob");
      if (!A || !rewardLoaded) throw new Error("Reklam şu an yok (internet bağlantını kontrol et).");
      rewardLoaded = false;
      try {
        const item = await A.showRewardVideoAd();
        return !!item;
      } finally {
        this.loadReward();
      }
    },
  };
  HS.Shop = Shop;

  // Ödüllü avantajlar (oyun içinde sıklık sınırlı)
  HS.PERKS = {
    free: { label: "+2 boş zaman", every: 1, hint: "Haftada bir" },
    cash: { label: "Harçlık", every: 4, hint: "Ayda bir" },
  };
  HS.perkLeft = (s, k) => {
    const last = (s.perks || {})[k];
    return last === undefined ? 0 : Math.max(0, HS.PERKS[k].every - (s.weeks - last));
  };
  HS.perkCash = (s) => Math.max(2000 * s.idx.cpi, (HS.wage ? HS.wage(s) : 0) * 0.15);
  HS.applyPerk = (s, k) => {
    s.perks = s.perks || {};
    s.perks[k] = s.weeks;
    if (k === "free") s.free = (s.free || 0) + 2;
    if (k === "cash") HS.earn(s, "Harçlık (ödül)", HS.perkCash(s));
  };
})(globalThis.HS || (globalThis.HS = {}));
