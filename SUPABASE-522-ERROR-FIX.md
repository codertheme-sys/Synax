# 🚨 Supabase 522 Hatası - Çözüm Rehberi

## ❌ Hata: `net::ERR_FAILED 522`

**522 hatası** = Cloudflare timeout hatası. Supabase sunucusu yanıt vermiyor.

### 🔍 Neden Olur?

1. **Disk IO Bütçesi Tükendi** (En yaygın)
   - Supabase projeniz çok fazla database işlemi yapıyor
   - Disk IO limiti aşıldı
   - Sunucu yanıt veremiyor

2. **Supabase Sunucu Sorunu**
   - Geçici bir Supabase sorunu
   - Bölgesel network sorunu

3. **Çok Fazla Eşzamanlı İstek**
   - Çok fazla kullanıcı aynı anda işlem yapıyor
   - Rate limit aşıldı

## ✅ Acil Çözümler

### 1. Supabase Projesini Restart Edin (EN ÖNEMLİSİ)

1. **Supabase Dashboard** > **Settings** > **General**
2. **"Restart Project"** butonuna tıklayın
3. 2-3 dakika bekleyin
4. Disk IO bütçesi sıfırlanır

### 2. Disk IO Kullanımını Kontrol Edin

1. **Supabase Dashboard** > **Settings** > **Usage**
2. **Disk IO** bölümünü kontrol edin
3. Eğer %100'e yakınsa, optimizasyonlar yapıldı:
   - ✅ Alert check: 60 saniye
   - ✅ Cron job: 10 dakika
   - ✅ Sadece değişen fiyatlar yazılıyor
   - ✅ Trade page polling azaltıldı

### 3. Tüm Sayfaları Kapatın

1. Tüm tarayıcı sekmelerini kapatın
2. 5 dakika bekleyin
3. Tekrar açın

### 4. Supabase Support'a Başvurun

Eğer restart işe yaramazsa:

1. **Supabase Dashboard** > **Support**
2. Ticket açın:
   - **Subject**: "522 Timeout Error - Disk IO Budget Exhausted"
   - **Description**: "Project experiencing 522 errors. Disk IO budget appears exhausted. Already restarted project but issue persists."
3. Proje ID'nizi ekleyin: `hrvtjwvbmpwwhazrqkrj`

## 🔧 Yapılan Optimizasyonlar

### Kod Tarafında:

1. ✅ **Alert Check**: 3 saniye → 60 saniye
2. ✅ **Cron Job**: 2 dakika → 10 dakika
3. ✅ **Price History**: Sadece değişen fiyatlar yazılıyor
4. ✅ **Trade Page Polling**: 
   - OrderBook: 2s → 10s
   - Orders: 5s → 30s
   - Balance: 5s → 30s
5. ✅ **Fetch Timeout**: 30 saniye timeout eklendi

### Supabase Tarafında:

1. ⚠️ **Proje Restart**: Gerekli
2. ⚠️ **Disk IO Kontrolü**: Usage sayfasından kontrol edin
3. ⚠️ **Support Ticket**: Gerekirse açın

## 📊 Disk IO Kullanımını Azaltmak İçin

### Yapılacaklar:

1. ✅ Tüm optimizasyonlar yapıldı
2. ⏳ Supabase projesini restart edin
3. ⏳ 5 dakika bekleyin
4. ⏳ Tekrar test edin

### Yapılmaması Gerekenler:

- ❌ Çok sık sayfa yenileme
- ❌ Çok fazla eşzamanlı kullanıcı
- ❌ Sürekli API çağrıları

## 🆘 Acil Durum

Eğer hala 522 hatası alıyorsanız:

1. **Supabase Dashboard** açılabilir mi kontrol edin
2. Eğer açılamıyorsa → Supabase'in kendisinde sorun var
3. **Status Page**: https://status.supabase.com kontrol edin
4. **Support**: support@supabase.com

## 📝 Notlar

- 522 hatası **geçici** bir sorundur
- Restart genellikle sorunu çözer
- Disk IO bütçesi **günlük** olarak sıfırlanır
- Pro plan'da daha yüksek limit var

---

**Son Güncelleme**: 2026-01-22
**Durum**: Optimizasyonlar tamamlandı, restart gerekli
