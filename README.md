# Hayat Simülatörü — oynanabilir web prototipi

Telefonda dikey ekranda oynanan, Türkçe bir yaşam simülasyonu. Oyuncu adını, soyadını, şehrini ve görünümünü seçer; 18 yaşında, cebinde 10.000 TL ile başlar. Her ana karar bir haftayı ilerletir. Oyun tarayıcıda çalışır; derleme adımı ya da harici oyun motoru yoktur.

> **Durum:** Bu bir **prototip**tir. Tarayıcıda oynanabilir ve otomatik testlerden geçer, ama App Store'a ya da Google Play'e gönderilmeye hazır **değildir**. Ayrıntılar aşağıda, "Neler hâlâ prototip" bölümünde.

## Çalıştırma

`index.html` dosyasını tarayıcıda açman yeterli. Telefonda denemek için klasörü herhangi bir statik sunucuyla yayınla (ör. `npx serve .` ya da GitHub Pages). Sunucu üzerinden açıldığında service worker devreye girer ve oyun çevrimdışı da çalışır.

## Neler tamamlandı (çalışıyor ve test ediliyor)

- **Haftalık karar döngüsü.** Her seçim haftayı ilerletir. Seçimin etkisi, maaş, giderler, faiz, borç, sağlık ve ilişkiler o hafta işlenir.
- **Meslekler ve iş yeri olayları.** Kafe, fabrika, müzik, ofis, öğretmenlik, sağlık, esnaflık ve riskli "gece işleri" var. Her mesleğin kendi olayları, ücreti, kademe atlaması ve ortamı var: karakterin kıyafeti, sahne rengi ve odadaki eşya mesleğe göre değişir.
- **Eğitim.** Üniversite sınavı, dört yıllık öğrencilik, final haftaları, staj ve okulu bırakma seçeneği var. Diploma öğretmenlik, sağlık ve ofis işlerinin kapısını açar.
- **İlişkiler, evlilik ve çocuklar.** Adı olan bir partnerle tanışılır. İlişki bağı ilgi gösterilmezse zayıflar; sonunda tartışma, ayrılık ya da boşanma gelebilir. Evlilikte nikâh büyük ya da küçük olabilir. Çocuğun adı önerilenlerden seçilir ya da elle yazılır. Çocukların okul, ergenlik, üniversite ve düğün dönemeçleri var; ileride torun da gelebilir.
- **Sağlık, mutluluk ve yaşlanma.** Sağlığın yaşa bağlı bir tavanı var. Mutluluk; ilişkilere, çevreye, borca, işe ve sağlığa göre bir dengeye doğru kayar. Karakter yaşlandıkça saçı ağarır, yüzünde çizgiler belirir ve boyu kısalır. Saç seyrelebilir.
- **Berber ve görünüm.** Kısa, uzun, kıvırcık ya da kazınmış saç seçilebilir; sakal bırakılıp kestirilebilir; saç ekimi yaptırılabilir.
- **Para ve varlıklar.** Mevduat, dalgalı endeks fonu ve faiz işleyen borç var; borç yapılandırılabilir. Aile evinde yaşanabilir, kiraya çıkılabilir (ev arkadaşıyla ya da tek başına), ev peşin ya da 15 yıllık krediyle alınabilir. Araba ve arsa da alınıp satılabilir.
- **Yer değiştirme.** Türkiye'de yedi şehir arasında taşınılabilir. Pasaport çıkarılıp kurmaca bir yurt dışı şehrine (Berlin) göç edilebilir ve geri dönülebilir.
- **Kurmaca siyaset ve ekonomi.** Dört yılda bir, hayal ürünü partiler ve adaylarla seçim yapılır; seçilen politika ekonomiye etki eder. 2027 ve sonrası için her hayata üç kurmaca ekonomi senaryosundan biri atanır.
- **Ara sahneler.** Mezuniyet, nikâh, doğum, ev alma, göç ve emeklilik gibi anlarda ve her altı ayda bir kısa ara sahne gösterilir.
- **Kayıtlar.** Her hayat bu cihazda ayrı kaydedilir. Kayıtlar arasında geçilebilir, kayıt silinebilir ve hayat istenen anda sonlandırılabilir. Kayıttan devam edilince yarım kalan haftanın olayı korunur. Eski sürümün kayıtları otomatik dönüştürülür.
- **Hayat sonu ve anı defteri.** Hayat bittiğinde, seçimlerden türeyen kişisel bir öykü, dönüm noktaları ve son profili gösterilir (aşağıya bak).

