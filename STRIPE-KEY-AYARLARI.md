# 💳 Stripe Key Ayarları - Synax Platform

## 🔑 Key Türleri

### Test Mode (Sandbox) - `pk_test_` ve `sk_test_`
- ✅ **Test amaçlı** - Gerçek para işlemez
- ✅ **Geliştirme aşamasında** kullanılır
- ✅ **Ücretsiz** - Limit yok
- ❌ **Gerçek para** işlemleri yapılamaz

### Production Mode (Live) - `pk_live_` ve `sk_live_`
- ✅ **Gerçek para** işlemleri yapar
- ✅ **Canlı platform** için gerekli
- ⚠️ **Dikkatli kullanılmalı** - Gerçek para!
- 💰 **Stripe ücretleri** uygulanır

## 📋 Mevcut Durum

Şu anda **Sandbox (Test) key'leri** kullanıyorsunuz:
- `pk_test_...` (Publishable Key)
- `sk_test_...` (Secret Key)

## ✅ Sandbox Key'leri ile Yapabilecekleriniz

1. ✅ **Test ödemeleri** yapabilirsiniz
2. ✅ **Tüm özellikleri test** edebilirsiniz
3. ✅ **Webhook'ları test** edebilirsiniz
4. ✅ **Geliştirme** yapabilirsiniz

## ❌ Sandbox Key'leri ile Yapamayacaklarınız

1. ❌ **Gerçek para** işlemleri yapılamaz
2. ❌ **Müşterilerden gerçek ödeme** alınamaz
3. ❌ **Canlı platform** için uygun değil

## 🔄 Production'a Geçiş

### Ne Zaman Production Key'leri Kullanmalı?

- ✅ Platform **canlıya** alındığında
- ✅ **Gerçek müşteriler** ödeme yapmaya başladığında
- ✅ **Test aşaması** tamamlandığında

### Production Key'leri Nasıl Alınır?

1. Stripe Dashboard'a gidin
2. Sağ üstte **"Test mode"** toggle'ını **KAPATIN**
3. **Developers** > **API keys** bölümüne gidin
4. **"Reveal live key"** butonuna tıklayın
5. **Live keys** görünecek:
   - `pk_live_...` (Publishable Key)
   - `sk_live_...` (Secret Key)

### ⚠️ ÖNEMLİ: Production Key Güvenliği

- 🔒 **Secret key'i asla paylaşmayın**
- 🔒 **GitHub'a commit etmeyin**
- 🔒 **Sadece environment variables'da** kullanın
- 🔒 **.env.local** dosyasını `.gitignore`'a ekleyin

## 🧪 Test Kartları (Sandbox Mode)

Stripe test mode'da şu kartları kullanabilirsiniz:

### Başarılı Ödeme
```
Kart Numarası: 4242 4242 4242 4242
CVV: Herhangi bir 3 haneli sayı (örn: 123)
Expiry: Gelecek bir tarih (örn: 12/25)
```

### Başarısız Ödeme
```
Kart Numarası: 4000 0000 0000 0002
CVV: Herhangi bir 3 haneli sayı
Expiry: Gelecek bir tarih
```

### 3D Secure Gerektiren
```
Kart Numarası: 4000 0025 0000 3155
CVV: Herhangi bir 3 haneli sayı
Expiry: Gelecek bir tarih
```

## 📝 Environment Variables

### Test Mode (Şu Anki)
```env
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_test_...
```

### Production Mode (Canlı Platform)
```env
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_live_...
```

## 🔄 Kod Değişikliği Gerekli mi?

**HAYIR!** Kod zaten her iki modu da destekliyor:
- Test key'leri (`sk_test_`) → Test mode
- Live key'leri (`sk_live_`) → Production mode

Sadece environment variables'ı değiştirmeniz yeterli!

## ✅ Şu Anki Durum İçin Öneri

### Geliştirme/Test Aşaması (Şu An)
- ✅ **Sandbox key'leri kullanın** (şu anki durum)
- ✅ **Test kartları** ile test edin
- ✅ **Tüm özellikleri** test edin
- ✅ **Webhook'ları** test edin

### Production'a Geçerken
1. Stripe Dashboard'da **Test mode'u kapatın**
2. **Live keys** alın
3. Environment variables'ı güncelleyin
4. **Webhook URL'lerini** güncelleyin (production domain)
5. **Test edin** (küçük bir gerçek ödeme ile)

## 🎯 Sonuç

**Sandbox key'leri şu an için SORUN DEĞİL!**

- ✅ Geliştirme için mükemmel
- ✅ Test için yeterli
- ✅ Ücretsiz ve limitsiz
- ⚠️ Sadece gerçek para işlemleri yapamazsınız

**Production'a geçerken live key'lere geçiş yapmanız yeterli!**

---

**💡 İpucu:** Test aşamasında sandbox kullanın, canlıya alırken live key'lere geçin!

