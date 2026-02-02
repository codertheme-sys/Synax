// lib/email-templates-feedback.js
// Feedback response email template

export const getFeedbackResponseTemplate = (
  userName = 'User',
  feedbackSubject = '',
  feedbackMessage = '',
  adminResponse = '',
  feedbackType = 'feedback'
) => {
  const typeLabels = {
    feedback: 'Feedback',
    suggestion: 'Suggestion',
    complaint: 'Complaint'
  };
  const typeLabel = typeLabels[feedbackType] || 'Feedback';
  const typeIcon = feedbackType === 'complaint' ? '⚠️' : feedbackType === 'suggestion' ? '💡' : '💭';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Response to Your ${typeLabel} - Synax</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background-color: #f5f5f5;
    }
    .email-container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
    }
    .header {
      background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
      padding: 40px 30px;
      text-align: center;
    }
    .logo {
      color: #ffffff;
      font-size: 28px;
      font-weight: bold;
      margin: 0;
      text-shadow: 0 2px 4px rgba(0,0,0,0.2);
    }
    .response-icon {
      font-size: 64px;
      margin-bottom: 10px;
    }
    .content {
      padding: 40px 30px;
      color: #333333;
      line-height: 1.6;
    }
    .greeting {
      font-size: 18px;
      font-weight: 600;
      color: #1a1a1a;
      margin-bottom: 20px;
    }
    .message {
      font-size: 16px;
      color: #555555;
      margin-bottom: 20px;
    }
    .feedback-box {
      background-color: #f9fafb;
      border: 1px solid #e5e7eb;
      border-left: 4px solid #3b82f6;
      padding: 20px;
      margin: 25px 0;
      border-radius: 8px;
    }
    .feedback-title {
      font-size: 16px;
      font-weight: 600;
      color: #1a1a1a;
      margin-bottom: 10px;
    }
    .feedback-label {
      font-size: 12px;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 5px;
    }
    .feedback-text {
      font-size: 14px;
      color: #374151;
      margin: 0;
      white-space: pre-wrap;
      word-wrap: break-word;
    }
    .response-box {
      background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
      border: 2px solid #3b82f6;
      padding: 25px;
      margin: 25px 0;
      border-radius: 8px;
    }
    .response-title {
      font-size: 18px;
      font-weight: 600;
      color: #1e40af;
      margin-bottom: 15px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .response-text {
      font-size: 15px;
      color: #1e3a8a;
      margin: 0;
      white-space: pre-wrap;
      word-wrap: break-word;
      line-height: 1.7;
    }
    .button-container {
      text-align: center;
      margin: 35px 0;
    }
    .button {
      display: inline-block;
      background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
      color: #ffffff !important;
      padding: 16px 40px;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      font-size: 16px;
      box-shadow: 0 4px 15px rgba(59, 130, 246, 0.4);
    }
    .info-box {
      background-color: #eff6ff;
      padding: 20px;
      border-radius: 8px;
      margin: 25px 0;
      border-left: 4px solid #3b82f6;
    }
    .info-text {
      font-size: 14px;
      color: #1e40af;
      margin: 0;
      line-height: 1.6;
    }
    .footer {
      background-color: #f9f9f9;
      padding: 30px;
      text-align: center;
      border-top: 1px solid #eeeeee;
    }
    .footer-text {
      font-size: 14px;
      color: #666666;
      margin: 10px 0;
    }
    .footer-link {
      color: #3b82f6;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <div class="response-icon">${typeIcon}</div>
      <h1 class="logo">Response to Your ${typeLabel}</h1>
    </div>
    <div class="content">
      <div class="greeting">Hello ${userName}!</div>
      <div class="message">
        Thank you for reaching out to us. We've reviewed your ${typeLabel.toLowerCase()} and would like to provide you with a response.
      </div>

      <div class="feedback-box">
        <div class="feedback-label">Your ${typeLabel}</div>
        <div class="feedback-title">${feedbackSubject || 'No subject'}</div>
        <p class="feedback-text">${feedbackMessage || 'No message provided'}</p>
      </div>

      <div class="response-box">
        <div class="response-title">
          <span>📝</span>
          <span>Our Response</span>
        </div>
        <p class="response-text">${adminResponse}</p>
      </div>

      <div class="info-box">
        <p class="info-text">
          <strong>Need further assistance?</strong><br>
          If you have any additional questions or concerns, please don't hesitate to contact our support team. We're here to help you 24/7.
        </p>
      </div>

      <div class="button-container">
        <a href="https://www.synax.vip/feedback" class="button">Submit New Feedback</a>
      </div>

      <div class="message" style="margin-top: 30px; font-size: 14px; color: #666666;">
        We value your feedback and are committed to providing you with the best possible experience on Synax.
      </div>
    </div>
    <div class="footer">
      <div class="footer-text">
        <strong>Synax Support Team</strong><br>
        <a href="mailto:support@synax.vip" class="footer-link">support@synax.vip</a>
      </div>
      <div class="footer-text" style="margin-top: 15px; font-size: 12px; color: #999999;">
        This is an automated response to your ${typeLabel.toLowerCase()}. If you have any questions, please contact our support team.
      </div>
    </div>
  </div>
</body>
</html>
  `.trim();
};
