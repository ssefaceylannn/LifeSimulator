# Mağaza Uyumluluk Denetimi (App Store + Google Play)

Tarih: 26 Ekim 2026 · Kapsam: `js/content/*.js` (stories-fame.js hariç; o dosya ayrıca yazılıyor), `js/systems/*.js`, `js/ui.js` metinleri, `index.html`.
Testler: `node tests/simulate.js 40` ve `node tests/variety.js 6` düzenlemelerden sonra geçti.

## 1. Genel bulgu

İçerik genel olarak temiz: uyuşturucu, cinsel içerik, çıplaklık, grafik şiddet, intihar ya da kendine zarar verme, nefret söylemi, gerçek siyasetçi ya da parti, gerçek ilaç markası, alkol ve tütün kullanımı bulunmadı. Siyasi partiler kurmaca (`economy.js` HS.PARTIES). Şirket, banka ve takım adları da kurmaca. Düzeltilen konular şunlar: gerçek uygulama ve marka adları, kaçakçılığı çağrıştıran bir cümle, intiharı çağrıştırabilecek iki son metni, reşit olmayanların piyango oynayabilmesi, kumarı ödüllendiren başarım ve mağaza incelemesinde sorun çıkarabilecek "prototip / yakında" metinleri.

## 2. Yapılan değişiklikler

