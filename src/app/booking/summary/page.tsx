'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

interface Room {
    id: number;
    name: string;
    timeSlot: 'full' | 'morning' | 'evening';
    dates: string[];
}

interface PriceBreakdown {
    subtotal: number;
    tax: number;
    securityDeposit: number;
    total: number;
}

interface PaymentDetails {
    cardNumber: string;
    expiryDate: string;
    cvv: string;
    name: string;
}

const SummaryPage = () => {
    const router = useRouter();
    const [selectedRooms, setSelectedRooms] = useState<Room[]>([]);
    const [bookingType, setBookingType] = useState<'daily' | 'monthly'>('daily');
    const [paymentDetails, setPaymentDetails] = useState<PaymentDetails>({
        cardNumber: '',
        expiryDate: '',
        cvv: '',
        name: ''
    });
    const [isProcessing, setIsProcessing] = useState(false);
    const [priceBreakdown, setPriceBreakdown] = useState<PriceBreakdown>({
        subtotal: 0,
        tax: 0,
        securityDeposit: 0,
        total: 0
    });

    useEffect(() => {
        const storedRooms = localStorage.getItem('selectedRooms');
        const storedBookingType = localStorage.getItem('bookingType');

        if (!storedRooms || !storedBookingType) {
            toast.error('No booking details found');
            router.push('/booking');
            return;
        }

        try {
            const rooms = JSON.parse(storedRooms);
            setSelectedRooms(rooms);
            setBookingType(storedBookingType as 'daily' | 'monthly');
            calculateTotalPrice(rooms, storedBookingType as 'daily' | 'monthly');
        } catch (error) {
            toast.error('Invalid booking data');
            router.push('/booking');
        }
    }, [router]);

    const calculateTotalPrice = (rooms: Room[], type: 'daily' | 'monthly') => {
        let subtotal = 0;
        let securityDeposit = 0;

        rooms.forEach(room => {
            const numberOfDays = room.dates.length;
            if (numberOfDays === 0) return;

            const basePrice = type === 'daily'
                ? (room.timeSlot === 'full' ? 300 : 160)
                : (room.timeSlot === 'full' ? 2000 : 1200);

            if (type === 'daily') {
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

    const handleRemoveDate = (roomId: number, dateToRemove: string) => {
        const updatedRooms = selectedRooms.map(room => {
            if (room.id === roomId) {
                return {
                    ...room,
                    dates: room.dates.filter(date => date !== dateToRemove)
                };
            }
            return room;
        });

        // Remove room if no dates left
        const finalRooms = updatedRooms.filter(room => room.dates.length > 0);

        setSelectedRooms(finalRooms);
        calculateTotalPrice(finalRooms, bookingType);
        localStorage.setItem('selectedRooms', JSON.stringify(finalRooms));

        toast.success('Date removed successfully');
    };

    const formatDate = (dateStr: string, timeSlot: 'full' | 'morning' | 'evening') => {
        const date = new Date(dateStr);
        const formattedDate = date.toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            year: 'numeric'
        });

        const timeRange = timeSlot === 'full'
            ? '8:00 AM - 5:00 PM'
            : timeSlot === 'morning'
                ? '8:00 AM - 12:00 PM'
                : '1:00 PM - 5:00 PM';

        return `${formattedDate} (${timeSlot.charAt(0).toUpperCase() + timeSlot.slice(1)} - ${timeRange})`;
    };

    const handleProceedToPayment = () => {
        if (selectedRooms.length === 0) {
            toast.error('Please select at least one room with dates');
            router.push('/booking');
            return;
        }

        localStorage.setItem('selectedRooms', JSON.stringify(selectedRooms));
        router.push('/booking/payment');
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

        setPaymentDetails(prev => ({
            ...prev,
            [name]: formattedValue
        }));
    };

    const handleCompleteBooking = async () => {
        // Basic validation
        if (!paymentDetails.cardNumber || !paymentDetails.expiryDate || !paymentDetails.cvv || !paymentDetails.name) {
            toast.error('Please fill in all payment details');
            return;
        }

        setIsProcessing(true);
        try {
            // Here you would typically make an API call to your payment processor
            // For now, we'll simulate a successful payment
            await new Promise(resolve => setTimeout(resolve, 1500));
            toast.success('Booking completed successfully!');
            router.push('/booking/confirmation');
        } catch (error) {
            toast.error('Payment failed. Please try again.');
        } finally {
            setIsProcessing(false);
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
                        Back to Calendar
                    </button>

                    <div className="bg-white rounded-2xl shadow-xl p-8">
                        <h1 className="text-3xl font-bold text-gray-800 mb-8">Booking Summary</h1>

                        {selectedRooms.map((room) => (
                            <div key={room.id} className="mb-6 p-6 bg-gray-50 rounded-xl">
                                <h3 className="text-lg font-medium mb-4">{room.name}</h3>
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
                                        <p className="font-medium capitalize">{bookingType}</p>
                                    </div>
                                </div>

                                <div>
                                    <span className="text-gray-600">Selected Dates:</span>
                                    <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2">
                                        {(room.dates || []).map((date) => (
                                            <div key={date} className="flex justify-between items-center bg-white p-3 rounded border border-gray-200">
                                                <span className="text-sm">{formatDate(date, room.timeSlot)}</span>
                                                <button
                                                    onClick={() => handleRemoveDate(room.id, date)}
                                                    className="text-red-500 hover:text-red-700 ml-2 flex-shrink-0"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}

                        <div className="mt-8">
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
                                <div className="flex justify-between text-gray-600">
                                    <div>
                                        <span>Security Deposit</span>
                                        <div className="text-xs">($250 per room, refundable)</div>
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

                        {/* New Payment Details Section */}
                        <div className="mt-8 border-t border-gray-200 pt-8">
                            <h2 className="text-xl font-semibold mb-6">Payment Details</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Cardholder Name
                                    </label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={paymentDetails.name}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="John Doe"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Card Number
                                    </label>
                                    <input
                                        type="text"
                                        name="cardNumber"
                                        value={paymentDetails.cardNumber}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="1234 5678 9012 3456"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Expiry Date
                                    </label>
                                    <input
                                        type="text"
                                        name="expiryDate"
                                        value={paymentDetails.expiryDate}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="MM/YY"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        CVV
                                    </label>
                                    <input
                                        type="text"
                                        name="cvv"
                                        value={paymentDetails.cvv}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="123"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 flex justify-end">
                            <button
                                onClick={handleCompleteBooking}
                                disabled={isProcessing}
                                className={`${isProcessing
                                    ? 'bg-gray-400 cursor-not-allowed'
                                    : 'bg-blue-600 hover:bg-blue-700'
                                    } text-white px-8 py-3 rounded-lg transition-colors duration-200 flex items-center`}
                            >
                                {isProcessing ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Processing...
                                    </>
                                ) : (
                                    'Complete Booking'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SummaryPage; 