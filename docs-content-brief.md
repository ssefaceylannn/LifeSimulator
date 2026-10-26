# İçerik yazım rehberi (Hayat Simülatörü)

Oyun: Türkçe, mobil, vanilla JS hayat simülasyonu. Global `HS`. Her hafta 3-6 "olay" (soru) gelir;
her olayın 2-4 seçeneği var. Oyuncu 18 yaşında başlar, ömür boyu oynar. Oyuncular aynı soruyla iki kez
karşılaşmak istemiyor; konular birbirine bağlı olmalı (aynı kişiler, aynı eşyalar, önceki kararlar).

## Dosya kalıbı
```js
(function (HS) {
  "use strict";
  const c = (label, hint, fx = {}) => ({ label, hint, fx });
  // ... HS.story(...) çağrıları
})(globalThis.HS || (globalThis.HS = {}));
```

## Hikâye API'si (js/systems/stories.js)
```js
HS.story("benzersizId", {
  when: (s) => koşul,           // başlama koşulu (isteğe bağlı)
  weight: 0.6,                  // başlama ağırlığı (0.3-0.9 arası; nadir olanlar düşük)
  minAge: 18, maxAge: 80,       // isteğe bağlı
  room: "mutfak",               // salon|yatak|mutfak|garaj|is|sokak|ziyaret (sahne)
  title: "Başlık" | (s, h) => "...",
  text: "Metin" | (s, h) => "...",
  choices: [c(...), ...] | (s, h) => [c(...), null, ...],   // null olanlar atlanır
  steps: {
    asamaAdi: { gap: 3, when: (s, d) => ..., title, text, choices },  // gap: kaç hafta sonra gelir
  },
});
```
Seçenek etkisinde (fx) hikâye akışı:
- `go: "asamaAdi"` → hikâye o aşamaya geçer, `gap` hafta sonra o aşamanın olayı gelir.
- `end: "sonucAdi"` → hikâye biter; sonuç kaydedilir. go/end yoksa başlangıç olayı hikâyeyi kapatır.
- `set: { anahtar: değer }` → hikâyeye özel veri; sonraki aşamalarda metin/choices fonksiyonlarının
  ikinci parametresinde `h.d.anahtar` ile okunur. Aşama `when(s, d)` de d alır.
- Şans: `chance: { p: 0.6, win: {..., go:"x"}, lose: {..., end:"y"}, winT, winP, loseT, loseP }`
  (win/lose içinde de go/end/set kullanılabilir).
- `rel: { komsu: 5 }` → kalıcı tanıdıkla ilişki (0-100) değişir.

Başka hikâyelere bağlanmak (ÇOK ÖNEMLİ — konular bağımsız olmasın):
- `HS.done(s, "id")` → biten hikâyenin sonucu (ör. "tamir", "dost") ya da undefined.
- `HS.inStory(s, "id")` → hikâye sürüyor mu.
- `HS.storyData(s, "id")` → hikâyenin saklanan verisi.
- `HS.cast(s, rol)` → hayat boyu sabit tanıdık `{name, woman, rel, born}`. Roller:
  komsu, enYakin, isArk, yonetici, liseArk, bakkal, usta, yonetim, doktor.
  Metinde `h.cast("komsu").name` ya da `HS.castName(s,"komsu")`. İlişki: `HS.castRel(s,"komsu")`.
  Aynı komşu/usta/arkadaş farklı hikâyelerde tekrar görünür: önceki hikâyedeki davranışa göre
  metin ve seçenekler değişsin (ör. kombi hikâyesinde usta dolandırdıysa çamaşır makinesi
  hikâyesinde "o ustayı arama" seçeneği).
- `s.flags[ad]` (fx: `flag: "ad"` → s.flags.ad = yıl) genel bayraklar.

