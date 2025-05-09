'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

interface PriceBreakdown {
    subtotal: number;
    tax: number;
    securityDeposit: number;
    total: number;
}

interface CardDetails {
    cardNumber: string;
    expiryDate: string;
    cvv: string;
    name: string;
}

const PaymentPage = () => {
    const router = useRouter();
    const [error, setError] = useState<string | null>(null);
    const [processing, setProcessing] = useState(false);
    const [cardDetails, setCardDetails] = useState<CardDetails>({
        cardNumber: '',
        expiryDate: '',
        cvv: '',
        name: ''
    });
    const [priceBreakdown, setPriceBreakdown] = useState<PriceBreakdown>({
        subtotal: 0,
        tax: 0,
        securityDeposit: 0,
        total: 0
    });

    useEffect(() => {
        // Get booking details from localStorage
        const storedRooms = localStorage.getItem('selectedRooms');
        const bookingType = localStorage.getItem('bookingType');
        if (!storedRooms || !bookingType) {
            toast.error('No booking details found');
            router.push('/booking');
            return;
        }

        try {
            const rooms = JSON.parse(storedRooms);
            calculateTotalPrice(rooms, bookingType as 'daily' | 'monthly');
        } catch (error) {
            toast.error('Invalid booking data');
            router.push('/booking');
        }
    }, [router]);

    const calculateTotalPrice = (rooms: any[], bookingType: 'daily' | 'monthly') => {
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
        const total = subtotal + tax + securityDeposit;

        setPriceBreakdown({
            subtotal,
            tax,
            securityDeposit,
            total
        });
    };

    const handleCardDetailsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        let formattedValue = value;

        // Format card number with spaces
        if (name === 'cardNumber') {
            formattedValue = value.replace(/\s/g, '').replace(/(\d{4})/g, '$1 ').trim();
            formattedValue = formattedValue.substring(0, 19); // Limit to 16 digits + 3 spaces
        }

        // Format expiry date
        if (name === 'expiryDate') {
            formattedValue = value.replace(/\D/g, '');
            if (formattedValue.length >= 2) {
                formattedValue = formattedValue.substring(0, 2) + '/' + formattedValue.substring(2, 4);
            }
            formattedValue = formattedValue.substring(0, 5);
        }

        // Format CVV
        if (name === 'cvv') {
            formattedValue = value.replace(/\D/g, '').substring(0, 3);
        }

        setCardDetails(prev => ({
            ...prev,
            [name]: formattedValue
        }));
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setProcessing(true);
        setError(null);

        try {
            // Basic validation
            if (!cardDetails.cardNumber || !cardDetails.expiryDate || !cardDetails.cvv || !cardDetails.name) {
                throw new Error('Please fill in all payment details');
            }

            // Get user data
            const userData = localStorage.getItem('user');
            if (!userData) {
                throw new Error('User not authenticated');
            }
            const user = JSON.parse(userData);

            // Store confirmation data
            const storedRooms = localStorage.getItem('selectedRooms');
            const bookingType = localStorage.getItem('bookingType');
            if (!storedRooms || !bookingType) {
                throw new Error('Booking details not found');
            }

            const rooms = JSON.parse(storedRooms);
            const confirmationData = {
                rooms: rooms.map((room: any) => ({
                    ...room,
                    name: `Room ${room.id}`
                })),
                bookingType,
                totalAmount: priceBreakdown.total,
                bookingDate: new Date().toISOString()
            };
            localStorage.setItem('confirmationData', JSON.stringify(confirmationData));

            // Prepare booking data for API
            const bookingData = {
                userId: user._id,
                rooms: rooms.map((room: any) => ({
                    id: room.id,
                    timeSlot: room.timeSlot,
                    dates: room.dates || []
                })),
                bookingType,
                totalAmount: priceBreakdown.total,
                paymentDetails: {
                    cardLast4: cardDetails.cardNumber.slice(-4),
                    cardholderName: cardDetails.name
                }
            };

            // Submit booking to API
            const response = await fetch('/api/bookings/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(bookingData),
            });

            const responseData = await response.json();

            if (!response.ok) {
                throw new Error(responseData.error || 'Failed to create booking');
            }

            // Clear booking data from localStorage
            localStorage.removeItem('bookingData');
            localStorage.removeItem('selectedRooms');
            localStorage.removeItem('bookingType');

            toast.success('Payment successful!');
            router.push('/booking/confirmation');
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Payment failed';
            toast.error(errorMessage);
            setError(errorMessage);
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 py-12">
            <div className="container mx-auto px-4">
                <div className="max-w-4xl mx-auto">
                    <button
                        onClick={() => router.back()}
                        className="mb-6 flex items-center text-blue-600 hover:text-blue-800 transition-colors duration-200"
                    >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Back to Summary
                    </button>

                    <div className="bg-white rounded-2xl shadow-xl p-8">
                        <h1 className="text-3xl font-bold text-gray-800 mb-8">Payment Details</h1>

                        {/* Price Summary */}
                        <div className="mb-8">
                            <h2 className="text-xl font-semibold mb-4">Price Summary</h2>
                            <div className="space-y-3">
                                <div className="flex justify-between text-gray-600">
                                    <span>Subtotal</span>
                                    <span>${priceBreakdown.subtotal.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-gray-600">
                                    <span>Tax (3.5%)</span>
                                    <span>${priceBreakdown.tax.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-gray-600">
                                    <div>
                                        <span>Security Deposit</span>
                                        <div className="text-xs text-gray-500">($250 per room, refundable)</div>
                                    </div>
                                    <span>${priceBreakdown.securityDeposit.toFixed(2)}</span>
                                </div>
                                <div className="border-t border-gray-200 pt-3 mt-3">
                                    <div className="flex justify-between font-semibold">
                                        <span>Total</span>
                                        <span className="text-blue-600">${priceBreakdown.total.toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Payment Form */}
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Cardholder Name
                                    </label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={cardDetails.name}
                                        onChange={handleCardDetailsChange}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="John Doe"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Card Number
                                    </label>
                                    <input
                                        type="text"
                                        name="cardNumber"
                                        value={cardDetails.cardNumber}
                                        onChange={handleCardDetailsChange}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="1234 5678 9012 3456"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Expiry Date
                                    </label>
                                    <input
                                        type="text"
                                        name="expiryDate"
                                        value={cardDetails.expiryDate}
                                        onChange={handleCardDetailsChange}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="MM/YY"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        CVV
                                    </label>
                                    <input
                                        type="text"
                                        name="cvv"
                                        value={cardDetails.cvv}
                                        onChange={handleCardDetailsChange}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="123"
                                        required
                                    />
                                </div>
                            </div>

                            {error && (
                                <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded relative">
                                    {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={processing}
                                className={`w-full py-3 px-4 rounded-lg text-white font-medium ${processing
                                        ? 'bg-blue-400 cursor-not-allowed'
                                        : 'bg-blue-600 hover:bg-blue-700'
                                    }`}
                            >
                                {processing ? 'Processing...' : `Complete Payment - $${priceBreakdown.total.toFixed(2)}`}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PaymentPage; 