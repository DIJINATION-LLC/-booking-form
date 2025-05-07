'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

const ConfirmationPage = () => {
    const router = useRouter();

    useEffect(() => {
        const storedRooms = localStorage.getItem('selectedRooms');
        if (!storedRooms) {
            toast.error('No booking details found');
            router.push('/booking');
            return;
        }
    }, [router]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 py-12">
            <div className="container mx-auto px-4">
                <div className="max-w-2xl mx-auto text-center">
                    <div className="bg-white rounded-2xl shadow-xl p-8">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h1 className="text-3xl font-bold text-gray-800 mb-4">Booking Confirmed!</h1>
                        <p className="text-gray-600 mb-8">
                            Thank you for your booking. We have sent a confirmation email with all the details.
                        </p>
                        <div className="space-y-4">
                            <button
                                onClick={() => router.push('/portal')}
                                className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors duration-200"
                            >
                                View My Bookings
                            </button>
                            <button
                                onClick={() => router.push('/')}
                                className="w-full bg-gray-100 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-200 transition-colors duration-200"
                            >
                                Return to Home
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationPage; 