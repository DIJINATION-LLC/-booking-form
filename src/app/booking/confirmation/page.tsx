'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

interface BookingDetails {
    rooms: Array<{
        id: number;
        name: string;
        timeSlot: 'full' | 'morning' | 'evening';
        dates: string[];
    }>;
    totalAmount: number;
    bookingType: 'daily' | 'monthly';
    bookingDate: string;
}

const ConfirmationPage = () => {
    const router = useRouter();
    const [bookingDetails, setBookingDetails] = useState<BookingDetails | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        try {
            // Get confirmation details
            const confirmationData = localStorage.getItem('confirmationData');
            if (!confirmationData) {
                console.error('No confirmation data found in localStorage');
                toast.error('No booking confirmation found');
                router.push('/booking');
                return;
            }

            setBookingDetails(JSON.parse(confirmationData));
        } catch (error) {
            console.error('Error parsing confirmation data:', error);
            toast.error('Invalid confirmation data');
            router.push('/booking');
        } finally {
            setIsLoading(false);
        }
    }, [router]);

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const getTimeSlotText = (timeSlot: 'full' | 'morning' | 'evening') => {
        switch (timeSlot) {
            case 'full':
                return '8:00 AM - 5:00 PM';
            case 'morning':
                return '8:00 AM - 12:00 PM';
            case 'evening':
                return '1:00 PM - 5:00 PM';
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (!bookingDetails) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-800 mb-4">No Booking Found</h1>
                    <p className="text-gray-600 mb-6">We couldn't find your booking confirmation.</p>
                    <button
                        onClick={() => router.push('/booking')}
                        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200"
                    >
                        Make a New Booking
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 py-12">
            <div className="container mx-auto px-4">
                <div className="max-w-3xl mx-auto">
                    <div className="bg-white rounded-2xl shadow-xl p-8">
                        <div className="text-center mb-8">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <h1 className="text-3xl font-bold text-gray-800 mb-2">Booking Confirmed!</h1>
                            <p className="text-gray-600">Your booking has been successfully completed</p>
                            <p className="text-sm text-gray-500 mt-1">Booking Date: {formatDate(bookingDetails.bookingDate)}</p>
                        </div>

                        <div className="space-y-6 mb-8">
                            <h2 className="text-xl font-semibold border-b border-gray-200 pb-2">Booking Details</h2>
                            {bookingDetails.rooms.map((room) => (
                                <div key={room.id} className="bg-gray-50 rounded-xl p-6">
                                    <h3 className="font-semibold text-lg mb-4">{room.name}</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <span className="text-gray-600 text-sm">Time Slot:</span>
                                            <p className="font-medium">{getTimeSlotText(room.timeSlot)}</p>
                                        </div>
                                        <div>
                                            <span className="text-gray-600 text-sm">Booking Type:</span>
                                            <p className="font-medium capitalize">{bookingDetails.bookingType}</p>
                                        </div>
                                    </div>
                                    <div className="mt-4">
                                        <span className="text-gray-600 text-sm">Selected Dates:</span>
                                        <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2">
                                            {room.dates.map((date) => (
                                                <div key={date} className="bg-white p-2 rounded border border-gray-200">
                                                    <span className="text-sm">{formatDate(date)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="border-t border-gray-200 pt-6 mb-8">
                            <h2 className="text-xl font-semibold mb-4">Payment Summary</h2>
                            <div className="bg-blue-50 p-4 rounded-lg">
                                <div className="flex justify-between items-center">
                                    <span className="font-medium">Total Amount Paid:</span>
                                    <span className="text-xl font-bold text-blue-600">${bookingDetails.totalAmount.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-center">
                            <button
                                onClick={() => router.push('/')}
                                className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors duration-200"
                            >
                                Back to Main Page
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationPage; 