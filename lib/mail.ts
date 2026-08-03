import { Resend } from 'resend';
import puppeteer from 'puppeteer';

// ─── Shared Branding ─────────────────────────────────────────────────────────
const LOGO_URL = 'https://ik.imagekit.io/dypkhqxip/eventssflo';
const FOOTER_HTML = `
  <tr>
    <td style="padding: 28px 24px; text-align: center; background-color: #f6f8fa; border-top: 1px solid #e1e4e8;">
      <div style="margin-bottom: 14px;">
        <img src="${LOGO_URL}" alt="Student Forge" height="28" style="height: 28px; width: auto; display: inline-block; vertical-align: middle; border: 0;" />
      </div>
      <p style="margin: 0 0 6px 0; font-size: 11px; font-family: -apple-system, BlinkMacSystemFont, sans-serif; color: #586069;">
        © 2026 Student Forge Technologies Private Limited. All rights reserved.
      </p>
      <p style="margin: 0; font-size: 10px; font-family: -apple-system, BlinkMacSystemFont, sans-serif; color: #959da5;">
        Powered by <strong style="color: #24292e;">Studio Redlix</strong>
      </p>
    </td>
  </tr>
`;

// ─── Types ────────────────────────────────────────────────────────────────────
interface SendMailParams {
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
    paymentMethod?: string | null;
    paymentAccountName?: string | null;
    paymentTxnId?: string | null;
  };
  type: 'PENDING' | 'CONFIRMED';
  originUrl: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const getHexColor = (bgClass: string) => {
  if (bgClass.includes('[#818cf8]')) return '#4f46e5';
  if (bgClass.includes('[#fef08a]')) return '#b45309';
  if (bgClass.includes('[#6ee7b7]')) return '#059669';
  if (bgClass.includes('[#fbcfe8]')) return '#db2777';
  if (bgClass.includes('[#fed7aa]')) return '#ea580c';
  return '#4f46e5';
};

const getFallbackSoftColor = (headerBg: string | null | undefined): string => {
  if (!headerBg) return '#ff6b6b';
  const c = headerBg.toLowerCase();
  if (c.includes('818cf8')) return '#ff6b6b';
  if (c.includes('fef08a') || c.includes('ffe600')) return '#fde047';
  if (c.includes('6ee7b7')) return '#86efac';
  if (c.includes('fbcfe8')) return '#fbcfe8';
  if (c.includes('fed7aa')) return '#fdba74';
  return '#ff6b6b';
};

