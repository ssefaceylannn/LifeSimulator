# Başarım listesi (Game Center ve Google Play Games için)

App Store Connect › Uygulama › Services › Game Center › Achievements: her satır için **Achievement ID** olarak ilk sütundaki kimliği yaz (oyun bu kimliklerle açar). Puan: 10-50 arası, Türkçe yerelleştirme: ad ve açıklama.

Google Play Console › Play Games Services › Achievements: aynı adla oluştur; Google her birine `CgkI...` biçiminde bir kimlik verir. Bu kimlikleri `js/cloud.js` içindeki `HS.PLATFORM_IDS.android.ach` alanına `oyunKimliği: "CgkI..."` olarak yaz (oyun kimliği = ilk sütundan `hs_` çıkarılmış hâli).

Sıralama tablosu: **hs_networth**, "En yüksek servet", tamsayı, büyük olan iyi (2026 TL ile hayat sonu net değeri). Android kimliği `HS.PLATFORM_IDS.android.leaderboard`.

| Kimlik | Ad | Açıklama |
|---|---|---|
| hs_ilkMaas | İlk maaş | İlk işine gir. |
| hs_mezun | Kep havaya | Üniversiteden mezun ol. |
| hs_ask | Kalp atışı | Bir ilişkiye başla. |
| hs_evlilik | Evet dedim | Evlen. |
| hs_ebeveyn | Ailemiz büyüdü | Çocuk sahibi ol. |
| hs_torun | Torun sevgisi | Torun sahibi ol. |
| hs_ehliyet | Direksiyonda | Ehliyet al. |
| hs_araba | Kapıda araba | Motorlu bir araç al. |
| hs_spor | Hız tutkusu | Spor araba al. |
| hs_ev | Anahtar teslim | Kendi evini al. |
| hs_villa | Villa sahibi | Villa al. |
| hs_emlakci | Emlak baronu | Kendi evin dışında 3 mülk edin. |
| hs_milyon | İlk milyon | Net değerin 1 milyon TL'yi (2026 fiyatıyla) geçsin. |
| hs_onMilyon | Servet | Net değerin 10 milyon TL'yi (2026 fiyatıyla) geçsin. |
| hs_borcsuz | Borçsuz yaşam | 40 yaşına borçsuz gel. |
| hs_mudur | Zirvede | Mesleğinin en üst basamağına çık. |
| hs_top5 | En iyi işverenlerden | Sıralamada ilk 5 şirketten birinde çalış. |
| hs_ikiDil | Çok dilli | İki yabancı dilde 50 beceriye ulaş. |
| hs_kasli | Demir gibi | Kas oranın 70'e ulaşsın. |
| hs_gocmen | Gurbetçi | Vize alıp yurt dışına yerleş. |
| hs_gezgin | Anadolu gezgini | Türkiye'de 20 il gör. |
| hs_hepsi | 81 il | Türkiye'nin 81 ilinin hepsini gör. |
| hs_dunya | Dünya vatandaşı | 10 ülke gör. |
| hs_yildiz | Yıldız | Şöhretin 80'i geçsin. |
| hs_turne | Yollarda | Bir turneyi tamamla. |
| hs_bahis | Sınırını bilen | Kuponlar birikince destek alıp bahsi bırak. |
| hs_asker | Tezkere | Askerliğini tamamla. |
| hs_kedi | Patili dost | Bir kedi sahiplen. |
| hs_yuzyil | Asırlık çınar | 90 yaşını gör. |
