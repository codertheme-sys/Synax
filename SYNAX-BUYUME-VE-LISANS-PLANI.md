# Synax Büyüme, White-Label ve Lisans Planı

Bu doküman Synax platformunun büyütülmesi, white-label çözümleri, lisans süreçleri ve güven/domain yaşı konularını kapsar.

---

## BÖLÜM 1: Synax Büyüme Planı

### Faz 1: Temel Güçlendirme (0-3 ay)

| Öncelik | Aksiyon | Detay |
|---------|---------|-------|
| 1 | **Referans programı** | Mevcut kullanıcılar yeni kullanıcı getirince komisyon indirimi |
| 2 | **SEO optimizasyonu** | Meta tags, sitemap, blog (Trading 101, Gold vs Crypto vb.) |
| 3 | **Sosyal kanallar** | Twitter/X, Telegram, Discord toplulukları |
| 4 | **Güvenlik işaretleri** | SSL, 2FA vurgusu, "As featured in" bölümü |
| 5 | **Müşteri hikayeleri** | Testimonials, kullanıcı sayıları (gerçek verilerle) |

### Faz 2: Özellik Genişletme (3-6 ay)

| Özellik | Açıklama | Öncelik |
|---------|----------|---------|
| Referral dashboard | Kullanıcıların referral link ve kazançlarını görmesi | Yüksek |
| Daha fazla coin | Popüler altcoin'ler (SOL, XRP, DOGE vb.) | Yüksek |
| Fiat on/off ramp | Daha fazla para yatırma/çekme yöntemi | Yüksek |
| Mobile app (PWA/APK) | Ana ekrana ekleme, push bildirim | Orta |
| Staking / Earn | Kullanıcıların varlıklarını kilitlemesi | Orta |
| Affiliate program | Dış ortaklar için komisyon sistemi | Orta |

### Faz 3: Ölçeklendirme (6-12 ay)

| Aksiyon | Detay |
|---------|-------|
| Bölgesel odak | Belirli ülkelere özel kampanyalar |
| Kurumsal hedefler | B2B API, kurumsal hesaplar |
| Yeni varlık sınıfları | Hisse senetleri, forex (lisans gerektirir) |
| White-label satışı | Aşağıda detaylı |

---

## BÖLÜM 2: White-Label Çözümler

### White-Label Nedir?

Synax altyapısını başka markaların kendi isimleriyle kullanması. Siz altyapıyı sağlarsınız, onlar kendi domain ve markasıyla hizmet verir.

### Gelir Modeli

| Model | Açıklama | Örnek |
|-------|----------|-------|
| **Kurulum ücreti** | Tek seferlik | $5.000 - $20.000 |
| **Aylık lisans** | SaaS abonelik | $500 - $2.000/ay |
| **İşlem payı** | Her işlemden % | %0.05 - %0.2 |
| **Hibrit** | Kurulum + aylık + pay | En yaygın |

### White-Label Teknik Gereksinimleri

| Özellik | Açıklama |
|---------|----------|
| Multi-tenant mimari | Her müşteri kendi veritabanı/namespace |
| White-label config | Logo, renkler, domain, email template'leri |
| API anahtarları | Müşteri bazlı Stripe, Supabase |
| Admin paneli | Müşteri kendi kullanıcılarını yönetir |

### Uygulama Adımları

1. **Config sistemi:** `tenant_id` veya `brand_id` ile tema/logo/domain eşlemesi
2. **Subdomain veya custom domain:** `client1.synax.vip` veya `client1.com` → Synax backend
3. **Fiyatlandırma sayfası:** White-label paketleri ve fiyatlar
4. **Onboarding:** Yeni müşteri için otomatik kurulum (Supabase project, Stripe account vb.)

### Tahmini Maliyet (White-Label Geliştirme)

| Kalem | Süre | Maliyet |
|-------|------|---------|
| Multi-tenant mimari | 2-3 ay | $15.000 - $40.000 |
| White-label UI/config | 1 ay | $5.000 - $15.000 |
| Dokümantasyon & onboarding | 2 hafta | $2.000 - $5.000 |
| **Toplam** | **3-4 ay** | **$22.000 - $60.000** |

---

## BÖLÜM 3: Lisans ve Regülasyon

### Hangi Lisanslar Gerekebilir?

| Ülke/Bölge | Lisans | Açıklama | Tahmini Maliyet |
|------------|--------|----------|-----------------|
| **AB** | MiCA (Markets in Crypto-Assets) | Kripto varlık hizmetleri | €50.000 - €200.000+ |
| **UK** | FCA Crypto Registration | Kripto faaliyet bildirimi | £2.000 - £10.000 |
| **ABD** | State MSB (Money Services Business) | Eyalet bazlı, 50 eyalet | $5.000 - $50.000 |
| **ABD** | FinCEN MSB | Federal kayıt | $1.500 (kayıt) |
| **Türkiye** | SPK (Sermaye Piyasası Kurulu) | Kripto borsa faaliyeti | Değişken |
| **UAE** | VARA (Dubai) | Kripto lisansı | $10.000 - $100.000+ |
| **Singapur** | MAS | DPT (Digital Payment Token) | $50.000+ |
| **Estonya** | MTR (Money Transmitter) | Avrupa girişi için popüler | €10.000 - €50.000 |

### Lisans Alma Süreci (Genel)

#### 1. Şirket Kurulumu

- Limited şirket veya benzeri yapı
- Kayıtlı adres (genelde lisans alınacak ülkede)
- Yetkili yöneticiler ve uyum sorumlusu

#### 2. Başvuru Hazırlığı

