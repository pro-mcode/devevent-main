import { Schema, model, models, Types, Document } from "mongoose";

export interface BookingAttrs {
  eventId: Types.ObjectId;
  slug: string;
  email: string;
}

export interface BookingDocument extends BookingAttrs, Document {
  createdAt: Date;
  updatedAt: Date;
}

const bookingSchema = new Schema<BookingDocument>(
  {
    eventId: {
      type: Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },
    slug: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate bookings
bookingSchema.index({ eventId: 1, email: 1 }, { unique: true });

const Booking =
  models.Booking || model<BookingDocument>("Booking", bookingSchema);

export default Booking;
