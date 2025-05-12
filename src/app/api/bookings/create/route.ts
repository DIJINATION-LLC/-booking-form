import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

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
    userId: string;
    rooms: BookingRoom[];
    bookingType: 'daily' | 'monthly';
    totalAmount: number;
    paymentDetails: PaymentDetails;
}

export async function POST(req: Request) {
    try {
        const { db } = await connectToDatabase();
        const bookingData: BookingData = await req.json();

        // Validate required fields
        if (!bookingData.userId || !bookingData.rooms || !bookingData.bookingType || !bookingData.totalAmount || !bookingData.paymentDetails) {
            return NextResponse.json(
                { error: 'Missing required booking information' },
                { status: 400 }
            );
        }

        // Check for existing bookings to avoid conflicts
        const existingBookings = await db.collection('bookings').find({
            $or: bookingData.rooms.map((room: BookingRoom) => ({
                roomId: room.id.toString(),
                date: { $in: room.dates.map((date: string) => new Date(date)) },
                timeSlot: room.timeSlot
            }))
        }).toArray();

        if (existingBookings.length > 0) {
            return NextResponse.json(
                { error: 'Some dates are already booked for the selected rooms' },
                { status: 409 }
            );
        }

        // Calculate amount per booking
        const totalBookings = bookingData.rooms.reduce((total: number, r: BookingRoom) => total + r.dates.length, 0);
        const amountPerBooking = bookingData.totalAmount / totalBookings;

        // Create booking records for each room and its dates
        const bookingRecords = bookingData.rooms.flatMap((room: BookingRoom) =>
            room.dates.map((date: string) => ({
                userId: bookingData.userId,
                roomId: room.id.toString(),
                date: new Date(date),
                timeSlot: room.timeSlot,
                bookingType: bookingData.bookingType,
                amount: amountPerBooking,
                paymentDetails: bookingData.paymentDetails,
                createdAt: new Date()
            }))
        );

        // Insert bookings
        const result = await db.collection('bookings').insertMany(bookingRecords);

        // Update user record with booking status
        await db.collection('users').updateOne(
            { _id: new ObjectId(bookingData.userId) },
            {
                $set: {
                    hasBookings: true,
                    lastBooking: new Date()
                }
            }
        );

        // Store booking data in Excel-like format
        const bookingSummary = {
            userId: bookingData.userId,
            bookingIds: Object.values(result.insertedIds),
            totalAmount: bookingData.totalAmount,
            bookingType: bookingData.bookingType,
            paymentDetails: bookingData.paymentDetails,
            rooms: bookingData.rooms,
            createdAt: new Date()
        };

        await db.collection('bookingSummaries').insertOne(bookingSummary);

        return NextResponse.json({
            success: true,
            bookingIds: result.insertedIds,
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