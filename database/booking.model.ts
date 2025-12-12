import { Schema, model, models, Document, Model, Types } from "mongoose";
import { Event } from "./event.model";

/**
 * TypeScript interface describing the Booking attributes.
 */
export interface BookingAttrs {
  eventId: Types.ObjectId;
  email: string;
}

/**
 * Mongoose document type for Booking, including timestamps.
 */
export interface BookingDocument extends BookingAttrs, Document {
  createdAt: Date;
  updatedAt: Date;
}

export type BookingModel = Model<BookingDocument>;
/**
 * Basic email format validation using a conservative regex.
 */
const isValidEmail = (email: string): boolean => {
  // RFC 5322-compliant regexes are very complex; this is a pragmatic, strict-enough check.
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const bookingSchema = new Schema<BookingDocument, BookingModel>(
  {
    eventId: {
      type: Schema.Types.ObjectId,
      ref: "Event",
      required: true,
      index: true, // Index for faster lookups by event
    },
    email: {
      type: String,
      required: true,
      trim: true,
      validate: {
        validator: (value: string): boolean => isValidEmail(value),
        message: "Booking.email must be a valid email address",
      },
    },
  },
  {
    timestamps: true,
  }
);

/**
 * Pre-save hook that validates:
 * - The referenced Event exists for the given eventId.
 * - The email field is well-formed.
 */
bookingSchema.pre<BookingDocument>("save", async function preSave() {
  // Validate email format at the model layer as an extra safety net.
  if (!isValidEmail(this.email)) {
    throw new Error("Booking.email must be a valid email address");
  }

  // Verify that the referenced Event exists before saving the booking.
  const eventExists = await Event.exists({ _id: this.eventId });

  if (!eventExists) {
    throw new Error("Cannot create booking for a non-existent event");
  }

  // No need to call next(); just return/complete normally.
});

export const Booking: BookingModel =
  (models.Booking as BookingModel | undefined) ||
  model<BookingDocument, BookingModel>("Booking", bookingSchema);

export default Booking;
