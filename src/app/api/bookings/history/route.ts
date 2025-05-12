import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Booking, { IBooking } from '@/models/Booking';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Types } from 'mongoose';

interface BookingDocument extends IBooking {
    _id: Types.ObjectId;
    __v: number;
}

export async function GET(req: Request) {
    try {
        // Connect to database
        await connectToDatabase();

        // Get the user's session
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Fetch bookings using Mongoose model
        const bookings = await Booking.find({ userId: session.user.id })
            .sort({ createdAt: -1 }) // Sort by newest first
            .lean<BookingDocument[]>(); // Convert to plain JavaScript objects with proper typing

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