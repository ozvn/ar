# 2026-03-29 - URL 404

- `https://cdn.jsdelivr.net/gh/hiukim/mind-ar-js@1.2.5/examples/image-tracking/assets/musicband-raccoon/scene.gltf`
- `https://cdn.jsdelivr.net/gh/hiukim/mind-ar-js@1.2.5/examples/image-tracking/assets/musicband-bear/scene.gltf`
- Hata: `HTTP Error 404: Not Found`
- Cozum: `band-example/raccoon/scene.gltf` ve `band-example/bear/scene.gltf` kullanildi.

# 2026-03-29 - targets.mind derleme blokaji

- Komut: `npm install mind-ar canvas`
- Hata: `canvas` icin `node-v137` prebuilt bulunamadi (`404`) ve kaynak derleme icin Visual Studio C++ Build Tools yok.
- Ortam: Node `v24.14.0` (Windows)
- Cozum: Terminal derlemesi yerine `compile-target.html` eklendi; tarayicidan `hedef.jpeg -> targets.mind` derleme akisi kullaniliyor.

# 2026-03-29 - Compiler undefined

- Hata: `Cannot read properties of undefined (reading 'Compiler')`
- Neden: `compile-target.html` icinde `mindar-image-three.prod.js` kullaniliyordu, bu buildde `window.MINDAR.Compiler` yok.
- Cozum: Script `mindar-image.prod.js` olarak degistirildi ve compiler varlik kontrolu eklendi.

# 2026-03-29 - MindAR Compiler yuklenemedi

- Hata: `MindAR Compiler yuklenemedi`
- Neden: `mindar-image.prod.js` icinde compiler globali `window.MINDAR.IMAGE.Compiler` altinda export ediliyor.
- Cozum: `compile-target.html` icinde hem `window.MINDAR.Compiler` hem `window.MINDAR.IMAGE.Compiler` fallback kontrolu eklendi.

# 2026-03-29 - Compiler hala yuklenemedi

- Hata ayni sekilde devam etti.
- Kesin neden: `mindar-image.prod.js` dosyasi ESM modulu; normal `<script>` ile yuklenince module importlari calismiyor.
- Cozum: `compile-target.html` scripti `type="module"` yapildi ve `Compiler` dogrudan `import { Compiler } ...` ile alindi.
