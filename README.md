# Hayat Simülatörü — oynanabilir web prototipi

Telefonda dikey ekranda oynanan, Türkçe bir yaşam simülasyonu. Oyuncu adını, soyadını, doğduğu ili (81 il), cinsiyetini (kadın/erkek), ten ve saç rengini, saç modelini seçer; 18 yaşında, cebinde 10.000 TL ile başlar. Her ana karar bir haftayı ilerletir; kararlar arasında boş zamanında etkinlikler yapar. Karakter evinin içinde (salon, yatak odası, mutfak, garaj) ya da iş yerinde, animasyon filmi tarzında çizilmiş 2D bir sahnede görünür; sahneler arasında tek dokunuşla geçilir. Oyun tarayıcıda çalışır; derleme adımı ya da harici oyun motoru yoktur.

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
- **Karakter motoru.** Karakter seçimlere göre kodla üretilir (hazır resim yok): yumuşak gölgeli yüz, büyük parlak gözler (4 göz rengi), yanak allığı, ışık alan saç tutamları, kumaşta hacim gölgesi. 6 saç modeli (kısa, uzun, kıvırcık, topuz, örgü, kazınmış), 5 saç rengi, 4 ten rengi, 16 kıyafet. Kilo arttıkça yüz ve beden dolgunlaşır (gıdı dahil), kas arttıkça omuz ve kollar genişler; yaşla çene hattı oturur, alında ve göz kenarında çizgiler, göz altı torbası ve lekeler belirir, saç ağarır, erkekte seyrelebilir.
- **Ev içi sahneler.** Salon, yatak odası, mutfak, garaj (apartmanda otopark), iş yeri (ya da okul) ve sokak. Her evin duvar rengi, parkesi, kanepesi, perdesi, tabloları, lambaları ve süsleri o eve özgü bir tohumdan seçilir; taşınınca oda da değişir, aynı evde hep aynı kalır. Evin türü eşyaları belirler: aile evinde tüplü televizyon, kilim, duvar saati, nazar boncuğu, çinili mutfak fayansı, iki katlı çaydanlık ve kahvaltı sofrası; paylaşımlı evde puf, posterler, taşınma kolileri ve ışık zinciri; müstakil evde şömine; villada boydan cam, deniz manzarası ve avize; yurt dışında kalorifer. Pencereden mevsime, ile (deniz, Boğaz köprüsü, cami, şehir silueti) ve ev türüne göre manzara görünür. Garajda karakterin arabası durur. İş yerleri mesleğe göre çizilir: ofis, kafe (menüdeki fiyatlar enflasyonla artar), fabrika, sınıf, hastane, dükkân, devlet dairesi (sıra numaratörü), sahne; arka planda iş arkadaşları vardır.
- **Sabah işe gidiş.** Ayda bir sabah evden iş yerine (arabayla, scooterla ya da otobüsle) gidiş animasyonu oynar; ayarlardan kapatılabilir.
- **Ayarlar ve ses.** Müzik (tarayıcıda üretilen, makam tınılı hafif oyun müziği), ses efektleri (tuş, kazanma, kaybetme, para, zar, başarım), titreşim, ses düzeyi, işe gidiş animasyonu ve yazı boyutu ayarlanır. Kayıtlar kopyala-yapıştır kodla başka cihaza taşınabilir. "Hesabını bağla" düğmesi mağaza sürümü için yer tutucudur.
- **Yer değiştirme ve göç.** 81 il arasında taşınmak nakliye (mesafeye göre), kira depozitosu, emlakçı komisyonu ve ilk kira gerektirir; Türkiye haritasında il seçilip masraf dökümü görülür. Yurt dışına göç Almanya, Hollanda, İngiltere, Kanada ve ABD için gerçekçi bir vize dosyasıyla yapılır: pasaport harcı, tercüme ve noter, adli sicil, sigorta, bloke hesap, dil sınavı ve iş teklifi gibi evraklar haftalar sürer ve ücretlidir; randevu beklenir, mülakat olur, sonuç belirsizdir (ABD'de kura). Schengen vizesiyle tatil yapılabilir.
- **Beceriler ve kariyer basamakları.** Her mesleğin 5 basamaklı bir merdiveni ve basamak için gereken becerileri var. Beceriler çalışarak, kendi kendine çalışarak ya da ücretli kurslarla artar; mesleğe ait beceri kategorileri o alana girilince açılır, ileri basamaklar "???" olarak gizlidir.
- **Şirketler.** 22 kurmaca şirketin puanlı "en iyi işverenler" sıralaması var. Üst sıradaki şirketlerde mülakat daha çok aşamalı ve zordur (vaka çalışması gibi ek görevler). Şirket başka bir şubeye tayin teklif edebilir, mobbing yaşanabilir, ikramiye ve performans zammı gelir, başka şirketten teklif (headhunter) çıkabilir.
- **Yatırım ve bahis.** Altın, döviz, endeks fonu, hisse ve kripto alınıp satılır; riskli araçlarda her ay %30 kazanç, %70 kayıp ihtimali var. Kurmaca yasal bahis bayisinde dört kupon türü oynanır; çok oynayınca bağımlılık olayı çıkar.
- **Beden.** Boy, kilo, beden kitle indeksi ve kas oranı tutulur. Koşu, spor salonu, diyet, fast food, iş türü, stres ve araba kullanmak kiloyu etkiler; sahnede beden değişir.
- **Mülk, vergi ve ehliyet.** Başka illerde yatırım amaçlı ev alınıp kiraya verilebilir. Emlak vergisi, DASK, MTV, trafik sigortası, isteğe bağlı kasko ve özel sağlık sigortası her yıl ödenir. Motorlu araç için ehliyet gerekir (kurs, e-sınav, direksiyon sınavı). Erkek karakterde askerlik (yapma, bedelli, tecil) var.
- **Müzisyen.** Şöhret, dinlenme geliri, plak anlaşması ve Türkiye, Avrupa ve dünya turneleri var; gezilen il ve ülkeler haritada işaretlenir.
- **Başarımlar ve grafik.** 29 başarım ve yıllık net değer grafiği var; ikisi anı defterinde de görünür. Her hafta için gelir-gider dökümü tutulur.
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

Tarayıcı testi şunları dener: karakter oluşturma, 60 hafta oynama, oda değiştirme, altı sekme, berber, kıyafet alıp giyme, araba alıp garajda görme, hisse alma, bahis, şirket başvurusu, harita ve il seçimi, pasaport, vize dosyası, kurs, ayarlar, boş zaman etkinliği, sayfayı yenileyip kayıttan devam etme (yarım kalan olay korunmalı), çocuğa elle isim verme, ikinci hayat açıp hayatlar arasında geçme, hayatı sonlandırma, anı defteri ve dar ekranlarda yatay taşma olmaması.

## Neler hâlâ prototip

- **Mağaza sürümü yok.** iOS ya da Android uygulama kabuğu (ör. Capacitor), imzalama, mağaza ekran görüntüleri, yaş derecelendirmesi ve mağaza gizlilik beyanı yapılmadı. Bkz. [APP_STORE.md](APP_STORE.md).
- **Gerçek cihaz testi yapılmadı.** Mobil düzen, Chromium'un mobil emülasyonunda (320, 360 ve 390 px) test edildi; gerçek iPhone/Android Safari ve Chrome'da denenmedi.
- **Görseller kod ile çizildi.** Karakter ve odalar kodla üretilen SVG'dir; animasyon filmi görünümüne yaklaşır ama gerçek 3D render değildir. Araba, bitki, kedi gibi bazı küçük çizimler Microsoft Fluent Emoji setinden (MIT lisansı, `assets/fluent/LICENSE`). Animasyonlar basit (nefes, göz kırpma, zıplama, şömine, bulut). Profesyonel illüstratör işi ve iskelet animasyonu yok; karakter her zaman önden durur.
- **Ses tarayıcıda üretilir.** Müzik ve efektler kayıtlı ses dosyası değil, Web Audio ile üretilir; iPhone tarayıcısında titreşim desteklenmez.
- **Yazı tipleri çevrimiçi.** Fredoka ve Nunito, Google Fonts'tan yüklenir; çevrimdışıyken sistem yazı tipine düşer.
- **Denge ilk aşamada.** Ekonomi ve olay ağırlıkları bot simülasyonlarıyla ayarlandı, gerçek oyuncu testiyle değil. Örneğin riskli teklifleri kabul eden botlarda "suç" sonu hâlâ çok sık (yaklaşık üçte bir). Servet dağılımı da gerçek oyuncu verisiyle doğrulanmadı.
- **İçerik hacmi sınırlı.** 125 olay ve 11 boş zaman etkinliği var. Uzun hayatlarda gündelik olaylar tekrar etmeye başlar.
- **İl verisi karışık kaynaklı.** 81 ilin kira ve m² değerleri ilan fiyatıdır ve farklı raporlardan gelir (bkz. ECONOMY.md); Şırnak kirası tahmindir.
- **Yurt dışı beş ülke.** Her ülkede tek şehir var; döviz kuru 2026 değerinde sabit, maaşlar TL karşılığı çarpanlarla hesaplanır.
- **Eş ve çocukların kendi hayatları yok.** Bir "bağ" değeriyle ve dönemeç olaylarıyla temsil ediliyorlar; kendi meslekleri ya da gelirleri simüle edilmiyor (evlilikte ev giderinin yarısını eşin karşıladığı varsayılıyor).
- **Erişilebilirlik kısmi.** Ekran okuyucu ve klavye için temel etiketler var, ama ayrıntılı bir erişilebilirlik denetimi yapılmadı.
- **Kayıtlar yalnızca bu cihazda.** Bulut yedeği ya da hesap bağlama yok; cihazlar arası taşıma yalnızca kopyala-yapıştır kodla yapılır.
