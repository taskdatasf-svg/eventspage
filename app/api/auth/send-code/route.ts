import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Please enter a valid email address' },
        { status: 400 }
      );
    }

    // Generate a random 6-digit verification code
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Configure Nodemailer transporter with Gmail SMTP credentials from environment variables
    const emailUser = process.env.EMAIL_USER || 'rishirohank.studentforge@gmail.com';
    const emailPass = process.env.EMAIL_PASS || 'kmgg xews mvdm ejwu';

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: emailUser,
        pass: emailPass
      }
    });

    const mailOptions = {
      from: `"Student Forge" <${emailUser}>`,
      to: email,
      subject: 'Confirm Your Email - Student Forge',
      text: `Your verification code is: ${code}`,
      html: `
        <div style="font-family: sans-serif; border: 1px solid #333339; padding: 24px; max-width: 320px; margin: 20px auto; background-color: #161618; color: #ffffff;">
          <h2 style="font-size: 16px; font-weight: bold; margin-bottom: 16px; text-align: center; letter-spacing: -0.5px;">Confirm Your Email</h2>
          <p style="font-size: 13px; color: #a1a1aa; line-height: 1.5; margin-bottom: 20px; text-align: center;">
            Please use the following 6-digit verification code to complete your registration.
          </p>
          <div style="font-family: monospace; font-size: 32px; font-weight: bold; letter-spacing: 4px; color: #ffffff; background-color: #222226; padding: 14px 0; border: 1px solid #333339; text-align: center;">
            ${code}
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json({
      success: true,
      email,
      code,
      message: `Verification code sent to ${email}`
    });
  } catch (error: any) {
    console.error('Nodemailer sendMail error:', error);
    return NextResponse.json({ error: 'Failed to send verification email: ' + error.message }, { status: 500 });
  }
}
