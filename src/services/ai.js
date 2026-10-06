/**
 * Client for the VoxCampus AI endpoint.
 *
 * The AI runs behind a serverless function (`/api/ai`) rather than in the
 * browser, so the provider API key never ships to clients. In a Vercel
 * deployment that function is `api/ai.js`; locally it is served by
 * `vercel dev` or `npx netlify dev`.
 *
 * The task IDs and error strings below are part of the contract the UI relies
 * on — the error classifier maps provider failures onto the states the
 * assistant renders, so changing them means changing both sides.
 */

const AI_ENDPOINT = '/api/ai'
const REQUEST_TIMEOUT_MS = 60_000

export const AI_TASKS = {
  ask: 'ask',
  outline: 'outline',
  feedback: 'feedback',
  quiz: 'quiz',
  flashcards: 'flashcards',
}

/** Shown when the function is missing or unreachable. */
const ENDPOINT_UNAVAILABLE =
  'AI endpoint unavailable. Deploy the AI function, or run `vercel dev` locally.'

/**
 * Maps a server error message onto a UI state.
 *
 * @returns {'offline' | 'unconfigured' | 'billing' | 'unauthorized' | 'error'}
 */
export function classifyAiError(message) {
  const text = String(message ?? '').toLowerCase()
  if (text.includes('networkerror')) return 'offline'
  if (text.includes('not configured') || text.includes('opencode_api_key')) return 'unconfigured'
  if (
    text.includes('payment method') ||
    text.includes('billing') ||
    text.includes('credits') ||
    text.includes('no payment')
  ) {
    return 'billing'
  }
  if (text.includes('authoriz') || text.includes('permission')) return 'unauthorized'
  return 'error'
}

/**
 * Calls the AI function.
 *
 * @param {{ task: string, prompt: string, context?: object, signal?: AbortSignal }} args
 * @returns {Promise<{ text?: string, [key: string]: unknown }>}
 */
export async function requestAi({ task, prompt, context, signal } = {}) {
  if (!task) throw new Error('No AI task was specified.')
  if (!prompt?.trim()) throw new Error('Please enter something for the AI to work with.')

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
  const forwardAbort = () => controller.abort()
  signal?.addEventListener('abort', forwardAbort)

  let response
  try {
    response = await fetch(AI_ENDPOINT, {
      method: 'POST',
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ task, prompt, context }),
    })
  } catch (error) {
    clearTimeout(timer)
    signal?.removeEventListener('abort', forwardAbort)
    if (error?.name === 'AbortError') {
      throw new Error('The AI took too long to respond. Please try again.', { cause: error })
    }
    throw new Error(ENDPOINT_UNAVAILABLE, { cause: error })
  }

  clearTimeout(timer)
  signal?.removeEventListener('abort', forwardAbort)

  const data = await response.json().catch(() => null)

  if (!response.ok) {
    throw new Error(
      data?.error ??
        (response.status === 404 ? ENDPOINT_UNAVAILABLE : `AI request failed (${response.status})`),
    )
  }

  if (typeof data?.text !== 'string') {
    throw new Error('The AI returned an unexpected response.')
  }

  return data
}
