export const APPLICATION_TIME_ZONE =
  process.env.APPLICATION_TIME_ZONE ?? "America/Sao_Paulo";

export type HealthDateGroup =
  | "ATRASADO"
  | "HOJE"
  | "PROXIMOS_7_DIAS"
  | "PROXIMOS_30_DIAS"
  | "FUTURO";

type DateParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
};

const applicationFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: APPLICATION_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});

function applicationParts(date: Date): DateParts {
  const values = new Map(
    applicationFormatter
      .formatToParts(date)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, Number(part.value)]),
  );

  return {
    year: values.get("year") ?? 0,
    month: values.get("month") ?? 0,
    day: values.get("day") ?? 0,
    hour: values.get("hour") ?? 0,
    minute: values.get("minute") ?? 0,
    second: values.get("second") ?? 0,
  };
}

function partsAsUtc(parts: DateParts): number {
  return Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second,
  );
}

function applicationDateOrdinal(date: Date): number {
  const parts = applicationParts(date);
  return Date.UTC(parts.year, parts.month - 1, parts.day) / 86_400_000;
}

function localMidnightFromOrdinal(ordinal: number): Date {
  const date = new Date(ordinal * 86_400_000);
  const desired: DateParts = {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate(),
    hour: 0,
    minute: 0,
    second: 0,
  };
  let timestamp = partsAsUtc(desired);

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const difference = partsAsUtc(desired) - partsAsUtc(applicationParts(new Date(timestamp)));
    if (difference === 0) {
      break;
    }
    timestamp += difference;
  }

  return new Date(timestamp);
}

export function getApplicationDayBounds(reference = new Date()): {
  start: Date;
  endExclusive: Date;
} {
  const ordinal = applicationDateOrdinal(reference);
  return {
    start: localMidnightFromOrdinal(ordinal),
    endExclusive: localMidnightFromOrdinal(ordinal + 1),
  };
}

export function getUpcomingRange(
  days: 7 | 30,
  reference = new Date(),
): { start: Date; endExclusive: Date } {
  const ordinal = applicationDateOrdinal(reference);
  return {
    start: localMidnightFromOrdinal(ordinal + 1),
    endExclusive: localMidnightFromOrdinal(ordinal + days + 1),
  };
}

function dayDifference(date: Date, reference: Date): number {
  return applicationDateOrdinal(date) - applicationDateOrdinal(reference);
}

export function classifyHealthDate(
  date: Date,
  reference = new Date(),
): HealthDateGroup {
  const difference = dayDifference(date, reference);

  if (difference < 0) return "ATRASADO";
  if (difference === 0) return "HOJE";
  if (difference <= 7) return "PROXIMOS_7_DIAS";
  if (difference <= 30) return "PROXIMOS_30_DIAS";
  return "FUTURO";
}

export function isOverdue(date: Date, reference = new Date()): boolean {
  return dayDifference(date, reference) < 0;
}

export function isToday(date: Date, reference = new Date()): boolean {
  return dayDifference(date, reference) === 0;
}

export function isInNext7Days(date: Date, reference = new Date()): boolean {
  const difference = dayDifference(date, reference);
  return difference >= 1 && difference <= 7;
}

export function isInNext30Days(date: Date, reference = new Date()): boolean {
  const difference = dayDifference(date, reference);
  return difference >= 1 && difference <= 30;
}
