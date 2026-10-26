# Mobil Oyun Yayıncılığı: Mağaza Ücretleri, Para Akışı ve Türkiye Vergisi (Brifing)

> **Hazırlanma tarihi:** 26 Ekim 2026 · **Kimin için:** Türkiye'de yaşayan, tek başına çalışan bir geliştirici. Ücretsiz oyunlar yayınlayacak, gelir reklam (AdMob) ve uygulama içi satıştan gelecek, ileride abonelik de eklenebilir.
> **Yöntem:** Bilgiler web aramasıyla derlendi. Resmî Apple sayfaları ve Apple'ın sözleşme PDF'i doğrudan okundu. Google, GİB ve muhasebe sitelerinin çoğu bu ortamdan açılamadı; bu kaynaklardaki bilgiler arama özetlerinden alındı ve ilgili yerlerde belirtildi.
> **"doğrulanmalı"** etiketi: Bilgi tek kaynağa ya da ikincil kaynağa dayanıyor, kaynaklar çelişiyor veya kişisel duruma göre değişiyor. Bu noktalarda karar vermeden önce mali müşavire veya ilgili resmî sayfaya bakın.
> **Kur varsayımı:** 1 USD ≈ 49,6 TL (20–21 Ekim 2026, BloombergHT/hisse.net). TL karşılıkları yaklaşıktır.
> Bu belge genel bilgilendirme içindir, vergi danışmanlığı yerine geçmez.

---

## 0. Hızlı özet tablosu

| Kalem | Değer | Durum |
|---|---|---|
| Apple Developer Program | 99 USD/yıl. Türkiye'de ödeme yerel para birimiyle alınıyor; forumlarda 1.029 TL tahsilat bildirilmiş | TL tutarı doğrulanmalı |
| Google Play Console | 25 USD, tek seferlik | Kesin |
| AdMob hesabı | Ücretsiz. Ödeme eşiği 100 USD (TL raporlamada 200 TL), ödeme her ayın 21'i civarında | Kesin |
| Apple komisyonu | Standart %30. Small Business Program'da %15. Abonelikte 1 yıldan sonra %15 | Kesin |
| Google komisyonu | Yıllık ilk 1M USD için %15, aşan kısım için %30. Aboneliklerde ilk günden %15 | Türkiye için 2026'da geçerli (yeni tarife 2027'de gelebilir) |
| Apple ödemesi | Mali ay bitiminden sonra en geç 45 gün içinde (uygulamada ~33 gün). Türkiye eşiği 40 USD | Kesin |
| Google Play ödemesi | Her ayın 15'inde başlar. Eşik: yerel para biriminde 1 USD, USD havalede 100 USD | Kesin |
| Türk müşterisinden alınan KDV (%20) | Apple tahsil edip devlete öder. Google da öder (kaynaklara göre) | Apple kesin, Google doğrulanmalı |
| Dijital Hizmet Vergisi (DHV) | 2026'da %5 (eskiden %7,5). 2027'de %2,5 olacak. Apple bunu Türk satışlarında hasılattan düşüyor | Kesin |
| GVK mük. 20/B istisnası | 2025 sınırı 4.300.000 TL, 2026 sınırı 5.300.000 TL. Banka %15 stopaj keser | 2026 rakamı ikincil kaynaklı, doğrulanmalı |
| Bağ-Kur (2026 asgari) | Aylık 11.808 TL. Düzenli ödeyene 5 puan indirimle 10.157 TL | 20/B kapsamında zorunlu olup olmadığı doğrulanmalı |

---

## 1. Hesap maliyetleri

### 1.1 Apple Developer Program

| Konu | Bilgi | Kaynak |
|---|---|---|
| Ücret | "99 USD per membership year. Prices may vary by region and are listed in local currency during the enrollment process." | https://developer.apple.com/programs/enroll/ |
| Türkiye'deki TL tutarı | Apple'ın resmî bir TL fiyat listesi bulunamadı. Apple forumlarında Türkiye'den kayıt olan geliştiriciler **1.029 TL** tahsil edildiğini ve fatura kesildiğini yazıyor. Daha eski ve tarihsiz kaynaklarda 749 TL ve 649,99 TL (Developer uygulaması üzerinden) de geçiyor. **Doğrulanmalı:** Güncel tutar kayıt ekranında görünür. 99 USD bugünkü kurla yaklaşık 4.900 TL eder; yerel fiyat bundan çok daha düşük olabilir. | https://developer.apple.com/forums/thread/842153 , https://developer.apple.com/forums/thread/827387 , https://shiftdelete.net/?p=676268 |
| Türkiye'de ödeme sorunu | 2025–2026'da birçok geliştirici forumda kartla ödemenin reddedildiğini ya da para çekildiği halde üyeliğin aktifleşmediğini bildirmiş. Kayıt olurken Apple Developer Support'a yazmaya hazırlıklı olun. | https://developer.apple.com/forums/thread/842043 , https://developer.apple.com/forums/thread/809589 |
| Bireysel kayıt | İki adımlı doğrulamalı Apple Hesabı ve reşit olmak yeterli. **Yasal ad** kullanılmalı. Mağazada satıcı adı olarak **kendi adınız** görünür. D-U-N-S numarası gerekmez. | https://developer.apple.com/programs/enroll/ |
| Kurumsal kayıt | Sözleşme imzalayabilen bir tüzel kişilik olmalı. Apple, ticari unvan veya DBA (şahıs işletmesinin işletme adı gibi) kabul etmiyor. **D-U-N-S numarası zorunlu**. Ayrıca alan adlı e-posta ve çalışan bir web sitesi gerekiyor. Sonuç: Bir şahıs şirketi büyük olasılıkla bireysel olarak kaydolur; mağazada marka adı göstermek için genellikle **limited veya anonim şirket** gerekir (doğrulanmalı). | https://developer.apple.com/programs/enroll/ |

