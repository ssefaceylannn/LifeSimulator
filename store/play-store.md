# Google Play kaydı: kopyala-yapıştır metinler

Play Console › Uygulama › "Mağaza girişi" ve "Uygulama içeriği" sayfalarına bunları gir.

## Mağaza girişi
- **Uygulama adı (30):** Hayat Simülatörü: Türkiye
- **Kısa açıklama (80):** 18 yaşında başla; okul, iş, aşk, aile. Her hafta yeni bir karar, yeni bir hikâye.
- **Tam açıklama (4000):** `store/app-store.md` › Açıklama bölümünün aynısı. "Game Center" yerine "Google Play Games" yaz.
- **Uygulama simgesi:** 512×512 PNG. `assets/app/icon-1024.png` dosyasını 512'ye küçült.
- **Öne çıkan grafik:** 1024×500, `store/android/feature-graphic.png`
- **Telefon ekran görüntüleri:** `store/screenshots/android/` (1080×2340, 8 adet; en az 2, en çok 8)
- **Kategori:** Oyun › Simülasyon
- **Etiketler:** Hayat simülasyonu, Tek oyunculu, Çevrimdışı
- **İletişim e-postası:** destek adresin (zorunlu)
- **Gizlilik politikası:** https://github.com/ssefaceylannn/LifeSimulator/blob/main/PRIVACY.md

## Uygulama içeriği
- **Gizlilik politikası:** yukarıdaki URL
- **Reklamlar:** Uygulama reklam içermez
- **Uygulama erişimi:** Tüm işlevler özel erişim gerektirmez
- **İçerik derecelendirmesi (IARC):** `STORE-COMPLIANCE.md` › bölüm 5. Simüle kumar: Evet; gerçek para: Hayır.
- **Hedef kitle:** 18 ve üzeri (simüle kumar nedeniyle). "Uygulama çocukları cezbedebilir mi?" Hayır.
- **Veri güvenliği (Data safety):**
  - Uygulamanız kullanıcı verisi topluyor veya paylaşıyor mu? **Hayır**
  - Google Play Games kayıtlı oyunları Google'ın hizmetidir; geliştirici verisi değildir.
- **Haber uygulaması / COVID / finans / sağlık uygulaması:** Hayır. Bu bir oyun; finans bölümleri kurmacadır.
- **Devlet uygulaması:** Hayır
- **Kumar:** Gerçek parayla kumar yok. Simüle kumar içerik derecelendirmesinde beyan edildi.

## Play Games Services (hesap bağlama)
1. Play Console › Uygulama › Play Games Services › Kurulum ve yönetim › Yapılandırma › "Yeni oyun oluştur".
2. Kimlik bilgileri: Android, paket adı `com.hayatsimulatoru.oyun`, SHA-1 parmak izi: Play Console › Uygulama bütünlüğü › **Uygulama imzalama anahtarı** sertifikasının SHA-1'i (yükleme anahtarının değil).
3. Başarımlar ve sıralama tablosu: `store/achievements.md` listesine göre oluştur ve kimlikleri `js/cloud.js`'e yaz.
4. "Proje kimliği" (sayı) → GitHub gizli değişkeni `PGS_PROJECT_ID`.
5. Kayıtlı oyunlar (Saved Games) seçeneğini **aç**.
6. Yayınla (test kullanıcıları ekleyerek önce test et).

## Yeni geliştirici hesabı kuralı (önemli)
2023'ten sonra açılan **kişisel** geliştirici hesaplarında, üretim kanalına çıkmadan önce **en az 12 test kullanıcısıyla 14 gün kesintisiz kapalı test** zorunlu. Ayrıntı: MAGAZA-REHBERI.md.
