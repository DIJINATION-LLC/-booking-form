import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Booking from '@/models/Booking';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

interface BookingRoom {
    id: number;
    timeSlot: 'full' | 'morning' | 'evening';
    dates: string[];
}

interface PaymentDetails {
    cardLast4: string;
    cardholderName: string;
}

interface BookingData {
    rooms: BookingRoom[];
    bookingType: 'daily' | 'monthly';
    totalAmount: number;
    paymentDetails: PaymentDetails;
}

export async function POST(req: Request) {
    try {
        // Connect to database and get user session
        await connectToDatabase();
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const bookingData: BookingData = await req.json();

        // Validate required fields
        if (!bookingData.rooms || !bookingData.bookingType || !bookingData.totalAmount || !bookingData.paymentDetails) {
            return NextResponse.json(
                { error: 'Missing required booking information' },
                { status: 400 }
            );
        }

        // Check for existing bookings to avoid conflicts
        for (const room of bookingData.rooms) {
            const existingBookings = await Booking.find({
                roomId: room.id.toString(),
                dates: { $in: room.dates },
                timeSlot: room.timeSlot
            });

            if (existingBookings.length > 0) {
                return NextResponse.json(
                    {
                        error: 'Some dates are already booked for the selected rooms',
                        conflictingDates: existingBookings.map(b => ({
                            date: b.dates[0],
                            roomId: b.roomId
                        }))
                    },
                    { status: 409 }
                );
            }
        }

        // Create booking records for each room
        const bookingPromises = bookingData.rooms.map(async (room) => {
            const booking = new Booking({
                userId: session.user.id,
                roomId: room.id.toString(),
                dates: room.dates,
                timeSlot: room.timeSlot,
                status: 'confirmed',
                totalAmount: (bookingData.totalAmount / bookingData.rooms.length),
                paymentDetails: bookingData.paymentDetails
            });
            return booking.save();
        });

        // Save all bookings
        const savedBookings = await Promise.all(bookingPromises);

        return NextResponse.json({
            success: true,
            bookings: savedBookings.map(booking => ({
                _id: booking._id.toString(),
                roomId: booking.roomId,
                dates: booking.dates
            })),
            message: 'Booking created successfully'
        });
    } catch (error) {
        console.error('Failed to create booking:', error);
        return NextResponse.json(
            { error: 'Failed to create booking' },
            { status: 500 }
        );
    }
} 