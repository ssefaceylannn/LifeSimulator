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
  // Çerçeveli pencere: cam, beyaz çerçeve, denizlik, cam yansıması
  function win(x, y, w, h, glass = "#9cc6ea", lit = false, frame = "#f7f9fc") {
    const g = lit ? "#ffe39a" : glass;
    return (
      `<rect x="${x - 1.5}" y="${y - 1.5}" width="${w + 3}" height="${h + 3}" rx="1.5" fill="${frame}"/>` +
      `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${g}"/>` +
      `<path d="M${x + w / 2} ${y}v${h}" stroke="${frame}" stroke-width="1.2"/>` +
      `<path d="M${x + 2} ${y + h - 3}l${w * 0.35} -${h * 0.6}" stroke="#fff" stroke-opacity=".45" stroke-width="1.5"/>` +
      `<rect x="${x - 3}" y="${y + h + 1}" width="${w + 6}" height="2.2" fill="#000" opacity=".12"/>`
    );
  }
  function windowsGrid(x0, y0, cols, rows, w, h, gx, gy, fill, lit) {
    let o = "";
    for (let r = 0; r < rows; r++)
      for (let c = 0; c < cols; c++) {
        const on = lit && (r * cols + c) % 5 === lit % 5;
        o += win(x0 + c * gx, y0 + r * gy, w, h, fill, on);
      }
    return o;
  }
  // Bina gövdesi: ön yüz, sağda derinlik yüzü, çatı saçağı, zemin gölgesi
  function block(x, y, w, h, col, roof) {
    const side = Math.max(6, w * 0.07);
    return (
      `<ellipse cx="${x + w / 2}" cy="200" rx="${w * 0.6}" ry="4" fill="#000" opacity=".12"/>` +
      `<path d="M${x + w} ${y + 4}l${side} -4v${h}l-${side} 4z" fill="${shadeOf(col, 0.22)}"/>` +
      `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${col}"/>` +
      `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="url(#hsWallGrad)"/>` +
      `<rect x="${x - 3}" y="${y - 6}" width="${w + 6 + side}" height="7" fill="${roof || shadeOf(col, 0.35)}"/>` +
      `<rect x="${x}" y="${y + h - 8}" width="${w}" height="8" fill="${shadeOf(col, 0.12)}"/>`
    );
  }
  const shadeOf = (c, t) => (HS.Art.mix ? HS.Art.mix(c, "#000000", t) : c);
  function door(x, w, h, col, canopy) {
    return (
      `<rect x="${x - 6}" y="196" width="${w + 12}" height="4" fill="#cfd6df"/>` +
      `<rect x="${x}" y="${200 - h - 4}" width="${w}" height="${h}" rx="2" fill="${col}"/>` +
      `<rect x="${x + 3}" y="${200 - h}" width="${w / 2 - 4}" height="${h * 0.45}" fill="#fff" opacity=".18"/>` +
      `<circle cx="${x + w - 4}" cy="${200 - h / 2 - 4}" r="1.3" fill="#e8c76a"/>` +
      (canopy ? `<path d="M${x - 8} ${200 - h - 6}h${w + 16}l-4 -6h-${w + 8}z" fill="${canopy}"/>` : "")
    );
  }
  const HOMES = {
    // Eski, sıcak renkli aile apartmanı: balkon, çamaşır ipi, saksı, çanak anten
    aile: (v) => {
      const [w] = pick(WALLS, v);
      return (
        block(205, 78, 150, 122, w) +
        `<path d="M330 72v-10M322 60q8-8 16 0" stroke="#8a96a8" stroke-width="2" fill="none"/>` +
        windowsGrid(216, 88, 4, 3, 18, 20, 34, 34, "#9fc3e6") +
        `<g fill="none" stroke="${shadeOf(w, 0.35)}" stroke-width="1.6">${[110, 144].map((y) => `<path d="M212 ${y}h136M212 ${y - 6}h136${[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => `M${214 + i * 17} ${y - 6}v6`).join("")}"/>`).join("")}</g>` +
        `<path d="M218 117q15 6 30 0" stroke="#9aa6b5" fill="none"/><rect x="222" y="117" width="7" height="9" fill="#e85d75"/><rect x="236" y="118" width="7" height="8" fill="#4a86d8"/>` +
        `<g>${[300, 318].map((x) => `<rect x="${x}" y="136" width="8" height="7" fill="#c46a3d"/><circle cx="${x + 4}" cy="133" r="5" fill="#5aa65a"/><circle cx="${x + 2}" cy="131" r="1.5" fill="#e85d75"/>`).join("")}</g>` +
        door(268, 26, 32, "#7a5638", shadeOf(w, 0.3))
      );
    },
    // Ev arkadaşıyla kiralık: eski, gri bej blok, klimalar
    paylasim: (v) => {
      const col = pick(["#d7d2c8", "#cfd5db", "#d8cdbb"], v);
      return (
        block(215, 48, 130, 152, col) +
        windowsGrid(226, 58, 4, 4, 16, 18, 30, 27, "#a9c4dd", v + 2) +
        `<g>${[64, 118, 145].map((y, i) => `<rect x="${i % 2 ? 329 : 221}" y="${y + 13}" width="13" height="8" rx="1" fill="#eef1f4"/><path d="M${i % 2 ? 331 : 223} ${y + 17}h9" stroke="#b8c2cc"/>`).join("")}</g>` +
        `<path d="M300 64l8 16" stroke="${shadeOf(col, 0.3)}" stroke-width=".8"/>` +
        door(268, 22, 28, "#6c5847", "#9aa3ad")
      );
    },
    // Modern kiralık daire bloğu
    kira: (v) => {
      const glass = pick(["#7fb0e3", "#8fc0e0", "#9db7ea"], v);
      return (
        block(215, 36, 140, 164, "#f7f9fc", "#c9d6e6") +
        `<g>${[46, 72, 98, 124, 150].map((y) => win(224, y, 56, 18, glass) + win(290, y, 56, 18, glass)).join("")}</g>` +
        `<g stroke="#b8c7d8" stroke-width="2">${[67, 93, 119, 145].map((y) => `<path d="M220 ${y}h130"/>`).join("")}</g>` +
        door(270, 30, 26, "#4d6a8c", "#c9d6e6")
      );
    },
    // Satın alınmış daire: aynı modern blok, sıcak renk, kapıda "EVİM"
    daire: (v) =>
      HOMES.kira(v) +
      `<rect x="306" y="176" width="22" height="9" rx="2" fill="#2f6fd6"/><text x="317" y="183" font-size="6" text-anchor="middle" fill="#fff" font-family="sans-serif" font-weight="700">EVİM</text>` +
      `<circle cx="258" cy="190" r="7" fill="#5aa65a"/><rect x="254" y="190" width="8" height="8" fill="#c46a3d"/>`,
    // Müstakil bahçeli ev (Fluent çizimi) ve çit
    mustakil: () =>
      `<ellipse cx="285" cy="200" rx="90" ry="5" fill="#000" opacity=".1"/>` +
      G("house-with-garden", 285, 202, 160) +
      `<g stroke="#f4f1ea" stroke-width="2.4">${Array.from({ length: 9 }, (_, i) => `<path d="M${206 + i * 20} 200v-12"/>`).join("")}<path d="M204 192h170" /></g>`,
    // Varlıklı: modern villa ve havuz
    villa: () =>
      `<ellipse cx="290" cy="200" rx="100" ry="5" fill="#000" opacity=".12"/>` +
      block(200, 96, 100, 104, "#f7f9fb", "#3b4f6b") +
      block(270, 64, 110, 136, "#ffffff", "#3b4f6b") +
      win(210, 110, 80, 44, "#8dc2ee") +
      win(282, 78, 88, 46, "#8dc2ee") +
      win(282, 136, 40, 60, "#8dc2ee") +
      `<rect x="330" y="140" width="40" height="8" fill="#c79a5b"/>` +
      `<rect x="190" y="194" width="200" height="6" fill="#6fc0ea"/><path d="M196 197h40M260 197h50" stroke="#fff" stroke-opacity=".6"/>` +
      `<g fill="#4f9a55">${[198, 214, 360, 376].map((x) => `<circle cx="${x}" cy="186" r="9"/><circle cx="${x - 3}" cy="183" r="3" fill="#6cbf6f"/>`).join("")}</g>`,
    // Yurt dışı: tuğla sıra evler
    yurtdisi: (v) =>
      [0, 1, 2]
        .map((i) => {
          const x = 205 + i * 52;
          const col = pick(["#b5654b", "#c98a5d", "#9c5a4a", "#d0a27a"], v + i);
          return (
            `<rect x="${x}" y="88" width="50" height="112" fill="${col}"/>` +
            `<g stroke="${shadeOf(col, 0.2)}" stroke-width=".6" opacity=".6">${[100, 112, 124, 136, 148, 160, 172, 184].map((y) => `<path d="M${x} ${y}h50"/>`).join("")}</g>` +
            `<path d="M${x - 2} 90l27-34 27 34z" fill="#5b4a4a"/><rect x="${x + 35}" y="58" width="6" height="16" fill="#7a6060"/>` +
            windowsGrid(x + 8, 100, 2, 3, 12, 18, 22, 28, "#e9eef5") +
            door(x + 17, 16, 22, "#3d3030")
          );
        })
        .join(""),
  };
  // Sokak eşyaları: lamba, bank, posta kutusu
  const STREET =
    `<g><rect x="186" y="150" width="3" height="52" fill="#56606f"/><path d="M187 150q0-8 10-8" stroke="#56606f" stroke-width="3" fill="none"/><rect x="194" y="141" width="10" height="5" rx="2" fill="#56606f"/><ellipse cx="199" cy="147" rx="5" ry="2" fill="#ffe9a8" opacity=".9"/></g>` +
    `<g><rect x="372" y="186" width="14" height="13" rx="2" fill="#c0392b"/><rect x="375" y="190" width="8" height="1.6" fill="#fff"/><rect x="377" y="199" width="3" height="4" fill="#56606f"/></g>`;
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
    memur: "classical-building",
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

  Art.street = function (s) {
    const city = HS.CITIES[s.city] || {};
    const feats = city.f || [];
    const crime = s.job === "crime";
    const sea_ = season(s);
    const [top, bottom] = SKY[crime ? "gece" : sea_];
    const snow = sea_ === "kis" && COLD.includes(city.region);
    const grass = snow ? GRASS.kis : GRASS[sea_];
    const sid = "hsSky" + skyId++;
    let o = `<svg viewBox="0 0 400 260" preserveAspectRatio="xMidYMax slice" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Karakter evinin önünde">`;
    o += `<defs><linearGradient id="${sid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${top}"/><stop offset="1" stop-color="${bottom}"/></linearGradient><linearGradient id="hsWallGrad" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity=".12"/><stop offset=".6" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".08"/></linearGradient></defs>`;
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
    o += `<g class="hs-home">${HOMES[ht](s.homeV || 0)}</g>` + STREET;
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
    o += Art.cast(s, 132, 214, 0.8);
    if (snow)
      o += `<g class="hs-snow" fill="#fff">${Array.from({ length: 26 }, (_, i) => `<circle cx="${(i * 53) % 400}" cy="${(i * 37) % 200}" r="${1 + (i % 3) * 0.6}"/>`).join("")}</g>`;
    return o + "</svg>";
  };


  // Aile: karakter (cx, alt y, ölçek k), sağında partner, solunda çocuklar, yanında kedi.
  const hashStr = (t) => {
    let h = 2166136261;
    for (let i = 0; i < t.length; i++) h = Math.imul(h ^ t.charCodeAt(i), 16777619);
    return h >>> 0;
  };
  Art.hash = hashStr;
  const put = (cls, cx, by, k, inner) => `<g class="${cls}" transform="translate(${(cx - 60 * k).toFixed(1)} ${(by - 214 * k).toFixed(1)}) scale(${k})">${inner}</g>`;
  Art.put = put;
  Art.childLook = function (s, c, P = Art.fromState(s)) {
    const a = s.year - c.born;
    const h = hashStr(c.name);
    const kp = {
      gender: h % 2 ? "man" : "woman",
      skin: P.skin,
      hair: a < 4 ? "short" : pick(h % 2 ? ["short", "curly", "sidepart", "afro"] : ["long", "braid", "bun", "curly", "ponytail", "bob"], h >>> 3),
      hairColor: P.hairColor,
      age: a,
      outfit: pick(["gunluk", "esofman", "kapusonlu", "ceket", "elbise"], h >>> 5),
      mood: 1,
      eyeColor: (h >>> 7) % 4,
      fat: 0.25,
    };
    if (kp.outfit === "elbise" && kp.gender === "man") kp.outfit = "gunluk";
    if (a >= 18) Object.assign(kp, { outfit: pick(["gomlek", "ceket", "gunluk"], h), mood: c.bond >= 50 ? 1 : 0 });
    return kp;
  };
  Art.partnerLook = function (s, P = Art.fromState(s)) {
    const pp = {
      gender: P.gender === "man" ? "woman" : "man",
      skin: (s.seed + 1) % 4,
      hair: P.gender === "man" ? pick(["long", "bun", "curly", "braid", "wavy", "bob", "ponytail"], s.seed) : pick(["short", "curly", "shaved", "sidepart", "pompadour"], s.seed),
      hairColor: pick(Object.keys(Art.HAIR_COLORS), s.seed + 2),
      gray: P.gray * 0.9,
      beard: P.gender !== "man" && s.seed % 3 === 0,
      age: s.age,
      outfit: pick(["gomlek", "hirka", "gunluk", "elbise", "ceket"], s.seed + (s.partner.married ? 1 : 0)),
      mood: s.partner.bond >= 55 ? 1 : s.partner.bond < 30 ? -1 : 0,
      glasses: s.age >= 60,
      eyeColor: (s.seed + 3) % 4,
      fat: Math.min(0.8, 0.25 + Math.max(0, s.age - 30) / 120),
    };
    if (pp.outfit === "elbise" && pp.gender === "man") pp.outfit = "gomlek";
    return pp;
  };
  Art.cast = function (s, cx, by, k, opt = {}) {
    const P = Art.fromState(s);
    let o = "";
    if (s.flags && s.flags.kedi && !opt.solo) o += `<g class="hs-pet">${G("cat", cx - 92 * k, by, 30 * k)}</g>`;
    if (!opt.solo)
      (s.children || [])
        .filter((c) => s.year - c.born < 18)
        .slice(0, 2)
        .forEach((c, i) => {
          const a = s.year - c.born;
          const sc = (a < 4 ? 0.42 : a < 11 ? 0.55 : 0.72) * k;
          const h = hashStr(c.name);
          const kp = Art.childLook(s, c, P);
          if (kp.outfit === "elbise" && kp.gender === "man") kp.outfit = "gunluk";
          o += put("hs-kid", cx - (58 + i * 40) * k, by, sc, Art.person(kp));
        });
    o += put("hs-me", cx, by, k, Art.person(P));
    if (s.partner && !opt.solo) {
      const pp = Art.partnerLook(s, P);
      if (pp.outfit === "elbise" && pp.gender === "man") pp.outfit = "gomlek";
      o += put("hs-partner", cx + 70 * k, by, k * 0.95, Art.person(pp));
    }
    return o;
  };

  // İşe gidiş / eve dönüş: araç yolda sabit durur ve hafifçe sarsılır; şehir, ağaçlar ve
  // yol çizgileri arkada kayar (paralaks). phase: "sabah" | "aksam".
  Art.commute = function (s, phase = "sabah") {
    const eve = phase === "aksam";
    const wk = s.edu === "ogrenci" && s.job === "none" ? "school" : WORK[s.job] || (s.job === "music" ? "stadium" : "office-building");
    const vehicle = s.car && Art.CARS[s.car] ? Art.CARS[s.car] : null;
    const hue = Art.CAR_COLORS[(s.carColor || 0) % Art.CAR_COLORS.length];
    const id = "cm" + skyId++;
    const sky = eve ? ["#4b4f8f", "#f2a46b"] : ["#8ec2f2", "#fde3c3"];
    let o = `<svg viewBox="0 0 400 170" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${eve ? "Eve dönüş" : "İşe gidiş"}" overflow="hidden">`;
    o += `<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${sky[0]}"/><stop offset="1" stop-color="${sky[1]}"/></linearGradient><clipPath id="${id}c"><rect width="400" height="170"/></clipPath></defs>`;
    o += `<g clip-path="url(#${id}c)"><rect width="400" height="170" fill="url(#${id})"/>`;
    o += eve ? `<circle cx="300" cy="96" r="22" fill="#ffcf8a" opacity=".9"/>` : G("sun", 300, 70, 34, 'opacity=".95"');
    // uzak siluet (yavaş)
    const far = (x0) => [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => `<rect x="${x0 + i * 40}" y="${56 + ((i * 7) % 4) * 9}" width="30" height="${70 - ((i * 7) % 4) * 9}" fill="${eve ? "#5d5f93" : "#c4d5ea"}"/>` + (eve ? [0, 1, 2].map((j) => `<rect x="${x0 + i * 40 + 6 + j * 8}" y="${66 + ((i * 7) % 4) * 9}" width="4" height="4" fill="#ffd77a" opacity="${(i + j) % 3 ? 0.85 : 0.2}"/>`).join("") : "")).join("");
    o += `<g class="hs-scroll slow">${far(0)}${far(400)}</g>`;
    // orta plan: ağaç ve lambalar (orta hız)
    const mid = (x0) => [0, 1, 2, 3].map((i) => G(i % 2 ? "deciduous-tree" : "evergreen-tree", x0 + 40 + i * 100, 122, 36) + `<rect x="${x0 + 90 + i * 100}" y="86" width="3" height="36" fill="#56606f"/><ellipse cx="${x0 + 91.5 + i * 100}" cy="86" rx="6" ry="2.4" fill="${eve ? "#ffe9a8" : "#9aa3ad"}"/>`).join("");
    o += `<g class="hs-scroll mid">${mid(0)}${mid(400)}</g>`;
    // yol
    o += `<rect y="118" width="400" height="10" fill="#e4e9f0"/><rect y="128" width="400" height="42" fill="#5b6576"/>`;
    o += `<g class="hs-scroll fast">${Array.from({ length: 20 }, (_, i) => `<rect x="${i * 40}" y="147" width="22" height="3" fill="#e9eef5"/>`).join("")}</g>`;
    // araç
    let mover;
    const flip = (inner, cx) => `<g transform="translate(${cx * 2} 0) scale(-1 1)">${inner}</g>`;
    if (vehicle && !vehicle.small) mover = `<g style="filter:hue-rotate(${hue}deg)">${G(vehicle.art, 200, 160, 110)}</g>`;
    else if (vehicle) mover = Art.put("", 196, 150, 0.36, Art.person(Art.fromState(s))) + G(vehicle.art, 200, 160, 56);
    else mover = G("bus", 200, 162, 120) + (s.job === "factory" || (s.job === "office" && s.company) ? `<rect x="168" y="112" width="40" height="11" rx="3" fill="#fff"/><text x="188" y="120.5" font-size="8" font-weight="800" text-anchor="middle" fill="#2f6fe4" font-family="Nunito, sans-serif">SERVİS</text>` : "");
    o += `<ellipse cx="200" cy="162" rx="54" ry="4" fill="#000" opacity=".22"/><g class="hs-bounce">${mover}</g>`;
    // varış noktası rozeti
    o += `<g transform="translate(${eve ? 18 : 330} 14)"><rect width="52" height="44" rx="10" fill="#fff" opacity=".88"/>${G(eve ? "house" : wk, 26, 40, 34)}</g>`;
    if (eve) o += `<rect width="400" height="170" fill="#1b1d4a" opacity=".12"/>`;
    return o + "</g></svg>";
  };

  // Ufak resim (seçenek ve etkinlik simgeleri için)
  Art.icon = (name, size = 28) =>
    HS.FLUENT && HS.FLUENT[name]
      ? `<svg width="${size}" height="${size}" viewBox="${HS.FLUENT[name].vb}" aria-hidden="true">${HS.FLUENT[name].inner}</svg>`
      : "";
})(globalThis.HS || (globalThis.HS = {}));
