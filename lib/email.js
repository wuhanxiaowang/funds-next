import nodemailer from 'nodemailer'

function parseRecipients(envTo) {
  if (!envTo || !String(envTo).trim()) return []
  return String(envTo)
    .split(/[,;\n]+/)
    .map((e) => e.trim())
    .filter(Boolean)
}

export async function sendEmail({ to, subject, html }) {
  try {
    const smtpConfig = {
      host: 'smtp.qq.com',
      port: 465,
      secure: true,
      auth: {
        user: process.env.QQ_EMAIL_USER,
        pass: process.env.QQ_EMAIL_PASS
      }
    }

    if (!smtpConfig.auth.user || !smtpConfig.auth.pass) {
      console.warn('邮件未配置：请设置 QQ_EMAIL_USER 和 QQ_EMAIL_PASS')
      return { success: false, error: '邮件未配置' }
    }

    const transporter = nodemailer.createTransport(smtpConfig)

    const info = await transporter.sendMail({
      from: `${process.env.EMAIL_FROM || '投资信号系统'} <${smtpConfig.auth.user}>`,
      to: to,
      subject: subject,
      html: html
    })

    console.log('邮件发送成功:', info.messageId, 'to:', to)
    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error('邮件发送失败:', error.message)
    return { success: false, error: error.message }
  }
}

export async function sendAlertEmail(subject, message) {
  try {
    const smtpConfig = {
      host: 'smtp.qq.com',
      port: 465,
      secure: true,
      auth: {
        user: process.env.QQ_EMAIL_USER,
        pass: process.env.QQ_EMAIL_PASS
      }
    }

    if (!smtpConfig.auth.user || !smtpConfig.auth.pass) {
      console.warn('邮件未配置：请设置 QQ_EMAIL_USER 和 QQ_EMAIL_PASS')
      return { success: false, email: process.env.EMAIL_TO || '', error: '邮件未配置' }
    }

    const recipients = parseRecipients(process.env.EMAIL_TO)
    if (recipients.length === 0) {
      console.warn('邮件未配置：请设置 EMAIL_TO')
      return { success: false, email: '', error: '邮件未配置' }
    }

    const html = `
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

    const transporter = nodemailer.createTransport(smtpConfig)

    const info = await transporter.sendMail({
      from: `${process.env.EMAIL_FROM || '投资信号系统'} <${smtpConfig.auth.user}>`,
      to: recipients.join(','),
      subject: subject,
      html: html
    })

    const toLabel = recipients.length === 1 ? recipients[0] : `${recipients.length}个收件人`
    console.log('邮件发送成功:', info.messageId, 'to:', toLabel)
    return { success: true, email: toLabel, messageId: info.messageId }
  } catch (error) {
    console.error('邮件发送失败:', error.message)
    return { success: false, email: process.env.EMAIL_TO || '', error: error.message }
  }
}
