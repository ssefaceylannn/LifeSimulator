# Hayat Simülatörü — oynanabilir web prototipi

Telefonda dikey ekranda oynanan, Türkçe bir yaşam simülasyonu. Oyuncu adını, soyadını, doğduğu ili (81 il), cinsiyetini (kadın/erkek), ten ve saç rengini, saç modelini seçer; 18 yaşında, cebinde 50.000 TL ile başlar (Ayarlar › Oyun dengesi'nden değiştirilebilir). Her hafta 3 ile 5 arası (rastgele) olay gelir; varsayılan hızda bir tur iki hafta sürer (Yavaş / Normal / Hızlı / Çok hızlı, ana ekrandaki ⏩ düğmesinden ya da Ayarlar › Oyun hızı'ndan); olaylar haftanın günlerine sırayla dağılır, hepsi seçilince hafta kapanır ve maaş, giderler, faturalar işlenir; kararlar arasında boş zamanında etkinlikler yapar. Karakter evinin içinde (salon, yatak odası, mutfak, garaj) ya da iş yerinde, animasyon filmi tarzında çizilmiş 2D bir sahnede görünür; sahne, olayın ya da etkinliğin geçtiği yere kendiliğinden geçer. Oyun tarayıcıda çalışır; derleme adımı ya da harici oyun motoru yoktur.

> **Durum:** Bu bir **prototip**tir. Tarayıcıda oynanabilir ve otomatik testlerden geçer, ama App Store'a ya da Google Play'e gönderilmeye hazır **değildir**. Ayrıntılar aşağıda, "Neler hâlâ prototip" bölümünde.

## Mağaza

