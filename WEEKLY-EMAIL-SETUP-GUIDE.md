# Weekly Marketing Email Setup Guide

## Overview
This guide will help you set up the weekly automated marketing email system for Synax platform.

## Prerequisites
- Vercel account (or similar hosting platform with cron job support)
- Supabase project with SMTP configured
- Environment variables access

## Step 1: Environment Variables

Add the following environment variables to your Vercel project (or hosting platform):

### Required Variables:

1. **CRON_SECRET** (Required for security)
   - Generate a secure random string (e.g., use `openssl rand -hex 32`)
   - This will be used to authenticate cron job requests
   - Example: `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6`

2. **SMTP_HOST** (Optional - defaults to smtp.office365.com)
   - Your SMTP server hostname
   - Example: `smtp.office365.com` or `smtp.gmail.com`

3. **SMTP_PORT** (Optional - defaults to 587)
   - Your SMTP server port
   - Example: `587` (TLS) or `465` (SSL)

4. **SMTP_USER** (Optional - defaults to support@synax.vip)
   - Your SMTP username/email
   - Example: `support@synax.vip`

5. **SMTP_PASS** (Required)
   - Your SMTP password
   - Example: `your-smtp-password-here`

### How to Add Environment Variables in Vercel:

1. Go to your Vercel project dashboard
2. Navigate to **Settings → Environment Variables**
3. Add each variable:
   - **Name**: `CRON_SECRET`
   - **Value**: Your generated secret
   - **Environment**: Production, Preview, Development (select all)
4. Repeat for other variables
5. Click **Save**

## Step 2: Vercel Cron Jobs Setup

### Option A: Using Vercel Cron Jobs (Recommended)

1. Create a file named `vercel.json` in your project root (if it doesn't exist):

```json
{
  "crons": [
    {
      "path": "/api/marketing/send-weekly-email",
      "schedule": "0 10 * * 1"
    }
  ]
}
```

**Schedule Explanation:**
- `0 10 * * 1` = Every Monday at 10:00 AM UTC
- Format: `minute hour day month day-of-week`
- To change time: Modify `10` (hour) and `0` (minute)
- To change day: Modify `1` (Monday) - use `0` for Sunday, `1` for Monday, etc.

2. Deploy to Vercel:
   ```bash
   git add vercel.json
   git commit -m "Add weekly email cron job"
   git push
   ```

3. Vercel will automatically detect and set up the cron job

### Option B: Using External Cron Service

If you prefer using an external cron service (e.g., cron-job.org, EasyCron):

1. **Service URL**: `https://yourdomain.com/api/marketing/send-weekly-email`
2. **Method**: `POST`
3. **Headers**:
   - `Content-Type: application/json`
   - `x-cron-secret: YOUR_CRON_SECRET_VALUE`
4. **Body** (optional):
   ```json
   {
     "cron_secret": "YOUR_CRON_SECRET_VALUE"
   }
   ```
5. **Schedule**: Weekly (every Monday at your preferred time)

## Step 3: Test the Setup

### Manual Test (Before Setting Up Cron):

1. **Using curl**:
   ```bash
   curl -X POST https://yourdomain.com/api/marketing/send-weekly-email \
     -H "Content-Type: application/json" \
     -H "x-cron-secret: YOUR_CRON_SECRET" \
     -d '{"cron_secret": "YOUR_CRON_SECRET"}'
   ```

2. **Using Postman or similar**:
   - Method: `POST`
   - URL: `https://yourdomain.com/api/marketing/send-weekly-email`
   - Headers:
     - `x-cron-secret: YOUR_CRON_SECRET`
   - Body (JSON):
     ```json
     {
       "cron_secret": "YOUR_CRON_SECRET"
     }
     ```

3. **Expected Response**:
   ```json
   {
     "success": true,
     "message": "Weekly marketing emails sent",
     "stats": {
       "total": 10,
       "success": 10,
       "errors": 0
     }
   }
   ```

## Step 4: Database Setup

Make sure you've run the SQL script to add the `last_marketing_email_sent` column:

```sql
-- Run this in Supabase SQL Editor
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS last_marketing_email_sent TIMESTAMP WITH TIME ZONE;
```

## Step 5: Monitoring

### Check Logs:
- Vercel Dashboard → **Deployments** → Select deployment → **Functions** → View logs
- Look for successful email sends or errors

### Monitor Email Delivery:
- Check your SMTP provider's dashboard for delivery reports
- Monitor bounce rates and spam complaints

## Troubleshooting

### Issue: "Unauthorized" Error
- **Solution**: Check that `CRON_SECRET` environment variable is set correctly
- Verify the header `x-cron-secret` matches the environment variable

### Issue: Emails Not Sending
- **Solution**: 
  1. Check SMTP credentials are correct
  2. Verify SMTP server allows connections from Vercel IPs
  3. Check SMTP provider's rate limits
  4. Review Vercel function logs for errors

### Issue: Cron Job Not Running
- **Solution**:
  1. Verify `vercel.json` is in project root
  2. Check cron schedule syntax is correct
  3. Ensure deployment was successful
  4. Check Vercel dashboard → **Cron Jobs** section

### Issue: Users Receiving Multiple Emails
- **Solution**: 
  1. Verify `last_marketing_email_sent` column exists
  2. Check that the timestamp is being updated correctly
  3. Review the filtering logic in the API

## Schedule Examples

- **Every Monday at 10 AM UTC**: `0 10 * * 1`
- **Every Monday at 9 AM UTC**: `0 9 * * 1`
- **Every Sunday at 8 AM UTC**: `0 8 * * 0`
- **Every Friday at 2 PM UTC**: `0 14 * * 5`

## Security Notes

1. **Never commit `CRON_SECRET` to git** - always use environment variables
2. **Use strong, random secrets** - generate using `openssl rand -hex 32`
3. **Rotate secrets periodically** - change `CRON_SECRET` every 3-6 months
4. **Monitor for unauthorized access** - check Vercel logs regularly

## Next Steps

1. ✅ Set up environment variables
2. ✅ Create `vercel.json` with cron schedule
3. ✅ Deploy to Vercel
4. ✅ Test manually first
5. ✅ Monitor first automated run
6. ✅ Adjust email content as needed

## Support

If you encounter issues:
1. Check Vercel function logs
2. Verify all environment variables are set
3. Test SMTP connection separately
4. Review Supabase logs for database errors










