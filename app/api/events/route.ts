import {NextRequest, NextResponse} from "next/server";
import { v2 as cloudinary } from "cloudinary";
import dbConnect from "@/lib/mongodb";

import {Event} from "@/database";

export async function POST(req: NextRequest) {
    try {
        await dbConnect();

        const formData = await req.formData();

        let event;

        try {
            event = Object.fromEntries(formData.entries());
        } catch {
            return NextResponse.json({ message: "Invalid JSON data format" }, { status: 400})
        }

        const file = formData.get('image') as File;

        if(!file) {
            return NextResponse.json({ message: 'Image file is required' }, { status: 400 })
        }

        let tags = JSON.parse(formData.get('tags') as string);
        let agenda = JSON.parse(formData.get('agenda') as string);

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const uploadResult = await new Promise((resolve, reject) => {
            cloudinary.uploader.upload_stream({ resource_type: 'image', folder: 'events' }, (error, results) => {
                if(error) return reject(error);
                resolve(results);
            }).end(buffer);
        })

        event.image = (uploadResult as { secure_url: string }).secure_url;

        const createdEvent = await Event.create({
            ...event,
            tags: tags,
            agenda: agenda,
        });

        return NextResponse.json({ message: "Event created", event: createdEvent }, { status: 201 });
    } catch (err) {
        console.error(err);
        return NextResponse.json({ message: "Failed to create event" , error: err instanceof Error ? err.message : "Unknown error" }, { status: 500 });
    }
}

export async function GET() {
    try {
        await dbConnect();

        const events = await Event.find().sort({ createdAt: -1 });

        return NextResponse.json({ message: "Event loaded", events }, { status: 200 });

    } catch (err) {
        return NextResponse.json({ message: "Failed to get event", error: err }, { status: 500 });
    }
}