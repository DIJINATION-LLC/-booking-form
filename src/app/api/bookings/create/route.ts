import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { ObjectId } from 'mongodb';

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

        // Validate required fields
        if (!bookingData.rooms || !bookingData.dates || !bookingData.timeSlot || !bookingData.bookingType) {
            return NextResponse.json(
                { error: 'Missing required booking information' },
                { status: 400 }
            );
        }

        // Check for existing bookings to avoid conflicts
        const existingBookings = await db.collection('bookings').find({
            roomId: { $in: bookingData.rooms.map((id: string) => id) },
            date: { $in: bookingData.dates.map((date: string) => new Date(date)) },
            timeSlot: bookingData.timeSlot
        }).toArray();

        if (existingBookings.length > 0) {
            return NextResponse.json(
                { error: 'Some dates are already booked for the selected rooms' },
                { status: 409 }
            );
        }

        // Create booking records for each date and room
        const bookingPromises = bookingData.dates.flatMap((date: string) =>
            bookingData.rooms.map((roomId: string) => ({
                userId: new ObjectId(session.user.id),
                date: new Date(date),
                roomId,
                timeSlot: bookingData.timeSlot,
                bookingType: bookingData.bookingType,
                amount: bookingData.totalAmount / (bookingData.dates.length * bookingData.rooms.length),
                createdAt: new Date()
            }))
        );

        const result = await db.collection('bookings').insertMany(bookingPromises);

        // Update user record with booking status
        await db.collection('users').updateOne(
            { _id: new ObjectId(session.user.id) },
            {
                $set: {
                    hasBookings: true
                }
            }
        );

        return NextResponse.json({
            success: true,
            bookingIds: result.insertedIds
        });
    } catch (error) {
        console.error('Failed to create booking:', error);
        return NextResponse.json(
            { error: 'Failed to create booking' },
            { status: 500 }
        );
    }
} 