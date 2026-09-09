import mongoose, { Schema, type Model } from "mongoose";

export const EVENT_MODES = ["online", "offline", "hybrid"] as const;
export type EventMode = (typeof EVENT_MODES)[number];

export interface IEvent {
  title: string;
  slug: string;
  description: string;
  overview: string;
  image: string;
  venue: string;
  location: string;
  date: string;
  time: string;
  mode: EventMode;
  audience: string;
  agenda: string[];
  organizer: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

const REQUIRED_STRING_FIELDS = [
  "title",
  "description",
  "overview",
  "image",
  "venue",
  "location",
  "date",
  "time",
  "mode",
  "audience",
  "organizer",
] as const;

const MONTHS: Record<string, number> = {
  jan: 1,
  january: 1,
  feb: 2,
  february: 2,
  mar: 3,
  march: 3,
  apr: 4,
  april: 4,
  may: 5,
  jun: 6,
  june: 6,
  jul: 7,
  july: 7,
  aug: 8,
  august: 8,
  sep: 9,
  sept: 9,
  september: 9,
  oct: 10,
  october: 10,
  nov: 11,
  november: 11,
  dec: 12,
  december: 12,
};

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

function toIsoDate(year: number, month: number, day: number): string {
  const utc = new Date(Date.UTC(year, month - 1, day));
  if (
    utc.getUTCFullYear() !== year ||
    utc.getUTCMonth() !== month - 1 ||
    utc.getUTCDate() !== day
  ) {
    throw new Error(`Invalid calendar date: ${year}-${pad(month)}-${pad(day)}`);
  }

  return `${year}-${pad(month)}-${pad(day)}`;
}

function parseMonth(value: string): number {
  const month = MONTHS[value.toLowerCase()];
  if (!month) {
    throw new Error(`Unrecognized month: ${value}`);
  }

  return month;
}

/** Normalize a date string to ISO 8601 (`YYYY-MM-DD` or `YYYY-MM-DD/YYYY-MM-DD`). */
function normalizeDate(value: string): string {
  const input = value.trim();

  const isoDate = input.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoDate) {
    return toIsoDate(Number(isoDate[1]), Number(isoDate[2]), Number(isoDate[3]));
  }

  const isoInterval = input.match(/^(\d{4}-\d{2}-\d{2})\/(\d{4}-\d{2}-\d{2})$/);
  if (isoInterval) {
    const start = normalizeDate(isoInterval[1]);
    const end = normalizeDate(isoInterval[2]);
    if (start > end) {
      throw new Error(`Date range start must be on or before end: ${input}`);
    }
    return `${start}/${end}`;
  }

  const namedRange = input.match(
    /^([A-Za-z]+)\s+(\d{1,2})\s*[-–—]\s*(?:([A-Za-z]+)\s+)?(\d{1,2}),\s*(\d{4})$/,
  );
  if (namedRange) {
    const startMonth = parseMonth(namedRange[1]);
    const endMonth = namedRange[3] ? parseMonth(namedRange[3]) : startMonth;
    const year = Number(namedRange[5]);
    const start = toIsoDate(year, startMonth, Number(namedRange[2]));
    const end = toIsoDate(year, endMonth, Number(namedRange[4]));
    if (start > end) {
      throw new Error(`Date range start must be on or before end: ${input}`);
    }
    return start === end ? start : `${start}/${end}`;
  }

  const namedSingle = input.match(/^([A-Za-z]+)\s+(\d{1,2}),\s*(\d{4})$/);
  if (namedSingle) {
    return toIsoDate(
      Number(namedSingle[3]),
      parseMonth(namedSingle[1]),
      Number(namedSingle[2]),
    );
  }

  throw new Error(
    `Invalid date "${value}". Use ISO (YYYY-MM-DD) or a parseable date such as "March 15, 2024".`,
  );
}

