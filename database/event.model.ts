// import { Schema, model, models, Document, Model } from "mongoose";

// /**
//  * TypeScript interface describing the Event document shape.
//  */
// export interface EventAttrs {
//   title: string;
//   slug: string;
//   description: string;
//   overview: string;
//   image: string;
//   venue: string;
//   location: string;
//   date: string; // Stored as ISO-8601 string
//   time: string; // Stored as normalized HH:mm (24-hour) string
//   mode: string;
//   audience: string;
//   agenda: string[];
//   organizer: string;
//   tags: string[];
// }

// /**
//  * Mongoose document type for Event, including timestamps.
//  */
// export interface EventDocument extends EventAttrs, Document {
//   createdAt: Date;
//   updatedAt: Date;
// }

// export type EventModel = Model<EventDocument>;
// /**
//  * Helper to create a URL-friendly slug from a title.
//  */
// const slugify = (title: string): string => {
//   return title
//     .toLowerCase()
//     .trim()
//     .toLowerCase()
//     .replace(/[^a-z0-9\s-]/g, "") // remove invalid chars
//     .replace(/\s+/g, "-") // collapse whitespace to dashes
//     .replace(/-+/g, "-") // collapse multiple dashes
//     .replace(/^-|-$/g, ""); // trim leading/trailing dashes
// };

// /**
//  * Ensures a string is a valid date and returns an ISO-8601 string.
//  * Throws if the input cannot be parsed to a valid Date.
//  */
// const normalizeDateToISO = (value: string): string => {
//   // Require ISO-8601 format (YYYY-MM-DD or full ISO string)
//   const isoRegex = /^\d{4}-\d{2}-\d{2}(T[\d:.\-+Z]+)?$/;
//   if (!isoRegex.test(value.trim())) {
//     throw new Error(
//       "Invalid date format for Event.date, expected ISO-8601 (YYYY-MM-DD)"
//     );
//   }
//   const parsed = new Date(value);
//   if (Number.isNaN(parsed.getTime())) {
//     throw new Error("Invalid date value for Event.date");
//   }
//   return parsed.toISOString();
// };

// /**
//  * Normalize time to HH:mm (24-hour) format and validate.
//  */
// const normalizeTime = (value: string): string => {
//   const trimmed = value.trim();

//   // Accepts H:MM or HH:MM in 24-hour format
//   const match = trimmed.match(/^(\d{1,2}):(\d{2})$/);
//   if (!match) {
//     throw new Error("Invalid time format for Event.time, expected HH:mm");
//   }

//   const hours = Number(match[1]);
//   const minutes = Number(match[2]);

//   if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
//     throw new Error("Invalid time value for Event.time");
//   }

//   const normalizedHours = hours.toString().padStart(2, "0");
//   const normalizedMinutes = minutes.toString().padStart(2, "0");

//   return `${normalizedHours}:${normalizedMinutes}`;
// };

// const eventSchema = new Schema<EventDocument, EventModel>(
//   {
//     title: {
//       type: String,
//       required: true,
//       trim: true,
//     },
//     slug: {
//       type: String,
//       unique: true,
//       required: true,
//       trim: true,
//     },
//     description: {
//       type: String,
//       required: true,
//       trim: true,
//     },
//     overview: {
//       type: String,
//       required: true,
//       trim: true,
//     },
//     image: {
//       type: String,
//       required: true,
//       trim: true,
//     },
//     venue: {
//       type: String,
//       required: true,
//       trim: true,
//     },
//     location: {
//       type: String,
//       required: true,
//       trim: true,
//     },
//     date: {
//       type: String,
//       required: true,
//     },
//     time: {
//       type: String,
//       required: true,
//     },
//     mode: {
//       type: String,
//       required: true,
//       trim: true,
//     },
//     audience: {
//       type: String,
//       required: true,
//       trim: true,
//     },
//     agenda: {
//       type: [String],
//       required: true,
//       validate: {
//         validator: (arr: string[]): boolean =>
//           Array.isArray(arr) && arr.length > 0,
//         message: "Event.agenda must contain at least one item",
//       },
//     },
//     organizer: {
//       type: String,
//       required: true,
//       trim: true,
//     },
//     tags: {
//       type: [String],
//       required: true,
//       validate: {
//         validator: (arr: string[]): boolean =>
//           Array.isArray(arr) && arr.length > 0,
//         message: "Event.tags must contain at least one tag",
//       },
//     },
//   },
//   {
//     timestamps: true,
//   }
// );

