import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Booking from '@/models/Booking';

export async function POST(req: Request) {
    try {
        await dbConnect();
        const { month, year } = await req.json();

        // Get start and end dates for the month
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0);

        // Find all bookings for the month
        const bookings = await Booking.find({
            date: {
                $gte: startDate,
                $lte: endDate
            }
        });

        // Create a map of dates and their booking status
        const bookingMap = new Map();
        bookings.forEach(booking => {
            const dateStr = booking.date.toISOString().split('T')[0];
            if (booking.timeSlot === 'full') {
                bookingMap.set(dateStr, 'booked');
            } else {
                const currentStatus = bookingMap.get(dateStr);
                if (!currentStatus) {
                    bookingMap.set(dateStr, 'partial');
                } else if (currentStatus === 'partial') {
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
            { message: 'Error fetching booking status' },
            { status: 500 }
        );
    }
} 