import { Resend } from 'resend';
import nodemailer from 'nodemailer';
import { formatBroadcastBodyHtml } from './formatMailBody';

export { formatBroadcastBodyHtml };

export interface BroadcastMailOptions {
  to: string;
  recipientName?: string;
  subject: string;
  headerBannerUrl?: string | null;
  bodyHtml: string;
}

const globalBroadcastTracker = (globalThis as any)._sentBroadcastTracker || new Map<string, number>();
if (!(globalThis as any)._sentBroadcastTracker) {
  (globalThis as any)._sentBroadcastTracker = globalBroadcastTracker;
}

export async function sendBroadcastMail({
  to,
  recipientName,
  subject,
  headerBannerUrl,
  bodyHtml,
}: BroadcastMailOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const cleanTo = (to || '').trim().toLowerCase();
    const cleanSubj = (subject || '').trim().toLowerCase();
    const dedupKey = `${cleanTo}:${cleanSubj}`;

    const now = Date.now();
    const lastSent = globalBroadcastTracker.get(dedupKey);
    // 15-minute deduplication guard (900,000ms)
    if (lastSent && now - lastSent < 900000) {
      console.warn(`[Global Broadcast Guard] Blocked duplicate broadcast mail to ${cleanTo} ("${subject}")`);
      return { success: true, messageId: 'dedup-blocked' };
    }
    globalBroadcastTracker.set(dedupKey, now);

    const resendApiKey = process.env.RESEND_API_KEY;
    const resendFromEmail = process.env.RESEND_FROM_EMAIL || 'noreply@events.studentforge.in';

    // Process body content: convert URLs to clickable blue links & space paragraphs
    const formattedBodyHtml = formatBroadcastBodyHtml(bodyHtml);

    // Format header banner image HTML if provided (Designed for 1200x1200px high-res banner frames)
    let bannerHtml = '';
    if (headerBannerUrl && headerBannerUrl.trim().length > 0) {
      bannerHtml = `
        <div style="width:100%;text-align:center;background-color:#09090b;padding:0;border-bottom:1px solid #27272a;overflow:hidden;">
          <img 
            src="${headerBannerUrl.trim()}" 
            alt="Header Banner (1200x1200px)" 
            width="580"
            height="580"
            class="banner-img"
            style="width:100%;max-width:580px;height:auto;aspect-ratio:1/1;object-fit:cover;display:block;margin:0 auto;border:0;" 
          />
        </div>
      `;
    }

    const greeting = recipientName ? `Hello ${recipientName},` : 'Hello,';

    const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light dark">
  <meta name="supported-color-schemes" content="light dark">
  <meta name="x-apple-disable-message-reformatting">
  <title>${subject}</title>
  <style>
    :root { color-scheme: light dark; supported-color-schemes: light dark; }
    a { color: #3b82f6 !important; text-decoration: underline !important; font-weight: 500 !important; }
    p { margin: 0 0 16px 0 !important; line-height: 1.7 !important; color: #f4f4f5 !important; }
    h1, h2, h3, h4, h5, h6 { color: #ffffff !important; }
    @media only screen and (max-width: 620px) {
      .email-wrapper { padding: 10px 4px !important; }
      .email-container { width: 100% !important; max-width: 100% !important; border-radius: 12px !important; }
      .banner-img { width: 100% !important; height: auto !important; aspect-ratio: 1 / 1 !important; }
      .content-cell { padding: 24px 18px !important; }
      .body-text { font-size: 14px !important; line-height: 1.6 !important; }
    }
  </style>
</head>
<body class="email-body-bg" style="margin:0;padding:0;background-color:#09090b;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;color:#f4f4f5;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" class="email-wrapper" style="background-color:#09090b;width:100%;min-height:100%;padding:32px 12px;">
    <tr>
      <td align="center" valign="top">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" class="email-container" style="max-width:580px;background-color:#18181b;border:1px solid #27272a;border-radius:16px;overflow:hidden;box-shadow:0 20px 40px rgba(0,0,0,0.6);">

          <!-- 1200x1200px Square Header Banner Frame -->
          ${bannerHtml ? `<tr><td align="center" valign="top">${bannerHtml}</td></tr>` : ''}

          <!-- Main Content Body -->
          <tr>
            <td class="content-cell" style="padding: 32px 28px 24px 28px;">
              <p style="margin:0 0 16px 0;font-size:15px;color:#a1a1aa !important;font-weight:500;">
                ${greeting}
              </p>

              <!-- User Formatted Rich Text Message Body -->
              <div class="body-text" style="font-size:14px;line-height:1.7;color:#f4f4f5 !important;margin-bottom:24px;">
                ${formattedBodyHtml}
              </div>
            </td>
          </tr>

          <!-- Standard Footer -->
          <tr>
            <td style="padding:24px 28px;text-align:center;background-color:#111113;border-top:1px solid #27272a;">
              <p style="margin:0 0 6px 0;font-size:11px;color:#a1a1aa !important;line-height:1.5;">
                © 2026 Student Forge Technologies Private Limited. All rights reserved.
              </p>
              <p style="margin:0;font-size:10px;color:#71717a !important;line-height:1.5;">
                Powered by <strong style="color:#e4e4e7 !important;font-weight:600;">Studio Redlix</strong>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    // 1. Try Resend if configured
    if (resendApiKey && !resendApiKey.startsWith('re_xxxx')) {
      try {
        const resend = new Resend(resendApiKey);
        const data = await resend.emails.send({
          from: `Student Forge <${resendFromEmail}>`,
          to,
          subject,
          html: fullHtml,
        });

        if (data.data?.id) {
          console.log(`[Resend Success] Email sent to ${to} (ID: ${data.data.id})`);
          return { success: true, messageId: data.data.id };
        }

        console.warn(`[Resend Error] API key or request invalid (${JSON.stringify(data.error)}). Falling back to Gmail SMTP...`);
      } catch (resendErr: any) {
        console.warn(`[Resend Exception] ${resendErr?.message}. Falling back to Gmail SMTP...`);
      }
    }

    // 2. Fallback to Nodemailer SMTP (Gmail SMTP)
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      console.log(`[Gmail SMTP Fallback] Sending broadcast email to ${to} via Gmail SMTP (${process.env.EMAIL_USER})...`);
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });
      const info = await transporter.sendMail({
        from: `"Student Forge Admin" <${process.env.EMAIL_USER}>`,
        to,
        subject,
        html: fullHtml,
      });
      return { success: true, messageId: info.messageId };
    }

    console.log(`[Mock Send] Broadcast email to ${to}: "${subject}"`);
    return { success: true, messageId: `mock-${Date.now()}` };
  } catch (err: any) {
    console.error('sendBroadcastMail error:', err);
    return { success: false, error: err?.message || 'Failed to send broadcast email' };
  }
}
