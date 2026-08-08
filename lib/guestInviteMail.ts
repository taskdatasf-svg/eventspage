import { Resend } from 'resend';
import puppeteer from 'puppeteer';
import QRCode from 'qrcode';

const LOGO_URL = 'https://ik.imagekit.io/dypkhqxip/events%20loho';

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

import { jsPDF } from 'jspdf';

// Generate VIP / Speaker Ticket PDF Buffer (100% reliable jsPDF + Puppeteer Fallback)
async function generateVipTicketPdfBuffer(event: any, registration: any, guestRole: string): Promise<Buffer | null> {
  // 1. Primary: Ultra-Clean High-Definition VIP Pass via jsPDF
  try {
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: [150, 80]
    });

    // Crisp white background
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, 150, 80, 'F');

    // Subtle outer border (thin crisp gray #d4d4d8)
    doc.setDrawColor(212, 212, 216);
    doc.setLineWidth(0.4);
    doc.roundedRect(3, 3, 144, 74, 3, 3, 'S');

    // Top Header: STUDENT FORGE
    doc.setTextColor(24, 24, 27);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('STUDENT FORGE', 8, 10.5);

    // Right stub ticket code (courier monospace)
    doc.setTextColor(113, 113, 122);
    doc.setFont('courier', 'bold');
    doc.setFontSize(8);
    doc.text(registration.ticketCode || 'VIP-PASS', 142, 10.5, { align: 'right' });

    // Top hairline divider
    doc.setDrawColor(228, 228, 231);
    doc.setLineWidth(0.3);
    doc.line(8, 13.5, 142, 13.5);

    // Event Title (bold dark font)
    doc.setTextColor(24, 24, 27);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11.5);
    const titleText = (event.title || 'VIP Event Pass').substring(0, 40);
    doc.text(titleText, 8, 20.5);

    // Guest Role Subtitle
    doc.setTextColor(113, 113, 122);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.text(`Role: ${(guestRole || 'VIP Guest').substring(0, 38)}`, 8, 25);

    // Thin separator line
    doc.setDrawColor(244, 244, 245);
    doc.setLineWidth(0.3);
    doc.line(8, 27.5, 100, 27.5);

    // Honored Guest Name
    doc.setTextColor(113, 113, 122);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.text('HONORED GUEST NAME', 8, 32.5);
    doc.setTextColor(24, 24, 27);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text((registration.name || 'VIP Guest').substring(0, 34), 8, 37.5);

    // Email Address
    doc.setTextColor(113, 113, 122);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.text('EMAIL ADDRESS', 8, 43.5);
    doc.setTextColor(63, 63, 70);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.text((registration.email || '').substring(0, 38), 8, 48.5);

    // Date & Time Column
    doc.setTextColor(113, 113, 122);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.text('DATE & TIME', 8, 54.5);
    doc.setTextColor(24, 24, 27);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.text(`${event.startDate || 'TBA'} ${event.startTime || ''}`.substring(0, 26), 8, 59.5);

    // Venue / Location Column
    doc.setTextColor(113, 113, 122);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.text('LOCATION / VENUE', 58, 54.5);
    doc.setTextColor(24, 24, 27);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.text((event.location || 'Online').substring(0, 24), 58, 59.5);

    // Bottom Pass Badge (Clean minimalist pill)
    doc.setFillColor(244, 244, 245);
    doc.roundedRect(8, 64.5, 88, 6.5, 1.5, 1.5, 'F');
    doc.setTextColor(82, 82, 91);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.text('COMPLIMENTARY VIP GUEST PASS', 52, 68.7, { align: 'center' });

    // Stub Vertical Divider
    doc.setDrawColor(212, 212, 216);
    doc.setLineWidth(0.3);
    doc.line(104, 13.5, 104, 74);

    // Right Stub: Clean High-Res QR Code
    const qrDataUrl = await QRCode.toDataURL(registration.ticketCode || 'VIP-PASS', {
      width: 160,
      margin: 0,
      color: { dark: '#18181b', light: '#ffffff' }
    });

    doc.addImage(qrDataUrl, 'PNG', 109, 21, 30, 30);

    doc.setTextColor(113, 113, 122);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6);
    doc.text('SCAN FOR ENTRY', 124, 56, { align: 'center' });

    doc.setTextColor(24, 24, 27);
    doc.setFont('courier', 'bold');
    doc.setFontSize(7);
    doc.text(registration.ticketCode || 'VIP-PASS', 124, 61, { align: 'center' });

    const arrayBuffer = doc.output('arraybuffer');
    return Buffer.from(arrayBuffer);
  } catch (jsPdfErr) {
    console.warn('jsPDF VIP ticket generation failed, falling back to Puppeteer:', jsPdfErr);
  }

  // 2. Secondary Fallback: Puppeteer HTML-to-PDF
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
    .left-section { flex: 1; padding: 28px 32px; display: flex; flex-direction: column; justify-content: space-between; position: relative; border-right: 2px dashed #2a2c36; }
    .right-stub { width: 240px; background: #111216; padding: 28px 24px; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; }
    .logo-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
    .brand-logo { height: 32px; width: auto; filter: brightness(0) invert(1); }
    .vip-tag { font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; background: #27272a; color: #f4f4f5; padding: 4px 12px; border-radius: 9999px; border: 1px solid #3f3f46; }
    .event-title { font-size: 22px; font-weight: 800; color: #ffffff; margin-bottom: 8px; line-height: 1.2; }
    .role-badge { display: inline-block; font-size: 12px; font-weight: 700; color: #e4e4e7; background: #27272a; border: 1px solid #3f3f46; padding: 4px 12px; border-radius: 6px; margin-bottom: 16px; }
    .meta-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; border-top: 1px solid #262833; padding-top: 16px; }
    .meta-label { font-size: 9px; text-transform: uppercase; color: #a1a1aa; font-weight: 700; letter-spacing: 1px; margin-bottom: 3px; }
    .meta-value { font-size: 13px; font-weight: 700; color: #ffffff; }
    .attendee-box { display: flex; align-items: center; gap: 12px; border-top: 1px solid #262833; padding-top: 16px; margin-top: 12px; }
    .avatar { width: 36px; height: 36px; border-radius: 9999px; background: #ffffff; color: #000; font-weight: 900; font-size: 14px; display: flex; align-items: center; justify-content: center; }
    .attendee-name { font-size: 14px; font-weight: 800; color: #ffffff; }
    .attendee-email { font-size: 11px; color: #a1a1aa; font-family: monospace; }
    .qr-box { background: #ffffff; padding: 8px; border-radius: 12px; margin-bottom: 12px; }
    .stub-title { font-size: 11px; font-weight: 800; text-transform: uppercase; color: #ffffff; letter-spacing: 1px; }
    .stub-code { font-size: 11px; font-family: monospace; font-weight: 700; color: #a1a1aa; margin-top: 4px; }
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
        <div><div class="meta-label">Ticket Type</div><div class="meta-value">FREE VIP PASS</div></div>
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

    // Generate PDF Pass (The ONLY attachment!)
    const pdfBuffer = await generateVipTicketPdfBuffer(event, registration, guestRole);
    const attachments = pdfBuffer
      ? [
          {
            filename: `VIP_Pass_${registration.ticketCode}.pdf`,
            content: pdfBuffer,
          },
        ]
      : [];

    const subject = `Official Guest & Speaker Invitation: ${event.title}`;

    // Header Event Banner HTML (ONLY Event Banner in Header!)
    let headerBannerHtml = '';
    if (event.coverImage && (event.coverImage.startsWith('http://') || event.coverImage.startsWith('https://'))) {
      headerBannerHtml = `<div style="width:100%;text-align:center;background-color:#14151c;border-bottom:1px solid #272832;">
        <img src="${event.coverImage}" alt="${event.title}" width="580" style="width:100%;max-width:580px;height:auto;display:block;margin:0 auto;border:0;" />
      </div>`;
    } else {
      headerBannerHtml = `<div style="width:100%;padding:28px 24px;background-color:#181922;border-bottom:1px solid #272832;text-align:center;">
        <h2 style="margin:0;font-size:20px;font-weight:800;color:#ffffff;">${event.title}</h2>
      </div>`;
    }

    const htmlBody = `<!DOCTYPE html>
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
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#0b0c10;color:#e4e4e7;-webkit-font-smoothing:antialiased;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#0b0c10;width:100%;padding:30px 10px;">
    <tr>
      <td align="center">
        <table role="presentation" class="container-table" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:580px;background-color:#14151c;border:1px solid #272832;border-radius:16px;overflow:hidden;box-shadow:0 12px 40px rgba(0,0,0,0.6);">
          
          <!-- Top Header: ONLY Event Banner (NO Logo or Tag in Header!) -->
          <tr>
            <td style="padding:0;">
              ${headerBannerHtml}
            </td>
          </tr>

          <!-- Main Content Body -->
          <tr>
            <td class="content-padding" style="padding:32px 28px;">
              <h1 style="margin:0 0 12px 0;font-size:22px;font-weight:800;color:#ffffff;line-height:1.3;letter-spacing:-0.3px;">
                Invitation to ${event.title}
              </h1>

              <p style="margin:0 0 20px 0;font-size:14px;line-height:1.6;color:#a1a1aa;">
                Dear <strong style="color:#ffffff;">${guestName}</strong>,<br/><br/>
                You are cordially invited as an honored <strong style="color:#ffffff;">${guestRole}</strong> for <strong style="color:#ffffff;">${event.title}</strong> organized by ${event.organizer || 'StudentForge'}.
              </p>

              ${
                personalMessage
                  ? `
              <!-- Host Personal Note Box -->
              <div style="background-color:#1c1d27;border-left:3px solid #71717a;border-radius:8px;padding:14px 18px;margin-bottom:24px;">
                <span style="display:block;font-size:10px;font-weight:700;color:#a1a1aa;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">Message from Host</span>
                <p style="margin:0;font-size:13px;color:#e4e4e7;font-style:italic;line-height:1.5;">"${personalMessage}"</p>
              </div>`
                  : ''
              }

              <!-- Event Details Table -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#1a1b24;border:1px solid #272832;border-radius:12px;padding:20px;margin-bottom:24px;box-sizing:border-box;">
                <tr>
                  <td>
                    <span style="font-size:10px;color:#71717a;font-weight:700;text-transform:uppercase;letter-spacing:1px;display:block;margin-bottom:10px;">Event Overview</span>
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="font-size:13px;color:#e4e4e7;">
                      <tr><td style="padding:5px 0;color:#a1a1aa;width:38%;">Invited Role:</td><td style="padding:5px 0;text-align:right;font-weight:700;color:#ffffff;">${guestRole}</td></tr>
                      <tr><td style="padding:5px 0;color:#a1a1aa;">Date &amp; Time:</td><td style="padding:5px 0;text-align:right;font-weight:600;color:#ffffff;">${event.startDate} at ${event.startTime}</td></tr>
                      <tr><td style="padding:5px 0;color:#a1a1aa;">Venue / Location:</td><td style="padding:5px 0;text-align:right;font-weight:600;color:#ffffff;">${event.location || 'Online'}</td></tr>
                      <tr><td style="padding:5px 0;color:#a1a1aa;">Ticket Pass:</td><td style="padding:5px 0;text-align:right;font-weight:800;color:#ffffff;">FREE VIP PASS (${registration.ticketCode})</td></tr>
                    </table>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 16px 0;font-size:13px;color:#a1a1aa;text-align:center;">
                Your official VIP ticket pass is attached to this email as a PDF document.
              </p>

              <p style="margin:0;font-size:12px;color:#71717a;text-align:center;">
                If you have any questions, reply directly to this email or contact ${event.organizer || 'StudentForge'}.
              </p>
            </td>
          </tr>

          <!-- Bottom Footer (StudentForge Logo at Bottom) -->
          <tr>
            <td style="padding:24px 24px;background-color:#0f1015;border-top:1px solid #272832;text-align:center;font-size:11px;color:#71717a;">
              <div style="margin-bottom:12px;">
                <img src="${LOGO_URL}" alt="StudentForge" height="36" style="height:36px;width:auto;display:inline-block;border:0;" />
              </div>
              © ${new Date().getFullYear()} StudentForge Events. Official Speaker &amp; Guest Portal.
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
      attachments, // Contains ONLY the 1 PDF attachment file!
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
