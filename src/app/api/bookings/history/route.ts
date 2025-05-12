import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(req: Request) {
    try {
        // Connect to database
        const { db } = await connectToDatabase();

        // Get the user's session
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Fetch bookings using MongoDB native driver
        const bookings = await db.collection('bookings')
            .find({ userId: session.user.id })
            .sort({ createdAt: -1 })
            .toArray();

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