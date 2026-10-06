/**
 * VoxCampus AI endpoint (Vercel Serverless Function).
 *
 * The browser never talks to the AI provider directly — it posts here and this
 * function holds the key. That is why the key has no `VITE_` prefix: anything
 * prefixed `VITE_` is inlined into the client bundle and becomes public.
 *
 * Contract (mirrored by `src/services/ai.js`):
 *   POST /api/ai  body: { task, prompt, context }
 *   200 -> { text }
 *   !200 -> { error }
 *
 * The client pattern-matches the error string to decide which state to show, so
 * these messages are part of the contract. Keep the phrases "not configured",
 * "payment method"/"billing"/"credits", and "authoriz" if you reword them.
 */

const MAX_PROMPT_LENGTH = 8000

const TASKS = new Set(['ask', 'outline', 'feedback', 'quiz', 'flashcards'])

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    res.status(405).json({ error: 'Method not allowed.' })
    return
  }

  const { task, prompt } = req.body ?? {}

  if (!TASKS.has(task)) {
    res.status(400).json({ error: `Unknown AI task "${task ?? ''}".` })
    return
  }

  if (typeof prompt !== 'string' || !prompt.trim()) {
    res.status(400).json({ error: 'A prompt is required.' })
    return
  }

  if (prompt.length > MAX_PROMPT_LENGTH) {
    res.status(413).json({
      error: `That input is too long (${prompt.length} characters). Please keep it under ${MAX_PROMPT_LENGTH}.`,
    })
    return
  }

  const apiKey = process.env.OPENCODE_API_KEY

  if (!apiKey) {
    // Message must contain "not configured" for the UI to show its
    // "AI not configured" state rather than a generic error.
    res.status(503).json({
      error:
        'AI is not configured. Set OPENCODE_API_KEY in your project environment to enable the assistant.',
    })
    return
  }

  // The provider call is wired up separately — see the AI integration task.
  res.status(501).json({
    error: `The "${task}" action is not connected to a provider yet.`,
  })
}
