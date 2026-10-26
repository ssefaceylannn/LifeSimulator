// Parçalı SVG karakter. Fluent Emoji'nin düz, çizgisiz tarzına uyumlu çizildi.
// HS.Art.person(p) → <g> metni. Koordinatlar: 120×220 kutu, ayaklar y≈214.
// p: { gender, skin, hair, hairColor, gray(0-1), beard, thin, age, outfit, mood(-1|0|1), glasses }
(function (HS) {
  "use strict";
  const Art = (HS.Art = HS.Art || {});

  Art.SKINS = ["#f6d0b1", "#e5ae86", "#c98a5f", "#8f5b3c"];
  Art.SKIN_SHADE = ["#e9b995", "#d39a72", "#b3764e", "#7a4a2f"];
  Art.HAIR_COLORS = {
    siyah: "#2a2320",
    kahve: "#5b3a26",
    kumral: "#8b5b36",
    sari: "#d8b25e",
    kizil: "#a9492a",
  };
  Art.HAIR_NAMES = {
    siyah: "Siyah",
    kahve: "Kahverengi",
    kumral: "Kumral",
    sari: "Sarı",
    kizil: "Kızıl",
  };

  // Kıyafetler. jobs: hangi işlerde "uygun kıyafet" sayılır. price: 2026 TL.
  Art.OUTFITS = {
    gunluk: {
      name: "Tişört ve kot",
      type: "tee",
      top: "#4a86d8",
      acc: "#356cb8",
      bottom: "#33445e",
      shoes: "#f2f4f7",
      price: 0,
    },
    gomlek: {
      name: "Gömlek ve kumaş pantolon",
      type: "shirt",
      top: "#e9eef6",
      acc: "#c9d4e4",
      bottom: "#4b5363",
      shoes: "#5a4032",
      price: 1800,
      jobs: ["office", "teacher", "business"],
    },
    takim: {
      name: "Takım elbise",
      type: "suit",
      top: "#2c3e5c",
      acc: "#c0392b",
      bottom: "#2c3e5c",
      shoes: "#2a2320",
      price: 9500,
      jobs: ["office", "business"],
      formal: true,
    },
    kafe: {
      name: "Kafe önlüğü",
      type: "apron",
      top: "#f4f1ea",
      acc: "#8a5a3b",
      bottom: "#2f3742",
      shoes: "#2a2320",
      price: 900,
      jobs: ["cafe"],
    },
    tulum: {
      name: "İş tulumu",
      type: "overall",
      top: "#2f5fa7",
      acc: "#f39c34",
      bottom: "#2f5fa7",
      shoes: "#4a3a2c",
      price: 1400,
      jobs: ["factory"],
    },
    sahne: {
      name: "Deri ceket",
      type: "jacket",
      top: "#26262b",
      acc: "#d6453d",
      bottom: "#1f2633",
      shoes: "#2a2320",
      price: 4200,
      jobs: ["music"],
    },
    hirka: {
      name: "Hırka ve gömlek",
      type: "cardigan",
      top: "#9d7a54",
      acc: "#eef2f7",
      bottom: "#4d5566",
      shoes: "#5a4032",
      price: 1600,
      jobs: ["teacher"],
    },
    forma: {
      name: "Sağlık forması",
      type: "scrubs",
      top: "#2aa198",
      acc: "#d8e7e5",
      bottom: "#2aa198",
      shoes: "#f2f4f7",
      price: 1200,
      jobs: ["nurse"],
    },
    yelek: {
      name: "Esnaf yeleği",
      type: "vest",
      top: "#f1ece2",
      acc: "#6b4e32",
      bottom: "#3e4552",
      shoes: "#5a4032",
      price: 1300,
      jobs: ["business"],
    },
    kapusonlu: {
      name: "Kapüşonlu",
      type: "hoodie",
      top: "#7a8699",
      acc: "#5f6b7d",
      bottom: "#2c3340",
      shoes: "#f2f4f7",
      price: 1100,
      jobs: ["crime"],
    },
    elbise: {
      name: "Elbise",
      type: "dress",
      top: "#d9607f",
      acc: "#f3b7c6",
      bottom: "#d9607f",
      shoes: "#8a3e52",
      price: 2400,
    },
    esofman: {
      name: "Eşofman",
      type: "track",
      top: "#1f8a5b",
      acc: "#f4f6f8",
      bottom: "#1f8a5b",
      shoes: "#f4f6f8",
      price: 1500,
    },
    emekli: {
      name: "Örgü yelek",
      type: "cardigan",
      top: "#8f8a6e",
      acc: "#e7e2d4",
      bottom: "#5b5f68",
      shoes: "#5a4032",
      price: 1000,
    },
  };

  const mix = (a, b, t) => {
    const h = (c) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
    const [x, y] = [h(a), h(b)];
    return (
      "#" +
      x
        .map((v, i) =>
          Math.round(v + (y[i] - v) * t)
            .toString(16)
            .padStart(2, "0"),
        )
        .join("")
    );
  };
  Art.mix = mix;

  // ---- parçalar ----
  function hairBack(p, c) {
    if (p.hair === "long")
      return `<path fill="${c}" d="M36 40c0-20 11-30 24-30s24 10 24 30v42c0 6-5 9-10 9H46c-5 0-10-3-10-9z"/>`;
    if (p.hair === "bun") return `<circle cx="60" cy="14" r="10" fill="${c}"/>`;
    if (p.hair === "curly" && p.gender === "woman")
      return `<path fill="${c}" d="M34 44c-6-22 8-36 26-36s32 14 26 36c4 12 0 26-8 30H42c-8-4-12-18-8-30z"/>`;
    return "";
  }
  function hairFront(p, c) {
    if (p.thin)
      return `<path fill="${c}" opacity=".95" d="M38 44c-1-6 0-10 3-13l2 13zM82 44c1-6 0-10-3-13l-2 13z"/><path fill="${c}" opacity=".35" d="M44 26c5-4 11-5 16-5s11 1 16 5c-5-1-10-2-16-2s-11 1-16 2z"/>`;
    switch (p.hair) {
      case "shaved":
        return `<path fill="${c}" opacity=".55" d="M38 42c0-16 9-24 22-24s22 8 22 24c-4-7-12-11-22-11s-18 4-22 11z"/>`;
      case "curly":
        return `<g fill="${c}">${[
          [42, 28],
          [50, 21],
          [60, 18],
          [70, 21],
          [78, 28],
          [82, 37],
          [38, 37],
        ]
          .map(([x, y]) => `<circle cx="${x}" cy="${y}" r="8"/>`)
          .join("")}</g>`;
      case "long":
      case "bun":
        return `<path fill="${c}" d="M37 44c-1-17 9-27 23-27s24 10 23 27c-6-9-12-12-18-12-3 5-12 9-28 12z"/>`;
      default: // kısa
        return `<path fill="${c}" d="M37 43c-2-17 8-27 23-27 14 0 24 9 23 26-3-6-9-10-16-10-8 3-18 4-30 11z"/>`;
    }
  }
  function face(p) {
    const ink = "#2b2522";
    const brow =
      p.mood < 0
        ? ["M47 37l8 2", "M73 37l-8 2"]
        : p.mood > 0
          ? ["M47 36q4-2 8 0", "M65 36q4-2 8 0"]
          : ["M47 37h8", "M65 37h8"];
    const mouth =
      p.mood > 0
        ? `<path d="M52 58q8 8 16 0" fill="#9b3d3d"/><path d="M53 58.5q7 3 14 0" fill="#fff" opacity=".9"/>`
        : p.mood < 0
          ? `<path d="M52 61q8-6 16 0" fill="none" stroke="${ink}" stroke-width="2" stroke-linecap="round"/>`
          : `<path d="M53 59q7 2.5 14 0" fill="none" stroke="${ink}" stroke-width="2" stroke-linecap="round"/>`;
    let lines = "";
    if (p.age >= 48)
      lines += `<path d="M50 30h20M52 33h16" stroke="${Art.SKIN_SHADE[p.skin]}" stroke-width="1.2" stroke-linecap="round"/>`;
    if (p.age >= 60)
      lines += `<path d="M42 44l-3-2M42 47l-3 0M78 44l3-2M78 47l3 0" stroke="${Art.SKIN_SHADE[p.skin]}" stroke-width="1.1" stroke-linecap="round"/>`;
    if (p.age >= 70)
      lines += `<path d="M48 54q-2 5 1 9M72 54q2 5-1 9" fill="none" stroke="${Art.SKIN_SHADE[p.skin]}" stroke-width="1.2" stroke-linecap="round"/>`;
    const glasses = p.glasses
      ? `<g fill="none" stroke="#3b4656" stroke-width="1.6"><circle cx="51" cy="44" r="6"/><circle cx="69" cy="44" r="6"/><path d="M57 44h6"/></g>`
      : "";
    return (
      lines +
      `<g class="hs-eyes"><ellipse cx="51" cy="44" rx="2.6" ry="3.2" fill="${ink}"/><ellipse cx="69" cy="44" rx="2.6" ry="3.2" fill="${ink}"/></g>` +
      `<g fill="none" stroke="${ink}" stroke-width="1.8" stroke-linecap="round"><path d="${brow[0]}"/><path d="${brow[1]}"/></g>` +
      `<path d="M60 46q-2 5 0 6" fill="none" stroke="${Art.SKIN_SHADE[p.skin]}" stroke-width="1.6" stroke-linecap="round"/>` +
      `<ellipse cx="46" cy="53" rx="4" ry="2.4" fill="#e8846f" opacity=".28"/><ellipse cx="74" cy="53" rx="4" ry="2.4" fill="#e8846f" opacity=".28"/>` +
      mouth +
      glasses
    );
  }
  function beard(p, c) {
    if (!p.beard) return "";
    // Çene hattı ve bıyık; ağız açıkta kalır.
    return (
      `<path fill="${c}" d="M38 47q1 24 22 25q21-1 22-25q-3 12-10 15q-12 5-24 0q-7-3-10-15z"/>` +
      `<path fill="${c}" d="M51 56q9-4 18 0q-3 3-9 2q-6 1-9-2z"/>`
    );
  }

  // Gövde ve kıyafet
  function body(p, o, skin) {
    const woman = p.gender === "woman";
    const torso = woman
      ? "M36 86q0-8 10-9h28q10 1 10 9l-3 50H39z"
      : "M33 86q0-9 10-10h34q10 1 10 10l-2 52H35z";
    const legs = `<path fill="${o.bottom}" d="M40 134h19l-1 72h-15zM61 134h19l-3 72h-15z"/>`;
    const shoes = `<path fill="${o.shoes}" d="M40 204h19v6q0 3-3 3H36q-2 0-1-3zM62 204h19l4 6q1 3-1 3H65q-3 0-3-3z"/>`;
    let arms = `<path fill="${o.top}" d="M34 86q-6 2-7 12l-2 34h11l3-30zM86 86q6 2 7 12l2 34H84l-3-30z"/>`;
    const hands = `<circle cx="30" cy="136" r="6" fill="${skin}"/><circle cx="90" cy="136" r="6" fill="${skin}"/>`;
    let top = `<path fill="${o.top}" d="${torso}"/>`;
    let extra = "";
    switch (o.type) {
      case "tee":
        arms = `<path fill="${o.top}" d="M34 86q-6 2-7 12l-1 8h11l2-6zM86 86q6 2 7 12l1 8H83l-2-6z"/><path fill="${skin}" d="M26 106h11l-1 26H25zM83 106h11l1 26H84z"/>`;
        extra = `<path d="M52 78q8 6 16 0" fill="none" stroke="${o.acc}" stroke-width="3"/>`;
        break;
      case "shirt":
        extra = `<path fill="${o.acc}" d="M50 77l10 9 10-9 3 5-13 8-13-8z"/><path d="M60 90v40" stroke="${o.acc}" stroke-width="1.2"/><g fill="${o.acc}"><circle cx="60" cy="100" r="1.3"/><circle cx="60" cy="112" r="1.3"/><circle cx="60" cy="124" r="1.3"/></g>`;
        break;
      case "suit":
        extra = `<path fill="#f3f5f8" d="M50 77h20l-10 30z"/><path fill="${o.acc}" d="M58 82h4l2 18-4 6-4-6z"/><path fill="${mix(o.top, "#000000", 0.2)}" d="M50 77l10 30-6-2-8-24zM70 77l-10 30 6-2 8-24z"/>`;
        break;
      case "apron":
        extra = `<path fill="${o.acc}" d="M44 98h32l-2 40H46z"/><path d="M47 98l-4-20M73 98l4-20" stroke="${o.acc}" stroke-width="3"/><rect x="53" y="110" width="14" height="9" rx="2" fill="${mix(o.acc, "#000000", 0.18)}"/>`;
        break;
      case "overall":
        extra = `<path fill="${mix(o.top, "#ffffff", 0.15)}" d="M45 96h30v40H45z"/><path d="M47 96l-3-18M73 96l3-18" stroke="${mix(o.top, "#000000", 0.2)}" stroke-width="4"/><path d="M39 124h42M41 180h16M63 180h16" stroke="${o.acc}" stroke-width="4"/>`;
        break;
      case "jacket":
        extra = `<path fill="${o.acc}" d="M52 77h16l-8 22z"/><path d="M60 99v35" stroke="#8b8f99" stroke-width="1.4"/><path fill="${mix(o.top, "#ffffff", 0.12)}" d="M50 77l8 24-10-4-4-16zM70 77l-8 24 10-4 4-16z"/>`;
        break;
      case "cardigan":
        extra = `<path fill="${o.acc}" d="M52 77h16l-3 57h-10z"/><g fill="${mix(o.top, "#000000", 0.25)}"><circle cx="50" cy="100" r="1.6"/><circle cx="50" cy="114" r="1.6"/><circle cx="50" cy="128" r="1.6"/></g>`;
        break;
      case "scrubs":
        extra = `<path fill="${mix(o.top, "#000000", 0.18)}" d="M52 77l8 12 8-12z"/><path d="M48 80q-4 22 6 26q8 2 8-8M72 80q4 20-4 26" fill="none" stroke="#3d4b5c" stroke-width="2"/><circle cx="62" cy="99" r="3" fill="#9aa7b6"/>`;
        break;
      case "vest":
        extra = `<path fill="${o.acc}" d="M38 86q0-8 9-9l9 16v42H39zM82 86q0-8-9-9l-9 16v42h17z"/><g fill="#e8c76a"><circle cx="61" cy="104" r="1.5"/><circle cx="61" cy="116" r="1.5"/></g>`;
        break;
      case "hoodie":
        extra = `<path fill="${o.acc}" d="M44 76q16 10 32 0l2 6q-18 10-36 0z"/><rect x="47" y="112" width="26" height="12" rx="4" fill="${o.acc}"/><path d="M56 82v12M64 82v12" stroke="#e7e9ee" stroke-width="1.4"/>`;
        break;
      case "track":
        extra = `<path d="M60 78v56" stroke="${o.acc}" stroke-width="1.6"/><path d="M29 94l-3 38M91 94l3 38" stroke="${o.acc}" stroke-width="2.4"/>`;
        break;
      case "dress":
        top = `<path fill="${o.top}" d="M38 86q0-8 9-9h26q9 1 9 9l-2 30 10 44H30l10-44z"/>`;
        extra = `<g fill="${o.acc}"><circle cx="50" cy="128" r="3"/><circle cx="66" cy="140" r="3"/><circle cx="56" cy="152" r="3"/><circle cx="72" cy="122" r="3"/></g>`;
        arms = `<path fill="${o.top}" d="M38 86q-7 2-8 12l-1 6h10l1-6zM82 86q7 2 8 12l1 6H81l-1-6z"/><path fill="${skin}" d="M28 104h10l-2 28H26zM82 104h10l2 28H84z"/>`;
        return (
          arms +
          hands +
          `<path fill="${skin}" d="M44 158h12l-1 48H44zM64 158h12l-1 48H65z"/>` +
          shoes +
          top +
          extra
        );
    }
    return legs + shoes + arms + hands + top + extra;
  }

  Art.person = function (p) {
    const skin = Art.SKINS[p.skin] || Art.SKINS[1];
    const base = Art.HAIR_COLORS[p.hairColor] || Art.HAIR_COLORS.kahve;
    const hc = mix(base, "#dcdcdc", Math.max(0, Math.min(1, p.gray || 0)));
    const o = Art.OUTFITS[p.outfit] || Art.OUTFITS.gunluk;
    // Yaşlılıkta hafif öne eğilme
    const lean = p.age >= 72 ? ' transform="rotate(2 60 214)"' : "";
    return (
      `<g class="hs-person"${lean}>` +
      `<ellipse cx="60" cy="214" rx="30" ry="5" fill="#000" opacity=".12"/>` +
      `<g class="hs-breath">` +
      hairBack(p, hc) + // uzun saç gövdenin arkasında kalır
      body(p, o, skin) +
      `<path fill="${skin}" d="M53 66h14v14q-7 4-14 0z"/>` +
      `<ellipse cx="38" cy="46" rx="4" ry="6" fill="${skin}"/><ellipse cx="82" cy="46" rx="4" ry="6" fill="${skin}"/>` +
      `<ellipse cx="60" cy="44" rx="22" ry="25" fill="${skin}"/>` +
      face(p) +
      beard(p, hc) +
      hairFront(p, hc) +
      `</g></g>`
    );
  };

  // Oyun durumundan karakter parametreleri
  Art.fromState = function (s) {
    const gray = Math.max(0, Math.min(1, (s.age - 34 - (s.seed % 7)) / 40));
    return {
      gender: s.look === "man" ? "man" : "woman",
      skin: s.skin ?? 1,
      hair: s.hair || "short",
      hairColor: s.hairColor || "kahve",
      gray,
      beard: s.beard && s.look === "man",
      thin: s.thinning && !s.transplanted,
      age: s.age,
      outfit: s.outfit || "gunluk",
      mood: s.mood >= 62 ? 1 : s.mood < 35 ? -1 : 0,
      glasses: s.age >= 58,
    };
  };
})(globalThis.HS || (globalThis.HS = {}));
