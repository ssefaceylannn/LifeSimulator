// İç mekân sahneleri: salon, yatak odası, mutfak, garaj/otopark ve iş yeri.
// Perspektifli oda (sol yan duvar, arka duvar, ahşap/karo zemin) üzerine mobilya ve süs.
// Her ev için renkler, mobilya biçimi ve süsler bir tohumdan (seed) seçilir: aynı evde
// sahne hep aynı kalır, ev değişince oda da değişir. Evin türü (aile evi, paylaşımlı,
// kiralık, daire, müstakil, villa, yurt dışı) eşya kalitesini ve ayrıntıları belirler.
// HS.Art.scene(s, view) → <svg> (400×260). HS.Art.views(s) → [{id, label}].
(function (HS) {
  "use strict";
  const Art = HS.Art;
  const G = (...a) => Art.place(...a);
  const dark = Art.dark,
    light = Art.light,
    mix = Art.mix;
  const n1 = (v) => Math.round(v * 10) / 10;
  let U = 0;
  let NIGHT = false;
  const has = (s, k) => (s.items || []).includes(k);

  function rng(seed) {
    let a = seed >>> 0;
    return () => {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const pk = (r, arr) => arr[Math.floor(r() * arr.length)];

  const WALLS = ["#a9d4ea", "#f2d6c2", "#c4e4d2", "#dcd2ec", "#f1e7d3", "#cfdcb8", "#ebc2aa", "#cbd6e8", "#f3e3a8", "#b9cbe8", "#e8d5d0"];
  const FLOORS = {
    mese: ["#f2a54e", "#de8c36"],
    ceviz: ["#ad764d", "#8f5c3a"],
    hus: ["#ecd3a6", "#d8b98a"],
    gri: ["#d2cbc2", "#bab2a8"],
    kiraz: ["#c86a45", "#a95536"],
  };
  const FABRIC = ["#d9cbb4", "#9aa6b5", "#3f8f8b", "#d9a43a", "#3d5281", "#6f9a5b", "#d48a8a", "#8c6bb1", "#c8553d", "#e6e1d6"];
  const WOOD = ["#c08a5a", "#a87148", "#d9b07c", "#8d5b3b", "#e6d2b0"];
  const LUX = { paylasim: 0, aile: 1, kira: 1, daire: 2, yurtdisi: 2, mustakil: 3, villa: 4 };

  // Evin teması: aynı ev için hep aynı
  function theme(s, extra = "") {
    const ht = Art.homeType(s);
    const seed = Art.hash(`${s.id || s.seed}|${ht}|${s.city}|${s.homeV || 0}|${s.housing}|${(s.moves || 0)}${extra}`);
    const r = rng(seed);
    const lux = LUX[ht] ?? 1;
    const wall = pk(r, WALLS);
    const floorK = ht === "aile" ? pk(r, ["kiraz", "ceviz", "mese"]) : lux >= 3 ? pk(r, ["ceviz", "mese", "hus", "gri"]) : pk(r, Object.keys(FLOORS));
    return {
      r,
      ht,
      lux,
      seed,
      wall,
      side: dark(wall, 0.09),
      ceil: "#f6f2ea",
      floor: FLOORS[floorK],
      fabric: pk(r, FABRIC),
      fabric2: pk(r, FABRIC),
      wood: pk(r, WOOD),
      accent: pk(r, ["#c8553d", "#e0a33a", "#2f7fbf", "#3f8f8b", "#8c6bb1", "#d46a8a"]),
      curtain: pk(r, ["#a9c8ec", "#f2e3c4", "#cfe3d6", "#e9c3c3", "#d8d1ea", "#f5f5f2"]),
    };
  }

  // ---------- Kabuk: tavan, duvarlar, zemin ----------
  function shell(t, opt = {}) {
    const id = "rm" + ++U;
    let o = `<defs><linearGradient id="${id}w" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".22"/><stop offset=".55" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".07"/></linearGradient><linearGradient id="${id}f" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity=".12"/><stop offset=".4" stop-color="#000" stop-opacity="0"/></linearGradient><clipPath id="${id}c"><polygon points="0,236 64,198 400,198 400,260 0,260"/></clipPath><radialGradient id="${id}l" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fff7d6" stop-opacity=".55"/><stop offset="1" stop-color="#fff7d6" stop-opacity="0"/></radialGradient></defs>`;
    t.id = id;
    o += `<rect width="400" height="260" fill="${t.wall}"/><rect x="64" y="34" width="336" height="164" fill="url(#${id}w)"/>`;
    o += `<polygon points="0,0 400,0 400,34 64,34 0,12" fill="${t.ceil}"/><path d="M64 34H400M0 12L64 34" stroke="${dark(t.ceil, 0.12)}" stroke-width="2"/>`;
    o += `<polygon points="0,12 64,34 64,198 0,236" fill="${t.side}"/><polygon points="0,12 64,34 64,198 0,236" fill="url(#${id}w)"/>`;
    // zemin
    const [f1, f2] = t.floor;
    o += `<polygon points="0,236 64,198 400,198 400,260 0,260" fill="${f1}"/>`;
    o += `<g clip-path="url(#${id}c)">`;
    const vx = opt.vpx || 240,
      vy = 110;
    if (opt.tile) {
      o += `<g stroke="${f2}" stroke-width="1.4">`;
      for (let xb = -900; xb <= 1300; xb += opt.tile) {
        const x198 = vx + ((xb - vx) * (198 - vy)) / (260 - vy);
        o += `<path d="M${n1(x198)} 198L${xb} 260"/>`;
      }
      [203, 210, 219, 231, 246].forEach((y) => (o += `<path d="M0 ${y}H400"/>`));
      o += `</g>`;
    } else {
      for (let xb = -700, i = 0; xb <= 1100; xb += 46, i++) {
        const x198 = vx + ((xb - vx) * (198 - vy)) / (260 - vy);
        o += `<path d="M${n1(x198)} 198L${xb} 260" stroke="${f2}" stroke-width="1.6"/>`;
        // tahta ek yerleri
        const tt = ((i * 37) % 5) / 5;
        const y = 205 + tt * 50;
        const k = (y - vy) / (260 - vy);
        const xa = vx + (xb - vx) * k;
        const xn = vx + (xb + 46 - vx) * k;
        o += `<path d="M${n1(xa)} ${n1(y)}H${n1(xn)}" stroke="${f2}" stroke-width="1.1" opacity=".8"/>`;
      }
      o += `<rect y="198" width="400" height="62" fill="#fff" opacity=".05"/>`;
    }
    o += `<rect y="198" width="400" height="62" fill="url(#${id}f)"/></g>`;
    // süpürgelik
    if (!opt.noBase) o += `<rect x="64" y="191" width="336" height="7" fill="${light(t.wall, 0.55)}"/><path d="M64 191H400" stroke="${dark(t.wall, 0.08)}"/><polygon points="0,228 64,191 64,198 0,236" fill="${light(t.side, 0.45)}"/>`;
    return o;
  }

  // ---------- Pencere ve dış görünüm ----------
  function outside(s, x, y, w, h, t) {
    const id = "ro" + ++U;
    const sea = Art.season(s);
    const night = s.job === "crime" || NIGHT;
    const city = HS.CITIES[s.city] || {};
    const sky = night ? ["#1c2a48", "#3e5277"] : { kis: ["#b9cde3", "#eef3f8"], ilkbahar: ["#8cc4f2", "#e6f3ff"], yaz: ["#69b0ef", "#ddf0ff"], sonbahar: ["#a6bfd9", "#f4e8d6"] }[sea];
    const cold = sea === "kis" && ["ic", "dogu", "karadeniz", "abroad"].includes(city.region);
    let v = `<svg x="${x}" y="${y}" width="${w}" height="${h}" viewBox="0 0 160 100" preserveAspectRatio="xMidYMax slice"><defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${sky[0]}"/><stop offset="1" stop-color="${sky[1]}"/></linearGradient></defs><rect width="160" height="100" fill="url(#${id})"/>`;
    v += night ? `<circle cx="128" cy="18" r="7" fill="#f4f1d0"/>` : `<circle cx="128" cy="20" r="9" fill="#fff4c2" opacity=".95"/><g class="hs-cloud" fill="#fff" opacity=".85"><ellipse cx="30" cy="22" rx="16" ry="6"/><ellipse cx="40" cy="18" rx="10" ry="6"/></g>`;
    const feats = city.f || [];
    const seaView = t.ht === "villa" || (feats.includes("sea") && t.r() < 0.6);
    if (seaView) {
      v += `<path d="M0 66Q40 56 80 62T160 58V100H0z" fill="${night ? "#2b3c5c" : "#9cc79a"}"/><rect y="70" width="160" height="30" fill="${night ? "#22324f" : "#5aa6d6"}"/><path d="M8 78h20M60 84h26M110 76h22M30 92h30" stroke="#fff" stroke-opacity=".6" stroke-width="1.6"/>`;
      if (feats.includes("bosphorus")) v += `<path d="M20 70h120" stroke="#c4cfdc" stroke-width="2"/><path d="M40 70v-14M120 70v-14" stroke="#c4cfdc" stroke-width="2"/><path d="M40 56Q80 72 120 56" stroke="#c4cfdc" fill="none" stroke-width="1.2"/>`;
    } else if (t.ht === "mustakil") {
      v += `<path d="M0 70Q50 48 100 62T160 56V100H0z" fill="${cold ? "#eef3f8" : "#9fcf86"}"/><path d="M0 84Q60 70 160 82V100H0z" fill="${cold ? "#e1e8f0" : "#7fbf6a"}"/>` + G(cold ? "evergreen-tree" : "deciduous-tree", 40, 86, 28) + G(cold ? "evergreen-tree" : "deciduous-tree", 120, 90, 34);
    } else {
      const col = night ? "#2d3e5e" : "#c3d2e4",
        col2 = night ? "#26354f" : "#aebfd6";
      const r = rng(t.seed + 7);
      for (let i = 0; i < 9; i++) {
        const bx = i * 19 - 4,
          bh = 30 + r() * 45,
          bw = 16 + r() * 8;
        v += `<rect x="${n1(bx)}" y="${n1(100 - bh)}" width="${n1(bw)}" height="${n1(bh)}" fill="${i % 2 ? col : col2}"/>`;
        for (let wy = 100 - bh + 5; wy < 96; wy += 8) v += `<rect x="${n1(bx + 4)}" y="${n1(wy)}" width="3" height="3" fill="${night ? "#f6d77a" : "#fff"}" opacity="${night ? (r() < 0.5 ? 0.9 : 0.2) : 0.6}"/><rect x="${n1(bx + bw - 7)}" y="${n1(wy)}" width="3" height="3" fill="${night ? "#f6d77a" : "#fff"}" opacity="${night ? (r() < 0.5 ? 0.9 : 0.2) : 0.6}"/>`;
      }
      if (city.region === "abroad") v += `<path d="M118 100V46l6 -12l6 12V100z" fill="${col2}"/>`;
      else if (feats.includes("mosque") || t.r() < 0.4) v += `<path d="M64 100V80q12 -14 24 0V100z" fill="${col2}"/><path d="M58 100V66h3V100zM93 100V66h3V100z" fill="${col2}"/><path d="M59.5 66l1.5 -8l1.5 8zM94.5 66l1.5 -8l1.5 8z" fill="${col2}"/>`;
    }
    if (cold) v += `<g class="hs-snow" fill="#fff">${Array.from({ length: 16 }, (_, i) => `<circle cx="${(i * 37) % 160}" cy="${(i * 23) % 100}" r="${1 + (i % 3) * 0.5}"/>`).join("")}</g>`;
    if (sea === "sonbahar" && !night) v += `<g fill="#e08a3a">${[20, 70, 110].map((x, i) => `<ellipse cx="${x}" cy="${30 + i * 18}" rx="2.4" ry="1.4" transform="rotate(${i * 40} ${x} ${30 + i * 18})"/>`).join("")}</g>`;
    return v + `</svg>`;
  }
  function windowBack(s, t, x, y, w, h, opt = {}) {
    let o = "";
    if (opt.light !== false) o += `<polygon points="${x},${y + h + 8} ${x + w},${y + h + 8} ${x + w + 40},260 ${x - 30},260" fill="#fff" opacity=".1"/>`;
    o += `<rect x="${x - 5}" y="${y - 5}" width="${w + 10}" height="${h + 10}" rx="3" fill="${opt.frame || "#fbfaf7"}"/><rect x="${x - 5}" y="${y - 5}" width="${w + 10}" height="${h + 10}" rx="3" fill="none" stroke="${dark(t.wall, 0.15)}" stroke-width="1"/>`;
    o += outside(s, x, y, w, h, t);
    const fc = opt.frame || "#fbfaf7";
    o += `<g stroke="${fc}" stroke-width="3.5" fill="none"><path d="M${x + w / 2} ${y}V${y + h}"/>${opt.transom !== false ? `<path d="M${x} ${n1(y + h * 0.32)}H${x + w}"/>` : ""}</g>`;
    o += `<path d="M${x + 6} ${y + h - 4}L${n1(x + w * 0.3)} ${y + 4}h12L${x + 18} ${y + h - 4}z" fill="#fff" opacity=".16"/>`;
    o += `<rect x="${x - 10}" y="${y + h + 4}" width="${w + 20}" height="6" rx="2" fill="#f4f1ea"/><rect x="${x - 10}" y="${y + h + 8}" width="${w + 20}" height="2" fill="#000" opacity=".08"/>`;
    if (opt.curtain) {
      const c = opt.curtain,
        top = y - 14,
        bot = Math.min(196, y + h + (opt.long ? 60 : 22));
      o += `<rect x="${x - 26}" y="${top - 3}" width="${w + 52}" height="3.5" rx="1.7" fill="${dark(c, 0.35)}"/>`;
      for (const side of [-1, 1]) {
        const cx = side < 0 ? x - 24 : x + w + 2,
          cw = 22;
        o += `<path d="M${cx} ${top}h${cw}q${side < 0 ? -2 : 6} ${(bot - top) * 0.5} ${side < 0 ? 4 : -2} ${bot - top}h-${cw + 2}z" fill="${c}"/>`;
        o += `<path d="M${cx + 6} ${top}v${bot - top}M${cx + 13} ${top}v${bot - top}M${cx + 19} ${top}v${bot - top}" stroke="${dark(c, 0.12)}" stroke-width="2" opacity=".6"/><path d="M${cx + 3} ${top}v${bot - top}" stroke="#fff" stroke-width="2" opacity=".35"/>`;
      }
    }
    if (opt.radiator) o += radiator(x + w / 2 - 34, y + h + 44, 68);
    return o;
  }

  // ---------- Mobilya ve süs ----------
  function frame(x, y, w, h, t, kind) {
    const id = "fr" + ++U;
    let o = `<rect x="${x}" y="${y + 3}" width="${w}" height="${h}" rx="1" fill="#000" opacity=".1"/><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="1.5" fill="${t.wood}"/><rect x="${x + 3}" y="${y + 3}" width="${w - 6}" height="${h - 6}" fill="#fbf7ef"/>`;
    const ix = x + 5,
      iy = y + 5,
      iw = w - 10,
      ih = h - 10;
    o += `<svg x="${ix}" y="${iy}" width="${iw}" height="${ih}" viewBox="0 0 100 100" preserveAspectRatio="none">`;
    if (kind === "deniz") o += `<rect width="100" height="100" fill="#cfe2f5"/><path d="M0 60q12 -10 25 0t25 0t25 0t25 0V100H0z" fill="#6f9fd8"/><path d="M0 74q12 -10 25 0t25 0t25 0t25 0" stroke="#fff" stroke-width="4" fill="none"/><path d="M62 40l14 -24l4 24z" fill="#fff"/>`;
    else if (kind === "portre") o += `<rect width="100" height="100" fill="#c9df9c"/><circle cx="50" cy="40" r="20" fill="#f2c8a8"/><path d="M28 40q0 -30 22 -30t22 30q-4 -18 -22 -18t-22 18z" fill="#8a5a3b"/><path d="M14 100q4 -38 36 -38t36 38z" fill="#e88a8a"/>`;
    else if (kind === "aile") o += `<rect width="100" height="100" fill="#f1e2c8"/>${[25, 50, 75].map((cx, i) => `<circle cx="${cx}" cy="${44 - (i === 1 ? 6 : 0)}" r="${i === 1 ? 12 : 10}" fill="#e8b994"/><path d="M${cx - 16} 100q2 -36 16 -36t16 36z" fill="${["#6d8fbf", "#c76b6b", "#6fa06a"][i]}"/>`).join("")}`;
    else if (kind === "soyut") o += `<rect width="100" height="100" fill="#f6efe2"/><circle cx="36" cy="40" r="22" fill="${t.accent}" opacity=".85"/><rect x="48" y="48" width="36" height="36" fill="${t.fabric}"/><path d="M10 90L90 14" stroke="#2c3e5c" stroke-width="4"/>`;
    else if (kind === "cini") o += `<rect width="100" height="100" fill="#eef4fb"/><g fill="none" stroke="#2c6fb8" stroke-width="4"><circle cx="50" cy="50" r="30"/><path d="M50 20q14 30 0 60q-14 -30 0 -60zM20 50q30 -14 60 0q-30 14 -60 0z"/></g><circle cx="50" cy="50" r="8" fill="#c8453b"/>`;
    else o += `<rect width="100" height="100" fill="#cde4f7"/><circle cx="72" cy="28" r="10" fill="#ffd36b"/><path d="M0 70q30 -30 55 -8t45 -12V100H0z" fill="#86bf74"/><path d="M0 84q40 -20 100 0V100H0z" fill="#5f9f5a"/>`;
    return o + `</svg>`;
  }
  const nazar = (x, y) => `<g><path d="M${x} ${y - 10}v6" stroke="#c43c35" stroke-width="1"/><circle cx="${x}" cy="${y}" r="6" fill="#1f5fbf"/><circle cx="${x}" cy="${y}" r="4.2" fill="#fff"/><circle cx="${x}" cy="${y}" r="2.8" fill="#4aa3e8"/><circle cx="${x}" cy="${y}" r="1.4" fill="#1b2232"/></g>`;
  function clock(x, y, r = 10) {
    return `<g><circle cx="${x}" cy="${y + 1.5}" r="${r}" fill="#000" opacity=".1"/><circle cx="${x}" cy="${y}" r="${r}" fill="#fff" stroke="#3d3d45" stroke-width="2"/><path d="M${x} ${y}V${y - r * 0.6}M${x} ${y}L${x + r * 0.45} ${y + r * 0.2}" stroke="#3d3d45" stroke-width="1.6" stroke-linecap="round"/></g>`;
  }
  function sofa(x, by, w, col, r, style = 0) {
    const d = dark(col, 0.14),
      l = light(col, 0.1);
    let o = `<ellipse cx="${x + w / 2}" cy="${by}" rx="${w / 2 + 4}" ry="4" fill="#000" opacity=".12"/>`;
    o += `<rect x="${x + 8}" y="${by - 66}" width="${w - 16}" height="40" rx="${style ? 6 : 12}" fill="${d}"/>`;
    const n = w > 130 ? 3 : 2,
      cw = (w - 36) / n;
    for (let i = 0; i < n; i++) o += `<rect x="${n1(x + 18 + i * cw)}" y="${by - 64}" width="${n1(cw - 2)}" height="34" rx="${style ? 4 : 9}" fill="${col}"/><path d="M${n1(x + 22 + i * cw)} ${by - 58}q${n1(cw / 2 - 4)} -4 ${n1(cw - 10)} 0" stroke="#fff" stroke-opacity=".2" stroke-width="2" fill="none"/>`;
    for (let i = 0; i < n; i++) o += `<rect x="${n1(x + 16 + i * cw)}" y="${by - 34}" width="${n1(cw)}" height="17" rx="5" fill="${l}"/>`;
    o += `<rect x="${x}" y="${by - 46}" width="20" height="36" rx="${style ? 4 : 9}" fill="${col}"/><rect x="${x + w - 20}" y="${by - 46}" width="20" height="36" rx="${style ? 4 : 9}" fill="${col}"/>`;
    o += `<rect x="${x + 2}" y="${by - 47}" width="16" height="5" rx="2.5" fill="#fff" opacity=".2"/><rect x="${x + w - 18}" y="${by - 47}" width="16" height="5" rx="2.5" fill="#fff" opacity=".2"/>`;
    o += `<rect x="${x + 3}" y="${by - 18}" width="${w - 6}" height="12" rx="3" fill="${d}"/>`;
    o += `<rect x="${x + 8}" y="${by - 7}" width="4" height="7" fill="#5a4032"/><rect x="${x + w - 12}" y="${by - 7}" width="4" height="7" fill="#5a4032"/>`;
    // yastıklar
    const pc = [pk(r, FABRIC), pk(r, FABRIC)];
    o += `<rect x="${x + 22}" y="${by - 52}" width="22" height="20" rx="6" fill="${pc[0]}" transform="rotate(-10 ${x + 33} ${by - 42})"/><rect x="${x + w - 44}" y="${by - 52}" width="22" height="20" rx="6" fill="${pc[1]}" transform="rotate(9 ${x + w - 33} ${by - 42})"/>`;
    return o;
  }
  function armchair(x, by, col) {
    const d = dark(col, 0.14);
    return `<ellipse cx="${x + 24}" cy="${by}" rx="28" ry="3.6" fill="#000" opacity=".12"/><rect x="${x + 6}" y="${by - 60}" width="36" height="36" rx="10" fill="${d}"/><rect x="${x + 8}" y="${by - 32}" width="32" height="15" rx="5" fill="${light(col, 0.1)}"/><rect x="${x}" y="${by - 42}" width="12" height="32" rx="6" fill="${col}"/><rect x="${x + 36}" y="${by - 42}" width="12" height="32" rx="6" fill="${col}"/><rect x="${x + 2}" y="${by - 18}" width="44" height="11" rx="3" fill="${d}"/><rect x="${x + 6}" y="${by - 7}" width="3" height="7" fill="#5a4032"/><rect x="${x + 39}" y="${by - 7}" width="3" height="7" fill="#5a4032"/>`;
  }
  function beanbag(x, by, col) {
    return `<ellipse cx="${x}" cy="${by}" rx="26" ry="4" fill="#000" opacity=".14"/><path d="M${x - 26} ${by - 2}q-4 -30 18 -38q20 -6 30 10q8 14 4 28z" fill="${col}"/><path d="M${x - 14} ${by - 30}q10 -6 20 0" stroke="#fff" stroke-opacity=".25" stroke-width="3" fill="none"/>`;
  }
  function coffeeTable(cx, by, w, wood, r, t) {
    const d = dark(wood, 0.2);
    let o = `<ellipse cx="${cx}" cy="${by + 1}" rx="${w / 2 + 6}" ry="5" fill="#000" opacity=".12"/>`;
    o += `<polygon points="${cx - w / 2 + 8},${by - 30} ${cx + w / 2 - 8},${by - 30} ${cx + w / 2},${by - 22} ${cx - w / 2},${by - 22}" fill="${light(wood, 0.12)}"/><rect x="${cx - w / 2}" y="${by - 22}" width="${w}" height="6" fill="${d}"/>`;
    o += `<rect x="${cx - w / 2 + 4}" y="${by - 16}" width="7" height="16" fill="${d}"/><rect x="${cx + w / 2 - 11}" y="${by - 16}" width="7" height="16" fill="${d}"/>`;
    if (t && t.ht === "aile") o += tea(cx - 14, by - 27) + tea(cx + 4, by - 27) + `<ellipse cx="${cx + 22}" cy="${by - 27}" rx="9" ry="2.6" fill="#fff"/><circle cx="${cx + 19}" cy="${by - 29}" r="2.4" fill="#d9a441"/><circle cx="${cx + 24}" cy="${by - 29}" r="2.4" fill="#c86a45"/>`;
    else o += `<rect x="${cx + 4}" y="${by - 36}" width="18" height="4" fill="#5e8fd1"/><rect x="${cx + 5}" y="${by - 40}" width="16" height="4" fill="#8bc37a"/>` + `<path d="M${cx - 16} ${by - 30}q-2 -8 3 -14h6q5 6 3 14z" fill="#e8eef4" opacity=".9"/><path d="M${cx - 13} ${by - 44}q-6 -10 -2 -16M${cx - 9} ${by - 44}q4 -10 8 -12" stroke="#7a5236" stroke-width="1.4" fill="none"/>`;
    return o;
  }
  const tea = (x, y) => `<g><ellipse cx="${x + 4}" cy="${y + 0.8}" rx="6" ry="1.6" fill="#d2d6dc"/><path d="M${x + 0.6} ${y}q-1 -5 1.4 -7.5q-1.6 -2.4 0 -4.5h4q1.6 2.1 0 4.5q2.4 2.5 1.4 7.5z" fill="#b3471f" opacity=".9"/><path d="M${x + 1} ${y - 12}h6" stroke="#fff" stroke-width="1" opacity=".8"/></g>`;
  function rug(cx, cy, w, h, col, kilim) {
    const pts = `${cx - w / 2 + 22},${cy - h / 2} ${cx + w / 2 - 22},${cy - h / 2} ${cx + w / 2},${cy + h / 2} ${cx - w / 2},${cy + h / 2}`;
    let o = `<polygon points="${pts}" fill="${col}"/>`;
    if (kilim) {
      o += `<polygon points="${cx - w / 2 + 28},${cy - h / 2 + 4} ${cx + w / 2 - 28},${cy - h / 2 + 4} ${cx + w / 2 - 8},${cy + h / 2 - 4} ${cx - w / 2 + 8},${cy + h / 2 - 4}" fill="none" stroke="#f2d8a7" stroke-width="2"/>`;
      for (let i = -2; i <= 2; i++) o += `<path d="M${cx + i * w * 0.16} ${cy - h * 0.3}l${w * 0.06} ${h * 0.3}l-${w * 0.06} ${h * 0.3}l-${w * 0.06} -${h * 0.3}z" fill="${i % 2 ? "#2c4b7a" : "#f2d8a7"}"/>`;
    } else o += `<polygon points="${cx - w / 2 + 30},${cy - h / 2 + 4} ${cx + w / 2 - 30},${cy - h / 2 + 4} ${cx + w / 2 - 10},${cy + h / 2 - 4} ${cx - w / 2 + 10},${cy + h / 2 - 4}" fill="#fff" opacity=".18"/>`;
    return o;
  }
  function sideboard(x, by, w, col, t) {
    const d = dark(col, 0.18);
    let o = `<rect x="${x}" y="${by - 48}" width="${w}" height="42" rx="2" fill="${col}"/><rect x="${x - 2}" y="${by - 51}" width="${w + 4}" height="5" rx="1.5" fill="${light(col, 0.12)}"/>`;
    const n = Math.max(2, Math.round(w / 46));
    for (let i = 0; i < n; i++) {
      const dx = x + 4 + (i * (w - 8)) / n;
      o += `<rect x="${n1(dx)}" y="${by - 44}" width="${n1((w - 8) / n - 4)}" height="12" rx="1" fill="none" stroke="${d}" stroke-width="1.4"/><rect x="${n1(dx)}" y="${by - 29}" width="${n1((w - 8) / n - 4)}" height="20" rx="1" fill="none" stroke="${d}" stroke-width="1.4"/><rect x="${n1(dx + ((w - 8) / n - 4) / 2 - 4)}" y="${by - 39}" width="8" height="2" fill="${light(col, 0.3)}"/>`;
    }
    o += `<rect x="${x + 4}" y="${by - 6}" width="4" height="6" fill="${d}"/><rect x="${x + w - 8}" y="${by - 6}" width="4" height="6" fill="${d}"/>`;
    if (t.ht === "aile") o += `<path d="M${x + 10} ${by - 51}h${w - 20}l-${(w - 20) / 2} 14z" fill="#fff" opacity=".9"/><path d="M${x + 10} ${by - 51}h${w - 20}" stroke="#e8e2d4" stroke-dasharray="2 2" stroke-width="2"/>`;
    return o;
  }
  function tvUnit(x, by, w, t, crt) {
    let o = sideboard(x, by, w, t.wood, { ht: "" });
    const cx = x + w / 2;
    if (crt) o += `<rect x="${cx - 26}" y="${by - 92}" width="52" height="42" rx="6" fill="#4b4f57"/><rect x="${cx - 22}" y="${by - 88}" width="38" height="32" rx="5" fill="#2a3b4f"/><path d="M${cx - 20} ${by - 86}l14 0l-14 14z" fill="#fff" opacity=".12"/><circle cx="${cx + 21}" cy="${by - 80}" r="2" fill="#c9cdd3"/><circle cx="${cx + 21}" cy="${by - 72}" r="2" fill="#c9cdd3"/><path d="M${cx - 6} ${by - 92}l-8 -12M${cx + 6} ${by - 92}l8 -12" stroke="#4b4f57" stroke-width="1.4"/>`;
    else {
      const tw = Math.min(w - 10, 30 + t.lux * 14);
      o += `<rect x="${cx - 3}" y="${by - 58}" width="6" height="7" fill="#2b2f36"/><rect x="${cx - tw / 2}" y="${by - 58 - tw * 0.58}" width="${tw}" height="${n1(tw * 0.58)}" rx="2" fill="#1d222b"/><rect x="${cx - tw / 2 + 2.5}" y="${by - 55.5 - tw * 0.58}" width="${tw - 5}" height="${n1(tw * 0.58 - 5)}" rx="1" fill="#2f4c6e"/><path d="M${cx - tw / 2 + 3} ${by - 55 - tw * 0.58}l${tw * 0.4} 0l-${tw * 0.4} ${tw * 0.4}z" fill="#fff" opacity=".1"/>`;
    }
    return o;
  }
  function bookcase(x, by, w, h, t) {
    const d = dark(t.wood, 0.25);
    let o = `<rect x="${x}" y="${by - h}" width="${w}" height="${h}" rx="2" fill="${t.wood}"/><rect x="${x + 4}" y="${by - h + 4}" width="${w - 8}" height="${h - 8}" fill="${d}"/>`;
    const rows = Math.floor((h - 8) / 26);
    const r = rng(t.seed + 3);
    for (let i = 0; i < rows; i++) {
      const sy = by - h + 4 + (i + 1) * 26;
      o += `<rect x="${x + 4}" y="${sy - 2}" width="${w - 8}" height="3" fill="${t.wood}"/>`;
      let bx = x + 6;
      while (bx < x + w - 10) {
        const bw = 3 + r() * 4,
          bh = 14 + r() * 8;
        if (r() < 0.12) {
          bx += 8;
          continue;
        }
        o += `<rect x="${n1(bx)}" y="${n1(sy - 2 - bh)}" width="${n1(bw)}" height="${n1(bh)}" fill="${pk(r, ["#c8553d", "#3d5281", "#e0a33a", "#3f8f8b", "#e6e1d6", "#8c6bb1", "#6f9a5b"])}"/>`;
        bx += bw + 0.8;
      }
    }
    return o;
  }
  function shelf(x, y, w, t) {
    const r = rng(t.seed + 11);
    let o = `<rect x="${x}" y="${y}" width="${w}" height="5" rx="1" fill="${t.wood}"/><rect x="${x}" y="${y + 5}" width="${w}" height="2" fill="#000" opacity=".1"/>`;
    let bx = x + 6;
    while (bx < x + w * 0.55) {
      const bw = 3 + r() * 3,
        bh = 12 + r() * 6;
      o += `<rect x="${n1(bx)}" y="${n1(y - bh)}" width="${n1(bw)}" height="${n1(bh)}" fill="${pk(r, ["#c8553d", "#3d5281", "#e0a33a", "#3f8f8b", "#e6e1d6"])}"/>`;
      bx += bw + 0.8;
    }
    o += `<path d="M${x + w * 0.7} ${y}q-2 -10 4 -14h6q6 4 4 14z" fill="${t.accent}"/>` + G("potted-plant", x + w - 12, y, 18);
    return o;
  }
  function lamps(t, xs) {
    let o = "";
    if (t.lux >= 4) {
      const cx = xs[0];
      o += `<path d="M${cx} 34v14" stroke="#b8a46a" stroke-width="1.6"/><g fill="none" stroke="#c9b273" stroke-width="2"><path d="M${cx - 26} 56q26 16 52 0"/><path d="M${cx - 16} 50q16 10 32 0"/></g>${[-26, -13, 0, 13, 26].map((dx) => `<g><path d="M${cx + dx} ${58 + Math.abs(dx) * -0.1}v-4" stroke="#c9b273"/><ellipse cx="${cx + dx}" cy="${60 - Math.abs(dx) * 0.1}" rx="3" ry="4.5" fill="#fff6d6"/></g>`).join("")}<circle cx="${cx}" cy="58" r="40" fill="url(#${t.id}l)"/>`;
      return o;
    }
    const kind = t.ht === "paylasim" ? "garland" : t.r() < 0.5 ? "globe" : "cone";
    if (kind === "garland") {
      o += `<path d="M70 44Q230 70 398 42" stroke="#555" stroke-width=".8" fill="none"/>${Array.from({ length: 12 }, (_, i) => {
        const x = 80 + i * 27,
          y = 44 + Math.sin((i / 11) * Math.PI) * 16;
        return `<circle cx="${x}" cy="${n1(y + 3)}" r="2.4" fill="${["#ffd36b", "#ff9e9e", "#9edcff", "#b6f0a0"][i % 4]}"/>`;
      }).join("")}`;
      return o;
    }
    xs.forEach((x, i) => {
      const len = 22 + ((i * 13) % 3) * 9;
      o += `<path d="M${x} 34v${len}" stroke="#9aa3ad" stroke-width="1"/>`;
      if (kind === "globe") o += `<circle cx="${x}" cy="${34 + len + 9}" r="10" fill="#e9f3f6" opacity=".85"/><circle cx="${x - 3}" cy="${34 + len + 6}" r="3" fill="#fff" opacity=".8"/>`;
      else o += `<path d="M${x - 10} ${34 + len + 14}l5 -14h10l5 14z" fill="${t.accent}"/><ellipse cx="${x}" cy="${34 + len + 14}" rx="10" ry="2" fill="#fff6c8"/>`;
      o += `<circle cx="${x}" cy="${34 + len + 12}" r="30" fill="url(#${t.id}l)"/>`;
    });
    return o;
  }
  function floorLamp(x, by, t) {
    return `<rect x="${x - 7}" y="${by - 3}" width="14" height="3" rx="1.5" fill="#3d3d45"/><path d="M${x} ${by - 3}V${by - 92}" stroke="#3d3d45" stroke-width="2"/><path d="M${x - 13} ${by - 92}l5 -20h16l5 20z" fill="${light(t.fabric2, 0.3)}"/><circle cx="${x}" cy="${by - 92}" r="34" fill="url(#${t.id}l)"/>`;
  }
  function fireplace(cx, by) {
    return `<rect x="${cx - 40}" y="${by - 70}" width="80" height="70" fill="#d8d0c4"/><rect x="${cx - 46}" y="${by - 76}" width="92" height="8" rx="2" fill="#bdb3a4"/><g fill="#c9c0b2">${[0, 1, 2, 3].map((i) => `<rect x="${cx - 38 + (i % 2) * 6}" y="${by - 64 + i * 15}" width="14" height="10" rx="1"/><rect x="${cx + 22 - (i % 2) * 6}" y="${by - 64 + i * 15}" width="14" height="10" rx="1"/>`).join("")}</g><path d="M${cx - 24} ${by}V${by - 40}q24 -16 48 0V${by}z" fill="#2c2420"/><g class="hs-fire"><path d="M${cx - 14} ${by - 4}q-4 -18 8 -28q-2 12 6 16q2 -10 8 -14q6 14 -2 26z" fill="#f39c34"/><path d="M${cx - 6} ${by - 4}q-2 -10 5 -16q2 8 6 8q2 4 -2 8z" fill="#ffd36b"/></g><rect x="${cx - 18}" y="${by - 6}" width="36" height="5" rx="2" fill="#6b4a33"/>${G("potted-plant", cx - 30, by - 76, 16)}<rect x="${cx + 18}" y="${by - 90}" width="12" height="14" rx="2" fill="#c9a54a"/>`;
  }
  function radiator(x, by, w) {
    let o = `<rect x="${x}" y="${by - 26}" width="${w}" height="24" rx="3" fill="#eef1f4" stroke="#cfd5dc"/>`;
    for (let i = 6; i < w - 2; i += 7) o += `<path d="M${x + i} ${by - 24}v20" stroke="#d5dbe2" stroke-width="2"/>`;
    return o;
  }
  function plant(x, by, size, t) {
    return `<ellipse cx="${x}" cy="${by}" rx="${size * 0.32}" ry="2.6" fill="#000" opacity=".12"/>` + G("potted-plant", x, by, size);
  }
  function poster(x, y, w, h, col, t, rot = 0) {
    return `<g transform="rotate(${rot} ${x + w / 2} ${y + h / 2})"><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${col}"/><circle cx="${x + w / 2}" cy="${y + h * 0.4}" r="${w * 0.25}" fill="#fff" opacity=".7"/><rect x="${x + 4}" y="${y + h * 0.75}" width="${w - 8}" height="3" fill="#fff" opacity=".7"/><rect x="${x + w / 2 - 5}" y="${y - 3}" width="10" height="5" fill="#f4eecf" opacity=".85"/></g>`;
  }
  function boxes(x, by) {
    return `<rect x="${x}" y="${by - 26}" width="34" height="26" fill="#cf9e64"/><path d="M${x} ${by - 26}h34M${x + 17} ${by - 26}v8" stroke="#a9773f" stroke-width="2"/><rect x="${x + 6}" y="${by - 46}" width="26" height="20" fill="#d9ab73"/><path d="M${x + 6} ${by - 40}h26" stroke="#e9e1c6" stroke-width="3"/>`;
  }

  // ---------- Odalar ----------
  function salon(s) {
    const t = theme(s, "salon");
    const r = t.r;
    let o = shell(t);
    const big = t.lux >= 4;
    const fire = t.ht === "mustakil";
    const wx = fire ? 78 : 84,
      ww = big ? 150 : fire ? 84 : 92,
      wy = big ? 46 : 56,
      wh = big ? 140 : 90;
    o += windowBack(s, t, wx, wy, ww, wh, { curtain: t.ht === "paylasim" ? null : t.curtain, long: t.lux >= 2, radiator: t.ht === "yurtdisi", transom: !big });
    // sağ duvar düzeni
    const sx = big ? 254 : fire ? 264 : 236,
      sw = 400 - sx - 10;
    // duvar süsleri
    if (t.ht === "paylasim") {
      o += poster(sx + 8, 58, 30, 40, t.accent, t, -4) + poster(sx + 50, 62, 28, 36, "#3d5281", t, 3) + poster(sx + 92, 56, 30, 42, "#6f9a5b", t, -2);
    } else {
      const kinds = t.ht === "aile" ? ["aile", "manzara", "cini"] : ["manzara", "deniz", "soyut", "portre", "cini"];
      const nF = 1 + Math.floor(r() * 3);
      const fx = sx + 14;
      if (nF === 1) o += frame(fx + sw / 2 - 40, 58, 64, 44, t, pk(r, kinds));
      else for (let i = 0; i < nF; i++) o += frame(fx + i * (sw / nF), 54 + (i % 2) * 10, sw / nF - 14, 34 + (i % 2) * 4, t, pk(r, kinds));
      if (t.lux >= 2 && r() < 0.6) o += shelf(sx + 20, 120, sw - 40, t);
    }
    if (t.ht === "aile") o += clock(224, 58, 10) + nazar(76, 88);
    else if (r() < 0.4) o += clock(224, 60, 9);
    o += lamps(t, [200, 300]);
    // sol: konsol/TV
    const tvx = wx - 6;
    if (has(s, "tv")) o += tvUnit(tvx, 196, ww + 12, { ...t, lux: 6 }, false);
    else if (t.ht === "aile") o += tvUnit(tvx, 196, ww + 12, t, true);
    else if (t.ht === "paylasim") o += boxes(70, 198) + `<rect x="${wx + 20}" y="168" width="44" height="28" fill="#e9e1d4"/><rect x="${wx + 22}" y="160" width="40" height="8" fill="#f4efe6"/>` + G("laptop", wx + 42, 160, 26);
    else if (big) o += plant(70, 198, 40, t);
    else if (fire) o += sideboard(tvx, 196, ww + 12, t.wood, t);
    else o += r() < 0.5 ? tvUnit(tvx, 196, ww + 12, t, false) : sideboard(tvx, 196, ww + 12, t.accent, t);
    // kanepe ve masa
    if (t.ht === "paylasim") o += beanbag(sx + 46, 206, t.fabric) + beanbag(sx + 110, 208, t.fabric2);
    else o += sofa(sx, 206, sw, has(s, "koltuk") ? "#3d5281" : t.fabric, r, has(s, "koltuk") || t.lux >= 2 ? 1 : 0);
    if (fire) o += fireplace(212, 196);
    if (big) o += floorLamp(244, 204, t);
    if (t.ht !== "paylasim") o += plant(sx - 8, 204, 30, t);
    o += rug(300, 236, 190, 30, t.ht === "aile" ? "#a8342b" : light(t.fabric2, 0.25), t.ht === "aile" || r() < 0.2);
    o += coffeeTable(318, 244, 86, t.wood, r, t);
    if (t.lux >= 2 && r() < 0.5) o += armchair(10, 236, t.fabric2);
    // sahip olunan eşyalar
    if (has(s, "konsol")) o += `<rect x="${tvx + 8}" y="186" width="26" height="8" rx="2" fill="#1d222b"/><rect x="${tvx + 10}" y="188" width="6" height="1.5" fill="#4fa3ff"/><path d="M${tvx + 40} 192q4 -5 10 0q2 3 -2 3h-6q-4 0 -2 -3z" fill="#2b2f36"/>`;
    if (has(s, "laptop")) o += G("laptop", 300, 216, 24);
    if (has(s, "gitar")) o += `<g transform="rotate(-12 ${sx - 22} 204)">${G("guitar", sx - 22, 206, 30)}</g>`;
    if (has(s, "klima")) o += `<rect x="${sx + 8}" y="40" width="66" height="16" rx="4" fill="#f7f9fb" stroke="#d5dbe2"/><path d="M${sx + 12} 52h58" stroke="#c9ced5"/><circle cx="${sx + 68}" cy="45" r="1.4" fill="#4fe08a"/>`;
    if (has(s, "kitap")) o += bookcase(400 - 52, 198, 46, 112, t);
    return { svg: o, t };
  }
  function yatak(s) {
    const t = theme(s, "yatak");
    const r = t.r;
    let o = shell(t);
    o += windowBack(s, t, 150, 58, 78, 80, { curtain: t.curtain, light: true, radiator: t.ht === "yurtdisi" });
    // gardırop
    const wd = light(t.wood, 0.15);
    o += `<rect x="72" y="70" width="64" height="126" rx="2" fill="${wd}"/><rect x="72" y="70" width="64" height="126" rx="2" fill="url(#${t.id}w)"/><path d="M104 74v118" stroke="${dark(wd, 0.2)}" stroke-width="1.6"/><rect x="99" y="124" width="2" height="12" fill="#c9a54a"/><rect x="107" y="124" width="2" height="12" fill="#c9a54a"/><rect x="70" y="66" width="68" height="6" rx="1" fill="${dark(wd, 0.1)}"/>`;
    if (t.ht === "paylasim") o += boxes(76, 66).replace(/198/g, "66");
    // yatak
    const dbl = !!s.partner || t.lux >= 2;
    const bx0 = dbl ? 246 : 270,
      bx1 = dbl ? 388 : 364;
    const bc = t.fabric,
      sheet = "#f7f5f0";
    o += `<rect x="${bx0}" y="112" width="${bx1 - bx0}" height="86" rx="10" fill="${t.lux >= 2 ? t.fabric2 : t.wood}"/><rect x="${bx0 + 6}" y="118" width="${bx1 - bx0 - 12}" height="30" rx="7" fill="#fff" opacity=".12"/>`;
    o += `<polygon points="${bx0 + 2},172 ${bx1 - 2},172 ${bx1 + 14},226 ${bx0 - 14},226" fill="${sheet}"/>`;
    const np = dbl ? 2 : 1;
    for (let i = 0; i < np; i++) {
      const pw = (bx1 - bx0 - 20) / np;
      o += `<rect x="${n1(bx0 + 10 + i * pw)}" y="154" width="${n1(pw - 6)}" height="20" rx="8" fill="#fff"/><rect x="${n1(bx0 + 10 + i * pw)}" y="166" width="${n1(pw - 6)}" height="7" rx="3" fill="#000" opacity=".05"/>`;
    }
    o += `<polygon points="${bx0 - 2},184 ${bx1 + 2},184 ${bx1 + 16},230 ${bx0 - 16},230" fill="${bc}"/><polygon points="${bx0 - 2},184 ${bx1 + 2},184 ${bx1 + 4},190 ${bx0 - 4},190" fill="#fff" opacity=".25"/><rect x="${bx0 - 16}" y="230" width="${bx1 - bx0 + 32}" height="12" fill="${dark(bc, 0.15)}"/><path d="M${bx0 + 20} 200q30 10 70 0" stroke="#fff" stroke-opacity=".18" stroke-width="3" fill="none"/>`;
    // komodin ve lamba
    const ns = (x) => `<rect x="${x}" y="168" width="26" height="30" rx="2" fill="${t.wood}"/><rect x="${x + 3}" y="174" width="20" height="9" rx="1" fill="none" stroke="${dark(t.wood, 0.2)}"/><rect x="${x + 11}" y="177" width="4" height="2" fill="#c9a54a"/><path d="M${x + 13} 168v-12" stroke="#5a4032" stroke-width="2"/><path d="M${x + 4} 158l4 -14h10l4 14z" fill="${light(t.accent, 0.35)}"/><circle cx="${x + 13}" cy="156" r="22" fill="url(#${t.id}l)"/>`;
    o += ns(bx0 - 30);
    if (bx1 + 30 < 400) o += ns(bx1 + 4);
    if (t.ht === "aile") o += nazar(232, 100) + frame(276, 60, 56, 40, t, "aile");
    else o += frame(bx0 + (bx1 - bx0) / 2 - 30, 62, 60, 40, t, pk(r, ["manzara", "soyut", "deniz", "cini"]));
    o += lamps(t, [200]);
    o += rug(170, 238, 140, 26, light(t.fabric2, 0.3), t.ht === "aile");
    o += `<g><ellipse cx="226" cy="246" rx="8" ry="3" fill="${t.accent}"/><ellipse cx="240" cy="248" rx="8" ry="3" fill="${t.accent}"/></g>`;
    if ((s.children || []).some((c) => s.year - c.born < 3)) o += `<g><rect x="16" y="196" width="44" height="34" rx="3" fill="#f4efe6"/><path d="M20 196v30M28 196v30M36 196v30M44 196v30M52 196v30" stroke="#d9cdb8" stroke-width="2"/><rect x="18" y="214" width="40" height="8" fill="#9ed0f0"/></g>`;
    return { svg: o, t };
  }
  function mutfak(s) {
    const t = theme(s, "mutfak");
    const r = t.r;
    let o = shell(t, { tile: 34, vpx: 230 });
    const cab = pk(r, ["#f4f1ea", "#9fc3d9", "#a8c49a", "#2e4266", "#e7d6bd", "#d9e2ea"]);
    const top = pk(r, ["#e9e5de", "#3a3f48", "#c9a77c", "#f4f4f2"]);
    // fayans
    o += `<rect x="64" y="100" width="280" height="46" fill="${light(t.wall, 0.4)}"/>`;
    if (t.ht === "aile") {
      for (let x = 64; x < 344; x += 14) for (let y = 100; y < 146; y += 14) o += `<rect x="${x}" y="${y}" width="14" height="14" fill="#eef4fb" stroke="#c9d6e6" stroke-width=".8"/><circle cx="${x + 7}" cy="${y + 7}" r="3" fill="none" stroke="#2c6fb8" stroke-width="1"/>`;
    } else {
      for (let y = 100, i = 0; y < 146; y += 8, i++) for (let x = 64 - (i % 2) * 8; x < 344; x += 16) o += `<rect x="${x}" y="${y}" width="16" height="8" fill="none" stroke="${dark(t.wall, 0.05)}" stroke-width=".8"/>`;
    }
    // pencere (eviyenin üstü)
    o += windowBack(s, t, 196, 52, 70, 44, { light: false, transom: false });
    // üst dolaplar
    const up = (x, w) => `<rect x="${x}" y="46" width="${w}" height="46" rx="2" fill="${cab}"/><rect x="${x}" y="46" width="${w}" height="46" rx="2" fill="url(#${t.id}w)"/>${Array.from({ length: Math.round(w / 32) }, (_, i) => `<rect x="${n1(x + 3 + (i * w) / Math.round(w / 32))}" y="49" width="${n1(w / Math.round(w / 32) - 6)}" height="40" rx="2" fill="none" stroke="${dark(cab, 0.1)}"/>`).join("")}<rect x="${x}" y="92" width="${w}" height="3" fill="#000" opacity=".1"/>`;
    o += up(70, 110) + up(282, 60);
    // davlumbaz
    o += `<path d="M86 96h56l-8 -22h-40z" fill="#c9cdd3"/><rect x="104" y="46" width="20" height="28" fill="#b6bbc2"/>`;
    // tezgâh ve alt dolaplar
    o += `<rect x="64" y="146" width="282" height="6" fill="${top}"/><rect x="64" y="152" width="282" height="40" fill="${cab}"/>`;
    for (let x = 66; x < 344; x += 35) o += `<rect x="${x + 2}" y="155" width="31" height="34" rx="2" fill="none" stroke="${dark(cab, 0.12)}"/><rect x="${x + 14}" y="158" width="8" height="2" fill="#9aa3ad"/>`;
    // fırın ve ocak
    o += `<rect x="90" y="155" width="50" height="34" rx="2" fill="#3a3f48"/><rect x="96" y="162" width="38" height="20" rx="2" fill="#1d222b"/><rect x="98" y="164" width="34" height="5" fill="#fff" opacity=".08"/><rect x="96" y="157" width="38" height="2" fill="#9aa3ad"/>`;
    o += `<ellipse cx="102" cy="146" rx="9" ry="2" fill="#2b2f36"/><ellipse cx="128" cy="146" rx="9" ry="2" fill="#2b2f36"/>`;
    // çaydanlık (iki katlı)
    o += `<g><path d="M118 145q-2 -14 10 -16q12 2 10 16z" fill="#c9cdd3"/><path d="M138 136l7 -5" stroke="#c9cdd3" stroke-width="3" stroke-linecap="round"/><path d="M121 129q-1 -10 7 -11q8 1 7 11z" fill="#d84b3c"/><circle cx="128" cy="117" r="2" fill="#d84b3c"/><path d="M135 124l5 -4" stroke="#d84b3c" stroke-width="2.4" stroke-linecap="round"/><path d="M122 132h12" stroke="#fff" stroke-opacity=".4"/></g>`;
    o += `<g class="hs-cloud" opacity=".5"><path d="M128 112q-4 -6 0 -12q4 -6 0 -12" stroke="#fff" stroke-width="2" fill="none"/></g>`;
    // eviye
    o += `<rect x="208" y="144" width="46" height="5" rx="2" fill="#b8bec6"/><path d="M231 144v-16q0 -6 8 -6" stroke="#9aa3ad" stroke-width="3" fill="none"/>`;
    // buzdolabı
    const fr = pk(r, ["#eef1f4", "#d9dde2", "#c9d9e8", "#f2d6c2"]);
    o += `<rect x="348" y="60" width="50" height="138" rx="5" fill="${fr}"/><path d="M348 112h50" stroke="${dark(fr, 0.12)}" stroke-width="1.6"/><rect x="354" y="70" width="3" height="30" rx="1.5" fill="#9aa3ad"/><rect x="354" y="120" width="3" height="40" rx="1.5" fill="#9aa3ad"/><rect x="368" y="76" width="10" height="8" fill="${t.accent}" transform="rotate(-6 373 80)"/><circle cx="386" cy="90" r="3" fill="#4aa3e8"/><rect x="348" y="60" width="50" height="138" rx="5" fill="url(#${t.id}w)"/>`;
    // tezgâh üstü eşyalar
    o += `<rect x="290" y="128" width="22" height="18" rx="3" fill="#e0e4ea"/><rect x="294" y="132" width="14" height="8" fill="#2f4c6e"/>` + G("potted-plant", 330, 146, 16) + `<path d="M162 146q-2 -12 6 -14q8 2 6 14z" fill="${t.accent}"/>`;
    if (has(s, "kahve")) o += `<rect x="262" y="122" width="22" height="24" rx="3" fill="#3a3f48"/><rect x="266" y="126" width="14" height="6" fill="#9aa3ad"/><rect x="268" y="136" width="10" height="2" fill="#c9cdd3"/><path d="M269 146v-5h8v5" fill="#fff"/>`;
    if (t.ht === "aile") o += `<rect x="12" y="52" width="34" height="44" fill="#fff" transform="skewY(18)"/><rect x="16" y="66" width="26" height="6" fill="#c43c35" transform="skewY(18)"/>`;
    o += lamps(t, [140, 300]);
    // kahvaltı masası
    const tc = t.wood;
    o += `<ellipse cx="326" cy="252" rx="66" ry="6" fill="#000" opacity=".12"/><polygon points="276,212 380,212 398,228 258,228" fill="${light(tc, 0.1)}"/><rect x="258" y="228" width="140" height="6" fill="${dark(tc, 0.2)}"/><rect x="264" y="234" width="6" height="18" fill="${dark(tc, 0.25)}"/><rect x="386" y="234" width="6" height="18" fill="${dark(tc, 0.25)}"/>`;
    o += `<path d="M262 228h136" stroke="${t.ht === "aile" ? "#c43c35" : "#fff"}" stroke-width="2" opacity=".35"/>`;
    o += tea(288, 222) + tea(350, 222) + `<ellipse cx="320" cy="222" rx="14" ry="3.6" fill="#fff"/><circle cx="314" cy="220" r="3" fill="#f2c84b"/><circle cx="322" cy="219" r="3" fill="#c84b3c"/><circle cx="328" cy="221" r="2.4" fill="#4f8a3a"/><rect x="370" y="216" width="18" height="6" rx="3" fill="#e0a85a"/>`;
    // sandalyeler
    o += `<rect x="236" y="196" width="8" height="56" rx="2" fill="${dark(tc, 0.1)}"/><rect x="236" y="226" width="22" height="5" fill="${tc}"/>`;
    return { svg: o, t };
  }
  function garaj(s) {
    const t = theme(s, "garaj");
    const r = t.r;
    const home = t.ht === "mustakil" || t.ht === "villa";
    t.wall = home ? "#cfd3d8" : "#8f959d";
    t.side = dark(t.wall, 0.1);
    t.ceil = home ? "#e7e9ec" : "#7b8189";
    t.floor = home ? ["#a7adb4", "#959ba3"] : ["#646a72", "#596067"];
    let o = shell(t, { tile: home ? 70 : 90, noBase: true });
    // tavan ışığı
    o += `<rect x="150" y="24" width="100" height="5" rx="2.5" fill="#fff"/><rect x="150" y="29" width="100" height="70" fill="url(#${t.id}l)" opacity=".7"/>`;
    if (home) {
      // panjur kapı
      o += `<rect x="124" y="62" width="212" height="136" fill="#e9ecef"/>`;
      for (let y = 66; y < 196; y += 9) o += `<path d="M126 ${y}h208" stroke="#c9ced5" stroke-width="2"/>`;
      o += `<rect x="120" y="58" width="220" height="6" fill="#b7bdc5"/><rect x="214" y="186" width="32" height="4" rx="2" fill="#9aa3ad"/>`;
      // takım panosu
      o += `<rect x="70" y="80" width="44" height="60" fill="#d9b07c"/><g fill="#d9b07c" stroke="#b89262">${Array.from({ length: 20 }, (_, i) => `<circle cx="${74 + (i % 5) * 9}" cy="${84 + Math.floor(i / 5) * 14}" r=".9"/>`).join("")}</g><path d="M78 90v26M78 116l-3 6h6z" stroke="#5a6470" stroke-width="2.6" fill="#5a6470"/><path d="M92 88l0 30" stroke="#c43c35" stroke-width="3"/><rect x="88" y="86" width="8" height="6" fill="#5a6470"/><path d="M104 90v24" stroke="#5a6470" stroke-width="2"/><circle cx="104" cy="90" r="4" fill="none" stroke="#5a6470" stroke-width="2.4"/>`;
      // tezgâh
      o += `<rect x="64" y="160" width="56" height="6" fill="#a87148"/><rect x="68" y="166" width="4" height="30" fill="#8d5b3b"/><rect x="112" y="166" width="4" height="30" fill="#8d5b3b"/><rect x="80" y="150" width="14" height="10" fill="#c43c35"/><rect x="98" y="152" width="10" height="8" fill="#3d5281"/>`;
      // raflar
      o += `<g>${[90, 130, 170].map((y) => `<rect x="344" y="${y}" width="54" height="4" fill="#9aa3ad"/>`).join("")}<rect x="348" y="72" width="16" height="18" fill="#cf9e64"/><rect x="368" y="76" width="14" height="14" fill="#cf9e64"/><rect x="350" y="114" width="10" height="16" rx="2" fill="#2f7fbf"/><rect x="362" y="116" width="10" height="14" rx="2" fill="#e0a33a"/><circle cx="388" cy="158" r="12" fill="#2b2f36"/><circle cx="388" cy="158" r="5" fill="#9aa3ad"/></g>`;
    } else {
      // otopark
      o += `<text x="196" y="72" font-family="Baloo 2, Nunito, sans-serif" font-size="22" font-weight="700" fill="#f2c84b" text-anchor="middle">B2</text><text x="196" y="88" font-family="Nunito, sans-serif" font-size="9" fill="#e9eef5" text-anchor="middle">OTOPARK · ${(t.seed % 80) + 10}</text>`;
      for (const px of [104, 300]) o += `<rect x="${px}" y="34" width="24" height="164" fill="#a3a9b1"/><g>${[0, 1, 2, 3, 4].map((i) => `<path d="M${px} ${170 + i * 6}l24 -6" stroke="${i % 2 ? "#2b2f36" : "#f2c84b"}" stroke-width="4"/>`).join("")}</g>`;
      o += `<g opacity=".55" style="filter:grayscale(1)">${G("automobile", 40, 206, 110)}${G("sport-utility-vehicle", 372, 206, 110)}</g>`;
      o += `<g stroke="#e9eef5" stroke-width="3" opacity=".8"><path d="M118 260L150 200M300 200L332 260"/></g>`;
    }
    o += `<ellipse cx="${200 + (r() - 0.5) * 60}" cy="${236 + r() * 12}" rx="22" ry="5" fill="#2b2f36" opacity=".25"/>`;
    // araç
    if (s.car && Art.CARS[s.car]) {
      const c = Art.CARS[s.car];
      const hue = Art.CAR_COLORS[(s.carColor || 0) % Art.CAR_COLORS.length];
      o += `<g class="hs-car" style="filter:hue-rotate(${hue}deg)">${c.small ? G(c.art, 262, 244, c.size * 1.5) : G(c.art, 268, 248, c.size * 1.65)}</g>`;
    } else o += `<text x="230" y="238" font-family="Baloo 2, Nunito, sans-serif" font-size="18" font-weight="700" fill="#fff" opacity=".55" text-anchor="middle" transform="skewX(-10)">BOŞ</text>`;
    return { svg: o, t, solo: true, cast: [96, 252, 0.72] };
  }
  // İş yerleri
  function isyeri(s) {
    const job = s.edu === "ogrenci" && s.job === "none" ? "okul" : s.job;
    const t = theme(s, "is" + job + (s.company || ""));
    const r = t.r;
    const coWorkers = [];
    let o;
    const desk = (x, by, w) => `<rect x="${x}" y="${by - 30}" width="${w}" height="5" rx="1" fill="#e9e5de"/><rect x="${x + 3}" y="${by - 25}" width="4" height="25" fill="#9aa3ad"/><rect x="${x + w - 7}" y="${by - 25}" width="4" height="25" fill="#9aa3ad"/><rect x="${x + w / 2 - 14}" y="${by - 52}" width="28" height="18" rx="2" fill="#2b2f36"/><rect x="${x + w / 2 - 12}" y="${by - 50}" width="24" height="14" fill="#5e8fd1"/><path d="M${x + w / 2} ${by - 34}v4" stroke="#2b2f36" stroke-width="3"/>`;
    if (job === "office" || job === "memur") {
      t.wall = job === "memur" ? "#e8e1cf" : "#e4ebf3";
      t.side = dark(t.wall, 0.08);
      t.floor = ["#b7bec7", "#a6adb6"];
      o = shell(t, { tile: 60 });
      if (job === "office") {
        o += windowBack(s, t, 76, 44, 180, 120, { transom: false, light: true }) + `<rect x="166" y="44" width="4" height="120" fill="#fbfaf7"/>`;
        o += `<rect x="276" y="56" width="110" height="64" rx="3" fill="#fff" stroke="#c9d1db" stroke-width="2"/><path d="M286 108l18 -14l14 8l18 -22l18 6l18 -18" stroke="${t.accent}" stroke-width="3" fill="none"/><path d="M286 112h92" stroke="#c9d1db"/>`;
        o += desk(84, 196, 70) + desk(290, 196, 80) + plant(266, 198, 34, t);
        coWorkers.push([314, 196, 0.48]);
      } else {
        o += `<rect x="80" y="54" width="120" height="30" rx="3" fill="#2b2f36"/><text x="140" y="75" font-family="Baloo 2, Nunito, sans-serif" font-size="16" fill="#f2c84b" text-anchor="middle">SIRA No: ${(t.seed % 300) + 100}</text>`;
        o += `<g>${[0, 1, 2].map((i) => `<rect x="${232 + i * 52}" y="70" width="44" height="126" fill="#9aa3ad"/>${[0, 1, 2, 3].map((j) => `<rect x="${236 + i * 52}" y="${76 + j * 30}" width="36" height="26" fill="#b7bec7"/><rect x="${250 + i * 52}" y="${86 + j * 30}" width="8" height="3" fill="#6b737d"/>`).join("")}`).join("")}</g>`;
        o += `<rect x="64" y="150" width="160" height="46" fill="#c08a5a"/><rect x="60" y="146" width="168" height="6" fill="#a87148"/>` + `<g>${[0, 1, 2].map((i) => `<rect x="${86 + i * 10}" y="${130 - i * 6}" width="34" height="${16 + i * 6}" fill="${["#e0c27a", "#d9b06a", "#e9d39a"][i]}" transform="rotate(${i * 3 - 3} ${100} 140)"/>`).join("")}</g>` + clock(214, 100, 10);
        coWorkers.push([140, 150, 0.46]);
      }
    } else if (job === "cafe") {
      t.wall = "#6d4c41";
      t.side = dark(t.wall, 0.1);
      t.floor = FLOORS.ceviz;
      o = shell(t);
      o += `<rect x="90" y="48" width="140" height="70" rx="3" fill="#2b2f36" stroke="#a87148" stroke-width="4"/><text x="160" y="68" font-family="Baloo 2, Nunito, sans-serif" font-size="12" fill="#fff" text-anchor="middle">MENÜ</text>${["Türk kahvesi", "Latte", "Çay", "Kurabiye"].map((m, i) => `<text x="100" y="${82 + i * 10}" font-family="Nunito, sans-serif" font-size="7" fill="#e9eef5">${m}</text><text x="220" y="${82 + i * 10}" font-family="Nunito, sans-serif" font-size="7" fill="#f2c84b" text-anchor="end">₺${Math.round([110, 160, 35, 75][i] * s.idx.food)}</text>`).join("")}`;
      o += `<g>${[0, 1, 2].map((i) => `<rect x="${256 + i * 0}" y="${70 + i * 34}" width="130" height="4" fill="#a87148"/>`).join("")}${Array.from({ length: 10 }, (_, i) => `<rect x="${262 + (i % 5) * 24}" y="${52 + Math.floor(i / 5) * 34}" width="14" height="18" rx="3" fill="#f4efe6" opacity=".9"/>`).join("")}</g>`;
      o += lamps({ ...t, ht: "", r: () => 0.9 }, [140, 260, 360]);
      o += `<rect x="200" y="150" width="200" height="56" fill="#a87148"/><rect x="196" y="144" width="204" height="8" fill="#d9b07c"/><rect x="300" y="112" width="44" height="34" rx="4" fill="#c9cdd3"/><rect x="306" y="120" width="32" height="10" fill="#2b2f36"/>` + G("hot-beverage", 232, 146, 18) + G("hot-beverage", 372, 146, 18);
      coWorkers.push([270, 160, 0.5]);
    } else if (job === "factory") {
      t.wall = "#b9c2cc";
      t.side = dark(t.wall, 0.1);
      t.floor = ["#8d939b", "#7b8189"];
      o = shell(t, { tile: 80 });
      o += `<g>${[90, 170, 250, 330].map((x) => `<rect x="${x}" y="42" width="56" height="26" fill="#d8e6f3" stroke="#9aa3ad" stroke-width="2"/>`).join("")}</g>`;
      o += `<rect x="80" y="110" width="80" height="86" rx="4" fill="#4f7fbf"/><rect x="92" y="124" width="30" height="20" fill="#2b2f36"/><circle cx="140" cy="132" r="8" fill="#e9eef5" stroke="#2b2f36" stroke-width="2"/><path d="M140 132l4 -5" stroke="#c43c35" stroke-width="2"/><rect x="88" y="186" width="64" height="10" fill="#f2c84b"/><g>${[0, 1, 2, 3, 4, 5].map((i) => `<path d="M${90 + i * 10} 186l8 10" stroke="#2b2f36" stroke-width="3"/>`).join("")}</g>`;
      o += `<rect x="180" y="168" width="220" height="12" rx="6" fill="#5a6470"/>${[200, 240, 280, 320, 360].map((x, i) => `<circle cx="${x}" cy="174" r="5" fill="#9aa3ad"/>`).join("")}<g class="hs-ferry">${[0, 1, 2].map((i) => `<rect x="${200 + i * 60}" y="150" width="22" height="18" fill="#cf9e64"/>`).join("")}</g><rect x="186" y="180" width="6" height="18" fill="#5a6470"/><rect x="386" y="180" width="6" height="18" fill="#5a6470"/>`;
      coWorkers.push([300, 168, 0.46]);
    } else if (job === "teacher" || job === "okul") {
      t.wall = "#f1e7d3";
      t.side = dark(t.wall, 0.08);
      o = shell(t);
      o += `<rect x="112" y="56" width="190" height="84" rx="3" fill="#2f5d4a" stroke="#a87148" stroke-width="5"/><text x="124" y="80" font-family="Nunito, sans-serif" font-size="11" fill="#e9eef5">${job === "okul" ? "İktisada giriş · 3. hafta" : "Bugünün konusu: Kesirler"}</text><path d="M124 96h80M124 110h120M124 124h60" stroke="#e9eef5" stroke-width="2" opacity=".7"/><text x="270" y="128" font-family="Nunito, sans-serif" font-size="12" fill="#f2c84b">½ + ¼</text><rect x="110" y="140" width="194" height="4" fill="#a87148"/>`;
      o += G("world-map", 350, 120, 54) + clock(80, 70, 9);
      const deskS = (x, by) => `<rect x="${x}" y="${by - 26}" width="52" height="5" fill="${t.wood}"/><rect x="${x + 4}" y="${by - 21}" width="4" height="21" fill="#7d8792"/><rect x="${x + 44}" y="${by - 21}" width="4" height="21" fill="#7d8792"/><rect x="${x + 14}" y="${by - 30}" width="14" height="4" fill="#fff"/>`;
      o += deskS(250, 222) + deskS(320, 224) + deskS(286, 252);
      coWorkers.push([352, 200, 0.4]);
    } else if (job === "nurse") {
      t.wall = "#d6ece6";
      t.side = dark(t.wall, 0.08);
      t.floor = ["#d9dde2", "#c9ced5"];
      o = shell(t, { tile: 50 });
      o += `<rect x="70" y="40" width="4" height="150" fill="#9aa3ad"/><path d="M74 46h78v150q-40 -10 -78 0z" fill="#9ccfc3" opacity=".9"/><path d="M90 46v146M110 46v146M130 46v146" stroke="#fff" stroke-opacity=".3" stroke-width="3"/>`;
      o += `<rect x="236" y="150" width="140" height="22" rx="4" fill="#f7f9fb"/><rect x="236" y="168" width="140" height="8" fill="#c9ced5"/><rect x="240" y="176" width="4" height="22" fill="#9aa3ad"/><rect x="368" y="176" width="4" height="22" fill="#9aa3ad"/><rect x="246" y="140" width="34" height="14" rx="6" fill="#fff"/><path d="M234 150v-22M378 150v-22" stroke="#9aa3ad" stroke-width="3"/>`;
      o += `<rect x="196" y="64" width="64" height="44" rx="4" fill="#2b2f36"/><path d="M202 88h12l4 -12l6 22l4 -10h28" stroke="#4fe08a" stroke-width="2" fill="none"/><path d="M190 70v120" stroke="#9aa3ad" stroke-width="2"/><rect x="182" y="62" width="16" height="22" rx="3" fill="#cfe9f7" stroke="#9aa3ad"/>` + G("stethoscope", 340, 120, 30);
      coWorkers.push([150, 196, 0.48]);
    } else if (job === "business") {
      t.wall = "#f4ecdc";
      t.side = dark(t.wall, 0.08);
      o = shell(t);
      for (let i = 0; i < 4; i++) {
        o += `<rect x="70" y="${60 + i * 34}" width="190" height="4" fill="#a87148"/>`;
        for (let x = 74; x < 254; x += 12) o += `<rect x="${x}" y="${60 + i * 34 - 16 - ((x * 7 + i) % 6)}" width="9" height="${16 + ((x * 7 + i) % 6)}" rx="1.5" fill="${["#c8553d", "#e0a33a", "#3f8f8b", "#3d5281", "#6f9a5b", "#e6e1d6"][(x + i * 3) % 6]}"/>`;
      }
      o += `<rect x="270" y="150" width="130" height="48" fill="#a87148"/><rect x="266" y="144" width="134" height="8" fill="#d9b07c"/><rect x="300" y="118" width="40" height="26" rx="3" fill="#3a3f48"/><rect x="306" y="122" width="28" height="10" fill="#4fe08a" opacity=".7"/>` + nazar(380, 80) + G("potted-plant", 380, 144, 20);
    } else if (job === "music") {
      t.wall = "#1f2235";
      t.side = "#191b2b";
      t.ceil = "#14162a";
      t.floor = ["#2b2f45", "#24283c"];
      o = shell(t, { noBase: true });
      o += `<polygon points="120,34 90,198 200,198" fill="#fff6c8" opacity=".12"/><polygon points="300,34 250,198 360,198" fill="#c8e0ff" opacity=".12"/><rect x="64" y="182" width="336" height="16" fill="#3a3f5a"/>`;
      o += `<rect x="78" y="120" width="40" height="62" rx="3" fill="#2b2f36"/><circle cx="98" cy="140" r="12" fill="#1b1d22" stroke="#555"/><circle cx="98" cy="168" r="8" fill="#1b1d22" stroke="#555"/><rect x="340" y="120" width="40" height="62" rx="3" fill="#2b2f36"/><circle cx="360" cy="140" r="12" fill="#1b1d22" stroke="#555"/><circle cx="360" cy="168" r="8" fill="#1b1d22" stroke="#555"/>`;
      o += `<path d="M262 196V120" stroke="#9aa3ad" stroke-width="2"/><ellipse cx="262" cy="118" rx="4" ry="6" fill="#2b2f36"/>` + G("guitar", 300, 196, 40);
      o += `<g fill="#0f1020">${Array.from({ length: 16 }, (_, i) => `<circle cx="${i * 26 + 10}" cy="${252 - (i % 3) * 4}" r="10"/><rect x="${i * 26}" y="${252 - (i % 3) * 4}" width="20" height="20" rx="8"/>`).join("")}</g>`;
    } else {
      // sokak (suç) ya da bilinmeyen
      t.wall = "#7a4a3a";
      t.side = dark(t.wall, 0.15);
      t.ceil = "#1c2a48";
      t.floor = ["#4a4f58", "#3f444c"];
      o = shell(t, { noBase: true, tile: 70 });
      for (let y = 40; y < 196; y += 10) for (let x = 64 - ((y / 10) % 2) * 12; x < 400; x += 24) o += `<rect x="${x}" y="${y}" width="22" height="8" fill="#8a5646"/>`;
      o += `<rect x="290" y="146" width="90" height="50" rx="3" fill="#3d6b4a"/><rect x="286" y="140" width="98" height="8" fill="#2f5a3c"/><path d="M180 34v40" stroke="#56606f" stroke-width="3"/><ellipse cx="180" cy="80" rx="10" ry="4" fill="#ffe9a8"/><polygon points="170,80 190,80 240,198 120,198" fill="#ffe9a8" opacity=".12"/>`;
    }
    // iş arkadaşları
    coWorkers.forEach(([cx, by, k], i) => {
      const h = Art.hash((s.company || s.job) + i + (t.seed % 7));
      const p = {
        gender: h % 2 ? "man" : "woman",
        skin: h % 4,
        hair: h % 2 ? pk(rng(h), ["short", "curly", "short", "shaved"]) : pk(rng(h), ["long", "bun", "braid", "curly"]),
        hairColor: Object.keys(Art.HAIR_COLORS)[(h >>> 4) % 5],
        age: 24 + (h % 30),
        gray: (h % 30) > 20 ? 0.4 : 0,
        outfit: { office: "gomlek", memur: "takim", cafe: "kafe", factory: "tulum", teacher: "hirka", okul: "gunluk", nurse: "forma" }[job] || "gunluk",
        mood: (h >>> 2) % 3 === 0 ? 0 : 1,
        eyeColor: (h >>> 6) % 4,
        beard: h % 5 === 1,
        fat: 0.2 + ((h >>> 8) % 5) / 10,
      };
      if (p.outfit === "takim" && i % 2) p.outfit = "gomlek";
      o += Art.put("hs-partner", cx, by, k, Art.person(p));
    });
    return { svg: o, t, solo: true, cast: [150, 252, 0.76] };
  }

  // Bir akrabanın evi (ziyaret): onun il ve yaşına göre kurulan bir salon.
  function ziyaret(s) {
    const k = HS.visitNow && HS.visitNow(s);
    if (!k) return salon(s);
    const old = HS.kinAge(s, k) >= 40;
    const s2 = Object.assign({}, s, { id: k.id, housing: old ? "aile" : "kira", city: k.city, homeV: 0, moves: 0, items: [], car: null });
    const room = salon(s2);
    room.guest = k;
    room.solo = true;
    room.cast = [150, 252, 0.78];
    return room;
  }
  const ROOMS = { salon, yatak, mutfak, garaj, is: isyeri, ziyaret };
  const LABELS = { salon: "Salon", yatak: "Yatak odası", mutfak: "Mutfak", garaj: "Garaj", is: "İş yeri", sokak: "Sokak", ziyaret: "Ziyaret" };
  Art.views = function (s) {
    const ht = Art.homeType(s);
    const v = ["salon", "yatak", "mutfak"];
    if (s.car || ht === "mustakil" || ht === "villa") v.push("garaj");
    if (s.job !== "none" || s.edu === "ogrenci") v.push("is");
    v.push("sokak");
    const k = HS.visitNow && HS.visitNow(s);
    if (k) v.unshift("ziyaret");
    return v.map((id) => ({ id, label: id === "ziyaret" ? HS.kinLabel(k) : id === "garaj" && !(ht === "mustakil" || ht === "villa") ? "Otopark" : id === "is" && s.edu === "ogrenci" && s.job === "none" ? "Okul" : LABELS[id] }));
  };
  // opt.night: gece görünümü (pencerede gece, oda loş, lambalar yanık).
  Art.scene = function (s, view = "salon", opt = {}) {
    if (view === "sokak" || !ROOMS[view]) return Art.street(s);
    const ok = Art.views(s).map((v) => v.id);
    if (!ok.includes(view)) view = "salon";
    NIGHT = !!opt.night && view !== "is";
    const room = ROOMS[view](s);
    let o = `<svg viewBox="0 0 400 260" preserveAspectRatio="xMidYMax slice" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${LABELS[view]}">`;
    o += room.svg;
    if (NIGHT) o += `<rect width="400" height="260" fill="#14204a" opacity=".26"/><circle cx="200" cy="70" r="140" fill="#ffe7a8" opacity=".08"/>`;
    const [cx, by, k] = room.cast || [176, 252, 0.78];
    o += Art.cast(s, cx, by, k, { solo: room.solo });
    // Ziyaret edilen akraba ya da gelen misafir
    const g = room.guest || (view === "salon" && HS.guestNow ? HS.guestNow(s) : null);
    if (g && HS.kinLook) o += Art.put("hs-partner", room.guest ? cx + 74 * k : 330, by + (room.guest ? 0 : -4), k * (HS.kinAge(s, g) < 14 ? 0.7 : 0.95), Art.person(HS.kinLook(s, g)));
    if (s.job === "crime" && view !== "is" && !NIGHT) o += `<rect width="400" height="260" fill="#0b1430" opacity=".28"/>`;
    NIGHT = false;
    return o + "</svg>";
  };
})(globalThis.HS || (globalThis.HS = {}));
