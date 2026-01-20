// pages/api/admin/migrate-usdt-to-balance.js - Migrate USDT from portfolio to balance
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

    // Get all USDT items from portfolio
    const { data: usdtPortfolioItems, error: portfolioError } = await supabaseAdmin
      .from('portfolio')
      .select('*')
      .or('asset_symbol.eq.USDT,asset_id.eq.USDT');

    if (portfolioError) {
      console.error('Error fetching USDT portfolio items:', portfolioError);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch USDT portfolio items'
      });
    }

    if (!usdtPortfolioItems || usdtPortfolioItems.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No USDT items found in portfolio',
        migrated: 0
      });
    }

    // Group by user_id and calculate total USDT amount
    const userUsdtMap = {};
    for (const item of usdtPortfolioItems) {
      const userId = item.user_id;
      const quantity = parseFloat(item.quantity || 0);
      
      if (!userUsdtMap[userId]) {
        userUsdtMap[userId] = 0;
      }
      userUsdtMap[userId] += quantity;
    }

    // Migrate USDT from portfolio to balance for each user
    const migrationResults = [];
    for (const [userId, totalUsdt] of Object.entries(userUsdtMap)) {
      try {
        // Get current balance
        const { data: userProfile, error: profileError } = await supabaseAdmin
          .from('profiles')
          .select('balance, email')
          .eq('id', userId)
          .single();

        if (profileError || !userProfile) {
          console.error(`Error fetching profile for user ${userId}:`, profileError);
          migrationResults.push({
            user_id: userId,
            success: false,
            error: 'Profile not found'
          });
          continue;
        }

        // Add USDT to balance
        const currentBalance = parseFloat(userProfile.balance || 0);
        const newBalance = currentBalance + totalUsdt;

        const { error: balanceError } = await supabaseAdmin
          .from('profiles')
          .update({
            balance: newBalance,
            updated_at: new Date().toISOString()
          })
          .eq('id', userId);

        if (balanceError) {
          console.error(`Error updating balance for user ${userId}:`, balanceError);
          migrationResults.push({
            user_id: userId,
            email: userProfile.email,
            success: false,
            error: balanceError.message
          });
          continue;
        }

        // Delete USDT items from portfolio
        const { error: deleteError } = await supabaseAdmin
          .from('portfolio')
          .delete()
          .eq('user_id', userId)
          .or('asset_symbol.eq.USDT,asset_id.eq.USDT');

        if (deleteError) {
          console.error(`Error deleting USDT from portfolio for user ${userId}:`, deleteError);
          // Don't fail - balance is already updated
        }

        migrationResults.push({
          user_id: userId,
          email: userProfile.email,
          usdt_amount: totalUsdt,
          old_balance: currentBalance,
          new_balance: newBalance,
          success: true
        });

        console.log(`Migrated ${totalUsdt} USDT from portfolio to balance for user ${userId}`);
      } catch (err) {
        console.error(`Error migrating USDT for user ${userId}:`, err);
        migrationResults.push({
          user_id: userId,
          success: false,
          error: err.message
        });
      }
    }

    const successCount = migrationResults.filter(r => r.success).length;
    const failCount = migrationResults.filter(r => !r.success).length;
    const totalUsdtMigrated = migrationResults
      .filter(r => r.success)
      .reduce((sum, r) => sum + (r.usdt_amount || 0), 0);

    return res.status(200).json({
      success: true,
      message: `USDT migration completed. ${successCount} users migrated, ${failCount} failed.`,
      migrated: successCount,
      failed: failCount,
      total_usdt_migrated: totalUsdtMigrated,
      results: migrationResults
    });

  } catch (error) {
    console.error('USDT migration error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to migrate USDT from portfolio to balance'
    });
  }
}
