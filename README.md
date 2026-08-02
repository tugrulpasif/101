# 🀄 Online 101 Okey - Modern & Mobil Uyumlu Multiplayer Oyun

Modern, hızlı, tarayıcı üzerinden kayıtsız oynanabilen, gelişmiş bot AI ve gerçek zamanlı Socket.IO entegrasyonlu **101 Okey Web Uygulaması**.

---

## 🚀 Hızlı Başlangıç (Tek Komutla Çalıştırma)

### 1. Bağımlılıkları Yükleyin
```bash
npm install
```

### 2. Geliştirici Sunucularını Başlatın
```bash
npm run dev
```
*(Bu komut `concurrently` ile hem Node.js Express + Socket.IO sunucusunu `http://localhost:3001` adresinde hem de Next.js App Router istemcisini `http://localhost:3000` adresinde eşzamanlı olarak başlatır).*

Tarayıcınızda **`http://localhost:3000`** adresini açarak oynamaya başlayabilirsiniz!

---

## 🎮 Öne Çıkan Özellikler

### 1. Giriş & Lobi Ekranı
* Üyelik gerektirmez, sadece bir takma ad (isim) ile giriş yapılır.
* 6 haneli rastgele büyük harf ve rakamlardan oluşan oda kodu oluşturulur (Örn: `X7K9M2`).
* Koyu tema, cam efekti (glassmorphic) ve responsive tasarım.

### 2. Oda & Koltuk Yönetimi
* Maksimum 4 oyuncu kapasiteli masalar.
* Boş koltuklara **Bot Ekle / Çıkar** imkanı.
* Oda sahibine özel ayarlar ve oyunu başlatma kontrolü.
* Canlı oda sohbeti.

### 3. Gelişmiş 101 Okey Oyun Masası
* Yeşil keçe masa ve altın detaylı modern arayüz.
* 2 sıralı ahşap taş ıstakası (30 slot).
* **Seri Diz** ve **Takım Diz** otomatik taş düzenleme butonları.
* Sürükle-bırak veya tıklayarak taş seçme ve atma.
* Web Audio API ile üretilmiş özel ses efektleri (Taş çekme, taş atma, sıra bildirimi, kazanma sesi).

### 4. Özelleştirilebilir Oda Ayarları
* **Açılış Limiti**: 34 / 51 / 71 / 101
* **Katlamalı Oyun**: Açık (Ceza çarpanları ×2) / Kapalı
* **Okey Gösterimi**: Açık / Kapalı
* **Bot Zorluğu**: Kolay 🟢 / Orta 🟡 / Zor 🔴
* **Maksimum Ceza Puanı (Elenme Limit)**: 501 / 701 / 1001

### 5. Yapay Zekâ Bot Sistemi
* **Kolay**: Rastgele taş atar, perleri geç oluşturur.
* **Orta**: Basit per ve takım algılama, elindeki en yüksek puansız taşı atar, limiti doldurunca açılır.
* **Zor**: Dinamik el optimizasyonu yapar, potansiyel seri/takımları korur, en ideal hamleyi hesaplar.
* İnsan gibi davranması için **1-3 saniye rastgele düşünme süresi**.

### 6. Ceza Puanı Hesaplama Sistemi
* **Eli Bitiren**: 0 ceza puanı.
* **Açmış ama Bitirememiş**: Elde kalan taşların sayı toplamı.
* **Hiç Açmamış**: Elde kalan taşlar + **101 ceza puanı**.
* **Elde Kalan Okey / Sahte Okey**: +20 ceza puanı.
* **Açmadan Bitene Yakalanma**: +101 ceza.
* **Çiftle / Okeyle Bitene Yakalanma**: +202 ceza.
* **Katlamalı Oyun Açıkken**: Çarpanlar çarpılır (×2, ×4 vb.).
* **CSV İndirme**: El sonunda skor tablosu CSV dosyası olarak indirilebilir.

---

## 🛠 Proje Yapısı

```
Online 101 OKEY/
├── src/
│   ├── types/
│   │   ├── okey.ts            # Oyun state ve TypeScript arayüzleri
│   │   └── socket-events.ts   # Socket event isimleri
│   ├── server/
│   │   ├── server.ts          # Express + Socket.IO sunucu giriş noktası
│   │   ├── roomManager.ts     # Oda ve koltuk yönetimi, 60s kopma tamponu
│   │   ├── engine/
│   │   │   ├── deck.ts        # 106 taş oluşturma, karıştırma, gösterge & okey belirleme
│   │   │   ├── validator.ts   # Seri, Takım, Çift ve limit doğrulama
│   │   │   ├── scorer.ts      # 101 Okey ceza ve elenme hesaplayıcı
│   │   │   └── gameLogic.ts   # Oyun state makinesi ve tur akışı
│   │   └── bot/
│   │       ├── botAi.ts       # Bot AI koordinatörü
│   │       ├── easyBot.ts     # Kolay seviye bot mantığı
│   │       ├── mediumBot.ts   # Orta seviye bot mantığı
│   │       └── hardBot.ts     # Zor seviye bot mantığı
│   ├── lib/
│   │   ├── socketClient.ts    # İstemci tarafı Socket.IO örneği
│   │   └── sound.ts           # Web Audio API ses sentezleyici
│   └── app/
│       ├── page.tsx           # Ana uygulama görünümü ve socket dinleyicileri
│       ├── layout.tsx         # Kök düzen
│       ├── globals.css        # Keçe masa ve glassmorphism stilleri
│       └── components/
│           ├── LoginScreen.tsx
│           ├── LobbyScreen.tsx
│           ├── CreateRoomModal.tsx
│           ├── RoomScreen.tsx
│           ├── ChatBox.tsx
│           └── game/
│               ├── GameTable.tsx
│               ├── TileRack.tsx
│               ├── TileComponent.tsx
│               ├── CenterBoard.tsx
│               ├── TableMelds.tsx
│               ├── OpponentRack.tsx
│               ├── RoundResultModal.tsx
│               └── MatchHistoryModal.tsx
├── package.json
├── tsconfig.json
├── tailwind.config.js
├── next.config.mjs
└── README.md
```

---

## 📜 Lisans
MIT - İstenildiği gibi özgürce kullanılabilir ve geliştirilebilir.
