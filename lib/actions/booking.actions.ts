'use server';

import dbConnect from "@/lib/mongodb";
import {Booking, IBooking} from "@/database/booking.model";

type CreateBookingInput = {
    eventId: string;
    slug: string;
    email: string;
}

export async function createBooking({ eventId, slug, email }: CreateBookingInput) {
    try {
        await dbConnect()

        const booking: IBooking = await Booking.create({ eventId, slug, email });

        return { success: true };
    } catch (err) {
        console.error("create booking failed", err);

        return { success: false };
    }
}
