import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { db } = await connectToDatabase();

        // Check if user has any previous bookings
        const bookingsCount = await db.collection('bookings').countDocuments({
            userId: session.user.id
        });

        return NextResponse.json({
            hasBookings: bookingsCount > 0,
            bookingsCount
        });
    } catch (error) {
        console.error('Failed to fetch user bookings:', error);
        return NextResponse.json(
            { error: 'Failed to fetch user bookings' },
            { status: 500 }
        );
    }
} 