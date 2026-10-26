# Mağaza rehberi: önce App Store, sonra Google Play

Bu rehber oyunu iki mağazaya çıkarmak için yapılacak her şeyi sırayla anlatır.

**Hesaplar:** Apple Developer'a kendi Apple kimliğinle, Play Console ve AdMob'a kendi Gmail hesabınla kaydol. Hesap bilgileri bu depoya yazılmaz; bu depo herkese açık. Kod tarafı hazır:
- İmzalı derleyip yükleyen iki iş akışı var (ikisi de yalnızca elle başlatılır).
- Gizlilik dosyaları, mağaza metinleri, ekran görüntüleri ve başarım listesi hazır.

Senin yapacakların hesap açmak, gizli anahtarları GitHub'a girmek ve mağaza formlarını doldurmak.

| | App Store | Google Play |
|---|---|---|
| Geliştirici hesabı | Apple Developer Program, **yıllık 99 USD** | Google Play Console, **tek seferlik 25 USD** |
| Hesap onayı | Bireysel: 1-2 gün. Şirket: D-U-N-S numarası gerekir, 1-2 hafta | Kimlik doğrulaması: birkaç gün |
| Derleme | `.github/workflows/ios-appstore.yml` → TestFlight'a yükler | `.github/workflows/android-play.yml` → `.aab` + `.apk` üretir |
| İnceleme süresi | Genellikle 24-48 saat | İlk sürümde birkaç gün, sonra saatler |
| Ek kural | — | Yeni kişisel hesapta **12 testçiyle 14 gün kapalı test** zorunlu |

---

## 1. App Store

### 1.1 Hesap
1. https://developer.apple.com/programs/enroll/ adresinden Apple kimliğinle (iki adımlı doğrulama açık olmalı) **Bireysel** üyeliğe başvur ve 99 USD öde.
2. Onay e-postası gelince https://appstoreconnect.apple.com açılır.
3. App Store Connect › **Agreements, Tax, and Banking**: ücretsiz uygulama için "Free Apps" sözleşmesi otomatik gelir. Ücretli olmayacağı için banka bilgisi gerekmez. Yine de vergi formunu (W-8BEN) doldurmak iyi olur.

### 1.2 Uygulama kimliği ve yetenekler
1. developer.apple.com › Certificates, IDs & Profiles › **Identifiers** › "+" › App IDs › App.
2. Bundle ID: **com.hayatsimulatoru.oyun** (Explicit). Description: Hayat Simulatoru.
3. Capabilities listesinden **Game Center** ve **iCloud** seçeneklerini işaretle. iCloud için "Include CloudKit support" seçmeden **iCloud Documents** yeterli.
4. Identifiers › iCloud Containers › "+" › **iCloud.com.hayatsimulatoru.oyun** oluştur. Sonra App ID'nin iCloud ayarında bu kapsayıcıyı seç.

### 1.3 App Store Connect'te uygulamayı aç
1. Apps › "+" › New App. Platform: iOS, ad: `store/app-store.md`'deki ad, dil: Türkçe, Bundle ID: com.hayatsimulatoru.oyun, SKU: hayatsim-001.
2. Ad başka biri tarafından alınmışsa `store/app-store.md`'deki yedek adlardan birini dene.

### 1.4 GitHub'a anahtarları gir (bir kez)
1. App Store Connect › Users and Access › **Integrations** › App Store Connect API › "Generate API Key".
   - Ad: GitHub, erişim: **Admin**. Admin gerekiyor çünkü bulut imzalama sertifika ve profil oluşturuyor.
2. `.p8` dosyasını indir (yalnızca bir kez indirilebilir), **Key ID**'yi ve sayfanın üstündeki **Issuer ID**'yi not al.
3. Team ID: developer.apple.com › Membership details › Team ID (10 karakter).
4. GitHub › LifeSimulator deposu › Settings › Secrets and variables › Actions › "New repository secret" ile şunları ekle:
   - `APPLE_TEAM_ID`
   - `ASC_KEY_ID`
   - `ASC_ISSUER_ID`
   - `ASC_KEY_P8`: `.p8` dosyasını not defteriyle aç, içeriğin tamamını yapıştır.

