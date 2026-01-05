# Vercel DNS Kayıtlarını Bulma ve Namecheap'te Yapılandırma

## 1. Vercel'de DNS Kayıtlarını Bulma

### Adım 1: Domain Ekleme Sonrası
1. Vercel Dashboard → Projeniz → **"Settings"** → **"Domains"**
2. Domain ekledikten sonra, domain'in yanında **"Invalid Configuration"** yazısı görünecek
3. Domain kartının içinde DNS kayıtları gösterilir

### Adım 2: DNS Kayıtlarını Görüntüleme
Domain ekledikten sonra Vercel size şu bilgileri gösterir:

**Eğer görmüyorsanız:**
1. Domain kartına tıklayın veya **"Edit"** butonuna tıklayın
2. Aşağı kaydırın - DNS kayıtları genellikle sayfanın alt kısmında gösterilir
3. Veya domain'in yanındaki **"..."** (üç nokta) menüsüne tıklayın → **"View DNS Records"**

### Adım 3: Vercel'in Gösterdiği DNS Kayıtları
Vercel genellikle şu kayıtları gösterir:

**A Record (Root Domain için - `synax.vip`):**
```
Type: A
Name: @
Value: 76.76.21.21 (veya başka bir IP)
TTL: Automatic
```

**CNAME Record (www için - `www.synax.vip`):**
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
TTL: Automatic
```

**VEYA sadece CNAME:**
```
Type: CNAME
Name: @
Value: cname.vercel-dns.com
TTL: Automatic
```

**Not:** Vercel'in size gösterdiği **tam değerleri** kullanın. Yukarıdakiler örnektir.

---

## 2. Namecheap'te DNS Kayıtlarını Yapılandırma

### Adım 1: Mevcut Kayıtları Temizleme
1. Namecheap → Domain List → `synax.vip` → **"Advanced DNS"**
2. Mevcut kayıtları silin:
   - ❌ **CNAME Record:** `www` → `parkingpage.namecheap.com.` (SİL)
   - ❌ **URL Redirect Record:** `@` → `http://www.synax.vip/` (SİL)
3. Her kaydın yanındaki **çöp kutusu** ikonuna tıklayarak silin

### Adım 2: Vercel DNS Kayıtlarını Ekleme

**Seçenek 1: Vercel A Record + CNAME kullanıyorsa**

1. **A Record ekleyin (Root domain için):**
   - **"ADD NEW RECORD"** butonuna tıklayın
   - **Type:** `A Record` seçin
   - **Host:** `@` yazın
   - **Value:** Vercel'in verdiği IP adresini yazın (örn: `76.76.21.21`)
   - **TTL:** `Automatic` veya `30 min` seçin
   - **Kaydet** (✓ işaretine tıklayın)

2. **CNAME Record ekleyin (www için):**
   - **"ADD NEW RECORD"** butonuna tıklayın
   - **Type:** `CNAME Record` seçin
   - **Host:** `www` yazın
   - **Value:** Vercel'in verdiği CNAME değerini yazın (örn: `cname.vercel-dns.com`)
   - **TTL:** `Automatic` veya `30 min` seçin
   - **Kaydet** (✓ işaretine tıklayın)

**Seçenek 2: Vercel sadece CNAME kullanıyorsa**

1. **CNAME Record ekleyin (Root domain için):**
   - **"ADD NEW RECORD"** butonuna tıklayın
   - **Type:** `CNAME Record` seçin
   - **Host:** `@` yazın
   - **Value:** Vercel'in verdiği CNAME değerini yazın (örn: `cname.vercel-dns.com`)
   - **TTL:** `Automatic` veya `30 min` seçin
   - **Kaydet** (✓ işaretine tıklayın)

2. **CNAME Record ekleyin (www için):**
   - **"ADD NEW RECORD"** butonuna tıklayın
   - **Type:** `CNAME Record` seçin
   - **Host:** `www` yazın
   - **Value:** Vercel'in verdiği CNAME değerini yazın (aynı değer)
   - **TTL:** `Automatic` veya `30 min` seçin
   - **Kaydet** (✓ işaretine tıklayın)

---

## 3. Vercel'de DNS Kayıtlarını Bulamıyorsanız

### Yöntem 1: Domain Edit Sayfasında
1. Vercel → Domains → Domain'in yanındaki **"Edit"** butonuna tıklayın
2. Sayfanın altına kaydırın
3. **"DNS Configuration"** veya **"Configure DNS"** bölümünü bulun
4. Orada DNS kayıtları listelenir

