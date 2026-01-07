// pages/api/deposit/get-receipt-url.js - Get signed URL for deposit receipt
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
    const { receipt_url } = req.body;

    if (!receipt_url) {
      return res.status(400).json({ error: 'Missing receipt_url' });
    }

    // Extract file path from the public URL
    // URL format: https://[project].supabase.co/storage/v1/object/public/deposit-receipts/deposits/[filename]
    // or: https://[project].supabase.co/storage/v1/object/public/deposit-receipts/[path]
    const urlMatch = receipt_url.match(/\/storage\/v1\/object\/public\/deposit-receipts\/(.+)$/);
    
    if (!urlMatch) {
      // If it's already a signed URL or different format, return as-is
      return res.status(200).json({ 
        success: true, 
        receipt_url: receipt_url 
      });
    }

    const filePath = urlMatch[1];

    // Create signed URL (valid for 1 hour)
    const { data: signedUrlData, error: signedUrlError } = await supabaseAdmin.storage
      .from('deposit-receipts')
      .createSignedUrl(filePath, 3600); // 1 hour expiry

    if (signedUrlError) {
      console.error('Get receipt URL - Signed URL error:', signedUrlError);
      // Fallback to public URL if signed URL fails
      return res.status(200).json({ 
        success: true, 
        receipt_url: receipt_url 
      });
    }

    return res.status(200).json({ 
      success: true, 
      receipt_url: signedUrlData.signedUrl 
    });
  } catch (error) {
    console.error('Get receipt URL - Exception:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}








