# Hayat Simülatörü — oynanabilir web prototipi

Telefonda dikey ekranda oynanan, Türkçe bir yaşam simülasyonu. Oyuncu adını, soyadını, doğduğu ili (81 il), cinsiyetini (kadın/erkek), ten ve saç rengini, saç modelini seçer; 18 yaşında, cebinde 10.000 TL ile başlar. Her ana karar bir haftayı ilerletir; kararlar arasında boş zamanında etkinlikler yapar. Karakter, sokakta evinin önünde 2D animasyonlu bir sahnede görünür. Oyun tarayıcıda çalışır; derleme adımı ya da harici oyun motoru yoktur.

> **Durum:** Bu bir **prototip**tir. Tarayıcıda oynanabilir ve otomatik testlerden geçer, ama App Store'a ya da Google Play'e gönderilmeye hazır **değildir**. Ayrıntılar aşağıda, "Neler hâlâ prototip" bölümünde.

## Çalıştırma

`index.html` dosyasını tarayıcıda açman yeterli. Telefonda denemek için klasörü herhangi bir statik sunucuyla yayınla (ör. `npx serve .` ya da GitHub Pages). Sunucu üzerinden açıldığında service worker devreye girer ve oyun çevrimdışı da çalışır.

## Neler tamamlandı (çalışıyor ve test ediliyor)

