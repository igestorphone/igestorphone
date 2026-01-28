export const IDLE_LAST_ACTIVITY_KEY = 'idle:lastActivityAt'

export function getLastActivityAt(): number | null {
  const raw = localStorage.getItem(IDLE_LAST_ACTIVITY_KEY)
  if (!raw) return null

  const value = Number(raw)
  return Number.isFinite(value) ? value : null
}

export function setLastActivityAt(timestampMs: number): void {
  try {
    localStorage.setItem(IDLE_LAST_ACTIVITY_KEY, String(timestampMs))
  } catch {
    // ignore (private mode / storage full)
  }
}

export function touchActivity(): void {
  setLastActivityAt(Date.now())
}

export function clearActivity(): void {
  try {
    localStorage.removeItem(IDLE_LAST_ACTIVITY_KEY)
  } catch {
    // ignore
  }
}

