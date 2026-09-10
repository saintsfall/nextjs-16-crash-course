'use server';

import dbConnect from "@/lib/mongodb";
import {Event} from "@/database";

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