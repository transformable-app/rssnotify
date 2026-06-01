import type { Payload } from 'payload'

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

const getNtfyActionLabel = (url: string): string => {
  try {
    const hostname = new URL(url).hostname.toLowerCase()
    if (hostname.includes('reddit.com') || hostname.endsWith('redd.it')) {
      return 'Open Reddit'
    }
  } catch {
    // Invalid URLs are still passed to ntfy click/action as-is.
  }

  return 'Open Link'
}

const quoteNtfyHeaderValue = (value: string): string => `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`

const buildNtfyActionsHeader = (url: string): string => {
  const label = getNtfyActionLabel(url)
  return `action=view, label=${quoteNtfyHeaderValue(label)}, url=${quoteNtfyHeaderValue(url)}, clear=true`
}

const escapeHtml = (s: string): string =>
  s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

export const sendEmail = async (args: {
  payload: Payload
  settings: EmailSettings
  subject: string
  text: string
  html?: string
  sourceURL?: string | null
}): Promise<{ status: 'sent' | 'skipped' | 'failed'; error?: string }> => {
  const { payload, settings, subject, text, html, sourceURL } = args

  if (!settings.enabled) {
    return { status: 'skipped', error: 'Email delivery disabled.' }
  }

  const recipients = (settings.recipients ?? []).map((entry) => entry.email).filter(Boolean) as string[]
  if (!recipients.length) {
    return { status: 'skipped', error: 'No email recipients configured.' }
  }

  const fromAddress = settings.fromEmail
  if (!fromAddress) {
    return { status: 'failed', error: 'From email is not configured.' }
  }

  const from = settings.fromName ? `${settings.fromName} <${fromAddress}>` : fromAddress

  const textBody = sourceURL ? `${text}\n\nView source: ${sourceURL}` : text
  const htmlBody =
    html ||
    (sourceURL
      ? `<p>${escapeHtml(text)}</p><p><a href="${escapeHtml(sourceURL)}">View source</a></p>`
      : `<p>${escapeHtml(text)}</p>`)

  try {
    await payload.sendEmail({
      to: recipients,
      subject,
      text: textBody,
      html: htmlBody,
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
    headers.actions = buildNtfyActionsHeader(url)
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
