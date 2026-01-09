// pages/api/alerts/update.js - Update Alert
import { createServerClient } from '../../../lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'PUT') {
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

    const { alertId, status, condition_value, condition_operator } = req.body;

    if (!alertId) {
      return res.status(400).json({ error: 'Alert ID is required' });
    }

    // Check ownership
    const { data: existingAlert, error: checkError } = await supabaseAdmin
      .from('alerts')
      .select('*')
      .eq('id', alertId)
      .eq('user_id', user.id)
      .single();

    if (checkError || !existingAlert) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    // Update alert
    const updateData = {
      updated_at: new Date().toISOString()
    };

    if (status) updateData.status = status;
    if (condition_value !== undefined) updateData.condition_value = parseFloat(condition_value);
    if (condition_operator) updateData.condition_operator = condition_operator;
    
    // If status is 'triggered', set triggered_at
    if (status === 'triggered' && req.body.triggered_at) {
      updateData.triggered_at = req.body.triggered_at;
    }

    const { data: updatedAlert, error: updateError } = await supabaseAdmin
      .from('alerts')
      .update(updateData)
      .eq('id', alertId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating alert:', updateError);
      return res.status(500).json({ error: 'Failed to update alert' });
    }

    return res.status(200).json({
      success: true,
      data: updatedAlert
    });

  } catch (error) {
    console.error('Update alert error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to update alert'
    });
  }
}




export default async function handler(req, res) {
  if (req.method !== 'PUT') {
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

    const { alertId, status, condition_value, condition_operator } = req.body;

    if (!alertId) {
      return res.status(400).json({ error: 'Alert ID is required' });
    }

    // Check ownership
    const { data: existingAlert, error: checkError } = await supabaseAdmin
      .from('alerts')
      .select('*')
      .eq('id', alertId)
      .eq('user_id', user.id)
      .single();

    if (checkError || !existingAlert) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    // Update alert
    const updateData = {
      updated_at: new Date().toISOString()
    };

    if (status) updateData.status = status;
    if (condition_value !== undefined) updateData.condition_value = parseFloat(condition_value);
    if (condition_operator) updateData.condition_operator = condition_operator;
    
    // If status is 'triggered', set triggered_at
    if (status === 'triggered' && req.body.triggered_at) {
      updateData.triggered_at = req.body.triggered_at;
    }

    const { data: updatedAlert, error: updateError } = await supabaseAdmin
      .from('alerts')
      .update(updateData)
      .eq('id', alertId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating alert:', updateError);
      return res.status(500).json({ error: 'Failed to update alert' });
    }

    return res.status(200).json({
      success: true,
      data: updatedAlert
    });

  } catch (error) {
    console.error('Update alert error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to update alert'
    });
  }
}