### 1.5 Derle ve yükle
1. Önce bu dalı `main`e birleştir. Bu, gizlilik bağlantısının çalışması için gerekli.
2. GitHub › Actions › **iOS App Store (TestFlight)** › Run workflow. Yaklaşık 15-25 dakika sürer.
3. Bitince App Store Connect › TestFlight'ta derleme 10-30 dakikada "Ready to Test" olur.
4. TestFlight › Internal Testing › kendini ve eşini ekle. Telefona **TestFlight** uygulamasını kur; oyun oradan kurulur ve 90 gün geçerli kalır.
5. Her yeni sürümde `package.json`'daki `version` artırılır (ör. 1.0.1). Derleme numarası otomatik artar.

### 1.6 Game Center
1. App Store Connect › uygulama › **Services** › **Game Center**:
   - Leaderboard: kimlik **hs_networth**, ad "En yüksek servet", "High score is better", biçim Integer.
   - Achievements: `store/achievements.md` tablosundaki 29 başarım. Kimlikler `hs_` ile başlar.
2. Sürüm sayfasında "Game Center" kutusunu işaretleyip bu başarımları sürüme ekle.

### 1.7 Sürüm sayfası ve incelemeye gönderme
1. `store/app-store.md`'deki metinleri ilgili kutulara yapıştır.
2. Ekran görüntüleri: `store/screenshots/ios/`.
3. **App Privacy** › "Data Not Collected".
4. **Age Rating** anketini `STORE-COMPLIANCE.md` › bölüm 4'e göre doldur (sonuç 18+).
5. Build bölümünden TestFlight'taki derlemeyi seç. "Export compliance" sorusu otomatik geçer, çünkü `ITSAppUsesNonExemptEncryption = NO`.
6. **Add for Review** › **Submit**. Cevap genellikle 1-2 gün içinde gelir.

### 1.8 Sık ret nedenleri ve cevapları
- **4.2 Minimum işlevsellik ("web sitesi sarmalayıcı"):** Oyun tamamen yerel ve çevrimdışı çalışıyor; içinde web sitesi açılmıyor. Ret gelirse bunu ve Game Center entegrasyonunu not olarak yaz.
- **2.1 Eksik özellik:** Hesap bağlama düğmesi gerçekten çalışmalı, yani Game Center 1.6'daki gibi kurulmuş olmalı.
- **5.3 Kumar:** Gerçek para yok. Yaş derecelendirmesi doğru doldurulmalı.
- **2.3.7 Anahtar kelime:** Başka oyun adı yazma.

---

## 2. Google Play

### 2.1 Hesap
1. https://play.google.com/console › hesap türü **Kişisel** (ya da şirket) › 25 USD.
2. Kimlik doğrulaması ve Android cihaz doğrulaması (Play Console uygulamasıyla) birkaç gün sürer.

### 2.2 Yükleme anahtarı (bir kez, kendi bilgisayarında)
1. Java kuruluysa şu komutu çalıştır:
   `keytool -genkeypair -v -keystore upload.jks -alias upload -keyalg RSA -keysize 2048 -validity 10000`
2. Parolaları **kaybetme** ve `upload.jks` dosyasını yedekle.
3. Dosyayı base64'e çevir:
   - Mac/Linux: `base64 -i upload.jks | pbcopy`
   - Windows PowerShell: `[Convert]::ToBase64String([IO.File]::ReadAllBytes("upload.jks")) | Set-Clipboard`
4. GitHub gizli değişkenleri:
   - `ANDROID_KEYSTORE_B64`: kopyaladığın base64 metin
   - `ANDROID_KEYSTORE_PASS`
   - `ANDROID_KEY_ALIAS` (upload)
   - `ANDROID_KEY_PASS`

### 2.3 Derle
1. GitHub › Actions › **Android Google Play** › Run workflow. Yaklaşık 10 dakika sürer.
2. Artifacts › `HayatSimulatoru-android` içinde iki dosya var:
   - `HayatSimulatoru.aab`: Play Console'a yüklenecek dosya.
   - `HayatSimulatoru.apk`: Android telefona doğrudan kurup denemek için.

