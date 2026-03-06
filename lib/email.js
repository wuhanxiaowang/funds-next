// Edge 兼容：使用 Resend API（fetch），便于在 Cloudflare Pages 等 Edge 环境部署。
// 需配置：RESEND_API_KEY、RESEND_FROM（发件人，如 "通知 <onboarding@resend.dev>"）、EMAIL_TO（收件人，逗号/分号分隔）

function parseRecipients(envTo) {
  if (!envTo || !String(envTo).trim()) return []
  return String(envTo)
    .split(/[,;\n]+/)
    .map((e) => e.trim())
    .filter(Boolean)
}

export async function sendAlertEmail(subject, message) {
  try {
    const apiKey = process.env.RESEND_API_KEY
    const from = process.env.RESEND_FROM || process.env.EMAIL_USER
    const recipients = parseRecipients(process.env.EMAIL_TO)

    if (!apiKey || !from || recipients.length === 0) {
      console.warn('邮件未配置：请设置 RESEND_API_KEY、RESEND_FROM（或 EMAIL_USER）和 EMAIL_TO')
      return { success: false, email: process.env.EMAIL_TO || '', error: '邮件未配置' }
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

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: from,
        to: recipients,
        subject: subject,
        html: html,
      }),
    })

    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      console.error('Resend 发送失败:', res.status, data)
      return { success: false, email: process.env.EMAIL_TO || '', error: data?.message || res.statusText }
    }
    const toLabel = recipients.length === 1 ? recipients[0] : `${recipients.length}个收件人`
    console.log('邮件发送成功:', data.id, 'to:', toLabel)
    return { success: true, email: toLabel, messageId: data.id }
  } catch (error) {
    console.error('邮件发送失败:', error.message)
    return { success: false, email: process.env.EMAIL_TO || '', error: error.message }
  }
}
