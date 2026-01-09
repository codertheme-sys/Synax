// pages/api/alerts/delete.js - Delete Alert
import { createServerClient } from '../../../lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.replace('Bearer ', '');
    const supabaseAdmin = createServerClient();
    
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const { alertId } = req.query;

    if (!alertId) {
      return res.status(400).json({ error: 'Alert ID is required' });
    }

    // Check ownership and delete
    const { error: deleteError } = await supabaseAdmin
      .from('alerts')
      .delete()
      .eq('id', alertId)
      .eq('user_id', user.id);

    if (deleteError) {
      console.error('Error deleting alert:', deleteError);
      return res.status(500).json({ error: 'Failed to delete alert' });
    }

    return res.status(200).json({
      success: true,
      message: 'Alert deleted successfully'
    });

  } catch (error) {
    console.error('Delete alert error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete alert'
    });
  }
}

