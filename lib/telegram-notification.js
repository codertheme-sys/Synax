// lib/telegram-notification.js - Telegram Bildirim Helper
/**
 * Send Telegram notification
 * @param {string} message - Message to send
 * @returns {Promise<boolean>} - Success status
 */
export async function sendTelegramNotification(message) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  // If Telegram is not configured, skip silently
  if (!botToken || !chatId) {
    console.log('[Telegram] Bot token or chat ID not configured, skipping notification');
    return false;
  }

  try {
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML', // Enable HTML formatting
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('[Telegram] Failed to send notification:', errorData);
      return false;
    }

    const data = await response.json();
    if (data.ok) {
      console.log('[Telegram] Notification sent successfully');
      return true;
    } else {
      console.error('[Telegram] Notification failed:', data);
      return false;
    }
  } catch (error) {
    console.error('[Telegram] Error sending notification:', error);
    return false;
  }
}

/**
 * Format deposit notification message
 */
export function formatDepositNotification(deposit, user, coin, amount, totalValue) {
  const emoji = '💰';
  const status = deposit.status === 'completed' ? '✅ Onaylandı' : deposit.status === 'rejected' ? '❌ Reddedildi' : '⏳ Beklemede';
  
  return `${emoji} <b>Yeni Deposit İşlemi</b>\n\n` +
    `👤 <b>Kullanıcı:</b> ${user?.email || user?.username || 'N/A'}\n` +
    `🪙 <b>Coin:</b> ${coin}\n` +
    `💵 <b>Miktar:</b> ${amount} ${coin}\n` +
    (coin !== 'USDT' ? `💲 <b>USDT Değeri:</b> ${totalValue.toFixed(2)} USDT\n` : '') +
    `📊 <b>Durum:</b> ${status}\n` +
    `🕐 <b>Tarih:</b> ${new Date(deposit.created_at).toLocaleString('tr-TR')}\n` +
    (deposit.admin_notes ? `📝 <b>Not:</b> ${deposit.admin_notes}` : '');
}

/**
 * Format withdrawal notification message
 */
export function formatWithdrawalNotification(withdrawal, user, amount) {
  const emoji = '💸';
  const status = withdrawal.status === 'completed' ? '✅ Onaylandı' : withdrawal.status === 'rejected' ? '❌ Reddedildi' : '⏳ Beklemede';
  
  return `${emoji} <b>Yeni Withdrawal İşlemi</b>\n\n` +
    `👤 <b>Kullanıcı:</b> ${user?.email || user?.username || 'N/A'}\n` +
    `💵 <b>Miktar:</b> ${amount} USDT\n` +
    (withdrawal.wallet_address ? `📍 <b>Cüzdan:</b> ${withdrawal.wallet_address.substring(0, 20)}...\n` : '') +
    (withdrawal.crypto_network ? `🌐 <b>Ağ:</b> ${withdrawal.crypto_network}\n` : '') +
    `📊 <b>Durum:</b> ${status}\n` +
    `🕐 <b>Tarih:</b> ${new Date(withdrawal.created_at).toLocaleString('tr-TR')}\n` +
    (withdrawal.admin_notes ? `📝 <b>Not:</b> ${withdrawal.admin_notes}` : '');
}

/**
 * Format trade completion notification message
 */
export function formatTradeNotification(trade, user, winLost, profitAmount, initialPrice, lastPrice) {
  const emoji = winLost === 'win' ? '🎉' : '😔';
  const result = winLost === 'win' ? '✅ KAZANDI' : '❌ KAYBETTİ';
  
  return `${emoji} <b>Trade Sonuçlandı</b>\n\n` +
    `👤 <b>Kullanıcı:</b> ${user?.email || user?.username || 'N/A'}\n` +
    `🪙 <b>Asset:</b> ${trade.asset_symbol}\n` +
    `📊 <b>Sonuç:</b> ${result}\n` +
    `💰 <b>Trade Miktarı:</b> ${parseFloat(trade.trade_amount).toFixed(2)} USDT\n` +
    `💵 <b>Profit/Loss:</b> ${profitAmount > 0 ? '+' : ''}${profitAmount.toFixed(2)} USDT\n` +
    `📈 <b>Başlangıç Fiyatı:</b> ${initialPrice.toFixed(2)} USDT\n` +
    `📉 <b>Bitiş Fiyatı:</b> ${lastPrice.toFixed(2)} USDT\n` +
    `⏱️ <b>Time Frame:</b> ${trade.time_frame}s\n` +
    `🕐 <b>Tarih:</b> ${new Date(trade.created_at).toLocaleString('tr-TR')}`;
}
