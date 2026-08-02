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
      <body style="margin: 0; padding: 0; background-color: #161618; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;">
        <div style="max-width: 500px; margin: 30px auto; background-color: #1c1c1f; border: 1px solid #2e2e34; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
          
          <!-- Event Header Banner -->
          ${headerBannerHtml}

          <!-- Email Content Body -->
          <div style="padding: 24px;">
            
            <!-- Icon and Status -->
            <div style="text-align: center; margin-bottom: 20px;">
              <h2 style="margin: 0; color: #ffffff; font-size: 20px; font-weight: 800; letter-spacing: -0.5px;">
                ${isPending ? 'RSVP Pending Approval' : 'Registration Successful!'}
              </h2>
              <p style="margin: 6px 0 0 0; color: #a1a1aa; font-size: 13px; line-height: 1.5;">
                ${isPending 
                  ? 'Your details were sent to the organizer. We are checking and reviewing your details, we make sure to get updates of your ticket.' 
                  : 'Your registration has been successfully processed! Below are your entry ticket details.'
                }
              </p>
            </div>

            <!-- Ticket & Event Box -->
            <div style="background-color: #222226; border: 1px solid #2e2e34; border-radius: 12px; padding: 18px; margin-bottom: 24px;">
              <div style="border-bottom: 1px solid #2e2e34; padding-bottom: 14px; margin-bottom: 14px;">
                <span style="font-size: 9px; font-family: monospace; color: #8a8a90; text-transform: uppercase; letter-spacing: 1.5px; display: block; margin-bottom: 4px;">Event Details</span>
                <h3 style="margin: 0; color: #ffffff; font-size: 15px; font-weight: 700; line-height: 1.3;">
                  ${event.title}
                </h3>
                <p style="margin: 6px 0 0 0; color: #d4d4d8; font-size: 12px; font-weight: 500;">
                  Date: ${event.startDate} &middot; ${event.startTime}
                </p>
                <p style="margin: 4px 0 0 0; color: #a1a1aa; font-size: 12px;">
                  Address of Event: <span style="color: #ffffff; font-weight: 500;">${event.location || 'Online'}</span>
                </p>
                <p style="margin: 4px 0 0 0; color: #a1a1aa; font-size: 12px;">
                  Price: <strong style="color: #ffffff;">${event.price}</strong>
                </p>
              </div>

              <div>
                <span style="font-size: 9px; font-family: monospace; color: #8a8a90; text-transform: uppercase; letter-spacing: 1.5px; display: block; margin-bottom: 4px;">Attendee Info</span>
                <table style="width: 100%; border-collapse: collapse; font-size: 13px; color: #ffffff;">
                  <tr>
                    <td style="padding: 3px 0; color: #a1a1aa; width: 40%;">Name:</td>
                    <td style="padding: 3px 0; text-align: right; font-weight: 600;">${registration.name}</td>
                  </tr>
                  <tr>
                    <td style="padding: 3px 0; color: #a1a1aa;">Email:</td>
                    <td style="padding: 3px 0; text-align: right; font-weight: 500; font-family: monospace;">${registration.email}</td>
                  </tr>
                  <tr>
                    <td style="padding: 3px 0; color: #a1a1aa;">Ticket ID:</td>
                    <td style="padding: 3px 0; text-align: right; font-weight: bold; font-family: monospace; color: #ffffff; letter-spacing: 0.5px;">
                      ${isPending ? '<span style="color: #a1a1aa; font-size: 11px;">PENDING APPROVAL</span>' : registration.ticketCode}
                    </td>
                  </tr>
                </table>
              </div>

              <!-- RSVP Answers & Payment (if any) -->
              ${answersHtml}
              ${paymentHtml}

              <!-- Scannable Entry Pass QR Code -->
              ${!isPending ? `
              <div style="text-align: center; margin-top: 20px; padding-top: 16px; border-top: 1px solid #2e2e34;">
                <p style="margin: 0 0 8px 0; font-size: 10px; font-family: monospace; color: #8a8a90; text-transform: uppercase; letter-spacing: 1.5px;">Entry Pass QR Code</p>
                <div style="display: inline-block; background-color: #ffffff; padding: 10px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); text-align: center;">
                  <img src="cid:ticket-qrcode" alt="Ticket QR Code" style="width: 150px; height: 150px; display: block; margin: 0 auto;" />
                </div>
                <p style="margin: 6px 0 0 0; font-family: monospace; font-size: 12px; color: #ffffff; font-weight: bold; letter-spacing: 1px;">${registration.ticketCode}</p>
                <p style="margin: 4px 0 0 0; font-size: 10px; color: #a1a1aa; line-height: 1.4;">Present this QR code to the organizer at the entrance for verification.</p>
              </div>
              ` : ''}
            </div>

            <!-- View ticket pass CTA -->
            <div style="text-align: center; margin-bottom: 10px;">
              <a href="${passUrl}" style="display: inline-block; background-color: #ffffff; color: #000000; font-weight: bold; font-size: 13px; text-decoration: none; padding: 12px 24px; border-radius: 8px; box-shadow: 0 4px 12px rgba(255,255,255,0.1); text-align: center; transition: background-color 0.2s;">
                ${isPending ? 'Check Ticket Status' : 'View Ticket Pass (QR Code)'}
              </a>
            </div>

          </div>

          <!-- Footer without Logo -->
          <div style="background-color: #161618; border-top: 1px solid #2e2e34; padding: 20px; text-align: center;">
            <p style="margin: 0; font-size: 10px; font-family: monospace; color: #52525b; text-transform: uppercase; letter-spacing: 2px;">
              Student Forge Events Platform
            </p>
          </div>
        </div>
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
