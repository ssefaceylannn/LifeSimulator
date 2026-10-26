// Sokak sahnesi: karakter evinin önünde. Gökyüzü mevsime, siluet şehre,
// ev barınma durumuna, araba sahip olunan modele, bina işe göre değişir.
// HS.Art.scene(s) → <svg> metni (400×260).
(function (HS) {
  "use strict";
  const Art = (HS.Art = HS.Art || {});
  const F = (name, x, y, size, extra = "") => {
    const a = HS.FLUENT && HS.FLUENT[name];
    if (!a) return "";
    return `<svg x="${x}" y="${y}" width="${size}" height="${size}" viewBox="${a.vb}" ${extra}>${a.inner}</svg>`;
  };
  Art.fluent = F;
  // Çizimi gerçek sınırlarına göre yerleştirir: alt-orta noktası (cx, bottom), genişliği w.
  const G = (name, cx, bottom, w, extra = "") => {
    const a = HS.FLUENT && HS.FLUENT[name];
    if (!a) return "";
    const [bx, by, bw, bh] = a.box;
    const k = w / bw;
    return F(
      name,
      cx - (bx + bw / 2) * k,
      bottom - (by + bh) * k,
      32 * k,
      extra,
    );
  };
  Art.place = G;
  let skyId = 0;
  const pick = (arr, n) => arr[Math.abs(n) % arr.length];

  // ---- mevsim ve gökyüzü ----
  function season(s) {
    const w = s.week;
    return w <= 9 || w >= 49
      ? "kis"
      : w <= 22
        ? "ilkbahar"
        : w <= 35
          ? "yaz"
          : "sonbahar";
  }
  Art.season = season;
  const SKY = {
    kis: ["#b7cbe2", "#eaf1f8"],
    ilkbahar: ["#86bdf0", "#e4f2ff"],
    yaz: ["#64acee", "#dcefff"],
    sonbahar: ["#9fbad6", "#f2e9dc"],
    gece: ["#18243d", "#3e5277"],
  };
  const GRASS = {
    kis: "#e9eff5",
    ilkbahar: "#bfe3a8",
    yaz: "#a9d68e",
    sonbahar: "#d9c792",
  };
  const COLD = ["ic", "dogu", "karadeniz", "abroad"];

  // ---- uzak siluetler ----
  const SIL = "#c4d5ea";
  const SIL2 = "#b1c7e2";
  const silhouettes = {
    metro: () =>
      `<g fill="${SIL}">${[
        [150, 70],
        [168, 92],
        [190, 58],
        [214, 84],
        [236, 66],
        [258, 96],
        [280, 74],
      ]
        .map(
          ([x, h]) =>
            `<rect x="${x}" y="${150 - h}" width="18" height="${h}" rx="2"/>`,
        )
        .join("")}</g>`,
    mosque: () =>
      `<g fill="${SIL2}"><path d="M40 150v-22q0-18 26-22q26 4 26 22v22z"/><rect x="62" y="96" width="8" height="12" rx="3"/><rect x="28" y="88" width="5" height="62"/><path d="M27 88l3.5-12 3.5 12z"/><rect x="99" y="88" width="5" height="62"/><path d="M98 88l3.5-12 3.5 12z"/></g>`,
    bridge: () =>
      `<g stroke="${SIL2}" fill="none" stroke-width="2"><path d="M300 150V96M360 150V96"/><path d="M260 132q40-38 40-36q30 30 60 0q0-2 40 36" /><path d="M250 136h160" stroke-width="3"/></g>`,
    tower: () =>
      `<g fill="${SIL2}"><rect x="320" y="70" width="5" height="80"/><ellipse cx="322.5" cy="78" rx="11" ry="7"/><rect x="321.5" y="48" width="2" height="22"/></g>`,
    clock: () =>
      `<g fill="${SIL2}"><rect x="330" y="92" width="16" height="58"/><path d="M328 92l10-14 10 14z"/><circle cx="338" cy="102" r="5" fill="${SIL}"/></g>`,
    mountain: () =>
      `<path fill="${SIL}" d="M-10 150l70-62 40 30 50-48 70 80z"/><path fill="#f4f8fc" d="M150 70l14 13-8-2-6 6-6-6-8 2z" opacity=".9"/>`,
    castle: () =>
      `<g fill="${SIL2}"><path d="M200 150q30-26 90-26t90 26z"/><path d="M250 128v-16h6v6h6v-6h6v6h6v-6h6v16z"/></g>`,
    abroad: () =>
      `<g fill="${SIL2}"><rect x="40" y="96" width="14" height="54"/><path d="M38 96l9-30 9 30z"/><rect x="120" y="106" width="60" height="44"/><path d="M118 106l32-18 32 18z"/></g>`,
  };
  function sea(s, night) {
    return (
      `<rect x="0" y="136" width="400" height="22" fill="${night ? "#2c4a73" : "#8cc3ea"}"/>` +
      `<path d="M0 142q10-3 20 0t20 0 20 0 20 0 20 0 20 0 20 0 20 0 20 0 20 0 20 0 20 0 20 0 20 0 20 0 20 0 20 0 20 0 20 0 20 0" fill="none" stroke="#ffffff" stroke-opacity=".5"/>` +
      `<g class="hs-ferry">${G("ferry", 20, 152, 30)}</g>`
    );
  }

  // ---- evler (tabanı y=200) ----
  const WALLS = [
    ["#f4dcb6", "#e6c391"],
    ["#f2cbb0", "#dfa98a"],
    ["#e7e0cf", "#cfc4ab"],
    ["#d9e5ef", "#b8cadb"],
    ["#e6d4ec", "#c9b3d4"],
  ];
  function windowsGrid(x0, y0, cols, rows, w, h, gx, gy, fill, lit) {
    let o = "";
    for (let r = 0; r < rows; r++)
      for (let c = 0; c < cols; c++) {
        const on = lit && (r * cols + c) % 5 === lit % 5;
        o += `<rect x="${x0 + c * gx}" y="${y0 + r * gy}" width="${w}" height="${h}" rx="2" fill="${on ? "#ffe9a8" : fill}"/>`;
      }
    return o;
  }
  const HOMES = {
    // Eski, sıcak renkli aile apartmanı: balkon, çamaşır ipi, saksı, çanak anten
    aile: (v) => {
      const [w, d] = pick(WALLS, v);
      return (
        `<rect x="205" y="78" width="150" height="122" fill="${w}"/><rect x="200" y="72" width="160" height="8" fill="${d}"/>` +
        `<path d="M330 72v-10M322 60q8-8 16 0" stroke="#8a96a8" stroke-width="2" fill="none"/>` +
        windowsGrid(216, 88, 4, 3, 18, 20, 34, 34, "#9fc3e6") +
        `<g fill="none" stroke="${d}" stroke-width="2">${[108, 142].map((y) => `<path d="M212 ${y}h136"/><path d="M212 ${y - 6}h136"/>`).join("")}</g>` +
        `<path d="M218 116q15 6 30 0" stroke="#9aa6b5" fill="none"/><rect x="222" y="116" width="7" height="9" fill="#e85d75"/><rect x="236" y="117" width="7" height="8" fill="#4a86d8"/>` +
        `<g>${[300, 318].map((x) => `<rect x="${x}" y="134" width="8" height="7" fill="#c46a3d"/><circle cx="${x + 4}" cy="131" r="5" fill="#5aa65a"/>`).join("")}</g>` +
        `<rect x="268" y="166" width="26" height="34" rx="2" fill="#7a5638"/><path d="M262 164h38l-4-6h-30z" fill="${d}"/>`
      );
    },
    // Ev arkadaşıyla kiralık: eski, gri bej blok, klimalar
    paylasim: (v) =>
      `<rect x="215" y="48" width="130" height="152" fill="${pick(["#d7d2c8", "#cfd5db", "#d8cdbb"], v)}"/>` +
      windowsGrid(226, 58, 4, 5, 16, 18, 30, 27, "#a9c4dd", v + 2) +
      `<g fill="#eef1f4">${[64, 118, 145].map((y, i) => `<rect x="${i % 2 ? 330 : 222}" y="${y + 14}" width="12" height="7"/>`).join("")}</g>` +
      `<rect x="268" y="172" width="22" height="28" fill="#6c5847"/>`,
    // Modern kiralık daire bloğu
    kira: (v) =>
      `<rect x="215" y="36" width="140" height="164" fill="#f7f9fc"/><rect x="215" y="36" width="140" height="6" fill="#dde6f1"/>` +
      `<g fill="${pick(["#7fb0e3", "#8fc0e0", "#9db7ea"], v)}">${[46, 72, 98, 124, 150].map((y) => `<rect x="224" y="${y}" width="56" height="18" rx="2"/><rect x="290" y="${y}" width="56" height="18" rx="2"/>`).join("")}</g>` +
      `<g stroke="#c4d1e0" stroke-width="1.5">${[66, 92, 118, 144].map((y) => `<path d="M222 ${y}h126"/>`).join("")}</g>` +
      `<rect x="272" y="174" width="26" height="26" fill="#4d6a8c"/>`,
    // Satın alınmış daire: aynı modern blok, sıcak renk, kapıda "EVİM"
    daire: (v) =>
      HOMES.kira(v) +
      `<rect x="300" y="178" width="22" height="9" rx="2" fill="#2f6fd6"/><text x="311" y="185" font-size="6" text-anchor="middle" fill="#fff" font-family="sans-serif" font-weight="700">EVİM</text>` +
      `<circle cx="262" cy="192" r="7" fill="#5aa65a"/><rect x="258" y="192" width="8" height="8" fill="#c46a3d"/>`,
    // Müstakil bahçeli ev (Fluent çizimi)
    mustakil: () => G("house-with-garden", 285, 202, 160),
    // Varlıklı: modern villa ve havuz
    villa: () =>
      `<rect x="200" y="96" width="100" height="104" fill="#f7f9fb"/><rect x="270" y="64" width="110" height="136" fill="#ffffff"/>` +
      `<rect x="196" y="90" width="108" height="8" fill="#3b4f6b"/><rect x="266" y="58" width="118" height="8" fill="#3b4f6b"/>` +
      `<rect x="210" y="110" width="80" height="44" fill="#8dc2ee"/><rect x="282" y="78" width="88" height="46" fill="#8dc2ee"/><rect x="282" y="136" width="40" height="64" fill="#8dc2ee"/>` +
      `<path d="M210 132h80M326 78v46" stroke="#f7f9fb" stroke-width="2"/>` +
      `<rect x="190" y="194" width="200" height="6" fill="#6fc0ea"/><g fill="#4f9a55">${[198, 214, 360, 376].map((x) => `<circle cx="${x}" cy="186" r="9"/>`).join("")}</g>`,
    // Yurt dışı: tuğla sıra evler
    yurtdisi: (v) =>
      [0, 1, 2]
        .map((i) => {
          const x = 205 + i * 52;
          const c = pick(["#b5654b", "#c98a5d", "#9c5a4a", "#d0a27a"], v + i);
          return (
            `<rect x="${x}" y="88" width="50" height="112" fill="${c}"/><path d="M${x - 2} 90l27-34 27 34z" fill="#5b4a4a"/>` +
            windowsGrid(x + 8, 100, 2, 3, 12, 18, 22, 28, "#e9eef5") +
            `<rect x="${x + 17}" y="178" width="16" height="22" fill="#3d3030"/>`
          );
        })
        .join(""),
  };
  Art.homeType = function (s) {
    if (HS.CITIES[s.city]?.region === "abroad") return "yurtdisi";
    if (s.housing === "ev") return s.homeType || "daire";
    if (s.housing === "kira-paylasim") return "paylasim";
    if (s.housing === "kira") return "kira";
    return "aile";
  };

  // İş yeri binası (sol arka plan)
  const WORK = {
    cafe: "hot-beverage",
    factory: "factory",
    office: "office-building",
    teacher: "school",
    nurse: "hospital",
    business: "convenience-store",
  };
  // Araba modelleri: Fluent çizimi ve renk tonu (hue-rotate) ile
  Art.CARS = {
    bisiklet: {
      name: "Bisiklet",
      art: "bicycle",
      size: 46,
      price: 15000,
      small: true,
    },
    scooter: {
      name: "Scooter",
      art: "motor-scooter",
      size: 52,
      price: 85000,
      small: true,
    },
    ekonomik: {
      name: "Ekonomik otomobil",
      art: "automobile",
      size: 104,
      price: 1444000,
    },
    pikap: { name: "Pikap", art: "pickup-truck", size: 112, price: 2100000 },
    suv: {
      name: "SUV",
      art: "sport-utility-vehicle",
      size: 108,
      price: 2700000,
    },
    spor: { name: "Spor araba", art: "racing-car", size: 116, price: 6500000 },
  };
  Art.CAR_COLORS = [0, 200, 120, 250, 35, 300];

  Art.scene = function (s) {
    const city = HS.CITIES[s.city] || {};
    const feats = city.f || [];
    const crime = s.job === "crime";
    const sea_ = season(s);
    const [top, bottom] = SKY[crime ? "gece" : sea_];
    const snow = sea_ === "kis" && COLD.includes(city.region);
    const grass = snow ? GRASS.kis : GRASS[sea_];
    const sid = "hsSky" + skyId++;
    let o = `<svg viewBox="0 0 400 260" preserveAspectRatio="xMidYMax slice" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Karakter evinin önünde">`;
    o += `<defs><linearGradient id="${sid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${top}"/><stop offset="1" stop-color="${bottom}"/></linearGradient></defs>`;
    o += `<rect width="400" height="260" fill="url(#${sid})"/>`;
    o += crime
      ? F("crescent-moon", 334, 14, 30) +
        `<g fill="#fff" opacity=".8"><circle cx="40" cy="30" r="1.2"/><circle cx="120" cy="18" r="1"/><circle cx="210" cy="40" r="1.3"/><circle cx="280" cy="22" r="1"/></g>`
      : F("sun", 334, 12, 38);
    o += `<g class="hs-cloud c1">${F("cloud", 30, 18, 46, 'opacity=".95"')}</g><g class="hs-cloud c2">${F("cloud", 190, 34, 34, 'opacity=".85"')}</g>`;
    // uzak plan
    feats.forEach((f) => silhouettes[f] && (o += silhouettes[f]()));
    if (city.region === "abroad") o += silhouettes.abroad();
    if (feats.includes("sea")) o += sea(s, crime);
    o += `<rect x="0" y="${feats.includes("sea") ? 158 : 150}" width="400" height="60" fill="${grass}"/>`;
    // ağaçlar
    const tree =
      city.region === "akdeniz" || feats.includes("palm")
        ? "palm-tree"
        : COLD.includes(city.region)
          ? "evergreen-tree"
          : "deciduous-tree";
    o += G(tree, 182, 198, 34) + G(tree, 386, 198, 30);
    // iş yeri
    const wk =
      s.edu === "ogrenci" && s.job === "none"
        ? "classical-building"
        : WORK[s.job];
    if (wk) o += G(wk, 38, 200, wk === "hot-beverage" ? 40 : 66);
    // ev
    const ht = Art.homeType(s);
    o += `<g class="hs-home">${HOMES[ht](s.homeV || 0)}</g>`;
    // kaldırım ve yol
    o += `<rect x="0" y="200" width="400" height="24" fill="#e4e9f0"/><g stroke="#d3dbe6">${Array.from({ length: 12 }, (_, i) => `<path d="M${i * 36} 200v24"/>`).join("")}</g>`;
    o += `<rect x="0" y="222" width="400" height="4" fill="#c5cfdc"/><rect x="0" y="226" width="400" height="34" fill="#5b6576"/><path d="M0 245h400" stroke="#e9eef5" stroke-width="2" stroke-dasharray="16 14"/>`;
    // araba
    if (s.car && Art.CARS[s.car]) {
      const c = Art.CARS[s.car];
      const hue = Art.CAR_COLORS[(s.carColor || 0) % Art.CAR_COLORS.length];
      // Büyük araçlar yolda, bisiklet ve scooter kaldırımda durur
      o += `<g class="hs-car" style="filter:hue-rotate(${hue}deg)">${c.small ? G(c.art, 330, 221, c.size) : G(c.art, 318, 254, c.size)}</g>`;
    }
    // evcil hayvan
    if (s.flags && s.flags.kedi)
      o += `<g class="hs-pet">${G("cat", 236, 214, 24)}</g>`;
    // aile ve karakter
    const P = Art.fromState(s);
    const kids = (s.children || [])
      .filter((k) => s.year - k.born < 18)
      .slice(0, 2);
    kids.forEach((k, i) => {
      const a = s.year - k.born;
      const sc = a < 4 ? 0.32 : a < 11 ? 0.42 : 0.56;
      const kp = {
        gender:
          (HS.hashStr ? HS.hashStr(k.name) : k.name.length) % 2
            ? "man"
            : "woman",
        skin: P.skin,
        hair:
          a < 4
            ? "short"
            : pick(["short", "long", "curly", "bun"], k.name.length),
        hairColor: P.hairColor,
        gray: 0,
        age: a,
        outfit: pick(
          ["gunluk", "esofman", "kapusonlu", "elbise"],
          k.name.length + i,
        ),
        mood: 1,
      };
      if (kp.outfit === "elbise" && kp.gender === "man") kp.outfit = "gunluk";
      o += `<g class="hs-kid" transform="translate(${46 - i * 36} ${214 - 214 * sc}) scale(${sc})">${Art.person(kp)}</g>`;
    });
    o += `<g class="hs-me" transform="translate(84 ${214 - 214 * 0.8}) scale(0.8)">${Art.person(P)}</g>`;
    if (s.partner) {
      const pp = {
        gender: P.gender === "man" ? "woman" : "man",
        skin: (s.seed + 1) % 4,
        hair:
          P.gender === "man"
            ? pick(["long", "bun", "curly"], s.seed)
            : pick(["short", "curly", "shaved"], s.seed),
        hairColor: pick(Object.keys(Art.HAIR_COLORS), s.seed + 2),
        gray: P.gray * 0.9,
        beard: P.gender !== "man" && s.seed % 3 === 0,
        age: s.age,
        outfit: pick(
          ["gomlek", "hirka", "gunluk", "elbise"],
          s.seed + (s.partner.married ? 1 : 0),
        ),
        mood: s.partner.bond >= 55 ? 1 : s.partner.bond < 30 ? -1 : 0,
        glasses: s.age >= 60,
      };
      if (pp.outfit === "elbise" && pp.gender === "man") pp.outfit = "gomlek";
      o += `<g class="hs-partner" transform="translate(150 ${214 - 214 * 0.74}) scale(0.74)">${Art.person(pp)}</g>`;
    }
    if (snow)
      o += `<g class="hs-snow" fill="#fff">${Array.from({ length: 26 }, (_, i) => `<circle cx="${(i * 53) % 400}" cy="${(i * 37) % 200}" r="${1 + (i % 3) * 0.6}"/>`).join("")}</g>`;
    return o + "</svg>";
  };

  // Ufak resim (seçenek ve etkinlik simgeleri için)
  Art.icon = (name, size = 28) =>
    HS.FLUENT && HS.FLUENT[name]
      ? `<svg width="${size}" height="${size}" viewBox="${HS.FLUENT[name].vb}" aria-hidden="true">${HS.FLUENT[name].inner}</svg>`
      : "";
})(globalThis.HS || (globalThis.HS = {}));