- **Haftalık karar döngüsü.** Her seçim haftayı ilerletir. Seçimin etkisi, maaş, giderler, faiz, borç, sağlık ve ilişkiler o hafta işlenir.
- **Boş zaman.** Her hafta karardan önce 1-4 boş zaman hakkı var (çalışan ve öğrencide az, işsiz ve emeklide çok, küçük çocuk varsa bir eksik). Spor, ders, arkadaşlar, aile ziyareti, partnerle vakit, çocuklarla oyun, ek iş, şehri gezme, gönüllülük, dinlenme ve piyango bileti gibi etkinlikler var. Bazılarında beklenmedik sürprizler çıkar: biriyle tanışmak, sakatlanmak, cüzdan bulmak, telefonun çalınması, ikramiye.
- **Sonucu belli olmayan kararlar.** İş başvurusu yapılır; sonuç 1-3 hafta sonra telefonla gelir, ofis/öğretmenlik/sağlık/memurluk işlerinde araya mülakat girer. Kabul şansı beceriye, eğitime, çevreye, yaşa ve **kıyafetin işe uygunluğuna** bağlı ve ekranda yüzde olarak görünür. Üniversite sınavı, terfi mülakatı, dükkân açılışı, demo kaydı, riskli teklifler, evlenme teklifi ve akraba borçları da şansla sonuçlanır; sonuç kısa bir bekleyişin ardından açıklanır.
- **Akrabalar ve torpil.** Dayın belediye şirketinde torpille iş ayarlamayı teklif eder; kabul edersen iş yerinde dedikodu çıkar, dayın da bir gün iyiliğinin karşılığını ister. Teyzenin görücü ayarlaması, bayram ziyaretleri ve "ne zaman evleniyorsun" soruları, amcanın borç istemesi, kuzenle kıyaslanmak, pazar kahvaltıları ve miras kavgası da var.
- **Meslekler ve iş yeri olayları.** Kafe, fabrika, müzik, ofis, öğretmenlik, sağlık, belediye şirketi memurluğu, esnaflık ve riskli "gece işleri" var. Her mesleğin kendi olayları, ücreti ve kademe atlaması var. Sahnede iş yerinin binası görünür; işe girince iş kıyafeti dolaba eklenir.
- **Eğitim.** Üniversite sınavı, dört yıllık öğrencilik, final haftaları, staj ve okulu bırakma seçeneği var. Diploma öğretmenlik, sağlık ve ofis işlerinin kapısını açar.
- **İlişkiler, evlilik ve çocuklar.** Adı olan bir partnerle tanışılır. İlişki bağı ilgi gösterilmezse zayıflar; sonunda tartışma, ayrılık ya da boşanma gelebilir. Evlilikte nikâh büyük ya da küçük olabilir. Çocuğun adı önerilenlerden seçilir ya da elle yazılır. Çocukların okul, ergenlik, üniversite ve düğün dönemeçleri var; ileride torun da gelebilir.
- **Sağlık, mutluluk ve yaşlanma.** Sağlığın yaşa bağlı bir tavanı var. Mutluluk; ilişkilere, çevreye, borca, işe ve sağlığa göre bir dengeye doğru kayar. Karakter yaşlandıkça saçı ağarır, alnında ve göz kenarında çizgiler belirir, gözlük takar, ileri yaşta hafifçe öne eğilir. Erkek karakterde saç seyrelebilir. Yüz ifadesi ruh hâline göre değişir.
- **Stil: gardırop ve berber.** 13 kıyafet var (tişört-kot, gömlek, takım elbise, kafe önlüğü, iş tulumu, deri ceket, hırka, sağlık forması, esnaf yeleği, kapüşonlu, elbise, eşofman, örgü yelek). Satın alınıp giyilir ve sahnede görünür; işe uygun kıyafet başvuruda ve terfide şansı artırır. Berberde 5 saç modeli, sakal, saç boyası ve saç ekimi var.
- **Para ve varlıklar.** Mevduat, dalgalı endeks fonu ve faiz işleyen borç var; borç yapılandırılabilir. Aile evinde yaşanabilir, kiraya çıkılabilir (ev arkadaşıyla ya da tek başına). Daire, bahçeli müstakil ev ya da villa peşin veya 15 yıllık krediyle alınabilir. 6 araç modeli var (bisiklet, scooter, ekonomik otomobil, pikap, SUV, spor araba); takaslanabilir ve boyatılabilir. Arsa da alınıp satılabilir.
- **Sokak sahnesi.** Karakter evinin önünde durur. Arkadaki bina barınmaya göre değişir: aile apartmanı (balkon, çamaşır ipi, çanak anten), ev arkadaşıyla eski blok, modern kiralık blok, satın alınmış daire, bahçeli müstakil ev, villa ya da yurt dışında tuğla sıra evler. Her taşınmada bina rengi değişir. Araba yolda, bisiklet/scooter kaldırımda durur. Partner ve çocuklar yanındadır, kedi sahiplenilirse o da görünür. Gökyüzü mevsime göre değişir; soğuk bölgelerde kışın kar yağar. Uzak planda ilin özellikleri görünür: deniz ve vapur, dağ, büyükşehir silueti, kale, cami, köprü, kule, saat kulesi, palmiye. Karakter nefes alır, göz kırpar, iyi bir kararda zıplar, kötü haberde omuz düşürür.
- **Yer değiştirme.** 81 il arasında taşınılabilir. Pasaport çıkarılıp kurmaca bir yurt dışı şehrine (Berlin) göç edilebilir ve geri dönülebilir.
- **Kurmaca siyaset ve ekonomi.** Dört yılda bir, hayal ürünü partiler ve adaylarla seçim yapılır; seçilen politika ekonomiye etki eder. 2027 ve sonrası için her hayata üç kurmaca ekonomi senaryosundan biri atanır.
- **Ara sahneler.** Mezuniyet, nikâh, doğum, ev alma, göç ve emeklilik gibi anlarda ve her altı ayda bir kısa ara sahne gösterilir.
- **Kayıtlar.** Her hayat bu cihazda ayrı kaydedilir. Kayıtlar arasında geçilebilir, kayıt silinebilir ve hayat istenen anda sonlandırılabilir. Kayıttan devam edilince yarım kalan haftanın olayı korunur. Eski sürümün kayıtları otomatik dönüştürülür.
- **Hayat sonu ve anı defteri.** Hayat bittiğinde, seçimlerden türeyen kişisel bir öykü, dönüm noktaları ve son profili gösterilir (aşağıya bak).

## Son profili sistemi (100.000+ anlamlı son)

Sonlar yalnızca numaralanmaz. Final anlatısı, `js/content/endings.js` içindeki **11 boyuttan** oluşur:

| Boyut | Değişken sayısı | Neye göre belirlenir |
|---|---|---|
| Hayatın kapanışı | 8 | Ölüm/kapanış nedeni ve yaş |
| Meslek ve yükseliş | 28 | En uzun çalışılan iş × kademe ve beceri |
| Eğitim | 3 | Lise, üniversite ya da yarım kalan üniversite |
| Aşk hayatı | 6 | Hiç, ayrılıklar, boşanma, evlenmeden birlikte, yakın ya da mesafeli evlilik |
| Çocuklar | 5 | Sayı × ebeveynle bağ |
| Çevre | 3 | Sosyal çevrenin büyüklüğü |
| Servet ve ev | 10 | Net değer bandı × ev sahipliği |
| Yer | 4 | Memleket, başka şehir, yurt dışı, dönüş |
| Beden ve ruh | 9 | Sağlık bandı × ruh hâli bandı |
| Baskın yaşam teması | 8 | Kararların biriktirdiği eğilim (kariyer, aile, risk, yolculuk…) |
| Risk geçmişi | 3 | Temiz, riskten dönen, gölgeli |

