# LiveCanvas (Basit Calisan Surum)

Bu klasor, PRD'deki temel gereksinimlere gore hizli ve sade bir WebAR prototipi icerir.

## Neler Var

- MindAR (image tracking) + A-Frame entegrasyonu
- 6DoF hissini korumak icin kamera kontrol kilidi
- Browser zoom/scroll/gesture bloklama
- Tek hedef (hedef.jpeg) icin sade takip
- Tek GLTF modelin hedefe baglanmasi

## Calistirma

Statik bir server ile ac:

- Python: `python -m http.server 5500`
- Sonra: `http://localhost:5500`

Mobilde test etmek icin ayni agda telefonla bu adrese gir.

## hedef.jpeg ile Calisma

1. `http://localhost:5500/compile-target.html` ac.
2. `Derle ve indir` butonuna bas.
3. Inen `targets.mind` dosyasini proje kokune koy:
   `c:\Users\Wonka\Desktop\ar\targets.mind`
4. `http://localhost:5500` ile AR sahnesini ac ve `hedef.jpeg` tarat.

## Notlar

- 3D model su an CDN'deki ornek GLTF'tir.
- Kendi modelin varsa `index.html` icinde `#modelMain` `src` degerini degistir.
