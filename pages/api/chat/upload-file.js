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
    const { user_id, file_base64, file_name, file_type } = req.body;

    if (!user_id) {
      return res.status(400).json({ 
        success: false,
        error: 'Missing user_id' 
      });
    }

    if (!file_base64) {
      return res.status(400).json({ 
        success: false,
        error: 'Missing file data' 
      });
    }

    if (!file_name) {
      return res.status(400).json({ 
        success: false,
        error: 'Missing file name' 
      });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    const allowedExtensions = ['jpeg', 'jpg', 'png', 'gif', 'pdf', 'txt', 'doc', 'docx'];
    
    const fileExt = file_name.split('.').pop()?.toLowerCase();
    if (!allowedExtensions.includes(fileExt)) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid file type. Only JPEG, PNG, GIF, PDF, TXT, DOC, and DOCX files are allowed.' 
      });
    }

    // Validate file size (max 10MB)
    const base64Data = file_base64.replace(/^data:.*,/, '');
    const fileBuffer = Buffer.from(base64Data, 'base64');
    const fileSizeMB = fileBuffer.length / (1024 * 1024);
    
    if (fileSizeMB > 10) {
      return res.status(400).json({ 
        success: false,
        error: 'File size exceeds 10MB limit.' 
      });
    }

    // Upload file to Supabase Storage
    const fileName = `${user_id}_${Date.now()}_${file_name}`;
    const filePath = `chat-attachments/${fileName}`;

    // Upload to Storage
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('chat-attachments')
      .upload(filePath, fileBuffer, {
        contentType: file_type || `application/${fileExt}`,
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('Chat file upload error:', uploadError);
      return res.status(500).json({ 
        success: false,
        error: `Failed to upload file: ${uploadError.message}` 
      });
    }

    // Get public URL
    const { data: urlData } = supabaseAdmin.storage
      .from('chat-attachments')
      .getPublicUrl(filePath);

    return res.status(200).json({ 
      success: true, 
      file_url: urlData.publicUrl,
      file_name: file_name,
      file_type: fileExt
    });

  } catch (error) {
    console.error('Chat file upload exception:', error);
    return res.status(500).json({ 
      success: false,
      error: error.message || 'Internal server error' 
    });
  }
}
