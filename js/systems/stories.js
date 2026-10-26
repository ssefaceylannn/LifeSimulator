// Hikâyeler: birbirine bağlı, aşama aşama ilerleyen olay zincirleri ve hayat boyu kalıcı
// tanıdıklar (komşu, en yakın arkadaş, iş arkadaşı, bakkal...). Aynı kişi farklı
// hikâyelerde karşına çıkar; bir hikâyenin sonucu başka bir hikâyenin kapısını açar.
//
// Kullanım (js/content/stories-*.js):
//   HS.story("kombi", {
//     when: (s) => ...,            // başlama koşulu
//     weight: 0.6,                 // başlama ağırlığı (sayı ya da fonksiyon)
//     room: "mutfak",              // isteğe bağlı oda
//     title, text, choices,        // ilk olay (olay tanımıyla aynı biçim)
//     steps: {                     // sonraki aşamalar
//       usta: { gap: 2, when?, title, text, choices },
//     },
//   });
// Seçeneklerde: { go: "usta" }  → hikâyeyi "usta" aşamasına taşır (gap hafta sonra gelir)
//               { end: "tamir" } → hikâyeyi "tamir" sonucuyla bitirir
//               { set: {k: v} }  → hikâyeye özel değer saklar (h.d ile okunur)
//               { rel: {komsu: 5} } → tanıdıkla ilişki
// Diğer hikâyeler HS.done(s, "kombi") ile sonucu, HS.cast(s, "komsu") ile kişiyi okur.
(function (HS) {
  "use strict";
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const r = () => HS.rng();
  const W = ["Ayşe", "Gül", "Nermin", "Sevim", "Filiz", "Canan", "Yasemin", "Pınar", "Burcu", "Ezgi", "Damla", "Ceren", "Aslı", "Özge", "Tuba", "Şule", "Nazlı", "Ebru", "Gamze", "Dilek", "Hande", "İrem", "Sinem", "Neslihan"];
  const M = ["Kadir", "Levent", "Sinan", "Tarık", "Barış", "Erkan", "Gökhan", "Taner", "Ferhat", "Özgür", "Uğur", "Selim", "Cenk", "Koray", "Alper", "Berk", "Doğan", "Hakan", "Ercan", "Yiğit", "Batuhan", "Furkan", "Tayfun", "Ilgaz"];
  // Rol: [etiket, yaş farkı aralığı, kadın olasılığı]
  HS.CAST_ROLES = {
    komsu: ["Komşun", [-10, 40], 0.55],
    enYakin: ["En yakın arkadaşın", [-1, 2], 0.5],
    isArk: ["İş arkadaşın", [-4, 10], 0.5],
    yonetici: ["Yöneticin", [6, 20], 0.4],
    liseArk: ["Liseden arkadaşın", [0, 0], 0.5],
    bakkal: ["Mahalle bakkalı", [15, 35], 0.2],
    usta: ["Tanıdık usta", [8, 30], 0.05],
    yonetim: ["Apartman yöneticisi", [10, 35], 0.35],
    doktor: ["Aile hekimin", [5, 25], 0.55],
  };
  // Hayat boyu sabit tanıdık: ilk istendiğinde oluşur
  HS.cast = (s, role) => {
    s.cast = s.cast || {};
    if (s.cast[role]) return s.cast[role];
    const R = HS.CAST_ROLES[role] || ["Tanıdığın", [0, 10], 0.5];
    const woman = r() < R[2];
    const used = new Set([s.first, s.partner && s.partner.name, ...(s.kin || []).map((k) => k.name), ...Object.values(s.cast).map((x) => x.name)]);
    const list = (woman ? W : M).filter((n) => !used.has(n));
    const name = list[(r() * list.length) | 0] || (woman ? W[0] : M[0]);
    const age = Math.max(16, s.age + R[1][0] + Math.round(r() * (R[1][1] - R[1][0])));
    return (s.cast[role] = { role, name, woman, born: s.year - age, rel: 50, met: s.weeks });
  };
  HS.castName = (s, role) => HS.cast(s, role).name;
  HS.castRel = (s, role) => (s.cast && s.cast[role] ? s.cast[role].rel : 50);
  HS.FX.rel = (s, v) => Object.entries(v).forEach(([k, n]) => {
    const x = HS.cast(s, k);
    x.rel = clamp(x.rel + n, 0, 100);
  });

  function init(s) {
    s.cast = s.cast || {};
    s.story = s.story || {};
    s.storyDone = s.storyDone || {};
  }
  HS.HOOKS.newLife.push(init);
  HS.HOOKS.migrate.push(init);

  HS.done = (s, id) => (s.storyDone ? s.storyDone[id] : undefined);
  HS.inStory = (s, id) => !!(s.story && s.story[id]);
  HS.storyData = (s, id) => (s.story[id] && s.story[id].d) || (s.storyData_ && s.storyData_[id]) || {};
  const ensure = (s, id) => {
    if (!id) return null;
    if (!s.story[id] && s.storyDone[id] === undefined) s.story[id] = { k: null, at: s.weeks, d: {} };
    return s.story[id];
  };

  // Seçim etkileri: go/end/set. Etkinin hangi hikâyeye ait olduğu fx._st ile taşınır.
  HS.FX._st = () => {};
  HS.FX.go = (s, key, fx) => {
    const st = ensure(s, fx._st);
    if (!st) return;
    st.k = key;
    st.at = s.weeks;
  };
  HS.FX.end = (s, out, fx) => {
    const id = fx._st;
    const st = s.story[id];
    s.storyDone[id] = out || "bitti";
    (s.storyData_ = s.storyData_ || {})[id] = st ? st.d : {};
    delete s.story[id];
  };
  HS.FX.set = (s, v, fx) => {
    const st = ensure(s, fx._st);
    if (st) Object.assign(st.d, v);
  };
  // Hikâye başlatan seçenek: fx._start ile hikâye kaydı açılır (go/end yoksa hemen kapanır)
  HS.FX._start = (s, id, fx) => {
    // go/end bu noktada zaten işlendi (anahtar sırası ve şans sonucu önce uygulanır)
    const st = ensure(s, id);
    if (st && st.k === null) HS.FX.end(s, "kapandi", fx);
  };

  // Seçenek etkilerine hikâye kimliğini ekle (şans sonuçları dahil)
  const tag = (fx, id, start) => {
    if (!fx || typeof fx !== "object") return fx;
    const o = { ...fx, _st: id };
    if (start) o._start = id;
    if (o.chance) {
      o.chance = { ...o.chance };
      if (o.chance.win) o.chance.win = { ...o.chance.win, _st: id };
      if (o.chance.lose) o.chance.lose = { ...o.chance.lose, _st: id };
    }
    return o;
  };
  const wrapChoices = (choices, id, start) => (s, h) => {
    const list = typeof choices === "function" ? choices(s, h) : choices;
    return list.filter(Boolean).map((ch) => ({
      ...ch,
      fx: typeof ch.fx === "function" ? (s2, h2) => tag(ch.fx(s2, h2), id, start) : tag(ch.fx || {}, id, start),
    }));
  };
  // h'ye hikâye verisini ekle
  const withD = (fn, id) =>
    typeof fn === "function"
      ? (s, h) => fn(s, Object.assign({}, h, { d: (s.story[id] && s.story[id].d) || {}, cast: (role) => HS.cast(s, role) }))
      : fn;

  HS.STORIES = HS.STORIES || {};
  HS.story = (id, def) => {
    HS.STORIES[id] = def;
    const age = (s) => (!def.minAge || s.age >= def.minAge) && (!def.maxAge || s.age <= def.maxAge);
    HS.EVENTS.push({
      id: "st_" + id,
      once: true,
      story: id,
      room: def.room,
      weekend: def.weekend,
      cooldown: 999,
      weight: def.weight ?? 0.6,
      when: (s) => s.story && !s.story[id] && s.storyDone[id] === undefined && age(s) && (!def.when || def.when(s)),
      title: withD(def.title, id),
      text: withD(def.text, id),
      choices: wrapChoices(withD(def.choices, id), id, true),
    });
    for (const [k, st] of Object.entries(def.steps || {})) {
      HS.EVENTS.push({
        id: "st_" + id + "_" + k,
        once: true,
        story: id,
        room: st.room || def.room,
        cooldown: 999,
        // Sırası gelen aşama, havuzdaki rastgele olaylardan önce gelsin diye yüksek ağırlık
        weight: st.weight ?? 3,
        when: (s) => {
          const x = s.story && s.story[id];
          if (!x || x.k !== k || s.weeks - x.at < (st.gap ?? 2)) return false;
          return !st.when || st.when(s, x.d);
        },
        title: withD(st.title, id),
        text: withD(st.text, id),
        choices: wrapChoices(withD(st.choices, id), id, false),
      });
    }
  };
  // Süreç olayları (mesai, sınav hatırlatması...) doğası gereği tekrar eder; yenilik cezası almaz.
  ["satMesai", "shiftSwap", "weekendRest", "examQuiz", "examReminder", "examMock"].forEach((id) => {
    const e = HS.EVENTS.find((x) => x.id === id);
    if (e) e.repeat = true;
  });
  // Aşaması uzun süre gelemeyen hikâyeleri kapat (koşulu artık tutmuyorsa)
  HS.HOOKS.weekly.push((s) => {
    for (const [id, x] of Object.entries(s.story || {})) {
      if (s.weeks - x.at > 80) HS.FX.end(s, "unutuldu", { _st: id });
    }
  });
})(globalThis.HS || (globalThis.HS = {}));
