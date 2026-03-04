/**
 * Visitor tracking for smart subscribe toast behavior.
 * Tracks visit counts, dismiss timestamps, and subscription status.
 */

const STORAGE_KEYS = {
  visitCount: "learning-log-visit-count",
  lastVisit: "learning-log-last-visit",
  dismissed: "learning-log-subscribe-dismissed",
  subscribed: "learning-log-subscribed",
} as const;

const COOLDOWN_DAYS = 7;
const SESSION_THRESHOLD_MS = 30 * 60 * 1000; // 30 minutes = new session

export type VisitorType = "first-time" | "returning" | "frequent";

export interface VisitorState {
  visitCount: number;
  visitorType: VisitorType;
  canShowToast: boolean;
  isSubscribed: boolean;
  isDismissedRecently: boolean;
}

function safeGetItem(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSetItem(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Fail silently in strict privacy contexts
  }
}

/**
 * Get current visitor state without side effects
 */
export function getVisitorState(): VisitorState {
  const visitCount = parseInt(safeGetItem(STORAGE_KEYS.visitCount) || "0", 10);
  const dismissedAt = safeGetItem(STORAGE_KEYS.dismissed);
  const isSubscribed = safeGetItem(STORAGE_KEYS.subscribed) === "true";

  // Check if dismissed within cooldown period
  let isDismissedRecently = false;
  if (dismissedAt) {
    const dismissedDate = new Date(dismissedAt);
    const daysSinceDismiss =
      (Date.now() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24);
    isDismissedRecently = daysSinceDismiss < COOLDOWN_DAYS;
  }

  // Determine visitor type
  let visitorType: VisitorType;
  if (visitCount <= 1) {
    visitorType = "first-time";
  } else if (visitCount <= 3) {
    visitorType = "returning";
  } else {
    visitorType = "frequent";
  }

  const canShowToast = !isSubscribed && !isDismissedRecently;

  return {
    visitCount,
    visitorType,
    canShowToast,
    isSubscribed,
    isDismissedRecently,
  };
}

/**
 * Track a new page visit. Call once per session start.
 */
export function trackVisit(): void {
  const lastVisit = safeGetItem(STORAGE_KEYS.lastVisit);
  const now = Date.now();

  // Only increment if this is a new session (>30min since last visit)
  if (!lastVisit || now - parseInt(lastVisit, 10) > SESSION_THRESHOLD_MS) {
    const currentCount = parseInt(
      safeGetItem(STORAGE_KEYS.visitCount) || "0",
      10
    );
    safeSetItem(STORAGE_KEYS.visitCount, String(currentCount + 1));
  }

  safeSetItem(STORAGE_KEYS.lastVisit, String(now));
}

/**
 * Mark the toast as dismissed (starts cooldown)
 */
export function markDismissed(): void {
  safeSetItem(STORAGE_KEYS.dismissed, new Date().toISOString());
}

/**
 * Mark user as subscribed (never show toast again)
 */
export function markSubscribed(): void {
  safeSetItem(STORAGE_KEYS.subscribed, "true");
}

/**
 * Get copy variant based on visitor type
 */
export function getToastCopy(visitorType: VisitorType): {
  heading: string;
  body: string;
  buttonText: string;
  dismissText: string;
} {
  switch (visitorType) {
    case "first-time":
      return {
        heading: "Hey, glad you stopped by.",
        body: "I send occasional updates when I ship something or learn something worth sharing. No schedule, no spam.",
        buttonText: "Subscribe",
        dismissText: "Maybe later",
      };
    case "returning":
      return {
        heading: "You're back — that means something to me.",
        body: "Want updates when I post? I'll keep it short and real.",
        buttonText: "Subscribe",
        dismissText: "Not yet",
      };
    case "frequent":
      return {
        heading: "I've noticed you drop by often.",
        body: "If you want, I can send you updates directly — no need to keep checking back.",
        buttonText: "Stay in the loop",
        dismissText: "I prefer visiting",
      };
  }
}
