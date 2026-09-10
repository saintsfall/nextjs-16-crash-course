import mongoose, { Schema, type Model, type Types } from "mongoose";

import { Event } from "./event.model";

export interface IBooking {
  eventId: Types.ObjectId;
  slug: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

const EMAIL_REGEX =
  /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/;

const bookingSchema = new Schema<IBooking>(
  {
    eventId: {
      type: Schema.Types.ObjectId,
      ref: "Event",
      required: true,
      index: true,
    },
    slug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      minlength: 1,
      match: [EMAIL_REGEX, "Please provide a valid email address"],
    },
  },
  { timestamps: true },
);

bookingSchema.pre("save", async function () {
  const email = this.email.trim().toLowerCase();
  if (!EMAIL_REGEX.test(email)) {
    throw new Error(`Invalid email address: ${this.email}`);
  }
  this.email = email;

  const slug = this.slug?.trim().toLowerCase();
  if (!slug) {
    throw new Error("Booking.slug is required");
  }
  this.slug = slug;

  // Confirm the Event exists and that slug belongs to that event.
  const eventExists = await Event.exists({ _id: this.eventId, slug });
  if (!eventExists) {
    throw new Error(
      `Cannot save booking: Event ${String(this.eventId)} with slug "${slug}" does not exist`,
    );
  }
});

export const Booking: Model<IBooking> =
  (mongoose.models.Booking as Model<IBooking> | undefined) ??
  mongoose.model<IBooking>("Booking", bookingSchema);
