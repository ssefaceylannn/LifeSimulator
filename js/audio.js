// Ses: Web Audio ile üretilen arka plan müziği, arayüz efektleri ve titreşim.
// Harici dosya yok; Web Audio yoksa tüm çağrılar sessizce hiçbir şey yapmaz.
(function (HS) {
  "use strict";

  const AC = globalThis.AudioContext || globalThis.webkitAudioContext;
  const S = { music: true, sfx: true, vibration: true, volume: 0.8 };
  const MUSIC_LVL = 0.15; // müzik ana seviyesi
  const SFX_LVL = 0.32; // efekt seviyesi
  const BPM = 86;
  const STEP = 60 / BPM / 4; // 16'lık nota süresi
  const LOOK = 0.45; // ileriye planlama penceresi (sn); seyrek zamanlayıcıyla boşluk olmasın

  let ctx = null, master = null, musicBus = null, sfxBus = null, noiseBuf = null;
  let unlocked = false, listening = false, timer = null, stopTimer = null, playing = false;
  let nextT = 0, step = 0, bar = 0, section = null, melIdx = 3, lastProg = -1;

  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);
  const rnd = Math.random;
  const pick = (a) => a[(rnd() * a.length) | 0];

  // ---------- Bağlam ve ses yolları ----------
  function ensureCtx() {
    if (ctx || !AC) return ctx;
    try {
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = S.volume;
      master.connect(ctx.destination);
      sfxBus = ctx.createGain();
      sfxBus.gain.value = SFX_LVL;
      sfxBus.connect(master);
      // Müzik: yumuşak alçak geçiren filtre + hafif yankı (geri beslemeli gecikme)
      musicBus = ctx.createGain();
      musicBus.gain.value = 0;
      const lp = ctx.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.value = 2600;
      lp.Q.value = 0.4;
      musicBus.connect(lp);
      lp.connect(master);
      const dl = ctx.createDelay(1);
      dl.delayTime.value = STEP * 3;
      const fb = ctx.createGain();
      fb.gain.value = 0.28;
      const dlp = ctx.createBiquadFilter();
      dlp.type = "lowpass";
      dlp.frequency.value = 1500;
      lp.connect(dl);
      dl.connect(dlp);
      dlp.connect(fb);
      fb.connect(dl);
      const wet = ctx.createGain();
      wet.gain.value = 0.35;
      dlp.connect(wet);
      wet.connect(master);
      // Beyaz gürültü tamponu (hi-hat, zar, hışırtı)
      const n = ctx.sampleRate;
      noiseBuf = ctx.createBuffer(1, n, n);
      const d = noiseBuf.getChannelData(0);
      for (let i = 0; i < n; i++) d[i] = rnd() * 2 - 1;
    } catch (e) {
      ctx = null;
    }
    return ctx;
  }

  const live = () => ctx && unlocked && ctx.state === "running";

  // ---------- Ses üreticileri ----------
  // Basit zarflı osilatör
  function tone(f, t, dur, o) {
    o = o || {};
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = o.type || "sine";
    osc.frequency.setValueAtTime(f, t);
    if (o.to) osc.frequency.exponentialRampToValueAtTime(o.to, t + dur);
    if (o.detune) osc.detune.value = o.detune;
    const pk = o.gain == null ? 0.2 : o.gain;
    const at = o.attack || 0.005;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(pk, t + at);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g);
    g.connect(o.dest || sfxBus);
    osc.start(t);
    osc.stop(t + dur + 0.05);
  }

  // Filtrelenmiş gürültü patlaması
  function noise(t, dur, gain, type, freq, dest, freqTo) {
    const src = ctx.createBufferSource();
    src.buffer = noiseBuf;
    const f = ctx.createBiquadFilter();
    f.type = type;
    f.frequency.setValueAtTime(freq, t);
    if (freqTo) f.frequency.exponentialRampToValueAtTime(freqTo, t + dur);
    f.Q.value = type === "bandpass" ? 1.2 : 0.7;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(gain, t + Math.min(0.01, dur / 3));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f);
    f.connect(g);
    g.connect(dest || sfxBus);
    src.start(t, rnd() * 0.5);
    src.stop(t + dur + 0.02);
  }

  // Elektrikli piyano benzeri ses: sinüs + yumuşak üçgen üst ton
  function ep(f, t, dur, gain, dest) {
    tone(f, t, dur, { type: "sine", gain: gain, attack: 0.012, dest: dest });
    tone(f * 2, t, dur * 0.5, { type: "triangle", gain: gain * 0.18, attack: 0.008, detune: 4, dest: dest });
  }

  // ---------- Müzik verisi ----------
  // Melodi dizileri (MIDI): doğal minör, Hicaz (Mi üzerinde, Sol#) ve Uşşak/Kürdi esintisi (Si bemol)
  const MIN = [69, 71, 72, 74, 76, 77, 79, 81, 83, 84];
  const HIC = [68, 69, 71, 72, 74, 76, 77, 80, 81, 83];
  const USS = [69, 70, 72, 74, 76, 77, 79, 81, 82, 84];
  // Akorlar: r = bas kökü, v = akor sesleri, s = melodi dizisi
  const C = {
    Am: { r: 45, v: [57, 60, 64, 67], s: MIN },
    Am9: { r: 45, v: [55, 59, 60, 64], s: MIN },
    F: { r: 41, v: [57, 60, 64, 65], s: MIN },
    C: { r: 48, v: [55, 59, 60, 64], s: MIN },
    G: { r: 43, v: [55, 59, 62, 64], s: MIN },
    Dm: { r: 50, v: [57, 60, 62, 65], s: MIN },
    Bb: { r: 46, v: [57, 58, 62, 65], s: USS },
    E7: { r: 40, v: [56, 59, 62, 65], s: HIC },
    G7: { r: 43, v: [53, 59, 62, 67], s: MIN },
  };
  // 8 ölçülük dizilimler; her döngüde biri seçilir
  const PROGS = [
    ["Am9", "F", "C", "G", "Dm", "Bb", "E7", "Am"],
    ["Dm", "G7", "C", "Am", "F", "Dm", "E7", "Am9"],
    ["Am", "Dm", "G", "C", "F", "Bb", "E7", "E7"],
    ["F", "G", "Am9", "Am", "Dm", "E7", "Am", "Am9"],
  ];

  // Her 8 ölçüde bölüm karakteri değişir (davul, melodi yoğunluğu)
  function newSection(first) {
    let p;
    do p = (rnd() * PROGS.length) | 0;
    while (p === lastProg && PROGS.length > 1);
    lastProg = p;
    section = {
      prog: first ? PROGS[0] : PROGS[p],
      drums: first ? false : rnd() < 0.8,
      mel: first ? 0.15 : pick([0, 0.3, 0.45, 0.55]),
    };
  }

  // Tek bir 16'lık adımı planla
  function schedStep(s, t) {
    const b = bar % 8;
    if (s === 0 && b === 0) newSection(bar === 0);
    const ch = C[section.prog[b]];
    const swing = s % 2 ? STEP * 0.12 : 0;
    const tt = t + swing;
    const mb = musicBus;

    // Akorlar: ölçü başında hafif arpejli vuruş, bazen 2. vuruş
    if (s === 0 || (s === 10 && rnd() < 0.45)) {
      const g = s === 0 ? 0.075 : 0.045;
      ch.v.forEach((m, i) => ep(mtof(m), tt + i * 0.014, s === 0 ? 2.4 : 1.2, g, mb));
    }
    // Bas
    if (s === 0) tone(mtof(ch.r), tt, STEP * 7, { gain: 0.22, attack: 0.02, dest: mb });
    if (s === 8 && rnd() < 0.6) tone(mtof(ch.r + pick([7, 12, 0])), tt, STEP * 5, { gain: 0.16, attack: 0.02, dest: mb });
    if (s === 14 && rnd() < 0.25) tone(mtof(ch.r + 7), tt, STEP * 2, { gain: 0.12, attack: 0.01, dest: mb });

    // Davul: yumuşak kick, rimshot benzeri, hi-hat tıkırtıları
    if (section.drums) {
      if (s === 0 || (s === 7 && rnd() < 0.3) || (s === 10 && rnd() < 0.4))
        tone(110, tt, 0.22, { to: 42, gain: 0.32, attack: 0.003, dest: mb });
      if (s === 4 || s === 12) noise(tt, 0.09, 0.05, "bandpass", 1900, mb);
      if (s % 2 === 0 && rnd() < 0.9) noise(tt, 0.035, s % 4 === 2 ? 0.05 : 0.025, "highpass", 7000, mb);
      else if (rnd() < 0.12) noise(tt, 0.03, 0.02, "highpass", 8000, mb);
    } else if (s % 4 === 2 && rnd() < 0.5) {
      noise(tt, 0.03, 0.02, "highpass", 7500, mb);
    }

    // Melodi: rastgele yürüyüş, ara sıra çarpma (süs notası)
    if (section.mel && b % 4 < 3 && s % 2 === 0 && rnd() < section.mel * (s % 4 === 0 ? 1 : 0.6)) {
      const sc = ch.s;
      melIdx = clamp(melIdx + pick([-2, -1, -1, 0, 1, 1, 2]), 0, sc.length - 1);
      if (s === 0) {
        // ölçü başında akor sesine yakın dur
        const pcs = ch.v.map((m) => m % 12);
        for (let k = 0; k < 3 && pcs.indexOf(sc[melIdx] % 12) < 0; k++) melIdx = clamp(melIdx + (rnd() < 0.5 ? 1 : -1), 0, sc.length - 1);
      }
      const f = mtof(sc[melIdx]);
      const len = STEP * pick([2, 2, 3, 4, 6]);
      let mt = tt;
      if (rnd() < 0.18 && melIdx < sc.length - 1) {
        tone(mtof(sc[melIdx + 1]), mt, 0.09, { type: "triangle", gain: 0.05, dest: mb });
        mt += 0.06;
      }
      tone(f, mt, len + 0.35, { type: "triangle", gain: 0.085, attack: 0.008, dest: mb });
      tone(f * 2, mt, 0.25, { type: "sine", gain: 0.02, dest: mb });
    }
  }

  // İleriye bakan zamanlayıcı: setInterval + AudioContext saati
  function tick() {
    if (!ctx || ctx.state !== "running") return;
    if (nextT < ctx.currentTime) nextT = ctx.currentTime + 0.05;
    while (nextT < ctx.currentTime + LOOK) {
      try {
        schedStep(step, nextT);
      } catch (e) {}
      nextT += STEP;
      if (++step === 16) {
        step = 0;
        bar++;
      }
    }
  }

  function startMusic() {
    if (!live() || !S.music) return;
    if (stopTimer) clearTimeout(stopTimer), (stopTimer = null);
    const g = musicBus.gain, t = ctx.currentTime;
    g.cancelScheduledValues(t);
    g.setValueAtTime(g.value, t);
    g.linearRampToValueAtTime(MUSIC_LVL, t + 1.2);
    if (playing) return;
    playing = true;
    step = 0;
    bar = 0;
    nextT = t + 0.08;
    timer = setInterval(tick, 180); // seyrek zamanlayıcı: işlemci ve pil dostu
    tick();
  }

  function stopMusic() {
    if (!ctx || !playing) return;
    const g = musicBus.gain, t = ctx.currentTime;
    g.cancelScheduledValues(t);
    g.setValueAtTime(g.value, t);
    g.linearRampToValueAtTime(0, t + 0.6);
    if (stopTimer) clearTimeout(stopTimer);
    stopTimer = setTimeout(() => {
      stopTimer = null;
      clearInterval(timer);
      timer = null;
      playing = false;
    }, 700);
  }

  // ---------- Efektler ----------
  const SFX = {
    tap(t) {
      tone(1200, t, 0.06, { gain: 0.18, to: 900 });
      tone(2400, t, 0.03, { type: "triangle", gain: 0.03 });
    },
    select(t) {
      tone(660, t, 0.14, { type: "triangle", gain: 0.18 });
      tone(990, t + 0.06, 0.2, { type: "triangle", gain: 0.16 });
    },
    advance(t) {
      noise(t, 0.4, 0.09, "bandpass", 350, null, 2600);
      tone(1318.5, t + 0.22, 0.5, { gain: 0.1 });
      tone(1975.5, t + 0.27, 0.45, { gain: 0.05 });
    },
    win(t) {
      [523.3, 659.3, 784, 1046.5].forEach((f, i) => ep(f, t + i * 0.08, i === 3 ? 0.6 : 0.3, 0.2));
    },
    lose(t) {
      [440, 370, 311.1].forEach((f, i) => tone(f, t + i * 0.15, i === 2 ? 0.45 : 0.22, { type: "triangle", gain: 0.17, to: f * 0.97 }));
    },
    coin(t) {
      tone(987.8, t, 0.08, { type: "triangle", gain: 0.16 });
      tone(1318.5, t + 0.07, 0.35, { type: "triangle", gain: 0.16 });
    },
    buy(t) {
      noise(t, 0.06, 0.08, "highpass", 5000);
      tone(1046.5, t + 0.03, 0.3, { type: "triangle", gain: 0.13 });
      tone(1568, t + 0.03, 0.3, { type: "triangle", gain: 0.08 });
      tone(2093, t + 0.12, 0.4, { gain: 0.08 });
    },
    levelup(t) {
      [392, 523.3, 659.3, 784].forEach((f, i) => tone(f, t + i * 0.07, 0.2, { type: "triangle", gain: 0.15 }));
      [523.3, 659.3, 784, 1046.5].forEach((f) => ep(f, t + 0.3, 0.48, 0.1));
    },
    notify(t) {
      tone(784, t, 0.3, { gain: 0.15 });
      tone(1174.7, t + 0.1, 0.4, { gain: 0.12 });
    },
    error(t) {
      const o = { type: "triangle", gain: 0.16 };
      tone(233, t, 0.12, o);
      tone(196, t + 0.13, 0.18, o);
    },
    dice(t) {
      let x = t;
      for (let i = 0; i < 7; i++) {
        noise(x, 0.03, 0.12, "bandpass", 2200 + rnd() * 2200);
        if (rnd() < 0.5) tone(500 + rnd() * 500, x, 0.04, { gain: 0.05 });
        x += 0.035 + rnd() * 0.03;
      }
    },
  };

  // ---------- Kilit açma (ilk dokunuş) ----------
  function onGesture() {
    if (!ensureCtx()) return removeListeners();
    try {
      // iOS: kullanıcı hareketi içinde sessiz bir ses başlatılmalı
      const b = ctx.createBuffer(1, 1, 22050);
      const src = ctx.createBufferSource();
      src.buffer = b;
      src.connect(ctx.destination);
      src.start(0);
    } catch (e) {}
    const done = () => {
      if (ctx.state !== "running") return;
      unlocked = true;
      removeListeners();
      if (S.music) startMusic();
    };
    try {
      const p = ctx.resume && ctx.resume();
      if (p && p.then) p.then(done, () => {});
      else done();
    } catch (e) {}
  }

  function removeListeners() {
    if (!listening) return;
    listening = false;
    document.removeEventListener("pointerdown", onGesture, true);
    document.removeEventListener("keydown", onGesture, true);
    document.removeEventListener("touchend", onGesture, true);
  }

  function onVisibility() {
    if (!ctx || !unlocked) return;
    try {
      if (document.hidden) ctx.suspend();
      else ctx.resume();
    } catch (e) {}
  }

  // ---------- Dışa açık arayüz ----------
  const PATTERNS = { tap: 10, win: [20, 40, 20], lose: [60], error: [30, 30, 30] };

  HS.Audio = {
    init(settings) {
      try {
        if (settings) for (const k in S) if (k in settings) this.set(k, settings[k]);
        if (!listening && !unlocked && AC && typeof document !== "undefined") {
          listening = true;
          document.addEventListener("pointerdown", onGesture, true);
          document.addEventListener("keydown", onGesture, true);
          document.addEventListener("touchend", onGesture, true);
          document.addEventListener("visibilitychange", onVisibility);
        }
      } catch (e) {}
    },
    set(key, value) {
      try {
        if (!(key in S)) return;
        if (key === "volume") {
          S.volume = clamp(Number(value) || 0, 0, 1);
          if (master) master.gain.setTargetAtTime(S.volume, ctx.currentTime, 0.05);
          return;
        }
        S[key] = !!value;
        if (key === "music") S.music ? startMusic() : stopMusic();
      } catch (e) {}
    },
    play(name) {
      try {
        if (!S.sfx || !live() || !SFX[name]) return;
        SFX[name](ctx.currentTime + 0.01);
      } catch (e) {}
    },
    vibrate(name) {
      try {
        if (!S.vibration || !PATTERNS[name]) return;
        const n = globalThis.navigator;
        if (n && typeof n.vibrate === "function") n.vibrate(PATTERNS[name]);
      } catch (e) {}
    },
    get state() {
      return Object.assign({}, S);
    },
  };
})(globalThis.HS || (globalThis.HS = {}));
