# Supabase'de "Enable Email Confirmations" Toggle'ını Bulma Rehberi

## ⚠️ ÖNEMLİ: Doğru Yer

**"Enable email confirmations" toggle'ı şu yerlerde DEĞİL:**
- ❌ Authentication → Email → Templates
- ❌ Authentication → Email → SMTP Settings
- ❌ Authentication → Email (genel)

**"Enable email confirmations" toggle'ı şurada:**
- ✅ **Authentication → Settings** (Settings sekmesi!)

## Adım Adım Bulma

### 1. Supabase Dashboard'a Gidin
- Projenize giriş yapın
- Sol menüden **"Authentication"** seçin

### 2. Settings Sekmesine Gidin
- Üstteki sekmeleri kontrol edin:
  - **"Users"** ❌ (bu değil)
  - **"Policies"** ❌ (bu değil)
  - **"Settings"** ✅ (BURASI!)
  - **"Email Templates"** ❌ (bu değil)
  - **"SMTP Settings"** ❌ (bu değil)

### 3. Settings Sekmesinde Arayın
- Settings sekmesine tıklayın
- Aşağı kaydırın ve şu bölümleri kontrol edin:
  - **"Email"** bölümü
  - **"User Management"** bölümü
  - **"Auth"** bölümü

### 4. Toggle'ı Bulun
- **"Enable email confirmations"** veya **"Confirm email"** yazan bir toggle arayın
- Bu toggle **AÇIK (ON)** olmalı

## Alternatif Yerler

Eğer Settings sekmesinde bulamazsanız, şu yerleri de kontrol edin:

1. **Settings → API**
   - Site URL ayarlarının yanında olabilir

2. **Settings → Auth**
   - Auth genel ayarları içinde olabilir

3. **Authentication → Configuration**
   - Bazı Supabase versiyonlarında burada olabilir

## Görsel İpucu

Settings sekmesinde şöyle bir toggle arayın:
```
☐ Enable email confirmations
   Ask users to confirm their email address after signing up
```

Veya:
```
☐ Confirm email
   Users must confirm their email before logging in
```

## Hala Bulamıyorsanız

1. **Supabase versiyonunuzu kontrol edin:**
   - Yeni versiyonlarda yer değişmiş olabilir
   - Settings → API → "Site URL" yanında olabilir

2. **Arama kutusunu kullanın:**
   - Supabase dashboard'da arama yapın: "email confirmations"

3. **Supabase dokümantasyonunu kontrol edin:**
   - https://supabase.com/docs/guides/auth/auth-email-templates

4. **Manuel kontrol:**
   - Authentication → Users → Bir kullanıcıya tıklayın
   - "Send confirmation email" butonu varsa, toggle açık demektir
   - Yoksa, toggle kapalı olabilir

## Test Etme

Toggle'ı bulduktan sonra:

1. **Toggle'ı AÇIK yapın**
2. **Yeni bir test hesabı oluşturun**
3. **E-postayı kontrol edin** (spam klasörü dahil)
4. **Auth Logs'u kontrol edin:**
   - Logs → Auth Logs
   - E-posta gönderim kayıtlarını görün

## Not

SMTP Settings'te gördüğünüz ayarlar:
- Sadece **e-posta gönderim servisini** yapılandırır
- Custom SMTP kullanmak için doldurulur
- **"Enable email confirmations" toggle'ı ile ilgisi yok!**

E-posta gönderimi için:
1. ✅ **"Enable email confirmations" toggle'ı AÇIK olmalı** (Settings sekmesinde)
2. ✅ **Email template aktif olmalı** (Templates sekmesinde - zaten kontrol edildi)
3. ⚠️ **SMTP ayarları** (isteğe bağlı - built-in service de çalışır)





