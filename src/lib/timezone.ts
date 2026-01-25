/**
 * Timezone Utility for Frontend
 *
 * Enforces America/Toronto (IANA) as the single source of truth for all
 * user-facing time displays in the admin dashboard.
 *
 * @module timezone
 */

/**
 * The canonical timezone for all business operations
 */
export const RESTAURANT_TIMEZONE = "America/Toronto";

/**
 * Get the current date/time in Toronto timezone
 *
 * @returns Date object representing current time in Toronto
 */
export function getNowInToronto(): Date {
  return new Date(
    new Date().toLocaleString("en-US", { timeZone: RESTAURANT_TIMEZONE }),
  );
}

/**
 * Format current Toronto date and time with weekday
 * Used in dashboard header clock
 *
 * @returns Formatted string like "Monday, 1/21/2026, 2:30:45 PM"
 */
export function formatCurrentDateTimeInToronto(): string {
  return new Date().toLocaleString("en-US", {
    timeZone: RESTAURANT_TIMEZONE,
    weekday: "long",
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}
