import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

export async function POST(req: Request) {
    try {
        const { db } = await connectToDatabase();
        const { month, year } = await req.json();

        // Get start and end dates for the month
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0);

        // Find all bookings for the month
        const bookings = await db.collection('bookings').find({
            date: {
                $gte: startDate,
                $lte: endDate
            }
        }).toArray();

        // Create a map of dates and their booking status
        const bookingMap = new Map();
        bookings.forEach(booking => {
            const dateStr = booking.date.toISOString().split('T')[0];
            const currentStatus = bookingMap.get(dateStr);

            if (!currentStatus) {
                bookingMap.set(dateStr, booking.timeSlot === 'full' ? 'booked' : 'partial');
            } else if (currentStatus === 'partial' && booking.timeSlot === 'full') {
                bookingMap.set(dateStr, 'booked');
            } else if (currentStatus === 'partial') {
                // If we have two partial bookings (morning and evening), mark as booked
                const existingBooking = bookings.find(b =>
                    b.date.toISOString().split('T')[0] === dateStr &&
                    b.timeSlot !== booking.timeSlot
                );
                if (existingBooking) {
                    bookingMap.set(dateStr, 'booked');
                }
            }
        });

        // Convert map to array of objects
        const bookingStatus = Array.from(bookingMap, ([date, type]) => ({ date, type }));

        return NextResponse.json({ bookings: bookingStatus });
    } catch (error) {
        console.error('Error fetching booking status:', error);
        return NextResponse.json(
            { error: 'Error fetching booking status' },
            { status: 500 }
        );
    }
} 