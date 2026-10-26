# Mağaza hazırlık notu

**Bu sürüm App Store'a ya da Google Play'e gönderilmeye hazır değildir.** Bu klasör, tarayıcıda çalışan bir web prototipidir; iOS ya da Android uygulama paketi değildir. Bu çalışma alanında mağazaya gönderim veya yayın yapılmadı.

## Taslak metinler

- **Ad:** Hayat Simülatörü (marka ve mağaza adı uygunluğu kontrol edilmedi)
- **Dil:** Türkçe
- **Kısa açıklama:** 18 yaşında, 10.000 TL ile başla. İşin, ilişkilerin ve haftalık kararların hayatını şekillendirsin.
- **Uzun açıklama:** Bir hayatın nasıl şekilleneceğine sen karar ver. Okula git ya da çalışmaya başla, aşık ol, evlen, çocuğuna isim koy, ev al ya da başka bir ülkeye taşın. Her hafta bir karar ver ve yılların seni nereye götürdüğünü gör. Hayatın sonunda kararlarından doğan kişisel bir anı defteri seni bekliyor. Birden fazla hayatı ayrı kaydedebilir, aralarında geçiş yapabilirsin.

## Yayından önce yapılması gerekenler

1. Uygulama kabuğu (ör. Capacitor) ile iOS ve Android projelerini oluşturmak; `localStorage` kayıtlarının kabuk içinde kalıcı olduğunu doğrulamak.
2. Gerçek cihazlarda test: küçük ve büyük iPhone, çentikli Android, iOS Safari'deki güvenli alan davranışı.
3. Simge setleri (şu an tek bir SVG var), açılış ekranı ve mağaza ekran görüntüleri.
4. Yaş derecelendirmesi. Oyunda kumar içermeyen riskli/suç temaları, ölüm ve hastalık konuları var.
5. App Store Connect ve Play Console gizlilik beyanı. Kullanılacak gerçek SDK'larla eşleştirilmeli (şu an hiçbiri yok).
6. Destek bağlantısı, gizlilik politikası URL'si, Apple Developer ve Google Play hesapları, imzalama.
7. Gerçek oyuncu testleriyle denge ayarı ve içerik genişletme.

Apple'ın güncel gönderim açıklamaları: https://developer.apple.com/app-store/submitting/
