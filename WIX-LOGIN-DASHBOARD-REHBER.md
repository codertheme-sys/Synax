# Wix Login & Dashboard Entegrasyon Rehberi

## Genel Bakış

Wix frontend + Next.js backend (Supabase) entegrasyonu için adım adım rehber.

---

## 1. LOGIN SAYFASI TASARIMI (Wix)

### Adım 1: Login Sayfası Oluşturma

1. **Wix Editor'da**:
   - **"Pages"** > **"Add Page"** > **"Blank Page"**
   - Sayfa adı: **"Login"** veya **"Sign In"**

2. **Login Form Tasarımı**:
   - **"Add" > "Input"** - Email input
   - **"Add" > "Input"** - Password input (type: password)
   - **"Add" > "Button"** - "Log in" butonu
   - **"Add" > "Text"** - "Don't have an account? Sign up" linki
   - **"Add" > "Text"** - "Forgot password?" linki

3. **Stil Ayarları**:
   - Arka plan: Koyu tema (#0b0c1a benzeri)
   - Form container: Beyaz/koyu gri kart
   - Buton: Gradient (mavi-mor)
   - Input'lar: Modern, rounded corners

### Adım 2: Wix Velo ile Supabase Entegrasyonu

#### A. Supabase Client Kurulumu

1. **Wix Editor'da** sağ üstte **"Dev Mode"** > **"Enable Velo"**

2. **backend/supabase-client.js** dosyası oluşturun:

```javascript
// backend/supabase-client.js
import { fetch } from 'wix-fetch';

const SUPABASE_URL = 'https://jgkgqzebfwjoevhxsqcm.supabase.co';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY'; // .env.local'den alın

export function getSupabaseClient() {
  return {
    url: SUPABASE_URL,
    key: SUPABASE_ANON_KEY
  };
}

// Supabase REST API çağrıları için helper
export async function supabaseRequest(endpoint, options = {}) {
  const { url, key } = getSupabaseClient();
  const response = await fetch(`${url}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'apikey': key,
      'Authorization': `Bearer ${key}`,
      ...options.headers
    }
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Supabase request failed');
  }
  
  return await response.json();
}
```

#### B. Login Fonksiyonu

**backend/auth.js** dosyası oluşturun:

```javascript
// backend/auth.js
import { supabaseRequest } from './supabase-client';

/**
 * Email ve şifre ile login
 */
export async function loginUser(email, password) {
  try {
    const response = await supabaseRequest('/auth/v1/token?grant_type=password', {
      method: 'POST',
      body: JSON.stringify({
        email: email,
        password: password
      })
    });
    
    // Token'ı localStorage'a kaydet
    if (typeof window !== 'undefined' && response.access_token) {
      localStorage.setItem('supabase_token', response.access_token);
      localStorage.setItem('supabase_user', JSON.stringify(response.user));
    }
    
    return {
      success: true,
      user: response.user,
      token: response.access_token
    };
  } catch (error) {
    console.error('Login error:', error);
    return {
      success: false,
      error: error.message || 'Login failed'
    };
  }
}

/**
 * Kullanıcı kaydı
 */
export async function signUpUser(email, password, metadata = {}) {
  try {
    const response = await supabaseRequest('/auth/v1/signup', {
      method: 'POST',
      body: JSON.stringify({
        email: email,
        password: password,
        data: metadata
      })
    });
    
    return {
      success: true,
      user: response.user,
      message: 'Check your email for confirmation link'
    };
  } catch (error) {
    console.error('Signup error:', error);
    return {
      success: false,
      error: error.message || 'Signup failed'
    };
  }
}

/**
 * Email onayı kontrolü
 */
