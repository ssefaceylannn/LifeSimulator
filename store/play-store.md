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
- **Reklamlar:** **Evet, uygulama reklam içerir** (Google AdMob)
- **Uygulama erişimi:** Tüm işlevler özel erişim gerektirmez
- **İçerik derecelendirmesi (IARC):** Şiddet: Hayır · Cinsellik: Hayır · Küfür: Hayır · Uyuşturucu/alkol/tütün: Hayır · Kumar (gerçek ya da simüle): **Hayır** · Kullanıcı etkileşimi: Hayır · Konum paylaşımı: Hayır · Dijital satın alma: **Evet** · Reklam: **Evet**. Beklenen sonuç: PEGI 7-12 / ESRB Everyone 10+ – Teen.
- **Hedef kitle:** 13-15, 16-17 ve 18+ yaş grupları (13 yaş altını seçme; seçersen Aileler politikası ve çocuklara uygun reklam kuralları devreye girer). "Uygulama çocukları cezbedebilir mi?" Hayır.
- **Veri güvenliği (Data safety):** (AdMob nedeniyle)
  - Veri topluyor musunuz? **Evet**. Paylaşıyor musunuz? **Evet** (reklam ağıyla).
  - Toplanan: **Cihaz veya diğer kimlikler** (reklam kimliği), **Uygulama etkinliği › Uygulama etkileşimleri**, **Uygulama bilgileri ve performans › Kilitlenme günlükleri, Teşhis**, **Konum › Yaklaşık konum** (IP).
  - Amaç: Reklam veya pazarlama; Analiz; Dolandırıcılık önleme.
  - Veriler aktarım sırasında şifrelenir: Evet. Kullanıcı veri silme isteyebilir: Evet (reklam kimliği telefon ayarlarından sıfırlanır; oyun verisi cihazdan silinir).
  - Satın almalar Google Play tarafından işlenir.
- **Uygulama içi ürünler (Para kazanma › Ürünler › Uygulama içi ürünler):** `store/app-store.md`'deki tablodaki 5 ürün aynı kimliklerle. Para paketleri "tüketilebilir"dir; Play'de tür ayrımı yok, oyun tüketir.
- **Ödeme profili:** Para kazanma için Play Console › Ayarlar › Ödeme profili (satıcı hesabı) ve banka bilgisi gerekir.
- **Haber uygulaması / COVID / finans / sağlık uygulaması:** Hayır. Bu bir oyun; finans bölümleri kurmacadır.
- **Devlet uygulaması:** Hayır
- **Kumar:** Yok (ne gerçek ne simüle).

## Play Games Services (hesap bağlama)
1. Play Console › Uygulama › Play Games Services › Kurulum ve yönetim › Yapılandırma › "Yeni oyun oluştur".
2. Kimlik bilgileri: Android, paket adı `com.hayatsimulatoru.oyun`, SHA-1 parmak izi: Play Console › Uygulama bütünlüğü › **Uygulama imzalama anahtarı** sertifikasının SHA-1'i (yükleme anahtarının değil).
3. Başarımlar ve sıralama tablosu: `store/achievements.md` listesine göre oluştur ve kimlikleri `js/cloud.js`'e yaz.
4. "Proje kimliği" (sayı) → GitHub gizli değişkeni `PGS_PROJECT_ID`.
5. Kayıtlı oyunlar (Saved Games) seçeneğini **aç**.
6. Yayınla (test kullanıcıları ekleyerek önce test et).

## Yeni geliştirici hesabı kuralı (önemli)
2023'ten sonra açılan **kişisel** geliştirici hesaplarında, üretim kanalına çıkmadan önce **en az 12 test kullanıcısıyla 14 gün kesintisiz kapalı test** zorunlu. Ayrıntı: MAGAZA-REHBERI.md.
