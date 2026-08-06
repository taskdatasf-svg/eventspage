import { NextRequest, NextResponse } from 'next/server';
import puppeteer from 'puppeteer';
import { prisma } from '@/lib/prisma';

function getFallbackSoftColor(headerBg: string | null | undefined): string {
  if (!headerBg) return '#ff6b6b';
  const clean = headerBg.toLowerCase();
  if (clean.includes('818cf8')) return '#ff6b6b';
  if (clean.includes('fef08a') || clean.includes('ffe600')) return '#fde047';
  if (clean.includes('6ee7b7')) return '#86efac';
  if (clean.includes('fbcfe8')) return '#fbcfe8';
  if (clean.includes('fed7aa')) return '#fdba74';
  return '#ff6b6b';
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const registration = await prisma.registration.findUnique({
      where: { id }
    });

    if (!registration) {
      return new NextResponse('Registration ticket not found', { status: 404 });
    }

    const event = await prisma.event.findUnique({
      where: { id: registration.eventId }
    });

    if (!event) {
      return new NextResponse('Event not found for this registration', { status: 404 });
    }

    const { name, email, ticketCode, paymentMethod, paymentAccountName, paymentTxnId, status } = registration;
    const extractedColor = getFallbackSoftColor(event.headerBg);

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {
              background-color: #161618;
              color: #ffffff;
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
              margin: 0;
              padding: 40px;
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              box-sizing: border-box;
            }
            .ticket-card {
              width: 760px;
              height: 360px;
              background-color: #1c1c1f;
              border: 1px solid #2e2e34;
              border-radius: 20px;
              display: flex;
              flex-direction: row;
              align-items: stretch;
              box-sizing: border-box;
              overflow: hidden;
              box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
            }
            .left-stub {
              flex: 1;
              padding: 32px;
              display: flex;
              flex-direction: column;
              justify-content: space-between;
              box-sizing: border-box;
              min-width: 0;
            }
            .header-row {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              gap: 16px;
            }
            .event-title-container {
              display: flex;
              flex-direction: column;
              gap: 4px;
              min-width: 0;
            }
            .label {
              font-size: 9px;
              text-transform: uppercase;
              color: #88888e;
              font-weight: 600;
              letter-spacing: 1px;
            }
            .event-title {
              font-size: 20px;
              font-weight: 800;
              color: #ffffff;
              margin: 0;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
            }
            .ticket-id-container {
              display: flex;
              flex-direction: column;
              align-items: flex-end;
              gap: 4px;
              flex-shrink: 0;
            }
            .ticket-id {
              font-size: 13px;
              font-family: monospace;
              font-weight: 700;
              color: #ffffff;
            }
            .details-row {
              display: flex;
              flex-direction: row;
              gap: 36px;
              border-top: 1px solid #2e2e34;
              padding-top: 18px;
              margin: 18px 0;
            }
            .detail-col {
              display: flex;
              flex-direction: column;
              gap: 2px;
            }
            .detail-value {
              font-size: 12px;
              font-weight: 600;
              color: #ffffff;
            }
            .highlight {
              color: ${extractedColor};
              font-weight: 700;
            }
            .attendee-box {
              background-color: #222226;
              border: 1px solid #2e2e34;
              border-radius: 12px;
              padding: 14px;
              display: flex;
              flex-direction: column;
              gap: 10px;
              box-sizing: border-box;
            }
            .attendee-profile {
              display: flex;
              align-items: center;
              gap: 12px;
            }
            .avatar {
              width: 32px;
              height: 32px;
              border-radius: 50%;
              background-color: #2e2e34;
              border: 1px solid #3e3e46;
              display: flex;
              align-items: center;
              justify-content: center;
              color: ${extractedColor};
              font-weight: 700;
              font-size: 12px;
              font-family: monospace;
            }
            .attendee-name {
              font-size: 12px;
              font-weight: 700;
              color: #ffffff;
            }
            .attendee-email {
              font-size: 10px;
              color: #a1a1aa;
              font-family: monospace;
            }
            .txn-details {
              border-top: 1px solid #2e2e34;
              padding-top: 8px;
              display: flex;
              justify-content: space-between;
              font-size: 9px;
              color: #71717a;
            }
            .txn-val {
              color: #d4d4d8;
              font-weight: 600;
            }
            .tear-line {
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              width: 1px;
              box-sizing: border-box;
              border-left: 2px dashed #2e2e34;
              margin: 18px 0;
            }
            .right-stub {
              width: 240px;
              background-color: #1c1c1f;
              padding: 32px;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              gap: 16px;
              box-sizing: border-box;
              flex-shrink: 0;
            }
            .qr-wrapper {
              padding: 12px;
              background-color: #ffffff;
              border-radius: 12px;
              display: flex;
              align-items: center;
              justify-content: center;
              box-sizing: border-box;
            }
            .pending-badge {
              border: 2px dashed #2e2e34;
              border-radius: 12px;
              width: 120px;
              height: 120px;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              padding: 12px;
              box-sizing: border-box;
              text-align: center;
            }
            .pending-text {
              font-size: 9px;
              font-weight: 700;
              color: #ef4444;
              text-transform: uppercase;
              letter-spacing: 1px;
            }
            .pending-subtext {
              font-size: 8px;
              color: #71717a;
              margin-top: 4px;
            }
            .stub-footer {
              display: flex;
              flex-direction: column;
              gap: 2px;
              text-align: center;
            }
            .stub-title {
              font-size: 10px;
              font-weight: 700;
              color: #d1d1d6;
              text-transform: uppercase;
              letter-spacing: 1px;
            }
            .stub-subtitle {
              font-size: 8px;
              color: #71717a;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
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
                  <span class="ticket-id">${status === 'PENDING' ? 'PENDING APPROVAL' : ticketCode}</span>
                </div>
              </div>

              <div class="details-row">
                <div class="detail-col">
                  <span class="label">Date & Time</span>
                  <span class="detail-value">${event.startDate} at ${event.startTime}</span>
                </div>
                <div class="detail-col" style="max-width: 180px;">
                  <span class="label">Location</span>
                  <span class="detail-value" style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${event.location}</span>
                </div>
                <div class="detail-col">
                  <span class="label">Amount</span>
                  <span class="detail-value highlight">${(ticketCode.startsWith('TKT-VIP') || paymentMethod === 'VIP PASS') ? 'FREE VIP PASS' : (event.price || 'Free')}</span>
                </div>
              </div>

              <div class="attendee-box">
                <div class="attendee-profile">
                  <div class="avatar">${name?.substring(0, 2).toUpperCase() || 'SF'}</div>
                  <div style="display: flex; flex-direction: column;">
                    <span class="attendee-name">${name}</span>
                    <span class="attendee-email">${email}</span>
                  </div>
                </div>
                ${paymentTxnId ? `
                  <div class="txn-details">
                    <div>Method: <span class="txn-val">${paymentMethod}</span></div>
                    <div>Account: <span class="txn-val">${paymentAccountName}</span></div>
                    <div>Txn ID: <span class="txn-val" style="font-family: monospace;">${paymentTxnId}</span></div>
                  </div>
                ` : ''}
              </div>
            </div>

            <div class="tear-line"></div>

            <div class="right-stub">
              ${status === 'PENDING' ? `
                <div class="pending-badge">
                  <span class="pending-text">Awaiting</span>
                  <span class="pending-subtext">Approval Pending</span>
                </div>
              ` : `
                <div class="qr-wrapper">
                  <img src="https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${ticketCode}" width="120" height="120" alt="QR Code" />
                </div>
              `}
              <div class="stub-footer">
                <span class="stub-title">${ticketCode.startsWith('TKT-VIP') ? 'VIP Speaker Pass' : 'Presenter Pass'}</span>
                <span class="stub-subtitle">${status === 'PENDING' ? 'Status: Pending' : 'Scan for entry'}</span>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    const browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 840, height: 440 });
    await page.setContent(htmlContent);
    const pdfBuffer = await page.pdf({
      width: '840px',
      height: '440px',
      printBackground: true
    });
    await browser.close();

    return new NextResponse(Buffer.from(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="ticket-${ticketCode}.pdf"`
      }
    });

  } catch (err: any) {
    console.error('PDF generation route error:', err);
    return new NextResponse('PDF generation failed: ' + err.message, { status: 500 });
  }
}