### 2.4 Play Console'da uygulama
1. "Uygulama oluştur": ad, Türkçe, **Oyun**, **Ücretsiz**. Beyanları onayla.
2. **Uygulama içeriği** ve **Mağaza girişi**: `store/play-store.md`.
3. **Test › Kapalı test**:
   - Yeni kanal oluştur ve `.aab` dosyasını yükle.
   - "Play Uygulama İmzalama" önerisini kabul et. Google son imzayı kendisi yapar, senin anahtarın yükleme anahtarı olur.
   - Testçi listesine en az **12 kişinin** Gmail adresini ekle ve katılım bağlantısını onlara gönder. Bu kişiler 14 gün boyunca uygulamayı kurulu tutmalı.
4. 14 gün sonra Kontrol paneli › "Üretime erişim başvurusu". Kısa bir anket doldurulur ve onay birkaç gün sürer.
5. **Üretim** › Yeni sürüm › aynı `.aab` (ya da yenisi) › İncelemeye gönder.

### 2.5 Google Play Games (hesap bağlama)
`store/play-store.md` › "Play Games Services" adımları. Proje kimliğini `PGS_PROJECT_ID` gizli değişkenine yaz ve yeniden derle.

### 2.6 Otomatik yükleme (isteğe bağlı)
1. Play Console › Kurulum › API erişimi › hizmet hesabı oluştur ve "Sürüm yöneticisi" yetkisi ver.
2. JSON anahtarını `PLAY_SERVICE_ACCOUNT_JSON` gizli değişkenine yapıştır.
3. Bundan sonra iş akışı her derlemede "Dahili test" kanalına taslak olarak yükler.
4. İlk `.aab` yüklemesi her zaman elle yapılmalıdır.

---

## 3. Para kazanma: reklam ve uygulama içi satın alma

### 3.1 Model (oyunda hazır, `js/shop.js`)
- **Ücretsiz oyuncu:**
  - İlk 25 turdan sonra, her 6 turda bir (en az 4 dakika arayla) tam ekran reklam görür.
  - İsterse **ödüllü reklam** izler: haftada bir "+2 boş zaman", ayda bir "harçlık", "son kararı geri al".
  - Aynı anda en fazla **3 yaşayan hayat** olabilir. **Çok hızlı** oyun hızı ve **Oyun dengesi** ayarları kilitlidir. Oyun bunlar olmadan da tamamen oynanır.
- **Reklamsız (₺129,99, kalıcı):** Tam ekran reklam yok.
- **Premium (₺249,99, kalıcı):** Reklamsız + bütün kilitler açık + ödüllü avantajlar reklam izlemeden.
- **Para paketleri (tüketilebilir):** ₺39,99 / ₺99,99 / ₺249,99. Karaktere 50 bin / 250 bin / 1 milyon oyun parası ekler (2026 fiyatıyla; enflasyonla büyür).
- **İnternet kapalıyken:**
  - Reklam çıkmaz ama kilitler de açılmaz. Kilitler yalnızca satın almayla açılır ve satın alma cihazda saklanır.
  - Bu yüzden interneti kapatmak "bedava premium" sağlamaz. Sadece reklamsız ama kilitli ücretsiz sürüm oynanır.
  - Çevrimdışı oynamayı yasaklamak oyuncuyu kaçırır; önerilmez.
- Tarayıcı sürümünde (Claude bağlantısı) mağaza yoktur: reklam çıkmaz, her şey açıktır.

### 3.2 AdMob (reklam)
1. https://admob.google.com → Google hesabınla (Play Console'daki hesap) kaydol. Ödeme profili için vergi ve banka bilgisi gir.
2. "Uygulama ekle" adımını **iki kez** yap: iOS ve Android. Uygulama mağazada yayınlanmadan önce "listelenmemiş" diye eklenebilir; yayınlanınca mağazaya bağlanır.
3. Her uygulama için iki reklam birimi oluştur: **Geçiş reklamı** (Interstitial) ve **Ödüllü** (Rewarded).
4. GitHub gizli değişkenleri:
   - iOS: `ADMOB_IOS_APP_ID` (`ca-app-pub-…~…`), `ADMOB_IOS_INTERSTITIAL`, `ADMOB_IOS_REWARDED` (`ca-app-pub-…/…`)
   - Android: `ADMOB_ANDROID_APP_ID`, `ADMOB_ANDROID_INTERSTITIAL`, `ADMOB_ANDROID_REWARDED`
