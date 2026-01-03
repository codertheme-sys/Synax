// pages/api/admin/kyc-approve.js - KYC Onay/Red
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

    const { user_id, action, notes } = req.body; // action: 'approve' or 'reject'

    if (!user_id || !action) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (action === 'approve') {
      // Approve KYC - Update profiles table
      const { data: profileUpdate, error: profileError } = await supabaseAdmin
        .from('profiles')
        .update({
          kyc_verified: true,
          kyc_status: 'approved',
          updated_at: new Date().toISOString()
        })
        .eq('id', user_id)
        .select();

      if (profileError) {
        console.error('KYC approve - Profile update error:', profileError);
        return res.status(500).json({
          success: false,
          error: `Failed to update profile: ${profileError.message}`
        });
      }

      console.log('KYC approve - Profile updated:', profileUpdate);

      // Update KYC documents
      const { data: docUpdate, error: docError } = await supabaseAdmin
        .from('kyc_documents')
        .update({
          status: 'approved',
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
          admin_notes: notes || null
        })
        .eq('user_id', user_id)
        .eq('status', 'pending')
        .select();

      if (docError) {
        console.error('KYC approve - Document update error:', docError);
        // Don't fail if document update fails, profile update is more important
      } else {
        console.log('KYC approve - Documents updated:', docUpdate);
      }

      return res.status(200).json({
        success: true,
        message: 'KYC approved successfully',
        data: {
          profile: profileUpdate,
          documents: docUpdate
        }
      });
    } else if (action === 'reject') {
      // Reject KYC - Update profiles table
      const { data: profileUpdate, error: profileError } = await supabaseAdmin
        .from('profiles')
        .update({
          kyc_verified: false,
          kyc_status: 'rejected',
          updated_at: new Date().toISOString()
        })
        .eq('id', user_id)
        .select();

      if (profileError) {
        console.error('KYC reject - Profile update error:', profileError);
        return res.status(500).json({
          success: false,
          error: `Failed to update profile: ${profileError.message}`
        });
      }

      console.log('KYC reject - Profile updated:', profileUpdate);

      // Update KYC documents
      const { data: docUpdate, error: docError } = await supabaseAdmin
        .from('kyc_documents')
        .update({
          status: 'rejected',
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
          admin_notes: notes || null
        })
        .eq('user_id', user_id)
        .eq('status', 'pending')
        .select();

      if (docError) {
        console.error('KYC reject - Document update error:', docError);
      } else {
        console.log('KYC reject - Documents updated:', docUpdate);
      }

      return res.status(200).json({
        success: true,
        message: 'KYC rejected',
        data: {
          profile: profileUpdate,
          documents: docUpdate
        }
      });
    } else {
      return res.status(400).json({ error: 'Invalid action' });
    }

  } catch (error) {
    console.error('KYC approve error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to process KYC action'
    });
  }
}




