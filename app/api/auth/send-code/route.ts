import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const { email, checkUserExists } = await request.json();

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Please enter a valid email address' },
        { status: 400 }
      );
    }

    if (checkUserExists) {
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        return NextResponse.json(
          { error: 'No account found with this email address' },
          { status: 404 }
        );
      }
    }

    // Generate a random 6-digit verification code
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Configure Resend API Client
    const resendApiKey = process.env.RESEND_API_KEY || 're_xxxxxxxxx';
    const resendFromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
    const resend = new Resend(resendApiKey);

    const mailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Confirm Your Email</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #fafbfc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; color: #24292e;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #fafbfc; width: 100%; min-height: 100%; padding: 40px 20px;">
          <tr>
            <td align="center" valign="top">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 460px; background-color: #ffffff; border: 1px solid #e1e4e8; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(27,31,35,0.04);">
                
                <tr>
                  <td style="padding: 32px 32px 24px 32px;">
                    <!-- Brand Icon & Header -->
                    <div style="margin-bottom: 24px;">
                      <span style="display: inline-block; width: 28px; height: 28px; line-height: 28px; border-radius: 6px; background-color: #4f46e5; color: #ffffff; font-weight: bold; font-size: 13px; font-family: monospace; text-align: center; vertical-align: middle;">SF</span>
                      <span style="font-size: 14px; font-weight: 600; color: #24292e; margin-left: 8px; vertical-align: middle;">Student Forge</span>
                    </div>
                    
                    <h2 style="margin: 0 0 12px 0; color: #24292e; font-size: 20px; font-weight: 600; letter-spacing: -0.5px; font-family: -apple-system, BlinkMacSystemFont, sans-serif;">Confirm your email address</h2>
                    <p style="margin: 0 0 20px 0; color: #586069; font-size: 14px; line-height: 1.6; font-family: -apple-system, BlinkMacSystemFont, sans-serif;">
                      Please use the secure 6-digit verification code below to authorize your registration or request:
                    </p>
                  </td>
                </tr>

                <!-- OTP Code Display -->
                <tr>
                  <td style="padding: 0 32px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f6f8fa; border: 1px solid #e1e4e8; border-radius: 6px; text-align: center;">
                      <tr>
                        <td style="padding: 20px 0;">
                          <span style="font-family: monospace; font-size: 36px; font-weight: bold; letter-spacing: 4px; color: #24292e; display: block; width: 100%;">${code}</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Help Note -->
                <tr>
                  <td style="padding: 24px 32px 32px 32px;">
                    <p style="margin: 0 0 16px 0; font-size: 13px; line-height: 1.5; color: #586069; font-family: -apple-system, BlinkMacSystemFont, sans-serif;">
                      If this verification email isn't in your inbox, please make sure to check your <strong>Spam or Junk folder</strong>.
                    </p>
                    <p style="margin: 0; color: #6a737d; font-size: 12px; font-family: -apple-system, BlinkMacSystemFont, sans-serif; border-top: 1px solid #eaecef; padding-top: 16px;">
                      For security reasons, this verification code will expire shortly. Please do not share it with anyone.
                    </p>

                    <!-- Bottom Brand Logo & Footer -->
                    <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #eaecef; text-align: center;">
                      <div style="margin-bottom: 8px;">
                        <span style="display: inline-block; width: 22px; height: 22px; line-height: 22px; border-radius: 4px; background-color: #4f46e5; color: #ffffff; font-weight: bold; font-size: 10px; font-family: monospace; text-align: center; vertical-align: middle;">SF</span>
                        <span style="font-size: 11px; font-weight: 600; color: #24292e; margin-left: 6px; vertical-align: middle;">Student Forge Events</span>
                      </div>
                      <span style="font-size: 11px; color: #6a737d; font-family: -apple-system, BlinkMacSystemFont, sans-serif; display: block;">
                        Secure Authentication System &bull; Hyderabad, India
                      </span>
                    </div>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    // Always log code to terminal for easy development testing
    console.log('\n\x1b[43m\x1b[30m%s\x1b[0m', ` [SANDBOX MODE] VERIFICATION CODE FOR ${email}: ${code} `);
    console.log(`Use this code to authorize your action if Resend sandbox limits prevent delivery.\n`);

    try {
      await resend.emails.send({
        from: `Student Forge <${resendFromEmail}>`,
        to: email,
        subject: 'Confirm Your Email - Student Forge',
        text: `Your verification code is: ${code}`,
        html: mailHtml
      });
    } catch (mailError: any) {
      console.warn('Resend mail delivery failed (proceeding using terminal logs):', mailError.message);
    }

    return NextResponse.json({
      success: true,
      email,
      code,
      message: `Verification code sent to ${email}`
    });
  } catch (error: any) {
    console.error('Resend sendMail error:', error);
    return NextResponse.json({ error: 'Failed to send verification email: ' + error.message }, { status: 500 });
  }
}
