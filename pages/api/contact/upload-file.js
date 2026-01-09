// pages/api/contact/upload-file.js - Upload contact form attachment
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
    const { file_base64, file_name, file_type } = req.body;

    if (!file_base64) {
      return res.status(400).json({ error: 'Missing file data' });
    }

    if (!file_name) {
      return res.status(400).json({ error: 'Missing file name' });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf', 'text/plain'];
    const allowedExtensions = ['jpeg', 'jpg', 'png', 'pdf', 'txt'];
    
    const fileExt = file_name.split('.').pop()?.toLowerCase();
    if (!allowedExtensions.includes(fileExt)) {
      return res.status(400).json({ 
        error: 'Invalid file type. Only JPEG, PNG, PDF, and TXT files are allowed.' 
      });
    }

    // Validate file size (max 10MB)
    const base64Data = file_base64.replace(/^data:.*,/, '');
    const fileBuffer = Buffer.from(base64Data, 'base64');
    const fileSizeMB = fileBuffer.length / (1024 * 1024);
    
    if (fileSizeMB > 10) {
      return res.status(400).json({ 
        error: 'File size exceeds 10MB limit.' 
      });
    }

    // Upload file to Supabase Storage
    const fileName = `contact_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `contact-attachments/${fileName}`;

    // Upload to Storage
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('contact-attachments')
      .upload(filePath, fileBuffer, {
        contentType: file_type || `application/${fileExt}`,
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('Contact file upload error:', uploadError);
      return res.status(500).json({ 
        error: `Failed to upload file: ${uploadError.message}` 
      });
    }

    // Get public URL
    const { data: urlData } = supabaseAdmin.storage
      .from('contact-attachments')
      .getPublicUrl(filePath);

    return res.status(200).json({ 
      success: true, 
      file_url: urlData.publicUrl,
      file_name: file_name,
      file_type: fileExt
    });

  } catch (error) {
    console.error('Contact file upload exception:', error);
    return res.status(500).json({ 
      error: error.message || 'Internal server error' 
    });
  }
}