| Dosya | Önce | Sonra | Neden |
|---|---|---|---|
| `js/content/stories-life.js` | "Instagram’da kutu açılışı" | "sosyal medyada kutu açılışı" | 5.2 Fikrî mülkiyet / marka |
| 〃 | "WhatsApp grubu “… Son Kez Özgür”" | "Mesaj grubu …" | Marka |
| 〃 | "WhatsApp’ta “12-C Efsaneleri” grubunu" | "mesajlaşma uygulamasında …" | Marka |
| 〃 | "Instagram’dan takip isteği" | "sosyal medyadan takip isteği" | Marka |
| 〃 | Seçenek "Instagram hesabını kur" | "Sosyal medya hesabı aç" | Marka |
| 〃 | "İstanbul Yarı Maratonu" (metin ve seçenek) | "büyük şehir yarı maratonu" / "Köprülü şehir yarı maratonu" | Gerçek etkinlik adı |
| 〃 | "YouTube’da … videoları", "YouTube’dan öğren" | "internette … videoları", "İnternet videolarından öğren" | Marka |
| 〃 | "Telegram’daki sinyal grubu" (2 yer), "Telegram grubu silindi" | "mesajlaşma uygulamasındaki sinyal grubu", "sinyal grubu silindi" | Marka |
| 〃 | "Mahalle WhatsApp grubunda" | "Mahallenin mesaj grubunda" | Marka |
| `js/content/stories-work.js` | "Ekip WhatsApp grubu", "WhatsApp'tan attı", "Grup WhatsApp'ında" | "Ekibin mesaj grubu", "telefondan mesajla attı", "Grubun mesaj kanalında" | Marka |
| 〃 | "Excel tablosu" | "Hesap tablosu" | Marka |
| `js/content/moments.js` | "Veli WhatsApp grubunda" | "Veli mesaj grubunda" | Marka |
| `js/content/events.js` (shadyOffer) | "…malı bırakmak zorunda kaldın. Borçlu çıktın." | "Son anda sıyrıldın ama iş yarıda kaldı; üstüne borçlu çıktın." | Kaçakçılığı ya da uyuşturucuyu çağrıştıran "mal" ifadesi kaldırıldı |
| `js/content/endings.js` (son: kriz) | "uzun bir karanlık dönemin içinde yorgun düştü; hikâye orada sustu" | "uzun ve yorucu bir hastalık döneminin ardından bedeni daha fazla dayanamadı" | Depresyon kaynaklı ölüm ya da intihar çağrışımı (1.1 / Google "kendine zarar") |
| `js/content/endings.js` (son: secim-genc) | "bu hikâyeyi kendi isteğinle kapattın; … başka bir hayata kaldı" | "anı defterini burada kapattın; … başka bir oyuna kaldı" | Oyuncunun hayatı kapatması "kendi isteğiyle ölüm" gibi okunabiliyordu |
| `js/content/endings.js` farewell() | Oyuncunun kapattığı hayatlarda da veda/cenaze sahnesi ("Vedasında … vardı") | Oyuncunun kapattığı hayatlarda veda sahnesi yok: "Defter kapandığında hikâyesi sürüyordu…" | Aynı çağrışım |
| `js/content/activities.js` | "Piyango bileti al" etkinliğinde yaş sınırı yoktu (başlangıç yaşı 16'ya kadar inebiliyor) | `when: (s) => s.age >= 18` | Reşit olmayanlar kumar oynamamalı |
| `js/content/events-daily.js` (lottery) | Yaş sınırı yoktu | `minAge: 18` | Aynı neden |
| `js/systems/achievements.js` | Başarım "Kuponun kralı – Tek kuponda 7 üstü oranla kazan" ve bigBet işaretini koyan sarmalayıcı | "Sınırını bilen – Kuponlar birikince destek alıp bahsi bırak" (`flags.betQuit`); sarmalayıcı kaldırıldı | Kumarı ödüllendirmek yerine sorumlu davranışı ödüllendirir (Google simüle kumar politikası) |
| `js/ui.js` bahis notu | "Bahis bağımlılık yapabilir…" | Başa eklendi: "Bu bölüm gerçek para içermeyen bir simülasyondur; gerçek bahis oynanamaz ve ödül verilmez." | 5.3 / Google simüle kumar açıklaması |
| `js/ui.js` Hakkında | "prototip sürüm 0.3"; "Yatırım ve bahis bölümleri tavsiye değildir." | "sürüm 0.3"; "Oyunda gerçek para kullanılmaz; yatırım ve bahis bölümleri tamamen sanaldır ve tavsiye değildir." | 2.1 (prototip/beta ibaresi) ve 5.3 |
| `js/ui.js` Hesap kartı | iOS sürümünde "Google Play Oyunlar" ve "mağaza sürümünde" ifadeleri, devre dışı "Hesabını bağla" düğmesi | "Oyun kayıtların yalnızca bu cihazda tutulur; hesap açmak gerekmez." (düğme kaldırıldı) | 2.3.10 (başka platformdan söz etmeme), 2.1/2.2 (yer tutucu ya da "yakında" özellik) |
| `js/ui.js` Titreşim ayarı | "(iPhone tarayıcıda desteklenmez)" | "(bazı cihazlarda desteklenmez)" | Marka ve platform adı |

Bunlar bilerek korundu: e-Devlet, MHRS, KYK, SGK, CİMER, DASK, TÜBİTAK, Metrobüs (kamu kurum ve hizmetlerine betimleyici atıflar). Bilgi sorularındaki gerçek yazar ve tarih bilgileri, Atatürk'ü Anma bayramı adı (resmî tatil), Ramazan ve Kurban Bayramı da korundu. Hakkında bölümündeki "Microsoft Fluent Emoji (MIT)" lisans gereği bir atıf olduğundan kaldı. "Apple / Google" adları artık UI'da geçmiyor.

## 3. Yaş derecelendirmesini etkileyen içerik (kalan)

- **Simüle kumar (bahis):** `js/systems/invest.js` (HS.BETS, HS.CAN.bet, HS.FX.bet, `betAddiction` olayı), UI'da `js/ui.js` → Para > Yatırım sekmesindeki "Yasal bahis bayisi (kurmaca)" bölümü, ayar olarak `js/content/config.js` → `betLimit`. Kurmaca takımlar ve kurmaca bayi kullanılıyor. 18 yaş sınırı ve haftalık kupon sınırı var. Bağımlılık olayı ("Kuponlar birikiyor") ve "bayi her zaman kazanır" notu da duruyor.
- **Piyango:** `js/content/activities.js` (piyango, ≥18), `js/content/events-daily.js` (lottery, ≥18, "kurmaca piyango"), `js/content/moments.js` (`piyango`, ≥25, sokakta bilet satan amca). Gerçek piyango markası geçmiyor.
- **Spekülatif yatırım:** Hisse ve kripto (sanal). Telegram benzeri "sinyal grubu" dolandırıcılık hikâyesi uyarı niteliğinde.
- **Suç teması:** "Gece işleri" mesleği (`economy.js` crime, `events.js` shadyOffer, crimeCall, pastCalls, lawyer; `moments.js` crimeMahalle; kariyer basamakları `skills.js`). Talimat içermiyor ve ne yapıldığı tarif edilmiyor. Risk birikir, sağlık ve moral düşer, ifadeye çağrılma ve avukat masrafı gelir, sonunda "geçmişin hesabı" (mahkeme) sonu var. Uyuşturucu ya da silah yok.
- **Ölüm:** Yaşlılık ya da hastalıkla ölüm, akraba vefatı, cenaze anılması. Grafik değil.
- **Hafif romantizm:** Flört uygulaması, buluşma, evlenme teklifi, düğün, Sevgililer Günü, bebek sahibi olma. Cinsel ya da müstehcen içerik yok.
- **Sağlık ve tedavi:** Kronik hastalık teşhisi, ilaç ve kontrol masrafı, kolesterol değerleri, MR. Marka ya da tavsiye yok.
- **Alkol, tütün ve uyuşturucu:** Bulunmadı.
- **Diğer:** Mobbing, boşanma, ev hırsızlığı (olay olarak), dolandırıcılık ve oltalama SMS'leri (eğitici), askerlik (şiddet yok).

## 4. Önerilen App Store yaş derecelendirmesi cevapları

| Madde | Cevap |
|---|---|
| Cartoon or Fantasy Violence | None |
| Realistic Violence | None |
| Prolonged Graphic or Sadistic Realistic Violence | None |
| Profanity or Crude Humor | None |
| Mature/Suggestive Themes | Infrequent/Mild (suç teması, boşanma, ölüm, finansal risk, flört) |
| Horror/Fear Themes | None |
| Medical/Treatment Information | Infrequent/Mild (teşhis ve ilaç masrafı anlatısı; tavsiye yok) |
| Alcohol, Tobacco, or Drug Use or References | None |
| Simulated Gambling | **Frequent/Intense** (bahis bayisi her zaman erişilebilir bir sekme olduğu için; ihtiyatlı cevap budur) |
| Sexual Content or Nudity | None |
| Graphic Sexual Content and Nudity | None |
| Contests | None |
| Unrestricted Web Access | No |
| Gambling (real money) | **No** |
| Ek sorular (2025 anketi): Kullanıcı tarafından oluşturulan içerik / mesajlaşma, reklam, ebeveyn denetimi, yaş doğrulama | Yok / Hayır |

Beklenen sonuç: Simüle kumar "Frequent" seçildiğinde App Store derecesi **18+** olur (eski sistemde 17+). "Infrequent" seçilirse **13+** çıkar. Bahis bir menü bölümü olarak sürekli erişilebilir olduğundan Apple "Frequent" bekleyebilir. Daha düşük bir derece hedefleniyorsa bahis bölümünü kaldırmak ya da oyunun küçük bir olayına indirgemek gerekir.

## 5. Önerilen Google Play (IARC) cevapları

- **Şiddet:** Hayır (yalnızca anlatı düzeyinde suç teması; şiddet tasviri yok).
- **Cinsellik / çıplaklık:** Hayır. Romantik ilişki var ama cinsel içerik yok.
- **Dil (küfür):** Hayır.
- **Kontrollü maddeler (alkol, tütün, uyuşturucu):** Hayır.
- **Kumar:** Simüle kumar: **Evet** (gerçek parayla bahis ya da şans oyununu taklit ediyor, para ödülü yok). Gerçek para veya gerçek değerli ödül: **Hayır**.
- **Korku:** Hayır.
- **Kaba mizah:** Hayır.
- **Kullanıcı etkileşimi / sohbet:** Hayır.
- **Konum paylaşımı:** Hayır.
- **Dijital satın alma (uygulama içi satın alma):** Hayır (şu an yok; eklenirse güncellenmeli).
- **Kişisel bilgi paylaşımı:** Hayır.
- **Reklam:** Hayır (şu an yok).

Beklenen IARC sonucu: Simüle kumar nedeniyle PEGI 12 / USK 12 ile ESRB Teen civarı (bölgeye göre PEGI 16'ya kadar çıkabilir). Play Console'daki "Hedef kitle" bölümünde 13 yaş ve üstü (tercihen 18+) seçilmeli. Simüle kumar içerdiği için çocuklara yönelik (Families) programa başvurulmamalı.

## 6. Kalan öneriler (kod değişikliği yapılmadı)

1. `index.html` Google Fonts'u CDN'den yüklüyor. Bu, kullanıcının IP adresini Google'a gönderir. Gizlilik etiketleri (App Privacy / Data safety) ve KVKK-GDPR açısından yazı tiplerini uygulamaya gömmek önerilir. Gömülmezse gizlilik politikasında belirtilmeli. Her iki mağaza da gizlilik politikası URL'si istiyor.
2. `js/content/stories-fame.js` bu denetimin dışında kaldı. Bitince aynı kontrol yapılmalı: gerçek ünlü, TV programı ve platform adları ("O Ses Türkiye", "MasterChef", sosyal medya uygulamaları) ile alkol ve parti sahneleri.
3. Kurmaca şirket adları ("Atlas Yazılım", "Ege Sigorta", "Bilge Koleji" vb.) genel kelimelerden oluşuyor ama tesadüfen gerçek şirketlerle çakışabilir. Yayın öncesi kısa bir marka araması yapılması ya da daha ayırt edici adlar kullanılması önerilir.
4. Simülasyon testinde `betAddiction` olayı hiç tetiklenmedi (botlar az bahis oynuyor). Mekanik koşul doğru (12 haftada ≥10 kupon); istenirse eşik düşürülebilir.
5. Kayıt dışa ve içe aktarma yalnızca yerel çalışıyor. "Bütün verileri sil" düğmesi mevcut, bu Apple'ın 5.1.1(v) hesap silme kuralı için yeterli (hesap sistemi yok).