Mantıksal olarak imkânsız birleşimler (ör. temiz geçmişle "suç" sonu) çıkarıldığında **500.774.400 geçerli profil** kalır.

Her boyut finale kendi cümlelerini ekler, ve bazı boyutlar birbirinin metnini değiştirir:

- Çocukların yetişkinlikteki yolu ebeveynin eğitimine, servetine, yaşam temasına ve onlarla kurduğu bağa göre belirlenir.
- Veda sahnesinde kimin yanında olduğu çevreye, aşk hayatına ve çocuklara göre değişir.
- Partnerin adı, çocukların adları ve kayda geçen dönüm noktaları metne girer.

Anahtar, boyut değerlerinin birleşimidir. `tests/simulate.js` testi, farklı anahtarların farklı metin ürettiğini doğrular. Bu cihazda keşfedilen farklı son profilleri ayrıca sayılır.

**Not:** 500 milyon, sistemin ürettiği **birleşim** sayısıdır; elle yazılmış 500 milyon ayrı sahne değildir. Bir hayatta hangi değerlerin çıktığı oyuncunun kararlarına bağlıdır. Otomatik testte farklı oyun tarzına sahip 200 bot hayatı yaklaşık 150-160 farklı profile ulaştı. Boş zaman etkinlikleri ilişki ve çevre puanlarını yükselttiği için, sık etkinlik yapan hayatlar birbirine biraz daha çok benziyor.

## Ekonomi

2026 değerleri gerçek verilerle kalibre edilmiştir: TÜİK Eylül 2026 TÜFE (genel ve kategori bazlı), 2026 net asgari ücret, **81 ilin** ortalama ilan kirası ve m² konut fiyatı (Ağustos-Ekim 2026), en ucuz sıfır araç, toplu taşıma abonmanı, pasaport harcı, en düşük emekli aylığı ve mevduat faizi. Kaynaklar ve hangi rakamın ne kadar kesin olduğu [ECONOMY.md](ECONOMY.md) dosyasında.

2027 ve sonrası **kurmaca bir senaryodur**; gerçek tahmin değildir. Kişiler, partiler, kurumlar, bankalar ve markalar hayal ürünüdür.

## Proje yapısı

