import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
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
    bookingType: string;
    totalAmount: number;
    paymentDetails: PaymentDetails;
}

export async function POST(req: Request) {
    try {
        // Connect to database and get user session
        const { db } = await connectToDatabase();
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
            const existingBookings = await db.collection('bookings').find({
                roomId: room.id.toString(),
                dates: { $in: room.dates },
                timeSlot: room.timeSlot
            }).toArray();

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

        // Create bookings for each room
        const bookingPromises = bookingData.rooms.map(room => {
            return db.collection('bookings').insertOne({
                userId: session.user.id,
                roomId: room.id.toString(),
                dates: room.dates,
                timeSlot: room.timeSlot,
                status: 'confirmed',
                totalAmount: bookingData.totalAmount,
                paymentDetails: bookingData.paymentDetails,
                createdAt: new Date(),
                updatedAt: new Date()
            });
        });

        const results = await Promise.all(bookingPromises);

        return NextResponse.json({
            message: 'Bookings created successfully',
            bookingIds: results.map(r => r.insertedId.toString())
        });
    } catch (error) {
        console.error('Error creating bookings:', error);
        return NextResponse.json(
            { error: 'Failed to create bookings' },
            { status: 500 }
        );
    }
} 