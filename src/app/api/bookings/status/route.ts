import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

export async function POST(req: Request) {
    try {
        const { month, year } = await req.json();
        const { db } = await connectToDatabase();

        // Get all bookings for the specified month
        const startDate = new Date(year, month, 1);
        const endDate = new Date(year, month + 1, 0);

        const bookings = await db.collection('bookings').find({
            date: {
                $gte: startDate,
                $lte: endDate
            }
        }).toArray();

        // Transform bookings into status format with half-day support
        const bookingStatus = bookings.map(booking => ({
            date: booking.date.toISOString().split('T')[0],
            type: booking.timeSlot, // 'full', 'morning', 'evening', or 'none'
            roomId: booking.roomId
        }));

        // Combine bookings for the same date
        const combinedBookings = bookingStatus.reduce((acc, booking) => {
            const existingBooking = acc.find(b => b.date === booking.date);
            if (!existingBooking) {
                acc.push(booking);
            } else if (booking.type === 'full' || existingBooking.type === 'full') {
                existingBooking.type = 'full';
            } else if (booking.type !== existingBooking.type) {
                // If different half-day slots are booked, mark as full
                existingBooking.type = 'full';
            }
            return acc;
        }, [] as typeof bookingStatus);

        return NextResponse.json({ bookings: combinedBookings });
    } catch (error) {
        console.error('Failed to fetch booking status:', error);
        return NextResponse.json(
            { error: 'Failed to fetch booking status' },
            { status: 500 }
        );
    }
} 