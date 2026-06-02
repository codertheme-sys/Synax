// pages/api/webhooks/tradingview-alert.js - TradingView Alert Webhook Handler
import { createServerClient } from '../../../lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // TradingView'den gelen alert verisi
    // TradingView alert format may vary, so use a flexible parser
    const alertData = req.body;

    // TradingView alert format is usually:
    // { symbol, price, condition, alert_id, timestamp, ... }
    const {
      symbol,
      price,
      condition,
      alert_id,
      timestamp,
      // Other fields TradingView may send
      exchange,
      interval,
      message,
      ...otherData
    } = alertData;

    if (!symbol || !alert_id) {
      return res.status(400).json({ 
        error: 'Missing required fields: symbol and alert_id are required' 
      });
    }

    // Find alert in database
    const supabaseAdmin = createServerClient();
    const { data: alert, error: alertError } = await supabaseAdmin
      .from('alerts')
      .select('*, user_id')
      .eq('tradingview_alert_id', alert_id)
      .eq('status', 'active')
      .single();

    if (alertError || !alert) {
      console.error('Alert not found:', alertError);
      // Return 200 even when alert is missing (avoid repeated retries from TradingView)
      return res.status(200).json({ 
        success: false, 
        message: 'Alert not found or already triggered' 
      });
    }

    // Mark alert as triggered
    const { error: updateError } = await supabaseAdmin
      .from('alerts')
      .update({
        status: 'triggered',
        triggered_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', alert.id);

    if (updateError) {
      console.error('Error updating alert:', updateError);
      return res.status(500).json({ error: 'Failed to update alert status' });
    }

    // Send user notification (email, push notification, etc.)
    // This part depends on your implementation
    // Example: email, push notification, in-app notification, etc.
    console.log(`Alert triggered for user ${alert.user_id}: ${symbol} at ${price}`);

    // TODO: Implement notification system
    // - Send email notification
    // - Send push notification
    // - Create in-app notification
    // - Update user's notification center

    return res.status(200).json({ 
      success: true,
      message: 'Alert processed successfully'
    });
  } catch (error) {
    console.error('TradingView alert webhook error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}