export async function checkEmailConfirmation(token) {
  try {
    const response = await supabaseRequest(`/auth/v1/verify?token=${token}`, {
      method: 'GET'
    });
    
    return {
      success: true,
      user: response.user
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Şifre sıfırlama
 */
export async function resetPassword(email) {
  try {
    const response = await supabaseRequest('/auth/v1/recover', {
      method: 'POST',
      body: JSON.stringify({
        email: email
      })
    });
    
    return {
      success: true,
      message: 'Password reset email sent'
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Mevcut kullanıcıyı kontrol et
 */
export async function getCurrentUser() {
  try {
    const token = typeof window !== 'undefined' ? localStorage.getItem('supabase_token') : null;
    if (!token) {
      return { success: false, user: null };
    }
    
    const response = await supabaseRequest('/auth/v1/user', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    return {
      success: true,
      user: response
    };
  } catch (error) {
    return {
      success: false,
      user: null,
      error: error.message
    };
  }
}

/**
 * Logout
 */
export async function logoutUser() {
  try {
    const token = typeof window !== 'undefined' ? localStorage.getItem('supabase_token') : null;
    if (token) {
      await supabaseRequest('/auth/v1/logout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
    }
    
    if (typeof window !== 'undefined') {
      localStorage.removeItem('supabase_token');
      localStorage.removeItem('supabase_user');
    }
    
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}
```

### Adım 3: Login Sayfası Frontend Kodu

**Login sayfasında** (Wix Editor'da sayfaya kod ekleyin):

```javascript
// Login page code
import { loginUser, getCurrentUser } from 'backend/auth';
import wixWindow from 'wix-window';

$w.onReady(function () {
  // Eğer zaten giriş yapılmışsa dashboard'a yönlendir
  checkAuth();
  
  // Login butonuna tıklama
  $w('#loginButton').onClick(() => {
    handleLogin();
  });
  
  // Enter tuşu ile login
  $w('#passwordInput').onKeyPress((event) => {
    if (event.key === 'Enter') {
      handleLogin();
    }
  });
});

async function checkAuth() {
  const { success, user } = await getCurrentUser();
  if (success && user) {
    // Dashboard'a yönlendir
    wixWindow.lightbox.close();
    wixLocation.to('/dashboard');
  }
}

async function handleLogin() {
  const email = $w('#emailInput').value;
  const password = $w('#passwordInput').value;
  
  // Validation
  if (!email || !password) {
    $w('#errorText').text = 'Please fill in all fields';
    $w('#errorText').show();
    return;
  }
  
  // Loading state
  $w('#loginButton').disable();
  $w('#loginButton').label = 'Logging in...';
  $w('#errorText').hide();
  
  try {
    const result = await loginUser(email, password);
    
    if (result.success) {
      // Başarılı login
      $w('#successText').text = 'Login successful! Redirecting...';
      $w('#successText').show();
      
      // Dashboard'a yönlendir
      setTimeout(() => {
        wixLocation.to('/dashboard');
      }, 1000);
    } else {
      // Hata
      $w('#errorText').text = result.error || 'Login failed';
      $w('#errorText').show();
      $w('#loginButton').enable();
      $w('#loginButton').label = 'Log in';
    }
  } catch (error) {
    $w('#errorText').text = 'An error occurred. Please try again.';
    $w('#errorText').show();
    $w('#loginButton').enable();
    $w('#loginButton').label = 'Log in';
  }
}
```

---

## 2. EMAIL ONAYI SİSTEMİ

### Adım 1: Email Onay Sayfası

1. **Wix'te yeni sayfa**: **"Email Confirmation"**

2. **Sayfa içeriği**:
   - Başlık: "Confirm Your Email"
   - Açıklama: "Please check your email and click the confirmation link"
   - "Resend Email" butonu

### Adım 2: Email Onay Kontrolü

**backend/email-confirmation.js**:

```javascript
// backend/email-confirmation.js
import { checkEmailConfirmation } from 'backend/auth';
import wixLocation from 'wix-location';

/**
 * URL'den token al ve email'i onayla
 */
export async function confirmEmailFromUrl() {
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');
  const type = urlParams.get('type'); // 'signup' veya 'recovery'
  
  if (!token) {
    return {
      success: false,
      error: 'No confirmation token found'
    };
  }
  
  try {
    const result = await checkEmailConfirmation(token);
    
    if (result.success) {
      // Email onaylandı
      if (type === 'signup') {
        // Signup için login sayfasına yönlendir
        wixLocation.to('/login?confirmed=true');
      } else if (type === 'recovery') {
        // Password reset için yeni şifre sayfasına yönlendir
        wixLocation.to('/reset-password?token=' + token);
      }
      
      return {
        success: true,
        message: 'Email confirmed successfully'
      };
    } else {
      return {
        success: false,
        error: result.error || 'Email confirmation failed'
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Confirmation error'
    };
  }
}
```

**Email Confirmation sayfasında**:

```javascript
import { confirmEmailFromUrl } from 'backend/email-confirmation';

$w.onReady(async function () {
  const result = await confirmEmailFromUrl();
  
  if (result.success) {
    $w('#successText').text = result.message;
    $w('#successText').show();
  } else {
    $w('#errorText').text = result.error;
    $w('#errorText').show();
  }
});
```

### Adım 3: Supabase Email Template Ayarları

1. **Supabase Dashboard** > **Authentication** > **Email Templates**
2. **"Confirm signup"** template'ini özelleştirin
3. **Redirect URL**: `https://your-wix-site.com/email-confirmation?token={{ .Token }}&type=signup`

---

## 3. DASHBOARD TASARIMI

### Adım 1: Dashboard Sayfası Oluşturma

1. **Wix'te yeni sayfa**: **"Dashboard"**
2. **Sayfa ayarları**: **"Members Only"** (sadece giriş yapmış kullanıcılar)

### Adım 2: Dashboard Bileşenleri

**Tasarım önerileri**:

1. **Header Section**:
   - Kullanıcı adı/email
   - Logout butonu
   - Profile butonu

2. **Stats Cards**:
   - Total Portfolio Value
   - Active Trades
   - Profit/Loss
   - Available Balance

3. **Recent Activity**:
   - Son işlemler listesi
   - Watchlist

4. **Quick Actions**:
   - Buy/Sell butonları
   - Deposit/Withdraw butonları

### Adım 3: Dashboard Backend Entegrasyonu

**backend/dashboard.js**:

```javascript
// backend/dashboard.js
import { getCurrentUser } from 'backend/auth';
import { supabaseRequest } from './supabase-client';

/**
 * Kullanıcı profil bilgilerini getir
 */
export async function getUserProfile(userId) {
  try {
    const token = localStorage.getItem('supabase_token');
    const response = await supabaseRequest(`/rest/v1/profiles?id=eq.${userId}&select=*`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    return {
      success: true,
      profile: response[0] || null
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Portfolio değerini getir
 */
export async function getPortfolioValue(userId) {
  try {
    const token = localStorage.getItem('supabase_token');
    const response = await supabaseRequest(`/rest/v1/portfolio?user_id=eq.${userId}&select=*`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    // Toplam değeri hesapla
    let totalValue = 0;
    if (response && Array.isArray(response)) {
      totalValue = response.reduce((sum, item) => {
        return sum + (parseFloat(item.total_value) || 0);
      }, 0);
    }
    
    return {
      success: true,
      portfolio: response || [],
      totalValue: totalValue
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      portfolio: [],
      totalValue: 0
    };
  }
}

/**
 * Son işlemleri getir
 */
export async function getRecentTrades(userId, limit = 10) {
  try {
    const token = localStorage.getItem('supabase_token');
    const response = await supabaseRequest(
      `/rest/v1/trading_history?user_id=eq.${userId}&order=created_at.desc&limit=${limit}&select=*`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );
    
    return {
      success: true,
      trades: response || []
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      trades: []
    };
  }
}

/**
 * Watchlist'i getir
 */
export async function getWatchlist(userId) {
  try {
    const token = localStorage.getItem('supabase_token');
    const response = await supabaseRequest(`/rest/v1/watchlist?user_id=eq.${userId}&select=*`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    return {
      success: true,
      watchlist: response || []
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      watchlist: []
    };
  }
}
```

### Adım 4: Dashboard Frontend Kodu

**Dashboard sayfasında**:

```javascript
// Dashboard page code
import { getCurrentUser } from 'backend/auth';
import { getUserProfile, getPortfolioValue, getRecentTrades, getWatchlist } from 'backend/dashboard';
import { logoutUser } from 'backend/auth';
import wixLocation from 'wix-location';

let currentUser = null;

$w.onReady(async function () {
  // Auth kontrolü
  const authResult = await getCurrentUser();
  if (!authResult.success || !authResult.user) {
    // Login sayfasına yönlendir
    wixLocation.to('/login');
    return;
  }
  
  currentUser = authResult.user;
  await loadDashboardData();
  
  // Logout butonu
  $w('#logoutButton').onClick(async () => {
    await logoutUser();
    wixLocation.to('/login');
  });
});

async function loadDashboardData() {
  try {
    // Kullanıcı bilgileri
    const profileResult = await getUserProfile(currentUser.id);
    if (profileResult.success && profileResult.profile) {
      $w('#userNameText').text = profileResult.profile.full_name || currentUser.email;
      $w('#userEmailText').text = currentUser.email;
    }
    
    // Portfolio
    const portfolioResult = await getPortfolioValue(currentUser.id);
    if (portfolioResult.success) {
      $w('#portfolioValueText').text = formatCurrency(portfolioResult.totalValue);
    }
    
    // Son işlemler
    const tradesResult = await getRecentTrades(currentUser.id, 5);
    if (tradesResult.success) {
      $w('#recentTradesRepeater').data = tradesResult.trades;
    }
    
    // Watchlist
    const watchlistResult = await getWatchlist(currentUser.id);
    if (watchlistResult.success) {
      $w('#watchlistRepeater').data = watchlistResult.watchlist;
    }
    
  } catch (error) {
    console.error('Dashboard load error:', error);
    $w('#errorText').text = 'Error loading dashboard data';
    $w('#errorText').show();
  }
}

function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(value || 0);
}

// Repeater item handler
export function recentTradeItemReady($item, itemData) {
  $item('#tradeSymbolText').text = itemData.symbol;
  $item('#tradeTypeText').text = itemData.type; // 'buy' or 'sell'
  $item('#tradeAmountText').text = formatCurrency(itemData.amount);
  $item('#tradeDateText').text = new Date(itemData.created_at).toLocaleDateString();
}
```

---

## 4. KULLANICI BİLGİLERİ KONTROLÜ

### Adım 1: Profile Sayfası

**backend/profile.js**:

```javascript
// backend/profile.js
import { supabaseRequest } from './supabase-client';

/**
 * Profil bilgilerini güncelle
 */
export async function updateProfile(userId, data) {
  try {
    const token = localStorage.getItem('supabase_token');
    const response = await supabaseRequest(`/rest/v1/profiles?id=eq.${userId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });
    
    return {
      success: true,
      profile: response[0]
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * KYC durumunu kontrol et
 */
export async function checkKYCStatus(userId) {
  try {
    const token = localStorage.getItem('supabase_token');
    const response = await supabaseRequest(`/rest/v1/kyc_documents?user_id=eq.${userId}&select=*`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const kycDoc = response[0] || null;
    return {
      success: true,
      kycStatus: kycDoc?.status || 'pending',
      kycDoc: kycDoc
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}
```

---

## 5. ÖNEMLİ NOTLAR

### Environment Variables (Wix Secrets)

1. **Wix Dashboard** > **Settings** > **Secrets**
2. Ekleyin:
   - `SUPABASE_URL`: `https://jgkgqzebfwjoevhxsqcm.supabase.co`
   - `SUPABASE_ANON_KEY`: Supabase anon key'iniz

### CORS Ayarları

**Supabase Dashboard** > **Settings** > **API** > **CORS**:
- Wix domain'inizi ekleyin: `https://your-site.wixsite.com`

### Güvenlik

- Token'ları localStorage'da saklayın (Wix'te güvenli)
- Her API çağrısında token gönderin
- Sensitive data için RLS (Row Level Security) kullanın

---

## 6. TEST ADIMLARI

1. ✅ Login sayfası çalışıyor mu?
2. ✅ Email onayı çalışıyor mu?
3. ✅ Dashboard verileri yükleniyor mu?
4. ✅ Logout çalışıyor mu?
5. ✅ Protected pages korunuyor mu?

---

## YARDIM

Sorun yaşarsanız:
- Wix Velo Docs: https://www.wix.com/velo
- Supabase Docs: https://supabase.com/docs
- Wix Forum: https://www.wix.com/forum

