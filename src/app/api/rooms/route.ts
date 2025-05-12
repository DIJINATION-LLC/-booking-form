import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

export async function GET() {
    try {
        const { db } = await connectToDatabase();
        const rooms = await db.collection('rooms')
            .find({ isAvailable: true })
            .toArray();
        return NextResponse.json(rooms);
    } catch (error) {
        console.error('Error fetching rooms:', error);
        return NextResponse.json(
            { message: 'Error fetching rooms' },
            { status: 500 }
        );
    }
}

export async function POST(req: Request) {
    try {
        const { db } = await connectToDatabase();
        const body = await req.json();

        // Create new room
        const result = await db.collection('rooms').insertOne(body);

        return NextResponse.json(
            { message: 'Room created successfully', roomId: result.insertedId },
            { status: 201 }
        );
    } catch (error) {
        console.error('Error creating room:', error);
        return NextResponse.json(
            { message: 'Error creating room' },
            { status: 500 }
        );
    }
} 