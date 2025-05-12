'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import Header from '@/components/Header';

interface Booking {
    _id: string;
    rooms: Array<{
        id: number;
        timeSlot: 'full' | 'morning' | 'evening';
        dates: string[];
    }>;
    bookingType: 'daily' | 'monthly';
    totalAmount: number;
    bookingDate: string;
    status: 'confirmed' | 'cancelled' | 'completed';
}

const BookingHistoryPage = () => {
    const router = useRouter();
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const user = localStorage.getItem('user');
        if (!user) {
            toast.error('Please login to view booking history');
            router.push('/');
            return;
        }

        fetchBookings();
    }, [router]);

    const fetchBookings = async () => {
        try {
            const response = await fetch('/api/bookings/history');
            if (!response.ok) {
                throw new Error('Failed to fetch bookings');
            }
            const data = await response.json();
            setBookings(data.bookings);
        } catch (error) {
            console.error('Error fetching bookings:', error);
            toast.error('Failed to load booking history');
        } finally {
            setIsLoading(false);
        }
    };

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

    const getStatusBadgeClass = (status: string) => {
        switch (status) {
            case 'confirmed':
                return 'bg-green-100 text-green-800';
            case 'cancelled':
                return 'bg-red-100 text-red-800';
            case 'completed':
                return 'bg-blue-100 text-blue-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
                <div className="fixed top-0 left-0 right-0 z-50 bg-white shadow-md">
                    <Header />
                </div>
                <div className="container mx-auto px-4 pt-24">
                    <div className="flex justify-center items-center min-h-[60vh]">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
            {/* Header */}
            <header className="sticky top-0 left-0 right-0 z-50 bg-white shadow-md">
                <Header />
            </header>

            {/* Main Content */}
            <main className="container mx-auto px-4 py-8">
                <div className="max-w-5xl mx-auto">
                    <h1 className="text-4xl font-bold text-gray-800 mb-8">Booking History</h1>

                    {bookings.length === 0 ? (
                        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
                            <div className="mb-4">
                                <svg className="w-16 h-16 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                            </div>
                            <h2 className="text-2xl font-semibold text-gray-700 mb-2">No Bookings Found</h2>
                            <p className="text-gray-600 mb-6">You haven't made any bookings yet.</p>
                            <button
                                onClick={() => router.push('/booking')}
                                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200"
                            >
                                Make Your First Booking
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {bookings.map((booking) => (
                                <div key={booking._id} className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
                                    <div className="flex flex-wrap justify-between items-start gap-4 mb-6">
                                        <div>
                                            <h2 className="text-2xl font-semibold text-gray-800 mb-2">
                                                Booking #{booking._id.slice(-6).toUpperCase()}
                                            </h2>
                                            <p className="text-gray-600">
                                                Booked on {formatDate(booking.bookingDate)}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeClass(booking.status)}`}>
                                                {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                                            </span>
                                            <span className="text-lg font-semibold text-blue-600">
                                                ${booking.totalAmount.toFixed(2)}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        {booking.rooms.map((room, index) => (
                                            <div key={index} className="bg-gray-50 rounded-xl p-4">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div>
                                                        <h3 className="font-semibold text-lg mb-2">Room {room.id}</h3>
                                                        <p className="text-gray-600">
                                                            {getTimeSlotText(room.timeSlot)}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <h4 className="font-medium text-gray-700 mb-2">Booked Dates:</h4>
                                                        <div className="space-y-1">
                                                            {room.dates.map((date, i) => (
                                                                <div key={i} className="text-sm text-gray-600">
                                                                    {formatDate(date)}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="mt-6 flex justify-end">
                                        <button
                                            onClick={() => {
                                                localStorage.setItem('confirmationData', JSON.stringify(booking));
                                                router.push('/booking/confirmation');
                                            }}
                                            className="text-blue-600 hover:text-blue-800 font-medium"
                                        >
                                            View Details
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default BookingHistoryPage; 