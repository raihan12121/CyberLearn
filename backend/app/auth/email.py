import smtplib
import logging
import httpx
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from ..config import settings

logger = logging.getLogger(__name__)

def build_otp_html(full_name: str, otp_code: str) -> str:
    """
    Build a high-contrast, modern enterprise HTML email template for 6-digit OTP verification.
    """
    return f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CyberLearn Verification Code</title>
  <style>
    body {{
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: #090D16;
      color: #F8FAFC;
      margin: 0;
      padding: 0;
    }}
    .container {{
      max-width: 540px;
      margin: 32px auto;
      background-color: #0F172A;
      border: 1px solid #1E293B;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 20px 40px -15px rgba(0, 0, 0, 0.7);
    }}
    .header {{
      background: linear-gradient(135deg, #090D16 0%, #131B2E 100%);
      padding: 32px 28px 24px;
      text-align: center;
      border-bottom: 1px solid #1E293B;
    }}
    .logo {{
      font-size: 22px;
      font-weight: 800;
      color: #FFFFFF;
      letter-spacing: 0.5px;
    }}
    .logo span {{
      color: #3B82F6;
    }}
    .badge {{
      display: inline-block;
      margin-top: 8px;
      padding: 4px 12px;
      background-color: rgba(59, 130, 246, 0.12);
      border: 1px solid rgba(59, 130, 246, 0.3);
      border-radius: 9999px;
      font-size: 11px;
      font-weight: 700;
      color: #60A5FA;
      text-transform: uppercase;
      letter-spacing: 1px;
    }}
    .body {{
      padding: 36px 32px;
      text-align: left;
    }}
    .title {{
      font-size: 20px;
      font-weight: 700;
      color: #FFFFFF;
      margin-bottom: 12px;
    }}
    .text {{
      font-size: 14px;
      line-height: 1.6;
      color: #94A3B8;
      margin-bottom: 24px;
    }}
    .otp-wrapper {{
      text-align: center;
      margin: 28px 0;
    }}
    .otp-box {{
      display: inline-block;
      background-color: #131B2E;
      border: 1px solid #2563EB;
      padding: 16px 32px;
      border-radius: 12px;
      box-shadow: 0 0 25px rgba(37, 99, 235, 0.25);
    }}
    .otp-code {{
      font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
      font-size: 34px;
      font-weight: 800;
      color: #FFFFFF;
      letter-spacing: 10px;
      text-indent: 10px;
    }}
    .note {{
      font-size: 12px;
      color: #64748B;
      line-height: 1.5;
      text-align: center;
      margin-top: 20px;
    }}
    .footer {{
      background-color: #090D16;
      padding: 20px 24px;
      text-align: center;
      font-size: 11px;
      color: #475569;
      border-top: 1px solid #1E293B;
    }}
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">🛡️ Cyber<span>Learn</span></div>
      <div class="badge">Security Terminal Access</div>
    </div>
    <div class="body">
      <div class="title">Verify Your Email Address</div>
      <div class="text">
        Hello <strong>{full_name}</strong>,<br><br>
        Thank you for joining CyberLearn. Enter the 6-digit verification code below in your browser terminal to activate your operative account:
      </div>
      <div class="otp-wrapper">
        <div class="otp-box">
          <div class="otp-code">{otp_code}</div>
        </div>
      </div>
      <div class="note">
        ⏱️ This security code will expire in <strong>10 minutes</strong>.<br>
        If you did not request this registration, please disregard this transmission.
      </div>
    </div>
    <div class="footer">
      &copy; 2026 CyberLearn Security Academy &bull; Enterprise Cyber Defense Training
    </div>
  </div>
</body>
</html>
"""

def send_otp_verification_email(recipient_email: str, otp_code: str, full_name: str = "Learner") -> bool:
    """
    Dispatches 6-digit OTP verification code via Brevo REST API, SMTP Relay, or Dev Console.
    """
    html_content = build_otp_html(full_name, otp_code)
    subject = f"Your CyberLearn Verification Code: {otp_code}"
    sender_email = settings.EMAILS_FROM_EMAIL or "noreply@cyberlearn.io"
    sender_name = settings.EMAILS_FROM_NAME or "CyberLearn Security"

    # Method 1: Brevo REST API (Fastest & most reliable via HTTP)
    if settings.BREVO_API_KEY:
        try:
            url = "https://api.brevo.com/v3/smtp/email"
            headers = {
                "accept": "application/json",
                "api-key": settings.BREVO_API_KEY.strip(),
                "content-type": "application/json"
            }
            payload = {
                "sender": {"name": sender_name, "email": sender_email},
                "to": [{"email": recipient_email, "name": full_name}],
                "subject": subject,
                "htmlContent": html_content
            }
            with httpx.Client(timeout=10.0) as client:
                res = client.post(url, json=payload, headers=headers)
                if res.status_code in (200, 201, 202):
                    logger.info(f"[BREVO API] Verification email sent successfully to {recipient_email}")
                    return True
                else:
                    logger.warning(f"[BREVO API] API returned status {res.status_code}: {res.text}")
        except Exception as e:
            logger.error(f"[BREVO API] Request error sending to {recipient_email}: {e}")

    # Method 2: Standard SMTP Relay (Brevo SMTP or Custom SMTP)
    if settings.SMTP_USER and settings.SMTP_PASSWORD:
        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = f"{sender_name} <{sender_email}>"
            msg["To"] = recipient_email
            msg.attach(MIMEText(html_content, "html"))

            with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=10) as server:
                server.starttls()
                server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
                server.sendmail(sender_email, [recipient_email], msg.as_string())

            logger.info(f"[BREVO SMTP] Verification email dispatched successfully to {recipient_email}")
            return True
        except Exception as e:
            logger.error(f"[BREVO SMTP] Error sending email via SMTP: {e}")

    # Method 3: Development Terminal Log Fallback
    print(f"\n========================================================")
    print(f"[CYBERLEARN AUTH] OTP VERIFICATION CODE FOR: {recipient_email}")
    print(f"OTP CODE : [ {otp_code} ] (Expires in 10 minutes)")
    print(f"========================================================\n")
    logger.info(f"[DEV EMAIL LOG] OTP for {recipient_email}: {otp_code}")
    return True


def send_verification_email(recipient_email: str, token: str, full_name: str = "Learner") -> str:
    """
    Legacy token link email fallback.
    """
    verification_link = f"{settings.FRONTEND_URL}/verify-email?token={token}"
    return verification_link

