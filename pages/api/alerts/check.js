// pages/api/alerts/check.js - Check and Trigger Alerts (Called by cron job or scheduled task)
import { createServerClient } from '../../../lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Optional: Add API key authentication for cron jobs
    const apiKey = req.headers['x-api-key'];
    if (apiKey !== process.env.ALERT_CHECK_API_KEY) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const supabaseAdmin = createServerClient();

    // Get all active alerts
    const { data: alerts, error: alertsError } = await supabaseAdmin
      .from('alerts')
      .select('*')
      .eq('status', 'active');

    if (alertsError) {
      console.error('Error fetching alerts:', alertsError);
      return res.status(500).json({ error: 'Failed to fetch alerts' });
    }

    if (!alerts || alerts.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No active alerts to check',
        triggered: 0
      });
    }

    let triggeredCount = 0;

    // Check each alert
    for (const alert of alerts) {
      try {
        // Fetch current price
        let currentPrice = 0;
        
        if (alert.asset_type === 'crypto') {
          const priceRes = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/prices/crypto`);
          const priceData = await priceRes.json();
          if (priceData.success && priceData.data) {
            const asset = priceData.data.find(a => 
              a.symbol?.toUpperCase() === alert.asset_symbol.toUpperCase() ||
              a.id?.toUpperCase() === alert.asset_symbol.toUpperCase()
            );
            if (asset) {
              currentPrice = parseFloat(asset.current_price || 0);
            }
          }
        } else if (alert.asset_type === 'gold') {
          const priceRes = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/prices/gold`);
          const priceData = await priceRes.json();
          if (priceData.success && priceData.data) {
            currentPrice = parseFloat(priceData.data.current_price || 0);
          }
        }

        if (currentPrice === 0) {
          continue; // Skip if price not found
        }

        // Check condition
        let shouldTrigger = false;
        const conditionValue = parseFloat(alert.condition_value);

        switch (alert.condition_operator) {
          case '>':
            shouldTrigger = currentPrice > conditionValue;
            break;
          case '>=':
            shouldTrigger = currentPrice >= conditionValue;
            break;
          case '<':
            shouldTrigger = currentPrice < conditionValue;
            break;
          case '<=':
            shouldTrigger = currentPrice <= conditionValue;
            break;
          case '==':
            shouldTrigger = Math.abs(currentPrice - conditionValue) < 0.01; // Allow small margin
            break;
          default:
            shouldTrigger = false;
        }

        if (shouldTrigger) {
          // Update alert status
          await supabaseAdmin
            .from('alerts')
            .update({
              status: 'triggered',
              triggered_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('id', alert.id);

          // TODO: Send notification to user
          // - Email notification
          // - Push notification
          // - In-app notification
          
          console.log(`Alert triggered: ${alert.asset_symbol} ${alert.condition_operator} ${conditionValue} (Current: ${currentPrice})`);
          triggeredCount++;
        }
      } catch (alertError) {
        console.error(`Error checking alert ${alert.id}:`, alertError);
      }
    }

    return res.status(200).json({
      success: true,
      message: `Checked ${alerts.length} alerts`,
      triggered: triggeredCount
    });

  } catch (error) {
    console.error('Check alerts error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to check alerts'
    });
  }
}

