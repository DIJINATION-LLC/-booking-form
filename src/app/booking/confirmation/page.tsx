'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface BookingDetails {
    rooms: Array<{
        id: number;
        name: string;
        timeSlot: 'full' | 'morning' | 'evening';
        dates: string[];
    }>;
    totalAmount: number;
    bookingType: 'daily' | 'monthly';
}

export default function ConfirmationPage() {
    const router = useRouter();
    const [bookingDetails, setBookingDetails] = useState<BookingDetails | null>(null);

    useEffect(() => {
        // Get booking details from localStorage
        const storedRooms = localStorage.getItem('selectedRooms');
        const bookingType = localStorage.getItem('bookingType');

        if (storedRooms && bookingType) {
            const rooms = JSON.parse(storedRooms);
            setBookingDetails({
                rooms,
                totalAmount: calculateTotal(rooms, bookingType as 'daily' | 'monthly'),
                bookingType: bookingType as 'daily' | 'monthly'
            });

            // Clear booking data from localStorage
            localStorage.removeItem('selectedRooms');
            localStorage.removeItem('bookingType');
        }
    }, []);

    const calculateTotal = (rooms: any[], bookingType: 'daily' | 'monthly') => {
        let subtotal = 0;
        let securityDeposit = 0;

        rooms.forEach(room => {
            const numberOfDays = room.dates.length;
            if (numberOfDays === 0) return;

            const basePrice = bookingType === 'daily'
                ? (room.timeSlot === 'full' ? 300 : 160)
                : (room.timeSlot === 'full' ? 2000 : 1200);

            if (bookingType === 'daily') {
                subtotal += basePrice * numberOfDays;
            } else {
                subtotal += basePrice;
            }

            securityDeposit += 250;
        });

        const tax = subtotal * 0.035;
        return subtotal + tax + securityDeposit;
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    if (!bookingDetails) {
        return <div>Loading...</div>;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 py-12">
            <div className="container mx-auto px-4">
                <div className="max-w-4xl mx-auto">
                    <div className="bg-white rounded-2xl shadow-xl p-8">
                        <div className="text-center mb-8">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <h1 className="text-3xl font-bold text-gray-800 mb-2">Booking Confirmed!</h1>
                            <p className="text-gray-600">Thank you for your booking. We've sent the confirmation details to your email.</p>
                        </div>

                        <div className="mb-8">
                            <h2 className="text-xl font-semibold mb-4">Booking Details</h2>
                            {bookingDetails.rooms.map((room, index) => (
                                <div key={room.id} className="mb-6 p-6 bg-gray-50 rounded-xl">
                                    <h3 className="text-lg font-medium mb-2">{room.name}</h3>
                                    <div className="grid grid-cols-2 gap-4 mb-4">
                                        <div>
                                            <span className="text-gray-600">Time Slot:</span>
                                            <p className="font-medium">
                                                {room.timeSlot === 'full' ? 'Full Day (8:00 AM - 5:00 PM)' :
                                                    room.timeSlot === 'morning' ? 'Morning (8:00 AM - 12:00 PM)' :
                                                        'Evening (1:00 PM - 5:00 PM)'}
                                            </p>
                                        </div>
                                        <div>
                                            <span className="text-gray-600">Booking Type:</span>
                                            <p className="font-medium capitalize">{bookingDetails.bookingType}</p>
                                        </div>
                                    </div>
                                    <div>
                                        <span className="text-gray-600">Selected Dates:</span>
                                        <div className="mt-2 grid grid-cols-2 md:grid-cols-3 gap-2">
                                            {room.dates.map((date, i) => (
                                                <div key={i} className="text-sm bg-white p-2 rounded">
                                                    {formatDate(date)}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="border-t border-gray-200 pt-6">
                            <div className="flex justify-between items-center text-lg font-semibold">
                                <span>Total Amount Paid:</span>
                                <span className="text-blue-600">${bookingDetails.totalAmount.toFixed(2)}</span>
                            </div>
                            <p className="text-sm text-gray-600 mt-2">
                                * Security deposit of ${bookingDetails.rooms.length * 250} will be refunded after inspection
                            </p>
                        </div>

                        <div className="mt-8 flex justify-center">
                            <button
                                onClick={() => router.push('/')}
                                className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors duration-200"
                            >
                                Return to Home
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
} 