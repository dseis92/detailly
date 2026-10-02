export interface AvailabilityWindow {
  readonly weekday: number;
  readonly startLocal: string;
  readonly endLocal: string;
  readonly timezone: string;
  readonly slotIntervalMinutes: number;
  readonly capacity: number;
}

export interface OccupiedHold {
  readonly startsAt: Date;
  readonly endsAt: Date;
  readonly expiresAt: Date;
  readonly status: "active" | "converted" | "released";
}

export interface BlockedInterval {
  readonly startsAt: Date;
  readonly endsAt: Date;
}

export interface SlotSearchInput {
  readonly rangeStart: Date;
  readonly rangeEnd: Date;
  readonly durationMinutes: number;
  readonly now?: Date;
  readonly windows: readonly AvailabilityWindow[];
  readonly holds?: readonly OccupiedHold[];
  readonly blockedIntervals?: readonly BlockedInterval[];
}

export interface AvailableSlot {
  readonly startsAt: Date;
  readonly endsAt: Date;
  readonly timezone: string;
}

export function searchAvailableSlots(input: SlotSearchInput): AvailableSlot[] {
  assertSearchInput(input);
  const results: AvailableSlot[] = [];
  const holds = input.holds ?? [];
  const blockedIntervals = input.blockedIntervals ?? [];
  const now = input.now ?? new Date();

  for (
    let date = startOfUtcDay(input.rangeStart);
    date <= input.rangeEnd;
    date = addUtcDays(date, 1)
  ) {
    for (const window of input.windows) {
      const localDate = formatDateInTimezone(date, window.timezone);
      const localWeekday = weekdayInTimezone(date, window.timezone);
      if (localWeekday !== window.weekday) continue;

      const windowStart = localDateTimeToUtc(
        `${localDate}T${window.startLocal}`,
        window.timezone
      );
      const windowEnd = localDateTimeToUtc(
        `${localDate}T${window.endLocal}`,
        window.timezone
      );
      if (!windowStart || !windowEnd || windowEnd <= windowStart) continue;

      const occupied = holds.filter(
        (hold) =>
          hold.status === "active" &&
          hold.expiresAt > now &&
          hold.endsAt > windowStart &&
          hold.startsAt < windowEnd
      );
      const stepMs = window.slotIntervalMinutes * 60_000;
      const serviceMs = input.durationMinutes * 60_000;

      for (
        let startsAt = windowStart.getTime();
        startsAt + serviceMs <= windowEnd.getTime();
        startsAt += stepMs
      ) {
        const endsAt = new Date(startsAt + serviceMs);
        if (endsAt <= input.rangeStart || new Date(startsAt) >= input.rangeEnd)
          continue;
        if (
          blockedIntervals.some(
            (block) =>
              block.endsAt > new Date(startsAt) && block.startsAt < endsAt
          )
        )
          continue;
        const conflicts = occupied.filter(
          (hold) => hold.endsAt > new Date(startsAt) && hold.startsAt < endsAt
        ).length;
        if (conflicts < window.capacity) {
          results.push({
            startsAt: new Date(startsAt),
            endsAt,
            timezone: window.timezone
          });
        }
      }
    }
  }

  return results.sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
}

/** Converts a local wall-clock value to an instant, rejecting nonexistent DST times. */
export function localDateTimeToUtc(
  localDateTime: string,
  timezone: string
): Date | undefined {
  const match = /^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2})$/.exec(localDateTime);
  if (!match) throw new Error("Local date-time must use YYYY-MM-DDTHH:MM.");
  const date = match[1];
  const hour = match[2];
  const minute = match[3];
  if (!date || !hour || !minute)
    throw new Error("Local date-time is incomplete.");
  const naive = Date.UTC(
    Number(date.slice(0, 4)),
    Number(date.slice(5, 7)) - 1,
    Number(date.slice(8, 10)),
    Number(hour),
    Number(minute)
  );
  const candidate = new Date(
    naive - timezoneOffsetMs(new Date(naive), timezone)
  );
  return formatLocalDateTime(candidate, timezone) === localDateTime
    ? candidate
    : undefined;
}

function assertSearchInput(input: SlotSearchInput): void {
  if (input.rangeEnd <= input.rangeStart)
    throw new Error("Search range is invalid.");
  if (input.durationMinutes <= 0) throw new Error("Duration must be positive.");
  for (const window of input.windows) {
    if (window.weekday < 0 || window.weekday > 6)
      throw new Error("Weekday must be between 0 and 6.");
    if (window.capacity < 1 || window.slotIntervalMinutes < 1)
      throw new Error("Capacity and slot interval must be positive.");
  }
}

function timezoneOffsetMs(instant: Date, timezone: string): number {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23"
  }).formatToParts(instant);
  const values = Object.fromEntries(
    parts.map((part) => [part.type, part.value])
  );
  const asUtc = Date.UTC(
    Number(values.year),
    Number(values.month) - 1,
    Number(values.day),
    Number(values.hour),
    Number(values.minute),
    Number(values.second)
  );
  return asUtc - instant.getTime();
}

function formatLocalDateTime(instant: Date, timezone: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23"
  }).formatToParts(instant);
  const values = Object.fromEntries(
    parts.map((part) => [part.type, part.value])
  );
  return `${values.year}-${values.month}-${values.day}T${values.hour}:${values.minute}`;
}

function formatDateInTimezone(instant: Date, timezone: string): string {
  return formatLocalDateTime(instant, timezone).slice(0, 10);
}

function weekdayInTimezone(instant: Date, timezone: string): number {
  const weekday = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    weekday: "short"
  }).format(instant);
  return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(weekday);
}

function startOfUtcDay(value: Date): Date {
  return new Date(
    Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate())
  );
}

function addUtcDays(value: Date, days: number): Date {
  const next = new Date(value);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}
