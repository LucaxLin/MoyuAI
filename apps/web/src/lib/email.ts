import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendVerificationCode(email: string, code: string) {
  await transporter.sendMail({
    from: `"墨语 AI" <${process.env.SMTP_USER}>`,
    to: email,
    subject: "墨语 - 注册验证码",
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>欢迎注册墨语</h2>
        <p>您的注册验证码是：</p>
        <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; padding: 20px; background: #f5f5f5; text-align: center;">
          ${code}
        </div>
        <p style="color: #666; font-size: 14px;">验证码有效期10分钟，请尽快完成验证。</p>
      </div>
    `,
  });
}
