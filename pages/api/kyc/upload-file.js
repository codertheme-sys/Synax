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

  console.log('KYC upload-file API called');

  try {
    const { user_id, document_type, file_base64, file_name, file_type } = req.body;

    console.log('KYC upload-file - Request data:', {
      user_id,
      document_type,
      file_name,
      file_type,
      has_file_base64: !!file_base64,
      file_base64_length: file_base64?.length || 0
    });

    if (!user_id) {
      console.error('KYC upload-file - Missing user_id');
      return res.status(400).json({ error: 'Missing user_id' });
    }

    if (!file_base64) {
      console.error('KYC upload-file - Missing file_base64');
      return res.status(400).json({ error: 'Missing file data' });
    }

    // Convert base64 to buffer
    const base64Data = file_base64.replace(/^data:.*,/, '');
    const fileBuffer = Buffer.from(base64Data, 'base64');

    console.log('KYC upload-file - File buffer created, size:', fileBuffer.length);

    // Upload file to Supabase Storage using service role (bypasses RLS)
    const fileExt = file_name?.split('.').pop() || 'jpg';
    const fileName = `${user_id}_${Date.now()}.${fileExt}`;
    const filePath = `kyc/${fileName}`;

    console.log('KYC upload-file - Uploading to:', filePath);

    // Upload to Storage
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('kyc-documents')
      .upload(filePath, fileBuffer, {
        contentType: file_type || 'image/jpeg',
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('KYC upload-file - Storage upload error:', uploadError);
      return res.status(500).json({ error: `Failed to upload file: ${uploadError.message}` });
    }

    console.log('KYC upload-file - File uploaded successfully:', uploadData);

    // Get public URL
    const { data: urlData } = supabaseAdmin.storage
      .from('kyc-documents')
      .getPublicUrl(filePath);

    console.log('KYC upload-file - Public URL:', urlData.publicUrl);

    // Insert KYC document record using service role (bypasses RLS)
    const { data: insertData, error: docError } = await supabaseAdmin
      .from('kyc_documents')
      .insert({
        user_id: user_id,
        document_type: document_type || 'id_card',
        document_url: urlData.publicUrl,
        status: 'pending',
      })
      .select();

    if (docError) {
      console.error('KYC upload-file - Document insert error:', docError);
      return res.status(500).json({ error: `Failed to save KYC document: ${docError.message}` });
    }

    console.log('KYC upload-file - Document inserted successfully:', insertData);

    // Also update profiles.kyc_document_url
    const { error: profileUpdateError } = await supabaseAdmin
      .from('profiles')
      .update({ kyc_document_url: urlData.publicUrl })
      .eq('id', user_id);

    if (profileUpdateError) {
      console.error('KYC upload-file - Profile update error:', profileUpdateError);
    } else {
      console.log('KYC upload-file - Profile updated successfully');
    }

    return res.status(200).json({ 
      success: true, 
      data: insertData,
      document_url: urlData.publicUrl
    });
  } catch (error) {
    console.error('KYC upload-file - Exception:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}

