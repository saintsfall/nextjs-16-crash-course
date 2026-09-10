import {notFound} from "next/navigation";
import Image from "next/image";
import BookEvent from "@/components/BookEvent";
import {IEvent} from "@/database";
import {getSimilarEventsBySlug} from "@/lib/actions/event.actions";
import {EventCard} from "@/components/EventCard";
import {cacheLife} from "next/cache";

type EventDetailsProps = {
    params: Promise<{ slug: string }>;
}

type EventDetailsItem = {
    icon: string;
    alt: string;
    label: string;
}

type EventDetailAgenda = {
    agendaItems: string[];
}

type EventDetailTags = {
    tags: string[];
}

const EventDetailItem = ({ icon, alt, label}: EventDetailsItem) => {
    return (
        <div className="flex-row-gap-2">
            <Image src={icon} alt={alt} width={17} height={17} />
            <p>{label}</p>
        </div>
    )
}

const EventDetailAgenda = ({ agendaItems}: EventDetailAgenda) => {
    return (
        <div className="agenda">
            <h2>Agenda</h2>
            <ul>
                {agendaItems.map((item) => (
                    <li key={item}>{item}</li>
                ))}
            </ul>
        </div>
    )
}

const EventDetailsTags = ({ tags }: EventDetailTags) => {
    return (
        <div className="flex flex-row gap-1.5 flex-wrap">
            {tags.map((tag) => (
                <div className="pill" key={tag}>{tag}</div>
            ))}
        </div>
    )
}

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;
export default async function EventDetailsPage({ params }: EventDetailsProps) {
    'use cache'
    cacheLife('hours');

    const { slug } = await params;

    let event;

    try {

        const request = await fetch(`${BASE_URL}/api/events/${slug}`, {
            next: { revalidate: 60 }
        });

        if(!request.ok) {
            if (request.status === 404) {
                return notFound();
            }

            throw new Error(`Failed to fetch event details: ${request.statusText}`);
        }

        const response = await request.json();
        event = response.event;

        if (!event) {
            return notFound();
        }

    } catch (err) {
        console.error("Failed to fetch event", err);
        return notFound();
    }

    const {
        title,
        description,
        image,
        overview,
        date,
        time,
        location,
        mode,
        agenda,
        audience,
        organizer,
        tags,
    } = event;

    const bookings = 10;
    const similarEvents: IEvent[] = await getSimilarEventsBySlug(slug);

    console.log("Similar events", similarEvents);

    return (
        <section id="event">
            <div className="header">
                <h1>Event Description</h1>
                <p>{ description }</p>
            </div>

            <div className="details">
                {/* Left Side - Event Content */}
                <div className="content">
                    <Image src={image} alt={title} width={800} height={800} className="banner" />
                    <section className="flex-col-gap-2">
                        <h2>Overview</h2>
                        <p>{overview}</p>
                    </section>

                    <section className="flex-col-gap-2">
                        <h2>Event Details</h2>
                        <EventDetailItem icon="/icons/calendar.svg" alt="calendar" label={date} />
                        <EventDetailItem icon="/icons/clock.svg" alt="clock" label={time} />
                        <EventDetailItem icon="/icons/pin.svg" alt="pin" label={location} />
                        <EventDetailItem icon="/icons/mode.svg" alt="mode" label={mode} />
                        <EventDetailItem icon="/icons/audience.svg" alt="audience" label={audience} />
                    </section>

                    <EventDetailAgenda agendaItems={agenda}/>

                    <section className="flex-col-gap-2">
                        <h2>About the Organizer</h2>
                        <p>{organizer}</p>
                    </section>

                    <EventDetailsTags tags={tags} />
                </div>

                {/* Right Side - Booking Form */}
                <aside className="booking">
                    <div className="signup-card">
                        <h2>Book your spot</h2>
                        { bookings > 0 ? (
                            <p className="text-sm">
                                Join { bookings } people who have already booked their spot!
                            </p>
                        ) : (
                            <p className="text-sm">
                                Be the first to book your spot!
                            </p>
                        )}

                        <BookEvent eventId={event._id} slug={event.slug} />
                    </div>
                </aside>
            </div>

            <div className="flex w-full flex-col gap-4 pt-20">
                <h2>Similar Events</h2>
                <div className="events">
                    { similarEvents.length > 0 && similarEvents.map((similarEvent: IEvent) => (
                        <EventCard
                            key={similarEvent.slug}
                            title={similarEvent.title}
                            image={similarEvent.image}
                            slug={similarEvent.slug}
                            location={similarEvent.location}
                            date={similarEvent.date}
                            time={similarEvent.time}
                        />
                    ))}
                </div>
            </div>
        </section>
    )
}