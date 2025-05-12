import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';

export async function GET(req: Request) {
    try {
        const db = await connectToDatabase();
        const bookings = await db.collection('bookings').find().toArray();

        return NextResponse.json({
            bookings: bookings.map(booking => ({
                ...booking,
                _id: booking._id.toString()
            }))
        });
    } catch (error) {
        console.error('Error fetching bookings:', error);
        return NextResponse.json(
            { error: 'Failed to fetch bookings' },
            { status: 500 }
        );
    }
} 