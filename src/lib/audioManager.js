/**
 * Keeps a single audio stream playing at a time across the whole app.
 *
 * Every podcast card used to own a bare <audio> element with no coordination,
 * so starting a second episode layered both tracks on top of each other.
 */

let current = null

export function claimAudio(element) {
  if (current && current !== element) {
    try {
      current.pause()
    } catch {
      /* element may already be detached */
    }
  }
  current = element
}

export function releaseAudio(element) {
  if (current === element) current = null
}

export function pauseAllAudio() {
  if (current) {
    try {
      current.pause()
    } catch {
      /* ignore */
    }
    current = null
  }
}

export function formatTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00'
  const total = Math.floor(seconds)
  const mins = Math.floor(total / 60)
  const secs = total % 60
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`
}