5. Gizli değişkenler girilmezse derleme **Google'ın test reklamlarıyla** çıkar. Bu, TestFlight denemesi için doğrudur. Mağazaya göndermeden önce mutlaka gerçek kimlikleri gir.
6. AdMob › Gizlilik ve mesajlar:
   - **GDPR** izin mesajı oluştur. Oyun bunu Avrupa'daki oyunculara otomatik gösterir.
   - iOS için **IDFA açıklama mesajı** oluştur (isteğe bağlı).
7. **app-ads.txt:** AdMob'un verdiği satırı geliştirici web sitenin köküne koy (ör. GitHub Pages). Zorunlu değil ama reklam gelirini artırır.
8. **Kendi reklamına tıklama.** Hesap kapatılır. Denerken test reklamları kullanılır.

### 3.3 App Store'da satın almalar
1. App Store Connect › **Business** (Agreements, Tax, and Banking) › **Paid Apps** sözleşmesini kabul et, banka (IBAN) ve vergi formunu doldur. Bu olmadan satın alma çalışmaz.
2. Uygulama › Monetization › In-App Purchases: `store/app-store.md` tablosundaki 5 ürünü aynı kimliklerle oluştur.
3. Denemek için: Users and Access › **Sandbox** › test hesabı oluştur. iPhone'da Ayarlar › App Store › Sandbox hesabıyla giriş yap ve TestFlight sürümünde satın al. Sandbox'ta para çekilmez.
4. İlk sürümü gönderirken ürünleri de sürüm sayfasından seçip birlikte incelemeye gönder.
5. **Küçük işletme programı:** https://developer.apple.com/app-store/small-business-program/ adresinden başvurursan Apple'ın komisyonu %30 yerine **%15** olur.

### 3.4 Google Play'de satın almalar
1. Play Console › Ayarlar › **Ödeme profili** (satıcı hesabı) oluştur ve banka bilgisi gir.
2. Uygulama › Para kazanma › Ürünler › **Uygulama içi ürünler**: aynı 5 kimlik. Bu sayfa, uygulama en az bir kez kapalı test kanalına yüklendikten sonra açılır.
3. Test için: Ayarlar › **Lisans testi** › testçi Gmail adreslerini ekle. Onlardan para çekilmez.
4. Google'ın komisyonu ilk 1 milyon dolar için **%15**'tir.

### 3.5 Beyanlar değişti
Reklam yüzünden gizlilik beyanları "veri toplanmıyor" olamaz. Güncel cevaplar:
- App Store › App Privacy: `store/app-store.md`
- Play › Data safety ve "Reklam içerir: Evet": `store/play-store.md`
- Gizlilik politikası (`PRIVACY.md`) güncellendi.

---

## 4. Sürüm güncelleme döngüsü
1. Oyunu değiştir ve test et: `npm test`.
2. `package.json` › `version` alanını artır (1.0.0 → 1.0.1).
3. Actions'tan iki iş akışını da çalıştır.
4. App Store'da yeni sürüm oluştur, TestFlight derlemesini seç ve incelemeye gönder. Play Console'da yeni sürüm oluşturup `.aab` dosyasını yükle.

## 5. Kontrol listesi
- [ ] Apple Developer üyeliği onaylandı
- [ ] App ID + Game Center + iCloud kapsayıcısı
- [ ] App Store Connect'te uygulama açıldı
- [ ] 4 GitHub gizli değişkeni (iOS)
- [ ] Dal `main`e birleştirildi, PRIVACY.md bağlantısı açılıyor
- [ ] PRIVACY.md'ye destek e-posta adresi yazıldı
- [ ] TestFlight'ta denendi
- [ ] Game Center başarımları ve sıralama tablosu
- [ ] Mağaza metinleri, ekran görüntüleri, gizlilik, yaş derecesi
- [ ] İncelemeye gönderildi
- [ ] Play Console hesabı onaylandı
- [ ] Yükleme anahtarı + 4 gizli değişken (Android)
- [ ] Kapalı test: 12 testçi, 14 gün
- [ ] Play Games Services (isteğe bağlı)
- [ ] AdMob hesabı, 2 uygulama, 4 reklam birimi, 6 gizli değişken
- [ ] Apple Paid Apps sözleşmesi + banka; 5 uygulama içi ürün
- [ ] Google ödeme profili; 5 uygulama içi ürün
- [ ] Küçük işletme programına başvuru (Apple %15)
- [ ] Üretime çıkış
