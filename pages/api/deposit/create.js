// pages/api/deposit/create.js - Deposit Request API
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

    const { coin, network, amount, receipt_url } = req.body;

    console.log('Deposit create API - Request data:', {
      coin,
      network,
      amount,
      has_receipt_url: !!receipt_url,
      receipt_url_length: receipt_url?.length || 0
    });

    if (!coin || !network || !amount || amount <= 0) {
      return res.status(400).json({ error: 'Missing or invalid required fields' });
    }

    // Check for duplicate pending deposit (same user, amount, coin, network within last 5 seconds)
    const fiveSecondsAgo = new Date(Date.now() - 5000).toISOString();
    const { data: recentDeposit } = await supabaseAdmin
      .from('deposits')
      .select('id')
      .eq('user_id', user.id)
      .eq('amount', parseFloat(amount))
      .eq('payment_provider', coin)
      .eq('transaction_id', `${coin}:${network}`)
      .eq('status', 'pending')
      .gte('created_at', fiveSecondsAgo)
      .limit(1)
      .single();

    if (recentDeposit) {
      console.log('Duplicate deposit detected, returning existing deposit');
      return res.status(200).json({
        success: true,
        message: 'Deposit request already exists',
        data: recentDeposit
      });
    }

    // Create deposit request
    // Note: deposits table schema uses payment_method='crypto' and stores coin/network in transaction_id
    // Format: "coin:network" or store in admin_notes
    const insertData = {
      user_id: user.id,
      amount: parseFloat(amount),
      currency: 'USD',
      payment_method: 'crypto',
      payment_provider: coin,
      transaction_id: `${coin}:${network}`, // Store coin and network in transaction_id
      status: 'pending',
      admin_notes: `Coin: ${coin}, Network: ${network}`,
    };

    // Add receipt URL if provided
    if (receipt_url) {
      insertData.bank_receipt_url = receipt_url;
      console.log('Deposit create API - Adding receipt_url to insert:', receipt_url);
    } else {
      console.log('Deposit create API - No receipt_url provided');
    }

    const { data: deposit, error: depositError } = await supabaseAdmin
      .from('deposits')
      .insert(insertData)
      .select()
      .single();

    if (depositError) {
      console.error('Deposit create API - Insert error:', depositError);
      throw depositError;
    }

    console.log('Deposit create API - Deposit created:', {
      id: deposit.id,
      bank_receipt_url: deposit.bank_receipt_url,
      receipt_url: deposit.receipt_url,
      allFields: Object.keys(deposit)
    });

    return res.status(200).json({
      success: true,
      message: 'Deposit request created successfully',
      data: deposit
    });

  } catch (error) {
    console.error('Deposit creation error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to create deposit request'
    });
  }
}