- İş modeli dokümanı
- AML/KYC politikaları
- Risk değerlendirmesi
- Teknik altyapı açıklaması
- Finansal projeksiyonlar

#### 3. Başvuru ve İnceleme

- Resmi başvuru formu
- Ücret ödemesi
- Soru-cevap ve ek belge talepleri
- Süre: 3-12 ay (ülkeye göre)

#### 4. Sürekli Uyumluluk

- Periyodik raporlama
- Denetimler
- Politika güncellemeleri

### Önerilen Başlangıç: Düşük Regülasyonlu Yargı Bölgeleri

| Seçenek | Avantaj | Dezavantaj |
|---------|---------|------------|
| **Estonya** | AB erişimi, nispeten hızlı | E-ikamet gerekebilir |
| **Lithuania** | Fintech odaklı | Rekabet yoğun |
| **UAE (RAK, ADGM)** | Vergi avantajı | Yüksek maliyet |
| **Sadece web, lisans yok** | Düşük maliyet | Bazı ülkelerde risk |

### Lisans Olmadan Çalışma

- Birçok küçük platform lisans almadan faaliyet gösteriyor
- Risk: Bazı ülkelerde yasal sorun, hesap kapatma, para cezası
- Öneri: Hedef pazarı belirleyip o ülkenin kurallarını inceleyin; uzun vadede lisans planlayın

---

## BÖLÜM 4: Domain Yaşı ve Güven

### Domain Yaşı Nasıl Görünür?

Domain yaşı **WHOIS** kaydından gelir. `whois synax.vip` veya benzeri araçlarla "Creation Date" görünür. Bu veri **değiştirilemez**; kayıt tarihi sabittir.

### Yasal Yöntemlerle "Daha Eski" Görünmek

#### Seçenek A: Eski Domain Satın Alma

- Sedo, Afternic, GoDaddy Auctions gibi platformlardan 2-3 yıllık domain alınabilir
- Örnek: `synax-trading.com` (2022'de kayıtlı) satın alınıp ana domain olarak kullanılır
- Maliyet: $500 - $5.000+ (domain'e göre)
- **Dikkat:** Domain değişince mevcut SEO ve marka bilinirliği etkilenir

#### Seçenek B: Şirket Kuruluş Tarihi

- Domain yaşı ≠ şirket yaşı
- Şirket 2022'de kurulduysa: "Synax, 2022'den beri faaliyette" ifadesi doğru olabilir
- About sayfasında: "Founded 2022 | Platform launched 2025" gibi net ifadeler

#### Seçenek C: Trust Sinyalleri (Domain Yaşından Bağımsız)

| Sinyal | Açıklama |
|--------|----------|
| **Güvenlik denetimi** | Smart contract / platform audit (CertiK, Hacken vb.) |
| **Ortaklıklar** | Bilinen şirketlerle işbirliği |
| **Basın** | Haber sitelerinde yer alma |
| **Sosyal kanıt** | Kullanıcı sayısı, işlem hacmi (gerçek veriler) |
| **Şeffaflık** | Takım, ofis adresi, iletişim bilgileri |
| **Lisans bilgisi** | Varsa lisans numarası ve kurum adı |

### Önerilen Yaklaşım

1. **Şirket kuruluş tarihi:** Mümkünse şirketi erken tarihle kurun veya mevcut şirketin kuruluş tarihini kullanın
2. **About sayfası:** "Established 2022" veya "Founded 2022" – sadece yasal olarak doğruysa
3. **Trust odaklı içerik:** Domain yaşı yerine güvenlik, lisans, ortaklık vurgulayın
4. **Zamanla güven:** 6-12 ay tutarlı hizmet, iyi destek ve şeffaflık en güçlü sinyaldir

### Yapılmaması Gerekenler

- WHOIS bilgisini sahte göstermek (yasadışı)
- Gerçekte olmayan kuruluş tarihi kullanmak (yanıltıcı)
- Sahte "As seen in" veya basın logoları (güven kaybı)

---

## BÖLÜM 5: Uygulama Önerileri

### Kısa Vadede (0-3 ay)

1. About sayfasına şirket kuruluş tarihi ekleyin (yasal olarak doğruysa)
2. Referral programını tasarlayıp devreye alın
3. SEO için blog veya rehber sayfaları ekleyin
4. Trust bölümü: SSL, 2FA, güvenlik önlemleri

### Orta Vadede (3-6 ay)

1. White-label için teknik altyapıyı planlayın
2. Hedef ülkeye göre lisans araştırması yapın
3. Güvenlik audit’i için fiyat teklifi alın
4. APK dağıtımını başlatın (PWA Builder veya benzeri)

### Uzun Vadede (6-12 ay)

1. White-label ilk müşteriyi hedefleyin
2. Lisans başvurusu (hedef pazara göre)
3. Bölgesel pazarlama kampanyaları
4. Kurumsal (B2B) ürün geliştirme

---

## Özet Tablo

| Konu | Öneri | Tahmini Süre |
|------|-------|--------------|
| **Büyüme** | Referral + SEO + sosyal kanallar | 3-6 ay |
| **White-label** | Multi-tenant mimari, config sistemi | 3-4 ay geliştirme |
| **Lisans** | Önce hedef pazar, sonra Estonya/UAE gibi seçenekler | 6-24 ay |
| **Domain/Trust** | Şirket tarihi + güven sinyalleri, sahte bilgi yok | Sürekli |

---

*Bu doküman genel bilgi amaçlıdır. Yasal ve mali kararlar için mutlaka avukat ve mali müşşavir ile çalışın.*
