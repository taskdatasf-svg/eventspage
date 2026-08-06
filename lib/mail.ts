import { Resend } from 'resend';
import puppeteer from 'puppeteer';
import QRCode from 'qrcode';

const LOGO_URL = 'https://ik.imagekit.io/dypkhqxip/events%20loho';

export interface SendMailParams {
  to: string;
  subject: string;
  event: {
    id: string;
    title: string;
    organizer: string | null;
    location: string | null;
    startDate: string;
    startTime: string;
    price: string;
    coverImage: string | null;
    headerBg: string;
  };
  registration: {
    id: string;
    name: string;
    email: string;
    ticketCode: string;
    answers?: string | null;
    paymentAccountName?: string | null;
    paymentMethod?: string | null;
    paymentTxnId?: string | null;
  };
  type: 'PENDING' | 'CONFIRMED';
  originUrl: string;
}

// ─── Ticket PDF Pass Generator (for PDF attachment ONLY) ──────────────────────
async function generateTicketPdfBuffer(event: any, registration: any): Promise<Buffer | null> {
  try {
    const ticketCode = registration.ticketCode;
    const name = registration.name;
    const email = registration.email;
    const paymentTxnId = registration.paymentTxnId;
    const paymentMethod = registration.paymentMethod;
    const paymentAccountName = registration.paymentAccountName;

    const qrDataUrl = await QRCode.toDataURL(ticketCode, { width: 300, margin: 1 });

    const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0c0d10; color: #ffffff; width: 840px; height: 440px; padding: 24px; display: flex; align-items: center; justify-content: center; }
    .ticket-card { width: 792px; height: 392px; background: #15161b; border: 2px solid #2a2c36; border-radius: 20px; display: flex; overflow: hidden; position: relative; box-shadow: 0 20px 40px rgba(0,0,0,0.8); }
    .left-stub { flex: 1; padding: 28px 32px; display: flex; flex-direction: column; justify-content: space-between; border-right: 2px dashed #2a2c36; }
    .right-stub { width: 240px; background: #111216; padding: 28px 24px; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; }
    .header-row { display: flex; items-center; justify-content: space-between; margin-bottom: 12px; }
    .brand-logo { height: 28px; width: auto; filter: brightness(0) invert(1); }
    .ticket-id { font-family: monospace; font-size: 13px; font-weight: 800; color: #a1a1aa; background: #22232c; border: 1px solid #333545; padding: 4px 10px; border-radius: 6px; }
    .event-title { font-size: 22px; font-weight: 800; color: #ffffff; margin-bottom: 12px; line-height: 1.2; }
    .details-row { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; border-top: 1px solid #262833; padding-top: 16px; }
    .label { font-size: 9px; text-transform: uppercase; color: #a1a1aa; font-weight: 700; letter-spacing: 1px; margin-bottom: 3px; }
    .detail-value { font-size: 13px; font-weight: 700; color: #ffffff; }
    .attendee-box { display: flex; align-items: center; gap: 12px; border-top: 1px solid #262833; padding-top: 16px; margin-top: 12px; }
    .avatar { width: 36px; height: 36px; border-radius: 9999px; background: #ffffff; color: #000000; font-weight: 900; font-size: 14px; display: flex; align-items: center; justify-content: center; }
    .attendee-name { font-size: 14px; font-weight: 800; color: #ffffff; }
    .attendee-email { font-size: 11px; color: #a1a1aa; font-family: monospace; }
    .qr-wrapper { background: #ffffff; padding: 8px; border-radius: 12px; margin-bottom: 12px; }
    .stub-title { font-size: 11px; font-weight: 800; text-transform: uppercase; color: #ffffff; letter-spacing: 1px; }
    .stub-subtitle { font-size: 10px; color: #a1a1aa; margin-top: 2px; }
  </style>
</head>
<body>
  <div class="ticket-card">
    <div class="left-stub">
      <div>
        <div class="header-row">
          <img src="${LOGO_URL}" class="brand-logo" alt="StudentForge" />
          <span class="ticket-id">${ticketCode}</span>
        </div>
        <h1 class="event-title">${event.title}</h1>
      </div>

      <div class="details-row">
        <div><div class="label">Date & Time</div><div class="detail-value">${event.startDate} at ${event.startTime}</div></div>
        <div><div class="label">Location</div><div class="detail-value">${event.location || 'Online'}</div></div>
        <div><div class="label">Price</div><div class="detail-value">${event.price || 'Free'}</div></div>
      </div>

      <div class="attendee-box">
        <div class="avatar">${name?.substring(0, 2).toUpperCase() || 'SF'}</div>
        <div>
          <div class="attendee-name">${name}</div>
          <div class="attendee-email">${email}</div>
        </div>
      </div>
    </div>

    <div class="right-stub">
      <div class="qr-wrapper">
        <img src="${qrDataUrl}" width="120" height="120" alt="QR Code" />
      </div>
      <div class="stub-title">Presenter Pass</div>
      <div class="stub-subtitle">Scan for entry</div>
    </div>
  </div>
</body>
</html>`;

    const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    await page.setViewport({ width: 840, height: 440 });
    await page.setContent(htmlContent, { waitUntil: 'load' });
    const pdfBuffer = await page.pdf({ width: '840px', height: '440px', printBackground: true });
    await browser.close();
    return Buffer.from(pdfBuffer);
  } catch (err) {
    console.error('Failed to generate ticket PDF for email attachment:', err);
    return null;
  }
}

// ─── Main Export ──────────────────────────────────────────────────────────────
export async function sendEventMail({ to, subject, event, registration, type, originUrl }: SendMailParams) {
  try {
    const resendApiKey = process.env.RESEND_API_KEY || 're_xxxxxxxxx';
    const resendFromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
    const resend = new Resend(resendApiKey);

    const passUrl = `${originUrl}/events/${event.id}/register`;
    const isPending = type === 'PENDING';

    // 1. Generate Base64 Data URI for inline QR Code (NO separate attachment file!)
    let qrDataUrl = '';
    if (!isPending) {
      try {
        qrDataUrl = await QRCode.toDataURL(registration.ticketCode, { width: 320, margin: 1 });
      } catch (e) {
        console.error('Failed to generate local QR code Data URL for email:', e);
      }
    }

    // 2. Generate Ticket PDF Pass (The ONLY attachment file!)
    const attachments: { filename: string; content: Buffer }[] = [];
    if (!isPending) {
      const pdfBuffer = await generateTicketPdfBuffer(event, registration);
      if (pdfBuffer) {
        attachments.push({ filename: `ticket-${registration.ticketCode}.pdf`, content: pdfBuffer });
      }
    }

    // 3. Header Event Cover Banner HTML
    let bannerHtml = '';
    if (event.coverImage && (event.coverImage.startsWith('http://') || event.coverImage.startsWith('https://'))) {
      bannerHtml = `<div style="width:100%;text-align:center;background-color:#14151c;border-bottom:1px solid #272832;">
        <img src="${event.coverImage}" alt="${event.title}" width="580" style="width:100%;max-width:580px;height:auto;display:block;margin:0 auto;border:0;" />
      </div>`;
    }

    // 4. Registration Answers & Payment Details HTML
    let answersHtml = '';
    if (registration.answers) {
      try {
        const parsed = JSON.parse(registration.answers);
        const entries = Object.entries(parsed);
        if (entries.length > 0) {
          answersHtml = `
            <div style="border-top: 1px solid #272832; padding-top: 12px; margin-top: 12px;">
              <span style="font-size: 10px; color: #71717a; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 6px;">Registration info</span>
              <table style="width: 100%; border-collapse: collapse; font-size: 12px; color: #e4e4e7;">
                ${entries.map(([k, v]) => `
                  <tr>
                    <td style="padding: 3px 0; color: #a1a1aa; width: 40%; font-weight: 500;">${k}:</td>
                    <td style="padding: 3px 0; text-align: right; font-weight: 600; color: #ffffff;">${typeof v === 'boolean' ? (v ? 'Yes' : 'No') : String(v)}</td>
                  </tr>
                `).join('')}
              </table>
            </div>`;
        }
      } catch (e) { console.error('Error parsing answers for email:', e); }
    }

    let paymentHtml = '';
    if (registration.paymentTxnId) {
      paymentHtml = `
        <div style="border-top: 1px solid #272832; padding-top: 12px; margin-top: 12px;">
          <span style="font-size: 10px; color: #71717a; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 6px;">Payment details</span>
          <table style="width: 100%; border-collapse: collapse; font-size: 12px; color: #e4e4e7;">
            <tr><td style="padding: 3px 0; color: #a1a1aa; width: 40%;">Method:</td><td style="padding: 3px 0; text-align: right; font-weight: 600; color: #ffffff;">${registration.paymentMethod}</td></tr>
            <tr><td style="padding: 3px 0; color: #a1a1aa;">Account name:</td><td style="padding: 3px 0; text-align: right; font-weight: 600; color: #ffffff;">${registration.paymentAccountName}</td></tr>
            <tr><td style="padding: 3px 0; color: #a1a1aa;">Transaction ID:</td><td style="padding: 3px 0; text-align: right; font-family: monospace; font-size: 11px; color: #ffffff;">${registration.paymentTxnId}</td></tr>
          </table>
        </div>`;
    }

    // 5. Main Email Template HTML
    const mailHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="dark">
  <title>${subject}</title>
  <style>
    body, table, td, p, a, span { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif !important; }
    img { max-width: 100%; height: auto; }
    @media only screen and (max-width: 600px) {
      .container-table { width: 100% !important; border-radius: 0 !important; }
      .content-padding { padding: 24px 16px !important; }
      .header-padding { padding: 24px 16px !important; }
      .big-logo { height: 40px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#0b0c10;color:#e4e4e7;-webkit-font-smoothing:antialiased;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#0b0c10;width:100%;padding:30px 10px;">
    <tr>
      <td align="center" valign="top">
        <table role="presentation" class="container-table" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:580px;background-color:#14151c;border:1px solid #272832;border-radius:16px;overflow:hidden;box-shadow:0 12px 40px rgba(0,0,0,0.6);">

          <!-- Top Header: BIG Brand Logo -->
          <tr>
            <td class="header-padding" style="padding:32px 28px 24px 28px;background-color:#181922;border-bottom:1px solid #272832;text-align:center;">
              <img src="${LOGO_URL}" alt="StudentForge" height="48" class="big-logo" style="height:48px;width:auto;display:inline-block;border:0;outline:none;" />
              <div style="margin-top:14px;display:inline-block;padding:4px 12px;border-radius:9999px;background-color:#20222e;border:1px solid #333545;color:#e4e4e7;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;">
                ${isPending ? 'REGISTRATION PENDING APPROVAL' : 'TICKET REGISTRATION CONFIRMED'}
              </div>
            </td>
          </tr>

          <!-- Event Cover Banner -->
          ${bannerHtml ? `<tr><td style="padding:0;">${bannerHtml}</td></tr>` : ''}

          <!-- Main Content Body -->
          <tr>
            <td class="content-padding" style="padding:32px 28px;">

              <!-- Status Message -->
              <h1 style="margin:0 0 10px 0;font-size:22px;font-weight:800;color:#ffffff;line-height:1.3;letter-spacing:-0.3px;">
                ${isPending ? 'Registration Received' : 'Registration Confirmed'}
              </h1>
              <p style="margin:0 0 24px 0;color:#a1a1aa;font-size:14px;line-height:1.6;">
                ${isPending
                  ? 'Your registration request has been submitted to the organizer. We will notify you as soon as your ticket is approved.'
                  : 'Your registration was successfully processed! Your entry ticket pass is attached as a PDF document.'}
              </p>

              <!-- Event & Attendee Info Box -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#1a1b24;border:1px solid #272832;border-radius:12px;padding:20px;margin-bottom:24px;box-sizing:border-box;">
                
                <!-- Event Details -->
                <tr>
                  <td style="border-bottom:1px solid #272832;padding-bottom:12px;">
                    <span style="font-size:10px;color:#71717a;font-weight:700;text-transform:uppercase;letter-spacing:1px;display:block;margin-bottom:6px;">Event Details</span>
                    <h3 style="margin:0 0 8px 0;color:#ffffff;font-size:16px;font-weight:700;">${event.title}</h3>
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="font-size:13px;color:#e4e4e7;">
                      <tr><td style="padding:4px 0;color:#a1a1aa;width:38%;">Date &amp; Time:</td><td style="padding:4px 0;text-align:right;color:#ffffff;font-weight:600;">${event.startDate} at ${event.startTime}</td></tr>
                      <tr><td style="padding:4px 0;color:#a1a1aa;">Venue / Location:</td><td style="padding:4px 0;text-align:right;color:#ffffff;font-weight:600;">${event.location || 'Online'}</td></tr>
                      <tr><td style="padding:4px 0;color:#a1a1aa;">Admission:</td><td style="padding:4px 0;text-align:right;color:#ffffff;font-weight:700;">${event.price}</td></tr>
                    </table>
                  </td>
                </tr>

                <!-- Attendee Details -->
                <tr>
                  <td style="padding-top:12px;">
                    <span style="font-size:10px;color:#71717a;font-weight:700;text-transform:uppercase;letter-spacing:1px;display:block;margin-bottom:6px;">Attendee Details</span>
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="font-size:13px;color:#e4e4e7;">
                      <tr><td style="padding:4px 0;color:#a1a1aa;width:38%;">Attendee Name:</td><td style="padding:4px 0;text-align:right;font-weight:600;color:#ffffff;">${registration.name}</td></tr>
                      <tr><td style="padding:4px 0;color:#a1a1aa;">Email Address:</td><td style="padding:4px 0;text-align:right;font-weight:500;font-family:monospace;color:#ffffff;">${registration.email}</td></tr>
                      <tr><td style="padding:4px 0;color:#a1a1aa;">Ticket Code:</td><td style="padding:4px 0;text-align:right;font-weight:700;font-family:monospace;color:#ffffff;">
                        ${isPending ? 'PENDING APPROVAL' : registration.ticketCode}
                      </td></tr>
                    </table>
                  </td>
                </tr>

                <!-- Answers + Payment -->
                <tr><td>${answersHtml}${paymentHtml}</td></tr>

              </table>

              <!-- Native Inline Base64 QR Code (Confirmed only, NO attachment file!) -->
              ${!isPending && qrDataUrl ? `
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#1a1b24;border:1px solid #272832;border-radius:12px;padding:24px;text-align:center;margin-bottom:28px;">
                <tr>
                  <td align="center">
                    <span style="font-size:10px;font-weight:800;color:#a1a1aa;text-transform:uppercase;letter-spacing:1.5px;display:block;margin-bottom:14px;">ENTRY PASS QR CODE</span>
                    
                    <div style="display:inline-block;background:#ffffff;padding:10px;border-radius:12px;margin-bottom:12px;">
                      <img src="${qrDataUrl}" width="140" height="140" alt="Ticket QR Code" style="display:block;margin:0 auto;border:0;width:140px;height:140px;" />
                    </div>

                    <div style="font-family:monospace;font-size:15px;font-weight:800;color:#ffffff;letter-spacing:1.5px;">${registration.ticketCode}</div>
                    <span style="font-size:11px;color:#71717a;display:block;margin-top:6px;">Full Pass Attached as PDF Document</span>
                  </td>
                </tr>
              </table>` : ''}

              <!-- Action CTA Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="text-align:center;margin-bottom:24px;">
                <tr>
                  <td align="center">
                    <a href="${passUrl}" style="display:inline-block;padding:14px 32px;background-color:#ffffff;color:#000000;font-size:14px;font-weight:800;text-decoration:none;border-radius:10px;box-shadow:0 4px 16px rgba(255,255,255,0.15);">
                      ${isPending ? 'Check Registration Status' : 'View Ticket Pass Online'}
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0;font-size:12px;color:#71717a;text-align:center;">
                If you have any questions, reply directly to this email or contact ${event.organizer || 'StudentForge'}.
              </p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 24px;background-color:#0f1015;border-top:1px solid #272832;text-align:center;font-size:11px;color:#71717a;">
              © ${new Date().getFullYear()} Student Forge Technologies Private Limited. All rights reserved.
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    // ── 1. Try Resend ─────────────────────────────────────────────────────────
    if (resendApiKey && !resendApiKey.startsWith('re_xxxx')) {
      try {
        const resendResult = await resend.emails.send({
          from: `Student Forge <${resendFromEmail}>`,
          to,
          subject,
          text: isPending
            ? `Pending Approval: Your registration for ${event.title} is awaiting organizer approval.`
            : `Confirmed: Your registration for ${event.title} is confirmed! Ticket Code: ${registration.ticketCode}. Your ticket PDF is attached.`,
          html: mailHtml,
          attachments, // Contains ONLY the 1 PDF attachment file!
        });

        if (resendResult.data?.id) {
          console.log(`[Resend Success] Email sent successfully to ${to} (${type})`);
          return { success: true, messageId: resendResult.data.id };
        }

        console.warn(`[Resend Error] API key or request invalid (${JSON.stringify(resendResult.error)}). Falling back to Gmail SMTP...`);
      } catch (resendErr: any) {
        console.warn(`[Resend Exception] ${resendErr?.message}. Falling back to Gmail SMTP...`);
      }
    }

    // ── 2. Fallback to Nodemailer Gmail SMTP ──────────────────────────────────
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      console.log(`[Gmail SMTP Fallback] Sending event email to ${to} via ${process.env.EMAIL_USER}...`);
      const nodemailerModule = await import('nodemailer');
      const transporter = nodemailerModule.default.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      const info = await transporter.sendMail({
        from: `"Student Forge" <${process.env.EMAIL_USER}>`,
        to,
        subject,
        text: isPending
          ? `Pending Approval: Your registration for ${event.title} is awaiting organizer approval.`
          : `Confirmed: Your registration for ${event.title} is confirmed! Ticket Code: ${registration.ticketCode}. Your ticket PDF is attached.`,
        html: mailHtml,
        attachments, // Contains ONLY the 1 PDF attachment file!
      });

      return { success: true, messageId: info.messageId };
    }

    return { success: false, error: 'No email service configured' };
  } catch (err: any) {
    console.error('sendEventMail error:', err);
    return { success: false, error: err.message };
  }
}
