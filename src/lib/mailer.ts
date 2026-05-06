// src/lib/mailer.ts
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});

// Verification code
export async function sendVerificationCode(to: string, code: string) {
  await transporter.sendMail({
    from: `"Kitchen Coordinator Support" <${process.env.GMAIL_USER}>`,
    to,
    subject: '[Kitchen Coordinator] Your Verification Code',
    html: `
      <p>Hi there!</p>
      <p>
        Thanks for signing up for <strong>Kitchen Coordinator</strong>. Use the following code to verify your email:
      </p>
      <p style="text-align: center; font-size: 24px; font-weight: bold; margin: 20px 0;">
        ${code}
      </p>
      <p>This code will expire in 10 minutes.</p>
      <p>If you did not create an account, you can safely ignore this email.</p>
      <p>— The Kitchen Coordinator Team</p>
    `,
  });
}

// 🔑 Password reset
export async function sendPasswordResetEmail(to: string, token: string) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const resetUrl = `${baseUrl}/auth/reset-password?token=${token}`;

  await transporter.sendMail({
    from: `"Kitchen Coordinator Support" <${process.env.GMAIL_USER}>`,
    to,
    subject: '[Kitchen Coordinator] Reset Your Password',
    html: `
      <p>Hi there!</p>
      <p>We received a request to reset your password for <strong>Kitchen Coordinator</strong>.</p>
      <p>Click the button below to set a new password:</p>
      <p style="text-align: center; margin: 20px 0;">
        <a href="${resetUrl}" style="
          background-color: #dc3545;
          color: white;
          padding: 10px 20px;
          text-decoration: none;
          border-radius: 5px;
          font-weight: bold;
        ">Reset Password</a>
      </p>
      <p>This link will expire in 1 hour.</p>
      <p>If you did not request a password reset, you can safely ignore this email.</p>
      <p>— The Kitchen Coordinator Team</p>
    `,
  });
}
