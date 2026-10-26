# Gizlilik — Hayat Simülatörü (prototip)

Bu prototip hesap, reklam, analiz, konum, kişi listesi ya da sunucu kullanmaz. Oyun verisi hiçbir sunucuya gönderilmez.

Tek dış bağlantı yazı tipleridir: çevrimiçiyken Baloo 2 ve Nunito yazı tipleri Google Fonts'tan yüklenir. Bu istekte tarayıcı, her web sitesinde olduğu gibi IP adresini ve tarayıcı bilgisini Google'a iletir; oyun verisi iletilmez. Mağaza sürümünde yazı tipleri uygulamanın içine gömülmeli.

Cihazda saklananlar, tarayıcının `localStorage` alanında:

- `hayatSimulatuoruSavesV1`: hayat kayıtları. Karakterin adı, şehri, durumu, yarım kalan haftanın olayı, dönüm noktası günlüğü ve oyuncunun yazdığı çocuk adları.
- `hayatSimEndingProfilesV2`: bu cihazda keşfedilen son profillerinin listesi.

Tarayıcı verisini temizlemek, ya da kayıtlar ekranındaki ✕ düğmesi, kayıtları siler. Sunucu üzerinden açıldığında service worker oyun dosyalarını çevrimdışı kullanım için önbelleğe alır.

Mağaza sürümü hazırlanırsa, kullanılan uygulama kabuğu, kütüphaneler ve depolama davranışı yeniden kontrol edilmeli; bu metin ve mağaza gizlilik beyanı ona göre güncellenmelidir.