### 1.2 Google Play Console

| Konu | Bilgi | Kaynak |
|---|---|---|
| Ücret | **25 USD, tek seferlik**. Kredi veya banka kartıyla ödenir; ön ödemeli kart kabul edilmez. 18 yaş sınırı var. | https://support.google.com/googleplay/android-developer/answer/6112435 |
| Kimlik doğrulama | Yasal adınıza düzenlenmiş resmî kimlik ve kart istenebilir. Bilgiler geçersiz sayılırsa ücret iade edilmez. Kurumsal hesaplarda D-U-N-S zorunlu. | https://support.google.com/googleplay/android-developer/answer/6112435 , https://knowledge.zonal.co.uk/ordering/Content/Ordering/Blogs/Google-Developer-Verification.htm |
| **Kapalı test kuralı** | 13 Kasım 2023'ten sonra açılan **kişisel** hesaplar, üretime (production) çıkmadan önce kapalı test yapmak zorunda. Kural: **en az 12 testçi, son 14 gün boyunca kesintisiz kayıtlı**. Başta 20 testçiydi; Aralık 2024 civarında 12'ye düşürüldü. Bu süre dolmadan Production ve Pre-registration kapalı kalır, sonra Play Console'dan üretim erişimi başvurusu yapılır. Kurumsal hesaplar bu kuraldan muaf. Testçi sayısı 12'nin altına düşerse sayacın sıfırlandığı yorumu üçüncü taraf kaynaklara dayanıyor; güvenli olmak için 15–20 testçi önerilir (doğrulanmalı). | https://support.google.com/googleplay/android-developer/answer/14151465?hl=en , https://androidauthority.com/google-play-app-testing-requirement-3510580 , https://extendsclass.com/blog/google-plays-closed-testing-requirement-what-developers-need-to-know-in-2026 |
| Android geliştirici doğrulaması (2026) | Doğrulama 30 Eylül 2026'da ilk olarak Brezilya, Endonezya, Singapur ve Tayland'da başladı. Play Console'da kimliği doğrulanmış hesapların ayrıca işlem yapmasının gerekip gerekmediği ve doğrulamanın Türkiye'ye ne zaman geleceği doğrulanmalı. | https://android-developers.googleblog.com/2026/06/android-developer-verification.html |

### 1.3 AdMob