// // Enforce unique index on slug at the database level.
// eventSchema.index({ slug: 1 }, { unique: true });

// /**
//  * Pre-save hook that:
//  * - Generates a URL-friendly slug from the title when creating or when title changes.
//  * - Ensures slug uniqueness by checking for existing slugs and appending a numeric suffix.
//  * - Normalizes date to ISO-8601 string.
//  * - Normalizes time to HH:mm (24-hour) format.
//  * - Performs basic non-empty validation for required string fields.
//  */
// eventSchema.pre<EventDocument>("save", async function preSave() {
//   // Basic required field validation beyond `required: true` to ensure non-empty strings.
//   const requiredStringFields: (keyof EventAttrs)[] = [
//     "title",
//     "description",
//     "overview",
//     "image",
//     "venue",
//     "location",
//     "mode",
//     "audience",
//     "organizer",
//   ];

//   for (const field of requiredStringFields) {
//     const value = this[field];
//     if (typeof value !== "string" || value.trim().length === 0) {
//       throw new Error(`Event.${field} is required and cannot be empty`);
//     }
//   }

//   // Ensure agenda and tags are non-empty arrays.
//   if (!Array.isArray(this.agenda) || this.agenda.length === 0) {
//     throw new Error("Event.agenda must contain at least one item");
//   }

//   if (!Array.isArray(this.tags) || this.tags.length === 0) {
//     throw new Error("Event.tags must contain at least one tag");
//   }

//   // Generate or update slug only if title is new or has been modified.
//   if (this.isNew || this.isModified("title")) {
//     const baseSlug = slugify(this.title);

//     // Build a regex that matches the base slug or base-slug-N, where N is a positive integer.
//     const slugRegex = new RegExp(`^${baseSlug}(?:-\\d+)?$`);

//     // Use this.constructor so we don't depend on the exported Event symbol.
//     const EventModel = this.constructor as EventModel;

//     const existing = await EventModel.find({ slug: slugRegex })
//       .select("slug")
//       .lean();

//     if (existing.length === 0) {
//       // No conflicts, use the base slug.
//       this.slug = baseSlug;
//     } else {
//       // Collect all numeric suffixes that already exist.
//       const suffixes = existing
//         .map((doc) => {
//           const match = (doc as { slug?: string }).slug?.match(/-(\d+)$/);
//           return match ? Number(match[1]) : 0;
//         })
//         .filter((n) => !Number.isNaN(n));

//       const maxSuffix = suffixes.length > 0 ? Math.max(...suffixes) : 0;
//       const nextSuffix = maxSuffix + 1;

//       this.slug = `${baseSlug}-${nextSuffix}`;
//     }
//   }

//   // Normalize date and time into consistent formats.
//   if (this.isModified("date")) {
//     this.date = normalizeDateToISO(this.date);
//   }

//   if (this.isModified("time")) {
//     this.time = normalizeTime(this.time);
//   }
//   // No need to call next(); returning/finishing is enough.
// });

// export const Event: EventModel =
//   (models.Event as EventModel | undefined) ||
//   model<EventDocument, EventModel>("Event", eventSchema);

// export default Event;

import { Schema, model, models, Document } from "mongoose";

