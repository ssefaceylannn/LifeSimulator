// Karakter motoru: animasyon filmi tarzında, yumuşak gölgeli SVG karakter.
// Büyük ve parlak gözler, yanak allığı, ışık alan saç tutamları, kumaş gölgeleri.
// Her şey parametrik: cinsiyet, ten, saç modeli ve rengi, yaş (yüz hatları, kırışıklık,
// beyazlama), kilo (yüz ve beden dolgunluğu), kas (omuz, kol), kıyafet, ruh hali, gözlük.
// HS.Art.person(p) → <g>. Kutu 120×220, ayaklar y≈214.
// p: { gender, skin, hair, hairColor, gray, beard, thin, age, outfit, mood(-1|0|1), glasses,
//      fat(0-1), mus(0-1), hs(boy ölçeği), eyeColor(0-3) }
(function (HS) {
  "use strict";
  const Art = (HS.Art = HS.Art || {});

  Art.SKINS = ["#fbd9bf", "#eebb94", "#cf9469", "#8f5b3c"];
  Art.SKIN_SHADE = ["#eab596", "#d99c74", "#b0744c", "#71452b"];
  Art.SKIN_DEEP = ["#d69273", "#bf7d58", "#935a37", "#58331e"];
  Art.LIPS = ["#e0837e", "#cf7068", "#ad5a4c", "#7f3c33"];
  Art.HAIR_COLORS = { siyah: "#2b2220", kahve: "#5e3a24", kumral: "#93613a", sari: "#e0b864", kizil: "#b14f2b" };
  Art.HAIR_NAMES = { siyah: "Siyah", kahve: "Kahverengi", kumral: "Kumral", sari: "Sarı", kizil: "Kızıl" };
  Art.EYES = ["#5a3520", "#3f78b5", "#4f7f3a", "#8a6230"];
  Art.HAIR_STYLES = { short: "Kısa", long: "Uzun", curly: "Kıvırcık", bun: "Topuz", braid: "Örgü", shaved: "Kazınmış" };

  // Kıyafetler. jobs: hangi işlerde "uygun kıyafet" sayılır. price: 2026 TL. hidden: gardıropta satılmaz.
  Art.OUTFITS = {
    gunluk: { name: "Tişört ve kot", type: "tee", top: "#5b95e0", acc: "#3f74c0", bottom: "#3a4f72", shoes: "#f4f5f8", price: 0 },
    ceket: { name: "Kanvas ceket", type: "jacket", top: "#f0a640", acc: "#9ec3d8", bottom: "#3a4f72", shoes: "#f4f5f8", price: 2600 },
    gomlek: { name: "Gömlek ve kumaş pantolon", type: "shirt", top: "#eef2f8", acc: "#c9d4e4", bottom: "#4b5363", shoes: "#6a4834", price: 1800, jobs: ["office", "teacher", "business", "memur"] },
    takim: { name: "Takım elbise", type: "suit", top: "#2e4266", acc: "#c43c35", bottom: "#2e4266", shoes: "#2a2320", price: 9500, jobs: ["office", "business", "memur"], formal: true },
    kafe: { name: "Kafe önlüğü", type: "apron", top: "#f6f2ea", acc: "#946140", bottom: "#2f3742", shoes: "#2a2320", price: 900, jobs: ["cafe"] },
    tulum: { name: "İş tulumu", type: "overall", top: "#3567b0", acc: "#f39c34", bottom: "#3567b0", shoes: "#4a3a2c", price: 1400, jobs: ["factory"] },
    sahne: { name: "Deri ceket", type: "leather", top: "#2a2a30", acc: "#d6453d", bottom: "#1f2633", shoes: "#2a2320", price: 4200, jobs: ["music"] },
    hirka: { name: "Hırka ve gömlek", type: "cardigan", top: "#a5825a", acc: "#eef2f7", bottom: "#4d5566", shoes: "#6a4834", price: 1600, jobs: ["teacher"] },
    forma: { name: "Sağlık forması", type: "scrubs", top: "#2fa79c", acc: "#d8e7e5", bottom: "#2fa79c", shoes: "#f4f5f8", price: 1200, jobs: ["nurse"] },
    yelek: { name: "Esnaf yeleği", type: "vest", top: "#6b4e32", acc: "#f1ece2", bottom: "#3e4552", shoes: "#6a4834", price: 1300, jobs: ["business"] },
    kapusonlu: { name: "Kapüşonlu", type: "hoodie", top: "#7d899c", acc: "#626e80", bottom: "#2c3340", shoes: "#f4f5f8", price: 1100, jobs: ["crime"] },
    elbise: { name: "Elbise", type: "dress", top: "#dc6684", acc: "#f6bfcd", bottom: "#dc6684", shoes: "#8a3e52", price: 2400 },
    esofman: { name: "Eşofman", type: "track", top: "#22915f", acc: "#f4f6f8", bottom: "#22915f", shoes: "#f4f6f8", price: 1500 },
    kaban: { name: "Kaban ve atkı", type: "coat", top: "#74503f", acc: "#c43c35", bottom: "#3b3f4a", shoes: "#2a2320", price: 5500 },
    uniforma: { name: "Asker üniforması", type: "military", top: "#5e6e3f", acc: "#3f4a29", bottom: "#5e6e3f", shoes: "#2a2320", price: 0, hidden: true },
    emekli: { name: "Örgü yelek", type: "cardigan", top: "#938e72", acc: "#e7e2d4", bottom: "#5b5f68", shoes: "#6a4834", price: 1000 },
  };

  const mix = (a, b, t) => {
    const h = (c) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
    const [x, y] = [h(a), h(b)];
    return "#" + x.map((v, i) => Math.round(v + (y[i] - v) * t).toString(16).padStart(2, "0")).join("");
  };
  Art.mix = mix;
  const n1 = (v) => Math.round(v * 10) / 10;
  const dark = (c, t = 0.18) => mix(c, "#000000", t);
  const light = (c, t = 0.18) => mix(c, "#ffffff", t);
  Art.dark = dark;
  Art.light = light;
  let N = 0;

  // ---------------- Ölçüler ----------------
  function dims(p) {
    const w = p.gender === "woman";
    const age = p.age ?? 25;
    const fat = Math.max(0, Math.min(1, p.fat ?? 0.3));
    const mus = Math.max(0, Math.min(1, p.mus ?? 0.25));
    const kid = age < 14;
    return {
      w,
      age,
      kid,
      fat,
      mus,
      cw: (kid ? 28.5 : 26.5) + fat * 5 + (w ? -0.5 : 0.5), // yanak yarı genişliği
      jw: (kid ? 20 : w ? 19 : 21.5) + fat * 7 + (age > 60 ? 1.5 : 0), // çene hattı
      chin: (kid ? 70 : 72.5) + fat * 2 + (age > 55 ? 1 : 0),
      sh: (w ? 21 : 24) + mus * (w ? 4 : 8) + fat * 6, // omuz
      ww: (w ? 15 : 17.5) + fat * 15 - mus * 1.5, // bel
      hw: (w ? 20.5 : 18.5) + fat * 10, // kalça
      arm: 9 + fat * 5 + mus * (w ? 2 : 4.5),
      fore: 8 + fat * 3 + mus * (w ? 1 : 2.5),
      nw: (w ? 12 : 14) + fat * 6 + mus * 3,
    };
  }

  // ---------------- Gradyanlar ----------------
  function defs(id, c) {
    const st = (stops) => stops.map(([o, col, op = 1]) => `<stop offset="${o}" stop-color="${col}" stop-opacity="${op}"/>`).join("");
    const lin = (k, a, b, stops) => `<linearGradient id="${id}${k}" x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}">${st(stops)}</linearGradient>`;
    const rad = (k, cx, cy, r, stops) => `<radialGradient id="${id}${k}" cx="${cx}" cy="${cy}" r="${r}">${st(stops)}</radialGradient>`;
    return (
      "<defs>" +
      rad("s", 0.4, 0.36, 0.72, [[0, light(c.skin, 0.16)], [0.55, c.skin], [1, c.shade]]) +
      rad("k", 0.38, 0.3, 0.9, [[0, light(c.skin, 0.1)], [0.7, c.skin], [1, c.shade]]) +
      lin("v", [0, 0], [1, 0], [[0, "#fff", 0.24], [0.35, "#fff", 0], [0.65, "#000", 0], [1, "#000", 0.22]]) +
      lin("d", [0, 0], [0, 1], [[0, "#000", 0], [1, "#000", 0.16]]) +
      lin("h", [0.1, 0], [0.7, 1], [[0, light(c.hair, 0.28)], [0.45, c.hair], [1, dark(c.hair, 0.32)]]) +
      rad("i", 0.5, 0.62, 0.62, [[0, light(c.eye, 0.45)], [0.55, c.eye], [1, dark(c.eye, 0.55)]]) +
      rad("b", 0.5, 0.5, 0.5, [[0, "#ff7f7f", 0.5], [1, "#ff7f7f", 0]]) +
      lin("t", [0, 0], [0, 1], [[0, light(c.top, 0.12)], [0.5, c.top], [1, dark(c.top, 0.14)]]) +
      lin("a", [0, 0], [0, 1], [[0, light(c.acc, 0.12)], [1, dark(c.acc, 0.12)]]) +
      lin("p", [0, 0], [0, 1], [[0, light(c.bottom, 0.06)], [1, dark(c.bottom, 0.2)]]) +
      lin("o", [0, 0], [0, 1], [[0, light(c.shoes, 0.2)], [1, dark(c.shoes, 0.2)]]) +
      "</defs>"
    );
  }

  // ---------------- Kafa ----------------
  function headPath(d) {
    const L = 60 - d.cw,
      R = 60 + d.cw,
      T = 10;
    return `M60 ${T}C${n1(60 + d.cw * 0.78)} ${T} ${n1(R)} ${T + 15} ${n1(R)} 43C${n1(R)} ${n1(55 + d.fat * 3)} ${n1(60 + d.jw)} ${n1(d.chin - 8)} ${n1(60 + d.jw * 0.45)} ${n1(d.chin - 1.5)}Q60 ${n1(d.chin + 1.5)} ${n1(60 - d.jw * 0.45)} ${n1(d.chin - 1.5)}C${n1(60 - d.jw)} ${n1(d.chin - 8)} ${n1(L)} ${n1(55 + d.fat * 3)} ${n1(L)} 43C${n1(L)} ${T + 15} ${n1(60 - d.cw * 0.78)} ${T} 60 ${T}Z`;
  }
  function head(p, d, id, c) {
    let o = "";
    for (const s of [-1, 1]) {
      const x = 60 + s * (d.cw - 0.5);
      o += `<ellipse cx="${n1(x + s * 1.5)}" cy="47" rx="5.2" ry="7.6" fill="${c.shade}"/><ellipse cx="${n1(x + s * 1.6)}" cy="47" rx="3" ry="5" fill="${c.deep}" opacity=".45"/>`;
    }
    o += `<path d="${headPath(d)}" fill="url(#${id}s)"/><ellipse cx="54" cy="27" rx="11" ry="6" fill="#fff" opacity=".16"/>`;
    o += `<path d="M${n1(60 - d.jw * 0.8)} ${n1(d.chin - 6)}Q60 ${n1(d.chin + 2)} ${n1(60 + d.jw * 0.8)} ${n1(d.chin - 6)}Q60 ${n1(d.chin - 1)} ${n1(60 - d.jw * 0.8)} ${n1(d.chin - 6)}z" fill="${c.shade}" opacity=".5"/>`;
    if (d.fat > 0.55) o += `<path d="M${n1(60 - d.jw * 0.55)} ${n1(d.chin + 0.5)}Q60 ${n1(d.chin + 6 + (d.fat - 0.55) * 8)} ${n1(60 + d.jw * 0.55)} ${n1(d.chin + 0.5)}" stroke="${c.shade}" stroke-width="2.4" fill="none" opacity=".8"/>`;
    if (d.age >= 62) o += `<path d="M${n1(60 - d.cw + 4)} 58q2 8 7 11M${n1(60 + d.cw - 4)} 58q-2 8 -7 11" stroke="${c.deep}" stroke-width="1" fill="none" opacity=".35"/>`;
    return o;
  }

  function eyes(p, d, id, c) {
    const rx = (d.kid ? 8.4 : 7.4) - (d.age > 50 ? 0.7 : 0) - d.fat * 0.6;
    const ry = rx * (p.mood === -1 ? 0.95 : 1.08);
    const ey = 46;
    let o = "";
    for (const s of [-1, 1]) {
      const ex = 60 + s * 11;
      const cid = `${id}e${s > 0 ? "r" : "l"}`;
      const ir = rx * 0.74;
      const flip = s < 0 ? ` transform="matrix(-1 0 0 1 ${n1(ex * 2)} 0)"` : "";
      o += `<clipPath id="${cid}"><ellipse cx="${n1(ex)}" cy="${ey}" rx="${n1(rx)}" ry="${n1(ry)}"/></clipPath>`;
      o += `<ellipse cx="${n1(ex)}" cy="${ey}" rx="${n1(rx)}" ry="${n1(ry)}" fill="#fff"/>`;
      o += `<g clip-path="url(#${cid})">`;
      o += `<circle cx="${n1(ex + s * 0.3)}" cy="${n1(ey + 0.9)}" r="${n1(ir)}" fill="url(#${id}i)"/>`;
      o += `<circle cx="${n1(ex + s * 0.3)}" cy="${n1(ey + 0.9)}" r="${n1(ir * 0.46)}" fill="#160f0c"/>`;
      o += `<ellipse cx="${n1(ex)}" cy="${n1(ey - ry + 1.6)}" rx="${n1(rx)}" ry="3" fill="#000" opacity=".12"/>`;
      o += `</g>`;
      o += `<circle cx="${n1(ex - ir * 0.32)}" cy="${n1(ey - ir * 0.28)}" r="${n1(ir * 0.32)}" fill="#fff"/>`;
      o += `<circle cx="${n1(ex + ir * 0.36)}" cy="${n1(ey + ir * 0.42)}" r="${n1(ir * 0.14)}" fill="#fff" opacity=".9"/>`;
      o += `<path d="M${n1(ex - rx - 0.4)} ${n1(ey + 0.5)}Q${n1(ex - rx * 0.6)} ${n1(ey - ry - 0.8)} ${n1(ex)} ${n1(ey - ry - 0.3)}Q${n1(ex + rx * 0.7)} ${n1(ey - ry - 0.2)} ${n1(ex + rx + 0.4)} ${n1(ey - 0.5)}" stroke="#2a1a14" stroke-width="${d.w ? 2.6 : 2}" fill="none" stroke-linecap="round"${flip}/>`;
      if (d.w) {
        const ox = ex + s * (rx + 0.2);
        o += `<path d="M${n1(ox - s * 0.6)} ${n1(ey - 1.2)}q${s * 2} -1 ${s * 3.2} -3.4" stroke="#2a1a14" stroke-width="1.3" stroke-linecap="round" fill="none"/>`;
      }
      if (d.age >= 50) o += `<path d="M${n1(ex - rx * 0.7)} ${n1(ey + ry + 1.4)}q${n1(rx * 0.7)} 2.6 ${n1(rx * 1.4)} 0" stroke="${c.deep}" stroke-width="1" fill="none" opacity="${n1(Math.min(0.55, (d.age - 45) / 40))}"/>`;
      if (d.age >= 48) o += `<path d="M${n1(ex + s * (rx + 2))} ${n1(ey - 1)}l${s * 3} -1.4M${n1(ex + s * (rx + 2))} ${n1(ey + 1.5)}l${s * 3} 0.8" stroke="${c.deep}" stroke-width=".9" opacity="${n1(Math.min(0.6, (d.age - 44) / 40))}"/>`;
    }
    return `<g class="hs-eyes">${o}</g>`;
  }

  function brows(p, d, c) {
    const col = mix(c.hair, "#3a2a22", 0.25);
    const y = 33.5;
    let o = "";
    for (const s of [-1, 1]) {
      const iy = y + (p.mood === -1 ? -2.4 : p.mood === 1 ? 0.4 : 0.6);
      const oy = y + (p.mood === -1 ? 2 : p.mood === 1 ? 0 : 0.8);
      o += `<path d="M${n1(60 + s * 4.5)} ${n1(iy)}Q${n1(60 + s * 11)} ${n1(y - 3.4)} ${n1(60 + s * 17.5)} ${n1(oy)}" stroke="${col}" stroke-width="${d.w ? 2.4 : 3.2}" stroke-linecap="round" fill="none"/>`;
    }
    return o;
  }

  function mouth(p, d, c) {
    const y = 63.5 + d.fat * 1.5;
    const lip = c.lips;
    if (p.mood === 1)
      return (
        `<path d="M52.5 ${n1(y - 1)}Q60 ${n1(y + 7.5)} 67.5 ${n1(y - 1)}Q60 ${n1(y + 1.2)} 52.5 ${n1(y - 1)}z" fill="#7a2f2f"/>` +
        `<path d="M54.5 ${n1(y - 0.2)}Q60 ${n1(y + 1.6)} 65.5 ${n1(y - 0.2)}l-.6 1.6q-4.9 1.3-9.8 0z" fill="#fff"/>` +
        `<path d="M56 ${n1(y + 4)}q4 1.8 8 0q-4 -1.6 -8 0z" fill="#e0716f"/>` +
        `<path d="M52 ${n1(y - 1.4)}Q60 ${n1(y + 8)} 68 ${n1(y - 1.4)}" stroke="${dark(lip, 0.2)}" stroke-width="1.2" fill="none" stroke-linecap="round"/>`
      );
    if (p.mood === -1) return `<path d="M54 ${n1(y + 2.4)}Q60 ${n1(y - 1.6)} 66 ${n1(y + 2.4)}" stroke="${dark(lip, 0.25)}" stroke-width="2" fill="none" stroke-linecap="round"/>`;
    return `<path d="M54 ${n1(y)}Q60 ${n1(y + 4)} 66 ${n1(y)}" stroke="${dark(lip, 0.22)}" stroke-width="2" fill="none" stroke-linecap="round"/>` + (d.w ? `<path d="M56 ${n1(y + 1.9)}q4 1.6 8 0" stroke="${lip}" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".7"/>` : "");
  }

  function face(p, d, id, c) {
    let o = eyes(p, d, id, c) + brows(p, d, c);
    o += `<ellipse cx="60" cy="${n1(55.5 + d.fat)}" rx="${n1(3.6 + d.fat)}" ry="2.8" fill="${c.shade}" opacity=".85"/><path d="M57.2 ${n1(56.6 + d.fat)}q2.8 1.6 5.6 0" stroke="${c.deep}" stroke-width="1" fill="none" opacity=".55"/><circle cx="61" cy="${n1(54.4 + d.fat)}" r="1.2" fill="#fff" opacity=".55"/>`;
    o += `<ellipse cx="${n1(60 - d.cw * 0.62)}" cy="${n1(57 + d.fat)}" rx="7" ry="4.4" fill="url(#${id}b)"/><ellipse cx="${n1(60 + d.cw * 0.62)}" cy="${n1(57 + d.fat)}" rx="7" ry="4.4" fill="url(#${id}b)"/>`;
    if (d.age >= 40) o += `<path d="M50 23q10 -2.4 20 0M52 27q8 -1.8 16 0" stroke="${c.deep}" stroke-width=".9" fill="none" opacity="${n1(Math.min(0.5, (d.age - 38) / 50))}"/>`;
    if (d.age >= 44) o += `<path d="M54.5 58q-3 3 -2.6 7.6M65.5 58q3 3 2.6 7.6" stroke="${c.deep}" stroke-width="1" fill="none" opacity="${n1(Math.min(0.55, (d.age - 40) / 45))}"/>`;
    if (d.age >= 68) o += `<g fill="${c.deep}" opacity=".3"><circle cx="${n1(60 - d.cw * 0.7)}" cy="38" r="1.2"/><circle cx="${n1(60 + d.cw * 0.6)}" cy="62" r="1"/><circle cx="${n1(60 + d.cw * 0.75)}" cy="34" r=".9"/></g>`;
    if (p.beard) o += beard(p, d, c);
    return o + mouth(p, d, c);
  }
  function beard(p, d, c) {
    const L = 60 - d.cw + 2.5,
      R = 60 + d.cw - 2.5;
    const col = c.hair;
    return (
      `<path d="M${n1(L)} 46C${n1(L)} 60 ${n1(60 - d.jw)} ${n1(d.chin - 5)} 60 ${n1(d.chin + 3)}C${n1(60 + d.jw)} ${n1(d.chin - 5)} ${n1(R)} 60 ${n1(R)} 46L${n1(R - 3)} 48C${n1(R - 4)} 60 69 59 60 59.5C51 59 ${n1(L + 4)} 60 ${n1(L + 3)} 48z" fill="${col}" opacity=".93"/>` +
      `<path d="M52.5 61.6q7.5 -4.4 15 0q-7.5 2 -15 0z" fill="${col}"/>` +
      `<path d="M54 ${n1(d.chin - 2)}q6 3 12 0" stroke="${light(col, 0.3)}" stroke-width="1" fill="none" opacity=".5"/>`
    );
  }

  // ---------------- Saç ----------------
  function hair(p, d, id, c) {
    const L = 60 - d.cw,
      R = 60 + d.cw,
      T = 10;
    const H = `url(#${id}h)`;
    const shine = (x1, y1, x2, y2, qx, qy) => `<path d="M${n1(x1)} ${n1(y1)}Q${n1(qx)} ${n1(qy)} ${n1(x2)} ${n1(y2)}" stroke="#fff" stroke-opacity=".2" stroke-width="2" stroke-linecap="round" fill="none"/>`;
    const cap = `M${n1(L - 3.5)} 50C${n1(L - 6)} 22 ${n1(L + 8)} ${T - 5} 60 ${T - 5.5}C${n1(R - 8)} ${T - 5} ${n1(R + 6)} 22 ${n1(R + 3.5)} 50`;
    let back = "",
      front = "";
    const style = p.thin ? "thin" : p.hair || "short";
    if (style === "thin") {
      front =
        `<path d="M${n1(L - 3)} 50C${n1(L - 4)} 36 ${n1(L + 1)} 27 ${n1(L + 8)} 24L${n1(L + 6)} 33Q${n1(L + 2)} 40 ${n1(L + 1.5)} 50z" fill="${H}"/>` +
        `<path d="M${n1(R + 3)} 50C${n1(R + 4)} 36 ${n1(R - 1)} 27 ${n1(R - 8)} 24L${n1(R - 6)} 33Q${n1(R - 2)} 40 ${n1(R - 1.5)} 50z" fill="${H}"/>` +
        `<ellipse cx="54" cy="16" rx="7" ry="3" fill="#fff" opacity=".28"/>`;
    } else if (style === "short") {
      front =
        `<path d="${cap}L${n1(R - 1.5)} 50C${n1(R - 2)} 36 ${n1(R - 5)} 28 ${n1(R - 11)} 25.5C${n1(R - 17)} 30 63 25 57 27.5C50 30.5 ${n1(L + 11)} 24 ${n1(L + 5)} 30C${n1(L + 1.8)} 36 ${n1(L + 1.5)} 43 ${n1(L + 1.5)} 50z" fill="${H}"/>` +
        `<path d="M${n1(L + 12)} ${T - 3}q8 -6 16 -3q8 -4 14 0q6 1 8 4z" fill="${H}"/>` +
        shine(L + 9, T + 6, R - 12, T + 3, 60, T - 3);
    } else if (style === "shaved") {
      front = `<path d="${cap}L${n1(R - 1)} 50C${n1(R - 2)} 34 ${n1(R - 7)} 25 60 24C${n1(L + 7)} 25 ${n1(L + 2)} 34 ${n1(L + 1)} 50z" fill="${H}" opacity=".62"/>`;
    } else if (style === "long") {
      back = `<path d="M60 ${T - 6}C${n1(R + 13)} ${T - 5} ${n1(R + 12)} 40 ${n1(R + 10)} 70C${n1(R + 9)} 94 ${n1(R + 13)} 106 ${n1(R + 4)} 118Q60 123 ${n1(L - 4)} 118C${n1(L - 13)} 106 ${n1(L - 9)} 94 ${n1(L - 10)} 70C${n1(L - 12)} 40 ${n1(L - 13)} ${T - 5} 60 ${T - 6}Z" fill="${H}"/><path d="M${n1(L - 6)} 80q4 20 2 34M${n1(R + 6)} 80q-4 20 -2 34" stroke="${dark(c.hair, 0.3)}" stroke-width="1.4" fill="none" opacity=".5"/>`;
      front =
        `<path d="${cap}L${n1(R + 1)} 66C${n1(R - 1)} 46 ${n1(R - 6)} 30 65 23.5C56 31 ${n1(L + 12)} 33 ${n1(L + 2)} 45L${n1(L)} 66C${n1(L - 3)} 60 ${n1(L - 3)} 54 ${n1(L - 3.5)} 50z" fill="${H}"/>` +
        shine(L + 4, 30, 62, T - 1, L + 10, T + 2) +
        shine(R - 6, T + 6, R + 1, 40, R + 2, T + 14);
    } else if (style === "bun") {
      back = `<circle cx="60" cy="${T - 4}" r="12.5" fill="${H}"/><path d="M50 ${T - 6}q10 -9 20 0" stroke="#fff" stroke-opacity=".3" stroke-width="2.2" fill="none"/>`;
      front =
        `<path d="${cap}L${n1(R - 1)} 50C${n1(R - 2)} 34 ${n1(R - 9)} 25 60 23C${n1(L + 9)} 25 ${n1(L + 2)} 34 ${n1(L + 1)} 50z" fill="${H}"/>` +
        `<path d="M${n1(R - 2)} 40q2 10 0 18" stroke="${c.hair}" stroke-width="2" fill="none"/>` +
        shine(L + 8, T + 8, 58, T - 2, L + 14, T - 1);
    } else if (style === "braid") {
      back = `<path d="M60 ${T - 6}C${n1(R + 10)} ${T - 5} ${n1(R + 9)} 40 ${n1(R + 6)} 66L${n1(L - 6)} 66C${n1(L - 9)} 40 ${n1(L - 10)} ${T - 5} 60 ${T - 6}Z" fill="${H}"/>`;
      front =
        `<path d="${cap}L${n1(R + 1)} 58C${n1(R - 1)} 38 ${n1(R - 9)} 26 60 22.5C${n1(L + 9)} 26 ${n1(L + 1)} 38 ${n1(L - 1)} 58z" fill="${H}"/>` +
        `<path d="M60 ${T - 4}V22" stroke="${dark(c.hair, 0.35)}" stroke-width="1.2" opacity=".6"/>` +
        shine(L + 6, 30, 56, T, L + 8, T + 6) +
        shine(64, T, R - 5, 30, R - 7, T + 6);
      for (const s of [-1, 1]) {
        const x = 60 + s * (d.cw + 1.5);
        let b = "";
        for (let i = 0; i < 6; i++) {
          const y = 62 + i * 8.6;
          const xx = x + s * Math.min(i, 3) * 0.6;
          b += `<ellipse cx="${n1(xx - s * 1.6)}" cy="${n1(y)}" rx="${n1(5.4 - i * 0.35)}" ry="5" fill="${H}" transform="rotate(${s * 24} ${n1(xx)} ${n1(y)})"/><ellipse cx="${n1(xx + s * 1.6)}" cy="${n1(y + 4.3)}" rx="${n1(5.2 - i * 0.35)}" ry="4.8" fill="${H}" transform="rotate(${-s * 24} ${n1(xx)} ${n1(y + 4)})"/>`;
        }
        b += `<rect x="${n1(x + s * 2.4 - 3)}" y="113" width="6" height="3.6" rx="1.6" fill="${c.acc}"/><path d="M${n1(x + s * 2.4)} 116.5l-2.6 7h5.2z" fill="${H}"/>`;
        front += b;
      }
    } else if (style === "curly") {
      const pts = [];
      for (let i = 0; i <= 12; i++) {
        const a = Math.PI * (1.02 + (i / 12) * 0.96);
        pts.push([60 + Math.cos(a) * (d.cw + 3), 41 + Math.sin(a) * 35]);
      }
      back = `<g fill="${H}">${pts.map(([x, y], i) => `<circle cx="${n1(x)}" cy="${n1(y + 10)}" r="${7 + (i % 3)}"/>`).join("")}<circle cx="${n1(L - 2)}" cy="62" r="8"/><circle cx="${n1(R + 2)}" cy="62" r="8"/></g>`;
      front =
        `<path d="${cap}L${n1(R - 1)} 46C${n1(R - 3)} 30 ${n1(R - 10)} 26 60 26C${n1(L + 10)} 26 ${n1(L + 3)} 30 ${n1(L + 1)} 46z" fill="${H}"/>` +
        `<g fill="${H}">${[[-15, 25], [-6, 22], [4, 22.5], [13, 25], [-21, 31], [20, 31]].map(([x, y], i) => `<circle cx="${60 + x}" cy="${y}" r="${5.2 + (i % 2)}"/>`).join("")}</g>` +
        `<g fill="none" stroke="#fff" stroke-opacity=".28" stroke-width="1.6">${[[-14, 22], [3, 19], [12, 23]].map(([x, y]) => `<path d="M${60 + x - 3} ${y}q3 -3 6 0"/>`).join("")}</g>`;
    }
    return { back, front };
  }

  // ---------------- Beden ve kıyafet ----------------
  function torsoPath(d, hy) {
    return `M${n1(60 - d.nw / 2 - 2)} 82Q${n1(60 - d.sh + 4)} 82.5 ${n1(60 - d.sh)} 90C${n1(60 - d.sh - 1)} 104 ${n1(60 - d.ww - 1)} 114 ${n1(60 - d.ww)} 124C${n1(60 - d.ww)} 132 ${n1(60 - d.hw)} ${hy - 6} ${n1(60 - d.hw)} ${hy}L${n1(60 + d.hw)} ${hy}C${n1(60 + d.hw)} ${hy - 6} ${n1(60 + d.ww)} 132 ${n1(60 + d.ww)} 124C${n1(60 + d.ww + 1)} 114 ${n1(60 + d.sh + 1)} 104 ${n1(60 + d.sh)} 90Q${n1(60 + d.sh - 4)} 82.5 ${n1(60 + d.nw / 2 + 2)} 82Z`;
  }
  function legs(p, d, id, o, c) {
    const lw = 9.5 + d.fat * 4 + d.mus;
    let out = "";
    if (o.type === "dress") {
      for (const s of [-1, 1]) out += `<path d="M${n1(60 + s * 3)} 150L${n1(60 + s * 4)} 207h${n1(s * (lw - 1))}L${n1(60 + s * (d.hw - 6))} 150z" fill="url(#${id}k)"/>`;
    } else {
      for (const s of [-1, 1]) {
        const path = `M${n1(60 + s * d.hw)} 138C${n1(60 + s * d.hw)} 160 ${n1(60 + s * (lw + 4))} 184 ${n1(60 + s * (lw + 3))} 207L${n1(60 + s * 1.2)} 207L${n1(60 + s * 0.8)} 150L60 140z`;
        out += `<path d="${path}" fill="url(#${id}p)"/><path d="${path}" fill="url(#${id}v)" opacity=".8"/>`;
      }
      out += `<path d="M60 142V206" stroke="#000" stroke-opacity=".18" stroke-width="1.2"/>`;
      if (o.type === "track") out += `<path d="M${n1(60 - d.hw + 2)} 142L${n1(60 - lw - 1)} 205M${n1(60 + d.hw - 2)} 142L${n1(60 + lw + 1)} 205" stroke="${o.acc}" stroke-width="2.2"/>`;
      if (o.bottom === "#3a4f72") out += `<path d="M${n1(60 - d.hw + 4)} 146q4 2 8 0M${n1(60 + d.hw - 12)} 146q4 2 8 0" stroke="#d9a441" stroke-width=".8" fill="none" opacity=".7"/>`;
    }
    for (const s of [-1, 1]) {
      const x = 60 + s * (lw / 2 + 2.5);
      const flip = s < 0 ? ` transform="matrix(-1 0 0 1 ${n1(x * 2)} 0)"` : "";
      out += `<path d="M${n1(x - 7.5)} 214q-1.5 -8 3.5 -9.5h8q7 1 8 8v1.5z" fill="url(#${id}o)"${flip}/><path d="M${n1(x - 7.6)} 213.2h17" stroke="${dark(o.shoes, 0.3)}" stroke-width="1.4"${flip}/><ellipse cx="${n1(x - s)}" cy="207.6" rx="3" ry="1.2" fill="#fff" opacity=".45"/>`;
    }
    return out;
  }
  function arms(p, d, id, o, c) {
    const short = ["tee", "scrubs", "dress", "apron"].includes(o.type);
    let out = "";
    for (const s of [-1, 1]) {
      const sx = 60 + s * (d.sh - 4.5),
        sy = 92;
      const ex = 60 + s * (d.sh + 1.5 + d.fat * 2),
        ey = 119;
      const wx = 60 + s * (d.sh + 0.5 + d.fat * 2.5),
        wy = 145;
      const sleeve = o.type === "vest" ? o.acc : o.type === "overall" ? "#e6e9ee" : o.top;
      const upper = `M${n1(sx)} ${sy}Q${n1(ex + s * 1.5)} ${n1((sy + ey) / 2)} ${n1(ex)} ${ey}`;
      const lower = `M${n1(ex)} ${ey}L${n1(wx)} ${wy}`;
      const dk = dark(sleeve, 0.22);
      out += `<path d="${upper}" stroke="${dk}" stroke-width="${n1(d.arm + 1.6)}" stroke-linecap="round" fill="none"/>`;
      out += `<path d="${lower}" stroke="${short ? c.shade : dk}" stroke-width="${n1(d.fore + 1.4)}" stroke-linecap="round" fill="none"/>`;
      out += `<path d="${lower}" stroke="${short ? c.skin : sleeve}" stroke-width="${n1(d.fore)}" stroke-linecap="round" fill="none"/>`;
      out += `<path d="${upper}" stroke="${sleeve}" stroke-width="${n1(d.arm)}" stroke-linecap="round" fill="none"/>`;
      out += `<path d="M${n1(sx - s * d.arm * 0.25)} ${sy + 3}Q${n1(ex - s * d.arm * 0.1)} ${n1((sy + ey) / 2)} ${n1(ex - s * d.arm * 0.25)} ${ey - 2}" stroke="#fff" stroke-opacity=".18" stroke-width="2" stroke-linecap="round" fill="none"/>`;
      if (!short) out += `<path d="M${n1(wx - s * 0.2)} ${wy - 3.5}L${n1(wx)} ${wy - 1}" stroke="${o.type === "suit" ? "#f2f4f8" : dk}" stroke-width="${n1(d.fore + 0.6)}" stroke-linecap="round"/>`;
      out += `<ellipse cx="${n1(wx + s * 0.4)}" cy="${wy + 4.5}" rx="${n1(4.8 + d.fat)}" ry="${n1(5.6 + d.fat)}" fill="url(#${id}k)"/><path d="M${n1(wx - s * 3)} ${wy + 2.5}q${-s * 2} 3 ${-s * 0.4} 5" stroke="${c.shade}" stroke-width="2.2" stroke-linecap="round" fill="none"/>`;
    }
    return out;
  }
  function clothes(p, d, id, o, c) {
    const t = o.type;
    const long = t === "coat" ? 176 : t === "dress" ? 140 : 144;
    let out = "";
    const fillT = `url(#${id}t)`;
    const vol = (path) => `<path d="${path}" fill="url(#${id}v)"/><path d="${path}" fill="url(#${id}d)"/>`;
    const nx = d.nw / 2;
    if (t === "dress") {
      const sk = `M${n1(60 - d.ww - 1)} 122C${n1(60 - d.hw - 6)} 140 ${n1(60 - d.hw - 12)} 160 ${n1(60 - d.hw - 12)} 176Q60 184 ${n1(60 + d.hw + 12)} 176C${n1(60 + d.hw + 12)} 160 ${n1(60 + d.hw + 6)} 140 ${n1(60 + d.ww + 1)} 122z`;
      out += `<path d="${sk}" fill="${fillT}"/>${vol(sk)}<path d="M${n1(60 - d.hw - 6)} 160q8 6 6 16M60 150v30M${n1(60 + d.hw + 6)} 160q-8 6 -6 16" stroke="#000" stroke-opacity=".1" stroke-width="1.6" fill="none"/>`;
    }
    if (t === "coat") {
      const cp = `M${n1(60 - d.ww - 2)} 124L${n1(60 - d.hw - 6)} 176H${n1(60 + d.hw + 6)}L${n1(60 + d.ww + 2)} 124z`;
      out += `<path d="${cp}" fill="${fillT}"/>${vol(cp)}`;
    }
    const tp = torsoPath(d, long);
    out += `<path d="${tp}" fill="${fillT}"/>`;
    const neckline = (col = dark(o.top, 0.18)) => `<path d="M${n1(60 - nx - 1)} 82.5Q60 89 ${n1(60 + nx + 1)} 82.5" stroke="${col}" stroke-width="2.6" fill="none"/>`;
    const vneck = (col, depth) => `<path d="M${n1(60 - nx)} 82L60 ${depth}L${n1(60 + nx)} 82z" fill="${col}"/>`;
    const openFront = (inner, depth, lapel) => {
      let s = `<path d="M${n1(60 - nx - 1)} 82L56 ${depth}H64L${n1(60 + nx + 1)} 82z" fill="${inner}"/>`;
      s += `<path d="M${n1(60 - nx - 1)} 82L56 ${depth}M${n1(60 + nx + 1)} 82L64 ${depth}" stroke="${dark(o.top, 0.25)}" stroke-width="1.4"/>`;
      if (lapel) s += `<path d="M${n1(60 - nx - 1)} 82L${n1(60 - nx - 6)} 96L56 108zM${n1(60 + nx + 1)} 82L${n1(60 + nx + 6)} 96L64 108z" fill="${lapel}"/>`;
      return s;
    };
    const buttons = (x, y0, n, col) => Array.from({ length: n }, (_, i) => `<circle cx="${n1(x)}" cy="${y0 + i * 11}" r="1.5" fill="${col}"/>`).join("");
    const pocket = (x, y, w, h) => `<path d="M${n1(x)} ${y}h${w}v${h - 3}q0 3 -3 3h${-(w - 6)}q-3 0 -3 -3z" fill="none" stroke="${dark(o.top, 0.2)}" stroke-width="1.2"/>`;
    const collar = (col, stroke) => `<path d="M${n1(60 - nx - 1)} 81l${n1(nx + 1)} 8l-5 5zM${n1(60 + nx + 1)} 81l${n1(-nx - 1)} 8l5 5z" fill="${col}"${stroke ? ` stroke="${stroke}" stroke-width=".8"` : ""}/>`;
    if (t === "tee") out += neckline() + `<path d="M${n1(60 - d.ww + 3)} 134q${n1(d.ww - 3)} 4 ${n1(2 * d.ww - 6)} 0" stroke="#000" stroke-opacity=".08" stroke-width="1.4" fill="none"/>`;
    else if (t === "jacket") out += openFront(o.acc, 144) + neckline(dark(o.acc, 0.2)) + `<path d="M${n1(60 - nx - 2)} 81q-6 4 -8 10l6 -1zM${n1(60 + nx + 2)} 81q6 4 8 10l-6 -1z" fill="${dark(o.top, 0.08)}"/>` + buttons(53, 100, 4, dark(o.top, 0.3)) + pocket(60 - d.ww + 2, 118, 10, 11) + pocket(60 + d.ww - 12, 118, 10, 11);
    else if (t === "shirt") out += collar(dark(o.top, 0.06), dark(o.top, 0.15)) + `<path d="M60 89V143" stroke="${dark(o.top, 0.15)}" stroke-width="1"/>` + buttons(61.8, 96, 5, dark(o.top, 0.3)) + `<rect x="${n1(60 - d.hw + 1)}" y="139" width="${n1(2 * d.hw - 2)}" height="4" fill="#4a3628"/><rect x="57" y="138.5" width="6" height="5" rx="1" fill="none" stroke="#c9a54a" stroke-width="1.2"/>`;
    else if (t === "suit") out += openFront("#f2f4f8", 132, dark(o.top, 0.12)) + `<path d="M58 84h4l1.4 4l-1.6 26l-1.8 3l-1.8 -3l-1.6 -26z" fill="${o.acc}"/>` + buttons(64.5, 124, 2, "#1b2232") + `<path d="M${n1(60 + d.sh - 14)} 97h7" stroke="#fff" stroke-width="1.6"/>`;
    else if (t === "apron") out += neckline() + `<path d="M${n1(60 - d.ww + 4)} 100h${n1(2 * d.ww - 8)}l3 46h${n1(-(2 * d.ww - 2))}z" fill="url(#${id}a)"/><path d="M${n1(60 - d.ww + 5)} 100L${n1(60 - nx)} 84M${n1(60 + d.ww - 5)} 100L${n1(60 + nx)} 84" stroke="${o.acc}" stroke-width="2"/><rect x="54" y="116" width="12" height="9" rx="2" fill="${dark(o.acc, 0.15)}"/>`;
    else if (t === "overall") out += `<path d="${tp}" fill="#e6e9ee"/><path d="M${n1(60 - d.ww + 3)} 104h${n1(2 * d.ww - 6)}V146H${n1(60 - d.ww + 3)}z" fill="${fillT}"/><path d="M${n1(60 - d.ww + 5)} 104L${n1(60 - d.sh + 6)} 86M${n1(60 + d.ww - 5)} 104L${n1(60 + d.sh - 6)} 86" stroke="${o.top}" stroke-width="4.4"/><circle cx="${n1(60 - d.ww + 6)}" cy="106" r="1.8" fill="${o.acc}"/><circle cx="${n1(60 + d.ww - 6)}" cy="106" r="1.8" fill="${o.acc}"/><rect x="54" y="112" width="12" height="9" rx="1.5" fill="none" stroke="${dark(o.top, 0.25)}" stroke-width="1.2"/><path d="M${n1(60 - d.ww + 3)} 128h${n1(2 * d.ww - 6)}" stroke="${o.acc}" stroke-width="2.4" opacity=".8"/>`;
    else if (t === "leather") out += openFront(o.acc, 144) + `<path d="M${n1(60 - nx - 2)} 81l-9 9l7 4l6 -9zM${n1(60 + nx + 2)} 81l9 9l-7 4l-6 -9z" fill="${light(o.top, 0.1)}"/><path d="M66 96l4 46" stroke="#b9bcc4" stroke-width="1.2"/><path d="M${n1(60 - d.sh + 6)} 98q4 -3 8 0" stroke="#fff" stroke-opacity=".25" stroke-width="2" fill="none"/>`;
    else if (t === "cardigan") out += openFront(o.acc, 144) + collar(o.acc, dark(o.acc, 0.2)) + buttons(53.5, 104, 4, light(o.top, 0.35)) + `<path d="M${n1(60 - d.hw + 2)} 140h${n1(2 * d.hw - 4)}" stroke="${dark(o.top, 0.2)}" stroke-width="3" stroke-dasharray="1.6 1.6"/>`;
    else if (t === "scrubs") out += vneck(c.skin, 97) + `<path d="M${n1(60 - nx)} 82L60 97L${n1(60 + nx)} 82" stroke="${dark(o.top, 0.25)}" stroke-width="1.6" fill="none"/>` + pocket(60 - d.ww + 3, 104, 10, 10) + `<path d="M${n1(60 - d.ww + 6)} 103v-5" stroke="#e9eef4" stroke-width="1.6"/>`;
    else if (t === "vest") out += `<path d="${tp}" fill="${o.acc}"/>` + collar(o.acc, dark(o.acc, 0.15)) + `<path d="M${n1(60 - d.sh + 5)} 88L58 104V144H${n1(60 - d.hw)}C${n1(60 - d.hw)} 134 ${n1(60 - d.ww)} 130 ${n1(60 - d.ww)} 124C${n1(60 - d.ww)} 110 ${n1(60 - d.sh + 3)} 100 ${n1(60 - d.sh + 5)} 88zM${n1(60 + d.sh - 5)} 88L62 104V144H${n1(60 + d.hw)}C${n1(60 + d.hw)} 134 ${n1(60 + d.ww)} 130 ${n1(60 + d.ww)} 124C${n1(60 + d.ww)} 110 ${n1(60 + d.sh - 3)} 100 ${n1(60 + d.sh - 5)} 88z" fill="${fillT}"/>` + buttons(56, 110, 3, "#d2b37a");
    else if (t === "hoodie") out += `<path d="M${n1(60 - nx - 3)} 82q${n1(nx + 3)} 10 ${n1(2 * nx + 6)} 0" stroke="${dark(o.top, 0.2)}" stroke-width="4" fill="none"/><path d="M57 88v14M63 88v14" stroke="#eef0f3" stroke-width="1.4"/><path d="M48 124h24l3 14h-30z" fill="${dark(o.top, 0.1)}" stroke="${dark(o.top, 0.2)}" stroke-width="1"/>`;
    else if (t === "dress") out += vneck(c.skin, 92) + `<path d="M${n1(60 - d.ww)} 122h${n1(2 * d.ww)}" stroke="${o.acc}" stroke-width="3"/><path d="M${n1(60 - d.sh + 3)} 88q4 6 10 6" stroke="${o.acc}" stroke-width="1.6" fill="none" opacity=".7"/>`;
    else if (t === "track") out += `<path d="M60 84V144" stroke="${dark(o.top, 0.3)}" stroke-width="1.6"/><path d="M${n1(60 - nx - 2)} 82h${n1(2 * nx + 4)}v4h${n1(-(2 * nx + 4))}z" fill="${dark(o.top, 0.15)}"/><path d="M${n1(60 - d.sh + 2)} 92L${n1(60 - d.ww + 1)} 140M${n1(60 + d.sh - 2)} 92L${n1(60 + d.ww - 1)} 140" stroke="${o.acc}" stroke-width="2.4"/>`;
    else if (t === "coat") out += openFront(dark(o.top, 0.2), 176, light(o.top, 0.08)) + `<path d="M${n1(60 - nx - 3)} 80q${n1(nx + 3)} 8 ${n1(2 * nx + 6)} 0v7q${n1(-(nx + 3))} 8 ${n1(-(2 * nx + 6))} 0z" fill="${o.acc}"/><path d="M63 86l3 26l5 -1l-3 -25z" fill="${dark(o.acc, 0.1)}"/>` + buttons(67, 120, 4, "#2a2320");
    else if (t === "military") out += `<g fill="${dark(o.top, 0.18)}" opacity=".55"><ellipse cx="50" cy="104" rx="6" ry="3.5"/><ellipse cx="69" cy="120" rx="7" ry="3.5"/><ellipse cx="54" cy="132" rx="5" ry="3"/><ellipse cx="72" cy="98" rx="4" ry="3"/></g>` + collar(dark(o.top, 0.1)) + `<rect x="${n1(60 - d.hw)}" y="136" width="${n1(2 * d.hw)}" height="5" fill="#3a3527"/>` + pocket(60 - d.ww + 3, 100, 10, 10) + pocket(60 + d.ww - 13, 100, 10, 10);
    out += vol(tp);
    return out;
  }
  function hat(p, d, id, o) {
    const L = 60 - d.cw,
      R = 60 + d.cw;
    if (o.type === "military")
      return `<path d="M${n1(L - 3)} 30C${n1(L - 2)} 10 ${n1(R + 2)} 10 ${n1(R + 3)} 30q${n1(-d.cw - 3)} -5 ${n1(-2 * d.cw - 6)} 0z" fill="url(#${id}t)"/><path d="M${n1(L - 3)} 30q${n1(d.cw + 3)} -5 ${n1(2 * d.cw + 6)} 0l3 4q${n1(-d.cw - 6)} -5 ${n1(-2 * d.cw - 12)} 0z" fill="${dark(o.top, 0.25)}"/>`;
    if (o.type === "coat" && p.age >= 60 && p.gender === "man")
      return `<path d="M${n1(L - 1)} 26C${n1(L + 2)} 8 ${n1(R - 2)} 8 ${n1(R + 1)} 26z" fill="#4c3d33"/><path d="M${n1(L - 5)} 27q${n1(d.cw + 5)} -5 ${n1(2 * d.cw + 10)} 0q${n1(-d.cw - 5)} 4 ${n1(-2 * d.cw - 10)} 0z" fill="#3c3029"/>`;
    return "";
  }
  function glasses(p) {
    if (!p.glasses) return "";
    const r = 8.6;
    return `<g fill="#fff" fill-opacity=".14" stroke="#3a3440" stroke-width="1.7"><rect x="${n1(49 - r)}" y="${n1(46 - r * 0.85)}" width="${n1(r * 2)}" height="${n1(r * 1.7)}" rx="6"/><rect x="${n1(71 - r)}" y="${n1(46 - r * 0.85)}" width="${n1(r * 2)}" height="${n1(r * 1.7)}" rx="6"/></g><path d="M57.6 44q2.4 -1.6 4.8 0M${n1(49 - r)} 44l-4 -1.6M${n1(71 + r)} 44l4 -1.6" stroke="#3a3440" stroke-width="1.6" fill="none"/>`;
  }

  Art.person = function (p) {
    const d = dims(p);
    const id = "hp" + ++N;
    const si = p.skin ?? 1;
    const base = Art.HAIR_COLORS[p.hairColor] || Art.HAIR_COLORS.kahve;
    const gray = Math.max(0, Math.min(1, p.gray || 0));
    const o = Art.OUTFITS[p.outfit] || Art.OUTFITS.gunluk;
    const c = {
      skin: Art.SKINS[si] || Art.SKINS[1],
      shade: Art.SKIN_SHADE[si] || Art.SKIN_SHADE[1],
      deep: Art.SKIN_DEEP[si] || Art.SKIN_DEEP[1],
      lips: Art.LIPS[si] || Art.LIPS[1],
      hair: mix(base, "#e6e6e9", gray),
      eye: Art.EYES[Math.abs(p.eyeColor | 0) % 4],
      top: o.top,
      acc: o.acc,
      bottom: o.bottom,
      shoes: o.shoes,
    };
    const hs = Math.max(0.86, Math.min(1.1, p.hs || 1));
    const lean = p.age >= 72 ? " rotate(2 60 214)" : "";
    const hr = hair(p, d, id, c);
    const hood = o.type === "hoodie" ? `<path d="M${n1(60 - d.nw / 2 - 11)} 86q-3 -14 ${n1(d.nw / 2 + 11)} -16q${n1(d.nw / 2 + 11)} 2 ${n1(d.nw / 2 + 11)} 16z" fill="${dark(o.top, 0.12)}"/>` : "";
    const neck =
      `<path d="M${n1(60 - d.nw / 2)} ${n1(d.chin - 10)}h${n1(d.nw)}v${n1(94 - d.chin)}q${n1(-d.nw / 2)} 5 ${n1(-d.nw)} 0z" fill="url(#${id}k)"/>` +
      `<path d="M${n1(60 - d.nw / 2)} ${n1(d.chin - 4)}h${n1(d.nw)}v5q${n1(-d.nw / 2)} 5 ${n1(-d.nw)} 0z" fill="${c.shade}"/>`;
    return (
      `<g class="hs-person" transform="translate(60 214) scale(${hs}) translate(-60 -214)${lean}">` +
      defs(id, c) +
      `<ellipse cx="60" cy="214" rx="${n1(26 + d.fat * 10)}" ry="4.5" fill="#000" opacity=".16"/>` +
      `<g class="hs-breath">` +
      hr.back +
      hood +
      legs(p, d, id, o, c) +
      neck +
      clothes(p, d, id, o, c) +
      arms(p, d, id, o, c) +
      head(p, d, id, c) +
      face(p, d, id, c) +
      (o.type === "military" ? "" : hr.front) +
      glasses(p) +
      hat(p, d, id, o) +
      `</g></g>`
    );
  };

  // Oyun durumundan karakter parametreleri
  Art.fromState = function (s) {
    const gray = Math.max(0, Math.min(1, (s.age - 33 - ((s.seed || 0) % 8)) / 38));
    const b = s.body;
    return {
      gender: s.look === "man" ? "man" : "woman",
      skin: s.skin ?? 1,
      hair: s.hair || "short",
      hairColor: s.hairColor || "kahve",
      gray,
      beard: s.beard && s.look === "man",
      thin: (s.thinning && !s.transplanted) || (s.look === "man" && s.age >= 58 && !s.transplanted && (s.seed || 0) % 3 === 0),
      age: s.age,
      outfit: s.outfit || "gunluk",
      mood: s.mood >= 62 ? 1 : s.mood < 35 ? -1 : 0,
      glasses: s.age >= 58 || !!(s.flags && s.flags.gozluk),
      fat: b && HS.Body ? HS.Body.fat(s) : 0.3,
      mus: b ? Math.min(1, b.mus / 100) : 0.25,
      hs: b ? b.h / (s.look === "man" ? 176 : 163) : 1,
      eyeColor: (s.seed || 0) % 4,
    };
  };
})(globalThis.HS || (globalThis.HS = {}));
