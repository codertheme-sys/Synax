# Git Kullanım Rehberi - Cursor Bağlantı Hatası Çözümü

## Sorun
Cursor ile commit ve push yaparken bağlantı hatası oluşuyor ve Cursor kullanılamaz hale geliyor.

## Çözüm Adımları

### 1. GitHub Token'ı Windows Credential Manager'a Ekleme

Token'ı URL'den kaldırdık. Şimdi Windows Credential Manager'a eklemeniz gerekiyor:

**Yöntem 1: Otomatik (Önerilen)**
```powershell
# İlk push sırasında Windows sizden kullanıcı adı ve şifre isteyecek
# Kullanıcı adı: GitHub kullanıcı adınız
# Şifre: GitHub Personal Access Token'ınız (ghp_ ile başlayan)
```

**Yöntem 2: Manuel Ekleme**
1. Windows Ayarlar > Hesaplar > Windows Credential Manager'ı açın
2. "Windows Credentials" sekmesine gidin
3. "Add a generic credential" tıklayın
4. Şu bilgileri girin:
   - Internet or network address: `git:https://github.com`
   - User name: GitHub kullanıcı adınız
   - Password: GitHub Personal Access Token'ınız

### 2. Commit ve Push İşlemleri

Cursor yerine terminal kullanarak commit ve push yapın:

```powershell
# Tüm değişiklikleri ekle
git add .

# Commit yap
git commit -m "Değişiklik açıklaması"

# Push yap
git push origin main
```

### 3. Alternatif: SSH Kullanımı (Daha Güvenli)

SSH kullanmak isterseniz:

```powershell
# SSH URL'e geç
git remote set-url origin git@github.com:codertheme-sys/Synax.git

# SSH key'iniz yoksa oluşturun
ssh-keygen -t ed25519 -C "your_email@example.com"

# Public key'i GitHub'a ekleyin (Settings > SSH and GPG keys)
cat ~/.ssh/id_ed25519.pub
```

## Önemli Notlar

1. **Büyük Dosyalar**: Eğer çok büyük dosyalar varsa, `.gitignore` dosyasına ekleyin
2. **Token Güvenliği**: Token'ı asla kod içine veya public repository'lere eklemeyin
3. **Cursor Kullanımı**: Cursor'u sadece kod yazmak için kullanın, Git işlemleri için terminal kullanın

## Hızlı Komutlar

```powershell
# Durum kontrolü
git status

# Değişiklikleri göster
git diff

# Son commit'i geri al
git reset --soft HEAD~1

# Belirli dosyaları ekle
git add pages/admin.js

# Commit mesajı ile commit
git commit -m "Admin sayfası güncellemeleri"

# Push
git push origin main
```





