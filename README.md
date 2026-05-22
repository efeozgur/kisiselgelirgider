# FinansApp - Kişisel Gelir Gider Takip Uygulaması

Modern ve şık bir kişisel finans yönetim uygulaması. Gelir ve giderlerinizi takip edin, bütçenizi yönetin, taksitlerinizi planlayın ve finansal raporlarınızı görüntüleyin.

## Ozellikler

### Ana Ozellikler
- **Islem Takibi** - Gelir, gider ve transfer islemlerini kolayca kaydedin
- **Hesap Yonetimi** - Nakit, banka, kredi karti, yatirim ve kripto hesaplari destekleyin
- **Kategori Sistemi** - Harcamalarinizi kategorilere ayirin
- **Butce Planlamasi** - Aylik ve haftalik butce limitleri belirleyin
- **Taksit Takibi** - Taksitli alisverislerinizi yonetip odeme planini gorun
- **Borc/Alacak** - Kisiler veya kurumlar arasi borc ve alacaklarinizi takip edin
- **Finansal Raporlar** - Detayli raporlar olusturun ve Excel/PDF olarak aktarin

### Desteklenen Ozellikler
- **Glassmorphism Tasarim** - Modern ve şeffaf arayuz
- **SQLite Veritabani** - Tarayicida local olarak verileriniz saklanir
- **Demo Veri** - Uygulamayi hizlica test etmek icin ornek veriler
- **Veri Yedekleme** - JSON veya Excel formatinda verilerinizi aktarin

## Teknolojiler

- **Frontend**: React 19 + Vite 8
- **Styling**: Tailwind CSS 4 (Glassmorphism efekti)
- **Veritabani**: sql.js (SQLite - tarayici icinde)
- **Grafiger**: Recharts
- **PDF**: jsPDF
- **Excel**: SheetJS (xlsx)
- **Ikeler**: Lucide React

## Kurulum

### Gereksinimler
- Node.js 18+ 
- npm veya yarn

### Adimlar

1. **Projeyi klonlayin:**
```bash
git clone https://github.com/KULLANICI_ADIN/kisiselgelirgider.git
cd kisiselgelirgider
```

2. **Bagimliliklari yukleyin:**
```bash
npm install
```

3. **Uygulamayi baslatin:**
```bash
npm run dev
```

4. **Tarayicida acin:**
```
http://localhost:5173
```

## Proje Yapisi

```
src/
├── components/          # Tekrar kullanilabilir UI bileşenleri
│   ├── charts/        # Grafik bileşenleri (Pasta, Bar, Cizgi)
│   ├── layout/        # Sayfa düzeni (Sidebar, Layout)
│   └── ui/            # Temel UI bileşenleri (Button, Card, Modal)
├── contexts/          # React Context'leri
│   └── ThemeContext   # Tema yonetimi (sadece koyu tema)
├── database/           # Veritabani islemleri
│   └── db.js          # SQLite baglantisi ve sorgulari
├── pages/              # Sayfa bileşenleri
│   ├── Accounts.jsx    # Hesaplar sayfasi
│   ├── Budgets.jsx     # Butce sayfasi
│   ├── Categories.jsx # Kategoriler sayfasi
│   ├── Dashboard.jsx   # Ana panel
│   ├── Debts.jsx      # Borc/Alacak sayfasi
│   ├── Installments.jsx # Taksitler sayfasi
│   ├── Reports.jsx     # Raporlar sayfasi
│   ├── Settings.jsx    # Ayarlar sayfasi
│   └── Transactions.jsx # Islemler sayfasi
├── services/            # servis katmani
│   └── services.js    # Veritabani servis fonksiyonlari
└── utils/              # Yardimci fonksiyonlar
    └── helpers.js      # Para birimi, tarih formatlama
```

## Kullanim

### Islem Ekleme
1. Sol panelden "Islemler" sekmesine tiklayin
2. "Yeni Islem" butonuna tiklayin
3. Tur (gelir/gider/transfer), tutar, tarih ve kategori secin
4. Kaydet'e tiklayin

### Hesap Olusturma
1. "Hesaplar" sekmesine gidin
2. "Yeni Hesap" butonuna tiklayin
3. Hesap turu (nakit, banka, kredi karti vb.) ve adini girin
4. Baslangic bakiyesini ayarlayin ve kaydedin

### Butce Olusturma
1. "Butce" sekmesine gidin
2. Yeni butce olusturun ve kategori ile limit belirleyin
3. Uyar esigi (varsayilan %80) ayarlayin

### Rapor Olusturma
1. "Raporlar" sekmesine gidin
2. Tarih araligi secin
3. Excel veya PDF olarak aktarin

### Veri Yedekleme (Ayarlar)
- **JSON Yedek**: Veritabaninin tam yedegini indirin
- **JSON Geri Yukle**: Onceden indirdiginiz yedegi geri yukleyin
- **Excel Export**: Hesap ve kategori bilgilerini Excel'e aktarin
- **Tum Verileri Sil**: Tum verileri temizleyip sifirdan baslayin

## Yapilandirma

### Tema
Uygulama sadece koyu tema ile gelir. Tema ayarlari Settings sayfasindan yonetilebilir.

### Veritabani
Veriler tarayicida localStorage'da saklanir. Farkli tarayicilarda veriler ayri olacaktir.

### sql-wasm Dosyasi
SQLite veritabani icin gerekli WebAssembly dosyasi `public/` klasorundedir ve production'da dogrudan erisilebilir olmalidir.

## Gelistirme

### Komutlar

| Komut | Aciklama |
|-------|----------|
| `npm run dev` | Gelistirme sunucusunu baslat |
| `npm run build` | Production build olustur |
| `npm run preview` | Production build'i onizle |
| `npm run lint` | ESLint ile kod kontrolu |

### Kod Standardi
- ESLint kurallari otomatik olarak uygulanir
- React Hooks kurallari etkin
- React Refresh destekli (hizli yeniden yukleme)

## Lisans

Bu proje kisisel kullanım icin gelistirilmistir.

## Katki

1. Fork yapin
2. Feature branch olusturun (`git checkout -b feature/yeni-ozellik`)
3. Commit yapin (`git commit -m 'Yeni ozellik eklendi'`)
4. Branch'i push edin (`git push origin feature/yeni-ozellik`)
5. Pull Request acin

## Notlar

- Veritabani dosyasi (`sql-wasm.wasm`) production ortaminda `public/` klasorunde kalmalidir
- Tum veriler tarayici icinde saklanir, sunucuya gonderilmez
- Buyuk raporlar icin PDF yerine Excel export kullanilmasi tavsiye edilir
