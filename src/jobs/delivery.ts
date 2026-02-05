import nodemailer from 'nodemailer'

export type EmailSettings = {
  enabled?: boolean | null
  fromName?: string | null
  fromEmail?: string | null
  replyTo?: string | null
  recipients?: { email?: string | null }[] | null
}

export type NtfySettings = {
  enabled?: boolean | null
  serverURL?: string | null
  authToken?: string | null
  channels?: { topic?: string | null }[] | null
}

const getSmtpTransport = () => {
  const smtpUrl = process.env.SMTP_URL
  if (!smtpUrl) return null
  return nodemailer.createTransport(smtpUrl)
}

export const sendEmail = async (args: {
  settings: EmailSettings
  subject: string
  text: string
}): Promise<{ status: 'sent' | 'skipped' | 'failed'; error?: string }> => {
  const { settings, subject, text } = args

  if (!settings.enabled) {
    return { status: 'skipped', error: 'Email delivery disabled.' }
  }

  const recipients = (settings.recipients ?? []).map((entry) => entry.email).filter(Boolean) as string[]
  if (!recipients.length) {
    return { status: 'skipped', error: 'No email recipients configured.' }
  }

  const transport = getSmtpTransport()
  if (!transport) {
    return { status: 'failed', error: 'SMTP_URL is not configured.' }
  }

  const fromAddress = settings.fromEmail
  if (!fromAddress) {
    return { status: 'failed', error: 'From email is not configured.' }
  }

  const from = settings.fromName ? `${settings.fromName} <${fromAddress}>` : fromAddress

  try {
    await transport.sendMail({
      to: recipients,
      subject,
      text,
      from,
      replyTo: settings.replyTo || undefined,
    })

    return { status: 'sent' }
  } catch (error) {
    return { status: 'failed', error: error instanceof Error ? error.message : 'Unknown email error.' }
  }
}

export const sendNtfy = async (args: {
  settings: NtfySettings
  title: string
  message: string
  url?: string | null
}): Promise<{ status: 'sent' | 'skipped' | 'failed'; error?: string }> => {
  const { settings, title, message, url } = args

  if (!settings.enabled) {
    return { status: 'skipped', error: 'Ntfy delivery disabled.' }
  }

  const serverURL = settings.serverURL?.replace(/\/$/, '')
  if (!serverURL) {
    return { status: 'failed', error: 'Ntfy server URL is not configured.' }
  }

  const topics = (settings.channels ?? []).map((entry) => entry.topic).filter(Boolean) as string[]
  if (!topics.length) {
    return { status: 'skipped', error: 'No ntfy channels configured.' }
  }

  const headers: Record<string, string> = {
    'content-type': 'text/plain; charset=utf-8',
    title,
  }

  if (url) {
    headers.click = url
  }

  if (settings.authToken) {
    headers.authorization = `Bearer ${settings.authToken}`
  }

  try {
    for (const topic of topics) {
      const response = await fetch(`${serverURL}/${topic}`, {
        method: 'POST',
        headers,
        body: message,
      })

      if (!response.ok) {
        throw new Error(`Ntfy failed for ${topic}: ${response.status} ${response.statusText}`)
      }
    }

    return { status: 'sent' }
  } catch (error) {
    return { status: 'failed', error: error instanceof Error ? error.message : 'Unknown ntfy error.' }
  }
}