### Yöntem 2: Domain Detay Sayfasında
1. Domain adına tıklayın (kartın kendisine)
2. Açılan sayfada **"DNS Records"** veya **"Configuration"** sekmesine bakın
3. DNS kayıtları orada gösterilir

### Yöntem 3: Vercel'in Genel DNS Bilgileri
Eğer Vercel size özel DNS kayıtları göstermiyorsa, genellikle şu kayıtları kullanabilirsiniz:

**A Record:**
- Host: `@`
- Value: `76.76.21.21`

**CNAME Record:**
- Host: `www`
- Value: `cname.vercel-dns.com`

**AMA:** Vercel'in size gösterdiği tam değerleri kullanmak en doğrusudur.

---

## 4. Namecheap'te Son Kontrol

DNS kayıtlarını ekledikten sonra:

1. **Kayıtların doğru olduğundan emin olun:**
   - Host değerleri doğru mu? (`@` ve `www`)
   - Value değerleri Vercel'in verdiği ile aynı mı?
   - TTL değerleri ayarlı mı?

2. **Kaydet:**
   - Her kaydı ekledikten sonra **✓ (checkmark)** işaretine tıklayın
   - Tüm kayıtlar eklendikten sonra sayfayı yenileyin

3. **Bekleme:**
   - DNS değişiklikleri 1-24 saat içinde yayılır
   - Genellikle 1-2 saat içinde aktif olur

---

## 5. Vercel'de Domain Durumunu Kontrol Etme

1. Vercel → Domains sayfasına gidin
2. Domain'in durumunu kontrol edin:
   - ✅ **"Valid Configuration"** = DNS doğru yapılandırılmış
   - ❌ **"Invalid Configuration"** = DNS henüz yayılmamış veya yanlış

3. **"Invalid Configuration" görüyorsanız:**
   - DNS kayıtlarının doğru eklendiğinden emin olun
   - 1-2 saat bekleyin (DNS propagation)
   - Vercel'de **"Refresh"** butonuna tıklayın

---

## 6. DNS Propagation Kontrolü

DNS kayıtlarının yayılıp yayılmadığını kontrol edin:

1. [DNS Checker](https://dnschecker.org/) sitesine gidin
2. Domain adınızı girin: `synax.vip`
3. Record type seçin: `A` veya `CNAME`
4. **"Search"** butonuna tıklayın
5. Dünya genelindeki DNS sunucularında kaydın yayılıp yayılmadığını görün

---

## 7. Sorun Giderme

### Problem: "Invalid Configuration" hala görünüyor
**Çözüm:**
1. DNS kayıtlarının doğru eklendiğinden emin olun
2. Namecheap'te kayıtları tekrar kontrol edin
3. 1-2 saat bekleyin (DNS propagation)
4. Vercel'de **"Refresh"** butonuna tıklayın

### Problem: DNS kayıtlarını Vercel'de göremiyorum
**Çözüm:**
1. Domain'in **"Edit"** sayfasına gidin
2. Sayfanın altına kaydırın
3. Veya Vercel Support'a başvurun

### Problem: Namecheap'te kayıt ekleyemiyorum
**Çözüm:**
1. Mevcut kayıtları önce silin
2. Sayfayı yenileyin
3. Tekrar deneyin

---

## Özet Checklist

- [ ] Vercel'de domain eklendi
- [ ] Vercel'in verdiği DNS kayıtları not edildi
- [ ] Namecheap'te mevcut kayıtlar silindi
- [ ] Vercel'in verdiği A Record eklendi (eğer varsa)
- [ ] Vercel'in verdiği CNAME Record eklendi
- [ ] Namecheap'te kayıtlar kaydedildi
- [ ] 1-2 saat beklendi (DNS propagation)
- [ ] Vercel'de domain durumu kontrol edildi
- [ ] DNS Checker ile propagation kontrol edildi
- [ ] Domain "Valid Configuration" durumuna geçti

---

## Önemli Notlar

1. **Vercel'in verdiği tam değerleri kullanın** - Yukarıdaki örnekler geneldir
2. **DNS propagation 1-24 saat sürebilir** - Sabırlı olun
3. **Mevcut kayıtları silmeden yeni kayıt eklemeyin** - Çakışma olabilir
4. **TTL değerini "Automatic" bırakabilirsiniz** - Namecheap otomatik ayarlar

