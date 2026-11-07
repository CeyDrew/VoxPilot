# VoxPilot · Windows

Electron uygulaması: pano `app/Resources/web` klasöründen, terminaller xterm.js ve node-pty (ConPTY) ile.

```sh
npm install          # node-pty hazır derlenmiş gelir, derleme gerekmez
npm start            # kaynaktan çalıştırır
npm run dist         # dist/VoxPilot-Setup-<sürüm>.exe
```

- Oturum sunucusu `src/host.cs`, ilk kullanımda Windows'un C# derleyicisiyle (`csc.exe`)
  `%LOCALAPPDATA%\voxpilot-host` içine derlenir; uygulama kapansa da sohbetler çalışmaya devam eder.
- Sunucu adresi yok: `VOXPILOT_API_URL` verilmezse uygulama hiçbir yere bağlanmaz (`src/cloud.js`).
- Otomatik güncelleme kapalı (`src/main.js`, `UPDATES_ON`); açmadan önce package.json'a kendi `publish` adresini ekle.
- Claude Code'un ayar dosyasına yazan özellikler (token tasarrufu, yapay zekâ renkleri, limitler) varsayılan kapalı,
  Ayarlar'dan açılır.
