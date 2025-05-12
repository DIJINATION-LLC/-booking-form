'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { PRICING, TimeSlot, BookingType } from '@/constants/pricing';
import Header from '@/components/Header';

interface Room {
    id: number;
    timeSlot: TimeSlot;
    dates: string[];
}

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

const SummaryPage = () => {
    const router = useRouter();
    const [selectedRooms, setSelectedRooms] = useState<Room[]>([]);
    const [bookingType, setBookingType] = useState<BookingType>('daily');
    const [isProcessing, setIsProcessing] = useState(false);
    const [priceBreakdown, setPriceBreakdown] = useState<PriceBreakdown>({
        subtotal: 0,
        tax: 0,
        securityDeposit: 0,
        total: 0
    });
    const [cardDetails, setCardDetails] = useState<CardDetails>({
        cardNumber: '',
        expiryDate: '',
        cvv: '',
        name: ''
    });

    useEffect(() => {
        // Check authentication
        const user = localStorage.getItem('user');
        if (!user) {
            toast.error('Please login to continue');
            router.push('/');
            return;
        }

        // Get booking data
        const bookingDataStr = localStorage.getItem('bookingData');
        if (!bookingDataStr) {
            toast.error('No booking details found');
            router.push('/booking');
            return;
        }

        try {
            const bookingData = JSON.parse(bookingDataStr);
            setSelectedRooms(bookingData.rooms);
            setBookingType(bookingData.bookingType);
            calculatePriceBreakdown(bookingData.rooms, bookingData.bookingType);
        } catch (error) {
            console.error('Error parsing booking data:', error);
            toast.error('Invalid booking data');
            router.push('/booking');
        }
    }, [router]);

    const calculatePriceBreakdown = (rooms: Room[], type: BookingType) => {
        let subtotal = 0;
        let securityDeposit = 0;

        rooms.forEach(room => {
            const numberOfDays = room.dates.length;
            if (numberOfDays === 0) return;

            const basePrice = PRICING[type][room.timeSlot];

            if (type === 'daily') {
                subtotal += basePrice * numberOfDays;
            } else {
                subtotal += basePrice;
            }
        });

        // Add security deposit only once if there are any rooms with dates
        if (rooms.some(room => room.dates.length > 0)) {
            securityDeposit = PRICING.securityDeposit;
        }

        const tax = subtotal * PRICING.taxRate;
        const total = subtotal + tax + securityDeposit;

        setPriceBreakdown({
            subtotal,
            tax,
            securityDeposit,
            total
        });
    };

    const handleRemoveDate = (roomId: number, dateToRemove: string) => {
        if (bookingType !== 'daily') {
            toast.error('Dates cannot be modified for monthly bookings');
            return;
        }

        const updatedRooms = selectedRooms.map(room => {
            if (room.id === roomId) {
                const updatedDates = room.dates.filter(date => date !== dateToRemove);
                return {
                    ...room,
                    dates: updatedDates
                };
            }
            return room;
        }).filter(room => room.dates.length > 0); // Remove rooms with no dates

        if (updatedRooms.length === 0) {
            toast.error('Cannot remove all dates. Please keep at least one booking.');
            return;
        }

        setSelectedRooms(updatedRooms);
        calculatePriceBreakdown(updatedRooms, bookingType);

        // Update localStorage
        const bookingData = {
            rooms: updatedRooms,
            bookingType
        };
        localStorage.setItem('bookingData', JSON.stringify(bookingData));
        toast.success('Date removed successfully');
    };

    const formatDate = (dateStr: string) => {
        // Parse the date in local timezone
        const [year, month, day] = dateStr.split('-').map(Number);
        const date = new Date(year, month - 1, day); // month is 0-based in Date constructor

        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            year: 'numeric'
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

    const handleCompleteBooking = async () => {
        setIsProcessing(true);
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

            // Store confirmation data first
            const confirmationData = {
                rooms: selectedRooms.map(room => ({
                    ...room,
                    name: `Room ${room.id}`
                })),
                bookingType,
                totalAmount: priceBreakdown.total,
                bookingDate: new Date().toISOString(),
                paymentDetails: {
                    cardLast4: cardDetails.cardNumber.slice(-4),
                    cardholderName: cardDetails.name
                }
            };
            localStorage.setItem('confirmationData', JSON.stringify(confirmationData));

            // Prepare booking data for API
            const bookingData = {
                userId: user._id,
                rooms: selectedRooms.map(room => ({
                    id: room.id,
                    timeSlot: room.timeSlot,
                    dates: room.dates
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
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(bookingData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to create booking');
            }

            const responseData = await response.json();

            // Update user's booking status in localStorage
            const updatedUser = {
                ...user,
                hasBookings: true
            };
            localStorage.setItem('user', JSON.stringify(updatedUser));

            // Clear booking data from localStorage
            localStorage.removeItem('bookingData');
            localStorage.removeItem('selectedRooms');
            localStorage.removeItem('bookingType');

            toast.success('Booking completed successfully!');
            router.push('/booking/confirmation');
        } catch (error) {
            console.error('Booking failed:', error);
            toast.error(error instanceof Error ? error.message : 'Failed to complete booking');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
            {/* Header */}
            <header className="sticky top-0 left-0 right-0 z-50 bg-white shadow-md">
                <Header />
            </header>

            {/* Main Content */}
            <main className="container mx-auto px-4 py-8">
                <div className="max-w-4xl mx-auto">
                    <button
                        onClick={() => router.back()}
                        className="mb-6 flex items-center text-blue-600 hover:text-blue-800 transition-colors duration-200"
                    >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Back to Calendar
                    </button>

                    <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
                        <h1 className="text-3xl font-bold text-gray-800 mb-8">Booking Summary</h1>

                        {/* Room Details */}
                        <div className="space-y-6 mb-8">
                            {selectedRooms.map((room) => (
                                <div key={room.id} className="bg-gray-50 rounded-xl p-6">
                                    <h3 className="font-semibold text-lg mb-4">Room {room.id}</h3>
                                    <div className="grid grid-cols-2 gap-4 mb-4">
                                        <div>
                                            <span className="text-gray-600 text-sm">Time Slot:</span>
                                            <p className="font-medium">{room.timeSlot === 'full' ? 'Full Day (8:00 AM - 5:00 PM)' :
                                                room.timeSlot === 'morning' ? 'Morning (8:00 AM - 12:00 PM)' :
                                                    'Evening (1:00 PM - 5:00 PM)'}</p>
                                        </div>
                                        <div>
                                            <span className="text-gray-600 text-sm">Booking Type:</span>
                                            <p className="font-medium capitalize">{bookingType}</p>
                                        </div>
                                    </div>

                                    {/* Selected Dates with Remove Option for Daily Bookings */}
                                    <div>
                                        <span className="text-gray-600 text-sm">Selected Dates:</span>
                                        <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2">
                                            {room.dates.map((date) => (
                                                <div key={date}
                                                    className="flex justify-between items-center bg-white p-3 rounded border border-gray-200">
                                                    <span className="text-sm">{formatDate(date)}</span>
                                                    {bookingType === 'daily' && (
                                                        <button
                                                            onClick={() => handleRemoveDate(room.id, date)}
                                                            className="text-red-500 hover:text-red-700 ml-2"
                                                            title="Remove date"
                                                        >
                                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                            </svg>
                                                        </button>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Price Breakdown */}
                        <div className="border-t border-gray-200 pt-6 mb-8">
                            <h2 className="text-xl font-semibold mb-4">Price Breakdown</h2>
                            <div className="space-y-3">
                                <div className="flex justify-between text-gray-600">
                                    <span>Subtotal</span>
                                    <span>${priceBreakdown.subtotal.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-gray-600">
                                    <span>Tax (3.5%)</span>
                                    <span>${priceBreakdown.tax.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm text-gray-600">
                                    <div>
                                        <span>Security Deposit</span>
                                        <div className="text-xs text-gray-500">($250 one-time, refundable)</div>
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

                        {/* Payment Details Section */}
                        <div className="border-t border-gray-200 pt-6 mb-8">
                            <h2 className="text-xl font-semibold mb-4">Payment Details</h2>
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
                        </div>

                        {/* Stripe Payment Button */}
                        <div className="mt-8 border-t border-gray-200 pt-6">
                            <button
                                onClick={() => router.push('/booking/payment')}
                                className="w-full flex items-center justify-center py-4 px-6 rounded-lg text-white font-medium bg-[#635BFF] hover:bg-[#4B45C6] transition-colors duration-200"
                            >
                                <svg className="w-8 h-8 mr-3" viewBox="0 0 60 25" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M60 12.5c0-6.904-5.596-12.5-12.5-12.5h-35C5.596 0 0 5.596 0 12.5S5.596 25 12.5 25h35C54.404 25 60 19.404 60 12.5z" fill="#fff" />
                                    <path d="M59.5 12.5c0-6.628-5.372-12-12-12h-35c-6.628 0-12 5.372-12 12s5.372 12 12 12h35c6.628 0 12-5.372 12-12z" stroke="#E0E0E0" />
                                </svg>
                                <span className="text-lg">Pay securely with Stripe</span>
                                <span className="ml-2 font-bold">${priceBreakdown.total.toFixed(2)}</span>
                            </button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default SummaryPage; 