```
index.html, style.css          Arayüz ve mobil düzen (beyaz-mavi tema)
js/content/economy.js          2026 ekonomi verisi, meslekler, senaryolar, kurmaca partiler
js/content/cities.js           81 il: kira, m² fiyatı, bölge ve sahne özellikleri
js/content/events.js           Hikâye olayları (veri)
js/content/events-daily.js     Gündelik olaylar ve aile evinden ayrılma (veri)
js/content/events-family.js    İş başvurusu, mülakat, akrabalar ve torpil (veri)
js/content/activities.js       Boş zaman etkinlikleri ve sürprizleri (veri)
js/content/endings.js          Son profili boyutları ve final anlatısı
js/art/character.js            Parçalı SVG karakter, kıyafetler, saç ve yaşlanma
js/art/scene.js                Sokak sahnesi: ev, araba, iş yeri, şehir silueti, mevsim
js/art/fluent.js               Gömülü Fluent Emoji çizimleri (scripts/build-art.js üretir)
assets/fluent/                 Kullanılan Fluent Emoji SVG'leri, sınır ölçüleri ve lisansı
js/engine.js                   Oyun motoru (DOM'suz; Node'da da çalışır)
js/ui.js                       Ekranlar, sekmeler, boş zaman, kayıt, anı defteri
scripts/                       Çizim gömme/ölçme ve tek dosya derleme betikleri
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

Sonucu şansa bağlı bir seçim için `fx.chance` kullanılır: `{ p: 0.6, win: {...}, lose: {...}, winT, winP, loseT, loseP }`. Oyuncu yüzdeyi görür, sonuç kısa bir bekleyişten sonra açıklanır. Yeni boş zaman etkinliği `HS.ACTIVITIES` listesine, yeni kıyafet `HS.Art.OUTFITS` içine eklenir.

Kullanılabilen etki anahtarları (`cash`, `cost`, `h`, `m`, `skill`, `people`, `bond`, `job`, `apply`, `edu`, `partner`, `marry`, `child`, `buy`, `emigrate`, `chance` vb.) `js/engine.js` içindeki `apply()` fonksiyonunda listelenir. Tutarlar 2026 TL'si olarak yazılır ve oyun yılına göre enflasyonla ölçeklenir.

## Testler

```
node tests/simulate.js 200   # 200 hayatı farklı bot kişilikleriyle baştan sona oynatır
node tests/browser.js        # Chromium'da uçtan uca akış + 320/360/390 px taşma kontrolü
```

Simülasyon testi şunları denetler: hiçbir değerin NaN ya da negatif olmaması, her hayatın bitmesi, final metninde `undefined` olmaması ve farklı profillerin farklı metin üretmesi. Ayrıca ölüm yaşı dağılımını, son türlerini, boyut çeşitliliğini, 40 yaşındaki ortalama serveti ve hiç görülmeyen olayları raporlar.

Tarayıcı testi şunları dener: karakter oluşturma, 60 hafta oynama, tüm sekmeler, berber, kıyafet alıp giyme, araba alıp sahnede görme, iş başvurusu, boş zaman etkinliği, sayfayı yenileyip kayıttan devam etme (yarım kalan olay korunmalı), çocuğa elle isim verme, ikinci hayat açıp hayatlar arasında geçme, hayatı sonlandırma, anı defteri ve dar ekranlarda yatay taşma olmaması.

## Neler hâlâ prototip

- **Mağaza sürümü yok.** iOS ya da Android uygulama kabuğu (ör. Capacitor), imzalama, mağaza ekran görüntüleri, yaş derecelendirmesi ve mağaza gizlilik beyanı yapılmadı. Bkz. [APP_STORE.md](APP_STORE.md).
- **Gerçek cihaz testi yapılmadı.** Mobil düzen, Chromium'un mobil emülasyonunda (320, 360 ve 390 px) test edildi; gerçek iPhone/Android Safari ve Chrome'da denenmedi.
- **Görseller kod ile çizildi.** Karakter ve binalar elle yazılmış SVG; ev, araba, ağaç ve iş yeri çizimleri Microsoft Fluent Emoji setinden (MIT lisansı, `assets/fluent/LICENSE`). Animasyonlar basit (nefes, göz kırpma, zıplama, bulut ve vapur). Profesyonel illüstrasyon, iskelet animasyonu ve ses yok.
- **Yazı tipleri çevrimiçi.** Fredoka ve Nunito, Google Fonts'tan yüklenir; çevrimdışıyken sistem yazı tipine düşer.
- **Denge ilk aşamada.** Ekonomi ve olay ağırlıkları bot simülasyonlarıyla ayarlandı, gerçek oyuncu testiyle değil. Örneğin riskli teklifleri kabul eden botlarda "suç" sonu hâlâ çok sık (yaklaşık üçte bir). Servet dağılımı da gerçek oyuncu verisiyle doğrulanmadı.
- **İçerik hacmi sınırlı.** 125 olay ve 11 boş zaman etkinliği var. Uzun hayatlarda gündelik olaylar tekrar etmeye başlar.
- **İl verisi karışık kaynaklı.** 81 ilin kira ve m² değerleri ilan fiyatıdır ve farklı raporlardan gelir (bkz. ECONOMY.md); Şırnak kirası tahmindir.
- **Yurt dışı tek şehir.** Yurt dışı yalnızca kurmaca bir Berlin; yabancı para birimi modellenmiyor (TL karşılığı çarpanlarla).
- **Eş ve çocukların kendi hayatları yok.** Bir "bağ" değeriyle ve dönemeç olaylarıyla temsil ediliyorlar; kendi meslekleri ya da gelirleri simüle edilmiyor (evlilikte ev giderinin yarısını eşin karşıladığı varsayılıyor).
- **Erişilebilirlik kısmi.** Ekran okuyucu ve klavye için temel etiketler var, ama ayrıntılı bir erişilebilirlik denetimi yapılmadı.
- **Kayıtlar yalnızca bu cihazda.** Bulut yedeği ya da cihazlar arası eşitleme yok.
