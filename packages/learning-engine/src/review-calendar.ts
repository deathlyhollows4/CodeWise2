import { Temporal } from "@js-temporal/polyfill";
export const REVIEW_SCHEDULE_VERSION = "review-calendar-1";
export const REVIEW_INTERVAL_DAYS = [1, 3, 7, 14, 30] as const;
/** Calendar dates in the saved IANA zone, retaining wall-clock time.
 * Temporal compatible disambiguation advances nonexistent times through a gap
 * and uses the earlier repeated time. No host/global timezone is changed. */
export function calendarReviewDue(
  at: string,
  reviewCount: number,
  timezone = "UTC",
) {
  const index = Math.max(
    0,
    Math.min(Math.trunc(reviewCount), REVIEW_INTERVAL_DAYS.length - 1),
  );
  return Temporal.Instant.from(at)
    .toZonedDateTimeISO(timezone)
    .add({ days: REVIEW_INTERVAL_DAYS[index] })
    .toInstant()
    .toString({ fractionalSecondDigits: 3 });
}
