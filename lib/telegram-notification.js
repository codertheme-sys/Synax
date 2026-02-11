// lib/telegram-notification.js - Telegram Bildirim Helper
/**
 * Send Telegram notification
 * @param {string} message - Message to send
 * @returns {Promise<boolean>} - Success status
 */
export async function sendTelegramNotification(message, options = {}) {
  const { maxRetries = 3, context = 'notification' } = options;
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!botToken || !chatId) {
    console.log('[Telegram] Bot token or chat ID not configured, skipping notification');
    return false;
  }

  const safeMessage = message.length > 4096 ? message.substring(0, 4090) + '\n...[truncated]' : message;

  let lastError = null;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: safeMessage,
          parse_mode: 'HTML',
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const data = await response.json().catch(() => ({}));

      if (response.ok && data?.ok) {
        if (attempt > 1) console.log(`[Telegram] ${context} sent on attempt ${attempt}`);
        return true;
      }

      lastError = data?.description || data?.error || response.statusText;
      const isRetryable = response.status === 429 || response.status >= 500 || response.status === 0;

      if (isRetryable && attempt < maxRetries) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
        console.warn(`[Telegram] ${context} attempt ${attempt} failed: ${lastError}. Retrying in ${delay}ms...`);
        await new Promise((r) => setTimeout(r, delay));
      } else {
        console.error(`[Telegram] ${context} failed after ${attempt} attempts:`, lastError, data);
        return false;
      }
    } catch (error) {
      lastError = error?.message || String(error);
      if (attempt < maxRetries) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
        console.warn(`[Telegram] ${context} attempt ${attempt} error: ${lastError}. Retrying in ${delay}ms...`);
        await new Promise((r) => setTimeout(r, delay));
      } else {
        console.error(`[Telegram] ${context} failed after ${attempt} attempts:`, lastError);
        return false;
      }
    }
  }
  return false;
}

/**
 * Format deposit notification message
 */
export function formatDepositNotification(deposit, user, coin, amount, totalValue = 0) {
  const emoji = '💰';
  const status = deposit.status === 'completed' ? '✅ Approved' : deposit.status === 'rejected' ? '❌ Rejected' : '⏳ Pending';
  
  return `${emoji} <b>New Deposit Request</b>\n\n` +
    `👤 <b>User:</b> ${user?.email || user?.username || user?.full_name || 'N/A'}\n` +
    `🪙 <b>Coin:</b> ${coin}\n` +
    `💵 <b>Amount:</b> ${amount} ${coin}\n` +
    (coin !== 'USDT' && totalValue > 0 ? `💲 <b>USDT Value:</b> ${totalValue.toFixed(2)} USDT\n` : '') +
    `📊 <b>Status:</b> ${status}\n` +
    `🕐 <b>Date:</b> ${new Date(deposit.created_at).toLocaleString('en-US')}\n` +
    (deposit.admin_notes ? `📝 <b>Notes:</b> ${deposit.admin_notes}` : '');
}

/**
 * Format withdrawal notification message
 */
export function formatWithdrawalNotification(withdrawal, user, amount) {
  const emoji = '💸';
  const status = withdrawal.status === 'completed' ? '✅ Approved' : withdrawal.status === 'rejected' ? '❌ Rejected' : '⏳ Pending';
  const currency = withdrawal.currency || 'USD';
  
  return `${emoji} <b>New Withdrawal Request</b>\n\n` +
    `👤 <b>User:</b> ${user?.email || user?.username || user?.full_name || 'N/A'}\n` +
    `💵 <b>Amount:</b> ${amount} ${currency}\n` +
    (withdrawal.wallet_address || withdrawal.crypto_address ? `📍 <b>Wallet:</b> ${(withdrawal.wallet_address || withdrawal.crypto_address).substring(0, 20)}...\n` : '') +
    (withdrawal.crypto_network ? `🌐 <b>Network:</b> ${withdrawal.crypto_network}\n` : '') +
    (withdrawal.bank_account ? `🏦 <b>Bank Account:</b> ${withdrawal.bank_account}\n` : '') +
    `📊 <b>Status:</b> ${status}\n` +
    `🕐 <b>Date:</b> ${new Date(withdrawal.created_at).toLocaleString('en-US')}\n` +
    (withdrawal.admin_notes ? `📝 <b>Notes:</b> ${withdrawal.admin_notes}` : '');
}

/**
 * Format trade completion notification message
 */
export function formatTradeNotification(trade, user, winLost, profitAmount, initialPrice, lastPrice) {
  const emoji = winLost === 'win' ? '🎉' : '😔';
  const result = winLost === 'win' ? '✅ WIN' : '❌ LOST';
  
  return `${emoji} <b>Trade Completed</b>\n\n` +
    `👤 <b>User:</b> ${user?.email || user?.username || user?.full_name || 'N/A'}\n` +
    `🪙 <b>Asset:</b> ${trade.asset_symbol}\n` +
    `📊 <b>Result:</b> ${result}\n` +
    `💰 <b>Trade Amount:</b> ${parseFloat(trade.trade_amount).toFixed(2)} USDT\n` +
    `💵 <b>Profit/Loss:</b> ${profitAmount > 0 ? '+' : ''}${profitAmount.toFixed(2)} USDT\n` +
    `📈 <b>Initial Price:</b> ${initialPrice.toFixed(2)} USDT\n` +
    `📉 <b>Final Price:</b> ${lastPrice.toFixed(2)} USDT\n` +
    `⏱️ <b>Time Frame:</b> ${trade.time_frame}s\n` +
    `🕐 <b>Date:</b> ${new Date(trade.created_at).toLocaleString('en-US')}`;
}
