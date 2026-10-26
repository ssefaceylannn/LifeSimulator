# Türkiye il haritası — kaynak

- **Paket:** [`react-turkey-map`](https://www.npmjs.com/package/react-turkey-map) v2.0.3 (Özgür Özer), dosya `src/geoCities.js` — https://github.com/ozgrozer/react-turkey-map
- **Lisans:** MIT (metni: `LICENSE`)
- **Asıl veri kaynağı:** [Natural Earth](https://www.naturalearthdata.com/) 10m admin-1 states/provinces (`ne_10m_admin_1_states_provinces.geojson`, https://github.com/nvkelso/natural-earth-vector) — kamu malı (public domain). Paket bu veriyi Douglas-Peucker (0,004°) ile sadeleştirip 4 ondalığa yuvarlamış.

## Yaptığımız değişiklikler (`js/art/turkey-map.js`)

- Boylam/enlem halkaları eşdikdörtgen projeksiyonla (enlem 39°'de cos düzeltmesi) `0 0 1000 429` viewBox'ına dönüştürüldü ve SVG `path` verisine çevrildi; koordinatlar 1 ondalığa yuvarlandı, tekrarlanan noktalar ve çok küçük adacıklar atıldı.
- Plaka numarasıyla (1–81) anahtarlandı; il adları oyunun listesine göre yazıldı ("Hakkâri" → "Hakkari").
- `x, y`: en büyük parçanın içinde, kenarlara en uzak nokta (etiket noktası).
- `lat, lon`: en büyük parçanın coğrafi alan ağırlık merkezi (yaklaşık; mesafe tahmini için).
