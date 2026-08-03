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
        <body style="margin: 0; padding: 0; background-color: #0a0a0c; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #0a0a0c; width: 100%; min-height: 100%; padding: 40px 20px;">
            <tr>
              <td align="center" valign="top">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 440px; background-color: #121215; border: 1px solid #232329; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
                  
                  <!-- Header Brand Accent -->
                  <tr>
                    <td height="4" style="background: linear-gradient(90deg, #6366f1 0%, #4f46e5 100%);"></td>
                  </tr>

                  <tr>
                    <td style="padding: 32px 24px 24px 24px; text-align: center;">
                      <!-- Logo Icon mimicking brand -->
                      <div style="display: inline-block; margin-bottom: 20px;">
                        <span style="display: inline-block; width: 32px; height: 32px; line-height: 32px; border-radius: 8px; background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); color: #ffffff; font-weight: bold; font-size: 16px; font-family: monospace; text-align: center; vertical-align: middle;">SF</span>
                        <span style="font-family: monospace; font-size: 14px; font-weight: 800; color: #ffffff; letter-spacing: 1px; margin-left: 8px; vertical-align: middle; text-transform: uppercase;">Student Forge</span>
                      </div>
                      
                      <h2 style="margin: 0 0 10px 0; color: #ffffff; font-size: 20px; font-weight: 800; letter-spacing: -0.5px; font-family: sans-serif;">Confirm Your Email</h2>
                      <p style="margin: 0; color: #a1a1aa; font-size: 13px; line-height: 1.5; font-family: sans-serif;">
                        Please use the secure 6-digit verification code below to authorize your sign-up or verification request.
                      </p>
                    </td>
                  </tr>

                  <!-- OTP Code Display -->
                  <tr>
                    <td style="padding: 0 24px;">
                      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #18181b; border: 1px solid #232329; border-radius: 12px; text-align: center;">
                        <tr>
                          <td style="padding: 16px 0;">
                            <span style="font-family: monospace; font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #ffffff; display: block; width: 100%; text-shadow: 0 0 10px rgba(99,102,241,0.2);">${code}</span>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                  <!-- Spam Warning Card -->
                  <tr>
                    <td style="padding: 20px 24px;">
                      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #161619; border: 1px solid #232329; border-radius: 10px;">
                        <tr>
                          <td style="padding: 12px 14px; font-size: 11px; line-height: 1.4; color: #a1a1aa; font-family: sans-serif;">
                            <strong style="color: #ffffff; font-family: monospace; font-size: 9px; text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 4px;">Didn't receive the email?</strong>
                            If this verification email isn't in your inbox, please make sure to check your <strong>Spam or Junk folder</strong>.
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                  <!-- Expiry / Security Note -->
                  <tr>
                    <td style="padding: 0 24px 24px 24px; text-align: center; border-bottom: 1px solid #232329;">
                      <p style="margin: 0; color: #71717a; font-size: 11px; font-family: sans-serif;">
                        For security reasons, this OTP will expire shortly. Do not share this code with anyone.
                      </p>
                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="padding: 20px 24px; text-align: center; background-color: #0e0e10;">
                      <p style="margin: 0; font-size: 9px; font-family: monospace; color: #52525b; text-transform: uppercase; letter-spacing: 2px;">
                        Student Forge Events &bull; Secure Authentication System
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
