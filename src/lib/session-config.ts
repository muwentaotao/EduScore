export const SESSION_IDLE_TIMEOUT_SECONDS = 30 * 60;
export const SESSION_IDLE_TIMEOUT_MS = SESSION_IDLE_TIMEOUT_SECONDS * 1000;
export const SESSION_REFRESH_INTERVAL_MS = 60 * 1000;
export const SESSION_LAST_ACTIVITY_KEY = "eduscore_last_activity_at";

export function isSessionIdle(lastActivityAt: number, now = Date.now()) {
  return now - lastActivityAt >= SESSION_IDLE_TIMEOUT_MS;
}

export function getSessionIdleRemaining(lastActivityAt: number, now = Date.now()) {
  return Math.max(0, lastActivityAt + SESSION_IDLE_TIMEOUT_MS - now);
}

export function getSessionRefreshDelay(lastRefreshAt: number, now = Date.now()) {
  return Math.max(0, lastRefreshAt + SESSION_REFRESH_INTERVAL_MS - now);
}
