import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Disable body parser to handle large files
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  console.log('Deposit receipt upload API called');
  console.log('Deposit receipt upload - Request headers:', {
    'content-type': req.headers['content-type'],
    'content-length': req.headers['content-length']
  });

  // Check environment variables
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Deposit receipt upload - Missing environment variables');
    return res.status(500).json({ 
      error: 'Server configuration error. Please contact support.',
      details: !supabaseUrl ? 'Missing NEXT_PUBLIC_SUPABASE_URL' : 'Missing SUPABASE_SERVICE_ROLE_KEY'
    });
  }

  try {
    // Log raw body for debugging
    console.log('Deposit receipt upload - Raw body type:', typeof req.body);
    console.log('Deposit receipt upload - Raw body keys:', req.body ? Object.keys(req.body) : 'null/undefined');
    
    const { user_id, file_base64, file_name, file_type } = req.body;

    console.log('Deposit receipt upload - Request data:', {
      user_id,
      file_name,
      file_type,
      has_file_base64: !!file_base64,
      file_base64_type: typeof file_base64,
      file_base64_length: file_base64?.length || 0,
      file_base64_preview: file_base64 ? file_base64.substring(0, 50) + '...' : 'null/undefined'
    });

    if (!user_id) {
      console.error('Deposit receipt upload - Missing user_id');
      return res.status(400).json({ error: 'Missing user_id' });
    }

    // More lenient validation - allow null/undefined/empty for optional receipt
    if (file_base64 === null || file_base64 === undefined || file_base64 === '') {
      console.log('Deposit receipt upload - No file provided, proceeding without receipt');
      return res.status(200).json({ 
        success: true, 
        receipt_url: null,
        message: 'No receipt provided'
      });
    }

    if (typeof file_base64 !== 'string') {
      console.error('Deposit receipt upload - Invalid file_base64 type:', typeof file_base64);
      return res.status(400).json({ 
        error: 'Invalid file data format: expected string',
        received_type: typeof file_base64
      });
    }

    // Check if it's a valid base64 data URL (FileReader.readAsDataURL always returns data:...)
    // FileReader.readAsDataURL() returns format: "data:image/jpeg;base64,/9j/4AAQ..."
    if (!file_base64.startsWith('data:')) {
      console.error('Deposit receipt upload - Invalid base64 format: does not start with data:');
      console.error('Deposit receipt upload - First 50 chars:', file_base64.substring(0, 50));
      return res.status(400).json({ 
        error: 'Invalid file data format: expected data URL',
        hint: 'File must be converted using FileReader.readAsDataURL()'
      });
    }
    
    // Check if it contains base64 data after "data:..."
    if (!file_base64.includes(',')) {
      console.error('Deposit receipt upload - Invalid data URL format: missing comma separator');
      return res.status(400).json({ 
        error: 'Invalid file data format: missing base64 data'
      });
    }

    // Convert base64 to buffer
    let base64Data;
    try {
      base64Data = file_base64.replace(/^data:.*,/, '');
      if (!base64Data || base64Data.length === 0) {
        throw new Error('Empty base64 data after removing prefix');
      }
    } catch (parseError) {
      console.error('Deposit receipt upload - Base64 parse error:', parseError);
      return res.status(400).json({ error: 'Invalid file data format' });
    }

    let fileBuffer;
    try {
      fileBuffer = Buffer.from(base64Data, 'base64');
      if (!fileBuffer || fileBuffer.length === 0) {
        throw new Error('Empty buffer after base64 decode');
      }
    } catch (bufferError) {
      console.error('Deposit receipt upload - Buffer creation error:', bufferError);
      return res.status(400).json({ error: 'Failed to process file data' });
    }

    // Check file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (fileBuffer.length > maxSize) {
      console.error('Deposit receipt upload - File too large:', fileBuffer.length);
      return res.status(400).json({ error: 'File size exceeds 10MB limit' });
    }

    console.log('Deposit receipt upload - File buffer created, size:', fileBuffer.length);

    // Upload file to Supabase Storage using service role (bypasses RLS)
    const fileExt = file_name?.split('.').pop() || 'jpg';
    const fileName = `${user_id}_${Date.now()}.${fileExt}`;
    const filePath = `deposits/${fileName}`;

    console.log('Deposit receipt upload - Uploading to:', filePath);

    // Check if bucket exists and is accessible
    const { data: buckets, error: listError } = await supabaseAdmin.storage.listBuckets();
    if (listError) {
      console.error('Deposit receipt upload - Bucket list error:', listError);
      return res.status(500).json({ 
        error: 'Storage access error',
        details: listError.message 
      });
    }

    const bucketExists = buckets?.some(b => b.name === 'deposit-receipts');
    if (!bucketExists) {
      console.error('Deposit receipt upload - Bucket does not exist');
      return res.status(500).json({ 
        error: 'Storage bucket not found. Please contact support.',
        details: 'deposit-receipts bucket does not exist'
      });
    }

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
      // Provide more specific error messages
      let errorMessage = 'Failed to upload file';
      if (uploadError.message) {
        errorMessage = uploadError.message;
      } else if (uploadError.error) {
        errorMessage = uploadError.error;
      }
      return res.status(500).json({ 
        error: errorMessage,
        details: uploadError
      });
    }

    if (!uploadData) {
      console.error('Deposit receipt upload - Upload succeeded but no data returned');
      return res.status(500).json({ error: 'Upload succeeded but no data returned' });
    }

    console.log('Deposit receipt upload - File uploaded successfully:', uploadData);

    // Get public URL
    const { data: urlData } = supabaseAdmin.storage
      .from('deposit-receipts')
      .getPublicUrl(filePath);

    if (!urlData || !urlData.publicUrl) {
      console.error('Deposit receipt upload - Failed to get public URL');
      return res.status(500).json({ error: 'Failed to generate file URL' });
    }

    console.log('Deposit receipt upload - Public URL:', urlData.publicUrl);

    return res.status(200).json({ 
      success: true, 
      receipt_url: urlData.publicUrl
    });
  } catch (error) {
    console.error('Deposit receipt upload - Exception:', error);
    console.error('Deposit receipt upload - Error stack:', error.stack);
    return res.status(500).json({ 
      error: error.message || 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}







