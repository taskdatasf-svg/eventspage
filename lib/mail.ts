import { Resend } from 'resend';

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

const getHexColor = (bgClass: string) => {
  if (bgClass.includes('[#818cf8]')) return '#4f46e5'; // Indigo
  if (bgClass.includes('[#fef08a]')) return '#b45309'; // Amber/Yellow
  if (bgClass.includes('[#6ee7b7]')) return '#059669'; // Emerald
  if (bgClass.includes('[#fbcfe8]')) return '#db2777'; // Pink
  if (bgClass.includes('[#fed7aa]')) return '#ea580c'; // Orange
  return '#4f46e5'; // Indigo default
};

export async function sendEventMail({ to, subject, event, registration, type, originUrl }: SendMailParams) {
  try {
    const resendApiKey = process.env.RESEND_API_KEY || 're_xxxxxxxxx';
    const resendFromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
    const resend = new Resend(resendApiKey);

    const passUrl = `${originUrl}/events/${event.id}/register`;

    // Process RSVP answers
    let answersHtml = '';
    if (registration.answers) {
      try {
        const parsed = JSON.parse(registration.answers);
        const entries = Object.entries(parsed);
        if (entries.length > 0) {
          answersHtml = `
            <div style="border-top: 1px solid #e1e4e8; padding-top: 14px; margin-top: 14px;">
              <h4 style="margin: 0 0 10px 0; font-size: 10px; font-family: -apple-system, BlinkMacSystemFont, sans-serif; color: #586069; font-weight: 600;">Registration info</h4>
              <table style="width: 100%; border-collapse: collapse; font-size: 12px; color: #24292e;">
                ${entries.map(([k, v]) => `
                  <tr>
                    <td style="padding: 3px 0; color: #586069; width: 40%; font-weight: 500;">${k}:</td>
                    <td style="padding: 3px 0; text-align: right; font-weight: 600; color: #24292e;">${typeof v === 'boolean' ? (v ? 'Yes' : 'No') : String(v)}</td>
                  </tr>
                `).join('')}
              </table>
            </div>
          `;
        }
      } catch (err) {
        console.error('Error parsing answers for email:', err);
      }
    }

    // Process payment info
    let paymentHtml = '';
    if (registration.paymentTxnId) {
      paymentHtml = `
        <div style="border-top: 1px solid #e1e4e8; padding-top: 14px; margin-top: 14px;">
          <h4 style="margin: 0 0 10px 0; font-size: 10px; font-family: -apple-system, BlinkMacSystemFont, sans-serif; color: #586069; font-weight: 600;">Payment details</h4>
          <table style="width: 100%; border-collapse: collapse; font-size: 12px; color: #24292e;">
            <tr>
              <td style="padding: 3px 0; color: #586069; width: 40%;">Method:</td>
              <td style="padding: 3px 0; text-align: right; font-weight: 600; color: #24292e;">${registration.paymentMethod}</td>
            </tr>
            <tr>
              <td style="padding: 3px 0; color: #586069;">Account name:</td>
              <td style="padding: 3px 0; text-align: right; font-weight: 600; color: #24292e;">${registration.paymentAccountName}</td>
            </tr>
            <tr>
              <td style="padding: 3px 0; color: #586069;">Transaction ID:</td>
              <td style="padding: 3px 0; text-align: right; font-family: monospace; font-size: 11px; color: #24292e;">${registration.paymentTxnId}</td>
            </tr>
          </table>
        </div>
      `;
    }

    // Generate header banner and check attachments
    let headerBannerHtml = '';
    const attachments: any[] = [];

    // QR Code CID attachment
    if (type !== 'PENDING') {
      try {
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(registration.ticketCode)}`;
        const qrRes = await fetch(qrUrl);
        if (qrRes.ok) {
          const qrArrayBuffer = await qrRes.arrayBuffer();
          attachments.push({
            filename: 'qrcode.png',
            content: Buffer.from(qrArrayBuffer),
            cid: 'ticket-qrcode'
          });
        }
      } catch (err) {
        console.error('Failed to pre-fetch email QR code buffer:', err);
      }
    }

    if (event.coverImage) {
      let bannerSrc = event.coverImage;
      if (bannerSrc.startsWith('/')) {
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        bannerSrc = `${baseUrl}${bannerSrc}`;
      }
      
      // Attempt to attach the cover image as CID to bypass mail client blocking
      try {
        const coverRes = await fetch(bannerSrc);
        if (coverRes.ok) {
          const coverArrayBuffer = await coverRes.arrayBuffer();
          attachments.push({
            filename: 'coverimage.jpg',
            content: Buffer.from(coverArrayBuffer),
            cid: 'event-cover'
          });
          headerBannerHtml = `
            <div style="width: 100%; text-align: center; background-color: #f6f8fa; border-bottom: 1px solid #e1e4e8;">
              <img src="cid:event-cover" alt="${event.title}" width="500" style="width: 100%; max-width: 500px; height: auto; display: block; margin: 0 auto; border: 0; outline: none; text-decoration: none;" />
            </div>
          `;
        } else {
          headerBannerHtml = `
            <div style="width: 100%; text-align: center; background-color: #f6f8fa; border-bottom: 1px solid #e1e4e8;">
              <img src="${bannerSrc}" alt="${event.title}" width="500" style="width: 100%; max-width: 500px; height: auto; display: block; margin: 0 auto; border: 0; outline: none; text-decoration: none;" />
            </div>
          `;
        }
      } catch (err) {
        console.error('Failed to attach cover as CID, falling back to absolute URL:', err);
        headerBannerHtml = `
          <div style="width: 100%; text-align: center; background-color: #f6f8fa; border-bottom: 1px solid #e1e4e8;">
            <img src="${bannerSrc}" alt="${event.title}" width="500" style="width: 100%; max-width: 500px; height: auto; display: block; margin: 0 auto; border: 0; outline: none; text-decoration: none;" />
          </div>
        `;
      }
    } else {
      headerBannerHtml = `
        <div style="width: 100%; height: 100px; background-color: #f6f8fa; border-bottom: 1px solid #e1e4e8; text-align: center;">
          <div style="padding-top: 38px; text-align: center;">
            <span style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; font-size: 13px; font-weight: 600; color: #586069; letter-spacing: 1px;">
              ${event.organizer || 'Student Forge Events'}
            </span>
          </div>
        </div>
      `;
    }

    const isPending = type === 'PENDING';

    const mailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #fafbfc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; color: #24292e;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #fafbfc; width: 100%; min-height: 100%; padding: 30px 10px;">
          <tr>
            <td align="center" valign="top">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 500px; background-color: #ffffff; border: 1px solid #e1e4e8; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(27,31,35,0.04);">
                
                <!-- Event Header Banner -->
                <tr>
                  <td align="center" valign="top" style="overflow: hidden;">
                    ${headerBannerHtml}
                  </td>
                </tr>

                <!-- Email Content Body -->
                <tr>
                  <td style="padding: 32px 24px;">
                    
                    <!-- Icon and Status -->
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="text-align: center; margin-bottom: 24px;">
                      <tr>
                        <td>
                          <h2 style="margin: 0; color: #24292e; font-size: 20px; font-weight: 600; letter-spacing: -0.5px; font-family: -apple-system, BlinkMacSystemFont, sans-serif;">
                            ${isPending ? 'Registration pending approval' : 'Registration confirmed'}
                          </h2>
                          <p style="margin: 8px 0 0 0; color: #586069; font-size: 13px; line-height: 1.5; font-family: -apple-system, BlinkMacSystemFont, sans-serif;">
                            ${isPending 
                              ? 'Your registration request was sent to the organizer. We will notify you once your ticket is approved.' 
                              : 'Your registration was successfully processed! Below are your entry ticket details.'
                            }
                          </p>
                        </td>
                      </tr>
                    </table>

                    <!-- Ticket & Event Box -->
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f6f8fa; border: 1px solid #e1e4e8; border-radius: 6px; padding: 16px; margin-bottom: 24px; box-sizing: border-box;">
                      
                      <!-- Event Details Heading and info -->
                      <tr>
                        <td style="border-bottom: 1px solid #e1e4e8; padding-bottom: 12px; margin-bottom: 12px;">
                          <span style="font-size: 10px; font-family: -apple-system, BlinkMacSystemFont, sans-serif; color: #586069; font-weight: 600; display: block; margin-bottom: 4px;">Event details</span>
                          <h3 style="margin: 0 0 8px 0; color: #24292e; font-size: 15px; font-weight: 600; line-height: 1.3; font-family: -apple-system, BlinkMacSystemFont, sans-serif;">
                            ${event.title}
                          </h3>
                          
                          <!-- Info Grid -->
                          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="font-size: 12px; color: #586069; font-family: -apple-system, BlinkMacSystemFont, sans-serif;">
                            <tr>
                              <td style="padding: 3px 0; font-weight: 500;">Date &amp; Time:</td>
                              <td style="padding: 3px 0; text-align: right; color: #24292e; font-weight: 600;">${event.startDate} at ${event.startTime}</td>
                            </tr>
                            <tr>
                              <td style="padding: 3px 0; font-weight: 500;">Venue / Location:</td>
                              <td style="padding: 3px 0; text-align: right; color: #24292e; font-weight: 600;">${event.location || 'Online'}</td>
                            </tr>
                            <tr>
                              <td style="padding: 3px 0; font-weight: 500;">Admission:</td>
                              <td style="padding: 3px 0; text-align: right; color: #24292e; font-weight: 600;">${event.price}</td>
                            </tr>
                          </table>
                        </td>
                      </tr>

                      <!-- Spacer -->
                      <tr>
                        <td height="12"></td>
                      </tr>

                      <!-- Attendee Info -->
                      <tr>
                        <td style="border-bottom: 1px solid #e1e4e8; padding-bottom: 12px; margin-bottom: 12px;">
                          <span style="font-size: 10px; font-family: -apple-system, BlinkMacSystemFont, sans-serif; color: #586069; font-weight: 600; display: block; margin-bottom: 4px;">Attendee details</span>
                          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="font-size: 12px; color: #586069; font-family: -apple-system, BlinkMacSystemFont, sans-serif;">
                            <tr>
                              <td style="padding: 3px 0; width: 40%;">Full name:</td>
                              <td style="padding: 3px 0; text-align: right; font-weight: 600; color: #24292e;">${registration.name}</td>
                            </tr>
                            <tr>
                              <td style="padding: 3px 0;">Email address:</td>
                              <td style="padding: 3px 0; text-align: right; font-weight: 500; font-family: monospace; color: #24292e;">${registration.email}</td>
                            </tr>
                            <tr>
                              <td style="padding: 3px 0;">Ticket status:</td>
                              <td style="padding: 3px 0; text-align: right; font-weight: bold; font-family: monospace; color: #24292e;">
                                ${isPending 
                                  ? `<span style="color: #d97706; font-size: 11px;">Pending Approval</span>` 
                                  : `<span style="color: #059669; font-size: 11px;">Confirmed (${registration.ticketCode})</span>`
                                }
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>

                      <!-- RSVP Answers & Payment (if any) -->
                      <tr>
                        <td>
                          ${answersHtml}
                          ${paymentHtml}
                        </td>
                      </tr>

                      <!-- Scannable Entry Pass QR Code -->
                      ${!isPending ? `
                      <tr>
                        <td align="center" style="text-align: center; margin-top: 16px; padding-top: 16px; border-top: 1px solid #e1e4e8;">
                          <span style="margin: 0 0 10px 0; font-size: 10px; font-family: -apple-system, BlinkMacSystemFont, sans-serif; color: #586069; font-weight: 600; display: block;">Entry pass QR code</span>
                          <div style="display: inline-block; background-color: #ffffff; padding: 10px; border-radius: 8px; border: 1px solid #e1e4e8; text-align: center; margin-bottom: 8px;">
                            <img src="cid:ticket-qrcode" alt="Ticket QR Code" width="130" height="130" style="width: 130px; height: 130px; display: block; margin: 0 auto; border: 0; outline: none;" />
                          </div>
                          <div style="font-family: monospace; font-size: 13px; color: #24292e; font-weight: bold; letter-spacing: 1px; margin-top: 4px;">${registration.ticketCode}</div>
                          <p style="margin: 6px 0 0 0; font-size: 11px; color: #586069; font-family: -apple-system, BlinkMacSystemFont, sans-serif; line-height: 1.4; max-width: 280px; text-align: center;">
                            Please present this QR pass to the organizer at the venue entrance for scanning.
                          </p>
                        </td>
                      </tr>
                      ` : ''}
                    </table>

                    <!-- View ticket pass CTA -->
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="text-align: center; margin-bottom: 12px;">
                      <tr>
                        <td>
                          <a href="${passUrl}" style="display: inline-block; background-color: #24292e; color: #ffffff; font-family: -apple-system, BlinkMacSystemFont, sans-serif; font-weight: 600; font-size: 13px; text-decoration: none; padding: 10px 20px; border-radius: 6px; border: 1px solid #1b1f23; text-align: center;">
                            ${isPending ? 'Check ticket status' : 'View ticket pass'}
                          </a>
                        </td>
                      </tr>
                    </table>

                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="padding: 24px 20px; text-align: center; background-color: #f6f8fa; border-top: 1px solid #e1e4e8;">
                    <div style="margin-bottom: 8px;">
                      <span style="display: inline-block; width: 22px; height: 22px; line-height: 22px; border-radius: 4px; background-color: #4f46e5; color: #ffffff; font-weight: bold; font-size: 10px; font-family: monospace; text-align: center; vertical-align: middle;">SF</span>
                      <span style="font-size: 11px; font-weight: 600; color: #24292e; margin-left: 6px; vertical-align: middle;">Student Forge Events</span>
                    </div>
                    <p style="margin: 0; font-size: 11px; font-family: -apple-system, BlinkMacSystemFont, sans-serif; color: #586069;">
                      Secure Ticketing System &bull; Hyderabad, India
                    </p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    await resend.emails.send({
      from: `Student Forge <${resendFromEmail}>`,
      to,
      subject,
      text: isPending 
        ? `Pending Approval: Your details for ${event.title} were sent to the organizer.` 
        : `Confirmed: Your RSVP for ${event.title} is successful! Ticket Code: ${registration.ticketCode}`,
      html: mailHtml,
      attachments: attachments.map(att => ({
        filename: att.filename,
        content: att.content,
        cid: att.cid
      }))
    });
    console.log(`Email sent successfully to ${to} (${type})`);
  } catch (error) {
    console.error('Resend sendEventMail error:', error);
  }
}
