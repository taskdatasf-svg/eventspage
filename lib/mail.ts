import nodemailer from 'nodemailer';

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
  if (bgClass.includes('[#818cf8]')) return '#818cf8';
  if (bgClass.includes('[#fef08a]')) return '#fef08a';
  if (bgClass.includes('[#6ee7b7]')) return '#6ee7b7';
  if (bgClass.includes('[#fbcfe8]')) return '#fbcfe8';
  if (bgClass.includes('[#fed7aa]')) return '#fed7aa';
  return '#818cf8'; // Indigo default
};

export async function sendEventMail({ to, subject, event, registration, type, originUrl }: SendMailParams) {
  try {
    const emailUser = process.env.EMAIL_USER || 'rishirohank.studentforge@gmail.com';
    const emailPass = process.env.EMAIL_PASS || 'kmgg xews mvdm ejwu';

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: emailUser,
        pass: emailPass
      }
    });

    const passUrl = `${originUrl}/events/${event.id}/rsvp`;

    // Process RSVP answers
    let answersHtml = '';
    if (registration.answers) {
      try {
        const parsed = JSON.parse(registration.answers);
        const entries = Object.entries(parsed);
        if (entries.length > 0) {
          answersHtml = `
            <div style="border-top: 1px solid #2e2e34; padding-top: 16px; margin-top: 16px;">
              <h4 style="margin: 0 0 10px 0; font-size: 11px; text-transform: uppercase; font-family: monospace; color: #8a8a90; letter-spacing: 1px;">RSVP Info</h4>
              <table style="width: 100%; border-collapse: collapse; font-size: 13px; color: #ffffff;">
                ${entries.map(([k, v]) => `
                  <tr>
                    <td style="padding: 4px 0; color: #a1a1aa; width: 40%; font-weight: 500;">${k}:</td>
                    <td style="padding: 4px 0; text-align: right; font-weight: 600;">${typeof v === 'boolean' ? (v ? 'Yes' : 'No') : String(v)}</td>
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
        <div style="border-top: 1px solid #2e2e34; padding-top: 16px; margin-top: 16px;">
          <h4 style="margin: 0 0 10px 0; font-size: 11px; text-transform: uppercase; font-family: monospace; color: #8a8a90; letter-spacing: 1px;">Payment Verification</h4>
          <table style="width: 100%; border-collapse: collapse; font-size: 13px; color: #ffffff;">
            <tr>
              <td style="padding: 4px 0; color: #a1a1aa; width: 40%;">Method:</td>
              <td style="padding: 4px 0; text-align: right; font-weight: 600;">${registration.paymentMethod}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0; color: #a1a1aa;">Account Name:</td>
              <td style="padding: 4px 0; text-align: right; font-weight: 600;">${registration.paymentAccountName}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0; color: #a1a1aa;">Transaction ID:</td>
              <td style="padding: 4px 0; text-align: right; font-family: monospace; font-size: 12px; color: #ffffff;">${registration.paymentTxnId}</td>
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
            <div style="width: 100%; text-align: center; background-color: #1c1c1f;">
              <img src="cid:event-cover" alt="${event.title}" width="500" style="width: 100%; max-width: 500px; height: auto; display: block; border: 0; outline: none; text-decoration: none;" />
            </div>
          `;
        } else {
          headerBannerHtml = `
            <div style="width: 100%; text-align: center; background-color: #1c1c1f;">
              <img src="${bannerSrc}" alt="${event.title}" width="500" style="width: 100%; max-width: 500px; height: auto; display: block; border: 0; outline: none; text-decoration: none;" />
            </div>
          `;
        }
      } catch (err) {
        console.error('Failed to attach cover as CID, falling back to absolute URL:', err);
        headerBannerHtml = `
          <div style="width: 100%; text-align: center; background-color: #1c1c1f;">
            <img src="${bannerSrc}" alt="${event.title}" width="500" style="width: 100%; max-width: 500px; height: auto; display: block; border: 0; outline: none; text-decoration: none;" />
          </div>
        `;
      }
    } else {
      // Sleek minimal grayscale gradient banner
      headerBannerHtml = `
        <div style="width: 100%; height: 120px; background: linear-gradient(135deg, #2e2e34 0%, #1c1c1f 100%); text-align: center; position: relative;">
          <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background-color: rgba(0, 0, 0, 0.25); border-radius: 16px 16px 0 0;"></div>
          <div style="position: relative; width: 100%; padding-top: 45px; text-shadow: 0 2px 4px rgba(0,0,0,0.6); text-align: center;">
            <span style="font-family: monospace; font-size: 14px; font-weight: bold; color: #ffffff; letter-spacing: 3px; text-transform: uppercase;">
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
      <body style="margin: 0; padding: 0; background-color: #0a0a0c; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #0a0a0c; width: 100%; min-height: 100%; padding: 30px 10px;">
          <tr>
            <td align="center" valign="top">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 500px; background-color: #121215; border: 1px solid #232329; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
                
                <!-- Event Header Banner -->
                <tr>
                  <td align="center" valign="top" style="overflow: hidden; border-radius: 16px 16px 0 0;">
                    ${headerBannerHtml}
                  </td>
                </tr>

                <!-- Email Content Body -->
                <tr>
                  <td style="padding: 28px 20px;">
                    
                    <!-- Icon and Status -->
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="text-align: center; margin-bottom: 24px;">
                      <tr>
                        <td>
                          <h2 style="margin: 0; color: #ffffff; font-size: 22px; font-weight: 800; letter-spacing: -0.5px; font-family: sans-serif;">
                            ${isPending ? 'RSVP Pending Approval' : 'Registration Confirmed!'}
                          </h2>
                          <p style="margin: 8px 0 0 0; color: #a1a1aa; font-size: 13px; line-height: 1.5; font-family: sans-serif;">
                            ${isPending 
                              ? 'Your details were sent to the organizer. We are checking and reviewing your details to approve your ticket.' 
                              : 'Your registration has been successfully processed! Below are your entry ticket details.'
                            }
                          </p>
                        </td>
                      </tr>
                    </table>

                    <!-- Ticket & Event Box -->
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #18181b; border: 1px solid #232329; border-radius: 12px; padding: 18px; margin-bottom: 24px; box-sizing: border-box;">
                      
                      <!-- Event Details Heading and info -->
                      <tr>
                        <td style="border-bottom: 1px solid #232329; padding-bottom: 14px; margin-bottom: 14px;">
                          <span style="font-size: 9px; font-family: monospace; color: #71717a; text-transform: uppercase; letter-spacing: 1.5px; display: block; margin-bottom: 6px;">Event Details</span>
                          <h3 style="margin: 0 0 8px 0; color: #ffffff; font-size: 16px; font-weight: 700; line-height: 1.3; font-family: sans-serif;">
                            ${event.title}
                          </h3>
                          
                          <!-- Info Grid -->
                          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="font-size: 12px; color: #a1a1aa; font-family: sans-serif;">
                            <tr>
                              <td style="padding: 3px 0; font-weight: 500;">Date & Time:</td>
                              <td style="padding: 3px 0; text-align: right; color: #ffffff; font-weight: 600;">${event.startDate} &middot; ${event.startTime}</td>
                            </tr>
                            <tr>
                              <td style="padding: 3px 0; font-weight: 500;">Venue / Location:</td>
                              <td style="padding: 3px 0; text-align: right; color: #ffffff; font-weight: 600;">${event.location || 'Online'}</td>
                            </tr>
                            <tr>
                              <td style="padding: 3px 0; font-weight: 500;">Admission:</td>
                              <td style="padding: 3px 0; text-align: right; color: #ffffff; font-weight: 600;">${event.price}</td>
                            </tr>
                          </table>
                        </td>
                      </tr>

                      <!-- Spacer -->
                      <tr>
                        <td height="14"></td>
                      </tr>

                      <!-- Attendee Info -->
                      <tr>
                        <td>
                          <span style="font-size: 9px; font-family: monospace; color: #71717a; text-transform: uppercase; letter-spacing: 1.5px; display: block; margin-bottom: 6px;">Attendee Details</span>
                          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="font-size: 12px; color: #a1a1aa; font-family: sans-serif;">
                            <tr>
                              <td style="padding: 3px 0; width: 40%;">Full Name:</td>
                              <td style="padding: 3px 0; text-align: right; font-weight: 600; color: #ffffff;">${registration.name}</td>
                            </tr>
                            <tr>
                              <td style="padding: 3px 0;">Email:</td>
                              <td style="padding: 3px 0; text-align: right; font-weight: 500; font-family: monospace; color: #ffffff;">${registration.email}</td>
                            </tr>
                            <tr>
                              <td style="padding: 3px 0;">Ticket Status:</td>
                              <td style="padding: 3px 0; text-align: right; font-weight: bold; font-family: monospace; color: #ffffff; letter-spacing: 0.5px;">
                                ${isPending 
                                  ? '<span style="color: #fbbf24; font-size: 11px; text-transform: uppercase;">PENDING APPROVAL</span>' 
                                  : `<span style="color: #34d399; font-size: 11px; text-transform: uppercase;">${registration.ticketCode}</span>`
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
                        <td align="center" style="text-align: center; margin-top: 20px; padding-top: 18px; border-top: 1px solid #232329;">
                          <span style="margin: 0 0 10px 0; font-size: 9px; font-family: monospace; color: #71717a; text-transform: uppercase; letter-spacing: 1.5px; display: block;">Entry Pass QR Code</span>
                          <div style="display: inline-block; background-color: #ffffff; padding: 12px; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.3); text-align: center; margin-bottom: 8px;">
                            <img src="cid:ticket-qrcode" alt="Ticket QR Code" width="140" height="140" style="width: 140px; height: 140px; display: block; margin: 0 auto; border: 0; outline: none;" />
                          </div>
                          <div style="font-family: monospace; font-size: 13px; color: #ffffff; font-weight: bold; letter-spacing: 1.5px; margin-top: 4px;">${registration.ticketCode}</div>
                          <p style="margin: 6px 0 0 0; font-size: 10px; color: #71717a; font-family: sans-serif; line-height: 1.4; max-width: 280px; text-align: center;">
                            Please present this secure QR pass to the organizer at the venue entrance for scanning.
                          </p>
                        </td>
                      </tr>
                      ` : ''}
                    </table>

                    <!-- View ticket pass CTA -->
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="text-align: center; margin-bottom: 12px;">
                      <tr>
                        <td>
                          <a href="${passUrl}" style="display: inline-block; background-color: #ffffff; color: #000000; font-family: sans-serif; font-weight: bold; font-size: 13px; text-decoration: none; padding: 12px 28px; border-radius: 8px; box-shadow: 0 4px 12px rgba(255,255,255,0.08); text-align: center;">
                            ${isPending ? 'Check Ticket Status' : 'View Ticket Pass (QR Code)'}
                          </a>
                        </td>
                      </tr>
                    </table>

                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="padding: 24px 20px; text-align: center; background-color: #0a0a0c; border-top: 1px solid #232329;">
                    <p style="margin: 0; font-size: 9px; font-family: monospace; color: #52525b; text-transform: uppercase; letter-spacing: 2px;">
                      Student Forge Events Platform &bull; All Rights Reserved
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

    const mailOptions = {
      from: `"Student Forge" <${emailUser}>`,
      to,
      subject,
      text: isPending 
        ? `Pending Approval: Your details for ${event.title} were sent to the organizer.` 
        : `Confirmed: Your RSVP for ${event.title} is successful! Ticket Code: ${registration.ticketCode}`,
      html: mailHtml,
      attachments
    };

    await transporter.sendMail(mailOptions);
    console.log(`Email sent successfully to ${to} (${type})`);
  } catch (error) {
    console.error('Nodemailer sendEventMail error:', error);
  }
}
