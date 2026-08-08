import { NextRequest, NextResponse } from 'next/server';
import puppeteer from 'puppeteer';
import { prisma } from '@/lib/prisma';
import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';

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
    const isVip = ticketCode?.startsWith('TKT-VIP') || paymentMethod === 'VIP PASS';

    // 1. Primary: Pure JS PDF generation via jsPDF (100% reliable everywhere)
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
      doc.text(ticketCode || 'TKT-ENTRY', 142, 10.5, { align: 'right' });

      // Top hairline divider
      doc.setDrawColor(228, 228, 231);
      doc.setLineWidth(0.3);
      doc.line(8, 13.5, 142, 13.5);

      // Event Title (bold dark font)
      doc.setTextColor(24, 24, 27);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11.5);
      const titleText = (event.title || 'Event Ticket Pass').substring(0, 40);
      doc.text(titleText, 8, 20.5);

      // Thin separator line
      doc.setDrawColor(244, 244, 245);
      doc.setLineWidth(0.3);
      doc.line(8, 24, 100, 24);

      // Attendee Name
      doc.setTextColor(113, 113, 122);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6);
      doc.text(isVip ? 'HONORED GUEST NAME' : 'ATTENDEE NAME', 8, 29);
      doc.setTextColor(24, 24, 27);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text((name || 'Guest').substring(0, 34), 8, 34);

      // Email Address
      doc.setTextColor(113, 113, 122);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6);
      doc.text('EMAIL ADDRESS', 8, 40);
      doc.setTextColor(63, 63, 70);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.text((email || '').substring(0, 38), 8, 45);

      // Date & Time Column
      doc.setTextColor(113, 113, 122);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6);
      doc.text('DATE & TIME', 8, 51);
      doc.setTextColor(24, 24, 27);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.text(`${event.startDate || 'TBA'} ${event.startTime || ''}`.substring(0, 26), 8, 56);

      // Venue / Location Column
      doc.setTextColor(113, 113, 122);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6);
      doc.text('LOCATION / VENUE', 58, 51);
      doc.setTextColor(24, 24, 27);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.text((event.location || 'Online').substring(0, 24), 58, 56);

      // Bottom Pass Badge (Clean minimalist pill)
      doc.setFillColor(244, 244, 245);
      doc.roundedRect(8, 63, 88, 6.5, 1.5, 1.5, 'F');
      doc.setTextColor(82, 82, 91);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.text(isVip ? 'COMPLIMENTARY VIP GUEST PASS' : 'OFFICIAL ADMISSION TICKET PASS', 52, 67.2, { align: 'center' });

      // Stub Vertical Divider
      doc.setDrawColor(212, 212, 216);
      doc.setLineWidth(0.3);
      doc.line(104, 13.5, 104, 74);

      // Right Stub: Clean High-Res QR Code
      const qrDataUrl = await QRCode.toDataURL(ticketCode || 'TKT-ENTRY', {
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
      doc.text(ticketCode || 'TKT-ENTRY', 124, 61, { align: 'center' });

      const arrayBuffer = doc.output('arraybuffer');
      return new NextResponse(Buffer.from(arrayBuffer), {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="ticket-${ticketCode}.pdf"`
        }
      });
    } catch (jsPdfErr) {
      console.warn('jsPDF route export failed, falling back to Puppeteer:', jsPdfErr);
    }

    const extractedColor = '#ff6b6b';
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
