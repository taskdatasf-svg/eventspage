import { Resend } from 'resend';
import puppeteer from 'puppeteer';
import QRCode from 'qrcode';
import fs from 'fs';
import path from 'path';

const LOGO_URL = 'https://ik.imagekit.io/dypkhqxip/eventssflo';

interface GuestInviteMailParams {
  to: string;
  guestName: string;
  guestRole: string;
  personalMessage?: string | null;
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
  };
  originUrl: string;
}

// Helper to load logo buffer
async function getLogoBuffer(): Promise<{ buffer: Buffer; contentType: string } | null> {
  try {
    const res = await fetch(LOGO_URL);
    if (res.ok) {
      const arrayBuf = await res.arrayBuffer();
      return { buffer: Buffer.from(arrayBuf), contentType: 'image/png' };
    }
  } catch (err) {
    console.error('Error fetching logo buffer:', err);
  }
  return null;
}

// Generate VIP / Speaker Ticket PDF Buffer
async function generateVipTicketPdfBuffer(event: any, registration: any, guestRole: string): Promise<Buffer | null> {
  try {
    const ticketCode = registration.ticketCode;
    const name = registration.name;
    const email = registration.email;
    const qrDataUrl = await QRCode.toDataURL(ticketCode, { width: 300, margin: 1 });

    const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0c0d10; color: #ffffff; width: 840px; height: 440px; padding: 24px; display: flex; align-items: center; justify-content: center; }
    .ticket-card { width: 792px; height: 392px; background: #15161b; border: 2px solid #2a2c36; border-radius: 20px; display: flex; overflow: hidden; position: relative; box-shadow: 0 20px 40px rgba(0,0,0,0.8); }
    .left-section { flex: 1; padding: 28px 32px; display: flex; flex-col; justify-content: space-between; position: relative; border-right: 2px dashed #2a2c36; }
    .right-stub { width: 240px; background: #111216; padding: 28px 24px; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; }
    .logo-row { display: flex; items-center; justify-content: space-between; margin-bottom: 16px; }
    .brand-logo { height: 28px; width: auto; filter: brightness(0) invert(1); }
    .vip-tag { font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; background: #fbbf24; color: #000000; padding: 4px 10px; border-radius: 9999px; }
    .event-title { font-size: 22px; font-weight: 800; color: #ffffff; margin-bottom: 8px; line-height: 1.2; }
    .role-badge { display: inline-block; font-size: 12px; font-weight: 700; color: #38bdf8; background: rgba(56,189,248,0.12); border: 1px solid rgba(56,189,248,0.3); padding: 3px 10px; border-radius: 6px; margin-bottom: 16px; }
    .meta-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; border-top: 1px solid #262833; padding-top: 16px; }
    .meta-label { font-size: 9px; text-transform: uppercase; color: #94a3b8; font-weight: 700; letter-spacing: 1px; margin-bottom: 3px; }
    .meta-value { font-size: 13px; font-weight: 700; color: #f1f5f9; }
    .attendee-box { display: flex; items-center; gap: 12px; border-top: 1px solid #262833; padding-top: 16px; margin-top: 12px; }
    .avatar { width: 36px; height: 36px; border-radius: 9999px; background: #fbbf24; color: #000; font-weight: 900; font-size: 14px; display: flex; align-items: center; justify-content: center; }
    .attendee-name { font-size: 14px; font-weight: 800; color: #ffffff; }
    .attendee-email { font-size: 11px; color: #94a3b8; font-family: monospace; }
    .qr-box { background: #ffffff; padding: 10px; border-radius: 14px; margin-bottom: 12px; border: 1px solid #e2e8f0; }
    .stub-title { font-size: 12px; font-weight: 800; text-transform: uppercase; color: #fbbf24; letter-spacing: 1px; }
    .stub-code { font-size: 11px; font-family: monospace; font-weight: 700; color: #94a3b8; margin-top: 4px; }
  </style>
</head>
<body>
  <div class="ticket-card">
    <div class="left-section">
      <div>
        <div class="logo-row">
          <img src="${LOGO_URL}" class="brand-logo" alt="StudentForge" />
          <span class="vip-tag">VIP SPEAKER PASS</span>
        </div>
        <h1 class="event-title">${event.title}</h1>
        <div class="role-badge">Honored Role: ${guestRole}</div>
      </div>
      <div class="meta-grid">
        <div><div class="meta-label">Date & Time</div><div class="meta-value">${event.startDate} at ${event.startTime}</div></div>
        <div><div class="meta-label">Location</div><div class="meta-value">${event.location || 'Online'}</div></div>
        <div><div class="meta-label">Ticket Type</div><div class="meta-value" style="color:#34d399">FREE VIP PASS</div></div>
      </div>
      <div class="attendee-box">
        <div class="avatar">${name?.substring(0, 2).toUpperCase() || 'VIP'}</div>
        <div>
          <div class="attendee-name">${name}</div>
          <div class="attendee-email">${email}</div>
        </div>
      </div>
    </div>
    <div class="right-stub">
      <div class="qr-box">
        <img src="${qrDataUrl}" width="120" height="120" alt="QR Code" />
      </div>
      <div class="stub-title">VIP ENTRY PASS</div>
      <div class="stub-code">${ticketCode}</div>
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
    console.error('Failed to generate VIP ticket PDF:', err);
    return null;
  }
}

export async function sendGuestInviteMail({
  to,
  guestName,
  guestRole,
  personalMessage,
  event,
  registration,
  originUrl,
}: GuestInviteMailParams) {
  try {
    const resendApiKey = process.env.RESEND_API_KEY || 're_xxxxxxxxx';
    const resendFromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
    const resend = new Resend(resendApiKey);

    const attachments: { filename: string; content: Buffer; cid?: string }[] = [];

    // 1. Logo Buffer
    const logoData = await getLogoBuffer();
    let logoImgHtml = `<img src="${LOGO_URL}" alt="Student Forge" height="24" style="height:24px;width:auto;display:inline-block;vertical-align:middle;border:0;" />`;
    if (logoData) {
      attachments.push({ filename: 'logo.png', content: logoData.buffer, cid: 'sf-logo' });
      logoImgHtml = `<img src="cid:sf-logo" alt="Student Forge" height="24" style="height:24px;width:auto;display:inline-block;vertical-align:middle;border:0;" />`;
    }

    // 2. Generate QR Code
    try {
      const qrBuffer = await QRCode.toBuffer(registration.ticketCode, { width: 300, margin: 1 });
      attachments.push({ filename: 'qrcode.png', content: qrBuffer, cid: 'ticket-qrcode' });
    } catch (e) {
      console.error('QR code generation error:', e);
    }

    // 3. Generate PDF Pass
    const pdfBuffer = await generateVipTicketPdfBuffer(event, registration, guestRole);
    if (pdfBuffer) {
      attachments.push({
        filename: `VIP_Pass_${registration.ticketCode}.pdf`,
        content: pdfBuffer,
      });
    }

    const regUrl = `${originUrl}/events/${event.id}/register?guestInvite=true&ticketCode=${registration.ticketCode}&role=${encodeURIComponent(guestRole)}`;

    const subject = `Official Guest & Speaker Invitation: ${event.title}`;

    const htmlBody = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background-color:#0f1015;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#e2e8f0;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#0f1015;width:100%;padding:40px 10px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:540px;background-color:#161720;border:1px solid #272936;border-radius:16px;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,0.5);">
          
          <!-- Header Banner -->
          <tr>
            <td style="padding:28px 24px 20px 24px;background-color:#1a1c27;border-bottom:1px solid #272936;text-align:center;">
              ${logoImgHtml}
              <div style="margin-top:14px;display:inline-block;padding:4px 14px;border-radius:9999px;background-color:rgba(251,191,36,0.15);border:1px solid rgba(251,191,36,0.3);color:#fbbf24;font-size:11px;font-weight:800;letter-spacing:1px;text-transform:uppercase;">
                VIP SPEAKER & GUEST INVITATION
              </div>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding:32px 28px;">
              <h2 style="margin:0 0 12px 0;font-size:22px;font-weight:800;color:#ffffff;line-height:1.3;">
                Official Invitation to ${event.title}
              </h2>

              <p style="margin:0 0 20px 0;font-size:14px;line-height:1.6;color:#cbd5e1;">
                Dear <strong>${guestName}</strong>,<br/><br/>
                We are delighted to invite you as an honored <strong>${guestRole}</strong> for <strong>${event.title}</strong> organized by ${event.organizer || 'StudentForge'}.
              </p>

              ${
                personalMessage
                  ? `
              <!-- Host Personal Note Box -->
              <div style="background-color:rgba(251,191,36,0.06);border-left:3px solid #fbbf24;border-radius:8px;padding:14px 18px;margin-bottom:24px;">
                <span style="display:block;font-size:11px;font-weight:700;color:#fbbf24;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">Message from the Host</span>
                <p style="margin:0;font-size:13px;color:#f1f5f9;font-style:italic;line-height:1.5;">"${personalMessage}"</p>
              </div>`
                  : ''
              }

              <!-- VIP Event Info Box -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#1e202d;border:1px solid #2a2d3d;border-radius:12px;padding:20px;margin-bottom:24px;box-sizing:border-box;">
                <tr>
                  <td>
                    <span style="font-size:11px;color:#94a3b8;font-weight:700;text-transform:uppercase;letter-spacing:1px;display:block;margin-bottom:8px;">Event Details</span>
                    <h3 style="margin:0 0 12px 0;font-size:16px;font-weight:700;color:#ffffff;">${event.title}</h3>
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="font-size:13px;color:#cbd5e1;">
                      <tr><td style="padding:4px 0;color:#94a3b8;width:38%;">Invited Role:</td><td style="padding:4px 0;text-align:right;font-weight:700;color:#38bdf8;">${guestRole}</td></tr>
                      <tr><td style="padding:4px 0;color:#94a3b8;">Date &amp; Time:</td><td style="padding:4px 0;text-align:right;font-weight:600;color:#ffffff;">${event.startDate} at ${event.startTime}</td></tr>
                      <tr><td style="padding:4px 0;color:#94a3b8;">Venue / Location:</td><td style="padding:4px 0;text-align:right;font-weight:600;color:#ffffff;">${event.location || 'Online'}</td></tr>
                      <tr><td style="padding:4px 0;color:#94a3b8;">Ticket Entry:</td><td style="padding:4px 0;text-align:right;font-weight:800;color:#34d399;">FREE VIP PASS</td></tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- QR Code & Ticket Pass Box -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#1e202d;border:1px dashed #38bdf8;border-radius:12px;padding:20px;text-align:center;margin-bottom:24px;">
                <tr>
                  <td align="center">
                    <span style="font-size:10px;font-weight:800;color:#fbbf24;text-transform:uppercase;letter-spacing:1.5px;display:block;margin-bottom:12px;">YOUR VIP ENTRY TICKET PASS</span>
                    <img src="cid:ticket-qrcode" width="130" height="130" alt="VIP Pass QR Code" style="display:block;margin:0 auto 10px auto;border-radius:8px;background:#ffffff;padding:8px;" />
                    <div style="font-family:monospace;font-size:14px;font-weight:800;color:#ffffff;letter-spacing:1px;">${registration.ticketCode}</div>
                    <span style="font-size:11px;color:#94a3b8;display:block;margin-top:4px;">Attached as PDF: VIP_Pass_${registration.ticketCode}.pdf</span>
                  </td>
                </tr>
              </table>

              <!-- Action CTA Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="text-align:center;margin-bottom:24px;">
                <tr>
                  <td align="center">
                    <a href="${regUrl}" target="_blank" style="display:inline-block;padding:14px 28px;background-color:#fbbf24;color:#000000;font-size:14px;font-weight:800;text-decoration:none;border-radius:10px;box-shadow:0 4px 14px rgba(251,191,36,0.3);">
                      Open Registration &amp; View Ticket Pass
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0;font-size:12px;color:#64748b;text-align:center;">
                If you have any questions, reply directly to this email or contact ${event.organizer || 'StudentForge'}.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:16px 24px;background-color:#111218;border-top:1px solid #272936;text-align:center;font-size:11px;color:#64748b;">
              © ${new Date().getFullYear()} StudentForge Events. Official Speaker &amp; Guest Management Portal.
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    const { data, error } = await resend.emails.send({
      from: `StudentForge Events <${resendFromEmail}>`,
      to: [to],
      subject,
      html: htmlBody,
      attachments: attachments.map((att) => ({
        filename: att.filename,
        content: att.content,
        cid: att.cid,
      })),
    });

    if (error) {
      console.error('Failed to send guest invite email:', error);
      return { success: false, error: error.message };
    }

    return { success: true, messageId: data?.id };
  } catch (err: any) {
    console.error('sendGuestInviteMail error:', err);
    return { success: false, error: err.message };
  }
}
