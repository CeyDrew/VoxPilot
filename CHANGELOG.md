# Değişiklikler

## 1.2.7

- Ayarlar yeni düzende: solda Genel, Temalar ve Kısayollar. Temalar sol menüden Ayarlar'a taşındı.
- Claude Code açık terminalin üstünde komut şeridi: /compact, /clear, /review… Tıkla ya da Ctrl+1…9. Komutlar, adları, yaz ya da hemen gönder ve sıraları Ayarlar · Kısayollar'dan değişir. Şeride sığmayanlar "⋯ N daha" düğmesinin altında.
- Ayarlar · Genel · Talimatlar: yazdıkların açtığın yapay zekâ oturumlarına verilir (Claude Code, Codex, Gemini ve Antigravity; nerede açılırsa açılsın). Yeni oturumlardan itibaren geçerli.
- VoxPilot tepside: pencereyi kapatınca uygulama saatin yanındaki simgede çalışmaya devam eder, seni bekleyen oturumu haber verir. Simgedeki nokta durumu gösterir (seni bekleyen varsa kırmızı yanıp söner). Tıkla: pano gelir ya da gider. Sağ tık: panoyu aç, oturumlar durumlarına göre alt alta (seni bekliyor, sıra sende, çalışıyor; tıklayınca terminali açılır), çık.
- Ayarlar · Genel · Windows ile başlat: oturum açınca VoxPilot tepside başlar.
- Uygulama yeniden açılınca terminallerde tıklamanın kayması düzeldi (kısayol şeridi gelince yeni boyut kayboluyordu).
- Güncellemeler GitHub'dan: yeni sürüm kendiliğinden iner, sen uzaklaşınca ya da "şimdi güncelle" ile kurulur. Ayarlar · Genel · Uygulama: güncellemeleri denetle ve güncellemeleri hemen kur geri geldi.

## 1.2.6

- Yeni terminal klasöründe ne başlatacağını seçebiliyorsun (Ayarlar · Arayüz · yeni terminal başlatır): boş terminal, bilgisayarda kurulu yapay zekâ araçlarından biri (Claude Code, Codex, Gemini, Aider…) ya da kendi komutun. Varsayılan: Claude Code kuruluysa o, değilse boş terminal. Shift + yeni terminal her zaman boş terminal açar.

## 1.2.5

- Ayarlar: Etkinlik bölümü kaldırıldı; Uygulama bölümünde güncelleme düğmeleri yok, yalnızca sürüm yazıyor.

## 1.2.4

- Ayarlar penceresinin başlığından durum (çevrimdışı) ve ad kopyalama düğmeleri kaldırıldı.

## 1.2.3

- Ayarlar'dan hacker adı bölümü kaldırıldı.

## 1.2.2

- Sol menüden Arkadaşlar, Sıralama, Bildirimler ve Geri bildirim; Ayarlar'dan Profil sekmesi kaldırıldı.

## 1.2.1

- Ayarlar: token tasarrufu, yapay zekâ renkleri ve limit düğmeleri açıkken açık görünüyor.

## 1.2.0

- Kaynak Denetimi: GitHub bağlantısı olmayan bir depoda Dalı Yayımla, depoyu GitHub hesabında (gizli ya da herkese açık) açıp gönderir.

## 1.1.0

- Türkçe arayüz (varsayılan) ve Ayarlar · Arayüz altında dil seçimi: Türkçe ya da English.

## 1.0.1

- Sohbetler Windows'un betik kısıtlamasında da açılıyor: uygulamanın PowerShell'inde `claude`, Claude'un .exe ya da .cmd
  dosyasına yönlendiriliyor (npm'in claude.ps1'i yerine).

## 1.0.0

- VoxPilot adı, logosu ve yeşil-mor-siyah varsayılan tema.
- Sunucu bağlantısı ve otomatik güncelleme kapalı.
- Token tasarrufu, yapay zekâ renkleri ve Claude limitleri varsayılan kapalı; Ayarlar'dan açılır (limitler için yeni
  düğme).