## Son profili sistemi (100.000+ anlamlı son)

Sonlar yalnızca numaralanmaz. Final anlatısı, `js/content/endings.js` içindeki **11 boyuttan** oluşur:

| Boyut | Değişken sayısı | Neye göre belirlenir |
|---|---|---|
| Hayatın kapanışı | 8 | Ölüm/kapanış nedeni ve yaş |
| Meslek ve yükseliş | 25 | En uzun çalışılan iş × kademe ve beceri |
| Eğitim | 3 | Lise, üniversite ya da yarım kalan üniversite |
| Aşk hayatı | 6 | Hiç, ayrılıklar, boşanma, evlenmeden birlikte, yakın ya da mesafeli evlilik |
| Çocuklar | 5 | Sayı × ebeveynle bağ |
| Çevre | 3 | Sosyal çevrenin büyüklüğü |
| Servet ve ev | 10 | Net değer bandı × ev sahipliği |
| Yer | 4 | Memleket, başka şehir, yurt dışı, dönüş |
| Beden ve ruh | 9 | Sağlık bandı × ruh hâli bandı |
| Baskın yaşam teması | 8 | Kararların biriktirdiği eğilim (kariyer, aile, risk, yolculuk…) |
| Risk geçmişi | 3 | Temiz, riskten dönen, gölgeli |

Mantıksal olarak imkânsız birleşimler (ör. temiz geçmişle "suç" sonu) çıkarıldığında **447.120.000 geçerli profil** kalır.

Her boyut finale kendi cümlelerini ekler, ve bazı boyutlar birbirinin metnini değiştirir:

- Çocukların yetişkinlikteki yolu ebeveynin eğitimine, servetine, yaşam temasına ve onlarla kurduğu bağa göre belirlenir.
- Veda sahnesinde kimin yanında olduğu çevreye, aşk hayatına ve çocuklara göre değişir.
- Partnerin adı, çocukların adları ve kayda geçen dönüm noktaları metne girer.

Anahtar, boyut değerlerinin birleşimidir. `tests/simulate.js` testi, farklı anahtarların farklı metin ürettiğini doğrular. Bu cihazda keşfedilen farklı son profilleri ayrıca sayılır.

**Dürüst not:** 447 milyon, sistemin ürettiği **birleşim** sayısıdır; elle yazılmış 447 milyon ayrı sahne değildir. Bir hayatta hangi değerlerin çıktığı oyuncunun kararlarına bağlıdır. Otomatik testte farklı oyun tarzına sahip 200 bot hayatı, 200 hayatta yaklaşık 180 farklı profile ulaştı.

## Ekonomi

2026 değerleri gerçek verilerle kalibre edilmiştir: TÜİK Eylül 2026 TÜFE (genel ve kategori bazlı), 2026 net asgari ücret, Ağustos 2026 il bazlı kiralar, m² konut fiyatları, en ucuz sıfır araç, toplu taşıma abonmanı, pasaport harcı, en düşük emekli aylığı ve mevduat faizi. Kaynaklar ve hangi rakamın ne kadar kesin olduğu [ECONOMY.md](ECONOMY.md) dosyasında.

2027 ve sonrası **kurmaca bir senaryodur**; gerçek tahmin değildir. Kişiler, partiler, kurumlar, bankalar ve markalar hayal ürünüdür.

## Proje yapısı

```
index.html, style.css          Arayüz ve mobil düzen
js/content/economy.js          2026 ekonomi verisi, meslekler, şehirler, senaryolar, kurmaca partiler
js/content/events.js           Hikâye olayları (veri)
js/content/events-daily.js     Gündelik olaylar ve aile evinden ayrılma (veri)
js/content/endings.js          Son profili boyutları ve final anlatısı
js/engine.js                   Oyun motoru (DOM'suz; Node'da da çalışır)
js/ui.js                       Ekranlar, sekmeler, kayıt, anı defteri
sw.js, manifest.webmanifest    Çevrimdışı web uygulaması
tests/                         Simülasyon ve tarayıcı testleri
```

### Yeni olay eklemek

