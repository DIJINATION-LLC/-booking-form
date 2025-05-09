import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

export async function POST(req: Request) {
    try {
        const { db } = await connectToDatabase();
        const { month, year, roomId } = await req.json();

        console.log('API received params:', { month, year, roomId }); // Debug log

        // Get start and end dates for the month
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0);

        // Find all bookings for the month and specific room if provided
        const query = {
            date: {
                $gte: startDate,
                $lte: endDate
            },
            ...(roomId && { roomId: roomId.toString() })
        };

        console.log('MongoDB query:', query); // Debug log

        const bookings = await db.collection('bookings').find(query).toArray();
        console.log('Found bookings:', bookings); // Debug log

        // Create a map of dates and their booking status per room
        const bookingMap = new Map();
        bookings.forEach(booking => {
            const dateStr = booking.date.toISOString().split('T')[0];
            const key = `${dateStr}-${booking.roomId}`;
            const currentStatus = bookingMap.get(key);

            if (!currentStatus) {
                bookingMap.set(key, {
                    date: dateStr,
                    roomId: booking.roomId,
                    type: 'partial',
                    timeSlots: [booking.timeSlot]
                });
            } else {
                const timeSlots = currentStatus.timeSlots || [];
                if (!timeSlots.includes(booking.timeSlot)) {
                    timeSlots.push(booking.timeSlot);
                }

                // If we have both morning and evening slots, or a full day booking
                const isFullyBooked = timeSlots.includes('full') ||
                    (timeSlots.includes('morning') && timeSlots.includes('evening'));

                bookingMap.set(key, {
                    ...currentStatus,
                    type: isFullyBooked ? 'booked' : 'partial',
                    timeSlots
                });
            }
        });

        // Convert map to array of objects
        const bookingStatus = Array.from(bookingMap.values());
        console.log('Final booking status:', bookingStatus); // Debug log

        return NextResponse.json({ bookings: bookingStatus });
    } catch (error) {
        console.error('Error fetching booking status:', error);
        return NextResponse.json(
            { error: 'Error fetching booking status' },
            { status: 500 }
        );
    }
} 