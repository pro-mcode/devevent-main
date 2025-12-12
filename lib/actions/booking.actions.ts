"use server";

import Booking from "@/database/booking.model";
import connectDB from "@/lib/mongodb";

export const createBooking = async ({
  eventId,
  slug,
  email,
}: {
  eventId: string;
  slug: string;
  email: string;
}) => {
  try {
    if (!eventId || !slug || !email) {
      return { success: false, error: "Missing required fields" };
    }

    await connectDB();

    const normalizedEmail = email.toLowerCase();

    const existing = await Booking.findOne({
      eventId,
      email: normalizedEmail,
    });

    if (existing) {
      return { success: false, error: "Booking already exists" };
    }

    await Booking.create({
      eventId,
      slug,
      email: normalizedEmail,
    });

    return { success: true };
  } catch (error) {
    console.error("createBooking failed:", error);
    return {
      success: false,
      error: "Failed to create booking",
    };
  }
};