| Konu | Bilgi | Kaynak |
|---|---|---|
| Hesap ücreti | Ücretsiz | https://support.google.com/admob/answer/2772208 |
| Ödeme eşiği | Raporlama para birimine göre değişir: **USD için 100 USD**, Türk lirası raporlamada **200 TL** (Google'ın TR yardım tablosu). Eşiğe ulaşmayan bakiye sonraki aya devreder. | https://support.google.com/admob/answer/2772208?hl=tr |
| Ödeme zamanı | Ay sonunda kesinleşen bakiye eşiği aşar ve ödeme engeli yoksa ödeme **ayın 21'i civarında** yapılır. Havale, 20'sindeki bakiyeye göre 21'inde ya da sonraki ilk iş gününde başlatılır. | https://support.google.com/admob/answer/2772140 , https://support.google.com/admob/answer/3001017 |
| Ödeme yöntemleri | Çek, EFT, banka havalesi (wire), SEPA, Rapida. Hangilerinin açık olduğu ödeme adresinize bağlı. PayPal artık desteklenmiyor. Türkiye'de pratikte **banka havalesi (USD/TL)** kullanılıyor; tam liste doğrulanmalı. | https://support.google.com/admob/answer/2772140 |
| ABD vergi formu | AdMob'da Payments → Settings → Manage tax info (United States Tax Info) altından W-8BEN doldurulur. Eksik form ABD kaynaklı gelirde %24–30 stopaja yol açabilir (doğrulanmalı). | https://support.google.com/admob/answer/14135099?hl=en , https://keremerkan.net/posts/w-8ben-e-instructions-apple-google |

---

## 2. Komisyonlar (2025–2026 durumu)

### 2.1 Apple App Store (Türkiye'den yayıncı için standart koşullar)

| Durum | Komisyon | Kaynak |
|---|---|---|
| Standart (ücretli uygulama / IAP) | %30 | https://developer.apple.com/app-store/small-business-program/ |
| **Small Business Program (SBP)** | **%15**. Şart: Siz ve bağlı hesaplarınız önceki takvim yılında ve içinde bulunulan yılda **en fazla 1M USD proceeds** (komisyon ve vergiler düşülmüş net tutar) elde etmiş olmalısınız. Yeni geliştiriciler de katılabilir. **Başvuru gerekir**, otomatik değildir. İndirim, onayın verildiği mali ayın bitiminden 15 gün sonra başlar. Yıl içinde 1M USD aşılırsa sonraki satışlar standart orandan kesilir. | https://developer.apple.com/app-store/small-business-program/ |
| Abonelik, standart | İlk yıl %30, abone 1 yıl ödemeli hizmet doldurduktan sonra %15 | https://developer.apple.com/app-store/subscriptions/ |
| Abonelik, SBP üyesi | **İlk günden %15** ("you receive 85% … regardless of … one year of paid service") | https://developer.apple.com/app-store/subscriptions/ |
| %10 oranı | SBP sayfasına göre **AB alternatif koşullarındaki** SBP geliştiricileri ve "ilk yıldan sonraki abonelikler" %10 öder. Bu oran AB/DMA bağlamında; Türkiye standart koşulları için geçerli olmadığı varsayılmalı (doğrulanmalı). | https://developer.apple.com/app-store/small-business-program/ |

**2025–2026 değişiklikleri ve Türkiye'ye etkisi:**
- **ABD (Epic v. Apple):** Nisan 2025 kararı, ABD mağazasında dış ödeme bağlantısından komisyon alınmasını yasakladı. 9. Daire 11 Aralık 2025'te bu yasağı kaldırdı ve uygun komisyon oranının belirlenmesi için davayı geri gönderdi. Apple 2026'da Yüksek Mahkeme'ye başvurdu; dava sürüyor. **Bu yalnızca ABD mağazası** için geçerli. Türkiye mağazasında dış ödeme bağlantısı serbestisi yok. https://www.macrumors.com/2026/06/11/apple-fights-back-against-epic/ , https://digitalpolicyalert.org/event/39719-us-court-of-appeals-for-the-ninth-circuit-affirmed-contempt-finding-and-remanded-on-commission-rate-in-epic-games-v-apple
- **AB (DMA):** Apple, 1 Ocak 2026'dan itibaren AB'de tek bir iş modeline geçeceğini açıkladı. Bu modelde Core Technology Commission %5, mağaza hizmet ücreti %5 veya %13 (programlarda %10) ve ilk edinim ücreti %2. Bu koşullar **AB mağazaları** için geçerli. Türkiye AB'de değil; Türk geliştirici standart koşullarda kalabilir. Uygulamaya girip girmediği doğrulanmalı. https://mjtsai.com/blog/2025/06/27/eu-app-store-tiers-and-core-technology-commission/ , https://engadget.com/apps/apple-details-new-fee-structures-for-app-store-payments-in-the-eu-204253948.html
- Bu araştırmada Türkiye mağazası için bir komisyon değişikliği bulunamadı.

### 2.2 Google Play

| Durum | Komisyon | Kaynak |
|---|---|---|
| Dijital ürün/IAP | Her geliştiricinin **yıllık ilk 1M USD kazancı için %15**, aşan kısım için %30. Hesap takvim yılına göre yapılır. **Kayıt şart:** ödeme profili, hesap grubu (Account Group) ve %15 dilim şartlarının kabulü. Bağlı hesapların kazançları birlikte sayılır. | https://support.google.com/googleplay/android-developer/answer/10632485 , https://support.google.com/googleplay/android-developer/answer/112622 |
| Otomatik yenilenen abonelik | 1 Ocak 2022'den beri **ilk günden %15** | https://www.bleepingcomputer.com/news/google/google-cuts-play-store-dev-fees-to-15-percent-for-all-subscriptions/ , https://9to5google.com/2021/10/21/google-play-subscription-fee/ |

**Epic v. Google uzlaşması:** Mahkeme 4 Mart 2026'da onayladı. Yeni modelde yeni kurulumlardan gelen IAP için %20, abonelik için %10 alınıyor; Google Play Billing kullanılırsa isteğe bağlı +%5 ekleniyor; bazı programlarda yeni kurulumlar için %15 uygulanıyor. Geçiş takvimi: AEA, Birleşik Krallık ve ABD'de 30 Haziran 2026'ya kadar; Avustralya'da 30 Eylül 2026; Kore ve Japonya'da 31 Aralık 2026; **diğer bölgelerde (Türkiye dahil) 30 Eylül 2027'ye kadar**. Yani Türkiye'de 2026 boyunca büyük olasılıkla eski %15/%30 düzeni geçerli. Kaynaklar 9% dilimi ve ayrıntılar konusunda çelişiyor; kesin oranlar Google'ın resmî duyurusundan **doğrulanmalı**. https://gigazine.net/gsc_news/en/20260305-google-epic-settlement/ , https://stora.sh/blog/2026-03-31-google-play-fee-overhaul-epic-settlement-developer-guide , https://finance.yahoo.com/news/google-settles-epic-games-drops-200512326.html

> Not: Komisyon, KDV ve DHV düşüldükten sonra kalan tutar üzerinden hesaplanır (Apple'da "proceeds … based on the tax-exclusive price"). https://www.mactech.com/2020/09/02/apple-tells-developers-about-tax-price-changes-for-apps-in-app-purchases/amp/

---

## 3. Paranın akışı

### 3.1 Apple

| Konu | Bilgi | Kaynak |
|---|---|---|
| Kim satıyor? | Türkiye dahil birçok ülkede Apple, **Apple Distribution International Ltd. (İrlanda)** üzerinden geliştiricinin "commissionaire"i (kendi adına ama sizin hesabınıza satan aracı) olarak satış yapar. | Paid Apps Agreement Exhibit A (27 Ağu 2026): https://developer.apple.com/support/downloads/terms/exhibits/Exhibits-to-Schedule-2-and-3-English.pdf |
| Ödeme zamanı | Apple'ın resmî ifadesi: "within 45 days of the last day of the fiscal month". Apple'ın mali takvimi 4-4-5 haftalık; pratikte ödeme ay bitiminden **~33 gün** sonra geliyor (uygulamadaki gözlem). | https://developer.apple.com/help/app-store-connect/getting-paid/overview-of-receiving-payments |
| Eşik | Türkiye'deki bir banka (TRY, USD veya EUR hesap) Apple'ın tablosunda yok. Bu yüzden varsayılan eşik geçerli: **40 USD**. Eşiğin altındaki tutar sonraki aya devreder. | https://developer.apple.com/help/app-store-connect/reference/minimum-payment-threshold |
| Para birimi ve banka | Ödeme, App Store Connect'te kayıtlı **tek birincil hesaba** yapılır (bölünmüş ödeme yok). Apple'ın bankası tutarı hesabınızın para birimine çevirir (spot kur). Ödeme EFT veya havale ile gelir; aracı bankalar masraf kesebilir. Türk bankası için IBAN ve SWIFT/BIC gerekir. 20/B istisnası kullanılacaksa ödeme **istisna için açılan özel hesaba** yapılmalı (bkz. §4). | https://developer.apple.com/help/app-store-connect/getting-paid/overview-of-receiving-payments |
| Raporlar | Önceki mali ayın raporu, içinde bulunulan mali ayın ilk Cuma gününe kadar yayınlanır. | aynı |
| ABD vergi formu | Gerçek kişiler **W-8BEN**, şirketler W-8BEN-E doldurur. Form 3 yıl geçerli. Antlaşma indirimi için vergi kimlik numarası (TCKN/VKN) gerekir. Form doldurulmadan Paid Apps Agreement yürürlüğe girmez. | https://developer-mdn.apple.com/help/app-store-connect/provide-tax-information/provide-us-tax-information , https://apple.com/legal/procurement/docs/USTI.pdf |
| ABD stopajı | Apple forumlarında Apple Finance'tan aktarılan görüşe göre App Store satışları komisyon ilişkisi sayılıyor, royalty sayılmıyor. Bu yüzden ABD dışındaki geliştiricinin ABD satışlarından **genellikle stopaj kesilmiyor**. TR–ABD Çifte Vergilendirmeyi Önleme Anlaşması'nda royalty için üst sınır %10 (ekipman kirası için %5); ticari kazanç (Md. 7) ABD'de işyeri yoksa vergilenmez. W-8BEN'de hangi maddenin yazılacağı **doğrulanmalı** (mali müşavir). | https://developer.apple.com/forums/thread/29204 , https://gocodebook.com/library/us/federal/us-tax-treaty-turkey/article-12 , https://keremerkan.net/posts/w-8ben-e-instructions-apple-google |

### 3.2 Google Play

| Konu | Bilgi | Kaynak |
|---|---|---|
| Ödeme zamanı | Önceki ayın satışları için ödemeler **her ayın 15'inde başlatılır**. Hafta sonu veya tatile denk gelirse ilk iş gününe kayar. Elektronik transfer 2–3 iş günü, havale 5–7 iş günü sürer. | https://support.google.com/googleplay/android-developer/answer/137997 , https://support.google.com/paymentscenter/answer/7159355 |
| Eşik | Yerel para biriminde ödeme için **1 USD**, USD havale için **100 USD**. Türkiye'de TL ile yerel ödeme yapılıp yapılmadığı doğrulanmalı. | aynı |
| Ödeme profili | Play Console → Ayarlar → Ödeme profili (Google Payments merchant). Banka bilgisi (IBAN/SWIFT) ve vergi bilgisi (W-8BEN) buradan girilir. | https://support.google.com/googleplay/android-developer/answer/137997 |

### 3.3 AdMob
Ödeme ayın 21'i civarında yapılır; eşik 100 USD veya 200 TL (bkz. §1.3). Ödeme bilgileri değişecekse 21'inden önce değiştirilmeli. https://support.google.com/admob/answer/2772208?hl=tr

### 3.4 Türk müşterilerine satışta KDV ve Dijital Hizmet Vergisi

| Vergi | Kim tahsil ediyor? | Geliştiriciye etkisi | Kaynak |
|---|---|---|---|
| **KDV (%20)** | **Apple:** Paid Apps Agreement Exhibit B, Bölüm 1'de **"Türkiye"** yıldızsız olarak listeleniyor. Bu, Apple'ın vergiyi yerli geliştiriciler dahil herkes için **tahsil edip devlete ödediği** anlamına gelir. **Google:** Kaynaklar, Google'ın da 2018'den beri Türk son kullanıcıdan %20 KDV'yi tahsil edip ödediğini söylüyor (doğrulanmalı). | Mağaza fiyatı KDV dahildir. KDV, komisyondan **önce** düşülür; geliştirici bu KDV'yi ayrıca beyan etmez. | https://developer.apple.com/support/downloads/terms/exhibits/Exhibits-to-Schedule-2-and-3-English.pdf (27 Ağu 2026), https://support.google.com/googleplay/android-developer/answer/138000?hl=tr , https://smmmsendekatil.com/21/02/2026/mobil-uygulamalarin-app-store-ve-google-play-uzerinden-elde-edilen-gelirlerinin-vergilendirilmesi-senol-donder-smmm/ |
| **Dijital Hizmet Vergisi (DHV)** | Vergiyi platform öder (eşikler: Türkiye'de 20M TL ve dünyada 750M EUR üzeri hasılat). **Oran:** 2025 sonuna kadar %7,5; **1 Ocak 2026'dan itibaren %5**; **1 Ocak 2027'den itibaren %2,5** (Cumhurbaşkanı Kararı 10767, RG 25 Aralık 2025). | **Apple bu vergiyi hasılattan düşüyor.** Apple'ın 29 Ocak 2026 duyurusu: "Your proceeds … have been modified in: Türkiye: Digital sales tax (DST) rate decrease from 7.5% to 5%". Yani Türk müşterisine yapılan satışta DHV, proceeds'ten önce kesiliyor. Google'ın DHV'yi geliştiriciye yansıtıp yansıtmadığı doğrulanmalı. | https://developer.apple.com/news/ (29 Oca 2026 "Price updates…"), https://taxnews.ey.com/news/2026-0117-turkiye-revises-digital-service-tax-rate-for-2026-and-2027 , https://www.bloomberght.com/dijital-hizmet-vergisi-2026-dan-itibaren-yuzde-5-oraninda-uygulanacak-3764708 |

**Kaba örnek (Apple, Türk kullanıcı, SBP'de %15, 2026):** Fiyat 120 TL (KDV dahil) → KDV hariç tutar 100 TL → DHV ~%5 düşülür (yaklaşık 95 TL; Apple'ın DHV'yi tam olarak hangi tutar üzerinden hesapladığı doğrulanmalı) → %15 komisyon düşülür → elinize kabaca **~81 TL** kalır. Yurt dışı satışlarda o ülkenin KDV/GST'si düşülür (Apple Exhibit B'deki ülkelerde Apple öder).

---

## 4. Türkiye'de gelir vergisi

### 4.1 GVK mükerrer 20/B: "Sosyal içerik üreticiliği ve mobil uygulama geliştiriciliği kazanç istisnası"

| Konu | Bilgi | Kaynak |
|---|---|---|
| Kapsam | Akıllı telefon ve tablet için uygulama geliştiren **gerçek kişilerin**, **elektronik uygulama paylaşım ve satış platformları** üzerinden elde ettiği kazançlar. GİB rehberinde sayılanlar: **ücretli uygulama satışı, reklam geliri, uygulama içi satış, sponsorluk, ücretli abonelik**. Platform dışından gelen gelir kapsam dışı. Masaüstü ve web (SaaS) yazılımları kapsam dışı. Şirketler (kurumlar vergisi mükellefleri) ve adi ortaklıklar yararlanamaz. | GİB rehberi (2025): https://cdn.gib.gov.tr/api/gibportal-file/file/getFileResources?objectKey=arsiv%2Fonceki-dokumanlar%2F2025_sosyal_icerik.pdf (arama özeti), https://www.muhasebetr.com/yazarlarimiz/vedaterdem/0160/ , https://www.gib.gov.tr/mevzuat/kanun/433/ozelge/38895 |
| Yürürlük | 7338 s. Kanun ile 2022'de geldi; 325 Seri No. Tebliğ (RG 26.09.2024) ile kapsam genişletildi ve **1.1.2024'ten itibaren** elde edilen kazançlara uygulanıyor. | https://tr.andersen.com/tr/images/pdf/and_47-gelir-vergisi-gt%20325-duzenlemeleri.pdf |
| Şartlar | 1) Türkiye'de kurulu bir bankada bu faaliyete özel hesap açmak (örnek: Ziraat "Sosyal Mobil Uygulama Üretim Hesabı"). 2) Bu faaliyetten gelen **tüm** hasılatı yalnızca bu hesaptan tahsil etmek. Başka hesaba gelen tek bir ödemenin bile istisnayı düşürebileceği belirtiliyor. 3) Vergi dairesinden "**İstisna Belgesi**" almak. | https://www.ziraatbank.com.tr/tr/bireysel/mevduat/vadesiz-hesaplar/vadesiz-tl-mevduat-hesabi/sosyal-mobil-uygulama-uretim-hesabi , https://hukukcularevi.com/internetten-sosyal-medyadan-kazananlarin-vergisi-icerik-ureticisi-istisnasi/ , https://www.muhasebenews.com/169370-2/ |
| Stopaj | Banka, hesaba gelen tutardan **%15 gelir vergisi tevkifatı** keser. Sınır aşılmadıkça bu **nihai vergidir**; beyanname verilmez. | https://www.alomaliye.com/2025/02/03/sosyal-icerik-ureticiligi-kazanc-istisnasi-rehberi-2/ |
| **Yıllık sınır** | GVK 103'teki tarifenin **4. gelir dilimi tutarı** kadar. **2024: 3.000.000 TL · 2025: 4.300.000 TL · 2026: 5.300.000 TL** (2026 rakamı 332 Seri No. GVGT tarifesiyle uyumlu; GİB'in 2026 rehberinden doğrulanmalı). 5,3M TL ≈ 107.000 USD eder. | https://www.muhasebetr.com/yazarlarimiz/vedaterdem/0160/ , https://www.forbes.com.tr/ekonomi/2026-yili-gelir-vergisi-tarifesi-ve-istisna-tutarlari-belirlendi |
| Sınır aşılırsa | "**Ya hepsi ya hiç**": O yılın **tüm** kazancı genel hükümlere göre (ticari kazanç olarak) yıllık beyannameyle beyan edilir. Bankanın kestiği %15, hesaplanan vergiden mahsup edilir. Pratikte sınıra yaklaşırken şahıs veya limited şirkete geçilir. | https://hukukcularevi.com/internetten-sosyal-medyadan-kazananlarin-vergisi-icerik-ureticisi-istisnasi/ |
| Apple/Google gelirleri | App Store ve Google Play, açıkça "uygulama paylaşım ve satış platformu" sayılıyor. Bu yüzden IAP, ücretli uygulama ve abonelik gelirleri kapsamda. | aynı + GİB rehberi |
| **AdMob reklam geliri** | Rehberde "platformlar üzerinden elde edilen reklam geliri" kapsamda sayılıyor. Bazı vergi rehberleri (Vergi Merkezi) AdMob, Unity Ads ve IronSource gelirini kapsamda sayıyor. Başka bir uzman ise AdMob'un "otomatik olarak" kapsamda olmadığını, ayrıca analiz edilmesi gerektiğini söylüyor. Bir 2026 özelgesi, yurt dışı merkezli bir web sitesinden alınan oyun gelirini platform şartını karşılamadığı için kapsam dışı saydı. **AdMob için doğrudan bir özelge bulunamadı: doğrulanmalı** (özelge başvurusu önerilir). | https://vergimerkezi.com.tr/mobile-app-developer-vergi-rehberi/ , https://evrenozmen.com.tr/app-store-google-play-admob-gelirleri-vergi , https://www.bundle.app/tr/gundem/yurt-ds-merkezli-siteye-yuklenen-oyun-yazlm-geliri-mukerrer-20b-istisnas-var-m-CC6F3BF3-87B6-4113-9CEA-FD2D5F197296 |
| KDV | 20/B kapsamındaki teslim ve hizmetler **KDV'den istisna** (KDVK 17/4-a, 1.1.2022'den itibaren). | https://webrazzi.com/2021/12/22/sosyal-icerik-ureticileri-ve-mobil-uygulama-gelistiricilerine-kdv-istisnasi/ |
| Başka gelir | Maaş gibi başka gelirlerinizin olması istisnadan yararlanmanıza engel değil. | https://www.alomaliye.com/2025/02/03/sosyal-icerik-ureticiligi-kazanc-istisnasi-rehberi-2/ |
| **Bağ-Kur** | **Kaynaklar çelişiyor, doğrulanmalı.** Bir görüşe göre istisna belgesi alanlar 4/b (Bağ-Kur) kapsamına girer. Başka bir görüşe göre giriş zorunlu değildir. Mart 2025 tarihli bir dilekçe, istisna başvurusunda otomatik 4/b başlatıldığından şikâyet ediyor. 4/a'lı (maaşlı) çalışıyorsanız 4/a öncelikli olur ve ayrıca Bağ-Kur primi doğmaz. 2026 Bağ-Kur primi aylık en az **11.808,23 TL** (%35,75); düzenli ödeyene 5 puan indirimle **10.156,73 TL**. | https://www.ekonomim.com/kose-yazisi/sosyal-medya-icerik-ureticilerine-bag-kur-soku/841509 , https://evrenozmen.com.tr/sosyal-icerik-ureticiligi-bagkur-muafiyeti-2025 , https://docs.google.com/document/d/1afasMXaiXWV3v-2RfuK8s0I0rKHOc5_X/export?format=pdf , https://vergimerkezi.com.tr/2026-bagkur-primi-ne-kadar/ |

### 4.2 2026 gelir vergisi tarifesi (GVK 103, ücret dışı gelirler)
332 Seri No. GVGT, RG 31.12.2025 (5. mükerrer)

| Gelir dilimi | Oran |
|---|---|
| 0 – 190.000 TL | %15 |
| 190.000 – 400.000 TL | %20 |
| 400.000 – 1.000.000 TL (ücretlilerde 1.500.000 TL'ye kadar) | %27 |
| 1.000.000 – 5.300.000 TL | %35 |
| 5.300.000 TL üzeri | %40 |

Kaynak: https://www.bloomberght.com/2026-da-uygulanacak-gelir-vergisi-tarifeleri-belli-oldu-3765170 , https://www.pwc.com.tr/tr/hizmetlerimiz/vergi/bultenler/2026/2026-yili-bazi-gelir-vergisi-rakamlari.html
(2025 tarifesinde 4. dilim üst sınırı 4.300.000 TL idi.)

### 4.3 Seçeneklerin karşılaştırması

| | **20/B istisnası** | **Şahıs şirketi** | **Limited şirket** |
|---|---|---|---|
| Vergi | Hasılattan %15 stopaj, nihai (gider düşülmez) | Kazanç üzerinden %15–40 artan oranlı tarife | Kurumlar vergisi %25 + kâr dağıtımında %15 stopaj |
| Defter ve muhasebe | Yok | Vergi levhası, işletme veya bilanço defteri, e-fatura/e-arşiv, KDV ve geçici vergi beyanları. 2026 SMMM asgari tarifesinde aylık defter tutma 515 TL ile 11.734 TL arasında (sınıfa göre). İstanbul piyasası genelde daha yüksek (doğrulanmalı). | Bilanço esası. Kuruluş için SMMM ücreti 14.597 TL'ye kadar; ayrıca noter, ticaret sicili ve sermaye masrafları var. Muhasebe şahıs şirketinden pahalı. |
| Bağ-Kur | Doğrulanmalı (bkz. yukarı) | Zorunlu (4/b), 2026'da aylık ≥10.157–11.808 TL | Ortak-müdür için 4/b zorunlu |
| Apple'da satıcı adı | Kendi adınız | Kendi adınız (Apple DBA kabul etmiyor) | Şirket adı (D-U-N-S gerekir) |
| Avantaj | En basit ve en ucuz seçenek. Sınır altında efektif vergi %15. | Giderler (cihaz, yazılım, reklam) düşülür. Genç girişimci istisnası (29 yaş altı, ilk kez mükellef olanlara 3 yıl boyunca yıllık **400.000 TL**; bir kaynak 430.000 TL diyor, doğrulanmalı). **Not:** Genç girişimciye 1 yıllık Bağ-Kur prim desteği 1.1.2026'da kaldırıldı. | Büyük gelirde ve markalaşmada uygun. Hizmet ihracatı indirimi geçerli (bkz. aşağı). |

Kaynaklar: https://www.capital.com.tr/haberler/tum-haberler/serbest-muhasebecilikte-2026-yili-asgari-ucret-tarifesi-aciklandi , https://www.haberturk.com/2026-yilinda-genc-girisimci-tesviki-ne-kadar-3856269-ekonomi , https://hukukcularevi.com/genc-girisimci-kazanc-istisnasi-29-yas-alti-yeni-is-kuranlara-vergi-muafiyeti/

**Hizmet ihracatı (şirketli yapıda) — önemli uyarı:**
- **Kazanç indirimi:** GVK 89/13 ve KVK 10/1-ğ kapsamındaki münhasır yurt dışı hizmet kazancı indirimi %80'di. 11257 s. Cumhurbaşkanı Kararı (RG 30.04.2026) bunu **%100'e** çıkardı; 2026 kazançlarına uygulanıyor. Şart: Bedelin beyanname tarihine kadar Türkiye'ye getirilmesi. https://kpmgvergi.com/blog/munhasir-hizmetlere-saglanan-indirim-orani-100-e-cikarildi/1391 , https://uzmanpara.milliyet.com.tr/uzmanpara/resmi-gazetede-yayimlandi-vergi-istisnasi-ve-tesviklerde-kapsam-genisledi-7579525
- **Ancak** İstanbul Vergi Dairesi Başkanlığı'nın **30.01.2026 tarih ve 62030549-125-143061 sayılı özelgesine** göre, App Store ve Google Play'de yayınlanan mobil oyun ve yapay zekâ uygulamaları **hem yurt içinde hem yurt dışında** kullanılıyorsa bu hizmet **"münhasıran yurt dışına" verilmiş sayılmaz**. Sonuç olarak **KDV ihracat istisnası (KDVK 11/1-a) ve kazanç indirimi uygulanamaz**; genel hükümlere göre KDV hesaplanır. Oyunu yalnızca yurt dışı mağazalarda yayınlamak bu sonucu değiştirebilir. Özelge yalnızca başvuran mükellefi bağlar, ama idarenin bakışını gösterir. https://www.alomaliye.com/2026/02/18/app-store-ve-google-playden-elde-edilen-gelirler-nasil-vergilendirilir/ , https://www.pwc.com.tr/tr/Hizmetlerimiz/vergi/vergi-bultenleri/2026/yeni-gelir-idaresi-ozelgeleri-2026-2.pdf , https://www.ekonomigazetesi.com/kose-yazisi/hizmet-ihracatinda-100-indirim-sira-munhasiran-cikmazinda-78578
- **Pratik sonuç:** Gelir 5,3M TL'nin altındaysa 20/B istisnası en sade ve çoğu zaman en ucuz yol. Sınıra yaklaşıldığında veya giderler yüksekse mali müşavirle şahıs ya da limited şirket karşılaştırması yapılmalı.

---

## 5. Aboneliklere özel notlar

| Konu | Apple | Google Play |
|---|---|---|
| Komisyon | Standart: ilk yıl %30, 1 yıl ödemeli hizmetten sonra %15. **SBP üyesi: ilk günden %15.** | %15, ilk günden (Türkiye'de 2027'ye kadar; uzlaşma sonrası %10 olabilir, doğrulanmalı) |
| 1 yıl sayacı | Ücretsiz deneme ve yenileme uzatma günleri sayılmaz. İndirimli ücretli teklifler sayılır. Sayaç abonelik grubuna göre tutulur; aynı grupta paket yükseltme veya düşürme sayacı bozmaz. İptal veya ödeme sorunundan sonra **60 gün içinde** yenilenirse sayaç kaldığı yerden devam eder; 60 günden sonra sıfırlanır. | 1 yıl kuralı yok |
| Ödeme sorunu | Apple 60 gün boyunca ödemeyi yeniden dener. Billing Grace Period (3, 16 veya 28 gün) açılırsa kesintisiz gelir sağlanır. | Play'de grace period ve hesap askıya alma ayarları var (ayrıntılar doğrulanmalı) |
| İadeler | İadeler ve ters ibrazlar, sonraki mali ayın proceeds tutarından düşülür (ilgili satış raporlarda eksi kalem olarak görünür). | İade edilen işlem ödeme raporunda eksi kalem olarak görünür ve sonraki ödemeden düşülür. |

Kaynak: https://developer.apple.com/app-store/subscriptions/ , https://www.bleepingcomputer.com/news/google/google-cuts-play-store-dev-fees-to-15-percent-for-all-subscriptions/ . İadelerin mahsup mekanizması genel uygulamaya dayanıyor; ayrıntılar doğrulanmalı.

---

## 6. Birden fazla oyun ("koleksiyon")

- **Apple:** Tek bir Developer Program üyeliği ile **sınırsız sayıda uygulama** yayınlanabilir; 99 USD yıllık ücret hesap başınadır. SBP'deki 1M USD sınırı, bağlı hesaplar dahil **tüm uygulamaların toplamına** uygulanır. https://developer.apple.com/app-store/small-business-program/
- **Google Play:** 25 USD tek hesap ile sınırsız uygulama yayınlanabilir. Ancak **kapalı test kuralı (12 testçi × 14 gün) her yeni uygulama için ayrı ayrı** uygulanır (kişisel hesap). Aynı testçi grubu yeniden kullanılabilir. %15 dilimindeki 1M USD hesap grubu genelinde toplanır. https://support.google.com/googleplay/android-developer/answer/14151465 , https://support.google.com/googleplay/android-developer/answer/10632485
- **AdMob:** Tek AdMob hesabına birden fazla uygulama ve reklam birimi eklenebilir; ödeme tek bakiyeden yapılır. Google, kişi başına tek bir AdSense/AdMob yayıncı hesabına izin veriyor; ikinci hesap açmayın (genel politika bilgisi, doğrulanmalı).
- **Yayıncı adı ipuçları:**
  - Apple bireysel hesapta satıcı adı **yasal adınızdır** ve değiştirilemez. Marka adı ("X Games") göstermek için D-U-N-S'li tüzel kişilik gerekir. Uygulama adı ve ikonu ile istediğiniz markayı kullanabilirsiniz.
  - Google Play'de **geliştirici adı** kişisel hesapta da serbestçe seçilebilir (örneğin stüdyo adı). Doğrulamada yasal ad ayrıca kaydedilir ve kişisel hesaplarda bazı iletişim bilgileri herkese açık olabilir (doğrulanmalı).
  - Tüm oyunlarda aynı stüdyo adını, web sitesini (gizlilik politikası URL'si için gerekli) ve destek e-postasını kullanmak, çapraz tanıtım ve güven açısından avantaj sağlar.
  - Hesabı ileride şirkete taşımak mümkün: Apple'da bireysel hesaptan kuruluş hesabına geçiş, Google'da uygulama transferi var (genel bilgi, doğrulanmalı). Bu süreç zaman alır; baştan karar vermek daha iyi.

---

## 7. Yapılacaklar listesi (öneri)
1. Bir Türk bankasında 20/B için özel hesap açın; USD veya EUR alt hesabı olup olmadığını sorun. Vergi dairesinden İstisna Belgesi alın.
2. Apple'a bireysel kayıt olun (yaklaşık 1.029 TL veya 99 USD). Hemen **Small Business Program'a başvurun**. W-8BEN doldurun ve banka bilgisi olarak özel hesabın IBAN/SWIFT bilgisini girin.
3. Google Play'e kayıt olun (25 USD). Kimliğinizi doğrulayın. **%15 dilimine kaydolun** (Account Group). 15–20 kişilik bir testçi havuzu kurun.
4. AdMob hesabı açın, W-8BEN doldurun ve ödemelerin aynı özel hesaba gelmesini sağlayın. AdMob'un 20/B kapsamında olup olmadığını mali müşavire veya özelge yoluyla netleştirin.
5. Yıllık hasılatı takip edin (2026 sınırı 5,3M TL). Sınıra yaklaşınca şirket yapısını değerlendirin.
6. Bağ-Kur durumunu SGK veya mali müşavirle netleştirin.
