import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const roomId = searchParams.get('roomId');
        const month = searchParams.get('month'); // Format: YYYY-MM

        if (!roomId || !month) {
            return NextResponse.json({ error: 'Room ID and month are required' }, { status: 400 });
        }

        const { db } = await connectToDatabase();

        // Get the start and end dates for the month
        const [year, monthNum] = month.split('-').map(Number);
        const startDate = new Date(year, monthNum - 1, 1);
        const endDate = new Date(year, monthNum, 0);

        // Get all bookings for this room in the specified month
        const bookings = await db.collection('bookings').find({
            roomId: roomId,
            date: {
                $gte: startDate,
                $lte: endDate
            }
        }).toArray();

        // Format the response
        const bookedDates = bookings.map(booking => ({
            date: booking.date,
            timeSlot: booking.timeSlot
        }));

        return NextResponse.json({ bookedDates });
    } catch (error) {
        console.error('Error fetching room availability:', error);
        return NextResponse.json({ error: 'Failed to fetch room availability' }, { status: 500 });
    }
} 