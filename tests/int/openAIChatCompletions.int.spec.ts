// @vitest-environment node

import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  getOpenAIEndpointCandidates,
  runOpenAIChatCompletion,
} from '@/utilities/openAIChatCompletions'

const buildResponse = (body: unknown, init?: ResponseInit): Response => {
  return new Response(typeof body === 'string' ? body : JSON.stringify(body), init)
}

const successBody = (content: string) => ({
  choices: [{ message: { content } }],
})

describe('openAIChatCompletions', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('builds primary and fallback endpoint candidates in order', () => {
    expect(
      getOpenAIEndpointCandidates({
        baseURL: ' https://primary.example.com/ ',
        fallbackBaseURLs:
          ' https://fallback-a.example.com/,,https://fallback-b.example.com/,https://primary.example.com ',
      }),
    ).toEqual([
      'https://primary.example.com/v1/chat/completions',
      'https://fallback-a.example.com/v1/chat/completions',
      'https://fallback-b.example.com/v1/chat/completions',
    ])
  })

  it('returns the primary response without calling fallback endpoints', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(buildResponse(successBody('yes'), { status: 200 }))

    const result = await runOpenAIChatCompletion({
      apiKey: 'test-key',
      model: 'test-model',
      timeoutMs: 1000,
      baseURL: 'https://primary.example.com',
      fallbackBaseURLs: 'https://fallback.example.com',
      messages: [{ role: 'user', content: 'test' }],
    })

    expect(result).toMatchObject({
      ok: true,
      content: 'yes',
      endpoint: 'https://primary.example.com/v1/chat/completions',
    })
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('tries a fallback endpoint after a retryable service failure', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(
        buildResponse({ error: 'busy' }, { status: 503, statusText: 'Service Unavailable' }),
      )
      .mockResolvedValueOnce(buildResponse(successBody('fallback yes'), { status: 200 }))

    const result = await runOpenAIChatCompletion({
      apiKey: 'test-key',
      model: 'test-model',
      timeoutMs: 1000,
      baseURL: 'https://primary.example.com',
      fallbackBaseURLs: 'https://fallback.example.com',
      messages: [{ role: 'user', content: 'test' }],
    })

    expect(result).toMatchObject({
      ok: true,
      content: 'fallback yes',
      endpoint: 'https://fallback.example.com/v1/chat/completions',
    })
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(result.attempts).toHaveLength(2)
    expect(result.attempts[0]).toMatchObject({ status: 503, retryable: true })
  })

  it('uses configured fallback endpoints with their own API keys and model overrides instead of env fallback URLs', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(
        buildResponse({ error: 'busy' }, { status: 503, statusText: 'Service Unavailable' }),
      )
      .mockResolvedValueOnce(buildResponse(successBody('configured fallback'), { status: 200 }))

    const result = await runOpenAIChatCompletion({
      apiKey: 'primary-key',
      model: 'test-model',
      timeoutMs: 1000,
      baseURL: 'https://primary.example.com',
      fallbackBaseURLs: 'https://env-fallback.example.com',
      fallbackEndpoints: [
        {
          baseURL: 'https://configured-fallback.example.com',
          apiKey: 'configured-key',
          model: 'configured-model',
        },
      ],
      messages: [{ role: 'user', content: 'test' }],
    })

    expect(result).toMatchObject({
      ok: true,
      content: 'configured fallback',
      endpoint: 'https://configured-fallback.example.com/v1/chat/completions',
      model: 'configured-model',
    })
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      'https://primary.example.com/v1/chat/completions',
      expect.objectContaining({
        headers: expect.objectContaining({ authorization: 'Bearer primary-key' }),
      }),
    )
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      'https://configured-fallback.example.com/v1/chat/completions',
      expect.objectContaining({
        headers: expect.objectContaining({ authorization: 'Bearer configured-key' }),
      }),
    )
    expect(JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body))).toMatchObject({
      model: 'test-model',
    })
    expect(JSON.parse(String(fetchMock.mock.calls[1]?.[1]?.body))).toMatchObject({
      model: 'configured-model',
    })
  })

  it('does not try fallback endpoints after a non-retryable client failure', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(
        buildResponse({ error: 'unauthorized' }, { status: 401, statusText: 'Unauthorized' }),
      )

    const result = await runOpenAIChatCompletion({
      apiKey: 'bad-key',
      model: 'test-model',
      timeoutMs: 1000,
      baseURL: 'https://primary.example.com',
      fallbackBaseURLs: 'https://fallback.example.com',
      messages: [{ role: 'user', content: 'test' }],
    })

    expect(result).toMatchObject({
      ok: false,
      retryable: false,
      error: 'AI request failed: 401 Unauthorized',
    })
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('tries a fallback endpoint after invalid JSON', async () => {
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(buildResponse('not json', { status: 200 }))
      .mockResolvedValueOnce(buildResponse(successBody('valid fallback'), { status: 200 }))

    const result = await runOpenAIChatCompletion({
      apiKey: 'test-key',
      model: 'test-model',
      timeoutMs: 1000,
      baseURL: 'https://primary.example.com',
      fallbackBaseURLs: 'https://fallback.example.com',
      messages: [{ role: 'user', content: 'test' }],
    })

    expect(result).toMatchObject({
      ok: true,
      content: 'valid fallback',
      endpoint: 'https://fallback.example.com/v1/chat/completions',
    })
    expect(result.attempts[0]).toMatchObject({
      status: 200,
      retryable: true,
      error: 'AI response was not valid JSON.',
    })
  })

  it('returns a concise failure when all endpoints fail retryably', async () => {
    vi.spyOn(globalThis, 'fetch')
      .mockRejectedValueOnce(new Error('network unavailable'))
      .mockResolvedValueOnce(
        buildResponse(
          { error: 'still busy' },
          { status: 500, statusText: 'Internal Server Error' },
        ),
      )

    const result = await runOpenAIChatCompletion({
      apiKey: 'test-key',
      model: 'test-model',
      timeoutMs: 1000,
      baseURL: 'https://primary.example.com',
      fallbackBaseURLs: 'https://fallback.example.com',
      messages: [{ role: 'user', content: 'test' }],
    })

    expect(result).toMatchObject({
      ok: false,
      retryable: true,
      error: 'AI request failed: 500 Internal Server Error',
    })
    expect(result.attempts).toHaveLength(2)
  })
})
