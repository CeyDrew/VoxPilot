# Değişiklikler

## 1.2.9

- Terminaller panonun ortasında sekmelerde: üst sağdaki yörünge ve terminaller ikonlarıyla harita ve terminaller yer değiştirir. Yeni terminal, oturum kartına tıklama, tepsideki ve köşedeki bildirimler terminali sekmede açar.
- Sol menü kaldırıldı: Kaynak Denetimi üst çubuktaki dal ikonlu düğmede (yanında değişen dosya sayısı). Tıkla ya da Ctrl+Shift+G: açılır, açıkken düğme yanar; yeniden tıkla, Ctrl+Shift+G ya da Esc: panoya döner. Kazanılan yer oturum kartlarına gitti.
- Sağ sütun (araştırma akışı, dosya ısısı, araç dağılımı) altındaki panelle (senin kararın) aynı genişlikte, tek sütun gibi hizalı. Sağ sütunun ya da o panelin solundaki çizgiyi sürükleyince ikisi birlikte genişler.
- Terminallerin üstünde panolardaki gibi başlık: "terminaller", sekme sayısı, seni bekleyen ve sırası sende olan oturum sayısı.
- Sekmede durum rengi ve kısa durum yazısı var; seni bekleyen arka sekme yanıp söner. Ctrl+Tab / Ctrl+Shift+Tab ile sekmeler arasında geçilir; Ctrl+W ya da × sekmeyi kapatır, oturum çalışmaya devam eder.
- Sekmeyi şeritte sürükleyince sırası değişir; şeritten dışarı çekince, çift tıklayınca ya da ⇱ ile kendi penceresinde açılır. Pencereyi başlığından tutup şeride bırakınca ya da "sekme yap" ile yeniden sekme olur. Oturum kartını şeride ya da terminalin üstüne sürükleyince sekmede açılır.
- Sekmeler, sıraları ve öndeki sekme uygulama yeniden açılınca geri gelir.
- Terminale Ctrl+V ile resim yapıştırılıyor: ekran görüntüsü ya da kopyalanan resim Claude Code'a resim yapıştırma tuşuyla (Alt+V) gider; Dosya Gezgini'nde kopyalanan dosyaların yolu tırnak içinde yazılır, Claude Code resmi [Image #1] olarak ekler.
- Arkadaki sekmeler uygulama açılırken birkaç sütun genişliğine düşmüyor (Claude'un çıktısı alt alta harf harf dizilmiyordu).
- Sekmeye sağ tık: sohbet listesindeki menü (yeniden adlandır, favorilere ekle, arşivle, pencerede aç, kopyasını aç, bu klasörde yeni terminal, klasörü göster, oturum kimliğini kopyala) ve sekmeyi kapat, terminali bitir. Yeniden adlandır adı sekmenin üstünde düzenletir.
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
