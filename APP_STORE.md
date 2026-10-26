# iPhone'da deneme ve mağaza

Mağazaya çıkış adımları için **MAGAZA-REHBERI.md** dosyasına bak (App Store ve Google Play). Mağaza metinleri `store/` klasöründe, içerik uygunluk denetimi `STORE-COMPLIANCE.md` dosyasında.

## iPhone'da deneme (imzasız .ipa)

GitHub Actions (`.github/workflows/ios.yml`) yalnızca elle başlatıldığında (GitHub › Actions › "iOS IPA (imzasız)" › Run workflow) macOS sunucusunda oyunu Capacitor ile yerel bir iOS uygulamasına sarar ve **imzasız** bir `.ipa` üretir. İndirmek için: GitHub › Actions › "iOS IPA (imzasız)" › son çalıştırma › Artifacts › `HayatSimulatoru-ipa` (zip içinde `HayatSimulatoru-imzasiz.ipa`).

Apple, imzasız uygulamaların doğrudan kurulmasına izin vermez. Kendi telefonuna kurmanın yolları:

1. **Sideloadly** (Windows/Mac, ücretsiz): iPhone'u kabloyla bilgisayara bağla, `.ipa` dosyasını sürükle, Apple kimliğini gir, "Start". Telefonda Ayarlar › Genel › VPN ve Aygıt Yönetimi › geliştirici profiline "Güven" de. Ücretsiz Apple kimliğiyle uygulama 7 günde bir yeniden imzalanmalıdır. iOS 16 ve sonrasında Ayarlar › Gizlilik ve Güvenlik › Geliştirici Modu açılmalıdır.
2. **AltStore** (Windows/Mac): AltServer'ı bilgisayara, AltStore'u telefona kur; `.ipa` dosyasını telefondan AltStore ile aç. Aynı 7 günlük sınır geçerlidir.
3. **TestFlight** (önerilen, kalıcı): Apple Developer Program üyeliği (yıllık 99 USD) gerekir. Üyelik olunca iş akışına imzalama sertifikası ve App Store Connect API anahtarı gizli değişken olarak eklenip derleme doğrudan TestFlight'a yüklenebilir; telefona bağlantıyla kurulur.

Kurulum istemeden denemek için oyunun web sürümü Safari'de açılıp Paylaş › "Ana Ekrana Ekle" ile tam ekran kullanılabilir.
