"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  getSessionIdleRemaining,
  getSessionRefreshDelay,
  isSessionIdle,
  SESSION_LAST_ACTIVITY_KEY
} from "@/lib/session-config";

const ACTIVITY_EVENTS = [
  "pointerdown",
  "keydown",
  "scroll",
  "touchstart"
] as const;

function readLastActivity() {
  const value = Number(localStorage.getItem(SESSION_LAST_ACTIVITY_KEY));
  return Number.isFinite(value) && value > 0 ? value : null;
}

export function SessionActivityGuard() {
  const router = useRouter();

  useEffect(() => {
    let expiryTimer: ReturnType<typeof setTimeout> | undefined;
    let refreshTimer: ReturnType<typeof setTimeout> | undefined;
    let refreshInFlight = false;
    let forceRefreshAfterFlight = false;
    let logoutStarted = false;
    let lastRefreshAttemptAt = 0;
    const now = Date.now();
    const storedActivityAt = readLastActivity();
    const storedActivityIsExpired =
      storedActivityAt !== null &&
      storedActivityAt <= now &&
      isSessionIdle(storedActivityAt, now);
    let lastActivityAt = storedActivityIsExpired ? storedActivityAt : now;

    if (!storedActivityIsExpired) {
      localStorage.setItem(SESSION_LAST_ACTIVITY_KEY, String(now));
    }

    async function endSession(callLogout = true) {
      if (logoutStarted) return;
      logoutStarted = true;
      localStorage.removeItem(SESSION_LAST_ACTIVITY_KEY);
      if (expiryTimer) clearTimeout(expiryTimer);
      if (refreshTimer) clearTimeout(refreshTimer);

      if (callLogout) {
        try {
          await fetch("/api/auth/logout", {
            method: "POST",
            cache: "no-store",
            keepalive: true
          });
        } catch {
          // The server-side token expires independently after the same idle window.
        }
      }

      router.replace("/login");
      router.refresh();
    }

    function scheduleExpiry() {
      if (expiryTimer) clearTimeout(expiryTimer);
      const remaining = getSessionIdleRemaining(lastActivityAt);
      if (remaining <= 0) {
        void endSession();
        return;
      }
      expiryTimer = setTimeout(() => void endSession(), remaining);
    }

    function scheduleRefresh() {
      if (logoutStarted || refreshTimer) return;

      const delay = getSessionRefreshDelay(lastRefreshAttemptAt);
      refreshTimer = setTimeout(() => {
        refreshTimer = undefined;
        void refreshSession(true);
      }, delay);
    }

    async function refreshSession(force = false) {
      const requestedAt = Date.now();
      if (logoutStarted) {
        return;
      }
      if (refreshInFlight) {
        if (force) forceRefreshAfterFlight = true;
        return;
      }
      if (!force && getSessionRefreshDelay(lastRefreshAttemptAt, requestedAt) > 0) {
        scheduleRefresh();
        return;
      }

      if (refreshTimer) {
        clearTimeout(refreshTimer);
        refreshTimer = undefined;
      }

      refreshInFlight = true;
      lastRefreshAttemptAt = requestedAt;
      try {
        const response = await fetch("/api/auth/activity", {
          method: "POST",
          cache: "no-store",
          keepalive: true
        });
        if (response.status === 401) {
          await endSession(false);
        }
      } catch {
        // Keep the local idle timer active; a later interaction can retry the refresh.
      } finally {
        refreshInFlight = false;
        if (!logoutStarted) {
          if (forceRefreshAfterFlight) {
            forceRefreshAfterFlight = false;
            void refreshSession(true);
          } else if (lastActivityAt > lastRefreshAttemptAt) {
            scheduleRefresh();
          }
        }
      }
    }

    function recordActivity() {
      if (logoutStarted) return;

      const activityAt = Date.now();
      if (isSessionIdle(lastActivityAt, activityAt)) {
        void endSession();
        return;
      }

      lastActivityAt = activityAt;
      localStorage.setItem(SESSION_LAST_ACTIVITY_KEY, String(activityAt));
      scheduleExpiry();
      void refreshSession();
    }

    function onStorage(event: StorageEvent) {
      if (event.key !== SESSION_LAST_ACTIVITY_KEY) return;
      if (event.newValue === null) {
        void endSession();
        return;
      }

      const sharedActivityAt = Number(event.newValue);
      if (Number.isFinite(sharedActivityAt) && sharedActivityAt > lastActivityAt) {
        lastActivityAt = sharedActivityAt;
        scheduleExpiry();
      }
    }

    function onVisible() {
      if (document.visibilityState === "visible") {
        recordActivity();
      } else {
        flushPendingActivity();
      }
    }

    function flushPendingActivity() {
      if (lastActivityAt > lastRefreshAttemptAt) {
        void refreshSession(true);
      }
    }

    if (storedActivityIsExpired) {
      void endSession();
    } else {
      scheduleExpiry();
      void refreshSession(true);
    }

    for (const eventName of ACTIVITY_EVENTS) {
      window.addEventListener(eventName, recordActivity, { passive: true });
    }
    window.addEventListener("focus", recordActivity);
    window.addEventListener("pagehide", flushPendingActivity);
    window.addEventListener("storage", onStorage);
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      if (expiryTimer) clearTimeout(expiryTimer);
      if (refreshTimer) clearTimeout(refreshTimer);
      for (const eventName of ACTIVITY_EVENTS) {
        window.removeEventListener(eventName, recordActivity);
      }
      window.removeEventListener("focus", recordActivity);
      window.removeEventListener("pagehide", flushPendingActivity);
      window.removeEventListener("storage", onStorage);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [router]);

  return null;
}
