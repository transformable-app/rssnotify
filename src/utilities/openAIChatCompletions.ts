export type OpenAIChatMessage = {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export type OpenAIEndpointAttempt = {
  endpoint: string
  status?: number
  elapsedMs: number
  retryable: boolean
  error?: string
  responsePreview?: string
}

export type OpenAIChatCompletionResult =
  | {
      ok: true
      content: string
      endpoint: string
      model: string
      attempts: OpenAIEndpointAttempt[]
    }
  | {
      ok: false
      retryable: boolean
      error: string
      attempts: OpenAIEndpointAttempt[]
    }

type OpenAIChatCompletionsArgs = {
  apiKey: string
  model: string
  messages: OpenAIChatMessage[]
  timeoutMs: number
  baseURL?: string
  fallbackBaseURLs?: string
  fallbackEndpoints?: OpenAIChatCompletionFallbackEndpoint[]
  responsePreviewChars?: number
}

export type OpenAIChatCompletionFallbackEndpoint = {
  baseURL?: string | null
  apiKey?: string | null
  model?: string | null
}

type OpenAIEndpointConfig = {
  endpoint: string
  apiKey: string
  model: string
}

const DEFAULT_OPENAI_BASE_URL = 'https://api.openai.com'

const normalizeBaseURL = (value: string): string | null => {
  const trimmed = value.trim()
  if (!trimmed) return null
  return trimmed.replace(/\/+$/, '')
}

export const getOpenAIEndpointCandidates = (args: {
  baseURL?: string
  fallbackBaseURLs?: string
}): string[] => {
  return getOpenAIEndpointConfigs({
    apiKey: '',
    baseURL: args.baseURL,
    fallbackBaseURLs: args.fallbackBaseURLs,
  }).map((entry) => entry.endpoint)
}

const getFallbackEndpointConfigs = (args: {
  fallbackBaseURLs?: string
  fallbackEndpoints?: OpenAIChatCompletionFallbackEndpoint[]
  primaryApiKey: string
  primaryModel: string
}): OpenAIEndpointConfig[] => {
  const configuredFallbacks = args.fallbackEndpoints
    ?.map((entry) => {
      const baseURL = normalizeBaseURL(entry.baseURL || '')
      const apiKey = entry.apiKey?.trim()
      const model = entry.model?.trim() || args.primaryModel
      if (!baseURL || !apiKey) return null
      return { endpoint: `${baseURL}/v1/chat/completions`, apiKey, model }
    })
    .filter((entry): entry is OpenAIEndpointConfig => Boolean(entry))

  if (configuredFallbacks?.length) return configuredFallbacks

  return (args.fallbackBaseURLs || '')
    .split(',')
    .map((entry) => normalizeBaseURL(entry))
    .filter((entry): entry is string => Boolean(entry))
    .map((baseURL) => ({
      endpoint: `${baseURL}/v1/chat/completions`,
      apiKey: args.primaryApiKey,
      model: args.primaryModel,
    }))
}

const getOpenAIEndpointConfigs = (args: {
  apiKey: string
  model?: string
  baseURL?: string
  fallbackBaseURLs?: string
  fallbackEndpoints?: OpenAIChatCompletionFallbackEndpoint[]
}): OpenAIEndpointConfig[] => {
  const primary = normalizeBaseURL(args.baseURL || DEFAULT_OPENAI_BASE_URL)
  const primaryModel = args.model || ''
  const candidates: OpenAIEndpointConfig[] = [
    ...(primary
      ? [{ endpoint: `${primary}/v1/chat/completions`, apiKey: args.apiKey, model: primaryModel }]
      : []),
    ...getFallbackEndpointConfigs({
      fallbackBaseURLs: args.fallbackBaseURLs,
      fallbackEndpoints: args.fallbackEndpoints,
      primaryApiKey: args.apiKey,
      primaryModel,
    }),
  ]

  const seen = new Set<string>()
  return candidates.filter((entry) => {
    if (seen.has(entry.endpoint)) return false
    seen.add(entry.endpoint)
    return true
  })
}

const isRetryableStatus = (status: number): boolean => {
  return status === 408 || status === 409 || status === 425 || status === 429 || status >= 500
}

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) return error.message
  return 'Unknown AI error.'
}

const previewResponse = (value: string, limit?: number): string | undefined => {
  if (!limit || limit <= 0) return undefined
  return value.length > limit ? `${value.slice(0, limit)}...` : value
}

export const formatOpenAIEndpointAttempts = (attempts: OpenAIEndpointAttempt[]): string => {
  return attempts
    .map((attempt) => {
      let host = attempt.endpoint
      try {
        host = new URL(attempt.endpoint).host
      } catch {
        host = attempt.endpoint
      }
      const status = typeof attempt.status === 'number' ? `status ${attempt.status}` : 'no status'
      const detail = attempt.error ? `: ${attempt.error}` : ''
      return `${host} (${status}, ${attempt.elapsedMs}ms${detail})`
    })
    .join('; ')
}

export const runOpenAIChatCompletion = async (
  args: OpenAIChatCompletionsArgs,
): Promise<OpenAIChatCompletionResult> => {
  const endpoints = getOpenAIEndpointConfigs({
    apiKey: args.apiKey,
    model: args.model,
    baseURL: args.baseURL,
    fallbackBaseURLs: args.fallbackBaseURLs,
    fallbackEndpoints: args.fallbackEndpoints,
  })
  const attempts: OpenAIEndpointAttempt[] = []

  for (const { endpoint, apiKey, model } of endpoints) {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), args.timeoutMs)
    const startedAt = Date.now()

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: args.messages,
        }),
      })
      const rawResponse = await response.text()
      const elapsedMs = Date.now() - startedAt
      const retryable = !response.ok && isRetryableStatus(response.status)

      if (!response.ok) {
        attempts.push({
          endpoint,
          status: response.status,
          elapsedMs,
          retryable,
          error: `AI request failed: ${response.status} ${response.statusText}`,
          responsePreview: previewResponse(rawResponse, args.responsePreviewChars),
        })

        if (!retryable) {
          return {
            ok: false,
            retryable: false,
            error: `AI request failed: ${response.status} ${response.statusText}`,
            attempts,
          }
        }

        continue
      }

      let payload: { choices?: { message?: { content?: string } }[] } | null = null
      try {
        payload = JSON.parse(rawResponse) as { choices?: { message?: { content?: string } }[] }
      } catch {
        attempts.push({
          endpoint,
          status: response.status,
          elapsedMs,
          retryable: true,
          error: 'AI response was not valid JSON.',
          responsePreview: previewResponse(rawResponse, args.responsePreviewChars),
        })
        continue
      }

      const content = payload.choices?.[0]?.message?.content || ''
      if (!content) {
        attempts.push({
          endpoint,
          status: response.status,
          elapsedMs,
          retryable: true,
          error: 'AI response did not include message content.',
          responsePreview: previewResponse(rawResponse, args.responsePreviewChars),
        })
        continue
      }

      attempts.push({
        endpoint,
        status: response.status,
        elapsedMs,
        retryable: false,
        responsePreview: previewResponse(rawResponse, args.responsePreviewChars),
      })

      return {
        ok: true,
        content,
        endpoint,
        model,
        attempts,
      }
    } catch (error) {
      attempts.push({
        endpoint,
        elapsedMs: Date.now() - startedAt,
        retryable: true,
        error: getErrorMessage(error),
      })
    } finally {
      clearTimeout(timeout)
    }
  }

  return {
    ok: false,
    retryable: true,
    error: attempts.at(-1)?.error || 'AI request failed for all configured endpoints.',
    attempts,
  }
}
