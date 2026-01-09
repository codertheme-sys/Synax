import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { user_id, document_type, document_url, status } = req.body;

    if (!user_id || !document_type || !document_url) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Insert KYC document using service role (bypasses RLS)
    const { data, error } = await supabaseAdmin
      .from('kyc_documents')
      .insert({
        user_id,
        document_type,
        document_url,
        status: status || 'pending',
      })
      .select();

    if (error) {
      console.error('KYC document insert error (API):', error);
      return res.status(500).json({ error: error.message });
    }

    // Also update profiles.kyc_document_url
    await supabaseAdmin
      .from('profiles')
      .update({ kyc_document_url: document_url })
      .eq('id', user_id);

    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('KYC upload API error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
