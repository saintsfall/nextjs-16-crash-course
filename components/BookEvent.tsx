'use client'

import {useState} from "react";
import { SubmitEventHandler} from "react";
import {createBooking} from "@/lib/actions/booking.actions";
import posthog from "posthog-js";

type BookEventProps = {
    eventId: string;
    slug: string;
    email?: string | null;
}

export default function BookEvent({ eventId, slug }: BookEventProps) {
    const [email, setEmail] = useState('')
    const [submitted, setSubmitted] = useState(false)

    const handleSubmit: SubmitEventHandler<HTMLFormElement> = async (event) => {
        event.preventDefault();
        const { success } = await createBooking({ eventId, slug, email})

        if (success) {
            setSubmitted(true)
            posthog.capture('event_booked', { eventId, slug, email})
        } else {
            console.error(`Booking creation failed, error`)
            posthog.captureException('Booking creation failed, error')
            setSubmitted(false)
        }

    }
    
    return (
        <div id="book-event">
            {submitted ? (
                <p className="text-sm">Thank you for signing up</p>
            ): (
                <form onSubmit={handleSubmit}>
                    <div>
                        <label htmlFor="email">Email</label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Enter email" />
                    </div>

                    <button type="submit" className="button-submit">Submit</button>
                </form>
            )}
        </div>
    )
}