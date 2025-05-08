import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { db } = await connectToDatabase();
        const bookingData = await req.json();

        // Create booking records for each date and room
        const bookingPromises = bookingData.dates.flatMap(date =>
            bookingData.rooms.map(roomId => ({
                userId: session.user.id,
                date: new Date(date),
                roomId,
                timeSlot: bookingData.timeSlot,
                bookingType: bookingData.bookingType,
                amount: bookingData.totalAmount / (bookingData.dates.length * bookingData.rooms.length),
                createdAt: new Date()
            }))
        );

        await db.collection('bookings').insertMany(bookingPromises);

        // If new user, update user record with registration fee payment
        if (bookingData.isNewUser) {
            await db.collection('users').updateOne(
                { _id: session.user.id },
                {
                    $set: {
                        hasBookings: true,
                        registrationFeePaid: true,
                        registrationFeeAmount: 250,
                        registrationFeeDate: new Date()
                    }
                }
            );
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Failed to create booking:', error);
        return NextResponse.json(
            { error: 'Failed to create booking' },
            { status: 500 }
        );
    }
} 