function parseClock(part: string): string {
  const twelveHour = part.match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)$/i);
  if (twelveHour) {
    let hours = Number(twelveHour[1]);
    const minutes = Number(twelveHour[2] ?? "0");
    const period = twelveHour[3].toUpperCase();

    if (hours < 1 || hours > 12 || minutes > 59) {
      throw new Error(`Invalid time: ${part}`);
    }

    if (period === "AM") {
      hours = hours === 12 ? 0 : hours;
    } else {
      hours = hours === 12 ? 12 : hours + 12;
    }

    return `${pad(hours)}:${pad(minutes)}`;
  }

  const twentyFour = part.match(/^(\d{1,2}):(\d{2})$/);
  if (twentyFour) {
    const hours = Number(twentyFour[1]);
    const minutes = Number(twentyFour[2]);
    if (hours > 23 || minutes > 59) {
      throw new Error(`Invalid time: ${part}`);
    }
    return `${pad(hours)}:${pad(minutes)}`;
  }

  throw new Error(`Unrecognized time format: ${part}`);
}

/** Store clock times as `HH:mm` or `HH:mm-HH:mm`; durations as `48h`. */
function normalizeTime(value: string): string {
  const input = value.trim().replace(/\s+/g, " ");

  const duration = input.match(/^(\d+)\s*(hours?|hrs?|h)$/i);
  if (duration) {
    return `${duration[1]}h`;
  }

  const range = input.split(/\s*(?:-|–|—|to)\s*/i);
  if (range.length === 2 && range[0] && range[1]) {
    return `${parseClock(range[0])}-${parseClock(range[1])}`;
  }

  return parseClock(input);
}

/** URL-friendly slug: lowercase, hyphen-separated, no punctuation. */
function slugify(title: string): string {
  return title
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function assertNonEmptyStringArray(field: string, values: unknown): asserts values is string[] {
  if (
    !Array.isArray(values) ||
    values.length === 0 ||
    values.some((item) => !isNonEmptyString(item))
  ) {
    throw new Error(`Event.${field} must be a non-empty array of strings`);
  }
}

const eventSchema = new Schema<IEvent>(
  {
    title: { type: String, required: true, trim: true, minlength: 1 },
    slug: { type: String, unique: true, lowercase: true, trim: true, index: true },
    description: { type: String, required: true, trim: true, minlength: 1 },
    overview: { type: String, required: true, trim: true, minlength: 1 },
    image: { type: String, required: true, trim: true, minlength: 1 },
    venue: { type: String, required: true, trim: true, minlength: 1 },
    location: { type: String, required: true, trim: true, minlength: 1 },
    date: { type: String, required: true, trim: true, minlength: 1 },
    time: { type: String, required: true, trim: true, minlength: 1 },
    mode: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      enum: EVENT_MODES,
    },
    audience: { type: String, required: true, trim: true, minlength: 1 },
    agenda: {
      type: [String],
      required: true,
      validate: {
        validator(items: string[]) {
          return items.length > 0 && items.every((item) => item.trim().length > 0);
        },
        message: "agenda must be a non-empty array of strings",
      },
    },
    organizer: { type: String, required: true, trim: true, minlength: 1 },
    tags: {
      type: [String],
      required: true,
      validate: {
        validator(items: string[]) {
          return items.length > 0 && items.every((item) => item.trim().length > 0);
        },
        message: "tags must be a non-empty array of strings",
      },
    },
  },
  { timestamps: true },
);

eventSchema.pre("save", function () {
  for (const field of REQUIRED_STRING_FIELDS) {
    if (!isNonEmptyString(this[field])) {
      throw new Error(`Event.${field} is required and cannot be empty`);
    }
  }

  assertNonEmptyStringArray("agenda", this.agenda);
  assertNonEmptyStringArray("tags", this.tags);
  this.agenda = this.agenda.map((item) => item.trim());
  this.tags = this.tags.map((tag) => tag.trim());

  // Rebuild the slug only for new docs or when the title actually changes.
  if (this.isNew || this.isModified("title") || !this.slug) {
    const slug = slugify(this.title);
    if (!slug) {
      throw new Error("Unable to generate a URL-friendly slug from the given title");
    }
    this.slug = slug;
  }

  if (this.isNew || this.isModified("date")) {
    this.date = normalizeDate(this.date);
  }

  if (this.isNew || this.isModified("time")) {
    this.time = normalizeTime(this.time);
  }
});

export const Event: Model<IEvent> =
  (mongoose.models.Event as Model<IEvent> | undefined) ??
  mongoose.model<IEvent>("Event", eventSchema);
