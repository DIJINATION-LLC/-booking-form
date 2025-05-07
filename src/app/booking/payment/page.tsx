'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { loadStripe } from '@stripe/stripe-js';
import {
    Elements,
    PaymentElement,
    useStripe,
    useElements,
    CardElement
} from '@stripe/react-stripe-js';
import toast from 'react-hot-toast';

// Initialize Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface PriceBreakdown {
    subtotal: number;
    tax: number;
    securityDeposit: number;
    total: number;
}

const PaymentForm = () => {
    const stripe = useStripe();
    const elements = useElements();
    const router = useRouter();
    const [error, setError] = useState<string | null>(null);
    const [processing, setProcessing] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<'card' | 'stripe'>('card');
    const [cardDetails, setCardDetails] = useState({
        cardNumber: '',
        expiryDate: '',
        cvv: ''
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
        setCardDetails(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setProcessing(true);
        setError(null);

        try {
            if (paymentMethod === 'stripe') {
                if (!stripe || !elements) {
                    toast.error('Payment processing is not ready');
                    return;
                }

                // Create payment intent for Stripe
                const response = await fetch('/api/create-payment-intent', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        amount: priceBreakdown.total,
                    }),
                });

                if (!response.ok) {
                    throw new Error('Failed to create payment intent');
                }

                const { clientSecret } = await response.json();
                toast.loading('Processing payment...', { id: 'payment' });

                const { error: paymentError } = await stripe.confirmPayment({
                    elements,
                    clientSecret,
                    confirmParams: {
                        return_url: `${window.location.origin}/booking/confirmation`,
                    },
                });

                if (paymentError) {
                    toast.error(paymentError.message || 'Payment failed', { id: 'payment' });
                    setError(paymentError.message || 'Payment failed');
                }
            } else {
                // Handle direct card payment
                // This is a mock implementation - replace with your actual card processing logic
                toast.loading('Processing card payment...', { id: 'payment' });
                await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate processing
                toast.success('Payment successful!', { id: 'payment' });
                router.push('/booking/confirmation');
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Payment failed';
            toast.error(errorMessage, { id: 'payment' });
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
                        <div className="mb-8 p-6 bg-gray-50 rounded-xl">
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

                        {/* Payment Method Selection */}
                        <div className="mb-8">
                            <h2 className="text-xl font-semibold mb-4">Select Payment Method</h2>
                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    onClick={() => setPaymentMethod('card')}
                                    className={`p-4 rounded-lg border-2 ${paymentMethod === 'card'
                                            ? 'border-blue-500 bg-blue-50'
                                            : 'border-gray-200 hover:border-blue-300'
                                        }`}
                                >
                                    <div className="flex items-center space-x-2">
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                        </svg>
                                        <span>Credit Card</span>
                                    </div>
                                </button>
                                <button
                                    onClick={() => setPaymentMethod('stripe')}
                                    className={`p-4 rounded-lg border-2 ${paymentMethod === 'stripe'
                                            ? 'border-blue-500 bg-blue-50'
                                            : 'border-gray-200 hover:border-blue-300'
                                        }`}
                                >
                                    <div className="flex items-center space-x-2">
                                        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.591-7.305z" />
                                        </svg>
                                        <span>Stripe</span>
                                    </div>
                                </button>
                            </div>
                        </div>

                        {/* Payment Form */}
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {paymentMethod === 'card' ? (
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Card Number
                                        </label>
                                        <input
                                            type="text"
                                            name="cardNumber"
                                            placeholder="1234 5678 9012 3456"
                                            value={cardDetails.cardNumber}
                                            onChange={handleCardDetailsChange}
                                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                            maxLength={19}
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Expiry Date
                                            </label>
                                            <input
                                                type="text"
                                                name="expiryDate"
                                                placeholder="MM/YY"
                                                value={cardDetails.expiryDate}
                                                onChange={handleCardDetailsChange}
                                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                                maxLength={5}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                CVV
                                            </label>
                                            <input
                                                type="text"
                                                name="cvv"
                                                placeholder="123"
                                                value={cardDetails.cvv}
                                                onChange={handleCardDetailsChange}
                                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                                maxLength={4}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <PaymentElement />
                            )}

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

export default function PaymentPage() {
    const [clientSecret, setClientSecret] = useState<string | null>(null);
    const router = useRouter();

    useEffect(() => {
        const fetchClientSecret = async () => {
            try {
                const storedRooms = localStorage.getItem('selectedRooms');
                if (!storedRooms) {
                    toast.error('No booking details found');
                    router.push('/booking');
                    return;
                }

                const rooms = JSON.parse(storedRooms);
                const total = calculateTotal(rooms);

                const response = await fetch('/api/create-payment-intent', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        amount: total,
                    }),
                });

                if (!response.ok) {
                    throw new Error('Failed to create payment intent');
                }

                const data = await response.json();
                setClientSecret(data.clientSecret);
            } catch (err) {
                toast.error('Failed to initialize payment');
                router.push('/booking');
            }
        };

        fetchClientSecret();
    }, [router]);

    const calculateTotal = (rooms: any[]): number => {
        let subtotal = 0;
        let securityDeposit = 0;
        const bookingType = localStorage.getItem('bookingType') as 'daily' | 'monthly';

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

    if (!clientSecret) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <Elements stripe={stripePromise} options={{ clientSecret }}>
            <PaymentForm />
        </Elements>
    );
} 