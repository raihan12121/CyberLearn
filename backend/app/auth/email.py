import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from ..config import settings

logger = logging.getLogger(__name__)

def build_verification_html(full_name: str, verification_link: str) -> str:
    return f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Activate Your CyberLearn Account</title>
  <style>
    body {{
      font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif;
      background-color: #0b0f19;
      color: #e2e8f0;
      margin: 0;
      padding: 0;
    }}
    .container {{
      max-width: 600px;
      margin: 40px auto;
      background-color: #111827;
      border: 1px solid #1f2937;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);
    }}
    .header {{
      background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0284c7 100%);
      padding: 36px 28px;
      text-align: center;
      border-bottom: 1px solid #374151;
    }}
    .logo {{
      font-size: 26px;
      font-weight: 900;
      color: #38bdf8;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      margin-bottom: 4px;
    }}
    .tagline {{
      font-size: 12px;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 2px;
    }}
    .body {{
      padding: 40px 32px;
      text-align: left;
    }}
    .title {{
      font-size: 22px;
      font-weight: 800;
      color: #ffffff;
      margin-bottom: 16px;
    }}
    .text {{
      font-size: 14px;
      line-height: 1.7;
      color: #94a3b8;
      margin-bottom: 24px;
    }}
    .btn-container {{
      text-align: center;
      margin: 36px 0;
    }}
    .btn {{
      display: inline-block;
      background: linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%);
      color: #ffffff !important;
      text-decoration: none;
      font-weight: 700;
      font-size: 15px;
      padding: 16px 36px;
      border-radius: 10px;
      box-shadow: 0 10px 20px -5px rgba(6, 182, 212, 0.5);
      transition: all 0.2s ease;
    }}
    .code-box {{
      background-color: #0f172a;
      border: 1px solid #1e293b;
      padding: 14px;
      border-radius: 8px;
      font-family: 'Fira Code', Consolas, Monaco, monospace;
      font-size: 12px;
      color: #38bdf8;
      word-break: break-all;
      margin-top: 12px;
    }}
    .footer {{
      background-color: #0b0f19;
      padding: 24px;
      text-align: center;
      font-size: 12px;
      color: #64748b;
      border-top: 1px solid #1e293b;
    }}
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">🛡️ CYBERLEARN</div>
      <div class="tagline">Hands-on Cybersecurity Learning Platform</div>
    </div>
    <div class="body">
      <div class="title">Confirm Your Email Address</div>
      <div class="text">
        Hello <strong>{full_name}</strong>,<br><br>
        Welcome to <strong>CyberLearn Security Academy</strong>! To activate your account and start practicing in disposable container sandboxes, please confirm your email address below.
      </div>
      <div class="btn-container">
        <a href="{verification_link}" class="btn" target="_blank">Confirm & Activate Account</a>
      </div>
      <div class="text">
        Or copy and paste the following verification link into your browser:
        <div class="code-box">{verification_link}</div>
      </div>
    </div>
    <div class="footer">
      &copy; 2026 CyberLearn Security Academy. Restricted to authorized student verification.<br>
      If you did not create a CyberLearn account, you can safely ignore this email.
    </div>
  </div>
</body>
</html>
"""

def send_verification_email(recipient_email: str, token: str, full_name: str = "Learner") -> str:
    """
    Dispatch HTML email verification to the user.
    If SMTP settings are configured in environment variables, send via SMTP.
    Otherwise, log the token/URL for easy development testing.
    """
    verification_link = f"{settings.FRONTEND_URL}/verify-email?token={token}"
    html_content = build_verification_html(full_name, verification_link)

    # Check if SMTP credentials are provided
    if settings.SMTP_USER and settings.SMTP_PASSWORD:
        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = "Verify Your CyberLearn Account"
            msg["From"] = f"{settings.EMAILS_FROM_NAME} <{settings.EMAILS_FROM_EMAIL}>"
            msg["To"] = recipient_email

            part_html = MIMEText(html_content, "html")
            msg.attach(part_html)

            with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
                server.starttls()
                server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
                server.sendmail(settings.EMAILS_FROM_EMAIL, [recipient_email], msg.as_string())

            logger.info(f"Verification email sent successfully to {recipient_email}")
            return verification_link
        except Exception as e:
            logger.error(f"Failed to send email via SMTP: {e}")

    logger.info(f"[DEV EMAIL LOG] Verification email for {recipient_email}: {verification_link}")
    return verification_link
