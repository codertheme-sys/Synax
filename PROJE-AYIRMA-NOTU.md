# ⚠️ ÖNEMLİ: Proje Ayrımı

## 🎯 Synax Platform - Tamamen Ayrı Proje

Synax platformu **tamamen ayrı** bir projedir ve MegaPlayZone ile **hiçbir bağlantısı yoktur**.

## 📁 Proje Klasörleri

| Proje | Klasör | Port | Durum |
|-------|--------|------|-------|
| **MegaPlayZone** | `C:\megaplayzone` | 3000 | ✅ Canlıda (local'de çalışmıyor) |
| **Synax** | `C:\cryptogoldtrading` | 3000 | ✅ Local development |

## ⚠️ ÖNEMLİ NOTLAR

1. **MegaPlayZone** zaten canlıda, local'de çalışmasına gerek yok
2. **Synax** tamamen ayrı proje, karıştırılmamalı
3. **Veritabanı**: Synax için **yeni Supabase projesi** gerekli
4. **Environment Variables**: Synax için **ayrı .env.local** dosyası

## 🔒 Güvenlik

- ✅ Projeler birbirinden tamamen bağımsız
- ✅ Farklı Supabase projeleri kullanılacak
- ✅ Farklı environment variables
- ✅ Farklı deployment

## 📝 Synax Kurulumu

### 1. Yeni Supabase Projesi
- Synax için **yeni** Supabase projesi oluştur
- `database-schema.sql` çalıştır
- `database-manual-prices.sql` çalıştır

### 2. Environment Variables
- `.env.local` dosyası oluştur
- **Yeni** Supabase keys kullan
- MegaPlayZone keys'lerini kullanma!

### 3. Development
```bash
cd C:\cryptogoldtrading
npm run dev
```

**URL**: http://localhost:3000

---

**🎯 Synax tamamen bağımsız bir projedir!**