// TypeScript interface for Event document
export interface IEvent extends Document {
  title: string;
  slug: string;
  description: string;
  overview: string;
  image: string;
  venue: string;
  location: string;
  date: string;
  time: string;
  mode: string;
  audience: string;
  agenda: string[];
  organizer: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

const EventSchema = new Schema<IEvent>(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: [100, "Title cannot exceed 100 characters"],
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
      maxlength: [1000, "Description cannot exceed 1000 characters"],
    },
    overview: {
      type: String,
      required: [true, "Overview is required"],
      trim: true,
      maxlength: [500, "Overview cannot exceed 500 characters"],
    },
    image: {
      type: String,
      required: [true, "Image URL is required"],
      trim: true,
    },
    venue: {
      type: String,
      required: [true, "Venue is required"],
      trim: true,
    },
    location: {
      type: String,
      required: [true, "Location is required"],
      trim: true,
    },
    date: {
      type: String,
      required: [true, "Date is required"],
    },
    time: {
      type: String,
      required: [true, "Time is required"],
    },
    mode: {
      type: String,
      required: [true, "Mode is required"],
      enum: {
        values: ["online", "offline", "hybrid"],
        message: "Mode must be either online, offline, or hybrid",
      },
    },
    audience: {
      type: String,
      required: [true, "Audience is required"],
      trim: true,
    },
    agenda: {
      type: [String],
      required: [true, "Agenda is required"],
      validate: {
        validator: (v: string[]) => v.length > 0,
        message: "At least one agenda item is required",
      },
    },
    organizer: {
      type: String,
      required: [true, "Organizer is required"],
      trim: true,
    },
    tags: {
      type: [String],
      required: [true, "Tags are required"],
      validate: {
        validator: (v: string[]) => v.length > 0,
        message: "At least one tag is required",
      },
    },
  },
  {
    timestamps: true, // Auto-generate createdAt and updatedAt
  }
);

// Pre-save hook for slug generation and data normalization
EventSchema.pre("save", function () {
  const event = this as IEvent;

  // Generate slug only if title changed or document is new
  if (event.isModified("title") || event.isNew) {
    event.slug = generateSlug(event.title);
  }

  // Normalize date to ISO format if it's not already
  if (event.isModified("date")) {
    event.date = normalizeDate(event.date);
  }

  // Normalize time format (HH:MM)
  if (event.isModified("time")) {
    event.time = normalizeTime(event.time);
  }

  // next();
});

// Helper function to generate URL-friendly slug
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "") // Remove special characters
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-") // Replace multiple hyphens with single hyphen
    .replace(/^-|-$/g, ""); // Remove leading/trailing hyphens
}

// Helper function to normalize date to ISO format
function normalizeDate(dateString: string): string {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    throw new Error("Invalid date format");
  }
  return date.toISOString().split("T")[0]; // Return YYYY-MM-DD format
}

// Helper function to normalize time format
function normalizeTime(timeString: string): string {
  // Handle various time formats and convert to HH:MM (24-hour format)
  const timeRegex = /^(\d{1,2}):(\d{2})(\s*(AM|PM))?$/i;
  const match = timeString.trim().match(timeRegex);

  if (!match) {
    throw new Error("Invalid time format. Use HH:MM or HH:MM AM/PM");
  }

  let hours = parseInt(match[1]);
  const minutes = match[2];
  const period = match[4]?.toUpperCase();

  if (period) {
    // Convert 12-hour to 24-hour format
    if (period === "PM" && hours !== 12) hours += 12;
    if (period === "AM" && hours === 12) hours = 0;
  }

  if (
    hours < 0 ||
    hours > 23 ||
    parseInt(minutes) < 0 ||
    parseInt(minutes) > 59
  ) {
    throw new Error("Invalid time values");
  }

  return `${hours.toString().padStart(2, "0")}:${minutes}`;
}

// Create unique index on slug for better performance
EventSchema.index({ slug: 1 }, { unique: true });

// Create compound index for common queries
EventSchema.index({ date: 1, mode: 1 });

const Event = models.Event || model<IEvent>("Event", EventSchema);

export default Event;
