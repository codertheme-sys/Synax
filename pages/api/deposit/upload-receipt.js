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

  console.log('Deposit receipt upload API called');

  try {
    const { user_id, file_base64, file_name, file_type } = req.body;

    console.log('Deposit receipt upload - Request data:', {
      user_id,
      file_name,
      file_type,
      has_file_base64: !!file_base64,
      file_base64_length: file_base64?.length || 0
    });

    if (!user_id) {
      console.error('Deposit receipt upload - Missing user_id');
      return res.status(400).json({ error: 'Missing user_id' });
    }

    if (!file_base64) {
      console.error('Deposit receipt upload - Missing file_base64');
      return res.status(400).json({ error: 'Missing file data' });
    }

    // Convert base64 to buffer
    const base64Data = file_base64.replace(/^data:.*,/, '');
    const fileBuffer = Buffer.from(base64Data, 'base64');

    console.log('Deposit receipt upload - File buffer created, size:', fileBuffer.length);

    // Upload file to Supabase Storage using service role (bypasses RLS)
    const fileExt = file_name?.split('.').pop() || 'jpg';
    const fileName = `${user_id}_${Date.now()}.${fileExt}`;
    const filePath = `deposits/${fileName}`;

    console.log('Deposit receipt upload - Uploading to:', filePath);

    // Upload to Storage
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('deposit-receipts')
      .upload(filePath, fileBuffer, {
        contentType: file_type || 'image/jpeg',
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('Deposit receipt upload - Storage upload error:', uploadError);
      return res.status(500).json({ error: `Failed to upload file: ${uploadError.message}` });
    }

    console.log('Deposit receipt upload - File uploaded successfully:', uploadData);

    // Get public URL
    const { data: urlData } = supabaseAdmin.storage
      .from('deposit-receipts')
      .getPublicUrl(filePath);

    console.log('Deposit receipt upload - Public URL:', urlData.publicUrl);

    return res.status(200).json({ 
      success: true, 
      receipt_url: urlData.publicUrl
    });
  } catch (error) {
    console.error('Deposit receipt upload - Exception:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}






