import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Room from '@/models/Room';

export async function GET() {
    try {
        await dbConnect();
        const rooms = await Room.find({ isAvailable: true });
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
        await dbConnect();
        const body = await req.json();

        // Create new room
        const room = await Room.create(body);

        return NextResponse.json(
            { message: 'Room created successfully', room },
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