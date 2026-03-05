import nodemailer from 'nodemailer';

// 创建邮件发送器
function createTransporter() {
  return nodemailer.createTransport({
    host: 'smtp.qq.com',
    port: 587,
    secure: false, // 使用TLS
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
}

// 解析收件人：支持逗号、分号或换行分隔的多个邮箱
function parseRecipients(envTo) {
  if (!envTo || !String(envTo).trim()) return []
  return String(envTo)
    .split(/[,;\n]+/)
    .map((e) => e.trim())
    .filter(Boolean)
}

// 发送提醒邮件（支持群发多个邮箱）
export async function sendAlertEmail(subject, message) {
  try {
    const recipients = parseRecipients(process.env.EMAIL_TO)
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS || recipients.length === 0) {
      console.warn('邮箱配置未设置或收件人为空，跳过邮件发送');
      return { success: false, email: process.env.EMAIL_TO || '', error: '邮箱配置未设置或收件人为空' };
    }

    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: recipients.length === 1 ? recipients[0] : recipients,
      subject: subject,
      text: message,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
          <h2 style="color: #333;">${subject}</h2>
          <div style="margin-top: 20px; line-height: 1.6; color: #555;">
            ${message.replace(/\n/g, '<br>')}
          </div>
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; font-size: 12px; color: #999;">
            <p>此邮件由投资信号系统自动发送，请勿回复。</p>
          </div>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    const toLabel = recipients.length === 1 ? recipients[0] : `${recipients.length}个收件人`
    console.log('邮件发送成功:', info.messageId, 'to:', toLabel);
    return { success: true, email: toLabel, messageId: info.messageId };
  } catch (error) {
    console.error('邮件发送失败:', error.message);
    return { success: false, email: process.env.EMAIL_TO || '', error: error.message };
  }
}
