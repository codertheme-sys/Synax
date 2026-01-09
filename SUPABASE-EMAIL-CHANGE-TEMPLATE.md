# Supabase Email Change Confirmation Template

## Template Location
**Supabase Dashboard → Authentication → Email Templates → "Change Email Address"**

## Template Content

### Subject:
```
Confirm Change of Email Address
```

### Body (HTML):
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirm Email Change</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 40px 20px; text-align: center;">
        <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); padding: 40px 30px; text-align: center;">
              <img src="https://synax.vip/images/logo.png" alt="Synax" style="max-width: 120px; height: auto; margin-bottom: 20px;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">Confirm Email Change</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="margin: 0 0 20px 0; color: #1f2937; font-size: 24px; font-weight: 600;">Hello!</h2>
              
              <p style="margin: 0 0 20px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                You have requested to change your email address from <strong style="color: #1f2937;">{{ .Email }}</strong> to <strong style="color: #1f2937;">{{ .NewEmail }}</strong>.
              </p>
              
              <p style="margin: 0 0 30px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                To confirm this change, please click the button below. This link will expire in 24 hours for security reasons.
              </p>
              
              <div style="text-align: center; margin: 40px 0;">
                <a href="{{ .ConfirmationURL }}" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(59, 130, 246, 0.3);">
                  Confirm Email Change
                </a>
              </div>
              
              <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 30px 0; border-radius: 8px;">
                <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.6;">
                  <strong>⚠️ Security Notice:</strong> If you did not request this email change, please ignore this message and contact our support team immediately.
                </p>
              </div>
              
              <p style="margin: 30px 0 0 0; color: #9ca3af; font-size: 14px; line-height: 1.6;">
                If the button above doesn't work, you can copy and paste this link into your browser:
              </p>
              <p style="margin: 10px 0 0 0; color: #3b82f6; font-size: 14px; word-break: break-all;">
                {{ .ConfirmationURL }}
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px;">
                © 2024 Synax. All rights reserved.
              </p>
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                <a href="https://synax.vip/contact" style="color: #3b82f6; text-decoration: none;">Contact Support</a> | 
                <a href="https://synax.vip/terms" style="color: #3b82f6; text-decoration: none;">Terms of Use</a> | 
                <a href="https://synax.vip/privacy" style="color: #3b82f6; text-decoration: none;">Privacy Policy</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

## How to Update

1. Go to **Supabase Dashboard**
2. Navigate to **Authentication → Email Templates**
3. Find **"Change Email Address"** template
4. Click **Edit**
5. Copy and paste the HTML above into the **Body** field
6. Update the **Subject** field with the subject line above
7. Click **Save**

## Available Variables

- `{{ .Email }}` - Current email address
- `{{ .NewEmail }}` - New email address
- `{{ .ConfirmationURL }}` - Confirmation link URL










