import { ExploreBtn } from "@/components/ExploreBtn";
import { EventCard } from "@/components/EventCard";
import {IEvent} from "@/database";
import {cacheLife} from "next/cache";

// import { events } from "@/lib/constants";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

const Page = async () => {
    'use cache';
    cacheLife('hours')

    const response = await fetch(`${BASE_URL}/api/events`);
    const { events } = await response.json();

    return (
      <section>
        <h1 className="text-center">The Hub for every Dev <br/> Event you can't miss</h1>
        <p className="text-center mt-5">Hackathons, Meetups and Conferences, all in one place</p>

        <ExploreBtn />

        <div className="mt-20 space-y-7">
          <h3>Feature Events</h3>

          <ul className="events">
            {events && events.length > 0 && events.map((event: IEvent) => (
                <li key={event.title} className="list-none">
                  <EventCard {...event} />
                </li>
            ))}
          </ul>
        </div>
      </section>
  )
}

export default Page