'use server';

import dbConnect from "@/lib/mongodb";
import {Event} from "@/database";

export const getSingleEventBySlug = async (slug: string) => {
    await dbConnect();

    const event = await Event.findOne({ slug });

    if (!event) return null;

    // POJO serializável (ObjectId/Date) para BookEvent / EventCard
    return JSON.parse(JSON.stringify(event));
}

export const getSimilarEventsBySlug = async (slug: string) => {
    try{
        await dbConnect()

        const event = await Event.findOne({ slug })
        return await Event.find({
            _id: { $ne: event?._id },
            tags: { $in: event?.tags }
        }).lean();
    } catch {
        return [];
    }
}