App Store ve Google Play'e çıkış adımları: **MAGAZA-REHBERI.md**. Mağaza metinleri ve ekran görüntüleri `store/` klasöründe (`node scripts/screenshots.js` yeniden üretir), içerik uygunluk denetimi ve yaş derecelendirmesi cevapları `STORE-COMPLIANCE.md` dosyasında, gizlilik politikası `PRIVACY.md`. Yazı tipleri uygulamanın içindedir (`assets/fonts`); oyun hiçbir sunucuya bağlanmaz.

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
- **Üniversite sınavı (YKS).** "Üniversite sınavına hazırlan" seçilince gerçek bir süreç başlar: şubatta başvuru (ücretli), haziranda sınav, temmuzda sonuç, tercih dönemi ve yerleştirme. Hazırlık puanı ders çalışarak, "Test çöz" etkinliğiyle, deneme sınavları ve dershaneyle artar; çalışılmayan haftalarda düşer. Oyun ara sıra 60'tan fazla gerçek YKS tarzı sorudan birini sorar (Türkçe, edebiyat, matematik, fizik, kimya, biyoloji, tarih, coğrafya, felsefe), annen hatırlatır, motivasyon krizleri olur. Puana göre 11 bölümden tercih yapılır; yerleşme şansı taban puana uzaklığa bağlıdır. Yerleşemezsen bir yıl daha hazırlanabilirsin. Soru eklemek için `js/content/questions.js`.
- **Takvim.** Üst çubuktaki 📅 düğmesi. Önümüzdeki bir yılın önemli tarihleri otomatik yazılır: YKS takvimi, fatura son ödeme günleri, kart ekstresi, maaş ve kira günü, kredi taksitleri, vadeli hesabın dolması, başvuru sonuçları, vize randevusu, ehliyet sınavı, kursların bitişi, tezkere, vardiya değişimi, ihbar süresinin bitişi, doğum günleri, evlilik yıl dönümü, resmî ve dinî bayramlar. Kendi notunu da eklersin. HAYAT sekmesinde "Yaklaşanlar" kartı görünür.
- **Şirket detayları.** Sıralamadaki şirket adına dokununca ne iş yaptığı, kuruluş yılı, çalışan sayısı, şehirleri, maaş düzeyi, mülakat aşamaları, mobbing riski, yan hakları, artıları ve eksileri görünür; oradan başvurulabilir.
- **Gerçekçilik paketi.** Şehre ve ulaşıma göre günlük yol süresi (uzun yol stres ve boş zaman yer); istifada kıdeme göre 2-8 haftalık ihbar süresi ya da ihbar tazminatı; yıl içinde kümülatif gelirle yükselen gelir vergisi dilimi (net maaş erir, ocakta sıfırlanır); esnafa Bağ-Kur ve muhasebeci; partnerle güven barı, yıl dönümü ve kıskançlık; akraba baskısı ve özgüven; çocuk mizacı (sakin, hareketli, inatçı, utangaç, meraklı) ve kreş/bakıcı/büyükanne seçimi; kiracıya yıllık TÜFE sınırlı kira artışı, 5 yıl sonra kira tespit davası, "oğlum gelecek" tahliyesi ve tahliye taahhütnamesi; ikinci el araçta ekspertiz ve gizli arıza; uyku borcu (şansa bağlı seçimlerde başarıyı düşürür); yaş, kilo, stres ve hareketsizlikle kronik hastalıklar (tansiyon, bel fıtığı, diyabet) ve aylık ilaç masrafı.
- **Pil ve ısınma.** "Pil tasarrufu" ayarı varsayılan olarak açıktır: karakterlerin nefes alma, göz kırpma, bulut, kar ve şömine animasyonları kapanır. Tam modda bile 15 saniye dokunulmazsa ve uygulama arka plandayken bütün animasyonlar durur; müzik zamanlayıcısı seyrek çalışır.
- **Oyun dengesi ayarları.** Ayarlar › Oyun dengesi ekranından başlangıç parası ve yaşı, aile evindeki gider katkısı, yaşam gideri / kira / fatura / olay masrafı / maaş / olay kazancı çarpanları, haftada en az ve en çok olay sayısı, kader olaylarının sıklığı, borsa kazanma ihtimali, haftalık kupon sınırı, banka faiz çarpanı, deneyim hızı ve seviye kilitleri değiştirilir. Değerler cihazda saklanır, JSON olarak dışa/içe aktarılır. Varsayılanlar `js/content/config.js` dosyasındadır.
- **Para nereden gider?** Aile evinde yaşarken temel gider yoktur (ayarlanabilir). Maaş, kira ve yaşam giderleri ayda bir işlenir. Bunun dışında para yalnızca seçimlerle değişir; her seçimin yanında kırmızı harcama, yeşil kazanç, mavi bankaya aktarım ya da "ücretsiz" etiketi görünür. Borsa, fon ve kriptoda tutar elle yazılabilir.
- **Haftalık bütçe ve tasarruf.** PARA › Bütçe bölümünde aylık gelir ve giderler kalem kalem görünür (yemek, ulaşım, eğlence, kira, faturalar, taksitler) ve nakdin kaç hafta yeteceği yazar. Yemek (tutumlu, normal, rahat), ulaşım (yürü/bisiklet, toplu taşıma, taksi) ve eğlence (kısıtlı, normal, bol) düzeyi seçilir; tutumlu yaşamak para biriktirir ama mutluluğu biraz düşürür, stresi biraz artırır. Aile evinde yaşarken temel giderleri ailen karşılar.
- **Gün akışı ve yer.** Her olayın bir günü, saati ve yeri var: iş olayı mesai saatinde iş yerinde, yemek olayı mutfakta, maç ve misafir akşam salonda, uykusuzluk gece yatak odasında geçer ve sahne oraya geçer. Akşam ve gecede pencerede gece görünür, oda loşlaşır. Hafta içi sabah işe gidiş (servis, otobüs, scooter ya da arabayla, arkada akan şehir) ve mesai bitince eve dönüş animasyonu oynar.
- **Çalışma düzeni.** Ofis ve memurluk hafta içi 08:00-17:00, kafe ve dükkân haftada 6 gün, öğretmenlik 08:00-15:30. Fabrika ve hastanede vardiya her ay döner (sabah, akşam, gece); gece vardiyası sağlığı ve stresi zorlar. Cumartesi zaman zaman mesai çıkar (fazla mesai ücreti).
- **Stres.** Sağlık ve mutluluğun yanında stres de var. İş yükü, borç, geciken faturalar, mobbing ve vardiya artırır; uyku, spor, gezmek, dizi, sevdiklerinle vakit azaltır. 70'in üstünde sağlık ve ilişki yıpranır; 85'i geçince tükenmişlik olayı çıkar.
- **Kader.** Trafik kazası, ağır hastalık (özel ya da devlet hastanesi), eve hırsız girmesi, deprem (riskli illerde daha olası; DASK hasarın bir kısmını karşılar), ev sahibinin evi satması, toplu işten çıkarma, dolandırıcı SMS ve beklenmedik miras gibi hayatı değiştiren olaylar düşük ihtimalle gelir.
- **Banka.** Vadesiz hesap; 1, 3, 6 ve 12 ay vadeli mevduat (vade bitene kadar para kilitli, bozulursa faiz yanar; bu sürede beklenmedik masraf olayları çıkabilir); kredi kartı (limit gelire göre, ekstre, asgari ödeme, otomatik ödeme talimatı, taksitli alışveriş, gecikme faizi, ödenmezse kartın kapanması ve yasal takip); ihtiyaç ve taşıt kredisi (onay şansı kredi notuna ve gelire bağlı, taksitler gelirin yarısını geçemez, erken kapama); 0-1900 arası kredi notu. Para yetmezse ödeme önce karttan, sonra borç olarak yazılır.
- **Faturalar.** Elektrik, doğalgaz (kışın ve soğuk illerde yüksek), su, internet, cep telefonu ve apartman aidatı her ay gelir. Ödenmezse gecikme bedeli ve kredi notu kaybı, bir ay sonra kesinti olur. Otomatik ödeme talimatı verilebilir.
- **Fiyat ve seviye.** Parası yetmeyen şeyler artık "yeterli nakit yok" demez: fiyatı, ne kadar daha biriktirmen gerektiğini ve bir ilerleme çubuğunu gösterir. Yaşadıkça, başarım kazandıkça deneyim birikir ve seviye atlanır; spor araba (seviye 8) ve villa (seviye 10) gibi lüks alımlar seviye ister.
- **Kişisel eşyalar.** Telefon, dizüstü, oyun konsolu, 65 inç TV, gitar, akıllı saat, espresso makinesi, klima, ortopedik yatak, koltuk takımı, kitaplık, pırlanta kolye ve parfüm alınır; peşin ya da kartla 3/6/9 taksit. Bazıları odada görünür, bazıları yeni etkinlikler açar (konsolda oyun, gitar çal, kitap oku), telefon ve bilgisayar birkaç yılda bozulabilir.
- **Spor salonu.** 1, 3, 6 ve 12 aylık paketler; uzun paket aylık olarak daha ucuz. Üyelik yoksa günlük giriş ücretlidir. Arkadaş buluşması, dışarıda yemek, şehir gezisi, randevu gibi etkinlikler de 2026 fiyatlarıyla ücretlidir.
- **Aile ağacı, ziyaret, misafir.** Anne, baba, kardeşler (genellikle 1-3), büyükanne-büyükbaba, dayı, teyze, amca, hala ve onların çocukları olan kuzenler; evlenince kayınvalide ve kayınpeder. Her birinin adı, yaşı, ili, görünüşü ve seninle bağı var; yaşlanır ve vefat edebilirler. Soy ağacından aranır ya da ziyarete gidilir (sahne onların evine geçer ve yanında görünürler). Akrabalar habersiz ziyarete gelir; salonda yanında dururlar. Kuzen düğünü (çeyrek altın mı zarf mı), kuzenin iş önermesi, borç istemesi, kuzenlerle kahvaltı ve "kuzenin şunu yaptı" kıyasları gibi olaylar var.
- **Ev içi etkinlikler.** Dizi/maç izle (salon), yemek yap (mutfak), erken yat (yatak odası), arabayı yıka (garaj); etkinliği yapınca sahne o odaya geçer. 35'ten fazla gündelik olay (bulaşık, boş buzdolabı, derbi akşamı, elektrik kesintisi, kaçan otobüs, semt pazarı, öğle arası, toplantının uzaması...) evin ve işin içinde geçer.
- **Saç modelleri.** 14 model: kısa, yandan ayrık, fönlü, erkek topuzu, uzun düz, uzun dalgalı, küt, pixie, at kuyruğu, topuz, örgü, kıvırcık, afro, kazınmış; fiyat modele göre değişir.
- **Ayarlar ve ses.** Müzik (tarayıcıda üretilen, makam tınılı hafif oyun müziği), ses efektleri (tuş, kazanma, kaybetme, para, zar, başarım), titreşim, ses düzeyi, işe gidiş animasyonu ve yazı boyutu ayarlanır. Kayıtlar kopyala-yapıştır kodla başka cihaza taşınabilir. "Hesabını bağla" düğmesi mağaza sürümü için yer tutucudur.
- **Yer değiştirme ve göç.** 81 il arasında taşınmak nakliye (mesafeye göre), kira depozitosu, emlakçı komisyonu ve ilk kira gerektirir; Türkiye haritasında il seçilip masraf dökümü görülür. Yurt dışına göç Almanya, Hollanda, İngiltere, Kanada ve ABD için gerçekçi bir vize dosyasıyla yapılır: pasaport harcı, tercüme ve noter, adli sicil, sigorta, bloke hesap, dil sınavı ve iş teklifi gibi evraklar haftalar sürer ve ücretlidir; randevu beklenir, mülakat olur, sonuç belirsizdir (ABD'de kura). Schengen vizesiyle tatil yapılabilir.
- **Beceriler ve kariyer basamakları.** Her mesleğin 5 basamaklı bir merdiveni ve basamak için gereken becerileri var. Beceriler çalışarak, kendi kendine çalışarak ya da ücretli kurslarla artar; mesleğe ait beceri kategorileri o alana girilince açılır, ileri basamaklar "???" olarak gizlidir.
- **Şirketler.** 22 kurmaca şirketin puanlı "en iyi işverenler" sıralaması var. Üst sıradaki şirketlerde mülakat daha çok aşamalı ve zordur (vaka çalışması gibi ek görevler). Şirket başka bir şubeye tayin teklif edebilir, mobbing yaşanabilir, ikramiye ve performans zammı gelir, başka şirketten teklif (headhunter) çıkabilir.
- **Yatırım.** Altın, döviz, endeks fonu, hisse ve kripto alınıp satılır; riskli araçlarda her ay %30 kazanç, %70 kayıp ihtimali var. Mağaza yaş sınırı (13+) için bahis ve piyango oyundan çıkarıldı.
- **Beden.** Boy, kilo, beden kitle indeksi ve kas oranı tutulur. Koşu, spor salonu, diyet, fast food, iş türü, stres ve araba kullanmak kiloyu etkiler; sahnede beden değişir.
- **Mülk, vergi ve ehliyet.** Başka illerde yatırım amaçlı ev alınıp kiraya verilebilir. Emlak vergisi, DASK, MTV, trafik sigortası, isteğe bağlı kasko ve özel sağlık sigortası her yıl ödenir. Motorlu araç için ehliyet gerekir (kurs, e-sınav, direksiyon sınavı). Erkek karakterde askerlik (yapma, bedelli, tecil) var.
- **Müzisyen.** Şöhret, dinlenme geliri, plak anlaşması ve Türkiye, Avrupa ve dünya turneleri var; gezilen il ve ülkeler haritada işaretlenir.
- **Başarımlar ve grafik.** 29 başarım ve yıllık net değer grafiği var; ikisi anı defterinde de görünür. Her hafta için gelir-gider dökümü tutulur.
- **Kurmaca siyaset ve ekonomi.** Dört yılda bir, hayal ürünü partiler ve adaylarla seçim yapılır; seçilen politika ekonomiye etki eder. 2027 ve sonrası için her hayata üç kurmaca ekonomi senaryosundan biri atanır.
- **Ara sahneler.** Mezuniyet, nikâh, doğum, ev alma, göç ve emeklilik gibi anlarda ve her altı ayda bir kısa ara sahne gösterilir.
- **Kayıtlar.** Her hayat bu cihazda ayrı kaydedilir. Kayıtlar arasında geçilebilir, kayıt silinebilir ve hayat istenen anda sonlandırılabilir. Kayıttan devam edilince yarım kalan haftanın olayı korunur. Eski sürümün kayıtları otomatik dönüştürülür.
- **Hayat sonu ve anı defteri.** Hayat bittiğinde, seçimlerden türeyen kişisel bir öykü, dönüm noktaları ve son profili gösterilir (aşağıya bak).

- **Tekrarsız olaylar.** Her olayın kaç kez görüldüğü tutulur. Hiç görülmemiş olaylar öne çıkar; sıradan bir olay n. görülüşünden sonra en az n×2 yıl gelmez (sınav, mesai gibi süreç olayları hariç). Haftada yeni konu kalmazsa hafta erken kapanır; "boş akşam" yedek olayı her seferinde farklı giriş ve son kullanılmamış seçeneklerle gelir. YKS soruları, soru bankası bitmeden tekrar sorulmaz. `tests/variety.js` ilk iki oyun yılında hiçbir sıradan olayın iki kez gelmediğini denetler.
- **Birbirine bağlı hikâyeler.** `js/systems/stories.js` aşama aşama ilerleyen hikâye motorudur. Komşu, en yakın arkadaş, iş arkadaşı, yönetici, liseden arkadaş, bakkal, usta, apartman yöneticisi ve aile hekimi hayat boyu aynı kişidir; bir hikâyedeki karar başka hikâyelerin metnini ve seçeneklerini değiştirir (kombi ustası seni dolandırdıysa çamaşır makinesinde o ustayı aramazsın; arkadaşına verdiğin borç ödenmediyse düğününde sağdıç teklifi farklı gelir). Ev ve komşuluk (19), sosyal hayat, aile ve sağlık (23), iş ve okul (25), şöhret yolu (13) ve kirli işler (10, hepsinde reddetme ve ihbar seçeneği, yakalanma riski) hikâyesi ile 160 tek seferlik an var; YKS soru bankasında 170 soru var.
- **Çevre.** Olaylarda adı geçen tanıdığın rolü metinde yazar ("komşun Handan", "iş arkadaşın Kerem"). Taşınınca komşu, apartman yöneticisi ve bakkal; iş değişince iş arkadaşı ve yönetici değişir; iyi anlaştığın eskiler arkadaş listene geçer. Spor salonunda, kursta, işte, düğünde, otobüste yeni insanlarla tanışıp arkadaş olursun; arkadaşlarının hayatından haberler gelir (evlenir, taşınır, borç ister, bebek bekler) ve aynı haber iki kez gelmez. Çok yakınlaştığın biri en yakın arkadaşın olabilir. BEN › Çevre bölümü herkesi rolü ve aranızdaki bağla listeler.
- **Hesap bağlama (uygulama sürümü).** iPhone'da Game Center, Android'de Google Play Games ile isteğe bağlı giriş: hayatlar platformun kayıtlı oyun hizmetine otomatik yedeklenir ve yeni telefonda geri yüklenir, başarımlar ve "en yüksek servet" sıralaması hesapta görünür (`js/cloud.js`, eklenti `@idleflowgames/capacitor-play-games`). Tarayıcıda kayıt kodu ile taşınır.
- **Reklam ve satın alma (uygulama sürümü).** Ücretsiz sürümde arada tam ekran reklam (AdMob) ve isteğe bağlı ödüllü reklam (+2 boş zaman, harçlık, son kararı geri alma) var. Reklamsız, Premium (bütün kilitler: Oyun dengesi, Çok hızlı oyun, sınırsız hayat) ve oyun parası paketleri uygulama içinden satın alınır (`js/shop.js`). Çevrimdışıyken reklam çıkmaz ama kilitler de açılmaz. Tarayıcı sürümünde mağaza yok, her şey açık. Kurulum: MAGAZA-REHBERI.md › 3.
- **Eşyalar kalıcı.** Bulaşık ve çamaşır makinesi gibi eşyalar alınınca evde kalır; "bulaşık dağı" sorusu makine alındıktan sonra bir daha gelmez.
- **Gerçekçi işe alım ve staj.** Seçici şirketler (yüksek puanlı ya da 3-4 aşamalı mülakatlı) beyaz yaka kadrolara üniversite diploması ister; lise mezunu, 20 yaşından sonra iş tecrübesi ve becerisiyle ancak küçük ve orta ölçekli şirketlerde "ofis asistanı" olarak başlar. Staj yalnızca üniversite öğrencilerine açıktır: bahar döneminde başvuru, yazın 8 haftalık staj, iyi geçerse mezuniyette o şirketten mülakatsız iş teklifi. Örgün üniversiteye başlayan tam zamanlı işinden ayrılır (açıköğretim hariç).
- **Cinsiyete göre dil.** Kadın karakter kuaföre, erkek karakter berbere gider. Evlenme teklifini geleneksel olarak erkek eder: kadın karaktere partneri teklif eder, ama istersen teklifi sen de edebilirsin.

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

Tarayıcı testi şunları dener: karakter oluşturma, 60 hafta oynama, oda değiştirme, altı sekme, berber, kıyafet alıp giyme, araba alıp garajda görme, hisse alma, bahis bölümünün olmaması, şirket başvurusu, harita ve il seçimi, pasaport, vize dosyası, kurs, ayarlar, boş zaman etkinliği, sayfayı yenileyip kayıttan devam etme (yarım kalan olay korunmalı), çocuğa elle isim verme, ikinci hayat açıp hayatlar arasında geçme, hayatı sonlandırma, anı defteri ve dar ekranlarda yatay taşma olmaması.

## Neler hâlâ prototip

- **Mağaza sürümü yok.** iOS ya da Android uygulama kabuğu (ör. Capacitor), imzalama, mağaza ekran görüntüleri, yaş derecelendirmesi ve mağaza gizlilik beyanı yapılmadı. Bkz. [APP_STORE.md](APP_STORE.md).
- **Gerçek cihaz testi yapılmadı.** Mobil düzen, Chromium'un mobil emülasyonunda (320, 360 ve 390 px) test edildi; gerçek iPhone/Android Safari ve Chrome'da denenmedi.
- **Görseller kod ile çizildi.** Karakter ve odalar kodla üretilen SVG'dir; animasyon filmi görünümüne yaklaşır ama gerçek 3D render değildir. Araba, bitki, kedi gibi bazı küçük çizimler Microsoft Fluent Emoji setinden (MIT lisansı, `assets/fluent/LICENSE`). Animasyonlar basit (nefes, göz kırpma, zıplama, şömine, bulut). Profesyonel illüstratör işi ve iskelet animasyonu yok; karakter her zaman önden durur.
- **Ses tarayıcıda üretilir.** Müzik ve efektler kayıtlı ses dosyası değil, Web Audio ile üretilir; iPhone tarayıcısında titreşim desteklenmez.
- **Yazı tipleri çevrimiçi.** Baloo 2 ve Nunito, Google Fonts'tan yüklenir; çevrimdışıyken sistem yazı tipine düşer.
- **Banka oranları yaklaşık.** Kart, kredi ve mevduat oranları 2026 piyasasına yakın, yuvarlanmış oyun değerleridir (BSMV/KKDF gibi vergiler orana gömülüdür); gerçek banka teklifleri farklıdır. Fatura tutarları 70 m² bir hane için ortalama tahmindir.
- **Denge ilk aşamada.** Ekonomi ve olay ağırlıkları bot simülasyonlarıyla ayarlandı, gerçek oyuncu testiyle değil. Örneğin riskli teklifleri kabul eden botlarda "suç" sonu hâlâ çok sık (yaklaşık üçte bir). Servet dağılımı da gerçek oyuncu verisiyle doğrulanmadı.
- **İçerik hacmi.** Yaklaşık 900 olay ve hikâye aşaması var. Çok uzun hayatlarda (50+ yıl) gündelik olaylar seyrek de olsa tekrar eder.
- **İl verisi karışık kaynaklı.** 81 ilin kira ve m² değerleri ilan fiyatıdır ve farklı raporlardan gelir (bkz. ECONOMY.md); Şırnak kirası tahmindir.
- **Yurt dışı beş ülke.** Her ülkede tek şehir var; döviz kuru 2026 değerinde sabit, maaşlar TL karşılığı çarpanlarla hesaplanır.
- **Eş ve çocukların kendi hayatları yok.** Bir "bağ" değeriyle ve dönemeç olaylarıyla temsil ediliyorlar; kendi meslekleri ya da gelirleri simüle edilmiyor (evlilikte ev giderinin yarısını eşin karşıladığı varsayılıyor).
- **Erişilebilirlik kısmi.** Ekran okuyucu ve klavye için temel etiketler var, ama ayrıntılı bir erişilebilirlik denetimi yapılmadı.
- **Kayıtlar yalnızca bu cihazda.** Bulut yedeği ya da hesap bağlama yok; cihazlar arası taşıma yalnızca kopyala-yapıştır kodla yapılır.