Türkçe ek yardımcıları: `h.ek(isim, "gen")` (Ayşe'nin), "loc" (Ayşe'de), "dat" (Ayşe'ye), "acc" (Ayşe'yi), "abl" (Ayşe'den).
Para: `h.tl(18000)` → enflasyona göre "₺18.000"; `h.money(n)`. `h.pick([..])` rastgele seçim.

## Durum (s) alanları (okumak için)
- s.age, s.year, s.week (1-52), s.weeks (toplam hafta), s.city, s.birthCity, s.first (oyuncunun adı), s.look ("man"|"woman")
- s.cash, s.debt, s.health (0-100), s.mood (0-100), s.stress (0-100), s.people (çevre), s.skill, s.esteem
- s.job: "none"|"cafe"|"factory"|"music"|"office"|"teacher"|"nurse"|"memur"|"business"|"crime"; s.jobLevel 0-4; s.company (id) ; s.jobWeeks
- s.edu: "lise"|"ogrenci"|"universite"|"yarim"; s.major {name, field}
- s.housing: "aile"|"kira"|"kira-paylasim"|"ev"; s.assets.house; s.car (null ya da model); s.license
- s.partner: null | {name, bond, married, trust}; s.children: [{name, born, bond}]
- s.kin: akrabalar [{rel, name, alive, city, bond, gender}] (rel: anne, baba, kardesK, kardesE, abla, abi, kuzen, anneanne, dede, babaanne, dayi, teyze, amca, hala, kayinvalide, kayinpeder)
- s.items: sahip olunan eşyalar (telefon, laptop, konsol, tv, gitar, saat, kahve, klima, yatak, koltuk, kitap, bulasik, camasir)
- s.retired, s.abroad, s.gym, s.card (kredi kartı var mı), s.loans
- HS.isNight(s), HS.lateWeek(s) (hafta sonu), s.clock.day (0=Pzt..6=Paz)

## Etki anahtarları (fx)
- m (moral ±), h (sağlık ±), stress (±), people (çevre ±), skill (genel beceri ±, küçük: 0.5-2)
- cost (2026 TL harcama; enflasyonla ölçeklenir; para yetmezse seçenek kilitlenir ve eksik gösterilir)
- cash (2026 TL kazanç, pozitif), bond (partner bağı), kidBond, trust (partner güveni), esteem (özgüven)
- kg (kilo ±, küçük), perf (iş performansı ±), sleep (uykusuzluk +), sk: {iletisim:1, ...} (beceri dalı)
- flag: "ad", rel: {rol: n}, itemGive: "bulasik" (eşyayı bedavaya ver; hikâye eşya aldırırsa `cost` + `itemGive`)
- chance: {...} (yukarıda)
Tutarlar 2026 Türkiye fiyatlarıyla gerçekçi olsun (asgari ücret ~28.000 net, kira 15-35 bin, beyaz eşya 15-30 bin, usta çağırma 1.500-4.000).
Seçenek ipucu (hint) kısa: "₺3.500 · stres −" gibi. Her seçeneğin bir bedeli/kazancı olsun; "doğru cevap" bariz olmasın.

## Kalite
- Hepsi Türkçe, doğal, gündelik, esprili ama saygılı; Türkiye gerçekliği (apartman yönetimi, aidat, kapıcı,
  bayram, düğün, askerlik, kayınvalide, e-Devlet, kargo, site, servis, çay, mahalle).
- Her hikâye 2-4 aşama; dallanan seçenekler; sonuçlar başka hikâyeleri etkilesin.
- Koşullar mantıklı: aile evinde yaşayan biri apartman yöneticisiyle aidat kavgası yapmaz; işsiz biri
  iş arkadaşı hikâyesi yaşamaz; partneri olmayan biri partner hikâyesi yaşamaz.
- Kimlikler benzersiz olsun (dosyaya özel ön ek kullan, ör. "h_" / "l_" / "w_").
- Kişi adları uydurma ve sık Türk adları; gerçek şirket/marka adı yok.

## Doğrulama
`node -e 'const HS=require("./tests/load.js")(); console.log(Object.keys(HS.STORIES).length)'`
ve `node tests/simulate.js 60` hatasız geçmeli.
