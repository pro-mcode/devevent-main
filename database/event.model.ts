import { Schema, model, models, Document, Model } from "mongoose";

/**
 * TypeScript interface describing the Event document shape.
 */
export interface EventAttrs {
  title: string;
  slug: string;
  description: string;
  overview: string;
  image: string;
  venue: string;
  location: string;
  date: string; // Stored as ISO-8601 string
  time: string; // Stored as normalized HH:mm (24-hour) string
  mode: string;
  audience: string;
  agenda: string[];
  organizer: string;
  tags: string[];
}

/**
 * Mongoose document type for Event, including timestamps.
 */
export interface EventDocument extends EventAttrs, Document {
  createdAt: Date;
  updatedAt: Date;
}

export type EventModel = Model<EventDocument>;
/**
 * Helper to create a URL-friendly slug from a title.
 */
const slugify = (value: string): string => {
  return value
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "") // remove invalid chars
    .replace(/\s+/g, "-") // collapse whitespace to dashes
    .replace(/-+/g, "-") // collapse multiple dashes
    .replace(/^-|-$/g, ""); // trim leading/trailing dashes
};

/**
 * Ensures a string is a valid date and returns an ISO-8601 string.
 * Throws if the input cannot be parsed to a valid Date.
 */
const normalizeDateToISO = (value: string): string => {
  // Require ISO-8601 format (YYYY-MM-DD or full ISO string)
  const isoRegex = /^\d{4}-\d{2}-\d{2}(T[\d:.\-+Z]+)?$/;
  if (!isoRegex.test(value.trim())) {
    throw new Error(
      "Invalid date format for Event.date, expected ISO-8601 (YYYY-MM-DD)"
    );
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error("Invalid date value for Event.date");
  }
  return parsed.toISOString();
};

/**
 * Normalize time to HH:mm (24-hour) format and validate.
 */
const normalizeTime = (value: string): string => {
  const trimmed = value.trim();

  // Accepts H:MM or HH:MM in 24-hour format
  const match = trimmed.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) {
    throw new Error("Invalid time format for Event.time, expected HH:mm");
  }

  const hours = Number(match[1]);
  const minutes = Number(match[2]);

  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    throw new Error("Invalid time value for Event.time");
  }

  const normalizedHours = hours.toString().padStart(2, "0");
  const normalizedMinutes = minutes.toString().padStart(2, "0");

  return `${normalizedHours}:${normalizedMinutes}`;
};

const eventSchema = new Schema<EventDocument, EventModel>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      unique: true,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    overview: {
      type: String,
      required: true,
      trim: true,
    },
    image: {
      type: String,
      required: true,
      trim: true,
    },
    venue: {
      type: String,
      required: true,
      trim: true,
    },
    location: {
      type: String,
      required: true,
      trim: true,
    },
    date: {
      type: String,
      required: true,
    },
    time: {
      type: String,
      required: true,
    },
    mode: {
      type: String,
      required: true,
      trim: true,
    },
    audience: {
      type: String,
      required: true,
      trim: true,
    },
    agenda: {
      type: [String],
      required: true,
      validate: {
        validator: (arr: string[]): boolean =>
          Array.isArray(arr) && arr.length > 0,
        message: "Event.agenda must contain at least one item",
      },
    },
    organizer: {
      type: String,
      required: true,
      trim: true,
    },
    tags: {
      type: [String],
      required: true,
      validate: {
        validator: (arr: string[]): boolean =>
          Array.isArray(arr) && arr.length > 0,
        message: "Event.tags must contain at least one tag",
      },
    },
  },
  {
    timestamps: true,
  }
);

// Enforce unique index on slug at the database level.
eventSchema.index({ slug: 1 }, { unique: true });

/**
 * Pre-save hook that:
 * - Generates a URL-friendly slug from the title when creating or when title changes.
 * - Ensures slug uniqueness by checking for existing slugs and appending a numeric suffix.
 * - Normalizes date to ISO-8601 string.
 * - Normalizes time to HH:mm (24-hour) format.
 * - Performs basic non-empty validation for required string fields.
 */
eventSchema.pre<EventDocument>("save", async function preSave() {
  // Basic required field validation beyond `required: true` to ensure non-empty strings.
  const requiredStringFields: (keyof EventAttrs)[] = [
    "title",
    "description",
    "overview",
    "image",
    "venue",
    "location",
    "mode",
    "audience",
    "organizer",
  ];

  for (const field of requiredStringFields) {
    const value = this[field];
    if (typeof value !== "string" || value.trim().length === 0) {
      throw new Error(`Event.${field} is required and cannot be empty`);
    }
  }

  // Ensure agenda and tags are non-empty arrays.
  if (!Array.isArray(this.agenda) || this.agenda.length === 0) {
    throw new Error("Event.agenda must contain at least one item");
  }

  if (!Array.isArray(this.tags) || this.tags.length === 0) {
    throw new Error("Event.tags must contain at least one tag");
  }

  // Generate or update slug only if title is new or has been modified.
  if (this.isNew || this.isModified("title")) {
    const baseSlug = slugify(this.title);

    // Build a regex that matches the base slug or base-slug-N, where N is a positive integer.
    const slugRegex = new RegExp(`^${baseSlug}(?:-\\d+)?$`);

    // Use this.constructor so we don't depend on the exported Event symbol.
    const EventModel = this.constructor as EventModel;

    const existing = await EventModel.find({ slug: slugRegex })
      .select("slug")
      .lean();

    if (existing.length === 0) {
      // No conflicts, use the base slug.
      this.slug = baseSlug;
    } else {
      // Collect all numeric suffixes that already exist.
      const suffixes = existing
        .map((doc) => {
          const match = (doc as { slug?: string }).slug?.match(/-(\d+)$/);
          return match ? Number(match[1]) : 0;
        })
        .filter((n) => !Number.isNaN(n));

      const maxSuffix = suffixes.length > 0 ? Math.max(...suffixes) : 0;
      const nextSuffix = maxSuffix + 1;

      this.slug = `${baseSlug}-${nextSuffix}`;
    }
  }

  // Normalize date and time into consistent formats.
  if (this.isModified("date")) {
    this.date = normalizeDateToISO(this.date);
  }

  if (this.isModified("time")) {
    this.time = normalizeTime(this.time);
  }
  // No need to call next(); returning/finishing is enough.
});

export const Event: EventModel =
  (models.Event as EventModel | undefined) ||
  model<EventDocument, EventModel>("Event", eventSchema);

export default Event;