Olaylar düz veri nesneleridir. Herhangi bir içerik dosyasına `HS.EVENTS.push({...})` eklemek yeterli:

```js
HS.EVENTS.push({
  id: "gardenPlot",            // benzersiz kimlik
  minAge: 30,                  // isteğe bağlı filtreler: minAge, maxAge, jobs, when(s)
  weight: 1,                   // havuzdaki ağırlık
  cooldown: 52,                // tekrar için geçmesi gereken hafta
  title: "Hobi bahçesi",
  text: (s, h) => h.ek(s.city, "loc") + " belediye hobi bahçesi kiralıyor.",
  choices: [
    { label: "Bir parsel kirala", hint: "Toprakla uğraş.", fx: { cost: 2000, h: 3, m: 4, theme: "care" } },
    { label: "Vazgeç", hint: "Zamanın yok.", fx: {} },
  ],
});
```

Kullanılabilen etki anahtarları (`cash`, `cost`, `h`, `m`, `skill`, `people`, `bond`, `job`, `edu`, `partner`, `marry`, `child`, `buy`, `emigrate` vb.) `js/engine.js` içindeki `apply()` fonksiyonunda listelenir. Tutarlar 2026 TL'si olarak yazılır ve oyun yılına göre enflasyonla ölçeklenir.

## Testler

```
node tests/simulate.js 200   # 200 hayatı farklı bot kişilikleriyle baştan sona oynatır
node tests/browser.js        # Chromium'da uçtan uca akış + 320/360/390 px taşma kontrolü
```

Simülasyon testi şunları denetler: hiçbir değerin NaN ya da negatif olmaması, her hayatın bitmesi, final metninde `undefined` olmaması ve farklı profillerin farklı metin üretmesi. Ayrıca ölüm yaşı dağılımını, son türlerini, boyut çeşitliliğini, 40 yaşındaki ortalama serveti ve hiç görülmeyen olayları raporlar.

Tarayıcı testi şunları dener: karakter oluşturma, 60 hafta oynama, tüm sekmeler, berber, sayfayı yenileyip kayıttan devam etme (yarım kalan olay korunmalı), çocuğa elle isim verme, ikinci hayat açıp hayatlar arasında geçme, hayatı sonlandırma, anı defteri ve dar ekranlarda yatay taşma olmaması.

## Neler hâlâ prototip

- **Mağaza sürümü yok.** iOS ya da Android uygulama kabuğu (ör. Capacitor), imzalama, mağaza ekran görüntüleri, yaş derecelendirmesi ve mağaza gizlilik beyanı yapılmadı. Bkz. [APP_STORE.md](APP_STORE.md).
- **Gerçek cihaz testi yapılmadı.** Mobil düzen, Chromium'un mobil emülasyonunda (320, 360 ve 390 px) test edildi; gerçek iPhone/Android Safari ve Chrome'da denenmedi.
- **Görseller basit.** Karakter ve ortam CSS şekillerinden oluşuyor. Profesyonel illüstrasyon, animasyon ve ses yok.
- **Denge ilk aşamada.** Ekonomi ve olay ağırlıkları bot simülasyonlarıyla ayarlandı, gerçek oyuncu testiyle değil. Örneğin riskli işleri seçen oyuncular için "suç" sonu hâlâ sık. Servet dağılımı da gerçek oyuncu verisiyle doğrulanmadı.
- **İçerik hacmi sınırlı.** 113 olay var. Uzun hayatlarda gündelik olaylar tekrar etmeye başlar.
- **Yurt dışı tek şehir.** Yurt dışı yalnızca kurmaca bir Berlin; yabancı para birimi modellenmiyor (TL karşılığı çarpanlarla).
- **Eş ve çocukların kendi hayatları yok.** Bir "bağ" değeriyle ve dönemeç olaylarıyla temsil ediliyorlar; kendi meslekleri ya da gelirleri simüle edilmiyor (evlilikte ev giderinin yarısını eşin karşıladığı varsayılıyor).
- **Erişilebilirlik kısmi.** Ekran okuyucu ve klavye için temel etiketler var, ama ayrıntılı bir erişilebilirlik denetimi yapılmadı.
- **Kayıtlar yalnızca bu cihazda.** Bulut yedeği ya da cihazlar arası eşitleme yok.
