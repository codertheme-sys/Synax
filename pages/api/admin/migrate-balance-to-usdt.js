// pages/api/admin/migrate-balance-to-usdt.js - Migrate USD balances to USDT
import { createServerClient } from '../../../lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Authentication
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.replace('Bearer ', '');
    const supabaseAdmin = createServerClient();
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Admin kontrolü
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (!profile || !profile.is_admin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    // Get USDT price from CoinGecko
    let usdtPrice = 1.0; // Default to 1:1
    try {
      const priceResponse = await fetch(
        'https://api.coingecko.com/api/v3/simple/price?ids=tether&vs_currencies=usd&include_24hr_change=true',
        {
          headers: {
            'Accept': 'application/json',
          }
        }
      );

      if (priceResponse.ok) {
        const priceData = await priceResponse.json();
        const tetherData = priceData.tether;
        if (tetherData && tetherData.usd) {
          usdtPrice = parseFloat(tetherData.usd);
          console.log(`Balance migration - USDT price from CoinGecko: $${usdtPrice}`);
        }
      }
    } catch (priceError) {
      console.error('Balance migration - USDT price fetch error:', priceError);
      // Continue with 1:1 conversion if price fetch fails
    }

    // Get all profiles with balance > 0
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select('id, balance, email')
      .gt('balance', 0);

    if (profilesError) {
      console.error('Balance migration - Error fetching profiles:', profilesError);
      return res.status(500).json({ 
        success: false,
        error: 'Failed to fetch profiles' 
      });
    }

    if (!profiles || profiles.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No profiles with balance to migrate',
        migrated: 0
      });
    }

    // Migrate balances: USD * USDT_price = USDT
    const migrationResults = [];
    for (const profile of profiles) {
      const usdBalance = parseFloat(profile.balance || 0);
      const usdtBalance = usdBalance * usdtPrice;

      const { error: updateError } = await supabaseAdmin
        .from('profiles')
        .update({
          balance: usdtBalance,
          updated_at: new Date().toISOString()
        })
        .eq('id', profile.id);

      if (updateError) {
        console.error(`Balance migration - Error updating profile ${profile.id}:`, updateError);
        migrationResults.push({
          profile_id: profile.id,
          email: profile.email,
          success: false,
          error: updateError.message
        });
      } else {
        migrationResults.push({
          profile_id: profile.id,
          email: profile.email,
          old_balance_usd: usdBalance,
          new_balance_usdt: usdtBalance,
          success: true
        });
      }
    }

    const successCount = migrationResults.filter(r => r.success).length;
    const failCount = migrationResults.filter(r => !r.success).length;

    return res.status(200).json({
      success: true,
      message: `Balance migration completed. ${successCount} successful, ${failCount} failed.`,
      usdt_price: usdtPrice,
      migrated: successCount,
      failed: failCount,
      results: migrationResults
    });

  } catch (error) {
    console.error('Balance migration error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to migrate balances'
    });
  }
}
