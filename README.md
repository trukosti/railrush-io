# 🚂 RailRush.io

Dinamik ray döşeme kapışması oyunu - Oyuncular hareket halindeki vagonlarını ray koyarak yönlendirir, kaynak toplayıp hız/çarpma oyunuyla rakipleri ray dışına iter.

## 🎮 Oyun Özellikleri

### Temel Mekanikler
- **Ray Döşeme**: Oyuncular hareket ederken ray döşerek yol oluşturur
- **Kaynak Toplama**: Altın kaynakları toplayarak skor ve ray kazanır
- **Çarpışma Sistemi**: Diğer oyuncularla çarpışarak onları ray dışına iter
- **Güçlendiriciler**: Hız, kalkan, mıknatıs ve boost güçlendiricileri
- **Sınırlı Ray Stoğu**: Stratejik ray kullanımı gerekli

### Teknik Özellikler
- **Gerçek Zamanlı Multiplayer**: Socket.IO ile 20 Hz server tick
- **İstemci Tarafı Interpolasyon**: Akıcı oyun deneyimi
- **Spatial Hash**: Optimize edilmiş çarpışma kontrolü
- **Responsive Tasarım**: Mobil ve masaüstü uyumlu
- **Modern UI**: Orbitron fontu ile futuristik tasarım

## 🛠️ Teknoloji Stack

### Backend
- **Node.js**: Sunucu runtime
- **Express**: Web framework
- **Socket.IO**: Gerçek zamanlı iletişim
- **Redis**: Oda durumu ve önbellek
- **PostgreSQL**: Kalıcı veri depolama

### Frontend
- **Vanilla JavaScript**: Modern ES6+ özellikleri
- **Canvas 2D**: Oyun grafikleri
- **CSS3**: Animasyonlar ve responsive tasarım
- **WebSocket**: Gerçek zamanlı iletişim

## 📦 Kurulum

### Gereksinimler
- Node.js 16+ 
- Redis 6+
- PostgreSQL 12+

### 1. Projeyi Klonlayın
```bash
git clone https://github.com/yourusername/railrush-io.git
cd railrush-io
```

### 2. Bağımlılıkları Yükleyin
```bash
npm install
```

### 3. Veritabanını Kurun
```bash
# PostgreSQL'de veritabanı oluşturun
createdb railrush

# Environment variables ayarlayın
cp .env.example .env
```

### 4. Environment Variables
`.env` dosyasını düzenleyin:
```env
# Server
PORT=3000
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=railrush
DB_USER=postgres
DB_PASSWORD=your_password

# Redis
REDIS_URL=redis://localhost:6379
```

### 5. Sunucuyu Başlatın
```bash
# Development modu
npm run dev

# Production modu
npm start
```

### 6. Tarayıcıda Açın
```
http://localhost:3000
```

## 🎯 Oyun Kontrolleri

### Klavye
- **WASD / Ok Tuşları**: Hareket
- **SPACE**: Ray Döş
- **SHIFT**: Hızlanma
- **ESC**: Menü

### Mobil
- **Dokunma**: Hareket yönü
- **Çift Dokunma**: Ray Döş

## 🏗️ Proje Yapısı

```
railrush-io/
├── server/                 # Backend kodları
│   ├── index.js           # Ana sunucu dosyası
│   ├── game/              # Oyun mantığı
│   │   ├── GameManager.js # Oyun yöneticisi
│   │   ├── GameRoom.js    # Oda yönetimi
│   │   ├── Player.js      # Oyuncu sınıfı
│   │   └── RailSegment.js # Ray segmenti
│   └── database/          # Veritabanı işlemleri
│       └── DatabaseManager.js
├── public/                # Frontend dosyaları
│   ├── index.html         # Ana HTML
│   ├── css/               # Stil dosyaları
│   │   └── style.css
│   ├── js/                # JavaScript dosyaları
│   │   ├── utils.js       # Yardımcı fonksiyonlar
│   │   ├── input.js       # Giriş yönetimi
│   │   ├── renderer.js    # Grafik motoru
│   │   ├── game.js        # Oyun mantığı
│   │   ├── ui.js          # Kullanıcı arayüzü
│   │   └── main.js        # Ana uygulama
│   └── assets/            # Ses ve görsel dosyalar
├── package.json           # Proje bağımlılıkları
└── README.md             # Bu dosya
```

## 🚀 Deployment

### Production Build
```bash
npm run build
```

### PM2 ile Deployment
```bash
npm install -g pm2
pm2 start server/index.js --name railrush
pm2 save
pm2 startup
```

### Docker ile Deployment
```bash
docker build -t railrush-io .
docker run -p 3000:3000 railrush-io
```

## 📊 Performans

### Sunucu Özellikleri
- **Oda Başına**: 40-60 oyuncu
- **Server Tick**: 20 Hz
- **Çarpışma Kontrolü**: Spatial Hash
- **Bellek Kullanımı**: ~50MB/oda

### İstemci Özellikleri
- **FPS**: 60 FPS hedef
- **Gecikme**: <100ms interpolasyon
- **Bellek**: <100MB kullanım

## 🔧 Geliştirme

### Debug Modu
```
http://localhost:3000?debug=true
```

### Debug Kısayolları
- **F1**: Debug Paneli
- **F2**: Performans İstatistikleri
- **F3**: Oyunu Sıfırla

### Kod Standartları
```bash
# Linting
npm run lint

# Formatting
npm run format

# Testing
npm test
```

## 🎨 Özelleştirme

### Yeni Skins Ekleme
`public/js/ui.js` dosyasında `skins` array'ine ekleyin:
```javascript
{ id: 'new_skin', name: 'Yeni Skin', emoji: '🚂', unlocked: true }
```

### Yeni Güçlendiriciler
`server/game/GameRoom.js` dosyasında `spawnPowerUp` fonksiyonunu güncelleyin.

## 📈 Analytics

### Oyun İstatistikleri
- Aktif oyuncu sayısı
- Oda sayısı
- Ortalama oyun süresi
- Skor dağılımı

### API Endpoints
- `GET /health`: Sunucu durumu
- `GET /stats`: Oyun istatistikleri
- `GET /leaderboard`: Lider tablosu

## 🤝 Katkıda Bulunma

1. Fork yapın
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Commit yapın (`git commit -m 'Add amazing feature'`)
4. Push yapın (`git push origin feature/amazing-feature`)
5. Pull Request oluşturun

## 📝 Lisans

Bu proje MIT lisansı altında lisanslanmıştır. Detaylar için `LICENSE` dosyasına bakın.

## 🙏 Teşekkürler

- [Socket.IO](https://socket.io/) - Gerçek zamanlı iletişim
- [Express](https://expressjs.com/) - Web framework
- [Canvas API](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API) - Grafik motoru

## 📞 İletişim

- **Proje Linki**: [https://github.com/yourusername/railrush-io](https://github.com/yourusername/railrush-io)
- **Issues**: [https://github.com/yourusername/railrush-io/issues](https://github.com/yourusername/railrush-io/issues)

---

**RailRush.io** - Dinamik ray döşeme kapışması oyunu 🚂 