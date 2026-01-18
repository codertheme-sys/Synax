// pages/api/auth/create-profile.js - Create user profile after signup
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
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  console.log('🔐 [CREATE PROFILE API] Request received');

  try {
    const { user_id, email, full_name, username } = req.body;

    console.log('🔐 [CREATE PROFILE API] Request data:', {
      user_id,
      email,
      full_name,
      username
    });

    if (!user_id) {
      console.error('🔐 [CREATE PROFILE API] Missing user_id');
      return res.status(400).json({ success: false, error: 'Missing user_id' });
    }

    if (!email) {
      console.error('🔐 [CREATE PROFILE API] Missing email');
      return res.status(400).json({ success: false, error: 'Missing email' });
    }

    // Check if profile already exists (trigger might have created it)
    const { data: existingProfile, error: checkError } = await supabaseAdmin
      .from('profiles')
      .select('id, email, full_name, username')
      .eq('id', user_id)
      .single();

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = not found
      console.error('🔐 [CREATE PROFILE API] Error checking existing profile:', checkError);
      return res.status(500).json({ success: false, error: 'Error checking profile' });
    }

    if (existingProfile) {
      console.log('🔐 [CREATE PROFILE API] Profile already exists, updating...');
      
      // Update existing profile with provided data
      const { data: updatedProfile, error: updateError } = await supabaseAdmin
        .from('profiles')
        .update({
          email: email.trim(),
          full_name: full_name || existingProfile.full_name,
          username: username || existingProfile.username,
        })
        .eq('id', user_id)
        .select()
        .single();

      if (updateError) {
        console.error('🔐 [CREATE PROFILE API] Error updating profile:', updateError);
        return res.status(500).json({ success: false, error: updateError.message });
      }

      console.log('🔐 [CREATE PROFILE API] ✅ Profile updated successfully');
      return res.status(200).json({ 
        success: true, 
        data: updatedProfile,
        message: 'Profile updated successfully' 
      });
    }

    // Create new profile using service role (bypasses RLS)
    console.log('🔐 [CREATE PROFILE API] Creating new profile...');
    const { data: newProfile, error: insertError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: user_id,
        email: email.trim(),
        full_name: full_name || null,
        username: username || null,
        balance: 0,
        kyc_verified: false,
        kyc_status: 'pending',
      })
      .select()
      .single();

    if (insertError) {
      console.error('🔐 [CREATE PROFILE API] Error creating profile:', insertError);
      return res.status(500).json({ 
        success: false, 
        error: insertError.message || 'Failed to create profile' 
      });
    }

    console.log('🔐 [CREATE PROFILE API] ✅ Profile created successfully');
    return res.status(200).json({ 
      success: true, 
      data: newProfile,
      message: 'Profile created successfully' 
    });

  } catch (error) {
    console.error('🔐 [CREATE PROFILE API] Exception:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message || 'Internal server error' 
    });
  }
}
