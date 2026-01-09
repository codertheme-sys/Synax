# Supabase Email Verification Setup

## Problem
- Verification email is not being sent after signup
- Users can login without email verification

## Solution

### 1. Supabase Dashboard Settings

Go to your Supabase Dashboard → Authentication → Settings:

1. **Enable Email Confirmation:**
   - Find "Enable email confirmations" toggle
   - Make sure it's **ENABLED** (ON)

2. **Email Templates:**
   - Go to Authentication → Email Templates
   - Check "Confirm signup" template
   - Make sure it's active and properly configured

3. **SMTP Settings (if using custom SMTP):**
   - Go to Settings → Auth
   - If you're using a custom SMTP provider, make sure it's configured correctly
   - If using Supabase's default email service, it should work automatically

4. **Site URL:**
   - Go to Settings → API
   - Make sure "Site URL" is set to your production URL (e.g., `https://yourdomain.com`)
   - For local development, use `http://localhost:3000`

5. **Redirect URLs:**
   - Go to Authentication → URL Configuration
   - Add your redirect URLs:
     - `http://localhost:3000/login` (for development)
     - `https://yourdomain.com/login` (for production)

### 2. Code Changes Made

The code has been updated to:
- **Strictly enforce email verification** in login process
- **Sign out users** immediately if they try to login without email confirmation
- **Show modal** prompting users to verify their email
- **Force email redirect** in signup process

### 3. Testing

1. **Test Signup:**
   - Create a new account
   - Check your email inbox (and spam folder)
   - You should receive a confirmation email

2. **Test Login Without Verification:**
   - Try to login with an unverified account
   - You should see an error modal
   - Login should be blocked

3. **Test Login After Verification:**
   - Click the confirmation link in the email
   - Try to login
   - Login should succeed

### 4. Troubleshooting

If emails are still not being sent:

1. **Check Supabase Logs:**
   - Go to Logs → Auth Logs
   - Look for email sending errors

2. **Check Email Provider:**
   - If using custom SMTP, verify credentials
   - Check email provider's sending limits

3. **Check Spam Folder:**
   - Emails might be going to spam
   - Add Supabase email to whitelist

4. **Rate Limiting:**
   - Supabase has rate limits on email sending
   - Wait a few minutes between signup attempts

### 5. Important Notes

- **Email confirmation is now MANDATORY** - users cannot login without verifying their email
- The system will automatically sign out any user who tries to login without email confirmation
- Users can request a new confirmation email from the login modal







## Problem
- Verification email is not being sent after signup
- Users can login without email verification

## Solution

### 1. Supabase Dashboard Settings

Go to your Supabase Dashboard → Authentication → Settings:

1. **Enable Email Confirmation:**
   - Find "Enable email confirmations" toggle
   - Make sure it's **ENABLED** (ON)

2. **Email Templates:**
   - Go to Authentication → Email Templates
   - Check "Confirm signup" template
   - Make sure it's active and properly configured

3. **SMTP Settings (if using custom SMTP):**
   - Go to Settings → Auth
   - If you're using a custom SMTP provider, make sure it's configured correctly
   - If using Supabase's default email service, it should work automatically

4. **Site URL:**
   - Go to Settings → API
   - Make sure "Site URL" is set to your production URL (e.g., `https://yourdomain.com`)
   - For local development, use `http://localhost:3000`

5. **Redirect URLs:**
   - Go to Authentication → URL Configuration
   - Add your redirect URLs:
     - `http://localhost:3000/login` (for development)
     - `https://yourdomain.com/login` (for production)

### 2. Code Changes Made

The code has been updated to:
- **Strictly enforce email verification** in login process
- **Sign out users** immediately if they try to login without email confirmation
- **Show modal** prompting users to verify their email
- **Force email redirect** in signup process

### 3. Testing

1. **Test Signup:**
   - Create a new account
   - Check your email inbox (and spam folder)
   - You should receive a confirmation email

2. **Test Login Without Verification:**
   - Try to login with an unverified account
   - You should see an error modal
   - Login should be blocked

3. **Test Login After Verification:**
   - Click the confirmation link in the email
   - Try to login
   - Login should succeed

### 4. Troubleshooting

If emails are still not being sent:

1. **Check Supabase Logs:**
   - Go to Logs → Auth Logs
   - Look for email sending errors

2. **Check Email Provider:**
   - If using custom SMTP, verify credentials
   - Check email provider's sending limits

3. **Check Spam Folder:**
   - Emails might be going to spam
   - Add Supabase email to whitelist

4. **Rate Limiting:**
   - Supabase has rate limits on email sending
   - Wait a few minutes between signup attempts

### 5. Important Notes

- **Email confirmation is now MANDATORY** - users cannot login without verifying their email
- The system will automatically sign out any user who tries to login without email confirmation
- Users can request a new confirmation email from the login modal