// ─── Generate ticket PDF buffer via Puppeteer ─────────────────────────────────
async function generateTicketPdfBuffer(
  event: SendMailParams['event'],
  registration: SendMailParams['registration']
): Promise<Buffer | null> {
  try {
    const { name, email, ticketCode, paymentMethod, paymentAccountName, paymentTxnId } = registration;
    const extractedColor = getFallbackSoftColor(event.headerBg);

    const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { background-color: #161618; color: #fff; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 40px; display: flex; align-items: center; justify-content: center; min-height: 100vh; box-sizing: border-box; }
    .ticket-card { width: 760px; height: 360px; background-color: #1c1c1f; border: 1px solid #2e2e34; border-radius: 20px; display: flex; flex-direction: row; align-items: stretch; box-sizing: border-box; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); }
    .left-stub { flex: 1; padding: 32px; display: flex; flex-direction: column; justify-content: space-between; box-sizing: border-box; min-width: 0; }
    .header-row { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; }
    .event-title-container { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
    .label { font-size: 9px; text-transform: uppercase; color: #88888e; font-weight: 600; letter-spacing: 1px; }
    .event-title { font-size: 20px; font-weight: 800; color: #fff; margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .ticket-id-container { display: flex; flex-direction: column; align-items: flex-end; gap: 4px; flex-shrink: 0; }
    .ticket-id { font-size: 13px; font-family: monospace; font-weight: 700; color: #fff; }
    .details-row { display: flex; flex-direction: row; gap: 36px; border-top: 1px solid #2e2e34; padding-top: 18px; margin: 18px 0; }
    .detail-col { display: flex; flex-direction: column; gap: 2px; }
    .detail-value { font-size: 12px; font-weight: 600; color: #fff; }
    .highlight { color: ${extractedColor}; font-weight: 700; }
    .attendee-box { background-color: #222226; border: 1px solid #2e2e34; border-radius: 12px; padding: 14px; display: flex; flex-direction: column; gap: 10px; box-sizing: border-box; }
    .attendee-profile { display: flex; align-items: center; gap: 12px; }
    .avatar { width: 32px; height: 32px; border-radius: 50%; background-color: #2e2e34; border: 1px solid #3e3e46; display: flex; align-items: center; justify-content: center; color: ${extractedColor}; font-weight: 700; font-size: 12px; font-family: monospace; }
    .attendee-name { font-size: 12px; font-weight: 700; color: #fff; }
    .attendee-email { font-size: 10px; color: #a1a1aa; font-family: monospace; }
    .txn-details { border-top: 1px solid #2e2e34; padding-top: 8px; display: flex; justify-content: space-between; font-size: 9px; color: #71717a; }
    .txn-val { color: #d4d4d8; font-weight: 600; }
    .tear-line { display: flex; flex-direction: column; align-items: center; justify-content: center; width: 1px; box-sizing: border-box; border-left: 2px dashed #2e2e34; margin: 18px 0; }
    .right-stub { width: 240px; background-color: #1c1c1f; padding: 32px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 16px; box-sizing: border-box; flex-shrink: 0; }
    .qr-wrapper { padding: 12px; background-color: #fff; border-radius: 12px; display: flex; align-items: center; justify-content: center; }
    .stub-footer { display: flex; flex-direction: column; gap: 2px; text-align: center; }
    .stub-title { font-size: 10px; font-weight: 700; color: #d1d1d6; text-transform: uppercase; letter-spacing: 1px; }
    .stub-subtitle { font-size: 8px; color: #71717a; text-transform: uppercase; letter-spacing: 0.5px; }
  </style>
</head>
<body>
  <div class="ticket-card">
    <div class="left-stub">
      <div class="header-row">
        <div class="event-title-container">
          <span class="label">Event Name</span>
          <h3 class="event-title">${event.title}</h3>
        </div>
        <div class="ticket-id-container">
          <span class="label">Ticket ID</span>
          <span class="ticket-id">${ticketCode}</span>
        </div>
      </div>
      <div class="details-row">
        <div class="detail-col">
          <span class="label">Date &amp; Time</span>
          <span class="detail-value">${event.startDate} at ${event.startTime}</span>
        </div>
        <div class="detail-col" style="max-width:180px">
          <span class="label">Location</span>
          <span class="detail-value" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${event.location || 'Online'}</span>
        </div>
        <div class="detail-col">
          <span class="label">Amount</span>
          <span class="detail-value highlight">${event.price || 'Free'}</span>
        </div>
      </div>
      <div class="attendee-box">
        <div class="attendee-profile">
          <div class="avatar">${name?.substring(0, 2).toUpperCase() || 'SF'}</div>
          <div style="display:flex;flex-direction:column">
            <span class="attendee-name">${name}</span>
            <span class="attendee-email">${email}</span>
          </div>
        </div>
        ${paymentTxnId ? `
        <div class="txn-details">
          <div>Method: <span class="txn-val">${paymentMethod}</span></div>
          <div>Account: <span class="txn-val">${paymentAccountName}</span></div>
          <div>Txn: <span class="txn-val" style="font-family:monospace">${paymentTxnId}</span></div>
        </div>` : ''}
      </div>
    </div>
    <div class="tear-line"></div>
    <div class="right-stub">
      <div class="qr-wrapper">
        <img src="https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${ticketCode}" width="120" height="120" alt="QR Code" />
      </div>
      <div class="stub-footer">
        <span class="stub-title">Presenter Pass</span>
        <span class="stub-subtitle">Scan for entry</span>
      </div>
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

    // ── Answers HTML ──────────────────────────────────────────────────────────
    let answersHtml = '';
    if (registration.answers) {
      try {
        const parsed = JSON.parse(registration.answers);
        const entries = Object.entries(parsed);
        if (entries.length > 0) {
          answersHtml = `
            <div style="border-top: 1px solid #e1e4e8; padding-top: 14px; margin-top: 14px;">
              <h4 style="margin: 0 0 10px 0; font-size: 10px; color: #586069; font-weight: 600; font-family: -apple-system, BlinkMacSystemFont, sans-serif;">Registration info</h4>
              <table style="width: 100%; border-collapse: collapse; font-size: 12px; color: #24292e;">
                ${entries.map(([k, v]) => `
                  <tr>
                    <td style="padding: 3px 0; color: #586069; width: 40%; font-weight: 500;">${k}:</td>
                    <td style="padding: 3px 0; text-align: right; font-weight: 600; color: #24292e;">${typeof v === 'boolean' ? (v ? 'Yes' : 'No') : String(v)}</td>
                  </tr>
                `).join('')}
              </table>
            </div>`;
        }
      } catch (e) { console.error('Error parsing answers for email:', e); }
    }

    // ── Payment HTML ──────────────────────────────────────────────────────────
    let paymentHtml = '';
    if (registration.paymentTxnId) {
      paymentHtml = `
        <div style="border-top: 1px solid #e1e4e8; padding-top: 14px; margin-top: 14px;">
          <h4 style="margin: 0 0 10px 0; font-size: 10px; color: #586069; font-weight: 600; font-family: -apple-system, BlinkMacSystemFont, sans-serif;">Payment details</h4>
          <table style="width: 100%; border-collapse: collapse; font-size: 12px; color: #24292e;">
            <tr><td style="padding: 3px 0; color: #586069; width: 40%;">Method:</td><td style="padding: 3px 0; text-align: right; font-weight: 600;">${registration.paymentMethod}</td></tr>
            <tr><td style="padding: 3px 0; color: #586069;">Account name:</td><td style="padding: 3px 0; text-align: right; font-weight: 600;">${registration.paymentAccountName}</td></tr>
            <tr><td style="padding: 3px 0; color: #586069;">Transaction ID:</td><td style="padding: 3px 0; text-align: right; font-family: monospace; font-size: 11px;">${registration.paymentTxnId}</td></tr>
          </table>
        </div>`;
    }

    // ── Header Banner ─────────────────────────────────────────────────────────
    const attachments: { filename: string; content: Buffer; cid?: string }[] = [];
    let headerBannerHtml = '';

    if (event.coverImage) {
      let bannerSrc = event.coverImage;
      if (bannerSrc.startsWith('/')) {
        bannerSrc = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}${bannerSrc}`;
      }
      try {
        const coverRes = await fetch(bannerSrc);
        if (coverRes.ok) {
          const buf = await coverRes.arrayBuffer();
          attachments.push({ filename: 'coverimage.jpg', content: Buffer.from(buf), cid: 'event-cover' });
          headerBannerHtml = `<div style="width:100%;text-align:center;background-color:#f6f8fa;border-bottom:1px solid #e1e4e8;"><img src="cid:event-cover" alt="${event.title}" width="500" style="width:100%;max-width:500px;height:auto;display:block;margin:0 auto;border:0;" /></div>`;
        } else {
          headerBannerHtml = `<div style="width:100%;text-align:center;background-color:#f6f8fa;border-bottom:1px solid #e1e4e8;"><img src="${bannerSrc}" alt="${event.title}" width="500" style="width:100%;max-width:500px;height:auto;display:block;margin:0 auto;border:0;" /></div>`;
        }
      } catch {
        headerBannerHtml = `<div style="width:100%;text-align:center;background-color:#f6f8fa;border-bottom:1px solid #e1e4e8;"><img src="${bannerSrc}" alt="${event.title}" width="500" style="width:100%;max-width:500px;height:auto;display:block;margin:0 auto;border:0;" /></div>`;
      }
    } else {
      headerBannerHtml = `<div style="width:100%;height:100px;background-color:#f6f8fa;border-bottom:1px solid #e1e4e8;text-align:center;"><div style="padding-top:38px;text-align:center;"><span style="font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:13px;font-weight:600;color:#586069;letter-spacing:1px;">${event.organizer || 'Student Forge Events'}</span></div></div>`;
    }

    // ── QR Code attachment (inline in mail body) ───────────────────────────────
    if (!isPending) {
      try {
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(registration.ticketCode)}`;
        const qrRes = await fetch(qrUrl);
        if (qrRes.ok) {
          attachments.push({ filename: 'qrcode.png', content: Buffer.from(await qrRes.arrayBuffer()), cid: 'ticket-qrcode' });
        }
      } catch (e) { console.error('Failed to pre-fetch QR code buffer:', e); }
    }

    // ── Ticket PDF attachment ─────────────────────────────────────────────────
    let ticketPdfAttachment: { filename: string; content: Buffer } | null = null;
    if (!isPending) {
      const pdfBuffer = await generateTicketPdfBuffer(event, registration);
      if (pdfBuffer) {
        ticketPdfAttachment = { filename: `ticket-${registration.ticketCode}.pdf`, content: pdfBuffer };
        attachments.push(ticketPdfAttachment);
      }
    }

    // ── Event card block at the bottom of confirmed emails ─────────────────────
    const eventCardHtml = !isPending && event.coverImage ? `
      <tr>
        <td style="padding: 0 24px 24px 24px;">
          <div style="border: 1px solid #e1e4e8; border-radius: 8px; overflow: hidden; background-color: #ffffff;">
            <img src="cid:event-cover" alt="${event.title}" width="452" style="width:100%;max-width:452px;height:auto;display:block;border:0;" />
            <div style="padding: 12px 16px;">
              <p style="margin: 0 0 4px 0; font-size: 13px; font-weight: 700; color: #24292e; font-family: -apple-system, BlinkMacSystemFont, sans-serif;">${event.title}</p>
              <p style="margin: 0; font-size: 11px; color: #586069; font-family: -apple-system, BlinkMacSystemFont, sans-serif;">
                📅 ${event.startDate} at ${event.startTime}
                ${event.location ? ` &nbsp;·&nbsp; 📍 ${event.location}` : ''}
                &nbsp;·&nbsp; 🎟 ${event.price}
              </p>
            </div>
          </div>
        </td>
      </tr>
    ` : '';

    // ── Main HTML ─────────────────────────────────────────────────────────────
    const mailHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background-color:#fafbfc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;color:#24292e;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#fafbfc;width:100%;min-height:100%;padding:30px 10px;">
    <tr>
      <td align="center" valign="top">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:500px;background-color:#ffffff;border:1px solid #e1e4e8;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(27,31,35,0.04);">

          <!-- Event Header Banner -->
          <tr><td align="center" valign="top" style="overflow:hidden;">${headerBannerHtml}</td></tr>

          <!-- Email Content Body -->
          <tr>
            <td style="padding: 32px 24px 24px 24px;">

              <!-- Status heading -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="text-align:center;margin-bottom:24px;">
                <tr>
                  <td>
                    <h2 style="margin:0;color:#24292e;font-size:20px;font-weight:600;letter-spacing:-0.5px;font-family:-apple-system,BlinkMacSystemFont,sans-serif;">
                      ${isPending ? 'Registration pending approval' : 'Registration confirmed'}
                    </h2>
                    <p style="margin:8px 0 0 0;color:#586069;font-size:13px;line-height:1.5;font-family:-apple-system,BlinkMacSystemFont,sans-serif;">
                      ${isPending
                        ? 'Your registration request was sent to the organizer. We will notify you once your ticket is approved.'
                        : 'Your registration was successfully processed! Your ticket PDF is attached to this email.'}
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Ticket & Event info box -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f6f8fa;border:1px solid #e1e4e8;border-radius:6px;padding:16px;margin-bottom:24px;box-sizing:border-box;">

                <!-- Event Details -->
                <tr>
                  <td style="border-bottom:1px solid #e1e4e8;padding-bottom:12px;">
                    <span style="font-size:10px;color:#586069;font-weight:600;display:block;margin-bottom:4px;font-family:-apple-system,BlinkMacSystemFont,sans-serif;">Event details</span>
                    <h3 style="margin:0 0 8px 0;color:#24292e;font-size:15px;font-weight:600;line-height:1.3;font-family:-apple-system,BlinkMacSystemFont,sans-serif;">${event.title}</h3>
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="font-size:12px;color:#586069;font-family:-apple-system,BlinkMacSystemFont,sans-serif;">
                      <tr><td style="padding:3px 0;font-weight:500;">Date &amp; Time:</td><td style="padding:3px 0;text-align:right;color:#24292e;font-weight:600;">${event.startDate} at ${event.startTime}</td></tr>
                      <tr><td style="padding:3px 0;font-weight:500;">Venue / Location:</td><td style="padding:3px 0;text-align:right;color:#24292e;font-weight:600;">${event.location || 'Online'}</td></tr>
                      <tr><td style="padding:3px 0;font-weight:500;">Admission:</td><td style="padding:3px 0;text-align:right;color:#24292e;font-weight:600;">${event.price}</td></tr>
                    </table>
                  </td>
                </tr>

                <!-- Spacer -->
                <tr><td height="12"></td></tr>

                <!-- Attendee Info -->
                <tr>
                  <td style="border-bottom:1px solid #e1e4e8;padding-bottom:12px;">
                    <span style="font-size:10px;color:#586069;font-weight:600;display:block;margin-bottom:4px;font-family:-apple-system,BlinkMacSystemFont,sans-serif;">Attendee details</span>
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="font-size:12px;color:#586069;font-family:-apple-system,BlinkMacSystemFont,sans-serif;">
                      <tr><td style="padding:3px 0;width:40%;">Full name:</td><td style="padding:3px 0;text-align:right;font-weight:600;color:#24292e;">${registration.name}</td></tr>
                      <tr><td style="padding:3px 0;">Email address:</td><td style="padding:3px 0;text-align:right;font-weight:500;font-family:monospace;color:#24292e;">${registration.email}</td></tr>
                      <tr><td style="padding:3px 0;">Ticket status:</td><td style="padding:3px 0;text-align:right;font-weight:bold;font-family:monospace;color:#24292e;">
                        ${isPending
                          ? '<span style="color:#d97706;font-size:11px;">Pending Approval</span>'
                          : `<span style="color:#059669;font-size:11px;">Confirmed (${registration.ticketCode})</span>`}
                      </td></tr>
                    </table>
                  </td>
                </tr>

                <!-- Custom Answers + Payment -->
                <tr><td>${answersHtml}${paymentHtml}</td></tr>

                <!-- Inline QR Code (confirmed only) -->
                ${!isPending ? `
                <tr>
                  <td align="center" style="text-align:center;margin-top:16px;padding-top:16px;border-top:1px solid #e1e4e8;">
                    <span style="margin:0 0 10px 0;font-size:10px;color:#586069;font-weight:600;display:block;font-family:-apple-system,BlinkMacSystemFont,sans-serif;">Entry pass QR code</span>
                    <div style="display:inline-block;background-color:#ffffff;padding:10px;border-radius:8px;border:1px solid #e1e4e8;text-align:center;margin-bottom:8px;">
                      <img src="cid:ticket-qrcode" alt="Ticket QR Code" width="130" height="130" style="width:130px;height:130px;display:block;margin:0 auto;border:0;" />
                    </div>
                    <div style="font-family:monospace;font-size:13px;color:#24292e;font-weight:bold;letter-spacing:1px;margin-top:4px;">${registration.ticketCode}</div>
                    <p style="margin:6px 0 0 0;font-size:11px;color:#586069;font-family:-apple-system,BlinkMacSystemFont,sans-serif;line-height:1.4;max-width:280px;text-align:center;">
                      Please present this QR pass to the organizer at the venue entrance for scanning.
                    </p>
                    ${ticketPdfAttachment ? `<p style="margin:8px 0 0 0;font-size:11px;color:#586069;font-family:-apple-system,BlinkMacSystemFont,sans-serif;">Your full ticket PDF is attached to this email.</p>` : ''}
                  </td>
                </tr>` : ''}

              </table>

              <!-- CTA Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="text-align:center;margin-bottom:12px;">
                <tr>
                  <td>
                    <a href="${passUrl}" style="display:inline-block;background-color:#24292e;color:#ffffff;font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-weight:600;font-size:13px;text-decoration:none;padding:10px 20px;border-radius:6px;border:1px solid #1b1f23;text-align:center;">
                      ${isPending ? 'Check ticket status' : 'View ticket pass'}
                    </a>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Event Card (confirmed emails only) -->
          ${eventCardHtml}

          <!-- Footer -->
          ${FOOTER_HTML}

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    // ── Send via Resend ────────────────────────────────────────────────────────
    await resend.emails.send({
      from: `Student Forge <${resendFromEmail}>`,
      to,
      subject,
      text: isPending
        ? `Pending Approval: Your registration for ${event.title} is awaiting organizer approval.`
        : `Confirmed: Your registration for ${event.title} is confirmed! Ticket Code: ${registration.ticketCode}. Your ticket PDF is attached.`,
      html: mailHtml,
      attachments: attachments.map(att => ({
        filename: att.filename,
        content: att.content,
        ...(att.cid ? { cid: att.cid } : {}),
      })),
    });
    console.log(`Email sent successfully to ${to} (${type})`);
  } catch (error) {
    console.error('Resend sendEventMail error:', error);
  }
}
