# 2026 Dünya Motor Sporları Takvimi

Tamamen statik HTML, CSS ve JavaScript ile çalışan GitHub Pages projesi.

## Yerel çalıştırma

Dosyaları doğrudan `file://` ile açmayın; tarayıcı ICS dosyalarının `fetch()` ile okunmasını engelleyebilir.

```bash
python -m http.server 8080
```

Ardından `http://localhost:8080` adresini açın.

## Mimari

- `index.html`: yalnızca arayüz iskeleti
- `assets/js/config.js`: takvim kaynakları
- `assets/js/modules/ics-parser.js`: ICS ayrıştırıcı
- `assets/js/modules/date-utils.js`: tarih işlemleri
- `assets/js/modules/calendar-view.js`: günlük/haftalık görünüm
- `data/*.ics`: tüm yarış ve seans verileri

## UTC kuralı

Tüm saatler `DTSTART:YYYYMMDDTHHMMSSZ` biçiminde UTC yazılır. JavaScript `Date` ve `Intl.DateTimeFormat` ile ziyaretçinin yerel saatine dönüştürür.

Mobile v5: logo alanı içerik kadar uzar; mobil günlük görünümde seans tek satırdır.
