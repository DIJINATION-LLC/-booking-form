import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

export async function GET(req: Request) {
    try {
        const { db } = await connectToDatabase();

        // Get user from localStorage (since we're not using next-auth)
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        if (!user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Fetch all bookings for the user
        const bookings = await db.collection('bookings')
            .find({
                userId: user._id
            })
            .sort({ createdAt: -1 }) // Sort by most recent first
            .project({
                roomId: 1,
                date: 1,
                timeSlot: 1,
                bookingType: 1,
                amount: 1,
                createdAt: 1,
                paymentDetails: 1
            })
            .toArray();

        // Also fetch booking summaries for Excel data
        const summaries = await db.collection('bookingSummaries')
            .find({
                userId: user._id
            })
            .sort({ createdAt: -1 })
            .toArray();

        return NextResponse.json({
            bookings,
            summaries,
            success: true
        });
    } catch (error) {
        console.error('Failed to fetch user bookings:', error);
        return NextResponse.json(
            { error: 'Failed to fetch user bookings' },
            { status: 500 }
        );
    }
} 